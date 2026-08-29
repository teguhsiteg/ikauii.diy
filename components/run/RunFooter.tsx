"use client";

import Link from "next/link";

interface RunFooterProps {
  eventName?: string;
  waChannelUrl?: string;
}

export default function RunFooter({
  eventName = "Sembada Run",
  waChannelUrl,
}: RunFooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-[#050C18] border-t border-slate-800 text-slate-400 text-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Kolom 1: Brand Event */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
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
              <p className="text-[10px] text-[#FCD116] font-bold uppercase tracking-widest">
                DPW IKA UII DIY
              </p>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-4">
            Event lari Sembada Run (UII Sehat) yang mengajak masyarakat dan alumni 
            berlari bersama di wilayah D.I. Yogyakarta dengan mengusung semangat 
            kebersamaan dan amal.
          </p>
          <img
            src="https://res.cloudinary.com/dp8hmxuix/image/upload/v1788008083/ikadiy.uii.ac.idrun_kg66ut.png"
            alt="Logo Sembada Run"
            className="h-10 object-contain drop-shadow-lg"
            crossOrigin="anonymous"
          />
        </div>

        {/* Kolom 2: Navigasi Cepat Event */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FCD116]"></span>
            Menu Event
          </h4>
          <ul className="space-y-2.5 font-medium">
            <li>
              <Link href="/run" className="hover:text-[#FCD116] transition-colors">
                Beranda Sembada Run
              </Link>
            </li>
            <li>
              <Link href="/run/daftar" className="hover:text-[#FCD116] transition-colors">
                Daftar Peserta Individu
              </Link>
            </li>
            <li>
              <Link href="/run/komunitas" className="hover:text-[#FCD116] transition-colors">
                Daftar Jalur Komunitas / Kolektif
              </Link>
            </li>
            <li>
              <Link href="/" className="hover:text-white text-slate-500 transition-colors mt-2 block">
                &larr; Portal Utama IKA UII DIY
              </Link>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Kontak & Bantuan */}
        <div>
          <h4 className="text-white font-black uppercase tracking-wider text-xs mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Kontak & Bantuan
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
                  className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg transition-all font-bold text-[11px] uppercase tracking-wider border border-emerald-500/20"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.898-4.45 9.898-9.892 0-2.64-1.02-5.119-2.895-6.992-1.873-1.873-4.361-2.905-7.003-2.905-5.448 0-9.896 4.448-9.896 9.892 0 1.91.525 3.73 1.522 5.336l-1.053 3.845 3.935-1.036zm1.187-1.125l-.265-.421c-.482-.767-.74-1.657-.74-2.585 0-2.732 2.222-4.954 4.954-4.954 2.731 0 4.954 2.222 4.954 4.954 0 2.731-2.223 4.954-4.954 4.954-1.01 0-1.986-.307-2.799-.884l-.452-.321-2.072.545.545-2.072zm3.176-7.855c-.213 0-.426.008-.636.024-1.32.102-2.385 1.168-2.486 2.488-.016.21-.024.423-.024.636 0 1.83 1.488 3.318 3.318 3.318.213 0 .426-.008.636-.024 1.32-.102 2.385-1.168 2.486-2.488.016-.21.024-.423.024-.636 0-1.83-1.488-3.318-3.318-3.318z"/>
                  </svg>
                  Grup WhatsApp Peserta
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-slate-800 bg-[#02060C] py-5 mt-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-[10px] sm:text-xs">
            &copy; {new Date().getFullYear()} {eventName}. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-[10px] font-medium">
            <button onClick={scrollToTop} className="text-slate-500 hover:text-white transition-colors flex items-center gap-1">
              <span>&uarr;</span> Kembali ke atas
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
