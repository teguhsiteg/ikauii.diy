"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function NavbarMasterclass() {
  const pathname = usePathname();
  const router = useRouter();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Deteksi Scroll untuk efek Navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Listener Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsProfileDropdownOpen(false);
      setIsMobileMenuOpen(false);
      router.push("/masterclass");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${isScrolled ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200" : "bg-white border-b border-slate-100"}`}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* 🔥 KIRI: LOGO MASTERCLASS BARU + TEKS ASLI 🔥 */}
          <Link href="/masterclass" className="flex items-center gap-3 group">
            <img
              src="https://res.cloudinary.com/dp8hmxuix/image/upload/v1778818077/ika_diy_master_class_lvzrui.png"
              alt="Logo Masterclass"
              className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
            />
            <div>
              <h1 className="font-black text-slate-900 text-lg leading-tight tracking-tight">
                Masterclass
              </h1>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                IKA UII DIY
              </p>
            </div>
          </Link>

          {/* TENGAH: MENU DESKTOP */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-bold text-slate-500 hover:text-[#0056D2] transition-colors"
            >
              Kembali ke IKA UII
            </Link>
            <Link
              href="/masterclass"
              className={`text-sm font-bold transition-colors hover:text-[#0056D2] ${pathname === "/masterclass" ? "text-[#0056D2]" : "text-slate-700"}`}
            >
              Katalog Kelas
            </Link>
            <button
              onClick={() => {
                document
                  .getElementById("katalog")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-sm font-bold text-slate-700 hover:text-[#0056D2] transition-colors"
            >
              FAQ
            </button>
          </nav>

          {/* KANAN: AUTH & PROFILE DESKTOP */}
          <div className="hidden md:flex items-center gap-4">
            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() =>
                    setIsProfileDropdownOpen(!isProfileDropdownOpen)
                  }
                  className="flex items-center gap-3 p-1.5 pr-4 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xs">
                    {(currentUser.displayName || currentUser.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block max-w-[120px]">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {currentUser.displayName || "Siswa"}
                    </p>
                    <p className="text-[9px] text-slate-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isProfileDropdownOpen ? "rotate-180" : ""}`}
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

                {isProfileDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-2">
                      <Link
                        href="/masterclass/my-courses"
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                      >
                        <svg
                          className="w-5 h-5 opacity-70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        Profil Saya
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1"
                      >
                        <svg
                          className="w-5 h-5 opacity-70"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Keluar (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-bold text-slate-600 hover:text-[#0056D2] transition-colors px-4 py-2"
                >
                  Masuk
                </Link>
                <Link
                  href="/masterclass/register"
                  className="bg-[#0056D2] hover:bg-[#00419E] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-colors shadow-sm"
                >
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>

          {/* HAMBURGER MENU MOBILE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-4 py-6 shadow-xl animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4 mb-6">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-bold text-slate-500"
            >
              Kembali ke IKA UII
            </Link>
            <Link
              href="/masterclass"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-base font-bold text-slate-800"
            >
              Katalog Kelas
            </Link>
          </nav>

          <div className="pt-6 border-t border-slate-100 flex flex-col gap-3">
            {currentUser ? (
              <>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl mb-2">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-sm">
                    {(currentUser.displayName || currentUser.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {currentUser.displayName || "Siswa"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
                <Link
                  href="/masterclass/my-courses"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 bg-[#0056D2] text-white text-center font-bold rounded-xl shadow-sm"
                >
                  Profil Saya
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full py-3 bg-rose-50 text-rose-600 text-center font-bold rounded-xl"
                >
                  Keluar (Logout)
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 border border-slate-300 text-slate-700 text-center font-bold rounded-xl"
                >
                  Masuk
                </Link>
                <Link
                  href="/login?tab=register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 bg-[#0056D2] text-white text-center font-bold rounded-xl shadow-sm"
                >
                  Daftar Sekarang
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
