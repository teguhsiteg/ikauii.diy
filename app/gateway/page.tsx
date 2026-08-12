"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

export default function GatewayPage() {
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Otoritas
  const [isStaff, setIsStaff] = useState(false);
  const [isAlumni, setIsAlumni] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        let fetchedData = null;
        let isStaffMember = false;
        let isAlumniMember = false;

        const userEmail = (user.email || "").toLowerCase();

        // 1. CARI DI KOLEKSI "pengurus"
        const qPengurus = query(
          collection(db, "pengurus"),
          where("email", "==", userEmail),
        );
        const snapPengurus = await getDocs(qPengurus);

        if (!snapPengurus.empty) {
          fetchedData = {
            id: snapPengurus.docs[0].id,
            ...snapPengurus.docs[0].data(),
          };
          if (
            fetchedData.isPengurus === true ||
            ["admin", "superadmin", "super_admin"].includes(fetchedData.role) ||
            fetchedData.status_pengurus === "Aktif"
          ) {
            isStaffMember = true;
            isAlumniMember = true; // Pengurus pasti alumni
          }
        }

        // 2. JIKA BUKAN PENGURUS, CARI DI KOLEKSI "pendaftar" (ALUMNI)
        if (!fetchedData) {
          const qPendaftar = query(
            collection(db, "pendaftar"),
            where("email", "==", userEmail),
          );
          const snapPendaftar = await getDocs(qPendaftar);

          if (!snapPendaftar.empty) {
            fetchedData = {
              id: snapPendaftar.docs[0].id,
              ...snapPendaftar.docs[0].data(),
            };
            isAlumniMember = true;
          } else {
            const pRef = doc(db, "pendaftar", user.uid);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              fetchedData = { id: pSnap.id, ...pSnap.data() };
              isAlumniMember = true;
            }
          }
        }

        // 3. SELALU CEK TABEL 'users' UNTUK HAK AKSES ADMIN/OFFICE
        //    (JANGAN hanya sebagai fallback — koordinator mungkin juga ada di pendaftar)
        const uRef = doc(db, "users", user.uid);
        const uSnap = await getDoc(uRef);
        if (uSnap.exists()) {
          const userData = uSnap.data();
          const role = userData.role?.toLowerCase();
          // 🔥 SEMUA role di tabel 'users' adalah staff (koordinator, super_admin, dll)
          if (
            userData.isActive !== false && // hanya tolak jika explicitly false
            ["admin", "superadmin", "super_admin", "koordinator"].includes(role)
          ) {
            isStaffMember = true;
          }
        }

        // Kalau benar-benar cuma Peserta Umum (Gak ada di DB), JANGAN DI-KICK!
        // Ambil data langsung dari Google Auth / Firebase Auth
        if (!fetchedData) {
          fetchedData = {
            id: user.uid,
            nama: user.displayName || user.email?.split("@")[0] || "Siswa",
            email: user.email,
          };
        }

        // 4. SET STATE & TAMPILKAN HALAMAN
        setUserData(fetchedData);
        setIsStaff(isStaffMember);
        setIsAlumni(isAlumniMember);
        setIsLoading(false);
      } catch (error) {
        console.error("Gateway Error:", error);
        toast.error("Terjadi kesalahan sistem.");
        auth.signOut();
        router.replace("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4">
        <div className="w-20 h-20 bg-white rounded-3xl p-3 mb-6 shadow-xl animate-pulse border border-slate-100">
          <img
            src="/logo-dpp-ika.png"
            alt="Logo"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200">
          <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <span className="text-blue-900 font-bold tracking-widest uppercase text-[11px]">
            Memverifikasi Otoritas Akun...
          </span>
        </div>
      </div>
    );
  }

  const firstName =
    userData?.nama?.split(" ")[0] ||
    userData?.namaLengkap?.split(" ")[0] ||
    "User";

  return (
    <div className="min-h-screen flex flex-col lg:flex-row font-sans bg-[#F8FAFC]">
      {/* --- KOLOM KIRI: BRANDING & SAPAAN --- */}
      <div className="w-full lg:w-5/12 bg-gradient-to-br from-[#0B1528] to-[#1A73E8] p-8 sm:p-12 lg:p-16 flex flex-col justify-center lg:justify-between relative overflow-hidden min-h-[40vh] lg:min-h-screen shrink-0">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 opacity-20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col h-full justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-md rounded-[1.2rem] p-3 mb-8 shadow-xl border border-white/20">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo IKA UII"
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
            Selamat Datang, <br />
            <span className="text-yellow-400">{firstName}!</span>
          </h1>

          <p className="text-blue-100 font-medium text-sm sm:text-base leading-relaxed max-w-sm">
            {isStaff
              ? "Sistem mengenali Anda sebagai pemegang otoritas staf organisasi. Silakan tentukan ruang kerja yang ingin Anda akses."
              : isAlumni
                ? "Sistem mengenali Anda sebagai anggota IKA UII DIY. Silakan pilih layanan yang ingin Anda tuju."
                : "Sistem mengenali Anda sebagai peserta umum. Silakan akses Ruang Masterclass Anda."}
          </p>

          <div className="mt-8 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20 backdrop-blur-sm w-fit">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white">
              Akses Tervalidasi
            </span>
          </div>
        </div>

        <div className="relative z-10 hidden lg:block mt-12">
          <p className="text-blue-200/50 text-[10px] font-mono tracking-widest uppercase">
            &copy; {new Date().getFullYear()} SIM DPW IKA UII DIY
          </p>
        </div>
      </div>

      {/* --- KOLOM KANAN: PILIHAN RUANG KERJA --- */}
      <div className="w-full lg:w-7/12 p-8 sm:p-12 lg:p-20 flex flex-col justify-center bg-white relative z-20 min-h-[60vh] lg:min-h-screen shadow-[-20px_0_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto w-full">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2">
            Pilih Ruang Kerja
          </h2>
          <p className="text-sm sm:text-base text-slate-500 mb-10 font-medium">
            Tentukan rute tujuan Anda untuk sesi saat ini.
          </p>

          <div className="flex flex-col gap-4 sm:gap-5 mb-12">
            {/* 🔥 TOMBOL 1: ADMIN (Hanya isStaff) 🔥 */}
            {isStaff && (
              <button
                onClick={() => router.push("/dashboard")}
                className="group bg-white rounded-[1.5rem] border-2 border-slate-100 p-6 text-left hover:border-[#1A73E8] hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1.5 transition-all duration-300 flex items-start sm:items-center gap-5 sm:gap-6"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-50 text-[#1A73E8] rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#1A73E8] group-hover:text-white transition-colors border border-blue-100 group-hover:border-transparent">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1.5 group-hover:text-[#1A73E8] transition-colors">
                    Masuk Ruang Admin
                  </h3>
                  <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed">
                    Kelola database, validasi KTA, event, dan persetujuan
                    bisnis.
                  </p>
                </div>
              </button>
            )}

            {/* 🔥 TOMBOL 1.5: ADMIN VIRTUAL RUN (Hanya isStaff) 🔥 */}
            {isStaff && (
              <button
                onClick={() => router.push("/admin-vr")}
                className="group bg-white rounded-[1.5rem] border-2 border-slate-100 p-6 text-left hover:border-orange-500 hover:shadow-2xl hover:shadow-orange-900/5 hover:-translate-y-1.5 transition-all duration-300 flex items-start sm:items-center gap-5 sm:gap-6"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-orange-500 group-hover:text-white transition-colors border border-orange-100 group-hover:border-transparent">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1.5 group-hover:text-orange-500 transition-colors">
                    Manajemen Virtual Run
                  </h3>
                  <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed">
                    Kelola data pendaftar, approval, dan aktivitas Virtual Run.
                  </p>
                </div>
              </button>
            )}

            {/* 🔥 TOMBOL 2: MASTERCLASS (Muncul untuk SEMUA: Admin, Alumni, & Umum) 🔥 */}
            <button
              onClick={() => router.push("/masterclass/my-courses")}
              className="group bg-white rounded-[1.5rem] border-2 border-slate-100 p-6 text-left hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-900/5 hover:-translate-y-1.5 transition-all duration-300 flex items-start sm:items-center gap-5 sm:gap-6"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors border border-indigo-100 group-hover:border-transparent">
                <svg
                  className="w-7 h-7 sm:w-8 sm:h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div className="flex-grow">
                <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1.5 group-hover:text-indigo-600 transition-colors">
                  Ruang Masterclass (LMS)
                </h3>
                <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed">
                  Akses kursus Anda, pelajari materi, dan unduh e-sertifikat.
                </p>
              </div>
            </button>

            {/* 🔥 TOMBOL 3: ANGGOTA (Hanya untuk Alumni/Admin) 🔥 */}
            {(isAlumni || isStaff) && (
              <button
                onClick={() => router.push("/anggota")}
                className="group bg-white rounded-[1.5rem] border-2 border-slate-100 p-6 text-left hover:border-[#1E8E3E] hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-1.5 transition-all duration-300 flex items-start sm:items-center gap-5 sm:gap-6"
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-50 text-[#1E8E3E] rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-[#1E8E3E] group-hover:text-white transition-colors border border-emerald-100 group-hover:border-transparent">
                  <svg
                    className="w-7 h-7 sm:w-8 sm:h-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-1.5 group-hover:text-[#1E8E3E] transition-colors">
                    Portal Anggota IKA
                  </h3>
                  <p className="text-[13px] sm:text-sm text-slate-500 leading-relaxed">
                    Akses profil publik Anda, E-KTA, direktori bisnis, dan
                    event.
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* AREA BAWAH (LOGOUT) */}
          <div className="mt-auto">
            <button
              onClick={() => auth.signOut()}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-red-600 font-bold text-xs sm:text-sm uppercase tracking-widest transition-colors py-2 px-4 hover:bg-red-50 rounded-xl"
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Bukan Anda? Keluar Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
