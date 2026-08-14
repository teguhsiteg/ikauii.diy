"use client";

import { useState, useEffect, useMemo } from "react";
import NavbarMasterclass from "@/components/layout/NavbarMasterclass";
import FooterPublic from "@/components/layout/FooterPublic";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Data Statis Marketing
const VALUE_PROPS = [
  {
    title: "Pelajari Keahlian Baru",
    desc: "Materi praktis yang relevan dengan kebutuhan industri saat ini.",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  {
    title: "Sertifikat Tervalidasi",
    desc: "Dapatkan sertifikat resmi dengan QR Code validasi keaslian.",
    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Mentor Profesional",
    desc: "Belajar langsung dari pakar yang telah menjabat posisi strategis.",
    icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
  },
  {
    title: "Akses Selamanya",
    desc: "Materi video dan modul dokumen dapat diakses kapan saja.",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

const FAQS = [
  {
    q: "Apakah kelas ini terbuka untuk selain alumni?",
    a: "Ya, Masterclass ini terbuka untuk umum. Siapapun yang ingin belajar dan meningkatkan skill dapat mendaftar.",
  },
  {
    q: "Bagaimana cara mendapatkan sertifikat?",
    a: "Sertifikat akan otomatis tersedia di dashboard Anda setelah Anda menyelesaikan seluruh modul pembelajaran.",
  },
  {
    q: "Apakah materi bisa didownload?",
    a: "Materi berbentuk dokumen (PDF) dapat diunduh, sedangkan materi video hanya dapat ditonton secara streaming melalui platform.",
  },
  {
    q: "Metode pembayaran apa saja yang didukung?",
    a: "Kami mendukung berbagai metode pembayaran mulai dari Virtual Account, QRIS, hingga Transfer Manual sesuai opsi yang tersedia saat checkout.",
  },
];

export default function MasterclassPublicPage() {
  const router = useRouter();

  const [courses, setCourses] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // 🔥 STATE UNTUK RATING (Map dari courseId -> average rating)
  const [courseRatings, setCourseRatings] = useState<
    Record<string, { avg: number; count: number }>
  >({});

  // 🔥 STATE UNTUK MODAL MENTOR PREVIEW
  const [selectedMentor, setSelectedMentor] = useState<any>(null);

  const [cms, setCms] = useState({
    heroTitle: "Bangun Karier Impian Bersama Pakar Profesional",
    heroSubtitle:
      "Tingkatkan kompetensi Anda melalui kursus bersertifikat yang disusun langsung oleh para praktisi yang sukses di industri global.",
    heroBgUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2000",
    promoActive: false,
    promoText: "",
    promoLink: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    fetchPublicData();
  }, []);

  const fetchPublicData = async () => {
    setIsLoading(true);
    try {
      // 1. Tarik CMS
      const cmsSnap = await getDoc(doc(db, "settings", "masterclass_cms"));
      if (cmsSnap.exists()) {
        setCms((prev) => ({ ...prev, ...cmsSnap.data() }));
      }

      // 2. Tarik Data Mentor
      const snapMentors = await getDocs(collection(db, "masterclass_mentors"));
      setMentors(snapMentors.docs.map((d) => ({ id: d.id, ...d.data() })));

      // 3. Tarik Data Kelas (Published)
      const qCourses = query(
        collection(db, "masterclass_courses"),
        where("status", "==", "Published"),
      );
      const snapCourses = await getDocs(qCourses);
      const coursesData = snapCourses.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a: any, b: any) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );
      setCourses(coursesData);

      // 4. Tarik Ulasan & Hitung Rata-Rata per Kelas
      const snapReviews = await getDocs(collection(db, "masterclass_reviews"));
      const fetchedReviews = snapReviews.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((r: any) => r.status !== "Sembunyi");
      setReviews(fetchedReviews);

      // Kalkulasi Rating
      const ratingMap: Record<string, { totalScore: number; count: number }> =
        {};
      fetchedReviews.forEach((r: any) => {
        if (!ratingMap[r.courseId])
          ratingMap[r.courseId] = { totalScore: 0, count: 0 };
        ratingMap[r.courseId].totalScore += Number(r.rating);
        ratingMap[r.courseId].count += 1;
      });

      const finalRatings: Record<string, { avg: number; count: number }> = {};
      for (const courseId in ratingMap) {
        finalRatings[courseId] = {
          avg: Number(
            (
              ratingMap[courseId].totalScore / ratingMap[courseId].count
            ).toFixed(1),
          ),
          count: ratingMap[courseId].count,
        };
      }
      setCourseRatings(finalRatings);
    } catch (error) {
      console.error("Gagal memuat data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMentorData = (mentorId: string) => {
    return mentors.find((m) => m.id === mentorId) || null;
  };

  const dynamicCategories = useMemo(() => {
    const cats = new Set(courses.map((c) => c.kategori).filter(Boolean));
    return ["Semua", ...Array.from(cats)];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch = c.judul
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchKategori =
        activeCategory === "Semua" || c.kategori === activeCategory;
      return matchSearch && matchKategori;
    });
  }, [courses, searchTerm, activeCategory]);

  return (
    <div className="bg-white min-h-screen flex flex-col font-sans text-slate-800 relative">
      {/* 🔥 MODAL PREVIEW MENTOR 🔥 */}
      {selectedMentor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setSelectedMentor(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full flex items-center justify-center font-bold transition-colors"
            >
              ✕
            </button>
            <div className="h-32 bg-[#0056D2]"></div>
            <div className="px-6 pb-8 text-center -mt-12">
              <div className="w-24 h-24 mx-auto rounded-full bg-white p-1 mb-3">
                <img
                  src={
                    selectedMentor.fotoUrl ||
                    `https://ui-avatars.com/api/?name=${selectedMentor.nama}&background=0D8ABC&color=fff`
                  }
                  alt="Mentor"
                  className={`w-full h-full rounded-full object-cover shadow-sm ${selectedMentor.fotoPosition || "object-center"}`}
                />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {selectedMentor.nama}, {selectedMentor.gelar}
              </h3>
              <p className="text-sm font-bold text-blue-600 mb-1">
                {selectedMentor.jabatan}
              </p>
              <p className="text-xs text-slate-500 font-medium mb-4">
                {selectedMentor.perusahaan}
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 text-left">
                <p className="text-xs text-slate-600 leading-relaxed italic">
                  "{selectedMentor.bio}"
                </p>
              </div>

              {selectedMentor.linkedIn && (
                <a
                  href={selectedMentor.linkedIn}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#0077b5] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#006097] transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  Lihat Profil LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      <NavbarMasterclass />

      <main className="flex-grow pt-24">
        {cms.promoActive && cms.promoText && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full py-2.5 px-4 text-center text-xs md:text-sm font-bold shadow-md relative z-20">
            {cms.promoLink ? (
              <Link
                href={cms.promoLink}
                className="hover:underline flex items-center justify-center gap-2"
              >
                {cms.promoText}{" "}
                <svg
                  className="w-4 h-4 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ) : (
              <span>{cms.promoText}</span>
            )}
          </div>
        )}

        <section className="w-full bg-[#F5F7FA] overflow-hidden">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center pt-8 pb-16 lg:py-20 gap-10">
            <div className="w-full lg:w-1/2 relative z-10 text-center lg:text-left">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-[#1F2432] leading-[1.15] mb-6 whitespace-pre-wrap">
                {cms.heroTitle}
              </h1>
              <p className="text-slate-600 text-sm md:text-base lg:text-lg mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                {cms.heroSubtitle}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button
                  onClick={() =>
                    document
                      .getElementById("katalog")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="bg-[#0056D2] hover:bg-[#00419E] text-white px-8 py-3.5 rounded-[4px] font-bold text-base transition-colors shadow-md"
                >
                  Eksplorasi Katalog
                </button>
                <div className="relative w-full sm:w-auto">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Cari keahlian..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-[4px] border border-slate-300 focus:border-[#0056D2] outline-none text-base shadow-sm"
                  />
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/2 relative hidden md:block">
              <img
                src={cms.heroBgUrl}
                alt="Hero Masterclass"
                className="rounded-[32px] shadow-2xl w-full h-[450px] object-cover bg-slate-200"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black text-xl">
                  🏆
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase">
                    Terpercaya oleh
                  </p>
                  <p className="font-black text-slate-800">Ribuan Peserta</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white py-8">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest text-center md:text-left">
              Berkolaborasi dengan pakar dari:
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60 grayscale">
              <h3 className="text-xl font-black font-serif">GOOGLE</h3>
              <h3 className="text-xl font-black font-sans tracking-tighter">
                Microsoft
              </h3>
              <h3 className="text-xl font-black italic">TELKOM</h3>
              <h3 className="text-xl font-black font-mono">BCA</h3>
              <h3 className="text-xl font-black">PERTAMINA</h3>
            </div>
          </div>
        </section>

        <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1F2432] mb-10">
            Pencapaian yang bisa Anda raih
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUE_PROPS.map((prop, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-50 text-[#0056D2] rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={prop.icon}
                    />
                  </svg>
                </div>
                <h3 className="font-bold text-[#1F2432] mb-2">{prop.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {prop.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="katalog"
          className="w-full bg-[#F5F7FA] py-16 border-t border-slate-200 scroll-mt-24"
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1F2432] mb-8">
              Jelajahi Katalog Program
            </h2>

            {dynamicCategories.length > 1 && (
              <div className="flex flex-wrap gap-3 mb-10">
                {dynamicCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-colors border ${activeCategory === cat ? "bg-[#0056D2] text-white border-[#0056D2]" : "bg-white text-slate-600 border-slate-300 hover:bg-slate-50"}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0056D2] rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-sm">Memuat kurikulum...</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-500 font-medium">
                Belum ada kelas yang diterbitkan untuk kategori ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.map((c) => {
                  const mentor = getMentorData(c.mentorId);
                  const rating = courseRatings[c.id]; // Ambil rating asli

                  return (
                    <Link
                      key={c.id}
                      href={`/masterclass/${c.id}`}
                      className="bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all group flex flex-col h-full"
                    >
                      <div className="aspect-[4/3] relative bg-slate-100 overflow-hidden">
                        {c.thumbnailUrl ? (
                          <img
                            src={c.thumbnailUrl}
                            alt={c.judul}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300 font-medium bg-slate-100">
                            Cover Kelas
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-sm text-white ${c.tipeHarga === "Gratis" ? "bg-emerald-600" : "bg-slate-900"}`}
                          >
                            {c.tipeHarga === "Gratis"
                              ? "Free Course"
                              : "Premium"}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex flex-col flex-grow">
                        <div className="text-[11px] font-bold text-slate-500 uppercase mb-2 line-clamp-1">
                          {c.kategori}
                        </div>
                        <h3 className="font-bold text-[#1F2432] leading-snug mb-3 line-clamp-2 group-hover:text-[#0056D2] transition-colors">
                          {c.judul}
                        </h3>

                        {mentor && (
                          <div className="text-xs text-slate-600 mb-4 line-clamp-1">
                            Pakar:{" "}
                            <span className="font-bold">{mentor.nama}</span>
                          </div>
                        )}

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          {/* 🔥 MENAMPILKAN RATING ASLI DARI DATABASE 🔥 */}
                          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
                            <span className="text-[#F2D049]">★</span>{" "}
                            {rating ? rating.avg : "0.0"}
                            <span className="text-slate-400 font-normal text-xs ml-1">
                              ({rating ? rating.count : 0})
                            </span>
                          </div>

                          <div className="font-bold text-[#1F2432]">
                            {c.tipeHarga === "Gratis"
                              ? "Gratis"
                              : `Rp ${(c.totalHarga || 0).toLocaleString("id-ID")}`}
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

        {/* SECTION: MENTOR (DENGAN TOMBOL PREVIEW) */}
        {!isLoading && mentors.length > 0 && (
          <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1F2432] mb-10">
              Pelajari dari ahlinya
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {mentors.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                >
                  <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 bg-slate-100 border border-slate-200">
                    <img
                      src={
                        m.fotoUrl ||
                        `https://ui-avatars.com/api/?name=${m.nama}&background=E8F0FE&color=1A73E8`
                      }
                      alt={m.nama}
                      className={`w-full h-full object-cover ${m.fotoPosition || "object-center"}`}
                    />
                  </div>
                  <h3 className="font-bold text-[#1F2432] text-sm md:text-base line-clamp-1">
                    {m.nama}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                    {m.jabatan}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-2 line-clamp-1">
                    {m.perusahaan}
                  </p>

                  {/* 🔥 TOMBOL LIHAT PROFIL MENTOR 🔥 */}
                  <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-4 translate-y-full group-hover:translate-y-0 transition-transform">
                    <button
                      onClick={() => setSelectedMentor(m)}
                      className="w-full bg-[#0B1120] text-white text-xs font-bold py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Lihat Profil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION: TESTIMONIALS (LIST MENYATU BUKAN CARD) */}
        {!isLoading && reviews.length > 0 && (
          <section className="w-full bg-[#F5F7FA] py-16 border-y border-slate-200">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl md:text-3xl font-bold text-[#1F2432] mb-10 text-center lg:text-left">
                Apa yang dikatakan peserta
              </h2>

              {/* Kolom Ulasan List Memanjang */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reviews.slice(0, 6).map((r) => (
                  <div
                    key={r.id}
                    className="flex gap-5 pb-6 border-b border-slate-200/60 last:border-0 items-start"
                  >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center font-bold text-[#0056D2] border border-slate-200 shrink-0 shadow-sm text-lg">
                      {(r.namaPeserta || "A").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex gap-1 mb-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${star <= Number(r.rating) ? "text-[#F2D049]" : "text-slate-300"}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <p className="text-slate-700 text-sm leading-relaxed mb-2 font-medium">
                        "{r.ulasan}"
                      </p>
                      <h4 className="font-bold text-[#1F2432] text-xs uppercase tracking-widest">
                        {r.namaPeserta}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-[#1F2432] mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-200 rounded-xl bg-white overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenFaqIndex(openFaqIndex === index ? null : index)
                  }
                  className="w-full px-6 py-4 flex justify-between items-center text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-[#1F2432] pr-4">{faq.q}</span>
                  <svg
                    className={`w-5 h-5 text-slate-500 transform transition-transform ${openFaqIndex === index ? "rotate-180" : ""}`}
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
                {openFaqIndex === index && (
                  <div className="px-6 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <FooterPublic />

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .animate-bounce-slow {
          animation: bounce 3s infinite;
        }
      `}</style>
    </div>
  );
}
