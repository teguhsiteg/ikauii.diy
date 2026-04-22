"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import Link from "next/link";

// Helper format mata uang
const formatIDR = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function OverviewAdminPage() {
  const [vrStats, setVrStats] = useState({
    peserta: 0,
    tiket: 0,
    ongkir: 0,
    charity: 0,
  });
  const [offlineStats, setOfflineStats] = useState({
    peserta: 0,
    tiket: 0,
    charity: 0,
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. AUTO-RESET LOG (Efisien dengan Batch)
    const cleanOldLogs = async () => {
      try {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const q = query(
          collection(db, "vr_logs"),
          where("timestamp", "<", sevenDaysAgo),
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) return;

        const batch = writeBatch(db);
        snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
        await batch.commit();
        console.log("Old logs cleaned.");
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    };
    cleanOldLogs();

    // 2. REAL-TIME VR STATS
    const unsubVR = onSnapshot(collection(db, "vr_participants"), (snap) => {
      let stats = { peserta: 0, tiket: 0, ongkir: 0, charity: 0 };
      snap.forEach((doc) => {
        const data = doc.data();
        stats.peserta++;
        if (data.statusPembayaran === "Lunas") {
          const d = Number(data.nominalDonasi || 0);
          const o = Number(
            data.ongkir || data.ongkosKirim || data.biayaPengiriman || 0,
          );
          const t = Number(data.totalTagihan || 0);

          stats.charity += d;
          stats.ongkir += o;
          // Tiket adalah total dikurangi donasi & ongkir (mencegah double count)
          stats.tiket += t - d - o;
        }
      });
      setVrStats(stats);
    });

    // 3. REAL-TIME OFFLINE STATS
    const unsubOffline = onSnapshot(
      collection(db, "offline_participants"),
      (snap) => {
        let stats = { peserta: 0, tiket: 0, charity: 0 };
        snap.forEach((doc) => {
          const data = doc.data();
          stats.peserta++;
          if (data.statusPembayaran === "Lunas") {
            const d = Number(data.nominalDonasi || 0);
            const t = Number(data.totalTagihan || 0);
            stats.charity += d;
            stats.tiket += t - d;
          }
        });
        setOfflineStats(stats);
        setIsLoading(false); // Selesaikan loading setelah data utama masuk
      },
    );

    // 4. REAL-TIME LOGS
    const qLogs = query(
      collection(db, "vr_logs"),
      orderBy("timestamp", "desc"),
      limit(10),
    );
    const unsubLogs = onSnapshot(qLogs, (snap) => {
      setLogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubVR();
      unsubOffline();
      unsubLogs();
    };
  }, []);

  const totalPeserta = vrStats.peserta + offlineStats.peserta;
  const totalPendapatan = vrStats.tiket + vrStats.ongkir + offlineStats.tiket;
  const totalCharity = vrStats.charity + offlineStats.charity;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse text-[#1A73E8]">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
        <p className="font-medium">Sinkronisasi Data Finansial...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 px-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-slate-500 mt-1">
          Sistem Manajemen Event Terintegrasi
        </p>
      </header>

      {/* --- SECTION 1: GLOBAL CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard
          label="Total Pendaftar"
          value={`${totalPeserta} Orang`}
          icon="users"
          color="blue"
        />
        <StatCard
          label="Tiket & Jasa Kirim"
          value={formatIDR(totalPendapatan)}
          icon="wallet"
          color="green"
          accent
        />
        <StatCard
          label="Total Charity"
          value={formatIDR(totalCharity)}
          icon="heart"
          color="red"
          accent
        />
      </div>

      {/* --- SECTION 2: CATEGORY BREAKDOWN --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <DetailPanel
          title="Virtual Run"
          stats={vrStats}
          type="virtual"
          primaryColor="#1A73E8"
        />
        <DetailPanel
          title="Offline Run"
          stats={offlineStats}
          type="offline"
          primaryColor="#1E8E3E"
        />
      </div>

      {/* --- SECTION 3: NAVIGATION --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <NavLink
          href="/admin-vr/peserta"
          title="Peserta Virtual Run"
          desc="Logistik, Resi & Pengiriman"
          variant="white"
        />
        <NavLink
          href="/admin-vr/offline"
          title="Peserta Offline Run"
          desc="Verifikasi Lokasi & Check-in"
          variant="blue"
        />
      </div>

      {/* --- SECTION 4: ACTIVITY LOGS --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800">Riwayat Aktivitas</h3>
          <span className="flex items-center gap-2 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full uppercase">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />{" "}
            Live
          </span>
        </div>
        <div className="divide-y divide-slate-50">
          {logs.length > 0 ? (
            logs.map((log) => <LogItem key={log.id} log={log} />)
          ) : (
            <div className="p-10 text-center text-slate-400 text-sm">
              Tidak ada aktivitas terdeteksi.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS UNTUK KEBERSIHAN KODE ---

function StatCard({ label, value, icon, color, accent }: any) {
  const colors: any = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div
      className={`bg-white rounded-2xl p-6 border shadow-sm relative overflow-hidden transition-hover hover:shadow-md`}
    >
      {accent && (
        <div
          className={`absolute top-0 right-0 w-1.5 h-full ${color === "green" ? "bg-green-500" : "bg-red-500"}`}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors[color]}`}
        >
          {/* Icon Mapping placeholder */}
          <span className="font-bold">#</span>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${colors[color]}`}
        >
          {label}
        </span>
      </div>
      <h2 className="text-2xl font-black text-slate-800 tracking-tight">
        {value}
      </h2>
    </div>
  );
}

function DetailPanel({ title, stats, type, primaryColor }: any) {
  const isVR = type === "virtual";
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
          {title}
        </h3>
        <span className="text-xs font-bold text-slate-500 bg-white border px-3 py-1 rounded-full shadow-sm">
          {stats.peserta} Peserta
        </span>
      </div>
      <div className="p-6 space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tiket Dasar</span>
          <span className="font-semibold text-slate-800">
            {formatIDR(stats.tiket)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Jasa Kirim</span>
          <span className="font-semibold text-slate-800">
            {isVR ? formatIDR(stats.ongkir) : "Rp 0"}
          </span>
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Net Revenue
          </span>
          <span className="text-xl font-black" style={{ color: primaryColor }}>
            {formatIDR(stats.tiket + (stats.ongkir || 0))}
          </span>
        </div>
        <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center">
          <span className="text-sm font-medium text-rose-500 flex items-center gap-1">
            💖 Charity
          </span>
          <span className="font-bold text-rose-600">
            {formatIDR(stats.charity)}
          </span>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, title, desc, variant }: any) {
  const style =
    variant === "blue"
      ? "bg-[#1A73E8] text-white border-transparent hover:bg-blue-700 shadow-blue-200"
      : "bg-white text-slate-800 border-slate-200 hover:border-blue-400 shadow-slate-100";

  return (
    <Link
      href={href}
      className={`${style} p-5 rounded-2xl border shadow-sm transition-all flex items-center gap-4 group`}
    >
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${variant === "blue" ? "bg-white/20" : "bg-slate-100 group-hover:bg-blue-50"}`}
      >
        <span className="text-xl">→</span>
      </div>
      <div>
        <h3 className="font-bold text-base leading-none">{title}</h3>
        <p
          className={`text-xs mt-1.5 ${variant === "blue" ? "text-blue-100" : "text-slate-500"}`}
        >
          {desc}
        </p>
      </div>
    </Link>
  );
}

function LogItem({ log }: any) {
  const typeStyles: any = {
    lari: "bg-blue-50 text-blue-600",
    bayar: "bg-green-50 text-green-600",
    resi: "bg-purple-50 text-purple-600",
    default: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="px-6 py-4 hover:bg-slate-50 transition-colors flex items-start gap-4">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${typeStyles[log.type] || typeStyles.default}`}
      >
        {log.type?.charAt(0).toUpperCase() || "!"}
      </div>
      <div className="flex-grow">
        <p className="text-[13px] text-slate-700 leading-snug">
          <span className="font-bold text-slate-900">
            {log.adminEmail?.split("@")[0] || "Admin"}
          </span>{" "}
          {log.action}{" "}
          <span className="font-semibold text-slate-800">{log.targetName}</span>
        </p>
        <p className="text-[11px] text-slate-400 mt-1 font-medium">
          {new Date(log.timestamp).toLocaleString("id-ID", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </p>
      </div>
    </div>
  );
}
