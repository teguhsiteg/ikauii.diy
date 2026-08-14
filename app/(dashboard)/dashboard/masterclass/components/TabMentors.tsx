"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
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

export default function TabMentors() {
  const [mentors, setMentors] = useState<any[]>([]);
  const [coursesCount, setCoursesCount] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [viewMode, setViewMode] = useState("list");
  const [editId, setEditId] = useState<string | null>(null);

  // State untuk Pop-up Preview Mentor
  const [previewMentor, setPreviewMentor] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    nama: "",
    gelar: "",
    jabatan: "",
    perusahaan: "",
    bio: "",
    fotoUrl: "",
    fotoPosition: "object-center",
    linkedIn: "",
    tarif: "",
    ttdUrl: "", // 🔥 TAMBAHAN STATE UNTUK TTD 🔥
  });

  useEffect(() => {
    fetchMentorsAndStats();
  }, []);

  const fetchMentorsAndStats = async () => {
    setIsLoading(true);
    try {
      // 1. Tarik Data Mentor
      const q = query(
        collection(db, "masterclass_mentors"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      const mentorData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMentors(mentorData);

      // 2. Tarik Data Kelas untuk Menghitung Total Kelas Tiap Mentor
      const coursesSnap = await getDocs(collection(db, "masterclass_courses"));
      const counts: Record<string, number> = {};

      coursesSnap.forEach((doc) => {
        const data = doc.data();
        if (data.mentorId) {
          counts[data.mentorId] = (counts[data.mentorId] || 0) + 1;
        }
      });
      setCoursesCount(counts);
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
      const payload = { ...formData, tarif: Number(formData.tarif) || 0 };
      if (editId) {
        await updateDoc(doc(db, "masterclass_mentors", editId), {
          ...payload,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "masterclass_mentors"), {
          ...payload,
          createdAt: serverTimestamp(),
          rating: 0,
        });
      }
      fetchMentorsAndStats();
      setViewMode("list");
      setFormData({
        nama: "",
        gelar: "",
        jabatan: "",
        perusahaan: "",
        bio: "",
        fotoUrl: "",
        fotoPosition: "object-center",
        linkedIn: "",
        tarif: "",
        ttdUrl: "", // Reset field TTD
      });
      setEditId(null);
    } catch (error) {
      toast.error("Gagal menyimpan data");
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteMentor = async (id: string) => {
    if (confirm("Yakin ingin menghapus mentor ini permanen?")) {
      await deleteDoc(doc(db, "masterclass_mentors", id));
      fetchMentorsAndStats();
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* 🔥 MODAL PREVIEW MENTOR 🔥 */}
      {previewMentor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-[2rem] max-w-md w-full shadow-2xl overflow-hidden relative">
            <button
              onClick={() => setPreviewMentor(null)}
              className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full flex items-center justify-center font-bold transition-colors"
            >
              ✕
            </button>

            <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

            <div className="px-6 pb-8 text-center -mt-12">
              <div className="w-24 h-24 mx-auto rounded-full bg-white p-1 mb-3 shadow-md relative">
                <img
                  src={
                    previewMentor.fotoUrl ||
                    `https://ui-avatars.com/api/?name=${previewMentor.nama}&background=0D8ABC&color=fff`
                  }
                  alt="Mentor"
                  className={`w-full h-full rounded-full object-cover shadow-sm ${previewMentor.fotoPosition || "object-center"}`}
                />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {previewMentor.nama}, {previewMentor.gelar}
              </h3>
              <p className="text-sm font-bold text-blue-600 mb-1">
                {previewMentor.jabatan}
              </p>
              <p className="text-xs text-slate-500 font-medium mb-4">
                {previewMentor.perusahaan}
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 text-left">
                <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-4">
                  "{previewMentor.bio}"
                </p>
              </div>

              {/* 🔥 PREVIEW TANDA TANGAN 🔥 */}
              {previewMentor.ttdUrl && (
                <div className="mb-4 pt-2">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest mb-2">
                    Pratinjau Tanda Tangan (Untuk E-Certificate)
                  </p>
                  <div className="bg-slate-50 rounded-xl p-2 border border-slate-200 border-dashed inline-block">
                    <img
                      src={previewMentor.ttdUrl}
                      alt="TTD Mentor"
                      className="h-12 object-contain mix-blend-multiply"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4 border-t border-slate-100 pt-4 mt-2">
                <div className="text-center">
                  <p className="text-xl font-black text-slate-800">
                    {coursesCount[previewMentor.id] || 0}
                  </p>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                    Total Kelas
                  </p>
                </div>
                <div className="w-px bg-slate-200"></div>
                <div className="text-center">
                  <p className="text-xl font-black text-amber-500">
                    ★ {previewMentor.rating || "5.0"}
                  </p>
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                    Rating
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === "list" ? (
        <>
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 text-lg tracking-tight">
                Database Mentor
              </h3>
            </div>
            <button
              onClick={() => {
                setEditId(null);
                setFormData({
                  nama: "",
                  gelar: "",
                  jabatan: "",
                  perusahaan: "",
                  bio: "",
                  fotoUrl: "",
                  fotoPosition: "object-center",
                  linkedIn: "",
                  tarif: "",
                  ttdUrl: "",
                });
                setViewMode("form");
              }}
              className="bg-[#0056D2] hover:bg-[#00419E] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              + Tambah Mentor
            </button>
          </div>

          {/* LIST COMPACT MENTORS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-10 text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                Memuat data ekspert...
              </div>
            ) : (
              mentors.map((m: any) => (
                <div
                  key={m.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow group"
                >
                  {/* Foto & Info Kiri */}
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 rounded-full bg-slate-100 shrink-0 border border-slate-200 overflow-hidden relative">
                      {m.fotoUrl ? (
                        <img
                          src={m.fotoUrl}
                          className={`w-full h-full object-cover ${m.fotoPosition || "object-center"}`}
                          alt="foto"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-400">
                          M
                        </span>
                      )}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                        {m.nama}{" "}
                        <span className="text-slate-400 font-medium text-xs">
                          {m.gelar}
                        </span>
                        {/* Indikator TTD sudah ada/belum */}
                        {m.ttdUrl && (
                          <svg
                            className="w-3.5 h-3.5 text-emerald-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2.5}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        )}
                      </h4>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">
                        {m.jabatan} • {m.perusahaan}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {coursesCount[m.id] || 0} Kelas
                        </span>
                        {m.linkedIn && (
                          <a
                            href={m.linkedIn}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                            </svg>
                            Profil
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tombol Aksi Kanan */}
                  <div className="flex items-center gap-1.5 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setPreviewMentor(m)}
                      title="Preview"
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
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
                    </button>
                    <button
                      onClick={() => {
                        setEditId(m.id);
                        setFormData(m);
                        setViewMode("form");
                      }}
                      title="Edit"
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors"
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
                    <button
                      onClick={() => deleteMentor(m.id)}
                      title="Hapus"
                      className="w-8 h-8 rounded-lg bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
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
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 max-w-3xl mx-auto shadow-sm"
        >
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-black text-slate-900">
              {editId ? "Update Data Mentor" : "Registrasi Mentor Baru"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Nama Lengkap Tanpa Gelar
              </label>
              <input
                required
                type="text"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-[#0056D2] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Gelar Profesional
              </label>
              <input
                required
                type="text"
                value={formData.gelar}
                onChange={(e) =>
                  setFormData({ ...formData, gelar: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-[#0056D2] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Jabatan Saat Ini
              </label>
              <input
                required
                type="text"
                value={formData.jabatan}
                onChange={(e) =>
                  setFormData({ ...formData, jabatan: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-[#0056D2] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Perusahaan / Instansi
              </label>
              <input
                required
                type="text"
                value={formData.perusahaan}
                onChange={(e) =>
                  setFormData({ ...formData, perusahaan: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-[#0056D2] transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Tarif Kesepakatan (Rp)
              </label>
              <input
                required
                type="number"
                value={formData.tarif}
                onChange={(e) =>
                  setFormData({ ...formData, tarif: e.target.value })
                }
                className="w-full bg-white border-2 border-emerald-200 px-4 py-3 rounded-xl text-sm font-bold text-emerald-700 outline-none focus:border-emerald-500 transition-all"
                placeholder="0"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                URL Profil LinkedIn
              </label>
              <input
                type="url"
                value={formData.linkedIn}
                onChange={(e) =>
                  setFormData({ ...formData, linkedIn: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0056D2] transition-all"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Deskripsi Singkat / Bio Mentor
              </label>
              <textarea
                required
                rows={3}
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:bg-white focus:border-[#0056D2] transition-all resize-none"
                placeholder="Tuliskan latar belakang dan keahlian mentor secara singkat..."
              />
            </div>

            <div className="sm:col-span-2 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-[#0056D2]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Media Profil & Sertifikat
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    URL Foto Profil (Cloudinary)
                  </label>
                  <input
                    required
                    type="url"
                    value={formData.fotoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, fotoUrl: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-[#0056D2] transition-all"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    Posisi Crop Foto
                  </label>
                  <select
                    required
                    value={formData.fotoPosition}
                    onChange={(e) =>
                      setFormData({ ...formData, fotoPosition: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#0056D2] transition-all cursor-pointer"
                  >
                    <option value="object-top">Atas (Kepala)</option>
                    <option value="object-center">Tengah (Default)</option>
                    <option value="object-bottom">Bawah (Badan)</option>
                  </select>
                </div>
              </div>

              {/* 🔥 KOLOM URL TANDA TANGAN 🔥 */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  URL Tanda Tangan Basah (WAJIB: PNG Transparan)
                </label>
                <input
                  type="url"
                  value={formData.ttdUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, ttdUrl: e.target.value })
                  }
                  className="w-full bg-white border border-slate-300 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-[#0056D2] transition-all"
                  placeholder="https://res.cloudinary.com/.../ttd-mentor.png"
                />
                <p className="text-[9px] font-bold text-slate-400 mt-1 ml-1">
                  *Akan digunakan sebagai TTD di e-certificate. Pastikan format
                  PNG tanpa background warna putih.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className="px-6 py-3 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              disabled={isProcessing}
              type="submit"
              className="px-8 py-3 text-sm font-bold text-white bg-[#0056D2] hover:bg-[#00419E] rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              Simpan Profil Mentor
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
