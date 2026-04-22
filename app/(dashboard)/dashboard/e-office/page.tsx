"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// --- TEMPLATE SURAT OTOMATIS (DENGAN MUKADDIMAH) ---
const SURAT_TEMPLATES: Record<string, any> = {
  "Surat Undangan": {
    perihal: "Undangan Rapat Koordinasi",
    tujuan: "Seluruh Pengurus DPW IKA UII DIY",
    tempatTujuan: "Di Tempat",
    atributStyle: "split",
    isiSurat: `Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nAlhamdulillahi rabbil ‘alamin, segala puji bagi Allah Subhanahu Wa Ta’ala yang telah melimpahkan rahmat dan hidayah-Nya kepada kita semua. Shalawat serta salam semoga senantiasa tercurah kepada junjungan kita, Nabi Muhammad Shallallahu ‘Alaihi Wasallam, beserta keluarga, sahabat, dan pengikutnya hingga akhir zaman.\n\nSehubungan dengan akan dilaksanakannya program kerja strategis, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada:\n\n<table style="width:100%; border:none; text-align:left; margin-top:8px; margin-bottom:8px;"><tbody><tr><td style="width:110px; vertical-align:top; padding-bottom:6px;">Hari/Tanggal</td><td style="width:20px; vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;"><b>Sabtu, 14 Maret 2026</b></td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Waktu</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">19.30 WIB - Selesai</td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Tempat</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Sekretariat DPW IKA UII DIY</td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Agenda</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Rapat Koordinasi Wilayah</td></tr></tbody></table>\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya diucapkan terima kasih.\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.`,
  },

  "Surat Tugas": {
    perihal: "Pemberian Tugas Kepengurusan",
    tujuan: "Nama Penerima Tugas",
    tempatTujuan: "Di Tempat",
    atributStyle: "center",
    isiSurat: `Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nAlhamdulillahi rabbil ‘alamin, segala puji bagi Allah Subhanahu Wa Ta’ala yang telah melimpahkan rahmat dan hidayah-Nya kepada kita semua. Shalawat serta salam semoga senantiasa tercurah kepada junjungan kita, Nabi Muhammad Shallallahu ‘Alaihi Wasallam, beserta keluarga, sahabat, dan pengikutnya hingga akhir zaman.\n\nDewan Pimpinan Wilayah Ikatan Keluarga Alumni Universitas Islam Indonesia (DPW IKA UII) Daerah Istimewa Yogyakarta, dengan ini memberikan tugas kepada:\n\n<table style="width:100%; border:none; text-align:left; margin-top:8px; margin-bottom:8px;"><tbody><tr><td style="width:90px; vertical-align:top; padding-bottom:6px;">Nama</td><td style="width:20px; vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;"><b>[Nama Penerima Tugas]</b></td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Jabatan</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">[Jabatan Penerima Tugas]</td></tr></tbody></table>\n\nUntuk melaksanakan tugas sebagai <b>[Sebutkan Nama Tugas/Kegiatan]</b> yang akan diselenggarakan pada tanggal [Sebutkan Tanggal].\n\nDemikian surat tugas ini dibuat agar dapat dilaksanakan dengan penuh tanggung jawab.\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.`,
  },

  "Surat Keterangan": {
    perihal: "Surat Keterangan Aktif",
    tujuan: "Pihak yang Berkepentingan",
    tempatTujuan: "Di Tempat",
    atributStyle: "split",
    isiSurat: `Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nAlhamdulillahi rabbil ‘alamin, segala puji bagi Allah Subhanahu Wa Ta’ala yang telah melimpahkan rahmat dan hidayah-Nya kepada kita semua. Shalawat serta salam semoga senantiasa tercurah kepada junjungan kita, Nabi Muhammad Shallallahu ‘Alaihi Wasallam, beserta keluarga, sahabat, dan pengikutnya hingga akhir zaman.\n\nYang bertanda tangan di bawah ini, Ketua Umum DPW IKA UII Daerah Istimewa Yogyakarta, menerangkan dengan sesungguhnya bahwa:\n\n<table style="width:100%; border:none; text-align:left; margin-top:8px; margin-bottom:8px;"><tbody><tr><td style="width:90px; vertical-align:top; padding-bottom:6px;">Nama</td><td style="width:20px; vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;"><b>[Nama Anggota]</b></td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Jabatan</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">[Jabatan Anggota]</td></tr></tbody></table>\n\nAdalah benar merupakan pengurus aktif di DPW IKA UII Daerah Istimewa Yogyakarta periode berjalan dan memiliki dedikasi yang baik terhadap organisasi.\n\nSurat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.`,
  },

  "Surat Keputusan (SK)": {
    perihal: "Surat Keputusan Pengangkatan",
    tujuan: "Arsip Organisasi",
    tempatTujuan: "Yogyakarta",
    atributStyle: "center",
    isiSurat: `Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nAlhamdulillahi rabbil ‘alamin, segala puji bagi Allah Subhanahu Wa Ta’ala yang telah melimpahkan rahmat dan hidayah-Nya kepada kita semua. Shalawat serta salam semoga senantiasa tercurah kepada junjungan kita, Nabi Muhammad Shallallahu ‘Alaihi Wasallam, beserta keluarga, sahabat, dan pengikutnya hingga akhir zaman.\n\n<b>MEMUTUSKAN</b>\n\nMenetapkan:\n\n<table style="width:100%; border:none; text-align:left; margin-top:8px; margin-bottom:8px;"><tbody><tr><td style="width:90px; vertical-align:top; padding-bottom:6px;">PERTAMA</td><td style="width:20px; vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Mengangkat nama-nama terlampir sebagai Panitia Kegiatan [Nama Kegiatan].</td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">KEDUA</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Panitia wajib memberikan laporan pertanggungjawaban setelah kegiatan selesai.</td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">KETIGA</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Keputusan ini berlaku sejak tanggal ditetapkan.</td></tr></tbody></table>\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.`,
  },

  "Surat Edaran": {
    perihal: "Edaran Menghadiri Acara",
    tujuan: "Seluruh Anggota IKA UII DIY",
    tempatTujuan: "Di Wilayah Masing-masing",
    atributStyle: "split",
    isiSurat: `Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nAlhamdulillahi rabbil ‘alamin, segala puji bagi Allah Subhanahu Wa Ta’ala yang telah melimpahkan rahmat dan hidayah-Nya kepada kita semua. Shalawat serta salam semoga senantiasa tercurah kepada junjungan kita, Nabi Muhammad Shallallahu ‘Alaihi Wasallam, beserta keluarga, sahabat, dan pengikutnya hingga akhir zaman.\n\nDalam rangka mempererat tali silaturahmi antar alumni, kami menghimbau kepada seluruh anggota untuk turut serta berpartisipasi dalam agenda rutin bulanan yang akan datang.\n\nInformasi lebih rinci terkait pelaksanaan akan disampaikan melalui kanal resmi komunikasi organisasi (Grup WhatsApp/Email).\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.`,
  },
};

