"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
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
        setScale(Math.min(1, containerWidth / 600));
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
    } catch (err) {
      toast.error("Gagal mengunduh tiket. Coba gunakan perangkat lain.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0B2239] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col relative">
      <NavbarPublic />
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] md:pt-[160px] pb-20 w-full relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0B2239] text-[#FCD116] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-[#FCD116]">
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
          <p className="text-slate-500 font-medium max-w-md mx-auto text-sm">
            Tunjukkan E-Ticket di bawah ini saat pengambilan Race Pack.
          </p>
        </div>

        <div
          ref={containerRef}
          className="w-full max-w-[600px] flex justify-center items-center mb-8"
        >
          <div
            className="relative transition-transform duration-300 hover:scale-[1.02] cursor-pointer group drop-shadow-2xl"
            style={{ width: `${600 * scale}px`, height: `${240 * scale}px` }}
            onClick={handleDownloadTicket}
          >
            {/* CONTAINER TIKET (Kodingan asli jenengan yang elegan) */}
            <div
              ref={ticketRef}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "600px",
                height: "240px",
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                display: "flex",
                overflow: "hidden",
              }}
            >
              {/* BAGIAN KIRI TIKET */}
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#0B2239",
                    height: "65px",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: "24px",
                    position: "relative",
                    borderBottom: "4px solid #FCD116",
                  }}
                >
                  <img
                    src="/logo-dpp-ika.png"
                    alt="Logo"
                    style={{
                      width: "36px",
                      height: "36px",
                      backgroundColor: "#ffffff",
                      borderRadius: "50%",
                      padding: "4px",
                    }}
                    crossOrigin="anonymous"
                  />
                  <div style={{ marginLeft: "12px", zIndex: 10 }}>
                    <h1
                      style={{
                        margin: 0,
                        color: "#ffffff",
                        fontSize: "18px",
                        fontWeight: 900,
                        letterSpacing: "1px",
                      }}
                    >
                      E-TICKET
                    </h1>
                    <p
                      style={{
                        margin: 0,
                        color: "#FCD116",
                        fontSize: "9px",
                        fontWeight: 700,
                        letterSpacing: "1.5px",
                      }}
                    >
                      {(
                        participant.eventName ||
                        settings?.namaEvent ||
                        "IKA UII DIY RUN"
                      ).toUpperCase()}
                    </p>
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      right: "-30px",
                      top: 0,
                      bottom: 0,
                      width: "120px",
                      backgroundColor: "#1e3a5f",
                      transform: "skewX(-30deg)",
                    }}
                  ></div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    opacity: 0.05,
                    pointerEvents: "none",
                  }}
                >
                  <img
                    src="/logo-dpp-ika.png"
                    style={{
                      width: "160px",
                      height: "160px",
                      filter: "grayscale(100%)",
                    }}
                    crossOrigin="anonymous"
                  />
                </div>

                <div
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      color: "#64748b",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                  >
                    Nama Pelari
                  </p>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "24px",
                      color: "#0B2239",
                      fontWeight: 900,
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "350px",
                    }}
                  >
                    {participant.namaLengkap}
                  </h2>
                  <p
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "11px",
                      color: "#64748b",
                      fontWeight: 700,
                    }}
                  >
                    BIB:{" "}
                    <span style={{ color: "#0B2239", fontWeight: 900 }}>
                      {participant.nomorBIB || "0000"}
                    </span>
                  </p>

                  <div
                    style={{ display: "flex", marginTop: "auto", gap: "30px" }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "9px",
                          color: "#94a3b8",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Kategori
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#1A73E8",
                          fontWeight: 900,
                        }}
                      >
                        {participant.jarak}
                      </p>
                    </div>
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "9px",
                          color: "#94a3b8",
                          fontWeight: 700,
                          textTransform: "uppercase",
                        }}
                      >
                        Size Jersey
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "18px",
                          color: "#0B2239",
                          fontWeight: 900,
                        }}
                      >
                        {participant.ukuranJersey}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* PEMBATAS PUTUT-PUTUS */}
              <div
                style={{
                  width: "0px",
                  borderLeft: "2px dashed #cbd5e1",
                  position: "relative",
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-12px",
                    left: "-12px",
                    width: "24px",
                    height: "24px",
                    backgroundColor: "#F4F7FB",
                    borderRadius: "50%",
                  }}
                ></div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "-12px",
                    left: "-12px",
                    width: "24px",
                    height: "24px",
                    backgroundColor: "#F4F7FB",
                    borderRadius: "50%",
                  }}
                ></div>
              </div>

              {/* BAGIAN KANAN TIKET (QR CODE) */}
              <div
                style={{
                  width: "160px",
                  backgroundColor: "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "10px",
                    color: "#0B2239",
                    fontWeight: 900,
                    letterSpacing: "1px",
                  }}
                >
                  SCAN AREA
                </p>
                <div
                  style={{
                    padding: "8px",
                    backgroundColor: "#ffffff",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <QRCodeSVG
                    value={`${baseUrl}/verify-ticket/${participant.id}`}
                    size={100}
                    level="M"
                  />
                </div>
                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: "10px",
                    color: "#64748b",
                    fontWeight: 700,
                    letterSpacing: "2px",
                  }}
                >
                  {participant.nomorBIB || "0000"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <button
            onClick={handleDownloadTicket}
            disabled={isDownloading}
            className="bg-[#0B2239] hover:bg-blue-950 text-white font-bold py-3.5 px-8 rounded-full shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
          >
            {isDownloading ? "Memproses..." : "Unduh E-Ticket (PNG)"}
          </button>
          <Link
            href="/run"
            className="bg-white border border-slate-200 text-slate-700 font-bold py-3.5 px-8 rounded-full flex items-center gap-2 text-sm"
          >
            Kembali
          </Link>
        </div>
      </main>
      <FooterPublic />
    </div>
  );
}
