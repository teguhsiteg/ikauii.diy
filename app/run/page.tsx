"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getCountFromServer,
} from "firebase/firestore";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import CountdownTimer from "@/components/CountdownTimer";
import dynamic from "next/dynamic";

// 🔥 IMPORT PETA SECARA DINAMIS (SSR FALSE) 🔥
const EventMap = dynamic(() => import("@/components/EventMap"), { ssr: false });

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
          observer.disconnect();
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

// --- KOMPONEN UTAMA ---
function OfflineRunLandingPageContent() {
  const searchParams = useSearchParams();
  const isDevMode = searchParams.get("dev") === "true";

  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isBypassed, setIsBypassed] = useState(false);
  const [isForceOpen, setIsForceOpen] = useState(false);

  const [packageCounts, setPackageCounts] = useState<Record<string, number>>(
    {},
  );
  const [expandedMaps, setExpandedMaps] = useState<string[]>([]);
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);
        let settingsData = null;

        if (docSnap.exists()) {
          settingsData = docSnap.data();
          setSettings(settingsData);
        }

        const counts: Record<string, number> = {};

        if (settingsData && settingsData.offlinePackages) {
          await Promise.all(
            settingsData.offlinePackages.map(async (pkg: any) => {
              const q = query(
                collection(db, "offline_participants"),
                where("paketId", "==", pkg.id),
                where("statusPembayaran", "==", "Lunas")
              );
              const snapshot = await getCountFromServer(q);
              counts[pkg.id] = snapshot.data().count;
            }),
          );
        }

        setPackageCounts(counts);
      } catch (error) {
        console.error("Gagal memuat pengaturan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const scrollToTiket = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.getElementById("kategori-tiket");
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleMap = (id: string) => {
    setExpandedMaps((prev) =>
      prev.includes(id) ? prev.filter((mapId) => mapId !== id) : [...prev, id],
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B2239] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0B2239] border-t-[#FCD116] rounded-full animate-spin"></div>
      </div>
    );
  }

  const isOfflineEnabled = settings?.isOfflineRunEnabled;
  const adminStatus = settings?.offlineStatus || "auto";
  const isWaitingRoom = settings?.isWaitingRoomActive || false;

  const openDate = settings?.offlineTanggalPembukaan
    ? new Date(settings.offlineTanggalPembukaan)
    : null;
  const closeDate = settings?.offlineTanggalPenutupan
    ? new Date(settings.offlineTanggalPenutupan)
    : null;

  let showComingSoon = false;
  let showTutup = false;
  let showCountdown = false;
  let showNormal = false;

  // --- MULAI COPY DARI SINI ---
  if (isBypassed || isForceOpen) {
    showNormal = true;
  } else if (!isOfflineEnabled) {
    showTutup = true;
  } else if (adminStatus === "tutup") {
    showTutup = true;
  } else if (adminStatus === "coming_soon") {
    showComingSoon = true;
  } else if (adminStatus === "buka") {
    showNormal = true;
  } else {
    // adminStatus === "auto" atau tidak terdefinisi
    if (openDate && currentTime < openDate) {
      showCountdown = true;
    } else if (closeDate && currentTime > closeDate) {
      showTutup = true;
    } else {
      showNormal = true;
    }
  }
  // --- SAMPAI SINI ---

  if (showComingSoon || showCountdown) {
    return (
      <div className="min-h-screen bg-[#0B2239] font-sans flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {isDevMode && (
          <button
            onClick={() => setIsBypassed(true)}
            className="fixed bottom-4 left-4 z-50 bg-rose-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg border-2 border-white animate-bounce hover:bg-rose-700"
          >
            ⚡ BYPASS DEV MODE
          </button>
        )}

        <div
          className="absolute inset-0 bg-cover bg-center grayscale-[30%]"
          style={{
            backgroundImage:
              "url('https://www.uii.ac.id/wp-content/uploads/2025/03/Gerbang-UII.jpg')",
          }}
        ></div>
        <div className="absolute inset-0 bg-[#0B2239]/90"></div>

        <div className="mb-6 flex flex-col items-center justify-center animate-in zoom-in-95 duration-700 relative z-10">
          <div className="w-28 h-28 bg-white rounded-full p-5 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden border-4 border-[#FCD116]">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo IKA UII"
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest uppercase mb-4 text-center relative z-10 leading-tight">
          IKA UII DIY RUN <br />
          <span className="text-[#FCD116]">{showCountdown ? "SEGERA DIBUKA" : "COMING SOON"}</span>
        </h1>

        {settings?.offlineTanggalPembukaan && (
          <div className="mt-2 mb-10 relative z-10 flex flex-col items-center animate-in fade-in duration-1000 delay-300">
            <p className="text-[#FCD116] text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FCD116] rounded-full animate-ping"></span>
              Pendaftaran Dibuka Dalam:
            </p>
            <CountdownTimer
              targetDate={settings.offlineTanggalPembukaan}
              onExpire={() => {}} /* 🔥 KOSONGKAN FUNGSI INI */
            />
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4 relative z-10 animate-in fade-in duration-1000 delay-500">
          <a
            href="https://instagram.com/ikauii.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239] px-6 py-3 rounded-full flex items-center gap-2.5 transition-all font-black text-sm shadow-lg"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.067 3.282.153 4.769 1.64 4.922 4.922.055 1.266.067 1.646.067 4.849 0 3.204-.012 3.584-.067 4.85-.153 3.282-1.64 4.769-4.922 4.922-1.266.055-1.646.067-4.85.067-3.204 0-3.584-.012-4.85-.067-3.282-.153-4.769-1.64-4.922-4.922-.055-1.266-.067-1.646-.067-4.849 0-3.204.012-3.584.067-4.85.153-3.282 1.64-4.769 4.922-4.922 1.266-.055 1.646-.067 4.85-.067zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.61-6.98 5.928-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.2 4.358 2.618 6.78 5.928 6.98 1.28.058 1.688.072 4.947.072 3.259 0 3.667-.014 4.947-.072 4.358-.2 6.78-1.61 6.98-5.928.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-5.928-6.98-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            @ikauii.diy
          </a>
        </div>
      </div>
    );
  }

  if (showTutup) {
    return (
      <div className="min-h-screen bg-[#0B2239] font-sans flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {isDevMode && (
          <button
            onClick={() => setIsBypassed(true)}
            className="fixed bottom-4 left-4 z-50 bg-rose-600 text-white text-[10px] font-black px-4 py-2 rounded-full shadow-lg border-2 border-white animate-bounce hover:bg-rose-700"
          >
            ⚡ BYPASS DEV MODE
          </button>
        )}

        <div
          className="absolute inset-0 bg-cover bg-center grayscale-[30%]"
          style={{
            backgroundImage:
              "url('https://www.uii.ac.id/wp-content/uploads/2025/03/Gerbang-UII.jpg')",
          }}
        ></div>
        <div className="absolute inset-0 bg-[#0B2239]/90"></div>

        <div className="mb-6 flex flex-col items-center justify-center relative z-10">
          <div className="w-28 h-28 bg-white rounded-full p-5 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden border-4 border-[#FCD116]">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4 max-w-4xl leading-tight relative z-10">
          PENDAFTARAN RUNNING <br />
                  </h1>

        <p className="text-slate-300 text-sm md:text-base font-medium mb-10 max-w-2xl relative z-10 leading-relaxed">
          Sampai jumpa di garis start event IKA UII DIY.
        </p>

        <div className="flex flex-wrap justify-center gap-4 relative z-10">
          <a
            href="https://instagram.com/ikauii.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239] px-6 py-3 rounded-full flex items-center gap-2.5 transition-all font-black text-sm shadow-lg"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.067 3.282.153 4.769 1.64 4.922 4.922.055 1.266.067 1.646.067 4.849 0 3.204-.012 3.584-.067 4.85-.153 3.282-1.64 4.769-4.922 4.922-1.266.055-1.646.067-4.85.067-3.204 0-3.584-.012-4.85-.067-3.282-.153-4.769-1.64-4.922-4.922-.055-1.266-.067-1.646-.067-4.849 0-3.204.012-3.584.067-4.85.153-3.282 1.64-4.769 4.922-4.922 1.266-.055 1.646-.067 4.85-.067zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.61-6.98 5.928-.058 1.28-.072 1.688-.072 4.947s.014 3.667.072 4.947c.2 4.358 2.618 6.78 5.928 6.98 1.28.058 1.688.072 4.947.072 3.259 0 3.667-.014 4.947-.072 4.358-.2 6.78-1.61 6.98-5.928.058-1.28.072-1.688.072-4.947s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-5.928-6.98-1.28-.058-1.688-.072-4.947-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            @ikauii.diy
          </a>
        </div>
      </div>
    );
  }

  // 3. TAMPILAN NORMAL
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-[#FCD116] selection:text-[#0B2239] flex flex-col scroll-smooth relative">
      <NavbarPublic />

      {isBypassed && (
        <button
          onClick={() => setIsBypassed(false)}
          className="fixed bottom-4 left-4 z-50 text-[10px] font-black px-4 py-2 rounded-full shadow-lg border-2 border-white transition-all bg-rose-600 text-white animate-bounce hover:bg-rose-700"
        >
          MATIKAN BYPASS
        </button>
      )}

      <section className="relative pt-[160px] pb-20 md:pt-[200px] lg:pt-[240px] lg:pb-32 overflow-hidden min-h-[85vh] flex flex-col justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale-[20%]"
          style={{
            backgroundImage:
              "url('https://www.uii.ac.id/wp-content/uploads/2025/03/Gerbang-UII.jpg')",
          }}
        ></div>
        <div className="absolute inset-0 bg-[#0B2239]/90"></div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-20 text-center flex flex-col items-center w-full">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full mb-8 shadow-xl mt-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD116] animate-pulse"></span>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                  Official Website
                </span>
              </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 max-w-4xl leading-[1.1] drop-shadow-sm">
              UII{" "}
              <span className="text-[#FCD116] drop-shadow-md">Sehat</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-base md:text-xl text-slate-300 mb-8 max-w-2xl font-medium leading-relaxed mx-auto">
              Langkah kecil hari ini membawa energi besar untuk hidup yang
              lebih sehat, aktif, dan penuh semangat kebersamaan. Pilih
              kategori dan jadilah bagian dari perayaan sehat{" "}
              {settings?.offlineLocation || "Yogyakarta"} bersama keluarga
              besar IKA UII Daerah Istimewa Yogyakarta!
            </p>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12 w-full mt-8">
              <div className="bg-white/10 border border-white/10 backdrop-blur-md text-white rounded-2xl px-6 py-4 flex items-center justify-center gap-4 w-full md:w-auto shadow-xl">
                <svg
                  className="w-8 h-8 text-[#FCD116] shrink-0"
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
                      <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#FCD116] font-bold mb-0.5">
                        Lokasi Start / Finish
                      </p>
                      <p className="font-black text-sm md:text-base">
                        {settings?.offlineLocation || "Yogyakarta"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/10 border border-white/10 backdrop-blur-md text-white rounded-2xl px-6 py-4 flex items-center justify-center gap-4 w-full md:w-auto shadow-xl">
                    <svg
                      className="w-8 h-8 text-[#FCD116] shrink-0"
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
                      <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#FCD116] font-bold mb-0.5">
                        Waktu Pelaksanaan
                      </p>
                      <p className="font-black text-sm md:text-base">
                        {settings?.offlineDate
                          ? new Date(settings.offlineDate).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              },
                            )
                          : "-"}
                      </p>
                      <p className="text-xs text-slate-300 font-medium">
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
                    className="w-full sm:w-auto bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239] font-black px-10 py-4 md:px-12 md:py-5 rounded-full text-base md:text-lg transition-all shadow-2xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    Amankan Slot Sekarang &rarr;
                  </a>
                  <button
                    onClick={() => setIsTimelineModalOpen(true)}
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white font-black px-10 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg transition-all shadow-xl border border-white/20 backdrop-blur-sm transform hover:-translate-y-1 flex items-center justify-center gap-2"
                  >
                    Timeline
                  </button>
                </div>
              </ScrollReveal>

              <ScrollReveal delay={500}>
                <p className="text-[10px] md:text-xs text-slate-400 mt-6 font-bold tracking-wide">
                  *Kuota{" "}
                  {settings?.offlineQuota === 0 ? "∞" : settings?.offlineQuota}{" "}
                  peserta.
                </p>
              </ScrollReveal>
        </div>
      </section>

      {/* RACE PACK & FASILITAS SECTION */}
      <section className="py-16 md:py-24 bg-white w-full relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-16">
              <span className="text-xs font-bold text-[#0B2239] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                Fasilitas Peserta
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4">
                Race Pack & Fasilitas Eksklusif
              </h2>
              <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto mb-8">
                Setiap pendaftaran offline sudah termasuk perlengkapan lari
                premium yang akan menemani langkah Anda hingga ke garis finish.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* 1. Jersey */}
            <ScrollReveal delay={100}>
              <div className="bg-slate-50 rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                <div className="aspect-square bg-white rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative border border-slate-100">
                  <div className="absolute inset-0 bg-[#0B2239]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {settings?.urlJerseyOffline ? (
                    <img
                      src={settings.urlJerseyOffline}
                      alt="Jersey Pelari"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <svg
                        className="w-16 h-16 text-slate-300 mb-2 transform group-hover:scale-110 transition-transform duration-500"
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
                  dipakai di bawah sinar matahari.
                </p>
              </div>
            </ScrollReveal>

            {/* 2. Nomor BIB & Refreshment */}
            <ScrollReveal delay={200}>
              <div className="bg-slate-50 rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                <div className="aspect-square bg-white rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative border border-slate-100">
                  <div className="absolute inset-0 bg-[#0B2239]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="text-slate-300 flex flex-col items-center">
                    <svg
                      className="w-20 h-20 text-[#0B2239]/80 mb-2 transform group-hover:scale-110 transition-transform duration-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                      />
                    </svg>
                    <span className="font-bold text-xs md:text-sm text-slate-400">
                      BIB & Tiket Lari
                    </span>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-2 text-center md:text-left">
                  Nomor BIB & Refreshment
                </h3>
                <p className="text-slate-500 text-xs md:text-sm text-center md:text-left">
                  Dapatkan nomor dada eksklusif sebagai identitas pelari.
                  Nikmati juga fasilitas water station & refreshment selama
                  acara.
                </p>
              </div>
            </ScrollReveal>

            {/* 3. Medali */}
            <ScrollReveal delay={300}>
              <div className="bg-slate-50 rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
                <div className="aspect-square bg-white rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative border border-slate-100">
                  <div className="absolute inset-0 bg-[#FCD116]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {settings?.urlMedaliOffline ? (
                    <img
                      src={settings.urlMedaliOffline}
                      alt="Medali Finisher"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="text-slate-300 flex flex-col items-center">
                      <svg
                        className="w-16 h-16 text-slate-300 mb-2 transform group-hover:scale-110 transition-transform duration-500"
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
        className="py-16 md:py-24 bg-[#F8F9FA] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-24 border-t border-slate-200"
      >
        <ScrollReveal>
          <div className="text-center mb-12 md:mb-16">
            <span className="text-xs font-bold text-[#0B2239] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
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
              const isUnlimited = batasKuota === 0;
              const sisaKuota = isUnlimited
                ? "Tak Terbatas"
                : Math.max(0, batasKuota - terisi);
              const isSoldOut = !isUnlimited && sisaKuota <= 0;
              const persentase = isUnlimited
                ? 0
                : Math.min(100, (terisi / batasKuota) * 100);

              // --- EARLY BIRD LOGIC ---
              let activePrice = Number(pkg.harga);
              let isEarlyBirdActive = false;
              
              if (pkg.isEarlyBird) {
                const target = Number(pkg.earlyBirdTarget);
                const isUnderQuota = target > 0 ? terisi < target : true;
                const isBeforeEndDate = pkg.earlyBirdEndDate ? new Date() < new Date(pkg.earlyBirdEndDate) : true;
                
                if (isUnderQuota && isBeforeEndDate) {
                  isEarlyBirdActive = true;
                  activePrice = Number(pkg.earlyBirdHarga || pkg.harga);
                }
              }

              return (
                <ScrollReveal key={pkg.id} delay={index * 150}>
                  <div
                    className={`w-full h-full rounded-[2rem] p-6 border flex flex-col relative overflow-hidden transition-all ${isHighlight ? "bg-[#0B2239] border-[#0B2239] text-white shadow-2xl transform lg:-translate-y-4" : "bg-white border-slate-200 shadow-sm hover:shadow-xl"}`}
                  >
                    {!isHighlight && (
                      <div className="h-2 w-full bg-slate-200 absolute top-0 left-0"></div>
                    )}
                    {isHighlight && (
                      <div className="h-2 w-full bg-[#FCD116] absolute top-0 left-0"></div>
                    )}
                    
                    {/* Badge Early Bird */}
                    {isEarlyBirdActive && (
                      <div className="absolute top-5 right-0 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest rounded-l-full shadow-lg z-10 flex items-center gap-1.5 border-y border-l border-white/20">
                        <svg className="w-3 h-3 text-amber-200 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Promo Early Bird
                      </div>
                    )}

                    <div className="mb-6 mt-4">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${isHighlight ? "bg-white/10 text-[#FCD116]" : "bg-slate-100 text-slate-600"}`}
                      >
                        KATEGORI {pkg.jarak}
                      </span>
                    </div>

                    <h3
                      className={`text-xl md:text-2xl font-black mb-2 ${isHighlight ? "text-white" : "text-slate-800"}`}
                    >
                      {pkg.nama}
                    </h3>

                    {/* Sisa Kuota Space removed completely to avoid awkward blank gaps */}
                    {isSoldOut && (
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-rose-100 text-rose-600 rounded-md text-[11px] font-bold uppercase tracking-widest border border-rose-200">
                          Kuota Habis
                        </span>
                      </div>
                    )}

                    <div
                      className={`text-3xl md:text-4xl font-black mb-8 tracking-tight ${isHighlight ? "text-[#FCD116]" : "text-slate-900"}`}
                    >
                      {isEarlyBirdActive ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm line-through decoration-rose-500/50 decoration-2 font-bold text-slate-400">
                              Rp {Number(pkg.harga).toLocaleString("id-ID")}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-600 uppercase tracking-wider">
                              Save
                            </span>
                          </div>
                          <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600">
                            Rp {activePrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ) : (
                        `Rp ${activePrice.toLocaleString("id-ID")}`
                      )}
                    </div>

                    <ul className="space-y-3.5 mb-6">
                      {pkg.benefit &&
                        pkg.benefit
                          .split(",")
                          .map((item: string, i: number) => (
                            <li
                              key={i}
                              className={`flex items-start gap-3 text-xs md:text-sm font-semibold transition-colors duration-200 ${isHighlight ? "text-slate-200 hover:text-white" : "text-slate-600 hover:text-slate-900"}`}
                            >
                              <div className={`mt-0.5 rounded-full p-0.5 shrink-0 ${isHighlight ? "bg-white/10" : "bg-blue-50"}`}>
                                <svg
                                  className={`w-3.5 h-3.5 ${isHighlight ? "text-[#FCD116]" : "text-[#152B5B]"}`}
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              </div>
                              <span className="mt-0.5">{item.trim()}</span>
                            </li>
                          ))}
                    </ul>

                    {/* 🔥 FITUR CUSTOM MAPS & WAYPOINTS 🔥 */}
                    {pkg.polyline && (
                      <div className="mb-6 flex flex-col items-center w-full mt-auto">
                        <button
                          onClick={() => toggleMap(pkg.id)}
                          className={`w-full text-xs font-bold py-2.5 rounded-lg border transition-colors flex items-center justify-center gap-2 mb-3 ${isHighlight ? "bg-[#1A73E8] border-[#1A73E8] hover:bg-blue-600 text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
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
                              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                            />
                          </svg>
                          {expandedMaps.includes(pkg.id)
                            ? "Tutup Peta Rute"
                            : "Lihat Peta Rute & Titik Air"}
                        </button>

                        <div
                          className={`w-full overflow-hidden transition-all duration-500 ease-in-out ${expandedMaps.includes(pkg.id) ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
                        >
                          <div
                            className={`w-full h-[350px] rounded-xl overflow-hidden border relative ${isHighlight ? "bg-[#051324] border-white/10" : "bg-slate-100 border-slate-200"}`}
                          >
                            {expandedMaps.includes(pkg.id) && (
                              <EventMap
                                polyline={pkg.polyline}
                                waypoints={pkg.waypoints}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {!pkg.polyline && <div className="mt-auto"></div>}

                    {isSoldOut && !isBypassed ? (
                      <button
                        disabled
                        className="w-full text-center font-bold py-3.5 md:py-4 rounded-xl shadow-inner text-sm bg-rose-100 text-rose-500 cursor-not-allowed border border-rose-200 uppercase tracking-widest"
                      >
                        Habis Terjual
                      </button>
                    ) : (
                      <Link
                        href={`/run/daftar?paket=${pkg.id}${isWaitingRoom ? "&queue=true" : ""}`}
                        className={`w-full text-center font-bold py-3.5 md:py-4 rounded-xl transition-all shadow-md text-sm flex items-center justify-center gap-2 ${isWaitingRoom ? "bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239]" : isHighlight ? "bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239]" : "bg-[#0B2239] hover:bg-blue-900 text-white"}`}
                      >
                        {isWaitingRoom ? (
                          <>
                            <svg
                              className="w-5 h-5 animate-pulse"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>{" "}
                            Masuk Ruang Tunggu
                          </>
                        ) : (
                          <>
                            Daftar Kategori {pkg.jarak}{" "}
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
                          </>
                        )}
                      </Link>
                    )}
                  </div>
                </ScrollReveal>
              );
            })
          ) : (
            <div className="text-slate-500 font-bold py-10 col-span-full text-center bg-white rounded-2xl border border-slate-200">
              Paket lari offline belum tersedia dari Admin.
            </div>
          )}
        </div>
      </section>

      {/* SECTION SPONSOR */}
      {settings?.sponsorGroups && settings.sponsorGroups.length > 0 && (
        <section className="py-16 md:py-24 bg-white relative z-10 w-full overflow-hidden border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            {settings.sponsorGroups.map((group: any, idx: number) => {
              const visibleLogos = (group.logos || []).filter(
                (l: any) => !l.isHidden && l.url,
              );
              if (visibleLogos.length === 0) return null;
              const size = group.size || "medium";
              let titleClass = "text-xs text-slate-500 mb-8";
              let containerClass =
                "gap-8 md:gap-12 opacity-60 hover:opacity-100 grayscale hover:grayscale-0";
              let logoClass = "h-10 md:h-14";

              if (size === "large") {
                titleClass = "text-sm md:text-base text-[#0B2239] mb-12";
                containerClass = "gap-10 md:gap-20 grayscale-0 opacity-100";
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
                    {group.title && (
                      <h3
                        className={`font-black uppercase tracking-[0.3em] relative inline-block ${titleClass}`}
                      >
                        {group.title}
                        {size === "large" && (
                          <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#FCD116] rounded-full"></span>
                        )}
                      </h3>
                    )}
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
                          {logo.name && (
                            <div
                              className={`absolute left-1/2 -translate-x-1/2 bg-[#0B2239] text-white text-[9px] font-bold px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg ${size === "large" ? "-bottom-10" : "-bottom-8"}`}
                            >
                              {logo.name}
                              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0B2239] rotate-45"></div>
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

      {/* MODAL TIMELINE */}
      {isTimelineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-slate-50 px-6 py-5 flex justify-between items-center border-b border-slate-100">
              <h3 className="font-black text-[#0B2239] flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-[#1A73E8]"
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
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 flex items-center justify-center font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 sm:p-8">
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                <div className="relative pl-6">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#1A73E8] ring-4 ring-white"></span>
                  <p className="font-black text-slate-800 text-sm">
                    Pendaftaran Dibuka
                  </p>
                  <p className="text-xs text-[#1A73E8] font-medium mt-1">
                    {settings?.offlineTanggalPembukaan
                      ? new Date(
                          settings.offlineTanggalPembukaan,
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
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-400 ring-4 ring-white"></span>
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
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#FCD116] ring-4 ring-white"></span>
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

      <FooterPublic />
    </div>
  );
}

export default function OfflineRunLandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B2239] flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#0B2239] border-t-[#FCD116] rounded-full animate-spin"></div>
        </div>
      }
    >
      <OfflineRunLandingPageContent />
    </Suspense>
  );
}
