"use client";

import { useState, useEffect, useMemo } from "react";
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

export default function MasterDataOrmawa() {
  const [activeTab, setActiveTab] = useState("periode");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE MODAL HAPUS ---
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    koleksi: "",
    id: "",
    title: "",
  });

  // --- STATE BULK DELETE (HAPUS BANYAK) ---
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // --- STATE PERIODE ---
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [viewPeriode, setViewPeriode] = useState("list");
  const [editPeriodeId, setEditPeriodeId] = useState<string | null>(null);
  const [periodeForm, setPeriodeForm] = useState({
    namaPeriode: "",
    tglMulai: "",
    tglSelesai: "",
    status: "Aktif",
    linkSK: "",
  });

  // --- STATE BIDANG ---
  const [bidangList, setBidangList] = useState<any[]>([]);
  const [viewBidang, setViewBidang] = useState("list");
  const [editBidangId, setEditBidangId] = useState<string | null>(null);
  const [bidangForm, setBidangForm] = useState({
    namaBidang: "",
    deskripsi: "",
  });

  // --- STATE PENGURUS ---
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [viewPengurus, setViewPengurus] = useState("list");
  const [editPengurusId, setEditPengurusId] = useState<string | null>(null);
  const [pengurusForm, setPengurusForm] = useState({
    nama: "",
    wa: "",
    email: "",
    jabatan: "Anggota",
    bidang: "",
    linkTTD: "",
    isInti: false,
    fotoUrl: "",
    linkedinUrl: "",
    instagramUrl: "",
    isTampilBeranda: false,
    noUrut: "",
  });
  const [searchPengurus, setSearchPengurus] = useState("");

  // --- STATE DPD ---
  const [dpdList, setDpdList] = useState<any[]>([]);
  const [viewDpd, setViewDpd] = useState("list");
  const [editDpdId, setEditDpdId] = useState<string | null>(null);
  const [dpdForm, setDpdForm] = useState({
    nama: "",
    status: "Aktif",
    ketua: "",
    fotoUrl: "", // 🔥 TAMBAHAN STATE FOTO DPD
  });

  // --- FETCH DATA ---
  const fetchSemuaData = async () => {
    setIsLoading(true);
    try {
      setPeriodeList(
        (
          await getDocs(
            query(collection(db, "periode"), orderBy("tglMulai", "desc")),
          )
        ).docs.map((d) => ({ id: d.id, ...d.data() })),
      );

      const bList = (
        await getDocs(
          query(collection(db, "bidang"), orderBy("namaBidang", "asc")),
        )
      ).docs.map((d) => ({ id: d.id, ...d.data() }));
      setBidangList(bList);

      if (bList.length > 0 && !pengurusForm.bidang) {
        setPengurusForm((prev) => ({
          ...prev,
          bidang: (bList[0] as any).namaBidang,
        }));
      }

      setPengurusList(
        (
          await getDocs(
            query(collection(db, "pengurus"), orderBy("bidang", "asc")),
          )
        ).docs.map((d) => ({ id: d.id, ...d.data() })),
      );
      setDpdList(
        (
          await getDocs(query(collection(db, "dpd"), orderBy("nama", "asc")))
        ).docs.map((d) => ({ id: d.id, ...d.data() })),
      );
    } catch (error) {
      console.error("Gagal load:", error);
    } finally {
      setIsLoading(false);
      setSelectedIds([]); // Reset selection tiap fetch ulang
    }
  };

  useEffect(() => {
    fetchSemuaData();
  }, []);

  // --- HANDLERS UTAMA ---
  const handleFormChange = (setter: any, state: any) => (e: any) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setter({ ...state, [e.target.name]: value });
  };

  const handleShowMessage = (type: string, text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handleEdit = (
    setterForm: any,
    setterId: any,
    setView: any,
    item: any,
  ) => {
    setterForm(item);
    setterId(item.id);
    setView("form");
  };

  const saveData = async (
    e: React.FormEvent,
    koleksi: string,
    id: string | null,
    formData: any,
    resetForm: any,
    initialForm: any,
    setView: any,
    setId: any,
  ) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalData = { ...formData };

      if (koleksi === "pengurus") {
        finalData.noUrut = formData.noUrut ? Number(formData.noUrut) : 99;
      }

      if (id) {
        await updateDoc(doc(db, koleksi, id), {
          ...finalData,
          updatedAt: new Date().toISOString(),
        });
        handleShowMessage("success", `Data tersimpan.`);
      } else {
        await addDoc(collection(db, koleksi), {
          ...finalData,
          createdAt: new Date().toISOString(),
        });
        handleShowMessage("success", `Data baru ditambahkan.`);
      }
      resetForm(initialForm);
      setId(null);
      await fetchSemuaData();
      setView("list");
    } catch (error) {
      handleShowMessage("error", `Gagal menyimpan data.`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- DELETE TUNGGAL ---
  const requestDelete = (
    koleksi: string,
    id: string | undefined,
    title: string,
  ) => {
    if (!id) return;
    setDeleteModal({ isOpen: true, koleksi, id, title });
  };

  const executeDelete = async () => {
    if (!deleteModal.id || !deleteModal.koleksi) return;
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, deleteModal.koleksi, deleteModal.id));
      handleShowMessage("success", `Data dihapus.`);
      await fetchSemuaData();
    } catch (error) {
      handleShowMessage("error", "Gagal menghapus data.");
    } finally {
      setIsSaving(false);
      setDeleteModal({ isOpen: false, koleksi: "", id: "", title: "" });
    }
  };

  // --- BULK DELETE LOGIC ---
  const handleSelectAll = (
    e: React.ChangeEvent<HTMLInputElement>,
    list: any[],
  ) => {
    if (e.target.checked) setSelectedIds(list.map((item) => item.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (e.target.checked) setSelectedIds((prev) => [...prev, id]);
    else setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const executeBulkDelete = async (koleksi: string) => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Yakin ingin menghapus ${selectedIds.length} data terpilih secara permanen?`,
      )
    )
      return;

    setIsSaving(true);
    try {
      await Promise.all(
        selectedIds.map((id) => deleteDoc(doc(db, koleksi, id))),
      );
      handleShowMessage(
        "success",
        `${selectedIds.length} Data berhasil dihapus.`,
      );
      await fetchSemuaData();
    } catch (error) {
      handleShowMessage("error", "Gagal menghapus sebagian data.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- EXCEL HANDLERS ---
  const downloadTemplateExcel = (type: string) => {
    let wsData: any[] = [];
    if (type === "periode")
      wsData = [
        {
          Nama_Periode: "Periode 2024-2029",
          Tgl_Mulai: "2024-01-01",
          Tgl_Selesai: "2029-12-31",
          Status: "Aktif",
        },
      ];
    else if (type === "bidang") wsData = [{ Nama_Bidang: "Dewan Pakar" }];
    else if (type === "pengurus")
      wsData = [
        {
          Nama: "Budi Santoso",
          WA: "08123456",
          Email: "budi@uii.ac.id",
          Jabatan: "Wakil Ketua 1",
          Bidang: "Pengurus Harian",
          Pengurus_Inti: "Ya",
          Tampil_Beranda: "YA",
          Nomor_Urut: 1,
          Foto_URL: "",
          LinkedIn: "",
          Instagram: "",
        },
      ];
    else if (type === "dpd")
      wsData = [
        {
          Nama_Daerah: "DPD Kabupaten Sleman",
          Ketua: "Ahmad Dahlan",
          Status: "Aktif",
          Foto_URL: "", // 🔥 TAMBAHAN TEMPLATE EXCEL DPD
        },
      ];

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Template_Import_${type.toUpperCase()}.xlsx`);
  };

  const handleImportExcel = async (e: any, type: string) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let count = 0;

        for (const row of data as any[]) {
          if (type === "periode" && row.Nama_Periode) {
            await addDoc(collection(db, "periode"), {
              namaPeriode: row.Nama_Periode,
              tglMulai: row.Tgl_Mulai || "",
              tglSelesai: row.Tgl_Selesai || "",
              status: row.Status || "Aktif",
              createdAt: new Date().toISOString(),
            });
            count++;
          } else if (type === "bidang" && row.Nama_Bidang) {
            await addDoc(collection(db, "bidang"), {
              namaBidang: row.Nama_Bidang,
              deskripsi: "",
              createdAt: new Date().toISOString(),
            });
            count++;
          } else if (type === "pengurus" && row.Nama) {
            const isInti = ["ya", "yes", "true", "1", "y"].includes(
              (row["Pengurus Inti (Ya/Tidak)"] || row["Pengurus_Inti"] || "")
                .toString()
                .toLowerCase(),
            );
            const isTampilBeranda = ["ya", "yes", "true", "1", "y"].includes(
              (row["Tampil_Beranda"] || "").toString().toLowerCase(),
            );

            await addDoc(collection(db, "pengurus"), {
              nama: row.Nama,
              wa: row.WA ? row.WA.toString() : "",
              email: row.Email || "",
              jabatan: row.Jabatan || "Anggota",
              bidang: row.Bidang || "Belum Ditentukan",
              linkTTD: "",
              isInti: isInti,
              isTampilBeranda: isTampilBeranda,
              fotoUrl: row.Foto_URL || "",
              linkedinUrl: row.LinkedIn || "",
              instagramUrl: row.Instagram || "",
              noUrut: row.Nomor_Urut ? Number(row.Nomor_Urut) : 99,
              createdAt: new Date().toISOString(),
            });
            count++;
          } else if (type === "dpd" && row.Nama_Daerah) {
            await addDoc(collection(db, "dpd"), {
              nama: row.Nama_Daerah,
              ketua: row.Ketua || "",
              status: row.Status || "Aktif",
              fotoUrl: row.Foto_URL || "", // 🔥 SIMPAN FOTO URL DARI EXCEL DPD
              createdAt: new Date().toISOString(),
            });
            count++;
          }
        }
        handleShowMessage("success", `${count} Data berhasil di-import!`);
        await fetchSemuaData();
      } catch (error) {
        handleShowMessage(
          "error",
          "Gagal membaca Excel. Pastikan format kolom sesuai template.",
        );
      } finally {
        setIsSaving(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExportData = (type: string, data: any[]) => {
    if (!data || data.length === 0) {
      handleShowMessage("error", "Tidak ada data untuk diunduh.");
      return;
    }
    let formattedData: any[] = [];
    if (type === "periode")
      formattedData = data.map((d) => ({
        Nama_Periode: d.namaPeriode,
        Tgl_Mulai: d.tglMulai,
        Tgl_Selesai: d.tglSelesai,
        Status: d.status,
      }));
    else if (type === "bidang")
      formattedData = data.map((d) => ({ Nama_Bidang: d.namaBidang }));
    else if (type === "pengurus")
      formattedData = data.map((d) => ({
        Nama: d.nama,
        WA: d.wa,
        Email: d.email,
        Jabatan: d.jabatan,
        Bidang: d.bidang,
        Nomor_Urut: d.noUrut || 99,
        Pengurus_Inti: d.isInti ? "Ya" : "Tidak",
        Tampil_Beranda: d.isTampilBeranda ? "Ya" : "Tidak",
        Foto_URL: d.fotoUrl || "",
        LinkedIn: d.linkedinUrl || "",
        Instagram: d.instagramUrl || "",
      }));
    else if (type === "dpd")
      formattedData = data.map((d) => ({
        Nama_Daerah: d.nama,
        Ketua: d.ketua,
        Status: d.status,
        Foto_URL: d.fotoUrl || "", // 🔥 EXPORT FOTO URL DPD
      }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_" + type);
    XLSX.writeFile(wb, `Data_${type.toUpperCase()}_IKA_UII.xlsx`);
  };

  // FILTER PENCARIAN PENGURUS
  const filteredPengurus = useMemo(() => {
    if (!searchPengurus) return pengurusList;
    const lowerSearch = searchPengurus.toLowerCase();
    return pengurusList.filter(
      (p) =>
        (p.nama && p.nama.toLowerCase().includes(lowerSearch)) ||
        (p.jabatan && p.jabatan.toLowerCase().includes(lowerSearch)) ||
        (p.bidang && p.bidang.toLowerCase().includes(lowerSearch)),
    );
  }, [searchPengurus, pengurusList]);

  // KOMPONEN TOMBOL AKSI ATAS TABEL
  const TableActions = ({ type, dataToExport, onAdd }: any) => (
    <div className="flex flex-wrap gap-2 items-center justify-end">
      {selectedIds.length > 0 && (
        <button
          onClick={() => executeBulkDelete(type)}
          className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-md hover:bg-red-100 transition-colors shadow-sm font-semibold flex items-center gap-1"
        >
          Hapus {selectedIds.length} Terpilih
        </button>
      )}
      <button
        onClick={() => handleExportData(type, dataToExport)}
        className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
      >
        Unduh Data
      </button>
      <button
        onClick={() => downloadTemplateExcel(type)}
        className="text-xs font-medium bg-white border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors shadow-sm text-slate-600"
      >
        Template Excel
      </button>
      <label className="cursor-pointer text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-md hover:bg-green-100 transition-colors shadow-sm">
        Upload Excel{" "}
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={(e) => handleImportExcel(e, type)}
          className="hidden"
        />
      </label>
      <button
        onClick={onAdd}
        className="bg-blue-900 font-medium text-white px-3 py-1.5 rounded-md text-xs hover:bg-blue-800 transition-colors shadow-sm"
      >
        + Tambah Manual
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-12 font-sans text-slate-800">
      {/* MODAL HAPUS */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center border border-slate-100">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Hapus "{deleteModal.title}"?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Data yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    koleksi: "",
                    id: "",
                    title: "",
                  })
                }
                className="px-4 py-2 rounded-lg text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-full"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 transition-colors w-full"
              >
                {isSaving ? "Proses..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-blue-950 mb-1">
          Master Data Organisasi
        </h2>
        <p className="text-slate-500 text-sm">
          Pusat pengaturan struktur, susunan personalia, dan jaringan wilayah.
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 overflow-x-auto no-scrollbar pb-px">
        {[
          { id: "periode", label: "Periode" },
          { id: "bidang", label: "Bidang" },
          { id: "pengurus", label: "Personalia" },
          { id: "dpd", label: "Jaringan DPD" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMessage({ type: "", text: "" });
              setSelectedIds([]);
            }}
            className={`px-4 py-2.5 text-sm whitespace-nowrap transition-all border-b-2 ${activeTab === tab.id ? "border-blue-700 text-blue-800 font-semibold" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg mb-6 text-sm flex items-center gap-2 border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-100" : "bg-red-50 text-red-700 border-red-100"}`}
        >
          {message.text}
        </div>
      )}

      {/* ======================= TAB 1: PERIODE ======================= */}
      {activeTab === "periode" &&
        (viewPeriode === "list" ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-medium text-sm text-slate-800">
                Masa Kepengurusan
              </h3>
              <TableActions
                type="periode"
                dataToExport={periodeList}
                onAdd={() => {
                  setViewPeriode("form");
                  setEditPeriodeId(null);
                }}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e, periodeList)}
                        checked={
                          periodeList.length > 0 &&
                          selectedIds.length === periodeList.length
                        }
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium text-xs">
                      Periode Kepengurusan
                    </th>
                    <th className="px-4 py-3 font-medium text-xs text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodeList.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={(e) => handleSelectOne(e, p.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">
                          {p.namaPeriode}{" "}
                          <span
                            className={`text-[10px] ml-2 px-2 py-0.5 rounded-full ${p.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          {p.tglMulai} — {p.tglSelesai}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button
                          onClick={() =>
                            handleEdit(
                              setPeriodeForm,
                              setEditPeriodeId,
                              setViewPeriode,
                              p,
                            )
                          }
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) =>
              saveData(
                e,
                "periode",
                editPeriodeId,
                periodeForm,
                setPeriodeForm,
                {
                  namaPeriode: "",
                  tglMulai: "",
                  tglSelesai: "",
                  status: "Aktif",
                  linkSK: "",
                },
                setViewPeriode,
                setEditPeriodeId,
              )
            }
            className="bg-white rounded-xl border border-slate-200 p-5 max-w-lg mx-auto shadow-sm"
          >
            <h3 className="font-semibold mb-4 text-sm">
              {editPeriodeId ? "Edit Periode" : "Periode Baru"}
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                name="namaPeriode"
                value={periodeForm.namaPeriode}
                onChange={handleFormChange(setPeriodeForm, periodeForm)}
                required
                placeholder="Nama Kabinet"
                className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  name="tglMulai"
                  value={periodeForm.tglMulai}
                  onChange={handleFormChange(setPeriodeForm, periodeForm)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-600"
                />
                <input
                  type="date"
                  name="tglSelesai"
                  value={periodeForm.tglSelesai}
                  onChange={handleFormChange(setPeriodeForm, periodeForm)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 text-slate-600"
                />
              </div>
              <select
                name="status"
                value={periodeForm.status}
                onChange={handleFormChange(setPeriodeForm, periodeForm)}
                className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
              >
                <option value="Aktif">Aktif</option>
                <option value="Arsip">Arsip</option>
              </select>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-900 font-medium text-white text-sm py-2 rounded-lg hover:bg-blue-800"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setViewPeriode("list")}
                className="flex-1 bg-slate-100 font-medium text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-200"
              >
                Batal
              </button>
            </div>
          </form>
        ))}

      {/* ======================= TAB 2: BIDANG ======================= */}
      {activeTab === "bidang" &&
        (viewBidang === "list" ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-medium text-sm text-slate-800">
                Daftar Bidang Organisasi
              </h3>
              <TableActions
                type="bidang"
                dataToExport={bidangList}
                onAdd={() => {
                  setViewBidang("form");
                  setEditBidangId(null);
                }}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e, bidangList)}
                        checked={
                          bidangList.length > 0 &&
                          selectedIds.length === bidangList.length
                        }
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium text-xs">
                      Nama Bidang
                    </th>
                    <th className="px-4 py-3 font-medium text-xs text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bidangList.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={(e) => handleSelectOne(e, p.id)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {p.namaBidang}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            handleEdit(
                              setBidangForm,
                              setEditBidangId,
                              setViewBidang,
                              p,
                            )
                          }
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) =>
              saveData(
                e,
                "bidang",
                editBidangId,
                bidangForm,
                setBidangForm,
                { namaBidang: "", deskripsi: "" },
                setViewBidang,
                setEditBidangId,
              )
            }
            className="bg-white rounded-xl border border-slate-200 p-5 max-w-md mx-auto shadow-sm"
          >
            <h3 className="font-semibold mb-4 text-sm">
              {editBidangId ? "Edit Bidang" : "Bidang Baru"}
            </h3>
            <input
              type="text"
              name="namaBidang"
              value={bidangForm.namaBidang}
              onChange={handleFormChange(setBidangForm, bidangForm)}
              required
              placeholder="Nama Bidang/Departemen"
              className="w-full border border-slate-200 px-3 py-2 mb-4 rounded-lg text-sm outline-none focus:border-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-900 font-medium text-white text-sm py-2 rounded-lg hover:bg-blue-800"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => setViewBidang("list")}
                className="flex-1 bg-slate-100 font-medium text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-200"
              >
                Batal
              </button>
            </div>
          </form>
        ))}

      {/* ======================= TAB 3: PENGURUS ======================= */}
      {activeTab === "pengurus" &&
        (viewPengurus === "list" ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-4">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <h3 className="font-medium text-sm text-slate-800">
                  Database Personalia
                </h3>
                <TableActions
                  type="pengurus"
                  dataToExport={filteredPengurus}
                  onAdd={() => {
                    setViewPengurus("form");
                    setEditPengurusId(null);
                    setPengurusForm({
                      nama: "",
                      wa: "",
                      email: "",
                      jabatan: "Anggota",
                      bidang: bidangList[0]?.namaBidang || "",
                      linkTTD: "",
                      isInti: false,
                      fotoUrl: "",
                      linkedinUrl: "",
                      instagramUrl: "",
                      isTampilBeranda: false,
                      noUrut: "",
                    });
                  }}
                />
              </div>
              <div className="relative w-full max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari nama, jabatan, atau bidang..."
                  value={searchPengurus}
                  onChange={(e) => setSearchPengurus(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto relative">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e, filteredPengurus)}
                        checked={
                          filteredPengurus.length > 0 &&
                          selectedIds.length === filteredPengurus.length
                        }
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium text-xs">
                      Nama & Profil
                    </th>
                    <th className="px-4 py-3 font-medium text-xs">
                      Bidang & Jabatan
                    </th>
                    <th className="px-4 py-3 font-medium text-xs text-center">
                      Status Tampil
                    </th>
                    <th className="px-4 py-3 font-medium text-xs text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPengurus.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-8 text-slate-400 text-sm"
                      >
                        Tidak ada data.
                      </td>
                    </tr>
                  )}
                  {filteredPengurus.map((p) => (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={(e) => handleSelectOne(e, p.id)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.fotoUrl || "/logo-dpp-ika.png"}
                            alt={p.nama}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm bg-white"
                          />
                          <div>
                            <div className="font-medium text-slate-800 flex items-center gap-2">
                              {p.nama}
                              {p.noUrut && p.noUrut !== 99 && (
                                <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 rounded-sm border font-mono">
                                  Urutan: {p.noUrut}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                              {p.wa || "-"} • {p.email || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 text-xs font-medium mb-0.5">
                          {p.bidang}
                        </div>
                        <div className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider">
                          {p.jabatan}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {p.isInti ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-md">
                              SK Inti
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Anggota
                            </span>
                          )}
                          {p.isTampilBeranda && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-md uppercase">
                              🌐 Beranda
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right space-x-3">
                        <button
                          onClick={() =>
                            handleEdit(
                              setPengurusForm,
                              setEditPengurusId,
                              setViewPengurus,
                              p,
                            )
                          }
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            requestDelete("pengurus", p.id, p.nama)
                          }
                          className="text-xs font-medium text-red-600 hover:text-red-800"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) =>
              saveData(
                e,
                "pengurus",
                editPengurusId,
                pengurusForm,
                setPengurusForm,
                {
                  nama: "",
                  wa: "",
                  email: "",
                  jabatan: "Anggota",
                  bidang: bidangList[0]?.namaBidang || "",
                  linkTTD: "",
                  isInti: false,
                  fotoUrl: "",
                  linkedinUrl: "",
                  instagramUrl: "",
                  isTampilBeranda: false,
                  noUrut: "",
                },
                setViewPengurus,
                setEditPengurusId,
              )
            }
            className="bg-white rounded-xl border border-slate-200 p-6 max-w-2xl mx-auto shadow-sm"
          >
            <h3 className="font-semibold mb-5 text-sm pb-3 border-b border-slate-100">
              {editPengurusId ? "Edit Personalia" : "Input Personalia Baru"}
            </h3>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-5 items-start bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="shrink-0 w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-slate-200 flex items-center justify-center">
                  {pengurusForm.fotoUrl ? (
                    <img
                      src={pengurusForm.fotoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">
                      No Image
                    </span>
                  )}
                </div>
                <div className="flex-grow w-full">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                    Link URL Foto Profil (Opsional)
                  </label>
                  <input
                    type="url"
                    name="fotoUrl"
                    value={pengurusForm.fotoUrl || ""}
                    onChange={handleFormChange(setPengurusForm, pengurusForm)}
                    placeholder="https://contoh.com/foto.jpg"
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 mb-3 bg-white"
                  />
                  <div className="flex gap-2">
                    <input
                      type="url"
                      name="linkedinUrl"
                      value={pengurusForm.linkedinUrl || ""}
                      onChange={handleFormChange(setPengurusForm, pengurusForm)}
                      placeholder="Link LinkedIn"
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg text-[11px] outline-none focus:border-blue-500 bg-white"
                    />
                    <input
                      type="url"
                      name="instagramUrl"
                      value={pengurusForm.instagramUrl || ""}
                      onChange={handleFormChange(setPengurusForm, pengurusForm)}
                      placeholder="Link Instagram"
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg text-[11px] outline-none focus:border-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                    Nama Lengkap & Gelar
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={pengurusForm.nama}
                    onChange={handleFormChange(setPengurusForm, pengurusForm)}
                    required
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                    Jabatan Spesifik
                  </label>
                  <select
                    name="jabatan"
                    value={pengurusForm.jabatan}
                    onChange={handleFormChange(setPengurusForm, pengurusForm)}
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50"
                  >
                    <option value="Ketua Umum">Ketua Umum</option>
                    <option value="Ketua">Ketua</option>
                    <option value="Wakil Ketua Umum">Wakil Ketua Umum</option>
                    <option value="Wakil Ketua">Wakil Ketua</option>
                    <option value="Sekretaris Wilayah">
                      Sekretaris Wilayah
                    </option>
                    <option value="Wakil Sekretaris">Wakil Sekretaris</option>
                    <option value="Bendahara Umum">Bendahara Umum</option>
                    <option value="Wakil Bendahara">Wakil Bendahara</option>
                    <option value="Koordinator Bidang">
                      Koordinator Bidang
                    </option>
                    <option value="Anggota">Anggota</option>
                  </select>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                    Penempatan Bidang
                  </label>
                  <select
                    name="bidang"
                    value={pengurusForm.bidang}
                    onChange={handleFormChange(setPengurusForm, pengurusForm)}
                    className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50"
                  >
                    {bidangList.map((b: any) => (
                      <option key={b.id} value={b.namaBidang}>
                        {b.namaBidang}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      name="wa"
                      value={pengurusForm.wa}
                      onChange={handleFormChange(setPengurusForm, pengurusForm)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={pengurusForm.email}
                      onChange={handleFormChange(setPengurusForm, pengurusForm)}
                      className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-3">
                <label className="flex items-start gap-3 p-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl cursor-pointer transition-colors shadow-sm">
                  <input
                    type="checkbox"
                    name="isInti"
                    checked={pengurusForm.isInti || false}
                    onChange={handleFormChange(setPengurusForm, pengurusForm)}
                    className="mt-0.5 w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-600 cursor-pointer"
                  />
                  <div>
                    <span className="block text-sm font-bold text-slate-800">
                      SK Pengurus Inti
                    </span>
                    <span className="block text-[10px] font-medium text-slate-500 mt-0.5">
                      Centang jika orang ini masuk jajaran inti SK.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors shadow-sm">
                  <input
                    type="checkbox"
                    name="isTampilBeranda"
                    checked={pengurusForm.isTampilBeranda || false}
                    onChange={handleFormChange(setPengurusForm, pengurusForm)}
                    className="mt-0.5 w-4 h-4 text-blue-700 bg-white border-blue-300 rounded focus:ring-blue-600 cursor-pointer"
                  />
                  <div>
                    <span className="block text-sm font-bold text-blue-900">
                      Tampil di Beranda Web
                    </span>
                    <span className="block text-[10px] font-medium text-blue-700 mt-0.5">
                      Centang agar muncul di deretan foto Landing Page.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Nomor Urut Tampil (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    name="noUrut"
                    value={pengurusForm.noUrut || ""}
                    onChange={handleFormChange(setPengurusForm, pengurusForm)}
                    placeholder="Cth: 1"
                    className="w-32 border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 font-bold text-slate-800"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight">
                    Gunakan angka untuk mengurutkan pengurus yang jabatannya
                    sama (contoh: sesama Wakil Ketua). <br />
                    Biarkan kosong jika ingin diurutkan otomatis sesuai abjad.
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-900 font-medium text-white text-sm py-2.5 rounded-lg hover:bg-blue-800 transition-colors shadow-sm"
              >
                Simpan Profil
              </button>
              <button
                type="button"
                onClick={() => setViewPengurus("list")}
                className="flex-1 bg-slate-100 font-medium text-slate-600 text-sm py-2.5 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        ))}

      {/* ======================= TAB 4: DPD ======================= */}
      {activeTab === "dpd" &&
        (viewDpd === "list" ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-medium text-sm text-slate-800">
                Daftar DPD Daerah
              </h3>
              <TableActions
                type="dpd"
                dataToExport={dpdList}
                onAdd={() => {
                  setViewDpd("form");
                  setEditDpdId(null);
                  setDpdForm({
                    nama: "",
                    status: "Aktif",
                    ketua: "",
                    fotoUrl: "",
                  });
                }}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 w-8">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e, dpdList)}
                        checked={
                          dpdList.length > 0 &&
                          selectedIds.length === dpdList.length
                        }
                        className="rounded border-slate-300 text-blue-600"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium text-xs">
                      Profil DPD & Status
                    </th>
                    <th className="px-4 py-3 font-medium text-xs text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dpdList.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="text-center py-6 text-slate-400"
                      >
                        Belum ada data DPD.
                      </td>
                    </tr>
                  )}
                  {dpdList.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(d.id)}
                          onChange={(e) => handleSelectOne(e, d.id)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={d.fotoUrl || "/logo-dpp-ika.png"}
                            alt={d.nama}
                            className={`w-10 h-10 rounded-full border border-slate-200 shadow-sm bg-slate-50 ${d.fotoUrl ? "object-cover" : "object-contain p-1.5 opacity-40 grayscale"}`}
                          />
                          <div>
                            <div className="font-medium text-sm text-slate-800 flex items-center gap-2">
                              {d.nama}{" "}
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-md font-semibold border ${d.status === "Aktif" ? "bg-green-50 text-green-700 border-green-200" : "bg-orange-50 text-orange-700 border-orange-200"}`}
                              >
                                {d.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Ketua: {d.ketua || "-"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() =>
                            handleEdit(setDpdForm, setEditDpdId, setViewDpd, d)
                          }
                          className="text-xs font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) =>
              saveData(
                e,
                "dpd",
                editDpdId,
                dpdForm,
                setDpdForm,
                { nama: "", status: "Aktif", ketua: "", fotoUrl: "" },
                setViewDpd,
                setEditDpdId,
              )
            }
            className="bg-white rounded-xl border border-slate-200 p-5 max-w-md mx-auto shadow-sm"
          >
            <h3 className="font-semibold mb-4 text-sm border-b border-slate-100 pb-3">
              {editDpdId ? "Edit DPD" : "Registrasi DPD Baru"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Nama Daerah
                </label>
                <input
                  type="text"
                  name="nama"
                  value={dpdForm.nama}
                  onChange={handleFormChange(setDpdForm, dpdForm)}
                  required
                  placeholder="Cth: DPD Kabupaten Sleman"
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Nama Ketua DPD
                </label>
                <input
                  type="text"
                  name="ketua"
                  value={dpdForm.ketua}
                  onChange={handleFormChange(setDpdForm, dpdForm)}
                  placeholder="Nama Lengkap Ketua"
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  URL Foto Profil DPD (Opsional)
                </label>
                <input
                  type="url"
                  name="fotoUrl"
                  value={dpdForm.fotoUrl || ""}
                  onChange={handleFormChange(setDpdForm, dpdForm)}
                  placeholder="https://contoh.com/foto-dpd.jpg"
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                  Status DPD
                </label>
                <select
                  name="status"
                  value={dpdForm.status}
                  onChange={handleFormChange(setDpdForm, dpdForm)}
                  className="w-full border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none focus:border-blue-500 bg-slate-50"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Konsolidasi">
                    Konsolidasi (Pembaruan SK)
                  </option>
                  <option value="Vakum">Vakum</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-blue-900 font-medium text-white text-sm py-2 rounded-lg hover:bg-blue-800"
              >
                Simpan DPD
              </button>
              <button
                type="button"
                onClick={() => setViewDpd("list")}
                className="flex-1 bg-slate-100 font-medium text-slate-600 text-sm py-2 rounded-lg hover:bg-slate-200"
              >
                Batal
              </button>
            </div>
          </form>
        ))}
    </div>
  );
}
