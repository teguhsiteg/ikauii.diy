"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export default function CheckoutKomunitasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [groupData, setGroupData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 TAMBAHAN: State khusus agar layar tertahan saat proses redirect ke tiket komunitas
  const [isRedirecting, setIsRedirecting] = useState(false);

  // State Upload Bukti Pembayaran
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({ isOpen: false, type: "info", title: "", message: "" });

  // =================================================================
  // 🔥 FETCH DATA KOMUNITAS & REDIRECT LUNAS
  // =================================================================
  useEffect(() => {
    const fetchDataAndSettings = async () => {
      if (!id) return;

      let isLunas = false; // 🔥 FIX: Buat variabel penanda di luar blok try

      try {
        const pRef = doc(db, "pendaftaran_komunitas", id);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists()) {
          const data = pSnap.data();

          // 🔥 LOMPAT KE HALAMAN TIKET KOMUNITAS JIKA SUDAH LUNAS 🔥
          if (data.statusPembayaran === "Lunas") {
            isLunas = true; // Tandai bahwa ini sudah lunas
            setIsRedirecting(true);
            router.push(`/run/tiket-komunitas/${id}`);
            return;
          }

          setGroupData({ id: pSnap.id, ...data });
        } else {
          setModal({
            isOpen: true,
            type: "error",
            title: "Data Tidak Ditemukan",
            message:
              "ID Pendaftaran Komunitas tidak valid atau tidak ditemukan.",
          });
          setIsLoading(false);
          return;
        }

        const sRef = doc(db, "settings", "virtual_run");
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          setSettings(sSnap.data());
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setModal({
          isOpen: true,
          type: "error",
          title: "Sistem Error",
          message: "Gagal memuat data dari server.",
        });
      } finally {
        // 🔥 FIX: Sekarang kita cek variabel isLunas!
        if (!isLunas) {
          setIsLoading(false);
        }
      }
    };

    fetchDataAndSettings();
  }, [id, router]);

  // =================================================================
  // 🔥 FUNGSI UPLOAD BUKTI BAYAR MANUAL
  // =================================================================
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", "eventrunning");
      formData.append("cloud_name", "dp8hmxuix");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();

      await updateDoc(doc(db, "pendaftaran_komunitas", groupData.id), {
        buktiBayarUrl: data.secure_url,
        statusPembayaran: "Menunggu Verifikasi",
      });

      setGroupData((prev: any) => ({
        ...prev,
        buktiBayarUrl: data.secure_url,
        statusPembayaran: "Menunggu Verifikasi",
      }));

      setModal({
        isOpen: true,
        type: "success",
        title: "Berhasil!",
        message:
          "Bukti pembayaran terkirim. Admin akan segera memverifikasi data tim Anda.",
      });
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Terjadi kesalahan saat mengunggah bukti bayar.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 🔥 TAHAN LAYAR JIKA SEDANG LOADING ATAU REDIRECT 🔥
  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0B2239] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!groupData) return null;

  const isMenungguVerifikasi =
    groupData.statusPembayaran === "Menunggu Verifikasi" ||
    groupData.buktiBayarUrl;

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col relative selection:bg-[#FCD116] selection:text-[#0B2239]">
      <NavbarPublic />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] md:pt-[160px] pb-20 w-full relative z-10">
        <div className="animate-in fade-in duration-700">
          <div className="text-center mb-8">
            <span className="text-[10px] font-black text-[#0B2239] bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">
              Langkah Terakhir Kapten
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-[#0B2239] mb-2 tracking-tight">
              Selesaikan Pembayaran Grup
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
              Lakukan pembayaran kolektif untuk memvalidasi seluruh peserta di
              dalam grup Anda.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* KOLOM KIRI: INVOICE GRUP */}
            <div className="lg:col-span-5 bg-white rounded-3xl overflow-hidden shadow-lg border border-slate-200">
              <div className="bg-[#0B2239] px-6 py-5 border-b-4 border-[#FCD116]">
                <h3 className="font-black text-white text-lg flex items-center gap-2 uppercase tracking-wide">
                  Ringkasan Tagihan Tim
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">
                    Tim / Komunitas
                  </p>
                  <p className="font-black text-[#0B2239] text-base leading-tight">
                    {groupData.kapten?.komunitas}
                  </p>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Kapten (PJ)
                  </span>
                  <span className="text-sm font-black text-slate-700 uppercase">
                    {groupData.kapten?.nama}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    Total Peserta
                  </span>
                  <span className="text-sm font-black text-slate-700 uppercase">
                    {groupData.participants?.length} Orang
                  </span>
                </div>
                <div className="pt-4 mt-2">
                  <div className="bg-[#0B2239] rounded-xl p-4 flex items-center justify-between shadow-md">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      Total Bayar
                    </span>
                    <span className="text-xl font-black text-[#FCD116]">
                      Rp {groupData.totalBiaya?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: INSTRUKSI PEMBAYARAN MANUAL */}
            <div className="lg:col-span-7">
              {isMenungguVerifikasi ? (
                <div className="bg-white rounded-3xl p-8 border border-amber-200 text-center shadow-lg relative overflow-hidden">
                  <h3 className="text-2xl font-black text-[#0B2239] mb-2">
                    Menunggu Verifikasi Admin
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                    Bukti pembayaran transfer kolektif tim Anda sedang dicek
                    oleh Admin. Kami akan menginfokan status lunas melalui
                    WhatsApp Kapten.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200">
                  <h3 className="font-black text-slate-800 text-lg mb-6 border-b border-slate-100 pb-4 uppercase tracking-wide">
                    Transfer Bank Manual
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center">
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Transfer Ke Rekening
                      </p>
                      <p className="text-2xl font-black text-[#0B2239]">
                        {settings?.manualBank?.toUpperCase() || "BSI"}{" "}
                        <span className="font-mono text-[#1A73E8]">
                          {settings?.manualRekening || "123456789"}
                        </span>
                      </p>
                      <p className="text-xs font-bold text-slate-600 mt-1">
                        a.n.{" "}
                        {settings?.manualNama?.toUpperCase() || "IKA UII DIY"}
                      </p>
                    </div>

                    <form onSubmit={handleUploadSubmit} className="space-y-4">
                      <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center h-32 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 transition-colors cursor-pointer overflow-hidden">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Struk"
                            className="absolute inset-0 w-full h-full object-cover opacity-80"
                          />
                        ) : (
                          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                            Klik untuk Pilih Foto Bukti Transfer
                          </p>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isUploading || !selectedFile}
                        className="w-full bg-[#0B2239] hover:bg-blue-900 text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all text-sm uppercase tracking-widest"
                      >
                        {isUploading
                          ? "Mengunggah..."
                          : "Konfirmasi & Kirim Bukti"}
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <FooterPublic />

      {modal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <h3 className="font-bold text-lg mb-2">{modal.title}</h3>
            <p className="text-sm text-slate-600 mb-6">{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="w-full bg-[#0B2239] text-white py-3 rounded-xl font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
