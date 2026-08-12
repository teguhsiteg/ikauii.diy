"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";

// --- ANIMASI SCROLL MULUS ---
const FadeInSection = ({
  children,
  delay = "0ms",
  direction = "up",
}: {
  children: React.ReactNode;
  delay?: string;
  direction?: "up" | "left" | "right";
}) => {
  const [isVisible, setVisible] = useState(false);
  const domRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 },
    );
    if (domRef.current) observer.observe(domRef.current);
    return () => {
      if (domRef.current) observer.unobserve(domRef.current);
    };
  }, []);

  let transformClass = "translate-y-12";
  if (direction === "left") transformClass = "-translate-x-12";
  if (direction === "right") transformClass = "translate-x-12";

  return (
    <div
      ref={domRef}
      style={{ transitionDelay: delay }}
      className={`transition-all duration-1000 ease-out transform ${isVisible ? "opacity-100 translate-y-0 translate-x-0" : `opacity-0 ${transformClass}`}`}
    >
      {children}
    </div>
  );
};

// --- COUNTDOWN TIMER ---
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) return;
    const interval = setInterval(() => {
      const distance = new Date(targetDate).getTime() - new Date().getTime();
      if (distance < 0) {
        clearInterval(interval);
        return;
      }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const Item = ({ val, label }: { val: number; label: string }) => (
    <div className="flex flex-col items-center justify-center bg-[#131A2A] border border-[#FFD700]/20 rounded-lg w-16 h-20 sm:w-24 sm:h-28 shadow-[0_0_15px_rgba(255,215,0,0.05)] hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:border-[#FFD700]/60 transition-all duration-500">
      <span className="text-2xl sm:text-5xl font-black text-[#FFD700] tracking-tighter">
        {val.toString().padStart(2, "0")}
      </span>
      <span className="text-[8px] sm:text-[10px] font-bold text-white uppercase tracking-[0.2em] mt-1 sm:mt-2">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex gap-2 sm:gap-3 justify-center md:justify-start">
      <Item val={timeLeft.days} label="Days" />
      <Item val={timeLeft.hours} label="Hours" />
      <Item val={timeLeft.minutes} label="Mins" />
      <Item val={timeLeft.seconds} label="Secs" />
    </div>
  );
};

// --- MAIN PAGE ---
export default function GemaLandingPage() {
  const [data, setData] = useState<any>(null);
  const [sponsorGroups, setSponsorGroups] = useState<any[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeFaq, setActiveFaq] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSambutanExpanded, setIsSambutanExpanded] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setProgress(30);
      // 🔥 FIX: Tarik data dari ruangan DB khusus EVENT GEMA
      const lpSnap = await getDoc(doc(db, "settings", "event_gema"));
      if (lpSnap.exists()) setData(lpSnap.data());

      setProgress(70);
      // Data sponsor tetap narik dari virtual_run jika diperlukan
      const vrSnap = await getDoc(doc(db, "settings", "virtual_run"));
      if (vrSnap.exists()) setSponsorGroups(vrSnap.data().sponsorGroups || []);

      setProgress(100);
    };
    fetchAll();
  }, []);

  if (!data)
    return (
      <div className="h-screen bg-[#0A0F1D] flex flex-col items-center justify-center text-[#FFD700] font-black tracking-widest text-xl">
        <div className="w-16 h-1 border-t-2 border-[#FFD700] animate-spin rounded-full mb-4"></div>
        LOADING STAGE...
      </div>
    );

  return (
    <div className="bg-[#0A0F1D] text-white overflow-x-hidden font-sans selection:bg-[#FFD700] selection:text-black pb-28 md:pb-0">
      {/* GLOBAL CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; width: 200%; animation: marquee 20s linear infinite; }
        html { scroll-behavior: smooth; }
        .safe-area-pb { padding-bottom: calc(env(safe-area-inset-bottom) + 1rem); }
      `,
        }}
      />

      {/* TOP LOADING BAR */}
      <div
        className="fixed top-0 left-0 h-1 bg-[#FFD700] z-[10000] transition-all duration-300 shadow-[0_0_10px_#FFD700]"
        style={{ width: `${progress}%`, opacity: progress === 100 ? 0 : 1 }}
      />

      {/* --- RESPONSIVE NAVBAR --- */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-[999] bg-[#0A0F1D]/80 backdrop-blur-xl border-b border-white/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="font-black text-xl tracking-widest text-white">
            GEMA <span className="text-[#FFD700]">UII</span>
          </div>
          <div className="flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300">
            <a href="#hero" className="hover:text-[#FFD700] transition-colors">
              Home
            </a>
            <a
              href="#lineup"
              className="hover:text-[#FFD700] transition-colors"
            >
              Line Up
            </a>
            <a href="#stars" className="hover:text-[#FFD700] transition-colors">
              Performers
            </a>
            <a href="#venue" className="hover:text-[#FFD700] transition-colors">
              Venue
            </a>
            <a href="#faq" className="hover:text-[#FFD700] transition-colors">
              FAQ
            </a>
          </div>
          <a
            href="#lineup"
            className="bg-[#FFD700] text-black px-6 py-2.5 font-black text-[11px] uppercase tracking-widest skew-x-[-10deg] hover:bg-white transition-colors"
          >
            <span className="skew-x-[10deg] block">Get Ticket</span>
          </a>
        </div>
      </nav>

      {/* Mobile Bottom App-Like Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[999] bg-[#0A0F1D]/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
        <div className="flex items-center justify-around h-20 px-4">
          <a
            href="#hero"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-[#FFD700] p-3"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Home
            </span>
          </a>
          <a
            href="#lineup"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-[#FFD700] p-3"
          >
            <svg
              className="w-6 h-6"
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
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Ticket
            </span>
          </a>

          <div className="relative -top-7 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="w-16 h-16 bg-[#FFD700] rounded-full flex items-center justify-center shadow-[0_0_25px_rgba(255,215,0,0.5)] border-4 border-[#0A0F1D]"
            >
              <svg
                className={`w-7 h-7 text-black transition-transform duration-300 ${isMobileMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>

          <a
            href="#stars"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-[#FFD700] p-3"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Stars
            </span>
          </a>
          <a
            href="#venue"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex flex-col items-center gap-1.5 text-slate-400 hover:text-[#FFD700] p-3"
          >
            <svg
              className="w-6 h-6"
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
            <span className="text-[10px] font-bold uppercase tracking-widest">
              Venue
            </span>
          </a>
        </div>

        <div
          className={`absolute bottom-24 left-4 right-4 bg-[#131A2A]/95 backdrop-blur-sm border border-white/10 rounded-2xl p-5 shadow-2xl transition-all duration-300 origin-bottom transform ${isMobileMenuOpen ? "scale-y-100 opacity-100" : "scale-y-0 opacity-0 pointer-events-none"}`}
        >
          <div className="grid grid-cols-2 gap-3 text-center">
            <a
              href="#timeline"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-white/5 py-3.5 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#FFD700] hover:text-black transition-colors"
            >
              Jadwal Acara
            </a>
            <a
              href="#merch"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-white/5 py-3.5 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#FFD700] hover:text-black transition-colors"
            >
              Racepack
            </a>
            <a
              href="#faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-white/5 py-3.5 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#FFD700] hover:text-black transition-colors"
            >
              FAQ
            </a>
            <a
              href="#guest"
              onClick={() => setIsMobileMenuOpen(false)}
              className="bg-[#FFD700]/20 text-[#FFD700] py-3.5 rounded-lg text-[11px] font-bold uppercase tracking-widest hover:bg-[#FFD700] hover:text-black transition-colors"
            >
              VIP Message
            </a>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section
        id="hero"
        className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center pt-10 md:pt-28 pb-10 overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-top opacity-30 grayscale mix-blend-luminosity scale-105 animate-[pulse_10s_infinite]"
          style={{
            backgroundImage: `url(${data.heroBgUrl || "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80"})`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1D]/60 via-[#0A0F1D]/80 to-[#0A0F1D]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-[#1A3A8F]/30 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-12 mt-10 pb-16 md:pb-0">
          <div className="flex-1 text-center md:text-left">
            <FadeInSection direction="left">
              <div className="inline-block bg-[#FFD700] text-black text-[9px] sm:text-xs font-black px-4 py-1 mb-6 uppercase tracking-[0.4em] skew-x-[-10deg]">
                DPW IKA UII DIY PRESENTS
              </div>
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black mb-4 tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                {(data.heroTitle || "GEMA UII")
                  .split(" ")
                  .map((word: string, i: number) => (
                    <span
                      key={i}
                      className={
                        i % 2 !== 0
                          ? "text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.4)]"
                          : ""
                      }
                    >
                      {word}{" "}
                    </span>
                  ))}
              </h1>
              <p className="text-base sm:text-xl text-slate-400 max-w-xl mx-auto md:mx-0 mb-10 font-medium leading-relaxed">
                {data.heroSubtitle ||
                  "Merajut kembali memori, merayakan persaudaraan."}
              </p>
              <CountdownTimer targetDate={data.eventDate} />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* --- RUNNING TEXT MARQUEE --- */}
      <div className="bg-[#FFD700] text-black py-3 sm:py-4 overflow-hidden shadow-[0_0_20px_rgba(255,215,0,0.2)] relative z-20 border-y-2 border-white/20">
        <div className="animate-marquee flex items-center whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center">
              <span className="text-xs sm:text-lg font-black tracking-[0.3em] uppercase mx-4 sm:mx-8">
                REUNI AKBAR
              </span>
              <span className="text-black/50 mx-2">✦</span>
              <span className="text-xs sm:text-lg font-black tracking-[0.3em] uppercase mx-4 sm:mx-8">
                FUN RUN
              </span>
              <span className="text-black/50 mx-2">✦</span>
              <span className="text-xs sm:text-lg font-black tracking-[0.3em] uppercase mx-4 sm:mx-8">
                VIRTUAL RUN
              </span>
              <span className="text-black/50 mx-2">✦</span>
              <span className="text-xs sm:text-lg font-black tracking-[0.3em] uppercase mx-4 sm:mx-8">
                KONSER PUNCAK
              </span>
              <span className="text-black/50 mx-2">✦</span>
            </div>
          ))}
        </div>
      </div>

      {/* --- 4 PILAR: CHOOSE YOUR STAGE --- */}
      <section
        id="lineup"
        className="py-24 sm:py-32 px-6 relative bg-gradient-to-b from-[#0A0F1D] to-[#111827]"
      >
        <div className="max-w-7xl mx-auto">
          <FadeInSection>
            <div className="text-center mb-16 border-b border-white/10 pb-10">
              <h2 className="text-[#FFD700] font-black tracking-[0.4em] text-xs mb-2">
                OFFICIAL LINE UP
              </h2>
              <h3 className="text-4xl sm:text-6xl font-black text-white">
                CHOOSE YOUR STAGE
              </h3>
              <p className="text-slate-400 mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
                Pilih panggung partisipasi Anda dan jadilah bagian dari keluarga
                besar yang merayakan momen bersejarah ini.
              </p>
            </div>
          </FadeInSection>

          {/* GRID 4 KOTAK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 1. REUNI AKBAR */}
            <FadeInSection delay="0ms">
              <div className="group bg-[#0E1526] border border-white/10 hover:border-[#FFD700] rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-3 h-full flex flex-col shadow-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                <div className="h-40 bg-slate-800/50 overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0 group-hover:scale-110 duration-700"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80')",
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1526] to-transparent"></div>
                  <div className="absolute bottom-3 left-5 text-[#FFD700] font-black text-2xl italic">
                    01.
                  </div>
                </div>
                <div className="p-6 pt-2 flex flex-col flex-1 relative z-10">
                  <h4 className="text-xl font-black text-white mb-2 tracking-wide uppercase">
                    REUNI AKBAR
                  </h4>
                  <p className="text-slate-400 text-xs mb-6 flex-1 leading-relaxed">
                    Temu kangen terbesar lintas angkatan. Merajut kembali memori
                    indah di kampus tercinta.
                  </p>
                  <Link
                    href={data.linkReuni || "#"}
                    className={`w-full block text-center border-2 font-black uppercase tracking-widest py-3 text-[10px] sm:text-xs transition-colors skew-x-[-10deg] ${data.linkReuni ? "border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black" : "border-white/20 text-white/50 cursor-not-allowed"}`}
                  >
                    <span className="inline-block skew-x-[10deg]">
                      {data.linkReuni ? "Get Ticket" : "Coming Soon"}
                    </span>
                  </Link>
                </div>
              </div>
            </FadeInSection>

            {/* 2. FUN RUN */}
            <FadeInSection delay="100ms">
              <div className="group bg-[#0E1526] border border-white/10 hover:border-[#FFD700] rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-3 h-full flex flex-col relative shadow-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                {data.funRunHighlight && (
                  <div className="absolute top-4 right-[-35px] bg-[#D93025] text-white text-[8px] sm:text-[9px] font-black py-1 px-10 rotate-45 z-10 shadow-lg uppercase tracking-widest">
                    {data.funRunHighlight}
                  </div>
                )}
                <div className="h-40 bg-[#1A3A8F]/30 overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0 group-hover:scale-110 duration-700"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&q=80')",
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1526] to-transparent"></div>
                  <div className="absolute bottom-3 left-5 text-[#FFD700] font-black text-2xl italic">
                    02.
                  </div>
                </div>
                <div className="p-6 pt-2 flex flex-col flex-1 relative z-10">
                  <h4 className="text-xl font-black text-white mb-2 tracking-wide uppercase">
                    FUN RUN{" "}
                    <span className="text-slate-500 text-xs font-normal">
                      Offline
                    </span>
                  </h4>
                  <p className="text-slate-400 text-xs mb-6 flex-1 leading-relaxed">
                    Berlari bersama menyusuri rute nostalgia. Sehat bersama,
                    bawa pulang hadiahnya.
                  </p>
                  <Link
                    href={data.linkFunRun || "#"}
                    className={`w-full block text-center font-black uppercase tracking-widest py-3 text-[10px] sm:text-xs transition-colors skew-x-[-10deg] ${data.linkFunRun ? "bg-[#FFD700] text-black hover:bg-white" : "border-2 border-white/20 text-white/50 cursor-not-allowed"}`}
                  >
                    <span className="inline-block skew-x-[10deg]">
                      {data.linkFunRun ? "Get Ticket" : "Coming Soon"}
                    </span>
                  </Link>
                </div>
              </div>
            </FadeInSection>

            {/* 3. VIRTUAL RUN */}
            <FadeInSection delay="200ms">
              <div className="group bg-[#0E1526] border border-white/10 hover:border-[#FFD700] rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-3 h-full flex flex-col shadow-lg hover:shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                <div className="h-40 bg-emerald-900/30 overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0 group-hover:scale-110 duration-700"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80')",
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1526] to-transparent"></div>
                  <div className="absolute bottom-3 left-5 text-[#FFD700] font-black text-2xl italic">
                    03.
                  </div>
                </div>
                <div className="p-6 pt-2 flex flex-col flex-1 relative z-10">
                  <h4 className="text-xl font-black text-white mb-2 tracking-wide uppercase">
                    VIRTUAL RUN{" "}
                    <span className="text-slate-500 text-xs font-normal">
                      Global
                    </span>
                  </h4>
                  <p className="text-slate-400 text-xs mb-6 flex-1 leading-relaxed">
                    Jarak bukan halangan. Lari dari mana saja dan dapatkan
                    medali kebanggaan almamater.
                  </p>
                  <Link
                    href={data.linkVirtualRun || "#"}
                    className={`w-full block text-center font-black uppercase tracking-widest py-3 text-[10px] sm:text-xs transition-colors skew-x-[-10deg] ${data.linkVirtualRun ? "border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black" : "border-2 border-white/20 text-white/50 cursor-not-allowed"}`}
                  >
                    <span className="inline-block skew-x-[10deg]">
                      {data.linkVirtualRun ? "Register" : "Coming Soon"}
                    </span>
                  </Link>
                </div>
              </div>
            </FadeInSection>

            {/* 4. KONSER PUNCAK */}
            <FadeInSection delay="300ms">
              <div className="group bg-[#0E1526] border border-[#FFD700]/30 hover:border-[#FFD700] rounded-xl overflow-hidden transition-all duration-500 hover:-translate-y-3 h-full flex flex-col relative shadow-[0_0_25px_rgba(255,215,0,0.1)] hover:shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                {data.concertHighlight && (
                  <div className="absolute top-3 right-3 bg-[#FFD700] text-black text-[8px] sm:text-[9px] font-black py-1 px-2 rounded z-10 uppercase tracking-widest">
                    {data.concertHighlight}
                  </div>
                )}
                <div className="h-40 bg-purple-900/30 overflow-hidden relative">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:opacity-60 transition-opacity grayscale group-hover:grayscale-0 group-hover:scale-110 duration-700"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80')",
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E1526] to-transparent"></div>
                  <div className="absolute bottom-3 left-5 text-[#FFD700] font-black text-2xl italic">
                    04.
                  </div>
                </div>
                <div className="p-6 pt-2 flex flex-col flex-1 relative z-10">
                  <h4 className="text-xl font-black text-[#FFD700] mb-2 tracking-wide uppercase">
                    MUSIC CONCERT
                  </h4>
                  <p className="text-slate-400 text-xs mb-6 flex-1 leading-relaxed">
                    Malam puncak penuh euforia bersama Guest Star ternama.
                    Spesial tertutup untuk Keluarga Besar.
                  </p>
                  <Link
                    href={data.linkKonser || "#"}
                    className={`w-full block text-center font-black uppercase tracking-widest py-3 text-[10px] sm:text-xs transition-colors skew-x-[-10deg] ${data.linkKonser ? "bg-white text-black hover:bg-slate-200" : "border-2 border-white/20 text-white/50 cursor-not-allowed"}`}
                  >
                    <span className="inline-block skew-x-[10deg]">
                      {data.linkKonser ? "Get Ticket" : "Coming Soon"}
                    </span>
                  </Link>
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* --- GUEST STARS & PERFORMERS (HYPE STICKER STYLE) --- */}
      {data.guestStars && data.guestStars.length > 0 && (
        <section
          id="stars"
          className="py-24 px-6 bg-[#111827] relative border-y border-white/5 overflow-hidden"
        >
          {/* Efek Lampu Latar Panggung */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-[#FFD700]/5 blur-[150px] pointer-events-none"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <FadeInSection>
              <div className="text-center mb-24">
                <h2 className="text-[#FFD700] font-black tracking-[0.4em] text-xs mb-2">
                  OFFICIAL PERFORMERS
                </h2>
                <h3 className="text-4xl sm:text-5xl font-black text-white uppercase">
                  PERFORMERS
                </h3>
              </div>
            </FadeInSection>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
              {data.guestStars.map((guest: any, idx: number) => {
                // Bergantian miring ke kiri dan kanan biar natural kayak ditempel manual
                const rotateClass = idx % 2 === 0 ? "rotate-3" : "-rotate-3";

                return (
                  <FadeInSection key={guest.id} delay={`${idx * 100}ms`}>
                    <div
                      className={`group relative transform transition-all duration-500 hover:scale-105 hover:z-20 hover:rotate-0 ${rotateClass} cursor-pointer`}
                    >
                      {/* Bingkai Stiker Putih */}
                      <div className="p-3 bg-white rounded-xl shadow-[8px_8px_0px_rgba(255,215,0,0.8),0_20px_40px_rgba(0,0,0,0.6)]">
                        <div className="relative overflow-hidden rounded-md aspect-[3/4] shadow-inner">
                          <img
                            src={
                              guest.imageUrl ||
                              "https://via.placeholder.com/400x600/0E1526/FFD700?text=PERFORMER"
                            }
                            alt={guest.name}
                            // Foto Jelas Full Color, membesar saat di-hover
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                        </div>
                      </div>

                      {/* Badge Nama (Nempel/Overlap di bawah stiker) */}
                      <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-[#0A0F1D] border-2 border-[#FFD700] p-4 rounded-xl shadow-2xl group-hover:-translate-y-2 transition-transform duration-300">
                        <div className="text-[#FFD700] font-bold text-[9px] uppercase tracking-[0.3em] mb-1">
                          {guest.role}
                        </div>
                        <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase leading-none">
                          {guest.name}
                        </h4>
                      </div>
                    </div>
                  </FadeInSection>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 🔥 --- VIP MESSAGE (THE PORTRAIT STICKER AT TOP) --- 🔥 */}
      {data.sambutanText && (
        <section
          id="guest"
          className="py-24 px-6 relative border-y border-white/5 bg-gradient-to-b from-[#0A0F1D] to-[#050810] overflow-hidden pb-40 md:pb-28"
        >
          {/* Glow Effect Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#1A3A8F]/10 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="max-w-5xl mx-auto relative z-10 pt-16 md:pt-0">
            <FadeInSection>
              <div className="text-center mb-16 md:mb-20 relative z-20">
                <h2 className="text-[#FFD700] font-black tracking-[0.4em] text-xs mb-2">
                  KEYNOTE SPEAKER
                </h2>
                <h3 className="text-4xl sm:text-5xl font-black text-white uppercase">
                  VIP MESSAGE
                </h3>
              </div>
            </FadeInSection>

            {/* Container: relative biar absolute positioning foto di desktop rapi */}
            <div className="relative md:pt-16">
              {/* --- FOTO STIKER (NEMPEL DI ATAS) --- */}
              {data.sambutanImageUrl && (
                <FadeInSection delay="100ms" direction="up">
                  {/* Mobile: relative, order first. md+: absolute, positioned HIGH */}
                  <div className="order-1 relative w-64 md:w-80 md:absolute md:-left-12 md:-top-24 z-30 transform rotate-3 md:-rotate-3 group hover:rotate-0 hover:scale-105 transition-all duration-500 mb-[-50px] md:mb-0 mx-auto md:mx-0">
                    {/* White border paper sticker effect with strong shadow */}
                    <div className="p-3 bg-white rounded-xl shadow-[10px_10px_0px_rgba(255,215,0,0.8),0_15px_40px_rgba(0,0,0,0.6)]">
                      <img
                        src={data.sambutanImageUrl}
                        alt="Tokoh Utama"
                        className="relative w-full h-auto aspect-[3/4] object-cover rounded-md shadow-inner"
                      />
                      {/* Label detail */}
                      <div className="absolute bottom-2 right-2 bg-slate-900/60 backdrop-blur-sm text-[#FFD700] font-bold text-[9px] px-3 py-1 rounded-md tracking-widest uppercase">
                        IKA UII DIY
                      </div>
                    </div>
                  </div>
                </FadeInSection>
              )}

              {/* --- AREA TEKS (OVERLAP OLEH FOTO ATAS) --- */}
              <div
                className={`order-2 w-full ${data.sambutanImageUrl ? "z-10 pt-[70px] md:pt-10 md:pl-64 lg:pl-72" : "text-center"}`}
              >
                <FadeInSection delay="300ms" direction="up">
                  <div className="bg-[#0E1526]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl min-h-[300px] flex flex-col justify-center">
                    {/* Quote icon detail */}
                    <div className="absolute -top-10 -right-4 text-[180px] text-white/5 font-serif leading-none pointer-events-none rotate-6">
                      “
                    </div>

                    <h3 className="text-2xl sm:text-4xl font-black text-white mb-6 tracking-tight leading-tight uppercase relative z-10">
                      {data.sambutanTitle || "Sambutan"}
                    </h3>

                    <div className="relative z-10 text-slate-300 text-sm sm:text-base leading-relaxed font-medium italic">
                      {/* Logika Read More (Limit 300 karakter) */}
                      {isSambutanExpanded
                        ? `"${data.sambutanText}"`
                        : `"${data.sambutanText.substring(0, 300)}${data.sambutanText.length > 300 ? "..." : ""}"`}

                      {/* Tombol Toggle */}
                      {data.sambutanText.length > 300 && (
                        <button
                          onClick={() =>
                            setIsSambutanExpanded(!isSambutanExpanded)
                          }
                          className="block mt-6 text-[#FFD700] font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:text-white transition-colors border-b border-[#FFD700]/30 hover:border-white pb-1"
                        >
                          {isSambutanExpanded
                            ? "Tutup Pesan"
                            : "Baca Selengkapnya"}
                        </button>
                      )}
                    </div>
                  </div>
                </FadeInSection>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* --- VENUE & RUTE --- */}
      <section id="venue" className="py-32 px-6 relative bg-[#0A0F1D]">
        <div className="max-w-7xl mx-auto text-center mb-16 relative z-10">
          <FadeInSection>
            <h2 className="text-[#FFD700] font-black tracking-[0.4em] text-xs mb-2">
              LOCATION MAP
            </h2>
            <h3 className="text-4xl sm:text-5xl font-black text-white">
              VENUE & RUN ROUTE
            </h3>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
              Kenali lokasi parkir, panggung utama, dan rute lari Anda untuk
              kenyamanan saat hari pelaksanaan.
            </p>
          </FadeInSection>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 pb-16 md:pb-0">
          {data.venueImageUrl ? (
            <FadeInSection delay="0ms">
              <div className="bg-[#0E1526] p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl group transition-all duration-500 hover:border-[#FFD700]/30 hover:shadow-[0_0_40px_rgba(255,215,0,0.1)]">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="font-bold text-white tracking-widest text-xs sm:text-sm uppercase">
                    <span className="text-[#FFD700]">01.</span> DENAH VENUE
                  </h4>
                </div>
                <div className="rounded-2xl overflow-hidden relative border border-white/5">
                  <img
                    src={data.venueImageUrl}
                    alt="Layout Venue"
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </FadeInSection>
          ) : null}

          {data.routeMapUrl ? (
            <FadeInSection delay="200ms">
              <div className="bg-[#0E1526] p-4 sm:p-6 rounded-3xl border border-white/10 shadow-2xl group transition-all duration-500 hover:border-[#FFD700]/30 hover:shadow-[0_0_40px_rgba(255,215,0,0.1)]">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h4 className="font-bold text-white tracking-widest text-xs sm:text-sm uppercase">
                    <span className="text-[#FFD700]">02.</span> RUTE LARI
                    (OFFLINE)
                  </h4>
                </div>
                <div className="rounded-2xl overflow-hidden relative border border-white/5">
                  <img
                    src={data.routeMapUrl}
                    alt="Peta Rute"
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              </div>
            </FadeInSection>
          ) : null}
        </div>
      </section>

      {/* --- RACEPACK & TWIBBON ZONE --- */}
      <section
        id="merch"
        className="py-24 bg-[#111827] relative border-y border-white/5 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1A3A8F]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="space-y-8 text-center lg:text-left relative z-10">
            <FadeInSection direction="left">
              <h2 className="text-[#FFD700] font-black tracking-[0.4em] text-xs mb-2">
                OFFICIAL MERCHANDISE
              </h2>
              <h3 className="text-4xl font-black text-white mb-6 uppercase">
                EXCLUSIVE RACEPACK
              </h3>
              <p className="text-slate-400 leading-relaxed mb-8 text-sm sm:text-base">
                {data.racepackDescription ||
                  "Setiap pelari akan mendapatkan Jersey Eksklusif, Medali Finisher, dan Nomor Dada (BIB)."}
              </p>
              <img
                src={
                  data.racepackImageUrl ||
                  "https://via.placeholder.com/600x400/0E1526/FFD700?text=RACEPACK"
                }
                alt="Racepack"
                className="rounded-2xl w-full border border-white/10 mx-auto shadow-2xl transition-transform duration-500 hover:scale-105"
              />
            </FadeInSection>
          </div>

          {data.twibbonUrl ? (
            <div className="bg-gradient-to-br from-[#1A3A8F] to-[#0A0F1D] p-8 sm:p-12 rounded-[2.5rem] border border-blue-500/30 text-center relative overflow-hidden mt-8 lg:mt-0 shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
              <FadeInSection direction="right">
                <div className="relative z-10">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_#FFD700]">
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-black"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight uppercase">
                    JOIN THE HYPE!
                  </h3>
                  <p className="text-blue-200 mb-10 font-medium text-sm sm:text-base leading-relaxed">
                    Buktikan partisipasi Anda! Pasang foto terbaik di bingkai
                    resmi Gema UII 2026 dan bagikan ke media sosial.
                  </p>
                  <a
                    href={data.twibbonUrl}
                    target="_blank"
                    className="inline-block bg-[#FFD700] text-black font-black uppercase tracking-widest px-8 py-4 text-[10px] sm:text-sm hover:bg-white transition-all skew-x-[-10deg] shadow-[0_5px_0px_rgba(255,215,0,0.5)] active:translate-y-1 active:shadow-none"
                  >
                    <span className="inline-block skew-x-[10deg]">
                      Pasang Twibbon
                    </span>
                  </a>
                </div>
              </FadeInSection>
            </div>
          ) : null}
        </div>
      </section>

      {/* --- TIMELINE (STAGE SCHEDULE) --- */}
      <section id="timeline" className="py-24 px-6 bg-[#0A0F1D]">
        <div className="max-w-4xl mx-auto">
          <FadeInSection>
            <h2 className="text-[#FFD700] font-black tracking-[0.4em] text-xs mb-2 text-center">
              RUNDOWN
            </h2>
            <h3 className="text-4xl sm:text-5xl font-black text-white text-center mb-16 uppercase">
              EVENT SCHEDULE
            </h3>
          </FadeInSection>

          <div className="space-y-5">
            {(data.timeline || []).map((item: any, idx: number) => (
              <FadeInSection key={item.id} delay={`${idx * 100}ms`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 sm:p-6 bg-[#0E1526] border-l-4 border-l-white/10 hover:border-l-[#FFD700] hover:bg-[#131A2A] rounded-r-xl transition-all group gap-3 sm:gap-4 shadow-lg hover:shadow-[0_0_20px_rgba(255,215,0,0.05)]">
                  <div className="w-full sm:w-1/4">
                    <span className="text-[#FFD700] font-black text-base sm:text-lg block tracking-tight">
                      {item.date}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#FFD700] transition-colors">
                      {item.title}
                    </h4>
                    {item.description && (
                      <p className="text-slate-500 mt-1 text-[11px] sm:text-xs leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* --- FAQ --- */}
      <section
        id="faq"
        className="py-32 px-6 bg-[#111827] border-t border-white/5 relative overflow-hidden"
      >
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* Kontainer diperlebar menjadi max-w-6xl untuk 2 kolom */}
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeInSection>
            <h2 className="text-[#FFD700] font-black tracking-[0.4em] text-xs mb-2 text-center">
              NEED HELP?
            </h2>
            <h3 className="text-4xl font-black text-white text-center mb-16 uppercase">
              FAQ
            </h3>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Kolom Kiri (Index Genap: 0, 2, 4...) */}
            <div className="space-y-4">
              {(data.faqs || [])
                .filter((_: any, i: number) => i % 2 === 0)
                .map((faq: any) => (
                  <div
                    key={faq.id}
                    className="bg-[#0A0F1D] border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all hover:border-white/20"
                  >
                    <button
                      onClick={() =>
                        setActiveFaq(activeFaq === faq.id ? null : faq.id)
                      }
                      className="w-full p-5 sm:p-6 text-left font-bold text-white flex justify-between items-center hover:text-[#FFD700] transition-colors text-sm sm:text-base"
                    >
                      {faq.q}{" "}
                      <span className="text-[#FFD700] text-2xl shrink-0 ml-4 font-mono">
                        {activeFaq === faq.id ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === faq.id && (
                      <div className="px-5 sm:px-6 pb-6 text-slate-400 text-xs sm:text-sm leading-relaxed animate-in fade-in slide-in-from-top-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
            </div>

            {/* Kolom Kanan (Index Ganjil: 1, 3, 5...) */}
            <div className="space-y-4">
              {(data.faqs || [])
                .filter((_: any, i: number) => i % 2 !== 0)
                .map((faq: any) => (
                  <div
                    key={faq.id}
                    className="bg-[#0A0F1D] border border-white/10 rounded-xl overflow-hidden shadow-lg transition-all hover:border-white/20"
                  >
                    <button
                      onClick={() =>
                        setActiveFaq(activeFaq === faq.id ? null : faq.id)
                      }
                      className="w-full p-5 sm:p-6 text-left font-bold text-white flex justify-between items-center hover:text-[#FFD700] transition-colors text-sm sm:text-base"
                    >
                      {faq.q}{" "}
                      <span className="text-[#FFD700] text-2xl shrink-0 ml-4 font-mono">
                        {activeFaq === faq.id ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === faq.id && (
                      <div className="px-5 sm:px-6 pb-6 text-slate-400 text-xs sm:text-sm leading-relaxed animate-in fade-in slide-in-from-top-2">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- SPONSOR --- */}
      {sponsorGroups && sponsorGroups.length > 0 && (
        <section className="py-24 px-6 bg-[#0A0F1D] border-t border-white/10 text-center relative overflow-hidden pb-36 md:pb-24">
          <div className="max-w-6xl mx-auto space-y-16 relative z-10">
            <FadeInSection>
              <h2 className="text-[10px] sm:text-xs font-black text-slate-500 uppercase tracking-[0.5em] mb-4">
                SUPPORTED BY
              </h2>
            </FadeInSection>

            {sponsorGroups.map((group, idx) => {
              const activeLogos =
                group.logos?.filter(
                  (l: any) => !l.isHidden && l.url && l.url.trim() !== "",
                ) || [];
              if (activeLogos.length === 0) return null;

              let imgClass = "h-8 sm:h-12";
              if (group.size === "large") imgClass = "h-14 sm:h-24";
              if (group.size === "medium") imgClass = "h-10 sm:h-16";

              return (
                <FadeInSection key={group.id} delay={`${idx * 150}ms`}>
                  <div className="space-y-6 pb-6 border-b border-white/5 last:border-none">
                    <h3 className="text-[9px] sm:text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                      {group.title}
                    </h3>
                    <div className="flex flex-wrap justify-center items-center gap-6 sm:gap-14">
                      {activeLogos.map((logo: any) => (
                        <img
                          key={logo.id}
                          src={logo.url}
                          alt={logo.name || "Sponsor"}
                          title={logo.name}
                          className={`${imgClass} w-auto grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500 object-contain hover:scale-110 drop-shadow-md`}
                        />
                      ))}
                    </div>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </section>
      )}

      {/* --- FOOTER --- */}
      <footer className="bg-[#050810] py-16 sm:py-20 px-6 text-center sm:text-left border-t border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter mb-3">
              TETAP <span className="text-[#FFD700]">TERHUBUNG!</span>
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-sm mx-auto sm:mx-0 leading-relaxed">
              Follow Instagram kami untuk informasi pengambilan Racepack & info
              terbaru Gema UII.
            </p>
          </div>
          <a
            href="https://instagram.com/ikauii.diy"
            target="_blank"
            className="bg-[#FFD700] text-black font-black px-8 py-3.5 sm:px-10 sm:py-4 uppercase tracking-widest text-[10px] sm:text-sm flex items-center gap-3 hover:bg-white transition-colors skew-x-[-10deg] shadow-[0_5px_0px_rgba(255,215,0,0.4)]"
          >
            <span className="skew-x-[10deg]">FOLLOW INSTAGRAM</span>
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 skew-x-[10deg]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </div>

        <div className="max-w-7xl mx-auto mt-16 sm:mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-[9px] sm:text-xs font-bold text-slate-600 uppercase tracking-widest">
          <p>
            &copy; {new Date().getFullYear()} DPW IKA UII DIY. SISTEM
            TERPROTEKSI.
          </p>
          <p className="text-slate-700">GEMA UII YOGYAKARTA</p>
        </div>
      </footer>
    </div>
  );
}
