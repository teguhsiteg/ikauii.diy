"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  doc,
  updateDoc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";

export default function ScannerGatePage() {
  const [agendaList, setAgendaList] = useState<any[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);

  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fitur Scanner
  const [scanMode, setScanMode] = useState<"kamera" | "manual">("kamera");
  const [scanInput, setScanInput] = useState("");
  const [feedback, setFeedback] = useState<{
    type: string;
    title: string;
    text: string;
  } | null>(null);

  const pesertaListRef = useRef<any[]>([]);
  const isProcessingRef = useRef(false);

  // 1. FETCH SEMUA AGENDA
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

  // 2. LISTENER REAL-TIME (onSnapshot)
  useEffect(() => {
    if (!selectedAgenda) return;

    const q = query(
      collection(db, "agenda_peserta"),
      where("agendaId", "==", selectedAgenda.id),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      rawData.sort((a: any, b: any) => {
        const timeA = a.waktuCheckIn ? new Date(a.waktuCheckIn).getTime() : 0;
        const timeB = b.waktuCheckIn ? new Date(b.waktuCheckIn).getTime() : 0;
        return timeB - timeA;
      });

      setPesertaList(rawData);
      pesertaListRef.current = rawData;
    });

    return () => unsubscribe();
  }, [selectedAgenda]);

  // 3. ENGINE KAMERA (DENGAN KOTAK SCAN RESPONSIF)
  useEffect(() => {
    let scanner: any = null;
    let isMounted = true;

    const startCamera = async () => {
      if (selectedAgenda && scanMode === "kamera") {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const readerElement = document.getElementById("reader");
        if (!readerElement || !isMounted) return;
        readerElement.innerHTML = "";

        try {
          const { Html5QrcodeScanner } = await import("html5-qrcode");
          scanner = new Html5QrcodeScanner(
            "reader",
            {
              fps: 10,
              // BIKIN KOTAK SCAN RESPONSIF MENYESUAIKAN LAYAR (75% DARI LAYAR)
              qrbox: (viewfinderWidth, viewfinderHeight) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                const size = Math.floor(minEdge * 0.75); // Mengambil 75% area layar
                return { width: size, height: size };
              },
            },
            false,
          );

          scanner.render(
            (decodedText: string) => {
              processCheckIn(decodedText);
            },
            (error: any) => {},
          );
        } catch (error) {
          console.error("Gagal inisiasi kamera:", error);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [selectedAgenda, scanMode]);

  // 4. FUNGSI PEMROSESAN TIKET
  const processCheckIn = async (scannedId: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const id = scannedId.trim();
    if (!id) {
      isProcessingRef.current = false;
      return;
    }

    const peserta = pesertaListRef.current.find((p) => p.id === id);

    if (!peserta) {
      setFeedback({
        type: "error",
        title: "TIDAK DITEMUKAN",
        text: "Tiket tidak terdaftar.",
      });
    } else if (peserta.statusCheckIn) {
      setFeedback({
        type: "warning",
        title: "SUDAH DIPAKAI",
        text: `${peserta.nama} telah hadir pada ${new Date(peserta.waktuCheckIn).toLocaleTimeString("id-ID")}.`,
      });
    } else {
      try {
        await updateDoc(doc(db, "agenda_peserta", id), {
          statusCheckIn: true,
          waktuCheckIn: new Date().toISOString(),
        });

        await setDoc(doc(db, "system", "live_booth"), {
          trigger: true,
          nama: peserta.nama,
          fakultas: peserta.fakultas,
          angkatan: peserta.angkatan,
          timestamp: new Date().toISOString(),
        });

        const rombonganText =
          peserta.jumlahTiket > 1 ? ` (${peserta.jumlahTiket} Orang)` : "";
        setFeedback({
          type: "success",
          title: "BERHASIL MASUK",
          text: `Selamat datang, ${peserta.nama}!${rombonganText}`,
        });
      } catch (err) {
        setFeedback({
          type: "error",
          title: "KONEKSI GAGAL",
          text: "Cek jaringan internet Anda.",
        });
      }
    }

    setScanInput("");

    setTimeout(() => {
      setFeedback(null);
      isProcessingRef.current = false;
    }, 2500); // Dipercepat jadi 2.5 detik agar antrean lancar
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckIn(scanInput);
  };

  // 5. FITUR BARU: BATALKAN KEHADIRAN (RESET TIKET)
  const handleBatalkanHadir = async (peserta: any) => {
    const confirmReset = window.confirm(
      `Yakin ingin MEMBATALKAN presensi atas nama ${peserta.nama}?\nQR Code akan bisa digunakan kembali.`,
    );
    if (!confirmReset) return;

    try {
      await updateDoc(doc(db, "agenda_peserta", peserta.id), {
        statusCheckIn: false,
        waktuCheckIn: null, // Reset waktu
      });
      alert(
        `✅ Presensi ${peserta.nama} berhasil dibatalkan. Tiket bisa di-scan ulang.`,
      );
    } catch (error) {
      console.error("Gagal membatalkan:", error);
      alert("❌ Gagal membatalkan presensi. Periksa koneksi internet.");
    }
  };

  const totalTiket = pesertaList.reduce(
    (acc, curr) => acc + (Number(curr.jumlahTiket) || 1),
    0,
  );
  const totalHadir = pesertaList
    .filter((p) => p.statusCheckIn)
    .reduce((acc, curr) => acc + (Number(curr.jumlahTiket) || 1), 0);
  const daftarHadirLive = pesertaList.filter((p) => p.statusCheckIn);

  // TAMPILAN 1: PILIH AGENDA
  if (!selectedAgenda) {
    return (
      <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-12 px-4 md:px-0">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-extrabold text-blue-950 mb-2">
            Gate Kehadiran
          </h2>
          <p className="text-sm md:text-base text-slate-500">
            Pilih agenda untuk mengaktifkan pemindai tiket (Scanner).
          </p>
        </div>

        {isLoading ? (
          <div className="py-12 text-center animate-pulse font-bold text-slate-400">
            Memuat agenda...
          </div>
        ) : agendaList.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-sm">
            <span className="text-4xl mb-4 block">📭</span>
            <h3 className="font-bold text-slate-700">Belum Ada Agenda</h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            {agendaList.map((agenda) => (
              <button
                key={agenda.id}
                onClick={() => setSelectedAgenda(agenda)}
                className="text-left bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-lg transition-all flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4 w-full">
                  <div className="bg-blue-50 text-blue-900 rounded-xl p-2 md:p-3 text-center min-w-[50px] md:min-w-[60px]">
                    <span className="block text-[9px] md:text-[10px] font-bold uppercase">
                      {agenda.tanggal ? agenda.tanggal.split("-")[1] : "CMG"}
                    </span>
                    <span className="block text-lg md:text-xl font-black leading-none mt-1">
                      {agenda.tanggal ? agenda.tanggal.split("-")[2] : "SOON"}
                    </span>
                  </div>
                  <span className="bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-bold px-3 py-1.5 rounded-full uppercase">
                    Pilih Gate
                  </span>
                </div>
                <h3 className="font-bold text-blue-950 leading-snug mb-1">
                  {agenda.judul}
                </h3>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // TAMPILAN 2: AREA SCANNER (OPTIMASI MOBILE)
  return (
    <div className="max-w-6xl mx-auto animate-in slide-in-from-right-8 duration-300 pb-12 px-2 md:px-0 flex flex-col">
      {/* HEADER AGENDA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4 shrink-0 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1">
          <button
            onClick={() => setSelectedAgenda(null)}
            className="text-slate-400 hover:text-blue-900 font-bold text-xs md:text-sm flex items-center gap-2 mb-1.5 transition-colors"
          >
            &larr; Tutup Gate
          </button>
          <h2 className="text-lg md:text-xl font-black text-blue-950 leading-tight line-clamp-1">
            {selectedAgenda.judul}
          </h2>
        </div>

        {/* Counter Ringkas di Mobile */}
        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
          <div className="flex-1 md:flex-none bg-slate-50 px-3 py-2 rounded-xl text-center border border-slate-100 min-w-[90px]">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              Tiket
            </p>
            <p className="text-lg font-black text-slate-700">{totalTiket}</p>
          </div>
          <div className="flex-1 md:flex-none bg-green-50 px-3 py-2 rounded-xl text-center border border-green-100 min-w-[90px]">
            <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">
              Hadir
            </p>
            <p className="text-lg font-black text-green-700">{totalHadir}</p>
          </div>
        </div>
      </div>

      {/* WORKSPACE: FLEX COLUMN DI HP, GRID ROW DI LAPTOP */}
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* KOLOM SCANNER */}
        <div className="w-full lg:w-7/12 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
          {/* OVERLAY FEEDBACK (Dibuat lebih ringkas di Mobile) */}
          {feedback && (
            <div
              className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95 duration-150 backdrop-blur-md ${
                feedback.type === "success"
                  ? "bg-green-600/95 text-white"
                  : feedback.type === "warning"
                    ? "bg-yellow-500/95 text-yellow-950"
                    : "bg-red-600/95 text-white"
              }`}
            >
              <div className="text-5xl md:text-6xl mb-2 drop-shadow-md">
                {feedback.type === "success"
                  ? "✅"
                  : feedback.type === "warning"
                    ? "⚠️"
                    : "❌"}
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-widest mb-1 drop-shadow-sm">
                {feedback.title}
              </h2>
              <p className="text-sm md:text-base font-medium opacity-90 px-4 leading-snug">
                {feedback.text}
              </p>
            </div>
          )}

          {/* TOGGLE KAMERA / MANUAL */}
          <div className="flex p-3 border-b border-slate-100 bg-slate-50">
            <div className="flex w-full bg-slate-200 p-1 rounded-lg">
              <button
                onClick={() => setScanMode("kamera")}
                className={`flex-1 py-2 font-bold text-xs md:text-sm rounded-md transition-all ${scanMode === "kamera" ? "bg-white shadow-sm text-blue-900" : "text-slate-500"}`}
              >
                📸 Kamera
              </button>
              <button
                onClick={() => setScanMode("manual")}
                className={`flex-1 py-2 font-bold text-xs md:text-sm rounded-md transition-all ${scanMode === "manual" ? "bg-white shadow-sm text-blue-900" : "text-slate-500"}`}
              >
                ⌨️ Manual
              </button>
            </div>
          </div>

          {/* AREA PEMINDAI */}
          <div className="relative bg-slate-900 flex items-center justify-center min-h-[350px] md:min-h-[450px]">
            {scanMode === "kamera" ? (
              <div
                id="reader"
                className="w-full h-full [&>div]:border-none [&_video]:object-cover"
              ></div>
            ) : (
              <div className="w-full p-6 md:p-12">
                <form
                  onSubmit={handleManualSubmit}
                  className="w-full max-w-sm mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl text-center"
                >
                  <div className="text-4xl mb-3">🔫</div>
                  <h3 className="text-lg font-black text-blue-950 mb-1">
                    Scanner Alat
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-500 mb-4">
                    Tembakkan barcode alat ke ID.
                  </p>
                  <input
                    type="text"
                    autoFocus
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="ID Tiket..."
                    className="w-full text-center font-mono font-bold text-lg md:text-xl tracking-widest px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl focus:border-blue-600 focus:bg-white outline-none transition-all mb-4 uppercase"
                  />
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all text-sm"
                  >
                    Proses Kehadiran
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* KOLOM LIVE FEED & HISTORY */}
        <div className="w-full lg:w-5/12 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[500px] lg:h-auto overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <h3 className="font-black text-blue-950 flex items-center gap-2 text-sm md:text-base">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Check-In
            </h3>
            <span className="text-[10px] md:text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border">
              {daftarHadirLive.length} Hadir
            </span>
          </div>

          <div className="flex-grow overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
            {daftarHadirLive.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 pb-10">
                <span className="text-4xl mb-2">🎫</span>
                <p className="font-bold text-xs md:text-sm">
                  Belum ada yang Check-In
                </p>
              </div>
            ) : (
              daftarHadirLive.map((peserta, idx) => (
                <div
                  key={peserta.id}
                  className={`bg-white border border-slate-100 p-3 md:p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-3 transition-all ${idx === 0 ? "shadow-sm border-green-200 bg-green-50/20" : ""}`}
                >
                  {/* Info Utama Peserta */}
                  <div className="flex items-center gap-3 flex-grow overflow-hidden">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${idx === 0 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-grow overflow-hidden pr-2">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4
                          className={`font-bold text-sm truncate ${idx === 0 ? "text-green-900" : "text-blue-950"}`}
                        >
                          {peserta.nama}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 shrink-0">
                          {peserta.waktuCheckIn
                            ? new Date(peserta.waktuCheckIn).toLocaleTimeString(
                                "id-ID",
                                { hour: "2-digit", minute: "2-digit" },
                              )
                            : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[10px] text-slate-500 truncate">
                          {peserta.fakultas} • {peserta.angkatan}
                        </p>
                        {peserta.jumlahTiket > 1 && (
                          <span className="bg-blue-100 text-blue-700 text-[8px] px-1.5 py-0.5 rounded font-black shrink-0">
                            {peserta.jumlahTiket} TIKET
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* TOMBOL RESET / BATALKAN */}
                  <button
                    onClick={() => handleBatalkanHadir(peserta)}
                    title="Batalkan Presensi (Reset QR Code)"
                    className="w-full md:w-auto shrink-0 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white px-3 py-2 rounded-lg text-[10px] md:text-xs font-bold transition-colors flex items-center justify-center gap-1.5 border border-red-100"
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
                        strokeWidth={2}
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Batalkan
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
