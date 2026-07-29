"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import * as XLSX from "xlsx";

export default function TabParticipants() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔥 STATE MANAJEMEN TABEL 🔥
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchBar] = useState("");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedBukti, setSelectedBukti] = useState<string | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      // 1. Ambil Nama Kelas untuk Mapping
      const coursesSnap = await getDocs(collection(db, "masterclass_courses"));
      const courseMap: Record<string, string> = {};
      coursesSnap.forEach((d) => {
        courseMap[d.id] = d.data().judul;
      });

      // 2. Ambil Data Enrollment (Transaksi)
      const q = query(
        collection(db, "masterclass_enrollments"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      const enrollments = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        judulKelas: courseMap[d.data().courseId] || "Kelas Terhapus",
      }));

      setData(enrollments);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 FUNGSI EXPORT EXCEL ASLI (.xlsx) 🔥
  const exportToExcel = () => {
    const excelData = filteredData.map((e) => ({
      "ID INVOICE": `INV-${e.id.substring(0, 8)}`.toUpperCase(),
      "NAMA LENGKAP": e.namaPeserta,
      EMAIL: e.emailPeserta,
      KELAS: e.judulKelas,
      TIPE: e.tipeHarga,
      "TOTAL BAYAR": e.hargaTransaksi,
      "STATUS AKSES": e.statusAkses,
      "TANGGAL DAFTAR": e.createdAt?.toDate
        ? e.createdAt.toDate().toLocaleString("id-ID")
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

    // Atur Lebar Kolom
    worksheet["!cols"] = [
      { wch: 15 },
      { wch: 25 },
      { wch: 30 },
      { wch: 45 },
      { wch: 10 },
      { wch: 15 },
      { wch: 15 },
      { wch: 25 },
    ];

    XLSX.writeFile(workbook, `Laporan_Masterclass_IKA_UII_${Date.now()}.xlsx`);
  };

  // 🔥 FUNGSI BULK ACTIONS 🔥
  const handleBulkApprove = async () => {
    if (!confirm(`Setujui akses untuk ${selectedIds.length} peserta ini?`))
      return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.update(doc(db, "masterclass_enrollments", id), {
          statusAkses: "Lunas",
          updatedAt: serverTimestamp(),
        });
      });
      await batch.commit();
      setSelectedIds([]);
      await fetchAllData();
    } catch (err) {
      toast.error("Gagal approve massal");
    }
    setIsProcessing(false);
  };

  const handleBulkDelete = async () => {
    if (
      !confirm(
        `HAPUS PERMANEN ${selectedIds.length} data? Tindakan ini tidak bisa dibatalkan!`,
      )
    )
      return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      selectedIds.forEach((id) => {
        batch.delete(doc(db, "masterclass_enrollments", id));
      });
      await batch.commit();
      setSelectedIds([]);
      await fetchAllData();
    } catch (err) {
      toast.error("Gagal hapus massal");
    }
    setIsProcessing(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const filteredData = data.filter((e) => {
    const matchSearch =
      e.namaPeserta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.emailPeserta?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filterStatus === "Semua" || e.statusAkses === filterStatus;
    return matchSearch && matchStatus;
  });

  // Filter ID yang diizinkan untuk di-select all (Abaikan Midtrans Pending)
  const allowableIds = filteredData
    .filter(
      (d) =>
        !(
          d.statusAkses === "Pending" &&
          !d.buktiTransferUrl &&
          d.tipeHarga !== "Gratis"
        ),
    )
    .map((d) => d.id);

  return (
    <div className="space-y-5 font-sans">
      {/* MODAL PREVIEW BUKTI */}
      {selectedBukti && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-black text-slate-800">
                Verifikasi Bukti Transfer
              </h3>
              <button
                onClick={() => setSelectedBukti(null)}
                className="p-2 hover:bg-slate-100 rounded-full"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-100 rounded-2xl p-2 mb-6">
              <img
                src={selectedBukti}
                alt="Bukti"
                className="w-full h-auto max-h-[60vh] object-contain rounded-xl"
              />
            </div>
            <button
              onClick={() => setSelectedBukti(null)}
              className="w-full py-4 bg-[#0B1120] text-white font-bold rounded-2xl hover:bg-slate-800 transition-all"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* TOOLBAR ATAS */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <input
              type="text"
              placeholder="Cari pendaftar..."
              value={searchTerm}
              onChange={(e) => setSearchBar(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 w-full lg:w-64 font-medium"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer text-slate-600 focus:border-blue-500"
          >
            <option value="Semua">Semua Status</option>
            <option value="Pending">🕒 Pending</option>
            <option value="Lunas">✅ Lunas</option>
            <option value="Batal">❌ Batal</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {selectedIds.length > 0 ? (
            <div className="flex items-center gap-2 animate-in zoom-in duration-200 bg-blue-50 p-1.5 rounded-2xl border border-blue-100">
              <button
                onClick={handleBulkApprove}
                disabled={isProcessing}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-black rounded-xl shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
              >
                APPROVE ({selectedIds.length})
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={isProcessing}
                className="px-4 py-2 bg-rose-600 text-white text-xs font-black rounded-xl shadow-md hover:bg-rose-700 transition-all disabled:opacity-50"
              >
                HAPUS PERMANEN
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="p-2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={exportToExcel}
              className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 text-xs font-black rounded-xl hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm border-b-4 active:border-b-0 active:translate-y-1"
            >
              <svg
                className="w-4 h-4 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              EKSPORT EXCEL (.XLSX)
            </button>
          )}
        </div>
      </div>

      {/* TABEL DATA */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-500 tracking-[0.1em] border-b border-slate-200">
                <th className="px-6 py-5 w-10">
                  <input
                    type="checkbox"
                    onChange={(e) =>
                      setSelectedIds(e.target.checked ? allowableIds : [])
                    }
                    checked={
                      selectedIds.length > 0 &&
                      selectedIds.length === allowableIds.length
                    }
                    className="w-4 h-4 accent-blue-600 cursor-pointer rounded"
                  />
                </th>
                <th className="px-4 py-5">Peserta & Kontak</th>
                <th className="px-4 py-5">Kelas & Invoice</th>
                <th className="px-4 py-5 text-center">Status Akses</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-24 text-center text-slate-400 font-bold tracking-widest"
                  >
                    MEMUAT DATA...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-24 text-center text-slate-400 font-medium"
                  >
                    Data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((e) => {
                  // LOGIKA PEMISAH MIDTRANS VS MANUAL
                  const isManual = !!e.buktiTransferUrl;
                  const isFree = e.tipeHarga === "Gratis";
                  const isMidtransPending =
                    e.statusAkses === "Pending" && !isManual && !isFree;

                  return (
                    <tr
                      key={e.id}
                      className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(e.id) ? "bg-blue-50/40" : ""}`}
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          disabled={isMidtransPending}
                          checked={selectedIds.includes(e.id)}
                          onChange={() => toggleSelect(e.id)}
                          title={
                            isMidtransPending
                              ? "Menunggu validasi otomatis Midtrans"
                              : "Pilih untuk aksi"
                          }
                          className="w-4 h-4 accent-blue-600 cursor-pointer rounded disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-black text-slate-900">
                          {e.namaPeserta}
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold">
                          {e.emailPeserta}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-700 line-clamp-1">
                          {e.judulKelas}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5 font-bold">
                          INV-{e.id.substring(0, 8)} •{" "}
                          <span className="text-blue-600">
                            Rp{" "}
                            {Number(e.hargaTransaksi).toLocaleString("id-ID")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          {e.statusAkses === "Lunas" ? (
                            <span className="text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-emerald-100 text-emerald-700">
                              ✅ LUNAS
                            </span>
                          ) : e.statusAkses === "Pending" ? (
                            isMidtransPending ? (
                              <span
                                className="text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-indigo-100 text-indigo-700 animate-pulse cursor-help"
                                title="Menunggu pembayaran via Gateway Midtrans"
                              >
                                🤖 SISTEM MIDTRANS
                              </span>
                            ) : (
                              <span className="text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-amber-100 text-amber-700 animate-pulse">
                                🕒 PENDING MANUAL
                              </span>
                            )
                          ) : (
                            <span className="text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider bg-rose-100 text-rose-700">
                              ❌ {e.statusAkses}
                            </span>
                          )}

                          {isManual && (
                            <button
                              onClick={() =>
                                setSelectedBukti(e.buktiTransferUrl)
                              }
                              className="text-[10px] font-black text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              CEK STRUK
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Email Notif */}
                          <a
                            href={`mailto:${e.emailPeserta}?subject=Update Pembayaran Masterclass: ${e.judulKelas}&body=Halo ${e.namaPeserta}, status pendaftaran Anda saat ini: ${e.statusAkses}.`}
                            title="Kirim Email"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-200"
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
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </a>

                          {/* Edit */}
                          <button
                            onClick={() =>
                              toast.info("Gunakan Modal Edit jika diperlukan")
                            }
                            title="Edit"
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-200"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={async () => {
                              if (confirm("Hapus pendaftar ini?")) {
                                await deleteDoc(
                                  doc(db, "masterclass_enrollments", e.id),
                                );
                                fetchAllData();
                              }
                            }}
                            title="Hapus"
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-sm rounded-lg transition-all border border-transparent hover:border-slate-200"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
