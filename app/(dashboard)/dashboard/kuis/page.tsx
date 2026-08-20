"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { toast } from "@/lib/toast";
import Link from "next/link";

export default function KuisPage() {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizForm, setQuizForm] = useState({ 
    judul: "", 
    deskripsi: "",
    kategori: "Umum", 
    jmlSoal: 10, 
    durasi: 15, // dalam menit
    reward: 100,
    status: "Draft" 
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "kuis"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuizzes(data);
    } catch {
      toast.error("Gagal mengambil data kuis");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm.judul) return;
    setIsSaving(true);
    try {
      await addDoc(collection(db, "kuis"), {
        ...quizForm,
        createdAt: new Date().toISOString()
      });
      toast.success("Kuis berhasil ditambahkan");
      setQuizForm({ judul: "", deskripsi: "", kategori: "Umum", jmlSoal: 10, durasi: 15, reward: 100, status: "Draft" });
      fetchQuizzes();
    } catch {
      toast.error("Gagal menambah kuis");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kuis ini? Semua data terkait kuis ini akan hilang.")) return;
    try {
      await deleteDoc(doc(db, "kuis", id));
      toast.success("Kuis berhasil dihapus");
      fetchQuizzes();
    } catch {
      toast.error("Gagal menghapus kuis");
    }
  };

  return (
    <div className="min-h-screen pb-12 font-sans text-slate-800 p-6 sm:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        <div className="mb-8 border-b border-slate-200 pb-5">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest border border-blue-200 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Tantangan & Evaluasi
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manajemen Kuis</h1>
          <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">
            Kelola tantangan kuis untuk mengasah pengetahuan, mengukur kompetensi, dan memberikan *reward* Coin IKA kepada anggota di aplikasi seluler.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Tambah */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm sticky top-6">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Buat Kuis Baru
              </h2>
              <form onSubmit={handleAddQuiz} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Judul Kuis <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    type="text" 
                    value={quizForm.judul} 
                    onChange={(e) => setQuizForm({...quizForm, judul: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-slate-400 font-medium" 
                    placeholder="Contoh: Kuis Sejarah UII Edisi 1" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Deskripsi Singkat</label>
                  <textarea 
                    rows={2}
                    value={quizForm.deskripsi} 
                    onChange={(e) => setQuizForm({...quizForm, deskripsi: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-slate-400 resize-none" 
                    placeholder="Tuliskan tujuan atau aturan kuis..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Kategori</label>
                    <select
                      required 
                      value={quizForm.kategori} 
                      onChange={(e) => setQuizForm({...quizForm, kategori: e.target.value})} 
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium" 
                    >
                      <option value="Umum">Umum</option>
                      <option value="Sejarah">Sejarah</option>
                      <option value="Organisasi">Organisasi</option>
                      <option value="Keislaman">Keislaman</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Status Kuis</label>
                    <select
                      required 
                      value={quizForm.status} 
                      onChange={(e) => setQuizForm({...quizForm, status: e.target.value})} 
                      className={`w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold ${quizForm.status === 'Aktif' ? 'text-emerald-600' : 'text-amber-500'}`} 
                    >
                      <option value="Draft">Draft (Disembunyikan)</option>
                      <option value="Aktif">Aktif (Ditampilkan)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Jml Soal</label>
                    <input 
                      type="number" 
                      min={1}
                      value={quizForm.jmlSoal} 
                      onChange={(e) => setQuizForm({...quizForm, jmlSoal: Number(e.target.value)})} 
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Durasi (Menit)</label>
                    <input 
                      type="number"
                      min={1} 
                      value={quizForm.durasi} 
                      onChange={(e) => setQuizForm({...quizForm, durasi: Number(e.target.value)})} 
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Reward Coin</label>
                    <input 
                      type="number" 
                      min={0}
                      value={quizForm.reward} 
                      onChange={(e) => setQuizForm({...quizForm, reward: Number(e.target.value)})} 
                      className="w-full border border-slate-200 rounded-xl p-2.5 text-sm text-center focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none font-bold text-orange-600" 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl mt-6 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : "Simpan Kuis"}
                </button>
              </form>
            </div>
          </div>

          {/* List Kuis */}
          <div className="lg:col-span-8">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm">Daftar Repositori Kuis</h3>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">{quizzes.length} Total Kuis</span>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                {loading ? (
                  <div className="flex-1 flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                ) : quizzes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Repositori Kosong</h3>
                    <p className="text-slate-500 mt-1 max-w-sm">Anda belum membuat materi kuis apapun. Buat kuis pertama menggunakan form di sebelah kiri.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {quizzes.map(q => (
                      <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex justify-between items-center transition-all hover:border-blue-300 hover:shadow-[0_4px_20px_-3px_rgba(6,81,237,0.1)] group">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{q.kategori}</span>
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${q.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                              {q.status || "Draft"}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{q.judul}</h3>
                          {q.deskripsi && (
                            <p className="text-sm text-slate-500 line-clamp-1 mb-3">{q.deskripsi}</p>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                              {q.jmlSoal} Soal
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {q.durasi || 15} Menit
                            </span>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-lg">
                              🪙 {q.reward} Coin
                            </span>
                          </div>
                        </div>

                        <div className="pl-6 flex flex-col gap-2 border-l border-slate-100 ml-6">
                          <Link href={`/dashboard/kuis/${q.id}`}
                            className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors border border-transparent hover:border-blue-100 inline-flex items-center justify-center"
                            title="Kelola Soal"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </Link>
                          <button 
                            onClick={() => handleDeleteQuiz(q.id)} 
                            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors border border-transparent hover:border-red-100"
                            title="Hapus Kuis"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
