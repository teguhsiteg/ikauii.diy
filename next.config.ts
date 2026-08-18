/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript type-check TETAP berjalan saat build (ignoreBuildErrors sudah DIHAPUS).
  // ESLint style rules (no-explicit-any, no-unescaped-entities, dll.) masih banyak
  // warisan — jalankan manual via `npm run lint`; jangan blokir build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Externalize package server-only (firebase-admin → @google-cloud/firestore → @opentelemetry/api)
  // agar tidak di-bundle webpack. Mencegah bug dev-mode Next 15.0.x:
  // "Cannot find module './vendor-chunks/@opentelemetry.js'".
  serverExternalPackages: [
    "firebase-admin",
    "@google-cloud/firestore",
    "@opentelemetry/api",
  ],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: 'https://suratdigitalv2.firebaseapp.com/__/auth/:path*',
      },
    ];
  },
};

export default nextConfig;
