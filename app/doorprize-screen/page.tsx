"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";

export default function DoorprizeScreenPage() {
  const [signal, setSignal] = useState({
    action: "idle",
    prize: "",
    winnerName: "",
    winnerBib: "",
  });
  const [settings, setSettings] = useState<any>({});
  const [poolData, setPoolData] = useState<{ name: string; bib: string }[]>([
    { name: "Mengambil Data...", bib: "0000" },
  ]);
  const [shuffleItem, setShuffleItem] = useState({
    name: "SIAP DIUNDI",
    bib: "---",
  });

  // Audio Context (Harus diaktifkan manual oleh user)
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

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

  // --- INIT AUDIO ---
  const enableAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    setAudioEnabled(true);
  };

  // --- SOUND EFFECTS ---
  const playTick = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "triangle";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  const playWinSound = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;

    // Chord C Major Kemenangan (C - E - G - C)
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = "sine";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.1 + 0.1);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + i * 0.1 + 2,
      );

      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 2);
    });
  };

  // --- FETCH SEMUA PESERTA (Mencari BIB) ---
  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const pList: { name: string; bib: string }[] = [];

        // Ambil Data Offline
        const snapOff = await getDocs(collection(db, "offline_participants"));
        snapOff.forEach((doc) => {
          pList.push({
            name: doc.data().namaLengkap || doc.data().nama || "Peserta",
            bib: doc.data().nomorBIB || "0000",
          });
        });

        // Ambil Data VR
        const snapVR = await getDocs(collection(db, "peserta"));
        snapVR.forEach((doc) => {
          pList.push({
            name: doc.data().namaLengkap || doc.data().nama || "Peserta VR",
            bib: doc.data().nomorBIB || "VR", // Fallback jika VR tidak punya BIB
          });
        });

        if (pList.length > 0) setPoolData(pList);
      } catch {
        console.error("Gagal load data peserta");
      }
    };
    fetchParticipants();
  }, []);

  // --- LISTEN SINYAL DARI ADMIN ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "virtual_run"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        if (data.doorprizeSignal) {
          if (
            data.doorprizeSignal.action === "winner" &&
            signal.action !== "winner"
          ) {
            playWinSound();
          }
          setSignal(data.doorprizeSignal);
        }
      }
    });
    return () => unsub();
  }, [signal.action]);

  // --- EFEK MESIN SPIN (MENGACAK DATA) ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (signal.action === "spin") {
      interval = setInterval(() => {
        if (poolData.length > 1) {
          const randomIndex = Math.floor(Math.random() * poolData.length);
          setShuffleItem(poolData[randomIndex]);
        } else {
          // Fallback visual jika database peserta kosong (misal pakai Peserta Manual semua)
          const randomBib = Math.floor(1000 + Math.random() * 9000).toString();
          const randomNames = ["BUDI", "SITI", "AGUS", "TEGUH", "NUR", "EKO", "SRI", "JOKO", "RINI", "ADI"];
          const randomName = randomNames[Math.floor(Math.random() * randomNames.length)];
          setShuffleItem({ bib: randomBib, name: randomName });
        }
        if (audioEnabled) playTick();
      }, 50);
    } else if (signal.action === "winner") {
      setShuffleItem({
        name: signal.winnerName || "Unknown",
        bib: signal.winnerBib || "0000",
      });
    } else {
      setShuffleItem({ name: "SIAP DIUNDI", bib: "---" });
    }
    return () => clearInterval(interval);
  }, [signal.action, poolData, signal.winnerName, audioEnabled]);

  // --- LAYAR PERIZINAN AUDIO ---
  if (!audioEnabled) {
    return (
      <div
        onClick={enableAudio}
        className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
      >
        <div className="w-24 h-24 bg-blue-100 text-blue-900 rounded-full flex items-center justify-center text-4xl mb-6 animate-pulse">
          🔊
        </div>
        <h1 className="text-3xl font-black text-blue-950 uppercase tracking-widest mb-2">
          Aktifkan Layar Utama
        </h1>
        <p className="text-slate-500 font-medium">
          Klik dimana saja pada layar ini untuk mengaktifkan Suara & Studio
          Doorprize.
        </p>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden font-sans select-none"
      style={getRotatedStyle(settings.isPortrait)}
    >
      {/* --- CLEAN BACKGROUND --- */}
      <div className="absolute inset-0 z-0 bg-slate-50 pointer-events-none">
        {/* Subtle geometric pattern if desired, otherwise plain slate-50 is very clean */}
      </div>

      {/* --- MODE 1: IDLE --- */}
      {signal.action === "idle" && (
        <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-1000">
          <div className="w-40 h-40 md:w-56 md:h-56 bg-white rounded-full flex items-center justify-center p-8 border border-slate-200 shadow-xl mb-10">
            <img
              src={settings.eventLogo || "/logo-dpp-ika.png"}
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-400 tracking-[0.5em] uppercase mb-6 text-center">
            {settings.eventName || "Studio Doorprize"}
          </h2>
          <div className="text-4xl md:text-6xl font-black text-blue-950 drop-shadow-sm text-center leading-tight">
            <span className="block text-xl text-yellow-500 mb-2 tracking-widest font-bold uppercase">
              Bersiap Mengundi
            </span>
            Silakan Menunggu
          </div>
        </div>
      )}

      {/* --- MODE 2: SPIN --- */}
      {signal.action === "spin" && (
        <div className="relative z-10 flex flex-col items-center w-full max-w-7xl px-4">
          <h3 className="text-xl md:text-2xl font-bold text-slate-500 tracking-[0.2em] uppercase mb-8">
            MENGUNDI: <span className="text-[#1A73E8] font-black">{signal.prize}</span>
          </h3>

          {/* Tampilan Pengacakan BIB dan Nama (CLEAN) */}
          <div className="w-full bg-white border border-slate-200 rounded-[2rem] py-16 px-8 flex flex-col items-center justify-center relative z-20 shadow-sm">
            <h1 className={`${settings.isPortrait ? 'text-[12vh]' : 'text-[6rem] md:text-[10rem]'} font-black text-[#152B5B] text-center uppercase tracking-tighter leading-none mb-2`}>
              {shuffleItem.bib}
            </h1>
            <p className={`${settings.isPortrait ? 'text-[4vh]' : 'text-2xl md:text-4xl'} font-bold text-slate-400 uppercase tracking-widest text-center`}>
              {shuffleItem.name}
            </p>
          </div>
        </div>
      )}
      {/* --- MODE 3: WINNER --- */}
      {signal.action === "winner" && (
        <div className="relative z-10 flex flex-col items-center w-full max-w-7xl px-4 animate-in fade-in zoom-in-95 duration-500">
          
          <div className="bg-[#152B5B] text-white font-bold px-8 py-2 rounded-full text-lg md:text-xl tracking-[0.2em] uppercase mb-10 shadow-sm border border-slate-200">
            SELAMAT KEPADA PEMENANG
          </div>

          <h1 className={`${settings.isPortrait ? 'text-[16vh]' : 'text-[7rem] md:text-[12rem]'} font-black text-[#1A73E8] text-center uppercase tracking-tighter leading-none relative z-20`}>
            {shuffleItem.bib}
          </h1>

          <p className={`${settings.isPortrait ? 'text-[5vh]' : 'text-3xl md:text-5xl'} font-black text-slate-800 uppercase tracking-wider mt-4 mb-12 relative z-20 text-center`}>
            {shuffleItem.name}
          </p>

          <div className="flex flex-col items-center bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm relative z-20 min-w-[300px]">
            <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
              Hadiah Utama
            </p>
            <p className="text-2xl md:text-4xl font-black text-[#152B5B] text-center">
              {signal.prize}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
