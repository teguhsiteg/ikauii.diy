"use client";

import { useState, useEffect, useRef } from "react";
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

  const [scanMode, setScanMode] = useState<"kamera" | "manual">("kamera");
  const [scanInput, setScanInput] = useState("");
  const [scanMessage, setScanMessage] = useState<{
    type: "success" | "error" | "warning";
    text: string;
    subtext?: string;
  } | null>(null);

  // --- STATE UNTUK MODAL POPUP ---
  const [groupModalId, setGroupModalId] = useState<string | null>(null);
  const [confirmRacepackData, setConfirmRacepackData] = useState<any>(null);
  const [isSubmittingRacepack, setIsSubmittingRacepack] = useState(false);

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
          } catch (e) {}
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
    } catch (e) {
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
    } catch (error: any) {
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
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgendasAndSettings();
  }, [user]);

  useEffect(() => {
    if (!selectedAgenda || !user) return;
    let q;

    if (selectedAgenda.type === "racepack") {
      q = query(
        collection(db, "offline_participants"),
        where("statusPembayaran", "==", "Lunas"),
      );
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
  }, [selectedAgenda, user]);

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
        } catch (error) {
          console.error("Gagal inisiasi kamera");
        }
      }
    };
    startCamera();
    return () => {
      isMounted = false;
      if (scanner) scanner.clear().catch(console.error);
    };
  }, [selectedAgenda, scanMode]);

  // =====================================================================
  // 🔥 PROSES SCAN DINAMIS (HYBRID: URL, ID, BIB, NIK AUTO-DETECT) 🔥
  // =====================================================================
  const processCheckIn = async (rawScannedText: string) => {
    if (
      isProcessingRef.current ||
      groupModalIdRef.current ||
      confirmRacepackData
    )
      return;

    isProcessingRef.current = true;

    // 1. Ekstraksi ID murni (Jika yang di-scan adalah URL QR Code)
    let id = rawScannedText.trim();
    if (id.includes("/verify-ticket/")) {
      const parts = id.split("/verify-ticket/");
      if (parts.length > 1) {
        // Ambil ID-nya saja, buang karakter aneh kalau ada di ujung URL
        id = parts[1].split("?")[0].replace("/", "").trim();
      }
    }

    if (!id) {
      isProcessingRef.current = false;
      return;
    }

    // 2. Cek apakah ID hasil scan/ketikan ada di database lokal
    let peserta = pesertaListRef.current.find((p) => p.id === id);

    if (!peserta) {
      peserta = pesertaListRef.current.find((p) =>
        p.id.toLowerCase().startsWith(id.toLowerCase()),
      );
    }

    // 3. Pencarian khusus untuk Racepack (Admin boleh ketik BIB / NIK)
    if (!peserta && selectedAgenda?.type === "racepack") {
      peserta = pesertaListRef.current.find(
        (p) => p.nik === id || p.nomorBIB === id,
      );
    }

    // JIKA TIDAK KETEMU SAMA SEKALI
    if (!peserta) {
      playBeep("error");
      setScanMessage({
        type: "error",
        text:
          selectedAgenda.type === "racepack"
            ? "Data tidak ditemukan atau status BELUM LUNAS."
            : "Akses Ditolak: Tiket tidak ditemukan.",
      });
      setScanInput("");
      setTimeout(() => {
        setScanMessage(null);
        isProcessingRef.current = false;
      }, 2500);
      return;
    }

    const namaPenjaga = petugasName || "Petugas Gate";

    // ----------------------------------------------------
    // ALUR 1: MODE PENGAMBILAN RACEPACK OFFLINE (POPUP KONFIRMASI)
    // ----------------------------------------------------
    if (selectedAgenda.type === "racepack") {
      if (peserta.isRacepackTaken) {
        playBeep("error");
        const waktu = new Date(peserta.waktuAmbilRacepack).toLocaleTimeString(
          "id-ID",
        );
        setScanMessage({
          type: "warning",
          text: `SUDAH DIAMBIL: ${peserta.namaLengkap} (Pkl ${waktu} oleh ${peserta.adminHandler})`,
        });
        setScanInput("");
        setTimeout(() => {
          setScanMessage(null);
          isProcessingRef.current = false;
        }, 3500);
        return;
      }

      // Tampilkan Modal Konfirmasi Racepack
      playBeep("info");
      setConfirmRacepackData(peserta);
      setScanInput("");
      isProcessingRef.current = false;
      return;
    }

    // ----------------------------------------------------
    // ALUR 2: MODE REGULER (INSTANT SCAN AGENDA BIASA)
    // ----------------------------------------------------
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
      const waktu = new Date(peserta.waktuCheckIn).toLocaleTimeString("id-ID");
      setScanMessage({
        type: "warning",
        text: `Tiket Terpakai: ${peserta.nama} (Hadir pkl ${waktu})`,
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
      setScanMessage({ type: "success", text: `Berhasil: ${peserta.nama}` });
    } catch (err) {
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

  // 🔥 HANDLER EKSEKUSI RACEPACK SETELAH DIKONFIRMASI 🔥
  const executeConfirmRacepack = async () => {
    if (!confirmRacepackData) return;
    setIsSubmittingRacepack(true);
    const peserta = confirmRacepackData;
    const namaPenjaga = petugasName || "Petugas Gate";

    try {
      await updateDoc(doc(db, "offline_participants", peserta.id), {
        isRacepackTaken: true,
        waktuAmbilRacepack: new Date().toISOString(),
        adminHandler: namaPenjaga,
      });

      await addDoc(collection(db, "vr_logs"), {
        type: "resi",
        action: "menyerahkan racepack di lokasi untuk",
        targetName: peserta.namaLengkap,
        adminEmail: namaPenjaga,
        timestamp: Date.now(),
      });

      playBeep("success");
      setScanMessage({
        type: "success",
        text: `BERHASIL SERAHKAN: ${peserta.namaLengkap} (BIB: ${peserta.nomorBIB})`,
      });
    } catch (err) {
      playBeep("error");
      setScanMessage({
        type: "error",
        text: "Koneksi Gagal: Periksa jaringan internet.",
      });
    }

    setIsSubmittingRacepack(false);
    setConfirmRacepackData(null);
    setTimeout(() => {
      setScanMessage(null);
    }, 2500);
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
    } catch (error) {
      alert("Gagal mengupdate data anggota rombongan.");
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
    const namaTarget = isRacepack ? peserta.namaLengkap : peserta.nama;

    if (
      !confirm(
        `Yakin membatalkan status untuk: ${namaTarget}? \nSistem akan mereset status data ini.`,
      )
    )
      return;

    try {
      if (isRacepack) {
        await updateDoc(doc(db, "offline_participants", peserta.id), {
          isRacepackTaken: false,
          waktuAmbilRacepack: null,
          adminHandler: null,
        });
      } else {
        await updateDoc(doc(db, "agenda_peserta", peserta.id), {
          statusCheckIn: false,
          waktuCheckIn: null,
          diScanOleh: null,
          anggotaHadir: [],
        });
      }
    } catch (error) {
      alert("❌ Gagal membatalkan. Cek koneksi internet.");
    }
  };

  // --- RENDERING UI ---
  if (isAuthChecking)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans font-bold">
        Memeriksa Akses...
      </div>
    );

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 font-sans p-4 relative overflow-hidden">
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-4 relative">
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

  // --- STATISTIK DINAMIS ---
  let totalTiket = 0;
  let totalHadir = 0;
  let daftarHadirLive: any[] = [];

  if (selectedAgenda?.type === "racepack") {
    totalTiket = pesertaList.length;
    daftarHadirLive = pesertaList.filter((p) => p.isRacepackTaken);
    totalHadir = daftarHadirLive.length;
  } else {
    totalTiket = pesertaList.reduce(
      (acc, curr) => acc + (Number(curr.jumlahTiket) || 1),
      0,
    );
    daftarHadirLive = pesertaList.filter((p) => p.statusCheckIn);
    totalHadir = daftarHadirLive.reduce(
      (acc, curr) => acc + (Number(curr.jumlahTiket) || 1),
      0,
    );
  }

  if (!selectedAgenda) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
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

  const isRacepackMode = selectedAgenda.type === "racepack";

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 flex flex-col font-sans relative lg:overflow-hidden">
      {/* === 🔥 MODAL KONFIRMASI RACEPACK (OFFLINE RUN) 🔥 === */}
      {confirmRacepackData && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500 rounded-full opacity-50"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-black tracking-tight">
                  Konfirmasi Atribut
                </h3>
                <p className="text-[11px] font-medium text-emerald-100 mt-1 uppercase tracking-widest">
                  Pastikan Barang Sesuai
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl relative z-10 backdrop-blur-sm border border-white/30 shadow-inner">
                📦
              </div>
            </div>

            <div className="p-8">
              <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl mb-8 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white border border-emerald-100 text-[10px] font-black text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  Data Peserta
                </div>

                <div className="text-center mt-3 mb-5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                    Nama Lengkap
                  </p>
                  <p className="text-2xl font-black text-slate-800 leading-tight">
                    {confirmRacepackData.namaLengkap}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100/50 text-center shadow-sm">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                      Nomor BIB
                    </p>
                    <p className="text-3xl font-black text-slate-900">
                      {confirmRacepackData.nomorBIB || "-"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100/50 text-center shadow-sm">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                      Ukuran Jersey
                    </p>
                    <p className="text-3xl font-black text-slate-900">
                      {confirmRacepackData.ukuranJersey || "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-emerald-200/50 text-center">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">
                    Kategori Lari
                  </p>
                  <p className="text-sm font-black text-slate-800">
                    {confirmRacepackData.jarak} -{" "}
                    {confirmRacepackData.paketNama}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmRacepackData(null)}
                  disabled={isSubmittingRacepack}
                  className="w-1/3 bg-slate-100 text-slate-500 font-bold py-3.5 rounded-xl hover:bg-slate-200 hover:text-slate-700 transition-colors text-sm uppercase tracking-widest"
                >
                  Batal
                </button>
                <button
                  onClick={executeConfirmRacepack}
                  disabled={isSubmittingRacepack}
                  className="w-2/3 bg-emerald-600 text-white font-black py-3.5 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmittingRacepack ? (
                    <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    "Serahkan Atribut"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === MODAL POP-UP KHUSUS ROMBONGAN (Hanya untuk Reguler) === */}
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
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in zoom-in-95">
              <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="bg-blue-600 p-5 text-white flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black">Tiket Rombongan</h3>
                    <p className="text-xs font-medium opacity-90 mt-1">
                      Pemesan: {groupPeserta.nama} ({groupPeserta.jumlahTiket}{" "}
                      Tiket)
                    </p>
                  </div>
                  <div className="text-3xl">👥</div>
                </div>
                <div className="p-6">
                  <p className="text-xs font-bold text-slate-500 mb-4 text-center uppercase tracking-widest">
                    Silakan Klik Yang Hadir
                  </p>
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2">
                    {allMembers.map((member, idx) => {
                      const isHadir = hadir.includes(member);
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col gap-2 p-3 rounded-xl border transition-all ${isHadir ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"}`}
                        >
                          <span
                            className={`font-bold text-sm leading-tight ${isHadir ? "text-green-800" : "text-slate-700"}`}
                          >
                            {member}
                          </span>
                          {isHadir ? (
                            <span className="text-[10px] bg-green-200 text-green-800 px-3 py-1 rounded-full font-black w-fit uppercase tracking-widest">
                              ✅ MASUK
                            </span>
                          ) : (
                            <button
                              onClick={() =>
                                markGroupMember(groupPeserta, member)
                              }
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-xs font-black w-full shadow-sm uppercase tracking-widest transition-colors"
                            >
                              HADIRKAN ORANG INI &rarr;
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={closeGroupModal}
                    className="mt-6 w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-sm uppercase tracking-widest transition-colors"
                  >
                    TUTUP & LANJUT SCAN
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

      {/* HEADER SCANNER */}
      <div
        className={`border-b p-3 px-4 md:px-6 flex flex-col md:flex-row justify-between items-center shadow-sm shrink-0 gap-3 transition-colors duration-500 ${isRacepackMode ? "bg-emerald-900 text-white border-emerald-800" : "bg-white"}`}
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
            className={`text-xs mt-1 ${isRacepackMode ? "text-emerald-200" : "text-slate-500"}`}
          >
            Petugas: <span className="font-bold">{petugasName}</span>
          </p>
        </div>
        <div className="hidden md:flex items-center justify-center gap-4">
          <div className="flex flex-col items-center">
            <span
              className={`text-2xl font-black font-mono tracking-widest px-4 py-1 rounded-t-lg border-b-2 ${isRacepackMode ? "bg-emerald-800 text-emerald-100 border-emerald-600" : "bg-blue-50 text-blue-900 border-blue-200"}`}
            >
              {formatJam}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isRacepackMode ? "text-emerald-300" : "text-slate-500"}`}
            >
              {formatTanggal}
            </span>
          </div>
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-lg border transition-colors ${isRacepackMode ? "bg-emerald-800 border-emerald-700 text-emerald-100 hover:bg-emerald-700" : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"}`}
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
        <div
          className={`flex gap-4 p-2 rounded-lg border w-full md:w-auto justify-center ${isRacepackMode ? "bg-emerald-800 border-emerald-700 text-emerald-50" : "bg-slate-100 border-slate-200"}`}
        >
          <div className="text-center px-2">
            <span
              className={`block text-[9px] uppercase font-bold ${isRacepackMode ? "text-emerald-300" : "text-slate-500"}`}
            >
              {isRacepackMode ? "Target" : "Total"}
            </span>
            <span className="font-black text-lg">{totalTiket}</span>
          </div>
          <div
            className={`w-px ${isRacepackMode ? "bg-emerald-600" : "bg-slate-300"}`}
          ></div>
          <div className="text-center px-2">
            <span
              className={`block text-[9px] uppercase font-bold ${isRacepackMode ? "text-emerald-300" : "text-slate-500"}`}
            >
              {isRacepackMode ? "Selesai" : "Hadir"}
            </span>
            <span
              className={`font-black text-lg ${isRacepackMode ? "text-white" : "text-green-600"}`}
            >
              {totalHadir}
            </span>
          </div>
        </div>
      </div>

      {/* AREA KERJA */}
      <div className="flex flex-col lg:flex-row gap-4 flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full min-h-0">
        {/* KOLOM SCANNER */}
        <div className="w-full lg:w-2/3 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-auto lg:h-full min-h-0">
          <div className="flex bg-slate-50 border-b p-2 gap-2 shrink-0">
            <button
              onClick={() => setScanMode("kamera")}
              className={`flex-1 py-2 text-xs font-bold rounded uppercase ${scanMode === "kamera" ? (isRacepackMode ? "bg-emerald-600 text-white shadow-sm" : "bg-blue-600 text-white shadow-sm") : "text-slate-500 hover:bg-slate-200"}`}
            >
              Kamera
            </button>
            <button
              onClick={() => setScanMode("manual")}
              className={`flex-1 py-2 text-xs font-bold rounded uppercase ${scanMode === "manual" ? (isRacepackMode ? "bg-emerald-600 text-white shadow-sm" : "bg-blue-600 text-white shadow-sm") : "text-slate-500 hover:bg-slate-200"}`}
            >
              Ketik Manual
            </button>
          </div>

          {scanMessage && (
            <div
              className={`p-4 text-center border-b shrink-0 ${scanMessage.type === "success" ? "bg-green-50 border-green-200" : scanMessage.type === "warning" ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}
            >
              <span
                className={`text-lg font-black ${scanMessage.type === "success" ? "text-green-700" : scanMessage.type === "warning" ? "text-yellow-700" : "text-red-700"}`}
              >
                {scanMessage.text}
              </span>
            </div>
          )}

          <div className="flex-grow bg-white relative flex flex-col items-center justify-center min-h-[400px] lg:min-h-0 overflow-y-auto">
            {scanMode === "kamera" ? (
              <div
                id="reader"
                className={`w-full max-w-lg mx-auto [&>div]:border-none [&_video]:object-cover text-slate-800 [&_select]:bg-slate-50 [&_select]:border [&_select]:border-slate-300 [&_select]:text-slate-800 [&_select]:px-3 [&_select]:py-2 [&_select]:rounded-lg [&_button]:text-white [&_button]:font-bold [&_button]:px-5 [&_button]:py-2.5 [&_button]:rounded-lg [&_button]:mt-3 hover:[&_button]:opacity-90 [&_a]:underline mt-4 ${isRacepackMode ? "[&_button]:bg-emerald-600 [&_a]:text-emerald-600" : "[&_button]:bg-blue-600 [&_a]:text-blue-600"}`}
              ></div>
            ) : (
              <form
                onSubmit={handleManualSubmit}
                className="w-full max-w-sm p-6"
              >
                <input
                  type="text"
                  autoFocus
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  className={`w-full text-center font-bold text-2xl p-4 rounded-xl bg-slate-50 border-2 focus:outline-none mb-4 uppercase ${isRacepackMode ? "focus:border-emerald-500" : "focus:border-blue-500"}`}
                  placeholder={
                    isRacepackMode ? "Ketik BIB / NIK..." : "Ketik ID Tiket..."
                  }
                />
                <button
                  type="submit"
                  className={`w-full text-white font-black py-4 rounded-xl uppercase tracking-widest text-sm transition-colors shadow-md ${isRacepackMode ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20"}`}
                >
                  {isRacepackMode ? "Cari Data" : "Proses Hadir"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* KOLOM RIWAYAT TERKINI */}
        <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-xl flex flex-col shadow-sm h-[500px] lg:h-full min-h-0">
          <div className="bg-slate-50 border-b p-3 shrink-0 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase text-slate-700">
              {isRacepackMode ? "Riwayat Distribusi" : "Riwayat Terkini"}
            </h3>
            <span className="text-[10px] font-bold bg-white text-slate-500 px-2 py-1 rounded border border-slate-200">
              {daftarHadirLive.length} Data
            </span>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar p-2">
            <ul className="space-y-2">
              {daftarHadirLive.slice(0, 50).map((peserta) => (
                <li
                  key={peserta.id}
                  className={`p-3 rounded-lg border flex justify-between items-center transition-colors ${isRacepackMode ? "bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50" : "hover:bg-slate-50 border-slate-100"}`}
                >
                  <div className="overflow-hidden pr-2">
                    <p className="font-bold text-sm truncate text-slate-800">
                      {isRacepackMode ? peserta.namaLengkap : peserta.nama}
                    </p>

                    {isRacepackMode ? (
                      <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                        BIB: {peserta.nomorBIB || "-"} | Size:{" "}
                        {peserta.ukuranJersey}
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-500 truncate">
                        {peserta.fakultas}
                      </p>
                    )}

                    <p className="text-[9px] font-bold mt-1 text-slate-400">
                      Oleh:{" "}
                      {isRacepackMode
                        ? peserta.adminHandler
                        : peserta.diScanOleh}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {!isRacepackMode &&
                      (peserta.tipeDaftar === "Kelompok" ||
                        Number(peserta.jumlahTiket) > 1) && (
                        <span className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0.5 rounded font-black border border-yellow-200 block mb-1 w-fit ml-auto">
                          ROMBONGAN
                        </span>
                      )}
                    <button
                      onClick={() => handleBatalkanHadir(peserta)}
                      className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded hover:bg-red-500 hover:text-white transition-colors uppercase mt-1 shadow-sm"
                    >
                      Batal ❌
                    </button>
                  </div>
                </li>
              ))}
              {daftarHadirLive.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs font-bold">
                  Belum ada data.
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
