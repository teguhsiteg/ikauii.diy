"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Maximize, Minimize } from "lucide-react";

export default function RaceClockPage() {
  const [gunTimes, setGunTimes] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [settings, setSettings] = useState<any>({});
  const [activeDistances, setActiveDistances] = useState<string[]>([]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const getRotatedStyle = (rotated: boolean) => {
    return rotated
      ? {
          transform: "rotate(90deg)",
          transformOrigin: "center center",
          width: "100vh",
          height: "100vw",
          position: "absolute" as const,
          top: "50%",
          left: "50%",
          marginTop: "-50vw",
          marginLeft: "-50vh",
        }
      : {};
  };

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (settings.mediaMode && settings.mediaType === "video" && videoRef.current && settings.mediaUrl) {
      if (settings.mediaPlaying) {
        // Gunakan console.warn alih-alih console.error agar Next.js dev server tidak menampilkan overlay merah
        videoRef.current.play().catch((e) => console.warn("Autoplay / Source issue:", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [settings.mediaPlaying, settings.mediaMode, settings.mediaType, settings.mediaUrl]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

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
    if (!start) return "00:00:00.00";
    const diffMs = current - start;
    
    // COUNTDOWN MODE (Jika belum mulai)
    if (diffMs < 0) {
      const absDiff = Math.abs(diffMs);
      const hrs = Math.floor(absDiff / 3600000);
      const mins = Math.floor((absDiff % 3600000) / 60000);
      const secs = Math.floor((absDiff % 60000) / 1000);
      const ms = Math.floor((absDiff % 1000) / 10);
      // Tampilkan dengan tanda minus (-) untuk hitung mundur
      if (hrs > 0) {
        return `-${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
      }
      return `-${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
    }

    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    const ms = Math.floor((diffMs % 1000) / 10);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
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
  const getBentoClasses = (total: number, isRotated: boolean) => {
    const baseClass =
      "flex flex-col justify-center bg-white border border-slate-100 shadow-xl relative overflow-hidden group transition-all rounded-[2rem] p-8 items-center text-center";

    if (isRotated) return baseClass;

    if (total === 1) return `${baseClass} lg:col-span-12 lg:row-span-2 p-16`;
    if (total === 2) return `${baseClass} lg:col-span-6 lg:row-span-2 p-12`;
    if (total === 3) return `${baseClass} lg:col-span-4 lg:row-span-2 p-10`;

    return `${baseClass} lg:col-span-6 lg:row-span-1`;
  };

  // Ukuran Font Menyesuaikan Kotaknya
  const getFontSize = (total: number, isRotated: boolean) => {
    if (isRotated) return "text-[14vh]"; // Karena rotated, lebarnya pakai vh (tinggi layar asli)
    
    // Saat tidak di-rotate, pakai kelas responsif Tailwind:
    // - Di mobile (layar kecil), selalu 1 kolom -> pakai 14vw
    // - Di desktop (lg), kolom menyesuaikan total kategori
    if (total === 1) return "text-[14vw] lg:text-[12vw]";
    if (total === 2) return "text-[14vw] lg:text-[6.5vw]";
    if (total === 3) return "text-[14vw] lg:text-[4.2vw]";
    return "text-[14vw] lg:text-[4vw]";
  };

  return (
    <div
      className="h-screen w-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col justify-between overflow-hidden select-none relative"
      style={getRotatedStyle(settings.isPortrait)}
    >
      {settings.mediaMode ? (
        <div 
          className="absolute bg-black flex items-center justify-center overflow-hidden z-50 w-full h-full top-0 left-0"
        >
          {settings.mediaType === "image" ? (
            <img 
              src={settings.mediaUrl} 
              alt="Media" 
              className="w-full h-full object-contain" 
            />
          ) : (
            <video 
              ref={videoRef}
              src={settings.mediaUrl} 
              loop={settings.mediaLoop}
              className="w-full h-full object-contain" 
              playsInline
            />
          )}
        </div>
      ) : (
        <>
          {/* HEADER LOGO SPORTY */}
          <header className="px-8 py-8 md:px-14 md:py-10 flex justify-between items-center relative z-10">
            <div className="flex items-center gap-6">
              <img
                src={settings.eventLogo || "/logo-dpp-ika.png"}
                alt="Logo"
                className="h-16 md:h-20 object-contain drop-shadow-sm"
              />
              <div className="flex flex-col border-l-2 border-slate-300 pl-5">
                <h1 className="text-2xl md:text-4xl font-black uppercase tracking-[0.1em] text-slate-900 drop-shadow-sm">
                  {settings.eventName || "IKA UII DIY RUN 2026"}
                </h1>
                <p className="text-xs md:text-sm font-bold tracking-[0.3em] text-[#1A73E8] uppercase mt-1">
                  {settings.eventSubtext || "Official Timing System"}
                </p>
              </div>
            </div>

            {/* JAM DINDING REAL-TIME */}
            <div className="text-right bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm">
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-1">
                Waktu Saat Ini
              </p>
              <div suppressHydrationWarning className="font-mono text-2xl md:text-3xl font-bold text-slate-800 tracking-wider">
                {formatRealTime()}
              </div>
            </div>
          </header>

          {/* AREA UTAMA BENTO GRID */}
          <main className="flex-1 flex flex-col px-8 md:px-14 py-4 relative z-10 w-full min-h-0">
            {activeDistances.length === 0 ? (
              <div className="m-auto text-center animate-pulse">
                <h2 className="text-4xl md:text-6xl font-black text-slate-300 uppercase tracking-widest mb-4">
                  STANDBY
                </h2>
                <p className="text-xl md:text-2xl text-slate-400 uppercase tracking-widest font-bold">
                  Kategori lari belum dikonfigurasi
                </p>
              </div>
            ) : (
              <div className={`w-full h-full grid gap-6 lg:gap-8 ${settings.isPortrait ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-12 lg:grid-rows-2"}`}>
                {activeDistances.map((jarak) => {
                  const hasStarted = gunTimes[jarak] !== undefined;

                  return (
                    <div
                      key={jarak}
                      className={getBentoClasses(activeDistances.length, settings.isPortrait)}
                    >
                      {hasStarted && (
                        <div className="absolute inset-0 bg-[#1A73E8]/5 animate-pulse"></div>
                      )}

                      <div className="flex flex-col items-center">
                        {/* Label Kategori */}
                        <div className="font-black text-slate-500 tracking-[0.2em] uppercase text-sm md:text-xl mb-2">
                          Kategori{" "}
                          <span className="text-[#1A73E8] ml-2 text-3xl md:text-5xl block mt-2">
                            {jarak}
                          </span>
                        </div>

                        {/* Angka Jam */}
                        <div
                          suppressHydrationWarning
                          className={`font-mono font-black tracking-tighter leading-none tabular-nums relative z-10 transition-colors ${
                            hasStarted
                              ? "text-slate-900"
                              : "text-slate-300"
                          } ${getFontSize(activeDistances.length, settings.isPortrait)}`}
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {formatDuration(gunTimes[jarak], currentTime)}
                        </div>
                      </div>

                      {/* Indikator Status Start */}
                      {!hasStarted && (
                        <div className="absolute text-slate-400 font-bold tracking-widest text-xs uppercase bottom-8">
                          Menunggu Start...
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      {/* FLOATING CONTROLS */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 opacity-20 hover:opacity-100 transition-opacity">
        <button
          onClick={toggleFullscreen}
          className="bg-white border border-slate-200 text-slate-600 p-3 rounded-full shadow-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>

      {/* FOOTER GARIS BAWAH */}
      <footer className="h-3 md:h-4 bg-gradient-to-r from-[#152B5B] via-[#1A73E8] to-[#FCD116] w-full relative z-10 mt-8"></footer>
    </div>
  );
}
