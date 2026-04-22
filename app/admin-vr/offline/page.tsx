"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  writeBatch,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import * as XLSX from "xlsx";

export default function AdminOfflineRunPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUser, setAdminUser] = useState<any>(null);

  // UI State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailParticipant, setDetailParticipant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- 🔥 STATE POPUP KONFIRMASI & PROGRESS (GOOGLE STYLE) 🔥 ---
  const [approveProcess, setApproveProcess] = useState<{
    isOpen: boolean;
    participant: any;
    step: "confirm" | "processing" | "success" | "error";
    message: string;
  }>({ isOpen: false, participant: null, step: "confirm", message: "" });

  // --- STATE PAGINATION, SORTING & LIMIT ---
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "waktuDaftar", direction: "desc" });
  const [itemsPerPage, setItemsPerPage] = useState<number | "All">(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "offline_participants"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setParticipants(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- LOGIKA FILTER, SEARCH, SORTING & PAGINATION ---
  const filteredData = participants.filter((p) => {
    const matchStatus =
      filterStatus === "Semua" || p.statusPembayaran === filterStatus;
    const matchSearch =
      p.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nomorBIB?.includes(searchQuery) ||
      p.nik?.includes(searchQuery) ||
      p.namaBib?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortConfig.key] || "";
    let valB = b[sortConfig.key] || "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  const totalPages =
    itemsPerPage === "All" ? 1 : Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData =
    itemsPerPage === "All"
      ? sortedData
      : sortedData.slice(
          (currentPage - 1) * (itemsPerPage as number),
          currentPage * (itemsPerPage as number),
        );

  // --- REKAP STATISTIK ---
  const totalLunas = participants.filter(
    (p) => p.statusPembayaran === "Lunas",
  ).length;
  const totalPending = participants.filter(
    (p) => p.statusPembayaran === "Pending",
  ).length;
  const totalUangLunas = participants
    .filter((p) => p.statusPembayaran === "Lunas")
    .reduce((acc, curr) => acc + (Number(curr.totalTagihan) || 0), 0);

  // --- SELECTION LOGIC ---
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };
  const toggleSelectAllVisible = () => {
    if (
      selectedIds.length === paginatedData.length &&
      paginatedData.length > 0
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedData.map((p) => p.id));
    }
  };

  // --- FITUR EKSPOR EXCEL ---
  const handleExportExcel = () => {
    const excelData = sortedData.map((p) => ({
      "Waktu Daftar": p.waktuDaftar
        ? new Date(p.waktuDaftar).toLocaleString("id-ID")
        : "-",
      "Nomor BIB": p.nomorBIB || "-",
      "Nama di BIB": p.namaBib || "-",
      "Nama Lengkap": p.namaLengkap || "-",
      NIK: p.nik || "-",
      Email: p.email || "-",
      "No. WhatsApp": p.noWA || "-",
      "Jenis Kelamin": p.jenisKelamin || "-",
      "Kategori Jarak": p.jarak || "-",
      "Paket Nama": p.paketNama || "-",
      "Ukuran Jersey": p.ukuranJersey || "-",
      "Golongan Darah": p.golonganDarah || "-",
      "Riwayat Penyakit": p.riwayatPenyakit || "-",
      "Kategori Peserta": p.kategoriPeserta || "-",
      "NIM (Alumni)": p.nim || "-",
      Fakultas: p.fakultas || "-",
      Prodi: p.programStudi || "-",
      Angkatan: p.tahunLulus || "-",
      "Nama Kontak Darurat": p.namaDarurat || "-",
      "No WA Darurat": p.waDarurat || "-",
      "Total Bayar": p.totalTagihan || 0,
      "Status Pembayaran": p.statusPembayaran || "Belum Bayar",
      "Logistik (Racepack)": p.isRacepackTaken ? "SUDAH DIAMBIL" : "BELUM",
      "Diserahkan Oleh (Admin)": p.adminHandler || "-",
      "Waktu Penyerahan": p.waktuAmbilRacepack
        ? new Date(p.waktuAmbilRacepack).toLocaleString("id-ID")
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Offline_Full");
    XLSX.writeFile(workbook, `REKAP_FULL_OFFLINE_${new Date().getTime()}.xlsx`);
  };

  // --- 🔥 AKSI PEMBAYARAN BARU DENGAN POPUP PROGRESS 🔥 ---
  const triggerApprove = (p: any) => {
    setApproveProcess({
      isOpen: true,
      participant: p,
      step: "confirm",
      message: "",
    });
  };

  const executeApproveProcess = async () => {
    const p = approveProcess.participant;
    if (!p) return;

    // Ubah state ke processing, tombol akan otomatis disable
    setApproveProcess((prev) => ({
      ...prev,
      step: "processing",
      message: "Mengupdate database & mengirim E-Ticket...",
    }));

    try {
      // 1. Update Firestore
      await updateDoc(doc(db, "offline_participants", p.id), {
        statusPembayaran: "Lunas",
      });

      // 2. Kirim Email
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "payment_success_offline",
          email: p.email,
          nama: p.namaLengkap,
          detail: { id: p.id },
        }),
      });

      if (!res.ok) throw new Error("Gagal mengirim email dari server.");

      // 3. Catat Log
      await addDoc(collection(db, "vr_logs"), {
        type: "bayar",
        action: "menyetujui pembayaran offline untuk",
        targetName: p.namaLengkap,
        adminEmail: adminUser?.email || "Admin",
        timestamp: Date.now(),
      });

      // Update state Detail Modal agar langsung berubah jadi Lunas tanpa perlu refresh
      if (detailParticipant?.id === p.id) {
        setDetailParticipant((prev: any) => ({
          ...prev,
          statusPembayaran: "Lunas",
        }));
      }

      // 4. Ubah state ke Success
      setApproveProcess((prev) => ({
        ...prev,
        step: "success",
        message: "Berhasil! Pembayaran lunas dan Email telah terkirim.",
      }));
    } catch (e: any) {
      setApproveProcess((prev) => ({
        ...prev,
        step: "error",
        message: e.message || "Terjadi kesalahan jaringan atau server.",
      }));
    }
  };

  const closeApproveProcess = () => {
    setApproveProcess({
      isOpen: false,
      participant: null,
      step: "confirm",
      message: "",
    });
  };

  // --- AKSI PENYERAHAN LOGISTIK ---
  const handleHandover = async (id: string, participantName: string) => {
    const adminEmail = auth.currentUser?.email || "Admin Lapangan";
    if (!confirm(`Konfirmasi penyerahan atribut untuk ${participantName}?`))
      return;
    setActionLoading(id);
    try {
      const dataUpdate = {
        isRacepackTaken: true,
        waktuAmbilRacepack: new Date().toISOString(),
        adminHandler: adminEmail,
      };
      await updateDoc(doc(db, "offline_participants", id), dataUpdate);
      if (detailParticipant?.id === id)
        setDetailParticipant({ ...detailParticipant, ...dataUpdate });

      await addDoc(collection(db, "vr_logs"), {
        type: "resi",
        action: "menyerahkan racepack offline untuk",
        targetName: participantName,
        adminEmail: adminEmail,
        timestamp: Date.now(),
      });
    } catch (e) {
      alert("Gagal memproses penyerahan.");
    }
    setActionLoading(null);
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Hapus ${selectedIds.length} data permanen?`)) return;
    const batch = writeBatch(db);
    selectedIds.forEach((id) =>
      batch.delete(doc(db, "offline_participants", id)),
    );
    await batch.commit();
    setSelectedIds([]);
  };

  if (isLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-[#1A73E8] font-medium text-sm">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
        MEMUAT DATA...
      </div>
    );

  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-[calc(100vh-2rem)] max-w-7xl mx-auto font-sans relative">
      {/* --- 🔥 MODAL APPROVE PROGRESS (GOOGLE MATERIAL STYLE) 🔥 --- */}
      {approveProcess.isOpen && approveProcess.participant && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              {/* STEP 1: CONFIRM */}
              {approveProcess.step === "confirm" && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 text-[#1A73E8] rounded-full flex items-center justify-center mx-auto mb-4">
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Verifikasi Pembayaran
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    Anda akan menyetujui status LUNAS untuk{" "}
                    <strong>{approveProcess.participant.namaLengkap}</strong>.
                    Sistem akan otomatis mengirimkan email E-Ticket.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={closeApproveProcess}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={executeApproveProcess}
                      className="px-5 py-2.5 text-sm font-bold bg-[#1A73E8] text-white rounded-lg hover:bg-[#1557B0] transition-colors shadow-sm"
                    >
                      Proses Sekarang
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: PROCESSING */}
              {approveProcess.step === "processing" && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mx-auto mb-4"></div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    Harap Tunggu...
                  </h3>
                  <p className="text-xs text-slate-500 animate-pulse">
                    {approveProcess.message}
                  </p>
                </div>
              )}

              {/* STEP 3: SUCCESS */}
              {approveProcess.step === "success" && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#E6F4EA] text-[#1E8E3E] rounded-full flex items-center justify-center mx-auto mb-4 animate-in zoom-in-50">
                    <svg
                      className="w-8 h-8"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Berhasil!
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    {approveProcess.message}
                  </p>
                  <button
                    onClick={closeApproveProcess}
                    className="w-full py-2.5 text-sm font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {/* STEP 4: ERROR */}
              {approveProcess.step === "error" && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#FCE8E6] text-[#D93025] rounded-full flex items-center justify-center mx-auto mb-4">
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
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Gagal Memproses
                  </h3>
                  <p className="text-sm text-[#D93025] mb-6">
                    {approveProcess.message}
                  </p>
                  <button
                    onClick={closeApproveProcess}
                    className="w-full py-2.5 text-sm font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Tutup & Coba Lagi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER & STATS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-[26px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
            Offline Run Management
            <span className="bg-[#E8F0FE] text-[#1A73E8] text-xs px-2.5 py-1 rounded-md border border-blue-100 font-bold">
              {participants.length} Terdaftar
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Data pendaftaran dan tracking logistik (Racepack).
          </p>
        </div>
      </div>

      {/* STATS GOOGLE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 shrink-0">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              Lunas
            </p>
            <p className="text-xl font-bold text-slate-800">{totalLunas}</p>
          </div>
          <div className="w-10 h-10 bg-[#E6F4EA] text-[#1E8E3E] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              Tertunda
            </p>
            <p className="text-xl font-bold text-slate-800">{totalPending}</p>
          </div>
          <div className="w-10 h-10 bg-[#FEF7E0] text-[#B08D00] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">
              Total Pemasukan
            </p>
            <p className="text-xl font-bold text-[#1E8E3E]">
              Rp {totalUangLunas.toLocaleString("id-ID")}
            </p>
          </div>
          <div className="w-10 h-10 bg-[#E8F0FE] text-[#1A73E8] rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
          </div>
        </div>
      </div>

      {/* FILTER & TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-t-xl p-3 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-md px-3 py-2 outline-none focus:border-[#1A73E8]"
          >
            <option value="Semua">Semua Status</option>
            <option value="Lunas">✅ Lunas</option>
            <option value="Pending">⏳ Pending</option>
            <option value="Belum Bayar">⚠️ Belum Bayar</option>
          </select>

          <div className="relative flex-grow md:w-64">
            <input
              type="text"
              placeholder="Cari Nama / BIB / NIK..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
            />
            <svg
              className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"
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
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase hidden sm:block">
              Tampilkan:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(
                  e.target.value === "All" ? "All" : Number(e.target.value),
                );
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-md px-2 py-1 outline-none focus:border-[#1A73E8]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value="All">Semua</option>
            </select>
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="text-xs font-bold text-[#D93025] bg-white border border-slate-200 hover:bg-[#FCE8E6] px-3 py-1.5 rounded-md transition-colors shadow-sm"
            >
              Hapus ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="text-xs font-bold text-[#1E8E3E] bg-white border border-slate-200 hover:bg-[#E6F4EA] px-3 py-1.5 rounded-md transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>{" "}
            Export
          </button>
        </div>
      </div>

      {/* --- 🔥 TABEL DENGAN INTERNAL SCROLL 🔥 --- */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm overflow-hidden flex-grow flex flex-col min-h-0">
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-grow">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <tr className="text-slate-600 text-xs font-bold border-b border-slate-200">
                <th className="px-4 py-3 w-10 text-center border-r border-slate-200">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={toggleSelectAllVisible}
                    className="w-4 h-4 cursor-pointer accent-[#1A73E8]"
                  />
                </th>

                <th
                  className="px-4 py-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200 select-none"
                  onClick={() => handleSort("namaLengkap")}
                >
                  <div className="flex items-center justify-between">
                    Peserta & NIK
                    {sortConfig.key === "namaLengkap" && (
                      <svg
                        className={`w-4 h-4 text-[#1A73E8] transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7 14l5-5 5 5z" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200 select-none w-40"
                  onClick={() => handleSort("nomorBIB")}
                >
                  <div className="flex items-center justify-between">
                    BIB & Kategori
                    {sortConfig.key === "nomorBIB" && (
                      <svg
                        className={`w-4 h-4 text-[#1A73E8] transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7 14l5-5 5 5z" />
                      </svg>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3 border-r border-slate-200 w-32 cursor-pointer hover:bg-slate-200 select-none"
                  onClick={() => handleSort("statusPembayaran")}
                >
                  <div className="flex items-center justify-between">
                    Pembayaran
                    {sortConfig.key === "statusPembayaran" && (
                      <svg
                        className={`w-4 h-4 text-[#1A73E8] transform ${sortConfig.direction === "desc" ? "rotate-180" : ""}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M7 14l5-5 5 5z" />
                      </svg>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 border-r border-slate-200 w-32">
                  Racepack
                </th>
                <th className="px-4 py-3 text-right w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-16 text-center text-slate-400 font-medium text-sm bg-slate-50"
                  >
                    <svg
                      className="w-12 h-12 mx-auto mb-3 text-slate-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" />
                    </svg>
                    Tidak ada data ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(p.id) ? "bg-[#E8F0FE]/50" : ""}`}
                  >
                    <td className="px-4 py-3 text-center border-r border-slate-100 align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 cursor-pointer accent-[#1A73E8]"
                      />
                    </td>

                    <td className="px-4 py-3 border-r border-slate-100 align-top">
                      <p className="font-bold text-slate-900 text-sm mb-0.5 uppercase">
                        {p.namaLengkap}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        NIK: {p.nik || "-"}
                      </p>
                    </td>

                    <td className="px-4 py-3 border-r border-slate-100 align-top">
                      <p className="font-bold text-[#1A73E8] text-base mb-0.5">
                        #{p.nomorBIB || "0000"}
                      </p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        {p.jarak} | {p.ukuranJersey}
                      </p>
                    </td>

                    <td className="px-4 py-3 border-r border-slate-100 align-top">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${p.statusPembayaran === "Lunas" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20" : p.statusPembayaran === "Pending" ? "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20" : "bg-[#FCE8E6] text-[#D93025] border-[#D93025]/20"}`}
                      >
                        {p.statusPembayaran}
                      </span>
                    </td>

                    <td className="px-4 py-3 border-r border-slate-100 align-top">
                      {p.isRacepackTaken ? (
                        <span className="text-[#1E8E3E] font-bold text-[11px] flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                          </svg>{" "}
                          DIAMBIL
                        </span>
                      ) : (
                        <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                          </svg>{" "}
                          BELUM
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right align-top">
                      <button
                        onClick={() => setDetailParticipant(p)}
                        className="bg-white border border-slate-200 text-[#1A73E8] hover:bg-[#E8F0FE] px-3 py-1.5 rounded-md font-bold text-xs transition-colors shadow-sm"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER PAGINATION */}
        {itemsPerPage !== "All" && (
          <div className="bg-white border-t border-slate-200 p-3 flex justify-between items-center text-xs font-medium text-slate-500">
            <div>
              Menampilkan {(currentPage - 1) * (itemsPerPage as number) + 1} -{" "}
              {Math.min(
                currentPage * (itemsPerPage as number),
                sortedData.length,
              )}{" "}
              dari {sortedData.length} data
            </div>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => prev - 1)}
                className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Sebelummya
              </button>
              <button
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => prev + 1)}
                className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 MODAL DETAIL (GOOGLE STYLE) 🔥 */}
      {detailParticipant && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h2 className="text-sm font-bold text-slate-800 uppercase flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                Detail Pendaftar Offline
              </h2>
              <button
                onClick={() => setDetailParticipant(null)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 custom-scrollbar bg-white">
              {/* TRACKING HANDOVER INFO */}
              {detailParticipant.isRacepackTaken && (
                <div className="mb-6 p-4 bg-[#E6F4EA] rounded-lg border border-[#1E8E3E]/20">
                  <div className="flex items-center gap-2 mb-2 text-[#1E8E3E]">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                    </svg>
                    <p className="text-[11px] font-bold uppercase tracking-wider">
                      Atribut Telah Diserahkan
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 ml-6">
                    <div>
                      <p className="text-[9px] text-[#1E8E3E]/80 uppercase font-bold">
                        Waktu Penyerahan
                      </p>
                      <p className="text-xs font-bold text-[#1E8E3E]">
                        {detailParticipant.waktuAmbilRacepack
                          ? new Date(
                              detailParticipant.waktuAmbilRacepack,
                            ).toLocaleString("id-ID", {
                              dateStyle: "long",
                              timeStyle: "short",
                            })
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-[#1E8E3E]/80 uppercase font-bold">
                        Petugas (Admin)
                      </p>
                      <p className="text-xs font-bold text-[#1E8E3E]">
                        {detailParticipant.adminHandler || "Staff Lapangan"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Data Pribadi */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-[#1A73E8] uppercase border-b border-[#E8F0FE] pb-1">
                    Identitas
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">
                        Nama Lengkap
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {detailParticipant.namaLengkap}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">
                        Nama di BIB
                      </p>
                      <p className="text-sm font-bold text-[#1A73E8]">
                        {detailParticipant.namaBib || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">
                        NIK / WA / Email
                      </p>
                      <p className="text-sm font-medium text-slate-800">
                        {detailParticipant.nik} <br /> {detailParticipant.noWA}{" "}
                        <br /> {detailParticipant.email}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Data Tiket & Medis */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-[#1A73E8] uppercase border-b border-[#E8F0FE] pb-1">
                    Atribut & Medis
                  </h4>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-bold text-slate-500 uppercase">
                        BIB
                      </span>
                      <span className="text-2xl font-black text-slate-900">
                        {detailParticipant.nomorBIB || "0000"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-slate-600">
                        {detailParticipant.jarak} -{" "}
                        {detailParticipant.paketNama}
                      </span>
                      <span className="text-[#1A73E8]">
                        Size: {detailParticipant.ukuranJersey}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">
                      Medis & Darurat
                    </p>
                    <p className="text-xs font-medium text-slate-800 mb-0.5">
                      Darah {detailParticipant.golonganDarah} |{" "}
                      {detailParticipant.riwayatPenyakit || "Sehat"}
                    </p>
                    <p className="text-xs font-medium text-slate-800">
                      Kontak: {detailParticipant.namaDarurat} (
                      {detailParticipant.waDarurat})
                    </p>
                  </div>
                </div>
              </div>

              {detailParticipant.buktiBayarUrl && (
                <div className="mt-8 border-t border-slate-100 pt-6 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">
                    Bukti Pembayaran
                  </p>
                  <img
                    src={detailParticipant.buktiBayarUrl}
                    alt="Struk"
                    className="max-w-[200px] mx-auto rounded-lg shadow-sm border border-slate-200 cursor-pointer"
                    onClick={() =>
                      setSelectedImage(detailParticipant.buktiBayarUrl)
                    }
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-center relative">
              {detailParticipant.statusPembayaran === "Pending" && (
                <button
                  onClick={() => triggerApprove(detailParticipant)}
                  className="bg-[#1A73E8] text-white text-[11px] font-bold px-6 py-2 rounded-md hover:bg-[#1557B0]"
                >
                  Setujui & Kirim Email
                </button>
              )}
              {detailParticipant.statusPembayaran === "Lunas" &&
                !detailParticipant.isRacepackTaken && (
                  <button
                    onClick={() =>
                      handleHandover(
                        detailParticipant.id,
                        detailParticipant.namaLengkap,
                      )
                    }
                    className="bg-[#1E8E3E] text-white text-[11px] font-bold px-6 py-2 rounded-md hover:bg-[#188038]"
                  >
                    Serahkan Atribut
                  </button>
                )}
              {detailParticipant.isRacepackTaken && (
                <div className="px-4 py-2 bg-[#E6F4EA] text-[#1E8E3E] rounded-md text-[10px] font-bold">
                  Atribut Diterima
                </div>
              )}
              <button
                onClick={() => setDetailParticipant(null)}
                className="bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-6 py-2 rounded-md hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PREVIEW STRUK */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Struk"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}
