"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";

export default function VerifikasiAnggotaPage() {
  const [pendaftarList, setPendaftarList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Dalam Proses");
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // STATE PENCARIAN

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [approveModal, setApproveModal] = useState({
    isOpen: false,
    user: null as any,
  });
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    user: null as any,
    reason: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: "single",
    id: "",
    title: "",
  });

  const fetchPendaftar = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "pendaftar"),
        orderBy("tanggalDaftar", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPendaftarList(data);
    } catch (error) {
      console.error("Error fetching data: ", error);
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchPendaftar();
  }, []);

  // --- FILTERING (STATUS + PENCARIAN) ---
  const filteredList = useMemo(() => {
    return pendaftarList.filter((p) => {
      const matchStatus = p.status === filterStatus;
      const lowerSearch = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (p.namaLengkap && p.namaLengkap.toLowerCase().includes(lowerSearch)) ||
        (p.nim && p.nim.toLowerCase().includes(lowerSearch)) ||
        (p.fakultas && p.fakultas.toLowerCase().includes(lowerSearch)) ||
        (p.pekerjaan && p.pekerjaan.toLowerCase().includes(lowerSearch));

      return matchStatus && matchSearch;
    });
  }, [pendaftarList, filterStatus, searchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(filteredList.map((item) => item.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (e.target.checked) setSelectedIds((prev) => [...prev, id]);
    else setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  // --- FUNGSI PEMANGGIL API EMAIL ---
  const triggerEmailApi = async (
    type: string,
    email: string,
    nama: string,
    alasanDetail?: string,
  ) => {
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: type,
          email: email,
          nama: nama,
          detail: { alasan: alasanDetail },
        }),
      });
    } catch (error) {
      console.error(`Gagal trigger API Email ${type}:`, error);
    }
  };

  // --- EKSEKUSI APPROVE ---
  const executeApprove = async () => {
    const user = approveModal.user;
    if (!user) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "pendaftar", user.id), {
        status: "Disetujui",
      });

      await addDoc(collection(db, "pengurus"), {
        nama: user.namaLengkap,
        wa: user.noWA,
        email: user.email,
        jabatan: "Anggota",
        bidang: "Belum Ditentukan",
        fotoUrl: "",
        linkTTD: "",
        isInti: false,
        isTampilBeranda: false,
        linkedinUrl: "",
        instagramUrl: "",
        createdAt: new Date().toISOString(),
      });

      // Panggil API Email
      await triggerEmailApi("approve_anggota", user.email, user.namaLengkap);

      setApproveModal({ isOpen: false, user: null });
      setIsDetailModalOpen(false);
      fetchPendaftar();
    } catch (error) {
      console.error("Gagal menyetujui: ", error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- EKSEKUSI REJECT ---
  const executeReject = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = rejectModal.user;
    if (!user || !rejectModal.reason.trim()) return;

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "pendaftar", user.id), {
        status: "Ditolak",
        alasanPenolakan: rejectModal.reason,
      });

      // Panggil API Email dengan data alasan penolakan
      await triggerEmailApi(
        "reject_anggota",
        user.email,
        user.namaLengkap,
        rejectModal.reason,
      );

      setRejectModal({ isOpen: false, user: null, reason: "" });
      setIsDetailModalOpen(false);
      fetchPendaftar();
    } catch (error) {
      console.error("Gagal menolak: ", error);
      alert("Terjadi kesalahan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      if (deleteModal.type === "single" && deleteModal.id) {
        await deleteDoc(doc(db, "pendaftar", deleteModal.id));
      } else if (deleteModal.type === "bulk" && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((id) => deleteDoc(doc(db, "pendaftar", id))),
        );
      }
      setDeleteModal({ isOpen: false, type: "single", id: "", title: "" });
      fetchPendaftar();
    } catch (error) {
      console.error("Gagal menghapus: ", error);
      alert("Terjadi kesalahan saat menghapus data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      alert("Tidak ada data untuk diekspor pada status ini.");
      return;
    }

    const formattedData = filteredList.map((d, index) => ({
      No: index + 1,
      "Tanggal Daftar":
        new Date(d.tanggalDaftar).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB",
      Status: d.status,
      "Nama Lengkap": d.namaLengkap,
      "Nomor WA": d.noWA,
      Email: d.email,
      Fakultas: d.fakultas,
      "Program Studi": d.programStudi,
      NIM: d.nim,
      "Tahun Lulus": d.tahunLulus,
      Domisili: d.domisili,
      Pekerjaan: d.pekerjaan,
      "Bidang Keahlian": d.keahlian,
      "Motivasi / Motto": d.motto,
      "Alasan Penolakan": d.alasanPenolakan || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wscols = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 30 },
      { wch: 40 },
      { wch: 30 },
    ];
    ws["!cols"] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Data_${filterStatus}`);
    XLSX.writeFile(
      wb,
      `Pendaftar_IKA_UII_${filterStatus.replace(/\s+/g, "_")}.xlsx`,
    );
  };

  const openDetail = (user: any) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12 font-sans text-slate-800">
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-blue-950 mb-1">
            Verifikasi Anggota Baru
          </h2>
          <p className="text-slate-500 text-sm">
            Kelola persetujuan pendaftaran dari portal publik IKA UII DIY.
          </p>
        </div>
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
              className="text-xs bg-red-50 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-100 transition-colors shadow-sm font-bold flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
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
              Hapus ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR PINTAR */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center p-2 gap-3">
        <div className="flex w-full sm:w-auto overflow-x-auto no-scrollbar">
          {["Dalam Proses", "Disetujui", "Ditolak"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilterStatus(tab);
                setSelectedIds([]);
                setSearchQuery("");
              }}
              className={`px-5 py-2.5 text-sm font-bold transition-all rounded-lg whitespace-nowrap ${
                filterStatus === tab
                  ? "bg-blue-50 text-blue-800 border border-blue-100"
                  : "bg-transparent border-transparent text-slate-500 hover:bg-slate-50"
              }`}
            >
              {tab}
              <span
                className={`ml-2 px-2 py-0.5 rounded-md text-[10px] ${filterStatus === tab ? "bg-blue-200/50 text-blue-700" : "bg-slate-100 text-slate-500"}`}
              >
                {pendaftarList.filter((p) => p.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* FITUR 1: SEARCH BAR KEKINIAN */}
        <div className="relative w-full sm:w-64 shrink-0 px-2 sm:px-0 pb-2 sm:pb-0 pr-0 sm:pr-2">
          <div className="absolute inset-y-0 left-0 sm:left-2 pl-3 sm:pl-1 flex items-center pointer-events-none pb-2 sm:pb-0">
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
            placeholder="Cari nama, NIM, fakultas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 hover:bg-white focus:bg-white placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-500 mt-4 font-medium">
                Memuat data...
              </p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <svg
                  className="w-8 h-8 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">
                {searchQuery
                  ? "Tidak ditemukan pendaftar dengan kata kunci tersebut."
                  : "Tidak ada data pendaftar untuk status ini."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="px-4 py-4 w-8 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        filteredList.length > 0 &&
                        selectedIds.length === filteredList.length
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider">
                    Identitas & Kontak
                  </th>
                  <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider">
                    Latar Belakang UII
                  </th>
                  <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider">
                    Profesi & Domisili
                  </th>
                  <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="px-4 py-4 font-bold text-xs uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(user.id)}
                        onChange={(e) => handleSelectOne(e, user.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-800">
                        {user.namaLengkap}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 font-mono">
                        {user.noWA} • {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-blue-900">
                        {user.fakultas}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        NIM: {user.nim} | Lulus: {user.tahunLulus}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                        {user.pekerjaan}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                        Domisili: {user.domisili}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          user.status === "Dalam Proses"
                            ? "bg-orange-50 text-orange-700 border-orange-200"
                            : user.status === "Disetujui"
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button
                        onClick={() => openDetail(user)}
                        className="bg-white hover:bg-slate-50 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition-colors text-xs border border-slate-200 shadow-sm"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() =>
                          setDeleteModal({
                            isOpen: true,
                            type: "single",
                            id: user.id,
                            title: user.namaLengkap,
                          })
                        }
                        className="bg-white hover:bg-red-50 text-red-600 font-bold p-1.5 rounded-lg transition-colors text-xs border border-slate-200 shadow-sm"
                        title="Hapus Data"
                      >
                        <svg
                          className="w-4 h-4"
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
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL AREA */}
      {/* ========================================================================= */}

      {/* 1. MODAL DETAIL USER */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-lg text-blue-950">
                Detail Pendaftar
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 bg-white rounded-md shadow-sm border border-slate-200"
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
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-grow custom-scrollbar space-y-6">
              {selectedUser.status === "Ditolak" &&
                selectedUser.alasanPenolakan && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex gap-3">
                    <svg
                      className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="text-xs font-bold text-red-800 mb-1">
                        Alasan Penolakan:
                      </h4>
                      <p className="text-sm font-medium text-red-700">
                        {selectedUser.alasanPenolakan}
                      </p>
                    </div>
                  </div>
                )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Nama Lengkap
                  </h4>
                  <p className="font-semibold text-slate-800">
                    {selectedUser.namaLengkap}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Tanggal Daftar
                  </h4>
                  <p className="font-medium text-slate-700">
                    {new Date(selectedUser.tanggalDaftar).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}{" "}
                    WIB
                  </p>
                </div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                    Fakultas & Prodi
                  </h4>
                  <p className="font-bold text-blue-900 text-sm">
                    {selectedUser.fakultas}
                  </p>
                  <p className="font-medium text-blue-700 text-xs mt-0.5">
                    {selectedUser.programStudi}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                    NIM & Angkatan
                  </h4>
                  <p className="font-bold text-blue-900 text-sm">
                    {selectedUser.nim}
                  </p>
                  <p className="font-medium text-blue-700 text-xs mt-0.5">
                    Lulus Tahun: {selectedUser.tahunLulus}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Kontak
                  </h4>
                  <p className="font-mono text-sm font-medium text-slate-700">
                    WA: {selectedUser.noWA}
                  </p>
                  <p className="font-mono text-sm font-medium text-slate-700 mt-1">
                    Email: {selectedUser.email}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Domisili & Pekerjaan
                  </h4>
                  <p className="font-medium text-slate-700 text-sm">
                    {selectedUser.domisili}
                  </p>
                  <p className="font-medium text-slate-700 text-sm mt-1">
                    {selectedUser.pekerjaan}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Bidang Keahlian
                  </h4>
                  <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm leading-relaxed">
                    {selectedUser.keahlian}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                    Motivasi & Harapan
                  </h4>
                  <p className="font-medium text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm leading-relaxed italic">
                    "{selectedUser.motto}"
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3 justify-end">
              {selectedUser.status === "Dalam Proses" ? (
                <>
                  <button
                    onClick={() =>
                      setRejectModal({
                        isOpen: true,
                        user: selectedUser,
                        reason: "",
                      })
                    }
                    className="px-5 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Tolak Pendaftar
                  </button>
                  <button
                    onClick={() =>
                      setApproveModal({ isOpen: true, user: selectedUser })
                    }
                    className="px-5 py-2.5 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 shadow-lg shadow-green-600/30 transition-all flex items-center gap-2"
                  >
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
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Setujui & Jadikan Anggota
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-slate-900 transition-colors"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL KONFIRMASI APPROVE */}
      {approveModal.isOpen && approveModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center border border-slate-100">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
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
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Setujui Anggota?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Data <strong>{approveModal.user.namaLengkap}</strong> akan
              disetujui, disalin ke Database Personalia, dan Email Notifikasi
              Penerimaan akan dikirim.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setApproveModal({ isOpen: false, user: null })}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-full"
              >
                Batal
              </button>
              <button
                onClick={executeApprove}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition-colors w-full shadow-md shadow-green-600/20"
              >
                {isProcessing ? "Memproses..." : "Ya, Setujui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL KONFIRMASI REJECT (Dengan Input Alasan) */}
      {rejectModal.isOpen && rejectModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                <svg
                  className="w-6 h-6"
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
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 leading-tight">
                  Tolak Pendaftaran
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {rejectModal.user.namaLengkap}
                </p>
              </div>
            </div>
            <form onSubmit={executeReject}>
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Cth: NIM tidak valid / Bukan alumni UII / Data tidak lengkap..."
                  value={rejectModal.reason}
                  onChange={(e) =>
                    setRejectModal({ ...rejectModal, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Alasan ini akan dikirimkan otomatis melalui Email ke
                  pendaftar.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setRejectModal({ isOpen: false, user: null, reason: "" })
                  }
                  disabled={isProcessing}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-full"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !rejectModal.reason.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors w-full shadow-md shadow-red-600/20 disabled:opacity-50"
                >
                  {isProcessing ? "Memproses..." : "Kirim Penolakan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL KONFIRMASI HAPUS (Single/Bulk) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center border border-slate-100">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8"
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
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              Hapus Permanen?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Yakin ingin menghapus <strong>{deleteModal.title}</strong>? Data
              tidak dapat dikembalikan.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    type: "single",
                    id: "",
                    title: "",
                  })
                }
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors w-full"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isProcessing}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors w-full shadow-md shadow-red-600/20"
              >
                {isProcessing ? "Proses..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
