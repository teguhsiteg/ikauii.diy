"use client";

import Link from "next/link";

interface VirtualRunFooterProps {
  eventName?: string;
  waChannelUrl?: string;
}

export default function VirtualRunFooter({
  eventName = "IKA UII Virtual Run 2026",
  waChannelUrl,
}: VirtualRunFooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#050C18] border-t border-slate-800 text-slate-400 text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Kolom 1: Brand Event */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-600 p-2 rounded-xl shrink-0 shadow-md shadow-blue-600/30">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo IKA UII"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div>
              <p className="font-black text-white text-base leading-tight">
                {eventName}
              </p>
              <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">
                DPW IKA UII DIY
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
            Ajang lari virtual resmi mempererat silaturahmi alumni dan masyarakat luas. Berlari kapan saja, di mana saja, dan kumpulkan kilometermu.
          </p>
        </div>

        {/* Kolom 2: Navigasi Cepat Event */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
            Menu Event
          </h4>
          <ul className="space-y-2.5 font-medium">
            <li>
              <Link href="/virtual-run" className="hover:text-yellow-400 transition-colors">
                Beranda Virtual Run
              </Link>
            </li>
            <li>
              <a href="/virtual-run#race-pack" className="hover:text-yellow-400 transition-colors">
                Race Pack Collection
              </a>
            </li>
            <li>
              <a href="/virtual-run#paket" className="hover:text-yellow-400 transition-colors">
                Pilihan Paket Lari
              </a>
            </li>
            <li>
              <Link href="/virtual-run/leaderboard" className="hover:text-yellow-400 transition-colors text-yellow-400/90 font-bold">
                Live Klasemen
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white text-slate-500 transition-colors">
                &larr; Portal Utama IKA UII DIY
              </Link>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Kontak & Bantuan */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Bantuan &amp; Komunitas
          </h4>
          <ul className="space-y-2.5">
            <li className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">Email:</span>
              <a href="mailto:ika.diy@uii.ac.id" className="hover:text-white transition-colors">
                ika.diy@uii.ac.id
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-slate-500 font-bold">Lokasi:</span>
              <span>Yogyakarta, D.I. Yogyakarta</span>
            </li>
            {waChannelUrl && (
              <li className="pt-2">
                <a
                  href={waChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-lg font-bold hover:bg-emerald-600/30 transition-all text-[11px]"
                >
                  <span>Gabung Grup WhatsApp</span>
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-800/80 bg-black/40 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-slate-500 text-[11px]">
          <p>
            &copy; {new Date().getFullYear()} <span className="text-slate-300 font-semibold">{eventName}</span> • DPW IKA UII DIY. All rights reserved.
          </p>
          <button
            onClick={scrollToTop}
            className="hover:text-yellow-400 transition-colors font-bold flex items-center gap-1"
          >
            <span>Kembali ke atas</span> &uarr;
          </button>
        </div>
      </div>
    </footer>
  );
}
