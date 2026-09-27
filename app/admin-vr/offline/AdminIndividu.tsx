"use client";

import { useEffect, useState, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  addDoc,
  runTransaction,
  query,
  deleteField,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";
import { sendEmailAction } from "@/app/actions/email";
import {
  Users,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Mail,
  RotateCcw,
  Trash2,
  Edit3,
  Eye,
  AlertTriangle,
  X,
  ShieldCheck,
  ChevronDown,
  Bell,
  ArrowUpDown
} from "lucide-react";

export default function AdminOfflineRunPage() {
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKategori, setFilterKategori] = useState("Semua");
  const [filterGender, setFilterGender] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminUser, setAdminUser] = useState<any>(null);

  // UI State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailParticipant, setDetailParticipant] = useState<any>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [isBroadcastingUpgrade, setIsBroadcastingUpgrade] = useState(false);

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

  const [importProcess, setImportProcess] = useState<{
    isOpen: boolean;
    data: any[];
    step: "confirm" | "processing" | "success" | "error";
    message: string;
    successCount: number;
    failCount: number;
  }>({
    isOpen: false,
    data: [],
    step: "confirm",
    message: "",
    successCount: 0,
    failCount: 0,
  });

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

  // --- MENGAMBIL DATA & MEMANTAU BUKTI BARU ---
  useEffect(() => {
    const q = query(collection(db, "offline_participants"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => {
        const raw = doc.data() as any;
        return {
          id: doc.id,
          ...raw,
          // Normalisasi Nama
          namaLengkap: raw.namaLengkap || raw.nama || raw.fullName || (raw.pemesan_namaDepan ? `${raw.pemesan_namaDepan} ${raw.pemesan_namaBelakang || ""}`.trim() : "") || "Peserta",
          namaBib: raw.namaBib || raw.bibName || raw.namaLengkap || raw.nama || "-",
          // Normalisasi BIB & Jarak
          nomorBIB: raw.nomorBIB || raw.bib || raw.nomorBibLengkap || "",
          jarak: raw.jarak || raw.kategori || raw.category || "5K",
          kategori: raw.kategori || raw.jarak || "5K",
          paketNama: raw.paketNama || raw.namaPaket || raw.paket || `${raw.jarak || "5K"} Offline`,
          ukuranJersey: raw.ukuranJersey || raw.jerseySize || raw.sizeJersey || raw.ukuranKaos || "-",
          // Normalisasi Identitas & Gender
          nik: raw.nik || raw.noKTP || raw.nomorIdentitas || raw.idNumber || "-",
          jenisIdentitas: raw.jenisIdentitas || raw.idType || "KTP",
          jenisKelamin: raw.jenisKelamin || raw.gender || raw.kelamin || "-",
          tanggalLahir: raw.tanggalLahir || raw.birthDate || raw.dob || "-",
          golonganDarah: raw.golonganDarah || raw.golDarah || raw.bloodType || "-",
          riwayatPenyakit: raw.riwayatPenyakit || raw.medicalHistory || raw.penyakit || "-",
          // Normalisasi Kontak
          noWA: raw.noWA || raw.noWhatsApp || raw.telepon || raw.phone || raw.whatsapp || "-",
          email: raw.email || raw.eMail || raw.alamatEmail || "-",
          // Normalisasi Kontak Darurat
          namaDarurat: raw.namaDarurat || raw.emergencyContactName || raw.namaKontakDarurat || raw.kontakDarurat || "-",
          hubunganDarurat: raw.hubunganDarurat || raw.emergencyContactRelation || raw.relasiDarurat || "-",
          waDarurat: raw.waDarurat || raw.emergencyContactPhone || raw.noWADarurat || raw.teleponDarurat || raw.nomorDarurat || "-",
          // Normalisasi Domisili & Komunitas
          komunitas: raw.komunitas || raw.namaKomunitas || raw.community || raw.club || "-",
          noPendaftaran: raw.noPendaftaran || raw.orderIdGroup || raw.registrationNumber || "-",
          kota: raw.kota || raw.city || raw.kabupaten || "-",
          provinsi: raw.provinsi || raw.province || "-",
          alamat: raw.alamat || raw.address || raw.domisili || "",
          negara: raw.negara || raw.nationality || raw.kewarganegaraan || "Indonesia",
          // Normalisasi Finansial & Status
          statusPembayaran: raw.statusPembayaran || raw.status || "Belum Bayar",
          totalTagihan: Number(raw.totalTagihan ?? raw.totalBayar ?? raw.hargaAsli ?? raw.subtotalPesanan ?? 0),
          hargaAsli: Number(raw.hargaAsli ?? raw.totalTagihan ?? 0),
          buktiBayarUrl: raw.buktiBayarUrl || raw.buktiTransfer || raw.buktiPembayaran || raw.buktiTransferUrl || "",
          waktuDaftar: raw.waktuDaftar || raw.createdAt || raw.tanggalDaftar || "",
        };
      });
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
    const matchKategori = 
      filterKategori === "Semua" || p.jarak === filterKategori;
    const matchGender = 
      filterGender === "Semua" || p.jenisKelamin === filterGender;
    const matchSearch =
      p.namaLengkap?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nomorBIB?.includes(searchQuery) ||
      p.nik?.includes(searchQuery) ||
      p.noWA?.includes(searchQuery) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.namaBib?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kodePromoDipakai?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchKategori && matchGender && matchSearch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let valA = a[sortConfig.key];
    let valB = b[sortConfig.key];

    if (sortConfig.key === "nomorBIB" || sortConfig.key === "bib") {
      const numA = parseInt(String(valA || "").replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(valB || "").replace(/\D/g, ""), 10) || 0;
      return sortConfig.direction === "asc" ? numA - numB : numB - numA;
    }

    if (sortConfig.key === "totalTagihan") {
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return sortConfig.direction === "asc" ? numA - numB : numB - numA;
    }

    if (sortConfig.key === "waktuDaftar") {
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
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
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
        "Kota / Domisili": p.kota || "-",
        "Alamat": p.alamat || "-",
        "No Pendaftaran (Mitra)": p.noPendaftaran || "-",
        "Harga Asli": p.hargaAsli || p.totalTagihan || 0,
        "Kode Promo Dipakai": p.kodePromoDipakai || "-",
        "Total Diskon": p.totalDiskon || 0,
        "Donasi / Charity (Rp)": p.charity || p.donasi || 0,
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

  const handleDownloadTemplate = () => {
    const templateData = [{
      "Status Pembayaran": "Lunas",
      "Nomor BIB": "",
      "Kategori Jarak": "5K",
      "Paket Dipilih": "Early Bird",
      "Nama di BIB": "John Doe",
      "Nama Lengkap": "John Doe Smith",
      "Kategori Peserta": "Umum",
      "Jenis Identitas": "KTP",
      "Nomor Identitas (NIK/NIS)": "3400000000000000",
      "Jenis Kelamin": "Laki-laki",
      "Tanggal Lahir": "1990-01-01",
      "No. WhatsApp": "08123456789",
      "Email": "johndoe@example.com",
      "Komunitas": "-",
      "Ukuran Jersey": "L",
      "Golongan Darah": "O",
      "Riwayat Penyakit": "Tidak Ada",
      "Nama Kontak Darurat": "Jane Doe",
      "Hubungan Darurat": "Istri",
      "No WA Darurat": "08129876543",
      "Kota": "Kab. Sleman",
      "Alamat": "Jl. Kaliurang KM 14",
      "Total Tagihan (Nett)": 150000,
    }];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Import");
    XLSX.writeFile(workbook, `Template_Import_Peserta.xlsx`);
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAlertModal({
      isOpen: true,
      type: "warning",
      title: "Membaca File...",
      message: "Mohon tunggu, sistem sedang membaca isi Excel...",
    });

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (!jsonData || jsonData.length === 0) {
           setAlertModal({ isOpen: true, type: "error", title: "File Kosong", message: "Tidak ada baris data di file Excel." });
           return;
        }

        // Tutup loading alert
        setAlertModal({ isOpen: false, type: "success", title: "", message: "" });
        
        // Tampilkan konfirmasi Opsi BIB
        setImportProcess({
          isOpen: true,
          data: jsonData,
          step: "confirm",
          message: `Ditemukan ${jsonData.length} data peserta dalam file Excel.`,
          successCount: 0,
          failCount: 0,
        });

      } catch (error) {
        console.error(error);
        setAlertModal({
          isOpen: true,
          type: "warning",
          title: "Gagal Membaca File",
          message: "Pastikan format Excel sesuai dengan template.",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleResetBibCounter = () => {
    setConfirmModal({
      isOpen: true,
      title: "Reset Counter BIB Offline ke 0",
      message:
        "Apakah Anda yakin ingin me-reset seluruh urutan nomor BIB Offline ke 0? Penomoran BIB berikutnya untuk setiap kategori (3K: 3001, 5K: 5001, 10K: 10001, 21K: 21001) akan dimulai dari 001. Pastikan data pendaftar sebelumnya sudah disesuaikan.",
      onConfirm: async () => {
        try {
          await setDoc(
            doc(db, "pengaturan", "counter_bib_offline"),
            {
              lastBib3K: 0,
              lastBib5K: 0,
              lastBib10K: 0,
              lastBib21K: 0,
              lastBib: 0,
            },
            { merge: true }
          );
          setAlertModal({
            isOpen: true,
            type: "success",
            title: "Berhasil Reset",
            message: "Counter BIB Offline seluruh kategori berhasil di-reset ke 0. Penomoran berikutnya akan dimulai dari 001 (misal 3001, 5001, 10001).",
          });
        } catch (e: any) {
          setAlertModal({
            isOpen: true,
            type: "error",
            title: "Gagal Reset",
            message: e.message || "Gagal mereset counter BIB.",
          });
        }
      },
    });
  };

  const executeImport = async (useAutoBib: boolean) => {
    setImportProcess((prev) => ({
      ...prev,
      step: "processing",
      message: `Sedang menyiapkan ${prev.data.length} data peserta...`,
    }));
    
    let successCount = 0;
    let failCount = 0;
    const counterDocRef = doc(db, "pengaturan", "counter_bib_offline");
    let categoryCounters: Record<string, number> = {};

    try {
      // Fetch packages to map paketId for proper quota decrement
      let offlinePackages: any[] = [];
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "virtual_run"));
        if (settingsSnap.exists()) {
          offlinePackages = settingsSnap.data()?.offlinePackages || [];
        }
      } catch (err) {
        console.warn("Could not fetch offlinePackages:", err);
      }

      if (useAutoBib) {
        const counterSnap = await getDoc(counterDocRef);
        if (counterSnap.exists()) {
          const cData = counterSnap.data() || {};
          categoryCounters = {
            lastBib3K: Number(cData.lastBib3K) || 0,
            lastBib5K: Number(cData.lastBib5K) || 0,
            lastBib10K: Number(cData.lastBib10K) || 0,
            lastBib21K: Number(cData.lastBib21K) || 0,
          };
        } else {
          categoryCounters = {
            lastBib3K: 0,
            lastBib5K: 0,
            lastBib10K: 0,
            lastBib21K: 0,
          };
        }
      }

      const rows = importProcess.data as any[];
      const totalRows = rows.length;
      const preparedDocs: any[] = [];

      for (let i = 0; i < totalRows; i++) {
        const row = rows[i];
        const getVal = (keys: string[]): string => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
              return String(row[k]).trim();
            }
          }
          return "";
        };

        // 1. Kategori & Jarak
        const rawKat = getVal(["Kategori Jarak", "Grup Kategori", "Kategori", "Category", "Jarak"]);
        let jarak = rawKat.toUpperCase();
        if (jarak.includes("21K")) jarak = "21K";
        else if (jarak.includes("10K")) jarak = "10K";
        else if (jarak.includes("5K")) jarak = "5K";
        else if (jarak.includes("3K")) jarak = "3K";
        else jarak = rawKat || "5K";

        const paketNama = getVal(["Paket Dipilih", "Kategori", "Paket", "Package"]) || `${jarak} - Mitra Lawana`;

        // Match package for quota and categorization
        const matchedPkg = offlinePackages.find((pkg: any) => 
          (pkg.name && (pkg.name.toLowerCase() === paketNama.toLowerCase() || paketNama.toLowerCase().includes(pkg.name.toLowerCase()))) ||
          (pkg.jarak && pkg.jarak.toLowerCase() === jarak.toLowerCase())
        );
        const paketId = matchedPkg?.id || "";

        // 2. BIB
        let rawBib = getVal(["Nomor BIB", "BIB Number", "BIB", "No BIB", "Nomor Dada"]);
        let finalBib = rawBib;
        
        if (useAutoBib) {
          const jarakAngka = jarak.replace(/\D/g, "") || "5";
          const counterField = `lastBib${jarakAngka}K`;
          if (categoryCounters[counterField] === undefined) {
            categoryCounters[counterField] = 0;
          }
          categoryCounters[counterField]++;
          finalBib = `${jarakAngka}${String(categoryCounters[counterField]).padStart(3, "0")}`;
        }

        // 3. Nama & BIB Name
        const namaLengkap = getVal(["Nama Lengkap", "Full Name", "Nama", "Name"]);
        const namaBib = getVal(["Nama di BIB", "BIB Name", "Nama BIB", "Bib Name"]) || namaLengkap;

        // 4. Identitas & Gender
        const jenisIdentitas = getVal(["Jenis Identitas", "ID Number Type", "Identitas", "ID Type"]) || "KTP";
        const nik = getVal(["Nomor Identitas (NIK/NIS)", "ID Number", "NIK", "No KTP", "Nomor Identitas"]);
        
        const rawGender = getVal(["Jenis Kelamin", "Gender", "Kelamin"]).toLowerCase();
        let jenisKelamin = getVal(["Jenis Kelamin", "Gender"]);
        if (rawGender === "female" || rawGender === "perempuan" || rawGender === "wanita" || rawGender === "p") {
          jenisKelamin = "Perempuan";
        } else if (rawGender === "male" || rawGender === "laki-laki" || rawGender === "pria" || rawGender === "l") {
          jenisKelamin = "Laki-laki";
        }

        // 5. Kontak & Akun
        let noWA = getVal(["No. WhatsApp", "Phone Number", "No WA", "WhatsApp", "Phone", "Telepon", "No HP"]);
        if (noWA.startsWith("62")) noWA = "0" + noWA.slice(2);
        else if (noWA.startsWith("+62")) noWA = "0" + noWA.slice(3);

        const email = getVal(["Email", "E-mail", "Alamat Email"]);

        // 6. Ukuran Jersey (Bersihkan jika ada format Unisex, contoh: 'XS (Unisex)' -> 'XS')
        let ukuranJersey = getVal(["Ukuran Jersey", "Jersey Size", "Jersey", "Ukuran Kaos", "Size"]);
        ukuranJersey = ukuranJersey.replace(/\(.*?\)/g, "").trim();

        // 7. Kontak Darurat (Tetap ada & aman)
        const namaDarurat = getVal(["Nama Kontak Darurat", "Emergency Contact Name", "Nama Darurat", "Kontak Darurat"]) || "-";
        const hubunganDarurat = getVal(["Hubungan Darurat", "Emergency Contact Relation", "Hubungan", "Relasi Darurat"]) || "-";
        const waDarurat = getVal(["No WA Darurat", "Emergency Contact Number", "No Telepon Darurat", "WA Darurat", "Emergency Phone"]) || "-";

        // 8. Domisili & Info Tambahan
        const noPendaftaran = getVal(["No Pendaftaran", "Registration Number", "No Registrasi", "Order ID"]);
        const negara = getVal(["Nationality", "Negara", "Kewarganegaraan"]) || "Indonesia";
        const kota = getVal(["City", "Kota", "Kabupaten", "Kabupaten/Kota"]);
        const alamat = getVal(["Address", "Alamat", "Domisili"]);
        const tanggalLahir = getVal(["Tanggal Lahir", "Birth Date", "DOB", "Tgl Lahir"]);
        const golonganDarah = getVal(["Golongan Darah", "Blood Type", "Gol Darah"]) || "-";
        const riwayatPenyakit = getVal(["Riwayat Penyakit", "Medical History", "Penyakit"]) || "-";
        const komunitas = getVal(["Komunitas", "Community", "Club", "Klub"]) || "-";
        const statusPembayaran = getVal(["Status Pembayaran", "Payment Status", "Status"]) || "Lunas";
        const rawWaktu = getVal(["Tanggal Daftar", "Waktu Daftar", "Created At", "Registration Date"]);
        let waktuDaftar = new Date().toISOString();
        if (rawWaktu) {
          const parsed = new Date(rawWaktu);
          if (!isNaN(parsed.getTime())) waktuDaftar = parsed.toISOString();
        }

        const parsePrice = (keys: string[]): number => {
          for (const k of keys) {
            if (row[k] !== undefined && row[k] !== null) {
              if (typeof row[k] === "number") return Math.round(row[k]);
              const cleaned = String(row[k]).replace(/[^0-9]/g, "");
              if (cleaned !== "") {
                const num = parseInt(cleaned, 10);
                if (!isNaN(num) && num > 0) return num;
              }
            }
          }
          return 0;
        };

        let totalTagihan = parsePrice(["Total Tagihan (Nett)", "Total Tagihan", "Nominal", "Harga", "Biaya Pendaftaran", "Total Bayar", "Price", "Amount", "Subtotal", "Paid Amount", "Total"]);
        const charity = parsePrice(["Donasi / Charity (Rp)", "Donasi", "Charity", "Donasi / Charity", "Nominal Charity", "Donation"]);

        // Jika totalTagihan di Excel 0 atau tidak ada kolom harga, gunakan harga paket default dari settings
        if (totalTagihan === 0 && matchedPkg && matchedPkg.harga) {
          totalTagihan = Number(matchedPkg.harga) || 0;
        }

        const pData: any = {
          waktuDaftar,
          statusPembayaran,
          waktuLunas: statusPembayaran === "Lunas" ? new Date().toISOString() : null,
          nomorBIB: finalBib,
          bib: finalBib,
          jarak,
          paketNama,
          namaBib,
          namaLengkap,
          kategoriPeserta: getVal(["Kategori Peserta"]) || "Umum",
          jenisIdentitas,
          nik,
          jenisKelamin,
          tanggalLahir,
          noWA,
          email,
          komunitas,
          ukuranJersey,
          golonganDarah,
          riwayatPenyakit,
          namaDarurat,
          hubunganDarurat,
          waDarurat,
          totalTagihan,
          hargaAsli: totalTagihan,
          subtotalPesanan: totalTagihan,
          charity: charity > 0 ? charity : 0,
          noPendaftaran,
          negara,
          kota,
          alamat,
          isImported: true
        };

        if (paketId) {
          pData.paketId = paketId;
        }

        preparedDocs.push(pData);
      }

      // Batch write in chunks of 250 (Firestore limit is 500 operations per batch)
      const BATCH_CHUNK_SIZE = 250;
      const offlineCol = collection(db, "offline_participants");

      for (let i = 0; i < preparedDocs.length; i += BATCH_CHUNK_SIZE) {
        const chunk = preparedDocs.slice(i, i + BATCH_CHUNK_SIZE);
        const batch = writeBatch(db);

        for (const docData of chunk) {
          const newDocRef = doc(offlineCol);
          batch.set(newDocRef, docData);
        }

        setImportProcess((prev) => ({
          ...prev,
          message: `Menyimpan ke database (${Math.min(i + chunk.length, totalRows)} dari ${totalRows} data)...`,
        }));

        await batch.commit();
        successCount += chunk.length;
      }

      if (useAutoBib && successCount > 0) {
        try {
          await setDoc(counterDocRef, categoryCounters, { merge: true });
        } catch (e) {
          console.error("Gagal update counter BIB:", e);
        }
      }

      setImportProcess((prev) => ({
        ...prev,
        step: "success",
        successCount,
        failCount,
        message: `Berhasil mengimpor ${successCount} data peserta ke sistem!`,
      }));

    } catch (e: any) {
      console.error("Import error:", e);
      setImportProcess((prev) => ({
        ...prev,
        step: "error",
        message: e.message || "Gagal melakukan import secara massal.",
      }));
    }
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

  // --- 🔥 FITUR BROADCAST INFO UPGRADE KATEGORI (EMAIL) 🔥 ---
  const handleBroadcastUpgradeClick = () => {
    const targetParticipants = participants.filter(
      (p) => p.statusPembayaran === "Lunas",
    );

    if (targetParticipants.length === 0) {
      setAlertModal({
        isOpen: true,
        type: "warning",
        title: "Target Kosong",
        message:
          "Tidak ada Peserta Individu yang memenuhi syarat (Status Lunas).",
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "Kirim Info Upgrade & E-Ticket",
      message: `Anda akan mengirim Email Pemberitahuan E-Ticket & Penawaran Upgrade Kategori kepada ${targetParticipants.length} Peserta Lunas. Lanjutkan?`,
      onConfirm: () => executeBroadcastUpgrade(targetParticipants),
    });
  };

  const executeBroadcastUpgrade = async (targetParticipants: any[]) => {
    setIsBroadcastingUpgrade(true);
    let successCount = 0;
    let failCount = 0;

    for (const p of targetParticipants) {
      try {
        const res = await sendEmailAction({
          type: "info_upgrade_kategori",
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
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setIsBroadcastingUpgrade(false);
    setAlertModal({
      isOpen: true,
      type: "success",
      title: "Pengiriman Selesai",
      message: `Email Info Upgrade berhasil dikirim:\n• Berhasil: ${successCount} Peserta\n• Gagal: ${failCount} Peserta`,
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
      let isUpgrade = !!p.upgradeRequest;
      let newJarak = isUpgrade ? p.upgradeRequest.newKategori : p.jarak;

      if (!finalBib || isUpgrade) {
        setApproveProcess((prev) => ({
          ...prev,
          message: "Men-generate Nomor BIB...",
        }));

        await runTransaction(db, async (transaction) => {
          const counterDocRef = doc(db, "pengaturan", "counter_bib_offline");
          const participantRef = doc(db, "offline_participants", p.id);

          let settingsRef = doc(db, "settings", "virtual_run");
          const counterDoc = await transaction.get(counterDocRef);
          const settingsDoc = await transaction.get(settingsRef);

          const jarakAngka = (newJarak || p.jarak || "5").replace(/\D/g, "") || "5";
          const counterField = `lastBib${jarakAngka}K`;
          const currentCounterVal = counterDoc.exists() ? (counterDoc.data()?.[counterField] || 0) : 0;
          const nomorUrutBaru = currentCounterVal + 1;
          const isUndangan = Boolean(p.isUndanganKhusus || p.tipePeserta === "Undangan Khusus");

          finalBib = `${isUndangan ? "U-" : ""}${jarakAngka}${String(nomorUrutBaru).padStart(3, "0")}`;

          transaction.set(
            counterDocRef,
            { [counterField]: nomorUrutBaru },
            { merge: true },
          );
          
          let updateData: any = {
            statusPembayaran: "Lunas",
            waktuLunas: new Date().toISOString(),
            nomorBIB: finalBib,
            bib: finalBib,
          };

          if (isUpgrade) {
            updateData.paketId = p.upgradeRequest.newPaketId;
            updateData.kategori = p.upgradeRequest.newKategori;
            updateData.jarak = p.upgradeRequest.newKategori;
            updateData.paketNama = p.upgradeRequest.newPaketNama;
            updateData.hargaAsli = (p.hargaAsli || 0) + (p.upgradeRequest.selisih || 0);
            updateData.subtotalPesanan = (p.subtotalPesanan || 0) + (p.upgradeRequest.selisih || 0);
            updateData.totalTagihan = (p.totalTagihan || 0) + (p.upgradeRequest.selisih || 0);
            updateData.upgradeRequest = deleteField();
          }

          transaction.update(participantRef, updateData);

          if (!isUpgrade && p.idPromoDipakai && p.paketId && settingsDoc.exists()) {
            const settingsData = settingsDoc.data();
            const packages = settingsData.offlinePackages || [];
            const updatedPackages = packages.map((pkg: any) => {
              if (pkg.id === p.paketId && pkg.promos) {
                return {
                  ...pkg,
                  promos: pkg.promos.map((promo: any) =>
                    promo.id === p.idPromoDipakai
                      ? { ...promo, kuotaTerpakai: (promo.kuotaTerpakai || 0) + 1 }
                      : promo
                  ),
                };
              }
              return pkg;
            });
            transaction.update(settingsRef, { offlinePackages: updatedPackages });
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
            jarak: newJarak || "-",
            ukuranJersey: p.ukuranJersey || "-",
            namaBib: p.namaBib || "-",
            bib: finalBib || "-",
            isUpgrade: isUpgrade,
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

      {/* 0. Modal Konfirmasi Import */}
      {importProcess.isOpen && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center bg-blue-50">
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 shadow-sm ${
                importProcess.step === "success"
                  ? "bg-emerald-100 text-emerald-600"
                  : importProcess.step === "error"
                  ? "bg-rose-100 text-rose-600"
                  : "bg-blue-100 text-[#1A73E8]"
              }`}>
                {importProcess.step === "success" ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : importProcess.step === "error" ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-black text-slate-800">
                {importProcess.step === "confirm" ? "Konfirmasi Import" : 
                 importProcess.step === "processing" ? "Memproses Import" : 
                 importProcess.step === "success" ? "Import Berhasil" : "Import Gagal"}
              </h3>
              <p className="text-sm text-slate-600 mt-2 font-medium whitespace-pre-wrap leading-relaxed">
                {importProcess.message}
              </p>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
              {importProcess.step === "confirm" && (
                <>
                  <button
                    onClick={() => executeImport(true)}
                    className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm text-sm"
                  >
                    1. Generate BIB Baru Otomatis (Aman)
                  </button>
                  <button
                    onClick={() => executeImport(false)}
                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                  >
                    2. Gunakan Nomor BIB dari Excel
                  </button>
                  <button
                    onClick={() => setImportProcess({ ...importProcess, isOpen: false })}
                    className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 font-bold py-3 px-4 rounded-xl transition-colors text-sm mt-2"
                  >
                    Batal Import
                  </button>
                </>
              )}
              
              {importProcess.step === "processing" && (
                <div className="flex flex-col items-center p-4">
                  <div className="w-8 h-8 border-4 border-blue-200 border-t-[#1A73E8] rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500 mt-4 font-bold">Harap tunggu...</p>
                </div>
              )}
              
              {(importProcess.step === "success" || importProcess.step === "error") && (
                <button
                  onClick={() => setImportProcess({ ...importProcess, isOpen: false })}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-sm text-sm"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* --- STATISTIK --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Peserta
            </p>
            <h3 className="text-2xl font-black text-slate-900">
              {participants.length}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">Pendaftar Offline</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
              Lunas (Verified)
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
              Pending / Tunggu
            </p>
            <h3 className="text-2xl font-black text-[#F9AB00]">
              {totalPending}
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-1">Perlu Verifikasi</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#F9AB00] flex items-center justify-center">
            <Clock className="w-6 h-6" />
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
            <p className="text-[11px] text-slate-400 mt-1">Total Pemasukan Lunas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1A73E8] flex items-center justify-center">
            <CircleDollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- FILTER TABS & TOOLBAR UTAMA --- */}
      <div className="space-y-4 mb-4">
        {/* ROW 1: TABS STATUS PEMBAYARAN */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto">
            {[
              { id: "Semua", label: "Semua", count: participants.length },
              { id: "Lunas", label: "Lunas", count: totalLunas },
              { id: "Pending", label: "Pending (Upload)", count: totalPending },
              { id: "Belum Bayar", label: "Belum Bayar", count: participants.filter((p) => p.statusPembayaran === "Belum Bayar").length },
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
              onClick={handleBroadcastUpgradeClick}
              disabled={isBroadcastingUpgrade}
              className="px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              title="Kirim email info E-Ticket & penawaran Upgrade Kategori kepada peserta lunas"
            >
              {isBroadcastingUpgrade ? (
                <div className="w-3.5 h-3.5 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Mail className="w-3.5 h-3.5" />
              )}
              {isBroadcastingUpgrade ? "Mengirim..." : "Info Upgrade"}
            </button>

            <button
              onClick={handleBroadcastReminderClick}
              disabled={isBroadcasting}
              className="px-3.5 py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              {isBroadcasting ? (
                <div className="w-3.5 h-3.5 border-2 border-amber-800 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Bell className="w-3.5 h-3.5" />
              )}
              {isBroadcasting ? "Mengirim..." : "Reminder RPC"}
            </button>

            <button
              onClick={handleResetBibCounter}
              className="bg-rose-50 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-rose-100 transition-colors flex items-center gap-1.5"
              title="Reset urutan nomor BIB Offline ke 0 (001)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset BIB
            </button>

            <button
              onClick={handleDownloadTemplate}
              className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>

            <label className="cursor-pointer bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              Import
              <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImportExcel} />
            </label>

            <button
              onClick={handleExportExcel}
              className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Ekspor
            </button>
          </div>
        </div>

        {/* ROW 2: SEARCH & FILTER TOOLBAR */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, BIB, NIK, No WA, Promo..."
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
              value={filterKategori}
              onChange={(e) => {
                setFilterKategori(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="3K">3K</option>
              <option value="5K">5K</option>
              <option value="10K">10K</option>
              <option value="21K">21K</option>
            </select>

            <select
              value={filterGender}
              onChange={(e) => {
                setFilterGender(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1A73E8] hidden lg:block"
            >
              <option value="Semua">Semua Gender</option>
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>

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
                  onClick={() => handleSort("nomorBIB")}
                >
                  <div className="flex items-center gap-1.5">
                    BIB
                    {sortConfig.key === "nomorBIB" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("namaLengkap")}
                >
                  <div className="flex items-center gap-1.5">
                    Peserta
                    {sortConfig.key === "namaLengkap" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("jarak")}
                >
                  <div className="flex items-center gap-1.5">
                    Kategori & Jersey
                    {sortConfig.key === "jarak" ? (
                      <span className="text-[#1A73E8] font-bold text-xs">{sortConfig.direction === "asc" ? "▲" : "▼"}</span>
                    ) : (
                      <span className="text-slate-300 text-xs">↕</span>
                    )}
                  </div>
                </th>
                <th
                  className="px-4 py-3.5 font-bold cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  onClick={() => handleSort("totalTagihan")}
                >
                  <div className="flex items-center gap-1.5">
                    Tagihan
                    {sortConfig.key === "totalTagihan" ? (
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
                  <td colSpan={7} className="p-16 text-center text-slate-400 font-medium text-sm bg-slate-50">
                    <Search className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    {searchQuery
                      ? `Tidak ditemukan peserta dengan kata kunci "${searchQuery}".`
                      : "Belum ada data peserta yang sesuai."}
                  </td>
                </tr>
              ) : (
                paginatedData.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(p.id) ? "bg-blue-50/50" : ""}`}
                  >
                    <td className="px-4 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="w-4 h-4 cursor-pointer accent-[#1A73E8]"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-black text-xs text-[#1A73E8] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
                        {p.nomorBIB || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-slate-900 text-sm">{p.namaLengkap}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{p.noWA} • {p.email}</p>
                      {p.komunitas && p.komunitas !== "-" && (
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                          {p.komunitas}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-800 text-white">
                          {p.jarak}
                        </span>
                        {p.upgradeRequest && (
                          <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200">
                            Upgrade: {p.upgradeRequest.newKategori}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Jersey: <span className="font-bold text-slate-700">{p.ukuranJersey || "-"}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      {p.upgradeRequest ? (
                        <div>
                          <p className="font-bold text-purple-700 text-sm">
                            Rp {((p.totalTagihan || 0) + (p.upgradeRequest.selisih || 0)).toLocaleString("id-ID")}
                          </p>
                          <p className="text-[9px] text-purple-500 uppercase tracking-wider font-bold">Tagihan Upgrade</p>
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            Rp {p.totalTagihan?.toLocaleString("id-ID")}
                          </p>
                          <div className="flex flex-col items-start gap-1 mt-1">
                            {Boolean(p.isUndanganKhusus || p.tipePeserta === "Undangan Khusus") && (
                              <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Undangan Khusus
                              </span>
                            )}
                            {p.kodePromoDipakai && (
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase">
                                Promo: {p.kodePromoDipakai}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${
                          p.statusPembayaran === "Lunas"
                            ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20"
                            : p.statusPembayaran === "Pending"
                            ? "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20"
                            : "bg-[#FCE8E6] text-[#D93025] border-[#D93025]/20"
                        }`}
                      >
                        {p.statusPembayaran}
                      </span>

                      {p.buktiBayarUrl && (
                        <button
                          onClick={() => setSelectedImage(p.buktiBayarUrl)}
                          className="mt-1.5 text-[10px] font-bold text-[#1A73E8] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-2 py-1 rounded transition-colors border border-blue-100 flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> Cek Struk
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setDetailParticipant(p)}
                        className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
                      >
                        Detail &rarr;
                      </button>
                    </td>
                  </tr>
                ))
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
              <div className="flex flex-col items-end gap-1">
                <span
                  className={`px-3 py-1 text-[10px] uppercase tracking-wider font-black rounded-full border ${detailParticipant.statusPembayaran === "Lunas" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20" : "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20"}`}
                >
                  {detailParticipant.statusPembayaran}
                </span>
                {Boolean(detailParticipant.isUndanganKhusus || detailParticipant.tipePeserta === "Undangan Khusus") && (
                  <span className="px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    Undangan Khusus
                  </span>
                )}
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

                {/* --- KONTAK DARURAT --- */}
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                    Kontak Darurat
                  </h3>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm bg-rose-50/50 p-4 rounded-2xl border border-rose-100/60">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Nama Kontak Darurat
                      </p>
                      <p className="font-semibold text-slate-800">
                        {detailParticipant.namaDarurat || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        Hubungan
                      </p>
                      <p className="font-semibold text-slate-800">
                        {detailParticipant.hubunganDarurat || "-"}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">
                        No. Telepon / WA Darurat
                      </p>
                      <p className="font-bold text-rose-600 font-mono">
                        {detailParticipant.waDarurat || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- DOMISILI & REGISTRASI --- */}
                {(detailParticipant.alamat || detailParticipant.kota || detailParticipant.noPendaftaran) && (
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                      Domisili & Registrasi
                    </h3>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      {detailParticipant.noPendaftaran && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            No. Pendaftaran (Mitra)
                          </p>
                          <p className="font-mono font-bold text-slate-700">
                            {detailParticipant.noPendaftaran}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          Kota / Kabupaten
                        </p>
                        <p className="font-medium text-slate-800">
                          {detailParticipant.kota || "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">
                          Kewarganegaraan
                        </p>
                        <p className="font-medium text-slate-800">
                          {detailParticipant.negara || detailParticipant.kewarganegaraan || "Indonesia"}
                        </p>
                      </div>
                      {detailParticipant.alamat && (
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Alamat Lengkap
                          </p>
                          <p className="font-medium text-slate-800">
                            {detailParticipant.alamat}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                  {detailParticipant.upgradeRequest && (
                    <div className="mb-3 text-left text-xs space-y-1.5 border-b border-blue-200/50 pb-3">
                      <div className="flex justify-between text-purple-700 font-bold">
                        <span>REQUEST UPGRADE TIKET</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Upgrade Ke:</span>
                        <span className="font-bold text-purple-600">{detailParticipant.upgradeRequest.newKategori}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium mt-2 pt-2 border-t border-blue-100">
                        <span>Tagihan Lama (Sudah Dibayar):</span>
                        <span>Rp {detailParticipant.totalTagihan?.toLocaleString("id-ID")}</span>
                      </div>
                      <div className="flex justify-between text-slate-800 font-bold">
                        <span>Kekurangan / Biaya Upgrade:</span>
                        <span>+ Rp {detailParticipant.upgradeRequest.selisih?.toLocaleString("id-ID")}</span>
                      </div>
                    </div>
                  )}

                  {detailParticipant.kodePromoDipakai && (
                    <div className="mb-3 text-left text-xs space-y-1.5 border-b border-blue-200/50 pb-3">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Harga Asli (Sebelum Promo):</span>
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
                      {detailParticipant.upgradeRequest ? "Total Keseluruhan (Baru)" : "Total Dibayar"}
                    </p>
                    <p className="text-2xl font-black">
                      Rp{" "}
                      {detailParticipant.upgradeRequest 
                        ? ((detailParticipant.totalTagihan || 0) + (detailParticipant.upgradeRequest.selisih || 0)).toLocaleString("id-ID")
                        : detailParticipant.totalTagihan?.toLocaleString("id-ID")
                      }
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
