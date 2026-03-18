"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// --- TEMPLATE SURAT OTOMATIS ---
const SURAT_TEMPLATES: Record<string, any> = {
  "Surat Undangan": {
    perihal: "Undangan Rapat Koordinasi",
    tujuan: "Seluruh Pengurus DPW IKA UII DIY",
    tempatTujuan: "Di Tempat",
    atributStyle: "split",
    isiSurat:
      'Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nSehubungan dengan akan dilaksanakannya program kerja strategis, kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada:\n\n<table style="width:100%; border:none; text-align:left; margin-top:8px; margin-bottom:8px;"><tbody><tr><td style="width:110px; vertical-align:top; padding-bottom:6px;">Hari/Tanggal</td><td style="width:20px; vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;"><b>Sabtu, 14 Maret 2026</b></td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Waktu</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">19.30 WIB - Selesai</td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Tempat</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Sekretariat DPW IKA UII DIY</td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Agenda</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Rapat Koordinasi Wilayah</td></tr></tbody></table>\n\nDemikian undangan ini kami sampaikan. Atas perhatian dan kehadirannya diucapkan terima kasih.\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.',
  },
  "Surat Tugas": {
    perihal: "Pemberian Tugas Kepengurusan",
    tujuan: "Nama Penerima Tugas",
    tempatTujuan: "Di Tempat",
    atributStyle: "center",
    isiSurat:
      'Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nDengan hormat,\n\nDewan Pimpinan Wilayah Ikatan Keluarga Alumni Universitas Islam Indonesia (DPW IKA UII) Daerah Istimewa Yogyakarta, dengan ini memberikan tugas kepada:\n\n<table style="width:100%; border:none; text-align:left; margin-top:8px; margin-bottom:8px;"><tbody><tr><td style="width:90px; vertical-align:top; padding-bottom:6px;">Nama</td><td style="width:20px; vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;"><b>[Nama Penerima Tugas]</b></td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Jabatan</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">[Jabatan Penerima Tugas]</td></tr></tbody></table>\n\nUntuk melaksanakan tugas sebagai <b>[Sebutkan Nama Tugas/Kegiatan]</b> yang akan diselenggarakan pada tanggal [Sebutkan Tanggal].\n\nDemikian surat tugas ini dibuat agar dapat dilaksanakan dengan penuh tanggung jawab.\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.',
  },
  "Surat Keterangan": {
    perihal: "Surat Keterangan Aktif",
    tujuan: "Pihak yang Berkepentingan",
    tempatTujuan: "Di Tempat",
    atributStyle: "split",
    isiSurat:
      'Yang bertanda tangan di bawah ini, Ketua Umum DPW IKA UII Daerah Istimewa Yogyakarta, menerangkan dengan sesungguhnya bahwa:\n\n<table style="width:100%; border:none; text-align:left; margin-top:8px; margin-bottom:8px;"><tbody><tr><td style="width:90px; vertical-align:top; padding-bottom:6px;">Nama</td><td style="width:20px; vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;"><b>[Nama Anggota]</b></td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">Jabatan</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">[Jabatan Anggota]</td></tr></tbody></table>\n\nAdalah benar merupakan pengurus aktif di DPW IKA UII Daerah Istimewa Yogyakarta periode berjalan dan memiliki dedikasi yang baik terhadap organisasi.\n\nSurat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.',
  },
  "Surat Keputusan (SK)": {
    perihal: "Surat Keputusan Pengangkatan",
    tujuan: "Arsip Organisasi",
    tempatTujuan: "Yogyakarta",
    atributStyle: "center",
    isiSurat:
      '<b>MEMUTUSKAN</b>\n\nMenetapkan:\n\n<table style="width:100%; border:none; text-align:left; margin-top:8px; margin-bottom:8px;"><tbody><tr><td style="width:90px; vertical-align:top; padding-bottom:6px;">PERTAMA</td><td style="width:20px; vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Mengangkat nama-nama terlampir sebagai Panitia Kegiatan [Nama Kegiatan].</td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">KEDUA</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Panitia wajib memberikan laporan pertanggungjawaban setelah kegiatan selesai.</td></tr><tr><td style="vertical-align:top; padding-bottom:6px;">KETIGA</td><td style="vertical-align:top; text-align:center;">:</td><td style="vertical-align:top; padding-bottom:6px;">Keputusan ini berlaku sejak tanggal ditetapkan.</td></tr></tbody></table>',
  },
  "Surat Edaran": {
    perihal: "Edaran Menghadiri Acara",
    tujuan: "Seluruh Anggota IKA UII DIY",
    tempatTujuan: "Di Wilayah Masing-masing",
    atributStyle: "split",
    isiSurat:
      "Assalamu’alaikum Warahmatullahi Wabarakatuh.\n\nDalam rangka mempererat tali silaturahmi antar alumni, kami menghimbau kepada seluruh anggota untuk turut serta berpartisipasi dalam agenda rutin bulanan yang akan datang.\n\nInformasi lebih rinci terkait pelaksanaan akan disampaikan melalui kanal resmi komunikasi organisasi (Grup WhatsApp/Email).\n\nWassalamu’alaikum Warahmatullahi Wabarakatuh.",
  },
};

