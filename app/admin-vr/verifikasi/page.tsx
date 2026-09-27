"use client";

import { confirmAlert } from "@/lib/sweetalert";
import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Users,
  Trash2,
  Eye,
  Check,
  X,
  Calendar,
  Timer,
  ChevronDown,
} from "lucide-react";

export default function VerifikasiLariPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Filter & Search State
  const [filter, setFilter] = useState<"Pending" | "Approved" | "Rejected" | "All">("Pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | "All">(15);

  // Modal State untuk Image Fullscreen & Detail
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<any | null>(null);

  // 1. Ambil Data Admin
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAdminUser(user);
    });
    return () => unsubscribe();
  }, []);

  // 2. Ambil Data Bukti Lari Realtime
  useEffect(() => {
    const q = query(
      collection(db, "vr_submissions"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    });
    return () => unsubscribe();
  }, []);

  // 3. Fungsi Approve / Reject Lari (Dengan Log Realtime)
  const handleVerifikasiLari = async (
    id: string,
    action: "Approved" | "Rejected",
    participantName: string,
  ) => {
    const isConfirm = await confirmAlert(
      `Apakah Anda yakin ingin menandai bukti lari ini sebagai ${action === "Approved" ? "DISETUJUI" : "DITOLAK"}?`,
    );
    if (!isConfirm) return;

    setLoadingAction(id);
    try {
      await updateDoc(doc(db, "vr_submissions", id), { status: action });

      const logData = {
        type: "lari",
        action:
          action === "Approved"
            ? "menyetujui bukti lari"
            : "menolak bukti lari",
        targetName: participantName,
        adminEmail: adminUser?.email || "Admin",
        timestamp: Date.now(),
      };
      await addDoc(collection(db, "vr_logs"), logData);
      toast.success(action === "Approved" ? "Bukti lari disetujui." : "Bukti lari ditolak.");
      if (selectedDetail?.id === id) {
        setSelectedDetail(null);
      }
    } catch (error) {
      toast.error("Gagal memverifikasi data.");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Fitur Bulk Selection & Delete
  const toggleSelectSubmission = (id: string) => {
    if (selectedSubmissions.includes(id)) {
      setSelectedSubmissions(selectedSubmissions.filter((sid) => sid !== id));
    } else {
      setSelectedSubmissions([...selectedSubmissions, id]);
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    const matchFilter = filter === "All" || s.status === filter;
    const matchSearch =
      !searchQuery ||
      (s.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(s.jarakKm || "").includes(searchQuery);

    return matchFilter && matchSearch;
  });

  const totalPages =
    itemsPerPage === "All" ? 1 : Math.ceil(filteredSubmissions.length / itemsPerPage);

  const paginatedData =
    itemsPerPage === "All"
      ? filteredSubmissions
      : filteredSubmissions.slice(
          (currentPage - 1) * (itemsPerPage as number),
          currentPage * (itemsPerPage as number),
        );

  const handleSelectAllVisible = () => {
    if (
      selectedSubmissions.length === paginatedData.length &&
      paginatedData.length > 0
    ) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(paginatedData.map((s) => s.id));
    }
  };

  const deleteSelected = async () => {
    if (
      !await confirmAlert(
        `Yakin ingin menghapus ${selectedSubmissions.length} data bukti lari ini secara permanen?`,
      )
    )
      return;

    setLoadingAction("deleteBulk");
    try {
      const batch = writeBatch(db);
      selectedSubmissions.forEach((id) =>
        batch.delete(doc(db, "vr_submissions", id)),
      );
      await batch.commit();
      setSelectedSubmissions([]);
      toast.success("Data terpilih berhasil dihapus.");
    } catch {
      toast.error("Gagal menghapus data.");
    } finally {
      setLoadingAction(null);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "Pending").length;
  const approvedCount = submissions.filter((s) => s.status === "Approved").length;
  const rejectedCount = submissions.filter((s) => s.status === "Rejected").length;

  return (
    <div className="animate-in fade-in duration-300 flex flex-col h-[calc(100vh-2rem)] max-w-7xl mx-auto font-sans">
      {/* MODAL PREVIEW GAMBAR ZOOM */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-10 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-full max-w-3xl flex flex-col items-center justify-center">
            <button
              className="absolute -top-4 -right-4 bg-white text-slate-700 hover:text-black w-10 h-10 rounded-full font-bold text-sm z-50 shadow-xl flex items-center justify-center border border-slate-200"
              onClick={() => setPreviewImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Preview Bukti Lari"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain bg-black border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* MODAL DETAIL BUKTI LARI */}
      {selectedDetail && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-800">Detail Bukti Lari Peserta</h3>
                <p className="text-xs text-slate-500 font-mono">ID: {selectedDetail.id}</p>
              </div>
              <button
                onClick={() => setSelectedDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/2 flex flex-col">
                <div
                  className="w-full h-56 bg-slate-100 rounded-2xl overflow-hidden cursor-zoom-in relative group border border-slate-200 flex items-center justify-center"
                  onClick={() => setPreviewImage(selectedDetail.imgUrl)}
                >
                  <img
                    src={selectedDetail.imgUrl}
                    alt="Bukti Lari"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                    <Search className="w-4 h-4" /> Perbesar Gambar
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 space-y-4 text-sm">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Nama Peserta</span>
                  <p className="font-bold text-slate-800 text-base">{selectedDetail.nama}</p>
                  <p className="text-xs text-slate-500">{selectedDetail.email || "-"}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5">Jarak Tempuh</span>
                    <p className="text-xl font-black text-blue-700">{selectedDetail.jarakKm} <span className="text-xs">KM</span></p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">Durasi Lari</span>
                    <p className="text-base font-bold text-slate-700">{selectedDetail.durasi || "-"}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Tanggal Lari</span>
                  <p className="font-semibold text-slate-700">
                    {selectedDetail.tanggalLari
                      ? new Date(selectedDetail.tanggalLari).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                      : "-"}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">Status Saat Ini</span>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      selectedDetail.status === "Approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedDetail.status === "Rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {selectedDetail.status || "Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              {selectedDetail.status === "Pending" && (
                <>
                  <button
                    onClick={() => handleVerifikasiLari(selectedDetail.id, "Rejected", selectedDetail.nama)}
                    disabled={loadingAction === selectedDetail.id}
                    className="px-4 py-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold text-xs transition-colors"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() => handleVerifikasiLari(selectedDetail.id, "Approved", selectedDetail.nama)}
                    disabled={loadingAction === selectedDetail.id}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                  >
                    Setujui (+{selectedDetail.jarakKm} KM)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER RINGKAS & STATS CARD (SENADA DENGAN OFFLINE RUN) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 shrink-0">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">
            Total Masuk
          </p>
          <p className="text-2xl font-black text-slate-800">
            {submissions.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wider">
            Menunggu Verifikasi
          </p>
          <p className="text-2xl font-black text-[#F9AB00]">
            {pendingCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-emerald-600 mb-1 uppercase tracking-wider">
            Disetujui
          </p>
          <p className="text-2xl font-black text-[#1E8E3E]">
            {approvedCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-xs font-bold text-rose-600 mb-1 uppercase tracking-wider">
            Ditolak
          </p>
          <p className="text-2xl font-black text-[#D93025]">
            {rejectedCount}
          </p>
        </div>
      </div>

      {/* TOOLBAR FILTER, SEARCH & BULK ACTION */}
      <div className="bg-white p-4 rounded-t-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 shrink-0">
        {/* TAB FILTER STATUS */}
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto gap-1">
          {(["Pending", "Approved", "Rejected", "All"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setFilter(tab);
                setCurrentPage(1);
                setSelectedSubmissions([]);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filter === tab
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "Pending" && `Menunggu (${pendingCount})`}
              {tab === "Approved" && `Disetujui (${approvedCount})`}
              {tab === "Rejected" && `Ditolak (${rejectedCount})`}
              {tab === "All" && `Semua (${submissions.length})`}
            </button>
          ))}
        </div>

        {/* SEARCH & BULK DELETE */}
        <div className="flex items-center gap-2">
          {selectedSubmissions.length > 0 && (
            <button
              onClick={deleteSelected}
              disabled={loadingAction === "deleteBulk"}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" /> Hapus ({selectedSubmissions.length})
            </button>
          )}

          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              placeholder="Cari nama peserta / KM..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-slate-800"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(e.target.value === "All" ? "All" : Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value={15}>15 baris</option>
            <option value={30}>30 baris</option>
            <option value={50}>50 baris</option>
            <option value="All">Semua</option>
          </select>
        </div>
      </div>

      {/* TABEL DATA VERIFIKASI (SENADA DENGAN TABEL ADMIN OFFLINE) */}
      <div className="bg-white border-x border-slate-100 flex-grow overflow-auto relative min-h-0">
        <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 sticky top-0 z-10 shadow-sm text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4 border-b border-slate-200 w-10 text-center">
                <input
                  type="checkbox"
                  checked={selectedSubmissions.length === paginatedData.length && paginatedData.length > 0}
                  onChange={handleSelectAllVisible}
                  className="rounded text-[#1A73E8] focus:ring-[#1A73E8] w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="p-4 border-b border-slate-200 w-16 text-center">Bukti</th>
              <th className="p-4 border-b border-slate-200">Nama Peserta</th>
              <th className="p-4 border-b border-slate-200 text-center">Jarak (KM)</th>
              <th className="p-4 border-b border-slate-200">Durasi & Tanggal</th>
              <th className="p-4 border-b border-slate-200">Waktu Submit</th>
              <th className="p-4 border-b border-slate-200 text-center">Status</th>
              <th className="p-4 border-b border-slate-200 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400 font-medium">
                  Tidak ada bukti lari yang sesuai dengan kriteria filter atau pencarian.
                </td>
              </tr>
            ) : (
              paginatedData.map((sub) => {
                const isSelected = selectedSubmissions.includes(sub.id);
                return (
                  <tr
                    key={sub.id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      isSelected ? "bg-blue-50/60" : sub.status === "Pending" ? "bg-amber-50/30" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectSubmission(sub.id)}
                        className="rounded text-[#1A73E8] focus:ring-[#1A73E8] w-4 h-4 cursor-pointer"
                      />
                    </td>

                    {/* Thumbnail Bukti */}
                    <td className="p-4 text-center">
                      <div
                        onClick={() => setPreviewImage(sub.imgUrl)}
                        className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden cursor-zoom-in relative group mx-auto shrink-0"
                        title="Klik untuk perbesar gambar"
                      >
                        <img
                          src={sub.imgUrl}
                          alt="Thumb"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      </div>
                    </td>

                    {/* Peserta */}
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{sub.nama || "Peserta"}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[200px]">
                        {sub.email || sub.participantId || "-"}
                      </p>
                    </td>

                    {/* Jarak */}
                    <td className="p-4 text-center">
                      <span className="font-mono font-black text-[#1A73E8] bg-blue-50 px-2.5 py-1 rounded text-sm">
                        {sub.jarakKm} KM
                      </span>
                    </td>

                    {/* Durasi & Tanggal Lari */}
                    <td className="p-4">
                      <p className="font-bold text-slate-700">{sub.durasi || "-"}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {sub.tanggalLari ? new Date(sub.tanggalLari).toLocaleDateString("id-ID") : "-"}
                      </p>
                    </td>

                    {/* Waktu Submit */}
                    <td className="p-4 text-slate-500 text-xs">
                      {sub.createdAt ? new Date(sub.createdAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" }) : "-"}
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full border ${
                          sub.status === "Approved"
                            ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20"
                            : sub.status === "Rejected"
                              ? "bg-[#FCE8E6] text-[#D93025] border-[#D93025]/20"
                              : "bg-[#FEF7E0] text-[#B08D00] border-[#F9AB00]/20"
                        }`}
                      >
                        {sub.status || "Pending"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedDetail(sub)}
                          className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors"
                          title="Lihat Detail"
                        >
                          Detail
                        </button>

                        {sub.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleVerifikasiLari(sub.id, "Approved", sub.nama)}
                              disabled={loadingAction === sub.id}
                              className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors"
                              title="Setujui Bukti Lari Ini"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => handleVerifikasiLari(sub.id, "Rejected", sub.nama)}
                              disabled={loadingAction === sub.id}
                              className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              title="Tolak Bukti Lari Ini"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION BAWAH */}
      <div className="bg-white p-4 rounded-b-2xl shadow-sm border border-slate-100 flex justify-between items-center shrink-0">
        <p className="text-sm text-slate-500 font-medium">
          Menampilkan baris{" "}
          <span className="font-bold text-slate-800">
            {filteredSubmissions.length === 0 ? 0 : (currentPage - 1) * (itemsPerPage === "All" ? filteredSubmissions.length : itemsPerPage) + 1}
          </span>{" "}
          -{" "}
          <span className="font-bold text-slate-800">
            {Math.min(
              currentPage * (itemsPerPage === "All" ? filteredSubmissions.length : itemsPerPage),
              filteredSubmissions.length,
            )}
          </span>{" "}
          dari <span className="font-bold text-slate-800">{filteredSubmissions.length}</span> data
        </p>

        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Sebelumnya
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  );
}
