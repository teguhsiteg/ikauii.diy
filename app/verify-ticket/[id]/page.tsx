"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function VerifyTicketPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [participant, setParticipant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchParticipant = async () => {
      if (!id) return;
      try {
        // Cari di data offline run
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

  // Fungsi untuk menandai Race Pack sudah diambil
  const handleCheckIn = async () => {
    if (!confirm("Konfirmasi: Tandai Race Pack peserta ini SUDAH DIAMBIL?"))
      return;

    setIsUpdating(true);
    try {
      const docRef = doc(db, "offline_participants", id);
      await updateDoc(docRef, {
        isRacePackCollected: true,
        waktuPengambilan: new Date().toISOString(),
        petugasGate: "Panitia", // Bisa diganti session nama admin yang login nanti
      });

      // Update state lokal agar layar langsung berubah
      setParticipant((prev: any) => ({
        ...prev,
        isRacePackCollected: true,
        waktuPengambilan: new Date().toISOString(),
      }));

      alert("Berhasil! Race Pack telah ditandai diambil.");
    } catch (error) {
      console.error(error);
      alert("Gagal mengupdate data. Silakan coba lagi.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-300 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (errorMsg || !participant) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">
            Tiket Tidak Valid
          </h2>
          <p className="text-sm text-slate-500 mb-6">{errorMsg}</p>
          <button
            onClick={() => router.push("/")}
            className="bg-slate-800 text-white font-bold px-6 py-2.5 rounded-lg w-full"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const isLunas = participant.statusPembayaran === "Lunas";
  const isCollected = participant.isRacePackCollected === true;

  return (
    <div className="min-h-screen bg-slate-100 pb-12 font-sans selection:bg-emerald-200">
      {/* HEADER STATUS */}
      <div
        className={`pt-12 pb-24 px-6 text-center ${isLunas ? "bg-emerald-600" : "bg-amber-500"}`}
      >
        <h1 className="text-white font-black text-2xl tracking-tight mb-2">
          SCANNER GATE PANITIA
        </h1>
        <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-bold mt-2 border border-white/30">
          STATUS BAYAR:
          <span className="uppercase tracking-widest">
            {participant.statusPembayaran}
          </span>
        </div>
      </div>

      {/* KARTU DATA UTAMA (MENGAMBANG) */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-200">
          {/* IDENTITAS INTI */}
          <div className="p-6 md:p-8 text-center border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Nama Peserta
            </p>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase leading-tight mb-3">
              {participant.namaLengkap}
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                BIB: {participant.nomorBIB || "0000"}
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider">
                {participant.kategoriPeserta} {participant.jarak}
              </span>
            </div>
          </div>

          {/* GRID DATA LENGKAP */}
          <div className="p-6 md:p-8 space-y-8">
            {/* SEKUEN 1: DATA FISIK & RACE */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Atribut Lari
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ukuran Jersey
                  </p>
                  <p className="text-base font-black text-slate-800">
                    {participant.ukuranJersey || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Gol. Darah
                  </p>
                  <p className="text-base font-black text-rose-600">
                    {participant.golonganDarah || "-"}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Kondisi Medis Khusus
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {participant.riwayatPenyakit || "Tidak Ada"}
                  </p>
                </div>
              </div>
            </div>

            {/* SEKUEN 2: DATA ADMINISTRATIF */}
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Data Administratif
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    NIK / No. Identitas
                  </p>
                  <p className="text-sm font-mono font-bold text-slate-800 bg-slate-50 p-2 rounded border border-slate-100 inline-block mt-1">
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
                  <p className="text-sm font-bold text-slate-800">
                    {participant.alamatLengkap}, {participant.kotaKabupaten},{" "}
                    {participant.provinsi}
                  </p>
                </div>
              </div>
            </div>

            {/* SEKUEN 3: KONTAK DARURAT */}
            <div>
              <h3 className="text-xs font-black text-rose-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-rose-100 pb-2">
                <svg
                  className="w-4 h-4 text-rose-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Kontak Darurat
              </h3>
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 grid grid-cols-2 gap-y-4 gap-x-6">
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    Nama Kontak
                  </p>
                  <p className="text-sm font-black text-rose-900">
                    {participant.namaDarurat || "-"}
                  </p>
                  <p className="text-xs font-bold text-rose-600 mt-0.5">
                    ({participant.hubunganDarurat || "-"})
                  </p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    No. Telepon / WA
                  </p>
                  <p className="text-sm font-black text-rose-900">
                    {participant.waDarurat || "-"}
                  </p>
                </div>
              </div>
            </div>

            {/* SEKUEN 4: DATA ALUMNI (Hanya Tampil Jika Alumni) */}
            {participant.kategoriPeserta === "Alumni" && (
              <div>
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-blue-100 pb-2">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                    />
                  </svg>
                  Data Akademik (Alumni)
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      NIM
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {participant.nim || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Tahun Lulus
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {participant.tahunLulus || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Fakultas / Prodi
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {participant.fakultas} - {participant.programStudi}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AKSI GATE PANITIA */}
          <div className="bg-slate-50 p-6 md:p-8 border-t border-slate-200">
            {isLunas ? (
              isCollected ? (
                <div className="text-center bg-emerald-100 border border-emerald-200 p-4 rounded-xl">
                  <div className="flex items-center justify-center gap-2 text-emerald-700 font-black mb-1">
                    <svg
                      className="w-5 h-5"
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
                    RACE PACK SUDAH DIAMBIL
                  </div>
                  <p className="text-xs text-emerald-600 font-medium">
                    Pada:{" "}
                    {new Date(participant.waktuPengambilan).toLocaleString(
                      "id-ID",
                    )}
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleCheckIn}
                  disabled={isUpdating}
                  className="w-full bg-[#152B5B] hover:bg-[#0D1B3E] text-white font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 text-lg flex items-center justify-center gap-2"
                >
                  {isUpdating
                    ? "Menyimpan Data..."
                    : "Konfirmasi Ambil Race Pack"}
                </button>
              )
            ) : (
              <div className="text-center bg-rose-100 border border-rose-200 p-4 rounded-xl">
                <div className="flex items-center justify-center gap-2 text-rose-700 font-black mb-1">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  PESERTA BELUM LUNAS
                </div>
                <p className="text-xs text-rose-600 font-medium">
                  Race Pack tidak dapat diberikan. Harap arahkan peserta ke meja
                  Administrasi/Helpdesk.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
