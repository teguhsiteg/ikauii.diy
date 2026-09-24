"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, query, where, getCountFromServer } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { sendEmailAction } from "@/app/actions/email";
import RunNavbar from "@/components/run/RunNavbar";
import RunFooter from "@/components/run/RunFooter";
import wilayahData from "@/lib/data-wilayah.json";

const COUNTRY_CODES = [
  { value: "+62", label: "🇮🇩 Indonesia (+62)", display: "🇮🇩 +62" },
  { value: "+60", label: "🇲🇾 Malaysia (+60)", display: "🇲🇾 +60" },
  { value: "+65", label: "🇸🇬 Singapore (+65)", display: "🇸🇬 +65" },
  { value: "+1", label: "🇺🇸 United States (+1)", display: "🇺🇸 +1" },
  { value: "+44", label: "🇬🇧 United Kingdom (+44)", display: "🇬🇧 +44" },
  { value: "+61", label: "🇦🇺 Australia (+61)", display: "🇦🇺 +61" },
  { value: "+81", label: "🇯🇵 Japan (+81)", display: "🇯🇵 +81" },
];

const NEGARA_OPTIONS = [
  { value: "Indonesia", label: "🇮🇩 Indonesia" },
  { value: "Malaysia", label: "🇲🇾 Malaysia" },
  { value: "Singapore", label: "🇸🇬 Singapore" },
  { value: "Lainnya", label: "🌍 Lainnya" },
];

