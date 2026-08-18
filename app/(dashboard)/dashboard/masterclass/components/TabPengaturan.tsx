"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function TabPengaturan() {
  const defaultSettings = {
    metodePembayaran: "manual", // midtrans | manual | qris
    midtransClientKey: "",
    midtransServerKey: "",
    isProduction: false,
    manualBank: "",
    manualRekening: "",
    manualNama: "",
    urlQris: "",
  };

  const [mcSettings, setMcSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "settings", "masterclass"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        try {
          const secretSnap = await getDoc(doc(db, "secrets", "masterclass"));
          if (secretSnap.exists() && secretSnap.data()?.midtransServerKey) {
            data.midtransServerKey = secretSnap.data()!.midtransServerKey;
          }
        } catch {}
        setMcSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setMcSettings({
      ...mcSettings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { midtransServerKey, ...restMcSettings } = mcSettings;
      await setDoc(doc(db, "settings", "masterclass"), {
        ...restMcSettings,
        updatedAt: serverTimestamp(),
      });
      if (midtransServerKey) {
        await setDoc(
          doc(db, "secrets", "masterclass"),
          { midtransServerKey, updatedAt: serverTimestamp() },
          { merge: true },
        );
      }
      setPopup({
        type: "success",
        text: "Konfigurasi LMS berhasil diperbarui.",
      });
    } catch (error) {
      console.error("Error save settings:", error);
      setPopup({ type: "error", text: "Gagal menyimpan konfigurasi." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 font-sans">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#0B1120] rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-sm tracking-widest uppercase">
          Memuat Sistem...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative font-sans max-w-4xl">
      {/* POPUP NOTIFIKASI */}
      {popup && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#0B1120] rounded-xl shadow-2xl border border-slate-700 p-4 flex items-center gap-4 min-w-[300px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${popup.type === "success" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
            >
              {popup.type === "success" ? "✓" : "✕"}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-bold text-white">
                {popup.type === "success" ? "Success" : "Error"}
              </p>
              <p className="text-xs text-slate-400">{popup.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER ELEGAN */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Checkout & Payment Gateway
        </h2>
        <p className="text-sm text-slate-500 mt-1 font-medium">
          Tentukan bagaimana cara peserta membeli dan membuka akses kelas
          premium.
        </p>
      </div>

      <form onSubmit={saveSettings} className="space-y-8">
        {/* PILIHAN METODE (RADIO CARDS) */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Aktifkan Metode Pembayaran Utama
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Opsi Midtrans */}
            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${mcSettings.metodePembayaran === "midtrans" ? "border-[#0B1120] bg-slate-900 shadow-lg" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <input
                type="radio"
                name="payment_method"
                value="midtrans"
                checked={mcSettings.metodePembayaran === "midtrans"}
                onChange={() =>
                  setMcSettings({ ...mcSettings, metodePembayaran: "midtrans" })
                }
                className="sr-only"
              />
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2 rounded-lg ${mcSettings.metodePembayaran === "midtrans" ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                {mcSettings.metodePembayaran === "midtrans" && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_0_2px_#3B82F6]"></div>
                )}
              </div>
              <h4
                className={`font-bold text-base ${mcSettings.metodePembayaran === "midtrans" ? "text-white" : "text-slate-800"}`}
              >
                Midtrans API
              </h4>
              <p
                className={`text-xs mt-1 leading-relaxed ${mcSettings.metodePembayaran === "midtrans" ? "text-slate-400" : "text-slate-500"}`}
              >
                Otomasi VA, E-Wallet, & Kartu Kredit. Akses langsung terbuka.
              </p>
            </label>

            {/* Opsi Manual */}
            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${mcSettings.metodePembayaran === "manual" ? "border-[#0B1120] bg-slate-900 shadow-lg" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <input
                type="radio"
                name="payment_method"
                value="manual"
                checked={mcSettings.metodePembayaran === "manual"}
                onChange={() =>
                  setMcSettings({ ...mcSettings, metodePembayaran: "manual" })
                }
                className="sr-only"
              />
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2 rounded-lg ${mcSettings.metodePembayaran === "manual" ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}
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
                      d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                    />
                  </svg>
                </div>
                {mcSettings.metodePembayaran === "manual" && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_0_2px_#3B82F6]"></div>
                )}
              </div>
              <h4
                className={`font-bold text-base ${mcSettings.metodePembayaran === "manual" ? "text-white" : "text-slate-800"}`}
              >
                Transfer Bank
              </h4>
              <p
                className={`text-xs mt-1 leading-relaxed ${mcSettings.metodePembayaran === "manual" ? "text-slate-400" : "text-slate-500"}`}
              >
                Transfer manual antar bank. Butuh approval Admin via kasir.
              </p>
            </label>

            {/* Opsi QRIS */}
            <label
              className={`relative flex flex-col p-5 rounded-2xl border-2 cursor-pointer transition-all ${mcSettings.metodePembayaran === "qris" ? "border-[#0B1120] bg-slate-900 shadow-lg" : "border-slate-200 bg-white hover:border-slate-300"}`}
            >
              <input
                type="radio"
                name="payment_method"
                value="qris"
                checked={mcSettings.metodePembayaran === "qris"}
                onChange={() =>
                  setMcSettings({ ...mcSettings, metodePembayaran: "qris" })
                }
                className="sr-only"
              />
              <div className="flex justify-between items-start mb-4">
                <div
                  className={`p-2 rounded-lg ${mcSettings.metodePembayaran === "qris" ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}
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
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                </div>
                {mcSettings.metodePembayaran === "qris" && (
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-slate-900 shadow-[0_0_0_2px_#3B82F6]"></div>
                )}
              </div>
              <h4
                className={`font-bold text-base ${mcSettings.metodePembayaran === "qris" ? "text-white" : "text-slate-800"}`}
              >
                QRIS Statis
              </h4>
              <p
                className={`text-xs mt-1 leading-relaxed ${mcSettings.metodePembayaran === "qris" ? "text-slate-400" : "text-slate-500"}`}
              >
                Scan barcode statis. Butuh konfirmasi manual oleh Admin.
              </p>
            </label>
          </div>
        </div>

        {/* DETAIL KONFIGURASI SESUAI METODE */}
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
          {mcSettings.metodePembayaran === "midtrans" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-800">
                    Midtrans Configuration
                  </h3>
                  <p className="text-xs text-slate-500">
                    Integrasi Server Key untuk Sandbox/Production
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Sandbox
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isProduction"
                      checked={mcSettings.isProduction}
                      onChange={handleSettingChange}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B1120]"></div>
                  </label>
                  <span className="text-[10px] font-bold uppercase text-slate-800">
                    Live
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                    Client Key
                  </label>
                  <input
                    type="text"
                    name="midtransClientKey"
                    value={mcSettings.midtransClientKey}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] outline-none text-sm font-mono text-slate-800"
                    placeholder="Mid-client-..."
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                    Server Key
                  </label>
                  <input
                    type="password"
                    name="midtransServerKey"
                    value={mcSettings.midtransServerKey}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] outline-none text-sm font-mono text-slate-800"
                    placeholder="Mid-server-..."
                  />
                </div>
              </div>
            </div>
          )}

          {mcSettings.metodePembayaran === "manual" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-bold text-slate-800">Rekening Tujuan</h3>
                <p className="text-xs text-slate-500">
                  Nomor rekening untuk pembayaran manual.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                    Nama Bank
                  </label>
                  <input
                    type="text"
                    name="manualBank"
                    value={mcSettings.manualBank}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] outline-none text-sm font-bold text-slate-800 uppercase"
                    placeholder="Contoh: BCA"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                    Nomor Rekening
                  </label>
                  <input
                    type="text"
                    name="manualRekening"
                    value={mcSettings.manualRekening}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] outline-none text-sm font-mono font-bold text-slate-800"
                    placeholder="0123456789"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                    Nama Pemilik Rekening
                  </label>
                  <input
                    type="text"
                    name="manualNama"
                    value={mcSettings.manualNama}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] outline-none text-sm font-bold text-slate-800 uppercase"
                    placeholder="PT LOREM IPSUM"
                  />
                </div>
              </div>
            </div>
          )}

          {mcSettings.metodePembayaran === "qris" && (
            <div className="space-y-5 animate-in fade-in">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h3 className="font-bold text-slate-800">Kode QRIS Statis</h3>
                <p className="text-xs text-slate-500">
                  Gambar barcode akan ditampilkan saat checkout.
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                  URL Gambar QRIS
                </label>
                <input
                  type="url"
                  name="urlQris"
                  value={mcSettings.urlQris}
                  onChange={handleSettingChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0056D2] outline-none text-sm font-mono text-slate-800"
                  placeholder="https://domain.com/qris.jpg"
                />
              </div>
              {mcSettings.urlQris && (
                <div className="mt-2 p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-center">
                  <img
                    src={mcSettings.urlQris}
                    alt="QRIS Preview"
                    className="h-48 object-contain mix-blend-multiply"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="bg-[#0B1120] hover:bg-slate-800 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            {isSaving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>
      </form>
    </div>
  );
}
