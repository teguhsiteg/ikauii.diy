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
  onSnapshot,
} from "firebase/firestore";
import Link from "next/link";
import VirtualRunNavbar from "@/components/virtual-run/VirtualRunNavbar";
import VirtualRunFooter from "@/components/virtual-run/VirtualRunFooter";
import {
  MapPin,
  Calendar,
  Clock,
  Shirt,
  Medal,
  Activity,
  Building2,
  Mountain,
  Home,
  Package,
  Trophy,
  User,
  Sparkles,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

// --- KOMPONEN ANIMASI SCROLL REVEAL (PREMIUM & SMOOTH) ---
const ScrollReveal = ({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
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
      className={`transition-all duration-700 ease-out ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
};

export default function VirtualRunLandingPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number } | null>(
    null,
  );
  const [isWaitingToOpen, setIsWaitingToOpen] = useState(false);

  // --- STATE STATISTIK GLOBAL ---
  const [totalDonasi, setTotalDonasi] = useState(0);
  const [totalPeserta, setTotalPeserta] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [packageCounts, setPackageCounts] = useState<{ [key: string]: number }>(
    {},
  );

  // --- STATE DETEKSI USER LOGIN ---
  const [loggedInParticipant, setLoggedInParticipant] = useState<any>(null);

  // --- AMBIL DATA SETTING, STATISTIK & SESI SECARA REALTIME ---
  useEffect(() => {
    // 1. Settings Realtime
    const unsubSettings = onSnapshot(
      doc(db, "settings", "virtual_run"),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn("Gagal listen settings:", err);
        setIsLoading(false);
      }
    );

    // State penampung sementara untuk gabungan stats
    let vrPesertaCount = 0;
    let vrDonasiTotal = 0;
    let offlinePesertaCount = 0;
    let offlineDonasiTotal = 0;

    const updateTotals = () => {
      setTotalPeserta(vrPesertaCount + offlinePesertaCount);
      setTotalDonasi(vrDonasiTotal + offlineDonasiTotal);
    };

    // 2. Realtime VR Participants
    const unsubVR = onSnapshot(
      collection(db, "vr_participants"),
      (snap) => {
        vrPesertaCount = snap.size;
        let dSum = 0;
        const counts: { [key: string]: number } = {};

        snap.forEach((doc) => {
          const data = doc.data();
          const d = Number(data.nominalDonasi || data.donasi || 0);
          if (data.statusPembayaran === "Lunas" || d > 0) {
            dSum += d;
          }
          const pkgName = data.paket;
          if (pkgName) {
            counts[pkgName] = (counts[pkgName] || 0) + 1;
          }
        });

        vrDonasiTotal = dSum;
        setPackageCounts(counts);
        updateTotals();
      },
      (err) => {
        console.warn("Gagal listen vr_participants:", err);
      }
    );

    // 3. Realtime Offline Participants (Jika ada donasi offline)
    const unsubOffline = onSnapshot(
      collection(db, "offline_participants"),
      (snap) => {
        offlinePesertaCount = snap.size;
        let dSum = 0;
        snap.forEach((doc) => {
          const data = doc.data();
          const d = Number(data.nominalDonasi || data.donasi || 0);
          if (data.statusPembayaran === "Lunas" || d > 0) {
            dSum += d;
          }
        });
        offlineDonasiTotal = dSum;
        updateTotals();
      },
      (err) => {
        // Offline participants opsional
      }
    );

    // 4. Realtime Submissions (Total Jarak KM)
    const unsubSub = onSnapshot(
      collection(db, "vr_submissions"),
      (snap) => {
        let tKm = 0;
        snap.forEach((doc) => {
          const data = doc.data();
          const status = String(data.status || "").toLowerCase();
          if (status === "approved" || status === "disetujui" || !data.status) {
            tKm += Number(data.jarakKm || data.km || data.jarak || 0);
          }
        });
        setTotalKm(tKm);
      },
      (err) => {
        console.warn("Gagal listen vr_submissions:", err);
      }
    );

    // 5. Cek Sesi User
    try {
      const savedEmail = localStorage.getItem("vr_user_email");
      if (savedEmail) {
        const qUser = query(
          collection(db, "vr_participants"),
          where("email", "==", savedEmail),
        );
        getDocs(qUser).then((userSnap) => {
          if (!userSnap.empty) {
            const userRecords = userSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            userRecords.sort((a: any, b: any) => {
              const timeA = new Date(
                a.waktuDaftar || a.createdAt || a.tanggalDaftar || 0,
              ).getTime();
              const timeB = new Date(
                b.waktuDaftar || b.createdAt || b.tanggalDaftar || 0,
              ).getTime();
              return timeB - timeA;
            });
            setLoggedInParticipant(userRecords[0]);
          }
        }).catch((e) => console.warn("User session check:", e));
      }
    } catch (err) {
      // ignore
    }

    return () => {
      unsubSettings();
      unsubVR();
      unsubOffline();
      unsubSub();
    };
  }, []);

  // Helper format donasi
  const formatDonasi = (amount: number) => {
    if (!amount || amount === 0) return "Rp 0";
    if (amount >= 1000000) {
      const juta = amount / 1000000;
      return `Rp ${juta % 1 === 0 ? juta.toFixed(0) : juta.toFixed(1)} Juta`;
    }
    return `Rp ${amount.toLocaleString("id-ID")}`;
  };

  // Helper untuk membersihkan link medali dummy residual
  const cleanMedalUrl = (url?: string) => {
    if (!url) return "";
    if (url.includes("4e24a863-1fa5-490a-9205-f00e99227382_gifkja")) return "";
    return url.trim();
  };

  const jerseyUrl = (settings?.urlJerseyVirtual || "").trim();
  const medalUrl = cleanMedalUrl(settings?.urlMedaliVirtual);
  const hasJersey = !!jerseyUrl;
  const hasMedal = !!medalUrl;

  // --- LOGIKA DETEKSI URUTAN TIMELINE ---
  const parseIndoDate = (dateStr: string) => {
    if (!dateStr) return 9999999999999;
    const lower = dateStr.toLowerCase();
    const months = [
      "jan", "feb", "mar", "apr", "mei", "jun",
      "jul", "agu", "sep", "okt", "nov", "des",
    ];
    let monthIdx = 11;
    for (let i = 0; i < months.length; i++) {
      if (lower.includes(months[i])) {
        monthIdx = i;
        break;
      }
    }
    const matchNum = lower.match(/\d+/);
    const day = matchNum ? parseInt(matchNum[0]) : 1;
    const matchYear = lower.match(/20\d\d/);
    const year = matchYear ? parseInt(matchYear[0]) : new Date().getFullYear();
    return new Date(year, monthIdx, day).getTime();
  };

  const isPengirimanAwal =
    parseIndoDate(settings?.periodePengiriman) <
    parseIndoDate(settings?.periodeLari);

  // --- LOGIKA COUNTDOWN TIMER ---
  useEffect(() => {
    if (!settings) return;

    const openDate = settings.tanggalPembukaan
      ? new Date(settings.tanggalPembukaan)
      : null;
    const closeDate = settings.tanggalPenutupan
      ? new Date(settings.tanggalPenutupan)
      : null;

    const calculateTimeLeft = () => {
      const currentTime = new Date();
      let targetDate = null;
      let waiting = false;

      if (openDate && currentTime < openDate) {
        targetDate = openDate;
        waiting = true;
      } else if (closeDate && currentTime < closeDate) {
        targetDate = closeDate;
      }

      setIsWaitingToOpen(waiting);

      if (!targetDate) return null;

      const difference = +targetDate - +currentTime;
      if (difference > 0) {
        return {
          Hari: Math.floor(difference / (1000 * 60 * 60 * 24)),
          Jam: Math.floor((difference / (1000 * 60 * 60)) % 24),
          Menit: Math.floor((difference / 1000 / 60) % 60),
          Detik: Math.floor((difference / 1000) % 60),
        };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [settings]);

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "auto";
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B2239] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0B2239] border-t-[#FCD116] rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#0B2239] flex items-center justify-center font-bold text-slate-300">
        Data event belum dikonfigurasi oleh Admin.
      </div>
    );
  }

  let isBuka =
    settings.isVirtualRunEnabled !== false &&
    settings.statusPendaftaran === "Buka";
  const openDate = settings.tanggalPembukaan
    ? new Date(settings.tanggalPembukaan)
    : null;
  const closeDate = settings.tanggalPenutupan
    ? new Date(settings.tanggalPenutupan)
    : null;
  const currentTime = new Date();

  if (openDate && currentTime < openDate) {
    isBuka = false;
  }
  if (closeDate && currentTime > closeDate) {
    isBuka = false;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-[#FCD116] selection:text-[#0B2239] flex flex-col scroll-smooth relative antialiased">
      {/* ========================================================================= */}
      {/* 1. NAVBAR KHUSUS VIRTUAL RUN EVENT */}
      {/* ========================================================================= */}
      <VirtualRunNavbar
        eventName={settings?.eventName}
        isOfflineRunEnabled={settings?.isOfflineRunEnabled}
        offlineJudul={settings?.offlineJudul}
      />

      {/* ========================================================================= */}
      {/* 2. HERO SECTION */}
      {/* ========================================================================= */}
      <section
        id="hero"
        className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden min-h-[85vh] flex flex-col justify-center bg-[#071324]"
      >
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat grayscale-[20%]"
          style={{
            backgroundImage: `url('${
              settings?.urlHeroBg ||
              settings?.urlVirtualHeroBg ||
              "https://www.uii.ac.id/wp-content/uploads/2025/03/Gerbang-UII.jpg"
            }')`,
          }}
        ></div>
        <div className="absolute inset-0 bg-[#0B2239]/90"></div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-20 text-center flex flex-col items-center w-full">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white px-5 py-2 rounded-full mb-8 shadow-xl mt-4">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isBuka && timeLeft
                    ? "bg-[#FCD116] animate-pulse"
                    : "bg-rose-400"
                }`}
              ></span>
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                {settings.isVirtualRunEnabled === false
                  ? "Pendaftaran Ditutup"
                  : settings.statusPendaftaran === "Buka" &&
                    isWaitingToOpen &&
                    timeLeft
                  ? "Pendaftaran Segera Dibuka"
                  : isBuka && timeLeft
                  ? "Pendaftaran Sedang Dibuka"
                  : "Pendaftaran Ditutup"}
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 max-w-4xl leading-[1.1] drop-shadow-sm whitespace-pre-wrap">
              {settings?.landingTitle ||
                settings?.eventName ||
                "IKA UII VIRTUAL RUN 2026"}
            </h1>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <p className="text-base md:text-xl text-slate-300 mb-8 max-w-2xl font-medium leading-relaxed mx-auto whitespace-pre-wrap">
              {settings?.landingDesc ||
                "Berlari kapan saja, di mana saja. Kumpulkan kilometer lari Anda dan jadilah bagian dari gerakan sehat bersama IKA UII."}
            </p>
          </ScrollReveal>

          {/* Countdown Timer */}
          {(isBuka || isWaitingToOpen) && timeLeft && (
            <ScrollReveal delay={250}>
              <div className="mb-10 p-5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md inline-block max-w-full">
                <p className="text-xs font-bold text-[#FCD116] uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                  <Clock className="w-3.5 h-3.5" />
                  {isWaitingToOpen
                    ? "Pendaftaran Dibuka Dalam:"
                    : "Pendaftaran Ditutup Dalam:"}
                </p>
                <div className="flex gap-2.5 sm:gap-3 justify-center">
                  {Object.keys(timeLeft).map((interval, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center bg-[#0B2239] border border-[#FCD116]/30 rounded-xl px-3.5 py-2.5 min-w-[64px] sm:min-w-[76px] shadow-lg"
                    >
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                        {timeLeft[interval] || "0"}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-[#FCD116] font-bold mt-0.5">
                        {interval}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          )}

          {/* CTA Action Buttons */}
          <ScrollReveal delay={300}>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 w-full">
              {loggedInParticipant ? (
                <Link
                  href="/virtual-run/dashboard"
                  className="bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239] px-8 py-4 rounded-full flex items-center justify-center gap-2.5 transition-all font-black text-sm shadow-xl w-full sm:w-auto transform hover:-translate-y-0.5"
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard Progress Pelari</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (isBuka || isWaitingToOpen) && timeLeft ? (
                <Link
                  href={isBuka ? "/virtual-run/register" : "#"}
                  className={`px-8 py-4 rounded-full flex items-center justify-center gap-2.5 transition-all font-black text-sm shadow-xl w-full sm:w-auto transform hover:-translate-y-0.5 ${
                    isBuka
                      ? "bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239] shadow-yellow-500/25"
                      : "bg-slate-700 text-slate-300 cursor-not-allowed opacity-80"
                  }`}
                >
                  <span>{isBuka ? "Daftar Virtual Run Sekarang" : "Belum Dibuka"}</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  disabled
                  className="bg-slate-700 text-slate-400 font-black px-8 py-4 rounded-full text-sm cursor-not-allowed"
                >
                  Pendaftaran Ditutup
                </button>
              )}

              {settings.waChannelUrl && (
                <a
                  href={settings.waChannelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-7 py-4 rounded-full flex items-center justify-center gap-2.5 transition-all font-bold text-sm shadow-xl shadow-emerald-600/25 w-full sm:w-auto transform hover:-translate-y-0.5"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.796.814 3.18 0 5.766-2.587 5.767-5.767 0-3.18-2.586-5.767-5.767-5.767zm0 10.378c-.899 0-1.781-.242-2.548-.701l-.182-.108-1.579.414.421-1.54-.118-.188c-.504-.798-.77-1.727-.77-2.679 0-2.825 2.299-5.124 5.125-5.124 2.826 0 5.125 2.299 5.125 5.124 0 2.826-2.299 5.125-5.125 5.125z" />
                  </svg>
                  <span>Grup WhatsApp</span>
                </a>
              )}

              {settings.isOfflineRunEnabled && (
                <a
                  href="#offline-teaser"
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-7 py-4 rounded-full flex items-center justify-center gap-2.5 transition-all font-bold text-sm backdrop-blur-sm w-full sm:w-auto transform hover:-translate-y-0.5"
                >
                  <MapPin className="w-4 h-4 text-[#FCD116]" />
                  <span>Info {settings.offlineJudul || "Main Event"}</span>
                </a>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MAIN EVENT / SEMBADA RUN SHOWCASE (JIKA AKTIF DI ADMIN) */}
      {/* ========================================================================= */}
      {settings.isOfflineRunEnabled && (
        <section
          id="offline-teaser"
          className="py-16 bg-gradient-to-b from-[#0B2239] via-[#083323] to-[#0B2239] text-white relative overflow-hidden border-b border-emerald-800/40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <ScrollReveal>
              <div className="bg-gradient-to-br from-[#063a27]/90 via-[#04281b]/90 to-[#021810]/95 border border-emerald-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl backdrop-blur-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
                <div className="relative z-10 flex-grow max-w-2xl text-left">
                  <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-4 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Main Event • Kumpul Bersama
                  </div>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                    {settings.offlineJudul || "SEMBADA RUN 2026"}
                  </h2>

                  <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-6 font-normal whitespace-pre-wrap">
                    {settings.offlineDeskripsi ||
                      `Selain berlari secara virtual, ikuti juga ajang kumpul lari fisik bersama ribuan alumni dan pelari lainnya di ${
                        settings.offlineLocation || "Yogyakarta"
                      }.`}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs font-bold text-white">
                    <div className="bg-white/10 backdrop-blur-md border border-emerald-400/20 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
                      <Calendar className="w-4 h-4 text-emerald-300" />
                      <span>
                        {settings.offlineDate
                          ? new Date(settings.offlineDate).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "long", year: "numeric" },
                            )
                          : "Segera Diumumkan"}
                      </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-emerald-400/20 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
                      <Clock className="w-4 h-4 text-emerald-300" />
                      <span>{settings.offlineTime || "05:00"} WIB</span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md border border-emerald-400/20 rounded-xl px-4 py-2.5 flex items-center gap-2.5 shadow-sm">
                      <MapPin className="w-4 h-4 text-emerald-300" />
                      <span>{settings.offlineLocation || "Yogyakarta"}</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 shrink-0 w-full lg:w-auto flex flex-col items-center lg:items-end gap-3">
                  <Link
                    href="/run"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#FCD116] hover:bg-yellow-400 text-[#0B2239] font-black px-9 py-4 rounded-full shadow-xl shadow-yellow-500/20 transition-all transform hover:-translate-y-1 text-base tracking-wide"
                  >
                    <span>Daftar {settings.offlineJudul || "Event"} Sekarang</span>
                    <ChevronRight className="w-5 h-5 text-[#0B2239]" />
                  </Link>

                  {settings.offlineQuota && (
                    <p className="text-[11px] font-bold text-emerald-300/80 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FCD116]"></span>
                      Kuota Terbatas: {settings.offlineQuota} Peserta
                    </p>
                  )}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. LIVE STATS / METRIC RIBBON */}
      {/* ========================================================================= */}
      <section className="bg-[#0B2239] border-b border-slate-700/60 py-10 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 items-center text-center">
            {/* Total Peserta */}
            <div className="flex flex-col items-center justify-center">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" /> Total Peserta Terdaftar
              </p>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2 font-mono">
                {totalPeserta.toLocaleString("id-ID")}{" "}
                <span className="text-sm font-sans font-bold text-slate-400">Orang</span>
              </div>
            </div>

            {/* Total KM */}
            <div className="flex flex-col items-center justify-center sm:border-l border-slate-700/60 pt-6 sm:pt-0">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Total Jarak Tertempuh
              </p>
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-2 font-mono">
                {totalKm.toFixed(0)}{" "}
                <span className="text-sm font-sans font-bold text-slate-400">KM</span>
              </div>
            </div>

            {/* Total Donasi (Jika Aktif) */}
            {settings.isCharityActive && (
              <div className="flex flex-col items-center justify-center md:border-l border-slate-700/60 pt-6 md:pt-0 col-span-1 sm:col-span-2 md:col-span-1">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#FCD116]" /> Total Donasi Terkumpul
                </p>
                <div className="text-3xl sm:text-4xl font-black text-[#FCD116] tracking-tight flex items-center gap-1.5 font-mono">
                  {formatDonasi(totalDonasi)}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. RACE PACK SHOWCASE */}
      {/* ========================================================================= */}
      <section
        id="race-pack"
        className="py-24 bg-white border-b border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-[#0B2239] bg-blue-50 px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block">
                Exclusive Merchandise
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                Race Pack Collection
              </h2>
              <p className="text-slate-500 mt-4 text-base font-normal leading-relaxed">
                Desain resmi khusus untuk peserta Virtual Run. Dibuat dari material premium untuk performa lari terbaik.
              </p>
            </div>
          </ScrollReveal>

          {/* Grid Tampilan Jersey & Medali */}
          <div
            className={`grid gap-8 items-stretch mx-auto ${
              hasJersey && hasMedal
                ? "md:grid-cols-2 max-w-5xl"
                : "max-w-2xl"
            }`}
          >
            {/* 1. Jersey Showcase */}
            {hasJersey ? (
              <ScrollReveal delay={100}>
                <div className="bg-slate-50 rounded-3xl p-7 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
                  <div className="aspect-[4/3] bg-white rounded-2xl mb-6 flex items-center justify-center overflow-hidden border border-slate-200 relative">
                    <img
                      src={jerseyUrl}
                      alt="Jersey Finisher"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-[#0B2239] text-[#FCD116] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                      Official Jersey
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    Premium Dry-Fit Runner Jersey
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Bahan microfiber berpori dengan sirkulasi udara maksimal, cepat kering, dan nyaman dipakai dalam berbagai kondisi cuaca.
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-200 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg">Quick-Dry</span>
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg">Anti-UV 50+</span>
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg">Size S - XXL</span>
                  </div>
                </div>
              </ScrollReveal>
            ) : null}

            {/* 2. Medali Showcase (Hanya Muncul Jika Benar-benar Diisi di Admin) */}
            {hasMedal ? (
              <ScrollReveal delay={200}>
                <div className="bg-slate-50 rounded-3xl p-7 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full group">
                  <div className="aspect-[4/3] bg-white rounded-2xl mb-6 flex items-center justify-center overflow-hidden border border-slate-200 relative">
                    <img
                      src={medalUrl}
                      alt="Medali Finisher"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3 bg-[#FCD116] text-[#0B2239] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md">
                      Finisher Medal
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    Finisher Medal Collection
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6">
                    Medali logam 3D die-cast presisi tinggi dengan sentuhan akhir mewah, bukti nyata dedikasi dan kilometer yang Anda taklukkan.
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-200 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg">Logam 3D Die-Cast</span>
                    <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg">Tali Lanyard Satin</span>
                  </div>
                </div>
              </ScrollReveal>
            ) : null}

            {/* Fallback Jika Belum Ada Foto yang Diunggah */}
            {!hasJersey && !hasMedal ? (
              <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center text-slate-400 font-medium">
                <Shirt className="w-14 h-14 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-bold text-slate-600 mb-1">
                  Race Pack Resmi Segera Diumumkan
                </p>
                <p className="text-xs text-slate-400">
                  Desain jersey dan merchandise resmi sedang dalam proses finalisasi oleh panitia.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. PILIHAN PAKET LARI */}
      {/* ========================================================================= */}
      <section
        id="paket"
        className="py-24 bg-slate-50 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-[#0B2239] bg-blue-100/80 px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block">
                Kategori & Biaya
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                Pilihan Paket Lari Virtual
              </h2>
              <p className="text-slate-500 mt-4 text-base font-normal leading-relaxed">
                Pilih paket lari sesuai target jarak yang Anda inginkan. Pengiriman perlengkapan dilakukan ke seluruh Indonesia.
              </p>
            </div>
          </ScrollReveal>

          {loggedInParticipant ? (
            <div className="max-w-3xl mx-auto mb-16 bg-[#0B2239] rounded-3xl p-8 sm:p-12 shadow-2xl text-center text-white border border-blue-900/60">
              <div className="w-16 h-16 bg-[#FCD116] text-[#0B2239] rounded-full flex items-center justify-center text-3xl mx-auto mb-5 shadow-lg font-black">
                ✓
              </div>
              <h3 className="text-2xl sm:text-3xl font-black mb-2 tracking-tight">
                Anda Telah Terdaftar!
              </h3>
              <p className="text-slate-300 text-sm mb-8">
                Terima kasih telah berpartisipasi. Kumpulkan kilometer lari Anda dan submit di dashboard.
              </p>
              <div className="bg-white/10 rounded-2xl p-5 flex justify-center items-center gap-10 max-w-sm mx-auto mb-8 border border-white/10">
                <div>
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-1">
                    Jarak
                  </p>
                  <p className="text-2xl font-black text-white">{loggedInParticipant.jarak}</p>
                </div>
                <div className="w-px h-10 bg-white/20"></div>
                <div>
                  <p className="text-[10px] text-slate-300 uppercase tracking-widest font-bold mb-1">
                    Paket
                  </p>
                  <p className="text-2xl font-black text-[#FCD116] uppercase">{loggedInParticipant.paket}</p>
                </div>
              </div>
              <Link
                href="/virtual-run/dashboard"
                className="inline-flex items-center gap-2 bg-[#FCD116] hover:bg-yellow-400 text-[#0B2239] font-black px-8 py-3.5 rounded-full transition-all shadow-lg text-sm"
              >
                <span>Buka Dashboard Pelari</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
              {settings.virtualPackages && settings.virtualPackages.length > 0 ? (
                settings.virtualPackages.map((pkg: any, index: number) => {
                  const isPopuler = index === 1;

                  let activePrice = Number(pkg.harga);
                  let isEarlyBirdActive = false;

                  if (pkg.isEarlyBird) {
                    const currentRegistrants = packageCounts[pkg.nama] || 0;
                    const target = Number(pkg.earlyBirdTarget);
                    const isUnderQuota = target > 0 ? currentRegistrants < target : true;
                    const isBeforeEndDate = pkg.earlyBirdEndDate
                      ? new Date() < new Date(pkg.earlyBirdEndDate)
                      : true;

                    if (isUnderQuota && isBeforeEndDate) {
                      isEarlyBirdActive = true;
                      activePrice = Number(pkg.earlyBirdHarga || pkg.harga);
                    }
                  }

                  return (
                    <ScrollReveal key={pkg.id} delay={index * 100} className="w-full max-w-xs flex">
                      <div
                        className={`w-full rounded-3xl p-8 border flex flex-col relative transition-all duration-300 ${
                          isPopuler
                            ? "bg-[#0B2239] border-blue-900 text-white shadow-2xl md:-translate-y-3"
                            : "bg-white border-slate-200 shadow-sm hover:shadow-xl"
                        }`}
                      >
                        {isPopuler && (
                          <div className="absolute top-5 right-0 bg-[#FCD116] text-[#0B2239] text-[10px] font-black px-3.5 py-1 uppercase tracking-widest rounded-l-full shadow-md">
                            Rekomendasi
                          </div>
                        )}

                        <div className="mb-4">
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md ${
                              isPopuler
                                ? "bg-white/10 text-[#FCD116]"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            KATEGORI {pkg.jarak}
                          </span>
                        </div>

                        <h3 className={`text-2xl font-black mb-2 ${isPopuler ? "text-white" : "text-slate-900"}`}>
                          Paket {pkg.nama}
                        </h3>

                        <p className={`text-xs mb-6 min-h-[36px] ${isPopuler ? "text-slate-300" : "text-slate-500"}`}>
                          Target jarak {pkg.jarak} dengan paket kelengkapan lari pilihan.
                        </p>

                        {/* Price */}
                        <div className="mb-8">
                          {isEarlyBirdActive ? (
                            <div className="flex flex-col gap-1">
                              <span className={`text-xs line-through font-bold ${isPopuler ? "text-slate-400" : "text-slate-400"}`}>
                                Rp {Number(pkg.harga).toLocaleString("id-ID")}
                              </span>
                              <div className={`text-3xl font-black font-mono ${isPopuler ? "text-[#FCD116]" : "text-slate-900"}`}>
                                Rp {activePrice.toLocaleString("id-ID")}
                              </div>
                            </div>
                          ) : (
                            <div className={`text-3xl font-black font-mono ${isPopuler ? "text-[#FCD116]" : "text-slate-900"}`}>
                              Rp {activePrice.toLocaleString("id-ID")}
                            </div>
                          )}
                        </div>

                        {/* Feature List */}
                        <ul className="space-y-3.5 mb-8 flex-grow">
                          {pkg.benefit &&
                            pkg.benefit.split(",").map((item: string, i: number) => (
                              <li
                                key={i}
                                className={`flex items-start gap-2.5 text-xs font-medium ${
                                  isPopuler ? "text-slate-200" : "text-slate-700"
                                }`}
                              >
                                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isPopuler ? "text-[#FCD116]" : "text-[#0B2239]"}`} />
                                <span>{item.trim()}</span>
                              </li>
                            ))}
                        </ul>

                        {/* Button */}
                        {isBuka && timeLeft ? (
                          <Link
                            href={`/virtual-run/register?paket=${pkg.id}`}
                            className={`w-full text-center font-black py-3.5 rounded-full transition-all shadow-md text-sm ${
                              isPopuler
                                ? "bg-[#FCD116] hover:bg-yellow-400 text-[#0B2239] shadow-yellow-500/20"
                                : "bg-[#0B2239] hover:bg-blue-900 text-white"
                            }`}
                          >
                            Pilih Paket Ini
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="w-full text-center bg-slate-100 text-slate-400 font-bold py-3.5 rounded-full text-sm cursor-not-allowed"
                          >
                            Pendaftaran Ditutup
                          </button>
                        )}
                      </div>
                    </ScrollReveal>
                  );
                })
              ) : (
                <div className="text-slate-400">Paket belum dikonfigurasi.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. VIRTUAL ROUTE / KEBEBASAN BERLARI */}
      {/* ========================================================================= */}
      <section
        id="route"
        className="py-24 bg-[#0B2239] text-white relative overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <ScrollReveal>
              <div>
                <span className="text-xs font-bold text-[#FCD116] bg-[#FCD116]/10 border border-[#FCD116]/20 px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-4 inline-block">
                  Fleksibilitas Penuh
                </span>
                <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight tracking-tight">
                  Tentukan Titik Start &amp; Finish Sendiri
                </h2>
                <p className="text-slate-300 text-base mb-8 leading-relaxed">
                  Virtual Run memberi Anda kebebasan berlari di mana pun dan kapan pun selama periode event berlangsung. Rekam aktivitas menggunakan aplikasi favorit Anda (Strava, Garmin, Nike Run Club, dll).
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <Building2 className="w-6 h-6 text-[#FCD116] mb-2" />
                    <h4 className="font-bold text-white text-sm">Taman Kota</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Lari santai di sekitar taman favorit Anda.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <Mountain className="w-6 h-6 text-emerald-400 mb-2" />
                    <h4 className="font-bold text-white text-sm">Trail &amp; Alam</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Tantang diri Anda di medan menanjak.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <Activity className="w-6 h-6 text-orange-400 mb-2" />
                    <h4 className="font-bold text-white text-sm">Treadmill</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Lari indoor di gym atau rumah tetap dihitung.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                    <Home className="w-6 h-6 text-yellow-300 mb-2" />
                    <h4 className="font-bold text-white text-sm">Sekitar Rumah</h4>
                    <p className="text-[11px] text-slate-400 mt-1">Mulai lari langsung dari depan pintu rumah.</p>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 aspect-square flex flex-col items-center justify-center relative shadow-2xl overflow-hidden backdrop-blur-sm">
                <div className="w-24 h-24 bg-[#FCD116]/10 border border-[#FCD116]/30 rounded-full flex items-center justify-center mb-6 text-[#FCD116]">
                  <Activity className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-black text-white text-center mb-2">
                  Kompatibel dengan Semua Aplikasi
                </h3>
                <p className="text-xs text-slate-300 text-center max-w-xs mb-6">
                  Cukup screenshot ringkasan lari Anda dari Strava, Garmin Connect, Nike Run Club, atau aplikasi GPS lainnya.
                </p>
                <div className="flex flex-wrap justify-center gap-2 text-[10px] font-bold text-slate-200">
                  <span className="bg-white/10 px-3 py-1 rounded-full">Strava</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full">Garmin</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full">Nike Run Club</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full">Coros</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. CARA MENGIKUTI (4 STEP WORKFLOW) */}
      {/* ========================================================================= */}
      <section className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-xs font-bold text-[#0B2239] bg-blue-50 px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block">
                Panduan Peserta
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                4 Langkah Mudah Jadi Finisher
              </h2>
              <p className="text-slate-500 mt-4 text-base">
                Proses mudah dari pendaftaran hingga pengiriman Race Pack langsung ke rumah Anda.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <ScrollReveal delay={0}>
              <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 flex flex-col h-full">
                <div className="w-12 h-12 bg-[#0B2239] text-[#FCD116] rounded-2xl flex items-center justify-center font-black text-lg mb-5 shadow-md">
                  1
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-2">Daftar &amp; Pilih Paket</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pilih kategori jarak dan selesaikan pembayaran untuk mengamankan slot race pack Anda.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={100}>
              <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 flex flex-col h-full">
                <div className="w-12 h-12 bg-[#0B2239] text-[#FCD116] rounded-2xl flex items-center justify-center font-black text-lg mb-5 shadow-md">
                  2
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-2">Berlari &amp; Rekam</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Lari kapan saja selama periode event dengan aplikasi GPS favorit Anda (Strava, Garmin, dll).
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 flex flex-col h-full">
                <div className="w-12 h-12 bg-[#0B2239] text-[#FCD116] rounded-2xl flex items-center justify-center font-black text-lg mb-5 shadow-md">
                  3
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-2">Upload Aktivitas</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Login ke Dashboard Pelari, unggah screenshot hasil lari untuk diverifikasi panitia.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="bg-slate-50 rounded-3xl p-7 border border-slate-200 flex flex-col h-full">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center font-black text-lg mb-5 shadow-md shadow-emerald-600/20">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-2">Terima Race Pack</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Target terpenuhi! Race Pack fisik dan sertifikat dikirim langsung ke alamat rumah Anda.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. TIMELINE EVENT */}
      {/* ========================================================================= */}
      <section id="timeline" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <span className="text-xs font-bold text-[#0B2239] bg-blue-100/80 px-3.5 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block">
                Jadwal Pelaksanaan
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
                Timeline Event
              </h2>
              <p className="text-slate-500 mt-4 text-base">
                Catat tanggal-tanggal penting berikut agar persiapan lari Anda maksimal.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Fase 1: Registrasi */}
            <ScrollReveal delay={50}>
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex gap-5 items-start">
                <div className="w-10 h-10 rounded-xl bg-[#0B2239] text-[#FCD116] flex items-center justify-center font-black shrink-0 text-sm">
                  1
                </div>
                <div className="flex-grow">
                  <span className="text-[10px] font-bold text-[#0B2239] uppercase tracking-widest block mb-1">
                    Fase 1
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mb-1">Periode Registrasi</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Pendaftaran resmi dibuka bagi seluruh peserta dan alumni.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Buka: {settings?.tanggalPembukaan ? new Date(settings.tanggalPembukaan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Menunggu Info"}
                    </span>
                    <span className="bg-slate-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-500" />
                      Tutup: {settings?.tanggalPenutupan ? new Date(settings.tanggalPenutupan).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "Menunggu Info"}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Fase 2 & 3 Dinamis */}
            {isPengirimanAwal ? (
              <>
                <ScrollReveal delay={100}>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex gap-5 items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#FCD116] text-[#0B2239] flex items-center justify-center font-black shrink-0 text-sm">
                      2
                    </div>
                    <div className="flex-grow">
                      <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest block mb-1">
                        Fase 2
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mb-1">Pengiriman Race Pack</h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Perlengkapan lari dikirim lebih awal agar dapat dipakai saat periode lari dimulai.
                      </p>
                      <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold">
                        <Package className="w-3.5 h-3.5 text-yellow-600" />
                        {settings?.periodePengiriman || "Menunggu Info"}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={150}>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex gap-5 items-start">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-sm">
                      3
                    </div>
                    <div className="flex-grow">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">
                        Fase 3
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mb-1">Periode Virtual Run</h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Waktunya berlari! Selesaikan target jarak dan upload bukti di dashboard.
                      </p>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        {settings?.periodeLari || "Segera Hadir"}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              </>
            ) : (
              <>
                <ScrollReveal delay={100}>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex gap-5 items-start">
                    <div className="w-10 h-10 rounded-xl bg-[#FCD116] text-[#0B2239] flex items-center justify-center font-black shrink-0 text-sm">
                      2
                    </div>
                    <div className="flex-grow">
                      <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest block mb-1">
                        Fase 2
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mb-1">Periode Virtual Run</h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Waktunya berlari! Selesaikan target jarak dan upload bukti di dashboard.
                      </p>
                      <span className="bg-yellow-50 text-yellow-800 border border-yellow-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold">
                        <Activity className="w-3.5 h-3.5 text-yellow-600" />
                        {settings?.periodeLari || "Segera Hadir"}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={150}>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex gap-5 items-start">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 text-sm">
                      3
                    </div>
                    <div className="flex-grow">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block mb-1">
                        Fase 3
                      </span>
                      <h3 className="text-lg font-black text-slate-900 mb-1">Pengiriman Race Pack</h3>
                      <p className="text-xs text-slate-500 mb-3">
                        Bagi finisher, Race Pack fisik akan dikirimkan sesuai pesanan paket Anda.
                      </p>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold">
                        <Package className="w-3.5 h-3.5 text-emerald-600" />
                        {settings?.periodePengiriman || "Menunggu Info"}
                      </span>
                    </div>
                  </div>
                </ScrollReveal>
              </>
            )}

            {/* Fase 4: Charity (Jika Aktif) */}
            {settings?.isCharityActive && (
              <ScrollReveal delay={200}>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-2xl p-6 border border-purple-200 shadow-sm flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 text-sm">
                    4
                  </div>
                  <div className="flex-grow">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest block mb-1">
                      Puncak Acara
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mb-1">
                      {settings?.charityTitle || "Penyerahan Donasi Sosial"}
                    </h3>
                    <p className="text-xs text-slate-600 mb-3 leading-relaxed whitespace-pre-wrap">
                      {settings?.charityDesc ||
                        "Penyerahan seluruh donasi amal yang terkumpul dari peserta untuk program kegiatan sosial dan kemanusiaan."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold">
                        <MapPin className="w-3.5 h-3.5 text-purple-600" />
                        {settings?.jadwalPuncakAcara || "Menunggu Info"}
                      </span>
                      {settings?.urlLiveStreaming && (
                        <a
                          href={settings.urlLiveStreaming}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 text-xs font-bold shadow-sm"
                        >
                          Live Streaming &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. CTA FOOTER BANNER */}
      {/* ========================================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#0B2239] rounded-3xl p-10 sm:p-14 text-center text-white relative overflow-hidden shadow-2xl border border-blue-900/50">
            <div className="relative z-10 max-w-xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
                Siap Menjadi Bagian dari Gerakan Sehat?
              </h2>
              <p className="text-slate-300 text-sm md:text-base mb-8 leading-relaxed">
                Daftarkan diri Anda sekarang, ajak rekan alumni dan keluarga, dan kumpulkan kilometernya bersama-sama!
              </p>
              {loggedInParticipant ? (
                <Link
                  href="/virtual-run/dashboard"
                  className="inline-flex items-center gap-2 bg-[#FCD116] hover:bg-yellow-400 text-[#0B2239] font-black px-8 py-4 rounded-full text-base shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <span>Buka Dashboard Saya</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : isBuka && timeLeft ? (
                <Link
                  href="/virtual-run/register"
                  className="inline-flex items-center gap-2 bg-[#FCD116] hover:bg-yellow-400 text-[#0B2239] font-black px-8 py-4 rounded-full text-base shadow-lg shadow-yellow-500/25 transition-transform hover:-translate-y-0.5"
                >
                  <span>Daftar Sekarang Juga</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  disabled
                  className="bg-slate-700 text-slate-400 font-black px-8 py-4 rounded-full text-base cursor-not-allowed"
                >
                  Pendaftaran Ditutup
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FOOTER KHUSUS VIRTUAL RUN EVENT */}
      {/* ========================================================================= */}
      <VirtualRunFooter
        eventName={settings?.eventName || settings?.landingTitle}
        waChannelUrl={settings?.waChannelUrl}
      />
    </div>
  );
}
