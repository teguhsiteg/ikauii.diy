"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function NavbarPublic() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isMobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed w-full top-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-white"}`}
      >
        {/* TOP BAR - LIVE VIEW DONASI JUM'AT BERKAH */}
        <div className="bg-blue-950 text-white py-2 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left text-xs">
            <p className="text-slate-300">
              Kembali ke web utama UII:{" "}
              <a
                href="https://uii.ac.id"
                target="_blank"
                rel="noreferrer"
                className="text-yellow-400 font-bold hover:underline"
              >
                uii.ac.id
              </a>
            </p>

            {/* WIDGET LIVE DONASI */}
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full border border-white/10 shadow-inner">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <p className="text-slate-200 font-medium text-[10px] sm:text-xs">
                Donasi Jum'at Berkah:{" "}
                <span className="text-yellow-400 font-bold tracking-wider">
                  BSI 7335717788
                </span>{" "}
                a.n Syaifulloh Yusuf
              </p>
            </div>
          </div>
        </div>

        {/* MAIN NAVBAR */}
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50 bg-transparent">
          <div className="flex justify-between items-center h-20">
            {/* LOGO & TEKS */}
            <Link
              href="/"
              className="flex items-center gap-3 sm:gap-4 group"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <img
                src="/logo-dpp-ika.png"
                alt="Logo DPW IKA UII DIY"
                className="w-10 h-10 sm:w-14 sm:h-14 object-contain group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <p className="font-extrabold text-blue-950 text-sm sm:text-lg leading-tight tracking-tight">
                  DPW IKA UII
                </p>
                <p className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                  Daerah Istimewa Yogyakarta
                </p>
              </div>
            </Link>

            {/* MENU LINKS (HANYA TAMPIL DI LAYAR BESAR / LAPTOP) */}
            <div className="hidden lg:flex items-center space-x-8">
              <Link
                href="/"
                className={`text-sm font-semibold hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2 ${pathname === "/" ? "text-blue-900" : "text-slate-600"}`}
              >
                Beranda
              </Link>
              <Link
                href="/#profil"
                className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2"
              >
                Profil
              </Link>
              <Link
                href="/pengurus"
                className={`text-sm font-semibold hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2 ${pathname === "/pengurus" ? "text-blue-900 underline" : "text-slate-600"}`}
              >
                Pengurus
              </Link>
              <Link
                href="/#berita"
                className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2"
              >
                Berita
              </Link>
              <Link
                href="/#agenda"
                className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2"
              >
                Agenda
              </Link>
              <Link
                href="/#galeri"
                className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2"
              >
                Galeri
              </Link>
            </div>

            {/* TOMBOL PENGURUS & HAMBURGER */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden lg:flex group items-center gap-2 bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-md hover:shadow-xl"
              >
                Pengurus{" "}
                <span className="group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden relative z-50 p-2 text-slate-800 focus:outline-none"
                aria-label="Toggle Menu"
              >
                <div
                  className={`w-6 h-0.5 bg-blue-950 mb-1.5 transition-all duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}
                ></div>
                <div
                  className={`w-6 h-0.5 bg-blue-950 mb-1.5 transition-all duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`}
                ></div>
                <div
                  className={`w-6 h-0.5 bg-blue-950 transition-all duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}
                ></div>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* OVERLAY & PANEL MENU MOBILE */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      <div
        className={`fixed top-0 left-0 w-full bg-white shadow-xl z-40 transform transition-transform duration-500 ease-in-out lg:hidden flex flex-col pt-32 pb-8 px-6 rounded-b-3xl ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"}`}
      >
        <div className="flex flex-col gap-6 items-center text-center">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-lg font-bold transition-colors w-full pb-4 border-b border-slate-50 ${pathname === "/" ? "text-yellow-600" : "text-slate-700"}`}
          >
            Beranda
          </Link>
          <Link
            href="/#profil"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-bold text-slate-700 transition-colors w-full pb-4 border-b border-slate-50"
          >
            Profil
          </Link>
          <Link
            href="/pengurus"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-lg font-bold transition-colors w-full pb-4 border-b border-slate-50 ${pathname === "/pengurus" ? "text-yellow-600" : "text-slate-700"}`}
          >
            Pengurus
          </Link>
          <Link
            href="/#berita"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-bold text-slate-700 transition-colors w-full pb-4 border-b border-slate-50"
          >
            Berita
          </Link>
          <Link
            href="/#agenda"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-bold text-slate-700 transition-colors w-full pb-4 border-b border-slate-50"
          >
            Agenda
          </Link>
          <Link
            href="/#galeri"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-lg font-bold text-slate-700 transition-colors w-full pb-4 border-b border-slate-50"
          >
            Galeri
          </Link>
          <Link
            href="/login"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-4 text-sm font-bold bg-blue-900 text-white w-full py-3.5 rounded-xl hover:bg-blue-950 transition-colors shadow-md"
          >
            Masuk E-Office
          </Link>
        </div>
      </div>
    </>
  );
}
