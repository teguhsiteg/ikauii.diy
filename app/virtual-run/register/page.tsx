"use client";

import { useState, useEffect, Suspense } from "react";
import { toast } from "@/lib/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, query, where, getCountFromServer } from "firebase/firestore";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { MapPin } from "lucide-react";

// =========================================================================
// KOMPONEN FORM UTAMA (Dipisah agar bisa dibungkus Suspense oleh Next.js)
// =========================================================================
function RegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPaketId = searchParams.get("paket");

  const [settings, setSettings] = useState<any>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [paketTerisi, setPaketTerisi] = useState(0);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    tipePeserta: "alumni",
    nama: "",
    namaBib: "",
    email: "",
    whatsapp: "",
    fakultas: "",
    angkatan: "",
    jarak: "",
    paketId: "",
    ukuranJersey: "L",
    provinsi: "",
    kotaKabupaten: "",
    kecamatan: "",
    alamat: "",
    isDonasi: false,
    nominalDonasi: "",
  });

  // --- STATE ALAMAT BERTINGKAT ---
  const [wilayahData, setWilayahData] = useState<{provinces: any[], regencies: any[], districts: any[]} | null>(null);

  const [provinces, setProvinces] = useState<any[]>([]);
  const [regencies, setRegencies] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);

  const [selectedProvId, setSelectedProvId] = useState("");
  const [selectedRegId, setSelectedRegId] = useState("");
  const [selectedDistId, setSelectedDistId] = useState("");

  useEffect(() => {
    fetch("/data-wilayah.json")
      .then((res) => res.json())
      .then((data) => {
        setWilayahData(data);
        setProvinces(data.provinces || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedProvId && wilayahData) {
      setRegencies(wilayahData.regencies.filter((r: any) => r.province_id === selectedProvId));
    } else {
      setRegencies([]);
      setSelectedRegId("");
    }
  }, [selectedProvId, wilayahData]);

  useEffect(() => {
    if (selectedRegId && wilayahData) {
      setDistricts(wilayahData.districts.filter((d: any) => d.regency_id === selectedRegId));
    } else {
      setDistricts([]);
      setSelectedDistId("");
    }
  }, [selectedRegId, wilayahData]);

  const [isSyaratChecked, setIsSyaratChecked] = useState(false);
  const [isAsuransiChecked, setIsAsuransiChecked] = useState(false);
  const [isGrupChecked, setIsGrupChecked] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🔥 STATE BARU UNTUK POPUP COUNTDOWN 🔥
  const [successCountdown, setSuccessCountdown] = useState<number | null>(null);

  // --- LOGIKA HITUNG MUNDUR ---
  useEffect(() => {
    if (successCountdown !== null && successCountdown > 0) {
      const timer = setTimeout(
        () => setSuccessCountdown(successCountdown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    } else if (successCountdown === 0) {
      router.push("/virtual-run/dashboard");
    }
  }, [successCountdown, router]);

  useEffect(() => {
    const fetchSettingsAndLoadMidtrans = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(data);

          if (!data.urlGrupWa) setIsGrupChecked(true);

          if (data.virtualPackages && data.virtualPackages.length > 0) {
            let selectedPkg = data.virtualPackages[0];

            if (urlPaketId) {
              const foundPkg = data.virtualPackages.find(
                (p: any) => p.id === urlPaketId,
              );
              if (foundPkg) selectedPkg = foundPkg;
            }

            setFormData((prev) => ({
              ...prev,
              paketId: selectedPkg.id,
              jarak: selectedPkg.jarak,
            }));
          }

          if (data.metodePembayaran === "midtrans" && data.midtransClientKey) {
            const scriptUrl = data.isProduction
              ? "https://app.midtrans.com/snap/snap.js"
              : "https://app.sandbox.midtrans.com/snap/snap.js";

            if (!document.getElementById("midtrans-script")) {
              const scriptTag = document.createElement("script");
              scriptTag.id = "midtrans-script";
              scriptTag.src = scriptUrl;
              scriptTag.setAttribute("data-client-key", data.midtransClientKey);
              scriptTag.async = true;
              document.body.appendChild(scriptTag);
            }
          }
        }
      } catch (error) {
        console.error("Gagal mengambil pengaturan:", error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    fetchSettingsAndLoadMidtrans();
  }, [urlPaketId]);

  // --- PROTEKSI JIKA PENDAFTARAN BELUM DIBUKA ATAU SUDAH DITUTUP ---
  useEffect(() => {
    if (settings) {
      const isBypassed = localStorage.getItem("dev_bypass") === "true";
      const searchParams = new URLSearchParams(window.location.search);
      const isForceOpen = searchParams.get("force_open") === "secret_key";
      
      if (isBypassed || isForceOpen) return;

      const isBuka = settings.statusPendaftaran === "Buka";
      const closeDate = settings.tanggalPenutupan ? new Date(settings.tanggalPenutupan) : null;
      const currentTime = new Date();
      
      let isAllowed = isBuka;

      // Jika sudah melewati batas penutupan, tolak
      if (closeDate && currentTime > closeDate) {
        isAllowed = false;
      }

      if (!isAllowed) {
        router.push("/virtual-run");
      }
    }
  }, [settings, router]);

  const virtualPackages = settings?.virtualPackages || [];
  const selectedPackage =
    virtualPackages.find((p: any) => p.id === formData.paketId) ||
    virtualPackages[0];

  useEffect(() => {
    const fetchCount = async () => {
      if (selectedPackage && selectedPackage.nama) {
        const q = query(
          collection(db, "vr_participants"),
          where("paket", "==", selectedPackage.nama),
          where("statusPembayaran", "==", "Lunas")
        );
        const snapshot = await getCountFromServer(q);
        setPaketTerisi(snapshot.data().count);
      }
    };
    fetchCount();
  }, [selectedPackage?.nama]);

  let hargaPaketAktif = Number(selectedPackage?.harga) || 0;
  if (selectedPackage?.isEarlyBird) {
     const target = Number(selectedPackage.earlyBirdTarget);
     const isUnderQuota = target > 0 ? paketTerisi < target : true;
     const isBeforeEndDate = selectedPackage.earlyBirdEndDate ? new Date() < new Date(selectedPackage.earlyBirdEndDate) : true;
     if (isUnderQuota && isBeforeEndDate) {
       hargaPaketAktif = Number(selectedPackage.earlyBirdHarga || selectedPackage.harga);
     }
  }

  const ongkirFlat = Number(settings?.ongkirFlat) || 0;
  const minCharity = Number(settings?.minCharity) || 25000;

  const perluOngkir =
    selectedPackage && !selectedPackage.nama.toLowerCase().includes("basic");
  const totalOngkir = perluOngkir ? ongkirFlat : 0;

  const donasi =
    settings?.isCharityActive && formData.isDonasi
      ? Number(formData.nominalDonasi) || 0
      : 0;
  const grandTotal = hargaPaketAktif + totalOngkir + donasi;

  const daftarJarakLari = Array.from(
    new Set(virtualPackages.map((p: any) => p.jarak)),
  ) as string[];
  const isFormLengkap = isSyaratChecked && isAsuransiChecked && isGrupChecked;

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    let finalValue = value;

    if (name === "namaBib") finalValue = value.toUpperCase();

    if (name === "paketId") {
      const newPkg = virtualPackages.find((p: any) => p.id === value);
      if (newPkg) {
        setFormData({ ...formData, paketId: value, jarak: newPkg.jarak });
        return;
      }
    }

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : finalValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormLengkap) {
      toast.warning("Mohon centang semua kotak persetujuan.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.warning("Format email tidak valid.");
      return;
    }

    const kontak = formData.whatsapp.trim();
    if (kontak.startsWith("@")) {
      if (kontak.length < 3) { toast.warning("Username Instagram tidak valid."); return; }
    } else {
      const waRegex = /^(\+62|62|0)8[1-9][0-9]{6,12}$/;
      if (!waRegex.test(kontak)) {
        toast.warning("Format Kontak tidak valid (awalan 08/628).");
        return;
      }
    }

    if (formData.namaBib.length > 15) {
      toast.warning("Nama e-BIB maksimal 15 karakter.");
      return;
    }
    if (settings?.isCharityActive && formData.isDonasi && donasi < minCharity) {
      toast.warning(`Minimal donasi Rp ${minCharity.toLocaleString("id-ID")}`);
      return;
    }
    if (perluOngkir && (!formData.provinsi || !formData.kotaKabupaten || !formData.kecamatan || formData.alamat.trim().length < 10)) {
      toast.warning("Mohon lengkapi Provinsi, Kota, Kecamatan dan isi detail alamat.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (!executeRecaptcha) {
      toast.error("Sistem keamanan belum siap. Silakan refresh halaman.");
        setIsSubmitting(false);
        return;
      }

      const token = await executeRecaptcha("virtual_run_registration");
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token,
          email: formData.email, // Kirim email untuk fitur Account Defender (Opsional)
          action: "virtual_run_registration", // 🔥 BERI TAHU BACKEND INI FORM APA
        }),
      });

      const recaptchaResult = await recaptchaResponse.json();
      if (!recaptchaResult.success) {
        toast.warning("Pendaftaran ditolak. Aktivitas mencurigakan terdeteksi.");
        setIsSubmitting(false);
        return;
      }

      const namaDepan = formData.nama
        .split(" ")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const kodeAcak = Math.random().toString(36).substring(2, 7);
      const userSlug = `${namaDepan}-${kodeAcak}`;

      const finalDataToSave = {
        ...formData,
        paket: selectedPackage?.nama || "Custom",
        fakultas: formData.tipePeserta === "umum" ? "-" : formData.fakultas,
        angkatan: formData.tipePeserta === "umum" ? "-" : formData.angkatan,
        nominalDonasi: donasi,
        totalTagihan: grandTotal,
        statusPembayaran: "Pending",
        waktuDaftar: new Date().toISOString(),
        approvedKm: 0,
        resiPengiriman: "",
        buktiBayarUrl: "",
        slug: userSlug,
      };

      const docRef = await addDoc(
        collection(db, "vr_participants"),
        finalDataToSave,
      );

      // Email Trigger Berjalan di Background
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "registration",
          email: formData.email,
          nama: formData.nama,
          detail: { id: userSlug, totalTagihan: grandTotal },
        }),
      }).catch((err) => console.error("Background Email Error:", err));

      if (settings?.metodePembayaran === "midtrans") {
        const response = await fetch("/api/vr-midtrans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: docRef.id,
            grossAmount: grandTotal,
            customerName: formData.nama,
            customerEmail: formData.email,
            customerPhone: kontak,
          }),
        });

        const resData = await response.json();
        if (!response.ok)
          throw new Error(resData.error || "Gagal server Midtrans.");

        // @ts-ignore
        window.snap.pay(resData.token, {
          onSuccess: function () {
            router.push("/virtual-run/dashboard");
          },
          onPending: function () {
            router.push("/virtual-run/dashboard");
          },
          onError: function () {
            toast.error("Terjadi kesalahan pembayaran.");
            setIsSubmitting(false);
          },
          onClose: function () {
            router.push("/virtual-run/dashboard");
          },
        });
      } else {
        // 🔥 JIKA MANUAL / QRIS: MUNCULKAN POPUP HITUNG MUNDUR 🔥
        setSuccessCountdown(5);
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Terjadi kesalahan sistem, silakan coba lagi.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (settings?.statusPendaftaran === "Tutup") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-4xl mb-6">
          🔒
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          Pendaftaran Ditutup
        </h1>
        <p className="text-slate-500 mb-8 max-w-md">
          Mohon maaf, kuota pendaftaran event Virtual Run ini telah habis atau
          ditutup.
        </p>
        <button
          onClick={() => router.back()}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const isMetodeMidtrans = settings?.metodePembayaran === "midtrans";

  return (
    <>
      {/* 🔥 MODAL POPUP SUCCESS CUSTOM 🔥 */}
      {successCountdown !== null && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in zoom-in-95 duration-500 border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-emerald-400"></div>

            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100 shadow-inner">
              <span className="text-4xl filter drop-shadow-sm">🎉</span>
            </div>

            <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">
              Data Diterima!
            </h2>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              Notifikasi telah dikirim ke email Anda. Silakan selesaikan
              pembayaran untuk mengamankan slot lari Anda.
            </p>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6 shadow-inner">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Mengarahkan ke Dashboard
              </p>
              <p className="text-5xl font-black text-blue-600 my-2">
                {successCountdown}
              </p>
              <p className="text-xs text-slate-400 font-medium">detik...</p>
            </div>

            <button
              onClick={() => router.push("/virtual-run/dashboard")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm uppercase tracking-widest"
            >
              Ke Dashboard Sekarang
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex flex-col lg:flex-row gap-6 items-start"
      >
        {/* KOLOM KIRI (DATA & PAKET) */}
        <div className="w-full lg:w-2/3 space-y-5">
          {/* CARD 1: IDENTITAS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3 flex items-center gap-3">
              <span className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black">
                1
              </span>
              Identitas Pelari
            </h3>

            <div className="space-y-5">
              <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-200 flex gap-1">
                <label
                  className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${formData.tipePeserta === "alumni" ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <input
                    type="radio"
                    name="tipePeserta"
                    value="alumni"
                    checked={formData.tipePeserta === "alumni"}
                    onChange={handleChange}
                    className="hidden"
                  />{" "}
                  Alumni UII
                </label>
                <label
                  className={`flex-1 text-center py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all ${formData.tipePeserta === "umum" ? "bg-white text-blue-700 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"}`}
                >
                  <input
                    type="radio"
                    name="tipePeserta"
                    value="umum"
                    checked={formData.tipePeserta === "umum"}
                    onChange={handleChange}
                    className="hidden"
                  />{" "}
                  Umum / Non-Alumni
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nama Lengkap (Sesuai Sertifikat)
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Budi Santoso, S.T."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-bold"
                />
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1.5 flex justify-between">
                  <span>Nama Pendek (Untuk e-BIB)</span>
                  <span
                    className={`text-[10px] font-mono ${formData.namaBib.length === 15 ? "text-rose-500" : "text-blue-400"}`}
                  >
                    {formData.namaBib.length}/15 Max
                  </span>
                </label>
                <input
                  type="text"
                  name="namaBib"
                  value={formData.namaBib}
                  onChange={handleChange}
                  required
                  maxLength={15}
                  placeholder="Contoh: BUDI S."
                  className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all text-slate-800 font-black tracking-wide placeholder:font-normal placeholder:lowercase uppercase shadow-inner"
                />
                <p className="text-[10px] text-slate-500 mt-2">
                  Nama mencolok yang akan dicetak di nomor dada pelari Anda.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email (Wajib Valid)
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="budi@gmail.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    No. WhatsApp / Akun IG
                  </label>
                  <input
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    required
                    placeholder="0812... atau @akun_ig"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-mono"
                  />
                </div>
              </div>

              {formData.tipePeserta === "alumni" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Fakultas Asal UII
                    </label>
                    <input
                      type="text"
                      name="fakultas"
                      value={formData.fakultas}
                      onChange={handleChange}
                      required={formData.tipePeserta === "alumni"}
                      placeholder="Contoh: FTI / FMIPA"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Angkatan
                    </label>
                    <input
                      type="number"
                      name="angkatan"
                      value={formData.angkatan}
                      onChange={handleChange}
                      required={formData.tipePeserta === "alumni"}
                      placeholder="Contoh: 2015"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-medium"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CARD 2: KATEGORI & PAKET DINAMIS */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3 flex items-center gap-3">
              <span className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black">
                2
              </span>
              Jarak & Race Pack
            </h3>

            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Pilih Jarak Lari
            </label>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {daftarJarakLari.map((km) => (
                <label
                  key={km}
                  className={`cursor-pointer border rounded-2xl text-center py-4 transition-all ${formData.jarak === km ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
                >
                  <input
                    type="radio"
                    name="jarak"
                    value={km}
                    checked={formData.jarak === km}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="block text-xl font-black">{km}</span>
                </label>
              ))}
            </div>

            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Pilihan Paket Pendaftaran
            </label>
            <div className="space-y-3 mb-6">
              {virtualPackages
                .filter((pkg: any) => pkg.jarak === formData.jarak)
                .map((pkg: any) => (
                  <label
                    key={pkg.id}
                    className={`block cursor-pointer border rounded-2xl p-4 transition-all ${formData.paketId === pkg.id ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:bg-slate-50"}`}
                  >
                    <div className="flex flex-row items-center justify-between gap-2">
                      <div className="flex items-center gap-4">
                        <input
                          type="radio"
                          name="paketId"
                          value={pkg.id}
                          checked={formData.paketId === pkg.id}
                          onChange={handleChange}
                          className="w-5 h-5 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-bold text-slate-800">
                            {pkg.nama}
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
                            {pkg.benefit}
                          </p>
                        </div>
                      </div>
                      <span className="font-black text-slate-800 text-sm">
                        {(Number(pkg.harga) / 1000).toLocaleString("id-ID")}k
                      </span>
                    </div>
                  </label>
                ))}
            </div>

            {perluOngkir && (
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 space-y-5">
                <div className="flex items-center gap-2 mb-2 border-b border-slate-200/50 pb-3">
                  <MapPin className="w-5 h-5 text-slate-700" />
                  <h4 className="font-bold text-slate-800 text-sm">
                    Detail Pengiriman Race Pack
                  </h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Ukuran Baju
                    </label>
                    <select
                      name="ukuranJersey"
                      value={formData.ukuranJersey}
                      onChange={handleChange}
                      className="w-full sm:w-1/3 px-4 py-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-bold text-slate-800 cursor-pointer"
                    >
                      <option value="S">S (Small)</option>
                      <option value="M">M (Medium)</option>
                      <option value="L">L (Large)</option>
                      <option value="XL">XL (Extra Large)</option>
                      <option value="XXL">XXL (Double XL)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Provinsi</label>
                        <select
                          required
                          value={selectedProvId}
                          onChange={(e) => {
                            setSelectedProvId(e.target.value);
                            const provName = e.target.options[e.target.selectedIndex].text;
                            setFormData({ ...formData, provinsi: provName, kotaKabupaten: "", kecamatan: "" });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-bold"
                        >
                          <option value="">Pilih Provinsi</option>
                          {provinces.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kota/Kabupaten</label>
                        <select
                          required
                          disabled={!selectedProvId}
                          value={selectedRegId}
                          onChange={(e) => {
                            setSelectedRegId(e.target.value);
                            const regName = e.target.options[e.target.selectedIndex].text;
                            setFormData({ ...formData, kotaKabupaten: regName, kecamatan: "" });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-bold disabled:bg-slate-100"
                        >
                          <option value="">Pilih Kota/Kab</option>
                          {regencies.map((r) => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Kecamatan</label>
                        <select
                          required
                          disabled={!selectedRegId}
                          value={selectedDistId}
                          onChange={(e) => {
                            setSelectedDistId(e.target.value);
                            const distName = e.target.options[e.target.selectedIndex].text;
                            setFormData({ ...formData, kecamatan: distName });
                          }}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all text-slate-800 font-bold disabled:bg-slate-100"
                        >
                          <option value="">Pilih Kecamatan</option>
                          {districts.map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Alamat Detail (Jalan, RT/RW, Kelurahan, Kode Pos)
                      </label>
                      <textarea
                        name="alamat"
                        value={formData.alamat}
                        onChange={handleChange}
                        rows={2}
                        required
                        placeholder="Detail Jalan, RT/RW, Kelurahan, Kode Pos"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none text-sm transition-all custom-scrollbar text-slate-800 font-bold"
                      ></textarea>
                    </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: CHARITY */}
          {settings?.isCharityActive && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 rounded-3xl p-6 sm:p-8 shadow-sm border border-emerald-100">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-12 h-12 bg-white text-emerald-500 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm border border-emerald-100">
                  💖
                </div>
                <div>
                  <h3 className="text-base font-black text-emerald-900">
                    {settings.charityTitle || "Virtual Run & Charity"}
                  </h3>
                  <p className="text-xs text-emerald-700 mt-1 leading-relaxed font-medium">
                    {settings.charityDesc ||
                      "Berlari sambil berbagi. Tambahkan donasi Anda untuk disalurkan 100% ke Panti Asuhan yatim piatu."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-emerald-200 mb-3 hover:shadow-md transition-shadow">
                <input
                  type="checkbox"
                  id="isDonasi"
                  name="isDonasi"
                  checked={formData.isDonasi}
                  onChange={handleChange}
                  className="w-5 h-5 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label
                  htmlFor="isDonasi"
                  className="text-sm font-bold text-emerald-900 cursor-pointer select-none flex-grow"
                >
                  Ya, saya ingin melipatgandakan kebaikan!
                </label>
              </div>
              {formData.isDonasi && (
                <div className="animate-in fade-in slide-in-from-top-2 mt-4 relative">
                  <label className="block text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                    Nominal Donasi Tambahan (Min. Rp{" "}
                    {minCharity.toLocaleString("id-ID")})
                  </label>
                  <span className="absolute left-4 top-[29px] text-emerald-900 font-bold text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="nominalDonasi"
                    value={formData.nominalDonasi}
                    onChange={handleChange}
                    placeholder={minCharity.toString()}
                    min={minCharity}
                    className="w-full pl-12 pr-4 py-3 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-900 font-black text-base transition-all font-mono shadow-inner"
                  />
                </div>
              )}
            </div>
          )}

          {/* CARD 4: PERSETUJUAN */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3 flex items-center gap-3">
              <span className="bg-blue-100 text-blue-700 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black">
                3
              </span>{" "}
              Persetujuan Pendaftaran
            </h3>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 max-h-48 overflow-y-auto custom-scrollbar">
              <h4 className="font-bold text-slate-700 text-xs mb-2">
                SYARAT & KETENTUAN (VIRTUAL RUN)
              </h4>
              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                {settings?.syaratKetentuan || (
                  <>
                    <p>
                      1. KETENTUAN UMUM: IKA UII DIY Virtual Run adalah kegiatan
                      berlari mandiri di lokasi masing-masing sesuai jadwal.
                    </p>
                    <p>
                      2. PELACAKAN: Peserta wajib melacak jarak lari menggunakan
                      aplikasi GPS (Strava, Garmin, dll) lalu mengunggah
                      screenshot buktinya ke Dashboard.
                    </p>
                  </>
                )}
              </div>
              <h4 className="font-bold text-slate-700 text-xs mt-4 mb-2">
                INFORMASI ASURANSI (WAIVER OF LIABILITY)
              </h4>
              <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
                {settings?.infoAsuransi || (
                  <>
                    <p>
                      Mengingat sifat pelaksanaan Virtual Run, pihak
                      penyelenggara TIDAK MENYEDIAKAN asuransi kecelakaan diri
                      maupun kesehatan.
                    </p>
                    <p>
                      Dengan mendaftar, peserta sadar dan melepaskan panitia
                      dari segala tuntutan hukum jika terjadi cedera atau
                      kerugian selama berlari.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {settings?.urlGrupWa && (
                <div className="flex items-start gap-3 bg-[#e6f4ea]/50 p-4 rounded-xl border border-[#ceead6] hover:bg-[#e6f4ea] transition-colors">
                  <input
                    type="checkbox"
                    checked={isGrupChecked}
                    onChange={(e) => setIsGrupChecked(e.target.checked)}
                    className="mt-0.5 w-5 h-5 text-[#1A73E8] rounded border-slate-300 focus:ring-[#1A73E8] cursor-pointer"
                  />
                  <label
                    className="text-sm font-semibold text-slate-700 cursor-pointer flex-1"
                    onClick={() => setIsGrupChecked(!isGrupChecked)}
                  >
                    Saya sudah bergabung ke{" "}
                    <a
                      href={settings.urlGrupWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#137333] hover:underline font-bold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Channel WhatsApp Resmi
                    </a>{" "}
                    yang diwajibkan.
                  </label>
                </div>
              )}
              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isSyaratChecked}
                  onChange={(e) => setIsSyaratChecked(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-[#1A73E8] rounded border-slate-300 focus:ring-[#1A73E8] cursor-pointer"
                />
                <label
                  className="text-sm font-semibold text-slate-700 cursor-pointer flex-1"
                  onClick={() => setIsSyaratChecked(!isSyaratChecked)}
                >
                  Bersedia mematuhi{" "}
                  <span className="text-[#1A73E8] font-bold">
                    Syarat & Ketentuan
                  </span>{" "}
                  Virtual Run beserta sanksinya.
                </label>
              </div>
              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={isAsuransiChecked}
                  onChange={(e) => setIsAsuransiChecked(e.target.checked)}
                  className="mt-0.5 w-5 h-5 text-[#1A73E8] rounded border-slate-300 focus:ring-[#1A73E8] cursor-pointer"
                />
                <label
                  className="text-sm font-semibold text-slate-700 cursor-pointer flex-1"
                  onClick={() => setIsAsuransiChecked(!isAsuransiChecked)}
                >
                  Saya telah membaca dan menyetujui{" "}
                  <span className="text-[#1A73E8] font-bold">
                    Informasi Asuransi / Waiver of Liability
                  </span>{" "}
                  yang berlaku.
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (RINGKASAN & SUBMIT - STICKY) */}
        <div className="w-full lg:w-1/3 lg:sticky lg:top-24">
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
            <h3 className="text-base font-black text-slate-800 mb-5 border-b border-slate-100 pb-4">
              Ringkasan Biaya
            </h3>
            <div className="space-y-3.5 text-sm text-slate-600 mb-6">
              <div className="flex justify-between items-center">
                <span className="font-medium text-slate-500">
                  Paket ({selectedPackage?.nama || "Pilih Paket"})
                </span>
                <span className="font-bold text-slate-800">
                  Rp {hargaPaketAktif.toLocaleString("id-ID")}
                </span>
              </div>
              {perluOngkir && (
                <div className="flex justify-between items-center">
                  <span className="font-medium text-slate-500">
                    Ongkos Kirim (Flat)
                  </span>
                  <span className="font-bold text-slate-800">
                    Rp {totalOngkir.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              {settings?.isCharityActive && formData.isDonasi && donasi > 0 && (
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 p-2.5 -mx-2.5 rounded-lg border border-emerald-100/50">
                  <span className="font-bold text-xs flex items-center gap-1">
                    <span className="text-[10px]">💖</span> Donasi Amal
                  </span>
                  <span className="font-black">
                    Rp {donasi.toLocaleString("id-ID")}
                  </span>
                </div>
              )}
            </div>
            <div className="border-t border-dashed border-slate-300 pt-5 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-slate-400 text-[11px] uppercase tracking-wider mb-1">
                  Total Tagihan
                </span>
                <span className="text-3xl font-black text-blue-700 tracking-tighter">
                  Rp {grandTotal.toLocaleString("id-ID")}
                </span>
              </div>
            </div>
            <div className="text-[9px] text-slate-400 text-center mb-4 leading-relaxed">
              Dilindungi oleh reCAPTCHA dan tunduk pada{" "}
              <a
                href="https://policies.google.com/privacy"
                className="text-blue-500 hover:underline"
              >
                Privasi
              </a>{" "}
              serta{" "}
              <a
                href="https://policies.google.com/terms"
                className="text-blue-500 hover:underline"
              >
                Persyaratan
              </a>{" "}
              Google.
            </div>
            <button
              type="submit"
              disabled={isSubmitting || !isFormLengkap}
              className="w-full bg-[#1A73E8] hover:bg-[#1557b0] text-white font-black py-4 rounded-2xl text-sm transition-all shadow-lg shadow-blue-600/30 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{" "}
                  Memverifikasi...
                </span>
              ) : !isFormLengkap ? (
                "Lanjutkan ke Pembayaran"
              ) : (
                <>
                  {isMetodeMidtrans
                    ? "Lanjut ke Pembayaran"
                    : "Selesaikan Pendaftaran"}{" "}
                  <span className="font-normal text-blue-300">&rarr;</span>
                </>
              )}
            </button>
            {isMetodeMidtrans ? (
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center px-4">
                Aman Terenkripsi via Midtrans
              </div>
            ) : (
              <div className="mt-5 flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center px-4">
                Instruksi transfer ada di halaman berikutnya
              </div>
            )}
          </div>
        </div>
      </form>
    </>
  );
}

// =========================================================================
// MAIN PAGE EXPORT (Wrapper Suspense)
// =========================================================================
export default function VirtualRunRegisterPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      <div className="bg-blue-950 pt-10 pb-28 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-5xl mx-auto relative z-10">
          <Link
            href="/virtual-run"
            className="text-blue-300 hover:text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 mb-6 transition-colors w-fit"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>{" "}
            Kembali
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 tracking-tight">
            Registrasi Virtual Run
          </h1>
          <p className="text-blue-200 text-sm max-w-xl leading-relaxed">
            Lengkapi identitas diri, pilih jarak lari, dan tentukan paket race
            pack pilihan Anda.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <Suspense
          fallback={
            <div className="w-full bg-white rounded-3xl p-12 text-center shadow-lg border border-slate-200 flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold">Memuat Formulir...</p>
            </div>
          }
        >
          <RegistrationForm />
        </Suspense>
      </div>
    </div>
  );
}
