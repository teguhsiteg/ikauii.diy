"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { syncSessionCookie } from "@/lib/session-cookie";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const router = useRouter();

  // 🔥 AUTO-REDIRECT: kalau user SUDAH login (misal ditendang middleware ke
  // sini karena cookie session sempat hilang), sinkronkan cookie session ke
  // server dulu, lalu teruskan ke callbackUrl (atau /gateway). Ini yang
  // mematahkan redirect loop login ↔ dashboard/admin-vr.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get("callbackUrl");
    const target =
      callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/gateway";

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || cancelled) return;

      // Pastikan cookie firebase_session sudah terset di server SEBELUM redirect,
      // supaya middleware tidak langsung menendang balik ke /login.
      await syncSessionCookie(user);

      if (cancelled) return;
      router.replace(target);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  // --- FUNGSI LOGIN ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/gateway");
    } catch (err: any) {
      console.error("Error Login:", err);
      setError("Email atau Kata Sandi salah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNGSI LOGIN GOOGLE ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/gateway");
    } catch (err: any) {
      console.error("Error Google Login:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Gagal masuk dengan Google. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- FUNGSI RESET PASSWORD ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Masukkan alamat email Anda terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengirim email reset.");
      }

      setSuccessMsg("Tautan reset kata sandi telah dikirim ke email Anda.");

      setTimeout(() => {
        setIsResetMode(false);
        setSuccessMsg("");
        setPassword("");
      }, 5000);
    } catch (err: any) {
      console.error("Firebase Reset Error:", err);
      if (err.code === "auth/user-not-found") {
        setError("Email tidak ditemukan di sistem kami.");
      } else if (err.code === "auth/invalid-email") {
        setError("Format email tidak valid.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Terlalu banyak percobaan. Silakan coba lagi nanti.");
      } else {
        setError("Terjadi kesalahan. Pastikan email benar atau coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* CONTAINER UTAMA: Full width, min-height screen, tidak ada padding/margin luar */
    <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-white">
      {/* --- SISI KIRI: BRANDING (FULL HEIGHT, MENTOK UJUNG) --- */}
      <div className="hidden lg:flex w-full lg:w-5/12 bg-gradient-to-br from-[#0B1528] to-[#1A73E8] p-12 lg:p-20 flex-col justify-between relative overflow-hidden shrink-0 min-h-screen">
        {/* Ornamen Latar Belakang */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col justify-center h-full">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[1.2rem] p-3 mb-10 shadow-xl border border-white/20 transform -rotate-3">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo IKA UII"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Portal Layanan <br />
            <span className="text-yellow-400">DPW IKA UII DIY</span>
          </h1>

          <div className="w-12 h-1.5 bg-yellow-500 rounded-full mb-8"></div>

          <p className="text-blue-100/90 font-medium text-base leading-relaxed max-w-sm">
            Sistem Informasi Manajemen Terpadu untuk kolaborasi dan sinergi
            alumni di wilayah Daerah Istimewa Yogyakarta.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-blue-300/50 text-[10px] font-mono tracking-widest uppercase">
            &copy; {new Date().getFullYear()} SIM DPW IKA UII DIY • Integrity •
            Syiar • Professional
          </p>
        </div>
      </div>

      {/* --- SISI KANAN: FORM LOGIN & RESET (FULL HEIGHT, MENTOK UJUNG) --- */}
      <div className="w-full lg:w-7/12 min-h-screen p-8 sm:p-16 lg:p-24 flex flex-col justify-center bg-white relative z-20 overflow-y-auto">
        <div className="max-w-[420px] w-full mx-auto">
          {/* Header untuk Mobile (Karena kolom biru disembunyikan di HP) */}
          <div className="lg:hidden flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center mb-4 p-2 transform -rotate-3">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo IKA UII"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-none mb-1.5">
              Portal Layanan
            </h1>
            <p className="text-xs font-bold text-yellow-600 tracking-[0.2em] uppercase">
              DPW IKA UII DIY
            </p>
          </div>

          <div className="mb-10 lg:mb-12 text-center lg:text-left transition-all duration-300">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2.5">
              {isResetMode ? "Atur Ulang Sandi" : "Masuk ke Akun"}
            </h2>
            <p className="text-slate-500 text-sm lg:text-base font-medium">
              {isResetMode
                ? "Masukkan email terdaftar untuk menerima tautan akses."
                : "Silakan login menggunakan kredensial akun Anda."}
            </p>
          </div>

          <form
            onSubmit={isResetMode ? handleResetPassword : handleLogin}
            className="space-y-5 lg:space-y-6"
          >
            {/* NOTIFIKASI ERROR / SUCCESS */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm font-bold p-4 rounded-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs sm:text-sm font-bold p-4 rounded-xl animate-in fade-in slide-in-from-top-2 flex items-center gap-2">
                <svg
                  className="w-5 h-5 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                {successMsg}
              </div>
            )}

            {/* TOMBOL GOOGLE LOGIN */}
            {!isResetMode && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isLoading ? (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Masuk dengan Google
                    </>
                  )}
                </button>

                <div className="flex items-center gap-4 my-2">
                  <div className="flex-1 h-px bg-slate-200"></div>
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">ATAU</span>
                  <div className="flex-1 h-px bg-slate-200"></div>
                </div>
              </>
            )}

            {/* INPUT EMAIL */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/10 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm"
                placeholder="email@contoh.com"
              />
            </div>

            {/* INPUT PASSWORD */}
            {!isResetMode && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-2 pl-1 pr-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setError("");
                      setSuccessMsg("");
                    }}
                    className="text-xs font-bold text-[#1A73E8] hover:text-blue-800 transition-colors"
                  >
                    Lupa Sandi?
                  </button>
                </div>
                <input
                  type="password"
                  required={!isResetMode}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/10 outline-none transition-all text-sm font-medium tracking-widest text-slate-800 shadow-sm"
                  placeholder="••••••••"
                />
              </div>
            )}

            {/* TOMBOL AKSI UTAMA */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white font-black py-4 lg:py-4.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 text-sm uppercase tracking-widest mt-6"
            >
              {isLoading ? (
                <svg
                  className="w-5 h-5 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              ) : isResetMode ? (
                "Kirim Tautan Reset"
              ) : (
                "Masuk ke Portal"
              )}
            </button>

            {/* TOMBOL BATAL RESET */}
            {isResetMode && (
              <button
                type="button"
                onClick={() => {
                  setIsResetMode(false);
                  setError("");
                  setSuccessMsg("");
                }}
                className="w-full text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mt-3 py-2"
              >
                Batal dan Kembali ke Login
              </button>
            )}
          </form>

          {/* 🔥 LINK REGISTER PUBLIK (DITAMBAHKAN DI SINI) 🔥 */}
          {!isResetMode && (
            <div className="mt-8 pt-6 border-t border-slate-100 text-center animate-in fade-in duration-500">
              <p className="text-sm text-slate-500 font-medium">
                Belum memiliki akun untuk akses Masterclass?
              </p>
              <Link
                href="/masterclass/register"
                className="inline-block mt-2 text-sm font-bold text-[#1A73E8] hover:text-blue-800 hover:underline transition-colors"
              >
                Daftar Akun Publik di sini
              </Link>
            </div>
          )}

          {/* NAVIGASI KEMBALI */}
          <div className="mt-10 lg:mt-12 text-center lg:text-left flex justify-center lg:justify-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#1A73E8] transition-colors py-2.5 px-4 rounded-xl hover:bg-blue-50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Kembali ke Beranda Utama
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
