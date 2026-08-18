"use client";

import { useState, useRef, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

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

export default function PendaftaranKomunitasPage() {
  const [adminSettings, setAdminSettings] = useState<any>(null);
  const [harga5K, setHarga5K] = useState(150000);
  const [harga10K, setHarga10K] = useState(200000);
  const router = useRouter();

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
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
  const [ktpFile, setKtpFile] = useState<File | null>(null);

  // --- STATE LANGKAH 2: PESERTA ---
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [openAccordionId, setOpenAccordionId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  // --- STATE LANGKAH 3: TIKET GRATIS & CHECKOUT ---
  const [eligibleFreeCount, setEligibleFreeCount] = useState(0);
  const [cheapestPrice, setCheapestPrice] = useState(0);
  const [cheapestCategoryName, setCheapestCategoryName] = useState("");
  const [freeTicketIds, setFreeTicketIds] = useState<string[]>([]);
  const [isAgreed, setIsAgreed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch Settings & Draft
  useEffect(() => {
    const savedKapten = localStorage.getItem("draft_kapten_komunitas");
    if (savedKapten) setKapten(JSON.parse(savedKapten));

    const fetchAdminSettings = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setAdminSettings(data);
          if (data.offlinePrice5K) setHarga5K(Number(data.offlinePrice5K));
          if (data.offlinePrice10K) setHarga10K(Number(data.offlinePrice10K));
        }
      } catch (error) {
        console.error("Gagal memuat konfigurasi admin:", error);
      }
    };
    fetchAdminSettings();
  }, []);

  useEffect(() => {
    localStorage.setItem("draft_kapten_komunitas", JSON.stringify(kapten));
  }, [kapten]);

  const triggerAlert = (title: string, message: string) => {
    setAlertModal({ isOpen: true, title, message });
  };

  // Validasi Step
  const isStep1Valid =
    kapten.nama.length > 3 &&
    kapten.wa.length > 9 &&
    kapten.email.includes("@") &&
    kapten.komunitas.length > 2 &&
    logoFile !== null &&
    ktpFile !== null;

  const isStep3Valid =
    participants.length >= 10 &&
    freeTicketIds.length === eligibleFreeCount &&
    isAgreed;

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "ktp",
  ) => {
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

    if (type === "logo") setLogoFile(file);
    else setKtpFile(file);
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

        let tempParticipants: Participant[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[0]) continue;

          const pKategori = (row[3] || "").toString().toUpperCase().trim();
          let harga = pKategori === "10K" ? harga10K : harga5K;

          tempParticipants.push({
            id: `usr_${Date.now()}_${i}`,
            namaLengkap: (row[0] || "").toString().trim(),
            nik: (row[1] || "").toString().trim(),
            gender: (row[2] || "").toString().toUpperCase().trim(),
            kategori: pKategori,
            ukuranJersey: (row[4] || "").toString().toUpperCase().trim(),
            email: (row[5] || "").toString().trim(),
            wa: (row[6] || "").toString().trim(),
            golDarah: (row[7] || "").toString().toUpperCase().trim(),
            kontakDarurat: (row[8] || "").toString().trim(),
            waDarurat: (row[9] || "").toString().trim(),
            riwayatPenyakit: (row[10] || "-").toString().trim(),
            hargaAsli: harga,
          });
        }

        if (tempParticipants.length < 10) {
          triggerAlert(
            "Peserta Kurang",
            "Pendaftaran Kolektif / Komunitas mewajibkan minimal 10 peserta.",
          );
          setParticipants([]);
        } else {
          setParticipants(tempParticipants);
          kalkulasiTiketGratis(tempParticipants);
        }
      } catch (err) {
        triggerAlert(
          "Gagal Membaca File",
          "Pastikan Anda menggunakan template Excel yang disediakan.",
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
    kalkulasiTiketGratis(updated);
    setFreeTicketIds((prev) =>
      prev.filter((fid) => updated.some((p) => p.id === fid)),
    );
  };

  // --- LOGIKA TIKET GRATIS ---
  const kalkulasiTiketGratis = (peserta: Participant[]) => {
    const totalPeserta = peserta.length;
    const bonus = Math.floor(totalPeserta / 10);
    setEligibleFreeCount(bonus);

    if (peserta.length > 0) {
      let lowest = peserta[0].hargaAsli;
      let lowestName = peserta[0].kategori;
      peserta.forEach((p) => {
        if (p.hargaAsli < lowest) {
          lowest = p.hargaAsli;
          lowestName = p.kategori;
        }
      });
      setCheapestPrice(lowest);
      setCheapestCategoryName(lowestName);
    }
  };

  const toggleFreeTicket = (p: Participant) => {
    if (p.hargaAsli > cheapestPrice) {
      triggerAlert(
        "Kategori Tiket",
        `Tiket gratis hanya berlaku untuk kategori termurah di grup Anda (${cheapestCategoryName} - Rp ${cheapestPrice.toLocaleString("id-ID")}).`,
      );
      return;
    }

    if (freeTicketIds.includes(p.id)) {
      setFreeTicketIds((prev) => prev.filter((id) => id !== p.id));
    } else {
      if (freeTicketIds.length >= eligibleFreeCount) {
        triggerAlert(
          "Kuota Habis",
          `Anda hanya berhak mendapatkan ${eligibleFreeCount} tiket gratis.`,
        );
        return;
      }
      setFreeTicketIds((prev) => [...prev, p.id]);
    }
  };

  const totalBiayaKotor = participants.reduce(
    (acc, curr) => acc + curr.hargaAsli,
    0,
  );
  const potonganGratis = freeTicketIds.length * cheapestPrice;
  const totalBiayaBersih = totalBiayaKotor - potonganGratis;

  // --- 🔥 PERBAIKAN FUNGSI SUBMIT KE CLOUDINARY & FIRESTORE 🔥 ---
  const handleCheckout = async () => {
    if (!isStep3Valid || isSubmitting) return;

    setIsSubmitting(true);
    setAlertModal({
      isOpen: true,
      title: "Memproses Pendaftaran...",
      message: "Mohon tunggu, sedang mengunggah berkas KTP & Logo ke server...",
    });

    try {
      let finalLogoUrl = "";
      let finalKtpUrl = "";

      // 1. Fungsi Upload ke Cloudinary
      const uploadToCloudinary = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "eventrunning"); // Ganti dengan upload preset Anda
        formData.append("cloud_name", "dp8hmxuix"); // Ganti dengan cloud name Anda

        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload",
          {
            method: "POST",
            body: formData,
          },
        );

        if (!res.ok) throw new Error("Gagal mengunggah file gambar.");
        const data = await res.json();
        return data.secure_url;
      };

      // 2. Upload File Berkas
      if (logoFile) finalLogoUrl = await uploadToCloudinary(logoFile);
      if (ktpFile) finalKtpUrl = await uploadToCloudinary(ktpFile);

      // 3. Simpan ke Firestore dengan URL aslinya
      const payload = {
        kapten: kapten,
        logoUrl: finalLogoUrl, // ✅ Menggunakan URL Cloudinary asli
        ktpUrl: finalKtpUrl, // ✅ Menggunakan URL Cloudinary asli
        participants: participants,
        freeTicketIds: freeTicketIds,
        totalBiaya: totalBiayaBersih,
        statusPembayaran: "Pending",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "pendaftaran_komunitas"),
        payload,
      );

      setAlertModal({ isOpen: false, title: "", message: "" });

      // 4. Kirim WA ke Admin
      const waMessage = `Halo Admin IKA UII DIY, saya ${kapten.nama} telah mendaftarkan Komunitas/Grup *${kapten.komunitas}* dengan total ${participants.length} peserta.\n\nMohon petunjuk untuk pembayaran kolektif sebesar *Rp ${totalBiayaBersih.toLocaleString("id-ID")}*.\n\nTerima kasih.`;

      window.open(
        `https://wa.me/${process.env.NEXT_PUBLIC_WA_ADMIN_PHONE || "6285179594146"}?text=${encodeURIComponent(waMessage)}`,
        "_blank",
      );

      // 5. Arahkan ke halaman Invoice / Checkout Komunitas
      router.push(`/run/checkout-komunitas/${docRef.id}`);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      setAlertModal({
        isOpen: true,
        title: "Gagal Menyimpan Data",
        message:
          "Terjadi kesalahan saat mengunggah berkas atau menyimpan pendaftaran. Pastikan koneksi stabil.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans selection:bg-[#FCD116] selection:text-[#0B2239]">
      <NavbarPublic />

      <div className="pt-[120px] md:pt-[160px] pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="text-center mb-10 animate-in slide-in-from-bottom-4 duration-700">
          <span className="text-[10px] font-black text-[#0B2239] bg-white border border-slate-200 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-sm">
            Kategori Kolektif
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-[#0B2239] mb-4 tracking-tight leading-tight">
            Pendaftaran Komunitas
          </h1>
          <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Daftarkan tim Anda! Dapatkan{" "}
            <strong className="text-emerald-500">1 Tiket GRATIS</strong> untuk
            setiap kelipatan 10 peserta yang mendaftar. (Berlaku untuk tiket
            kategori termurah di grup Anda).
          </p>
        </div>

        <div className="space-y-8 animate-in fade-in duration-1000">
          {/* STEP 1: DATA KAPTEN & KOMUNITAS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200">
            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-[#0B2239] text-[#FCD116] rounded-full flex items-center justify-center font-black text-lg shadow-sm">
                1
              </div>
              <div>
                <h2 className="text-xl font-black text-[#0B2239]">
                  Informasi Penanggung Jawab
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Kapten komunitas yang bertanggung jawab penuh.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nama Kapten (Sesuai KTP)
                </label>
                <input
                  type="text"
                  value={kapten.nama}
                  onChange={(e) =>
                    setKapten({ ...kapten, nama: e.target.value })
                  }
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nama Komunitas / Grup
                </label>
                <input
                  type="text"
                  value={kapten.komunitas}
                  onChange={(e) =>
                    setKapten({ ...kapten, komunitas: e.target.value })
                  }
                  placeholder="Contoh: UII Runners"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nomor WhatsApp Aktif
                </label>
                <input
                  type="text"
                  value={kapten.wa}
                  onChange={(e) =>
                    setKapten({
                      ...kapten,
                      wa: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="08123456789"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Alamat Email
                </label>
                <input
                  type="email"
                  value={kapten.email}
                  onChange={(e) =>
                    setKapten({ ...kapten, email: e.target.value })
                  }
                  placeholder="kapten@email.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A73E8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Upload KTP Kapten (Max 2MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg"
                  onChange={(e) => handleFileChange(e, "ktp")}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-[#1A73E8] hover:file:bg-blue-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Upload Logo Komunitas (Max 2MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg, image/png, image/jpg"
                  onChange={(e) => handleFileChange(e, "logo")}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-600 hover:file:bg-purple-100 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* STEP 2: DATA PESERTA */}
          <div
            className={`bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 transition-all duration-500 ${!isStep1Valid ? "opacity-50 pointer-events-none grayscale-[50%]" : ""}`}
          >
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[#0B2239] text-[#FCD116] rounded-full flex items-center justify-center font-black text-lg shadow-sm">
                  2
                </div>
                <div>
                  <h2 className="text-xl font-black text-[#0B2239]">
                    Daftar Peserta Komunitas
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Minimal pendaftaran 10 orang.
                  </p>
                </div>
              </div>
              <span className="bg-blue-50 text-[#1A73E8] px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100">
                Total: {participants.length} Peserta
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center mb-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <svg
                  className="w-8 h-8 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="font-bold text-slate-800 mb-2">
                Upload Data Massal (Excel)
              </h3>
              <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                Unduh template Excel kami, isi data anggota Anda dengan lengkap
                (termasuk NIK), lalu upload kembali file tersebut di sini.
              </p>

              <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                <button
                  onClick={downloadTemplate}
                  className="bg-white border border-slate-300 text-slate-700 font-bold py-2.5 px-6 rounded-xl hover:bg-slate-100 transition-colors text-sm w-full sm:w-auto flex items-center justify-center gap-2"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Unduh Template
                </button>
                <div className="relative w-full sm:w-auto">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleExcelUpload}
                    ref={fileInputRef}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button className="bg-[#1A73E8] hover:bg-blue-600 text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm w-full flex items-center justify-center gap-2 shadow-md">
                    {isParsing ? "Membaca Data..." : "Upload File Excel"}
                  </button>
                </div>
              </div>
            </div>

            {/* List Peserta yang Diupload */}
            {participants.length > 0 && (
              <div className="space-y-3">
                {participants.slice(0, visibleCount).map((p, index) => (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-[#1A73E8] transition-colors"
                  >
                    <div
                      className="flex justify-between items-center p-4 cursor-pointer bg-slate-50/50"
                      onClick={() =>
                        setOpenAccordionId(
                          openAccordionId === p.id ? null : p.id,
                        )
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 text-[#1A73E8] rounded-full flex items-center justify-center font-bold text-xs">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">
                            {p.namaLengkap}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            {p.kategori} | NIK: {p.nik} | {p.ukuranJersey}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[#0B2239] text-sm">
                          Rp {p.hargaAsli.toLocaleString("id-ID")}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeParticipant(p.id);
                          }}
                          className="text-red-400 hover:text-red-600 p-1"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {participants.length > visibleCount && (
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 10)}
                    className="w-full py-3 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Tampilkan Lebih Banyak ({participants.length - visibleCount}{" "}
                    tersisa)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* STEP 3: RINGKASAN & CHECKOUT */}
          <div
            className={`bg-white rounded-3xl p-6 sm:p-8 shadow-lg border border-slate-200 transition-all duration-500 ${!isStep1Valid || participants.length < 10 ? "opacity-50 pointer-events-none grayscale-[50%]" : ""}`}
          >
            <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 bg-[#0B2239] text-[#FCD116] rounded-full flex items-center justify-center font-black text-lg shadow-sm">
                3
              </div>
              <div>
                <h2 className="text-xl font-black text-[#0B2239]">
                  Ringkasan & Alokasi Tiket Gratis
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  Anda mendapatkan {eligibleFreeCount} tiket gratis.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 relative overflow-hidden">
                  <h3 className="font-black text-emerald-800 mb-1">
                    Pilih Penerima Tiket Gratis
                  </h3>
                  <p className="text-xs text-emerald-600 mb-4">
                    Sisa Kuota:{" "}
                    <span className="font-black text-lg">
                      {eligibleFreeCount - freeTicketIds.length}
                    </span>{" "}
                    / {eligibleFreeCount}
                  </p>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {participants
                      .filter((p) => p.hargaAsli === cheapestPrice)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => toggleFreeTicket(p)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${freeTicketIds.includes(p.id) ? "bg-emerald-500 border-emerald-600 text-white shadow-md" : "bg-white border-emerald-200 hover:border-emerald-400"}`}
                        >
                          <div className="text-sm font-bold truncate pr-2">
                            {p.namaLengkap}
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${freeTicketIds.includes(p.id) ? "border-white bg-white" : "border-emerald-300"}`}
                          >
                            {freeTicketIds.includes(p.id) && (
                              <svg
                                className="w-3 h-3 text-emerald-600"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      ))}
                    {participants.filter((p) => p.hargaAsli === cheapestPrice)
                      .length === 0 && (
                      <p className="text-xs text-slate-500 italic">
                        Tidak ada peserta dengan kategori termurah.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col h-full">
                <h3 className="font-black text-[#0B2239] mb-4 uppercase tracking-widest text-sm border-b border-slate-200 pb-2">
                  Rincian Pembayaran
                </h3>
                <div className="space-y-3 text-sm text-slate-600 mb-6 flex-grow">
                  <div className="flex justify-between">
                    <span>Biaya Pendaftaran ({participants.length} Orang)</span>
                    <span className="font-bold">
                      Rp {totalBiayaKotor.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Potongan Tiket Gratis ({freeTicketIds.length}x)</span>
                    <span>- Rp {potonganGratis.toLocaleString("id-ID")}</span>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">
                      Total Pembayaran
                    </span>
                    <span className="text-2xl font-black text-[#0B2239]">
                      Rp {totalBiayaBersih.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                <label className="flex items-start gap-3 mb-6 cursor-pointer p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#1A73E8] rounded border-slate-300 focus:ring-[#1A73E8]"
                  />
                  <span className="text-xs text-slate-600 leading-relaxed">
                    Saya menyatakan bahwa data seluruh anggota adalah benar dan
                    dapat dipertanggungjawabkan. Saya menyetujui{" "}
                    <Link
                      href="/syarat"
                      className="text-[#1A73E8] font-bold hover:underline"
                    >
                      Syarat & Ketentuan
                    </Link>{" "}
                    yang berlaku.
                  </span>
                </label>

                <div className="space-y-2">
                  <button
                    onClick={handleCheckout}
                    disabled={!isStep3Valid || isSubmitting}
                    className="w-full bg-[#0B2239] hover:bg-slate-800 text-[#FCD116] font-black py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-[#FCD116]"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Memproses Data...
                      </>
                    ) : (
                      "Lanjutkan Pembayaran"
                    )}
                  </button>
                  {!isAgreed && (
                    <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest">
                      *Setujui S&K untuk melanjutkan
                    </p>
                  )}
                  {!isStep3Valid &&
                    eligibleFreeCount > 0 &&
                    freeTicketIds.length < eligibleFreeCount && (
                      <p className="text-[10px] text-rose-500 font-bold text-center animate-pulse pt-1">
                        ⚠️ Harap alokasikan sisa tiket gratis Anda!
                      </p>
                    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterPublic />

      {/* POPUP MODAL ALERT UMUM */}
      {alertModal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
            {isSubmitting ? (
              <div className="w-16 h-16 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mx-auto mb-6"></div>
            ) : (
              <div className="w-16 h-16 bg-blue-50 text-[#1A73E8] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-blue-100">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            )}
            <h3 className="font-black text-xl text-slate-800 mb-2">
              {alertModal.title}
            </h3>
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              {alertModal.message}
            </p>
            {!isSubmitting && (
              <button
                onClick={() => setAlertModal({ ...alertModal, isOpen: false })}
                className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 py-3.5 rounded-xl font-bold transition-colors"
              >
                Tutup Peringatan
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
