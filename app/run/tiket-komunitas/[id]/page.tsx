"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";

export default function ETicketKomunitasPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [groupData, setGroupData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // =================================================================
  // 🔥 PENGAMANAN HALAMAN (ANTI KLIK KANAN & INSPECT)
  // =================================================================
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
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
  // 🔥 FETCH DATA KOMUNITAS
  // =================================================================
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const pRef = doc(db, "pendaftaran_komunitas", id);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists()) {
          const data = pSnap.data();
          if (data.statusPembayaran !== "Lunas") {
            // Paksa kembali jika belum lunas
            router.push(`/run/checkout-komunitas/${id}`);
            return;
          }
          setGroupData({ id: pSnap.id, ...data });
        } else {
          router.push("/run");
          return;
        }

        const sRef = doc(db, "settings", "virtual_run");
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          setSettings(sSnap.data());
        }
      } catch (error) {
        console.error("Error fetching ticket:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const downloadTicket = async () => {
    const element = document.getElementById("e-ticket-komunitas");
    if (!element) return;
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `E-Ticket-${groupData.kapten?.komunitas || "Komunitas"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      toast.error("Gagal mengunduh tiket. Coba gunakan perangkat lain.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#0B2239] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!groupData) return null;

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col relative">
      <NavbarPublic />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] md:pt-[160px] pb-20 w-full relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-500">
        <div className="text-center mb-8 w-full max-w-2xl">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-emerald-200">
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
            Pembayaran Diterima!
          </h1>
          <p className="text-slate-500 font-medium max-w-lg mx-auto text-sm leading-relaxed">
            Status pembayaran komunitas{" "}
            <strong>{groupData.kapten?.komunitas}</strong> sudah LUNAS. Berikut
            adalah E-Ticket resmi grup Anda. Silakan unduh atau simpan bukti
            tiket ini.
          </p>
        </div>

        {/* DESAIN KARTU E-TIKET */}
        <div className="w-full max-w-2xl">
          <div
            id="e-ticket-komunitas"
            className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 w-full mb-8 relative bg-gradient-to-br from-white to-slate-50"
          >
            <div className="bg-[#0B2239] text-white p-6 border-b-4 border-[#FCD116] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-black tracking-widest text-[#FCD116] bg-[#0B2239] border border-[#FCD116] px-2.5 py-1 rounded-full uppercase">
                  Official E-Ticket
                </span>
                <h2 className="text-xl font-black tracking-tight mt-2 uppercase">
                  {settings?.eventName || "VIRTUAL RUN"}
                </h2>
                <p className="text-xs text-slate-300 font-medium mt-0.5">
                  Kategori: Komunitas / Group Registration
                </p>
              </div>
              <div className="bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-full shadow-md border border-emerald-300 uppercase tracking-wider">
                LUNAS / PAID
              </div>
            </div>

            <div className="grid md:grid-cols-12 gap-6 p-6 sm:p-8 items-center relative">
              <div className="md:col-span-7 space-y-4 border-b md:border-b-0 md:border-r border-dashed border-slate-200 pb-6 md:pb-0 md:pr-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    Nama Komunitas / Tim
                  </p>
                  <p className="text-lg font-black text-[#0B2239] uppercase tracking-tight">
                    {groupData.kapten?.komunitas}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      Nama Kapten (PJ)
                    </p>
                    <p className="text-sm font-bold text-slate-700 uppercase">
                      {groupData.kapten?.nama}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      Total Anggota
                    </p>
                    <p className="text-sm font-black text-[#0B2239]">
                      {groupData.participants?.length || 0} Orang
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      ID Registrasi
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                      {groupData.id}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      Tanggal Daftar
                    </p>
                    <p className="text-xs font-bold text-slate-600">
                      {groupData.createdAt?.seconds
                        ? new Date(
                            groupData.createdAt.seconds * 1000,
                          ).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "Terkonfirmasi"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-5 flex flex-col items-center justify-center text-center">
                <div className="p-3 bg-white border border-slate-200 rounded-2xl shadow-inner mb-3">
                  <QRCodeSVG
                    value={groupData.id}
                    size={140}
                    level={"H"}
                    includeMargin={true}
                  />
                </div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  Scan QR Code saat Check-in
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 text-center">
              <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                Bawa E-Ticket ini saat pengambilan Race Pack secara kolektif
                oleh Kapten. Jangan membagikan QR Code tiket ini kepada pihak
                asing.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-2xl">
          <button
            onClick={downloadTicket}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-8 rounded-full transition-all shadow-lg text-sm flex items-center justify-center gap-2"
          >
            Unduh E-Ticket (PNG)
          </button>

          <button
            onClick={() =>
              window.open(
                `https://wa.me/?text=Halo Admin, saya Kapten ${groupData.kapten?.nama} dari komunitas ${groupData.kapten?.komunitas}. Ingin melakukan konfirmasi pendaftaran grup kami dengan ID pendaftaran: ${groupData.id}.`,
                "_blank",
              )
            }
            className="bg-[#0B2239] hover:bg-slate-800 text-[#FCD116] font-bold py-3.5 px-8 rounded-full transition-all shadow-lg text-sm flex items-center justify-center gap-2"
          >
            Hubungi Admin (WhatsApp)
          </button>
        </div>
      </main>

      <FooterPublic />
    </div>
  );
}
