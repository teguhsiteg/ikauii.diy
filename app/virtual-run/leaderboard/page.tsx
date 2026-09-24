"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import VirtualRunNavbar from "@/components/virtual-run/VirtualRunNavbar";
import VirtualRunFooter from "@/components/virtual-run/VirtualRunFooter";
import {
  Search,
  X,
  ChevronRight,
  ChevronLeft,
  Activity,
  CheckCircle2,
  Clock,
  User,
  Users,
  Award,
} from "lucide-react";

export default function LeaderboardPage() {
  // --- STATE LEADERBOARD ---
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vrSettings, setVrSettings] = useState<any>(null);

  // --- STATE FILTER & PENCARIAN ---
  const [activeTab, setActiveTab] = useState("Semua");
  const [activeJarak, setActiveJarak] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [availableDistances, setAvailableDistances] = useState<string[]>([]);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVrSettings(docSnap.data());
        }

        const pSnap = await getDocs(collection(db, "vr_participants"));
        const participants = pSnap.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (p: any) =>
              p.statusPembayaran === "Lunas" ||
              p.statusPembayaran === "lunas",
          );

        const distances = new Set<string>();
        participants.forEach((p: any) => {
          if (p.jarak) distances.add(p.jarak);
        });
        setAvailableDistances(Array.from(distances).sort());

        const sSnap = await getDocs(collection(db, "vr_submissions"));

        const submissions = sSnap.docs
          .map((doc) => doc.data())
          .filter((s: any) => s.status === "Approved")
          .sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds
              ? a.createdAt.seconds
              : new Date(a.createdAt || 0).getTime();
            const dateB = b.createdAt?.seconds
              ? b.createdAt.seconds
              : new Date(b.createdAt || 0).getTime();
            return dateA - dateB;
          });

        const calculatedData = participants.map((p: any) => {
          const userSubmissions = submissions.filter(
            (s: any) => s.participantId === p.id,
          );

          let totalKm = 0;
          let finisherDate = null;
          let totalSeconds = 0;
          const targetKm = parseInt(p.jarak?.replace(/\D/g, "")) || 0;

          for (const sub of userSubmissions) {
            totalKm += sub.jarakKm || 0;
            if (totalKm >= targetKm && !finisherDate) {
              finisherDate = sub.createdAt;
            }

            if (sub.durasi) {
              let sec = 0;
              const str = String(sub.durasi).toLowerCase().trim();

              if (str.includes(":")) {
                const parts = str
                  .split(":")
                  .map((n) => parseInt(n.replace(/\D/g, "")) || 0);
                if (parts.length >= 3) {
                  sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) {
                  sec = parts[0] * 60 + parts[1];
                }
              } else if (
                str.includes("j") ||
                str.includes("h") ||
                str.includes("m") ||
                str.includes("s")
              ) {
                const jamMatch = str.match(/(\d+)\s*(j|h)/);
                const menitMatch = str.match(/(\d+)\s*(m)/);
                const detikMatch = str.match(/(\d+)\s*(s|d)/);
                if (jamMatch) sec += parseInt(jamMatch[1]) * 3600;
                if (menitMatch) sec += parseInt(menitMatch[1]) * 60;
                if (detikMatch) sec += parseInt(detikMatch[1]);
              } else {
                const num = parseFloat(str);
                if (!isNaN(num)) sec = Math.floor(num * 60);
              }
              if (!isNaN(sec)) totalSeconds += sec;
            }
          }

          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          const s = totalSeconds % 60;

          let totalDurasiFormat = "0j 0m";
          if (h > 0) totalDurasiFormat = `${h}j ${m}m`;
          else if (m > 0) totalDurasiFormat = `${m}m ${s}s`;
          else if (s > 0) totalDurasiFormat = `${s}s`;

          const isFinisher = targetKm > 0 && totalKm >= targetKm;
          const persentase =
            targetKm > 0 ? Math.min(100, (totalKm / targetKm) * 100) : 0;

          const derivedKategori = p.kategori 
            ? p.kategori 
            : (p.tipePeserta ? p.tipePeserta.charAt(0).toUpperCase() + p.tipePeserta.slice(1).toLowerCase() : "Umum");

          return {
            ...p,
            kategori: derivedKategori,
            totalKm,
            targetKm,
            totalDurasiFormat,
            isFinisher,
            persentase,
            finisherDate,
            registeredDate:
              p.tanggalDaftar || p.createdAt || p.timestamp || null,
          };
        });

        calculatedData.sort((a, b) => {
          if (b.totalKm !== a.totalKm) return b.totalKm - a.totalKm;
          if (
            a.isFinisher &&
            b.isFinisher &&
            a.finisherDate &&
            b.finisherDate
          ) {
            const dateA = a.finisherDate?.seconds
              ? a.finisherDate.seconds
              : new Date(a.finisherDate).getTime();
            const dateB = b.finisherDate?.seconds
              ? b.finisherDate.seconds
              : new Date(b.finisherDate).getTime();
            return dateA - dateB;
          }
          return 0;
        });

        setLeaderboard(calculatedData);
      } catch (error: any) {
        console.error("Gagal memuat leaderboard:", error?.message || error, error?.code || "");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // --- STATISTIK AGREGAT EVENT ---
  const statsSummary = useMemo(() => {
    const totalPelari = leaderboard.length;
    const totalKm = leaderboard.reduce((acc, curr) => acc + (curr.totalKm || 0), 0);
    const totalFinisher = leaderboard.filter((p) => p.isFinisher).length;
    return { totalPelari, totalKm, totalFinisher };
  }, [leaderboard]);

  // --- FILTERING DATA ---
  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter((p) => {
      const matchKategori =
        activeTab === "Semua" ||
        p.kategori?.toLowerCase() === activeTab.toLowerCase() ||
        (activeTab === "Alumni" && (p.tipePeserta === "alumni" || p.kategori === "Alumni")) ||
        (activeTab === "Umum" && (p.tipePeserta === "umum" || p.kategori === "Umum"));

      const matchJarak =
        activeJarak === "Semua" || p.jarak === activeJarak;

      const matchSearch =
        !searchQuery.trim() ||
        p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nomorBibLengkap?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchKategori && matchJarak && matchSearch;
    });
  }, [leaderboard, activeTab, activeJarak, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, activeJarak]);

  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredLeaderboard.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const isPageOneWithoutSearch = currentPage === 1 && !searchQuery.trim();

  // Pelari yang sudah mulai lari dan punya KM > 0
  const activeRunnersWithKm = useMemo(() => {
    return filteredLeaderboard.filter((p) => (p.totalKm || 0) > 0);
  }, [filteredLeaderboard]);

  // Podium HANYA ada jika minimal ada peserta yang sudah aktif berlari (totalKm > 0)
  const podiumData = useMemo(() => {
    if (!isPageOneWithoutSearch || activeRunnersWithKm.length === 0) return [];
    return activeRunnersWithKm.slice(0, 3);
  }, [isPageOneWithoutSearch, activeRunnersWithKm]);

  // Data baris tabel: jika podium aktif, sembunyikan yang sudah tampil di podium
  const listData = useMemo(() => {
    if (podiumData.length > 0) {
      const podiumIds = new Set(podiumData.map((p) => p.id));
      return paginatedData.filter((p) => !podiumIds.has(p.id));
    }
    return paginatedData;
  }, [podiumData, paginatedData]);

  // Urutan visual podium: Juara 2 (Kiri), Juara 1 (Tengah/Tinggi), Juara 3 (Kanan)
  const podiumLayout = useMemo(() => {
    if (podiumData.length === 0) return [];
    const items = [];
    if (podiumData[1]) {
      items.push({
        rank: 2,
        data: podiumData[1],
        borderClass: "border-slate-300",
        badgeBg: "bg-slate-700 text-slate-100",
        label: "Peringkat 2",
      });
    }
    if (podiumData[0]) {
      items.push({
        rank: 1,
        data: podiumData[0],
        borderClass: "border-yellow-400 shadow-yellow-400/20",
        badgeBg: "bg-yellow-400 text-slate-950",
        label: "Peringkat 1",
      });
    }
    if (podiumData[2]) {
      items.push({
        rank: 3,
        data: podiumData[2],
        borderClass: "border-amber-600",
        badgeBg: "bg-amber-800 text-amber-100",
        label: "Peringkat 3",
      });
    }
    return items;
  }, [podiumData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#071324] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-yellow-400 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
          Memuat Klasemen...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col selection:bg-yellow-400 selection:text-slate-950 relative antialiased text-slate-800">
      {/* NAVBAR EVENT */}
      <VirtualRunNavbar />

      {/* HERO LEADERBOARD DENGAN LIVE STATS */}
      <section className="bg-[#071324] pt-32 pb-24 lg:pt-36 lg:pb-28 px-4 sm:px-6 lg:px-8 text-white relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-b from-[#071324] via-[#0B1D35] to-[#071324] opacity-90"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full mb-5 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
              Live Progress Leaderboard
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black mb-4 tracking-tight leading-tight">
            Klasemen Pelari Virtual
          </h1>

          <p className="text-slate-300 text-sm sm:text-base font-normal max-w-xl mx-auto mb-10 leading-relaxed">
            Pantau perolehan kilometer lari seluruh peserta secara realtime. Setiap kilometer tercatat menuju garis akhir.
          </p>

          {/* Quick Metrics Ribbon in Hero */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Users className="w-3 h-3 text-blue-400" /> Peserta
              </p>
              <p className="text-lg sm:text-2xl font-black text-white font-mono">
                {statsSummary.totalPelari.toLocaleString("id-ID")}
              </p>
            </div>
            <div className="text-center border-x border-white/10">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Activity className="w-3 h-3 text-yellow-400" /> Total Jarak
              </p>
              <p className="text-lg sm:text-2xl font-black text-yellow-400 font-mono">
                {statsSummary.totalKm.toFixed(1)}{" "}
                <span className="text-xs font-sans text-slate-300">KM</span>
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                <Award className="w-3 h-3 text-emerald-400" /> Finisher
              </p>
              <p className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                {statsSummary.totalFinisher.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN KONTEN */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-24">
        {/* FILTER & SEARCH BAR SLIDER */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            {/* Category Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              {["Semua", "Alumni", "Umum"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Distance Filter Dropdown */}
            {availableDistances.length > 0 && (
              <div className="w-full sm:w-auto">
                <select
                  value={activeJarak}
                  onChange={(e) => setActiveJarak(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-slate-800 cursor-pointer transition-all"
                >
                  <option value="Semua">Semua Target Jarak</option>
                  {availableDistances.map((jarak) => (
                    <option key={jarak} value={jarak}>
                      Kategori {jarak}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari nama atau nomor BIB..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-slate-800 focus:bg-white transition-all text-slate-800"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* PODIUM JUARA TOP 3 (KARTU ATLETIK PREMIUM) */}
        {isPageOneWithoutSearch && podiumData.length > 0 && (
          <div className="mb-10">
            <div className="text-center mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                Pemuncak Klasemen
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6 items-end">
              {podiumLayout.map((podium) => {
                const runner = podium.data;
                if (!runner) return null;
                const isChampion = podium.rank === 1;

                return (
                  <div
                    key={podium.rank}
                    className={`bg-white rounded-3xl p-6 border transition-all relative flex flex-col items-center text-center group hover:shadow-xl ${
                      isChampion
                        ? "border-yellow-400 shadow-lg shadow-yellow-500/10 sm:-translate-y-3 bg-gradient-to-b from-yellow-50/40 via-white to-white"
                        : "border-slate-200 shadow-sm"
                    }`}
                  >
                    {/* Rank Badge */}
                    <div
                      className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center absolute -top-4 shadow-md font-mono ${podium.badgeBg}`}
                    >
                      {podium.rank}
                    </div>

                    <Link
                      href={`/u/${runner.slug || runner.id}`}
                      className="mt-3 flex flex-col items-center w-full"
                    >
                      {/* Avatar */}
                      <div className="relative mb-3">
                        {runner.fotoProfilUrl ? (
                          <img
                            src={runner.fotoProfilUrl}
                            alt={runner.nama}
                            className={`rounded-full object-cover border-4 ${
                              isChampion
                                ? "w-20 h-20 border-yellow-400 shadow-md"
                                : "w-16 h-16 border-slate-200"
                            }`}
                          />
                        ) : (
                          <div
                            className={`rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black border-4 ${
                              isChampion
                                ? "w-20 h-20 text-2xl border-yellow-400"
                                : "w-16 h-16 text-xl border-slate-200"
                            }`}
                          >
                            {runner.nama?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <h3 className="font-black text-slate-900 text-base leading-snug line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {runner.nama}
                      </h3>

                      <div className="flex items-center gap-1.5 mt-1.5 mb-4">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {runner.kategori}
                        </span>
                        {runner.nomorBibLengkap && (
                          <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            BIB: {runner.nomorBibLengkap}
                          </span>
                        )}
                      </div>

                      {/* Metric Box */}
                      <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-3 mb-3">
                        <p className="text-2xl font-black text-slate-950 font-mono tracking-tight">
                          {runner.totalKm.toFixed(1)}{" "}
                          <span className="text-xs font-sans text-slate-400 font-bold">
                            / {runner.targetKm} KM
                          </span>
                        </p>
                        <p className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {runner.totalDurasiFormat || "0j 0m"}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full ${
                            runner.isFinisher ? "bg-emerald-500" : "bg-blue-600"
                          }`}
                          style={{ width: `${runner.persentase}%` }}
                        ></div>
                      </div>

                      <span className="text-[10px] font-bold text-slate-400">
                        {runner.isFinisher
                          ? "Selesai 100%"
                          : `${runner.persentase.toFixed(0)}% Tercapai`}
                      </span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LIST LEADERBOARD ROWS */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Daftar Pelari ({filteredLeaderboard.length})</span>
            <span className="hidden sm:inline">Perolehan Jarak &amp; Durasi</span>
          </div>

          {filteredLeaderboard.length === 0 ? (
            <div className="text-center py-20 px-4">
              <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-black text-slate-700 text-base mb-1">
                {searchQuery ? "Pelari Tidak Ditemukan" : "Belum Ada Peserta"}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Silakan sesuaikan filter target jarak/kategori atau gunakan kata kunci pencarian lain.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {listData.length === 0 && podiumData.length > 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-medium">
                  Seluruh peserta pada filter ini ditampilkan di podium pemuncak di atas.
                </div>
              ) : (
                listData.map((pelari) => {
                  const rank =
                    filteredLeaderboard.findIndex((p) => p.id === pelari.id) + 1;

                  return (
                    <Link
                      href={`/u/${pelari.slug || pelari.id}`}
                      key={pelari.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-slate-50/80 transition-colors group cursor-pointer gap-4"
                    >
                      {/* Left: Rank, Avatar, Identity */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 font-mono font-black text-xs flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          {rank}
                        </div>

                        <div className="shrink-0">
                          {pelari.fotoProfilUrl ? (
                            <img
                              src={pelari.fotoProfilUrl}
                              alt={pelari.nama}
                              className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-black text-base border border-slate-200">
                              {pelari.nama?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-900 text-sm sm:text-base truncate group-hover:text-blue-600 transition-colors">
                              {pelari.nama}
                            </h4>
                            {pelari.isFinisher && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Finisher
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              {pelari.kategori}
                            </span>
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                              {pelari.jarak}
                            </span>
                            {pelari.nomorBibLengkap && (
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
                                BIB: {pelari.nomorBibLengkap}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: KM, Progress, Chevron */}
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                        {/* Progress Bar & Durasi */}
                        <div className="w-36 sm:w-44 flex flex-col justify-center">
                          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {pelari.totalDurasiFormat || "0j 0m"}
                            </span>
                            <span>{pelari.persentase.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pelari.isFinisher ? "bg-emerald-500" : "bg-blue-600"
                              }`}
                              style={{ width: `${pelari.persentase}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* KM Display */}
                        <div className="text-right min-w-[90px]">
                          <p className="font-black text-lg text-slate-900 font-mono leading-none">
                            {pelari.totalKm.toFixed(1)}
                            <span className="text-xs font-sans text-slate-400 font-bold ml-1">
                              KM
                            </span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold mt-1">
                            Target {pelari.targetKm} KM
                          </p>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-700 transition-colors hidden sm:block" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-xs font-bold text-slate-600">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="font-mono text-slate-800">
              Halaman <span className="text-slate-950 font-black">{currentPage}</span> dari {totalPages}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 transition-colors"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* FOOTER KHUSUS VIRTUAL RUN */}
      <VirtualRunFooter sosmeds={vrSettings?.sosmeds} />
    </div>
  );
}
