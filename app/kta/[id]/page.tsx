"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import Link from "next/link";

// ==============================================
// 🔥 KOMPONEN SMART LOADER (PERSENTASE) 🔥
// ==============================================
const SmartLoader = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;
        const diff =
          oldProgress < 50
            ? Math.random() * 15
            : oldProgress < 80
              ? Math.random() * 5
              : oldProgress < 99
                ? Math.random() * 1
                : 0;
        const nextProgress = oldProgress + diff;
        return nextProgress > 99 ? 99 : nextProgress;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen fixed inset-0 z-[9999] bg-[#0B2239] flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B2239] via-transparent to-[#0B2239]"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-xs animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-white rounded-full p-4 mb-8 shadow-[0_0_30px_rgba(252,209,22,0.3)] animate-pulse border-2 border-[#FCD116]">
          <img
            src="/logo-dpp-ika.png"
            alt="IKA UII Loading"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-[#FCD116] font-black tracking-widest uppercase mb-1 text-sm">
          Menyiapkan Sistem
        </h2>
        <p className="text-slate-400 text-xs mb-6 font-medium tracking-wide">
          Memuat data aman terenkripsi...
        </p>

        <div className="w-full bg-[#1e3656] rounded-full h-3 mb-3 p-0.5 border border-white/10 shadow-inner overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#F29900] to-[#FCD116] h-full rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${Math.floor(progress)}%` }}
          >
            <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-[shimmer_1.5s_infinite]"></div>
          </div>
        </div>

        <div className="flex justify-between w-full text-[10px] font-bold text-slate-300">
          <span>0%</span>
          <span className="text-[#FCD116] text-lg">
            {Math.floor(progress)}%
          </span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

// ==============================================
// 🔥 KOMPONEN WATERMARK PENGAMAN KARTU 🔥
// ==============================================
const SecurityWatermark = () => (
  <div className="absolute inset-0 z-20 overflow-hidden pointer-events-none opacity-[0.035] flex flex-wrap items-center justify-center p-2">
    {Array.from({ length: 40 }).map((_, i) => (
      <span
        key={i}
        className="text-[14px] font-mono font-bold text-slate-950 mx-2 my-2"
        style={{ transform: "rotate(-30deg)" }}
      >
        IKA UII DIY VALID KTA
      </span>
    ))}
  </div>
);

export default function KTAPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [userData, setUserData] = useState<any>(null);
  const [periodeData, setPeriodeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [isProcessingPNG, setIsProcessingPNG] = useState(false);
  const [isProcessingPDF, setIsProcessingPDF] = useState(false);

  const [isOwner, setIsOwner] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(undefined);

  const exportContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentUrl, setCurrentUrl] = useState("");
  const [scale, setScale] = useState(1);
  const [userKoleksi, setUserKoleksi] = useState("");

  // 1. CEK AUTH STATE
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
      else setCurrentUser(null);
    });
    return () => unsubscribe();
  }, []);

  // 2. FETCH DATA & CEK OWNER
  useEffect(() => {
    if (typeof window !== "undefined") setCurrentUrl(window.location.href);

    const fetchData = async () => {
      try {
        let docRef = doc(db, "pengurus", id);
        let docSnap = await getDoc(docRef);
        let koleksiFound = "pengurus";

        if (!docSnap.exists()) {
          docRef = doc(db, "pendaftar", id);
          docSnap = await getDoc(docRef);
          koleksiFound = "pendaftar";
        }

        if (docSnap.exists()) {
          const uData: any = { id: docSnap.id, ...docSnap.data() };
          setUserData(uData);
          setUserKoleksi(koleksiFound);

          if (currentUser) {
            const isUidMatch = currentUser.uid === id;
            const isEmailMatch =
              uData.email &&
              currentUser.email &&
              uData.email.toLowerCase() === currentUser.email.toLowerCase();

            if (isUidMatch || isEmailMatch) {
              setIsOwner(true);
            } else {
              setIsOwner(false);
            }
          }

          if (uData.periodeId) {
            const pRef = doc(db, "periode", uData.periodeId);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) setPeriodeData(pSnap.data());
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && currentUser !== undefined) fetchData();
  }, [id, currentUser]);

  // 3. LOGIKA RESPONSIVE SCALE
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const isDesktop = window.innerWidth >= 1024;
        const baseWidth = isDesktop ? 840 : 400;
        const newScale = Math.min(1, containerWidth / baseWidth);
        setScale(newScale * 0.95);
      }
    };
    setTimeout(handleResize, 150);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [userData]);

  const getTanggalDaftar = () => {
    if (!userData || !userData.createdAt) return "-";
    return new Date(userData.createdAt).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getNIA = () => {
    if (!userData) return "";
    if (userData.nia) return userData.nia;
    return "MENUNGGU PENOMORAN";
  };

  const getSingkatanFakultas = (fakultas: string) => {
    if (!fakultas) return "-";
    const lower = fakultas.toLowerCase();
    if (lower.includes("teknologi industri")) return "FTI";
    if (lower.includes("matematika")) return "FMIPA";
    if (lower.includes("hukum")) return "FH";
    if (lower.includes("ekonomi")) return "FE/FBE";
    if (lower.includes("kedokteran")) return "FK";
    if (lower.includes("psikologi")) return "FPSB";
    if (lower.includes("sipil")) return "FTSP";
    if (lower.includes("agama")) return "FIAI";
    return fakultas;
  };

  const updatePrintStats = async () => {
    try {
      const currentDate = new Date().toISOString();
      await updateDoc(doc(db, userKoleksi || "pendaftar", id), {
        printCount: increment(1),
        lastPrintDate: currentDate,
      });
    } catch (error) {
      console.warn("Gagal update statistik KTA, melanjutkan unduhan...", error);
    }
  };

  const handleDownloadPNG = async () => {
    setIsProcessingPNG(true);
    try {
      await updatePrintStats();
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!exportContainerRef.current)
        throw new Error("Elemen tidak ditemukan");

      const dataUrl = await toPng(exportContainerRef.current, {
        cacheBust: true,
        backgroundColor: "#ffffff",
      });

      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `E-KTA_${userData?.nama ? userData.nama.replace(/\s+/g, "_") : "Anggota"}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error("Unduh PNG Error:", error);
      toast.error(`Gagal mengunduh gambar: ${error?.message || "Kesalahan tak dikenal"}`);
    } finally {
      setIsProcessingPNG(false);
    }
  };

  const handleDownloadPDF = async () => {
    setIsProcessingPDF(true);
    try {
      await updatePrintStats();
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!exportContainerRef.current)
        throw new Error("Elemen tidak ditemukan");

      const dataUrl = await toPng(exportContainerRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      const imgProps = pdf.getImageProperties(dataUrl);
      const ratio = imgProps.height / imgProps.width;

      let renderWidth = pdfWidth - margin * 2;
      let renderHeight = renderWidth * ratio;

      if (renderHeight > pdfHeight - margin * 2) {
        renderHeight = pdfHeight - margin * 2;
        renderWidth = renderHeight / ratio;
      }

      const xOffset = (pdfWidth - renderWidth) / 2;
      const yOffset = (pdfHeight - renderHeight) / 2;

      pdf.addImage(dataUrl, "PNG", xOffset, yOffset, renderWidth, renderHeight);
      pdf.save(
        `E-KTA_${userData?.nama ? userData.nama.replace(/\s+/g, "_") : "Anggota"}.pdf`,
      );
    } catch (error: any) {
      console.error("Unduh PDF Error:", error);
      toast.error(`Gagal mengunduh PDF: ${error?.message || "Kesalahan tak dikenal"}`);
    } finally {
      setIsProcessingPDF(false);
    }
  };

  // 🔥 DI SINI SMART LOADER DIPANGGIL 🔥
  if (isLoading) {
    return <SmartLoader />;
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-4 font-sans">
        <div className="w-16 h-16 bg-slate-200 text-slate-400 rounded-full flex items-center justify-center mb-4">
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-[#202124] mb-2">
          Data Tidak Ditemukan
        </h2>
        <p className="text-sm text-[#5F6368] mb-6">
          KTA ini tidak valid atau telah dicabut.
        </p>
        <button
          onClick={() => router.back()}
          className="text-sm font-medium text-[#1A73E8] border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] px-6 py-2 rounded-md transition-colors"
        >
          Kembali
        </button>
      </div>
    );
  }

  const startYear = periodeData?.tglMulai
    ? new Date(periodeData.tglMulai).getFullYear()
    : "";
  const endYear = periodeData?.tglSelesai
    ? new Date(periodeData.tglSelesai).getFullYear()
    : "";
  const displayPeriodeTahun =
    startYear && endYear ? `${startYear} - ${endYear}` : "";

  // ==============================================
  // DESAIN KARTU DEPAN
  // ==============================================
  const CardFront = () => (
    <div className="w-[380px] h-[600px] bg-white rounded-[20px] border border-[#DADCE0] overflow-hidden flex flex-col relative shadow-[0_15px_40px_rgba(0,0,0,0.12)] font-sans shrink-0 text-center">
      <SecurityWatermark />
      <img
        src="/logo-dpp-ika.png"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 opacity-[0.04] grayscale pointer-events-none z-0"
      />

      <div className="relative pt-8 pb-5 w-full shrink-0 z-10 bg-[#0B1528] flex flex-col items-center justify-center">
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-[#224A9A]"></div>
        <div className="bg-white p-1.5 rounded-full w-[64px] h-[64px] flex items-center justify-center shadow-md border-[3px] border-white/20 mb-3 relative z-10">
          <img
            src="/logo-dpp-ika.png"
            alt="Logo UII"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex flex-col z-10 px-4">
          <h1 className="text-white font-black text-[18px] tracking-widest uppercase leading-none mb-1.5 drop-shadow-md">
            KARTU TANDA {userData.isPengurus ? "PENGURUS" : "ANGGOTA"}
          </h1>
          <h2 className="text-[#F29900] font-bold text-[9px] tracking-[0.2em] uppercase drop-shadow-sm">
            DPW IKA UII YOGYAKARTA
          </h2>
        </div>
      </div>
      <div className="h-[6px] w-full bg-[#F29900] shrink-0 z-10 relative shadow-sm"></div>

      <div className="flex-grow flex flex-col items-center px-6 py-6 relative z-10">
        <div className="w-[120px] h-[155px] bg-[#F8F9FA] rounded-xl border-[4px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] overflow-hidden shrink-0 mb-4">
          {userData.fotoUrl ? (
            <img
              src={userData.fotoUrl}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              style={{ objectPosition: userData.fotoPosition || "center" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#9AA0A6] text-xs font-medium bg-[#E8EAED]">
              Tanpa Foto
            </div>
          )}
        </div>

        <div className="w-full space-y-3.5">
          <div>
            <p className="text-[18px] font-black text-[#0B1528] uppercase leading-tight line-clamp-2 px-2">
              {userData.namaLengkap || userData.nama}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
              Nomor Induk {userData.isPengurus ? "Pengurus" : "Anggota"}
            </p>
            <p className="text-[15px] font-bold text-[#0B1528] tracking-widest leading-none font-mono bg-[#F8F9FA] inline-block px-4 py-1.5 rounded-md border border-[#EBEBEB]">
              {getNIA()}
            </p>
          </div>
          <div>
            <p className="text-[9px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
              Program Studi / Angkatan
            </p>
            <p className="text-[12px] font-black text-[#224A9A] uppercase leading-none">
              {getSingkatanFakultas(userData.fakultas)} /{" "}
              {userData.programStudi || "-"} /{" "}
              {userData.angkatan || userData.tahunLulus || "-"}
            </p>
            {displayPeriodeTahun && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">
                Periode {displayPeriodeTahun}
              </p>
            )}

            <div className="mt-2.5">
              <span className="inline-block text-[11px] font-bold text-white bg-[#0B1528] px-3 py-1 rounded-sm uppercase tracking-wider shadow-sm">
                {userData.jabatan === "Koordinator Bidang"
                  ? `Koordinator ${userData.bidang}`
                  : userData.jabatan === "Anggota"
                    ? `Anggota ${userData.bidang}`
                    : userData.jabatan}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-0.2 pb-3 bg-[#F8FAFC] border-t border-[#EBEBEB] shrink-0 z-10 relative flex items-center justify-center">
        <p className="text-[12px] font-black tracking-[0.2em] uppercase flex items-center gap-0.5">
          <span className="text-[#0B1528]">IKADIY.</span>
          <span className="text-[#224A9A]">UII</span>
          <span className="text-[#0B1528]">.AC.ID</span>
        </p>
      </div>
    </div>
  );

  // ==============================================
  // DESAIN KARTU BELAKANG
  // ==============================================
  const CardBack = () => (
    <div className="w-[380px] h-[600px] bg-white rounded-[20px] border border-[#DADCE0] overflow-hidden flex flex-col relative shadow-[0_15px_40px_rgba(0,0,0,0.12)] font-sans shrink-0">
      <SecurityWatermark />
      <img
        src="/logo-dpp-ika.png"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 opacity-[0.04] grayscale pointer-events-none z-0"
      />
      <div className="h-[24px] bg-[#0B1528] w-full shrink-0 z-10 flex">
        <div className="w-[70%] bg-[#0B1528] h-full"></div>
        <div
          className="w-[30%] bg-[#224A9A] h-full"
          style={{ clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }}
        ></div>
      </div>
      <div className="h-[6px] bg-[#F29900] w-full shrink-0 z-10"></div>

      <div className="flex-grow flex flex-col px-8 py-8 items-center z-10 relative">
        <h3 className="text-[16px] font-black text-[#0B1528] uppercase tracking-widest mb-6 border-b-2 border-[#EBEBEB] pb-2 text-center w-full">
          Ketentuan Penggunaan
        </h3>
        <ol className="text-[13px] text-[#5F6368] space-y-4 pl-4 list-decimal leading-relaxed text-justify w-full font-medium mb-auto">
          <li>
            Kartu ini diterbitkan oleh DPW IKA UII Yogyakarta dan merupakan
            bukti keanggotaan yang sah.
          </li>
          <li>
            Kartu tidak dapat dipindahtangankan dan wajib ditunjukkan untuk
            mengakses layanan, acara, atau klaim potongan harga pada mitra
            jaringan bisnis IKA UII DIY.
          </li>
          <li>
            Apabila menemukan kartu ini, harap dikembalikan kepada Sekretariat
            DPW IKA UII DIY melalui email: <strong>ika.diy@uii.ac.id</strong>.
          </li>
        </ol>
        <div className="flex flex-col items-center justify-center w-full mt-8 pt-8 border-t border-[#EBEBEB]">
          <div className="w-[140px] h-[140px] p-3 bg-white border border-[#DADCE0] rounded-xl shadow-sm mb-4 relative z-10 flex-shrink-0">
            <QRCode
              value={currentUrl}
              size={128}
              style={{ width: "100%", height: "100%" }}
              level="M"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col overflow-hidden relative">
      <div
        style={{
          position: "absolute",
          top: "-10000px",
          left: "-10000px",
          width: "1200px",
          height: "900px",
        }}
      >
        <div
          ref={exportContainerRef}
          className="bg-white p-12 flex flex-row gap-10 justify-center items-center rounded-lg"
          style={{
            width: "960px",
            height: "750px",
            boxSizing: "border-box",
          }}
        >
          <CardFront />
          <CardBack />
        </div>
      </div>

      <header className="bg-white border-b border-[#DADCE0] sticky top-0 z-40 shrink-0 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-7 h-7 object-contain"
            />
            <h1 className="font-medium text-[#202124] text-sm sm:text-base">
              Identitas KTA Digital
            </h1>
          </div>
          <span
            className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${userData.status_pengurus === "Aktif" || userData.role === "pengurus" ? "bg-[#E6F4EA] text-[#1E8E3E] border border-[#CEEAD6]" : "bg-[#FEF7E0] text-[#B06000] border border-[#FCE8B2]"}`}
          >
            {userData.status_pengurus === "Aktif" ||
            userData.role === "pengurus"
              ? "Terverifikasi"
              : "Pending"}
          </span>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center py-6 sm:py-10 px-4 sm:px-6 w-full">
        <div className="w-full max-w-7xl bg-white border border-[#DADCE0] rounded-2xl flex flex-col lg:flex-row overflow-hidden shadow-lg items-stretch mb-10">
          <div
            ref={containerRef}
            className="w-full lg:w-[65%] bg-[#F1F3F4] sm:bg-[#F8F9FA] p-6 sm:p-10 border-b lg:border-b-0 lg:border-r border-[#DADCE0] flex flex-col items-center justify-center relative min-h-[650px]"
          >
            <div className="w-full flex justify-between items-center mb-10 max-w-[800px]">
              <p className="text-sm text-[#5F6368] font-semibold flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[#1A73E8]"
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
                Preview Kartu
              </p>
            </div>

            <div
              className="flex flex-col lg:flex-row items-center justify-center gap-8 w-full transition-transform duration-300"
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top center",
              }}
            >
              <CardFront />
              <CardBack />
            </div>
          </div>

          <div className="w-full lg:w-[35%] flex flex-col bg-white relative">
            {isOwner ? (
              <div className="p-6 sm:p-10 flex flex-col h-full lg:sticky lg:top-14">
                <div className="mb-auto">
                  <h3 className="text-2xl font-bold text-[#202124] mb-3 tracking-tight">
                    Identitas Elektronik
                  </h3>

                  {!userData.fotoUrl && (
                    <div className="text-[13px] text-[#D93025] mb-5 font-medium flex items-start gap-2 bg-[#FCE8E6] p-4 rounded-lg border border-[#FAD2CF]">
                      <svg
                        className="w-5 h-5 shrink-0 mt-0.5"
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
                      Harap lengkapi Pas Foto di Pengaturan Profil agar KTA Anda
                      sah dan dapat dicetak.
                    </div>
                  )}

                  <p className="text-[#5F6368] text-[15px] leading-relaxed mb-8">
                    Identitas digital Anda kini lebih praktis. Tunjukkan E-KTA
                    ini untuk keperluan presensi agenda IKA UII DIY, sekaligus
                    sebagai akses untuk mengklaim berbagai manfaat istimewa dari
                    mitra jaringan alumni.
                  </p>
                </div>

                <div className="flex flex-col gap-4 mt-6">
                  <p className="text-xs font-semibold text-[#9AA0A6] uppercase tracking-wider">
                    Opsi Unduhan KTA
                  </p>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleDownloadPDF}
                      disabled={isProcessingPDF || isProcessingPNG}
                      className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium py-3.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm shadow-md"
                    >
                      {isProcessingPDF ? (
                        "Memproses PDF..."
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          Unduh KTA (Versi PDF)
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleDownloadPNG}
                      disabled={isProcessingPNG || isProcessingPDF}
                      className="w-full bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] text-[#1A73E8] font-medium py-3.5 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50 text-sm shadow-sm"
                    >
                      {isProcessingPNG ? (
                        "Memproses PNG..."
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
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Unduh KTA (Versi Gambar)
                        </>
                      )}
                    </button>
                  </div>

                  <Link
                    href="/anggota"
                    className="w-full text-center bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#5F6368] hover:text-[#202124] font-medium py-3.5 mt-2 text-sm transition-colors rounded-lg"
                  >
                    Kembali ke Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6 sm:p-10 flex flex-col justify-center items-center h-full min-h-[400px]">
                <div className="w-24 h-24 bg-[#E6F4EA] text-[#1E8E3E] rounded-full flex items-center justify-center mb-6 shadow-md border-[6px] border-white ring-1 ring-[#CEEAD6]">
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
                <h3 className="text-3xl font-black text-[#202124] mb-3 tracking-tight">
                  KTA Terverifikasi
                </h3>
                <p className="text-[#5F6368] text-[16px] leading-relaxed mb-8 text-center max-w-sm">
                  Kartu Tanda Anggota ini adalah dokumen resmi yang sah dan
                  terdaftar pada database{" "}
                  <strong>DPW IKA UII Yogyakarta</strong>.
                </p>
                <div className="w-full max-w-[200px] h-[2px] bg-[#EBEBEB] mb-8"></div>
                <p className="text-xs text-[#9AA0A6] font-mono tracking-widest uppercase bg-[#F8F9FA] px-4 py-2 rounded-md border border-[#EBEBEB]">
                  Verification Stamp
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full bg-[#0A1022] mt-auto shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]"></div>
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col sm:flex-row justify-between items-center px-6 py-6 gap-3 text-center sm:text-left">
          <p className="text-[11px] text-[#9AA0A6] font-medium tracking-wider">
            &copy; {new Date().getFullYear()} DPW IKA UII DIY.
          </p>
          <p className="text-[11px] text-[#5F6368] font-medium tracking-wide">
            Dikembangkan melalui kerja sama Media & Publikasi DPW dengan{" "}
            <span className="text-[#A0B4B7]">
              PT Guwigo Teknologi Indonesia
            </span>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
