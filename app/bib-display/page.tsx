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

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "virtual_run"),
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Menarik URL Template dari Admin Scanner
          if (data.urlBibTemplateIdle) setTemplateIdle(data.urlBibTemplateIdle);
          if (data.urlBibTemplateScan) setTemplateScan(data.urlBibTemplateScan);

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
  // LAYAR 1: IDLE / STANDBY
  // ==========================================
  if (isIdle) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden animate-in fade-in duration-500">
        <img
          src={templateIdle}
          alt="Template Idle"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.src =
              "https://www.uii.ac.id/wp-content/uploads/2025/03/Gerbang-UII.jpg";
          }}
        />
      </div>
    );
  }

  // ==========================================
  // LAYAR 2: LOADING & NOT FOUND
  // ==========================================
  if (isLoading || notFound) {
    return (
      <div className="fixed inset-0 bg-[#0B2239] flex flex-col items-center justify-center overflow-hidden font-sans select-none animate-in fade-in duration-300">
        {isLoading ? (
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 border-8 border-white/10 border-t-[#FCD116] rounded-full animate-spin mb-8 shadow-2xl"></div>
            <h2 className="text-4xl font-black text-white tracking-widest uppercase animate-pulse drop-shadow-lg">
              Memuat Data...
            </h2>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center bg-white p-16 rounded-[3rem] shadow-2xl border-4 border-rose-100">
            <div className="text-8xl mb-8">❓</div>
            <h2 className="text-6xl font-black text-[#0B2239] tracking-tight uppercase mb-4">
              Tidak Ditemukan
            </h2>
            <p className="text-3xl font-bold text-rose-500 uppercase tracking-widest">
              Tiket Belum Terdaftar
            </p>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // LAYAR 3: MURNI BIB & TEKS (SESUAI REQUEST)
  // ==========================================
  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden font-sans select-none animate-in zoom-in-95 duration-500 p-4 md:p-8">
      <div className="w-full h-full max-w-[1600px] max-h-[90vh] relative rounded-3xl overflow-hidden bg-white shadow-2xl">
        {/* 1. GAMBAR BACKGROUND DARI ADMIN */}
        {templateScan ? (
          <img
            src={templateScan}
            className="absolute inset-0 w-full h-full object-cover z-0"
            alt="Background BIB"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="absolute inset-0 bg-white z-0"></div>
        )}

        {/* 2. MURNI TEKS DINAMIS */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center p-8">
          {/* NOMOR BIB */}
          <h1 className="text-[25vh] md:text-[35vh] font-black text-[#0B2239] leading-[0.8] tracking-tighter mt-10">
            {participantData.nomorBIB || "0000"}
          </h1>

          {/* NAMA BIB */}
          <h2 className="text-[6vh] md:text-[8vh] font-black text-[#0B2239] uppercase tracking-tight mt-4 line-clamp-1 max-w-[90%]">
            {participantData.namaBib ||
              participantData.namaLengkap ||
              participantData.nama}
          </h2>

          {/* KATEGORI JARAK */}
          <h3 className="text-[4vh] md:text-[6vh] font-black text-[#0B2239] uppercase tracking-widest mt-8">
            {participantData.jarak || participantData.kategoriPeserta || "UMUM"}
          </h3>
        </div>
      </div>
    </div>
  );
}
