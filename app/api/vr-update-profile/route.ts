import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email, participantId, motto, fotoProfilUrl, fotoHeaderUrl } = await request.json();

    if (!email || !participantId) {
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

    // 2. Update Profil
    await participantRef.update({
      motto: motto || "",
      fotoProfilUrl: fotoProfilUrl || "",
      fotoHeaderUrl: fotoHeaderUrl || "",
    });

    return NextResponse.json({ success: true, message: "Profil berhasil diperbarui" }, { status: 200 });
  } catch (error: any) {
    console.error("API Error (vr-update-profile):", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal" }, { status: 500 });
  }
}
