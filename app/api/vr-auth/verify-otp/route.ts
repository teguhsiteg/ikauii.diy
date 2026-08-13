import { NextResponse } from "next/server";
import { dbAdmin, authAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { error: "Email dan Kode OTP wajib diisi" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Ambil data OTP dari Firestore
    const otpRef = dbAdmin.collection("vr_otps").doc(normalizedEmail);
    const otpDoc = await otpRef.get();

    if (!otpDoc.exists) {
      return NextResponse.json(
        { error: "Kode OTP tidak valid atau sudah kedaluwarsa" },
        { status: 400 }
      );
    }

    const otpData = otpDoc.data();

    // 2. Cek kecocokan kode
    if (otpData?.code !== code.trim()) {
      return NextResponse.json(
        { error: "Kode OTP salah" },
        { status: 400 }
      );
    }

    // 3. Cek kedaluwarsa
    const expiresAt = new Date(otpData?.expiresAt);
    if (expiresAt.getTime() < Date.now()) {
      // Hapus OTP yang sudah expired
      await otpRef.delete();
      return NextResponse.json(
        { error: "Kode OTP sudah kedaluwarsa, silakan minta ulang" },
        { status: 400 }
      );
    }

    // 4. Sukses! Hapus OTP agar tidak bisa dipakai ulang
    await otpRef.delete();

    // 5. Buat Firebase Custom Token (menggunakan email sebagai UID)
    const customToken = await authAdmin.createCustomToken(normalizedEmail, {
      vr_participant: true // Custom claim untuk identifikasi peserta VR
    });

    return NextResponse.json({ 
      message: "Verifikasi berhasil",
      token: customToken 
    });
  } catch (error: any) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
