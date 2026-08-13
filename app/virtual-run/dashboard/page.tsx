"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signInWithCustomToken, onAuthStateChanged, signOut } from "firebase/auth";
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
import { Activity, Mail, KeyRound, ArrowRight, ShieldCheck, User, MapPin, Calendar, CreditCard, UploadCloud, ChevronDown, Trophy, Medal, CheckCircle2, Clock, History, Edit3, Camera, FileText, Info, LogOut, Check, X, Eye, Search, Image as ImageIcon, Share2, Copy, Shield } from "lucide-react";
import { sendEmailAction } from "@/app/actions/email";


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

  // --- STATE LOGIN & OTP ---
  const [loginStep, setLoginStep] = useState<"email" | "otp">("email");
  const [otpInput, setOtpInput] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

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

    // B. Cek Session Resmi Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setEmailLogin(user.email);
        fetchParticipantData(user.email).finally(() => {
          setIsCheckingSession(false);
        });
      } else {
        localStorage.removeItem("vr_user_email");
        setIsCheckingSession(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set default motto kalau data participant sudah di-load
  useEffect(() => {
    if (participant && participant.motto) {
      setMotto(participant.motto);
    }
  }, [participant]);

  // --- 1. LOGIKA LOGIN UTAMA ---
  const performLogin = async (emailToCheck: string, isAutoLogin = false) => {
    if (isAutoLogin) {
      await fetchParticipantData(emailToCheck);
      setIsCheckingSession(false);
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/vr-auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToCheck }),
      });
      
      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response from server (request-otp):", text);
        throw new Error(`Server error (${res.status})`);
      }
      
      if (!res.ok) {
        setPopup({ type: "error", title: "Email Tidak Ditemukan", text: data.error || "Pastikan email yang Anda masukkan terdaftar." });
        localStorage.removeItem("vr_user_email");
      } else {
        setLoginStep("otp");
      }
    } catch (error) {
      console.error("Login error:", error);
      setPopup({ type: "error", title: "Koneksi Bermasalah", text: "Gagal terhubung ke server." });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- 1.B LOGIKA LOGIN GOOGLE ---
  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const emailToCheck = result.user.email;
      
      if (!emailToCheck) {
        throw new Error("Tidak dapat membaca email dari Google");
      }

      const q = query(
        collection(db, "vr_participants"),
        where("email", "==", emailToCheck.trim().toLowerCase()),
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        setPopup({ type: "error", title: "Belum Terdaftar", text: "Email Google Anda belum terdaftar sebagai peserta Virtual Run." });
        auth.signOut();
      } else {
        await fetchParticipantData(emailToCheck);
      }
    } catch (error: any) {
      console.error("Google Login Error:", error);
      if (error.code !== "auth/popup-closed-by-user") {
        setPopup({ type: "error", title: "Login Gagal", text: "Terjadi kesalahan saat masuk dengan Google." });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const verifyOtpAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/vr-auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailLogin, code: otpInput }),
      });
      
      let data: any = {};
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        console.error("Non-JSON response from server (verify-otp):", text);
        throw new Error(`Server error (${res.status})`);
      }

      if (!res.ok) {
        setPopup({ type: "error", title: "Kode Salah", text: data.error || "Kode OTP tidak valid." });
      } else if (data.token) {
        // Sign in with Firebase Custom Token
        await signInWithCustomToken(auth, data.token);
        await fetchParticipantData(emailLogin);
      }
    } catch (error) {
      setPopup({ type: "error", title: "Error", text: "Gagal memverifikasi OTP." });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const fetchParticipantData = async (emailToCheck: string) => {
    try {
      const q = query(
        collection(db, "vr_participants"),
        where("email", "==", emailToCheck.trim().toLowerCase()),
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const records = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        records.sort(
          (a: any, b: any) =>
            new Date(b.waktuDaftar).getTime() -
            new Date(a.waktuDaftar).getTime(),
        );

        setParticipantList(records);

        // Listener realtime agar status lunas langsung update
        onSnapshot(doc(db, "vr_participants", records[0].id), (docSnap) => {
          if (docSnap.exists()) {
            setParticipant({ id: docSnap.id, ...docSnap.data() });
          }
        });

        setActiveView("dashboard");
      } else {
        // Email not found in participants, sign out
        signOut(auth);
        setLoginStep("email");
      }
    } catch (error) {
      console.error("Fetch data error:", error);
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
    setOtpInput("");
    setLoginStep("email");
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

      const response = await fetch("/api/vr-submit-run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: participant.email,
          participantId: participant.id,
          nama: participant.nama,
          km: uploadData.km,
          durasi: uploadData.durasi,
          tanggalLari: uploadData.tanggalLari,
          imgUrl: cloudinaryData.secure_url,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gagal menyimpan ke server");
      }

      // Trigger Email ke Admin
      sendEmailAction({
          type: "admin_notif_run",
          email: "236102601@uii.ac.id", // Ganti dengan email asli admin
          nama: participant.nama,
          detail: { jarakKm: uploadData.km },
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
      console.error("DEBUG UPLOAD LARI:", error);
      setPopup({
        type: "error",
        title: "Gagal Mengunggah",
        text: "Pastikan format foto benar dan internet stabil. " + (error instanceof Error ? error.message : ""),
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
            // 🔒 Verifikasi SERVER-SIDE ke Midtrans (bukan self-update client).
            // Route ini hanya mengeset Lunas jika Midtrans benar-benar
            // melaporkan settlement/capture — cegah manipulasi status bayar.
            const verifyRes = await fetch("/api/vr-verify-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: midtransOrderId }),
            });
            const verifyData = await verifyRes.json();

            // Trigger Email ke Admin
            sendEmailAction({
                type: "admin_notif_payment",
                email: "236102601@uii.ac.id", // Email Admin
                nama: participant.nama,
                detail: {},
              }).catch((e) => console.log(e));

            if (verifyRes.ok && verifyData?.success) {
              setPopup({
                type: "success",
                title: "Pembayaran Berhasil!",
                text: "Luar biasa! Sistem telah memverifikasi pembayaran Anda secara otomatis. Selamat berlari!",
              });
            } else {
              setPopup({
                type: "info",
                title: "Pembayaran Diterima",
                text: "Pembayaran sedang diverifikasi sistem. Status akan otomatis ter-update beberapa saat lagi.",
              });
            }
          } catch (err) {
            setPopup({
              type: "info",
              title: "Pembayaran Berhasil",
              text: "Pembayaran diterima. Status sedang diverifikasi, silakan refresh beberapa saat lagi.",
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

      const response = await fetch("/api/vr-upload-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: participant.email,
          participantId: participant.id,
          imgUrl: cloudinaryData.secure_url,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gagal menyimpan ke server");
      }

      setPopup({
        type: "success",
        title: "Struk Terkirim!",
        text: "Bukti pembayaran berhasil diunggah. Admin akan segera memverifikasi transaksi Anda.",
      });

      setSelectedPaymentFile(null);
      setPreviewPaymentUrl(null);
    } catch (error) {
      console.error("DEBUG UPLOAD PEMBAYARAN:", error);
      setPopup({
        type: "error",
        title: "Gagal Mengunggah",
        text: "Pastikan format foto benar dan internet stabil. " + (error instanceof Error ? error.message : ""),
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

      const response = await fetch("/api/vr-update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: participant.email,
          participantId: participant.id,
          motto: motto,
          fotoProfilUrl: profilUrl,
          fotoHeaderUrl: headerUrl,
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Gagal memperbarui profil");
      }

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
  const currentTime = new Date();
  const isSubmissionStarted = vrSettings?.periodeLariStart ? currentTime >= new Date(vrSettings.periodeLariStart) : true;
  const isSubmissionEnded = vrSettings?.periodeLariEnd ? currentTime > new Date(vrSettings.periodeLariEnd) : false;
  const isSubmissionOpen = isSubmissionStarted && !isSubmissionEnded;
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
      icon: "🎯",
      bgClass: "bg-gradient-to-br from-[#1A73E8] to-blue-900",
      textClass: "text-blue-100",
      borderClass: "border-blue-500/30",
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

  const triggerDownload = async (
    canvas: HTMLCanvasElement,
    filename: string,
  ) => {
    const isMobile =
      typeof window !== "undefined" &&
      (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        window.innerWidth < 768);

    const anchorDownload = (href: string) => {
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };

    try {
      // 📱 MOBILE: pakai Web Share API dulu biar muncul opsi "Simpan Gambar"
      if (
        isMobile &&
        typeof navigator.share === "function" &&
        typeof canvas.toBlob === "function"
      ) {
        const blob: Blob | null = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );

        if (blob) {
          const file = new File([blob], filename, { type: "image/png" });

          if (navigator.canShare?.({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: filename });
              setPopup(null);
              return;
            } catch (err: any) {
              // User batal / tidak mendukung file share → fallback ke bawah
              if (err?.name !== "AbortError") {
                console.error("Web Share gagal:", err);
              }
            }
          }

          // Blob URL: iOS 13+ hormati atribut download (data: URL tidak)
          const url = URL.createObjectURL(blob);
          anchorDownload(url);
          setTimeout(() => URL.revokeObjectURL(url), 15000);
          setPopup(null);
          return;
        }
      }

      // 💻 DESKTOP / FALLBACK UMUM
      anchorDownload(canvas.toDataURL("image/png"));
      setPopup(null);
    } catch (error) {
      console.error("Download gagal:", error);
      setPopup({
        type: "error",
        title: "Gagal Mengunduh",
        text: "Terjadi kendala saat membuat file. Coba buka via PC atau gunakan browser lain.",
      });
    }
  };

  // --- 6. LOGIKA DOWNLOAD DOKUMEN DIGITAL (HIGH-RES CANVAS) ---
  const handleDownloadDocument = async (
    type: "bib" | "sertifikat" | "kuitansi",
  ) => {
    if (!participant) return;

    // 📱 Deteksi HP: iOS Safari batasi canvas (maks 4096px & memori kecil),
    // jadi scale diperkecil biar tidak error & tidak lemot.
    const isMobile =
      typeof window !== "undefined" &&
      (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        window.innerWidth < 768);

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

      // Fallback roundRect untuk browser lama (Safari < 16, Chrome < 99, Firefox < 112)
      if (!ctx.roundRect) {
        (ctx as any).roundRect = function (
          x: number,
          y: number,
          w: number,
          h: number,
          r: number,
        ) {
          const radius = Math.min(r, w / 2, h / 2);
          this.beginPath();
          this.moveTo(x + radius, y);
          this.lineTo(x + w - radius, y);
          this.quadraticCurveTo(x + w, y, x + w, y + radius);
          this.lineTo(x + w, y + h - radius);
          this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
          this.lineTo(x + radius, y + h);
          this.quadraticCurveTo(x, y + h, x, y + h - radius);
          this.lineTo(x, y + radius);
          this.quadraticCurveTo(x, y, x + radius, y);
          this.closePath();
        };
      }

      // Helper error agar popup tidak stuck "Memproses..." selamanya
      const failDownload = (msg: string) => {
        setPopup({
          type: "error",
          title: "Gagal Mengunduh",
          text: msg,
        });
      };

      // ============================================
      // LOGIKA GENERATE KUITANSI HD
      // ============================================
      if (type === "kuitansi") {
        const baseWidth = 1260;
        const baseHeight = 480;
        const scaleFactor = isMobile ? 1.5 : 2;

        canvas.width = baseWidth * scaleFactor;
        canvas.height = baseHeight * scaleFactor;
        ctx.scale(scaleFactor, scaleFactor);

        const logoImg = new Image();
        logoImg.src = "/logo-dpp-ika.png";
        logoImg.onerror = () =>
          failDownload(
            "Logo gagal dimuat. Muat ulang halaman lalu coba lagi.",
          );

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
        logoImg.onerror = () =>
          failDownload(
            "Logo gagal dimuat. Muat ulang halaman lalu coba lagi.",
          );

        logoImg.onload = () => {
          if (type === "bib") {
            const baseWidth = 800;
            const baseHeight = 1130;
            const scaleFactor = isMobile ? 2 : 3;

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
            const scaleFactor = isMobile ? 1.5 : 3;

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
              let qrDataUrl = "";
              try {
                qrDataUrl = qrElement.toDataURL("image/png");
              } catch (e) {
                console.error("Gagal render QR:", e);
              }

              if (!qrDataUrl) {
                triggerDownload(
                  canvas,
                  `VR-IKA-UII-CERT-${participant.nama.replace(/\s+/g, "-")}.png`,
                );
              } else {
                const qrImg = new Image();
                qrImg.src = qrDataUrl;
                qrImg.onload = () => {
                  try {
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
                  } catch (e) {
                    console.error("Gagal gambar QR ke sertifikat:", e);
                    triggerDownload(
                      canvas,
                      `VR-IKA-UII-CERT-${participant.nama.replace(/\s+/g, "-")}.png`,
                    );
                  }
                };
              }
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
        try {
          // Clamp ukuran canvas di HP agar tidak overload (iOS limit 4096px)
          const maxDim = isMobile ? 2400 : 16384;
          const scale = Math.min(
            1,
            maxDim / Math.max(img.width, img.height),
          );
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          if (scale < 1) ctx.scale(scale, scale);
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
        } catch (e) {
          console.error("Gagal render template custom:", e);
          failDownload(
            "Terjadi kendala saat menggambar template. Coba lagi atau hubungi panitia.",
          );
        }
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
      className={`min-h-screen font-sans ${participant ? "pb-20 bg-[#F4F7FB]" : "w-full flex flex-col lg:flex-row bg-white"}`}
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

      {/* LOGIN VIEW (SPLIT SCREEN) */}
      {!participant && (
        <>
          {/* --- SISI KIRI: BRANDING (FULL HEIGHT, MENTOK UJUNG) --- */}
          <div className="hidden lg:flex w-full lg:w-5/12 bg-gradient-to-br from-[#0B1528] to-[#1A73E8] p-12 lg:p-20 flex-col justify-between relative overflow-hidden shrink-0 min-h-screen">
            {/* Ornamen Latar Belakang */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 opacity-20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
    
            <div className="relative z-10 flex flex-col justify-center h-full">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[1.2rem] p-3 mb-10 shadow-xl border border-white/20 transform -rotate-3">
                <img
                  src="/logo-dpp-ika.png"
                  alt="Logo IKA UII"
                  className="w-full h-full object-contain"
                />
              </div>
    
              <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                Virtual Run <br />
                <span className="text-yellow-400">IKA UII DIY</span>
              </h1>
    
              <div className="w-12 h-1.5 bg-yellow-500 rounded-full mb-8"></div>
    
              <p className="text-blue-100/90 font-medium text-base leading-relaxed max-w-sm">
                Sistem Informasi Manajemen Terpadu untuk kolaborasi dan sinergi
                alumni di wilayah Daerah Istimewa Yogyakarta.
              </p>
            </div>
    
            <div className="relative z-10">
              <p className="text-blue-300/50 text-[10px] font-mono tracking-widest uppercase">
                &copy; {new Date().getFullYear()} SIM DPW IKA UII DIY • Integrity •
                Syiar • Professional
              </p>
            </div>
          </div>
    
          {/* --- SISI KANAN: FORM LOGIN & OTP (FULL HEIGHT, MENTOK UJUNG) --- */}
          <div className="w-full lg:w-7/12 min-h-screen p-8 sm:p-16 lg:p-24 flex flex-col justify-center bg-white relative z-20 overflow-y-auto">
            <div className="max-w-[420px] w-full mx-auto">
              {/* Header untuk Mobile (Karena kolom biru disembunyikan di HP) */}
              <div className="lg:hidden flex flex-col items-center text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl shadow-sm border border-blue-100 flex items-center justify-center mb-4 p-2 transform -rotate-3">
                  <img
                    src="/logo-dpp-ika.png"
                    alt="Logo IKA UII"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-3xl font-black text-blue-950 tracking-tight leading-none mb-1.5">
                  Virtual Run
                </h1>
                <p className="text-xs font-bold text-yellow-600 tracking-[0.2em] uppercase">
                  IKA UII DIY
                </p>
              </div>
    
              <div className="mb-10 lg:mb-12 text-center lg:text-left transition-all duration-300">
                <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-2.5">
                  {loginStep === "email" ? "Masuk Dashboard" : "Verifikasi OTP"}
                </h2>
                <p className="text-slate-500 text-sm lg:text-base font-medium">
                  {loginStep === "email" 
                    ? "Silakan login menggunakan email pendaftaran lari Anda." 
                    : "Masukkan kode OTP yang telah dikirimkan ke email Anda."}
                </p>
              </div>
    
              {loginStep === "email" ? (
                <form onSubmit={handleLoginSubmit} className="space-y-5 lg:space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">
                      Alamat Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        required
                        value={emailLogin}
                        onChange={(e) => setEmailLogin(e.target.value)}
                        placeholder="email@contoh.com"
                        className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/10 outline-none transition-all text-sm font-medium text-slate-800 shadow-sm"
                      />
                    </div>
                  </div>
    
                  <div className="pt-2 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={isLoggingIn}
                      className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow disabled:opacity-70 disabled:pointer-events-none"
                    >
                      {isLoggingIn ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      ) : (
                        <>
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          Masuk dengan Google
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-4 my-2">
                      <div className="flex-1 h-px bg-slate-200"></div>
                      <span className="text-xs font-medium text-slate-400 uppercase">ATAU</span>
                      <div className="flex-1 h-px bg-slate-200"></div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white font-black py-4 lg:py-4.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
                    >
                      {isLoggingIn ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      ) : (
                        <>
                          Kirim OTP <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={verifyOtpAndLogin} className="space-y-5 lg:space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 pl-1">
                      Kode Keamanan (OTP)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="123456"
                        className="w-full pl-11 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#1A73E8] focus:bg-white focus:ring-4 focus:ring-[#1A73E8]/10 outline-none text-slate-800 font-black tracking-[0.3em] text-center text-xl transition-all shadow-sm"
                      />
                    </div>
                  </div>
    
                  <button
                    type="submit"
                    disabled={isVerifyingOtp}
                    className="w-full bg-[#1A73E8] hover:bg-blue-700 text-white font-black py-4 lg:py-4.5 rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-600/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex items-center justify-center gap-3 text-sm uppercase tracking-widest mt-6"
                  >
                    {isVerifyingOtp ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    ) : (
                      <>
                        Masuk ke Dashboard <ShieldCheck className="w-5 h-5" />
                      </>
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep("email");
                      setOtpInput("");
                    }}
                    className="w-full text-center text-xs font-bold text-slate-500 hover:text-[#1A73E8] transition-colors mt-3 py-2"
                  >
                    Kembali dan Ganti Email
                  </button>
                </form>
              )}
    
              <div className="mt-10 lg:mt-12 text-center lg:text-left flex justify-center lg:justify-start">
                <Link
                  href="/virtual-run"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-[#1A73E8] transition-colors py-2.5 px-4 rounded-xl hover:bg-blue-50"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Kembali ke Beranda Virtual Run
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* DASHBOARD VIEW (MULTI-PAGE) */}
      {participant && (
        <>
          {/* HEADER SECTION (PREMIUM GRADIENT) */}
          <div className="bg-gradient-to-br from-[#0B1528] to-[#1A73E8] pt-8 pb-32 px-4 sm:px-6 text-white relative overflow-hidden">
            {/* Header Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
              <div className="absolute -top-[50%] -left-[10%] w-[50%] h-[150%] bg-white opacity-5 rounded-full blur-[100px] mix-blend-screen" />
              <div className="absolute top-[20%] -right-[10%] w-[40%] h-[100%] bg-blue-400/20 rounded-full blur-[100px] mix-blend-screen" />
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
              {/* TOP NAVIGATION & DROPDOWN */}
              <div className="flex justify-between items-center mb-10 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-lg relative z-50">
                {activeView === "dashboard" ? (
                  <div className="font-black text-xl tracking-tight flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-300" />
                    IKA UII DIY <span className="text-yellow-400">RUN</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveView("dashboard")}
                    className="text-blue-100 hover:text-white text-sm font-bold flex items-center gap-2 transition-all hover:-translate-x-1"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" /> Kembali ke Dashboard
                  </button>
                )}

                <div className="flex items-center gap-4 ml-auto">
                  {activeView === "dashboard" && participantList.length > 1 && (
                    <div className="relative hidden sm:block">
                      <select
                        value={participant.id}
                        onChange={handleSwitchEvent}
                        className="appearance-none bg-white/10 border border-white/20 text-white text-xs font-bold py-2.5 pl-4 pr-10 rounded-xl outline-none cursor-pointer hover:bg-white/20 transition-colors backdrop-blur-sm shadow-inner"
                      >
                        {participantList.map((p, i) => (
                          <option key={p.id} value={p.id} className="text-slate-800">
                            Event {i + 1} - {p.jarak}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/70" />
                    </div>
                  )}

                  {/* USER MENU DROPDOWN */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-3 bg-white/10 pl-2 pr-3 py-1.5 rounded-full border border-white/20 hover:bg-white/20 transition-all shadow-sm backdrop-blur-sm"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center font-bold text-sm text-white overflow-hidden border border-white/30 shadow-inner">
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
                      <span className="text-xs font-bold hidden sm:block">
                        {participant.nama.split(" ")[0]}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isDropdownOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsDropdownOpen(false)}
                        ></div>
                        <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                          
                          <div className="px-5 py-3 border-b border-slate-100/80 mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Signed in as</p>
                            <p className="text-sm font-black text-slate-800 truncate">{participant.email}</p>
                          </div>

                          <button
                            onClick={() => {
                              setActiveView("dashboard");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${activeView === "dashboard" ? "text-blue-600 bg-blue-50/50" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
                          >
                            <Activity className="w-4 h-4" />
                            Dashboard
                          </button>

                          <button
                            onClick={() => {
                              setActiveView("riwayat");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${activeView === "riwayat" ? "text-blue-600 bg-blue-50/50" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
                          >
                            <History className="w-4 h-4" />
                            Riwayat Pendaftaran
                          </button>

                          <button
                            onClick={() => {
                              setActiveView("profil");
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-5 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${activeView === "profil" ? "text-blue-600 bg-blue-50/50" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}
                          >
                            <User className="w-4 h-4" />
                            Profil Pelari
                          </button>

                          <div className="border-t border-slate-100 my-2"></div>

                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
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
                      <div className="flex flex-wrap gap-2 mb-4">
                        <span className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
                          {participant.jarak}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest flex items-center gap-1.5 border shadow-sm backdrop-blur-sm ${isLunas ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : "bg-rose-500/20 text-rose-300 border-rose-500/30"}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isLunas ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-rose-400 animate-pulse shadow-[0_0_8px_rgba(251,113,133,0.8)]"}`}
                          ></span>
                          {isLunas ? "Pembayaran Lunas" : "Menunggu Pembayaran"}
                        </span>
                      </div>

                      <h1 className="text-3xl md:text-5xl font-black mb-3 tracking-tight drop-shadow-md">
                        Virtual Run IKA UII
                      </h1>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-blue-200 text-sm font-bold flex items-center gap-1.5 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-md">
                          <CheckCircle2 className="w-4 h-4 text-blue-400" />
                          Paket: <span className="text-white">{participant.paket.toUpperCase()}</span>
                        </p>
                        {/* 🔥 MENAMPILKAN NOMOR E-BIB JIKA SUDAH PUNYA 🔥 */}
                        {participant.nomorBibLengkap && (
                          <p className="text-yellow-100 text-sm font-bold flex items-center gap-1.5 bg-yellow-500/20 px-3 py-1.5 rounded-lg border border-yellow-400/30 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.15)]">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            BIB: <span className="text-white">{participant.nomorBibLengkap}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-5 shrink-0 bg-white/5 p-4 sm:p-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 backdrop-blur-xl shadow-2xl w-full md:w-auto">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center drop-shadow-xl shrink-0">
                        <svg
                          className="w-full h-full transform -rotate-90 drop-shadow-md"
                          viewBox="0 0 80 80"
                        >
                          <circle
                            cx="40"
                            cy="40"
                            r={36}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.05)"
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
                          <span className="text-lg sm:text-xl font-black leading-none tracking-tighter">
                            {Math.round(progressPercent)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-bold text-blue-200/80 space-y-1.5">
                        <p className="bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                          Target:{" "}
                          <span className="text-white ml-1">{targetKm} KM</span>
                        </p>
                        <p className="bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm">
                          Status:{" "}
                          {isFinisher ? (
                            <span className="text-emerald-400 ml-1">Tercapai 🎉</span>
                          ) : (
                            <span className="text-blue-400 ml-1">Berjalan</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mt-8 sm:mt-12">
                    <div className="bg-[#11213D] border border-blue-500/20 p-3 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-xl hover:bg-[#15284B] transition-colors group">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 bg-blue-500/20 text-blue-300 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                        <MapPin className="w-3 h-3 sm:w-5 sm:h-5" />
                      </div>
                      <p className="text-[8px] sm:text-xs font-bold text-blue-200/70 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">
                        KM Ditempuh
                      </p>
                      <p className="text-base sm:text-4xl font-black text-white tracking-tight drop-shadow-sm truncate">
                        {totalApprovedKm.toFixed(2)}
                      </p>
                    </div>

                    <div className="bg-[#11213D] border border-indigo-500/20 p-3 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-xl hover:bg-[#15284B] transition-colors group">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 bg-indigo-500/20 text-indigo-300 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                        <Clock className="w-3 h-3 sm:w-5 sm:h-5" />
                      </div>
                      <p className="text-[8px] sm:text-xs font-bold text-blue-200/70 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">
                        Durasi Total
                      </p>
                      <p className="text-base sm:text-4xl font-black text-white tracking-tight drop-shadow-sm truncate">
                        {hitungTotalDurasi()}
                      </p>
                    </div>

                    <div className="bg-[#11213D] border border-emerald-500/20 p-3 sm:p-5 rounded-2xl sm:rounded-3xl text-center shadow-xl hover:bg-[#15284B] transition-colors group">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 bg-emerald-500/20 text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                        <Activity className="w-3 h-3 sm:w-5 sm:h-5" />
                      </div>
                      <p className="text-[8px] sm:text-xs font-bold text-blue-200/70 uppercase tracking-widest mb-1 sm:mb-2 line-clamp-1">
                        Aktivitas
                      </p>
                      <p className="text-base sm:text-4xl font-black text-white tracking-tight drop-shadow-sm truncate">
                        {totalAktivitas}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* HEADER: RIWAYAT VIEW */}
              {activeView === "riwayat" && (
                <div className="text-center pt-8 pb-4 animate-in fade-in duration-500">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-5 py-2 rounded-full mb-6 uppercase tracking-widest shadow-sm">
                    <History className="w-4 h-4 text-blue-300" />
                    Riwayat Pendaftaran
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md">
                    Riwayat Event
                  </h1>
                  <p className="text-blue-100 text-sm font-medium max-w-lg mx-auto leading-relaxed">
                    Lihat semua event yang telah Anda daftarkan beserta status
                    pembayarannya secara transparan.
                  </p>
                </div>
              )}

              {/* HEADER: PROFIL VIEW */}
              {activeView === "profil" && (
                <div className="text-center pt-8 pb-4 animate-in fade-in duration-500">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-5 py-2 rounded-full mb-6 uppercase tracking-widest shadow-sm">
                    <User className="w-4 h-4 text-blue-300" />
                    Profil Pelari
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md">
                    Pengaturan Profil
                  </h1>
                  <p className="text-blue-100 text-sm font-medium max-w-lg mx-auto leading-relaxed">
                    Kelola informasi pribadi, motto lari, dan foto profil yang akan tampil di halaman berbagi publik Anda.
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
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-rose-100">
                          {vrSettings?.metodePembayaran === "manual"
                            ? <CreditCard className="w-6 h-6 text-rose-500" />
                            : vrSettings?.metodePembayaran === "qris"
                              ? <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                              : <Info className="w-6 h-6 text-rose-500" />}
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
                          <p className="text-sm font-bold text-amber-800 flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4" /> Bukti Transfer Sedang Diverifikasi
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
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-500/20 flex flex-col sm:flex-row justify-between items-center gap-4 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 opacity-20 transform rotate-12 scale-150">
                        <Medal className="w-40 h-40" />
                      </div>
                      <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/30 shadow-inner">
                          <Trophy className="w-8 h-8 text-yellow-300" />
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
                        className={`p-5 sm:p-8 rounded-3xl shadow-xl border ${badge.borderClass} ${badge.bgClass} text-white relative overflow-hidden mb-6`}
                      >
                        {/* Efek Kilauan (Shine) di Background */}
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-3 sm:mb-4 sm:gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                              Status Pelari
                            </p>
                            <h2 className="text-lg sm:text-3xl font-black tracking-tight flex items-center gap-2">
                              <span className="text-2xl sm:text-3xl filter drop-shadow-md">
                                {badge.icon}
                              </span>
                              {badge.level}
                            </h2>
                          </div>
                          <div className="text-left sm:text-right bg-white/10 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl backdrop-blur-sm border border-white/10 w-full sm:w-auto">
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-0.5">
                              Total Jarak Terverifikasi
                            </p>
                            <p className="text-xl sm:text-2xl font-black">
                              {totalApprovedKm.toFixed(2)}{" "}
                              <span className="text-sm font-medium opacity-80">
                                KM
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar ke Level Berikutnya */}
                        {badge.nextTarget && (
                          <div className="mt-4 sm:mt-6 relative z-10">
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
                            <div className="w-full bg-black/20 rounded-full h-2 sm:h-2.5 overflow-hidden backdrop-blur-sm shadow-inner">
                              <div
                                className="bg-white h-2 sm:h-2.5 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                                style={{ width: `${percentToNext}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {!badge.nextTarget && (
                          <div className="mt-4 sm:mt-6 bg-white/20 px-4 py-3 rounded-xl backdrop-blur-sm text-sm font-bold text-center border border-white/20 shadow-inner relative z-10">
                            🎉 Luar Biasa! Anda telah mencapai level tertinggi
                            (Ultra Legend)!
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* DOKUMEN DIGITAL & PENGIRIMAN */}
                  {isLunas && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                      <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                        <div className="bg-purple-100 text-purple-600 p-2 rounded-xl">
                          <FileText className="w-5 h-5" />
                        </div>
                        Dokumen & Pengiriman
                      </h3>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {/* KUITANSI */}
                        <div className="border border-slate-100 rounded-2xl p-5 flex flex-col justify-between bg-slate-50 relative overflow-hidden group hover:border-emerald-300 hover:shadow-md transition-all">
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-400 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-sm">
                            Valid
                          </div>
                          <div className="flex items-center gap-4 mb-5 mt-2">
                            <div className="w-12 h-12 bg-white text-emerald-500 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-800 text-base truncate">
                                Kuitansi
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                                Bukti Bayar Sah
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadDocument("kuitansi")}
                            className="w-full bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-600 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm"
                          >
                            Unduh Kuitansi HD
                          </button>
                        </div>

                        {/* E-BIB */}
                        <div className="border border-slate-100 rounded-2xl p-5 flex flex-col justify-between bg-slate-50 hover:border-blue-300 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4 mb-5 mt-2">
                            <div className="w-12 h-12 bg-white text-blue-500 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <Activity className="w-6 h-6" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-800 text-base truncate">
                                e-BIB
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
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
                        <div className="border border-slate-100 rounded-2xl p-5 flex flex-col justify-between bg-slate-50 hover:border-amber-300 hover:shadow-md transition-all group">
                          <div className="flex items-center gap-4 mb-5 mt-2">
                            <div className="w-12 h-12 bg-white text-amber-500 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                              <Medal className="w-6 h-6" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-black text-slate-800 text-base truncate">
                                e-Cert
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                                Finisher Only
                              </p>
                            </div>
                          </div>
                          <button
                            disabled={!isFinisher}
                            onClick={() => handleDownloadDocument("sertifikat")}
                            className={`w-full font-bold py-2.5 rounded-xl text-xs transition-colors shadow-sm ${isFinisher ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300/50"}`}
                          >
                            {isFinisher ? "Unduh Sertifikat" : "Terkunci"}
                          </button>
                        </div>

                        {/* RESI PENGIRIMAN */}
                        {participant.paket !== "basic" && (
                          <div className="border border-slate-100 rounded-2xl p-5 flex flex-col justify-between bg-slate-50 sm:col-span-2 lg:col-span-3 hover:border-purple-300 transition-all">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-12 h-12 bg-white text-purple-500 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                                <UploadCloud className="w-6 h-6" />
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
                            <div className="bg-white border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                                  className="bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold py-2.5 px-6 rounded-xl text-xs transition-colors border border-purple-200 shrink-0"
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
                  <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                    <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
                        <Activity className="w-5 h-5" />
                      </div>
                      Aktivitas Lari
                      <span className="bg-slate-50 text-slate-500 text-xs px-2.5 py-0.5 rounded-full ml-2 border border-slate-200 shadow-sm font-bold">
                        {submissions.length}
                      </span>
                    </h3>

                    {submissions.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 font-medium border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <div className="w-16 h-16 bg-white border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <Activity className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm text-slate-500">
                          Belum ada bukti lari yang diunggah.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {submissions.map((sub, index) => (
                          <div
                            key={index}
                            className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 hover:border-slate-200 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-4 flex-grow">
                              <img
                                src={sub.imgUrl}
                                alt="Bukti"
                                className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100 shadow-sm"
                              />
                              <div className="flex-grow min-w-0">
                                <h4 className="font-black text-slate-800 text-base mb-1 truncate">
                                  Lari {sub.jarakKm} KM
                                </h4>
                                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 truncate">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(sub.tanggalLari).toLocaleDateString(
                                    "id-ID",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )}{" "}
                                  • <Clock className="w-3.5 h-3.5 ml-1" /> {sub.durasi}
                                </p>
                              </div>
                            </div>
                            <div className="shrink-0 sm:text-right border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-3 sm:mt-0">
                              {sub.status === "Approved" && (
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 text-[10px] font-black px-3 py-1.5 rounded-lg border border-emerald-200 uppercase tracking-widest shadow-sm">
                                  <Check className="w-3 h-3" /> Disetujui
                                </span>
                              )}
                              {sub.status === "Pending" && (
                                <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 text-[10px] font-black px-3 py-1.5 rounded-lg border border-amber-200 uppercase tracking-widest shadow-sm">
                                  <Clock className="w-3 h-3" /> Diperiksa
                                </span>
                              )}
                              {sub.status === "Rejected" && (
                                <span className="inline-flex items-center gap-1.5 text-rose-600 bg-rose-50 text-[10px] font-black px-3 py-1.5 rounded-lg border border-rose-200 uppercase tracking-widest shadow-sm">
                                  <X className="w-3 h-3" /> Ditolak
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
                  <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
                    <div className="p-6 sm:p-8">
                      <h3 className="font-black text-slate-800 text-lg mb-2 flex items-center gap-2">
                        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        Upload Bukti Lari
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mb-6">
                        Screenshot riwayat lari dari aplikasi Strava, Garmin,
                        NRC, dll.
                      </p>

                      {!isLunas ? (
                        <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-600 px-4">
                            Fitur terkunci. Silakan selesaikan pembayaran
                            terlebih dahulu.
                          </p>
                        </div>
                      ) : !isSubmissionOpen ? (
                        <div className="text-center py-10 bg-slate-50 border border-slate-100 rounded-2xl">
                          <div className="w-14 h-14 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-slate-400">
                            <Clock className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-bold text-slate-600 px-4">
                            {!isSubmissionStarted ? "Periode submit bukti lari belum dimulai. Pemanasan dulu ya!" : "Waktu submit bukti lari telah berakhir."}
                          </p>
                        </div>
                      ) : (
                        <>
                          {isFinisher && (
                            <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-2">
                              <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-inner mt-0.5">
                                <Trophy className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-black text-emerald-800">Target Tercapai! 🎉</p>
                                <p className="text-xs font-medium text-emerald-600 mt-1 leading-relaxed">
                                  Syarat Finisher terpenuhi, tapi petualangan belum usai! Terus berlari dan tambah jarak untuk membuka <b>Badge Level Gamifikasi</b> yang lebih tinggi.
                                </p>
                              </div>
                            </div>
                          )}
                          <form
                            onSubmit={handleUploadSubmit}
                            className="space-y-5"
                          >
                            <div
                            className={`border-2 border-dashed rounded-2xl p-2 text-center transition-all relative overflow-hidden group/upload cursor-pointer ${previewUrl ? "border-blue-400 bg-blue-50/50" : "border-slate-200 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-300"}`}
                          >
                            {previewUrl ? (
                              <div className="relative">
                                <img
                                  src={previewUrl}
                                  alt="Preview"
                                  className="w-full h-48 object-cover rounded-xl shadow-sm"
                                />
                                <div className="absolute inset-0 bg-blue-900/60 flex items-center justify-center opacity-0 group-hover/upload:opacity-100 transition-opacity rounded-xl backdrop-blur-sm">
                                  <span className="text-white text-xs font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-xl border border-white/30 backdrop-blur-md">
                                    Ganti Gambar
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="py-10 px-4">
                                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-blue-500 shadow-sm border border-slate-100 mx-auto mb-4 group-hover/upload:scale-110 transition-transform">
                                  <Camera className="w-6 h-6" />
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
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/25 transition-all mt-6 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isUploading ? (
                              <span className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>{" "}
                                Mengunggah...
                              </span>
                            ) : (
                              <>
                                Kirim Bukti Lari <ArrowRight className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </button>
                          </form>
                        </>
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
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                        <User className="w-5 h-5" />
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
                              <div className="w-full h-24 bg-slate-100 rounded-xl mb-4 border border-slate-200 flex items-center justify-center shadow-inner group-hover:bg-slate-200/50 transition-colors">
                                <ImageIcon className="w-8 h-8 text-slate-400" />
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
                        <div className="w-10 h-10 bg-white/20 text-white rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-sm">
                          <Share2 className="w-5 h-5" />
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
                          <Copy className="w-4 h-4" />
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
                      <Shield className="w-6 h-6" />
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
                    <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
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
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-inner group-hover:bg-blue-100 transition-colors">
                              <Activity className="w-8 h-8 sm:w-10 sm:h-10" />
                            </div>
                            <div>
                              <h3 className="font-black text-base sm:text-lg text-slate-900 mb-1">
                                Virtual Run IKA UII
                              </h3>
                              <p className="text-xs font-bold text-slate-500">
                                {ev.jarak} • Paket {ev.paket.toUpperCase()}
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase tracking-widest">
                                <Calendar className="w-3.5 h-3.5" />
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
                                <CheckCircle2 className="w-3.5 h-3.5" /> Finisher
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
                            {ev.paket !== "basic" && (
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
                            Masuk Dashboard <ArrowRight className="w-4 h-4 ml-1" />
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
