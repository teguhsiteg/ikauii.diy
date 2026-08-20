"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  runTransaction,
  query,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";
import { sendEmailAction } from "@/app/actions/email";


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
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // --- 🔥 STATE TOAST NOTIFICATION (BUKTI BARU) 🔥 ---
  const [showToast, setShowToast] = useState(false);
  const previousPendingCount = useRef<number>(0);

  // --- 🔥 STATE CUSTOM MODALS (MENGGANTIKAN ALERT BAWAAN BROWSER) 🔥 ---
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success", // "success" | "error" | "warning"
    title: "",
    message: "",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const [approveProcess, setApproveProcess] = useState<{
    isOpen: boolean;
    participant: any;
    step: "confirm" | "processing" | "success" | "error";
    message: string;
  }>({ isOpen: false, participant: null, step: "confirm", message: "" });

  // --- STATE PAGINATION, SORTING & LIMIT ---
  const [sortConfig] = useState<{
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

  // --- MENGAMBIL DATA & MEMANTAU BUKTI BARU ---
  useEffect(() => {
    const q = query(collection(db, "offline_participants"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setParticipants(data);
      setIsLoading(false);

      // Logika Pemantau Bukti Baru (Pending)
      const currentPendingCount = data.filter(
        (p: any) => p.statusPembayaran === "Pending",
      ).length;

      // Jika jumlah pending bertambah (ada upload baru) dan ini bukan render pertama
      if (
        currentPendingCount > previousPendingCount.current &&
        previousPendingCount.current !== 0
      ) {
        setShowToast(true);
        // Toast hilang otomatis setelah 5 detik
        setTimeout(() => setShowToast(false), 5000);
      }

      // Update nilai referensi
      previousPendingCount.current = currentPendingCount;
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
      p.namaBib?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kodePromoDipakai?.toLowerCase().includes(searchQuery.toLowerCase());

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
    const excelData = sortedData.map((p) => {
      return {
        "Waktu Daftar": p.waktuDaftar
          ? new Date(p.waktuDaftar).toLocaleString("id-ID")
          : "-",
        "Status Pembayaran": p.statusPembayaran || "Belum Bayar",
        "Waktu Lunas": p.waktuLunas
          ? new Date(p.waktuLunas).toLocaleString("id-ID")
          : "-",
        "Nomor BIB": p.nomorBIB || "-",
        "Kategori Jarak": p.jarak || "-",
        "Paket Dipilih": p.paketNama || "-",
        "Nama di BIB": p.namaBib || "-",
        "Nama Lengkap": p.namaLengkap || "-",
        "Kategori Peserta": p.kategoriPeserta || "-",
        "Jenis Identitas": p.jenisIdentitas || "KTP",
        "Nomor Identitas (NIK/NIS)": p.nik || "-",
        "Jenis Kelamin": p.jenisKelamin || "-",
        "Tanggal Lahir": p.tanggalLahir || "-",
        "No. WhatsApp": p.noWA || "-",
        Email: p.email || "-",
        Komunitas: p.komunitas || "-",
        "Ukuran Jersey": p.ukuranJersey || "-",
        "Golongan Darah": p.golonganDarah || "-",
        "Riwayat Penyakit": p.riwayatPenyakit || "-",
        "Nama Kontak Darurat": p.namaDarurat || "-",
        "Hubungan Darurat": p.hubunganDarurat || "-",
        "No WA Darurat": p.waDarurat || "-",
        "Harga Asli": p.hargaAsli || p.totalTagihan || 0,
        "Kode Promo Dipakai": p.kodePromoDipakai || "-",
        "Total Diskon": p.totalDiskon || 0,
        "Total Tagihan (Nett)": p.totalTagihan || 0,
        "Logistik (Racepack)": p.isRacepackTaken ? "SUDAH DIAMBIL" : "BELUM",
        "Diserahkan Oleh Admin": p.adminHandler || "-",
        "Waktu Ambil Racepack": p.waktuAmbilRacepack
          ? new Date(p.waktuAmbilRacepack).toLocaleString("id-ID")
          : "-",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data_Offline_Full");
    XLSX.writeFile(workbook, `REKAP_FULL_OFFLINE_${new Date().getTime()}.xlsx`);
  };

  // --- 🔥 FITUR BROADCAST REMINDER RACEPACK (INDIVIDU) 🔥 ---
  const handleBroadcastReminderClick = () => {
    const targetParticipants = participants.filter(
      (p) => p.statusPembayaran === "Lunas" && !p.isRacepackTaken,
    );

    if (targetParticipants.length === 0) {
      setAlertModal({
        isOpen: true,
        type: "warning",
        title: "Target Kosong",
        message:
          "Tidak ada Peserta Individu yang memenuhi syarat (Lunas & Belum Ambil Racepack).",
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Broadcast",
      message: `Anda akan mengirim Email Reminder Pengambilan Racepack kepada ${targetParticipants.length} Peserta Individu. Lanjutkan?`,
      onConfirm: () => executeBroadcastReminder(targetParticipants),
    });
  };

  const executeBroadcastReminder = async (targetParticipants: any[]) => {
    setIsBroadcasting(true);
    let successCount = 0;
    let failCount = 0;

    for (const p of targetParticipants) {
      try {
        const res = await sendEmailAction({
            type: "reminder_racepack_individu",
            email: p.email,
            nama: p.namaLengkap,
            detail: {
              id: p.id,
              nik: p.nik || "-",
              jarak: p.jarak || "-",
              ukuranJersey: p.ukuranJersey || "-",
              namaBib: p.namaBib || "-",
              bib: p.nomorBIB || p.bib || "-",
            },
          });

        if (res.success) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    setIsBroadcasting(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Broadcast Selesai",
      message: `Berhasil terkirim: ${successCount} Peserta\nGagal terkirim: ${failCount} Peserta\n\nPastikan koneksi internet stabil jika ada pengiriman yang gagal.`,
    });
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

    setApproveProcess((prev) => ({
      ...prev,
      step: "processing",
      message: "Mengupdate database & mengirim E-Ticket...",
    }));

    try {
      let finalBib = p.nomorBIB || "";

      if (!finalBib) {
        setApproveProcess((prev) => ({
          ...prev,
          message: "Men-generate Nomor BIB...",
        }));

        await runTransaction(db, async (transaction) => {
          const counterDocRef = doc(db, "settings", "bib_counter");
          const participantRef = doc(db, "offline_participants", p.id);

          let promoRef = null;
          if (p.idPromoDipakai) {
            promoRef = doc(db, "promo_codes", p.idPromoDipakai);
          }

          const counterDoc = await transaction.get(counterDocRef);
          let promoDoc = null;
          if (promoRef) promoDoc = await transaction.get(promoRef);

          let current5K = counterDoc.exists()
            ? counterDoc.data().lastBib5K || 0
            : 0;
          let current10K = counterDoc.exists()
            ? counterDoc.data().lastBib10K || 0
            : 0;

          const jarakAngka = (p.jarak || "9").replace(/\D/g, "") || "9";
          let newCounter = 0;

          if (jarakAngka === "5") {
            current5K++;
            newCounter = current5K;
            finalBib = `5${String(newCounter).padStart(3, "0")}`;
          } else if (jarakAngka === "10") {
            current10K++;
            newCounter = current10K;
            finalBib = `10${String(newCounter).padStart(3, "0")}`;
          } else {
            newCounter = Math.floor(1000 + Math.random() * 8000);
            finalBib = `${jarakAngka}${newCounter}`;
          }

          transaction.set(
            counterDocRef,
            { lastBib5K: current5K, lastBib10K: current10K },
            { merge: true },
          );
          transaction.update(participantRef, {
            statusPembayaran: "Lunas",
            waktuLunas: new Date().toISOString(),
            nomorBIB: finalBib,
          });

          if (promoRef && promoDoc && promoDoc.exists()) {
            const kuotaTerpakaiSekarang = promoDoc.data().kuotaTerpakai || 0;
            transaction.update(promoRef, {
              kuotaTerpakai: kuotaTerpakaiSekarang + 1,
            });
          }
        });
      } else {
        await updateDoc(doc(db, "offline_participants", p.id), {
          statusPembayaran: "Lunas",
          waktuLunas: new Date().toISOString(),
        });
      }

      const res = await sendEmailAction({
          type: "payment_success_offline",
          email: p.email,
          nama: p.namaLengkap,
          detail: {
            id: p.id,
            nik: p.nik || "-",
            jarak: p.jarak || "-",
            ukuranJersey: p.ukuranJersey || "-",
            namaBib: p.namaBib || "-",
            bib: finalBib || "-",
          },
        });

      if (!res.success)
        throw new Error("Gagal mengirim email E-Ticket dari server.");

      await addDoc(collection(db, "vr_logs"), {
        type: "bayar",
        action: `menyetujui pembayaran offline (BIB: ${finalBib}) untuk`,
        targetName: p.namaLengkap,
        adminEmail: adminUser?.email || "Admin",
        timestamp: Date.now(),
      });

      if (detailParticipant?.id === p.id) {
        setDetailParticipant((prev: any) => ({
          ...prev,
          statusPembayaran: "Lunas",
          nomorBIB: finalBib,
        }));
      }

      setApproveProcess((prev) => ({
        ...prev,
        step: "success",
        message: `Berhasil! Pembayaran lunas, BIB tercetak (${finalBib}), dan Email E-Ticket telah terkirim.`,
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
  const handleHandoverClick = (id: string, participantName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Penyerahan Racepack",
      message: `Konfirmasi penyerahan atribut (Racepack & Jersey) untuk ${participantName}?`,
      onConfirm: () => executeHandover(id, participantName),
    });
  };

  const executeHandover = async (id: string, participantName: string) => {
    const adminEmail = auth.currentUser?.email || "Admin Lapangan";
    setActionLoading(id);
    try {
      const dataUpdate = {
        isRacepackTaken: true,
        waktuAmbilRacepack: new Date().toISOString(),
        adminHandler: adminEmail,
      };

      await updateDoc(doc(db, "offline_participants", id), dataUpdate);
      if (detailParticipant?.id === id) {
        setDetailParticipant({ ...detailParticipant, ...dataUpdate });
      }

      await addDoc(collection(db, "vr_logs"), {
        type: "resi",
        action: "menyerahkan racepack offline untuk",
        targetName: participantName,
        adminEmail: adminEmail,
        timestamp: Date.now(),
      });

      setAlertModal({
        isOpen: true,
        type: "success",
        title: "Racepack Diserahkan",
        message: `Berhasil mencatat penyerahan racepack untuk ${participantName}.`,
      });
    } catch {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Gagal memproses penyerahan racepack.",
      });
    }
    setActionLoading(null);
  };

  // --- AKSI BULK DELETE ---
  const handleBulkDeleteClick = () => {
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Hapus",
      message: `Hapus ${selectedIds.length} data pendaftar ini secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        const batch = writeBatch(db);
        selectedIds.forEach((id) =>
          batch.delete(doc(db, "offline_participants", id)),
        );
        await batch.commit();
        setSelectedIds([]);
        setAlertModal({
          isOpen: true,
          type: "success",
          title: "Berhasil",
          message: "Data peserta berhasil dihapus.",
        });
      },
    });
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
      {/* --- 🔥 TOAST NOTIFICATION (DI POJOK KANAN ATAS) 🔥 --- */}
      {showToast && (
        <div
          className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-right slide-in-from-top duration-300 fade-in cursor-pointer"
          onClick={() => setShowToast(false)}
        >
          <div className="bg-rose-500 text-white px-6 py-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(225,29,72,0.5)] border border-rose-400 flex items-center gap-4 hover:scale-105 transition-transform">
            <div className="bg-white/20 p-2 rounded-full animate-pulse">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <p className="font-black text-base drop-shadow-sm uppercase tracking-wider">
                Bukti Bayar Baru!
              </p>
              <p className="text-xs text-rose-100 font-medium">
                Ada peserta yang baru saja upload struk.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* --- 🔥 KUMPULAN MODAL (MENGGANTIKAN ALERT BAWAAN) 🔥 --- */}

      {/* 1. Modal Alert (Success/Error/Warning) */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div
              className={`p-8 text-center ${alertModal.type === "error" ? "bg-rose-50" : alertModal.type === "success" ? "bg-emerald-50" : "bg-amber-50"}`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 text-3xl shadow-sm ${alertModal.type === "error" ? "bg-rose-100 text-rose-600" : alertModal.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}
              >
                {alertModal.type === "error" ? (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : alertModal.type === "success" ? (
                  <svg
                    className="w-8 h-8"
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
                ) : (
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                {alertModal.title}
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">
                {alertModal.message}
              </p>
              <button
                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal Confirm (Yes/No) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center bg-blue-50">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 bg-blue-100 text-blue-600 shadow-sm">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">
                {confirmModal.title}
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-600 leading-relaxed mb-6 whitespace-pre-wrap">
                {confirmModal.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmModal({ ...confirmModal, isOpen: false })
                  }
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    setConfirmModal({ ...confirmModal, isOpen: false });
                    confirmModal.onConfirm();
                  }}
                  className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3 rounded-xl transition-colors shadow-md"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal Approve Progress (Untuk Generate BIB & Email) */}
      {approveProcess.isOpen && approveProcess.participant && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
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
                    Verifikasi Pembayaran Manual
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    Anda akan menyetujui status LUNAS untuk{" "}
                    <strong>{approveProcess.participant.namaLengkap}</strong>.
                    <br />
                    Sistem akan otomatis me-generate <b>Nomor BIB baru</b> dan
                    mengirimkan email E-Ticket.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={closeApproveProcess}
                      className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors w-full"
                    >
                      Batal
                    </button>
                    <button
                      onClick={executeApproveProcess}
                      className="px-5 py-2.5 text-sm font-bold bg-[#1A73E8] text-white rounded-lg hover:bg-[#1557B0] transition-colors shadow-sm w-full"
                    >
                      Terima & Kirim
                    </button>
                  </div>
                </div>
              )}

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

              {approveProcess.step === "success" && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-[#E6F4EA] text-[#1E8E3E] rounded-full flex items-center justify-center mx-auto mb-4">
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
                    Selesai!
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    {approveProcess.message}
                  </p>
                  <button
                    onClick={closeApproveProcess}
                    className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 py-3 rounded-xl font-bold transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              )}

              {approveProcess.step === "error" && (
                <div className="text-center py-4">
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
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Gagal
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    {approveProcess.message}
                  </p>
                  <button
                    onClick={closeApproveProcess}
                    className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 py-3 rounded-xl font-bold transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- BAGIAN ATAS: TITLE & EXPORT --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 shrink-0 px-1">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Pendaftar Offline Run
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Verifikasi pembayaran dan manajemen logistik racepack
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDeleteClick}
              className="bg-[#FCE8E6] text-[#D93025] hover:bg-red-100 px-4 py-2 rounded-xl text-sm font-bold border border-red-200 transition-colors w-full md:w-auto shadow-sm"
            >
              Hapus ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleBroadcastReminderClick}
            disabled={isBroadcasting}
            className="px-4 py-2 bg-[#FCD116] text-[#0B2239] rounded-xl text-sm font-bold hover:bg-yellow-500 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isBroadcasting ? (
              <div className="w-4 h-4 border-2 border-[#0B2239] border-t-transparent rounded-full animate-spin"></div>
            ) : (
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
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            )}
            {isBroadcasting ? "Mengirim..." : "Kirim Reminder (RPC)"}
          </button>
          <button
            onClick={handleExportExcel}
            className="bg-[#0B2239] text-[#FCD116] px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors w-full md:w-auto"
          >
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* --- STATISTIK --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 shrink-0">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Total Peserta
          </p>
          <p className="text-2xl font-black text-slate-800">
            {participants.length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Lunas (Verified)
          </p>
          <p className="text-2xl font-black text-[#1E8E3E]">{totalLunas}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Pending / Tunggu
          </p>
          <p className="text-2xl font-black text-[#F9AB00]">{totalPending}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Dana Masuk
          </p>
          <p className="text-lg md:text-xl font-black text-[#1A73E8] truncate">
            Rp {totalUangLunas.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      {/* --- TOOLBAR: SEARCH & FILTER --- */}
      <div className="bg-white p-4 rounded-t-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 justify-between items-center shrink-0">
        <div className="relative w-full md:w-96">
          <svg
            className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
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
          <input
            type="text"
            placeholder="Cari nama, NIK, Kode Promo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8] w-full"
          />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1A73E8] w-full md:w-auto"
          >
            <option value="Semua">Semua Status</option>
            <option value="Lunas">Lunas</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={itemsPerPage}
            onChange={(e) =>
              setItemsPerPage(
                e.target.value === "All" ? "All" : Number(e.target.value),
              )
            }
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#1A73E8] w-full md:w-auto hidden md:block"
          >
            <option value={10}>10 Baris</option>
            <option value={50}>50 Baris</option>
            <option value={100}>100 Baris</option>
            <option value="All">Semua</option>
          </select>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white border-x border-slate-100 flex-grow overflow-auto relative">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 border-b border-slate-200 w-10">
                <input
                  type="checkbox"
                  checked={
                    selectedIds.length === paginatedData.length &&
                    paginatedData.length > 0
                  }
                  onChange={toggleSelectAllVisible}
                  className="rounded text-[#1A73E8] focus:ring-[#1A73E8] w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-4 border-b border-slate-200 font-bold">BIB</th>
              <th className="p-4 border-b border-slate-200 font-bold">
                Nama Pendaftar
              </th>
              <th className="p-4 border-b border-slate-200 font-bold">
                Kategori & Size
              </th>
              <th className="p-4 border-b border-slate-200 font-bold">
                Tagihan
              </th>
              <th className="p-4 border-b border-slate-200 font-bold">
                Status
              </th>
              <th className="p-4 border-b border-slate-200 font-bold text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Tidak ada data yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((p) => (
                <tr
                  key={p.id}
                  className={`hover:bg-blue-50/50 transition-colors ${p.statusPembayaran === "Pending" ? "bg-amber-50/30" : ""}`}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className="rounded text-[#1A73E8] focus:ring-[#1A73E8] w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-4">
                    <span className="font-mono font-black text-[#1A73E8] bg-blue-50 px-2 py-1 rounded">
                      {p.nomorBIB || "-"}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{p.namaLengkap}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{p.noWA}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-700">{p.jarak}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Jersey:{" "}
                      <span className="font-bold">{p.ukuranJersey}</span>
                    </p>
                  </td>
                  <td className="p-4 font-bold text-slate-800">
                    Rp {p.totalTagihan?.toLocaleString("id-ID")}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${p.statusPembayaran === "Lunas" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20" : "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20"}`}
                    >
                      {p.statusPembayaran}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setDetailParticipant(p)}
                      className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
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

      {/* --- PAGINATION BAWAH --- */}
      <div className="bg-white p-4 rounded-b-2xl shadow-sm border border-slate-100 flex justify-between items-center shrink-0">
        <p className="text-sm text-slate-500 hidden md:block">
          Menampilkan baris{" "}
          <span className="font-bold text-slate-800">
            {(currentPage - 1) *
              (itemsPerPage === "All" ? sortedData.length : itemsPerPage) +
              1}
          </span>{" "}
          -{" "}
          <span className="font-bold text-slate-800">
            {Math.min(
              currentPage *
                (itemsPerPage === "All" ? sortedData.length : itemsPerPage),
              sortedData.length,
            )}
          </span>{" "}
          dari{" "}
          <span className="font-bold text-slate-800">{sortedData.length}</span>{" "}
          data
        </p>
        <div className="flex gap-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      </div>

      {/* --- 🔥 MODAL DETAIL PESERTA 🔥 --- */}
      {detailParticipant && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {detailParticipant.namaLengkap}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  ID: {detailParticipant.id}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={`px-3 py-1 text-[10px] uppercase tracking-wider font-black rounded-full border ${detailParticipant.statusPembayaran === "Lunas" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20" : "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20"}`}
                >
                  {detailParticipant.statusPembayaran}
                </span>
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 bg-white flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                    Informasi Tiket
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Nomor BIB
                      </p>
                      <p className="text-xl font-black font-mono text-[#1A73E8]">
                        {detailParticipant.nomorBIB || "Menunggu"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Kategori Jarak
                      </p>
                      <p className="text-base font-bold text-slate-800">
                        {detailParticipant.jarak}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Nama di BIB
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {detailParticipant.namaBib || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Ukuran Jersey
                      </p>
                      <p className="text-sm font-black text-slate-800">
                        {detailParticipant.ukuranJersey || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                    Data Pribadi
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        No Identitas (NIK)
                      </p>
                      <p className="font-medium text-slate-800">
                        {detailParticipant.nik || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Gender / Darah
                      </p>
                      <p className="font-medium text-slate-800">
                        {detailParticipant.jenisKelamin || "-"} /{" "}
                        {detailParticipant.golonganDarah || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        WhatsApp
                      </p>
                      <p className="font-medium text-slate-800">
                        {detailParticipant.noWA || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Email
                      </p>
                      <p className="font-medium text-slate-800 truncate">
                        {detailParticipant.email || "-"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Riwayat Penyakit
                      </p>
                      <p className="font-medium text-rose-600">
                        {detailParticipant.riwayatPenyakit || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {detailParticipant.isRacepackTaken && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-xs font-black uppercase tracking-wider">
                        Racepack Diserahkan
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">Waktu:</span>
                        <br />
                        <span className="font-bold text-emerald-800">
                          {new Date(
                            detailParticipant.waktuAmbilRacepack,
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Admin:</span>
                        <br />
                        <span className="font-bold text-emerald-800">
                          {detailParticipant.adminHandler || "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="md:w-72 shrink-0 flex flex-col">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                  Bukti Transfer
                </h3>
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex-grow flex items-center justify-center p-2 relative overflow-hidden group min-h-[200px]">
                  {detailParticipant.buktiBayarUrl ? (
                    <>
                      <img
                        src={detailParticipant.buktiBayarUrl}
                        alt="Bukti Transfer"
                        className="w-full h-full object-cover rounded-xl cursor-zoom-in"
                        onClick={() =>
                          setSelectedImage(detailParticipant.buktiBayarUrl)
                        }
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                        <span className="text-white text-xs font-bold px-3 py-1 bg-black/50 rounded-full">
                          Perbesar Gambar
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <svg
                        className="w-10 h-10 text-slate-300 mx-auto mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        Belum Upload
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-4 bg-blue-50 text-[#1A73E8] p-4 rounded-2xl flex flex-col justify-center min-h-[100px]">
                  {detailParticipant.kodePromoDipakai && (
                    <div className="mb-3 text-left text-xs space-y-1.5 border-b border-blue-200/50 pb-3">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Harga Asli:</span>
                        <span>
                          Rp{" "}
                          {detailParticipant.hargaAsli?.toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                        <span>
                          Promo ({detailParticipant.kodePromoDipakai}):
                        </span>
                        <span>
                          - Rp{" "}
                          {detailParticipant.totalDiskon?.toLocaleString(
                            "id-ID",
                          )}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70">
                      Total Dibayar{" "}
                      {detailParticipant.kodePromoDipakai ? "(Nett)" : ""}
                    </p>
                    <p className="text-2xl font-black">
                      Rp{" "}
                      {detailParticipant.totalTagihan?.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-end gap-3 shrink-0">
              {detailParticipant.statusPembayaran === "Pending" && (
                <button
                  onClick={() => {
                    triggerApprove(detailParticipant);
                    setDetailParticipant(null);
                  }}
                  className="bg-[#1A73E8] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-[#1557B0] transition-colors order-1 md:order-2 flex items-center justify-center gap-2"
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Terima & Generate BIB
                </button>
              )}

              {detailParticipant.statusPembayaran === "Lunas" &&
                !detailParticipant.isRacepackTaken && (
                  <button
                    onClick={() =>
                      handleHandoverClick(
                        detailParticipant.id,
                        detailParticipant.namaLengkap,
                      )
                    }
                    disabled={actionLoading === detailParticipant.id}
                    className="bg-[#1E8E3E] text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-[#188038] transition-colors order-1 md:order-2 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === detailParticipant.id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    Serahkan Racepack
                  </button>
                )}

              <button
                onClick={() => setDetailParticipant(null)}
                className="bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-slate-200 transition-colors order-2 md:order-1 w-full md:w-auto"
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
          className="fixed inset-0 z-[400] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Struk Zoom"
            className="max-w-full max-h-[95vh] object-contain rounded"
          />
          <div className="absolute top-4 right-4 text-white/50 text-sm font-bold bg-black/50 px-3 py-1 rounded-full">
            Klik dimana saja untuk tutup
          </div>
        </div>
      )}
    </div>
  );
}
