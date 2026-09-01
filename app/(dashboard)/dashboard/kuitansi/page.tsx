"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";

export default function AdminKuitansiPage() {
  const [formData, setFormData] = useState({
    jenisEvent: "",
    terimaDari: "",
    nominal: "",
    keterangan: "",
    tanggalPenerimaan: new Date().toISOString().split("T")[0],
    penandatangan: "",
  });

  const [prokerList, setProkerList] = useState<any[]>([]);
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [kuitansiList, setKuitansiList] = useState<any[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [docIdToRender, setDocIdToRender] = useState("");

  const [showEventDropdown, setShowEventDropdown] = useState(false);
  const [showSignerDropdown, setShowSignerDropdown] = useState(false);

  // 🔥 STATE PENCARIAN & PAGINASI 🔥
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState<number | "Semua">(5);
  const [currentPage, setCurrentPage] = useState(1);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  // --- AMBIL DATA DARI FIREBASE ---
  useEffect(() => {
    const fetchProker = async () => {
      const q = query(collection(db, "proker"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setProkerList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchPengurus = async () => {
      const snap = await getDocs(collection(db, "pengurus"));
      setPengurusList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const qKuitansi = query(
      collection(db, "kuitansi_organisasi"),
      orderBy("createdAt", "desc"),
    );
    const unsubKuitansi = onSnapshot(qKuitansi, (snap) => {
      setKuitansiList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    fetchProker();
    fetchPengurus();

    return () => unsubKuitansi();
  }, []);

  // --- FILTER & PAGINASI LOGIC ---
  const filteredKuitansi = useMemo(() => {
    if (!searchQuery) return kuitansiList;
    const lowerQuery = searchQuery.toLowerCase();
    return kuitansiList.filter(
      (k) =>
        (k.terimaDari && k.terimaDari.toLowerCase().includes(lowerQuery)) ||
        (k.jenisEvent && k.jenisEvent.toLowerCase().includes(lowerQuery)) ||
        (k.nominal && k.nominal.toString().includes(lowerQuery)) ||
        (k.keterangan && k.keterangan.toLowerCase().includes(lowerQuery)),
    );
  }, [kuitansiList, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const totalPages =
    itemsPerPage === "Semua"
      ? 1
      : Math.ceil(filteredKuitansi.length / itemsPerPage);

  const currentData = useMemo(() => {
    if (itemsPerPage === "Semua") return filteredKuitansi;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredKuitansi.slice(start, start + itemsPerPage);
  }, [filteredKuitansi, currentPage, itemsPerPage]);

  // --- FUNGSI FORMAT & ACTION ---
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

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus kuitansi ini? Aksi ini permanen.")) {
      try {
        await deleteDoc(doc(db, "kuitansi_organisasi", id));
      } catch {
        toast.error("Gagal menghapus kuitansi.");
      }
    }
  };

  const handleKirimWA = (kuitansi: any) => {
    const text = `Halo Bapak/Ibu *${kuitansi.terimaDari}*,\n\nTerima kasih atas partisipasi dan donasi Anda pada acara *${kuitansi.jenisEvent}*.\n\nBerikut kami lampirkan tautan E-Kuitansi resmi penerimaan dana dari IKA UII DIY sebesar *Rp ${kuitansi.nominal.toLocaleString("id-ID")}*:\n\n🔗 ${baseUrl}/verif-kuitansi/${kuitansi.id}\n\nSalam hangat,\n*Bendahara DPW IKA UII DIY*`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const newDoc = await addDoc(collection(db, "kuitansi_organisasi"), {
        jenisEvent: formData.jenisEvent,
        terimaDari: formData.terimaDari,
        nominal: Number(formData.nominal),
        keterangan: formData.keterangan,
        tanggalPenerimaan: formData.tanggalPenerimaan,
        penandatangan: formData.penandatangan,
        createdAt: serverTimestamp(),
      });

      setDocIdToRender(newDoc.id);

      setTimeout(() => {
        executeCanvasGeneration(newDoc.id, formData);
      }, 1000);
    } catch {
      toast.error("Gagal membuat kuitansi.");
      setIsGenerating(false);
    }
  };

  const handleRedownload = (kuitansi: any) => {
    setDocIdToRender(kuitansi.id);
    setIsGenerating(true);
    setTimeout(() => {
      executeCanvasGeneration(kuitansi.id, kuitansi);
    }, 1000);
  };

  // =========================================================================
  // --- 🔥 ENGINE KUITANSI 21x8 CM (ULTIMATE HD RESOLUTION) 🔥 ---
  // =========================================================================
  const executeCanvasGeneration = (id: string, data: any) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const baseWidth = 1260;
    const baseHeight = 480;
    const scaleFactor = 2;

    canvas.width = baseWidth * scaleFactor;
    canvas.height = baseHeight * scaleFactor;

    ctx.scale(scaleFactor, scaleFactor);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

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
      const sidebarGradient = ctx.createLinearGradient(0, 0, sidebarWidth, 0);
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
      ctx.fillText(`KUIT-${id.substring(0, 8).toUpperCase()}`, 40, 245);

      const qrElement = document.getElementById(
        "qr-kuitansi-org",
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

    logoImg.onerror = () => {
      toast.warning("Peringatan: Gambar Logo /public/logo-dpp-ika.png gagal diload.");
      setIsGenerating(false);
    };

    const renderRightArea = () => {
      ctx.textAlign = "left";

      const startX = 360;
      const colonX = 560;
      const textX = 580;
      const maxTextW = 640;

      let startY = 70;
      const gapY = 35;

      const drawRow = (
        label: string,
        value: string,
        valueColor: string,
        valueFont: string,
        isBox = false,
      ) => {
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "#5F6368"; // Google Gray
        ctx.fillText(label, startX, startY);

        ctx.fillText(":", colonX, startY);

        ctx.font = valueFont;
        ctx.fillStyle = valueColor;

        if (isBox) {
          ctx.fillStyle = "#F8F9FA";
          ctx.strokeStyle = "#DADCE0";
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

      drawRow(
        "KATEGORI / EVENT",
        data.jenisEvent,
        "#1A73E8",
        "bold 18px Arial",
      );
      drawRow("TELAH TERIMA DARI", data.terimaDari, "#202124", "18px Arial");
      drawRow(
        "UANG SEBESAR",
        `Rp ${Number(data.nominal).toLocaleString("id-ID")}`,
        "#1A73E8",
        "bold 24px Arial",
        true,
      );
      drawRow(
        "TERBILANG",
        `${terbilang(Number(data.nominal))} Rupiah`,
        "#5F6368",
        "italic 16px Arial",
      );
      drawRow("GUNA PEMBAYARAN", data.keterangan, "#5F6368", "16px Arial");

      ctx.textAlign = "center";
      const ttdX = 1050;

      ctx.font = "14px Arial";
      ctx.fillStyle = "#5F6368";
      const tglPenerimaanVal = new Date(data.tanggalPenerimaan);
      ctx.fillText(
        `Yogyakarta, ${tglPenerimaanVal.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
        ttdX,
        baseHeight - 120,
      );

      const partsTtd = data.penandatangan.split(" (");
      const namaTtd = partsTtd[0];
      const jabatanTtd = partsTtd[1]
        ? partsTtd[1].replace(")", "")
        : "Pengurus";

      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#202124";
      ctx.fillText(namaTtd, ttdX, baseHeight - 50);

      ctx.font = "13px Arial";
      ctx.fillStyle = "#5F6368";
      ctx.fillText(jabatanTtd, ttdX, baseHeight - 32);

      ctx.strokeStyle = "#DADCE0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ttdX - 140, baseHeight - 45);
      ctx.lineTo(ttdX + 140, baseHeight - 45);
      ctx.stroke();

      ctx.fillStyle = "#1E8E3E"; // Google Green
      ctx.font = "bold 11px Arial";
      ctx.fillText(
        "TERVERIFIKASI SISTEM (TTE IKA UII DIY)",
        ttdX,
        baseHeight - 15,
      );

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      const cleanEventName = data.jenisEvent.replace(/[^a-z0-9]+/gi, "-");
      a.download = `Kuitansi_${cleanEventName}_${id.substring(0, 6)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setIsGenerating(false);
      setDocIdToRender("");
      setFormData({
        jenisEvent: "",
        terimaDari: "",
        nominal: "",
        keterangan: "",
        tanggalPenerimaan: new Date().toISOString().split("T")[0],
        penandatangan: "",
      });
    };
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
      const testLine = line + words[n] + " ";
      const metrics = context.measureText(testLine);
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

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-12 font-sans">
      {/* HEADER: GOOGLE WORKSPACE STYLE */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DADCE0] pb-6">
        <div>
          <h1 className="text-3xl font-medium text-[#202124] tracking-tight mb-1">
            Pabrik Kuitansi Organisasi
          </h1>
          <p className="text-[#5F6368] text-sm max-w-2xl">
            Cetak kuitansi penerimaan dana resmi ber-QR Code untuk berbagai
            keperluan IKA UII. Validasi dapat diakses publik secara realtime.
          </p>
        </div>
        <div className="w-14 h-14 bg-white border border-[#DADCE0] rounded-xl flex items-center justify-center shadow-sm shrink-0">
          <img
            src="/logo-dpp-ika.png"
            alt="IKA UII DIY"
            className="w-8 h-8 object-contain opacity-80"
          />
        </div>
      </div>

      {/* ELEMEN QR TERSEMBUNYI UNTUK CANVAS */}
      {docIdToRender && (
        <div className="hidden">
          <QRCodeCanvas
            id="qr-kuitansi-org"
            value={`${baseUrl}/verif-kuitansi/${docIdToRender}`}
            size={300}
            level="H"
            includeMargin={true}
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 items-start">
        {/* FORM PANEL (TOP) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 mb-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold text-sm">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
              </div>
              <h2 className="font-bold text-slate-800 text-base">
                Buat Kuitansi Baru
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Cetak kuitansi penerimaan dana resmi ber-QR Code
            </span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* SMART SEARCH EVENT/KATEGORI */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kategori / Event Kuitansi <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.jenisEvent}
                    onChange={(e) => {
                      setFormData({ ...formData, jenisEvent: e.target.value });
                      setShowEventDropdown(true);
                    }}
                    onFocus={() => setShowEventDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowEventDropdown(false), 200)
                    }
                    placeholder="Ketik untuk mencari..."
                    className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-medium text-slate-800 transition-colors text-sm"
                  />
                  <svg
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${showEventDropdown ? "rotate-180" : ""}`}
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
                </div>

                {showEventDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar py-1">
                    {prokerList
                      .filter((p) =>
                        p.namaKegiatan
                          .toLowerCase()
                          .includes(formData.jenisEvent.toLowerCase()),
                      )
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              jenisEvent: p.namaKegiatan,
                            });
                            setShowEventDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-800"
                        >
                          {p.namaKegiatan}
                        </div>
                      ))}
                    <div className="px-4 py-1.5 mt-1 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 border-y border-slate-200">
                      Kategori Umum
                    </div>
                    {[
                      "Sponsorship Umum",
                      "Donasi Bebas / Amal",
                      "Iuran Anggota / Kas",
                      "Lainnya (Umum)",
                    ]
                      .filter((e) =>
                        e
                          .toLowerCase()
                          .includes(formData.jenisEvent.toLowerCase()),
                      )
                      .map((e) => (
                        <div
                          key={e}
                          onClick={() => {
                            setFormData({ ...formData, jenisEvent: e });
                            setShowEventDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer text-sm font-medium text-slate-800"
                        >
                          {e}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Telah Terima Dari <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.terimaDari}
                  onChange={(e) =>
                    setFormData({ ...formData, terimaDari: e.target.value })
                  }
                  placeholder="Nama Lengkap / Instansi"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-medium text-slate-800 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nominal Uang (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.nominal}
                  onChange={(e) =>
                    setFormData({ ...formData, nominal: e.target.value })
                  }
                  placeholder="Contoh: 1500000"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-mono font-bold text-blue-700 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tanggal Terima <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.tanggalPenerimaan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tanggalPenerimaan: e.target.value,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-medium text-slate-800 transition-colors text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* SMART SEARCH PENANDATANGAN */}
              <div className="relative md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Otoritas Penandatangan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.penandatangan}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        penandatangan: e.target.value,
                      });
                      setShowSignerDropdown(true);
                    }}
                    onFocus={() => setShowSignerDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowSignerDropdown(false), 200)
                    }
                    placeholder="Ketik untuk mencari nama..."
                    className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-medium text-slate-800 transition-colors text-sm"
                  />
                  <svg
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${showSignerDropdown ? "rotate-180" : ""}`}
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
                </div>

                {showSignerDropdown && (
                  <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar py-1">
                    {pengurusList
                      .filter(
                        (p) =>
                          p.nama &&
                          p.nama
                            .toLowerCase()
                            .includes(formData.penandatangan.toLowerCase()),
                      )
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              penandatangan: `${p.nama} (${p.jabatan || "Pengurus"})`,
                            });
                            setShowSignerDropdown(false);
                          }}
                          className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex flex-col"
                        >
                          <span className="text-sm font-medium text-slate-800">
                            {p.nama}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {p.jabatan || "Pengurus"}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="md:col-span-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Guna Pembayaran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  placeholder="Jelaskan rincian..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none font-medium text-slate-800 transition-colors text-sm"
                />
              </div>

              <div className="md:col-span-1">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        ></path>
                      </svg>{" "}
                      Memproses...
                    </>
                  ) : (
                    <>Cetak Kuitansi Resmi</>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* FULL WIDTH TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
          {/* HEADER & CONTROLS */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-bold text-slate-800 text-sm">
                Riwayat Kuitansi Organisasi
              </h2>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {filteredKuitansi.length} Dokumen
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Cari nama, event, nominal..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs text-slate-600">
                <span>Tampilkan:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) =>
                    setItemsPerPage(
                      e.target.value === "Semua"
                        ? "Semua"
                        : Number(e.target.value),
                    )
                  }
                  className="bg-white border border-slate-200 py-1 px-2 rounded-lg text-xs font-medium focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value="Semua">Semua</option>
                </select>
              </div>
            </div>
          </div>

          {/* LIST TABLE */}
          {currentData.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-sm">
              {searchQuery
                ? "Tidak ditemukan kuitansi dengan kata kunci tersebut."
                : "Belum ada riwayat pembuatan kuitansi."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-3.5 w-12 text-center">#</th>
                    <th className="px-5 py-3.5">Kode Kuitansi</th>
                    <th className="px-5 py-3.5">Terima Dari & Event</th>
                    <th className="px-5 py-3.5">Nominal Uang</th>
                    <th className="px-5 py-3.5">Guna Pembayaran</th>
                    <th className="px-5 py-3.5">Tanggal</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {currentData.map((kuitansi, index) => {
                    const noUrut =
                      itemsPerPage === "Semua"
                        ? index + 1
                        : (currentPage - 1) * (itemsPerPage as number) +
                          index +
                          1;

                    return (
                      <tr key={kuitansi.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 text-center font-mono text-xs font-bold text-slate-400">
                          {noUrut}
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-xs text-blue-900 whitespace-nowrap">
                          KUIT-{kuitansi.id.substring(0, 6).toUpperCase()}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800 text-sm">
                            {kuitansi.terimaDari}
                          </div>
                          <div className="text-xs text-blue-600 font-medium">
                            {kuitansi.jenisEvent}
                          </div>
                        </td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          Rp {kuitansi.nominal.toLocaleString("id-ID")}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 max-w-xs truncate">
                          {kuitansi.keterangan}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap">
                          {kuitansi.tanggalPenerimaan}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRedownload(kuitansi)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors border border-blue-200"
                            >
                              Unduh HD
                            </button>
                            <button
                              onClick={() => handleKirimWA(kuitansi)}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                            >
                              Kirim WA
                            </button>
                            <button
                              onClick={() => handleDelete(kuitansi.id)}
                              className="px-2 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* CONTROLS PAGINASI FOOTER */}
          {itemsPerPage !== "Semua" && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 bg-slate-50/70">
              <div className="text-xs font-medium text-slate-500">
                Hal {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors text-xs font-medium"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors text-xs font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
