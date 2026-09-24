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
  const steps = ["Tiket", "Data Peserta", "Selesai"];
  return (
    <div className="flex items-center justify-center w-full max-w-md mx-auto mb-8 relative z-10">
      {steps.map((step, idx) => {
        const stepNum = idx + 1;
        const isActive = currentStep >= stepNum;
        const isCurrent = currentStep === stepNum;
        return (
          <div key={idx} className="flex flex-col items-center relative z-10 flex-1">
            <div
              className={\`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 \${
                isActive
                  ? "bg-[#FCD116] text-[#0B2239] shadow-lg shadow-[#FCD116]/30"
                  : "bg-white/20 text-white/50"
              }\`}
            >
              {stepNum}
            </div>
            <p
              className={\`text-[10px] mt-2 font-bold uppercase tracking-widest \${
                isActive ? "text-white" : "text-white/50"
              }\`}
            >
              {step}
            </p>
            {idx < steps.length - 1 && (
              <div
                className={\`absolute top-4 left-[60%] w-full h-[2px] -z-10 \${
                  currentStep > stepNum ? "bg-[#FCD116]" : "bg-white/10"
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
  
  // State untuk Step 1: Pilihan Tiket
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  
  // State untuk Step 2: Data Peserta
  const [participants, setParticipants] = useState<any[]>([]);
  const [expandedParticipant, setExpandedParticipant] = useState<number>(0);

  // Modal
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
            
            // Fetch kuota terisi
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
        // Cek Early Bird (simplified)
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
      return setModal({ isOpen: true, type: "warning", title: "Pilih Tiket", message: "Silakan pilih minimal 1 tiket untuk melanjutkan." });
    }
    
    // Generate empty participant forms based on selected tickets
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
    // Validasi basic
    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      if (!p.namaLengkap || !p.email || !p.noWA || !p.nik || !p.namaBib || !p.ukuranJersey || !p.golonganDarah || !p.namaDarurat || !p.waDarurat) {
        setExpandedParticipant(i);
        return setModal({ isOpen: true, type: "warning", title: \`Data Peserta \${i+1} Belum Lengkap\`, message: "Silakan lengkapi semua field yang wajib diisi." });
      }
      if (p.nik.length < 10) {
        setExpandedParticipant(i);
        return setModal({ isOpen: true, type: "warning", title: \`NIK Peserta \${i+1} Tidak Valid\`, message: "NIK minimal 10 digit angka." });
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
        return setModal({ isOpen: true, type: "error", title: "Aktivitas Mencurigakan", message: "Gagal verifikasi keamanan reCAPTCHA." });
      }

      // Generate Group ID (untuk menandai 1 transaksi)
      const orderId = "ORD-" + Date.now() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const totalSemuaTagihan = calculateSubtotal();
      
      const batchIds: string[] = [];
      let masterDocId = "";

      for (let i = 0; i < participants.length; i++) {
        const isUtama = i === 0;
        const p = participants[i];
        
        const finalData = {
          ...p,
          isUtama,
          orderIdGroup: orderId,
          totalTagihan: isUtama ? totalSemuaTagihan : 0, // Hanya pesanan utama yg menanggung tagihan
          statusPembayaran: "Pending",
          waktuDaftar: new Date().toISOString(),
          nomorBIB: "",
        };

        const docRef = await addDoc(collection(db, "offline_participants"), finalData);
        batchIds.push(docRef.id);
        if (isUtama) masterDocId = docRef.id;
      }

      // Update semua dengan anggotaIds agar terhubung jika diperlukan
      // Ini optional, krn mrk sdh pny orderIdGroup yg sama.
      
      // Kirim Email ke Pemesan Utama
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
      setModal({ isOpen: true, type: "error", title: "Gagal", message: "Terjadi kesalahan sistem saat mendaftar." });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B2239] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0B2239] border-t-[#FCD116] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans relative selection:bg-[#FCD116] selection:text-[#0B2239] pb-32">
      {/* HEADER BIRU */}
      <div className="bg-[#0B2239] pt-10 pb-20 px-6 rounded-b-[40px] shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-xl mx-auto relative z-10 flex flex-col items-center">
          <Link href="/run" className="text-white/70 hover:text-white self-start mb-4 text-xs font-bold flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            Kembali
          </Link>
          <h1 className="text-3xl font-black text-white text-center mb-8 tracking-tight">
            Pendaftaran Tiket
          </h1>
          <Stepper currentStep={step} />
        </div>
      </div>

      {/* KONTEN */}
      <div className="max-w-xl mx-auto px-4 -mt-10 relative z-20">
        
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
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
                <div key={pkg.id} className={\`bg-white p-5 rounded-[24px] shadow-sm border \${qty > 0 ? "border-[#FCD116] shadow-md ring-2 ring-[#FCD116]/20" : "border-slate-200"} transition-all\`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-black text-[#0B2239]">{pkg.nama}</h3>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{pkg.jarak}</p>
                    </div>
                    {pkg.isEarlyBird && <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-2 py-1 rounded uppercase">Early Bird</span>}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="bg-emerald-50 border border-emerald-100 px-2 py-1 rounded flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/><path d="M11 11h2v6h-2zm0-4h2v2h-2z"/></svg>
                      Sisa Kuota: {sisa}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-200">
                    <div>
                      <p className="text-sm font-black text-[#1A73E8]">Rp {harga.toLocaleString("id-ID")}</p>
                    </div>
                    
                    {isHabis ? (
                      <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg">HABIS</span>
                    ) : (
                      <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-full border border-slate-200">
                        <button onClick={() => handleTicketChange(pkg.id, -1)} disabled={qty === 0} className="w-8 h-8 rounded-full bg-white text-slate-600 shadow flex items-center justify-center disabled:opacity-50 font-bold">-</button>
                        <span className="w-4 text-center font-black text-sm">{qty}</span>
                        <button onClick={() => handleTicketChange(pkg.id, 1)} disabled={batasKuota >= 0 && qty >= sisa} className="w-8 h-8 rounded-full bg-[#0B2239] text-white shadow flex items-center justify-center disabled:opacity-50 font-bold">+</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-8 duration-500">
            {participants.map((p, idx) => (
              <div key={idx} className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-200">
                <button 
                  onClick={() => setExpandedParticipant(expandedParticipant === idx ? -1 : idx)}
                  className={\`w-full p-5 flex items-center justify-between text-left transition-colors \${expandedParticipant === idx ? "bg-slate-50 border-b border-slate-200" : ""}\`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0B2239] rounded-full flex items-center justify-center text-white font-black shadow-sm">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-sm text-[#0B2239]">
                        {idx === 0 ? "Peserta Utama" : \`Peserta \${idx + 1}\`}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.paketNama} - {p.jarak}</p>
                    </div>
                  </div>
                  <div>
                    <svg className={\`w-5 h-5 text-slate-400 transform transition-transform \${expandedParticipant === idx ? "rotate-180" : ""}\`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </div>
                </button>
                
                {expandedParticipant === idx && (
                  <div className="p-5 space-y-4 bg-white animate-in slide-in-from-top-2">
                    {/* Form Fields - Simplified for Demo */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap (Sesuai KTP) <span className="text-rose-500">*</span></label>
                      <input type="text" value={p.namaLengkap} onChange={(e) => updateParticipant(idx, "namaLengkap", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] focus:border-transparent outline-none transition-all" required placeholder="Cth: Budi Santoso" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Email <span className="text-rose-500">*</span></label>
                        <input type="email" value={p.email} onChange={(e) => updateParticipant(idx, "email", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] outline-none" required placeholder="budi@email.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">No. WhatsApp <span className="text-rose-500">*</span></label>
                        <input type="tel" value={p.noWA} onChange={(e) => updateParticipant(idx, "noWA", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] outline-none" required placeholder="08123456789" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">NIK (16 Digit) <span className="text-rose-500">*</span></label>
                        <input type="text" maxLength={16} value={p.nik} onChange={(e) => updateParticipant(idx, "nik", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] outline-none" required placeholder="3404XXXXXXXXXXXX" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nama di BIB <span className="text-rose-500">*</span></label>
                        <input type="text" maxLength={12} value={p.namaBib} onChange={(e) => updateParticipant(idx, "namaBib", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] outline-none" required placeholder="MAX 12 HURUF" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Ukuran Jersey <span className="text-rose-500">*</span></label>
                        <select value={p.ukuranJersey} onChange={(e) => updateParticipant(idx, "ukuranJersey", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] outline-none" required>
                          <option value="">Pilih Ukuran</option>
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Golongan Darah <span className="text-rose-500">*</span></label>
                        <select value={p.golonganDarah} onChange={(e) => updateParticipant(idx, "golonganDarah", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] outline-none" required>
                          <option value="">Pilih Darah</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="AB">AB</option>
                          <option value="O">O</option>
                        </select>
                      </div>
                    </div>
                    <hr className="border-slate-100 my-4" />
                    <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Kontak Darurat</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nama Kontak <span className="text-rose-500">*</span></label>
                        <input type="text" value={p.namaDarurat} onChange={(e) => updateParticipant(idx, "namaDarurat", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] outline-none" required placeholder="Cth: Istri/Suami" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">No. HP Darurat <span className="text-rose-500">*</span></label>
                        <input type="tel" value={p.waDarurat} onChange={(e) => updateParticipant(idx, "waDarurat", e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#FCD116] outline-none" required placeholder="08123456789" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>

      {/* BOTTOM FIXED BAR */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Tagihan</p>
            <p className="text-lg font-black text-[#0B2239]">Rp {calculateSubtotal().toLocaleString("id-ID")}</p>
            <p className="text-[10px] font-medium text-slate-400">{totalTickets} Tiket</p>
          </div>
          
          {step === 1 ? (
            <button 
              onClick={handleLanjutStep2}
              className="bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239] font-black py-3 px-8 rounded-xl shadow-lg shadow-yellow-200 transition-all flex items-center gap-2"
            >
              Isi Data Peserta
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7"/></svg>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setStep(1)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-4 rounded-xl transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="bg-[#1A73E8] hover:bg-blue-700 disabled:opacity-50 text-white font-black py-3 px-8 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center gap-2"
              >
                {isSubmitting ? "Memproses..." : "Lanjut Bayar"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <h3 className="font-black text-xl mb-2 text-slate-800">{modal.title}</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="w-full bg-[#0B2239] text-white py-3.5 rounded-xl font-bold transition-transform active:scale-95"
            >
              Mengerti
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
