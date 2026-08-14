"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";

export default function BibScannerPage() {
  const [bibInput, setBibInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<
    { bib: string; time: string }[]
  >([]);

  // State untuk Template Layar
  const [templateIdle, setTemplateIdle] = useState("");
  const [templateBib, setTemplateBib] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Kontrol TV dari Scanner
  const [displayDuration, setDisplayDuration] = useState<number>(8);
  const [activeBibOnTv, setActiveBibOnTv] = useState<string | null>(null);

  // Mesin Waktu (Timer Engine)
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<any>(null);

  // Monitor status TV & Ambil Template Awal
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "virtual_run"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Update status TV
        if (data.activeBibCheck && data.activeBibCheck !== "") {
          setActiveBibOnTv(data.activeBibCheck);
        } else {
          setActiveBibOnTv(null);
          setTimeLeft(0);
          if (timerRef.current) clearInterval(timerRef.current);
        }

        // Ambil template dari DB jika user belum mengetik apa-apa
        if (document.activeElement?.id !== "input-template-idle") {
          setTemplateIdle(data.urlBibTemplateIdle || "");
        }
        if (document.activeElement?.id !== "input-template-bib") {
          setTemplateBib(data.urlBibTemplateScan || "");
        }
      }
    });
    return () => unsub();
  }, []);

  // 🔥 FUNGSI TOMBOL SIMPAN TEMPLATE MANUAL 🔥
  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        urlBibTemplateIdle: templateIdle,
        urlBibTemplateScan: templateBib,
      });
      // Kembalikan fokus ke scanner setelah simpan
      inputRef.current?.focus();
    } catch (error) {
      console.error("Gagal simpan template", error);
      toast.error("Gagal menyimpan template! Cek koneksi internet.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (timeLeft > 0 && !isPaused && activeBibOnTv) {
      timerRef.current = window.setInterval(async () => {
        const newTime = timeLeft - 1;
        setTimeLeft(newTime);
        await updateDoc(doc(db, "settings", "virtual_run"), {
          bibDisplayTimeLeft: newTime,
        });

        if (newTime <= 0) handleStopTv();
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, isPaused, activeBibOnTv]);

  // Jaga Fokus Input (Penting untuk Barcode Scanner Fisik)
  useEffect(() => {
    if (
      document.activeElement?.tagName === "INPUT" &&
      document.activeElement?.id !== "main-scanner"
    )
      return;

    inputRef.current?.focus();
  }, [isProcessing, timeLeft, isPaused]);

  const handleKeepFocus = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "BUTTON") return;
    inputRef.current?.focus();
  };

  // Submit Scan
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const scannedBib = bibInput.trim().toUpperCase();
    if (!scannedBib) return;

    setIsProcessing(true);
    setTimeLeft(displayDuration);
    setIsPaused(false);

    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        activeBibCheck: scannedBib,
        bibDisplayTimeLeft: displayDuration,
        bibDisplayPaused: false,
      });

      setLastScanned(scannedBib);
      setScanHistory((prev) =>
        [
          { bib: scannedBib, time: new Date().toLocaleTimeString("id-ID") },
          ...prev,
        ].slice(0, 30),
      );
    } catch (error) {
      toast.error("Koneksi terputus!");
    } finally {
      setBibInput("");
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  };

  const handleTogglePause = async () => {
    const newPauseState = !isPaused;
    setIsPaused(newPauseState);
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        bibDisplayPaused: newPauseState,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopTv = async () => {
    setIsPaused(false);
    setTimeLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        activeBibCheck: "",
        bibDisplayTimeLeft: 0,
        bibDisplayPaused: false,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Bersihkan semua riwayat scan?")) setScanHistory([]);
  };

  const handleDeleteItem = (e: React.MouseEvent, indexToDelete: number) => {
    e.stopPropagation();
    setScanHistory((prev) => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current
        ?.requestFullscreen()
        .catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={wrapperRef}
      className="w-full h-[calc(100vh-100px)] min-h-[600px] bg-[#0A0A0A] text-white font-sans flex flex-col p-6 overflow-hidden rounded-2xl border border-white/10"
      onClick={handleKeepFocus}
    >
      {/* HEADER INTERNAL SCANNER */}
      <div className="flex justify-between items-center shrink-0 mb-6 border-b border-white/20 pb-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9.5 6.5v3h-3v-3h3M11 5H5v6h6V5zm-1.5 9.5v3h-3v-3h3M11 13H5v6h6v-6zm6.5-6.5v3h-3v-3h3M18.5 5h-6v6h6V5zm-6.5 8h1.5v1.5H12V13zm1.5 1.5h1.5V16h-1.5v-1.5z" />
            <path d="M4 17h2v2H4zm8-8h2v2h-2zm0 4h2v2h-2zm0 4h2v2h-2zm4-4h2v2h-2zm0-4h2v2h-2zm0 8h2v2h-2z" />
          </svg>
          <div>
            <h1 className="text-xl font-bold tracking-wide">
              Terminal Scanner
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white/10 px-3 py-1.5 rounded-md border border-white/20">
            <span className="text-xs font-semibold mr-2 uppercase text-white/70">
              Durasi TV:
            </span>
            <input
              type="number"
              min="3"
              max="30"
              value={displayDuration}
              onChange={(e) => setDisplayDuration(Number(e.target.value))}
              className="w-10 bg-transparent text-center font-bold focus:outline-none focus:border-b focus:border-white"
            />
            <span className="text-xs text-white/50 ml-1">dtk</span>
          </div>

          <button
            onClick={toggleFullScreen}
            className="flex items-center gap-2 bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-md text-xs font-bold uppercase transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
            <span>Fullscreen</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
        {/* KOLOM KIRI: SCANNER AREA */}
        <div className="flex flex-col w-full md:w-2/3 h-full">
          <div className="w-full bg-[#121212] p-8 lg:p-10 rounded-xl border border-white/10 relative overflow-hidden flex flex-col justify-center flex-1">
            {isProcessing && (
              <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>
            )}

            <form
              onSubmit={handleScanSubmit}
              className="relative z-10 w-full max-w-xl mx-auto"
            >
              <label className="block text-sm font-semibold uppercase tracking-widest mb-4 text-center text-white/60">
                Input Barcode / BIB
              </label>
              <input
                id="main-scanner"
                ref={inputRef}
                type="text"
                value={bibInput}
                onChange={(e) => setBibInput(e.target.value)}
                disabled={isProcessing}
                placeholder="TEMBAK DI SINI"
                className="w-full bg-[#0A0A0A] border-2 border-white/20 text-white text-center text-4xl lg:text-5xl font-bold py-8 rounded-lg focus:outline-none focus:border-white focus:bg-white/5 uppercase tracking-widest transition-all placeholder:text-white/20"
                autoFocus
                autoComplete="off"
              />
              <button type="submit" className="hidden">
                Kirim
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center relative z-10 h-12">
              {lastScanned ? (
                <div className="flex items-center gap-2 text-white bg-white/10 px-6 py-2 rounded-md border border-white/20">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                  <span className="text-sm font-semibold tracking-wide">
                    Terkirim: {lastScanned}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-white/50 px-6 py-2">
                  <svg
                    className="w-5 h-5 animate-spin-slow"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                  <span className="text-sm font-semibold tracking-wide">
                    Menunggu Scan...
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: MONITOR, TEMPLATE & RIWAYAT */}
        <div className="flex flex-col w-full md:w-1/3 h-full gap-4">
          {/* PANEL KONTROL TV & TEMPLATE URL */}
          <div className="bg-[#121212] border border-white/10 rounded-xl p-4 lg:p-5 shrink-0 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-widest flex items-center gap-2 text-white/70">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
                </svg>
                Monitor & Template
              </h3>
              <div className="flex items-center gap-2">
                {activeBibOnTv ? (
                  <span className="text-[10px] bg-white text-black font-bold px-2 py-1 rounded">
                    LIVE
                  </span>
                ) : (
                  <span className="text-[10px] text-white/40 font-bold border border-white/20 px-2 py-1 rounded">
                    IDLE
                  </span>
                )}
              </div>
            </div>

            {/* 🔥 Form Upload URL Template dengan Tombol Save 🔥 */}
            <div className="space-y-3 bg-white/5 p-3 rounded-lg border border-white/5">
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/50 mb-1">
                  1. URL Template Idle (Awal)
                </label>
                <input
                  id="input-template-idle"
                  type="url"
                  value={templateIdle}
                  onChange={(e) => setTemplateIdle(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0A0A0A] border border-white/20 rounded px-3 py-1.5 text-xs text-white focus:border-white focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-widest text-white/50 mb-1 flex justify-between">
                  <span>2. URL Template BIB (Scan)</span>
                  <span className="text-amber-500">Rasio 16:9 (1920x1080)</span>
                </label>
                <input
                  id="input-template-bib"
                  type="url"
                  value={templateBib}
                  onChange={(e) => setTemplateBib(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#0A0A0A] border border-white/20 rounded px-3 py-1.5 text-xs text-white focus:border-white focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-2 rounded uppercase tracking-widest transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {isSavingTemplate ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>{" "}
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Template"
                )}
              </button>
            </div>

            <div className="flex flex-col items-center justify-center py-4 bg-[#0A0A0A] rounded-lg border border-white/5">
              {activeBibOnTv ? (
                <>
                  <div className="text-2xl lg:text-3xl font-bold tracking-widest mb-1 lg:mb-2">
                    {activeBibOnTv}
                  </div>
                  <div
                    className={`text-4xl lg:text-5xl font-black tabular-nums transition-colors duration-300 ${isPaused ? "text-white/40" : "text-white"}`}
                  >
                    00:{timeLeft.toString().padStart(2, "0")}
                  </div>
                  <div className="text-[9px] lg:text-[10px] font-semibold text-white/50 uppercase tracking-widest mt-2">
                    {isPaused ? "WAKTU DITAHAN" : "DETIK TERSISA"}
                  </div>
                </>
              ) : (
                <div className="text-center text-white/30">
                  <svg
                    className="w-10 h-10 lg:w-12 lg:h-12 mx-auto mb-2 opacity-50"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
                  </svg>
                  <div className="text-[10px] lg:text-xs font-bold uppercase tracking-widest">
                    Poster Ditampilkan
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleTogglePause}
                disabled={!activeBibOnTv}
                className="flex items-center justify-center gap-1 lg:gap-2 border border-white/20 hover:bg-white/10 py-2.5 rounded-lg text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
              >
                {isPaused ? (
                  <>
                    <svg
                      className="w-3 h-3 lg:w-4 lg:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>{" "}
                    Lanjut
                  </>
                ) : (
                  <>
                    <svg
                      className="w-3 h-3 lg:w-4 lg:h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>{" "}
                    Tahan
                  </>
                )}
              </button>
              <button
                onClick={handleStopTv}
                disabled={!activeBibOnTv}
                className="flex items-center justify-center gap-1 lg:gap-2 border border-white/20 hover:bg-white text-white hover:text-black py-2.5 rounded-lg text-[10px] lg:text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-3 h-3 lg:w-4 lg:h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M6 6h12v12H6z" />
                </svg>{" "}
                Tutup Layar
              </button>
            </div>
          </div>

          {/* PANEL RIWAYAT */}
          <div className="bg-[#121212] border border-white/10 rounded-xl p-4 lg:p-5 flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-3 shrink-0">
              <h3 className="text-[10px] lg:text-xs font-semibold uppercase tracking-widest text-white/70">
                Riwayat Terbaru
              </h3>
              <div className="flex items-center gap-3">
                {scanHistory.length > 0 && (
                  <button
                    onClick={handleClearHistory}
                    className="text-[9px] text-white/50 hover:text-white uppercase font-bold tracking-widest transition-colors flex items-center gap-1"
                  >
                    Bersihkan
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="flex flex-col gap-2">
                {scanHistory.length === 0 && (
                  <div className="text-center text-white/30 text-xs py-10">
                    Kosong
                  </div>
                )}

                {scanHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="group bg-[#0A0A0A] border border-white/5 p-3 rounded-md flex justify-between items-center hover:border-white/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold w-12">{item.bib}</span>
                      <span className="text-[10px] font-mono text-white/40">
                        {item.time}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteItem(e, idx)}
                      title="Hapus"
                      className="text-white/30 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
