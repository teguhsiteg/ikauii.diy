"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function CetakClient({ id }: { id: string }) {
  const router = useRouter();
  const [proker, setProker] = useState<any>(null);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [namaTtdAsli, setNamaTtdAsli] = useState("");
  const [correctedQrUrl, setCorrectedQrUrl] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    // Ambil base URL web agar logo pasti selalu terbaca
    setBaseUrl(window.location.origin);

    const fetchData = async () => {
      try {
        const prokerSnap = await getDoc(doc(db, "proker", id));
        if (!prokerSnap.exists()) {
          setError("Data proker tidak ditemukan di database.");
          return;
        }
        const data = prokerSnap.data();
        setProker(data);

        let ttdName = data.penanggungJawab || "______________________";

        // DI SINI TEMPAT GANTI URL-NYA BOLO
        let fixedUrl = "";
        if (data.qrValidationUrl && typeof data.qrValidationUrl === "string") {
          // Me-replace kata "validasi" menjadi "verifttd"
          fixedUrl = data.qrValidationUrl.replace("/validasi/", "/verifttd/");
          setCorrectedQrUrl(fixedUrl);

          try {
            const urlParts = fixedUrl.split("/");
            const validasiId = urlParts[urlParts.length - 1];
            if (validasiId) {
              const valDoc = await getDoc(doc(db, "validasi_ttd", validasiId));
              if (valDoc.exists()) {
                ttdName = valDoc.data().penandatangan || ttdName;
              }
            }
          } catch (err) {
            console.error("Gagal menarik nama asli:", err);
          }
        }
        setNamaTtdAsli(ttdName);
        setIsReady(true);
      } catch (err: any) {
        setError("Terjadi kesalahan sistem: " + err.message);
      }
    };

    fetchData();
  }, [id]);

  // =========================================================
  // FUNGSI SAKTI UNTUK MENGUBAH NAMA FILE SAAT DI-SAVE PDF
  // =========================================================
  const handlePrintPDF = () => {
    // 1. Simpan judul halaman asli
    const originalTitle = document.title;

    // 2. Buat format nama file yang bersih (hilangkan / atau karakter aneh)
    const nomorAman = proker?.nomorSurat
      ? proker.nomorSurat.replace(/\//g, "-")
      : "TanpaNomor";
    const kegiatanAman = proker?.namaKegiatan
      ? proker.namaKegiatan.replace(/[^a-zA-Z0-9]/g, "-")
      : "Kegiatan";

    // 3. Setel judul sementara agar browser membacanya sebagai nama file
    document.title = `ST-${nomorAman}-${kegiatanAman}`;

    // 4. Panggil jendela Print
    window.print();

    // 5. Kembalikan judul halaman seperti semula setelah print dialog muncul
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-red-500 text-center">
          <h2 className="font-bold text-red-600 text-xl mb-2">
            Gagal Memuat Surat
          </h2>
          <p className="text-slate-600">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-slate-200 px-4 py-2 rounded-lg font-bold hover:bg-slate-300"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!isReady || !proker) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 gap-4">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="font-bold text-slate-500 animate-pulse">
          Menyusun Kertas Surat Tugas...
        </p>
      </div>
    );
  }

  const formatTgl = (tglStr: string) => {
    if (!tglStr) return "...";
    try {
      return new Date(tglStr).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return tglStr;
    }
  };

  return (
    <div className="min-h-screen bg-slate-300 py-10 print:p-0 print:bg-white flex flex-col items-center">
      <style
        dangerouslySetInnerHTML={{
          __html: `
  @media print {
    @page { 
      size: A4 portrait; 
      margin: 27mm 20mm 37mm 20mm !important; 
    }

    /* Halaman pertama tetap 20mm (biar logo tidak terlalu ke bawah) */
    @page :first {
      margin-top: 20mm !important;
    }

    html, body, main { 
      background: white !important; 
      height: auto !important; 
      overflow: visible !important; 
      display: block !important; 
    }

    header, aside, nav, .no-print { 
      display: none !important; 
    }

    #kertas-a4 { 
      box-shadow: none !important; 
      margin: 0 !important; 
      padding: 0 !important; 
      width: 100% !important; 
      max-width: none !important; 
    }

    .page-break-inside-avoid { 
      page-break-inside: avoid; 
    }

    /* ====== FOOTER MULTI HALAMAN ====== */
    .print-footer {
      position: fixed;
      bottom: 20mm;
      left: 20mm;
      right: 20mm;
      font-size: 8pt;
      line-height: 1.4;
    }

    .footer-spacer {
      height: 32mm;
    }
  }
`,
        }}
      />

      <div className="bg-white px-6 py-4 rounded-xl shadow-lg mb-8 flex gap-4 w-[210mm] justify-between items-center no-print">
        <div className="font-bold text-slate-700">Preview Surat Tugas</div>
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300 transition-colors"
          >
            Kembali
          </button>
          {/* PANGGIL FUNGSI BARU DI TOMBOL INI */}
          <button
            onClick={handlePrintPDF}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md transition-colors"
          >
            🖨️ Cetak ke PDF
          </button>
        </div>
      </div>

      <div
        id="kertas-a4"
        className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[20mm] mx-auto text-black"
        style={{
          fontFamily: '"Times New Roman", Times, serif',
          fontSize: "11pt",
          lineHeight: "1.5",
        }}
      >
        <table
          style={{
            width: "100%",
            borderBottom: "4px double #1e3a8a",
            paddingBottom: "10px",
            marginBottom: "25px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: "15%",
                  verticalAlign: "middle",
                  textAlign: "center",
                }}
              >
                <img
                  src={`${baseUrl}/logo-dpp-ika.png`}
                  alt="Logo DPW IKA UII"
                  style={{ width: "80px", height: "auto" }}
                />
              </td>
              <td
                style={{
                  width: "85%",
                  verticalAlign: "middle",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "13pt",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Dewan Pimpinan Wilayah Daerah Istimewa Yogyakarta
                </div>
                <div
                  style={{
                    fontSize: "15pt",
                    fontWeight: "900",
                    textTransform: "uppercase",
                    color: "#1e3a8a",
                    margin: "4px 0",
                  }}
                >
                  Ikatan Keluarga Alumni Universitas Islam Indonesia
                </div>
                <div style={{ fontSize: "9pt" }}>
                  Sekretariat: Kampus Terpadu UII, Jl. Kaliurang KM 14.5 Sleman,
                  Yogyakarta
                </div>
                <div style={{ fontSize: "9pt" }}>
                  Email: ika.diy@uii.ac.id | Website: ikadiy.uii.ac.id | IG:
                  @ikauii.diy
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "13pt",
              fontWeight: "bold",
              textDecoration: "underline",
              marginBottom: "4px",
            }}
          >
            S U R A T T U G A S
          </div>
          <div style={{ fontSize: "11pt" }}>
            Nomor: {proker.nomorSurat || "___/ST/DPW-IKA-DIY/..."}
          </div>
        </div>

        <div
          style={{
            textAlign: "center",
            fontStyle: "italic",
            marginBottom: "25px",
          }}
        >
          Bismillahirrahmanirrahim
        </div>

        <div style={{ textAlign: "justify", marginBottom: "20px" }}>
          Pimpinan Dewan Pimpinan Wilayah Ikatan Keluarga Alumni Universitas
          Islam Indonesia (DPW IKA UII) Daerah Istimewa Yogyakarta memberikan
          tugas kepada Saudara yang namanya tersebut di bawah ini sebagai
          panitia <strong>{proker.namaKegiatan}</strong>, dengan susunan
          personalia sebagai berikut:
        </div>

        <table style={{ width: "95%", marginLeft: "5%", marginBottom: "20px" }}>
          <tbody>
            <tr>
              <td
                style={{
                  width: "35%",
                  verticalAlign: "top",
                  paddingBottom: "8px",
                }}
              >
                Penanggung Jawab
              </td>
              <td
                style={{
                  width: "5%",
                  verticalAlign: "top",
                  textAlign: "center",
                  paddingBottom: "8px",
                }}
              >
                :
              </td>
              <td
                style={{
                  width: "60%",
                  verticalAlign: "top",
                  fontWeight: "bold",
                  paddingBottom: "8px",
                }}
              >
                {proker.penanggungJawab || "-"}
              </td>
            </tr>

            {proker.ketuaSC && (
              <tr>
                <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                  Steering Committee
                </td>
                <td
                  style={{
                    verticalAlign: "top",
                    textAlign: "center",
                    paddingBottom: "8px",
                  }}
                >
                  :
                </td>
                <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                  <div style={{ fontWeight: "bold" }}>
                    Ketua: {proker.ketuaSC}
                  </div>
                  {proker.anggotaSC && proker.anggotaSC.length > 0 && (
                    <>
                      <div style={{ marginTop: "4px" }}>Anggota:</div>
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "15px",
                          listStyleType: "disc",
                        }}
                      >
                        {proker.anggotaSC.map((nama: string, idx: number) => (
                          <li key={idx}>{nama}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </td>
              </tr>
            )}

            <tr>
              <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                Organizing Committee
              </td>
              <td
                style={{
                  verticalAlign: "top",
                  textAlign: "center",
                  paddingBottom: "8px",
                }}
              >
                :
              </td>
              <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                <div style={{ fontWeight: "bold" }}>
                  Ketua: {proker.ketuaOC || "-"}
                </div>
                {proker.wakilKetuaOC && (
                  <div>Wakil Ketua: {proker.wakilKetuaOC}</div>
                )}
                {proker.sekretaris && (
                  <div>Sekretaris: {proker.sekretaris}</div>
                )}
                {proker.bendahara && <div>Bendahara: {proker.bendahara}</div>}
              </td>
            </tr>

            {proker.divisi &&
              proker.divisi.length > 0 &&
              proker.divisi.map((div: any, idx: number) => (
                <tr key={idx} className="page-break-inside-avoid">
                  <td
                    style={{
                      verticalAlign: "top",
                      paddingBottom: "8px",
                      fontWeight: "bold",
                    }}
                  >
                    {div.namaDivisi}
                  </td>
                  <td
                    style={{
                      verticalAlign: "top",
                      textAlign: "center",
                      paddingBottom: "8px",
                    }}
                  >
                    :
                  </td>
                  <td style={{ verticalAlign: "top", paddingBottom: "8px" }}>
                    {div.koordinator && (
                      <div style={{ fontWeight: "bold" }}>
                        Koordinator: {div.koordinator}
                      </div>
                    )}
                    {div.anggota && div.anggota.length > 0 && (
                      <>
                        <div style={{ marginTop: "4px" }}>Anggota:</div>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: "15px",
                            listStyleType: "disc",
                          }}
                        >
                          {div.anggota.map((nama: string, i: number) => (
                            <li key={i}>{nama}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div style={{ textAlign: "justify", marginBottom: "40px" }}>
          Masa penugasan ini berlaku terhitung mulai tanggal{" "}
          {formatTgl(proker.tglMulai)} sampai dengan{" "}
          {proker.tglSelesai
            ? formatTgl(proker.tglSelesai)
            : "seluruh rangkaian kegiatan selesai"}
          . Demikian Surat Tugas ini dibuat agar Saudara yang ditugaskan dapat
          melaksanakan tugas dan tanggung jawab yang diberikan dengan
          sebaik-baiknya.
        </div>

        <table style={{ width: "100%", pageBreakInside: "avoid" }}>
          <tbody>
            <tr>
              <td style={{ width: "55%" }}></td>
              <td style={{ width: "45%", textAlign: "center" }}>
                <div style={{ marginBottom: "5px" }}>
                  Yogyakarta,{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <div
                  style={{
                    marginBottom: proker.qrValidationUrl ? "5px" : "70px",
                  }}
                >
                  Ketua DPW IKA UII DIY,
                </div>

                {/* PASTIKAN MENGGUNAKAN correctedQrUrl DI SINI */}
                {correctedQrUrl && (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(correctedQrUrl)}`}
                    style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto",
                      display: "block",
                    }}
                    alt="QR Signature"
                  />
                )}

                <div
                  style={{
                    fontWeight: "bold",
                    textDecoration: "underline",
                    marginTop: proker.qrValidationUrl ? "5px" : "0",
                  }}
                >
                  {namaTtdAsli}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {proker.qrValidationUrl && (
          <>
            <div className="footer-spacer"></div>

            <div
              className="print-footer"
              style={{
                color: "#555",
                borderTop: "1px solid #ccc",
                paddingTop: "10px",
                textAlign: "justify",
              }}
            >
              <i>
                <b>Catatan Resmi:</b> Dokumen ini telah ditandatangani secara
                elektronik melalui Sistem Informasi DPW IKA UII DIY. Keaslian
                tanda tangan dan isi dokumen dapat diverifikasi dengan memindai
                QR Code di atas menggunakan kamera perangkat Anda.
              </i>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
