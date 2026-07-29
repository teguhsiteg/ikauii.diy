"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// --- IKON VERIFIED BADGE (Diperbaiki agar selaras sejajar dengan teks) ---
const VerifiedBadge = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="#3B82F6"
    className="shrink-0 shadow-sm"
    viewBox="0 0 16 16"
  >
    <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708" />
  </svg>
);

// --- HELPER URL FORMATTER (Sabuk Pengaman Teks) 🔥 ---
const formatUrl = (url?: string) => {
  if (!url) return "#";
  const cleanUrl = url.trim();

  // Jika admin salah paste paragraf berspasi ke kolom URL, batalkan klik
  if (cleanUrl.includes(" ") && !cleanUrl.includes("%20")) {
    return "#";
  }

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://"))
    return cleanUrl;
  return `https://${cleanUrl}`;
};

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/,
  );
  return match ? match[1] : null;
};

// --- COUNTDOWN COMPONENT ---
const LinkCountdown = ({
  expiresAt,
  theme,
}: {
  expiresAt: string;
  theme: string;
}) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const distance = new Date(expiresAt).getTime() - new Date().getTime();
      if (distance < 0) {
        setTimeLeft("EXPIRED");
        clearInterval(interval);
        return;
      }
      const d = Math.floor(distance / (1000 * 60 * 60 * 24));
      const h = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${d}d ${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!expiresAt || !timeLeft) return null;
  if (timeLeft === "EXPIRED") return null;

  return (
    <div
      className={`text-[10px] font-mono font-bold mb-2 px-3 py-1 rounded-md inline-flex items-center gap-1.5 shadow-sm ${theme === "dark" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "bg-rose-100 text-rose-700 border border-rose-200"}`}
    >
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
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      ENDS IN: {timeLeft}
    </div>
  );
};

