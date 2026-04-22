"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";

interface Runner {
  id: string;
  namaLengkap: string;
  namaBib: string;
  bibNumber: string;
  jarak: string;
  gender: string; // 'L' (Male) atau 'P' (Female)
  tipePeserta: string; // 'alumni' atau 'umum'
  waktuFinish: number;
  durasiMs: number;
  durasiStr: string;
}

export default function LeaderboardRacePage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [distances, setDistances] = useState<string[]>(["5K", "10K", "21K"]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE FILTER LENGKAP ---
  const [selectedDistance, setSelectedDistance] = useState<string>("10K");
  const [selectedGender, setSelectedGender] = useState<string>("L");
  const [selectedTipe, setSelectedTipe] = useState<string>("semua"); // semua | alumni | umum

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [lastUpdate, setLastUpdate] = useState(new Date());

  // 1. Tarik Data Realtime (KHUSUS OFFLINE RUN)
  useEffect(() => {
    // Ambil list jarak dari Settings Admin (fokus ke Offline Packages)
    const fetchSettings = async () => {
      const snap = await getDoc(doc(db, "settings", "virtual_run"));
      if (snap.exists()) {
        const data = snap.data();
        let availDistances: string[] = [];

        if (data.offlinePackages && data.offlinePackages.length > 0) {
          availDistances = Array.from(
            new Set(data.offlinePackages.map((p: any) => p.jarak)),
          ) as string[];
        }
        if (availDistances.length > 0) {
          setDistances(availDistances);
          setSelectedDistance(availDistances[0]);
        }
      }
    };
    fetchSettings();

    // Sedot data Offline (Hanya yang sudah Finish)
    const q = query(
      collection(db, "offline_participants"),
      where("waktuFinish", ">", 0),
    );
    const unsub = onSnapshot(q, (snap) => {
      const offlineData = snap.docs.map((document) => {
        const d = document.data();
        const wStart = d.waktuStart || d.waktuFinish;
        const durationMs = d.waktuFinish - wStart;

        // Format Waktu ke HH:MM:SS
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor(
          (durationMs % (1000 * 60 * 60)) / (1000 * 60),
        );
        const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

        const durasiStr = [
          hours.toString().padStart(2, "0"),
          minutes.toString().padStart(2, "0"),
          seconds.toString().padStart(2, "0"),
        ].join(":");

        return {
          id: document.id,
          namaLengkap: d.nama || d.namaLengkap || "Unknown Runner",
          namaBib: d.namaBib || d.nama || "Runner",
          bibNumber: d.bibNumber || document.id.substring(0, 4).toUpperCase(),
          jarak: d.jarak || "5K",
          gender: d.gender || "L",
          tipePeserta: (d.tipePeserta || d.tipe || "umum").toLowerCase(),
          waktuFinish: d.waktuFinish,
          durasiMs: durationMs,
          durasiStr: durasiStr,
        };
      }) as Runner[];

      setRunners(offlineData);
      setLastUpdate(new Date());
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  // Update Live Time Indicator
  useEffect(() => {
    const timer = setInterval(() => setLastUpdate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- LOGIKA FILTER & SORTING ---
  const filteredRunners = runners
    .filter(
      (r) =>
        r.jarak === selectedDistance &&
        r.gender === selectedGender &&
        (selectedTipe === "semua" || r.tipePeserta === selectedTipe),
    )
    .sort((a, b) => a.durasiMs - b.durasiMs);

  const top3 = filteredRunners.slice(0, 3);

  // --- LOGIKA PAGINATION ---
  const totalPages = Math.ceil(filteredRunners.length / itemsPerPage);
  const currentTableData = filteredRunners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Helper Initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  // Reset pagination saat filter ganti
  const changeFilter = (setter: any, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-900 rounded-full animate-spin"></div>
          <p className="text-blue-900 font-bold text-sm tracking-widest uppercase">
            Memuat Live Data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-yellow-200 selection:text-blue-950 pb-20">
      {/* HEADER KECIL KEMBALI */}
      <div className="pt-6 px-6 sm:px-10 max-w-6xl mx-auto flex justify-between items-center">
        <Link
          href="/"
          className="text-slate-500 hover:text-blue-900 font-bold text-xs flex items-center gap-1.5 transition-colors"
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
              strokeWidth={2.5}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Event
        </Link>
        <div className="text-xs font-bold text-blue-900 uppercase tracking-widest flex items-center gap-2">
          <img
            src="/logo-dpp-ika.png"
            alt="Logo UII"
            className="w-5 h-5 object-contain"
          />
          IKA UII DIY
        </div>
      </div>

      {/* MAIN TITLE */}
      <div className="text-center mt-6 mb-8">
        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-yellow-200">
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
              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
            />
          </svg>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#152B5B] tracking-tight mb-2 uppercase">
          Leaderboard Race
        </h1>
        <p className="text-sm text-slate-500 font-medium">
          Klasemen pelari tercepat secara real-time
        </p>
      </div>

      {/* ================================== */}
      {/* FILTER CONTROL PANEL (UII COLORS) */}
      {/* ================================== */}
      <div className="max-w-4xl mx-auto px-4 mb-12 space-y-4">
        {/* ROW 1: STATUS ALUMNI/UMUM & LIVE INDICATOR */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 border-b border-slate-200 pb-4">
          <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
            {["semua", "alumni", "umum"].map((tipe) => (
              <button
                key={tipe}
                onClick={() => changeFilter(setSelectedTipe, tipe)}
                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${selectedTipe === tipe ? "bg-[#D4AF37] text-[#152B5B] shadow-md" : "text-slate-500 hover:text-[#D4AF37]"}`}
              >
                {tipe === "semua" ? "Semua Status" : tipe}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-px h-8 bg-slate-300"></div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Live: {lastUpdate.toLocaleTimeString("id-ID")}
            </span>
          </div>
        </div>

        {/* ROW 2: DISTANCE & GENDER */}
        <div className="flex flex-col items-center gap-4 pt-2">
          {/* Distance */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
            {distances.map((dist) => (
              <button
                key={dist}
                onClick={() => changeFilter(setSelectedDistance, dist)}
                className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                  selectedDistance === dist
                    ? "bg-[#1A73E8] text-white border-[#1A73E8] shadow-md shadow-blue-500/20"
                    : "bg-white text-slate-500 border-slate-200 hover:border-blue-300 hover:text-[#1A73E8]"
                }`}
              >
                {dist}
              </button>
            ))}
          </div>

          {/* Gender */}
          <div className="inline-flex bg-white p-1 rounded-full border border-slate-200 shadow-sm">
            <button
              onClick={() => changeFilter(setSelectedGender, "L")}
              className={`px-8 py-2 rounded-full text-xs font-bold transition-all ${selectedGender === "L" ? "bg-slate-800 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}
            >
              Male (L)
            </button>
            <button
              onClick={() => changeFilter(setSelectedGender, "P")}
              className={`px-8 py-2 rounded-full text-xs font-bold transition-all ${selectedGender === "P" ? "bg-rose-600 text-white shadow-md" : "text-slate-500 hover:text-rose-800"}`}
            >
              Female (P)
            </button>
          </div>
        </div>
      </div>

      {/* ================================== */}
      {/* CONTENT AREA (PODIUM & TABLE)      */}
      {/* ================================== */}
      {filteredRunners.length === 0 ? (
        <div className="max-w-4xl mx-auto text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="text-6xl mb-4">🏁</div>
          <h3 className="text-xl font-bold text-[#152B5B]">
            Belum Ada Finisher
          </h3>
          <p className="text-slate-500 text-sm mt-2">
            Pelari untuk kategori ini belum ada yang melewati garis finish.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-4">
          {/* PODIUM TOP 3 (UII COLORS) */}
          <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 mb-16 pt-10">
            {/* RANK 2 (KIRI - SILVER/SLATE) */}
            {top3[1] && (
              <div className="order-2 md:order-1 w-full md:w-64 bg-white rounded-3xl p-6 text-center border border-slate-200 shadow-sm relative mt-10 md:mt-0">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-slate-200 border-4 border-white rounded-full flex items-center justify-center text-slate-600 font-black text-xl shadow-sm">
                  {getInitials(top3[1].namaBib)}
                </div>
                <div className="absolute -top-3 right-4 text-2xl drop-shadow-md">
                  🥈
                </div>
                <div className="mt-6">
                  <h3 className="font-bold text-[#152B5B] text-lg truncate">
                    {top3[1].namaBib}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    BIB {top3[1].bibNumber}
                  </p>
                  <div className="mt-4 inline-block bg-slate-50 border border-slate-200 text-slate-700 font-black px-4 py-2 rounded-xl text-lg tracking-wider">
                    {top3[1].durasiStr}
                  </div>
                </div>
              </div>
            )}

            {/* RANK 1 (TENGAH - UII GOLD & NAVY) */}
            {top3[0] && (
              <div className="order-1 md:order-2 w-full md:w-72 bg-gradient-to-b from-[#D4AF37] to-yellow-600 rounded-3xl p-6 text-center shadow-xl shadow-yellow-600/30 relative z-10 md:-mt-8 transform md:scale-105 border border-yellow-400">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-[#152B5B] border-4 border-white rounded-full flex items-center justify-center text-yellow-400 font-black text-2xl shadow-lg">
                  {getInitials(top3[0].namaBib)}
                </div>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-4xl drop-shadow-lg">
                  👑
                </div>
                <div className="mt-8 text-white">
                  <h3 className="font-black text-xl truncate drop-shadow-md text-[#152B5B]">
                    {top3[0].namaBib}
                  </h3>
                  <p className="text-[10px] text-yellow-100 font-bold uppercase tracking-widest mt-1 text-[#152B5B]/70">
                    BIB {top3[0].bibNumber}
                  </p>
                  <div className="mt-5 inline-block bg-[#152B5B] text-yellow-400 font-black px-6 py-2.5 rounded-xl text-xl tracking-wider shadow-inner">
                    {top3[0].durasiStr}
                  </div>
                </div>
              </div>
            )}

            {/* RANK 3 (KANAN - BRONZE/AMBER) */}
            {top3[2] && (
              <div className="order-3 md:order-3 w-full md:w-64 bg-white rounded-3xl p-6 text-center border border-slate-200 shadow-sm relative mt-10 md:mt-0">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-700/10 border-4 border-white rounded-full flex items-center justify-center text-amber-800 font-black text-xl shadow-sm">
                  {getInitials(top3[2].namaBib)}
                </div>
                <div className="absolute -top-3 left-4 text-2xl drop-shadow-md">
                  🥉
                </div>
                <div className="mt-6">
                  <h3 className="font-bold text-[#152B5B] text-lg truncate">
                    {top3[2].namaBib}
                  </h3>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                    BIB {top3[2].bibNumber}
                  </p>
                  <div className="mt-4 inline-block bg-slate-50 border border-slate-200 text-slate-700 font-black px-4 py-2 rounded-xl text-lg tracking-wider">
                    {top3[2].durasiStr}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* LIST TABEL SEMUA PELARI */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16 text-center">
                      Rank
                    </th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Runner
                    </th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      BIB
                    </th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Category
                    </th>
                    <th className="py-4 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">
                      Finish Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentTableData.map((runner, idx) => {
                    const actualRank =
                      (currentPage - 1) * itemsPerPage + idx + 1;

                    // Styling Khusus Badge Ranking
                    let rankBadge = "bg-slate-100 text-slate-500 font-bold";
                    if (actualRank === 1)
                      rankBadge =
                        "bg-[#D4AF37] text-[#152B5B] font-black shadow-sm";
                    else if (actualRank === 2)
                      rankBadge =
                        "bg-slate-300 text-slate-800 font-black shadow-sm";
                    else if (actualRank === 3)
                      rankBadge =
                        "bg-amber-600 text-white font-black shadow-sm";

                    return (
                      <tr
                        key={runner.id}
                        className="hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="py-3.5 px-6 text-center">
                          <div
                            className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs ${rankBadge}`}
                          >
                            {actualRank}
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-[#152B5B] font-bold flex items-center justify-center text-[10px] shrink-0">
                              {getInitials(runner.namaBib)}
                            </div>
                            <div>
                              <span className="font-bold text-[#152B5B] text-sm group-hover:text-[#1A73E8] transition-colors block">
                                {runner.namaLengkap}
                              </span>
                              {runner.tipePeserta === "alumni" && (
                                <span className="text-[9px] bg-[#D4AF37]/20 text-[#D4AF37] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider inline-block mt-0.5">
                                  Alumni UII
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="text-sm font-mono text-slate-600 font-bold">
                            {runner.bibNumber}
                          </span>
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="text-[10px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                            {runner.jarak}{" "}
                            {runner.gender === "L" ? "Male" : "Female"}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <span
                            className={`font-black text-sm tracking-wider ${actualRank <= 3 ? "text-[#D4AF37]" : "text-[#152B5B]"}`}
                          >
                            {runner.durasiStr}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* PAGINATION FOOTER */}
            {totalPages > 1 && (
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1A73E8] hover:text-[#1A73E8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1A73E8] hover:text-[#1A73E8] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
