"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  orderBy,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import * as XLSX from "xlsx";

// --- IKON PROFESIONAL ---
const IconClose = () => (
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
);
const IconPlus = () => (
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
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);
const IconDownload = () => (
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
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
    />
  </svg>
);
const IconWallet = () => (
  <svg
    className="w-10 h-10"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H4.5A2.25 2.25 0 002.25 12v6.75A2.25 2.25 0 004.5 21h15a2.25 2.25 0 002.25-2.25V12z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M4.5 10.5h15M4.5 10.5a2.25 2.25 0 00-2.25-2.25h15A2.25 2.25 0 0019.5 6h-15A2.25 2.25 0 002.25 8.25v2.25"
    />
  </svg>
);

export default function PengelolaanDonasiPage() {
  // --- STATE PROTEKSI HALAMAN ---
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // --- STATE PERIODE (SESI) ---
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [selectedPeriode, setSelectedPeriode] = useState<any>(null);
  const [isLoadingPeriode, setIsLoadingPeriode] = useState(true);

  // Modal Buat Periode
  const [isModalPeriodeOpen, setIsModalPeriodeOpen] = useState(false);
  const [newPeriode, setNewPeriode] = useState({ judul: "", targetDana: "" });

  // --- STATE TRANSAKSI (DONATUR) ---
  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [isLoadingTransaksi, setIsLoadingTransaksi] = useState(false);

  // Modal Tambah Donasi Manual
  const [isModalDonasiOpen, setIsModalDonasiOpen] = useState(false);
  const [newDonasi, setNewDonasi] = useState({
    nama: "",
    nominal: "",
    doa: "",
    metode: "Transfer Bank",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // FORMAT RUPIAH
  const formatRp = (angka: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);
  };

  // 0. CEK HAK AKSES SAAT HALAMAN DIBUKA
  useEffect(() => {
    const checkAccess = async () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data();
              const isSuperAdmin = data.role === "super_admin";
              const isBidangSosial = (data.bidang || "")
                .toLowerCase()
                .includes("sosial");

              if (isSuperAdmin || isBidangSosial) {
                setHasAccess(true);
              } else {
                setHasAccess(false);
              }
            } else {
              setHasAccess(false);
            }
          } catch (error) {
            console.error("Gagal cek akses:", error);
            setHasAccess(false);
          }
        } else {
          setHasAccess(false);
        }
      });
      return () => unsubscribe();
    };
    checkAccess();
  }, []);

  // 1. FETCH DAFTAR PERIODE
  const fetchPeriode = async () => {
    if (!hasAccess) return;
    try {
      const q = query(
        collection(db, "donasi_periode"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPeriodeList(data);
      if (data.length > 0 && !selectedPeriode) {
        setSelectedPeriode(data[0]);
      }
    } catch (error) {
      console.error("Gagal load periode:", error);
    } finally {
      setIsLoadingPeriode(false);
    }
  };

  useEffect(() => {
    if (hasAccess) {
      fetchPeriode();
    }
  }, [hasAccess]);

  // 2. FETCH TRANSAKSI BERDASARKAN PERIODE TERPILIH
  useEffect(() => {
    if (!selectedPeriode || !hasAccess) return;
    const fetchTransaksi = async () => {
      setIsLoadingTransaksi(true);
      try {
        const q = query(
          collection(db, "donasi_transaksi"),
          where("periodeId", "==", selectedPeriode.id),
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setTransaksiList(data);
      } catch (error) {
        console.error("Gagal load transaksi:", error);
      } finally {
        setIsLoadingTransaksi(false);
      }
    };
    fetchTransaksi();
  }, [selectedPeriode, hasAccess]);

  // 3. FUNGSI BUAT PERIODE BARU
  const handleBuatPeriode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const docRef = await addDoc(collection(db, "donasi_periode"), {
        judul: newPeriode.judul,
        targetDana: Number(newPeriode.targetDana) || 0,
        status: "Aktif",
        createdAt: new Date().toISOString(),
      });
      setIsModalPeriodeOpen(false);
      setNewPeriode({ judul: "", targetDana: "" });
      fetchPeriode();
      setSelectedPeriode({
        id: docRef.id,
        judul: newPeriode.judul,
        targetDana: Number(newPeriode.targetDana),
        status: "Aktif",
      });
    } catch (error) {
      alert("Gagal membuat periode baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. FUNGSI TUTUP PERIODE
  const handleTutupPeriode = async (id: string, currentStatus: string) => {
    if (
      confirm(
        `Yakin ingin ${currentStatus === "Aktif" ? "MENUTUP" : "MEMBUKA KEMBALI"} periode donasi ini?`,
      )
    ) {
      const newStatus = currentStatus === "Aktif" ? "Selesai" : "Aktif";
      await updateDoc(doc(db, "donasi_periode", id), { status: newStatus });
      fetchPeriode();
      if (selectedPeriode?.id === id) {
        setSelectedPeriode({ ...selectedPeriode, status: newStatus });
      }
    }
  };

  // 5. FUNGSI INPUT DONASI MANUAL
  const handleInputDonasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriode) return;
    setIsSubmitting(true);
    try {
      const nominalNum = Number(newDonasi.nominal);
      await addDoc(collection(db, "donasi_transaksi"), {
        periodeId: selectedPeriode.id,
        nama: newDonasi.nama || "Hamba Allah",
        nominal: nominalNum,
        doa: newDonasi.doa || "-",
        metode: newDonasi.metode,
        statusValidasi: true,
        createdAt: new Date().toISOString(),
      });
      setIsModalDonasiOpen(false);
      setNewDonasi({ nama: "", nominal: "", doa: "", metode: "Transfer Bank" });

      const q = query(
        collection(db, "donasi_transaksi"),
        where("periodeId", "==", selectedPeriode.id),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setTransaksiList(data);
    } catch (error) {
      alert("Gagal menginput donasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. EXPORT EXCEL
  const downloadExcel = () => {
    const totalTerkumpul = transaksiList.reduce(
      (sum, item) => sum + item.nominal,
      0,
    );
    const dataToExport = transaksiList.map((p, index) => ({
      No: index + 1,
      Tanggal: new Date(p.createdAt).toLocaleString("id-ID"),
      "Nama Donatur": p.nama,
      Nominal: p.nominal,
      Metode: p.metode,
      "Pesan / Doa": p.doa,
      Status: p.statusValidasi ? "Tervalidasi" : "Menunggu",
    }));

    dataToExport.push({
      No: "",
      Tanggal: "",
      "Nama Donatur": "TOTAL TERKUMPUL",
      Nominal: totalTerkumpul,
      Metode: "",
      "Pesan / Doa": "",
      Status: "",
    } as any);

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet["!cols"] = [
      { wch: 5 },
      { wch: 20 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 40 },
      { wch: 15 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rekap Donasi");

    const safeFileName = selectedPeriode.judul
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    XLSX.writeFile(workbook, `Rekap_Donasi_${safeFileName}.xlsx`);
  };

  // --- HITUNG TOTAL DINAMIS ---
  const totalTerkumpul = transaksiList.reduce(
    (sum, item) => sum + item.nominal,
    0,
  );
  const persentase =
    selectedPeriode?.targetDana > 0
      ? Math.min(
          Math.round((totalTerkumpul / selectedPeriode.targetDana) * 100),
          100,
        )
      : 0;

  // ==========================================
  // RENDER UI BERDASARKAN STATUS AKSES
  // ==========================================
  if (hasAccess === null) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">
          Memverifikasi Otoritas Akses...
        </p>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-rose-50 p-6 rounded-full mb-6 ring-8 ring-rose-50/50">
          <svg
            className="w-16 h-16 text-rose-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
          Akses Ditolak
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed max-w-md">
          Halaman Manajemen Donasi adalah area finansial terbatas. Akses hanya
          diberikan kepada <b>Super Admin</b> atau Koordinator{" "}
          <b>Bidang Sosial dan Keagamaan</b>.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-8 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-sm"
        >
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  if (isLoadingPeriode) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">
          Memuat Sistem Rekapitulasi...
        </p>
      </div>
    );
  }

  // JIKA AKSES DIBERIKAN, RENDER HALAMAN UTAMA
  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pt-4 px-4 sm:px-6 lg:px-8">
        {/* --- HEADER --- */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest border border-emerald-200">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Finance & Donation Module
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Manajemen Donasi
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl">
            Kelola pendanaan, catat transaksi manual, dan pantau progres
            pencapaian target donasi secara real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* ======================================= */}
          {/* KOLOM KIRI: LIST PERIODE / EDISI        */}
          {/* ======================================= */}
          <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-6">
            {/* Panel Buka Periode */}
            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg shadow-slate-900/10 relative overflow-hidden text-white border border-slate-800">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
              <h3 className="text-base font-bold mb-1 relative z-10">
                Buka Edisi Baru
              </h3>
              <p className="text-xs text-slate-400 mb-5 relative z-10 leading-relaxed">
                Buat sesi donasi baru untuk pekan atau program khusus.
              </p>
              <button
                onClick={() => setIsModalPeriodeOpen(true)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl shadow-md transition-colors relative z-10 flex items-center justify-center gap-2 text-sm"
              >
                <IconPlus /> Buat Edisi
              </button>
            </div>

            {/* List Riwayat Edisi */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col max-h-[600px]">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest">
                  Riwayat Edisi Donasi
                </h3>
              </div>
              <div className="p-3 overflow-y-auto custom-scrollbar flex-grow space-y-2">
                {periodeList.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-8">
                    Belum ada edisi dibuka.
                  </p>
                ) : (
                  periodeList.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPeriode(p)}
                      className={`p-4 rounded-xl cursor-pointer transition-all border ${
                        selectedPeriode?.id === p.id
                          ? "bg-blue-50 border-blue-200 ring-1 ring-blue-500 shadow-sm"
                          : "bg-white border-transparent hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <h4
                          className={`font-bold text-sm leading-tight pr-2 ${selectedPeriode?.id === p.id ? "text-blue-900" : "text-slate-800"}`}
                        >
                          {p.judul}
                        </h4>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(p.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${p.status === "Aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ======================================= */}
          {/* KOLOM KANAN: DETAIL REKAP & TRANSAKSI   */}
          {/* ======================================= */}
          <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            {!selectedPeriode ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center h-[500px]">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                  <IconWallet />
                </div>
                <p className="text-slate-500 font-medium text-sm">
                  Pilih salah satu edisi di samping untuk melihat rekapitulasi.
                </p>
              </div>
            ) : (
              <>
                {/* KARTU STATISTIK ATAS */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                          {selectedPeriode.judul}
                        </h2>
                        <button
                          onClick={() =>
                            handleTutupPeriode(
                              selectedPeriode.id,
                              selectedPeriode.status,
                            )
                          }
                          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border transition-all ${selectedPeriode.status === "Aktif" ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"}`}
                        >
                          {selectedPeriode.status === "Aktif"
                            ? "Tutup Donasi"
                            : "Buka Kembali"}
                        </button>
                      </div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-6 mb-1">
                        Total Dana Terkumpul
                      </p>
                      <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tighter">
                        {formatRp(totalTerkumpul)}
                      </h1>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                      <button
                        onClick={() => setIsModalDonasiOpen(true)}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2"
                      >
                        <IconPlus /> Input Manual
                      </button>
                      <button
                        onClick={downloadExcel}
                        disabled={transaksiList.length === 0}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <IconDownload /> Export Excel
                      </button>
                    </div>
                  </div>

                  {/* PROGRESS BAR */}
                  {selectedPeriode.targetDana > 0 && (
                    <div className="mt-8 relative z-10 pt-6 border-t border-slate-100">
                      <div className="flex justify-between items-end mb-2">
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Pencapaian Target
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-emerald-600">
                            {persentase}%
                          </span>
                          <span className="text-xs font-medium text-slate-400 ml-2">
                            dari {formatRp(selectedPeriode.targetDana)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200/50">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out relative"
                          style={{ width: `${persentase}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* TABEL RINCIAN DONATUR */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-grow">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-sm">
                      Rincian Transaksi Masuk
                    </h3>
                    <span className="bg-white border border-slate-200 text-slate-600 font-semibold text-xs py-1 px-3 rounded-lg shadow-sm">
                      {transaksiList.length} Transaksi
                    </span>
                  </div>

                  {isLoadingTransaksi ? (
                    <div className="p-16 flex justify-center">
                      <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  ) : transaksiList.length === 0 ? (
                    <div className="p-20 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
                        <IconWallet />
                      </div>
                      <h3 className="font-semibold text-slate-700">
                        Belum ada transaksi
                      </h3>
                      <p className="text-sm text-slate-500 mt-1">
                        Gunakan tombol "Input Manual" untuk mencatat dana.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                          <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                            <th className="px-6 py-4 font-bold">Waktu</th>
                            <th className="px-6 py-4 font-bold">
                              Donatur & Metode
                            </th>
                            <th className="px-6 py-4 font-bold text-right">
                              Nominal
                            </th>
                            <th className="px-6 py-4 font-bold">
                              Titipan Pesan/Doa
                            </th>
                            <th className="px-6 py-4 font-bold text-center">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {transaksiList.map((t) => (
                            <tr
                              key={t.id}
                              className="hover:bg-slate-50 transition-colors text-sm group"
                            >
                              <td className="px-6 py-4 text-xs text-slate-500 align-top">
                                {new Date(t.createdAt).toLocaleDateString(
                                  "id-ID",
                                  { day: "2-digit", month: "short" },
                                )}
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {new Date(t.createdAt).toLocaleTimeString(
                                    "id-ID",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                              </td>
                              <td className="px-6 py-4 align-top">
                                <p className="font-bold text-slate-800 mb-0.5">
                                  {t.nama}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium inline-block bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {t.metode}
                                </p>
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-900 text-right align-top tracking-tight">
                                {formatRp(t.nominal)}
                              </td>
                              <td
                                className="px-6 py-4 text-xs text-slate-600 max-w-[200px] truncate align-top"
                                title={t.doa}
                              >
                                {t.doa === "-" ? (
                                  <span className="text-slate-300 italic">
                                    Tidak ada pesan
                                  </span>
                                ) : (
                                  t.doa
                                )}
                              </td>
                              <td className="px-6 py-4 text-center align-top">
                                {t.statusValidasi ? (
                                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    Sah
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    Pending
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ======================================= */}
      {/* MODAL AREA                              */}
      {/* ======================================= */}

      {/* MODAL BUAT PERIODE BARU */}
      {isModalPeriodeOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100">
            <button
              onClick={() => setIsModalPeriodeOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <IconClose />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-100">
                <IconPlus />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Buka Edisi Baru
              </h3>
            </div>

            <form onSubmit={handleBuatPeriode} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Nama Edisi / Program
                </label>
                <input
                  type="text"
                  required
                  value={newPeriode.judul}
                  onChange={(e) =>
                    setNewPeriode({ ...newPeriode, judul: e.target.value })
                  }
                  placeholder="Cth: Jum'at Berkah Pekan 2"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Target Dana (Opsional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={newPeriode.targetDana}
                    onChange={(e) =>
                      setNewPeriode({
                        ...newPeriode,
                        targetDana: e.target.value,
                      })
                    }
                    placeholder="5000000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none text-sm font-mono transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors mt-6 shadow-sm disabled:opacity-50 text-sm"
              >
                {isSubmitting ? "Memproses..." : "Buka Periode Sekarang"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT DONASI MANUAL */}
      {isModalDonasiOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-slate-100">
            <button
              onClick={() => setIsModalDonasiOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
            >
              <IconClose />
            </button>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-xl border border-blue-100">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Input Donasi Manual
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 font-medium">
              Catat dana titipan tunai (cash) ke dalam sistem.
            </p>

            <form onSubmit={handleInputDonasi} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Nama Donatur
                </label>
                <input
                  type="text"
                  value={newDonasi.nama}
                  onChange={(e) =>
                    setNewDonasi({ ...newDonasi, nama: e.target.value })
                  }
                  placeholder="Biarkan kosong untuk Hamba Allah"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Nominal Tunai
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    required
                    value={newDonasi.nominal}
                    onChange={(e) =>
                      setNewDonasi({ ...newDonasi, nominal: e.target.value })
                    }
                    placeholder="500000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm font-mono transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Titipan Pesan / Doa
                </label>
                <textarea
                  value={newDonasi.doa}
                  onChange={(e) =>
                    setNewDonasi({ ...newDonasi, doa: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-sm transition-all custom-scrollbar"
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 rounded-xl transition-colors mt-6 shadow-sm disabled:opacity-50 text-sm"
              >
                {isSubmitting ? "Menyimpan..." : "Simpan Transaksi"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
