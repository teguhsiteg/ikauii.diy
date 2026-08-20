"use client";

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

export default function VerifikasiLariPage() {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Filter State
  const [filter, setFilter] = useState<
    "Pending" | "Approved" | "Rejected" | "All"
  >("Pending");

  // Modal State untuk Image Fullscreen
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // 1. Ambil Data Admin (Untuk keperluan Log Aktivitas)
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

  // 3. Fungsi Approve / Reject Lari (Dengan Injeksi Log Realtime)
  const handleVerifikasiLari = async (
    id: string,
    action: "Approved" | "Rejected",
    participantName: string,
  ) => {
    const isConfirm = window.confirm(
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
    } catch (error) {
      toast.error("Gagal memverifikasi data.");
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Fitur Bulk Delete (Hapus Banyak)
  const toggleSelectSubmission = (id: string) => {
    if (selectedSubmissions.includes(id)) {
      setSelectedSubmissions(selectedSubmissions.filter((sid) => sid !== id));
    } else {
      setSelectedSubmissions([...selectedSubmissions, id]);
    }
  };

  const filteredSubmissions = submissions.filter(
    (s) => filter === "All" || s.status === filter,
  );

  const handleSelectAll = () => {
    if (
      selectedSubmissions.length === filteredSubmissions.length &&
      filteredSubmissions.length > 0
    ) {
      setSelectedSubmissions([]);
    } else {
      setSelectedSubmissions(filteredSubmissions.map((s) => s.id));
    }
  };

  const deleteSelected = async () => {
    if (
      !confirm(
        `Yakin ingin menghapus ${selectedSubmissions.length} bukti lari secara permanen? Data yang dihapus tidak dapat dikembalikan.`,
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
    } catch {
      toast.error("Gagal menghapus data.");
    } finally {
      setLoadingAction(null);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "Pending").length;

  return (
    <div className="animate-in fade-in duration-300 max-w-7xl mx-auto pb-10 font-sans">
      {/* MODAL PREVIEW GAMBAR */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 md:p-10 animate-in zoom-in-95 duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative w-full max-w-4xl flex flex-col items-center justify-center">
            <button
              className="absolute -top-4 -right-4 md:-top-6 md:-right-6 bg-white text-slate-500 hover:text-slate-900 w-10 h-10 md:w-12 md:h-12 rounded-full font-bold text-xl z-50 shadow-xl transition-colors flex items-center justify-center"
              onClick={() => setPreviewImage(null)}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
            <img
              src={previewImage}
              alt="Preview Bukti"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain bg-slate-900 border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* HEADER HALAMAN (GOOGLE STYLE) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#E8F0FE] text-[#1A73E8] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest mb-3">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            Validasi Data
          </div>
          <h1 className="text-[28px] font-bold text-slate-800 tracking-tight flex items-center gap-3">
            Verifikasi Aktivitas Lari
            {pendingCount > 0 && (
              <span className="bg-[#D93025] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                {pendingCount} Menunggu
              </span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium max-w-2xl">
            Periksa tangkapan layar aplikasi lari peserta (Strava, Garmin, dll).
            Setujui data yang valid agar masuk ke total pencapaian kilometer
            mereka.
          </p>
        </div>

        {/* TOMBOL BULK ACTION */}
        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            onClick={handleSelectAll}
            className="text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-5 py-2.5 rounded-lg transition-colors shadow-sm flex items-center gap-2"
          >
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSubmissions.length === filteredSubmissions.length && filteredSubmissions.length > 0 ? "bg-[#1A73E8] border-[#1A73E8]" : "border-slate-400"}`}
            >
              {selectedSubmissions.length === filteredSubmissions.length &&
                filteredSubmissions.length > 0 && (
                  <svg
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
            </div>
            Pilih Semua
          </button>

          {selectedSubmissions.length > 0 && (
            <button
              onClick={deleteSelected}
              disabled={loadingAction === "deleteBulk"}
              className="text-sm font-bold text-[#D93025] bg-white border border-rose-200 hover:bg-[#FCE8E6] px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 4V3H9v1H4v2h1v13c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V6h1V4h-5zm2 15H7V6h10v13zM9 8h2v9H9zm4 0h2v9h-2z" />
              </svg>
              {loadingAction === "deleteBulk"
                ? "Menghapus..."
                : `Hapus (${selectedSubmissions.length})`}
            </button>
          )}
        </div>
      </div>

      {/* FILTER TABS (GOOGLE MATERIAL STYLE) */}
      <div className="flex overflow-x-auto gap-2 mb-6 border-b border-slate-200 pb-px hide-scrollbar">
        {["Pending", "Approved", "Rejected", "All"].map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setFilter(tab as any);
              setSelectedSubmissions([]); // Reset pilihan saat pindah tab
            }}
            className={`px-5 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
              filter === tab
                ? "border-[#1A73E8] text-[#1A73E8]"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {tab === "Pending" && `Menunggu (${pendingCount})`}
            {tab === "Approved" && "Disetujui"}
            {tab === "Rejected" && "Ditolak"}
            {tab === "All" && "Semua Data"}
          </button>
        ))}
      </div>

      {/* AREA DATA */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 text-center shadow-sm flex flex-col items-center">
          <svg
            className="w-16 h-16 text-slate-300 mb-4"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M19 3H4.99c-1.11 0-1.98.89-1.98 2L3 19c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z" />
          </svg>
          <p className="text-lg font-bold text-slate-800">Tidak ada data</p>
          <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
            Belum ada bukti lari dengan status{" "}
            <b>
              {filter === "Pending"
                ? "Menunggu"
                : filter === "Approved"
                  ? "Disetujui"
                  : filter === "Rejected"
                    ? "Ditolak"
                    : "Semua"}
            </b>{" "}
            saat ini.
          </p>
        </div>
      ) : (
        /* GRID DATA LARI */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSubmissions.map((sub) => (
            <div
              key={sub.id}
              className={`bg-white rounded-xl overflow-hidden shadow-sm border flex flex-col relative transition-all duration-300 hover:shadow-md ${
                selectedSubmissions.includes(sub.id)
                  ? "border-[#1A73E8] bg-[#E8F0FE]/30"
                  : "border-slate-200"
              }`}
            >
              {/* Checkbox Overlay */}
              <div className="absolute top-4 left-4 z-20">
                <div
                  onClick={() => toggleSelectSubmission(sub.id)}
                  className={`w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors shadow-sm ${selectedSubmissions.includes(sub.id) ? "bg-[#1A73E8] border-[#1A73E8]" : "bg-white border-slate-400"}`}
                >
                  {selectedSubmissions.includes(sub.id) && (
                    <svg
                      className="w-3.5 h-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>

              {/* Status Lencana Kanan Atas */}
              <div className="absolute top-4 right-4 z-10">
                {sub.status === "Pending" && (
                  <span className="bg-[#FEF7E0]/90 text-[#B08D00] text-[10px] font-bold px-2.5 py-1 rounded shadow-sm uppercase tracking-wider backdrop-blur-sm border border-[#F9AB00]/20">
                    Menunggu
                  </span>
                )}
                {sub.status === "Approved" && (
                  <span className="bg-[#E6F4EA]/90 text-[#1E8E3E] text-[10px] font-bold px-2.5 py-1 rounded shadow-sm uppercase tracking-wider backdrop-blur-sm border border-[#1E8E3E]/20">
                    Disetujui
                  </span>
                )}
                {sub.status === "Rejected" && (
                  <span className="bg-[#FCE8E6]/90 text-[#D93025] text-[10px] font-bold px-2.5 py-1 rounded shadow-sm uppercase tracking-wider backdrop-blur-sm border border-[#D93025]/20">
                    Ditolak
                  </span>
                )}
              </div>

              {/* Gambar / Bukti Lari */}
              <div
                className="w-full h-48 sm:h-52 bg-slate-100 cursor-pointer overflow-hidden relative group"
                onClick={() => setPreviewImage(sub.imgUrl)}
              >
                <div className="absolute inset-0 bg-slate-900/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-[1px]">
                  <span className="text-white text-xs font-bold bg-slate-900/60 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                    </svg>
                    Perbesar
                  </span>
                </div>
                <img
                  src={sub.imgUrl}
                  alt="Bukti Lari"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Detail Konten */}
              <div className="p-4 flex-grow flex flex-col">
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                    Nama Peserta
                  </p>
                  <p className="font-bold text-slate-800 text-[15px] line-clamp-1">
                    {sub.nama}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
                  <div className="bg-[#E8F0FE] p-2.5 rounded-lg border border-blue-100">
                    <p className="text-[9px] text-[#1A73E8] font-bold uppercase tracking-wider mb-0.5">
                      Jarak
                    </p>
                    <p className="text-lg font-bold text-[#1A73E8]">
                      {sub.jarakKm} <span className="text-xs">KM</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">
                      Durasi
                    </p>
                    <p className="text-base font-bold text-slate-700">
                      {sub.durasi}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 mb-4">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
                  </svg>
                  {new Date(sub.tanggalLari).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                {/* Tombol Aksi CRUD (Hanya Aktif jika Pending) */}
                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() =>
                      handleVerifikasiLari(sub.id, "Rejected", sub.nama)
                    }
                    disabled={
                      loadingAction === sub.id || sub.status !== "Pending"
                    }
                    className={`flex-1 font-bold py-2 rounded-lg text-xs transition-colors flex justify-center items-center gap-1.5 ${sub.status === "Pending" ? "bg-white border border-slate-200 text-[#D93025] hover:bg-[#FCE8E6] hover:border-[#D93025]" : "bg-slate-50 text-slate-300 border border-slate-100 cursor-not-allowed"}`}
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() =>
                      handleVerifikasiLari(sub.id, "Approved", sub.nama)
                    }
                    disabled={
                      loadingAction === sub.id || sub.status !== "Pending"
                    }
                    className={`flex-1 font-bold py-2 rounded-lg text-xs transition-colors shadow-sm flex justify-center items-center gap-1.5 ${sub.status === "Pending" ? "bg-[#1A73E8] text-white hover:bg-[#1557B0]" : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"}`}
                  >
                    {loadingAction === sub.id ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      "Setujui"
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
