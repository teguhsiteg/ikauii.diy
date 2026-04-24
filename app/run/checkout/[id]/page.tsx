"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";

export default function OfflineRunCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [participant, setParticipant] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Pembayaran & Upload
  const [isPaying, setIsPaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State E-Ticket & Responsiveness
  const ticketRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({ isOpen: false, type: "info", title: "", message: "" });

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  // =================================================================
  // 🔥 1. FETCH DATA & LOAD MIDTRANS SCRIPT (DINAMIS DARI ADMIN)
  // =================================================================
  useEffect(() => {
    const fetchDataAndSettings = async () => {
      if (!id) return;
      try {
        // Ambil Data Peserta
        const pRef = doc(db, "offline_participants", id);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists()) {
          setParticipant({ id: pSnap.id, ...pSnap.data() });
        } else {
          setModal({
            isOpen: true,
            type: "error",
            title: "Data Tidak Ditemukan",
            message: "ID Pendaftaran tidak valid atau tidak ditemukan.",
          });
          setIsLoading(false);
          return;
        }

        // Ambil Settings (DIPERBAIKI KE offline_run)
        const sRef = doc(db, "settings", "offline_run");
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          const sData = sSnap.data();
          setSettings(sData);

          // Cek apakah Admin mengaktifkan metode Midtrans dan Client Key ada
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
        setModal({
          isOpen: true,
          type: "error",
          title: "Sistem Error",
          message: "Gagal memuat data dari server.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndSettings();

    // Cleanup script midtrans jika user pindah halaman
    return () => {
      const existingScript = document.querySelector('script[src*="snap.js"]');
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, [id]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth - 32;
        const newScale = Math.min(1, containerWidth / 600);
        setScale(newScale);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [participant?.statusPembayaran, isLoading]);

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Ticket-Offline-${participant.namaLengkap.replace(/\s+/g, "-")}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      setModal({
        isOpen: true,
        type: "error",
        title: "Gagal Mengunduh",
        message: "Terjadi kesalahan saat memproses gambar tiket.",
      });
    } finally {
      setIsDownloading(false);
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
        { method: "POST", body: formData },
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

      // Trigger Email Admin Notif
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "admin_notif_payment",
          email: "ika.diy@uii.ac.id",
          nama: participant.namaLengkap,
          detail: { type: "Offline Run" },
        }),
      }).catch((err) => console.error(err));
    } catch (error) {
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

  // =================================================================
  // 🔥 2. FUNGSI PEMANGGIL POPUP MIDTRANS SNAP
  // =================================================================
  const handlePayMidtrans = async () => {
    setIsPaying(true);
    try {
      // Panggil API Backend pembuat Token Midtrans
      const res = await fetch("/api/midtrans/get-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: participant.id,
          nama: participant.namaLengkap,
          email: participant.email,
          noWA: participant.noWA,
          totalTagihan: participant.totalTagihan,
          type: "offline",
        }),
      });

      const data = await res.json();

      if (data.token) {
        // Tampilkan Popup Midtrans (Snap)
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            window.location.reload();
          },
          onPending: function (result: any) {
            setModal({
              isOpen: true,
              type: "warning",
              title: "Pembayaran Tertunda",
              message: "Silakan selesaikan instruksi pembayaran yang muncul.",
            });
          },
          onError: function (result: any) {
            setModal({
              isOpen: true,
              type: "error",
              title: "Pembayaran Gagal",
              message: "Terjadi masalah pada transaksi. Silakan coba lagi.",
            });
          },
          onClose: function () {
            //
          },
        });
      } else {
        throw new Error(data.error || "Token Midtrans tidak ditemukan.");
      }
    } catch (error: any) {
      console.error(error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Sistem Sibuk",
        message: error.message || "Gagal menghubungi server pembayaran.",
      });
    } finally {
      setIsPaying(false);
    }
  };

  // --- TAMPILAN LOADING ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const isLunas = participant?.statusPembayaran === "Lunas";
  const isMenungguVerifikasi =
    participant?.statusPembayaran === "Pending" && participant?.buktiBayarUrl;

  return (
    <div className="min-h-screen bg-emerald-50/30 font-sans flex flex-col relative">
      <NavbarPublic />

      <main className="flex-grow max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 pt-[240px] md:pt-[260px] pb-20 w-full relative z-10">
        {isLunas ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <svg
                  className="w-10 h-10"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                Pendaftaran Selesai!
              </h1>
              <p className="text-slate-500 font-medium max-w-lg mx-auto">
                Status kamu sudah <strong>LUNAS</strong>. Berikut adalah
                E-Ticket kamu untuk pengambilan Race Pack.
              </p>
            </div>

            {/* AREA E-TICKET (Desain Awal Kamu) */}
            <div
              ref={containerRef}
              className="w-full flex justify-center items-center bg-white p-6 sm:p-10 rounded-[2rem] shadow-2xl border border-slate-100 mb-8 cursor-pointer group"
              onClick={handleDownloadTicket}
            >
              <div
                className="relative transition-transform duration-300 group-hover:scale-[1.01]"
                style={{
                  width: `${600 * scale}px`,
                  height: `${380 * scale}px`,
                }}
              >
                <div className="absolute inset-0 z-50 bg-black/0 group-hover:bg-black/5 flex items-center justify-center rounded-2xl transition-colors">
                  <div className="bg-white/95 text-emerald-900 px-5 py-2.5 rounded-full font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-xl flex items-center gap-2">
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Klik Unduh E-Ticket
                  </div>
                </div>

                <div
                  ref={ticketRef}
                  className="absolute top-0 left-0 flex flex-col overflow-hidden"
                  style={{
                    width: "600px",
                    height: "380px",
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                  }}
                >
                  <div
                    className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
                    style={{ opacity: 0.05 }}
                  >
                    <img
                      src="/tugu-jogja.png"
                      alt="Tugu"
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>

                  {/* Header E-Ticket */}
                  <div
                    className="h-[90px] relative flex items-center px-8 shrink-0"
                    style={{
                      backgroundColor: "#064e3b",
                      borderBottom: "5px solid #facc15",
                    }}
                  >
                    <div
                      className="absolute right-0 top-0 bottom-0 w-[40%] skew-x-[-25deg] translate-x-16 z-0"
                      style={{ backgroundColor: "#065f46" }}
                    ></div>
                    <img
                      src="/logo-dpp-ika.png"
                      alt="Logo"
                      className="w-14 h-14 object-contain rounded-full p-1 z-10"
                      style={{ backgroundColor: "#ffffff" }}
                      crossOrigin="anonymous"
                    />
                    <div className="ml-5 z-10">
                      <h1
                        className="font-black text-[22px] uppercase"
                        style={{ color: "#ffffff", margin: 0, lineHeight: 1.2 }}
                      >
                        E-Ticket Race Pack
                      </h1>
                      <h2
                        className="font-bold text-[11px] tracking-widest uppercase"
                        style={{
                          color: "#facc15",
                          margin: 0,
                          marginTop: "2px",
                        }}
                      >
                        Offline Run IKA UII DIY 2026
                      </h2>
                    </div>
                  </div>

                  {/* Body E-Ticket */}
                  <div
                    className="flex-grow flex px-8 py-5 relative z-10"
                    style={{ backgroundColor: "rgba(255, 255, 255, 0.95)" }}
                  >
                    <div
                      className="flex-grow flex flex-col justify-between pr-6"
                      style={{ borderRight: "2px dashed #e2e8f0" }}
                    >
                      <div style={{ width: "100%" }}>
                        <p
                          className="text-[10px] font-bold uppercase tracking-widest mb-1"
                          style={{ color: "#94a3b8", margin: 0 }}
                        >
                          Nama Peserta
                        </p>
                        <p
                          className="text-2xl font-black uppercase leading-tight mt-1"
                          style={{
                            color: "#0f172a",
                            margin: 0,
                            wordWrap: "break-word",
                            maxWidth: "340px",
                          }}
                        >
                          {participant.namaLengkap}
                        </p>
                        <p
                          className="text-xs font-bold uppercase mt-1"
                          style={{ color: "#64748b", margin: 0 }}
                        >
                          Nama BIB:{" "}
                          <span style={{ color: "#1e293b" }}>
                            {participant.namaBib || "-"}
                          </span>
                        </p>
                      </div>

                      <div
                        className="grid grid-cols-3 gap-2 pt-3"
                        style={{
                          borderTop: "1px solid #f1f5f9",
                          marginTop: "12px",
                        }}
                      >
                        <div>
                          <p
                            className="text-[9px] font-bold uppercase"
                            style={{
                              color: "#94a3b8",
                              margin: 0,
                              marginBottom: "2px",
                            }}
                          >
                            Kategori
                          </p>
                          <p
                            className="text-sm font-black uppercase"
                            style={{ color: "#047857", margin: 0 }}
                          >
                            {participant.jarak}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-[9px] font-bold uppercase"
                            style={{
                              color: "#94a3b8",
                              margin: 0,
                              marginBottom: "2px",
                            }}
                          >
                            Ukuran Jersey
                          </p>
                          <p
                            className="text-sm font-black uppercase"
                            style={{ color: "#1e293b", margin: 0 }}
                          >
                            {participant.ukuranJersey}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-[9px] font-bold uppercase"
                            style={{
                              color: "#94a3b8",
                              margin: 0,
                              marginBottom: "2px",
                            }}
                          >
                            Gol. Darah
                          </p>
                          <p
                            className="text-sm font-black uppercase"
                            style={{ color: "#e11d48", margin: 0 }}
                          >
                            {participant.golonganDarah}
                          </p>
                        </div>
                      </div>

                      <div
                        className="grid grid-cols-2 gap-2 pt-3"
                        style={{
                          borderTop: "1px dashed #e2e8f0",
                          marginTop: "8px",
                        }}
                      >
                        <div>
                          <p
                            className="text-[9px] font-bold uppercase"
                            style={{
                              color: "#94a3b8",
                              margin: 0,
                              marginBottom: "2px",
                            }}
                          >
                            Nomor Identitas (NIK)
                          </p>
                          <p
                            className="text-[11px] font-black tracking-widest"
                            style={{ color: "#1e293b", margin: 0 }}
                          >
                            {participant.nik || "-"}
                          </p>
                        </div>
                        <div>
                          <p
                            className="text-[9px] font-bold uppercase"
                            style={{
                              color: "#94a3b8",
                              margin: 0,
                              marginBottom: "2px",
                            }}
                          >
                            Kontak Darurat
                          </p>
                          <p
                            className="text-[11px] font-black"
                            style={{ color: "#1e293b", margin: 0 }}
                          >
                            {participant.namaDarurat || "-"} <br />
                            <span
                              style={{ color: "#64748b", fontWeight: "normal" }}
                            >
                              ({participant.waDarurat || "-"})
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-center justify-center pl-6 w-44 py-1">
                      <div
                        className="flex flex-col items-center"
                        style={{ width: "100%", marginBottom: "16px" }}
                      >
                        <p
                          className="font-bold uppercase tracking-widest"
                          style={{
                            fontSize: "11px",
                            color: "#059669",
                            margin: 0,
                            marginBottom: "2px",
                            textAlign: "center",
                          }}
                        >
                          NOMOR BIB
                        </p>
                        <p
                          className="font-black"
                          style={{
                            fontSize: "42px",
                            color: "#047857",
                            margin: 0,
                            lineHeight: "1",
                            textAlign: "center",
                            letterSpacing: "1px",
                          }}
                        >
                          {participant.nomorBIB || "0000"}
                        </p>
                      </div>

                      <div className="flex flex-col items-center mt-auto">
                        <div
                          className="rounded-xl flex items-center justify-center"
                          style={{
                            backgroundColor: "#ffffff",
                            border: "2px solid #f1f5f9",
                            padding: "8px",
                          }}
                        >
                          <QRCodeSVG
                            value={`${baseUrl}/verify-ticket/${participant.id}`}
                            size={80}
                            level="M"
                          />
                        </div>
                        <p
                          className="font-black uppercase text-center tracking-tighter mt-2"
                          style={{
                            fontSize: "8px",
                            color: "#94a3b8",
                            margin: 0,
                          }}
                        >
                          Scan Saat Pengambilan
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="h-10 flex items-center justify-between px-8 z-10 shrink-0"
                    style={{
                      backgroundColor: "#f8fafc",
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <p
                      className="text-[9px] font-semibold italic"
                      style={{ color: "#64748b", margin: 0 }}
                    >
                      Tiket sah. Simpan dan jangan bagikan QR Code Anda.
                    </p>
                    <p
                      className="text-[10px] font-black uppercase tracking-widest"
                      style={{ color: "#065f46", margin: 0 }}
                    >
                      ikadiy.uii.ac.id
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleDownloadTicket}
                disabled={isDownloading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-10 rounded-full transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isDownloading ? (
                  <>
                    <svg
                      className="w-5 h-5 animate-spin"
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
                    Memproses...
                  </>
                ) : (
                  <>
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Unduh Tiket (PNG)
                  </>
                )}
              </button>
              <Link
                href="/run"
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-4 px-10 rounded-full transition-all text-center flex items-center justify-center gap-2"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================= */
          /* TAMPILAN CHECKOUT (FORM PEMBAYARAN)       */
          /* ========================================= */
          <>
            <div className="text-center mb-10 animate-in fade-in duration-700">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block shadow-sm">
                Langkah Terakhir
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                Selesaikan Pembayaran
              </h1>
              <p className="text-slate-500 font-medium">
                Selesaikan pembayaran Anda agar slot lari tidak hangus.
              </p>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* KOLOM KIRI: INVOICE */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
                <h3 className="font-black text-slate-800 text-xl mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Ringkasan Pesanan
                </h3>
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">
                      Kategori Event
                    </p>
                    <p className="font-black text-emerald-950 text-lg leading-tight">
                      Offline Run IKA UII DIY
                    </p>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Nama
                    </span>
                    <span className="text-sm font-black text-slate-700 uppercase">
                      {participant.namaLengkap}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Nama BIB
                    </span>
                    <span className="text-sm font-black text-slate-700 uppercase">
                      {participant.namaBib || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Nomor BIB
                    </span>
                    <span className="text-sm font-black text-emerald-600 uppercase">
                      {participant.nomorBIB || "Menunggu Lunas"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase">
                      Status
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md uppercase tracking-tighter">
                      {participant.statusPembayaran}
                    </span>
                  </div>
                  <div className="pt-4">
                    <div className="bg-slate-800 rounded-2xl p-5 flex items-center justify-between shadow-md">
                      <span className="text-xs font-bold text-slate-300 uppercase">
                        Total
                      </span>
                      <span className="text-2xl font-black text-yellow-400">
                        Rp {participant.totalTagihan?.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN: INSTRUKSI / PEMBAYARAN */}
              <div className="lg:col-span-7">
                {isMenungguVerifikasi ? (
                  <div className="bg-amber-50 rounded-3xl p-8 border border-amber-200 text-center">
                    <div className="w-20 h-20 bg-white text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-amber-100">
                      <svg
                        className="w-10 h-10 animate-pulse"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-black text-amber-900 mb-2">
                      Menunggu Verifikasi
                    </h3>
                    <p className="text-sm text-amber-700 font-medium mb-6">
                      Bukti sudah kami terima. Admin sedang mencocokkan mutasi
                      rekening. Silakan cek halaman ini secara berkala.
                    </p>
                    <button
                      onClick={() =>
                        window.open(
                          `https://wa.me/?text=Halo Admin, konfirmasi pembayaran Offline Run: ${participant.namaLengkap} (ID: ${participant.id.substring(0, 8).toUpperCase()})`,
                          "_blank",
                        )
                      }
                      className="bg-white border border-amber-300 text-amber-700 font-bold py-2.5 px-6 rounded-xl hover:bg-amber-100 text-sm"
                    >
                      Chat Admin Sekarang
                    </button>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200">
                    <h3 className="font-black text-slate-800 text-xl mb-6 border-b border-slate-100 pb-4 flex items-center gap-2">
                      <svg
                        className="w-6 h-6 text-slate-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Instruksi Pembayaran
                    </h3>

                    {/* JIKA ADMIN MEMILIH MANUAL (UPLOAD STRUK) */}
                    {settings?.metodePembayaran === "manual" && (
                      <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-center">
                          <p className="text-xl font-black text-blue-900">
                            {settings.manualBank?.toUpperCase() || "-"}
                          </p>
                          <p className="text-3xl font-mono font-black text-slate-800">
                            {settings.manualRekening || "-"}
                          </p>
                          <p className="text-sm font-bold text-slate-600">
                            a.n. {settings.manualNama?.toUpperCase() || "-"}
                          </p>
                        </div>
                        <form
                          onSubmit={handleUploadSubmit}
                          className="space-y-4"
                        >
                          <div className="relative border-2 border-dashed rounded-2xl p-2 text-center h-48 flex items-center justify-center bg-slate-50 overflow-hidden hover:bg-slate-100 transition-colors">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt="Struk"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
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
                                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                </svg>
                                Unggah Foto Struk
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
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50"
                          >
                            {isUploading
                              ? "Mengirim..."
                              : "Konfirmasi Pembayaran"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* JIKA ADMIN MEMILIH MIDTRANS (QRIS, GOPAY, VA) */}
                    {settings?.metodePembayaran === "midtrans" && (
                      <div className="text-center space-y-6">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                          <div className="flex justify-center gap-4 mb-4 text-slate-400">
                            <svg
                              className="w-8 h-8"
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
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                              />
                            </svg>
                            <svg
                              className="w-8 h-8"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                              />
                            </svg>
                          </div>
                          <p className="text-base font-black text-slate-800 mb-2">
                            Pembayaran Otomatis via Midtrans
                          </p>
                          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                            Mendukung QRIS, Gopay, ShopeePay, Virtual Account
                            (BCA, Mandiri, BRI, dll), dan Indomaret.
                          </p>
                        </div>

                        <button
                          onClick={handlePayMidtrans}
                          disabled={isPaying}
                          className="w-full bg-[#152B5B] hover:bg-[#0D1B3E] text-white text-lg font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                          {isPaying ? (
                            <>
                              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              Menghubungkan...
                            </>
                          ) : (
                            "Bayar Sekarang ➔"
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      <FooterPublic />

      {/* POPUP MODAL UMUM */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div
              className={`p-8 text-center ${modal.type === "error" ? "bg-rose-50" : modal.type === "warning" ? "bg-amber-50" : "bg-emerald-50"}`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm ${modal.type === "error" ? "bg-rose-100 text-rose-600" : modal.type === "warning" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}
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
                ) : modal.type === "warning" ? (
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                {modal.title}
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {modal.message}
              </p>
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md"
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
