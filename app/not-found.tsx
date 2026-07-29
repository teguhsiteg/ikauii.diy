"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center animate-in fade-in duration-700 pt-40 pb-20 bg-[#F8F9FA] font-sans text-[#202124]">
      {/* Ikon Gembok / File Rusak Ala Workspace */}
      <div className="w-32 h-32 mb-8 text-[#DADCE0] relative">
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
        </svg>
        {/* Tanda Silang/Silang Kecil */}
        <div className="absolute -bottom-2 -right-2 bg-[#F8F9FA] rounded-full p-1">
          <svg
            className="w-10 h-10 text-[#D93025]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
      </div>

      <h1 className="text-6xl md:text-8xl font-black text-[#DADCE0] mb-4 tracking-tighter">
        404
      </h1>

      <h2 className="text-xl md:text-2xl font-bold mb-3 text-[#202124]">
        Halaman Tidak Ditemukan
      </h2>

      <p className="text-[#5F6368] max-w-md mb-10 text-sm md:text-base leading-relaxed">
        URL yang Anda tuju mungkin salah ketik, telah dihapus, atau Anda tidak
        memiliki izin untuk mengakses direktori ini.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          Kembali ke Beranda
        </Link>

        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-white border border-[#DADCE0] text-[#1A73E8] hover:bg-[#E8F0FE] hover:border-[#1A73E8]/30 font-bold rounded-lg shadow-sm transition-colors text-sm flex items-center justify-center gap-2"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali Sebelumnya
        </button>
      </div>
    </main>
  );
}
