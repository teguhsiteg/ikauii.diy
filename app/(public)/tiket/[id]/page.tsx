"use client";

import { useEffect, useState, use } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export default function TiketDigitalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [peserta, setPeserta] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTiket = async () => {
      try {
        const docRef = doc(db, "agenda_peserta", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setPeserta({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Gagal memuat tiket:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTiket();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!peserta) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <h2 className="text-2xl font-black text-blue-950">
          Tiket Tidak Ditemukan
        </h2>
        <p className="text-slate-500">
          ID Tiket tidak valid atau telah dihapus.
        </p>
        <a href="/" className="text-blue-600 font-bold hover:underline mt-4">
          &larr; Beranda
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavbarPublic />

      {/* Dibuat max-w-md dan dipusatkan agar tampil elegan seperti kartu asli */}
      <main className="flex-grow max-w-md mx-auto px-6 py-32 w-full flex flex-col items-center">
        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-blue-950 mb-2">
            Digital ID & Tiket
          </h1>
          <p className="text-slate-500">
            Tunjukkan QR Code ini kepada panitia saat kedatangan.
          </p>
        </div>

        {/* KARTU IDENTITAS DIGITAL (ID CARD) */}
        <div className="w-full bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden relative group transform transition-all hover:-translate-y-1">
          {/* Hiasan Visual ID Card */}
          <div className="bg-gradient-to-br from-blue-900 to-blue-950 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-bl-full blur-xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-tr-full blur-xl pointer-events-none"></div>

            {/* Filter Putih Dihilangkan, Ukuran Logo Dipercantik */}
            <img
              src="/logo-dpp-ika.png"
              className="w-24 md:w-28 object-contain mx-auto mb-4 relative z-10 drop-shadow-md"
              alt="logo"
            />

            <h2 className="text-yellow-400 text-[10px] font-black tracking-[0.2em] uppercase relative z-10 mb-1">
              Pass Acara
            </h2>
            <p className="text-white font-bold text-lg line-clamp-1 relative z-10">
              {peserta.agendaJudul}
            </p>
          </div>

          <div className="p-8 text-center">
            {/* QR Code Murni */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 inline-block shadow-sm mb-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${peserta.id}`}
                alt="QR Code"
                className="w-40 h-40 md:w-48 md:h-48 mix-blend-multiply"
              />
            </div>

            <h3 className="text-2xl font-black text-blue-950 leading-tight mb-1">
              {peserta.nama}
            </h3>
            <p className="text-sm font-bold text-slate-500 mb-6">
              {peserta.fakultas} • Angkatan {peserta.angkatan}
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Tiket Valid
                </p>
                <p className="font-black text-blue-900">
                  {peserta.jumlahTiket} Orang
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Status Gate
                </p>
                {peserta.statusCheckIn ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>{" "}
                    Telah Hadir
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>{" "}
                    Belum Scan
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <FooterPublic />
    </div>
  );
}
