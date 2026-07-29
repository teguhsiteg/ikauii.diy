"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

// --- INTERFACE DATA ---
interface SuratEdaran {
  id: string;
  judul: string;
  nomor: string;
  tanggal: string;
  status: string;
  kategori: string;
  fileUrl: string;
  createdAt: any;
}

export default function PublicSuratEdaranPage() {
  const [suratList, setSuratList] = useState<SuratEdaran[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FILTERS STATE
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [kategoriFilter, setKategoriFilter] = useState("");

  // --- 🔥 FETCH REAL DATA DARI FIREBASE (BUKAN DUMMY) 🔥 ---
  useEffect(() => {
    const q = query(
      collection(db, "surat_edaran"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SuratEdaran[];
      setSuratList(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- LOGIKA FILTERING ---
  const filteredData = useMemo(() => {
    return suratList.filter((item) => {
      const matchSearch =
        item.judul?.toLowerCase().includes(search.toLowerCase()) ||
        item.nomor?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || item.status === statusFilter;
      const matchKategori = !kategoriFilter || item.kategori === kategoriFilter;
      return matchSearch && matchStatus && matchKategori;
    });
  }, [suratList, search, statusFilter, kategoriFilter]);

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] flex flex-col"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* --- NAVBAR --- */}
      <NavbarPublic />

      {/* 1. HERO SECTION (CORPORATE STYLE) */}
      <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 flex flex-col justify-center items-center overflow-hidden bg-[#0a152d]">
        {/* Background Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-transparent z-10"></div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#F8FAFC] to-transparent z-20"></div>
        </div>

        <div className="relative z-30 w-full max-w-5xl mx-auto px-6 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
          <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
            Official Circular Letters
          </span>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
            Pusat Data{" "}
            <span className="text-yellow-500">Regulasi & Edaran</span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
            Transparansi informasi melalui digitalisasi dokumen resmi DPW IKA
            UII DIY. Seluruh surat edaran dan keputusan pimpinan dapat diakses
            secara terbuka.
          </p>

          {/* SEARCH BOX PREMIUM */}
          <div className="bg-white p-1.5 rounded-2xl shadow-2xl flex max-w-2xl mx-auto border border-slate-200">
            <div className="flex-grow flex items-center pl-5">
              <svg
                className="w-5 h-5 text-slate-400"
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
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor surat atau perihal..."
                className="w-full bg-transparent border-none text-slate-800 placeholder-slate-400 px-4 py-3 focus:outline-none focus:ring-0 text-sm md:text-base font-medium"
              />
            </div>
            <button className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20">
              Cari
            </button>
          </div>
        </div>
      </section>

      {/* 2. MAIN CONTENT AREA */}
      <section className="py-12 md:py-16 flex-grow relative z-40 -mt-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* --- SIDEBAR FILTERS --- */}
            <div className="w-full lg:w-72 shrink-0">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-28 shadow-sm">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                  Klasifikasi
                </h4>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Tipe Dokumen
                    </label>
                    <select
                      value={kategoriFilter}
                      onChange={(e) => setKategoriFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua Tipe</option>
                      <option value="Surat Edaran">Surat Edaran</option>
                      <option value="Surat Keputusan">Surat Keputusan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Status Berlaku
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua Status</option>
                      <option value="Berlaku">Berlaku</option>
                      <option value="Dicabut">Tidak Berlaku</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("");
                      setKategoriFilter("");
                    }}
                    className="w-full text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors pt-2"
                  >
                    Atur Ulang Filter
                  </button>
                </div>
              </div>
            </div>

            {/* --- LIST CONTENT --- */}
            <div className="flex-grow space-y-4">
              {loading ? (
                // Loading Skeleton
                [1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white h-32 rounded-2xl border border-slate-200 animate-pulse"
                  ></div>
                ))
              ) : filteredData.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-20 text-center shadow-sm">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                    <svg
                      className="w-8 h-8 text-slate-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">
                    Belum Ada Dokumen tersedia.
                  </h4>
                  <p className="text-slate-500 text-sm mt-1">
                    Gunakan kata kunci lain atau periksa filter Anda.
                  </p>
                </div>
              ) : (
                filteredData.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 shadow-sm hover:border-blue-300 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center"
                  >
                    {/* Icon Representasi File */}
                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[#1A73E8] shrink-0">
                      <svg
                        className="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    {/* Konten Teks */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                          {item.kategori}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${item.status === "Berlaku" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"}`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-slate-900 leading-tight mb-1">
                        {item.judul}
                      </h3>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3">
                        <span className="font-mono">{item.nomor}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span>Diterbitkan: {item.tanggal}</span>
                      </div>
                    </div>

                    {/* Tombol Aksi - Selalu Muncul */}
                    <div className="shrink-0 w-full md:w-auto pt-2 md:pt-0">
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#F8F9FA] hover:bg-[#1A73E8] text-slate-700 hover:text-white border border-slate-200 hover:border-[#1A73E8] px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm w-full md:w-auto"
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
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        Lihat Dokumen PDF
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* --- PRE-FOOTER (UII STYLE) --- */}
      <section className="bg-yellow-500 py-12 relative overflow-hidden mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <h2 className="text-2xl md:text-3xl font-black text-blue-950 text-center md:text-left">
            Butuh Bantuan Mengenai Regulasi?
          </h2>
          <a
            href="mailto:sekretariat@ikadiy.uii.ac.id"
            className="bg-blue-950 text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-blue-900 transition-all shadow-xl"
          >
            Hubungi Sekretariat
          </a>
        </div>
        {/* Dekorasi Objek */}
        <div className="absolute top-0 right-0 w-64 h-full bg-white/10 skew-x-12 translate-x-20"></div>
      </section>

      <FooterPublic />

      {/* --- CSS KHUSUS FONT INTER (IMPORT) --- */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap");
      `}</style>
    </div>
  );
}
