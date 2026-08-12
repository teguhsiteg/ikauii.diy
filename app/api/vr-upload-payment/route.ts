import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email, participantId, imgUrl } = await request.json();

    if (!email || !participantId || !imgUrl) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // 1. Verifikasi kepemilikan data (Anti-Manipulasi)
    const participantRef = dbAdmin.collection("vr_participants").doc(participantId);
    const participantSnap = await participantRef.get();

    if (!participantSnap.exists) {
      return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    const participantData = participantSnap.data();
    if (participantData?.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized: Email tidak cocok" }, { status: 403 });
    }

    // 2. Lakukan Update (Paksa status menjadi Pending)
    await participantRef.update({
      buktiBayarUrl: imgUrl,
      statusPembayaran: "Pending", // 🔒 DIKUNCI DI BACKEND
    });

    return NextResponse.json({ success: true, message: "Bukti bayar berhasil diunggah" }, { status: 200 });
  } catch (error: any) {
    console.error("API Error (vr-upload-payment):", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
