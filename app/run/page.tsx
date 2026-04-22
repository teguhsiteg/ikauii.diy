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
import { useRouter } from "next/navigation";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

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
  const offlineStatus = settings?.offlineStatus || "tutup"; // 'buka', 'coming_soon', 'tutup'

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
                Est. 2026
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
          {settings?.offlineComingSoonText || "Tahun 2026"}
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
          <div className="w-24 h-32 bg-white rounded-t-full rounded-b-xl p-3 flex flex-col items-center justify-center shadow-xl">
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
            <span>✉️</span> Hubungi Panitia
          </a>
        </div>
      </div>
    );
  }

  // =========================================
  // 3. TAMPILAN BUKA (NORMAL)
  // =========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-300 selection:text-emerald-900 flex flex-col">
      <NavbarPublic />

      {/* HERO SECTION */}
      <section className="relative pt-[180px] pb-20 md:pt-[220px] lg:pt-[260px] lg:pb-32 overflow-hidden bg-gradient-to-br from-emerald-900 to-teal-950">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        <div className="absolute -left-20 -bottom-20 text-7xl md:text-9xl opacity-10 rotate-12 pointer-events-none select-none">
          🏃‍♂️
        </div>
        <div className="absolute right-10 top-60 text-6xl md:text-8xl opacity-10 -rotate-12 pointer-events-none select-none">
          🌳
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-20 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full mb-8 shadow-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[10px] md:text-xs font-black text-emerald-50 uppercase tracking-[0.2em]">
              Official Offline Run Event
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight mb-6 max-w-4xl leading-[1.1]">
            Lari Bersama,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-yellow-300">
              Tebarkan Manfaat
            </span>
          </h1>

          <p className="text-base md:text-xl text-emerald-100/80 mb-10 max-w-2xl font-medium leading-relaxed">
            Satu rute, ribuan semangat. Mari berkumpul dan berlari menyusuri
            keindahan {settings.offlineLocation || "Yogyakarta"} bersama
            keluarga besar IKA UII.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12 w-full">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 w-full md:w-auto">
              <span className="text-2xl md:text-3xl">📍</span>
              <div className="text-left">
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-0.5">
                  Lokasi Start / Finish
                </p>
                <p className="text-white font-black text-sm md:text-base">
                  {settings.offlineLocation || "Yogyakarta"}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4 w-full md:w-auto">
              <span className="text-2xl md:text-3xl">📅</span>
              <div className="text-left">
                <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-emerald-300 font-bold mb-0.5">
                  Waktu Pelaksanaan
                </p>
                <p className="text-white font-black text-sm md:text-base">
                  {settings.offlineDate
                    ? new Date(settings.offlineDate).toLocaleDateString(
                        "id-ID",
                        { day: "numeric", month: "long", year: "numeric" },
                      )
                    : "-"}
                </p>
                <p className="text-xs text-emerald-200 font-medium">
                  Pukul {settings.offlineTime || "06:00"} WIB
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full md:w-auto">
            <Link
              href="/run/daftar"
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black px-10 py-4 md:px-12 md:py-5 rounded-full text-base md:text-lg transition-all shadow-xl shadow-emerald-500/20 transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Amankan Slot Sekarang &rarr;
            </Link>

            {/* TOMBOL TIMELINE */}
            <button
              onClick={() => setIsTimelineModalOpen(true)}
              className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold px-10 py-4 md:px-10 md:py-5 rounded-full text-base md:text-lg transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              📅 Jadwal Pendaftaran
            </button>
          </div>

          <p className="text-[10px] md:text-xs text-emerald-200/60 mt-6 font-medium tracking-wide">
            *Kuota keseluruhan terbatas {settings.offlineQuota || 0} peserta.
          </p>
        </div>
      </section>

      {/* RACE PACK & ROUTE SECTION */}
      <section className="py-16 md:py-24 bg-[#F4F7FB] border-b border-slate-200 w-full relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

            {/* BOX CEK TIKET DI DALAM SECTION INI */}
            <div className="max-w-2xl mx-auto bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 transform -translate-y-4 hover:-translate-y-6 transition-transform duration-300">
              <div className="text-left flex-grow">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2">
                  <span>🎫</span> Sudah Mendaftar?
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
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

          <div className="grid lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Jersey */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
              <div className="aspect-square bg-slate-50 rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {/* 🔥 DIRUBAH KE urlJerseyOffline 🔥 */}
                {settings?.urlJerseyOffline ? (
                  <img
                    src={settings.urlJerseyOffline}
                    alt="Jersey Pelari"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <span className="text-5xl md:text-6xl mb-2 grayscale opacity-50">
                      👕
                    </span>
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

            {/* Peta Rute */}
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
                    <span className="text-5xl md:text-6xl mb-2 grayscale opacity-50">
                      🗺️
                    </span>
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
                Pelajari jalur lari yang akan dilewati. Lengkap dengan informasi
                titik kumpul, water station, dan pos medis.
              </p>
            </div>

            {/* Medali */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-xl transition-shadow group flex flex-col h-full">
              <div className="aspect-square bg-slate-50 rounded-3xl mb-6 flex items-center justify-center overflow-hidden relative">
                <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {/* 🔥 DIRUBAH KE urlMedaliOffline 🔥 */}
                {settings?.urlMedaliOffline ? (
                  <img
                    src={settings.urlMedaliOffline}
                    alt="Medali Finisher"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="text-slate-300 flex flex-col items-center">
                    <span className="text-5xl md:text-6xl mb-2 grayscale opacity-50">
                      🏅
                    </span>
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
                Medali logam 3D die-cast eksklusif. Diberikan khusus bagi pelari
                yang berhasil melewati garis finish!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="py-16 md:py-24 bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
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

        {/* 🔥 DIRUBAH JADI GRID AGAR BISA SEBARIS (3 KOLOM DI DESKTOP) 🔥 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {settings?.offlinePackages && settings.offlinePackages.length > 0 ? (
            settings.offlinePackages.map((pkg: any) => {
              // 🔥 GANTI JADI MEMBACA DATABASE (BUKAN INDEX LAGI) 🔥
              const isHighlight = pkg.isHighlight === true;

              const terisi = packageCounts[pkg.id] || 0;
              const batasKuota = Number(pkg.kuota) || 0;
              const sisaKuota = Math.max(0, batasKuota - terisi);
              const isSoldOut = sisaKuota <= 0;
              const persentase =
                batasKuota > 0 ? Math.min(100, (terisi / batasKuota) * 100) : 0;

              return (
                <div
                  key={pkg.id}
                  className={`w-full rounded-[2rem] p-6 border flex flex-col relative overflow-hidden transition-all ${
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

                  {/* 🔥 LIST BENEFIT: MURNI DARI ADMIN 🔥 */}
                  <ul className="space-y-3 mb-8 flex-grow">
                    {pkg.benefit &&
                      pkg.benefit.split(",").map((item: string, i: number) => (
                        <li
                          key={i}
                          className={`flex items-start gap-3 text-xs md:text-sm font-medium ${
                            isHighlight ? "text-emerald-50" : "text-slate-700"
                          }`}
                        >
                          <span
                            className={`${
                              isHighlight
                                ? "text-yellow-400"
                                : "text-emerald-500"
                            } font-bold mt-0.5`}
                          >
                            ✓
                          </span>
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
                      className={`w-full text-center font-bold py-3.5 md:py-4 rounded-xl transition-all shadow-md text-sm mt-auto ${
                        isHighlight
                          ? "bg-emerald-500 hover:bg-emerald-400 text-emerald-950"
                          : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      Daftar Kategori {pkg.jarak}
                    </Link>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-slate-500 font-bold py-10 col-span-full text-center">
              Paket lari offline belum tersedia.
            </div>
          )}
        </div>
      </section>

      {/* MODAL TIMELINE PENDAFTARAN (POPUP) */}
      {isTimelineModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-emerald-50 px-6 py-5 flex justify-between items-center border-b border-emerald-100">
              <h3 className="font-black text-emerald-900 flex items-center gap-2">
                <span className="text-xl">📅</span> Timeline Kegiatan
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
                    <p className="text-[10px] text-rose-500 font-bold mt-2 bg-rose-50 p-2 rounded-lg border border-rose-100">
                      🎉 {settings.offlineJadwalPuncakAcara}
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

      {/* MODAL PENCARIAN TIKET (POPUP LAMA) */}
      {isTicketModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-md w-full bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="bg-emerald-50 px-6 py-5 flex justify-between items-center border-b border-emerald-100">
              <h3 className="font-black text-emerald-900 flex items-center gap-2">
                <span className="text-xl">🎫</span> Cari Tiket Saya
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
                    <span>⚠️</span> {ticketError}
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
