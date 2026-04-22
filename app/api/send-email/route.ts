import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, email, nama, detail } = body;

    const currentYear = new Date().getFullYear();
    const officialEmail = "ika.diy@uii.ac.id"; // Sesuai screenshot alias Gmail kamu

    // 1. Konfigurasi Transporter (Login pakai Akun Utama)
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER, // 236102601@uii.ac.id
        pass: process.env.EMAIL_PASS, // atwrqwjhlifaperl
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://ikadiy.uii.ac.id";

    // 2. Template Generator dengan Pembeda Tema
    const generateHtml = (content: string, isVirtual: boolean = false) => {
      // Offline: Navy & Gold | Virtual: Blue & White
      const primaryColor = isVirtual ? "#2563eb" : "#152B5B";
      const accentColor = isVirtual ? "#ffffff" : "#D4AF37";
      const eventName = isVirtual
        ? `VIRTUAL RUN ${currentYear}`
        : `OFFLINE RUN ${currentYear}`;

      return `
        <!DOCTYPE html>
        <html>
        <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: 'Segoe UI', sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="background-color: ${primaryColor}; padding: 30px 20px; text-align: center; border-bottom: 5px solid ${accentColor};">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 900; letter-spacing: 1px;">IKA UII DIY</h1>
              <p style="color: ${accentColor}; margin: 5px 0 0 0; font-size: 14px; font-weight: bold; letter-spacing: 2px;">${eventName}</p>
            </div>

            <div style="padding: 40px 30px; color: #334155; line-height: 1.7; font-size: 15px;">
              ${content}
            </div>

            <div style="background-color: #f8fafc; padding: 30px; border-top: 1px solid #e2e8f0; font-size: 13px;">
              <h4 style="margin: 0 0 10px 0; color: ${primaryColor}; font-weight: 800;">HUBUNGI PANITIA:</h4>
              <p style="margin: 4px 0;">📧 <a href="mailto:${officialEmail}" style="color: #1A73E8; text-decoration: none;">${officialEmail}</a></p>
              <p style="margin: 4px 0;">📸 <a href="https://instagram.com/ikauii.diy" style="color: #1A73E8; text-decoration: none;">@ikauii.diy</a></p>
              <p style="text-align: center; margin: 25px 0 0 0; font-size: 11px; color: #94a3b8;">&copy; ${currentYear} DPW IKA UII DIY.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    };

    let subject = "";
    let htmlContent = "";
    const displayTagihan = detail?.totalTagihan
      ? Number(detail.totalTagihan).toLocaleString("id-ID")
      : "0";
    const pId = detail?.id || "";

    // 3. Logika Switch Case (Offline vs Virtual)
    switch (type) {
      // --- KELOMPOK OFFLINE RUN ---
      case "offline_registration":
        subject = `[OFFLINE RUN] Instruksi Pembayaran - ${nama}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #0f172a; margin-top: 0;">Halo, ${nama}! 👋</h2>
          <p>Terima kasih telah mendaftar di <strong>Offline Run IKA UII DIY ${currentYear}</strong>.</p>
          <p>Segera lakukan pembayaran untuk mengamankan slot lari Anda:</p>
          <div style="background-color: #FFF9E6; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #FFE58F; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #856404; font-weight: bold; text-transform: uppercase;">Total Tagihan:</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; color: #152B5B; font-weight: 900;">Rp ${displayTagihan}</p>
          </div>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${baseUrl}/run/checkout/${pId}" style="background-color: #152B5B; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Selesaikan Pembayaran</a>
          </div>
        `,
          false,
        );
        break;

      case "payment_success_offline":
        subject = `E-Ticket Offline Run IKA UII DIY ${currentYear}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0;">Pembayaran Berhasil! 🎉</h2>
          <p>Halo <strong>${nama}</strong>, status pendaftaran Anda kini <strong>LUNAS</strong>.</p>
          <p>Sampai jumpa di lokasi acara! Harap simpan E-Ticket Anda untuk pengambilan Racepack.</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${baseUrl}/run/checkout/${pId}" style="background-color: #1E8E3E; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 900; font-size: 16px; display: inline-block;">LIHAT E-TICKET (QR CODE)</a>
          </div>
        `,
          false,
        );
        break;
      // --- KELOMPOK CREW / VOLUNTEER ---
      case "crew_accepted":
        subject = `🎉 [DITERIMA] - Volunteer Tim Inti IKA UII DIY RUN`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; text-align: center;">SELAMAT BERGABUNG! 🤝</h2>
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Selamat! Kamu telah terpilih menjadi bagian dari kepanitiaan <strong>IKA UII RUN ${currentYear}</strong> untuk posisi/divisi: <strong>${detail?.divisi}</strong>.</p>
          <div style="background-color: #E6F4EA; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #CEEAD6;">
            <p style="margin: 0; font-size: 13px; color: #137333;">Silakan bergabung ke dalam Grup WhatsApp Koordinasi Tim Inti melalui tautan di bawah ini:</p>
            <p style="margin: 10px 0 0 0; text-align: center;">
              <a href="${detail?.linkGrupWa || "#"}" target="_blank" style="background-color: #25D366; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Masuk Grup WhatsApp</a>
            </p>
          </div>
          <p style="font-size: 13px; color: #64748B;">*Jika link tidak bisa diklik, salin teks berikut: ${detail?.linkGrupWa || "Belum ada link"}</p>
        `,
          false, // False = Pakai warna Offline Run (Navy/Gold)
        );
        break;

      // --- KELOMPOK VIRTUAL RUN ---
      case "registration":
        subject = `[VIRTUAL RUN] Tagihan Pembayaran - ${nama}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #0f172a; margin-top: 0;">Halo Pelari, ${nama}! 🏃‍♂️</h2>
          <p>Pendaftaran <strong>Virtual Run ${currentYear}</strong> Anda telah berhasil.</p>
          <div style="background-color: #ebf5ff; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #bfdbfe; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #1e40af; font-weight: bold; text-transform: uppercase;">Total Tagihan:</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; color: #2563eb; font-weight: 900;">Rp ${displayTagihan}</p>
          </div>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${baseUrl}/virtual-run/dashboard" style="background-color: #2563eb; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Dashboard Pelari</a>
          </div>
        `,
          true,
        );
        break;

      case "finisher":
        subject = `🏅 Selamat Finisher! - IKA UII Virtual Run ${currentYear}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #0f172a; margin-top: 0; text-align: center;">MISSION ACCOMPLISHED! 🏆</h2>
          <p>Luar biasa <strong>${nama}</strong>! Anda telah menuntaskan target lari Anda.</p>
          <p>E-Sertifikat Anda sudah dapat diunduh melalui link di bawah ini:</p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${baseUrl}/virtual-run/dashboard" style="background-color: #f59e0b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 16px; display: inline-block;">Ambil Sertifikat</a>
          </div>
        `,
          true,
        );
        break;

      case "admin_notif_payment":
        subject = `⚠️ [ADMIN] Verifikasi Pembayaran: ${nama}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #D93025; margin-top: 0;">Bukti Bayar Masuk</h2>
          <p>Peserta <strong>${nama}</strong> telah mengirim bukti transfer untuk <strong>${detail?.type || "Event"}</strong>.</p>
          <p>Segera lakukan validasi di Panel Admin agar peserta mendapatkan E-Ticket.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${baseUrl}/admin-vr/offline" style="background-color: #334155; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 14px; display: inline-block;">Buka Panel Admin</a>
          </div>
        `,
          false,
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 },
        );
    }

    // 4. Eksekusi Kirim (Memaksa identitas alias)
    await transporter.sendMail({
      from: `"IKA UII DIY" <${officialEmail}>`,
      to: email,
      replyTo: officialEmail,
      sender: officialEmail, // Memberitahu Gmail ini adalah alias
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error: any) {
    console.error("Critical Mail Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
