"use client";
import Swal from "sweetalert2";

import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import { sendWaAction } from "@/app/actions/wa";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import QRCode from "react-qr-code";
import {
  IconPlus,
  IconDownload,
  IconSearch,
  IconCheck,
  IconAlert,
  IconEmpty,
  IconRefresh,
} from "./Icons";

export default function TabAnggotaSah() {
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [dpdList, setDpdList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingWA, setIsSendingWA] = useState(false);

  const [view, setView] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // Untuk centang massal

  // Filter States
  const [search, setSearch] = useState("");
  const [filterPeriode, setFilterPeriode] = useState("Semua");
  const [sortMode, setSortMode] = useState("nama");

  const [itemsPerPage, setItemsPerPage] = useState<number | string>(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
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
  const [bypassModal, setBypassModal] = useState({
    isOpen: false,
    user: null as any,
    domisili: "",
  });
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    data: null as any,
  });
  const [isFlipped, setIsFlipped] = useState(false);

  // Form State
  const [form, setForm] = useState({
    nama: "",
    wa: "",
    email: "",
    jabatan: "Anggota",
    bidang: "",
    linkTTD: "",
    isInti: false,
    fotoUrl: "",
    fotoPosition: "center",
    linkedinUrl: "",
    instagramUrl: "",
    isTampilBeranda: false,
    noUrut: "",
    isPengurus: true,
    status_pengurus: "Aktif",
    nia: "",
    periodeId: "",
    fakultas: "",
    programStudi: "",
    angkatan: "",
    domisili: "",
    role: "anggota",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, isOpen: false })), 4000);
  };

  // 🔥 FUNGSI KIRIM WHATSAPP 🔥
  const triggerWaApi = async (
    type: string,
    phone: string,
    nama: string,
    detailData: any = {},
  ) => {
    if (!phone || phone.length < 9) return false;
    try {
      const data = await sendWaAction({
        type,
        phone,
        nama,
        detail: detailData,
      });
      return data.success;
    } catch (error) {
      return false;
    }
  };

  const submitBypassNIA = async () => {
    const user = bypassModal.user;
    const finalDomisili = bypassModal.domisili;
    if (!finalDomisili) {
      return setToast({ isOpen: true, message: "Domisili wajib dipilih untuk kode wilayah NIA.", type: "error" });
    }

    const _swalRes = await Swal.fire({
      title: 'Konfirmasi',
      text: `Anda yakin ingin menerbitkan NIA untuk ${user.nama}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#ef4444'
    });
    if (_swalRes.isConfirmed) {
      setIsProcessing(true);
      try {
        const counterRef = doc(db, "pengaturan", "counter_nia");
        const counterSnap = await getDoc(counterRef);
        let newNumber = 89;
        if (counterSnap.exists())
          newNumber = (counterSnap.data().lastNumber || 88) + 1;
        await setDoc(counterRef, { lastNumber: newNumber }, { merge: true });

        const dateObj = new Date();
        const yearStr = dateObj.getFullYear().toString().slice(-2);
        const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");
        let kabStr = "00";
        const dom = finalDomisili.toLowerCase();
        if (dom.includes("sleman")) kabStr = "04";
        else if (dom.includes("bantul")) kabStr = "02";
        else if (dom.includes("gunung")) kabStr = "03";
        else if (dom.includes("kulon")) kabStr = "01";
        else if (dom.includes("kota") || dom.includes("yogya")) kabStr = "71";

        const urutStr = String(newNumber).padStart(4, "0");
        const finalNIA = `${yearStr}.${monthStr}.34.${kabStr}.${urutStr}`;

        await updateDoc(doc(db, "pengurus", user.id), {
          nia: finalNIA,
          domisili: finalDomisili
        });

        setToast({ isOpen: true, message: `NIA berhasil diterbitkan: ${finalNIA}`, type: "success" });
        
        setDetailModal(prev => ({ ...prev, data: { ...prev.data, nia: finalNIA, domisili: finalDomisili } }));
        setBypassModal({ isOpen: false, user: null, domisili: "" });
        fetchData();
      } catch (error) {
        console.error(error);
        setToast({ isOpen: true, message: "Gagal menerbitkan NIA.", type: "error" });
      } finally {
        setIsProcessing(false);
        setTimeout(() => setToast(prev => ({ ...prev, isOpen: false })), 4000);
      }
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const pSnap = await getDocs(
        query(collection(db, "periode"), orderBy("tglMulai", "desc")),
      );
      const pList = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPeriodeList(pList);

      const activePeriode = pList.find((p: any) => p.status === "Aktif");
      if (activePeriode && filterPeriode === "Semua")
        setFilterPeriode(activePeriode.id);

      const dSnap = await getDocs(
        query(collection(db, "dpd"), orderBy("nama", "asc")),
      );
      setDpdList(dSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const uSnap = await getDocs(
        query(collection(db, "pengurus"), orderBy("createdAt", "desc")),
      );
      const allUsers = uSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const sah = allUsers.filter(
        (u: any) => u.role === "anggota" && u.status_pengurus === "Aktif"
      );

      setPengurusList(sah);
    } catch (error) {
      showToast("Gagal memuat data personalia.", "error");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let result = pengurusList;
    if (filterPeriode !== "Semua")
      result = result.filter((p) => p.periodeId === filterPeriode);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nama?.toLowerCase().includes(q) ||
          p.jabatan?.toLowerCase().includes(q) ||
          p.bidang?.toLowerCase().includes(q) ||
          p.domisili?.toLowerCase().includes(q),
      );
    }
    if (sortMode === "Nama-Asc") {
      result.sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
    } else if (sortMode === "Nama-Desc") {
      result.sort((a, b) => (b.nama || "").localeCompare(a.nama || ""));
    } else if (sortMode === "NIA-Asc") {
      result.sort((a, b) => (a.nia || "").localeCompare(b.nia || ""));
    } else if (sortMode === "NIA-Desc") {
      result.sort((a, b) => (b.nia || "").localeCompare(a.nia || ""));
    } else if (sortMode === "Fakultas-Asc") {
      result.sort((a, b) => (a.fakultas || "").localeCompare(b.fakultas || ""));
    } else if (sortMode === "Fakultas-Desc") {
      result.sort((a, b) => (b.fakultas || "").localeCompare(a.fakultas || ""));
    }
    return result;
  }, [search, filterPeriode, sortMode, pengurusList]);

  const paginatedData = useMemo(() => {
    if (itemsPerPage === "Semua") return filteredData;
    const startIndex = (currentPage - 1) * (itemsPerPage as number);
    return filteredData.slice(startIndex, startIndex + (itemsPerPage as number));
  }, [filteredData, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterPeriode, sortMode]);

  const handleFormChange = (e: any) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const saveData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const finalData = {
        ...form,
        noUrut: form.noUrut ? Number(form.noUrut) : 99,
        role: "anggota",
      };
      if (editId) {
        await updateDoc(doc(db, "pengurus", editId), {
          ...finalData,
          updatedAt: new Date().toISOString(),
        });
        showToast("Data Anggota diperbarui.", "success");
      } else {
        await addDoc(collection(db, "pengurus"), {
          ...finalData,
          createdAt: new Date().toISOString(),
        });
        showToast("Data Anggota baru ditambahkan.", "success");
      }
      setEditId(null);
      await fetchData();
      setView("list");
    } catch (error) {
      showToast("Gagal menyimpan data.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const cabutPengurus = async (id: string, nama: string) => {
    const _swalRes = await Swal.fire({
      title: 'Konfirmasi',
      text: `Yakin ingin mencabut status Anggota dari ${nama}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#ef4444'
    });
    if (!_swalRes.isConfirmed) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "pengurus", id), {
        status_pengurus: "Nonaktif",
        updatedAt: new Date().toISOString(),
      });
      showToast(`Status Anggota ${nama} dicabut.`, "success");
      await fetchData();
    } catch (error) {
      showToast("Gagal merubah status.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const jadikanCalonPengurus = async (id: string, nama: string) => {
    const _swalRes = await Swal.fire({
      title: 'Konfirmasi',
      text: `Yakin ingin mempromosikan ${nama} menjadi Calon Pengurus? Data akan dipindah ke Antrean Daftar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#059669',
      cancelButtonColor: '#ef4444'
    });
    if (!_swalRes.isConfirmed) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "pengurus", id), {
        role: "calon_pengurus",
        updatedAt: new Date().toISOString(),
      });
      showToast(`${nama} berhasil dipindahkan ke Antrean Daftar.`, "success");
      await fetchData();
    } catch (error) {
      showToast("Gagal merubah status.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      if (deleteModal.type === "single" && deleteModal.id) {
        await deleteDoc(doc(db, "pengurus", deleteModal.id));
      } else if (deleteModal.type === "bulk" && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((id) => deleteDoc(doc(db, "pengurus", id))),
        );
      }
      showToast("Data dihapus permanen.", "success");
      await fetchData();
    } catch (error) {
      showToast("Gagal menghapus data.", "error");
    } finally {
      setIsProcessing(false);
      setDeleteModal({ isOpen: false, id: "", title: "", type: "single" });
    }
  };

  const handleExportData = () => {
    if (filteredData.length === 0)
      return showToast("Tidak ada data untuk diekspor.", "error");
    const wsData = filteredData.map((d, i) => ({
      No: i + 1,
      Nama: d.nama,
      WA: d.wa,
      Email: d.email,
      Fakultas: d.fakultas || "-",
      Prodi: d.programStudi || "-",
      Angkatan: d.angkatan || "-",
      Domisili: d.domisili || "-",
      NIA: d.nia || "Belum Terbit",
      Periode_ID: d.periodeId || "",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Anggota");
    XLSX.writeFile(wb, `Data_ANGGOTA_SAH.xlsx`);
  };

  const openDetail = (user: any) => {
    setDetailModal({ isOpen: true, data: user });
    setIsFlipped(false);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredData.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
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

      {/* MODAL PREVIEW KTA & KIRIM WHATSAPP */}
      {detailModal.isOpen && detailModal.data && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex flex-col items-center w-full max-w-sm">
            <div className="w-full max-w-[280px] mt-4 bg-white rounded-xl p-3 shadow-md border border-[#DADCE0]">
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setDetailModal({ isOpen: false, data: null })}
                  className="flex-1 bg-white text-[#5F6368] font-medium text-xs py-2 rounded-lg border border-[#DADCE0] hover:bg-slate-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW UTAMA */}
      {view === "list" ? (
        <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#DADCE0] flex flex-col gap-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="font-bold text-[#202124] text-[18px]">
                  Database Anggota Sah
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Daftar anggota yang telah disetujui.
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0">
                <button
                  onClick={handleExportData}
                  className="w-full md:w-auto text-xs font-bold border border-[#DADCE0] text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <IconDownload /> Export Excel
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full bg-[#F8F9FA] p-3 rounded-lg border border-[#EBEBEB]">
              <div className="relative w-full md:w-auto flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconSearch />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama atau domisili..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-[#DADCE0] rounded-lg text-sm bg-white outline-none focus:border-[#1A73E8] transition-colors shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="p-10 text-center text-slate-500">Memuat data...</div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F9FA] border-b border-[#DADCE0]">
                  <tr>
                    <th 
                      className="py-4 px-5 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-200 transition-colors group"
                      onClick={() => setSortMode(sortMode === "Nama-Asc" ? "Nama-Desc" : "Nama-Asc")}
                    >
                      <div className="flex items-center gap-1">
                        Nama
                        <span className="text-slate-400 group-hover:text-slate-600">
                          {sortMode === "Nama-Asc" ? "↑" : sortMode === "Nama-Desc" ? "↓" : "↕"}
                        </span>
                      </div>
                    </th>
                    <th 
                      className="py-4 px-5 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-200 transition-colors group"
                      onClick={() => setSortMode(sortMode === "Fakultas-Asc" ? "Fakultas-Desc" : "Fakultas-Asc")}
                    >
                      <div className="flex items-center gap-1">
                        Fakultas / Angkatan
                        <span className="text-slate-400 group-hover:text-slate-600">
                          {sortMode === "Fakultas-Asc" ? "↑" : sortMode === "Fakultas-Desc" ? "↓" : "↕"}
                        </span>
                      </div>
                    </th>
                    <th 
                      className="py-4 px-5 text-left text-xs font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-200 transition-colors group"
                      onClick={() => setSortMode(sortMode === "NIA-Asc" ? "NIA-Desc" : "NIA-Asc")}
                    >
                      <div className="flex items-center gap-1">
                        NIA
                        <span className="text-slate-400 group-hover:text-slate-600">
                          {sortMode === "NIA-Asc" ? "↑" : sortMode === "NIA-Desc" ? "↓" : "↕"}
                        </span>
                      </div>
                    </th>
                    <th className="py-4 px-5 text-right text-xs font-bold text-slate-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {paginatedData.map((user) => (
                    <tr key={user.id}>
                      <td className="py-4 px-5">{user.nama}</td>
                      <td className="py-4 px-5 text-xs text-slate-600">{user.fakultas || "-"} / {user.angkatan || "-"}</td>
                      <td className="py-4 px-5 font-mono text-xs">{user.nia || "-"}</td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setBypassModal({ isOpen: true, user: user, domisili: user.domisili || "" })} 
                            className="border border-blue-200 bg-blue-50 text-blue-700 p-1.5 rounded-md hover:bg-blue-100 shadow-sm transition-colors"
                            title={user.nia ? "Reset & Generate Ulang NIA" : "Generate NIA"}
                          >
                            <IconRefresh />
                          </button>
                          <button onClick={() => jadikanCalonPengurus(user.id, user.nama)} className="border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-emerald-100 shadow-sm transition-colors">Jadikan Pengurus</button>
                          <button onClick={() => cabutPengurus(user.id, user.nama)} className="border border-red-200 text-red-600 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-50 shadow-sm transition-colors">Cabut</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="bg-[#F8F9FA] border-t border-[#DADCE0] px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm">Tampilkan:</span>
              <select value={itemsPerPage} onChange={e => setItemsPerPage(e.target.value === "Semua" ? "Semua" : Number(e.target.value))} className="border rounded p-1">
                <option value={10}>10 Baris</option>
                <option value={20}>20 Baris</option>
                <option value="Semua">Semua Data</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 border rounded">Sebelumnya</button>
              <button disabled={currentPage * (itemsPerPage as number) >= filteredData.length} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 border rounded">Selanjutnya</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* BYPASS MODAL */}
      {bypassModal.isOpen && (
        <div className="fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-amber-50">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Data Anggota Sah</h3>
                <p className="text-xs text-slate-500">Kelola anggota yang telah disetujui</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                Beberapa data seperti <strong>Foto</strong> akan dilewati (di-bypass), namun <strong>Domisili</strong> wajib diisi untuk menentukan Kode Wilayah pada nomor NIA.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Pengurus</label>
                  <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 font-medium">
                    {bypassModal.user?.nama}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilih Domisili <span className="text-rose-500">*</span></label>
                  <select
                    value={bypassModal.domisili}
                    onChange={(e) => setBypassModal({ ...bypassModal, domisili: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-colors"
                  >
                    <option value="">-- Pilih Kabupaten/Kota --</option>
                    <option value="Kabupaten Sleman">Kabupaten Sleman</option>
                    <option value="Kabupaten Bantul">Kabupaten Bantul</option>
                    <option value="Kabupaten Gunungkidul">Kabupaten Gunungkidul</option>
                    <option value="Kabupaten Kulon Progo">Kabupaten Kulon Progo</option>
                    <option value="Kota Yogyakarta">Kota Yogyakarta</option>
                    <option value="Luar DIY">Luar DIY</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setBypassModal({ isOpen: false, user: null, domisili: "" })}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={submitBypassNIA}
                disabled={!bypassModal.domisili || isProcessing}
                className="px-4 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                {isProcessing ? "Memproses..." : "Generate Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
