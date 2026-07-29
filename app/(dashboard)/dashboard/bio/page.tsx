"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- IKON MATERIAL ADMIN (CLEAN & NO EMOJIS) ---
const IconPlus = () => (
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
      d="M12 4v16m8-8H4"
    />
  </svg>
);
const IconSave = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IconTrash = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const IconCheck = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IconChart = () => (
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
      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
    />
  </svg>
);
const IconChevronDown = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 9l-7 7-7-7"
    />
  </svg>
);
const IconGrip = () => (
  <svg
    className="w-4 h-4 text-slate-400 cursor-grab active:cursor-grabbing"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 8h16M4 16h16"
    />
  </svg>
);
const IconSettings = () => (
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
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const IconLink = () => (
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
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);
const IconVideo = () => (
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
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);
const IconNews = () => (
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
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
    />
  </svg>
);

// --- IKON SOSMED ---
const SocIcons = {
  ig: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  yt: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  ),
  linkedin: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0zM7.12 20.45H3.56V9h3.56v11.45zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zm15.11 13.02h-3.56v-5.6c0-1.34-.03-3.06-1.87-3.06-1.87 0-2.15 1.46-2.15 2.96v5.7h-3.56V9h3.41v1.56h.05c.48-.9 1.63-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29z" />
    </svg>
  ),
};

const VerifiedBadge = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    fill="#3B82F6"
    className="inline-block ml-1 relative -top-0.5"
    viewBox="0 0 16 16"
  >
    <path d="M10.067.87a2.89 2.89 0 0 0-4.134 0l-.622.638-.89-.011a2.89 2.89 0 0 0-2.924 2.924l.01.89-.636.622a2.89 2.89 0 0 0 0 4.134l.637.622-.011.89a2.89 2.89 0 0 0 2.924 2.924l.89-.01.622.636a2.89 2.89 0 0 0 4.134 0l.622-.637.89.011a2.89 2.89 0 0 0 2.924-2.924l-.01-.89.636-.622a2.89 2.89 0 0 0 0-4.134l-.637-.622.011-.89a2.89 2.89 0 0 0-2.924-2.924l-.89.01zm.287 5.984-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708.708" />
  </svg>
);

const getYoutubeId = (url: string) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/,
  );
  return match ? match[1] : null;
};

