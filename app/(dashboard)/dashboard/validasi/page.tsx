"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
  where,
  deleteDoc, // TAMBAHAN IMPORT UNTUK DELETE
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react"; // Mengizinkan export statis tanpa data awal [cite: 2026-03-03]

export default function ValidasiAdminPage() {
  const [dokumenList, setDokumenList] = useState<any[]>([]);
  const [prokerList, setProkerList] = useState<any[]>([]);
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nomorSurat: "",
    perihal: "",
    penandatangan: "",
    jabatan: "",
    tanggal: "",
  });

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const qQR = query(
        collection(db, "validasi_ttd"),
        orderBy("createdAt", "desc"),
      );
      const snapQR = await getDocs(qQR);
      setDokumenList(snapQR.docs.map((d) => ({ id: d.id, ...d.data() })));

      const qProker = query(
        collection(db, "proker"),
        orderBy("createdAt", "desc"),
      );
      const snapProker = await getDocs(qProker);
      setProkerList(
        snapProker.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((p: any) => p.nomorSurat),
      );

      const snapPengurus = await getDocs(collection(db, "pengurus"));
      setPengurusList(
        snapPengurus.docs.map((d) => ({ id: d.id, ...d.data() })),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handlePilihSurat = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nomor = e.target.value;
    const proker = prokerList.find((p) => p.nomorSurat === nomor);
    setFormData({
      ...formData,
      nomorSurat: nomor,
      perihal: proker ? proker.namaKegiatan : "",
    });
  };

  const handlePilihPengurus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nama = e.target.value;
    const pengurus = pengurusList.find((p) => p.nama === nama);
    setFormData({
      ...formData,
      penandatangan: nama,
      jabatan: pengurus ? pengurus.jabatan || "" : "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "validasi_ttd"), {
        ...formData,
        createdAt: serverTimestamp(),
        status: "Valid",
      });
      setFormData({
        nomorSurat: "",
        perihal: "",
        penandatangan: "",
        jabatan: "",
        tanggal: "",
      });
      fetchAllData();
      alert("✅ QR Code berhasil dibuat!");
    } catch (error) {
      alert("❌ Gagal membuat QR Code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = (id: string, nomor: string) => {
    const canvas = document.getElementById(`qr-${id}`) as HTMLCanvasElement;
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let link = document.createElement("a");
    link.href = pngUrl;
    link.download = `QR_TTD_${nomor.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";

  // FUNGSI BARU: BUBUHKAN QR KE SURAT TUGAS
  const handleBubuhkanQR = async (docData: any) => {
    try {
      const qProker = query(
        collection(db, "proker"),
        where("nomorSurat", "==", docData.nomorSurat),
      );
      const snap = await getDocs(qProker);

      if (snap.empty) {
        alert(
          `❌ Gagal: Surat dengan nomor ${docData.nomorSurat} tidak ditemukan di database Proker.`,
        );
        return;
      }

      const prokerId = snap.docs[0].id;
      const validationUrl = `${baseUrl}/validasi/${docData.id}`;

      await updateDoc(doc(db, "proker", prokerId), {
        qrValidationUrl: validationUrl,
      });

      alert(
        "✅ BERHASIL! QR Code telah menempel di Surat Tugas secara elektronik.",
      );
    } catch (error) {
      console.error(error);
      alert("❌ Terjadi kesalahan sistem saat membubuhkan QR.");
    }
  };

  // =========================================================
  // 💥 FUNGSI SAKTI: HAPUS QR CODE
  // =========================================================
  const handleDeleteQR = async (qrId: string, nomorSurat: string) => {
    // 1. Konfirmasi dulu biar nggak salah hapus
    const isConfirm = window.confirm(
      `Yakin ingin menghapus QR Code untuk surat nomor: ${nomorSurat}?\n\nJika QR ini sudah dibubuhkan, maka akan otomatis dicopot dari dokumen tersebut.`,
    );

    if (!isConfirm) return;

    try {
      // 2. Hapus data dari koleksi "validasi_ttd"
      await deleteDoc(doc(db, "validasi_ttd", qrId));

      // 3. Cari Proker yang nomor suratnya sama, lalu copot QR-nya (kosongkan string-nya)
      const qProker = query(
        collection(db, "proker"),
        where("nomorSurat", "==", nomorSurat),
      );
      const snap = await getDocs(qProker);

      if (!snap.empty) {
        // Asumsi 1 nomor surat = 1 proker
        const prokerId = snap.docs[0].id;
        await updateDoc(doc(db, "proker", prokerId), {
          qrValidationUrl: "", // Mengosongkan field QR
        });
      }

      // 4. Refresh tampilan tabel
      alert("✅ QR Code berhasil dihapus!");
      fetchAllData();
    } catch (error) {
      console.error("Gagal menghapus QR:", error);
      alert("❌ Terjadi kesalahan saat menghapus QR Code.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full mb-2 uppercase tracking-widest">
          Digital Signature
        </div>
        <h2 className="text-3xl font-extrabold text-blue-950 mb-2">
          QR Tanda Tangan
        </h2>
        <p className="text-slate-500 text-sm">
          Buat dan kelola QR Code untuk memvalidasi keaslian tanda tangan.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 sticky top-24">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="text-xl">✍️</span> Buat QR Baru
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Pilih Nomor Surat
                </label>
                <select
                  required
                  value={formData.nomorSurat}
                  onChange={handlePilihSurat}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-blue-950"
                >
                  <option value="">-- Pilih dari database --</option>
                  {prokerList.map((p) => (
                    <option key={p.id} value={p.nomorSurat}>
                      {p.nomorSurat} ({p.namaKegiatan.substring(0, 20)}...)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Perihal / Kegiatan
                </label>
                <input
                  required
                  type="text"
                  value={formData.perihal}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-sm outline-none text-slate-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Pilih Penandatangan
                </label>
                <select
                  required
                  value={formData.penandatangan}
                  onChange={handlePilihPengurus}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500 font-medium text-blue-950"
                >
                  <option value="">-- Pilih Pengurus --</option>
                  {pengurusList
                    .filter((p) => p.nama)
                    .map((p) => (
                      <option key={p.id} value={p.nama}>
                        {p.nama}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Jabatan
                </label>
                <input
                  required
                  type="text"
                  value={formData.jabatan}
                  readOnly
                  className="w-full bg-slate-100 border border-slate-200 p-2.5 rounded-xl text-sm outline-none text-slate-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Tanggal Disahkan
                </label>
                <input
                  required
                  type="date"
                  value={formData.tanggal}
                  onChange={(e) =>
                    setFormData({ ...formData, tanggal: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-sm outline-none focus:border-blue-500"
                />
              </div>
              <button
                disabled={isSubmitting}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors mt-2 shadow-md disabled:opacity-50"
              >
                {isSubmitting ? "Memproses..." : "➕ Generate QR Code"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-10 text-center text-slate-400 font-bold animate-pulse">
                Menyiapkan Database...
              </div>
            ) : dokumenList.length === 0 ? (
              <div className="p-16 text-center">
                <div className="text-4xl mb-3">📭</div>
                <h3 className="font-bold text-slate-700">
                  Belum Ada Tanda Tangan
                </h3>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-bold">QR Code</th>
                      <th className="p-4 font-bold">Informasi Dokumen</th>
                      <th className="p-4 font-bold text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dokumenList.map((doc) => {
                      // KARENA KITA SUDAH PAKAI FOLDER verifttd, URl-nya harus disesuaikan:
                      // Biar amannya, pakai ini:
                      const validationUrl = `${baseUrl}/verifttd/${doc.id}`;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="p-4 align-top w-32">
                            <div className="bg-white p-2 border border-slate-200 rounded-xl inline-block shadow-sm">
                              <QRCodeCanvas
                                id={`qr-${doc.id}`}
                                value={validationUrl}
                                size={90}
                                level={"H"}
                                includeMargin={true}
                              />
                            </div>
                          </td>
                          <td className="p-4 align-top">
                            <div className="font-bold text-blue-950 text-sm mb-1">
                              {doc.nomorSurat}
                            </div>
                            <div className="text-xs text-slate-600 mb-2 font-medium">
                              {doc.perihal}
                            </div>
                            <div className="text-[11px] text-slate-500 space-y-0.5">
                              <div>
                                <span className="font-bold">Oleh:</span>{" "}
                                {doc.penandatangan} ({doc.jabatan})
                              </div>
                              <div>
                                <span className="font-bold">Tanggal:</span>{" "}
                                {doc.tanggal}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle text-center w-40">
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() =>
                                  downloadQR(doc.id, doc.nomorSurat)
                                }
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-slate-300"
                              >
                                📥 Unduh Gambar
                              </button>

                              <button
                                onClick={() => handleBubuhkanQR(doc)}
                                className="bg-green-100 hover:bg-green-600 text-green-800 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-green-200 shadow-sm"
                              >
                                📌 Bubuhkan QR
                              </button>

                              {/* TOMBOL HAPUS BARU */}
                              <button
                                onClick={() =>
                                  handleDeleteQR(doc.id, doc.nomorSurat)
                                }
                                className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-colors border border-red-200 shadow-sm"
                              >
                                🗑️ Hapus QR
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
          </div>
        </div>
      </div>
    </div>
  );
}
