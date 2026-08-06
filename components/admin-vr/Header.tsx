"use client";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";

export default function Header({ userEmail }: { userEmail: string }) {
  const handleLogout = async () => {
    if (confirm("Yakin ingin keluar dari panel admin?")) {
      await signOut(auth);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10 shrink-0">
      <div>
        <h2 className="text-lg font-black text-slate-800">Control Room</h2>
        <p className="text-xs font-medium text-slate-500">
          Kelola event Virtual Run dengan mudah.
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-0.5">
            Admin Aktif
          </p>
          <p className="text-sm font-bold text-slate-700">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-600 hover:text-white border border-rose-100 px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          Keluar <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
