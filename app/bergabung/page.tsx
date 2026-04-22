"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import Link from "next/link";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

// 🔥 1. IMPORT HOOK RECAPTCHA
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

export default function BergabungPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 🔥 2. PANGGIL HOOK
  const { executeRecaptcha } = useGoogleReCaptcha();

  // State untuk Custom Popup Modal
  const [modal, setModal] = useState({
    isOpen: false,
    type: "warning", // 'warning' | 'error'
    title: "",
    message: "",
  });

  // State Form Pendaftaran
  const [formData, setFormData] = useState({
    namaLengkap: "",
    nim: "",
    tahunLulus: "",
    fakultas: "",
    programStudi: "",
    noWA: "",
    email: "",
    domisili: "",
    pekerjaan: "",
    keahlian: "",
    motto: "",
  });

  const handleChange = (e: any) => {
    if (
      e.target.name === "noWA" ||
      e.target.name === "nim" ||
      e.target.name === "tahunLulus"
    ) {
      const numericValue = e.target.value.replace(/\D/g, "");
      setFormData({ ...formData, [e.target.name]: numericValue });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- VALIDASI DENGAN POPUP PROFESIONAL ---
    if (formData.noWA.length < 10 || formData.noWA.length > 15) {
      setModal({
        isOpen: true,
        type: "warning",
        title: "Nomor WhatsApp Tidak Valid",
        message:
          "Pastikan panjang nomor WhatsApp antara 10 hingga 15 digit angka.",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setModal({
        isOpen: true,
        type: "warning",
        title: "Format Email Salah",
        message:
          "Silakan masukkan alamat email dengan format yang benar (contoh: nama@gmail.com).",
      });
      return;
    }

    if (formData.nim.length < 8) {
      setModal({
        isOpen: true,
        type: "warning",
        title: "NIM Tidak Lengkap",
        message:
          "NIM tidak valid. Pastikan Anda memasukkan Nomor Induk Mahasiswa yang benar.",
      });
      return;
    }
    // --------------------------------

    setIsSubmitting(true);

    try {
      // 🔥 3. PROSES VALIDASI ANTI-BOT RECAPTCHA 🔥
      if (!executeRecaptcha) {
        setModal({
          isOpen: true,
          type: "warning",
          title: "Sistem Keamanan Belum Siap",
          message:
            "Komponen keamanan belum termuat sempurna. Silakan refresh halaman dan coba lagi.",
        });
        setIsSubmitting(false);
        return;
      }

      // Minta token ke Google
      const token = await executeRecaptcha("member_registration");

      // Lempar token ke API verifikasi kita
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        setModal({
          isOpen: true,
          type: "error",
          title: "Aktivitas Mencurigakan",
          message:
            "Sistem mendeteksi aktivitas tidak wajar (Spam/Bot). Pendaftaran ditolak.",
        });
        setIsSubmitting(false);
        return;
      }
      // ==========================================

      // 4. JIKA LOLOS RECAPTCHA, BARU SIMPAN KE FIREBASE
      await addDoc(collection(db, "pendaftar"), {
        ...formData,
        status: "Dalam Proses",
        tanggalDaftar: new Date().toISOString(),
      });

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error submitting form: ", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Gagal Mengirim Data",
        message:
          "Terjadi kesalahan pada server atau izin ditolak. Pastikan koneksi stabil dan coba beberapa saat lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-400 selection:text-blue-950 flex flex-col relative">
      <NavbarPublic />

      <main className="flex-grow pt-36 md:pt-44 lg:pt-48 pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* PESAN SUKSES FULL PAGE */}
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
                . Data Anda telah masuk ke sistem kami dan saat ini berstatus{" "}
                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md font-bold text-xs uppercase tracking-wider">
                  Dalam Proses
                </span>
                . Tim verifikator DPW IKA UII DIY akan segera mengecek
                kesesuaian data Anda.
              </p>
              <Link
                href="/"
                className="inline-block bg-blue-950 hover:bg-blue-900 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
              >
                Kembali ke Beranda
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-start">
              {/* BAGIAN KIRI: MOTTO & INFORMASI */}
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
                    {/* 1. Data Pribadi */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider pb-2 border-b border-slate-100">
                        1. Data Pribadi
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
                            Nomor WhatsApp Aktif
                          </label>
                          <input
                            type="tel"
                            name="noWA"
                            value={formData.noWA}
                            onChange={handleChange}
                            required
                            pattern="[0-9]*"
                            minLength={10}
                            maxLength={15}
                            placeholder="08123456789"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Alamat Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="nama@gmail.com"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                          Domisili Saat Ini (Kota/Kabupaten)
                        </label>
                        <input
                          type="text"
                          name="domisili"
                          value={formData.domisili}
                          onChange={handleChange}
                          required
                          placeholder="Contoh: Kabupaten Sleman"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                        />
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
                            required
                            pattern="[0-9]*"
                            minLength={8}
                            maxLength={15}
                            placeholder="Contoh: 13525022"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm text-slate-800"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                            Tahun Lulus
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
                            <option value="Fakultas Ekonomi & Bisnis">
                              Fakultas Ekonomi & Bisnis
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
                      {/* Lencana reCAPTCHA */}
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
                            Memverifikasi Keamanan & Mengirim...
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
            {/* Header Popup (Warna beda berdasarkan Tipe) */}
            <div
              className={`p-6 text-center ${modal.type === "error" ? "bg-red-50" : "bg-amber-50"}`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm ${modal.type === "error" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}`}
              >
                {modal.type === "error" ? (
                  // Ikon Silang (Error)
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
                  // Ikon Seru (Warning)
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

            {/* Body Popup */}
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
