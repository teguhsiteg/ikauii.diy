"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import html2canvas from "html2canvas";
import dynamic from "next/dynamic";

const MapRoute = dynamic(() => import("@/components/MapRoute"), { ssr: false });

const decodePolyline = (str: string, precision = 5) => {
  let index = 0,
    lat = 0,
    lng = 0,
    coordinates: [number, number][] = [];
  let shift = 0,
    result = 0,
    byte = null,
    latitude_change,
    longitude_change,
    factor = Math.pow(10, precision);
  while (index < str.length) {
    byte = null;
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude_change = result & 1 ? ~(result >> 1) : result >> 1;
    shift = result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude_change = result & 1 ? ~(result >> 1) : result >> 1;
    lat += latitude_change;
    lng += longitude_change;
    coordinates.push([lat / factor, lng / factor]);
  }
  return coordinates;
};

export default function StravaStudioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const cardRef = useRef<HTMLDivElement>(null);

  // =========================================================================
  // 🔥 SETTING ANTI-CHEAT (PENGATURAN TANGGAL EVENT) 🔥
  // =========================================================================
  // ⚠️ GANTI TANGGAL INI SESUAI TANGGAL ASLI EVENT UII SEHAT 2026 (Format: YYYY-MM-DD)
  // Jika event hanya 1 hari, isi START dan END dengan tanggal yang sama.
  const EVENT_START_DATE = "2026-08-16";
  const EVENT_END_DATE = "2026-08-16";
  // =========================================================================

  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [participant, setParticipant] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [activity, setActivity] = useState<any>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const fetchStravaData = async () => {
      try {
        const docRef = doc(db, "offline_participants", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists() || !docSnap.data().strava_access_token) {
          setErrorMsg("Data peserta atau token Strava tidak valid.");
          setIsLoading(false);
          return;
        }

        const dataPeserta = docSnap.data();
        setParticipant(dataPeserta);

        if (dataPeserta.isStravaVerified) {
          setIsSubmitted(true);
        }

        const res = await fetch(
          "https://www.strava.com/api/v3/athlete/activities?per_page=30",
          {
            headers: {
              Authorization: `Bearer ${dataPeserta.strava_access_token}`,
            },
          },
        );

        const stravaData = await res.json();

        if (!res.ok || !Array.isArray(stravaData) || stravaData.length === 0) {
          setErrorMsg("Gagal mengambil data atau belum ada aktivitas lari.");
          setIsLoading(false);
          return;
        }

        const runs = stravaData.filter((act: any) => act.type === "Run");

        if (runs.length === 0) {
          toast.warning("Semua data aktivitas belum termuat, mohon tunggu sebentar atau muat ulang halaman.");
          return;
        }

        setActivities(runs);
        setActivity(runs[0]);
      } catch (error) {
        console.error("Error fetching data:", error);
        setErrorMsg("Terjadi kesalahan sistem saat menghubungi Strava.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchStravaData();
  }, [id]);

  const calculatePace = (meters: number, seconds: number) => {
    if (!meters || !seconds) return "0:00";
    const paceSeconds = Math.floor(seconds / (meters / 1000));
    return `${Math.floor(paceSeconds / 60)}:${(paceSeconds % 60).toString().padStart(2, "0")}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr)
      .toLocaleDateString("id-ID", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      .toUpperCase();
  };

  // Fungsi Validasi Tanggal
  const checkIsEventDate = (dateString: string) => {
    if (!dateString) return false;
    // Potong string untuk mengambil format YYYY-MM-DD saja dari Strava (contoh: 2026-08-16T06:00:00Z)
    const datePart = dateString.split("T")[0];
    return datePart >= EVENT_START_DATE && datePart <= EVENT_END_DATE;
  };

  // Mengecek apakah aktivitas yang dipilih valid masuk Leaderboard
  const isActivityValidForLeaderboard = activity
    ? checkIsEventDate(activity.start_date_local || activity.start_date)
    : false;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      await new Promise((r) => setTimeout(r, 600));

      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: theme === "dark" ? "#0A0A0A" : "#FFFFFF",
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `UII_Sehat_${participant.nomorBIB}_${activity.id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal memproses gambar:", err);
      toast.error("Terjadi kesalahan memotret peta. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSubmitToLeaderboard = async () => {
    if (!activity) return;

    const netTimeMs = activity.elapsed_time * 1000;
    const paceStr = calculatePace(activity.distance, activity.moving_time);
    const jarakKm = (activity.distance / 1000).toFixed(2);

    const isConfirmed = window.confirm(
      `Setor Waktu ke Leaderboard?\n\nJarak: ${jarakKm} KM\nPace: ${paceStr}/KM\n\nData yang disetor akan dikunci dan tidak bisa diubah. Lanjutkan?`,
    );

    if (!isConfirmed) return;

    setIsSubmitting(true);
    try {
      const docRef = doc(db, "offline_participants", id);

      await updateDoc(docRef, {
        netTimeMs: netTimeMs,
        isStravaVerified: true,
        stravaActivityId: activity.id,
        waktuFinish: new Date(activity.start_date).getTime() + netTimeMs,
      });

      setIsSubmitted(true);
      toast.success("✅ Berhasil! Nama Anda sudah melesat masuk ke Leaderboard IKA UII DIY dengan lencana Strava!");
    } catch (error) {
      console.error("Gagal setor ke leaderboard:", error);
      toast.error("Gagal menyetor data. Pastikan koneksi internet stabil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || errorMsg) {
    return (
      <div className="h-screen w-screen bg-[#0a0a0a] flex flex-col items-center justify-center font-sans">
        {errorMsg ? (
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl text-center max-w-sm border border-white/10">
            <p className="text-rose-400 font-medium">{errorMsg}</p>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 border-2 border-white/20 border-t-[#FC4C02] rounded-full animate-spin mb-4"></div>
            <p className="text-white/50 text-xs font-bold tracking-widest uppercase">
              Sinkronisasi Strava
            </p>
          </>
        )}
      </div>
    );
  }

  const coordinates = activity?.map?.summary_polyline
    ? decodePolyline(activity.map.summary_polyline)
    : [];

  return (
    <div className="min-h-screen w-full bg-[#EAECEF] flex flex-col font-sans relative pb-10">
      <div className="w-full bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shadow-sm z-30 sticky top-0">
        <button
          onClick={() => router.push("/run/strava")}
          className="text-slate-500 hover:text-slate-800 font-bold text-sm flex items-center gap-2 transition-colors"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Kembali
        </button>
        <div className="font-black text-slate-800 tracking-tight text-lg">
          RUN<span className="text-[#FC4C02]">STUDIO</span>
        </div>
        <div className="w-20"></div>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-10 mt-8 px-4 max-w-6xl mx-auto w-full">
        {/* KOLOM KIRI: KANVAS KARTU IG STORY */}
        <div className="flex flex-col items-center shrink-0">
          <div className="shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2.5rem] p-2 bg-white/50 backdrop-blur-xl border border-white">
            <div
              ref={cardRef}
              className={`w-[360px] h-[640px] rounded-[2rem] overflow-hidden flex flex-col relative ${theme === "dark" ? "bg-[#0A0A0A] text-white" : "bg-white text-slate-900"} transition-colors duration-500`}
            >
              <div className="relative h-[55%] w-full bg-slate-100">
                <MapRoute coords={coordinates} theme={theme} />
                <div
                  className={`absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t ${theme === "dark" ? "from-[#0A0A0A]" : "from-white"} to-transparent z-[400] pointer-events-none`}
                ></div>
                <div className="absolute top-6 right-6 opacity-30 shadow-md bg-white/10 p-2 rounded-xl backdrop-blur-md z-[400]">
                  <svg
                    className={`w-4 h-4 ${theme === "dark" ? "text-white" : "text-[#FC4C02]"}`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                  </svg>
                </div>
              </div>

              <div className="relative z-[500] flex-1 flex flex-col px-8 pb-6 justify-end -mt-8 pointer-events-none">
                <div className="mb-6">
                  <h2 className="text-[28px] font-black tracking-tighter leading-tight mb-1 line-clamp-2">
                    {activity.name}
                  </h2>
                  <div
                    className={`flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest ${theme === "dark" ? "text-white/50" : "text-slate-400"}`}
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span>
                      {participant.namaLengkap} • BIB {participant.nomorBIB}
                    </span>
                  </div>
                </div>

                <div className="mb-8">
                  <p
                    className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}
                  >
                    Distance
                  </p>
                  <p className="text-[56px] font-black leading-none tracking-tighter">
                    {(activity.distance / 1000).toFixed(2)}
                    <span className="text-xl font-bold ml-1 opacity-50 tracking-normal">
                      KM
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p
                      className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}
                    >
                      Avg Pace
                    </p>
                    <p className="text-2xl font-black tracking-tight">
                      {calculatePace(activity.distance, activity.moving_time)}
                      <span className="text-sm font-bold ml-1 opacity-50">
                        /KM
                      </span>
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}
                    >
                      Date
                    </p>
                    <p className="text-2xl font-black tracking-tight">
                      {formatDate(activity.start_date)}
                    </p>
                  </div>
                </div>

                <div
                  className={`pt-4 border-t flex items-center gap-2 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}
                >
                  <img
                    src="/logo-dpp-ika.png"
                    alt="Logo"
                    className="w-4 h-4 object-contain grayscale opacity-80"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    crossOrigin="anonymous"
                  />
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-bold text-[10px] tracking-widest uppercase ${theme === "dark" ? "text-white/70" : "text-[#152B5B]"}`}
                    >
                      UII Sehat 2026
                    </span>
                    <span className="text-[#FC4C02] font-black text-[10px]">
                      •
                    </span>
                    <span
                      className={`font-medium text-[10px] tracking-widest uppercase ${theme === "dark" ? "text-white/50" : "text-slate-400"}`}
                    >
                      IKA UII DIY
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: EDITOR & ACTIONS */}
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Appearance
            </h3>
            <div className="flex bg-slate-100 rounded-xl p-1.5 border border-slate-200">
              <button
                onClick={() => setTheme("dark")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${theme === "dark" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Dark Mode
              </button>
              <button
                onClick={() => setTheme("light")}
                className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${theme === "light" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Light Mode
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              Recent Activities
            </h3>
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x scrollbar-hide">
              {activities.map((act) => {
                // Periksa apakah aktivitas ini valid (sesuai tanggal event)
                const isValidDate = checkIsEventDate(
                  act.start_date_local || act.start_date,
                );

                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (isSubmitted && activity?.id !== act.id) {
                        toast.warning("Anda sudah menyetor waktu. Riwayat lari lain sudah dikunci dari Leaderboard.");
                        return;
                      setActivity(act);
                    }}
                    className={`shrink-0 snap-center cursor-pointer p-4 rounded-2xl border-2 transition-all w-[140px] flex flex-col justify-between h-[160px] relative overflow-hidden ${
                      activity?.id === act.id
                        ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                        : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {!isValidDate && (
                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-widest z-10">
                        Invalid
                      </div>
                    )}
                    <p
                      className={`text-[9px] font-black uppercase tracking-wider mb-2 relative z-10 ${activity?.id === act.id ? "text-slate-400" : "text-slate-400"}`}
                    >
                      {formatDate(act.start_date)}
                    </p>
                    <div className="mt-auto relative z-10">
                      <p
                        className={`text-2xl font-black leading-none mb-1 ${activity?.id === act.id ? "text-white" : "text-slate-800"}`}
                      >
                        {(act.distance / 1000).toFixed(2)}
                        <span className="text-[10px] ml-0.5 opacity-70">
                          KM
                        </span>
                      </p>
                      <p className="font-bold text-[10px] truncate opacity-80">
                        {act.name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {/* 🔥 TOMBOL SETOR LEADERBOARD (ANTI-CHEAT TERPASANG) 🔥 */}
            <button
              onClick={handleSubmitToLeaderboard}
              disabled={
                isSubmitting ||
                isSubmitted ||
                isDownloading ||
                !isActivityValidForLeaderboard
              }
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] ${
                isSubmitted
                  ? "bg-emerald-500 text-white cursor-not-allowed shadow-none"
                  : !isActivityValidForLeaderboard
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200"
                    : "bg-[#1A73E8] hover:bg-[#1557B0] text-white hover:-translate-y-1 active:translate-y-0"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>{" "}
                  Menyimpan...
                </>
              ) : isSubmitted ? (
                <>
                  <svg
                    className="w-5 h-5"
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
                  </svg>{" "}
                  Tersimpan di Leaderboard
                </>
              ) : !isActivityValidForLeaderboard ? (
                <>
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>{" "}
                  Bukan Tanggal Event
                </>
              ) : (
                <>
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>{" "}
                  Setor ke Leaderboard
                </>
              )}
            </button>

            {/* TOMBOL EXPORT IG STORY (Tetap Bebas Dipakai Kapan Saja) */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full bg-[#FC4C02] hover:bg-[#E34402] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(252,76,2,0.3)] transition-all hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{" "}
                  Memproses...
                </>
              ) : (
                <>
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>{" "}
                  Export IG Story
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
