import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, email, nama, detail } = body;

    const currentYear = new Date().getFullYear();
    const officialEmail = "ika.diy@uii.ac.id";

    // 🔥 LOGO RESMI IKA UII DIY 🔥
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

    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "https://ikadiy.uii.ac.id";
    const saluranWaLink =
      "https://www.whatsapp.com/channel/0029Vb7WeSSFcow6V1mLa03P";

    // --- 1. TEMPLATE GENERATOR (GOOGLE WORKSPACE STYLE) ---
    const generateHtml = (
      content: string,
      customSubtitle: string = "PEMBERITAHUAN SISTEM",
    ) => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 40px 20px; background-color: #F8F9FA; font-family: 'Roboto', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          
          <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #DADCE0; border-radius: 8px; overflow: hidden;">
            
            <div style="padding: 30px 24px; text-align: center; border-bottom: 3px solid #1A73E8; background-color: #FFFFFF;">
              <img src="${logoUrl}" alt="DPW IKA UII DIY" style="height: 50px; margin-bottom: 15px; display: block; margin-left: auto; margin-right: auto;" />
              <p style="margin: 0; font-size: 11px; font-weight: 700; color: #5F6368; letter-spacing: 1.5px; text-transform: uppercase;">
                ${customSubtitle}
              </p>
            </div>

            <div style="padding: 40px 30px; color: #202124; line-height: 1.6; font-size: 15px;">
              ${content}
            </div>

            <div style="background-color: #F8F9FA; padding: 30px; border-top: 1px solid #DADCE0; text-align: center;">
              <p style="margin: 0 0 15px 0; color: #202124; font-size: 13px; font-weight: 500;">
                Terhubung Dengan Kami
              </p>
              
              <div style="margin-bottom: 25px;">
                <a href="mailto:${officialEmail}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/281/281769.png" alt="Email" style="width: 24px; height: 24px; opacity: 0.7;" />
                </a>
                <a href="https://instagram.com/ikauii.diy" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" alt="Instagram" style="width: 24px; height: 24px; opacity: 0.7;" />
                </a>
                <a href="https://youtube.com/@dpwikauiiyogyakarta" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" style="width: 24px; height: 24px; opacity: 0.7;" />
                </a>
                <a href="${saluranWaLink}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                  <img src="https://cdn-icons-png.flaticon.com/512/1384/1384055.png" alt="WhatsApp" style="width: 24px; height: 24px; opacity: 0.7;" />
                </a>
              </div>

              <p style="margin: 0; font-size: 11px; color: #5F6368; line-height: 1.6;">
                <strong>Gedung DPW IKA UII DIY</strong><br>
                Universitas Islam Indonesia, Yogyakarta<br>
                &copy; ${currentYear} Hak Cipta Dilindungi.
              </p>
            </div>

          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="font-size: 11px; color: #9AA0A6;">Email ini dibuat secara otomatis oleh sistem. Mohon untuk tidak membalas email ini secara langsung.</p>
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

    // --- 2. LOGIKA NOTIFIKASI ---
    switch (type) {
      // ========================================================
      // EMAIL NOTIFIKASI DIREKTORI BISNIS TAYANG
      // ========================================================
      case "directory_published":
        subject = `Publikasi Direktori Bisnis - ${detail?.namaBisnis || "Bisnis Alumni"}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Bisnis Anda Telah Tayang</h2>
          <p style="color: #5F6368;">Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Kami memberitahukan kabar gembira bahwa profil usaha/bisnis Anda dengan nama <strong>${detail?.namaBisnis || "Bisnis"}</strong> telah berhasil kami verifikasi dan resmi diterbitkan pada halaman <strong>Katalog Bisnis IKA UII DIY</strong>.</p>
          <p>Semoga dengan tergabungnya bisnis Anda di dalam direktori ini, relasi, promosi, dan potensi kerja sama antar alumni UII dapat semakin terbuka lebar.</p>
          
          <div style="margin: 35px 0;">
            <a href="${baseUrl}/direktori-bisnis" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Lihat Katalog Bisnis</a>
          </div>
          
          <p>Wassalamu'alaikum Warahmatullahi Wabarakatuh.</p>
        `,
          "DIREKTORI BISNIS IKA UII DIY",
        );
        break;

      // ========================================================
      // EMAIL: KEPANITIAAN (CREW) - DITERIMA
      // ========================================================
      case "crew_accepted":
        subject = `Informasi Kelulusan Seleksi Kepanitiaan - ${detail?.event || "IKA UII DIY"}`;

        let waButtons = "";

        if (detail?.linkGrupBesar || detail?.linkGrupDivisi) {
          if (detail.linkGrupBesar) {
            waButtons += `<a href="${detail.linkGrupBesar}" target="_blank" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; margin-right: 10px; margin-bottom: 10px;">Masuk Grup Utama Event</a>`;
          }
          if (detail.linkGrupDivisi) {
            waButtons += `<a href="${detail.linkGrupDivisi}" target="_blank" style="background-color: #1E8E3E; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; margin-bottom: 10px;">Masuk Grup Divisi</a>`;
          }
        } else {
          waButtons = `<a href="${saluranWaLink}" target="_blank" style="background-color: #1E8E3E; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; margin-bottom: 10px;">Gabung Saluran WA IKA UII</a>
                       <p style="font-size: 13px; color: #5F6368; font-style: italic; margin-top: 15px;">(Tautan grup koordinasi khusus akan diinformasikan menyusul melalui saluran di atas)</p>`;
        }

        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Pemberitahuan Seleksi Kepanitiaan</h2>
          <p style="color: #5F6368;">Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Terima kasih atas antusiasme Anda mendaftar sebagai bagian dari kepanitiaan <strong>${detail?.event || "IKA UII DIY"}</strong>.</p>
          <p>Melalui email ini, kami sampaikan bahwa berdasarkan hasil peninjauan profil dan kapabilitas, Anda dinyatakan <strong>DITERIMA</strong> untuk mengisi formasi pada posisi:</p>
          
          <div style="background-color: #F8F9FA; border-left: 4px solid #1A73E8; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 13px; color: #5F6368; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">POSISI PENEMPATAN</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; color: #1A73E8; font-weight: 700;">${detail?.divisi || "Kepanitiaan IKA UII"}</p>
          </div>

          <p>Untuk tahap selanjutnya, Anda diwajibkan untuk bergabung ke dalam sarana komunikasi WhatsApp guna mendapatkan arahan lebih lanjut dari panitia pengarah:</p>
          
          <div style="margin: 30px 0;">
            ${waButtons}
          </div>

          <p>Kami menantikan kontribusi dan kerja sama Anda demi kesuksesan agenda kita bersama. Tetap pantau email dan sosial media kami untuk perkembangan informasi selanjutnya.</p>
          <p>Wassalamu'alaikum Warahmatullahi Wabarakatuh.</p>
        `,
          "HASIL SELEKSI KEPANITIAAN",
        );
        break;

      // ========================================================
      // EMAIL E-SERTIFIKAT KEPANITIAAN (CREW)
      // ========================================================
      case "certificate_crew":
        subject = `E-Sertifikat Kepanitiaan - Apresiasi Kinerja IKA UII DIY`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Terima Kasih Atas Dedikasi Anda</h2>
          <p style="color: #5F6368;">Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Rangkaian agenda <strong>${detail?.event || "Kepanitiaan IKA UII DIY"}</strong> telah berjalan dengan sukses dan lancar. Pencapaian luar biasa ini tentunya tidak lepas dari kerja keras, kerja sama, dan waktu yang telah Anda luangkan.</p>
          <p>Sebagai wujud apresiasi dan penghargaan resmi atas kontribusi nyata Anda, kami melampirkan E-Sertifikat Kepanitiaan yang dapat diunduh melalui tombol di bawah ini:</p>
          
          <div style="margin: 35px 0;">
            <a href="${detail?.linkSertifikat || baseUrl}" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Unduh E-Sertifikat Kepanitiaan</a>
          </div>

          <p>Kami berharap pengalaman ini dapat menjadi catatan rekam jejak yang baik untuk perjalanan karier Anda. Tetaplah terhubung erat dalam jaringan ikatan alumni kita.</p>
          <p>Wassalamu'alaikum Warahmatullahi Wabarakatuh.</p>
        `,
          "PENGHARGAAN KEPANITIAAN",
        );
        break;

      // ========================================================
      // EMAIL E-SERTIFIKAT FINISHER OFFLINE RUN
      // ========================================================
      case "certificate_offline":
        subject = `E-Sertifikat Finisher Offline Run - IKA UII DIY ${currentYear}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Pencapaian Luar Biasa!</h2>
          <p style="color: #5F6368;">Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih atas semangat dan antusiasme Anda dalam mengikuti rangkaian acara <strong>Offline Run IKA UII DIY ${currentYear}</strong>.</p>
          <p>Sebagai bentuk penghargaan resmi karena Anda telah berhasil menuntaskan perlombaan hingga menyentuh garis akhir (Finisher), kami telah menerbitkan E-Sertifikat untuk Anda.</p>
          
          <div style="margin: 35px 0;">
            <a href="${detail?.linkSertifikat || baseUrl}" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Unduh E-Sertifikat Finisher</a>
          </div>

          <p>Semoga pencapaian ini menjadi awal dari konsistensi Anda dalam menjaga gaya hidup sehat. Sampai jumpa di garis start agenda kami selanjutnya!</p>
        `,
          "PENGHARGAAN FINISHER",
        );
        break;

      // ========================================================
      // EMAIL: KEANGGOTAAN PENDING
      // ========================================================
      case "member_pending":
        subject = `Pendaftaran Keanggotaan IKA UII DIY - ${nama}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Pendaftaran Sedang Diproses</h2>
          <p style="color: #5F6368;">Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Data pendaftaran keanggotaan IKA UII DIY Anda telah berhasil tersimpan di dalam sistem kami.</p>
          <p>Saat ini, status pendaftaran Anda adalah <strong>Menunggu Peninjauan</strong>. Tim administrator kami akan segera memverifikasi kesesuaian data yang Anda berikan. Kami akan mengirimkan pemberitahuan lebih lanjut ke email ini setelah proses verifikasi selesai.</p>
          <p>Terima kasih atas kesabaran Anda.</p>
        `,
          "PORTAL KEANGGOTAAN",
        );
        break;

      // ========================================================
      // EMAIL: KEANGGOTAAN TERVERIFIKASI
      // ========================================================
      case "member_verified":
        subject = `Verifikasi Berhasil: Keanggotaan IKA UII DIY`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Verifikasi Keanggotaan Selesai</h2>
          <p style="color: #5F6368;">Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Kami memberitahukan bahwa proses verifikasi data Anda telah <strong>SELESAI</strong>. Anda kini telah terdaftar secara resmi sebagai anggota di dalam sistem IKA UII DIY.</p>
          <p>Silakan masuk ke dalam portal untuk memperbarui profil dan melihat informasi kegiatan khusus anggota.</p>
          <div style="margin: 35px 0;">
            <a href="${baseUrl}/dashboard" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Akses Portal Anggota</a>
          </div>
        `,
          "PORTAL KEANGGOTAAN",
        );
        break;

      // ========================================================
      // EMAIL: REGISTRASI OFFLINE RUN (TAGIHAN)
      // ========================================================
      case "offline_registration":
        subject = `Instruksi Pembayaran Offline Run IKA UII DIY ${currentYear}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Menunggu Pembayaran</h2>
          <p>Halo, <strong>${nama}</strong>.</p>
          <p>Terima kasih telah mendaftar pada acara <strong>Offline Run IKA UII DIY ${currentYear}</strong>.</p>
          <p>Untuk mengamankan slot pendaftaran Anda, mohon segera menyelesaikan pembayaran tagihan dengan rincian sebagai berikut:</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border: 1px solid #DADCE0; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Total Tagihan Pembayaran</p>
            <p style="margin: 8px 0 0 0; font-size: 28px; color: #1A73E8; font-weight: 400;">Rp ${displayTagihan}</p>
          </div>

          <p>Klik tombol di bawah ini untuk melihat metode pembayaran dan mengunggah bukti transfer Anda.</p>
          
          <div style="margin: 35px 0;">
            <a href="${baseUrl}/run/checkout/${pId}" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Selesaikan Pembayaran</a>
          </div>
        `,
          "SISTEM REGISTRASI EVENT",
        );
        break;

      // ========================================================
      // EMAIL: SUKSES BAYAR OFFLINE RUN (E-TICKET)
      // ========================================================
      case "payment_success_offline":
        subject = `E-Ticket Offline Run IKA UII DIY ${currentYear}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Pembayaran Berhasil</h2>
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Kami telah menerima konfirmasi pembayaran Anda. Status pendaftaran Anda saat ini adalah <strong>LUNAS</strong>.</p>
          <p>Harap simpan E-Ticket Anda untuk keperluan registrasi ulang dan pengambilan Racepack di lokasi acara.</p>
          <div style="margin: 35px 0;">
            <a href="${baseUrl}/run/checkout/${pId}" style="background-color: #1E8E3E; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Lihat E-Ticket</a>
          </div>
        `,
          "KONFIRMASI PEMBAYARAN",
        );
        break;

      // ========================================================
      // EMAIL: REGISTRASI VIRTUAL RUN (TAGIHAN)
      // ========================================================
      case "registration":
        subject = `Instruksi Pembayaran Virtual Run IKA UII DIY ${currentYear}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Menunggu Pembayaran Virtual Run</h2>
          <p>Halo, <strong>${nama}</strong>.</p>
          <p>Pendaftaran Anda untuk <strong>Virtual Run IKA UII DIY ${currentYear}</strong> telah tercatat.</p>
          <p>Selesaikan pembayaran untuk mengaktifkan Dashboard Pelari Anda:</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border: 1px solid #DADCE0; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Total Tagihan Pembayaran</p>
            <p style="margin: 8px 0 0 0; font-size: 28px; color: #1A73E8; font-weight: 400;">Rp ${displayTagihan}</p>
          </div>

          <div style="margin: 35px 0;">
            <a href="${baseUrl}/virtual-run/dashboard" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Buka Dashboard Pelari</a>
          </div>
        `,
          "SISTEM REGISTRASI EVENT",
        );
        break;

      // ========================================================
      // EMAIL: SUKSES BAYAR VIRTUAL RUN
      // ========================================================
      case "payment_success_virtual":
        subject = `Dashboard Virtual Run Aktif - IKA UII DIY`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Pembayaran Terkonfirmasi</h2>
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Pembayaran Anda untuk event Virtual Run telah kami konfirmasi. Dashboard Pelari Anda kini sudah <strong>AKTIF</strong>.</p>
          <p>Anda sudah dapat memulai aktivitas lari sesuai dengan kategori yang dipilih dan mengirimkan bukti (submit) capaian lari Anda di dalam sistem.</p>
          <div style="margin: 35px 0;">
            <a href="${baseUrl}/virtual-run/dashboard" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Akses Dashboard Sekarang</a>
          </div>
        `,
          "KONFIRMASI PEMBAYARAN",
        );
        break;

      // ========================================================
      // EMAIL: FINISHER VIRTUAL RUN
      // ========================================================
      case "finisher":
        subject = `Sertifikat Finisher - Virtual Run IKA UII DIY ${currentYear}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Misi Selesai!</h2>
          <p>Luar biasa, <strong>${nama}</strong>!</p>
          <p>Anda telah menuntaskan target kilometer lari Anda dengan sangat baik. E-Sertifikat Finisher Anda telah diterbitkan dan dapat diunduh.</p>
          <p>Terima kasih atas partisipasi dan semangat Anda. Sampai jumpa di garis start tahun berikutnya!</p>
          <div style="margin: 35px 0;">
            <a href="${baseUrl}/virtual-run/dashboard" style="background-color: #1A73E8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Unduh Sertifikat</a>
          </div>
        `,
          "PENGHARGAAN FINISHER",
        );
        break;

      // ========================================================
      // EMAIL: NOTIFIKASI KHUSUS ADMIN
      // ========================================================
      case "admin_notif_payment":
        subject = `[Admin] Validasi Pembayaran: ${nama}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #D93025; margin-top: 0; font-size: 20px; font-weight: 500;">Bukti Bayar Baru Masuk</h2>
          <p>Peserta atas nama <strong>${nama}</strong> baru saja mengunggah bukti transfer untuk pendaftaran <strong>${detail?.type || "Event"}</strong>.</p>
          <p>Mohon segera lakukan peninjauan dan validasi di Panel Admin agar peserta bisa mendapatkan akses atau E-Ticket mereka.</p>
          <div style="margin: 35px 0;">
            <a href="${baseUrl}/admin-vr/offline" style="background-color: #202124; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block;">Buka Panel Admin</a>
          </div>
        `,
          "SISTEM NOTIFIKASI ADMIN",
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 },
        );
    }

    await transporter.sendMail({
      from: `"DPW IKA UII DIY" <${officialEmail}>`,
      to: email,
      replyTo: officialEmail,
      subject: subject,
      html: htmlContent,
    });

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error: any) {
    console.error("Critical Mail Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
