"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import Link from "next/link";

// IMPORT NAVBAR DAN FOOTER
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export default function LandingPage() {
  // --- STATE DATA FIREBASE ---
  const [cms, setCms] = useState({
    heroTitle: "Sinergi Alumni untuk",
    heroHighlight: "KEMAJUAN NEGERI",
    heroDesc:
      "Dewan Pimpinan Wilayah Ikatan Keluarga Alumni Universitas Islam Indonesia (DPW IKA UII) Daerah Istimewa Yogyakarta. Hadir sebagai wadah kolaborasi, inovasi, dan kontribusi nyata bagi almamater dan masyarakat luas.",
    heroBgUrl:
      "https://images.unsplash.com/photo-1596404748151-51f7d4323af2?q=80&w=2000&auto=format&fit=crop",
    profilImgUrl:
      "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=800&auto=format&fit=crop",
  });

  const [beritaList, setBeritaList] = useState<any[]>([]);
  const [agendaList, setAgendaList] = useState<any[]>([]);
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [galeriList, setGaleriList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FUNGSI YOUTUBE EXTRACTOR ---
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11
      ? `https://www.youtube.com/embed/${match[2]}?autoplay=0&rel=0`
      : null;
  };
  const ytEmbedUrl = getYouTubeEmbedUrl(cms.profilImgUrl);

  // --- FETCH DATA FIREBASE MULTIPLE COLLECTIONS ---
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "landing_page"));
        if (docSnap.exists()) {
          setCms((prev) => ({ ...prev, ...docSnap.data() }));
        }

        const qBerita = query(
          collection(db, "berita"),
          orderBy("createdAt", "desc"),
          limit(6),
        );
        const snapBerita = await getDocs(qBerita);
        setBeritaList(snapBerita.docs.map((d) => ({ id: d.id, ...d.data() })));

        // AGENDA: Limit diubah jadi 6 agar bisa 3 ke bawah, lalu 3 ke samping
        const qAgenda = query(
          collection(db, "agenda"),
          orderBy("createdAt", "desc"),
          limit(6),
        );
        const snapAgenda = await getDocs(qAgenda);
        setAgendaList(snapAgenda.docs.map((d) => ({ id: d.id, ...d.data() })));

        // 🛡️ ALGORITMA RANKING SAKTI: PENGURUS INTI VIP ONLY
        const snapPengurus = await getDocs(collection(db, "pengurus"));
        const allPengurus = snapPengurus.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        const getRank = (jabatan: string, bidang: string) => {
          const j = (jabatan || "").toLowerCase();
          const b = (bidang || "").toLowerCase();

          if (j.includes("ketua umum")) return 100;
          if (j.includes("sekretaris umum") || j.includes("sekum")) return 90;
          if (j.includes("bendahara umum") || j.includes("bendum")) return 80;
          if (
            j.includes("ketua") &&
            (b.includes("pembina") ||
              b.includes("pakar") ||
              b.includes("penasihat") ||
              b.includes("penasehat"))
          )
            return 70;
          if (j.includes("wakil ketua")) return 60;
          if (j.includes("sekretaris") && !j.includes("bidang")) return 50;
          if (j.includes("bendahara") && !j.includes("bidang")) return 40;
          if (b.includes("harian") && !j.includes("anggota")) return 30;
          return 0;
        };

        const sortedPengurus = allPengurus.sort((a: any, b: any) => {
          return getRank(b.jabatan, b.bidang) - getRank(a.jabatan, a.bidang);
        });

        let pengurusInti = sortedPengurus.filter(
          (p: any) => getRank(p.jabatan, p.bidang) >= 30,
        );

        if (pengurusInti.length < 4) {
          pengurusInti = sortedPengurus.slice(0, 4);
        } else {
          pengurusInti = pengurusInti.slice(0, 4);
        }

        setPengurusList(pengurusInti);

        const qGaleri = query(
          collection(db, "galeri"),
          orderBy("createdAt", "desc"),
          limit(6),
        );
        const snapGaleri = await getDocs(qGaleri);
        setGaleriList(snapGaleri.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-900 rounded-full animate-spin mb-4 shadow-md"></div>
        <p className="text-blue-950 font-bold tracking-widest uppercase text-sm animate-pulse">
          Memuat Sistem Informasi...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-yellow-400 selection:text-blue-950">
      <NavbarPublic />

      {/* 1. HERO SECTION */}
      <section
        id="beranda"
        className="relative pt-32 pb-28 lg:pt-48 lg:pb-40 flex items-center justify-center min-h-[95vh]"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={cms.heroBgUrl}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0B1221]/75 backdrop-blur-[1px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 flex flex-col items-center text-center mt-10">
          <div className="inline-flex items-center gap-3 border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm text-yellow-400 font-bold px-6 py-2.5 rounded-full text-xs md:text-sm mb-8 uppercase tracking-[0.2em] shadow-lg">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
            Official Portal IKA UII DIY
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white mb-6 leading-[1.1] tracking-tight">
            {cms.heroTitle} <br />
            <span className="text-yellow-500">{cms.heroHighlight}</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-12 leading-relaxed max-w-3xl font-medium">
            {cms.heroDesc}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-5 w-full sm:w-auto">
            <a
              href="#profil"
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-950 px-10 py-4 rounded-full font-extrabold transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto text-lg shadow-[0_4px_20px_rgba(234,179,8,0.25)] hover:shadow-[0_4px_25px_rgba(234,179,8,0.4)]"
            >
              Jelajahi Profil
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                ></path>
              </svg>
            </a>
            <a
              href="#agenda"
              className="bg-transparent border-2 border-slate-400 hover:border-white text-slate-300 hover:text-white px-10 py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto text-lg"
            >
              Lihat Agenda
            </a>
          </div>
        </div>
      </section>

      {/* 2. STATISTIK KORPORAT */}
      <section className="relative z-20 bg-blue-950 border-y-4 border-yellow-500 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="px-4">
              <h3 className="text-4xl font-black text-white mb-2">5+</h3>
              <p className="text-yellow-400 font-extrabold uppercase tracking-widest text-xs mb-3">
                Wilayah Jangkauan
              </p>
              <p className="text-slate-400 text-sm font-medium">
                Meliputi seluruh Kabupaten & Kota di Provinsi Daerah Istimewa
                Yogyakarta.
              </p>
            </div>
            <div className="px-4 pt-8 md:pt-0">
              <h3 className="text-4xl font-black text-white mb-2">10K+</h3>
              <p className="text-yellow-400 font-extrabold uppercase tracking-widest text-xs mb-3">
                Jaringan Alumni
              </p>
              <p className="text-slate-400 text-sm font-medium">
                Terkoneksi kuat lintas fakultas, profesi, dan generasi purna
                bakti.
              </p>
            </div>
            <div className="px-4 pt-8 md:pt-0">
              <h3 className="text-4xl font-black text-white mb-2">Aktif</h3>
              <p className="text-yellow-400 font-extrabold uppercase tracking-widest text-xs mb-3">
                Program Sosial
              </p>
              <p className="text-slate-400 text-sm font-medium">
                Berdedikasi pada pengabdian masyarakat dan pembangunan ekonomi
                umat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. COMPANY PROFILE */}
      <section
        id="profil"
        className="py-28 bg-white scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative group order-2 lg:order-1">
              <div className="absolute -inset-4 border-2 border-slate-100 rounded-[2rem] transform -rotate-3 transition-transform duration-700 group-hover:-rotate-1"></div>
              <div className="absolute -inset-4 border-2 border-blue-50/50 rounded-[2rem] transform rotate-2 transition-transform duration-700 group-hover:rotate-1"></div>
              <div className="relative aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl z-10 border border-slate-200">
                {ytEmbedUrl ? (
                  <iframe
                    width="100%"
                    height="100%"
                    src={ytEmbedUrl}
                    title="Profil Video"
                    frameBorder="0"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                ) : (
                  <img
                    src={cms.profilImgUrl}
                    alt="Profil"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-in-out"
                  />
                )}
              </div>
            </div>

            <div className="space-y-8 order-1 lg:order-2">
              <div>
                <h4 className="flex items-center gap-3 text-yellow-600 font-black tracking-[0.2em] uppercase text-xs mb-4">
                  <span className="w-12 h-1 bg-yellow-500 rounded-full"></span>
                  Tentang Organisasi
                </h4>
                <h2 className="text-4xl lg:text-5xl font-black text-blue-950 leading-[1.2]">
                  Menyatukan Langkah, <br />
                  Membangun{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-900">
                    Peradaban
                  </span>
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-lg text-justify font-medium">
                Sebagai wadah resmi ikatan alumni di tingkat wilayah, DPW IKA
                UII DIY memegang teguh komitmen untuk menjadi katalisator
                perubahan. Kami menyatukan potensi luar biasa dari ribuan alumni
                untuk memberikan kontribusi nyata bagi pembangunan daerah dan
                nasional.
              </p>
              <div className="grid sm:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 text-lg mb-1">
                      Infrastruktur Kuat
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Tata kelola organisasi modern & transparan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 text-lg mb-1">
                      Solidaritas Umat
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Berpihak pada nilai keislaman & kebangsaan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. PENGURUS INTI */}
      <section className="py-24 bg-slate-50 border-t border-slate-200 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h4 className="flex items-center justify-center gap-3 text-yellow-600 font-black tracking-[0.2em] uppercase text-xs mb-4">
              <span className="w-8 h-1 bg-yellow-500 rounded-full"></span> Dewan
              Pimpinan Wilayah{" "}
              <span className="w-8 h-1 bg-yellow-500 rounded-full"></span>
            </h4>
            <h2 className="text-4xl font-black text-blue-950 mb-6">
              Jajaran Pimpinan Inti
            </h2>
            <p className="text-slate-500 text-lg">
              Tokoh-tokoh di balik kemudi pergerakan DPW IKA UII DIY yang
              berdedikasi tinggi untuk memajukan almamater dan masyarakat.
            </p>
          </div>

          {pengurusList.length === 0 ? (
            <div className="text-center bg-white rounded-3xl py-10 border border-slate-200">
              <p className="text-slate-500 font-medium">
                Belum ada data pimpinan inti.
              </p>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {pengurusList.map((p: any) => {
                  const isKetua = p.jabatan?.toLowerCase().includes("ketua");
                  return (
                    <div
                      key={p.id}
                      className={`bg-white rounded-[2rem] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 text-center group flex flex-col items-center border-2 ${isKetua ? "border-yellow-400 shadow-yellow-100" : "border-slate-100"}`}
                    >
                      <div
                        className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 shadow-inner mb-6 transition-colors bg-white flex items-center justify-center relative ${isKetua ? "border-yellow-400" : "border-slate-50 group-hover:border-blue-900"}`}
                      >
                        <img
                          src={p.fotoUrl || "/logo-dpp-ika.png"}
                          alt={p.nama}
                          className={`w-full h-full ${p.fotoUrl ? "object-cover" : "object-contain p-6 opacity-60"}`}
                        />
                        <div className="absolute inset-0 bg-blue-950/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <h3
                        className={`font-black text-xl mb-2 leading-tight ${isKetua ? "text-blue-950" : "text-slate-800"}`}
                      >
                        {p.nama}
                      </h3>
                      <div
                        className={`w-10 h-1 rounded-full mb-3 transition-all duration-300 ${isKetua ? "bg-yellow-500 group-hover:w-16" : "bg-blue-200 group-hover:bg-blue-500 group-hover:w-16"}`}
                      ></div>
                      <p
                        className={`text-sm font-extrabold uppercase tracking-widest leading-snug ${isKetua ? "text-yellow-600" : "text-slate-500"}`}
                      >
                        {p.jabatan}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 text-center">
                <Link
                  href="/pengurus"
                  className="inline-flex items-center gap-3 bg-blue-950 hover:bg-blue-900 text-white px-8 py-4 rounded-full font-bold transition-all shadow-xl hover:-translate-y-1 hover:shadow-2xl group"
                >
                  Lihat Seluruh Struktur Organisasi
                  <svg
                    className="w-5 h-5 group-hover:translate-x-2 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    ></path>
                  </svg>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 5. PUBLIKASI / BERITA */}
      <section
        id="berita"
        className="py-24 bg-white border-t border-slate-200 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h4 className="flex items-center gap-3 text-yellow-600 font-black tracking-[0.2em] uppercase text-xs mb-4">
                <span className="w-12 h-1 bg-yellow-500 rounded-full"></span>{" "}
                Pusat Informasi
              </h4>
              <h2 className="text-4xl font-black text-blue-950">
                Berita & Publikasi
              </h2>
            </div>
            {beritaList.length > 0 && (
              <Link
                href="/berita"
                className="group flex items-center gap-3 bg-slate-50 hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl font-bold transition-colors border border-slate-200 hover:border-blue-200 shrink-0"
              >
                Lihat Semua Rilis{" "}
                <svg
                  className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  ></path>
                </svg>
              </Link>
            )}
          </div>

          {beritaList.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium text-lg">
                Belum ada rilis berita resmi pada saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {beritaList.map((item) => (
                <Link
                  href={`/berita/${item.id}`}
                  key={item.id}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 flex flex-col"
                >
                  {/* GAMBAR DI ATAS DENGAN FALLBACK */}
                  <div className="w-full aspect-[16/10] bg-slate-100 relative border-b border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={item.imgUrl || "/logo-dpp-ika.png"}
                      onError={(e) => {
                        e.currentTarget.src = "/logo-dpp-ika.png";
                        e.currentTarget.className =
                          "w-1/3 h-1/3 object-contain opacity-30 group-hover:scale-110 transition-transform duration-500";
                      }}
                      alt={item.judul || "Berita IKA UII"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-blue-950 text-yellow-400 border border-blue-900 text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                        {item.kategori || "Siaran Pers"}
                      </span>
                    </div>
                  </div>

                  {/* KONTEN TEKS DI BAWAH */}
                  <div className="p-6 md:p-8 flex flex-col flex-grow">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <h3 className="font-bold text-xl md:text-2xl text-blue-950 mb-3 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                      {item.judul}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed mb-6">
                      {item.isi
                        ? item.isi.replace(/<[^>]*>?/gm, "").substring(0, 100) +
                          "..."
                        : ""}
                    </p>
                    <span className="mt-auto text-sm font-bold text-blue-600 group-hover:text-blue-800 flex items-center gap-1 transition-colors">
                      Baca selengkapnya &rarr;
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          6. AGENDA ORGANISASI (KARTU BESAR DENGAN RASIO RAPI)
          ========================================= */}
      <section
        id="agenda"
        className="py-24 bg-slate-900 scroll-mt-20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-800 rounded-full blur-[150px] opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-600 rounded-full blur-[150px] opacity-20 translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h4 className="flex items-center justify-center gap-3 text-yellow-400 font-black tracking-[0.2em] uppercase text-xs mb-4">
              <span className="w-8 h-1 bg-yellow-400 rounded-full"></span>Jadwal
              Silaturahmi
              <span className="w-8 h-1 bg-yellow-400 rounded-full"></span>
            </h4>
            <h2 className="text-4xl font-black text-white mb-6">
              Agenda Kegiatan
            </h2>
            <p className="text-slate-400 text-lg">
              Ikuti dan berpartisipasi dalam berbagai program strategis, kajian
              intelektual, serta forum silaturahmi yang diselenggarakan.
            </p>
          </div>

          {agendaList.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-16 text-center">
              <h3 className="font-bold text-white text-xl">
                Belum Ada Agenda Terjadwal
              </h3>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {agendaList.map((agenda) => {
                const hasImage = agenda.imgUrl || agenda.posterUrl;
                const isSoon = agenda.isComingSoon;

                // --- Logika Menghitung Sisa Hari ---
                let daysLeftText = "";
                let badgeColor = "bg-[#FFF0E6] text-[#FF5A36]"; // Default Orange

                if (!isSoon && agenda.tanggal) {
                  const eventDate = new Date(agenda.tanggal);
                  const today = new Date();
                  eventDate.setHours(0, 0, 0, 0);
                  today.setHours(0, 0, 0, 0);
                  const diffTime = eventDate.getTime() - today.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                  if (diffDays > 0) {
                    daysLeftText = `${diffDays} HARI LAGI`;
                  } else if (diffDays === 0) {
                    daysLeftText = "HARI INI";
                    badgeColor = "bg-green-100 text-green-700";
                  } else {
                    daysLeftText = "SELESAI";
                    badgeColor = "bg-slate-100 text-slate-500";
                  }
                }

                // URL GENERATOR INLINE
                const agendaUrl = isSoon
                  ? "#"
                  : `/agenda/${(agenda.judul || "")
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/(^-|-$)+/g, "")}-${agenda.id}`;

                return (
                  <Link
                    key={agenda.id}
                    href={agendaUrl}
                    className="bg-[#E9F8F5] rounded-[28px] p-3 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col group border border-[#D5EAE6]"
                  >
                    {/* IMAGE (Inset) */}
                    <div className="w-full aspect-[4/3] rounded-[20px] overflow-hidden bg-white relative shrink-0">
                      {hasImage ? (
                        <img
                          src={hasImage}
                          onError={(e) => {
                            e.currentTarget.src = "/logo-dpp-ika.png";
                            e.currentTarget.className =
                              "w-1/2 h-1/2 object-contain m-auto opacity-30";
                          }}
                          alt={agenda.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50/50">
                          <img
                            src="/logo-dpp-ika.png"
                            alt="Logo"
                            className="w-20 h-20 object-contain opacity-20"
                          />
                        </div>
                      )}
                    </div>

                    {/* BADGES */}
                    <div className="flex items-center gap-2 mt-4 mb-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${isSoon ? "bg-slate-200 text-slate-600" : "bg-[#FFF0E6] text-[#FF5A36]"}`}
                      >
                        {isSoon ? "COMING SOON" : "UPCOMING"}
                      </span>
                      {!isSoon && daysLeftText && (
                        <span
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${badgeColor}`}
                        >
                          {daysLeftText}
                        </span>
                      )}
                      <div className="ml-auto text-slate-400 pb-1">
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 10a2 2 0 110 4 2 2 0 010-4zm7 0a2 2 0 110 4 2 2 0 010-4zm7 0a2 2 0 110 4 2 2 0 010-4z" />
                        </svg>
                      </div>
                    </div>

                    {/* TITLE */}
                    <div className="px-3 flex flex-col flex-grow">
                      <h3 className="font-bold text-[22px] text-slate-900 leading-snug mb-4 line-clamp-2 group-hover:text-[#FF5A36] transition-colors">
                        {agenda.judul}
                      </h3>

                      {/* DETAILS (Icons + Text) */}
                      <div className="flex flex-col gap-3 mb-6">
                        <div className="flex items-center gap-3 text-slate-700 text-[15px] font-medium">
                          <svg
                            className="w-5 h-5 text-slate-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="truncate">
                            {isSoon
                              ? "Tanggal akan diumumkan"
                              : `${new Date(agenda.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} • ${agenda.waktu} WIB`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 text-[15px] font-medium">
                          <svg
                            className="w-5 h-5 text-slate-400 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
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
                          <span className="truncate">
                            {agenda.format}{" "}
                            {agenda.tiket === "Gratis (Free)" && (
                              <span className="text-slate-500 font-bold ml-1 underline decoration-slate-400 decoration-2 underline-offset-2">
                                + Gratis
                              </span>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* FOOTER (Agent / PIC) */}
                      <div className="mt-auto pt-4 pb-2 border-t border-[#D5EAE6] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white text-slate-500 flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-sm border border-slate-100">
                          {agenda.koordinator
                            ? agenda.koordinator.charAt(0).toUpperCase()
                            : "A"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[12px] text-slate-500 font-medium">
                            PIC / Penyelenggara
                          </span>
                          <span className="text-[15px] font-bold text-slate-900 leading-tight truncate max-w-[200px]">
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
        </div>
      </section>

      {/* 7. GALERI KEGIATAN */}
      <section id="galeri" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h4 className="flex items-center justify-center gap-3 text-yellow-600 font-black tracking-[0.2em] uppercase text-xs mb-4">
              <span className="w-8 h-1 bg-yellow-500 rounded-full"></span>{" "}
              Dokumentasi{" "}
              <span className="w-8 h-1 bg-yellow-500 rounded-full"></span>
            </h4>
            <h2 className="text-4xl font-black text-blue-950 mb-6">
              Galeri Kegiatan
            </h2>
            <p className="text-slate-500 text-lg">
              Jejak langkah dan momen kebersamaan dalam setiap program dan
              pengabdian IKA UII DIY.
            </p>
          </div>

          {galeriList.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] bg-slate-100 rounded-2xl border border-slate-200 animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
              {galeriList.map((foto) => (
                <div
                  key={foto.id}
                  className="relative aspect-[4/5] rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all border border-slate-100"
                >
                  <img
                    src={foto.imgUrl}
                    alt="Galeri"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 md:p-6">
                    <p className="text-white font-bold text-sm md:text-lg leading-snug translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {foto.judul || "Dokumentasi Kegiatan"}
                    </p>
                    <p className="text-yellow-400 text-[10px] md:text-xs font-bold mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 tracking-wider">
                      {foto.tanggal || "IKA UII DIY"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =========================================
          7. SOSIAL MEDIA (PRE-FOOTER)
          ========================================= */}
      <section className="bg-slate-50 border-t border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-black text-blue-950 mb-3">
            Tetap Terhubung dengan Kami
          </h2>
          <p className="text-slate-500 mb-10 max-w-2xl mx-auto text-sm">
            Ikuti media sosial resmi DPW IKA UII DIY untuk mendapatkan informasi
            terbaru, dokumentasi kegiatan, dan jejaring alumni profesional.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/ikauii.diy/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group w-full sm:w-auto justify-center"
            >
              <svg
                className="w-6 h-6 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
              </svg>
              <span className="font-bold tracking-wide">Instagram</span>
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@dpwikauiiyogyakarta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#FF0000] text-white px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group w-full sm:w-auto justify-center"
            >
              <svg
                className="w-6 h-6 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.42a2.78 2.78 0 0 0-1.94 2C1 8.16 1 12 1 12s0 3.84.46 5.58a2.78 2.78 0 0 0 1.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2C23 15.84 23 12 23 12s0-3.84-.46-5.58z"></path>
                <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"></polygon>
              </svg>
              <span className="font-bold tracking-wide">YouTube</span>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/dpw-ika-uii-diy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#0A66C2] text-white px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group w-full sm:w-auto justify-center"
            >
              <svg
                className="w-6 h-6 group-hover:scale-110 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect width="4" height="12" x="2" y="9"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
              <span className="font-bold tracking-wide">LinkedIn</span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. PRE-FOOTER */}
      <section className="bg-yellow-500 py-16 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-yellow-400 skew-x-12 translate-x-20"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left relative z-10">
          <div>
            <h2 className="text-3xl lg:text-4xl font-black text-blue-950 mb-3">
              Mari Berkolaborasi Bersama
            </h2>
            <p className="text-blue-900/80 font-bold text-lg">
              Wujudkan ide dan gagasan Anda untuk kemajuan almamater dan bangsa.
            </p>
          </div>
          <a
            href="mailto:ika.diy@uii.ac.id"
            className="shrink-0 bg-blue-950 hover:bg-blue-900 text-white px-10 py-5 rounded-full font-black text-lg transition-all shadow-2xl flex items-center gap-3 hover:-translate-y-1"
          >
            Hubungi Sekretariat
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              ></path>
            </svg>
          </a>
        </div>
      </section>

      <FooterPublic />
    </div>
  );
}
