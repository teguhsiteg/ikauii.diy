"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export default function PengurusPage() {
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [bidangList, setBidangList] = useState<string[]>([]);
  const [activeBidang, setActiveBidang] = useState<string>("Semua");
  const [searchTerm, setSearchTerm] = useState("");

  const [dpdList, setDpdList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ALGORITMA RANKING JABATAN (KASTA)
  const getRank = (jabatan: string) => {
    const j = (jabatan || "").toLowerCase();

    if (j.includes("ketua umum")) return 100;
    if (j === "ketua") return 98; // Kasta Ketua Dewan (Pakar/Pembina/Penasihat)
    if (
      j.includes("sekretaris wilayah") ||
      j.includes("sekretaris umum") ||
      j.includes("sekum")
    )
      return 95;
    if (j.includes("bendahara umum") || j.includes("bendum")) return 90;
    if (j.includes("wakil ketua")) return 85;
    if (j.includes("wakil sekretaris")) return 80;
    if (j.includes("wakil bendahara")) return 75;
    if (j.includes("sekretaris") && !j.includes("bidang")) return 65;
    if (j.includes("bendahara") && !j.includes("bidang")) return 60;
    if (j.includes("koordinator")) return 50;

    return 0; // Anggota Biasa
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const qPengurus = query(
          collection(db, "pengurus"),
          orderBy("createdAt", "asc"),
        );
        const snapPengurus = await getDocs(qPengurus);

        // Fetch, Sort by Rank, then Sort by Alphabet (A-Z)
        const data = snapPengurus.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .sort((a: any, b: any) => {
            const rankDiff = getRank(b.jabatan) - getRank(a.jabatan);
            if (rankDiff !== 0) return rankDiff;
            return (a.nama || "").localeCompare(b.nama || "");
          });

        setPengurusList(data);

        const uniqueBidang = Array.from(
          new Set(data.map((item: any) => item.bidang || "Belum Ditentukan")),
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

  // --- FILTER & SEARCH SAKTI ---
  const filteredData = useMemo(() => {
    return pengurusList.filter((p) => {
      const matchBidang =
        activeBidang === "Semua" ||
        (p.bidang || "Belum Ditentukan") === activeBidang;
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
        items: filteredData.filter(
          (p) => (p.bidang || "Belum Ditentukan") === b,
        ),
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

  // --- DESAIN KARTU PROFIL COMPACT (VIP HIGHLIGHT) ---
  const ProfilCard = ({
    p,
    isCentral = false,
  }: {
    p: any;
    isCentral?: boolean;
  }) => {
    const jabatanLow = (p.jabatan || "").toLowerCase();

    // DETEKSI VIP UNTUK WARNA EMAS (Ketua Umum, Ketua, Sekwil, Bendum)
    const isVIP =
      jabatanLow.includes("ketua umum") ||
      jabatanLow === "ketua" ||
      jabatanLow.includes("sekretaris wilayah") ||
      jabatanLow.includes("sekretaris umum") ||
      jabatanLow.includes("bendahara umum");

    return (
      <div
        className={`relative bg-white rounded-xl p-4 shadow-sm border hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col items-center mx-auto overflow-hidden group
        ${isVIP ? "border-yellow-400 shadow-yellow-100/50" : "border-slate-100"} 
        ${isCentral ? "w-full max-w-[220px]" : "w-full min-w-[160px] max-w-[220px]"}`}
      >
        <div
          className={`absolute top-0 left-0 w-full h-1 transition-all duration-300 ${isVIP ? "bg-yellow-500" : "bg-blue-200 group-hover:bg-blue-500"}`}
        ></div>

        <div
          className={`w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border-2 mb-3 bg-slate-50 flex items-center justify-center relative z-10 transition-colors
          ${isVIP ? "border-yellow-400" : "border-slate-100 group-hover:border-blue-200"}`}
        >
          <img
            src={p.fotoUrl || "/logo-dpp-ika.png"}
            alt={p.nama}
            className={`w-full h-full ${p.fotoUrl ? "object-cover" : "object-contain p-3 opacity-40"}`}
          />
        </div>

        <div className="text-center z-10 w-full">
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
      <NavbarPublic />

      {/* HEADER */}
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

      {/* SEARCH BAR & FILTER BARU (Lebih Sleek & Clean) */}
      <section className="sticky top-0 bg-white/80 backdrop-blur-md z-30 py-3 border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl shadow-inner">
            {/* Input Search */}
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

            {/* Dropdown Filter */}
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

      {/* KONTEN STRUKTUR POHON (DPW) */}
      <section className="py-12 flex-grow relative z-20">
        <div className="max-w-6xl mx-auto px-6">
          {/* Sembunyikan label DPW jika sedang mencari (Search) */}
          {!searchTerm && activeBidang === "Semua" && (
            <div className="text-center mb-12 relative">
              <div className="inline-block bg-white text-blue-950 px-6 py-2 rounded-full font-black text-sm tracking-widest shadow-sm border border-slate-200 relative z-10">
                PENGURUS TINGKAT WILAYAH
              </div>
              <div className="hidden lg:block absolute top-full left-1/2 w-px h-10 bg-blue-200 -translate-x-1/2 -z-10"></div>
            </div>
          )}

          {groupedData.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium text-sm">
                Tidak ada pengurus ditemukan.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {groupedData.map((group, groupIdx) => {
                const namaBidang = group.bidangName.toLowerCase();
                const isCentralBlock =
                  namaBidang.includes("pakar") ||
                  namaBidang.includes("pembina") ||
                  namaBidang.includes("penasihat") ||
                  namaBidang.includes("penasehat");
                const isPengurusHarian = namaBidang.includes("harian");

                // JIKA SEARCH/FILTER AKTIF -> Tampilkan GRID biasa agar tidak memakan tempat
                if (searchTerm || activeBidang !== "Semua") {
                  return (
                    <div key={groupIdx}>
                      <h2 className="text-xs font-bold text-blue-950 mb-4 border-l-4 border-yellow-500 pl-2 uppercase tracking-widest">
                        {group.bidangName}
                      </h2>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {group.items.map((p: any) => (
                          <ProfilCard key={p.id} p={p} />
                        ))}
                      </div>
                    </div>
                  );
                }

                // --- MODE NORMAL (POHON HIERARKI) ---

                // 1. BLOK PENASIHAT / PAKAR (Telah Diperbaiki: Ketua Dewan Di Atas)
                if (isCentralBlock) {
                  const ketuaDewan = group.items.filter(
                    (p) => p.jabatan?.toLowerCase() === "ketua",
                  );
                  const anggotaDewan = group.items.filter(
                    (p) => p.jabatan?.toLowerCase() !== "ketua",
                  );

                  return (
                    <div
                      key={groupIdx}
                      className="relative flex flex-col items-center"
                    >
                      <div className="bg-white border border-slate-200 text-slate-600 px-5 py-1.5 rounded-full mb-6 font-bold text-[10px] uppercase tracking-widest shadow-sm z-10">
                        {group.bidangName}
                      </div>

                      {/* Ketua Dewan (Di Tengah Atas) */}
                      {ketuaDewan.length > 0 && (
                        <div className="w-full flex flex-col items-center mb-6 relative z-10">
                          {ketuaDewan.map((p: any) => (
                            <ProfilCard key={p.id} p={p} isCentral={true} />
                          ))}
                          {anggotaDewan.length > 0 && (
                            <div className="hidden lg:block absolute top-full left-1/2 w-px h-6 bg-blue-200 -translate-x-1/2 -z-10"></div>
                          )}
                        </div>
                      )}

                      {/* Anggota Dewan (Berjajar ke Samping) */}
                      {anggotaDewan.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl relative z-10">
                          {anggotaDewan.map((p: any) => (
                            <ProfilCard key={p.id} p={p} isCentral={true} />
                          ))}
                        </div>
                      )}

                      {groupIdx < groupedData.length - 1 && (
                        <div className="hidden lg:block w-px h-12 bg-blue-200 mt-6"></div>
                      )}
                    </div>
                  );
                }

                // 2. BLOK PENGURUS HARIAN (Inti)
                if (isPengurusHarian) {
                  // Karena sudah di getRank, Ketua Umum pasti ada di index 0
                  const ketumItems = group.items.filter((p) =>
                    p.jabatan?.toLowerCase().includes("ketua umum"),
                  );
                  const nonKetumItems = group.items.filter(
                    (p) => !p.jabatan?.toLowerCase().includes("ketua umum"),
                  );

                  return (
                    <div
                      key={groupIdx}
                      className="relative flex flex-col items-center"
                    >
                      {/* Ketua Umum Sendirian di Atas Tengah */}
                      {ketumItems.length > 0 && (
                        <div className="w-full flex flex-col items-center mb-8 relative">
                          <ProfilCard p={ketumItems[0]} isCentral={true} />
                          {nonKetumItems.length > 0 && (
                            <div className="hidden lg:block absolute top-full left-1/2 w-px h-8 bg-blue-200 -translate-x-1/2 -z-10"></div>
                          )}
                        </div>
                      )}

                      {/* Sisa Pengurus Harian (Sekwil, Bendum, Wakil) Berjajar di Bawahnya */}
                      {nonKetumItems.length > 0 && (
                        <div className="w-full flex flex-col items-center relative z-10">
                          <div className="flex flex-wrap justify-center gap-4 max-w-5xl relative">
                            {/* Garis Horizontal Penghubung */}
                            {ketumItems.length > 0 && (
                              <div className="hidden lg:block absolute -top-4 left-[15%] right-[15%] h-px bg-blue-200 -z-10"></div>
                            )}
                            {nonKetumItems.map((p: any) => (
                              <ProfilCard key={p.id} p={p} isCentral={true} />
                            ))}
                          </div>
                        </div>
                      )}
                      {groupIdx < groupedData.length - 1 && (
                        <div className="hidden lg:block w-px h-16 bg-blue-200 mt-10"></div>
                      )}
                    </div>
                  );
                }

                // 3. BLOK BIDANG / DEPARTEMEN BIASA
                return (
                  <div
                    key={groupIdx}
                    className="relative pt-6 border-t border-slate-100"
                  >
                    <h2 className="text-xs font-bold text-blue-950 mb-6 border-l-4 border-yellow-500 pl-2 uppercase tracking-widest bg-slate-50 inline-block pr-4">
                      {group.bidangName}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {group.items.map((p: any) => (
                        <ProfilCard key={p.id} p={p} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* BLOK DPD KABUPATEN/KOTA */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {dpdList.map((dpd) => (
                  <div
                    key={dpd.id}
                    className="bg-slate-50 border border-slate-100 rounded-xl p-4 hover:bg-white hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <div className="font-bold text-sm text-blue-950 group-hover:text-blue-700 transition-colors">
                          {dpd.nama}
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${dpd.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}
                        >
                          {dpd.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-2">
                        Ketua:{" "}
                        <span className="font-semibold text-slate-700">
                          {dpd.ketua || "Belum ditentukan"}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <FooterPublic />
    </div>
  );
}
