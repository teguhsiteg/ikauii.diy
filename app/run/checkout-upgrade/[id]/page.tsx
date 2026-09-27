"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import RunNavbar from "@/components/run/RunNavbar";
import RunFooter from "@/components/run/RunFooter";

export default function OfflineRunCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [participant, setParticipant] = useState<any>(null);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 State Tahan Layar
  const [isRedirecting, setIsRedirecting] = useState(false);

  // State Pembayaran & Upload
  const [isPaying, setIsPaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // 🔥 STATE KHUSUS UI KARTU PEMBAYARAN MIDTRANS
  const [selectedBank, setSelectedBank] = useState("qris");

  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info" | "warning";
    title: string;
    message: string;
  }>({ isOpen: false, type: "info", title: "", message: "" });

  // Pilihan Bank/E-Wallet untuk UI Midtrans
  const midtransOptions = [
    { id: "qris", name: "QRIS", label: "Scan Instan", icon: "qr" },
    { id: "mandiri", name: "MANDIRI", label: "Virtual Account", icon: "bank" },
    { id: "bni", name: "BNI", label: "Virtual Account", icon: "bank" },
    { id: "bca", name: "BCA", label: "Virtual Account", icon: "bank" },
    { id: "bri", name: "BRI", label: "Virtual Account", icon: "bank" },
    {
      id: "ewallet",
      name: "E-WALLET",
      label: "GoPay / ShopeePay",
      icon: "wallet",
    },
  ];

  // =================================================================
  // FETCH DATA & REDIRECT LUNAS
  // =================================================================
  useEffect(() => {
    const fetchDataAndSettings = async () => {
      if (!id) return;

      let isLunas = false;

      try {
        const pRef = doc(db, "offline_participants", id);
        const pSnap = await getDoc(pRef);

        if (pSnap.exists()) {
          const data = pSnap.data();

          if (data.statusPembayaran !== "Lunas") {
            setIsRedirecting(true);
            router.push(`/run/checkout/${id}`);
            return;
          }

          if (!data.upgradeRequest) {
            // Jika belum ada karena cache/delay, tampilkan error ringan
            setModal({
              isOpen: true,
              type: "warning",
              title: "Tunggu Sebentar",
              message: "Data upgrade sedang disiapkan. Silakan muat ulang (refresh) halaman ini.",
            });
            setIsLoading(false);
            return;
          }

          setParticipant({ id: pSnap.id, ...data });

          if (data.orderIdGroup) {
            const q = query(
              collection(db, "offline_participants"),
              where("orderIdGroup", "==", data.orderIdGroup)
            );
            const querySnapshot = await getDocs(q);
            const fetched = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            // urutkan agar yang isUtama pertama
            fetched.sort((a: any, b: any) => (a.isUtama === b.isUtama ? 0 : a.isUtama ? -1 : 1));
            setAllParticipants(fetched);
          } else {
            setAllParticipants([{ id: pSnap.id, ...data }]);
          }
        } else {
          setModal({
            isOpen: true,
            type: "error",
            title: "Data Tidak Ditemukan",
            message: "ID Pendaftaran tidak valid.",
          });
          setIsLoading(false);
          return;
        }

        const sRef = doc(db, "settings", "virtual_run");
        const sSnap = await getDoc(sRef);
        if (sSnap.exists()) {
          const sData = sSnap.data();
          setSettings(sData);

          if (
            sData.metodePembayaran === "midtrans" &&
            sData.midtransClientKey
          ) {
            const isSandbox = sData.midtransClientKey.startsWith("SB-");
            const snapScriptUrl = isSandbox
              ? "https://app.sandbox.midtrans.com/snap/snap.js"
              : "https://app.midtrans.com/snap/snap.js";

            const script = document.createElement("script");
            script.src = snapScriptUrl;
            script.setAttribute("data-client-key", sData.midtransClientKey);
            script.async = true;
            document.body.appendChild(script);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (!isLunas) {
          setIsLoading(false);
        }
      }
    };

    fetchDataAndSettings();

    return () => {
      const existingScript = document.querySelector('script[src*="snap.js"]');
      if (existingScript) document.body.removeChild(existingScript);
    };
  }, [id, router]);

  const handleCopyRekening = () => {
    if (settings?.manualRekening) {
      navigator.clipboard.writeText(settings.manualRekening);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || isUploading) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", "eventrunning");
      formData.append("cloud_name", "dp8hmxuix");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload",
        {
          method: "POST",
          body: formData,
        },
      );
      const data = await res.json();

      await updateDoc(doc(db, "offline_participants", participant.id), {
        buktiBayarUrl: data.secure_url,
        statusPembayaran: "Pending",
      });

      setParticipant((prev: any) => ({
        ...prev,
        buktiBayarUrl: data.secure_url,
        statusPembayaran: "Pending",
      }));

      // Kirim notifikasi Telegram ke Admin
      try {
        await fetch("/api/telegram/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "offline_indiv",
            id: participant.id,
            nama: participant.namaLengkap,
            email: participant.email,
            wa: participant.noWA,
            kategori: `UPGRADE: ${participant.jarak || "-"} ➔ ${participant.upgradeRequest?.newKategori || "-"}`,
            totalBayar: participant.upgradeRequest?.selisih || 0,
            buktiBayarUrl: data.secure_url,
          }),
        });
      } catch (e) {
        console.error("Gagal mengirim notifikasi telegram upgrade", e);
      }

      // Kirim email notifikasi bahwa bukti telah disubmit
      try {
        await fetch("/api/notify-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: participant.email,
            nama: participant.namaLengkap,
            id: participant.id,
            event: settings?.offlineJudul || "Event IKA UII DIY",
          }),
        });
      } catch (e) {
        console.error("Gagal mengirim email notifikasi upload bukti", e);
      }

      setModal({
        isOpen: true,
        type: "success",
        title: "Berhasil!",
        message: "Bukti terkirim, tunggu verifikasi admin.",
      });

      setSelectedFile(null);
      setPreviewUrl(null);
    } catch {
      setModal({
        isOpen: true,
        type: "error",
        title: "Gagal",
        message: "Gagal mengunggah bukti bayar.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePayMidtrans = async () => {
    setIsPaying(true);
    try {
      const res = await fetch("/api/upgrade-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: participant.id,
          newPaketId: participant.upgradeRequest.newPaketId,
          isManual: false,
        }),
      });

      const data = await res.json();

      if (data.token) {
        (window as any).snap.pay(data.token, {
          onSuccess: function () {
            setIsRedirecting(true);
            router.push(`/run/tiket/${participant.id}`);
          },
          onPending: function () {
            setModal({
              isOpen: true,
              type: "warning",
              title: "Tertunda",
              message: "Silakan selesaikan pembayaran di aplikasi terkait.",
            });
          },
          onError: function () {
            setModal({
              isOpen: true,
              type: "error",
              title: "Gagal",
              message: "Terjadi masalah pada transaksi.",
            });
          },
        });
      }
    } catch {
      setModal({
        isOpen: true,
        type: "error",
        title: "Sistem Sibuk",
        message: "Gagal menghubungi server pembayaran.",
      });
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#1A73E8] rounded-full animate-spin"></div>
      </div>
    );
  }

  const isMenungguVerifikasi =
    participant?.statusPembayaran === "Pending" && participant?.buktiBayarUrl;
  const activePaymentMethod = settings?.metodePembayaran || "manual";

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col relative selection:bg-[#1A73E8] selection:text-white">
      <RunNavbar eventName={settings?.offlineJudul} solid={true} />

      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-[120px] md:pt-[160px] pb-20 w-full relative z-10">
        <div className="animate-in fade-in duration-500">
          {/* Stepper (Pembayaran) */}
          <div className="w-full max-w-3xl mx-auto mb-10 mt-8 hidden md:block">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200 -z-10">
                <div className="h-full bg-[#1A73E8] transition-all w-full"></div>
              </div>
              {["Pilih Kategori", "Detail Pesanan", "Review Data", "Pembayaran"].map((step, idx) => {
                const isActive = true; // All steps active
                return (
                  <div key={idx} className="flex flex-col items-center bg-[#F4F7FB] px-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-[#1A73E8] text-white shadow-md shadow-blue-200">
                      {idx + 1}
                    </div>
                    <p className="text-[11px] mt-2 font-bold uppercase tracking-wider text-[#1A73E8]">{step}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* =================================================
                KOLOM KIRI: PAYMENT METHOD (INSTRUKSI BAYAR)
            ================================================= */}
            <div className="lg:col-span-8">
              {isMenungguVerifikasi ? (
                <div className="bg-white rounded-[8px] p-8 border border-slate-100 text-center shadow-sm">
                  <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#0B2239] mb-2">Menunggu Verifikasi Admin</h3>
                  <p className="text-[13px] text-slate-500">Bukti pembayaran manual Anda telah berhasil diunggah dan sedang dalam proses pengecekan oleh tim kami.</p>
                </div>
              ) : (
                <div className="bg-white rounded-[8px] overflow-hidden shadow-sm border border-slate-100">
                  <div className="px-5 py-4 border-b border-slate-100">
                    <h2 className="text-[14px] font-bold text-[#0B2239] flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                      Metode Pembayaran
                    </h2>
                  </div>

                  <div className="p-5">
                    {/* --- TAMPILAN JIKA ADMIN PILIH MANUAL --- */}
                    {activePaymentMethod === "manual" && (
                      <div className="space-y-6">
                        <div className="bg-[#F4F7FB] border border-slate-200 rounded-[8px] p-6 text-center flex flex-col items-center">
                          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-2">Transfer Ke Rekening</p>
                          <p className="text-2xl font-black text-[#0B2239] mb-1">{settings?.manualBank || "BANK"}</p>
                          <div className="flex items-center gap-3 mt-2 bg-white px-4 py-2 rounded-[8px] border border-slate-200 shadow-sm">
                            <p className="font-mono text-lg font-bold text-[#1A73E8]">{settings?.manualRekening || "-"}</p>
                            <button onClick={handleCopyRekening} className="text-[11px] font-bold text-slate-500 hover:text-[#1A73E8] bg-slate-100 px-2.5 py-1.5 rounded transition-colors">
                              {isCopied ? "Disalin!" : "Copy"}
                            </button>
                          </div>
                          <p className="text-[11px] font-bold text-slate-400 mt-4 uppercase">a.n. {settings?.manualNama || "IKA UII DIY"}</p>
                        </div>
                        
                        <form onSubmit={handleUploadSubmit} className="space-y-4">
                          <div>
                            <label className="block text-[12px] font-bold text-[#0B2239] mb-1.5">Upload Bukti Transfer</label>
                            <div className="relative border-2 border-dashed border-slate-200 rounded-[8px] p-4 text-center h-32 flex flex-col items-center justify-center bg-slate-50 hover:bg-blue-50/50 transition-colors cursor-pointer">
                              <input type="file" accept="image/*" onChange={handleFileSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                              {previewUrl ? (
                                <img src={previewUrl} className="absolute inset-0 w-full h-full object-contain p-2 opacity-90 rounded-[8px]" />
                              ) : (
                                <div className="text-slate-400">
                                  <svg className="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                                  <p className="text-[11px] font-bold uppercase tracking-widest">Pilih Foto/Screenshot</p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <button type="submit" disabled={isUploading || !selectedFile} className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white text-[13px] font-bold py-3 rounded-[8px] disabled:opacity-50 transition-colors">
                            {isUploading ? "Mengunggah..." : "Konfirmasi & Kirim Bukti"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* --- TAMPILAN JIKA ADMIN PILIH MIDTRANS --- */}
                    {activePaymentMethod === "midtrans" && (
                      <div className="space-y-6">
                        <p className="text-[12px] font-bold text-slate-500 mb-3">Pilih Bank / E-Wallet</p>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                          {midtransOptions.map((opt) => (
                            <div
                              key={opt.id}
                              onClick={() => setSelectedBank(opt.id)}
                              className={`relative cursor-pointer border rounded-[8px] p-4 flex flex-col items-center justify-center gap-3 transition-all duration-200 ${
                                selectedBank === opt.id
                                  ? "border-[#1A73E8] bg-blue-50/30 text-[#1A73E8] shadow-sm ring-1 ring-[#1A73E8]"
                                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {selectedBank === opt.id && (
                                <div className="absolute top-2 right-2 bg-[#1A73E8] text-white rounded-full p-0.5">
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                                </div>
                              )}

                              <div className={selectedBank === opt.id ? "text-[#1A73E8]" : "text-slate-400"}>
                                {opt.icon === "qr" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>}
                                {opt.icon === "bank" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11m16-11v11M8 14v3m4-3v3m4-3v3"/></svg>}
                                {opt.icon === "wallet" && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>}
                              </div>

                              <div className="text-center">
                                <p className="font-bold text-[12px]">{opt.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{opt.label}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-500 flex justify-between items-center">
                          <span>Biaya Layanan Midtrans</span>
                          <span>Dihitung otomatis</span>
                        </p>

                        <button
                          onClick={handlePayMidtrans}
                          disabled={isPaying}
                          className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white text-[13px] font-bold py-3 rounded-[8px] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {isPaying ? "Menghubungkan..." : "Lanjutkan Pembayaran"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                KOLOM KANAN: ORDER SUMMARY (RINGKASAN PESANAN)
            ================================================= */}
            <div className="lg:col-span-4 relative">
              <div className="bg-white rounded-[8px] overflow-hidden shadow-sm border border-slate-100 sticky top-24">
                <div className="px-5 py-4 border-b border-slate-100">
                  <h2 className="text-[14px] font-bold text-[#0B2239] flex items-center gap-2">
                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                    Rincian Pesanan
                  </h2>
                </div>
                
                <div className="p-5 space-y-4">
                  <div className="space-y-3">
                      <div className="flex justify-between text-[12px] border-b border-slate-50 pb-2">
                        <div className="space-y-1">
                          <p className="font-bold text-[#0B2239]">Upgrade Ke: {participant.upgradeRequest?.newPaketNama}</p>
                          <p className="text-slate-500">{participant.namaLengkap}</p>
                          <p className="text-slate-400 text-[11px]">Kategori Lama: {participant.kategori} | Jersey: {participant.ukuranJersey}</p>
                        </div>
                      </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-100 text-[12px]">
                    <div className="flex justify-between text-slate-600">
                      <span>Harga Kategori Lama</span>
                      <span className="font-medium text-[#0B2239]">Rp {participant.hargaAsli?.toLocaleString("id-ID")}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>Harga Kategori Baru</span>
                      <span className="font-medium text-[#0B2239]">Rp {(participant.hargaAsli + participant.upgradeRequest?.selisih)?.toLocaleString("id-ID")}</span>
                    </div>

                    <div className="flex justify-between text-blue-600">
                      <span>Selisih Harga</span>
                      <span className="font-medium">Rp {participant.upgradeRequest?.selisih?.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="font-bold text-[13px] text-[#0B2239]">Total Bayar Upgrade</span>
                    <span className="font-bold text-[16px] text-[#1A73E8]">
                      Rp {participant.upgradeRequest?.selisih?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
      <RunFooter eventName={settings?.offlineJudul} waChannelUrl={settings?.waGroupUrl} sosmeds={settings?.sosmeds} />

      {/* POPUP MODAL UMUM */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <h3 className="font-bold text-lg mb-2">{modal.title}</h3>
            <p className="text-sm text-slate-600 mb-6">{modal.message}</p>
            <button
              onClick={() => setModal({ ...modal, isOpen: false })}
              className="w-full bg-[#0B2239] text-white py-3 rounded-xl font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
