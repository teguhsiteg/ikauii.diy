"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

// Terima prop dari halaman induk
export default function TabProker({
  filterPeriodeId,
}: {
  filterPeriodeId: string;
}) {
  const [prokerList, setProkerList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBidang, setFilterBidang] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let q;
        if (filterPeriodeId === "Semua" || !filterPeriodeId) {
          // Jika semua, gunakan orderBy dari Firebase
          q = query(collection(db, "proker"), orderBy("createdAt", "desc"));
        } else {
          // Hilangkan orderBy untuk mencegah error Composite Index Firestore
          q = query(
            collection(db, "proker"),
            where("periodeId", "==", filterPeriodeId),
          );
        }

        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Pengurutan manual di sisi Frontend jika difilter per periode
        if (filterPeriodeId !== "Semua" && filterPeriodeId) {
          data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          );
        }

        setProkerList(data);
      } catch (error) {
        console.error("Gagal memuat data dokumen:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filterPeriodeId]);

  // Dapatkan daftar bidang unik untuk dropdown filter
  const bidangOptions = Array.from(
    new Set(prokerList.map((p) => p.bidang)),
  ).filter(Boolean);

  // Fungsi Filter & Pencarian Internal
  const filteredList = prokerList.filter((p) => {
    const matchSearch =
      (p.namaKegiatan || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.nomorSurat || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchBidang = filterBidang ? p.bidang === filterBidang : true;
    return matchSearch && matchBidang;
  });

  // Fungsi Styling Status Progres
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Perencanaan":
        return "bg-slate-100 text-slate-500 border-slate-200";
      case "Berjalan":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "LPJ Diajukan":
        return "bg-yellow-50 text-yellow-600 border-yellow-200 animate-pulse";
      case "Selesai Lancar":
        return "bg-green-50 text-green-600 border-green-200";
      case "Dibatalkan":
        return "bg-red-50 text-red-600 border-red-200";
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
    <div className="animate-in fade-in duration-300">
      {/* KARTU STATISTIK */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
              Total Arsip Proker
            </p>
            <p className="text-2xl font-extrabold text-slate-800">
              {totalKegiatan} <span className="text-xs text-slate-400 font-normal">berkas</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-blue-700 font-bold uppercase tracking-wider mb-1">
              Sedang Berjalan
            </p>
            <p className="text-2xl font-extrabold text-blue-700">
              {totalBerjalan} <span className="text-xs text-blue-400 font-normal">projek</span>
            </p>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-1">
              Tuntas (LPJ)
            </p>
            <p className="text-2xl font-extrabold text-emerald-700">
              {totalSelesai} <span className="text-xs text-emerald-400 font-normal">selesai</span>
            </p>
          </div>
        </div>
      )}

      {/* FILTER & PENCARIAN */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full relative">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">
            Pencarian Spesifik
          </label>
          <div className="relative">
            <svg
              className="absolute left-3.5 top-3 w-4 h-4 text-slate-400"
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
              className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-10 pr-4 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>
        </div>
        <div className="md:w-72 shrink-0 w-full">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-0.5">
            Saring Berdasarkan Bidang
          </label>
          <select
            value={filterBidang}
            onChange={(e) => setFilterBidang(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all cursor-pointer"
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

      {/* TABEL DATA ARSIP */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
            <p className="font-bold tracking-widest uppercase text-[10px]">
              Memuat Data Arsip...
            </p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3 border border-slate-200 text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">
              Arsip Tidak Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Belum ada dokumen program kerja di periode kepengurusan ini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Informasi Kegiatan</th>
                  <th className="px-6 py-4 font-bold text-center">
                    Status Progres
                  </th>
                  <th className="px-6 py-4 font-bold text-center">
                    File Proposal / Anggaran
                  </th>
                  <th className="px-6 py-4 font-bold text-center">
                    File Laporan (LPJ)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredList.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 align-top">
                      <div className="font-bold text-slate-800 text-sm mb-1 whitespace-normal max-w-md">
                        {p.namaKegiatan}
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {p.bidang}
                        </span>
                        <span className="text-slate-400 font-mono">
                          {p.nomorSurat || "Draft"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center align-middle">
                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getStatusStyle(p.status)} uppercase tracking-wider inline-block`}
                      >
                        {p.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center align-middle">
                      {p.fileProposal || p.fileAnggaran ? (
                        <a
                          href={p.fileProposal || p.fileAnggaran}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs"
                        >
                          Lihat Dokumen
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          —
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center align-middle">
                      {p.fileLaporan ? (
                        <a
                          href={p.fileLaporan}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs"
                        >
                          Dokumen LPJ
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium">
                          —
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
