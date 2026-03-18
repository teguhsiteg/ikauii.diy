"use client";
import { useState, useRef, useEffect } from "react";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; // Sesuaikan path

export default function TwibbonPage() {
  const [templateUrl, setTemplateUrl] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [userName, setUserName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ambil URL template dari Firestore saat halaman dimuat
  useEffect(() => {
    const fetchTemplate = async () => {
      const docRef = doc(db, "settings", "twibbon");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTemplateUrl(docSnap.data().templateUrl);
      }
    };
    fetchTemplate();
  }, []);

  // Handle saat user pilih foto
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setUserPhoto(event.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Fungsi menggambar ke Canvas
  useEffect(() => {
    if (userPhoto && templateUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Bersihkan canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const imgUser = new Image();
      const imgTemplate = new Image();

      // Agar canvas tidak error CORS saat download template dari Firebase Storage
      imgTemplate.crossOrigin = "anonymous";

      imgUser.onload = () => {
        // Gambar foto user dulu (Layer Bawah)
        // Catatan: Ini logic sederhana, nanti bisa ditambah fitur drag/zoom
        ctx.drawImage(imgUser, 0, 0, canvas.width, canvas.height);

        // Setelah user tergambar, timpa dengan template (Layer Atas)
        imgTemplate.onload = () => {
          ctx.drawImage(imgTemplate, 0, 0, canvas.width, canvas.height);
        };
        imgTemplate.src = templateUrl;
      };
      imgUser.src = userPhoto;
    }
  }, [userPhoto, templateUrl]);

  // Handle Download & Catat Log
  const handleDownload = async () => {
    if (!userName) return alert("Isi nama kamu dulu ya untuk riwayat!");
    if (!canvasRef.current) return;

    // 1. Proses Download
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `Twibbon-${userName}.png`;
    link.href = dataUrl;
    link.click();

    // 2. Catat riwayat ke Firestore (berjalan di background)
    try {
      await addDoc(collection(db, "twibbon_logs"), {
        nama: userName,
        downloadedAt: new Date(),
      });
    } catch (error) {
      console.error("Gagal mencatat riwayat", error);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Yuk Pakai Twibbon!</h1>

      <input
        type="text"
        placeholder="Masukkan Nama Anda"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="border p-2 w-full mb-4"
      />

      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="mb-4"
      />

      <div className="border border-gray-300 mb-4 bg-gray-100 flex justify-center">
        {/* Ukuran canvas disesuaikan dengan standar twibbon (biasanya kotak 1080x1080) */}
        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          className="max-w-full h-auto shadow-md"
        ></canvas>
      </div>

      <button
        onClick={handleDownload}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full"
      >
        Download & Simpan
      </button>
    </div>
  );
}
