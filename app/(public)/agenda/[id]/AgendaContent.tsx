"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import FooterPublic from "@/components/layout/FooterPublic";
import { sendEmailAction } from "@/app/actions/email";

export default function DetailAgendaPage({ id }: { id: string }) {

  const [agenda, setAgenda] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State Form Registrasi
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    whatsapp: "",
    fakultas: "",
    angkatan: "",
    instansi: "",
    tipeDaftar: "Individu",
    jumlahTiket: 1,
    namaAnggota: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registeredId, setRegisteredId] = useState("");

  const [duplicateInfo, setDuplicateInfo] = useState<{
    type: string;
    id: string;
  } | null>(null);

  // ==========================================
  // STATE & LOGIKA TWIBBON (DINAMIS 9:16 & 4:5) + ZOOM & DRAG
  // ==========================================
  const [isTwibbonModalOpen, setIsTwibbonModalOpen] = useState(false);
  const [twibbonName, setTwibbonName] = useState("");
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  const [twibbonSuccess, setTwibbonSuccess] = useState(false);

  const [frameType, setFrameType] = useState<"story" | "post">("story");
  const frameConfig = {
    story: { width: 1080, height: 1920, aspectClass: "aspect-[9/16]" },
    post: { width: 1080, height: 1350, aspectClass: "aspect-[4/5]" },
  };
  const currentFrame = frameConfig[frameType];

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetTwibbonState = () => {
    setIsTwibbonModalOpen(false);
    setUserPhoto(null);
    setImageObj(null);
    setTwibbonName("");
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setFrameType("story");
    setTwibbonSuccess(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setUserPhoto(result);

        const img = new Image();
        img.onload = () => {
          setImageObj(img);
          setScale(1);
          setPosition({ x: 0, y: 0 });
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!userPhoto) return;
    setIsDragging(true);
    // @ts-expect-error - see below
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    // @ts-expect-error - see below
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !canvasRef.current) return;
    e.preventDefault();

    // @ts-expect-error - see below
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    // @ts-expect-error - see below
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = currentFrame.width / rect.width;
    const scaleY = currentFrame.height / rect.height;

    const dx = (clientX - dragStart.x) * scaleX;
    const dy = (clientY - dragStart.y) * scaleY;

    setPosition((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    setDragStart({ x: clientX, y: clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (imageObj && agenda?.twibbonUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = currentFrame.width;
      canvas.height = currentFrame.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const baseScale = Math.max(
        currentFrame.width / imageObj.width,
        currentFrame.height / imageObj.height,
      );
      const finalScale = baseScale * scale;

      const drawWidth = imageObj.width * finalScale;
      const drawHeight = imageObj.height * finalScale;

      const defaultX = (currentFrame.width - drawWidth) / 2;
      const defaultY = (currentFrame.height - drawHeight) / 2;

      ctx.drawImage(
        imageObj,
        defaultX + position.x,
        defaultY + position.y,
        drawWidth,
        drawHeight,
      );

      const imgTemplate = new Image();
      imgTemplate.crossOrigin = "anonymous";
      imgTemplate.onload = () => {
        ctx.drawImage(
          imgTemplate,
          0,
          0,
          currentFrame.width,
          currentFrame.height,
        );
      };

      imgTemplate.src =
        frameType === "post" && agenda.twibbonUrlSquare
          ? agenda.twibbonUrlSquare
          : agenda.twibbonUrl;
    }
  }, [
    imageObj,
    agenda?.twibbonUrl,
    agenda?.twibbonUrlSquare,
    scale,
    position,
    frameType,
    currentFrame.width,
    currentFrame.height,
  ]);

  const handleDownloadTwibbon = async () => {
    if (!twibbonName) { toast.warning("Silakan isi nama Anda terlebih dahulu!"); return; }
    if (!userPhoto) { toast.warning("Silakan pilih foto Anda terlebih dahulu!"); return; }
    if (!canvasRef.current) return;

    canvasRef.current.toBlob(
      async (blob) => {
        if (!blob) {
          toast.error("Terjadi kesalahan saat merender gambar.");
          return;
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.style.display = "none";
        link.href = url;
        link.download = `Twibbon-${frameType}-${twibbonName.replace(/\s+/g, "-")}.png`;

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);

        try {
          await addDoc(collection(db, "twibbon_logs"), {
            nama: twibbonName,
            agendaId: agenda?.id || "unknown",
            tipe: frameType,
            downloadedAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error("Gagal menyimpan riwayat twibbon:", error);
        }

        setTimeout(() => {
          setTwibbonSuccess(true);
        }, 500);
      },
      "image/png",
      1.0,
    );
  };

  // ==========================================
  // STATE & LOGIKA DONASI
  // ==========================================
  const [isDonasiModalOpen, setIsDonasiModalOpen] = useState(false);
  const [donasiStep, setDonasiStep] = useState(1);
  const [isSubmittingDonasi, setIsSubmittingDonasi] = useState(false);
  const [donasiData, setDonasiData] = useState({
    nama: "",
    isAnonim: false,
    jenis: "Uang",
    nominal: "",
    deskripsiBarang: "",
  });

  const [totalDanaTerkumpul, setTotalDanaTerkumpul] = useState(0);
  const [listDonatur, setListDonatur] = useState<any[]>([]);

  useEffect(() => {
    if (!agenda) return;
    const fetchDonasi = async () => {
      try {
        const q = query(
          collection(db, "agenda_donasi"),
          where("agendaId", "==", agenda.id),
          where("status", "==", "Terverifikasi"),
        );
        const snapshot = await getDocs(q);
        let total = 0;
        const riwayat: any[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.jenis === "Uang") total += Number(data.nominal || 0);
          riwayat.push({ id: doc.id, ...data });
        });

        riwayat.sort(
          (a, b) => new Date(b.waktu).getTime() - new Date(a.waktu).getTime(),
        );
        setTotalDanaTerkumpul(total);
        setListDonatur(riwayat);
      } catch (error) {
        console.error("Gagal mengambil data donasi:", error);
      }
    };
    fetchDonasi();
  }, [agenda]);

  const handleDonasiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingDonasi(true);
    try {
      await addDoc(collection(db, "agenda_donasi"), {
        agendaId: agenda.id,
        agendaJudul: agenda.judul,
        nama: donasiData.isAnonim ? "Hamba Allah" : donasiData.nama,
        jenis: donasiData.jenis,
        nominal: donasiData.jenis === "Uang" ? Number(donasiData.nominal) : 0,
        deskripsiBarang:
          donasiData.jenis === "Barang" ? donasiData.deskripsiBarang : "",
        status: "Menunggu Verifikasi",
        waktu: new Date().toISOString(),
      });
      setDonasiStep(2);
    } catch {
      toast.error("Terjadi kesalahan, silakan coba lagi.");
    } finally {
      setIsSubmittingDonasi(false);
    }
  };

  const closeDonasiModal = () => {
    setIsDonasiModalOpen(false);
    setTimeout(() => {
      setDonasiStep(1);
      setDonasiData({
        nama: "",
        isAnonim: false,
        jenis: "Uang",
        nominal: "",
        deskripsiBarang: "",
      });
    }, 300);
  };

  // ==========================================
  // FETCH DETAIL AGENDA
  // ==========================================
  useEffect(() => {
    const fetchAgendaDetail = async () => {
      try {
        const safeId = decodeURIComponent(id || "");

        let docRef = doc(db, "agenda", safeId);
        let docSnap = await getDoc(docRef);

        if (!docSnap.exists() && safeId.includes("-")) {
          const firestoreId = safeId.split("-").pop() || "";
          docRef = doc(db, "agenda", firestoreId);
          docSnap = await getDoc(docRef);
        }

        if (docSnap.exists()) {
          setAgenda({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.log("Agenda tidak ditemukan di database!");
        }
      } catch (error) {
        console.error("Gagal mengambil detail agenda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgendaDetail();
  }, [id]);

  const handleChange = (e: any) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const qEmail = query(
        collection(db, "agenda_peserta"),
        where("agendaId", "==", agenda.id),
        where("email", "==", formData.email),
      );
      const snapEmail = await getDocs(qEmail);
      if (!snapEmail.empty) {
        setDuplicateInfo({ type: "Alamat Email", id: snapEmail.docs[0].id });
        return setIsSubmitting(false);
      }

      const qWA = query(
        collection(db, "agenda_peserta"),
        where("agendaId", "==", agenda.id),
        where("whatsapp", "==", formData.whatsapp),
      );
      const snapWA = await getDocs(qWA);
      if (!snapWA.empty) {
        setDuplicateInfo({ type: "No. WhatsApp", id: snapWA.docs[0].id });
        return setIsSubmitting(false);
      }

      const docRef = await addDoc(collection(db, "agenda_peserta"), {
        agendaId: agenda.id,
        agendaJudul: agenda.judul,
        ...formData,
        statusCheckIn: false,
        waktuDaftar: new Date().toISOString(),
      });

      setRegisteredId(docRef.id);
      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });

      // 📧 Kirim email konfirmasi pendaftaran agenda secara background menggunakan Server Action
      sendEmailAction({
        type: "agenda_registration",
        email: formData.email,
        nama: formData.nama,
        detail: {
          judulAgenda: agenda.judul,
          tanggal: agenda.tanggal,
          waktu: agenda.waktu,
          format: agenda.format,
          tipeDaftar: formData.tipeDaftar,
          registeredId: docRef.id,
        },
      }).catch((err) => console.warn("Email notifikasi gagal:", err));

    } catch {
      toast.error("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-yellow-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!agenda) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
        <h2 className="text-2xl font-black text-blue-950">
          Agenda Tidak Ditemukan
        </h2>
        <Link href="/#agenda" className="text-blue-600 font-bold hover:underline">
          &larr; Kembali ke Beranda
        </Link>
      </div>
    );
  }

  let isPastEvent = false;
  if (agenda.tanggal && !agenda.isComingSoon) {
    const eventDateTimeString = `${agenda.tanggal}T${agenda.waktu || "23:59"}:00`;
    if (new Date() > new Date(eventDateTimeString)) isPastEvent = true;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      {/* ========================================== */}
      {/* MODAL TWIBBON (TERMASUK STATE SUKSES)      */}
      {/* ========================================== */}
      {isTwibbonModalOpen && (
        <div className="fixed inset-0 bg-blue-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div
            className={`bg-white rounded-[2rem] p-6 md:p-8 w-full shadow-2xl relative transition-all duration-300 animate-in zoom-in-95 ${twibbonSuccess ? "max-w-md" : "max-w-4xl flex flex-col md:flex-row gap-8"}`}
          >
            <button
              onClick={resetTwibbonState}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors z-10"
            >
              ✕
            </button>

            {twibbonSuccess ? (
              <div className="flex flex-col items-center justify-center text-center py-8 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-lg shadow-green-200">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-blue-950 mb-3">
                  Yeay, Berhasil! 🎉
                </h3>
                <p className="text-sm text-slate-600 mb-8 leading-relaxed px-4">
                  Foto Twibbon kamu sudah tersimpan ke galeri/perangkat. Terima
                  kasih <b>{twibbonName}</b> sudah berpartisipasi meramaikan
                  acara ini. Jangan lupa <i>share</i> ke media sosial kamu, ya!
                </p>
                <button
                  onClick={resetTwibbonState}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition-all"
                >
                  Tutup & Kembali
                </button>
              </div>
            ) : (
              <>
                {/* Kolom Kiri: Input */}
                <div className="flex-1 space-y-5">
                  <div>
                    <h3 className="text-3xl font-black text-blue-950 mb-2">
                      Pasang Twibbon
                    </h3>
                    <p className="text-sm text-slate-600">
                      Pilih foto terbaikmu, atur posisi dan ukurannya, lalu
                      bagikan di Story/Reels!
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nama Anda (Untuk Riwayat)
                    </label>
                    <input
                      type="text"
                      value={twibbonName}
                      onChange={(e) => setTwibbonName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Pilih Format Bingkai
                    </label>
                    <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
                      <button
                        onClick={() => setFrameType("story")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          frameType === "story"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        IG Story (9:16)
                      </button>
                      <button
                        onClick={() => setFrameType("post")}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          frameType === "post"
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        IG Post (4:5)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Pilih Foto Anda
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 bg-slate-50 hover:bg-blue-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="w-full text-sm text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-950 file:text-white hover:file:bg-blue-800 file:cursor-pointer cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Slider Zoom */}
                  {userPhoto && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        🔍 Perbesar / Perkecil Foto
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.05"
                        value={scale}
                        onChange={(e) => setScale(parseFloat(e.target.value))}
                        className="w-full accent-blue-900"
                      />
                      <p className="text-[10px] text-slate-500 mt-2 text-center">
                        Tahan dan geser gambar pada kotak preview untuk
                        memindahkan posisi.
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleDownloadTwibbon}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-black py-4 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2"
                  >
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download Twibbon
                  </button>
                </div>

                {/* Kolom Kanan: Preview Canvas */}
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 rounded-2xl p-4 border border-slate-200 relative min-h-[300px] transition-all">
                  {!userPhoto ? (
                    <div className="text-center opacity-40">
                      <span className="text-6xl block mb-4">🖼️</span>
                      <p className="text-lg font-black text-slate-700">
                        Preview Area ({frameType === "story" ? "9:16" : "4:5"})
                      </p>
                      <p className="text-sm">
                        Pilih foto dari perangkatmu <br />
                        untuk melihat hasil.
                      </p>
                    </div>
                  ) : (
                    <div
                      className={`w-full max-w-[280px] ${currentFrame.aspectClass} bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden relative cursor-move touch-none transition-all duration-300 mx-auto`}
                      onMouseDown={handlePointerDown}
                      onMouseMove={handlePointerMove}
                      onMouseUp={handlePointerUp}
                      onMouseLeave={handlePointerUp}
                      onTouchStart={handlePointerDown}
                      onTouchMove={handlePointerMove}
                      onTouchEnd={handlePointerUp}
                    >
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full object-cover pointer-events-none"
                      ></canvas>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL DONASI */}
      {/* ========================================== */}
      {isDonasiModalOpen && (
        <div className="fixed inset-0 bg-blue-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95">
            <button
              onClick={closeDonasiModal}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors z-10"
            >
              ✕
            </button>

            {donasiStep === 1 ? (
              <>
                <h3 className="text-2xl font-black text-blue-950 mb-2">
                  Formulir Donasi
                </h3>
                <p className="text-sm text-slate-600 mb-6 whitespace-pre-wrap">
                  {agenda.deskripsiDonasi ||
                    "Dukungan Anda sangat berarti untuk kesuksesan acara kita bersama."}
                </p>

                <form onSubmit={handleDonasiSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nama Donatur
                    </label>
                    <input
                      type="text"
                      required={!donasiData.isAnonim}
                      disabled={donasiData.isAnonim}
                      value={
                        donasiData.isAnonim ? "Hamba Allah" : donasiData.nama
                      }
                      onChange={(e) =>
                        setDonasiData({ ...donasiData, nama: e.target.value })
                      }
                      placeholder="Masukkan nama Anda"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all disabled:opacity-50"
                    />
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={donasiData.isAnonim}
                        onChange={(e) =>
                          setDonasiData({
                            ...donasiData,
                            isAnonim: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-600 font-medium">
                        Sembunyikan nama (Hamba Allah)
                      </span>
                    </label>
                  </div>

                  <div className="flex bg-slate-100 p-1.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() =>
                        setDonasiData({ ...donasiData, jenis: "Uang" })
                      }
                      className={`flex-1 py-2.5 font-bold text-sm rounded-lg transition-all ${donasiData.jenis === "Uang" ? "bg-white shadow-sm text-blue-900" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Donasi Uang
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setDonasiData({ ...donasiData, jenis: "Barang" })
                      }
                      className={`flex-1 py-2.5 font-bold text-sm rounded-lg transition-all ${donasiData.jenis === "Barang" ? "bg-white shadow-sm text-blue-900" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      Doorprice / Barang
                    </button>
                  </div>

                  {donasiData.jenis === "Uang" ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nominal (Rp)
                      </label>
                      <input
                        type="number"
                        min="10000"
                        required
                        value={donasiData.nominal}
                        onChange={(e) =>
                          setDonasiData({
                            ...donasiData,
                            nominal: e.target.value,
                          })
                        }
                        placeholder="Contoh: 100000"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all font-bold text-blue-900"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Detail Barang / Doorprice
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={donasiData.deskripsiBarang}
                        onChange={(e) =>
                          setDonasiData({
                            ...donasiData,
                            deskripsiBarang: e.target.value,
                          })
                        }
                        placeholder="Contoh: 2 Buah Sepeda Lipat, Voucher Belanja 500rb..."
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all text-sm"
                      ></textarea>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingDonasi}
                    className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {isSubmittingDonasi ? "Memproses..." : "Lanjut Konfirmasi"}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🙏
                </div>
                <h3 className="text-2xl font-black text-blue-950 mb-2">
                  Terima Kasih!
                </h3>
                <p className="text-sm text-slate-600 mb-6">
                  Niat baik Anda telah kami catat. Silakan lanjutkan proses
                  donasi sesuai petunjuk di bawah.
                </p>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-left">
                  {donasiData.jenis === "Uang" ? (
                    <>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Transfer Ke Rekening:
                      </p>
                      <p className="font-black text-blue-950 text-xl">
                        {agenda.bankDonasi || "Bank"}{" "}
                        {agenda.rekeningDonasi || "-"}
                      </p>
                      <p className="text-sm text-slate-700 mb-4">
                        a.n. {agenda.atasNamaDonasi || "-"}
                      </p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Nominal:
                      </p>
                      <p className="font-bold text-yellow-600">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                        }).format(Number(donasiData.nominal))}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Kirim Barang Ke Alamat:
                      </p>
                      <p className="font-bold text-blue-950 text-sm whitespace-pre-wrap mb-4">
                        {agenda.alamatDonasi ||
                          "Sekretariat DPW IKA UII\n(Silakan hubungi admin via WhatsApp untuk alamat lengkap pengiriman)"}
                      </p>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Barang Donasi:
                      </p>
                      <p className="font-bold text-blue-900">
                        {donasiData.deskripsiBarang}
                      </p>
                    </>
                  )}
                </div>

                <a
                  href={`https://wa.me/${agenda.waDonasi || "6281234567890"}?text=Halo Admin, saya ${donasiData.isAnonim ? "Hamba Allah" : donasiData.nama} ingin konfirmasi donasi ${donasiData.jenis} untuk acara ${agenda.judul}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 mb-3"
                  onClick={closeDonasiModal}
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  </svg>
                  Konfirmasi via WhatsApp
                </a>
                <p className="text-xs text-slate-400">
                  Penting: Admin akan memverifikasi dana/barang sebelum
                  memunculkannya di halaman utama.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DUPLIKAT */}
      {duplicateInfo && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative text-center animate-in zoom-in-95">
            <button
              onClick={() => setDuplicateInfo(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors"
            >
              ✕
            </button>
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
              ⚠️
            </div>
            <h3 className="text-2xl font-black text-blue-950 mb-2">
              Sudah Terdaftar!
            </h3>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Data dengan <b>{duplicateInfo.type}</b> tersebut sudah tercatat.
              Berikut adalah QR Code tiket Anda sebelumnya:
            </p>
            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 mx-auto inline-block w-full max-w-[200px] mb-6 shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${duplicateInfo.id}`}
                alt="QR Code Tiket"
                className="w-full aspect-square mix-blend-multiply"
              />
            </div>
            <button
              onClick={() => setDuplicateInfo(null)}
              className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md"
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      )}

      {/* HEADER AGENDA */}
      <div className="bg-blue-950 pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <Link
            href="/#agenda"
            className="text-yellow-400 text-sm font-bold flex items-center gap-2 mb-6 hover:text-yellow-300 w-fit transition-colors"
          >
            &larr; Kembali ke Daftar Agenda
          </Link>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4">
            {agenda.judul}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-blue-200">
            <span className="flex items-center gap-2 bg-blue-900 px-3 py-1 rounded-lg">
              📅{" "}
              {agenda.tanggal
                ? new Date(agenda.tanggal).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Segera Hadir"}
            </span>
            <span className="flex items-center gap-2 bg-blue-900 px-3 py-1 rounded-lg">
              ⏰ {agenda.waktu || "00:00"} WIB
            </span>
            <span className="flex items-center gap-2 bg-blue-900 px-3 py-1 rounded-lg">
              📍 {agenda.format}
            </span>
            {isPastEvent && (
              <span className="flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-lg font-bold shadow-sm border border-red-400">
                🔒 Acara Telah Berlalu
              </span>
            )}
          </div>
        </div>
      </div>

      <main className="flex-grow max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* KOLOM KIRI: POSTER & DESKRIPSI */}
          <div className="w-full lg:w-3/5 space-y-8">
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-center relative">
              <div className="aspect-[4/5] w-full max-w-lg rounded-2xl overflow-hidden bg-slate-50 relative border border-slate-100 shadow-inner">
                {agenda.imgUrl || agenda.posterUrl ? (
                  (() => {
                    const url = agenda.imgUrl || agenda.posterUrl;
                    const isRawVideo = url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');
                    return isRawVideo ? (
                      <video
                        src={url}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className={`w-full h-full object-cover transition-all ${isPastEvent ? "grayscale" : ""}`}
                      />
                    ) : (
                      <img
                        src={url}
                        alt="Poster Agenda"
                        className={`w-full h-full object-cover transition-all ${isPastEvent ? "grayscale" : ""}`}
                      />
                    );
                  })()
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                    <img
                      src="/logo-dpp-ika.png"
                      className="w-24 md:w-32 object-contain"
                      alt="logo"
                    />
                    <p className="mt-4 font-black tracking-widest text-slate-600">
                      DPW IKA UII
                    </p>
                  </div>
                )}
                {isPastEvent && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-xl tracking-widest uppercase transform -rotate-12 border-4 border-white shadow-2xl">
                      Telah Berakhir
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-blue-950 mb-4 border-b border-slate-100 pb-4">
                Informasi Kegiatan
              </h3>
              <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                {agenda.deskripsi}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Penyelenggara
                  </p>
                  <p className="font-bold text-blue-950">{agenda.bidang}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Koordinator / PIC
                  </p>
                  <p className="font-bold text-blue-950">
                    {agenda.koordinator}
                  </p>
                </div>
                <div
                  className={`bg-slate-50 p-4 rounded-xl border border-slate-100 ${agenda.link ? "" : "col-span-2"}`}
                >
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                    Jenis Tiket
                  </p>
                  <p className="font-bold text-yellow-600">{agenda.tiket}</p>
                </div>
                {agenda.link && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">
                      Lokasi Acara
                    </p>
                    <a
                      href={
                        agenda.link.startsWith("http")
                          ? agenda.link
                          : `https://${agenda.link}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5 transition-colors"
                    >
                      {agenda.format === "Online Event"
                        ? "🔗 Buka Link Zoom"
                        : "📍 Buka Google Maps"}
                    </a>
                  </div>
                )}
              </div>

              {/* CONDITIONAL RENDER: TWIBBON */}
              {agenda.isTwibbonActive && (
                <div className="mt-8 bg-gradient-to-r from-blue-900 to-blue-950 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg border border-blue-800">
                  <div className="text-left">
                    <h4 className="text-lg font-black text-white mb-1">
                      🎉 Mari Ramaikan Acara Ini!
                    </h4>
                    <p className="text-sm text-blue-200">
                      Gunakan twibbon resmi kami, pasang fotomu, dan bagikan
                      keseruannya di media sosial.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsTwibbonModalOpen(true)}
                    className="shrink-0 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-black py-3 px-6 rounded-xl transition-all shadow-md flex items-center gap-2 hover:-translate-y-1"
                  >
                    Pasang Twibbon
                  </button>
                </div>
              )}

              {/* CONDITIONAL RENDER: DONASI */}
              {agenda.isDonasiActive && (
                <div className="mt-8 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 p-6 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="font-black text-blue-950 text-xl flex items-center gap-2">
                        🤝 Donasi & Dukungan
                      </h4>
                      <p className="text-sm text-slate-500 mt-1">
                        Bantu sukseskan acara reuni kita tercinta.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsDonasiModalOpen(true)}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md"
                    >
                      Mulai Donasi
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100 mb-6 flex flex-col items-center justify-center text-center">
                      <p className="text-xs font-bold text-green-700 uppercase tracking-widest mb-1">
                        Dana Terkumpul
                      </p>
                      <p className="text-3xl font-black text-green-600">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(totalDanaTerkumpul)}
                      </p>
                    </div>

                    <h5 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Riwayat Donatur ({listDonatur.length})
                    </h5>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {listDonatur.length === 0 ? (
                        <p className="text-sm text-slate-400 italic text-center py-4">
                          Belum ada donasi terverifikasi. Jadilah yang pertama!
                        </p>
                      ) : (
                        listDonatur.map((donatur) => (
                          <div
                            key={donatur.id}
                            className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100"
                          >
                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                              {donatur.nama.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-blue-950 truncate">
                                {donatur.nama}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(donatur.waktu).toLocaleDateString(
                                  "id-ID",
                                  { day: "numeric", month: "short" },
                                )}{" "}
                                • {donatur.jenis}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-slate-700">
                                {donatur.jenis === "Uang"
                                  ? new Intl.NumberFormat("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                      maximumFractionDigits: 0,
                                    }).format(donatur.nominal)
                                  : "🎁 Barang"}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: FORM REGISTRASI / STATUS */}
          <div className="w-full lg:w-2/5 lg:sticky lg:top-28">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 rounded-bl-full -z-0 pointer-events-none"></div>

              {/* 🌟 LOGIKA BARU: CEK LINK EKSTERNAL / VIRTUAL RUN 🌟 */}
              {agenda.linkEksternal ? (
                <>
                  <h3 className="text-2xl font-black text-blue-950 mb-4 relative z-10">
                    Pendaftaran Khusus
                  </h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center relative z-10 flex flex-col items-center justify-center gap-5 shadow-sm">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-4xl">🏃‍♂️</span>
                    </div>
                    <div>
                      <h4 className="font-black text-blue-900 text-lg mb-2">
                        Pendaftaran via Portal Khusus
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        Registrasi dan pengelolaan aktivitas untuk kegiatan ini
                        dilakukan melalui website / portal khusus yang telah
                        kami sediakan.
                      </p>
                    </div>
                    <a
                      href={
                        agenda.linkEksternal.startsWith("http")
                          ? agenda.linkEksternal
                          : `https://${agenda.linkEksternal}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      Kunjungi Website Pendaftaran &rarr;
                    </a>
                  </div>
                </>
              ) : agenda.isComingSoon ? (
                <>
                  <h3 className="text-2xl font-black text-blue-950 mb-6 relative z-10">
                    Form Registrasi
                  </h3>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center relative z-10">
                    <span className="text-4xl block mb-3">⏳</span>
                    <h4 className="font-black text-yellow-800 text-lg mb-1">
                      Pendaftaran Belum Dibuka
                    </h4>
                  </div>
                </>
              ) : isPastEvent ? (
                // TAMPILAN JIKA ACARA SUDAH LEWAT
                <>
                  <h3 className="text-2xl font-black text-blue-950 mb-6 relative z-10">
                    Status Pendaftaran
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center relative z-10 shadow-sm">
                    <span className="text-5xl block mb-4">🔒</span>
                    <h4 className="font-black text-red-800 text-xl mb-2">
                      Pendaftaran Ditutup
                    </h4>
                    <p className="text-red-600 font-medium text-sm px-4">
                      Terima kasih atas antusiasme Anda. Registrasi telah
                      ditutup karena waktu acara telah berlalu.
                    </p>
                  </div>
                </>
              ) : isSuccess ? (
                <div className="text-center animate-in zoom-in duration-300 relative z-10">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-3 shadow-lg shadow-green-200">
                    ✓
                  </div>
                  <h4 className="font-black text-blue-950 text-2xl mb-2">
                    Pendaftaran Berhasil!
                  </h4>
                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 mb-6 inline-block w-full max-w-[250px] shadow-sm relative overflow-hidden">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${registeredId}`}
                      alt="QR Code"
                      className="w-full aspect-square mix-blend-multiply"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setFormData({
                        ...formData,
                        nama: "",
                        email: "",
                        whatsapp: "",
                      });
                    }}
                    className="w-full bg-slate-100 hover:bg-slate-200 font-bold py-3.5 rounded-xl transition-all"
                  >
                    Daftarkan Peserta Lain
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-black text-blue-950 mb-4 relative z-10">
                    Form Registrasi
                  </h3>

                  <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6 relative z-10">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          tipeDaftar: "Individu",
                          jumlahTiket: 1,
                          namaAnggota: "",
                        })
                      }
                      className={`flex-1 py-2.5 font-bold text-sm rounded-lg transition-all ${formData.tipeDaftar === "Individu" ? "bg-white shadow-sm text-blue-900" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      👤 Individu
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          tipeDaftar: "Kelompok",
                          jumlahTiket: 2,
                        })
                      }
                      className={`flex-1 py-2.5 font-bold text-sm rounded-lg transition-all ${formData.tipeDaftar === "Kelompok" ? "bg-white shadow-sm text-blue-900" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      👥 Rombongan
                    </button>
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4 relative z-10"
                  >
                    {formData.tipeDaftar === "Kelompok" && (
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
                            Jumlah Orang (Termasuk Anda)
                          </label>
                          <input
                            type="number"
                            name="jumlahTiket"
                            min="2"
                            max="50"
                            value={formData.jumlahTiket}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold text-blue-900"
                            placeholder="Min. 2 Orang"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">
                            Nama Anggota Rombongan
                          </label>
                          <textarea
                            name="namaAnggota"
                            value={formData.namaAnggota}
                            onChange={handleChange}
                            required
                            rows={3}
                            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
                            placeholder="Contoh: Budi (FTI 2018), Siti (FE 2018), dst..."
                          ></textarea>
                          <p className="text-[10px] text-blue-600 mt-1 font-medium">
                            Satu QR Code akan digunakan bersama untuk seluruh
                            anggota rombongan ini.
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        {formData.tipeDaftar === "Kelompok"
                          ? "Nama Ketua Rombongan"
                          : "Nama Lengkap & Gelar"}
                      </label>
                      <input
                        type="text"
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                        placeholder="Contoh: Fulan, S.T., M.Eng."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Alamat Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                        placeholder="Contoh: alumni@gmail.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        No. WhatsApp (Aktif)
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                        placeholder="Contoh: 08123456789"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Asal Fakultas
                        </label>
                        <input
                          type="text"
                          name="fakultas"
                          value={formData.fakultas}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                          placeholder="Contoh: FTI"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Angkatan
                        </label>
                        <input
                          type="number"
                          name="angkatan"
                          value={formData.angkatan}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                          placeholder="Contoh: 2018"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Instansi / Pekerjaan
                      </label>
                      <input
                        type="text"
                        name="instansi"
                        value={formData.instansi}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all"
                        placeholder="Contoh: PT. Inovasi Bangsa / Dosen"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-black py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {isSubmitting ? (
                          "Memproses Verifikasi Data..."
                        ) : (
                          <>
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
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Kirim Pendaftaran
                          </>
                        )}
                      </button>

                      {agenda.linkGForm && (
                        <div className="mt-6 text-center animate-in fade-in duration-700 delay-300">
                          <p className="text-xs text-slate-500 mb-1.5">
                            Sistem sibuk atau ada kendala error di HP Anda?
                          </p>
                          <a
                            href={agenda.linkGForm}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-blue-100"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                            Daftar via Alternatif Form
                          </a>
                        </div>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <FooterPublic />
    </div>
  );
}
