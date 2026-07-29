"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import TabProker from "./components/TabProker";
import TabSuratLegal from "./components/TabSuratLegal";

export default function GudangDokumenPage() {
  const [activeTab, setActiveTab] = useState("proker");

  // State untuk Filter Periode Global
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState("");
  const [isLoadingPeriode, setIsLoadingPeriode] = useState(true);

  // Fetch Daftar Periode untuk Dropdown
  useEffect(() => {
    const fetchPeriode = async () => {
      try {
        const q = query(collection(db, "periode"), orderBy("tglMulai", "desc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPeriodeList(data);

        // Default: Pilih periode yang sedang "Aktif", atau periode pertama jika tidak ada
        const active = data.find((p) => p.status === "Aktif");
        if (active) setSelectedPeriode(active.id);
        else if (data.length > 0) setSelectedPeriode(data[0].id);
      } catch (error) {
        console.error("Gagal memuat periode:", error);
      } finally {
        setIsLoadingPeriode(false);
      }
    };
    fetchPeriode();
  }, []);

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 font-sans">
      {/* --- HEADER & GLOBAL FILTER --- */}
      <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-[11px] font-black px-3.5 py-1.5 rounded-full mb-3 uppercase tracking-widest shadow-sm">
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
            Gudang Dokumen Terpadu
          </h2>
          <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
            Sistem pengarsipan terpusat. Pantau dan kelola seluruh dokumen
            Proposal, LPJ, serta Regulasi Organisasi berdasarkan masa
            kepengurusan.
          </p>
        </div>

        {/* DROPDOWN PERIODE GLOBAL */}
        <div className="bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center gap-3 w-full lg:w-auto shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-3 shrink-0">
            Arsip Periode:
          </span>
          {isLoadingPeriode ? (
            <span className="text-sm font-bold text-slate-400 px-3 py-1">
              Memuat...
            </span>
          ) : (
            <select
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="bg-slate-50 border border-slate-100 font-bold text-blue-800 text-sm rounded-xl py-2 px-3 cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-auto"
            >
              <option value="Semua">Tampilkan Semua Periode</option>
              {periodeList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaPeriode}{" "}
                  {p.status === "Aktif" ? "— (Aktif)" : "— (Arsip)"}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* --- TAB NAVIGASI --- */}
      <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("proker")}
          className={`py-3 px-6 text-sm font-black whitespace-nowrap transition-colors border-b-[3px] ${activeTab === "proker" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl"}`}
        >
          📁 Program Kerja & LPJ
        </button>
        <button
          onClick={() => setActiveTab("surat")}
          className={`py-3 px-6 text-sm font-black whitespace-nowrap transition-colors border-b-[3px] ${activeTab === "surat" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl"}`}
        >
          📜 Surat Resmi & Legalitas
        </button>
      </div>

      {/* --- RENDER KOMPONEN ANAK (SUNTIKKAN PROPS PERIODE) --- */}
      {activeTab === "proker" && (
        <TabProker filterPeriodeId={selectedPeriode} />
      )}
      {activeTab === "surat" && (
        <TabSuratLegal filterPeriodeId={selectedPeriode} />
      )}
    </div>
  );
}
