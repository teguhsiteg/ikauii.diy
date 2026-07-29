"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export default function PasangIklanPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    namaSponsor: "",
    emailSponsor: "",
    noWA: "",
    linkTujuan: "",
    fotoUrl: "",
    catatan: "",
  });

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi Ukuran (Maksimal 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setDialog({
        isOpen: true,
        type: "error",
        title: "Ukuran File Terlalu Besar",
        message:
          "Maksimal ukuran file gambar banner adalah 2MB agar website tetap ringan saat diakses.",
      });
      return;
    }

    setUploadProgress("Mengunggah gambar...");
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "bisnis"); // Pastikan preset Cloudinary Anda sesuai
    data.append("cloud_name", "dp8hmxuix");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload`,
        {
          method: "POST",
          body: data,
        },
      );
      const json = await res.json();
      setFormData({ ...formData, fotoUrl: json.secure_url });
      setUploadProgress("Gambar berhasil diunggah!");
      setTimeout(() => setUploadProgress(""), 3000);
    } catch (error) {
      console.error("Gagal upload gambar:", error);
      setUploadProgress("Gagal mengunggah gambar. Coba lagi.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fotoUrl) {
      setDialog({
        isOpen: true,
        type: "error",
        title: "Banner Iklan Kosong",
        message: "Anda wajib mengunggah gambar banner iklan.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simpan ke koleksi pendaftaran iklan sementara
      await addDoc(collection(db, "pendaftaran_iklan"), {
        ...formData,
        status: "Pending", // Admin harus setujui dulu
        createdAt: serverTimestamp(),
      });

      setDialog({
        isOpen: true,
        type: "success",
        title: "Permohonan Iklan Terkirim",
        message:
          "Data Anda telah masuk ke sistem kami. Tim Sekretariat DPW IKA UII DIY akan segera menghubungi Anda melalui WhatsApp atau Email untuk proses verifikasi dan pembayaran.",
      });

      // Reset Form
      setFormData({
        namaSponsor: "",
        emailSponsor: "",
        noWA: "",
        linkTujuan: "",
        fotoUrl: "",
        catatan: "",
      });
      setUploadProgress("");
    } catch (error) {
      console.error("Error submit iklan:", error);
      setDialog({
        isOpen: true,
        type: "error",
        title: "Terjadi Kesalahan",
        message:
          "Gagal mengirimkan permohonan. Silakan coba beberapa saat lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <NavbarPublic />
      <main className="bg-[#F8F9FA] min-h-screen pt-28 pb-20 font-sans text-[#202124]">
        {/* CUSTOM DIALOG */}
        {dialog.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl flex flex-col overflow-hidden border border-[#DADCE0] animate-in zoom-in-95">
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-2">
                  {dialog.type === "success" ? (
                    <svg
                      className="w-6 h-6 text-[#1E8E3E]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-[#D93025]"
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
                  <h2
                    className={`text-lg font-medium ${dialog.type === "error" ? "text-[#D93025]" : "text-[#1E8E3E]"}`}
                  >
                    {dialog.title}
                  </h2>
                </div>
                <p className="text-sm text-[#5F6368] leading-relaxed">
                  {dialog.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex justify-end">
                <button
                  onClick={closeDialog}
                  className={`px-5 py-2 text-sm font-medium text-white rounded transition-colors shadow-sm ${dialog.type === "error" ? "bg-[#D93025] hover:bg-[#b52a1f]" : "bg-[#1E8E3E] hover:bg-[#137333]"}`}
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link
            href="/direktori-bisnis"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#5F6368] hover:text-[#1A73E8] mb-6 transition-colors"
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
                strokeWidth={2.5}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Kembali ke Direktori Bisnis
          </Link>

          <div className="bg-white rounded-2xl shadow-xl border border-[#DADCE0] overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
            {/* Header Form */}
            <div className="bg-gradient-to-r from-[#0B1528] to-[#1A73E8] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="relative z-10">
                <h1 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
                  Pasang Iklan Banner
                </h1>
                <p className="text-blue-100 text-sm leading-relaxed max-w-xl">
                  Jangkau ribuan jaringan alumni dengan mempromosikan produk,
                  jasa, atau instansi Anda di Slider Utama Katalog Bisnis UII
                  DIY.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* 🔥 INFORMASI LAYANAN IKLAN (S&K, BIAYA, FORMAT) 🔥 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {/* Card 1: Format */}
                <div className="bg-[#F8F9FA] border border-[#DADCE0] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-[#1A73E8] mb-2">
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
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <h3 className="font-bold text-sm">Format Banner</h3>
                  </div>
                  <ul className="text-xs text-[#5F6368] space-y-1.5 list-disc pl-4">
                    <li>
                      Rasio ideal <strong>16:9</strong> (Landscape)
                    </li>
                    <li>
                      Resolusi min. <strong>1200 x 675 px</strong>
                    </li>
                    <li>Format JPG / PNG</li>
                    <li>
                      Maksimal ukuran <strong>2 MB</strong>
                    </li>
                  </ul>
                </div>

                {/* Card 2: Biaya */}
                <div className="bg-[#FEF7E0] border border-[#FCE8B2] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-[#B06000] mb-2">
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="font-bold text-sm">Estimasi Biaya</h3>
                  </div>
                  <ul className="text-xs text-[#B06000] space-y-1.5 list-disc pl-4 opacity-90">
                    <li>
                      Mingguan: <strong>Rp 100.000</strong>
                    </li>
                    <li>
                      Bulanan: <strong>Rp 300.000</strong>
                    </li>
                    <li>Biaya bersifat *negotiable*.</li>
                    <li>
                      Dana disalurkan untuk pengembangan web dan KAS DPW IKA UII
                      DIY.
                    </li>
                  </ul>
                </div>

                {/* Card 3: S&K */}
                <div className="bg-[#E6F4EA] border border-[#CEEAD6] rounded-xl p-4">
                  <div className="flex items-center gap-2 text-[#1E8E3E] mb-2">
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
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <h3 className="font-bold text-sm">Syarat Tayang</h3>
                  </div>
                  <ul className="text-xs text-[#1E8E3E] space-y-1.5 list-disc pl-4 opacity-90">
                    <li>Bisnis legal & tidak melanggar hukum.</li>
                    <li>Non SARA & non pornografi.</li>
                    <li>Diutamakan afiliasi Alumni UII.</li>
                    <li>Admin berhak memverifikasi kelayakan.</li>
                  </ul>
                </div>
              </div>

              {/* PEMISAH */}
              <div className="relative flex py-5 items-center mb-5">
                <div className="flex-grow border-t border-[#DADCE0]"></div>
                <span className="shrink-0 mx-4 text-[#9AA0A6] text-xs font-bold uppercase tracking-widest">
                  Formulir Pendaftaran
                </span>
                <div className="flex-grow border-t border-[#DADCE0]"></div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Nama Usaha / Instansi
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.namaSponsor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          namaSponsor: e.target.value,
                        })
                      }
                      placeholder="Contoh: PT. Inovasi Bangsa"
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Email Penanggung Jawab
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.emailSponsor}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailSponsor: e.target.value,
                        })
                      }
                      placeholder="contoh@email.com"
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Nomor WhatsApp Aktif
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.noWA}
                      onChange={(e) =>
                        setFormData({ ...formData, noWA: e.target.value })
                      }
                      placeholder="Contoh: 08123456789"
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm font-mono transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Link URL Tujuan (Saat Diklik)
                    </label>
                    <input
                      required
                      type="url"
                      value={formData.linkTujuan}
                      onChange={(e) =>
                        setFormData({ ...formData, linkTujuan: e.target.value })
                      }
                      placeholder="https://wa.me/... atau Web Usaha"
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                {/* AREA UPLOAD GAMBAR */}
                <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#DADCE0]">
                  <div className="flex justify-between items-start mb-2">
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest">
                      Upload Gambar Banner Iklan
                    </label>
                    <span className="text-[10px] text-[#9AA0A6] font-mono">
                      Max: 2MB
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleImageUpload}
                      className="text-sm file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#E8F0FE] file:text-[#1A73E8] hover:file:bg-[#D2E3FC] cursor-pointer"
                    />
                    {uploadProgress && (
                      <span
                        className={`text-[11px] font-bold animate-pulse ${uploadProgress.includes("Gagal") ? "text-[#D93025]" : "text-[#1A73E8]"}`}
                      >
                        {uploadProgress}
                      </span>
                    )}
                  </div>

                  {formData.fotoUrl && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-[#DADCE0] bg-slate-100 max-w-md shadow-sm">
                      <img
                        src={formData.fotoUrl}
                        alt="Preview Banner"
                        className="w-full h-auto object-contain aspect-video"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Pesan Untuk Admin (Durasi / Catatan Khusus)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.catatan}
                    onChange={(e) =>
                      setFormData({ ...formData, catatan: e.target.value })
                    }
                    placeholder="Contoh: Saya ingin mengambil paket bulanan, mohon info pembayarannya..."
                    className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm resize-none transition-colors"
                  ></textarea>
                </div>

                <div className="pt-4 border-t border-[#DADCE0]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3.5 px-10 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                  >
                    {isSubmitting
                      ? "Mengirim Data..."
                      : "Kirim Pengajuan Iklan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <FooterPublic />
    </>
  );
}
