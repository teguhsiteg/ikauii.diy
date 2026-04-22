"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

interface DivisiInfo {
  id: string;
  nama: string;
  kuota: number;
}

export default function CrewRegistrationPage() {
  const [divisiList, setDivisiList] = useState<DivisiInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    whatsapp: "",
    tipe: "alumni", // alumni | mahasiswa | umum
    fakultas: "",
    angkatan: "",
    divisi: "",
  });

  useEffect(() => {
    const fetchDivisi = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "crew_config"));
        if (snap.exists() && snap.data().divisiList) {
          setDivisiList(snap.data().divisiList);
        }
      } catch (error) {
        console.error("Gagal memuat divisi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDivisi();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Standar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert("⚠️ Format email tidak valid.");
      return;
    }

    const waRegex = /^(\+62|62|0)8[1-9][0-9]{6,12}$/;
    if (!waRegex.test(formData.whatsapp)) {
      alert("⚠️ Format WhatsApp tidak valid. Masukkan awalan 08 atau 628.");
      return;
    }

    // 🔥 VALIDASI KHUSUS ALUMNI & MAHASISWA
    if (formData.tipe === "alumni" || formData.tipe === "mahasiswa") {
      if (!formData.fakultas.trim()) {
        alert("⚠️ Silakan isi asal Fakultas / Jurusan Anda.");
        return;
      }
      // Validasi Angkatan wajib 4 digit angka
      const angkatanRegex = /^\d{4}$/;
      if (!angkatanRegex.test(formData.angkatan.toString())) {
        alert(
          "⚠️ Format Angkatan tidak valid. Harus berupa 4 digit angka (Contoh: 2018).",
        );
        return;
      }
    }

    if (!formData.divisi) {
      alert("⚠️ Silakan pilih divisi / formasi yang ingin dilamar.");
      return;
    }

    setIsSubmitting(true);

    try {
      // PROSES VALIDASI ANTI-BOT RECAPTCHA
      if (!executeRecaptcha) {
        alert("Sistem keamanan belum siap. Silakan refresh halaman.");
        setIsSubmitting(false);
        return;
      }

      const token = await executeRecaptcha("crew_registration");
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        alert(
          "⚠️ Deteksi aktivitas mencurigakan (Spam/Bot). Pendaftaran ditolak.",
        );
        setIsSubmitting(false);
        return;
      }

      // JIKA LOLOS RECAPTCHA, SIMPAN KE FIREBASE
      await addDoc(collection(db, "crew_volunteers"), {
        ...formData,
        // Kosongkan fakultas & angkatan kalau dia "Umum"
        fakultas: formData.tipe === "umum" ? "-" : formData.fakultas,
        angkatan: formData.tipe === "umum" ? "-" : formData.angkatan,
        status: "pending",
        waktuDaftar: Date.now(),
      });

      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1A73E8] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-[#e6f4ea] text-[#137333] rounded-full flex items-center justify-center text-4xl mb-6 mx-auto shadow-sm">
            ✓
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4">
            Pendaftaran Berhasil!
          </h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Terima kasih{" "}
            <span className="font-bold text-slate-800">{formData.nama}</span>{" "}
            telah bersedia menjadi bagian dari Crew IKA UII DIY. Data Anda
            sedang kami tinjau. Jika terpilih, kami akan mengirimkan undangan
            grup WhatsApp melalui Email.
          </p>
          <Link
            href="/"
            className="inline-block bg-[#1A73E8] hover:bg-[#1557b0] text-white font-bold px-8 py-3.5 rounded-xl transition-colors shadow-md"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      <div className="bg-[#1A73E8] pt-10 pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-3xl mx-auto relative z-10 text-center">
          <Link
            href="/"
            className="text-blue-200 hover:text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 mb-6 transition-colors w-fit mx-auto"
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
            Kembali ke Beranda
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">
            Open Recruitment Crew
          </h1>
          <p className="text-blue-100 text-sm max-w-xl mx-auto leading-relaxed">
            Mari sukseskan acara lari terbesar kita! Daftarkan diri Anda sebagai
            crew dan pilih divisi yang paling sesuai dengan keahlian Anda.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-xl shadow-slate-200/50 border border-slate-200">
          {divisiList.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">🚧</div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                Pendaftaran Belum Dibuka
              </h3>
              <p className="text-slate-500">
                Panitia belum menentukan kebutuhan formasi divisi. Silakan
                kembali lagi nanti.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* BAGIAN 1: IDENTITAS */}
              <div>
                <h3 className="text-sm font-bold text-[#1A73E8] mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">
                  1. Identitas Diri
                </h3>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleChange}
                      required
                      placeholder="Sesuai KTP / KTM"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A73E8] focus:bg-white outline-none text-sm transition-all text-slate-800 font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Email Aktif
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Untuk pengiriman hasil"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A73E8] focus:bg-white outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        No. WhatsApp
                      </label>
                      <input
                        type="text"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        required
                        placeholder="0812..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A73E8] focus:bg-white outline-none text-sm transition-all text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-2">
                      Tipe Pendaftar
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["alumni", "mahasiswa", "umum"].map((tipe) => (
                        <label
                          key={tipe}
                          className={`cursor-pointer border rounded-xl text-center py-3 transition-all ${formData.tipe === tipe ? "border-[#1A73E8] bg-[#e8f0fe] text-[#1A73E8] ring-1 ring-[#1A73E8] shadow-sm" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                        >
                          <input
                            type="radio"
                            name="tipe"
                            value={tipe}
                            checked={formData.tipe === tipe}
                            onChange={handleChange}
                            className="hidden"
                          />
                          <span className="block text-xs font-bold uppercase tracking-wider">
                            {tipe}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* 🔥 INPUT FAKULTAS & ANGKATAN HANYA MUNCUL JIKA ALUMNI / MAHASISWA 🔥 */}
                  {(formData.tipe === "alumni" ||
                    formData.tipe === "mahasiswa") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Fakultas / Jurusan UII
                        </label>
                        <input
                          type="text"
                          name="fakultas"
                          value={formData.fakultas}
                          onChange={handleChange}
                          required
                          placeholder="Cth: FTI / Informatika"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A73E8] focus:bg-white outline-none text-sm transition-all text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Tahun Angkatan
                        </label>
                        <input
                          type="number"
                          name="angkatan"
                          value={formData.angkatan}
                          onChange={handleChange}
                          required
                          min="1950"
                          max={new Date().getFullYear()}
                          placeholder="Cth: 2020"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#1A73E8] focus:bg-white outline-none text-sm transition-all text-slate-800 font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* BAGIAN 2: PILIHAN DIVISI */}
              <div>
                <h3 className="text-sm font-bold text-[#1A73E8] mb-4 uppercase tracking-widest border-b border-slate-100 pb-2">
                  2. Pilihan Formasi
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {divisiList.map((div) => (
                    <label
                      key={div.id}
                      className={`cursor-pointer border rounded-xl p-4 transition-all relative overflow-hidden ${formData.divisi === div.id ? "border-[#1A73E8] bg-[#e8f0fe] ring-1 ring-[#1A73E8] shadow-sm" : "border-slate-200 hover:bg-slate-50"}`}
                    >
                      <input
                        type="radio"
                        name="divisi"
                        value={div.id}
                        checked={formData.divisi === div.id}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {formData.divisi === div.id && (
                        <div className="absolute top-0 right-0 bg-[#1A73E8] text-white p-1 rounded-bl-xl shadow-sm">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                          </svg>
                        </div>
                      )}
                      <h4
                        className={`text-base font-bold mb-1 ${formData.divisi === div.id ? "text-[#1A73E8]" : "text-slate-800"}`}
                      >
                        {div.nama}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                        Kebutuhan: {div.kuota} Personil
                      </p>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 mt-8">
                <p className="text-xs text-amber-800 leading-relaxed font-medium text-center">
                  Dengan mengirimkan formulir ini, saya menyatakan bersedia
                  mengikuti seluruh rangkaian persiapan hingga selesainya acara
                  dengan penuh tanggung jawab.
                </p>
              </div>

              <div className="text-[10px] text-slate-400 text-center">
                Dilindungi oleh reCAPTCHA dan tunduk pada{" "}
                <a
                  href="https://policies.google.com/privacy"
                  className="text-blue-500 hover:underline"
                >
                  Privasi
                </a>{" "}
                serta{" "}
                <a
                  href="https://policies.google.com/terms"
                  className="text-blue-500 hover:underline"
                >
                  Persyaratan
                </a>{" "}
                Google.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white font-black py-4 rounded-xl text-base transition-all shadow-lg shadow-blue-600/20 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Memverifikasi Keamanan & Mengirim...
                  </span>
                ) : (
                  "Daftar Sekarang"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
