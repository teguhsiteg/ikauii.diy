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
} from "firebase/firestore";
import * as XLSX from "xlsx";

// --- SVG Icons ---
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

// Pilihan Warna Dinamis untuk Kartu Jarak
const colorThemes = [
  {
    border: "border-blue-100",
    bgBlur: "bg-blue-50",
    hoverBgBlur: "group-hover:bg-blue-100",
    textMain: "text-[#152B5B]",
    textSub: "text-[#1A73E8]",
    btnBg: "bg-[#1A73E8]",
    btnHover: "hover:bg-[#1557b0]",
    inputFocus: "focus:border-[#1A73E8]",
  },
  {
    border: "border-purple-100",
    bgBlur: "bg-purple-50",
    hoverBgBlur: "group-hover:bg-purple-100",
    textMain: "text-[#152B5B]",
    textSub: "text-purple-600",
    btnBg: "bg-purple-600",
    btnHover: "hover:bg-purple-700",
    inputFocus: "focus:border-purple-500",
  },
  {
    border: "border-emerald-100",
    bgBlur: "bg-emerald-50",
    hoverBgBlur: "group-hover:bg-emerald-100",
    textMain: "text-[#152B5B]",
    textSub: "text-emerald-600",
    btnBg: "bg-emerald-600",
    btnHover: "hover:bg-emerald-700",
    inputFocus: "focus:border-emerald-500",
  },
  {
    border: "border-orange-100",
    bgBlur: "bg-orange-50",
    hoverBgBlur: "group-hover:bg-orange-100",
    textMain: "text-[#152B5B]",
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
  const [spinDuration, setSpinDuration] = useState<number>(5);
  const [manualPrize, setManualPrize] = useState({
    namaHadiah: "",
    kategori: "Umum",
    jumlah: 1,
  });
  const [isSpinning, setIsSpinning] = useState(false);

  const [message, setMessage] = useState({ type: "", text: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const bibInputRef = useRef<HTMLInputElement>(null);

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

  // --- 🔥 SINKRONISASI SETTING & JARAK DINAMIS 🔥 ---
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "virtual_run"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings(data);

        // Ekstrak Kategori Jarak dari offlinePackages
        let availDistances: string[] = [];
        if (data.offlinePackages && data.offlinePackages.length > 0) {
          availDistances = Array.from(
            new Set(data.offlinePackages.map((p: any) => p.jarak)),
          ) as string[];
        } else if (data.virtualPackages && data.virtualPackages.length > 0) {
          // Fallback kalau offline kosong, intip virtual
          availDistances = Array.from(
            new Set(data.virtualPackages.map((p: any) => p.jarak)),
          ) as string[];
        }

        setDistances(availDistances);

        // Inisialisasi state input COT
        setCotInputs((prev) => {
          const newCot = { ...prev };
          availDistances.forEach((dist) => {
            if (!newCot[dist]) newCot[dist] = data[`cot${dist}`] || "120";
          });
          return newCot;
        });
      }
    });
    return () => unsub();
  }, []);

  const syncPeserta = async () => {
    setIsProcessing(true);
    showMsg("success", "Sinkronisasi dimulai... Mengecek database.");
    try {
      const snapOffline = await getDocs(collection(db, "offline_participants"));
      const allOffline = snapOffline.docs.map((d) => ({
        id: d.id,
        source: "offline",
        ...d.data(),
      }));
      const lunasOffline = allOffline.filter((p) => {
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

      const finished = lunasOffline
        .filter((p) => p.waktuFinish)
        .sort((a, b) => b.waktuFinish - a.waktuFinish);
      setFinishers(finished);

      const snapVR = await getDocs(collection(db, "vr_participants"));
      const allVR = snapVR.docs.map((d) => ({
        id: d.id,
        source: "vr",
        ...d.data(),
      }));
      const lunasVR = allVR.filter((p) => {
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

      showMsg(
        "success",
        `Ditemukan ${lunasOffline.length} pelari Offline & ${lunasVR.length} pelari VR.`,
      );
    } catch (error) {
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
    let allCandidates = [
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
      case "all":
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
      } catch (err) {
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
    } catch (e) {
      showMsg("error", "Gagal menambahkan hadiah.");
    }
    setIsProcessing(false);
  };

  const handleClearPrizes = async () => {
    if (!confirm("Yakin hapus semua database hadiah?")) return;
    setIsProcessing(true);
    try {
      await Promise.all(
        prizeList.map((p) => deleteDoc(doc(db, "doorprize_items", p.id))),
      );
      setSelectedPrizeId("");
      showMsg("success", "Database hadiah dikosongkan.");
    } catch (e) {
      showMsg("error", "Gagal menghapus hadiah.");
    }
    setIsProcessing(false);
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

  // --- 🔥 AKSI GUN TIME & COT DINAMIS 🔥 ---
  const handleStartRace = async (dist: string) => {
    if (!confirm(`Mulai Race ${dist} sekarang?`)) return;
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        [`gunTime${dist}`]: Date.now(),
      });
      showMsg("success", `RACE ${dist} DIMULAI`);
    } catch (error) {}
  };

  const handleResetGunTime = async (dist: string) => {
    if (!confirm(`Yakin reset waktu mulai ${dist}?`)) return;
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        [`gunTime${dist}`]: null,
      });
    } catch (error) {}
  };

  const handleUpdateCOT = async (dist: string) => {
    try {
      await updateDoc(doc(db, "settings", "virtual_run"), {
        [`cot${dist}`]: Number(cotInputs[dist]),
      });
      showMsg("success", `COT ${dist} disimpan.`);
    } catch (error) {}
  };

  const handleSubmitFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bibInput.trim()) return;
    setIsProcessing(true);
    try {
      const peserta = offlineParticipants.find(
        (p) =>
          p.nomorBIB === bibInput.trim().toUpperCase() ||
          p.namaBib === bibInput.trim().toUpperCase(),
      );
      if (!peserta) {
        showMsg("error", `BIB ${bibInput} tidak valid/belum lunas!`);
      } else if (peserta.waktuFinish) {
        showMsg("error", `BIB ${bibInput} sudah finish!`);
      } else {
        const gunTime = settings[`gunTime${peserta.jarak}`];
        if (!gunTime) {
          showMsg("error", `Race ${peserta.jarak} belum dimulai!`);
        } else {
          await updateDoc(doc(db, "offline_participants", peserta.id), {
            waktuFinish: Date.now(),
          });
          showMsg("success", `FINISH: ${peserta.namaLengkap || peserta.nama}`);
        }
      }
    } catch (error) {
    } finally {
      setBibInput("");
      setIsProcessing(false);
      bibInputRef.current?.focus();
    }
  };

  const formatDuration = (start: number, end: number) => {
    if (!start || !end) return "--:--:--";
    const diffMs = end - start;
    if (diffMs < 0) return "--:--:--";
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isOverCOT = (jarak: string, start: number, end: number) => {
    if (!start || !end) return false;
    const diffMins = (end - start) / 60000;
    const cotLimit = settings[`cot${jarak}`] || 120;
    return diffMins > cotLimit;
  };

  const handleRemoteDoorprize = async (action: "idle" | "spin") => {
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

      setIsSpinning(true);
      await updateDoc(doc(db, "settings", "virtual_run"), {
        doorprizeSignal: {
          action: "spin",
          prize: selectedPrize.namaHadiah,
          winnerName: "",
          winnerBib: "",
        },
      });

      setTimeout(async () => {
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
      }, spinDuration * 1000);
    } catch (error) {
      showMsg("error", "Gagal memproses undian.");
      setIsSpinning(false);
    }
  };

  const handleCancelWinner = async (peserta: any) => {
    if (!confirm(`Batalkan kemenangan ${peserta.namaLengkap || peserta.nama}?`))
      return;
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
    } catch (error) {
      showMsg("error", "Gagal membatalkan.");
    }
  };

  const handleUpdateSetting = async (key: string, value: any) => {
    await updateDoc(doc(db, "settings", "virtual_run"), { [key]: value });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-blue-100">
      <header className="bg-white/90 backdrop-blur-xl border-b border-slate-200 px-8 py-5 flex justify-between items-center shrink-0 z-20 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 rounded-full bg-[#1A73E8] shadow-[0_0_10px_rgba(26,115,232,0.5)] animate-pulse"></div>
          <h1 className="text-xl font-black text-[#152B5B] tracking-widest uppercase">
            Live Control Room
          </h1>
        </div>
        {message.text && (
          <div
            className={`fixed top-5 left-1/2 -translate-x-1/2 px-6 py-2.5 rounded-full text-xs font-black shadow-xl z-50 uppercase tracking-widest border ${message.type === "success" ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-rose-50 text-rose-600 border-rose-200"}`}
          >
            {message.text}
          </div>
        )}
        <div className="font-mono text-sm font-bold tracking-widest text-[#152B5B] bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">
          {formatJam}
        </div>
      </header>

      <nav className="flex gap-2 px-8 pt-6 shrink-0 border-b border-slate-200 bg-white">
        {[
          { id: "timing", icon: <IconTimer />, label: "Finish Line & COT" },
          { id: "doorprize", icon: <IconGift />, label: "Studio Doorprize" },
          { id: "broadcast", icon: <IconBroadcast />, label: "Broadcasting" },
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

      <main className="flex-grow p-8 overflow-hidden flex flex-col">
        {/* ============================================================== */}
        {/* TAB 1: TIMING & FINISH LINE */}
        {/* ============================================================== */}
        {activeTab === "timing" && (
          <div className="h-full flex flex-col gap-8">
            {/* 🔥 KARTU GUN TIME DINAMIS 🔥 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 shrink-0">
              {distances.length === 0 && (
                <div className="col-span-full text-center py-6 text-slate-400 font-medium italic border border-dashed border-slate-300 rounded-xl">
                  Belum ada paket jarak lari yang di-setting.
                </div>
              )}
              {distances.map((dist, index) => {
                const theme = colorThemes[index % colorThemes.length];
                const gunTime = settings[`gunTime${dist}`];
                const cotValue =
                  cotInputs[dist] || settings[`cot${dist}`] || "120";

                return (
                  <div
                    key={dist}
                    className={`bg-white border ${theme.border} rounded-2xl p-6 flex flex-col gap-5 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 ${theme.bgBlur} rounded-full blur-2xl transition-all ${theme.hoverBgBlur}`}
                    ></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                          Gun Time {dist}
                        </h3>
                        <div
                          className={`text-3xl font-black ${theme.textMain} mt-1`}
                        >
                          {dist}
                        </div>
                        <div
                          className={`text-sm font-mono ${theme.textSub} mt-2 font-bold`}
                        >
                          {gunTime
                            ? `Mulai: ${new Date(gunTime).toLocaleTimeString("id-ID")}`
                            : "Menunggu Start..."}
                        </div>
                      </div>
                      {gunTime ? (
                        <button
                          onClick={() => handleResetGunTime(dist)}
                          className="text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg transition-colors shadow-sm"
                        >
                          Reset
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStartRace(dist)}
                          className={`px-6 py-3 ${theme.btnBg} ${theme.btnHover} text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-md transition-all`}
                        >
                          Start {dist}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 relative z-10">
                      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                        Batas Waktu (COT):
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
                        <span className="text-xs text-slate-500 font-medium">
                          menit
                        </span>
                        <button
                          onClick={() => handleUpdateCOT(dist)}
                          className="text-[10px] bg-slate-200 font-bold px-3 py-1.5 rounded-md text-slate-600 hover:bg-slate-300 transition-colors uppercase"
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
              {/* KOLOM SCANNER */}
              <div className="xl:col-span-1 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col shadow-sm text-center relative overflow-hidden">
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-emerald-50 rounded-full blur-3xl pointer-events-none"></div>
                <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 relative z-10">
                  🏁
                </div>
                <h2 className="text-lg font-black text-[#152B5B] mb-2 uppercase tracking-widest relative z-10">
                  Scanner Finish
                </h2>
                <p className="text-xs text-slate-500 mb-8 relative z-10 leading-relaxed">
                  Ketik nomor BIB pelari, lalu tekan{" "}
                  <span className="text-slate-700 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                    Enter
                  </span>
                  .
                </p>
                <form
                  onSubmit={handleSubmitFinish}
                  className="mt-auto mb-auto relative z-10"
                >
                  <input
                    ref={bibInputRef}
                    type="text"
                    autoFocus
                    value={bibInput}
                    onChange={(e) => setBibInput(e.target.value)}
                    disabled={isProcessing}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-center text-4xl font-black py-8 rounded-2xl focus:outline-none focus:border-[#1A73E8] focus:shadow-[0_0_20px_rgba(26,115,232,0.15)] uppercase tracking-widest transition-all placeholder:text-slate-300"
                    placeholder="BIB"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !bibInput}
                    className="w-full mt-6 bg-[#1A73E8] hover:bg-[#1557b0] text-white text-sm font-black py-4 rounded-xl disabled:opacity-50 transition-all uppercase tracking-widest shadow-md"
                  >
                    {isProcessing ? "Menyimpan..." : "Catat Waktu"}
                  </button>
                </form>
              </div>

              {/* KOLOM RIWAYAT FINISH */}
              <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>{" "}
                    Riwayat Finish
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#152B5B] bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg">
                    {finishers.length} Masuk
                  </span>
                </div>
                <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="text-slate-400 text-[10px] uppercase tracking-widest sticky top-0 bg-white z-10">
                      <tr>
                        <th className="px-5 py-4 font-bold border-b border-slate-100">
                          Jam Masuk
                        </th>
                        <th className="px-5 py-4 font-bold border-b border-slate-100">
                          BIB
                        </th>
                        <th className="px-5 py-4 font-bold border-b border-slate-100">
                          Pelari
                        </th>
                        <th className="px-5 py-4 font-bold border-b border-slate-100">
                          Kategori
                        </th>
                        <th className="px-5 py-4 font-bold border-b border-slate-100 text-right">
                          Net Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {finishers.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center py-12 text-slate-400 text-xs italic font-medium"
                          >
                            Belum ada pelari finish.
                          </td>
                        </tr>
                      )}
                      {finishers.map((p) => {
                        const gunTime = settings[`gunTime${p.jarak}`];
                        const overCOT = isOverCOT(
                          p.jarak,
                          gunTime,
                          p.waktuFinish,
                        );
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-blue-50/50 transition-colors"
                          >
                            <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                              {new Date(p.waktuFinish).toLocaleTimeString(
                                "id-ID",
                              )}
                            </td>
                            <td className="px-5 py-4 font-black text-slate-800 text-lg">
                              {p.nomorBIB || p.namaBib || "-"}
                            </td>
                            <td className="px-5 py-4 text-slate-600 text-xs font-bold truncate max-w-[200px]">
                              {p.namaLengkap || p.nama}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200`}
                              >
                                {p.jarak}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <span
                                className={`font-mono text-base font-black ${overCOT ? "text-rose-500" : "text-emerald-600"}`}
                              >
                                {formatDuration(gunTime, p.waktuFinish)}
                              </span>
                              {overCOT && (
                                <span className="block text-[9px] text-rose-500 font-black uppercase mt-1 tracking-widest">
                                  Over COT
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
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
                    <span className="text-amber-500">📦</span> Database Hadiah
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadPrizeTemplate}
                      className="text-[9px] font-bold uppercase tracking-widest bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded transition-colors border border-slate-200"
                    >
                      Template
                    </button>
                    <label className="text-[9px] font-bold uppercase tracking-widest bg-[#1A73E8] hover:bg-[#1557b0] text-white px-3 py-1.5 rounded cursor-pointer transition-colors shadow-sm">
                      {isProcessing ? "Memuat..." : "Import Excel"}
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Pilih Hadiah (Dropdown)
                  </label>
                  <select
                    value={selectedPrizeId}
                    onChange={(e) => setSelectedPrizeId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#D4AF37] shadow-inner"
                  >
                    <option value="">-- Sentuh untuk memilih --</option>
                    {prizeList.map((p) => {
                      const sisa = p.jumlah - (p.terundi || 0);
                      return (
                        <option key={p.id} value={p.id} disabled={sisa <= 0}>
                          {p.namaHadiah} ({p.kategori}) - Kuota Sisa: {sisa}/
                          {p.jumlah}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Atau Tambah Manual
                  </label>
                  <div className="flex gap-2">
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
                      className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-2 text-xs text-center text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                    />
                    <button
                      onClick={handleAddManualPrize}
                      disabled={isProcessing}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 px-3 rounded text-[10px] font-bold uppercase transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-4 border-t border-slate-100">
                  <span className="text-[10px] font-medium text-slate-500">
                    Tersedia {prizeList.length} macam hadiah
                  </span>
                  {prizeList.length > 0 && (
                    <button
                      onClick={handleClearPrizes}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase tracking-wider transition-colors"
                    >
                      Reset Database
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white border border-[#D4AF37]/30 rounded-2xl p-6 shadow-md shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50 rounded-full blur-3xl pointer-events-none"></div>
                <h2 className="text-xs font-black text-[#152B5B] mb-5 uppercase tracking-widest flex items-center justify-between relative z-10">
                  <span className="flex items-center gap-2">
                    <span className="text-amber-500">🕹️</span> Layar Studio
                  </span>
                  <a
                    href="/doorprize-screen"
                    target="_blank"
                    className="text-[9px] text-[#D4AF37] hover:text-amber-600 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded transition-colors"
                  >
                    Buka Proyektor <IconExternal />
                  </a>
                </h2>

                <div className="space-y-4 relative z-10">
                  <button
                    onClick={syncPeserta}
                    disabled={isProcessing}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[10px] font-bold py-2 rounded-lg transition-colors uppercase tracking-widest mb-2 flex items-center justify-center gap-2"
                  >
                    {isProcessing
                      ? "Menarik Data..."
                      : "🔄 Sinkronisasi Data Peserta Lunas"}
                  </button>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                      Filter Kolam Undian
                    </label>
                    <select
                      value={filterDoorprize}
                      onChange={(e) => setFilterDoorprize(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#D4AF37] shadow-inner"
                    >
                      <option value="all">
                        Semua Peserta Lunas (VR & Offline)
                      </option>
                      <option value="vr">Khusus Virtual Run Saja</option>
                      <option value="offline">Khusus Offline Run Saja</option>
                      <option value="finish">
                        Peserta Offline (Sudah Finish)
                      </option>
                      <option value="alumni">Peserta Status ALUMNI</option>
                      <option value="umum">
                        Peserta Status UMUM (Non-Alumni)
                      </option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Durasi Putar Acak
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={spinDuration}
                        onChange={(e) =>
                          setSpinDuration(Number(e.target.value))
                        }
                        className="w-14 bg-transparent border-b border-slate-300 text-center text-sm font-bold text-slate-800 focus:outline-none focus:border-[#D4AF37]"
                      />
                      <span className="text-xs text-slate-500 font-medium">
                        detik
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleRemoteDoorprize("spin")}
                      disabled={isSpinning}
                      className={`w-full text-white text-sm font-black py-4 rounded-xl transition-all uppercase tracking-widest shadow-md ${isSpinning ? "bg-slate-400 animate-pulse cursor-not-allowed" : "bg-[#D4AF37] hover:bg-yellow-600 hover:scale-105"}`}
                    >
                      {isSpinning ? "Mengundi..." : "🎲 Putar & Undi Otomatis"}
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoteDoorprize("idle")}
                    className="w-full bg-white hover:bg-slate-50 text-slate-500 text-[10px] font-bold py-3 rounded-lg transition-colors uppercase tracking-widest border border-slate-300 mt-1 shadow-sm"
                  >
                    Reset Layar (Kembali ke Idle)
                  </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0">
              {/* KOLAM KANDIDAT */}
              <div className="bg-white border border-slate-200 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="text-[#1A73E8]">👥</span> Kolam Undian
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-[#152B5B] bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                    {candidates.length} Orang
                  </span>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-100 flex gap-2">
                  <input
                    type="text"
                    placeholder="Nama Peserta"
                    value={manualInput.nama}
                    onChange={(e) =>
                      setManualInput({ ...manualInput, nama: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                  />
                  <input
                    type="text"
                    placeholder="BIB"
                    value={manualInput.bib}
                    onChange={(e) =>
                      setManualInput({ ...manualInput, bib: e.target.value })
                    }
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#1A73E8]"
                  />
                  <button
                    onClick={handleAddManualParticipant}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 rounded text-[10px] font-bold uppercase transition-colors whitespace-nowrap border border-slate-300"
                  >
                    + Manual
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="text-slate-400 text-[9px] uppercase tracking-widest sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-4 py-3 font-bold border-b border-slate-100">
                          BIB / Asal
                        </th>
                        <th className="px-4 py-3 font-bold border-b border-slate-100">
                          Nama Kandidat
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {candidates.length === 0 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-10 text-slate-400 text-xs italic"
                          >
                            Klik "Sinkronisasi" atau pastikan filter sesuai.
                          </td>
                        </tr>
                      )}
                      {candidates.map((c) => (
                        <tr key={c.id} className="hover:bg-blue-50/50">
                          <td className="px-4 py-3">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${c.source === "vr" ? "bg-purple-50 text-purple-600 border border-purple-200" : c.source === "manual" ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}
                            >
                              {c.source}
                            </span>
                            {c.nomorBIB && (
                              <div className="text-[10px] font-mono text-slate-500 mt-1 font-bold">
                                {c.nomorBIB}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs font-bold text-slate-700 truncate max-w-[150px]">
                              {c.namaLengkap || c.nama}
                            </div>
                            <div className="text-[9px] text-slate-500 uppercase mt-0.5 font-medium">
                              {c.kategoriPeserta ||
                                c.kategori ||
                                c.tipePeserta ||
                                "UMUM"}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* DAFTAR PEMENANG */}
              <div className="bg-white border border-[#D4AF37]/30 rounded-2xl flex flex-col min-h-0 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0 bg-slate-50">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="text-[#D4AF37]">🏆</span> Pemenang
                  </h3>
                  <span className="text-[10px] font-bold uppercase text-[#152B5B] bg-amber-50 border border-amber-200 px-2 py-1 rounded">
                    {winners.length} Orang
                  </span>
                </div>
                <div className="flex-grow overflow-y-auto p-2 custom-scrollbar">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead className="text-slate-400 text-[9px] uppercase tracking-widest sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-4 py-3 font-bold border-b border-slate-100">
                          Peserta
                        </th>
                        <th className="px-4 py-3 font-bold border-b border-slate-100 text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {winners.length === 0 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center py-10 text-slate-400 text-xs italic"
                          >
                            Belum ada pemenang.
                          </td>
                        </tr>
                      )}
                      {winners.map((p) => (
                        <tr key={p.id} className="hover:bg-amber-50/50">
                          <td className="px-4 py-3">
                            <div className="text-xs font-bold text-slate-800 truncate max-w-[150px]">
                              {p.namaLengkap || p.nama}
                            </div>
                            <div className="text-[10px] font-bold text-[#D4AF37] mt-0.5 truncate max-w-[150px]">
                              🎁 {p.doorprizeWon}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-top">
                            <button
                              onClick={() => handleCancelWinner(p)}
                              className="text-[9px] font-bold text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 border border-rose-200 px-2 py-1 rounded transition-colors uppercase tracking-wider"
                            >
                              Batal
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
        {/* TAB 3: BROADCASTING & LEADERBOARD */}
        {/* ============================================================== */}
        {activeTab === "broadcast" && (
          <div className="max-w-2xl mx-auto w-full flex flex-col gap-8 mt-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl pointer-events-none"></div>
              <h2 className="text-xs font-black text-[#152B5B] mb-5 uppercase tracking-widest border-b border-slate-100 pb-4 flex items-center gap-2 relative z-10">
                <span className="text-[#1A73E8]">🔗</span> Tautan Video Call
                Pemenang
              </h2>
              <input
                type="url"
                value={settings.zoomLink || ""}
                onChange={(e) =>
                  handleUpdateSetting("zoomLink", e.target.value)
                }
                placeholder="https://zoom.us/j/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-[#1A73E8] shadow-inner transition-colors relative z-10"
              />
              <p className="text-[10px] text-slate-500 mt-3 font-medium leading-relaxed relative z-10">
                Masukkan link Zoom/G-Meet. Peserta yang menang di Web Publik
                akan melihat tombol untuk bergabung live.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl pointer-events-none"></div>
              <h2 className="text-xs font-black text-[#152B5B] mb-5 uppercase tracking-widest border-b border-slate-100 pb-4 flex items-center gap-2 relative z-10">
                <span className="text-rose-500 animate-pulse">●</span> YouTube
                Live Streaming
              </h2>
              <input
                type="url"
                value={settings.liveStreamLink || ""}
                onChange={(e) =>
                  handleUpdateSetting("liveStreamLink", e.target.value)
                }
                placeholder="https://youtube.com/live/..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-5 py-4 text-sm font-medium text-slate-800 focus:outline-none focus:border-rose-500 shadow-inner transition-colors relative z-10"
              />
              <p className="text-[10px] text-slate-500 mt-3 font-medium leading-relaxed relative z-10">
                Tautkan video Live YouTube. Akan muncul jendela pemutar video di
                beranda web.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-xs font-black text-[#152B5B] uppercase tracking-widest mb-1">
                  Publikasi Leaderboard
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  Buka akses publik untuk melihat klasemen.
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
                <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
