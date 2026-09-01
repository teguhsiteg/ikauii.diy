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
        const active = data.find((p: any) => p.status === "Aktif");
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
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">
            Gudang Dokumen Terpadu
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Sistem pengarsipan terpusat. Pantau dan kelola seluruh dokumen Proposal, LPJ, serta Regulasi Organisasi.
          </p>
        </div>

        {/* DROPDOWN PERIODE GLOBAL */}
        <div className="bg-slate-50 border border-slate-200/80 p-2 rounded-xl flex items-center gap-3 w-full sm:w-auto shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2 shrink-0">
            Arsip Periode:
          </span>
          {isLoadingPeriode ? (
            <span className="text-xs font-medium text-slate-400 px-3 py-1">
              Memuat...
            </span>
          ) : (
            <select
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              className="bg-white border border-slate-200 font-bold text-blue-900 text-xs rounded-lg py-1.5 px-3 cursor-pointer outline-none focus:border-blue-500 w-full sm:w-auto"
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
      <div className="flex gap-2 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab("proker")}
          className={`py-2.5 px-5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === "proker" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl"}`}
        >
          Program Kerja & LPJ
        </button>
        <button
          onClick={() => setActiveTab("surat")}
          className={`py-2.5 px-5 text-xs font-bold whitespace-nowrap transition-colors border-b-2 ${activeTab === "surat" ? "border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-xl" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-t-xl"}`}
        >
          Surat Resmi & Legalitas
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
