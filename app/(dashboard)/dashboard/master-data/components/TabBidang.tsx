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
} from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  IconPlus,
  IconDownload,
  IconUpload,
  IconCheck,
  IconAlert,
  IconEmpty,
} from "./Icons";

export default function TabBidang() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [view, setView] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    namaBidang: "",
    deskripsi: "",
  });

  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: "",
    title: "",
    type: "single",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, isOpen: false })), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "bidang"), orderBy("namaBidang", "asc")),
      );
      setDataList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      showToast("Gagal load data bidang.", "error");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormChange = (e: any) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const saveData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "bidang", editId), {
          ...form,
          updatedAt: new Date().toISOString(),
        });
        showToast("Bidang berhasil diperbarui.", "success");
      } else {
        await addDoc(collection(db, "bidang"), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        showToast("Bidang baru berhasil ditambahkan.", "success");
      }
      setForm({ namaBidang: "", deskripsi: "" });
      setEditId(null);
      await fetchData();
      setView("list");
    } catch (error) {
      showToast("Gagal menyimpan data.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      if (deleteModal.type === "single" && deleteModal.id) {
        await deleteDoc(doc(db, "bidang", deleteModal.id));
      } else if (deleteModal.type === "bulk" && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((id) => deleteDoc(doc(db, "bidang", id))),
        );
      }
      showToast("Data berhasil dihapus permanen.", "success");
      await fetchData();
    } catch (error) {
      showToast("Gagal menghapus data.", "error");
    } finally {
      setIsProcessing(false);
      setDeleteModal({ isOpen: false, id: "", title: "", type: "single" });
    }
  };

  // --- LOGIKA EXCEL ---
  const handleExportData = () => {
    if (dataList.length === 0)
      return showToast("Tidak ada data untuk diekspor.", "error");
    const formattedData = dataList.map((d) => ({ Nama_Bidang: d.namaBidang }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Bidang");
    XLSX.writeFile(wb, `Data_BIDANG_IKA_UII.xlsx`);
  };

  const downloadTemplateExcel = () => {
    const ws = XLSX.utils.json_to_sheet([{ Nama_Bidang: "Dewan Pakar" }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Template_Import_BIDANG.xlsx`);
  };

  const handleImportExcel = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let count = 0;
        for (const row of data as any[]) {
          if (row.Nama_Bidang) {
            await addDoc(collection(db, "bidang"), {
              namaBidang: row.Nama_Bidang,
              deskripsi: "",
              createdAt: new Date().toISOString(),
            });
            count++;
          }
        }
        showToast(`${count} Data berhasil di-import!`, "success");
        await fetchData();
      } catch (error) {
        showToast("Gagal membaca Excel.", "error");
      } finally {
        setIsProcessing(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="relative">
      {/* LOCAL TOAST */}
      <div
        className={`fixed top-6 right-6 z-[200] transition-all duration-300 transform ${toast.isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border ${toast.type === "success" ? "bg-white border-emerald-100" : "bg-white border-red-100"}`}
        >
          <div
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
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

      {/* DELETE MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center border border-[#DADCE0] animate-in zoom-in-95">
            <div className="flex justify-center text-[#D93025] mb-3">
              <IconAlert />
            </div>
            <h3 className="text-lg font-medium text-[#202124] mb-1">
              Hapus Permanen?
            </h3>
            <p className="text-sm text-[#5F6368] mb-6">
              Anda yakin ingin menghapus <strong>"{deleteModal.title}"</strong>?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    id: "",
                    title: "",
                    type: "single",
                  })
                }
                className="px-4 py-2 rounded-lg text-sm font-medium border w-full hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#D93025] hover:bg-[#b52a1f] w-full"
              >
                {isProcessing ? "Proses..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "list" ? (
        <div className="bg-white rounded-lg border border-[#DADCE0] shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DADCE0]">
            <h3 className="font-medium text-[#202124] text-base">
              Daftar Bidang Organisasi
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      type: "bulk",
                      id: "",
                      title: `${selectedIds.length} Data Terpilih`,
                    })
                  }
                  className="text-xs text-[#D93025] border border-[#FCE8E6] bg-white hover:bg-[#FCE8E6] px-4 py-2.5 rounded-lg font-bold"
                >
                  Hapus ({selectedIds.length})
                </button>
              )}
              <button
                onClick={handleExportData}
                className="text-xs font-bold text-slate-700 border px-4 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <IconDownload /> Export
              </button>
              <button
                onClick={downloadTemplateExcel}
                className="text-xs font-bold text-slate-700 border px-4 py-2.5 rounded-lg hover:bg-slate-50"
              >
                Template
              </button>
              <label className="cursor-pointer text-xs font-bold text-slate-700 border bg-[#F8F9FA] px-4 py-2.5 rounded-lg hover:bg-slate-100 flex items-center gap-2">
                <IconUpload /> Import
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportExcel}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => {
                  setView("form");
                  setEditId(null);
                  setForm({ namaBidang: "", deskripsi: "" });
                }}
                className="text-xs bg-[#1A73E8] text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 hover:bg-[#1557B0]"
              >
                <IconPlus /> Tambah Baru
              </button>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
              <div className="p-10 text-center text-slate-500">
                Memuat data...
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#F8F9FA] border-b text-[#5F6368]">
                  <tr>
                    <th className="px-6 py-3 w-8">
                      <input
                        type="checkbox"
                        onChange={(e) =>
                          setSelectedIds(
                            e.target.checked ? dataList.map((d) => d.id) : [],
                          )
                        }
                        checked={
                          dataList.length > 0 &&
                          selectedIds.length === dataList.length
                        }
                        className="rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 font-medium text-xs uppercase">
                      Nama Bidang
                    </th>
                    <th className="px-6 py-3 font-medium text-xs uppercase text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]">
                  {dataList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-16">
                        <IconEmpty />
                        <p className="text-slate-500">Belum Ada Bidang</p>
                      </td>
                    </tr>
                  ) : (
                    dataList.map((p) => (
                      <tr key={p.id} className="hover:bg-[#F8F9FA]">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(p.id)}
                            onChange={(e) =>
                              setSelectedIds((prev) =>
                                e.target.checked
                                  ? [...prev, p.id]
                                  : prev.filter((id) => id !== p.id),
                              )
                            }
                            className="rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-[#202124] text-sm">
                          {p.namaBidang}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setForm(p);
                              setEditId(p.id);
                              setView("form");
                            }}
                            className="text-[#1A73E8] font-medium px-3 py-1.5 hover:bg-[#E8F0FE] rounded transition-colors"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={saveData}
          className="bg-white rounded-lg border border-[#DADCE0] p-6 sm:p-8 max-w-md mx-auto shadow-sm"
        >
          <h3 className="font-medium mb-6 text-lg border-b pb-4">
            {editId ? "Edit Bidang" : "Buat Bidang Baru"}
          </h3>
          <div>
            <label className="block text-xs font-medium text-[#5F6368] mb-1">
              Nama Bidang / Departemen
            </label>
            <input
              type="text"
              name="namaBidang"
              value={form.namaBidang}
              onChange={handleFormChange}
              required
              placeholder="Contoh: Dewan Penasihat"
              className="w-full border px-3 py-2 rounded text-sm focus:border-[#1A73E8] outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-5 py-2 text-sm font-medium border rounded hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1A73E8] rounded hover:bg-[#1557B0]"
            >
              {isProcessing ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
