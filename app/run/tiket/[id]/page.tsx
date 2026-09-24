"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import RunNavbar from "@/components/run/RunNavbar";
import RunFooter from "@/components/run/RunFooter";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";

export default function ETicketPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [participant, setParticipant] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [scale, setScale] = useState(1);

  const ticketRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  // =================================================================
  // PENGAMANAN HALAMAN (ANTI KLIK KANAN & INSPECT)
  // =================================================================
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Blokir F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // =================================================================
  // FETCH DATA TIKET
  // =================================================================
  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      try {
        const pRef = doc(db, "offline_participants", id);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists()) {
          const data = pSnap.data();
          if (data.statusPembayaran !== "Lunas") {
            // Jika belum lunas, paksa kembali ke halaman checkout
            router.push(`/run/checkout/${id}`);
            return;
          }
          setParticipant({ id: pSnap.id, ...data });
        } else {
          router.push("/run");
          return;
        }

        const sRef = doc(db, "settings", "virtual_run");
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) setSettings(sSnap.data());
      } catch (error) {
        console.error("Error loading ticket:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTicket();
  }, [id, router]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Scale based on width (max 400)
        const scaleX = containerWidth / 400;
        // Scale based on height (header ~160px, buttons ~80px, padding ~40px = 280px margin)
        const availableHeight = window.innerHeight - 280;
        const scaleY = availableHeight / 700;
        
        setScale(Math.min(1, scaleX, scaleY));
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isLoading]);

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `E-Ticket-${participant.namaLengkap.replace(/\s+/g, "-")}.png`;
      a.click();
    } catch {
      toast.error("Gagal mengunduh tiket. Coba gunakan perangkat lain.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0B2239] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F4F7FB] font-sans flex flex-col items-center justify-center relative p-4">
      <main className="w-full max-w-3xl flex flex-col items-center animate-in zoom-in-95 duration-500 max-h-full">
        <div className="text-center mb-4 md:mb-6 shrink-0">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#0B2239] text-[#FCD116] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg border-2 border-[#FCD116]">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#0B2239] mb-2 uppercase tracking-tight">
            Pendaftaran Selesai!
          </h1>
          <p className="text-slate-500 font-medium max-w-md mx-auto text-[13px] md:text-sm">
            Tunjukkan E-Ticket di bawah ini saat pengambilan Race Pack.
          </p>
        </div>

        <div
          ref={containerRef}
          className="w-full max-w-[400px] flex justify-center items-center mb-8 mx-auto"
        >
          <div
            className="relative transition-transform duration-300 hover:scale-[1.02] cursor-pointer group drop-shadow-2xl"
            style={{ width: `${400 * scale}px`, height: `${700 * scale}px` }}
            onClick={handleDownloadTicket}
          >
            {/* CONTAINER TIKET VERTICAL */}
            <div
              ref={ticketRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "400px",
                height: "700px",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                background: "linear-gradient(135deg, #0B2239 0%, #173b63 100%)",
                borderRadius: "24px",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* ORNAMENT / PATTERN */}
              <div
                style={{
                  position: "absolute",
                  top: "-50px",
                  right: "-50px",
                  width: "250px",
                  height: "250px",
                  background: "radial-gradient(circle, rgba(252,209,22,0.15) 0%, rgba(0,0,0,0) 70%)",
                  borderRadius: "50%",
                }}
              ></div>

              {/* HEADER SECTION */}
              <div style={{ padding: "40px 30px 20px", textAlign: "center", zIndex: 10 }}>
                <div style={{ display: "inline-flex", padding: "8px", backgroundColor: "#ffffff", borderRadius: "50%", marginBottom: "16px" }}>
                  <img
                    src="/logo-dpp-ika.png"
                    alt="Logo"
                    style={{ width: "48px", height: "48px" }}
                    crossOrigin="anonymous"
                  />
                </div>
                <h1 style={{ margin: 0, color: "#FCD116", fontSize: "14px", fontWeight: 800, letterSpacing: "3px", textTransform: "uppercase" }}>
                  E-TICKET OFFICIAL
                </h1>
                <p style={{ margin: "4px 0 0", color: "#ffffff", fontSize: "22px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>
                  {(participant.eventName || settings?.namaEvent || "IKA UII DIY RUN").toUpperCase()}
                </p>
              </div>

              {/* PARTICIPANT INFO */}
              <div style={{ padding: "20px 30px", flex: 1, zIndex: 10 }}>
                <div style={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                    Nama Pelari
                  </p>
                  <h2 style={{ margin: "4px 0 24px", fontSize: "26px", color: "#ffffff", fontWeight: 900, textTransform: "uppercase", lineHeight: "1.2" }}>
                    {participant.namaLengkap}
                  </h2>
                  
                  <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Kategori</p>
                      <p style={{ margin: "4px 0 0", fontSize: "22px", color: "#FCD116", fontWeight: 900 }}>{participant.jarak}</p>
                    </div>
                    <div style={{ width: "1px", backgroundColor: "rgba(255,255,255,0.1)" }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>Jersey</p>
                      <p style={{ margin: "4px 0 0", fontSize: "22px", color: "#ffffff", fontWeight: 900 }}>{participant.ukuranJersey}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* TICKET DIVIDER */}
              <div style={{ display: "flex", alignItems: "center", position: "relative", zIndex: 10 }}>
                <div style={{ width: "24px", height: "24px", backgroundColor: "#F4F7FB", borderRadius: "50%", marginLeft: "-12px" }}></div>
                <div style={{ flex: 1, borderTop: "2px dashed rgba(255,255,255,0.2)" }}></div>
                <div style={{ width: "24px", height: "24px", backgroundColor: "#F4F7FB", borderRadius: "50%", marginRight: "-12px" }}></div>
              </div>

              {/* QR CODE & BIB SECTION (LOWER PART) */}
              <div style={{ backgroundColor: "#ffffff", padding: "30px", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
                <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px" }}>Nomor BIB</p>
                    <p style={{ margin: "0", fontSize: "32px", color: "#0B2239", fontWeight: 900 }}>{participant.nomorBIB || "0000"}</p>
                  </div>
                  <div style={{ padding: "12px", backgroundColor: "#F8F9FA", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                    <QRCodeSVG
                      value={`${baseUrl}/verify-ticket/${participant.id}`}
                      size={80}
                      level="Q"
                      fgColor="#0B2239"
                    />
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "10px", color: "#94a3b8", fontWeight: 600, textAlign: "center" }}>
                  Simpan E-Ticket ini untuk ditunjukkan kepada panitia saat pengambilan Race Pack.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 w-full max-w-sm shrink-0">
          <button
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className="flex-1 bg-[#0B2239] hover:bg-blue-950 text-white font-bold py-3.5 px-4 rounded-[8px] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-[13px] transition-colors"
          >
            {isDownloading ? "Memproses..." : "Unduh E-Ticket"}
          </button>
          <Link
            href="/run"
            className="flex-1 bg-white border border-slate-200 text-slate-700 font-bold py-3.5 px-4 rounded-[8px] flex items-center justify-center gap-2 text-[13px] transition-colors hover:bg-slate-50 shadow-sm"
          >
            Selesai
          </Link>
        </div>
      </main>
    </div>
  );
}