export default function PublicBioPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [typedDescription, setTypedDescription] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchBio = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "bio_engine"));
        if (snap.exists()) setData(snap.data());
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBio();
  }, []);

  useEffect(() => {
    if (data?.profile?.description) {
      let i = 0;
      const fullText = data.profile.description;
      setTypedDescription("");
      const interval = setInterval(() => {
        if (i < fullText.length) {
          setTypedDescription(fullText.substring(0, i + 1));
          i++;
        } else {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [data]);

  // Click Tracker Logic Asinkron
  const trackClick = async (link: any, collectionName: string = "links") => {
    try {
      const ref = doc(db, "settings", "bio_engine");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const currentData = snap.data();
        const updatedArray = (currentData[collectionName] || []).map(
          (l: any) => {
            if (l.id === link.id) return { ...l, clicks: (l.clicks || 0) + 1 };
            return l;
          },
        );
        await updateDoc(ref, { [collectionName]: updatedArray });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLinkClick = (
    e: React.MouseEvent,
    link: any,
    collectionName: string = "links",
  ) => {
    const isExpired =
      link.expiresAt && new Date(link.expiresAt).getTime() < now;
    const finalUrl = formatUrl(link.url);

    // Cegah klik jika URL kosong, URL berisi paragraf error, atau waktu kedaluwarsa
    if (isExpired || finalUrl === "#") {
      e.preventDefault();
      return;
    }

    trackClick(link, collectionName);
  };

  if (isLoading)
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center font-mono text-[#FFD700] text-sm tracking-widest">
        <span className="animate-pulse">Loading System...</span>
      </div>
    );
  if (!data)
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center font-mono text-slate-500 text-sm">
        Error 404: Not Configured.
      </div>
    );

  const { profile, links = [], news = [] } = data;
  const isDark = profile.theme !== "light";
  const highlightColor = profile.highlightColor || "#FFD700";

  const activeNews = news.filter((n: any) => n.isActive);
  const shouldMarquee = activeNews.length > 2;

  // Komponen untuk Kartu Berita Publik
  const NewsCardPublic = ({ item }: { item: any }) => {
    const finalUrl = formatUrl(item.url);
    const isErrorUrl = finalUrl === "#";

    return (
      <a
        href={finalUrl}
        target={isErrorUrl ? "_self" : "_blank"}
        rel="noopener noreferrer"
        onClick={(e) => handleLinkClick(e, item, "news")}
        className={`w-[240px] sm:w-[280px] shrink-0 rounded-2xl border overflow-hidden flex flex-col transition-transform shadow-lg block
          ${isErrorUrl ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:-translate-y-1"}
          ${isDark ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-[var(--theme-highlight)]/50" : "bg-white border-slate-200 hover:border-[var(--theme-highlight)]"}
        `}
      >
        {item.imageUrl && (
          <div className="h-32 relative overflow-hidden bg-slate-200 border-b border-white/10">
            <img
              src={item.imageUrl}
              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              alt="Thumbnail"
            />
          </div>
        )}
        <div className="p-4 flex-1 flex flex-col">
          <h4
            className={`text-sm font-bold line-clamp-2 leading-tight ${isDark ? "text-white" : "text-slate-800"}`}
          >
            {item.title}
          </h4>
          <p className="text-xs text-slate-500 mt-2 line-clamp-2 flex-1 leading-relaxed">
            {item.snippet}
          </p>
          <div className="mt-4 flex items-center justify-between text-[10px] sm:text-xs font-bold text-[var(--theme-highlight)] uppercase tracking-widest">
            <span>{isErrorUrl ? "Cek Tautan Admin" : "Baca Detail"}</span>
            <span>→</span>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 sm:p-8 font-sans transition-colors duration-500
      ${isDark ? "bg-[#050810] text-slate-300" : "bg-slate-200 text-slate-800"}
    `}
      style={{ "--theme-highlight": highlightColor } as React.CSSProperties}
    >
      {/* CSS GLOBAL MARQUEE PUBLIC */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee-public { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
        .animate-marquee-public { display: flex; width: max-content; animation: marquee-public 25s linear infinite; }
        .animate-marquee-public:hover { animation-play-state: paused; }
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150,150,150,0.3); border-radius: 10px; }
      `,
        }}
      />

      {/* Background Glow Effect */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl h-[600px] blur-[120px] pointer-events-none rounded-full
        ${isDark ? "bg-[#1A3A8F]/30" : "bg-blue-300/40"}
      `}
      ></div>

      {/* Main Window Container */}
      <div
        className={`w-full max-w-[500px] rounded-[2rem] shadow-2xl border overflow-hidden relative z-10 transition-colors duration-500 animate-in zoom-in-95
        ${isDark ? "bg-[#0A0F1D] border-white/10 shadow-black/50" : "bg-white border-slate-200 shadow-slate-300/50"}
      `}
      >
        {/* HEADER EDITOR */}
        <div
          className={`px-5 py-3.5 flex items-center justify-between border-b sticky top-0 z-20 backdrop-blur-md
          ${isDark ? "bg-[#060913]/90 border-white/10" : "bg-slate-50/90 border-slate-200"}
        `}
        >
          <div className="flex gap-1.5 cursor-default hover:opacity-80 transition-opacity">
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm border border-white/10"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm border border-white/10"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm border border-white/10"></div>
          </div>
          <div className="text-[10px] sm:text-xs font-mono text-slate-500 tracking-widest bg-black/5 px-3 py-1 rounded-full border border-black/5">
            ~/UII JAYA ALUMNI BERDAYA\~
          </div>
          <div className="w-8 sm:w-12"></div>
        </div>

        <div className="p-5 sm:p-8 space-y-10">
          {/* 1. PROFILE SECTION */}
          <div className="flex flex-col items-center text-center space-y-5">
            <div className="relative group">
              <div className="absolute inset-0 rounded-full blur-xl opacity-40 animate-pulse bg-[var(--theme-highlight)]"></div>
              <div
                className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[3px] border-[var(--theme-highlight)]/50 flex items-center justify-center overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-105
                ${isDark ? "bg-[#060913]" : "bg-white"}
              `}
              >
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-cover p-1.5"
                  />
                ) : (
                  <span className="font-black text-2xl sm:text-3xl tracking-tighter text-[var(--theme-highlight)]">
                    IKA
                  </span>
                )}
              </div>
            </div>

            <div className="w-full px-2">
              {/* 🔥 Teks Responsif & Wrapping yang Sempurna 🔥 */}
              <h1 className="font-mono text-xs sm:text-sm md:text-base font-bold flex flex-wrap justify-center items-center gap-x-2 gap-y-1.5 w-full leading-normal">
                <span className="text-pink-500">const</span>
                <span className="text-blue-500">admin</span>
                <span className={isDark ? "text-white" : "text-slate-800"}>
                  =
                </span>
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[var(--theme-highlight)] break-words text-center">
                    "{profile.name}"
                  </span>
                  <VerifiedBadge />
                </span>
              </h1>

              <div className="min-h-[60px] mt-4 flex justify-center w-full">
                <div
                  className={`w-full font-mono text-[10px] sm:text-xs md:text-sm leading-relaxed text-left inline-block p-4 rounded-xl border break-words ${isDark ? "bg-[#060913] border-white/5 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-600"}`}
                >
                  <span className="text-slate-400/50 select-none">/**</span>
                  <br />
                  <span
                    className={isDark ? "text-slate-300" : "text-slate-700"}
                  >
                    <span className="text-slate-400/50 select-none"> * </span>
                    {typedDescription}
                    <span className="animate-pulse font-black text-[var(--theme-highlight)]">
                      _
                    </span>
                  </span>
                  <br />
                  <span className="text-slate-400/50 select-none"> */</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. NEWS SECTION */}
          {activeNews.length > 0 && (
            <div className="space-y-3 -mx-5 sm:-mx-8 overflow-hidden">
              <h2 className="font-mono text-[10px] sm:text-xs text-slate-500 font-bold uppercase flex items-center gap-2 px-5 sm:px-8">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-500 animate-pulse rounded-full shadow-[0_0_8px_#EF4444]"></span>{" "}
                LATEST NEWS
              </h2>

              <div className="overflow-hidden w-full relative">
                <div
                  className={`absolute top-0 bottom-0 left-0 w-8 sm:w-10 z-10 pointer-events-none bg-gradient-to-r ${isDark ? "from-[#0A0F1D] to-transparent" : "from-white to-transparent"}`}
                ></div>
                <div
                  className={`absolute top-0 bottom-0 right-0 w-8 sm:w-10 z-10 pointer-events-none bg-gradient-to-l ${isDark ? "from-[#0A0F1D] to-transparent" : "from-white to-transparent"}`}
                ></div>

                {shouldMarquee ? (
                  <div className="animate-marquee-public cursor-grab active:cursor-grabbing">
                    <div className="flex gap-4 pl-5 sm:pl-6 pr-4">
                      {activeNews.map((item: any, idx: number) => (
                        <NewsCardPublic
                          key={`m1-${item.id}-${idx}`}
                          item={item}
                        />
                      ))}
                    </div>
                    <div className="flex gap-4 pr-4">
                      {activeNews.map((item: any, idx: number) => (
                        <NewsCardPublic
                          key={`m2-${item.id}-${idx}`}
                          item={item}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4 px-5 sm:px-6 overflow-x-auto custom-scrollbar pb-2">
                    {activeNews.map((item: any, idx: number) => (
                      <NewsCardPublic key={`s-${item.id}-${idx}`} item={item} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. LINKS SECTION */}
          <div className="space-y-3 sm:space-y-4 w-full">
            {links
              .filter((l: any) => l.isActive)
              .map((link: any) => {
                const isExpired =
                  link.expiresAt && new Date(link.expiresAt).getTime() < now;
                const ytId =
                  link.type === "video" ? getYoutubeId(link.url) : null;
                const finalUrl = formatUrl(link.url);
                const isErrorUrl = finalUrl === "#";

                return (
                  <div
                    key={link.id}
                    className="relative animate-in slide-in-from-bottom-4 duration-500 fill-both"
                    style={{ animationDelay: `${links.indexOf(link) * 100}ms` }}
                  >
                    <LinkCountdown
                      expiresAt={link.expiresAt}
                      theme={profile.theme}
                    />

                    {link.label && (
                      <div
                        className={`absolute -top-3 -right-2 z-20 text-[9px] sm:text-[10px] font-black uppercase px-2.5 sm:px-3 py-1 rounded shadow-lg rotate-3 ${isDark ? "bg-rose-500 text-white" : "bg-rose-500 text-white"}`}
                      >
                        {link.label}
                      </div>
                    )}

                    {link.type === "video" &&
                    ytId &&
                    !isExpired &&
                    !isErrorUrl ? (
                      <a
                        href={finalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => handleLinkClick(e, link, "links")}
                        className={`block rounded-2xl overflow-hidden border shadow-xl relative group cursor-pointer transition-transform duration-300 hover:-translate-y-1
                        ${link.isHighlight ? "border-[var(--theme-highlight)] ring-2 ring-[var(--theme-highlight)]/50" : isDark ? "border-white/10" : "border-slate-300"}
                      `}
                      >
                        <div className="aspect-video relative bg-black">
                          <img
                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            alt="Video Thumbnail"
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center pl-1 sm:pl-1.5 shadow-2xl group-hover:bg-red-600 transition-colors group-hover:scale-110">
                              <svg
                                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div
                          className={`p-3.5 sm:p-5 flex items-center justify-between ${isDark ? "bg-[#060913] text-slate-200" : "bg-white text-slate-800"}`}
                        >
                          <div className="font-mono text-xs sm:text-sm md:text-base font-bold truncate pr-4">
                            {link.title}
                          </div>
                          <svg
                            className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform group-hover:translate-x-1 ${link.isHighlight ? "text-[var(--theme-highlight)]" : "text-slate-400"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </div>
                      </a>
                    ) : (
                      <a
                        href={isExpired || isErrorUrl ? undefined : finalUrl}
                        target={isExpired || isErrorUrl ? "_self" : "_blank"}
                        rel="noopener noreferrer"
                        onClick={(e) => handleLinkClick(e, link, "links")}
                        className={`group block w-full p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between text-left
                        ${
                          isExpired || isErrorUrl
                            ? isDark
                              ? "bg-slate-900 border-white/5 opacity-50 grayscale cursor-not-allowed"
                              : "bg-slate-100 border-slate-200 opacity-60 grayscale cursor-not-allowed"
                            : link.isHighlight
                              ? `border-[var(--theme-highlight)] bg-[var(--theme-highlight)]/10 shadow-[0_0_20px_var(--theme-highlight)]/30 hover:bg-[var(--theme-highlight)] hover:-translate-y-1`
                              : isDark
                                ? "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1"
                                : "bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md hover:-translate-y-1"
                        }
                      `}
                      >
                        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden min-w-0 flex-1">
                          <span
                            className={`font-mono text-xs sm:text-sm font-bold transition-colors shrink-0
                          ${isExpired || isErrorUrl ? "text-slate-600" : link.isHighlight ? (isDark ? "text-[var(--theme-highlight)] group-hover:text-slate-900" : "text-[var(--theme-highlight)] group-hover:text-white") : "text-blue-500 group-hover:text-blue-400"}
                        `}
                          >
                            {link.type === "video" ? "▶_" : ">_"}
                          </span>
                          <span
                            className={`font-bold text-xs sm:text-sm md:text-base truncate transition-colors
                          ${isExpired || isErrorUrl ? "text-slate-500 line-through" : link.isHighlight ? (isDark ? "text-[var(--theme-highlight)] group-hover:text-slate-900" : "text-slate-800 group-hover:text-white") : isDark ? "text-slate-200 group-hover:text-white" : "text-slate-700"}
                        `}
                          >
                            {isExpired
                              ? "[LOCKED] " + link.title
                              : isErrorUrl
                                ? "https://www.merriam-webster.com/dictionary/error Cek Admin"
                                : link.title}
                          </span>
                        </div>
                        {!isExpired && !isErrorUrl && (
                          <svg
                            className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ml-2 transition-all duration-300 group-hover:translate-x-1 ${link.isHighlight ? (isDark ? "text-[var(--theme-highlight)] group-hover:text-slate-900" : "text-[var(--theme-highlight)] group-hover:text-white") : "text-slate-400 group-hover:text-white"}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        )}
                      </a>
                    )}
                  </div>
                );
              })}
          </div>

          {/* 4. FOOTER & SOSIAL MEDIA */}
          <div
            className={`pt-8 sm:pt-10 flex flex-col items-center justify-center gap-5 sm:gap-6 border-t
            ${isDark ? "border-white/10 text-slate-400" : "border-slate-200 text-slate-500"}
          `}
          >
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {profile.socials?.instagram && (
                <a
                  href={formatUrl(
                    profile.socials.instagram.includes("instagram.com")
                      ? profile.socials.instagram
                      : `instagram.com/${profile.socials.instagram}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-pink-500 hover:-translate-y-1 transition-all"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
              )}
              {profile.socials?.tiktok && (
                <a
                  href={formatUrl(
                    profile.socials.tiktok.includes("tiktok.com")
                      ? profile.socials.tiktok
                      : `tiktok.com/@${profile.socials.tiktok}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-black transition-all hover:-translate-y-1"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              )}
              {profile.socials?.youtube && (
                <a
                  href={formatUrl(profile.socials.youtube)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-red-500 transition-all hover:-translate-y-1"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
              {profile.socials?.linkedin && (
                <a
                  href={formatUrl(profile.socials.linkedin)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-all hover:-translate-y-1"
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.15 1.46-2.15 2.96v5.7h-3.56V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z" />
                  </svg>
                </a>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10B981]"></span>
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-widest font-bold">
                  System Online
                </span>
              </div>
              <div className="text-[8px] sm:text-[9px] font-mono opacity-50 uppercase tracking-widest text-center">
                &copy; {new Date().getFullYear()} IKA UII DIY. ENGINE V1.0.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
