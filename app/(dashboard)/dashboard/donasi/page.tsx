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
  deleteDoc,
  where,
} from "firebase/firestore";
import * as XLSX from "xlsx";

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
              // Jika data user belum ada di Firestore (belum onboarding)
              setHasAccess(false);
            }
          } catch (error) {
            console.error("Gagal cek akses:", error);
            setHasAccess(false);
          }
        } else {
          setHasAccess(false); // Tidak login
        }
      });
      return () => unsubscribe();
    };
    checkAccess();
  }, []);

  // 1. FETCH DAFTAR PERIODE (Hanya jalan jika punya akses)
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
        setSelectedPeriode(data[0]); // Auto select periode terbaru
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
  }, [hasAccess]); // Trigger fetch saat hasAccess bernilai true

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
        // Sort manual by date desc
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
    try {
      const nominalNum = Number(newDonasi.nominal);
      await addDoc(collection(db, "donasi_transaksi"), {
        periodeId: selectedPeriode.id,
        nama: newDonasi.nama || "Hamba Allah",
        nominal: nominalNum,
        doa: newDonasi.doa || "-",
        metode: newDonasi.metode,
        statusValidasi: true, // Input manual admin otomatis valid
        createdAt: new Date().toISOString(),
      });
      setIsModalDonasiOpen(false);
      setNewDonasi({ nama: "", nominal: "", doa: "", metode: "Transfer Bank" });

      // Refresh list
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

    // Tambahkan baris total di bawah
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
      <div className="p-10 text-center animate-pulse text-slate-400 font-bold mt-20">
        Memverifikasi Keamanan Akses...
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-in zoom-in duration-300">
        <span className="text-6xl mb-4">⛔</span>
        <h2 className="text-3xl font-black text-blue-950 mb-2">
          Akses Ditolak
        </h2>
        <p className="text-slate-500 font-medium leading-relaxed max-w-md">
          Halaman Rekapitulasi Donasi ini adalah area terbatas. <br />
          Hanya dapat diakses oleh <b>Super Admin</b> atau Koordinator{" "}
          <b>Bidang Sosial dan Keagamaan</b>.
        </p>
        <button
          onClick={() => window.history.back()}
          className="mt-8 bg-blue-900 hover:bg-blue-950 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md"
        >
          &larr; Kembali ke Halaman Sebelumnya
        </button>
      </div>
    );
  }

  if (isLoadingPeriode) {
    return (
      <div className="p-10 text-center animate-pulse text-slate-400 font-bold mt-20">
        Memuat Sistem Rekapitulasi Donasi...
      </div>
    );
  }

  // JIKA AKSES DIBERIKAN, RENDER HALAMAN UTAMA
  return (
    <div className="max-w-7xl animate-in fade-in duration-500 pb-12 flex flex-col lg:flex-row gap-8">
      {/* MODAL BUAT PERIODE BARU */}
      {isModalPeriodeOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalPeriodeOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-blue-950 mb-6">
              Buka Pekan Donasi Baru
            </h3>
            <form onSubmit={handleBuatPeriode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Edisi / Pekan
                </label>
                <input
                  type="text"
                  required
                  value={newPeriode.judul}
                  onChange={(e) =>
                    setNewPeriode({ ...newPeriode, judul: e.target.value })
                  }
                  placeholder="Cth: Jum'at Berkah Pekan 2 Maret"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Target Dana (Opsional, isi 0 jika tidak ada)
                </label>
                <input
                  type="number"
                  value={newPeriode.targetDana}
                  onChange={(e) =>
                    setNewPeriode({ ...newPeriode, targetDana: e.target.value })
                  }
                  placeholder="Cth: 5000000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all mt-4"
              >
                Buka Periode Sekarang
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL INPUT DONASI MANUAL */}
      {isModalDonasiOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsModalDonasiOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-blue-950 mb-2">
              Input Donasi Manual
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Tambahkan data jika ada alumni yang menitipkan dana secara tunai
              (cash) ke panitia.
            </p>
            <form onSubmit={handleInputDonasi} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nama Donatur
                </label>
                <input
                  type="text"
                  value={newDonasi.nama}
                  onChange={(e) =>
                    setNewDonasi({ ...newDonasi, nama: e.target.value })
                  }
                  placeholder="Biarkan kosong untuk Hamba Allah"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nominal (Rp)
                </label>
                <input
                  type="number"
                  required
                  value={newDonasi.nominal}
                  onChange={(e) =>
                    setNewDonasi({ ...newDonasi, nominal: e.target.value })
                  }
                  placeholder="Cth: 500000"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Titipan Doa / Pesan
                </label>
                <textarea
                  value={newDonasi.doa}
                  onChange={(e) =>
                    setNewDonasi({ ...newDonasi, doa: e.target.value })
                  }
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all mt-2"
              >
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* KOLOM KIRI: LIST PERIODE / EDISI        */}
      {/* ======================================= */}
      <div className="w-full lg:w-1/3 flex flex-col gap-4">
        <div className="bg-blue-950 p-6 rounded-3xl shadow-lg relative overflow-hidden text-white">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-800 rounded-full blur-2xl opacity-50"></div>
          <h2 className="text-xl font-black mb-1 relative z-10">
            Manajemen Donasi
          </h2>
          <p className="text-xs text-blue-200 mb-6 relative z-10">
            Kelola pendanaan per pekan/edisi agar laporan lebih rapi dan
            transparan.
          </p>
          <button
            onClick={() => setIsModalPeriodeOpen(true)}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-black py-3 rounded-xl shadow-md transition-all relative z-10 flex items-center justify-center gap-2"
          >
            <span>+</span> Buka Edisi Baru
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-4 flex-grow max-h-[600px] overflow-y-auto no-scrollbar">
          <h3 className="font-bold text-slate-700 mb-4 px-2 text-sm uppercase tracking-widest">
            Riwayat Edisi
          </h3>
          {periodeList.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-10">
              Belum ada edisi donasi yang dibuka.
            </p>
          ) : (
            <div className="space-y-3">
              {periodeList.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPeriode(p)}
                  className={`p-4 rounded-2xl cursor-pointer border-2 transition-all ${selectedPeriode?.id === p.id ? "border-blue-600 bg-blue-50/50 shadow-sm" : "border-slate-100 bg-white hover:border-blue-300"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4
                      className={`font-bold text-sm leading-snug pr-2 ${selectedPeriode?.id === p.id ? "text-blue-900" : "text-slate-700"}`}
                    >
                      {p.judul}
                    </h4>
                    <span
                      className={`text-[9px] font-black px-2 py-1 rounded uppercase tracking-widest shrink-0 ${p.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-500"}`}
                    >
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Dibuka: {new Date(p.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ======================================= */}
      {/* KOLOM KANAN: DETAIL REKAP & TRANSAKSI   */}
      {/* ======================================= */}
      <div className="w-full lg:w-2/3 flex flex-col gap-6">
        {!selectedPeriode ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex items-center justify-center h-full min-h-[400px]">
            <p className="text-slate-400 font-bold">
              Pilih salah satu edisi di samping untuk melihat rekapitulasi.
            </p>
          </div>
        ) : (
          <>
            {/* KARTU STATISTIK ATAS */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-8 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-blue-950">
                      {selectedPeriode.judul}
                    </h2>
                    <button
                      onClick={() =>
                        handleTutupPeriode(
                          selectedPeriode.id,
                          selectedPeriode.status,
                        )
                      }
                      className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border transition-all ${selectedPeriode.status === "Aktif" ? "border-red-200 text-red-600 hover:bg-red-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}
                    >
                      {selectedPeriode.status === "Aktif"
                        ? "Tutup Donasi"
                        : "Buka Kembali"}
                    </button>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    Total Terkumpul Pekan Ini:
                  </p>
                  <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-blue-900 mt-1">
                    {formatRp(totalTerkumpul)}
                  </h1>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsModalDonasiOpen(true)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                  >
                    + Input Manual
                  </button>
                  <button
                    onClick={downloadExcel}
                    disabled={transaksiList.length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    Export Excel
                  </button>
                </div>
              </div>

              {/* PROGRESS BAR JIKA ADA TARGET */}
              {selectedPeriode.targetDana > 0 && (
                <div className="mt-8 relative z-10">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-blue-900">
                      Tercapai {persentase}%
                    </span>
                    <span className="text-slate-500">
                      Target: {formatRp(selectedPeriode.targetDana)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-3 rounded-full transition-all duration-1000"
                      style={{ width: `${persentase}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* TABEL RINCIAN DONATUR */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex-grow">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-blue-950 flex items-center gap-2">
                  <span className="text-lg">🧾</span> Rincian Transaksi Masuk
                  <span className="bg-blue-100 text-blue-800 text-xs py-0.5 px-2 rounded-full ml-2">
                    {transaksiList.length} Donatur
                  </span>
                </h3>
              </div>

              {isLoadingTransaksi ? (
                <div className="p-16 text-center animate-pulse text-slate-400 font-bold">
                  Memuat rincian transaksi...
                </div>
              ) : transaksiList.length === 0 ? (
                <div className="p-20 text-center">
                  <span className="text-5xl block opacity-30 mb-4">💸</span>
                  <h3 className="font-bold text-slate-700">
                    Belum ada donasi masuk
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Bagikan link / poster donasi untuk pekan ini.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-slate-100 text-[10px] uppercase tracking-widest text-slate-400">
                        <th className="p-4 font-bold">Waktu</th>
                        <th className="p-4 font-bold">Donatur</th>
                        <th className="p-4 font-bold">Nominal</th>
                        <th className="p-4 font-bold">Titipan Doa</th>
                        <th className="p-4 font-bold text-center">Validasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transaksiList.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50 transition-colors text-sm"
                        >
                          <td className="p-4 text-xs text-slate-500 whitespace-nowrap">
                            {new Date(t.createdAt).toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                            })}{" "}
                            <br />
                            <span className="text-[10px]">
                              {new Date(t.createdAt).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </span>
                          </td>
                          <td className="p-4">
                            <p className="font-bold text-blue-950 mb-0.5">
                              {t.nama}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {t.metode}
                            </p>
                          </td>
                          <td className="p-4 font-black text-green-600 whitespace-nowrap">
                            {formatRp(t.nominal)}
                          </td>
                          <td
                            className="p-4 text-xs text-slate-600 max-w-[200px] truncate"
                            title={t.doa}
                          >
                            {t.doa}
                          </td>
                          <td className="p-4 text-center">
                            {t.statusValidasi ? (
                              <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                ✓ Sah
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-700 border border-yellow-200 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
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
  );
}
