import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // 🔥 FIX 1: Kita HAPUS 'totalTagihan' dari sini. Kita tidak butuh kiriman harga dari browser!
    const { id, nama, email, noWA, type } = body;

    if (!id || !type) {
      return NextResponse.json(
        { error: "Missing ID or Type parameter" },
        { status: 400 },
      );
    }

    // 🔥 FIX 2: AMBIL HARGA ASLI LANGSUNG DARI DATABASE (Anti-Manipulasi) 🔥
    // Asumsi: parameter 'type' isinya "offline" atau "virtual"
    const collectionName =
      type === "offline" ? "offline_participants" : "vr_participants";
    const participantRef = doc(db, collectionName, id);
    const participantSnap = await getDoc(participantRef);

    if (!participantSnap.exists()) {
      return NextResponse.json(
        { error: "Data peserta tidak ditemukan di sistem" },
        { status: 404 },
      );
    }

    const participantData = participantSnap.data();
    const actualTagihan = participantData.totalTagihan; // Ini harga asli yang tersimpan di server!

    if (!actualTagihan || actualTagihan <= 0) {
      return NextResponse.json(
        { error: "Nominal tagihan tidak valid" },
        { status: 400 },
      );
    }

    // 1. Ambil Pengaturan dari Admin Panel (Firebase)
    const sRef = doc(db, "settings", "virtual_run");
    const sSnap = await getDoc(sRef);

    if (!sSnap.exists()) {
      return NextResponse.json(
        { error: "Settings not found" },
        { status: 404 },
      );
    }

    const settings = sSnap.data();
    const serverKey = settings.midtransServerKey;

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

    // 3. Buat Order ID Unik
    const orderId = `${id}-${Date.now()}`;

    // 4. Susun Payload
    const payload = {
      transaction_details: {
        order_id: orderId,
        // 🔥 FIX 3: Gunakan 'actualTagihan' dari database, BUKAN dari request body
        gross_amount: Math.round(Number(actualTagihan)),
      },
      customer_details: {
        first_name: nama || participantData.namaLengkap,
        email: email || participantData.email,
        phone: noWA || participantData.noWA,
      },
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

    const data = await response.json();

    if (!response.ok) {
      console.error("[Midtrans Token Error]:", data);
      return NextResponse.json(
        { error: data.error_messages || "Gagal mendapatkan token" },
        { status: 400 },
      );
    }

    return NextResponse.json({ token: data.token });
  } catch (error: any) {
    console.error("[Internal Server Error]:", error);
    return NextResponse.json({ error: "Gagal mendapatkan token pembayaran" }, { status: 500 });
  }
}
