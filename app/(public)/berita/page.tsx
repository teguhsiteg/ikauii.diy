"use client";

import { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
//import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import Link from "next/link";

// --- FUNGSI FORMAT RUPIAH ---
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(angka);
};

// --- WIDGET DONASI SIDEBAR (DINAMIS DARI PROPS) ---
const SidebarDonationWidget = ({ donasiData }: { donasiData: any }) => (
  <div className="bg-gradient-to-b from-green-800 to-emerald-950 rounded-2xl p-6 text-white shadow-xl border border-green-700 relative overflow-hidden sticky top-[160px]">
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-2xl pointer-events-none"></div>

    <div className="relative z-10">
      <h3 className="text-xl font-black mb-2 text-yellow-400 border-b border-green-600/50 pb-3">
        Program Jum&apos;at Berkah
      </h3>

      <div className="mt-4 bg-black/20 rounded-xl p-4 border border-white/10 text-center">
        <p className="text-[10px] text-green-200 uppercase tracking-widest mb-1">
          Salurkan Donasi Melalui
        </p>
        <p className="font-bold text-xl tracking-wider">
          BSI <span className="text-yellow-400">7335717788</span>
        </p>
        <p className="text-[10px] text-green-100 uppercase mt-1">
          a.n SYAIFULLOH YUSUF
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {/* TOTAL MASUK DINAMIS */}
        <div className="bg-white/10 rounded-lg p-3 border border-white/5">
          <p className="text-[10px] text-green-200 uppercase font-bold tracking-wider">
            Total Donasi Masuk
          </p>
          <p className="font-black text-xl text-white mt-1">
            {formatRupiah(donasiData?.totalMasuk || 0)}
          </p>
        </div>

        {/* TOTAL KELUAR DINAMIS */}
        <div className="bg-black/30 rounded-lg p-3 border border-black/20">
          <p className="text-[10px] text-yellow-300 uppercase font-bold tracking-wider">
            Telah Disalurkan
          </p>
          <p className="font-black text-xl text-yellow-400 mt-1">
            {formatRupiah(donasiData?.totalKeluar || 0)}
          </p>

          {/* DETAIL PENGGUNAAN DINAMIS */}
          <div className="mt-2 pt-2 border-t border-white/10">
            <p className="text-[10px] text-green-100 italic whitespace-pre-wrap">
              {donasiData?.detailPenggunaan || "Belum ada rincian penyaluran."}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function BeritaPage() {
  const [beritaList, setBeritaList] = useState<any[]>([]);
  const [donasiStat, setDonasiStat] = useState<any>({}); // State baru untuk data donasi
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Semua");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Ambil Data Berita
        const q = query(collection(db, "berita"), orderBy("createdAt", "desc"));
        const snapBerita = await getDocs(q);
        setBeritaList(
          snapBerita.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      } catch (error) {
        console.error("Gagal memuat data Berita (Cek Rules/Index):", error);
      }

      try {
        // 2. Ambil Data Transparansi Donasi
        const docDonasi = await getDoc(doc(db, "pengaturan", "donasi_jumat"));
        if (docDonasi.exists()) {
          setDonasiStat(docDonasi.data());
        }
      } catch (error) {
        console.error("Gagal memuat data Pengaturan donasi_jumat:", error);
      }

      setIsLoading(false);
    };
    fetchData();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(beritaList.map((b) => b.kategori || "Umum"));
    cats.add("Jum'at Berkah");
    return ["Semua", ...Array.from(cats)];
  }, [beritaList]);

  const filteredBerita = useMemo(() => {
    return beritaList.filter((b) => {
      const matchesSearch = b.judul
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory =
        activeCategory === "Semua" || b.kategori === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [beritaList, searchTerm, activeCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <section className="pt-32 pb-12 bg-blue-950 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-4">
            Berita & <span className="text-yellow-400">Publikasi</span>
          </h1>
          <p className="text-slate-300 max-w-2xl text-sm md:text-base">
            Informasi terbaru mengenai kegiatan, agenda sosial, dan perkembangan
            organisasi DPW IKA UII DIY.
          </p>
        </div>
      </section>

      <section className="top-[88px] z-30 bg-white border-b border-slate-200 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                  activeCategory === cat
                    ? "bg-blue-900 text-white border-blue-900 shadow-md"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72 shrink-0">
            <input
              type="text"
              placeholder="Cari berita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-900 outline-none"
            />
          </div>
        </div>
      </section>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full">
          {filteredBerita.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
              <p className="text-slate-500 font-medium">
                Belum ada berita yang diterbitkan di kategori ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredBerita.map((berita) => (
                <Link
                  key={berita.id}
                  href={`/berita/${berita.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden bg-slate-200">
                    <img
                      src={berita.thumbnail || "/logo-dpp-ika.png"}
                      alt={berita.judul}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span
                        className={`backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${berita.kategori === "Jum'at Berkah" ? "bg-green-700/90" : "bg-blue-900/90"}`}
                      >
                        {berita.kategori || "Umum"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2">
                      {new Date(berita.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <h3 className="text-lg font-bold text-blue-950 group-hover:text-blue-700 transition-colors line-clamp-2 mb-3">
                      {berita.judul}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-3 mb-6 flex-grow">
                      {berita.ringkasan ||
                        berita.isi?.replace(/<[^>]*>/g, "").substring(0, 120) +
                          "..."}
                    </p>
                    <div className="flex items-center text-blue-900 font-bold text-xs group-hover:gap-2 transition-all">
                      BACA SELENGKAPNYA <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* WIDGET KANAN: Mengirim data yang diambil dari Firebase sebagai props */}
        <aside className="w-full lg:w-[350px] shrink-0">
          <SidebarDonationWidget donasiData={donasiStat} />
        </aside>
      </main>

      <FooterPublic />
    </div>
  );
}
