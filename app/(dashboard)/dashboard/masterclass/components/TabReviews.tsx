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
  query,
  orderBy,
} from "firebase/firestore";

export default function TabReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState("Semua");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Ambil Data Kelas untuk mapping Nama Kelas
      const snapCourses = await getDocs(collection(db, "masterclass_courses"));
      const coursesData = snapCourses.docs.map((d) => ({
        id: d.id,
        judul: d.data().judul,
      }));
      setCourses(coursesData);

      // 2. Ambil Data Ulasan (Reviews)
      const qReviews = query(
        collection(db, "masterclass_reviews"),
        orderBy("createdAt", "desc"),
      );
      const snapReviews = await getDocs(qReviews);
      setReviews(snapReviews.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Gagal memuat data ulasan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    return course ? course.judul : "Kelas Tidak Diketahui / Dihapus";
  };

  const handleToggleStatus = async (
    reviewId: string,
    currentStatus: string,
  ) => {
    const newStatus = currentStatus === "Sembunyi" ? "Tampil" : "Sembunyi";
    if (
      !confirm(
        `Ubah status ulasan ini menjadi "${newStatus}" di halaman publik?`,
      )
    )
      return;

    try {
      await updateDoc(doc(db, "masterclass_reviews", reviewId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
      fetchData();
    } catch (error) {
      toast.error("Gagal memperbarui status ulasan.");
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Hapus permanen ulasan ini dari database?")) return;
    try {
      await deleteDoc(doc(db, "masterclass_reviews", reviewId));
      fetchData();
    } catch (error) {
      toast.error("Gagal menghapus data.");
    }
  };

  const filteredList = reviews.filter((r) => {
    const matchSearch =
      (r.namaPeserta || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.ulasan || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchRating =
      filterRating === "Semua"
        ? true
        : Number(r.rating) === Number(filterRating);
    return matchSearch && matchRating;
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-3.5 h-3.5 ${star <= rating ? "text-yellow-400" : "text-slate-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* HEADER & STATISTIK */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-800 text-lg tracking-tight">
            Rating & Ulasan Kelas
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Moderasi testimoni dari peserta untuk menjaga kualitas platform.
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="bg-slate-50 border border-slate-100 px-5 py-2 rounded-xl text-center flex-1 md:flex-none">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Total Ulasan
            </div>
            <div className="text-lg font-black text-slate-700">
              {reviews.length}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 px-5 py-2 rounded-xl text-center flex-1 md:flex-none">
            <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
              Rata-rata
            </div>
            <div className="text-lg font-black text-blue-700">
              {reviews.length > 0
                ? (
                    reviews.reduce(
                      (acc, curr) => acc + Number(curr.rating || 0),
                      0,
                    ) / reviews.length
                  ).toFixed(1)
                : "0.0"}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Cari isi ulasan atau nama peserta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-2.5 pl-11 pr-4 rounded-xl text-sm font-medium focus:border-blue-500 focus:bg-white outline-none transition-all"
          />
        </div>
        <div className="w-full md:w-48 shrink-0 relative">
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-2.5 px-4 rounded-xl text-sm font-bold text-slate-600 focus:border-blue-500 focus:bg-white outline-none appearance-none cursor-pointer"
          >
            <option value="Semua">Semua Rating</option>
            <option value="5">Bintang 5</option>
            <option value="4">Bintang 4</option>
            <option value="3">Bintang 3</option>
            <option value="2">Bintang 2</option>
            <option value="1">Bintang 1</option>
          </select>
        </div>
      </div>

      {/* TABEL LIST ULASAN */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                <th className="px-6 py-5">Peserta</th>
                <th className="px-4 py-5 w-48">Kelas</th>
                <th className="px-4 py-5">Isi Ulasan & Rating</th>
                <th className="px-4 py-5 text-center">Visibilitas</th>
                <th className="px-6 py-5 text-right w-32">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-20 text-center text-slate-400 font-bold tracking-widest"
                  >
                    MEMUAT ULASAN...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-20 text-center text-slate-400 font-medium"
                  >
                    Belum ada ulasan yang sesuai kriteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((r) => (
                  <tr
                    key={r.id}
                    className={`hover:bg-slate-50/80 transition-colors ${r.status === "Sembunyi" ? "bg-amber-50/30 opacity-70" : ""}`}
                  >
                    {/* Peserta */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200 shrink-0">
                          {(r.namaPeserta || "A").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">
                            {r.namaPeserta}
                          </h4>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            {r.createdAt?.seconds
                              ? new Date(
                                  r.createdAt.seconds * 1000,
                                ).toLocaleDateString("id-ID")
                              : "Baru saja"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kelas */}
                    <td className="px-4 py-5 align-top">
                      <div className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block line-clamp-2 border border-blue-100 leading-relaxed">
                        {getCourseName(r.courseId)}
                      </div>
                    </td>

                    {/* Ulasan & Rating */}
                    <td className="px-4 py-5 align-top max-w-sm">
                      <div className="mb-2">
                        {renderStars(Number(r.rating || 0))}
                      </div>
                      <p
                        className="text-sm text-slate-600 leading-relaxed italic line-clamp-3"
                        title={r.ulasan}
                      >
                        "{r.ulasan}"
                      </p>
                    </td>

                    {/* Visibilitas (Status) */}
                    <td className="px-4 py-5 align-top text-center">
                      <span
                        className={`text-[9px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider ${r.status === "Sembunyi" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}
                      >
                        {r.status === "Sembunyi" ? "HIDDEN" : "TAMPIL"}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-6 py-5 align-top">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() =>
                            handleToggleStatus(r.id, r.status || "Tampil")
                          }
                          title={
                            r.status === "Sembunyi"
                              ? "Tampilkan Publik"
                              : "Sembunyikan"
                          }
                          className={`p-2 rounded-lg transition-colors border ${r.status === "Sembunyi" ? "text-emerald-600 hover:bg-emerald-50 border-transparent hover:border-emerald-200" : "text-amber-600 hover:bg-amber-50 border-transparent hover:border-amber-200"}`}
                        >
                          {r.status === "Sembunyi" ? (
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          ) : (
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
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a9.953 9.953 0 013.37-1.55m1.5-1.5a10.05 10.05 0 013.37 1.55m0 0l3.29 3.29m0 0a9.97 9.97 0 011.563 3.029c-.115.366-.245.72-.39 1.05"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          title="Hapus Ulasan"
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
