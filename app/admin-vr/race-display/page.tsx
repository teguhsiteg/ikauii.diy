"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Tv, Image as ImageIcon, Video, Play, Pause, RefreshCw, XCircle, LogOut, RotateCw } from "lucide-react";

export default function RaceDisplayControlPage() {
  const [settings, setSettings] = useState<any>({});
  const [localImageUrl, setLocalImageUrl] = useState("");
  const [localVideoUrl, setLocalVideoUrl] = useState("");
  const [localType, setLocalType] = useState<"image" | "video">("image");
  const [localLoop, setLocalLoop] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [isRotated, setIsRotated] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Let the layout's onAuthStateChanged handle redirect
    } catch (error) {
      console.error(error);
    }
  };

  // Ambil data real-time dari Firebase
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "virtual_run"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        // Sinkronisasi form lokal saat pertama load atau jika belum diedit
        if (!localImageUrl && data.imageUrl) setLocalImageUrl(data.imageUrl);
        if (!localVideoUrl && data.videoUrl) setLocalVideoUrl(data.videoUrl);
        // Fallback backward compatibility: if mediaUrl exists but imageUrl/videoUrl doesn't
        if (!data.imageUrl && !data.videoUrl && data.mediaUrl) {
           if (data.mediaType === "image") setLocalImageUrl(data.mediaUrl);
           if (data.mediaType === "video") setLocalVideoUrl(data.mediaUrl);
        }
        if (data.mediaType) setLocalType(data.mediaType);
        if (data.mediaLoop !== undefined) setLocalLoop(data.mediaLoop);
      }
    });
    return () => unsub();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showMessage = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleApplySettings = async () => {
    if (localType === "image" && !localImageUrl) {
      showMessage("URL Foto tidak boleh kosong!");
      return;
    }
    if (localType === "video" && !localVideoUrl) {
      showMessage("URL Video tidak boleh kosong!");
      return;
    }
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        imageUrl: localImageUrl,
        videoUrl: localVideoUrl,
        mediaUrl: localType === "image" ? localImageUrl : localVideoUrl, // keep backward compat if needed
        mediaType: localType,
        mediaLoop: localLoop,
      });
      showMessage("Pengaturan Media Berhasil Diterapkan!");
    } catch (err: any) {
      console.error(err);
      showMessage("❌ Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleMediaMode = async (isActive: boolean) => {
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        mediaMode: isActive,
        // Jika mematikan media, otomatis pause videonya
        ...(isActive === false && { mediaPlaying: false })
      });
    } catch (err: any) {
      console.error(err);
      showMessage("❌ Gagal merubah mode layar.");
    } finally {
      setIsProcessing(false);
    }
  };

  const togglePlayState = async (isPlaying: boolean) => {
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        mediaPlaying: isPlaying,
      });
    } catch (err: any) {
      console.error(err);
      showMessage("❌ Gagal mengontrol pemutaran.");
    }
  };

  const togglePortraitMode = async () => {
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        isPortrait: !settings.isPortrait,
      });
    } catch (err: any) {
      console.error(err);
      showMessage("❌ Gagal mengubah orientasi layar.");
    }
  };

  const isMediaActive = settings.mediaMode === true;
  const isVideo = settings.mediaType === "video";
  const isPlaying = settings.mediaPlaying === true;

  return (
    <div 
      className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center items-center"
      style={
        isRotated
          ? {
              transform: "rotate(90deg)",
              transformOrigin: "center center",
              width: "100vh",
              height: "100vw",
              position: "absolute",
              top: "50%",
              left: "50%",
              marginTop: "-50vw",
              marginLeft: "-50vh",
            }
          : { width: "100%" }
      }
    >
      <div className="w-full max-w-4xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Tv className="w-6 h-6 text-blue-600" />
              Kontrol Layar Publik (VJD)
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Atur tayangan media (Foto/Video) pada halaman Race Clock.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-1">
              <button onClick={() => setIsRotated(!isRotated)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors" title="Rotasi Layar 90 Derajat">
                <RotateCw className="w-5 h-5" />
              </button>
              <div className="w-px h-5 bg-slate-300 mx-1"></div>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Keluar (Logout)">
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Status:</span>
              {isMediaActive ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-bold text-sm">
                  <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
                  MODE MEDIA
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  MODE JAM LARI
                </span>
              )}
            </div>
          </div>
        </div>

        {/* NOTIFIKASI */}
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-4 ${message.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : message.includes('❌') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
            {message}
          </div>
        )}

        {/* MASTER SWITCH: ORIENTASI LAYAR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Orientasi Layar Panggung</h2>
            <p className="text-slate-500 text-sm">Sesuaikan tampilan layar publik dengan bentuk fisik TV/LED di panggung.</p>
          </div>
          <button
            onClick={togglePortraitMode}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              settings.isPortrait ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                settings.isPortrait ? "translate-x-9" : "translate-x-1"
              }`}
            />
          </button>
          <div className="text-sm font-bold text-slate-700 uppercase tracking-wider w-24 text-right">
            {settings.isPortrait ? "Portrait" : "Landscape"}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PANEL KIRI: PENGATURAN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 flex items-center gap-2">
              1. Pengaturan Sumber Media
            </div>
            <div className="p-5 space-y-5 flex-1">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipe Media</label>
                <div className="flex gap-3">
                  <button
                    onClick={() => setLocalType("image")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border font-medium transition-colors ${
                      localType === "image" ? "bg-blue-50 border-blue-600 text-blue-700" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" /> Foto
                  </button>
                  <button
                    onClick={() => setLocalType("video")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg border font-medium transition-colors ${
                      localType === "video" ? "bg-purple-50 border-purple-600 text-purple-700" : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Video className="w-4 h-4" /> Video
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL Foto (Image)</label>
                  <input
                    type="text"
                    value={localImageUrl}
                    onChange={(e) => setLocalImageUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/.../image.jpg"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 text-sm ${localType === 'image' ? 'border-blue-400 bg-blue-50/30' : 'border-slate-300'}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">URL Video (MP4)</label>
                  <input
                    type="text"
                    value={localVideoUrl}
                    onChange={(e) => setLocalVideoUrl(e.target.value)}
                    placeholder="https://res.cloudinary.com/.../video.mp4"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-slate-700 text-sm ${localType === 'video' ? 'border-purple-400 bg-purple-50/30' : 'border-slate-300'}`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                {localType === "video" ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="loop"
                      checked={localLoop}
                      onChange={(e) => setLocalLoop(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="loop" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Loop Video (Ulangi otomatis setelah selesai)
                    </label>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">Tidak ada pengaturan tambahan untuk mode Foto.</div>
                )}
              </div>

              <button
                onClick={handleApplySettings}
                disabled={isProcessing}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                Terapkan Pengaturan Media
              </button>
              
              <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 flex items-start gap-2">
                <span className="font-bold">Info:</span>
                Tekan tombol Terapkan di atas sebelum menayangkannya ke layar publik, agar URL baru tersimpan di database.
              </div>
            </div>
          </div>

          {/* PANEL KANAN: KONTROL TAYANGAN */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-100 border-b border-slate-200 font-semibold text-slate-700 flex items-center gap-2">
              2. Kontrol Tayangan & Preview
            </div>
            <div className="p-5 space-y-6 flex-1 flex flex-col">
              
              {/* LOCAL PREVIEW */}
              <div className={`relative bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-200 transition-all duration-500 mx-auto ${settings.isPortrait ? 'w-1/2 aspect-[9/16]' : 'w-full aspect-video'}`}>
                {localType === "image" ? (
                  localImageUrl ? (
                    <img src={localImageUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-sm font-medium text-center">URL Foto belum diisi</span>
                    </div>
                  )
                ) : (
                  localVideoUrl ? (
                    <video src={localVideoUrl} controls={false} loop={localLoop} muted className="w-full h-full object-contain" autoPlay />
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center">
                      <Video className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-sm font-medium text-center">URL Video belum diisi</span>
                    </div>
                  )
                )}
                
                {/* OVERLAY INDIKATOR TAYANG */}
                {isMediaActive && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1.5 animate-pulse shadow-lg">
                    <div className="w-2 h-2 rounded-full bg-white"></div> LIVE DI LAYAR UTAMA
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex-1 flex flex-col justify-end space-y-3">
                {isMediaActive ? (
                  <div className="space-y-3">
                    {isVideo && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePlayState(true)}
                          disabled={isPlaying}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"
                        >
                          <Play className="w-5 h-5" /> PLAY VIDEO
                        </button>
                        <button
                          onClick={() => togglePlayState(false)}
                          disabled={!isPlaying}
                          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-sm"
                        >
                          <Pause className="w-5 h-5" /> PAUSE
                        </button>
                      </div>
                    )}
                    <button
                      onClick={() => toggleMediaMode(false)}
                      disabled={isProcessing}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2"
                    >
                      <XCircle className="w-5 h-5" /> TUTUP MEDIA & KEMBALI KE JAM LARI
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => toggleMediaMode(true)}
                    disabled={isProcessing || !settings.mediaUrl}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-colors shadow-md shadow-blue-200 flex justify-center items-center gap-2 text-lg uppercase tracking-wide"
                  >
                    <Tv className="w-6 h-6" /> Tayangkan Media ke Layar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
