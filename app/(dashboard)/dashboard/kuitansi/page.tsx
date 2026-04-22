"use client";

import { useState, useEffect } from "react";
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
    if (confirm("Yakin ingin menghapus kuitansi ini?")) {
      try {
        await deleteDoc(doc(db, "kuitansi_organisasi", id));
      } catch (error) {
        alert("❌ Gagal menghapus kuitansi.");
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

      // Tunggu QR muncul di DOM
      setTimeout(() => {
        executeCanvasGeneration(newDoc.id, formData);
      }, 1000);
    } catch (error) {
      alert("❌ Gagal membuat kuitansi.");
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

    // 1. Rasio Mutlak 21x8 (1260 x 480 pixel) dengan Scale HD (x2)
    const baseWidth = 1260;
    const baseHeight = 480;
    const scaleFactor = 2;

    canvas.width = baseWidth * scaleFactor;
    canvas.height = baseHeight * scaleFactor;

    ctx.scale(scaleFactor, scaleFactor);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Load Logo IKA UII
    const logoImg = new Image();
    logoImg.src = "/logo-dpp-ika.png";

    logoImg.onload = () => {
      // --- BACKGROUND DASAR ---
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, baseWidth, baseHeight);

      // --- WATERMARK TENGAH (PRO) ---
      ctx.save();
      ctx.globalAlpha = 0.04; // Transparan 4%
      const wmkSize = 380;
      // Posisi watermark di tengah area putih (antara sidebar 320px dan 1260px)
      ctx.drawImage(
        logoImg,
        320 + (940 - wmkSize) / 2,
        (baseHeight - wmkSize) / 2,
        wmkSize,
        wmkSize,
      );
      ctx.restore();

      // --- SIDEBAR KIRI BIRU ---
      const sidebarWidth = 320;
      const sidebarGradient = ctx.createLinearGradient(0, 0, sidebarWidth, 0);
      sidebarGradient.addColorStop(0, "#1e3a8a");
      sidebarGradient.addColorStop(1, "#1e40af");
      ctx.fillStyle = sidebarGradient;
      ctx.fillRect(0, 0, sidebarWidth, baseHeight);

      // Aksen Garis Emas Pembatas Sidebar
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(sidebarWidth - 4, 0, 4, baseHeight);

      // --- ISI SIDEBAR (LOGO & JUDUL) ---
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

      // --- QR CODE DENGAN CARA AMAN ---
      const qrElement = document.getElementById(
        "qr-kuitansi-org",
      ) as HTMLCanvasElement;
      if (qrElement) {
        const qrImg = new Image();
        qrImg.src = qrElement.toDataURL("image/png");
        qrImg.onload = () => {
          ctx.drawImage(qrImg, 40, 270, 160, 160); // QR agak turun, ukuran membesar
          ctx.font = "11px Arial";
          ctx.textAlign = "center";
          ctx.fillStyle = "rgba(255,255,255,0.8)";
          ctx.fillText("Scan untuk validasi kriptografi sah", 120, 450);

          // Setelah QR digambar, lanjut render teks area kanan
          renderRightArea();
        };
      } else {
        renderRightArea();
      }
    };

    logoImg.onerror = () => {
      alert(
        "❌ Peringatan: Gambar Logo /public/logo-dpp-ika.png gagal diload.",
      );
      setIsGenerating(false);
    };

    // --- FUNGSI MENGGAMBAR AREA KANAN (DATA) ---
    const renderRightArea = () => {
      ctx.textAlign = "left";

      const startX = 360; // Batas kiri teks
      const colonX = 560; // Posisi statis titik dua (:)
      const textX = 580; // Posisi statis mulai teks data
      const maxTextW = 640; // Batas maksimal lebar teks agar wrap dan tidak potong

      let startY = 70;
      const gapY = 35; // Jarak antar baris menu

      // Fungsi Helper Cetak Baris Dinamis
      const drawRow = (
        label: string,
        value: string,
        valueColor: string,
        valueFont: string,
        isBox = false,
      ) => {
        // Gambar Label
        ctx.font = "bold 14px Arial";
        ctx.fillStyle = "#64748b";
        ctx.fillText(label, startX, startY);

        // Gambar Titik Dua
        ctx.fillText(":", colonX, startY);

        // Gambar Value
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
          // Fitur wrap teks super pintar
          const endY = wrapText(ctx, value, textX, startY, maxTextW, 24);
          startY = endY + gapY;
        }
      };

      // Eksekusi Baris per Baris
      drawRow(
        "KATEGORI / EVENT",
        data.jenisEvent,
        "#1d4ed8",
        "bold 18px Arial",
      );
      drawRow("TELAH TERIMA DARI", data.terimaDari, "#0f172a", "18px Arial");
      drawRow(
        "UANG SEBESAR",
        `Rp ${Number(data.nominal).toLocaleString("id-ID")}`,
        "#1e3a8a",
        "bold 24px Arial",
        true,
      );
      drawRow(
        "TERBILANG",
        `${terbilang(Number(data.nominal))} Rupiah`,
        "#334155",
        "italic 16px Arial",
      );
      drawRow("GUNA PEMBAYARAN", data.keterangan, "#334155", "16px Arial");

      // --- BAGIAN TTD (POJOK KANAN BAWAH) ---
      ctx.textAlign = "center";
      const ttdX = 1050; // Sumbu tengah untuk area TTD

      ctx.font = "14px Arial";
      ctx.fillStyle = "#334155";
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

      // NAMA (Atas)
      ctx.font = "bold 16px Arial";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(namaTtd, ttdX, baseHeight - 50);

      // JABATAN (Bawah Nama persis)
      ctx.font = "13px Arial";
      ctx.fillStyle = "#64748b";
      ctx.fillText(jabatanTtd, ttdX, baseHeight - 32);

      // Garis Batas TTD
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ttdX - 140, baseHeight - 45);
      ctx.lineTo(ttdX + 140, baseHeight - 45);
      ctx.stroke();

      // Cap Hijau Legal
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 11px Arial";
      ctx.fillText(
        "TERVERIFIKASI SISTEM (TTE IKA UII DIY)",
        ttdX,
        baseHeight - 15,
      );

      // --- FINISH DOWNLOAD ---
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

  // Helper cerdas pemisah baris
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
    return currentY; // Return Y terakhir untuk pijakan baris bawahnya
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 pb-10">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Pabrik Kuitansi Organisasi
          </h1>
          <p className="text-slate-500 text-sm max-w-2xl">
            Cetak kuitansi penerimaan dana resmi ber-QR Code untuk berbagai
            keperluan IKA UII. Validasi dapat diakses publik secara realtime.
          </p>
        </div>
        <div className="w-16 h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
          <img
            src="/logo-dpp-ika.png"
            alt="IKA UII DIY"
            className="w-10 h-10 object-contain"
          />
        </div>
      </div>

      {/* ELEMEN QR TERSEMBUNYI UNTUK CANVAS (DIBESARKAN RESOLUSINYA) */}
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

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* KOLOM KIRI: FORM GENERATOR */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 sticky top-24">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
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
              <h2 className="font-bold text-slate-800 text-lg">
                Buat Kuitansi Baru
              </h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* SMART SEARCH EVENT/KATEGORI */}
              <div className="sm:col-span-2 relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Kategori / Event Kuitansi
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
                    placeholder="Ketik untuk mencari atau input manual..."
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none font-bold text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
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
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
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
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-slate-700 border-b border-slate-50 last:border-0"
                        >
                          {p.namaKegiatan}
                        </div>
                      ))}
                    <div className="px-4 py-2 bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest sticky top-0 border-y border-slate-200">
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
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm font-semibold text-slate-700 border-b border-slate-50 last:border-0"
                        >
                          {e}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Telah Terima Dari
                </label>
                <input
                  type="text"
                  required
                  value={formData.terimaDari}
                  onChange={(e) =>
                    setFormData({ ...formData, terimaDari: e.target.value })
                  }
                  placeholder="Nama Lengkap / Instansi"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Nominal Uang (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.nominal}
                    onChange={(e) =>
                      setFormData({ ...formData, nominal: e.target.value })
                    }
                    placeholder="Contoh: 1500000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none font-mono font-bold text-blue-700 placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Tanggal Terima
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
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none font-medium text-slate-800"
                  />
                </div>
              </div>

              {/* SMART SEARCH PENANDATANGAN */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Otoritas Penandatangan
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
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none font-bold text-slate-800 transition-all placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
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
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
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
                          className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 flex flex-col"
                        >
                          <span className="text-sm font-bold text-slate-800">
                            {p.nama}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {p.jabatan || "Pengurus"}
                          </span>
                        </div>
                      ))}
                    {pengurusList.filter(
                      (p) =>
                        p.nama &&
                        p.nama
                          .toLowerCase()
                          .includes(formData.penandatangan.toLowerCase()),
                    ).length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-400 italic">
                        Pencarian tidak ditemukan. Anda tetap bisa menggunakan
                        ketikan ini.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Guna Pembayaran
                </label>
                <textarea
                  required
                  value={formData.keterangan}
                  onChange={(e) =>
                    setFormData({ ...formData, keterangan: e.target.value })
                  }
                  rows={3}
                  placeholder="Jelaskan rincian pembayaran..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl outline-none font-medium text-slate-800 custom-scrollbar placeholder:text-slate-400 placeholder:font-normal placeholder:text-xs"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{" "}
                    Memproses HD Canvas...
                  </>
                ) : (
                  <>Cetak Kuitansi Resmi (21x8 cm)</>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: RIWAYAT KUITANSI */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative z-10">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">
                  Riwayat Kuitansi
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Semua kuitansi yang telah di-generate.
                </p>
              </div>
              <div className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200">
                Total: {kuitansiList.length}
              </div>
            </div>

            <div className="p-4 sm:p-6 max-h-[900px] overflow-y-auto custom-scrollbar space-y-4 bg-slate-50/20">
              {kuitansiList.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 text-slate-400 text-sm font-medium">
                  {" "}
                  Belum ada riwayat pembuatan kuitansi.
                </div>
              ) : (
                kuitansiList.map((kuitansi) => (
                  <div
                    key={kuitansi.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative animate-in fade-in slide-in-from-top-1"
                  >
                    <div className="absolute top-4 right-4 bg-slate-100 text-slate-600 font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-slate-200">
                      KUIT-{kuitansi.id.substring(0, 6).toUpperCase()}
                    </div>

                    <div className="pr-24">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>
                        <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">
                          {kuitansi.jenisEvent}
                        </p>
                      </div>
                      <h3 className="font-black text-slate-800 text-lg mb-1 leading-tight">
                        {kuitansi.terimaDari}
                      </h3>
                      <p className="text-2xl font-black text-slate-950 mb-4">
                        Rp {kuitansi.nominal.toLocaleString("id-ID")}
                      </p>

                      <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="block font-bold text-slate-400 uppercase mb-0.5">
                            Tgl Terima Uang
                          </span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-slate-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>{" "}
                            {new Date(
                              kuitansi.tanggalPenerimaan,
                            ).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="border-l border-slate-200 pl-6">
                          <span className="block font-bold text-slate-400 uppercase mb-0.5">
                            Bendahara Umum (TTD)
                          </span>
                          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <svg
                              className="w-3.5 h-3.5 text-slate-400"
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
                            </svg>{" "}
                            {kuitansi.penandatangan.split(" (")[0]}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleRedownload(kuitansi)}
                        className="flex-1 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold py-2.5 px-3 rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <svg
                          className="w-3.5 h-3.5"
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
                        Download HD
                      </button>
                      <button
                        onClick={() => handleKirimWA(kuitansi)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-3 rounded-xl text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-emerald-200"
                      >
                        <svg
                          className="w-3.5 h-3.5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12.031 21.031c-1.897 0-3.694-.482-5.263-1.341l-5.834 1.534 1.564-5.69c-.939-1.62-1.436-3.483-1.436-5.434C1.062 4.475 8.536-3 17.5-3S33.938 4.475 33.938 13.438 26.464 29.912 17.5 29.912c-1.921 0-3.76-.486-5.36-1.378l-5.856 1.54 1.57-5.712c-.958-1.644-1.464-3.535-1.464-5.524 0-8.963-7.474-16.438-16.438-16.438zM17.5 1.5C10.925 1.5 5.562 6.862 5.562 13.438c0 2.115.556 4.148 1.614 5.922l.169.284-1.026 3.733 3.821-1.004.292.173c1.727 1.023 3.693 1.565 5.768 1.565 6.575 0 11.938-5.362 11.938-11.938 0-6.575-5.362-11.938-11.938-11.938zm6.541 16.275c-.358-.18-2.122-1.047-2.45-1.168-.328-.12-.567-.18-.806.18-.239.36-.926 1.168-1.135 1.408-.209.24-.418.27-.776.09-.358-.18-1.515-.558-2.881-1.776-1.063-.948-1.782-2.122-1.991-2.482-.209-.36-.022-.555.157-.735.161-.162.358-.42.537-.63.18-.21.239-.36.358-.6.12-.24.06-.45-.03-.63-.09-.18-.806-1.944-1.104-2.66-.291-.698-.586-.603-.806-.615-.209-.012-.448-.012-.687-.012-.239 0-.627.09-.955.45-.328.36-1.254 1.23-1.254 3.003 0 1.773 1.284 3.486 1.463 3.726.18.24 2.54 3.882 6.155 5.433.861.37 1.533.592 2.057.758.865.275 1.651.236 2.274.143.698-.105 2.122-.87 2.42-1.713.299-.843.299-1.563.209-1.713-.09-.15-.328-.24-.686-.42z" />
                        </svg>
                        Share ke WhatsApp
                      </button>
                      <button
                        onClick={() => handleDelete(kuitansi.id)}
                        className="px-3.5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center shadow-sm"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