// --- KOMPONEN CUSTOM SEARCHABLE SELECT ---
const SearchableSelect = ({ options, value, onChange, placeholder, disabled, className = "" }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: any) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Safe default for value to avoid controlled/uncontrolled error
  const safeValue = value || "";
  const filtered = options.filter((o: any) => o.label.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find((o: any) => o.value === safeValue);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div 
        className={`w-full bg-white border border-slate-200 rounded px-3 py-2 text-[13px] flex items-center justify-between cursor-pointer ${disabled ? 'bg-slate-50 opacity-70' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selected ? 'text-[#0B2239]' : 'text-slate-400'}>{selected ? (selected.display || selected.label) : placeholder}</span>
        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full min-w-[200px] mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-60 flex flex-col left-0">
          <div className="p-2 border-b border-slate-100">
            <input 
              type="text" autoFocus
              className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-1.5 text-xs outline-none focus:border-[#1A73E8]"
              placeholder="Cari..."
              value={search} onChange={e => setSearch(e.target.value || "")}
            />
          </div>
          <div className="overflow-y-auto p-1">
            {filtered.length === 0 ? <div className="p-2 text-center text-xs text-slate-400">Tidak ditemukan</div> : 
              filtered.map((o: any) => (
                <div 
                  key={o.value}
                  className="px-3 py-2 hover:bg-blue-50 text-[13px] text-[#0B2239] cursor-pointer rounded whitespace-nowrap overflow-hidden text-ellipsis"
                  onClick={() => { onChange(o.value); setIsOpen(false); setSearch(''); }}
                >
                  {o.label}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  )
};

// --- KOMPONEN STEPPER ---
const Stepper = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Pilih Kategori", "Detail Pesanan", "Review Data"];
  return (
    <div className="w-full max-w-3xl mx-auto mb-10 mt-8 hidden md:block">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200 -z-10"></div>
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep >= stepNum;
          return (
            <div key={idx} className="flex flex-col items-center bg-[#F4F7FB] px-4">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? "bg-[#1A73E8] text-white shadow-md shadow-blue-200"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {stepNum}
              </div>
              <p
                className={`text-[11px] mt-2 font-bold uppercase tracking-wider ${
                  isActive ? "text-[#1A73E8]" : "text-slate-400"
                }`}
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function PendaftaranOffline() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPaketId = searchParams.get("paket") || "";
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState<any[]>([]);
  const [packageCounts, setPackageCounts] = useState<Record<string, number>>({});
  
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [donasi, setDonasi] = useState<number | "">("");
  
  const [agreeSnC, setAgreeSnC] = useState(false);
  const [agreeAsuransi, setAgreeAsuransi] = useState(false);
  
  // Wilayah Data
  const provinces = wilayahData.provinces;
  const citiesCache = wilayahData.cities as Record<string, any[]>;

  // Master Booker Data
  const [pemesan, setPemesan] = useState({
    namaDepan: "",
    namaBelakang: "",
    email: "",
    noWACode: "+62",
    noWA: "",
  });

  const [participants, setParticipants] = useState<any[]>([]);
  const [expandedParticipant, setExpandedParticipant] = useState<number>(0);

  const [modal, setModal] = useState({ isOpen: false, type: "info", title: "", message: "" });
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // AUTO-SAVE: Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("ikadiy_run_form");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.pemesan) setPemesan(parsed.pemesan);
        if (parsed.participants && parsed.participants.length > 0) setParticipants(parsed.participants);
        if (parsed.selectedTickets) setSelectedTickets(parsed.selectedTickets);
        if (parsed.step) setStep(parsed.step);
      } catch (e) {}
    }
    setIsRestored(true);
  }, []);

  // AUTO-SAVE: Save to LocalStorage
  useEffect(() => {
    if (isRestored) {
      localStorage.setItem("ikadiy_run_form", JSON.stringify({ pemesan, participants, selectedTickets, step }));
    }
  }, [pemesan, participants, selectedTickets, step, isRestored]);

  // Load cities if restored participants have province (Not needed with local JSON)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "virtual_run"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(data);
          
          if (data.offlinePackages) {
            setPackages(data.offlinePackages);
            const counts: Record<string, number> = {};
            await Promise.all(
              data.offlinePackages.map(async (pkg: any) => {
                const q = query(collection(db, "offline_participants"), where("paketId", "==", pkg.id), where("statusPembayaran", "==", "Lunas"));
                const snapshot = await getCountFromServer(q);
                counts[pkg.id] = snapshot.data().count;
              })
            );
            setPackageCounts(counts);

            if (defaultPaketId && Object.keys(selectedTickets).length === 0) {
              setSelectedTickets({ [defaultPaketId]: 1 });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, [defaultPaketId]);

  const handleTicketChange = (pkgId: string, delta: number) => {
    setSelectedTickets((prev) => {
      const current = prev[pkgId] || 0;
      const newVal = Math.max(0, current + delta);
      return { ...prev, [pkgId]: newVal };
    });
  };

  const totalTickets = Object.values(selectedTickets).reduce((a, b) => a + b, 0);

  const calculateSubtotal = () => {
    let total = 0;
    Object.entries(selectedTickets).forEach(([pkgId, qty]) => {
      const pkg = packages.find((p) => p.id === pkgId);
      if (pkg) {
        let harga = Number(pkg.harga || 0);
        if (pkg.isEarlyBird) {
          const terisi = packageCounts[pkgId] || 0;
          const target = Number(pkg.earlyBirdTarget);
          if (target > 0 && terisi < target) {
            harga = Number(pkg.earlyBirdHarga || pkg.harga);
          }
        }
        total += harga * qty;
      }
    });
    return total;
  };

  const handleApplyPromo = () => {
    if (!promoCode) {
      setPromoDiscount(0);
      return;
    }
    
    let totalDiscount = 0;
    let isFound = false;
    let isExpired = false;
    let isKuotaPenuh = false;

    Object.entries(selectedTickets).forEach(([pkgId, qty]) => {
      if (qty === 0) return;
      const pkg = packages.find((p) => p.id === pkgId);
      if (!pkg || !pkg.promos) return;

      const promo = pkg.promos.find((p: any) => p.kode === promoCode && p.isActive);
      if (promo) {
        isFound = true;
        
        if (promo.tanggalKedaluwarsa && new Date(promo.tanggalKedaluwarsa) < new Date()) {
          isExpired = true;
          return;
        }
        
        if (promo.kuotaMaksimal > 0 && (promo.kuotaTerpakai || 0) >= promo.kuotaMaksimal) {
          isKuotaPenuh = true;
          return;
        }

        let harga = Number(pkg.harga || 0);
        if (pkg.isEarlyBird) {
          const terisi = packageCounts[pkgId] || 0;
          const target = Number(pkg.earlyBirdTarget);
          if (target > 0 && terisi < target) {
            harga = Number(pkg.earlyBirdHarga || pkg.harga);
          }
        }

        if (promo.jenisDiskon === "persen") {
          totalDiscount += (harga * Number(promo.nilaiDiskon) / 100) * qty;
        } else {
          totalDiscount += Number(promo.nilaiDiskon) * qty;
        }
      }
    });

    if (totalDiscount > 0) {
      setPromoDiscount(totalDiscount);
      setModal({ isOpen: true, type: "success", title: "Promo Berhasil", message: `Selamat! Anda mendapatkan potongan Rp ${totalDiscount.toLocaleString("id-ID")}` });
    } else if (isExpired) {
      setPromoDiscount(0);
      setModal({ isOpen: true, type: "error", title: "Promo Kadaluarsa", message: "Kode promo ini sudah kadaluarsa." });
    } else if (isKuotaPenuh) {
      setPromoDiscount(0);
      setModal({ isOpen: true, type: "error", title: "Kuota Penuh", message: "Kuota untuk kode promo ini sudah habis." });
    } else {
      setPromoDiscount(0);
      setModal({ isOpen: true, type: "error", title: "Kode Invalid", message: "Kode promo tidak valid atau tidak berlaku untuk tiket yang dipilih." });
    }
  };

  const handleLanjutStep2 = () => {
    if (totalTickets === 0) {
      return setModal({ isOpen: true, type: "warning", title: "Pilih Kategori", message: "Silakan tentukan jumlah tiket terlebih dahulu." });
    }
    
    const existingCount = participants.length;
    if (existingCount !== totalTickets) {
      const newParticipants: any[] = [];
      Object.entries(selectedTickets).forEach(([pkgId, qty]) => {
        const pkg = packages.find((p) => p.id === pkgId);
        if (!pkg) return;
        
        let harga = Number(pkg.harga || 0);
        if (pkg.isEarlyBird && (Number(pkg.earlyBirdTarget) === 0 || (packageCounts[pkgId] || 0) < Number(pkg.earlyBirdTarget))) {
          harga = Number(pkg.earlyBirdHarga || pkg.harga);
        }

        for (let i = 0; i < qty; i++) {
          newParticipants.push({
            paketId: pkg.id,
            paketNama: pkg.nama,
            jarak: pkg.jarak,
            hargaAsli: harga,
            
            namaLengkap: "",
            email: "",
            noWACode: "+62",
            noWA: "",
            jenisIdentitas: "KTP",
            nik: "",
            namaBib: "",
            ukuranJersey: "",
            golonganDarah: "",
            namaDarurat: "",
            hubunganDarurat: "",
            waDaruratCode: "+62",
            waDarurat: "",
            komunitas: "",
            isCopiedFromPemesan: false,
            tanggalLahir: "",
            jenisKelamin: "",
            negara: "Indonesia",
            provinsiId: "",
            provinsi: "",
            kotaId: "",
            kota: "",
            alamat: "",
          });
        }
      });
      setParticipants(newParticipants);
    }
    setExpandedParticipant(0);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateParticipant = (index: number, field: string, value: any) => {
    const updated = [...participants];
    if (["noWA", "waDarurat", "nik"].includes(field)) {
      updated[index][field] = value.replace(/\D/g, "");
    } else if (field === "namaBib") {
      updated[index][field] = value.toUpperCase().slice(0, 12);
    } else {
      updated[index][field] = value;
    }
    setParticipants(updated);
  };

  const copyPemesanToParticipant = (index: number, isChecked: boolean) => {
    const updated = [...participants];
    updated[index].isCopiedFromPemesan = isChecked;
    if (isChecked) {
      updated[index].namaLengkap = `${pemesan.namaDepan} ${pemesan.namaBelakang}`.trim();
      updated[index].email = pemesan.email;
      updated[index].noWACode = pemesan.noWACode;
      updated[index].noWA = pemesan.noWA;
    } else {
      updated[index].namaLengkap = "";
      updated[index].email = "";
      updated[index].noWACode = "+62";
      updated[index].noWA = "";
    }
    setParticipants(updated);
  }

  const handleLanjutStep3 = () => {
    if (!pemesan.namaDepan || !pemesan.email || !pemesan.noWA) {
      return setModal({ isOpen: true, type: "warning", title: "Data Pemesan Belum Lengkap", message: "Mohon lengkapi Data Pemesan terlebih dahulu." });
    }

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.namaLengkap || !p.email || !p.noWA || !p.nik || !p.namaBib || !p.ukuranJersey || !p.golonganDarah || !p.namaDarurat || !p.waDarurat || !p.hubunganDarurat || !p.tanggalLahir || !p.jenisKelamin || !p.negara || (p.negara === "Indonesia" && (!p.provinsi || !p.kota)) || !p.alamat) {
        setExpandedParticipant(i);
        return setModal({ isOpen: true, type: "warning", title: `Data Detail Tiket ${i+1} Belum Lengkap`, message: "Mohon lengkapi semua field bertanda bintang (*)." });
      }
      if (p.nik.length < 10) {
        setExpandedParticipant(i);
        return setModal({ isOpen: true, type: "warning", title: `NIK Detail Tiket ${i+1} Tidak Valid`, message: "Pastikan NIK berisi minimal 10 angka." });
      }
    }

    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitAll = async () => {
    if (!agreeSnC || !agreeAsuransi) {
      return setModal({ isOpen: true, type: "warning", title: "Persetujuan Diperlukan", message: "Anda harus menyetujui Syarat & Ketentuan serta Asuransi untuk melanjutkan." });
    }

    if (!executeRecaptcha) return;
    setIsSubmitting(true);

    try {
      const token = await executeRecaptcha("offline_registration_bulk");
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: pemesan.email }),
      });
      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        setIsSubmitting(false);
        return setModal({ isOpen: true, type: "error", title: "Gagal Verifikasi", message: "Sistem mendeteksi aktivitas tidak wajar (reCAPTCHA)." });
      }

      const orderId = "ORD-" + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const subtotal = calculateSubtotal();
      const totalSemuaTagihan = subtotal - promoDiscount + (Number(donasi) || 0);
      
      let masterDocId = "";

      for (let i = 0; i < participants.length; i++) {
        const isUtama = i === 0;
        const p = participants[i];
        
        const finalData = {
          ...p,
          noWA: `${p.noWACode}${p.noWA}`,
          waDarurat: `${p.waDaruratCode}${p.waDarurat}`,
          isUtama,
          orderIdGroup: orderId,
          totalTagihan: isUtama ? totalSemuaTagihan : 0, 
          statusPembayaran: "Pending",
          waktuDaftar: new Date().toISOString(),
          nomorBIB: "",
          ...(isUtama ? {
            pemesan_namaDepan: pemesan.namaDepan,
            pemesan_namaBelakang: pemesan.namaBelakang,
            pemesan_email: pemesan.email,
            pemesan_noWA: `${pemesan.noWACode}${pemesan.noWA}`,
            subtotalPesanan: subtotal,
            kodePromoDipakai: promoDiscount > 0 ? promoCode : "",
            totalDiskon: promoDiscount,
            donasiCharity: Number(donasi) || 0
          } : {})
        };

        const docRef = await addDoc(collection(db, "offline_participants"), finalData);
        if (isUtama) masterDocId = docRef.id;
      }
      
      sendEmailAction({
        type: "offline_registration",
        email: pemesan.email,
        nama: `${pemesan.namaDepan} ${pemesan.namaBelakang}`.trim(),
        detail: {
          id: masterDocId,
          totalTagihan: totalSemuaTagihan,
          bank: settings?.manualBank || "Bank Transfer",
          rekening: settings?.manualRekening || "-",
          atasNama: settings?.manualNama || "DPW IKA UII DIY",
        },
      }).catch(console.error);

      localStorage.removeItem("ikadiy_run_form");
      router.push(`/run/checkout/${masterDocId}`);

    } catch (err) {
      console.error(err);
      setModal({ isOpen: true, type: "error", title: "Gagal Menyimpan", message: "Terjadi kesalahan sistem, silakan coba beberapa saat lagi." });
      setIsSubmitting(false);
    }
  };

  const jerseySizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans relative selection:bg-[#FCD116] selection:text-[#0B2239]">
      <RunNavbar eventName={settings?.offlineJudul} solid={true} />

      <div className="pt-24 pb-20">
        <Stepper currentStep={step} />

        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="lg:col-span-8 space-y-6">
            
            <div className="bg-white rounded-[8px] p-5 shadow-sm border border-slate-100 flex items-center gap-5">
              <div className="w-16 h-16 bg-slate-50 rounded-lg border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center p-2">
                <img src="/logo-dpp-ika.png" alt="Logo" className="w-full h-auto object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#0B2239]">{settings?.offlineJudul || "IKA UII DIY RUN"}</h1>
                <div className="flex items-center gap-4 mt-1.5 text-[12px] font-medium text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {settings?.offlineDate ? new Date(settings.offlineDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    {settings?.offlineTime || "05:00"} WIB
                  </span>
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="animate-in fade-in duration-500">
                <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 divide-y divide-slate-100">
                  {packages.map((pkg: any) => {
                    const qty = selectedTickets[pkg.id] || 0;
                    const batasKuota = Number(pkg.kuota) || 0;
                    const terisi = packageCounts[pkg.id] || 0;
                    const sisa = batasKuota < 0 ? "Unlimited" : Math.max(0, batasKuota - terisi);
                    const isHabis = batasKuota >= 0 && sisa === 0;

                    let harga = Number(pkg.harga || 0);
                    if (pkg.isEarlyBird && (Number(pkg.earlyBirdTarget) === 0 || terisi < Number(pkg.earlyBirdTarget))) {
                      harga = Number(pkg.earlyBirdHarga || pkg.harga);
                    }

                    return (
                      <div key={pkg.id} className={`p-6 transition-colors ${qty > 0 ? 'bg-blue-50/20' : 'hover:bg-slate-50/50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-[16px] font-bold text-[#0B2239]">{pkg.nama}</h3>
                            <p className="text-[12px] font-medium text-slate-500 mt-0.5">{pkg.jarak}</p>
                          </div>
                          {pkg.isEarlyBird && <span className="bg-[#FCD116]/20 text-[#B8960C] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Early Bird</span>}
                        </div>
                        
                        <div className="flex items-center justify-between mt-6">
                          <div>
                             <p className="text-[18px] font-bold text-[#1A73E8]">
                              Rp {harga.toLocaleString("id-ID")}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium text-emerald-600">
                              Sisa {sisa} tiket
                            </div>
                          </div>
                          
                          {isHabis ? (
                            <span className="text-[12px] font-bold text-rose-500 px-3 py-1 bg-rose-50 rounded-md">Habis Terjual</span>
                          ) : (
                            <div className="flex items-center gap-4">
                              <button onClick={() => handleTicketChange(pkg.id, -1)} disabled={qty === 0} className="w-8 h-8 rounded border border-slate-300 text-slate-500 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/></svg>
                              </button>
                              <span className="w-4 text-center font-bold text-[15px] text-[#0B2239]">{qty}</span>
                              <button onClick={() => handleTicketChange(pkg.id, 1)} disabled={batasKuota >= 0 && typeof sisa === "number" && qty >= sisa} className="w-8 h-8 rounded bg-[#1A73E8] text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition-colors shadow-sm">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-in fade-in duration-500 space-y-6">
                
                <div>
                  <h2 className="text-[14px] font-bold text-slate-500 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    Data Pemesan
                  </h2>
                  <div className="bg-white p-6 rounded-[8px] shadow-sm border border-slate-100">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Nama Depan<span className="text-rose-500">*</span></label>
                        <input type="text" value={pemesan.namaDepan || ""} onChange={(e) => setPemesan({...pemesan, namaDepan: e.target.value})} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Masukkan nama depan" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Nama Belakang<span className="text-rose-500">*</span></label>
                        <input type="text" value={pemesan.namaBelakang || ""} onChange={(e) => setPemesan({...pemesan, namaBelakang: e.target.value})} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Masukkan nama belakang" />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Email<span className="text-rose-500">*</span></label>
                      <input type="email" value={pemesan.email || ""} onChange={(e) => setPemesan({...pemesan, email: e.target.value})} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Masukkan email anda" />
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">No. WhatsApp<span className="text-rose-500">*</span></label>
                      <div className="flex gap-2">
                        <SearchableSelect 
                          className="w-[140px] flex-shrink-0"
                          options={COUNTRY_CODES}
                          value={pemesan.noWACode || "+62"}
                          onChange={(val: string) => setPemesan({...pemesan, noWACode: val})}
                        />
                        <input type="tel" value={pemesan.noWA || ""} onChange={(e) => setPemesan({...pemesan, noWA: e.target.value.replace(/\D/g, "")})} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="8123456789" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {participants.map((p, idx) => (
                    <div key={idx} className="bg-white rounded-[8px] shadow-sm border border-slate-100 overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-[14px] font-bold text-slate-500 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
                          Detail Tiket - {idx + 1}
                        </h2>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={p.isCopiedFromPemesan || false} onChange={(e) => copyPemesanToParticipant(idx, e.target.checked)} className="rounded border-slate-300 text-[#1A73E8] focus:ring-[#1A73E8] w-4 h-4" />
                          <span className="text-[11px] font-medium text-slate-500">Sama dengan data pemesan</span>
                        </label>
                      </div>

                      <div className="p-6 space-y-4">
                        
                        <div className="bg-slate-50/50 p-3 rounded border border-slate-100 mb-2">
                          <p className="text-[12px] font-bold text-[#0B2239]">Kategori</p>
                          <p className="text-[13px] font-medium text-slate-500">{(p.paketNama || "").toUpperCase()}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Nama Lengkap<span className="text-rose-500">*</span></label>
                            <input type="text" value={p.namaLengkap || ""} onChange={(e) => updateParticipant(idx, "namaLengkap", e.target.value)} disabled={p.isCopiedFromPemesan} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none disabled:bg-slate-50" placeholder="Masukkan nama" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">E-Mail<span className="text-rose-500">*</span></label>
                          <input type="email" value={p.email || ""} onChange={(e) => updateParticipant(idx, "email", e.target.value)} disabled={p.isCopiedFromPemesan} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none disabled:bg-slate-50" placeholder="Masukkan email anda" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">No. WhatsApp<span className="text-rose-500">*</span></label>
                          <div className="flex gap-2">
                            <SearchableSelect 
                              className="w-[140px] flex-shrink-0"
                              disabled={p.isCopiedFromPemesan}
                              options={COUNTRY_CODES}
                              value={p.noWACode || "+62"}
                              onChange={(val: string) => updateParticipant(idx, "noWACode", val)}
                            />
                            <input type="tel" value={p.noWA || ""} onChange={(e) => updateParticipant(idx, "noWA", e.target.value)} disabled={p.isCopiedFromPemesan} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none disabled:bg-slate-50" placeholder="8123456789" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Tanggal Lahir<span className="text-rose-500">*</span></label>
                          <input type="date" value={p.tanggalLahir || ""} onChange={(e) => updateParticipant(idx, "tanggalLahir", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Jenis Kelamin<span className="text-rose-500">*</span></label>
                          <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-[13px] text-[#0B2239]">
                              <input type="radio" name={`kelamin-${idx}`} value="Laki-laki" checked={p.jenisKelamin === "Laki-laki"} onChange={(e) => updateParticipant(idx, "jenisKelamin", e.target.value)} /> Laki-laki
                            </label>
                            <label className="flex items-center gap-2 text-[13px] text-[#0B2239]">
                              <input type="radio" name={`kelamin-${idx}`} value="Perempuan" checked={p.jenisKelamin === "Perempuan"} onChange={(e) => updateParticipant(idx, "jenisKelamin", e.target.value)} /> Perempuan
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Nama BIB<span className="text-rose-500">*</span></label>
                          <input type="text" maxLength={12} value={p.namaBib || ""} onChange={(e) => updateParticipant(idx, "namaBib", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] font-mono uppercase focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="MAX 12 HURUF" />
                        </div>

                        <div className="pt-2">
                          <div className="flex justify-between items-center mb-2">
                            <label className="block text-[12px] font-bold text-[#0B2239]">Ukuran Jersey<span className="text-rose-500">*</span></label>
                            <span onClick={() => setShowSizeChart(true)} className="text-[11px] text-[#1A73E8] font-bold cursor-pointer hover:underline">View Size Chart</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {jerseySizes.map(sz => (
                              <label key={sz} className="cursor-pointer">
                                <input type="radio" name={`jersey-${idx}`} value={sz} checked={p.ukuranJersey === sz} onChange={(e) => updateParticipant(idx, "ukuranJersey", e.target.value)} className="hidden" />
                                <div className={`w-10 h-10 flex items-center justify-center border rounded text-[12px] font-bold transition-all ${p.ukuranJersey === sz ? "border-[#1A73E8] bg-blue-50 text-[#1A73E8]" : "border-slate-200 text-[#0B2239] hover:border-[#1A73E8]"}`}>
                                  {sz}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Negara<span className="text-rose-500">*</span></label>
                              <SearchableSelect 
                                options={NEGARA_OPTIONS}
                                value={p.negara || "Indonesia"}
                                onChange={(val: string) => {
                                  updateParticipant(idx, "negara", val);
                                  if (val !== "Indonesia") {
                                    updateParticipant(idx, "provinsiId", "");
                                    updateParticipant(idx, "provinsi", "");
                                    updateParticipant(idx, "kotaId", "");
                                    updateParticipant(idx, "kota", "");
                                  }
                                }}
                                placeholder="Pilih Negara"
                              />
                            </div>
                            
                            {p.negara === "Indonesia" && (
                              <div>
                                <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Provinsi<span className="text-rose-500">*</span></label>
                                <SearchableSelect 
                                  options={provinces.map((pr: any) => ({ value: pr.id, label: pr.nama }))}
                                  value={p.provinsiId || ""}
                                  onChange={(val: string) => {
                                    const provName = provinces.find((x: any) => x.id === val)?.nama || "";
                                    updateParticipant(idx, "provinsiId", val);
                                    updateParticipant(idx, "provinsi", provName);
                                    updateParticipant(idx, "kotaId", "");
                                    updateParticipant(idx, "kota", "");
                                  }}
                                  placeholder="Pilih Provinsi"
                                />
                              </div>
                            )}
                          </div>
                          
                          {p.negara === "Indonesia" && (
                            <div className="mt-4">
                              <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Kota/Kabupaten<span className="text-rose-500">*</span></label>
                              <SearchableSelect 
                                options={(citiesCache[p.provinsiId] || []).map((c: any) => ({ value: c.id, label: c.nama }))}
                                value={p.kotaId || ""}
                                disabled={!p.provinsiId}
                                onChange={(val: string) => {
                                  const cityName = (citiesCache[p.provinsiId] || []).find((x: any) => x.id === val)?.nama || "";
                                  updateParticipant(idx, "kotaId", val);
                                  updateParticipant(idx, "kota", cityName);
                                }}
                                placeholder={p.provinsiId ? "Pilih Kota" : "Pilih provinsi dulu"}
                              />
                            </div>
                          )}

                          {p.negara !== "Indonesia" && (
                            <div className="mt-4">
                              <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Kota / Provinsi<span className="text-rose-500">*</span></label>
                              <input type="text" value={p.kota || ""} onChange={(e) => updateParticipant(idx, "kota", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Ketik region/kota" />
                            </div>
                          )}

                          <div className="mt-4">
                            <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Alamat Lengkap<span className="text-rose-500">*</span></label>
                            <textarea value={p.alamat || ""} onChange={(e) => updateParticipant(idx, "alamat", e.target.value)} rows={3} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none text-[#0B2239]" placeholder="Detail jalan, gang, RT/RW..."></textarea>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Tipe Identitas<span className="text-rose-500">*</span></label>
                            <select value={p.jenisIdentitas || "KTP"} onChange={(e) => updateParticipant(idx, "jenisIdentitas", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none text-[#0B2239]">
                              <option value="KTP">KTP</option>
                              <option value="SIM">SIM</option>
                              <option value="Paspor">Paspor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Nomor Identitas<span className="text-rose-500">*</span></label>
                            <input type="text" maxLength={16} value={p.nik || ""} onChange={(e) => updateParticipant(idx, "nik", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Masukkan nomor identitas" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Nama Kontak Darurat<span className="text-rose-500">*</span></label>
                          <input type="text" value={p.namaDarurat || ""} onChange={(e) => updateParticipant(idx, "namaDarurat", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Masukkan nama kontak darurat" />
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Nomor Kontak Darurat<span className="text-rose-500">*</span></label>
                          <div className="flex gap-2">
                            <SearchableSelect 
                              className="w-[140px] flex-shrink-0"
                              options={COUNTRY_CODES}
                              value={p.waDaruratCode || "+62"}
                              onChange={(val: string) => updateParticipant(idx, "waDaruratCode", val)}
                            />
                            <input type="tel" value={p.waDarurat || ""} onChange={(e) => updateParticipant(idx, "waDarurat", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="8123456789" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Hubungan dengan Kontak Darurat<span className="text-rose-500">*</span></label>
                          <select value={p.hubunganDarurat || ""} onChange={(e) => updateParticipant(idx, "hubunganDarurat", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none text-[#0B2239]">
                            <option value="">Pilih hubungan</option>
                            <option value="Orang Tua">Orang Tua</option>
                            <option value="Suami/Istri">Suami/Istri</option>
                            <option value="Anak">Anak</option>
                            <option value="Saudara">Saudara</option>
                            <option value="Teman">Teman</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Nama Komunitas</label>
                          <input type="text" value={p.komunitas || ""} onChange={(e) => updateParticipant(idx, "komunitas", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Masukkan nama komunitas (opsional)" />
                        </div>
                        
                        <div>
                          <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Golongan Darah<span className="text-rose-500">*</span></label>
                          <select value={p.golonganDarah || ""} onChange={(e) => updateParticipant(idx, "golonganDarah", e.target.value)} className="w-full bg-white border border-slate-200 rounded px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none text-[#0B2239]">
                            <option value="">Pilih golongan darah</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                            <option value="O">O</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-in fade-in duration-500 space-y-6">
                <div>
                  <h2 className="text-[14px] font-bold text-slate-500 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                    Review Data Pemesan
                  </h2>
                  <div className="bg-white p-6 rounded-[8px] shadow-sm border border-slate-100 space-y-2 text-[13px] text-[#0B2239]">
                    <p><strong>Nama:</strong> {pemesan.namaDepan} {pemesan.namaBelakang}</p>
                    <p><strong>Email:</strong> {pemesan.email}</p>
                    <p><strong>No WhatsApp:</strong> {pemesan.noWACode}{pemesan.noWA}</p>
                  </div>
                </div>

                <div>
                  <h2 className="text-[14px] font-bold text-slate-500 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
                    Review Detail Tiket
                  </h2>
                  <div className="space-y-4">
                    {participants.map((p, idx) => (
                      <div key={idx} className="bg-white p-6 rounded-[8px] shadow-sm border border-slate-100 text-[13px] text-[#0B2239] space-y-2">
                        <h3 className="font-bold text-[#1A73E8] text-[14px] border-b border-slate-100 pb-2 mb-3">Tiket {idx + 1}: {p.paketNama}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p><span className="text-slate-500">Nama Lengkap:</span><br/> <strong>{p.namaLengkap}</strong></p>
                            <p><span className="text-slate-500">Nama BIB:</span><br/> <strong>{p.namaBib}</strong></p>
                            <p><span className="text-slate-500">Jenis Kelamin:</span><br/> <strong>{p.jenisKelamin}</strong></p>
                            <p><span className="text-slate-500">Ukuran Jersey:</span><br/> <strong>{p.ukuranJersey}</strong></p>
                            <p><span className="text-slate-500">Gol. Darah:</span><br/> <strong>{p.golonganDarah}</strong></p>
                          </div>
                          <div className="space-y-1">
                            <p><span className="text-slate-500">{p.jenisIdentitas}:</span><br/> <strong>{p.nik}</strong></p>
                            <p><span className="text-slate-500">Email:</span><br/> <strong>{p.email}</strong></p>
                            <p><span className="text-slate-500">No WhatsApp:</span><br/> <strong>{p.noWACode}{p.noWA}</strong></p>
                            <p><span className="text-slate-500">Alamat:</span><br/> <strong>{p.alamat}, {p.kota}, {p.negara}</strong></p>
                            <p><span className="text-slate-500">Kontak Darurat:</span><br/> <strong>{p.namaDarurat} ({p.hubunganDarurat})<br/>{p.waDaruratCode}{p.waDarurat}</strong></p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-4 mt-8 lg:mt-0 relative">
            <div className="bg-white rounded-[8px] shadow-sm border border-slate-100 p-5 sticky top-24">
              <h2 className="text-[14px] font-bold text-[#0B2239] mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                Rincian Pesanan
              </h2>

              <div className="space-y-3 mb-4">
                {Object.entries(selectedTickets).map(([pkgId, qty]) => {
                  if (qty === 0) return null;
                  const pkg = packages.find(p => p.id === pkgId);
                  if (!pkg) return null;
                  
                  let harga = Number(pkg.harga || 0);
                  if (pkg.isEarlyBird) {
                    const terisi = packageCounts[pkgId] || 0;
                    const target = Number(pkg.earlyBirdTarget);
                    if (target > 0 && terisi < target) harga = Number(pkg.earlyBirdHarga || pkg.harga);
                  }

                  return (
                    <div key={pkgId} className="flex justify-between items-start text-[13px]">
                      <div>
                        <p className="font-bold text-[#0B2239] uppercase">{pkg.jarak} {pkg.nama.toUpperCase()}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{qty}x tiket dipesan</p>
                      </div>
                      <p className="font-bold text-[#0B2239]">Rp {(harga * qty).toLocaleString("id-ID")}</p>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 mb-4 border-t border-slate-100 pt-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#0B2239]">Punya Kode Promo?</label>
                  <div className="flex gap-2">
                    <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-[12px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Masukkan kode promo" />
                    <button onClick={handleApplyPromo} className="bg-[#0B2239] text-white px-3 py-1.5 rounded text-[12px] font-bold shrink-0">Terapkan</button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-bold text-[#0B2239]">Program Charity (Opsional)</label>
                  <input type="text" value={donasi} onChange={(e) => setDonasi(e.target.value ? Number(e.target.value.replace(/\D/g, "")) : "")} className="w-full bg-white border border-slate-200 rounded px-3 py-1.5 text-[12px] focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] outline-none" placeholder="Nominal Donasi (Rp)" />
                </div>
              </div>

              <div className="space-y-2 text-[12px] mb-4 border-t border-slate-100 pt-4">
                <div className="flex justify-between text-[#0B2239] font-bold">
                  <span>Sub Total</span>
                  <span>Rp {calculateSubtotal().toLocaleString("id-ID")}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Promo</span>
                    <span>-Rp {promoDiscount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {donasi && donasi > 0 ? (
                  <div className="flex justify-between text-[#0B2239]">
                    <span>Donasi Charity</span>
                    <span>Rp {Number(donasi).toLocaleString("id-ID")}</span>
                  </div>
                ) : null}
              </div>
              
              <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-100">
                <span className="font-bold text-[#0B2239] text-[13px]">Grand Total</span>
                <span className="font-bold text-[#0B2239] text-[15px]">Rp {(calculateSubtotal() - promoDiscount + (Number(donasi) || 0)).toLocaleString("id-ID")}</span>
              </div>

              {step === 1 ? (
                <button 
                  onClick={handleLanjutStep2}
                  className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white text-[13px] font-bold py-2.5 rounded transition-colors flex items-center justify-center gap-2"
                >
                  Lengkapi Data Diri
                </button>
              ) : step === 2 ? (
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleLanjutStep3}
                    className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white text-[13px] font-bold py-2.5 rounded transition-colors"
                  >
                    Lanjut ke Review
                  </button>
                  <button 
                    onClick={() => setStep(1)}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[13px] font-bold py-2.5 rounded transition-colors"
                  >
                    Kembali
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2 mb-2 bg-[#F4F7FB] p-3 rounded border border-[#E1E8F0]">
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={agreeSnC} onChange={(e) => setAgreeSnC(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-[#1A73E8] focus:ring-[#1A73E8]" />
                      <span className="text-[11px] text-slate-600 leading-tight">Bersedia mematuhi syarat & ketentuan Offline Run beserta sanksinya.</span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                      <input type="checkbox" checked={agreeAsuransi} onChange={(e) => setAgreeAsuransi(e.target.checked)} className="mt-0.5 rounded border-slate-300 text-[#1A73E8] focus:ring-[#1A73E8]" />
                      <span className="text-[11px] text-slate-600 leading-tight">Saya telah membaca dan menyetujui informasi asuransi yang berlaku.</span>
                    </label>
                  </div>
                  <button 
                    onClick={handleSubmitAll}
                    disabled={isSubmitting}
                    className="w-full bg-[#1A73E8] hover:bg-blue-700 disabled:opacity-50 text-white text-[13px] font-bold py-2.5 rounded transition-colors"
                  >
                    {isSubmitting ? "Memproses..." : "Pilih Metode Pembayaran"}
                  </button>
                  <button 
                    onClick={() => setStep(2)}
                    className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-[13px] font-bold py-2.5 rounded transition-colors"
                  >
                    Kembali Perbaiki Data
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <RunFooter eventName={settings?.offlineJudul} waChannelUrl={settings?.waGroupUrl} sosmeds={settings?.sosmeds} />

      {/* MODAL SIZE CHART */}
      {showSizeChart && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowSizeChart(false)}>
          <div className="bg-white rounded-xl p-2 max-w-lg w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowSizeChart(false)} className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-800 rounded-full flex items-center justify-center font-bold shadow-md hover:bg-slate-100 z-10">✕</button>
            <div className="overflow-hidden rounded-lg">
              {settings?.offlineSizeChartUrl ? (
                <img src={settings.offlineSizeChartUrl} alt="Size Chart" className="w-full h-auto object-contain" />
              ) : (
                <div className="p-8 text-center text-slate-500 font-medium">Image size chart belum ditambahkan oleh Admin.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-[320px] w-full shadow-2xl">
            <h3 className="font-bold text-[#0B2239] text-[15px] mb-2">{modal.title}</h3>
            <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white text-[13px] py-2.5 rounded font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
