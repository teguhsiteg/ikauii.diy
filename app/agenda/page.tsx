"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

// --- TYPES ---
interface AgendaItem {
  id: string;
  judul: string;
  tanggal: string;
  waktu: string;
  koordinator: string;
  format: string;
  tiket: string;
  imgUrl?: string;
  posterUrl?: string;
  isComingSoon?: boolean;
}

export default function AgendaPage() {
  const [agendas, setAgendas] = useState<AgendaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // STATE PENCARIAN & FILTER
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "Semua" | "Akan Datang" | "Selesai"
  >("Semua");

  // FETCH DATA DARI FIREBASE
  useEffect(() => {
    const q = query(collection(db, "agenda"), orderBy("tanggal", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AgendaItem[];
        setAgendas(data);
        setIsLoading(false);
      },
      (error) => {
        console.error("Gagal load agenda:", error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // LOGIKA PEMROSESAN WAKTU & FILTERING
  const processedAgendas = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let processed = agendas.map((agenda) => {
      let isPast = false;
      let diffDays = -1;
      let daysLeftText = "";
      let badgeColor = "bg-[#FFF0E6] text-[#FF5A36]";

      if (!agenda.isComingSoon && agenda.tanggal) {
        const eventDate = new Date(agenda.tanggal);
        
        if (!isNaN(eventDate.getTime())) {
          eventDate.setHours(0, 0, 0, 0);
  
          const diffTime = eventDate.getTime() - today.getTime();
          diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
          if (diffDays > 0) {
            daysLeftText = `${diffDays} HARI LAGI`;
          } else if (diffDays === 0) {
            daysLeftText = "HARI INI";
            badgeColor = "bg-green-100 text-green-700 animate-pulse";
          } else {
            isPast = true;
            daysLeftText = "SELESAI";
            badgeColor = "bg-slate-200 text-slate-500 border border-slate-300";
          }
        } else {
          // Invalid date handling
          isPast = false;
          diffDays = -1;
        }
      }

      return { ...agenda, isPast, diffDays, daysLeftText, badgeColor };
    });

    // 1. Filter by Search
    if (searchQuery.trim()) {
      processed = processed.filter((a) =>
        a.judul.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // 2. Filter by Status Tab
    if (activeFilter === "Akan Datang") {
      processed = processed.filter((a) => !a.isPast);
    } else if (activeFilter === "Selesai") {
      processed = processed.filter((a) => a.isPast);
    }

    return processed;
  }, [agendas, searchQuery, activeFilter]);

  // SOROTAN (FEATURED): Cari agenda "Akan Datang" yang paling dekat harinya
  const featuredAgenda = useMemo(() => {
    const upcoming = processedAgendas.filter(
      (a) => !a.isPast && !a.isComingSoon && a.diffDays >= 0,
    );
    // Karena query orderBy asc, elemen pertama biasanya yang paling dekat
    return upcoming.length > 0 && activeFilter !== "Selesai" && !searchQuery
      ? upcoming[0]
      : null;
  }, [processedAgendas, activeFilter, searchQuery]);

  // Hapus featured dari list bawah agar tidak duplikat
  const gridAgendas = featuredAgenda
    ? processedAgendas.filter((a) => a.id !== featuredAgenda.id)
    : processedAgendas;

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <NavbarPublic />

      <main className="flex-grow pb-24">
        {/* ================= HERO & SEARCH SECTION ================= */}
        <section className="bg-[#0F2147] pt-60 pb-20 px-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-800 rounded-full blur-[100px] opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-600 rounded-full blur-[100px] opacity-20 translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

          <div className="max-w-4xl mx-auto relative z-10 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h4 className="flex items-center justify-center gap-2 md:gap-3 text-[#FCD116] font-black tracking-[0.2em] uppercase text-xs mb-4">
              <span className="w-8 h-1 bg-[#FCD116] rounded-full"></span>
              Jadwal Silaturahmi
              <span className="w-8 h-1 bg-[#FCD116] rounded-full"></span>
            </h4>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              Pusat Informasi Agenda
            </h1>
            <p className="text-slate-300 text-sm md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Eksplorasi dan ikuti berbagai program strategis, kajian
              intelektual, event olahraga, serta forum silaturahmi IKA UII DIY.
            </p>

            {/* SEARCH BAR */}
            <div className="max-w-2xl mx-auto relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="w-6 h-6 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama agenda atau acara..."
                className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FCD116] focus:bg-white/20 transition-all font-medium text-base shadow-2xl"
              />
            </div>
          </div>
        </section>

        {/* ================= FILTER PILLS ================= */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-20">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-2 flex items-center gap-2 overflow-x-auto custom-scrollbar">
            {["Semua", "Akan Datang", "Selesai"].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter as any)}
                className={`whitespace-nowrap px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${activeFilter === filter ? "bg-[#0F2147] text-white shadow-md" : "bg-transparent text-slate-500 hover:bg-slate-100"}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0F2147] rounded-full animate-spin"></div>
            </div>
          ) : processedAgendas.length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 shadow-sm mt-10">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="font-black text-slate-800 text-xl mb-2">
                Agenda Tidak Ditemukan
              </h3>
              <p className="text-slate-500 text-sm font-medium max-w-md mx-auto">
                {searchQuery
                  ? `Tidak ada acara yang cocok dengan kata kunci "${searchQuery}".`
                  : "Belum ada agenda yang dijadwalkan pada kategori ini."}
              </p>
            </div>
          ) : (
            <>
              {/* ================= SOROTAN UTAMA (FEATURED) ================= */}
              {featuredAgenda && (
                <div className="mb-12 animate-in fade-in duration-700">
                  <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>{" "}
                    Segera Hadir
                  </h3>
                  <Link
                    href={`/agenda/${featuredAgenda.id}`}
                    className="group block bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/2 aspect-[4/3] md:aspect-auto relative overflow-hidden bg-slate-100">
                        {featuredAgenda.imgUrl || featuredAgenda.posterUrl ? (
                          (() => {
                            const url = featuredAgenda.imgUrl || featuredAgenda.posterUrl;
                            const isRawVideo = url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');
                            return isRawVideo ? (
                              <video
                                src={url}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            ) : (
                              <img
                                src={url}
                                alt={featuredAgenda.judul}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            );
                          })()
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center opacity-20">
                            <img
                              src="/logo-dpp-ika.png"
                              className="w-32 h-32 object-contain"
                            />
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <span
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest shadow-md ${featuredAgenda.badgeColor}`}
                          >
                            {featuredAgenda.daysLeftText}
                          </span>
                        </div>
                      </div>
                      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#1A73E8] mb-3">
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
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {!isNaN(new Date(featuredAgenda.tanggal).getTime()) 
                            ? new Date(featuredAgenda.tanggal).toLocaleDateString(
                                "id-ID",
                                {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )
                            : featuredAgenda.tanggal}{" "}
                          • {featuredAgenda.waktu} WIB
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-slate-900 mb-4 leading-tight group-hover:text-[#1A73E8] transition-colors">
                          {featuredAgenda.judul}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 mb-8">
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-5 h-5 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>{" "}
                            {featuredAgenda.format}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg
                              className="w-5 h-5 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>{" "}
                            Penyelenggara:{" "}
                            {featuredAgenda.koordinator || "Admin"}
                          </div>
                        </div>
                        <div className="mt-auto">
                          <span className="inline-flex items-center justify-center gap-2 bg-[#0F2147] text-white px-8 py-4 rounded-xl font-bold text-sm group-hover:bg-[#1A73E8] transition-colors">
                            Lihat Detail Acara{" "}
                            <svg
                              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* ================= GRID AGENDA LAINNYA ================= */}
              {gridAgendas.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in duration-700">
                  {gridAgendas.map((agenda) => {
                    const hasImage = agenda.imgUrl || agenda.posterUrl;

                    return (
                      <Link
                        key={agenda.id}
                        href={`/agenda/${agenda.id}`}
                        className={`rounded-[24px] p-2.5 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col group border bg-white ${agenda.isPast ? "border-slate-200 opacity-90 hover:opacity-100 hover:-translate-y-1" : "border-slate-200 hover:-translate-y-2 hover:border-blue-300"}`}
                      >
                        <div className="w-full aspect-[4/3] rounded-[16px] overflow-hidden bg-slate-100 relative shrink-0">
                          {hasImage ? (
                            (() => {
                              const isRawVideo = hasImage.match(/\.(mp4|webm|ogg)$/i) || hasImage.includes('/video/upload/');
                              return isRawVideo ? (
                                <video
                                  src={hasImage}
                                  autoPlay
                                  loop
                                  muted
                                  playsInline
                                  className={`w-full h-full object-cover transition-transform duration-700 ${agenda.isPast ? "grayscale-[0.5] group-hover:grayscale-0" : "group-hover:scale-105"}`}
                                />
                              ) : (
                                <img
                                  src={hasImage}
                                  onError={(e) => {
                                    e.currentTarget.src = "/logo-dpp-ika.png";
                                    e.currentTarget.className =
                                      "w-1/2 h-1/2 object-contain m-auto opacity-30";
                                  }}
                                  alt={agenda.judul}
                                  className={`w-full h-full object-cover transition-transform duration-700 ${agenda.isPast ? "grayscale-[0.5] group-hover:grayscale-0" : "group-hover:scale-105"}`}
                                  loading="lazy"
                                />
                              );
                            })()
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-blue-50/50">
                              <img
                                src="/logo-dpp-ika.png"
                                alt="Logo"
                                className="w-16 h-16 object-contain opacity-20"
                              />
                            </div>
                          )}

                          {agenda.isPast && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity group-hover:bg-black/20">
                              <span className="bg-black/70 text-white font-black px-4 py-2 rounded-full text-xs uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                                Acara Selesai
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4 mb-3 px-2">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${agenda.isComingSoon ? "bg-slate-100 text-slate-500" : agenda.isPast ? "bg-slate-100 text-slate-500" : "bg-[#FFF0E6] text-[#FF5A36]"}`}
                          >
                            {agenda.isComingSoon
                              ? "COMING SOON"
                              : agenda.isPast
                                ? "ARCHIVE"
                                : "UPCOMING"}
                          </span>
                          {!agenda.isComingSoon && agenda.daysLeftText && (
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${agenda.badgeColor}`}
                            >
                              {agenda.daysLeftText}
                            </span>
                          )}
                        </div>

                        <div className="px-2 flex flex-col flex-grow">
                          <h3
                            className={`font-bold text-xl leading-snug mb-3 line-clamp-2 transition-colors ${agenda.isPast ? "text-slate-700 group-hover:text-slate-900" : "text-slate-900 group-hover:text-[#1A73E8]"}`}
                          >
                            {agenda.judul}
                          </h3>

                          <div className="flex flex-col gap-2 mb-5">
                            <div
                              className={`flex items-center gap-2 text-[13px] font-medium ${agenda.isPast ? "text-slate-500" : "text-slate-600"}`}
                            >
                              <svg
                                className="w-4 h-4 text-slate-400 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="truncate">
                                {agenda.isComingSoon
                                  ? "Tanggal akan diumumkan"
                                  : (!isNaN(new Date(agenda.tanggal).getTime())
                                      ? `${new Date(agenda.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} • ${agenda.waktu} WIB`
                                      : `${agenda.tanggal} • ${agenda.waktu} WIB`)}
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-2 text-[13px] font-medium ${agenda.isPast ? "text-slate-500" : "text-slate-600"}`}
                            >
                              <svg
                                className="w-4 h-4 text-slate-400 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                              <span className="truncate">{agenda.format}</span>
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border ${agenda.isPast ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-blue-50 text-blue-600 border-blue-100"}`}
                            >
                              {agenda.koordinator
                                ? agenda.koordinator.charAt(0).toUpperCase()
                                : "A"}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                PIC / Penyelenggara
                              </span>
                              <span
                                className={`text-sm font-bold truncate max-w-[180px] ${agenda.isPast ? "text-slate-600" : "text-slate-800"}`}
                              >
                                {agenda.koordinator || "Admin IKA UII"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <FooterPublic />
    </div>
  );
}
