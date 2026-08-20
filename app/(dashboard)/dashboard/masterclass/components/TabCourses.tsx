"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import Link from "next/link";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export default function TabCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const [editId, setEditId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    judul: "",
    tipeKelas: "Video on Demand",
    kategori: "Bisnis & Kepemimpinan",
    kategoriLainnya: "",
    tipeHarga: "Gratis",
    harga: "",
    pajak: "11",
    isTrial: false,
    trialDays: "",
    mentorId: "",
    deskripsi: "",
    thumbnailUrl: "",
    status: "Draft",
  });

  const KATEGORI_LIST = [
    "Bisnis & Kepemimpinan",
    "Teknologi & Data",
    "Pengembangan Karir",
    "Kewirausahaan",
    "Lainnya",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const snapCourses = await getDocs(
        query(
          collection(db, "masterclass_courses"),
          orderBy("createdAt", "desc"),
        ),
      );
      setCourses(snapCourses.docs.map((d) => ({ id: d.id, ...d.data() })));
      const snapMentors = await getDocs(
        query(collection(db, "masterclass_mentors")),
      );
      setMentors(
        snapMentors.docs.map((d) => ({
          id: d.id,
          nama: d.data().nama,
          gelar: d.data().gelar,
        })),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const finalKategori =
        formData.kategori === "Lainnya"
          ? formData.kategoriLainnya
          : formData.kategori;
      const nominalHarga =
        formData.tipeHarga === "Gratis" ? 0 : Number(formData.harga);
      const persentasePajak =
        formData.tipeHarga === "Gratis" ? 0 : Number(formData.pajak);
      const totalHarga = nominalHarga + (nominalHarga * persentasePajak) / 100;

      const payload = {
        ...formData,
        kategori: finalKategori,
        harga: nominalHarga,
        pajak: persentasePajak,
        totalHarga: totalHarga,
        trialDays: formData.isTrial ? Number(formData.trialDays) : 0,
        updatedAt: serverTimestamp(),
      };

      if (editId)
        await updateDoc(doc(db, "masterclass_courses", editId), payload);
      else
        await addDoc(collection(db, "masterclass_courses"), {
          ...payload,
          createdAt: serverTimestamp(),
        });

      fetchData();
      setViewMode("list");
      setEditId(null);
      // Reset form
      setFormData({
        judul: "",
        tipeKelas: "Video on Demand",
        kategori: "Bisnis & Kepemimpinan",
        kategoriLainnya: "",
        tipeHarga: "Gratis",
        harga: "",
        pajak: "11",
        isTrial: false,
        trialDays: "",
        mentorId: "",
        deskripsi: "",
        thumbnailUrl: "",
        status: "Draft",
      });
    } catch {
      toast.error("Gagal menyimpan data kelas");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {viewMode === "list" ? (
        <>
          <div className="flex justify-between items-center bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-lg tracking-tight">
                Katalog Kelas Masterclass
              </h3>
            </div>
            <button
              onClick={() => {
                setEditId(null);
                setViewMode("form");
              }}
              className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all"
            >
              + Buat Kelas Baru
            </button>
          </div>

          {/* 🔥 UBAH JADI TABEL MEMANJANG KE BAWAH 🔥 */}
          <div className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Informasi Kelas</th>
                    <th className="px-6 py-4">Kategori & Format</th>
                    <th className="px-6 py-4">Harga / Akses</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-slate-400"
                      >
                        Memuat data kelas...
                      </td>
                    </tr>
                  ) : courses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-slate-400"
                      >
                        Belum ada kelas. Silakan buat kelas baru.
                      </td>
                    </tr>
                  ) : (
                    courses.map((c) => (
                      <tr
                        key={c.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4 w-[300px]">
                            <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                              {c.thumbnailUrl ? (
                                <img
                                  src={c.thumbnailUrl}
                                  alt={c.judul}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                                  No Img
                                </div>
                              )}
                            </div>
                            <div>
                              <h4
                                className="font-bold text-slate-900 leading-snug line-clamp-2"
                                title={c.judul}
                              >
                                {c.judul}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                ID: {c.id.substring(0, 8)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">
                            {c.kategori}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                            {c.tipeKelas}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div
                            className={`font-black ${c.tipeHarga === "Gratis" ? "text-emerald-600" : "text-blue-600"}`}
                          >
                            {c.tipeHarga === "Gratis"
                              ? "GRATIS"
                              : `Rp ${(c.totalHarga || 0).toLocaleString("id-ID")}`}
                          </div>
                          {c.isTrial && (
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">
                              TRIAL {c.trialDays} HARI
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest ${c.status === "Published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* 🔥 UBAH BUTTON JADI LINK KE HALAMAN PUBLIK 🔥 */}
                            <Link
                              href={`/masterclass/${c.id}`}
                              target="_blank"
                              className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:text-[#0056D2] hover:bg-blue-50 flex items-center justify-center border border-slate-200 transition-colors"
                              title="Preview Kelas (Buka di Tab Baru)"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>

                            <Link
                              href={`/dashboard/masterclass/${c.id}/modules`}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-emerald-200"
                            >
                              Modul
                            </Link>
                            <button
                              onClick={() => {
                                setEditId(c.id);
                                setFormData(c);
                                setViewMode("form");
                              }}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-transparent hover:border-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Hapus kelas ini? Tindakan ini tidak bisa dibatalkan.",
                                  )
                                ) {
                                  await deleteDoc(
                                    doc(db, "masterclass_courses", c.id),
                                  );
                                  fetchData();
                                }
                              }}
                              className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
                            >
                              X
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
        </>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-[2rem] border border-slate-200 p-8 max-w-3xl mx-auto shadow-sm"
        >
          <h3 className="text-xl font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">
            {editId ? "Edit Kurikulum Kelas" : "Buat Kelas Masterclass Baru"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Judul Kelas
              </label>
              <input
                required
                type="text"
                value={formData.judul}
                onChange={(e) =>
                  setFormData({ ...formData, judul: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Kategori
              </label>
              <select
                required
                value={formData.kategori}
                onChange={(e) =>
                  setFormData({ ...formData, kategori: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none cursor-pointer mb-2"
              >
                {KATEGORI_LIST.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
              {formData.kategori === "Lainnya" && (
                <input
                  required
                  type="text"
                  placeholder="Ketik kategori..."
                  value={formData.kategoriLainnya}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kategoriLainnya: e.target.value,
                    })
                  }
                  className="w-full bg-blue-50 border border-blue-200 px-4 py-2.5 rounded-xl text-sm outline-none"
                />
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Pilih Mentor Pakar
              </label>
              <select
                required
                value={formData.mentorId}
                onChange={(e) =>
                  setFormData({ ...formData, mentorId: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none cursor-pointer"
              >
                <option value="" disabled>
                  -- Pilih Mentor --
                </option>
                {mentors.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 bg-slate-50 p-5 rounded-2xl border border-slate-200">
              <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3">
                Pengaturan Harga & Akses
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                  required
                  value={formData.tipeHarga}
                  onChange={(e) =>
                    setFormData({ ...formData, tipeHarga: e.target.value })
                  }
                  className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="Gratis">Akses Gratis</option>
                  <option value="Premium">Premium Berbayar</option>
                </select>

                {formData.tipeHarga === "Premium" && (
                  <>
                    <input
                      required
                      type="number"
                      placeholder="Nominal (Rp)"
                      value={formData.harga}
                      onChange={(e) =>
                        setFormData({ ...formData, harga: e.target.value })
                      }
                      className="bg-white border-2 border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-black text-emerald-700 outline-none"
                    />
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl">
                      <span className="text-xs font-bold text-slate-500">
                        Pajak %
                      </span>
                      <input
                        required
                        type="number"
                        value={formData.pajak}
                        onChange={(e) =>
                          setFormData({ ...formData, pajak: e.target.value })
                        }
                        className="w-full text-sm font-bold outline-none bg-transparent"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrial}
                    onChange={(e) =>
                      setFormData({ ...formData, isTrial: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    Aktifkan Free Trial
                  </span>
                </label>
                {formData.isTrial && (
                  <div className="flex items-center gap-2">
                    <input
                      required
                      type="number"
                      placeholder="Berapa hari?"
                      value={formData.trialDays}
                      onChange={(e) =>
                        setFormData({ ...formData, trialDays: e.target.value })
                      }
                      className="w-24 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm outline-none"
                    />
                    <span className="text-xs font-medium text-slate-500">
                      Hari
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Format Kelas
              </label>
              <select
                required
                value={formData.tipeKelas}
                onChange={(e) =>
                  setFormData({ ...formData, tipeKelas: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none cursor-pointer"
              >
                <option value="Video on Demand">Video on Demand</option>
                <option value="Live Webinar">Live Webinar</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Status Publikasi
              </label>
              <select
                required
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none cursor-pointer"
              >
                <option value="Draft">Draft (Disembunyikan)</option>
                <option value="Published">Published (Publik)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                URL Cover / Thumbnail
              </label>
              <input
                type="url"
                value={formData.thumbnailUrl}
                onChange={(e) =>
                  setFormData({ ...formData, thumbnailUrl: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Deskripsi Singkat
              </label>
              <textarea
                rows={3}
                required
                value={formData.deskripsi}
                onChange={(e) =>
                  setFormData({ ...formData, deskripsi: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none resize-none"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="px-6 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 rounded-xl"
            >
              Batal
            </button>
            <button
              disabled={isProcessing}
              type="submit"
              className="px-8 py-2.5 text-sm font-bold text-white bg-[#1A73E8] rounded-xl disabled:opacity-50"
            >
              Simpan Kelas
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
