"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";

interface Peserta {
  id: string;
  nama: string;
  email: string;
  statusKirim: "Belum" | "Loading" | "Terkirim" | "Gagal";
}

export default function BroadcastPage() {
  const [eventList, setEventList] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);

  const [broadcastType, setBroadcastType] = useState("promo_baru");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");

  const [isLoadingDb, setIsLoadingDb] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, total: 0 });

  // Mengambil nama event/agenda yang sedang dipilih
  const selectedEventName =
    eventList.find((e) => e.id === selectedEventId)?.judul ||
    "Agenda IKA UII DIY";

  // Mengambil nama peserta pertama untuk keperluan Live Preview (tanpa dummy)
  const previewName =
    pesertaList.length > 0 ? pesertaList[0].nama : "[Nama Peserta]";

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, "agenda"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setEventList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Gagal load agenda:", error);
      }
    };
    fetchEvents();
  }, []);

  useEffect(() => {
    const fetchPeserta = async () => {
      if (!selectedEventId) {
        setPesertaList([]);
        return;
      }
      setIsLoadingDb(true);
      try {
        const q = query(
          collection(db, "agenda_peserta"),
          where("agendaId", "==", selectedEventId),
        );
        const snap = await getDocs(q);
        const allPeserta = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as any,
        );
        const validPeserta = allPeserta.filter(
          (p) => p.email && p.email.trim() !== "",
        );

        setPesertaList(
          validPeserta.map((p) => ({
            id: p.id,
            nama: p.nama || "Tanpa Nama",
            email: p.email,
            statusKirim: "Belum",
          })),
        );
      } catch (error) {
        console.error("Gagal load peserta agenda:", error);
      } finally {
        setIsLoadingDb(false);
      }
    };
    fetchPeserta();
  }, [selectedEventId]);

  const sendEmail = async (peserta: Peserta, isMassal = false) => {
    if (!isMassal) {
      setPesertaList((prev) =>
        prev.map((p) =>
          p.id === peserta.id ? { ...p, statusKirim: "Loading" } : p,
        ),
      );
    }

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "custom_broadcast",
          email: peserta.email,
          nama: peserta.nama,
          detail: {
            broadcastType: broadcastType,
            eventName: selectedEventName,
            customSubject: customSubject,
            customMessage: customMessage,
          },
        }),
      });

      if (res.ok) {
        setPesertaList((prev) =>
          prev.map((p) =>
            p.id === peserta.id ? { ...p, statusKirim: "Terkirim" } : p,
          ),
        );
        return true;
      } else {
        throw new Error("API Error");
      }
    } catch (error) {
      setPesertaList((prev) =>
        prev.map((p) =>
          p.id === peserta.id ? { ...p, statusKirim: "Gagal" } : p,
        ),
      );
      return false;
    }
  };

  const handleKirimSemua = async () => {
    const targetPeserta = pesertaList.filter(
      (p) => p.statusKirim !== "Terkirim",
    );

    if (targetPeserta.length === 0) {
      toast.info("Seluruh kontak dalam daftar ini telah berhasil dikirimi email.");
      return;
    }

    if (
      !confirm(
        `Konfirmasi pengiriman broadcast ke ${targetPeserta.length} alamat email?`,
      )
    )
      return;

    setIsSendingAll(true);
    setProgress({ sent: 0, total: targetPeserta.length });

    let successCount = 0;

    for (let i = 0; i < targetPeserta.length; i++) {
      const peserta = targetPeserta[i];
      setPesertaList((prev) =>
        prev.map((p) =>
          p.id === peserta.id ? { ...p, statusKirim: "Loading" } : p,
        ),
      );

      const isSuccess = await sendEmail(peserta, true);
      if (isSuccess) successCount++;

      setProgress({ sent: i + 1, total: targetPeserta.length });
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsSendingAll(false);
    toast.success(`Proses Selesai. Berhasil mengirim ${successCount} dari total ${targetPeserta.length} pesan.`);
  };

  // Fungsi Pembantu Preview UI (Sinkron dengan API Server)
  const getPreviewContent = () => {
    switch (broadcastType) {
      case "promo_baru":
        return {
          subject: `Undangan Partisipasi: ${selectedEventName}`,
          body: `Kami mengundang Anda untuk berpartisipasi dalam agenda terbaru IKA UII DIY, yaitu ${selectedEventName}.\n\nJangan lewatkan kesempatan berharga ini untuk hadir, bersilaturahmi, dan berkontribusi bersama jaringan keluarga besar alumni UII.`,
        };
      case "h_min_1":
        return {
          subject: `[PENGINGAT H-1] Persiapan Mengikuti ${selectedEventName}`,
          body: `Ini adalah pengingat ramah bahwa agenda ${selectedEventName} yang Anda ikuti akan dilaksanakan BESOK.\n\nPastikan Anda telah menyiapkan segala kebutuhan, tiket registrasi (jika ada), dan menjaga kesehatan agar dapat mengikuti seluruh rangkaian acara dengan lancar.\n\nSampai jumpa di lokasi acara!`,
        };
      case "hari_h":
        return {
          subject: `[HARI INI] Pelaksanaan ${selectedEventName}`,
          body: `Hari ini adalah hari pelaksanaan ${selectedEventName}! Kami selaku panitia penyelenggara sangat menantikan kehadiran dan partisipasi aktif Anda.\n\nMohon hadir tepat waktu sesuai dengan jadwal yang telah ditentukan. Hati-hati di perjalanan dan selamat bergabung di lokasi acara.`,
        };
      default:
        return {
          subject: customSubject || `Informasi Penting: ${selectedEventName}`,
          body: customMessage || "(Silakan ketik isi pesan Anda...)",
        };
    }
  };

  const preview = getPreviewContent();

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12 relative font-sans text-slate-800">
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">
          Sistem Komunikasi Massa
        </h2>
        <p className="text-slate-500 text-sm">
          Kelola dan kirim pemberitahuan elektronik kepada peserta agenda secara
          terpusat.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI: PENGATURAN & PREVIEW */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2 text-sm uppercase tracking-wider">
              <svg
                className="w-4 h-4 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Parameter Pengiriman
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Sumber Kontak (Agenda)
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 transition-all cursor-pointer"
                >
                  <option value="">-- Pilih Agenda --</option>
                  {eventList.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.judul}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Template Pesan
                </label>
                <select
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-slate-800 transition-all cursor-pointer"
                >
                  <option value="promo_baru">Undangan Agenda Baru</option>
                  <option value="h_min_1">Pengingat H-1 Agenda</option>
                  <option value="hari_h">Pengingat Hari Pelaksanaan</option>
                  <option value="custom">Pesan Kustom (Manual)</option>
                </select>
              </div>

              {broadcastType === "custom" && (
                <div className="space-y-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Subjek Kustom
                    </label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Masukkan subjek email..."
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Isi Pesan Kustom
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={5}
                      placeholder="Ketik detail informasi di sini..."
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none custom-scrollbar"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KOTAK PREVIEW (GOOGLE WORKSPACE STYLE) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-2">
              <svg
                className="w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <span className="text-xs font-semibold text-slate-600">
                Simulasi Pratinjau Teks
              </span>
            </div>

            <div className="p-4">
              <div className="mb-4 pb-3 border-b border-slate-100">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                  Subjek
                </span>
                <p className="text-sm font-semibold text-slate-800 leading-snug">
                  {preview.subject}
                </p>
              </div>

              <div className="text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap">
                <p className="mb-3">
                  Halo <strong>{previewName}</strong>,
                </p>
                <p>{preview.body}</p>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: DAFTAR PENERIMA */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[650px] lg:h-auto lg:min-h-[650px]">
            {/* HEADER TABEL & ACTION */}
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white shrink-0">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">
                  Daftar Penerima
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedEventId
                    ? `${pesertaList.length} kontak tervalidasi.`
                    : "Tentukan sumber kontak terlebih dahulu."}
                </p>
              </div>

              {isSendingAll ? (
                <div className="w-full sm:w-1/2 flex flex-col items-end">
                  <span className="text-xs font-semibold text-blue-600 mb-1.5">
                    Memproses... {progress.sent} / {progress.total}
                  </span>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(progress.sent / progress.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleKirimSemua}
                  disabled={
                    pesertaList.length === 0 ||
                    pesertaList.every((p) => p.statusKirim === "Terkirim")
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Eksekusi Massal
                </button>
              )}
            </div>

            {/* ISI TABEL */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-50/30">
              {isLoadingDb ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-10">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 text-xs font-medium">
                    Sinkronisasi data...
                  </p>
                </div>
              ) : !selectedEventId ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-16 opacity-60">
                  <svg
                    className="w-12 h-12 text-slate-300 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-slate-600">
                    Pilih Agenda
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Data kontak akan diekstraksi dari riwayat partisipasi agenda
                    terkait.
                  </p>
                </div>
              ) : pesertaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-16">
                  <p className="text-slate-500 font-medium text-sm">
                    Tidak ditemukan alamat email yang valid pada agenda ini.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead className="sticky top-0 bg-white shadow-sm z-10">
                    <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider font-semibold">
                      <th className="px-4 py-3 w-12 text-center">No</th>
                      <th className="px-4 py-3">Nama Lengkap & Kontak</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {pesertaList.map((p, idx) => (
                      <tr
                        key={p.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3 text-center text-xs text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800 text-sm">
                            {p.nama}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {p.email}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.statusKirim === "Belum" && (
                            <span className="text-slate-500 text-[11px] font-medium">
                              Menunggu
                            </span>
                          )}
                          {p.statusKirim === "Loading" && (
                            <span className="text-blue-600 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                              <div className="w-2.5 h-2.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>{" "}
                              Proses
                            </span>
                          )}
                          {p.statusKirim === "Terkirim" && (
                            <span className="text-emerald-600 text-[11px] font-semibold">
                              Terkirim
                            </span>
                          )}
                          {p.statusKirim === "Gagal" && (
                            <span className="text-red-500 text-[11px] font-semibold">
                              Gagal
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => sendEmail(p)}
                            disabled={
                              p.statusKirim === "Terkirim" ||
                              p.statusKirim === "Loading" ||
                              isSendingAll
                            }
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                              p.statusKirim === "Terkirim"
                                ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                                : "bg-white text-blue-600 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                          >
                            {p.statusKirim === "Terkirim"
                              ? "Selesai"
                              : "Uji Coba 1"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
