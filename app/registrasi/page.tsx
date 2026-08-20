"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@/lib/toast";
import { db, auth } from "@/lib/firebase";
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
  getDoc,
  addDoc,
} from "firebase/firestore";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

// 🔥 IMPORT RECHARTS UNTUK GRAFIK ANALITIK 🔥
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function MejaRegistrasiPage() {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [petugasName, setPetugasName] = useState("");
  const [tempName, setTempName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  const [agendaList, setAgendaList] = useState<any[]>([]);
  const [vrSettings, setVrSettings] = useState<any>(null);
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  const [pesertaList, setPesertaList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 STATE UNTUK TAB MODE PESERTA (Individu / Komunitas) 🔥
  const [participantMode, setParticipantMode] = useState<
    "individu" | "komunitas"
  >("individu");

  const [scanMode, setScanMode] = useState<"kamera" | "manual">("kamera");
  const [scanInput, setScanInput] = useState("");
  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
    subtext?: string;
  } | null>(null);

  // --- STATE UNTUK MODAL POPUP & CETAK THERMAL ---
  const [groupModalId, setGroupModalId] = useState<string | null>(null);
  const [confirmRacepackData, setConfirmRacepackData] = useState<any>(null);
  const [confirmCommunityData, setConfirmCommunityData] = useState<any>(null); // State khusus komunitas
  const [isSubmittingRacepack, setIsSubmittingRacepack] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  // 🔥 STATE UNTUK FORM PENGAMBILAN (SENDIRI / WAKIL) 🔥
  const [handoverType, setHandoverType] = useState<"sendiri" | "wakil">(
    "sendiri",
  );
  const [representativeName, setRepresentativeName] = useState("");

  const groupModalIdRef = useRef<string | null>(null);
  const pesertaListRef = useRef<any[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTanggal = currentTime.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formatJam = currentTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const storedName = localStorage.getItem("gate_petugas_name");
        if (storedName) {
          setPetugasName(storedName);
          setIsNameSet(true);
        }
        const storedAgenda = localStorage.getItem("gate_selected_agenda");
        if (storedAgenda) {
          try {
            setSelectedAgenda(JSON.parse(storedAgenda));
          } catch {}
        }
      } else {
        setUser(null);
        setIsNameSet(false);
        setPetugasName("");
        setSelectedAgenda(null);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const playBeep = (type: "success" | "error" | "warning" | "info") => {
    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.type = "square";
        osc.frequency.setValueAtTime(850, ctx.currentTime);
        gain.gain.setValueAtTime(1.0, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "info") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(1.0, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === "warning") {
        osc.type = "square";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        gain.gain.setValueAtTime(1.0, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(1.0, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch {
      console.log("Audio tidak didukung.");
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      setLoginError("Email atau Password salah.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setPetugasName(tempName);
    setIsNameSet(true);
    localStorage.setItem("gate_petugas_name", tempName);
  };

  const handleSelectAgenda = (agenda: any) => {
    setSelectedAgenda(agenda);
    localStorage.setItem("gate_selected_agenda", JSON.stringify(agenda));
  };

  const handleClearAgenda = () => {
    setSelectedAgenda(null);
    localStorage.removeItem("gate_selected_agenda");
  };

  const handleLogout = async () => {
    if (confirm("Yakin ingin keluar dan menghapus sesi jaga meja ini?")) {
      await signOut(auth);
      localStorage.removeItem("gate_selected_agenda");
      localStorage.removeItem("gate_petugas_name");
      setTempName("");
      if (document.fullscreenElement) document.exitFullscreen();
    }
  };

  useEffect(() => {
    if (!user) return;
    const fetchAgendasAndSettings = async () => {
      try {
        const q = query(collection(db, "agenda"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setAgendaList(
          snap.docs.map((d) => ({ id: d.id, type: "reguler", ...d.data() })),
        );

        const docSnap = await getDoc(doc(db, "settings", "virtual_run"));
        if (docSnap.exists()) setVrSettings(docSnap.data());
      } catch {
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgendasAndSettings();
  }, [user]);

  // 🔥 FETCH DATA BERDASARKAN TAB MODE 🔥
  useEffect(() => {
    if (!selectedAgenda || !user) return;
    let q;

    if (selectedAgenda.type === "racepack") {
      if (participantMode === "individu") {
        q = query(
          collection(db, "offline_participants"),
          where("statusPembayaran", "==", "Lunas"),
        );
      } else {
        q = query(
          collection(db, "pendaftaran_komunitas"),
          where("statusPembayaran", "==", "Lunas"),
        );
      }
    } else {
      q = query(
        collection(db, "agenda_peserta"),
        where("agendaId", "==", selectedAgenda.id),
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      rawData.sort((a: any, b: any) => {
        if (selectedAgenda.type === "racepack") {
          const timeA = a.waktuAmbilRacepack
            ? new Date(a.waktuAmbilRacepack).getTime()
            : 0;
          const timeB = b.waktuAmbilRacepack
            ? new Date(b.waktuAmbilRacepack).getTime()
            : 0;
          return timeB - timeA;
        } else {
          const timeA = a.waktuCheckIn ? new Date(a.waktuCheckIn).getTime() : 0;
          const timeB = b.waktuCheckIn ? new Date(b.waktuCheckIn).getTime() : 0;
          return timeB - timeA;
        }
      });
      setPesertaList(rawData);
      pesertaListRef.current = rawData;
    });
    return () => unsubscribe();
  }, [selectedAgenda, user, participantMode]);

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
            { fps: 30, qrbox: { width: 300, height: 300 }, disableFlip: false },
            false,
          );
          scanner.render(
            (decodedText: string) => processCheckIn(decodedText),
            () => {},
          );
        } catch {
          console.error("Gagal inisiasi kamera");
        }
      }
    };
    startCamera();
    return () => {
      isMounted = false;
      if (scanner) scanner.clear().catch(console.error);
    };
  }, [selectedAgenda, scanMode, participantMode]); // Re-init camera jika ganti tab

  const processCheckIn = async (rawScannedText: string) => {
    if (
      isProcessingRef.current ||
      groupModalIdRef.current ||
      confirmRacepackData ||
      confirmCommunityData
    )
      return;

    isProcessingRef.current = true;

    let id = rawScannedText.trim();
    if (id.includes("/verify-ticket/")) {
      const parts = id.split("/verify-ticket/");
      if (parts.length > 1) {
        id = parts[1].split("?")[0].replace("/", "").trim();
      }
    }

    if (!id) {
      isProcessingRef.current = false;
      return;
    }

    let peserta = pesertaListRef.current.find((p) => p.id === id);

    if (!peserta) {
      peserta = pesertaListRef.current.find((p) =>
        p.id.toLowerCase().startsWith(id.toLowerCase()),
      );
    }

    // Pencarian Ekstra (NIK/BIB) - HANYA BERLAKU UNTUK INDIVIDU
    if (
      !peserta &&
      selectedAgenda?.type === "racepack" &&
      participantMode === "individu"
    ) {
      peserta = pesertaListRef.current.find(
        (p) => p.nik === id || p.nomorBIB === id,
      );
    }

    if (!peserta) {
      playBeep("error");
      setScanMessage({
        type: "error",
        text:
          selectedAgenda.type === "racepack"
            ? `Data tidak ditemukan di Tab ${participantMode.toUpperCase()} (Pastikan tab benar atau status LUNAS).`
            : "Akses Ditolak: Tiket tidak ditemukan.",
      });
      setScanInput("");
      setTimeout(() => {
        setScanMessage(null);
        isProcessingRef.current = false;
      }, 3000);
      return;
    }

    const namaPenjaga = petugasName || "Petugas Gate";

    if (selectedAgenda.type === "racepack") {
      if (peserta.isRacepackTaken) {
        playBeep("error");
        const waktu = new Date(peserta.waktuAmbilRacepack).toLocaleTimeString(
          "id-ID",
          { hour: "2-digit", minute: "2-digit" },
        );
        const byWho =
          peserta.namaPengambil ||
          (participantMode === "komunitas" ? "Kapten Tim" : "Peserta Sendiri");
        setScanMessage({
          type: "warning",
          text: `SUDAH DIAMBIL: pkl ${waktu} WIB oleh ${byWho} (Admin: ${peserta.adminHandler})`,
        });
        setScanInput("");
        setTimeout(() => {
          setScanMessage(null);
          isProcessingRef.current = false;
        }, 3500);
        return;
      }

      playBeep("info");

      // Buka modal sesuai entitas
      if (participantMode === "individu") {
        setConfirmRacepackData(peserta);
        setHandoverType("sendiri");
      } else {
        setConfirmCommunityData(peserta);
        setHandoverType("sendiri"); // 'sendiri' untuk komunitas artinya Kapten yang ambil
      }

      setRepresentativeName("");
      setScanInput("");
      isProcessingRef.current = false;
      return;
    }

    if (peserta.tipeDaftar === "Kelompok" || Number(peserta.jumlahTiket) > 1) {
      playBeep("success");
      setGroupModalId(peserta.id);
      groupModalIdRef.current = peserta.id;
      setScanInput("");
      isProcessingRef.current = false;
      return;
    }

    if (peserta.statusCheckIn) {
      playBeep("error");
      const waktu = new Date(peserta.waktuCheckIn).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setScanMessage({
        type: "warning",
        text: `Tiket Terpakai: ${peserta.nama} (Hadir pkl ${waktu} WIB)`,
      });
      setScanInput("");
      setTimeout(() => {
        setScanMessage(null);
        isProcessingRef.current = false;
      }, 2500);
      return;
    }

    try {
      await updateDoc(doc(db, "agenda_peserta", peserta.id), {
        statusCheckIn: true,
        waktuCheckIn: new Date().toISOString(),
        diScanOleh: namaPenjaga,
      });

      await setDoc(doc(db, "system", "live_booth"), {
        trigger: true,
        nama: peserta.nama,
        fakultas: peserta.fakultas,
        angkatan: peserta.angkatan,
        timestamp: new Date().toISOString(),
      });

      playBeep("success");
      setScanMessage({
        type: "success",
        text: `Berhasil Hadir: ${peserta.nama}`,
      });
    } catch {
      playBeep("error");
      setScanMessage({
        type: "error",
        text: "Koneksi Gagal: Periksa jaringan internet.",
      });
    }
    setScanInput("");
    setTimeout(() => {
      setScanMessage(null);
      isProcessingRef.current = false;
    }, 2500);
  };

  const executeConfirmRacepack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmRacepackData) return;

    if (handoverType === "wakil" && representativeName.trim() === "") {
      toast.warning("Harap masukkan nama perwakilan yang mengambil!");
      return;
    }

    setIsSubmittingRacepack(true);
    const peserta = confirmRacepackData;
    const namaPenjaga = petugasName || "Petugas Gate";
    const currentTime = new Date().toISOString();

    const pengambilFix =
      handoverType === "sendiri"
        ? "Peserta Sendiri"
        : representativeName.trim();

    try {
      await updateDoc(doc(db, "offline_participants", peserta.id), {
        isRacepackTaken: true,
        waktuAmbilRacepack: currentTime,
        adminHandler: namaPenjaga,
        namaPengambil: pengambilFix,
      });

      await addDoc(collection(db, "vr_logs"), {
        type: "resi",
        action: `menyerahkan racepack di lokasi kepada: ${pengambilFix}`,
        targetName: peserta.namaLengkap,
        adminEmail: namaPenjaga,
        timestamp: Date.now(),
      });

      setReceiptData({
        ...peserta,
        waktuAmbilRacepack: currentTime,
        adminHandler: namaPenjaga,
        namaPengambil: pengambilFix,
        isCommunityMode: false,
      });

      playBeep("success");
      setScanMessage({
        type: "success",
        text: `BERHASIL: Diserahkan kepada ${pengambilFix}`,
      });

      setTimeout(() => window.print(), 300);
    } catch {
      playBeep("error");
      setScanMessage({
        type: "error",
        text: "Koneksi Gagal: Periksa jaringan internet.",
      });
    }

    setIsSubmittingRacepack(false);
    setConfirmRacepackData(null);
    setHandoverType("sendiri");
    setRepresentativeName("");
    setTimeout(() => setScanMessage(null), 2500);
  };

  const executeConfirmCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmCommunityData) return;

    if (handoverType === "wakil" && representativeName.trim() === "") {
      toast.warning("Harap masukkan nama perwakilan (bukan kapten) yang mengambil!");
      return;
    }

    setIsSubmittingRacepack(true);
    const group = confirmCommunityData;
    const namaPenjaga = petugasName || "Petugas Gate";
    const currentTime = new Date().toISOString();

    const pengambilFix =
      handoverType === "sendiri"
        ? `Kapten Tim (${group.namaKapten})`
        : representativeName.trim();

    try {
      await updateDoc(doc(db, "pendaftaran_komunitas", group.id), {
        isRacepackTaken: true,
        waktuAmbilRacepack: currentTime,
        adminHandler: namaPenjaga,
        namaPengambil: pengambilFix,
      });

      await addDoc(collection(db, "vr_logs"), {
        type: "resi",
        action: `menyerahkan paket racepack tim di lokasi kepada: ${pengambilFix}`,
        targetName: group.komunitas,
        adminEmail: namaPenjaga,
        timestamp: Date.now(),
      });

      setReceiptData({
        ...group,
        waktuAmbilRacepack: currentTime,
        adminHandler: namaPenjaga,
        namaPengambil: pengambilFix,
        isCommunityMode: true,
      });

      playBeep("success");
      setScanMessage({
        type: "success",
        text: `BERHASIL: Tim ${group.komunitas} diserahkan kepada ${pengambilFix}`,
      });

      setTimeout(() => window.print(), 300);
    } catch {
      playBeep("error");
      setScanMessage({
        type: "error",
        text: "Koneksi Gagal: Periksa jaringan internet.",
      });
    }

    setIsSubmittingRacepack(false);
    setConfirmCommunityData(null);
    setHandoverType("sendiri");
    setRepresentativeName("");
    setTimeout(() => setScanMessage(null), 2500);
  };

  const markGroupMember = async (pesertaData: any, memberName: string) => {
    try {
      const currentAnggotaHadir = pesertaData.anggotaHadir || [];
      if (currentAnggotaHadir.includes(memberName)) return;

      const newAnggotaHadir = [...currentAnggotaHadir, memberName];
      const namaPenjaga = petugasName || "Petugas Gate";

      await updateDoc(doc(db, "agenda_peserta", pesertaData.id), {
        statusCheckIn: true,
        waktuCheckIn: pesertaData.waktuCheckIn || new Date().toISOString(),
        diScanOleh: namaPenjaga,
        anggotaHadir: newAnggotaHadir,
      });

      await setDoc(doc(db, "system", "live_booth"), {
        trigger: true,
        nama: memberName,
        fakultas: pesertaData.fakultas,
        angkatan: pesertaData.angkatan,
        timestamp: new Date().toISOString(),
      });

      playBeep("success");
    } catch {
      toast.error("Gagal mengupdate data anggota rombongan.");
    }
  };

  const closeGroupModal = () => {
    setGroupModalId(null);
    groupModalIdRef.current = null;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckIn(scanInput);
  };

  const handleBatalkanHadir = async (peserta: any) => {
    const isRacepack = selectedAgenda?.type === "racepack";
    const namaTarget = isRacepack
      ? participantMode === "individu"
        ? peserta.namaLengkap
        : peserta.komunitas
      : peserta.nama;

    if (
      !confirm(
        `Yakin membatalkan status untuk: ${namaTarget}? \nSistem akan mereset status data ini.`,
      )
    )
      return;

    try {
      if (isRacepack) {
        const targetCollection =
          participantMode === "individu"
            ? "offline_participants"
            : "pendaftaran_komunitas";
        await updateDoc(doc(db, targetCollection, peserta.id), {
          isRacepackTaken: false,
          waktuAmbilRacepack: null,
          adminHandler: null,
          namaPengambil: null,
        });
      } else {
        await updateDoc(doc(db, "agenda_peserta", peserta.id), {
          statusCheckIn: false,
          waktuCheckIn: null,
          diScanOleh: null,
          anggotaHadir: [],
        });
      }
    } catch {
      toast.error("Gagal membatalkan. Cek koneksi internet.");
    }
  };

  if (isAuthChecking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans font-bold print:hidden">
        Memeriksa Akses...
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 font-sans p-4 relative overflow-hidden print:hidden">
        <div className="absolute top-8 text-center opacity-80">
          <h2 className="text-4xl font-black text-white font-mono tracking-widest">
            {formatJam}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {formatTanggal}
          </p>
        </div>
        <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 mt-10">
          <h1 className="text-2xl font-black text-slate-800 text-center mb-6">
            Gate Registrasi
          </h1>
          {loginError && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-bold mb-4 text-center">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border rounded px-4 py-3 text-sm"
              placeholder="Email Petugas"
            />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border rounded px-4 py-3 text-sm"
              placeholder="Password"
            />
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded"
            >
              {isLoggingIn ? "Masuk..." : "Mulai"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user && !isNameSet) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-4 relative print:hidden">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-blue-600 p-6 text-center text-white">
            <h2 className="text-xl font-black">Identitas Petugas</h2>
            <p className="text-xs opacity-80 mt-1">
              Siapa yang bertugas di shift ini?
            </p>
          </div>
          <form onSubmit={handleSaveName} className="p-8">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Nama Lengkap Petugas
            </label>
            <input
              type="text"
              autoFocus
              required
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-lg px-4 py-4 text-center text-lg font-black text-slate-800 focus:outline-none focus:border-blue-500 mb-6"
              placeholder="Misal: Budi Santoso"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-lg shadow-md transition-colors"
            >
              Lanjut ke Pemilihan Agenda &rarr;
            </button>
          </form>
          <div className="pb-4 text-center">
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-red-500 hover:underline"
            >
              Ganti Akun Meja
            </button>
          </div>
        </div>
      </div>
    );
  }

  let totalTiket = 0;
  let totalHadir = 0;
  let daftarHadirLive: any[] = [];
  let barData: any[] = [];

  const isRacepackMode = selectedAgenda?.type === "racepack";

  if (isRacepackMode) {
    totalTiket = pesertaList.length;
    daftarHadirLive = pesertaList.filter((p) => p.isRacepackTaken);
    totalHadir = daftarHadirLive.length;

    const catCount: any = {};
    daftarHadirLive.forEach((p) => {
      const cat =
        participantMode === "individu"
          ? p.kategoriPeserta || "Lainnya"
          : "Tim / Grup";
      catCount[cat] = (catCount[cat] || 0) + 1;
    });
    barData = Object.keys(catCount).map((k) => ({
      name: k,
      total: catCount[k],
    }));
  } else if (selectedAgenda) {
    totalTiket = pesertaList.reduce(
      (acc, curr) => acc + (Number(curr.jumlahTiket) || 1),
      0,
    );
    daftarHadirLive = pesertaList.filter((p) => p.statusCheckIn);
    totalHadir = daftarHadirLive.reduce(
      (acc, curr) => acc + (Number(curr.jumlahTiket) || 1),
      0,
    );

    const typeCount: any = {};
    daftarHadirLive.forEach((p) => {
      const type = p.tipeDaftar || "Individu";
      typeCount[type] = (typeCount[type] || 0) + (Number(p.jumlahTiket) || 1);
    });
    barData = Object.keys(typeCount).map((k) => ({
      name: k,
      total: typeCount[k],
    }));
  }

  const sisaTiket = Math.max(0, totalTiket - totalHadir);
  const donutData = [
    {
      name: isRacepackMode ? "Diambil" : "Hadir",
      value: totalHadir,
      color: isRacepackMode ? "#10B981" : "#3B82F6",
    },
    { name: "Sisa", value: sisaTiket, color: "#E2E8F0" },
  ];
  const progressPercentage =
    totalTiket === 0 ? 0 : Math.round((totalHadir / totalTiket) * 100);

  if (!selectedAgenda) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col print:hidden">
        <div className="bg-white border-b border-slate-200 p-4 px-6 flex flex-col sm:flex-row justify-between items-center shadow-sm gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold text-slate-800 leading-none">
              Pilih Agenda Registrasi
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Petugas Jaga:{" "}
              <span className="font-bold text-blue-600">{petugasName}</span>
            </p>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xl font-black text-slate-800 font-mono tracking-widest">
              {formatJam}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {formatTanggal}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded border border-red-100 transition-colors w-full sm:w-auto"
          >
            Akhiri Shift (Keluar)
          </button>
        </div>

        <div className="p-6 max-w-4xl mx-auto w-full">
          {isLoading ? (
            <div className="text-center py-10 text-slate-400 font-bold text-sm">
              Memuat daftar agenda...
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {vrSettings?.isOfflineRunEnabled && (
                <button
                  onClick={() =>
                    handleSelectAgenda({
                      id: "racepack_offline",
                      type: "racepack",
                      judul: "Distribusi Racepack (Offline Run)",
                      tanggal:
                        vrSettings.offlineDate || "Jadwal Mengikuti Event",
                    })
                  }
                  className="text-left bg-gradient-to-br from-emerald-600 to-teal-800 p-6 border border-emerald-500/50 rounded-2xl shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
                >
                  <div className="absolute -right-6 -bottom-6 text-7xl opacity-20 transform group-hover:scale-110 transition-transform">
                    📦
                  </div>
                  <div className="relative z-10">
                    <div className="text-[10px] font-black text-emerald-200 mb-1 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>{" "}
                      OFFLINE RUN
                    </div>
                    <h3 className="font-black text-white text-xl group-hover:text-emerald-50 transition-colors mb-2">
                      Distribusi Racepack / Atribut
                    </h3>
                    <p className="text-xs text-emerald-100 font-medium">
                      Verifikasi tiket lunas dan serahkan Jersey & BIB peserta.
                    </p>
                    <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-4 py-1.5 rounded-full border border-white/30">
                      Buka Scanner &rarr;
                    </div>
                  </div>
                </button>
              )}
              {agendaList.map((agenda) => (
                <button
                  key={agenda.id}
                  onClick={() => handleSelectAgenda(agenda)}
                  className="text-left bg-white p-6 border border-slate-200 rounded-2xl hover:border-blue-500 hover:shadow-lg transition-all shadow-sm group"
                >
                  <div className="text-[10px] font-black text-blue-600 mb-1 uppercase tracking-widest">
                    {agenda.tanggal}
                  </div>
                  <h3 className="font-black text-slate-800 text-lg group-hover:text-blue-700 transition-colors mb-2">
                    {agenda.judul}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Buku tamu digital (Hadir / Tidak Hadir).
                  </p>
                  <div className="mt-4 text-xs font-bold text-blue-500 bg-blue-50 w-fit px-3 py-1 rounded-full border border-blue-100">
                    Buka Gate &rarr;
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const CURRENT_YEAR = new Date().getFullYear();

  return (
    <>
      <div className="min-h-screen lg:h-screen bg-slate-50 flex flex-col font-sans relative lg:overflow-hidden print:hidden">
        {/* ===================================================================== */}
        {/* 🔥 MODAL RACEPACK INDIVIDU 🔥  */}
        {/* ===================================================================== */}
        {confirmRacepackData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {confirmRacepackData.namaLengkap}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ID: {confirmRacepackData.id}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1 text-[10px] uppercase tracking-wider font-black rounded-full border bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20">
                    LUNAS
                  </span>
                </div>
              </div>

              <form
                onSubmit={executeConfirmRacepack}
                className="flex flex-col overflow-hidden h-full"
              >
                <div className="flex-grow overflow-y-auto p-6 bg-white flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                        Informasi Tiket
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Nomor BIB
                          </p>
                          <p className="text-xl font-black font-mono text-[#1A73E8]">
                            {confirmRacepackData.nomorBIB || "Menunggu"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Kategori Jarak
                          </p>
                          <p className="text-base font-bold text-slate-800">
                            {confirmRacepackData.jarak}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Nama di BIB
                          </p>
                          <p className="text-sm font-bold text-slate-800">
                            {confirmRacepackData.namaBib || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Ukuran Jersey
                          </p>
                          <p className="text-sm font-black text-slate-800">
                            {confirmRacepackData.ukuranJersey || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-3">
                        Data Pribadi
                      </h3>
                      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            No Identitas (NIK)
                          </p>
                          <p className="font-medium text-slate-800">
                            {confirmRacepackData.nik || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Gender / Darah
                          </p>
                          <p className="font-medium text-slate-800">
                            {confirmRacepackData.jenisKelamin || "-"} /{" "}
                            {confirmRacepackData.golonganDarah || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            WhatsApp
                          </p>
                          <p className="font-medium text-slate-800">
                            {confirmRacepackData.noWA || "-"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Email
                          </p>
                          <p className="font-medium text-slate-800 truncate">
                            {confirmRacepackData.email || "-"}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-slate-500 font-bold uppercase">
                            Riwayat Penyakit
                          </p>
                          <p className="font-medium text-rose-600">
                            {confirmRacepackData.riwayatPenyakit || "-"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:w-80 shrink-0 flex flex-col space-y-5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-1">
                      Form Penyerahan Racepack
                    </h3>
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Siapa yang mengambil?
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${handoverType === "sendiri" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          <input
                            type="radio"
                            name="handover"
                            value="sendiri"
                            checked={handoverType === "sendiri"}
                            onChange={() => setHandoverType("sendiri")}
                            className="hidden"
                          />
                          <span className="text-sm font-bold">Sendiri</span>
                        </label>
                        <label
                          className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${handoverType === "wakil" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          <input
                            type="radio"
                            name="handover"
                            value="wakil"
                            checked={handoverType === "wakil"}
                            onChange={() => setHandoverType("wakil")}
                            className="hidden"
                          />
                          <span className="text-sm font-bold">Diwakilkan</span>
                        </label>
                      </div>
                    </div>
                    {handoverType === "wakil" && (
                      <div className="animate-in slide-in-from-top-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                          Nama Perwakilan{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          autoFocus
                          value={representativeName}
                          onChange={(e) =>
                            setRepresentativeName(e.target.value)
                          }
                          placeholder="Nama..."
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm transition-colors text-slate-800 font-bold shadow-sm"
                        />
                      </div>
                    )}
                    <div className="mt-auto bg-blue-50 border border-blue-100 p-4 rounded-2xl flex flex-col justify-center">
                      {confirmRacepackData.kodePromoDipakai && (
                        <div className="mb-3 text-left text-xs space-y-1.5 border-b border-blue-200/50 pb-3">
                          <div className="flex justify-between text-slate-500 font-medium">
                            <span>Harga Asli:</span>
                            <span>
                              Rp{" "}
                              {confirmRacepackData.hargaAsli?.toLocaleString(
                                "id-ID",
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                            <span>
                              Promo ({confirmRacepackData.kodePromoDipakai}):
                            </span>
                            <span>
                              - Rp{" "}
                              {confirmRacepackData.totalDiskon?.toLocaleString(
                                "id-ID",
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-70 text-[#1A73E8]">
                          Total Dibayar{" "}
                          {confirmRacepackData.kodePromoDipakai ? "(Nett)" : ""}
                        </p>
                        <p className="text-2xl font-black text-[#1A73E8]">
                          Rp{" "}
                          {confirmRacepackData.totalTagihan?.toLocaleString(
                            "id-ID",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmRacepackData(null)}
                    disabled={isSubmittingRacepack}
                    className="bg-slate-100 border border-slate-200 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-200 transition-colors text-sm uppercase tracking-widest w-full md:w-auto"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRacepack}
                    className="bg-emerald-600 text-white font-black py-3 px-8 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
                  >
                    {isSubmittingRacepack ? (
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      "Serahkan & Cetak 🖨️"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* 🔥 MODAL RACEPACK KOMUNITAS (TABEL MANIFES ANGGOTA TIM) 🔥 */}
        {/* ===================================================================== */}
        {confirmCommunityData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    Tim: {confirmCommunityData.komunitas}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Kapten: {confirmCommunityData.namaKapten} | ID:{" "}
                    {confirmCommunityData.id}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1 text-[10px] uppercase tracking-wider font-black rounded-full border bg-[#E6F4EA] text-[#1E8E3E] border-[#1E8E3E]/20">
                    LUNAS KELOMPOK
                  </span>
                </div>
              </div>

              <form
                onSubmit={executeConfirmCommunity}
                className="flex flex-col overflow-hidden h-full"
              >
                <div className="flex-grow overflow-y-auto p-6 bg-white flex flex-col lg:flex-row gap-8">
                  {/* KIRI: TABEL MANIFES TIM */}
                  <div className="flex-1 flex flex-col min-h-0 border border-slate-200 rounded-2xl overflow-hidden">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center shrink-0">
                      <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">
                        Daftar Anggota & Atribut
                      </h3>
                      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
                        {confirmCommunityData.participants?.length || 0} Anggota
                      </span>
                    </div>
                    <div className="overflow-x-auto overflow-y-auto flex-grow">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">
                              No
                            </th>
                            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">
                              Nama Lengkap
                            </th>
                            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">
                              Jarak
                            </th>
                            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider text-center">
                              Size
                            </th>
                            <th className="px-4 py-3 font-bold text-slate-500 text-xs uppercase tracking-wider">
                              No. BIB
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {confirmCommunityData.participants?.map(
                            (p: any, idx: number) => (
                              <tr
                                key={idx}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-4 py-3 text-slate-500 text-center font-bold">
                                  {idx + 1}
                                </td>
                                <td className="px-4 py-3">
                                  <p className="font-bold text-slate-800">
                                    {p.nama || p.namaLengkap}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    NIK: {p.nik}
                                  </p>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-slate-700">
                                  {p.jarak || p.kategori}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="bg-slate-100 px-2 py-1 rounded text-xs font-black text-slate-700">
                                    {p.ukuranJersey || "-"}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono font-black text-[#1A73E8]">
                                  {p.bib || p.nomorBIB || "-"}
                                </td>
                              </tr>
                            ),
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* KANAN: FORM PENGAMBILAN & TOTAL */}
                  <div className="lg:w-80 shrink-0 flex flex-col space-y-5">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-1">
                      Penerima Paket Grup
                    </h3>
                    <div>
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                        Yang Mengambil Di Lokasi:
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label
                          className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${handoverType === "sendiri" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          <input
                            type="radio"
                            name="handover_com"
                            value="sendiri"
                            checked={handoverType === "sendiri"}
                            onChange={() => setHandoverType("sendiri")}
                            className="hidden"
                          />
                          <span className="text-[11px] font-bold uppercase text-center leading-tight">
                            Kapten
                            <br />
                            Utama
                          </span>
                        </label>
                        <label
                          className={`flex items-center justify-center gap-2 p-3 border-2 rounded-xl cursor-pointer transition-all ${handoverType === "wakil" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                        >
                          <input
                            type="radio"
                            name="handover_com"
                            value="wakil"
                            checked={handoverType === "wakil"}
                            onChange={() => setHandoverType("wakil")}
                            className="hidden"
                          />
                          <span className="text-[11px] font-bold uppercase text-center leading-tight">
                            Anggota / Wakil
                          </span>
                        </label>
                      </div>
                    </div>

                    {handoverType === "wakil" && (
                      <div className="animate-in slide-in-from-top-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                          Nama Pengambil{" "}
                          <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          autoFocus
                          value={representativeName}
                          onChange={(e) =>
                            setRepresentativeName(e.target.value)
                          }
                          placeholder="Nama wakil tim..."
                          className="w-full px-4 py-3 bg-white border-2 border-slate-200 focus:border-emerald-500 rounded-xl outline-none text-sm transition-colors text-slate-800 font-bold shadow-sm"
                        />
                      </div>
                    )}

                    <div className="mt-auto bg-[#F0FDF4] border border-[#BBF7D0] p-4 rounded-2xl flex flex-col justify-center text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-emerald-600">
                        Total Dibayar Grup
                      </p>
                      <p className="text-2xl font-black text-emerald-700">
                        Rp{" "}
                        {confirmCommunityData.totalTagihan?.toLocaleString(
                          "id-ID",
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-end gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmCommunityData(null)}
                    disabled={isSubmittingRacepack}
                    className="bg-slate-100 border border-slate-200 text-slate-600 font-bold py-3 px-8 rounded-xl hover:bg-slate-200 transition-colors text-sm uppercase tracking-widest w-full md:w-auto"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRacepack}
                    className="bg-emerald-600 text-white font-black py-3 px-8 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 w-full md:w-auto"
                  >
                    {isSubmittingRacepack ? (
                      <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      "Serahkan Semua & Cetak 🖨️"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* === MODAL POP-UP KHUSUS ROMBONGAN REGULER === */}
        {groupModalId &&
          !isRacepackMode &&
          (() => {
            const groupPeserta = pesertaList.find((p) => p.id === groupModalId);
            if (!groupPeserta) {
              setGroupModalId(null);
              groupModalIdRef.current = null;
              return null;
            }

            const hadir = groupPeserta.anggotaHadir || [];
            const allMembers = [groupPeserta.nama];

            if (groupPeserta.namaAnggota) {
              let rawText = groupPeserta.namaAnggota;
              rawText = rawText.replace(/[\n;]/g, "|");
              rawText = rawText.replace(/(?:\d+[\.\)]\s+)/g, "|");
              rawText = rawText.replace(/\)\s+/g, ")|");
              rawText = rawText.replace(/\s+(dan|&)\s+/gi, "|");

              const parsed = rawText
                .split("|")
                .map((n: string) => n.trim())
                .filter((n: string) => n.length > 1);
              allMembers.push(...parsed);
            }

            return (
              <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-blue-600 p-6 text-white flex justify-between items-center shrink-0">
                    <div>
                      <h3 className="text-xl font-black">Tiket Rombongan</h3>
                      <p className="text-sm font-medium opacity-90 mt-1">
                        Pemesan Utama: {groupPeserta.nama}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-black tracking-widest border border-white/30 block mb-1">
                        {groupPeserta.jumlahTiket} TIKET
                      </span>
                    </div>
                  </div>

                  <div className="p-6 overflow-y-auto flex-grow bg-slate-50">
                    <div className="flex justify-between items-end mb-3 border-b border-slate-200 pb-2">
                      <h3 className="text-sm font-bold text-slate-800">
                        Daftar Kehadiran Anggota
                      </h3>
                      <span className="text-xs font-medium text-slate-500">
                        {hadir.length} dari {allMembers.length} Hadir
                      </span>
                    </div>
                    <div className="space-y-3">
                      {allMembers.map((member, idx) => {
                        const isHadir = hadir.includes(member);
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isHadir ? "bg-green-50 border-green-200 shadow-sm" : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm"}`}
                          >
                            <span
                              className={`font-bold text-sm ${isHadir ? "text-green-800" : "text-slate-700"}`}
                            >
                              {idx + 1}. {member}
                            </span>
                            {isHadir ? (
                              <span className="text-[10px] bg-green-200 text-green-800 px-3 py-1.5 rounded-full font-black w-fit uppercase tracking-widest">
                                ✅ SUDAH MASUK
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  markGroupMember(groupPeserta, member)
                                }
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-xs font-black shadow-sm uppercase tracking-widest transition-colors"
                              >
                                HADIRKAN &rarr;
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                    <button
                      onClick={closeGroupModal}
                      className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-black text-sm uppercase tracking-widest transition-colors"
                    >
                      TUTUP & LANJUT SCAN LAINNYA
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

        {/* HEADER SCANNER */}
        <div
          className={`border-b p-3 px-4 md:px-6 flex flex-col md:flex-row justify-between items-center shadow-sm shrink-0 gap-3 transition-colors duration-500 ${isRacepackMode ? "bg-[#0B2239] text-white border-[#0B2239]" : "bg-white"}`}
        >
          <div className="text-center md:text-left w-full md:w-auto">
            <button
              onClick={handleClearAgenda}
              className={`text-[10px] font-bold uppercase mb-1 ${isRacepackMode ? "text-emerald-300 hover:text-emerald-100" : "text-blue-600 hover:text-blue-800"}`}
            >
              &larr; Ganti Agenda
            </button>
            <h2
              className={`text-lg font-black leading-tight md:leading-none truncate max-w-sm ${isRacepackMode ? "text-white" : "text-slate-800"}`}
            >
              {selectedAgenda.judul}
            </h2>
            <p
              className={`text-xs mt-1 ${isRacepackMode ? "text-slate-300" : "text-slate-500"}`}
            >
              Petugas:{" "}
              <span className="font-bold text-[#FCD116]">{petugasName}</span>
            </p>
          </div>
          <div className="hidden md:flex items-center justify-center gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`text-2xl font-black font-mono tracking-widest px-4 py-1 rounded-t-lg border-b-2 ${isRacepackMode ? "bg-white/10 text-[#FCD116] border-[#FCD116]/50" : "bg-blue-50 text-blue-900 border-blue-200"}`}
              >
                {formatJam}
              </span>
              <span
                className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isRacepackMode ? "text-slate-300" : "text-slate-500"}`}
              >
                {formatTanggal}
              </span>
            </div>
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded-lg border transition-colors ${isRacepackMode ? "bg-white/10 border-white/20 text-white hover:bg-white/20" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"}`}
            >
              {isFullscreen ? (
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
                    d="M9 20v-6h-6m12 6v-6h6M9 4v6h-6m12-6v6h6"
                  />
                </svg>
              ) : (
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
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* AREA KERJA (SPLIT DASHBOARD MODERN) */}
        <div className="flex flex-col lg:flex-row gap-5 flex-grow p-4 md:p-6 max-w-[1400px] mx-auto w-full min-h-0">
          {/* KOLOM KIRI: SCANNER */}
          <div className="w-full lg:w-7/12 flex flex-col bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm h-[500px] lg:h-full min-h-0 relative">
            {/* 🔥 FITUR BARU: TAB MODE (INDIVIDU / KOMUNITAS) 🔥 */}
            {isRacepackMode && (
              <div className="flex bg-slate-100 p-2 gap-2 shrink-0 border-b border-slate-200">
                <button
                  onClick={() => setParticipantMode("individu")}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${participantMode === "individu" ? "bg-[#0B2239] text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  Meja Individu
                </button>
                <button
                  onClick={() => setParticipantMode("komunitas")}
                  className={`flex-1 py-2.5 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${participantMode === "komunitas" ? "bg-[#0B2239] text-white shadow-md" : "text-slate-500 hover:bg-slate-200"}`}
                >
                  Meja Komunitas (Grup)
                </button>
              </div>
            )}

            <div className="flex bg-slate-50 border-b p-3 gap-3 shrink-0">
              <button
                onClick={() => setScanMode("kamera")}
                className={`flex-1 py-3 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${scanMode === "kamera" ? (isRacepackMode ? "bg-[#1E8E3E] text-white shadow-md" : "bg-[#1A73E8] text-white shadow-md") : "text-slate-500 hover:bg-slate-200"}`}
              >
                Kamera Scan
              </button>
              <button
                onClick={() => setScanMode("manual")}
                className={`flex-1 py-3 text-xs font-black rounded-xl uppercase tracking-widest transition-all ${scanMode === "manual" ? (isRacepackMode ? "bg-[#1E8E3E] text-white shadow-md" : "bg-[#1A73E8] text-white shadow-md") : "text-slate-500 hover:bg-slate-200"}`}
              >
                Ketik Manual
              </button>
            </div>

            {scanMessage && (
              <div
                className={`p-4 text-center border-b shrink-0 z-10 relative ${scanMessage.type === "success" ? "bg-green-50 border-green-200" : scanMessage.type === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}
              >
                <span
                  className={`text-lg font-black ${scanMessage.type === "success" ? "text-green-700" : scanMessage.type === "warning" ? "text-yellow-700" : "text-red-700"}`}
                >
                  {scanMessage.text}
                </span>
              </div>
            )}

            <div className="flex-grow bg-slate-100 relative flex flex-col items-center justify-center overflow-y-auto">
              {scanMode === "kamera" ? (
                <div
                  id="reader"
                  className={`w-full max-w-lg mx-auto bg-white p-2 rounded-2xl shadow-inner [&>div]:border-none [&_video]:object-cover [&_video]:rounded-xl text-slate-800 [&_select]:bg-slate-50 [&_select]:border [&_select]:border-slate-300 [&_select]:text-slate-800 [&_select]:px-3 [&_select]:py-2 [&_select]:rounded-lg [&_button]:text-white [&_button]:font-bold [&_button]:px-5 [&_button]:py-2.5 [&_button]:rounded-lg [&_button]:mt-3 hover:[&_button]:opacity-90 [&_a]:underline ${isRacepackMode ? "[&_button]:bg-[#1E8E3E] [&_a]:text-[#1E8E3E]" : "[&_button]:bg-[#1A73E8] [&_a]:text-[#1A73E8]"}`}
                ></div>
              ) : (
                <form
                  onSubmit={handleManualSubmit}
                  className="w-full max-w-sm p-6 bg-white rounded-3xl shadow-sm border border-slate-200"
                >
                  <p className="text-center text-xs font-bold text-slate-500 mb-4 uppercase tracking-widest">
                    Input Data{" "}
                    {participantMode === "individu" ? "Peserta" : "Grup"}
                  </p>
                  <input
                    type="text"
                    autoFocus
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    className={`w-full text-center font-black text-3xl p-5 rounded-2xl bg-slate-50 border-2 focus:outline-none mb-4 uppercase transition-colors ${isRacepackMode ? "focus:border-[#1E8E3E] text-[#0B2239]" : "focus:border-[#1A73E8] text-[#1A73E8]"}`}
                    placeholder={
                      isRacepackMode
                        ? participantMode === "individu"
                          ? "BIB / NIK..."
                          : "ID GRUP..."
                        : "ID Tiket..."
                    }
                  />
                  <button
                    type="submit"
                    className={`w-full text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-all shadow-lg hover:-translate-y-1 ${isRacepackMode ? "bg-[#1E8E3E] hover:bg-[#188038] shadow-green-600/30" : "bg-[#1A73E8] hover:bg-[#1557B0] shadow-blue-600/30"}`}
                  >
                    {isRacepackMode ? "Cari Data Lunas" : "Proses Hadir"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: ANALITIK & RIWAYAT */}
          <div className="w-full lg:w-5/12 flex flex-col gap-5 min-h-0">
            {/* BARIS ANALITIK GRAFIK */}
            <div className="grid grid-cols-2 gap-4 shrink-0">
              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 z-10">
                  Progress{" "}
                  {isRacepackMode
                    ? participantMode === "individu"
                      ? "Individu"
                      : "Komunitas"
                    : "Kehadiran"}
                </p>
                <div className="h-32 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={35}
                        outerRadius={55}
                        stroke="none"
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {donutData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => [value, "Peserta"]}
                        contentStyle={{
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span
                      className={`text-xl font-black leading-none ${isRacepackMode ? "text-[#1E8E3E]" : "text-[#1A73E8]"}`}
                    >
                      {progressPercentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full flex justify-between px-2 text-[10px] font-bold text-slate-500 z-10 mt-1">
                  <span>
                    Target: <span className="text-slate-800">{totalTiket}</span>
                  </span>
                  <span>
                    Selesai:{" "}
                    <span
                      className={
                        isRacepackMode ? "text-[#1E8E3E]" : "text-[#1A73E8]"
                      }
                    >
                      {totalHadir}
                    </span>
                  </span>
                </div>
                <div
                  className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full opacity-10 ${isRacepackMode ? "bg-[#1E8E3E]" : "bg-[#1A73E8]"}`}
                ></div>
              </div>

              <div className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-sm flex flex-col relative overflow-hidden">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 z-10 text-center">
                  Demografi Tab
                </p>
                <div className="flex-grow w-full relative z-10 -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="name"
                        tick={{
                          fontSize: 9,
                          fontWeight: "bold",
                          fill: "#64748b",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 9,
                          fontWeight: "bold",
                          fill: "#64748b",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f1f5f9" }}
                        contentStyle={{
                          borderRadius: "8px",
                          fontSize: "12px",
                          fontWeight: "bold",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="total"
                        fill={isRacepackMode ? "#FCD116" : "#1A73E8"}
                        radius={[4, 4, 0, 0]}
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* DAFTAR RIWAYAT LIVE */}
            <div className="bg-white border border-slate-200 rounded-[2rem] flex flex-col shadow-sm flex-grow min-h-0 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 p-4 shrink-0 flex justify-between items-center">
                <h3 className="font-black text-xs uppercase tracking-widest text-[#0B2239] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  Live Penyerahan
                </h3>
              </div>
              <div className="flex-grow overflow-y-auto custom-scrollbar p-3">
                <ul className="space-y-2">
                  {daftarHadirLive.slice(0, 50).map((peserta) => {
                    const rawWaktu = isRacepackMode
                      ? peserta.waktuAmbilRacepack
                      : peserta.waktuCheckIn;
                    const waktuFormat = rawWaktu
                      ? new Date(rawWaktu).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-";
                    // Pembedaan Nama untuk Individu vs Komunitas
                    const displayName =
                      participantMode === "individu"
                        ? peserta.namaLengkap
                        : `TIM: ${peserta.komunitas}`;

                    return (
                      <li
                        key={peserta.id}
                        className={`p-3 rounded-xl border flex justify-between items-center transition-all hover:-translate-y-0.5 ${isRacepackMode ? "bg-emerald-50/50 border-emerald-100" : "bg-blue-50/50 border-blue-100"}`}
                      >
                        <div className="overflow-hidden pr-2">
                          <p className="font-black text-sm truncate text-[#0B2239]">
                            {displayName}
                          </p>
                          {isRacepackMode ? (
                            <p className="text-[11px] text-emerald-700 font-bold mt-0.5 tracking-wide">
                              {participantMode === "individu"
                                ? `BIB: ${peserta.nomorBIB || "-"}`
                                : `${peserta.participants?.length || 0} Anggota`}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-500 truncate font-medium mt-0.5">
                              {peserta.fakultas}
                            </p>
                          )}
                          <p className="text-[9px] font-bold mt-1.5 text-slate-500 uppercase tracking-widest flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
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
                            {waktuFormat} WIB
                            <span className="mx-1 opacity-50">•</span>Oleh:{" "}
                            {isRacepackMode
                              ? peserta.adminHandler
                              : peserta.diScanOleh}
                          </p>
                        </div>
                        <div className="text-right shrink-0 flex flex-col gap-1 items-end">
                          <button
                            onClick={() => handleBatalkanHadir(peserta)}
                            className="text-[9px] font-black text-rose-500 bg-white border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition-colors uppercase shadow-sm w-full"
                          >
                            Batal ❌
                          </button>
                        </div>
                      </li>
                    );
                  })}
                  {daftarHadirLive.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                      <div className="text-4xl mb-2">📭</div>
                      <div className="text-center text-slate-400 text-xs font-black uppercase tracking-widest">
                        Belum Ada Data
                      </div>
                    </div>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 🔥 AREA 2: TEMPLATE STRUK THERMAL (HANYA MUNCUL SAAT DI-PRINT) 🔥 */}
      {/* ===================================================================== */}
      {receiptData && (
        <div className="hidden print:block text-black bg-white w-full max-w-[80mm] mx-auto font-mono text-xs leading-snug p-4">
          <div className="text-center mb-6 border-b-2 border-black pb-3">
            <h2 className="font-black text-xl mb-1 uppercase tracking-tight">
              IKA UII DIY RUN {CURRENT_YEAR}
            </h2>
            <p className="font-bold text-sm uppercase">Tanda Terima Racepack</p>
          </div>

          <div className="text-center mb-6">
            {!receiptData.isCommunityMode ? (
              <>
                <p className="text-xs uppercase mb-1">Nomor BIB</p>
                <h1 className="text-6xl font-black leading-none tracking-tighter mb-2">
                  {receiptData.nomorBIB || "-"}
                </h1>
                <h2 className="text-xl font-bold uppercase mt-2 border-y border-dashed border-black py-2">
                  {receiptData.namaBib || receiptData.namaLengkap}
                </h2>
              </>
            ) : (
              <>
                <p className="text-xs uppercase mb-1">Paket Komunitas</p>
                <h1 className="text-3xl font-black leading-none tracking-tighter mb-2 uppercase break-words">
                  {receiptData.komunitas}
                </h1>
                <h2 className="text-sm font-bold uppercase mt-2 border-y border-dashed border-black py-2">
                  {receiptData.participants?.length || 0} ANGGOTA (BIB)
                </h2>
              </>
            )}
          </div>

          <div className="mb-4 space-y-1.5">
            <p className="uppercase font-bold border-b border-black mb-2">
              Detail Pesanan:
            </p>
            {!receiptData.isCommunityMode ? (
              <>
                <div className="flex justify-between">
                  <span>Kategori Lari</span>
                  <span className="font-bold text-right">
                    {receiptData.jarak}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Size Jersey</span>
                  <span className="font-bold text-right text-base">
                    {receiptData.ukuranJersey || "-"}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex justify-between">
                <span>Kapten Tim</span>
                <span className="font-bold text-right text-base">
                  {receiptData.namaKapten}
                </span>
              </div>
            )}
            <div className="flex justify-between mt-2 pt-2 border-t border-dashed border-black">
              <span>Total Nominal</span>
              <span className="font-bold text-right">
                Rp {Number(receiptData.totalTagihan).toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="mt-4 mb-4 space-y-1.5">
            <p className="uppercase font-bold border-b border-black mb-2">
              Status Pengambilan:
            </p>
            <div className="font-bold text-sm break-words">
              [X] Oleh: {receiptData.namaPengambil}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-black space-y-1">
            <div className="flex justify-between">
              <span>Tanggal Pengambilan:</span>
            </div>
            <div className="font-bold mb-2">
              {new Date(
                receiptData.waktuAmbilRacepack || Date.now(),
              ).toLocaleString("id-ID", {
                dateStyle: "long",
                timeStyle: "short",
              })}{" "}
              WIB
            </div>
            <div className="flex justify-between mt-2">
              <span>Nama Petugas:</span>
            </div>
            <div className="font-bold">
              {receiptData.adminHandler || petugasName || "Admin Lapangan"}
            </div>
          </div>

          <div className="text-center mt-10 pt-4 border-t-2 border-black text-[10px]">
            <p className="font-bold uppercase mb-1">Terima Kasih</p>
            <p className="mt-3">&copy; {CURRENT_YEAR} DPW IKA UII DIY</p>
          </div>
        </div>
      )}
    </>
  );
}
