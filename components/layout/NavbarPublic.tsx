"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

// --- DAFTAR HARI BESAR & EVENT (Bisa disesuaikan manual) ---
// Format key: "Bulan-Tanggal"
const EVENT_KALENDER: Record<string, string> = {
  "1-1": "Tahun Baru Masehi",
  "2-14": "Hari Valentine",
  "3-1": "Hari Peringatan Serangan Umum 1 Maret",
  "5-1": "Hari Buruh Internasional",
  "5-2": "Hari Pendidikan Nasional",
  "5-20": "Hari Kebangkitan Nasional",
  "6-1": "Hari Lahir Pancasila",
  "8-17": "Hari Kemerdekaan RI",
  "10-1": "Hari Kesaktian Pancasila",
  "10-28": "Hari Sumpah Pemuda",
  "11-10": "Hari Pahlawan",
  "12-22": "Hari Ibu",
  "12-25": "Hari Raya Natal",
  // Khusus event 2026 yang kamu sebutkan (bisa ganti sesuai tahun berjalan):
  "2-17": "Awal Ramadhan 1447 H",
  "3-19": "Hari Raya Idul Fitri 1447 H",
  "3-20": "Cuti Bersama Lebaran",
  "3-21": "Hari Raya Nyepi Tahun Baru Saka 1948",
  "5-26": "Hari Raya Idul Adha 1447 H",
};

