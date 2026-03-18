"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getCountFromServer,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";

export default function DashboardPage() {
  // 1. STATE UNTUK STATISTIK
  const [stats, setStats] = useState({
    berita: 0,
    agenda: 0,
    bidang: 0,
    total: 0,
  });

  // 2. STATE UNTUK PROFIL HAK AKSES
  const [userProfile, setUserProfile] = useState({
    name: "Memuat...",
    role: "loading", // super_admin | koordinator | pengurus
    bidang: "",
  });

  const [isLoadingStats, setIsLoadingStats] = useState(true);

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

  // 4. FETCH DATA COUNT DARI FIREBASE
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const beritaSnap = await getCountFromServer(collection(db, "berita"));
        const agendaSnap = await getCountFromServer(collection(db, "agenda"));
        const bidangSnap = await getCountFromServer(collection(db, "bidang"));

        const beritaCount = beritaSnap.data().count;
        const agendaCount = agendaSnap.data().count;
        const bidangCount = bidangSnap.data().count;

        setStats({
          berita: beritaCount,
          agenda: agendaCount,
          bidang: bidangCount,
          total: beritaCount + agendaCount,
        });
      } catch (error) {
        console.error("Gagal mengambil statistik:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const getPercentage = (value: number) => {
    if (stats.total === 0) return 0;
    return Math.round((value / stats.total) * 100);
  };

  const isSuperAdmin = userProfile.role === "super_admin";

  if (userProfile.role === "loading") {
    return (
      <div className="h-64 flex items-center justify-center animate-pulse text-slate-400 font-bold">
        Memuat Dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* --- BANNER SELAMAT DATANG (DINAMIS BERDASARKAN ROLE) --- */}
      <div className="bg-gradient-to-r from-blue-950 to-blue-800 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/4 w-64 h-64 bg-yellow-400/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-2">
            Selamat Datang, {userProfile.name}! 👋
          </h2>
          <p className="text-blue-200 max-w-2xl text-lg leading-relaxed">
            {isSuperAdmin
              ? "Anda login sebagai Super Admin. Gunakan menu di sebelah kiri untuk mengelola master data, program kerja, dan seluruh konten publik website IKA UII DIY."
              : `Anda login sebagai Koordinator ${userProfile.bidang || "Bidang"}. Silakan akses Ruang Kerja Proker Anda di menu sebelah kiri untuk mengelola persuratan dan kegiatan.`}
          </p>
        </div>
      </div>

      {/* --- KARTU STATISTIK ATAS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Card 1: Publikasi Berita */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Total Berita & Artikel
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-slate-800">
              {isLoadingStats ? "..." : stats.berita}
            </p>
            <span className="text-xs text-green-500 font-bold bg-green-50 px-2 py-0.5 rounded-full">
              Publikasi
            </span>
          </div>
        </div>

        {/* Card 2: Agenda Kegiatan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 rounded-xl bg-yellow-50 text-yellow-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">Agenda Terjadwal</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-slate-800">
              {isLoadingStats ? "..." : stats.agenda}
            </p>
            <span className="text-xs text-blue-500 font-bold bg-blue-50 px-2 py-0.5 rounded-full">
              Kegiatan
            </span>
          </div>
        </div>

        {/* Card 3: Master Data Bidang */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <p className="text-slate-500 text-sm font-medium">
            Departemen / Bidang
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-bold text-slate-800">
              {isLoadingStats ? "..." : stats.bidang}
            </p>
            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
              Organisasi
            </span>
          </div>
        </div>
      </div>

      {/* --- BAGIAN BAWAH: DIAGRAM & QUICK ACTION --- */}
      <div
        className={`grid grid-cols-1 ${isSuperAdmin ? "lg:grid-cols-3" : "lg:grid-cols-1"} gap-6`}
      >
        {/* Kolom Kiri - Diagram Tailwind Murni */}
        <div
          className={`${isSuperAdmin ? "lg:col-span-2" : "w-full"} bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm`}
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                Distribusi Konten Publik
              </h3>
              <p className="text-sm text-slate-500">
                Perbandingan jumlah rilis Berita vs Agenda
              </p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>

          {isLoadingStats ? (
            <div className="h-40 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : stats.total === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <span className="text-2xl mb-2">📊</span>
              <p className="text-sm">Belum ada data konten yang dipublikasi.</p>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl">
              {/* Bar 1: Berita */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500"></span>{" "}
                    Berita & Artikel
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {getPercentage(stats.berita)}%{" "}
                    <span className="text-slate-400 font-normal">
                      ({stats.berita})
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${getPercentage(stats.berita)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              {/* Bar 2: Agenda */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>{" "}
                    Agenda Kegiatan
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {getPercentage(stats.agenda)}%{" "}
                    <span className="text-slate-400 font-normal">
                      ({stats.agenda})
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-4 rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${getPercentage(stats.agenda)}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Kolom Kanan - Quick Actions (HANYA MUNCUL JIKA SUPER ADMIN) */}
        {isSuperAdmin && (
          <div className="bg-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-800 rounded-full opacity-50 blur-2xl"></div>
            <h3 className="text-lg font-bold mb-2 relative z-10">
              Akses Cepat
            </h3>
            <p className="text-blue-300 text-sm mb-6 relative z-10">
              Jalan pintas ke menu operasional.
            </p>
            <div className="space-y-3 relative z-10">
              <Link
                href="/dashboard/pengaturan"
                className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">⚙️</span>
                  <span className="font-medium text-sm">Edit Landing Page</span>
                </div>
                <span className="group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </Link>
              <Link
                href="/dashboard/master-data"
                className="flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">📁</span>
                  <span className="font-medium text-sm">
                    Kelola Bidang Baru
                  </span>
                </div>
                <span className="group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
