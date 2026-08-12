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
  gender: string;
  kategoriPeserta: string;
  waktuFinish: number;
  durasiMs: number;
  durasiStr: string;
  tahunEvent: number;
  isStravaVerified: boolean; // 🔥 TAMBAHAN UNTUK DETEKSI DATA STRAVA
}

export default function LeaderboardRacePage() {
  const [runners, setRunners] = useState<Runner[]>([]);
  const [distances, setDistances] = useState<string[]>(["5K", "10K"]);
  const [categories, setCategories] = useState<string[]>(["Umum"]);
  const [availableYears, setAvailableYears] = useState<number[]>([2026]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedDistance, setSelectedDistance] = useState<string>("");
  const [selectedGender, setSelectedGender] = useState<string>("L");
  const [selectedKategori, setSelectedKategori] = useState<string>("semua");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "virtual_run"));
        if (doc.exists && snap.exists()) {
          const data = snap.data();
          setIsPublished(data.showLeaderboard === true);
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
      } catch (err) {
        console.error("Gagal memuat konfigurasi admin:", err);
      }
    };
    fetchSettings();

    // 2. Sedot Data Realtime
    const q = query(
      collection(db, "offline_participants"),
      where("waktuFinish", ">", 0),
    );

    const unsub = onSnapshot(q, (snap) => {
      const yearsSet = new Set<number>([2026]);
      const categoriesSet = new Set<string>();

      const offlineData = snap.docs.map((document) => {
        const d = document.data();

        // 🔥 LOGIKA DURASI TETAP SAMA (Bisa baca dari Admin manual, bisa dari Strava)
        const durationMs =
          d.netTimeMs || d.waktuFinish - (d.waktuStart || d.waktuFinish);
        const thn = d.waktuFinish
          ? new Date(d.waktuFinish).getFullYear()
          : 2026;
        yearsSet.add(thn);

        const hours = Math.floor(durationMs / 3600000);
        const minutes = Math.floor((durationMs % 3600000) / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);

        const durasiStr = [
          hours.toString().padStart(2, "0"),
          minutes.toString().padStart(2, "0"),
          seconds.toString().padStart(2, "0"),
        ].join(":");

        const kat = d.kategoriPeserta || "Umum";
        categoriesSet.add(kat);

        return {
          id: document.id,
          namaLengkap: d.namaLengkap || d.nama || "Unknown Runner",
          namaBib: d.namaBib || d.namaLengkap || "Runner",
          bibNumber: d.nomorBIB || d.bibNumber || "000",
          jarak: d.jarak || "5K",
          gender: d.jenisKelamin === "Perempuan" ? "P" : "L",
          kategoriPeserta: kat,
          waktuFinish: d.waktuFinish,
          durasiMs: durationMs,
          durasiStr: durasiStr,
          tahunEvent: thn,
          isStravaVerified: d.isStravaVerified || false, // 🔥 DETEKSI STATUS STRAVA
        };
      });

      setRunners(offlineData);
      setAvailableYears(Array.from(yearsSet).sort((a, b) => b - a));

      const detectedCategories = Array.from(categoriesSet).sort();
      if (detectedCategories.length > 0) {
        setCategories(detectedCategories);
      }

      setLastUpdate(new Date());
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredRunners = runners
    .filter(
      (r) =>
        r.tahunEvent === selectedYear &&
        r.jarak === selectedDistance &&
        r.gender === selectedGender &&
        (selectedKategori === "semua" ||
          r.kategoriPeserta === selectedKategori),
    )
    .sort((a, b) => a.durasiMs - b.durasiMs);

  const top3 = filteredRunners.slice(0, 3);
  const totalPages = Math.ceil(filteredRunners.length / itemsPerPage);
  const currentTableData = filteredRunners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const changeFilter = (setter: any, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B2239] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/10 border-t-[#FCD116] rounded-full animate-spin mb-4"></div>
        <p className="text-white/70 text-xs uppercase font-bold tracking-widest animate-pulse">
          Menghubungkan Papan Klasemen...
        </p>
      </div>
    );
  }

  if (!isPublished) {
    return (
      <div className="min-h-screen bg-[#0B2239] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 border border-white/20">
          <svg className="w-10 h-10 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-widest mb-4 leading-tight">
          Klasemen Belum <br/><span className="text-[#FCD116]">Dipublikasikan</span>
        </h1>
        <p className="text-white/60 text-sm md:text-base max-w-md font-medium leading-relaxed">
          Papan klasemen sedang dikunci oleh admin. Silakan kembali lagi nanti atau pantau informasi terbaru melalui panggung utama.
        </p>
        <Link href="/run" className="mt-8 bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239] font-black px-8 py-3 rounded-full uppercase tracking-wider text-sm transition-all shadow-lg hover:shadow-xl hover:-translate-y-1">
          Kembali ke Event
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-24 selection:bg-[#FCD116] selection:text-[#0B2239]">
      <div className="bg-white border-b border-slate-200 py-4 px-6 md:px-12 sticky top-0 z-40 shadow-sm flex justify-between items-center">
        <Link
          href="/run"
          className="text-slate-500 hover:text-[#0B2239] font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali ke Event
        </Link>

        <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
            Musim Tahun:
          </label>
          <select
            value={selectedYear}
            onChange={(e) =>
              changeFilter(setSelectedYear, Number(e.target.value))
            }
            className="bg-white text-sm font-black text-[#0B2239] focus:outline-none cursor-pointer rounded border border-slate-200 px-2 py-0.5"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                RUN {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-black text-[#0B2239] tracking-tight uppercase mb-2">
            Leaderboard Running IKA UII DIY {selectedYear}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Klasemen pelari resmi berwaktu tercepat • Diperbarui otomatis
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl mb-12 space-y-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={() => changeFilter(setSelectedKategori, "semua")}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${selectedKategori === "semua" ? "bg-[#0B2239] border-[#0B2239] text-white shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
              >
                Semua Status
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => changeFilter(setSelectedKategori, cat)}
                  className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all ${selectedKategori === cat ? "bg-[#0B2239] border-[#0B2239] text-[#FCD116] shadow-md" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
                >
                  {cat === "SMA/Pelajar" ? "Pelajar" : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100 text-xs font-bold uppercase tracking-widest shrink-0">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              Live Syncing
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-1">
            <div className="flex flex-wrap gap-2">
              {distances.map((dist) => (
                <button
                  key={dist}
                  onClick={() => changeFilter(setSelectedDistance, dist)}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
                    selectedDistance === dist
                      ? "bg-[#1A73E8] text-white border-[#1A73E8] shadow-md shadow-blue-500/10"
                      : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-white hover:text-[#1A73E8]"
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>

            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex shrink-0">
              <button
                onClick={() => changeFilter(setSelectedGender, "L")}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${selectedGender === "L" ? "bg-white text-[#0B2239] shadow-sm font-black" : "text-slate-500 hover:text-slate-800"}`}
              >
                Pria (M)
              </button>
              <button
                onClick={() => changeFilter(setSelectedGender, "P")}
                className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${selectedGender === "P" ? "bg-white text-rose-600 shadow-sm font-black" : "text-slate-500 hover:text-rose-600"}`}
              >
                Wanita (F)
              </button>
            </div>
          </div>
        </div>

        {filteredRunners.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="text-5xl mb-4">🏁</div>
            <h3 className="text-lg font-bold text-[#0B2239] uppercase tracking-wide">
              Belum Ada Finisher
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Belum ada catatan waktu finish yang masuk untuk filter pencarian
              ini.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 md:gap-6 mb-12">
              {/* PODIUM 2 */}
              {top3[1] && (
                <div className="w-full md:w-64 bg-white rounded-3xl p-6 text-center border border-slate-200 shadow-sm flex flex-col justify-between relative order-2 md:order-1 mt-6 md:mt-0">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-slate-200 border-4 border-white rounded-full flex items-center justify-center text-slate-700 font-black text-sm shadow-md">
                    {getInitials(top3[1].namaBib)}
                  </div>
                  <span className="absolute top-4 right-4 text-xl">🥈</span>
                  <div className="mt-6 flex-grow flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="font-black text-[#0B2239] text-base uppercase tracking-tight line-clamp-1">
                        {top3[1].namaBib}
                      </h3>
                      {top3[1].isStravaVerified && (
                        <svg
                          className="w-4 h-4 text-[#FC4C02]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      BIB {top3[1].bibNumber}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase">
                      {top3[1].kategoriPeserta}
                    </p>
                  </div>
                  <div className="mt-4 bg-slate-100 border border-slate-200 text-slate-700 font-black py-2 rounded-xl text-base font-mono">
                    {top3[1].durasiStr}
                  </div>
                </div>
              )}

              {/* PODIUM 1 */}
              {top3[0] && (
                <div className="w-full md:w-72 bg-[#0B2239] rounded-3xl p-6 text-center border-4 border-[#FCD116] shadow-2xl relative z-10 order-1 md:order-2 transform md:scale-105 flex flex-col justify-between">
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-[#FCD116] border-4 border-[#0B2239] rounded-full flex items-center justify-center text-[#0B2239] font-black text-base shadow-xl">
                    {getInitials(top3[0].namaBib)}
                  </div>
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce">
                    👑
                  </span>
                  <div className="mt-8 flex-grow flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="font-black text-[#FCD116] text-lg uppercase tracking-tight line-clamp-1">
                        {top3[0].namaBib}
                      </h3>
                      {top3[0].isStravaVerified && (
                        <svg
                          className="w-5 h-5 text-[#FC4C02] drop-shadow-md"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      BIB {top3[0].bibNumber}
                    </p>
                    <p className="text-xs text-white/70 font-semibold mt-1 uppercase tracking-wider">
                      {top3[0].kategoriPeserta}
                    </p>
                  </div>
                  <div className="mt-5 bg-[#FCD116] text-[#0B2239] font-black py-2.5 rounded-xl text-lg font-mono shadow-md">
                    {top3[0].durasiStr}
                  </div>
                </div>
              )}

              {/* PODIUM 3 */}
              {top3[2] && (
                <div className="w-full md:w-64 bg-white rounded-3xl p-6 text-center border border-slate-200 shadow-sm flex flex-col justify-between relative order-3 md:order-3 mt-6 md:mt-0">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-14 bg-amber-100 border-4 border-white rounded-full flex items-center justify-center text-amber-800 font-black text-sm shadow-md">
                    {getInitials(top3[2].namaBib)}
                  </div>
                  <span className="absolute top-4 right-4 text-xl">🥉</span>
                  <div className="mt-6 flex-grow flex flex-col justify-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <h3 className="font-black text-[#0B2239] text-base uppercase tracking-tight line-clamp-1">
                        {top3[2].namaBib}
                      </h3>
                      {top3[2].isStravaVerified && (
                        <svg
                          className="w-4 h-4 text-[#FC4C02]"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                      )}
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                      BIB {top3[2].bibNumber}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1 uppercase">
                      {top3[2].kategoriPeserta}
                    </p>
                  </div>
                  <div className="mt-4 bg-slate-100 border border-slate-200 text-slate-700 font-black py-2 rounded-xl text-base font-mono">
                    {top3[2].durasiStr}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <th className="py-4 px-6 w-20 text-center">Rank</th>
                      <th className="py-4 px-6">Runner / Atlet</th>
                      <th className="py-4 px-6 w-28">BIB</th>
                      <th className="py-4 px-6">Klasifikasi</th>
                      <th className="py-4 px-6 text-right w-36">Net Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {currentTableData.map((runner, idx) => {
                      const actualRank =
                        (currentPage - 1) * itemsPerPage + idx + 1;
                      let rankBadge = "bg-slate-100 text-slate-500 font-bold";
                      if (actualRank === 1)
                        rankBadge =
                          "bg-[#FCD116] text-[#0B2239] font-black shadow-inner";
                      else if (actualRank === 2)
                        rankBadge =
                          "bg-slate-300 text-slate-800 font-black shadow-inner";
                      else if (actualRank === 3)
                        rankBadge =
                          "bg-amber-600 text-white font-black shadow-inner";

                      return (
                        <tr
                          key={runner.id}
                          className="hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="py-4 px-6 text-center">
                            <div
                              className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs ${rankBadge}`}
                            >
                              {actualRank}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 text-[#0B2239] border border-slate-200 font-black flex items-center justify-center text-[10px] shrink-0">
                                {getInitials(runner.namaBib)}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#0B2239] text-sm group-hover:text-[#1A73E8] transition-colors block uppercase">
                                    {runner.namaLengkap}
                                  </span>
                                  {/* 🔥 BADGE STRAVA MUNCUL DI TABEL JUGA 🔥 */}
                                  {runner.isStravaVerified && (
                                    <span
                                      title="Strava Verified"
                                      className="bg-orange-50 text-[#FC4C02] rounded px-1 py-0.5"
                                    >
                                      <svg
                                        className="w-3 h-3"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                      >
                                        <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                                      </svg>
                                    </span>
                                  )}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mt-0.5 block">
                                  {runner.kategoriPeserta === "SMA/Pelajar"
                                    ? "Pelajar"
                                    : runner.kategoriPeserta}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm font-mono font-black text-slate-700 tracking-wider">
                              {runner.bibNumber}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[9px] font-black text-slate-500 uppercase bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md">
                              {runner.jarak} •{" "}
                              {runner.gender === "L" ? "M" : "F"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-black text-sm text-[#0B2239] tracking-wide">
                            {runner.durasiStr}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1A73E8] hover:text-[#1A73E8] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-[#1A73E8] hover:text-[#1A73E8] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
