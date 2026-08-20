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

export default function TabDPD() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [view, setView] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    nama: "",
    ketua: "",
    status: "Aktif",
    fotoUrl: "",
    fotoPosition: "center",
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
        query(collection(db, "dpd"), orderBy("nama", "asc")),
      );
      setDataList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      showToast("Gagal memuat data DPD.", "error");
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
        await updateDoc(doc(db, "dpd", editId), {
          ...form,
          updatedAt: new Date().toISOString(),
        });
        showToast("Data DPD diperbarui.", "success");
      } else {
        await addDoc(collection(db, "dpd"), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        showToast("Data DPD baru ditambahkan.", "success");
      }
      setForm({
        nama: "",
        ketua: "",
        status: "Aktif",
        fotoUrl: "",
        fotoPosition: "center",
      });
      setEditId(null);
      await fetchData();
      setView("list");
    } catch {
      showToast("Gagal menyimpan data.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      if (deleteModal.type === "single" && deleteModal.id) {
        await deleteDoc(doc(db, "dpd", deleteModal.id));
      } else if (deleteModal.type === "bulk" && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((id) => deleteDoc(doc(db, "dpd", id))),
        );
      }
      showToast("Data berhasil dihapus.", "success");
      await fetchData();
    } catch {
      showToast("Gagal menghapus data.", "error");
    } finally {
      setIsProcessing(false);
      setDeleteModal({ isOpen: false, id: "", title: "", type: "single" });
    }
  };

  const handleExportData = () => {
    if (dataList.length === 0)
      return showToast("Tidak ada data untuk diekspor.", "error");
    const wsData = dataList.map((d, i) => ({
      No: i + 1,
      Nama_Daerah: d.nama,
      Ketua: d.ketua,
      Status: d.status,
      Foto_URL: d.fotoUrl || "",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DPD");
    XLSX.writeFile(wb, `Data_DPD_IKA_UII.xlsx`);
  };

  const downloadTemplateExcel = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Nama_Daerah: "DPD Kabupaten Sleman",
        Ketua: "Ahmad Dahlan",
        Status: "Aktif",
        Foto_URL: "",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Template_Import_DPD.xlsx`);
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
          if (row.Nama_Daerah) {
            await addDoc(collection(db, "dpd"), {
              nama: row.Nama_Daerah,
              ketua: row.Ketua || "",
              status: row.Status || "Aktif",
              fotoUrl: row.Foto_URL || "",
              createdAt: new Date().toISOString(),
            });
            count++;
          }
        }
        showToast(`${count} Data DPD di-import!`, "success");
        await fetchData();
      } catch {
        showToast("Gagal import Excel.", "error");
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
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center border border-[#DADCE0]">
            <div className="flex justify-center text-[#D93025] mb-3">
              <IconAlert />
            </div>
            <h3 className="text-lg font-medium mb-1">Hapus Permanen?</h3>
            <p className="text-sm text-[#5F6368] mb-6">
              Yakin menghapus data <strong>&quot;{deleteModal.title}&quot;</strong>?
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
                className="px-4 py-2 border rounded-lg hover:bg-slate-50 w-full"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isProcessing}
                className="px-4 py-2 text-white bg-[#D93025] hover:bg-[#b52a1f] rounded-lg w-full"
              >
                {isProcessing ? "Proses..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "list" ? (
        <div className="bg-white rounded-lg border border-[#DADCE0] shadow-sm mb-6 overflow-hidden">
          <div className="p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-[#DADCE0]">
            <h3 className="font-medium text-[#202124]">Jaringan Wilayah</h3>
            <div className="flex flex-wrap gap-2">
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
                  className="text-xs text-[#D93025] border border-[#FCE8E6] hover:bg-[#FCE8E6] px-4 py-2 rounded-lg font-bold"
                >
                  Hapus ({selectedIds.length})
                </button>
              )}
              <button
                onClick={handleExportData}
                className="text-xs font-bold border px-4 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <IconDownload /> Export
              </button>
              <button
                onClick={downloadTemplateExcel}
                className="text-xs font-bold border px-4 py-2.5 rounded-lg hover:bg-slate-50"
              >
                Template
              </button>
              <label className="cursor-pointer text-xs font-bold bg-[#F8F9FA] border px-4 py-2.5 rounded-lg hover:bg-slate-100 flex items-center gap-2">
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
                  setForm({
                    nama: "",
                    ketua: "",
                    status: "Aktif",
                    fotoUrl: "",
                    fotoPosition: "center",
                  });
                }}
                className="text-xs bg-[#1A73E8] hover:bg-[#1557B0] text-white px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5"
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
                <thead className="bg-[#F8F9FA] border-b text-slate-500">
                  <tr>
                    <th className="px-4 py-3 w-8 border-r">
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
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 font-bold text-[11px] uppercase w-12 border-r text-center">
                      No
                    </th>
                    <th className="px-4 py-3 font-bold text-[11px] uppercase">
                      Profil Daerah
                    </th>
                    <th className="px-4 py-3 font-bold text-[11px] uppercase text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]">
                  {dataList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-16">
                        <IconEmpty />
                        <p className="text-slate-500">Data DPD Kosong.</p>
                      </td>
                    </tr>
                  ) : (
                    dataList.map((d, i) => (
                      <tr key={d.id} className="hover:bg-[#F8F9FA]">
                        <td className="px-4 py-3 border-r text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(d.id)}
                            onChange={(e) =>
                              setSelectedIds((prev) =>
                                e.target.checked
                                  ? [...prev, d.id]
                                  : prev.filter((id) => id !== d.id),
                              )
                            }
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-400 text-center border-r">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-4">
                            <img
                              src={d.fotoUrl || "/logo-dpp-ika.png"}
                              alt={d.nama}
                              style={{
                                objectPosition: d.fotoPosition || "center",
                              }}
                              className="w-12 h-12 rounded-full border object-cover bg-white"
                            />
                            <div>
                              <div className="font-medium text-[#202124] text-sm flex items-center gap-2 mb-0.5">
                                {d.nama}{" "}
                                <span
                                  className={`text-[9px] px-1.5 py-0.5 rounded border ${d.status === "Aktif" ? "bg-[#E6F4EA] text-[#1E8E3E]" : "bg-[#FCE8E6] text-[#D93025]"}`}
                                >
                                  {d.status}
                                </span>
                              </div>
                              <div className="text-xs text-[#5F6368]">
                                Ketua: {d.ketua || "-"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setForm(d);
                              setEditId(d.id);
                              setView("form");
                            }}
                            className="text-[#1A73E8] hover:bg-[#E8F0FE] px-3 py-1.5 rounded-md font-medium transition-colors"
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
          className="bg-white rounded-lg border border-[#DADCE0] p-6 max-w-md mx-auto shadow-sm"
        >
          <h3 className="font-medium text-lg mb-4">
            {editId ? "Edit DPD" : "Buat DPD Baru"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1">
                Nama Daerah
              </label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleFormChange}
                required
                placeholder="Contoh: DPD Kabupaten Sleman"
                className="w-full border px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Ketua DPD
              </label>
              <input
                type="text"
                name="ketua"
                value={form.ketua}
                onChange={handleFormChange}
                className="w-full border px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                URL Foto (Opsional)
              </label>
              <input
                type="url"
                name="fotoUrl"
                value={form.fotoUrl}
                onChange={handleFormChange}
                className="w-full border px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8] bg-white"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Vakum">Vakum</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Fokus Foto
                </label>
                <select
                  name="fotoPosition"
                  value={form.fotoPosition}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8] bg-white"
                >
                  <option value="top">Atas</option>
                  <option value="center">Tengah</option>
                  <option value="bottom">Bawah</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-4 py-2 text-sm font-medium border rounded hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded"
            >
              {isProcessing ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
