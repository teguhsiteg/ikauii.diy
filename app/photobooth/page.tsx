"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

type Step = "IDLE" | "WELCOME" | "CAMERA" | "PREVIEW" | "UPLOADING" | "QRCODE";

export default function PhotoboothKioskPage() {
  const [step, setStep] = useState<Step>("IDLE");
  const [guest, setGuest] = useState<any>(null);

  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [finalUrl, setFinalUrl] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gambar Latar Belakang Jogja (Tugu/Malioboro)
  const JOGJA_BG_URL =
    "https://images.unsplash.com/photo-1596401057633-ce8309af01d6?q=80&w=1080&auto=format&fit=crop";
  const TWIBBON_URL =
    "https://res.cloudinary.com/dzbbssni4/image/upload/v1773840297/twibbon_k2x11x.png";
  const CLOUD_NAME = "dx7i4ygxy";
  const UPLOAD_PRESET = "boothphoto";

  // 1. MENDENGARKAN SINYAL DARI SCANNER PANITIA (DENGAN ANTI-NYANGKUT)
  useEffect(() => {
    // Bersihkan sisa sinyal lama setiap kali halaman Kiosk baru dibuka/di-refresh
    const clearStaleSignal = async () => {
      try {
        await setDoc(doc(db, "system", "live_booth"), { trigger: false });
      } catch (error) {
        console.error("Gagal reset sinyal awal", error);
      }
    };
    clearStaleSignal();

    // Pantau sinyal baru
    const unsub = onSnapshot(doc(db, "system", "live_booth"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();

        // Cek apakah ini sinyal segar (kurang dari 30 detik yang lalu)
        const now = new Date().getTime();
        const signalTime = data.timestamp
          ? new Date(data.timestamp).getTime()
          : 0;
        const isFresh = now - signalTime < 30000;

        if (data.trigger && data.nama && isFresh) {
          setGuest(data);
          setStep("WELCOME");
        }
      }
    });
    return () => unsub();
  }, []);

  // 2. FUNGSI MENYALAKAN KAMERA (Resolusi Portrait)
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1080, height: 1920, facingMode: "user" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Gagal akses kamera:", err);
      toast.error("Tolong izinkan akses kamera di browser ini!");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  // 3. FUNGSI TIMER COUNTDOWN
  const startCountdown = () => {
    setCountdown(3);
    let counter = 3;
    const timer = setInterval(() => {
      counter--;
      if (counter > 0) {
        setCountdown(counter);
      } else {
        clearInterval(timer);
        setCountdown(null);
        executeSnapshot(); // Jepret foto setelah timer habis
      }
    }, 1000);
  };

  // 4. FUNGSI JEPRET FOTO ASLI (DENGAN ALGORITMA ANTI-GEPENG)
  const executeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set resolusi Canvas jadi Portrait
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Efek Mirror (Cermin) agar tidak terbalik
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      // --- LOGIKA ANTI GEPENG (OBJECT-FIT: COVER) ---
      const videoRatio = video.videoWidth / video.videoHeight;
      const canvasRatio = canvas.width / canvas.height;

      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      // Jika video asli lebih 'lebar' dari kanvas (Webcam standar)
      if (videoRatio > canvasRatio) {
        drawWidth = canvas.height * videoRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }
      // Jika video asli lebih 'tinggi' dari kanvas
      else {
        drawHeight = canvas.width / videoRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      }

      // Jepret dengan memotong bagian tengah secara proporsional
      ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      // ----------------------------------------------

      const imgData = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImg(imgData);
      setStep("PREVIEW");
      stopCamera();
    }
  };

  // 5. FUNGSI RETAKE (Ulangi Foto)
  const handleRetake = () => {
    setCapturedImg(null);
    setStep("CAMERA");
    startCamera();
  };

  // 6. FUNGSI SELESAI & UPLOAD KE CLOUDINARY
  const handleSaveAndUpload = async () => {
    setStep("UPLOADING");

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if (!ctx || !capturedImg) return;

    const photoImg = new Image();
    photoImg.src = capturedImg;

    const twibbonImg = new Image();
    twibbonImg.crossOrigin = "anonymous";
    twibbonImg.src = TWIBBON_URL;

    await Promise.all([
      new Promise((res) => {
        photoImg.onload = res;
      }),
      new Promise((res) => {
        twibbonImg.onload = res;
      }),
    ]);

    ctx.drawImage(photoImg, 0, 0, 1080, 1920);
    ctx.drawImage(twibbonImg, 0, 0, 1080, 1920);

    const finalBase64 = canvas.toDataURL("image/jpeg", 0.9);

    try {
      const formData = new FormData();
      formData.append("file", finalBase64);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await res.json();
      if (data.secure_url) {
        setFinalUrl(data.secure_url);
        setStep("QRCODE");
      }
    } catch (err) {
      console.error("Gagal Upload:", err);
      toast.error("Gagal mengunggah foto. Cek koneksi internet.");
      setStep("PREVIEW");
    }
  };

  // 7. KEMBALI KE IDLE
  const resetKiosk = async () => {
    setStep("IDLE");
    setGuest(null);
    setCapturedImg(null);
    setFinalUrl("");
    await setDoc(doc(db, "system", "live_booth"), { trigger: false });
  };

  // ==========================================
  // RENDER UI
  // ==========================================
  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col items-center justify-center font-sans relative selection:bg-transparent">
      {/* LATAR BELAKANG JOGJA TRANSPARAN (Untuk Layar IDLE & WELCOME) */}
      {(step === "IDLE" || step === "WELCOME") && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.07]"
          style={{ backgroundImage: `url(${JOGJA_BG_URL})` }}
        ></div>
      )}

      {/* KONDISI 1: IDLE (Standby) */}
      {step === "IDLE" && (
        <div className="text-center animate-in fade-in zoom-in duration-1000 z-10 relative">
          <img
            src="https://res.cloudinary.com/dzbbssni4/image/upload/v1774423092/logo_hbh21_vezsj1.png"
            alt="Logo HBH 21"
            className="w-64 md:w-96 mx-auto mb-10 drop-shadow-xl hover:scale-105 transition-transform duration-500"
          />
          <h1 className="text-5xl font-black tracking-widest text-slate-800 mb-4 uppercase">
            Kiosk Photobooth
          </h1>
          <p className="text-2xl text-slate-500 font-bold animate-pulse">
            Menunggu Scan Tiket dari Panitia...
          </p>
        </div>
      )}

      {/* KONDISI 2: WELCOME SCREEN (Sapaan Elegan Bersih) */}
      {step === "WELCOME" && guest && (
        <div className="text-center animate-in slide-in-from-bottom-16 duration-700 z-10 relative mt-10">
          <h2 className="text-4xl font-bold text-yellow-600 tracking-widest uppercase mb-4">
            Selamat Datang
          </h2>
          <h1 className="text-7xl font-black text-blue-950 mb-6 drop-shadow-sm">
            {guest.nama}
          </h1>
          <p className="text-3xl text-slate-500 font-bold mb-16">
            {guest.fakultas} • Angkatan {guest.angkatan}
          </p>

          {/* Tombol Manual Mulai Foto */}
          <button
            onClick={() => {
              setStep("CAMERA");
              startCamera();
            }}
            className="bg-blue-900 hover:bg-blue-950 text-white text-3xl font-black py-6 px-16 rounded-full shadow-[0_10px_30px_rgba(30,58,138,0.3)] hover:scale-105 transition-transform flex items-center justify-center gap-4 mx-auto border-4 border-blue-800"
          >
            📸 MULAI FOTO
          </button>
        </div>
      )}

      {/* KONDISI 3 & 4: LIVE CAMERA ATAU PREVIEW (DENGAN OVERLAY TWIBBON POTRAIT) */}
      {(step === "CAMERA" || step === "PREVIEW" || step === "UPLOADING") && (
        <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
          {/* Area Render Portrait (Rasio 9:16) */}
          <div className="relative h-[95vh] aspect-[9/16] bg-black overflow-hidden shadow-2xl rounded-[3rem] border-[10px] border-slate-800">
            {step === "CAMERA" ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              capturedImg && (
                <img
                  src={capturedImg}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )
            )}

            {/* OVERLAY TWIBBON (Menutupi kamera) */}
            <img
              src={TWIBBON_URL}
              alt="Twibbon Overlay"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
            />

            {/* OVERLAY TIMER COUNTDOWN */}
            {countdown !== null && (
              <div className="absolute inset-0 bg-black/40 z-30 flex items-center justify-center backdrop-blur-sm animate-in fade-in">
                <span className="text-[15rem] font-black text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.8)] animate-pulse">
                  {countdown}
                </span>
              </div>
            )}

            {/* OVERLAY GELAP SAAT UPLOADING */}
            {step === "UPLOADING" && (
              <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
                <div className="w-20 h-20 border-8 border-slate-700 border-t-yellow-400 rounded-full animate-spin mb-6"></div>
                <h2 className="text-3xl font-black text-white tracking-widest animate-pulse text-center px-4">
                  Menyimpan Mahakarya...
                </h2>
              </div>
            )}
          </div>

          {/* KONTROL BAWAH (Melayang di samping / bawah tergantung layar) */}
          <div className="absolute bottom-6 left-0 right-0 z-40 flex justify-center">
            {step === "CAMERA" && countdown === null && (
              <button
                onClick={startCountdown}
                className="bg-white text-blue-950 text-2xl md:text-3xl font-black py-5 md:py-6 px-12 md:px-16 rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.4)] hover:scale-105 transition-transform flex items-center gap-4 border-4 border-slate-200"
              >
                📸 AMBIL FOTO
              </button>
            )}

            {step === "PREVIEW" && (
              <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                <button
                  onClick={handleRetake}
                  className="bg-red-600/90 hover:bg-red-500 backdrop-blur-md text-white text-xl md:text-2xl font-black py-4 md:py-5 px-8 md:px-12 rounded-full shadow-2xl transition-transform hover:scale-105 border-4 border-red-400 flex items-center gap-3"
                >
                  🔄 ULANGI
                </button>
                <button
                  onClick={handleSaveAndUpload}
                  className="bg-green-500/90 hover:bg-green-400 backdrop-blur-md text-white text-xl md:text-2xl font-black py-4 md:py-5 px-8 md:px-12 rounded-full shadow-2xl transition-transform hover:scale-105 border-4 border-green-300 flex items-center gap-3"
                >
                  ✅ SELESAI & SIMPAN
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* KONDISI 6: SELESAI & QR CODE DOWNLOAD (Sapaan Penutup Bersih) */}
      {step === "QRCODE" && (
        <div className="text-center animate-in zoom-in duration-500 flex flex-col items-center z-10 relative w-full h-full justify-center bg-blue-950">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596401057633-ce8309af01d6?q=80&w=1080&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"></div>

          <h2 className="text-4xl md:text-6xl font-black text-yellow-400 tracking-widest uppercase drop-shadow-lg mb-6 mt-10">
            Yeay! Fotonya Mantap
          </h2>

          <p className="text-xl md:text-2xl text-blue-200 font-bold mb-10 max-w-2xl px-6 leading-relaxed">
            Scan QR Code di bawah ini menggunakan kamera HP-mu untuk mendownload
            hasil fotonya.
          </p>

          <div className="bg-white p-6 rounded-[2rem] inline-block shadow-[0_0_80px_rgba(250,204,21,0.2)] mb-12 relative z-10">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(finalUrl)}`}
              alt="Download QR"
              className="w-64 h-64 md:w-80 md:h-80"
            />
          </div>

          <button
            onClick={resetKiosk}
            className="bg-white hover:bg-slate-100 text-blue-950 font-black py-4 px-12 rounded-full shadow-xl transition-transform hover:scale-105 tracking-widest text-lg md:text-xl relative z-10 border-4 border-slate-200 flex items-center gap-3"
          >
            Selesai & Kembali
          </button>
        </div>
      )}

      {/* Canvas Tersembunyi untuk proses Snapshot */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}
