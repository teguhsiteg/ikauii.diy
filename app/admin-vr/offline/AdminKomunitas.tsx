"use client";

import { useEffect, useState } from "react";
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
import {
  Users2,
  Users,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Search,
  FileSpreadsheet,
  Trash2,
  Eye,
  RotateCcw,
  Check,
  X,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";

export default function AdminKomunitasPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUser, setAdminUser] = useState<any>(null);

  // UI State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailGroup, setDetailGroup] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // --- 🔥 STATE CUSTOM MODALS (MENGGANTIKAN ALERT BAWAAN BROWSER) 🔥 ---
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: "success",
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

  // Modal Khusus Handover Komunitas
  const [handoverModal, setHandoverModal] = useState({
    isOpen: false,
    id: "",
    groupName: "",
    kaptenName: "",
    namaPengambil: "",
    metodeVerifikasi: "KTP",
  });

  const [approveProcess, setApproveProcess] = useState<{
    isOpen: boolean;
    group: any;
    step: "confirm" | "processing" | "success" | "error";
    message: string;
  }>({ isOpen: false, group: null, step: "confirm", message: "" });

  // --- STATE PAGINATION, SORTING & LIMIT ---
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "createdAt", direction: "desc" });
  const [itemsPerPage, setItemsPerPage] = useState<number | "All">(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "pendaftaran_komunitas"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setGroups(data);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getJerseySummary = (participants: any[]) => {
    if (!participants) return {};
    return participants.reduce((acc: any, p: any) => {
      const size = p.ukuranJersey || "Tanpa Ukuran";
      acc[size] = (acc[size] || 0) + 1;
      return acc;
    }, {});
  };

  // --- LOGIKA FILTER, SEARCH, SORTING & PAGINATION ---
  const filteredData = groups.filter((g) => {
    const matchStatus =
      filterStatus === "Semua" || g.statusPembayaran === filterStatus;
    const matchSearch =
      g.kapten?.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.kapten?.komunitas?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.kapten?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.kapten?.wa?.includes(searchQuery) ||
      g.id?.includes(searchQuery);

    return matchStatus && matchSearch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (sortConfig.key === "komunitas") {
      valA = a.kapten?.komunitas || "";
      valB = b.kapten?.komunitas || "";
    } else if (sortConfig.key === "namaKapten") {
      valA = a.kapten?.nama || "";
      valB = b.kapten?.nama || "";
    } else if (sortConfig.key === "peserta") {
      valA = (a.peserta || []).length;
      valB = (b.peserta || []).length;
      return sortConfig.direction === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    } else if (sortConfig.key === "totalBiaya") {
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortConfig.direction === "asc" ? numA - numB : numB - numA;
    } else if (sortConfig.key === "createdAt") {
      const timeA = new Date(valA || 0).getTime() || 0;
      const timeB = new Date(valB || 0).getTime() || 0;
      return sortConfig.direction === "asc" ? timeA - timeB : timeB - timeA;
    }

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
  const totalLunas = groups.filter(
    (g) => g.statusPembayaran === "Lunas",
  ).length;
  const totalUangLunas = groups
    .filter((g) => g.statusPembayaran === "Lunas")
    .reduce((acc, curr) => acc + (Number(curr.totalBiaya) || 0), 0);
  const totalPesertaGrup = groups.reduce(
    (acc, curr) => acc + (curr.participants?.length || 0),
    0,
  );

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
      setSelectedIds(paginatedData.map((g) => g.id));
    }
  };

  // --- FITUR EKSPOR EXCEL ---
  const handleExportExcel = () => {
    const excelData: any[] = [];

    sortedData.forEach((g) => {
      let dateDaftar = "-";
      if (g.createdAt) {
        if (g.createdAt.seconds)
          dateDaftar = new Date(g.createdAt.seconds * 1000).toLocaleString(
            "id-ID",
          );
        else dateDaftar = new Date(g.createdAt).toLocaleString("id-ID");
      }

      if (g.participants && g.participants.length > 0) {
        g.participants.forEach((p: any) => {
          excelData.push({
            "ID Grup / Verifikasi": g.id,
            "Nama Komunitas": g.kapten?.komunitas || "-",
            "Nama Kapten (PJ)": g.kapten?.nama || "-",
            "Waktu Daftar": dateDaftar,
            "Status Pembayaran": g.statusPembayaran || "Belum Bayar",
            "Waktu Lunas": g.waktuLunas
              ? new Date(g.waktuLunas).toLocaleString("id-ID")
              : "-",
            "Nama Peserta": p.namaLengkap || "-",
            NIK: p.nik || "-",
            Kategori: p.kategori || "-",
            "Nomor BIB": p.nomorBIB || p.bib || "-",
            "Jenis Kelamin": p.gender || "-",
            "Golongan Darah": p.golDarah || "-",
            "Ukuran Jersey": p.ukuranJersey || "-",
            "No Darurat": p.waDarurat || "-",
            "Nama Darurat": p.kontakDarurat || "-",
            "Riwayat Penyakit": p.riwayatPenyakit || "-",
            "Donasi / Charity (Rp)": g.charity || g.donasi || 0,
            "Total Biaya Grup": g.totalBiaya || 0,
            "Status Racepack": g.isRacepackTaken ? "SUDAH DIAMBIL" : "BELUM",
            "Diserahkan Kepada": g.namaPengambilAtribut || "-",
            "Verifikasi RPC": g.metodeVerifikasiRPC || "-",
            "Admin Lapangan": g.adminHandler || "-",
          });
        });
      } else {
        excelData.push({
          "ID Grup / Verifikasi": g.id,
          "Nama Komunitas": g.kapten?.komunitas || "-",
          "Nama Kapten (PJ)": g.kapten?.nama || "-",
          "Waktu Daftar": dateDaftar,
          "Status Pembayaran": g.statusPembayaran || "Belum Bayar",
          "Waktu Lunas": g.waktuLunas
            ? new Date(g.waktuLunas).toLocaleString("id-ID")
            : "-",
          "Nama Peserta": "KOSONG",
          "Donasi / Charity (Rp)": g.charity || g.donasi || 0,
          "Total Biaya Grup": g.totalBiaya || 0,
          "Status Racepack": g.isRacepackTaken ? "SUDAH DIAMBIL" : "BELUM",
        });
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Detail_Peserta_Komunitas",
    );
    XLSX.writeFile(
      workbook,
      `REKAP_FULL_KOMUNITAS_${new Date().getTime()}.xlsx`,
    );
  };

  // --- 🔥 FITUR BROADCAST REMINDER RACEPACK (KOMUNITAS) 🔥 ---
  const handleBroadcastReminderClick = () => {
    const targetGroups = groups.filter(
      (g) => g.statusPembayaran === "Lunas" && !g.isRacepackTaken,
    );

    if (targetGroups.length === 0) {
      setAlertModal({
        isOpen: true,
        type: "warning",
        title: "Target Kosong",
        message:
          "Tidak ada Grup/Komunitas yang memenuhi syarat (Lunas & Belum Ambil Racepack).",
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Broadcast",
      message: `Anda akan mengirim Email Reminder Pengambilan Racepack Kolektif kepada Kapten dari ${targetGroups.length} Grup/Komunitas. Lanjutkan?`,
      onConfirm: () => executeBroadcastReminder(targetGroups),
    });
  };

  const executeBroadcastReminder = async (targetGroups: any[]) => {
    setIsBroadcasting(true);
    let successCount = 0;
    let failCount = 0;

    for (const group of targetGroups) {
      try {
        const res = await sendEmailAction({
            type: "reminder_racepack_komunitas",
            email: group.kapten?.email,
            nama: group.kapten?.nama,
            detail: {
              id: group.id,
              komunitas: group.kapten?.komunitas || "-",
              totalPeserta: group.participants?.length || 0,
              totalBiaya: group.totalBiaya || 0,
              participants: group.participants || [],
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
      message: `Berhasil terkirim: ${successCount} Kapten Tim\nGagal terkirim: ${failCount} Kapten Tim\n\nPastikan koneksi internet stabil jika ada pengiriman yang gagal.`,
    });
  };

  // --- 🔥 AKSI PEMBAYARAN & GENERATE BIB KOMUNITAS DENGAN GLOBAL COUNTER 🔥 ---
  const triggerApprove = (g: any) => {
    setApproveProcess({
      isOpen: true,
      group: g,
      step: "confirm",
      message: "",
    });
  };

  const executeApproveProcess = async () => {
    const g = approveProcess.group;
    if (!g) return;

    setApproveProcess((prev) => ({
      ...prev,
      step: "processing",
      message: "Menerbitkan Nomor BIB Komunitas...",
    }));

    try {
      let finalParticipants: any[] = [];

      await runTransaction(db, async (transaction) => {
        const counterDocRef = doc(db, "pengaturan", "counter_bib_offline");
        const groupRef = doc(db, "pendaftaran_komunitas", g.id);

        const counterDoc = await transaction.get(counterDocRef);
        const cData = counterDoc.exists() ? counterDoc.data() : {};
        let updatedCategoryCounters: Record<string, number> = {};

        finalParticipants = (g.participants || []).map((member: any) => {
          if (member.nomorBIB || member.bib) return member;

          const jarakAngka = (member.kategori || member.jarak || "5").replace(/\D/g, "") || "5";
          const counterField = `lastBib${jarakAngka}K`;

          if (updatedCategoryCounters[counterField] === undefined) {
            updatedCategoryCounters[counterField] = Number(cData?.[counterField]) || 0;
          }

          updatedCategoryCounters[counterField]++;
          const generatedBib = `${jarakAngka}${String(updatedCategoryCounters[counterField]).padStart(3, "0")}`;

          return { ...member, nomorBIB: generatedBib, bib: generatedBib };
        });

        transaction.set(
          counterDocRef,
          updatedCategoryCounters,
          { merge: true },
        );
        transaction.update(groupRef, {
          statusPembayaran: "Lunas",
          waktuLunas: new Date().toISOString(),
          participants: finalParticipants,
        });
      });

      setApproveProcess((prev) => ({
        ...prev,
        message: "Mengirim E-Ticket Kolektif ke email Kapten...",
      }));

      const res = await sendEmailAction({
          type: "payment_success_komunitas",
          email: g.kapten?.email,
          nama: g.kapten?.nama,
          detail: {
            id: g.id,
            komunitas: g.kapten?.komunitas || "-",
            totalPeserta: finalParticipants.length || 0,
            totalBiaya: g.totalBiaya || 0,
            participants: finalParticipants,
          },
        });

      if (!res.success)
        console.warn("Gagal mengirim email E-Ticket komunitas dari server.");

      await addDoc(collection(db, "vr_logs"), {
        type: "bayar",
        action: `menyetujui pembayaran komunitas`,
        targetName: g.kapten?.komunitas,
        adminEmail: adminUser?.email || "Admin",
        timestamp: Date.now(),
      });

      if (detailGroup?.id === g.id) {
        setDetailGroup((prev: any) => ({
          ...prev,
          statusPembayaran: "Lunas",
          participants: finalParticipants,
        }));
      }

      setApproveProcess((prev) => ({
        ...prev,
        step: "success",
        message: `Selesai! BIB Komunitas berhasil diterbitkan dan Email E-Ticket telah dikirim.`,
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
      group: null,
      step: "confirm",
      message: "",
    });
  };

  // --- 🔥 AKSI PENYERAHAN LOGISTIK KOLEKTIF DENGAN VERIFIKASI KEAMANAN 🔥 ---
  const openHandoverKomunitas = (
    id: string,
    groupName: string,
    kaptenName: string,
  ) => {
    setHandoverModal({
      isOpen: true,
      id,
      groupName,
      kaptenName,
      namaPengambil: kaptenName,
      metodeVerifikasi: "KTP",
    });
  };

  const executeHandoverKomunitas = async () => {
    const { id, groupName, namaPengambil, metodeVerifikasi } = handoverModal;
    const adminEmail = auth.currentUser?.email || "Admin Lapangan";

    if (!namaPengambil.trim() || !metodeVerifikasi.trim()) {
      setAlertModal({
        isOpen: true,
        type: "warning",
        title: "Data Tidak Lengkap",
        message: "Nama Pengambil dan Metode Verifikasi wajib diisi!",
      });
      return;
    }

    setActionLoading(id);

    try {
      const dataUpdate = {
        isRacepackTaken: true,
        waktuAmbilRacepack: new Date().toISOString(),
        adminHandler: adminEmail,
        namaPengambilAtribut: namaPengambil,
        metodeVerifikasiRPC: metodeVerifikasi,
      };

      await updateDoc(doc(db, "pendaftaran_komunitas", id), dataUpdate);

      if (detailGroup?.id === id) {
        setDetailGroup({ ...detailGroup, ...dataUpdate });
      }

      await addDoc(collection(db, "vr_logs"), {
        type: "resi",
        action: `menyerahkan racepack komunitas kolektif kepada ${namaPengambil} (Verifikasi via ${metodeVerifikasi})`,
        targetName: groupName,
        adminEmail: adminEmail,
        timestamp: Date.now(),
      });

      setAlertModal({
        isOpen: true,
        type: "success",
        title: "Racepack Diserahkan",
        message: `Sukses! Racepack Komunitas ${groupName} berhasil diserahkan kepada ${namaPengambil}.`,
      });
    } catch {
      setAlertModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Terjadi kesalahan. Gagal memproses penyerahan.",
      });
    }

    setActionLoading(null);
  };

  const handleBulkDeleteClick = () => {
    setConfirmModal({
      isOpen: true,
      title: "Konfirmasi Hapus",
      message: `Hapus ${selectedIds.length} data komunitas ini beserta seluruh pesertanya secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      onConfirm: async () => {
        const batch = writeBatch(db);
        selectedIds.forEach((id) =>
          batch.delete(doc(db, "pendaftaran_komunitas", id)),
        );
        await batch.commit();
        setSelectedIds([]);
        setAlertModal({
          isOpen: true,
          type: "success",
          title: "Berhasil",
          message: "Data komunitas berhasil dihapus.",
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
      {/* --- 🔥 KUMPULAN MODAL (MENGGANTIKAN ALERT & PROMPT BAWAAN) 🔥 --- */}

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

      {/* 3. Modal Handover RPC Komunitas (Menggantikan 2x Prompt) */}
      {handoverModal.isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50">
              <h3 className="text-lg font-black text-slate-800">
                Verifikasi Pengambilan Racepack
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Tim {handoverModal.groupName}
              </p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Nama Pengambil Atribut
                </label>
                <input
                  type="text"
                  value={handoverModal.namaPengambil}
                  onChange={(e) =>
                    setHandoverModal({
                      ...handoverModal,
                      namaPengambil: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#1A73E8] transition-colors shadow-sm"
                  placeholder="Nama Penanggung Jawab di Lokasi"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                  Ubah nama di atas jika atribut diambil oleh perwakilan (selain
                  kapten: {handoverModal.kaptenName}).
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                  Metode Bukti Verifikasi
                </label>
                <select
                  value={handoverModal.metodeVerifikasi}
                  onChange={(e) =>
                    setHandoverModal({
                      ...handoverModal,
                      metodeVerifikasi: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#1A73E8] transition-colors shadow-sm cursor-pointer"
                >
                  <option value="KTP">KTP Asli / Identitas Lainnya</option>
                  <option value="E-TICKET">Scan QR E-Ticket</option>
                  <option value="WHATSAPP">Bukti Chat WhatsApp</option>
                  <option value="SURAT KUASA">Surat Kuasa Resmi</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button
                onClick={() =>
                  setHandoverModal({ ...handoverModal, isOpen: false })
                }
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  setHandoverModal({ ...handoverModal, isOpen: false });
                  executeHandoverKomunitas();
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#1E8E3E] text-white hover:bg-[#188038] shadow-md transition-colors flex items-center gap-2"
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Konfirmasi Penyerahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal Approve Progress (Untuk Generate BIB & Email) */}
      {approveProcess.isOpen && approveProcess.group && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
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
                    Verifikasi Pembayaran Komunitas
                  </h3>
                  <p className="text-sm text-slate-600 mb-6">
                    Anda akan menyetujui status LUNAS untuk grup{" "}
                    <strong>{approveProcess.group.kapten?.komunitas}</strong>.
                    <br />
                    Sistem akan mengirimkan email E-Ticket Kolektif ke Kapten.
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

      {/* --- STATISTIK --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Komunitas / Grup
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {groups.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Grup Terdaftar</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center">
            <Users2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Anggota Peserta
            </p>
            <h3 className="text-2xl font-black text-[#1A73E8]">
              {totalPesertaGrup}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Akumulasi Seluruh Peserta</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Grup Lunas (Verified)
            </p>
            <h3 className="text-2xl font-black text-[#1E8E3E]">
              {totalLunas}
            </h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Pembayaran Valid</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1E8E3E] flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Dana Masuk
            </p>
            <h3 className="text-xl font-black text-[#1A73E8] truncate">
              Rp {totalUangLunas.toLocaleString("id-ID")}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Total Pemasukan Komunitas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- FILTER TABS & TOOLBAR UTAMA --- */}
      <div className="space-y-4 mb-4">
        {/* ROW 1: TABS STATUS PEMBAYARAN & ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {[
              { id: "Semua", label: "Semua", count: groups.length },
              { id: "Lunas", label: "Lunas", count: totalLunas },
              { id: "Menunggu Verifikasi", label: "Menunggu Verifikasi", count: groups.filter((g) => g.statusPembayaran === "Menunggu Verifikasi").length },
              { id: "Pending", label: "Pending", count: groups.filter((g) => g.statusPembayaran === "Pending" || !g.statusPembayaran).length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterStatus(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  filterStatus === tab.id
                    ? "bg-[#1A73E8] text-white shadow-sm shadow-blue-500/20"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    filterStatus === tab.id
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* ACTION BUTTONS ATAS */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDeleteClick}
                className="bg-rose-50 text-[#D93025] hover:bg-rose-100 px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus ({selectedIds.length})
              </button>
            )}

            <button
              onClick={handleBroadcastReminderClick}
              disabled={isBroadcasting}
              className="px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isBroadcasting ? (
                <div className="w-3.5 h-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              {isBroadcasting ? "Mengirim..." : "Reminder RPC"}
            </button>

            <button
              onClick={handleExportExcel}
              className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ekspor Excel
            </button>
          </div>
        </div>

        {/* ROW 2: SEARCH & FILTER TOOLBAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Kapten, Komunitas, ID Grup, WA..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8] w-full transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto justify-end">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(
                  e.target.value === "All" ? "All" : Number(e.target.value),
                );
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
            >
              <option value={10}>10 Baris</option>
              <option value={50}>50 Baris</option>
              <option value={100}>100 Baris</option>
              <option value="All">Semua</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- TABLE CARD --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
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
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("createdAt")}
                >
                  <div className="flex items-center gap-1.5">
                    Waktu Daftar
                    {sortConfig.key === "createdAt" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("komunitas")}
                >
                  <div className="flex items-center gap-1.5">
                    Komunitas
                    {sortConfig.key === "komunitas" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("namaKapten")}
                >
                  <div className="flex items-center gap-1.5">
                    Kapten (PJ)
                    {sortConfig.key === "namaKapten" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("peserta")}
                >
                  <div className="flex items-center gap-1.5">
                    Peserta
                    {sortConfig.key === "peserta" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("totalBiaya")}
                >
                  <div className="flex items-center gap-1.5">
                    Total Tagihan
                    {sortConfig.key === "totalBiaya" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("statusPembayaran")}
                >
                  <div className="flex items-center gap-1.5">
                    Status Bayar
                    {sortConfig.key === "statusPembayaran" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3.5 font-bold text-right">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-slate-400 font-medium text-sm bg-slate-50">
                    <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    {searchQuery
                      ? `Tidak ditemukan komunitas dengan kata kunci "${searchQuery}".`
                      : "Belum ada data pendaftaran komunitas."}
                  </td>
                </tr>
              ) : (
                paginatedData.map((g) => {
                  let displayDate = "-";
                  let displayTime = "-";
                  if (g.createdAt) {
                    const d = new Date(
                      g.createdAt.seconds
                        ? g.createdAt.seconds * 1000
                        : g.createdAt,
                    );
                    displayDate = d.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    displayTime = d.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  }

                  const participantCount = g.participants?.length || g.peserta?.length || 0;

                  return (
                    <tr
                      key={g.id}
                      className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(g.id) ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(g.id)}
                          onChange={() => toggleSelect(g.id)}
                          className="w-4 h-4 cursor-pointer accent-[#1A73E8]"
                        />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">{displayDate}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{displayTime} • ID: {g.id}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 text-sm">{g.kapten?.komunitas || "-"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-800 text-sm">{g.kapten?.nama || "-"}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{g.kapten?.wa || "-"} • {g.kapten?.email || "-"}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          <Users className="w-3 h-3 text-slate-500" />
                          {participantCount} Peserta
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 text-sm">
                          Rp {g.totalBiaya?.toLocaleString("id-ID")}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${
                            g.statusPembayaran === "Lunas"
                              ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20"
                              : g.statusPembayaran === "Menunggu Verifikasi"
                              ? "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20"
                              : "bg-[#FCE8E6] text-[#D93025] border-[#D93025]/20"
                          }`}
                        >
                          {g.statusPembayaran || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          onClick={() => setDetailGroup(g)}
                          className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                        >
                          Detail Grup &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- FOOTER PAGINATION --- */}
        {itemsPerPage !== "All" && (
          <div className="bg-white border-t border-slate-200 p-3 flex justify-between items-center text-xs font-medium text-slate-500">
            <div>
              Menampilkan{" "}
              <span className="font-bold text-slate-800">
                {(currentPage - 1) * (itemsPerPage as number) + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-slate-800">
                {Math.min(
                  currentPage * (itemsPerPage as number),
                  sortedData.length,
                )}
              </span>{" "}
              dari <span className="font-bold text-slate-800">{sortedData.length}</span> data
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- 🔥 MODAL DETAIL PENDAFTAR GRUP 🔥 --- */}
      {detailGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-xl font-black text-slate-800 leading-tight">
                  Tim {detailGroup.kapten?.komunitas}
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  ID Sistem: {detailGroup.id}
                </p>
              </div>
              <button
                onClick={() => setDetailGroup(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white">
              {/* === KOLOM KIRI (INFO KAPTEN & PEMBAYARAN) === */}
              <div className="lg:col-span-4 space-y-5">
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
                    KODE VERIFIKASI / ID GRUP
                  </p>
                  <p className="text-xl font-mono font-black text-slate-800 tracking-wider">
                    {detailGroup.id}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    *Gunakan kode ini sebagai pencocokan saat RPC.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Kapten / PJ Komunitas
                  </p>
                  <p className="text-lg font-bold text-slate-800">
                    {detailGroup.kapten?.nama}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {detailGroup.kapten?.wa}
                  </p>
                  <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {detailGroup.kapten?.email}
                  </p>

                  {(detailGroup.ktpUrl || detailGroup.logoUrl) && (
                    <div className="mt-4 border-t border-slate-200 pt-4 flex gap-2">
                      {detailGroup.ktpUrl && (
                        <div
                          onClick={() =>
                            detailGroup.ktpUrl.startsWith("http")
                              ? window.open(detailGroup.ktpUrl, "_blank")
                              : setAlertModal({
                                  isOpen: true,
                                  type: "warning",
                                  title: "File Tidak Ditemukan",
                                  message:
                                    "Berkas KTP sudah diupload oleh peserta, namun URL file aslinya tidak ditemukan di database.",
                                })
                          }
                          className="cursor-pointer text-xs bg-white border border-slate-200 text-blue-600 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1 flex-1 justify-center"
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
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>{" "}
                          KTP
                        </div>
                      )}
                      {detailGroup.logoUrl && (
                        <div
                          onClick={() =>
                            detailGroup.logoUrl.startsWith("http")
                              ? window.open(detailGroup.logoUrl, "_blank")
                              : setAlertModal({
                                  isOpen: true,
                                  type: "warning",
                                  title: "File Tidak Ditemukan",
                                  message:
                                    "Berkas Logo sudah diupload oleh peserta, namun URL file aslinya tidak ditemukan di database.",
                                })
                          }
                          className="cursor-pointer text-xs bg-white border border-slate-200 text-purple-600 font-bold px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1 flex-1 justify-center"
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
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>{" "}
                          Logo
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col justify-center">
                  <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                    Total Tagihan ({detailGroup.participants?.length || 0}{" "}
                    Peserta)
                  </p>
                  <p className="text-3xl font-black text-blue-700">
                    Rp {detailGroup.totalBiaya?.toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    TOTAL KEBUTUHAN JERSEY TIM
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {Object.entries(
                      getJerseySummary(detailGroup.participants),
                    ).map(([size, qty]: any) => (
                      <div
                        key={size}
                        className="bg-white border border-slate-200 rounded-xl p-2 font-bold shadow-sm"
                      >
                        <div className="text-slate-400 text-[10px] mb-0.5">
                          {size}
                        </div>
                        <div className="text-base text-slate-800">
                          {qty} Pcs
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status Pembayaran
                    </p>
                    <span
                      className={`px-2 py-1.5 rounded text-xs font-bold block text-center ${detailGroup.statusPembayaran === "Lunas" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {detailGroup.statusPembayaran || "Belum Bayar"}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Status Logistik Racepack
                    </p>
                    <span
                      className={`px-2 py-1.5 rounded text-xs font-bold block text-center ${detailGroup.isRacepackTaken ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-slate-200 text-slate-700"}`}
                    >
                      {detailGroup.isRacepackTaken
                        ? "SUDAH DIAMBIL"
                        : "BELUM DIAMBIL"}
                    </span>
                  </div>

                  {detailGroup.isRacepackTaken && (
                    <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 text-slate-600 shadow-sm mt-3">
                      <div>
                        <span className="font-medium text-slate-400 block mb-0.5">
                          Diserahkan Kepada:
                        </span>{" "}
                        <span className="font-bold text-slate-800">
                          {detailGroup.namaPengambilAtribut ||
                            detailGroup.kapten?.nama}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-400 block mb-0.5">
                          Metode Verifikasi:
                        </span>{" "}
                        <span className="font-bold text-[#1A73E8]">
                          {detailGroup.metodeVerifikasiRPC || "KTP"}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-400 block mb-0.5">
                          Waktu Pengambilan:
                        </span>{" "}
                        <span className="font-bold text-slate-700">
                          {new Date(
                            detailGroup.waktuAmbilRacepack,
                          ).toLocaleString("id-ID")}
                        </span>
                      </div>
                      <div className="pt-1 mt-1 border-t border-slate-100">
                        <span className="font-medium text-slate-400 block mb-0.5">
                          Admin Penanggung Jawab:
                        </span>{" "}
                        <span className="font-bold text-slate-700">
                          {detailGroup.adminHandler || "-"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {detailGroup.buktiBayarUrl && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Bukti Transfer
                    </h3>
                    <div
                      className="w-full h-48 rounded-xl border-2 border-dashed border-slate-300 overflow-hidden cursor-zoom-in group relative"
                      onClick={() =>
                        setSelectedImage(detailGroup.buktiBayarUrl)
                      }
                    >
                      <img
                        src={detailGroup.buktiBayarUrl}
                        alt="Bukti Bayar"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* === KOLOM KANAN (TABEL DAFTAR PESERTA) === */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="flex justify-between items-end mb-3 border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-800">
                    Daftar Anggota / Peserta
                  </h3>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Total: {detailGroup.participants?.length || 0} Orang
                  </span>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto flex-grow h-[400px]">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="p-3 font-bold">No</th>
                        <th className="p-3 font-bold text-[#1A73E8]">
                          Nomor BIB
                        </th>
                        <th className="p-3 font-bold">Nama Lengkap & NIK</th>
                        <th className="p-3 font-bold">Kategori</th>
                        <th className="p-3 font-bold">Gender</th>
                        <th className="p-3 font-bold">Darah</th>
                        <th className="p-3 font-bold">Size Jersey</th>
                        <th className="p-3 font-bold">Riwayat Penyakit</th>
                        <th className="p-3 font-bold">Kontak Darurat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailGroup.participants?.length > 0 ? (
                        detailGroup.participants.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-500 text-center">
                              {idx + 1}
                            </td>
                            <td className="p-3 font-mono font-black text-[#1A73E8] bg-blue-50/30">
                              {p.nomorBIB || p.bib || "-"}
                            </td>
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">
                                {p.namaLengkap || "-"}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {p.nik || "-"}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">
                              <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs font-medium">
                                {p.kategori || "-"}
                              </span>
                            </td>
                            <td className="p-3 text-slate-600">
                              {p.gender || "-"}
                            </td>
                            <td className="p-3 text-slate-600">
                              <span className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-xs font-bold">
                                {p.golDarah || "-"}
                              </span>
                            </td>
                            <td className="p-3 font-black text-slate-800">
                              {p.ukuranJersey || "-"}
                            </td>
                            <td className="p-3 text-slate-600">
                              {p.riwayatPenyakit || "-"}
                            </td>
                            <td className="p-3 text-slate-600">
                              <div className="font-medium text-slate-700">
                                {p.kontakDarurat || "-"}
                              </div>
                              <div className="text-xs text-slate-400">
                                {p.waDarurat || "-"}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-8 text-center text-slate-400 italic"
                          >
                            Tidak ada data peserta di dalam grup ini.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-end gap-3 shrink-0">
              <button
                onClick={() => setDetailGroup(null)}
                className="px-6 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
              >
                Tutup Layar
              </button>

              {detailGroup.statusPembayaran === "Menunggu Verifikasi" && (
                <button
                  onClick={() => triggerApprove(detailGroup)}
                  className="px-6 py-2.5 rounded-xl bg-[#1A73E8] text-white font-bold hover:bg-[#1557B0] shadow-md transition-all flex items-center gap-2"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>{" "}
                  Terima Pembayaran
                </button>
              )}

              {detailGroup.statusPembayaran === "Lunas" &&
                !detailGroup.isRacepackTaken && (
                  <button
                    onClick={() =>
                      openHandoverKomunitas(
                        detailGroup.id,
                        detailGroup.kapten?.komunitas,
                        detailGroup.kapten?.nama,
                      )
                    }
                    disabled={actionLoading === detailGroup.id}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading === detailGroup.id ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
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
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                    )}
                    Serahkan Racepack Tim
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL ZOOM IMAGE --- */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="Zoom Bukti Bayar"
            className="max-w-full max-h-[90vh] rounded-lg shadow-2xl object-contain animate-in zoom-in-95 duration-200"
          />
          <p className="absolute bottom-6 text-white/50 text-sm font-medium">
            Klik dimana saja untuk menutup
          </p>
        </div>
      )}
    </div>
  );
}
