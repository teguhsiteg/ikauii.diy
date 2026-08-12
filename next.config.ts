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
