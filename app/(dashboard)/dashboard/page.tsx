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
import {
  Activity,
  Users,
  FileText,
  Calendar,
  Settings,
  ChevronRight,
  TrendingUp,
  Globe,
  Award,
  Zap
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState({
    berita: 0,
    agenda: 0,
    bidang: 0,
    total: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: "Memuat...",
    role: "loading",
    bidang: "",
  });

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
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

        const qBerita = query(collection(db, "berita"), orderBy("createdAt", "desc"), limit(4));
        const qAgenda = query(collection(db, "agenda"), orderBy("createdAt", "desc"), limit(4));

        const [snapB, snapA] = await Promise.all([getDocs(qBerita), getDocs(qAgenda)]);

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

        const mergedLogs = [...dataBerita, ...dataAgenda]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
      <div className="h-full min-h-[60vh] flex flex-col items-center justify-center animate-pulse bg-[#F8FAFC]">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-16 h-16 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-8 text-slate-500 font-medium tracking-widest text-xs uppercase">Menyiapkan Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 pb-12 font-sans relative">
      <div className="max-w-7xl mx-auto space-y-6 pt-4 relative z-0">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                Ringkasan Eksekutif
              </h1>
            </div>
            <p className="text-slate-500 text-sm max-w-2xl">
              Selamat datang, <span className="font-bold text-slate-800">{userProfile.name}</span>.{" "}
              {isSuperAdmin
                ? "Anda memiliki akses Super Admin untuk mengelola seluruh sistem SIM DPW IKA UII DIY."
                : "Anda terautentikasi sebagai Koordinator Bidang."}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl shrink-0">
            <Calendar className="w-4 h-4 text-blue-700" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tanggal Hari Ini</span>
              <span className="text-xs font-bold text-slate-700">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm transition-all">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Publikasi Berita</p>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? "..." : stats.berita}
              </h3>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                Artikel Terbit
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm transition-all">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agenda Aktif</p>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? "..." : stats.agenda}
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                Kegiatan Terdaftar
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm transition-all">
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departemen / Bidang</p>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {isLoading ? "..." : stats.bidang}
              </h3>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                Otoritas Bidang
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left Column: Charts / Distribution */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Distribusi Publikasi Konten</h3>
                    <p className="text-xs text-slate-400">Rasio perbandingan jumlah berita publik dan agenda</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="h-32 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin"></div>
                </div>
              ) : stats.total === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Activity className="w-6 h-6 text-slate-300 mb-1" />
                  <p className="text-xs font-bold text-slate-400">Belum ada metrik publikasi</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-xl">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
                        <span className="text-xs font-bold text-slate-700">Berita & Artikel Publik</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {getPercentage(stats.berita)}% <span className="text-slate-400 font-medium">({stats.berita})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${getPercentage(stats.berita)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                        <span className="text-xs font-bold text-slate-700">Agenda Kegiatan</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">
                        {getPercentage(stats.agenda)}% <span className="text-slate-400 font-medium">({stats.agenda})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${getPercentage(stats.agenda)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions for Super Admin */}
            {isSuperAdmin && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-700" />
                  Navigasi Pintar Master System
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Link href="/dashboard/pengaturan" className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">CMS Web</h4>
                      <p className="text-[11px] text-slate-400">Pengaturan profil web</p>
                    </div>
                  </Link>

                  <Link href="/dashboard/master-data" className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Organisasi</h4>
                      <p className="text-[11px] text-slate-400">Struktur & pengurus</p>
                    </div>
                  </Link>

                  <Link href="/dashboard/users" className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:bg-blue-50/50 hover:border-blue-200 transition-all">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Akses Pengguna</h4>
                      <p className="text-[11px] text-slate-400">Pengaturan RBAC</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Aktivitas Terkini</h3>
                </div>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 animate-pulse">
                      <div className="w-8 h-8 rounded-lg bg-slate-200 shrink-0"></div>
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        <div className="h-2.5 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))
                ) : recentLogs.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Activity className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-400">Belum ada aktivitas publikasi</p>
                  </div>
                ) : (
                  recentLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        log.type === "Berita" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                      }`}>
                        {log.type === "Berita" ? <FileText className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-700 transition-colors">
                          {log.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                          <span className="font-semibold text-slate-600">{log.type}</span>
                          <span>•</span>
                          <span>{new Date(log.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-100 text-center">
              <Link href="/dashboard/dokumen" className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center justify-center gap-1">
                Lihat Seluruh Berkas <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
