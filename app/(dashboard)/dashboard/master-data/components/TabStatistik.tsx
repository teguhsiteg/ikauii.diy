"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function TabStatistik() {
  const [stats, setStats] = useState({
    totalPengurus: 0,
    totalAnggotaSah: 0,
    totalAntrean: 0,
    totalDitolak: 0,
    fakultasStats: {} as Record<string, number>,
    domisiliStats: {} as Record<string, number>,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Fetch pengurus (Anggota Sah & Pengurus)
        const qPengurus = query(collection(db, "pengurus"));
        const snapPengurus = await getDocs(qPengurus);

        // Fetch pendaftar (Antrean)
        const qPendaftar = query(collection(db, "pendaftar"));
        const snapPendaftar = await getDocs(qPendaftar);

        let tPengurus = 0;
        let tAnggotaSah = 0;
        const facStats: Record<string, number> = {};
        const domStats: Record<string, number> = {};

        snapPengurus.forEach((doc) => {
          const data = doc.data();
          // Pisahkan Anggota Sah vs Pengurus
          if (data.jabatan === "Anggota" || !data.jabatan) {
            tAnggotaSah++;
          } else {
            tPengurus++;
          }

          // Kumpulkan Statistik Fakultas
          if (data.fakultas) {
            const fac = data.fakultas;
            facStats[fac] = (facStats[fac] || 0) + 1;
          }

          // Kumpulkan Statistik Domisili
          if (data.domisili) {
            const dom = data.domisili;
            domStats[dom] = (domStats[dom] || 0) + 1;
          }
        });

        let tAntrean = 0;
        let tDitolak = 0;

        snapPendaftar.forEach((doc) => {
          const data = doc.data();
          if (data.status === "Dalam Proses") {
            tAntrean++;
          } else if (data.status === "Ditolak") {
            tDitolak++;
          }
        });

        // Sort records
        const sortedFacStats = Object.fromEntries(
          Object.entries(facStats).sort(([, a], [, b]) => b - a)
        );
        const sortedDomStats = Object.fromEntries(
          Object.entries(domStats).sort(([, a], [, b]) => b - a)
        );

        setStats({
          totalPengurus: tPengurus,
          totalAnggotaSah: tAnggotaSah,
          totalAntrean: tAntrean,
          totalDitolak: tDitolak,
          fakultasStats: sortedFacStats,
          domisiliStats: sortedDomStats,
        });
      } catch (error) {
        console.error("Gagal mengambil statistik:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200">
        <div className="w-8 h-8 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Memuat Statistik...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-1">
          Ringkasan & Statistik Keanggotaan
        </h3>
        <p className="text-sm text-slate-500 mb-6">
          Gambaran umum total data yang terdaftar dalam sistem IKA UII DIY.
        </p>

        {/* 4 Cards Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl">
            <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">
              Personalia / Pengurus
            </h4>
            <p className="text-3xl font-black text-blue-900">{stats.totalPengurus}</p>
          </div>
          <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl">
            <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
              Anggota Sah
            </h4>
            <p className="text-3xl font-black text-emerald-900">{stats.totalAnggotaSah}</p>
          </div>
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl">
            <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">
              Antrean Pendaftar
            </h4>
            <p className="text-3xl font-black text-amber-900">{stats.totalAntrean}</p>
          </div>
          <div className="p-5 bg-rose-50 border border-rose-100 rounded-xl">
            <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">
              Pendaftar Ditolak
            </h4>
            <p className="text-3xl font-black text-rose-900">{stats.totalDitolak}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Fakultas Stats */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Distribusi Fakultas (Anggota & Pengurus)
            </h4>
            <div className="space-y-3">
              {Object.entries(stats.fakultasStats).length === 0 && (
                <p className="text-sm text-slate-400">Belum ada data fakultas.</p>
              )}
              {Object.entries(stats.fakultasStats).map(([fakultas, count], idx) => {
                const percentage = Math.round(
                  (count / (stats.totalAnggotaSah + stats.totalPengurus)) * 100
                );
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{fakultas}</span>
                      <span className="font-bold text-slate-900">{count} org</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-[#1A73E8] h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Domisili Stats */}
          <div>
            <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
              Distribusi Wilayah Domisili
            </h4>
            <div className="space-y-3">
              {Object.entries(stats.domisiliStats).length === 0 && (
                <p className="text-sm text-slate-400">Belum ada data domisili.</p>
              )}
              {Object.entries(stats.domisiliStats).map(([domisili, count], idx) => {
                const percentage = Math.round(
                  (count / (stats.totalAnggotaSah + stats.totalPengurus)) * 100
                );
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{domisili}</span>
                      <span className="font-bold text-slate-900">{count} org</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-emerald-500 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
