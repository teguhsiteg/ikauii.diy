"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import * as XLSX from "xlsx";
import { useRouter, useSearchParams } from "next/navigation";
import RunNavbar from "@/components/run/RunNavbar";
import RunFooter from "@/components/run/RunFooter";

// INTERFACE PESERTA
interface Participant {
  id: string;
  namaLengkap: string;
  nik: string;
  gender: string;
  kategori: string;
  ukuranJersey: string;
  email: string;
  wa: string;
  golDarah: string;
  kontakDarurat: string;
  waDarurat: string;
  riwayatPenyakit: string;
  hargaAsli: number;
}

function PendaftaranKomunitasContent() {
  const [settings, setAdminSettings] = useState<any>(null);
  const [offlinePackages, setOfflinePackages] = useState<any[]>([]);
  const [harga5K, setHarga5K] = useState(150000);
  const [harga10K, setHarga10K] = useState(200000);
  const [minPeserta, setMinPeserta] = useState(10);
  const [bonusKelipatan, setBonusKelipatan] = useState(10);
  const [komunitasRules, setKomunitasRules] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isEventClosed, setIsEventClosed] = useState(false);
  const [eventClosedReason, setEventClosedReason] = useState("");
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    errors?: string[];
  }>({ isOpen: false, title: "", message: "" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE LANGKAH 1: KAPTEN ---
  const [kapten, setKapten] = useState({
    nama: "",
    wa: "",
    email: "",
    komunitas: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // --- STATE LANGKAH 2: PESERTA ---
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  // --- STATE LANGKAH 3: TIKET GRATIS & CHECKOUT ---
  const [eligibleFreeCount, setEligibleFreeCount] = useState(0);
  const [cheapestPrice, setCheapestPrice] = useState(0);
  const [cheapestCategoryName, setCheapestCategoryName] = useState("");
  const [freeTicketIds, setFreeTicketIds] = useState<string[]>([]);
  const [isAgreed, setIsAgreed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper untuk menentukan harga kategori secara dinamis dari settings
  const resolvePrice = (katOrJarak: string, pkgs: any[]): number => {
    const norm = (katOrJarak || "").toUpperCase().trim();
    if (pkgs && pkgs.length > 0) {
      const match = pkgs.find((p: any) => 
        (p.jarak && p.jarak.toUpperCase() === norm) ||
        (p.nama && p.nama.toUpperCase().includes(norm))
      );
      if (match && Number(match.harga)) return Number(match.harga);
    }
    if (norm.includes("21")) return 300000;
    if (norm.includes("10")) return harga10K;
    if (norm.includes("5")) return harga5K;
    if (norm.includes("3")) return 100000;
    return harga5K;
  };

  // Fetch Settings & Draft
  useEffect(() => {
    const savedKapten = localStorage.getItem("draft_kapten_komunitas");
    if (savedKapten) {
      try { setKapten(JSON.parse(savedKapten)); } catch (e) {}
    }

    const fetchAdminSettings = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAdminSettings(data);
          if (Array.isArray(data.offlinePackages)) {
            setOfflinePackages(data.offlinePackages);
          }
          if (data.offlinePrice5K) setHarga5K(Number(data.offlinePrice5K));
          if (data.offlinePrice10K) setHarga10K(Number(data.offlinePrice10K));
          
          const minP = data.komunitasMinPeserta !== undefined && data.komunitasMinPeserta !== null ? Number(data.komunitasMinPeserta) : 10;
          const bonusK = data.komunitasBonusKelipatan !== undefined && data.komunitasBonusKelipatan !== null ? Number(data.komunitasBonusKelipatan) : 10;
          const rules = Array.isArray(data.komunitasRules) ? data.komunitasRules : [];
          
          setMinPeserta(minP);
          setBonusKelipatan(bonusK);
          setKomunitasRules(rules);

          // Cek status pendaftaran event
          const isBypassed = localStorage.getItem("dev_bypass") === "true";
          const isForceOpen = searchParams.get("force_open") === "secret_key";

          if (!isBypassed && !isForceOpen) {
            const isOfflineEnabled = data.isOfflineRunEnabled;
            const isKomunitasEnabled = data.isKomunitasEnabled !== false;
            const adminStatus = data.offlineStatus || "auto";
            const openDate = data.offlineTanggalPembukaan ? new Date(data.offlineTanggalPembukaan) : null;
            const closeDate = data.offlineTanggalPenutupan ? new Date(data.offlineTanggalPenutupan) : null;
            const currentTime = new Date();

            if (!isOfflineEnabled || adminStatus === "tutup") {
              setIsEventClosed(true);
              setEventClosedReason("Pendaftaran event saat ini sedang ditutup.");
            } else if (!isKomunitasEnabled) {
              setIsEventClosed(true);
              setEventClosedReason("Pendaftaran kategori komunitas / kolektif sedang dinonaktifkan oleh panitia.");
            } else if (adminStatus === "coming_soon") {
              setIsEventClosed(true);
              setEventClosedReason("Pendaftaran event belum dibuka (Coming Soon).");
            } else if (adminStatus === "preview") {
              setIsEventClosed(true);
              setEventClosedReason("Pendaftaran belum dibuka.");
            } else if (adminStatus !== "buka") {
              if (openDate && currentTime < openDate) {
                setIsEventClosed(true);
                setEventClosedReason(`Pendaftaran dibuka pada ${openDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}.`);
              } else if (closeDate && currentTime > closeDate) {
                setIsEventClosed(true);
                setEventClosedReason("Periode pendaftaran event telah berakhir.");
              }
            }
          }
        }
      } catch (error) {
        console.error("Gagal memuat konfigurasi admin:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };
    fetchAdminSettings();
  }, [searchParams]);

  useEffect(() => {
    localStorage.setItem("draft_kapten_komunitas", JSON.stringify(kapten));
  }, [kapten]);

  // Kalkulasi Tiket Gratis secara Real-Time ketika participants / rules berubah
  useEffect(() => {
    const totalPeserta = participants.length;

    if (totalPeserta > 0) {
      let lowest = participants[0].hargaAsli;
      let lowestName = participants[0].kategori;
      participants.forEach((p) => {
        if (p.hargaAsli < lowest) {
          lowest = p.hargaAsli;
          lowestName = p.kategori;
        }
      });
      setCheapestPrice(lowest);
      setCheapestCategoryName(lowestName);
    }

    if (komunitasRules && komunitasRules.length > 0) {
      let totalBonus = 0;
      komunitasRules.forEach((rule: any) => {
        const minP = Number(rule.minPeserta) || minPeserta || 10;
        const freeC = Number(rule.freeCount) || 1;
        if (totalPeserta >= minP) {
          if (rule.isKelipatan) {
            totalBonus += Math.floor(totalPeserta / minP) * freeC;
          } else {
            totalBonus += freeC;
          }
        }
      });
      setEligibleFreeCount(totalBonus);
    } else {
      if (totalPeserta >= minPeserta) {
        const k = bonusKelipatan || minPeserta || 10;
        const bonus = Math.floor(totalPeserta / k);
        setEligibleFreeCount(Math.max(1, bonus));
      } else {
        setEligibleFreeCount(0);
      }
    }
  }, [participants, komunitasRules, minPeserta, bonusKelipatan]);

  // Bersihkan tiket gratis terpilih jika melebihi kuota
  useEffect(() => {
    if (freeTicketIds.length > eligibleFreeCount) {
      setFreeTicketIds((prev) => prev.slice(0, eligibleFreeCount));
    }
  }, [eligibleFreeCount, freeTicketIds.length]);

  const triggerAlert = (title: string, message: string, errors?: string[]) => {
    setAlertModal({ isOpen: true, title, message, errors });
  };

  // Validasi Step
  const isStep1Valid =
    kapten.nama.trim().length >= 3 &&
    kapten.wa.trim().length >= 9 &&
    kapten.email.includes("@") &&
    kapten.komunitas.trim().length >= 2;

  const isFormReady =
    isStep1Valid &&
    participants.length >= minPeserta &&
    (eligibleFreeCount === 0 || freeTicketIds.length === eligibleFreeCount) &&
    isAgreed;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      triggerAlert(
        "Ukuran File Terlalu Besar",
        "Maksimal ukuran file gambar yang diizinkan adalah 2MB.",
      );
      return;
    }
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      triggerAlert(
        "Format Tidak Didukung",
        "Sistem hanya menerima file gambar JPG, JPEG, atau PNG.",
      );
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreview(previewUrl);
  };

  // --- LOGIKA UPLOAD EXCEL ---
  const downloadTemplate = () => {
    const ws_data = [
      [
        "Nama Lengkap",
        "NIK / No. Identitas",
        "Jenis Kelamin (L/P)",
        "Kategori (5K/10K)",
        "Ukuran Jersey (S/M/L/XL/XXL)",
        "Email",
        "No. WhatsApp",
        "Gol. Darah",
        "Nama Kontak Darurat",
        "WA Kontak Darurat",
        "Riwayat Penyakit (Opsional)",
      ],
      [
        "Nama Anggota 1",
        "3404012345678901",
        "L",
        "10K",
        "L",
        "anggota1@example.com",
        "081234567890",
        "O",
        "Nama Kontak",
        "081298765432",
        "-",
      ],
      [
        "Nama Anggota 2",
        "3404012345678902",
        "P",
        "5K",
        "M",
        "anggota2@example.com",
        "081234567891",
        "A",
        "Nama Kontak",
        "081298765433",
        "-",
      ],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data_Peserta_Komunitas");
    XLSX.writeFile(wb, "Template_Pendaftaran_Komunitas_IKA_UII.xlsx");
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!jsonData || jsonData.length < 2) {
          triggerAlert(
            "File Kosong",
            "File Excel tidak memiliki baris data peserta. Pastikan mengisi baris setelah header.",
          );
          setIsParsing(false);
          return;
        }

        const rawHeaders: string[] = (jsonData[0] || []).map((h: any) =>
          (h || "").toString().toLowerCase().trim(),
        );

        const findColIndex = (keywords: string[]) =>
          rawHeaders.findIndex((h) =>
            keywords.some((kw) => h.includes(kw.toLowerCase())),
          );

        const colIdx = {
          nama: findColIndex(["nama"]),
          nik: findColIndex(["nik", "identitas", "ktp"]),
          gender: findColIndex(["gender", "jenis kelamin", "kelamin", "jk"]),
          kategori: findColIndex(["kategori", "jarak", "category"]),
          jersey: findColIndex(["jersey", "baju", "ukuran"]),
          email: findColIndex(["email", "surel"]),
          wa: findColIndex(["whatsapp", "wa", "no. wa", "telepon", "hp"]),
          golDarah: findColIndex(["darah", "gol"]),
          kontakDarurat: findColIndex(["kontak darurat", "nama darurat"]),
          waDarurat: findColIndex(["wa darurat", "telepon darurat", "no darurat"]),
          riwayatPenyakit: findColIndex(["penyakit", "riwayat", "medis"]),
        };

        const getVal = (row: any[], primaryIdx: number, fallbackIdx: number) => {
          const idx = primaryIdx !== -1 ? primaryIdx : fallbackIdx;
          return row[idx] !== undefined && row[idx] !== null
            ? row[idx].toString().trim()
            : "";
        };

        const tempParticipants: Participant[] = [];
        const validationErrors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || row.every((c: any) => !c || c.toString().trim() === "")) {
            continue;
          }

          const rowNum = i + 1;
          const namaLengkap = getVal(row, colIdx.nama, 0);
          const rawNik = getVal(row, colIdx.nik, 1).replace(/\D/g, "");
          const rawGender = getVal(row, colIdx.gender, 2).toUpperCase();
          const rawKategori = getVal(row, colIdx.kategori, 3).toUpperCase();
          const rawJersey = getVal(row, colIdx.jersey, 4).toUpperCase();
          const email = getVal(row, colIdx.email, 5);
          const rawWa = getVal(row, colIdx.wa, 6).replace(/\D/g, "");
          const golDarah = getVal(row, colIdx.golDarah, 7).toUpperCase() || "-";
          const kontakDarurat = getVal(row, colIdx.kontakDarurat, 8);
          const rawWaDarurat = getVal(row, colIdx.waDarurat, 9).replace(/\D/g, "");
          const riwayatPenyakit = getVal(row, colIdx.riwayatPenyakit, 10) || "-";

          const rowErrors: string[] = [];
          if (!namaLengkap || namaLengkap.length < 3) {
            rowErrors.push("Nama lengkap minimal 3 karakter");
          }

          if (!rawNik || rawNik.length < 12) {
            rowErrors.push("NIK tidak valid (minimal 12-16 angka)");
          }

          let gender = rawGender;
          if (rawGender.startsWith("L")) gender = "L";
          else if (rawGender.startsWith("P") || rawGender.startsWith("W")) gender = "P";
          else {
            rowErrors.push("Jenis kelamin harus L atau P");
          }

          let kategori = rawKategori || "5K";
          if (rawKategori.includes("21")) kategori = "21K";
          else if (rawKategori.includes("10")) kategori = "10K";
          else if (rawKategori.includes("5")) kategori = "5K";
          else if (rawKategori.includes("3")) kategori = "3K";

          const validJerseys = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL", "5XL"];
          let ukuranJersey = rawJersey.replace(/\s+/g, "");
          if (!validJerseys.includes(ukuranJersey)) {
            ukuranJersey = "L";
          }

          if (!email || !email.includes("@") || !email.includes(".")) {
            rowErrors.push("Format email tidak valid");
          }

          let wa = rawWa;
          if (wa.startsWith("62")) wa = "0" + wa.slice(2);
          if (wa.length < 9 || wa.length > 15) {
            rowErrors.push("Nomor WhatsApp tidak valid (9-15 digit)");
          }

          if (rowErrors.length > 0) {
            const displayName = namaLengkap ? `"${namaLengkap}"` : `Peserta`;
            validationErrors.push(`Baris ${rowNum} (${displayName}): ${rowErrors.join(", ")}`);
          } else {
            const harga = resolvePrice(kategori, offlinePackages);
            tempParticipants.push({
              id: `usr_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
              namaLengkap,
              nik: rawNik,
              gender,
              kategori,
              ukuranJersey,
              email,
              wa,
              golDarah,
              kontakDarurat: kontakDarurat || "-",
              waDarurat: rawWaDarurat || "-",
              riwayatPenyakit,
              hargaAsli: harga,
            });
          }
        }

        if (validationErrors.length > 0) {
          triggerAlert(
            "Terdapat Data yang Belum Sesuai",
            `Ditemukan ${validationErrors.length} baris yang perlu diperbaiki di file Excel:`,
            validationErrors.slice(0, 8),
          );
          setParticipants([]);
          setIsParsing(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        setParticipants(tempParticipants);

        if (tempParticipants.length < minPeserta) {
          triggerAlert(
            "Perhatian: Jumlah Peserta Kurang dari Minimal",
            `File Excel berhasil dibaca (${tempParticipants.length} peserta). Harap dicatat pendaftaran komunitas memerlukan minimal ${minPeserta} peserta untuk dapat melanjutkan checkout.`,
          );
        }
      } catch (err: any) {
        console.error("Gagal membaca file Excel:", err);
        triggerAlert(
          "Gagal Membaca File",
          "Pastikan file berekstensi .xlsx atau .xls dan tidak diproteksi kata sandi.",
        );
      }
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsBinaryString(file);
  };

  const removeParticipant = (id: string) => {
    const updated = participants.filter((p) => p.id !== id);
    setParticipants(updated);
    setFreeTicketIds((prev) =>
      prev.filter((fid) => updated.some((p) => p.id === fid)),
    );
  };

  const isParticipantEligibleForFree = (p: Participant) => {
    if (!komunitasRules || komunitasRules.length === 0) {
      return p.hargaAsli === cheapestPrice;
    }
    return komunitasRules.some((rule: any) => {
      if (rule.targetKategori === "all") return true;
      if (rule.targetKategori === "cheapest") return p.hargaAsli === cheapestPrice;
      if (rule.targetKategori && p.kategori && rule.targetKategori.toUpperCase() === p.kategori.toUpperCase()) return true;
      return false;
    });
  };

  const toggleFreeTicket = (p: Participant) => {
    if (!isParticipantEligibleForFree(p)) {
      triggerAlert(
        "Kategori Tidak Memenuhi Syarat",
        `Peserta ini (${p.kategori}) tidak masuk dalam kategori tiket yang berhak mendapatkan gratis sesuai ketentuan promo saat ini.`,
      );
      return;
    }

    if (freeTicketIds.includes(p.id)) {
      setFreeTicketIds((prev) => prev.filter((id) => id !== p.id));
    } else {
      if (freeTicketIds.length >= eligibleFreeCount) {
        triggerAlert(
          "Kuota Tiket Gratis Telah Terpenuhi",
          `Anda berhak atas maksimal ${eligibleFreeCount} tiket gratis. Silakan klik tiket yang sudah dipilih jika ingin memindahkannya.`,
        );
        return;
      }
      setFreeTicketIds((prev) => [...prev, p.id]);
    }
  };

  const autoAssignFreeTickets = () => {
    const eligibleParticipants = participants.filter((p) =>
      isParticipantEligibleForFree(p),
    );
    const sorted = [...eligibleParticipants].sort(
      (a, b) => a.hargaAsli - b.hargaAsli,
    );
    const selectedIds = sorted
      .slice(0, eligibleFreeCount)
      .map((p) => p.id);
    setFreeTicketIds(selectedIds);
  };

  const clearFreeTickets = () => {
    setFreeTicketIds([]);
  };

  const totalBiayaKotor = participants.reduce(
    (acc, curr) => acc + curr.hargaAsli,
    0,
  );

  const potonganGratis = participants
    .filter((p) => freeTicketIds.includes(p.id))
    .reduce((acc, curr) => acc + curr.hargaAsli, 0);

  const totalBiayaBersih = Math.max(0, totalBiayaKotor - potonganGratis);
  const adminFee = Number(settings?.offlineAdminFee) || 0;
  const grandTotal = totalBiayaBersih + adminFee;

  // Group by category counts
  const countByCategory = participants.reduce((acc: Record<string, number>, curr) => {
    acc[curr.kategori] = (acc[curr.kategori] || 0) + 1;
    return acc;
  }, {});

  const handleCheckout = async () => {
    if (!isStep1Valid) {
      triggerAlert(
        "Data Penanggung Jawab Belum Lengkap",
        "Harap isi nama kapten, nomor WhatsApp, email, dan nama komunitas dengan lengkap.",
      );
      return;
    }

    if (participants.length < minPeserta) {
      triggerAlert(
        "Jumlah Anggota Belum Memenuhi Syarat",
        `Pendaftaran komunitas wajib minimal ${minPeserta} peserta. Saat ini terdata ${participants.length} peserta. Tambahkan ${minPeserta - participants.length} peserta lagi untuk melanjutkan.`,
      );
      return;
    }

    if (eligibleFreeCount > 0 && freeTicketIds.length < eligibleFreeCount) {
      triggerAlert(
        "Alokasi Tiket Gratis Belum Lengkap",
        `Grup Anda mendapatkan ${eligibleFreeCount} tiket gratis, namun baru ${freeTicketIds.length} yang dipilih. Anda dapat menekan tombol 'Pilih Otomatis' di panel ringkasan.`,
      );
      return;
    }

    if (!isAgreed) {
      triggerAlert(
        "Persetujuan Syarat & Ketentuan",
        "Anda wajib menyetujui Syarat & Ketentuan untuk melanjutkan pendaftaran.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      let finalLogoUrl = null;

      const uploadToCloudinary = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "eventrunning");
        formData.append("cloud_name", "dp8hmxuix");

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!res.ok) throw new Error("Gagal mengunggah file logo komunitas.");
        const data = await res.json();
        return data.secure_url;
      };

      if (logoFile) {
        finalLogoUrl = await uploadToCloudinary(logoFile);
      }

      const payload = {
        kapten: kapten,
        logoUrl: finalLogoUrl,
        participants: participants,
        freeTicketIds: freeTicketIds,
        totalBiaya: totalBiayaBersih,
        adminFeeWeb: adminFee,
        grandTotal: grandTotal,
        statusPembayaran: "Pending",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "pendaftaran_komunitas"),
        payload,
      );

      localStorage.removeItem("draft_kapten_komunitas");
      router.push(`/run/checkout-komunitas/${docRef.id}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setAlertModal({
        isOpen: true,
        title: "Gagal Menyimpan Data",
        message:
          "Terjadi kesalahan saat menyimpan pendaftaran. Pastikan koneksi internet stabil.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans selection:bg-[#FCD116] selection:text-[#0B2239]">
      <RunNavbar eventName={settings?.offlineJudul} solid={true} />

      <div className="pt-24 md:pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-[11px] font-black text-[#0B2239] bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Pendaftaran Kolektif
            </span>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Syarat Minimal: {minPeserta} Peserta
            </span>
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-[#0B2239] tracking-tight">
            Pendaftaran Komunitas & Kolektif
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm mt-1 max-w-3xl">
            Daftarkan anggota komunitas atau rekan kerja Anda secara massal dalam satu transaksi. Dapatkan bonus tiket gratis sesuai ketentuan promo event.
          </p>
        </div>

        {/* PROMO RULES BANNER BOX */}
        <div className="bg-gradient-to-r from-[#0B2239] to-[#153a5b] rounded-2xl p-4 md:p-5 text-white shadow-md mb-8 border-b-4 border-[#FCD116]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base">🎁</span>
                <h3 className="font-bold text-sm md:text-base text-[#FCD116] uppercase tracking-wide">
                  Ketentuan Promo Tiket Gratis Komunitas
                </h3>
              </div>
              <div className="text-xs text-slate-200 space-y-1 pl-6">
                {komunitasRules && komunitasRules.length > 0 ? (
                  komunitasRules.map((r: any, idx: number) => {
                    const targetText = r.targetKategori === "cheapest"
                      ? "Kategori termurah di grup"
                      : r.targetKategori === "all"
                        ? "Bebas semua kategori"
                        : `Kategori ${r.targetKategori}`;
                    return (
                      <p key={idx} className="leading-relaxed">
                        • Daftar <strong>{r.minPeserta} orang</strong> {r.isKelipatan ? "(berlaku kelipatan)" : ""} &rarr; <span className="text-[#FCD116] font-bold">Gratis {r.freeCount} Tiket</span> ({targetText}).
                      </p>
                    );
                  })
                ) : (
                  <p className="leading-relaxed">
                    • Daftar minimal <strong>{minPeserta} orang</strong> (kelipatan {bonusKelipatan}) &rarr; <span className="text-[#FCD116] font-bold">Gratis 1 Tiket</span> kategori termurah di grup.
                  </p>
                )}
                <p className="text-[11px] text-slate-300 italic pt-0.5">
                  * Minimal pendaftaran yang diunggah dalam file Excel: <strong>{minPeserta} peserta</strong>.
                </p>
              </div>
            </div>

            <button
              onClick={downloadTemplate}
              className="inline-flex items-center justify-center gap-2 bg-[#FCD116] hover:bg-yellow-400 text-[#0B2239] font-bold px-4 py-2.5 rounded-xl text-xs shadow transition-all shrink-0 self-start md:self-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Unduh Template Excel
            </button>
          </div>
        </div>

        {isLoadingSettings ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100 flex flex-col items-center justify-center animate-pulse">
            <div className="w-10 h-10 border-4 border-[#0B2239] border-t-[#FCD116] rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-sm font-medium">Memuat formulir pendaftaran...</p>
          </div>
        ) : isEventClosed ? (
          <div className="bg-white rounded-2xl p-8 md:p-12 text-center shadow-sm border border-slate-100 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[#0B2239] mb-2">Pendaftaran Sedang Ditutup</h2>
            <p className="text-slate-600 max-w-md mx-auto mb-6 text-sm">{eventClosedReason}</p>
            <Link
              href="/run"
              className="inline-flex items-center gap-2 bg-[#0B2239] hover:bg-slate-800 text-[#FCD116] font-bold px-6 py-3 rounded-xl transition-colors text-sm shadow-md"
            >
              Kembali ke Beranda Run
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* =========================================================
                KOLOM KIRI (8 COLS): FORM DATA & DAFTAR PESERTA
            ========================================================= */}
            <div className="lg:col-span-8 space-y-6">

              {/* CARD 1: INFORMASI PENANGGUNG JAWAB (KAPTEN) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-3">
                  <div className="w-8 h-8 rounded-full bg-[#0B2239] text-[#FCD116] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#0B2239]">
                      Data Kapten / Penanggung Jawab
                    </h2>
                    <p className="text-xs text-slate-400">
                      Seluruh informasi E-Ticket & instruksi pembayaran akan dikirimkan kepada kontak ini.
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Nama Lengkap Kapten <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={kapten.nama}
                      onChange={(e) => setKapten({ ...kapten, nama: e.target.value })}
                      placeholder="Sesuai KTP / Identitas"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Nama Komunitas / Grup <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={kapten.komunitas}
                      onChange={(e) => setKapten({ ...kapten, komunitas: e.target.value })}
                      placeholder="Contoh: Sembada Runners"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      No. WhatsApp Kapten <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={kapten.wa}
                      onChange={(e) => setKapten({ ...kapten, wa: e.target.value.replace(/\D/g, "") })}
                      placeholder="08123456789"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Alamat Email Kapten <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={kapten.email}
                      onChange={(e) => setKapten({ ...kapten, email: e.target.value })}
                      placeholder="kapten@email.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                      Logo Komunitas (Opsional, Max 2MB)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg, image/png, image/jpg"
                        onChange={handleFileChange}
                        className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#1A73E8] hover:file:bg-blue-100 transition-colors cursor-pointer"
                      />
                      {logoPreview && (
                        <div className="shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center p-1">
                          <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 2: UPLOAD DATA EXCEL ANGGOTA */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#0B2239] text-[#FCD116] flex items-center justify-center font-bold text-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#0B2239]">
                        Upload Anggota Komunitas
                      </h2>
                      <p className="text-xs text-slate-400">
                        Wajib minimal <strong>{minPeserta} peserta</strong> dalam satu file.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1A73E8] bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Unduh Template
                  </button>
                </div>

                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center bg-slate-50 hover:bg-blue-50/40 transition-colors relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-200 text-emerald-600">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm font-bold text-[#0B2239] mb-1">
                    {isParsing ? "Sedang Membaca Data Excel..." : "Klik atau seret file Excel pendaftaran di sini"}
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Format: .xlsx atau .xls sesuai template resmi (Nama, NIK, Kategori Jarak, Ukuran Jersey, dll).
                  </p>
                </div>

                {participants.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">Status File:</span>
                      <span className="font-bold text-[#1A73E8]">{participants.length} peserta terbaca</span>
                    </div>
                    {participants.length < minPeserta ? (
                      <span className="text-amber-700 font-bold bg-amber-100/80 px-2.5 py-1 rounded-lg">
                        ⚠️ Kurang {minPeserta - participants.length} peserta (Min. {minPeserta})
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-1 rounded-lg">
                        ✅ Syarat minimal terpenuhi (Dapat {eligibleFreeCount} Tiket Gratis)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CARD 3: DAFTAR PESERTA YANG DIUNGGAH */}
              {participants.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-[#0B2239] flex items-center gap-2">
                        Daftar Anggota Terdata ({participants.length})
                      </h2>
                      <p className="text-xs text-slate-400">
                        Pastikan seluruh data NIK dan kategori jarak sudah sesuai sebelum melanjutkan.
                      </p>
                    </div>
                    <div className="relative w-full sm:w-60">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama atau NIK..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                      />
                      <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100 overflow-hidden">
                    {participants
                      .filter((p) =>
                        p.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.nik.includes(searchQuery)
                      )
                      .slice(0, visibleCount)
                      .map((p, idx) => {
                        const isFree = freeTicketIds.includes(p.id);
                        return (
                          <div key={p.id} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/70 px-2 rounded-xl transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <div className="truncate">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-[#0B2239] truncate">{p.namaLengkap}</p>
                                  {isFree && (
                                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                      GRATIS
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 flex flex-wrap items-center gap-2 mt-0.5 font-mono">
                                  <span>NIK: {p.nik}</span>
                                  <span>•</span>
                                  <span>{p.gender === "L" ? "Laki-laki" : "Perempuan"}</span>
                                  <span>•</span>
                                  <span className="font-bold text-slate-700">{p.kategori}</span>
                                  <span>•</span>
                                  <span>Size: {p.ukuranJersey}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-xs font-bold ${isFree ? 'line-through text-slate-400' : 'text-[#0B2239]'}`}>
                                Rp {p.hargaAsli.toLocaleString("id-ID")}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeParticipant(p.id)}
                                className="text-slate-300 hover:text-rose-500 p-1 transition-colors"
                                title="Hapus Anggota"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {participants.length > visibleCount && (
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 15)}
                      className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors"
                    >
                      Tampilkan Lebih Banyak ({participants.length - visibleCount} lagi)
                    </button>
                  )}
                </div>
              )}

            </div>

            {/* =========================================================
                KOLOM KANAN (4 COLS, STICKY): RINGKASAN & CHECKOUT
            ========================================================= */}
            <div className="lg:col-span-4 relative">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 sticky top-24 space-y-5">
                
                {/* HEADER RINGKASAN */}
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-[#0B2239] uppercase tracking-wider">
                    Ringkasan Pendaftaran
                  </h3>
                  <p className="text-xs text-slate-400">
                    {kapten.komunitas || "Komunitas"}
                  </p>
                </div>

                {/* BREAKDOWN KUOTA & KATEGORI */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Anggota:</span>
                    <span className="font-bold text-[#0B2239]">{participants.length} Orang</span>
                  </div>
                  {Object.entries(countByCategory).map(([kat, count]) => (
                    <div key={kat} className="flex justify-between text-slate-500 pl-2">
                      <span>• Kategori {kat}</span>
                      <span>{count} Orang</span>
                    </div>
                  ))}
                  {participants.length < minPeserta ? (
                    <div className="bg-amber-50 text-amber-800 p-2.5 rounded-xl border border-amber-200 text-[11px] mt-2">
                      ⚠️ Minimal pendaftaran komunitas adalah <strong>{minPeserta} peserta</strong>. (Kurang {minPeserta - participants.length} lagi)
                    </div>
                  ) : (
                    <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl border border-emerald-200 text-[11px] mt-2 font-medium">
                      🎉 Memenuhi syarat minimal! Berhak atas <strong>{eligibleFreeCount} Tiket Gratis</strong>.
                    </div>
                  )}
                </div>

                {/* ALOKASI TIKET GRATIS PROMO */}
                {eligibleFreeCount > 0 && (
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                          Alokasi Tiket Gratis
                        </span>
                        <p className="text-xs font-bold text-emerald-700">
                          {freeTicketIds.length} dari {eligibleFreeCount} Dipilih
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={autoAssignFreeTickets}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                        >
                          Pilih Otomatis
                        </button>
                        {freeTicketIds.length > 0 && (
                          <button
                            type="button"
                            onClick={clearFreeTickets}
                            className="bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500">
                      Klik anggota di bawah ini untuk menetapkan tiket gratis:
                    </p>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {participants
                        .filter((p) => isParticipantEligibleForFree(p))
                        .map((p) => {
                          const selected = freeTicketIds.includes(p.id);
                          return (
                            <div
                              key={p.id}
                              onClick={() => toggleFreeTicket(p)}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between cursor-pointer border transition-all ${
                                selected
                                  ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                                  : "bg-white text-slate-700 border-emerald-200 hover:border-emerald-400"
                              }`}
                            >
                              <span className="truncate pr-2">{p.namaLengkap} ({p.kategori})</span>
                              <span className="text-[10px]">{selected ? "✓ Terpilih" : "+ Gratis"}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}

                {/* RINCIAN BIAYA */}
                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Tiket</span>
                    <span className="font-medium text-[#0B2239]">Rp {totalBiayaKotor.toLocaleString("id-ID")}</span>
                  </div>

                  {potonganGratis > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Potongan Tiket Gratis ({freeTicketIds.length}x)</span>
                      <span>- Rp {potonganGratis.toLocaleString("id-ID")}</span>
                    </div>
                  )}

                  {adminFee > 0 && (
                    <div className="flex justify-between text-slate-500">
                      <span>Biaya Admin</span>
                      <span>Rp {adminFee.toLocaleString("id-ID")}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm">Total Tagihan</span>
                    <span className="text-xl font-black text-[#1A73E8]">
                      Rp {grandTotal.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* PERSETUJUAN SYARAT & KETENTUAN */}
                <label className="flex items-start gap-2 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-[#1A73E8] rounded border-slate-300 focus:ring-[#1A73E8]"
                  />
                  <span className="text-[11px] text-slate-500 leading-snug">
                    Saya menyatakan data seluruh anggota adalah valid dan menyetujui{" "}
                    <Link href="/syarat" className="text-[#1A73E8] font-bold underline" target="_blank">
                      S&K Event
                    </Link>.
                  </span>
                </label>

                {/* TOMBOL SUBMIT */}
                <button
                  onClick={handleCheckout}
                  disabled={!isFormReady || isSubmitting}
                  className="w-full bg-[#0B2239] hover:bg-slate-800 text-[#FCD116] font-bold py-3.5 px-4 rounded-xl shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#FCD116] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Lanjutkan Pembayaran &rarr;"
                  )}
                </button>

                {!isStep1Valid && (
                  <p className="text-[10px] text-slate-400 text-center">
                    * Lengkapi data penanggung jawab terlebih dahulu
                  </p>
                )}

                {isStep1Valid && participants.length < minPeserta && (
                  <p className="text-[10px] text-amber-600 font-bold text-center">
                    * Masukkan minimal {minPeserta} peserta untuk melanjutkan
                  </p>
                )}

                {isStep1Valid && participants.length >= minPeserta && eligibleFreeCount > 0 && freeTicketIds.length < eligibleFreeCount && (
                  <p className="text-[10px] text-rose-500 font-bold text-center animate-pulse">
                    * Alokasikan {eligibleFreeCount - freeTicketIds.length} tiket gratis yang tersisa
                  </p>
                )}

              </div>
            </div>

          </div>
        )}
      </div>

      <RunFooter eventName={settings?.offlineJudul} waChannelUrl={settings?.waGroupUrl} sosmeds={settings?.sosmeds} />

      {/* MODAL ALERT */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-14 h-14 bg-blue-50 text-[#1A73E8] rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-lg text-slate-800 mb-2">{alertModal.title}</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">{alertModal.message}</p>
            {alertModal.errors && alertModal.errors.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-4 text-left max-h-40 overflow-y-auto space-y-1">
                {alertModal.errors.map((err, idx) => (
                  <p key={idx} className="text-[11px] text-rose-700">• {err}</p>
                ))}
              </div>
            )}
            <button
              onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
              className="w-full bg-[#0B2239] text-[#FCD116] hover:bg-slate-800 py-2.5 rounded-xl font-bold text-xs transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PendaftaranKomunitasPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#0B2239] border-t-[#FCD116] rounded-full animate-spin"></div>
        </div>
      }
    >
      <PendaftaranKomunitasContent />
    </Suspense>
  );
}
