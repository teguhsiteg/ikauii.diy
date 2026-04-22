"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

export default function AdminKontrolAksesPage() {
  const [settings, setSettings] = useState<any>({
    isOfflineRunEnabled: false,
    isWaitingRoomActive: false,
    waChannelUrl: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Gagal load pengaturan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings({ ...settings, [field]: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(
        doc(db, "settings", "virtual_run"),
        {
          isOfflineRunEnabled: settings.isOfflineRunEnabled,
          isWaitingRoomActive: settings.isWaitingRoomActive,
          waChannelUrl: settings.waChannelUrl,
        },
        { merge: true },
      ); // Menggunakan merge agar tidak menimpa data paket & legal

      setPopup({ type: "success", text: "Kontrol akses berhasil diperbarui." });
    } catch (error) {
      setPopup({ type: "error", text: "Gagal menyimpan perubahan." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-[#1A73E8] font-medium text-sm">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
        MEMUAT DATA...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-24 p-4 sm:p-8 font-sans animate-in fade-in duration-300">
      {/* POPUP NOTIFIKASI (Google Style) */}
      {popup && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center gap-4 min-w-[300px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                popup.type === "success"
                  ? "bg-[#E6F4EA] text-[#1E8E3E]"
                  : "bg-[#FCE8E6] text-[#D93025]"
              }`}
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
              <p className="text-xs text-slate-500 font-medium">{popup.text}</p>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">
            Kontrol Akses & Trafik
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur buka/tutup pendaftaran dan sistem antrean ruang tunggu.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin-vr"
            className="bg-white border border-slate-200 text-slate-700 font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-all shadow-sm"
          >
            Kembali
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold px-6 py-2.5 rounded-lg text-sm transition-colors shadow-sm disabled:opacity-50"
          >
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 1. STATUS PENDAFTARAN */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3 bg-white">
            <svg
              className="w-5 h-5 text-slate-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <h2 className="font-bold text-slate-800 text-[15px]">
              Kran Pendaftaran
            </h2>
          </div>
          <div className="p-6 bg-[#F8F9FA]">
            <div
              className={`flex items-center justify-between p-5 border rounded-xl transition-all bg-white ${
                settings.isOfflineRunEnabled
                  ? "border-[#1A73E8] shadow-[0_0_0_1px_rgba(26,115,232,0.1)]"
                  : "border-slate-200"
              }`}
            >
              <div>
                <p
                  className={`font-bold ${
                    settings.isOfflineRunEnabled
                      ? "text-[#1A73E8]"
                      : "text-slate-800"
                  }`}
                >
                  Status Akses Form Offline Run
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                  Jika dimatikan, halaman form akan dikunci dan publik tidak
                  bisa mendaftar. Gunakan ini saat kuota sudah habis atau
                  sebelum event dirilis.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.isOfflineRunEnabled || false}
                  onChange={(e) =>
                    handleChange("isOfflineRunEnabled", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 2. WAITING ROOM */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3 bg-white">
            <svg
              className="w-5 h-5 text-slate-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
            </svg>
            <h2 className="font-bold text-slate-800 text-[15px]">
              Sistem Antrean (Waiting Room)
            </h2>
          </div>
          <div className="p-6 bg-[#F8F9FA]">
            <div
              className={`flex items-center justify-between p-5 border rounded-xl transition-all bg-white ${
                settings.isWaitingRoomActive
                  ? "border-[#1A73E8] shadow-[0_0_0_1px_rgba(26,115,232,0.1)]"
                  : "border-slate-200"
              }`}
            >
              <div>
                <p
                  className={`font-bold ${
                    settings.isWaitingRoomActive
                      ? "text-[#1A73E8]"
                      : "text-slate-800"
                  }`}
                >
                  Virtual Waiting Room
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
                  Aktifkan saat "War Tiket" untuk menahan lonjakan pengunjung.
                  Jika aktif, pendaftar akan melihat layar antrean sebelum masuk
                  ke form.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.isWaitingRoomActive || false}
                  onChange={(e) =>
                    handleChange("isWaitingRoomActive", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A73E8]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* 3. KOMUNITAS WA */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3 bg-white">
            <svg
              className="w-5 h-5 text-slate-500"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zM12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z" />
            </svg>
            <h2 className="font-bold text-slate-800 text-[15px]">
              Tautan Komunitas
            </h2>
          </div>
          <div className="p-6 bg-[#F8F9FA]">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
              Grup / Channel WhatsApp Resmi
            </label>
            <input
              type="url"
              value={settings.waChannelUrl || ""}
              onChange={(e) => handleChange("waChannelUrl", e.target.value)}
              placeholder="https://whatsapp.com/channel/..."
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all text-sm font-medium text-slate-800"
            />
            <p className="text-[11px] text-slate-500 mt-2 leading-relaxed max-w-2xl">
              Peserta wajib mengklik tautan ini dan menyetujuinya di halaman
              form pendaftaran. Pastikan link aktif agar peserta bisa
              mendapatkan update info terbaru mengenai event.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
