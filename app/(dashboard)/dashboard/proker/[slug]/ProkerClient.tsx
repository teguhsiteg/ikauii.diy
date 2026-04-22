"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

// --- TYPES ---
interface Divisi {
  namaDivisi: string;
  koordinator: string;
  anggota: string[];
}

interface ProkerPayload {
  id?: string;
  nomorSurat: string;
  namaKegiatan: string;
  tglMulai: string;
  tglSelesai: string;
  laporanKepada: string;
  status: string;
  penanggungJawab: string;
  ketuaSC: string;
  anggotaSC: string[];
  ketuaOC: string;
  wakilKetuaOC: string;
  sekretaris: string;
  bendahara: string;
  divisi: Divisi[];
  fileProposal: string;
  fileLaporan: string;
  [key: string]: any;
}

// --- UTILS ---
const formatDateToID = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// --- REUSABLE PDF TEMPLATE COMPONENT DENGAN THEAD (KOP BERULANG) ---
const SuratTugasTemplate = ({ printData }: { printData: ProkerPayload }) => {
  const qrData = encodeURIComponent(
    `Dokumen Sah & TTD Digital\nNo: ${printData.nomorSurat || "ST-IKA-UII"}\nOleh: Ketua DPW IKA UII DIY`,
  );

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: "11pt",
        color: "#000000",
        lineHeight: 1.5,
      }}
    >
      {/* THEAD: AKAN BERULANG DI SETIAP HALAMAN CETAK */}
      <thead style={{ display: "table-header-group" }}>
        <tr>
          <td style={{ paddingBottom: "25px" }}>
            {/* KOP SURAT PROPORSIONAL */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ width: "120px", textAlign: "left" }}>
                <img
                  crossOrigin="anonymous"
                  src="/logo-dpp-ika.png"
                  alt="Logo IKA UII"
                  style={{
                    width: "95px",
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "14pt",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    marginBottom: "3px",
                    letterSpacing: "0.5px",
                  }}
                >
                  Dewan Pimpinan Wilayah Daerah Istimewa Yogyakarta
                </div>
                <div
                  style={{
                    fontSize: "16pt",
                    color: "#1e3a8a",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                    letterSpacing: "0.5px",
                  }}
                >
                  Ikatan Keluarga Alumni Universitas Islam Indonesia
                </div>
                <div style={{ fontSize: "10pt", color: "#000" }}>
                  Sekretariat: Kampus Terpadu UII, Jl. Kaliurang KM 14.5 Sleman,
                  Yogyakarta
                  <br />
                  Email: ikadiy@uii.ac.id | Website: www.ikadiy.uii.ac.id | IG:
                  @ikauii.diy
                </div>
              </div>
              {/* Spacer penyeimbang di kanan agar teks benar-benar rata tengah */}
              <div style={{ width: "120px" }}></div>
            </div>
            {/* Garis Bawah Kop */}
            <div
              style={{
                marginTop: "12px",
                borderBottom: "3px solid #000",
                paddingBottom: "2px",
              }}
            >
              <div style={{ borderBottom: "1px solid #000" }}></div>
            </div>
          </td>
        </tr>
      </thead>

      {/* TBODY: ISI KONTEN (Anti Potong Halaman) */}
      <tbody>
        <tr>
          <td>
            {/* Judul & Nomor Surat */}
            <div style={{ textAlign: "center", marginBottom: "25px" }}>
              <div
                style={{
                  fontSize: "14pt",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  textDecoration: "underline",
                  letterSpacing: "1px",
                  marginBottom: "4px",
                }}
              >
                Surat Tugas
              </div>
              <div>Nomor: {printData.nomorSurat}</div>
            </div>

            {/* Pembuka */}
            <div style={{ textAlign: "justify", marginBottom: "20px" }}>
              Pimpinan Dewan Pimpinan Wilayah Ikatan Keluarga Alumni Universitas
              Islam Indonesia (DPW IKA UII) Daerah Istimewa Yogyakarta
              memberikan tugas kepada Saudara yang namanya tersebut di bawah ini
              sebagai panitia <strong>{printData.namaKegiatan}</strong>, dengan
              susunan personalia sebagai berikut:
            </div>

            {/* Tabel Personalia */}
            <table
              style={{
                width: "100%",
                marginBottom: "30px",
                borderCollapse: "collapse",
              }}
            >
              <tbody>
                {/* Penanggung Jawab */}
                {printData.penanggungJawab && (
                  <tr style={{ pageBreakInside: "avoid" }}>
                    <td
                      style={{
                        width: "35%",
                        verticalAlign: "top",
                        paddingBottom: "6px",
                      }}
                    >
                      Penanggung Jawab
                    </td>
                    <td
                      style={{
                        width: "5%",
                        verticalAlign: "top",
                        textAlign: "center",
                        paddingBottom: "6px",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        width: "60%",
                        verticalAlign: "top",
                        fontWeight: "bold",
                        paddingBottom: "6px",
                      }}
                    >
                      {printData.penanggungJawab}
                    </td>
                  </tr>
                )}
                {/* Ketua SC */}
                {printData.ketuaSC && (
                  <tr style={{ pageBreakInside: "avoid" }}>
                    <td style={{ verticalAlign: "top", paddingBottom: "6px" }}>
                      Ketua SC / Pengarah
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        textAlign: "center",
                        paddingBottom: "6px",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        fontWeight: "bold",
                        paddingBottom: "6px",
                      }}
                    >
                      {printData.ketuaSC}
                    </td>
                  </tr>
                )}
                {/* Anggota SC */}
                {printData.anggotaSC?.length > 0 && (
                  <tr style={{ pageBreakInside: "avoid" }}>
                    <td style={{ verticalAlign: "top", paddingBottom: "6px" }}>
                      Anggota SC
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        textAlign: "center",
                        paddingBottom: "6px",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        fontWeight: "bold",
                        paddingBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        {printData.anggotaSC.map((m, i) => (
                          <div key={i}>
                            {i + 1}. {m}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}

                {/* Spasi Antara SC dan OC */}
                {printData.anggotaSC?.length > 0 && (
                  <tr>
                    <td colSpan={3} style={{ height: "10px" }}></td>
                  </tr>
                )}

                {/* Ketua OC */}
                {printData.ketuaOC && (
                  <tr style={{ pageBreakInside: "avoid" }}>
                    <td style={{ verticalAlign: "top", paddingBottom: "6px" }}>
                      Ketua Pelaksana (OC)
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        textAlign: "center",
                        paddingBottom: "6px",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        fontWeight: "bold",
                        paddingBottom: "6px",
                      }}
                    >
                      {printData.ketuaOC}
                    </td>
                  </tr>
                )}
                {/* Wakil Ketua OC */}
                {printData.wakilKetuaOC && (
                  <tr style={{ pageBreakInside: "avoid" }}>
                    <td style={{ verticalAlign: "top", paddingBottom: "6px" }}>
                      Wakil Ketua
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        textAlign: "center",
                        paddingBottom: "6px",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        fontWeight: "bold",
                        paddingBottom: "6px",
                      }}
                    >
                      {printData.wakilKetuaOC}
                    </td>
                  </tr>
                )}
                {/* Sekretaris */}
                {printData.sekretaris && (
                  <tr style={{ pageBreakInside: "avoid" }}>
                    <td style={{ verticalAlign: "top", paddingBottom: "6px" }}>
                      Sekretaris
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        textAlign: "center",
                        paddingBottom: "6px",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        fontWeight: "bold",
                        paddingBottom: "6px",
                      }}
                    >
                      {printData.sekretaris}
                    </td>
                  </tr>
                )}
                {/* Bendahara */}
                {printData.bendahara && (
                  <tr style={{ pageBreakInside: "avoid" }}>
                    <td style={{ verticalAlign: "top", paddingBottom: "6px" }}>
                      Bendahara
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        textAlign: "center",
                        paddingBottom: "6px",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        fontWeight: "bold",
                        paddingBottom: "6px",
                      }}
                    >
                      {printData.bendahara}
                    </td>
                  </tr>
                )}

                {/* Divisi - Divisi */}
                {printData.divisi?.map((div, idx) => (
                  <tr key={idx} style={{ pageBreakInside: "avoid" }}>
                    <td style={{ verticalAlign: "top", paddingBottom: "6px" }}>
                      {div.namaDivisi}
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        textAlign: "center",
                        paddingBottom: "6px",
                      }}
                    >
                      :
                    </td>
                    <td
                      style={{
                        verticalAlign: "top",
                        fontWeight: "bold",
                        paddingBottom: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "2px",
                        }}
                      >
                        {div.koordinator && <div>1. {div.koordinator}</div>}
                        {div.anggota.map((m, i) => (
                          <div key={i}>
                            {div.koordinator ? i + 2 : i + 1}. {m}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Informasi Tambahan */}
                <tr style={{ pageBreakInside: "avoid" }}>
                  <td colSpan={3} style={{ height: "15px" }}></td>
                </tr>
                <tr style={{ pageBreakInside: "avoid" }}>
                  <td style={{ verticalAlign: "top", paddingBottom: "6px" }}>
                    Lama Penugasan
                  </td>
                  <td
                    style={{
                      verticalAlign: "top",
                      textAlign: "center",
                      paddingBottom: "6px",
                    }}
                  >
                    :
                  </td>
                  <td
                    style={{
                      verticalAlign: "top",
                      fontWeight: "bold",
                      paddingBottom: "6px",
                    }}
                  >
                    {formatDateToID(printData.tglMulai)} s.d{" "}
                    {formatDateToID(printData.tglSelesai)}
                  </td>
                </tr>
                <tr style={{ pageBreakInside: "avoid" }}>
                  <td style={{ verticalAlign: "top" }}>Laporan Kepada</td>
                  <td style={{ verticalAlign: "top", textAlign: "center" }}>
                    :
                  </td>
                  <td style={{ verticalAlign: "top", fontWeight: "bold" }}>
                    {printData.laporanKepada}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Penutup */}
            <div style={{ textAlign: "justify", marginBottom: "40px" }}>
              Demikian Surat Tugas ini dibuat agar dapat dilaksanakan dengan
              sebaik-baiknya, dan dengan penuh rasa tanggung jawab.
            </div>

            {/* Tanda Tangan & Disclaimer Validasi */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                pageBreakInside: "avoid",
              }}
            >
              <tbody>
                <tr>
                  {/* Kiri: Disclaimer */}
                  <td
                    style={{
                      width: "55%",
                      verticalAlign: "bottom",
                      paddingRight: "20px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9pt",
                        color: "#000",
                        lineHeight: 1.4,
                      }}
                    >
                      <strong>Catatan Validasi:</strong>
                      <br />
                      Dokumen ini sah dan diterbitkan secara resmi.
                      <br />
                      Ditandatangani secara elektronik. Keaslian dokumen
                      <br />
                      dapat diperiksa dengan memindai kode QR di samping
                      <br />
                      menggunakan perangkat ponsel Anda.
                    </div>
                  </td>

                  {/* Kanan: Tanda Tangan */}
                  <td
                    style={{
                      width: "45%",
                      textAlign: "center",
                      verticalAlign: "top",
                    }}
                  >
                    <div style={{ marginBottom: "6px" }}>
                      Yogyakarta,{" "}
                      {new Date().toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div style={{ marginBottom: "15px" }}>
                      Ketua DPW IKA UII DIY,
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        marginBottom: "15px",
                      }}
                    >
                      <img
                        crossOrigin="anonymous"
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${qrData}`}
                        alt="Digital Signature"
                        style={{ width: "90px", height: "90px" }}
                      />
                    </div>

                    <div
                      style={{
                        fontWeight: "bold",
                        textDecoration: "underline",
                        textTransform: "uppercase",
                      }}
                    >
                      H. HARDA KISWAYA, S.E., M.SI.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
};

// --- MAIN COMPONENT ---
export default function RuangKerjaProkerDinamic({ slug }: { slug: string }) {
  const params = useParams();
  const router = useRouter();
  const rawSlug = params.slug as string;

  const [namaBidangAktif, setNamaBidangAktif] =
    useState<string>("Memuat Ruangan...");
  const [view, setView] = useState<"list" | "form">("list");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [prokerList, setProkerList] = useState<any[]>([]);
  const [pengurusList, setPengurusList] = useState<any[]>([]);

  // STATES UNTUK FORM INPUT
  const initialFormState: ProkerPayload = {
    nomorSurat: "",
    namaKegiatan: "",
    tglMulai: "",
    tglSelesai: "",
    laporanKepada: "Ketua DPW IKA UII DIY",
    status: "Perencanaan",
    penanggungJawab: "Ketua DPW IKA UII DIY",
    ketuaSC: "",
    anggotaSC: [],
    ketuaOC: "",
    wakilKetuaOC: "",
    sekretaris: "",
    bendahara: "",
    divisi: [],
    fileProposal: "",
    fileLaporan: "",
  };
  const [prokerForm, setProkerForm] = useState<ProkerPayload>(initialFormState);

  // States Pendukung Input Sementara
  const [tempAnggotaSC, setTempAnggotaSC] = useState("");
  const [namaDivisiBaru, setNamaDivisiBaru] = useState("");
  const [tempAnggotaDivisi, setTempAnggotaDivisi] = useState<
    Record<number, string>
  >({});

  const [editProkerId, setEditProkerId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [printData, setPrintData] = useState<ProkerPayload | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const snapBidang = await getDocs(collection(db, "bidang"));
      const bidangDitemukan = snapBidang.docs
        .map((d) => d.data())
        .find(
          (b) =>
            b.namaBidang.toLowerCase().replace(/[^a-z0-9]+/g, "-") === rawSlug,
        );

      if (!bidangDitemukan) {
        router.push("/dashboard");
        return;
      }

      const namaAsli = bidangDitemukan.namaBidang;
      setNamaBidangAktif(namaAsli);

      const qProker = query(
        collection(db, "proker"),
        where("bidang", "==", namaAsli),
      );
      setProkerList(
        (await getDocs(qProker)).docs.map((d) => ({ id: d.id, ...d.data() })),
      );

      const qPengurus = query(
        collection(db, "pengurus"),
        orderBy("nama", "asc"),
      );
      setPengurusList(
        (await getDocs(qPengurus)).docs.map((d) => ({ id: d.id, ...d.data() })),
      );
    } catch (error) {
      console.error("Gagal load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (rawSlug) fetchData();
  }, [rawSlug, router]);

  // --- LOGIKA CETAK NATIVE BROWSER (ANTI POTONG & MULTI PAGE) ---
  const handlePrintST = (proker: any) => {
    setPrintData(proker as ProkerPayload);
    // Timeout untuk render template di background sebelum panggil print
    setTimeout(() => {
      const element = printRef.current;
      if (!element) return;

      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const contentWindow = iframe.contentWindow;
      if (!contentWindow) return;

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Surat Tugas - ${proker.namaKegiatan}</title>
            <style>
              @page { size: A4 portrait; margin: 15mm 20mm; }
              body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              /* Memastikan thead diulang di setiap halaman cetak */
              table { page-break-inside: auto; }
              tr    { page-break-inside: avoid; page-break-after: auto; }
              thead { display: table-header-group; }
              tfoot { display: table-footer-group; }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `;

      contentWindow.document.open();
      contentWindow.document.write(htmlContent);
      contentWindow.document.close();

      setTimeout(() => {
        contentWindow.focus();
        contentWindow.print();
        document.body.removeChild(iframe);
        setPrintData(null);
      }, 1000); // Tunggu QR Code Ter-render di Iframe
    }, 500);
  };

  const generateNomorSurat = async () => {
    const today = new Date();
    const romawi = [
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
    setProkerForm({
      ...initialFormState,
      nomorSurat: `---/ST/DPW-IKA-DIY/${romawi[today.getMonth()]}/${today.getFullYear()}`,
    });
    setEditProkerId(null);
    setView("form");
  };

  const handleEdit = (p: any) => {
    setProkerForm({
      ...initialFormState,
      ...p,
      // Pastikan fallback array tidak undefined
      anggotaSC: p.anggotaSC || [],
      divisi: p.divisi || [],
      fileProposal: p.fileProposal || "",
      fileLaporan: p.fileLaporan || "",
    });
    setEditProkerId(p.id);
    setView("form");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus proker ini secara permanen?")) {
      await deleteDoc(doc(db, "proker", id));
      fetchData();
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setProkerForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- FUNGSI ARRAY UNTUK FORM ---
  const handleAddAnggotaSC = () => {
    if (tempAnggotaSC.trim()) {
      setProkerForm((prev) => ({
        ...prev,
        anggotaSC: [...prev.anggotaSC, tempAnggotaSC.trim()],
      }));
      setTempAnggotaSC("");
    }
  };

  const handleRemoveAnggotaSC = (index: number) => {
    setProkerForm((prev) => ({
      ...prev,
      anggotaSC: prev.anggotaSC.filter((_, i) => i !== index),
    }));
  };

  const handleBuatDivisi = () => {
    if (namaDivisiBaru.trim()) {
      setProkerForm((prev) => ({
        ...prev,
        divisi: [
          ...prev.divisi,
          {
            namaDivisi: `Departemen ${namaDivisiBaru.trim()}`,
            koordinator: "",
            anggota: [],
          },
        ],
      }));
      setNamaDivisiBaru("");
    }
  };

  const handleHapusDivisi = (index: number) => {
    setProkerForm((prev) => ({
      ...prev,
      divisi: prev.divisi.filter((_, i) => i !== index),
    }));
  };

  const handleKoordinatorChange = (index: number, val: string) => {
    setProkerForm((prev) => {
      const newDiv = [...prev.divisi];
      newDiv[index] = { ...newDiv[index], koordinator: val };
      return { ...prev, divisi: newDiv };
    });
  };

  const handleAddAnggotaDivisi = (divIndex: number) => {
    const val = tempAnggotaDivisi[divIndex] || "";
    if (val.trim()) {
      setProkerForm((prev) => {
        const newDiv = [...prev.divisi];
        newDiv[divIndex] = {
          ...newDiv[divIndex],
          anggota: [...newDiv[divIndex].anggota, val.trim()],
        };
        return { ...prev, divisi: newDiv };
      });
      setTempAnggotaDivisi((prev) => ({ ...prev, [divIndex]: "" }));
    }
  };

  const handleRemoveAnggotaDivisi = (divIndex: number, angIndex: number) => {
    setProkerForm((prev) => {
      const newDiv = [...prev.divisi];
      newDiv[divIndex] = {
        ...newDiv[divIndex],
        anggota: newDiv[divIndex].anggota.filter((_, i) => i !== angIndex),
      };
      return { ...prev, divisi: newDiv };
    });
  };

  const confirmAndSaveProker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prokerForm.namaKegiatan?.trim() || !prokerForm.tglMulai) {
      setMessage({
        type: "error",
        text: "Nama Kegiatan dan Tanggal wajib diisi.",
      });
      return;
    }

    setIsSaving(true);
    try {
      if (editProkerId) {
        await updateDoc(doc(db, "proker", editProkerId), {
          ...prokerForm,
          updatedAt: new Date().toISOString(),
        });
        setMessage({ type: "success", text: "Proker berhasil diperbarui!" });
      } else {
        await addDoc(collection(db, "proker"), {
          ...prokerForm,
          bidang: namaBidangAktif,
          createdAt: new Date().toISOString(),
        });
        setMessage({ type: "success", text: "Proker baru berhasil dibuat!" });
      }
      setView("list");
      fetchData();
    } catch (error) {
      setMessage({ type: "error", text: "Gagal menyimpan proker." });
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Perencanaan: "bg-slate-100 text-slate-700 border-slate-300",
      Berjalan: "bg-blue-100 text-blue-700 border-blue-300",
      "LPJ Diajukan": "bg-yellow-100 text-yellow-800 border-yellow-300",
      "Selesai Lancar": "bg-green-100 text-green-800 border-green-300",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  if (isLoading && view === "list")
    return (
      <div className="p-10 text-center text-slate-500 font-bold animate-pulse">
        Menyiapkan Ruangan...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12 relative">
      {/* DATALIST UNTUK AUTOCOMPLETE NATIVE */}
      <datalist id="pengurus-list">
        {pengurusList.map((p) => (
          <option key={p.id} value={p.nama} />
        ))}
      </datalist>

      <div className="mb-8">
        <div className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest">
          Ruang Kerja Divisi
        </div>
        <h2 className="text-3xl font-extrabold text-blue-950 mb-2">
          {namaBidangAktif}
        </h2>
        <p className="text-slate-500 text-sm">
          Kelola Program Kerja, susun kepanitiaan SC/OC, cetak Surat Tugas, dan
          Arsip Dokumen.
        </p>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-3 ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
        >
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {view === "list" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-lg">
              Daftar Program Kerja
            </h3>
            <button
              onClick={generateNomorSurat}
              className="bg-blue-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-blue-950 transition-colors"
            >
              + Rancang Proker Baru
            </button>
          </div>
          <div className="p-6">
            {prokerList.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500 text-sm font-medium">
                  Belum ada Proker di Bidang ini.
                </p>
              </div>
            ) : (
              <div className="grid gap-6">
                {prokerList.map((p: any) => (
                  <div
                    key={p.id}
                    className={`p-6 rounded-xl border-2 hover:shadow-md transition-all flex flex-col lg:flex-row justify-between gap-6 bg-white ${p.status === "Selesai Lancar" ? "border-green-200" : "border-slate-200"}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-lg text-blue-950">
                          {p.namaKegiatan}
                        </h4>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${getStatusColor(p.status)}`}
                        >
                          {p.status}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-500 mb-3 bg-slate-100 inline-block px-2 py-1 rounded">
                        No: {p.nomorSurat}
                      </p>

                      <div className="flex flex-wrap gap-2 text-xs font-bold mb-4">
                        <span className="bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                          📅 {formatDateToID(p.tglMulai)} s/d{" "}
                          {formatDateToID(p.tglSelesai)}
                        </span>
                        <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">
                          👑 Ketupel: {p.ketuaOC || "Belum di-set"}
                        </span>
                      </div>

                      {/* --- TOMBOL DOKUMEN PROPOSAL & LPJ --- */}
                      <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                        {p.fileProposal ? (
                          <a
                            href={p.fileProposal}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            📄 Lihat Proposal
                          </a>
                        ) : (
                          <span className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            📄 Proposal Belum Ada
                          </span>
                        )}

                        {p.fileLaporan ? (
                          <a
                            href={p.fileLaporan}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 hover:bg-green-100 transition-colors"
                          >
                            📁 Lihat LPJ
                          </a>
                        ) : (
                          <span className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                            📁 LPJ Belum Ada
                          </span>
                        )}
                      </div>
                      {/* ------------------------------------- */}
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 lg:w-48">
                      <button
                        onClick={() => handlePrintST(p)}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-bold rounded-lg text-xs shadow-sm transition-colors w-full flex items-center justify-center gap-2"
                      >
                        📄 Cetak Surat Tugas
                      </button>
                      <button
                        onClick={() => handleEdit(p)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg text-xs shadow-sm transition-colors w-full"
                      >
                        ✏️ Edit Data & Panitia
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="mt-auto pt-4 text-red-500 hover:text-red-700 text-xs font-bold text-right underline"
                      >
                        Hapus Proker
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={confirmAndSaveProker} className="space-y-6">
          {/* HEADER FORM */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-blue-900">
                {editProkerId
                  ? "Edit Data & Kepanitiaan"
                  : "Formulir Kepanitiaan Proker"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Susun struktur panitia dan kelola dokumen.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView("list")}
              className="text-slate-500 text-sm font-bold hover:text-slate-800 bg-white px-4 py-2 rounded-lg border shadow-sm"
            >
              &larr; Batal
            </button>
          </div>

          {/* SECTION 1: INFORMASI KEGIATAN */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="bg-blue-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  1
                </span>{" "}
                Informasi Kegiatan
              </h4>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Kegiatan
                </label>
                <input
                  type="text"
                  name="namaKegiatan"
                  value={prokerForm.namaKegiatan}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  placeholder="Contoh: Panitia Halal Bi Halal DPW IKA UII DIY Tahun 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor Surat Tugas
                </label>
                <input
                  type="text"
                  name="nomorSurat"
                  value={prokerForm.nomorSurat}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 text-blue-900 font-mono font-bold rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Laporan Kepada
                </label>
                <input
                  type="text"
                  name="laporanKepada"
                  value={prokerForm.laporanKepada}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mulai Penugasan
                </label>
                <input
                  type="date"
                  name="tglMulai"
                  value={prokerForm.tglMulai}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Akhir Penugasan
                </label>
                <input
                  type="date"
                  name="tglSelesai"
                  value={prokerForm.tglSelesai}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Status Proker (Manual Override)
                </label>
                <select
                  name="status"
                  value={prokerForm.status}
                  onChange={handleChange}
                  className="w-full md:w-1/2 px-3 py-2.5 bg-yellow-50 border border-yellow-200 text-yellow-900 font-bold rounded-lg text-sm outline-none"
                >
                  <option value="Perencanaan">Perencanaan</option>
                  <option value="Berjalan">Berjalan</option>
                  <option value="LPJ Diajukan">LPJ Diajukan</option>
                  <option value="Selesai Lancar">Selesai Lancar</option>
                </select>
              </div>
            </div>
          </section>

          {/* SECTION 2: SC & PELINDUNG */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="bg-blue-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  2
                </span>{" "}
                SC & Pelindung
              </h4>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Penanggung Jawab
                </label>
                <input
                  list="pengurus-list"
                  name="penanggungJawab"
                  value={prokerForm.penanggungJawab}
                  onChange={handleChange}
                  placeholder="Pilih atau ketik nama..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ketua SC / Pengarah
                </label>
                <input
                  list="pengurus-list"
                  name="ketuaSC"
                  value={prokerForm.ketuaSC}
                  onChange={handleChange}
                  placeholder="Pilih atau ketik nama..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div className="md:col-span-2 border border-slate-200 p-4 rounded-xl bg-slate-50">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Anggota SC
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    list="pengurus-list"
                    value={tempAnggotaSC}
                    onChange={(e) => setTempAnggotaSC(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAnggotaSC();
                      }
                    }}
                    placeholder="-- Tambah Anggota SC --"
                    className="flex-1 px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddAnggotaSC}
                    className="bg-slate-200 text-slate-700 px-4 rounded-lg font-bold hover:bg-slate-300"
                  >
                    +
                  </button>
                </div>
                <div className="flex flex-col gap-2">
                  {prokerForm.anggotaSC.map((anggota, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center bg-white border border-slate-200 px-3 py-2 rounded-lg text-sm"
                    >
                      <span>{anggota}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAnggotaSC(i)}
                        className="text-red-500 font-bold"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: OC / PELAKSANA */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="bg-blue-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  3
                </span>{" "}
                OC / Pelaksana
              </h4>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ketua Pelaksana
                </label>
                <input
                  list="pengurus-list"
                  name="ketuaOC"
                  value={prokerForm.ketuaOC}
                  onChange={handleChange}
                  placeholder="Pilih atau ketik nama..."
                  className="w-full px-3 py-2.5 bg-yellow-50 border border-yellow-300 font-bold text-blue-950 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Wakil Ketua OC
                </label>
                <input
                  list="pengurus-list"
                  name="wakilKetuaOC"
                  value={prokerForm.wakilKetuaOC}
                  onChange={handleChange}
                  placeholder="Pilih atau ketik nama..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Sekretaris
                </label>
                <input
                  list="pengurus-list"
                  name="sekretaris"
                  value={prokerForm.sekretaris}
                  onChange={handleChange}
                  placeholder="Pilih atau ketik nama..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Bendahara
                </label>
                <input
                  list="pengurus-list"
                  name="bendahara"
                  value={prokerForm.bendahara}
                  onChange={handleChange}
                  placeholder="Pilih atau ketik nama..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </section>

          {/* SECTION 4: DIVISI / SEKSI */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="bg-blue-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  4
                </span>{" "}
                Divisi / Seksi
              </h4>
            </div>
            <div className="p-6">
              {/* Tambah Divisi Baru */}
              <div className="flex gap-3 mb-6 bg-slate-100 p-4 rounded-xl border border-slate-200">
                <input
                  type="text"
                  value={namaDivisiBaru}
                  onChange={(e) => setNamaDivisiBaru(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleBuatDivisi();
                    }
                  }}
                  placeholder="Nama Divisi (Misal: Acara, Konsumsi, Humas)"
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-semibold"
                />
                <button
                  type="button"
                  onClick={handleBuatDivisi}
                  className="bg-yellow-500 hover:bg-yellow-400 text-blue-950 font-bold px-6 rounded-lg text-sm shadow-md transition-colors"
                >
                  + Buat
                </button>
              </div>

              {/* Grid Kartu Divisi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {prokerForm.divisi.map((div, dIndex) => (
                  <div
                    key={dIndex}
                    className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white"
                  >
                    <div className="bg-slate-800 text-white px-4 py-2.5 flex justify-between items-center">
                      <span className="font-bold text-sm">
                        {div.namaDivisi}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleHapusDivisi(dIndex)}
                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                      >
                        Hapus
                      </button>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Koordinator
                        </label>
                        <input
                          list="pengurus-list"
                          value={div.koordinator}
                          onChange={(e) =>
                            handleKoordinatorChange(dIndex, e.target.value)
                          }
                          placeholder="Pilih/Ketik Koordinator..."
                          className="w-full px-3 py-2 bg-yellow-50 border border-yellow-200 text-blue-900 font-bold rounded-lg text-sm"
                        />
                      </div>
                      <div className="border-t border-slate-100 pt-3">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                          Anggota Divisi
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            list="pengurus-list"
                            value={tempAnggotaDivisi[dIndex] || ""}
                            onChange={(e) =>
                              setTempAnggotaDivisi((prev) => ({
                                ...prev,
                                [dIndex]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddAnggotaDivisi(dIndex);
                              }
                            }}
                            placeholder="-- Pilih Anggota --"
                            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddAnggotaDivisi(dIndex)}
                            className="bg-slate-200 px-3 rounded-lg text-slate-600 font-bold hover:bg-slate-300"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {div.anggota.map((ang, aIndex) => (
                            <div
                              key={aIndex}
                              className="flex justify-between items-center bg-white border border-slate-100 px-3 py-1.5 rounded text-sm"
                            >
                              <span>{ang}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveAnggotaDivisi(dIndex, aIndex)
                                }
                                className="text-red-500 font-bold text-xs"
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 5: DOKUMEN PROPOSAL & LPJ */}
          <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <span className="bg-blue-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  5
                </span>
                Dokumen Arsip (Gudang Dokumen)
              </h4>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Link Dokumen Proposal
                </label>
                <input
                  type="url"
                  name="fileProposal"
                  value={prokerForm.fileProposal || ""}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Masukkan link cloud/G-Drive untuk arsip Proposal Kegiatan.
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Link Laporan (LPJ)
                </label>
                <input
                  type="url"
                  name="fileLaporan"
                  value={prokerForm.fileLaporan || ""}
                  onChange={handleChange}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Masukkan link LPJ apabila proker telah berstatus Selesai/LPJ
                  Diajukan.
                </p>
              </div>
            </div>
          </section>

          <div className="bg-slate-100 p-6 flex justify-end gap-4 border border-slate-200 rounded-2xl">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-all text-sm w-full md:w-auto"
            >
              {isSaving ? "Menyimpan..." : "Update Proker & Panitia"}
            </button>
          </div>
        </form>
      )}

      {/* HIDDEN DATA UNTUK PDF RENDER BROWSER */}
      <div className="hidden">
        <div ref={printRef}>
          {printData && <SuratTugasTemplate printData={printData} />}
        </div>
      </div>
    </div>
  );
}
