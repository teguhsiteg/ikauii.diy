"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
// 🔥 SVG Tetap Dipertahankan Biar Tidak Pecah 🔥
import { QRCodeSVG } from "qrcode.react";

// Komponen KOP SURAT (Dinamis dengan Tanggal)
const HeaderKop = ({ tanggal }: { tanggal: string }) => {
  const d = new Date(tanggal || Date.now());
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
  const bulanRomawi = arrBulan[d.getMonth()];
  const tahun = d.getFullYear();

  return (
    <div className="flex items-start justify-between border-b-2 border-black pb-2 mb-4 w-full shrink-0">
      <div className="flex items-center gap-2">
        <img
          src="/logo-dpp-ika.png"
          alt="Logo"
          className="w-8 h-8 object-contain"
        />
        <div className="text-[7px] leading-tight font-serif text-black">
          <p className="font-bold text-[#152B5B]">DEWAN PIMPINAN WILAYAH</p>
          <p className="font-bold text-[#152B5B]">IKATAN KELUARGA ALUMNI UII</p>
          <p>Daerah Istimewa Yogyakarta</p>
        </div>
      </div>
      <div className="border border-black px-1.5 py-0.5 text-[6px] font-mono font-bold text-black h-fit">
        FM-IKA UII-DIY-{bulanRomawi}/{tahun}
      </div>
    </div>
  );
};

