"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

export default function BibDisplayPage() {
  const [isIdle, setIsIdle] = useState(true);
  const [posterUrl, setPosterUrl] = useState("/poster-placeholder.jpg");
  const [participantData, setParticipantData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // State untuk sinkronisasi waktu & pause
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "virtual_run"),
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          if (data.posterBibCheck) setPosterUrl(data.posterBibCheck);

          // Baca status Pause dari Admin
          if (data.bibDisplayPaused !== undefined) {
            setIsPaused(data.bibDisplayPaused);
          }

          // Baca waktu tersisa dari Admin
          if (data.bibDisplayTimeLeft !== undefined) {
            setTimeLeft(data.bibDisplayTimeLeft);
          }

          const activeBib = data.activeBibCheck;

          // Logika Transisi Mode
          if (activeBib && activeBib !== "") {
            if (isIdle) {
              // Baru mulai scan
              setIsIdle(false);
              setIsLoading(true);
              setNotFound(false);
              await fetchParticipant(activeBib);
              setIsLoading(false);
            }
          } else {
            // Admin mengirim sinyal kosong (Stop)
            setIsIdle(true);
            setParticipantData(null);
            setTimeLeft(0);
          }
        }
      },
    );
    return () => unsub();
  }, [isIdle]);

  const fetchParticipant = async (bibNumber: string) => {
    try {
      let foundData = null;
      const qOffline = query(
        collection(db, "offline_participants"),
        where("nomorBIB", "==", bibNumber),
      );
      const snapOffline = await getDocs(qOffline);
      if (!snapOffline.empty)
        foundData = { source: "Offline", ...snapOffline.docs[0].data() };
      else {
        const qVR = query(
          collection(db, "peserta"),
          where("nomorBIB", "==", bibNumber),
        );
        const snapVR = await getDocs(qVR);
        if (!snapVR.empty)
          foundData = { source: "Virtual Run", ...snapVR.docs[0].data() };
      }
      if (foundData) setParticipantData(foundData);
      else setNotFound(true);
    } catch (error) {
      setNotFound(true);
    }
  };

  if (isIdle) {
    return (
      <div className="fixed inset-0 bg-blue-950 flex items-center justify-center overflow-hidden animate-in fade-in duration-1000">
        <img
          src={posterUrl}
          alt="IKA UII Event Poster"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/1920x1080/1e3a8a/facc15?text=IKA+UII+RUN+-+SCAN+BIB+UNTUK+MEMULAI";
          }}
        />
        <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-3 border border-white/10 shadow-xl">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-white text-xs font-bold tracking-widest uppercase">
            System Standby
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center overflow-hidden font-sans select-none animate-in slide-in-from-bottom-10 duration-500">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-200 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-yellow-200 blur-[150px] rounded-full"></div>
      </div>

      {isLoading ? (
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 border-8 border-slate-200 border-t-yellow-400 rounded-full animate-spin mb-6 shadow-lg"></div>
          <h2 className="text-3xl font-black text-blue-950 tracking-widest uppercase animate-pulse">
            Mencari Data...
          </h2>
        </div>
      ) : notFound ? (
        <div className="relative z-10 flex flex-col items-center bg-white p-12 rounded-3xl shadow-2xl border-4 border-rose-100 transform transition-all">
          <div className="text-8xl mb-6">🕵️‍♂️</div>
          <h2 className="text-5xl font-black text-blue-950 tracking-tight uppercase mb-4">
            Waduh!
          </h2>
          <p className="text-2xl font-bold text-rose-500 uppercase tracking-widest">
            Data BIB Tidak Ditemukan
          </p>
          <p className="text-slate-500 mt-2">
            Silakan lapor ke panitia meja bantuan.
          </p>
        </div>
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full max-w-5xl p-4 md:p-8 animate-in zoom-in-95 duration-500">
          <div className="inline-flex items-center gap-3 bg-emerald-500 text-white font-black px-6 py-2 rounded-full text-lg tracking-widest uppercase mb-4 shadow-lg transform -rotate-1 border-2 border-white shrink-0">
            <span>✅</span> TERVERIFIKASI
          </div>

          <div className="w-full h-full max-h-[75vh] flex flex-col bg-white rounded-3xl md:rounded-[3rem] shadow-[0_20px_50px_rgba(30,58,138,0.15)] border-4 border-blue-900 overflow-hidden relative">
            <div className="bg-blue-900 text-white px-6 py-4 md:px-10 md:py-6 flex justify-between items-center relative overflow-hidden shrink-0">
              <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="flex items-center gap-3 md:gap-4 relative z-10">
                <img
                  src="/logo-dpp-ika.png"
                  alt="Logo"
                  className="h-10 md:h-14 bg-white rounded-full p-1"
                />
                <div>
                  <h2 className="text-lg md:text-2xl font-black tracking-widest uppercase text-yellow-400 drop-shadow-md">
                    IKA UII DIY
                  </h2>
                  <p className="text-[10px] md:text-xs font-medium tracking-widest opacity-80">
                    RACE PACK COLLECTION
                  </p>
                </div>
              </div>
              <div className="text-right relative z-10">
                <span className="bg-yellow-400 text-blue-950 font-black px-4 py-1.5 md:px-6 md:py-2 rounded-full text-sm md:text-lg uppercase tracking-widest shadow-md border border-yellow-300 whitespace-nowrap">
                  {participantData.jarak ||
                    participantData.kategoriPeserta ||
                    "UMUM"}
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center text-center relative px-4 py-2 overflow-hidden">
              <img
                src="/logo-dpp-ika.png"
                alt="Watermark"
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[80%] opacity-[0.03] grayscale pointer-events-none"
              />
              <h3 className="text-lg md:text-xl font-bold text-slate-400 uppercase tracking-[0.3em] mb-1 relative z-10">
                OFFICIAL BIB
              </h3>
              <h1 className="text-[12vh] md:text-[20vh] font-black text-blue-950 leading-none tracking-tighter drop-shadow-xl relative z-10">
                {participantData.nomorBIB || "-"}
              </h1>
              <div className="w-24 h-1.5 bg-yellow-400 rounded-full my-4 relative z-10 shrink-0"></div>
              <h2 className="text-[4vh] md:text-[6vh] font-black text-slate-800 uppercase tracking-tight line-clamp-1 relative z-10 px-4">
                {participantData.namaLengkap || participantData.nama}
              </h2>
            </div>

            <div className="bg-slate-100 border-t-2 border-slate-200 py-4 px-2 md:p-6 flex justify-around items-center divide-x-2 divide-slate-300 shrink-0">
              <div className="text-center px-2 md:px-4 w-1/3">
                <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Ukuran Jersey
                </p>
                <p className="text-xl md:text-3xl font-black text-blue-900">
                  {participantData.ukuranJersey ||
                    participantData.ukuranKaos ||
                    "-"}
                </p>
              </div>
              <div className="text-center px-2 md:px-4 w-1/3">
                <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Status Bayar
                </p>
                <p
                  className={`text-lg md:text-2xl font-black uppercase ${participantData.statusPembayaran?.toLowerCase() === "lunas" ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {participantData.statusPembayaran || "-"}
                </p>
              </div>
              <div className="text-center px-2 md:px-4 w-1/3">
                <p className="text-[10px] md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Asal Data
                </p>
                <p className="text-lg md:text-2xl font-black text-slate-600 uppercase truncate">
                  {participantData.source}
                </p>
              </div>
            </div>
          </div>

          {/* Indikator Waktu/Pause di Layar TV */}
          <div className="mt-6 flex items-center justify-center gap-3 shrink-0">
            {isPaused ? (
              <span className="bg-rose-500 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest animate-pulse border border-rose-400 shadow-lg">
                📸 Sesi Foto Berlangsung
              </span>
            ) : (
              <span className="bg-blue-900 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest opacity-80">
                Tutup otomatis dalam {timeLeft} detik...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
