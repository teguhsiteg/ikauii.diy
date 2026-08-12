"use client";

import Link from "next/link";
import { toast } from "@/lib/toast";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect, useRef } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [bidangList, setBidangList] = useState<any[]>([]);
  const [isBidangOpen, setIsBidangOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- STATE MENU PROFIL (DROPDOWN KANAN ATAS) ---
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // --- STATE ONBOARDING (USER BARU) ---
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [onboardData, setOnboardData] = useState({ nama: "", bidang: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- STATE PROFIL & HAK AKSES ---
  const [userProfile, setUserProfile] = useState({
    uid: "",
    email: "",
    name: "Memuat...",
    role: "loading",
    bidang: "",
    initials: "...",
    aksesModul: [] as string[],
  });

  // 1. FETCH MASTER DATA BIDANG (Untuk Form Onboarding & Sidebar)
  useEffect(() => {
    const fetchBidang = async () => {
      try {
        const q = query(collection(db, "bidang"), orderBy("namaBidang", "asc"));
        const snap = await getDocs(q);
        const rawData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const kataTerlarang = [
          "anggota",
          "ketua",
          "bendahara",
          "sekretaris",
          "wakil",
          "staf",
          "staff",
        ];
        const filteredData = rawData.filter((b: any) => {
          const namaLow = (b.namaBidang || "").toLowerCase();
          return !kataTerlarang.some((kata) => namaLow.includes(kata));
        });

        const uniqueData = Array.from(
          new Map(
            filteredData.map((item: any) => [item.namaBidang, item]),
          ).values(),
        );
        setBidangList(uniqueData);
      } catch (error) {
        console.error("Gagal load bidang:", error);
      }
    };
    fetchBidang();
  }, []);

  // 2. PANTAU LOGIN & SATPAM VIRTUAL (CEK HAK AKSES)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            const data = userDoc.data();

            if (data.isActive === false) {
              toast.error("Akun Admin Anda dinonaktifkan sementara.");
              router.replace("/anggota");
              return;
            }

            const namaSistem =
              data.nama || user.displayName || user.email || "Admin";
            const initials = namaSistem
              .trim()
              .split(/\s+/)
              .map((n: string) => n.charAt(0))
              .join("")
              .substring(0, 2)
              .toUpperCase();

            setUserProfile({
              uid: user.uid,
              email: user.email || "",
              name: namaSistem,
              role: data.role || "koordinator",
              bidang: data.bidang || "",
              initials: initials || "US",
              aksesModul: data.aksesModul || [],
            });
            setNeedsOnboarding(false);
          } else {
            const pengurusSnap = await getDoc(doc(db, "pengurus", user.uid));
            const pendaftarSnap = await getDoc(doc(db, "pendaftar", user.uid));

            if (pengurusSnap.exists() || pendaftarSnap.exists()) {
              router.replace("/anggota");
              return;
            }

            setUserProfile((prev) => ({
              ...prev,
              uid: user.uid,
              email: user.email || "",
            }));
            setNeedsOnboarding(true);
          }
        } catch (error) {
          console.error("Gagal memuat profil:", error);
          router.replace("/anggota");
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  // 3. FUNGSI SIMPAN PROFIL PERTAMA KALI
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardData.bidang) {
      toast.warning("Silakan pilih bidang Anda terlebih dahulu!");
      return;
    }
    setIsSavingProfile(true);
    try {
      await setDoc(doc(db, "users", userProfile.uid), {
        nama: onboardData.nama,
        email: userProfile.email,
        bidang: onboardData.bidang,
        role: "koordinator",
        isActive: true,
        aksesModul: ["ringkasan"],
        createdAt: new Date().toISOString(),
      });
      window.location.reload();
    } catch (error) {
      console.error("Gagal menyimpan profil", error);
      toast.error("Gagal menyimpan data profil.");
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie =
      "firebase_session=; path=/; max-age=0; SameSite=Lax" +
      (typeof window !== "undefined" && window.location.protocol === "https:"
        ? "; Secure"
        : "");
    router.push("/login");
  };

  // --- TAMPILAN LOADING ---
  if (userProfile.role === "loading" && !needsOnboarding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC]">
        <div className="relative flex justify-center items-center mb-6">
          <div className="absolute w-16 h-16 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute w-16 h-16 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">
          MENGOTENTIKASI HAK AKSES...
        </p>
      </div>
    );
  }

  // --- TAMPILAN ONBOARDING ---
  if (needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative font-sans">
        <div className="absolute inset-0 bg-slate-950">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2000')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl relative z-10 animate-in zoom-in-95 duration-500 border border-white/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl mx-auto flex items-center justify-center mb-5 border border-blue-100 shadow-sm">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-10 h-10 object-contain"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1.5">
              Setup Admin Workspace
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              Konfigurasi kredensial awal Anda agar sistem dapat
              mempersonalisasi ruang kerja E-Office.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Nama Lengkap & Gelar
              </label>
              <input
                type="text"
                required
                value={onboardData.nama}
                onChange={(e) =>
                  setOnboardData({ ...onboardData, nama: e.target.value })
                }
                placeholder="Contoh: Budi Santoso, S.T."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                Penempatan / Departemen
              </label>
              <select
                required
                value={onboardData.bidang}
                onChange={(e) =>
                  setOnboardData({ ...onboardData, bidang: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-sm font-medium text-slate-800 cursor-pointer"
              >
                <option value="" disabled>
                  -- Pilih Otoritas Bidang --
                </option>
                {bidangList.map((b) => (
                  <option key={b.id} value={b.namaBidang}>
                    {b.namaBidang}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 transition-all mt-4 disabled:opacity-50 text-sm"
            >
              {isSavingProfile
                ? "Menyinkronkan Data..."
                : "Inisialisasi Workspace"}
            </button>
          </form>

          <button
            onClick={handleLogout}
            className="w-full text-center text-xs font-bold text-slate-400 mt-6 hover:text-red-500 transition-colors"
          >
            Batalkan Sesi & Keluar
          </button>
        </div>
      </div>
    );
  }

  // --- LOGIKA FILTERING MENU (RBAC DINAMIS) 🔥 ---
  const isSuperAdmin = userProfile.role === "super_admin";

  const allTopMenuItems = [
    {
      id: "ringkasan",
      name: "Ringkasan",
      path: "/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    },
    // 🔥 MENU BARU: LMS MASTERCLASS (DITAMBAHKAN KEMBALI) 🔥
    {
      id: "masterclass_lms",
      name: "LMS Masterclass",
      path: "/dashboard/masterclass",
      icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
      badge: "PRO",
      theme: "indigo", // Tema warna khusus
    },
    {
      id: "bio_engine",
      name: "Bio Engine",
      path: "/dashboard/bio",
      icon: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
      badge: "Shortlink",
      theme: "amber",
    },
    {
      id: "registri_surat",
      name: "Registri Surat",
      path: "/dashboard/e-office",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
    {
      id: "master_organisasi",
      name: "Master Organisasi",
      path: "/dashboard/master-data",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
    },
    {
      id: "verifikasi_anggota",
      name: "Verifikasi Anggota",
      path: "/dashboard/verifikasi-anggota",
      icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
    },
    {
      id: "gudang_dokumen",
      name: "Gudang Dokumen",
      path: "/dashboard/dokumen",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      id: "qr_tanda_tangan",
      name: "QR Tanda Tangan",
      path: "/dashboard/validasi",
      icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
    },
    {
      id: "cetak_kuitansi",
      name: "Cetak Kuitansi",
      path: "/dashboard/kuitansi",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    },
    {
      id: "data_pendaftar",
      name: "Data Pendaftar",
      path: "/dashboard/peserta",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    },
    {
      id: "manajemen_pengguna",
      name: "Manajemen Pengguna",
      path: "/dashboard/users",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      requireSuperAdmin: true,
    },
    {
      id: "kelola_direktori",
      name: "Kelola Direktori",
      path: "/dashboard/direktori",
      icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    },
    {
      id: "manajemen_event_run",
      name: "Manajemen Event Run",
      path: "/admin-vr/offline",
      icon: "M13 10V3L4 14h7v7l9-11h-7z",
    },
    {
      id: "broadcast_sistem",
      name: "Broadcast Email",
      path: "/dashboard/broadcast",
      icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    },
    {
      id: "manajemen_ulasan",
      name: "Manajemen Ulasan",
      path: "/dashboard/ulasan",
      icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
    },
  ];

  const allBottomMenuItems = [
    {
      id: "atur_donasi",
      name: "Atur Donasi Jum'at",
      path: "/dashboard/donasi",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      isHighlight: true,
    },
    {
      id: "pengaturan_web",
      name: "Pengaturan Web (CMS)",
      path: "/dashboard/pengaturan",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      isHighlight: false,
    },
  ];

  // 🔥 Filter Menu Utama Berdasarkan Hak Akses Array 🔥
  const visibleTopMenu = allTopMenuItems.filter((item) => {
    if (isSuperAdmin) return true;
    if (item.requireSuperAdmin) return false;
    return userProfile.aksesModul.includes(item.id);
  });

  // 🔥 Filter Menu Bawah Berdasarkan Hak Akses Array 🔥
  const visibleBottomMenu = allBottomMenuItems.filter((item) => {
    if (isSuperAdmin) return true;
    if (item.requireSuperAdmin) return false;
    return userProfile.aksesModul.includes(item.id);
  });

  // 🔥 Akses Menu Program Kerja 🔥
  const hasAksesProker =
    isSuperAdmin || userProfile.aksesModul.includes("program_kerja");

  const visibleBidangList = bidangList.filter((b) => {
    if (isSuperAdmin) return true;
    return b.namaBidang === userProfile.bidang;
  });

  // --- RENDER SIDEBAR & MAIN CONTENT ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex relative overflow-hidden font-sans print:bg-white selection:bg-blue-100 selection:text-blue-900">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 lg:hidden transition-opacity print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (Midnight Blue/Slate-950) */}
      <aside
        className={`w-[280px] bg-[#0B1120] text-slate-300 flex flex-col fixed h-full z-30 shadow-2xl border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Area */}
        <div className="h-20 flex items-center justify-between gap-4 px-6 border-b border-slate-800 shrink-0 bg-[#0A0F1C]">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-7 h-7 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h2 className="font-bold text-[15px] tracking-wide text-white leading-tight">
                DPW IKA UII
              </h2>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-0.5">
                UII JAYA ALUMNI BERDAYA
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-500 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Menu Area */}
        <div className="flex-grow py-6 pb-20 overflow-y-auto custom-scrollbar">
          <p className="px-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Menu {isSuperAdmin ? "Administrator" : "Utama"}
          </p>

          <div className="space-y-1 mb-8 px-4">
            {visibleTopMenu.map((item: any) => {
              const isActive =
                item.path === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.path);

              // 🎨 LOGIKA STYLE DINAMIS UNTUK MENU BER-BADGE 🎨
              if (item.badge) {
                // Menentukan warna berdasarkan tema yang di-set di object menu
                const colorConfig = {
                  amber: {
                    activeBg:
                      "from-amber-500/20 to-transparent border-amber-500/50 text-amber-400",
                    inactiveBg:
                      "hover:bg-slate-800/50 border-transparent hover:border-amber-500/30 text-amber-500/70 hover:text-amber-400",
                    iconActive: "text-amber-400",
                    iconInactive:
                      "text-amber-500/50 group-hover:text-amber-400",
                    badgeActive: "bg-amber-400 text-slate-900",
                    badgeInactive: "bg-amber-500/20 text-amber-500",
                  },
                  indigo: {
                    activeBg:
                      "from-indigo-500/20 to-transparent border-indigo-500/50 text-indigo-400",
                    inactiveBg:
                      "hover:bg-slate-800/50 border-transparent hover:border-indigo-500/30 text-indigo-400/70 hover:text-indigo-400",
                    iconActive: "text-indigo-400",
                    iconInactive:
                      "text-indigo-400/50 group-hover:text-indigo-400",
                    badgeActive: "bg-indigo-400 text-slate-900",
                    badgeInactive: "bg-indigo-500/20 text-indigo-400",
                  },
                };

                const theme =
                  colorConfig[item.theme as keyof typeof colorConfig] ||
                  colorConfig.amber;

                return (
                  <Link
                    key={item.name}
                    href={item.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm group border ${isActive ? `bg-gradient-to-r ${theme.activeBg}` : theme.inactiveBg}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <svg
                        className={`w-5 h-5 shrink-0 transition-colors ${isActive ? theme.iconActive : theme.iconInactive}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={isActive ? 2.5 : 2}
                          d={item.icon}
                        />
                      </svg>
                      {item.name}
                    </div>
                    <span
                      className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isActive ? theme.badgeActive : theme.badgeInactive}`}
                    >
                      {item.badge}
                    </span>
                  </Link>
                );
              }

              // Style Menu Normal (Default)
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-medium text-sm group ${isActive ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" : "hover:bg-slate-800/50 hover:text-slate-100 text-slate-400"}`}
                >
                  <svg
                    className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={isActive ? 2.5 : 2}
                      d={item.icon}
                    />
                  </svg>
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* HANYA TAMPILKAN PROKER JIKA PUNYA AKSES */}
          {hasAksesProker && visibleBidangList.length > 0 && (
            <>
              <p className="px-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Ruang Kerja Bidang
              </p>
              <div className="px-4 mb-8">
                <button
                  onClick={() => setIsBidangOpen(!isBidangOpen)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-slate-100 transition-all font-medium text-sm group"
                >
                  <div className="flex items-center gap-3.5">
                    <svg
                      className="w-5 h-5 shrink-0 text-slate-500 group-hover:text-yellow-500 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    Program Kerja
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${isBidangOpen ? "rotate-180" : ""}`}
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
                {isBidangOpen && (
                  <div className="mt-1 pl-12 space-y-1 relative before:absolute before:left-6 before:top-0 before:bottom-2 before:w-[1px] before:bg-slate-800 animate-in slide-in-from-top-2">
                    {visibleBidangList.map((b, index) => {
                      const slug = (b.namaBidang || "bidang")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-");
                      const isActive = pathname.includes(
                        `/dashboard/proker/${slug}`,
                      );
                      return (
                        <Link
                          key={b.id || `sidebar-bidang-${index}`}
                          href={`/dashboard/proker/${slug}`}
                          className={`block py-2 text-xs font-medium transition-colors relative before:absolute before:left-[-24px] before:top-1/2 before:w-3 before:h-[1px] before:bg-slate-800 ${isActive ? "text-yellow-400 font-bold" : "text-slate-400 hover:text-slate-200"}`}
                        >
                          {b.namaBidang}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {visibleBottomMenu.length > 0 && (
            <>
              <p className="px-8 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Ekstensi Opsional
              </p>
              <div className="space-y-1 px-4">
                {visibleBottomMenu.map((item) => {
                  const isActive = pathname.startsWith(item.path);
                  let baseStyle =
                    "flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all font-medium text-sm group ";
                  let specificStyle = item.isHighlight
                    ? isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                      : "bg-emerald-900/20 text-emerald-400 hover:bg-emerald-800/40 border border-emerald-800/50"
                    : isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                      : "hover:bg-slate-800/50 hover:text-slate-100 text-slate-400";

                  return (
                    <Link
                      key={item.name}
                      href={item.path}
                      className={baseStyle + specificStyle}
                    >
                      <svg
                        className={`w-5 h-5 shrink-0 transition-colors ${isActive ? "text-white" : item.isHighlight ? "text-emerald-500" : "text-slate-500 group-hover:text-blue-400"}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={isActive ? 2.5 : 2}
                          d={item.icon}
                        />
                      </svg>
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen transition-all duration-300 w-full print:ml-0">
        {/* Glassmorphism Header */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10 print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 capitalize tracking-tight">
                {pathname === "/dashboard"
                  ? "Ringkasan Eksekutif"
                  : pathname.split("/").pop()?.replace(/-/g, " ")}
              </h1>
              <div className="hidden sm:flex items-center text-[10px] text-slate-400 font-medium tracking-widest uppercase mt-0.5">
                Dashboard <span className="mx-1.5 text-slate-300">/</span>{" "}
                {pathname.split("/").pop()?.replace(/-/g, " ")}
              </div>
            </div>
          </div>

          {/* USER PROFILE BUBBLE & DROPDOWN */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`flex items-center gap-3 sm:gap-4 shrink-0 hover:bg-slate-50 p-1 sm:p-1.5 sm:pr-4 rounded-full transition-all border ${isProfileMenuOpen ? "bg-slate-50 border-slate-200 shadow-inner" : "border-transparent hover:border-slate-200"}`}
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0 text-sm">
                {userProfile.initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-slate-800 capitalize leading-tight">
                  {userProfile.name}
                </p>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5 line-clamp-1 max-w-[120px]">
                  {userProfile.role.replace("_", " ")}
                </p>
              </div>
              <svg
                className={`w-4 h-4 text-slate-400 hidden sm:block transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7-7-7-7"
                />
              </svg>
            </button>

            {/* DROPDOWN MENU */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                  <p className="text-sm font-bold text-slate-800 capitalize leading-tight">
                    {userProfile.name}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">
                    {userProfile.email}
                  </p>
                </div>

                <div className="p-2 space-y-1">
                  <Link
                    href="/dashboard/users"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
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
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profil Saya
                  </Link>

                  {isSuperAdmin && (
                    <Link
                      href="/dashboard/pengaturan"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
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
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Pengaturan Sistem
                    </Link>
                  )}
                </div>

                <div className="p-2 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full gap-3 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
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
                        d="M17 16l4-4m0 0l-4-4m4-4H3m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Keluar (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-8 overflow-x-hidden print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
