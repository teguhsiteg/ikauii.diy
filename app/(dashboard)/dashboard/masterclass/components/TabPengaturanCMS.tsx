"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function TabPengaturanCMS() {
  const [activeSubTab, setActiveSubTab] = useState("ui"); // 'ui', 'promo', 'roles'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- DATA STATE CMS (MURNI TANPA PAYMENT) ---
  const [cmsData, setCmsData] = useState({
    // 1. Tampilan Landing Page
    heroTitle: "Tingkatkan Skill Ekspertis Bersama Praktisi Terbaik.",
    heroSubtitle:
      "Akses ratusan materi video pembelajaran berkualitas tinggi yang dirancang khusus untuk kebutuhan industri masa kini.",
    heroBgUrl: "",

    // 2. Promo & Ads (Announcement Bar & Kupon)
    promoActive: false,
    promoText:
      "🔥 DISKON SPESIAL: Gunakan kode KEBERSAMAAN untuk diskon 50% seluruh kelas!",
    promoLink: "/masterclass",
    promoCode: "",
    promoDiscount: 0,
  });

  useEffect(() => {
    fetchCmsSettings();
  }, []);

  const fetchCmsSettings = async () => {
    setIsLoading(true);
    try {
      const docSnap = await getDoc(doc(db, "settings", "masterclass_cms"));
      if (docSnap.exists()) {
        setCmsData((prev) => ({ ...prev, ...docSnap.data() }));
      }
    } catch (error) {
      console.error("Gagal load CMS:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...cmsData,
        promoDiscount: Number(cmsData.promoDiscount) || 0,
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "settings", "masterclass_cms"), payload);
      setPopup({ type: "success", text: "Konfigurasi CMS Berhasil Disimpan!" });
    } catch (err) {
      setPopup({ type: "error", text: "Gagal menyimpan perubahan." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-slate-400 font-bold animate-pulse tracking-widest">
        MEMUAT KONFIGURASI CMS...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 font-sans relative">
      {/* POPUP NOTIF */}
      {popup && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in">
          <div
            className={`${popup.type === "success" ? "bg-emerald-600" : "bg-rose-600"} text-white px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm`}
          >
            {popup.text}
          </div>
        </div>
      )}

      {/* LEFT: SUB-NAVIGASI CMS */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm sticky top-5">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Kontrol Konten
            </p>
          </div>
          <nav className="p-2 space-y-1">
            {[
              { id: "ui", label: "Tampilan Utama", icon: "🖼️" },
              { id: "promo", label: "Promo & Kupon", icon: "🎟️" },
              { id: "roles", label: "Akses & Role", icon: "🔐" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveSubTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSubTab === t.id ? "bg-[#0B1120] text-white shadow-md" : "text-slate-500 hover:bg-slate-100"}`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* RIGHT: CONTENT FORM */}
      <div className="flex-1 bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-10 relative overflow-hidden">
        {/* TAB 1: UI SETTINGS */}
        {activeSubTab === "ui" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Visual Homepage
              </h3>
              <p className="text-xs text-slate-500">
                Atur teks penyambutan dan banner di halaman depan Masterclass.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  Hero Title (Tagline Utama)
                </label>
                <input
                  type="text"
                  value={cmsData.heroTitle}
                  onChange={(e) =>
                    setCmsData({ ...cmsData, heroTitle: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  Hero Subtitle
                </label>
                <textarea
                  rows={3}
                  value={cmsData.heroSubtitle}
                  onChange={(e) =>
                    setCmsData({ ...cmsData, heroSubtitle: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-sm leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5">
                  Background Banner URL
                </label>
                <input
                  type="text"
                  value={cmsData.heroBgUrl}
                  onChange={(e) =>
                    setCmsData({ ...cmsData, heroBgUrl: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl focus:bg-white focus:border-blue-500 outline-none text-sm font-mono"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROMO & KUPON */}
        {activeSubTab === "promo" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Sistem Promo & Kupon Diskon
                </h3>
                <p className="text-xs text-slate-500">
                  Aktifkan pita pengumuman dan buat kode voucher potongan harga.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={cmsData.promoActive}
                  onChange={(e) =>
                    setCmsData({ ...cmsData, promoActive: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-blue-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <div
              className={`transition-all ${!cmsData.promoActive ? "opacity-30 pointer-events-none" : ""}`}
            >
              {/* Bagian 1: Announcement Bar */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-6 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest border-b border-slate-200 pb-2">
                  1. Pita Pengumuman (Header)
                </h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                    Teks Pengumuman
                  </label>
                  <input
                    type="text"
                    value={cmsData.promoText}
                    onChange={(e) =>
                      setCmsData({ ...cmsData, promoText: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none text-sm font-bold text-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1.5">
                    Link Tujuan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={cmsData.promoLink}
                    onChange={(e) =>
                      setCmsData({ ...cmsData, promoLink: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none text-sm"
                    placeholder="/masterclass/course-id"
                  />
                </div>
              </div>

              {/* Bagian 2: Voucher / Kupon Diskon */}
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 space-y-4">
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest border-b border-amber-200/50 pb-2">
                  2. Kode Voucher Pembayaran
                </h4>
                <p className="text-xs text-amber-700 font-medium">
                  Jika diisi, peserta bisa memasukkan kode ini saat Checkout
                  untuk memotong harga.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 uppercase mb-1.5">
                      Kode Kupon Unik
                    </label>
                    <input
                      type="text"
                      value={cmsData.promoCode}
                      onChange={(e) =>
                        setCmsData({
                          ...cmsData,
                          promoCode: e.target.value
                            .toUpperCase()
                            .replace(/\s/g, ""),
                        })
                      }
                      className="w-full bg-white border border-amber-200 px-4 py-3 rounded-xl focus:border-amber-500 outline-none text-sm font-black text-amber-700 tracking-widest placeholder-amber-200"
                      placeholder="Cth: MERDEKA50"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-700 uppercase mb-1.5">
                      Besaran Diskon (%)
                    </label>
                    <div className="flex items-center gap-2 bg-white border border-amber-200 px-4 py-3 rounded-xl focus-within:border-amber-500">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={cmsData.promoDiscount}
                        onChange={(e) =>
                          setCmsData({
                            ...cmsData,
                            promoDiscount: Number(e.target.value),
                          })
                        }
                        className="w-full bg-transparent outline-none text-sm font-black text-amber-700"
                        placeholder="50"
                      />
                      <span className="text-amber-500 font-black">%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ROLES */}
        {activeSubTab === "roles" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                User Roles & Access
              </h3>
              <p className="text-xs text-slate-500">
                Kelola siapa saja yang bisa mengakses dashboard admin ini.
              </p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan Email User..."
                className="flex-1 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm"
              />
              <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl text-sm">
                Cari & Atur
              </button>
            </div>
            <div className="p-8 text-center text-slate-300 italic text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              Fitur pencarian user dan penetapan role sedang dihubungkan ke
              sistem inti.
            </div>
          </div>
        )}

        {/* FOOTER SAVE BUTTON */}
        <div className="mt-12 pt-6 border-t border-slate-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#0B1120] hover:bg-slate-800 text-white font-black px-10 py-4 rounded-2xl transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50 flex items-center gap-3"
          >
            {isSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN CMS"}
          </button>
        </div>
      </div>
    </div>
  );
}
