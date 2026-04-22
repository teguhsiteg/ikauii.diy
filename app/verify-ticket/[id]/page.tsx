"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase"; // WAJIB import auth
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth"; // Import pendeteksi login
import { useParams } from "next/navigation";

export default function TicketVerificationPage() {
  const params = useParams();
  const id = params.id as string;
  const [participant, setParticipant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🔥 STATE BARU: Untuk menyimpan status login Admin
  const [isAdmin, setIsAdmin] = useState(false);

  // 1. Cek apakah yang buka halaman ini adalah Admin yang sudah login
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Jika ada user yang login (siapapun itu, selama dia login di web ini berarti panitia)
      if (user) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data Peserta (Tetap jalan untuk publik maupun admin)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "offline_participants", id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setParticipant({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error("Gagal menarik data tiket:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // 3. Fungsi Eksekusi (Hanya muncul untuk Admin)
  const handleProcessRacepack = async () => {
    if (!isAdmin) {
      alert("Akses Ditolak. Anda bukan Panitia.");
      return;
    }

    if (
      !confirm(`Konfirmasi penyerahan Race Pack ke ${participant.namaLengkap}?`)
    )
      return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "offline_participants", id), {
        isRacepackTaken: true,
        waktuAmbilRacepack: new Date().toISOString(),
        adminHandler: auth.currentUser?.email || "Admin Scanner", // Catat siapa yang scan
      });
      setParticipant((prev: any) => ({
        ...prev,
        isRacepackTaken: true,
        waktuAmbilRacepack: new Date().toISOString(),
      }));
    } catch (e) {
      alert("Gagal memproses data. Cek koneksi Anda.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-white font-bold tracking-widest text-sm">
          Memvalidasi Tiket...
        </p>
      </div>
    );
  }

  if (!participant) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
        <div className="bg-rose-500 text-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-black mb-2 tracking-tight">
            TIKET TIDAK VALID
          </h1>
          <p className="text-sm font-medium opacity-90">
            ID Pendaftaran tidak terdaftar dalam sistem IKA UII DIY.
          </p>
        </div>
      </div>
    );
  }

  const isLunas = participant.statusPembayaran === "Lunas";
  const isTaken = participant.isRacepackTaken;

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white text-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        {/* HEADER TIKET */}
        <div
          className={`p-8 text-center text-white relative overflow-hidden ${isLunas ? "bg-emerald-600" : "bg-rose-600"}`}
        >
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-black uppercase tracking-widest mb-1">
              Verifikasi Tiket
            </h1>
            <p className="text-xs font-bold opacity-90">
              STATUS: {participant.statusPembayaran.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* INFO PESERTA UTAMA */}
          <div className="text-center bg-slate-50 p-6 rounded-3xl border border-slate-100 relative overflow-hidden">
            {/* Penanda Mode Admin - Hanya muncul kalau Panitia yang scan */}
            {isAdmin && (
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl tracking-widest">
                MODE PANITIA
              </div>
            )}

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Nama Peserta
            </p>
            <p className="text-2xl font-black uppercase text-slate-800 leading-tight">
              {participant.namaLengkap}
            </p>
            <p className="text-xs font-mono font-bold text-blue-600 mt-2 bg-blue-50 px-3 py-1 rounded-full inline-block border border-blue-100">
              ID: {participant.id.substring(0, 8).toUpperCase()}
            </p>
          </div>

          {/* GRID LOGISTIK */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-100 p-4 rounded-2xl bg-white shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Kategori
              </p>
              <p className="font-black text-slate-800 text-lg mt-0.5">
                {participant.jarak}
              </p>
            </div>
            <div className="border border-emerald-100 p-4 rounded-2xl bg-emerald-50 shadow-sm text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase">
                Ukuran Jersey
              </p>
              <p className="font-black text-emerald-800 text-2xl mt-0.5">
                {participant.ukuranJersey}
              </p>
            </div>
            <div className="border border-slate-100 p-4 rounded-2xl bg-white shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Gol. Darah
              </p>
              <p className="font-black text-rose-600 text-lg mt-0.5">
                {participant.golonganDarah}
              </p>
            </div>
            <div className="border border-slate-100 p-4 rounded-2xl bg-white shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Status
              </p>
              <p className="font-black text-slate-800 text-sm mt-1">
                {participant.kategoriPeserta}
              </p>
            </div>
          </div>

          {/* LOGIKA PENGAMBILAN & OTORISASI ADMIN */}
          <div className="pt-2">
            {!isLunas ? (
              <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 text-center">
                <p className="text-rose-600 font-black text-lg mb-1">
                  ⚠️ BELUM LUNAS!
                </p>
                <p className="text-[11px] text-rose-500 font-medium leading-relaxed">
                  Peserta dilarang mengambil Race Pack sebelum menyelesaikan
                  administrasi pembayaran.
                </p>
              </div>
            ) : isTaken ? (
              <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-800 font-black text-lg mb-1">
                  ✅ SUDAH DIAMBIL
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Telah diserahkan pada:
                  <br />
                  <strong className="text-slate-700">
                    {new Date(participant.waktuAmbilRacepack).toLocaleString(
                      "id-ID",
                      { dateStyle: "full", timeStyle: "short" },
                    )}{" "}
                    WIB
                  </strong>
                </p>
              </div>
            ) : // 🔥 KONDISI SAKTI: HANYA TAMPIL JIKA LUNAS, BELUM DIAMBIL, & YANG BUKA ADALAH ADMIN 🔥
            isAdmin ? (
              <button
                onClick={handleProcessRacepack}
                disabled={isUpdating}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-[0_10px_20px_-10px_rgba(5,150,105,0.5)] active:scale-95 transition-all text-sm tracking-widest flex items-center justify-center gap-2"
              >
                {isUpdating ? "Memproses..." : "KONFIRMASI PENYERAHAN"}
              </button>
            ) : (
              <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 text-center">
                <p className="text-blue-600 font-black text-sm mb-1 uppercase tracking-wider">
                  💳 Tiket Valid & Lunas
                </p>
                <p className="text-[11px] text-blue-500 font-medium leading-relaxed">
                  Tunjukkan layar QR Code ini kepada panitia di lokasi acara
                  untuk mengambil Race Pack.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="mt-8 text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] text-center">
        Logistik Event • IKA UII DIY
      </p>
    </div>
  );
}
