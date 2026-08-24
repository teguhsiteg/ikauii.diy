"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { User, Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";

interface VirtualRunNavbarProps {
  eventName?: string;
  isOfflineRunEnabled?: boolean;
  offlineJudul?: string;
}

export default function VirtualRunNavbar({
  eventName = "IKA UII VR 2026",
  isOfflineRunEnabled = false,
  offlineJudul = "Main Event",
}: VirtualRunNavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loggedInParticipant, setLoggedInParticipant] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const savedEmail = localStorage.getItem("vr_user_email");
    if (savedEmail) {
      setLoggedInParticipant({ email: savedEmail });
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#071324]/90 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* LOGO & BRAND */}
        <Link href="/virtual-run" className="flex items-center gap-3 group shrink-0">
          <div className="bg-blue-600 p-2 rounded-xl group-hover:bg-blue-500 transition-colors shrink-0 shadow-md shadow-blue-500/20">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo IKA UII"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
            />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h1 className="font-black text-white text-sm sm:text-base leading-none tracking-tight truncate">
              {eventName}
            </h1>
            <p className="text-[9px] sm:text-[10px] font-bold text-yellow-400 uppercase tracking-widest mt-1 truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              Virtual Run Event
            </p>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8 text-sm font-semibold text-slate-300">
          <Link
            href="/virtual-run"
            className={`transition-colors ${
              pathname === "/virtual-run" ? "text-white font-bold" : "hover:text-white"
            }`}
          >
            Beranda
          </Link>

          {isOfflineRunEnabled && (
            <a
              href="/virtual-run#offline-teaser"
              className="hover:text-emerald-300 text-emerald-400 font-bold transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {offlineJudul}
            </a>
          )}

          <a href="/virtual-run#race-pack" className="hover:text-white transition-colors">
            Race Pack
          </a>
          <a href="/virtual-run#paket" className="hover:text-white transition-colors">
            Paket Lari
          </a>
          <a href="/virtual-run#route" className="hover:text-white transition-colors">
            Rute &amp; Cara
          </a>
          <a href="/virtual-run#timeline" className="hover:text-white transition-colors">
            Timeline
          </a>
          <Link
            href="/virtual-run/leaderboard"
            className={`transition-colors font-bold ${
              pathname === "/virtual-run/leaderboard"
                ? "text-yellow-400 underline underline-offset-4"
                : "text-yellow-400/90 hover:text-yellow-300"
            }`}
          >
            Klasemen
          </Link>
        </nav>

        {/* ACTION BUTTON & MOBILE TOGGLE */}
        <div className="flex items-center gap-3">
          <Link
            href="/virtual-run/dashboard"
            className={`font-bold px-4 sm:px-5 py-2.5 rounded-full text-xs transition-all flex items-center gap-2 shrink-0 ${
              loggedInParticipant
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            }`}
          >
            {loggedInParticipant ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Dashboard</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-yellow-400" />
                <span>Login Peserta</span>
              </>
            )}
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
        <div className="md:hidden bg-[#071324] border-b border-slate-800 py-5 px-6 flex flex-col gap-4 text-sm font-bold text-slate-200 shadow-2xl">
          <Link
            href="/virtual-run"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-yellow-400 border-b border-slate-800/60"
          >
            Beranda
          </Link>

          {isOfflineRunEnabled && (
            <a
              href="/virtual-run#offline-teaser"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-emerald-400 py-2 border-b border-slate-800/60 flex items-center justify-between"
            >
              <span>{offlineJudul}</span>
              <span className="text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                INFO
              </span>
            </a>
          )}

          <a
            href="/virtual-run#race-pack"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-yellow-400 border-b border-slate-800/60"
          >
            Race Pack Collection
          </a>
          <a
            href="/virtual-run#paket"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-yellow-400 border-b border-slate-800/60"
          >
            Pilihan Paket Lari
          </a>
          <a
            href="/virtual-run#route"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-yellow-400 border-b border-slate-800/60"
          >
            Rute &amp; Cara Kerja
          </a>
          <a
            href="/virtual-run#timeline"
            onClick={() => setIsMobileMenuOpen(false)}
            className="py-2 hover:text-yellow-400 border-b border-slate-800/60"
          >
            Timeline Event
          </a>
          <Link
            href="/virtual-run/leaderboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-yellow-400 py-2 font-bold flex items-center justify-between"
          >
            <span>Lihat Klasemen</span>
            <span className="text-[10px] bg-yellow-400/20 text-yellow-300 px-2 py-0.5 rounded">
              LIVE
            </span>
          </Link>
        </div>
      )}
    </header>
  );
}
