"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function PengaturanAdminPage() {
  const [adminUser, setAdminUser] = useState<any>(null);

  // 🔥 STATE UNTUK TAB NAVIGASI 🔥
  const [activeTab, setActiveTab] = useState("virtual"); // 'virtual', 'offline', 'charity', 'pembayaran'

  // --- STATE SETTINGS ---
  const defaultSettings = {
    // VIRTUAL RUN (MODUL)
    isVirtualRunEnabled: true,
    eventName: "IKA UII VR 2026",
    statusPendaftaran: "Buka",
    landingTitle: "IKA UII VIRTUAL RUN & CHARITY 2026",
    landingDesc:
      "Berlari di mana saja, kapan saja. Rayakan semangat persaudaraan alumni UII DIY sekaligus berbagi kebaikan.",
    urlHeroBg: "",
    tanggalPenutupan: "",
    periodeLari: "1 - 30 April 2026",
    periodePengiriman: "Pertengahan Mei 2026",
    jadwalPuncakAcara: "Akhir Mei 2026",
    urlLiveStreaming: "",

    // OFFLINE RUN (HYBRID)
    isOfflineRunEnabled: false,
    offlineStatus: "tutup",
    offlineComingSoonText: "Tahun 2026",
    offlineLocation: "",
    offlineDate: "",
    offlineTime: "",
    offlineQuota: 500,
    urlOfflineRouteMap: "",
    offlineTanggalPenutupan: "",
    offlinePeriodeLari: "",
    offlinePeriodePengiriman: "",
    offlineJadwalPuncakAcara: "",

    // ASET DIGITAL VIRTUAL
    urlJerseyVirtual: "",
    urlMedaliVirtual: "",
    urlBibVirtual: "",
    urlSertifikatVirtual: "",

    // ASET DIGITAL OFFLINE
    urlJerseyOffline: "",
    urlMedaliOffline: "",

    // Charity & Umum
    charityTitle: "Setiap Langkah Membawa Harapan Baru.",
    charityDesc:
      "Seluruh donasi disalurkan 100% secara transparan kepada panti asuhan yatim piatu di wilayah DIY.",
    urlCharityImg: "",
    minCharity: 25000,
    ongkirFlat: 25000,

    // Teks Sertifikat Virtual
    certTitle: "E-CERTIFICATE",
    certSubtitle: "OF COMPLETION",
    certOpening: "This certificate is proudly presented to:",
    certFooter:
      "For successfully completing the IKA UII Virtual Run & Charity 2026.",

    // Pembayaran
    metodePembayaran: "midtrans",
    midtransClientKey: "",
    midtransServerKey: "",
    isProduction: false,
    manualBank: "",
    manualRekening: "",
    manualNama: "",
    urlQris: "",

    // Paket Dinamis
    virtualPackages: [
      {
        id: Date.now().toString(),
        nama: "Standard",
        jarak: "5K",
        harga: 150000,
        benefit: "Jersey, E-BIB, E-Cert",
      },
    ],
    offlinePackages: [
      {
        id: (Date.now() + 1).toString(),
        nama: "Early Bird",
        jarak: "10K",
        kuota: 100,
        harga: 200000,
        benefit: "Jersey, Medali Fisik, BIB, Refreshment",
      },
    ],
  };

  const [vrSettings, setVrSettings] = useState(defaultSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [popup, setPopup] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // 1. Ambil Data Admin & Pengaturan
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdminUser(user));

    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "virtual_run"));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVrSettings({
            ...defaultSettings,
            ...data,
            isVirtualRunEnabled: data.isVirtualRunEnabled !== false,
            urlJerseyVirtual: data.urlJerseyVirtual || data.urlJersey || "",
            urlMedaliVirtual: data.urlMedaliVirtual || data.urlMedali || "",
            urlBibVirtual: data.urlBibVirtual || data.urlBib || "",
            urlSertifikatVirtual:
              data.urlSertifikatVirtual || data.urlSertifikat || "",
            urlJerseyOffline: data.urlJerseyOffline || "",
            urlMedaliOffline: data.urlMedaliOffline || "",
            metodePembayaran: data.metodePembayaran || "midtrans",
            virtualPackages:
              data.virtualPackages || defaultSettings.virtualPackages,
            offlinePackages:
              data.offlinePackages || defaultSettings.offlinePackages,
            offlineQuota: data.offlineQuota || 0,
            offlineStatus: data.offlineStatus || "tutup",
            offlineComingSoonText: data.offlineComingSoonText || "Tahun 2026",
            offlineTanggalPenutupan: data.offlineTanggalPenutupan || "",
            offlinePeriodeLari: data.offlinePeriodeLari || "",
            offlinePeriodePengiriman: data.offlinePeriodePengiriman || "",
            offlineJadwalPuncakAcara: data.offlineJadwalPuncakAcara || "",
          });
        }
      } catch (error) {
        console.error("Gagal load pengaturan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();

    return () => unsubscribe();
  }, []);

  // 2. Handler Perubahan Input Dasar
  const handleSettingChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setVrSettings({
      ...vrSettings,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? Number(value)
            : value,
    });
  };

  const selectPaymentMethod = (method: string) =>
    setVrSettings({ ...vrSettings, metodePembayaran: method });

  // 3. Handler Dynamic Packages
  const handlePackageChange = (
    type: "virtual" | "offline",
    id: string,
    field: string,
    value: any,
  ) => {
    const targetArray =
      type === "virtual" ? "virtualPackages" : "offlinePackages";
    const updatedPackages = vrSettings[targetArray].map((pkg: any) =>
      pkg.id === id ? { ...pkg, [field]: value } : pkg,
    );
    setVrSettings({ ...vrSettings, [targetArray]: updatedPackages });
  };

  const addPackage = (type: "virtual" | "offline") => {
    const targetArray =
      type === "virtual" ? "virtualPackages" : "offlinePackages";
    const newPackage =
      type === "virtual"
        ? {
            id: Date.now().toString(),
            nama: "",
            jarak: "",
            harga: 0,
            benefit: "",
          }
        : {
            id: Date.now().toString(),
            nama: "",
            jarak: "",
            kuota: 0,
            harga: 0,
            benefit: "",
          };
    setVrSettings({
      ...vrSettings,
      [targetArray]: [...vrSettings[targetArray], newPackage],
    });
  };

  const removePackage = (type: "virtual" | "offline", id: string) => {
    const targetArray =
      type === "virtual" ? "virtualPackages" : "offlinePackages";
    const updatedPackages = vrSettings[targetArray].filter(
      (pkg: any) => pkg.id !== id,
    );
    setVrSettings({ ...vrSettings, [targetArray]: updatedPackages });
  };

  // 4. Simpan Pengaturan
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "virtual_run"), vrSettings);
      await addDoc(collection(db, "vr_logs"), {
        type: "setting",
        action: "memperbarui Pengaturan Sistem Event",
        targetName: "",
        adminEmail: adminUser?.email || "Admin",
        timestamp: Date.now(),
      });
      setPopup({
        type: "success",
        text: "Semua pengaturan berhasil disimpan.",
      });
    } catch (error) {
      setPopup({
        type: "error",
        text: "Gagal menyimpan pengaturan. Cek koneksi Anda.",
      });
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };

  if (isLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-[#1A73E8] font-medium text-sm">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
        MEMUAT SISTEM...
      </div>
    );

  return (
    <div className="animate-in fade-in duration-300 max-w-5xl mx-auto pb-24 relative p-4 sm:p-8 font-sans">
      {/* POPUP NOTIFIKASI (Google Style) */}
      {popup && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center gap-4 min-w-[300px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${popup.type === "success" ? "bg-[#E6F4EA] text-[#1E8E3E]" : popup.type === "error" ? "bg-[#FCE8E6] text-[#D93025]" : "bg-[#E8F0FE] text-[#1A73E8]"}`}
            >
              {popup.type === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              )}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-bold text-slate-800">
                {popup.type === "success" ? "Berhasil" : "Gagal"}
              </p>
              <p className="text-xs text-slate-500">{popup.text}</p>
            </div>
            <button
              onClick={() => setPopup(null)}
              className="text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">
          Pengaturan Sistem
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola konfigurasi event, jadwal, mode offline, dan gerbang
          pembayaran.
        </p>
      </div>

      {/* 🔥 TAB NAVIGATION (Google Material Tabs) 🔥 */}
      <div className="flex overflow-x-auto gap-1 mb-8 border-b border-slate-200 hide-scrollbar">
        <button
          onClick={() => setActiveTab("virtual")}
          className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === "virtual" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z" />
          </svg>
          Virtual Run
        </button>
        <button
          onClick={() => setActiveTab("offline")}
          className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === "offline" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
          </svg>
          Offline Run
        </button>
        <button
          onClick={() => setActiveTab("charity")}
          className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === "charity" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          Charity & Aset
        </button>
        <button
          onClick={() => setActiveTab("pembayaran")}
          className={`px-6 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${activeTab === "pembayaran" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
          </svg>
          Pembayaran
        </button>
      </div>

      <form onSubmit={saveSettings} className="space-y-0">
        {/* ======================================= */}
        {/* TAB 1: VIRTUAL RUN */}
        {/* ======================================= */}
        <div
          className={
            activeTab === "virtual"
              ? "block animate-in fade-in slide-in-from-bottom-4 duration-300"
              : "hidden"
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200">
            <div className="lg:col-span-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z" />
                </svg>
                Setup Virtual Run
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Aktifkan atau matikan modul Virtual Run dan atur info landing
                page utamanya.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              {/* TOGGLE VIRTUAL RUN */}
              <div
                className={`flex items-center justify-between p-4 border rounded-xl transition-all ${vrSettings.isVirtualRunEnabled ? "bg-white border-[#1A73E8] shadow-[0_0_0_1px_rgba(26,115,232,0.1)]" : "bg-[#F8F9FA] border-slate-200"}`}
              >
                <div>
                  <p
                    className={`font-bold text-sm ${vrSettings.isVirtualRunEnabled ? "text-[#1A73E8]" : "text-slate-700"}`}
                  >
                    Modul Virtual Run
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jika dimatikan, halaman Virtual Run akan ditutup.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    name="isVirtualRunEnabled"
                    checked={vrSettings.isVirtualRunEnabled || false}
                    onChange={handleSettingChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
                </label>
              </div>

              {vrSettings.isVirtualRunEnabled && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Nama Event
                      </label>
                      <input
                        type="text"
                        name="eventName"
                        value={vrSettings.eventName || ""}
                        onChange={handleSettingChange}
                        required
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Status Pendaftaran
                      </label>
                      <select
                        name="statusPendaftaran"
                        value={vrSettings.statusPendaftaran || "Buka"}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      >
                        <option value="Buka">Buka (Menerima)</option>
                        <option value="Tutup">Tutup (Sold Out)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Judul Landing Page
                    </label>
                    <input
                      type="text"
                      name="landingTitle"
                      value={vrSettings.landingTitle || ""}
                      onChange={handleSettingChange}
                      required
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Deskripsi Singkat
                    </label>
                    <textarea
                      name="landingDesc"
                      value={vrSettings.landingDesc || ""}
                      onChange={handleSettingChange}
                      rows={3}
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800 custom-scrollbar"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Background Image URL (Hero)
                    </label>
                    <input
                      type="text"
                      name="urlHeroBg"
                      value={vrSettings.urlHeroBg || ""}
                      onChange={handleSettingChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {vrSettings.isVirtualRunEnabled && (
            <>
              {/* TIMELINE VIRTUAL */}
              <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-200 mt-6">
                <div className="lg:col-span-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 1.99 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                    Timeline Virtual Run
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Jadwal khusus untuk peserta yang berlari secara mandiri.
                  </p>
                </div>
                <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Batas Pendaftaran
                      </label>
                      <input
                        type="datetime-local"
                        name="tanggalPenutupan"
                        value={vrSettings.tanggalPenutupan || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Periode Lari (Teks)
                      </label>
                      <input
                        type="text"
                        name="periodeLari"
                        value={vrSettings.periodeLari || ""}
                        onChange={handleSettingChange}
                        placeholder="1 - 30 April 2026"
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Jadwal Kirim Racepack
                      </label>
                      <input
                        type="text"
                        name="periodePengiriman"
                        value={vrSettings.periodePengiriman || ""}
                        onChange={handleSettingChange}
                        placeholder="Pertengahan Mei 2026"
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Jadwal Puncak Acara
                      </label>
                      <input
                        type="text"
                        name="jadwalPuncakAcara"
                        value={vrSettings.jadwalPuncakAcara || ""}
                        onChange={handleSettingChange}
                        placeholder="31 Mei 2026"
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      URL Live Streaming (Opsional)
                    </label>
                    <input
                      type="text"
                      name="urlLiveStreaming"
                      value={vrSettings.urlLiveStreaming || ""}
                      onChange={handleSettingChange}
                      placeholder="https://youtube.com/live/..."
                      className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* PAKET VIRTUAL RUN */}
              <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-200 mt-6">
                <div className="lg:col-span-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 10V6a2 2 0 00-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46s-.81-2.77-2-3.46V6h16v2.54z" />
                    </svg>
                    Paket Virtual Run
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Atur opsi jarak, paket, harga, dan ongkos kirim.
                  </p>
                </div>
                <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  {vrSettings.virtualPackages.map((pkg: any, index: number) => (
                    <div
                      key={pkg.id}
                      className="p-5 border border-slate-200 rounded-lg bg-[#F8F9FA] relative group"
                    >
                      <button
                        type="button"
                        onClick={() => removePackage("virtual", pkg.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-[#D93025] opacity-0 group-hover:opacity-100 transition-all text-xs font-bold"
                      >
                        ✕ Hapus
                      </button>
                      <h4 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-widest">
                        Opsi Virtual #{index + 1}
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            Nama Paket
                          </label>
                          <input
                            type="text"
                            value={pkg.nama}
                            onChange={(e) =>
                              handlePackageChange(
                                "virtual",
                                pkg.id,
                                "nama",
                                e.target.value,
                              )
                            }
                            placeholder="Basic"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            Jarak / Kategori
                          </label>
                          <input
                            type="text"
                            value={pkg.jarak}
                            onChange={(e) =>
                              handlePackageChange(
                                "virtual",
                                pkg.id,
                                "jarak",
                                e.target.value,
                              )
                            }
                            placeholder="5K"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            Harga (Rp)
                          </label>
                          <input
                            type="number"
                            value={pkg.harga}
                            onChange={(e) =>
                              handlePackageChange(
                                "virtual",
                                pkg.id,
                                "harga",
                                Number(e.target.value),
                              )
                            }
                            placeholder="150000"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8] font-mono"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Benefit Diterima
                        </label>
                        <input
                          type="text"
                          value={pkg.benefit}
                          onChange={(e) =>
                            handlePackageChange(
                              "virtual",
                              pkg.id,
                              "benefit",
                              e.target.value,
                            )
                          }
                          placeholder="E-BIB, E-Certificate, Jersey"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                          required
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addPackage("virtual")}
                    className="w-full py-2.5 border border-dashed border-[#1A73E8] text-[#1A73E8] rounded-lg text-sm font-bold hover:bg-[#E8F0FE] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>+</span> Tambah Opsi Paket Virtual
                  </button>

                  <div className="pt-6 border-t border-slate-100">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Ongkir Flat Pengiriman Medali/Jersey
                    </label>
                    <input
                      type="number"
                      name="ongkirFlat"
                      value={vrSettings.ongkirFlat || 0}
                      onChange={handleSettingChange}
                      className="w-full md:w-1/2 px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                      required
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ======================================= */}
        {/* TAB 2: OFFLINE RUN (HYBRID) */}
        {/* ======================================= */}
        <div
          className={
            activeTab === "offline"
              ? "block animate-in fade-in slide-in-from-bottom-4 duration-300"
              : "hidden"
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200">
            <div className="lg:col-span-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                Setup Offline Run
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Manajemen landing page khusus pendaftaran Offline Run dan lokasi
                venue.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              {/* TOGGLE OFFLINE RUN */}
              <div
                className={`flex items-center justify-between p-4 border rounded-xl transition-all ${vrSettings.isOfflineRunEnabled ? "bg-white border-[#1A73E8] shadow-[0_0_0_1px_rgba(26,115,232,0.1)]" : "bg-[#F8F9FA] border-slate-200"}`}
              >
                <div>
                  <p
                    className={`font-bold text-sm ${vrSettings.isOfflineRunEnabled ? "text-[#1A73E8]" : "text-slate-700"}`}
                  >
                    Modul Offline Run (Hybrid)
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Jika aktif, form pendaftaran offline akan tersedia untuk
                    publik.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    name="isOfflineRunEnabled"
                    checked={vrSettings.isOfflineRunEnabled || false}
                    onChange={handleSettingChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
                </label>
              </div>

              {vrSettings.isOfflineRunEnabled && (
                <div className="space-y-5 pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Tampilan Landing Page
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Pilih Status
                      </label>
                      <select
                        name="offlineStatus"
                        value={vrSettings.offlineStatus}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800"
                      >
                        <option value="buka">BUKA (Pendaftaran Aktif)</option>
                        <option value="coming_soon">COMING SOON</option>
                        <option value="tutup">TUTUP</option>
                      </select>
                    </div>
                    {vrSettings.offlineStatus === "coming_soon" && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Teks Coming Soon
                        </label>
                        <input
                          type="text"
                          name="offlineComingSoonText"
                          value={vrSettings.offlineComingSoonText || ""}
                          onChange={handleSettingChange}
                          className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm"
                          placeholder="September 2026"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-[#F8F9FA] p-4 rounded-lg border border-slate-200">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Lokasi / Venue Kumpul
                      </label>
                      <input
                        type="text"
                        name="offlineLocation"
                        value={vrSettings.offlineLocation || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm"
                        placeholder="Lapangan Rektorat UII"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Tanggal Acara
                      </label>
                      <input
                        type="date"
                        name="offlineDate"
                        value={vrSettings.offlineDate || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Jam Kumpul
                      </label>
                      <input
                        type="time"
                        name="offlineTime"
                        value={vrSettings.offlineTime || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Total Kuota Tersedia
                      </label>
                      <input
                        type="number"
                        name="offlineQuota"
                        value={vrSettings.offlineQuota || 0}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm font-mono"
                        placeholder="500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        URL Gambar Peta Rute
                      </label>
                      <input
                        type="text"
                        name="urlOfflineRouteMap"
                        value={vrSettings.urlOfflineRouteMap || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-md focus:border-[#1A73E8] outline-none text-sm font-mono"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {vrSettings.isOfflineRunEnabled && (
            <>
              {/* TIMELINE OFFLINE */}
              <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-200 mt-6">
                <div className="lg:col-span-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.89-1.99 2L3 19c0 1.1.89 2 1.99 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                    </svg>
                    Timeline Offline Run
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Konfigurasi jadwal yang akan muncul di popup timeline khusus
                    Offline Run.
                  </p>
                </div>
                <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Batas Pendaftaran
                      </label>
                      <input
                        type="datetime-local"
                        name="offlineTanggalPenutupan"
                        value={vrSettings.offlineTanggalPenutupan || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Teks Pelaksanaan
                      </label>
                      <input
                        type="text"
                        name="offlinePeriodeLari"
                        value={vrSettings.offlinePeriodeLari || ""}
                        onChange={handleSettingChange}
                        placeholder="15 Mei 2026, 05:30 WIB"
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Jadwal Ambil Racepack
                      </label>
                      <input
                        type="text"
                        name="offlinePeriodePengiriman"
                        value={vrSettings.offlinePeriodePengiriman || ""}
                        onChange={handleSettingChange}
                        placeholder="12 - 14 Mei 2026"
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Info Puncak Acara
                      </label>
                      <input
                        type="text"
                        name="offlineJadwalPuncakAcara"
                        value={vrSettings.offlineJadwalPuncakAcara || ""}
                        onChange={handleSettingChange}
                        placeholder="Doorprize & Hiburan"
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* PAKET OFFLINE RUN */}
              <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-200 mt-6">
                <div className="lg:col-span-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 10V6a2 2 0 00-2-2H4c-1.1 0-1.99.89-1.99 2v4c1.1 0 1.99.9 1.99 2s-.89 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2s.9-2 2-2zm-2-1.46c-1.19.69-2 1.99-2 3.46s.81 2.77 2 3.46V18H4v-2.54c1.19-.69 2-1.99 2-3.46s-.81-2.77-2-3.46V6h16v2.54z" />
                    </svg>
                    Paket Offline
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Atur kategori, harga, dan kuota khusus untuk lari fisik di
                    venue.
                  </p>
                </div>
                <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
                  {vrSettings.offlinePackages.map((pkg: any, index: number) => (
                    <div
                      key={pkg.id}
                      className={`p-5 rounded-lg border relative group transition-colors ${pkg.isHighlight ? "bg-[#E8F0FE]/50 border-[#1A73E8]" : "bg-[#F8F9FA] border-slate-200"}`}
                    >
                      <button
                        type="button"
                        onClick={() => removePackage("offline", pkg.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-[#D93025] opacity-0 group-hover:opacity-100 transition-all text-xs font-bold"
                      >
                        ✕ Hapus
                      </button>
                      <div className="flex items-center gap-3 mb-4">
                        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
                          Opsi Offline #{index + 1}
                        </h4>
                        <label className="flex items-center gap-1.5 cursor-pointer ml-auto mr-12 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-sm hover:bg-slate-50">
                          <input
                            type="checkbox"
                            checked={pkg.isHighlight || false}
                            onChange={(e) =>
                              handlePackageChange(
                                "offline",
                                pkg.id,
                                "isHighlight",
                                e.target.checked,
                              )
                            }
                            className="w-3.5 h-3.5 accent-[#1A73E8]"
                          />
                          <span className="text-[9px] font-bold text-slate-600 uppercase">
                            Jadikan Highlight
                          </span>
                        </label>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            Nama Kategori
                          </label>
                          <input
                            type="text"
                            value={pkg.nama}
                            onChange={(e) =>
                              handlePackageChange(
                                "offline",
                                pkg.id,
                                "nama",
                                e.target.value,
                              )
                            }
                            placeholder="Early Bird"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            Jarak
                          </label>
                          <input
                            type="text"
                            value={pkg.jarak}
                            onChange={(e) =>
                              handlePackageChange(
                                "offline",
                                pkg.id,
                                "jarak",
                                e.target.value,
                              )
                            }
                            placeholder="10K"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            Kuota
                          </label>
                          <input
                            type="number"
                            value={pkg.kuota}
                            onChange={(e) =>
                              handlePackageChange(
                                "offline",
                                pkg.id,
                                "kuota",
                                Number(e.target.value),
                              )
                            }
                            placeholder="100"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8] font-mono"
                            required
                          />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                            Harga (Rp)
                          </label>
                          <input
                            type="number"
                            value={pkg.harga}
                            onChange={(e) =>
                              handlePackageChange(
                                "offline",
                                pkg.id,
                                "harga",
                                Number(e.target.value),
                              )
                            }
                            placeholder="200000"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8] font-mono"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">
                          Benefit Diterima
                        </label>
                        <input
                          type="text"
                          value={pkg.benefit}
                          onChange={(e) =>
                            handlePackageChange(
                              "offline",
                              pkg.id,
                              "benefit",
                              e.target.value,
                            )
                          }
                          placeholder="Jersey, Medali Fisik, BIB"
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                          required
                        />
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addPackage("offline")}
                    className="w-full py-2.5 border border-dashed border-[#1A73E8] text-[#1A73E8] rounded-lg text-sm font-bold hover:bg-[#E8F0FE] transition-colors flex items-center justify-center gap-2"
                  >
                    <span>+</span> Tambah Opsi Paket Offline
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ======================================= */}
        {/* TAB 3: CHARITY & ASET */}
        {/* ======================================= */}
        <div
          className={
            activeTab === "charity"
              ? "block animate-in fade-in slide-in-from-bottom-4 duration-300"
              : "hidden"
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200">
            <div className="lg:col-span-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                Sesi Charity
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Aktifkan atau nonaktifkan fitur penggalangan dana di halaman
                publik, serta atur detail teksnya.
              </p>
            </div>

            <div className="lg:col-span-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
              {/* 🔥 MASTER SWITCH CHARITY (TOGGLE) 🔥 */}
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200 mb-2">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Status Fitur Charity
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {vrSettings.isCharityActive
                      ? "🟢 Sedang Aktif di Homepage"
                      : "⚫ Disembunyikan dari Publik"}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isCharityActive"
                    checked={vrSettings.isCharityActive || false}
                    onChange={(e) => {
                      // Jika handleSettingChange bawaanmu belum support checkbox,
                      // pastikan dia mengambil nilai dari e.target.checked
                      handleSettingChange({
                        target: {
                          name: "isCharityActive",
                          value: e.target.checked,
                        },
                      } as any);
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E8E3E]"></div>
                </label>
              </div>

              {/* Area Setting (Bisa dibuat transparan kalau sedang OFF) */}
              <div
                className={`space-y-5 transition-opacity duration-300 ${!vrSettings.isCharityActive ? "opacity-40 pointer-events-none" : "opacity-100"}`}
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Judul Sesi Charity
                  </label>
                  <input
                    type="text"
                    name="charityTitle"
                    value={vrSettings.charityTitle || ""}
                    onChange={handleSettingChange}
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800"
                    placeholder="Contoh: Donasi Pendidikan IKA UII"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Deskripsi Charity
                  </label>
                  <textarea
                    name="charityDesc"
                    value={vrSettings.charityDesc || ""}
                    onChange={handleSettingChange}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm transition-all text-slate-800 custom-scrollbar"
                  ></textarea>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                    Minimal Donasi (Rp)
                  </label>
                  <input
                    type="number"
                    name="minCharity"
                    value={vrSettings.minCharity || 0}
                    onChange={handleSettingChange}
                    className="w-full md:w-1/2 px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 border-t border-slate-200 mt-6">
            <div className="lg:col-span-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-5h3v5zm0-7H7V7h3v3zm7 7h-5V7h5v10z" />
                </svg>
                Aset Desain & Mockup
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Kelola URL gambar untuk preview Medali, Jersey, dan Sertifikat.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-6">
              {vrSettings.isVirtualRunEnabled && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">
                    Aset Virtual Run
                  </h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL Jersey Virtual
                      </label>
                      <input
                        type="text"
                        name="urlJerseyVirtual"
                        value={vrSettings.urlJerseyVirtual || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL Medali Virtual
                      </label>
                      <input
                        type="text"
                        name="urlMedaliVirtual"
                        value={vrSettings.urlMedaliVirtual || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL Template E-BIB
                      </label>
                      <input
                        type="text"
                        name="urlBibVirtual"
                        value={vrSettings.urlBibVirtual || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL Template E-Cert
                      </label>
                      <input
                        type="text"
                        name="urlSertifikatVirtual"
                        value={vrSettings.urlSertifikatVirtual || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {vrSettings.isOfflineRunEnabled && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">
                    Aset Offline Run
                  </h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL Jersey Offline
                      </label>
                      <input
                        type="text"
                        name="urlJerseyOffline"
                        value={vrSettings.urlJerseyOffline || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                        URL Medali Offline
                      </label>
                      <input
                        type="text"
                        name="urlMedaliOffline"
                        value={vrSettings.urlMedaliOffline || ""}
                        onChange={handleSettingChange}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Teks Sertifikat */}
              {vrSettings.isVirtualRunEnabled && (
                <div className="bg-[#F8F9FA] p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-2 border-b border-slate-200 pb-2 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z" />
                    </svg>
                    Teks Sertifikat Kelulusan
                  </h4>
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Judul Utama
                      </label>
                      <input
                        type="text"
                        name="certTitle"
                        value={vrSettings.certTitle || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-[#1A73E8] outline-none text-sm font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        Sub Judul
                      </label>
                      <input
                        type="text"
                        name="certSubtitle"
                        value={vrSettings.certSubtitle || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Kalimat Pengantar (Atas Nama)
                    </label>
                    <input
                      type="text"
                      name="certOpening"
                      value={vrSettings.certOpening || ""}
                      onChange={handleSettingChange}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800 italic"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      Kalimat Penutup (Bawah Nama)
                    </label>
                    <textarea
                      name="certFooter"
                      value={vrSettings.certFooter || ""}
                      onChange={handleSettingChange}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:border-[#1A73E8] outline-none text-sm text-slate-800 custom-scrollbar"
                    ></textarea>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================= */}
        {/* TAB 4: PEMBAYARAN */}
        {/* ======================================= */}
        <div
          className={
            activeTab === "pembayaran"
              ? "block animate-in fade-in slide-in-from-bottom-4 duration-300"
              : "hidden"
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 border-slate-200">
            <div className="lg:col-span-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
                </svg>
                Metode Pembayaran
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Pilih gerbang pembayaran yang akan digunakan peserta saat
                checkout.
              </p>
            </div>

            <div className="lg:col-span-8 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div
                  onClick={() => selectPaymentMethod("midtrans")}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${vrSettings.metodePembayaran === "midtrans" ? "bg-[#E8F0FE] border-[#1A73E8] text-[#1A73E8] shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-[#1A73E8]"}`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z" />
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Midtrans
                  </span>
                </div>
                <div
                  onClick={() => selectPaymentMethod("manual")}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${vrSettings.metodePembayaran === "manual" ? "bg-[#E6F4EA] border-[#1E8E3E] text-[#1E8E3E] shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-[#1E8E3E]"}`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-8.5-9L2 6v2h19V6l-9.5-5z" />
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    Trf. Manual
                  </span>
                </div>
                <div
                  onClick={() => selectPaymentMethod("qris")}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-all ${vrSettings.metodePembayaran === "qris" ? "bg-[#F3E8FD] border-[#A142F4] text-[#A142F4] shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-[#A142F4]"}`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm-2 2h-2v2h2v-2zm2 2h-2v2h2v-2zm-4 2h-2v2h2v-2zm6-6h-2v2h2v-2z" />
                  </svg>
                  <span className="text-[11px] font-bold uppercase tracking-wider">
                    QRIS
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                {vrSettings.metodePembayaran === "midtrans" && (
                  <div className="space-y-6">
                    <div className="bg-[#F8F9FA] p-4 rounded-lg flex items-center justify-between border border-slate-200">
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          Mode Lingkungan API
                        </p>
                        <p className="text-xs text-slate-500">
                          Pilih mode Sandbox untuk testing, atau Live untuk
                          menerima dana asli.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          name="isProduction"
                          checked={vrSettings.isProduction || false}
                          onChange={handleSettingChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1E8E3E]"></div>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Client Key (Publik)
                        </label>
                        <input
                          type="text"
                          name="midtransClientKey"
                          value={vrSettings.midtransClientKey || ""}
                          onChange={handleSettingChange}
                          className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                          placeholder="SB-Mid-client-..."
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Server Key (Rahasia)
                        </label>
                        <input
                          type="password"
                          name="midtransServerKey"
                          value={vrSettings.midtransServerKey || ""}
                          onChange={handleSettingChange}
                          className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                          placeholder="SB-Mid-server-..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {vrSettings.metodePembayaran === "manual" && (
                  <div className="space-y-6">
                    <div className="bg-[#FEF7E0] p-4 rounded-lg flex items-start gap-3 border border-[#F9AB00]/20">
                      <svg
                        className="w-5 h-5 text-[#B08D00] shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <p className="text-xs text-[#B08D00] leading-relaxed font-bold">
                        Peserta wajib mengunggah foto struk transfer. Admin
                        bertugas mengecek mutasi dan verifikasi manual.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Nama Bank
                        </label>
                        <input
                          type="text"
                          name="manualBank"
                          value={vrSettings.manualBank || ""}
                          onChange={handleSettingChange}
                          className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm text-slate-800 uppercase"
                          placeholder="BCA / MANDIRI"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Nomor Rekening
                        </label>
                        <input
                          type="text"
                          name="manualRekening"
                          value={vrSettings.manualRekening || ""}
                          onChange={handleSettingChange}
                          className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                          placeholder="0123456789"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                          Atas Nama (Pemilik Rekening)
                        </label>
                        <input
                          type="text"
                          name="manualNama"
                          value={vrSettings.manualNama || ""}
                          onChange={handleSettingChange}
                          className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm text-slate-800 uppercase"
                          placeholder="IKA UII"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {vrSettings.metodePembayaran === "qris" && (
                  <div className="space-y-6">
                    <div className="bg-[#F3E8FD] p-4 rounded-lg flex items-start gap-3 border border-[#A142F4]/20">
                      <svg
                        className="w-5 h-5 text-[#8430CE] shrink-0"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      <p className="text-xs text-[#8430CE] leading-relaxed font-bold">
                        Pembayaran QRIS statis membutuhkan upload struk dari
                        peserta untuk diverifikasi manual oleh Admin.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                        URL Gambar Barcode QRIS
                      </label>
                      <input
                        type="text"
                        name="urlQris"
                        value={vrSettings.urlQris || ""}
                        onChange={handleSettingChange}
                        className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-slate-200 rounded-lg focus:bg-white focus:border-[#1A73E8] outline-none text-sm font-mono text-slate-800"
                        placeholder="https://..."
                      />
                    </div>
                    {vrSettings.urlQris && (
                      <div className="mt-4 border border-slate-200 p-4 rounded-xl flex justify-center bg-[#F8F9FA]">
                        <img
                          src={vrSettings.urlQris}
                          alt="QRIS Preview"
                          className="h-48 object-contain rounded-lg shadow-sm"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* STICKY FOOTER SAVE */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-slate-200 py-3.5 px-6 md:px-8 flex justify-between items-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <p className="text-[11px] text-slate-500 font-medium hidden sm:block uppercase tracking-wider">
          Periksa kembali konfigurasi sebelum menyimpan.
        </p>
        <button
          onClick={saveSettings}
          disabled={isSavingSettings}
          className="w-full sm:w-auto bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold px-8 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
        >
          {isSavingSettings ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Menyimpan...
            </>
          ) : (
            "Simpan Pengaturan"
          )}
        </button>
      </div>
    </div>
  );
}
