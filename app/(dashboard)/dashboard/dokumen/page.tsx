"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

export default function GudangDokumenPage() {
  const [prokerList, setProkerList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBidang, setFilterBidang] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ambil semua data proker dari semua bidang
        const q = query(collection(db, "proker"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProkerList(data);
      } catch (error) {
        console.error("Gagal memuat data dokumen:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Dapatkan daftar bidang unik untuk dropdown filter
  const bidangOptions = Array.from(
    new Set(prokerList.map((p) => p.bidang)),
  ).filter(Boolean);

  // Fungsi Filter & Pencarian
  const filteredList = prokerList.filter((p) => {
    const matchSearch =
      (p.namaKegiatan || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nomorSurat || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchBidang = filterBidang ? p.bidang === filterBidang : true;
    return matchSearch && matchBidang;
  });

  // Fungsi Styling Status
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Perencanaan":
        return "bg-slate-100 text-slate-600 border-slate-200";
      case "Berjalan":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "LPJ Diajukan":
        return "bg-yellow-50 text-yellow-700 border-yellow-200 animate-pulse";
      case "Selesai Lancar":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-slate-50 text-slate-500 border-slate-200";
    }
  };

  // Kalkulasi Statistik Cepat
  const totalKegiatan = prokerList.length;
  const totalSelesai = prokerList.filter(
    (p) => p.status === "Selesai Lancar",
  ).length;
  const totalBerjalan = prokerList.filter(
    (p) => p.status === "Berjalan" || p.status === "LPJ Diajukan",
  ).length;

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* HEADER & STATISTIK */}
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 text-xs font-black px-3 py-1.5 rounded-full mb-3 uppercase tracking-widest shadow-sm">
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
                d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
              />
            </svg>
            Pusat Arsip Digital
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-blue-950 mb-2 tracking-tight">
            Gudang Dokumen & LPJ
          </h2>
          <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
            Sistem pengarsipan terpusat. Pantau dan unduh seluruh dokumen
            Proposal, Anggaran, serta Laporan Pertanggungjawaban (LPJ) dari
            seluruh jajaran bidang.
          </p>
        </div>

        {/* Kartu Statistik Mini */}
        {!isLoading && (
          <div className="flex gap-3 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 min-w-[140px] shadow-sm">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                Total Arsip
              </p>
              <p className="text-2xl font-black text-blue-950">
                {totalKegiatan}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 min-w-[140px] shadow-sm">
              <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
                Proses / Aktif
              </p>
              <p className="text-2xl font-black text-blue-700">
                {totalBerjalan}
              </p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 min-w-[140px] shadow-sm">
              <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1">
                Tuntas (LPJ)
              </p>
              <p className="text-2xl font-black text-green-700">
                {totalSelesai}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* FILTER & PENCARIAN */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row gap-5 items-end">
        <div className="flex-1 w-full relative">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Pencarian Spesifik
          </label>
          <div className="relative">
            <svg
              className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"
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
              placeholder="Ketik nama kegiatan atau nomor surat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-3 pl-12 pr-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>
        <div className="md:w-72 shrink-0 w-full">
          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
            Saring Berdasarkan Bidang
          </label>
          <select
            value={filterBidang}
            onChange={(e) => setFilterBidang(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundPosition: "right 1rem center",
              backgroundRepeat: "no-repeat",
              backgroundSize: "1.2em",
            }}
          >
            <option value="">Semua Bidang Organisasi</option>
            {bidangOptions.map((bidang: any, idx) => (
              <option key={idx} value={bidang}>
                {bidang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-24 flex flex-col items-center justify-center text-slate-400">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
            <p className="font-bold tracking-widest uppercase text-xs animate-pulse">
              Menyelaraskan Brankas...
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-24 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
              <span className="text-4xl">📭</span>
            </div>
            <h3 className="font-extrabold text-blue-950 text-xl mb-1">
              Arsip Tidak Ditemukan
            </h3>
            <p className="text-sm text-slate-500 max-w-sm">
              Cobalah gunakan kata kunci pencarian lain atau pilih filter bidang
              yang berbeda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-widest">
                  <th className="p-5 font-black">Informasi Kegiatan</th>
                  <th className="p-5 font-black">Status Progres</th>
                  <th className="p-5 font-black text-center border-x border-slate-100 bg-blue-50/30">
                    File Proposal / Anggaran
                  </th>
                  <th className="p-5 font-black text-center bg-green-50/30">
                    File Laporan (LPJ)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredList.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-blue-50/30 transition-colors group"
                  >
                    {/* KOLOM INFO KEGIATAN */}
                    <td className="p-5">
                      <div className="font-extrabold text-blue-950 text-base mb-1.5 whitespace-normal line-clamp-2">
                        {p.namaKegiatan}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-bold">
                          {p.bidang}
                        </span>
                        <span className="text-slate-400 font-mono tracking-tight flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
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
                          {p.nomorSurat || "Draft"}
                        </span>
                      </div>
                    </td>

                    {/* KOLOM STATUS */}
                    <td className="p-5">
                      <span
                        className={`text-[11px] font-black px-3 py-1.5 rounded-full border ${getStatusStyle(p.status)} uppercase tracking-wider inline-block`}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* KOLOM ANGGARAN */}
                    <td className="p-5 text-center border-x border-slate-100 align-middle">
                      {p.fileAnggaran ? (
                        <a
                          href={p.fileAnggaran}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow-md group-hover:border-blue-400"
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
                              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Proposal
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg border border-dashed border-slate-200">
                          <svg
                            className="w-3.5 h-3.5"
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
                          Menunggu
                        </span>
                      )}
                    </td>

                    {/* KOLOM LPJ */}
                    <td className="p-5 text-center align-middle">
                      {p.fileLaporan ? (
                        <a
                          href={p.fileLaporan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 bg-white text-green-600 border border-green-200 hover:bg-green-600 hover:text-white px-4 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow-md group-hover:border-green-400"
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
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Dok. LPJ
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-red-400 font-bold uppercase tracking-wider bg-red-50 px-3 py-1.5 rounded-lg border border-dashed border-red-100">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Belum Ada
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
