"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
} from "firebase/firestore";

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
          className="w-12 h-12 object-contain"
        />
        <div className="text-[10px] leading-tight font-serif text-black">
          <p className="font-bold text-[#152B5B]">DEWAN PIMPINAN WILAYAH</p>
          <p className="font-bold text-[#152B5B]">IKATAN KELUARGA ALUMNI UII</p>
          <p>Daerah Istimewa Yogyakarta</p>
        </div>
      </div>
      <div className="border border-black px-1.5 py-0.5 text-[8px] font-mono font-bold text-black h-fit mt-1">
        FM-IKA UII-DIY-{bulanRomawi}/{tahun}
      </div>
    </div>
  );
};

export default function PrintPresensiPage() {
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
          const namaFile = `Presensi_${suratData.nomor?.replace(/\//g, "_") || "Unknown"}`;
          document.title = namaFile;

          // Prepare extra blank rows for walk-ins
          const basePenerima = Array.isArray(suratData.penerima) ? suratData.penerima : [];
          // We will add some empty rows below for people to fill in manually
          const emptyRows = Array(10).fill("");
          suratData.allPenerima = [...basePenerima, ...emptyRows];

          setSurat(suratData);

          setTimeout(() => {
            window.print();
          }, 1000);
        } else {
          toast.error("Data surat tidak ditemukan!");
        }
      } catch (error) {
        console.error("Gagal menarik data:", error);
        toast.error("Terjadi kesalahan saat menarik data surat.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchSuratData();
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 font-medium animate-pulse">Menyiapkan Dokumen...</p>
      </div>
    );
  }

  if (!surat) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-red-500 font-medium">Dokumen tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen w-full flex flex-col items-center py-8 print:py-0 print:bg-white text-black font-serif">
      <div className="print-controls mb-6 flex gap-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Cetak Dokumen
        </button>
        <button
          onClick={() => window.close()}
          className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg shadow hover:bg-gray-400 transition"
        >
          Tutup
        </button>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              background-color: white !important;
            }
            .print-hidden {
              display: none !important;
            }
          }
        `
      }} />

      <div className="w-[210mm] min-h-[297mm] bg-white shadow-xl print:shadow-none mx-auto relative flex flex-col p-[15mm]">
        <HeaderKop tanggal={surat.tanggal} />

        <div className="text-center mb-6">
          <h2 className="text-lg font-bold uppercase underline">DAFTAR HADIR</h2>
        </div>

        <div className="mb-4 text-sm">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="w-40 align-top py-1">Kegiatan</td>
                <td className="w-4 align-top py-1">:</td>
                <td className="font-semibold py-1">{surat.perihal || "-"}</td>
              </tr>
              <tr>
                <td className="w-40 align-top py-1">Hari, Tanggal</td>
                <td className="w-4 align-top py-1">:</td>
                <td className="py-1">
                  {surat.tglPelaksanaan
                    ? new Date(surat.tglPelaksanaan).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "-"}
                </td>
              </tr>
              <tr>
                <td className="w-40 align-top py-1">Waktu</td>
                <td className="w-4 align-top py-1">:</td>
                <td className="py-1">{surat.waktuPelaksanaan || "-"} WIB</td>
              </tr>
              <tr>
                <td className="w-40 align-top py-1">Tempat</td>
                <td className="w-4 align-top py-1">:</td>
                <td className="py-1">{surat.tempatPelaksanaan || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <table className="w-full border-collapse border border-black text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-transparent">
                <th className="border border-black px-2 py-2 w-12 text-center">No</th>
                <th className="border border-black px-2 py-2">Nama Lengkap</th>
                <th className="border border-black px-2 py-2 w-56">Instansi / Jabatan</th>
                <th colSpan={2} className="border border-black px-2 py-2 w-48 text-center">Tanda Tangan</th>
              </tr>
            </thead>
            <tbody>
              {surat.allPenerima.map((nama: string, idx: number) => {
                const isGanjil = (idx + 1) % 2 !== 0;
                return (
                  <tr key={idx} className="h-12">
                    <td className="border border-black px-2 py-1 text-center">{idx + 1}</td>
                    <td className="border border-black px-2 py-1">{nama}</td>
                    <td className="border border-black px-2 py-1"></td>
                    {isGanjil ? (
                      <>
                        <td className="border border-black border-r-0 px-2 py-1 align-top text-xs w-24">
                          {idx + 1}.
                        </td>
                        <td className="border border-black border-l-0 px-2 py-1 w-24"></td>
                      </>
                    ) : (
                      <>
                        <td className="border border-black border-r-0 px-2 py-1 w-24"></td>
                        <td className="border border-black border-l-0 px-2 py-1 align-top text-xs w-24">
                          {idx + 1}.
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
