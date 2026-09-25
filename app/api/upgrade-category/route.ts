import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, newPaketId, isManual } = body;

    if (!id || !newPaketId) {
      return NextResponse.json(
        { error: "Missing ID or newPaketId parameter" },
        { status: 400 },
      );
    }

    const participantRef = dbAdmin.collection("offline_participants").doc(id);
    const participantSnap = await participantRef.get();

    if (!participantSnap.exists) {
      return NextResponse.json(
        { error: "Data peserta tidak ditemukan di sistem" },
        { status: 404 },
      );
    }

    const participantData = participantSnap.data()!;
    if (participantData.statusPembayaran !== "Lunas") {
        return NextResponse.json(
            { error: "Peserta belum lunas. Selesaikan pembayaran utama terlebih dahulu." },
            { status: 400 },
          );
    }

    // 1. Ambil Pengaturan dari Admin Panel (Firebase)
    const sRef = dbAdmin.collection("settings").doc("virtual_run");
    const sSnap = await sRef.get();

    if (!sSnap.exists) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 },
      );
    }

    const settings = sSnap.data()!;
    const packages = settings.offlinePackages || [];

    // Validasi paket lama vs baru
    const currentPaketId = participantData.paketId;
    const oldPaket = packages.find((p: any) => p.id === currentPaketId);
    const newPaket = packages.find((p: any) => p.id === newPaketId);

    if (!oldPaket || !newPaket) {
        return NextResponse.json(
            { error: "Paket lama atau baru tidak valid." },
            { status: 400 },
          );
    }

    // Hitung selisih
    // Pakai harga awal (bukan early bird jika tidak relevan, tapi lebih aman gunakan selisih harga saat ini)
    const currentPrice = Number(oldPaket.harga) || 0;
    const newPrice = Number(newPaket.harga) || 0;
    
    // Namun, idealnya kita cek harga dari participantData.hargaAsli
    // Jika peserta dapat diskon early bird/promo, harga aslinya lebih murah. 
    // Upgrade berarti mereka harus bayar selisih dari HARGA ASLI BARU (tanpa diskon) dengan apa yang sudah mereka bayar.
    const selisih = newPrice - Number(participantData.hargaAsli || currentPrice);

    if (selisih <= 0) {
        return NextResponse.json(
            { error: "Hanya bisa upgrade ke kategori dengan harga lebih tinggi." },
            { status: 400 },
          );
    }

    const orderId = `UPG-${id}-${Date.now()}`;

    // Simpan request ke database (biar webhook tau data apa yang mau diubah)
    await participantRef.update({
        upgradeRequest: {
            orderId: orderId,
            newPaketId: newPaket.id,
            newKategori: newPaket.jarak,
            newPaketNama: newPaket.nama,
            selisih: selisih,
            status: "Pending"
        }
    });

    if (isManual || body.initOnly) {
         // Jika initOnly atau manual, kembalikan saja info selisih
         return NextResponse.json({ token: null, selisih, orderId }, { status: 200 });
    }

    // MIDTRANS LOGIC
    let serverKey = settings.midtransServerKey;
    const secretsSnap = await dbAdmin.collection("secrets").doc("virtual_run").get();
    if (secretsSnap.exists && secretsSnap.data()?.midtransServerKey) {
      serverKey = String(secretsSnap.data()!.midtransServerKey);
    }

    if (!serverKey) {
      return NextResponse.json(
        { error: "Server key is missing in Admin Panel" },
        { status: 500 },
      );
    }

    // 2. AUTO-DETECT ENVIRONMENT
    const isSandbox = serverKey.startsWith("SB-");
    const midtransUrl = isSandbox
      ? "https://app.sandbox.midtrans.com/snap/v1/transactions"
      : "https://app.midtrans.com/snap/v1/transactions";


    // 4. Susun Payload Midtrans
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(selisih),
      },
      customer_details: {
        first_name: participantData.namaLengkap,
        email: participantData.email,
        phone: participantData.noWA,
      },
      item_details: [
        {
          id: `UPG-${newPaketId}`,
          price: Math.round(selisih),
          quantity: 1,
          name: `Upgrade Kategori ke ${newPaket.nama}`,
        }
      ]
    };

    // 5. Enkripsi Server Key ke Base64
    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    // 6. Tembak API Midtrans
    const response = await fetch(midtransUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("[Midtrans API Error]", responseData);
      return NextResponse.json(
        { error: responseData.error_messages?.[0] || "Gagal mendapatkan token" },
        { status: response.status },
      );
    }

    return NextResponse.json(
      { token: responseData.token, selisih, orderId },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("[Upgrade API Error]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
