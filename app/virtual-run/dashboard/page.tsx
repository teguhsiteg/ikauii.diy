"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import Link from "next/link";
import { QRCodeCanvas } from "qrcode.react";

export default function ParticipantDashboard() {
  // --- STATE LOGIN ---
  const [emailLogin, setEmailLogin] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // --- STATE MULTI-EVENT ---
  const [participantList, setParticipantList] = useState<any[]>([]);
  const [participant, setParticipant] = useState<any>(null);

  // --- STATE SETTING ADMIN (DIBUTUHKAN UNTUK METODE BAYAR) ---
  const [vrSettings, setVrSettings] = useState<any>(null);

  // --- STATE DASHBOARD & UPLOAD BUKTI LARI ---
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [uploadData, setUploadData] = useState({
    km: "",
    durasi: "",
    tanggalLari: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // --- STATE UPLOAD BUKTI PEMBAYARAN (MANUAL/QRIS) ---
  const [selectedPaymentFile, setSelectedPaymentFile] = useState<File | null>(
    null,
  );
  const [previewPaymentUrl, setPreviewPaymentUrl] = useState<string | null>(
    null,
  );
  const [isUploadingPayment, setIsUploadingPayment] = useState(false);

  // --- STATE EDIT PROFIL ---
  const [motto, setMotto] = useState("");
  const [profilFile, setProfilFile] = useState<File | null>(null);
  const [headerFile, setHeaderFile] = useState<File | null>(null);
  const [isUpdatingProfil, setIsUpdatingProfil] = useState(false);

  // --- STATE UI NAVIGATION, MODALS, & PAYMENTS ---
  const [popup, setPopup] = useState<{
    type: "success" | "error" | "info" | "loading";
    title: string;
    text: string;
  } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeView, setActiveView] = useState<
    "dashboard" | "riwayat" | "profil"
  >("dashboard");
  const [isPaying, setIsPaying] = useState(false);

  // --- BASE URL UNTUK QR CODE ---
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  // --- 0. LOAD SCRIPT MIDTRANS & SETTING ADMIN & CEK SESI ---
  useEffect(() => {
    const fetchSettingsAndInit = async () => {
      try {
        const docRef = doc(db, "settings", "virtual_run");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setVrSettings(data);

          // A. Load Script Midtrans HANYA jika metode adalah midtrans
          if (data.metodePembayaran === "midtrans" && data.midtransClientKey) {
            const scriptUrl = data.isProduction
              ? "https://app.midtrans.com/snap/snap.js"
              : "https://app.sandbox.midtrans.com/snap/snap.js";

            if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
              const scriptTag = document.createElement("script");
              scriptTag.src = scriptUrl;
              scriptTag.setAttribute("data-client-key", data.midtransClientKey);
              scriptTag.async = true;
              document.body.appendChild(scriptTag);
            }
          }
        }
      } catch (error) {
        console.error("Gagal load pengaturan:", error);
      }
    };

    fetchSettingsAndInit();

    // B. Cek Local Storage untuk Auto-Login
    const savedEmail = localStorage.getItem("vr_user_email");
    if (savedEmail) {
      setEmailLogin(savedEmail);
      performLogin(savedEmail, true);
    } else {
      setIsCheckingSession(false);
    }
  }, []);

  // Set default motto kalau data participant sudah di-load
  useEffect(() => {
    if (participant && participant.motto) {
      setMotto(participant.motto);
    }
  }, [participant]);

  // --- 1. LOGIKA LOGIN UTAMA ---
  const performLogin = async (emailToCheck: string, isAutoLogin = false) => {
    setIsLoggingIn(true);

    try {
      const q = query(
        collection(db, "vr_participants"),
        where("email", "==", emailToCheck.trim().toLowerCase()),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        if (!isAutoLogin) {
          setPopup({
            type: "error",
            title: "Email Tidak Ditemukan",
            text: "Pastikan alamat email sama persis dengan yang didaftarkan. Jika belum, silakan registrasi.",
          });
        }
        localStorage.removeItem("vr_user_email");
      } else {
        const records = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        records.sort(
          (a: any, b: any) =>
            new Date(b.waktuDaftar).getTime() -
            new Date(a.waktuDaftar).getTime(),
        );

        localStorage.setItem(
          "vr_user_email",
          emailToCheck.trim().toLowerCase(),
        );
        setParticipantList(records);

        // Listener realtime agar status lunas langsung update
        onSnapshot(doc(db, "vr_participants", records[0].id), (docSnap) => {
          if (docSnap.exists()) {
            setParticipant({ id: docSnap.id, ...docSnap.data() });
          }
        });

        setActiveView("dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (!isAutoLogin) {
        setPopup({
          type: "error",
          title: "Koneksi Bermasalah",
          text: "Gagal terhubung ke server.",
        });
      }
    } finally {
      setIsLoggingIn(false);
      setIsCheckingSession(false);
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(emailLogin, false);
  };

  const handleLogout = () => {
    localStorage.removeItem("vr_user_email");
    setParticipantList([]);
    setParticipant(null);
    setEmailLogin("");
    setSubmissions([]);
    setIsDropdownOpen(false);
  };

  const handleLupaEmail = () => {
    setPopup({
      type: "info",
      title: "Lupa Email Pendaftaran?",
      text: "Silakan hubungi WhatsApp/Instagram Admin IKA UII DIY beserta Nama Lengkap Anda.",
    });
  };

  const handleSwitchEvent = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selectedEvent = participantList.find((p) => p.id === selectedId);

    if (selectedEvent) {
      setParticipant(selectedEvent);
      setActiveView("dashboard");
    }
  };

  const pindahKeDashboardEvent = (id: string) => {
    const ev = participantList.find((p) => p.id === id);
    if (ev) {
      setParticipant(ev);
      setActiveView("dashboard");
    }
  };

  // --- 2. AMBIL DATA RIWAYAT LARI ---
  useEffect(() => {
    if (!participant) return;

    const q = query(
      collection(db, "vr_submissions"),
      where("participantId", "==", participant.id),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setSubmissions(data);
    });

    return () => unsubscribe();
  }, [participant?.id]);

  // --- 3. LOGIKA UPLOAD BUKTI LARI ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile)
      return setPopup({
        type: "error",
        title: "Pilih Foto",
        text: "Anda belum memilih foto screenshot bukti lari.",
      });

    if (!uploadData.km || !uploadData.durasi || !uploadData.tanggalLari)
      return setPopup({
        type: "error",
        title: "Data Belum Lengkap",
        text: "Mohon isi formulir dengan lengkap.",
      });

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("upload_preset", "eventrunning");
      formData.append("cloud_name", "dp8hmxuix");

      const cloudinaryRes = await fetch(
        "https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload",
        { method: "POST", body: formData },
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryData.secure_url)
        throw new Error("Gagal mengunggah ke Cloudinary");

      await addDoc(collection(db, "vr_submissions"), {
        participantId: participant.id,
        nama: participant.nama,
        jarakKm: Number(uploadData.km),
        durasi: uploadData.durasi,
        tanggalLari: uploadData.tanggalLari,
        imgUrl: cloudinaryData.secure_url,
        status: "Pending",
        createdAt: new Date().toISOString(),
      });

      // Trigger Email ke Admin
      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "admin_notif_run",
          email: "236102601@uii.ac.id", // Ganti dengan email asli admin
          nama: participant.nama,
          detail: { jarakKm: uploadData.km },
        }),
      }).catch((e) => console.log(e));

      setPopup({
        type: "success",
        title: "Bukti Terkirim!",
        text: "Menunggu verifikasi admin agar masuk ke Total Kilometer Anda.",
      });

      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadData({ km: "", durasi: "", tanggalLari: "" });
    } catch (error) {
      setPopup({
        type: "error",
        title: "Gagal Mengunggah",
        text: "Pastikan format foto benar dan internet stabil.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // --- 4. LOGIKA PEMBAYARAN MIDTRANS ---
  const handlePayNow = async (forceNewToken = false) => {
    if (!participant) return;

    setIsPaying(true);

    try {
      let tokenToUse = forceNewToken ? null : participant.snapToken;
      const midtransOrderId = forceNewToken
        ? `${participant.id}-${Date.now()}`
        : participant.id;

      if (!tokenToUse) {
        const response = await fetch("/api/vr-midtrans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: midtransOrderId,
            grossAmount: participant.totalTagihan,
            customerName: participant.nama,
            customerEmail: participant.email,
            customerPhone: participant.whatsapp,
          }),
        });

        const resData = await response.json();

        if (!response.ok)
          throw new Error(
            resData.error || "Gagal menghubungi server Midtrans.",
          );

        tokenToUse = resData.token;

        await updateDoc(doc(db, "vr_participants", participant.id), {
          snapToken: tokenToUse,
        });
      }

      // @ts-ignore
      window.snap.pay(tokenToUse, {
        onSuccess: async function () {
          try {
            await updateDoc(doc(db, "vr_participants", participant.id), {
              statusPembayaran: "Lunas",
            });

            // Trigger Email ke Admin
            fetch("/api/send-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "admin_notif_payment",
                email: "236102601@uii.ac.id", // Email Admin
                nama: participant.nama,
                detail: {},
              }),
            }).catch((e) => console.log(e));

            setPopup({
              type: "success",
              title: "Pembayaran Berhasil!",
              text: "Luar biasa! Sistem telah memverifikasi pembayaran Anda secara otomatis. Selamat berlari!",
            });
          } catch (err) {
            setPopup({
              type: "success",
              title: "Pembayaran Berhasil",
              text: "Pembayaran diterima. Jika dashboard belum update, silakan refresh.",
            });
          }
        },
        onPending: function () {
          setPopup({
            type: "info",
            title: "Menunggu Pembayaran",
            text: "Silakan selesaikan pembayaran Anda. Instruksi telah dikirimkan oleh sistem Midtrans.",
          });
        },
        onError: function () {
          setPopup({
            type: "error",
            title: "Pembayaran Gagal",
            text: "Maaf, transaksi Anda dibatalkan atau masa berlaku pembayaran habis.",
          });
        },
        onClose: function () {
          setIsPaying(false);
        },
      });
    } catch (error: any) {
      console.error(error);
      setPopup({
        type: "error",
        title: "Sistem Sibuk",
        text:
          error.message ||
          "Gagal memproses pembayaran, coba beberapa saat lagi.",
      });
    } finally {
      setIsPaying(false);
    }
  };

  // --- 5. LOGIKA UPLOAD BUKTI PEMBAYARAN (MANUAL / QRIS) ---
  const handlePaymentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedPaymentFile(file);
      setPreviewPaymentUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPaymentFile)
      return setPopup({
        type: "error",
        title: "Pilih Foto",
        text: "Anda belum memilih foto struk/bukti transfer.",
      });

    setIsUploadingPayment(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedPaymentFile);
      formData.append("upload_preset", "eventrunning");
      formData.append("cloud_name", "dp8hmxuix");

      const cloudinaryRes = await fetch(
        "https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload",
        { method: "POST", body: formData },
      );

      const cloudinaryData = await cloudinaryRes.json();

      if (!cloudinaryData.secure_url)
        throw new Error("Gagal mengunggah ke Cloudinary");

      await updateDoc(doc(db, "vr_participants", participant.id), {
        buktiBayarUrl: cloudinaryData.secure_url,
        statusPembayaran: "Pending",
      });

      setPopup({
        type: "success",
        title: "Struk Terkirim!",
        text: "Bukti pembayaran berhasil diunggah. Admin akan segera memverifikasi transaksi Anda.",
      });

      setSelectedPaymentFile(null);
      setPreviewPaymentUrl(null);
    } catch (error) {
      setPopup({
        type: "error",
        title: "Gagal Mengunggah",
        text: "Pastikan format foto benar dan internet stabil.",
      });
    } finally {
      setIsUploadingPayment(false);
    }
  };

  // --- FUNGSI UPDATE PROFIL (CLOUDINARY) ---
  const handleUpdateProfil = async () => {
    if (!participant) return;
    setIsUpdatingProfil(true);

    try {
      let profilUrl = participant.fotoProfilUrl || "";
      let headerUrl = participant.fotoHeaderUrl || "";

      const uploadToCloudinary = async (file: File) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "eventrunning");
        formData.append("cloud_name", "dp8hmxuix");
        const res = await fetch(
          "https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload",
          {
            method: "POST",
            body: formData,
          },
        );
        const data = await res.json();
        if (!data.secure_url) throw new Error("Gagal upload");
        return data.secure_url;
      };

      if (profilFile) profilUrl = await uploadToCloudinary(profilFile);
      if (headerFile) headerUrl = await uploadToCloudinary(headerFile);

      await updateDoc(doc(db, "vr_participants", participant.id), {
        motto: motto,
        fotoProfilUrl: profilUrl,
        fotoHeaderUrl: headerUrl,
      });

      setParticipant({
        ...participant,
        motto: motto,
        fotoProfilUrl: profilUrl,
        fotoHeaderUrl: headerUrl,
      });

      setProfilFile(null);
      setHeaderFile(null);

      setPopup({
        type: "success",
        title: "Profil Disimpan",
        text: "Perubahan profil publik berhasil disimpan!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setPopup({
        type: "error",
        title: "Gagal Menyimpan",
        text: "Terjadi kesalahan saat mengunggah foto profil.",
      });
    } finally {
      setIsUpdatingProfil(false);
    }
  };

  // --- HITUNGAN STATISTIK ---
  const targetKm = participant
    ? parseInt(participant.jarak.replace(/\D/g, ""))
    : 0;

  const approvedSubmissions = submissions.filter(
    (s) => s.status === "Approved",
  );

  const totalApprovedKm = approvedSubmissions.reduce(
    (acc, curr) => acc + (curr.jarakKm || 0),
    0,
  );

  const progressPercent = Math.min((totalApprovedKm / targetKm) * 100, 100);
  const isFinisher = totalApprovedKm >= targetKm;
  const isLunas = participant?.statusPembayaran === "Lunas";
  const totalAktivitas = approvedSubmissions.length;

  const hitungTotalDurasi = () => {
    let totalSeconds = 0;
    approvedSubmissions.forEach((sub) => {
      if (!sub.durasi) return;
      let sec = 0;
      const str = String(sub.durasi).toLowerCase().trim();

      if (str.includes(":")) {
        const parts = str.split(":").map((n) => parseInt(n) || 0);
        if (parts.length >= 3) {
          sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
          sec = parts[0] * 60 + parts[1];
        }
      } else if (str.includes("j") || str.includes("h") || str.includes("m")) {
        const jamMatch = str.match(/(\d+)\s*(j|h)/);
        const menitMatch = str.match(/(\d+)\s*(m)/);
        if (jamMatch) sec += parseInt(jamMatch[1]) * 3600;
        if (menitMatch) sec += parseInt(menitMatch[1]) * 60;
      } else {
        const match = str.match(/\d+/);
        if (match) sec = parseInt(match[0]) * 60;
      }

      if (!isNaN(sec)) {
        totalSeconds += sec;
      }
    });

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // 🔥 HELPER GAMIFIKASI LEVEL BADGE 🔥
  const getRunnerBadge = (km: number) => {
    if (km >= 42) {
      return {
        level: "Ultra Legend",
        icon: "👑",
        bgClass: "bg-gradient-to-br from-purple-600 to-indigo-800",
        textClass: "text-purple-200",
        borderClass: "border-purple-400/30",
        nextTarget: null,
      };
    }
    if (km >= 21) {
      return {
        level: "Half Marathoner",
        icon: "🔥",
        bgClass: "bg-gradient-to-br from-rose-500 to-orange-500",
        textClass: "text-orange-100",
        borderClass: "border-orange-300/30",
        nextTarget: 42,
      };
    }
    if (km >= 10) {
      return {
        level: "Rookie Runner",
        icon: "⚡",
        bgClass: "bg-gradient-to-br from-blue-500 to-cyan-600",
        textClass: "text-cyan-100",
        borderClass: "border-cyan-300/30",
        nextTarget: 21,
      };
    }

    return {
      level: "Pemanasan",
      icon: "👟",
      bgClass: "bg-gradient-to-br from-slate-600 to-slate-800",
      textClass: "text-slate-300",
      borderClass: "border-slate-500/30",
      nextTarget: 10,
    };
  };

  // --- HELPER UNTUK KUITANSI ---
  const terbilang = (angka: number) => {
    const huruf = [
      "",
      "Satu",
      "Dua",
      "Tiga",
      "Empat",
      "Lima",
      "Enam",
      "Tujuh",
      "Delapan",
      "Sembilan",
      "Sepuluh",
      "Sebelas",
    ];
    let hasil = "";

    if (angka < 12) hasil = huruf[angka];
    else if (angka < 20) hasil = terbilang(angka - 10) + " Belas";
    else if (angka < 100)
      hasil =
        terbilang(Math.floor(angka / 10)) + " Puluh " + terbilang(angka % 10);
    else if (angka < 200) hasil = "Seratus " + terbilang(angka - 100);
    else if (angka < 1000)
      hasil =
        terbilang(Math.floor(angka / 100)) + " Ratus " + terbilang(angka % 100);
    else if (angka < 2000) hasil = "Seribu " + terbilang(angka - 1000);
    else if (angka < 1000000)
      hasil =
        terbilang(Math.floor(angka / 1000)) +
        " Ribu " +
        terbilang(angka % 1000);
    else if (angka < 1000000000)
      hasil =
        terbilang(Math.floor(angka / 1000000)) +
        " Juta " +
        terbilang(angka % 1000000);

    return hasil.trim();
  };

  const wrapText = (
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
  ) => {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = context.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        context.fillText(line.trim(), x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    context.fillText(line.trim(), x, currentY);
    return currentY;
  };

  const triggerDownload = (canvas: HTMLCanvasElement, filename: string) => {
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setPopup(null);
  };

  // --- 6. LOGIKA DOWNLOAD DOKUMEN DIGITAL (HIGH-RES CANVAS) ---
  const handleDownloadDocument = async (
    type: "bib" | "sertifikat" | "kuitansi",
  ) => {
    if (!participant) return;

    setPopup({
      type: "loading",
      title: "Memproses...",
      text: `Sedang membuat dokumen High-Res Anda...`,
    });

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) throw new Error("Canvas tidak didukung browser ini");

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // ============================================
      // LOGIKA GENERATE KUITANSI HD
      // ============================================
      if (type === "kuitansi") {
        const baseWidth = 1260;
        const baseHeight = 480;
        const scaleFactor = 2;

        canvas.width = baseWidth * scaleFactor;
        canvas.height = baseHeight * scaleFactor;
        ctx.scale(scaleFactor, scaleFactor);

        const logoImg = new Image();
        logoImg.src = "/logo-dpp-ika.png";

        logoImg.onload = () => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, baseWidth, baseHeight);
          ctx.save();
          ctx.globalAlpha = 0.04;
          const wmkSize = 380;
          ctx.drawImage(
            logoImg,
            320 + (940 - wmkSize) / 2,
            (baseHeight - wmkSize) / 2,
            wmkSize,
            wmkSize,
          );
          ctx.restore();

          const sidebarWidth = 320;
          const sidebarGradient = ctx.createLinearGradient(
            0,
            0,
            sidebarWidth,
            0,
          );
          sidebarGradient.addColorStop(0, "#1e3a8a");
          sidebarGradient.addColorStop(1, "#1e40af");
          ctx.fillStyle = sidebarGradient;
          ctx.fillRect(0, 0, sidebarWidth, baseHeight);

          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(sidebarWidth - 4, 0, 4, baseHeight);
          ctx.drawImage(logoImg, 40, 40, 60, 60);

          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 38px Arial";
          ctx.fillText("KUITANSI", 115, 70);

          ctx.font = "16px Arial";
          ctx.fillText("DPW IKA UII DIY", 115, 95);

          ctx.font = "bold 13px Arial";
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          ctx.fillText(`Nomor Dokumen/Invoice:`, 40, 220);

          ctx.font = "bold 18px Arial";
          ctx.fillStyle = "#ffffff";
          ctx.fillText(
            `INV-VR-${participant.id.substring(0, 8).toUpperCase()}`,
            40,
            245,
          );

          const qrElement = document.getElementById(
            "qr-kuitansi-vr",
          ) as HTMLCanvasElement;

          if (qrElement) {
            const qrImg = new Image();
            qrImg.src = qrElement.toDataURL("image/png");
            qrImg.onload = () => {
              ctx.drawImage(qrImg, 40, 270, 160, 160);
              ctx.font = "11px Arial";
              ctx.textAlign = "center";
              ctx.fillStyle = "rgba(255,255,255,0.8)";
              ctx.fillText("Scan untuk validasi kriptografi sah", 120, 450);
              renderRightArea();
            };
          } else {
            renderRightArea();
          }
        };

        const renderRightArea = () => {
          ctx.textAlign = "left";

          const startX = 360,
            colonX = 560,
            textX = 580,
            maxTextW = 640;

          let startY = 70,
            gapY = 35;

          const drawRow = (
            label: string,
            value: string,
            valueColor: string,
            valueFont: string,
            isBox = false,
          ) => {
            ctx.font = "bold 14px Arial";
            ctx.fillStyle = "#64748b";
            ctx.fillText(label, startX, startY);
            ctx.fillText(":", colonX, startY);
            ctx.font = valueFont;
            ctx.fillStyle = valueColor;

            if (isBox) {
              ctx.fillStyle = "#f1f5f9";
              ctx.strokeStyle = "#cbd5e1";
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.roundRect(textX - 15, startY - 30, 420, 45, 8);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = valueColor;
              ctx.fillText(value, textX, startY);
              startY += gapY + 25;
            } else {
              const endY = wrapText(ctx, value, textX, startY, maxTextW, 24);
              startY = endY + gapY;
            }
          };

          const keteranganVR = `Pembayaran Tiket Virtual Run 2026 - Kategori ${participant.jarak} (Paket ${participant.paket.toUpperCase()})`;

          drawRow(
            "KATEGORI / EVENT",
            "Event Virtual Run",
            "#1d4ed8",
            "bold 18px Arial",
          );

          drawRow(
            "TELAH TERIMA DARI",
            participant.nama,
            "#0f172a",
            "18px Arial",
          );

          drawRow(
            "UANG SEBESAR",
            `Rp ${Number(participant.totalTagihan).toLocaleString("id-ID")}`,
            "#1e3a8a",
            "bold 24px Arial",
            true,
          );

          drawRow(
            "TERBILANG",
            `${terbilang(Number(participant.totalTagihan))} Rupiah`,
            "#334155",
            "italic 16px Arial",
          );

          drawRow("GUNA PEMBAYARAN", keteranganVR, "#334155", "16px Arial");

          ctx.textAlign = "center";
          const ttdX = 1050;
          ctx.font = "14px Arial";
          ctx.fillStyle = "#334155";
          const tglLunas = participant.waktuDaftar
            ? new Date(participant.waktuDaftar)
            : new Date();

          ctx.fillText(
            `Yogyakarta, ${tglLunas.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
            ttdX,
            baseHeight - 120,
          );

          ctx.font = "bold 16px Arial";
          ctx.fillStyle = "#0f172a";
          ctx.fillText("Sistem Pembayaran", ttdX, baseHeight - 50);

          ctx.font = "13px Arial";
          ctx.fillStyle = "#64748b";
          ctx.fillText("Virtual Run IKA UII", ttdX, baseHeight - 32);

          ctx.strokeStyle = "#cbd5e1";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ttdX - 140, baseHeight - 45);
          ctx.lineTo(ttdX + 140, baseHeight - 45);
          ctx.stroke();

          ctx.fillStyle = "#10b981";
          ctx.font = "bold 11px Arial";
          ctx.fillText(
            "TERVERIFIKASI SISTEM (AUTO-VERIFIED)",
            ttdX,
            baseHeight - 15,
          );

          ctx.save();
          ctx.translate(baseWidth / 2 + 100, baseHeight / 2);
          ctx.rotate(-Math.PI / 6);
          ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
          ctx.font = "bold 120px Arial";
          ctx.textAlign = "center";
          ctx.fillText("LUNAS", 0, 0);
          ctx.restore();

          triggerDownload(
            canvas,
            `Kuitansi-VR-${participant.nama.replace(/\s+/g, "-")}.png`,
          );
        };

        return;
      }

      // ============================================
      // LOGIKA GENERATE E-BIB & E-CERT
      // ============================================
      const docRef = doc(db, "settings", "virtual_run");
      const snap = await getDoc(docRef);

      if (!snap.exists()) throw new Error("Pengaturan tidak ditemukan");

      const settings = snap.data();
      const templateUrl =
        type === "bib" ? settings.urlBib : settings.urlSertifikat;

      if (
        !templateUrl ||
        templateUrl === "SYSTEM_BUILTIN_BIB" ||
        templateUrl === "SYSTEM_BUILTIN_CERT"
      ) {
        const logoImg = new Image();
        logoImg.src = "/logo-dpp-ika.png";

        logoImg.onload = () => {
          if (type === "bib") {
            const baseWidth = 800;
            const baseHeight = 1130;
            const scaleFactor = 3;

            canvas.width = baseWidth * scaleFactor;
            canvas.height = baseHeight * scaleFactor;
            ctx.scale(scaleFactor, scaleFactor);

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, baseWidth, baseHeight);

            ctx.save();
            ctx.globalAlpha = 0.05;
            ctx.drawImage(logoImg, -100, 200, 1000, 1000);
            ctx.restore();

            ctx.fillStyle = "#1e3a8a";
            ctx.fillRect(0, 0, baseWidth, 200);

            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(0, 190, baseWidth, 10);

            ctx.drawImage(logoImg, 40, 45, 100, 100);

            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "left";
            ctx.font = "bold 45px Arial";
            ctx.fillText("IKA UII DIY", 160, 95);

            ctx.font = "25px Arial";
            ctx.fillText("VIRTUAL RUN & CHARITY 2026", 160, 135);

            ctx.fillStyle = "#0f172a";
            ctx.textAlign = "center";
            ctx.font = "bold 250px Arial";

            // 🔥 LOGIKA BARU: Tarik nomor cantik dari database
            const bibNum = participant.nomorBibLengkap || "0000";
            ctx.fillText(bibNum, baseWidth / 2, 550);

            ctx.fillStyle = "#1e3a8a";
            ctx.font = "bold 70px Arial";

            const namaCetakBib =
              participant.namaBib || participant.nama.split(" ")[0];
            ctx.fillText(namaCetakBib.toUpperCase(), baseWidth / 2, 750);

            ctx.fillStyle = "#fbbf24";
            ctx.beginPath();
            ctx.roundRect(baseWidth / 2 - 150, 850, 300, 100, 20);
            ctx.fill();

            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 50px Arial";
            ctx.fillText(participant.jarak, baseWidth / 2, 920);

            triggerDownload(
              canvas,
              `VR-IKA-UII-BIB-${participant.nama.replace(/\s+/g, "-")}.png`,
            );
          } else {
            const baseWidth = 1600;
            const baseHeight = 1130;
            const scaleFactor = 3;

            canvas.width = baseWidth * scaleFactor;
            canvas.height = baseHeight * scaleFactor;
            ctx.scale(scaleFactor, scaleFactor);

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, baseWidth, baseHeight);

            ctx.strokeStyle = "#1e3a8a";
            ctx.lineWidth = 20;
            ctx.strokeRect(20, 20, baseWidth - 40, baseHeight - 40);

            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 4;
            ctx.strokeRect(45, 45, baseWidth - 90, baseHeight - 90);

            ctx.save();
            ctx.globalAlpha = 0.05;
            ctx.drawImage(
              logoImg,
              baseWidth / 2 - 400,
              baseHeight / 2 - 400,
              800,
              800,
            );
            ctx.restore();

            ctx.drawImage(logoImg, baseWidth / 2 - 60, 100, 120, 120);

            ctx.textAlign = "center";
            ctx.fillStyle = "#1e3a8a";
            ctx.font = "bold 70px Arial";
            // ✅ Tarik Judul dari setting Admin
            ctx.fillText(
              settings.certTitle?.toUpperCase() || "E-CERTIFICATE",
              baseWidth / 2,
              300,
            );

            ctx.fillStyle = "#64748b";
            ctx.font = "bold 25px Arial";
            // ✅ Tarik Sub Judul dari setting Admin
            ctx.fillText(
              settings.certSubtitle?.toUpperCase() || "OF COMPLETION",
              baseWidth / 2,
              345,
            );

            ctx.font = "italic 25px Arial";
            // ✅ Tarik Kalimat Pengantar dari setting Admin
            ctx.fillText(
              settings.certOpening ||
                "This certificate is proudly presented to:",
              baseWidth / 2,
              450,
            );

            ctx.fillStyle = "#0f172a";
            ctx.font = "bold 80px Arial";
            ctx.fillText(participant.nama.toUpperCase(), baseWidth / 2, 580);

            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(baseWidth / 2 - 400, 620, 800, 4);

            ctx.fillStyle = "#334155";
            ctx.font = "28px Arial";

            // Info Jarak Kategori
            ctx.fillText(`Kategori: ${participant.jarak}`, baseWidth / 2, 680);

            // ✅ Tarik Kalimat Penutup dari setting Admin.
            // Kita pakai fungsi wrapText bawaan kita, biar kalau admin ngetiknya panjang, teksnya nggak nabrak keluar canvas!
            wrapText(
              ctx,
              settings.certFooter ||
                "Atas keberhasilannya menyelesaikan lari secara virtual.",
              baseWidth / 2,
              730,
              1200, // Batas lebar maksimal teks
              35, // Jarak spasi antar baris
            );

            ctx.fillStyle = "#1e3a8a";
            ctx.font = "bold 35px Arial";
            ctx.fillText(
              `Total Distance: ${totalApprovedKm.toFixed(2)} KM   |   Duration: ${hitungTotalDurasi()}`,
              baseWidth / 2,
              820,
            );

            const qrElement = document.getElementById(
              "qr-sertifikat-vr",
            ) as HTMLCanvasElement;

            if (qrElement) {
              const qrImg = new Image();
              qrImg.src = qrElement.toDataURL("image/png");
              qrImg.onload = () => {
                const qrSize = 140;
                ctx.drawImage(
                  qrImg,
                  baseWidth / 2 - qrSize / 2,
                  860,
                  qrSize,
                  qrSize,
                );

                ctx.font = "bold 16px Arial";
                ctx.fillStyle = "#10b981";
                ctx.fillText(
                  "© SISTEM IKA UII DIY Digital Validation",
                  baseWidth / 2,
                  1030,
                );

                ctx.font = "14px Arial";
                ctx.fillStyle = "#64748b";
                const validDate = new Date().toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
                const validId = `VR-${participant.id.toUpperCase().substring(0, 8)}`;
                ctx.fillText(
                  `Validation ID: ${validId}   •   Valid Date: ${validDate}`,
                  baseWidth / 2,
                  1060,
                );

                triggerDownload(
                  canvas,
                  `VR-IKA-UII-CERT-${participant.nama.replace(/\s+/g, "-")}.png`,
                );
              };
            } else {
              triggerDownload(
                canvas,
                `VR-IKA-UII-CERT-${participant.nama.replace(/\s+/g, "-")}.png`,
              );
            }
          }
        };

        return;
      }

      // JIKA ADMIN MENGUPLOAD TEMPLATE GAMBAR MANUAL
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = templateUrl;

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        ctx.textAlign = "center";
        ctx.fillStyle = "#1e3a8a";

        if (type === "bib") {
          ctx.font = "bold 80px Arial";
          const namaCetakBib = participant.namaBib || participant.nama;
          ctx.fillText(
            namaCetakBib.toUpperCase(),
            canvas.width / 2,
            canvas.height / 2 + 50,
          );
          ctx.font = "bold 50px Arial";
          ctx.fillText(
            `KATEGORI: ${participant.jarak}`,
            canvas.width / 2,
            canvas.height / 2 + 150,
          );
          // 🔥 TAMBAHAN UNTUK CUSTOM TEMPLATE 🔥
          const bibNum = participant.nomorBibLengkap || "0000";
          ctx.font = "bold 120px Arial";
          ctx.fillText(bibNum, canvas.width / 2, canvas.height / 2 - 80);
        } else {
          ctx.font = "bold 100px Arial";
          ctx.fillText(
            participant.nama.toUpperCase(),
            canvas.width / 2,
            canvas.height / 2,
          );
          ctx.font = "bold 40px Arial";
          ctx.fillText(
            `DISTANCE: ${totalApprovedKm.toFixed(2)} KM   |   DURATION: ${hitungTotalDurasi()}`,
            canvas.width / 2,
            canvas.height / 2 + 100,
          );
        }

        triggerDownload(
          canvas,
          `VR-IKA-UII-${type.toUpperCase()}-${participant.nama.replace(/\s+/g, "-")}.png`,
        );
      };

      img.onerror = () => {
        setPopup({
          type: "error",
          title: "Gagal Mengunduh",
          text: "Terjadi kendala saat memuat gambar template. Pastikan link gambar valid.",
        });
      };
    } catch (error) {
      console.error(error);
      setPopup({
        type: "error",
        title: "Error",
        text: "Gagal memproses dokumen.",
      });
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen font-sans pb-20 ${participant ? "bg-[#F4F7FB]" : "bg-slate-50 flex flex-col items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900"}`}
    >
      {/* 🚀 KOMPONEN QR CODE TERSEMBUNYI UNTUK DISEDOT OLEH CANVAS */}
      {participant && (
        <div className="hidden">
          <QRCodeCanvas
            id="qr-kuitansi-vr"
            value={`${baseUrl}/verif-kuitansi/${participant.id}`}
            size={300}
            level={"H"}
            includeMargin={true}
          />
          <QRCodeCanvas
            id="qr-sertifikat-vr"
            value={`${baseUrl}/virtual-run/verify/${participant.id}`}
            size={300}
            level={"H"}
            includeMargin={true}
          />
        </div>
      )}

      {/* POPUP CUSTOM */}
      {popup && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center relative animate-in zoom-in-95 duration-200">
            {popup.type === "error" && (
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ⚠️
              </div>
            )}
            {popup.type === "success" && (
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                ✓
              </div>
            )}
            {popup.type === "info" && (
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                💡
              </div>
            )}
            {popup.type === "loading" && (
              <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-5"></div>
            )}

            <h3 className="text-xl font-black text-slate-900 mb-2">
              {popup.title}
            </h3>
            <p className="text-sm text-slate-500 mb-6 px-2">{popup.text}</p>

            {popup.type !== "loading" && (
              <button
                onClick={() => setPopup(null)}
                className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-md ${popup.type === "error" ? "bg-rose-600 hover:bg-rose-700 text-white" : popup.type === "success" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
              >
                Baik, Mengerti
              </button>
            )}
          </div>
        </div>
      )}

      {/* LOGIN VIEW */}
      {!participant && (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 text-center animate-in fade-in slide-in-from-bottom-4">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
            👟
          </div>

          <h1 className="text-2xl font-black text-slate-900 mb-2">
            Dashboard Pelari
          </h1>

          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Masukkan alamat email yang Anda gunakan saat mendaftar Virtual Run
            untuk masuk.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div className="text-left">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Alamat Email Pendaftaran
              </label>

              <input
                type="email"
                required
                value={emailLogin}
                onChange={(e) => setEmailLogin(e.target.value)}
                placeholder="budi@gmail.com"
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 font-medium transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isLoggingIn ? "Memeriksa Data..." : "Masuk Dashboard"}
            </button>
          </form>

          <div className="mt-8 flex flex-col gap-3 text-xs text-slate-500 font-medium border-t border-slate-100 pt-6">
            <p>
              Belum mendaftar event ini?{" "}
              <Link
                href="/virtual-run/register"
                className="text-blue-600 font-bold hover:underline"
              >
                Daftar Sekarang
              </Link>
            </p>

            <button
              onClick={handleLupaEmail}
              className="text-slate-400 hover:text-slate-700 transition-colors underline"
            >
              Lupa email pendaftaran?
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD VIEW (MULTI-PAGE) */}
      {participant && (
        <>
          <div className="bg-[#3b5998] pt-6 pb-28 px-4 sm:px-6 text-white relative">
            <div className="max-w-6xl mx-auto">
              {/* TOP NAVIGATION & DROPDOWN */}
              <div className="flex justify-between items-center mb-8 relative z-50">
                {activeView === "dashboard" ? (
                  <div className="font-black text-xl tracking-tight hidden sm:block">
                    IKA UII DIY <span className="text-yellow-400">RUN</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveView("dashboard")}
                    className="text-blue-200 hover:text-white text-sm font-semibold flex items-center gap-2 transition-colors"
                  >
                    &larr; Kembali ke Dashboard
                  </button>
                )}

                <div className="flex items-center gap-3 ml-auto">
                  {activeView === "dashboard" && participantList.length > 1 && (
                    <select
                      value={participant.id}
                      onChange={handleSwitchEvent}
                      className="bg-[#2a437a] border border-blue-800/50 text-white text-xs font-bold py-2 px-3 rounded-xl outline-none cursor-pointer hover:bg-[#1f325c] transition-colors hidden sm:block"
                    >
                      {participantList.map((p, i) => (
                        <option key={p.id} value={p.id}>
                          Event {i + 1} - {p.jarak}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* USER MENU DROPDOWN */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2.5 bg-[#2a437a] px-2.5 py-1.5 rounded-full border border-blue-800/50 hover:bg-[#1f325c] transition-colors"
                    >
                      <div className="w-7 h-7 bg-blue-400 rounded-full flex items-center justify-center font-bold text-xs text-white overflow-hidden">
                        {participant.fotoProfilUrl ? (
                          <img
                            src={participant.fotoProfilUrl}
                            alt="Profil"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          participant.nama.charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-bold pr-1">
                        {participant.nama.split(" ")[0]}
                      </span>
                      <svg
                        className={`w-3.5 h-3.5 text-blue-200 transition-transform pr-1 ${isDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                          <button
                            onClick={() => {
                              setActiveView("dashboard");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-semibold flex items-center gap-3 transition-colors ${activeView === "dashboard" ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
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
                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            Dashboard
                          </button>

                          <button
                            onClick={() => {
                              setActiveView("riwayat");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-semibold flex items-center gap-3 transition-colors ${activeView === "riwayat" ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
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
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                            Riwayat Pendaftaran
                          </button>

                          <button
                            onClick={() => {
                              setActiveView("profil");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-semibold flex items-center gap-3 transition-colors ${activeView === "profil" ? "text-blue-600 bg-blue-50" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
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
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            Profil
                          </button>

                          <div className="border-t border-slate-100 my-1.5"></div>

                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-5 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
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
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                              />
                            </svg>
                            Keluar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* HEADER: DASHBOARD VIEW */}
              {activeView === "dashboard" && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-[#2a437a] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                          {participant.jarak}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 border ${isLunas ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isLunas ? "bg-emerald-400" : "bg-rose-400 animate-pulse"}`}
                          ></span>
                          {isLunas ? "Pembayaran Lunas" : "Menunggu Pembayaran"}
                        </span>
                      </div>

                      <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">
                        Virtual Run IKA UII
                      </h1>
                      <p className="text-blue-200 text-sm font-medium flex items-center gap-2">
                        Paket: {participant.paket.toUpperCase()}
                        {/* 🔥 MENAMPILKAN NOMOR E-BIB JIKA SUDAH PUNYA 🔥 */}
                        {participant.nomorBibLengkap && (
                          <span className="bg-blue-800 text-white px-2 py-0.5 rounded-md font-bold border border-blue-400/30 text-xs shadow-sm">
                            BIB: {participant.nomorBibLengkap}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 bg-[#2a437a]/30 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
                      <div className="relative w-24 h-24 flex items-center justify-center">
                        <svg
                          className="w-full h-full transform -rotate-90"
                          viewBox="0 0 80 80"
                        >
                          <circle
                            cx="40"
                            cy="40"
                            r={36}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="6"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r={36}
                            fill="transparent"
                            stroke={isFinisher ? "#34d399" : "#60a5fa"}
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 36}
                            strokeDashoffset={
                              2 * Math.PI * 36 -
                              (progressPercent / 100) * (2 * Math.PI * 36)
                            }
                            className="transition-all duration-1000 ease-out"
                          />
                        </svg>

                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-xl font-black leading-none">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-blue-200">
                        <p className="mb-1">
                          Target:{" "}
                          <span className="text-white">{targetKm} KM</span>
                        </p>
                        <p>
                          Status:{" "}
                          {isFinisher ? (
                            <span className="text-emerald-400">
                              Tercapai 🎉
                            </span>
                          ) : (
                            <span className="text-blue-400">Berjalan</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 md:gap-6 mt-10">
                    <div className="bg-[#2a437a]/50 border border-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-2xl text-center">
                      <p className="text-[9px] sm:text-xs font-bold text-blue-200 uppercase tracking-widest mb-1.5">
                        KM Ditempuh
                      </p>
                      <p className="text-xl sm:text-3xl font-black text-white">
                        {totalApprovedKm.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-[#2a437a]/50 border border-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-2xl text-center">
                      <p className="text-[9px] sm:text-xs font-bold text-blue-200 uppercase tracking-widest mb-1.5">
                        Durasi Total
                      </p>
                      <p className="text-xl sm:text-3xl font-black text-white">
                        {hitungTotalDurasi()}
                      </p>
                    </div>

                    <div className="bg-[#2a437a]/50 border border-white/10 backdrop-blur-sm p-4 sm:p-5 rounded-2xl text-center">
                      <p className="text-[9px] sm:text-xs font-bold text-blue-200 uppercase tracking-widest mb-1.5">
                        Aktivitas
                      </p>
                      <p className="text-xl sm:text-3xl font-black text-white">
                        {totalAktivitas}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* HEADER: RIWAYAT VIEW */}
              {activeView === "riwayat" && (
                <div className="text-center pt-8 pb-4 animate-in fade-in duration-500">
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-[11px] font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-widest">
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    Riwayat Pendaftaran
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
                    Riwayat Event
                  </h1>
                  <p className="text-blue-200 text-sm font-medium max-w-lg mx-auto">
                    Lihat semua event yang telah Anda daftarkan beserta status
                    pembayarannya.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
            {/* CONTENT: DASHBOARD VIEW */}
            {activeView === "dashboard" && (
              <div className="grid lg:grid-cols-12 gap-6 items-start animate-in fade-in slide-in-from-bottom-4">
                {/* KIRI: PROGRESS & RIWAYAT */}
                <div className="lg:col-span-8 space-y-6">
                  {/* BANNER MENUNGGU PEMBAYARAN */}
                  {!isLunas && (
                    <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col items-center sm:items-start gap-4">
                      <div className="flex items-center gap-4 w-full">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl shrink-0 shadow-sm border border-rose-100">
                          {vrSettings?.metodePembayaran === "manual"
                            ? "🏦"
                            : vrSettings?.metodePembayaran === "qris"
                              ? "📱"
                              : "⚠️"}
                        </div>
                        <div className="flex-grow text-left">
                          <h3 className="font-black text-lg text-rose-900 leading-tight">
                            Menunggu Pembayaran
                          </h3>
                          <p className="text-xs font-semibold text-rose-700 mt-0.5">
                            Segera lunasi agar dapat mengunggah bukti lari.
                          </p>
                        </div>
                        <div className="hidden sm:block text-right shrink-0">
                          <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-0.5">
                            Total Tagihan
                          </p>
                          <p className="text-xl font-black text-rose-700 bg-white px-3 py-1 rounded-xl shadow-inner border border-rose-100">
                            Rp{" "}
                            {participant.totalTagihan?.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>

                      {participant.buktiBayarUrl &&
                      (vrSettings?.metodePembayaran === "manual" ||
                        vrSettings?.metodePembayaran === "qris") ? (
                        <div className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-2 text-center animate-in fade-in">
                          <p className="text-sm font-bold text-amber-800">
                            ⏳ Bukti Transfer Sedang Diverifikasi
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            Admin sedang mengecek mutasi rekening/pembayaran
                            Anda. Mohon ditunggu.
                          </p>
                          <button
                            onClick={() =>
                              updateDoc(
                                doc(db, "vr_participants", participant.id),
                                { buktiBayarUrl: "" },
                              )
                            }
                            className="mt-3 text-xs font-semibold text-rose-600 hover:underline"
                          >
                            Unggah ulang bukti jika ada kesalahan
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* MIDTRANS */}
                          {vrSettings?.metodePembayaran === "midtrans" && (
                            <div className="w-full flex flex-col sm:flex-row gap-3 mt-2 border-t border-rose-200/50 pt-4">
                              <button
                                onClick={() => handlePayNow(false)}
                                disabled={isPaying}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
                              >
                                {isPaying
                                  ? "Memproses..."
                                  : "Lanjutkan Pembayaran"}
                              </button>
                              <button
                                onClick={() => handlePayNow(true)}
                                disabled={isPaying}
                                className="sm:w-auto bg-white border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold px-6 py-3 rounded-xl text-xs shadow-sm transition-all disabled:opacity-50"
                              >
                                Ganti Metode
                              </button>
                            </div>
                          )}

                          {/* MANUAL TRANSFER */}
                          {vrSettings?.metodePembayaran === "manual" && (
                            <div className="w-full bg-white rounded-2xl border border-rose-100 p-5 mt-2 animate-in fade-in">
                              <div className="grid sm:grid-cols-2 gap-4 mb-5 border-b border-slate-100 pb-5">
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Silakan Transfer Ke:
                                  </p>
                                  <p className="text-lg font-black text-blue-900 mt-1">
                                    {vrSettings.manualBank?.toUpperCase() ||
                                      "-"}
                                  </p>
                                  <p className="text-xl font-mono font-bold text-slate-800 mt-0.5">
                                    {vrSettings.manualRekening || "-"}
                                  </p>
                                  <p className="text-xs font-semibold text-slate-500 mt-1">
                                    a.n.{" "}
                                    {vrSettings.manualNama?.toUpperCase() ||
                                      "-"}
                                  </p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center mb-1">
                                    Nominal Transfer
                                  </p>
                                  <p className="text-2xl font-black text-rose-600 text-center">
                                    Rp{" "}
                                    {participant.totalTagihan?.toLocaleString(
                                      "id-ID",
                                    )}
                                  </p>
                                </div>
                              </div>
                              <form
                                onSubmit={handleUploadPaymentSubmit}
                                className="space-y-3"
                              >
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                  Unggah Struk / Bukti Transfer
                                </label>
                                <div className="flex items-center gap-3">
                                  <div className="flex-grow">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handlePaymentFileSelect}
                                      required
                                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl"
                                    />
                                  </div>
                                  <button
                                    type="submit"
                                    disabled={
                                      isUploadingPayment || !selectedPaymentFile
                                    }
                                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
                                  >
                                    {isUploadingPayment ? (
                                      <>
                                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>{" "}
                                        Mengunggah...
                                      </>
                                    ) : (
                                      "Kirim Bukti"
                                    )}
                                  </button>
                                </div>
                              </form>
                            </div>
                          )}

                          {/* QRIS */}
                          {vrSettings?.metodePembayaran === "qris" && (
                            <div className="w-full bg-white rounded-2xl border border-rose-100 p-5 mt-2 animate-in fade-in flex flex-col sm:flex-row gap-6">
                              <div className="w-full sm:w-1/3 flex flex-col items-center justify-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                                {vrSettings.urlQris ? (
                                  <img
                                    src={vrSettings.urlQris}
                                    alt="QRIS"
                                    className="w-full max-w-[150px] aspect-square object-contain mix-blend-multiply"
                                  />
                                ) : (
                                  <div className="w-32 h-32 bg-slate-200 flex items-center justify-center text-xs text-slate-400 text-center rounded-lg">
                                    QRIS Belum Tersedia
                                  </div>
                                )}
                                <p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">
                                  Scan via M-Banking / E-Wallet
                                </p>
                              </div>
                              <div className="w-full sm:w-2/3 flex flex-col justify-center">
                                <div className="mb-4">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Nominal Pembayaran
                                  </p>
                                  <p className="text-2xl font-black text-rose-600 mt-1">
                                    Rp{" "}
                                    {participant.totalTagihan?.toLocaleString(
                                      "id-ID",
                                    )}
                                  </p>
                                </div>
                                <form
                                  onSubmit={handleUploadPaymentSubmit}
                                  className="space-y-3"
                                >
                                  <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Unggah Struk / Bukti Bayar QRIS
                                  </label>
                                  <div className="flex flex-col gap-2">
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handlePaymentFileSelect}
                                      required
                                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-xl"
                                    />
                                    <button
                                      type="submit"
                                      disabled={
                                        isUploadingPayment ||
                                        !selectedPaymentFile
                                      }
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                      {isUploadingPayment ? (
                                        <>
                                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>{" "}
                                          Mengunggah...
                                        </>
                                      ) : (
                                        "Kirim Bukti Pembayaran"
                                      )}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {isFinisher && isLunas && (
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                      <div className="absolute -right-10 -top-10 text-9xl opacity-20 rotate-12">
                        🏅
                      </div>
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0 backdrop-blur-md border border-white/30 shadow-inner">
                          🏆
                        </div>
                        <div>
                          <h3 className="font-black text-2xl mb-1 tracking-tight">
                            Selamat, kamu Finisher!
                          </h3>
                          <p className="text-emerald-50 text-sm font-medium">
                            Target {targetKm} KM telah tercapai. Anda luar
                            biasa!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ======================================================== */}
                  {/* LEVEL / BADGE GAMIFIKASI (MENGGANTIKAN PROGRESS DETAIL)  */}
                  {/* ======================================================== */}
                  {(() => {
                    const badge = getRunnerBadge(totalApprovedKm);
                    const percentToNext = badge.nextTarget
                      ? Math.min(
                          100,
                          (totalApprovedKm / badge.nextTarget) * 100,
                        )
                      : 100;

                    return (
                      <div
                        className={`p-6 sm:p-8 rounded-3xl shadow-xl border ${badge.borderClass} ${badge.bgClass} text-white relative overflow-hidden mb-6`}
                      >
                        {/* Efek Kilauan (Shine) di Background */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                              Status Pelari
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-2">
                              <span className="text-3xl filter drop-shadow-md">
                                {badge.icon}
                              </span>
                              {badge.level}
                            </h2>
                          </div>
                          <div className="text-left sm:text-right bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10 w-full sm:w-auto">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">
                              Total Jarak Terverifikasi
                            </p>
                            <p className="text-2xl font-black">
                              {totalApprovedKm.toFixed(2)}{" "}
                              <span className="text-sm font-medium opacity-80">
                                KM
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar ke Level Berikutnya */}
                        {badge.nextTarget && (
                          <div className="mt-6 relative z-10">
                            <div className="flex justify-between text-xs font-bold mb-2">
                              <span className={badge.textClass}>
                                Lari{" "}
                                {(badge.nextTarget - totalApprovedKm).toFixed(
                                  2,
                                )}{" "}
                                KM lagi untuk naik level!
                              </span>
                              <span className="opacity-80 font-mono">
                                Target: {badge.nextTarget} KM
                              </span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-2.5 overflow-hidden backdrop-blur-sm shadow-inner">
                              <div
                                className="bg-white h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                style={{ width: `${percentToNext}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {!badge.nextTarget && (
                          <div className="mt-6 bg-white/20 px-4 py-3 rounded-xl backdrop-blur-sm text-sm font-bold text-center border border-white/20 shadow-inner relative z-10">
                            🎉 Luar Biasa! Anda telah mencapai level tertinggi
                            (Ultra Legend)!
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* DOKUMEN DIGITAL & PENGIRIMAN */}
                  {isLunas && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                      <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-600 p-1.5 rounded-lg">
                          🗂️
                        </span>{" "}
                        Dokumen & Pengiriman
                      </h3>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* KUITANSI */}
                        <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-slate-50 relative overflow-hidden group hover:border-emerald-300 transition-colors">
                          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm">
                            Valid
                          </div>
                          <div className="flex items-center gap-4 mb-5 mt-2">
                            <div className="w-12 h-12 bg-white text-emerald-600 border border-slate-200 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                              🧾
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-800 text-base truncate">
                                Kuitansi
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">
                                Bukti Bayar Sah
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument("kuitansi")}
                            className="w-full bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Unduh Kuitansi HD
                          </button>
                        </div>

                        {/* E-BIB */}
                        <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-slate-50 hover:border-blue-300 transition-colors">
                          <div className="flex items-center gap-4 mb-5 mt-2">
                            <div className="w-12 h-12 bg-white text-blue-600 border border-slate-200 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                              🏃‍♂️
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-800 text-base truncate">
                                e-BIB
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">
                                Nomor Dada
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument("bib")}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Download e-BIB
                          </button>
                        </div>

                        {/* SERTIFIKAT */}
                        <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-slate-50 hover:border-amber-300 transition-colors">
                          <div className="flex items-center gap-4 mb-5 mt-2">
                            <div className="w-12 h-12 bg-white text-amber-500 border border-slate-200 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                              🏅
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-800 text-base truncate">
                                e-Cert
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate mt-0.5">
                                Finisher Only
                              </p>
                            </div>
                          </div>
                          <button
                            disabled={!isFinisher}
                            onClick={() => handleDownloadDocument("sertifikat")}
                            className={`w-full font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm ${isFinisher ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                          >
                            {isFinisher ? "Unduh Sertifikat" : "Terkunci"}
                          </button>
                        </div>

                        {/* RESI PENGIRIMAN */}
                        {(participant.paket === "standard" ||
                          participant.paket === "full") && (
                          <div className="border border-slate-200 rounded-2xl p-5 flex flex-col justify-between bg-slate-50 sm:col-span-2 lg:col-span-3 hover:border-purple-300 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-white text-purple-600 border border-slate-200 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                                📦
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-black text-slate-800 text-base truncate">
                                  Informasi Pengiriman Race Pack
                                </p>
                                <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                                  {participant.alamat}
                                </p>
                              </div>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                  Nomor Resi / Ekspedisi
                                </p>
                                <p className="text-sm font-mono font-black text-slate-800 uppercase">
                                  {participant.resiPengiriman ||
                                    "Sedang Diproses Panitia"}
                                </p>
                              </div>
                              {participant.resiPengiriman && (
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      participant.resiPengiriman,
                                    );
                                    setPopup({
                                      type: "success",
                                      title: "Disalin!",
                                      text: "Nomor resi disalin ke clipboard.",
                                    });
                                  }}
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2 px-4 rounded-lg text-xs transition-colors border border-purple-200 shrink-0"
                                >
                                  Salin Resi
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AKTIVITAS LARI */}
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                        👟
                      </span>{" "}
                      Aktivitas Lari
                      <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-0.5 rounded-full ml-2 border border-slate-200">
                        {submissions.length}
                      </span>
                    </h3>

                    {submissions.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50">
                        <div className="text-4xl mb-3 opacity-50 grayscale">
                          🏃‍♀️
                        </div>
                        <p className="text-sm">
                          Belum ada bukti lari yang diunggah.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((sub, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-4 flex-grow">
                              <img
                                src={sub.imgUrl}
                                alt="Bukti"
                                className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100 shadow-inner"
                              />
                              <div className="flex-grow min-w-0">
                                <h4 className="font-black text-slate-800 text-base mb-1 truncate">
                                  Lari {sub.jarakKm} KM
                                </h4>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 truncate">
                                  {new Date(sub.tanggalLari).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )}{" "}
                                  • Durasi: {sub.durasi}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 sm:text-right border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-3 sm:mt-0">
                              {sub.status === "Approved" && (
                                <span className="inline-block text-emerald-600 bg-emerald-50 text-[10px] font-black px-3 py-1.5 rounded-lg border border-emerald-200 uppercase tracking-widest shadow-sm">
                                  ✅ Disetujui
                                </span>
                              )}
                              {sub.status === "Pending" && (
                                <span className="inline-block text-amber-600 bg-amber-50 text-[10px] font-black px-3 py-1.5 rounded-lg border border-amber-200 uppercase tracking-widest shadow-sm">
                                  ⏳ Diperiksa
                                </span>
                              )}
                              {sub.status === "Rejected" && (
                                <span className="inline-block text-rose-600 bg-rose-50 text-[10px] font-black px-3 py-1.5 rounded-lg border border-rose-200 uppercase tracking-widest shadow-sm">
                                  ❌ Ditolak
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* KANAN: WIDGET UPLOAD BUKTI LARI */}
                <div className="lg:col-span-4 lg:sticky lg:top-6">
                  <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-400 via-yellow-400 to-amber-500"></div>
                    <div className="p-6 sm:p-8">
                      <h3 className="font-black text-slate-800 text-lg mb-2 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-600 p-1.5 rounded-lg">
                          🔥
                        </span>{" "}
                        Upload Bukti Lari
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mb-6">
                        Screenshot riwayat lari dari aplikasi Strava, Garmin,
                        NRC, dll.
                      </p>

                      {!isLunas ? (
                        <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl">
                          <div className="text-4xl mb-3 grayscale opacity-50">
                            🔒
                          </div>
                          <p className="text-sm font-bold text-slate-600 px-4">
                            Fitur terkunci. Silakan selesaikan pembayaran
                            terlebih dahulu.
                          </p>
                        </div>
                      ) : isFinisher ? (
                        <div className="text-center py-10 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-inner">
                          <div className="text-5xl mb-3">🏁</div>
                          <p className="text-base font-black text-emerald-800">
                            Target Tercapai!
                          </p>
                          <p className="text-xs font-medium text-emerald-600 mt-2 px-4">
                            Kamu sudah menyelesaikan tantangan. Tidak perlu
                            unggah bukti lagi.
                          </p>
                        </div>
                      ) : (
                        <form
                          onSubmit={handleUploadSubmit}
                          className="space-y-5"
                        >
                          <div
                            className={`border-2 border-dashed rounded-2xl p-2 text-center transition-all relative overflow-hidden group cursor-pointer ${previewUrl ? "border-blue-400 bg-blue-50/50" : "border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300"}`}
                          >
                            {previewUrl ? (
                              <div className="relative">
                                <img
                                  src={previewUrl}
                                  alt="Preview"
                                  className="w-full h-48 object-cover rounded-xl shadow-sm"
                                />
                                <div className="absolute inset-0 bg-blue-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl backdrop-blur-sm">
                                  <span className="text-white text-xs font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-xl border border-white/30">
                                    Ganti Gambar
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="py-10 px-4">
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-slate-200 mx-auto mb-4">
                                  <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                    />
                                  </svg>
                                </div>
                                <span className="text-sm font-black text-slate-700 block mb-1">
                                  Pilih gambar screenshot
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                  PNG, JPG (Maks 5MB)
                                </span>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileSelect}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                  Jarak (KM)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  required
                                  value={uploadData.km}
                                  onChange={(e) =>
                                    setUploadData({
                                      ...uploadData,
                                      km: e.target.value,
                                    })
                                  }
                                  placeholder="5.2"
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-black text-slate-800 transition-all"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                  Durasi Waktu
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={uploadData.durasi}
                                  onChange={(e) =>
                                    setUploadData({
                                      ...uploadData,
                                      durasi: e.target.value,
                                    })
                                  }
                                  placeholder="MM:SS"
                                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-black text-slate-800 transition-all"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                Tanggal Berlari
                              </label>
                              <input
                                type="date"
                                required
                                value={uploadData.tanggalLari}
                                onChange={(e) =>
                                  setUploadData({
                                    ...uploadData,
                                    tanggalLari: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-black text-slate-800 transition-all cursor-pointer"
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            disabled={isUploading}
                            className="w-full bg-[#3b5998] hover:bg-[#2a437a] text-white font-black py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isUploading ? (
                              <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{" "}
                                Mengunggah...
                              </span>
                            ) : (
                              "Kirim Bukti Lari"
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT: PROFIL VIEW (EDIT PROFIL) */}
            {activeView === "profil" && (
              <div className="grid lg:grid-cols-12 gap-6 items-start animate-in fade-in slide-in-from-bottom-4">
                <div className="lg:col-span-8 space-y-6">
                  {/* EDIT PROFIL CARD */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sm:p-8">
                    <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-5">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
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
                        <h2 className="text-xl font-black text-slate-800">
                          Pengaturan Profil Publik
                        </h2>
                        <p className="text-xs font-medium text-slate-500">
                          Update foto dan motto agar profilmu lebih menarik
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Read-Only Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                            Nama (Sesuai E-BIB)
                          </label>
                          <input
                            type="text"
                            disabled
                            value={participant?.nama || ""}
                            className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                            Email Registrasi
                          </label>
                          <input
                            type="email"
                            disabled
                            value={participant?.email || ""}
                            className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Input Motto */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1.5 ml-1">
                          Motto Lari / Bio Singkat
                        </label>
                        <input
                          type="text"
                          placeholder="Cth: Lari pelan-pelan asal sampai garis finish!"
                          value={motto}
                          onChange={(e) => setMotto(e.target.value)}
                          className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                      </div>

                      {/* Upload Foto Profil & Header */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Foto Profil */}
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center hover:bg-slate-50 transition-colors relative overflow-hidden group">
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-4">
                            Foto Profil Publik
                          </label>

                          {participant?.fotoProfilUrl && !profilFile ? (
                            <img
                              src={participant.fotoProfilUrl}
                              alt="Profil"
                              className="w-24 h-24 mx-auto rounded-full object-cover mb-4 shadow-md border-4 border-white"
                            />
                          ) : profilFile ? (
                            <img
                              src={URL.createObjectURL(profilFile)}
                              alt="Preview Profil"
                              className="w-24 h-24 mx-auto rounded-full object-cover mb-4 shadow-md border-4 border-white"
                            />
                          ) : (
                            <div className="w-24 h-24 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-3xl font-black text-blue-600 mb-4 shadow-inner border-4 border-white">
                              {participant?.nama?.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="relative inline-block w-full">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) =>
                                setProfilFile(
                                  e.target.files ? e.target.files[0] : null,
                                )
                              }
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2 px-4 rounded-xl shadow-sm group-hover:border-blue-300 group-hover:text-blue-600 transition-colors">
                              {profilFile ? "Ganti File" : "Pilih Foto Profil"}
                            </div>
                          </div>
                          <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest">
                            Disarankan: Persegi (1:1)
                          </p>
                        </div>

                        {/* Foto Header */}
                        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center hover:bg-slate-50 transition-colors relative overflow-hidden group flex flex-col justify-between">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-4">
                              Foto Sampul (Header)
                            </label>

                            {headerFile ? (
                              <img
                                src={URL.createObjectURL(headerFile)}
                                alt="Preview Header"
                                className="w-full h-24 mx-auto rounded-xl object-cover mb-4 shadow-sm border-2 border-white"
                              />
                            ) : participant?.fotoHeaderUrl ? (
                              <img
                                src={participant.fotoHeaderUrl}
                                alt="Header"
                                className="w-full h-24 mx-auto rounded-xl object-cover mb-4 shadow-sm border-2 border-white"
                              />
                            ) : (
                              <div className="w-full h-24 bg-slate-100 rounded-xl mb-4 border border-slate-200 flex items-center justify-center shadow-inner">
                                <span className="text-3xl opacity-20">🏞️</span>
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="relative inline-block w-full">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setHeaderFile(
                                    e.target.files ? e.target.files[0] : null,
                                  )
                                }
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className="bg-white border border-slate-200 text-slate-600 text-xs font-bold py-2 px-4 rounded-xl shadow-sm group-hover:border-blue-300 group-hover:text-blue-600 transition-colors">
                                {headerFile
                                  ? "Ganti File"
                                  : "Pilih Foto Sampul"}
                              </div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-3 uppercase tracking-widest">
                              Disarankan: Lanskap (16:9)
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Simpan */}
                      <div className="pt-6 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={handleUpdateProfil}
                          disabled={isUpdatingProfil}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-8 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto justify-center"
                        >
                          {isUpdatingProfil ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Menyimpan...
                            </>
                          ) : (
                            "Simpan Perubahan"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                  {/* BAGIKAN PROFIL CARD */}
                  <div className="bg-gradient-to-br from-[#3b5998] to-[#2a437a] rounded-3xl p-6 sm:p-8 shadow-lg text-white relative overflow-hidden border border-blue-800">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-5">
                        <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30">
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
                              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-black text-white text-base">
                            Bagikan Profil
                          </h3>
                          <p className="text-xs font-medium text-blue-200">
                            Tunjukkan progress lari kamu
                          </p>
                        </div>
                      </div>

                      <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 mb-5 text-xs font-bold text-white truncate font-mono shadow-inner overflow-hidden backdrop-blur-sm">
                        {baseUrl}/u/{participant.slug || participant.id}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${baseUrl}/u/${participant.slug || participant.id}`,
                            );
                            setPopup({
                              type: "success",
                              title: "Disalin!",
                              text: "Link profil berhasil disalin ke clipboard.",
                            });
                          }}
                          className="bg-white text-blue-900 font-black py-3 rounded-xl text-xs transition-transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-lg"
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
                              strokeWidth={2.5}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                          Salin
                        </button>
                        <button
                          onClick={() =>
                            window.open(
                              `https://wa.me/?text=Halo! Lihat progress lari saya di Virtual Run IKA UII DIY: ${baseUrl}/u/${participant.slug || participant.id}`,
                              "_blank",
                            )
                          }
                          className="bg-[#25D366] hover:bg-[#1ebd5a] text-white font-black py-3 rounded-xl text-xs transition-transform hover:-translate-y-1 shadow-lg flex items-center justify-center gap-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                          </svg>
                          Share WA
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* PENGATURAN AKUN (TERKUNCI) */}
                  <div className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
                    <div className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center shadow-sm border border-slate-200 mx-auto mb-4">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-black text-slate-700 text-lg mb-1">
                      Pengaturan Akun UII
                    </h3>
                    <p className="text-xs font-medium text-slate-500 mb-6">
                      Password, email, dan keamanan
                    </p>

                    <div className="w-full bg-white text-slate-500 font-bold py-3.5 px-5 rounded-xl text-xs border border-slate-200 flex items-center justify-center gap-2 cursor-not-allowed">
                      🔒 Harap hubungi administrator untuk merubahnya
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT: RIWAYAT PENDAFTARAN VIEW */}
            {activeView === "riwayat" && (
              <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                  <div className="relative w-full sm:w-96">
                    <svg
                      className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Cari riwayat pendaftaran..."
                      className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  {participantList.map((ev) => {
                    const isThisFinisher =
                      ev.id === participant.id ? isFinisher : false;
                    return (
                      <div
                        key={ev.id}
                        className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5 border-b border-slate-100 pb-5">
                          <div className="flex items-center gap-4 sm:gap-5">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 border border-blue-100 shadow-inner">
                              🏃‍♂️
                            </div>
                            <div>
                              <h3 className="font-black text-base sm:text-lg text-slate-900 mb-1">
                                Virtual Run IKA UII
                              </h3>
                              <p className="text-xs font-bold text-slate-500">
                                {ev.jarak} • Paket {ev.paket.toUpperCase()}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                {new Date(ev.waktuDaftar).toLocaleDateString(
                                  "id-ID",
                                  {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 w-full sm:w-auto text-left sm:text-right">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border ${ev.statusPembayaran === "Lunas" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}
                            >
                              {ev.statusPembayaran === "Lunas"
                                ? "✅ Lunas"
                                : "⚠️ Pending"}
                            </span>
                            {isThisFinisher && (
                              <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 sm:justify-end mt-2 uppercase tracking-widest">
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>{" "}
                                Finisher
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                          <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                Total Pembayaran
                              </p>
                              <p className="text-lg font-black text-slate-800">
                                Rp {ev.totalTagihan?.toLocaleString("id-ID")}
                              </p>
                            </div>
                            {(ev.paket === "standard" ||
                              ev.paket === "full") && (
                              <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-8">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                                  Resi Pengiriman
                                </p>
                                {ev.resiPengiriman ? (
                                  <p className="text-sm font-mono font-black text-blue-700">
                                    {ev.resiPengiriman}
                                  </p>
                                ) : (
                                  <p className="text-xs font-bold text-slate-500">
                                    Belum dikirim
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => pindahKeDashboardEvent(ev.id)}
                            className="w-full sm:w-auto text-blue-600 hover:text-white font-bold text-sm flex items-center justify-center gap-2 px-5 py-3 border border-blue-200 hover:border-blue-600 hover:bg-blue-600 rounded-xl transition-all shadow-sm"
                          >
                            Masuk Dashboard{" "}
                            <span className="font-normal">&rarr;</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
