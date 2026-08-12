"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { usePathname } from "next/navigation";

import { Shield } from "lucide-react";
import Sidebar from "@/components/admin-vr/Sidebar";
import Header from "@/components/admin-vr/Header";

const ADMIN_ROLES = ["admin", "super_admin", "superadmin"];

export default function AdminVRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [emailLogin, setEmailLogin] = useState("");
  const [passwordLogin, setPasswordLogin] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isVerifiedAdmin, setIsVerifiedAdmin] = useState(false);

  // 🔥 STATE KHUSUS UNTUK HAMBURGER MENU (MOBILE) 🔥
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const pathname = usePathname();
  const isDisplayControl = pathname === "/admin-vr/race-display";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Verifikasi role admin dari Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const role = String(userDoc.data()?.role || "").toLowerCase();
            if (ADMIN_ROLES.includes(role)) {
              setIsVerifiedAdmin(true);
            } else {
              setErrorMsg("Akun Anda tidak memiliki hak akses Admin.");
              setUser(null); // Paksa ke login screen
            }
          } else {
            // Cek admin_emails sebagai fallback (self-healing dari server)
            const emailKey = currentUser.email?.toLowerCase() || "";
            const adminEmailDoc = await getDoc(doc(db, "admin_emails", emailKey));
            if (adminEmailDoc.exists() && adminEmailDoc.data()?.active) {
              setIsVerifiedAdmin(true);
            } else {
              setErrorMsg("Akun Anda tidak memiliki hak akses Admin.");
              setUser(null);
            }
          }
        } catch {
          // Jika Firestore gagal, tetap izinkan — backend API route tetap memvalidasi
          setIsVerifiedAdmin(true);
        }
      } else {
        setIsVerifiedAdmin(false);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setErrorMsg("");
    try {
      await signInWithEmailAndPassword(auth, emailLogin, passwordLogin);
    } catch (error: any) {
      setErrorMsg("Email atau Password salah. Akses ditolak.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMsg("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== "auth/popup-closed-by-user") {
        setErrorMsg("Gagal masuk dengan Google. Akses ditolak.");
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500 uppercase tracking-widest text-sm animate-pulse">
        Memeriksa Otorisasi...
      </div>
    );
  }

  // Jika belum login, tampilkan form login
  if (!user) {
    return (
      <div className="min-h-screen w-full flex flex-col lg:flex-row font-sans bg-white">
        {/* SISI KIRI: BRANDING */}
        <div className="hidden lg:flex w-full lg:w-5/12 bg-gradient-to-br from-[#0B1528] to-[#1A73E8] p-12 lg:p-20 flex-col justify-between relative overflow-hidden shrink-0 min-h-screen">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col justify-center h-full">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[1.2rem] p-3 mb-10 shadow-xl border border-white/20 transform -rotate-3 flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
              Control Room <br />
              <span className="text-yellow-400">Virtual Run</span>
            </h1>
            <div className="w-12 h-1.5 bg-yellow-500 rounded-full mb-8"></div>
            <p className="text-blue-100/90 font-medium text-base leading-relaxed max-w-sm">
              Sistem manajemen pusat untuk mengontrol dan memantau jalannya acara Virtual Run. Autentikasi diperlukan.
            </p>
          </div>

          <div className="relative z-10">
            <p className="text-blue-300/50 text-[10px] font-mono tracking-widest uppercase">
              &copy; {new Date().getFullYear()} SIM DPW IKA UII DIY • Security
            </p>
          </div>
        </div>

        {/* SISI KANAN: FORM */}
        <div className="w-full lg:w-7/12 min-h-screen p-8 sm:p-16 lg:p-24 flex flex-col justify-center bg-white relative z-20 overflow-y-auto">
          <div className="max-w-[420px] w-full mx-auto">
            {/* Header Mobile */}
            <div className="lg:hidden flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center mb-4 p-2 transform -rotate-3">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-none mb-1.5">
                Control Room
              </h1>
              <p className="text-xs font-bold text-yellow-600 tracking-[0.2em] uppercase">Virtual Run</p>
            </div>

            <div className="mb-10 lg:mb-12 text-center lg:text-left transition-all duration-300">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2.5">Admin Security</h2>
              <p className="text-slate-500 text-sm lg:text-base font-medium">
                Silakan login untuk mengakses Control Room.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 lg:space-y-6">
              {errorMsg && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs sm:text-sm font-bold p-4 rounded-xl flex items-center gap-2">
                  <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errorMsg}
                </div>
              )}

              {/* TOMBOL GOOGLE */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoggingIn ? (
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

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Email Admin</label>
                <input
                  type="email"
                  required
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-5 py-4 lg:py-4.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 text-sm font-semibold"
                  placeholder="admin@ikadiy.uii.ac.id"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">Kata Sandi</label>
                <input
                  type="password"
                  required
                  value={passwordLogin}
                  onChange={(e) => setPasswordLogin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-5 py-4 lg:py-4.5 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-800 text-sm font-semibold"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white font-black py-4 lg:py-4.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 flex items-center justify-center text-sm uppercase tracking-widest mt-6 disabled:opacity-50"
              >
                {isLoggingIn ? "Memeriksa..." : "Login System"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Jika sudah login, tampilkan layout admin (Menu Kiri + Header Atas + Isi Halaman)
  return (
    <div className="flex h-screen bg-[#F4F7FB] font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">
      {/* Memanggil Komponen Sidebar DENGAN Props Mobile */}
      {!isDisplayControl && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}

      {/* Area Kanan */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* 🔥 HEADER HAMBURGER KHUSUS MOBILE (Muncul jika layar kecil) 🔥 */}
        {!isDisplayControl && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-3">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
              <span className="font-black text-slate-800 text-sm">
                Admin Panel
              </span>
            </div>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors rounded-lg"
            >
              {/* Ikon Hamburger */}
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Memanggil Komponen Header Asli Anda (Bisa disembunyikan di mobile jika perlu, atau dibiarkan) */}
        {!isDisplayControl && (
          <div className="hidden lg:block">
            <Header userEmail={user.email || "Admin"} />
          </div>
        )}

        {/* Isi Perut (page.tsx akan masuk ke {children} ini) */}
        <main className={`flex-1 overflow-y-auto custom-scrollbar relative ${isDisplayControl ? '' : 'p-4 md:p-6'}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
