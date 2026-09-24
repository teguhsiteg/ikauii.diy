const fs = require('fs');

const code = `
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, addDoc, query, where, getCountFromServer } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { sendEmailAction } from "@/app/actions/email";

// --- KOMPONEN STEPPER ---
const Stepper = ({ currentStep }: { currentStep: number }) => {
  const steps = ["Pilih Tiket", "Data Peserta", "Selesai"];
  return (
    <div className="flex items-center justify-center w-full max-w-sm mx-auto mb-6 relative z-10">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep >= stepNum;
        const isCurrent = currentStep === stepNum;
        return (
          <div key={idx} className="flex flex-col items-center relative z-10 flex-1">
            <div
              className={\`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 \${
                isActive
                  ? "bg-[#FCD116] text-[#0B2239] shadow-[0_0_15px_rgba(252,209,22,0.4)] scale-110"
                  : "bg-white/20 text-white/50"
              }\`}
            >
              {stepNum}
            </div>
            <p
              className={\`text-[9px] mt-2 font-medium uppercase tracking-widest \${
                isActive ? "text-white" : "text-white/50"
              }\`}
            >
              {step}
            </p>
            {idx < steps.length - 1 && (
              <div
                className={\`absolute top-3 left-[50%] w-full h-[1px] -z-10 \${
                  currentStep > stepNum ? "bg-[#FCD116]" : "bg-white/20"
                }\`}
              />
            )}
          </div>
        );
      })}
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
  const [participants, setParticipants] = useState<any[]>([]);
  const [expandedParticipant, setExpandedParticipant] = useState<number>(0);

  const [modal, setModal] = useState({ isOpen: false, type: "info", title: "", message: "" });

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
                const q = query(
                  collection(db, "offline_participants"),
                  where("paketId", "==", pkg.id),
                  where("statusPembayaran", "==", "Lunas")
                );
                const snapshot = await getCountFromServer(q);
                counts[pkg.id] = snapshot.data().count;
              })
            );
            setPackageCounts(counts);

            if (defaultPaketId) {
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

  const handleLanjutStep2 = () => {
    if (totalTickets === 0) {
      return setModal({ isOpen: true, type: "warning", title: "Pilih Kategori", message: "Silakan tentukan jumlah tiket terlebih dahulu." });
    }
    
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
          noWA: "",
          jenisIdentitas: "KTP",
          nik: "",
          namaBib: "",
          ukuranJersey: "",
          golonganDarah: "",
          riwayatPenyakit: "",
          namaDarurat: "",
          hubunganDarurat: "",
          waDarurat: "",
          komunitas: "",
        });
      }
    });
    
    setParticipants(newParticipants);
    setExpandedParticipant(0);
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateParticipant = (index: number, field: string, value: any) => {
    const updated = [...participants];
    if (["noWA", "waDarurat", "nik"].includes(field)) {
      updated[index][field] = value.replace(/\\D/g, "");
    } else if (field === "namaBib") {
      updated[index][field] = value.toUpperCase().slice(0, 12);
    } else {
      updated[index][field] = value;
    }
    setParticipants(updated);
  };

  const handleSubmitAll = async () => {
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.namaLengkap || !p.email || !p.noWA || !p.nik || !p.namaBib || !p.ukuranJersey || !p.golonganDarah || !p.namaDarurat || !p.waDarurat) {
        setExpandedParticipant(i);
        return setModal({ isOpen: true, type: "warning", title: "Data Tidak Lengkap", message: \`Mohon lengkapi formulir Peserta \${i+1} terlebih dahulu.\` });
      }
      if (p.nik.length < 10) {
        setExpandedParticipant(i);
        return setModal({ isOpen: true, type: "warning", title: "NIK Tidak Valid", message: "Pastikan NIK berisi minimal 10 angka." });
      }
    }

    if (!executeRecaptcha) return;
    setIsSubmitting(true);

    try {
      const token = await executeRecaptcha("offline_registration_bulk");
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: participants[0].email }),
      });
      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        setIsSubmitting(false);
        return setModal({ isOpen: true, type: "error", title: "Gagal Verifikasi", message: "Sistem mendeteksi aktivitas tidak wajar (reCAPTCHA)." });
      }

      const orderId = "ORD-" + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const totalSemuaTagihan = calculateSubtotal();
      
      let masterDocId = "";

      for (let i = 0; i < participants.length; i++) {
        const isUtama = i === 0;
        const p = participants[i];
        
        const finalData = {
          ...p,
          isUtama,
          orderIdGroup: orderId,
          totalTagihan: isUtama ? totalSemuaTagihan : 0, 
          statusPembayaran: "Pending",
          waktuDaftar: new Date().toISOString(),
          nomorBIB: "",
        };

        const docRef = await addDoc(collection(db, "offline_participants"), finalData);
        if (isUtama) masterDocId = docRef.id;
      }
      
      sendEmailAction({
        type: "offline_registration",
        email: participants[0].email,
        nama: participants[0].namaLengkap,
        detail: {
          id: masterDocId,
          totalTagihan: totalSemuaTagihan,
          bank: settings?.manualBank || "Bank Transfer",
          rekening: settings?.manualRekening || "-",
          atasNama: settings?.manualNama || "DPW IKA UII DIY",
        },
      }).catch(console.error);

      router.push(\`/run/checkout/\${masterDocId}\`);

    } catch (err) {
      console.error(err);
      setModal({ isOpen: true, type: "error", title: "Gagal Menyimpan", message: "Terjadi kesalahan sistem, silakan coba beberapa saat lagi." });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-[#0B2239] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans relative selection:bg-[#FCD116] selection:text-[#0B2239] pb-32">
      {/* HEADER MELENGKUNG (LEBIH SLEEK & MINIMALIS) */}
      <div className="bg-[#0B2239] pt-8 pb-24 px-6 rounded-b-[32px] shadow-[0_10px_30px_rgba(11,34,57,0.1)] relative overflow-hidden">
        <div className="max-w-xl mx-auto relative z-10 flex flex-col">
          <Link href="/run" className="text-white/60 hover:text-white mb-6 text-[11px] font-medium flex items-center gap-1.5 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
            Kembali
          </Link>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-white tracking-tight">Booking Tiket</h1>
              <p className="text-white/60 text-xs mt-1 font-light">IKA UII DIY RUN</p>
            </div>
            <div className="text-right">
              <span className="text-[#FCD116] font-bold text-xs">Official</span>
            </div>
          </div>
          <Stepper currentStep={step} />
        </div>
      </div>

      {/* AREA KONTEN UTAMA */}
      <div className="max-w-xl mx-auto px-4 -mt-14 relative z-20">
        
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            {packages.map((pkg: any, index: number) => {
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
                <div key={pkg.id} className={\`p-6 \${index !== packages.length - 1 ? 'border-b border-slate-50' : ''} transition-colors \${qty > 0 ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}\`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-[17px] font-semibold text-[#0B2239]">{pkg.nama}</h3>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{pkg.jarak}</p>
                    </div>
                    {pkg.isEarlyBird && <span className="bg-[#FCD116]/20 text-[#B8960C] text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Promo</span>}
                  </div>
                  
                  <div className="flex items-center gap-1.5 mb-5 text-[11px] font-medium text-slate-500">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M11 11h2v6h-2zm0-4h2v2h-2z"/></svg>
                    Tersedia {sisa} kursi
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-[15px] font-bold text-[#1A73E8]">
                      Rp {harga.toLocaleString("id-ID")} <span className="text-slate-400 font-normal text-[10px]">/ tiket</span>
                    </p>
                    
                    {isHabis ? (
                      <span className="text-[11px] font-semibold text-rose-400 px-2 py-1 bg-rose-50 rounded-md">Habis Terjual</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleTicketChange(pkg.id, -1)} disabled={qty === 0} className="w-7 h-7 rounded-full border border-slate-200 text-slate-400 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50 hover:text-slate-600 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4"/></svg>
                        </button>
                        <span className="w-3 text-center font-semibold text-[15px] text-[#0B2239]">{qty}</span>
                        <button onClick={() => handleTicketChange(pkg.id, 1)} disabled={batasKuota >= 0 && qty >= sisa} className="w-7 h-7 rounded-full bg-[#0B2239] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#1A3A5F] transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="p-5 bg-slate-50/50 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-[#0B2239]">Detail Penumpang</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Harap isi sesuai identitas KTP/Paspor</p>
            </div>

            {participants.map((p, idx) => (
              <div key={idx} className={\`\${idx !== participants.length - 1 ? 'border-b border-slate-100' : ''}\`}>
                <button 
                  onClick={() => setExpandedParticipant(expandedParticipant === idx ? -1 : idx)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={\`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold \${expandedParticipant === idx ? 'bg-[#0B2239] text-white' : 'bg-slate-100 text-slate-500'}\`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#0B2239]">
                        {p.namaLengkap || (idx === 0 ? "Peserta Utama" : \`Peserta \${idx + 1}\`)}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.paketNama}</p>
                    </div>
                  </div>
                  <svg className={\`w-4 h-4 text-slate-400 transform transition-transform duration-300 \${expandedParticipant === idx ? "rotate-180" : ""}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                
                <div className={\`overflow-hidden transition-all duration-300 \${expandedParticipant === idx ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}\`}>
                  <div className="px-5 pb-6 pt-2 space-y-4">
                    
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Nama Lengkap Sesuai KTP <span className="text-rose-500">*</span></label>
                      <input type="text" value={p.namaLengkap} onChange={(e) => updateParticipant(idx, "namaLengkap", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none transition-colors" required placeholder="Cth: Budi Santoso" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Email <span className="text-rose-500">*</span></label>
                        <input type="email" value={p.email} onChange={(e) => updateParticipant(idx, "email", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none" required placeholder="budi@email.com" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1.5">No. WhatsApp <span className="text-rose-500">*</span></label>
                        <input type="tel" value={p.noWA} onChange={(e) => updateParticipant(idx, "noWA", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none" required placeholder="08123456789" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1.5">No. Identitas (NIK) <span className="text-rose-500">*</span></label>
                        <input type="text" maxLength={16} value={p.nik} onChange={(e) => updateParticipant(idx, "nik", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none" required placeholder="3404XXXXXXXXXXXX" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Nama di BIB <span className="text-rose-500">*</span></label>
                        <input type="text" maxLength={12} value={p.namaBib} onChange={(e) => updateParticipant(idx, "namaBib", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none font-mono uppercase" required placeholder="MAX 12 HURUF" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Ukuran Jersey <span className="text-rose-500">*</span></label>
                        <select value={p.ukuranJersey} onChange={(e) => updateParticipant(idx, "ukuranJersey", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none appearance-none" required>
                          <option value="" disabled>Pilih Ukuran</option>
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Gol. Darah <span className="text-rose-500">*</span></label>
                        <select value={p.golonganDarah} onChange={(e) => updateParticipant(idx, "golonganDarah", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none appearance-none" required>
                          <option value="" disabled>Pilih</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Kontak Darurat</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1.5">Nama Kontak <span className="text-rose-500">*</span></label>
                          <input type="text" value={p.namaDarurat} onChange={(e) => updateParticipant(idx, "namaDarurat", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none" required placeholder="Istri/Suami" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1.5">No. Telepon <span className="text-rose-500">*</span></label>
                          <input type="tel" value={p.waDarurat} onChange={(e) => updateParticipant(idx, "waDarurat", e.target.value)} className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-[13px] focus:ring-1 focus:ring-[#0B2239] focus:border-[#0B2239] outline-none" required placeholder="0812345..." />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* BOTTOM FIXED BAR (SLEEK) */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 px-6 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-medium mb-0.5">Total Harga</span>
            <span className="text-[17px] font-bold text-[#0B2239]">Rp {calculateSubtotal().toLocaleString("id-ID")}</span>
          </div>
          
          {step === 1 ? (
            <button 
              onClick={handleLanjutStep2}
              className="bg-[#0B2239] hover:bg-[#1A3A5F] text-white text-[13px] font-semibold py-3 px-6 rounded-2xl transition-colors flex items-center gap-2"
            >
              Lanjutkan
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setStep(1)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 text-[13px] font-semibold py-3 px-4 rounded-2xl transition-colors"
              >
                Ubah
              </button>
              <button 
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-50 text-white text-[13px] font-semibold py-3 px-6 rounded-2xl transition-colors flex items-center gap-2"
              >
                {isSubmitting ? "Loading..." : "Bayar Sekarang"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL MINIMALIS */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-[320px] w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className={\`w-8 h-8 rounded-full flex items-center justify-center \${modal.type === 'error' ? 'bg-rose-100 text-rose-500' : modal.type === 'warning' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-500'}\`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h3 className="font-semibold text-[#0B2239] text-[15px]">{modal.title}</h3>
            </div>
            <p className="text-[13px] text-slate-500 mb-6 leading-relaxed pl-11">{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="w-full bg-slate-50 hover:bg-slate-100 text-[#0B2239] text-[13px] py-3 rounded-xl font-semibold transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
`
fs.writeFileSync('app/run/daftar/page.tsx', code);
console.log("Written!");
