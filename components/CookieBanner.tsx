"use client";

import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Mengecek apakah user sudah pernah klik "Mengerti" sebelumnya
    const consent = localStorage.getItem("uii_cookie_consent");
    if (!consent) {
      // Diberi delay 1.5 detik agar munculnya tidak mengagetkan saat web baru dimuat
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("uii_cookie_consent", "accepted");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    // Kalau ditolak, kita tutup saja tapi tidak disave di local storage,
    // biar nanti kalau buka web lagi tetep ditawarin. Atau bisa juga disave "rejected".
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-[999999] max-w-[320px] md:max-w-[340px] mx-auto md:mx-0 animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="bg-white border border-slate-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl p-5 flex flex-col gap-4 relative overflow-hidden">
        {/* Aksen warna kecil di ujung atas biar manis */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#1A73E8] to-[#FCD116]"></div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center shrink-0 text-xl shadow-inner border border-blue-100/50">
            🍪
          </div>
          <div className="text-left pt-0.5">
            <h3 className="text-[13px] font-black text-slate-800 mb-1 tracking-tight">
              Privasi & Cookies
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
              Web ini menggunakan cookies untuk memastikan Anda mendapat
              pengalaman terbaik.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full mt-1">
          <button
            onClick={handleDismiss}
            className="w-full py-2 px-3 rounded-xl text-[11px] font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Nanti Saja
          </button>
          <button
            onClick={handleAccept}
            className="w-full py-2 px-3 rounded-xl text-[11px] font-bold text-white bg-[#152B5B] hover:bg-blue-900 transition-colors shadow-md hover:shadow-lg"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
