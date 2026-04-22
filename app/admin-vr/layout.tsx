"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";

// PENTING: Pastikan path import ini sesuai dengan lokasi file Sidebar & Header Anda
import Sidebar from "@/components/admin-vr/Sidebar";
import Header from "@/components/admin-vr/Header";

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

  // 🔥 STATE KHUSUS UNTUK HAMBURGER MENU (MOBILE) 🔥
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg shadow-blue-600/30">
            🛡️
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-1">
            Admin Security
          </h1>
          <p className="text-slate-500 text-xs mb-8 font-medium">
            Autentikasi diperlukan untuk masuk ke Control Room.
          </p>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 text-xs font-bold p-3 rounded-lg mb-4 border border-rose-200">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              required
              value={emailLogin}
              onChange={(e) => setEmailLogin(e.target.value)}
              placeholder="Email Admin"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 font-bold transition-all"
            />
            <input
              type="password"
              required
              value={passwordLogin}
              onChange={(e) => setPasswordLogin(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 font-bold transition-all"
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-xl shadow-lg transition-all mt-4 disabled:opacity-50 text-sm"
            >
              {isLoggingIn ? "Memeriksa..." : "Login System"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Jika sudah login, tampilkan layout admin (Menu Kiri + Header Atas + Isi Halaman)
  return (
    <div className="flex h-screen bg-[#F4F7FB] font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden relative">
      {/* Memanggil Komponen Sidebar DENGAN Props Mobile */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Area Kanan */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        {/* 🔥 HEADER HAMBURGER KHUSUS MOBILE (Muncul jika layar kecil) 🔥 */}
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

        {/* Memanggil Komponen Header Asli Anda (Bisa disembunyikan di mobile jika perlu, atau dibiarkan) */}
        <div className="hidden lg:block">
          <Header userEmail={user.email || "Admin"} />
        </div>

        {/* Isi Perut (page.tsx akan masuk ke {children} ini) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
          {children}
        </main>
      </div>
    </div>
  );
}