const INITIAL_STATE = {
  jenisSurat: "Surat Undangan",
  nomorSurat: "001/DPW-IKA-UII/DIY/III/2026",
  tanggalSurat: new Date().toISOString().split("T")[0],
  lampiran: "-",
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

  // --- STATE STYLING SAKTI ---
  const [kopAlign, setKopAlign] = useState("text-center"); // Rata teks Kop Surat
  const [kopScale, setKopScale] = useState(1); // Skala Ukuran Font Kop Surat (1 = 100%)
  const [atributStyle, setAtributStyle] = useState("split");
  const [headerAlign, setHeaderAlign] = useState("text-left");
  const [textAlign, setTextAlign] = useState("text-justify");

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
          namaPenandatangan1: ketua ? ketua.nama : "Nama Ketua",
          namaPenandatangan2: sekum ? sekum.nama : "Nama Sekum",
        }));
      } catch (error) {
        console.error("Gagal memuat pengurus:", error);
      }
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
      const template =
        SURAT_TEMPLATES[value] || SURAT_TEMPLATES["Surat Undangan"];
      setFormData({
        ...formData,
        jenisSurat: value,
        perihal: template.perihal,
        tujuan: template.tujuan,
        tempatTujuan: template.tempatTujuan,
        isiSurat: template.isiSurat,
      });
      setAtributStyle(template.atributStyle || "split");
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

  // Parser Markdown
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

  return (
    <div className="max-w-[1400px] mx-auto pb-12 animate-in fade-in duration-500">
      {/* HEADER ACTION BAR */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200 print:hidden sticky top-20 z-10">
        <div>
          <h2 className="text-xl font-extrabold text-blue-950">
            Generator Surat
          </h2>
          <p className="text-slate-500 text-xs font-medium">
            Isi form di bawah, preview akan menyesuaikan otomatis.
          </p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <button
            onClick={handleReset}
            className="flex-1 sm:flex-none bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none bg-blue-900 hover:bg-blue-950 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
            {isPrinting ? "Menyiapkan..." : "Cetak PDF"}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* KOLOM KIRI: FORM KONTROL EDITOR */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          {/* SECTION 1: KOP & ATRIBUT */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-blue-950 mb-5 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                1
              </span>
              Kop & Atribut Administrasi
            </h3>
            <div className="space-y-5">
              {/* TOOLBAR KOP SURAT (ALIGNMENT & SIZE) */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">
                    Perataan Kop Surat
                  </label>
                  <div className="flex bg-slate-100 rounded-md p-1 gap-1">
                    <button
                      onClick={() => setKopAlign("text-left")}
                      className={`p-1 rounded ${kopAlign === "text-left" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Rata Kiri"
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
                      className={`p-1 rounded ${kopAlign === "text-center" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Rata Tengah"
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
                      className={`p-1 rounded ${kopAlign === "text-right" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Rata Kanan"
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

                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">
                    Ukuran Font Kop
                  </label>
                  <div className="flex items-center gap-2 bg-slate-100 rounded-md p-1">
                    <button
                      onClick={() => setKopScale((s) => Math.max(0.7, s - 0.1))}
                      className="p-1 rounded text-slate-500 hover:bg-white shadow-sm"
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
                    <span className="text-[10px] font-bold w-8 text-center">
                      {Math.round(kopScale * 100)}%
                    </span>
                    <button
                      onClick={() => setKopScale((s) => Math.min(1.3, s + 0.1))}
                      className="p-1 rounded text-slate-500 hover:bg-white shadow-sm"
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

              {/* TOOLBAR TATA LETAK ATRIBUT (SPLIT VS CENTER) */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <label className="block text-[11px] font-bold text-slate-500 uppercase">
                  Layout Nomor & Hal
                </label>
                <div className="flex bg-slate-100 rounded-md p-1 gap-1 text-[10px] font-bold uppercase tracking-wider">
                  <button
                    onClick={() => setAtributStyle("split")}
                    className={`px-2 py-1 rounded ${atributStyle === "split" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                  >
                    Standar (Kiri)
                  </button>
                  <button
                    onClick={() => setAtributStyle("center")}
                    className={`px-2 py-1 rounded ${atributStyle === "center" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                  >
                    Tengah (SK)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                  Jenis Surat{" "}
                  <span className="text-blue-500 normal-case">
                    (Otomatis Ganti Template & Layout)
                  </span>
                </label>
                <select
                  name="jenisSurat"
                  value={formData.jenisSurat}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
                >
                  <option value="Surat Undangan">Surat Undangan</option>
                  <option value="Surat Tugas">Surat Tugas</option>
                  <option value="Surat Keterangan">Surat Keterangan</option>
                  <option value="Surat Keputusan (SK)">
                    Surat Keputusan (SK)
                  </option>
                  <option value="Surat Edaran">Surat Edaran</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Nomor Surat
                  </label>
                  <input
                    type="text"
                    name="nomorSurat"
                    value={formData.nomorSurat}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    name="tanggalSurat"
                    value={formData.tanggalSurat}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Lampiran
                  </label>
                  <input
                    type="text"
                    name="lampiran"
                    value={formData.lampiran}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Perihal
                  </label>
                  <input
                    type="text"
                    name="perihal"
                    value={formData.perihal}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PENERIMA & ISI */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-blue-950 mb-5 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                2
              </span>
              Penerima & Isi Surat
            </h3>
            <div className="space-y-6">
              {/* TOOLBAR ALIGNMENT TUJUAN */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">
                    Tujuan Surat
                  </label>
                  <div className="flex bg-slate-100 rounded-md p-1 gap-1">
                    <button
                      onClick={() => setHeaderAlign("text-left")}
                      className={`p-1 rounded ${headerAlign === "text-left" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Rata Kiri"
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
                      className={`p-1 rounded ${headerAlign === "text-center" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Rata Tengah"
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
                      className={`p-1 rounded ${headerAlign === "text-right" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Rata Kanan"
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
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="tujuan"
                    placeholder="Kepada Yth."
                    value={formData.tujuan}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                  <input
                    type="text"
                    name="tempatTujuan"
                    placeholder="Di Tempat"
                    value={formData.tempatTujuan}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* TOOLBAR ALIGNMENT ISI TEKS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase">
                    Isi Teks Surat
                  </label>
                  <div className="flex bg-slate-100 rounded-md p-1 gap-1">
                    <button
                      onClick={() => setTextAlign("text-left")}
                      className={`p-1 rounded ${textAlign === "text-left" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Rata Kiri"
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
                      className={`p-1 rounded ${textAlign === "text-center" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Rata Tengah"
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
                      className={`p-1 rounded ${textAlign === "text-justify" ? "bg-white shadow-sm text-blue-700" : "text-slate-400"}`}
                      title="Justify"
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
                  rows={10}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed resize-y font-sans"
                ></textarea>
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                  💡 Tips: Gunakan{" "}
                  <code className="bg-slate-100 px-1 rounded">**teks**</code>{" "}
                  untuk <b>Tebal</b>, dan{" "}
                  <code className="bg-slate-100 px-1 rounded">_teks_</code>{" "}
                  untuk <i>Miring</i>.
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 3: TANDA TANGAN */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-blue-950 mb-5 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
              <span className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center text-xs">
                3
              </span>
              Otorisasi (Tanda Tangan)
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-500 uppercase text-center border-b border-slate-200 pb-2">
                  Posisi Kiri
                </label>
                <input
                  type="text"
                  name="jabatanPenandatangan1"
                  placeholder="Jabatan (Opsional)"
                  value={formData.jabatanPenandatangan1}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 p-2 rounded-md text-xs text-center"
                />
                <input
                  type="text"
                  name="namaPenandatangan1"
                  placeholder="Nama Kosong = Hilang"
                  value={formData.namaPenandatangan1}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 p-2 rounded-md text-xs text-center font-bold"
                />
              </div>
              <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <label className="block text-[10px] font-bold text-slate-500 uppercase text-center border-b border-slate-200 pb-2">
                  Posisi Kanan
                </label>
                <input
                  type="text"
                  name="jabatanPenandatangan2"
                  placeholder="Jabatan"
                  value={formData.jabatanPenandatangan2}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 p-2 rounded-md text-xs text-center"
                />
                <input
                  type="text"
                  name="namaPenandatangan2"
                  placeholder="Nama Lengkap"
                  value={formData.namaPenandatangan2}
                  onChange={handleChange}
                  className="w-full bg-white border border-slate-200 p-2 rounded-md text-xs text-center font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            KOLOM KANAN: LIVE PREVIEW KERTAS A4
            ======================================================== */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 h-fit">
          <div className="w-full overflow-x-auto pb-4 no-scrollbar">
            <div
              className="bg-white mx-auto shadow-2xl shadow-slate-300/60 print:shadow-none border border-slate-200 print:border-none font-serif text-black leading-snug shrink-0
                            w-[800px] min-h-[1131px] p-[60px] 
                            sm:w-[700px] sm:min-h-[990px] sm:p-[50px]
                            lg:w-[794px] lg:min-h-[1123px] lg:p-[70px]
                            print:w-[210mm] print:min-h-[297mm] print:max-w-none print:p-[20mm] print:m-0"
            >
              {/* KOP SURAT (DENGAN SKALA FONT DINAMIS & ALIGNMENT) */}
              <div className="flex items-center gap-6 border-b-[3px] border-black pb-4 mb-1">
                <img
                  src="/logo-dpp-ika.png"
                  alt="Logo UII"
                  className="w-20 lg:w-24 print:w-[22mm] object-contain"
                />
                <div
                  className={`flex-1 ${kopAlign}`}
                  // PENGATURAN SKALA UKURAN FONT
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
                  <h3 className="text-sm lg:text-base print:text-[14pt] font-bold tracking-wider">
                    DEWAN PIMPINAN WILAYAH
                  </h3>
                  <h2 className="text-lg lg:text-xl print:text-[18pt] font-black tracking-widest text-blue-900 mt-1">
                    IKATAN KELUARGA ALUMNI UNIVERSITAS ISLAM INDONESIA
                  </h2>

                  <h2 className="text-base lg:text-lg print:text-[16pt] font-black tracking-widest mt-1">
                    DAERAH ISTIMEWA YOGYAKARTA
                  </h2>
                  <p className="text-[10px] lg:text-xs print:text-[10pt] mt-2 italic font-sans text-slate-600">
                    Sekretariat: Kampus Terpadu UII, Jl. Kaliurang KM 14.5
                    Sleman, Yogyakarta Email: ika.diy@uii.ac.id
                  </p>
                </div>
              </div>
              <div className="w-full border-b border-black mb-8"></div>

              {/* TATA LETAK ATRIBUT (SPLIT ATAU CENTER) */}
              {atributStyle === "split" ? (
                <div className="flex justify-between items-start text-sm lg:text-base print:text-[12pt] mb-10">
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
                <div className="text-center text-sm lg:text-base print:text-[12pt] mb-12">
                  <h3 className="font-bold uppercase underline text-lg print:text-[14pt] mb-1 tracking-wider">
                    {formData.jenisSurat}
                  </h3>
                  <p>Nomor: {formData.nomorSurat}</p>
                </div>
              )}

              {/* TUJUAN SURAT DENGAN ALIGNMENT DINAMIS */}
              {/* Sembunyikan Tujuan jika format SK (Center) dan perihal/tujuan tidak diatur */}
              {!(atributStyle === "center" && !formData.tujuan) && (
                <div
                  className={`text-sm lg:text-base print:text-[12pt] mb-10 ${headerAlign}`}
                >
                  <p>Kepada Yth.</p>
                  <p className="font-bold">{formData.tujuan}</p>
                  <p>{formData.tempatTujuan}</p>
                </div>
              )}

              {/* ISI SURAT DENGAN PARSER MARKDOWN */}
              <div className="text-sm lg:text-base print:text-[12pt] leading-relaxed mb-16">
                {renderFormattedText(formData.isiSurat)}
              </div>

              {/* TANDA TANGAN */}
              <div className="relative">
                {/* Tanggal untuk format SK (Tengah) biasanya di atas TTD */}
                {atributStyle === "center" && (
                  <div className="text-right text-sm lg:text-base print:text-[12pt] mb-4 pr-8">
                    Ditetapkan di: Yogyakarta
                    <br />
                    Pada tanggal: {formatTanggal(formData.tanggalSurat)}
                  </div>
                )}

                <div
                  className={`flex text-sm lg:text-base print:text-[12pt] text-center mt-8 px-4 ${!formData.namaPenandatangan1 ? "justify-end" : "justify-between"}`}
                >
                  {/* TTD Kiri */}
                  {formData.namaPenandatangan1 && (
                    <div className="w-64 flex flex-col items-center">
                      <p className="mb-24">{formData.jabatanPenandatangan1},</p>
                      <p className="font-bold underline normal-case">
                        {formData.namaPenandatangan1}
                      </p>
                    </div>
                  )}

                  {/* TTD Kanan */}
                  <div className="w-64 flex flex-col items-center">
                    <p className="mb-24">{formData.jabatanPenandatangan2},</p>
                    <p className="font-bold underline normal-case">
                      {formData.namaPenandatangan2}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
