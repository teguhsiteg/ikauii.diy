"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

// --- KOMPONEN ANIMASI SCROLL REVEAL ---
const ScrollReveal = ({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Hanya animasi sekali saat pertama kali muncul
        }
      },
      { threshold: 0.1 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
      }`}
    >
      {children}
    </div>
  );
};

export default function OfflineRunLandingPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- STATE UNTUK SINKRONISASI KUOTA ---
  const [packageCounts, setPackageCounts] = useState<Record<string, number>>(
    {},
  );

  // --- STATE PENCARIAN TIKET & TIMELINE ---
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [searchTicketValue, setSearchTicketValue] = useState("");
  const [isSearchingTicket, setIsSearchingTicket] = useState(false);
  const [ticketError, setTicketError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 🔥 SESUAI REQUEST: Narik dari "virtual_run" 🔥
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }

        const pRef = collection(db, "offline_participants");
        const pSnap = await getDocs(pRef);
        const counts: Record<string, number> = {};

        pSnap.forEach((doc) => {
          const data = doc.data();
          if (data.paketId) {
            counts[data.paketId] = (counts[data.paketId] || 0) + 1;
          }
        });
        setPackageCounts(counts);
      } catch (error) {
        console.error("Gagal memuat pengaturan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearchTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTicketValue) return;

    setIsSearchingTicket(true);
    setTicketError("");

    try {
      const pRef = collection(db, "offline_participants");
      let q = query(
        pRef,
        where("email", "==", searchTicketValue.trim().toLowerCase()),
      );
      let querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const numericSearch = searchTicketValue.replace(/\D/g, "");
        q = query(pRef, where("noWA", "==", numericSearch));
        querySnapshot = await getDocs(q);
      }

      if (!querySnapshot.empty) {
        const participantData = querySnapshot.docs[0];
        router.push(`/run/checkout/${participantData.id}`);
      } else {
        setTicketError(
          "Data tidak ditemukan. Pastikan Email atau No. WhatsApp sudah benar.",
        );
      }
    } catch (error) {
      setTicketError("Terjadi kesalahan pada server. Silakan coba lagi.");
    } finally {
      setIsSearchingTicket(false);
    }
  };

  const scrollToTiket = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.getElementById("kategori-tiket");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#072439] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-500 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // =========================================
  // LOGIKA STATUS TAMPILAN HALAMAN
  // =========================================
  const isOfflineEnabled = settings?.isOfflineRunEnabled;
  const offlineStatus = settings?.offlineStatus || "tutup";

  const showComingSoon = isOfflineEnabled && offlineStatus === "coming_soon";
  const showTutup = !isOfflineEnabled || offlineStatus === "tutup";
  const showNormal = isOfflineEnabled && offlineStatus === "buka";

  // 1. TAMPILAN COMING SOON
  if (showComingSoon) {
    return (
      <div className="min-h-screen bg-[#0B2239] font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="mb-6 flex flex-col items-center justify-center animate-in zoom-in-95 duration-700 relative z-10">
          <div className="w-32 h-40 md:w-36 md:h-48 bg-white rounded-t-full rounded-b-2xl p-4 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden border border-slate-200">
            <div className="absolute top-0 w-full h-12 bg-slate-100 flex items-end justify-center pb-1">
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                Est. {new Date().getFullYear()}
              </span>
            </div>
            <img
              src="/logo-dpp-ika.png"
              alt="Logo IKA UII"
              className="w-20 h-20 md:w-24 md:h-24 object-contain mt-8 z-10"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase mb-6 text-center animate-in fade-in duration-1000 delay-100 relative z-10">
          IKA UII DIY RUN
        </h1>

        <h2 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-in fade-in duration-1000 delay-200 relative z-10">
          Coming Soon
        </h2>

        <p className="text-emerald-400 font-bold tracking-widest text-sm md:text-lg mb-10 animate-in fade-in duration-1000 delay-300 text-center relative z-10">
          {settings?.offlineComingSoonText || "Akan Segera Hadir"}
        </p>

        <a
          href="https://instagram.com/ikauii.diy"
          target="_blank"
          rel="noopener noreferrer"
          className="border border-slate-500 hover:border-emerald-400 hover:bg-emerald-900/30 text-slate-300 hover:text-white px-6 py-2.5 rounded-full flex items-center gap-2.5 transition-all font-medium text-sm animate-in fade-in duration-1000 delay-500 relative z-10"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.067 3.282.153 4.769 1.64 4.922 4.922.055 1.266.067 1.646.067 4.849 0 3.204-.012 3.584-.067 4.85-.153 3.282-1.64 4.769-4.922 4.922-1.266.055-1.646.067-4.85.067-3.204 0-3.584-.012-4.85-.067-3.282-.153-4.769-1.64-4.922-4.922-.055-1.266-.067-1.646-.067-4.849 0-3.204.012-3.584.067-4.85.153-3.282 1.64-4.769 4.922-4.922 1.266-.055 1.646-.067 4.85-.067zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.61-6.98 5.928-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.2 4.358 2.618 6.78 5.928 6.98 1.28.058 1.688.072 4.947.072 3.259 0 3.667-.014 4.947-.072 4.358-.2 6.78-1.61 6.98-5.928.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-5.928-6.98-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          @ikauii.diy
        </a>
      </div>
    );
  }

  // 2. TAMPILAN TUTUP (TIDAK AKTIF)
  if (showTutup) {
    return (
      <div className="min-h-screen bg-[#0B2239] font-sans flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="mb-6 flex flex-col items-center justify-center relative z-10">
          <div className="w-24 h-32 bg-white rounded-t-full rounded-b-xl p-3 flex flex-col items-center justify-center shadow-xl border border-slate-200">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-16 h-16 object-contain mt-4"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 max-w-4xl leading-tight relative z-10">
          PENDAFTARAN RUNNING <br />
          <span className="text-emerald-400">AKAN SEGERA DIINFORMASIKAN</span>
        </h1>

        <p className="text-slate-300 text-sm md:text-base font-medium mb-10 max-w-2xl relative z-10 leading-relaxed">
          Pendaftaran belum dibuka atau telah ditutup. Pantau terus Instagram
          dan saluran komunikasi resmi kami untuk mendapatkan pembaruan dan
          informasi tiket selanjutnya.
        </p>

        <div className="flex flex-wrap justify-center gap-4 relative z-10">
          <a
            href="https://instagram.com/ikauii.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full flex items-center gap-2.5 transition-all font-bold text-sm backdrop-blur-md"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.067 3.282.153 4.769 1.64 4.922 4.922.055 1.266.067 1.646.067 4.849 0 3.204-.012 3.584-.067 4.85-.153 3.282-1.64 4.769-4.922 4.922-1.266.055-1.646.067-4.85.067-3.204 0-3.584-.012-4.85-.067-3.282-.153-4.769-1.64-4.922-4.922-.055-1.266-.067-1.646-.067-4.849 0-3.204.012-3.584.067-4.85.153-3.282 1.64-4.769 4.922-4.922 1.266-.055 1.646-.067 4.85-.067zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.61-6.98 5.928-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.2 4.358 2.618 6.78 5.928 6.98 1.28.058 1.688.072 4.947.072 3.259 0 3.667-.014 4.947-.072 4.358-.2 6.78-1.61 6.98-5.928.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-5.928-6.98-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            @ikauii.diy
          </a>
          <a
            href="mailto:ika.diy@uii.ac.id"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-full flex items-center gap-2.5 transition-all font-bold text-sm shadow-lg"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Hubungi Panitia
          </a>
        </div>
      </div>
    );
  }

  // =========================================
  // 3. TAMPILAN BUKA (NORMAL)
  // =========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-300 selection:text-emerald-900 flex flex-col scroll-smooth">
      <NavbarPublic />

      {/* HERO SECTION DENGAN SILUET */}
      <section className="relative pt-[180px] pb-20 md:pt-[220px] lg:pt-[260px] lg:pb-32 overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-950">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        {/* Siluet Pelari & Kota (Menggantikan Emoji) */}
        <div className="absolute -left-10 bottom-0 opacity-10 text-white pointer-events-none select-none overflow-hidden">
          <svg
            className="w-[500px] h-[500px] translate-y-1/3"
            viewBox="0 0 100 100"
            fill="currentColor"
          >
            <path d="M50.4,14.6c2.4,0,4.4-2,4.4-4.4c0-2.4-2-4.4-4.4-4.4c-2.4,0-4.4,2-4.4,4.4C46,12.6,48,14.6,50.4,14.6z M53.8,40.1l3.5,17l10.9,3.3 c1,0.3,2.1-0.2,2.4-1.2c0.3-1-0.2-2.1-1.2-2.4l-8.6-2.6l-4.1-18.7c-0.6-2.5-2.7-4.3-5.2-4.6l-9.1-1l-5.6-7.2c-0.8-1.1-2.4-1.3-3.5-0.5 c-1.1,0.8-1.3,2.4-0.5,3.5l7,9l-2,9.3l-8.8-3.4c-1-0.4-2.1,0.1-2.5,1c-0.4,1,0.1,2.1,1,2.5l11.5,4.4c1.6,0.6,3.4,0.1,4.6-1.2 L49,42L53.8,40.1z M40.7,64.2c-1,0.3-1.6,1.4-1.3,2.5l5.2,16.8l-8,8.2c-0.7,0.8-0.7,2,0.1,2.8c0.8,0.7,2,0.7,2.8-0.1l10-10.3 c0.6-0.6,0.9-1.4,0.7-2.3L45,65.5C44.7,64.5,43.6,63.9,40.7,64.2z M60.4,85.2l-3-11c-0.3-1-1.3-1.6-2.4-1.3c-1,0.3-1.6,1.3-1.3,2.4 l3.5,12.8c0.2,0.8,0.8,1.4,1.6,1.6l10.8,2.9c1,0.3,2.1-0.3,2.4-1.3c0.3-1-0.3-2.1-1.3-2.4L60.4,85.2z" />
          </svg>
        </div>
        <div className="absolute -right-20 bottom-0 opacity-10 text-white pointer-events-none select-none">
          <svg
            className="w-[600px] h-[300px] translate-y-1/4"
            viewBox="0 0 1200 400"
            fill="currentColor"
          >
            <path d="M0,400h1200V300h-50v-50h-50v50h-50v-80h-40v80h-80v-40h-40v40h-80V150h-60v150h-80v-60h-50v60h-60V200h-50v100h-80v-30h-40v30h-80V250h-60v50H0V400z" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-20 text-center flex flex-col items-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-8 shadow-2xl">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] md:text-xs font-black text-emerald-50 uppercase tracking-[0.2em]">
                Official Offline Run Event
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 max-w-4xl leading-[1.1]">
              Lari Bersama,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-yellow-300">
                Tebarkan Manfaat
              </span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-base md:text-xl text-emerald-100/80 mb-10 max-w-2xl font-medium leading-relaxed mx-auto">
              Satu rute, ribuan semangat. Mari berkumpul dan berlari menyusuri
              keindahan {settings?.offlineLocation || "Yogyakarta"} bersama
              keluarga besar IKA UII.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12 w-full">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-center gap-4 w-full md:w-auto">
                <svg
                  className="w-8 h-8 text-emerald-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-0.5">
                    Lokasi Start / Finish
                  </p>
                  <p className="text-white font-black text-sm md:text-base">
                    {settings?.offlineLocation || "Yogyakarta"}
                  </p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 flex items-center justify-center gap-4 w-full md:w-auto">
                <svg
                  className="w-8 h-8 text-emerald-400 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <div className="text-left">
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-0.5">
                    Waktu Pelaksanaan
                  </p>
                  <p className="text-white font-black text-sm md:text-base">
                    {settings?.offlineDate
                      ? new Date(settings.offlineDate).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "long", year: "numeric" },
                        )
                      : "-"}
                  </p>
                  <p className="text-xs text-emerald-200 font-medium">
                    Pukul {settings?.offlineTime || "06:00"} WIB
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={400}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full md:w-auto">
              <a
                href="#kategori-tiket"
                onClick={scrollToTiket}
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black px-10 py-4 md:px-12 md:py-5 rounded-full text-base md:text-lg transition-all shadow-xl shadow-emerald-500/20 transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Amankan Slot Sekarang &rarr;
              </a>

              {/* TOMBOL TIMELINE */}
              <button
                onClick={() => setIsTimelineModalOpen(true)}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold px-10 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Jadwal Pendaftaran
              </button>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={500}>
            <p className="text-[10px] md:text-xs text-emerald-200/60 mt-6 font-medium tracking-wide">
              *Kuota keseluruhan terbatas {settings?.offlineQuota || 0} peserta.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* RACE PACK & ROUTE SECTION */}
      <section className="py-16 md:py-24 bg-[#F4F7FB] border-b border-slate-200 w-full relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-16">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                Fasilitas Peserta
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4">
                Race Pack & Rute Lari
              </h2>
              <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto mb-8">
                Setiap pendaftaran offline sudah termasuk Race Pack premium yang
                akan menemani langkah Anda melintasi rute yang telah disiapkan.
              </p>

              {/* BOX CEK TIKET */}
              <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 transform -translate-y-4 hover:-translate-y-6 transition-transform duration-300">
                <div className="text-left flex-grow">
                  <h3 className="font-black text-slate-800 text-lg flex items-center justify-center md:justify-start gap-2">
                    <svg
                      className="w-6 h-6 text-emerald-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                      />
                    </svg>
                    Sudah Mendaftar?
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1 text-center md:text-left">
                    Ambil E-Ticket Anda sekarang untuk persiapan penukaran Race
                    Pack.
                  </p>
                </div>
                <button
                  onClick={() => setIsTicketModalOpen(true)}
                  className="w-full md:w-auto shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  Cek Tiket Saya
                </button>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Jersey */}
            <ScrollReveal delay={100}>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                <div className="aspect-square bg-slate-50 rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {settings?.urlJerseyOffline ? (
                    <img
                      src={settings.urlJerseyOffline}
                      alt="Jersey Pelari"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <svg
                        className="w-16 h-16 text-slate-300 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M16 4v12l-4-2-4 2V4M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="font-bold text-xs md:text-sm">
                        Preview Jersey
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 text-center md:text-left">
                  Runner Dry-Fit Jersey
                </h3>
                <p className="text-slate-500 text-xs md:text-sm text-center md:text-left">
                  Jersey berbahan premium, ringan, dan cepat kering. Nyaman
                  dipakai hingga mencapai garis finish.
                </p>
              </div>
            </ScrollReveal>

            {/* Peta Rute */}
            <ScrollReveal delay={200}>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                <div className="aspect-square bg-slate-50 rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {settings?.urlOfflineRouteMap ? (
                    <img
                      src={settings.urlOfflineRouteMap}
                      alt="Peta Rute Lari"
                      className="w-full h-full object-contain p-2 transform group-hover:scale-105 transition-transform duration-700 cursor-zoom-in"
                      onClick={() =>
                        window.open(settings.urlOfflineRouteMap, "_blank")
                      }
                      title="Klik untuk memperbesar gambar"
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <svg
                        className="w-16 h-16 text-slate-300 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                      <span className="font-bold text-xs md:text-sm">
                        Rute Belum Tersedia
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 text-center md:text-left">
                  Peta Rute (Route Map)
                </h3>
                <p className="text-slate-500 text-xs md:text-sm text-center md:text-left">
                  Pelajari jalur lari yang akan dilewati. Lengkap dengan
                  informasi titik kumpul, water station, dan pos medis.
                </p>
              </div>
            </ScrollReveal>

            {/* Medali */}
            <ScrollReveal delay={300}>
              <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                <div className="aspect-square bg-slate-50 rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {settings?.urlMedaliOffline ? (
                    <img
                      src={settings.urlMedaliOffline}
                      alt="Medali Finisher"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <svg
                        className="w-16 h-16 text-slate-300 mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                        />
                      </svg>
                      <span className="font-bold text-xs md:text-sm">
                        Preview Medali
                      </span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 text-center md:text-left">
                  Finisher Medal
                </h3>
                <p className="text-slate-500 text-xs md:text-sm text-center md:text-left">
                  Medali logam 3D die-cast eksklusif. Diberikan khusus bagi
                  pelari yang berhasil melewati garis finish!
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section
        id="kategori-tiket"
        className="py-16 md:py-24 bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-24"
      >
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-16">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
              Kategori Tiket
            </span>
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4">
              Pilihan Tiket & Kategori Jarak
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto">
              Pilih kategori jarak lari yang sesuai dengan kemampuanmu.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {settings?.offlinePackages && settings.offlinePackages.length > 0 ? (
            settings.offlinePackages.map((pkg: any, index: number) => {
              const isHighlight = pkg.isHighlight === true;

              const terisi = packageCounts[pkg.id] || 0;
              const batasKuota = Number(pkg.kuota) || 0;
              const sisaKuota = Math.max(0, batasKuota - terisi);
              const isSoldOut = sisaKuota <= 0;
              const persentase =
                batasKuota > 0 ? Math.min(100, (terisi / batasKuota) * 100) : 0;

              return (
                <ScrollReveal key={pkg.id} delay={index * 150}>
                  <div
                    className={`w-full h-full rounded-[2rem] p-6 border flex flex-col relative overflow-hidden transition-all ${
                      isHighlight
                        ? "bg-emerald-900 border-emerald-800 text-white shadow-2xl transform lg:-translate-y-4"
                        : "bg-slate-50 border-slate-200 shadow-sm hover:shadow-xl"
                    }`}
                  >
                    {!isHighlight && (
                      <div className="h-2 w-full bg-slate-300 absolute top-0 left-0"></div>
                    )}

                    <div className="mb-6 mt-4">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                          isHighlight
                            ? "bg-emerald-800 text-emerald-200 border border-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        KATEGORI {pkg.jarak}
                      </span>
                    </div>

                    <h3
                      className={`text-xl md:text-2xl font-black mb-2 ${
                        isHighlight ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {pkg.nama}
                    </h3>

                    <div className="mb-6">
                      <div className="flex justify-between text-[11px] font-bold mb-2">
                        <span
                          className={
                            isHighlight ? "text-emerald-200" : "text-slate-500"
                          }
                        >
                          Sisa Kuota:
                        </span>
                        <span
                          className={
                            isSoldOut
                              ? "text-rose-500"
                              : isHighlight
                                ? "text-yellow-400"
                                : "text-emerald-600"
                          }
                        >
                          {isSoldOut ? "Habis" : `${sisaKuota} / ${batasKuota}`}
                        </span>
                      </div>
                      <div
                        className={`w-full h-2.5 rounded-full overflow-hidden ${
                          isHighlight
                            ? "bg-emerald-950/50 border border-emerald-800"
                            : "bg-slate-200 border border-slate-300/50"
                        }`}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ${
                            isSoldOut
                              ? "bg-rose-500"
                              : isHighlight
                                ? "bg-yellow-400"
                                : "bg-emerald-500"
                          }`}
                          style={{ width: `${persentase}%` }}
                        ></div>
                      </div>
                    </div>

                    <div
                      className={`text-3xl md:text-4xl font-black mb-8 tracking-tight ${
                        isHighlight ? "text-yellow-400" : "text-slate-900"
                      }`}
                    >
                      Rp {Number(pkg.harga).toLocaleString("id-ID")}
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {pkg.benefit &&
                        pkg.benefit
                          .split(",")
                          .map((item: string, i: number) => (
                            <li
                              key={i}
                              className={`flex items-start gap-3 text-xs md:text-sm font-medium ${
                                isHighlight
                                  ? "text-emerald-50"
                                  : "text-slate-700"
                              }`}
                            >
                              <svg
                                className={`w-4 h-4 mt-0.5 shrink-0 ${isHighlight ? "text-yellow-400" : "text-emerald-500"}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              {item.trim()}
                            </li>
                          ))}
                    </ul>

                    {isSoldOut ? (
                      <button
                        disabled
                        className="w-full text-center font-bold py-3.5 md:py-4 rounded-xl shadow-inner text-sm bg-rose-100 text-rose-500 cursor-not-allowed border border-rose-200 uppercase tracking-widest mt-auto"
                      >
                        Habis Terjual
                      </button>
                    ) : (
                      <Link
                        href={`/run/daftar?paket=${pkg.id}`}
                        className={`w-full text-center font-bold py-3.5 md:py-4 rounded-xl transition-all shadow-md text-sm mt-auto flex items-center justify-center gap-2 ${
                          isHighlight
                            ? "bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
                            : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-800"
                        }`}
                      >
                        Daftar Kategori {pkg.jarak}
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </Link>
                    )}
                  </div>
                </ScrollReveal>
              );
            })
          ) : (
            <div className="text-slate-500 font-bold py-10 col-span-full text-center bg-slate-50 rounded-2xl border border-slate-200">
              Paket lari offline belum tersedia dari Admin.
            </div>
          )}
        </div>
      </section>

      {/* SECTION SPONSOR & MEDIA PARTNER */}
      {settings?.sponsorGroups && settings.sponsorGroups.length > 0 && (
        <section className="py-16 md:py-24 bg-slate-50 relative z-10 w-full overflow-hidden border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            {settings.sponsorGroups.map((group: any, idx: number) => {
              // Lewati kalau tidak ada logo yang bisa ditampilkan (disembunyikan admin / URL kosong)
              const visibleLogos = (group.logos || []).filter(
                (l: any) => !l.isHidden && l.url,
              );
              if (visibleLogos.length === 0) return null;

              // Ambil ukuran dari Admin (default medium)
              const size = group.size || "medium";

              // Konfigurasi CSS Dinamis Berdasarkan Ukuran Pilihan Admin
              let titleClass = "text-xs text-slate-500 mb-8";
              let containerClass =
                "gap-8 md:gap-12 opacity-60 hover:opacity-100 grayscale hover:grayscale-0";
              let logoClass = "h-10 md:h-14";

              if (size === "large") {
                titleClass = "text-sm md:text-base text-[#152B5B] mb-12";
                containerClass = "gap-10 md:gap-20 grayscale-0 opacity-100"; // Full color
                logoClass = "h-20 md:h-28";
              } else if (size === "small") {
                titleClass = "text-[10px] text-slate-400 mb-6";
                containerClass =
                  "gap-6 md:gap-10 opacity-40 hover:opacity-100 grayscale hover:grayscale-0";
                logoClass = "h-6 md:h-10";
              }

              return (
                <ScrollReveal key={group.id} delay={idx * 150}>
                  <div
                    className={`flex flex-col items-center w-full max-w-4xl mx-auto ${idx !== 0 ? "mt-16 md:mt-24" : ""}`}
                  >
                    {/* Judul Grup Sponsor */}
                    {group.title && (
                      <h3
                        className={`font-black uppercase tracking-[0.3em] relative inline-block ${titleClass}`}
                      >
                        {group.title}
                        {/* Garis Bawah Aksen (Hanya untuk ukuran Large) */}
                        {size === "large" && (
                          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-yellow-400 rounded-full"></span>
                        )}
                      </h3>
                    )}

                    {/* List Logo */}
                    <div
                      className={`flex flex-wrap justify-center items-center transition-all duration-500 w-full ${containerClass}`}
                    >
                      {visibleLogos.map((logo: any) => (
                        <div
                          key={logo.id}
                          className={`relative group flex items-center justify-center transition-all duration-300 w-auto ${logoClass}`}
                        >
                          <img
                            src={logo.url}
                            alt={logo.name || "Sponsor Logo"}
                            className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-300"
                          />
                          {/* Tooltip Nama Sponsor (Hover) */}
                          {logo.name && (
                            <div
                              className={`absolute left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-bold px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg ${size === "large" ? "-bottom-10" : "-bottom-8"}`}
                            >
                              {logo.name}
                              {/* Segitiga kecil tooltip */}
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </section>
      )}

      {/* MODAL TIMELINE PENDAFTARAN (POPUP) */}
      {isTimelineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-emerald-50 px-6 py-5 flex justify-between items-center border-b border-emerald-100">
              <h3 className="font-black text-emerald-900 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Timeline Kegiatan
              </h3>
              <button
                onClick={() => setIsTimelineModalOpen(false)}
                className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="relative border-l-2 border-emerald-100 ml-3 space-y-8">
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white"></span>
                  <p className="font-black text-slate-800 text-sm">
                    Pendaftaran Dibuka
                  </p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">
                    Saat ini sedang berlangsung
                  </p>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-white"></span>
                  <p className="font-black text-slate-800 text-sm">
                    Batas Pendaftaran
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {settings?.offlineTanggalPenutupan
                      ? new Date(
                          settings.offlineTanggalPenutupan,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) + " WIB"
                      : "Akan Diumumkan"}
                  </p>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white"></span>
                  <p className="font-black text-slate-800 text-sm">
                    Pengambilan Race Pack
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {settings?.offlinePeriodePengiriman || "Menjelang Hari H"}
                  </p>
                </div>
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-rose-500 ring-4 ring-white shadow-[0_0_10px_rgba(244,63,94,0.5)]"></span>
                  <p className="font-black text-slate-800 text-sm">
                    Hari Pelaksanaan (Race Day)
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {settings?.offlinePeriodeLari || "Akan Diumumkan"}
                  </p>
                  {settings?.offlineJadwalPuncakAcara && (
                    <p className="text-[10px] text-rose-500 font-bold mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-1">
                      <svg
                        className="w-3 h-3 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                      {settings.offlineJadwalPuncakAcara}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => setIsTimelineModalOpen(false)}
                className="w-full mt-8 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENCARIAN TIKET */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-emerald-50 px-6 py-5 flex justify-between items-center border-b border-emerald-100">
              <h3 className="font-black text-emerald-900 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
                Cari Tiket Saya
              </h3>
              <button
                onClick={() => setIsTicketModalOpen(false)}
                className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSearchTicket} className="p-6 sm:p-8">
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Masukkan <strong className="text-slate-800">Email</strong> atau{" "}
                <strong className="text-slate-800">Nomor WhatsApp</strong> yang
                Anda gunakan saat mendaftar untuk melihat E-Ticket atau status
                pembayaran Anda.
              </p>
              <div className="mb-6">
                <input
                  type="text"
                  required
                  placeholder="Contoh: budi@email.com / 08123456789"
                  value={searchTicketValue}
                  onChange={(e) => setSearchTicketValue(e.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 outline-none text-sm transition-all text-slate-800 font-bold"
                />
                {ticketError && (
                  <p className="text-xs text-rose-500 mt-2 font-medium flex items-center gap-1">
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    {ticketError}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={isSearchingTicket || !searchTicketValue}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSearchingTicket ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>{" "}
                    Mencari...
                  </>
                ) : (
                  "Cek Tiket Sekarang"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <FooterPublic />
    </div>
  );
}
