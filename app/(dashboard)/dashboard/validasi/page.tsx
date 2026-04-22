"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  where,
  deleteDoc,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";

// --- KUMPULAN IKON PROFESIONAL ---
const IconQR = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 6.75h.75v.75h-.75v-.75zM6.75 16.5h.75v.75h-.75v-.75zM16.5 6.75h.75v.75h-.75v-.75zM13.5 13.5h.75v.75h-.75v-.75zM13.5 19.5h.75v.75h-.75v-.75zM19.5 13.5h.75v.75h-.75v-.75zM19.5 19.5h.75v.75h-.75v-.75zM16.5 16.5h.75v.75h-.75v-.75z"
    />
  </svg>
);

const IconPlus = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const IconDownload = () => (
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
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);

const IconAttach = () => (
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
      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
    />
  </svg>
);

const IconTrash = () => (
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
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

export default function ValidasiAdminPage() {
  const [dokumenList, setDokumenList] = useState<any[]>([]);
  const [prokerList, setProkerList] = useState<any[]>([]);
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nomorSurat: "",
    perihal: "",
    penandatangan: "",
    jabatan: "",
    tanggal: "",
  });

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const qQR = query(
        collection(db, "validasi_ttd"),
        orderBy("createdAt", "desc"),
      );
      const snapQR = await getDocs(qQR);
      const dataQR = snapQR.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDokumenList(dataQR);

      const nomorSuratSudahAdaQR = dataQR.map((qr: any) => qr.nomorSurat);

      const qProker = query(
        collection(db, "proker"),
        orderBy("createdAt", "desc"),
      );
      const snapProker = await getDocs(qProker);

      const filteredProker = snapProker.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter(
          (p: any) =>
            p.nomorSurat && !nomorSuratSudahAdaQR.includes(p.nomorSurat),
        );

      setProkerList(filteredProker);

      const snapPengurus = await getDocs(collection(db, "pengurus"));
      setPengurusList(
        snapPengurus.docs.map((d) => ({ id: d.id, ...d.data() })),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handlePilihSurat = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nomor = e.target.value;
    const proker = prokerList.find((p) => p.nomorSurat === nomor);
    setFormData({
      ...formData,
      nomorSurat: nomor,
      perihal: proker ? proker.namaKegiatan : "",
    });
  };

  const handlePilihPengurus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nama = e.target.value;
    const pengurus = pengurusList.find((p) => p.nama === nama);
    setFormData({
      ...formData,
      penandatangan: nama,
      jabatan: pengurus ? pengurus.jabatan || "" : "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "validasi_ttd"), {
        ...formData,
        createdAt: serverTimestamp(),
        status: "Valid",
      });
      setFormData({
        nomorSurat: "",
        perihal: "",
        penandatangan: "",
        jabatan: "",
        tanggal: "",
      });
      fetchAllData();
      alert("✅ QR Code berhasil dibuat dan masuk ke dalam sistem!");
    } catch (error) {
      alert("❌ Gagal membuat QR Code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = (id: string, nomor: string) => {
    const canvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let link = document.createElement("a");
    link.href = pngUrl;
    link.download = `QR_TTD_${nomor.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  const handleBubuhkanQR = async (docData: any) => {
    try {
      const qProker = query(
        collection(db, "proker"),
        where("nomorSurat", "==", docData.nomorSurat),
      );
      const snap = await getDocs(qProker);

      if (snap.empty) {
        alert(
          `❌ Gagal: Surat dengan nomor ${docData.nomorSurat} tidak ditemukan di database Proker.`,
        );
        return;
      }

      const prokerId = snap.docs[0].id;
      const validationUrl = `${baseUrl}/verifttd/${docData.id}`;

      await updateDoc(doc(db, "proker", prokerId), {
        qrValidationUrl: validationUrl,
      });

      alert(
        "✅ BERHASIL! QR Code telah ditautkan secara elektronik ke Surat Tugas.",
      );
    } catch (error) {
      console.error(error);
      alert("❌ Terjadi kesalahan sistem saat membubuhkan QR.");
    }
  };

  const handleDeleteQR = async (qrId: string, nomorSurat: string) => {
    const isConfirm = window.confirm(
      `Peringatan: Yakin ingin menghapus QR Code untuk surat nomor: ${nomorSurat}?\n\nTindakan ini juga akan mencabut validasi elektronik pada surat terkait.`,
    );
    if (!isConfirm) return;

    try {
      await deleteDoc(doc(db, "validasi_ttd", qrId));
      const qProker = query(
        collection(db, "proker"),
        where("nomorSurat", "==", nomorSurat),
      );
      const snap = await getDocs(qProker);

      if (!snap.empty) {
        const prokerId = snap.docs[0].id;
        await updateDoc(doc(db, "proker", prokerId), { qrValidationUrl: "" });
      }

      alert("✅ Data QR Code beserta validasinya berhasil dihapus.");
      fetchAllData();
    } catch (error) {
      console.error("Gagal menghapus QR:", error);
      alert("❌ Terjadi kesalahan saat menghapus QR Code.");
    }
  };

  // Helper Formatter Waktu untuk Log
  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Baru saja";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return (
      date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-blue-100 selection:text-blue-900 pt-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* --- HEADER --- */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            Digital Signature System
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Validasi Tanda Tangan
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl">
            Sistem manajemen *Tanda Tangan Elektronik* (TTE). Buat, bubuhkan,
            dan kelola QR Code validasi keaslian dokumen resmi organisasi.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* KOLOM KIRI (Form & Riwayat Log) */}
          <div className="lg:col-span-4 space-y-6">
            {/* PANEL BUAT QR BARU */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden">
              {/* Kosmetik Border Atas */}
              <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-600"></div>

              <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2 mt-1">
                <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                  <IconQR />
                </div>
                Buat Segel QR Baru
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Pilih Surat Target
                  </label>
                  <select
                    required
                    value={formData.nomorSurat}
                    onChange={handlePilihSurat}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-semibold text-slate-800 transition-all"
                  >
                    <option value="">-- Pilih dari database --</option>
                    {prokerList.map((p) => (
                      <option key={p.id} value={p.nomorSurat}>
                        {p.nomorSurat} ({p.namaKegiatan.substring(0, 20)}...)
                      </option>
                    ))}
                    {prokerList.length === 0 && !isLoading && (
                      <option value="" disabled>
                        Semua surat telah diotentikasi
                      </option>
                    )}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Hanya menampilkan surat tanpa TTE.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Subjek Dokumen
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.perihal}
                    readOnly
                    className="w-full bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                    Otoritas Penandatangan
                  </label>
                  <select
                    required
                    value={formData.penandatangan}
                    onChange={handlePilihPengurus}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 font-semibold text-slate-800 transition-all"
                  >
                    <option value="">-- Pilih Pengurus Berwenang --</option>
                    {pengurusList
                      .filter((p) => p.nama)
                      .map((p) => (
                        <option key={p.id} value={p.nama}>
                          {p.nama}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Jabatan
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.jabatan}
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Tanggal Sah
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) =>
                        setFormData({ ...formData, tanggal: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  disabled={isSubmitting || prokerList.length === 0}
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors mt-4 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <IconPlus /> Generate TTE System
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* PANEL RIWAYAT AKTIVITAS TERBARU */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-6 flex items-center justify-between">
                <span>Riwayat Aktivitas</span>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">
                  Live
                </span>
              </h3>

              <div className="space-y-0">
                {isLoading ? (
                  <div className="text-center text-slate-400 text-sm py-4 animate-pulse">
                    Menarik data riwayat...
                  </div>
                ) : dokumenList.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-4 italic">
                    Belum ada aktivitas.
                  </div>
                ) : (
                  dokumenList.slice(0, 5).map((log, idx) => (
                    <div
                      key={log.id}
                      className="relative pl-6 pb-6 last:pb-0 border-l-2 border-slate-100 last:border-transparent"
                    >
                      <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-4 ring-white"></div>
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl hover:bg-slate-100/80 transition-colors">
                        <p className="text-[10px] text-slate-400 font-medium mb-1">
                          {formatTimeAgo(log.createdAt)}
                        </p>
                        <p className="text-sm font-semibold text-slate-800 leading-snug">
                          QR Berhasil dicetak untuk{" "}
                          <span className="text-blue-600">
                            {log.nomorSurat}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* KOLOM KANAN (Daftar Dokumen QR) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">
                  Daftar Segel Kriptografi (QR)
                </h3>
                <div className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                  Total: {dokumenList.length} Dokumen
                </div>
              </div>

              {isLoading ? (
                <div className="p-20 flex justify-center">
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
                </div>
              ) : dokumenList.length === 0 ? (
                <div className="p-24 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <IconQR />
                  </div>
                  <h3 className="font-semibold text-slate-700">
                    Repositori Kosong
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Gunakan formulir di samping untuk membuat QR pertama.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-white border-b border-slate-200 text-slate-400 text-[11px] uppercase tracking-widest font-bold">
                        <th className="p-5 w-32">Visual QR</th>
                        <th className="p-5">Informasi Dokumen</th>
                        <th className="p-5 text-right">Aksi Sistem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dokumenList.map((doc) => {
                        const validationUrl = `${baseUrl}/verifttd/${doc.id}`;
                        return (
                          <tr
                            key={doc.id}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="p-5 align-top">
                              <div className="bg-white p-2 border border-slate-200 rounded-xl inline-block shadow-sm ring-1 ring-slate-900/5 group-hover:shadow-md transition-shadow">
                                <QRCodeCanvas
                                  id={`qr-${doc.id}`}
                                  value={validationUrl}
                                  size={84}
                                  level={"H"}
                                  includeMargin={true}
                                />
                              </div>
                            </td>
                            <td className="p-5 align-top">
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{" "}
                                Active
                              </div>
                              <div className="font-bold text-slate-900 text-base tracking-tight mb-1">
                                {doc.nomorSurat}
                              </div>
                              <div className="text-sm text-slate-500 mb-3 truncate max-w-xs md:max-w-md font-medium">
                                {doc.perihal}
                              </div>
                              <div className="flex gap-4 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 w-fit">
                                <div>
                                  <span className="font-semibold text-slate-700">
                                    Signer:
                                  </span>{" "}
                                  {doc.penandatangan}
                                </div>
                                <div className="border-l border-slate-300 pl-4">
                                  <span className="font-semibold text-slate-700">
                                    Tgl Sah:
                                  </span>{" "}
                                  {doc.tanggal}
                                </div>
                              </div>
                            </td>
                            <td className="p-5 align-top text-right">
                              <div className="flex flex-col items-end gap-2">
                                <button
                                  onClick={() => handleBubuhkanQR(doc)}
                                  className="flex items-center justify-center gap-2 w-32 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white py-2 rounded-lg text-xs font-semibold transition-colors border border-emerald-200 shadow-sm"
                                >
                                  <IconAttach /> Bubuhkan
                                </button>
                                <button
                                  onClick={() =>
                                    downloadQR(doc.id, doc.nomorSurat)
                                  }
                                  className="flex items-center justify-center gap-2 w-32 bg-white hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-200 shadow-sm"
                                >
                                  <IconDownload /> Unduh Image
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteQR(doc.id, doc.nomorSurat)
                                  }
                                  className="flex items-center justify-center gap-2 w-32 bg-white hover:bg-rose-50 text-rose-600 py-2 rounded-lg text-xs font-semibold transition-colors border border-rose-200 shadow-sm group/btn"
                                >
                                  <IconTrash /> Cabut Validasi
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
