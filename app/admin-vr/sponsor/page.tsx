"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function SponsorManagementPage() {
  const [sponsorGroups, setSponsorGroups] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

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
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus kategori ini beserta seluruh logonya?",
      )
    )
      return;
    setSponsorGroups(sponsorGroups.filter((g) => g.id !== groupId));
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
    if (!confirm("Hapus logo ini?")) return;
    setSponsorGroups(
      sponsorGroups.map((g) => {
        if (g.id === groupId) {
          return { ...g, logos: g.logos.filter((l: any) => l.id !== logoId) };
        }
        return g;
      }),
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        sponsorGroups: sponsorGroups,
      });
      setPopup({
        type: "success",
        text: "Hierarki sponsor berhasil diperbarui.",
      });
    } catch (error) {
      setPopup({
        type: "error",
        text: "Terjadi kesalahan saat menyimpan data.",
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

      {/* Header Halaman */}
      <div className="mb-8 border-b border-slate-200 pb-6">
        <h1 className="text-[28px] font-bold text-slate-800 tracking-tight">
          Manajemen Sponsor & Mitra
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola hierarki logo sponsor dan media partner yang akan ditampilkan
          pada halaman utama publik. Urutan di bawah ini akan sama persis dengan
          urutan di website.
        </p>
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
                  className={`bg-slate-50 px-5 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-100 transition-colors ${isExpanded ? "border-b border-slate-200" : ""}`}
                  onClick={() => toggleGroup(group.id)}
                >
                  <div
                    className="flex-1 flex flex-col sm:flex-row gap-3 w-full ml-2"
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
                  <div className="p-5">
                    {(!group.logos || group.logos.length === 0) && (
                      <div className="text-center text-slate-400 text-[11px] italic py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Belum ada logo. Klik tombol "+ LOGO" di atas.
                      </div>
                    )}

                    {/* 🔥 2 KOLOM GRID DI DESKTOP 🔥 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {(group.logos || []).map((logo: any) => (
                        <div
                          key={logo.id}
                          className={`flex items-start gap-3 bg-white p-3 rounded-xl border transition-colors ${logo.isHidden ? "border-slate-200 opacity-60 grayscale bg-slate-50" : "border-blue-100 shadow-sm hover:border-[#1A73E8]"}`}
                        >
                          {/* Preview Kotak Gambar */}
                          <div className="w-14 h-14 bg-slate-50 rounded-lg border border-slate-200 shrink-0 flex items-center justify-center overflow-hidden">
                            {logo.url ? (
                              <img
                                src={logo.url}
                                alt="preview"
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <svg
                                className="w-5 h-5 text-slate-300"
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

                          {/* Form Input */}
                          <div className="flex-1 space-y-2 w-full">
                            <input
                              type="text"
                              value={logo.name}
                              onChange={(e) =>
                                handleUpdateLogo(
                                  group.id,
                                  logo.id,
                                  "name",
                                  e.target.value,
                                )
                              }
                              placeholder="Nama Instansi (Opsional)"
                              className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded focus:border-[#1A73E8] outline-none text-[11px] font-bold text-slate-800 shadow-inner"
                            />
                            <input
                              type="url"
                              value={logo.url}
                              onChange={(e) =>
                                handleUpdateLogo(
                                  group.id,
                                  logo.id,
                                  "url",
                                  e.target.value,
                                )
                              }
                              placeholder="Tautan Gambar (https://...)"
                              className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded focus:border-[#1A73E8] outline-none text-[10px] font-mono text-slate-800 shadow-inner"
                              required
                            />
                          </div>

                          {/* Tombol Aksi */}
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              type="button"
                              title={
                                logo.isHidden
                                  ? "Tampilkan Logo"
                                  : "Sembunyikan Logo"
                              }
                              onClick={() =>
                                handleUpdateLogo(
                                  group.id,
                                  logo.id,
                                  "isHidden",
                                  !logo.isHidden,
                                )
                              }
                              className={`p-1.5 rounded transition-colors border flex items-center justify-center ${logo.isHidden ? "bg-slate-200 text-slate-500 border-slate-300" : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"}`}
                            >
                              {logo.isHidden ? (
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
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                              ) : (
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              )}
                            </button>
                            <button
                              type="button"
                              title="Hapus Baris"
                              onClick={() =>
                                handleRemoveLogo(group.id, logo.id)
                              }
                              className="p-1.5 bg-rose-50 text-rose-500 border border-rose-200 hover:bg-rose-500 hover:text-white rounded transition-colors flex items-center justify-center"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
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

      {/* Sticky Footer Save */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-slate-200 py-3.5 px-6 md:px-8 flex justify-between items-center z-40 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        <p className="text-[11px] text-slate-500 font-medium hidden sm:block uppercase tracking-wider">
          Pastikan Anda menyimpan perubahan sebelum berpindah halaman.
        </p>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold px-8 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
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
    </div>
  );
}
