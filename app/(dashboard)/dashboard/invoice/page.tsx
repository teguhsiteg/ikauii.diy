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

export default function AdminInvoicePage() {
  const [formData, setFormData] = useState({
    jenisEvent: "",
    tagihanKepada: "",
    nominal: "",
    keterangan: "",
    tanggalPenerimaan: new Date().toISOString().split("T")[0],
    penandatangan: "",
  });

  const [prokerList, setProkerList] = useState<any[]>([]);
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [invoiceList, setInvoiceList] = useState<any[]>([]);

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

    const qInvoice = query(
      collection(db, "invoice_organisasi"),
      orderBy("createdAt", "desc"),
    );
    const unsubInvoice = onSnapshot(qInvoice, (snap) => {
      setInvoiceList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    fetchProker();
    fetchPengurus();

    return () => unsubInvoice();
  }, []);

  // --- FILTER & PAGINASI LOGIC ---
  const filteredInvoice = useMemo(() => {
    if (!searchQuery) return invoiceList;
    const lowerQuery = searchQuery.toLowerCase();
    return invoiceList.filter(
      (k) =>
        (k.tagihanKepada && k.tagihanKepada.toLowerCase().includes(lowerQuery)) ||
        (k.jenisEvent && k.jenisEvent.toLowerCase().includes(lowerQuery)) ||
        (k.nominal && k.nominal.toString().includes(lowerQuery)) ||
        (k.keterangan && k.keterangan.toLowerCase().includes(lowerQuery)),
    );
  }, [invoiceList, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  const totalPages =
    itemsPerPage === "Semua"
      ? 1
      : Math.ceil(filteredInvoice.length / itemsPerPage);

  const currentData = useMemo(() => {
    if (itemsPerPage === "Semua") return filteredInvoice;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoice.slice(start, start + itemsPerPage);
  }, [filteredInvoice, currentPage, itemsPerPage]);

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
    if (confirm("Yakin ingin menghapus invoice ini? Aksi ini permanen.")) {
      try {
        await deleteDoc(doc(db, "invoice_organisasi", id));
      } catch {
        toast.error("Gagal menghapus invoice.");
      }
    }
  };

  const handleKirimWA = (invoice: any) => {
    const text = `Halo Bapak/Ibu *${invoice.tagihanKepada}*,\n\nTerima kasih atas partisipasi dan donasi Anda pada acara *${invoice.jenisEvent}*.\n\nBerikut kami lampirkan tautan E-Invoice resmi penerimaan dana dari IKA UII DIY sebesar *Rp ${invoice.nominal.toLocaleString("id-ID")}*:\n\n🔗 ${baseUrl}/verif-invoice/${invoice.id}\n\nSalam hangat,\n*Bendahara DPW IKA UII DIY*`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const newDoc = await addDoc(collection(db, "invoice_organisasi"), {
        jenisEvent: formData.jenisEvent,
        tagihanKepada: formData.tagihanKepada,
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
      toast.error("Gagal membuat invoice.");
      setIsGenerating(false);
    }
  };

  const handleRedownload = (invoice: any) => {
    setDocIdToRender(invoice.id);
    setIsGenerating(true);
    setTimeout(() => {
      executeCanvasGeneration(invoice.id, invoice);
    }, 1000);
  };

  // =========================================================================
  // --- 🔥 ENGINE INVOICE 21x8 CM (ULTIMATE HD RESOLUTION) 🔥 ---
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
      ctx.fillText("INVOICE", 115, 70);
      ctx.font = "16px Arial";
      ctx.fillText("DPW IKA UII DIY", 115, 95);

      ctx.font = "bold 13px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(`Nomor Dokumen/Invoice:`, 40, 220);
      ctx.font = "bold 18px Arial";
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`KUIT-${id.substring(0, 8).toUpperCase()}`, 40, 245);

      const qrElement = document.getElementById(
        "qr-invoice-org",
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
      drawRow("TELAH TERIMA DARI", data.tagihanKepada, "#202124", "18px Arial");
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
      a.download = `Invoice_${cleanEventName}_${id.substring(0, 6)}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setIsGenerating(false);
      setDocIdToRender("");
      setFormData({
        jenisEvent: "",
        tagihanKepada: "",
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
            Pabrik Invoice Organisasi
          </h1>
          <p className="text-[#5F6368] text-sm max-w-2xl">
            Cetak invoice penerimaan dana resmi ber-QR Code untuk berbagai
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
            id="qr-invoice-org"
            value={`${baseUrl}/verif-invoice/${docIdToRender}`}
            size={300}
            level="H"
            includeMargin={true}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* KOLOM KIRI: FORM GENERATOR (WORKSPACE STYLE) */}
        {/* ======================================================== */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#DADCE0] sticky top-24">
            <div className="flex items-center gap-3 mb-6 border-b border-[#DADCE0] pb-4">
              <div className="w-10 h-10 bg-[#E8F0FE] text-[#1A73E8] rounded-full flex items-center justify-center shrink-0">
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
              <h2 className="font-medium text-[#202124] text-lg">
                Buat Invoice Baru
              </h2>
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* SMART SEARCH EVENT/KATEGORI */}
              <div className="sm:col-span-2 relative">
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Kategori / Event Invoice
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
                    className="w-full pl-4 pr-10 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg outline-none font-medium text-[#202124] transition-colors placeholder:text-[#9AA0A6] placeholder:font-normal text-sm"
                  />
                  <svg
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] transition-transform ${showEventDropdown ? "rotate-180" : ""}`}
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
                  <div className="absolute z-20 w-full mt-1 bg-white border border-[#DADCE0] rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 py-1">
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
                          className="px-4 py-2 hover:bg-[#F8F9FA] cursor-pointer text-sm font-medium text-[#202124]"
                        >
                          {p.namaKegiatan}
                        </div>
                      ))}
                    <div className="px-4 py-1.5 mt-1 bg-[#F8F9FA] text-[10px] font-bold text-[#5F6368] uppercase tracking-widest sticky top-0 border-y border-[#DADCE0]">
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
                          className="px-4 py-2 hover:bg-[#F8F9FA] cursor-pointer text-sm font-medium text-[#202124]"
                        >
                          {e}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Telah Terima Dari
                </label>
                <input
                  type="text"
                  required
                  value={formData.tagihanKepada}
                  onChange={(e) =>
                    setFormData({ ...formData, tagihanKepada: e.target.value })
                  }
                  placeholder="Nama Lengkap / Instansi"
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg outline-none font-medium text-[#202124] transition-colors placeholder:text-[#9AA0A6] placeholder:font-normal text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
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
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg outline-none font-mono font-bold text-[#1A73E8] transition-colors placeholder:text-[#9AA0A6] placeholder:font-normal text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
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
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg outline-none font-medium text-[#202124] transition-colors text-sm"
                  />
                </div>
              </div>

              {/* SMART SEARCH PENANDATANGAN */}
              <div className="relative">
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
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
                    className="w-full pl-4 pr-10 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg outline-none font-medium text-[#202124] transition-colors placeholder:text-[#9AA0A6] placeholder:font-normal text-sm"
                  />
                  <svg
                    className={`w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-[#5F6368] transition-transform ${showSignerDropdown ? "rotate-180" : ""}`}
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
                  <div className="absolute z-20 w-full mt-1 bg-white border border-[#DADCE0] rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1 py-1">
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
                          className="px-4 py-2 hover:bg-[#F8F9FA] cursor-pointer flex flex-col"
                        >
                          <span className="text-sm font-medium text-[#202124]">
                            {p.nama}
                          </span>
                          <span className="text-[10px] text-[#5F6368]">
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
                      <div className="px-4 py-2 text-xs text-[#9AA0A6] italic">
                        Pencarian tidak ditemukan. Anda tetap bisa menggunakan
                        ketikan ini.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
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
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] focus:border-[#1A73E8] focus:bg-white rounded-lg outline-none font-medium text-[#202124] transition-colors resize-none custom-scrollbar placeholder:text-[#9AA0A6] placeholder:font-normal text-sm"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium py-3 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
                      Memproses HD Canvas...
                    </>
                  ) : (
                    <>Cetak Invoice Resmi</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ======================================================== */}
        {/* KOLOM KANAN: RIWAYAT INVOICE (WORKSPACE STYLE) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border border-[#DADCE0] overflow-hidden flex flex-col h-full">
            {/* HEADER & CONTROLS */}
            <div className="p-5 border-b border-[#DADCE0] bg-[#F8F9FA] flex flex-col gap-4 relative z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-medium text-[#202124] text-lg">
                    Riwayat Invoice
                  </h2>
                </div>
                <div className="text-xs font-medium text-[#1A73E8] bg-[#E8F0FE] px-3 py-1 rounded border border-[#1A73E8]/20">
                  Total: {filteredInvoice.length} Dokumen
                </div>
              </div>

              {/* PENCARIAN & PAGINASI FILTER */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5F6368]"
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
                    placeholder="Cari nama, event, atau nominal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-[#DADCE0] rounded-lg text-sm bg-white focus:outline-none focus:border-[#1A73E8] transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-bold text-[#5F6368] uppercase tracking-widest">
                    Tampilkan:
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) =>
                      setItemsPerPage(
                        e.target.value === "Semua"
                          ? "Semua"
                          : Number(e.target.value),
                      )
                    }
                    className="bg-white border border-[#DADCE0] py-2 px-2 rounded-lg text-xs font-medium text-[#202124] focus:border-[#1A73E8] outline-none cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value="Semua">Semua</option>
                  </select>
                </div>
              </div>
            </div>

            {/* LIST INVOICE */}
            <div className="p-5 flex-grow overflow-y-auto custom-scrollbar bg-white">
              {currentData.length === 0 ? (
                <div className="text-center py-20 bg-[#F8F9FA] rounded-xl border border-[#DADCE0] text-[#5F6368] text-sm">
                  {searchQuery
                    ? "Tidak ditemukan invoice dengan kata kunci tersebut."
                    : "Belum ada riwayat pembuatan invoice."}
                </div>
              ) : (
                <div className="space-y-4">
                  {currentData.map((invoice, index) => {
                    const noUrut =
                      itemsPerPage === "Semua"
                        ? index + 1
                        : (currentPage - 1) * (itemsPerPage as number) +
                          index +
                          1;

                    return (
                      <div
                        key={invoice.id}
                        className="bg-white p-5 rounded-xl border border-[#DADCE0] hover:bg-[#F8F9FA] transition-colors group relative animate-in fade-in slide-in-from-top-1"
                      >
                        {/* BADGES KANAN ATAS (NO URUT & KODE INVOICE) */}
                        <div className="absolute top-4 right-4 flex items-center gap-1.5">
                          <div className="bg-[#E8F0FE] text-[#1A73E8] font-mono text-[10px] font-bold px-2 py-1 rounded border border-[#1A73E8]/20">
                            #{noUrut}
                          </div>
                          <div className="bg-[#F8F9FA] text-[#5F6368] font-mono text-[10px] font-bold px-2.5 py-1 rounded border border-[#DADCE0]">
                            KUIT-{invoice.id.substring(0, 6).toUpperCase()}
                          </div>
                        </div>

                        <div className="pr-36">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 bg-[#1E8E3E] rounded-full"></span>
                            <p className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-widest">
                              {invoice.jenisEvent}
                            </p>
                          </div>
                          <h3 className="font-medium text-[#202124] text-lg mb-1 leading-tight">
                            {invoice.tagihanKepada}
                          </h3>
                          <p className="text-xl font-bold text-[#202124] mb-4">
                            Rp {invoice.nominal.toLocaleString("id-ID")}
                          </p>

                          <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] mb-5 bg-[#F8F9FA] p-3 rounded-lg border border-[#DADCE0]">
                            <div>
                              <span className="block font-bold text-[#5F6368] uppercase mb-0.5 tracking-wider text-[9px]">
                                Tgl Terima Uang
                              </span>
                              <span className="font-medium text-[#202124] flex items-center gap-1.5">
                                <svg
                                  className="w-3 h-3 text-[#5F6368]"
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
                                </svg>
                                {new Date(
                                  invoice.tanggalPenerimaan,
                                ).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="border-l border-[#DADCE0] pl-6">
                              <span className="block font-bold text-[#5F6368] uppercase mb-0.5 tracking-wider text-[9px]">
                                Bendahara Umum (TTD)
                              </span>
                              <span className="font-medium text-[#202124] flex items-center gap-1.5">
                                <svg
                                  className="w-3 h-3 text-[#5F6368]"
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
                                {invoice.penandatangan.split(" (")[0]}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-4 border-t border-[#DADCE0]">
                          <button
                            onClick={() => handleRedownload(invoice)}
                            className="flex-1 bg-white border border-[#DADCE0] text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#1A73E8] font-medium py-2 px-3 rounded text-[11px] transition-colors flex items-center justify-center gap-1.5"
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
                            onClick={() => handleKirimWA(invoice)}
                            className="flex-1 bg-[#1E8E3E] hover:bg-[#137333] text-white font-medium py-2 px-3 rounded text-[11px] transition-colors flex items-center justify-center gap-1.5"
                          >
                            <svg
                              className="w-3.5 h-3.5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12.031 21.031c-1.897 0-3.694-.482-5.263-1.341l-5.834 1.534 1.564-5.69c-.939-1.62-1.436-3.483-1.436-5.434C1.062 4.475 8.536-3 17.5-3S33.938 4.475 33.938 13.438 26.464 29.912 17.5 29.912c-1.921 0-3.76-.486-5.36-1.378l-5.856 1.54 1.57-5.712c-.958-1.644-1.464-3.535-1.464-5.524 0-8.963-7.474-16.438-16.438-16.438zM17.5 1.5C10.925 1.5 5.562 6.862 5.562 13.438c0 2.115.556 4.148 1.614 5.922l.169.284-1.026 3.733 3.821-1.004.292.173c1.727 1.023 3.693 1.565 5.768 1.565 6.575 0 11.938-5.362 11.938-11.938 0-6.575-5.362-11.938-11.938-11.938zm6.541 16.275c-.358-.18-2.122-1.047-2.45-1.168-.328-.12-.567-.18-.806.18-.239.36-.926 1.168-1.135 1.408-.209.24-.418.27-.776.09-.358-.18-1.515-.558-2.881-1.776-1.063-.948-1.782-2.122-1.991-2.482-.209-.36-.022-.555.157-.735.161-.162.358-.42.537-.63.18-.21.239-.36.358-.6.12-.24.06-.45-.03-.63-.09-.18-.806-1.944-1.104-2.66-.291-.698-.586-.603-.806-.615-.209-.012-.448-.012-.687-.012-.239 0-.627.09-.955.45-.328.36-1.254 1.23-1.254 3.003 0 1.773 1.284 3.486 1.463 3.726.18.24 2.54 3.882 6.155 5.433.861.37 1.533.592 2.057.758.865.275 1.651.236 2.274.143.698-.105 2.122-.87 2.42-1.713.299-.843.299-1.563.209-1.713-.09-.15-.328-.24-.686-.42z" />
                            </svg>
                            Kirim WA
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="px-3 bg-white border border-[#DADCE0] text-[#D93025] hover:bg-[#FCE8E6] hover:border-[#FAD2CF] rounded transition-colors flex items-center justify-center"
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* CONTROLS PAGINASI FOOTER */}
            {itemsPerPage !== "Semua" && totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-[#DADCE0] bg-[#F8F9FA]">
                <div className="text-xs font-medium text-[#5F6368]">
                  Hal {currentPage} dari {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-[#DADCE0] rounded bg-white text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#1A73E8] disabled:opacity-50 transition-colors text-xs font-medium"
                  >
                    Prev
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-[#DADCE0] rounded bg-white text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#1A73E8] disabled:opacity-50 transition-colors text-xs font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
