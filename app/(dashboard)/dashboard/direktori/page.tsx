"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

const KATEGORI_LIST = [
  "Kuliner",
  "Teknologi",
  "Jasa",
  "Retail",
  "Kesehatan",
  "Pendidikan",
  "Properti",
  "Lainnya",
];

export default function AdminDirektoriPage() {
  const [bisnisList, setBisnisList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState<string | null>(null);

  // Custom Dialog State (Pengganti alert & confirm browser)
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

  // Form State
  const [formData, setFormData] = useState({
    namaAlumni: "",
    email: "",
    fakultasAngkatan: "",
    namaBisnis: "",
    kategori: "Kuliner",
    deskripsi: "",
    waBisnis: "",
    linkBisnis: "",
    foto: "",
  });

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });

  const showAlert = (title: string, message: string) => {
    setDialog({ isOpen: true, type: "alert", title, message });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setDialog({ isOpen: true, type: "confirm", title, message, onConfirm });
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "direktori_bisnis"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      setBisnisList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Gagal memuat data direktori:", error);
      showAlert(
        "Kesalahan Sistem",
        "Gagal memuat data direktori dari database.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (mode: "add" | "edit", data: any = null) => {
    setModalMode(mode);
    if (mode === "edit" && data) {
      setSelectedId(data.id);
      setFormData({
        namaAlumni: data.namaAlumni || data.owner || "",
        email: data.email || "",
        fakultasAngkatan: data.fakultasAngkatan || "",
        namaBisnis: data.namaBisnis || data.nama || "",
        kategori: data.kategori || "Kuliner",
        deskripsi: data.deskripsi || "",
        waBisnis: data.waBisnis || data.wa || "",
        linkBisnis: data.linkBisnis || "",
        foto: data.foto || "",
      });
    } else {
      setSelectedId(null);
      setFormData({
        namaAlumni: "",
        email: "",
        fakultasAngkatan: "",
        namaBisnis: "",
        kategori: "Kuliner",
        deskripsi: "",
        waBisnis: "",
        linkBisnis: "",
        foto: "",
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (modalMode === "add") {
        await addDoc(collection(db, "direktori_bisnis"), {
          ...formData,
          emailSent: false, // Default belum dikirim
          createdAt: serverTimestamp(),
        });
        showAlert("Berhasil", "Data bisnis baru berhasil ditambahkan.");
      } else if (modalMode === "edit" && selectedId) {
        await updateDoc(doc(db, "direktori_bisnis", selectedId), {
          ...formData,
        });
        showAlert("Berhasil", "Data bisnis berhasil diperbarui.");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan data ke sistem.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string, namaBisnis: string) => {
    showConfirm(
      "Hapus Data Bisnis",
      `Apakah Anda yakin ingin menghapus "${namaBisnis}" dari direktori? Tindakan ini tidak dapat dibatalkan.`,
      async () => {
        try {
          await deleteDoc(doc(db, "direktori_bisnis", id));
          closeDialog();
          fetchData();
          setTimeout(
            () => showAlert("Dihapus", "Data bisnis berhasil dihapus."),
            300,
          );
        } catch (error) {
          console.error("Gagal menghapus:", error);
          closeDialog();
          setTimeout(
            () => showAlert("Gagal", "Terjadi kesalahan saat menghapus data."),
            300,
          );
        }
      },
    );
  };

  const handleSendEmail = (bisnisData: any) => {
    if (!bisnisData.email) {
      showAlert(
        "Perhatian",
        "Alamat email pemilik bisnis tidak tersedia. Silakan Edit data dan tambahkan email terlebih dahulu.",
      );
      return;
    }

    showConfirm(
      "Kirim Notifikasi Publikasi",
      `Email pemberitahuan penayangan direktori akan dikirimkan ke alamat ${bisnisData.email}. Lanjutkan?`,
      async () => {
        closeDialog();
        setIsSendingMail(bisnisData.id);

        try {
          const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "directory_published",
              email: bisnisData.email,
              nama: bisnisData.namaAlumni || bisnisData.owner || "Alumni",
              detail: {
                namaBisnis:
                  bisnisData.namaBisnis || bisnisData.nama || "Bisnis Alumni",
              },
            }),
          });

          if (response.ok) {
            // Update database bahwa email sudah terkirim
            await updateDoc(doc(db, "direktori_bisnis", bisnisData.id), {
              emailSent: true,
            });
            // Update UI secara real-time
            setBisnisList((prev) =>
              prev.map((item) =>
                item.id === bisnisData.id ? { ...item, emailSent: true } : item,
              ),
            );
            setTimeout(
              () =>
                showAlert(
                  "Terkirim",
                  `Email berhasil dikirim ke ${bisnisData.email}.`,
                ),
              300,
            );
          } else {
            const errorData = await response.json();
            setTimeout(
              () =>
                showAlert(
                  "Gagal Terkirim",
                  `Sistem menolak pengiriman: ${errorData.error}`,
                ),
              300,
            );
          }
        } catch (error) {
          console.error(error);
          setTimeout(
            () =>
              showAlert(
                "Kesalahan Jaringan",
                "Terjadi kesalahan sistem saat mencoba mengirim email.",
              ),
            300,
          );
        } finally {
          setIsSendingMail(null);
        }
      },
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 font-sans text-slate-800">
      {/* CUSTOM DIALOG (ALERT & CONFIRM) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden border border-[#DADCE0] animate-in zoom-in-95">
            <div className="px-6 py-5">
              <h2
                className={`text-lg font-medium mb-2 ${dialog.type === "confirm" ? "text-slate-800" : dialog.title.includes("Gagal") || dialog.title.includes("Perhatian") ? "text-[#D93025]" : "text-[#1A73E8]"}`}
              >
                {dialog.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {dialog.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex justify-end gap-3">
              {dialog.type === "confirm" && (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                onClick={
                  dialog.type === "confirm" ? dialog.onConfirm : closeDialog
                }
                className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors shadow-sm ${dialog.title.includes("Hapus") ? "bg-[#D93025] hover:bg-[#b52a1f]" : "bg-[#1A73E8] hover:bg-[#1557B0]"}`}
              >
                {dialog.type === "confirm"
                  ? dialog.title.includes("Hapus")
                    ? "Hapus"
                    : "Lanjutkan"
                  : "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-block bg-[#E8F0FE] text-[#1A73E8] text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest border border-blue-100">
            Katalog Bisnis
          </div>
          <h2 className="text-3xl font-medium text-slate-800 mb-2 tracking-tight">
            Kelola Direktori Bisnis
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl">
            Tambahkan atau perbarui data usaha/bisnis alumni yang telah
            diverifikasi untuk ditayangkan di halaman publik.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal("add")}
          className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-sm transition-colors shrink-0 flex items-center justify-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Bisnis Baru
        </button>
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar border border-[#DADCE0]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-[#FCE8E6] hover:text-[#D93025] transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-xl font-medium text-slate-800 mb-6 flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {modalMode === "add" ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  )}
                </svg>
              </span>
              {modalMode === "add" ? "Tambah Bisnis Baru" : "Edit Data Bisnis"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Nama Pemilik (Alumni)
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.namaAlumni}
                    onChange={(e) =>
                      setFormData({ ...formData, namaAlumni: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Email Pemilik <span className="text-[#D93025]">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    placeholder="contoh@email.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Fakultas / Angkatan
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.fakultasAngkatan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fakultasAngkatan: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    placeholder="Contoh: FTI 2012"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Kategori
                  </label>
                  <select
                    required
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  >
                    {KATEGORI_LIST.map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Nama Bisnis / Usaha
                </label>
                <input
                  required
                  type="text"
                  value={formData.namaBisnis}
                  onChange={(e) =>
                    setFormData({ ...formData, namaBisnis: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors font-bold text-slate-800"
                  placeholder="Contoh: Kopi Kenangan"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  Deskripsi Singkat
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors resize-none custom-scrollbar"
                  placeholder="Deskripsikan produk/jasa yang ditawarkan..."
                ></textarea>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    No. WA Bisnis
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.waBisnis}
                    onChange={(e) =>
                      setFormData({ ...formData, waBisnis: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Link Website / IG (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.linkBisnis}
                    onChange={(e) =>
                      setFormData({ ...formData, linkBisnis: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    placeholder="Contoh: instagram.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                  URL Foto / Banner Bisnis (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.foto}
                  onChange={(e) =>
                    setFormData({ ...formData, foto: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  placeholder="Masukkan Link URL Gambar (Drive/Imgur/dll)"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Kosongkan jika belum ada gambar. Sistem akan menggunakan
                  ilustrasi default.
                </p>
              </div>

              <div className="pt-4 border-t border-[#DADCE0] mt-6">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium py-3 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan Data..." : "Simpan Data Bisnis"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABEL DATA */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#DADCE0] overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center animate-pulse text-[#1A73E8] font-medium flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-[#E8F0FE] border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
            Memuat Database Direktori...
          </div>
        ) : bisnisList.length === 0 ? (
          <div className="p-20 text-center">
            <svg
              className="w-16 h-16 text-slate-300 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="font-medium text-slate-700 text-lg">
              Belum Ada Direktori Bisnis
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              Tambahkan data bisnis alumni untuk ditampilkan di website.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-xs uppercase tracking-widest text-slate-500 font-bold">
                  <th className="p-5 w-1/3">Informasi Usaha</th>
                  <th className="p-5 w-1/4">Pemilik (Alumni)</th>
                  <th className="p-5 w-1/4">Kontak</th>
                  <th className="p-5 text-right">Aksi & Notifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0]">
                {bisnisList.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-[#F8F9FA] transition-colors text-sm"
                  >
                    {/* Kolom Info Bisnis */}
                    <td className="p-5 align-top">
                      <div className="flex gap-4 items-start">
                        <div className="w-14 h-14 rounded-lg bg-slate-100 shrink-0 overflow-hidden border border-[#DADCE0] flex items-center justify-center">
                          {b.foto ? (
                            <img
                              src={b.foto}
                              alt={b.namaBisnis || b.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg
                              className="w-6 h-6 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-base leading-tight mb-1 line-clamp-1">
                            {b.namaBisnis || b.nama}
                          </p>
                          <span className="inline-block bg-[#F8F9FA] text-slate-600 border border-[#DADCE0] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-2">
                            {b.kategori}
                          </span>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {b.deskripsi}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Kolom Pemilik */}
                    <td className="p-5 align-top">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-700">
                        <svg
                          className="w-4 h-4 text-slate-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        <p className="font-bold">{b.namaAlumni || b.owner}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <svg
                          className="w-4 h-4 text-slate-400 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l9-5-9-5-9 5 9 5z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 14l9-5-9-5-9 5 9 5zm0 0v6"
                          />
                        </svg>
                        <p>{b.fakultasAngkatan}</p>
                      </div>
                    </td>

                    {/* Kolom Kontak */}
                    <td className="p-5 align-top space-y-2">
                      {b.email && (
                        <div
                          className="flex items-center gap-2 text-xs font-medium text-slate-600 truncate max-w-[200px]"
                          title={b.email}
                        >
                          <svg
                            className="w-3.5 h-3.5 text-slate-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          {b.email}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs font-medium text-[#1E8E3E]">
                        <svg
                          className="w-3.5 h-3.5 text-[#1E8E3E] shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {b.waBisnis || b.wa}
                      </div>
                      {b.linkBisnis && (
                        <div className="flex items-center gap-2 text-xs font-medium text-[#1A73E8]">
                          <svg
                            className="w-3.5 h-3.5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          <a
                            href={
                              b.linkBisnis.startsWith("http")
                                ? b.linkBisnis
                                : `https://${b.linkBisnis}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="truncate max-w-[150px] inline-block hover:underline"
                          >
                            {b.linkBisnis}
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Kolom Aksi */}
                    <td className="p-5 align-top">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal("edit", b)}
                            className="flex items-center justify-center gap-1.5 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] text-slate-600 px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm w-full"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(b.id, b.namaBisnis || b.nama)
                            }
                            className="flex items-center justify-center gap-1.5 bg-white border border-[#DADCE0] hover:bg-[#FCE8E6] text-[#D93025] px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm w-full"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Hapus
                          </button>
                        </div>

                        {/* 🔥 TOMBOL KIRIM EMAIL API DENGAN STATE EMAIL SENT 🔥 */}
                        {b.emailSent ? (
                          <button
                            disabled
                            className="flex items-center justify-center gap-1.5 bg-[#E6F4EA] border border-[#CEEAD6] text-[#137333] px-3 py-1.5 rounded text-xs font-bold w-full opacity-70 cursor-not-allowed"
                          >
                            <svg
                              className="w-3.5 h-3.5"
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
                            Terkirim
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendEmail(b)}
                            disabled={isSendingMail === b.id}
                            className="flex items-center justify-center gap-1.5 bg-white border border-[#DADCE0] hover:bg-[#E8F0FE] hover:text-[#1A73E8] hover:border-[#1A73E8]/30 text-slate-700 px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm w-full disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {isSendingMail === b.id ? (
                              <svg
                                className="w-3.5 h-3.5 animate-spin"
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
                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                ></path>
                              </svg>
                            ) : (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                                />
                              </svg>
                            )}
                            {isSendingMail === b.id
                              ? "Mengirim..."
                              : "Kirim Email Publikasi"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
