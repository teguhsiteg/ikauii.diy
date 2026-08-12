import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 🔥 BARU: Kita tangkap eventType dari Frontend ("offline" atau "virtual")
    // Jika tidak dikirim dari frontend, default-nya adalah "virtual"
    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      eventType = "virtual",
    } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID wajib diisi" },
        { status: 400 },
      );
    }

    // 🔒 AMBIL HARGA ASLI DARI DATABASE (Anti-Manipulasi)
    const firebaseDocId = orderId.split("-")[0];
    const collectionName =
      eventType === "offline" ? "offline_participants" : "vr_participants";
    const participantRef = dbAdmin.collection(collectionName).doc(firebaseDocId);
    const participantSnap = await participantRef.get();

    if (!participantSnap.exists) {
      return NextResponse.json(
        { error: "Data peserta tidak ditemukan" },
        { status: 404 },
      );
    }

    const participantData = participantSnap.data();
    const actualAmount = participantData.totalTagihan;

    if (!actualAmount || actualAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal tagihan tidak valid" },
        { status: 400 },
      );
    }

    // 1. Ambil Server Key & Pengaturan dari Firebase
    const settingsRef = dbAdmin.collection("settings").doc("virtual_run");
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      return NextResponse.json(
        { error: "Pengaturan sistem tidak ditemukan" },
        { status: 500 },
      );
    }

    const settings = settingsSnap.data();
    const serverKey = settings.midtransServerKey?.trim();
    const isProduction = settings.isProduction;

    if (!serverKey) {
      return NextResponse.json(
        { error: "Server Key Midtrans belum di-setting di Admin" },
        { status: 500 },
      );
    }

    // 2. Tentukan URL API Midtrans (Live atau Sandbox)
    const apiUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    // 3. Susun Payload untuk Midtrans
    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(Number(actualAmount)),
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
    };

    // 4. Ubah Server Key jadi Base64
    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    // 5. Tembak ke API Midtrans
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // 6. SIMPAN TOKEN KE FIREBASE DAN KEMBALIKAN KE FRONT-END
    if (response.ok) {
      // Ekstrak ID asli Firebase (Buang angka timestamp di belakang '-')
      const firebaseDocId = orderId.split("-")[0];

      // 🔥 SMART ROUTING: Tentukan tabel tujuan berdasarkan eventType
      const collectionName =
        eventType === "offline" ? "offline_participants" : "vr_participants";

      // Simpan token ke data peserta di tabel yang benar
      await dbAdmin.collection(collectionName).doc(firebaseDocId).update({
        snapToken: data.token,
      });

      return NextResponse.json({ token: data.token });
    } else {
      console.error("Midtrans Error Detail:", data);
      return NextResponse.json(
        { error: "Gagal mendapatkan token Midtrans", details: data },
        { status: response.status },
      );
    }
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Gagal memproses transaksi Midtrans" }, { status: 500 });
  }
}
