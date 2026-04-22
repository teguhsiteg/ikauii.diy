"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Email atau Password salah. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans">
      {/* Container Utama - Split Card */}
      <div className="bg-white w-full max-w-[1000px] rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col lg:flex-row border border-slate-200">
        {/* SISI KIRI: FORM LOGIN */}
        <div className="lg:w-1/2 p-8 sm:p-12 xl:p-16 flex flex-col justify-center">
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-black text-blue-950 tracking-tight">
              Login Pengurus
            </h2>
            <p className="text-slate-500 text-sm mt-2 font-medium">
              Selamat datang kembali! Silakan masuk ke panel E-Office.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-4 rounded-xl animate-shake">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                placeholder="admin@ikadiy.uii.ac.id"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-950 hover:bg-blue-900 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-70 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
              {isLoading ? "Menverifikasi..." : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="mt-10 pt-6 border-t border-slate-100 text-center lg:text-left">
            <Link
              href="/"
              className="text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              ← Kembali ke Portal Utama
            </Link>
          </div>
        </div>

        {/* SISI KANAN: VISUAL & BRANDING (Hidden on Mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-blue-950 relative items-center justify-center p-16 overflow-hidden">
          {/* Ornamen Background */}
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.uii.ac.id/wp-content/uploads/2017/09/UII-Central-Building.jpg')] bg-cover bg-center opacity-20 grayscale"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-blue-950"></div>

          {/* Konten Grafis */}
          <div className="relative z-10 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform -rotate-6">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
              E-Office <br />{" "}
              <span className="text-yellow-500">DPW IKA UII DIY</span>
            </h1>
            <div className="w-12 h-1 bg-yellow-500 mx-auto rounded-full mb-6"></div>
            <p className="text-blue-200 text-sm leading-relaxed max-w-xs mx-auto font-medium">
              Sistem Informasi Manajemen Terpadu untuk kolaborasi dan sinergi
              alumni di wilayah Yogyakarta.
            </p>
          </div>

          {/* Watermark bawah */}
          <div className="absolute bottom-8 text-[10px] font-bold text-blue-800 uppercase tracking-[0.3em]">
            Integrity • Syiar • Professional
          </div>
        </div>
      </div>
    </div>
  );
}
