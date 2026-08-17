"use client";

import { useState, useEffect, use } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, getDoc } from "firebase/firestore";
import { toast } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ManajemenSoalKuis({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [quizId, setQuizId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setQuizId(decodeURIComponent(p.id)));
  }, [params]);
  
  const [quizMeta, setQuizMeta] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [form, setForm] = useState({
    pertanyaan: "",
    pilihanA: "",
    pilihanB: "",
    pilihanC: "",
    pilihanD: "",
    jawabanBenar: "A"
  });

  useEffect(() => {
    if (quizId) {
      fetchQuizDetails();
      fetchQuestions();
    }
  }, [quizId]);

  const fetchQuizDetails = async () => {
    if (!quizId) return;
    try {
      const docRef = doc(db, "kuis", quizId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setQuizMeta(docSnap.data());
      } else {
        toast.error("Kuis tidak ditemukan!");
        router.push("/dashboard/kuis");
      }
    } catch (e) {
      toast.error("Gagal memuat detail kuis.");
    }
  };

  const fetchQuestions = async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const q = query(collection(db, `kuis/${quizId}/soal`), orderBy("createdAt", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuestions(data);
    } catch (e) {
      toast.error("Gagal mengambil daftar soal.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.pertanyaan || !form.pilihanA || !form.pilihanB || !form.pilihanC || !form.pilihanD) {
      toast.error("Mohon lengkapi semua isian pertanyaan dan pilihan!");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, `kuis/${quizId}/soal`), {
        ...form,
        createdAt: new Date().toISOString()
      });
      toast.success("Soal berhasil ditambahkan!");
      setForm({ pertanyaan: "", pilihanA: "", pilihanB: "", pilihanC: "", pilihanD: "", jawabanBenar: "A" });
      fetchQuestions();
    } catch (e) {
      toast.error("Gagal menyimpan soal.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (soalId: string) => {
    if (!confirm("Yakin ingin menghapus soal ini?")) return;
    try {
      await deleteDoc(doc(db, `kuis/${quizId}/soal`, soalId));
      toast.success("Soal berhasil dihapus!");
      fetchQuestions();
    } catch (e) {
      toast.error("Gagal menghapus soal.");
    }
  };

  return (
    <div className="min-h-screen pb-12 font-sans text-slate-800 p-6 sm:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        
        {/* Header Breadcrumbs & Info */}
        <div className="mb-8 border-b border-slate-200 pb-5">
          <Link href="/dashboard/kuis" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm font-semibold mb-4 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali ke Manajemen Kuis
          </Link>
          
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            {quizMeta ? `Kelola Soal: ${quizMeta.judul}` : "Memuat Kuis..."}
          </h1>
          {quizMeta && (
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Target: {quizMeta.jmlSoal} Soal
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                Terkumpul: {questions.length} Soal
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Tambah Soal */}
          <div className="lg:col-span-5 space-y-6 sticky top-6">
            <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Tambah Pertanyaan
              </h2>
              
              <form onSubmit={handleAddQuestion} className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Pertanyaan <span className="text-red-500">*</span></label>
                  <textarea 
                    required 
                    rows={3}
                    value={form.pertanyaan} 
                    onChange={(e) => setForm({...form, pertanyaan: e.target.value})} 
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder-slate-400 resize-none font-medium text-slate-700" 
                    placeholder="Tuliskan pertanyaan di sini..." 
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-2">Pilihan Jawaban</label>
                  
                  {['A', 'B', 'C', 'D'].map((opt) => (
                    <div key={opt} className={`flex items-center gap-3 p-2 rounded-xl transition-all border ${form.jawabanBenar === opt ? 'bg-blue-50 border-blue-200' : 'border-transparent hover:bg-slate-50'}`}>
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-500 shadow-sm">
                        {opt}
                      </div>
                      <input 
                        required
                        type="text" 
                        value={(form as any)[`pilihan${opt}`]} 
                        onChange={(e) => setForm({...form, [`pilihan${opt}`]: e.target.value})} 
                        className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" 
                        placeholder={`Isi pilihan ${opt}...`}
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-600 pl-2">
                        <input 
                          type="radio" 
                          name="jawabanBenar"
                          value={opt}
                          checked={form.jawabanBenar === opt}
                          onChange={() => setForm({...form, jawabanBenar: opt})}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        Benar
                      </label>
                    </div>
                  ))}
                </div>

                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3.5 rounded-xl mt-6 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : "Simpan Soal"}
                </button>
              </form>
            </div>
          </div>

          {/* List Soal */}
          <div className="lg:col-span-7">
            <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 text-sm">Daftar Pertanyaan Tersimpan</h3>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                {loading ? (
                  <div className="flex-1 flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                ) : questions.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-60">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Belum ada pertanyaan</h3>
                    <p className="text-slate-500 mt-1 max-w-sm">Buatlah pertanyaan pertama Anda melalui form di sebelah kiri. Berikan setidaknya {quizMeta?.jmlSoal || 10} soal agar kuis ini ideal.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all hover:border-blue-300 relative group">
                        
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)} 
                            className="p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors border border-red-100"
                            title="Hapus Soal"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 mb-4 whitespace-pre-wrap leading-relaxed">{q.pertanyaan}</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {['A', 'B', 'C', 'D'].map(opt => {
                                const isCorrect = q.jawabanBenar === opt;
                                return (
                                  <div key={opt} className={`flex items-start gap-2.5 p-3 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${isCorrect ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}>
                                      {opt}
                                    </span>
                                    <span className={`text-sm flex-1 ${isCorrect ? 'font-semibold text-emerald-800' : 'text-slate-600'}`}>
                                      {(q as any)[`pilihan${opt}`]}
                                    </span>
                                    {isCorrect && (
                                      <svg className="w-4 h-4 text-emerald-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
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
