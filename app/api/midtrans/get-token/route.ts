import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, nama, email, noWA, totalTagihan, type } = body;

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
    const serverKey = settings.midtransServerKey; // Diambil dari form Admin-mu!

    if (!serverKey) {
      return NextResponse.json(
        { error: "Server key is missing in Admin Panel" },
        { status: 500 },
      );
    }

    // 2. AUTO-DETECT ENVIRONMENT (Super Pintar 🧠)
    // Cek apakah awalan Server Key-nya "SB-" (Sandbox) atau Live
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
        gross_amount: Math.round(Number(totalTagihan)),
      },
      customer_details: {
        first_name: nama,
        email: email,
        phone: noWA,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
