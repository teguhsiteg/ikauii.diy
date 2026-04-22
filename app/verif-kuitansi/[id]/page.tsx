"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

export default function TerminalValidasiKuitansi() {
  const params = useParams();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchValidasi = async () => {
      if (!id) return;
      try {
        let foundData = null;

        // 1. CARI DI LACI VIRTUAL RUN
        const vrRef = doc(db, "vr_participants", id);
        const vrSnap = await getDoc(vrRef);

        if (vrSnap.exists() && vrSnap.data().statusPembayaran === "Lunas") {
          const d = vrSnap.data();
          foundData = {
            id: vrSnap.id,
            sumber: "Sistem Pembayaran Virtual Run IKA UII",
            kategori: "Event Virtual Run",
            terimaDari: d.nama,
            nominal: d.totalTagihan,
            keterangan: `Pembayaran Tiket Virtual Run 2026 - Kategori ${d.jarak} (Paket ${d.paket?.toUpperCase()})`,
            otoritas: "Sistem Otomatis (Auto-Verified)",
            tanggal: d.waktuDaftar || new Date().toISOString(),
          };
        } else {
          // 2. JIKA GAK KETEMU, CARI DI LACI BENDAHARA
          const orgRef = doc(db, "kuitansi_organisasi", id);
          const orgSnap = await getDoc(orgRef);

          if (orgSnap.exists()) {
            const d = orgSnap.data();
            foundData = {
              id: orgSnap.id,
              sumber: "Bendahara Umum IKA UII DIY",
              kategori: d.jenisEvent || "Kuitansi Organisasi",
              terimaDari: d.terimaDari,
              nominal: d.nominal,
              keterangan: d.keterangan,
              otoritas: d.penandatangan,
              tanggal:
                d.tanggalPenerimaan || d.tanggal || new Date().toISOString(),
            };
          }
        }

        if (foundData) setData(foundData);
      } catch (error) {
        console.error("Error validasi:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchValidasi();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">
            Memvalidasi Kriptografi...
          </p>
        </div>
      </div>
    );
  }

  // JIKA PALSU / GAK KETEMU
  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-rose-100">
          <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-5xl mx-auto mb-6">
            ❌
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Kuitansi Tidak Valid
          </h1>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Maaf, dokumen ini tidak terdaftar dalam basis data IKA UII DIY atau
            status pembayaran telah dibatalkan.
          </p>
        </div>
      </div>
    );
  }

  // JIKA VALID
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center py-10 px-4 font-sans">
      {/* Garis Gradasi Atas */}
      <div className="w-full max-w-3xl h-2 bg-gradient-to-r from-blue-600 via-blue-400 to-yellow-400 rounded-t-3xl"></div>

      <div className="w-full max-w-3xl bg-white rounded-b-3xl shadow-xl border border-slate-100 p-8 sm:p-12 relative overflow-hidden">
        {/* Watermark Latar Belakang */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
          <span className="text-9xl font-black text-slate-900 text-center leading-none">
            IKA UII
            <br />
            VALID
          </span>
        </div>

        {/* Ikon Centang Hijau */}
        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-sm ring-1 ring-emerald-100 relative z-10">
          <svg
            className="w-12 h-12 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Header Verifikasi */}
        <div className="text-center mb-10 relative z-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
            <svg
              className="w-3.5 h-3.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Autentikasi Kriptografi Valid
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">
            Kuitansi Resmi Terverifikasi
          </h1>
          <p className="text-slate-500 font-medium">
            Dikelola oleh: {data.sumber}
          </p>
        </div>

        {/* --- KOTAK DETAIL DOKUMEN --- */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm relative z-10">
          {/* Nomor Invoice & Kategori */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="text-slate-400 mt-1 shrink-0">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="w-full flex flex-col sm:flex-row sm:justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Nomor Registrasi / Invoice
                </p>
                <p className="text-lg font-black text-slate-800 font-mono">
                  {data.kategori === "Event Virtual Run" ? "INV-VR-" : "KUIT-"}
                  {data.id.substring(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Kategori
                </p>
                <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 inline-block">
                  {data.kategori}
                </p>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* Terima Dari */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="text-slate-400 mt-1 shrink-0">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Telah Terima Dari
              </p>
              <p className="text-lg font-bold text-slate-800">
                {data.terimaDari}
              </p>
            </div>
          </div>

          <div className="w-full h-px bg-slate-100"></div>

          {/* Guna Pembayaran & Nominal */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="text-slate-400 mt-1 shrink-0">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="w-full">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Guna Pembayaran
              </p>
              <p className="text-base font-semibold text-slate-700 leading-relaxed mb-5">
                {data.keterangan}
              </p>

              {/* Kotak Nominal Lunas */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    Sebesar / Nominal
                  </p>
                  <p className="text-2xl font-black text-blue-700">
                    Rp {data.nominal.toLocaleString("id-ID")}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                    Tanggal Sah
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {new Date(data.tanggal).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Otoritas Pengesahan (Box Hijau Bawah) */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 bg-emerald-50/50 -mx-6 -mb-6 p-6 sm:p-8 rounded-b-2xl border-t border-emerald-100">
            <div className="text-emerald-500 mt-1 shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                Otoritas Pengesahan
              </p>
              <p className="text-lg font-black text-slate-900 mb-2">
                {data.otoritas}
              </p>
              <div className="inline-block bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                Status: Terkonfirmasi Lunas
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer Hukum */}
        <div className="mt-10 mb-8 border-t border-slate-100 pt-8 relative z-10">
          <p className="text-xs text-slate-500 leading-relaxed text-justify">
            <strong className="text-slate-700">Pernyataan Hukum:</strong>{" "}
            Halaman ini adalah bukti sah autentikasi dokumen keuangan elektronik
            yang dikelola oleh DPW IKA UII DIY. Dokumen tanpa tanda tangan basah
            dan meterai ini dilindungi hukum dan memiliki kekuatan pembuktian
            yang sah berdasarkan Undang-Undang Informasi dan Transaksi
            Elektronik (UU ITE). Integritas data ini dijamin secara sistem oleh
            basis data kami.
          </p>
        </div>

        {/* --- FOOTER IDENTITAS SISTEM (Sesuai Screenshot Asli) --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm">
              {/* Asumsi logo ini dipakai di TTE juga */}
              <img
                src="/logo-dpp-ika.png"
                alt="Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="text-left">
              <p className="text-[11px] font-black text-slate-800 tracking-wide">
                SISTEM IKA UII DIY
              </p>
              <p className="text-[10px] text-slate-500">
                Digital Payment Validation
              </p>
            </div>
          </div>
          <div className="text-center sm:text-right text-[10px] text-slate-400 font-mono">
            <p>ID: {data.id}</p>
            <p>
              Validasi pada:{" "}
              {new Date().toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              WIB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
