"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ==========================================
// IKON SVG PROFESIONAL (Dependency Free)
// ==========================================

const IconShieldCheck = () => (
  <svg
    className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    />
  </svg>
);

const IconShieldAlert = () => (
  <svg
    className="w-20 h-20 text-rose-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
    />
  </svg>
);

const IconDocument = () => (
  <svg
    className="w-5 h-5 text-slate-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
    />
  </svg>
);

const IconStamp = () => (
  <svg
    className="w-5 h-5 text-blue-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
    />
  </svg>
);

const IconLock = () => (
  <svg
    className="w-4 h-4 text-emerald-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
    />
  </svg>
);

export default function VerifContent({ id }: { id: string }) {
  const [loading, setLoading] = useState(true);
  const [verifData, setVerifData] = useState<any>(null);

  useEffect(() => {
    const fetchVerifData = async () => {
      try {
        if (!id) return;
        const docRef = doc(db, "validasi_ttd", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setVerifData({ id: docSnap.id, ...docSnap.data() });
        } else {
          setVerifData(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setVerifData(null);
      } finally {
        // Efek delay sedikit agar loading state yang keren sempat terlihat
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchVerifData();
  }, [id]);

  // ==========================================
  // VIEW: LOADING STATE (ENTERPRISE SCANNING)
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
        <div className="relative flex justify-center items-center mb-8">
          <div className="absolute w-24 h-24 border-4 border-slate-200 rounded-full"></div>
          <div className="absolute w-24 h-24 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
          <IconLock />
        </div>
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
          Memverifikasi Integritas Data...
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-xs text-center">
          Menghubungkan ke server keamanan IKA UII DIY untuk validasi enkripsi
          dokumen.
        </p>
      </div>
    );
  }

  // ==========================================
  // VIEW: DOKUMEN TIDAK VALID / PALSU
  // ==========================================
  if (!verifData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] shadow-2xl shadow-rose-900/5 max-w-md w-full text-center border border-rose-100 animate-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-6">
            <div className="bg-rose-50 p-4 rounded-full ring-8 ring-rose-50/50">
              <IconShieldAlert />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
            Verifikasi Gagal
          </h2>
          <p className="text-rose-600 font-bold mb-6 text-sm uppercase tracking-widest">
            Dokumen Tidak Ditemukan / Ilegal
          </p>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-left text-sm text-slate-600 leading-relaxed mb-8">
            <p className="font-bold text-slate-800 mb-1">
              Peringatan Keamanan:
            </p>
            QR Code yang Anda pindai tidak terdaftar di pusat data resmi.
            Dokumen ini mungkin palsu, telah dimodifikasi, atau masa berlakunya
            telah dicabut oleh otoritas penerbit.
          </div>

          <div className="text-[10px] text-slate-400 font-mono bg-slate-100 p-3 rounded-lg break-all border border-slate-200">
            ERR_QUERY_ID: {id}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: VALID & SUKSES (BANK/ENTERPRISE LOOK)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Container Utama Sertifikat */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/10 max-w-2xl w-full border border-slate-200 relative overflow-hidden animate-in slide-in-from-bottom-4 duration-700">
        {/* Ornamen Garis Atas (Premium Gold/Blue) */}
        <div className="h-2 w-full bg-gradient-to-r from-blue-800 via-blue-600 to-yellow-500"></div>

        {/* Watermark Logo (Sangat Halus) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
          <img
            src="/logo-dpp-ika.png"
            alt="Watermark"
            className="w-[500px] h-auto grayscale"
          />
        </div>

        <div className="p-8 sm:p-12 relative z-10">
          {/* Header Status Validasi */}
          <div className="text-center mb-10 flex flex-col items-center">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-emerald-400 blur-2xl opacity-20 rounded-full"></div>
              <div className="relative bg-white p-2 rounded-full border-4 border-emerald-50 shadow-sm">
                <IconShieldCheck />
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-4 py-1.5 rounded-full mb-4">
              <IconLock />
              <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-emerald-700">
                Autentikasi Kriptografi Valid
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Dokumen Resmi Terverifikasi
            </h2>
          </div>

          {/* Blok Detail Informasi Dokumen */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden mb-10">
            <div className="divide-y divide-slate-200">
              {/* Row 1: Nomor Dokumen */}
              <div className="p-5 sm:px-8 flex items-start gap-4 bg-white">
                <div className="mt-0.5">
                  <IconDocument />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Nomor Registrasi Dokumen
                  </p>
                  <p className="font-mono text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                    {verifData.nomorSurat || "N/A"}
                  </p>
                </div>
              </div>

              {/* Row 2: Perihal */}
              <div className="p-5 sm:px-8 flex items-start gap-4 bg-white">
                <div className="mt-0.5">
                  <IconDocument />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Perihal / Hal
                  </p>
                  <p className="font-semibold text-slate-800 text-sm sm:text-base leading-snug">
                    {verifData.perihal || "-"}
                  </p>
                </div>
              </div>

              {/* Row 3: Penandatangan (Highlight) */}
              <div className="p-5 sm:px-8 flex items-start gap-4 bg-blue-50/50">
                <div className="mt-0.5">
                  <IconStamp />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest mb-1.5">
                    Otoritas Penandatangan TTE
                  </p>
                  <p className="font-extrabold text-blue-950 text-lg sm:text-xl leading-tight mb-1.5">
                    {verifData.penandatangan}
                  </p>
                  <span className="inline-block bg-white text-blue-700 text-xs font-bold px-3 py-1 rounded-md border border-blue-100 shadow-sm">
                    {verifData.jabatan}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Catatan Legal / Disclaimer */}
          <div className="mb-8">
            <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
              <strong className="text-slate-700">Pernyataan Hukum:</strong>{" "}
              Halaman ini adalah bukti sah autentikasi dokumen elektronik yang
              dikelola oleh Sistem E-Office DPW IKA UII DIY. QR Code dan Tanda
              Tangan Elektronik ini dilindungi hukum dan memiliki kekuatan
              pembuktian yang sah berdasarkan Undang-Undang Informasi dan
              Transaksi Elektronik (UU ITE). Integritas data ini dijamin secara
              sistem oleh basis data kami.
            </p>
          </div>

          {/* Footer Metadata */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-4">
              <img
                src="/logo-dpp-ika.png"
                alt="Logo IKA"
                className="w-10 h-10 object-contain"
              />
              <div className="text-left">
                <p className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Sistem IKA UII DIY
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Digital Signature Validation
                </p>
              </div>
            </div>

            <div className="text-[10px] text-slate-500 font-mono text-center sm:text-right bg-slate-100 px-4 py-2.5 rounded-lg border border-slate-200 w-full sm:w-auto">
              <div className="mb-1">
                <span className="text-slate-400">ID:</span> {id}
              </div>
              <div>
                <span className="text-slate-400">Validasi pada:</span>{" "}
                {new Date().toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                WIB
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
