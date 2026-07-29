"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function CertificatePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [mentor, setMentor] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [completionDate, setCompletionDate] = useState<Date | null>(null);
  const [totalDuration, setTotalDuration] = useState({ hours: 0, mins: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  // 🔥 STATE UNTUK KIRIM EMAIL & MODAL SUKSES 🔥
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/login");
      setCurrentUser(user);
      await verifyAndFetchCertificate(user);
    });
    return () => unsubscribe();
  }, [courseId, router]);

  const verifyAndFetchCertificate = async (user: any) => {
    setIsLoading(true);
    try {
      // 1. Cek Data Kelas
      const cDoc = await getDoc(doc(db, "masterclass_courses", courseId));
      if (!cDoc.exists()) throw new Error("Kelas tidak ditemukan");
      const cData = cDoc.data();
      setCourse(cData);

      // 2. Cek Data Mentor (dan ambil TTD asli)
      if (cData.mentorId) {
        const mDoc = await getDoc(
          doc(db, "masterclass_mentors", cData.mentorId),
        );
        if (mDoc.exists()) setMentor(mDoc.data());
      }

      // 3. Tarik Data Modul (Untuk Lampiran Silabus Transkrip)
      const qMod = query(
        collection(db, "masterclass_modules"),
        where("courseId", "==", courseId),
      );
      const modSnap = await getDocs(qMod);
      const fetchedModules = modSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => Number(a.urutan) - Number(b.urutan));

      // 4. Validasi Kelulusan (Progress harus 100%)
      const progDoc = await getDoc(
        doc(db, "masterclass_progress", `${user.uid}_${courseId}`),
      );
      if (!progDoc.exists()) throw new Error("Belum ada progress");

      const progData = progDoc.data();
      const completedArray = progData.completedModules || [];
      const scoresMap = progData.scores || {};

      const totalModules = fetchedModules.length;

      // Filter modul gaib
      const validCompletedCount = completedArray.filter((id: string) =>
        modSnap.docs.some((m) => m.id === id),
      ).length;

      if (totalModules === 0 || validCompletedCount < totalModules) {
        toast.warning("Sertifikat terkunci! Anda belum menyelesaikan semua modul.");
        return router.push(`/masterclass/${courseId}/learn`);
      }

      // 5. Kalkulasi Durasi & Pemrosesan Data Transkrip
      let totalMinutes = 0;
      const processedModules = fetchedModules.map((mod) => {
        const durasi = Number(mod.durasi) || Number(mod.durasiUjian) || 15;
        totalMinutes += durasi;

        let nilai = "-";
        let status = "Selesai";

        if (mod.tipe === "ujian") {
          nilai = scoresMap[mod.id]
            ? `${scoresMap[mod.id]}`
            : `Lulus (KKM: ${mod.kkm || 70})`;
          status = "Lulus";
        }

        return { ...mod, durasi, nilai, status };
      });

      const hours = Math.floor(totalMinutes / 60);
      const mins = totalMinutes % 60;
      setTotalDuration({ hours, mins });
      setModules(processedModules);

      // 6. Set Tanggal Kelulusan
      const finishedDate = progData.lastUpdated?.toDate() || new Date();
      setCompletionDate(finishedDate);
      setIsValid(true);
    } catch (error) {
      console.error(error);
      router.push(`/masterclass/${courseId}/learn`);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Nomor & Link Validasi Sertifikat Unik
  const certNumber = currentUser
    ? `MC-IKA-${currentUser.uid.substring(0, 5).toUpperCase()}-${courseId.substring(0, 5).toUpperCase()}`
    : "";
  const validationUrl = `https://ikadiy.uii.ac.id/verify/${certNumber}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(validationUrl)}`;
  const ttdImage =
    mentor?.ttdUrl || mentor?.ttd || mentor?.signatureUrl || mentor?.signature;

  // 🔥 FUNGSI KIRIM EMAIL 🔥
  const handleSendEmail = async () => {
    if (!currentUser || !course) return;

    setIsSendingEmail(true);
    try {
      // Data yang akan dikirim ke endpoint API
      const payload = {
        type: "masterclass_certificate",
        email: currentUser.email,
        nama: currentUser.displayName || currentUser.email.split("@")[0],
        detail: {
          judulKelas: course.judul,
          nomorSertifikat: certNumber,
          tanggalLulus: completionDate?.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          linkValidasi: validationUrl,
        },
      };

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // 🔥 GANTI ALERT DENGAN MODAL SUKSES 🔥
        setShowSuccessModal(true);
      } else {
        toast.error("Gagal mengirim email. Silakan coba lagi nanti.");
      }
    } catch (error) {
      console.error("Error saat mengirim email:", error);
      toast.error("Terjadi kesalahan sistem saat mencoba mengirim email.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !isValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 font-sans">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-400 text-sm tracking-widest uppercase">
          Mempersiapkan Dokumen Resmi...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 font-sans print:p-0 print:bg-white overflow-x-hidden relative">
      {/* 🔥 MODAL SUKSES ELEGAN 🔥 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
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
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Berhasil!
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Pemberitahuan kelulusan dan tautan E-Certificate telah dikirimkan
              ke email Anda <strong>({currentUser?.email})</strong>. Silakan cek
              kotak masuk atau folder spam Anda.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-[#0056D2] hover:bg-[#00419E] transition-colors shadow-lg"
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      )}

      {/* TOMBOL AKSI */}
      <div className="mb-8 flex gap-4 print:hidden z-50">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-white text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2"
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
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali ke Ruang Belajar
        </button>

        {/* Tombol Native Print/Save as PDF */}
        <button
          onClick={handlePrint}
          className="px-6 py-3 bg-white text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors hidden md:flex items-center gap-2"
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
              strokeWidth={2}
              d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
            />
          </svg>
          Cetak Manual / Unduh
        </button>

        {/* 🔥 TOMBOL KIRIM EMAIL 🔥 */}
        <button
          onClick={handleSendEmail}
          disabled={isSendingEmail}
          className="px-8 py-3 bg-[#0056D2] hover:bg-[#00419E] text-white font-black rounded-xl shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2 disabled:opacity-70"
        >
          {isSendingEmail ? (
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          ) : (
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          )}
          {isSendingEmail
            ? "MENGIRIM EMAIL..."
            : "KIRIM E-CERTIFICATE KE EMAIL"}
        </button>
      </div>

      {/* PREVIEW SERTIFIKAT DI LAYAR */}
      <div className="certificate-wrapper flex flex-col gap-10 print:gap-0 print:block pointer-events-none select-none">
        {/* ========================================== */}
        {/* HALAMAN 1: SERTIFIKAT UTAMA                */}
        {/* ========================================== */}
        <div className="certificate-page w-[1122px] h-[793px] bg-white relative shadow-2xl overflow-hidden print:shadow-none mx-auto shrink-0 flex flex-col justify-center items-center text-center">
          {/* DESAIN BACKGROUND & WATERMARK TIPIS */}
          <div className="absolute inset-0">
            <div className="absolute inset-4 border-[10px] border-double border-amber-200 opacity-50"></div>
            <div className="absolute inset-6 border-2 border-amber-400 opacity-20"></div>
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-[#0B1528] to-[#1A73E8] -translate-x-32 -translate-y-32 rotate-45"></div>
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-amber-400 to-amber-600 -translate-x-[-128px] -translate-y-[-128px] rotate-45"></div>

            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: 0.02 }}
            >
              <img
                src="/logo-dpp-ika.png"
                alt="Watermark"
                className="w-[500px] h-[500px] object-contain grayscale"
              />
            </div>
          </div>

          <div className="relative z-10 w-full px-32 flex flex-col items-center">
            <div className="flex items-center justify-center gap-6 mb-10">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo IKA UII"
                className="h-20 object-contain"
              />
              <div className="h-16 w-px bg-slate-300"></div>
              <div className="text-left">
                <h2 className="font-black text-2xl text-[#0B1528] tracking-widest uppercase">
                  MASTERCLASS
                </h2>
                <p className="font-bold text-sm text-slate-500 tracking-[0.2em] uppercase">
                  Ikatan Keluarga Alumni UII DIY
                </p>
              </div>
            </div>

            <h1 className="text-6xl font-black text-[#0B1528] tracking-widest uppercase mb-4 font-serif">
              Certificate
            </h1>
            <p className="text-xl tracking-[0.3em] text-amber-600 font-bold uppercase mb-12">
              Of Completion
            </p>

            <p className="text-slate-500 font-medium italic text-lg mb-4">
              Sertifikat ini diberikan dengan bangga kepada:
            </p>
            <h2 className="text-5xl font-black text-[#103575] mb-6 capitalize leading-tight border-b-2 border-slate-200 pb-4 px-16 inline-block">
              {currentUser?.displayName || currentUser?.email?.split("@")[0]}
            </h2>
            <p className="text-slate-600 text-lg max-w-3xl leading-relaxed mb-16">
              Atas keberhasilannya menyelesaikan seluruh materi kurikulum dan
              lulus evaluasi pada program Masterclass{" "}
              <strong>"{course?.judul}"</strong>.
            </p>

            <div className="flex justify-between items-end w-full px-12 mt-auto">
              <div className="text-left flex items-end gap-5">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-20 h-20 rounded-lg border-2 border-slate-200 p-1 bg-white shadow-sm"
                />
                <div className="pb-1">
                  <p className="font-bold text-slate-800 text-lg border-b border-slate-400 pb-1 mb-1">
                    {completionDate?.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                    Tanggal Lulus
                  </p>
                  <p className="text-[9px] text-slate-400 font-mono tracking-wider">
                    ID: {certNumber}
                  </p>
                </div>
              </div>

              <div className="text-center w-70 pb-1 flex flex-col items-center">
                <div className="h-29 flex items-end justify-center mb-0.1 w-full">
                  {ttdImage ? (
                    <img
                      src={ttdImage}
                      alt="Tanda Tangan Mentor"
                      className="max-h-full max-w-full object-contain mix-blend-multiply"
                    />
                  ) : (
                    <span className="font-serif text-4xl text-slate-800 italic opacity-80">
                      {mentor?.nama?.split(" ")[0] || "DPW"}
                    </span>
                  )}
                </div>
                <p className="font-bold text-slate-800 text-sm border-t border-slate-400 pt-2 w-full">
                  {mentor?.nama || "Pengurus DPW IKA UII DIY"}
                </p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  Instruktur Utama
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* HALAMAN 2: TRANSKRIP & SILABUS             */}
        {/* ========================================== */}
        <div className="certificate-page w-[1122px] h-[793px] bg-white relative shadow-2xl overflow-hidden print:shadow-none mx-auto shrink-0 flex flex-col p-16">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ opacity: 0.02 }}
            >
              <img
                src="/logo-dpp-ika.png"
                alt="Watermark"
                className="w-[450px] h-[450px] object-contain grayscale"
              />
            </div>
          </div>

          <div className="relative z-10 w-full h-full flex flex-col">
            <div className="flex justify-between items-end border-b-[3px] border-[#0B1528] pb-6 mb-8">
              <div>
                <h2 className="text-3xl font-black text-[#0B1528] tracking-widest uppercase mb-2">
                  Transkrip Pelatihan
                </h2>
                <p className="text-sm font-bold text-slate-600 uppercase tracking-widest">
                  Masterclass IKA UII DIY - {course?.judul}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  Diberikan Kepada
                </p>
                <p className="font-black text-[#0B1528] text-lg uppercase">
                  {currentUser?.displayName ||
                    currentUser?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-slate-500 font-mono mt-1">
                  Ref ID: {certNumber}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              <table className="w-full text-left border-collapse border border-[#0B1528]">
                <thead>
                  <tr className="bg-slate-100 text-[#0B1528] tracking-widest text-[11px] font-bold uppercase border-b-2 border-[#0B1528]">
                    <th className="p-3 border-r border-[#0B1528] w-12 text-center">
                      No
                    </th>
                    <th className="p-3 border-r border-[#0B1528]">
                      Kurikulum & Materi
                    </th>
                    <th className="p-3 border-r border-[#0B1528] w-32 text-center">
                      Tipe Materi
                    </th>
                    <th className="p-3 border-r border-[#0B1528] w-24 text-center">
                      Durasi
                    </th>
                    <th className="p-3 w-40 text-center">Nilai / Status</th>
                  </tr>
                </thead>
                <tbody className="text-slate-800 text-sm font-medium">
                  {modules.map((mod, idx) => (
                    <tr key={idx} className="border-b border-slate-400">
                      <td className="p-3 border-r border-[#0B1528] text-center font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r border-[#0B1528]">
                        <p className="font-bold text-slate-900">
                          {mod.bab || "Materi Pelatihan"}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {mod.judul}
                        </p>
                      </td>
                      <td className="p-3 border-r border-[#0B1528] text-center text-[11px] uppercase tracking-wider font-bold text-slate-600">
                        {mod.tipe === "ujian"
                          ? "Evaluasi"
                          : mod.tipe === "pdf"
                            ? "Dokumen PDF"
                            : "Video"}
                      </td>
                      <td className="p-3 border-r border-[#0B1528] text-center text-sm">
                        {mod.durasi} Menit
                      </td>
                      <td className="p-3 text-center font-black text-slate-800 text-xs">
                        {mod.nilai}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 border-t-2 border-[#0B1528]">
                    <td
                      colSpan={3}
                      className="p-3 border-r border-[#0B1528] text-right font-black uppercase tracking-widest text-xs"
                    >
                      Total Jam Pelatihan
                    </td>
                    <td
                      colSpan={2}
                      className="p-3 text-center font-black text-slate-900 text-sm"
                    >
                      {totalDuration.hours > 0 && `${totalDuration.hours} Jam `}
                      {totalDuration.mins} Menit
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-300 pt-6 mt-6 flex justify-between items-end">
              <div className="text-xs text-slate-600 font-medium leading-relaxed">
                <p className="font-bold text-slate-800 mb-1">
                  Pernyataan Validitas:
                </p>
                <p>
                  Transkrip ini diterbitkan secara otomatis oleh Sistem
                  Pembelajaran Masterclass IKA UII DIY.
                </p>
                <p>
                  Dokumen ini sah dan dapat diverifikasi melalui pemindaian QR
                  Code pada Halaman 1.
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-1">
                  URL Verifikasi Digital
                </p>
                <p className="font-mono text-xs font-bold text-[#0B1528]">
                  {validationUrl}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* SCALING DI LAYAR MONITOR/HP BIAR PAS & RAPI */
        @media screen and (max-width: 1300px) {
          .certificate-wrapper {
            transform: scale(0.85);
            transform-origin: top center;
            margin-bottom: -150px;
          }
        }
        @media screen and (max-width: 1000px) {
          .certificate-wrapper {
            transform: scale(0.65);
            transform-origin: top center;
            margin-bottom: -350px;
          }
        }
        @media screen and (max-width: 600px) {
          .certificate-wrapper {
            transform: scale(0.33);
            transform-origin: top center;
            margin-bottom: -1000px;
          }
        }
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .certificate-wrapper {
            gap: 0 !important;
          }
          .certificate-page {
            width: 100% !important;
            height: 100vh !important;
            box-shadow: none !important;
            transform: scale(1) !important;
            page-break-after: always; /* KUNCI POTONG KERTAS */
          }
        }
      `}</style>
    </div>
  );
}
