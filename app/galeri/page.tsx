"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

// --- TYPES ---
interface GaleriItem {
  id: string;
  judul: string;
  tanggal: string; // Format YYYY-MM-DD
  imgUrl: string;
}

export default function GaleriPage() {
  const [galeriList, setGaleriList] = useState<GaleriItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE FILTER & SEARCH
  const [searchQuery, setSearchQuery] = useState("");
  const [activeYear, setActiveYear] = useState<string>("Semua");

  // STATE LIGHTBOX (ZOOM FOTO)
  const [selectedPhoto, setSelectedPhoto] = useState<GaleriItem | null>(null);

  // FETCH DATA FIREBASE
  useEffect(() => {
    // Ambil foto dari terbaru ke terlama
    const q = query(collection(db, "galeri"), orderBy("tanggal", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as GaleriItem[];
        setGaleriList(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("Gagal load galeri:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // EKSTRAK TAHUN UNTUK TOMBOL FILTER (Otomatis dari data)
  const availableYears = useMemo(() => {
    const years = galeriList
      .map((item) => (item.tanggal ? item.tanggal.substring(0, 4) : "Lainnya"))
      .filter((v, i, a) => a.indexOf(v) === i) // Unique values
      .sort((a, b) => (a < b ? 1 : -1)); // Descending
    return ["Semua", ...years];
  }, [galeriList]);

  // LOGIKA PEMROSESAN FILTER & PENCARIAN
  const processedGaleri = useMemo(() => {
    let processed = [...galeriList];

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
      processed = processed.filter((item) =>
        (item.judul || "").toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 2. Filter by Year
    if (activeYear !== "Semua") {
      processed = processed.filter((item) => {
        const itemYear = item.tanggal
          ? item.tanggal.substring(0, 4)
          : "Lainnya";
        return itemYear === activeYear;
      });
    }

    return processed;
  }, [galeriList, searchQuery, activeYear]);

  // TUTUP LIGHTBOX JIKA TEKAN ESCAPE
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedPhoto(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <NavbarPublic />

      {/* ================= LIGHTBOX / MODAL ZOOM FOTO ================= */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="relative w-full max-w-5xl flex flex-col items-center">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 sm:-right-12 w-10 h-10 bg-white/10 hover:bg-rose-500 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedPhoto.imgUrl}
              alt={selectedPhoto.judul}
              className="max-h-[75vh] w-auto object-contain rounded-lg shadow-2xl border border-white/10"
            />
            <div className="mt-6 text-center">
              <h3 className="text-white text-xl font-bold mb-2">
                {selectedPhoto.judul || "Dokumentasi IKA UII DIY"}
              </h3>
              <p className="text-yellow-400 text-sm font-black uppercase tracking-widest bg-yellow-400/10 inline-block px-4 py-1.5 rounded-full border border-yellow-400/20">
                {selectedPhoto.tanggal
                  ? new Date(selectedPhoto.tanggal).toLocaleDateString(
                      "id-ID",
                      { day: "numeric", month: "long", year: "numeric" },
                    )
                  : "Tanpa Tanggal"}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow pb-24">
        {/* ================= HERO & SEARCH SECTION ================= */}
        <section className="bg-[#0F2147] pt-60 pb-20 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-800 rounded-full blur-[100px] opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-600 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

          <div className="max-w-4xl mx-auto relative z-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h4 className="flex items-center justify-center gap-2 md:gap-3 text-[#FCD116] font-black tracking-[0.2em] uppercase text-xs mb-4">
              <span className="w-8 h-1 bg-[#FCD116] rounded-full"></span>
              Jejak Pengabdian
              <span className="w-8 h-1 bg-[#FCD116] rounded-full"></span>
            </h4>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Galeri Kegiatan
            </h1>
            <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Kumpulan momen, kebersamaan, dan rekam jejak visual dari setiap
              program serta forum silaturahmi keluarga besar alumni UII DIY.
            </p>

            {/* SEARCH BAR */}
            <div className="max-w-2xl mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari foto acara, contoh: Run, Rakerda, Bukber..."
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FCD116] focus:bg-white/20 transition-all font-medium text-base shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* ================= FILTER PILLS TAHUN ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-2 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setActiveYear(year)}
                className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeYear === year ? "bg-[#0F2147] text-[#FCD116] shadow-md" : "bg-transparent text-slate-500 hover:bg-slate-100"}`}
              >
                {year === "Semua" ? "Semua Tahun" : year}
              </button>
            ))}
          </div>
        </div>

        {/* ================= MAIN GALLERY GRID ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/3] bg-slate-200 rounded-2xl animate-pulse border border-slate-300"
                ></div>
              ))}
            </div>
          ) : processedGaleri.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm mt-10">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-black text-slate-800 text-xl mb-2">
                Dokumentasi Tidak Ditemukan
              </h3>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">
                {searchQuery
                  ? `Tidak ada foto yang cocok dengan pencarian "${searchQuery}".`
                  : `Belum ada dokumentasi untuk tahun ${activeYear}.`}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-700">
              {processedGaleri.map((foto) => (
                <div
                  key={foto.id}
                  onClick={() => setSelectedPhoto(foto)}
                  className="relative aspect-[4/3] max-w-full rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-200 bg-slate-50 hover:-translate-y-1"
                >
                  <img
                    src={foto.imgUrl}
                    alt={foto.judul || "Dokumentasi Kegiatan"}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />

                  {/* Ikon Zoom di Tengah Saat Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 text-white">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Overlay Gradasi & Detail */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F2147]/90 via-[#0F2147]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-5 z-20">
                    <p className="text-white font-bold text-xs sm:text-sm leading-snug translate-y-3 group-hover:translate-y-0 transition-transform duration-300 line-clamp-2">
                      {foto.judul || "Dokumentasi Kegiatan"}
                    </p>
                    <p className="text-[#FCD116] text-[9px] sm:text-[10px] font-black mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 tracking-widest uppercase">
                      {foto.tanggal
                        ? new Date(foto.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Arsip IKA UII"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <FooterPublic />
    </div>
  );
}
