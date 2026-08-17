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
    <div className="min-h-screen bg-slate-50 pb-12 font-sans relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-600/10 via-indigo-600/5 to-transparent pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-20 -left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-8 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 backdrop-blur-sm bg-white/40 p-6 rounded-3xl border border-white/60 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-600/20">
                <Globe className="w-5 h-5" />
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                Overview
              </h1>
            </div>
            <p className="text-slate-600 text-sm md:text-base max-w-2xl leading-relaxed">
              Selamat datang, <span className="font-bold text-slate-900">{userProfile.name}</span>.{" "}
              {isSuperAdmin
                ? "Anda memiliki akses Super Admin untuk mengelola seluruh ekosistem."
                : "Anda login sebagai Koordinator Bidang."}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md border border-slate-200/60 px-5 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-medium">Hari ini</span>
              <span className="text-sm font-bold text-slate-800">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <FileText className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-6">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Publikasi Berita</p>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
                <FileText className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-5xl font-extrabold text-slate-900 tracking-tighter">
                {isLoading ? "..." : stats.berita}
              </h3>
              <span className="flex items-center text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-1 rounded-lg">
                Artikel
              </span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Calendar className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-6">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Agenda Aktif</p>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Calendar className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-5xl font-extrabold text-slate-900 tracking-tighter">
                {isLoading ? "..." : stats.agenda}
              </h3>
              <span className="flex items-center text-xs font-bold text-orange-700 bg-orange-100/80 px-2.5 py-1 rounded-lg">
                Kegiatan
              </span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <Users className="w-24 h-24" />
            </div>
            <div className="flex justify-between items-start mb-6">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Departemen</p>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <h3 className="text-5xl font-extrabold text-slate-900 tracking-tighter">
                {isLoading ? "..." : stats.bidang}
              </h3>
              <span className="flex items-center text-xs font-bold text-purple-700 bg-purple-100/80 px-2.5 py-1 rounded-lg">
                Bidang
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column: Charts / Distribution */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-sm p-8">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Distribusi Publikasi</h3>
                    <p className="text-sm text-slate-500 mt-1">Perbandingan berita vs agenda</p>
                  </div>
                </div>
              </div>

              {isLoading ? (
                <div className="h-40 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
              ) : stats.total === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                  <Activity className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="text-sm font-bold text-slate-500">Belum ada data metrik</p>
                </div>
              ) : (
                <div className="space-y-8 max-w-xl">
                  <div className="group">
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50"></div>
                        <span className="text-sm font-bold text-slate-700">Berita & Artikel</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {getPercentage(stats.berita)}% <span className="text-slate-400 font-medium text-xs ml-1">({stats.berita})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                        style={{ width: `${getPercentage(stats.berita)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="group">
                    <div className="flex justify-between items-end mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-orange-400 shadow-sm shadow-orange-400/50"></div>
                        <span className="text-sm font-bold text-slate-700">Agenda Kegiatan</span>
                      </div>
                      <span className="text-sm font-black text-slate-900">
                        {getPercentage(stats.agenda)}% <span className="text-slate-400 font-medium text-xs ml-1">({stats.agenda})</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all duration-1000 ease-out group-hover:brightness-110"
                        style={{ width: `${getPercentage(stats.agenda)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions for Super Admin */}
            {isSuperAdmin && (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-xl p-8 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>
                
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Manajemen Master Data
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/dashboard/pengaturan" className="flex flex-col p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Settings className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Web Info</h4>
                    <p className="text-xs text-slate-400">Atur deskripsi & kontak utama.</p>
                  </Link>

                  <Link href="/dashboard/master-data" className="flex flex-col p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Organisasi</h4>
                    <p className="text-xs text-slate-400">Kelola kepengurusan struktural.</p>
                  </Link>

                  <Link href="/dashboard/users" className="flex flex-col p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Award className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-white mb-1">Akses RBAC</h4>
                    <p className="text-xs text-slate-400">Atur kewenangan hak akses.</p>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Recent Activity */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-sm p-8 h-full">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Aktivitas Terkini</h3>
              </div>
            </div>

            <div className="space-y-5">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : recentLogs.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-slate-500">Belum ada aktivitas publikasi</p>
                </div>
              ) : (
                recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-4 p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-slate-50 transition-all group cursor-pointer"
                  >
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                      log.type === "Berita" ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                    }`}>
                      {log.type === "Berita" ? <FileText className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                        {log.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 font-medium">
                        <span className={`px-2 py-0.5 rounded-md ${
                          log.type === "Berita" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"
                        }`}>
                          {log.type}
                        </span>
                        <span>•</span>
                        <span>{new Date(log.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
                        <span>•</span>
                        <span className="truncate">{log.author}</span>
                      </div>
                    </div>
                    <div className="hidden group-hover:flex items-center text-slate-400">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <Link href="/dashboard/berita" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1">
                Lihat Semua Data <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