const INITIAL_STATE = {
  jenisSurat: "Surat Undangan",
  customJenisSurat: "",
  nomorSurat: "---/DPW-IKA-UII/DIY/III/2026",
  tanggalSurat: new Date().toISOString().split("T")[0],
  lampiran: "-",
  daftarUndangan: "",
  ...SURAT_TEMPLATES["Surat Undangan"],
  namaPenandatangan1: "",
  jabatanPenandatangan1: "Ketua Umum",
  namaPenandatangan2: "",
  jabatanPenandatangan2: "Sekretaris Umum",
};

export default function EOfficePage() {
  const [isPrinting, setIsGenerating] = useState(false);
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [formData, setFormData] = useState(INITIAL_STATE);

  // --- STATE STYLING ---
  const [kopAlign, setKopAlign] = useState("text-center");
  const [kopScale, setKopScale] = useState(1);
  const [atributStyle, setAtributStyle] = useState("split");
  const [headerAlign, setHeaderAlign] = useState("text-left");
  const [textAlign, setTextAlign] = useState("text-justify");

  // --- STATE MODAL GENERATOR NOMOR ---
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [genForm, setGenForm] = useState({
    jenis: "Surat Biasa",
    kategori: "Eksternal",
    template: "[NO]/[KODE]/DPW-IKA-UII/[BLN]/[THN]",
    unit: "DPW IKA UII DIY",
    index: "ORG (Organisasi)",
    penandatangan: "Ketua Umum",
    perihal: "",
    tglMasehi: new Date().toISOString().split("T")[0],
    tglHijriah: "4",
    blnHijriah: "Zulkaidah",
    thnHijriah: "1447",
    nomorUrut: "001",
    preview: "",
  });

  useEffect(() => {
    const fetchPengurus = async () => {
      try {
        const q = query(collection(db, "pengurus"), orderBy("jabatan", "asc"));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => doc.data());
        setPengurusList(data);

        const ketua = data.find((p) =>
          p.jabatan?.toLowerCase().includes("ketua umum"),
        );
        const sekum = data.find(
          (p) =>
            p.jabatan?.toLowerCase().includes("sekum") ||
            p.jabatan?.toLowerCase().includes("sekretaris"),
        );

        setFormData((prev: any) => ({
          ...prev,
          namaPenandatangan1: ketua
            ? ketua.nama
            : "H. Harda Kiswaya, S.E., M.Si.",
          namaPenandatangan2: sekum ? sekum.nama : "Sekretaris Umum",
        }));
      } catch (error) {}
    };
    fetchPengurus();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    if (name === "jenisSurat") {
      if (value === "Lainnya") {
        setFormData({ ...formData, jenisSurat: value, customJenisSurat: "" });
      } else {
        const template =
          SURAT_TEMPLATES[value] || SURAT_TEMPLATES["Surat Undangan"];
        setFormData({
          ...formData,
          jenisSurat: value,
          customJenisSurat: "",
          perihal: template.perihal,
          tujuan: template.tujuan,
          tempatTujuan: template.tempatTujuan,
          isiSurat: template.isiSurat,
        });
        setAtributStyle(template.atributStyle || "split");
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleReset = () => {
    if (confirm("Yakin ingin mengembalikan form ke setelan awal?")) {
      setFormData({
        ...INITIAL_STATE,
        namaPenandatangan1: formData.namaPenandatangan1,
        namaPenandatangan2: formData.namaPenandatangan2,
      });
      setKopAlign("text-center");
      setKopScale(1);
      setAtributStyle("split");
      setHeaderAlign("text-left");
      setTextAlign("text-justify");
    }
  };

  const handlePrint = () => {
    setIsGenerating(true);
    setTimeout(() => {
      window.print();
      setIsGenerating(false);
    }, 500);
  };

  const formatTanggal = (dateString: string) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = {
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };

  const renderFormattedText = (text: string) => {
    if (!text) return null;
    return text.split("\n").map((paragraph, index) => {
      let formattedHtml = paragraph
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/_(.*?)_/g, "<em>$1</em>");
      return (
        <div
          key={index}
          className={`mb-2 ${textAlign}`}
          dangerouslySetInnerHTML={{ __html: formattedHtml || "&nbsp;" }}
        />
      );
    });
  };

  // --- LOGIKA GENERATOR NOMOR ---
  useEffect(() => {
    const arrBulan = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    const d = new Date(genForm.tglMasehi);
    const bln = isNaN(d.getTime()) ? "..." : arrBulan[d.getMonth()];
    const thn = isNaN(d.getTime()) ? "..." : d.getFullYear().toString();
    const kode = genForm.index.split(" ")[0];
    let result = genForm.template
      .replace("[NO]", genForm.nomorUrut || "...")
      .replace("[KODE]", kode)
      .replace("[BLN]", bln)
      .replace("[THN]", thn);
    setGenForm((prev) => ({ ...prev, preview: result }));
  }, [genForm.template, genForm.nomorUrut, genForm.index, genForm.tglMasehi]);

  const handleSaveNomor = () => {
    setFormData((prev) => ({
      ...prev,
      nomorSurat: genForm.preview,
      perihal: genForm.perihal || prev.perihal,
      tanggalSurat: genForm.tglMasehi,
    }));
    setIsGeneratorOpen(false);
  };

  const jenisSuratAktif =
    formData.jenisSurat === "Lainnya"
      ? formData.customJenisSurat
      : formData.jenisSurat;

  // --- KOMPONEN KOP & FOOTER REUSABLE ---
  const KopSurat = () => (
    <div className="flex items-center justify-between border-b-[3px] border-black pb-4 mb-1 relative">
      <div className="w-[100px] sm:w-[110px] flex-shrink-0 relative z-10 pl-2">
        <img
          src="/logo-dpp-ika.png"
          alt="Logo UII"
          className="w-full h-auto object-contain print:w-[22mm]"
        />
      </div>
      <div
        className={`flex-1 ${kopAlign} px-4`}
        style={{
          transform: `scale(${kopScale})`,
          transformOrigin:
            kopAlign === "text-left"
              ? "left center"
              : kopAlign === "text-right"
                ? "right center"
                : "center center",
        }}
      >
        <h3 className="text-[13px] sm:text-sm print:text-[13pt] font-bold tracking-wider mb-0.5">
          DEWAN PIMPINAN WILAYAH
        </h3>
        <h2 className="text-[17px] sm:text-[19px] print:text-[17pt] font-black tracking-widest text-[#152B5B] uppercase mb-0.5">
          Ikatan Keluarga Alumni Universitas Islam Indonesia
        </h2>
        <h2 className="text-[15px] sm:text-[17px] print:text-[15pt] font-black tracking-widest uppercase">
          DAERAH ISTIMEWA YOGYAKARTA
        </h2>
        <p className="text-[9px] sm:text-[10px] print:text-[9.5pt] mt-1.5 font-sans text-slate-800">
          Sekretariat: Kampus Terpadu UII, Jl. Kaliurang KM 14.5 Sleman,
          Yogyakarta
          <br />
          Email: dpw.diy@ika.uii.ac.id | Website: ikadiy.uii.ac.id | IG:
          @ikauii.diy
        </p>
      </div>
      <div className="w-[100px] sm:w-[110px] flex-shrink-0 invisible"></div>
    </div>
  );

  const FooterSurat = () => (
    <div className="absolute bottom-[20mm] left-[20mm] right-[20mm] border-t border-slate-400 pt-2 flex justify-between text-[9pt] italic text-slate-500 font-sans print:fixed print:bottom-0 print:left-0 print:right-0 print:mx-[20mm] print:mb-[15mm]">
      <span>Dokumen Resmi DPW IKA UII DIY</span>
      <span>
        Dicetak otomatis pada: {new Date().toLocaleDateString("id-ID")}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans selection:bg-blue-100 selection:text-blue-900 print:bg-white print:p-0">
      <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 pt-6 px-4 sm:px-6 lg:px-8 print:px-0 print:pt-0">
        {/* --- HEADER ACTION BAR --- */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 print:hidden sticky top-6 z-20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-[#152B5B] rounded-full flex items-center justify-center shrink-0">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#152B5B] tracking-tight">
                Sistem Generate Surat
              </h1>
              <p className="text-slate-500 text-sm mt-0.5 font-medium">
                Buat, sesuaikan redaksi, dan cetak dokumen PDF instan.
              </p>
            </div>
          </div>
          <div className="flex w-full sm:w-auto gap-3">
            <button
              onClick={handleReset}
              className="flex-1 sm:flex-none bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              Reset
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none bg-[#152B5B] hover:bg-blue-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              {isPrinting ? "Menyiapkan..." : "Cetak Dokumen"}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start relative">
          {/* ========================================================
              KOLOM KIRI: FORM KONTROL EDITOR
              ======================================================== */}
          <div className="lg:col-span-5 space-y-6 print:hidden">
            {/* SECTION 1: KOP & ATRIBUT */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#152B5B] mb-5 flex items-center gap-2 text-sm uppercase tracking-widest border-b border-slate-100 pb-3">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37]"></span>{" "}
                Atribut & Format Dokumen
              </h3>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Perataan Kop
                    </label>
                    <div className="flex bg-slate-50 rounded-lg p-1 gap-1 border border-slate-200">
                      <button
                        onClick={() => setKopAlign("text-left")}
                        className={`flex-1 flex justify-center py-2 rounded-md transition-colors ${kopAlign === "text-left" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h10M4 18h16"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => setKopAlign("text-center")}
                        className={`flex-1 flex justify-center py-2 rounded-md transition-colors ${kopAlign === "text-center" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M7 12h10M4 18h16"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => setKopAlign("text-right")}
                        className={`flex-1 flex justify-center py-2 rounded-md transition-colors ${kopAlign === "text-right" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M10 12h10M4 18h16"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                      Skala Font Kop
                    </label>
                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-1 px-2 h-[38px]">
                      <button
                        onClick={() =>
                          setKopScale((s) => Math.max(0.7, s - 0.1))
                        }
                        className="p-1 rounded hover:bg-white text-slate-500 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 12H4"
                          ></path>
                        </svg>
                      </button>
                      <span className="text-[11px] font-bold text-[#152B5B] w-8 text-center">
                        {Math.round(kopScale * 100)}%
                      </span>
                      <button
                        onClick={() =>
                          setKopScale((s) => Math.min(1.3, s + 0.1))
                        }
                        className="p-1 rounded hover:bg-white text-slate-500 transition-colors"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                    Tata Letak Atribut
                  </label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 gap-1 text-[9px] font-bold uppercase tracking-wider">
                    <button
                      onClick={() => setAtributStyle("split")}
                      className={`px-4 py-2 rounded-md transition-colors ${atributStyle === "split" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-500"}`}
                    >
                      Standar (Kiri)
                    </button>
                    <button
                      onClick={() => setAtributStyle("center")}
                      className={`px-4 py-2 rounded-md transition-colors ${atributStyle === "center" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-500"}`}
                    >
                      Tengah (SK)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Template Jenis Surat{" "}
                    <span className="text-slate-400 font-normal italic">
                      (Otomatis mengatur redaksi)
                    </span>
                  </label>
                  <select
                    name="jenisSurat"
                    value={formData.jenisSurat}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-bold text-[#152B5B] focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1A73E8] outline-none transition-all cursor-pointer mb-2"
                  >
                    <option value="Surat Undangan">Surat Undangan</option>
                    <option value="Surat Tugas">Surat Tugas</option>
                    <option value="Surat Keterangan">Surat Keterangan</option>
                    <option value="Surat Keputusan (SK)">
                      Surat Keputusan (SK)
                    </option>
                    <option value="Surat Edaran">Surat Edaran</option>
                    <option value="Lainnya">Lainnya (Ketik Sendiri)...</option>
                  </select>
                  {formData.jenisSurat === "Lainnya" && (
                    <input
                      type="text"
                      name="customJenisSurat"
                      placeholder="Masukkan Jenis Surat..."
                      value={formData.customJenisSurat}
                      onChange={handleChange}
                      className="w-full bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-xl text-sm font-bold text-yellow-900 focus:bg-white focus:ring-2 focus:ring-yellow-100 focus:border-yellow-500 outline-none transition-all"
                    />
                  )}
                </div>

                <div className="grid grid-cols-5 gap-3 relative">
                  <div className="col-span-3">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Nomor Surat
                    </label>
                    <input
                      type="text"
                      name="nomorSurat"
                      value={formData.nomorSurat}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1A73E8] outline-none transition-all font-mono font-bold"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[11px] font-bold text-transparent uppercase tracking-wide mb-1.5 select-none">
                      Action
                    </label>
                    <button
                      onClick={() => setIsGeneratorOpen(true)}
                      className="w-full bg-[#152B5B] hover:bg-blue-900 text-white font-bold text-xs py-2.5 rounded-xl shadow-sm transition-colors h-[42px] whitespace-nowrap px-2"
                    >
                      + Buat Nomor
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Tanggal Surat
                    </label>
                    <input
                      type="date"
                      name="tanggalSurat"
                      value={formData.tanggalSurat}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1A73E8] outline-none transition-all font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                      Perihal
                    </label>
                    <input
                      type="text"
                      name="perihal"
                      value={formData.perihal}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1A73E8] outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: PENERIMA & ISI */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#152B5B] mb-5 flex items-center gap-2 text-sm uppercase tracking-widest border-b border-slate-100 pb-3">
                <span className="w-2 h-2 rounded-full bg-[#1A73E8]"></span>{" "}
                Redaksi & Konten Surat
              </h3>
              <div className="space-y-5">
                <div className="flex flex-col gap-1.5 border-b border-slate-100 pb-4">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Perataan Teks Penerima
                    </label>
                    <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 gap-1">
                      <button
                        onClick={() => setHeaderAlign("text-left")}
                        className={`p-1.5 rounded-md transition-colors ${headerAlign === "text-left" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h10M4 18h16"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => setHeaderAlign("text-center")}
                        className={`p-1.5 rounded-md transition-colors ${headerAlign === "text-center" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M7 12h10M4 18h16"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => setHeaderAlign("text-right")}
                        className={`p-1.5 rounded-md transition-colors ${headerAlign === "text-right" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M10 12h10M4 18h16"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <input
                      type="text"
                      name="tujuan"
                      placeholder="Kepada Yth. / Nama"
                      value={formData.tujuan}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm font-semibold focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1A73E8] outline-none transition-all"
                    />
                    <input
                      type="text"
                      name="tempatTujuan"
                      placeholder="Di Tempat"
                      value={formData.tempatTujuan}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2.5 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1A73E8] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      Badan Surat
                    </label>
                    <div className="flex bg-slate-50 border border-slate-200 rounded-lg p-1 gap-1">
                      <button
                        onClick={() => setTextAlign("text-left")}
                        className={`p-1.5 rounded-md transition-colors ${textAlign === "text-left" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h10M4 18h16"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => setTextAlign("text-center")}
                        className={`p-1.5 rounded-md transition-colors ${textAlign === "text-center" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M7 12h10M4 18h16"
                          ></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => setTextAlign("text-justify")}
                        className={`p-1.5 rounded-md transition-colors ${textAlign === "text-justify" ? "bg-white shadow-sm text-[#1A73E8]" : "text-slate-400"}`}
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          ></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <textarea
                    name="isiSurat"
                    value={formData.isiSurat}
                    onChange={handleChange}
                    rows={12}
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1A73E8] outline-none leading-relaxed resize-y font-sans transition-all custom-scrollbar"
                  ></textarea>
                  <p className="text-[10px] font-medium text-slate-500 mt-2 bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-start gap-1.5">
                    <span className="text-yellow-600 text-sm leading-none">
                      💡
                    </span>
                    <span>
                      Gunakan tanda bintang{" "}
                      <code className="bg-white px-1 py-0.5 rounded border border-slate-200">
                        **teks**
                      </code>{" "}
                      untuk menebalkan kata, atau garis bawah{" "}
                      <code className="bg-white px-1 py-0.5 rounded border border-slate-200">
                        _teks_
                      </code>{" "}
                      untuk memiringkan.
                    </span>
                  </p>
                </div>

                {/* LAMPIRAN KHUSUS UNDANGAN */}
                {(formData.jenisSurat === "Surat Undangan" ||
                  (formData.jenisSurat === "Lainnya" &&
                    formData.customJenisSurat
                      .toLowerCase()
                      .includes("undangan"))) && (
                  <div className="pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center justify-between">
                      <span>Daftar Nama Undangan (Halaman Lampiran)</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded normal-case">
                        Pisahkan dengan Enter
                      </span>
                    </label>
                    <textarea
                      name="daftarUndangan"
                      value={formData.daftarUndangan}
                      onChange={handleChange}
                      rows={5}
                      placeholder="1. Bapak Ahmad&#10;2. Ibu Siti&#10;..."
                      className="w-full bg-blue-50/30 border border-blue-200 p-4 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-[#1A73E8] outline-none leading-relaxed resize-y font-sans transition-all custom-scrollbar placeholder:text-blue-300"
                    ></textarea>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: TANDA TANGAN */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="font-bold text-[#152B5B] mb-5 flex items-center gap-2 text-sm uppercase tracking-widest border-b border-slate-100 pb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                Otorisasi / Tanda Tangan
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center border-b border-slate-200 pb-2">
                    Pejabat Posisi Kiri
                  </label>
                  <input
                    type="text"
                    name="jabatanPenandatangan1"
                    placeholder="Jabatan (Opsional)"
                    value={formData.jabatanPenandatangan1}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs text-center focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <input
                    type="text"
                    name="namaPenandatangan1"
                    placeholder="Kosongkan jika tak perlu"
                    value={formData.namaPenandatangan1}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center border-b border-slate-200 pb-2">
                    Pejabat Posisi Kanan
                  </label>
                  <input
                    type="text"
                    name="jabatanPenandatangan2"
                    placeholder="Jabatan"
                    value={formData.jabatanPenandatangan2}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs text-center focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <input
                    type="text"
                    name="namaPenandatangan2"
                    placeholder="Nama Lengkap"
                    value={formData.namaPenandatangan2}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-lg text-xs font-bold text-center focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              KOLOM KANAN: LIVE PREVIEW KERTAS A4 DENGAN FONT CAMBRIA
              ======================================================== */}
          <div className="lg:col-span-7 lg:sticky lg:top-28 print:static">
            <div className="w-full max-h-[calc(100vh-10rem)] overflow-y-auto overflow-x-auto pb-4 custom-scrollbar rounded-xl print:max-h-none print:overflow-visible">
              {/* KERTAS A4 UTAMA */}
              <div
                className="bg-white mx-auto shadow-2xl shadow-slate-300/60 print:shadow-none print:ring-0 text-black leading-snug shrink-0 relative
                            w-[800px] min-h-[1131px] p-[60px] pb-[30mm]
                            sm:w-[700px] sm:min-h-[990px] sm:p-[50px]
                            lg:w-[794px] lg:min-h-[1123px] lg:p-[70px]
                            print:w-[210mm] print:min-h-[297mm] print:max-w-none print:p-[20mm] print:pb-[30mm] print:m-0"
                style={{ fontFamily: "Cambria, Georgia, serif" }}
              >
                <KopSurat />
                <div className="w-full border-b border-black mb-8"></div>

                {atributStyle === "split" ? (
                  <div className="flex justify-between items-start text-[11pt] lg:text-[12pt] print:text-[12pt] mb-10">
                    <div>
                      <table className="border-none text-left">
                        <tbody>
                          <tr>
                            <td className="pr-4 pb-1 align-top">Nomor</td>
                            <td className="pb-1 align-top">
                              : {formData.nomorSurat}
                            </td>
                          </tr>
                          {formData.lampiran && formData.lampiran !== "-" && (
                            <tr>
                              <td className="pr-4 pb-1 align-top">Lampiran</td>
                              <td className="pb-1 align-top">
                                : {formData.lampiran}
                              </td>
                            </tr>
                          )}
                          <tr>
                            <td className="pr-4 align-top">Hal</td>
                            <td className="font-bold align-top">
                              : {formData.perihal}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="text-right">
                      Yogyakarta, {formatTanggal(formData.tanggalSurat)}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-[11pt] lg:text-[12pt] print:text-[12pt] mb-12">
                    <h3 className="font-bold uppercase underline text-[13pt] print:text-[14pt] mb-1 tracking-wider">
                      {jenisSuratAktif}
                    </h3>
                    <p>Nomor: {formData.nomorSurat}</p>
                  </div>
                )}

                {!(atributStyle === "center" && !formData.tujuan) && (
                  <div
                    className={`text-[11pt] lg:text-[12pt] print:text-[12pt] mb-10 ${headerAlign}`}
                  >
                    <p>Kepada Yth.</p>
                    <p className="font-bold">{formData.tujuan}</p>
                    <p>{formData.tempatTujuan}</p>
                  </div>
                )}

                <div className="text-[11pt] lg:text-[12pt] print:text-[12pt] leading-relaxed mb-16 min-h-[300px]">
                  {renderFormattedText(formData.isiSurat)}
                </div>

                <div className="relative break-inside-avoid mt-auto">
                  {atributStyle === "center" && (
                    <div className="text-right text-[11pt] lg:text-[12pt] print:text-[12pt] mb-4 pr-8">
                      Ditetapkan di: Yogyakarta
                      <br />
                      Pada tanggal: {formatTanggal(formData.tanggalSurat)}
                    </div>
                  )}

                  <div
                    className={`flex text-[11pt] lg:text-[12pt] print:text-[12pt] text-center mt-8 px-4 ${!formData.namaPenandatangan1 ? "justify-end" : "justify-between"}`}
                  >
                    {formData.namaPenandatangan1 && (
                      <div className="w-64 flex flex-col items-center">
                        <p className="mb-24">
                          {formData.jabatanPenandatangan1},
                        </p>
                        <p className="font-bold underline normal-case">
                          {formData.namaPenandatangan1}
                        </p>
                      </div>
                    )}
                    <div className="w-64 flex flex-col items-center">
                      <p className="mb-24">{formData.jabatanPenandatangan2},</p>
                      <p className="font-bold underline normal-case">
                        {formData.namaPenandatangan2}
                      </p>
                    </div>
                  </div>
                </div>

                <FooterSurat />
              </div>

              {/* KERTAS LAMPIRAN (HANYA MUNCUL JIKA ADA DAFTAR UNDANGAN) */}
              {formData.daftarUndangan &&
                (formData.jenisSurat === "Surat Undangan" ||
                  (formData.jenisSurat === "Lainnya" &&
                    formData.customJenisSurat
                      .toLowerCase()
                      .includes("undangan"))) && (
                  <div
                    className="bg-white mx-auto shadow-2xl shadow-slate-300/60 print:shadow-none print:ring-0 text-black leading-snug shrink-0 mt-8 print:mt-0 print:break-before-page relative
                              w-[800px] min-h-[1131px] p-[60px] pb-[30mm]
                              sm:w-[700px] sm:min-h-[990px] sm:p-[50px]
                              lg:w-[794px] lg:min-h-[1123px] lg:p-[70px]
                              print:w-[210mm] print:min-h-[297mm] print:max-w-none print:p-[20mm] print:pb-[30mm] print:m-0"
                    style={{ fontFamily: "Cambria, Georgia, serif" }}
                  >
                    <KopSurat />
                    <div className="w-full border-b border-black mb-8"></div>

                    <h3 className="text-center font-bold text-[12pt] underline mb-6">
                      LAMPIRAN {jenisSuratAktif.toUpperCase()}
                    </h3>
                    <table className="text-[11pt] mb-6">
                      <tbody>
                        <tr>
                          <td className="pr-4 py-1 align-top">Nomor</td>
                          <td className="py-1 align-top">
                            : {formData.nomorSurat}
                          </td>
                        </tr>
                        <tr>
                          <td className="pr-4 py-1 align-top">Tanggal</td>
                          <td className="py-1 align-top">
                            : {formatTanggal(formData.tanggalSurat)}
                          </td>
                        </tr>
                        <tr>
                          <td className="pr-4 py-1 align-top">Perihal</td>
                          <td className="font-bold py-1 align-top">
                            : {formData.perihal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <p className="font-bold text-[11pt] mb-2">
                      Daftar Nama yang Diundang:
                    </p>
                    <ol className="pl-6 text-[11pt] space-y-2">
                      {formData.daftarUndangan
                        .split("\n")
                        .filter((n) => n.trim())
                        .map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                    </ol>

                    <FooterSurat />
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL GENERATOR NOMOR SURAT 
          ======================================================== */}
      {isGeneratorOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="bg-white px-6 py-4 border-b border-blue-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black text-[#152B5B]">
                Buat Nomor Surat
              </h2>
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="text-slate-400 hover:text-rose-500 font-bold px-2 py-1 bg-slate-100 rounded hover:bg-rose-50 transition-colors"
              >
                X
              </button>
            </div>
            <div className="p-6 overflow-y-auto bg-slate-50/50">
              <h3 className="text-sm font-bold text-[#1A73E8] mb-4">
                Isian nomor surat
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Jenis surat <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genForm.jenis}
                    onChange={(e) =>
                      setGenForm({ ...genForm, jenis: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                  >
                    <option value="Surat Biasa">Surat Biasa</option>
                    <option value="Surat Keputusan">Surat Keputusan</option>
                    <option value="Surat Tugas">Surat Tugas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Kategori surat <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genForm.kategori}
                    onChange={(e) =>
                      setGenForm({ ...genForm, kategori: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                  >
                    <option value="Eksternal">Eksternal</option>
                    <option value="Internal">Internal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Unit pengirim <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genForm.unit}
                    onChange={(e) =>
                      setGenForm({ ...genForm, unit: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                  >
                    <option value="DPW IKA UII DIY">DPW IKA UII DIY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Template nomor <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genForm.template}
                    onChange={(e) =>
                      setGenForm({ ...genForm, template: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                  >
                    <option value="[NO]/DPW-IKA-UII/DIY/[KODE]/[BLN]/[THN]">
                      [NO]/DPW-IKA-UII/DIY/[KODE]/[BLN]/[THN]
                    </option>
                    <option value="[NO]/[KODE]/DPW-IKA-UII/DIY/[BLN]/[THN]">
                      [NO]/[KODE]/DPW-IKA-UII/DIY/[BLN]/[THN]
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Penandatangan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genForm.penandatangan}
                    onChange={(e) =>
                      setGenForm({ ...genForm, penandatangan: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                  >
                    <option value="Ketua Umum">Ketua Umum</option>
                    <option value="Sekretaris Umum">Sekretaris Umum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Index (Kode Masalah){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={genForm.index}
                    onChange={(e) =>
                      setGenForm({ ...genForm, index: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                  >
                    <option value="ORG (Organisasi)">ORG (Organisasi)</option>
                    <option value="KEU (Keuangan)">KEU (Keuangan)</option>
                    <option value="KSH (Kesejahteraan)">
                      KSH (Kesejahteraan)
                    </option>
                    <option value="MOU (Kerjasama)">MOU (Kerjasama)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Tanggal surat (Masehi){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={genForm.tglMasehi}
                    onChange={(e) =>
                      setGenForm({ ...genForm, tglMasehi: e.target.value })
                    }
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Tanggal surat (Hijriah){" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={genForm.tglHijriah}
                      onChange={(e) =>
                        setGenForm({ ...genForm, tglHijriah: e.target.value })
                      }
                      className="w-16 bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 text-center outline-none focus:border-[#1A73E8]"
                    />
                    <select
                      value={genForm.blnHijriah}
                      onChange={(e) =>
                        setGenForm({ ...genForm, blnHijriah: e.target.value })
                      }
                      className="flex-1 bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                    >
                      {[
                        "Muharram",
                        "Safar",
                        "Rabi'ul Awal",
                        "Rabi'ul Akhir",
                        "Jumadil Awal",
                        "Jumadil Akhir",
                        "Rajab",
                        "Sya'ban",
                        "Ramadan",
                        "Syawal",
                        "Zulkaidah",
                        "Zulhijjah",
                      ].map((bln) => (
                        <option key={bln} value={bln}>
                          {bln}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={genForm.thnHijriah}
                      onChange={(e) =>
                        setGenForm({ ...genForm, thnHijriah: e.target.value })
                      }
                      className="w-20 bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 text-center outline-none focus:border-[#1A73E8]"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                    Perihal <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={genForm.perihal}
                    onChange={(e) =>
                      setGenForm({ ...genForm, perihal: e.target.value })
                    }
                    placeholder="Isi perihal singkat surat"
                    className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm text-slate-700 outline-none focus:border-[#1A73E8]"
                  />
                </div>
              </div>
              <div className="bg-slate-100/50 p-5 border border-blue-100 rounded-xl mb-2">
                <h3 className="text-sm font-bold text-[#152B5B] mb-4">
                  Generate nomor surat
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                      Nomor urut <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={genForm.nomorUrut}
                      onChange={(e) =>
                        setGenForm({ ...genForm, nomorUrut: e.target.value })
                      }
                      className="w-full bg-white border border-slate-300 px-3 py-2 rounded text-sm font-mono text-slate-800 outline-none focus:border-[#1A73E8]"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Nomor urut dapat diubah sesuai urutan terakhir.
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1.5">
                      Preview nomor surat{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={genForm.preview}
                      className="w-full bg-blue-50 border border-blue-200 px-3 py-2 rounded text-sm font-mono font-bold text-blue-900 outline-none select-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 italic">
                      Nomor surat otomatis ter-generate dari isian di atas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white px-6 py-4 border-t border-slate-200 flex justify-center gap-3 shrink-0">
              <button
                onClick={() => setIsGeneratorOpen(false)}
                className="px-8 py-2.5 rounded-lg border border-[#152B5B] text-[#152B5B] font-bold text-sm hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveNomor}
                className="px-8 py-2.5 rounded-lg bg-[#152B5B] text-white font-bold text-sm hover:bg-blue-900 shadow-md transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
