"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";

export default function VerifyCertificatePage() {
  const params = useParams();
  const certId = params.id as string; // Contoh: MC-IKA-ABCDE-12345

  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">(
    "loading",
  );

  // Data Hasil Validasi
  const [studentData, setStudentData] = useState<any>(null);
  const [courseData, setCourseData] = useState<any>(null);
  const [completionDate, setCompletionDate] = useState<Date | null>(null);

  useEffect(() => {
    if (certId) {
      verifyCertificate(certId);
    }
  }, [certId]);

  const verifyCertificate = async (id: string) => {
    setIsLoading(true);
    try {
      // 1. Pecah Kode Sertifikat
      const parts = id.split("-");
      if (parts.length !== 4 || parts[0] !== "MC" || parts[1] !== "IKA") {
        setStatus("invalid");
        setIsLoading(false);
        return;
      }

      const uidPrefix = parts[2].toUpperCase();
      const coursePrefix = parts[3].toUpperCase();

      // 2. Tarik semua data progress kelulusan untuk dicocokkan
      const progressSnap = await getDocs(
        collection(db, "masterclass_progress"),
      );
      let foundProgress: any = null;
      let actualUid = "";
      let actualCourseId = "";

      for (const doc of progressSnap.docs) {
        const data = doc.data();
        const dataUid = data.uid || doc.id.split("_")[0];
        const dataCourse = data.courseId || doc.id.split("_")[1];

        // Cocokkan 5 huruf pertama UID dan 5 huruf pertama Course ID
        if (
          dataUid.toUpperCase().startsWith(uidPrefix) &&
          dataCourse.toUpperCase().startsWith(coursePrefix)
        ) {
          foundProgress = data;
          actualUid = dataUid;
          actualCourseId = dataCourse;
          break; // Ketemu! Berhenti mencari
        }
      }

      if (!foundProgress) {
        setStatus("invalid");
        setIsLoading(false);
        return;
      }

      // 3. Validasi ulang apakah benar-benar 100% Selesai
      const qMod = query(
        collection(db, "masterclass_modules"),
        where("courseId", "==", actualCourseId),
      );
      const modSnap = await getDocs(qMod);
      const totalModules = modSnap.size;

      const completedArray = foundProgress.completedModules || [];
      const validCompletedCount = completedArray.filter((modId: string) =>
        modSnap.docs.some((m) => m.id === modId),
      ).length;

      // Jika belum selesai 100%, sertifikat dianggap belum sah
      if (totalModules === 0 || validCompletedCount < totalModules) {
        setStatus("invalid");
        setIsLoading(false);
        return;
      }

      // 4. Tarik Profil Siswa dan Detail Kelas
      const userSnap = await getDoc(doc(db, "users", actualUid));
      const courseSnap = await getDoc(
        doc(db, "masterclass_courses", actualCourseId),
      );

      if (!userSnap.exists() || !courseSnap.exists()) {
        setStatus("invalid");
        setIsLoading(false);
        return;
      }

      // 5. Data Valid! Masukkan ke state
      setStudentData(userSnap.data());
      setCourseData(courseSnap.data());
      setCompletionDate(foundProgress.lastUpdated?.toDate() || new Date());
      setStatus("valid");
    } catch (error) {
      console.error("Verification Error:", error);
      setStatus("invalid");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-[#0056D2] rounded-full animate-spin mb-6 shadow-sm"></div>
        <h2 className="text-xl font-black text-slate-800 mb-2">
          Memverifikasi Dokumen
        </h2>
        <p className="text-slate-500 text-sm font-medium">
          Mencocokkan nomor registrasi dengan database pusat...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center py-12 px-4 font-sans relative overflow-hidden">
      {/* Background Ornamen IKA UII */}
      <div className="absolute top-0 left-0 w-full h-96 bg-[#0B1528] rounded-b-[4rem] shadow-xl"></div>

      <div className="relative z-10 w-full max-w-xl">
        {/* LOGO HEADER */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Link href="/" className="bg-white p-3 rounded-2xl shadow-lg mb-4">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo IKA UII"
              className="h-12 object-contain"
            />
          </Link>
          <h1 className="text-white font-black text-2xl tracking-widest uppercase">
            Portal Validasi
          </h1>
          <p className="text-blue-200 text-xs font-bold uppercase tracking-[0.2em] mt-1">
            Masterclass IKA UII DIY
          </p>
        </div>

        {/* KARTU HASIL VERIFIKASI */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {status === "valid" ? (
            <>
              <div className="bg-emerald-50 border-b border-emerald-100 p-8 text-center">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30 ring-4 ring-white">
                  <svg
                    className="w-10 h-10"
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
                <h2 className="text-2xl font-black text-emerald-700 uppercase tracking-wide">
                  Dokumen Valid
                </h2>
                <p className="text-emerald-600/80 text-sm font-medium mt-1">
                  Sertifikat ini resmi dan tercatat di database IKA UII DIY.
                </p>
              </div>

              <div className="p-8 space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                    Nomor Registrasi Sertifikat
                  </p>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                    <p className="font-mono text-lg font-black text-[#0B1528] tracking-widest">
                      {certId}
                    </p>
                    <svg
                      className="w-5 h-5 text-emerald-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                      Diberikan Kepada
                    </p>
                    <p className="text-base font-bold text-slate-900 capitalize leading-snug">
                      {studentData?.displayName ||
                        studentData?.nama ||
                        "Alumni UII"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {studentData?.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                      Tanggal Kelulusan
                    </p>
                    <p className="text-base font-bold text-slate-900 leading-snug">
                      {completionDate?.toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-6">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
                    Program Pelatihan Diselesaikan
                  </p>
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                      {courseData?.thumbnailUrl ? (
                        <img
                          src={courseData.thumbnailUrl}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-[#0056D2]">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm leading-snug">
                        {courseData?.judul}
                      </h4>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                        {courseData?.kategori}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-rose-50 border-b border-rose-100 p-10 text-center">
                <div className="w-24 h-24 bg-rose-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-500/30 ring-4 ring-white">
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
                <h2 className="text-3xl font-black text-rose-700 uppercase tracking-wide">
                  Tidak Valid
                </h2>
                <p className="text-rose-600/80 text-sm font-medium mt-2 max-w-xs mx-auto">
                  Dokumen dengan nomor registrasi tersebut tidak ditemukan di
                  dalam database kami, atau peserta belum menyelesaikan
                  pelatihan.
                </p>
              </div>
              <div className="p-8 text-center bg-slate-50">
                <p className="text-xs text-slate-500 mb-4">
                  Nomor yang Anda cari:
                </p>
                <p className="font-mono text-lg font-bold text-slate-700 tracking-widest bg-white py-2 px-4 rounded-lg border border-slate-200 inline-block">
                  {certId}
                </p>
              </div>
            </>
          )}

          <div className="bg-[#F8FAFC] border-t border-slate-200 p-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 text-sm font-bold text-[#0056D2] hover:text-[#00419E] transition-colors"
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
              Kembali ke Beranda Utama
            </Link>
          </div>
        </div>

        <div className="text-center mt-8 text-slate-400 text-xs">
          <p>
            © {new Date().getFullYear()} Dewan Pimpinan Wilayah Ikatan Keluarga
            Alumni UII DIY.
          </p>
          <p className="mt-1">Sistem Validasi Dokumen Digital v1.0</p>
        </div>
      </div>
    </div>
  );
}
