"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function RaceClockPage() {
  const [gunTimes, setGunTimes] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [settings, setSettings] = useState<any>({});
  const [activeDistances, setActiveDistances] = useState<string[]>([]);

  // 1. Ambil Data Waktu Start & Jarak Dinamis dari Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "virtual_run"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);

        let availDistances: string[] = [];
        if (data.offlinePackages && data.offlinePackages.length > 0) {
          availDistances = Array.from(
            new Set(data.offlinePackages.map((p: any) => p.jarak)),
          ) as string[];
        } else if (data.virtualPackages && data.virtualPackages.length > 0) {
          availDistances = Array.from(
            new Set(data.virtualPackages.map((p: any) => p.jarak)),
          ) as string[];
        }

        // 🔥 SORTING CERDAS BERDASARKAN ANGKA (Jarak Terpendek ke Terjauh) 🔥
        // Agar jika 3 kategori: yg terpendek numpuk di kiri, yg terjauh besar di kanan
        availDistances.sort((a, b) => {
          const numA = parseFloat(a.replace(/[^\d.-]/g, ""));
          const numB = parseFloat(b.replace(/[^\d.-]/g, ""));
          return numA - numB;
        });

        setActiveDistances(availDistances);

        const times: Record<string, number> = {};
        availDistances.forEach((jarak) => {
          const safeDistKey = jarak.replace(/\./g, "_");
          const gunTimeKey = `gunTime${safeDistKey}`;
          if (data[gunTimeKey]) {
            times[jarak] = data[gunTimeKey];
          }
        });
        setGunTimes(times);
      }
    });
    return () => unsub();
  }, []);

  // 2. Mesin Jam (50ms)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 50);
    return () => clearInterval(timer);
  }, []);

  // 3. Formatter Waktu
  const formatDuration = (start: number | undefined, current: number) => {
    if (!start) return "00:00:00";
    const diffMs = current - start;
    if (diffMs < 0) return "00:00:00";
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 4. Jam Dinding Realtime
  const formatRealTime = () => {
    const now = new Date(currentTime);
    return now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // 🔥 LOGIKA DYNAMIC BENTO GRID 🔥
  const getBentoClasses = (index: number, total: number) => {
    // Default class untuk semua kotak
    const baseClass =
      "flex flex-col justify-center bg-slate-900/60 backdrop-blur-md border border-slate-700/50 shadow-2xl relative overflow-hidden group transition-all";

    // 1 Kategori (Layar Penuh)
    if (total === 1)
      return `${baseClass} lg:col-span-12 lg:row-span-2 rounded-[3rem] p-16 items-center text-center`;

    // 2 Kategori (Terbelah 2 sama besar)
    if (total === 2)
      return `${baseClass} lg:col-span-6 lg:row-span-2 rounded-[3rem] p-12 items-center text-center`;

    // 3 Kategori (Asimetris: 2 Kiri Tumpuk, 1 Kanan Full)
    if (total === 3) {
      if (index === 0)
        return `${baseClass} lg:col-span-7 lg:row-span-1 rounded-[2rem] p-8 items-start`; // Kiri Atas (Terpendek ke-1)
      if (index === 1)
        return `${baseClass} lg:col-span-7 lg:row-span-1 rounded-[2rem] p-8 items-start`; // Kiri Bawah (Terpendek ke-2)
      if (index === 2)
        return `${baseClass} lg:col-span-5 lg:row-span-2 rounded-[3rem] p-12 items-center text-center`; // Kanan Full (Terjauh)
    }

    // 4+ Kategori (Grid 2x2)
    return `${baseClass} lg:col-span-6 lg:row-span-1 rounded-[2rem] p-8 items-center text-center`;
  };

  // Ukuran Font Menyesuaikan Kotaknya
  const getFontSize = (index: number, total: number) => {
    if (total === 1) return "text-[15vw]";
    if (total === 2) return "text-[10vw]";
    if (total === 3) {
      return index === 2 ? "text-[8vw] mt-4" : "text-[7vw]";
    }
    return "text-[7vw]";
  };

  return (
    <div className="min-h-screen bg-[#020611] text-white font-sans flex flex-col justify-between overflow-hidden cursor-none select-none relative">
      {/* EFEK BACKGROUND CAHAYA */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1A73E8]/20 blur-[150px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#FCD116]/10 blur-[150px] rounded-full mix-blend-screen"></div>
      </div>

      {/* HEADER LOGO SPORTY */}
      <header className="px-8 py-8 md:px-14 md:py-10 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-6">
          <img
            src="/logo-dpp-ika.png"
            alt="Logo"
            className="h-16 md:h-20 object-contain drop-shadow-lg"
          />
          <div className="flex flex-col border-l-2 border-slate-700 pl-5">
            <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.1em] text-white drop-shadow-md">
              {settings.eventName || "IKA UII DIY RUN 2026"}
            </h1>
            <p className="text-xs md:text-sm font-bold tracking-[0.3em] text-[#FCD116] uppercase mt-1">
              Official Timing System
            </p>
          </div>
        </div>

        {/* JAM DINDING REAL-TIME */}
        <div className="text-right bg-slate-900/50 border border-slate-800 px-6 py-3 rounded-2xl backdrop-blur-sm">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold mb-1">
            Waktu Saat Ini
          </p>
          <div className="font-mono text-2xl md:text-3xl font-bold text-slate-100 tracking-wider">
            {formatRealTime()}
          </div>
        </div>
      </header>

      {/* AREA UTAMA BENTO GRID */}
      <main className="flex-1 flex flex-col px-8 md:px-14 py-4 relative z-10 w-full min-h-0">
        {activeDistances.length === 0 ? (
          <div className="m-auto text-center animate-pulse">
            <h2 className="text-4xl md:text-6xl font-black text-slate-700 uppercase tracking-widest mb-4">
              STANDBY
            </h2>
            <p className="text-xl md:text-2xl text-slate-500 uppercase tracking-widest font-bold">
              Kategori lari belum dikonfigurasi
            </p>
          </div>
        ) : (
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 lg:grid-rows-2 gap-6 lg:gap-8">
            {activeDistances.map((jarak, index) => {
              const hasStarted = gunTimes[jarak] !== undefined;

              // Cek apakah item ini di-render menyamping (untuk alignment justify)
              const isSideAligned =
                activeDistances.length === 3 && (index === 0 || index === 1);

              return (
                <div
                  key={jarak}
                  className={getBentoClasses(index, activeDistances.length)}
                >
                  {hasStarted && (
                    <div className="absolute inset-0 bg-[#1A73E8]/5 animate-pulse"></div>
                  )}

                  <div
                    className={`flex ${isSideAligned ? "flex-row items-end justify-between w-full" : "flex-col items-center"}`}
                  >
                    {/* Label Kategori */}
                    <div
                      className={`font-black text-slate-400 tracking-[0.2em] uppercase ${isSideAligned ? "text-sm md:text-lg mb-4" : "text-sm md:text-xl mb-2"}`}
                    >
                      Kategori{" "}
                      <span
                        className={`text-[#FCD116] ml-2 ${isSideAligned ? "text-3xl md:text-5xl" : "text-3xl md:text-5xl block mt-2"}`}
                      >
                        {jarak}
                      </span>
                    </div>

                    {/* Angka Jam */}
                    <div
                      className={`font-mono font-black tracking-tighter leading-none tabular-nums relative z-10 transition-colors ${
                        hasStarted
                          ? "text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.4)]"
                          : "text-slate-700"
                      } ${getFontSize(index, activeDistances.length)}`}
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {formatDuration(gunTimes[jarak], currentTime)}
                    </div>
                  </div>

                  {/* Indikator Status Start */}
                  {!hasStarted && (
                    <div
                      className={`absolute text-slate-600 font-bold tracking-widest text-xs uppercase ${isSideAligned ? "bottom-6 right-8" : "bottom-8"}`}
                    >
                      Menunggu Start...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* FOOTER GARIS BAWAH */}
      <footer className="h-3 md:h-4 bg-gradient-to-r from-[#152B5B] via-[#1A73E8] to-[#FCD116] w-full relative z-10 mt-8"></footer>
    </div>
  );
}
