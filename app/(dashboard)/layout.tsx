"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";
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

  // 2. PANTAU LOGIN & CEK APAKAH USER BARU
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));

          if (userDoc.exists()) {
            // USER LAMA -> Masuk normal
            const data = userDoc.data();
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
            });
            setNeedsOnboarding(false);
          } else {
            // USER BARU (Belum ada di database Firestore) -> Munculkan form Onboarding
            setUserProfile((prev) => ({
              ...prev,
              uid: user.uid,
              email: user.email || "",
            }));
            setNeedsOnboarding(true);
          }
        } catch (error) {
          console.error("Gagal memuat profil:", error);
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

  // 3. FUNGSI SIMPAN PROFIL PERTAMA KALI
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardData.bidang) {
      alert("Silakan pilih bidang Anda terlebih dahulu!");
      return;
    }
    setIsSavingProfile(true);
    try {
      // Simpan ke Firestore
      await setDoc(doc(db, "users", userProfile.uid), {
        nama: onboardData.nama,
        email: userProfile.email,
        bidang: onboardData.bidang,
        role: "koordinator", // Default aman: HANYA KOORDINATOR. Super Admin diset manual olehmu.
        createdAt: new Date().toISOString(),
      });

      // Reload halaman agar state ter-refresh utuh
      window.location.reload();
    } catch (error) {
      console.error("Gagal menyimpan profil", error);
      alert("Gagal menyimpan data profil.");
      setIsSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    document.cookie =
      "__session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  // --- TAMPILAN LOADING ---
  if (userProfile.role === "loading" && !needsOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
            Menyiapkan Ruang Kerja...
          </p>
        </div>
      </div>
    );
  }

  // --- TAMPILAN ONBOARDING (CEGATAN USER BARU) ---
  if (needsOnboarding) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000')] bg-cover opacity-10 blur-sm"></div>
        <div className="bg-white rounded-3xl p-8 md:p-10 w-full max-w-lg shadow-2xl relative z-10 animate-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-16 h-16 mx-auto mb-4 object-contain"
            />
            <h2 className="text-2xl font-black text-blue-950 mb-1">
              Selamat Datang Pengurus!
            </h2>
            <p className="text-sm text-slate-500">
              Sebelum memulai, silakan lengkapi profil Anda agar sistem dapat
              menyesuaikan ruang kerja Anda.
            </p>
          </div>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
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
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Pilih Bidang / Departemen
              </label>
              <select
                required
                value={onboardData.bidang}
                onChange={(e) =>
                  setOnboardData({ ...onboardData, bidang: e.target.value })
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                <option value="" disabled>
                  -- Pilih Bidang Anda --
                </option>
                {bidangList.map((b) => (
                  <option key={b.id} value={b.namaBidang}>
                    {b.namaBidang}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-2">
                Pastikan memilih dengan benar. Akses menu Anda bergantung pada
                pilihan ini.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-4"
            >
              {isSavingProfile
                ? "Menyimpan & Membuka Sistem..."
                : "Masuk ke Dashboard E-Office"}
            </button>
          </form>
          <button
            onClick={handleLogout}
            className="w-full text-center text-xs font-bold text-red-500 mt-6 hover:underline"
          >
            Batal & Keluar
          </button>
        </div>
      </div>
    );
  }

  // --- LOGIKA FILTERING MENU (RBAC) ---
  const isSuperAdmin = userProfile.role === "super_admin";

  const allTopMenuItems = [
    {
      name: "Ringkasan",
      path: "/dashboard",
      icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
      access: "all",
    },
    {
      name: "E-Office (Persuratan)",
      path: "/dashboard/e-office",
      icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      access: "all",
    },
    {
      name: "Master Organisasi",
      path: "/dashboard/master-data",
      icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      access: "super_admin",
    },
    {
      name: "Gudang Dokumen",
      path: "/dashboard/dokumen",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      access: "all",
    },
    {
      name: "QR Tanda Tangan",
      path: "/dashboard/validasi",
      icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z",
      access: "super_admin",
    },
    {
      name: "Data Pendaftar",
      path: "/dashboard/peserta",
      icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
      access: "all",
    },
    {
      name: "Manajemen Pengguna",
      path: "/dashboard/users",
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      access: "super_admin",
    },
  ];

  const allBottomMenuItems = [
    {
      name: "Atur Donasi Jum'at",
      path: "/dashboard/donasi",
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      isHighlight: true,
      access: "sosial",
    },
    {
      name: "Pengaturan Web (CMS)",
      path: "/dashboard/pengaturan",
      icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      isHighlight: false,
      access: "super_admin",
    },
  ];

  const visibleTopMenu = allTopMenuItems.filter(
    (item) => isSuperAdmin || item.access === "all",
  );
  const visibleBottomMenu = allBottomMenuItems.filter((item) => {
    if (isSuperAdmin) return true;
    if (
      item.access === "sosial" &&
      userProfile.bidang.toLowerCase().includes("sosial")
    )
      return true;
    return false;
  });

  const visibleBidangList = bidangList.filter((b) => {
    if (isSuperAdmin) return true;
    return b.namaBidang === userProfile.bidang;
  });

  // --- RENDER SIDEBAR & MAIN CONTENT NORMAL DI SINI (Tidak Ada yang Berubah) ---
  return (
    <div className="min-h-screen bg-slate-50 flex relative overflow-hidden print:bg-white">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm z-20 lg:hidden transition-opacity print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={`w-[280px] bg-[#0B1221] text-white flex flex-col fixed h-full z-30 shadow-2xl border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 print:hidden ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-20 flex items-center justify-between gap-4 px-6 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h2 className="font-extrabold text-[15px] tracking-wider text-white">
                DPW IKA UII DIY
              </h2>
              <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-widest mt-0.5">
                E-Office Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-2 rounded-lg bg-white/5"
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

        <div className="flex-grow py-6 overflow-y-auto no-scrollbar">
          <p className="px-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Menu {isSuperAdmin ? "Super Admin" : "Utama"}
          </p>
          <div className="space-y-1 mb-6">
            {visibleTopMenu.map((item) => {
              const isActive =
                item.path === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.path);
              return (
                <div key={item.name} className="px-4">
                  <Link
                    href={item.path}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-medium group ${isActive ? "bg-blue-600/20 text-white border border-blue-500/30" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                  >
                    <div
                      className={`${isActive ? "text-yellow-400" : "text-slate-500"} transition-colors`}
                    >
                      <svg
                        className="w-5 h-5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={item.icon}
                        />
                      </svg>
                    </div>
                    <span className="text-sm">{item.name}</span>
                  </Link>
                </div>
              );
            })}
          </div>

          {visibleBidangList.length > 0 && (
            <>
              <p className="px-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Ruang Kerja Proker
              </p>
              <div className="px-4 mb-6">
                <button
                  onClick={() => setIsBidangOpen(!isBidangOpen)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all font-medium group"
                >
                  <div className="flex items-center gap-4">
                    <svg
                      className="w-5 h-5 text-slate-500 group-hover:text-yellow-400 transition-colors"
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
                    <span className="text-sm">Bidang / Departemen</span>
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
                  <div className="mt-2 pl-12 space-y-1 border-l border-slate-700 ml-6 animate-in slide-in-from-top-2">
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
                          className={`block py-2 text-sm transition-colors ${isActive ? "text-yellow-400 font-bold" : "text-slate-400 hover:text-white"}`}
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
              <p className="px-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Portal Khusus
              </p>
              <div className="space-y-2">
                {visibleBottomMenu.map((item) => {
                  const isActive = pathname.startsWith(item.path);
                  const baseStyle =
                    "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all font-medium group";
                  let specificStyle = item.isHighlight
                    ? isActive
                      ? "bg-green-600/30 text-white border border-green-500/50 shadow-[0_0_15px_rgba(22,163,74,0.2)]"
                      : "bg-green-900/20 text-green-400 border border-green-800/50 hover:bg-green-800/40 hover:text-green-300"
                    : isActive
                      ? "bg-blue-600/20 text-white border border-blue-500/30"
                      : "text-slate-400 hover:bg-white/5 hover:text-white";

                  return (
                    <div key={item.name} className="px-4">
                      <Link
                        href={item.path}
                        className={`${baseStyle} ${specificStyle}`}
                      >
                        <div
                          className={`${isActive ? (item.isHighlight ? "text-yellow-400" : "text-yellow-400") : item.isHighlight ? "text-green-500" : "text-slate-500"} transition-colors`}
                        >
                          <svg
                            className="w-5 h-5 shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={item.icon}
                            />
                          </svg>
                        </div>
                        <span className="text-sm">{item.name}</span>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-white/5 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 px-4 py-3.5 w-full rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium group"
          >
            <svg
              className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors"
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
            <span className="text-sm">Keluar Sistem</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen transition-all duration-300 w-full print:ml-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
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
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 capitalize truncate">
              {pathname === "/dashboard"
                ? "Ringkasan Sistem"
                : pathname.split("/").pop()?.replace(/-/g, " ")}
            </h1>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 capitalize">
                {userProfile.name}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-widest">
                {userProfile.role.replace("_", " ")}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-900 font-bold shadow-inner shrink-0">
              {userProfile.initials}
            </div>
          </div>
        </header>

        <main className="flex-grow p-4 sm:p-8 overflow-x-hidden print:p-0 print:overflow-visible">
          {children}
        </main>
      </div>
    </div>
  );
}
