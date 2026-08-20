"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- IKON MATERIAL ---
const IconHero = () => (
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
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const IconStar = () => (
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
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
  </svg>
);
const IconTime = () => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconPack = () => (
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
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);
const IconVenue = () => (
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
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const IconFAQ = () => (
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
      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconSave = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={3}
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
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export default function AdminEventPage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState("");

  const [formData, setFormData] = useState<any>({
    heroTitle: "",
    heroSubtitle: "",
    heroBgUrl: "",
    eventDate: "",
    sambutanTitle: "",
    sambutanText: "",
    sambutanImageUrl: "",
    guestStars: [],
    timeline: [],
    racepackImageUrl: "",
    racepackDescription: "",
    routeMapUrl: "",
    venueImageUrl: "",
    twibbonUrl: "",
    funRunHighlight: "Bertabur Doorprize Menarik!",
    concertHighlight: "Eksklusif Hanya Untuk Alumni",
    faqs: [],
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const role = String(userSnap.data().role || "").toLowerCase();
          if (role.includes("admin")) {
            setIsAdmin(true);
            fetchData();
            return;
          }
        }
      }
      window.location.href = "/admin-event/login";
    });
    return () => unsub();
  }, []);

  const fetchData = async () => {
    // 🔥 FIX: Pisah ruangan DB khusus untuk EVENT GEMA
    const snap = await getDoc(doc(db, "settings", "event_gema"));
    if (snap.exists()) setFormData({ ...formData, ...snap.data() });
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 🔥 FIX: Save ke ruangan DB khusus untuk EVENT GEMA
      await setDoc(doc(db, "settings", "event_gema"), formData, {
        merge: true,
      });
      setPopup("Berhasil disimpan!");
      setTimeout(() => setPopup(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading)
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F9FA] font-bold text-[#1A73E8] tracking-widest text-sm">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mr-3"></div>
        MEMUAT MODUL...
      </div>
    );

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-700">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-[#DADCE0] flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-[#DADCE0]">
          <h1 className="font-bold text-slate-800 tracking-tight text-lg">
            Gema UII 2026
          </h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
            Event Command Center
          </p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {[
            { id: "hero", label: "Hero & Sambutan", icon: <IconHero /> },
            { id: "guest", label: "Guest Star & MC", icon: <IconStar /> },
            { id: "venue", label: "Venue & Panggung", icon: <IconVenue /> },
            { id: "racepack", label: "Racepack & Rute", icon: <IconPack /> },
            { id: "timeline", label: "Jadwal Acara", icon: <IconTime /> },
            { id: "faq", label: "Tanya Jawab (FAQ)", icon: <IconFAQ /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-[#E8F0FE] text-[#1A73E8]"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#DADCE0]">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
          >
            {isSaving ? (
              "..."
            ) : (
              <>
                <IconSave /> Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 p-6 md:p-10 max-w-5xl relative overflow-y-auto h-screen">
        {popup && (
          <div className="fixed top-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4 font-bold text-sm">
            ✅ {popup}
          </div>
        )}

        {/* 1. HERO & SAMBUTAN */}
        {activeTab === "hero" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <header>
              <h2 className="text-2xl font-bold text-slate-800">
                Visual Utama & Sambutan VIP
              </h2>
            </header>

            <div className="grid gap-6">
              {/* Box Hero */}
              <div className="bg-white p-8 rounded-2xl border border-[#DADCE0] space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  Hero Section (Panggung Utama)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Headline Utama
                    </label>
                    <input
                      value={formData.heroTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, heroTitle: e.target.value })
                      }
                      placeholder="GEMA UII"
                      className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 font-bold mt-1"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Sub-Headline
                    </label>
                    <input
                      value={formData.heroSubtitle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          heroSubtitle: e.target.value,
                        })
                      }
                      placeholder="Merajut kembali memori..."
                      className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Tanggal Acara (Untuk Countdown)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.eventDate}
                      onChange={(e) =>
                        setFormData({ ...formData, eventDate: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      URL Gambar Background Hero
                    </label>
                    <input
                      value={formData.heroBgUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, heroBgUrl: e.target.value })
                      }
                      className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Box Sambutan */}
              <div className="bg-white p-8 rounded-2xl border border-[#DADCE0] space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  VIP Message (Sambutan)
                </h3>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Judul Sambutan
                  </label>
                  <input
                    value={formData.sambutanTitle}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sambutanTitle: e.target.value,
                      })
                    }
                    placeholder="Pesan Pimpinan"
                    className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Teks Pesan
                  </label>
                  <textarea
                    rows={6}
                    value={formData.sambutanText}
                    onChange={(e) =>
                      setFormData({ ...formData, sambutanText: e.target.value })
                    }
                    placeholder="Tuliskan kata sambutan..."
                    className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1 leading-relaxed"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    URL Foto Pimpinan (Rasio 3:4 / Potrait)
                  </label>
                  <input
                    value={formData.sambutanImageUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sambutanImageUrl: e.target.value,
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1"
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. GUEST STARS */}
        {activeTab === "guest" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <header className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">
                Daftar Guest Star & MC
              </h2>
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    guestStars: [
                      ...(formData.guestStars || []),
                      {
                        id: Date.now().toString(),
                        name: "",
                        role: "",
                        imageUrl: "",
                      },
                    ],
                  })
                }
                className="text-xs font-bold text-[#1A73E8] bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                + Tambah Guest
              </button>
            </header>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(formData.guestStars || []).map((g: any) => (
                <div
                  key={g.id}
                  className="bg-white p-5 rounded-2xl border border-[#DADCE0] relative group shadow-sm"
                >
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        guestStars: formData.guestStars.filter(
                          (x: any) => x.id !== g.id,
                        ),
                      })
                    }
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                  >
                    <IconTrash />
                  </button>
                  <div className="space-y-3 mt-2">
                    <input
                      placeholder="Nama (e.g., Sheila On 7)"
                      value={g.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guestStars: formData.guestStars.map((x: any) =>
                            x.id === g.id ? { ...x, name: e.target.value } : x,
                          ),
                        })
                      }
                      className="w-full font-bold text-sm outline-none border-b border-slate-200 pb-2 focus:border-[#1A73E8] transition-colors"
                    />
                    <input
                      placeholder="Peran (e.g., GUEST STAR / MC)"
                      value={g.role}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guestStars: formData.guestStars.map((x: any) =>
                            x.id === g.id ? { ...x, role: e.target.value } : x,
                          ),
                        })
                      }
                      className="w-full text-xs text-[#1A73E8] font-bold outline-none border-b border-slate-200 pb-2 focus:border-[#1A73E8] transition-colors uppercase"
                    />
                    <input
                      placeholder="URL Foto Artist (Potrait)"
                      value={g.imageUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          guestStars: formData.guestStars.map((x: any) =>
                            x.id === g.id
                              ? { ...x, imageUrl: e.target.value }
                              : x,
                          ),
                        })
                      }
                      className="w-full text-xs text-slate-500 outline-none pt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. VENUE & PANGGUNG */}
        {activeTab === "venue" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <header>
              <h2 className="text-2xl font-bold text-slate-800">
                Venue & Link Pendaftaran
              </h2>
            </header>
            <div className="grid gap-6 bg-white p-8 rounded-2xl border border-[#DADCE0]">
              <div className="space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  Denah & Interaksi
                </h3>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    URL Gambar Denah Venue
                  </label>
                  <input
                    value={formData.venueImageUrl || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        venueImageUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Link Aplikasi Twibbon
                  </label>
                  <input
                    value={formData.twibbonUrl || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, twibbonUrl: e.target.value })
                    }
                    placeholder="https://twb.nz/..."
                    className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  Link Pendaftaran (4 Pilar)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Link Tiket Reuni Akbar
                    </label>
                    <input
                      value={formData.linkReuni || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, linkReuni: e.target.value })
                      }
                      placeholder="/reuni/registrasi atau https://..."
                      className="w-full p-2 bg-white border border-slate-300 rounded focus:border-[#1A73E8] mt-1 text-xs outline-none"
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Link Tiket Fun Run (Offline)
                    </label>
                    <input
                      value={formData.linkFunRun || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, linkFunRun: e.target.value })
                      }
                      placeholder="/run/registrasi"
                      className="w-full p-2 bg-white border border-slate-300 rounded focus:border-[#1A73E8] mt-1 text-xs outline-none"
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Link Tiket Virtual Run
                    </label>
                    <input
                      value={formData.linkVirtualRun || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          linkVirtualRun: e.target.value,
                        })
                      }
                      placeholder="/virtual-run/registrasi"
                      className="w-full p-2 bg-white border border-slate-300 rounded focus:border-[#1A73E8] mt-1 text-xs outline-none"
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Link Tiket Konser
                    </label>
                    <input
                      value={formData.linkKonser || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, linkKonser: e.target.value })
                      }
                      placeholder="/konser/registrasi"
                      className="w-full p-2 bg-white border border-slate-300 rounded focus:border-[#1A73E8] mt-1 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  Highlight Label
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Badge Fun Run
                    </label>
                    <input
                      value={formData.funRunHighlight || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          funRunHighlight: e.target.value,
                        })
                      }
                      placeholder="Bertabur Doorprize Menarik!"
                      className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      Badge Konser
                    </label>
                    <input
                      value={formData.concertHighlight || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          concertHighlight: e.target.value,
                        })
                      }
                      placeholder="Eksklusif Hanya Untuk Alumni"
                      className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg outline-none focus:border-blue-600 mt-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. RACEPACK & RUTE */}
        {activeTab === "racepack" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <header>
              <h2 className="text-2xl font-bold text-slate-800">
                Fisik & Logistik Lari
              </h2>
            </header>
            <div className="grid gap-8">
              <div className="bg-white p-8 rounded-2xl border border-[#DADCE0] space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  Racepack Preview
                </h3>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    URL Gambar Racepack
                  </label>
                  <input
                    value={formData.racepackImageUrl}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        racepackImageUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg text-sm mt-1 focus:border-[#1A73E8] outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Deskripsi Racepack
                  </label>
                  <textarea
                    rows={4}
                    value={formData.racepackDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        racepackDescription: e.target.value,
                      })
                    }
                    placeholder="Peserta mendapatkan jersey, medali..."
                    className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg text-sm mt-1 focus:border-[#1A73E8] outline-none leading-relaxed"
                  />
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl border border-[#DADCE0] space-y-4">
                <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                  Peta Rute Lari
                </h3>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    URL Gambar Peta Rute
                  </label>
                  <input
                    value={formData.routeMapUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, routeMapUrl: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full p-3 bg-slate-50 border border-[#DADCE0] rounded-lg text-sm mt-1 focus:border-[#1A73E8] outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. TIMELINE */}
        {activeTab === "timeline" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <header className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">
                Jadwal Acara (Rundown)
              </h2>
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    timeline: [
                      ...formData.timeline,
                      {
                        id: Date.now().toString(),
                        date: "",
                        title: "",
                        description: "",
                      },
                    ],
                  })
                }
                className="text-xs font-bold text-[#1A73E8] bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                + Tambah Jadwal
              </button>
            </header>
            <div className="space-y-4">
              {formData.timeline.map((t: any) => (
                <div
                  key={t.id}
                  className="bg-white p-6 rounded-2xl border border-[#DADCE0] relative group shadow-sm"
                >
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        timeline: formData.timeline.filter(
                          (x: any) => x.id !== t.id,
                        ),
                      })
                    }
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                  >
                    <IconTrash />
                  </button>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Waktu / Pukul
                      </label>
                      <input
                        placeholder="Contoh: 06.00 WIB"
                        value={t.date}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            timeline: formData.timeline.map((x: any) =>
                              x.id === t.id
                                ? { ...x, date: e.target.value }
                                : x,
                            ),
                          })
                        }
                        className="w-full font-bold text-[#1A73E8] outline-none border-b border-slate-200 pb-2 mt-1 focus:border-[#1A73E8]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Agenda
                      </label>
                      <input
                        placeholder="Contoh: Flag Off Fun Run"
                        value={t.title}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            timeline: formData.timeline.map((x: any) =>
                              x.id === t.id
                                ? { ...x, title: e.target.value }
                                : x,
                            ),
                          })
                        }
                        className="w-full text-sm font-bold text-slate-800 outline-none border-b border-slate-200 pb-2 mt-1 focus:border-[#1A73E8]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Keterangan Singkat (Opsional)
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Penjelasan singkat tentang agenda..."
                        value={t.description || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            timeline: formData.timeline.map((x: any) =>
                              x.id === t.id
                                ? { ...x, description: e.target.value }
                                : x,
                            ),
                          })
                        }
                        className="w-full text-xs text-slate-500 outline-none pt-1 resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. FAQ */}
        {activeTab === "faq" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <header className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">
                Tanya Jawab Umum (FAQ)
              </h2>
              <button
                onClick={() =>
                  setFormData({
                    ...formData,
                    faqs: [
                      ...formData.faqs,
                      { id: Date.now().toString(), q: "", a: "" },
                    ],
                  })
                }
                className="text-xs font-bold text-[#1A73E8] bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
              >
                + Tambah FAQ
              </button>
            </header>
            <div className="space-y-4">
              {formData.faqs.map((f: any) => (
                <div
                  key={f.id}
                  className="bg-white p-6 rounded-2xl border border-[#DADCE0] relative space-y-3 shadow-sm"
                >
                  <button
                    onClick={() =>
                      setFormData({
                        ...formData,
                        faqs: formData.faqs.filter((x: any) => x.id !== f.id),
                      })
                    }
                    className="absolute top-4 right-4 text-slate-300 hover:text-red-500"
                  >
                    <IconTrash />
                  </button>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Pertanyaan (Q)
                    </label>
                    <input
                      placeholder="Ketik pertanyaan di sini..."
                      value={f.q}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          faqs: formData.faqs.map((x: any) =>
                            x.id === f.id ? { ...x, q: e.target.value } : x,
                          ),
                        })
                      }
                      className="w-full font-bold text-sm text-slate-800 outline-none border-b border-slate-200 pb-2 mt-1 focus:border-[#1A73E8]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Jawaban (A)
                    </label>
                    <textarea
                      placeholder="Ketik jawaban lengkap di sini..."
                      value={f.a}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          faqs: formData.faqs.map((x: any) =>
                            x.id === f.id ? { ...x, a: e.target.value } : x,
                          ),
                        })
                      }
                      className="w-full text-xs text-slate-500 outline-none resize-none mt-1 leading-relaxed"
                      rows={3}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
