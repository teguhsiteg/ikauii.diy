"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function FooterPublic() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Deteksi scroll untuk memunculkan tombol Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer className="bg-[#0B1221] text-white pt-16 border-t-4 border-yellow-500 relative overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12">
            {/* Kolom 1: Info IKA UII */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src="/logo-dpp-ika.png"
                  alt="Logo"
                  className="w-16 h-16 object-contain"
                />
                <div>
                  <p className="font-extrabold text-2xl leading-tight text-white">
                    DPW IKA UII
                  </p>
                  <p className="text-xs text-yellow-500 font-bold uppercase tracking-widest">
                    Daerah Istimewa Yogyakarta
                  </p>
                </div>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Wadah silaturahmi, sinergi, dan kolaborasi alumni Universitas
                Islam Indonesia yang berdomisili dan berkiprah di Provinsi DIY.
              </p>
            </div>

            {/* Kolom 2: Kontak & Alamat */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-4 h-1 bg-yellow-500 rounded-full"></span>{" "}
                Hubungi Kami
              </h3>
              <ul className="space-y-4 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-500 mt-1">📍</span>
                  <span>
                    Sekretariat Kampus Terpadu UII,
                    <br />
                    Jl. Kaliurang KM 14.5 Sleman, Yogyakarta
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-yellow-500">✉️</span>
                  <a
                    href="mailto:ika.diy@uii.ac.id"
                    className="hover:text-yellow-400 transition-colors"
                  >
                    ika.diy@uii.ac.id
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-yellow-500">📞</span>
                  <span>+62 851 7959 4146</span>
                </li>
              </ul>
            </div>

            {/* Kolom 3: Donasi Section */}
            <div>
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-4 h-1 bg-yellow-500 rounded-full"></span>{" "}
                Mari Berkontribusi
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <p className="text-slate-300 text-sm mb-4">
                  Dukung program sosial dan pengembangan almamater melalui
                  donasi terbaik Anda.
                </p>
                <div className="bg-white p-4 rounded-xl text-center">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                    Bank BPD DIY 
                  </p>
                  <p className="text-xl font-extrabold text-blue-950 tracking-wider mb-1">
                    00 1111 00 1200
                  </p>
                  <p className="text-slate-600 font-medium text-xs">
                    a.n. DPW IKA UII DIY
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 bg-black/40 relative z-10">
          <div className="max-w-7xl mx-auto px-4 py-5 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p>
              &copy; {new Date().getFullYear()} DPW IKA UII DIY. Hak Cipta
              Dilindungi.
            </p>
            <p>Dikembangkan oleh Bidang Media & Publikasi</p>
          </div>
        </div>
      </footer>

      {/* BACK TO TOP BUTTON */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-yellow-500 text-blue-950 rounded-full shadow-2xl hover:bg-yellow-400 hover:-translate-y-1 transition-all duration-300 ${
          showTopBtn
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Kembali ke atas"
      >
        <svg
          className="w-6 h-6 font-bold"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M5 15l7-7 7 7"
          />
        </svg>
      </button>
    </>
  );
}
