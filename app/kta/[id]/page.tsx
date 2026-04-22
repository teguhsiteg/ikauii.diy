"use client";

import { useEffect, useState, useRef } from "react";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import html2canvas from "html2canvas";
import Link from "next/link";

export default function KTAPage() {
  const params = useParams();
  const id = params.id as string;

  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // State untuk Popup Preview
  const [ktaImageBase64, setKtaImageBase64] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const ktaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentUrl, setCurrentUrl] = useState("");
  const [scale, setScale] = useState(1);

  // 1. Fetch Data dari Firebase
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }

    const fetchUser = async () => {
      try {
        const docRef = doc(db, "pengurus", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchUser();
  }, [id]);

  // 2. Kalkulasi Skala Responsif (Anti Kepotong)
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        // Kurangi padding agar shadow KTA tidak terpotong
        const containerWidth = containerRef.current.offsetWidth - 32;
        const newScale = Math.min(1, containerWidth / 600);
        setScale(newScale);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [userData]);

  // 3. Helper: Generate Canvas KTA
  const generateCanvas = async () => {
    if (!ktaRef.current) return null;

    // Pastikan DOM sudah update sebelum di-capture
    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(ktaRef.current, {
      scale: 4, // Resolusi Ultra HD
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false, // Mematikan log untuk mencegah error console
    });

    return canvas.toDataURL("image/png", 1.0);
  };

  // 4. Fungsi PREVIEW KTA
  const handlePreview = async () => {
    setIsProcessing(true);
    try {
      const base64Image = await generateCanvas();
      if (base64Image) {
        setKtaImageBase64(base64Image);
        setIsPreviewOpen(true);
      }
    } catch (error) {
      console.error("Gagal preview:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // 5. Fungsi DOWNLOAD & UPDATE DATABASE (DIPERBAIKI)
  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      const currentDate = new Date().toISOString();
      const currentCount = (userData?.printCount || 0) + 1;

      // Update State Lokal dulu supaya langsung ter-render di KTA sebelum di-capture
      setUserData((prev: any) => ({
        ...prev,
        printCount: currentCount,
        lastPrintDate: currentDate,
      }));

      // ==========================================
      // PERBAIKAN: TRY-CATCH KHUSUS UNTUK FIREBASE
      // ==========================================
      // Memisahkan proses update database agar jika rules Firebase memblokir
      // atau koneksi jelek, proses download gambar TIDAK ikut gagal.
      try {
        await updateDoc(doc(db, "pengurus", id), {
          printCount: increment(1),
          lastPrintDate: currentDate,
        });
      } catch (dbError) {
        console.warn(
          "Izin Firebase ditolak atau gagal update counter cetak, namun proses unduh KTA akan dilanjutkan.",
          dbError,
        );
      }
      // ==========================================

      // Generate Image dengan data baru (yang sudah diupdate statenya)
      const base64Image = await generateCanvas();

      if (base64Image) {
        const link = document.createElement("a");
        link.href = base64Image;
        link.download = `E-KTA_IKA_UII_${userData?.nama ? userData.nama.replace(/\s+/g, "_") : "Anggota"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error("Gagal memproses KTA:", error);
      alert("Terjadi kesalahan saat memproses gambar KTA. Silakan coba lagi.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Format NIA
  const getNIA = () => {
    if (!userData) return "";
    if (userData.nia) return userData.nia;
    const year = new Date(userData.createdAt || Date.now()).getFullYear();
    const month = String(
      new Date(userData.createdAt || Date.now()).getMonth() + 1,
    ).padStart(2, "0");
    const unique = userData.id.substring(0, 6).toUpperCase();
    return `${year}.${month}.${unique}`;
  };

  // Format Tanggal Cetak
  const formatPrintDate = (isoString: string) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F9]">
        <div className="animate-spin w-12 h-12 border-4 border-blue-900 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F9] p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-200">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg
              className="w-10 h-10"
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
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            Data Tidak Ditemukan
          </h2>
          <p className="text-slate-500 mb-8 text-sm">
            Dokumen E-KTA dengan ID tersebut tidak terdaftar di sistem IKA UII
            DIY.
          </p>
          <Link
            href="/"
            className="bg-blue-950 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] font-sans flex flex-col">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40 shrink-0 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-10 h-10 object-contain"
            />
            <div className="flex flex-col">
              <h1 className="font-extrabold text-blue-950 text-sm sm:text-base leading-tight tracking-tight">
                Portal Layanan Alumni
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                DPW IKA UII DIY
              </p>
            </div>
          </Link>
          <div className="text-right">
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Status Dokumen
            </p>
            <p className="text-[10px] sm:text-xs font-bold text-green-600 flex items-center gap-1 justify-end">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>{" "}
              Terverifikasi
            </p>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <div className="w-full max-w-[1000px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-2xl overflow-hidden border border-slate-200 w-full">
            <div className="bg-[#1E3A8A] px-5 sm:px-6 py-4 flex items-center gap-3 border-b-4 border-yellow-500">
              <svg
                className="w-5 h-5 text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-white font-bold text-base sm:text-lg tracking-wide">
                Informasi Dokumen E-KTA
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row p-5 sm:p-8 lg:p-10 gap-8 lg:gap-12 items-center w-full">
              {/* SISI KIRI: KARTU E-KTA */}
              <div
                ref={containerRef}
                className="w-full lg:w-3/5 flex justify-center items-center bg-slate-50 p-4 sm:p-8 rounded-2xl border border-slate-100 shadow-inner group relative cursor-pointer"
                onClick={handlePreview}
              >
                {/* WADAH SCALED */}
                <div
                  className="relative transition-transform duration-300 group-hover:scale-[1.03]"
                  style={{
                    width: `${600 * scale}px`,
                    height: `${378 * scale}px`,
                  }}
                >
                  <div className="absolute inset-0 z-50 bg-black/0 group-hover:bg-black/10 flex items-center justify-center transition-colors rounded-[20px]">
                    <div className="bg-white/95 text-blue-900 px-5 py-2.5 rounded-full font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 shadow-xl">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                        />
                      </svg>
                      Klik untuk perbesar
                    </div>
                  </div>

                  {/* ELEMENT KARTU KTA (FIXED 600x378) */}
                  <div
                    ref={ktaRef}
                    className="bg-white absolute top-0 left-0 flex flex-col shadow-[0_15px_40px_-10px_rgba(0,0,0,0.2)] rounded-[20px] overflow-hidden"
                    style={{
                      width: "600px",
                      height: "378px",
                      transform: `scale(${scale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    {/* Header KTA */}
                    <div className="h-[90px] bg-[#0B1120] relative flex items-center px-8 border-b-[5px] border-yellow-500 shrink-0">
                      <div className="w-14 h-14 bg-white rounded-full p-1.5 shadow-lg z-10 shrink-0">
                        <img
                          src="/logo-dpp-ika.png"
                          alt="Logo"
                          className="w-full h-full object-contain"
                          crossOrigin="anonymous"
                        />
                      </div>
                      <div className="ml-5 z-10">
                        <h1 className="text-white font-black text-[22px] tracking-widest uppercase leading-none">
                          Kartu Tanda Anggota
                        </h1>
                        <h2 className="text-yellow-500 font-bold text-[11px] tracking-[0.2em] uppercase mt-1.5">
                          DPW IKA UII Yogyakarta
                        </h2>
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-[35%] bg-blue-900 skew-x-[-25deg] translate-x-16 z-0"></div>
                    </div>

                    {/* Body KTA */}
                    <div className="flex-grow flex items-center px-10 relative bg-white">
                      <img
                        src="/logo-dpp-ika.png"
                        className="absolute inset-0 m-auto w-64 h-64 opacity-[0.03] grayscale pointer-events-none"
                        crossOrigin="anonymous"
                      />
                      <div className="w-[110px] h-[145px] bg-slate-200 rounded-xl border-2 border-slate-200 shadow-md overflow-hidden shrink-0 z-10 flex items-center justify-center">
                        {userData.fotoUrl ? (
                          <img
                            src={userData.fotoUrl}
                            className="w-full h-full object-cover object-top"
                            crossOrigin="anonymous"
                          />
                        ) : (
                          <img
                            src="/logo-dpp-ika.png"
                            className="w-12 h-12 object-contain opacity-30 grayscale"
                            crossOrigin="anonymous"
                          />
                        )}
                      </div>
                      <div className="ml-8 flex-grow space-y-4 z-10">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Nama Lengkap
                          </p>
                          <p className="text-[18px] font-black text-blue-950 uppercase leading-none">
                            {userData.nama}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            NIA (Nomor Induk Anggota)
                          </p>
                          <p className="text-[14px] font-bold text-slate-800 font-mono tracking-wider leading-none">
                            {getNIA()}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                            Jabatan & Bidang
                          </p>
                          <p className="text-[13px] font-bold text-blue-800 uppercase leading-none">
                            {userData.jabatan}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 mt-1 capitalize leading-none">
                            {userData.bidang}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-center ml-4 z-10">
                        <div className="w-[90px] h-[90px] p-1.5 bg-white border-2 border-slate-100 shadow-sm rounded-lg flex items-center justify-center">
                          <QRCode
                            value={currentUrl}
                            size={128}
                            style={{ width: "100%", height: "100%" }}
                            level="M"
                          />
                        </div>
                        <p className="text-[8px] font-black text-slate-400 mt-2.5 tracking-[0.3em] uppercase">
                          Scan ID
                        </p>
                      </div>
                    </div>

                    {/* Footer KTA */}
                    <div className="h-10 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-8 shrink-0 z-10">
                      <div className="flex flex-col justify-center">
                        <p className="text-[8px] font-semibold text-slate-500 italic leading-tight">
                          Identitas resmi kepengurusan & anggota IKA UII DIY.
                        </p>
                        {userData.printCount > 0 && (
                          <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5">
                            Cetak ke-{userData.printCount} :{" "}
                            {formatPrintDate(userData.lastPrintDate)}
                          </p>
                        )}
                      </div>
                      <p className="text-[10px] font-black text-blue-950 uppercase tracking-widest">
                        ikadiy.uii.ac.id
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SISI KANAN: INSTRUKSI & TOMBOL */}
              <div className="w-full lg:w-2/5 flex flex-col justify-center text-center lg:text-left">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 mx-auto lg:mx-0 shadow-inner border border-blue-100">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-blue-950 mb-2 tracking-tight">
                  E-KTA Anda Telah Terbit
                </h3>

                {/* Informasi Riwayat Cetak UI */}
                {userData.printCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 inline-flex items-center justify-center lg:justify-start gap-2 w-fit mx-auto lg:mx-0">
                    <svg
                      className="w-4 h-4 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-xs font-bold text-yellow-800">
                      Telah dicetak {userData.printCount} kali
                    </p>
                  </div>
                )}

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-8">
                  Anda dapat menyimpan Kartu Tanda Anggota (E-KTA) Elektronik ke
                  galeri perangkat Anda dengan menekan tombol{" "}
                  <strong>Unduh E-KTA</strong> di bawah ini. Pastikan untuk
                  tidak membagikan QR Code kepada pihak yang tidak
                  berkepentingan.
                </p>

                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3.5 sm:py-4 px-6 rounded-xl shadow-[0_8px_20px_rgba(30,58,138,0.25)] hover:shadow-[0_12px_25px_rgba(30,58,138,0.4)] transition-all flex justify-center items-center gap-3 disabled:opacity-70 text-sm tracking-wide"
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin w-5 h-5 text-white"
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
                        </svg>{" "}
                        Memproses File HD...
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
                            strokeWidth={2.5}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          />
                        </svg>{" "}
                        Unduh E-KTA (PNG)
                      </>
                    )}
                  </button>
                  <Link
                    href="/"
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold py-3.5 px-6 rounded-xl shadow-sm transition-all text-center text-sm"
                  >
                    Kembali ke Beranda
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
              &copy; {new Date().getFullYear()} DPW IKA UII DIY.
            </p>
          </div>
        </div>
      </main>

      {/* POPUP MODAL PREVIEW KTA */}
      {isPreviewOpen && ktaImageBase64 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl flex flex-col items-center">
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -top-14 right-0 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all"
            >
              <svg
                className="w-6 h-6"
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
            </button>
            <img
              src={ktaImageBase64}
              alt="E-KTA Preview"
              className="w-full h-auto rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-white/20"
            />
            <p className="text-white/70 text-xs mt-6 font-medium tracking-wide">
              Tekan lama (Long-press) pada gambar untuk menyimpan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
