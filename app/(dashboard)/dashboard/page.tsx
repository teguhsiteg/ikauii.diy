"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  doc,
  getDoc,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function DashboardPage() {
  // 1. STATE UNTUK STATISTIK & LOG
  const [stats, setStats] = useState({
    berita: 0,
    agenda: 0,
    bidang: 0,
    total: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. STATE UNTUK PROFIL HAK AKSES
  const [userProfile, setUserProfile] = useState({
    name: "Memuat...",
    role: "loading", // super_admin | koordinator | pengurus
    bidang: "",
  });

  // 3. FETCH PROFIL PENGGUNA
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          let roleSistem = "pengurus";
          let bidangSistem = "";

          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            roleSistem = data.role || "pengurus";
            bidangSistem = data.bidang || "";
          }

          setUserProfile({
            name: user.displayName || "Pengurus",
            role: roleSistem,
            bidang: bidangSistem,
          });
        } catch (error) {
          console.error("Gagal memuat profil dashboard:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 4. FETCH STATISTIK & RECENT ACTIVITY
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // A. Hitung Statistik
        const beritaSnap = await getCountFromServer(collection(db, "berita"));
        const agendaSnap = await getCountFromServer(collection(db, "agenda"));
        const bidangSnap = await getCountFromServer(collection(db, "bidang"));

        const beritaCount = beritaSnap.data().count;
        const agendaCount = agendaSnap.data().count;

        setStats({
          berita: beritaCount,
          agenda: agendaCount,
          bidang: bidangSnap.data().count,
          total: beritaCount + agendaCount,
        });

        // B. Tarik Log Aktivitas (Gabungan Berita & Agenda Terbaru)
        const qBerita = query(
          collection(db, "berita"),
          orderBy("createdAt", "desc"),
          limit(4),
        );
        const qAgenda = query(
          collection(db, "agenda"),
          orderBy("createdAt", "desc"),
          limit(4),
        );

        const [snapB, snapA] = await Promise.all([
          getDocs(qBerita),
          getDocs(qAgenda),
        ]);

        const dataBerita = snapB.docs.map((d) => ({
          id: d.id,
          type: "Berita",
          title: d.data().judul,
          date: d.data().createdAt,
          author: d.data().koordinator || "Admin",
        }));

        const dataAgenda = snapA.docs.map((d) => ({
          id: d.id,
          type: "Agenda",
          title: d.data().judul,
          date: d.data().createdAt,
          author: d.data().koordinator || "Admin",
        }));

        // Gabungkan, urutkan berdasarkan waktu terbaru, ambil 5 teratas
        const mergedLogs = [...dataBerita, ...dataAgenda]
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          )
          .slice(0, 5);

        setRecentLogs(mergedLogs);
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  const isSuperAdmin = userProfile.role === "super_admin";

  if (userProfile.role === "loading") {
    return (
      <div className="h-full min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Menyiapkan Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 px-2 md:px-0">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
              Overview Dashboard
            </h1>
            <p className="text-slate-500 text-sm md:text-base max-w-2xl">
              Selamat datang,{" "}
              <span className="font-semibold text-slate-700">
                {userProfile.name}
              </span>
              .{" "}
              {isSuperAdmin
                ? "Anda memiliki akses penuh (Super Admin) untuk mengelola seluruh sistem."
                : `Anda login sebagai Koordinator Bidang. Akses Anda terbatas pada pengelolaan program kerja internal.`}
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <svg
              className="w-4 h-4 text-slate-400"
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
            <span className="text-sm font-medium text-slate-600">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* --- KARTU STATISTIK (DITAMPILKAN KE SEMUA ROLE) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-slate-500">
                Total Berita & Artikel
              </p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
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
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-4xl font-bold text-slate-900 tracking-tight">
                {isLoading ? "..." : stats.berita}
              </h3>
              <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                Publikasi
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-slate-500">
                Agenda Terjadwal
              </p>
              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-4xl font-bold text-slate-900 tracking-tight">
                {isLoading ? "..." : stats.agenda}
              </h3>
              <span className="flex items-center text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                Aktif
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-slate-300 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-medium text-slate-500">
                Departemen / Bidang
              </p>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-4xl font-bold text-slate-900 tracking-tight">
                {isLoading ? "..." : stats.bidang}
              </h3>
              <span className="flex items-center text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                Organisasi
              </span>
            </div>
          </div>
        </div>

        {/* --- MAIN LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI (Distribusi & Aksi Cepat) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* DISTRIBUSI KONTEN */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
              <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Distribusi Konten Publik
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Volume rilis berita berbanding agenda acara
                  </p>
                </div>
              </div>

              {isLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                </div>
              ) : stats.total === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-sm font-medium">
                    Belum ada data metrik tersedia.
                  </p>
                </div>
              ) : (
                <div className="space-y-8 max-w-xl">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-semibold text-slate-700">
                          Berita & Artikel
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {getPercentage(stats.berita)}%{" "}
                        <span className="text-slate-400 font-medium ml-1">
                          ({stats.berita})
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${getPercentage(stats.berita)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                        <span className="text-sm font-semibold text-slate-700">
                          Agenda Kegiatan
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {getPercentage(stats.agenda)}%{" "}
                        <span className="text-slate-400 font-medium ml-1">
                          ({stats.agenda})
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-orange-400 h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${getPercentage(stats.agenda)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AKSI CEPAT (Hanya Super Admin) */}
            {isSuperAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
                <h3 className="text-lg font-bold text-slate-900 mb-6">
                  Manajemen Master Data
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link
                    href="/dashboard/pengaturan"
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-blue-700">
                        Konten Landing Page
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        Ubah teks utama, banner, dan pengaturan dasar web
                        publik.
                      </p>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/master-data"
                    className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm group-hover:text-purple-700">
                        Departemen & Bidang
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        Kelola daftar bidang untuk keperluan struktur
                        organisasi.
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* KOLOM KANAN (Profil & Log Aktivitas) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* PROFIL CARD */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                Profil Akses
              </h4>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">
                    {userProfile.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 capitalize">
                    {userProfile.role.replace("_", " ")}
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                  Area Kerja Internal
                </p>
                <p className="text-sm font-medium text-slate-800 mt-0.5 line-clamp-1">
                  {isSuperAdmin
                    ? "Semua Akses (Global)"
                    : userProfile.bidang || "Belum ditentukan"}
                </p>
              </div>
            </div>

            {/* RECENT ACTIVITY LOGS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold text-slate-900">
                  Aktivitas Terakhir
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                  Live
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg shrink-0"></div>
                      <div className="w-full space-y-2 py-1">
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentLogs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-xl">
                  Belum ada aktivitas tercatat.
                </p>
              ) : (
                <div className="space-y-5 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                  {recentLogs.map((log, idx) => (
                    <div
                      key={log.id + idx}
                      className="relative flex items-start gap-4"
                    >
                      {/* Icon Indikator Log */}
                      <div
                        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center relative z-10 shadow-sm border border-white ${log.type === "Berita" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"}`}
                      >
                        {log.type === "Berita" ? (
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
                              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                            />
                          </svg>
                        ) : (
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Konten Log */}
                      <div className="flex-1 min-w-0 bg-slate-50 border border-slate-100 rounded-xl p-3 hover:bg-slate-100 transition-colors cursor-default">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${log.type === "Berita" ? "text-blue-600" : "text-orange-600"}`}
                          >
                            {log.type} Baru
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1 mb-1">
                          {log.title}
                        </p>
                        <p className="text-xs text-slate-500">
                          Oleh: {log.author}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
