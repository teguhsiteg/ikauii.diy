"use client";

import { useState, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import RunNavbar from "@/components/run/RunNavbar";
import RunFooter from "@/components/run/RunFooter";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Activity, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Trophy, Sparkles } from "lucide-react";

function StravaConnectContent() {
  const searchParams = useSearchParams();
  const urlStatus = searchParams.get("status");
  const urlMsg = searchParams.get("msg");

  const [settings, setSettings] = useState<any>(null);
  const [formData, setFormData] = useState({ bib: "", nik: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "virtual_run"));
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Gagal memuat pengaturan:", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (urlStatus === "access_denied") {
      setErrorMsg("Otorisasi Strava dibatalkan oleh pengguna.");
    } else if (urlStatus === "server_error") {
      setErrorMsg(urlMsg ? `Kendala Server: ${decodeURIComponent(urlMsg)}` : "Terjadi kendala server saat menghubungkan Strava.");
    } else if (urlStatus === "token_error") {
      setErrorMsg(urlMsg ? `Strava Error: ${decodeURIComponent(urlMsg)}` : "Gagal memproses otorisasi token dari Strava.");
    } else if (urlStatus === "participant_not_found") {
      setErrorMsg("Data peserta tidak ditemukan saat menghubungkan Strava.");
    }
  }, [urlStatus, urlMsg]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const finalValue = name === "nik" ? value.replace(/\D/g, "") : value;
    setFormData({ ...formData, [name]: finalValue.toUpperCase() });
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const inputBib = formData.bib.trim().toUpperCase();
    const inputNik = formData.nik.trim();

    if (!inputBib || !inputNik) {
      setErrorMsg("Mohon lengkapi Nomor BIB dan NIK Anda.");
      setIsLoading(false);
      return;
    }

    try {
      let foundUser: any = null;
      let participantId: string = "";

      // 1. CARI BERDASARKAN NOMOR BIB DI OFFLINE PARTICIPANTS
      const qBib = query(
        collection(db, "offline_participants"),
        where("nomorBIB", "==", inputBib),
      );
      const snapBib = await getDocs(qBib);

      if (!snapBib.empty) {
        foundUser = snapBib.docs[0].data();
        participantId = snapBib.docs[0].id;
      } else {
        // Coba cari juga dengan field bib
        const qBibAlt = query(
          collection(db, "offline_participants"),
          where("bib", "==", inputBib),
        );
        const snapBibAlt = await getDocs(qBibAlt);
        if (!snapBibAlt.empty) {
          foundUser = snapBibAlt.docs[0].data();
          participantId = snapBibAlt.docs[0].id;
        }
      }

      // 2. JIKA TIDAK KETEMU DI INDIVIDU, CARI DI PENDAFTARAN KOMUNITAS
      if (!foundUser) {
        const qKomunitas = query(
          collection(db, "pendaftaran_komunitas"),
          where("statusPembayaran", "==", "Lunas"),
        );
        const snapKomunitas = await getDocs(qKomunitas);

        for (const dSnap of snapKomunitas.docs) {
          const groupData = dSnap.data();
          const members = groupData.participants || [];
          const matchIndex = members.findIndex(
            (m: any) => (m.nomorBIB === inputBib || m.bib === inputBib),
          );

          if (matchIndex !== -1) {
            foundUser = members[matchIndex];
            participantId = `${dSnap.id}_m_${matchIndex}`;
            break;
          }
        }
      }

      if (!foundUser) {
        setErrorMsg(
          `Nomor BIB "${inputBib}" tidak ditemukan di sistem. Pastikan Nomor BIB sudah sesuai.`,
        );
        setIsLoading(false);
        return;
      }

      // 3. COCOKKAN NIK UNTUK KEAMANAN
      if (foundUser.nik !== inputNik) {
        setErrorMsg(
          `NIK yang Anda masukkan tidak cocok dengan data Nomor BIB ${inputBib}.`,
        );
        setIsLoading(false);
        return;
      }

      // 4. CEK STATUS PEMBAYARAN
      if (foundUser.statusPembayaran && foundUser.statusPembayaran !== "Lunas") {
        setErrorMsg(
          `Status pendaftaran Anda saat ini: ${foundUser.statusPembayaran}. Selesaikan pembayaran terlebih dahulu.`,
        );
        setIsLoading(false);
        return;
      }

      // 5. SEMUA VALIDASI LOLOS -> REDIRECT KE STRAVA
      setSuccessMsg(
        "Verifikasi Berhasil! Mengalihkan ke halaman otorisasi Strava...",
      );

      const clientId = process.env.NEXT_PUBLIC_STRAVA_CLIENT_ID || "175689";
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000";
      const redirectUri = `${baseUrl}/api/strava/callback`;
      const scope = "read,activity:read_all";
      const state = participantId;

      const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&approval_prompt=auto&scope=${scope}&state=${state}`;

      setTimeout(() => {
        window.location.href = stravaAuthUrl;
      }, 800);
    } catch (error: any) {
      console.error("Verification error:", error);
      setErrorMsg(`Terjadi kesalahan sistem: ${error.message || "Gagal menghubungkan ke database."}`);
      setIsLoading(false);
    }
  };

  const eventTitle = settings?.offlineJudul || "SEMBADA RUN 2026";

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col selection:bg-[#FC4C02] selection:text-white">
      <RunNavbar eventName={eventTitle} />

      {/* --- HERO HEADER SECTION --- */}
      <section className="bg-[#0B2239] text-white pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FC4C02_1px,transparent_1px)] [background-size:24px_24px]"></div>

        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FC4C02]/20 border border-[#FC4C02]/40 px-4 py-1.5 rounded-full text-xs font-bold text-[#FC4C02] uppercase tracking-wider mb-4 backdrop-blur-sm">
            <Activity className="w-4 h-4" />
            Official Strava Sync Portal
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">
            Sinkronisasi Catatan Waktu Strava
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Hubungkan akun Strava Anda untuk otomatis menyetor hasil lari ke Leaderboard resmi <span className="font-bold text-[#FCD116]">{eventTitle}</span> dan membuat poster rute GPS.
          </p>
        </div>
      </section>

      {/* --- MAIN CONTENT (2-COLUMN INTEGRATED PORTAL) --- */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI: PANDUAN & KEUNGGULAN SINKRONISASI */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-7 border border-slate-200/80 shadow-sm">
              <h2 className="text-base font-bold text-[#0B2239] mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#FC4C02]" />
                Alur Sinkronisasi Mandiri
              </h2>
              <ol className="space-y-4 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-50 text-[#FC4C02] font-bold flex items-center justify-center shrink-0 text-xs border border-orange-200">
                    1
                  </span>
                  <span>Verifikasi data Anda dengan memasukkan <strong>Nomor BIB</strong> dan <strong>NIK KTP</strong>.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-50 text-[#FC4C02] font-bold flex items-center justify-center shrink-0 text-xs border border-orange-200">
                    2
                  </span>
                  <span>Otorisasikan akun <strong>Strava</strong> Anda untuk memberikan izin pembacaan data aktivitas lari.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-50 text-[#FC4C02] font-bold flex items-center justify-center shrink-0 text-xs border border-orange-200">
                    3
                  </span>
                  <span>Pilih aktivitas lari hari-H di halaman <strong>Run Studio</strong> lalu tekan <strong>"Setor Waktu"</strong>.</span>
                </li>
              </ol>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100 rounded-2xl p-5 text-xs text-slate-700 leading-relaxed space-y-3">
              <div className="font-bold text-[#0B2239] flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-[#1A73E8]" /> Fitur Run Studio
              </div>
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Catatan waktu otomatis terverifikasi (<strong>Verified by Strava</strong>)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Download poster rute peta GPS & pace untuk Instagram Story</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Masuk klasemen Top Finisher Leaderboard secara realtime</span>
                </li>
              </ul>
            </div>
          </div>

          {/* KOLOM KANAN: FORM VERIFIKASI & TOMBOL OAUTH */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
                <div>
                  <h2 className="text-lg font-black text-[#0B2239]">
                    Sinkronisasi Data Strava
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Masukkan data yang sesuai dengan pendaftaran Anda
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-[#FC4C02]"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                {/* Error Message */}
                {errorMsg && (
                  <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-100 flex items-start gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Success Message */}
                {successMsg && (
                  <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-100 flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#0B2239] uppercase tracking-wider mb-2">
                      No BIB
                    </label>
                    <input
                      type="text"
                      name="bib"
                      value={formData.bib}
                      onChange={handleChange}
                      placeholder="Contoh: 3501 / 5012"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FC4C02] focus:ring-2 focus:ring-orange-500/10 outline-none text-sm font-bold text-slate-800 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#0B2239] uppercase tracking-wider mb-2 flex justify-between items-center">
                      <span>Nomor Identitas (NIK)</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        16 Digit KTP
                      </span>
                    </label>
                    <input
                      type="text"
                      name="nik"
                      value={formData.nik}
                      onChange={handleChange}
                      placeholder="Masukkan 16 digit NIK"
                      maxLength={16}
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#FC4C02] focus:ring-2 focus:ring-orange-500/10 outline-none text-sm font-bold text-slate-800 transition-all placeholder:font-normal placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading || successMsg !== ""}
                    className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2.5 text-sm sm:text-base disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading && !successMsg ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Memverifikasi Data...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                          <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                        </svg>
                        Hubungkan dengan Strava
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <Link
                    href="/leaderboard-offline"
                    className="text-[#1A73E8] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    <Trophy className="w-3.5 h-3.5" /> Lihat Leaderboard
                  </Link>
                  <Link
                    href="/run/sertifikat"
                    className="text-[#1A73E8] hover:underline font-bold inline-flex items-center gap-1"
                  >
                    Unduh Sertifikat <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <RunFooter eventName={eventTitle} />
    </div>
  );
}

export default function StravaConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0B2239] rounded-full animate-spin"></div>
        </div>
      }
    >
      <StravaConnectContent />
    </Suspense>
  );
}
