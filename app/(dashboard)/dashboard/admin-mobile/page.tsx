"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface Banner {
  id: string;
  imageUrl: string;
  link?: string;
  title?: string;
}

interface MobileConfig {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  minVersionAndroid: string;
  minVersionIOS: string;
  banners: Banner[];
}

export default function AdminMobilePage() {
  const [config, setConfig] = useState<MobileConfig>({
    maintenanceMode: false,
    maintenanceMessage: "Sedang dalam perbaikan rutin.",
    minVersionAndroid: "1.0.0",
    minVersionIOS: "1.0.0",
    banners: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: "", type: "success" });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const docRef = doc(db, "pengaturan", "mobile_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data() as MobileConfig);
      }
    } catch (error) {
      console.error("Gagal mengambil konfigurasi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "pengaturan", "mobile_config");
      await setDoc(docRef, config, { merge: true });
      showToast("Konfigurasi berhasil disimpan!", "success");
    } catch (error) {
      console.error("Gagal menyimpan konfigurasi:", error);
      showToast("Terjadi kesalahan saat menyimpan.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: "", type }), 3000);
  };

  const updateField = (field: keyof MobileConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const addBanner = () => {
    setConfig({
      ...config,
      banners: [
        ...config.banners,
        { id: Date.now().toString(), imageUrl: "", title: "", link: "" },
      ],
    });
  };

  const updateBanner = (id: string, field: keyof Banner, value: string) => {
    setConfig({
      ...config,
      banners: config.banners.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
    });
  };

  const removeBanner = (id: string) => {
    setConfig({
      ...config,
      banners: config.banners.filter((b) => b.id !== id),
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Mobile</h1>
          <p className="text-slate-500 mt-1">Konfigurasi pusat aplikasi Android & iOS</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </div>

      {toast.isOpen && (
        <div
          className={`p-4 mb-4 rounded-lg text-sm font-medium ${
            toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MAINTENANCE MODE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Mode Pemeliharaan</h2>
              <p className="text-xs text-slate-500 mt-1">Blokir akses masuk aplikasi</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={config.maintenanceMode}
                onChange={(e) => updateField("maintenanceMode", e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
            </label>
          </div>
          
          <div className="space-y-2 mt-4">
            <label className="text-sm font-semibold text-slate-700">Pesan Pemeliharaan</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none h-24"
              value={config.maintenanceMessage}
              onChange={(e) => updateField("maintenanceMessage", e.target.value)}
              disabled={!config.maintenanceMode}
              placeholder="Aplikasi sedang dalam perbaikan..."
            />
          </div>
        </div>

        {/* FORCE UPDATE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Wajib Update</h2>
            <p className="text-xs text-slate-500 mt-1">Versi minimum agar aplikasi dapat dibuka</p>
          </div>
          
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-semibold text-slate-700">Minimum Versi Android</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={config.minVersionAndroid}
                onChange={(e) => updateField("minVersionAndroid", e.target.value)}
                placeholder="1.0.0"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700">Minimum Versi iOS</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-3 mt-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={config.minVersionIOS}
                onChange={(e) => updateField("minVersionIOS", e.target.value)}
                placeholder="1.0.0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* BANNERS */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Banner Home Screen</h2>
            <p className="text-xs text-slate-500 mt-1">Gambar bergerak di halaman utama</p>
          </div>
          <button
            onClick={addBanner}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Tambah Banner
          </button>
        </div>

        <div className="space-y-4">
          {config.banners.map((banner, index) => (
            <div key={banner.id} className="border border-slate-200 rounded-xl p-4 flex gap-4 bg-slate-50 relative">
              <div className="flex-1 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">URL Gambar Banner</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-sm outline-none"
                    value={banner.imageUrl}
                    onChange={(e) => updateBanner(banner.id, "imageUrl", e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600">Judul (Opsional)</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-sm outline-none"
                      value={banner.title}
                      onChange={(e) => updateBanner(banner.id, "title", e.target.value)}
                      placeholder="Promo Anggota"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-slate-600">Link Tujuan (Opsional)</label>
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-2 mt-1 text-sm outline-none"
                      value={banner.link}
                      onChange={(e) => updateBanner(banner.id, "link", e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Preview Image if exists */}
              {banner.imageUrl ? (
                <div className="w-32 h-20 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                  <img src={banner.imageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-32 h-20 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-[10px] text-slate-400">No Image</span>
                </div>
              )}

              <button
                onClick={() => removeBanner(banner.id)}
                className="absolute -top-3 -right-3 bg-red-100 hover:bg-red-200 text-red-600 w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
          {config.banners.length === 0 && (
            <div className="text-center p-8 border border-dashed border-slate-300 rounded-xl">
              <p className="text-slate-500 text-sm">Belum ada banner yang ditambahkan.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
