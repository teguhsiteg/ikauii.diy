"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { onAuthStateChanged, getIdToken } from "firebase/auth";

// IMPORT SEMUA TAB KOMPONEN
import TabVirtual from "./tabs/TabVirtual";
import TabOffline from "./tabs/TabOffline";
import TabRoutes from "./tabs/TabRoutes"; // 🔥 IMPORT TAB BARU
import TabCharity from "./tabs/TabCharity";
import TabPembayaran from "./tabs/TabPembayaran";

// ============================================================
// HELPER: SEMUA OPERASI TULIS ADMIN LEWAT SERVER ROUTE
// (Firestore rules client dikunci ketat — isAdmin wajib role
// "admin" di users/{uid}. Server route memakai firebase-admin
// dan mendukung admin/super_admin/superadmin.)
// ============================================================
async function callVrAdminApi(action: string, payload: Record<string, unknown>) {
  const user = auth.currentUser;
  if (!user) throw new Error("Belum login.");

  const token = await getIdToken(user);
  const res = await fetch("/api/vr-admin/settings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data;
}

export default function PengaturanAdminPage() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("virtual");

  const defaultSettings = {
    isVirtualRunEnabled: true,
    isWaitingRoomActive: false,
    waChannelUrl: "",
    eventName: "IKA UII VR 2026",
    statusPendaftaran: "Buka",
    landingTitle: "IKA UII VIRTUAL RUN 2026",
    landingDesc: "",
    urlHeroBg: "",
    tanggalPembukaan: "",
    tanggalPenutupan: "",
    periodeLariStart: "",
    periodeLariEnd: "",
    periodeLari: "",
    periodePengiriman: "",
    jadwalPuncakAcara: "",
    urlLiveStreaming: "",
    isOfflineRunEnabled: false,
    offlineLocation: "",
    offlineDate: "",
    offlineTime: "",
    offlineQuota: 0,
    urlOfflineRouteMap: "",
    offlineTanggalPembukaan: "",
    offlineTanggalPenutupan: "",
    offlinePeriodeLari: "",
    offlinePeriodePengiriman: "",
    offlineJadwalPuncakAcara: "",
    allowedCategories: ["Alumni", "SMA/Pelajar", "Umum"],
    urlJerseyVirtual: "",
    urlMedaliVirtual: "",
    urlBibVirtual: "",
    urlSertifikatVirtual: "",
    urlJerseyOffline: "",
    urlMedaliOffline: "",
    urlSertifikatOffline: "",
    offlineCertTitle: "E-CERTIFICATE",
    offlineCertSubtitle: "Offline Run Finisher",
    offlineCertOpening: "Diberikan kepada:",
    offlineCertFooter: "",
    charityTitle: "",
    charityDesc: "",
    urlCharityImg: "",
    minCharity: 25000,
    ongkirFlat: 25000,
    certTitle: "E-CERTIFICATE",
    certSubtitle: "OF COMPLETION",
    certOpening: "This certificate is proudly presented to:",
    certFooter: "",
    metodePembayaran: "midtrans",
    midtransClientKey: "",
    midtransServerKey: "",
    isProduction: false,
    manualBank: "",
    manualRekening: "",
    manualNama: "",
    urlQris: "",
    virtualPackages: [
      {
        id: Date.now().toString(),
        nama: "Standard",
        jarak: "5K",
        harga: 150000,
        benefit: "Jersey",
      },
    ],
    offlinePackages: [
      {
        id: (Date.now() + 1).toString(),
        nama: "Early Bird",
        jarak: "10K",
        kuota: 0,
        harga: 200000,
        benefit: "Jersey",
        urlMap: "",
        polyline: "", // 🔥 DEFAULT BARU UNTUK RUTE
        waypoints: [], // 🔥 DEFAULT BARU UNTUK TITIK FASILITAS
      },
    ],
  };

  const [vrSettings, setVrSettings] = useState(defaultSettings);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [popup, setPopup] = useState<{
    type: "success" | "error" | "warning";
    text: string;
  } | null>(null);

  // STATE PROMO
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const [newPromo, setNewPromo] = useState({
    kode: "",
    jenisDiskon: "persen",
    nilaiDiskon: 0,
    kuotaMaksimal: 100,
    tanggalKedaluwarsa: "",
    kategoriKhusus: "All",
    isActive: true,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setAdminUser(user));
    const fetchSettingsAndPromo = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "virtual_run"));
        if (docSnap.exists()) {
          const data = docSnap.data();

          // Server key Midtrans kini di koleksi `secrets` (admin-only) — merge ke state
          try {
            const secretSnap = await getDoc(doc(db, "secrets", "virtual_run"));
            if (secretSnap.exists() && secretSnap.data()?.midtransServerKey) {
              data.midtransServerKey = secretSnap.data()!.midtransServerKey;
            }
          } catch {}

          // 🔥 MAP Data Offline agar field rute yang baru tidak error (undefined) di data lama
          const processedOfflinePackages = (
            data.offlinePackages || defaultSettings.offlinePackages
          ).map((pkg: any) => ({
            ...pkg,
            urlMap: pkg.urlMap || "",
            polyline: pkg.polyline || "",
            waypoints: pkg.waypoints || [],
          }));

          setVrSettings({
            ...defaultSettings,
            ...data,
            offlinePackages: processedOfflinePackages,
          });
        }
        const promoSnap = await getDocs(collection(db, "promo_codes"));
        setPromoCodes(
          promoSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettingsAndPromo();
    return () => unsubscribe();
  }, []);

  // HANDLERS...
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
  const handleCategoryToggle = (category: string) => {
    setVrSettings((prev: any) => {
      const currentCats = prev.allowedCategories || ["Umum"];
      let newCats = currentCats.includes(category)
        ? currentCats.filter((c: string) => c !== category)
        : [...currentCats, category];
      if (newCats.length === 0) newCats = ["Umum"];
      return { ...prev, allowedCategories: newCats };
    });
  };
  const selectPaymentMethod = (method: string) =>
    setVrSettings({ ...vrSettings, metodePembayaran: method });
  const handlePackageChange = (
    type: "virtual" | "offline",
    id: string,
    field: string,
    value: any,
  ) => {
    const target = type === "virtual" ? "virtualPackages" : "offlinePackages";
    setVrSettings({
      ...vrSettings,
      [target]: vrSettings[target].map((pkg: any) =>
        pkg.id === id ? { ...pkg, [field]: value } : pkg,
      ),
    });
  };
  const addPackage = (type: "virtual" | "offline") => {
    const target = type === "virtual" ? "virtualPackages" : "offlinePackages";
    const newPkg =
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
            urlMap: "",
            polyline: "", // 🔥 Reset saat bikin paket baru
            waypoints: [], // 🔥 Reset saat bikin paket baru
          };
    setVrSettings({ ...vrSettings, [target]: [...vrSettings[target], newPkg] });
  };
  const removePackage = (type: "virtual" | "offline", id: string) => {
    const target = type === "virtual" ? "virtualPackages" : "offlinePackages";
    setVrSettings({
      ...vrSettings,
      [target]: vrSettings[target].filter((pkg: any) => pkg.id !== id),
    });
  };
  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await callVrAdminApi("save-settings", { settings: vrSettings });
      setPopup({ type: "success", text: "Pengaturan berhasil disimpan." });
    } catch (error: any) {
      console.error("[pengaturan] save error:", error);
      setPopup({
        type: "error",
        text: `Gagal menyimpan: ${error?.message || "terjadi kesalahan"}`,
      });
    } finally {
      setIsSavingSettings(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };

  // PROMO HANDLERS
  const handleAddPromo = async () => {
    if (
      !newPromo.kode.trim() ||
      newPromo.nilaiDiskon <= 0 ||
      !newPromo.tanggalKedaluwarsa
    )
      return setPopup({ type: "warning", text: "Isi data dengan lengkap!" });
    setIsSavingPromo(true);
    try {
      const promoData = {
        ...newPromo,
        kode: newPromo.kode.toUpperCase().trim().replace(/\s/g, ""),
      };
      const { id } = await callVrAdminApi("add-promo", { promo: promoData });
      setPromoCodes([
        ...promoCodes,
        {
          id,
          ...promoData,
          kuotaTerpakai: 0,
          createdAt: new Date().toISOString(),
        },
      ]);
      setNewPromo({ ...newPromo, kode: "", nilaiDiskon: 0 });
      setPopup({
        type: "success",
        text: `Promo ${promoData.kode} ditambahkan.`,
      });
    } catch (error: any) {
      console.error("[pengaturan] add promo error:", error);
      setPopup({
        type: "error",
        text: `Gagal menambah promo: ${error?.message || "terjadi kesalahan"}`,
      });
    } finally {
      setIsSavingPromo(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };
  const handleTogglePromoStatus = async (id: string, status: boolean) => {
    try {
      await callVrAdminApi("toggle-promo", { id, isActive: !status });
      setPromoCodes(
        promoCodes.map((p) => (p.id === id ? { ...p, isActive: !status } : p)),
      );
    } catch (error: any) {
      console.error("[pengaturan] toggle promo error:", error);
      setPopup({
        type: "error",
        text: `Gagal ubah status promo: ${error?.message || "terjadi kesalahan"}`,
      });
      setTimeout(() => setPopup(null), 3000);
    }
  };
  const handleDeletePromo = async (id: string, kode: string) => {
    if (!confirm(`Hapus promo ${kode}?`)) return;
    try {
      await callVrAdminApi("delete-promo", { id });
      setPromoCodes(promoCodes.filter((p) => p.id !== id));
    } catch (error: any) {
      console.error("[pengaturan] delete promo error:", error);
      setPopup({
        type: "error",
        text: `Gagal hapus promo: ${error?.message || "terjadi kesalahan"}`,
      });
      setTimeout(() => setPopup(null), 3000);
    }
  };

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center text-blue-500 font-bold animate-pulse">
        MEMUAT SISTEM...
      </div>
    );

  return (
    <div className="animate-in fade-in max-w-5xl mx-auto pb-24 relative p-4 sm:p-8 font-sans">
      {popup && (
        <div className="fixed top-6 right-6 z-[100] bg-white p-4 rounded-xl shadow-lg border border-slate-200">
          <strong>{popup.type}</strong>: {popup.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">
            Pengaturan Sistem
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola konfigurasi event, jadwal, mode offline, dan gerbang
            pembayaran.
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSavingSettings}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-2.5 rounded-lg disabled:opacity-50 shadow-sm transition-colors"
        >
          {isSavingSettings ? "Menyimpan..." : "Simpan Pengaturan Utama"}
        </button>
      </div>

      <div className="flex overflow-x-auto gap-1 mb-8 border-b border-slate-200">
        {/* 🔥 TAMBAH TAB "RUTE" DISINI 🔥 */}
        {["virtual", "offline", "rute", "charity", "pembayaran"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold uppercase ${activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-slate-500"}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <form onSubmit={saveSettings}>
        {activeTab === "virtual" && (
          <TabVirtual
            vrSettings={vrSettings}
            handleSettingChange={handleSettingChange}
            handlePackageChange={handlePackageChange}
            addPackage={addPackage}
            removePackage={removePackage}
          />
        )}
        {activeTab === "offline" && (
          <TabOffline
            vrSettings={vrSettings}
            handleSettingChange={handleSettingChange}
            handleCategoryToggle={handleCategoryToggle}
            handlePackageChange={handlePackageChange}
            addPackage={addPackage}
            removePackage={removePackage}
          />
        )}

        {/* 🔥 RENDER TAB BARU KITA DISINI 🔥 */}
        {activeTab === "rute" && (
          <TabRoutes
            vrSettings={vrSettings}
            handlePackageChange={handlePackageChange}
          />
        )}

        {activeTab === "charity" && (
          <TabCharity
            vrSettings={vrSettings}
            handleSettingChange={handleSettingChange}
          />
        )}
        {activeTab === "pembayaran" && (
          <TabPembayaran
            vrSettings={vrSettings}
            selectPaymentMethod={selectPaymentMethod}
            handleSettingChange={handleSettingChange}
            promoCodes={promoCodes}
            newPromo={newPromo}
            setNewPromo={setNewPromo}
            handleAddPromo={handleAddPromo}
            handleTogglePromoStatus={handleTogglePromoStatus}
            handleDeletePromo={handleDeletePromo}
            isSavingPromo={isSavingPromo}
          />
        )}
      </form>


    </div>
  );
}
