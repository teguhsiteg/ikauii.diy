"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function StravaConnectPage() {
  const [formData, setFormData] = useState({ bib: "", nik: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // BIB bisa angka/huruf, NIK hanya angka
    const finalValue = name === "nik" ? value.replace(/\D/g, "") : value;
    setFormData({ ...formData, [name]: finalValue.toUpperCase() });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (!formData.bib || !formData.nik) {
      setErrorMsg("Mohon lengkapi Nomor BIB dan NIK Anda.");
      setIsLoading(false);
      return;
    }

    try {
      // 1. CARI BERDASARKAN NOMOR BIB DULU
      const qBib = query(
        collection(db, "offline_participants"),
        where("nomorBIB", "==", formData.bib),
      );

      const snapBib = await getDocs(qBib);

      // JIKA BIB TIDAK DITEMUKAN
      if (snapBib.empty) {
        setErrorMsg(
          `Nomor BIB "${formData.bib}" tidak ditemukan di sistem. Pastikan Panitia sudah terdaftar.`,
        );
        setIsLoading(false);
        return;
      }

      const participantData = snapBib.docs[0].data();
      const participantId = snapBib.docs[0].id;

      // 2. COCOKKAN NIK UNTUK KEAMANAN
      if (participantData.nik !== formData.nik) {
        setErrorMsg(
          `NIK yang Anda masukkan tidak cocok dengan data pendaftaran Nomor BIB ${formData.bib}.`,
        );
        setIsLoading(false);
        return;
      }

      // 3. CEK STATUS PEMBAYARAN
      if (participantData.statusPembayaran !== "Lunas") {
        setErrorMsg(
          `Status pendaftaran Anda saat ini: ${participantData.statusPembayaran}. Selesaikan pembayaran untuk menghubungkan Strava.`,
        );
        setIsLoading(false);
        return;
      }

      // 4. SEMUA VALIDASI LOLOS -> REDIRECT KE STRAVA
      setSuccessMsg(
        "Verifikasi Berhasil! Mengalihkan ke halaman login Strava...",
      );

      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || "175689";
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const redirectUri = `${baseUrl}/api/strava/callback`;
      const scope = "read,activity:read_all";
      const state = participantId;

      const stravaAuthUrl = `https://www.strava.com/oauth/mobile/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=auto&scope=${scope}&state=${state}`;

      // Jeda 1 detik agar user sempat membaca pesan sukses
      setTimeout(() => {
        window.location.href = stravaAuthUrl;
      }, 1000);
    } catch (error) {
      console.error("Verification error:", error);
      setErrorMsg("Terjadi kesalahan koneksi ke database. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col relative selection:bg-[#FC4C02] selection:text-white overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#FC4C02]/15 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] bg-[#1A73E8]/10 blur-[100px] rounded-full"></div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#152B5B 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        ></div>
      </div>

      <main className="flex-grow w-full relative z-10 flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-10 animate-in fade-in slide-in-from-top-8 duration-700">
          <img
            src="/logo-dpp-ika.png"
            alt="Logo IKA UII DIY"
            className="h-16 md:h-20 object-contain drop-shadow-md"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        </div>

        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-[420px] overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="p-8 sm:p-10 border-b border-slate-100 bg-[#FAFCFF] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#FC4C02] to-[#FF8C00]"></div>
            <div className="text-center relative z-10">
              <div className="w-20 h-20 bg-white rounded-[1.25rem] flex items-center justify-center mx-auto mb-5 border border-slate-100 shadow-sm rotate-3 hover:rotate-0 transition-transform">
                <svg
                  className="w-10 h-10 text-[#FC4C02]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
              </div>
              <h1 className="text-2xl sm:text-[26px] font-black text-[#0B2239] tracking-tight mb-2">
                UII Sehat Run Studio
              </h1>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Sinkronisasikan data lari Anda, masuk ke Leaderboard, dan buat
                IG Story eksklusif!
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="p-8 sm:p-10 space-y-6">
            {/* PESAN ERROR SPESIFIK */}
            {errorMsg && (
              <div className="bg-rose-50 text-rose-600 text-xs font-bold p-4 rounded-xl border border-rose-100 flex items-start gap-2 animate-in slide-in-from-top-2">
                <svg
                  className="w-4 h-4 shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {errorMsg}
              </div>
            )}

            {/* PESAN SUKSES REDIRECT */}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-600 text-xs font-bold p-4 rounded-xl border border-emerald-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                <svg
                  className="w-4 h-4 shrink-0 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {successMsg}
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-[#0B2239] uppercase tracking-widest mb-2 ml-1">
                  Nomor BIB Lari
                </label>
                <input
                  type="text"
                  name="bib"
                  value={formData.bib}
                  onChange={handleChange}
                  placeholder="Contoh: 5012"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FC4C02] focus:ring-4 focus:ring-orange-500/10 outline-none text-base font-black tracking-widest text-slate-800 transition-all text-center uppercase placeholder:text-slate-300 placeholder:font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#0B2239] uppercase tracking-widest mb-2 ml-1 flex justify-between items-center">
                  <span>Nomor Identitas (NIK)</span>
                  <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full font-bold">
                    Verifikasi
                  </span>
                </label>
                <input
                  type="text"
                  name="nik"
                  value={formData.nik}
                  onChange={handleChange}
                  placeholder="Masukkan 16 digit NIK"
                  maxLength={16}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FC4C02] focus:ring-4 focus:ring-orange-500/10 outline-none text-base font-black tracking-widest text-slate-800 transition-all text-center placeholder:text-slate-300 placeholder:font-medium"
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || successMsg !== ""}
                className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:-translate-y-0.5 active:translate-y-0"
              >
                {isLoading && !successMsg ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Mencari Data...
                  </>
                ) : (
                  "Connect with Strava"
                )}
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center font-medium px-4 leading-relaxed">
              Data aktivitas Anda hanya akan digunakan untuk keperluan
              Leaderboard dan E-Certificate UII Sehat 2026.
            </p>
          </form>
        </div>

        <div className="mt-12 text-center animate-in fade-in duration-1000">
          <p className="text-xs font-bold text-slate-400">
            &copy; {new Date().getFullYear()} DPW IKA UII DIY.
          </p>
        </div>
      </main>
    </div>
  );
}
