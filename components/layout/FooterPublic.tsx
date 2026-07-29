"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function FooterPublic() {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [landingData, setLandingData] = useState<any>(null);

  // 1. Deteksi scroll untuk memunculkan tombol Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 2. Fetch Data Pengaturan dari Firestore
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "landing_page");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setLandingData(docSnap.data());
        }
      } catch (error) {
        console.error("Gagal menarik data pengaturan footer:", error);
      }
    };
    fetchSettings();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🔥 Format tanggal pembaruan otomatis (Mengikuti waktu rilis/akses saat ini)
  const lastUpdated = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
                <div className="bg-white p-4 rounded-xl text-center shadow-lg">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {landingData?.bankName || "Bank BPD DIY"}
                  </p>
                  <p className="text-xl font-extrabold text-blue-950 tracking-wider mb-1 font-mono">
                    {landingData?.bankNumber || "00 1111 00 1200"}
                  </p>
                  <p className="text-slate-600 font-medium text-xs">
                    {landingData?.bankOwner
                      ? `a.n. ${landingData.bankOwner}`
                      : "a.n. DPW IKA UII DIY"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ==========================================
              TAUTAN CEPAT & VISITOR COUNTER
              ========================================== */}
          <div className="border-t border-white/10 py-6 flex flex-col md:flex-row justify-between items-center gap-4 select-none text-center md:text-left">
            {/* Tautan Cepat */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-6 gap-y-2 text-xs font-semibold text-slate-400">
              <Link
                href="/berita"
                className="hover:text-yellow-400 transition-colors"
              >
                Berita & Rilis
              </Link>
              <Link
                href="/agenda"
                className="hover:text-yellow-400 transition-colors"
              >
                Agenda Kegiatan
              </Link>
              <Link
                href="/galeri"
                className="hover:text-yellow-400 transition-colors"
              >
                Galeri Foto
              </Link>
              <Link
                href="/tentang-kami"
                className="hover:text-yellow-400 transition-colors"
              >
                Tentang DPW
              </Link>
            </div>

            {/* Flag Counter Tanpa Pembungkus Transparan */}
            <div className="shrink-0">
              <a
                href="https://info.flagcounter.com/Xfqa"
                target="_blank"
                rel="noopener noreferrer"
                className="block opacity-75 hover:opacity-100 transition-opacity duration-300"
              >
                <img
                  src="https://s05.flagcounter.com/count2/Xfqa/bg_0B1221/txt_FFFFFF/border_0B1221/columns_3/maxflags_12/viewers_0/labels_0/pageviews_0/flags_0/percent_0/"
                  alt="Flag Counter"
                  className="h-auto max-w-full"
                />
              </a>
            </div>
          </div>
        </div>

        {/* 🔥 COPYRIGHT & LEGAL BARU (SEJAJAR & RAPI) 🔥 */}
        <div className="border-t border-white/10 bg-black/40 relative z-10 select-none">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
            {/* Sisi Kiri: Copyright & Legal Links */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1.5 text-center md:text-left">
              <p>
                &copy; {new Date().getFullYear()}{" "}
                <span className="text-slate-300 font-semibold">
                  DPW IKA UII DIY
                </span>
                .
              </p>
              <span className="hidden sm:inline text-slate-700">|</span>
              <Link
                href="/kebijakan-privasi"
                className="text-slate-400 hover:text-blue-400 transition-colors font-medium"
              >
                Kebijakan Privasi
              </Link>
              <span className="text-slate-700">•</span>
              <Link
                href="/syarat-ketentuan"
                className="text-slate-400 hover:text-blue-400 transition-colors font-medium"
              >
                Syarat & Ketentuan
              </Link>
              <span className="text-slate-700">•</span>
              <Link
                href="/regulasi"
                className="text-slate-400 hover:text-blue-400 transition-colors font-medium"
              >
                Regulasi & Edaran
              </Link>
            </div>

            {/* Sisi Kanan: Keterangan Versi & Deployment */}
            <div className="flex flex-col md:items-end text-center md:text-right gap-1">
              <p className="text-[11px] leading-relaxed">
                Dikembangkan melalui kerja sama Media & Publikasi DPW dengan{" "}
                <span className="text-slate-300 font-medium">
                  PT Guwigo Teknologi Indonesia
                </span>
                .
              </p>
              <p className="text-[10px] text-slate-600 font-medium tracking-wide">
                Sistem dimutakhirkan secara berkala pada:{" "}
                <span className="text-yellow-500/80 font-bold">
                  {lastUpdated}
                </span>
              </p>
            </div>
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
