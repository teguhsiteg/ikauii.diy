import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { rateLimit } from "@/lib/rate-limit";

const emailRateLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 10 });

export async function POST(request: Request) {
  // Rate limiting
  const rl = emailRateLimiter(request);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  try {
    // Validasi: hanya boleh dipanggil dari server internal
    const internalSecret = request.headers.get("x-internal-secret");
    if (internalSecret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { type, email, nama, detail, attachmentBase64 } = body;


    const currentYear = new Date().getFullYear();
    const officialEmail = "ika.diy@uii.ac.id";
    const NOMOR_WA_ADMIN = "6285179594146";
    const logoUrl = "https://ikadiy.uii.ac.id/logo-dpp-ika.png";

    // 1. SINKRONISASI NAMA EVENT SECARA GLOBAL (KONSISTEN UNTUK SEMUA EMAIL)
    const eventName = detail?.eventName || detail?.event || "Event IKA UII DIY";

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

    // 2. SINKRONISASI DESAIN TOMBOL GLOBAL
    const generateButton = (
      text: string,
      url: string,
      isSuccess: boolean = false,
    ) => {
      const bgColor = isSuccess ? "#1E8E3E" : "#1A73E8";
      return `<a href="${url}" style="background-color: ${bgColor}; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 14px; display: inline-block; text-align: center; margin-top: 10px;">${text}</a>`;
    };

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
          <style>
            body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
            table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
            img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
            body { margin: 0; padding: 0; width: 100% !important; background-color: #F8F9FA; font-family: Arial, Helvetica, sans-serif; }
            
            @media only screen and (max-width: 600px) {
              .email-container { width: 100% !important; border-radius: 0 !important; border: none !important; }
              .logo-img { max-width: 100px !important; }
              .social-icon { width: 24px !important; height: 24px !important; }
              .content-padding { padding: 25px 15px !important; }
              
              /* Tabel Responsive untuk Komunitas */
              .mobile-table th, .mobile-table td { padding: 8px 5px !important; font-size: 11px !important; }
              .hide-mobile { display: none !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #F8F9FA;">
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8F9FA; padding: 20px 10px;">
            <tr>
              <td align="center">
                <table class="email-container" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #DADCE0; border-radius: 8px; overflow: hidden;">
                  
                  <tr>
                    <td align="center" style="padding: 25px 20px; border-bottom: 3px solid #1A73E8; background-color: #FFFFFF;">
                      <img class="logo-img" src="${logoUrl}" alt="DPW IKA UII DIY" width="120" style="display: block; max-width: 120px; width: 100%; height: auto; margin: 0 auto 10px auto; border: 0;" />
                      <p style="margin: 0; font-size: 11px; font-weight: 700; color: #5F6368; letter-spacing: 1.5px; text-transform: uppercase; font-family: Arial, sans-serif;">
                        ${customSubtitle}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td class="content-padding" style="padding: 30px 24px; color: #202124; line-height: 1.6; font-size: 15px; font-family: Arial, sans-serif;">
                      ${content}

                      <div style="background-color: #E6F4EA; border: 1px solid #CEEAD6; padding: 15px 20px; margin-top: 35px; border-radius: 8px;">
                        <p style="margin: 0 0 10px 0; font-size: 14px; color: #1E8E3E; font-weight: 700;">
                          Tetap Terhubung dengan IKA UII DIY!
                        </p>
                        <p style="margin: 0 0 15px 0; font-size: 13px; color: #3C4043; line-height: 1.5;">
                          Dapatkan informasi terbaru mengenai agenda, program beasiswa, lowongan pekerjaan, dan jaringan bisnis khusus alumni langsung melalui WhatsApp Anda.
                        </p>
                        ${generateButton("Gabung Saluran WhatsApp", saluranWaLink, true)}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td align="center" style="background-color: #F8F9FA; padding: 30px 20px; border-top: 1px solid #DADCE0; font-family: Arial, sans-serif;">
                      <p style="margin: 0 0 20px 0; color: #202124; font-size: 13px; font-weight: bold;">
                        Terhubung Dengan Kami
                      </p>
                      
                      <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 25px;">
                        <tr>
                          <td align="center" style="padding: 0 12px;">
                            <a href="mailto:${officialEmail}" style="text-decoration: none; display: inline-block;">
                              <img class="social-icon" src="https://cdn-icons-png.flaticon.com/512/281/281769.png" alt="Email" width="28" height="28" style="display: block; border: 0; opacity: 0.7;" />
                            </a>
                          </td>
                          <td align="center" style="padding: 0 12px;">
                            <a href="https://instagram.com/ikauii.diy" style="text-decoration: none; display: inline-block;">
                              <img class="social-icon" src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" alt="Instagram" width="28" height="28" style="display: block; border: 0; opacity: 0.7;" />
                            </a>
                          </td>
                          <td align="center" style="padding: 0 12px;">
                            <a href="https://youtube.com/@dpwikauiiyogyakarta" style="text-decoration: none; display: inline-block;">
                              <img class="social-icon" src="https://cdn-icons-png.flaticon.com/512/1384/1384060.png" alt="YouTube" width="28" height="28" style="display: block; border: 0; opacity: 0.7;" />
                            </a>
                          </td>
                          <td align="center" style="padding: 0 12px;">
                            <a href="${saluranWaLink}" style="text-decoration: none; display: inline-block;">
                              <img class="social-icon" src="https://cdn-icons-png.flaticon.com/512/1384/1384055.png" alt="WhatsApp" width="28" height="28" style="display: block; border: 0; opacity: 0.7;" />
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 0; font-size: 11px; color: #5F6368; line-height: 1.6;">
                        <strong>DPW IKA UII DIY</strong><br>
                        Universitas Islam Indonesia, Yogyakarta<br>
                        &copy; ${currentYear} Hak Cipta Dilindungi.
                      </p>
                    </td>
                  </tr>

                </table>

                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; font-family: Arial, sans-serif;">
                  <tr>
                    <td align="center" style="padding-top: 20px;">
                      <p style="margin: 0; font-size: 11px; color: #9AA0A6; line-height: 1.5;">
                        Email ini dibuat secara otomatis oleh sistem.<br>Mohon untuk tidak membalas email ini secara langsung.
                      </p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
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

    const salamPembuka = `<p style="color: #5F6368; margin-top: 0; margin-bottom: 15px; font-size: 14px;">Assalamu'alaikum Warahmatullahi Wabarakatuh,</p>`;

    switch (type) {
      case "oprec_pending":
        subject = `Pendaftaran Diterima - ${detail?.event || "Kepanitiaan"}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #F9AB00; margin-top: 0; font-size: 20px; font-weight: 500;">Pendaftaran Sedang Direview</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih atas ketertarikan Anda untuk bergabung menjadi bagian dari kepanitiaan <strong>${detail?.event || "IKA UII"}</strong>.</p>
          <p>Berkas pendaftaran Anda untuk posisi <strong>${detail?.divisi || "Divisi Pilihan"}</strong> telah kami terima dengan baik dan saat ini sedang dalam tahap reviu oleh tim kami.</p>
          <p>Mohon menunggu informasi selanjutnya yang akan dikirimkan melalui email ini atau WhatsApp. Pastikan Anda mengecek kotak masuk secara berkala.</p>
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Kunjungi Website", baseUrl)}
          </div>
          `,
          "STATUS: MENUNGGU REVIEW",
        );
        break;

      case "crew_rejected":
        subject = `Hasil Seleksi - ${detail?.event || "Kepanitiaan"}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #5F6368; margin-top: 0; font-size: 20px; font-weight: 500;">Pemberitahuan Hasil Seleksi</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih atas antusiasme Anda mendaftar sebagai panitia <strong>${detail?.event || "IKA UII"}</strong>.</p>
          <p>Setelah meninjau seluruh pendaftar, dengan berat hati kami sampaikan bahwa <strong>kami belum dapat menempatkan Anda</strong> di posisi kepanitiaan untuk kesempatan kali ini.</p>
          
          <div style="background-color: #FEF7E0; border-left: 4px solid #F9AB00; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0 0 5px 0; font-size: 13px; color: #B06000; font-weight: 700; text-transform: uppercase;">Catatan Panitia:</p>
            <p style="margin: 0; font-size: 14px; color: #202124; line-height: 1.5;">
              ${detail?.alasanTolak || "Kualifikasi yang dibutuhkan belum sesuai atau kuota pada divisi yang Anda pilih telah terpenuhi."}
            </p>
          </div>

          <p>Keputusan ini tidak mengurangi apresiasi kami atas niat baik Anda. Jangan menyerah, dan kami tunggu partisipasi Anda di agenda atau kepanitiaan IKA UII DIY selanjutnya.</p>
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Jelajahi Agenda Lain", baseUrl)}
          </div>
          `,
          "STATUS: BELUM LULUS (REJECTED)",
        );
        break;

      case "masterclass_certificate":
        subject = `E-Certificate Kelulusan Masterclass - ${detail?.judulKelas}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1A73E8; margin-top: 0; font-size: 20px; font-weight: 500;">Selamat Atas Kelulusan Anda!</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Selamat! Anda telah resmi menyelesaikan seluruh rangkaian materi dan lulus evaluasi pada program Masterclass <strong>"${detail?.judulKelas}"</strong>.</p>
          
          <div style="background-color: #F8F9FA; border: 1px solid #DADCE0; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-size: 11px; color: #5F6368; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Rincian Sertifikat</p>
            <table style="width: 100%; font-size: 14px; color: #202124; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #5F6368; width: 40%;"><strong>Nomor ID</strong></td>
                <td style="padding: 6px 0; font-family: monospace; color: #1A73E8; font-weight: bold;">: ${detail?.nomorSertifikat || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5F6368;"><strong>Tanggal Lulus</strong></td>
                <td style="padding: 6px 0;">: ${detail?.tanggalLulus || "-"}</td>
              </tr>
            </table>
          </div>

          <p>Sebagai bentuk apresiasi atas dedikasi Anda, <strong>E-Certificate dan Transkrip Nilai telah kami lampirkan dalam email ini (File PDF).</strong> Silakan unduh, simpan, atau bagikan pencapaian Anda ke LinkedIn maupun jaringan profesional Anda yang lain.</p>

          <div style="margin: 35px 0 0 0;">
            ${generateButton("Verifikasi Sertifikat Online", detail?.linkValidasi || baseUrl)}
          </div>
          `,
          "PENGHARGAAN MASTERCLASS",
        );
        break;

      case "custom_broadcast":
        const bType = detail?.broadcastType;

        if (bType === "promo_baru") {
          subject = `Undangan Partisipasi: ${eventName}`;
          htmlContent = generateHtml(
            `
            <h2 style="color: #1A73E8; margin-top: 0; font-size: 20px; font-weight: 500;">Undangan Partisipasi</h2>
            ${salamPembuka}
            <p>Yth. <strong>${nama}</strong>,</p>
            <p>Kami mengundang Anda untuk berpartisipasi dalam agenda terbaru IKA UII DIY, yaitu <strong>${eventName}</strong>.</p>
            <p>Jangan lewatkan kesempatan berharga ini untuk hadir, bersilaturahmi, dan berkontribusi bersama jaringan keluarga besar alumni UII.</p>
            <div style="margin: 35px 0 0 0;">
              ${generateButton("Lihat Detail Agenda", `${baseUrl}/agenda`)}
            </div>
            `,
            "PEMBERITAHUAN AGENDA BARU",
          );
        } else if (bType === "h_min_1") {
          subject = `[PENGINGAT H-1] Persiapan Mengikuti ${eventName}`;
          htmlContent = generateHtml(
            `
            <h2 style="color: #F9AB00; margin-top: 0; font-size: 20px; font-weight: 500;">Persiapkan Diri Anda</h2>
            ${salamPembuka}
            <p>Yth. <strong>${nama}</strong>,</p>
            <p>Ini adalah pengingat ramah bahwa agenda <strong>${eventName}</strong> yang Anda ikuti akan dilaksanakan <strong>BESOK</strong>.</p>
            <p>Pastikan Anda telah menyiapkan segala kebutuhan, tiket registrasi (jika ada), dan menjaga kesehatan agar dapat mengikuti seluruh rangkaian acara dengan lancar.</p>
            <p style="margin-bottom: 0;">Sampai jumpa di lokasi acara!</p>
            `,
            "PENGINGAT H-1 AGENDA",
          );
        } else if (bType === "hari_h") {
          subject = `[HARI INI] Pelaksanaan ${eventName}`;
          htmlContent = generateHtml(
            `
            <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Hari Pelaksanaan Tiba</h2>
            ${salamPembuka}
            <p>Yth. <strong>${nama}</strong>,</p>
            <p>Hari ini adalah hari pelaksanaan <strong>${eventName}</strong>! Kami selaku panitia penyelenggara sangat menantikan kehadiran dan partisipasi aktif Anda.</p>
            <p style="margin-bottom: 0;">Mohon hadir tepat waktu sesuai dengan jadwal yang telah ditentukan. Hati-hati di perjalanan dan selamat bergabung di lokasi acara.</p>
            `,
            "PENGINGAT HARI PELAKSANAAN",
          );
        } else if (bType === "custom") {
          subject = detail?.customSubject || `Informasi Penting: ${eventName}`;
          const formattedMessage = (detail?.customMessage || "").replace(
            /\n/g,
            "<br>",
          );
          htmlContent = generateHtml(
            `
            ${salamPembuka}
            <p>Yth. <strong>${nama}</strong>,</p>
            <p style="margin-bottom: 0;">${formattedMessage}</p>
            `,
            "INFORMASI BROADCAST",
          );
        }
        break;

      case "akses_pengurus":
        subject = `Informasi Hak Akses E-Office - DPW IKA UII DIY`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Pembaruan Otoritas Akun</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Email ini merupakan pemberitahuan resmi bahwa akun Anda telah diberikan otoritas akses ke dalam sistem E-Office DPW IKA UII DIY dengan rincian sebagai berikut:</p>
          
          <div style="background-color: #F8F9FA; border: 1px solid #DADCE0; padding: 15px 20px; margin: 25px 0; border-radius: 8px;">
            <table style="width: 100%; font-size: 14px; color: #202124; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #5F6368; width: 40%;"><strong>Peran (Role)</strong></td>
                <td style="padding: 6px 0;">: <span style="text-transform: capitalize;">${(detail?.role || "Pengurus").replace("_", " ")}</span></td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5F6368;"><strong>Bidang / Departemen</strong></td>
                <td style="padding: 6px 0;">: ${detail?.bidang || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5F6368;"><strong>Kapasitas Akses</strong></td>
                <td style="padding: 6px 0;">: <span style="color: #1A73E8; font-weight: 600;">${detail?.aksesModul || "-"}</span></td>
              </tr>
            </table>
          </div>
          
          <p>Gunakan alamat email <strong>${email}</strong> ini untuk melakukan <em>login</em> ke dalam sistem. Jika ini adalah pertama kalinya Anda diberikan akses dan Anda belum memiliki <em>password</em>, gunakan fitur <strong>"Lupa Password"</strong> di halaman <em>login</em> untuk mengatur kata sandi Anda secara mandiri dan aman.</p>
          
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Akses E-Office Sekarang", `${baseUrl}/login`)}
          </div>
        `,
          "OTORITAS E-OFFICE",
        );
        break;

      case "approve_bisnis":
        subject = `Pendaftaran Bisnis Disetujui - ${detail?.namaBisnis || "Direktori IKA UII DIY"}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Bisnis Anda Telah Tayang!</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Kabar gembira! Permohonan pendaftaran bisnis/usaha Anda dengan nama <strong>${detail?.namaBisnis}</strong> telah lolos verifikasi Admin dan resmi mengudara di halaman Katalog Bisnis IKA UII DIY.</p>
          <p>Semoga dengan tergabungnya usaha Anda di dalam direktori ini, relasi, promosi, dan potensi kerja sama antar keluarga besar alumni UII dapat semakin terbuka lebar.</p>
          
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Lihat Bisnis Anda di Web", `${baseUrl}/direktori-bisnis?id=${detail?.id}`)}
          </div>
        `,
          "DIREKTORI BISNIS IKA UII DIY",
        );
        break;

      case "reject_bisnis":
        subject = `Status Pendaftaran Direktori Bisnis - ${detail?.namaBisnis || "IKA UII DIY"}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #D93025; margin-top: 0; font-size: 20px; font-weight: 500;">Pemberitahuan Pendaftaran Bisnis</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Terima kasih telah mendaftarkan <strong>${detail?.namaBisnis}</strong> ke dalam sistem kami. Mohon maaf, setelah melakukan peninjauan, permohonan pendaftaran bisnis Anda saat ini <strong>belum dapat kami tayangkan</strong>.</p>
          
          <div style="background-color: #FCE8E6; border-left: 4px solid #D93025; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #D93025; font-weight: 700; text-transform: uppercase;">Alasan Penolakan:</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #202124;">${detail?.alasan || "Terdapat ketidaksesuaian data atau melanggar panduan komunitas kami."}</p>
          </div>
          
          <p style="margin-bottom: 0;">Silakan lakukan perbaikan data dan kirimkan ulang formulir pendaftaran Anda melalui website. Apabila ada pertanyaan lebih lanjut, silakan hubungi tim kesekretariatan kami.</p>
        `,
          "DIREKTORI BISNIS IKA UII DIY",
        );
        break;

      case "iklan_tayang":
        subject = `Banner Iklan Anda Telah Mengudara - IKA UII DIY`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1A73E8; margin-top: 0; font-size: 20px; font-weight: 500;">Iklan Anda Telah Resmi Mengudara</h2>
          ${salamPembuka}
          <p>Yth. / Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih atas dukungan dan partisipasi Anda. Kami informasikan bahwa Banner Iklan / Promosi Anda kini telah terpasang dan mengudara di halaman depan Direktori Bisnis IKA UII DIY.</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border: 1px solid #DADCE0; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Masa Tayang Iklan Berlaku Hingga:</p>
            <p style="margin: 8px 0 0 0; font-size: 18px; color: #202124; font-weight: 500;">${detail?.tanggalBerakhir || "-"}</p>
          </div>
          
          <p>Iklan akan diturunkan secara otomatis oleh sistem setelah melewati batas waktu di atas. Ingin memperpanjang masa tayang untuk menjangkau lebih banyak audiens? Silakan klik tombol di bawah ini untuk menghubungi Admin.</p>
          
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Perpanjang Masa Tayang Iklan", `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodeURIComponent("Halo Admin IKA UII DIY, saya ingin memperpanjang masa tayang iklan banner saya di website direktori bisnis.")}`, true)}
          </div>
        `,
          "SPONSORSHIP & IKLAN",
        );
        break;

      case "crew_accepted":
        subject = `Informasi Kelulusan Seleksi Kepanitiaan - ${eventName}`;

        let waButtons = "";
        if (detail?.linkGrupBesar) {
          waButtons +=
            generateButton("Masuk Grup Utama Event", detail.linkGrupBesar) +
            "&nbsp;&nbsp;";
        }
        if (detail?.linkGrupDivisi) {
          waButtons += generateButton(
            "Masuk Grup Divisi",
            detail.linkGrupDivisi,
            true,
          );
        }

        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Pemberitahuan Seleksi Kepanitiaan</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Terima kasih atas antusiasme Anda mendaftar sebagai bagian dari kepanitiaan <strong>${eventName}</strong>.</p>
          <p>Melalui email ini, kami sampaikan bahwa berdasarkan hasil peninjauan profil dan kapabilitas, Anda dinyatakan <strong>DITERIMA</strong> untuk mengisi formasi pada posisi:</p>
          
          <div style="background-color: #F8F9FA; border-left: 4px solid #1A73E8; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 13px; color: #5F6368; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">POSISI PENEMPATAN</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; color: #1A73E8; font-weight: 700;">${detail?.divisi || "Kepanitiaan IKA UII"}</p>
          </div>

          <p>Untuk tahap selanjutnya, Anda diwajibkan untuk bergabung ke dalam sarana komunikasi WhatsApp guna mendapatkan arahan lebih lanjut dari panitia pengarah:</p>
          
          <div style="margin: 30px 0;">
            ${waButtons}
          </div>

          <p style="margin-bottom: 0;">Kami menantikan kontribusi dan kerja sama Anda demi kesuksesan agenda kita bersama. Tetap pantau email dan sosial media kami untuk perkembangan informasi selanjutnya.</p>
        `,
          "HASIL SELEKSI KEPANITIAAN",
        );
        break;

      case "certificate_crew":
        subject = `E-Sertifikat Kepanitiaan - Apresiasi Kinerja IKA UII DIY`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Terima Kasih Atas Dedikasi Anda</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Rangkaian agenda <strong>${eventName}</strong> telah berjalan dengan sukses dan lancar. Pencapaian luar biasa ini tentunya tidak lepas dari kerja keras, kerja sama, dan waktu yang telah Anda luangkan.</p>
          
          <div style="background-color: #F8F9FA; border-left: 4px solid #1A73E8; padding: 15px 20px; margin: 20px 0;">
            <p style="margin: 0 0 5px 0; font-size: 13px; color: #5F6368; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">CATATAN PENGUNDUHAN:</p>
            <p style="margin: 0; font-size: 14px; color: #202124;">Seluruh E-Sertifikat Kepanitiaan telah kami kumpulkan menjadi satu. Silakan akses folder di bawah ini dan <strong>cari sertifikat berdasarkan Nama atau Posisi Anda.</strong></p>
          </div>
          
          <div style="margin: 35px 0;">
            ${generateButton("Buka Folder E-Sertifikat", detail?.linkSertifikat || baseUrl)}
          </div>

          <p style="margin-bottom: 0;">Kami berharap pengalaman ini dapat menjadi catatan rekam jejak yang baik untuk perjalanan karier Anda. Tetaplah terhubung erat dalam jaringan ikatan alumni kita.</p>
        `,
          "PENGHARGAAN KEPANITIAAN",
        );
        break;

      case "certificate_offline":
        subject = `E-Sertifikat Finisher - ${eventName}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Pencapaian Luar Biasa!</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih atas semangat dan antusiasme Anda dalam mengikuti rangkaian acara <strong>${eventName}</strong>.</p>
          <p>Sebagai bentuk penghargaan resmi karena Anda telah berhasil menuntaskan perlombaan hingga menyentuh garis akhir (Finisher), kami telah menerbitkan E-Sertifikat untuk Anda.</p>
          
          <div style="margin: 35px 0;">
            ${generateButton("Unduh E-Sertifikat Finisher", detail?.linkSertifikat || baseUrl)}
          </div>

          <p style="margin-bottom: 0;">Semoga pencapaian ini menjadi awal dari konsistensi Anda dalam menjaga gaya hidup sehat. Sampai jumpa di garis start agenda kami selanjutnya!</p>
        `,
          "PENGHARGAAN FINISHER",
        );
        break;

      case "member_pending":
        subject = `Pendaftaran Berhasil - Selamat Datang di IKA UII DIY`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Pendaftaran Sedang Diproses</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Selamat bergabung! Data pendaftaran akun Anda di portal IKA UII DIY telah berhasil tersimpan di dalam sistem kami.</p>
          
          <div style="background-color: #FEF7E0; border-left: 4px solid #F29900; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #B06000; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">TINDAKAN DIBUTUHKAN</p>
            <p style="margin: 0; font-size: 14px; color: #202124; line-height: 1.5;">Saat ini status Anda adalah <strong>Menunggu Peninjauan Admin</strong>. Sambil menunggu, silakan masuk (login) ke Dashboard Anggota untuk melengkapi profil Anda, seperti <strong>memilih wilayah DPD</strong> dan <strong>mengunggah Pas Foto resmi</strong> agar E-KTA Anda dapat diterbitkan.</p>
          </div>

          <div style="margin: 35px 0 0 0;">
            ${generateButton("Login & Lengkapi Profil", `${baseUrl}/login`)}
          </div>
        `,
          "PORTAL KEANGGOTAAN",
        );
        break;

      case "member_verified":
        subject = `Selamat! Keanggotaan Aktif & E-KTA Resmi Diterbitkan`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Verifikasi Keanggotaan Selesai</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Kabar Gembira! Proses verifikasi data Anda telah selesai. Anda kini telah terdaftar secara resmi penuh di dalam sistem database DPW IKA UII Yogyakarta.</p>
          
          <div style="background-color: #F8F9FA; border: 1px solid #DADCE0; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 11px; color: #5F6368; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Nomor Induk Anggota (NIA)</p>
            <p style="margin: 5px 0 0 0; font-size: 24px; color: #1A73E8; font-weight: bold; font-family: monospace;">${detail?.nia || "MENUNGGU"}</p>
          </div>

          <p>Dengan aktifnya keanggotaan ini, Anda berhak menikmati seluruh fasilitas alumni, mengakses direktori bisnis, serta dapat langsung mengunduh <strong>Kartu Tanda Anggota Elektronik (E-KTA)</strong> Anda.</p>

          <div style="margin: 35px 0 0 0;">
            ${generateButton("Lihat & Unduh E-KTA Saya", `${baseUrl}/anggota`, true)}
          </div>
        `,
          "PENERBITAN KARTU ANGGOTA",
        );
        break;

      case "member_rejected":
        subject = `Pemberitahuan Status Keanggotaan - IKA UII DIY`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #D93025; margin-top: 0; font-size: 20px; font-weight: 500;">Pendaftaran Belum Dapat Disetujui</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Terima kasih atas antusiasme Anda untuk bergabung di portal keanggotaan DPW IKA UII DIY. Setelah tim kami meninjau kelengkapan profil Anda, mohon maaf saat ini pendaftaran Anda <strong>belum dapat kami setujui / verifikasi</strong>.</p>
          
          <div style="background-color: #FCE8E6; border-left: 4px solid #D93025; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #D93025; font-weight: 700; text-transform: uppercase;">Catatan dari Tim Verifikator:</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #202124;">${detail?.alasan || "Terdapat ketidaksesuaian data identitas, foto profil tidak memenuhi kriteria, atau dokumen pendukung belum lengkap."}</p>
          </div>
          
          <p style="margin-bottom: 0;">Jangan khawatir! Silakan masuk (login) kembali ke akun Anda untuk memperbarui data sesuai catatan di atas, kemudian ajukan ulang verifikasi kepada kami.</p>
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Login & Perbaiki Data Profil", `${baseUrl}/login`)}
          </div>
        `,
          "PORTAL KEANGGOTAAN",
        );
        break;

      case "offline_registration":
        subject = `Instruksi Pembayaran: ${eventName}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Menunggu Pembayaran</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih telah mendaftar pada acara <strong>${eventName}</strong>.</p>
          <p>Untuk mengamankan slot pendaftaran Anda, mohon segera menyelesaikan pembayaran tagihan dengan rincian sebagai berikut:</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border: 1px solid #DADCE0; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Total Tagihan Pembayaran</p>
            <p style="margin: 8px 0 15px 0; font-size: 28px; color: #1A73E8; font-weight: 400;">Rp ${displayTagihan}</p>
            
            <div style="border-top: 1px dashed #DADCE0; padding-top: 15px;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #5F6368;">Transfer ke rekening resmi kami (jika memilih opsi Transfer Manual):</p>
              <p style="margin: 0; font-size: 16px; color: #202124; font-weight: bold;">${detail?.bank || "Bank IKA UII"}</p>
              <p style="margin: 2px 0; font-size: 20px; color: #1A73E8; font-weight: bold; font-family: monospace;">${detail?.rekening || "-"}</p>
              <p style="margin: 0; font-size: 12px; color: #5F6368;">a.n. <strong>${detail?.atasNama || "IKA UII DIY"}</strong></p>
            </div>
          </div>

          <p>Klik tombol di bawah ini untuk mengunggah bukti transfer Anda.</p>
          
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Selesaikan Pembayaran", `${baseUrl}/run/checkout/${pId}`)}
          </div>
        `,
          "SISTEM REGISTRASI EVENT",
        );
        break;

      case "payment_proof_submitted":
        subject = `Menunggu Verifikasi Pembayaran - ${eventName}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #F9AB00; margin-top: 0; font-size: 20px; font-weight: 500;">Bukti Pembayaran Diterima</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih, kami telah menerima unggahan bukti pembayaran Anda untuk acara <strong>${eventName}</strong>.</p>
          
          <div style="background-color: #FEF7E0; border-left: 4px solid #F9AB00; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 14px; color: #202124; line-height: 1.6;">
              <strong>Pembayaran diterima. Menunggu verifikasi admin max 1x24 jam.</strong>
            </p>
          </div>

          <p>Setelah pembayaran Anda diverifikasi oleh tim kami, sistem akan otomatis mengirimkan email E-Ticket resmi kepada Anda.</p>
          
          <div style="margin: 35px 0 0 0; text-align: center;">
            ${generateButton("Pantau Status Pendaftaran", `${baseUrl}/run/checkout/${pId}`)}
          </div>
        `,
          "VERIFIKASI PEMBAYARAN",
        );
        break;

      case "payment_success_offline":
        subject = `E-Ticket Lunas: ${eventName}`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl + "/verify-ticket/" + pId)}`;

        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Pembayaran Berhasil</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Kami telah menerima konfirmasi pembayaran Anda. Status pendaftaran Anda saat ini adalah <strong style="color: #1E8E3E;">LUNAS</strong>.</p>
          <p>Berikut adalah rincian pendaftaran dan E-Ticket resmi Anda. <strong>Mohon simpan email ini (bisa difoto layar atau dibintangi)</strong>. Anda diwajibkan untuk menunjukkan email berisi QR Code di bawah ini kepada panitia sebagai syarat utama saat pengambilan <em>Racepack</em> di lokasi acara.</p>
          
          <div style="background-color: #F8F9FA; padding: 30px 20px; border: 1px solid #DADCE0; border-radius: 12px; margin: 25px 0; text-align: center;">
            <img src="${qrCodeUrl}" alt="QR Code E-Ticket" width="160" height="160" style="display: block; margin: 0 auto 15px auto; border: 6px solid #fff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
            <p style="margin: 0 0 20px 0; font-size: 12px; color: #5F6368; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">SCAN SAAT PENGAMBILAN RACEPACK</p>
            
            <table style="width: 100%; text-align: left; font-size: 14px; color: #202124; border-collapse: collapse; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; color: #5F6368; width: 40%;"><strong>Nama Peserta</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; font-weight: bold;">: ${nama}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; color: #5F6368;"><strong>NIK</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; font-weight: bold;">: ${detail?.nik || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; color: #5F6368;"><strong>Kategori (Jarak)</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; font-weight: bold;">: ${detail?.jarak || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; color: #5F6368;"><strong>Ukuran Jersey</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; font-weight: bold;">: ${detail?.ukuranJersey || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; color: #5F6368;"><strong>Nama di BIB</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; font-weight: bold;">: ${detail?.namaBib || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; color: #5F6368;"><strong>Nomor BIB</strong></td>
                <td style="padding: 12px 15px; font-weight: 900; color: #1A73E8; font-size: 16px;">: ${detail?.bib || "Menunggu Admin"}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 35px 0 0 0; text-align: center;">
            ${generateButton("Lihat E-Ticket di Website", `${baseUrl}/run/tiket/${pId}`, true)}
          </div>
        `,
          "KONFIRMASI PEMBAYARAN",
        );
        break;

      case "vr_payment_reminder":
        subject = `Pengingat Pembayaran Virtual Run - ${eventName}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Pengingat Pembayaran</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih telah mendaftar di <strong>${eventName}</strong>. Kami menginformasikan bahwa pendaftaran Anda masih dalam status <strong>Menunggu Pembayaran</strong>.</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border: 1px solid #DADCE0; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Paket Pilihan</p>
            <p style="margin: 4px 0 15px 0; font-size: 16px; color: #202124; font-weight: bold; text-transform: capitalize;">${detail?.paket || "-"}</p>

            ${
              detail?.paket === "premium" && detail?.alamat
                ? `
            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Alamat Pengiriman Racepack</p>
            <p style="margin: 4px 0 15px 0; font-size: 14px; color: #202124; line-height: 1.5;">${detail.alamat}</p>
            `
                : ""
            }

            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Total Tagihan</p>
            <p style="margin: 8px 0 15px 0; font-size: 28px; color: #1A73E8; font-weight: 400;">Rp ${displayTagihan}</p>
            
            <div style="border-top: 1px dashed #DADCE0; padding-top: 15px;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #5F6368;">Transfer ke rekening resmi kami:</p>
              <p style="margin: 0; font-size: 16px; color: #202124; font-weight: bold;">${detail?.bank || "BNI"}>
              <p style="margin: 2px 0; font-size: 20px; color: #1A73E8; font-weight: bold; font-family: monospace;">${detail?.rekening || "8880801816"}</p>
              <p style="margin: 0; font-size: 12px; color: #5F6368;">a.n. <strong>${detail?.atasNama || "DPW IKA UII DIY"}</strong></p>
            </div>
          </div>

          <p>Jika Anda sudah melakukan pembayaran, silakan abaikan email ini atau langsung unggah bukti transfer Anda melalui tombol di bawah ini.</p>

          <div style="margin: 35px 0 0 0;">
            ${generateButton("Unggah Bukti Pembayaran", `${baseUrl}/virtual-run/dashboard`)}
          </div>
        `,
          "REMINDER PEMBAYARAN",
        );
        break;

      case "registration":
        subject = `Instruksi Pembayaran: ${eventName}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Menunggu Pembayaran Virtual Run</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Pendaftaran Anda untuk <strong>${eventName}</strong> telah tercatat.</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border: 1px solid #DADCE0; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Total Tagihan Pembayaran</p>
            <p style="margin: 8px 0 ${detail?.bank ? '15px' : '0'} 0; font-size: 28px; color: #1A73E8; font-weight: 400;">Rp ${displayTagihan}</p>
            ${
              detail?.metodePembayaran === "manual" && detail?.bank
                ? `
            <div style="border-top: 1px dashed #DADCE0; padding-top: 15px;">
              <p style="margin: 0 0 5px 0; font-size: 12px; color: #5F6368;">Transfer ke rekening resmi kami:</p>
              <p style="margin: 0; font-size: 16px; color: #202124; font-weight: bold;">${detail.bank}</p>
              <p style="margin: 2px 0; font-size: 20px; color: #1A73E8; font-weight: bold; font-family: monospace;">${detail.rekening}</p>
              <p style="margin: 0; font-size: 12px; color: #5F6368;">a.n. <strong>${detail.atasNama}</strong></p>
            </div>
            `
                : detail?.metodePembayaran === "qris" && detail?.urlQris
                ? `
            <div style="border-top: 1px dashed #DADCE0; padding-top: 15px; text-align: center;">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #5F6368;">Scan QRIS di bawah ini untuk membayar:</p>
              <img src="${detail.urlQris}" alt="QRIS" width="150" style="display: inline-block; border: 1px solid #DADCE0; border-radius: 8px; padding: 5px;" />
            </div>
            `
                : ""
            }
          </div>

          <p>Selesaikan pembayaran agar Nomor e-BIB Anda dapat diterbitkan dan Dashboard Pelari aktif:</p>
          <ol style="margin-top: 0; margin-bottom: 20px; padding-left: 20px; color: #202124; line-height: 1.6;">
            <li>Klik tombol di bawah ini untuk masuk ke Dashboard Pelari.</li>
            <li>Gunakan alamat email pendaftaran Anda untuk login.</li>
            <li>Lakukan pembayaran atau unggah bukti bayar di dalam Dashboard.</li>
            <li><strong>Setelah bukti diunggah, admin akan memverifikasi pembayaran Anda maksimal 1x24 jam.</strong></li>
          </ol>

          <div style="margin: 35px 0 0 0;">
            ${generateButton("Buka Dashboard Pelari", `${baseUrl}/virtual-run/dashboard`)}
          </div>
        `,
          "SISTEM REGISTRASI EVENT",
        );
        break;

      case "otp_login":
        subject = `Kode OTP Login Dashboard - ${eventName}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1A73E8; margin-top: 0; font-size: 20px; font-weight: 500;">Kode OTP Anda</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Anda menerima email ini karena ada permintaan login ke Dashboard Pelari <strong>${eventName}</strong> menggunakan email Anda.</p>
          
          <div style="background-color: #F8F9FA; padding: 20px; border: 1px solid #DADCE0; border-radius: 8px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 13px; color: #5F6368; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">KODE OTP ANDA</p>
            <p style="margin: 0; font-size: 36px; font-weight: 900; color: #1A73E8; letter-spacing: 5px; font-family: monospace;">${detail?.otpCode}</p>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #D93025; font-weight: 500;">Kode ini hanya berlaku selama 5 menit.</p>
          </div>

          <p><strong>PENTING:</strong> Jangan berikan kode ini kepada siapapun, termasuk pihak yang mengaku sebagai panitia. Jika Anda tidak merasa melakukan permintaan login, abaikan email ini.</p>
        `,
          "KEAMANAN AKUN",
        );
        break;

      case "payment_success":
        subject = `Pembayaran Lunas & e-BIB Terbit: ${eventName}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Pembayaran Terkonfirmasi</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Pembayaran Anda untuk event <strong>${eventName}</strong> telah kami konfirmasi. Status pendaftaran Anda saat ini adalah <strong>LUNAS</strong> dan Dashboard Pelari Anda kini sudah aktif sepenuhnya.</p>
          
          <div style="background-color: #E8F0FE; border-left: 4px solid #1A73E8; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0; font-size: 13px; color: #1A73E8; font-weight: 700; text-transform: uppercase;">E-BIB ANDA SUDAH TERBIT!</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #202124; line-height: 1.5;">Nomor Dada Pelari (E-BIB) Anda telah digenerate otomatis oleh sistem. Silakan login ke Dashboard Pelari untuk mengunduhnya.</p>
          </div>

          <p>Anda sudah dapat memulai aktivitas lari sesuai dengan kategori yang dipilih dan mengirimkan bukti (submit) capaian lari Anda di dalam sistem.</p>
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Unduh E-BIB di Dashboard", `${baseUrl}/virtual-run/dashboard`, true)}
          </div>
        `,
          "KONFIRMASI PEMBAYARAN",
        );
        break;

      case "payment_success_komunitas":
        subject = `E-Ticket Group Run: ${detail?.komunitas} - ${eventName}`;

        const qrCodeKomunitasUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl + "/verify-ticket/" + pId)}`;

        let tableRows = "";
        if (detail?.participants && Array.isArray(detail.participants)) {
          detail.participants.forEach((p: any, idx: number) => {
            tableRows += `
              <tr style="border-bottom: 1px solid #F1F3F4;">
                <td style="padding: 12px 10px; text-align: center; color: #5F6368;">${idx + 1}</td>
                <td style="padding: 12px 10px; font-weight: bold; color: #202124;">
                  ${p.nama || p.namaLengkap || "-"}<br>
                  <span style="font-size: 11px; color: #5F6368; font-weight: normal;">NIK: ${p.nik || "-"}</span>
                </td>
                <td style="padding: 12px 10px; color: #202124;" class="hide-mobile">${p.namaBib || "-"}</td>
                <td style="padding: 12px 10px; text-align: center; color: #202124;">${p.kategori || p.jarak || "-"}</td>
                <td style="padding: 12px 10px; text-align: center; font-weight: bold; color: #202124;">${p.ukuranJersey || "-"}</td>
                <td style="padding: 12px 10px; font-weight: 900; color: #1A73E8; text-align: center; font-size: 14px;">${p.bib || p.nomorBIB || "Menunggu"}</td>
              </tr>
            `;
          });
        }

        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Validasi Grup Berhasil</h2>
          ${salamPembuka}
          <p>Halo Kapten <strong>${nama}</strong>,</p>
          <p>Terima kasih! Pembayaran kolektif untuk grup/komunitas <strong>${detail?.komunitas}</strong> telah berhasil kami konfirmasi. Status pendaftaran grup Anda kini adalah <strong style="color: #1E8E3E;">LUNAS</strong>.</p>
          
          <div style="background-color: #ffffff; padding: 25px 20px; border: 1px solid #DADCE0; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <div style="text-align: center; margin-bottom: 25px; padding-bottom: 25px; border-bottom: 2px dashed #E8EAED;">
              <img src="${qrCodeKomunitasUrl}" alt="QR Code E-Ticket Grup" width="180" height="180" style="display: block; margin: 0 auto 15px auto; border: 8px solid #F8F9FA; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
              <p style="margin: 0; font-size: 13px; color: #5F6368; text-transform: uppercase; font-weight: 900; letter-spacing: 1.5px;">SCAN SAAT PENGAMBILAN RACEPACK (KAPTEN)</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #80868B;">Satu QR Code ini berlaku untuk pengambilan seluruh anggota grup Anda.</p>
            </div>

            <p style="margin: 0 0 15px 0; font-size: 14px; color: #1A73E8; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">DAFTAR MANIFES & NOMOR BIB ANGGOTA</p>
            <div style="overflow-x: auto;">
              <table class="mobile-table" style="width: 100%; text-align: left; font-size: 13px; border-collapse: collapse; border: 1px solid #E8EAED;">
                <thead>
                  <tr style="background-color: #F8F9FA; color: #5F6368; border-bottom: 2px solid #DADCE0;">
                    <th style="padding: 12px 10px; text-align: center; text-transform: uppercase; font-size: 11px;">No</th>
                    <th style="padding: 12px 10px; text-transform: uppercase; font-size: 11px;">Nama & NIK</th>
                    <th style="padding: 12px 10px; text-transform: uppercase; font-size: 11px;" class="hide-mobile">Nama BIB</th>
                    <th style="padding: 12px 10px; text-align: center; text-transform: uppercase; font-size: 11px;">Jarak</th>
                    <th style="padding: 12px 10px; text-align: center; text-transform: uppercase; font-size: 11px;">Jersey</th>
                    <th style="padding: 12px 10px; text-align: center; text-transform: uppercase; font-size: 11px;">No. BIB</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          </div>

          <p>Sebagai Kapten, Anda bertugas untuk mendistribusikan Racepack dan Nomor BIB ini kepada masing-masing anggota tim Anda. Seluruh informasi manifes dan E-Ticket juga dapat Anda akses sewaktu-waktu melalui halaman invoice Anda.</p>
          
          <div style="margin: 35px 0 0 0; text-align: center;">
            ${generateButton("Lihat Invoice & E-Ticket", `${baseUrl}/run/tiket-komunitas/${pId}`, true)}
          </div>
          `,
          "E-TICKET KOMUNITAS",
        );
        break;

      case "reminder_racepack_individu":
        subject = `Konfirmasi Pengambilan Race Pack Collection Confirmation | ${eventName} | ${nama}`;
        const qrCodeUrlReminder = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl + "/verify-ticket/" + pId)}`;

        htmlContent = generateHtml(
          `
          <h2 style="color: #F9AB00; margin-top: 0; font-size: 20px; font-weight: 500;">Penting: Pengingat Pengambilan Race Pack</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Hari pelaksanaan <strong>${eventName}</strong> semakin dekat! Jangan lupa untuk mengambil <em>Race Pack</em> Anda yang berisikan Jersey, BIB Number, dan fasilitas lari lainnya.</p>
          
          <div style="background-color: #FEF7E0; border-left: 4px solid #F9AB00; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0 0 5px 0; font-size: 13px; color: #B06000; font-weight: 700; text-transform: uppercase;">Informasi Pengambilan:</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #202124; line-height: 1.5;">
              <li>Cek Jadwal Pengambilan di <a href="${baseUrl}/run" style="color: #1A73E8;">Halaman Event</a>.</li>
              <li>Wajib membawa Identitas Asli (KTP/KTM).</li>
              <li>Jika diwakilkan, wajib membawa surat kuasa.</li>
            </ul>
          </div>

          <p><strong>Tunjukkan QR Code di bawah ini</strong> kepada panitia saat berada di lokasi pengambilan (Gate RPC) untuk mempercepat proses verifikasi Anda.</p>

          <div style="background-color: #F8F9FA; padding: 30px 20px; border: 1px solid #DADCE0; border-radius: 12px; margin: 25px 0; text-align: center;">
            <img src="${qrCodeUrlReminder}" alt="QR Code E-Ticket" width="160" height="160" style="display: block; margin: 0 auto 15px auto; border: 6px solid #fff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" />
            <p style="margin: 0 0 20px 0; font-size: 12px; color: #5F6368; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">SCAN SAAT PENGAMBILAN RACEPACK</p>
            
            <table style="width: 100%; text-align: left; font-size: 14px; color: #202124; border-collapse: collapse; background-color: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; color: #5F6368; width: 40%;"><strong>Nama Peserta</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; font-weight: bold;">: ${nama}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; color: #5F6368;"><strong>Kategori (Jarak)</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; font-weight: bold;">: ${detail?.jarak || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; color: #5F6368;"><strong>Ukuran Jersey</strong></td>
                <td style="padding: 12px 15px; border-bottom: 1px solid #F1F3F4; font-weight: bold;">: ${detail?.ukuranJersey || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 12px 15px; color: #5F6368;"><strong>Nomor BIB</strong></td>
                <td style="padding: 12px 15px; font-weight: 900; color: #1A73E8; font-size: 16px;">: ${detail?.bib || "-"}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 35px 0 0 0; text-align: center;">
            ${generateButton("Lihat E-Ticket di Website", `${baseUrl}/run/tiket/${pId}`)}
          </div>
        `,
          "PENGINGAT PENGAMBILAN RACE PACK",
        );
        break;

      case "reminder_racepack_komunitas":
        subject = `Konfirmasi Pengambilan Race Pack Collection Confirmation | ${eventName} | ${detail?.komunitas}`;
        const qrCodeKomunitasUrlReminder = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(baseUrl + "/verify-ticket/" + pId)}`;

        let tableRowsReminder = "";
        if (detail?.participants && Array.isArray(detail.participants)) {
          detail.participants.forEach((p: any, idx: number) => {
            tableRowsReminder += `
              <tr style="border-bottom: 1px solid #F1F3F4;">
                <td style="padding: 12px 10px; text-align: center; color: #5F6368;">${idx + 1}</td>
                <td style="padding: 12px 10px; font-weight: bold; color: #202124;">
                  ${p.nama || p.namaLengkap || "-"}<br>
                  <span style="font-size: 11px; color: #5F6368; font-weight: normal;">NIK: ${p.nik || "-"}</span>
                </td>
                <td style="padding: 12px 10px; text-align: center; color: #202124;">${p.kategori || p.jarak || "-"}</td>
                <td style="padding: 12px 10px; text-align: center; font-weight: bold; color: #202124;">${p.ukuranJersey || "-"}</td>
                <td style="padding: 12px 10px; font-weight: 900; color: #1A73E8; text-align: center; font-size: 14px;">${p.bib || p.nomorBIB || "-"}</td>
              </tr>
            `;
          });
        }

        htmlContent = generateHtml(
          `
          <h2 style="color: #F9AB00; margin-top: 0; font-size: 20px; font-weight: 500;">Penting: Pengingat Pengambilan Race Pack Kolektif</h2>
          ${salamPembuka}
          <p>Yth. Kapten <strong>${nama}</strong>,</p>
          <p>Hari pelaksanaan <strong>${eventName}</strong> semakin dekat! Jangan lupa untuk melakukan pengambilan <em>Race Pack</em> kolektif untuk komunitas/grup <strong>${detail?.komunitas}</strong>.</p>
          
          <div style="background-color: #FEF7E0; border-left: 4px solid #F9AB00; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0 0 5px 0; font-size: 13px; color: #B06000; font-weight: 700; text-transform: uppercase;">Informasi Pengambilan:</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #202124; line-height: 1.5;">
              <li>Cek Jadwal Pengambilan di <a href="${baseUrl}/run" style="color: #1A73E8;">Halaman Event</a>.</li>
              <li>Wajib menunjukkan QR Code ini di meja registrasi (Gate RPC).</li>
              <li>Jika Anda (Kapten) berhalangan hadir, harap bekali perwakilan dengan surat kuasa.</li>
            </ul>
          </div>

          <div style="background-color: #ffffff; padding: 25px 20px; border: 1px solid #DADCE0; border-radius: 12px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <div style="text-align: center; margin-bottom: 25px; padding-bottom: 25px; border-bottom: 2px dashed #E8EAED;">
              <img src="${qrCodeKomunitasUrlReminder}" alt="QR Code E-Ticket Grup" width="180" height="180" style="display: block; margin: 0 auto 15px auto; border: 8px solid #F8F9FA; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
              <p style="margin: 0; font-size: 13px; color: #5F6368; text-transform: uppercase; font-weight: 900; letter-spacing: 1.5px;">SCAN SAAT PENGAMBILAN RACEPACK</p>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #80868B;">Satu QR Code ini berlaku untuk memproses seluruh anggota grup Anda.</p>
            </div>

            <p style="margin: 0 0 15px 0; font-size: 14px; color: #1A73E8; text-transform: uppercase; font-weight: 900; letter-spacing: 1px;">DAFTAR MANIFES ANGGOTA</p>
            <div style="overflow-x: auto;">
              <table class="mobile-table" style="width: 100%; text-align: left; font-size: 13px; border-collapse: collapse; border: 1px solid #E8EAED;">
                <thead>
                  <tr style="background-color: #F8F9FA; color: #5F6368; border-bottom: 2px solid #DADCE0;">
                    <th style="padding: 12px 10px; text-align: center; text-transform: uppercase; font-size: 11px;">No</th>
                    <th style="padding: 12px 10px; text-transform: uppercase; font-size: 11px;">Nama & NIK</th>
                    <th style="padding: 12px 10px; text-align: center; text-transform: uppercase; font-size: 11px;">Jarak</th>
                    <th style="padding: 12px 10px; text-align: center; text-transform: uppercase; font-size: 11px;">Jersey</th>
                    <th style="padding: 12px 10px; text-align: center; text-transform: uppercase; font-size: 11px;">No. BIB</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRowsReminder}
                </tbody>
              </table>
            </div>
          </div>

          <div style="margin: 35px 0 0 0; text-align: center;">
            ${generateButton("Lihat Invoice & E-Ticket", `${baseUrl}/run/tiket-komunitas/${pId}`)}
          </div>
          `,
          "PENGINGAT PENGAMBILAN RACE PACK KOLEKTIF",
        );
        break;

      case "finisher":
        subject = `Sertifikat Finisher - ${eventName}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #202124; margin-top: 0; font-size: 20px; font-weight: 500;">Misi Selesai!</h2>
          ${salamPembuka}
          <p>Luar biasa, <strong>${nama}</strong>!</p>
          <p>Anda telah menuntaskan target kilometer lari Anda dengan sangat baik. E-Sertifikat Finisher Anda telah diterbitkan dan dapat diunduh.</p>
          <p>Terima kasih atas partisipasi dan semangat Anda. Sampai jumpa di garis start tahun berikutnya!</p>
          <div style="margin: 35px 0 0 0;">
            ${generateButton("Unduh Sertifikat", `${baseUrl}/virtual-run/dashboard`)}
          </div>
        `,
          "PENGHARGAAN FINISHER",
        );
        break;

      case "password_changed":
        subject = `Pemberitahuan Keamanan: Kata Sandi Berhasil Diubah`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1A73E8; margin-top: 0; font-size: 20px; font-weight: 500;">Kata Sandi Berhasil Diperbarui</h2>
          ${salamPembuka}
          <p>Yth. <strong>${nama}</strong>,</p>
          <p>Email ini adalah pemberitahuan otomatis bahwa kata sandi untuk akun Portal Layanan IKA UII DIY Anda baru saja berhasil diubah.</p>
          
          <div style="background-color: #FEF7E0; border-left: 4px solid #F29900; padding: 15px 20px; margin: 25px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #B06000; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">PERINGATAN KEAMANAN</p>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #202124; line-height: 1.6;">
              <li><strong>Jaga kerahasiaan akun Anda.</strong> Jangan pernah membagikan kata sandi kepada siapapun, termasuk pihak yang mengatasnamakan pengurus IKA UII DIY.</li>
              <li>Hindari melakukan penggantian kata sandi secara terus-menerus dalam waktu singkat untuk mencegah pembatasan (limitasi) akun otomatis oleh sistem keamanan kami.</li>
            </ul>
          </div>

          <p>Jika Anda merasa <strong>tidak pernah melakukan</strong> perubahan ini, segera hubungi Administrator atau lakukan reset kata sandi ulang melalui halaman login untuk mengamankan akun Anda.</p>

          <div style="margin: 35px 0 0 0;">
            ${generateButton("Masuk ke Portal Login", `${baseUrl}/login`)}
          </div>
        `,
          "SISTEM KEAMANAN AKUN",
        );
        break;

      case "agenda_registration":
        subject = `✅ Pendaftaran Berhasil - ${detail?.judulAgenda || "Agenda IKA UII DIY"}`;
        htmlContent = generateHtml(
          `
          <h2 style="color: #1E8E3E; margin-top: 0; font-size: 20px; font-weight: 500;">Pendaftaran Anda Berhasil!</h2>
          ${salamPembuka}
          <p>Halo <strong>${nama}</strong>,</p>
          <p>Terima kasih! Pendaftaran Anda untuk agenda berikut telah berhasil tercatat dalam sistem kami.</p>
          
          <div style="background-color: #F8F9FA; border: 1px solid #DADCE0; padding: 20px; margin: 25px 0; border-radius: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 11px; color: #5F6368; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Detail Agenda</p>
            <p style="margin: 0 0 15px 0; font-size: 18px; color: #202124; font-weight: 700;">${detail?.judulAgenda || "-"}</p>
            <table style="width: 100%; font-size: 14px; color: #202124; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #5F6368; width: 40%;"><strong>📅 Tanggal</strong></td>
                <td style="padding: 6px 0;">: ${detail?.tanggal ? new Date(detail.tanggal).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5F6368;"><strong>🕐 Waktu</strong></td>
                <td style="padding: 6px 0;">: ${detail?.waktu || "-"} WIB</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5F6368;"><strong>📍 Format</strong></td>
                <td style="padding: 6px 0;">: ${detail?.format || "-"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5F6368;"><strong>👤 Peserta</strong></td>
                <td style="padding: 6px 0;">: ${detail?.tipeDaftar || "Individu"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #5F6368;"><strong>🎫 ID Tiket</strong></td>
                <td style="padding: 6px 0; font-family: monospace; color: #1A73E8; font-weight: bold;">: ${detail?.registeredId || "-"}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #E6F4EA; border: 1px solid #CEEAD6; padding: 15px 20px; margin: 20px 0; border-radius: 8px;">
            <p style="margin: 0; font-size: 13px; color: #1E8E3E; font-weight: 700;">💡 Simpan Email Ini</p>
            <p style="margin: 6px 0 0 0; font-size: 13px; color: #3C4043; line-height: 1.5;">
              Email ini adalah bukti pendaftaran Anda. Anda mungkin membutuhkan ID Tiket di atas saat hari pelaksanaan. Pantau email Anda untuk informasi lanjutan dari panitia.
            </p>
          </div>

          <div style="margin: 35px 0 0 0;">
            ${generateButton("Lihat Detail Agenda", `${baseUrl}/agenda`, true)}
          </div>
          `,
          "KONFIRMASI PENDAFTARAN AGENDA",
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 },
        );
    }


    const mailOptions: any = {
      from: `"DPW IKA UII DIY" <${officialEmail}>`,
      to: email,
      replyTo: officialEmail,
      subject: subject,
      html: htmlContent,
    };

    if (attachmentBase64) {
      const base64Data = attachmentBase64.split("base64,")[1];
      mailOptions.attachments = [
        {
          filename: `E-Certificate_${nama.replace(/\s+/g, "_")}.pdf`,
          content: base64Data,
          encoding: "base64",
        },
      ];
    }

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: "Success" }, { status: 200 });
  } catch (error: any) {
    console.error("Critical Mail Error:", error);
    return NextResponse.json({ error: "Gagal mengirim email. Silakan coba lagi." }, { status: 500 });
  }
}
