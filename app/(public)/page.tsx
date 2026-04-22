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
//import NavbarPublic from "@/components/layout/NavbarPublic";
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

        // 🛡️ ALGORITMA DINAMIS: SETTING DARI ADMIN ATAU FALLBACK RANKING
        const snapPengurus = await getDocs(collection(db, "pengurus"));
        const allPengurus = snapPengurus.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Filter: Ambil yang dicentang admin (isTampilBeranda == true)
        let pengurusBeranda = allPengurus.filter(
          (p: any) => p.isTampilBeranda === true,
        );

        // FALLBACK: Kalau admin belum nge-set satupun, kita pakai logika lama (Rank KSB) maksimal 3 orang
        if (pengurusBeranda.length === 0) {
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

          pengurusBeranda = allPengurus
            .sort(
              (a: any, b: any) =>
                getRank(b.jabatan, b.bidang) - getRank(a.jabatan, a.bidang),
            )
            .filter((p: any) => getRank(p.jabatan, p.bidang) > 0)
            .slice(0, 3);
        }

        setPengurusList(pengurusBeranda);

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
      {/* 1. HERO SECTION */}
      <section
        id="beranda"
        className="relative pt-28 pb-20 md:pt-40 md:pb-32 lg:pt-48 lg:pb-40 flex items-center justify-center min-h-[90vh]"
      >
        <div className="absolute inset-0 z-0">
          <img
            src={cms.heroBgUrl}
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0B1221]/75 backdrop-blur-[2px]"></div>
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex flex-col items-center text-center mt-8 md:mt-10">
          <div className="inline-flex items-center gap-2 md:gap-3 border border-yellow-500/30 bg-yellow-500/10 backdrop-blur-sm text-yellow-400 font-bold px-4 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-sm mb-6 md:mb-8 uppercase tracking-[0.15em] md:tracking-[0.2em] shadow-lg">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-yellow-400 animate-pulse"></span>
            Official Portal IKA UII DIY
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black text-white mb-4 md:mb-6 leading-[1.1] md:leading-[1.1] tracking-tight">
            {cms.heroTitle} <br />
            <span className="text-yellow-500">{cms.heroHighlight}</span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 md:mb-12 leading-relaxed max-w-3xl font-medium px-2">
            {cms.heroDesc}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
            <a
              href="#profil"
              className="bg-yellow-500 hover:bg-yellow-400 text-blue-950 px-8 py-3.5 md:px-10 md:py-4 rounded-full font-extrabold transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto text-base md:text-lg shadow-[0_4px_20px_rgba(234,179,8,0.25)] hover:shadow-[0_4px_25px_rgba(234,179,8,0.4)]"
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
              className="bg-transparent border-2 border-slate-400 hover:border-white text-slate-300 hover:text-white px-8 py-3.5 md:px-10 md:py-4 rounded-full font-bold transition-all duration-300 flex items-center justify-center gap-3 w-full sm:w-auto text-base md:text-lg"
            >
              Lihat Agenda
            </a>
          </div>
        </div>
      </section>

      {/* 2. STATISTIK KORPORAT */}
      <section className="relative z-20 bg-blue-950 border-y-4 border-yellow-500 shadow-2xl">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-10 md:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 text-center divide-y border-white/10 md:divide-y-0 md:divide-x divide-white/10">
            <div className="px-4 pt-4 md:pt-0">
              <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
                5+
              </h3>
              <p className="text-yellow-400 font-extrabold uppercase tracking-widest text-[10px] md:text-xs mb-2 md:mb-3">
                Wilayah Jangkauan
              </p>
              <p className="text-slate-400 text-xs md:text-sm font-medium">
                Meliputi seluruh Kabupaten & Kota di Provinsi Daerah Istimewa
                Yogyakarta.
              </p>
            </div>
            <div className="px-4 pt-8 md:pt-0">
              <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
                10K+
              </h3>
              <p className="text-yellow-400 font-extrabold uppercase tracking-widest text-[10px] md:text-xs mb-2 md:mb-3">
                Jaringan Alumni
              </p>
              <p className="text-slate-400 text-xs md:text-sm font-medium">
                Terkoneksi kuat lintas fakultas, profesi, dan generasi purna
                bakti.
              </p>
            </div>
            <div className="px-4 pt-8 md:pt-0">
              <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
                Aktif
              </h3>
              <p className="text-yellow-400 font-extrabold uppercase tracking-widest text-[10px] md:text-xs mb-2 md:mb-3">
                Program Sosial
              </p>
              <p className="text-slate-400 text-xs md:text-sm font-medium">
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
        className="py-20 md:py-28 bg-white scroll-mt-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="relative group order-2 lg:order-1 px-4 sm:px-0">
              <div className="absolute -inset-3 sm:-inset-4 border-2 border-slate-100 rounded-[2rem] transform -rotate-3 transition-transform duration-700 group-hover:-rotate-1"></div>
              <div className="absolute -inset-3 sm:-inset-4 border-2 border-blue-50/50 rounded-[2rem] transform rotate-2 transition-transform duration-700 group-hover:rotate-1"></div>
              <div className="relative aspect-[4/3] sm:aspect-video lg:aspect-[4/3] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl z-10 border border-slate-200">
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

            <div className="space-y-6 md:space-y-8 order-1 lg:order-2">
              <div>
                <h4 className="flex items-center gap-3 text-yellow-600 font-black tracking-[0.15em] md:tracking-[0.2em] uppercase text-[10px] md:text-xs mb-3 md:mb-4">
                  <span className="w-8 md:w-12 h-1 bg-yellow-500 rounded-full"></span>
                  Tentang Organisasi
                </h4>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-950 leading-[1.2]">
                  Menyatukan Langkah, <br />
                  Membangun{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-900">
                    Peradaban
                  </span>
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-base md:text-lg text-justify font-medium">
                Sebagai wadah resmi ikatan alumni di tingkat wilayah, DPW IKA
                UII DIY memegang teguh komitmen untuk menjadi katalisator
                perubahan. Kami menyatukan potensi luar biasa dari ribuan alumni
                untuk memberikan kontribusi nyata bagi pembangunan daerah dan
                nasional.
              </p>
              <div className="grid sm:grid-cols-2 gap-6 md:gap-8 pt-6 border-t border-slate-100">
                <div className="flex gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
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
                    <h4 className="font-bold text-blue-950 text-base md:text-lg mb-1">
                      Infrastruktur Kuat
                    </h4>
                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                      Tata kelola organisasi modern & transparan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-50 text-yellow-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
                    <svg
                      className="w-5 h-5 md:w-6 md:h-6"
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
                    <h4 className="font-bold text-blue-950 text-base md:text-lg mb-1">
                      Solidaritas Umat
                    </h4>
                    <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                      Berpihak pada nilai keislaman & kebangsaan.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================
          4. PENGURUS INTI (CLEAN CARD STYLE)
          ========================================= */}
      <section className="py-20 md:py-28 bg-slate-50 relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-yellow-100/50 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-20">
            <h4 className="flex items-center justify-center gap-3 text-yellow-600 font-bold tracking-[0.15em] md:tracking-widest uppercase text-[9px] md:text-[10px] mb-3">
              <span className="w-4 md:w-6 h-px bg-yellow-500 rounded-full"></span>{" "}
              Dewan Pimpinan Wilayah{" "}
              <span className="w-4 md:w-6 h-px bg-yellow-500 rounded-full"></span>
            </h4>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-blue-950 mb-4 md:mb-6 tracking-tight">
              Jajaran Pimpinan Inti
            </h2>
            <p className="text-slate-500 text-sm md:text-base leading-relaxed px-4">
              Tokoh-tokoh di balik kemudi pergerakan DPW IKA UII DIY yang
              berdedikasi tinggi untuk memajukan almamater dan masyarakat.
            </p>
          </div>

          {pengurusList.length === 0 ? (
            <div className="text-center bg-white rounded-2xl py-10 border border-slate-200 shadow-sm">
              <p className="text-slate-400 font-medium text-sm">
                Belum ada data pimpinan inti.
              </p>
            </div>
          ) : (
            <>
              {/* GRID DINAMIS (KARTU PUTIH CLEAN) */}
              <div className="flex flex-wrap justify-center gap-6 lg:gap-8">
                {pengurusList.map((p: any) => {
                  const isKetua = p.jabatan?.toLowerCase().includes("ketua");
                  return (
                    <div
                      key={p.id}
                      className={`relative group flex flex-col items-center bg-white rounded-[2rem] p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 w-[90%] sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-21px)] max-w-[320px] ${
                        isKetua
                          ? "border-2 border-yellow-400 shadow-[0_15px_40px_-15px_rgba(250,204,21,0.25)]"
                          : "border border-slate-100 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.08)]"
                      }`}
                    >
                      {/* LINGKARAN FOTO */}
                      <div
                        className={`w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden mb-6 flex items-center justify-center p-1.5 ${
                          isKetua ? "bg-yellow-100" : "bg-slate-50"
                        }`}
                      >
                        <img
                          src={p.fotoUrl || "/logo-dpp-ika.png"}
                          alt={p.nama}
                          className={`w-full h-full rounded-full transition-transform duration-500 group-hover:scale-110 ${
                            p.fotoUrl
                              ? "object-cover object-top"
                              : "object-contain p-4 opacity-30"
                          }`}
                        />
                      </div>

                      {/* NAMA */}
                      <h3 className="font-extrabold text-lg md:text-xl text-blue-950 mb-3 text-center leading-snug">
                        {p.nama}
                      </h3>

                      {/* GARIS PEMISAH */}
                      <div
                        className={`w-8 h-1 rounded-full mb-3 ${
                          isKetua
                            ? "bg-yellow-500"
                            : "bg-slate-200 group-hover:bg-blue-400 transition-colors"
                        }`}
                      ></div>

                      {/* JABATAN */}
                      <p
                        className={`text-xs md:text-sm font-bold uppercase tracking-widest text-center ${
                          isKetua ? "text-yellow-600" : "text-slate-500"
                        }`}
                      >
                        {p.jabatan}
                      </p>

                      {/* SOSMED HOVER (Opsional: Muncul kalau disorot mouse) */}
                      <div className="absolute top-6 right-6 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-2 group-hover:translate-x-0">
                        {p.linkedinUrl && (
                          <a
                            href={p.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-white shadow-md text-[#0A66C2] flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                          </a>
                        )}
                        {p.instagramUrl && (
                          <a
                            href={p.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-white shadow-md text-[#E1306C] flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-16 md:mt-20 text-center relative z-20">
                <Link
                  href="/pengurus"
                  className="inline-flex items-center gap-3 bg-blue-950 hover:bg-blue-900 text-white px-8 py-3.5 rounded-full text-sm font-bold transition-all shadow-[0_10px_25px_rgba(30,58,138,0.2)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(30,58,138,0.3)] group"
                >
                  Lihat Struktur Lengkap
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
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
        className="py-20 md:py-28 bg-white border-t border-slate-200 scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-6">
            <div className="max-w-2xl">
              <h4 className="flex items-center gap-3 text-yellow-600 font-black tracking-[0.15em] uppercase text-[10px] md:text-xs mb-3 md:mb-4">
                <span className="w-8 md:w-12 h-1 bg-yellow-500 rounded-full"></span>{" "}
                Pusat Informasi
              </h4>
              <h2 className="text-3xl sm:text-4xl font-black text-blue-950">
                Berita & Publikasi
              </h2>
            </div>
            {beritaList.length > 0 && (
              <Link
                href="/berita"
                className="group flex items-center gap-3 bg-slate-50 hover:bg-blue-50 text-blue-700 px-5 md:px-6 py-3 rounded-xl text-sm md:text-base font-bold transition-colors border border-slate-200 hover:border-blue-200 shrink-0 w-full md:w-auto justify-center"
              >
                Lihat Semua Rilis{" "}
                <svg
                  className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform"
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
            <div className="text-center py-16 md:py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-300 mx-4 md:mx-0">
              <p className="text-slate-500 font-medium text-base md:text-lg">
                Belum ada rilis berita resmi pada saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
                    <div className="absolute top-3 md:top-4 left-3 md:left-4">
                      <span className="bg-blue-950 text-yellow-400 border border-blue-900 text-[9px] md:text-[10px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                        {item.kategori || "Siaran Pers"}
                      </span>
                    </div>
                  </div>

                  {/* KONTEN TEKS DI BAWAH */}
                  <div className="p-5 md:p-8 flex flex-col flex-grow">
                    <span className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mb-2.5 md:mb-3">
                      {new Date(item.createdAt).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    <h3 className="font-bold text-lg md:text-xl lg:text-2xl text-blue-950 mb-2.5 md:mb-3 leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                      {item.judul}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 line-clamp-3 leading-relaxed mb-5 md:mb-6">
                      {item.isi
                        ? item.isi.replace(/<[^>]*>?/gm, "").substring(0, 100) +
                          "..."
                        : ""}
                    </p>
                    <span className="mt-auto text-xs md:text-sm font-bold text-blue-600 group-hover:text-blue-800 flex items-center gap-1 transition-colors">
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
        className="py-20 md:py-28 bg-slate-900 scroll-mt-20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-800 rounded-full blur-[100px] md:blur-[150px] opacity-40 -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-yellow-600 rounded-full blur-[100px] md:blur-[150px] opacity-20 translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h4 className="flex items-center justify-center gap-2 md:gap-3 text-yellow-400 font-black tracking-[0.15em] md:tracking-[0.2em] uppercase text-[10px] md:text-xs mb-3 md:mb-4">
              <span className="w-6 md:w-8 h-1 bg-yellow-400 rounded-full"></span>
              Jadwal Silaturahmi
              <span className="w-6 md:w-8 h-1 bg-yellow-400 rounded-full"></span>
            </h4>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 md:mb-6">
              Agenda Kegiatan
            </h2>
            <p className="text-slate-400 text-sm md:text-lg px-2">
              Ikuti dan berpartisipasi dalam berbagai program strategis, kajian
              intelektual, serta forum silaturahmi yang diselenggarakan.
            </p>
          </div>

          {agendaList.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-10 md:p-16 text-center mx-4 md:mx-0">
              <h3 className="font-bold text-white text-lg md:text-xl">
                Belum Ada Agenda Terjadwal
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
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
                const agendaUrl = isSoon ? "#" : `/agenda/${agenda.id}`;

                return (
                  <Link
                    key={agenda.id}
                    href={agendaUrl}
                    className="bg-[#E9F8F5] rounded-[24px] md:rounded-[28px] p-2.5 md:p-3 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col group border border-[#D5EAE6]"
                  >
                    {/* IMAGE (Inset) */}
                    <div className="w-full aspect-[4/3] rounded-[16px] md:rounded-[20px] overflow-hidden bg-white relative shrink-0">
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
                            className="w-16 h-16 md:w-20 md:h-20 object-contain opacity-20"
                          />
                        </div>
                      )}
                    </div>

                    {/* BADGES */}
                    <div className="flex items-center gap-2 mt-3 md:mt-4 mb-2 md:mb-3 px-2 md:px-3">
                      <span
                        className={`px-2 py-1 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest ${isSoon ? "bg-slate-200 text-slate-600" : "bg-[#FFF0E6] text-[#FF5A36]"}`}
                      >
                        {isSoon ? "COMING SOON" : "UPCOMING"}
                      </span>
                      {!isSoon && daysLeftText && (
                        <span
                          className={`px-2 py-1 md:px-2.5 md:py-1 rounded-md text-[9px] md:text-[10px] font-black uppercase tracking-widest ${badgeColor}`}
                        >
                          {daysLeftText}
                        </span>
                      )}
                      <div className="ml-auto text-slate-400 pb-1 hidden sm:block">
                        <svg
                          className="w-4 h-4 md:w-5 md:h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M5 10a2 2 0 110 4 2 2 0 010-4zm7 0a2 2 0 110 4 2 2 0 010-4zm7 0a2 2 0 110 4 2 2 0 010-4z" />
                        </svg>
                      </div>
                    </div>

                    {/* TITLE */}
                    <div className="px-2 md:px-3 flex flex-col flex-grow">
                      <h3 className="font-bold text-lg md:text-[22px] text-slate-900 leading-snug mb-3 md:mb-4 line-clamp-2 group-hover:text-[#FF5A36] transition-colors">
                        {agenda.judul}
                      </h3>

                      {/* DETAILS (Icons + Text) */}
                      <div className="flex flex-col gap-2.5 md:gap-3 mb-4 md:mb-6">
                        <div className="flex items-center gap-2 md:gap-3 text-slate-700 text-xs md:text-[15px] font-medium">
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0"
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
                              : `${new Date(agenda.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })} • ${agenda.waktu} WIB`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 md:gap-3 text-slate-700 text-xs md:text-[15px] font-medium">
                          <svg
                            className="w-4 h-4 md:w-5 md:h-5 text-slate-400 shrink-0"
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
                      <div className="mt-auto pt-3 pb-1 md:pt-4 md:pb-2 border-t border-[#D5EAE6] flex items-center gap-2.5 md:gap-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white text-slate-500 flex items-center justify-center font-bold text-xs md:text-sm shrink-0 overflow-hidden shadow-sm border border-slate-100">
                          {agenda.koordinator
                            ? agenda.koordinator.charAt(0).toUpperCase()
                            : "A"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] md:text-[12px] text-slate-500 font-medium">
                            PIC / Penyelenggara
                          </span>
                          <span className="text-xs md:text-[15px] font-bold text-slate-900 leading-tight truncate max-w-[150px] md:max-w-[200px]">
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
      <section id="galeri" className="py-20 md:py-28 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
            <h4 className="flex items-center justify-center gap-2 md:gap-3 text-yellow-600 font-black tracking-[0.15em] md:tracking-[0.2em] uppercase text-[10px] md:text-xs mb-3 md:mb-4">
              <span className="w-6 md:w-8 h-1 bg-yellow-500 rounded-full"></span>{" "}
              Dokumentasi{" "}
              <span className="w-6 md:w-8 h-1 bg-yellow-500 rounded-full"></span>
            </h4>
            <h2 className="text-3xl sm:text-4xl font-black text-blue-950 mb-4 md:mb-6">
              Galeri Kegiatan
            </h2>
            <p className="text-slate-500 text-sm md:text-lg px-4">
              Jejak langkah dan momen kebersamaan dalam setiap program dan
              pengabdian IKA UII DIY.
            </p>
          </div>

          {galeriList.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] bg-slate-100 rounded-2xl border border-slate-200 animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {galeriList.map((foto) => (
                <div
                  key={foto.id}
                  className="relative aspect-[4/5] rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer shadow-sm hover:shadow-xl transition-all border border-slate-100"
                >
                  <img
                    src={foto.imgUrl}
                    alt="Galeri"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6">
                    <p className="text-white font-bold text-xs sm:text-sm md:text-lg leading-snug translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      {foto.judul || "Dokumentasi Kegiatan"}
                    </p>
                    <p className="text-yellow-400 text-[9px] sm:text-[10px] md:text-xs font-bold mt-1 md:mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100 tracking-wider">
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
      <section className="bg-slate-50 border-t border-slate-200 py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-black text-blue-950 mb-3 md:mb-4">
            Tetap Terhubung dengan Kami
          </h2>
          <p className="text-slate-500 mb-8 md:mb-10 max-w-2xl mx-auto text-sm md:text-base px-2">
            Ikuti media sosial resmi DPW IKA UII DIY untuk mendapatkan informasi
            terbaru, dokumentasi kegiatan, dan jejaring alumni profesional.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center items-center gap-4 md:gap-6 px-4 sm:px-0">
            {/* Instagram */}
            <a
              href="https://www.instagram.com/ikauii.diy/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group w-full sm:w-auto justify-center"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform"
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
              <span className="font-bold tracking-wide text-sm md:text-base">
                Instagram
              </span>
            </a>

            {/* YouTube */}
            <a
              href="https://www.youtube.com/@dpwikauiiyogyakarta"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#FF0000] text-white px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group w-full sm:w-auto justify-center"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform"
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
              <span className="font-bold tracking-wide text-sm md:text-base">
                YouTube
              </span>
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/dpw-ika-uii-diy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-[#0A66C2] text-white px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all group w-full sm:w-auto justify-center"
            >
              <svg
                className="w-5 h-5 md:w-6 md:h-6 group-hover:scale-110 transition-transform"
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
              <span className="font-bold tracking-wide text-sm md:text-base">
                LinkedIn
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* 8. PRE-FOOTER */}
      <section className="bg-yellow-500 py-12 md:py-16 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full bg-yellow-400 skew-x-12 translate-x-10 md:translate-x-20"></div>
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 text-center md:text-left relative z-10">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-950 mb-2 md:mb-3">
              Mari Berkolaborasi Bersama
            </h2>
            <p className="text-blue-900/80 font-bold text-sm md:text-lg">
              Wujudkan ide dan gagasan Anda untuk kemajuan almamater dan bangsa.
            </p>
          </div>
          <a
            href="mailto:it@ikadiy.uii.ac.id"
            className="shrink-0 bg-blue-950 hover:bg-blue-900 text-white px-8 py-4 md:px-10 md:py-5 rounded-full font-black text-base md:text-lg transition-all shadow-2xl flex items-center gap-3 hover:-translate-y-1 w-full sm:w-auto justify-center"
          >
            Hubungi Sekretariat
            <svg
              className="w-5 h-5 md:w-6 md:h-6"
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
