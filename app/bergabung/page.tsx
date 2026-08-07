"use client";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { sendEmailAction } from "@/app/actions/email";


export default function BergabungPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    noWA: "",
    nim: "",
    password: "",
    confirmPassword: "",
  });

  const { executeRecaptcha } = useGoogleReCaptcha();

  const [modal, setModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    namaLengkap: "",
    nim: "",
    tahunLulus: "",
    fakultas: "",
    programStudi: "",
    noWA: "",
    email: "",
    password: "",
    confirmPassword: "",
    domisili: "",
    pekerjaan: "",
    keahlian: "",
    motto: "",
  });

  const checkDuplicate = async (
    field: "email" | "noWA" | "nim",
    value: string,
  ) => {
    if (!value) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      return;
    }

    try {
      const pendaftarRef = collection(db, "pendaftar");
      const pengurusRef = collection(db, "pengurus");

      const [snapPendaftar, snapPengurus] = await Promise.all([
        getDocs(query(pendaftarRef, where(field, "==", value))),
        getDocs(query(pengurusRef, where(field, "==", value))),
      ]);

      if (!snapPendaftar.empty || !snapPengurus.empty) {
        let label =
          field === "email"
            ? "Email"
            : field === "noWA"
              ? "Nomor WhatsApp"
              : "NIM";
        setFieldErrors((prev) => ({
          ...prev,
          [field]: `${label} ini sudah terdaftar.`,
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, [field]: "" }));
      }
    } catch (error) {
      console.error("Gagal mengecek duplikasi", error);
    }
  };

  const validateLocalFields = (name: string, value: string) => {
    if (name === "password") {
      if (value.length > 0 && value.length < 6) {
        setFieldErrors((prev) => ({
          ...prev,
          password: "Kata sandi minimal 6 karakter.",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, password: "" }));
      }
    }
    if (name === "confirmPassword") {
      if (value.length > 0 && value !== formData.password) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Kata sandi tidak cocok.",
        }));
      } else {
        setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
      }
    }
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "noWA" || name === "nim" || name === "tahunLulus") {
      newValue = value.replace(/\D/g, "");
    }

    setFormData({ ...formData, [name]: newValue });

    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (e: any) => {
    const { name, value } = e.target;
    if (name === "email" || name === "noWA" || name === "nim") {
      checkDuplicate(name as any, value);
    } else {
      validateLocalFields(name, value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      fieldErrors.email ||
      fieldErrors.noWA ||
      fieldErrors.nim ||
      fieldErrors.password ||
      fieldErrors.confirmPassword
    ) {
      return setModal({
        isOpen: true,
        type: "warning",
        title: "Periksa Kembali Formulir",
        message:
          "Terdapat kolom yang masih berwarna merah. Silakan perbaiki sebelum mengirim pendaftaran.",
      });
    }

    if (formData.password !== formData.confirmPassword) {
      setFieldErrors((prev) => ({
        ...prev,
        confirmPassword: "Kata sandi tidak cocok.",
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. VERIFIKASI RECAPTCHA DIPINDAH KE ATAS UNTUK MENCEGAH BOT MEMBACA DB
      if (!executeRecaptcha) {
        setIsSubmitting(false);
        return setModal({
          isOpen: true,
          type: "warning",
          title: "Sistem Keamanan",
          message:
            "Sistem keamanan reCAPTCHA belum siap. Silakan refresh halaman dan coba lagi.",
        });
      }

      const token = await executeRecaptcha("member_registration");

      // 🔥 FIX RECAPTCHA: WAJIB KIRIM EMAIL KE BACKEND 🔥
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: formData.email }),
      });

      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        setIsSubmitting(false);
        return setModal({
          isOpen: true,
          type: "error",
          title: "Aktivitas Mencurigakan",
          message:
            "Sistem mendeteksi aktivitas tidak wajar (Spam/Bot). Pendaftaran ditolak.",
        });
      }

      // 2. CEK DUPLIKASI DATA (HANYA DIEKSEKUSI JIKA BUKAN BOT)
      const pendaftarRef = collection(db, "pendaftar");
      const [cekEmail, cekWA, cekNIM] = await Promise.all([
        getDocs(query(pendaftarRef, where("email", "==", formData.email))),
        getDocs(query(pendaftarRef, where("noWA", "==", formData.noWA))),
        getDocs(query(pendaftarRef, where("nim", "==", formData.nim))),
      ]);

      if (!cekEmail.empty || !cekWA.empty || !cekNIM.empty) {
        setIsSubmitting(false);
        return setModal({
          isOpen: true,
          type: "error",
          title: "Data Sudah Digunakan",
          message:
            "Email, WhatsApp, atau NIM Anda baru saja didaftarkan oleh sesi lain. Silakan periksa kembali.",
        });
      }

      // 3. PEMBUATAN AKUN AUTHENTICATION
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const userUid = userCredential.user.uid;

      // 4. PENYIMPANAN DATA KE FIRESTORE
      const { password, confirmPassword, ...dataToSave } = formData;

      await setDoc(doc(db, "pendaftar", userUid), {
        ...dataToSave,
        status: "Dalam Proses",
        tanggalDaftar: new Date().toISOString(),
      });

      // 5. TRIGGER EMAIL PENDAFTARAN
      sendEmailAction({
          type: "member_pending",
          email: formData.email,
          nama: formData.namaLengkap,
        }).catch((err) => console.error("Background Email Error:", err));

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: any) {
      console.error("Error submitting form: ", error);

      if (error.code === "auth/email-already-in-use") {
        setFieldErrors((prev) => ({
          ...prev,
          email: "Email ini sudah didaftarkan sebelumnya.",
        }));
      } else {
        setModal({
          isOpen: true,
          type: "error",
          title: "Gagal Mengirim Data",
          message:
            "Terjadi kesalahan pada server. Pastikan koneksi stabil dan coba beberapa saat lagi.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorMessage = ({ msg }: { msg: string }) => {
    if (!msg) return null;
    return (
      <p className="text-[11px] text-[#D93025] font-semibold mt-1.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        {msg}
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-400 selection:text-blue-950 flex flex-col relative">
      <NavbarPublic />

      <main className="flex-grow pt-36 md:pt-44 lg:pt-48 pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          {isSuccess ? (
            <div className="max-w-2xl mx-auto bg-white rounded-[2rem] p-10 md:p-16 text-center shadow-xl border border-slate-100 animate-in zoom-in-95 duration-500 mt-10">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                <svg
                  className="w-12 h-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-blue-950 mb-4 tracking-tight">
                Pendaftaran Berhasil!
              </h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Terima kasih,{" "}
                <strong className="text-blue-900">
                  {formData.namaLengkap}
                </strong>
                . Akun Anda telah dibuat dan data Anda masuk ke sistem kami
                dengan status{" "}
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-bold text-xs uppercase tracking-wider">
                  Dalam Proses
                </span>
                . Tim verifikator DPW IKA UII DIY akan segera mengecek
                kesesuaian data Anda.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/login"
                  className="inline-block bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg hover:-translate-y-1 text-sm"
                >
                  Coba Akses Portal
                </Link>
                <Link
                  href="/"
                  className="inline-block bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-8 rounded-full border border-slate-200 transition-all shadow-sm hover:-translate-y-1 text-sm"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
              {/* BAGIAN KIRI */}
              <div className="lg:col-span-5 lg:sticky lg:top-40 space-y-8">
                <div>
                  <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 font-extrabold px-4 py-1.5 rounded-full text-[10px] md:text-xs mb-6 uppercase tracking-widest border border-yellow-200">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    Portal Keanggotaan
                  </div>
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-blue-950 leading-[1.1] mb-6 tracking-tight">
                    Sinergi Nyata, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-yellow-600">
                      Mengabdi untuk Negeri
                    </span>
                  </h1>
                  <p className="text-slate-600 text-base md:text-lg leading-relaxed font-medium text-justify">
                    Mari satukan langkah dan perkuat tali silaturahmi. Dengan
                    bergabung bersama DPW IKA UII DIY, Anda menjadi bagian dari
                    jaringan intelektual muslim yang berkontribusi aktif bagi
                    pembangunan daerah, almamater, dan kemajuan bangsa.
                  </p>
                </div>

                <div className="space-y-5 pt-6 border-t border-slate-200 hidden lg:block">
                  <h3 className="font-bold text-blue-950 uppercase tracking-widest text-xs">
                    Benefit Keanggotaan:
                  </h3>
                  <ul className="space-y-4">
                    {[
                      "Jejaring profesional lintas generasi & fakultas.",
                      "Akses eksklusif program mentoring & pengembangan karir.",
                      "Informasi terpadu kegiatan sosial dan kajian keislaman.",
                      "Fasilitas direktori bisnis sesama alumni UII.",
                    ].map((benefit, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-slate-700 text-sm font-medium"
                      >
                        <svg
                          className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* BAGIAN KANAN: FORM PENDAFTARAN */}
              <div className="lg:col-span-7">
                <div className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-slate-100">
                  <div className="mb-8">
                    <h3 className="text-2xl font-extrabold text-blue-950 mb-2">
                      Formulir Registrasi
                    </h3>
                    <p className="text-slate-500 text-sm">
                      Harap isi data di bawah ini sesuai dengan identitas
                      kelulusan Universitas Islam Indonesia.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* 1. Data Pribadi & Autentikasi */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                        1. Data Diri & Akses Akun
                      </h4>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                          Nama Lengkap (Beserta Gelar)
                        </label>
                        <input
                          type="text"
                          name="namaLengkap"
                          value={formData.namaLengkap}
                          onChange={handleChange}
                          required
                          placeholder="Contoh: Prof. K.H. Abdul Kahar Mudzakkir"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Alamat Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            placeholder="nama@gmail.com"
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm text-slate-800 ${fieldErrors.email ? "border-[#D93025] focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                          />
                          <ErrorMessage msg={fieldErrors.email} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Nomor WhatsApp Aktif
                          </label>
                          <input
                            type="tel"
                            name="noWA"
                            value={formData.noWA}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            pattern="[0-9]*"
                            minLength={10}
                            maxLength={15}
                            placeholder="08123456789"
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm text-slate-800 ${fieldErrors.noWA ? "border-[#D93025] focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                          />
                          <ErrorMessage msg={fieldErrors.noWA} />
                        </div>
                      </div>

                      {/* FIELD KATA SANDI */}
                      <div className="grid sm:grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
                        <div className="sm:col-span-2">
                          <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                            Keamanan Akun
                          </p>
                          <p className="text-[10px] text-blue-600 mb-3">
                            Buat kata sandi untuk mengakses Portal Anggota dan
                            E-KTA nantinya.
                          </p>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Kata Sandi
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              required
                              minLength={6}
                              placeholder="Min. 6 Karakter"
                              className={`w-full pl-4 pr-12 py-3 bg-white border rounded-xl outline-none transition-all text-sm text-slate-800 tracking-widest ${fieldErrors.password ? "border-[#D93025] focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                            >
                              {showPassword ? (
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
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a9.97 9.97 0 013.03-1.562M21.543 12c-1.274-4.057-5.064-7-9.542-7M21 21l-3.29-3.29"
                                  />
                                </svg>
                              ) : (
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          <ErrorMessage msg={fieldErrors.password} />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Konfirmasi Kata Sandi
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              required
                              minLength={6}
                              placeholder="Ulangi Kata Sandi"
                              className={`w-full pl-4 pr-12 py-3 bg-white border rounded-xl outline-none transition-all text-sm text-slate-800 tracking-widest ${fieldErrors.confirmPassword ? "border-[#D93025] focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                            />
                            <button
                              type="button"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors"
                            >
                              {showConfirmPassword ? (
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
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a9.97 9.97 0 013.03-1.562M21.543 12c-1.274-4.057-5.064-7-9.542-7M21 21l-3.29-3.29"
                                  />
                                </svg>
                              ) : (
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                          <ErrorMessage msg={fieldErrors.confirmPassword} />
                        </div>
                      </div>

                      {/* 🔥 UPDATE: DROPDOWN DPD & ALAMAT LENGKAP 🔥 */}
                      <div className="grid sm:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Kabupaten/Kota Domisili Saat Ini
                          </label>
                          <select
                            name="domisili"
                            value={formData.domisili}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800 cursor-pointer"
                          >
                            <option value="" disabled>
                              -- Pilih Kabupaten/Kota --
                            </option>
                            <option value="Sleman">Kabupaten Sleman</option>
                            <option value="Bantul">Kabupaten Bantul</option>
                            <option value="Gunungkidul">
                              Kabupaten Gunungkidul
                            </option>
                            <option value="Kulon Progo">
                              Kabupaten Kulon Progo
                            </option>
                            <option value="Kota Yogyakarta">
                              Kota Yogyakarta
                            </option>
                            <option value="Luar DIY">
                              Luar DIY (Nasional/Internasional)
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Alamat Lengkap Saat Ini
                          </label>
                          <textarea
                            name="alamatLengkap"
                            value={formData.alamatLengkap}
                            onChange={handleChange}
                            required
                            placeholder="Contoh: Jl. Kaliurang KM 14.5, Ngemplak..."
                            rows={1}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 2. Data Akademik UII */}
                    <div className="space-y-4 pt-4">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                        2. Riwayat Akademik UII
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Nomor Mahasiswa (NIM)
                          </label>
                          <input
                            type="text"
                            name="nim"
                            value={formData.nim}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            pattern="[0-9]*"
                            minLength={8}
                            maxLength={15}
                            placeholder="Contoh: 13525022"
                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all text-sm text-slate-800 ${fieldErrors.nim ? "border-[#D93025] focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}`}
                          />
                          <ErrorMessage msg={fieldErrors.nim} />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Angkatan
                          </label>
                          <input
                            type="tel"
                            name="tahunLulus"
                            value={formData.tahunLulus}
                            onChange={handleChange}
                            required
                            pattern="[0-9]{4}"
                            maxLength={4}
                            placeholder="Contoh: 2013"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Fakultas
                          </label>
                          <select
                            name="fakultas"
                            value={formData.fakultas}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800 cursor-pointer"
                          >
                            <option value="" disabled>
                              -- Pilih Fakultas --
                            </option>
                            <option value="Fakultas Hukum">
                              Fakultas Hukum
                            </option>
                            <option value="Fakultas Bisnis & Ekonomi">
                              Fakultas Bisnis & Ekonomi
                            </option>
                            <option value="Fakultas Ilmu Agama Islam">
                              Fakultas Ilmu Agama Islam
                            </option>
                            <option value="Fakultas Kedokteran">
                              Fakultas Kedokteran
                            </option>
                            <option value="Fakultas MIPA">Fakultas MIPA</option>
                            <option value="Fakultas Psikologi & Ilmu Sosial Budaya">
                              Fakultas Psikologi & Ilmu Sosial Budaya
                            </option>
                            <option value="Fakultas Teknik Sipil & Perencanaan">
                              Fakultas Teknik Sipil & Perencanaan
                            </option>
                            <option value="Fakultas Teknologi Industri">
                              Fakultas Teknologi Industri
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Program Studi
                          </label>
                          <input
                            type="text"
                            name="programStudi"
                            value={formData.programStudi}
                            onChange={handleChange}
                            required
                            placeholder="Contoh: Teknik Mesin"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                          />
                        </div>
                      </div>
                    </div>

                    {/* 3. Pekerjaan */}
                    <div className="space-y-4 pt-4">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                        3. Pekerjaan / Profesi
                      </h4>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                          Profesi / Instansi Saat Ini
                        </label>
                        <input
                          type="text"
                          name="pekerjaan"
                          value={formData.pekerjaan}
                          onChange={handleChange}
                          required
                          placeholder="Contoh: Dosen di UII / Pengusaha / ASN"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                        />
                      </div>
                    </div>

                    {/* 4. Kompetensi & Motivasi */}
                    <div className="space-y-4 pt-4">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                        4. Kompetensi & Harapan
                      </h4>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                          Bidang Keahlian / Spesialisasi
                        </label>
                        <input
                          type="text"
                          name="keahlian"
                          value={formData.keahlian}
                          onChange={handleChange}
                          required
                          placeholder="Contoh: IT Developer, Hukum Pidana, Digital Marketing"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                          Motivasi / Motto Bergabung
                        </label>
                        <textarea
                          name="motto"
                          value={formData.motto}
                          onChange={handleChange}
                          required
                          placeholder="Tuliskan motivasi, harapan, atau motto Anda..."
                          rows={3}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800 resize-none"
                        />
                      </div>
                    </div>

                    <div className="pt-6">
                      <div className="text-[10px] text-slate-400 text-center mb-4 leading-relaxed px-4">
                        Formulir ini dilindungi oleh reCAPTCHA dan tunduk pada{" "}
                        <a
                          href="https://policies.google.com/privacy"
                          className="text-blue-500 hover:underline"
                        >
                          Kebijakan Privasi
                        </a>{" "}
                        serta{" "}
                        <a
                          href="https://policies.google.com/terms"
                          className="text-blue-500 hover:underline"
                        >
                          Persyaratan Layanan
                        </a>{" "}
                        Google.
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-950 hover:bg-blue-900 text-white font-black py-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5 text-white"
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
                            Memproses Pendaftaran...
                          </>
                        ) : (
                          "Kirim Pendaftaran"
                        )}
                      </button>
                      <p className="text-center text-[10px] text-slate-400 mt-4">
                        Dengan menekan tombol di atas, Anda menyatakan bahwa
                        data yang dimasukkan adalah benar dan dapat
                        dipertanggungjawabkan.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <FooterPublic />

      {/* --- CUSTOM POPUP MODAL --- */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div
              className={`p-6 text-center ${modal.type === "error" ? "bg-red-50" : "bg-amber-50"}`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm ${modal.type === "error" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
              >
                {modal.type === "error" ? (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-8 h-8"
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
                )}
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {modal.title}
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {modal.message}
              </p>
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3 rounded-xl transition-colors shadow-md"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
