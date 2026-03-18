"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ==========================================
// IKON SVG PROFESIONAL (Dependency Free)
// ==========================================

// Ikon Perisai Centang (Authoritative Success)
const IconShieldCheck = () => (
  <svg className="w-20 h-20 text-emerald-500 print:text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
  </svg>
);

// Ikon Perisai Silang (Authoritative Error)
const IconShieldAlert = () => (
  <svg className="w-20 h-20 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

// Ikon Dokumen Teks
const IconDocument = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

// Ikon Stempel Jabatan
const IconStamp = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
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
        setLoading(false);
      }
    };
    fetchVerifData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-slate-200 border-t-[#004A99] rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-semibold text-slate-700 animate-pulse">Mengontak Server Keamanan...</h2>
        <p className="text-sm text-slate-500 mt-2">Sedang memverifikasi integritas enkripsi dokumen.</p>
      </div>
    );
  }

  // ==========================================
  // VIEW: DOKUMEN TIDAK VALID / PALSU
  // ==========================================
  if (!verifData) {
    return (
      <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-10 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] max-w-md w-full text-center border border-red-100">
          <div className="flex justify-center mb-6">
            <IconShieldAlert />
          </div>
          <h2 className="text-3xl font-extrabold text-red-700 mb-3 tracking-tight">Peringatan Keamanan</h2>
          <p className="text-lg font-bold text-slate-800 mb-6">Dokumen Ini Tidak Sah</p>
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-justify text-sm text-red-900 leading-relaxed mb-8">
            <b>Alasan:</b> QR Code yang Anda pindai tidak terdaftar di *database* resmi DPW IKA UII DIY. Dokumen mungkin palsu, telah dimodifikasi secara ilegal, atau masa berlakunya telah ditarik oleh penandatangan.
          </div>
          <div className="text-xs text-slate-400 font-mono bg-slate-100 p-3 rounded-md break-all">
            Query ID: {id}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: VALID & SUKSES (ENTERPRISE LOOK)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F4F7FA] flex flex-col items-center justify-center p-4 md:p-8">
      
      {/* Kartu Sertifikat Verifikasi Utama */}
      <div className="bg-white rounded-[2.5rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] max-w-xl w-full border border-slate-100 relative overflow-hidden">
        
        {/* Border Emas/Kuning Atas (Tanda Keaslian) */}
        <div className="h-2.5 w-full bg-[#E6B014]"></div>
        
        {/* Watermark Logo Background */}
        <img src="/logo-dpp-ika.png" alt="Watermark" className="absolute -right-20 -bottom-20 w-80 h-80 opacity-[0.03] pointer-events-none" />

        <div className="p-8 sm:p-12 relative z-10">
          
          {/* Header Verifikasi */}
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="mb-6 bg-emerald-50 p-2 rounded-full border-4 border-emerald-100 shadow-inner">
              <IconShieldCheck />
            </div>
            <h1 className="text-xs uppercase font-extrabold tracking-[0.25em] text-emerald-700 bg-emerald-50 px-5 py-1.5 rounded-full mb-3">
              Autentikasi Digital Sukses
            </h1>
            <h2 className="text-4xl font-extrabold text-[#001D3D] tracking-tighter leading-none">
              Dokumen Terverifikasi
            </h2>
          </div>

          {/* Blok Detail Dokumen (Clean Grid) */}
          <div className="space-y-6 mb-12">
            
            {/* Nomor Surat */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-xl mt-1"><IconDocument /></div>
              <div className="flex-1 pb-4 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Dokumen Resmi</p>
                <p className="font-mono text-lg font-bold text-[#001D3D] tracking-tight">{verifData.nomorSurat || "N/A"}</p>
              </div>
            </div>

            {/* Perihal */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-xl mt-1"><IconDocument /></div>
              <div className="flex-1 pb-4 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Perihal / Nama Kegiatan</p>
                <p className="font-semibold text-slate-800 text-base leading-snug">{verifData.perihal || "-"}</p>
              </div>
            </div>

            {/* Penandatangan (Highlighted) */}
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#E6F0FB] rounded-xl mt-1"><IconStamp /></div>
                  <div className="flex-1 bg-[#F4F9FF] p-5 rounded-2xl border border-[#E1EEFB]">
                    <p className="text-[11px] font-bold text-[#004A99] uppercase tracking-widest mb-1.5">Otoritas Penandatangan</p>
                    <p className="font-extrabold text-[#001D3D] text-xl leading-tight">{verifData.penandatangan}</p>
                    <p className="text-sm text-[#004A99] font-semibold mt-1 bg-white inline-block px-3 py-0.5 rounded-full border border-[#D0E6F8]">
                      {verifData.jabatan}
                    </p>
                  </div>
                </div>
          </div>

          {/* Catatan Kaki Hukum */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-justify mb-10 page-break-inside-avoid">
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <b>Catatan Yuridis:</b> Halaman ini adalah bukti sah autentikasi dokumen elektronik yang dikelola oleh Sistem Validasi IKA UII DIY. QR Code dan Tanda Tangan Elektronik ini dilindungi hukum dan memiliki kekuatan hukum yang sama dengan tanda tangan basah berdasarkan UU ITE. Integritas data ini dijamin oleh sistem enkripsi *database* kami.
            </p>
          </div>

          {/* Footer Logo & Time */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-100 text-center sm:text-left">
             <div className="flex items-center gap-3">
               <img src="/logo-dpp-ika.png" alt="Logo IKA" className="w-12 h-12" />
               <div>
                 <p className="font-bold text-sm text-[#001D3D]">Sistem Informasi IKA UII DIY</p>
                 <p className="text-xs text-slate-500">integrity • unity • alumni power</p>
               </div>
             </div>
             <div className="text-xs text-slate-400 font-mono text-center sm:text-right bg-slate-100 p-3 rounded-lg w-full sm:w-auto break-all">
                Verified ID: <span className="text-slate-600">{id}</span> <br/>
                Server Time: {new Date().toLocaleDateString("id-ID", {day:"numeric", month:"long", year:"numeric"})}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}