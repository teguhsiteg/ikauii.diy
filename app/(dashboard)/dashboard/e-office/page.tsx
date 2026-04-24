"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";

export default function ManajemenNomorSuratPage() {
  const [nomorList, setNomorList] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("semua"); // semua, terpakai, belum
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- STATE PAGINATION ---
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form Generator Nomor
  const [genForm, setGenForm] = useState({
    nomorUrut: "",
    jenis: "Surat Biasa",
    kategori: "Eksternal",
    index: "SR", // Default disesuaikan dengan opsi pertama
    perihal: "",
    pembuat: "",
    tglMasehi: new Date().toISOString().split("T")[0],
    preview: "",
  });

  // 1. Tarik Data Real-time
  const fetchData = async () => {
    setIsLoading(true);
    const q = query(
      collection(db, "nomor_surat"),
      orderBy("createdAt", "desc"),
    );
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setNomorList(data);

    // Auto-suggest Nomor Urut Berikutnya (Jika form baru dibuka)
    if (data.length > 0 && !genForm.nomorUrut) {
      const lastNumber = parseInt(data[0].nomor.split("/")[0]);
      if (!isNaN(lastNumber)) {
        setGenForm((prev) => ({
          ...prev,
          nomorUrut: String(lastNumber + 1).padStart(3, "0"),
        }));
      }
    } else if (data.length === 0) {
      setGenForm((prev) => ({ ...prev, nomorUrut: "001" }));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Reset pagination ke halaman 1 setiap kali filter atau itemsPerPage berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, itemsPerPage]);

  // 2. Auto Preview Generator Nomor
  useEffect(() => {
    const arrBulan = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    const d = new Date(genForm.tglMasehi);
    const bln = isNaN(d.getTime()) ? "..." : arrBulan[d.getMonth()];
    const thn = isNaN(d.getTime()) ? "..." : d.getFullYear().toString();
    const no = genForm.nomorUrut || "000";
    const kode = genForm.index; // Karena value-nya murni kode (misal: SR, UND)

    // Format Baku DPW IKA UII DIY
    const result = `[NO]/DPW-IKA-UII/DIY/[KODE]/[BLN]/[THN]`
      .replace("[NO]", no)
      .replace("[KODE]", kode)
      .replace("[BLN]", bln)
      .replace("[THN]", thn);

    setGenForm((prev) => ({ ...prev, preview: result }));
  }, [genForm.nomorUrut, genForm.index, genForm.tglMasehi]);

  // 3. Simpan ke Database
  const handleGenerate = async () => {
    if (!genForm.perihal || !genForm.pembuat || !genForm.nomorUrut) {
      return alert("Nomor, Perihal, dan Nama Pembuat wajib diisi!");
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "nomor_surat"), {
        nomor: genForm.preview,
        perihal: genForm.perihal,
        jenis: genForm.jenis,
        kategori: genForm.kategori,
        tanggal: genForm.tglMasehi,
        pembuat: genForm.pembuat,
        status: "Belum terpakai",
        createdAt: Date.now(),
      });

      setIsModalOpen(false);
      setGenForm((prev) => ({
        ...prev,
        perihal: "",
        pembuat: "",
        nomorUrut: String(parseInt(prev.nomorUrut) + 1).padStart(3, "0"),
      }));
      fetchData(); // Refresh Data
    } catch (error) {
      alert("Gagal membuat nomor surat.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Ubah Status & Hapus
  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus =
      currentStatus === "Sudah terpakai" ? "Belum terpakai" : "Sudah terpakai";
    await updateDoc(doc(db, "nomor_surat", id), {
      status: newStatus,
      updatedAt: Date.now(),
    });
    fetchData(); // Refresh Data
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus nomor surat ini secara permanen?")) {
      await deleteDoc(doc(db, "nomor_surat", id));
      fetchData(); // Refresh Data
    }
  };

  // --- LOGIKA FILTER & PAGINATION ---
  const filteredList = nomorList.filter((n) => {
    if (filterStatus === "terpakai") return n.status === "Sudah terpakai";
    if (filterStatus === "belum") return n.status === "Belum terpakai";
    return true;
  });

  const totalItems = filteredList.length;
  const totalPages =
    itemsPerPage === 0 ? 1 : Math.ceil(totalItems / itemsPerPage);

  const currentTableData =
    itemsPerPage === 0
      ? filteredList
      : filteredList.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage,
        );

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem =
    itemsPerPage === 0
      ? totalItems
      : Math.min(currentPage * itemsPerPage, totalItems);

  if (isLoading && nomorList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-[#152B5B] rounded-full"></div>
      </div>
    );
  }

  // --- KOMPONEN DROPDOWN INDEX KODE ---
  const DropdownIndexKode = () => (
    <select
      value={genForm.index}
      onChange={(e) => setGenForm({ ...genForm, index: e.target.value })}
      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:border-[#1A73E8] focus:bg-white transition-colors custom-scrollbar"
    >
      <option value="SR">SR (Surat Rekomendasi)</option>
      <option value="UND">UND (Surat Undangan)</option>
      <option value="ST">ST (Surat Tugas)</option>
      <option value="SK">SK (Surat Keterangan)</option>
      <option value="SKep">SKep (Surat Keputusan)</option>
      <option value="SPT">SPT (Surat Pemberitahuan)</option>
      <option value="SPH">SPH (Surat Permohonan)</option>
      <option value="SE">SE (Surat Edaran)</option>
      <option value="SPTG">SPTG (Surat Pengantar)</option>
      <option value="SBL">SBL (Surat Balasan)</option>
      <option value="INS">INS (Surat Instruksi)</option>
      <option value="SNY">SNY (Surat Pernyataan)</option>
      <option value="SPJ">SPJ (Surat Perjanjian)</option>
      <option value="SGH">SGH (Surat Pengesahan)</option>
      <option value="STB">STB (Surat Tembusan)</option>
      <option value="SIZ">SIZ (Surat Izin)</option>
      <option value="SPK">SPK (Surat Penugasan Kegiatan)</option>
      <option value="ND">ND (Nota Dinas)</option>
      <option value="MEM">MEM (Memo)</option>
      <option value="SKL">SKL (Surat Klarifikasi)</option>
      <option value="SPP">SPP (Surat Pemberhentian/Penonaktifan)</option>
      <option value="BA">BA (Berita Acara)</option>
    </select>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-blue-100 selection:text-[#152B5B]">
      <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pt-8 px-4 sm:px-6 lg:px-8">
        {/* HEADER GOOGLE STYLE */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#152B5B] tracking-tight">
              Registri Surat
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Database penomoran dokumen resmi IKA UII DIY.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-[#1A73E8] hover:bg-[#1557B0] text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
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
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Buat Nomor Baru
          </button>
        </div>

        {/* KARTU STATISTIK (ELEGANT) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div
            onClick={() => setFilterStatus("semua")}
            className={`p-5 rounded-xl cursor-pointer transition-all border ${filterStatus === "semua" ? "border-[#1A73E8] bg-blue-50/40 ring-1 ring-[#1A73E8]" : "bg-white border-slate-200 hover:border-slate-300"}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={`text-xs font-bold ${filterStatus === "semua" ? "text-[#1A73E8]" : "text-slate-500"}`}
              >
                Semua Nomor
              </span>
              <svg
                className={`w-5 h-5 ${filterStatus === "semua" ? "text-[#1A73E8]" : "text-slate-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-slate-800">
              {nomorList.length}
            </h3>
          </div>

          <div
            onClick={() => setFilterStatus("belum")}
            className={`p-5 rounded-xl cursor-pointer transition-all border ${filterStatus === "belum" ? "border-amber-500 bg-amber-50/40 ring-1 ring-amber-500" : "bg-white border-slate-200 hover:border-slate-300"}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={`text-xs font-bold ${filterStatus === "belum" ? "text-amber-700" : "text-slate-500"}`}
              >
                Belum Terpakai
              </span>
              <svg
                className={`w-5 h-5 ${filterStatus === "belum" ? "text-amber-600" : "text-slate-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-slate-800">
              {nomorList.filter((n) => n.status === "Belum terpakai").length}
            </h3>
          </div>

          <div
            onClick={() => setFilterStatus("terpakai")}
            className={`p-5 rounded-xl cursor-pointer transition-all border ${filterStatus === "terpakai" ? "border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500" : "bg-white border-slate-200 hover:border-slate-300"}`}
          >
            <div className="flex justify-between items-start mb-2">
              <span
                className={`text-xs font-bold ${filterStatus === "terpakai" ? "text-emerald-700" : "text-slate-500"}`}
              >
                Sudah Terpakai
              </span>
              <svg
                className={`w-5 h-5 ${filterStatus === "terpakai" ? "text-emerald-600" : "text-slate-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-slate-800">
              {nomorList.filter((n) => n.status === "Sudah terpakai").length}
            </h3>
          </div>
        </div>

        {/* TABEL DATABASE (DENGAN PAGINATION & FILTER) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800 text-sm">
                Data Registri
              </h3>
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filterStatus.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Tampilkan</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-slate-300 rounded-md px-2 py-1.5 outline-none focus:border-[#1A73E8] bg-white cursor-pointer font-medium"
              >
                <option value={10}>10 baris</option>
                <option value={20}>20 baris</option>
                <option value={50}>50 baris</option>
                <option value={0}>Semua data</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nomor & Perihal</th>
                  <th className="px-6 py-4 font-semibold">Jenis & Tanggal</th>
                  <th className="px-6 py-4 font-semibold">Pembuat</th>
                  <th className="px-6 py-4 font-semibold text-center">
                    Status
                  </th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentTableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-400 text-sm"
                    >
                      <svg
                        className="w-8 h-8 mx-auto mb-3 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      Tidak ada data untuk ditampilkan.
                    </td>
                  </tr>
                ) : (
                  currentTableData.map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#152B5B] font-mono text-[13px]">
                          {n.nomor}
                        </div>
                        <div className="text-slate-500 text-xs mt-1 whitespace-normal line-clamp-2 max-w-sm">
                          {n.perihal}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-sm">
                          {n.jenis}
                        </span>
                        <div className="text-xs text-slate-500 mt-1.5">
                          {new Date(n.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs font-semibold text-slate-700">
                          {n.pembuat}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Pemohon
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(n.id, n.status)}
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border ${n.status === "Sudah terpakai" ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100" : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"}`}
                        >
                          {n.status === "Sudah terpakai"
                            ? "Terpakai"
                            : "Belum Terpakai"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(n.id)}
                          className="text-slate-400 hover:text-rose-600 p-2 rounded-md hover:bg-rose-50 transition-colors"
                          title="Hapus"
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          {totalItems > 0 && itemsPerPage > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
              <div>
                Menampilkan{" "}
                <span className="font-bold text-slate-700">{startItem}</span>{" "}
                hingga{" "}
                <span className="font-bold text-slate-700">{endItem}</span> dari{" "}
                <span className="font-bold text-slate-700">{totalItems}</span>{" "}
                entri
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL GENERATOR NOMOR SURAT 
          ======================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="bg-white px-8 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-800">
                Buat Nomor Surat Baru
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-rose-500 p-1 rounded-md hover:bg-rose-50 transition-colors"
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
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* KOLOM 1 */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Nomor Urut <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={genForm.nomorUrut}
                        onChange={(e) =>
                          setGenForm({ ...genForm, nomorUrut: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-mono font-bold text-slate-800 outline-none focus:border-[#1A73E8] focus:bg-white transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Index Kode <span className="text-rose-500">*</span>
                      </label>
                      <DropdownIndexKode />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Tanggal Surat <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={genForm.tglMasehi}
                      onChange={(e) =>
                        setGenForm({ ...genForm, tglMasehi: e.target.value })
                      }
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-[#1A73E8] focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Jenis Surat <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={genForm.jenis}
                        onChange={(e) =>
                          setGenForm({ ...genForm, jenis: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-[#1A73E8] focus:bg-white transition-colors custom-scrollbar"
                      >
                        <option value="Surat Rekomendasi">
                          Surat Rekomendasi
                        </option>
                        <option value="Surat Undangan">Surat Undangan</option>
                        <option value="Surat Tugas">Surat Tugas</option>
                        <option value="Surat Keterangan">
                          Surat Keterangan
                        </option>
                        <option value="Surat Keputusan">Surat Keputusan</option>
                        <option value="Surat Pemberitahuan">
                          Surat Pemberitahuan
                        </option>
                        <option value="Surat Permohonan">
                          Surat Permohonan
                        </option>
                        <option value="Surat Edaran">Surat Edaran</option>
                        <option value="Surat Balasan">Surat Balasan</option>
                        <option value="Nota Dinas">Nota Dinas</option>
                        <option value="Memo">Memo</option>
                        <option value="Surat Biasa">
                          Surat Biasa (Lainnya)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Kategori <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={genForm.kategori}
                        onChange={(e) =>
                          setGenForm({ ...genForm, kategori: e.target.value })
                        }
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-[#1A73E8] focus:bg-white transition-colors"
                      >
                        <option value="Eksternal">Eksternal</option>
                        <option value="Internal">Internal</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* KOLOM 2 */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Pemohon / Nama Pembuat{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={genForm.pembuat}
                      onChange={(e) =>
                        setGenForm({ ...genForm, pembuat: e.target.value })
                      }
                      placeholder="Cth: Teguh Dwi"
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-[#1A73E8] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Perihal / Keterangan{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={genForm.perihal}
                      onChange={(e) =>
                        setGenForm({ ...genForm, perihal: e.target.value })
                      }
                      placeholder="Cth: Undangan Rapat Evaluasi Proker"
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-lg text-sm font-semibold text-slate-800 outline-none focus:border-[#1A73E8] focus:bg-white transition-colors resize-none"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* PREVIEW KOTAK BAWAH */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-6">
                <div className="flex-1 w-full">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Preview Nomor Registri
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={genForm.preview}
                    className="w-full bg-white border border-slate-300 text-slate-800 px-4 py-2.5 rounded-lg text-base sm:text-lg font-mono font-bold outline-none select-all text-center sm:text-left"
                  />
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold px-8 py-3.5 rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center text-sm shrink-0"
                >
                  {isSaving ? "Menyimpan..." : "Simpan & Daftarkan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
