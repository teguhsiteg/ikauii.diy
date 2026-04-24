"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Sidebar({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
}) {
  const pathname = usePathname();

  // State untuk Minimize Sidebar di Desktop
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State untuk melacak Dropdown mana yang terbuka
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Data & Registrasi": true, // Default terbuka
    "Operasi Lapangan": true,
    "Konfigurasi Sistem": true, // Buka default biar gampang cari menu Sponsor
  });

  // Fungsi toggle Dropdown
  const toggleGroup = (groupName: string) => {
    // Kalau sidebar lagi di-minimize, klik grup akan mengekspansi sidebar sekalian
    if (isCollapsed) setIsCollapsed(false);

    setOpenGroups((prev) => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  // --- STRUKTUR MENU DENGAN PENGELOMPOKKAN ---
  const menuData = [
    {
      title: "Dashboard",
      path: "/admin-vr",
      icon: (
        <svg
          className="w-5 h-5 shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      title: "Data & Registrasi",
      icon: (
        <svg
          className="w-5 h-5 shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      ),
      subItems: [
        { name: "Peserta Offline", path: "/admin-vr/offline" },
        { name: "Peserta Virtual Run", path: "/admin-vr/peserta" },
        { name: "Verifikasi Lari (VR)", path: "/admin-vr/verifikasi" },
        { name: "Data Crew & Relawan", path: "/admin-vr/crew" },
      ],
    },
    {
      title: "Operasi Lapangan",
      icon: (
        <svg
          className="w-5 h-5 shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42A8.962 8.962 0 0012 4c-4.97 0-9 4.03-9 9s4.02 9 9 9a8.994 8.994 0 007.03-14.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
        </svg>
      ),
      subItems: [
        { name: "Race Management", path: "/admin-vr/race-management" },
        { name: "RPC Scanner Terminal", path: "/admin-vr/bib-scanner" },
      ],
    },
    {
      title: "Layar Event (TV)",
      icon: (
        <svg
          className="w-5 h-5 shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
        </svg>
      ),
      subItems: [
        { name: "Monitor BIB Check", path: "/bib-display", isExternal: true },
        { name: "Monitor Race Clock", path: "/race-clock", isExternal: true },
        {
          name: "Layar Live Doorprize",
          path: "/doorprize-screen",
          isExternal: true,
        },
        {
          name: "Offline Leaderboard",
          path: "/leaderboard-offline",
          isExternal: true,
        },
      ],
    },
    {
      title: "Konfigurasi Sistem",
      icon: (
        <svg
          className="w-5 h-5 shrink-0"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .43-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
        </svg>
      ),
      subItems: [
        { name: "Pengaturan Umum", path: "/admin-vr/pengaturan" },
        { name: "Manajemen Sponsor", path: "/admin-vr/sponsor" }, // 🔥 MENU BARU KITA 🔥
        { name: "Kontrol Akses", path: "/admin-vr/kontrol" },
        { name: "Legal & Aturan", path: "/admin-vr/legal" },
      ],
    },
  ];

  return (
    <>
      {/* OVERLAY GELAP UNTUK MOBILE */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ASIDE SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-slate-200 flex flex-col text-slate-700 z-50 shrink-0 transform transition-all duration-300 ease-in-out ${
          isOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full lg:translate-x-0"
        } ${isCollapsed ? "w-20" : "w-72"}`} // Perubahan width saat collapsed
      >
        {/* HEADER SIDEBAR & TOMBOL MINIMIZE */}
        <div
          className={`p-4 flex items-center h-20 shrink-0 border-b border-slate-100 transition-all ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          <div
            className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100"}`}
          >
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-10 h-10 object-contain drop-shadow-sm shrink-0"
              crossOrigin="anonymous"
            />
            <div className="whitespace-nowrap">
              <h1 className="text-[17px] font-bold text-slate-800 leading-tight tracking-wide">
                IKA UII RUN
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                Admin Console
              </p>
            </div>
          </div>

          {/* Tombol Minimize (Desktop) & Close (Mobile) */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024)
                setIsOpen(false); // Mobile close
              else setIsCollapsed(!isCollapsed); // Desktop toggle minimize
            }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors shrink-0"
            title={isCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {/* Pakai icon menu di mobile, icon panel di desktop */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                className="lg:hidden"
                d="M6 18L18 6M6 6l12 12"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                className="hidden lg:block"
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* AREA MENU BAWAH */}
        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden custom-scrollbar space-y-2">
          {menuData.map((group, index) => {
            // Render Single Item (Tanpa Sub-menu, misal Dashboard)
            if (!group.subItems) {
              const isActive = pathname === group.path;
              return (
                <Link
                  key={index}
                  href={group.path!}
                  onClick={() => setIsOpen(false)}
                  title={isCollapsed ? group.title : ""}
                  className={`flex items-center gap-4 px-6 py-3 mx-2 rounded-xl text-sm transition-all duration-200 group relative ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 hover:text-blue-600 font-medium"
                  } ${isCollapsed ? "justify-center px-0" : ""}`}
                >
                  <span
                    className={`${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}`}
                  >
                    {group.icon}
                  </span>
                  {!isCollapsed && (
                    <span className="whitespace-nowrap">{group.title}</span>
                  )}
                </Link>
              );
            }

            // Render Group (Dengan Sub-menu / Dropdown)
            const isGroupOpen = openGroups[group.title];
            const hasActiveChild = group.subItems.some(
              (sub) =>
                pathname === sub.path || pathname.startsWith(`${sub.path}/`),
            );

            return (
              <div key={index} className="flex flex-col mx-2">
                {/* Tombol Induk Dropdown */}
                <button
                  onClick={() => toggleGroup(group.title)}
                  title={isCollapsed ? group.title : ""}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 group ${
                    hasActiveChild && !isGroupOpen
                      ? "bg-blue-50/50 text-blue-700 font-bold"
                      : "text-slate-600 hover:bg-slate-50 font-semibold"
                  } ${isCollapsed ? "justify-center" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`${hasActiveChild ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"} shrink-0`}
                    >
                      {group.icon}
                    </span>
                    {!isCollapsed && (
                      <span className="whitespace-nowrap">{group.title}</span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isGroupOpen ? "rotate-180" : ""}`}
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
                  )}
                </button>

                {/* Anak Menu (Dropdown Content) */}
                {!isCollapsed && isGroupOpen && (
                  <div className="flex flex-col mt-1 ml-4 pl-4 border-l-2 border-slate-100 space-y-1 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {group.subItems.map((sub, subIdx) => {
                      const isSubActive =
                        pathname === sub.path ||
                        pathname.startsWith(`${sub.path}/`);
                      return (
                        <Link
                          key={subIdx}
                          href={sub.path}
                          target={sub.isExternal ? "_blank" : "_self"} // Buka di tab baru khusus layar TV
                          onClick={() => {
                            if (!sub.isExternal) setIsOpen(false);
                          }}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-lg text-xs transition-colors ${
                            isSubActive
                              ? "bg-blue-500 text-white font-bold shadow-md"
                              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 font-medium"
                          }`}
                        >
                          <span className="whitespace-nowrap truncate">
                            {sub.name}
                          </span>

                          {/* Indikator External Link */}
                          {sub.isExternal && (
                            <svg
                              className={`w-3 h-3 shrink-0 ${isSubActive ? "text-blue-200" : "text-slate-300"}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* FOOTER SIDEBAR */}
        <div
          className={`p-4 border-t border-slate-100 mt-auto transition-all ${isCollapsed ? "text-center" : ""}`}
        >
          {!isCollapsed ? (
            <div className="flex flex-col">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Sistem v2.0
              </p>
              <p className="text-xs text-slate-500 font-medium">
                © {new Date().getFullYear()} DPW IKA UII
              </p>
            </div>
          ) : (
            <p className="text-[10px] text-slate-400 font-bold">v2</p>
          )}
        </div>
      </aside>
    </>
  );
}
