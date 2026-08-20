"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export default function OfflineRunCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [participant, setParticipant] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 State Tahan Layar
  const [isRedirecting, setIsRedirecting] = useState(false);

  // State Pembayaran & Upload
  const [isPaying, setIsPaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 🔥 STATE KHUSUS UI KARTU PEMBAYARAN MIDTRANS
  const [selectedBank, setSelectedBank] = useState("qris");

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({ isOpen: false, type: "info", title: "", message: "" });

  // Pilihan Bank/E-Wallet untuk UI Midtrans
  const midtransOptions = [
    { id: "qris", name: "QRIS", label: "Scan Instan", icon: "qr" },
    { id: "mandiri", name: "MANDIRI", label: "Virtual Account", icon: "bank" },
    { id: "bni", name: "BNI", label: "Virtual Account", icon: "bank" },
    { id: "bca", name: "BCA", label: "Virtual Account", icon: "bank" },
    { id: "bri", name: "BRI", label: "Virtual Account", icon: "bank" },
    {
      id: "ewallet",
      name: "E-WALLET",
      label: "GoPay / ShopeePay",
      icon: "wallet",
    },
  ];

  // =================================================================
  // FETCH DATA & REDIRECT LUNAS
  // =================================================================
  useEffect(() => {
    const fetchDataAndSettings = async () => {
      if (!id) return;

      let isLunas = false;

      try {
        const pRef = doc(db, "offline_participants", id);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists()) {
          const data = pSnap.data();

          if (data.statusPembayaran === "Lunas") {
            isLunas = true;
            setIsRedirecting(true);
            router.push(`/run/tiket/${id}`);
            return;
          }

          setParticipant({ id: pSnap.id, ...data });
        } else {
          setModal({
            isOpen: true,
            type: "error",
            title: "Data Tidak Ditemukan",
            message: "ID Pendaftaran tidak valid.",
          });
          setIsLoading(false);
          return;
        }

        const sRef = doc(db, "settings", "virtual_run");
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          const sData = sSnap.data();
          setSettings(sData);

          if (
            sData.metodePembayaran === "midtrans" &&
            sData.midtransClientKey
          ) {
            const isSandbox = sData.midtransClientKey.startsWith("SB-");
            const snapScriptUrl = isSandbox
              ? "https://app.sandbox.midtrans.com/snap/snap.js"
              : "https://app.midtrans.com/snap/snap.js";

            const script = document.createElement("script");
            script.src = snapScriptUrl;
            script.setAttribute("data-client-key", sData.midtransClientKey);
            script.async = true;
            document.body.appendChild(script);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (!isLunas) {
          setIsLoading(false);
        }
      }
    };

    fetchDataAndSettings();

    return () => {
      const existingScript = document.querySelector('script[src*="snap.js"]');
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, [id, router]);

  const handleCopyRekening = () => {
    if (settings?.manualRekening) {
      navigator.clipboard.writeText(settings.manualRekening);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

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

      await updateDoc(doc(db, "offline_participants", participant.id), {
        buktiBayarUrl: data.secure_url,
        statusPembayaran: "Pending",
      });

      setParticipant((prev: any) => ({
        ...prev,
        buktiBayarUrl: data.secure_url,
        statusPembayaran: "Pending",
      }));

      setModal({
        isOpen: true,
        type: "success",
        title: "Berhasil!",
        message: "Bukti terkirim, tunggu verifikasi admin.",
      });
    } catch {
      setModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Gagal mengunggah bukti bayar.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePayMidtrans = async () => {
    setIsPaying(true);
    try {
      const res = await fetch("/api/midtrans/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: participant.id,
          nama: participant.namaLengkap,
          email: participant.email,
          noWA: participant.noWA,
          type: "offline",
        }),
      });

      const data = await res.json();

      if (data.token) {
        (window as any).snap.pay(data.token, {
          onSuccess: function () {
            setIsRedirecting(true);
            router.push(`/run/tiket/${participant.id}`);
          },
          onPending: function () {
            setModal({
              isOpen: true,
              type: "warning",
              title: "Tertunda",
              message: "Silakan selesaikan pembayaran di aplikasi terkait.",
            });
          },
          onError: function () {
            setModal({
              isOpen: true,
              type: "error",
              title: "Gagal",
              message: "Terjadi masalah pada transaksi.",
            });
          },
        });
      }
    } catch {
      setModal({
        isOpen: true,
        type: "error",
        title: "Sistem Sibuk",
        message: "Gagal menghubungi server pembayaran.",
      });
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1A73E8] rounded-full animate-spin"></div>
      </div>
    );
  }

  const isMenungguVerifikasi =
    participant?.statusPembayaran === "Pending" && participant?.buktiBayarUrl;
  const activePaymentMethod = settings?.metodePembayaran || "manual";

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col relative selection:bg-[#1A73E8] selection:text-white">
      <NavbarPublic />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] md:pt-[160px] pb-20 w-full relative z-10">
        <div className="animate-in fade-in duration-700">
          <div className="text-center mb-8 md:mb-12">
            <span className="text-[10px] font-black text-[#1A73E8] bg-blue-50 border border-blue-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">
              Langkah Terakhir
            </span>
            <h1 className="text-3xl md:text-4xl font-black text-[#0B2239] mb-2 tracking-tight">
              Selesaikan Pembayaran
            </h1>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-start">
            {/* =================================================
                KOLOM KIRI: ORDER SUMMARY (RINGKASAN PESANAN)
            ================================================= */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-200">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                    Order Summary
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <h4 className="font-black text-lg text-[#0B2239] uppercase tracking-tight mb-4">
                      {settings?.namaEvent || "IKA UII DIY RUN"}
                    </h4>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Nama Peserta</span>
                    <span className="font-bold text-slate-800">
                      {participant.namaLengkap}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Kategori</span>
                    <span className="font-bold text-[#1A73E8]">
                      {participant.jarak}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-dashed border-slate-200 pb-4">
                    <span className="text-slate-500">Harga Paket</span>
                    <span className="font-bold text-slate-800">
                      Rp{" "}
                      {(
                        participant.hargaAsli || participant.totalTagihan
                      )?.toLocaleString("id-ID")}
                    </span>
                  </div>

                  {participant.kodePromoDipakai && (
                    <div className="flex justify-between items-center text-sm text-emerald-600 font-medium">
                      <span>Promo ({participant.kodePromoDipakai})</span>
                      <span>
                        - Rp {participant.totalDiskon?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Subtotal</span>
                    <span className="font-black text-lg text-[#1A73E8]">
                      Rp {participant.totalTagihan?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================
                KOLOM KANAN: PAYMENT METHOD (INSTRUKSI BAYAR)
            ================================================= */}
            <div className="lg:col-span-7">
              {isMenungguVerifikasi ? (
                <div className="bg-white rounded-[24px] p-8 border border-amber-200 text-center shadow-sm">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 animate-pulse"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-[#0B2239] mb-2">
                    Menunggu Verifikasi Admin
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mb-6">
                    Bukti pembayaran manual Anda telah berhasil diunggah dan
                    sedang dalam proses pengecekan.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-200">
                  <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
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
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest">
                      Payment Method
                    </h3>
                  </div>

                  <div className="p-6 sm:p-8">
                    {/* --- TAMPILAN JIKA ADMIN PILIH MANUAL --- */}
                    {activePaymentMethod === "manual" && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center flex flex-col items-center">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                            Transfer Ke Rekening
                          </p>
                          <p className="text-3xl font-black text-[#0B2239] mb-1">
                            {settings?.manualBank || "BANK"}
                          </p>
                          <div className="flex items-center gap-3 mt-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
                            <p className="font-mono text-xl font-bold text-[#1A73E8]">
                              {settings?.manualRekening || "-"}
                            </p>
                            <button
                              onClick={handleCopyRekening}
                              className="text-xs font-bold text-slate-400 hover:text-[#1A73E8] bg-slate-100 px-2 py-1 rounded transition-colors"
                            >
                              {isCopied ? "Disalin!" : "Copy"}
                            </button>
                          </div>
                          <p className="text-xs font-bold text-slate-400 mt-4 uppercase">
                            a.n. {settings?.manualNama || "IKA UII DIY"}
                          </p>
                        </div>
                        <form
                          onSubmit={handleUploadSubmit}
                          className="space-y-4"
                        >
                          <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-4 text-center h-32 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50 transition-colors">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                className="absolute inset-0 w-full h-full object-cover opacity-80 rounded-xl"
                              />
                            ) : (
                              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                                Pilih Foto Bukti Transfer
                              </p>
                            )}
                          </div>
                          <button
                            type="submit"
                            disabled={isUploading || !selectedFile}
                            className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-black py-4 rounded-xl disabled:opacity-50 transition-colors shadow-md"
                          >
                            {isUploading
                              ? "Mengunggah..."
                              : "Konfirmasi & Kirim Bukti"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* --- 🔥 TAMPILAN JIKA ADMIN PILIH MIDTRANS (RADIO BUTTON CARDS) 🔥 --- */}
                    {activePaymentMethod === "midtrans" && (
                      <div className="space-y-6">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                          Pilih Metode Pembayaran
                        </p>

                        {/* Grid Kartu Bank/E-Wallet */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                          {midtransOptions.map((opt) => (
                            <div
                              key={opt.id}
                              onClick={() => setSelectedBank(opt.id)}
                              className={`relative cursor-pointer border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                                selectedBank === opt.id
                                  ? "border-[#1A73E8] bg-[#F4F8FF] text-[#1A73E8] shadow-sm transform scale-[1.02]"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:bg-slate-50"
                              }`}
                            >
                              {/* Ikon Checklist Pojok Kanan Atas */}
                              {selectedBank === opt.id && (
                                <div className="absolute top-2 right-2 bg-[#1A73E8] text-white rounded-full p-0.5 shadow-sm">
                                  <svg
                                    className="w-3 h-3"
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
                              )}

                              {/* Icon SVG Generic Sederhana */}
                              <div
                                className={
                                  selectedBank === opt.id
                                    ? "text-[#1A73E8]"
                                    : "text-slate-400"
                                }
                              >
                                {opt.icon === "qr" && (
                                  <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                    />
                                  </svg>
                                )}
                                {opt.icon === "bank" && (
                                  <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3"
                                    />
                                  </svg>
                                )}
                                {opt.icon === "wallet" && (
                                  <svg
                                    className="w-8 h-8"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={1.5}
                                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                                    />
                                  </svg>
                                )}
                              </div>

                              <div className="text-center">
                                <p className="font-black text-xs uppercase tracking-wide">
                                  {opt.name}
                                </p>
                                <p className="text-[9px] font-medium opacity-70 mt-0.5 uppercase tracking-widest">
                                  {opt.label}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Note Biaya Layanan */}
                        <p className="text-[11px] text-slate-500 font-medium flex justify-between items-center">
                          <span>Biaya Layanan Midtrans</span>
                          <span>Dihitung otomatis</span>
                        </p>

                        {/* Kotak Grand Total Hijau */}
                        <div className="bg-[#E6F4EA] border border-[#CEEAD6] rounded-2xl p-5 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-[#1E8E3E] uppercase tracking-widest mb-1">
                              Grand Total
                            </p>
                            <p className="text-2xl font-black text-[#1E8E3E]">
                              Rp{" "}
                              {participant.totalTagihan?.toLocaleString(
                                "id-ID",
                              )}
                            </p>
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#1E8E3E] shadow-sm">
                            <svg
                              className="w-6 h-6"
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
                        </div>

                        {/* Tombol Bayar Biru */}
                        <button
                          onClick={handlePayMidtrans}
                          disabled={isPaying}
                          className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white text-base font-black py-4 rounded-xl shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                        >
                          {isPaying
                            ? "Menghubungkan ke Gateway..."
                            : "Proceed to Payment"}
                          {!isPaying && (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <FooterPublic />

      {/* POPUP MODAL UMUM */}
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
