"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function TabDashboard() {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalMentors: 0,
    totalStudents: 0,
    totalRevenue: 0,
  });

  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // 1. Ambil Semua Data Masterclass
      const [coursesSnap, mentorsSnap, enrollmentsSnap, reviewsSnap] =
        await Promise.all([
          getDocs(collection(db, "masterclass_courses")),
          getDocs(collection(db, "masterclass_mentors")),
          getDocs(collection(db, "masterclass_enrollments")),
          getDocs(collection(db, "masterclass_reviews")),
        ]);

      // 2. Olah Data Pendapatan & Peserta
      const enrollments = enrollmentsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const lunasEnrollments = enrollments.filter(
        (e) => e.statusAkses === "Lunas",
      );

      const totalRevenue = lunasEnrollments.reduce((acc, curr) => {
        return acc + (Number(curr.hargaTransaksi) || 0);
      }, 0);

      setStats({
        totalCourses: coursesSnap.size,
        totalMentors: mentorsSnap.size,
        totalStudents: lunasEnrollments.length,
        totalRevenue: totalRevenue,
      });

      // 3. Olah 5 Pendaftar Terbaru
      const sortedEnrollments = enrollments
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        })
        .slice(0, 5);

      setRecentEnrollments(sortedEnrollments);

      // 4. Olah 5 Ulasan Terbaru
      const reviews = reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const sortedReviews = reviews
        .sort((a: any, b: any) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return timeB - timeA;
        })
        .slice(0, 5);

      setRecentReviews(sortedReviews);
    } catch (error) {
      console.error("Gagal memuat dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 font-sans">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-sm tracking-widest uppercase">
          Memuat Analitik...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-sans">
      {/* SECTION 1: METRIC CARDS (KOTAK STATISTIK LEBIH COMPACT) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card Pendapatan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Total Pendapatan
            </p>
            <h3 className="text-xl font-black text-slate-800">
              Rp {stats.totalRevenue.toLocaleString("id-ID")}
            </h3>
          </div>
        </div>

        {/* Card Peserta Aktif */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-colors">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Peserta Aktif
            </p>
            <h3 className="text-xl font-black text-slate-800">
              {stats.totalStudents} Alumni
            </h3>
          </div>
        </div>

        {/* Card Total Kelas */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Katalog Kelas
            </p>
            <h3 className="text-xl font-black text-slate-800">
              {stats.totalCourses} Modul
            </h3>
          </div>
        </div>

        {/* Card Total Mentor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
          <div className="absolute -right-4 -top-4 w-20 h-20 bg-amber-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out z-0"></div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-3">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              Pakar Terdaftar
            </p>
            <h3 className="text-xl font-black text-slate-800">
              {stats.totalMentors} Orang
            </h3>
          </div>
        </div>
      </div>

      {/* SECTION 2: RECENT ACTIVITIES (LEBIH COMPACT) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kolom Pendaftar Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800 tracking-tight">
              Pendaftaran Terbaru
            </h3>
          </div>
          <div className="flex-grow">
            {recentEnrollments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Belum ada pendaftar masuk.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentEnrollments.map((e) => (
                  <div
                    key={e.id}
                    className="px-5 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-black shrink-0">
                        {(e.namaPeserta || "A").charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xs text-slate-800 truncate">
                          {e.namaPeserta}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                          {e.emailPeserta}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <span
                        className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest ${e.statusAkses === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                      >
                        {e.statusAkses}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Ulasan Terbaru */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-sm text-slate-800 tracking-tight">
              Ulasan & Rating Terbaru
            </h3>
          </div>
          <div className="flex-grow">
            {recentReviews.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Belum ada ulasan dari peserta.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentReviews.map((r) => (
                  <div
                    key={r.id}
                    className="px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="font-bold text-xs text-slate-800">
                        {r.namaPeserta}
                      </h4>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-[10px] ${star <= Number(r.rating) ? "text-yellow-400" : "text-slate-200"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 italic line-clamp-2">
                      "{r.ulasan}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
