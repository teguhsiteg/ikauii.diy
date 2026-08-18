"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  ShieldCheck,
  Trophy,
  CheckCircle2,
  ArrowRight,
  X,
  Send,
} from "lucide-react";

export default function LandingPage() {
  const currentYear = new Date().getFullYear();
  const [showCookie, setShowCookie] = useState(false);

  // State untuk Help Button & Form
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    message: "",
  });

  useEffect(() => {
    // Munculkan cookie banner
    const timerCookie = setTimeout(() => setShowCookie(true), 1000);
    // Munculkan tooltip WA sapaan setelah 2.5 detik
    const timerTooltip = setTimeout(() => setShowTooltip(true), 2500);

    return () => {
      clearTimeout(timerCookie);
      clearTimeout(timerTooltip);
    };
  }, []);

  const handleAcceptCookies = () => setShowCookie(false);

  // Logic Kirim ke WhatsApp
  const handleSendWA = (e: any) => {
    e.preventDefault();
    if (!formData.name || !formData.message) return;

    const waNumber = process.env.NEXT_PUBLIC_WA_ADMIN_PHONE || "6285179594146";
    const text = `Halo Admin IKA UII DIY,%0A%0APerkenalkan saya *${formData.name}*.%0A%0A${formData.message}`;

    window.open(`https://wa.me/${waNumber}?text=${text}`, "_blank");

    setIsHelpOpen(false);
    setFormData({ name: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 scroll-smooth relative pb-20 md:pb-0 selection:bg-[#152B5B] selection:text-white">
      {/* --- TOP ACCENT BAR --- */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#152B5B] via-blue-800 to-yellow-500 fixed top-0 z-[60]"></div>

      {/* --- NAVBAR --- */}
      <nav className="fixed w-full bg-white/90 backdrop-blur-md top-1.5 z-50 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="https://ikadiy.uii.ac.id/logo-dpp-ika.png"
              alt="Logo IKA UII DIY"
              className="h-10 md:h-12 object-contain drop-shadow-sm"
            />
            <div className="flex flex-col border-l-2 border-slate-200 pl-3 ml-1">
              <span className="font-black text-[#152B5B] tracking-tight text-sm md:text-lg leading-none">
                IKA ALUMNI UII
              </span>
              <span className="text-[9px] md:text-[10px] text-yellow-600 font-bold tracking-widest uppercase mt-0.5">
                Daerah Istimewa Yogyakarta
              </span>
            </div>
          </div>
          <div className="hidden md:flex gap-10 text-sm font-bold text-slate-600">
            <a href="#fitur" className="hover:text-[#152B5B] transition-colors">
              Fitur
            </a>
            <a
              href="#keuntungan"
              className="hover:text-[#152B5B] transition-colors"
            >
              Keuntungan
            </a>
            <a href="#mitra" className="hover:text-[#152B5B] transition-colors">
              Mitra
            </a>
          </div>

          {/* TOMBOL DAFTAR SEKARANG (SUDAH MENJADI LINK) */}
          <a
            href="https://ikadiy.uii.ac.id/bergabung"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-r from-[#152B5B] to-blue-900 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:shadow-[0_0_15px_rgba(21,43,91,0.4)] transition-all active:scale-95 hidden md:flex items-center justify-center border border-[#152B5B]"
          >
            Daftar Sekarang
          </a>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#152B5B]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col-reverse lg:flex-row items-center gap-12 relative z-10">
          <div className="lg:w-1/2">
            <div className="inline-flex items-center gap-2 bg-yellow-50 text-yellow-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 border border-yellow-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
              Aplikasi Resmi Alumni
            </div>
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight">
              Satu Aplikasi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#152B5B] to-blue-600">
                Sejuta Koneksi.
              </span>
            </h1>
            <p className="text-slate-500 mt-6 text-lg max-w-lg leading-relaxed">
              Platform digital terintegrasi untuk seluruh alumni UII di wilayah
              Yogyakarta. Bangga sebagai alumni, sehat bersama, dan tertib
              administrasi dalam satu genggaman.
            </p>

            <div className="flex items-center gap-4 mt-10">
              <a
                href="#"
                className="hover:-translate-y-1 transition-transform drop-shadow-sm hover:drop-shadow-lg"
              >
                <img
                  src="https://stockbit.com/images/playstore-logo.png"
                  alt="Get it on Google Play"
                  className="h-[46px] object-contain"
                />
              </a>
              <a
                href="#"
                className="hover:-translate-y-1 transition-transform drop-shadow-sm hover:drop-shadow-lg"
              >
                <img
                  src="https://stockbit.com/images/appstore-logo.png"
                  alt="Download on the App Store"
                  className="h-[46px] object-contain"
                />
              </a>
            </div>
          </div>

          <div className="lg:w-1/2 flex justify-center lg:justify-end w-full">
            <div className="relative w-[280px] h-[580px] bg-slate-100 rounded-[3rem] border-[8px] border-slate-800 shadow-2xl overflow-hidden flex-shrink-0 group">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-800 rounded-b-3xl w-1/2 mx-auto z-20"></div>
              <div className="w-full h-full bg-white p-5 pt-10 relative">
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-[#152B5B]/10 to-transparent"></div>
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm"></div>
                  <div className="w-24 h-4 bg-slate-100 rounded-full"></div>
                </div>
                <div className="w-full h-32 bg-gradient-to-br from-[#152B5B] to-blue-800 rounded-2xl mb-4 p-4 text-white shadow-lg relative z-10 overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                  <div className="w-16 h-4 bg-white/20 rounded mb-2"></div>
                  <div className="w-24 h-6 bg-white/40 rounded"></div>
                </div>
                <div className="grid grid-cols-4 gap-3 mb-6 relative z-10">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="aspect-square bg-slate-50 rounded-xl shadow-sm border border-slate-100"
                    ></div>
                  ))}
                </div>
                <div className="w-full h-40 bg-slate-50 rounded-2xl shadow-sm border border-slate-100 mb-4 relative z-10"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-10 border-y border-slate-100 bg-white relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-slate-100">
          <div>
            <h3 className="text-3xl font-black text-[#152B5B]">10rb+</h3>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Alumni Terdaftar
            </p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#152B5B]">100%</h3>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Gratis Akses
            </p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#152B5B]">24/7</h3>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Layanan E-Office
            </p>
          </div>
          <div>
            <h3 className="text-3xl font-black text-[#152B5B]">5+</h3>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              Mitra Donasi
            </p>
          </div>
        </div>
      </section>

      {/* --- Z-PATTERN FEATURE 1: E-OFFICE --- */}
      <section className="py-24 bg-white overflow-hidden" id="fitur">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-16">
          <div className="md:w-1/2">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6 tracking-tight">
              E-Office & Validasi <br /> Dokumen Instan
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 text-lg">
              Tinggalkan cara lama. Kini validasi keaslian dokumen, surat tugas,
              dan pengajuan administrasi DPW IKA UII DIY dapat dilakukan secara
              real-time melalui teknologi QR Scanner yang terenkripsi.
            </p>
            <ul className="space-y-4">
              {[
                "Paperless & Ramah Lingkungan",
                "Verifikasi QR Code Real-time",
                "Terintegrasi Database Pusat",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-slate-700 font-medium bg-slate-50 w-fit px-4 py-2 rounded-lg border border-slate-100"
                >
                  <CheckCircle2 className="text-yellow-500" size={20} /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="md:w-1/2 flex justify-center relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/50 to-yellow-100/30 rounded-full blur-3xl w-[80%] h-[80%] m-auto"></div>
            <div className="w-[300px] h-[400px] bg-white border border-slate-200 shadow-2xl rounded-2xl relative z-10 p-6 flex flex-col">
              <div className="w-full h-48 bg-slate-100 rounded-xl mb-4 overflow-hidden relative">
                <div className="w-full h-1 bg-yellow-400 absolute top-1/2 shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
              </div>
              <div className="w-3/4 h-4 bg-slate-100 rounded-full mb-3"></div>
              <div className="w-1/2 h-4 bg-slate-100 rounded-full mb-auto"></div>
              <div className="w-full h-12 bg-[#152B5B] rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md">
                Validasi Sekarang
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Z-PATTERN FEATURE 2: VIRTUAL RUN --- */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col-reverse md:flex-row items-center gap-16">
          <div className="md:w-1/2 flex justify-center relative">
            <div className="absolute inset-0 bg-yellow-500/10 rounded-full blur-3xl w-[80%] h-[80%] m-auto"></div>
            <div className="w-[300px] h-[500px] bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] relative z-10 p-4">
              <div className="w-full h-full bg-slate-50 rounded-[2rem] p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-yellow-100">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 font-black text-xs">
                    #1
                  </div>
                  <div className="flex-1 ml-3">
                    <div className="w-20 h-3 bg-slate-200 rounded mb-1"></div>
                    <div className="w-10 h-2 bg-slate-100 rounded"></div>
                  </div>
                  <Trophy size={18} className="text-yellow-500" />
                </div>
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold text-xs">
                    #2
                  </div>
                  <div className="flex-1 ml-3">
                    <div className="w-20 h-3 bg-slate-200 rounded mb-1"></div>
                    <div className="w-10 h-2 bg-slate-100 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-6 tracking-tight">
              Virtual Run & Sinkronisasi <br />
              <span className="text-[#fc4c02]">Strava</span>
            </h2>
            <p className="text-slate-500 leading-relaxed mb-8 text-lg">
              Jaga kesehatan bersama komunitas alumni. Hubungkan akun Strava
              Anda, pantau jarak tempuh, dan raih posisi puncak di Leaderboard
              lari mingguan.
            </p>
            <a
              href="#"
              className="inline-flex items-center gap-2 text-[#152B5B] font-bold hover:text-yellow-600 transition-colors group"
            >
              Pelajari Cara Kerja Leaderboard{" "}
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </a>
          </div>
        </div>
      </section>

      {/* --- GRID BENEFITS (Keuntungan dari Kebersamaan) --- */}
      <section className="py-24 bg-white" id="keuntungan">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Keuntungan dari Kebersamaan
            </h2>
            <p className="text-slate-500 mt-4 leading-relaxed">
              Kami merancang setiap modul untuk memberikan manfaat maksimal bagi
              seluruh anggota.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: <ShieldCheck size={36} className="text-white" />,
                bg: "bg-[#152B5B]",
                title: "Administrasi Rapi",
                desc: "Sistem arsip digital yang aman dan terstruktur untuk semua dokumen keanggotaan.",
              },
              {
                icon: <Smartphone size={36} className="text-white" />,
                bg: "bg-blue-600",
                title: "E-KTA Eksklusif",
                desc: "Akses kartu anggota digital langsung dari HP Anda, siap dicetak sebagai E-Money.",
              },
              {
                icon: <Trophy size={36} className="text-slate-900" />,
                bg: "bg-yellow-400",
                title: "Komunitas Aktif",
                desc: "Berbagai event kesehatan dan kegiatan sosial yang mudah diikuti.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-8 rounded-[2rem] bg-slate-50 hover:bg-white transition-all border border-slate-100 hover:shadow-xl group"
              >
                <div
                  className={`w-16 h-16 mx-auto ${item.bg} shadow-md rounded-2xl flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300`}
                >
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">
                  {item.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- PARTNERS LOGO --- */}
      <section
        className="py-16 bg-slate-50 border-y border-slate-200"
        id="mitra"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 text-center">
          <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mb-8">
            Telah Didukung Oleh
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="text-2xl font-black text-[#152B5B]">BANK BSI</div>
            <div className="text-2xl font-black text-blue-600">
              BANK MANDIRI
            </div>
            <div className="text-xl font-black text-slate-800 tracking-tighter">
              STRAVA API
            </div>
            <div className="text-2xl font-black text-red-600">Q R I S</div>
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-12">
          <div className="bg-gradient-to-br from-[#152B5B] to-blue-900 rounded-[3rem] p-10 md:p-16 text-center shadow-2xl relative overflow-hidden border border-[#152B5B]">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-yellow-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                Mulai Koneksi Anda Hari Ini
              </h2>
              <p className="text-blue-100 mb-10 max-w-lg mx-auto leading-relaxed">
                Download aplikasinya sekarang dan bergabunglah dengan ribuan
                alumni lainnya.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="#"
                  className="hover:-translate-y-1 transition-transform drop-shadow-lg"
                >
                  <img
                    src="https://stockbit.com/images/playstore-logo.png"
                    alt="Google Play"
                    className="h-[50px]"
                  />
                </a>
                <a
                  href="#"
                  className="hover:-translate-y-1 transition-transform drop-shadow-lg"
                >
                  <img
                    src="https://stockbit.com/images/appstore-logo.png"
                    alt="App Store"
                    className="h-[50px]"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- EXTENDED FOOTER --- */}
      <footer className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <img
              src="https://ikadiy.uii.ac.id/logo-dpp-ika.png"
              alt="Logo IKA UII DIY"
              className="h-12 md:h-14 object-contain mb-6 drop-shadow-sm"
            />
            <p className="text-sm text-slate-500 leading-relaxed pr-4">
              Digital Hub DPW IKA UII DIY. Mewadahi silaturahmi, inovasi, dan
              kolaborasi seluruh alumni di wilayah Yogyakarta.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs border-b border-slate-200 pb-2 w-max">
              Perusahaan
            </h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li>
                <a
                  href="#"
                  className="hover:text-[#152B5B] hover:font-semibold transition-all"
                >
                  Tentang Kami
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#152B5B] hover:font-semibold transition-all"
                >
                  Susunan Pengurus
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#152B5B] hover:font-semibold transition-all"
                >
                  Hubungi Kami
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs border-b border-slate-200 pb-2 w-max">
              Dukungan
            </h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li>
                <a
                  href="#"
                  className="hover:text-[#152B5B] hover:font-semibold transition-all"
                >
                  Pusat Bantuan
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#152B5B] hover:font-semibold transition-all"
                >
                  Kebijakan Privasi
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-[#152B5B] hover:font-semibold transition-all"
                >
                  Syarat & Ketentuan
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-wider text-xs border-b border-slate-200 pb-2 w-max">
              Ikuti Kami
            </h4>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-[#E1306C] hover:shadow-md border border-slate-200 transition-all"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:shadow-md border border-slate-200 transition-all"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path>
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">
            Hak Cipta © {currentYear} DPW IKA UII DIY. Seluruh hak cipta
            dilindungi.
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Dikembangkan oleh{" "}
            <span className="text-slate-600 font-bold">
              Guwigo Teknologi Indonesia
            </span>
          </p>
        </div>
      </footer>

      {/* --- COOKIE CONSENT BANNER --- */}
      <div
        className={`fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 shadow-[0_-20px_40px_rgba(0,0,0,0.08)] z-[90] transform transition-transform duration-700 ease-in-out ${showCookie ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mr-0 md:mr-24">
          <div className="flex items-start gap-4 flex-1">
            <div className="hidden md:flex mt-1 p-2 bg-[#152B5B]/5 rounded-lg text-[#152B5B]">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5"></path>
                <path d="M8.5 8.5v.01"></path>
                <path d="M16 15.5v.01"></path>
                <path d="M12 12v.01"></path>
                <path d="M11 17v.01"></path>
                <path d="M7 14v.01"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800 mb-1">
                Kami Menghargai Privasi Anda
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Situs web ini menyimpan cookies di komputer Anda untuk analitik
                dan penyesuaian pengalaman. Untuk mengetahui lebih lanjut
                tentang cookies yang kami gunakan, lihat{" "}
                <a
                  href="#"
                  className="font-bold text-[#152B5B] hover:text-yellow-600 underline"
                >
                  Kebijakan Cookie
                </a>
                .
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowCookie(false)}
              className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Pengaturan
            </button>
            <button
              onClick={handleAcceptCookies}
              className="flex-1 md:flex-none px-6 py-3 bg-[#152B5B] text-white rounded-xl text-xs font-bold hover:bg-[#11234b] shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              Terima Semua
            </button>
          </div>
        </div>
      </div>

      {/* --- FLOATING WHATSAPP WIDGET --- */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
        {/* Tooltip Chat Bubble */}
        <div
          className={`mb-4 bg-[#F2F8FD] px-5 py-4 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.1)] border border-blue-100 max-w-[260px] relative origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
            showTooltip && !isHelpOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-50 opacity-0 pointer-events-none translate-y-5"
          }`}
        >
          <button
            onClick={() => setShowTooltip(false)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-700 transition-colors p-1"
            aria-label="Tutup sapaan"
          >
            <X size={14} strokeWidth={3} />
          </button>
          <p className="font-bold text-[#152B5B] text-sm mb-1">Halo! 👋</p>
          <p className="text-xs text-slate-700 leading-relaxed font-medium pr-2">
            Kamu bisa berkonsultasi seputar Layanan Aplikasi IKA UII dengan
            kami.
          </p>
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-[#F2F8FD] border-b border-r border-blue-100 transform rotate-45"></div>
        </div>

        {/* Floating WhatsApp Button */}
        <button
          onClick={() => {
            setIsHelpOpen(true);
            setShowTooltip(false);
          }}
          className={`w-14 h-14 bg-[#25D366] hover:bg-[#20bd5a] rounded-full shadow-xl flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:scale-110 focus:outline-none ${
            isHelpOpen
              ? "scale-50 opacity-0 pointer-events-none absolute bottom-0 right-0"
              : "scale-100 opacity-100 relative"
          }`}
          aria-label="Pusat Bantuan WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="white" width="30" height="30">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </button>

        {/* Form Pop-up WA */}
        <div
          className={`absolute bottom-0 right-0 w-[340px] bg-white rounded-2xl shadow-[0_15px_50px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-200 transform origin-bottom-right transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${
            isHelpOpen
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-50 opacity-0 pointer-events-none translate-y-10"
          }`}
        >
          <div className="bg-gradient-to-r from-[#25D366] to-[#1da851] p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center p-1.5 shadow-inner">
                <svg
                  viewBox="0 0 24 24"
                  fill="white"
                  width="100%"
                  height="100%"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.663-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">
                  Pusat Bantuan
                </h3>
                <p className="text-[10px] text-green-100 font-medium">
                  Tim IKA UII siap membantu Anda
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSendWA} className="p-5 bg-[#F2F8FD]">
            <p className="text-xs text-slate-500 mb-4 bg-white border border-blue-100 p-3 rounded-xl shadow-sm">
              Halo! Silakan isi identitas Anda dan sampaikan pertanyaan atau
              kendala yang dialami.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#152B5B] mb-1.5">
                  Identitas (Nama / Angkatan)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Teguh Dwi Prayogo (2018)"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition-all bg-white shadow-sm"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#152B5B] mb-1.5">
                  Pesan / Pertanyaan
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Tulis pesan Anda di sini..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366]/40 focus:border-[#25D366] transition-all bg-white resize-none shadow-sm"
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              className="mt-5 w-full bg-[#152B5B] hover:bg-blue-900 text-white rounded-xl py-3 px-4 font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Send size={16} />
              Kirim via WhatsApp
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
