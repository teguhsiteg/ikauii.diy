"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";

export default function StatistikPendaftarPage() {
  const [agendaList, setAgendaList] = useState<any[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);

  const [isLoadingAgenda, setIsLoadingAgenda] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // State untuk menyimpan angka
  const [totalWeb, setTotalWeb] = useState(0);
  const [totalGForm, setTotalGForm] = useState(0);

  // 1. FETCH SEMUA AGENDA SAAT HALAMAN DIBUKA
  useEffect(() => {
    const fetchAgendas = async () => {
      try {
        const q = query(collection(db, "agenda"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setAgendaList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Gagal memuat agenda:", error);
      } finally {
        setIsLoadingAgenda(false);
      }
    };
    fetchAgendas();
  }, []);

  // 2. FETCH STATISTIK SAAT AGENDA DIKLIK (DENGAN AUTO-REFRESH)
  useEffect(() => {
    if (!selectedAgenda) return; // Jangan jalankan kalau belum pilih agenda

    const fetchStatistik = async () => {
      // Hanya loading saat pertama kali klik, waktu auto-refresh jangan loading agar layar tidak kedap-kedip
      if (totalWeb === 0 && totalGForm === 0) setIsLoadingStats(true);

      try {
        // --- A. AMBIL DATA DARI FIREBASE (HANYA UNTUK AGENDA INI) ---
        const qWeb = query(
          collection(db, "agenda_peserta"),
          where("agendaId", "==", selectedAgenda.id),
        );
        const snapWeb = await getDocs(qWeb);

        let hitungWeb = 0;
        snapWeb.forEach((doc) => {
          const data = doc.data();
          hitungWeb += Number(data.jumlahTiket) || 1; // Hitung rombongan
        });
        setTotalWeb(hitungWeb);

        // --- B. AMBIL DATA DARI GOOGLE SHEETS ---
        // Logika Pintar: Cek apakah agenda punya link CSV sendiri di database.
        // Jika tidak, gunakan link G-Form default HANYA JIKA judulnya ada kata "Halal" atau "2026"
        let csvUrl = selectedAgenda.linkCsv || "";

        if (!csvUrl && selectedAgenda.judul.toLowerCase().includes("halal")) {
          csvUrl =
            "https://docs.google.com/spreadsheets/d/e/2PACX-1vTQr9BMhDcXuo-CVlgbudkd0bMiqfjlP0vz7IX-nmhs7fGonoAes9GseOiNkz5adWmQnfhv1fSOHhmj/pub?gid=1273968250&single=true&output=csv";
        }

        if (csvUrl) {
          const response = await fetch(csvUrl);
          const textData = await response.text();
          const baris = textData
            .split(/\r?\n/)
            .filter((row) => row.trim() !== "");
          setTotalGForm(Math.max(0, baris.length - 1)); // Kurangi header
        } else {
          setTotalGForm(0); // Kalau acara lain yang tidak pakai G-Form
        }
      } catch (error) {
        console.error("Gagal mengambil data statistik:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStatistik();

    // Auto-refresh setiap 30 detik untuk live counting
    const interval = setInterval(fetchStatistik, 30000);
    return () => clearInterval(interval);
  }, [selectedAgenda]); // Efek ini diulang setiap kali agenda yang dipilih berubah

  const grandTotal = totalWeb + totalGForm;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <NavbarPublic />

      {/* HEADER KECIL */}
      <div className="bg-blue-950 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h4 className="text-yellow-400 font-black tracking-[0.2em] uppercase text-xs mb-4">
            Live Dashboard
          </h4>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
            Statistik Pendaftar <br className="hidden md:block" /> Agenda DPW
            IKA UII DIY
          </h1>
          <p className="text-blue-200 text-sm md:text-base max-w-2xl mx-auto">
            Pantau antusiasme para alumni secara *real-time*. Silakan pilih
            agenda di bawah ini untuk melihat total pendaftar yang sudah
            tergabung.
          </p>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-grow max-w-5xl mx-auto px-6 py-12 w-full -mt-16 relative z-10">
        {/* TAMPILAN 1: PILIH AGENDA */}
        {!selectedAgenda ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
            <h2 className="text-2xl font-black text-blue-950 mb-6 text-center border-b border-slate-100 pb-4">
              Pilih Agenda
            </h2>

            {isLoadingAgenda ? (
              <div className="py-12 text-center animate-pulse font-bold text-slate-400">
                Memuat daftar agenda...
              </div>
            ) : agendaList.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                Belum ada agenda yang dipublikasikan.
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {agendaList.map((agenda) => (
                  <button
                    key={agenda.id}
                    onClick={() => {
                      setSelectedAgenda(agenda);
                      setTotalWeb(0); // Reset angka
                      setTotalGForm(0); // Reset angka
                    }}
                    className="text-left bg-slate-50 p-6 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <span className="text-[10px] font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">
                        {agenda.bidang}
                      </span>
                      <h3 className="font-bold text-blue-950 text-lg leading-snug group-hover:text-blue-600 transition-colors mb-2">
                        {agenda.judul}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {agenda.deskripsi}
                      </p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-200 text-xs font-bold text-slate-400 flex justify-between items-center group-hover:text-blue-600">
                      <span>Lihat Statistik Real-Time</span>
                      <span>&rarr;</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* TAMPILAN 2: DASHBOARD STATISTIK (HANYA MUNCUL JIKA SUDAH PILIH AGENDA) */
          <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
            {/* Tombol Kembali & Judul Terpilih */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">
                  Statistik Untuk Agenda:
                </p>
                <h2 className="text-xl md:text-2xl font-black text-blue-950 leading-tight">
                  {selectedAgenda.judul}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAgenda(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors w-fit"
              >
                &larr; Ganti Agenda
              </button>
            </div>

            {isLoadingStats ? (
              <div className="bg-white rounded-3xl p-12 shadow-lg border border-slate-100 text-center flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-slate-500 animate-pulse">
                  Menghitung Data secara Real-Time...
                </p>
              </div>
            ) : (
              <>
                {/* KOTAK GRAND TOTAL (Paling Besar) */}
                <div className="bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900 rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative overflow-hidden text-center transform hover:scale-[1.02] transition-transform duration-500">
                  <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
                  <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none"></div>

                  <h2 className="text-yellow-400 font-bold uppercase tracking-widest text-sm mb-4 relative z-10">
                    Total Keseluruhan Peserta Hadir
                  </h2>

                  <div className="flex justify-center items-baseline gap-2 relative z-10">
                    <span className="text-7xl md:text-[8rem] font-black text-white leading-none tracking-tighter drop-shadow-lg tabular-nums">
                      {grandTotal}
                    </span>
                    <span className="text-2xl md:text-3xl font-bold text-blue-300">
                      Orang
                    </span>
                  </div>

                  <div className="mt-8 inline-block bg-white/10 backdrop-blur-md border border-white/20 px-6 py-2 rounded-full relative z-10">
                    <p className="text-blue-100 text-xs font-medium flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                      Data diperbarui secara otomatis setiap 30 detik
                    </p>
                  </div>
                </div>

                {/* KOTAK SUMBER DATA (Web vs G-Form) */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Box Firebase (Web) */}
                  <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 flex items-center gap-6 group hover:border-blue-200 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      🌐
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Via Sistem Website
                      </p>
                      <p className="text-3xl font-black text-blue-950 tabular-nums">
                        {totalWeb}{" "}
                        <span className="text-lg font-medium text-slate-500">
                          Orang
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Box Google Form */}
                  <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 flex items-center gap-6 group hover:border-green-200 transition-colors">
                    <div className="w-16 h-16 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                      📝
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Via Form Alternatif
                      </p>
                      <p className="text-3xl font-black text-blue-950 tabular-nums">
                        {totalGForm}{" "}
                        <span className="text-lg font-medium text-slate-500">
                          Orang
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      <FooterPublic />
    </div>
  );
}
