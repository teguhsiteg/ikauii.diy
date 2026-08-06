# SIM DPW IKA DIY

**Sistem Informasi Manajemen**
**Dewan Pimpinan Wilayah Ikatan Keluarga Alumni UII**
**Daerah Istimewa Yogyakarta**

Platform digital terpadu untuk manajemen keanggotaan, event (offline/virtual run), masterclass, direktori bisnis, e-office, dan layanan alumni IKA UII DIY.

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Firebase Firestore |
| Auth | Firebase Authentication + Admin SDK |
| Payment | Midtrans Snap |
| Email | Nodemailer (Gmail SMTP) |
| WhatsApp | Fonnte API |
| reCAPTCHA | Google reCAPTCHA Enterprise |
| Maps | Leaflet + React-Leaflet |
| Deployment | Firebase Hosting |

---

## Environment Variables

Buat file `.env.local` di root project:

```bash
# Firebase Client (NEXT_PUBLIC_ = exposed to browser)
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=xxx
NEXT_PUBLIC_BASE_URL=https://ikadiy.uii.ac.id

# Firebase Admin (SERVER ONLY — NEVER exposed to client)
FIREBASE_PROJECT_ID=xxx
FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Internal API Auth
INTERNAL_API_SECRET=your-random-secret-32-chars

# Email (Gmail SMTP)
EMAIL_USER=ika.diy@uii.ac.id
EMAIL_PASS=your-app-password

# WhatsApp (Fonnte)
FONNTE_TOKEN=your-fonnte-token

# reCAPTCHA Enterprise
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=xxx

# Strava OAuth
STRAVA_CLIENT_ID=xxx
STRAVA_CLIENT_SECRET=xxx
```

> ⚠️ **PENTING:** `INTERNAL_API_SECRET` wajib diset — tidak ada fallback. Kalau kosong, sistem enkripsi (token Strava) akan gagal startup.

---

## Development

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Lint
npm run lint

# Build production
npm run build

# Start production
npm run start
```

---

## Struktur Project

```
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (public)/              # Public landing pages
│   ├── (dashboard)/dashboard/ # Admin dashboard
│   ├── admin-vr/              # Virtual/Offline Run admin
│   ├── api/                   # API Routes
│   │   ├── auth/              # Auth endpoints
│   │   ├── midtrans/          # Midtrans payment token
│   │   ├── midtrans-webhook/  # Midtrans webhook handler
│   │   ├── midtrans-masterclass/
│   │   ├── vr-midtrans/       # VR/Offline payment token
│   │   ├── send-email/        # Email notification
│   │   ├── send-wa/           # WhatsApp notification
│   │   ├── import-excel/      # Batch member import
│   │   └── verify-recaptcha/  # Bot detection
│   ├── run/                   # Offline run registration
│   ├── virtual-run/           # Virtual run module
│   ├── masterclass/           # Masterclass module
│   └── ...
├── components/                # Shared React components
├── lib/
│   ├── firebase.ts            # Firebase client SDK
│   ├── firebase-admin.ts      # Firebase Admin SDK (server)
│   ├── crypto.ts              # AES-256 encryption (Strava tokens)
│   └── rate-limit.ts          # API rate limiting
├── middleware.ts              # Edge JWT verification
└── ...
```

---

## Security

- **JWT Edge Verification:** middleware verifies Firebase ID tokens using `jose` + Google JWKS
- **AES-256 Encryption:** Strava access/refresh tokens encrypted at rest
- **Anti Price Manipulation:** All Midtrans endpoints fetch harga from database, never trust client
- **Rate Limiting:** In-memory rate limiter on sensitive endpoints (email, WA, reset password)
- **Internal API Auth:** Server-to-server calls secured via `x-internal-secret` header
- **reCAPTCHA Enterprise:** Bot detection on public forms

---

## License

Private — DPW IKA UII DIY © 2026
