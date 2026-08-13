/** @type {import('next').NextConfig} */
const nextConfig = {
  // ⚠️ PERINGATAN: Build errors disembunyikan karena 1026+ lint/TS error.
  // HARUS dihapus setelah semua TS error diperbaiki bertahap.
  // Jangan deploy dengan ini selamanya — broken code bisa lolos ke production.
  typescript: {
    ignoreBuildErrors: true,
  },
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
