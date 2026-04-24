"use client";

import { useState, useEffect, Suspense } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

// 🔥 1. IMPORT HOOK RECAPTCHA
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

function FormPendaftaranOffline() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPaketId = searchParams.get("paket") || "";

  // 🔥 2. PANGGIL HOOK RECAPTCHA
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- STATE SISTEM ANTRIAN ---
  const [inQueue, setInQueue] = useState(true);
  const [queuePosition, setQueuePosition] = useState(0);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueProgress, setQueueProgress] = useState(0);

  // --- STATE PERSETUJUAN & METODE INLINE EXPAND ---
  const [expandedLegal, setExpandedLegal] = useState<"tnc" | "ins" | null>(
    null,
  );
  const [isWaJoined, setIsWaJoined] = useState(false);
  const [isTncRead, setIsTncRead] = useState(false);
  const [isInsRead, setIsInsRead] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    type: "warning",
    title: "",
    message: "",
  });

  // --- STATE FORM ---
  const [formData, setFormData] = useState({
    kategoriPeserta: "Alumni",
    jenisIdentitas: "KTP",
    nik: "",
    namaLengkap: "",
    namaBib: "",
    tanggalLahir: "",
    jenisKelamin: "",
    kewarganegaraan: "Indonesia",
    provinsi: "",
    kotaKabupaten: "",
    alamatLengkap: "",
    email: "",
    noWA: "",
    komunitas: "",
    nim: "",
    tahunLulus: "",
    fakultas: "",
    programStudi: "",
    ukuranJersey: "",
    golonganDarah: "",
    riwayatPenyakit: "",
    namaDarurat: "",
    hubunganDarurat: "",
    waDarurat: "",
    paketId: defaultPaketId, // Otomatis terisi dari URL Landing Page
  });

  // --- LOGIKA FETCH DATA & WAITING ROOM ---
  useEffect(() => {
    let queueTimer: any;

    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(data);

          if (data.isWaitingRoomActive) {
            let currentPosition = Math.floor(Math.random() * 15) + 15;
            const totalQueue =
              currentPosition + Math.floor(Math.random() * 30) + 20;

            setQueuePosition(currentPosition);
            setQueueTotal(totalQueue);

            queueTimer = setInterval(() => {
              currentPosition -= Math.floor(Math.random() * 2) + 1;
              if (currentPosition <= 0) {
                currentPosition = 0;
                clearInterval(queueTimer);
                setTimeout(() => setInQueue(false), 800);
              }
              setQueuePosition(currentPosition);
              setQueueProgress(100 - (currentPosition / totalQueue) * 100);
            }, 1500);
          } else {
            setInQueue(false);
          }
        } else {
          setInQueue(false);
        }
      } catch (error) {
        console.error("Gagal memuat data:", error);
        setInQueue(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();

    return () => {
      if (queueTimer) clearInterval(queueTimer);
    };
  }, []);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    // Blokir perubahan pada paketId agar user tidak bisa iseng ganti lewat inspect element
    if (name === "paketId") return;

    if (["noWA", "waDarurat", "nim", "tahunLulus", "nik"].includes(name)) {
      setFormData({ ...formData, [name]: value.replace(/\D/g, "") });
    } else if (name === "namaBib") {
      setFormData({ ...formData, [name]: value.toUpperCase().slice(0, 12) });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.jenisIdentitas === "KTP" && formData.nik.length !== 16) {
      return setModal({
        isOpen: true,
        type: "warning",
        title: "NIK Tidak Valid",
        message: "Nomor KTP (NIK) harus 16 digit angka.",
      });
    }
    if (formData.noWA.length < 10 || formData.waDarurat.length < 10) {
      return setModal({
        isOpen: true,
        type: "warning",
        title: "Nomor Tidak Valid",
        message: "Nomor WhatsApp Anda atau Kontak Darurat minimal 10 digit.",
      });
    }
    if (!formData.paketId) {
      return setModal({
        isOpen: true,
        type: "warning",
        title: "Pilih Paket",
        message:
          "Silakan pilih salah satu kategori lari terlebih dahulu dari halaman depan.",
      });
    }

    const selectedPackage = settings.offlinePackages?.find(
      (pkg: any) => pkg.id === formData.paketId,
    );

    if (!selectedPackage) {
      return setModal({
        isOpen: true,
        type: "error",
        title: "Paket Tidak Ditemukan",
        message: "Kategori yang Anda pilih tidak valid atau sudah dihapus.",
      });
    }

    setIsSubmitting(true);

    try {
      if (!executeRecaptcha) {
        setIsSubmitting(false);
        return setModal({
          isOpen: true,
          type: "warning",
          title: "Sistem Keamanan",
          message:
            "Sistem keamanan reCAPTCHA belum siap. Silakan refresh halaman dan coba lagi.",
        });
      }

      const token = await executeRecaptcha("offline_registration");
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        setIsSubmitting(false);
        return setModal({
          isOpen: true,
          type: "error",
          title: "Aktivitas Mencurigakan",
          message:
            "Sistem mendeteksi aktivitas tidak wajar (Spam/Bot). Pendaftaran ditolak.",
        });
      }

      const qCount = query(collection(db, "offline_participants"));
      const snapCount = await getDocs(qCount);
      const nomorUrut = snapCount.size + 1;
      const jarakAngka = selectedPackage?.jarak.replace(/\D/g, "") || "9";
      const formattedBIB = `${jarakAngka}${String(nomorUrut).padStart(3, "0")}`;

      const totalTagihan = Number(selectedPackage?.harga || 0);

      const docRef = await addDoc(collection(db, "offline_participants"), {
        ...formData,
        nim: formData.kategoriPeserta === "Umum" ? "" : formData.nim,
        tahunLulus:
          formData.kategoriPeserta === "Umum" ? "" : formData.tahunLulus,
        fakultas: formData.kategoriPeserta === "Umum" ? "" : formData.fakultas,
        programStudi:
          formData.kategoriPeserta === "Umum" ? "" : formData.programStudi,
        paketNama: selectedPackage?.nama || "",
        jarak: selectedPackage?.jarak || "",
        totalTagihan: totalTagihan,
        statusPembayaran: "Pending",
        waktuDaftar: new Date().toISOString(),
        nomorBIB: formattedBIB,
      });

      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "offline_registration",
          email: formData.email,
          nama: formData.namaLengkap,
          detail: {
            id: docRef.id,
            totalTagihan: totalTagihan,
          },
        }),
      }).catch((err) => console.error("Background Email Error:", err));

      router.push(`/run/checkout/${docRef.id}`);
    } catch (error) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Gagal Mendaftar",
        message: "Terjadi kesalahan sistem. Silakan coba lagi.",
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[999999] bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#152B5B] rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- 🔥 1. RUANG TUNGGU (FULLSCREEN, PAKE LOGO) 🔥 ---
  if (inQueue) {
    return (
      <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center p-4 font-sans overflow-hidden bg-[#0a152d]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#152B5B] to-[#0a152d] z-0"></div>
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full z-0 pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#D4AF37]/10 blur-[100px] rounded-full z-0 pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-md flex flex-col items-center animate-in fade-in zoom-in duration-700">
          <div className="w-32 md:w-40 mb-8 relative">
            <div className="absolute inset-0 bg-white/40 blur-2xl rounded-full animate-pulse"></div>
            <img
              src="/logo-dpp-ika.png"
              alt="Logo IKA UII"
              className="relative z-10 w-full h-auto object-contain drop-shadow-2xl"
              crossOrigin="anonymous"
            />
          </div>

          <h2 className="text-3xl font-black text-white mb-3 text-center tracking-tight">
            Siap-siap Berlari!
          </h2>
          <p className="text-sm text-blue-200/80 mb-10 text-center font-medium px-4 leading-relaxed">
            Sistem sedang mengalokasikan jalur pendaftaran untuk Anda. Mohon
            jangan muat ulang halaman ini.
          </p>

          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 text-center mb-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
            <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-3 opacity-80">
              Antrean Anda
            </p>
            <div className="flex items-baseline justify-center gap-2 mb-6">
              <span className="text-7xl font-black text-white drop-shadow-md">
                {queuePosition}
              </span>
              <span className="text-xl font-bold text-blue-300/40">
                / {queueTotal}
              </span>
            </div>

            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] to-[#F3C94E] rounded-full transition-all duration-1000 ease-out relative"
                style={{ width: `${queueProgress}%` }}
              >
                <div className="absolute inset-0 bg-white/30 w-full animate-[pulse_2s_infinite]"></div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-blue-200 font-medium bg-white/5 px-6 py-3.5 rounded-full border border-white/5 backdrop-blur-sm">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-white rounded-full animate-spin"></div>
            Menyinkronkan data pendaftaran...
          </div>
        </div>
      </div>
    );
  }

  // --- 🔥 2. PENDAFTARAN DITUTUP (FULLSCREEN ELEGAN) 🔥 ---
  if (!settings?.isOfflineRunEnabled) {
    return (
      <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center p-4 font-sans bg-[#0f172a] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e293b] to-[#0f172a] z-0"></div>

        <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8 backdrop-blur-md border border-white/10 shadow-2xl">
            <svg
              className="w-10 h-10 text-white/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-white mb-4 tracking-tight">
            Pendaftaran Ditutup
          </h1>
          <p className="text-slate-400 font-medium mb-10 px-4 leading-relaxed">
            Mohon maaf, kuota pendaftaran Offline Run telah terpenuhi atau
            periode pendaftaran telah berakhir. Terima kasih atas antusiasme
            Anda yang luar biasa!
          </p>
          <Link
            href="/run"
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-10 rounded-full transition-all border border-white/10 backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // --- MAIN LAYOUT (DIBUNGKUS NAVBAR & FOOTER) ---
  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col">
      <NavbarPublic />

      <main className="flex-grow w-full relative z-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 py-32 transition-all duration-300">
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="p-8 sm:p-10 border-b border-slate-100 bg-[#F4F7FB]">
              <Link
                href="/run"
                className="text-sm font-bold text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center gap-2"
              >
                &larr; Kembali ke Info Event
              </Link>
              <h3 className="text-2xl md:text-3xl font-black text-[#152B5B] mb-2 mt-2">
                Form Registrasi Offline Run
              </h3>
              <p className="text-slate-500 text-sm">
                Harap isi data pribadi, kontak, dan alamat dengan
                sebenar-benarnya sesuai identitas asli.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-12">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  Kategori Peserta
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all group ${formData.kategoriPeserta === "Alumni" ? "border-[#152B5B] bg-blue-50/50 shadow-sm text-[#152B5B]" : "border-slate-200 bg-white hover:border-blue-200 text-slate-500"}`}
                  >
                    <input
                      type="radio"
                      name="kategoriPeserta"
                      value="Alumni"
                      checked={formData.kategoriPeserta === "Alumni"}
                      onChange={handleChange}
                      className="absolute opacity-0"
                    />
                    <svg
                      className="w-8 h-8 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                      />
                    </svg>
                    <span className="font-black text-sm uppercase tracking-wider">
                      Alumni UII
                    </span>
                  </label>
                  <label
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 cursor-pointer transition-all group ${formData.kategoriPeserta === "Umum" ? "border-[#152B5B] bg-blue-50/50 shadow-sm text-[#152B5B]" : "border-slate-200 bg-white hover:border-blue-200 text-slate-500"}`}
                  >
                    <input
                      type="radio"
                      name="kategoriPeserta"
                      value="Umum"
                      checked={formData.kategoriPeserta === "Umum"}
                      onChange={handleChange}
                      className="absolute opacity-0"
                    />
                    <svg
                      className="w-8 h-8 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
                      />
                    </svg>
                    <span className="font-black text-sm uppercase tracking-wider">
                      Umum (Publik)
                    </span>
                  </label>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 🔥 BLOK 2: KATEGORI JARAK (DIKUNCI / READ ONLY) 🔥        */}
              {/* ========================================================= */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                      2
                    </span>
                    Kategori Jarak
                  </div>
                  <span className="text-[9px] bg-amber-100 text-amber-700 px-2 py-1 rounded-md">
                    Sesuai Pilihan Anda
                  </span>
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {settings?.offlinePackages?.map((pkg: any) => {
                    const isSelected = formData.paketId === pkg.id;
                    return (
                      <label
                        key={pkg.id}
                        className={`relative flex flex-col p-5 rounded-2xl border-2 transition-all ${
                          isSelected
                            ? "border-[#152B5B] bg-blue-50/30 shadow-md ring-2 ring-blue-500/20 cursor-default"
                            : "border-slate-200 bg-slate-50 opacity-50 grayscale cursor-not-allowed"
                        }`}
                      >
                        <input
                          type="radio"
                          name="paketId"
                          value={pkg.id}
                          checked={isSelected}
                          readOnly
                          className="absolute opacity-0"
                        />
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-black text-slate-800 text-lg">
                            {pkg.nama}
                          </span>
                          {isSelected ? (
                            <span className="w-5 h-5 bg-[#D4AF37] rounded-full flex items-center justify-center text-white text-xs">
                              ✓
                            </span>
                          ) : (
                            <span className="w-5 h-5 border-2 border-slate-200 rounded-full"></span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#152B5B] mb-3 bg-white w-fit px-2 py-1 rounded-md border border-blue-100 shadow-sm">
                          Kategori {pkg.jarak}
                        </span>
                        <span className="text-xl font-black text-slate-900 mb-2">
                          Rp {Number(pkg.harga).toLocaleString("id-ID")}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium leading-relaxed mt-auto border-t border-slate-200/60 pt-2">
                          Fasilitas: {pkg.benefit}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  Informasi Personal
                </h4>
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Nama Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaLengkap"
                        value={formData.namaLengkap}
                        onChange={handleChange}
                        required
                        placeholder="Sesuai Identitas Resmi"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Nama di BIB <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaBib"
                        value={formData.namaBib}
                        onChange={handleChange}
                        required
                        placeholder="Maks 12 Huruf (Cth: ANDI)"
                        maxLength={12}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-black uppercase"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Tipe Identitas <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="jenisIdentitas"
                        value={formData.jenisIdentitas}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      >
                        <option value="KTP">KTP</option>
                        <option value="Paspor">Paspor / Passport</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Nomor Identitas (NIK/Paspor){" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nik"
                        value={formData.nik}
                        onChange={handleChange}
                        required
                        maxLength={16}
                        placeholder="Masukkan 16 digit NIK"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Tanggal Lahir <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="tanggalLahir"
                        value={formData.tanggalLahir}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Jenis Kelamin <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="jenisKelamin"
                        value={formData.jenisKelamin}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      >
                        <option value="" disabled>
                          Pilih Gender
                        </option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Kewarganegaraan <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="kewarganegaraan"
                        value={formData.kewarganegaraan}
                        onChange={handleChange}
                        required
                        placeholder="Cth: Indonesia"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Provinsi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="provinsi"
                        value={formData.provinsi}
                        onChange={handleChange}
                        required
                        placeholder="Cth: DI Yogyakarta"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Kota / Kabupaten{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="kotaKabupaten"
                        value={formData.kotaKabupaten}
                        onChange={handleChange}
                        required
                        placeholder="Cth: Sleman"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        Alamat Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        name="alamatLengkap"
                        value={formData.alamatLengkap}
                        onChange={handleChange}
                        required
                        rows={2}
                        placeholder="Nama jalan, RT/RW, Kecamatan"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-medium custom-scrollbar"
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 mb-5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                    4
                  </span>
                  Kontak & Komunitas
                </h4>
                <div className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        No. WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="noWA"
                        value={formData.noWA}
                        onChange={handleChange}
                        required
                        placeholder="081234..."
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                        E-mail <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="email@contoh.com"
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                      Nama Komunitas Lari (Opsional)
                    </label>
                    <input
                      type="text"
                      name="komunitas"
                      value={formData.komunitas}
                      onChange={handleChange}
                      placeholder="Cth: UII Endurance"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                    />
                  </div>
                </div>
              </div>

              {formData.kategoriPeserta === "Alumni" && (
                <div className="bg-blue-50/50 border border-blue-200 rounded-3xl p-6 md:p-8 space-y-5 animate-in fade-in slide-in-from-top-2">
                  <h4 className="text-xs font-bold text-[#152B5B] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#152B5B]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                      />
                    </svg>
                    Data Akademik Alumni
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1.5 ml-1">
                        NIM <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="nim"
                        value={formData.nim}
                        onChange={handleChange}
                        required
                        pattern="[0-9]*"
                        placeholder="13525022"
                        className="w-full px-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1.5 ml-1">
                        Tahun Lulus / Angkatan{" "}
                        <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="tahunLulus"
                        value={formData.tahunLulus}
                        onChange={handleChange}
                        required
                        pattern="[0-9]{4}"
                        maxLength={4}
                        placeholder="2013"
                        className="w-full px-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1.5 ml-1">
                        Fakultas <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="fakultas"
                        value={formData.fakultas}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold cursor-pointer"
                      >
                        <option value="" disabled>
                          -- Pilih Fakultas --
                        </option>
                        <option value="Hukum">Fakultas Hukum</option>
                        <option value="Ekonomi & Bisnis">
                          Fakultas Ekonomi & Bisnis
                        </option>
                        <option value="Ilmu Agama Islam">
                          Fakultas Ilmu Agama Islam
                        </option>
                        <option value="Kedokteran">Fakultas Kedokteran</option>
                        <option value="MIPA">Fakultas MIPA</option>
                        <option value="Psikologi & Ilmu Sosial Budaya">
                          Fakultas Psikologi & Ilmu Sosial Budaya
                        </option>
                        <option value="Teknik Sipil & Perencanaan">
                          Fakultas Teknik Sipil & Perencanaan
                        </option>
                        <option value="Teknologi Industri">
                          Fakultas Teknologi Industri
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1.5 ml-1">
                        Program Studi <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="programStudi"
                        value={formData.programStudi}
                        onChange={handleChange}
                        required
                        placeholder="Cth: Ilmu Kimia"
                        className="w-full px-4 py-3.5 bg-white border border-blue-200 rounded-xl focus:border-[#152B5B] outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider pb-3 border-b border-rose-100 mb-5 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[10px]">
                    5
                  </span>
                  Kondisi Medis & Darurat
                </h4>
                <div className="space-y-5 bg-rose-50/30 p-6 md:p-8 rounded-3xl border border-rose-100">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1.5 ml-1 flex justify-between">
                        <span>
                          Size Jersey <span className="text-rose-500">*</span>
                        </span>
                        {settings?.urlSizeChart && (
                          <a
                            href={settings.urlSizeChart}
                            target="_blank"
                            className="text-rose-500 hover:underline font-bold flex items-center gap-1"
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
                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Size Chart
                          </a>
                        )}
                      </label>
                      <select
                        name="ukuranJersey"
                        value={formData.ukuranJersey}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-white border border-rose-200 rounded-xl focus:border-rose-400 outline-none text-sm transition-all text-slate-800 font-bold cursor-pointer"
                      >
                        <option value="" disabled>
                          Pilih Ukuran
                        </option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1.5 ml-1">
                        Golongan Darah <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="golonganDarah"
                        value={formData.golonganDarah}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-white border border-rose-200 rounded-xl focus:border-rose-400 outline-none text-sm transition-all text-slate-800 font-bold cursor-pointer"
                      >
                        <option value="" disabled>
                          Pilih
                        </option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="AB">AB</option>
                        <option value="O">O</option>
                        <option value="Tidak Tahu">Tidak Tahu</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1.5 ml-1">
                      Kondisi Medis Khusus (Opsional)
                    </label>
                    <input
                      type="text"
                      name="riwayatPenyakit"
                      value={formData.riwayatPenyakit}
                      onChange={handleChange}
                      placeholder="Jika ada (Cth: Asma, Alergi)"
                      className="w-full px-4 py-3.5 bg-white border border-rose-200 rounded-xl focus:border-rose-400 outline-none text-sm transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <div className="grid sm:grid-cols-3 gap-5 border-t border-rose-200/50 pt-5 mt-5">
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1.5 ml-1">
                        Hubungan Kontak <span className="text-rose-500">*</span>
                      </label>
                      <select
                        name="hubunganDarurat"
                        value={formData.hubunganDarurat}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3.5 bg-white border border-rose-200 rounded-xl focus:border-rose-400 outline-none text-sm transition-all text-slate-800 font-bold cursor-pointer"
                      >
                        <option value="" disabled>
                          Pilih
                        </option>
                        <option value="Orang Tua">Orang Tua</option>
                        <option value="Suami/Istri">Suami/Istri</option>
                        <option value="Saudara">Saudara</option>
                        <option value="Teman">Teman</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1.5 ml-1">
                        Nama Darurat <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="namaDarurat"
                        value={formData.namaDarurat}
                        onChange={handleChange}
                        required
                        placeholder="Nama"
                        className="w-full px-4 py-3.5 bg-white border border-rose-200 rounded-xl focus:border-rose-400 outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-1.5 ml-1">
                        No. WA Darurat <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="waDarurat"
                        value={formData.waDarurat}
                        onChange={handleChange}
                        required
                        placeholder="08..."
                        className="w-full px-4 py-3.5 bg-white border border-rose-200 rounded-xl focus:border-rose-400 outline-none text-sm transition-all text-slate-800 font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================== */}
              {/* 🔥 6. PERSETUJUAN PENDAFTARAN (METODE INLINE EXPAND) 🔥 */}
              {/* ========================================================== */}
              <div className="space-y-4 pt-10 border-t border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px]">
                    6
                  </span>
                  Persetujuan Pendaftaran
                </h4>

                {/* Box 1: WA Channel */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isWaJoined}
                      onChange={(e) => setIsWaJoined(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-emerald-600 rounded border-slate-300 cursor-pointer shrink-0"
                    />
                    <label
                      className="text-sm font-bold text-slate-800 cursor-pointer select-none"
                      onClick={() => setIsWaJoined(!isWaJoined)}
                    >
                      Saya sudah bergabung ke{" "}
                      <a
                        href="https://whatsapp.com/channel/0029Vb7WeSSFcow6V1mLa03P"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-emerald-600 underline hover:text-emerald-700 italic"
                      >
                        channel WhatsApp DPW IKA UII DIY
                      </a>{" "}
                      yang diwajibkan.
                    </label>
                  </div>
                </div>

                {/* Box 2: TNC (Inline Expand) */}
                <div
                  className={`rounded-2xl p-5 border shadow-sm transition-colors duration-300 ${isTncRead ? "bg-emerald-50/50 border-emerald-200" : "bg-blue-50/50 border-blue-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isTncRead}
                      disabled
                      className="mt-1 w-5 h-5 accent-emerald-600 rounded border-slate-300 disabled:opacity-50 shrink-0"
                    />
                    <label className="text-sm font-bold text-slate-800">
                      Bersedia mematuhi{" "}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLegal(
                            expandedLegal === "tnc" ? null : "tnc",
                          )
                        }
                        className="text-[#152B5B] underline hover:text-blue-800 italic font-black focus:outline-none"
                      >
                        syarat & ketentuan
                      </button>{" "}
                      Offline Run beserta sanksinya.
                    </label>
                  </div>

                  {/* TNC Expanded Content */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedLegal === "tnc" ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-4 border-t border-blue-200/50">
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-blue-100 h-56 overflow-y-auto custom-scrollbar mb-4 text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed shadow-inner">
                          {settings?.tncOffline || "Memuat..."}
                        </div>
                        {!isTncRead && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsTncRead(true);
                              setExpandedLegal(null);
                            }}
                            className="w-full bg-[#152B5B] text-white font-bold py-3.5 rounded-xl hover:bg-[#0D1B3E] shadow-md transition-all text-sm"
                          >
                            Ya, Saya Membaca & Menyetujui
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box 3: Asuransi (Inline Expand) */}
                <div
                  className={`rounded-2xl p-5 border shadow-sm transition-colors duration-300 ${isInsRead ? "bg-emerald-50/50 border-emerald-200" : "bg-blue-50/50 border-blue-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isInsRead}
                      disabled
                      className="mt-1 w-5 h-5 accent-emerald-600 rounded border-slate-300 disabled:opacity-50 shrink-0"
                    />
                    <label className="text-sm font-bold text-slate-800">
                      Saya telah membaca dan menyetujui{" "}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedLegal(
                            expandedLegal === "ins" ? null : "ins",
                          )
                        }
                        className="text-[#152B5B] underline hover:text-blue-800 italic font-black focus:outline-none"
                      >
                        informasi asuransi
                      </button>{" "}
                      yang berlaku.
                    </label>
                  </div>

                  {/* INS Expanded Content */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${expandedLegal === "ins" ? "grid-rows-[1fr] opacity-100 mt-4" : "grid-rows-[0fr] opacity-0 mt-0"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="pt-4 border-t border-blue-200/50">
                        <div className="bg-white p-4 md:p-6 rounded-xl border border-blue-100 h-56 overflow-y-auto custom-scrollbar mb-4 text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed shadow-inner">
                          {settings?.insOffline || "Memuat..."}
                        </div>
                        {!isInsRead && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsInsRead(true);
                              setExpandedLegal(null);
                            }}
                            className="w-full bg-[#152B5B] text-white font-bold py-3.5 rounded-xl hover:bg-[#0D1B3E] shadow-md transition-all text-sm"
                          >
                            Ya, Saya Membaca & Menyetujui
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="text-[10px] text-slate-400 text-center mb-4 leading-relaxed px-4">
                    Formulir ini dilindungi oleh reCAPTCHA dan tunduk pada{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      className="text-blue-500 hover:underline"
                    >
                      Kebijakan Privasi
                    </a>{" "}
                    serta{" "}
                    <a
                      href="https://policies.google.com/terms"
                      className="text-blue-500 hover:underline"
                    >
                      Persyaratan Layanan
                    </a>{" "}
                    Google.
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting || !isWaJoined || !isTncRead || !isInsRead
                    }
                    className="w-full bg-[#152B5B] hover:bg-[#0D1B3E] text-white font-black py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg mt-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>{" "}
                        Memproses...
                      </>
                    ) : (
                      "Daftar Sekarang ➔"
                    )}
                  </button>
                </div>
                {(!isWaJoined || !isTncRead || !isInsRead) && (
                  <p className="text-center text-[10px] text-rose-500 font-bold mt-2 uppercase tracking-widest flex items-center justify-center gap-1">
                    <svg
                      className="w-3 h-3 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Selesaikan 3 persetujuan di atas untuk melanjutkan
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </main>

      <FooterPublic />

      {/* ALERT ERROR MURNI */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div
              className={`p-8 text-center ${modal.type === "error" ? "bg-rose-50" : "bg-amber-50"}`}
            >
              <div
                className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 text-3xl shadow-sm ${modal.type === "error" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}
              >
                {modal.type === "error" ? (
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
                {modal.title}
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                {modal.message}
              </p>
              <button
                onClick={() => setModal({ ...modal, isOpen: false })}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// BUNGKUSAN PAGE UTAMA
export default function OfflineRunRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-grow flex items-center justify-center min-h-screen bg-[#F4F7FB]">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-[#152B5B] rounded-full animate-spin"></div>
        </div>
      }
    >
      <FormPendaftaranOffline />
    </Suspense>
  );
}
