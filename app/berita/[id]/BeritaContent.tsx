"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export const dynamic = "force-static";

export default function DetailBeritaPage() {
  const { id } = useParams();
  const router = useRouter();
  const [berita, setBerita] = useState<any>(null);
  const [beritaTerkait, setBeritaTerkait] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // 1. Ambil Berita Utama
        const docRef = doc(db, "berita", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBerita({ id: docSnap.id, ...docSnap.data() });
        } else {
          router.push("/");
          return;
        }

        // 2. Ambil Berita Terbaru untuk Sidebar (Bukan Dummy)
        // Mengambil 5 berita terbaru, nanti kita filter agar berita yang sedang dibaca tidak muncul di sidebar
        const q = query(
          collection(db, "berita"),
          orderBy("createdAt", "desc"),
          limit(5),
        );
        const snapLainnya = await getDocs(q);

        const dataLainnya = snapLainnya.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((b) => b.id !== id) // Sembunyikan berita yang sedang dibaca dari sidebar
          .slice(0, 4); // Ambil maksimal 4 saja

        setBeritaTerkait(dataLainnya);
      } catch (error) {
        console.error("Gagal mengambil data berita:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  const handleShareWA = () => {
    const url = window.location.href;
    const text = `*${berita.judul}*\n\nBaca selengkapnya di portal resmi IKA UII DIY:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Format Tanggal Lengkap (Berita Utama)
  const formatDateLengkap = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const optionsDate: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    return `${date.toLocaleDateString("id-ID", optionsDate)} ${date.toLocaleTimeString("id-ID", optionsTime)} WIB`;
  };

  // Format Tanggal Singkat (Sidebar)
  const formatDateSingkat = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <NavbarPublic />
        <main className="flex-grow flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
        </main>
        <FooterPublic />
      </div>
    );
  }

  if (!berita) return null;

  return (
    <div className="min-h-screen bg-white font-sans text-[#202124]">
      <NavbarPublic />

      <main className="max-w-[1140px] mx-auto px-4 sm:px-6 pt-[100px] md:pt-[170px] pb-10 animate-in fade-in duration-500">
        {/* BREADCRUMB */}
        <nav className="flex items-center text-xs font-bold text-slate-500 uppercase tracking-wider mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Beranda
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <Link
            href="/berita"
            className="hover:text-blue-600 transition-colors"
          >
            Berita
          </Link>
          <span className="mx-2 text-slate-300">/</span>
          <span className="text-red-600">{berita.kategori}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* ================================================== */}
          {/* KOLOM KIRI (KONTEN UTAMA - 8 Kolom) */}
          {/* ================================================== */}
          <article className="lg:col-span-8">
            {/* HEADLINE */}
            <h1 className="text-3xl md:text-4xl lg:text-[42px] font-black text-[#111111] leading-[1.25] tracking-tight mb-5">
              {berita.judul}
            </h1>

            {/* AUTHOR & DATE */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[15px] font-bold text-[#111111] uppercase tracking-wide">
                  {berita.koordinator || "Tim Jurnalistik IKA UII"}
                </p>
                <p className="text-sm text-slate-500 mt-0.5">
                  {formatDateLengkap(berita.createdAt)}
                </p>
              </div>

              {/* SHARE BUTTONS */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShareWA}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-[#25D366] text-white hover:scale-105 transition-transform shadow-sm"
                  title="Bagikan ke WhatsApp"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.883-.733-1.48-1.638-1.653-1.935-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors relative"
                  title="Salin Tautan"
                >
                  {isCopied ? (
                    <span className="text-[10px] font-bold text-blue-600 absolute -top-6 bg-blue-50 px-2 py-1 rounded">
                      Tersalin
                    </span>
                  ) : null}
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* GAMBAR UTAMA */}
            <div className="mb-8 border-t border-slate-200 pt-6">
              <figure className="m-0">
                <img
                  src={berita.imgUrl}
                  alt={berita.judul}
                  className="w-full h-auto object-cover rounded-md"
                />
                <figcaption className="text-xs text-slate-500 mt-2 italic border-b border-slate-100 pb-4">
                  Dok. {berita.kategori} IKA UII DIY.{" "}
                  {berita.bidang ? `(${berita.bidang})` : ""}
                </figcaption>
              </figure>
            </div>

            {/* TEKS ARTIKEL LENGKAP */}
            <div className="prose prose-lg max-w-none text-[18px] leading-[1.8] text-[#202124]">
              <p className="whitespace-pre-wrap">
                <strong className="font-black text-black">Yogyakarta</strong> -{" "}
                {berita.isi}
              </p>
            </div>

            {/* TAGS BAWAH */}
            <div className="mt-12 pt-6 border-t border-slate-200">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-bold text-sm text-slate-800 mr-2">
                  Topik Terkait:
                </span>
                <Link
                  href="/#berita"
                  className="px-4 py-1.5 border border-slate-200 text-blue-700 text-sm font-bold rounded hover:bg-slate-50 transition-colors"
                >
                  #{berita.kategori}
                </Link>
                {berita.bidang && (
                  <Link
                    href="/#berita"
                    className="px-4 py-1.5 border border-slate-200 text-blue-700 text-sm font-bold rounded hover:bg-slate-50 transition-colors"
                  >
                    #{berita.bidang}
                  </Link>
                )}
                <Link
                  href="/#berita"
                  className="px-4 py-1.5 border border-slate-200 text-blue-700 text-sm font-bold rounded hover:bg-slate-50 transition-colors"
                >
                  #AlumniUII
                </Link>
              </div>
            </div>
          </article>

          {/* ================================================== */}
          {/* KOLOM KANAN (SIDEBAR DINAMIS - 4 Kolom) */}
          {/* ================================================== */}
          <aside className="lg:col-span-4 mt-12 lg:mt-0">
            <div className="sticky top-28">
              {/* HEADER BERITA TERBARU */}
              <div className="mb-6 border-b-2 border-slate-900 pb-2 flex items-center justify-between">
                <h3 className="text-lg font-black text-[#111111] uppercase tracking-wide">
                  Berita Terbaru
                </h3>
                <Link
                  href="/berita"
                  className="text-xs font-bold text-blue-600 hover:underline"
                >
                  Semua Berita
                </Link>
              </div>

              {/* LIST BERITA DINAMIS DARI DATABASE */}
              <div className="space-y-6">
                {beritaTerkait.length > 0 ? (
                  beritaTerkait.map((item, index) => (
                    <Link
                      href={`/berita/${item.id}`}
                      key={item.id}
                      className="group flex gap-4 items-start"
                    >
                      {/* Nomor Urut (Opsional, gaya media online) */}
                      <span className="text-2xl font-black text-slate-200 group-hover:text-red-500 transition-colors">
                        {index + 1}
                      </span>

                      <div className="flex-1">
                        <h4 className="text-[15px] font-bold text-[#111111] group-hover:text-blue-700 leading-[1.4] mb-1.5">
                          {item.judul}
                        </h4>
                        <p className="text-[11px] font-medium text-slate-500 uppercase">
                          {formatDateSingkat(item.createdAt)}
                        </p>
                      </div>

                      <div className="w-[80px] h-[80px] shrink-0 rounded bg-slate-100 overflow-hidden relative">
                        <img
                          src={item.imgUrl}
                          alt={item.judul}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic text-center py-4 bg-slate-50 rounded">
                    Belum ada berita lain yang diterbitkan.
                  </p>
                )}
              </div>

              {/* BANNER PROMOSI ORGANISASI */}
              <div className="mt-10 p-1">
                <div className="bg-gradient-to-br from-[#0B2239] to-blue-900 w-full rounded-lg flex flex-col items-center justify-center p-6 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>

                  <img
                    src="/logo-dpp-ika.png"
                    alt="Logo"
                    className="w-12 h-12 mb-3 relative z-10 brightness-0 invert"
                  />
                  <h4 className="font-black text-white text-lg mb-1 relative z-10 tracking-wide">
                    PORTAL ALUMNI
                  </h4>
                  <p className="text-[11px] text-blue-200 mb-5 relative z-10 font-medium">
                    Akses Direktori Bisnis, Agenda, dan E-KTA resmi IKA UII DIY.
                  </p>
                  <Link
                    href="/login"
                    className="bg-[#FCD116] text-[#0B2239] font-black px-6 py-2 rounded shadow-md text-xs uppercase tracking-widest hover:bg-yellow-400 transition-colors relative z-10"
                  >
                    Masuk Portal
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <FooterPublic />
    </div>
  );
}
