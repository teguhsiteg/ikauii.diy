"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function RaceClockPage() {
  const [gunTimes, setGunTimes] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [settings, setSettings] = useState<any>({});

  // 1. Ambil Data Waktu Start dari Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "virtual_run"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);

        // Ekstrak semua field yang berawalan "gunTime"
        const times: Record<string, number> = {};
        Object.keys(data).forEach((key) => {
          if (key.startsWith("gunTime") && data[key]) {
            // Hapus kata "gunTime" untuk mendapatkan nama jaraknya (Contoh: "gunTime5K" jadi "5K")
            const jarak = key.replace("gunTime", "").replace(/_/g, ".");
            times[jarak] = data[key];
          }
        });
        setGunTimes(times);
      }
    });
    return () => unsub();
  }, []);

  // 2. Mesin Jam (Berdetak setiap 50 milidetik agar super mulus)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 50); // Pakai 50ms biar tidak ada delay/lag visual
    return () => clearInterval(timer);
  }, []);

  // 3. Fungsi Format Waktu (HH:MM:SS)
  const formatDuration = (start: number, current: number) => {
    const diffMs = current - start;
    if (diffMs < 0) return "00:00:00"; // Kalau start di masa depan

    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);

    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 4. Deteksi Waktu Asli Sekarang (Jam dinding)
  const formatRealTime = () => {
    const now = new Date(currentTime);
    return now.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const activeDistances = Object.keys(gunTimes).sort();

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col justify-between overflow-hidden cursor-none select-none relative">
      {/* EFEK BACKGROUND CAHAYA */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[150px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/20 blur-[150px] rounded-full mix-blend-screen"></div>
      </div>

      {/* HEADER LOGO */}
      <header className="p-6 md:p-10 flex justify-between items-start relative z-10">
        <div className="flex items-center gap-4">
          <img
            src="/logo-dpp-ika.png"
            alt="Logo"
            className="h-12 md:h-16 lg:h-24 object-contain"
          />
          <div>
            <h1 className="text-xl md:text-3xl lg:text-4xl font-black uppercase tracking-[0.2em] text-[#D4AF37]">
              {settings.eventName || "IKA UII DIY RUN"}
            </h1>
            <p className="text-sm md:text-lg lg:text-xl font-bold tracking-widest text-slate-400 uppercase mt-1">
              OFFICIAL RACE CLOCK
            </p>
          </div>
        </div>

        {/* JAM DINDING REAL-TIME DI POJOK KANAN ATAS */}
        <div className="text-right">
          <p className="text-[10px] md:text-sm uppercase tracking-widest text-slate-500 font-bold mb-1">
            Local Time
          </p>
          <div className="font-mono text-xl md:text-3xl lg:text-4xl font-bold text-slate-300 tracking-wider">
            {formatRealTime()}
          </div>
        </div>
      </header>

      {/* AREA UTAMA (ANGKA JAM) */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 w-full">
        {activeDistances.length === 0 ? (
          <div className="text-center animate-pulse">
            <h2 className="text-4xl md:text-6xl font-black text-slate-700 uppercase tracking-widest mb-4">
              STANDBY
            </h2>
            <p className="text-xl md:text-2xl text-slate-500 uppercase tracking-widest font-bold">
              Menunggu Tembakan Start dari Control Room
            </p>
          </div>
        ) : (
          <div
            className={`w-full max-w-[95vw] grid gap-8 ${
              activeDistances.length === 1
                ? "grid-cols-1"
                : activeDistances.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {activeDistances.map((jarak) => (
              <div
                key={jarak}
                className="flex flex-col items-center justify-center bg-white/5 backdrop-blur-sm border border-white/10 rounded-[3rem] p-10 shadow-2xl"
              >
                <div className="bg-[#D4AF37] text-black font-black px-6 py-2 rounded-full text-xl md:text-2xl lg:text-3xl tracking-[0.2em] uppercase mb-8 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  KATEGORI {jarak}
                </div>

                {/* FONT MONO RAKSASA:
                  Ukurannya pakai "vw" (Viewport Width) agar angkanya membesar otomatis
                  mengikuti ukuran TV atau layar yang dipakai.
                */}
                <div
                  className={`font-mono font-black text-white tracking-tighter leading-none text-center tabular-nums drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] ${
                    activeDistances.length === 1
                      ? "text-[20vw]"
                      : activeDistances.length === 2
                        ? "text-[12vw]"
                        : "text-[8vw]"
                  }`}
                  style={{ fontVariantNumeric: "tabular-nums" }} // Mencegah angka goyang
                >
                  {formatDuration(gunTimes[jarak], currentTime)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* FOOTER GARIS BAWAH */}
      <footer className="h-4 bg-gradient-to-r from-blue-600 via-emerald-500 to-yellow-500 w-full relative z-10"></footer>
    </div>
  );
}
