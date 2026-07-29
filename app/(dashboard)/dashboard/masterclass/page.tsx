"use client";

import { useState } from "react";
import TabCourses from "./components/TabCourses";
import TabMentors from "./components/TabMentors";
import TabStudents from "./components/TabStudents";
import TabReviews from "./components/TabReviews";
import TabDashboard from "./components/TabDashboard";
// 🔥 IMPORT 2 TAB BARU KITA 🔥
import TabTransaksi from "./components/TabPengaturanCMS";
import TabPengaturan from "./components/TabPengaturan";

export default function AdminMasterclassPage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 font-sans">
      {/* HEADER SECTION */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-[10px] font-black px-3 py-1.5 rounded-full mb-3 uppercase tracking-[0.15em] border border-slate-200">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            LMS Enterprise System
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            Manajemen <span className="text-[#1A73E8]">Masterclass</span>
          </h1>
        </div>
      </div>

      {/* TAB NAVIGATION SCROLLABLE */}
      <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto custom-scrollbar pb-px">
        {[
          { id: "overview", label: "Dashboard Utama" },
          { id: "courses", label: "Daftar Kelas" },
          { id: "mentors", label: "Manajemen Mentor" },
          { id: "students", label: "Data Peserta (Students)" },
          { id: "transaksi", label: "Pengaturan CMS" }, // 🔥 TAB KASIR 🔥
          { id: "reviews", label: "Rating & Komentar" },
          { id: "pengaturan", label: "Pengaturan LMS" }, // 🔥 TAB PENGATURAN 🔥
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-5 text-sm font-bold whitespace-nowrap transition-colors border-b-[3px] ${activeTab === tab.id ? "border-[#1A73E8] text-[#1A73E8] bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        {activeTab === "overview" && <TabDashboard />}
        {activeTab === "courses" && <TabCourses />}
        {activeTab === "mentors" && <TabMentors />}
        {activeTab === "students" && <TabStudents />}
        {activeTab === "transaksi" && <TabTransaksi />}{" "}
        {/* 🔥 RENDER KASIR 🔥 */}
        {activeTab === "reviews" && <TabReviews />}
        {activeTab === "pengaturan" && <TabPengaturan />}{" "}
        {/* 🔥 RENDER SETTINGS 🔥 */}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
