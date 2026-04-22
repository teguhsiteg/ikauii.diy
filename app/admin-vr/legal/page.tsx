"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";

export default function AdminLegalPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "virtual_run"));
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

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await setDoc(doc(db, "settings", "virtual_run"), settings, {
        merge: true,
      });
      setPopup({
        type: "success",
        text: "Data legal dan asuransi berhasil disimpan.",
      });
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
            Legalitas & Persetujuan
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola teks Syarat & Ketentuan (T&C) serta Asuransi Peserta.
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* TAMPILKAN JIKA OFFLINE AKTIF */}
        {settings?.isOfflineRunEnabled && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3 bg-white">
              <svg
                className="w-5 h-5 text-slate-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              <h2 className="font-bold text-slate-800 text-[15px]">
                Dokumen Offline Run
              </h2>
            </div>
            <div className="p-6 space-y-6 bg-[#F8F9FA]">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Syarat & Ketentuan (Offline)
                </label>
                <textarea
                  name="tncOffline"
                  value={settings.tncOffline || ""}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Ketikkan syarat dan ketentuan untuk Offline Run di sini..."
                  className="w-full p-4 bg-white border border-slate-300 rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none text-sm transition-all text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Informasi Asuransi (Offline)
                </label>
                <textarea
                  name="insOffline"
                  value={settings.insOffline || ""}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Ketikkan rincian pertanggungan asuransi untuk Offline Run di sini..."
                  className="w-full p-4 bg-white border border-slate-300 rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none text-sm transition-all text-slate-700"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAMPILKAN JIKA VIRTUAL AKTIF */}
        {settings?.isVirtualRunEnabled && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3 bg-white">
              <svg
                className="w-5 h-5 text-slate-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <h2 className="font-bold text-slate-800 text-[15px]">
                Dokumen Virtual Run
              </h2>
            </div>
            <div className="p-6 space-y-6 bg-[#F8F9FA]">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Syarat & Ketentuan (Virtual)
                </label>
                <textarea
                  name="tncVirtual"
                  value={settings.tncVirtual || ""}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Ketikkan syarat dan ketentuan untuk Virtual Run di sini..."
                  className="w-full p-4 bg-white border border-slate-300 rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none text-sm transition-all text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                  Informasi Asuransi (Virtual)
                </label>
                <textarea
                  name="insVirtual"
                  value={settings.insVirtual || ""}
                  onChange={handleChange}
                  rows={6}
                  placeholder="Ketikkan rincian pertanggungan asuransi untuk Virtual Run di sini..."
                  className="w-full p-4 bg-white border border-slate-300 rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none text-sm transition-all text-slate-700"
                />
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
