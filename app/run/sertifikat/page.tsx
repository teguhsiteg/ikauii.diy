"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import RunNavbar from "@/components/run/RunNavbar";
import RunFooter from "@/components/run/RunFooter";
import { Search, Award, CheckCircle2, Download, AlertCircle, HelpCircle, FileText, ArrowRight } from "lucide-react";

export default function DownloadSertifikatPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Form State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Result State
  const [participant, setParticipant] = useState<any>(null);
  const [certImageBase64, setCertImageBase64] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "virtual_run"));
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Gagal memuat pengaturan:", error);
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // --- LOGIKA PENCARIAN PESERTA (INDIVIDU & KOMUNITAS) ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMsg("");
    setParticipant(null);
    setCertImageBase64(null);

    const queryText = searchQuery.trim().toUpperCase();

    try {
      let foundUser = null;

      // 1. CARI DI DATA INDIVIDU (Berdasarkan NIK atau BIB)
      const individuRef = collection(db, "offline_participants");
      const qIndividuNik = query(
        individuRef,
        where("nik", "==", queryText),
        where("statusPembayaran", "==", "Lunas"),
      );
      const snapNik = await getDocs(qIndividuNik);

      if (!snapNik.empty) {
        foundUser = snapNik.docs[0].data();
      } else {
        const qIndividuBib = query(
          individuRef,
          where("nomorBIB", "==", queryText),
          where("statusPembayaran", "==", "Lunas"),
        );
        const snapBib = await getDocs(qIndividuBib);
        if (!snapBib.empty) {
          foundUser = snapBib.docs[0].data();
        }
      }

      // 2. JIKA TIDAK KETEMU DI INDIVIDU, CARI DI KOMUNITAS
      if (!foundUser) {
        const komunitasRef = collection(db, "pendaftaran_komunitas");
        const qKomunitas = query(
          komunitasRef,
          where("statusPembayaran", "==", "Lunas"),
        );
        const snapKomunitas = await getDocs(qKomunitas);

        for (const docSnap of snapKomunitas.docs) {
          const groupData = docSnap.data();
          const members = groupData.participants || [];

          const match = members.find(
            (m: any) =>
              m.nik === queryText ||
              m.nomorBIB === queryText ||
              m.bib === queryText,
          );
          if (match) {
            foundUser = match;
            break;
          }
        }
      }

      if (foundUser) {
        setParticipant({
          namaLengkap:
            foundUser.namaBib || foundUser.namaLengkap || foundUser.nama,
          nomorBIB: foundUser.nomorBIB || foundUser.bib || "-",
          jarak: foundUser.jarak || foundUser.kategori || "Umum",
        });
      } else {
        setErrorMsg(
          "Data peserta tidak ditemukan. Pastikan Anda memasukkan Nomor BIB atau NIK yang terdaftar dan lunas.",
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(
        "Terjadi kesalahan saat mencari data. Silakan coba beberapa saat lagi.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  // --- LOGIKA GENERATE SERTIFIKAT CANVAS ---
  const generateCertificate = () => {
    if (!participant || !settings) return;

    const templateUrl =
      settings.urlSertifikatOffline || settings.urlSertifikatVirtual;

    if (!templateUrl) {
      setErrorMsg("Admin belum mengunggah template sertifikat pada pengaturan event.");
      return;
    }

    setIsGenerating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = templateUrl;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Gambar Template Dasar
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Tulis Data Peserta
      ctx.textAlign = "center";
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.font = "bold 80px Arial";
      ctx.fillStyle = "#0B2239";
      ctx.fillText(
        participant.namaLengkap.toUpperCase(),
        centerX,
        centerY + 20,
      );

      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#F9AB00";
      ctx.fillText(
        `BIB: ${participant.nomorBIB}  |  KATEGORI: ${participant.jarak}`,
        centerX,
        centerY + 100,
      );

      // 3. Konversi ke Gambar
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setCertImageBase64(dataUrl);
      setIsGenerating(false);

      // 4. Otomatis Download
      const evName = (settings?.offlineJudul || "Sertifikat").replace(/\s+/g, "_");
      const link = document.createElement("a");
      link.download = `E-Sertifikat_${evName}_${participant.namaLengkap.replace(/\s+/g, "_")}.jpg`;
      link.href = dataUrl;
      link.click();
    };

    img.onerror = () => {
      setIsGenerating(false);
      setErrorMsg(
        "Gagal memuat file template sertifikat. Pastikan file gambar dapat diakses.",
      );
    };
  };

  const eventTitle = settings?.offlineJudul || "SEMBADA RUN 2026";

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#0B2239] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col selection:bg-[#FCD116] selection:text-[#0B2239]">
      <RunNavbar eventName={eventTitle} />

      {/* --- HERO HEADER SECTION --- */}
      <section className="bg-[#0B2239] text-white pt-32 pb-16 px-4 md:px-8 relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FCD116_1px,transparent_1px)] [background-size:24px_24px]"></div>
        
        <div className="max-w-5xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 px-4 py-1.5 rounded-full text-xs font-bold text-[#FCD116] uppercase tracking-wider mb-4">
            <Award className="w-4 h-4" />
            Official Finisher Certificate
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 text-white">
            Unduh E-Sertifikat Finisher
          </h1>
          <p className="text-slate-300 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Selamat atas keberhasilan Anda menyelesaikan rute lari di <span className="font-bold text-[#FCD116]">{eventTitle}</span>. Dapatkan sertifikat digital resmi beresolusi tinggi di bawah ini.
          </p>
        </div>
      </section>

      {/* --- MAIN CONTENT (2-COLUMN INTEGRATED PORTAL) --- */}
      <main className="flex-grow max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* KOLOM KIRI: PANDUAN & INFORMASI */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-7 border border-slate-200/80 shadow-sm">
              <h2 className="text-base font-bold text-[#0B2239] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1A73E8]" />
                Cara Mengunduh Sertifikat
              </h2>
              <ol className="space-y-4 text-xs sm:text-sm text-slate-600">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1A73E8] font-bold flex items-center justify-center shrink-0 text-xs border border-blue-100">
                    1
                  </span>
                  <span>Masukkan <strong>Nomor BIB</strong> (contoh: <code>3501</code>) atau <strong>NIK KTP</strong> yang didaftarkan.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1A73E8] font-bold flex items-center justify-center shrink-0 text-xs border border-blue-100">
                    2
                  </span>
                  <span>Klik tombol <strong>"Cari Data Peserta"</strong> untuk memvalidasi status kelulusan Anda.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-[#1A73E8] font-bold flex items-center justify-center shrink-0 text-xs border border-blue-100">
                    3
                  </span>
                  <span>Tekan tombol <strong>"Unduh E-Sertifikat (HD)"</strong> untuk menyimpan gambar sertifikat ke perangkat Anda.</span>
                </li>
              </ol>
            </div>

            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 text-xs text-amber-900 leading-relaxed space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <HelpCircle className="w-4 h-4" /> Butuh Bantuan?
              </div>
              <p>
                Jika data Anda tidak ditemukan, pastikan pendaftaran Anda telah berstatus lunas atau hubungi panitia melalui kanal resmi info acara.
              </p>
              <div className="pt-2">
                <Link
                  href="/leaderboard-offline"
                  className="inline-flex items-center gap-1 font-bold text-[#0B2239] hover:underline"
                >
                  Cek Klasemen di Leaderboard <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* KOLOM KANAN: FORM PENCARIAN & KARTU HASIL */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm">
              <h2 className="text-lg font-black text-[#0B2239] mb-1">
                Pencarian Data Finisher
              </h2>
              <p className="text-xs text-slate-500 mb-6 font-medium">
                Ketik Nomor BIB atau NIK Anda untuk memuat sertifikat
              </p>

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Masukkan Nomor BIB atau NIK..."
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#0B2239] focus:ring-2 focus:ring-[#0B2239]/10 outline-none text-sm font-bold text-slate-800 transition-all uppercase placeholder:normal-case placeholder:font-normal placeholder:text-slate-400"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSearching}
                  className="w-full bg-[#0B2239] hover:bg-[#152B5B] text-[#FCD116] font-bold py-3.5 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-[#FCD116]/30 border-t-[#FCD116] rounded-full animate-spin"></div>
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Cari Data Peserta
                </button>
              </form>

              {/* Error Alert */}
              {errorMsg && (
                <div className="mt-5 p-4 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-100 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* HASIL PENCARIAN & DOWNLOAD */}
              {participant && (
                <div className="mt-6 pt-6 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-5 mb-5">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Data Finisher Terverifikasi
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Nama Lengkap</span>
                        <span className="font-bold text-slate-800 text-sm">{participant.namaLengkap}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Nomor BIB</span>
                        <span className="font-bold text-[#1A73E8] font-mono text-sm">{participant.nomorBIB}</span>
                      </div>
                      <div className="col-span-2 pt-1">
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Kategori Jarak</span>
                        <span className="font-bold text-slate-700">{participant.jarak}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={generateCertificate}
                    disabled={isGenerating}
                    className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-4 px-6 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Memproses Sertifikat HD...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Unduh E-Sertifikat (HD JPG)
                      </>
                    )}
                  </button>

                  {certImageBase64 && (
                    <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Pratinjau Sertifikat
                      </div>
                      <img
                        src={certImageBase64}
                        alt="E-Sertifikat"
                        className="w-full h-auto object-contain bg-slate-100"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Hidden Canvas untuk Rendering */}
      <canvas ref={canvasRef} className="hidden" />

      <RunFooter eventName={eventTitle} />
    </div>
  );
}
