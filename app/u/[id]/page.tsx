"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";

export default function PublicRunnerProfile() {
  const params = useParams();
  const id = params?.id as string;

  const [participant, setParticipant] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // --- 1. AMBIL DATA PESERTA & RIWAYAT LARI ---
  useEffect(() => {
    const fetchPublicData = async () => {
      if (!id) return;

      try {
        let pData = null;

        // A1. Coba cari berdasarkan field "slug" terlebih dahulu
        const qSlug = query(
          collection(db, "vr_participants"),
          where("slug", "==", id),
        );
        const slugSnap = await getDocs(qSlug);

        if (!slugSnap.empty) {
          // Ketemu pakai Slug!
          const foundDoc = slugSnap.docs[0];
          pData = { id: foundDoc.id, ...foundDoc.data() };
        } else {
          // A2. Kalau tidak ketemu pakai slug, coba cari pakai Document ID asli (sebagai Fallback)
          const pRef = doc(db, "vr_participants", id);
          const pSnap = await getDoc(pRef);

          if (pSnap.exists()) {
            pData = { id: pSnap.id, ...pSnap.data() };
          }
        }

        // Kalau dicarikan pakai slug & ID tetep ga ada, lempar error
        if (!pData) {
          setError("Pelari tidak ditemukan atau ID tidak valid.");
          setIsLoading(false);
          return;
        }

        // Sembunyikan data sensitif di level state (Privacy)
        delete pData.email;
        delete pData.whatsapp;
        delete pData.alamat;
        delete pData.totalTagihan;
        delete pData.nominalDonasi;

        setParticipant(pData);

        // B. Ambil Data Riwayat Lari (Penting: Gunakan pData.id yaitu Doc ID asli, bukan slug URL)
        const sRef = collection(db, "vr_submissions");
        const qSub = query(
          sRef,
          where("participantId", "==", pData.id),
          where("status", "==", "Approved"),
        );
        const sSnap = await getDocs(qSub);

        const sData = sSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Urutkan manual dari yang terbaru
        sData.sort(
          (a: any, b: any) =>
            new Date(b.tanggalLari).getTime() -
            new Date(a.tanggalLari).getTime(),
        );

        setSubmissions(sData);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Gagal memuat profil pelari.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicData();
  }, [id]);

  // --- 2. KALKULASI STATISTIK ---
  const targetKm = participant
    ? parseInt(participant.jarak.replace(/\D/g, ""))
    : 0;
  const totalApprovedKm = submissions.reduce(
    (acc, curr) => acc + (curr.jarakKm || 0),
    0,
  );
  const progressPercent = Math.min((totalApprovedKm / targetKm) * 100, 100);
  const isFinisher = totalApprovedKm >= targetKm;

  const hitungTotalDurasi = () => {
    let totalSeconds = 0;
    submissions.forEach((sub) => {
      if (!sub.durasi) return;
      let sec = 0;
      const str = String(sub.durasi).toLowerCase().trim();

      if (str.includes(":")) {
        const parts = str.split(":").map((n) => parseInt(n) || 0);
        if (parts.length >= 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) sec = parts[0] * 60 + parts[1];
      } else if (str.includes("j") || str.includes("h") || str.includes("m")) {
        const jamMatch = str.match(/(\d+)\s*(j|h)/);
        const menitMatch = str.match(/(\d+)\s*(m)/);
        if (jamMatch) sec += parseInt(jamMatch[1]) * 3600;
        if (menitMatch) sec += parseInt(menitMatch[1]) * 60;
      } else {
        const match = str.match(/\d+/);
        if (match) sec = parseInt(match[0]) * 60;
      }
      if (!isNaN(sec)) totalSeconds += sec;
    });

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // --- 3. LOADING & ERROR STATES ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
          Memuat Profil...
        </p>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4 grayscale opacity-50">🏃‍♂️❓</div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">
          Profil Tidak Ditemukan
        </h1>
        <p className="text-slate-500 mb-8 max-w-sm">
          {error ||
            "Halaman yang Anda tuju mungkin sudah dihapus atau ID tidak valid."}
        </p>
        <Link
          href="/"
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans pb-20 selection:bg-blue-100 selection:text-blue-900">
      {/* HEADER NAVBAR */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div>
              <h1 className="font-black text-slate-800 text-sm leading-none tracking-tight">
                IKA UII DIY
              </h1>
              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">
                Virtual Run 2026
              </p>
            </div>
          </Link>
          <Link
            href="/virtual-run/register"
            className="text-xs font-bold bg-yellow-400 hover:bg-yellow-500 text-blue-950 px-4 py-2 rounded-full transition-colors shadow-sm"
          >
            Daftar Event
          </Link>
        </div>
      </header>

      {/* 🔥 HERO PROFIL (DIPERBARUI DENGAN FOTO HEADER & PROFIL DINAMIS) 🔥 */}
      <div className="bg-[#3b5998] pt-10 pb-32 px-4 sm:px-6 text-white relative overflow-hidden">
        {/* Logika Header Photo: Jika ada foto pakai foto, jika tidak pakai tekstur bawaan */}
        {participant.fotoHeaderUrl ? (
          <>
            <img
              src={participant.fotoHeaderUrl}
              alt="Cover"
              className="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#3b5998] via-transparent to-transparent opacity-80"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        )}

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left mt-4">
          {/* Logika Foto Profil: Jika ada foto pakai foto, jika tidak pakai inisial */}
          {participant.fotoProfilUrl ? (
            <img
              src={participant.fotoProfilUrl}
              alt={participant.nama}
              className="w-32 h-32 rounded-full border-4 border-white/20 shadow-xl shrink-0 object-cover bg-slate-100"
            />
          ) : (
            <div className="w-32 h-32 bg-white/10 rounded-full backdrop-blur-md border-4 border-white/20 flex items-center justify-center text-5xl font-black text-white shadow-xl shrink-0">
              {participant.nama.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-3">
              <span className="bg-blue-900/50 border border-blue-800 text-blue-200 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
                Pelari {participant.jarak}
              </span>
              {isFinisher && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm flex items-center gap-1">
                  🏅 Finisher
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-5xl font-black mb-2 tracking-tight drop-shadow-md">
              {participant.nama}
            </h1>

            {/* Motto / Bio Tambahan */}
            {participant.motto && (
              <p className="text-blue-100 italic mb-3 max-w-lg text-sm md:text-base border-l-4 border-yellow-400 pl-3">
                "{participant.motto}"
              </p>
            )}

            <p className="text-blue-200 text-sm font-medium flex items-center justify-center md:justify-start gap-2">
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                />
              </svg>
              Bergabung{" "}
              {new Date(participant.waktuDaftar).toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-20 relative z-20 space-y-6">
        {/* STATISTIK GRID */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 border border-slate-200 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Total Jarak
            </p>
            <p className="text-2xl sm:text-4xl font-black text-blue-600">
              {totalApprovedKm.toFixed(2)}
              <span className="text-lg sm:text-xl text-slate-400 ml-1">km</span>
            </p>
          </div>
          <div className="border-x border-slate-100">
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Total Waktu
            </p>
            <p className="text-2xl sm:text-4xl font-black text-slate-800">
              {hitungTotalDurasi()}
            </p>
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
              Aktivitas
            </p>
            <p className="text-2xl sm:text-4xl font-black text-slate-800">
              {submissions.length}
            </p>
          </div>
        </div>

        {/* PROGRESS CARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-black text-slate-800 text-lg">
                Progress Challenge
              </h3>
              <p className="text-xs font-medium text-slate-500 mt-0.5">
                Menuju {targetKm} KM Finisher
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-slate-900">
                {Math.round(progressPercent)}%
              </span>
            </div>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isFinisher ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-blue-400"}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* PENCAPAIAN BADGE */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
          <h3 className="font-black text-slate-800 text-lg mb-5 flex items-center gap-2">
            <span className="bg-amber-100 text-amber-600 p-1.5 rounded-lg text-sm">
              🏆
            </span>{" "}
            Pencapaian
          </h3>
          <div className="flex flex-wrap gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-32 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-2 shadow-md">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="font-black text-slate-800 text-xs">First Event</p>
            </div>
            {isFinisher ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 w-32 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-2 shadow-md">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <p className="font-black text-emerald-800 text-xs">Finisher</p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-32 text-center flex flex-col items-center justify-center opacity-50 grayscale">
                <div className="w-12 h-12 bg-slate-300 text-white rounded-2xl flex items-center justify-center mb-2 shadow-inner">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <p className="font-black text-slate-800 text-xs">Finisher</p>
              </div>
            )}
          </div>
        </div>

        {/* RIWAYAT LARI */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 mb-10">
          <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">
              👟
            </span>{" "}
            Aktivitas Lari Terverifikasi
          </h3>
          {submissions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
              <p className="text-sm">Belum ada aktivitas yang disetujui.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((sub, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-slate-200">
                    <img
                      src={sub.imgUrl}
                      alt="Run"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-black text-slate-800 text-sm">
                      Lari {sub.jarakKm} KM
                    </h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      {new Date(sub.tanggalLari).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                      Waktu
                    </p>
                    <p className="text-sm font-black text-slate-700">
                      {sub.durasi}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Bawah */}
        <div className="bg-gradient-to-br from-blue-900 to-blue-950 rounded-3xl p-8 sm:p-10 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              Ikuti Jejak {participant.nama.split(" ")[0]}!
            </h2>
            <p className="text-blue-200 text-sm sm:text-base font-medium max-w-md mx-auto mb-6">
              Tantang dirimu dan berdonasi bersama ribuan alumni lainnya di
              Virtual Run IKA UII.
            </p>
            <Link
              href="/virtual-run/register"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-blue-950 font-black px-8 py-3.5 rounded-xl shadow-lg transition-transform hover:-translate-y-1"
            >
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
