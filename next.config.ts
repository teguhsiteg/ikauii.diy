import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hapus output: "export" agar Next.js berjalan dalam mode server (SSR) [cite: 2026-03-03]

  images: {
    // Tetap gunakan unoptimized jika kamu menggunakan URL eksternal (Cloudinary/Firebase)
    // tanpa konfigurasi loader tambahan [cite: 2026-03-03]
    unoptimized: true,
  },

  // Opsional: Untuk menghilangkan warning root Turbopack di terminalmu
  // experimental: { turbopack: { root: './' } }
};

export default nextConfig;
