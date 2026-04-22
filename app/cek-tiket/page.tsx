"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, where } from "firebase/firestore";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export default function CekTiketPage() {
  const [agendaList, setAgendaList] = useState<any[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Pencarian
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // 1. FETCH AGENDA AKTIF
  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const q = query(collection(db, "agenda"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setAgendaList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Gagal memuat agenda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgendas();
  }, []);

  // 2. FUNGSI PENCARIAN TIKET
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setErrorMsg("");
    setSearchResult(null);

    const cleanQuery = searchQuery.trim();

    try {
      const q = query(
        collection(db, "agenda_peserta"),
        where("agendaId", "==", selectedAgenda.id),
        where("whatsapp", "==", cleanQuery),
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        setSearchResult({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setErrorMsg(
          "Tiket tidak ditemukan. Pastikan Nomor WhatsApp sama persis dengan saat mendaftar.",
        );
      }
    } catch (error) {
      setErrorMsg("Terjadi kesalahan jaringan. Silakan coba lagi.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setSelectedAgenda(null);
    setSearchResult(null);
    setSearchQuery("");
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* ================= MEMANGGIL NAVBAR COMPONENT ================= */}
      <NavbarPublic />

      {/* ================= KONTEN UTAMA ================= */}
      {/* PERBAIKAN: pt-32 (padding-top besar) agar tidak tertutup header melayang */}
      <main className="flex-grow flex flex-col items-center pt-32 md:pt-40 pb-12 px-4">
        {!selectedAgenda ? (
          /* TAMPILAN 1: PILIH AGENDA */
          <div className="max-w-2xl w-full text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg border-4 border-blue-100">
              🔍
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-blue-950 mb-4 tracking-tight">
              Cari Tiket Kehadiran
            </h2>
            <p className="text-slate-500 font-medium px-4 mb-10">
              Silakan pilih agenda acara di bawah ini untuk mencari dan
              menampilkan QR Code tiket masuk Anda.
            </p>

            {isLoading ? (
              <div className="text-center py-10 text-slate-400 font-bold text-sm animate-pulse">
                Memuat daftar acara...
              </div>
            ) : (
              <div className="grid gap-4 text-left">
                {agendaList.map((agenda) => (
                  <button
                    key={agenda.id}
                    onClick={() => setSelectedAgenda(agenda)}
                    className="bg-white p-6 border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-xl transition-all shadow-sm group flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] font-black text-blue-600 mb-1 uppercase tracking-widest">
                        {agenda.tanggal}
                      </div>
                      <h3 className="font-black text-slate-800 text-xl group-hover:text-blue-700 transition-colors">
                        {agenda.judul}
                      </h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors shrink-0 ml-4 border border-slate-100">
                      <span className="text-blue-500 font-bold">&rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAMPILAN 2: FORM PENCARIAN & HASIL TIKET */
          <div className="max-w-md w-full animate-in slide-in-from-bottom-4 duration-500">
            <button
              onClick={handleReset}
              className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest mb-6 flex items-center gap-2"
            >
              &larr; Ganti Acara
            </button>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-blue-950 p-6 text-center border-b-4 border-yellow-400">
                <h3 className="text-xl font-black text-white leading-tight">
                  {selectedAgenda.judul}
                </h3>
              </div>

              <div className="p-6 md:p-8">
                {!searchResult ? (
                  <form onSubmit={handleSearch} className="flex flex-col gap-4">
                    <div className="text-center mb-4">
                      <p className="text-sm font-bold text-slate-600">
                        Masukkan Nomor WhatsApp yang Anda gunakan saat
                        mendaftar.
                      </p>
                    </div>

                    {errorMsg && (
                      <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-lg text-center border border-red-100">
                        {errorMsg}
                      </div>
                    )}

                    <div>
                      <input
                        type="text"
                        required
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Contoh: 081234567890"
                        className="w-full text-center font-bold text-lg px-4 py-4 rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSearching}
                      className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 flex justify-center items-center gap-2 uppercase tracking-widest text-sm"
                    >
                      {isSearching ? "Mencari..." : "Cari Tiket Saya"}
                    </button>
                  </form>
                ) : (
                  <div className="text-center animate-in zoom-in duration-300">
                    <div className="inline-block bg-green-100 text-green-700 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest mb-6 border border-green-200">
                      Tiket Ditemukan
                    </div>

                    <h4 className="text-2xl font-black text-slate-800 mb-1 leading-tight">
                      {searchResult.nama}
                    </h4>
                    <p className="text-sm font-bold text-slate-500 mb-6">
                      {searchResult.fakultas} • Angkatan {searchResult.angkatan}
                    </p>

                    <div className="bg-white border-4 border-slate-100 rounded-3xl p-4 mx-auto inline-block relative shadow-sm">
                      {searchResult.jumlahTiket > 1 && (
                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-blue-950 text-[10px] font-black py-1 px-3 rounded-full shadow-md uppercase">
                          {searchResult.jumlahTiket} Orang
                        </div>
                      )}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${searchResult.id}`}
                        alt="QR Code"
                        className="w-48 h-48 md:w-56 md:h-56 mx-auto"
                      />
                    </div>

                    <p className="text-[10px] font-mono font-bold text-slate-400 mt-4 tracking-widest uppercase">
                      ID: {searchResult.id.slice(0, 12)}...
                    </p>

                    <div className="mt-8 bg-blue-50 p-4 rounded-xl border border-blue-100">
                      <p className="text-xs font-bold text-blue-800 mb-1">
                        📸 Screenshot halaman ini!
                      </p>
                      <p className="text-[10px] text-blue-600">
                        Tunjukkan QR Code ini kepada petugas di meja registrasi
                        saat Anda tiba di lokasi.
                      </p>
                    </div>

                    <button
                      onClick={() => setSearchResult(null)}
                      className="mt-6 text-xs font-bold text-slate-500 hover:text-slate-800 underline"
                    >
                      Cari tiket lain
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MEMANGGIL FOOTER COMPONENT ================= */}
      <FooterPublic />
    </div>
  );
}
