export async function executeSendWa(body: any) {
  try {
    const { type, phone, nama, detail } = body;

    // 1. Validasi Input Dasar
    if (!phone || !nama) {
      return { success: false, error: "Nomor WA dan Nama wajib diisi." };
    }

    // 2. Sanitasi Nomor WA (Pastikan hanya angka dan diawali 62)
    let targetWa = phone.replace(/\D/g, ""); // Gunakan regex \D untuk menghapus semua non-digit
    if (targetWa.startsWith("0")) {
      targetWa = "62" + targetWa.substring(1);
    } else if (!targetWa.startsWith("62")) {
      // Jika nomor diawali angka selain 0 dan 62 (misal langsung 812), tambahkan 62
      targetWa = "62" + targetWa;
    }

    // 3. Siapkan Template Pesan Berdasarkan 'type'
    let messageText = "";

    if (type === "member_verified") {
      messageText =
        `*PEMBERITAHUAN RESMI DPW IKA UII YOGYAKARTA*\n` +
        `-----------------------------------------\n\n` +
        `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
        `Halo, Bapak/Ibu *${nama}*.\n\n` +
        `Selamat! Kami informasikan bahwa pendaftaran keanggotaan/kepengurusan Anda telah *DISETUJUI* oleh Admin.\n\n` +
        `🔹 *Nomor Induk Anggota (NIA):*\n` +
        `*${detail.nia}*\n\n` +
        `Mulai saat ini, Anda sudah dapat mengakses sistem layanan terpadu dan Kartu Tanda Anggota (E-KTA) Digital melalui portal resmi kami.\n\n` +
        `Terima kasih atas dedikasi dan sinergi Anda bersama IKA UII DIY. Semoga selalu diberikan kelancaran dalam setiap aktivitas.\n\n` +
        `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `Salam,\n` +
        `*Sekretariat DPW IKA UII DIY*\n` +
        `_Pesan ini dikirim otomatis oleh sistem._`;
    } else if (type === "reject_anggota") {
      messageText =
        `*INFORMASI PENDAFTARAN IKA UII DIY*\n` +
        `-----------------------------------------\n\n` +
        `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
        `Halo, Bapak/Ibu *${nama}*.\n\n` +
        `Terima kasih atas antusiasme Anda mendaftar di sistem IKA UII DIY. Namun mohon maaf, pendaftaran Anda saat ini *BELUM DAPAT KAMI PROSES*.\n\n` +
        `📝 *Catatan / Alasan Penolakan:*\n` +
        `_${detail.alasan}_\n\n` +
        `Silakan perbaiki kelengkapan data Anda sesuai catatan di atas, atau hubungi Admin Sekretariat jika Anda membutuhkan bantuan lebih lanjut.\n\n` +
        `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `Salam,\n` +
        `*Sekretariat DPW IKA UII DIY*\n` +
        `_Pesan ini dikirim otomatis oleh sistem._`;
    } else if (type === "send_kta") {
      if (detail.isComplete === false) {
        messageText =
          `*PEMBERITAHUAN E-KTA IKA UII DIY*\n` +
          `-----------------------------------------\n\n` +
          `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
          `Halo, Bapak/Ibu *${nama}*.\n\n` +
          `Kami menginformasikan bahwa E-KTA Anda sedang kami proses. Namun, untuk dapat menerbitkan E-KTA tersebut dengan sempurna, terdapat beberapa *data profil Anda yang belum lengkap* (terutama Foto Profil).\n\n` +
          `Untuk melengkapinya dengan cepat dan mudah (tanpa perlu login), silakan klik tautan khusus berikut:\n\n` +
          `🔗 *Link Lengkapi Profil:*\n` +
          `https://ikadiy.uii.ac.id/lengkapi-profil/${detail.userId}\n\n` +
          `Setelah Anda melengkapi data dan menyimpannya, sistem akan langsung menampilkan Kartu Anda untuk dapat diunduh.\n\n` +
          `Terima kasih atas partisipasi Anda.\n\n` +
          `Salam,\n` +
          `*Sekretariat DPW IKA UII DIY*\n` +
          `_Pesan ini dikirim otomatis oleh sistem._`;
      } else {
        messageText =
          `*KARTU IDENTITAS DIGITAL (E-KTA) IKA UII DIY*\n` +
          `-----------------------------------------\n\n` +
          `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
          `Halo, Bapak/Ibu *${nama}*.\n\n` +
          `Berikut ini adalah tautan resmi untuk mengakses Kartu Tanda Anggota (E-KTA) Digital Anda:\n\n` +
          `💳 *Link Akses E-KTA Anda:*\n` +
          `https://ikadiy.uii.ac.id/kta/${detail.userId}\n\n` +
          `💡 *CARA MENGAKSES & MENYIMPAN E-KTA:*\n` +
          `1. Klik tautan E-KTA di atas.\n` +
          `2. Untuk Dapat mengunduh E-KTA, Anda diwajibkan untuk *Login* terlebih dahulu. (Halaman login juga dapat diakses langsung via: https://ikadiy.uii.ac.id/login)\n` +
          `3. Silakan masuk menggunakan Email dan Kata Sandi akun Anda.\n` +
          `   _(Catatan: Jika lupa kata sandi, silakan klik tulisan 'Lupa Sandi' di halaman login tersebut)._\n` +
          `4. Setelah berhasil masuk, E-KTA Anda akan terbuka. Pilih tombol *Unduh KTA (Versi Gambar / PNG)*.\n` +
          `5. Gambar E-KTA akan otomatis tersimpan di galeri/file HP Anda.\n` +
          `6. Anda dapat menunjukkan E-KTA ini saat melakukan presensi acara IKA UII DIY atau untuk memvalidasi klaim fasilitas pada mitra bisnis alumni.\n\n` +
          `Gunakan identitas digital ini dengan bijak. Terima kasih.\n\n` +
          `Salam,\n` +
          `*Sekretariat DPW IKA UII DIY*\n` +
          `_Pesan ini dikirim otomatis oleh sistem._`;
      }
    } else if (type === "race_finish") {
      messageText =
        `*🎉 SELAMAT! FINISHER IKA UII DIY RUN 🎉*\n` +
        `-----------------------------------------\n\n` +
        `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
        `Hai pelari hebat, *${nama}*!\n\n` +
        `Luar biasa! Anda telah berhasil menaklukkan rute dan mencapai garis finish pada kategori *${detail.kategori}*.\n\n` +
        `⏱️ *Catatan Waktu Anda (Unofficial):*\n` +
        `*${detail.waktu}*\n\n` +
        `Terima kasih atas semangat dan energi luar biasa Anda hari ini. Selamat beristirahat dan sampai jumpa di garis start berikutnya!\n\n` +
        `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `- Organized by DPW IKA UII DIY -\n` +
        `_Pesan ini dikirim otomatis, mohon tidak membalas._`;
    } else if (type === "group_run_registration") {
      messageText =
        `*INVOICE REGISTRASI GROUP RUN - IKA UII DIY*\n` +
        `-----------------------------------------\n\n` +
        `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
        `Halo, Kapten *${nama}* dari tim/komunitas *${detail.komunitas}*.\n\n` +
        `Terima kasih telah mendaftarkan tim Anda! Data manifes peserta telah berhasil masuk ke sistem kami.\n\n` +
        `📝 *Rincian Pendaftaran:*\n` +
        `- Total Manifes: ${detail.totalPeserta} Orang\n` +
        `- Tiket Gratis (Promo): ${detail.gratis} Tiket\n\n` +
        `💰 *TOTAL TAGIHAN: Rp ${detail.totalTagihan}*\n\n` +
        `Silakan segera lakukan pembayaran sesuai instruksi di website dan hubungi Admin untuk konfirmasi pembayaran agar status tim Anda menjadi AKTIF.\n\n` +
        `Wassalamu'alaikum Warahmatullahi Wabarakatuh.\n\n` +
        `- Organized by DPW IKA UII DIY -\n` +
        `_Pesan ini dikirim otomatis oleh sistem._`;
    } else {
      return { success: false, error: "Tipe pesan tidak dikenali." };
    }

    // 4. Eksekusi Request ke Server Fonnte menggunakan JSON
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN!,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        // 👈 MENGGUNAKAN JSON.stringify
        target: targetWa,
        message: messageText,
        countryCode: "62", // Memaksa fonnte mengenali sebagai nomor Indonesia
      }),
    });

    const result = await response.json();

    // 5. Tangkap Balasan Fonnte
    if (result.status) {
      return { success: true, message: "Pesan WA berhasil dikirim" };
    } else {
      return { success: false, error: result.reason || "Ditolak oleh server Fonnte" };
    }
  } catch (error: any) {
    console.error("WA API Error:", error);
    return { success: false, error: error.message };
  }
}
