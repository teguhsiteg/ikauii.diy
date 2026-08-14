"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";

export default function ModuleManagementPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // State Form
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);

  // 🔥 STATE BARU: DITAMBAHKAN BAB, TIPE, DAN SOAL UJIAN 🔥
  const [formData, setFormData] = useState({
    urutan: "",
    bab: "",
    judul: "",
    tipe: "video", // 'video' | 'pdf' | 'ujian'
    deskripsi: "",
    videoUrl: "",
    dokumenUrl: "",
    durasiUjian: 15,
    kkm: 70,
    soalUjian: [] as any[],
  });

  useEffect(() => {
    fetchCourseAndModules();
  }, [courseId]);

  const fetchCourseAndModules = async () => {
    setIsLoading(true);
    try {
      const cDoc = await getDoc(doc(db, "masterclass_courses", courseId));
      if (!cDoc.exists()) {
        toast.error("Kelas tidak ditemukan!");
        router.push("/dashboard");
        return;
      }
      setCourse({ id: cDoc.id, ...cDoc.data() });

      const q = query(
        collection(db, "masterclass_modules"),
        where("courseId", "==", courseId),
      );
      const mSnap = await getDocs(q);

      const fetchedModules = mSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => Number(a.urutan) - Number(b.urutan));

      setModules(fetchedModules);

      if (!editId && viewMode === "list") {
        setFormData((prev) => ({
          ...prev,
          urutan: String(fetchedModules.length + 1),
        }));
      }
    } catch (error) {
      console.error("Error fetching modules:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // Validasi Khusus Ujian
      if (formData.tipe === "ujian" && formData.soalUjian.length === 0) {
        toast.warning("Modul Ujian minimal harus memiliki 1 Soal!");
        setIsProcessing(false);
        return;
      }

      const payload = {
        ...formData,
        urutan: Number(formData.urutan),
        courseId: courseId,
        updatedAt: serverTimestamp(),
      };

      if (editId) {
        await updateDoc(doc(db, "masterclass_modules", editId), payload);
      } else {
        await addDoc(collection(db, "masterclass_modules"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      await fetchCourseAndModules();
      setViewMode("list");
      setEditId(null);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan modul.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      urutan: String(modules.length + 1),
      bab: "",
      judul: "",
      tipe: "video",
      deskripsi: "",
      videoUrl: "",
      dokumenUrl: "",
      durasiUjian: 15,
      kkm: 70,
      soalUjian: [],
    });
  };

  // 🔥 FUNGSI BUILDER SOAL UJIAN 🔥
  const addSoal = () => {
    setFormData((prev) => ({
      ...prev,
      soalUjian: [
        ...prev.soalUjian,
        {
          pertanyaan: "",
          opsiA: "",
          opsiB: "",
          opsiC: "",
          opsiD: "",
          jawabanBenar: "A",
        },
      ],
    }));
  };

  const updateSoal = (index: number, field: string, value: string) => {
    const newSoal = [...formData.soalUjian];
    newSoal[index][field] = value;
    setFormData({ ...formData, soalUjian: newSoal });
  };

  const removeSoal = (index: number) => {
    const newSoal = formData.soalUjian.filter((_, i) => i !== index);
    setFormData({ ...formData, soalUjian: newSoal });
  };

  // 🔥 KELOMPOKKAN MODUL BERDASARKAN BAB 🔥
  const groupedModules = modules.reduce(
    (acc, mod) => {
      const namaBab = mod.bab || "Tanpa Bab";
      if (!acc[namaBab]) acc[namaBab] = [];
      acc[namaBab].push(mod);
      return acc;
    },
    {} as Record<string, any[]>,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0056D2] rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-sm text-slate-500 uppercase tracking-widest">
          Memuat Silabus...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] font-sans text-slate-800 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* HEADER & KEMBALI */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0056D2] transition-colors mb-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm w-fit"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Kembali ke Katalog
          </button>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0">
              {course?.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400">
                  No Img
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#0056D2] uppercase tracking-widest mb-1">
                Manajemen Kurikulum & Silabus
              </p>
              <h1 className="text-xl font-black text-slate-900 leading-tight">
                {course?.judul}
              </h1>
            </div>
          </div>
        </div>

        {viewMode === "list" ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800">
                Daftar Modul ({modules.length})
              </h3>
              <button
                onClick={() => {
                  setEditId(null);
                  resetForm();
                  setViewMode("form");
                }}
                className="bg-[#0056D2] hover:bg-[#00419E] text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                + Tambah Modul Baru
              </button>
            </div>

            <div className="p-6">
              {modules.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm flex flex-col items-center">
                  <svg
                    className="w-12 h-12 mb-3 text-slate-300"
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
                  Belum ada silabus kurikulum untuk kelas ini.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedModules).map((babName, bIdx) => (
                    <div
                      key={bIdx}
                      className="border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                        <h3 className="font-black text-slate-800 uppercase tracking-wide text-sm">
                          {babName}
                        </h3>
                        <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                          {groupedModules[babName].length} Item
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {groupedModules[babName].map((mod: any) => (
                          <div
                            key={mod.id}
                            className="p-5 hover:bg-slate-50 transition-colors flex items-start gap-4"
                          >
                            <div className="w-10 h-10 bg-blue-50 text-[#0056D2] rounded-lg border border-blue-100 flex items-center justify-center font-black shrink-0 mt-1">
                              {mod.urutan}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-slate-900 text-base mb-1">
                                {mod.judul}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
                                {mod.deskripsi || (
                                  <span className="italic text-slate-300">
                                    Tidak ada deskripsi
                                  </span>
                                )}
                              </p>

                              <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                {/* Badge Tipe Konten */}
                                {mod.tipe === "ujian" ? (
                                  <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                    📝 Ujian/Kuis ({mod.soalUjian?.length || 0}{" "}
                                    Soal)
                                  </span>
                                ) : mod.tipe === "pdf" ? (
                                  <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                    📄 Dokumen PDF
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                    ▶️ Video Belajar
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setEditId(mod.id);
                                  setFormData({
                                    ...resetForm,
                                    ...mod,
                                    tipe: mod.tipe || "video",
                                  });
                                  setViewMode("form");
                                }}
                                className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
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
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Hapus modul "${mod.judul}"?`)) {
                                    await deleteDoc(
                                      doc(db, "masterclass_modules", mod.id),
                                    );
                                    fetchCourseAndModules();
                                  }
                                }}
                                className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100 transition-colors"
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
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm"
          >
            <h3 className="text-lg font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">
              {editId ? "Update Data Modul" : "Tambah Modul Baru"}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* BARIS 1: URUTAN & BAB */}
              <div className="md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Urutan
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  value={formData.urutan}
                  onChange={(e) =>
                    setFormData({ ...formData, urutan: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-black text-[#0056D2] text-center outline-none focus:border-blue-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Kategori Bab / Topik
                </label>
                <input
                  required
                  type="text"
                  value={formData.bab}
                  onChange={(e) =>
                    setFormData({ ...formData, bab: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                  placeholder="Contoh: Bab 1 - Pendahuluan"
                />
              </div>

              {/* BARIS 2: JUDUL & TIPE */}
              <div className="md:col-span-3">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Judul Sesi / Modul
                </label>
                <input
                  required
                  type="text"
                  value={formData.judul}
                  onChange={(e) =>
                    setFormData({ ...formData, judul: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500"
                  placeholder="Contoh: Cara Instalasi Next.js"
                />
              </div>
              <div className="md:col-span-1">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Tipe Konten
                </label>
                <select
                  value={formData.tipe}
                  onChange={(e) =>
                    setFormData({ ...formData, tipe: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="video">▶️ Video</option>
                  <option value="pdf">📄 PDF Dokumen</option>
                  <option value="ujian">📝 Ujian / Quiz</option>
                </select>
              </div>

              {/* BARIS 3: DESKRIPSI */}
              <div className="md:col-span-4">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                  Deskripsi & Catatan Modul
                </label>
                <textarea
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none resize-none focus:border-blue-500"
                  placeholder="Penjelasan singkat atau instruksi pengerjaan..."
                ></textarea>
              </div>

              {/* 🔥 KONDISIONAL RENDER BERDASARKAN TIPE KONTEN 🔥 */}
              {formData.tipe === "video" && (
                <div className="md:col-span-4 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                  <label className="block text-[11px] font-bold text-blue-600 uppercase tracking-widest mb-1.5 ml-1">
                    URL Video Pembelajaran (YouTube)
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500 mb-3"
                    placeholder="https://youtube.com/watch?v=..."
                  />

                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                    URL Lampiran (Opsional)
                  </label>
                  <input
                    type="url"
                    value={formData.dokumenUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, dokumenUrl: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-blue-500"
                    placeholder="Link GDrive PDF..."
                  />
                </div>
              )}

              {formData.tipe === "pdf" && (
                <div className="md:col-span-4 bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                  <label className="block text-[11px] font-bold text-indigo-600 uppercase tracking-widest mb-1.5 ml-1">
                    URL Dokumen Utama (G-Drive / PDF Link)
                  </label>
                  <input
                    required
                    type="url"
                    value={formData.dokumenUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, dokumenUrl: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm outline-none focus:border-indigo-500"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              )}

              {formData.tipe === "ujian" && (
                <div className="md:col-span-4 border-t border-slate-200 pt-6">
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <span className="text-xl">📝</span>
                      <div>
                        <h3 className="font-black text-rose-900">
                          Quiz / Ujian Builder
                        </h3>
                        <p className="text-xs font-medium text-rose-700">
                          Buat soal pilihan ganda untuk modul ini.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div>
                        <label className="block text-[10px] font-bold text-rose-800 uppercase tracking-widest mb-1">
                          Waktu Ujian (Menit)
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={formData.durasiUjian}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              durasiUjian: Number(e.target.value),
                            })
                          }
                          className="w-full bg-white border border-rose-200 px-4 py-2 rounded-lg text-sm font-bold text-center outline-none focus:border-rose-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-rose-800 uppercase tracking-widest mb-1">
                          Nilai Lulus Minimal (KKM)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={formData.kkm}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              kkm: Number(e.target.value),
                            })
                          }
                          className="w-full bg-white border border-rose-200 px-4 py-2 rounded-lg text-sm font-bold text-center outline-none focus:border-rose-500"
                        />
                      </div>
                    </div>

                    {/* LIST SOAL */}
                    <div className="space-y-4">
                      {formData.soalUjian.map((soal, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-white p-5 rounded-xl border border-rose-200 shadow-sm relative"
                        >
                          <div className="absolute top-3 right-3">
                            <button
                              type="button"
                              onClick={() => removeSoal(sIdx)}
                              className="text-rose-400 hover:text-rose-600 text-xs font-bold"
                            >
                              Hapus Soal
                            </button>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 mb-3 bg-slate-100 w-fit px-2 py-1 rounded">
                            SOAL #{sIdx + 1}
                          </h4>

                          <textarea
                            required
                            rows={2}
                            value={soal.pertanyaan}
                            onChange={(e) =>
                              updateSoal(sIdx, "pertanyaan", e.target.value)
                            }
                            className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm outline-none mb-4"
                            placeholder="Tulis pertanyaan di sini..."
                          ></textarea>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            <div className="flex gap-2">
                              <span className="bg-slate-100 font-black text-slate-500 px-3 py-2 rounded-lg border border-slate-200">
                                A
                              </span>
                              <input
                                required
                                type="text"
                                value={soal.opsiA}
                                onChange={(e) =>
                                  updateSoal(sIdx, "opsiA", e.target.value)
                                }
                                className="flex-1 border border-slate-200 px-3 py-2 rounded-lg text-sm"
                                placeholder="Opsi A"
                              />
                            </div>
                            <div className="flex gap-2">
                              <span className="bg-slate-100 font-black text-slate-500 px-3 py-2 rounded-lg border border-slate-200">
                                B
                              </span>
                              <input
                                required
                                type="text"
                                value={soal.opsiB}
                                onChange={(e) =>
                                  updateSoal(sIdx, "opsiB", e.target.value)
                                }
                                className="flex-1 border border-slate-200 px-3 py-2 rounded-lg text-sm"
                                placeholder="Opsi B"
                              />
                            </div>
                            <div className="flex gap-2">
                              <span className="bg-slate-100 font-black text-slate-500 px-3 py-2 rounded-lg border border-slate-200">
                                C
                              </span>
                              <input
                                required
                                type="text"
                                value={soal.opsiC}
                                onChange={(e) =>
                                  updateSoal(sIdx, "opsiC", e.target.value)
                                }
                                className="flex-1 border border-slate-200 px-3 py-2 rounded-lg text-sm"
                                placeholder="Opsi C"
                              />
                            </div>
                            <div className="flex gap-2">
                              <span className="bg-slate-100 font-black text-slate-500 px-3 py-2 rounded-lg border border-slate-200">
                                D
                              </span>
                              <input
                                required
                                type="text"
                                value={soal.opsiD}
                                onChange={(e) =>
                                  updateSoal(sIdx, "opsiD", e.target.value)
                                }
                                className="flex-1 border border-slate-200 px-3 py-2 rounded-lg text-sm"
                                placeholder="Opsi D"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                            <span className="text-xs font-black text-emerald-800">
                              KUNCI JAWABAN BENAR:
                            </span>
                            <select
                              value={soal.jawabanBenar}
                              onChange={(e) =>
                                updateSoal(sIdx, "jawabanBenar", e.target.value)
                              }
                              className="bg-white border border-emerald-200 px-3 py-1.5 rounded text-sm font-bold text-emerald-700 outline-none"
                            >
                              <option value="A">Opsi A</option>
                              <option value="B">Opsi B</option>
                              <option value="C">Opsi C</option>
                              <option value="D">Opsi D</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addSoal}
                      className="w-full mt-4 py-3 border-2 border-dashed border-rose-300 text-rose-600 font-black text-sm rounded-xl hover:bg-rose-100 transition-colors"
                    >
                      + Tambah Soal Pilihan Ganda
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-6 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                disabled={isProcessing}
                type="submit"
                className="px-8 py-2.5 text-sm font-bold text-white bg-[#0056D2] hover:bg-[#00419E] rounded-xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                {isProcessing ? "Menyimpan..." : "Simpan Modul"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
