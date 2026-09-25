"use client";

import Link from "next/link";

export interface RunFooterProps {
  eventName?: string;
  waChannelUrl?: string;
  sosmeds?: any[];
  logoKiri?: string;
  logoKanan?: string;
  deskripsiSingkat?: string;
}

export default function RunFooter({
  eventName = "Run Event",
  waChannelUrl,
  sosmeds = [],
  logoKiri,
  logoKanan,
  deskripsiSingkat,
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
                src={logoKiri || "/logo-dpp-ika.png"}
                alt="Logo Penyelenggara"
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
            {deskripsiSingkat || "Event lari Sembada Run (UII Sehat) yang mengajak masyarakat dan alumni berlari bersama di wilayah D.I. Yogyakarta dengan mengusung semangat kebersamaan dan amal."}
          </p>
          <img
            src={logoKanan || "https://res.cloudinary.com/dp8hmxuix/image/upload/v1788008083/ikadiy.uii.ac.idrun_kg66ut.png"}
            alt="Logo Event"
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
          </ul>
          
          {/* Social Media Links */}
          {(sosmeds && sosmeds.length > 0) && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-white font-black uppercase tracking-wider text-[10px] mb-3 text-slate-500">
                Sosial Media
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                {/* Dynamic Links */}
                {sosmeds && sosmeds.map((sosmed) => (
                  <a 
                    key={sosmed.id} 
                    href={sosmed.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    title={sosmed.platform}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:bg-[#FCD116] hover:text-[#050C18] transition-all font-black text-sm"
                  >
                    {sosmed.platform?.toLowerCase().includes("thread") ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11.583v-1.472A4.208 4.208 0 0 0 11.75 5.92 4.208 4.208 0 0 0 7.5 10.11v3.778A4.208 4.208 0 0 0 11.75 18.08a4.208 4.208 0 0 0 4.25-4.192v-.75h-1.5v.75a2.708 2.708 0 0 1-2.75 2.692 2.708 2.708 0 0 1-2.75-2.692v-3.778a2.708 2.708 0 0 1 2.75-2.691 2.708 2.708 0 0 1 2.75 2.69v1.473h1.5zm-4.25.917a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" /></svg>
                    ) : sosmed.platform?.toLowerCase().includes("x") || sosmed.platform?.toLowerCase().includes("twitter") ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    ) : sosmed.platform === "Instagram" ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                      </svg>
                    ) : sosmed.platform === "Facebook" ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    ) : sosmed.platform === "YouTube" ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M21.582 6.186a2.686 2.686 0 00-1.884-1.897C18.035 3.843 12 3.843 12 3.843s-6.035 0-7.698.446a2.686 2.686 0 00-1.884 1.897C2 7.865 2 12 2 12s0 4.135.418 5.814a2.686 2.686 0 001.884 1.897C6.035 20.157 12 20.157 12 20.157s6.035 0 7.698-.446a2.686 2.686 0 001.884-1.897C22 16.135 22 12 22 12s0-4.135-.418-5.814zM9.99 15.116V8.884L15.357 12l-5.366 3.116z" clipRule="evenodd" />
                      </svg>
                    ) : sosmed.platform === "TikTok" ? (
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Flag Counter */}
          <div className={`pt-4 border-t border-slate-800 ${(sosmeds && sosmeds.length > 0) ? 'mt-6' : 'mt-0'}`}>
            <h4 className="text-white font-black uppercase tracking-wider text-[10px] mb-3 text-slate-500">
              Statistik Pengunjung
            </h4>
            <a
              href="https://info.flagcounter.com/Xfqa"
              target="_blank"
              rel="noopener noreferrer"
              className="block opacity-75 hover:opacity-100 transition-opacity duration-300"
            >
              <img
                src="https://s05.flagcounter.com/count2/Xfqa/bg_0B1221/txt_FFFFFF/border_0B1221/columns_3/maxflags_12/viewers_0/labels_0/pageviews_0/flags_0/percent_0/"
                alt="Flag Counter"
                className="h-auto max-w-[150px] rounded"
              />
            </a>
          </div>
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
