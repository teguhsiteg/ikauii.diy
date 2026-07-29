"use client";

import { useState } from "react";
// Pastikan path import ini sesuai dengan lokasi file aslimu
import AdminOfflineRunPage from "./AdminIndividu";
import AdminKomunitasTab from "./AdminKomunitas";

export default function UnifiedAdminPage() {
  const [activeTab, setActiveTab] = useState<"individu" | "komunitas">(
    "individu",
  );

  return (
    <div className="max-w-7xl mx-auto p-4 font-sans">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-[26px] font-black text-[#0B2239] tracking-tight">
          Offline Run Management
        </h1>

        {/* SAKLAR TAB */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1">
          <button
            onClick={() => setActiveTab("individu")}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "individu"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pendaftar Individu
          </button>
          <button
            onClick={() => setActiveTab("komunitas")}
            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${
              activeTab === "komunitas"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pendaftar Komunitas / Grup
          </button>
        </div>
      </div>

      {/* RENDER KOMPONEN BERDASARKAN TAB YANG AKTIF */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 min-h-[70vh]">
        {activeTab === "individu" ? (
          <AdminOfflineRunPage />
        ) : (
          <AdminKomunitasTab />
        )}
      </div>
    </div>
  );
}
