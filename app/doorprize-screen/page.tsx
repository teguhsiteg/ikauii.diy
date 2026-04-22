"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";

export default function DoorprizeScreenPage() {
  const [signal, setSignal] = useState({
    action: "idle",
    prize: "",
    winnerName: "",
  });
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
        let pList: { name: string; bib: string }[] = [];

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
      } catch (error) {
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
    let interval: NodeJS.Timeout;
    if (signal.action === "spin") {
      interval = setInterval(() => {
        const randomIndex = Math.floor(Math.random() * poolData.length);
        setShuffleItem(poolData[randomIndex]);
        if (audioEnabled) playTick();
      }, 50);
    } else if (signal.action === "winner") {
      // Temukan BIB dari pemenang
      const winnerData = poolData.find((p) => p.name === signal.winnerName);
      setShuffleItem({
        name: signal.winnerName,
        bib: winnerData?.bib || "0000",
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
    <div className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center relative overflow-hidden font-sans select-none">
      {/* --- BACKGROUND CERAH (EFEK IKA UII) --- */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-yellow-200 blur-[150px] rounded-full"></div>
      </div>

      {/* --- MODE 1: IDLE --- */}
      {signal.action === "idle" && (
        <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-1000">
          <div className="w-40 h-40 md:w-56 md:h-56 bg-white rounded-full flex items-center justify-center p-8 border border-slate-200 shadow-xl mb-10">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <h2 className="text-xl md:text-3xl font-black text-slate-400 tracking-[0.5em] uppercase mb-6">
            Studio Doorprize
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
        <div className="relative z-10 flex flex-col items-center w-full max-w-7xl px-4 animate-in zoom-in duration-300">
          {/* Cincin Berputar (Emas & Biru) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] md:w-[750px] md:h-[750px] border-[20px] border-dashed border-yellow-400 rounded-full animate-[spin_1.5s_linear_infinite] opacity-40 shadow-[0_0_50px_rgba(250,204,21,0.5)] pointer-events-none"></div>

          <h3 className="text-2xl md:text-4xl font-black text-blue-900 tracking-[0.2em] uppercase mb-10 animate-pulse relative z-20 bg-white/80 px-8 py-2 rounded-full border border-blue-100 shadow-sm">
            Mengundi: <span className="text-yellow-600">{signal.prize}</span>
          </h3>

          {/* Tampilan Pengacakan BIB dan Nama */}
          <div className="w-full bg-white/90 backdrop-blur-xl border-4 border-blue-900 rounded-[3rem] py-16 px-8 flex flex-col items-center justify-center relative z-20 shadow-2xl">
            <h1 className="text-[6rem] md:text-[10rem] font-black text-blue-950 text-center uppercase tracking-tighter leading-none mb-2 blur-[1px]">
              {shuffleItem.bib}
            </h1>
            <p className="text-2xl md:text-4xl font-bold text-slate-400 uppercase tracking-widest blur-[0.5px]">
              {shuffleItem.name}
            </p>
          </div>
        </div>
      )}

      {/* --- MODE 3: WINNER --- */}
      {signal.action === "winner" && (
        <div className="relative z-10 flex flex-col items-center w-full px-4 animate-in zoom-in-90 duration-700">
          {/* Efek Sinar Belakang */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[1200px] max-h-[1200px] bg-[radial-gradient(circle,rgba(250,204,21,0.2)_0%,rgba(255,255,255,0)_70%)] animate-pulse pointer-events-none"></div>

          {/* Badge Selamat */}
          <div className="inline-block bg-yellow-400 text-blue-950 font-black px-10 py-3 rounded-full text-2xl md:text-4xl tracking-widest uppercase mb-10 shadow-lg transform -rotate-2 border-2 border-white">
            SELAMAT KEPADA
          </div>

          {/* Teks BIB Raksasa */}
          <h1 className="text-[7rem] md:text-[12rem] font-black text-blue-950 text-center uppercase tracking-tighter leading-none drop-shadow-xl relative z-20">
            {shuffleItem.bib}
          </h1>

          {/* Nama Pemenang */}
          <p className="text-3xl md:text-5xl font-bold text-slate-700 uppercase tracking-widest mt-6 mb-12 relative z-20 text-center">
            {shuffleItem.name}
          </p>

          {/* Kartu Hadiah */}
          <div className="flex flex-col items-center bg-white border-2 border-blue-900 rounded-[2rem] p-8 md:p-12 shadow-2xl relative z-20 transform translate-y-4">
            <p className="text-sm md:text-xl font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">
              Memenangkan Hadiah
            </p>
            <p className="text-4xl md:text-6xl font-black text-blue-900 text-center drop-shadow-sm flex items-center gap-4">
              <span className="text-5xl md:text-7xl">🎁</span> {signal.prize}
            </p>
          </div>

          {/* Confetti Simulation */}
          <div className="absolute inset-0 pointer-events-none z-30 flex justify-around items-start opacity-50">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-16 bg-yellow-400 rounded-full animate-bounce`}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "1s",
                }}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
