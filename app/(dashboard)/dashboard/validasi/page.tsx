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
    
    // Auto-fill Penandatangan based on pembuat
    const pembuat = surat?.pembuat || "";
    const jabatanPembuat = surat?.jabatanPembuat || "";
    
    setFormData({
      ...formData,
      nomorSurat: nomor,
      perihal: surat ? surat.perihal : "", // Ambil 'perihal' dari E-Office
      penandatangan: pembuat,
      jabatan: jabatanPembuat,
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
    <div className="min-h-screen pb-12 font-sans text-slate-800">
      {/* CUSTOM DIALOG */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
          <div className="bg-white/95 rounded-2xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="px-6 py-5">
              <h2
                className={`text-xl font-bold mb-2 ${dialog.title.includes("Gagal") || dialog.title.includes("Cabut") || dialog.title.includes("Hapus") || dialog.title.includes("Peringatan") ? "text-red-600" : "text-blue-700"}`}
              >
                {dialog.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                {dialog.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex justify-end gap-2">
              {dialog.type === "confirm" && (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
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
                className={`px-4 py-2 text-sm font-semibold text-white rounded-xl transition-all shadow-md ${dialog.title.includes("Cabut") || dialog.title.includes("Hapus") ? "bg-red-600 hover:bg-red-700" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"}`}
              >
                {dialog.type === "confirm" ? "Lanjutkan" : "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* --- HEADER PREMIUM --- */}
        <div className="mb-6 mt-4 border-b border-slate-200 pb-5">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest border border-blue-200 shadow-sm">
            <IconQR /> Tanda Tangan Elektronik
          </div>
          <h2 className="text-2xl font-medium text-slate-900 mb-1 tracking-tight">
            Validasi & Otorisasi
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl">
            Buat, bubuhkan, dan kelola QR Code validasi keaslian dokumen untuk
            surat-surat dari sistem E-Office.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* KOLOM KIRI (Form) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-5 flex items-center gap-2">
                Buat Segel QR Baru
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Pilih Surat dari E-Office{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.nomorSurat}
                    onChange={handlePilihSurat}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-800 transition-all"
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Subjek / Perihal Surat
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.perihal}
                    readOnly
                    className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Otoritas Penandatangan{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.penandatangan}
                    onChange={handlePilihPengurus}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 text-slate-800 transition-all"
                  >
                    <option value="">-- Pilih Pengurus Berwenang --</option>
                    {/* Fallback jika ada dari E-Office tapi tidak ada di list */}
                    {formData.penandatangan && !pengurusList.some(p => p.nama === formData.penandatangan) && (
                      <option value={formData.penandatangan}>{formData.penandatangan}</option>
                    )}
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Jabatan
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.jabatan}
                      readOnly
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Tanggal Sah <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) =>
                        setFormData({ ...formData, tanggal: e.target.value })
                      }
                      className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  disabled={isSubmitting || suratList.length === 0}
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all mt-4 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
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
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[500px]">
              {/* Toolbar & Pagination */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 px-5 py-4 border-b border-slate-200 gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
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
                    className="border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 bg-white cursor-pointer"
                  >
                    <option value={5}>5 Baris</option>
                    <option value={10}>10 Baris</option>
                    <option value="all">Semua Data</option>
                  </select>
                </div>

                {dokumenList.length > 0 && (
                  <div className="flex items-center gap-4 text-sm text-slate-500 font-medium">
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
                          className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-500 transition-colors"
                        >
                          <IconPrev />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                          className="p-1 hover:bg-slate-200 disabled:opacity-30 rounded text-slate-500 transition-colors"
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
                  <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : dokumenList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-60">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
                    <IconQR />
                  </div>
                  <h3 className="font-medium text-slate-800 text-lg">
                    Repositori Kosong
                  </h3>
                  <p className="text-sm text-slate-500 mt-1 text-center max-w-xs">
                    Gunakan formulir untuk membuat QR pertama Anda.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto flex-1 bg-white">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                        <th className="px-6 py-4 w-28">Visual QR</th>
                        <th className="px-6 py-4">Informasi Dokumen</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {displayedDokumen.map((doc) => {
                        const validationUrl = `${baseUrl}/verifttd/${doc.id}`;
                        return (
                          <tr
                            key={doc.id}
                            className="hover:bg-slate-50 transition-colors group"
                          >
                            <td className="px-6 py-5 align-top">
                              <div className="bg-white p-2 border border-slate-200 rounded-xl inline-block shadow-sm group-hover:shadow-md transition-all">
                                <QRCodeCanvas
                                  id={`qr-${doc.id}`}
                                  value={validationUrl}
                                  size={64}
                                  level={"H"}
                                  includeMargin={true}
                                />
                              </div>
                            </td>
                            <td className="px-6 py-5 align-top">
                              <div className="font-semibold text-blue-700 text-sm mb-1">
                                {doc.nomorSurat}
                              </div>
                              <div className="text-sm text-slate-800 mb-2 truncate max-w-xs md:max-w-sm">
                                {doc.perihal}
                              </div>
                              <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <span className="font-semibold text-slate-700">Otoritas:</span>{" "}
                                {doc.penandatangan} <br />
                                <span className="font-semibold text-slate-700 mt-1 inline-block">
                                  Disahkan:
                                </span>{" "}
                                {doc.tanggal}
                              </div>
                            </td>
                            <td className="px-6 py-5 align-top text-center">
                              {doc.isAttached ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                  Telah Dibubuhkan
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                                  Belum Dibubuhkan
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-5 align-top text-right">
                              <div className="flex flex-col gap-2 items-end">
                                <div className="flex gap-2">
                                  {!doc.isAttached ? (
                                    <button
                                      onClick={() => handleBubuhkanQR(doc)}
                                      title="Bubuhkan ke Surat E-Office"
                                      className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100 flex items-center gap-2 text-xs font-semibold shadow-sm"
                                    >
                                      <IconAttach /> Pasang
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleCabutValidasi(doc)}
                                      title="Cabut Validasi"
                                      className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-100 flex items-center gap-2 text-xs font-semibold shadow-sm"
                                    >
                                      <IconDetach /> Cabut
                                    </button>
                                  )}
                                </div>
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() =>
                                      downloadQR(doc.id, doc.nomorSurat)
                                    }
                                    title="Download Gambar QR"
                                    className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold shadow-sm"
                                  >
                                    <IconDownload /> Unduh
                                  </button>
                                  {!doc.isAttached && (
                                    <button
                                      onClick={() =>
                                        handleDeleteQR(doc.id, doc.nomorSurat)
                                      }
                                      title="Hapus Permanen QR"
                                      className="p-2 text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-colors flex items-center gap-2 text-xs font-semibold shadow-sm"
                                    >
                                      <IconTrash /> Hapus
                                    </button>
                                  )}
                                </div>
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
