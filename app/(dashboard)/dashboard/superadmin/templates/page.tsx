"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function TemplateManager() {
  const [activeTemplate, setActiveTemplate] = useState("surat-tugas");
  const [htmlContent, setHtmlContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const templateTypes = [
    { id: "surat-tugas", name: "Surat Tugas" },
    { id: "undangan", name: "Surat Undangan" },
    { id: "berita-acara", name: "Berita Acara" },
    { id: "sk", name: "Surat Keputusan (SK)" },
  ];

  // =========================================================================
  // 🌟 DEFAULT HTML SURAT TUGAS (SUDAH DIPERBAIKI SINTAKS & DESAINNYA)
  // =========================================================================
  const defaultSuratTugasHTML = `
<div style="display: flex; align-items: center; gap: 20px; padding-bottom: 12px; font-family: Arial, Helvetica, sans-serif;">
  
  <img src="/logo-uii.png" alt="Logo IKA UII" style="width: 110px; height: auto; object-fit: contain; flex-shrink: 0;" />
  
  <div style="flex: 1; color: #1e3a8a;">
    <h1 style="font-size: 14pt; font-weight: bold; line-height: 1.1; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">
      Dewan Pimpinan Wilayah Ikatan Keluarga Alumni
    </h1>
    <h2 style="font-size: 18pt; font-weight: 900; line-height: 1.2; text-transform: uppercase; margin: 4px 0;">
      Universitas Islam Indonesia
    </h2>
    <h3 style="font-size: 14pt; font-weight: bold; line-height: 1.1; text-transform: uppercase; margin: 0; letter-spacing: 0.5px;">
      Daerah Istimewa Yogyakarta
    </h3>
    
    <div style="font-size: 9pt; margin-top: 8px; line-height: 1.4; color: black;">
      Sekretariat: Kampus Terpadu UII, Jl. Kaliurang KM 14.5 Sleman, Yogyakarta <br />
      Email: <span style="color: #1d4ed8; text-decoration: underline;">ika.diy@uii.ac.id</span> | 
      Website: <span style="color: #1d4ed8; text-decoration: underline;">www.ikauiidiy.org</span> | 
      Hotline: 085179594146
    </div>
  </div>
</div>

<div style="border-bottom: 3px solid black; width: 100%;"></div>
<div style="border-bottom: 1px solid black; width: 100%; margin-top: 2px; margin-bottom: 25px;"></div>

<div style="text-align: center; margin-bottom: 24px;">
  <div style="font-size: 14pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; letter-spacing: 2px;">Surat Tugas</div>
  <div style="font-size: 11pt;">Nomor: [NOMOR_SURAT]</div>
</div>

<div style="text-align: center; font-style: italic; margin-bottom: 32px; font-size: 11pt;">Bismillahirrahmanirrahim</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 24px; font-size: 11pt;">
  Pimpinan Dewan Pimpinan Wilayah Ikatan Keluarga Alumni Universitas Islam Indonesia (DPW IKA UII) Daerah Istimewa Yogyakarta memberikan tugas kepada Saudara yang namanya tersebut di bawah ini sebagai panitia <strong>[NAMA_KEGIATAN]</strong>, dengan susunan personalia sebagai berikut:
</div>

<div style="margin-bottom: 24px;">
  [SUSUNAN_PANITIA]
</div>

<div style="text-align: justify; line-height: 1.6; margin-bottom: 48px; font-size: 11pt;">
  Demikian Surat Tugas ini dibuat agar Saudara yang ditugaskan dapat melaksanakan tugas dan tanggung jawab yang diberikan dengan sebaik-baiknya.
</div>

<table style="width: 100%; font-size: 11pt; page-break-inside: avoid;">
  <tbody>
    <tr>
      <td style="width: 50%;"></td>
      <td style="text-align: center;">
        <div>Yogyakarta, [TANGGAL_CETAK]</div>
        <div style="margin-bottom: 96px;">Ketua DPW IKA UII DIY,</div>
        <div style="font-weight: bold; text-decoration: underline;">[PENANGGUNG_JAWAB]</div>
      </td>
    </tr>
  </tbody>
</table>
`;
  // =========================================================================

  useEffect(() => {
    const fetchTemplate = async () => {
      setIsLoading(true);
      try {
        const docRef = doc(db, "templates", activeTemplate);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setHtmlContent(docSnap.data().content);
        } else {
          // Jika belum ada, gunakan template default
          setHtmlContent(
            activeTemplate === "surat-tugas"
              ? defaultSuratTugasHTML.trim()
              : "<p>Ketik HTML di sini...</p>",
          );
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [activeTemplate]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(db, "templates", activeTemplate), {
        content: htmlContent,
        updatedAt: new Date().toISOString(),
      });
      setMessage({ type: "success", text: "Template HTML berhasil disimpan!" });
    } catch {
      setMessage({ type: "error", text: "Gagal menyimpan template." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  // Fungsi untuk menyimulasikan data pada Preview agar lebih realistis
  const getPreviewHTML = () => {
    let preview = htmlContent;
    preview = preview.replace(/\[NOMOR_SURAT\]/g, "034/ST/DPW-IKA-DIY/II/2026");
    preview = preview.replace(
      /\[NAMA_KEGIATAN\]/g,
      "Panitia Halal Bi Halal DPW IKA UII DIY 2026",
    );
    preview = preview.replace(/\[TANGGAL_CETAK\]/g, "1 Maret 2026");
    preview = preview.replace(
      /\[PENANGGUNG_JAWAB\]/g,
      "H. Harda Kiswaya, S.E., M.Si.", // Simulasi nama non-uppercase
    );
    preview = preview.replace(
      /\[SUSUNAN_PANITIA\]/g,
      `
      <table style="width: 100%; font-size: 11pt; line-height: 1.6; border-collapse: collapse;">
        <tr><td style="width: 30%; vertical-align: top;">Penanggung Jawab</td><td style="width: 3%; vertical-align: top;">:</td><td style="font-weight: bold;">H. Harda Kiswaya, S.E., M.Si.</td></tr>
        <tr><td style="vertical-align: top; padding-top: 8px;">Organizing Committee</td><td style="vertical-align: top; padding-top: 8px;">:</td><td style="padding-top: 8px;">
          <table style="width: 100%">
            <tr><td style="width: 80px;">Ketua</td><td style="width: 10px;">:</td><td style="font-weight: bold;">Thorikul Huda, S.Si., M.Sc.</td></tr>
            <tr><td>Sekretaris</td><td>:</td><td>Cecep Sa'bana, S.Si.</td></tr>
          </table>
        </td></tr>
        <tr><td style="vertical-align: top; padding-top: 8px; font-weight: bold;">Divisi Acara</td><td style="vertical-align: top; padding-top: 8px;">:</td><td style="padding-top: 8px;">
          Koordinator: <strong>Sugeng Utomo, S.E.</strong><br/>
          Anggota:<ol style="margin:0; padding-left: 20px;"><li>Budi Wibowo, S.T.</li></ol>
        </td></tr>
      </table>
    `,
    );
    return preview;
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-500">
      {/* BAGIAN HEADER PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="inline-block bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest">
            Developer Mode
          </div>
          <h2 className="text-2xl font-black text-slate-900">
            HTML Template Engine
          </h2>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <select
            value={activeTemplate}
            onChange={(e) => setActiveTemplate(e.target.value)}
            className="p-2.5 bg-white border border-slate-300 rounded-lg font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 flex-1 md:w-48 outline-none"
          >
            {templateTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg disabled:opacity-50 shrink-0 transition-colors"
          >
            {isSaving ? "Menyimpan..." : "💾 Simpan HTML"}
          </button>
        </div>
      </div>

      {/* NOTIFIKASI SUKSES / ERROR */}
      {message.text && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm font-medium ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
        >
          {message.text}
        </div>
      )}

      {/* DUAL PANE: KIRI (KODE HTML) & KANAN (LIVE PREVIEW) */}
      <div className="grid lg:grid-cols-2 gap-6 h-[800px]">
        {/* PANE KIRI: CODE EDITOR */}
        <div className="flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
          <div className="bg-slate-950 p-3 px-5 border-b border-slate-800 flex justify-between items-center">
            <span className="text-slate-300 font-mono text-sm font-bold flex items-center gap-2">
              <span className="text-yellow-400">&lt;/&gt;</span> editor.html
            </span>
            <span className="text-slate-500 text-xs">Gunakan Inline CSS</span>
          </div>
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 font-mono">
              Memuat Kode...
            </div>
          ) : (
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              spellCheck="false"
              className="flex-1 w-full p-5 bg-slate-900 text-green-400 font-mono text-sm focus:outline-none resize-none leading-relaxed"
              placeholder="Ketik kode HTML di sini..."
            />
          )}
        </div>

        {/* PANE KANAN: LIVE PREVIEW KERTAS A4 */}
        <div className="flex flex-col bg-slate-200 rounded-2xl overflow-hidden shadow-inner border border-slate-300">
          <div className="bg-slate-300 p-3 px-5 border-b border-slate-400 flex justify-between items-center">
            <span className="text-slate-700 font-bold text-sm">
              👁️ Live Preview (Kertas A4)
            </span>
          </div>

          <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-200">
            {/* SIMULASI KERTAS A4 */}
            <div
              className="bg-white shadow-2xl shrink-0"
              style={{
                width: "210mm",
                minHeight: "297mm",
                padding: "20mm",
                fontFamily: '"Times New Roman", Times, serif',
                color: "black",
              }}
              dangerouslySetInnerHTML={{ __html: getPreviewHTML() }}
            />
          </div>
        </div>
      </div>

      {/* DAFTAR VARIABEL */}
      <div className="mt-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h4 className="font-bold text-slate-700 text-sm mb-3">
          Variabel Sistem (Otomatis Diganti Saat Print):
        </h4>
        <div className="flex flex-wrap gap-2">
          {[
            "[NOMOR_SURAT]",
            "[NAMA_KEGIATAN]",
            "[TANGGAL_MULAI]",
            "[TANGGAL_SELESAI]",
            "[LAPORAN_KEPADA]",
            "[SUSUNAN_PANITIA]",
            "[TANGGAL_CETAK]",
            "[PENANGGUNG_JAWAB]",
          ].map((ph, i) => (
            <span
              key={i}
              className="text-xs font-mono bg-blue-50 px-3 py-1.5 border border-blue-100 text-blue-800 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors select-all"
            >
              {ph}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
