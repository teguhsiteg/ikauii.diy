"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import RunNavbar from "@/components/run/RunNavbar";
import RunFooter from "@/components/run/RunFooter";

export default function KomunitasExternalPage() {
  const router = useRouter();

  // Form State yang lebih profesional
  const [formData, setFormData] = useState({
    namaKomunitas: "",
    kategori: "",
    estimasiPeserta: "",
    namaKapten: "",
    noWa: "",
    email: "",
    asalKota: "",
    instagram: "",
    catatan: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "pendaftaran_komunitas_eksternal"), {
        ...formData,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
    } catch (error) {
      console.error("Error submitting:", error);
      alert("Terjadi kesalahan sistem. Silakan coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans text-slate-900 selection:bg-[#FCD116] selection:text-[#0B2239] flex flex-col">
      <RunNavbar eventName="Komunitas" solid={true} />

      <main className="flex-1 flex flex-col items-center justify-center pt-28 pb-24 px-4 sm:px-6">
        <div className="w-full max-w-2xl">
          <Link
            href="/run"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0B2239] transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
            Kembali ke Beranda
          </Link>

          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#0B2239] mb-4 uppercase">
              Registrasi Partner
            </h1>
            <p className="text-sm md:text-base text-slate-500 font-medium max-w-lg mx-auto">
              Daftarkan perusahaan, instansi, atau komunitas Anda untuk mendapatkan 
              penawaran dan akses pendaftaran kolektif.
            </p>
          </div>

          {isSuccess ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-14 shadow-sm text-center animate-in zoom-in-95 duration-500 ease-out">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#0B2239] mb-4 uppercase">
                Registrasi Berhasil!
              </h2>
              <p className="text-slate-500 mb-10 text-sm md:text-base font-medium max-w-md mx-auto">
                Terima kasih, pengajuan untuk <strong className="text-[#0B2239]">{formData.namaKomunitas}</strong> telah kami terima. Tim Kemitraan Sembada Run akan segera menghubungi PIC terkait melalui WhatsApp atau Email.
              </p>
              <button
                onClick={() => router.push("/run")}
                className="inline-flex items-center justify-center px-8 py-3.5 bg-[#0B2239] hover:bg-slate-800 text-[#FCD116] font-bold rounded-xl transition-colors shadow-sm"
              >
                Kembali ke Beranda
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out space-y-8"
            >
              {/* --- SECTION 1: PROFIL KOMUNITAS --- */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0B2239] uppercase tracking-widest border-b border-slate-200 pb-3">
                  Profil Organisasi
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 px-1">
                    Nama Komunitas / Perusahaan / Instansi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaKomunitas"
                    required
                    value={formData.namaKomunitas}
                    onChange={handleInputChange}
                    placeholder="Contoh: Sembada Runners / PT Maju Jaya"
                    className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 px-1">
                      Kategori Organisasi <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="kategori"
                      required
                      value={formData.kategori}
                      onChange={handleInputChange}
                      className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all appearance-none"
                    >
                      <option value="" disabled>Pilih kategori...</option>
                      <option value="Running Club">Running Club</option>
                      <option value="Perusahaan/BUMN">Perusahaan / BUMN</option>
                      <option value="Kampus/Sekolah">Kampus / Sekolah</option>
                      <option value="Komunitas Umum">Komunitas Umum</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 px-1">
                      Estimasi Jumlah Peserta <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="estimasiPeserta"
                      required
                      value={formData.estimasiPeserta}
                      onChange={handleInputChange}
                      className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 outline-none transition-all appearance-none"
                    >
                      <option value="" disabled>Pilih estimasi...</option>
                      <option value="< 20 orang">Kurang dari 20 orang</option>
                      <option value="20 - 50 orang">20 - 50 orang</option>
                      <option value="50 - 100 orang">50 - 100 orang</option>
                      <option value="> 100 orang">Lebih dari 100 orang</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 px-1">
                    Asal Kota / Kabupaten <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="asalKota"
                    required
                    value={formData.asalKota}
                    onChange={handleInputChange}
                    placeholder="Contoh: Kabupaten Sleman"
                    className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>
              </div>

              {/* --- SECTION 2: DATA PIC --- */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0B2239] uppercase tracking-widest border-b border-slate-200 pb-3">
                  Kontak Person (PIC)
                </h3>
                
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 px-1">
                    Nama Lengkap PIC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="namaKapten"
                    required
                    value={formData.namaKapten}
                    onChange={handleInputChange}
                    placeholder="Nama lengkap penanggung jawab"
                    className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 px-1">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="noWa"
                      required
                      value={formData.noWa}
                      onChange={handleInputChange}
                      placeholder="081234567890"
                      className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700 px-1">
                      Alamat Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="pic@domain.com"
                      className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* --- SECTION 3: TAMBAHAN --- */}
              <div className="space-y-5">
                <h3 className="text-sm font-bold text-[#0B2239] uppercase tracking-widest border-b border-slate-200 pb-3">
                  Informasi Tambahan
                </h3>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 px-1">
                    Akun Instagram (Opsional)
                  </label>
                  <input
                    type="text"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    placeholder="@namakomunitas"
                    className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700 px-1">
                    Pesan / Catatan Tambahan (Opsional)
                  </label>
                  <textarea
                    name="catatan"
                    value={formData.catatan}
                    onChange={handleInputChange}
                    placeholder="Tuliskan jika ada kebutuhan khusus atau pertanyaan..."
                    rows={3}
                    className="w-full bg-white/50 border border-slate-200 focus:border-black focus:ring-1 focus:ring-black rounded-xl px-4 py-3.5 text-slate-900 placeholder-slate-400 outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative w-full flex items-center justify-center gap-2 bg-[#0B2239] hover:bg-slate-800 disabled:bg-slate-300 text-[#FCD116] font-bold py-4 px-8 rounded-xl transition-all shadow-sm"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-[#FCD116]/30 border-t-[#FCD116] rounded-full animate-spin" />
                      Memproses Data...
                    </span>
                  ) : (
                    <>
                      Ajukan Pendaftaran
                      <ChevronRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <RunFooter />
    </div>
  );
}
