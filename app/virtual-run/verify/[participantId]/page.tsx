"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

const PublicVerifierPage = () => {
  const { participantId } = useParams();
  const [participantData, setParticipantData] = useState<any>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<string>("0h 0m");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!participantId) return;

    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "vr_participants", participantId as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // 🔥 PERBAIKAN: Cek field statusPembayaran == "Lunas" sesuai database kita 🔥
          if (data.statusPembayaran !== "Lunas") {
            throw new Error(
              "Sertifikat tidak valid (Pembayaran belum diverifikasi panitia)",
            );
          }

          setParticipantData({ id: docSnap.id, ...data });

          // Ambil data lari (submissions) yang Approved untuk menghitung total KM & Waktu
          const q = query(
            collection(db, "vr_submissions"),
            where("participantId", "==", docSnap.id),
            where("status", "==", "Approved"),
          );
          const subSnap = await getDocs(q);

          let totalKm = 0;
          let totalSeconds = 0;

          subSnap.forEach((d) => {
            const sub = d.data();
            totalKm += sub.jarakKm || 0;

            if (sub.durasi) {
              let sec = 0;
              const str = String(sub.durasi).toLowerCase().trim();
              if (str.includes(":")) {
                const parts = str.split(":").map((n) => parseInt(n) || 0);
                if (parts.length >= 3) {
                  sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
                } else if (parts.length === 2) {
                  sec = parts[0] * 60 + parts[1];
                }
              } else if (
                str.includes("j") ||
                str.includes("h") ||
                str.includes("m")
              ) {
                const jamMatch = str.match(/(\d+)\s*(j|h)/);
                const menitMatch = str.match(/(\d+)\s*(m)/);
                if (jamMatch) sec += parseInt(jamMatch[1]) * 3600;
                if (menitMatch) sec += parseInt(menitMatch[1]) * 60;
              } else {
                const match = str.match(/\d+/);
                if (match) sec = parseInt(match[0]) * 60;
              }
              if (!isNaN(sec)) totalSeconds += sec;
            }
          });

          setTotalDistance(totalKm);
          const h = Math.floor(totalSeconds / 3600);
          const m = Math.floor((totalSeconds % 3600) / 60);
          setTotalDuration(`${h}h ${m}m`);
        } else {
          setError("Sertifikat tidak ditemukan (ID Invalid)");
        }
      } catch (err: any) {
        console.error("Verification Error:", err);
        setError(err.message || "Gagal memuat data verifikasi");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicData();
  }, [participantId]);

  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500 tracking-widest text-xs uppercase animate-pulse">
        Memverifikasi keaslian...
      </div>
    );

  // TAMPILAN JIKA ERROR / BELUM BAYAR / SALAH ID
  if (error || !participantData)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 font-sans">
        <div className="bg-white border border-rose-200 text-rose-700 p-8 rounded-3xl text-center shadow-xl max-w-md w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
          <img
            src="/logo-dpp-ika.png"
            alt="Logo"
            className="w-20 h-20 mx-auto mb-4 object-contain grayscale opacity-50"
          />
          <h1 className="text-2xl font-black mb-2">⚠️ ERROR VERIFIKASI</h1>
          <p className="text-sm font-medium text-slate-600 mb-6">{error}</p>
          <p className="text-xs text-rose-500 font-bold bg-rose-50 py-3 rounded-xl border border-rose-100">
            Mohon hubungi panitia DPW IKA UII DIY
          </p>
        </div>
      </div>
    );

  const targetKm = parseInt(participantData.jarak.replace(/\D/g, "")) || 0;
  const isFinisher = totalDistance >= targetKm;

  // TAMPILAN BERHASIL DIVALIDASI
  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 md:p-8 font-sans pb-20">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
        {/* Header Biru Keren */}
        <div className="bg-[#1e3a8a] p-8 text-center text-white relative">
          <img
            src="/logo-dpp-ika.png"
            alt="Logo IKA UII"
            className="w-24 h-24 mx-auto object-contain drop-shadow-md"
          />
          <h1 className="text-3xl font-black mt-4 tracking-tight">
            CERTIFICATE VERIFIER
          </h1>
          <p className="text-blue-200 font-medium tracking-widest text-xs uppercase mt-2">
            IKA UII DIY Virtual Run
          </p>

          {/* Lencana "Verified" */}
          <div className="absolute top-4 right-4 bg-emerald-500 text-white font-black px-4 py-1.5 rounded-full shadow-lg text-[10px] uppercase tracking-widest flex items-center gap-1.5 border border-emerald-400">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>{" "}
            VERIFIED GENUINE
          </div>
        </div>

        {/* Profil Pelari */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center border-b pb-8 border-slate-100">
            <div className="w-28 h-28 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-lg text-4xl font-black shrink-0">
              {participantData.nama.charAt(0).toUpperCase()}
            </div>

            <div className="text-center md:text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Peserta Virtual Run
              </p>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                {participantData.nama}
              </h2>
              <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                <p className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl uppercase tracking-wider">
                  BIB:{" "}
                  {participantData.id
                    .replace(/\D/g, "")
                    .substring(0, 4)
                    .padEnd(4, "0") || "0001"}
                </p>
                <p className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl uppercase tracking-wider">
                  {participantData.jarak}
                </p>
              </div>
            </div>
          </div>

          {/* Statistik Pencapaian */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center md:text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Jarak Ditempuh
              </p>
              <p className="text-2xl font-black text-slate-800">
                {totalDistance.toFixed(2)} <span className="text-sm">KM</span>
              </p>
              <p className="text-[10px] text-blue-500 font-bold mt-1 bg-blue-50 inline-block px-2 py-0.5 rounded">
                Target: {targetKm} KM
              </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center md:text-left">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">
                Total Waktu
              </p>
              <p className="text-2xl font-black text-slate-800 mt-2">
                {totalDuration}
              </p>
            </div>
            <div
              className={`col-span-2 md:col-span-1 p-5 rounded-2xl border text-center flex flex-col justify-center items-center ${isFinisher ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}
            >
              <p
                className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isFinisher ? "text-emerald-500" : "text-amber-500"}`}
              >
                Status Lari
              </p>
              <p
                className={`text-2xl font-black ${isFinisher ? "text-emerald-600" : "text-amber-600"}`}
              >
                {isFinisher ? "FINISHER 🏅" : "BERJALAN 🏃‍♂️"}
              </p>
            </div>
          </div>

          {/* Footer Validasi */}
          <div className="mt-10 pt-6 border-t border-slate-100 text-center bg-slate-50 rounded-2xl p-4">
            <p className="text-xs text-slate-500 font-medium">
              Halaman ini adalah bukti resmi verifikasi digital untuk Sertifikat
              IKA UII DIY Virtual Run.
            </p>
            <p className="text-[10px] text-slate-400 font-mono mt-2 uppercase tracking-widest">
              ID: VR-{participantData.id.substring(0, 8)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicVerifierPage;
