"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";

export default function DataPesertaPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // --- 🔥 STATE PAGINATION, SORTING & LIMIT 🔥 ---
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "waktuDaftar", direction: "desc" });
  const [itemsPerPage, setItemsPerPage] = useState<number | "All">(10);
  const [currentPage, setCurrentPage] = useState(1);

  // --- STATE MODAL/UI ---
  const [resiModal, setResiModal] = useState<{
    isOpen: boolean;
    participantId: string;
    currentResi: string;
    participantName: string;
  }>({
    isOpen: false,
    participantId: "",
    currentResi: "",
    participantName: "",
  });
  const [proofModal, setProofModal] = useState<{
    isOpen: boolean;
    imgUrl: string;
  }>({ isOpen: false, imgUrl: "" });
  const [popup, setPopup] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // 1. Ambil Data Admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data Peserta Realtime (Tanpa limit Firestore, agar bisa di-sort & limit di Client)
  useEffect(() => {
    const q = query(collection(db, "vr_participants"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setParticipants(data);
    });
    return () => unsubscribe();
  }, []);

  // --- 🔥 LOGIKA SORTING & PAGINATION 🔥 ---
  const sortedParticipants = [...participants].sort((a, b) => {
    let valA = a[sortConfig.key] || "";
    let valB = b[sortConfig.key] || "";

    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages =
    itemsPerPage === "All"
      ? 1
      : Math.ceil(sortedParticipants.length / itemsPerPage);
  const paginatedData =
    itemsPerPage === "All"
      ? sortedParticipants
      : sortedParticipants.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage,
        );

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };

  // --- AKSI: UBAH STATUS BAYAR ---
  const handleUbahStatusBayar = async (
    id: string,
    newStatus: string,
    participantName: string,
  ) => {
    setLoadingAction(id);
    try {
      await updateDoc(doc(db, "vr_participants", id), {
        statusPembayaran: newStatus,
      });
      if (newStatus === "Lunas") {
        const targetPeserta = participants.find((p) => p.id === id);
        if (targetPeserta && targetPeserta.email) {
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "payment_success",
              email: targetPeserta.email,
              nama: targetPeserta.nama,
              detail: {},
            }),
          }).catch((e) => console.log("Gagal kirim notif email lunas", e));
        }
      }
      await addDoc(collection(db, "vr_logs"), {
        type: "bayar",
        action: `mengubah status pembayaran menjadi [${newStatus.toUpperCase()}] untuk`,
        targetName: participantName,
        adminEmail: adminUser?.email || "Admin",
        timestamp: Date.now(),
      });
      setPopup({
        type: "success",
        text: `Status ${participantName} berhasil diubah.`,
      });
    } catch (error) {
      setPopup({ type: "error", text: "Gagal merubah status pembayaran." });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- AKSI: SIMPAN RESI PENGIRIMAN ---
  const handleSimpanResi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("resi");
    try {
      await updateDoc(doc(db, "vr_participants", resiModal.participantId), {
        resiPengiriman: resiModal.currentResi,
      });
      await addDoc(collection(db, "vr_logs"), {
        type: "resi",
        action: `menginput resi pengiriman untuk`,
        targetName: resiModal.participantName,
        adminEmail: adminUser?.email || "Admin",
        timestamp: Date.now(),
      });
      setResiModal({
        isOpen: false,
        participantId: "",
        currentResi: "",
        participantName: "",
      });
      setPopup({ type: "success", text: "Nomor resi berhasil disimpan." });
    } catch (error) {
      setPopup({ type: "error", text: "Gagal menyimpan nomor resi." });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- BULK DELETE ---
  const toggleSelectParticipant = (id: string) => {
    if (selectedParticipants.includes(id))
      setSelectedParticipants(selectedParticipants.filter((pid) => pid !== id));
    else setSelectedParticipants([...selectedParticipants, id]);
  };

  const handleSelectAllVisible = () => {
    if (
      selectedParticipants.length === paginatedData.length &&
      paginatedData.length > 0
    ) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(paginatedData.map((p) => p.id));
    }
  };

  const deleteSelectedParticipants = async () => {
    if (
      !confirm(
        `Yakin ingin menghapus ${selectedParticipants.length} data peserta?`,
      )
    )
      return;
    setLoadingAction("deleteBulk");
    try {
      const batch = writeBatch(db);
      selectedParticipants.forEach((id) =>
        batch.delete(doc(db, "vr_participants", id)),
      );
      await batch.commit();
      setSelectedParticipants([]);
      setPopup({ type: "success", text: "Data peserta berhasil dihapus." });
    } catch (e) {
      setPopup({ type: "error", text: "Gagal menghapus data." });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (participants.length === 0)
      return setPopup({ type: "error", text: "Belum ada data." });
    const exportData = sortedParticipants.map((p, index) => ({
      No: index + 1,
      "Tanggal Daftar": p.waktuDaftar
        ? new Date(p.waktuDaftar).toLocaleString("id-ID")
        : "-",
      "Tipe Peserta": p.tipePeserta === "umum" ? "Umum" : "Alumni",
      "Nama Lengkap": p.nama || "-",
      Email: p.email || "-",
      WhatsApp: `'${p.whatsapp || "-"}`,
      Fakultas: p.fakultas || "-",
      Angkatan: p.angkatan || "-",
      "Kategori Jarak": p.jarak || "-",
      Paket: p.paket?.toUpperCase() || "-",
      Jersey: p.paket === "basic" ? "Tanpa Jersey" : p.ukuranJersey || "-",
      "Total Tagihan (Rp)": p.totalTagihan || 0,
      "Donasi Amal (Rp)": p.nominalDonasi || 0,
      "Status Bayar": p.statusPembayaran || "Pending",
      Alamat: p.paket === "basic" ? "Tanpa Pengiriman" : p.alamat || "-",
      Resi: p.resiPengiriman || "-",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data VR");
    XLSX.writeFile(workbook, `Data_Peserta_VR_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-[calc(100vh-2rem)] max-w-7xl mx-auto font-sans">
      {/* POPUP NOTIFIKASI */}
      {popup && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center gap-4 min-w-[300px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${popup.type === "success" ? "bg-[#E6F4EA] text-[#1E8E3E]" : popup.type === "error" ? "bg-[#FCE8E6] text-[#D93025]" : "bg-[#E8F0FE] text-[#1A73E8]"}`}
            >
              {popup.type === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                </svg>
              ) : popup.type === "error" ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                </svg>
              )}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-bold text-slate-800">
                {popup.type === "success"
                  ? "Berhasil"
                  : popup.type === "error"
                    ? "Gagal"
                    : "Informasi"}
              </p>
              <p className="text-xs text-slate-500">{popup.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INPUT RESI */}
      {resiModal.isOpen && (
        <div className="fixed inset-0 z-[105] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Input Nomor Resi
              </h3>
              <button
                onClick={() =>
                  setResiModal({
                    isOpen: false,
                    participantId: "",
                    currentResi: "",
                    participantName: "",
                  })
                }
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Pengiriman paket untuk:{" "}
              <strong className="text-slate-800">
                {resiModal.participantName}
              </strong>
            </p>
            <form onSubmit={handleSimpanResi}>
              <input
                type="text"
                autoFocus
                value={resiModal.currentResi || ""}
                onChange={(e) =>
                  setResiModal({ ...resiModal, currentResi: e.target.value })
                }
                placeholder="JNT123456789"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg mb-4 outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] text-sm uppercase font-mono bg-slate-50 font-bold"
              />
              <button
                type="submit"
                disabled={loadingAction === "resi"}
                className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {loadingAction === "resi" ? "Menyimpan..." : "Simpan Resi"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUKTI BAYAR */}
      {proofModal.isOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setProofModal({ isOpen: false, imgUrl: "" })}
        >
          <div
            className="bg-white rounded-2xl p-4 max-w-lg w-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Bukti Transfer
              </h3>
              <button
                onClick={() => setProofModal({ isOpen: false, imgUrl: "" })}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200 p-2 min-h-[300px] max-h-[70vh]">
              <img
                src={proofModal.imgUrl}
                alt="Bukti"
                className="object-contain w-full h-full rounded-lg"
              />
            </div>
            <button
              onClick={() => window.open(proofModal.imgUrl, "_blank")}
              className="mt-4 bg-[#F1F3F4] text-sm font-bold text-[#1A73E8] hover:bg-[#E8F0FE] py-2 rounded-lg transition-colors text-center"
            >
              Buka di Tab Baru
            </button>
          </div>
        </div>
      )}

      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-[26px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
            Database Peserta VR
            <span className="bg-[#E8F0FE] text-[#1A73E8] text-xs px-2.5 py-1 rounded-md border border-blue-100 font-bold">
              {participants.length} Terdaftar
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data pendaftaran, pembayaran, dan logistik pengiriman.
          </p>
        </div>
      </div>

      {/* 🔥 TOOLBAR: SORTING, LIMIT, & EXPORT 🔥 */}
      <div className="bg-white border border-slate-200 rounded-t-xl p-3 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-4">
          {/* Dropdown Jumlah Tampil */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase">
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
        </div>

        <div className="flex gap-2">
          {selectedParticipants.length > 0 && (
            <button
              onClick={deleteSelectedParticipants}
              disabled={loadingAction === "deleteBulk"}
              className="text-xs font-bold text-[#D93025] bg-white border border-slate-200 hover:bg-[#FCE8E6] hover:border-[#D93025] px-4 py-2 rounded-md transition-colors shadow-sm"
            >
              {loadingAction === "deleteBulk"
                ? "Menghapus..."
                : `Hapus (${selectedParticipants.length})`}
            </button>
          )}
          <button
            onClick={handleExportExcel}
            className="text-xs font-bold text-[#1E8E3E] bg-white border border-slate-200 hover:bg-[#E6F4EA] hover:border-[#1E8E3E] px-4 py-2 rounded-md transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
            </svg>
            Export Excel
          </button>
        </div>
      </div>

      {/* --- 🔥 TABEL DENGAN INTERNAL SCROLL 🔥 --- */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-xl shadow-sm overflow-hidden flex-grow flex flex-col min-h-0">
        {/* max-h & overflow auto bikin tabel tidak manjang ke bawah page */}
        <div className="overflow-x-auto overflow-y-auto custom-scrollbar flex-grow">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 bg-slate-100 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <tr className="text-slate-600 text-xs font-bold border-b border-slate-200">
                <th className="px-4 py-3 w-10 text-center border-r border-slate-200">
                  <input
                    type="checkbox"
                    checked={
                      selectedParticipants.length === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={handleSelectAllVisible}
                    className="w-4 h-4 cursor-pointer accent-[#1A73E8]"
                  />
                </th>

                {/* Header Sortable: Nama */}
                <th
                  className="px-4 py-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none"
                  onClick={() => handleSort("nama")}
                >
                  <div className="flex items-center justify-between">
                    Data Pelari
                    {sortConfig.key === "nama" && (
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

                {/* Header Sortable: Tanggal Daftar */}
                <th
                  className="px-4 py-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none w-36"
                  onClick={() => handleSort("waktuDaftar")}
                >
                  <div className="flex items-center justify-between">
                    Tgl Daftar
                    {sortConfig.key === "waktuDaftar" && (
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

                <th className="px-4 py-3 border-r border-slate-200 w-36">
                  Paket Lari
                </th>
                <th className="px-4 py-3 text-center border-r border-slate-200 w-32">
                  Status Bayar
                </th>
                <th className="px-4 py-3 w-48">Pengiriman (Resi)</th>
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
                    Belum ada data pada halaman ini.
                  </td>
                </tr>
              ) : (
                paginatedData.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 transition-colors ${selectedParticipants.includes(p.id) ? "bg-[#E8F0FE]/50" : ""}`}
                  >
                    <td className="px-4 py-3 text-center border-r border-slate-100 align-top">
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(p.id)}
                        onChange={() => toggleSelectParticipant(p.id)}
                        className="w-4 h-4 cursor-pointer accent-[#1A73E8]"
                      />
                    </td>

                    <td className="px-4 py-3 border-r border-slate-100 align-top">
                      <p className="font-bold text-slate-900 text-sm mb-0.5">
                        {p.nama}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono mb-1">
                        {p.whatsapp} • {p.email}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {p.tipePeserta === "umum" ? "UMUM" : "ALUMNI"}
                        </span>
                        {p.tipePeserta === "alumni" && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            {p.fakultas} • {p.angkatan}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 border-r border-slate-100 align-top">
                      <p className="text-xs text-slate-600 mb-1">
                        {p.waktuDaftar
                          ? new Date(p.waktuDaftar).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {p.waktuDaftar
                          ? new Date(p.waktuDaftar).toLocaleTimeString(
                              "id-ID",
                              { hour: "2-digit", minute: "2-digit" },
                            )
                          : "-"}
                      </p>
                    </td>

                    <td className="px-4 py-3 border-r border-slate-100 align-top">
                      <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded">
                        {p.jarak} • {p.paket?.toUpperCase()}
                      </span>
                      <div className="mt-2 text-[10px] font-bold text-slate-600">
                        {p.paket === "basic" ? (
                          <span className="text-slate-400">Tanpa Jersey</span>
                        ) : (
                          <span>
                            Jersey:{" "}
                            <strong className="text-slate-900">
                              {p.ukuranJersey || "-"}
                            </strong>
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center border-r border-slate-100 align-top">
                      <select
                        value={p.statusPembayaran || "Pending"}
                        onChange={(e) =>
                          handleUbahStatusBayar(p.id, e.target.value, p.nama)
                        }
                        disabled={loadingAction === p.id}
                        className={`text-[10px] font-bold uppercase rounded-md px-2 py-1.5 outline-none border cursor-pointer disabled:opacity-50 w-full shadow-sm ${
                          p.statusPembayaran === "Lunas"
                            ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20"
                            : p.statusPembayaran === "Pending"
                              ? "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20"
                              : "bg-[#FCE8E6] text-[#D93025] border-[#D93025]/20"
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Lunas">Lunas</option>
                        <option value="Batal">Batal</option>
                      </select>
                      {p.buktiBayarUrl && (
                        <button
                          onClick={() =>
                            setProofModal({
                              isOpen: true,
                              imgUrl: p.buktiBayarUrl,
                            })
                          }
                          className="mt-2 text-[9px] font-bold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-2 py-1 rounded w-full transition-colors border border-blue-100"
                        >
                          Lihat Struk
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {p.paket === "basic" ? (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center justify-center h-full">
                          Digital Only
                        </span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <div
                            className="text-[10px] text-slate-600 leading-tight max-w-[200px] line-clamp-2"
                            title={p.alamat}
                          >
                            <span className="font-bold text-slate-800 block mb-0.5">
                              Alamat:
                            </span>
                            {p.alamat || "-"}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-grow">
                              {p.resiPengiriman ? (
                                <div className="bg-slate-50 px-2 py-1 rounded border border-slate-200">
                                  <p
                                    className="text-[10px] font-mono font-bold text-slate-800 uppercase truncate"
                                    title={p.resiPengiriman}
                                  >
                                    {p.resiPengiriman}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[9px] text-[#D93025] font-bold uppercase bg-[#FCE8E6] px-2 py-1 rounded border border-[#D93025]/20">
                                  Resi Kosong
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                setResiModal({
                                  isOpen: true,
                                  participantId: p.id,
                                  currentResi: p.resiPengiriman || "",
                                  participantName: p.nama,
                                })
                              }
                              className="text-slate-400 hover:text-[#1A73E8] p-1.5 rounded bg-slate-50 hover:bg-[#E8F0FE] border border-slate-200 hover:border-[#1A73E8] transition-colors shrink-0"
                              title="Input/Edit Resi"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 🔥 FOOTER PAGINATION 🔥 */}
        {itemsPerPage !== "All" && (
          <div className="bg-white border-t border-slate-200 p-3 flex justify-between items-center text-xs font-medium text-slate-500">
            <div>
              Menampilkan {(currentPage - 1) * (itemsPerPage as number) + 1} -{" "}
              {Math.min(
                currentPage * (itemsPerPage as number),
                sortedParticipants.length,
              )}{" "}
              dari {sortedParticipants.length} data
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
    </div>
  );
}
