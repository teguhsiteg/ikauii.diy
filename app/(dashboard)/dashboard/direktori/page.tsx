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

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    namaAlumni: "",
    fakultasAngkatan: "",
    namaBisnis: "",
    kategori: "Kuliner",
    deskripsi: "",
    waBisnis: "",
    linkBisnis: "",
    foto: "", // URL Foto
  });

  // 1. Fetch Data dari Firestore
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
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Buka Modal Tambah/Edit
  const handleOpenModal = (mode: "add" | "edit", data: any = null) => {
    setModalMode(mode);
    if (mode === "edit" && data) {
      setSelectedId(data.id);
      setFormData({
        namaAlumni: data.namaAlumni || data.owner || "",
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

  // 3. Simpan Data (Add / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (modalMode === "add") {
        await addDoc(collection(db, "direktori_bisnis"), {
          ...formData,
          createdAt: serverTimestamp(),
        });
        alert("✅ Bisnis berhasil ditambahkan!");
      } else if (modalMode === "edit" && selectedId) {
        await updateDoc(doc(db, "direktori_bisnis", selectedId), {
          ...formData,
        });
        alert("✅ Data bisnis berhasil diperbarui!");
      }
      setIsModalOpen(false);
      fetchData(); // Refresh tabel
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      alert("❌ Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Hapus Data
  const handleDelete = async (id: string, namaBisnis: string) => {
    if (
      confirm(`Yakin ingin menghapus bisnis "${namaBisnis}" dari direktori?`)
    ) {
      try {
        await deleteDoc(doc(db, "direktori_bisnis", id));
        fetchData(); // Refresh tabel
      } catch (error) {
        console.error("Gagal menghapus:", error);
        alert("❌ Gagal menghapus data.");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest">
            Katalog UMKM
          </div>
          <h2 className="text-3xl font-extrabold text-blue-950 mb-2">
            Kelola Direktori Bisnis
          </h2>
          <p className="text-slate-500 text-sm max-w-2xl">
            Tambahkan atau perbarui data usaha/bisnis alumni yang telah
            diverifikasi untuk ditayangkan di halaman publik.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal("add")}
          className="bg-blue-900 hover:bg-blue-950 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-colors shrink-0 flex items-center justify-center gap-2"
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
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Bisnis Baru
        </button>
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
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
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="text-2xl font-black text-blue-950 mb-6 flex items-center gap-2">
              <span className="text-3xl">
                {modalMode === "add" ? "🏪" : "✏️"}
              </span>
              {modalMode === "add" ? "Tambah Bisnis Baru" : "Edit Data Bisnis"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nama Pemilik (Alumni)
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.namaAlumni}
                    onChange={(e) =>
                      setFormData({ ...formData, namaAlumni: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-sm font-medium"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-sm font-medium"
                    placeholder="Contoh: FTI 2012"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nama Bisnis / Usaha
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.namaBisnis}
                    onChange={(e) =>
                      setFormData({ ...formData, namaBisnis: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-sm font-medium"
                    placeholder="Contoh: Kopi Kenangan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Kategori
                  </label>
                  <select
                    required
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-sm font-medium"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Deskripsi Singkat
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-sm font-medium resize-none"
                  placeholder="Deskripsikan produk/jasa yang ditawarkan..."
                ></textarea>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    No. WA Bisnis
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.waBisnis}
                    onChange={(e) =>
                      setFormData({ ...formData, waBisnis: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-sm font-medium"
                    placeholder="Contoh: 08123456789"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Link Website / IG (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formData.linkBisnis}
                    onChange={(e) =>
                      setFormData({ ...formData, linkBisnis: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-sm font-medium"
                    placeholder="Contoh: instagram.com/kopikenangan"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  URL Foto / Banner Bisnis (Opsional)
                </label>
                <input
                  type="text"
                  value={formData.foto}
                  onChange={(e) =>
                    setFormData({ ...formData, foto: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none text-sm font-medium"
                  placeholder="Masukkan Link URL Gambar (Google Drive / Imgur / dll)"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Kosongkan jika belum ada gambar. Sistem akan menggunakan
                  ilustrasi default.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4 disabled:opacity-50"
              >
                {isSaving
                  ? "Menyimpan Data..."
                  : "💾 Simpan Bisnis ke Direktori"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TABEL DATA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center animate-pulse text-slate-400 font-bold flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            Memuat Database Direktori...
          </div>
        ) : bisnisList.length === 0 ? (
          <div className="p-20 text-center">
            <span className="text-5xl opacity-50 block mb-4">🏪</span>
            <h3 className="font-bold text-slate-700 text-lg">
              Belum Ada Direktori Bisnis
            </h3>
            <p className="text-slate-500 text-sm">
              Tambahkan data bisnis alumni untuk ditampilkan di website.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-5 font-bold">Informasi Usaha</th>
                  <th className="p-5 font-bold">Pemilik (Alumni)</th>
                  <th className="p-5 font-bold">Kontak</th>
                  <th className="p-5 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bisnisList.map((b) => (
                  <tr
                    key={b.id}
                    className="hover:bg-blue-50/30 transition-colors text-sm"
                  >
                    {/* Kolom Info Bisnis */}
                    <td className="p-5 align-top">
                      <div className="flex gap-4 items-start">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 shrink-0 overflow-hidden border border-slate-200 flex items-center justify-center">
                          {b.foto ? (
                            <img
                              src={b.foto}
                              alt={b.namaBisnis || b.nama}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl opacity-30">🏪</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-blue-950 text-base leading-tight mb-1">
                            {b.namaBisnis || b.nama}
                          </p>
                          <span className="inline-block bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mb-2">
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
                      <p className="font-bold text-slate-800">
                        {b.namaAlumni || b.owner}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {b.fakultasAngkatan}
                      </p>
                    </td>

                    {/* Kolom Kontak */}
                    <td className="p-5 align-top space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-green-600">
                        <span>💬</span> {b.waBisnis || b.wa}
                      </div>
                      {b.linkBisnis && (
                        <div className="flex items-center gap-2 text-xs font-medium text-blue-500 hover:underline">
                          <span>🌐</span>
                          <a
                            href={
                              b.linkBisnis.startsWith("http")
                                ? b.linkBisnis
                                : `https://${b.linkBisnis}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="truncate max-w-[150px] inline-block"
                          >
                            {b.linkBisnis}
                          </a>
                        </div>
                      )}
                    </td>

                    {/* Kolom Aksi */}
                    <td className="p-5 align-top text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal("edit", b)}
                          className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-bold text-xs transition-colors border border-blue-100"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(b.id, b.namaBisnis || b.nama)
                          }
                          className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-600 px-3 py-2 rounded-lg font-bold text-xs transition-colors border border-red-100"
                        >
                          🗑️ Hapus
                        </button>
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
