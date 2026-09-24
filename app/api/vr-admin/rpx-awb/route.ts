import { NextResponse } from "next/server";
import { dbAdmin, authAdmin } from "@/lib/firebase-admin";
import { getRpxConfig, getToken, sendShipmentData } from "@/lib/rpx";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let decodedToken;
    try {
      decodedToken = await authAdmin.verifyIdToken(token);
    } catch (e) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    // Verify Admin Role
    const userSnap = await dbAdmin.collection("users").doc(decodedToken.uid).get();
    const role = userSnap.data()?.role;
    if (role !== "admin" && role !== "super_admin" && role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Forbidden: Not an admin" }, { status: 403 });
    }

    const { participantId } = await request.json();
    if (!participantId) {
      return NextResponse.json({ success: false, error: "Participant ID is required" }, { status: 400 });
    }

    // 1. Get Participant Data
    const participantRef = dbAdmin.collection("vr_participants").doc(participantId);
    const participantSnap = await participantRef.get();
    
    if (!participantSnap.exists) {
      return NextResponse.json({ success: false, error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    const participantData = participantSnap.data() || {};

    if (participantData.statusPembayaran !== "Lunas") {
       return NextResponse.json({ success: false, error: "Peserta belum Lunas" }, { status: 400 });
    }

    if (participantData.resiPengiriman) {
       return NextResponse.json({ success: false, error: "Peserta ini sudah memiliki nomor resi" }, { status: 400 });
    }

    // 2. Get RPX Config
    const settings = await getRpxConfig();
    
    if (!settings.isActive || !settings.username || !settings.password || !settings.accountNumber) {
        return NextResponse.json({ success: false, error: "Pengaturan RPX belum lengkap atau tidak aktif" }, { status: 400 });
    }

    // 3. Prepare Payload untuk sendShipmentData
    const [firstName, ...lastNames] = (participantData.nama || "").split(" ");
    const lastName = lastNames.length > 0 ? lastNames.join(" ") : "-";

    const shipperPhone = "08123456789"; // Ganti dengan nomor telepon panitia asli
    const shipperEmail = "panitia@ikadiy.uii.ac.id"; // Ganti email panitia
    
    // Ini mengasumsikan kita punya field alamat, kecamatan, dsb
    const payload = {
        // Contoh payload standar RPX sendShipmentData
        // AWBs ini biasanya bisa dikosongkan untuk di-generate RPX, atau jika RPX mewajibkan awb harus request format tertentu.
        // Berdasarkan doc, "awb" kadang diisi jika punya list. 
        // Namun "sendShipmentData" RPX V3 biasanya membuatkan AWB.
        // Jika dokumentasi wajib memasukkan awb, RPX akan butuh alokasi awb terlebih dahulu.
        // Sesuai postman: "awb": "700024379265" -> jika ini wajib disupply, mungkin butuh API GetAWB dulu. 
        // Untuk amannya (berdasarkan kebiasaan API ekspedisi, kalau kita tidak define AWB, dia akan generate):
        
        // --- SHIPPER (PANITIA) ---
        "shipper_account": settings.accountNumber,
        "shipper_name": "Panitia IKA UII",
        "shipper_company": "IKA UII",
        "shipper_address1": "Kampus UII, Yogyakarta",
        "shipper_address2": "",
        "shipper_kelurahan": "Ngemplak",
        "shipper_kecamatan": "Sleman",
        "shipper_city": "Sleman",
        "shipper_state": "DI Yogyakarta",
        "shipper_zip": settings.originZip,
        "shipper_phone": shipperPhone,
        "shipper_mobile_no": shipperPhone,
        "shipper_email": shipperEmail,

        // --- CONSIGNEE (PESERTA) ---
        "consignee_account": "", // Optional
        "consignee_name": participantData.nama || "Peserta",
        "consignee_company": "",
        "consignee_address1": participantData.alamat || "Alamat tidak tersedia",
        "consignee_address2": "",
        "consignee_kelurahan": participantData.kecamatan || "",
        "consignee_kecamatan": participantData.kecamatan || "",
        "consignee_city": participantData.kotaKabupaten || "",
        "consignee_state": participantData.provinsi || "",
        "consignee_zip": participantData.kodePos || "",
        "consignee_phone": participantData.whatsapp || "080000000000",
        "consignee_mobile_no": participantData.whatsapp || "080000000000",
        "consignee_email": participantData.email || "",

        // --- PACKAGE INFO ---
        "desc_of_goods": "Racepack Virtual Run IKA UII",
        "tot_package": "1",
        "tot_weight": String(settings.defaultWeight),
        "tot_declare_value": "",
        "tot_dimensi": "",
        
        "service_type_id": settings.defaultService,
        "order_type": "MP", // Sesuai contoh postman
        "order_number": participantId, // Order Reference

        // Flags Standard
        "insurance": "N",
        "surcharge": "N",
        "high_value": "N",
        "electronic": "N",
        "flag_dangerous_goods": "N",
        "flag_birdnest": "N",
        "declare_value": "N",
        "high_docs": "N",
        "bill_trans_type_id": "1",
    };

    // 4. Hit API RPX V3
    const rpxToken = await getToken(settings.username, settings.password);
    const rpxResponse = await sendShipmentData(rpxToken, payload);

    // Ambil nomor AWB dari respon
    // Contoh sukses RPX: data: { awb: "7000xxxx" } atau data: [{ awb: "7000xxxx" }]
    let awbNumber = rpxResponse?.data?.awb || rpxResponse?.awb;
    if (!awbNumber && Array.isArray(rpxResponse?.data) && rpxResponse.data.length > 0) {
        awbNumber = rpxResponse.data[0].awb;
    }

    if (!awbNumber) {
        throw new Error("RPX mengembalikan sukses tapi tidak ada nomor AWB. " + JSON.stringify(rpxResponse));
    }

    // 5. Update Firestore
    await participantRef.update({
       resiPengiriman: awbNumber,
       kurir: "RPX",
       updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
        success: true, 
        message: "Resi berhasil dibuat",
        awb: awbNumber
    });

  } catch (error: any) {
    console.error("RPX AWB Generation Error:", error.message);
    return NextResponse.json({ success: false, error: error.message || "Gagal membuat resi RPX" }, { status: 500 });
  }
}
