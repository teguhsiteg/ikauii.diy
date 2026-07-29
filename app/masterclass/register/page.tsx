"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";

export default function MasterclassRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    whatsapp: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- STATE UNTUK CAPTCHA ---
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: 0 });
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaError, setCaptchaError] = useState(false);

  // Generate Captcha saat halaman dimuat
  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1; // Angka 1-10
    const n2 = Math.floor(Math.random() * 10) + 1; // Angka 1-10
    setCaptcha({ num1: n1, num2: n2, answer: n1 + n2 });
    setCaptchaInput("");
    setCaptchaError(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    // 1. Validasi Captcha
    if (parseInt(captchaInput) !== captcha.answer) {
      setErrorMsg(
        "Verifikasi keamanan (Captcha) tidak tepat. Silakan hitung kembali.",
      );
      setCaptchaError(true);
      generateCaptcha(); // Reset captcha jika salah
      setIsLoading(false);
      return;
    }

    try {
      // 2. Buat Akun di Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const user = userCredential.user;

      // 3. Update Display Name di Auth
      await updateProfile(user, {
        displayName: formData.nama,
      });

      // 4. Simpan Data Profil ke Tabel 'peserta_umum'
      await setDoc(doc(db, "peserta_umum", user.uid), {
        uid: user.uid,
        nama: formData.nama,
        email: formData.email,
        whatsapp: formData.whatsapp,
        role: "peserta_umum",
        asalPendaftaran: "masterclass",
        createdAt: serverTimestamp(),
      });

      // 5. Sukses! Arahkan ke Katalog Masterclass
      router.push("/masterclass");
    } catch (error: any) {
      console.error("Error register:", error);
      generateCaptcha(); // Selalu reset captcha jika terjadi error
      setCaptchaInput("");

      if (error.code === "auth/email-already-in-use") {
        setErrorMsg(
          "Email ini sudah terdaftar. Silakan gunakan email lain atau langsung Login.",
        );
      } else if (error.code === "auth/weak-password") {
        setErrorMsg("Password terlalu lemah. Gunakan minimal 6 karakter.");
      } else {
        setErrorMsg("Terjadi kesalahan sistem. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100">
        {/* ========================================== */}
        {/* KIRI: Sisi Banner / Copywriting */}
        {/* ========================================== */}
        <div className="w-full md:w-5/12 bg-[#0B1120] p-10 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          {/* Ornamen Background Mewah */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#0056D2] opacity-40 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-500 opacity-20 rounded-full blur-[60px]"></div>
          </div>

          <div className="relative z-10">
            <Link
              href="/masterclass"
              className="inline-block bg-white/5 backdrop-blur-md p-3 rounded-2xl mb-10 hover:bg-white/10 transition-colors border border-white/10 shadow-lg"
            >
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </Link>
            <h1 className="text-3xl font-black leading-tight mb-5">
              Tingkatkan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Kompetensi Anda
              </span>{" "}
              <br />
              Hari Ini.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">
              Bergabunglah dengan ribuan alumni lainnya. Akses materi eksklusif
              yang dirancang oleh praktisi industri terkemuka.
            </p>
          </div>

          <div className="relative z-10 mt-10 md:mt-0">
            <div className="bg-white/5 backdrop-blur-sm p-5 rounded-2xl border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex gap-1">
                  <span className="text-[#F2D049] text-sm">★</span>
                  <span className="text-[#F2D049] text-sm">★</span>
                  <span className="text-[#F2D049] text-sm">★</span>
                  <span className="text-[#F2D049] text-sm">★</span>
                  <span className="text-[#F2D049] text-sm">★</span>
                </div>
                <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded">
                  4.9/5
                </span>
              </div>
              <p className="text-xs text-slate-300 italic mb-4 leading-relaxed">
                "Platform belajar yang sangat terstruktur. Sangat membantu saya
                dalam *upskilling* di dunia kerja nyata."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">
                  A
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Alumni Masterclass
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* KANAN: Form Pendaftaran */}
        {/* ========================================== */}
        <div className="w-full md:w-7/12 p-8 md:p-12 relative">
          {/* Badge Keamanan */}
          <div className="absolute top-6 right-6 hidden sm:flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            <svg
              className="w-3.5 h-3.5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">
              SSL Secured
            </span>
          </div>

          <div className="mb-8 mt-2">
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
              Registrasi Akun
            </h2>
            <p className="text-sm text-slate-500 mt-2 font-medium">
              Sudah memiliki akun?{" "}
              <Link
                href="/login"
                className="text-[#0056D2] font-bold hover:underline transition-all"
              >
                Masuk di sini
              </Link>
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-bold border border-rose-100 mb-6 flex items-start gap-3 animate-in fade-in zoom-in duration-300">
              <svg
                className="w-5 h-5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all font-medium text-slate-800"
                placeholder="Nama sesuai identitas"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all font-medium text-slate-800"
                  placeholder="email@domain.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                  No. WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsapp: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all font-medium text-slate-800"
                  placeholder="08123456789"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                Kata Sandi
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 outline-none text-sm transition-all font-medium text-slate-800 tracking-wider"
                placeholder="Minimal 6 karakter"
              />
            </div>

            {/* 🔥 SECURITY CAPTCHA BLOCK 🔥 */}
            <div
              className={`p-5 rounded-xl border transition-colors ${captchaError ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className={`w-4 h-4 ${captchaError ? "text-rose-500" : "text-slate-400"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <label
                  className={`text-[11px] font-bold uppercase tracking-widest ${captchaError ? "text-rose-600" : "text-slate-600"}`}
                >
                  Verifikasi Keamanan
                </label>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-lg text-lg font-black text-slate-800 shadow-sm shrink-0 flex items-center gap-2">
                  {captcha.num1} <span className="text-slate-400">+</span>{" "}
                  {captcha.num2} <span className="text-slate-400">=</span>
                </div>
                <input
                  type="number"
                  required
                  value={captchaInput}
                  onChange={(e) => {
                    setCaptchaInput(e.target.value);
                    setCaptchaError(false);
                  }}
                  className={`w-full px-5 py-3.5 bg-white border rounded-lg outline-none text-lg font-black transition-all shadow-sm ${captchaError ? "border-rose-300 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 text-rose-600" : "border-slate-200 focus:border-[#0056D2] focus:ring-4 focus:ring-blue-500/10 text-[#0056D2]"}`}
                  placeholder="?"
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-3.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-[#0056D2] hover:bg-blue-50 transition-colors shadow-sm"
                  title="Ganti Pertanyaan"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading || !captchaInput}
                className="w-full bg-[#0056D2] hover:bg-[#00419E] text-white py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-3"
              >
                {isLoading ? (
                  <>
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
                    Mendaftarkan...
                  </>
                ) : (
                  "Buat Akun Sekarang"
                )}
              </button>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6 leading-relaxed font-medium px-4">
              Dengan mendaftar, Anda menyetujui{" "}
              <Link
                href="/syarat-ketentuan"
                target="_blank"
                className="text-slate-600 hover:text-[#0056D2] underline transition-colors"
              >
                Syarat & Ketentuan
              </Link>{" "}
              serta{" "}
              <Link
                href="/kebijakan-privasi"
                target="_blank"
                className="text-slate-600 hover:text-[#0056D2] underline transition-colors"
              >
                Kebijakan Privasi
              </Link>{" "}
              DPW IKA UII.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