// Countdown Timer Komponen
const PreviewCountdown = ({
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
      className={`text-[8px] font-mono font-bold mb-1.5 px-2 py-0.5 rounded-sm inline-flex items-center gap-1 ${theme === "dark" ? "bg-rose-500/20 text-rose-400" : "bg-rose-100 text-rose-600"}`}
    >
      <svg
        className="w-3 h-3"
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

export default function DashboardBioPage() {
  const defaultSocials = {
    instagram: "",
    tiktok: "",
    youtube: "",
    linkedin: "",
  };
  const [profile, setProfile] = useState({
    name: "DPW IKA UII DIY",
    description: "Wadah silaturahmi & kolaborasi Alumni UII di DIY.",
    logoUrl: "",
    theme: "dark",
    highlightColor: "#FFD700",
    socials: defaultSocials,
  });
  const [links, setLinks] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [isProfileExpanded, setIsProfileExpanded] = useState(true);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchBioData();
  }, []);

  const fetchBioData = async () => {
    try {
      const snap = await getDoc(doc(db, "settings", "bio_engine"));
      if (snap.exists()) {
        const data = snap.data();
        setProfile({
          ...data.profile,
          highlightColor: data.profile.highlightColor || "#FFD700",
          socials: data.profile.socials || defaultSocials,
        });
        setLinks(
          (data.links || []).map((l: any) => ({ ...l, isExpanded: false })),
        );
        setNews(
          (data.news || []).map((n: any) => ({ ...n, isExpanded: false })),
        );
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const linksToSave = links.map(({ isExpanded, ...rest }) => rest);
      const newsToSave = news.map(({ isExpanded, ...rest }) => rest);
      await setDoc(
        doc(db, "settings", "bio_engine"),
        { profile, links: linksToSave, news: newsToSave },
        { merge: true },
      );
      setMessage("Konfigurasi Bio berhasil diperbarui");
      setTimeout(() => setMessage(""), 3000);
    } catch (e) {
      setMessage("Gagal menyimpan data");
    } finally {
      setIsSaving(false);
    }
  };

  const addLink = () =>
    setLinks([
      ...links,
      {
        id: Date.now().toString(),
        title: "Tautan Baru",
        url: "",
        type: "link",
        label: "",
        isHighlight: false,
        expiresAt: "",
        isActive: true,
        clicks: 0,
        isExpanded: true,
      },
    ]);
  const addNews = () =>
    setNews([
      ...news,
      {
        id: Date.now().toString(),
        title: "Berita Baru",
        snippet: "",
        url: "",
        imageUrl: "",
        isActive: true,
        isExpanded: true,
      },
    ]);
  const toggleExpandLink = (id: string) =>
    setLinks(
      links.map((l) => (l.id === id ? { ...l, isExpanded: !l.isExpanded } : l)),
    );
  const toggleExpandNews = (id: string) =>
    setNews(
      news.map((n) => (n.id === id ? { ...n, isExpanded: !n.isExpanded } : n)),
    );

  const handleSort = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    let _links = [...links];
    const draggedItemContent = _links.splice(dragItem.current, 1)[0];
    _links.splice(dragOverItem.current, 0, draggedItemContent);
    dragItem.current = null;
    dragOverItem.current = null;
    setLinks(_links);
  };

  if (isLoading)
    return (
      <div className="flex h-[70vh] items-center justify-center font-bold text-[#1A73E8] text-xs tracking-widest bg-[#F8F9FA]">
        MEMUAT DATA...
      </div>
    );

  const activeNews = news.filter((n: any) => n.isActive);
  const shouldMarquee = activeNews.length > 2; // Hanya muter kalau berita lebih dari 2

  // Komponen Helper untuk Merender Kartu Berita di Preview
  const NewsCardPreview = ({ item }: { item: any }) => (
    <div
      className={`w-[180px] shrink-0 rounded-lg border overflow-hidden flex flex-col shadow-sm ${profile.theme === "dark" ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200"}`}
    >
      {item.imageUrl && (
        <div className="h-20 bg-slate-200 border-b border-white/5">
          <img src={item.imageUrl} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-2.5 flex-1 flex flex-col">
        <h4
          className={`text-[10px] font-bold line-clamp-2 leading-tight ${profile.theme === "dark" ? "text-slate-200" : "text-slate-800"}`}
        >
          {item.title}
        </h4>
        <p className="text-[8px] text-slate-500 mt-1 line-clamp-2 flex-1 leading-relaxed">
          {item.snippet}
        </p>
        <span className="text-[8px] font-bold text-[var(--theme-highlight)] mt-2 uppercase tracking-wider">
          Buka ↗
        </span>
      </div>
    </div>
  );

  return (
    <div
      className="p-6 md:p-8 max-w-[1400px] mx-auto font-sans text-slate-700 bg-[#F8F9FA] min-h-screen"
      style={
        { "--theme-highlight": profile.highlightColor } as React.CSSProperties
      }
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes marquee-admin { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee-admin { display: flex; width: max-content; animation: marquee-admin 15s linear infinite; }
        .animate-marquee-admin:hover { animation-play-state: paused; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; height: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(150,150,150,0.3); border-radius: 10px; }
      `,
        }}
      />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-[#DADCE0] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Manajemen Link in Bio
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pusat kendali tautan bio resmi (ikadiy.uii.ac.id/bio).
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 text-sm"
        >
          {isSaving ? (
            "Menyimpan..."
          ) : (
            <>
              <IconSave /> Simpan Perubahan
            </>
          )}
        </button>
      </header>

      {message && (
        <div className="fixed top-6 right-6 bg-slate-800 text-white px-5 py-3 rounded-lg shadow-xl z-50 animate-in slide-in-from-top-4 font-medium text-sm flex items-center gap-2 border border-slate-700">
          <IconCheck /> {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* KOLOM KIRI (ADMIN INPUT) */}
        <div className="lg:col-span-8 space-y-6">
          {/* PROFILE IDENTITY */}
          <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden">
            <div
              className="flex items-center justify-between p-5 bg-slate-50 hover:bg-slate-100 cursor-pointer border-b border-[#DADCE0]"
              onClick={() => setIsProfileExpanded(!isProfileExpanded)}
            >
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <IconSettings /> Identitas & Tema
              </h2>
              <div className="text-slate-400">
                <IconChevronDown isOpen={isProfileExpanded} />
              </div>
            </div>

            {isProfileExpanded && (
              <div className="p-6 animate-in slide-in-from-top-2">
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Warna Highlight:
                    </label>
                    <div className="flex items-center gap-2 bg-slate-50 border border-[#DADCE0] p-1 rounded-lg">
                      <input
                        type="color"
                        value={profile.highlightColor}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            highlightColor: e.target.value,
                          })
                        }
                        className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                      />
                      <span className="text-xs font-mono font-bold px-2">
                        {profile.highlightColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                      onClick={() => setProfile({ ...profile, theme: "light" })}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${profile.theme === "light" ? "bg-white shadow text-slate-800" : "text-slate-500"}`}
                    >
                      Light Mode
                    </button>
                    <button
                      onClick={() => setProfile({ ...profile, theme: "dark" })}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${profile.theme === "dark" ? "bg-slate-800 shadow text-white" : "text-slate-500"}`}
                    >
                      Dark Mode
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Nama Tampilan
                    </label>
                    <input
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md text-sm font-semibold focus:border-[#1A73E8] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      URL Logo
                    </label>
                    <input
                      value={profile.logoUrl}
                      onChange={(e) =>
                        setProfile({ ...profile, logoUrl: e.target.value })
                      }
                      className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md text-sm focus:border-[#1A73E8] outline-none"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Deskripsi Singkat (Bio)
                    </label>
                    <textarea
                      value={profile.description}
                      onChange={(e) =>
                        setProfile({ ...profile, description: e.target.value })
                      }
                      className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md text-sm leading-relaxed resize-none focus:border-[#1A73E8] outline-none"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#DADCE0]">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                    Tautan Sosial Media
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="flex items-center bg-slate-50 border border-[#DADCE0] rounded-md px-2">
                      <span className="text-slate-400">{SocIcons.ig}</span>
                      <input
                        value={profile.socials?.instagram}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            socials: {
                              ...profile.socials,
                              instagram: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-transparent text-xs outline-none"
                        placeholder="Username IG"
                      />
                    </div>
                    <div className="flex items-center bg-slate-50 border border-[#DADCE0] rounded-md px-2">
                      <span className="text-slate-400">{SocIcons.tiktok}</span>
                      <input
                        value={profile.socials?.tiktok}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            socials: {
                              ...profile.socials,
                              tiktok: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-transparent text-xs outline-none"
                        placeholder="Username TikTok"
                      />
                    </div>
                    <div className="flex items-center bg-slate-50 border border-[#DADCE0] rounded-md px-2">
                      <span className="text-slate-400">{SocIcons.yt}</span>
                      <input
                        value={profile.socials?.youtube}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            socials: {
                              ...profile.socials,
                              youtube: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-transparent text-xs outline-none"
                        placeholder="URL Channel"
                      />
                    </div>
                    <div className="flex items-center bg-slate-50 border border-[#DADCE0] rounded-md px-2">
                      <span className="text-slate-400">
                        {SocIcons.linkedin}
                      </span>
                      <input
                        value={profile.socials?.linkedin}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            socials: {
                              ...profile.socials,
                              linkedin: e.target.value,
                            },
                          })
                        }
                        className="w-full p-2 bg-transparent text-xs outline-none"
                        placeholder="URL LinkedIn"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* BERITA & PENGUMUMAN */}
          <div className="bg-white p-6 rounded-xl border border-[#DADCE0] shadow-sm">
            <div className="flex justify-between items-center border-b border-[#DADCE0] pb-4 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <IconNews /> Berita & Highlight
              </h2>
              <button
                onClick={addNews}
                className="text-xs font-bold text-[#1A73E8] bg-blue-50/50 px-4 py-2 rounded-md border border-blue-100 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
              >
                <IconPlus /> Tambah Berita
              </button>
            </div>
            <div className="space-y-3">
              {news.length === 0 && (
                <div className="text-center p-8 border border-dashed border-[#DADCE0] rounded-xl text-slate-500 text-sm">
                  Belum ada berita.
                </div>
              )}
              {news.map((item, idx) => (
                <div
                  key={item.id}
                  className="border border-[#DADCE0] rounded-xl overflow-hidden shadow-sm bg-white"
                >
                  <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-[#DADCE0]">
                    <div
                      className="cursor-pointer flex items-center gap-3 w-full"
                      onClick={() => toggleExpandNews(item.id)}
                    >
                      <span className="bg-slate-200 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded">
                        N{idx + 1}
                      </span>
                      <span className="font-semibold text-sm text-slate-700 truncate">
                        {item.title || "(Tanpa Judul Berita)"}
                      </span>
                      {!item.isActive && (
                        <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          Sembunyi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setNews(news.filter((n) => n.id !== item.id))
                        }
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <IconTrash />
                      </button>
                      <button
                        onClick={() => toggleExpandNews(item.id)}
                        className="text-slate-400"
                      >
                        <IconChevronDown isOpen={item.isExpanded} />
                      </button>
                    </div>
                  </div>
                  {item.isExpanded && (
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Judul Berita
                          </label>
                          <input
                            value={item.title}
                            onChange={(e) =>
                              setNews(
                                news.map((n) =>
                                  n.id === item.id
                                    ? { ...n, title: e.target.value }
                                    : n,
                                ),
                              )
                            }
                            className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md font-semibold text-sm focus:border-[#1A73E8] outline-none"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            Ringkasan Singkat
                          </label>
                          <textarea
                            value={item.snippet}
                            onChange={(e) =>
                              setNews(
                                news.map((n) =>
                                  n.id === item.id
                                    ? { ...n, snippet: e.target.value }
                                    : n,
                                ),
                              )
                            }
                            className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md text-sm focus:border-[#1A73E8] outline-none"
                            rows={2}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            URL Tautan Berita
                          </label>
                          <input
                            value={item.url}
                            onChange={(e) =>
                              setNews(
                                news.map((n) =>
                                  n.id === item.id
                                    ? { ...n, url: e.target.value }
                                    : n,
                                ),
                              )
                            }
                            className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md text-sm focus:border-[#1A73E8] outline-none"
                            placeholder="https://..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 uppercase">
                            URL Gambar Thumbnail
                          </label>
                          <input
                            value={item.imageUrl}
                            onChange={(e) =>
                              setNews(
                                news.map((n) =>
                                  n.id === item.id
                                    ? { ...n, imageUrl: e.target.value }
                                    : n,
                                ),
                              )
                            }
                            className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md text-sm focus:border-[#1A73E8] outline-none"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#DADCE0] flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.isActive}
                            onChange={(e) =>
                              setNews(
                                news.map((n) =>
                                  n.id === item.id
                                    ? { ...n, isActive: e.target.checked }
                                    : n,
                                ),
                              )
                            }
                            className="w-3.5 h-3.5 rounded border-slate-300 text-[#1A73E8]"
                          />
                          <span className="text-xs font-medium text-slate-600">
                            Tampilkan ke Publik
                          </span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* LINKS MANAGEMENT */}
          <div className="bg-white p-6 rounded-xl border border-[#DADCE0] shadow-sm">
            <div className="flex justify-between items-center border-b border-[#DADCE0] pb-4 mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <IconLink /> Daftar Tautan
              </h2>
              <button
                onClick={addLink}
                className="text-xs font-bold text-[#1A73E8] bg-blue-50/50 px-4 py-2 rounded-md border border-blue-100 hover:bg-blue-50 transition-colors flex items-center gap-1.5"
              >
                <IconPlus /> Tambah Tautan
              </button>
            </div>
            <div className="space-y-3">
              {links.length === 0 && (
                <div className="text-center p-8 border border-dashed border-[#DADCE0] rounded-xl text-slate-500 text-sm">
                  Belum ada tautan.
                </div>
              )}
              {links.map((link, idx) => (
                <div
                  key={link.id}
                  draggable
                  onDragStart={() => (dragItem.current = idx)}
                  onDragEnter={() => (dragOverItem.current = idx)}
                  onDragEnd={handleSort}
                  onDragOver={(e) => e.preventDefault()}
                  className="border border-[#DADCE0] rounded-xl overflow-hidden shadow-sm bg-white"
                >
                  <div className="flex items-center justify-between p-3 bg-slate-50 border-b border-[#DADCE0]">
                    <div className="flex items-center gap-3 overflow-hidden w-full">
                      <div className="px-2 cursor-grab text-slate-400 hover:text-slate-600">
                        <IconGrip />
                      </div>
                      <div
                        className="cursor-pointer flex items-center gap-3 w-full"
                        onClick={() => toggleExpandLink(link.id)}
                      >
                        <span className="bg-slate-200 text-slate-600 font-bold text-[10px] px-2 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                        <span className="font-semibold text-sm text-slate-700 truncate">
                          {link.title || "(Tanpa Judul)"}
                        </span>
                        {!link.isActive && (
                          <span className="bg-slate-200 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                            Sembunyi
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setLinks(links.filter((l) => l.id !== link.id))
                        }
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <IconTrash />
                      </button>
                      <button
                        onClick={() => toggleExpandLink(link.id)}
                        className="text-slate-400"
                      >
                        <IconChevronDown isOpen={link.isExpanded} />
                      </button>
                    </div>
                  </div>
                  {link.isExpanded && (
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                        <div className="md:col-span-7 space-y-4">
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">
                              Judul Konten
                            </label>
                            <input
                              value={link.title}
                              onChange={(e) =>
                                setLinks(
                                  links.map((l) =>
                                    l.id === link.id
                                      ? { ...l, title: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                              className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md focus:border-[#1A73E8] outline-none font-semibold text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">
                              URL Tujuan
                            </label>
                            <input
                              value={link.url}
                              onChange={(e) =>
                                setLinks(
                                  links.map((l) =>
                                    l.id === link.id
                                      ? { ...l, url: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                              className="w-full mt-1.5 p-2.5 bg-slate-50 border border-[#DADCE0] rounded-md text-sm font-mono focus:border-[#1A73E8] outline-none"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-5 space-y-4 border-l border-[#DADCE0] pl-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Format
                              </label>
                              <select
                                value={link.type}
                                onChange={(e) =>
                                  setLinks(
                                    links.map((l) =>
                                      l.id === link.id
                                        ? { ...l, type: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className="w-full mt-1.5 p-2.5 bg-white border border-[#DADCE0] rounded-md text-xs focus:border-[#1A73E8] outline-none"
                              >
                                <option value="link">Tautan Teks</option>
                                <option value="video">Video YouTube</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">
                                Label (Stiker)
                              </label>
                              <input
                                value={link.label}
                                onChange={(e) =>
                                  setLinks(
                                    links.map((l) =>
                                      l.id === link.id
                                        ? { ...l, label: e.target.value }
                                        : l,
                                    ),
                                  )
                                }
                                className="w-full mt-1.5 p-2.5 bg-white border border-[#DADCE0] rounded-md text-xs font-medium text-[#1A73E8] focus:border-[#1A73E8] outline-none"
                                placeholder="NEW"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase">
                              Batas Waktu (Timer Lock)
                            </label>
                            <input
                              type="datetime-local"
                              value={link.expiresAt}
                              onChange={(e) =>
                                setLinks(
                                  links.map((l) =>
                                    l.id === link.id
                                      ? { ...l, expiresAt: e.target.value }
                                      : l,
                                  ),
                                )
                              }
                              className="w-full mt-1.5 p-2 bg-white border border-[#DADCE0] rounded-md text-[11px] focus:border-[#1A73E8] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-[#DADCE0] flex flex-wrap justify-between gap-4">
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={link.isHighlight}
                              onChange={(e) =>
                                setLinks(
                                  links.map((l) =>
                                    l.id === link.id
                                      ? { ...l, isHighlight: e.target.checked }
                                      : l,
                                  ),
                                )
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300"
                            />
                            <span className="text-xs font-medium text-slate-600">
                              Beri Highlight Warna
                            </span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={link.isActive}
                              onChange={(e) =>
                                setLinks(
                                  links.map((l) =>
                                    l.id === link.id
                                      ? { ...l, isActive: e.target.checked }
                                      : l,
                                  ),
                                )
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#1A73E8]"
                            />
                            <span className="text-xs font-medium text-slate-600">
                              Tampilkan
                            </span>
                          </label>
                        </div>
                        <div className="bg-slate-50 px-2 py-1 rounded border border-[#DADCE0] text-[10px] text-slate-500 font-medium">
                          <IconChart /> {link.clicks || 0} KLIK
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: LIVE PREVIEW */}
        <div className="lg:col-span-4 sticky top-6">
          <div className="text-center mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
              Live Preview ({profile.theme})
            </span>
          </div>

          <div
            className={`w-[320px] h-[650px] mx-auto border-[8px] rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col font-sans transition-colors duration-500 ${profile.theme === "dark" ? "bg-[#050810] border-slate-800 text-slate-300" : "bg-slate-100 border-slate-300 text-slate-800"}`}
          >
            <div
              className={`absolute top-0 inset-x-0 h-5 rounded-b-xl w-32 mx-auto z-50 ${profile.theme === "dark" ? "bg-slate-800" : "bg-slate-300"}`}
            ></div>
            <div
              className={`absolute top-0 right-0 w-full h-[300px] blur-[60px] pointer-events-none ${profile.theme === "dark" ? "bg-[#1A3A8F]/30" : "bg-blue-300/40"}`}
            ></div>

            <div
              className={`flex-1 overflow-y-auto mt-8 mb-0 mx-3 rounded-t-xl border shadow-lg relative z-10 custom-scrollbar transition-colors duration-500 ${profile.theme === "dark" ? "bg-[#0A0F1D] border-white/10" : "bg-white border-slate-200"}`}
            >
              <div
                className={`px-3 py-2 flex items-center justify-between border-b sticky top-0 z-20 ${profile.theme === "dark" ? "bg-[#060913] border-white/10" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500/80"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500/80"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
                </div>
                <div className="text-[8px] font-mono text-slate-500 tracking-wider">
                  ~/ikadiy/links.tsx
                </div>
                <div className="w-6"></div>
              </div>

              <div className="p-4 space-y-6 pb-10">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div
                    className={`w-16 h-16 rounded-full border flex items-center justify-center overflow-hidden relative shadow-md ${profile.theme === "dark" ? "border-[var(--theme-highlight)]/50 bg-[#060913]" : "border-slate-200 bg-white"}`}
                  >
                    {profile.logoUrl ? (
                      <img
                        src={profile.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover p-1"
                      />
                    ) : (
                      <span className="font-black text-sm text-[var(--theme-highlight)]">
                        IKA
                      </span>
                    )}
                  </div>
                  <div>
                    <h1 className="font-mono text-[10px] font-bold flex justify-center flex-wrap leading-tight">
                      <span className="text-pink-500">const</span>&nbsp;
                      <span className="text-blue-500">admin</span>&nbsp;
                      <span
                        className={
                          profile.theme === "dark"
                            ? "text-white"
                            : "text-slate-800"
                        }
                      >
                        =
                      </span>
                      &nbsp;
                      <span className="text-[var(--theme-highlight)]">
                        "{profile.name}"
                      </span>
                      <VerifiedBadge />
                    </h1>
                    {profile.description && (
                      <div className="font-mono text-[9px] mt-2 leading-relaxed text-left inline-block">
                        <span className="text-slate-400">/**</span>
                        <br />
                        <span className="text-slate-500">
                          {" "}
                          * {profile.description}
                        </span>
                        <br />
                        <span className="text-slate-400"> */</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* PREVIEW BERITA (KONDISIONAL: JALAN/DIAM) */}
                {activeNews.length > 0 && (
                  <div className="space-y-2 -mx-3 overflow-hidden">
                    <h3 className="font-mono text-[9px] text-slate-500 font-bold uppercase px-3 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-red-500 animate-pulse rounded-full"></span>{" "}
                      LATEST NEWS
                    </h3>
                    <div className="overflow-hidden w-full relative">
                      {shouldMarquee ? (
                        // LEBIH DARI 2 BERITA: MARQUEE BERJALAN
                        <div className="animate-marquee-admin flex gap-3 pl-3 cursor-grab">
                          <div className="flex gap-3">
                            {activeNews.map((item: any, idx: number) => (
                              <NewsCardPreview
                                key={`n1-${item.id}-${idx}`}
                                item={item}
                              />
                            ))}
                          </div>
                          <div className="flex gap-3">
                            {activeNews.map((item: any, idx: number) => (
                              <NewsCardPreview
                                key={`n2-${item.id}-${idx}`}
                                item={item}
                              />
                            ))}
                          </div>
                        </div>
                      ) : (
                        // 1 ATAU 2 BERITA: DIAM (SCROLL MANUAL JIKA PERLU)
                        <div className="flex gap-3 px-3 overflow-x-auto custom-scrollbar pb-2">
                          {activeNews.map((item: any, idx: number) => (
                            <NewsCardPreview
                              key={`ns-${item.id}-${idx}`}
                              item={item}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PREVIEW LINK & VIDEO */}
                <div className="space-y-3">
                  {links
                    .filter((l) => l.isActive)
                    .map((link) => {
                      const ytId =
                        link.type === "video" ? getYoutubeId(link.url) : null;
                      return (
                        <div key={`link-${link.id}`}>
                          {link.type === "video" && ytId ? (
                            <div
                              className={`rounded-xl overflow-hidden border shadow-sm relative ${link.isHighlight ? "border-[var(--theme-highlight)] ring-1 ring-[var(--theme-highlight)]/50" : profile.theme === "dark" ? "border-white/10" : "border-slate-200"}`}
                            >
                              <div className="aspect-video relative bg-black">
                                <img
                                  src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                                  className="w-full h-full object-cover opacity-80"
                                />
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center pl-1">
                                    <svg
                                      className="w-4 h-4 text-white"
                                      fill="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`p-2 text-[9px] font-bold font-mono truncate ${profile.theme === "dark" ? "bg-[#060913] text-slate-300" : "bg-white text-slate-700"}`}
                              >
                                {link.title || "Video YouTube"}
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`p-3 rounded-xl border flex items-center justify-between ${link.isHighlight ? "border-[var(--theme-highlight)]/50 bg-[var(--theme-highlight)]/10" : profile.theme === "dark" ? "bg-white/5 border-white/10" : "bg-white border-slate-200"}`}
                            >
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span
                                  className={`font-mono text-[10px] font-bold ${link.isHighlight ? "text-[var(--theme-highlight)]" : "text-blue-500"}`}
                                >
                                  {">_"}
                                </span>
                                <span
                                  className={`font-semibold text-[10px] truncate ${link.isHighlight ? (profile.theme === "dark" ? "text-[var(--theme-highlight)]" : "text-slate-800") : profile.theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                  {link.title || "Tautan"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>

                {/* Footer Preview */}
                <div
                  className={`pt-6 mt-4 flex flex-col items-center justify-center gap-4 border-t ${profile.theme === "dark" ? "border-white/5 text-slate-400" : "border-slate-200 text-slate-500"}`}
                >
                  <div className="flex items-center gap-4">
                    {profile.socials?.instagram && <div>{SocIcons.ig}</div>}
                    {profile.socials?.tiktok && <div>{SocIcons.tiktok}</div>}
                    {profile.socials?.youtube && <div>{SocIcons.yt}</div>}
                    {profile.socials?.linkedin && (
                      <div>{SocIcons.linkedin}</div>
                    )}
                  </div>
                  <div className="text-[8px] font-mono opacity-50">
                    &copy; {new Date().getFullYear()} IKA UII DIY.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
