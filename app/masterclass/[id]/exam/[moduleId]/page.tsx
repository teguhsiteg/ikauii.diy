"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "@/lib/toast";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const moduleId = params.moduleId as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Data Ujian
  const [moduleData, setModuleData] = useState<any>(null);
  const [courseData, setCourseData] = useState<any>(null);

  // State Ujian
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Hasil
  const [score, setScore] = useState(0);
  const [isPassed, setIsPassed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      setCurrentUser(user);
      await fetchExamData(user);
    });
    return () => unsubscribe();
  }, [courseId, moduleId, router]);

  const fetchExamData = async (user: any) => {
    setIsLoading(true);
    try {
      // 1. Ambil Info Kelas
      const cDoc = await getDoc(doc(db, "masterclass_courses", courseId));
      if (cDoc.exists()) setCourseData(cDoc.data());

      // 2. Ambil Info Modul Ujian
      const mDoc = await getDoc(doc(db, "masterclass_modules", moduleId));
      if (!mDoc.exists() || mDoc.data().tipe !== "ujian") {
        toast.error("Modul ujian tidak valid atau tidak ditemukan.");
        return router.push(`/masterclass/${courseId}/learn`);
      }

      const mData = mDoc.data();
      setModuleData(mData);

      // Setup Timer (Menit -> Detik)
      setTimeLeft((mData.durasiUjian || 15) * 60);
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat ujian.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 LOGIKA TIMER 🔥
  useEffect(() => {
    let timer: any;
    if (isStarted && !isSubmitted && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isStarted && !isSubmitted) {
      // Waktu habis, kumpulkan paksa
      handleAutoSubmit();
    }
    return () => clearInterval(timer);
  }, [isStarted, isSubmitted, timeLeft]);

  // Hindari looping dependencies di useEffect
  const handleAutoSubmit = useCallback(() => {
    handleSubmitExam(true);
  }, [answers, moduleData]);

  // Format waktu ke MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleSelectAnswer = (soalIndex: number, answer: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [soalIndex]: answer }));
  };

  const handleSubmitExam = async (isAutoSubmit = false) => {
    if (!moduleData || !moduleData.soalUjian) return;

    const totalSoal = moduleData.soalUjian.length;
    const answeredCount = Object.keys(answers).length;

    // Jika belum dijawab semua dan dikumpul manual, kasih peringatan
    if (!isAutoSubmit && timeLeft > 0 && answeredCount < totalSoal) {
      if (
        !confirm(
          `Anda baru menjawab ${answeredCount} dari ${totalSoal} soal. Yakin ingin mengumpulkan sekarang?`,
        )
      ) {
        return;
      }
    }

    setIsSaving(true);
    setIsSubmitted(true);

    try {
      // 1. Hitung Nilai
      let correctAnswers = 0;
      moduleData.soalUjian.forEach((soal: any, index: number) => {
        if (answers[index] === soal.jawabanBenar) {
          correctAnswers++;
        }
      });

      const finalScore = Math.round((correctAnswers / totalSoal) * 100);
      const passed = finalScore >= (moduleData.kkm || 70);

      setScore(finalScore);
      setIsPassed(passed);

      // 2. Jika Lulus, Update Progress di Firebase agar gembok terbuka
      if (passed) {
        const progId = `${currentUser.uid}_${courseId}`;
        const progRef = doc(db, "masterclass_progress", progId);

        await setDoc(
          progRef,
          {
            uid: currentUser.uid,
            courseId: courseId,
            completedModules: arrayUnion(moduleId),
            lastUpdated: serverTimestamp(),
          },
          { merge: true },
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan saat menyimpan nilai.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setTimeLeft((moduleData.durasiUjian || 15) * 60);
    setIsSubmitted(false);
    setIsPassed(false);
    setScore(0);
  };

  if (isLoading || !moduleData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-600 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-500 text-sm tracking-widest uppercase">
          Menyiapkan Lembar Ujian...
        </p>
      </div>
    );
  }

  // ==========================================
  // LAYAR 1: BRIEFING (SEBELUM MULAI)
  // ==========================================
  if (!isStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] font-sans p-4">
        <div className="bg-white max-w-lg w-full rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-sm">
            <svg
              className="w-10 h-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            {moduleData.judul}
          </h1>
          <p className="text-slate-500 text-sm mb-8">
            Kerjakan dengan jujur dan teliti. Waktu akan berjalan secara
            otomatis setelah Anda menekan tombol mulai.
          </p>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-10">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Durasi
              </p>
              <p className="text-lg font-black text-slate-800">
                {moduleData.durasiUjian} <span className="text-xs">Mnt</span>
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Total
              </p>
              <p className="text-lg font-black text-slate-800">
                {moduleData.soalUjian?.length || 0}{" "}
                <span className="text-xs">Soal</span>
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                KKM
              </p>
              <p className="text-lg font-black text-rose-600">
                {moduleData.kkm || 70}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsStarted(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-rose-600/30 w-full text-lg"
            >
              MULAI UJIAN SEKARANG
            </button>
            <button
              onClick={() => router.push(`/masterclass/${courseId}/learn`)}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 py-2 transition-colors"
            >
              Kembali ke Ruang Belajar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // LAYAR 2: HASIL UJIAN (SETELAH KUMPUL)
  // ==========================================
  if (isSubmitted && !isSaving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] font-sans p-4">
        <div className="bg-white max-w-lg w-full rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 text-center animate-in zoom-in-95 duration-500">
          {isPassed ? (
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-sm">
              <svg
                className="w-12 h-12"
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
            </div>
          ) : (
            <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100 shadow-sm">
              <svg
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}

          <h2
            className={`text-3xl font-black mb-2 ${isPassed ? "text-emerald-600" : "text-rose-600"}`}
          >
            {isPassed ? "LULUS!" : "BELUM LULUS"}
          </h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            {isPassed
              ? "Luar biasa! Anda berhasil mencapai nilai standar kelulusan (KKM). Anda dapat melanjutkan materi."
              : `Jangan menyerah! Nilai Anda belum mencapai KKM (${moduleData.kkm}). Silakan pelajari ulang materi dan coba lagi.`}
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 mb-8 relative overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-200">
              <div
                className={`h-full ${isPassed ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${score}%` }}
              ></div>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              NILAI AKHIR ANDA
            </p>
            <p
              className={`text-6xl font-black tracking-tighter ${isPassed ? "text-emerald-600" : "text-rose-600"}`}
            >
              {score}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {isPassed ? (
              <button
                onClick={() => router.push(`/masterclass/${courseId}/learn`)}
                className="bg-[#0056D2] hover:bg-[#00419E] text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-blue-500/30 w-full text-lg"
              >
                LANJUTKAN BELAJAR
              </button>
            ) : (
              <button
                onClick={handleRetry}
                className="bg-slate-800 hover:bg-slate-900 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-slate-800/30 w-full text-lg"
              >
                COBA UJIAN LAGI
              </button>
            )}
            <button
              onClick={() => router.push(`/masterclass/${courseId}/learn`)}
              className="text-sm font-bold text-slate-400 hover:text-slate-600 py-2 mt-2 transition-colors"
            >
              Kembali ke Ruang Belajar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // LAYAR 3: AKTIF UJIAN (KERTAS SOAL)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
      {/* HEADER EXAM BERSIH */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div>
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-0.5">
            Lembar Ujian
          </p>
          <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">
            {moduleData.judul}
          </h1>
        </div>

        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${timeLeft < 60 ? "bg-rose-50 border-rose-200 text-rose-600 animate-pulse shadow-inner" : "bg-slate-50 border-slate-200 text-slate-700"}`}
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
              strokeWidth={2.5}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 8v4l2 2"
            />
          </svg>
          <span className="font-mono font-black text-lg tracking-widest">
            {formatTime(timeLeft)}
          </span>
        </div>
      </nav>

      {/* DAFTAR KERTAS SOAL */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">
        <div className="space-y-8">
          {moduleData.soalUjian?.map((soal: any, index: number) => (
            <div
              key={index}
              className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200"
            >
              <div className="flex gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-black shrink-0 border border-rose-200">
                  {index + 1}
                </div>
                <p className="font-bold text-slate-800 text-base leading-relaxed pt-1 whitespace-pre-wrap">
                  {soal.pertanyaan}
                </p>
              </div>

              <div className="space-y-3 pl-0 sm:pl-12">
                {["A", "B", "C", "D"].map((opsi) => {
                  const valueOpsi = soal[`opsi${opsi}`];
                  if (!valueOpsi) return null;
                  const isSelected = answers[index] === opsi;

                  return (
                    <button
                      key={opsi}
                      onClick={() => handleSelectAnswer(index, opsi)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${isSelected ? "border-[#0056D2] bg-blue-50/50 shadow-sm" : "border-slate-100 hover:border-slate-300 bg-white"}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? "border-[#0056D2] bg-[#0056D2] text-white" : "border-slate-300 text-transparent"}`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3"
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
                      <div className="flex-1">
                        <span className="font-black text-slate-400 mr-2">
                          {opsi}.
                        </span>
                        <span
                          className={`text-sm ${isSelected ? "font-bold text-blue-900" : "font-medium text-slate-600"}`}
                        >
                          {valueOpsi}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* TOMBOL SUBMIT */}
        <div className="mt-12 flex justify-end">
          <button
            onClick={() => handleSubmitExam(false)}
            disabled={isSaving}
            className="bg-[#0056D2] hover:bg-[#00419E] text-white px-10 py-4 rounded-xl font-black transition-all shadow-lg shadow-blue-500/30 flex items-center gap-3 w-full sm:w-auto justify-center disabled:opacity-50 text-base"
          >
            {isSaving ? "MENGKOREKSI..." : "KUMPULKAN UJIAN"}
            {!isSaving && (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
