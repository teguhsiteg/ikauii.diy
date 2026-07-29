"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";

// Komponen Ikon Mini
const IconPlus = () => (
  <svg
    className="w-4 h-4"
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
);
const IconAlert = () => (
  <svg
    className="w-6 h-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);
const IconCheck = () => (
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
      d="M5 13l4 4L19 7"
    />
  </svg>
);

export default function TabSuratLegal({
  filterPeriodeId,
}: {
  filterPeriodeId: string;
}) {
  const [docsList, setDocsList] = useState<any[]>([]);
  const [periodeList, setPeriodeList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [editId, setEditId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterKategori, setFilterKategori] = useState("");

  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: "",
    title: "",
  });

  const [formData, setFormData] = useState({
    judul: "",
    nomor: "",
    tanggal: "",
    kategori: "Surat Edaran",
    status: "Berlaku",
    fileUrl: "",
    periodeId: "",
  });

  // --- FETCH DATA ARSIP & PERIODE ---
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const pSnap = await getDocs(
          query(collection(db, "periode"), orderBy("tglMulai", "desc")),
        );
        setPeriodeList(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        let q;
        if (filterPeriodeId === "Semua" || !filterPeriodeId) {
          q = query(
            collection(db, "surat_edaran"),
            orderBy("createdAt", "desc"),
          );
        } else {
          // Hindari error Composite Index
          q = query(
            collection(db, "surat_edaran"),
            where("periodeId", "==", filterPeriodeId),
          );
        }

        const snap = await getDocs(q);
        let data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Pengurutan manual di sisi Frontend
        if (filterPeriodeId !== "Semua" && filterPeriodeId) {
          data.sort(
            (a: any, b: any) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          );
        }

        setDocsList(data);
      } catch (error) {
        console.error("Gagal memuat dokumen legal:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [filterPeriodeId]);

  const filteredList = docsList.filter((d) => {
    const matchSearch =
      (d.judul || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.nomor || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchKategori = filterKategori ? d.kategori === filterKategori : true;
    return matchSearch && matchKategori;
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(
      () => setToast({ isOpen: false, message: "", type: "success" }),
      3500,
    );
  };

  const handleFormChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const payload = { ...formData, updatedAt: new Date().toISOString() };

      if (editId) {
        await updateDoc(doc(db, "surat_edaran", editId), payload);
        showToast("Dokumen berhasil diperbarui!", "success");
      } else {
        await addDoc(collection(db, "surat_edaran"), {
          ...payload,
          createdAt: new Date().toISOString(),
        });
        showToast("Dokumen baru berhasil ditambahkan!", "success");
      }

      // Refresh Data
      let q;
      if (filterPeriodeId === "Semua" || !filterPeriodeId) {
        q = query(collection(db, "surat_edaran"), orderBy("createdAt", "desc"));
      } else {
        q = query(
          collection(db, "surat_edaran"),
          where("periodeId", "==", filterPeriodeId),
        );
      }

      const snap = await getDocs(q);
      let newData = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      if (filterPeriodeId !== "Semua" && filterPeriodeId) {
        newData.sort(
          (a: any, b: any) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime(),
        );
      }
      setDocsList(newData);

      setViewMode("list");
      setEditId(null);
    } catch (error) {
      showToast("Gagal menyimpan dokumen.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      await deleteDoc(doc(db, "surat_edaran", deleteModal.id));
      setDocsList(docsList.filter((d) => d.id !== deleteModal.id));
      showToast("Dokumen berhasil dihapus permanen.", "success");
    } catch (error) {
      showToast("Gagal menghapus dokumen.", "error");
    } finally {
      setIsProcessing(false);
      setDeleteModal({ isOpen: false, id: "", title: "" });
    }
  };

  const openAddForm = () => {
    setFormData({
      judul: "",
      nomor: "",
      tanggal: "",
      kategori: "Surat Edaran",
      status: "Berlaku",
      fileUrl: "",
      periodeId:
        filterPeriodeId !== "Semua"
          ? filterPeriodeId
          : periodeList[0]?.id || "",
    });
    setEditId(null);
    setViewMode("form");
  };

  const openEditForm = (item: any) => {
    setFormData({
      judul: item.judul,
      nomor: item.nomor,
      tanggal: item.tanggal,
      kategori: item.kategori,
      status: item.status,
      fileUrl: item.fileUrl,
      periodeId: item.periodeId,
    });
    setEditId(item.id);
    setViewMode("form");
  };

  return (
    <div className="animate-in fade-in duration-300 relative">
      {/* TOAST NOTIFICATION */}
      <div
        className={`fixed top-6 right-6 z-[200] transition-all duration-300 transform ${toast.isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border ${toast.type === "success" ? "bg-white border-emerald-100" : "bg-white border-red-100"}`}
        >
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}
          >
            {toast.type === "success" ? <IconCheck /> : <IconAlert />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {toast.type === "success" ? "Berhasil!" : "Peringatan!"}
            </p>
            <p className="text-[13px] text-slate-500 mt-0.5">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* MODAL HAPUS */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center border border-slate-100 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-5 border-[4px] border-white shadow-sm">
              <IconAlert />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">
              Hapus Permanen?
            </h3>
            <p className="text-sm text-slate-500 mb-8 font-medium px-2 leading-relaxed">
              Anda yakin ingin menghapus dokumen{" "}
              <strong className="text-slate-800">"{deleteModal.title}"</strong>?
              Arsip tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({ isOpen: false, id: "", title: "" })
                }
                className="px-5 py-3 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-full"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isProcessing}
                className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md w-full"
              >
                {isProcessing ? "Proses..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <>
          {/* HEADER & FILTER LOKAL */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row justify-between items-center gap-5">
            <div className="flex gap-4 w-full md:w-auto items-end">
              <div className="flex-1 md:w-64 relative">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Pencarian Dokumen
                </label>
                <input
                  type="text"
                  placeholder="Ketik judul / nomor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="flex-1 md:w-48">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                  Kategori
                </label>
                <select
                  value={filterKategori}
                  onChange={(e) => setFilterKategori(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all cursor-pointer"
                >
                  <option value="">Semua Kategori</option>
                  <option value="Surat Edaran">Surat Edaran</option>
                  <option value="Surat Keputusan">Surat Keputusan</option>
                  <option value="Peraturan Organisasi">
                    Peraturan Organisasi
                  </option>
                </select>
              </div>
            </div>

            <div className="w-full md:w-auto mt-4 md:mt-0 pt-6">
              <button
                onClick={openAddForm}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2"
              >
                <IconPlus /> Tambah Arsip
              </button>
            </div>
          </div>

          {/* TABEL DATA */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-24 flex flex-col items-center justify-center text-slate-400">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                <p className="font-bold tracking-widest uppercase text-xs animate-pulse">
                  Menyiapkan Dokumen...
                </p>
              </div>
            ) : filteredList.length === 0 ? (
              <div className="p-24 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100 shadow-inner">
                  <span className="text-4xl">📜</span>
                </div>
                <h3 className="font-extrabold text-blue-950 text-xl mb-1">
                  Arsip Kosong
                </h3>
                <p className="text-sm text-slate-500 max-w-sm">
                  Belum ada dokumen surat yang diunggah pada periode
                  kepengurusan ini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-widest">
                      <th className="px-6 py-5 font-black">Informasi Surat</th>
                      <th className="px-6 py-5 font-black text-center">
                        Status
                      </th>
                      <th className="px-6 py-5 font-black text-center border-x border-slate-100 bg-blue-50/30">
                        File Unduhan
                      </th>
                      <th className="px-6 py-5 font-black text-right">
                        Aksi Manajemen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredList.map((d) => (
                      <tr
                        key={d.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-6 py-5 align-top">
                          <div className="font-extrabold text-blue-950 text-base mb-1.5 whitespace-normal max-w-sm line-clamp-2">
                            {d.judul}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] mb-1">
                            <span className="text-slate-600 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm uppercase tracking-wider">
                              {d.kategori}
                            </span>
                            <span className="text-blue-600 font-mono font-bold tracking-wider">
                              {d.nomor}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium mt-2">
                            Diterbitkan: {d.tanggal}
                          </div>
                        </td>

                        <td className="px-6 py-5 text-center align-middle">
                          <span
                            className={`text-[10px] font-black px-4 py-1.5 rounded-md border uppercase tracking-widest inline-block ${d.status === "Berlaku" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
                          >
                            {d.status}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-center border-x border-slate-100 align-middle">
                          {d.fileUrl ? (
                            <a
                              href={d.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white px-5 py-2 rounded-xl font-bold transition-all shadow-sm hover:shadow-md text-xs"
                            >
                              Buka Dokumen PDF
                            </a>
                          ) : (
                            <span className="inline-flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-xl border border-dashed border-slate-200">
                              Tidak Ada File
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5 text-right align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditForm(d)}
                              className="bg-white hover:bg-blue-50 text-blue-600 border border-slate-200 hover:border-blue-300 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                setDeleteModal({
                                  isOpen: true,
                                  id: d.id,
                                  title: d.judul,
                                })
                              }
                              className="bg-white hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-300 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm"
                            >
                              Hapus
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
        </>
      ) : (
        /* ==================== FORM TAMBAH/EDIT ==================== */
        <form
          onSubmit={handleSave}
          className="bg-white rounded-[2rem] border border-slate-200 p-8 sm:p-10 max-w-3xl mx-auto shadow-xl mt-6"
        >
          <h3 className="font-extrabold mb-8 text-2xl text-slate-900 border-b border-slate-100 pb-5">
            {editId ? "Edit Regulasi Organisasi" : "Unggah Arsip Dokumen Baru"}
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                Judul Dokumen / Perihal
              </label>
              <input
                type="text"
                name="judul"
                value={formData.judul}
                onChange={handleFormChange}
                required
                placeholder="Cth: Surat Edaran Tata Cara Pendaftaran E-KTA"
                className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors shadow-sm"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                  Nomor Surat Resmi
                </label>
                <input
                  type="text"
                  name="nomor"
                  value={formData.nomor}
                  onChange={handleFormChange}
                  required
                  placeholder="Cth: 01/SE/DPW/V/2026"
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm font-mono text-blue-900 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors shadow-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                  Tanggal Diterbitkan
                </label>
                <input
                  type="text"
                  name="tanggal"
                  value={formData.tanggal}
                  onChange={handleFormChange}
                  required
                  placeholder="Cth: 12 Mei 2026"
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors shadow-sm"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                  Kategori Dokumen
                </label>
                <select
                  name="kategori"
                  value={formData.kategori}
                  onChange={handleFormChange}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors shadow-sm cursor-pointer"
                >
                  <option value="Surat Edaran">Surat Edaran</option>
                  <option value="Surat Keputusan">Surat Keputusan</option>
                  <option value="Peraturan Organisasi">
                    Peraturan Organisasi
                  </option>
                  <option value="SOP / Panduan">SOP / Panduan</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                  Status Keberlakuan
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors shadow-sm cursor-pointer"
                >
                  <option value="Berlaku">Berlaku Aktif</option>
                  <option value="Dicabut">Dicabut / Kadaluarsa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                URL Tautan Dokumen (Google Drive / PDF Link)
              </label>
              <input
                type="url"
                name="fileUrl"
                value={formData.fileUrl}
                onChange={handleFormChange}
                required
                placeholder="https://drive.google.com/..."
                className="w-full border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1A73E8] mb-2 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded w-fit">
                Terikat Pada Masa Periode
              </label>
              <select
                name="periodeId"
                value={formData.periodeId}
                onChange={handleFormChange}
                required
                className="w-full border-2 border-blue-200 px-4 py-3 rounded-xl text-sm font-bold text-[#1A73E8] outline-none focus:border-blue-500 bg-[#E8F0FE] shadow-sm cursor-pointer"
              >
                <option value="" disabled>
                  -- Pilih Periode Kepengurusan --
                </option>
                {periodeList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaPeriode} {p.status === "Aktif" ? "(Aktif)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="px-6 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-md shadow-blue-500/20 disabled:opacity-70 flex items-center gap-2"
            >
              {isProcessing ? "Menyimpan..." : "Simpan Dokumen"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
