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
  IconInfo,
} from "./Icons";

export default function TabPeriode() {
  const [dataList, setDataList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [view, setView] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    namaPeriode: "",
    tglMulai: "",
    tglSelesai: "",
    status: "Aktif",
    linkSK: "",
  });

  // UI States
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
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, isOpen: false })), 4000);
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "periode"), orderBy("tglMulai", "desc"));
      const snap = await getDocs(q);
      setDataList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      showToast("Gagal load data periode.", "error");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const saveData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "periode", editId), {
          ...form,
          updatedAt: new Date().toISOString(),
        });

        // PIVOT: Demisioner otomatis jika status diubah ke Arsip
        if (form.status === "Arsip") {
          const snap = await getDocs(collection(db, "pengurus"));
          const updatePromises = snap.docs
            .filter((d) => {
              const data = d.data();
              return (
                data.periodeId === editId ||
                (!data.periodeId && data.isPengurus === true)
              );
            })
            .map((d) =>
              updateDoc(doc(db, "pengurus", d.id), {
                isPengurus: false,
                status_pengurus: "Demisioner",
                role: "anggota",
                isTampilBeranda: false,
                updatedAt: new Date().toISOString(),
              }),
            );
          if (updatePromises.length > 0) await Promise.all(updatePromises);
          showToast(
            `Periode diarsipkan. ${updatePromises.length} Pengurus diturunkan jadi Anggota.`,
            "success",
          );
        } else {
          showToast(`Periode berhasil diperbarui.`, "success");
        }
      } else {
        await addDoc(collection(db, "periode"), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        showToast(`Periode baru berhasil ditambahkan.`, "success");
      }
      setForm({
        namaPeriode: "",
        tglMulai: "",
        tglSelesai: "",
        status: "Aktif",
        linkSK: "",
      });
      setEditId(null);
      await fetchData();
      setView("list");
    } catch {
      showToast(`Gagal menyimpan data.`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      if (deleteModal.type === "single" && deleteModal.id) {
        await deleteDoc(doc(db, "periode", deleteModal.id));
      } else if (deleteModal.type === "bulk" && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((id) => deleteDoc(doc(db, "periode", id))),
        );
      }
      showToast(`Data berhasil dihapus permanen.`, "success");
      await fetchData();
    } catch {
      showToast("Gagal menghapus data.", "error");
    } finally {
      setIsProcessing(false);
      setDeleteModal({ isOpen: false, id: "", title: "", type: "single" });
      setSelectedIds([]);
    }
  };

  // --- EXPORT & IMPORT EXCEL LOGIC ---
  const handleExportData = () => {
    if (dataList.length === 0)
      return showToast("Tidak ada data untuk diekspor.", "error");
    const formattedData = dataList.map((d) => ({
      Nama_Periode: d.namaPeriode,
      Tgl_Mulai: d.tglMulai,
      Tgl_Selesai: d.tglSelesai,
      Status: d.status,
    }));
    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Periode");
    XLSX.writeFile(wb, `Data_PERIODE_IKA_UII.xlsx`);
    showToast("Data berhasil diekspor ke Excel.", "success");
  };

  const downloadTemplateExcel = () => {
    const wsData = [
      {
        Nama_Periode: "Periode 2024-2029",
        Tgl_Mulai: "2024-01-01",
        Tgl_Selesai: "2029-12-31",
        Status: "Aktif",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Template_Import_PERIODE.xlsx`);
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
          if (row.Nama_Periode) {
            await addDoc(collection(db, "periode"), {
              namaPeriode: row.Nama_Periode,
              tglMulai: row.Tgl_Mulai || "",
              tglSelesai: row.Tgl_Selesai || "",
              status: row.Status || "Aktif",
              createdAt: new Date().toISOString(),
            });
            count++;
          }
        }
        showToast(`${count} Data berhasil di-import!`, "success");
        await fetchData();
      } catch {
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
              Anda yakin ingin menghapus <strong>&quot;{deleteModal.title}&quot;</strong>?
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
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#5F6368] border hover:bg-[#F8F9FA] w-full"
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

      {/* KONTEN UTAMA */}
      {view === "list" ? (
        <div className="bg-white rounded-lg border border-[#DADCE0] shadow-sm overflow-hidden">
          <div className="p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-[#DADCE0]">
            <h3 className="font-medium text-[#202124] text-base">
              Masa Kepengurusan
            </h3>
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
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
                  className="text-xs bg-white text-[#D93025] border border-[#FCE8E6] hover:bg-[#FCE8E6] px-4 py-2.5 rounded-lg transition-colors shadow-sm font-bold"
                >
                  Hapus ({selectedIds.length})
                </button>
              )}
              <button
                onClick={handleExportData}
                className="text-xs font-bold bg-white text-slate-700 border border-[#DADCE0] px-4 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-colors"
              >
                <IconDownload /> Export
              </button>
              <button
                onClick={downloadTemplateExcel}
                className="text-xs font-bold bg-white text-slate-700 border border-[#DADCE0] px-4 py-2.5 rounded-lg hover:bg-slate-50 shadow-sm transition-colors"
              >
                Template
              </button>
              <label className="cursor-pointer text-xs font-bold bg-[#F8F9FA] text-slate-700 border border-[#DADCE0] px-4 py-2.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 shadow-sm">
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
                    namaPeriode: "",
                    tglMulai: "",
                    tglSelesai: "",
                    status: "Aktif",
                    linkSK: "",
                  });
                }}
                className="text-xs bg-[#1A73E8] text-white border border-[#1A73E8] hover:bg-[#1557B0] px-4 py-2.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm"
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
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider">
                      Periode Kepengurusan
                    </th>
                    <th className="px-6 py-3 font-medium text-xs uppercase tracking-wider text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]">
                  {dataList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-16">
                        <IconEmpty />
                        <p className="text-sm text-slate-500">
                          Belum Ada Periode
                        </p>
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
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#202124] text-sm flex items-center gap-3">
                            {p.namaPeriode}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border ${p.status === "Aktif" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#CEEAD6]" : "bg-[#F1F3F4] text-[#5F6368] border-[#DADCE0]"}`}
                            >
                              {p.status}
                            </span>
                          </div>
                          <div className="text-xs text-[#5F6368] mt-1">
                            {p.tglMulai} s/d {p.tglSelesai}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              setForm(p);
                              setEditId(p.id);
                              setView("form");
                            }}
                            className="text-sm font-medium text-[#1A73E8] hover:bg-[#E8F0FE] px-3 py-1.5 rounded-md transition-colors"
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
          className="bg-white rounded-lg border border-[#DADCE0] p-6 sm:p-8 max-w-xl mx-auto shadow-sm"
        >
          <h3 className="font-medium mb-6 text-lg border-b pb-4">
            {editId ? "Edit Masa Periode" : "Buat Periode Baru"}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#5F6368] mb-1">
                Nama Periode
              </label>
              <input
                type="text"
                name="namaPeriode"
                value={form.namaPeriode}
                onChange={handleFormChange}
                required
                placeholder="Contoh: Kabinet Sinergi 2024-2029"
                className="w-full border px-3 py-2 rounded-md text-sm outline-none focus:border-[#1A73E8]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  name="tglMulai"
                  value={form.tglMulai}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  Tanggal Selesai
                </label>
                <input
                  type="date"
                  name="tglSelesai"
                  value={form.tglSelesai}
                  onChange={handleFormChange}
                  className="w-full border px-3 py-2 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">
                Status Periode
              </label>
              <select
                name="status"
                value={form.status}
                onChange={handleFormChange}
                className="w-full border px-3 py-2 rounded-md text-sm outline-none focus:border-[#1A73E8] bg-white cursor-pointer"
              >
                <option value="Aktif">Aktif (Sedang Berjalan)</option>
                <option value="Arsip">Arsip (Demisioner)</option>
              </select>
              {form.status === "Arsip" && (
                <div className="mt-2 bg-[#FCE8E6] border border-[#FAD2CF] p-3 rounded-md flex gap-2 items-start">
                  <span className="text-[#D93025] mt-0.5">
                    <IconInfo />
                  </span>
                  <p className="text-xs text-[#C5221F] font-medium leading-relaxed">
                    Menyimpan dengan status Arsip akan merubah semua Pengurus di
                    periode ini menjadi Anggota Biasa secara permanen.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t justify-end">
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-5 py-2 text-sm font-medium border rounded-md hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 text-sm font-medium text-white bg-[#1A73E8] rounded-md hover:bg-[#1557B0]"
            >
              {isProcessing ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
