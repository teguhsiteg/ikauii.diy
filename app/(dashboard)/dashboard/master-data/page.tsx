"use client";

import { useState } from "react";

// Import komponen tab dari sub-folder
import TabPeriode from "./components/TabPeriode";
import TabBidang from "./components/TabBidang";
import TabPengurus from "./components/TabPengurus";
import TabAnggota from "./components/TabAnggota";
import TabDPD from "./components/TabDPD";
import TabDuplikat from "./components/TabDuplikat";

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState("pengurus"); // Default tab aktif

  const tabs = [
    { id: "periode", label: "Masa Periode" },
    { id: "bidang", label: "Bidang/Dept" },
    { id: "pengurus", label: "Personalia Sah" },
    { id: "anggota_baru", label: "Antrean Daftar" },
    { id: "dpd", label: "Jaringan DPD" },
    { id: "duplikat", label: "Cek Duplikat" },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12 font-sans text-slate-800 relative">
      {/* HEADER SECTION */}
      <div className="mb-6 mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium text-slate-900 mb-1 tracking-tight">
            Master Data Organisasi
          </h2>
          <p className="text-slate-500 text-sm">
            Kelola struktur personalia, masa kepengurusan, dan jaringan daerah.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex w-full overflow-x-auto no-scrollbar border-b border-slate-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-5 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#1A73E8] text-[#1A73E8] bg-[#E8F0FE]/50"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RENDER KONTEN TAB DINAMIS */}
      <div className="w-full">
        {activeTab === "periode" && <TabPeriode />}
        {activeTab === "bidang" && <TabBidang />}
        {activeTab === "pengurus" && <TabPengurus />}
        {activeTab === "anggota_baru" && <TabAnggota />}
        {activeTab === "dpd" && <TabDPD />}
        {activeTab === "duplikat" && <TabDuplikat />}
      </div>
    </div>
  );
}
