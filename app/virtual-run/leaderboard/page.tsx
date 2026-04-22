"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";

export default function LeaderboardPage() {
  // --- STATE LEADERBOARD ---
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE FILTER & PENCARIAN ---
  const [activeTab, setActiveTab] = useState("Semua"); // Kategori Peserta (Alumni/Umum)
  const [activeJarak, setActiveJarak] = useState("Semua"); // Filter Jarak (5K, 10K, dll)
  const [searchQuery, setSearchQuery] = useState("");

  // State untuk menyimpan daftar opsi jarak secara dinamis dari data
  const [availableDistances, setAvailableDistances] = useState<string[]>([]);

  // --- STATE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- STATE HEADER ---
  const [loggedInParticipant, setLoggedInParticipant] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper Format Tanggal
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "Data tidak tersedia";
    try {
      if (dateValue?.seconds) {
        return (
          new Intl.DateTimeFormat("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(dateValue.seconds * 1000)) + " WIB"
        );
      }
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "Format invalid";
      return (
        new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date) + " WIB"
      );
    } catch (error) {
      return "-";
    }
  };

  useEffect(() => {
    // 1. Fetch Data Leaderboard
    const fetchLeaderboard = async () => {
      try {
        const pQuery = query(
          collection(db, "vr_participants"),
          where("statusPembayaran", "==", "Lunas"),
        );
        const pSnap = await getDocs(pQuery);
        const participants = pSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Ekstrak opsi jarak unik dari data peserta yang ada
        const distances = new Set<string>();
        participants.forEach((p: any) => {
          if (p.jarak) distances.add(p.jarak);
        });
        setAvailableDistances(Array.from(distances).sort());

        const sQuery = query(
          collection(db, "vr_submissions"),
          where("status", "==", "Approved"),
        );
        const sSnap = await getDocs(sQuery);

        const submissions = sSnap.docs
          .map((doc) => doc.data())
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
          const targetKm = parseInt(p.jarak?.replace(/\D/g, "")) || 0;

          for (const sub of userSubmissions) {
            totalKm += sub.jarakKm || 0;
            if (totalKm >= targetKm && !finisherDate) {
              finisherDate = sub.createdAt;
            }
          }

          const isFinisher = totalKm >= targetKm;
          const persentase =
            targetKm > 0 ? Math.min(100, (totalKm / targetKm) * 100) : 0;

          return {
            ...p,
            kategori: p.kategori || "Umum",
            totalKm,
            targetKm,
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
      } catch (error) {
        console.error("Gagal memuat leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 2. Cek Status Login User
    const checkLogin = async () => {
      try {
        const savedEmail = localStorage.getItem("vr_user_email");
        if (savedEmail) {
          const qUser = query(
            collection(db, "vr_participants"),
            where("email", "==", savedEmail),
          );
          const userSnap = await getDocs(qUser);
          if (!userSnap.empty) {
            const userRecords = userSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            userRecords.sort((a: any, b: any) => {
              const timeA = new Date(
                a.tanggalDaftar || a.createdAt || 0,
              ).getTime();
              const timeB = new Date(
                b.tanggalDaftar || b.createdAt || 0,
              ).getTime();
              return timeB - timeA;
            });
            setLoggedInParticipant(userRecords[0]);
          }
        }
      } catch (error) {
        console.error("Gagal cek sesi:", error);
      }
    };

    fetchLeaderboard();
    checkLogin();
  }, []);

  // --- LOGIK FILTER (GANDA) & PENCARIAN ---
  const filteredLeaderboard = leaderboard.filter((p) => {
    const matchKategori = activeTab === "Semua" || p.kategori === activeTab;
    // Tambahan logika filter Jarak
    const matchJarak = activeJarak === "Semua" || p.jarak === activeJarak;
    const matchSearch = p.nama
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    return matchKategori && matchJarak && matchSearch;
  });

  // Reset pagination jika filter diubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab, activeJarak, itemsPerPage]);

  // --- LOGIK PAGINATION ---
  const totalPages = Math.ceil(filteredLeaderboard.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredLeaderboard.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center">
        <div className="w-14 h-14 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest animate-pulse">
          Memuat Klasemen...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col selection:bg-yellow-300 selection:text-blue-900">
      {/* ========================================= */}
      {/* HEADER UNIVERSAL */}
      {/* ========================================= */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors shrink-0">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo IKA UII"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="font-black text-slate-800 text-sm sm:text-lg leading-none tracking-tight truncate">
                IKA UII DIY
              </h1>
              <p className="text-[8px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5 truncate">
                Virtual Run Event
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-bold text-slate-600">
            <a
              href="/virtual-run#hero"
              className="hover:text-blue-600 transition-colors"
            >
              Beranda
            </a>
            <a
              href="/virtual-run#race-pack"
              className="hover:text-blue-600 transition-colors"
            >
              Race Pack
            </a>
            <a
              href="/virtual-run#route"
              className="hover:text-blue-600 transition-colors"
            >
              Rute
            </a>
            <a
              href="/virtual-run#timeline"
              className="hover:text-blue-600 transition-colors"
            >
              Timeline
            </a>
            <a
              href="/virtual-run#paket"
              className="hover:text-blue-600 transition-colors"
            >
              Paket Lari
            </a>
            <a
              href="/virtual-run/leaderboard"
              className="text-blue-600 transition-colors"
            >
              Lihat Klasemen
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/virtual-run/dashboard"
              className={`border font-bold px-4 py-2.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-2 shrink-0 ${loggedInParticipant ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"}`}
            >
              {loggedInParticipant ? (
                <>
                  <span className="w-4 h-4 bg-white/20 rounded-full flex items-center justify-center text-[8px]">
                    👤
                  </span>
                  <span>Dashboard</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Login</span>
                </>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-blue-600 focus:outline-none shrink-0"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-lg py-4 px-6 flex flex-col gap-4 text-sm font-bold text-slate-600">
            <a
              href="/virtual-run#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-blue-600 py-2 border-b border-slate-50"
            >
              Beranda
            </a>
            <a
              href="/virtual-run#race-pack"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-blue-600 py-2 border-b border-slate-50"
            >
              Race Pack
            </a>
            <a
              href="/virtual-run#route"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-blue-600 py-2 border-b border-slate-50"
            >
              Rute
            </a>
            <a
              href="/virtual-run#timeline"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-blue-600 py-2 border-b border-slate-50"
            >
              Timeline
            </a>
            <a
              href="/virtual-run#paket"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-blue-600 py-2 border-b border-slate-50"
            >
              Paket Lari
            </a>
            <a
              href="/virtual-run/leaderboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-blue-600 py-2"
            >
              Lihat Klasemen
            </a>
          </div>
        )}
      </header>

      {/* ========================================= */}
      {/* HERO LEADERBOARD                          */}
      {/* ========================================= */}
      <div className="bg-[#1E3A8A] pt-32 pb-28 px-4 text-center text-white relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <div className="inline-block bg-yellow-400 text-blue-900 text-[10px] font-black px-4 py-1.5 rounded-full mb-5 uppercase tracking-widest shadow-lg flex items-center gap-2 w-fit mx-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Update
          </div>
          <h1 className="text-4xl sm:text-4xl font-black mb-3 tracking-tight">
            Klasemen Pelari
          </h1>
          <p className="text-blue-200 text-sm sm:text-base font-medium max-w-lg mx-auto">
            Pantau pencapaian jarak seluruh peserta. Setiap langkah membawa kita
            lebih dekat ke garis akhir.
          </p>
        </div>
      </div>

      {/* ========================================= */}
      {/* MAIN KONTEN (FILTER & TABLE)              */}
      {/* ========================================= */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 -mt-16 relative z-20 pb-20">
        {/* KONTROL FILTER & SEARCH */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-3 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Kelompok Tabs (Kategori & Jarak) */}
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
            {/* Filter Kategori Peserta */}
            <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
              {["Semua", "Alumni", "Umum"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeTab === tab
                      ? "bg-white text-blue-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Filter Jarak Dinamis */}
            <div className="flex w-full sm:w-auto items-center">
              <select
                value={activeJarak}
                onChange={(e) => setActiveJarak(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer transition-all"
              >
                <option value="Semua">Semua Jarak</option>
                {availableDistances.map((jarak) => (
                  <option key={jarak} value={jarak}>
                    Kategori {jarak}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Cari nama pelari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-sm rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5"
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
          </div>
        </div>

        {/* Tabel / List Leaderboard */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-6">
          {paginatedData.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="text-5xl mb-4 opacity-30 grayscale">🏃‍♂️</div>
              <h3 className="font-black text-slate-700 text-lg mb-1">
                {searchQuery ? "Pelari Tidak Ditemukan" : "Belum Ada Data"}
              </h3>
              <p className="text-sm text-slate-500">
                Coba sesuaikan filter jarak/kategori, atau gunakan kata kunci
                pencarian lain.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {paginatedData.map((pelari, index) => {
                // Perhitungan Rank Global (bukan rank per halaman)
                const rank = startIndex + index + 1;
                let rankStyle = "bg-slate-100 text-slate-500 font-bold";
                let badgeIcon = null;

                if (rank === 1) {
                  rankStyle =
                    "bg-gradient-to-br from-yellow-300 to-yellow-500 text-yellow-900 shadow-md shadow-yellow-500/30 scale-110";
                  badgeIcon = "👑";
                } else if (rank === 2) {
                  rankStyle =
                    "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-md";
                } else if (rank === 3) {
                  rankStyle =
                    "bg-gradient-to-br from-orange-300 to-orange-500 text-orange-950 shadow-md";
                }

                return (
                  <Link
                    href={`/u/${pelari.slug || pelari.id}`}
                    key={pelari.id}
                    className="flex flex-col sm:flex-row sm:items-center p-5 sm:p-6 hover:bg-slate-50 transition-colors group cursor-pointer relative"
                  >
                    <div className="absolute top-4 right-4 sm:hidden">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${rankStyle}`}
                      >
                        {rank}
                      </div>
                    </div>

                    <div className="flex items-center w-full sm:w-auto">
                      <div
                        className={`hidden sm:flex w-10 h-10 rounded-full items-center justify-center text-base shrink-0 ${rankStyle}`}
                      >
                        {rank}
                      </div>

                      <div className="relative ml-0 sm:ml-5 shrink-0">
                        {pelari.fotoProfilUrl ? (
                          <img
                            src={pelari.fotoProfilUrl}
                            alt={pelari.nama}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white shadow-md"
                          />
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-black text-2xl border-4 border-white shadow-md">
                            {pelari.nama.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {badgeIcon && (
                          <span className="absolute -bottom-2 -right-2 text-xl filter drop-shadow-md">
                            {badgeIcon}
                          </span>
                        )}
                      </div>

                      <div className="ml-4 min-w-0 pr-8 sm:pr-0">
                        <h4 className="font-black text-slate-800 text-base sm:text-lg truncate group-hover:text-blue-600 transition-colors">
                          {pelari.nama}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-600 uppercase bg-slate-100 px-2.5 py-0.5 rounded-full">
                            {pelari.kategori}
                          </span>
                          <span className="text-[10px] font-bold text-blue-700 uppercase bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                            {pelari.jarak}
                          </span>
                          {pelari.isFinisher && (
                            <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              🏅 Finisher
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 sm:mt-0 flex-grow sm:ml-8 flex flex-col justify-center">
                      <div className="flex items-end justify-between mb-1.5">
                        <div className="text-[10px] text-slate-500 font-medium">
                          Progress Jarak
                        </div>
                        <div className="text-right">
                          <p className="font-black text-lg text-blue-950 leading-none">
                            {pelari.totalKm.toFixed(2)}{" "}
                            <span className="text-xs text-slate-500 font-bold">
                              / {pelari.targetKm} KM
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden shadow-inner">
                        <div
                          className={`h-2 rounded-full transition-all duration-1000 ${pelari.isFinisher ? "bg-emerald-500" : "bg-yellow-400"}`}
                          style={{ width: `${pelari.persentase}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] sm:text-[10px]">
                        <div className="text-slate-500 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Daftar: {formatDate(pelari.registeredDate)}
                        </div>
                        {pelari.isFinisher && pelari.finisherDate && (
                          <div className="text-emerald-600 font-bold flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Selesai: {formatDate(pelari.finisherDate)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* --- KONTROL PAGINATION --- */}
        {filteredLeaderboard.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              Tampilkan
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              data
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 active:bg-slate-100"
              >
                Sebelumnya
              </button>

              <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                Hal {currentPage} dari {totalPages}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 active:bg-slate-100"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================= */}
      {/* FOOTER RESMI */}
      {/* ========================================= */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-auto shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white p-1.5 rounded-lg">
                <img
                  src="/logo-dpp-ika.png"
                  alt="Logo IKA UII"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h3 className="text-white font-black text-xl">IKA UII DIY</h3>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Wadah silaturahmi, sinergi, dan kolaborasi para alumni Universitas
              Islam Indonesia di wilayah Daerah Istimewa Yogyakarta.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">
              Tautan Cepat
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-400 transition-colors"
                >
                  Portal Utama
                </Link>
              </li>
              <li>
                <Link
                  href="/virtual-run/register"
                  className="hover:text-blue-400 transition-colors"
                >
                  Pendaftaran Event
                </Link>
              </li>
              <li>
                <Link
                  href="/virtual-run/dashboard"
                  className="hover:text-blue-400 transition-colors"
                >
                  Dashboard Pelari
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">
              Kontak & Dukungan
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span>📧</span> ika.diy@uii.ac.id
              </li>
              <li className="flex items-center gap-2">
                <span>📍</span> Daerah Istimewa Yogyakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-xs text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p>
            &copy; {new Date().getFullYear()} DPW IKA UII DIY. Hak Cipta
            Dilindungi.
          </p>
          <p>Made with ❤️ for UII Alumni</p>
        </div>
      </footer>
    </div>
  );
}
