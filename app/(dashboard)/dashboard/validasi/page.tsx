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

// --- KUMPULAN IKON PROFESIONAL (GOOGLE WORKSPACE STYLE) ---
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

const IconDetach = () => (
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
      d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244M9 15l6-6"
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

const IconPrev = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

const IconNext = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
);

export default function ValidasiAdminPage() {
  const [dokumenList, setDokumenList] = useState<any[]>([]);
  const [suratList, setSuratList] = useState<any[]>([]); // Ganti dari prokerList ke suratList (Koneksi ke E-Office)
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination State
  const [itemsPerPage, setItemsPerPage] = useState<number | "all">(5);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    nomorSurat: "",
    perihal: "",
    penandatangan: "",
    jabatan: "",
    tanggal: "",
  });

  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
  });

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showAlert = (title: string, message: string) =>
    setDialog({ isOpen: true, type: "alert", title, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setDialog({ isOpen: true, type: "confirm", title, message, onConfirm });

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Semua QR Code Validasi
      const qQR = query(
        collection(db, "validasi_ttd"),
        orderBy("createdAt", "desc"),
      );
      const snapQR = await getDocs(qQR);
      const rawDataQR = snapQR.docs.map((d) => ({ id: d.id, ...d.data() }));

      // 2. Fetch Semua Nomor Surat dari E-Office (Ganti dari proker ke nomor_surat)
      const qSuratAll = query(collection(db, "nomor_surat"));
      const snapSuratAll = await getDocs(qSuratAll);
      const allSurat = snapSuratAll.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // 3. Cari tau QR mana saja yang sudah nempel di Surat E-Office (isAttached)
      const attachedValidasiIds = allSurat
        .filter(
          (s: any) =>
            s.qrValidationUrl && s.qrValidationUrl.includes("/verifttd/"),
        )
        .map((s: any) => {
          const parts = s.qrValidationUrl.split("/");
          return parts[parts.length - 1];
        });

      // 4. Map final data QR dengan flag isAttached
      const finalDataQR = rawDataQR.map((qr) => ({
        ...qr,
        isAttached: attachedValidasiIds.includes(qr.id),
      }));
      setDokumenList(finalDataQR);

      // 5. Filter daftar Surat di dropdown (Hanya yang belum punya QR sama sekali)
      const nomorSuratSudahAdaQR = finalDataQR.map((qr: any) => qr.nomorSurat);
      const filteredSurat = allSurat
        .filter((s: any) => s.nomor && !nomorSuratSudahAdaQR.includes(s.nomor))
        .sort((a: any, b: any) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });
      setSuratList(filteredSurat);

      // 6. Fetch Pengurus
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

  // Reset pagination if data length changes drastically
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handlePilihSurat = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nomor = e.target.value;
    const surat = suratList.find((s) => s.nomor === nomor);
    setFormData({
      ...formData,
      nomorSurat: nomor,
      perihal: surat ? surat.perihal : "", // Ambil 'perihal' dari E-Office
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
      setTimeout(
        () =>
          showAlert(
            "Berhasil",
            "QR Code berhasil dibuat dan masuk ke dalam sistem!",
          ),
        300,
      );
    } catch (error) {
      setTimeout(
        () => showAlert("Gagal", "Gagal membuat QR Code. Silakan coba lagi."),
        300,
      );
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

  // 🔥 FUNGSI BUBUHKAN KE E-OFFICE 🔥
  const handleBubuhkanQR = async (docData: any) => {
    try {
      const qSurat = query(
        collection(db, "nomor_surat"),
        where("nomor", "==", docData.nomorSurat),
      );
      const snap = await getDocs(qSurat);

      if (snap.empty) {
        showAlert(
          "Peringatan",
          `Surat dengan nomor ${docData.nomorSurat} tidak ditemukan di database E-Office.`,
        );
        return;
      }

      const suratId = snap.docs[0].id;
      const validationUrl = `${baseUrl}/verifttd/${docData.id}`;

      await updateDoc(doc(db, "nomor_surat", suratId), {
        qrValidationUrl: validationUrl,
      });

      showAlert(
        "Berhasil",
        "QR Code telah ditautkan dan dibubuhkan secara elektronik ke Dokumen E-Office.",
      );
      fetchAllData();
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan sistem saat membubuhkan QR.");
    }
  };

  // 🔥 FUNGSI CABUT VALIDASI DARI E-OFFICE 🔥
  const handleCabutValidasi = async (docData: any) => {
    showConfirm(
      "Cabut Validasi",
      `Yakin ingin mencabut bubuhan QR Code dari surat nomor: ${docData.nomorSurat}?\n\nQR ini tidak akan terhapus dan dapat digunakan kembali nantinya.`,
      async () => {
        closeDialog();
        try {
          const qSurat = query(
            collection(db, "nomor_surat"),
            where("nomor", "==", docData.nomorSurat),
          );
          const snap = await getDocs(qSurat);

          if (!snap.empty) {
            const suratId = snap.docs[0].id;
            await updateDoc(doc(db, "nomor_surat", suratId), {
              qrValidationUrl: "",
            });
          }

          setTimeout(
            () =>
              showAlert(
                "Berhasil",
                "Validasi berhasil dicabut. QR Code dapat dibubuhkan kembali.",
              ),
            300,
          );
          fetchAllData();
        } catch (error) {
          console.error("Gagal mencabut QR:", error);
          setTimeout(
            () =>
              showAlert(
                "Gagal",
                "Terjadi kesalahan saat mencabut validasi QR Code.",
              ),
            300,
          );
        }
      },
    );
  };

  // 🔥 FUNGSI HAPUS PERMANEN 🔥
  const handleDeleteQR = async (qrId: string, nomorSurat: string) => {
    showConfirm(
      "Hapus Permanen",
      `Yakin ingin menghapus data QR Code untuk surat nomor: ${nomorSurat}? Data tidak dapat dikembalikan.`,
      async () => {
        closeDialog();
        try {
          await deleteDoc(doc(db, "validasi_ttd", qrId));
          setTimeout(
            () =>
              showAlert(
                "Berhasil",
                "Data QR Code berhasil dihapus secara permanen.",
              ),
            300,
          );
          fetchAllData();
        } catch (error) {
          console.error("Gagal menghapus QR:", error);
          setTimeout(
            () =>
              showAlert("Gagal", "Terjadi kesalahan saat menghapus QR Code."),
            300,
          );
        }
      },
    );
  };

  // Paginasi Logic
  const totalItems = dokumenList.length;
  const totalPages =
    itemsPerPage === "all" ? 1 : Math.ceil(totalItems / itemsPerPage);
  const displayedDokumen =
    itemsPerPage === "all"
      ? dokumenList
      : dokumenList.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage,
        );

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12 font-sans selection:bg-[#E8F0FE] selection:text-[#1A73E8] pt-4 px-4 sm:px-6 lg:px-8">
      {/* CUSTOM DIALOG (POPUP GOOGLE STYLE) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#202124]/40 animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-xl flex flex-col overflow-hidden border border-[#DADCE0] animate-in zoom-in-95">
            <div className="px-6 py-5">
              <h2
                className={`text-lg font-normal mb-2 ${dialog.title.includes("Gagal") || dialog.title.includes("Cabut") || dialog.title.includes("Hapus") || dialog.title.includes("Peringatan") ? "text-[#D93025]" : "text-[#1A73E8]"}`}
              >
                {dialog.title}
              </h2>
              <p className="text-sm text-[#5F6368] leading-relaxed whitespace-pre-wrap">
                {dialog.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-white border-t border-[#DADCE0] flex justify-end gap-2">
              {dialog.type === "confirm" && (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-[#F1F3F4] rounded transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  if (dialog.type === "confirm" && dialog.onConfirm) {
                    dialog.onConfirm();
                  } else {
                    closeDialog();
                  }
                }}
                className={`px-4 py-2 text-sm font-medium text-white rounded transition-colors shadow-sm ${dialog.title.includes("Cabut") || dialog.title.includes("Hapus") ? "bg-[#D93025] hover:bg-[#b52a1f]" : "bg-[#1A73E8] hover:bg-[#1557B0]"}`}
              >
                {dialog.type === "confirm" ? "Lanjutkan" : "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* --- HEADER GOOGLE WORKSPACE STYLE --- */}
        <div className="mb-8 border-b border-[#DADCE0] pb-5 pt-4">
          <div className="inline-flex items-center gap-1.5 bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-medium px-2.5 py-1 rounded mb-3 uppercase tracking-widest border border-[#D2E3FC]">
            <IconQR /> Tanda Tangan Elektronik
          </div>
          <h1 className="text-2xl font-normal text-[#202124] tracking-tight mb-2">
            Validasi & Otorisasi
          </h1>
          <p className="text-[#5F6368] text-sm max-w-2xl">
            Buat, bubuhkan, dan kelola QR Code validasi keaslian dokumen untuk
            surat-surat dari sistem E-Office.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI (Form) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#DADCE0]">
              <h3 className="font-medium text-[#202124] mb-5 flex items-center gap-2 text-sm">
                Buat Segel QR Baru
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#5F6368] mb-1">
                    Pilih Surat dari E-Office{" "}
                    <span className="text-[#D93025]">*</span>
                  </label>
                  <select
                    required
                    value={formData.nomorSurat}
                    onChange={handlePilihSurat}
                    className="w-full bg-white border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] text-[#202124] transition-all"
                  >
                    <option value="">-- Pilih dari database E-Office --</option>
                    {suratList.map((s) => (
                      <option key={s.id} value={s.nomor}>
                        {s.nomor} ({s.perihal.substring(0, 20)}...)
                      </option>
                    ))}
                    {suratList.length === 0 && !isLoading && (
                      <option value="" disabled>
                        Semua surat telah diotentikasi
                      </option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F6368] mb-1">
                    Subjek / Perihal Surat
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.perihal}
                    readOnly
                    className="w-full bg-[#F1F3F4] border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none text-[#5F6368] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#5F6368] mb-1">
                    Otoritas Penandatangan{" "}
                    <span className="text-[#D93025]">*</span>
                  </label>
                  <select
                    required
                    value={formData.penandatangan}
                    onChange={handlePilihPengurus}
                    className="w-full bg-white border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] text-[#202124] transition-all"
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
                    <label className="block text-xs font-medium text-[#5F6368] mb-1">
                      Jabatan
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.jabatan}
                      readOnly
                      className="w-full bg-[#F1F3F4] border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none text-[#5F6368] cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#5F6368] mb-1">
                      Tanggal Sah <span className="text-[#D93025]">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) =>
                        setFormData({ ...formData, tanggal: e.target.value })
                      }
                      className="w-full bg-white border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] transition-all"
                    />
                  </div>
                </div>

                <button
                  disabled={isSubmitting || suratList.length === 0}
                  type="submit"
                  className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium py-2 rounded transition-colors mt-4 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <IconPlus /> Generate TTE System
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* KOLOM KANAN (Daftar Dokumen QR) */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm border border-[#DADCE0] overflow-hidden flex flex-col min-h-[500px]">
              {/* Toolbar & Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-white px-5 py-3 border-b border-[#DADCE0] gap-3">
                <div className="flex items-center gap-2 text-xs text-[#5F6368] font-medium">
                  <span>Tampilkan:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(
                        e.target.value === "all"
                          ? "all"
                          : Number(e.target.value),
                      );
                    }}
                    className="border border-[#DADCE0] rounded px-2 py-1 outline-none focus:border-[#1A73E8] bg-white cursor-pointer"
                  >
                    <option value={5}>5 Baris</option>
                    <option value={10}>10 Baris</option>
                    <option value="all">Semua Data</option>
                  </select>
                </div>

                {dokumenList.length > 0 && (
                  <div className="flex items-center gap-4 text-xs text-[#5F6368] font-medium">
                    <span>
                      {itemsPerPage === "all"
                        ? `1-${totalItems}`
                        : `${(currentPage - 1) * (itemsPerPage as number) + 1}-${Math.min(currentPage * (itemsPerPage as number), totalItems)}`}{" "}
                      dari {totalItems} Dokumen
                    </span>
                    {itemsPerPage !== "all" && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className="p-1 hover:bg-[#F1F3F4] disabled:opacity-30 rounded text-[#5F6368] transition-colors"
                        >
                          <IconPrev />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                          className="p-1 hover:bg-[#F1F3F4] disabled:opacity-30 rounded text-[#5F6368] transition-colors"
                        >
                          <IconNext />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isLoading ? (
                <div className="flex-1 flex justify-center items-center p-20">
                  <div className="w-8 h-8 border-4 border-[#DADCE0] border-t-[#1A73E8] rounded-full animate-spin"></div>
                </div>
              ) : dokumenList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-60">
                  <div className="w-12 h-12 bg-[#F1F3F4] text-[#5F6368] rounded-full flex items-center justify-center mb-3">
                    <IconQR />
                  </div>
                  <h3 className="font-medium text-[#202124] text-sm">
                    Repositori Kosong
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-1">
                    Gunakan formulir untuk membuat QR pertama.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1 bg-white">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[#5F6368] text-[11px] font-medium">
                        <th className="px-5 py-3 w-28">Visual QR</th>
                        <th className="px-5 py-3">Informasi Dokumen</th>
                        <th className="px-5 py-3 text-center">Status</th>
                        <th className="px-5 py-3 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EAED]">
                      {displayedDokumen.map((doc) => {
                        const validationUrl = `${baseUrl}/verifttd/${doc.id}`;
                        return (
                          <tr
                            key={doc.id}
                            className="hover:bg-[#F8F9FA] transition-colors"
                          >
                            <td className="px-5 py-4 align-top">
                              <div className="bg-white p-1.5 border border-[#DADCE0] rounded inline-block shadow-sm">
                                <QRCodeCanvas
                                  id={`qr-${doc.id}`}
                                  value={validationUrl}
                                  size={64}
                                  level={"H"}
                                  includeMargin={true}
                                />
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top">
                              <div className="font-medium text-[#1A73E8] text-[13px] mb-0.5">
                                {doc.nomorSurat}
                              </div>
                              <div className="text-xs text-[#202124] mb-2 truncate max-w-xs md:max-w-sm">
                                {doc.perihal}
                              </div>
                              <div className="text-[11px] text-[#5F6368]">
                                <span className="font-medium">Otoritas:</span>{" "}
                                {doc.penandatangan} <br />
                                <span className="font-medium">
                                  Disahkan:
                                </span>{" "}
                                {doc.tanggal}
                              </div>
                            </td>
                            <td className="px-5 py-4 align-top text-center">
                              {doc.isAttached ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#E6F4EA] text-[#1E8E3E] border border-[#CEEAD6] text-[10px] font-medium">
                                  Telah Dibubuhkan
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0] text-[10px] font-medium">
                                  Tersedia
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 align-top text-right">
                              <div className="flex flex-col items-end gap-1.5">
                                {doc.isAttached ? (
                                  <button
                                    onClick={() => handleCabutValidasi(doc)}
                                    className="flex items-center justify-center gap-1.5 w-32 bg-white hover:bg-[#FEF7E0] text-[#E37400] border border-[#DADCE0] hover:border-[#F29900] py-1.5 rounded text-xs font-medium transition-colors"
                                  >
                                    <IconDetach /> Cabut Tautan
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBubuhkanQR(doc)}
                                    className="flex items-center justify-center gap-1.5 w-32 bg-white hover:bg-[#E8F0FE] text-[#1A73E8] border border-[#DADCE0] hover:border-[#1A73E8] py-1.5 rounded text-xs font-medium transition-colors"
                                  >
                                    <IconAttach /> Bubuhkan
                                  </button>
                                )}

                                <button
                                  onClick={() =>
                                    downloadQR(doc.id, doc.nomorSurat)
                                  }
                                  className="flex items-center justify-center gap-1.5 w-32 bg-white hover:bg-[#F1F3F4] text-[#5F6368] border border-[#DADCE0] py-1.5 rounded text-xs font-medium transition-colors"
                                >
                                  <IconDownload /> Unduh Berkas
                                </button>

                                {!doc.isAttached && (
                                  <button
                                    onClick={() =>
                                      handleDeleteQR(doc.id, doc.nomorSurat)
                                    }
                                    className="flex items-center justify-center gap-1.5 w-32 bg-white hover:bg-[#FCE8E6] text-[#D93025] border border-transparent hover:border-[#FAD2CF] py-1.5 rounded text-xs font-medium transition-colors mt-1"
                                  >
                                    <IconTrash /> Hapus Sistem
                                  </button>
                                )}
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
