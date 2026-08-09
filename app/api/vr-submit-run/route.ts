import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email, participantId, nama, km, durasi, tanggalLari, imgUrl } = await request.json();

    if (!email || !participantId || !km || !durasi || !tanggalLari || !imgUrl) {
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

    // 2. Simpan Bukti Lari (Paksa status menjadi Pending)
    await dbAdmin.collection("vr_submissions").add({
      participantId: participantId,
      nama: nama || participantData?.nama || "Pelari",
      jarakKm: Number(km),
      durasi: durasi,
      tanggalLari: tanggalLari,
      imgUrl: imgUrl,
      status: "Pending", // 🔒 DIKUNCI DI BACKEND
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: "Bukti lari berhasil diunggah" }, { status: 200 });
  } catch (error: any) {
    console.error("API Error (vr-submit-run):", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
