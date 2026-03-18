"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // 1. Proses Autentikasi ke Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );

      // 2. Ambil token otentikasi
      const token = await userCredential.user.getIdToken();

      // 3. Buat "Kartu Identitas" (Cookie) agar Satpam Middleware membiarkan kita masuk
      document.cookie = `__session=${token}; path=/; max-age=86400; SameSite=Strict`;

      // 4. Arahkan ke Zona Privat (Dashboard)
      router.push("/dashboard");
      router.refresh(); // Paksa Next.js memuat ulang agar middleware langsung sadar ada session
    } catch (err: any) {
      console.error(err);
      setError("Email atau password salah. Silakan periksa kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* SISI KIRI: Branding & Visual (Hanya tampil di layar besar) */}
      <div className="hidden lg:flex w-1/2 bg-blue-950 relative items-center justify-center overflow-hidden">
        {/* Background Ornaments */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-yellow-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl" />

        {/* Konten Kiri */}
        <div className="relative z-10 text-center px-12">
          {/* LOGO WARNA ASLI */}
          <img
            src="https://res.cloudinary.com/dzbbssni4/image/upload/v1772155949/logo_fck1g7.png"
            alt="Logo IKA UII Original"
            // brightness-0 invert SUDAH DIHAPUS DISINI
            className="w-100 h-100 mx-auto object-contain mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-500"
          />
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Sistem Informasi <br /> Manajemen
          </h2>
          <div className="w-16 h-1 bg-yellow-500 mx-auto rounded-full mb-6"></div>
          <p className="text-blue-200 text-lg leading-relaxed font-medium">
            Dewan Pimpinan Wilayah <br />
            Ikatan Keluarga Alumni Universitas Islam Indonesia <br />
            Daerah Istimewa Yogyakarta
          </p>
        </div>
      </div>

      {/* SISI KANAN: Form Login */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Tombol Kembali (Pojok Kanan Atas) */}
        <div className="absolute top-8 right-8">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-blue-900 transition-colors font-medium flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 hover:bg-slate-100"
          >
            <span>←</span> Beranda
          </Link>
        </div>

        <div className="max-w-md w-full mt-12 lg:mt-0">
          {/* Header Form */}
          <div className="mb-10">
            {/* Logo untuk Mobile (Muncul saat layar kecil, hilang saat layar besar) */}
            <img
              src="https://res.cloudinary.com/dzbbssni4/image/upload/v1772155949/logo_fck1g7.png"
              alt="Logo IKA UII"
              className="w-16 h-16 object-contain drop-shadow-sm mb-6 lg:hidden"
            />
            <h1 className="text-3xl font-extrabold text-blue-950 mb-2">
              Selamat Datang
            </h1>
            <p className="text-slate-500">
              Silakan masukkan kredensial pengurus Anda untuk mengakses sistem.
            </p>
          </div>

          {/* Notifikasi Error */}
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-100 flex items-start gap-3 animate-pulse">
              <svg
                className="w-5 h-5 shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Form Login */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all text-slate-800"
                placeholder="admin@ikauii.org"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Kata Sandi
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-900/10 focus:border-blue-900 outline-none transition-all text-slate-800"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-blue-900/30 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-3 group"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Memverifikasi...
                  </>
                ) : (
                  <>
                    Masuk ke Sistem
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Bantuan */}
          <div className="mt-10 text-center">
            <p className="text-sm text-slate-500">
              Lupa kata sandi? Silakan hubungi{" "}
              <a
                href="mailto:it@ikauii-diy.org"
                className="text-blue-900 font-bold hover:underline"
              >
                Administrator IT
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
