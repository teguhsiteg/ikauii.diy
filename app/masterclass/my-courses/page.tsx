"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import NavbarMasterclass from "@/components/layout/NavbarMasterclass";
import FooterPublic from "@/components/layout/FooterPublic";
import Link from "next/link";

export default function MyCoursesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [coursesMap, setCoursesMap] = useState<Record<string, any>>({});
  const [progressMap, setProgressMap] = useState<
    Record<string, { completed: number; total: number }>
  >({});

  // 🔥 PERBAIKAN: Menambahkan "sertifikat" ke dalam type activeTab
  const [activeTab, setActiveTab] = useState<
    "kelas" | "sertifikat" | "transaksi" | "profil"
  >("kelas");

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    nama: "",
    noHp: "",
    instansi: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setCurrentUser(user);
      await fetchDashboardData(user);
    });
    return () => unsubscribe();
  }, [router]);

  const fetchDashboardData = async (user: any) => {
    setIsLoading(true);
    try {
      // 1. Tarik Data Profil dari tabel peserta_umum
      const userRef = doc(db, "peserta_umum", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setProfileForm({
          nama: userSnap.data().nama || user.displayName || "",
          noHp: userSnap.data().noHp || "",
          instansi: userSnap.data().instansi || "",
        });
      } else {
        setProfileForm({
          nama: user.displayName || "",
          noHp: "",
          instansi: "",
        });
      }

      // 2. Tarik Data Enrollments (Transaksi user ini)
      const qEnroll = query(
        collection(db, "masterclass_enrollments"),
        where("uid", "==", user.uid),
      );
      const snapEnroll = await getDocs(qEnroll);
      const enrollData = snapEnroll.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort(
          (a: any, b: any) =>
            (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
        );
      setEnrollments(enrollData);

      // Extract unique Course IDs
      const cIds = [...new Set(enrollData.map((e: any) => e.courseId))];

      // 3. Tarik Data Kelas (Untuk nerjemahin ID ke Judul & Gambar)
      const cMap: Record<string, any> = {};
      const snapCourses = await getDocs(collection(db, "masterclass_courses"));
      snapCourses.forEach((d) => {
        cMap[d.id] = d.data();
      });
      setCoursesMap(cMap);

      // 4. Hitung Total Modul per Kelas
      const moduleCount: Record<string, number> = {};
      const snapModules = await getDocs(collection(db, "masterclass_modules"));
      snapModules.forEach((d) => {
        const cId = d.data().courseId;
        moduleCount[cId] = (moduleCount[cId] || 0) + 1;
      });

      // 5. Tarik Progres Belajar Siswa
      const pMap: Record<string, { completed: number; total: number }> = {};
      for (const cid of cIds) {
        const pRef = doc(db, "masterclass_progress", `${user.uid}_${cid}`);
        const pSnap = await getDoc(pRef);
        pMap[cid] = {
          completed: pSnap.exists()
            ? pSnap.data().completedModules?.length || 0
            : 0,
          total: moduleCount[cid] || 1, // Hindari pembagian 0
        };
      }
      setProgressMap(pMap);
    } catch (error) {
      console.error("Gagal memuat dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      // 1. Update ke Firebase Auth (Biar namanya ganti di pojok kanan atas)
      await updateProfile(auth.currentUser!, { displayName: profileForm.nama });

      // 2. Simpan ke database peserta_umum
      await setDoc(
        doc(db, "peserta_umum", currentUser.uid),
        {
          uid: currentUser.uid,
          email: currentUser.email,
          nama: profileForm.nama,
          noHp: profileForm.noHp,
          instansi: profileForm.instansi,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      toast.success("Profil berhasil diperbarui!");
      // Refresh state lokal
      setCurrentUser({ ...currentUser, displayName: profileForm.nama });
    } catch (error) {
      toast.error("Gagal menyimpan profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0056D2] rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-500 text-sm">
          Memuat Dashboard Anda...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#F5F7FA] min-h-screen font-sans text-slate-800 flex flex-col">
      <NavbarMasterclass />

      <main className="flex-grow pt-24 pb-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* HEADER DASHBOARD */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#0056D2] text-white flex items-center justify-center text-2xl font-black shadow-lg">
                {(currentUser?.displayName || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900">
                  Halo, {currentUser?.displayName || "Siswa"}!
                </h1>
                <p className="text-slate-500 font-medium text-sm">
                  Selamat datang di Ruang Belajar Masterclass Anda.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-blue-50 border border-blue-100 px-6 py-3 rounded-2xl text-center">
                <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">
                  Kelas Saya
                </p>
                <p className="text-2xl font-black text-blue-900">
                  {enrollments.filter((e) => e.statusAkses === "Lunas").length}
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 px-6 py-3 rounded-2xl text-center">
                <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                  Sertifikat
                </p>
                <p className="text-2xl font-black text-emerald-900">
                  {
                    enrollments.filter(
                      (e) =>
                        progressMap[e.courseId]?.completed ===
                          progressMap[e.courseId]?.total &&
                        e.statusAkses === "Lunas",
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          {/* TAB NAVIGASI */}
          <div className="flex gap-6 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab("kelas")}
              className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "kelas" ? "border-[#0056D2] text-[#0056D2]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              Kelas Saya
            </button>
            {/* 🔥 TAMBAHAN TAB SERTIFIKAT 🔥 */}
            <button
              onClick={() => setActiveTab("sertifikat")}
              className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeTab === "sertifikat" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              Daftar Sertifikat
            </button>
            <button
              onClick={() => setActiveTab("transaksi")}
              className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "transaksi" ? "border-[#0056D2] text-[#0056D2]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              Riwayat Transaksi
            </button>
            <button
              onClick={() => setActiveTab("profil")}
              className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "profil" ? "border-[#0056D2] text-[#0056D2]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              Pengaturan Profil
            </button>
          </div>

          {/* KONTEN TAB: KELAS SAYA */}
          {activeTab === "kelas" && (
            <div className="space-y-6">
              {enrollments.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    📚
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">
                    Belum ada kelas yang diikuti
                  </h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    Jelajahi katalog kami dan temukan keahlian baru untuk
                    dikuasai.
                  </p>
                  <Link
                    href="/masterclass"
                    className="bg-[#0056D2] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#00419E] transition-colors"
                  >
                    Eksplorasi Katalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {enrollments.map((e) => {
                    const courseInfo = coursesMap[e.courseId];
                    const progress = progressMap[e.courseId];
                    const percentage = progress
                      ? Math.round((progress.completed / progress.total) * 100)
                      : 0;
                    const isLunas = e.statusAkses === "Lunas";

                    return (
                      <div
                        key={e.id}
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex flex-col"
                      >
                        <div className="aspect-[4/3] bg-slate-100 relative">
                          {courseInfo?.thumbnailUrl ? (
                            <img
                              src={courseInfo.thumbnailUrl}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              alt="Cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
                              Cover Kelas
                            </div>
                          )}

                          {/* Badge Status */}
                          <div className="absolute top-3 left-3">
                            {isLunas ? (
                              <span className="bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-sm">
                                AKSES TERBUKA
                              </span>
                            ) : e.statusAkses === "Batal" ? (
                              <span className="bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-sm">
                                DIBATALKAN
                              </span>
                            ) : (
                              <span className="bg-amber-500 text-white text-[10px] font-black px-2.5 py-1 rounded shadow-sm animate-pulse">
                                MENUNGGU VERIFIKASI
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow">
                          <h3 className="font-bold text-slate-800 mb-4 line-clamp-2 leading-snug">
                            {courseInfo?.judul || "Kelas Tidak Ditemukan"}
                          </h3>

                          {isLunas ? (
                            <div className="mt-auto">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">
                                <span>Progres Belajar</span>
                                <span className="text-[#0056D2]">
                                  {percentage}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                                <div
                                  className="h-full bg-[#0056D2] transition-all duration-1000"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <button
                                onClick={() =>
                                  router.push(
                                    `/masterclass/${e.courseId}/learn`,
                                  )
                                }
                                className="w-full py-2.5 bg-blue-50 hover:bg-[#0056D2] text-[#0056D2] hover:text-white font-bold text-xs rounded-xl transition-colors border border-blue-100 hover:border-[#0056D2]"
                              >
                                {percentage === 0
                                  ? "Mulai Belajar"
                                  : percentage === 100
                                    ? "Tonton Ulang & Sertifikat"
                                    : "Lanjutkan Belajar"}
                              </button>
                            </div>
                          ) : (
                            <div className="mt-auto bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                              <p className="text-[11px] text-slate-500 font-medium mb-2 leading-relaxed">
                                Admin sedang melakukan pengecekan terhadap
                                transaksi Anda.
                              </p>
                              <a
                                href="https://wa.me/6281234567890" // Ganti dengan nomor WA admin
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-emerald-600 hover:underline"
                              >
                                Hubungi Admin via WA
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 🔥 KONTEN TAB: SERTIFIKAT 🔥 */}
          {activeTab === "sertifikat" && (
            <div className="space-y-6">
              {(() => {
                // Filter kelas yang Lunas DAN Progres 100%
                const completedCourses = enrollments.filter(
                  (e) =>
                    progressMap[e.courseId]?.completed ===
                      progressMap[e.courseId]?.total &&
                    e.statusAkses === "Lunas",
                );

                if (completedCourses.length === 0) {
                  return (
                    <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                        🎓
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">
                        Belum Ada Sertifikat Kelulusan
                      </h3>
                      <p className="text-slate-500 text-sm max-w-md mx-auto mb-6 leading-relaxed">
                        Selesaikan 100% progres belajar pada modul kelas yang
                        Anda ikuti untuk mengklaim dan mengunduh E-Certificate
                        secara otomatis.
                      </p>
                      <button
                        onClick={() => setActiveTab("kelas")}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors shadow-md"
                      >
                        Lanjut Belajar
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedCourses.map((e) => {
                      const courseInfo = coursesMap[e.courseId];
                      return (
                        <div
                          key={e.id}
                          className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg transition-all group flex flex-col p-6 relative"
                        >
                          {/* Hiasan Background Pojok Kanan Atas */}
                          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-bl-full -z-0"></div>

                          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner z-10 relative">
                            📜
                          </div>

                          <div className="z-10 relative flex-grow">
                            <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 leading-snug">
                              {courseInfo?.judul || "Kelas Tidak Diketahui"}
                            </h3>
                            <div className="flex items-center gap-1.5 mb-6">
                              <span className="flex w-2 h-2 rounded-full bg-emerald-500"></span>
                              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                                Telah Diselesaikan
                              </p>
                            </div>
                          </div>

                          <div className="z-10 relative mt-auto">
                            <Link
                              href={`/masterclass/${e.courseId}/certificate`}
                              className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#0B1120] hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
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
                                  strokeWidth={2.5}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                              Unduh E-Certificate
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* KONTEN TAB: RIWAYAT TRANSAKSI */}
          {activeTab === "transaksi" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                      <th className="px-6 py-5">Tanggal & ID</th>
                      <th className="px-6 py-5">Detail Kelas</th>
                      <th className="px-6 py-5">Total Pembayaran</th>
                      <th className="px-6 py-5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-12 text-center text-slate-500"
                        >
                          Belum ada riwayat transaksi.
                        </td>
                      </tr>
                    ) : (
                      enrollments.map((e) => (
                        <tr
                          key={e.id}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-5 align-top">
                            <div className="font-bold text-slate-800">
                              {e.createdAt?.seconds
                                ? new Date(
                                    e.createdAt.seconds * 1000,
                                  ).toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "Baru saja"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              INV-{e.id.substring(0, 8).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top max-w-xs">
                            <div className="font-bold text-slate-800 line-clamp-2 leading-snug">
                              {coursesMap[e.courseId]?.judul ||
                                "Kelas Tidak Diketahui"}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest bg-slate-100 inline-block px-2 py-0.5 rounded">
                              {e.tipeHarga}
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top">
                            <div className="font-black text-slate-800">
                              Rp{" "}
                              {(e.hargaTransaksi || 0).toLocaleString("id-ID")}
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top">
                            <span
                              className={`text-[10px] font-black px-3 py-1.5 rounded-md uppercase tracking-wider ${e.statusAkses === "Lunas" ? "bg-emerald-100 text-emerald-700" : e.statusAkses === "Pending" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}
                            >
                              {e.statusAkses}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KONTEN TAB: PENGATURAN PROFIL */}
          {activeTab === "profil" && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 max-w-2xl">
              <h2 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">
                Informasi Akun
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Email (Akun Login)
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email || ""}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium text-slate-500 cursor-not-allowed outline-none"
                  />
                  <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">
                    * Hubungi Administrator jika Anda ingin mengubah alamat
                    email login.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={profileForm.nama}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, nama: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#0056D2] transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={profileForm.noHp}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, noHp: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#0056D2] transition-colors"
                      placeholder="0812..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                      Asal Instansi / Universitas
                    </label>
                    <input
                      type="text"
                      value={profileForm.instansi}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          instansi: e.target.value,
                        })
                      }
                      className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-[#0056D2] transition-colors"
                      placeholder="Opsional"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto bg-[#0B1120] hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
                  >
                    {isSavingProfile
                      ? "Menyimpan Perubahan..."
                      : "Simpan Pengaturan"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
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
      `}</style>
    </div>
  );
}
