"use client";

import { useState, useEffect, useMemo } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";
import {
  CircleDollarSign,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Edit3,
  AlertTriangle,
  Bell,
  Search,
  Users,
  Clock,
  X,
} from "lucide-react";
import { sendEmailAction } from "@/app/actions/email";


export default function DataPesertaPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    [],
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // --- 🔥 STATE TAB FILTER & SEARCH 🔥 ---
  const [activeTab, setActiveTab] = useState<"all" | "lunas" | "belum_bayar" | "batal">("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    data: any | null;
  }>({ isOpen: false, data: null });

  // 🔥 STATE UNTUK POPUP UBAH STATUS PEMBAYARAN 🔥
  const [paymentModal, setPaymentModal] = useState<{
    isOpen: boolean;
    participantId: string;
    participantName: string;
    currentStatus: string;
  }>({
    isOpen: false,
    participantId: "",
    participantName: "",
    currentStatus: "Pending",
  });

  // 🔥 STATE UNTUK MODAL EDIT JARAK 🔥
  const [jarakModal, setJarakModal] = useState<{
    isOpen: boolean;
    participantId: string;
    participantName: string;
    currentJarak: string;
  }>({
    isOpen: false,
    participantId: "",
    participantName: "",
    currentJarak: "",
  });

  // 🔥 STATE UNTUK MODAL EDIT DATA PESERTA 🔥
  const [editDataModal, setEditDataModal] = useState<{
    isOpen: boolean;
    data: any | null;
  }>({
    isOpen: false,
    data: null,
  });

  const [popup, setPopup] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // 1. Ambil Data Admin (untuk verifikasi sesi, token diambil saat aksi)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {});
    return () => unsubscribe();
  }, []);

  // 2. Fetch Data Peserta Realtime
  useEffect(() => {
    const q = query(collection(db, "vr_participants"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setParticipants(data);
    });
    return () => unsubscribe();
  }, []);

  // --- 🔥 STATISTIK HITUNGAN PER TAB 🔥 ---
  const countLunas = useMemo(
    () => participants.filter((p) => p.statusPembayaran === "Lunas").length,
    [participants]
  );
  const countBelumBayar = useMemo(
    () =>
      participants.filter(
        (p) =>
          p.statusPembayaran !== "Lunas" && p.statusPembayaran !== "Batal"
      ).length,
    [participants]
  );
  const countBatal = useMemo(
    () => participants.filter((p) => p.statusPembayaran === "Batal").length,
    [participants]
  );
  const countSemua = participants.length;

  // --- 🔥 FILTERING BERDASARKAN TAB & SEARCH QUERY 🔥 ---
  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // 1. Filter Tab
      if (activeTab === "lunas" && p.statusPembayaran !== "Lunas") return false;
      if (
        activeTab === "belum_bayar" &&
        (p.statusPembayaran === "Lunas" || p.statusPembayaran === "Batal")
      )
        return false;
      if (activeTab === "batal" && p.statusPembayaran !== "Batal") return false;

      // 2. Filter Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNama = p.nama?.toLowerCase()?.includes(q);
        const matchEmail = p.email?.toLowerCase()?.includes(q);
        const matchWa = p.whatsapp?.toLowerCase()?.includes(q);
        const matchBib = p.nomorBibLengkap?.toLowerCase()?.includes(q);
        const matchJarak = p.jarak?.toLowerCase()?.includes(q);
        const matchPaket = p.paket?.toLowerCase()?.includes(q);
        const matchResi = p.resiPengiriman?.toLowerCase()?.includes(q);
        const matchAlumni =
          p.fakultas?.toLowerCase()?.includes(q) ||
          p.angkatan?.toLowerCase()?.includes(q);

        if (
          !matchNama &&
          !matchEmail &&
          !matchWa &&
          !matchBib &&
          !matchJarak &&
          !matchPaket &&
          !matchResi &&
          !matchAlumni
        ) {
          return false;
        }
      }

      return true;
    });
  }, [participants, activeTab, searchQuery]);

  // --- 🔥 LOGIKA SORTING & PAGINATION 🔥 ---
  const sortedParticipants = useMemo(() => {
    return [...filteredParticipants].sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];

      if (sortConfig.key === "waktuDaftar") {
        const timeA = new Date(valA || 0).getTime() || 0;
        const timeB = new Date(valB || 0).getTime() || 0;
        return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
      }

      if (sortConfig.key === "nomorBIB" || sortConfig.key === "bib") {
        const numA = parseInt(String(valA || "").replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(String(valB || "").replace(/\D/g, ""), 10) || 0;
        return sortConfig.direction === "asc" ? numA - numB : numB - numA;
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredParticipants, sortConfig]);

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

  const handleTabChange = (tab: "all" | "lunas" | "belum_bayar" | "batal") => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSelectedParticipants([]);
  };

  // --- 🔒 HELPER: SEMUA AKSI TULIS ADMIN VIA ROUTE SERVER (dbAdmin) ---
  // Client tidak lagi menulis langsung ke Firestore supaya Security Rules
  // bisa mengunci field sensitif (statusPembayaran, resi, jarak, BIB).
  const callAdminAction = async (action: string, payload: any) => {
    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Sesi admin tidak valid, silakan login ulang.");

    const res = await fetch("/api/vr-admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ action, ...payload }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Gagal memproses aksi.");
    return data;
  };

  // --- 🔥 AKSI: UBAH STATUS BAYAR & AUTO GENERATE BIB (via server) 🔥 ---
  const executeStatusChange = async (newStatus: string) => {
    const { participantId: id, participantName } = paymentModal;
    setPaymentModal({ ...paymentModal, isOpen: false }); // Tutup modal duluan
    setLoadingAction(id);

    try {
      const targetPeserta = participants.find((p) => p.id === id);

      // Server yang generate nomor BIB + catat log (lihat /api/vr-admin)
      await callAdminAction("update-status", { id, status: newStatus });

      // Kirim Email Notifikasi Lunas
      if (newStatus === "Lunas" && targetPeserta && targetPeserta.email) {
        sendEmailAction({
            type: "payment_success",
            email: targetPeserta.email,
            nama: targetPeserta.nama,
            detail: {
              eventName: "Virtual Run DPW IKA UII DIY",
            },
          }).catch((e) => console.log("Gagal kirim notif email lunas", e));
      }

      setPopup({
        type: "success",
        text: `Status ${participantName} berhasil diubah jadi ${newStatus}.`,
      });
    } catch (error: any) {
      console.error("Gagal ubah status:", error);
      setPopup({ type: "error", text: error?.message || "Gagal merubah status pembayaran." });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- AKSI: SIMPAN RESI PENGIRIMAN (via server) ---
  const handleSimpanResi = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAction("resi");
    try {
      await callAdminAction("update-resi", {
        id: resiModal.participantId,
        resi: resiModal.currentResi,
      });
      setResiModal({
        isOpen: false,
        participantId: "",
        currentResi: "",
        participantName: "",
      });
      setPopup({ type: "success", text: "Nomor resi berhasil disimpan." });
    } catch (error: any) {
      setPopup({ type: "error", text: error?.message || "Gagal menyimpan nomor resi." });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- AKSI: EDIT JARAK PESERTA (via server) ---
  const handleEditJarak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jarakModal.currentJarak) return;
    setLoadingAction("editJarak");
    try {
      await callAdminAction("update-jarak", {
        id: jarakModal.participantId,
        jarak: jarakModal.currentJarak,
      });
      setJarakModal({ isOpen: false, participantId: "", participantName: "", currentJarak: "" });
      setPopup({ type: "success", text: `Jarak ${jarakModal.participantName} berhasil diubah ke ${jarakModal.currentJarak}.` });
    } catch (error: any) {
      setPopup({ type: "error", text: error?.message || "Gagal mengubah jarak peserta." });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- AKSI: UPDATE DATA PESERTA (via server) ---
  const handleEditData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDataModal.data) return;
    setLoadingAction("editData");
    try {
      await callAdminAction("update-data", {
        id: editDataModal.data.id,
        data: editDataModal.data,
      });
      setEditDataModal({ isOpen: false, data: null });
      setPopup({ type: "success", text: `Data peserta berhasil diubah.` });
    } catch (error: any) {
      setPopup({ type: "error", text: error?.message || "Gagal mengubah data peserta." });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- AKSI: KIRIM REMINDER PEMBAYARAN ---
  const handleSendReminder = async (p: any) => {
    if (!confirm(`Kirim email reminder pembayaran ke ${p.nama}?`)) return;
    setLoadingAction(`reminder-${p.id}`);
    try {
      // Ambil pengaturan bank terkini dari database
      const settingsRef = doc(db, "settings", "virtual_run");
      const settingsSnap = await getDoc(settingsRef);
      const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};

      const payload = {
        type: "vr_payment_reminder",
        email: p.email,
        nama: p.nama,
        detail: {
          event: "Virtual Run DPW IKA UII DIY",
          paket: p.paket,
          totalTagihan: p.totalTagihan,
          alamat: p.alamat || "Tidak ada pengiriman (Ambil Sendiri)",
          bank: p.bank || settingsData.manualBank || "BNI",
          rekening: p.rekening || settingsData.manualRekening || "8880801816",
          atasNama: p.atasNama || settingsData.manualNama || "DPW IKA UII DIY",
          id: p.id
        },
      };
      const res = await sendEmailAction(payload);
      if (res?.success) {
        setPopup({ type: "success", text: `Reminder berhasil dikirim ke email ${p.nama}.` });
      } else {
        setPopup({ type: "error", text: "Gagal mengirim reminder email." });
      }
    } catch (error) {
      console.error(error);
      setPopup({ type: "error", text: "Terjadi kesalahan sistem saat mengirim email." });
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
    } catch {
      setPopup({ type: "error", text: "Gagal menghapus data." });
    } finally {
      setLoadingAction(null);
    }
  };

  // --- EXPORT EXCEL ---
  const handleExportExcel = () => {
    if (sortedParticipants.length === 0)
      return setPopup({ type: "error", text: "Belum ada data untuk diexport." });
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
      "Nomor BIB": p.nomorBibLengkap || "Belum Lunas",
      Jersey: p.paket === "basic" ? "Tanpa Jersey" : p.ukuranJersey || "-",
      "Total Tagihan (Rp)": p.totalTagihan || 0,
      "Donasi Amal (Rp)": p.nominalDonasi || 0,
      "Status Bayar": p.statusPembayaran || "Pending",
      Alamat: p.paket === "basic" ? "Tanpa Pengiriman" : p.alamat || "-",
      Resi: p.resiPengiriman || "-",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    const tabSuffix =
      activeTab === "all"
        ? "Semua"
        : activeTab === "lunas"
        ? "Lunas"
        : activeTab === "belum_bayar"
        ? "Belum_Bayar"
        : "Batal";
    XLSX.utils.book_append_sheet(workbook, worksheet, `Data VR ${tabSuffix}`);
    XLSX.writeFile(
      workbook,
      `Data_Peserta_VR_${tabSuffix}_${new Date().getTime()}.xlsx`
    );
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

      {/* 🔥 MODAL KONFIRMASI STATUS PEMBAYARAN 🔥 */}
      {paymentModal.isOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <div className="text-center mb-6 mt-2">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 border-4 border-blue-100 shadow-inner">
                <CircleDollarSign className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                Konfirmasi Pembayaran
              </h3>
              <p className="text-sm text-slate-500 mt-2">
                Atur status pembayaran untuk:
              </p>
              <p className="text-base font-bold text-slate-900 bg-slate-50 py-2 px-4 rounded-xl inline-block mt-2 border border-slate-200">
                {paymentModal.participantName}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => executeStatusChange("Lunas")}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md transition-transform active:scale-95 text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Validasi Lunas (Generate BIB)
              </button>

              <button
                onClick={() => executeStatusChange("Batal")}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Tolak / Batalkan
              </button>

              {paymentModal.currentStatus !== "Pending" && (
                <button
                  onClick={() => executeStatusChange("Pending")}
                  className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 font-bold py-3 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Kembalikan ke Pending
                </button>
              )}
            </div>

            <button
              onClick={() =>
                setPaymentModal({ ...paymentModal, isOpen: false })
              }
              className="w-full text-center mt-5 text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
            >
              Batalkan
            </button>
          </div>
        </div>
      )}

      {/* 🔥 MODAL EDIT JARAK 🔥 */}
      {jarakModal.isOpen && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-slate-600" /> Edit Kategori Jarak
              </h3>
              <button
                onClick={() => setJarakModal({ isOpen: false, participantId: "", participantName: "", currentJarak: "" })}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Ubah kategori jarak untuk: <strong className="text-slate-800">{jarakModal.participantName}</strong>
            </p>
            <p className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4 flex items-start gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Perhatian: Mengubah jarak akan mempengaruhi nomor BIB yang sudah digenerate.</span>
            </p>
            <form onSubmit={handleEditJarak}>
              <input
                type="text"
                value={jarakModal.currentJarak}
                onChange={(e) => setJarakModal({ ...jarakModal, currentJarak: e.target.value })}
                placeholder="Contoh: 10KM, 5KM, 21KM"
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg mb-4 outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] text-sm bg-slate-50 font-bold uppercase"
                required
              />
              <button
                type="submit"
                disabled={loadingAction === "editJarak"}
                className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-50"
              >
                {loadingAction === "editJarak" ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
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

      {/* MODAL EDIT DATA PESERTA */}
      {editDataModal.isOpen && editDataModal.data && (
        <div
          className="fixed inset-0 z-[115] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setEditDataModal({ isOpen: false, data: null })}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-800 text-lg">
                Edit Data Peserta
              </h3>
              <button
                onClick={() => setEditDataModal({ isOpen: false, data: null })}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditData} className="overflow-y-auto custom-scrollbar pr-2 flex-grow space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Lengkap</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                    value={editDataModal.data.nama || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, nama: e.target.value}})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Email</label>
                  <input type="email" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                    value={editDataModal.data.email || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, email: e.target.value}})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">WhatsApp</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                    value={editDataModal.data.whatsapp || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, whatsapp: e.target.value}})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Ukuran Jersey</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                    value={editDataModal.data.ukuranJersey || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, ukuranJersey: e.target.value}})} />
                </div>
                {editDataModal.data.tipePeserta === "alumni" && (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Fakultas</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                        value={editDataModal.data.fakultas || ""} 
                        onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, fakultas: e.target.value}})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Angkatan</label>
                      <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                        value={editDataModal.data.angkatan || ""} 
                        onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, angkatan: e.target.value}})} />
                    </div>
                  </>
                )}
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Alamat Lengkap</label>
                  <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" rows={2}
                    value={editDataModal.data.alamat || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, alamat: e.target.value}})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Kecamatan</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                    value={editDataModal.data.kecamatan || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, kecamatan: e.target.value}})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Kota / Kabupaten</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                    value={editDataModal.data.kotaKabupaten || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, kotaKabupaten: e.target.value}})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Provinsi</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                    value={editDataModal.data.provinsi || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, provinsi: e.target.value}})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Kode Pos</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" 
                    value={editDataModal.data.kodePos || ""} 
                    onChange={e => setEditDataModal({...editDataModal, data: {...editDataModal.data, kodePos: e.target.value}})} />
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button type="button" onClick={() => setEditDataModal({ isOpen: false, data: null })} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-lg">Batal</button>
                <button type="submit" disabled={loadingAction === "editData"} className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center">
                  {loadingAction === "editData" ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL PESERTA */}
      {detailModal.isOpen && detailModal.data && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setDetailModal({ isOpen: false, data: null })}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
              <h3 className="font-black text-slate-800 text-lg">
                Detail Registrasi Peserta
              </h3>
              <button
                onClick={() => setDetailModal({ isOpen: false, data: null })}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar pr-2 flex-grow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Info Utama */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-200 pb-2">Informasi Pribadi</h4>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Nama Lengkap</p>
                    <p className="text-sm font-bold text-slate-800">{detailModal.data.nama || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Nama di BIB</p>
                    <p className="text-sm font-bold text-slate-800">{detailModal.data.namaBib || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Email</p>
                    <p className="text-sm font-medium text-slate-800">{detailModal.data.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">WhatsApp</p>
                    <p className="text-sm font-medium text-slate-800">{detailModal.data.whatsapp || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Tipe Peserta</p>
                    <p className="text-sm font-bold text-[#1A73E8]">
                      {detailModal.data.tipePeserta === "umum" ? "UMUM" : "ALUMNI"}
                      {detailModal.data.tipePeserta === "alumni" && ` (${detailModal.data.fakultas} - ${detailModal.data.angkatan})`}
                    </p>
                  </div>
                </div>

                {/* Info Lari & Pengiriman */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
                  <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 border-b border-blue-200 pb-2">Paket & Pengiriman</h4>
                  <div>
                    <p className="text-[10px] text-blue-500 font-medium">Paket</p>
                    <p className="text-sm font-bold text-blue-900">{detailModal.data.paket?.toUpperCase() || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500 font-medium">Jarak</p>
                    <p className="text-sm font-bold text-blue-900">{detailModal.data.jarak || "-"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500 font-medium">Ukuran Jersey</p>
                    <p className="text-sm font-bold text-blue-900">{detailModal.data.ukuranJersey || "Tanpa Jersey"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-blue-500 font-medium">Alamat Pengiriman</p>
                    <p className="text-xs font-medium text-blue-900">
                      {detailModal.data.alamat ? (
                        <>
                          {detailModal.data.alamat}<br/>
                          <span className="text-blue-700 mt-1 block">
                            Kec. {detailModal.data.kecamatan}, {detailModal.data.kotaKabupaten}, {detailModal.data.provinsi}
                          </span>
                        </>
                      ) : "Tanpa Pengiriman (Digital)"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tagihan & Pembayaran */}
              <div className="mt-4 bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Tagihan</h4>
                  <p className="text-2xl font-black text-emerald-700">Rp {Number(detailModal.data.totalTagihan || 0).toLocaleString('id-ID')}</p>
                  {detailModal.data.isDonasi && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-1">+ Donasi: Rp {Number(detailModal.data.nominalDonasi || 0).toLocaleString('id-ID')}</p>
                  )}
                </div>
                <div className="text-right">
                  <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Status Pembayaran</h4>
                  <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${
                    detailModal.data.statusPembayaran === "Lunas" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    detailModal.data.statusPembayaran === "Pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-rose-100 text-rose-700 border-rose-200"
                  }`}>
                    {detailModal.data.statusPembayaran || "Pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER HALAMAN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3 shrink-0">
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

      {/* 🔥 TABS FILTER STATUS PEMBAYARAN 🔥 */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-3 scrollbar-none shrink-0">
        <button
          onClick={() => handleTabChange("all")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
            activeTab === "all"
              ? "bg-slate-900 text-white border-slate-900 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Semua Peserta</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "all"
                ? "bg-slate-700 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {countSemua}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("lunas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
            activeTab === "lunas"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Lunas</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "lunas"
                ? "bg-emerald-700 text-white"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}
          >
            {countLunas}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("belum_bayar")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
            activeTab === "belum_bayar"
              ? "bg-amber-500 text-white border-amber-500 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-300" />
          <span>Belum Bayar (Pending)</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "belum_bayar"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {countBelumBayar}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("batal")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer ${
            activeTab === "batal"
              ? "bg-rose-600 text-white border-rose-600 shadow-sm"
              : "bg-white text-slate-600 border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-rose-300" />
          <span>Dibatalkan</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeTab === "batal"
                ? "bg-rose-700 text-white"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {countBatal}
          </span>
        </button>
      </div>

      {/* 🔥 TOOLBAR: SEARCH, SORTING, LIMIT, & EXPORT 🔥 */}
      <div className="bg-white border border-slate-200 rounded-t-xl p-3 flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-grow max-w-lg">
          {/* Search bar */}
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari nama, email, WA, BIB, paket, resi..."
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg outline-none focus:bg-white focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all text-slate-800 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <label className="text-[11px] font-bold text-slate-500 uppercase">
              Limit:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(
                  e.target.value === "All" ? "All" : Number(e.target.value),
                );
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-700 text-xs rounded-md px-2 py-1.5 outline-none focus:border-[#1A73E8]"
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
            </svg>{" "}
            Export Excel
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
                      selectedParticipants.length === paginatedData.length &&
                      paginatedData.length > 0
                    }
                    onChange={handleSelectAllVisible}
                    className="w-4 h-4 cursor-pointer accent-[#1A73E8]"
                  />
                </th>
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
                <th
                  className="px-4 py-3 border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none w-36"
                  onClick={() => handleSort("jarak")}
                >
                  <div className="flex items-center justify-between">
                    Paket Lari
                    {sortConfig.key === "jarak" && (
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
                  className="px-4 py-3 text-center border-r border-slate-200 cursor-pointer hover:bg-slate-200 transition-colors select-none w-32"
                  onClick={() => handleSort("statusPembayaran")}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status Bayar
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
                <th
                  className="px-4 py-3 cursor-pointer hover:bg-slate-200 transition-colors select-none w-48"
                  onClick={() => handleSort("nomorResi")}
                >
                  <div className="flex items-center justify-between">
                    Pengiriman (Resi)
                    {sortConfig.key === "nomorResi" && (
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
                    {searchQuery
                      ? `Tidak ditemukan peserta dengan kata kunci "${searchQuery}".`
                      : activeTab === "lunas"
                      ? "Belum ada data peserta dengan status Lunas."
                      : activeTab === "belum_bayar"
                      ? "Belum ada data peserta yang berstatus Belum Bayar (Pending)."
                      : activeTab === "batal"
                      ? "Belum ada data peserta dengan status Dibatalkan."
                      : "Belum ada data peserta terdaftar."}
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
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => setDetailModal({ isOpen: true, data: p })}
                          className="text-[10px] font-bold text-[#1A73E8] hover:text-[#1557B0] flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors border border-blue-100"
                        >
                          Lihat Detail &rarr;
                        </button>
                        <button
                          onClick={() => setEditDataModal({ isOpen: true, data: p })}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors border border-amber-100"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
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
                      <div className="flex flex-wrap items-center gap-1 mb-2">
                        <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded">
                          {p.jarak || "-"} • {p.paket?.toUpperCase() || "-"}
                        </span>
                        {/* 🔥 TOMBOL EDIT JARAK 🔥 */}
                        <button
                          onClick={() => setJarakModal({
                            isOpen: true,
                            participantId: p.id,
                            participantName: p.nama,
                            currentJarak: p.jarak || "",
                          })}
                          className="text-[9px] font-bold text-slate-400 hover:text-[#1A73E8] bg-slate-100 hover:bg-[#E8F0FE] border border-slate-200 hover:border-[#1A73E8] px-1.5 py-0.5 rounded transition-colors"
                          title="Edit Kategori Jarak"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        {/* 🔥 MENAMPILKAN NOMOR E-BIB JIKA SUDAH LUNAS 🔥 */}
                        {p.nomorBibLengkap && (
                          <span
                            className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded border border-blue-200"
                            title="Nomor Dada Pelari (e-BIB)"
                          >
                            BIB: {p.nomorBibLengkap}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-[10px] font-bold text-slate-600">
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
                      {/* 🔥 TOMBOL PENGGANTI DROPDOWN STATUS 🔥 */}
                      <button
                        onClick={() =>
                          setPaymentModal({
                            isOpen: true,
                            participantId: p.id,
                            participantName: p.nama,
                            currentStatus: p.statusPembayaran || "Pending",
                          })
                        }
                        disabled={loadingAction === p.id}
                        className={`text-[10px] font-bold uppercase rounded-md px-2 py-1.5 outline-none border cursor-pointer disabled:opacity-50 w-full shadow-sm transition-colors hover:brightness-95 ${
                          p.statusPembayaran === "Lunas"
                            ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20"
                            : p.statusPembayaran === "Pending"
                              ? "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20"
                              : "bg-[#FCE8E6] text-[#D93025] border-[#D93025]/20"
                        }`}
                      >
                        {loadingAction === p.id
                          ? "Memproses..."
                          : p.statusPembayaran || "Pending"}{" "}
                        ▾
                      </button>

                      {p.buktiBayarUrl && (
                        <button
                          onClick={() =>
                            setProofModal({
                              isOpen: true,
                              imgUrl: p.buktiBayarUrl,
                            })
                          }
                          className="mt-2 text-[9px] font-bold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-2 py-1 rounded w-full transition-colors border border-blue-100 flex items-center justify-center gap-1"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>{" "}
                          Cek Struk
                        </button>
                      )}

                      {p.statusPembayaran !== "Lunas" && (
                        <button
                          onClick={() => handleSendReminder(p)}
                          disabled={loadingAction === `reminder-${p.id}`}
                          className="mt-2 text-[9px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 px-2 py-1.5 rounded w-full transition-colors border border-slate-200 flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <Bell className="w-3 h-3" />
                          {loadingAction === `reminder-${p.id}` ? "Mengirim..." : "Kirim Reminder"}
                        </button>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {p.paket === "basic" ? (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded border border-slate-100 flex items-center justify-center">
                          Digital Only
                        </span>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {/* Alamat */}
                          {p.alamat && (
                            <div
                              className="text-[10px] text-slate-600 leading-tight max-w-[200px] line-clamp-2"
                              title={p.alamat}
                            >
                              <span className="font-bold text-slate-800 block mb-0.5">Alamat:</span>
                              {p.alamat}
                            </div>
                          )}
                          {/* Resi + Tombol Edit */}
                          <div className="flex items-center gap-2">
                            <div className="flex-grow">
                              {p.resiPengiriman ? (
                                <div className="bg-green-50 px-2 py-1.5 rounded border border-green-200">
                                  <p className="text-[9px] text-green-700 font-bold uppercase mb-0.5 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Resi:
                                  </p>
                                  <p
                                    className="text-[10px] font-mono font-bold text-slate-800 uppercase truncate"
                                    title={p.resiPengiriman}
                                  >
                                    {p.resiPengiriman}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-[9px] text-[#D93025] font-bold uppercase bg-[#FCE8E6] px-2 py-1.5 rounded border border-[#D93025]/20 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Belum Ada Resi
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
                              title={p.resiPengiriman ? "Edit Resi" : "Input Resi"}
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                              </svg>
                            </button>
                          </div>
                          {/* Jika tidak ada paket & tidak ada alamat, tampilkan placeholder */}
                          {!p.alamat && !p.resiPengiriman && (
                            <span className="text-[9px] text-slate-400 italic">Data pengiriman belum lengkap</span>
                          )}
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
