"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AdminOfflineRunPage from "./AdminIndividu";
import AdminKomunitasTab from "./AdminKomunitas";
import AdminUndanganTab from "./AdminUndangan";
import { User, Users2, Mail } from "lucide-react";

function UnifiedAdminContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as "individu" | "komunitas" | "undangan") || "individu";
  const [activeTab, setActiveTab] = useState<"individu" | "komunitas" | "undangan">(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as "individu" | "komunitas" | "undangan";
    if (tabParam && ["individu", "komunitas", "undangan"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto space-y-6 font-sans">
      {/* HEADER UTAMA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Data Peserta Offline Run
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Kelola pendaftaran offline individu, komunitas/grup, dan manajemen Undangan Khusus.
          </p>
        </div>

        {/* SAKLAR TAB: INDIVIDU VS KOMUNITAS VS UNDANGAN */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap gap-1 border border-slate-200 shadow-inner">
          <button
            onClick={() => setActiveTab("individu")}
            className={`px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === "individu"
                ? "bg-white text-[#1A73E8] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User className="w-4 h-4" />
            Pendaftar Individu
          </button>
          <button
            onClick={() => setActiveTab("komunitas")}
            className={`px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === "komunitas"
                ? "bg-white text-[#1A73E8] shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users2 className="w-4 h-4" />
            Pendaftar Komunitas
          </button>
          <button
            onClick={() => setActiveTab("undangan")}
            className={`px-4 py-2.5 rounded-lg font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
              activeTab === "undangan"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Mail className="w-4 h-4 text-[#1A73E8]" />
            Undangan Khusus
          </button>
        </div>
      </div>

      {/* RENDER KOMPONEN BERDASARKAN TAB YANG AKTIF */}
      <div>
        {activeTab === "individu" ? (
          <AdminOfflineRunPage />
        ) : activeTab === "komunitas" ? (
          <AdminKomunitasTab />
        ) : (
          <AdminUndanganTab />
        )}
      </div>
    </div>
  );
}

export default function UnifiedAdminPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Memuat halaman admin...</div>}>
      <UnifiedAdminContent />
    </Suspense>
  );
}