export default function PrintSuratPage() {
  const { id } = useParams();
  const [surat, setSurat] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSuratData = async () => {
      try {
        const docRef = doc(db, "nomor_surat", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const suratData = docSnap.data();
          let ttdData = null;
          let jabatanAsliPengurus = "Pengurus DPW IKA UII DIY";

          // 🔥 KEMBALI KE FORMAT ST KEMARIN (Nomor - Perihal) 🔥
          const safeNomor = (suratData.nomor || "Tanpa_Nomor").replace(/\//g, "_");
          const safePerihal = (suratData.perihal || "Tanpa_Perihal").replace(/[^a-z0-9]/gi, "_");
          const namaFile = `${safeNomor}_${safePerihal}`;
          document.title = namaFile;

          if (suratData.qrValidationUrl) {
            const urlParts = suratData.qrValidationUrl.split("/");
            const validasiId = urlParts[urlParts.length - 1];
            if (validasiId) {
              const validasiRef = doc(db, "validasi_ttd", validasiId);
              const validasiSnap = await getDoc(validasiRef);
              if (validasiSnap.exists()) ttdData = validasiSnap.data();
            }
          }

          if (suratData.pembuat) {
            const qPengurus = query(
              collection(db, "pengurus"),
              where("nama", "==", suratData.pembuat),
            );
            const snapPengurus = await getDocs(qPengurus);
            if (!snapPengurus.empty) {
              jabatanAsliPengurus = snapPengurus.docs[0].data().jabatan;
            }
          }

          setSurat({
            id: docSnap.id,
            ...suratData,
            ttdData,
            jabatanAsliPengurus,
          });
        } else {
          toast.error("Dokumen tidak ditemukan!");
        }
      } catch (error) {
        console.error("Gagal menarik dokumen:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchSuratData();
  }, [id]);

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        Menyiapkan Dokumen...
      </div>
    );
  if (!surat) return null;

  const tglSurat = new Date(surat.tanggal || Date.now()).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const hariTglPelaksanaan = surat.tglPelaksanaan
    ? new Date(surat.tglPelaksanaan).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "...........................";

  const rawPenerima = surat.penerima || [];
  const sortedPenerima = [...rawPenerima].sort((a, b) => a.localeCompare(b));

  // 🔥 UBAH DI SINI: Kapasitas per kolom disesuaikan dengan sisa ruang kertas 🔥
  const maxRowsCol2 = 30; // Kolom 2 ada blok Agenda, muat maks 40 baris
  const maxRowsCol3 = 35; // Kolom 3 kosong melompong di bawah kop, muat maks 50 baris
  const maxRowsLampiran = 50; // Kapasitas per kolom di halaman lampiran

  const col2Penerima = sortedPenerima.slice(0, maxRowsCol2);
  const col3Penerima = sortedPenerima.slice(
    maxRowsCol2,
    maxRowsCol2 + maxRowsCol3,
  );

  // Sisa penerima (jika lebih dari 90 orang)
  const sisaPenerima = sortedPenerima.slice(maxRowsCol2 + maxRowsCol3);

  // Pecah sisa penerima menjadi beberapa halaman lampiran (3 Kolom x 50 = 150 orang per lembar lampiran)
  const lampiranPages = [];
  for (let i = 0; i < sisaPenerima.length; i += maxRowsLampiran * 3) {
    lampiranPages.push(sisaPenerima.slice(i, i + maxRowsLampiran * 3));
  }

  const namaTTD =
    surat.ttdData?.penandatangan ||
    surat.pembuat ||
    ".........................";
  const jabatanTTD = surat.ttdData?.jabatan || surat.jabatanAsliPengurus;

  const PrintStyles = () => (
    <style
      dangerouslySetInnerHTML={{
        __html: `
        @media print {
          /* 🔥 Auto Set Landscape atau Portrait Tergantung Template 🔥 */
          @page { 
            size: ${surat.templateSurat === "Undangan Lipat 3" ? "landscape" : "portrait"}; 
            margin: 0; 
          }
          
          /* Reset margin & padding browser agar full kertas */
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important; 
            overflow: visible !important; 
          }

          /* Sembunyikan elemen bawaan web (Navbar, Footer, dsb) secara elegan */
          header, footer, nav, [class*="fixed"] { 
            display: none !important; 
          }

          /* Ini yang memicu print membuat kertas baru! */
          .page-break { 
            page-break-before: always !important; 
            break-before: page !important; 
          }
        }
      `,
      }}
    />
  );

  // =================================================================
  // TEMPLATE 1 : UNDANGAN LIPAT 3 (LANDSCAPE)
  // =================================================================
  if (surat.templateSurat === "Undangan Lipat 3") {
    return (
      <>
        <PrintStyles />
        {/* 🔥 TAMBAHKAN 'print:block' AGAR HALAMAN BISA TURUN KE BAWAH 🔥 */}
        <div className="bg-slate-100 min-h-screen flex flex-col items-center py-10 print:py-0 print:bg-white text-black font-sans print:block">
          <button
            onClick={() => window.print()}
            className="mb-8 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg print:hidden hover:bg-blue-700"
          >
            Cetak Undangan Lipat 3
          </button>

          {/* 🔥 TAMBAHKAN 'print:block' JUGA DI SINI 🔥 */}
          <div
            id="printable-area"
            className="w-full flex flex-col items-center print:block"
          >
            {/* ================================================== */}
            {/* HALAMAN 1 (UTAMA) */}
            {/* ================================================== */}
            <div className="w-[297mm] h-[210mm] bg-white flex border border-slate-200 print:border-none relative overflow-hidden page-break">
              {/* KOLOM 1: REDAKSI */}
              <div className="w-1/3 h-full p-[8mm] flex flex-col border-r border-dashed border-gray-300">
                <HeaderKop tanggal={surat.tanggal} />
                <h1 className="text-[11px] font-bold text-center mb-4 propercase">
                  UNDANGAN RAPAT
                </h1>
                <table className="text-[9px] mb-4 w-full">
                  <tbody>
                    <tr>
                      <td className="w-[75px] whitespace-nowrap pb-0.5">
                        No. Und.
                      </td>
                      <td className="w-2 pb-0.5">:</td>
                      <td className="pb-0.5">{surat.nomor}</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap pb-0.5">Tgl. Und.</td>
                      <td className="pb-0.5">:</td>
                      <td className="pb-0.5">{tglSurat}</td>
                    </tr>
                    <tr>
                      <td className="whitespace-nowrap pb-0.5">Hal</td>
                      <td className="pb-0.5">:</td>
                      <td className="font-bold pb-0.5 uppercase">
                        {surat.jenis}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div className="text-[9px] mb-4">
                  <p>Yth. Bapak/Ibu/Sdr.</p>
                  <p className="font-bold">Pengurus DPW IKA UII DIY</p>
                </div>
                <p className="text-[9px] mb-2 leading-tight text-justify whitespace-pre-wrap">
                  {surat.isiSurat ||
                    "Assalamu'alaikum warahmatullahi wabarakaatuh,\nMengharap kehadiran Bapak/Ibu/Sdr. pada :"}
                </p>

                {(surat.tglPelaksanaan ||
                  surat.waktuPelaksanaan ||
                  surat.tempatPelaksanaan ||
                  surat.perihal) && (
                  <table className="text-[9px] mb-3 w-full">
                    <tbody>
                      <tr>
                        <td className="w-[85px] whitespace-nowrap align-top pb-1">
                          Hari / Tanggal
                        </td>
                        <td className="w-2 align-top pb-1">:</td>
                        <td className="font-bold align-top pb-1">
                          {hariTglPelaksanaan}
                        </td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap align-top pb-1">
                          Jam
                        </td>
                        <td className="align-top pb-1">:</td>
                        <td className="font-bold align-top pb-1">
                          {surat.waktuPelaksanaan || "--:--"} WIB
                        </td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap align-top pb-1">
                          {surat.tipePelaksanaan === "Online" ? "Link Zoom/Meet" : "Lokasi"}
                        </td>
                        <td className="align-top pb-1">:</td>
                        <td className="font-bold align-top pb-1">
                          {surat.tipePelaksanaan === "Online" ? (
                            <a href={surat.linkZoom} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                              {surat.linkZoom || "Belum ada link"}
                            </a>
                          ) : (
                            surat.tempatPelaksanaan || "-"
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="whitespace-nowrap align-top">Acara</td>
                        <td className="align-top">:</td>
                        <td className="font-bold align-top propercase leading-tight">
                          {surat.perihal}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {surat.penutupSurat && (
                  <p className="text-[9px] mb-4 leading-tight text-justify whitespace-pre-wrap">
                    {surat.penutupSurat}
                  </p>
                )}

                <div className="mt-6 mb-4 w-full flex justify-end pr-6">
                  <div className="flex flex-col items-center text-[9px]">
                    <p className="mb-1 font-bold">{jabatanTTD},</p>
                    <div className="h-14 flex flex-col items-center justify-center mb-1">
                      {surat.qrValidationUrl ? (
                        <QRCodeSVG
                          value={surat.qrValidationUrl}
                          size={50}
                          level={"H"}
                        />
                      ) : (
                        <div className="w-12 h-12 border border-dashed border-gray-400 flex items-center justify-center text-[6px] text-gray-400 text-center p-1">
                          Belum divalidasi
                        </div>
                      )}
                    </div>
                    <p className="font-bold underline propercase">{namaTTD}</p>
                  </div>
                </div>

                <div className="mt-auto pt-2 border-t border-gray-100 w-full">
                  <p className="text-[6px] text-gray-400 leading-tight italic">
                    Validasi: Dokumen sah diterbitkan secara elektronik melalui
                    sistem E-Office DPW IKA UII DIY.
                  </p>
                </div>
              </div>

              {/* KOLOM 2: AGENDA & NAMA 1-40 */}
              <div className="w-1/3 h-full p-[8mm] flex flex-col border-r border-dashed border-gray-300">
                <HeaderKop tanggal={surat.tanggal} />
                <h1 className="text-[11px] font-bold text-center mb-4 uppercase">
                  AGENDA RAPAT
                </h1>
                <div className="border border-black p-2 text-center text-[9px] mb-4">
                  <p className="font-bold bg-gray-200 px-2 py-0.5 border-b border-black uppercase">
                    Pokok Bahasan
                  </p>
                  <p className="p-1 font-medium leading-tight">
                    {surat.perihal}
                  </p>
                </div>
                <h2 className="text-[9px] font-bold mb-2">
                  DAFTAR PESERTA (A-Z)
                </h2>
                <table className="w-full text-[8px] border-collapse border border-black">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-black px-1 w-6 text-center">
                        No
                      </th>
                      <th className="border border-black px-2 text-left">
                        Nama Pengurus
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {col2Penerima.length > 0 ? (
                      col2Penerima.map((nama, idx) => (
                        <tr key={idx}>
                          <td className="border border-black text-center py-0.5">
                            {idx + 1}.
                          </td>
                          <td className="border border-black px-2 py-0.5">
                            {nama}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={2}
                          className="border border-black py-4 text-center text-gray-400"
                        >
                          Daftar kosong
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* KOLOM 3: NAMA 41-90 */}
              <div className="w-1/3 h-full p-[8mm] flex flex-col">
                <HeaderKop tanggal={surat.tanggal} />
                {col3Penerima.length > 0 ? (
                  <>
                    <h2 className="text-[9px] font-bold mb-2">
                      DAFTAR PESERTA (Lanjutan)
                    </h2>
                    <table className="w-full text-[8px] border-collapse border border-black">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black px-1 w-6 text-center">
                            No
                          </th>
                          <th className="border border-black px-2 text-left">
                            Nama Pengurus
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {col3Penerima.map((nama, idx) => (
                          <tr key={idx}>
                            <td className="border border-black text-center py-0.5">
                              {idx + maxRowsCol2 + 1}.
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              {nama}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                ) : (
                  <div className="flex-grow flex items-center justify-center opacity-10">
                    <img
                      src="/logo-dpp-ika.png"
                      className="w-48 h-48 object-contain"
                      alt="Watermark"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ================================================== */}
            {/* HALAMAN 2, 3, DST (JIKA PESERTA LEBIH DARI 90 ORANG) */}
            {/* ================================================== */}
            {lampiranPages.map((pageNames, pageIdx) => {
              // Pecah 150 nama jadi 3 kolom
              const pCol1 = pageNames.slice(0, maxRowsLampiran);
              const pCol2 = pageNames.slice(
                maxRowsLampiran,
                maxRowsLampiran * 2,
              );
              const pCol3 = pageNames.slice(
                maxRowsLampiran * 2,
                maxRowsLampiran * 3,
              );
              const offsetStart =
                maxRowsCol2 + maxRowsCol3 + pageIdx * maxRowsLampiran * 3;

              return (
                <div
                  key={pageIdx}
                  className="w-[297mm] h-[210mm] bg-white flex border border-slate-200 print:border-none relative overflow-hidden mt-10 print:mt-0 page-break"
                >
                  {/* LAMPIRAN KOLOM 1 */}
                  <div className="w-1/3 h-full p-[8mm] flex flex-col border-r border-dashed border-gray-300">
                    <HeaderKop tanggal={surat.tanggal} />
                    <h2 className="text-[9px] font-bold mb-2 uppercase text-center bg-gray-100 p-1 border border-black">
                      LAMPIRAN UNDANGAN (Hal. {pageIdx + 2})
                    </h2>
                    <table className="w-full text-[8px] border-collapse border border-black mt-2">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-black px-1 w-6 text-center">
                            No
                          </th>
                          <th className="border border-black px-2 text-left">
                            Nama Pengurus
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pCol1.map((nama, idx) => (
                          <tr key={idx}>
                            <td className="border border-black text-center py-0.5">
                              {offsetStart + idx + 1}.
                            </td>
                            <td className="border border-black px-2 py-0.5">
                              {nama}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* LAMPIRAN KOLOM 2 */}
                  <div className="w-1/3 h-full p-[8mm] flex flex-col border-r border-dashed border-gray-300">
                    <HeaderKop tanggal={surat.tanggal} />
                    {pCol2.length > 0 && (
                      <table className="w-full text-[8px] border-collapse border border-black mt-10">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-black px-1 w-6 text-center">
                              No
                            </th>
                            <th className="border border-black px-2 text-left">
                              Nama Pengurus
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pCol2.map((nama, idx) => (
                            <tr key={idx}>
                              <td className="border border-black text-center py-0.5">
                                {offsetStart + maxRowsLampiran + idx + 1}.
                              </td>
                              <td className="border border-black px-2 py-0.5">
                                {nama}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* LAMPIRAN KOLOM 3 */}
                  <div className="w-1/3 h-full p-[8mm] flex flex-col">
                    <HeaderKop tanggal={surat.tanggal} />
                    {pCol3.length > 0 && (
                      <table className="w-full text-[8px] border-collapse border border-black mt-10">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-black px-1 w-6 text-center">
                              No
                            </th>
                            <th className="border border-black px-2 text-left">
                              Nama Pengurus
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pCol3.map((nama, idx) => (
                            <tr key={idx}>
                              <td className="border border-black text-center py-0.5">
                                {offsetStart + maxRowsLampiran * 2 + idx + 1}.
                              </td>
                              <td className="border border-black px-2 py-0.5">
                                {nama}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // =================================================================
  // TEMPLATE 2 : SURAT RESMI STANDAR (A4 PORTRAIT)
  // =================================================================
  return (
    <>
      <PrintStyles />
      <div className="bg-slate-100 min-h-screen font-serif flex flex-col items-center py-10 print:py-0 print:bg-white text-black">
        <button
          onClick={() => window.print()}
          className="mb-8 bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg print:hidden hover:bg-blue-700"
        >
          Cetak Surat (A4)
        </button>

        <div
          id="printable-area"
          className="w-[210mm] min-h-[297mm] bg-white shadow-2xl print:shadow-none p-[20mm] relative border border-slate-200 print:border-none flex flex-col bg-white"
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none z-0">
            <img
              src="/logo-dpp-ika.png"
              className="w-96 h-96 object-contain"
              alt="Watermark"
            />
          </div>

          <div className="flex items-center border-b-4 border-double border-black pb-4 mb-6 relative z-10">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-24 h-24 object-contain mr-6"
            />
            <div className="text-center flex-grow">
              <h1 className="text-xl font-bold uppercase text-[#152B5B]">
                DEWAN PIMPINAN WILAYAH
              </h1>
              <h2 className="text-2xl font-black uppercase text-[#152B5B]">
                IKATAN KELUARGA ALUMNI (IKA) UII
              </h2>
              <h3 className="text-lg font-bold text-[#152B5B] mb-1">
                DAERAH ISTIMEWA YOGYAKARTA
              </h3>
              <p className="text-[11px] text-gray-600 leading-tight">
                Sekretariat: Jl. Cik Di Tiro No.1, Terban, Kec. Gondokusuman,
                Kota Yogyakarta, DIY 55223
              </p>
            </div>
          </div>

          <div className="flex justify-between text-sm mb-8 relative z-10">
            <div className="space-y-1">
              <div className="flex">
                <span className="w-[100px] font-bold">Nomor</span>
                <span>: {surat.nomor}</span>
              </div>
              <div className="flex">
                <span className="w-[100px] font-bold">Hal</span>
                <span>
                  : <span className="uppercase">{surat.perihal}</span>
                </span>
              </div>
            </div>
            <p>Yogyakarta, {tglSurat}</p>
          </div>

          <div className="text-sm mb-6 relative z-10">
            <p className="mb-1">Kepada Yth.</p>
            <div
              className={`pl-6 mt-1 font-bold ${sortedPenerima.length > 4 ? "grid grid-cols-2 gap-x-8 gap-y-1" : "space-y-1"}`}
            >
              {sortedPenerima.map((nama: string, idx: number) => (
                <p key={idx}>
                  {idx + 1}. {nama}
                </p>
              ))}
            </div>
            <p className="mt-2">Di Tempat</p>
          </div>

          <div className="text-sm text-justify leading-relaxed whitespace-pre-wrap flex-grow relative z-10">
            {/* 🔥 ISI SURAT + PENUTUP SURAT A4 🔥 */}
            <div className="mb-4">{surat.isiSurat}</div>
            
            {(surat.tglPelaksanaan || surat.waktuPelaksanaan || surat.tempatPelaksanaan || surat.linkZoom) && (
              <table className="text-sm mb-6 w-full ml-8">
                <tbody>
                  <tr>
                    <td className="w-40 whitespace-nowrap align-top pb-2">
                      Hari / Tanggal
                    </td>
                    <td className="w-4 align-top pb-2">:</td>
                    <td className="font-bold align-top pb-2">
                      {hariTglPelaksanaan}
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap align-top pb-2">
                      Jam
                    </td>
                    <td className="align-top pb-2">:</td>
                    <td className="font-bold align-top pb-2">
                      {surat.waktuPelaksanaan || "--:--"} WIB
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap align-top pb-2">
                      {surat.tipePelaksanaan === "Online" ? "Link Zoom/Meet" : "Tempat"}
                    </td>
                    <td className="align-top pb-2">:</td>
                    <td className="font-bold align-top pb-2">
                      {surat.tipePelaksanaan === "Online" ? (
                        <a href={surat.linkZoom} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                          {surat.linkZoom || "Belum ada link"}
                        </a>
                      ) : (
                        surat.tempatPelaksanaan || "-"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {surat.penutupSurat && (
              <div className="mb-10">{surat.penutupSurat}</div>
            )}
          </div>

          <div className="flex justify-end text-sm mt-4 relative z-10">
            <div className="text-center w-72 flex flex-col items-center">
              {/* 🔥 JABATAN PENANDA TANGAN A4 🔥 */}
              <p className="mb-1 font-bold">{jabatanTTD}</p>
              <div className="h-24 flex flex-col items-center justify-center my-2 bg-white/80">
                {surat.qrValidationUrl ? (
                  <>
                    <QRCodeSVG
                      value={surat.qrValidationUrl}
                      size={80}
                      level={"H"}
                    />
                    <p className="text-[7px] text-blue-800 mt-2 font-black uppercase tracking-wider">
                      Otentikasi Digital TTE
                    </p>
                  </>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-300 flex items-center justify-center text-[10px] text-gray-400">
                    Belum di-ACC
                  </div>
                )}
              </div>
              <p className="font-bold underline uppercase underline-offset-4">
                {namaTTD}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200">
            <p className="text-[8px] text-gray-500 leading-relaxed italic">
              Otentikasi: Dokumen sah divalidasi elektronik menggunakan sistem
              E-Office DPW IKA UII DIY.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
