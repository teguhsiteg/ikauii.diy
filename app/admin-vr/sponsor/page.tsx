"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

export default function SponsorManagementPage() {
  const [sponsorGroups, setSponsorGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // --- 🔥 STATE CUSTOM MODALS (MENGGANTIKAN ALERT BAWAAN BROWSER) 🔥 ---
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  // State untuk Live Preview
  const [showPreview, setShowPreview] = useState(false);

  // State lokal untuk melacak kategori mana yang di-minimize/maximize
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const groups = data.sponsorGroups || [];
          setSponsorGroups(groups);

          // Default: Buka semua kategori saat pertama kali load
          const initialExpandedState: Record<string, boolean> = {};
          groups.forEach((g: any) => {
            initialExpandedState[g.id] = true;
          });
          setExpandedGroups(initialExpandedState);
        }
      } catch (error) {
        console.error("Gagal memuat data sponsor:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSponsors();
  }, []);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const handleAddGroup = () => {
    const newId = Date.now().toString();
    setSponsorGroups([
      ...sponsorGroups,
      { id: newId, title: "", size: "medium", logos: [] },
    ]);
    // Otomatis buka kategori yang baru ditambah
    setExpandedGroups((prev) => ({ ...prev, [newId]: true }));
  };

  // 🔥 FUNGSI BARU: GESER KE ATAS 🔥
  const moveGroupUp = (index: number) => {
    if (index === 0) return; // Sudah paling atas
    const newGroups = [...sponsorGroups];
    // Tukar posisi dengan elemen di atasnya
    [newGroups[index - 1], newGroups[index]] = [
      newGroups[index],
      newGroups[index - 1],
    ];
    setSponsorGroups(newGroups);
  };

  // 🔥 FUNGSI BARU: GESER KE BAWAH 🔥
  const moveGroupDown = (index: number) => {
    if (index === sponsorGroups.length - 1) return; // Sudah paling bawah
    const newGroups = [...sponsorGroups];
    // Tukar posisi dengan elemen di bawahnya
    [newGroups[index + 1], newGroups[index]] = [
      newGroups[index],
      newGroups[index + 1],
    ];
    setSponsorGroups(newGroups);
  };

  const handleRemoveGroup = (groupId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Kategori?",
      message: "Apakah Anda yakin ingin menghapus kategori ini beserta seluruh logonya? Tindakan ini tidak dapat dibatalkan.",
      onConfirm: () => {
        setSponsorGroups(sponsorGroups.filter((g) => g.id !== groupId));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleUpdateGroup = (groupId: string, field: string, value: string) => {
    setSponsorGroups(
      sponsorGroups.map((g) =>
        g.id === groupId ? { ...g, [field]: value } : g,
      ),
    );
  };

  const handleAddLogo = (groupId: string) => {
    setSponsorGroups(
      sponsorGroups.map((g) => {
        if (g.id === groupId) {
          const currentLogos = g.logos || [];
          return {
            ...g,
            logos: [
              ...currentLogos,
              { id: Date.now().toString(), name: "", url: "", isHidden: false },
            ],
          };
        }
        return g;
      }),
    );
    // Pastikan grup terbuka saat tambah logo
    setExpandedGroups((prev) => ({ ...prev, [groupId]: true }));
  };

  const handleUpdateLogo = (
    groupId: string,
    logoId: string,
    field: string,
    value: any,
  ) => {
    setSponsorGroups(
      sponsorGroups.map((g) => {
        if (g.id === groupId) {
          return {
            ...g,
            logos: g.logos.map((l: any) =>
              l.id === logoId ? { ...l, [field]: value } : l,
            ),
          };
        }
        return g;
      }),
    );
  };

  const handleRemoveLogo = (groupId: string, logoId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Hapus Logo?",
      message: "Apakah Anda yakin ingin menghapus logo ini?",
      onConfirm: () => {
        setSponsorGroups(
          sponsorGroups.map((g) => {
            if (g.id === groupId) {
              return { ...g, logos: g.logos.filter((l: any) => l.id !== logoId) };
            }
            return g;
          }),
        );
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Menggunakan setDoc + merge untuk menghindari error jika document belum ada
      // JSON.parse(JSON.stringify) digunakan untuk membersihkan properti "undefined" yang ditolak Firebase
      await setDoc(doc(db, "settings", "virtual_run"), {
        sponsorGroups: JSON.parse(JSON.stringify(sponsorGroups)),
      }, { merge: true });
      setPopup({
        type: "success",
        text: "Hierarki sponsor berhasil diperbarui.",
      });
    } catch (error: any) {
      console.error("Firebase Save Error:", error);
      setPopup({
        type: "error",
        text: `Gagal menyimpan: ${error?.message || "Kesalahan tak dikenal"}`,
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setPopup(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-[#1A73E8] font-medium text-sm">
        <div className="w-8 h-8 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
        MEMUAT DATA SPONSOR...
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300 max-w-6xl mx-auto pb-24 relative p-4 sm:p-8 font-sans">
      {/* Notifikasi Popup */}
      {popup && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex items-center gap-4 min-w-[300px]">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${popup.type === "success" ? "bg-[#E6F4EA] text-[#1E8E3E]" : "bg-[#FCE8E6] text-[#D93025]"}`}
            >
              {popup.type === "success" ? (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              )}
            </div>
            <div className="flex-grow">
              <p className="text-sm font-bold text-slate-800">
                {popup.type === "success" ? "Berhasil" : "Gagal"}
              </p>
              <p className="text-xs text-slate-500">{popup.text}</p>
            </div>
            <button
              onClick={() => setPopup(null)}
              className="text-slate-400 hover:text-slate-600 px-2 py-1"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Generic */}
      <GenericConfirm
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">
            Manajemen Sponsor & Mitra
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola hierarki logo sponsor dan media partner yang akan ditampilkan
            pada halaman utama publik. Urutan di bawah ini akan sama persis dengan
            urutan di website.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold px-8 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm whitespace-nowrap"
        >
          {isSaving ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Menyimpan...
            </>
          ) : (
            "Simpan Pengaturan"
          )}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {sponsorGroups.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <svg
              className="w-12 h-12 text-slate-300 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <p className="text-slate-500 font-medium text-sm">
              Belum ada kategori sponsor yang ditambahkan.
            </p>
          </div>
        ) : (
          sponsorGroups.map((group, gIdx) => {
            const isExpanded = expandedGroups[group.id] !== false;

            return (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all group/card hover:border-[#1A73E8]/30 relative"
              >
                {/* Nomor Urut (Visual Hint) */}
                <div className="absolute top-0 left-0 bg-slate-100 text-slate-400 text-[9px] font-bold px-2 py-0.5 rounded-br-lg z-10 pointer-events-none">
                  #{gIdx + 1}
                </div>

                {/* 🌟 HEADER GRUP (KLIK UNTUK MINIMIZE) 🌟 */}
                <div
                  className={`px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors relative overflow-hidden ${isExpanded ? "border-b border-slate-200" : ""} ${
                    group.size === "large" ? "bg-amber-50/50" : group.size === "medium" ? "bg-blue-50/30" : "bg-slate-50/50"
                  }`}
                  onClick={() => toggleGroup(group.id)}
                >
                  {/* Warna Aksen Kiri berdasarkan Size */}
                  <div className={`absolute top-0 bottom-0 left-0 w-1 ${
                    group.size === "large" ? "bg-amber-400" : group.size === "medium" ? "bg-[#1A73E8]" : "bg-slate-300"
                  }`}></div>

                  <div
                    className="flex-1 flex flex-col sm:flex-row gap-4 w-full ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-full sm:w-2/3">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Nama Kategori
                      </label>
                      <input
                        type="text"
                        value={group.title}
                        onChange={(e) =>
                          handleUpdateGroup(group.id, "title", e.target.value)
                        }
                        placeholder="Cth: Presented By / Supported By"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:border-[#1A73E8] outline-none text-xs font-bold text-slate-800"
                        required
                      />
                    </div>
                    <div className="w-full sm:w-1/3">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        Ukuran di Web
                      </label>
                      <select
                        value={group.size || "medium"}
                        onChange={(e) =>
                          handleUpdateGroup(group.id, "size", e.target.value)
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded focus:border-[#1A73E8] outline-none text-xs text-slate-700 cursor-pointer"
                      >
                        <option value="large">Besar (Sponsor Utama)</option>
                        <option value="medium">Sedang (Partner)</option>
                        <option value="small">Kecil (Pendukung)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-end shrink-0 gap-2 mt-2 sm:mt-0">
                    {/* 🔥 TOMBOL PINDAH POSISI 🔥 */}
                    <div
                      className="flex bg-white border border-slate-200 rounded p-0.5 shadow-sm mr-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        disabled={gIdx === 0}
                        onClick={() => moveGroupUp(gIdx)}
                        className="p-1.5 text-slate-400 hover:text-[#1A73E8] hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
                        title="Geser ke Atas"
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </button>
                      <div className="w-px bg-slate-200 mx-0.5"></div>
                      <button
                        type="button"
                        disabled={gIdx === sponsorGroups.length - 1}
                        onClick={() => moveGroupDown(gIdx)}
                        className="p-1.5 text-slate-400 hover:text-[#1A73E8] hover:bg-blue-50 disabled:opacity-30 disabled:hover:bg-transparent rounded transition-colors"
                        title="Geser ke Bawah"
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddLogo(group.id);
                      }}
                      className="bg-blue-50 text-[#1A73E8] border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-colors h-[34px]"
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
                          d="M12 4v16m8-8H4"
                        />
                      </svg>{" "}
                      Logo
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGroup(group.id);
                      }}
                      className="bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 px-3 py-1.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 transition-colors h-[34px]"
                      title="Hapus Kategori"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="bg-slate-200 text-slate-500 border border-slate-300 hover:bg-slate-300 px-2 py-1.5 rounded flex items-center justify-center transition-colors h-[34px]"
                      title={isExpanded ? "Tutup Kategori" : "Buka Kategori"}
                    >
                      {isExpanded ? (
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      ) : (
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* 🌟 BODY GRUP (GRID LOGO) 🌟 */}
                {isExpanded && (
                  <div className="p-5 bg-slate-50/50">
                    {(!group.logos || group.logos.length === 0) && (
                      <div className="text-center text-slate-400 text-[11px] font-medium py-8 bg-white rounded-xl border border-dashed border-slate-300">
                        Belum ada logo di kategori ini. <br/> Klik tombol <span className="text-[#1A73E8] font-bold">"+ LOGO"</span> di kanan atas untuk menambahkan.
                      </div>
                    )}

                    {/* 🔥 MEDIA GALLERY GRID 🔥 */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {(group.logos || []).map((logo: any) => (
                        <div
                          key={logo.id}
                          className={`group/logo flex flex-col bg-white rounded-xl border overflow-hidden transition-all duration-300 relative ${logo.isHidden ? "border-slate-200 opacity-60 grayscale" : "border-slate-200 shadow-sm hover:shadow-md hover:border-[#1A73E8]/50 hover:-translate-y-1"}`}
                        >
                          {/* Label Hidden */}
                          {logo.isHidden && (
                            <div className="absolute top-2 left-2 bg-slate-800/80 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm z-10">
                              SEMBUNYI
                            </div>
                          )}

                          {/* Image Preview Area */}
                          <div className="aspect-video bg-slate-100 flex items-center justify-center p-4 relative overflow-hidden group-hover/logo:bg-slate-50 transition-colors">
                            {logo.url ? (
                              <img
                                src={logo.url}
                                alt="preview"
                                className="w-full h-full object-contain transition-transform duration-300 group-hover/logo:scale-105"
                                onError={(e) => {
                                  // Fallback jika error
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%2394a3b8"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>';
                                }}
                              />
                            ) : (
                              <svg
                                className="w-8 h-8 text-slate-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            )}

                          </div>

                          {/* Info Edit Area (Input & Action Buttons) */}
                          <div className="p-3 bg-white border-t border-slate-100 flex flex-col gap-3">
                            <div className="flex flex-col gap-2">
                              <input
                                type="text"
                                value={logo.name}
                                onChange={(e) =>
                                  handleUpdateLogo(group.id, logo.id, "name", e.target.value)
                                }
                                placeholder="Nama Brand (Opsional)"
                                className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#1A73E8] focus:outline-none transition-colors text-xs font-bold text-slate-800 placeholder:font-normal pb-1"
                              />
                              <input
                                type="url"
                                value={logo.url}
                                onChange={(e) =>
                                  handleUpdateLogo(group.id, logo.id, "url", e.target.value)
                                }
                                placeholder="Link Gambar URL..."
                                className="w-full bg-slate-50 border border-slate-200 focus:border-[#1A73E8] focus:bg-white outline-none rounded p-1.5 text-[10px] font-mono text-slate-600 transition-colors"
                                required
                              />
                            </div>

                            {/* Tombol Aksi (Selalu Muncul) */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <button
                                type="button"
                                title={logo.isHidden ? "Tampilkan di Web" : "Sembunyikan dari Web"}
                                onClick={() =>
                                  handleUpdateLogo(group.id, logo.id, "isHidden", !logo.isHidden)
                                }
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase transition-colors ${logo.isHidden ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                              >
                                {logo.isHidden ? (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                    Tersembunyi
                                  </>
                                ) : (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Tampil
                                  </>
                                )}
                              </button>
                              
                              <button
                                type="button"
                                title="Hapus Logo"
                                onClick={() => handleRemoveLogo(group.id, logo.id)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        <button
          type="button"
          onClick={handleAddGroup}
          className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 rounded-2xl text-sm font-bold hover:bg-slate-50 hover:border-[#1A73E8] hover:text-[#1A73E8] transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Tambah Kategori Sponsor Baru
        </button>
      </form>

      {/* Live Preview Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowPreview(true)}
          className="bg-slate-800 text-white shadow-xl hover:bg-slate-900 px-5 py-3 rounded-full flex items-center gap-2 font-bold transition-transform hover:scale-105 group"
        >
          <svg className="w-5 h-5 text-slate-300 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Live Preview
        </button>
      </div>

      {/* Modal Live Preview */}
      {showPreview && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header Preview */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#1A73E8]/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#1A73E8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Preview Publik</h3>
                  <p className="text-xs text-slate-500">Tampilan logo sponsor di halaman utama event</p>
                </div>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Konten Preview */}
            <div className="p-4 sm:p-10 overflow-y-auto bg-[#F8F9FA] flex-grow">
              <div className="bg-white rounded-2xl p-6 sm:p-12 shadow-sm border border-slate-100">
                <div className="max-w-4xl mx-auto space-y-16">
                  {sponsorGroups.length === 0 ? (
                    <div className="text-center text-slate-400 py-10">Belum ada kategori sponsor yang diatur.</div>
                  ) : (
                    sponsorGroups.map((group, idx) => {
                      const visibleLogos = (group.logos || []).filter((l: any) => !l.isHidden);
                      if (visibleLogos.length === 0 && !group.title) return null;

                      // Mapping ukuran
                      let maxH = "max-h-24";
                      let imgH = "h-12 md:h-16";
                      if (group.size === "large") {
                        maxH = "max-h-32 md:max-h-40";
                        imgH = "h-20 md:h-28";
                      } else if (group.size === "small") {
                        maxH = "max-h-16 md:max-h-20";
                        imgH = "h-8 md:h-12";
                      }

                      return (
                        <div key={idx} className="text-center">
                          {group.title && (
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">
                              {group.title}
                            </h3>
                          )}
                          {visibleLogos.length > 0 ? (
                            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
                              {visibleLogos.map((logo: any) => (
                                <div key={logo.id} className={`relative flex items-center justify-center p-2 transition-transform hover:scale-105 bg-white ${maxH}`}>
                                  {logo.url ? (
                                    <img
                                      src={logo.url}
                                      alt={logo.name || "Sponsor"}
                                      className={`w-auto object-contain grayscale hover:grayscale-0 transition-all duration-500 ${imgH}`}
                                      crossOrigin="anonymous"
                                    />
                                  ) : (
                                    <div className={`w-32 bg-slate-100 flex items-center justify-center rounded text-slate-400 text-xs italic border border-dashed border-slate-200 ${imgH}`}>Logo Kosong</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-300 italic">Tidak ada logo aktif</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer Preview */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setShowPreview(false);
                  handleSave({ preventDefault: () => {} } as any);
                }}
                className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold px-8 py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Tutup & Simpan Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Komponen Modal Konfirmasi Generic
function GenericConfirm({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-rose-500"
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
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        <div className="bg-slate-50 px-6 py-4 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-rose-500 text-white font-bold py-2.5 rounded-lg hover:bg-rose-600 transition-colors shadow-sm shadow-rose-500/20"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
