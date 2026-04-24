"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function BibDisplayPage() {
  const [isIdle, setIsIdle] = useState(true);

  // State untuk Template Gambar
  const [templateIdle, setTemplateIdle] = useState("/poster-placeholder.jpg");
  const [templateScan, setTemplateScan] = useState("");

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

          // Menarik URL Template dari Admin Scanner
          if (data.urlBibTemplateIdle) setTemplateIdle(data.urlBibTemplateIdle);
          if (data.urlBibTemplateScan) setTemplateScan(data.urlBibTemplateScan);

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
            // Admin mengirim sinyal kosong (Stop/Tutup Layar)
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
      // Cari di Offline dulu
      const qOffline = query(
        collection(db, "offline_participants"),
        where("nomorBIB", "==", bibNumber),
      );
      const snapOffline = await getDocs(qOffline);
      if (!snapOffline.empty)
        foundData = { source: "Offline", ...snapOffline.docs[0].data() };
      else {
        // Kalau ga ada, cari di VR
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

  // ==========================================
  // LAYAR 1: IDLE / STANDBY (Template Awal)
  // ==========================================
  if (isIdle) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0A] flex items-center justify-center overflow-hidden animate-in fade-in duration-1000">
        <img
          src={templateIdle}
          alt="Template Idle"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/1920x1080/1e3a8a/facc15?text=STANDBY+-+SCAN+BIB+UNTUK+MEMULAI";
          }}
        />
        <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full flex items-center gap-3 border border-white/10 shadow-2xl">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]"></span>
          <span className="text-white text-xs font-black tracking-widest uppercase">
            Scan BIB untuk Memulai
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
  // LAYAR 2: LOADING & NOT FOUND
  // ==========================================
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center overflow-hidden font-sans select-none animate-in slide-in-from-bottom-10 duration-500">
      {isLoading ? (
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 border-8 border-slate-700 border-t-[#D4AF37] rounded-full animate-spin mb-8 shadow-2xl"></div>
          <h2 className="text-4xl font-black text-white tracking-widest uppercase animate-pulse drop-shadow-lg">
            Verifikasi Data...
          </h2>
        </div>
      ) : notFound ? (
        <div className="relative z-10 flex flex-col items-center bg-white p-16 rounded-[3rem] shadow-[0_0_50px_rgba(225,29,72,0.3)] border-4 border-rose-100 transform transition-all">
          <div className="text-8xl mb-8">❓</div>
          <h2 className="text-6xl font-black text-[#152B5B] tracking-tight uppercase mb-4">
            Tidak Ditemukan
          </h2>
          <p className="text-3xl font-bold text-rose-500 uppercase tracking-widest">
            BIB Belum Terdaftar
          </p>
          <p className="text-slate-500 mt-4 text-xl">
            Harap hubungi meja administrasi.
          </p>
        </div>
      ) : (
        // ==========================================
        // LAYAR 3: DATA DITEMUKAN (Tampilan Custom BIB)
        // ==========================================
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500 p-8">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-3 bg-emerald-500 text-white font-black px-8 py-3 rounded-full text-2xl tracking-widest uppercase shadow-[0_10px_30px_rgba(16,185,129,0.4)] border-2 border-white/50">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            DATA TERVERIFIKASI
          </div>

          <div className="w-full h-full max-w-[1600px] flex flex-col bg-white rounded-[3rem] shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden relative border-8 border-white/20">
            {/* BACKGROUND TEMPLATE SCAN */}
            {templateScan ? (
              <img
                src={templateScan}
                className="absolute inset-0 w-full h-full object-cover z-0"
                alt="Template Scan BIB"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 z-0"></div>
            )}

            {/* AREA TENGAH KOSONG (UNTUK BIB & NAMA) */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center p-8 w-full">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800/60 uppercase tracking-[0.4em] mb-2 drop-shadow-md">
                OFFICIAL BIB
              </h3>

              {/* NOMOR BIB RAKSASA */}
              <h1
                className="text-[18vh] md:text-[25vh] font-black text-[#152B5B] leading-none tracking-tighter drop-shadow-2xl"
                style={{
                  textShadow:
                    "4px 4px 0px #fff, -4px -4px 0px #fff, 4px -4px 0px #fff, -4px 4px 0px #fff, 0 10px 20px rgba(0,0,0,0.3)",
                }}
              >
                {participantData.nomorBIB || "-"}
              </h1>

              <div className="w-48 h-3 bg-[#D4AF37] rounded-full my-6 shrink-0 shadow-lg"></div>

              {/* NAMA PELARI */}
              <h2
                className="text-[6vh] md:text-[8vh] font-black text-slate-900 uppercase tracking-tight line-clamp-1 px-8 max-w-[90%]"
                style={{
                  textShadow:
                    "2px 2px 0px #fff, -2px -2px 0px #fff, 2px -2px 0px #fff, -2px 2px 0px #fff, 0 5px 15px rgba(0,0,0,0.2)",
                }}
              >
                {participantData.namaLengkap || participantData.nama}
              </h2>
            </div>

            {/* FOOTER INFO: Tampil mengambang di bawah desain template */}
            <div className="absolute bottom-0 left-0 w-full bg-white/95 backdrop-blur-xl border-t-4 border-[#152B5B] py-6 px-4 md:px-12 flex justify-between items-center divide-x-4 divide-slate-200 z-20">
              <div className="text-center px-4 w-1/4">
                <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Kategori
                </p>
                <p className="text-2xl md:text-4xl font-black text-[#152B5B] uppercase">
                  {participantData.jarak ||
                    participantData.kategoriPeserta ||
                    "UMUM"}
                </p>
              </div>

              <div className="text-center px-4 w-1/4">
                <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Ukuran Jersey
                </p>
                <p className="text-2xl md:text-4xl font-black text-slate-800">
                  {participantData.ukuranJersey ||
                    participantData.ukuranKaos ||
                    "-"}
                </p>
              </div>

              <div className="text-center px-4 w-1/4">
                <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Status Pembayaran
                </p>
                <p
                  className={`text-2xl md:text-4xl font-black uppercase ${participantData.statusPembayaran?.toLowerCase() === "lunas" ? "text-emerald-500" : "text-rose-500"}`}
                >
                  {participantData.statusPembayaran || "-"}
                </p>
              </div>

              <div className="text-center px-4 w-1/4">
                <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Asal Data
                </p>
                <p className="text-2xl md:text-4xl font-black text-slate-400 uppercase truncate">
                  {participantData.source}
                </p>
              </div>
            </div>
          </div>

          {/* Indikator Waktu/Pause di Layar TV */}
          <div className="absolute bottom-10 z-50 flex items-center justify-center">
            {isPaused ? (
              <span className="bg-rose-600 text-white px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest animate-pulse shadow-2xl border-2 border-rose-400">
                WAKTU DITAHAN - SESI FOTO 📸
              </span>
            ) : (
              <span className="bg-black/60 backdrop-blur-md text-white/80 px-6 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest border border-white/20">
                Tutup otomatis dalam {timeLeft} detik...
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
