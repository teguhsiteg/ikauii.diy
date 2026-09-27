# 🏃‍♂️ Panduan & Dokumentasi Arsitektur Event Running (Offline, Virtual Run, & Bot Telegram)

Dokumen ini memuat seluruh spesifikasi sistem, struktur data, alur pembayaran, dan integrasi Bot Telegram yang siap diterapkan (*reusable*) pada website event running lainnya.

---

## 📑 Daftar Isi
1. [Arsitektur & Tech Stack](#1-arsitektur--tech-stack)
2. [Fitur Offline Run (Individu & Komunitas)](#2-fitur-offline-run-individu--komunitas)
3. [Fitur Virtual Run](#3-fitur-virtual-run)
4. [Sistem Upgrade Kategori Jarak](#4-sistem-upgrade-kategori-jarak)
5. [Bot Telegram Verifikasi Pembayaran & Asisten Admin](#5-bot-telegram-verifikasi-pembayaran--asisten-admin)
6. [Struktur Database (Firebase Firestore)](#6-struktur-database-firebase-firestore)
7. [Environment Variables (.env)](#7-environment-variables-env)
8. [Checklist Penerapan di Proyek Baru](#8-checklist-penerapan-di-proyek-baru)

---

## 1. Arsitektur & Tech Stack

- **Framework:** Next.js (App Router, TypeScript, Tailwind CSS)
- **Database:** Firebase Firestore & Firebase Admin SDK
- **File Storage:** Cloudinary (Upload langsung client-side via Unsigned Upload Preset)
- **Email Service:** Nodemailer / SMTP (Gmail/Google Workspace / Custom Mail Server)
- **Payment Gateway (Opsional):** Midtrans Snap + Manual Transfer Bank
- **Bot Platform:** Telegram Bot API (Webhook + Inline Keyboard Callback)

---

## 2. Fitur Offline Run (Individu & Komunitas)

### A. Pendaftaran Individu & Bulk Multi-Tiket
- Form pendaftaran 1 halaman / multi-step dengan auto-save ke `localStorage`.
- Mendukung pemesanan lebih dari 1 tiket sekaligus (Pemesan Utama + data pelari tiap tiket).
- Data pelari mencakup: NIK, Nama di BIB, Ukuran Jersey, Golongan Darah, Riwayat Penyakit, Kontak Darurat, dan Domisili.
- Dukungan Kode Promo Diskon (potongan harga per tiket atau kuota terbatas).

### B. Pendaftaran Komunitas / Grup
- Pendaftaran kolektif oleh Kapten Komunitas.
- Input data anggota via form dinamis atau template Excel komunitas.
- Kalkulasi total tagihan akumulatif dengan diskon khusus komunitas (jika ada).

### C. Dashboard & Manajemen Admin Offline
- **Tabel Interaktif:** Fitur sorting kolom (▲/▼) untuk BIB, Nama, Kategori, Tagihan, Status, dan Waktu Daftar.
- **Normalisasi Skema Data:** Mendukung sinkronisasi data antar form lama, form baru, dan hasil import Excel tanpa resiko *missing fields*.
- **Penomoran BIB Otomatis per Kategori:**
  - Kategori 5K: `5001`, `5002`, dst.
  - Kategori 10K: `10001`, `10002`, dst.
  - Kategori 21K: `21001`, `21002`, dst.
  - Tersedia tombol **Reset Urutan BIB (0)** jika ingin memulai kembali dari nomor 001.
- **Import & Export Excel:**
  - Parsing nominal otomatis (`Rp 150.000` -> `150000`).
  - Opsi: *Generate BIB Otomatis* atau *Gunakan BIB dari Excel*.
- **Pencarian Peserta di Footer Web:**
  - Modal flat-minimalist di footer web publik untuk cek status pendaftaran (hanya menampilkan Nama, Gender, dan Kategori Jarak demi privasi).

---

## 3. Fitur Virtual Run

### A. Dashboard Peserta Virtual Run
- **Target Kilometer Tracker:** Progress bar akumulasi jarak lari menuju target (contoh: 21K / 42K).
- **Submit Bukti Lari:** Peserta mengunggah foto treadmill / aplikasi lari (Strava, Garmin, Nike Run) beserta tanggal, durasi, dan jarak tempuh (Km).
- **Leaderboard Publik:** Klasemen peringkat pelari berdasarkan total kilometer yang telah diverifikasi.
- **E-Certificate & Medali Finisher:** Download sertifikat digital otomatis setelah mencapai target kilometer.

### B. Panel Verifikasi Virtual Run
- Verifikasi persetujuan jarak lari (Km) peserta secara instan.
- Validasi log aktivitas dan input nomor resi pengiriman medali/jersey.

---

## 4. Sistem Upgrade Kategori Jarak

Fitur yang memungkinkan peserta yang sudah **Lunas** untuk pindah ke kategori jarak yang lebih tinggi (misal: 5K ke 10K).

1. **Alur Peserta:**
   - Peserta membuka halaman e-ticket mereka (`/tiket-offline/[id]` atau `/run/checkout/[id]`).
   - Memilih kategori baru yang biayanya lebih tinggi.
   - Sistem menghitung selisih biaya secara otomatis: `Selisih = Biaya Kategori Baru - Nominal yang Sudah Dibayar`.
   - Peserta mentransfer selisih biaya dan mengunggah bukti transfer baru di `/run/checkout-upgrade/[id]`.
2. **Alur Approval Admin:**
   - Admin menerima notifikasi Telegram atau melihat label ungu `UPGRADE KE [Kategori]` di dashboard admin.
   - Saat di-*Approve*, sistem mengupdate kategori tiket, menerbitkan nomor BIB baru sesuai kategori baru, dan mengirimkan E-Ticket baru via email.
3. **Blast Email Penawaran Upgrade:**
   - Tombol **"Kirim Info Upgrade (Email)"** di admin offline untuk mengirimkan pemberitahuan E-Ticket dan tawaran upgrade jarak kepada peserta sebelum hari H.

---

## 5. Bot Telegram Verifikasi Pembayaran & Asisten Admin

### A. Alur Notifikasi Pembayaran Masuk
Ketika peserta selesai mengunggah struk pembayaran di web:
1. Web mengirim POST ke `/api/telegram/notify`.
2. Bot Telegram mengirim foto struk ke chat Admin lengkap dengan rincian:
   - Nama Event (dinamis dari database settings).
   - Nama Peserta, No WhatsApp, Email, Kategori Jarak.
   - Total Tagihan / Biaya Upgrade / Donasi.
   - Tombol Inline: `[ ✅ Setujui & Terbitkan BIB ]` dan `[ ❌ Tolak ]`.

### B. Approval Instan via Tombol Telegram (Webhook)
- **Tombol `[ ✅ Setujui ]` diklik:**
  - Menjalankan transaksi atomic di Firestore.
  - Mengambil counter BIB kategori terkait dan generate nomor BIB baru.
  - Mengubah status pembayaran menjadi `Lunas`.
  - Mengirim email E-Ticket resmi (dilengkapi QR Code scan racepack) ke email peserta.
  - Memperbarui caption Telegram menjadi keterangan sukses berwarna hijau beserta nama admin dan waktu approval.
- **Tombol `[ ❌ Tolak ]` diklik:**
  - Mengubah status pembayaran menjadi `Batal`.
  - Memperbarui pesan Telegram dengan status ditolak.

### C. Menu Keyboard & Fitur Asisten Bot
Gunakan command `/start` atau `/menu` di bot Telegram untuk memunculkan tombol:
1. **`📊 Ringkasan Pendaftaran` (`/stats`):**
   - Menampilkan total pelari lunas, per kategori (5K, 10K, 21K), komunitas, virtual run, dan tagihan pending secara live.
2. **`🔍 Cari Peserta` (`/cari [kata kunci]`):**
   - Pencarian cerdas: ketik langsung nama / no WhatsApp / BIB / email.
   - Bot membalas rincian lengkap peserta: Nama, BIB, Gender, Jersey, Golongan Darah, Kontak Darurat, Riwayat Penyakit, dan Status Bayar.
3. **`⏳ Belum Bayar` (`/pending`):**
   - Menampilkan daftar peserta yang belum menyelesaikan transaksi untuk follow-up cepat.
4. **`🆔 Info Chat ID` (`/chatid`):**
   - Mengetahui Chat ID pengguna untuk konfigurasi `.env`.

---

## 6. Struktur Database (Firebase Firestore)

### 1. Koleksi `offline_participants` (Peserta Offline Individu)
```json
{
  "namaLengkap": "Budi Santoso",
  "namaBib": "BUDI",
  "nomorBIB": "5001",
  "jarak": "5K",
  "paketNama": "5K Umum",
  "paketId": "pkg_5k_umum",
  "ukuranJersey": "L",
  "jenisKelamin": "Laki-laki",
  "nik": "3404XXXXXXXXXXXX",
  "golonganDarah": "O",
  "riwayatPenyakit": "Tidak ada",
  "noWA": "08123456789",
  "email": "budi@example.com",
  "namaDarurat": "Siti (Istri)",
  "hubunganDarurat": "Istri",
  "waDarurat": "08129876543",
  "kota": "Sleman",
  "alamat": "Jl. Kaliurang KM 14",
  "statusPembayaran": "Lunas",
  "totalTagihan": 150000,
  "hargaAsli": 150000,
  "buktiBayarUrl": "https://res.cloudinary.com/.../struk.jpg",
  "waktuDaftar": "2026-09-27T07:00:00.000Z",
  "waktuLunas": "2026-09-27T07:15:00.000Z",
  "isRacepackTaken": false,
  "upgradeRequest": {
    "newKategori": "10K",
    "newPaketId": "pkg_10k_umum",
    "newPaketNama": "10K Umum",
    "selisih": 50000,
    "waktuRequest": "2026-09-27T08:00:00.000Z"
  }
}
```

### 2. Koleksi `pengaturan/counter_bib_offline` (Urutan Nomor Dada)
```json
{
  "lastBib3K": 12,
  "lastBib5K": 154,
  "lastBib10K": 89,
  "lastBib21K": 45
}
```

### 3. Koleksi `settings/virtual_run` (Konfigurasi Global Event)
```json
{
  "offlineJudul": "IKA UII DIY RUN 2026",
  "eventName": "IKA UII DIY RUN 2026",
  "telegramBotToken": "8584533255:AAEi929fOZzYbmDmGUrQ4SjxFFZdz_bbV3s",
  "telegramChatId": "1527931612",
  "manualBank": "Bank Mandiri",
  "manualRekening": "1370012345678",
  "manualNama": "Panitia Event Running",
  "offlineAdminFee": 5000,
  "offlinePackages": [
    {
      "id": "pkg_5k",
      "nama": "5K Fun Run",
      "jarak": "5K",
      "harga": 150000,
      "kuota": 500
    },
    {
      "id": "pkg_10k",
      "nama": "10K Race",
      "jarak": "10K",
      "harga": 200000,
      "kuota": 300
    }
  ]
}
```

---

## 7. Environment Variables (.env)

```env
# URL & Core
NEXT_PUBLIC_BASE_URL=https://domain-event-anda.com
INTERNAL_API_SECRET=rahasia-api-internal-123

# Firebase Client
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=project-event.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=project-event
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=project-event.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# Firebase Admin Service Account
FIREBASE_PROJECT_ID=project-event
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project-event.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"

# Cloudinary (Direct Upload)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=nama_cloud_anda
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=preset_event_running

# SMTP Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=panitia@domain-event.com
EMAIL_PASS=app_password_16_digit
EMAIL_FROM="Panitia Event Running <panitia@domain-event.com>"

# Telegram Bot Integration
TELEGRAM_BOT_TOKEN=8584533255:AAEi929fOZzYbmDmGUrQ4SjxFFZdz_bbV3s
TELEGRAM_ADMIN_CHAT_ID=1527931612
```

---

## 8. Checklist Penerapan di Proyek Baru

1. **Setup Bot Telegram di @BotFather:**
   - Buat bot baru via `/newbot` untuk mendapatkan `TELEGRAM_BOT_TOKEN`.
   - Daftarkan URL Webhook bot:
     ```bash
     curl -F "url=https://domain-event-anda.com/api/telegram/webhook" https://api.telegram.org/bot<BOT_TOKEN>/setWebhook
     ```
2. **Kirim Pesan Pertama ke Bot:**
   - Buka bot di Telegram, kirim `/start` untuk mendapatkan Chat ID Anda, lalu simpan di `TELEGRAM_ADMIN_CHAT_ID`.
3. **Salin Endpoint & Lib Utama:**
   - `lib/telegram.ts` (Fungsi kirim notifikasi, callback query, update caption).
   - `app/api/telegram/webhook/route.ts` (Handler webhook, approval, menu statistik, & pencarian peserta).
   - `app/api/telegram/notify/route.ts` (Trigger notifikasi bukti bayar).
   - `lib/core-email.ts` (Template email konfirmasi, E-Ticket dengan QR Code, dan penawaran upgrade).
   - `app/admin-vr/offline/AdminIndividu.tsx` (Dashboard Admin dengan normalisasi data, sorting, & filter).
4. **Deploy:**
   - Lakukan build & deploy ke Vercel / Firebase Hosting / VPS. Webhook bot langsung aktif menangani verifikasi real-time!
