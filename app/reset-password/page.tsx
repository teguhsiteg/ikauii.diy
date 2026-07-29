"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import Link from "next/link";

// --- Komponen Form Utama ---
function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const oobCode = searchParams.get("oobCode");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!oobCode) {
      setError(
        "Tautan tidak valid atau telah kedaluwarsa. Silakan minta tautan baru.",
      );
      return;
    }

    if (newPassword.length < 6) {
      setError("Kata sandi minimal harus 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      // 1. Ekstrak Email dari Kode Firebase (Sangat Penting untuk Kirim Notif)
      const userEmail = await verifyPasswordResetCode(auth, oobCode);

      // 2. Simpan Sandi Baru ke Firebase Auth
      await confirmPasswordReset(auth, oobCode, newPassword);
      setIsSuccess(true);

      // 3. Kirim Email Notifikasi Keamanan (Menunggu response agar tidak terputus)
      // Gunakan nama depan dari email sebagai sapaan (contoh: budi@gmail.com -> budi)
      const namaPanggilan = userEmail.split("@")[0];

      try {
        console.log("Mencoba mengirim email notifikasi ke:", userEmail);
        const emailResponse = await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "password_changed",
            email: userEmail,
            nama: namaPanggilan,
            detail: {},
          }),
        });

        if (!emailResponse.ok) {
          const emailData = await emailResponse.json();
          console.error("❌ API Email merespons dengan error:", emailData);
        } else {
          console.log("✅ Email notifikasi berhasil dikirim!");
        }
      } catch (emailErr) {
        console.error("❌ Gagal melakukan fetch ke API Email:", emailErr);
      }

      // 4. Arahkan ke halaman login setelah 3 detik
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      if (err.code === "auth/expired-action-code") {
        setError(
          "Tautan sudah kedaluwarsa. Silakan minta tautan reset yang baru.",
        );
      } else if (err.code === "auth/invalid-action-code") {
        setError("Tautan tidak valid atau sudah digunakan.");
      } else {
        setError("Terjadi kesalahan saat mengatur kata sandi. Coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!oobCode && !isSuccess) {
    return (
      <div className="bg-red-50 border border-red-100 text-red-600 text-sm font-medium p-6 rounded-xl text-center">
        Tautan tidak valid, rusak, atau kode keamanan tidak ditemukan. <br />
        Silakan kembali ke halaman Login dan ulangi proses{" "}
        <b>"Lupa Kata Sandi"</b>.
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-center p-8 rounded-xl animate-in zoom-in-95">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">Sandi Berhasil Diubah!</h3>
        <p className="text-sm font-medium opacity-80">
          Akun Anda kini sudah aman. Mengalihkan ke halaman Login...
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleReset}
      className="space-y-4 lg:space-y-5 animate-in fade-in slide-in-from-bottom-4"
    >
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs font-bold p-3 lg:p-4 rounded-xl">
          {error}
        </div>
      )}

      {/* Input Sandi Baru */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">
          Kata Sandi Baru
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm tracking-widest font-medium pr-12"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none p-1"
          >
            {showPassword ? (
              // Icon Eye Open (Tampilkan)
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              // Icon Eye Closed (Sembunyikan)
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Input Konfirmasi Sandi */}
      <div>
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1.5">
          Ulangi Kata Sandi
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm tracking-widest font-medium pr-12"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none p-1"
          >
            {showConfirmPassword ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-950 hover:bg-blue-900 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 text-xs lg:text-sm uppercase tracking-widest mt-2"
      >
        {isLoading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
        ) : (
          "Simpan Kata Sandi"
        )}
      </button>
    </form>
  );
}

// --- Komponen Utama Layout ---
export default function ResetPasswordPage() {
  return (
    // 🔥 PENGUNCI LAYAR: h-[100dvh] dan overflow-hidden memastikan responsive sama seperti Login
    <div className="h-[100dvh] w-full bg-slate-100 flex items-center justify-center p-3 sm:p-6 font-sans overflow-hidden">
      <div className="bg-white w-full max-w-[1000px] h-full max-h-[750px] rounded-[1.5rem] lg:rounded-[2rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-slate-200">
        {/* SISI KIRI: FORM */}
        <div className="w-full lg:w-1/2 h-full p-6 sm:p-10 xl:p-14 flex flex-col justify-center overflow-y-auto relative">
          {/* 🔥 IDENTITAS KHUSUS MOBILE 🔥 */}
          <div className="lg:hidden flex flex-col items-center text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="w-14 h-14 bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center mb-3 p-1.5">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo IKA UII"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl font-black text-blue-950 tracking-tight leading-none mb-1">
              Keamanan Akun
            </h1>
            <p className="text-[11px] font-bold text-yellow-600 tracking-widest uppercase">
              DPW IKA UII DIY
            </p>
          </div>

          <div className="mb-8 lg:mb-10 text-center lg:text-left transition-all duration-300 hidden lg:block">
            <h2 className="text-2xl lg:text-3xl font-black text-blue-950 tracking-tight">
              Keamanan Akun
            </h2>
            <p className="text-slate-500 text-xs lg:text-sm mt-1.5 font-medium">
              Silakan buat kata sandi baru untuk akun Portal Layanan Anda.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="animate-pulse h-40 bg-slate-100 rounded-xl w-full"></div>
            }
          >
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-8 lg:mt-10 pt-5 lg:pt-6 border-t border-slate-100 text-center lg:text-left">
            <Link
              href="/login"
              className="text-[11px] lg:text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
            >
              ← Batal dan Kembali ke Login
            </Link>
          </div>
        </div>

        {/* SISI KANAN: VISUAL (Hanya Desktop) */}
        <div className="hidden lg:flex lg:w-1/2 h-full bg-blue-950 relative items-center justify-center p-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.uii.ac.id/wp-content/uploads/2017/09/UII-Central-Building.jpg')] bg-cover bg-center opacity-10 grayscale"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-blue-950"></div>

          <div className="relative z-10 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl transform -rotate-6 transition-transform hover:rotate-0 duration-500">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-16 h-16 object-contain"
              />
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4 tracking-tight">
              Portal Layanan <br />{" "}
              <span className="text-yellow-500">DPW IKA UII DIY</span>
            </h1>
            <div className="w-12 h-1 bg-yellow-500 mx-auto rounded-full mb-6"></div>
            <p className="text-blue-200 text-sm leading-relaxed max-w-xs mx-auto font-medium">
              Sistem Informasi Manajemen Terpadu untuk kolaborasi dan sinergi
              alumni di wilayah Yogyakarta.
            </p>
          </div>

          <div className="absolute bottom-8 text-[10px] font-bold text-blue-800 uppercase tracking-[0.3em]">
            Integrity • Syiar • Professional
          </div>
        </div>
      </div>
    </div>
  );
}
