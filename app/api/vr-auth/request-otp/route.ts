import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Cek apakah email terdaftar di vr_participants
    const participantsRef = dbAdmin.collection("vr_participants");
    const snapshot = await participantsRef
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Email tidak terdaftar" },
        { status: 404 }
      );
    }

    const participantData = snapshot.docs[0].data();

    // 2. Buat kode OTP 6 digit
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // 3. Simpan OTP ke Firestore (koleksi vr_otps) menggunakan email sebagai ID dokumen
    await dbAdmin.collection("vr_otps").doc(normalizedEmail).set({
      code: otpCode,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    });

    // 4. Kirim email OTP
    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const baseUrl = `${protocol}://${host}`;
    // Jangan nge-block eksekusi terlalu lama, biarkan asinkron jika mau, tapi lebih aman ditunggu
    const emailRes = await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify({
        type: "otp_login",
        email: normalizedEmail,
        nama: participantData.nama || "Peserta",
        detail: {
          eventName: "Virtual Run IKA UII DIY",
          otpCode: otpCode,
        },
      }),
    });

    if (!emailRes.ok) {
      console.error("Gagal mengirim email OTP", await emailRes.text());
      return NextResponse.json(
        { error: "Gagal mengirim email OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "OTP berhasil dikirim" });
  } catch (error: any) {
    console.error("Request OTP error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
