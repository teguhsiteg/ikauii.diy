"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function AdminUlasanPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Filter & Pagination
  const [activeTab, setActiveTab] = useState<"Pending" | "Tayang" | "Arsip">(
    "Pending",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number | "Semua">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog & Toast State
  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "" });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, isOpen: false })), 3000);
  };

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setDialog({ isOpen: true, title, message, onConfirm });
  };

  const fetchFeedbacks = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "feedbacks"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      setFeedbacks(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Gagal memuat ulasan:", error);
      showToast("Gagal memuat data dari server.", "error");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    return feedbacks.filter((f) => {
      const matchTab = f.status === activeTab;
      const search = searchQuery.toLowerCase();
      const matchSearch =
        f.nama?.toLowerCase().includes(search) ||
        f.ulasan?.toLowerCase().includes(search) ||
        f.asal?.toLowerCase().includes(search);
      return matchTab && matchSearch;
    });
  }, [feedbacks, activeTab, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, itemsPerPage]);

  const totalPages =
    itemsPerPage === "Semua"
      ? 1
      : Math.ceil(filteredData.length / itemsPerPage);
  const currentData = useMemo(() => {
    if (itemsPerPage === "Semua") return filteredData;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  // Action Logic
  const handleUpdateStatus = async (
    id: string,
    newStatus: "Tayang" | "Arsip" | "Pending",
  ) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "feedbacks", id), { status: newStatus });
      fetchFeedbacks();
      showToast(`Status ulasan berhasil diubah menjadi ${newStatus}.`);
    } catch (error) {
      showToast("Gagal mengubah status.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = (id: string) => {
    showConfirm(
      "Hapus Permanen",
      "Yakin ingin menghapus ulasan ini secara permanen?",
      async () => {
        closeDialog();
        setIsProcessing(true);
        try {
          await deleteDoc(doc(db, "feedbacks", id));
          fetchFeedbacks();
          showToast("Ulasan berhasil dihapus.");
        } catch (error) {
          showToast("Gagal menghapus ulasan.", "error");
        } finally {
          setIsProcessing(false);
        }
      },
    );
  };

  // Helper Bintang
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? "text-[#FFD700]" : "text-slate-200"}`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12 font-sans text-[#202124]">
      {/* TOAST NOTIFICATION */}
      <div
        className={`fixed top-6 right-6 z-[200] transition-all duration-300 transform ${toast.isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border ${toast.type === "success" ? "bg-white border-emerald-100" : "bg-white border-red-100"}`}
        >
          <p className="text-sm font-bold text-slate-800">{toast.message}</p>
        </div>
      </div>

      {/* CONFIRM DIALOG */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6 border border-[#DADCE0] text-center zoom-in-95">
            <h2 className="text-lg font-bold text-[#D93025] mb-2">
              {dialog.title}
            </h2>
            <p className="text-sm text-slate-600 mb-6">{dialog.message}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={closeDialog}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors w-full"
              >
                Batal
              </button>
              <button
                onClick={dialog.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-[#D93025] hover:bg-[#b52a1f] rounded shadow-sm w-full"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        <div className="mb-6">
          <h1 className="text-3xl font-medium text-[#202124] mb-1 tracking-tight">
            Manajemen Ulasan & Rating
          </h1>
          <p className="text-[#5F6368] text-sm">
            Kelola feedback dari alumni. Setujui (Tayang) untuk menampilkannya
            di halaman beranda publik.
          </p>
        </div>

        {/* TABS */}
        <div className="flex border-b border-[#DADCE0] mb-6 overflow-x-auto no-scrollbar">
          {["Pending", "Tayang", "Arsip"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === tab ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-[#5F6368] hover:text-[#202124] hover:bg-slate-50"}`}
            >
              {tab === "Pending"
                ? "Antrean Masuk"
                : tab === "Tayang"
                  ? "Live di Beranda"
                  : "Diarsipkan"}
              <span
                className={`ml-2 text-[10px] px-2 py-0.5 rounded-full ${activeTab === tab ? "bg-[#1A73E8] text-white" : "bg-slate-200 text-slate-600"}`}
              >
                {feedbacks.filter((f) => f.status === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* SEARCH BAR */}
        <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm mb-6 p-4 flex items-center">
          <svg
            className="w-5 h-5 text-slate-400 mr-3"
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
          <input
            type="text"
            placeholder="Cari berdasarkan nama, fakultas, atau isi ulasan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm outline-none text-[#202124] placeholder:text-slate-400"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="w-8 h-8 border-4 border-[#E8F0FE] border-t-[#1A73E8] rounded-full animate-spin"></div>
              </div>
            ) : currentData.length === 0 ? (
              <div className="text-center py-20 text-[#5F6368]">
                <p>Tidak ada data ulasan di tab ini.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F8F9FA] border-b border-[#DADCE0] text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider w-[25%]">
                      Info Pengulas
                    </th>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider w-[50%]">
                      Rating & Ulasan
                    </th>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-center w-[10%]">
                      Tanggal
                    </th>
                    <th className="px-6 py-4 font-bold text-[11px] uppercase tracking-wider text-right w-[15%]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]">
                  {currentData.map((f) => {
                    // Handle Firestore Timestamp
                    const date = f.createdAt?.toDate
                      ? f.createdAt.toDate()
                      : new Date(f.createdAt || Date.now());

                    return (
                      <tr
                        key={f.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 align-top">
                          <p className="font-bold text-[#202124] text-base">
                            {f.nama}
                          </p>
                          <p className="text-[#5F6368] text-xs font-medium mt-0.5">
                            {f.asal || "-"}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="mb-2">{renderStars(f.rating)}</div>
                          <p className="text-sm text-[#202124] leading-relaxed italic bg-slate-50 border border-slate-100 p-3 rounded-lg">
                            "{f.ulasan}"
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center align-top whitespace-nowrap">
                          <p className="text-xs text-[#5F6368] font-mono">
                            {date.toLocaleDateString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right align-top">
                          <div className="flex flex-col items-end gap-2">
                            {f.status === "Pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(f.id, "Tayang")
                                  }
                                  disabled={isProcessing}
                                  className="w-full bg-[#E6F4EA] hover:bg-[#CEEAD6] text-[#1E8E3E] border border-[#CEEAD6] px-3 py-1.5 rounded font-bold text-[11px] transition-colors"
                                >
                                  Tayangkan
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateStatus(f.id, "Arsip")
                                  }
                                  disabled={isProcessing}
                                  className="w-full bg-white hover:bg-slate-100 text-slate-600 border border-[#DADCE0] px-3 py-1.5 rounded font-bold text-[11px] transition-colors"
                                >
                                  Arsipkan
                                </button>
                              </>
                            )}

                            {f.status === "Tayang" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(f.id, "Arsip")
                                }
                                disabled={isProcessing}
                                className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3 py-1.5 rounded font-bold text-[11px] transition-colors"
                              >
                                Turunkan (Arsip)
                              </button>
                            )}

                            {f.status === "Arsip" && (
                              <button
                                onClick={() =>
                                  handleUpdateStatus(f.id, "Tayang")
                                }
                                disabled={isProcessing}
                                className="w-full bg-white hover:bg-slate-100 text-[#1A73E8] border border-[#DADCE0] px-3 py-1.5 rounded font-bold text-[11px] transition-colors"
                              >
                                Tayangkan Ulang
                              </button>
                            )}

                            <button
                              onClick={() => handleDelete(f.id)}
                              disabled={isProcessing}
                              className="w-full mt-1 flex items-center justify-center gap-1 text-[#D93025] hover:underline text-[11px] font-bold py-1"
                            >
                              <svg
                                className="w-3.5 h-3.5"
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
                              Hapus Permanen
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
