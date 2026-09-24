"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface RunNavbarProps {
  eventName?: string;
  solid?: boolean;
  logoKiri?: string;
  logoKanan?: string;
}

export default function RunNavbar({
  eventName = "SEMBADA RUN",
  solid = false,
  logoKiri,
  logoKanan,
}: RunNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen || solid
          ? "bg-[#0B2239]/95 backdrop-blur-md shadow-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* LOGO & BRAND */}
        <Link href="/run" className="flex items-center gap-3 group shrink-0">
          <div className="bg-white p-2 rounded-xl group-hover:bg-slate-100 transition-colors shrink-0 shadow-md">
            <img
              src={logoKiri || "/logo-dpp-ika.png"}
              alt="Logo Penyelenggara"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            />
          </div>
          <div className="hidden sm:block h-8 w-px bg-white/30 mx-1"></div>
          <img
            src={logoKanan || "https://res.cloudinary.com/dp8hmxuix/image/upload/v1788008083/ikadiy.uii.ac.idrun_kg66ut.png"}
            alt="Logo Event"
            className="w-auto h-7 sm:h-9 object-contain group-hover:scale-105 transition-transform drop-shadow-md"
            crossOrigin="anonymous"
          />
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8 text-sm font-semibold text-slate-300">
          <Link
            href="/run"
            className={`transition-colors ${
              pathname === "/run" ? "text-[#FCD116] font-bold" : "hover:text-[#FCD116]"
            }`}
          >
            Beranda
          </Link>
          <a href="/run#kategori" className="hover:text-white transition-colors">
            Kategori
          </a>
          <a href="/run#rute" className="hover:text-white transition-colors">
            Rute
          </a>
          <a href="/run#racepack" className="hover:text-white transition-colors">
            Racepack
          </a>
        </nav>

        {/* ACTION BUTTON & MOBILE TOGGLE */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-bold px-4 sm:px-5 py-2.5 rounded-full text-xs transition-all flex items-center gap-2 shrink-0 bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-lg"
          >
            <span className="hidden sm:inline">Portal Utama</span>
            <span>&rarr;</span>
          </Link>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white focus:outline-none shrink-0 rounded-lg bg-white/5 border border-white/10"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#0B2239] border-b border-slate-800 py-5 px-6 flex flex-col gap-4 text-sm font-bold text-slate-200 shadow-2xl">
          <Link
            href="/run"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-[#FCD116] border-b border-slate-800/60"
          >
            Beranda
          </Link>
          <a
            href="/run#kategori"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-[#FCD116] border-b border-slate-800/60"
          >
            Kategori
          </a>
          <a
            href="/run#rute"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-[#FCD116] border-b border-slate-800/60"
          >
            Rute
          </a>
          <a
            href="/run#racepack"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-[#FCD116]"
          >
            Racepack
          </a>
        </div>
      )}
    </header>
  );
}
