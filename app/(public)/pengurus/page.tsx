"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import FooterPublic from "@/components/layout/FooterPublic";

const LinkedInIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 1.76-6.98 6.279-.059 1.28-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 1.76 6.78 6.279 6.98 1.28.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-1.762 6.979-6.279.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-1.778-6.78-6.279-6.98-1.28-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.79 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

export default function PengurusPage() {
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [bidangList, setBidangList] = useState<string[]>([]);
  const [activeBidang, setActiveBidang] = useState<string>("Semua");
  const [searchTerm, setSearchTerm] = useState("");

  const [dpdList, setDpdList] = useState<any[]>([]);
  const [selectedDpd, setSelectedDpd] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- 🔥 STATE BARU UNTUK ACCORDION/DIVIDER 🔥 ---
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const toggleGroup = (groupName: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const getRank = (jabatan: string) => {
    const j = (jabatan || "").toLowerCase();

    if (j.includes("ketua umum")) return 100;
    if (j === "ketua") return 98;

    if (j === "wakil ketua umum" || j === "wakil ketua") return 97;
    if (j === "sekretaris wilayah" || j === "sekretaris umum" || j === "sekum")
      return 96;
    if (j === "bendahara umum" || j === "bendum") return 95;

    if (j.includes("wakil ketua") && /\d/.test(j)) return 85;
    if (j.includes("wakil sekretaris")) return 80;
    if (j.includes("wakil bendahara")) return 75;

    if (j.includes("sekretaris") && !j.includes("bidang")) return 65;
    if (j.includes("bendahara") && !j.includes("bidang")) return 60;
    if (j.includes("koordinator")) return 50;

    return 0;
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const qPengurus = query(
          collection(db, "pengurus"),
          orderBy("createdAt", "asc"),
        );
        const snapPengurus = await getDocs(qPengurus);

        const rawData = snapPengurus.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const cleanData = rawData.filter(
          (p: any) =>
            p.bidang &&
            p.bidang.trim() !== "" &&
            p.bidang !== "Belum Ditentukan",
        );

        const sortedData = cleanData.sort((a: any, b: any) => {
          const rankDiff = getRank(b.jabatan) - getRank(a.jabatan);
          if (rankDiff !== 0) return rankDiff;

          const urutA =
            a.noUrut !== undefined && a.noUrut !== "" ? Number(a.noUrut) : 99;
          const urutB =
            b.noUrut !== undefined && b.noUrut !== "" ? Number(b.noUrut) : 99;
          if (urutA !== urutB) return urutA - urutB;

          return (a.nama || "").localeCompare(b.nama || "");
        });

        setPengurusList(sortedData);

        const uniqueBidang = Array.from(
          new Set(sortedData.map((item: any) => item.bidang)),
        ) as string[];

        const urutanPrioritas = [
          "Dewan Pembina",
          "Dewan Pakar",
          "Dewan Penasihat",
          "Dewan Penasehat",
          "Pengurus Harian",
          "Bidang Organisasi & Keanggotaan",
          "Bidang Humas & Publikasi",
          "Bidang Kajian & Pengembangan",
          "Departemen Acara",
          "Departemen Penggalangan Dana",
        ];

        uniqueBidang.sort((a, b) => {
          const indexA = urutanPrioritas.findIndex((u) =>
            a.toLowerCase().includes(u.toLowerCase()),
          );
          const indexB = urutanPrioritas.findIndex((u) =>
            b.toLowerCase().includes(u.toLowerCase()),
          );
          if (indexA !== -1 && indexB !== -1) return indexA - indexB;
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return a.localeCompare(b);
        });

        setBidangList(["Semua", ...uniqueBidang]);

        // 🔥 Set Default Accordion Terbuka (Hanya Pengurus Harian yang terbuka awal)
        const initialExpanded: Record<string, boolean> = {};
        uniqueBidang.forEach((b) => {
          initialExpanded[b] = b.toLowerCase().includes("harian"); // True jika Harian, False sisanya
        });
        setExpandedGroups(initialExpanded);

        const qDpd = query(collection(db, "dpd"), orderBy("nama", "asc"));
        const snapDpd = await getDocs(qDpd);
        setDpdList(snapDpd.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Gagal memuat:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const filteredData = useMemo(() => {
    return pengurusList.filter((p) => {
      const matchBidang = activeBidang === "Semua" || p.bidang === activeBidang;
      const matchSearch =
        p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.jabatan.toLowerCase().includes(searchTerm.toLowerCase());
      return matchBidang && matchSearch;
    });
  }, [pengurusList, activeBidang, searchTerm]);

  const groupedData = useMemo(() => {
    return bidangList
      .filter((b) => b !== "Semua")
      .map((b) => ({
        bidangName: b,
        items: filteredData.filter((p) => p.bidang === b),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredData, bidangList]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-900 rounded-full animate-spin mb-4"></div>
        <p className="text-blue-950 font-bold tracking-widest uppercase text-[10px] animate-pulse">
          Menyiapkan Struktur...
        </p>
      </div>
    );
  }

  const ProfilCard = ({
    p,
    isCentral = false,
  }: {
    p: any;
    isCentral?: boolean;
  }) => {
    const isVIP = getRank(p.jabatan) >= 95;
    const hasSocial = p.linkedinUrl || p.instagramUrl;

    return (
      <div
        className={`relative bg-white rounded-xl p-4 shadow-sm border hover:shadow-md transition-all duration-300 flex flex-col items-center mx-auto overflow-hidden group
        ${isVIP ? "border-yellow-400 shadow-yellow-100/50" : "border-slate-100"} 
        ${isCentral ? "w-full max-w-[220px]" : "w-full min-w-[160px] max-w-[220px]"}`}
      >
        <div
          className={`absolute top-0 left-0 w-full h-1 transition-all duration-300 ${isVIP ? "bg-yellow-500" : "bg-blue-200 group-hover:bg-blue-500"}`}
        ></div>

        <div className="relative w-16 h-16 md:w-20 md:h-20 mb-3">
          <div
            className={`w-full h-full rounded-full overflow-hidden border-2 bg-slate-50 flex items-center justify-center relative z-10 transition-colors
            ${isVIP ? "border-yellow-400" : "border-slate-100 group-hover:border-blue-200"}`}
          >
            <img
              src={p.fotoUrl || "/logo-dpp-ika.png"}
              alt={p.nama}
              className={`w-full h-full ${p.fotoUrl ? "object-cover" : "object-contain p-3 opacity-40"}`}
            />
          </div>

          {hasSocial && (
            <div className="absolute inset-0 flex items-center justify-center gap-2 z-20 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 bg-white/60 backdrop-blur-[2px] rounded-full">
              {p.linkedinUrl && (
                <a
                  href={p.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 hover:scale-110 transition-transform shadow-sm"
                >
                  <LinkedInIcon />
                </a>
              )}
              {p.instagramUrl && (
                <a
                  href={p.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-7 h-7 bg-pink-600 text-white rounded-full flex items-center justify-center hover:bg-pink-700 hover:scale-110 transition-transform shadow-sm"
                >
                  <InstagramIcon />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="text-center z-10 w-full mt-auto">
          <h3
            className={`font-bold text-sm leading-tight line-clamp-2 mb-1 ${isVIP ? "text-blue-950" : "text-slate-800"}`}
          >
            {p.nama}
          </h3>
          <p
            className={`text-[9px] font-extrabold uppercase tracking-widest ${isVIP ? "text-yellow-600" : "text-blue-700"}`}
          >
            {p.jabatan}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 selection:bg-yellow-400 selection:text-blue-950 flex flex-col relative">
      <div className="fixed inset-0 pointer-events-none z-0 hidden lg:block overflow-hidden opacity-[0.02]">
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-blue-900 -translate-x-1/2"></div>
      </div>

      <section className="relative pt-32 pb-12 lg:pt-36 lg:pb-16 bg-blue-950 overflow-hidden z-10">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[150%] bg-blue-900/50 blur-3xl rounded-full transform rotate-12"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h4 className="flex items-center justify-center gap-3 text-yellow-400 font-bold tracking-[0.2em] uppercase text-[10px] mb-3">
            <span className="w-4 h-px bg-yellow-400"></span>Struktur Organisasi
            <span className="w-4 h-px bg-yellow-400"></span>
          </h4>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            Dewan Pimpinan Wilayah{" "}
            <span className="text-yellow-500">IKA UII DIY</span>
          </h1>
        </div>
      </section>

      <section className="sticky top-0 bg-white/80 backdrop-blur-md z-30 py-3 border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-inner">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari nama atau jabatan pengurus..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-transparent text-sm focus:outline-none placeholder-slate-400 font-medium"
              />
            </div>
            <div className="hidden sm:block w-px h-6 bg-slate-300 mx-2"></div>
            <div className="w-full sm:w-64 shrink-0">
              <select
                value={activeBidang}
                onChange={(e) => setActiveBidang(e.target.value)}
                className="w-full py-2.5 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 shadow-sm cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748B'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundPosition: "right 1rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1em",
                }}
              >
                {bidangList.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 flex-grow relative z-20">
        <div className="max-w-6xl mx-auto px-6">
          {groupedData.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium text-sm">
                Tidak ada pengurus ditemukan.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedData.map((group, groupIdx) => {
                const namaBidang = group.bidangName.toLowerCase();
                const isCentralBlock =
                  namaBidang.includes("pakar") ||
                  namaBidang.includes("pembina") ||
                  namaBidang.includes("penasihat") ||
                  namaBidang.includes("penasehat");
                const isPengurusHarian = namaBidang.includes("harian");

                // 🔥 Cek apakah sedang dicari/difilter ATAU sedang di-expand
                const isExpanded =
                  searchTerm !== "" ||
                  activeBidang !== "Semua" ||
                  expandedGroups[group.bidangName];

                return (
                  <div
                    key={groupIdx}
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300"
                  >
                    {/* --- 🔥 DIVIDER / HEADER ACCORDION 🔥 --- */}
                    <div
                      onClick={() => toggleGroup(group.bidangName)}
                      className={`flex justify-between items-center p-5 md:p-6 cursor-pointer transition-colors ${isExpanded ? "bg-slate-50 border-b border-slate-100" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2 h-8 rounded-full ${isPengurusHarian ? "bg-yellow-500" : "bg-blue-600"}`}
                        ></div>
                        <div>
                          <h2 className="text-sm md:text-base font-black text-blue-950 uppercase tracking-widest">
                            {group.bidangName}
                          </h2>
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                            {group.items.length} Personel
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border border-slate-200 shadow-sm transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                      >
                        <svg
                          className="w-5 h-5 text-blue-900"
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
                      </div>
                    </div>

                    {/* --- ISI / KONTEN DIVIDER --- */}
                    <div
                      className={`transition-all duration-500 ease-in-out origin-top ${isExpanded ? "opacity-100 max-h-[5000px] p-6 md:p-10" : "opacity-0 max-h-0 p-0 overflow-hidden"}`}
                    >
                      {/* Mode Cari: Grid Biasa */}
                      {searchTerm || activeBidang !== "Semua" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {group.items.map((p: any) => (
                            <ProfilCard key={p.id} p={p} />
                          ))}
                        </div>
                      ) : (
                        /* Mode Normal: Tree Diagram */
                        <>
                          {isCentralBlock ? (
                            <div className="relative flex flex-col items-center">
                              {(() => {
                                const ketuaDewan = group.items.filter(
                                  (p) => p.jabatan?.toLowerCase() === "ketua",
                                );
                                const anggotaDewan = group.items.filter(
                                  (p) => p.jabatan?.toLowerCase() !== "ketua",
                                );
                                return (
                                  <>
                                    {ketuaDewan.length > 0 && (
                                      <div className="w-full flex flex-col items-center mb-6 relative z-10">
                                        {ketuaDewan.map((p: any) => (
                                          <ProfilCard
                                            key={p.id}
                                            p={p}
                                            isCentral={true}
                                          />
                                        ))}
                                        {anggotaDewan.length > 0 && (
                                          <div className="hidden md:block absolute top-full left-1/2 w-px h-6 bg-blue-200 -translate-x-1/2 -z-10"></div>
                                        )}
                                      </div>
                                    )}
                                    {anggotaDewan.length > 0 && (
                                      <div className="flex flex-wrap justify-center gap-4 max-w-4xl relative z-10">
                                        {anggotaDewan.map((p: any) => (
                                          <ProfilCard
                                            key={p.id}
                                            p={p}
                                            isCentral={true}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : isPengurusHarian ? (
                            <div className="relative flex flex-col items-center w-full">
                              {(() => {
                                const ketumItems = group.items.filter((p) =>
                                  p.jabatan
                                    ?.toLowerCase()
                                    .includes("ketua umum"),
                                );
                                const wakilKetuaItems = group.items.filter(
                                  (p) =>
                                    p.jabatan
                                      ?.toLowerCase()
                                      .includes("wakil ketua") ||
                                    p.jabatan?.toLowerCase() ===
                                      "wakil ketua umum",
                                );
                                const sekretarisItems = group.items.filter(
                                  (p) =>
                                    (p.jabatan
                                      ?.toLowerCase()
                                      .includes("sekretaris wilayah") ||
                                      p.jabatan
                                        ?.toLowerCase()
                                        .includes("sekretaris umum") ||
                                      p.jabatan?.toLowerCase() === "sekum") &&
                                    !p.jabatan?.toLowerCase().includes("wakil"),
                                );
                                const wakilSekretarisItems = group.items.filter(
                                  (p) =>
                                    p.jabatan
                                      ?.toLowerCase()
                                      .includes("wakil sekretaris"),
                                );
                                const bendaharaItems = group.items.filter(
                                  (p) =>
                                    (p.jabatan
                                      ?.toLowerCase()
                                      .includes("bendahara umum") ||
                                      p.jabatan
                                        ?.toLowerCase()
                                        .includes("bendum")) &&
                                    !p.jabatan?.toLowerCase().includes("wakil"),
                                );
                                const wakilBendaharaItems = group.items.filter(
                                  (p) =>
                                    p.jabatan
                                      ?.toLowerCase()
                                      .includes("wakil bendahara"),
                                );

                                const handledIds = new Set([
                                  ...ketumItems.map((p) => p.id),
                                  ...wakilKetuaItems.map((p) => p.id),
                                  ...sekretarisItems.map((p) => p.id),
                                  ...wakilSekretarisItems.map((p) => p.id),
                                  ...bendaharaItems.map((p) => p.id),
                                  ...wakilBendaharaItems.map((p) => p.id),
                                ]);
                                const otherHarianItems = group.items.filter(
                                  (p) => !handledIds.has(p.id),
                                );

                                return (
                                  <>
                                    {ketumItems.length > 0 && (
                                      <div className="w-full flex flex-col items-center mb-10 relative z-20">
                                        {ketumItems.map((p) => (
                                          <ProfilCard
                                            key={p.id}
                                            p={p}
                                            isCentral={true}
                                          />
                                        ))}
                                        <div className="hidden md:block absolute top-full left-1/2 w-px h-10 bg-blue-300 -translate-x-1/2 -z-10"></div>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl relative z-10">
                                      <div className="hidden md:block absolute -top-10 left-[16.66%] right-[16.66%] h-px bg-blue-300 -z-10"></div>
                                      <div className="flex flex-col items-center relative">
                                        <div className="hidden md:block absolute -top-10 left-1/2 w-px h-10 bg-blue-300 -translate-x-1/2 -z-10"></div>
                                        <div className="w-full flex justify-center mb-6">
                                          {sekretarisItems.map((p) => (
                                            <ProfilCard
                                              key={p.id}
                                              p={p}
                                              isCentral={true}
                                            />
                                          ))}
                                        </div>
                                        {wakilSekretarisItems.length > 0 && (
                                          <div className="flex flex-wrap justify-center gap-4 border-t border-dashed border-blue-200 pt-6 mt-2 w-full relative">
                                            <div className="hidden md:block absolute -top-8 left-1/2 w-px h-8 bg-blue-200 -translate-x-1/2 -z-10"></div>
                                            {wakilSekretarisItems.map((p) => (
                                              <ProfilCard
                                                key={p.id}
                                                p={p}
                                                isCentral={false}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex flex-col items-center relative">
                                        <div className="hidden md:block absolute -top-10 left-1/2 w-px h-10 bg-blue-300 -translate-x-1/2 -z-10"></div>
                                        <div className="flex flex-wrap justify-center gap-4">
                                          {wakilKetuaItems.map((p) => (
                                            <ProfilCard
                                              key={p.id}
                                              p={p}
                                              isCentral={true}
                                            />
                                          ))}
                                        </div>
                                      </div>

                                      <div className="flex flex-col items-center relative">
                                        <div className="hidden md:block absolute -top-10 left-1/2 w-px h-10 bg-blue-300 -translate-x-1/2 -z-10"></div>
                                        <div className="w-full flex justify-center mb-6">
                                          {bendaharaItems.map((p) => (
                                            <ProfilCard
                                              key={p.id}
                                              p={p}
                                              isCentral={true}
                                            />
                                          ))}
                                        </div>
                                        {wakilBendaharaItems.length > 0 && (
                                          <div className="flex flex-wrap justify-center gap-4 border-t border-dashed border-blue-200 pt-6 mt-2 w-full relative">
                                            <div className="hidden md:block absolute -top-8 left-1/2 w-px h-8 bg-blue-200 -translate-x-1/2 -z-10"></div>
                                            {wakilBendaharaItems.map((p) => (
                                              <ProfilCard
                                                key={p.id}
                                                p={p}
                                                isCentral={false}
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {otherHarianItems.length > 0 && (
                                      <div className="w-full mt-10 pt-8 border-t border-slate-200 flex flex-wrap justify-center gap-4">
                                        {otherHarianItems.map((p: any) => (
                                          <ProfilCard
                                            key={p.id}
                                            p={p}
                                            isCentral={false}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                              {group.items.map((p: any) => (
                                <ProfilCard key={p.id} p={p} />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* BLOK DPD (Modal Tetap Aktif) */}
      {!searchTerm && activeBidang === "Semua" && (
        <section className="py-16 bg-white border-t border-slate-200 mt-8 relative z-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col items-center text-center mb-10">
              <h4 className="text-slate-400 font-bold tracking-widest uppercase text-[10px] mb-2">
                Jaringan Daerah
              </h4>
              <h2 className="text-xl md:text-2xl font-black text-blue-950">
                Dewan Pimpinan Daerah (DPD)
              </h2>
            </div>

            {dpdList.length === 0 ? (
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-sm text-slate-400">
                Belum ada data DPD.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
                {dpdList.map((dpd) => (
                  <div
                    key={dpd.id}
                    onClick={() => setSelectedDpd(dpd)}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 hover:border-blue-300 transition-all duration-300 cursor-pointer group flex items-center gap-4"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 shrink-0 group-hover:border-blue-300 transition-colors flex items-center justify-center relative">
                      {dpd.fotoUrl ? (
                        <img
                          src={dpd.fotoUrl}
                          alt={dpd.ketua || "Foto DPD"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src="/logo-dpp-ika.png"
                          alt="Logo Placeholder"
                          className="w-3/4 h-3/4 object-contain opacity-30 grayscale"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm text-blue-950 group-hover:text-blue-700 transition-colors truncate mb-0.5">
                        {dpd.nama}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate mb-2">
                        Ketua:{" "}
                        <span className="font-semibold text-slate-700">
                          {dpd.ketua || "Belum ditentukan"}
                        </span>
                      </p>
                      <span
                        className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${dpd.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                      >
                        {dpd.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* MODAL POPUP DETAIL DPD */}
      {selectedDpd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 relative border border-slate-100">
            <button
              onClick={() => setSelectedDpd(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-white z-20 transition-colors"
            >
              ✕
            </button>

            <div className="bg-blue-950 p-8 pt-10 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-800/50 rounded-full blur-3xl"></div>

              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-xl bg-slate-50 relative z-10 mb-4 flex items-center justify-center">
                {selectedDpd.fotoUrl ? (
                  <img
                    src={selectedDpd.fotoUrl}
                    alt={selectedDpd.ketua || "Foto Profil"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src="/logo-dpp-ika.png"
                    alt="Logo Placeholder"
                    className="w-16 h-16 object-contain opacity-30 grayscale"
                  />
                )}
              </div>

              <h3 className="text-xl font-black text-white relative z-10 leading-tight">
                {selectedDpd.ketua || "Belum Ditentukan"}
              </h3>
              <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mt-1 relative z-10">
                Ketua {selectedDpd.nama}
              </p>
            </div>

            <div className="p-6 text-center bg-white">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Status DPD
                  </p>
                  <p
                    className={`text-xs font-black uppercase ${selectedDpd.status === "Aktif" ? "text-green-600" : "text-orange-600"}`}
                  >
                    {selectedDpd.status}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Wilayah
                  </p>
                  <p className="text-xs font-black text-blue-900 uppercase truncate">
                    {selectedDpd.nama.replace(/DPD /i, "")}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedDpd(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-colors shadow-sm text-sm"
              >
                Tutup Profil
              </button>
            </div>
          </div>
        </div>
      )}

      <FooterPublic />
    </div>
  );
}
