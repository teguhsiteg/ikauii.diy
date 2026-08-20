"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  addDoc,
  deleteDoc,
  writeBatch,
} from "firebase/firestore";
import * as XLSX from "xlsx";

// --- SVG Icons ---
const IconIdentity = () => (
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
      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
    />
  </svg>
);
const IconTimer = () => (
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
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconGift = () => (
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
);
const IconBroadcast = () => (
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
      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);
const IconExternal = () => (
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
);
const IconBox = () => (
  <svg
    className="w-5 h-5 text-amber-500"
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
);
const IconUsers = () => (
  <svg
    className="w-5 h-5 text-[#1A73E8]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
    />
  </svg>
);
const IconTrophy = () => (
  <svg
    className="w-5 h-5 text-[#D4AF37]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);
const IconLink = () => (
  <svg
    className="w-5 h-5 text-[#1A73E8]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);
const IconTrash = () => (
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
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const colorThemes = [
  {
    border: "border-blue-200",
    bgBlur: "bg-blue-50",
    hoverBgBlur: "group-hover:bg-blue-100",
    textMain: "text-[#152B5B]",
    textSub: "text-[#1A73E8]",
    btnBg: "bg-[#1A73E8]",
    btnHover: "hover:bg-[#1557b0]",
    inputFocus: "focus:border-[#1A73E8]",
  },
  {
    border: "border-purple-200",
    bgBlur: "bg-purple-50",
    hoverBgBlur: "group-hover:bg-purple-100",
    textMain: "text-purple-900",
    textSub: "text-purple-600",
    btnBg: "bg-purple-600",
    btnHover: "hover:bg-purple-700",
    inputFocus: "focus:border-purple-500",
  },
  {
    border: "border-emerald-200",
    bgBlur: "bg-emerald-50",
    hoverBgBlur: "group-hover:bg-emerald-100",
    textMain: "text-emerald-900",
    textSub: "text-emerald-600",
    btnBg: "bg-emerald-600",
    btnHover: "hover:bg-emerald-700",
    inputFocus: "focus:border-emerald-500",
  },
  {
    border: "border-orange-200",
    bgBlur: "bg-orange-50",
    hoverBgBlur: "group-hover:bg-orange-100",
    textMain: "text-orange-900",
    textSub: "text-orange-600",
    btnBg: "bg-orange-500",
    btnHover: "hover:bg-orange-600",
    inputFocus: "focus:border-orange-500",
  },
];

export default function RaceManagementPage() {
  const [activeTab, setActiveTab] = useState("timing");
  const [currentTime, setCurrentTime] = useState(new Date());

  // State Data & Settings
  const [settings, setSettings] = useState<any>({});
  const [offlineParticipants, setOfflineParticipants] = useState<any[]>([]);
  const [vrParticipants, setVrParticipants] = useState<any[]>([]);
  const [finishers, setFinishers] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [prizeList, setPrizeList] = useState<any[]>([]);

  // State Jarak Dinamis
  const [distances, setDistances] = useState<string[]>([]);
  const [cotInputs, setCotInputs] = useState<Record<string, string>>({});

  // State Peserta Manual (Untuk Doorprize)
  const [manualParticipants, setManualParticipants] = useState<any[]>([]);
  const [manualInput, setManualInput] = useState({
    nama: "",
    bib: "",
    kategori: "Umum",
  });

  // State Form & UI
  const [bibInput, setBibInput] = useState("");
  const [selectedPrizeId, setSelectedPrizeId] = useState("");
  const [filterDoorprize, setFilterDoorprize] = useState("all");
  const [manualPrize, setManualPrize] = useState({
    namaHadiah: "",
    kategori: "Umum",
    jumlah: 1,
  });
  const [isSpinning, setIsSpinning] = useState(false);

  const [, setMessage] = useState({ type: "", text: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const bibInputRef = useRef<HTMLInputElement>(null);

  // State Identitas Event
  const [identityForm, setIdentityForm] = useState({
    eventName: "IKA UII DIY RUN 2026",
    eventSubtext: "Official Timing System",
    eventLogo: "/logo-dpp-ika.png",
  });

  // 🔥 CUSTOM CONFIRMATION MODAL STATE 🔥
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
    onConfirm: () => {},
    confirmText: "Ya, Lanjutkan",
  });

  // Live Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatJam = currentTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: "", text: "" }), 3500);
  };

  // 🔥 PERBAIKAN 1: Query Firestore yang lebih robust untuk mendeteksi finisher
  useEffect(() => {
    // Ubah dari != null menjadi > 0 agar index firestore lebih akurat menarik data baru
    const q = query(
      collection(db, "offline_participants"),
      where("waktuFinish", ">", 0),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const liveFinishers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      liveFinishers.sort((a: any, b: any) => b.waktuFinish - a.waktuFinish);
      setFinishers(liveFinishers);
    });
    return () => unsub();
  }, []);

  // --- 🔥 SINKRONISASI SETTING & JARAK DINAMIS 🔥 ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "virtual_run"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);
        if (data.distances) {
          setDistances(data.distances);
        }
        
        // Sync local identity form if not actively typing
        setIdentityForm((prev) => ({
          ...prev,
          eventName: data.eventName || "IKA UII DIY RUN 2026",
          eventSubtext: data.eventSubtext || "Official Timing System",
          eventLogo: data.eventLogo || "/logo-dpp-ika.png",
        }));

        let availDistances: string[] = [];
        if (data.offlinePackages && data.offlinePackages.length > 0) {
          availDistances = Array.from(
            new Set(data.offlinePackages.map((p: any) => p.jarak)),
          ) as string[];
        } else if (data.virtualPackages && data.virtualPackages.length > 0) {
          availDistances = Array.from(
            new Set(data.virtualPackages.map((p: any) => p.jarak)),
          ) as string[];
        }
        setDistances(availDistances);

        setCotInputs((prev) => {
          const newCot = { ...prev };
          availDistances.forEach((dist) => {
            const safeDistKey = dist.replace(/\./g, "_");
            if (!newCot[dist])
              newCot[dist] = data[`cot${safeDistKey}`] || "120";
          });
          return newCot;
        });
      }
    });
    return () => unsub();
  }, []);

  const syncPeserta = async () => {
    setIsProcessing(true);
    try {
      const snapOffline = await getDocs(collection(db, "offline_participants"));
      const allOffline = snapOffline.docs.map((d) => ({
        id: d.id,
        source: "offline",
        ...d.data(),
      }));
      const lunasOffline = allOffline.filter((p: any) => {
        const status = (
          p.statusPembayaran ||
          p.statusBayar ||
          p.status ||
          ""
        ).toLowerCase();
        return (
          status === "lunas" || status === "sukses" || status === "success"
        );
      });
      setOfflineParticipants(lunasOffline);

      const snapVR = await getDocs(collection(db, "vr_participants"));
      const allVR = snapVR.docs.map((d) => ({
        id: d.id,
        source: "vr",
        ...d.data(),
      }));
      const lunasVR = allVR.filter((p: any) => {
        const status = (
          p.statusPembayaran ||
          p.statusBayar ||
          p.status ||
          ""
        ).toLowerCase();
        return (
          status === "lunas" || status === "sukses" || status === "success"
        );
      });
      setVrParticipants(lunasVR);
      showMsg("success", "Sinkronisasi data kolam berhasil.");
    } catch {
      showMsg("error", "Gagal menarik data dari database.");
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    syncPeserta();
  }, []);

  useEffect(() => {
    const allWon = [
      ...offlineParticipants,
      ...vrParticipants,
      ...manualParticipants,
    ]
      .filter((p) => p.doorprizeWon)
      .sort((a, b) => b.waktuMenang - a.waktuMenang);
    setWinners(allWon);
  }, [offlineParticipants, vrParticipants, manualParticipants]);

  const candidates = useMemo(() => {
    const allCandidates = [
      ...offlineParticipants,
      ...vrParticipants,
      ...manualParticipants,
    ].filter((p) => !p.doorprizeWon);
    switch (filterDoorprize) {
      case "vr":
        return allCandidates.filter((p) => p.source === "vr");
      case "offline":
        return allCandidates.filter(
          (p) => p.source === "offline" || p.source === "manual",
        );
      case "finish":
        return allCandidates.filter(
          (p) =>
            (p.source === "offline" && p.waktuFinish) || p.source === "manual",
        );
      case "alumni":
        return allCandidates.filter(
          (p) =>
            (
              p.tipePeserta ||
              p.kategoriPeserta ||
              p.kategori ||
              ""
            ).toLowerCase() === "alumni",
        );
      case "umum":
        return allCandidates.filter(
          (p) =>
            (
              p.tipePeserta ||
              p.kategoriPeserta ||
              p.kategori ||
              ""
            ).toLowerCase() !== "alumni",
        );
      default:
        return allCandidates;
    }
  }, [
    filterDoorprize,
    offlineParticipants,
    vrParticipants,
    manualParticipants,
  ]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "doorprize_items"), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a: any, b: any) => a.createdAt - b.createdAt);
      setPrizeList(data);
    });
    return () => unsub();
  }, []);

  const downloadPrizeTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { Nama_Hadiah: "Sepeda Listrik", Kategori: "Hadiah Utama", Jumlah: 2 },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hadiah");
    XLSX.writeFile(wb, "Template_Hadiah_Doorprize.xlsx");
  };

  const handleImportPrizes = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (evt: any) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        let count = 0;
        for (const row of data as any[]) {
          if (row.Nama_Hadiah && row.Jumlah) {
            await addDoc(collection(db, "doorprize_items"), {
              namaHadiah: row.Nama_Hadiah,
              kategori: row.Kategori || "Umum",
              jumlah: Number(row.Jumlah),
              terundi: 0,
              createdAt: Date.now(),
            });
            count++;
          }
        }
        showMsg("success", `${count} Hadiah diimport.`);
      } catch {
        showMsg("error", "Gagal import Excel.");
      } finally {
        setIsProcessing(false);
        e.target.value = null;
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleAddManualPrize = async () => {
    if (!manualPrize.namaHadiah || manualPrize.jumlah < 1) {
      showMsg("error", "Nama hadiah/jumlah tidak valid.");
      return;
    }
    setIsProcessing(true);
    try {
      await addDoc(collection(db, "doorprize_items"), {
        namaHadiah: manualPrize.namaHadiah,
        kategori: manualPrize.kategori,
        jumlah: Number(manualPrize.jumlah),
        terundi: 0,
        createdAt: Date.now(),
      });
      showMsg("success", "Hadiah manual ditambahkan.");
      setManualPrize({ namaHadiah: "", kategori: "Umum", jumlah: 1 });
    } catch {
      showMsg("error", "Gagal menambahkan hadiah.");
    }
    setIsProcessing(false);
  };

  const handleClearPrizes = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Semua Hadiah?",
      message:
        "Tindakan ini akan mengosongkan seluruh database hadiah doorprize. Lanjutkan?",
      type: "danger",
      confirmText: "Ya, Kosongkan",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsProcessing(true);
        try {
          await Promise.all(
            prizeList.map((p) => deleteDoc(doc(db, "doorprize_items", p.id))),
          );
          setSelectedPrizeId("");
          showMsg("success", "Database hadiah dikosongkan.");
        } catch {
          showMsg("error", "Gagal menghapus hadiah.");
        }
        setIsProcessing(false);
      },
    });
  };

  const handleAddManualParticipant = () => {
    if (!manualInput.nama) {
      showMsg("error", "Nama wajib diisi!");
      return;
    }
    const newParticipant = {
      id: `manual_${Date.now()}`,
      source: "manual",
      namaLengkap: manualInput.nama,
      nomorBIB: manualInput.bib || "TAMU",
      kategoriPeserta: manualInput.kategori,
      doorprizeWon: null,
    };
    setManualParticipants([...manualParticipants, newParticipant]);
    setManualInput({ nama: "", bib: "", kategori: "Umum" });
    showMsg("success", `${manualInput.nama} masuk ke Kolam Undian!`);
  };

  const handleStartRace = (dist: string, withCountdown: boolean = false) => {
    const safeDistKey = dist.replace(/\./g, "_");
    setConfirmDialog({
      isOpen: true,
      title: `Start Race ${dist}?`,
      message: withCountdown 
        ? `Kategori ${dist} akan dimulai dalam 10 DETIK (Countdown di layar publik). Lanjutkan?` 
        : `Timer untuk kategori jarak ${dist} akan mulai secara instan. Lanjutkan?`,
      type: "info",
      confirmText: "Ya, Start!",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          await updateDoc(doc(db, "settings", "virtual_run"), {
            [`gunTime${safeDistKey}`]: withCountdown ? Date.now() + 10000 : Date.now(),
          });
          showMsg("success", `RACE ${dist} DIMULAI!`);
        } catch {
          showMsg("error", "Gagal memulai race.");
        }
      },
    });
  };

  const handleResetGunTime = (dist: string) => {
    const safeDistKey = dist.replace(/\./g, "_");
    setConfirmDialog({
      isOpen: true,
      title: `Reset Timer ${dist}?`,
      message: `Ini akan menghentikan dan mereset waktu berjalan untuk kategori ${dist}. Lanjutkan?`,
      type: "danger",
      confirmText: "Ya, Reset",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          await updateDoc(doc(db, "settings", "virtual_run"), {
            [`gunTime${safeDistKey}`]: null,
          });
          showMsg("success", `Timer ${dist} direset.`);
        } catch {
          showMsg("error", "Gagal mereset timer.");
        }
      },
    });
  };

  const handleUpdateCOT = async (dist: string) => {
    const safeDistKey = dist.replace(/\./g, "_");
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        [`cot${safeDistKey}`]: Number(cotInputs[dist]),
      });
      showMsg("success", `COT ${dist} disimpan.`);
    } catch {}
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        eventName: identityForm.eventName,
        eventSubtext: identityForm.eventSubtext,
        eventLogo: identityForm.eventLogo,
      });
      showMsg("success", "Identitas Event Berhasil Disimpan!");
    } catch {
      showMsg("error", "Gagal menyimpan identitas event.");
    }
    setIsProcessing(false);
  };

  const handleSubmitFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanBib = bibInput.trim().toUpperCase();
    if (!cleanBib) return;
    setIsProcessing(true);

    try {
      // 🔥 PERBAIKAN: Gunakan Query Spesifik agar tidak menarik seluruh data (Hemat Ribuan Read)
      let peserta: any = null;

      // 1. Coba cari berdasarkan nomorBIB (String)
      let qBib = query(
        collection(db, "offline_participants"),
        where("nomorBIB", "==", cleanBib)
      );
      let snapBib = await getDocs(qBib);

      // 2. Coba cari berdasarkan nomorBIB (Number) jika gagal
      if (snapBib.empty && !isNaN(Number(cleanBib))) {
        qBib = query(
          collection(db, "offline_participants"),
          where("nomorBIB", "==", Number(cleanBib))
        );
        snapBib = await getDocs(qBib);
      }

      // 3. Coba cari berdasarkan namaBib jika masih gagal
      if (snapBib.empty) {
        qBib = query(
          collection(db, "offline_participants"),
          where("namaBib", "==", cleanBib)
        );
        snapBib = await getDocs(qBib);
      }

      if (!snapBib.empty) {
        peserta = { id: snapBib.docs[0].id, ...snapBib.docs[0].data() };
      }

      if (!peserta) {
        showMsg(
          "error",
          `BIB ${cleanBib} tidak valid / belum terdaftar lunas!`,
        );
        setIsProcessing(false);
        setBibInput("");
        return;
      }
      if (peserta.waktuFinish) {
        showMsg("error", `BIB ${cleanBib} sudah terdaftar finish sebelumnya!`);
        setIsProcessing(false);
        setBibInput("");
        return;
      }

      const safeDistKey = peserta.jarak.replace(/\./g, "_");
      const gunTime = settings[`gunTime${safeDistKey}`];

      if (!gunTime) {
        showMsg(
          "error",
          `Race ${peserta.jarak} belum dimulai! Tekan tombol START dulu.`,
        );
        setIsProcessing(false);
        setBibInput("");
        return;
      }

      const nowTimestamp = Date.now();
      const calculatedDurationMs = nowTimestamp - gunTime;

      const cotLimitMinutes = settings[`cot${safeDistKey}`] || 120;
      const calculatedDurationMinutes = calculatedDurationMs / 60000;
      const overCOT = calculatedDurationMinutes > cotLimitMinutes;

      // Hitung rank berdasarkan data realtime finishers (Zero Read Cost)
      const sameCategoryFinishers = finishers.filter(
        (p: any) => p.jarak === peserta.jarak,
      );
      const rankKategori = sameCategoryFinishers.length + 1;

      await updateDoc(doc(db, "offline_participants", peserta.id), {
        waktuFinish: nowTimestamp,
        netTimeMs: calculatedDurationMs,
        isOverCOT: overCOT,
        rankKategori: rankKategori,
        activeBibCheck: "",
      });

      await updateDoc(doc(db, "settings", "virtual_run"), {
        activeBibCheck: cleanBib,
      });

      showMsg(
        "success",
        `BERHASIL FINISH: P peringkat ${rankKategori} [${peserta.jarak}] - BIB ${cleanBib}`,
      );
    } catch {
      showMsg("error", "Gagal menyimpan detail waktu finish.");
    } finally {
      setBibInput("");
      setIsProcessing(false);
      setTimeout(() => bibInputRef.current?.focus(), 100);
    }
  };

  const handleResetLeaderboard = () => {
    setConfirmDialog({
      isOpen: true,
      title: "KOSONGKAN SELURUH LEADERBOARD?",
      message:
        "Tindakan ini akan menghapus data Waktu Finish, Durasi Net Time, dan Rangking seluruh pelari secara permanen dari database. Data pendaftaran peserta tidak akan terhapus. Lanjutkan?",
      type: "danger",
      confirmText: "Ya, Hapus Semua Catatan",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        setIsProcessing(true);
        try {
          const snap = await getDocs(collection(db, "offline_participants"));
          const batch = writeBatch(db);
          let count = 0;

          snap.docs.forEach((document) => {
            const data = document.data();
            if (
              data.waktuFinish !== undefined ||
              data.netTimeMs !== undefined
            ) {
              const docRef = doc(db, "offline_participants", document.id);
              batch.update(docRef, {
                waktuFinish: null,
                netTimeMs: null,
                isOverCOT: null,
                rankKategori: null,
              });
              count++;
            }
          });

          if (count > 0) {
            await batch.commit();
          }

          await updateDoc(doc(db, "settings", "virtual_run"), {
            activeBibCheck: "",
          });

          setFinishers([]);
          showMsg(
            "success",
            `Leaderboard berhasil dibersihkan! ${count} Catatan pelari direset.`,
          );
        } catch {
          showMsg("error", "Gagal mereset database klasemen.");
        } finally {
          setIsProcessing(false);
        }
      },
    });
  };

  // 🔥 PERBAIKAN 2: Logic formatter waktu yang kebal falsy values
  const formatDuration = (start: number, end: number) => {
    if (
      start === null ||
      start === undefined ||
      end === null ||
      end === undefined
    )
      return "--:--:--";
    const diffMs = end - start;
    if (diffMs < 0) return "00:00:00";
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRemoteDoorprize = async (action: "idle" | "spin" | "stop") => {
    if (action === "idle") {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        doorprizeSignal: {
          action: "idle",
          prize: "",
          winnerName: "",
          winnerBib: "",
        },
      });
      return;
    }
    const selectedPrize = prizeList.find((p) => p.id === selectedPrizeId);
    if (action === "spin" && !selectedPrize) {
      showMsg("error", "Pilih Hadiah dari Dropdown!");
      return;
    }
    try {
      if (candidates.length === 0) {
        showMsg("error", "Tidak ada kandidat tersisa!");
        return;
      }
      if ((selectedPrize.terundi || 0) >= selectedPrize.jumlah) {
        showMsg("error", "Kuota hadiah habis!");
        return;
      }
      if (action === "spin") {
        setIsSpinning(true);
        await updateDoc(doc(db, "settings", "virtual_run"), {
          doorprizeSignal: {
            action: "spin",
            prize: selectedPrize.namaHadiah,
            winnerName: "",
            winnerBib: "",
          },
        });
      } else if (action === "stop") {
        const winnerIndex = Math.floor(Math.random() * candidates.length);
        const selectedWinner = candidates[winnerIndex];

        if (selectedWinner.source === "manual") {
          setManualParticipants((prev) =>
            prev.map((p) =>
              p.id === selectedWinner.id
                ? {
                    ...p,
                    doorprizeWon: selectedPrize.namaHadiah,
                    waktuMenang: Date.now(),
                  }
                : p,
            ),
          );
        } else {
          const collectionName =
            selectedWinner.source === "offline"
              ? "offline_participants"
              : "vr_participants";
          await updateDoc(doc(db, collectionName, selectedWinner.id), {
            doorprizeWon: selectedPrize.namaHadiah,
            waktuMenang: Date.now(),
          });
        }

        await updateDoc(doc(db, "doorprize_items", selectedPrize.id), {
          terundi: (selectedPrize.terundi || 0) + 1,
        });

        const namaTampil = selectedWinner.namaLengkap || selectedWinner.nama;
        const bibTampil =
          selectedWinner.nomorBIB ||
          selectedWinner.namaBib ||
          selectedWinner.bib ||
          "-";

        await updateDoc(doc(db, "settings", "virtual_run"), {
          doorprizeSignal: {
            action: "winner",
            winnerName: namaTampil,
            winnerBib: bibTampil,
            prize: selectedPrize.namaHadiah,
          },
        });

        showMsg("success", `Pemenang: ${namaTampil}`);
        if ((selectedPrize.terundi || 0) + 1 >= selectedPrize.jumlah)
          setSelectedPrizeId("");
        setIsSpinning(false);
      }
    } catch {
      showMsg("error", "Gagal memproses undian.");
      setIsSpinning(false);
    }
  };

  const handleCancelWinner = (peserta: any) => {
    setConfirmDialog({
      isOpen: true,
      title: "Batalkan Pemenang?",
      message: `Apakah Anda yakin ingin membatalkan kemenangan ${peserta.namaLengkap || peserta.nama}? Status hadiah akan dikembalikan.`,
      type: "danger",
      confirmText: "Ya, Batalkan",
      onConfirm: async () => {
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          if (peserta.source === "manual") {
            setManualParticipants((prev) =>
              prev.map((p) =>
                p.id === peserta.id
                  ? { ...p, doorprizeWon: null, waktuMenang: null }
                  : p,
              ),
            );
          } else {
            const collectionName =
              peserta.source === "offline"
                ? "offline_participants"
                : "vr_participants";
            await updateDoc(doc(db, collectionName, peserta.id), {
              doorprizeWon: null,
              waktuMenang: null,
            });
          }
          const prize = prizeList.find(
            (pr) => pr.namaHadiah === peserta.doorprizeWon,
          );
          if (prize && prize.terundi > 0) {
            await updateDoc(doc(db, "doorprize_items", prize.id), {
              terundi: prize.terundi - 1,
            });
          }
          showMsg("success", "Kemenangan dibatalkan.");
        } catch {
          showMsg("error", "Gagal membatalkan.");
        }
      },
    });
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    await updateDoc(doc(db, "settings", "virtual_run"), { [key]: value });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-100">
      {/* 🔥 CUSTOM MODAL KONFIRMASI (Bisa Dipakai Di Semua Fitur) 🔥 */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div
              className={`p-6 text-center border-b border-slate-100 ${confirmDialog.type === "danger" ? "bg-rose-50" : "bg-blue-50"}`}
            >
              <div
                className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-3 shadow-sm border bg-white ${confirmDialog.type === "danger" ? "text-rose-500 border-rose-200" : "text-[#1A73E8] border-blue-200"}`}
              >
                {confirmDialog.type === "danger" ? (
                  <IconTrash />
                ) : (
                  <IconTimer />
                )}
              </div>
              <h3 className="text-lg font-black text-slate-800 tracking-tight">
                {confirmDialog.title}
              </h3>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setConfirmDialog({ ...confirmDialog, isOpen: false })
                  }
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-colors text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDialog.onConfirm}
                  className={`w-full font-bold py-3 rounded-xl transition-colors text-white shadow-md text-sm ${confirmDialog.type === "danger" ? "bg-rose-500 hover:bg-rose-600" : "bg-[#1A73E8] hover:bg-[#1557b0]"}`}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER BAR */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0 z-20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-[#1A73E8] shadow-[0_0_10px_rgba(26,115,232,0.5)] animate-pulse"></div>
          <h1 className="text-xl font-black text-[#152B5B] tracking-widest uppercase">
            Live Control Room
          </h1>
        </div>
        <div className="font-mono text-sm font-bold tracking-widest text-[#152B5B] bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
          {formatJam}
        </div>
      </header>

      {/* TABS NAVIGATION */}
      <nav className="flex gap-2 px-8 pt-6 shrink-0 border-b border-slate-200 bg-white">
        {[
          { id: "timing", icon: <IconTimer />, label: "Finish Line & COT" },
          { id: "doorprize", icon: <IconGift />, label: "Studio Doorprize" },
          { id: "broadcast", icon: <IconBroadcast />, label: "Broadcasting" },
          { id: "identity", icon: <IconIdentity />, label: "Identitas Event" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3.5 text-sm font-bold uppercase tracking-wider transition-all border-b-[3px] ${activeTab === tab.id ? "border-[#1A73E8] text-[#1A73E8] bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* TABS CONTENT */}
      <main className="flex-grow p-8 overflow-hidden flex flex-col">
        {/* ============================================================== */}
        {/* TAB 4: IDENTITAS EVENT */}
        {/* ============================================================== */}
        {activeTab === "identity" && (
          <div className="max-w-4xl mx-auto w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-xl font-black text-[#152B5B] uppercase tracking-widest border-b border-slate-100 pb-4 mb-6 flex items-center gap-2">
                <IconIdentity /> Identitas Tampilan Publik
              </h2>
              <form onSubmit={handleSaveIdentity} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Nama Event (Judul Utama)
                  </label>
                  <input
                    type="text"
                    value={identityForm.eventName}
                    onChange={(e) => setIdentityForm({...identityForm, eventName: e.target.value})}
                    placeholder="Contoh: IKA UII DIY RUN 2026"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1">Tampil paling besar di bagian atas Race Clock.</p>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    Subteks (Deskripsi Kecil)
                  </label>
                  <input
                    type="text"
                    value={identityForm.eventSubtext}
                    onChange={(e) => setIdentityForm({...identityForm, eventSubtext: e.target.value})}
                    placeholder="Contoh: Official Timing System"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1">Tulisan kecil di bawah judul utama.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
                    URL Logo Event (Image URL / Path)
                  </label>
                  <input
                    type="text"
                    value={identityForm.eventLogo}
                    onChange={(e) => setIdentityForm({...identityForm, eventLogo: e.target.value})}
                    placeholder="Contoh: https://link-ke-foto.com/logo.png"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1A73E8] transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1">Bisa berupa link URL langsung dari Cloudinary/Hosting Anda, atau biarkan <code>/logo-dpp-ika.png</code> untuk logo bawaan.</p>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="bg-[#1A73E8] hover:bg-[#1557b0] text-white font-black px-8 py-4 rounded-xl uppercase tracking-widest shadow-md transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? "Menyimpan..." : "Simpan Identitas Event"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: TIMING & FINISH LINE */}
        {/* ============================================================== */}
        {activeTab === "timing" && (
          <div className="h-full flex flex-col gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shrink-0">
              {distances.map((dist, index) => {
                const theme = colorThemes[index % colorThemes.length];
                const safeDistKey = dist.replace(/\./g, "_");
                const gunTime = settings[`gunTime${safeDistKey}`];
                const cotValue =
                  cotInputs[dist] || settings[`cot${safeDistKey}`] || "120";

                return (
                  <div
                    key={dist}
                    className={`bg-white border ${theme.border} rounded-2xl p-6 flex flex-col gap-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 ${theme.bgBlur} rounded-full blur-2xl transition-all ${theme.hoverBgBlur}`}
                    ></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex-grow">
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          KATEGORI {dist}
                        </h3>
                        {gunTime ? (
                          <>
                            <div
                              className={`text-4xl md:text-5xl font-black font-mono ${theme.textMain} mt-2 tracking-tight`}
                            >
                              {formatDuration(gunTime, currentTime.getTime())}
                            </div>
                            <div
                              className={`text-xs font-bold ${theme.textSub} mt-1`}
                            >
                              Start:{" "}
                              {new Date(gunTime).toLocaleTimeString("id-ID")}
                            </div>
                          </>
                        ) : (
                          <div
                            className={`text-sm font-bold ${theme.textSub} mt-2 py-3`}
                          >
                            Menunggu Start...
                          </div>
                        )}
                      </div>
                      <div className="shrink-0">
                        {gunTime ? (
                          <button
                            onClick={() => handleResetGunTime(dist)}
                            className="text-[10px] font-bold text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 px-4 py-2 rounded-lg transition-colors uppercase tracking-widest shadow-sm"
                          >
                            Reset
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleStartRace(dist, true)}
                              className={`px-3 py-3 ${theme.btnBg} ${theme.btnHover} text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all`}
                            >
                              START 10S
                            </button>
                            <button
                              onClick={() => handleStartRace(dist, false)}
                              className={`px-3 py-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all`}
                            >
                              START NOW
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 relative z-10 mt-auto">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        Batas COT:
                      </label>
                      <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                        <input
                          type="number"
                          value={cotValue}
                          onChange={(e) =>
                            setCotInputs({
                              ...cotInputs,
                              [dist]: e.target.value,
                            })
                          }
                          className={`w-14 bg-white border border-slate-200 rounded text-center text-sm font-bold text-slate-800 focus:outline-none ${theme.inputFocus}`}
                        />
                        <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">
                          menit
                        </span>
                        <button
                          onClick={() => handleUpdateCOT(dist)}
                          className="text-[9px] bg-slate-200 font-bold px-3 py-1.5 rounded text-slate-600 hover:bg-slate-300 transition-colors uppercase"
                        >
                          Set
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex-grow grid grid-cols-1 xl:grid-cols-3 gap-8 min-h-0">
              {/* KOLOM LOGGING SCANNER */}
              <div className="xl:col-span-1 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col shadow-sm text-center">
                <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🏁
                </div>
                <h2 className="text-base font-black text-[#152B5B] mb-2 uppercase tracking-widest">
                  Scanner Finish
                </h2>
                <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                  Ketik nomor BIB pelari lalu tekan <b>Enter</b>.
                </p>

                <form onSubmit={handleSubmitFinish} className="my-auto">
                  <input
                    ref={bibInputRef}
                    type="text"
                    autoFocus
                    value={bibInput}
                    onChange={(e) => setBibInput(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-center text-4xl font-black py-8 rounded-2xl focus:outline-none focus:border-[#1A73E8] focus:shadow-[0_0_20px_rgba(26,115,232,0.15)] uppercase tracking-widest transition-all placeholder:text-slate-200 shadow-inner"
                    placeholder="000"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !bibInput}
                    className="w-full mt-6 bg-[#1A73E8] hover:bg-[#1557b0] text-white text-sm font-black py-4 rounded-xl disabled:opacity-50 transition-all uppercase tracking-widest shadow-md"
                  >
                    {isProcessing ? "Menyimpan..." : "Catat Finisher"}
                  </button>
                </form>
              </div>

              {/* TABEL LIVE RIWAYAT FINISH DETAIL */}
              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
                    Riwayat Finisher Terkini
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#152B5B] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
                    {finishers.length} Terdata
                  </span>
                </div>
                <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="text-slate-400 text-[10px] uppercase tracking-widest sticky top-0 bg-white z-10 border-b border-slate-100">
                      <tr>
                        <th className="px-5 py-4 font-bold">Peringkat</th>
                        <th className="px-5 py-4 font-bold">BIB</th>
                        <th className="px-5 py-4 font-bold">Nama Pelari</th>
                        <th className="px-4 py-4 font-bold">Kategori</th>
                        <th className="px-5 py-4 font-bold text-center">
                          Status COT
                        </th>
                        <th className="px-5 py-4 font-bold text-right">
                          Waktu Finish
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {finishers.length === 0 && (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-12 text-slate-400 text-xs italic"
                          >
                            Belum ada aktivitas di garis finish.
                          </td>
                        </tr>
                      )}
                      {finishers.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-blue-50/40 transition-colors"
                        >
                          <td className="px-5 py-4 font-black text-[#152B5B] text-center">
                            #{p.rankKategori || "-"}
                          </td>
                          <td className="px-5 py-4 font-mono font-black text-slate-800 text-base">
                            {p.nomorBIB || "-"}
                          </td>
                          <td className="px-5 py-4 text-xs font-bold text-slate-700 max-w-[180px] truncate">
                            {p.namaLengkap}
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-[9px] font-black px-2 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 uppercase">
                              {p.jarak}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            {p.isOverCOT ? (
                              <span className="text-[9px] font-black px-2 py-0.5 bg-rose-50 text-rose-600 rounded border border-rose-200 uppercase">
                                Over COT
                              </span>
                            ) : (
                              <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded border border-emerald-200 uppercase">
                                Safe
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="font-mono font-black text-slate-800 text-sm">
                              {/* 🔥 SINTAKS FORMAT WAKTU YANG SUDAH KEBALL BUG Falsy 0 🔥 */}
                              {p.netTimeMs
                                ? formatDuration(0, p.netTimeMs)
                                : "--:--:--"}
                            </div>
                            {/* Tambahan Info Jam Aktual */}
                            {p.waktuFinish && (
                              <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">
                                Jam:{" "}
                                {new Date(p.waktuFinish).toLocaleTimeString(
                                  "id-ID",
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: STUDIO DOORPRIZE */}
        {/* ============================================================== */}
        {activeTab === "doorprize" && (
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
            <div className="lg:col-span-4 flex flex-col overflow-y-auto pr-2 custom-scrollbar gap-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm shrink-0">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100">
                  <h2 className="text-xs font-black text-[#152B5B] uppercase tracking-widest flex items-center gap-2">
                    <IconBox /> Database Hadiah
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadPrizeTemplate}
                      className="text-[9px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded border border-slate-200 transition-colors"
                    >
                      Template
                    </button>
                    <label className="text-[9px] font-bold uppercase tracking-widest bg-[#1A73E8] hover:bg-[#1557b0] text-white px-3 py-1.5 rounded cursor-pointer transition-colors shadow-sm">
                      Import Excel
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleImportPrizes}
                        className="hidden"
                        disabled={isProcessing}
                      />
                    </label>
                  </div>
                </div>

                <div className="mb-4">
                  <select
                    value={selectedPrizeId}
                    onChange={(e) => setSelectedPrizeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#D4AF37] shadow-inner"
                  >
                    <option value="">-- Pilih Hadiah Undian --</option>
                    {prizeList.map((p) => {
                      const sisa = p.jumlah - (p.terundi || 0);
                      return (
                        <option key={p.id} value={p.id} disabled={sisa <= 0}>
                          {p.namaHadiah} ({p.kategori}) - Sisa: {sisa}/
                          {p.jumlah}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama Hadiah"
                    value={manualPrize.namaHadiah}
                    onChange={(e) =>
                      setManualPrize({
                        ...manualPrize,
                        namaHadiah: e.target.value,
                      })
                    }
                    className="flex-grow bg-slate-50 border border-slate-300 rounded px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    min="1"
                    value={manualPrize.jumlah}
                    onChange={(e) =>
                      setManualPrize({
                        ...manualPrize,
                        jumlah: parseInt(e.target.value),
                      })
                    }
                    className="w-12 bg-slate-50 border border-slate-300 rounded px-2 py-2 text-xs text-center text-slate-800 focus:outline-none"
                  />
                  <button
                    onClick={handleAddManualPrize}
                    disabled={isProcessing}
                    className="bg-slate-800 text-white font-bold px-3 py-2 rounded text-[10px] uppercase"
                  >
                    Add
                  </button>
                </div>

                <div className="flex justify-between items-center mt-3 pt-4 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Tercatat {prizeList.length} macam barang
                  </span>
                  {prizeList.length > 0 && (
                    <button
                      onClick={handleClearPrizes}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase"
                    >
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm shrink-0">
                <h2 className="text-xs font-black text-[#152B5B] mb-4 uppercase tracking-widest flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <IconBroadcast /> Live Draw Screen
                  </span>
                  <a
                    href="/doorprize-screen"
                    target="_blank"
                    className="text-[9px] text-[#D4AF37] hover:bg-amber-50 border border-amber-200 px-2.5 py-1 rounded flex items-center gap-1"
                  >
                    <IconExternal /> Buka Layar
                  </a>
                </h2>

                <div className="space-y-4">
                  <button
                    onClick={syncPeserta}
                    className="w-full bg-blue-50 text-blue-600 font-bold py-2 rounded-lg text-[10px] uppercase tracking-widest border border-blue-200"
                  >
                    Re-sync Pool Peserta
                  </button>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Filter Kolam Undian
                    </label>
                    <select
                      value={filterDoorprize}
                      onChange={(e) => setFilterDoorprize(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
                    >
                      <option value="all">
                        Semua Peserta Lunas (VR & Offline)
                      </option>
                      <option value="vr">Khusus Virtual Run Saja</option>
                      <option value="offline">Khusus Offline Run Saja</option>
                      <option value="finish">
                        Peserta Offline yang Sudah Finish
                      </option>
                    </select>
                  </div>
                  {!isSpinning ? (
                    <button
                      onClick={() => handleRemoteDoorprize("spin")}
                      className="w-full bg-[#0B2239] hover:bg-blue-950 text-white font-black py-3.5 rounded-xl uppercase text-xs tracking-widest shadow-md transition-colors"
                    >
                      Mulai Undi
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRemoteDoorprize("stop")}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-3.5 rounded-xl uppercase text-xs tracking-widest shadow-md transition-colors animate-pulse"
                    >
                      STOP! (Dapatkan Pemenang)
                    </button>
                  )}
                  <button
                    onClick={() => handleRemoteDoorprize("idle")}
                    className="w-full bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-bold py-2.5 rounded-xl uppercase"
                  >
                    Reset Layar Panggung
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0">
              {/* KOLAM KANDIDAT UNDIAN */}
              <div className="bg-white border border-slate-200 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2">
                    <IconUsers /> Kandidat Doorprize
                  </h3>
                  <span className="text-[10px] font-bold bg-blue-50 border border-blue-100 px-2 py-1 rounded text-blue-700">
                    {candidates.length} Slot
                  </span>
                </div>
                <div className="p-2 bg-slate-50 flex gap-1 border-b border-slate-100">
                  <input
                    type="text"
                    placeholder="Nama"
                    value={manualInput.nama}
                    onChange={(e) =>
                      setManualInput({ ...manualInput, nama: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="BIB"
                    value={manualInput.bib}
                    onChange={(e) =>
                      setManualInput({ ...manualInput, bib: e.target.value })
                    }
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1 text-xs text-center"
                  />
                  <button
                    onClick={handleAddManualParticipant}
                    className="bg-white hover:bg-slate-100 border border-slate-300 px-3 rounded text-[9px] font-bold uppercase"
                  >
                    Tambah
                  </button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap">
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {candidates.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-bold text-slate-400 uppercase tracking-tighter w-20">
                            [{c.source}]
                          </td>
                          <td className="px-4 py-2.5 font-black text-slate-800 font-mono">
                            {c.nomorBIB || "-"}
                          </td>
                          <td className="px-4 py-2.5 text-slate-700 font-medium truncate max-w-[150px]">
                            {c.namaLengkap || c.nama}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABEL LIVE DAFTAR PEMENANG */}
              <div className="bg-white border border-slate-200 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2">
                    <IconTrophy /> Log Pemenang
                  </h3>
                  <span className="text-[10px] font-bold bg-amber-50 border border-amber-200 px-2 py-1 rounded text-amber-700">
                    {winners.length} Winner
                  </span>
                </div>
                <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap text-xs">
                    <tbody className="divide-y divide-slate-100">
                      {winners.map((p) => (
                        <tr key={p.id} className="hover:bg-amber-50/40">
                          <td className="px-4 py-3 font-bold text-slate-800">
                            <div>
                              {p.namaLengkap || p.nama}{" "}
                              <span className="font-mono text-[10px] text-slate-400">
                                ({p.nomorBIB})
                              </span>
                            </div>
                            <div className="text-[10px] text-[#D4AF37] font-black uppercase mt-1 flex items-center gap-1">
                              <IconGift /> {p.doorprizeWon}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleCancelWinner(p)}
                              className="text-[9px] font-bold text-rose-500 bg-rose-50 hover:bg-rose-500 hover:text-white px-2 py-1 rounded transition-colors border border-rose-200 uppercase"
                            >
                              Diskualifikasi
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: BROADCASTING & RESET CLASSIFICATION */}
        {/* ============================================================== */}
        {activeTab === "broadcast" && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-6 mt-6 animate-in fade-in duration-300">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xs font-black text-[#152B5B] mb-4 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <IconLink /> Tautan Video Call Pemenang
              </h2>
              <input
                type="url"
                value={settings.zoomLink || ""}
                onChange={(e) =>
                  handleUpdateSetting("zoomLink", e.target.value)
                }
                placeholder="https://zoom.us/j/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#1A73E8]"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-xs font-black text-[#152B5B] mb-4 uppercase tracking-widest border-b border-slate-100 pb-3 flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping"></span>{" "}
                YouTube Live Streaming
              </h2>
              <input
                type="url"
                value={settings.liveStreamLink || ""}
                onChange={(e) =>
                  handleUpdateSetting("liveStreamLink", e.target.value)
                }
                placeholder="https://youtube.com/live/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-xs font-black text-[#152B5B] uppercase tracking-widest mb-1">
                  Publikasi Leaderboard
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  Izinkan publik memantau klasemen langsung di halaman depan.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.showLeaderboard || false}
                  onChange={(e) =>
                    handleUpdateSetting("showLeaderboard", e.target.checked)
                  }
                />
                <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* ========================================================= */}
            {/* 🔥 2. PERBAIKAN UTAMA: TOMBOL RESET DATABASE CLASSEMET LEADERBOARD 🔥 */}
            {/* ========================================================= */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 shadow-sm mt-4">
              <h2 className="text-xs font-black text-rose-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                ⚠️ Danger Zone (Area Krusial)
              </h2>
              <p className="text-[11px] text-slate-500 leading-relaxed mb-4 font-medium">
                Gunakan fitur ini hanya saat ingin melakukan simulasi ulang
                balapan atau membersihkan catatan kotor pasca uji coba alat
                sebelum hari-H. Seluruh peringkat akan kembali kosong.
              </p>
              <button
                onClick={handleResetLeaderboard}
                disabled={isProcessing}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <IconTrash /> Reset Seluruh Klasemen Balapan
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