export default function NavbarPublic() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // State Jadwal Sholat & Tanggal
  const [jadwalSholat, setJadwalSholat] = useState<any>(null);
  const [currentEvent, setCurrentEvent] = useState<string | null>(null);
  const [waktuLokal, setWaktuLokal] = useState("");

  // Efek Scroll Navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Kunci Scroll Body Saat Menu Terbuka
  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isMobileMenuOpen]);

  // Efek Ambil Data Sholat & Set Info Hari Ini
  useEffect(() => {
    const today = new Date();

    // Set Jam Lokal
    const formatter = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    setWaktuLokal(formatter.format(today));

    // Cek Event Hari Ini
    const month = today.getMonth() + 1; // getMonth() mulai dari 0
    const date = today.getDate();
    const keyEvent = `${month}-${date}`;
    if (EVENT_KALENDER[keyEvent]) {
      setCurrentEvent(EVENT_KALENDER[keyEvent]);
    }

    // Fetch Jadwal Sholat DIY (ID Kota Jogja: 1609 di API MyQuran)
    const fetchSholat = async () => {
      try {
        const year = today.getFullYear();
        const monthStr = String(month).padStart(2, "0");
        const dateStr = String(date).padStart(2, "0");

        const res = await fetch(
          `https://api.myquran.com/v2/sholat/jadwal/1609/${year}/${monthStr}/${dateStr}`,
        );
        const data = await res.json();

        if (data.status && data.data) {
          setJadwalSholat(data.data.jadwal);
        }
      } catch (error) {
        console.error("Gagal mengambil jadwal sholat:", error);
      }
    };

    fetchSholat();
  }, []);

  return (
    <>
      <header
        className={`w-full top-0 z-50 transition-all duration-300 absolute lg:fixed ${
          isScrolled && !isMobileMenuOpen
            ? "lg:bg-white/90 lg:backdrop-blur-md lg:shadow-md bg-white"
            : "bg-white"
        }`}
      >
        {/* TOP BAR 1 - INFO NASIONAL & JADWAL SHOLAT (Desktop) */}
        <div className="bg-blue-950 text-white py-1.5 border-b border-white/10 hidden md:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center gap-2 text-xs">
            {/* Kiri: Info Waktu & Event */}
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                  />
                </svg>
                {waktuLokal}
              </span>

              {currentEvent && (
                <>
                  <span className="text-white/30">•</span>
                  <span className="bg-yellow-500 text-blue-950 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]">
                    {currentEvent}
                  </span>
                </>
              )}
            </div>

            {/* Kanan: Jadwal Sholat (Live API) */}
            <div className="flex items-center gap-4 text-slate-300 font-medium">
              {jadwalSholat ? (
                <>
                  <span className="flex items-center gap-1 text-yellow-400">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                    </svg>
                    Sholat DIY:
                  </span>
                  <span>Subuh {jadwalSholat.subuh}</span>
                  <span>Dzuhur {jadwalSholat.dzuhur}</span>
                  <span>Ashar {jadwalSholat.ashar}</span>
                  <span>Maghrib {jadwalSholat.maghrib}</span>
                  <span>Isya {jadwalSholat.isya}</span>
                </>
              ) : (
                <span className="animate-pulse">
                  Menyelaraskan waktu sholat...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* TOP BAR 2 - LIVE VIEW DONASI JUM'AT BERKAH */}
        <div className="bg-blue-900 text-white py-2 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left text-xs">
            <p className="text-slate-400 font-medium flex items-center gap-1.5 justify-center">
              Menuju portal utama kampus:{" "}
              <a
                href="https://uii.ac.id"
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-white transition-colors hover:underline underline-offset-2"
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
            <div className="hidden lg:flex items-center space-x-7">
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
                href="/layanan"
                className={`text-sm font-semibold hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2 ${pathname === "/layanan" ? "text-blue-900 underline" : "text-slate-600"}`}
              >
                Layanan Alumni
              </Link>
              <Link
                href="/direktori-bisnis"
                className={`text-sm font-semibold hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2 ${pathname === "/direktori-bisnis" ? "text-blue-900 underline" : "text-slate-600"}`}
              >
                Direktori Bisnis
              </Link>
              <Link
                href="/berita"
                className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2"
              >
                Berita
              </Link>
              <Link
                href="/agenda"
                className="text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors hover:underline underline-offset-8 decoration-yellow-500 decoration-2"
              >
                Agenda
              </Link>
            </div>

            {/* TOMBOL BERGABUNG & HAMBURGER */}
            <div className="flex items-center gap-4">
              <Link
                href="/bergabung"
                className="hidden lg:flex group items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-blue-950 px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 shadow-[0_4px_15px_rgba(234,179,8,0.3)] hover:shadow-[0_4px_20px_rgba(234,179,8,0.4)] hover:-translate-y-0.5"
              >
                Bergabung
              </Link>

              {/* Tiga Garis Animasi Hamburger Menu */}
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
        className={`fixed top-0 left-0 w-full bg-white shadow-xl z-40 transform transition-transform duration-500 ease-in-out lg:hidden flex flex-col pt-32 pb-8 px-6 rounded-b-3xl ${isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"} overflow-y-auto max-h-screen`}
      >
        {/* Info Cepat di Mobile Menu (Waktu & Jadwal Sholat) */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6 text-center shadow-inner">
          <p className="text-xs font-bold text-slate-600 mb-1.5">
            {waktuLokal}
          </p>
          {currentEvent && (
            <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest bg-yellow-100 py-1 px-3 rounded-md inline-block mb-3">
              🌟 {currentEvent}
            </p>
          )}

          {/* AREA JADWAL SHOLAT MOBILE */}
          <div className="mt-2 pt-3 border-t border-slate-200 border-dashed">
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-2 flex items-center justify-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
              Jadwal Sholat DIY
            </p>
            {jadwalSholat ? (
              <div className="flex flex-wrap justify-center gap-1.5">
                <div className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm text-[10px] font-medium text-slate-600">
                  <span className="text-slate-400 block text-[8px] mb-0.5">
                    SUBUH
                  </span>
                  {jadwalSholat.subuh}
                </div>
                <div className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm text-[10px] font-medium text-slate-600">
                  <span className="text-slate-400 block text-[8px] mb-0.5">
                    DZUHUR
                  </span>
                  {jadwalSholat.dzuhur}
                </div>
                <div className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm text-[10px] font-medium text-slate-600">
                  <span className="text-slate-400 block text-[8px] mb-0.5">
                    ASHAR
                  </span>
                  {jadwalSholat.ashar}
                </div>
                <div className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm text-[10px] font-medium text-slate-600">
                  <span className="text-slate-400 block text-[8px] mb-0.5">
                    MAGHRIB
                  </span>
                  {jadwalSholat.maghrib}
                </div>
                <div className="bg-white px-2 py-1 rounded border border-slate-200 shadow-sm text-[10px] font-medium text-slate-600">
                  <span className="text-slate-400 block text-[8px] mb-0.5">
                    ISYA
                  </span>
                  {jadwalSholat.isya}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 animate-pulse mt-2">
                Menyelaraskan waktu sholat...
              </p>
            )}
          </div>
        </div>

        {/* List Menu Navigation Mobile */}
        <div className="flex flex-col gap-4 items-center text-center pb-8">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-base font-bold transition-colors w-full pb-3 border-b border-slate-100 ${pathname === "/" ? "text-yellow-600" : "text-slate-700"}`}
          >
            Beranda
          </Link>
          <Link
            href="/#profil"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-base font-bold text-slate-700 transition-colors w-full pb-3 border-b border-slate-100"
          >
            Profil
          </Link>
          <Link
            href="/pengurus"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-base font-bold transition-colors w-full pb-3 border-b border-slate-100 ${pathname === "/pengurus" ? "text-yellow-600" : "text-slate-700"}`}
          >
            Pengurus
          </Link>
          <Link
            href="/layanan"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-base font-bold transition-colors w-full pb-3 border-b border-slate-100 ${pathname === "/layanan" ? "text-yellow-600" : "text-slate-700"}`}
          >
            Layanan Alumni
          </Link>
          <Link
            href="/direktori-bisnis"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`text-base font-bold transition-colors w-full pb-3 border-b border-slate-100 ${pathname === "/direktori-bisnis" ? "text-yellow-600" : "text-slate-700"}`}
          >
            Direktori Bisnis
          </Link>
          <Link
            href="/berita"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-base font-bold text-slate-700 transition-colors w-full pb-3 border-b border-slate-100"
          >
            Berita
          </Link>
          <Link
            href="/agenda"
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-base font-bold text-slate-700 transition-colors w-full pb-3 border-b border-slate-100"
          >
            Agenda
          </Link>

          {/* Tombol Bergabung Mobile */}
          <Link
            href="/bergabung"
            onClick={() => setIsMobileMenuOpen(false)}
            className="mt-4 text-sm font-bold bg-yellow-500 text-blue-950 w-full py-4 rounded-xl hover:bg-yellow-400 transition-all shadow-[0_4px_15px_rgba(234,179,8,0.3)] active:scale-[0.98]"
          >
            Bergabung
          </Link>
        </div>
      </div>
    </>
  );
}
