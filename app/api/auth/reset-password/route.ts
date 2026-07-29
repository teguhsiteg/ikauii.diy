import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/firebase-admin";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email wajib diisi" }, { status: 400 });
    }

    // 🔥 PENTING: Hilangkan spasi & pastikan huruf kecil semua
    const cleanEmail = email.trim().toLowerCase();

    // Ambil data pengguna dari Firebase untuk mendapatkan namanya
    const userRecord = await authAdmin.getUserByEmail(cleanEmail);
    // Jika displayName kosong di Firebase, gunakan fallback "Pengguna E-Office"
    const userName = userRecord.displayName || "Pengguna E-Office";

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://ikadiy.uii.ac.id";

    // 1. Minta link ke Firebase
    const rawFirebaseLink =
      await authAdmin.generatePasswordResetLink(cleanEmail);

    // =========================================================================
    // 🕵️‍♂️ TRIK SULTAN: BONGKAR LINK FIREBASE DAN BUAT DIRECT LINK KE WEB KITA
    // =========================================================================
    const urlObj = new URL(rawFirebaseLink);
    const oobCode = urlObj.searchParams.get("oobCode"); // Ambil kode rahasianya saja

    // Rakit URL murni milik kita sendiri!
    const directResetLink = `${baseUrl}/reset-password?oobCode=${oobCode}`;
    // =========================================================================

    // 2. Setup Nodemailer
    const officialEmail = "ika.diy@uii.ac.id";
    const currentYear = new Date().getFullYear();
    const logoUrl = "https://ikadiy.uii.ac.id/logo-dpp-ika.png";

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 3. Desain Email Elegan dengan Salam dan Nama
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
      </head>
      <body style="margin: 0; padding: 40px 20px; background-color: #F8F9FA; font-family: 'Roboto', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #DADCE0; border-radius: 8px; overflow: hidden;">
          
          <div style="padding: 30px 24px; text-align: center; border-bottom: 3px solid #D93025; background-color: #FFFFFF;">
            <img src="${logoUrl}" alt="DPW IKA UII DIY" style="height: 50px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" />
            <p style="margin: 0; font-size: 11px; font-weight: 700; color: #5F6368; letter-spacing: 1.5px; text-transform: uppercase;">
              KEAMANAN SISTEM E-OFFICE
            </p>
          </div>

          <div style="padding: 40px 30px; color: #202124; line-height: 1.6; font-size: 15px;">
            <h2 style="color: #202124; margin-top: 0; margin-bottom: 25px; font-size: 20px; font-weight: 500;">Permintaan Atur Ulang Kata Sandi</h2>
            
            <p style="margin-top: 0;"><em>Assalamu'alaikum Warahmatullahi Wabarakatuh,</em></p>
            <p>Halo <strong>${userName}</strong>,</p>
            
            <p>Sistem kami menerima permintaan untuk mengatur ulang kata sandi (<em>reset password</em>) akun E-Office Anda yang tertaut dengan email <strong>${cleanEmail}</strong>.</p>
            <p>Silakan klik tombol di bawah ini untuk membuat kata sandi baru Anda. Tautan ini bersifat rahasia dan hanya dapat digunakan satu kali.</p>
            
            <div style="margin: 35px 0; text-align: center;">
              <a href="${directResetLink}" style="background-color: #1A73E8; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Buat Kata Sandi Baru</a>
            </div>
            
            <p style="font-size: 13px; color: #5F6368;">Jika Anda tidak pernah meminta penyetelan ulang kata sandi ini, abaikan email ini. Akun Anda akan tetap aman.</p>
            <br>
            <p style="margin-bottom: 0;"><em>Wassalamu'alaikum Warahmatullahi Wabarakatuh,</em></p>
          </div>

          <div style="background-color: #F8F9FA; padding: 25px 30px; border-top: 1px solid #DADCE0; text-align: center;">
            <p style="margin: 0; font-size: 11px; color: #5F6368; line-height: 1.6;">
              <strong>E-Office DPW IKA UII</strong><br>
              Daerah Istimewa Yogyakarta<br>
              &copy; ${currentYear} Hak Cipta Dilindungi.
            </p>
          </div>

        </div>
      </body>
      </html>
    `;

    // 4. Kirim Email via SMTP
    await transporter.sendMail({
      from: `"Keamanan IKA UII DIY" <${officialEmail}>`,
      to: cleanEmail,
      subject: "Atur Ulang Kata Sandi - E-Office IKA UII DIY",
      html: htmlContent,
    });

    return NextResponse.json(
      { message: "Email reset terkirim" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("❌ Reset Password Error:", error);

    // Kalau beneran emailnya ga ada di Auth
    if (error.code === "auth/user-not-found") {
      return NextResponse.json(
        { error: "Email tidak ditemukan di sistem Authentication." },
        { status: 404 },
      );
    }

    // Kalau Nodemailer / SMTP-nya yang bermasalah (Password email salah / diblokir Google)
    if (
      error.message &&
      (error.message.includes("EAUTH") ||
        error.message.includes("EENVELOPE") ||
        error.code === "EAUTH")
    ) {
      return NextResponse.json(
        { error: "Gagal mengirim email. Cek konfigurasi SMTP / Nodemailer." },
        { status: 500 },
      );
    }

    // Kalau private key Firebase Admin salah
    if (error.message && error.message.includes("credential")) {
      return NextResponse.json(
        { error: "Konfigurasi Firebase Admin tidak valid di server." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: error.message || "Gagal memproses permintaan." },
      { status: 500 },
    );
  }
}
