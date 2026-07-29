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
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

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

  // --- 🔥 LOGIKA PENCARIAN PESERTA (INDIVIDU & KOMUNITAS) 🔥 ---
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

      // 1. CARI DI DATA INDIVIDU DULU (Cari berdasarkan NIK atau BIB)
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
            break; // Stop looping kalau sudah ketemu
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
          "Data peserta tidak ditemukan. Pastikan Anda memasukkan NIK atau Nomor BIB yang benar  .",
        );
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(
        "Terjadi kesalahan pada sistem. Silakan coba beberapa saat lagi.",
      );
    } finally {
      setIsSearching(false);
    }
  };

  // --- 🔥 LOGIKA GENERATE SERTIFIKAT HTML CANVAS 🔥 ---
  const generateCertificate = () => {
    if (!participant || !settings) return;

    // Ambil URL template sertifikat dari Admin (Fallback ke logo/default jika kosong)
    const templateUrl =
      settings.urlSertifikatOffline || settings.urlSertifikatVirtual;

    if (!templateUrl) {
      setErrorMsg("Admin belum mengunggah template sertifikat.");
      return;
    }

    setIsGenerating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "Anonymous"; // Sangat penting agar tidak error CORS
    img.src = templateUrl;

    img.onload = () => {
      // Set ukuran canvas sesuai resolusi gambar template asli
      canvas.width = img.width;
      canvas.height = img.height;

      // 1. Gambar Template Dasar
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Setting Style Font
      ctx.textAlign = "center";

      // ========================================================
      // 💡 PENTING: BAGIAN KOORDINAT X dan Y DI BAWAH INI
      // NANTI BISA DISESUAIKAN DENGAN DESAIN TEMPLATE JENENGAN
      // ========================================================

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2; // Posisi Y (Tengah)

      // Menulis Nama Peserta
      ctx.font = "bold 80px Arial"; // Ukuran font
      ctx.fillStyle = "#0B2239"; // Warna teks (Dongker UII)
      ctx.fillText(
        participant.namaLengkap.toUpperCase(),
        centerX,
        centerY + 20,
      );

      // Menulis Nomor BIB dan Kategori
      ctx.font = "bold 40px Arial";
      ctx.fillStyle = "#F9AB00"; // Warna kuning/emas
      ctx.fillText(
        `BIB: ${participant.nomorBIB}  |  KATEGORI: ${participant.jarak}`,
        centerX,
        centerY + 100,
      );

      // 3. Konversi Canvas ke URL Gambar
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCertImageBase64(dataUrl);
      setIsGenerating(false);

      // 4. Otomatis Download
      const link = document.createElement("a");
      link.download = `E-Sertifikat_${participant.namaLengkap.replace(/\s+/g, "_")}.jpg`;
      link.href = dataUrl;
      link.click();
    };

    img.onerror = () => {
      setIsGenerating(false);
      setErrorMsg(
        "Gagal memuat template sertifikat. Pastikan link gambar valid dan dapat diakses.",
      );
    };
  };

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-[#152B5B] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] font-sans flex flex-col selection:bg-[#FCD116] selection:text-[#0B2239]">
      <NavbarPublic />

      <main className="flex-grow w-full relative z-20 pt-45 pb-20">
        {/* Latar Belakang UII */}
        <div
          className="absolute top-0 left-0 w-full h-[40vh] bg-cover bg-center bg-no-repeat grayscale-[20%]"
          style={{
            backgroundImage:
              "url('https://www.uii.ac.id/wp-content/uploads/2025/03/Gerbang-UII.jpg')",
          }}
        >
          <div className="absolute inset-0 bg-[#0B2239]/90"></div>
        </div>

        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8 relative z-30">
          <div className="text-center mb-10 text-white">
            <span className="bg-white/20 text-[#FCD116] px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest backdrop-blur-sm border border-white/10 mb-4 inline-block">
              E-Certificate Portal
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              Unduh Sertifikat Finisher
            </h1>
            <p className="text-slate-300 font-medium text-sm md:text-base max-w-xl mx-auto">
              Selamat atas pencapaian Anda! Masukkan NIK atau Nomor BIB untuk
              mencari dan mengunduh E-Sertifikat resmi Anda.
            </p>
          </div>

          <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden">
            {/* FORM PENCARIAN */}
            <div className="p-8 md:p-10 border-b border-slate-100">
              <form
                onSubmit={handleSearch}
                className="flex flex-col sm:flex-row gap-4"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Masukkan NIK atau Nomor BIB..."
                  className="flex-grow px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#152B5B] outline-none text-base transition-all text-slate-800 font-bold placeholder:font-medium uppercase"
                  required
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="bg-[#152B5B] hover:bg-[#0D1B3E] text-white font-bold py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
                >
                  {isSearching ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  )}
                  Cari Data
                </button>
              </form>

              {errorMsg && (
                <div className="mt-5 p-4 bg-rose-50 text-rose-600 rounded-xl text-sm font-semibold border border-rose-100 flex items-start gap-3">
                  <svg
                    className="w-5 h-5 shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  {errorMsg}
                </div>
              )}
            </div>

            {/* HASIL PENCARIAN & TOMBOL DOWNLOAD */}
            {participant && (
              <div className="p-8 md:p-10 bg-slate-50 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-20 h-20 bg-[#E6F4EA] text-[#1E8E3E] rounded-full flex items-center justify-center mb-5 shadow-inner">
                  <svg
                    className="w-10 h-10"
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
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-1">
                  {participant.namaLengkap}
                </h3>
                <p className="text-slate-500 font-bold text-sm mb-6 bg-white px-4 py-1.5 rounded-full border border-slate-200 inline-block shadow-sm">
                  BIB:{" "}
                  <span className="text-[#1A73E8]">{participant.nomorBIB}</span>{" "}
                  • Kategori: {participant.jarak}
                </p>

                {/* Canvas disembunyikan secara visual, hanya dipakai engine untuk menggambar */}
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>

                {certImageBase64 ? (
                  <div className="w-full">
                    <p className="text-xs text-emerald-600 font-bold mb-3 uppercase tracking-widest">
                      Preview Sertifikat Anda
                    </p>
                    <div className="border-[6px] border-white shadow-xl rounded-xl overflow-hidden mb-6">
                      <img
                        src={certImageBase64}
                        alt="E-Certificate"
                        className="w-full h-auto"
                      />
                    </div>
                    <a
                      href={certImageBase64}
                      download={`E-Sertifikat_${participant.namaLengkap.replace(/\s+/g, "_")}.jpg`}
                      className="bg-[#1E8E3E] hover:bg-[#188038] text-white font-black py-4 px-8 rounded-xl shadow-lg transition-all w-full flex items-center justify-center gap-2"
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      Unduh Ulang Sertifikat
                    </a>
                  </div>
                ) : (
                  <button
                    onClick={generateCertificate}
                    disabled={isGenerating}
                    className="bg-[#FCD116] hover:bg-yellow-500 text-[#0B2239] font-black py-4 px-8 rounded-xl shadow-lg transition-all w-full sm:w-auto flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <span className="w-5 h-5 border-2 border-[#0B2239] border-t-transparent rounded-full animate-spin"></span>
                        Memproses Desain...
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
                        </svg>
                        Generate & Unduh PDF/JPG
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/run"
              className="text-slate-400 font-semibold text-sm hover:text-[#152B5B] transition-colors"
            >
              &larr; Kembali ke Beranda
            </Link>
          </div>
        </div>
      </main>

      <FooterPublic />
    </div>
  );
}
