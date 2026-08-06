"use client";

import { useEffect, useState } from "react";
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
import { MapPin, Calendar, Clock, Shirt, Medal, Activity, Building2, Mountain, Home, Package, Trophy, Mail, PartyPopper, Check, Menu, X, ArrowRight, User, Info, Map } from "lucide-react";

export default function VirtualRunLandingPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number } | null>(
    null,
  );

  // --- STATE STATISTIK GLOBAL ---
  const [totalDonasi, setTotalDonasi] = useState(0);
  const [totalPeserta, setTotalPeserta] = useState(0);
  const [totalKm, setTotalKm] = useState(0);
  const [packageCounts, setPackageCounts] = useState<{ [key: string]: number }>({});

  // --- STATE DETEKSI USER LOGIN ---
  const [loggedInParticipant, setLoggedInParticipant] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // --- AMBIL DATA SETTING, STATISTIK & SESI ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }

        const qPart = query(
          collection(db, "vr_participants"),
          where("statusPembayaran", "==", "Lunas"),
        );
        const snapPart = await getDocs(qPart);
        let tDonasi = 0;
        let counts: { [key: string]: number } = {};
        setTotalPeserta(snapPart.size);
        snapPart.forEach((doc) => {
          tDonasi += doc.data().nominalDonasi || 0;
          const pkgName = doc.data().paket;
          if (pkgName) {
            counts[pkgName] = (counts[pkgName] || 0) + 1;
          }
        });
        setTotalDonasi(tDonasi);
        setPackageCounts(counts);

        const qSub = query(
          collection(db, "vr_submissions"),
          where("status", "==", "Approved"),
        );
        const snapSub = await getDocs(qSub);
        let tKm = 0;
        snapSub.forEach((doc) => {
          tKm += doc.data().jarakKm || 0;
        });
        setTotalKm(tKm);

        const savedEmail = localStorage.getItem("vr_user_email");
        if (savedEmail) {
          const qUser = query(
            collection(db, "vr_participants"),
            where("email", "==", savedEmail),
          );
          const userSnap = await getDocs(qUser);
          if (!userSnap.empty) {
            const userRecords = userSnap.docs.map((d) => ({
              id: d.id,
              ...d.data(),
            }));
            userRecords.sort(
              (a: any, b: any) =>
                new Date(b.waktuDaftar).getTime() -
                new Date(a.waktuDaftar).getTime(),
            );
            setLoggedInParticipant(userRecords[0]);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  // --- LOGIKA DETEKSI URUTAN TIMELINE ---
  // Fungsi pintar untuk membaca teks tanggal bahasa Indonesia menjadi angka (waktu)
  const parseIndoDate = (dateStr: string) => {
    if (!dateStr) return 9999999999999; // Fallback jika kosong ditaruh di akhir
    const lower = dateStr.toLowerCase();
    const months = [
      "jan",
      "feb",
      "mar",
      "apr",
      "mei",
      "jun",
      "jul",
      "agu",
      "sep",
      "okt",
      "nov",
      "des",
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

  // Cek mana yang lebih dulu: Lari atau Pengiriman?
  const isPengirimanAwal =
    parseIndoDate(settings?.periodePengiriman) <
    parseIndoDate(settings?.periodeLari);
  // --- LOGIKA COUNTDOWN TIMER ---
  useEffect(() => {
    if (!settings || !settings.tanggalPenutupan) return;
    const targetDate = new Date(settings.tanggalPenutupan);

    const calculateTimeLeft = () => {
      const difference = +targetDate - +new Date();
      let newTimeLeft = null;

      if (difference > 0) {
        newTimeLeft = {
          Hari: Math.floor(difference / (1000 * 60 * 60 * 24)),
          Jam: Math.floor((difference / (1000 * 60 * 60)) % 24),
          Menit: Math.floor((difference / 1000 / 60) % 60),
          Detik: Math.floor((difference / 1000) % 60),
        };
      }
      return newTimeLeft;
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Data event belum dikonfigurasi oleh Admin.
      </div>
    );
  }

  const isBuka = settings.statusPendaftaran === "Buka";

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans selection:bg-yellow-300 selection:text-blue-900">
      {/* HEADER UNIVERSAL */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group shrink-0"
          >
            <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors shrink-0">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo IKA UII"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="font-black text-slate-800 text-sm sm:text-lg leading-none tracking-tight truncate">
                IKA UII DIY
              </h1>
              <p className="text-[8px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-0.5 truncate">
                Virtual Run Event
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-bold text-slate-600">
            <a href="#hero" className="hover:text-blue-600 transition-colors">
              Beranda
            </a>
            {settings.isOfflineRunEnabled && (
              <a
                href="#offline-teaser"
                className="hover:text-emerald-600 text-emerald-600 transition-colors flex items-center gap-1"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
                Offline Run
              </a>
            )}
            <a
              href="#race-pack"
              className="hover:text-blue-600 transition-colors"
            >
              Race Pack
            </a>
            <a href="#paket" className="hover:text-blue-600 transition-colors">
              Paket Lari
            </a>
            <Link
              href="/virtual-run/leaderboard"
              className="hover:text-blue-600 transition-colors"
            >
              Lihat Klasemen
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/virtual-run/dashboard"
              className={`border font-bold px-4 py-2.5 rounded-full text-xs transition-all shadow-sm flex items-center gap-2 shrink-0 ${loggedInParticipant ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-800"}`}
            >
              {loggedInParticipant ? (
                <>
                  <span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-white" />
                  </span>
                  <span>Dashboard</span>
                </>
              ) : (
                <>
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Login</span>
                </>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 text-slate-600 hover:text-blue-600 focus:outline-none shrink-0"
            >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-lg py-4 px-6 flex flex-col gap-4 text-sm font-bold text-slate-600">
            <a
              href="#hero"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-blue-600 py-2 border-b border-slate-50"
            >
              Beranda
            </a>
            {settings.isOfflineRunEnabled && (
              <a
                href="#offline-teaser"
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-emerald-600 text-emerald-600 py-2 border-b border-slate-50"
              >
                Offline Run (Kumpul Fisik)
              </a>
            )}
            <a
              href="#race-pack"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-blue-600 py-2 border-b border-slate-50"
            >
              Race Pack
            </a>
            <a
              href="#paket"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-blue-600 py-2 border-b border-slate-50"
            >
              Paket Lari
            </a>
            <Link
              href="/virtual-run/leaderboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-blue-600 py-2"
            >
              Lihat Klasemen
            </Link>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section
        id="hero"
        className="relative pt-32 pb-24 lg:pt-40 lg:pb-32 overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-900/80 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#F4F7FB] via-transparent to-transparent z-10 opacity-100"></div>
          <img
            src={
              settings.urlHeroBg ||
              "https://images.unsplash.com/photo-1552674605-15c9ef04392c?q=80&w=2000"
            }
            alt="Hero Background"
            className="w-full h-full object-cover object-center"
          />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 text-center lg:text-left flex flex-col lg:items-start items-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-6">
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${isBuka && timeLeft ? "bg-emerald-400" : "bg-rose-400"}`}
            ></span>
            <span className="text-xs font-bold text-white uppercase tracking-widest">
              {isBuka && timeLeft
                ? "Pendaftaran Dibuka"
                : "Pendaftaran Ditutup"}
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 max-w-4xl leading-[1.1]">
            {settings.landingTitle}
          </h1>

          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl font-medium leading-relaxed">
            {settings.landingDesc}
          </p>

          {isBuka && timeLeft && (
            <div className="mb-10 w-full max-w-md">
              <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest mb-3 text-center lg:text-left">
                Pendaftaran Ditutup Dalam:
              </p>
              <div className="flex gap-3 justify-center lg:justify-start">
                {Object.keys(timeLeft).map((interval, index) => (
                  <div
                    key={index}
                    className="flex flex-col items-center bg-blue-900/50 backdrop-blur-sm border border-blue-400/30 rounded-xl p-3 w-16 sm:w-20 shadow-lg"
                  >
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      {timeLeft[interval] || "0"}
                    </span>
                    <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-blue-200 mt-1">
                      {interval}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isBuka && !timeLeft && settings.tanggalPenutupan && (
            <div className="mb-10 w-full max-w-md bg-rose-500/20 border border-rose-500/50 backdrop-blur-sm rounded-xl p-4 text-center lg:text-left">
              <p className="text-sm font-bold text-rose-100">
                Waktu Pendaftaran Telah Berakhir!
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            {loggedInParticipant ? (
              <Link
                href="/virtual-run/dashboard"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black px-10 py-4 rounded-full text-sm transition-all shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                Lihat Progress Kamu &rarr;
              </Link>
            ) : isBuka && timeLeft ? (
              <Link
                href="/virtual-run/register"
                className="w-full sm:w-auto bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-black px-10 py-4 rounded-full text-sm transition-all shadow-lg shadow-yellow-400/30 flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                Daftar Virtual Run &rarr;
              </Link>
            ) : (
              <button
                disabled
                className="w-full sm:w-auto bg-slate-500 text-white font-black px-10 py-4 rounded-full text-sm cursor-not-allowed"
              >
                Pendaftaran Ditutup
              </button>
            )}

            {settings.isOfflineRunEnabled && isBuka && timeLeft && (
              <a
                href="#offline-teaser"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 border border-white/30 backdrop-blur-sm text-white font-black px-10 py-4 rounded-full text-sm transition-all flex items-center justify-center gap-2 transform hover:-translate-y-1"
              >
                <MapPin className="w-4 h-4" /> Info Lari Offline
              </a>
            )}
          </div>
        </div>
      </section>

      {/* BANNER OFFLINE RUN */}
      {settings.isOfflineRunEnabled && (
        <section
          id="offline-teaser"
          className="relative z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-20"
        >
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[2rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-emerald-500/50 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute -right-10 -bottom-10 opacity-20 rotate-12">
              <Activity className="w-64 h-64 text-emerald-900" />
            </div>
            <div className="relative z-10 text-center md:text-left flex-grow">
              
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
                Ingin Lari & Kumpul Bareng?
              </h2>
              <p className="text-emerald-100 font-medium text-sm sm:text-base max-w-xl">
                Selain berlari secara virtual, kami juga mengadakan acara kumpul
                fisik. Mari lari bersama menyusuri rute:{" "}
                <strong className="text-white">
                  {settings.offlineLocation || "Yogyakarta"}
                </strong>
                .
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-widest text-emerald-200 font-bold">
                      Tanggal Acara
                    </p>
                    <p className="text-white font-black text-sm">
                      {settings.offlineDate
                        ? new Date(settings.offlineDate).toLocaleDateString(
                            "id-ID",
                            { day: "numeric", month: "long", year: "numeric" },
                          )
                        : "-"}
                    </p>
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-2 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-widest text-emerald-200 font-bold">
                      Jam Kumpul
                    </p>
                    <p className="text-white font-black text-sm">
                      {settings.offlineTime || "06:00"} WIB
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative z-10 shrink-0 w-full md:w-auto text-center">
              <Link
                href="/run"
                className="w-full md:w-auto inline-block bg-white hover:bg-slate-50 text-emerald-800 font-black px-8 py-4 rounded-xl shadow-lg transition-transform hover:-translate-y-1"
              >
                Daftar Offline Run &rarr;
              </Link>
              <p className="text-[10px] text-emerald-200 font-medium mt-3">
                *Kuota terbatas{" "}
                {settings.offlineQuota
                  ? `hanya untuk ${settings.offlineQuota} pelari`
                  : "segera amankan slotmu"}
                !
              </p>
            </div>
          </div>
        </section>
      )}

      {/* --- 🔥 1. UPDATE STATISTIK GLOBAL REAL-TIME 🔥 --- */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 mt-10">
        <div className="bg-white/90 backdrop-blur-xl border border-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-around items-center gap-8 shadow-2xl">
          <div className="text-center w-full md:flex-1">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Total Peserta Terdaftar
            </p>
            <div className="text-3xl sm:text-4xl font-black text-slate-800 flex items-center justify-center gap-3">
              {totalPeserta}{" "}
              <span className="text-lg font-bold text-slate-500">Orang</span>
            </div>
          </div>

          <div className="hidden md:block w-px h-16 bg-slate-200"></div>

          <div className="text-center w-full md:flex-1 border-t border-slate-200 pt-6 md:border-t-0 md:pt-0">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
              Total Jarak Tertempuh
            </p>
            <div className="text-3xl sm:text-4xl font-black text-slate-800 flex items-center justify-center gap-3">
              {totalKm.toFixed(0)}{" "}
              <span className="text-lg font-bold text-slate-500">KM</span>
            </div>
          </div>

          {/* Menampilkan Kolom Donasi HANYA JIKA isCharityActive = true */}
          {settings.isCharityActive && (
            <>
              <div className="hidden md:block w-px h-16 bg-slate-200"></div>
              <div className="text-center w-full md:flex-1 border-t border-slate-200 pt-6 md:border-t-0 md:pt-0">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  Total Donasi Terkumpul
                </p>
                <div className="text-3xl sm:text-4xl font-black text-blue-600 flex items-center justify-center gap-3">
                  Rp {(totalDonasi / 1000000).toFixed(1)}{" "}
                  <span className="text-lg font-bold text-blue-400">Juta</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* RACE PACK */}
      <section
        id="race-pack"
        className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-30 mt-10"
      >
        <div className="text-center mb-12 bg-white/80 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl max-w-3xl mx-auto">
          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
            Eksklusif
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">
            Race Pack Collection
          </h2>
          <p className="text-slate-500 mt-4 font-medium">
            Desain premium khusus untuk alumni dan peserta Virtual Run IKA UII
            2026. Koleksi kebanggaan yang wajib Anda miliki.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center max-w-5xl mx-auto">
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
            <div className="aspect-[4/3] bg-slate-50 rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {settings.urlJersey ? (
                <img
                  src={settings.urlJersey}
                  alt="Jersey Finisher"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="text-slate-300 flex flex-col items-center">
                  <Shirt className="w-16 h-16 text-slate-300 mb-2" />
                  <span className="font-bold text-sm">Preview Jersey</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">
              Premium Dry-Fit Jersey
            </h3>
            <p className="text-slate-500 text-sm">
              Bahan berpori menyerap keringat dengan desain modern minimalis
              elegan. (Tersedia ukuran S hingga XXL).
            </p>
          </div>
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group">
            <div className="aspect-[4/3] bg-slate-50 rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              {settings.urlMedali ? (
                <img
                  src={settings.urlMedali}
                  alt="Medali Finisher"
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="text-slate-300 flex flex-col items-center">
                  <Medal className="w-16 h-16 text-slate-300 mb-2" />
                  <span className="font-bold text-sm">Preview Medali</span>
                </div>
              )}
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">
              Finisher Medal
            </h3>
            <p className="text-slate-500 text-sm">
              Medali logam 3D die-cast dengan sentuhan warna emas mewah, tanda
              bukti pencapaian Anda.
            </p>
          </div>
        </div>
      </section>

      {/* PAKET LARI */}
      <section
        id="paket"
        className="py-20 bg-white border-t border-slate-100 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-16">
          <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
            Pendaftaran Virtual
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900">
            Pilihan Paket Lari Virtual
          </h2>
          <p className="text-slate-500 mt-4 font-medium max-w-xl mx-auto">
            Pilih kategori jarak dan paket apresiasi yang sesuai dengan target
            Anda. Pengiriman Race Pack akan dilakukan ke seluruh Indonesia.
          </p>
        </div>

        {loggedInParticipant ? (
          <div className="max-w-3xl mx-auto mb-16 bg-gradient-to-br from-[#3b5998] to-[#2a437a] rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden border border-blue-800 text-center">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="absolute -top-10 -right-10 opacity-20 rotate-12">
              <PartyPopper className="w-64 h-64 text-blue-900" />
            </div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-emerald-400 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-lg border-4 border-emerald-200">
                ✓
              </div>
              <h3 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
                Kamu Sudah Terdaftar!
              </h3>
              <p className="text-blue-100 text-base mb-8">
                Terima kasih telah bergabung. Fokus pada latihanmu dan capai
                garis finish!
              </p>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 flex flex-col sm:flex-row justify-center items-center gap-6 sm:gap-12 mb-8 max-w-lg mx-auto">
                <div>
                  <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mb-1">
                    Kategori Jarak
                  </p>
                  <p className="text-2xl font-black text-white">
                    {loggedInParticipant.jarak}
                  </p>
                </div>
                <div className="hidden sm:block w-px h-12 bg-white/20"></div>
                <div>
                  <p className="text-[10px] text-blue-200 uppercase tracking-widest font-bold mb-1">
                    Paket Pilihan
                  </p>
                  <p className="text-2xl font-black text-yellow-400 uppercase">
                    {loggedInParticipant.paket}
                  </p>
                </div>
              </div>
              <Link
                href="/virtual-run/dashboard"
                className="inline-block bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-black px-8 py-4 rounded-xl transition-all shadow-lg"
              >
                Lihat Progress Kamu &rarr;
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
            {settings.virtualPackages && settings.virtualPackages.length > 0 ? (
              settings.virtualPackages.map((pkg: any, index: number) => {
                const isPopuler = index === 1;

                // --- EARLY BIRD LOGIC ---
                let activePrice = Number(pkg.harga);
                let isEarlyBirdActive = false;
                
                if (pkg.isEarlyBird) {
                  const currentRegistrants = packageCounts[pkg.nama] || 0;
                  const target = Number(pkg.earlyBirdTarget);
                  const isUnderQuota = target > 0 ? currentRegistrants < target : true;
                  const isBeforeEndDate = pkg.earlyBirdEndDate ? new Date() < new Date(pkg.earlyBirdEndDate) : true;
                  
                  if (isUnderQuota && isBeforeEndDate) {
                    isEarlyBirdActive = true;
                    activePrice = Number(pkg.earlyBirdHarga || pkg.harga);
                  }
                }

                return (
                  <div
                    key={pkg.id}
                    className={`w-full max-w-xs rounded-[2rem] p-8 border flex flex-col relative overflow-hidden transition-all ${isPopuler ? "bg-blue-900 border-blue-800 text-white shadow-2xl transform md:-translate-y-4" : "bg-slate-50 border-slate-200 shadow-sm hover:shadow-xl"}`}
                  >
                    {!isPopuler && (
                      <div className="h-2 w-full bg-slate-300 absolute top-0 left-0"></div>
                    )}
                    {isPopuler && (
                      <div className="absolute top-6 right-0 bg-yellow-400 text-blue-950 text-[10px] font-black px-4 py-1 uppercase tracking-widest rounded-l-full shadow-md">
                        Terpopuler
                      </div>
                    )}
                    
                    {/* Badge Early Bird */}
                    {isEarlyBirdActive && !isPopuler && (
                      <div className="absolute top-5 left-0 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest rounded-r-full shadow-lg z-10 flex items-center gap-1.5 border-y border-r border-white/20">
                        <svg className="w-3 h-3 text-amber-200 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Promo Early Bird
                      </div>
                    )}
                    {isEarlyBirdActive && isPopuler && (
                      <div className="absolute top-14 right-0 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[10px] font-black px-4 py-1.5 uppercase tracking-widest rounded-l-full shadow-lg z-10 flex items-center gap-1.5 border-y border-l border-white/20">
                        <svg className="w-3 h-3 text-amber-200 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Promo Early Bird
                      </div>
                    )}

                    <div className={`mb-6 mt-4 ${isEarlyBirdActive && !isPopuler ? 'mt-8' : ''}`}>
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${isPopuler ? "bg-blue-800 text-blue-200" : "bg-slate-200 text-slate-500"}`}
                      >
                        KATEGORI {pkg.jarak}
                      </span>
                    </div>
                    <h3
                      className={`text-2xl font-black mb-2 ${isPopuler ? "text-white" : "text-slate-800"}`}
                    >
                      Paket {pkg.nama}
                    </h3>
                    <p
                      className={`text-sm mb-6 min-h-[40px] ${isPopuler ? "text-blue-200" : "text-slate-500"}`}
                    >
                      Ikuti lari sejauh {pkg.jarak} dan dapatkan benefit
                      menarik.
                    </p>
                    <div
                      className={`text-3xl font-black mb-8 ${isPopuler ? "text-yellow-400" : "text-slate-900"}`}
                    >
                      {isEarlyBirdActive ? (
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm line-through decoration-rose-500/50 decoration-2 font-bold ${isPopuler ? 'text-blue-300' : 'text-slate-400'}`}>
                              Rp {Number(pkg.harga).toLocaleString("id-ID")}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${isPopuler ? "bg-yellow-400/20 text-yellow-300" : "bg-rose-100 text-rose-600"}`}>
                              Save
                            </span>
                          </div>
                          <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isPopuler ? "from-yellow-300 to-amber-500" : "from-amber-500 to-orange-600"}`}>
                            Rp {activePrice.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ) : (
                        `Rp ${activePrice.toLocaleString("id-ID")}`
                      )}
                    </div>

                    <ul className="space-y-4 mb-8 flex-grow">
                      {pkg.benefit &&
                        pkg.benefit
                          .split(",")
                          .map((item: string, i: number) => (
                            <li
                              key={i}
                              className={`flex items-center gap-3 text-sm ${isPopuler ? "text-white" : "text-slate-700"}`}
                            >
                              <span
                                className={`${isPopuler ? "text-yellow-400" : "text-blue-500"} font-bold`}
                              >
                                ✓
                              </span>
                              {item.trim()}
                            </li>
                          ))}

                      {/* --- 🔥 2. UPDATE TEKS BENEFIT CHARITY 🔥 --- */}
                      {settings.isCharityActive && (
                        <li
                          className={`flex items-center gap-3 text-sm ${isPopuler ? "text-white" : "text-slate-700"}`}
                        >
                          <span
                            className={`${isPopuler ? "text-emerald-400" : "text-emerald-500"} font-bold`}
                          >
                            ✓
                          </span>
                          Termasuk Donasi untuk Program Sosial IKA UII
                        </li>
                      )}
                    </ul>

                    {isBuka && timeLeft ? (
                      <Link
                        href={`/virtual-run/register?paket=${pkg.id}`}
                        className={`w-full text-center font-bold py-3.5 rounded-xl transition-all shadow-md ${isPopuler ? "bg-yellow-400 hover:bg-yellow-500 text-blue-950" : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-800"}`}
                      >
                        Pilih {pkg.nama}
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full text-center bg-slate-200 text-slate-400 font-bold py-3.5 rounded-xl cursor-not-allowed"
                      >
                        Pendaftaran Ditutup
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-slate-500">
                Admin belum menambahkan paket.
              </div>
            )}
          </div>
        )}
      </section>

      {/* VIRTUAL ROUTE */}
      <section
        id="route"
        className="py-20 bg-slate-900 text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-900/50 border border-emerald-500/30 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">
                Virtual Route
              </span>
              <h2 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
                Tentukan Titik{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-emerald-400">
                  Start & Finish-mu
                </span>{" "}
                Sendiri!
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed font-medium">
                Sesuai namanya, Virtual Run membebaskan Anda berlari di mana
                saja. Tidak perlu berkumpul di satu titik, karena jalanan adalah
                trek lari Anda.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-blue-500/20 text-blue-300 rounded-xl flex items-center justify-center mb-3">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Taman Kota</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Lari santai sambil nikmati udara pagi.
                  </p>
                </div>
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-emerald-500/20 text-emerald-300 rounded-xl flex items-center justify-center mb-3">
                    <Mountain className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    Trail Pegunungan
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tantang dirimu di medan menanjak.
                  </p>
                </div>
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-orange-500/20 text-orange-300 rounded-xl flex items-center justify-center mb-3">
                    <Activity className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm">Treadmill</h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Hujan di luar? Lari di gym tetap dihitung!
                  </p>
                </div>
                <div className="bg-white/10 border border-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <div className="w-10 h-10 bg-purple-500/20 text-purple-300 rounded-xl flex items-center justify-center mb-3">
                    <Home className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-white text-sm">
                    Kompleks Rumah
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Mulai garis start langsung dari pagar rumah.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-blue-950 border border-blue-800 rounded-[3rem] p-8 aspect-square flex flex-col items-center justify-center relative shadow-2xl">
                <svg
                  className="absolute inset-0 w-full h-full text-blue-500/30"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M10,90 Q30,10 50,50 T90,10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                </svg>
                <div
                  className="absolute top-1/4 left-1/4 animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                >
                  <MapPin className="w-10 h-10 text-rose-500 drop-shadow-lg" />
                </div>
                <div
                  className="absolute bottom-1/3 right-1/4 animate-bounce"
                  style={{ animationDelay: "0.5s" }}
                >
                  <MapPin className="w-10 h-10 text-rose-500 drop-shadow-lg" />
                </div>
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-bounce"
                  style={{ animationDelay: "0.9s" }}
                >
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl">
                     <Activity className="w-10 h-10 text-blue-600" />
                  </div>
                </div>
                <h3 className="absolute bottom-8 font-black text-2xl tracking-widest text-white/50 uppercase">
                  ANYWHERE
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* TIMELINE EVENT (DINAMIS BERDASARKAN TANGGAL)*/}
      {/* ========================================= */}
      <section id="timeline" className="py-20 bg-[#F4F7FB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
              Jadwal
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Timeline Event
            </h2>
            <p className="text-slate-500 font-medium">
              Catat tanggal-tanggal penting ini agar perjalanan lari Anda
              lancar.
            </p>
          </div>

          <div className="relative border-l-4 border-slate-200 ml-4 md:mx-auto md:w-fit px-6 md:px-12 space-y-12 pb-8">
            {/* FASE 1: REGISTRASI (TETAP) */}
            <div className="relative">
              <div className="absolute -left-[45px] md:-left-[69px] w-8 h-8 bg-blue-600 rounded-full border-4 border-[#F4F7FB] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                1
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-blue-300 transition-colors">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1 block">
                  Fase 1
                </span>
                <h3 className="text-xl font-black text-slate-800 mb-2">
                  Periode Registrasi
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Pendaftaran dibuka. Amankan slot Anda, lengkapi data diri, dan
                  pilih paket Race Pack.
                </p>
                <div className="inline-flex flex-col gap-1">
                  <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-500" /> Dibuka:{" "}
                    {settings?.tanggalPembukaan
                      ? new Date(settings.tanggalPembukaan).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "long", year: "numeric" },
                        )
                      : "Menunggu Info"}
                  </div>
                  <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                    <Calendar className="w-4 h-4 text-slate-500" /> Ditutup:{" "}
                    {settings?.tanggalPenutupan
                      ? new Date(settings.tanggalPenutupan).toLocaleDateString(
                          "id-ID",
                          { day: "numeric", month: "long", year: "numeric" },
                        )
                      : "Menunggu Info"}
                  </div>
                </div>
              </div>
            </div>

            {/* LOGIKA SWAP FASE 2 & FASE 3 */}
            {isPengirimanAwal ? (
              // --- JIKA PENGIRIMAN LEBIH DULU ---
              <>
                {/* FASE 2: PENGIRIMAN */}
                <div className="relative">
                  <div className="absolute -left-[45px] md:-left-[69px] w-8 h-8 bg-yellow-400 rounded-full border-4 border-[#F4F7FB] flex items-center justify-center text-blue-900 text-xs font-black shadow-sm">
                    2
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-yellow-300 transition-colors">
                    <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1 block">
                      Fase 2
                    </span>
                    <h3 className="text-xl font-black text-slate-800 mb-2">
                      Pengiriman Race Pack
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Race Pack (Jersey & Medali) akan dikirimkan lebih awal
                      agar bisa Anda kenakan saat periode lari dimulai!
                    </p>
                    <div className="inline-flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 text-xs font-bold text-yellow-800 shadow-sm">
                      <Package className="w-4 h-4 text-yellow-600" /> {settings?.periodePengiriman || "Menunggu Info"}
                    </div>
                  </div>
                </div>

                {/* FASE 3: LARI */}
                <div className="relative">
                  <div className="absolute -left-[45px] md:-left-[69px] w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#F4F7FB] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    3
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-300 transition-colors">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">
                      Fase 3
                    </span>
                    <h3 className="text-xl font-black text-slate-800 mb-2">
                      Periode Virtual Run
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Waktunya berlari menggunakan atribut kebanggaan!
                      Selesaikan target kilometer sesuai kategori dan unggah
                      bukti.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-700 shadow-sm">
                      <Activity className="w-4 h-4 text-emerald-600" /> {settings?.periodeLari || "Segera Hadir"}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // --- JIKA LARI LEBIH DULU (SISTEM STANDAR) ---
              <>
                {/* FASE 2: LARI */}
                <div className="relative">
                  <div className="absolute -left-[45px] md:-left-[69px] w-8 h-8 bg-yellow-400 rounded-full border-4 border-[#F4F7FB] flex items-center justify-center text-blue-900 text-xs font-black shadow-sm">
                    2
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-yellow-300 transition-colors">
                    <span className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1 block">
                      Fase 2
                    </span>
                    <h3 className="text-xl font-black text-slate-800 mb-2">
                      Periode Virtual Run
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Waktunya berlari! Selesaikan target kilometer sesuai
                      kategori dan unggah bukti lari di Dashboard.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-xl border border-yellow-200 text-xs font-bold text-yellow-800 shadow-sm">
                      <Activity className="w-4 h-4 text-yellow-600" /> {settings?.periodeLari || "Segera Hadir"}
                    </div>
                  </div>
                </div>

                {/* FASE 3: PENGIRIMAN */}
                <div className="relative">
                  <div className="absolute -left-[45px] md:-left-[69px] w-8 h-8 bg-emerald-500 rounded-full border-4 border-[#F4F7FB] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                    3
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-emerald-300 transition-colors">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1 block">
                      Fase 3
                    </span>
                    <h3 className="text-xl font-black text-slate-800 mb-2">
                      Pengiriman Race Pack
                    </h3>
                    <p className="text-sm text-slate-500 mb-4">
                      Bagi finisher, Jersey dan Medali Fisik akan mulai
                      dikirimkan sesuai dengan pesanan paket Anda.
                    </p>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-700 shadow-sm">
                      <Package className="w-4 h-4 text-emerald-600" /> {settings?.periodePengiriman || "Menunggu Info"}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* FASE 4: PUNCAK ACARA CHARITY (MUNCUL JIKA AKTIF) */}
            {settings?.isCharityActive && (
              <div className="relative">
                <div className="absolute -left-[45px] md:-left-[69px] w-8 h-8 bg-purple-600 rounded-full border-4 border-[#F4F7FB] flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  4
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl shadow-sm border border-purple-200 hover:shadow-md transition-shadow">
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest mb-1 block">
                    Puncak Acara
                  </span>
                  <h3 className="text-xl font-black text-slate-800 mb-2">
                    Simbolis Penyerahan Donasi
                  </h3>
                  <p className="text-sm text-slate-600 mb-5">
                    Penyerahan seluruh donasi amal yang terkumpul dari peserta
                    untuk program kegiatan sosial dan kemanusiaan.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-xl border border-purple-200 text-xs font-bold text-purple-800 shadow-sm">
                      <MapPin className="w-4 h-4 text-purple-600" /> {settings?.jadwalPuncakAcara || "Menunggu Info"}
                    </div>
                    {settings?.urlLiveStreaming ? (
                      <a
                        href={settings.urlLiveStreaming}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 transition-colors px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                        </svg>{" "}
                        Tonton Live Streaming
                      </a>
                    ) : (
                      <button
                        disabled
                        className="inline-flex items-center gap-2 bg-slate-200 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 cursor-not-allowed"
                      >
                        Link Live Streaming Menyusul
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ROADMAP / CARA IKUT */}
      <section id="faq" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
              Tutorial
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Cara Mengikuti Event
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center relative before:hidden md:before:block before:absolute before:top-12 before:left-[10%] before:right-[10%] before:h-0.5 before:bg-blue-200/50">
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-[#F4F7FB] rounded-full border-8 border-white flex items-center justify-center text-3xl font-black text-blue-600 mb-6 shadow-xl shadow-blue-900/10">
                1
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-2">
                Daftar Event
              </h3>
              <p className="text-sm text-slate-500">
                Pilih kategori jarak dan paket race pack pilihan Anda.
              </p>
            </div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-[#F4F7FB] rounded-full border-8 border-white flex items-center justify-center text-3xl font-black text-blue-600 mb-6 shadow-xl shadow-blue-900/10">
                2
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-2">
                Berlari Sepuasnya
              </h3>
              <p className="text-sm text-slate-500">
                Lari pakai app favorit di mana pun Anda berada.
              </p>
            </div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-[#F4F7FB] rounded-full border-8 border-white flex items-center justify-center text-3xl font-black text-blue-600 mb-6 shadow-xl shadow-blue-900/10">
                3
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-2">
                Upload Bukti
              </h3>
              <p className="text-sm text-slate-500">
                Login ke Dashboard Pelari, masukkan foto screenshot aplikasi
                lari Anda.
              </p>
            </div>
            <div className="relative z-10">
              <div className="w-24 h-24 mx-auto bg-emerald-500 rounded-full border-8 border-white flex items-center justify-center text-3xl font-black mb-6 shadow-xl shadow-emerald-900/20 text-white">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-black text-slate-800 text-lg mb-2">
                Jadi Finisher!
              </h3>
              <p className="text-sm text-slate-500">
                Target selesai! Kami akan mengirim Race Pack fisik langsung ke
                rumah Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA & OFFICIAL FOOTER */}
      <section className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[3rem] p-10 sm:p-16 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiLz48L3N2Zz4=')]"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6">
                Siap Mengukir Sejarah?
              </h2>
              <p className="text-blue-100 mb-10 max-w-xl mx-auto font-medium text-lg">
                Jangan sampai kehabisan slot! Bergabunglah sekarang dan
                kumpulkan kilometernya.
              </p>

              {/* WRAPPER TOMBOL (Sejajar di Desktop, Bersusun di Mobile) */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {loggedInParticipant ? (
                  <Link
                    href="/virtual-run/dashboard"
                    className="w-full sm:w-auto inline-block bg-white hover:bg-slate-50 text-blue-900 font-black px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg transition-all shadow-xl transform hover:-translate-y-1"
                  >
                    Lihat Progress Kamu
                  </Link>
                ) : isBuka && timeLeft ? (
                  <Link
                    href="/virtual-run/register"
                    className="w-full sm:w-auto inline-block bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-black px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg transition-all shadow-xl shadow-yellow-400/20 transform hover:-translate-y-1"
                  >
                    Daftar Sekarang Juga
                  </Link>
                ) : (
                  <button
                    disabled
                    className="w-full sm:w-auto inline-block bg-slate-500 text-white font-black px-10 py-4 sm:py-5 rounded-full text-base sm:text-lg cursor-not-allowed"
                  >
                    Pendaftaran Ditutup
                  </button>
                )}

                {/* TOMBOL KEMBALI KE MAIN EVENT (Untuk Akses Twibbon) */}
                <a
                  href="https://ikadiy.uii.ac.id/agenda/" // <-- GANTI DENGAN LINK AGENDA ASLINYA NANTI
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-400/30 text-white font-bold px-8 py-4 sm:py-5 rounded-full text-base sm:text-lg transition-all backdrop-blur-sm transform hover:-translate-y-1"
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
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Info Event & Twibbon
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white p-1.5 rounded-lg">
                <img
                  src="/logo-dpp-ika.png"
                  alt="Logo"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h3 className="text-white font-black text-xl">IKA UII DIY</h3>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              Wadah silaturahmi, sinergi, dan kolaborasi para alumni Universitas
              Islam Indonesia di wilayah Daerah Istimewa Yogyakarta.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">
              Tautan Cepat
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="hover:text-blue-400 transition-colors"
                >
                  Portal Utama
                </Link>
              </li>
              <li>
                <Link
                  href="/virtual-run/register"
                  className="hover:text-blue-400 transition-colors"
                >
                  Pendaftaran Event
                </Link>
              </li>
              <li>
                <Link
                  href="/virtual-run/dashboard"
                  className="hover:text-blue-400 transition-colors"
                >
                  Dashboard Pelari
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">
              Kontak & Dukungan
            </h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> ika.diy@uii.ac.id
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Daerah Istimewa Yogyakarta, Indonesia
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-xs text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p>
            &copy; {new Date().getFullYear()} DPW IKA UII DIY. Hak Cipta
            Dilindungi.
          </p>
          <p>Made with ❤️ for UII Alumni</p>
        </div>
      </footer>
    </div>
  );
}
