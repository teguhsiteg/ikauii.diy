import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 400 },
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    // Verifikasi Token ke Server Google
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const googleResponse = await fetch(verifyUrl, {
      method: "POST",
    });

    const googleData = await googleResponse.json();

    // Google mengembalikan skor dari 0.0 (Bot) hingga 1.0 (Manusia)
    if (googleData.success && googleData.score >= 0.5) {
      // Skor 0.5 ke atas dianggap wajar/manusia
      return NextResponse.json({ success: true, score: googleData.score });
    } else {
      // Jika skor terlalu rendah, tolak
      return NextResponse.json(
        {
          success: false,
          message:
            "Verifikasi keamanan gagal. Sistem mendeteksi aktivitas mencurigakan.",
          score: googleData.score,
        },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error("reCAPTCHA Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server" },
      { status: 500 },
    );
  }
}
