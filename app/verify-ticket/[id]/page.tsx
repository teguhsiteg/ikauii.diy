"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { useParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function VerifyTicketPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [participant, setParticipant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [adminUser, setAdminUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchParticipant = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "offline_participants", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setParticipant({ id: docSnap.id, ...docSnap.data() });
        } else {
          setErrorMsg("Data tiket tidak ditemukan di database Offline Run.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMsg("Gagal terhubung ke server database.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchParticipant();
  }, [id]);

  const handleCheckIn = async () => {
    if (!adminUser) {
      toast.error("Akses Ditolak! Hanya Panitia yang dapat melakukan aksi ini.");
      return;
    }

    if (
      !confirm(
        "Konfirmasi: Tandai Race Pack dan Jersey peserta ini SUDAH DIAMBIL?",
      )
    )
      return;

    setIsUpdating(true);
    try {
      const docRef = doc(db, "offline_participants", id);
      const currentTime = new Date().toISOString();
      const handlerName = adminUser.email || "Admin Lapangan";

      await updateDoc(docRef, {
        isRacepackTaken: true,
        waktuAmbilRacepack: currentTime,
        adminHandler: handlerName,
      });

      await addDoc(collection(db, "vr_logs"), {
        type: "resi",
        action: "menyerahkan racepack offline (via scan tiket) untuk",
        targetName: participant.namaLengkap,
        adminEmail: handlerName,
        timestamp: Date.now(),
      });

      setParticipant((prev: any) => ({
        ...prev,
        isRacepackTaken: true,
        waktuAmbilRacepack: currentTime,
        adminHandler: handlerName,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Gagal mengupdate data. Silakan coba lagi atau cek koneksi.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading || isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0B2239] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/20 border-t-[#FCD116] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (errorMsg || !participant) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-md w-full border-t-8 border-rose-500">
          <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-rose-100">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tight">
            Tiket Tidak Valid
          </h2>
          <p className="text-sm text-slate-500 mb-8 font-medium">{errorMsg}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-[#0B2239] text-white font-bold px-8 py-3.5 rounded-xl w-full hover:bg-slate-800 transition-colors uppercase tracking-widest text-sm shadow-md"
          >
            Tutup Halaman
          </button>
        </div>
      </div>
    );
  }

  const isLunas = participant.statusPembayaran === "Lunas";
  const isCollected = participant.isRacepackTaken === true;

  return (
    <div className="min-h-screen bg-slate-100 pb-12 font-sans selection:bg-emerald-200 relative">
      {/* HEADER STATUS DINAMIS */}
      <div
        className={`pt-12 pb-28 px-6 text-center shadow-inner ${isLunas ? "bg-[#1E8E3E]" : "bg-rose-600"}`}
      >
        <h1 className="text-white/90 font-black text-sm tracking-[0.3em] mb-2 uppercase">
          {adminUser ? "Scanner Gate Panitia" : "E-Ticket Resmi Peserta"}
        </h1>
        <div
          className={`inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-base font-black mt-2 border-2 ${isLunas ? "border-emerald-300/50 shadow-[0_0_20px_rgba(255,255,255,0.3)]" : "border-rose-300/50 animate-pulse"}`}
        >
          STATUS:
          <span className="uppercase tracking-widest bg-white text-black px-2 py-0.5 rounded ml-1">
            {participant.statusPembayaran}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
          {/* ========================================================
              IDENTITAS INTI (TAMPIL UNTUK PUBLIK & ADMIN)
          ======================================================== */}
          <div className="p-8 md:p-12 text-center border-b border-slate-100 bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-5">
              <svg
                width="150"
                height="150"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 22h20L12 2zm0 3.83L18.17 19H5.83L12 5.83z" />
              </svg>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">
              Nomor BIB
            </p>
            <h2 className="text-5xl md:text-7xl font-black text-[#1A73E8] font-mono leading-none mb-6 tracking-tighter relative z-10 drop-shadow-sm">
              {participant.nomorBIB || "TUNDA"}
            </h2>

            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 relative z-10">
              Nama BIB
            </p>
            <h3 className="text-2xl md:text-3xl font-black text-[#0B2239] uppercase tracking-tight mb-6 relative z-10">
              {participant.namaBib || participant.namaLengkap}
            </h3>

            <div className="flex justify-center relative z-10">
              <span className="bg-[#FCD116] text-[#0B2239] text-sm md:text-base font-black px-6 py-2 rounded-xl uppercase tracking-widest shadow-md border border-yellow-400">
                {participant.kategoriPeserta === "SMA/Pelajar"
                  ? "Pelajar"
                  : participant.kategoriPeserta}{" "}
                {participant.jarak}
              </span>
            </div>
          </div>

          {/* ========================================================
              GRID DATA LENGKAP (HANYA TAMPIL JIKA LOGIN ADMIN)
          ======================================================== */}
          {adminUser && (
            <div className="p-6 md:p-8 space-y-8 bg-slate-50/50">
              <div>
                <h3 className="text-xs font-black text-[#0B2239] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-2 h-2 bg-[#1A73E8] rounded-full"></span>{" "}
                  Atribut Lari
                </h3>
                <div className="grid grid-cols-2 gap-y-5 gap-x-6">
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                    <p className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-wider mb-0.5">
                      Ukuran Jersey
                    </p>
                    <p className="text-2xl font-black text-[#0B2239]">
                      {participant.ukuranJersey || "-"}
                    </p>
                  </div>
                  <div className="bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-0.5">
                      Gol. Darah
                    </p>
                    <p className="text-2xl font-black text-rose-700">
                      {participant.golonganDarah || "-"}
                    </p>
                  </div>
                  <div className="col-span-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      Kondisi Medis Khusus
                    </p>
                    <p className="text-sm font-black text-slate-700">
                      {participant.riwayatPenyakit || "Sehat / Tidak Ada"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-[#0B2239] uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <span className="w-2 h-2 bg-[#FCD116] rounded-full"></span>{" "}
                  Data Administratif
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Nama Lengkap
                    </p>
                    <p className="text-sm font-bold text-slate-800 uppercase">
                      {participant.namaLengkap}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NIK / No. Identitas
                    </p>
                    <p className="text-sm font-mono font-black text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 inline-block mt-1">
                      {participant.nik || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      No. WhatsApp
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {participant.noWA || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Email
                    </p>
                    <p className="text-sm font-bold text-slate-800 break-words">
                      {participant.email || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Alamat Lengkap
                    </p>
                    <p className="text-sm font-medium leading-relaxed text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {participant.alamatLengkap}, {participant.kotaKabupaten},{" "}
                      {participant.provinsi}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-rose-200 pb-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Kontak Darurat
                </h3>
                <div className="bg-white border-2 border-rose-100 p-4 rounded-xl grid grid-cols-2 gap-y-4 gap-x-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-full -z-0"></div>
                  <div className="col-span-2 sm:col-span-1 relative z-10">
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                      Nama Kontak
                    </p>
                    <p className="text-sm font-black text-rose-900">
                      {participant.namaDarurat || "-"}
                    </p>
                    <p className="text-[10px] font-bold text-rose-600 mt-0.5 bg-rose-100 inline-block px-1.5 py-0.5 rounded">
                      {participant.hubunganDarurat || "-"}
                    </p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 relative z-10">
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                      No. Telepon / WA
                    </p>
                    <p className="text-sm font-black font-mono text-rose-900">
                      {participant.waDarurat || "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              AKSI GATE PANITIA & PUBLIC INFO
          ======================================================== */}
          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200">
            {adminUser ? (
              // --- WAJAH ADMIN: TAMPILKAN TOMBOL AKSI ---
              isLunas ? (
                isCollected ? (
                  <div className="text-center bg-amber-50 border border-amber-200 p-6 rounded-2xl shadow-inner">
                    <div className="flex items-center justify-center gap-2 text-amber-600 font-black mb-2">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-black text-amber-800 uppercase tracking-widest mb-1">
                      RACE PACK SUDAH DIAMBIL
                    </h3>
                    <p className="text-xs text-amber-700 font-bold bg-amber-100 inline-block px-3 py-1 rounded-full mt-2">
                      Waktu:{" "}
                      {new Date(participant.waktuAmbilRacepack).toLocaleString(
                        "id-ID",
                        { dateStyle: "long", timeStyle: "short" },
                      )}{" "}
                      WIB
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleCheckIn}
                    disabled={isUpdating}
                    className="w-full bg-[#1E8E3E] hover:bg-[#188038] text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:opacity-50 text-lg md:text-xl flex items-center justify-center gap-3 uppercase tracking-widest"
                  >
                    {isUpdating ? (
                      <>
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>{" "}
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-7 h-7"
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
                        </svg>{" "}
                        Serahkan Racepack
                      </>
                    )}
                  </button>
                )
              ) : (
                <div className="text-center bg-rose-50 border-2 border-rose-200 p-6 rounded-2xl shadow-inner">
                  <div className="flex items-center justify-center gap-2 text-rose-600 font-black mb-2">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-rose-800 uppercase tracking-widest mb-1">
                    PESERTA BELUM LUNAS
                  </h3>
                  <p className="text-xs text-rose-600 font-bold mt-2 leading-relaxed">
                    Race Pack dan Nomor BIB tidak dapat diserahkan. <br />{" "}
                    Arahkan peserta ke meja Administrasi/Helpdesk.
                  </p>
                </div>
              )
            ) : (
              // --- WAJAH PUBLIK (PESERTA): TAMPILAN BERSIH MINIMALIS ---
              <div className="text-center">
                <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl shadow-inner mb-6">
                  <div className="flex items-center justify-center gap-2 text-[#1A73E8] font-black mb-2">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-black text-[#152B5B] uppercase tracking-widest mb-2">
                    {isCollected ? "RACE PACK SUDAH DIAMBIL" : "E-TICKET VALID"}
                  </h3>
                  <p className="text-xs text-[#1A73E8] font-medium leading-relaxed max-w-sm mx-auto">
                    Tunjukkan layar ini atau biarkan Panitia memindai QR Code
                    Anda di lokasi untuk proses pengambilan Race Pack.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
