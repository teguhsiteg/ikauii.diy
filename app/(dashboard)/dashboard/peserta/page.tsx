"use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  where,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import * as XLSX from "xlsx";

export default function PesertaAgendaPage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [agendaList, setAgendaList] = useState<any[]>([]);
  const [selectedAgenda, setSelectedAgenda] = useState<any>(null);
  const [pesertaList, setPesertaList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPeserta, setIsLoadingPeserta] = useState(false);

  // Fitur Hapus Masal
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Fitur Scanner QR Code & Kamera
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"kamera" | "manual">("kamera");
  const [scanInput, setScanInput] = useState("");
  const [scanMessage, setScanMessage] = useState({ type: "", text: "" });

  // --- STATE Tampilkan QR Code Peserta ---
  const [selectedQR, setSelectedQR] = useState<any>(null);

  // --- STATE FITUR IMPORT EXCEL & PREVIEW ---
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Preview
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImportingData, setIsImportingData] = useState(false);
  const [autoCheckInImport, setAutoCheckInImport] = useState(true); // Opsi otomatis hadir

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pesertaListRef = useRef<any[]>([]);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    pesertaListRef.current = pesertaList;
  }, [pesertaList]);

  // 1. Cek User & Role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error("Gagal ambil profil:", error);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch Agenda berdasarkan Role
  useEffect(() => {
    const fetchAgendas = async () => {
      if (!userProfile) return;
      try {
        const q = query(collection(db, "agenda"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        let agendas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        if (userProfile.role !== "super_admin") {
          agendas = agendas.filter((a: any) => {
            const isSatuBidang = a.bidang === userProfile.bidang;
            const isKetupel =
              a.koordinator &&
              a.koordinator
                .toLowerCase()
                .includes(userProfile.name.toLowerCase());
            return isSatuBidang || isKetupel;
          });
        }
        setAgendaList(agendas);
      } catch (error) {
        console.error("Gagal load agenda:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAgendas();
  }, [userProfile]);

  // 3. Load Peserta saat Agenda Diklik
  const handleSelectAgenda = async (agenda: any) => {
    setSelectedAgenda(agenda);
    setIsLoadingPeserta(true);
    setSelectedIds([]);
    try {
      const q = query(
        collection(db, "agenda_peserta"),
        where("agendaId", "==", agenda.id),
      );
      const snap = await getDocs(q);

      const rawData = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rawData.sort(
        (a: any, b: any) =>
          new Date(b.waktuDaftar).getTime() - new Date(a.waktuDaftar).getTime(),
      );

      setPesertaList(rawData);
    } catch (error) {
      console.error("Gagal load peserta:", error);
    } finally {
      setIsLoadingPeserta(false);
    }
  };

  // --- FITUR HAPUS 1 / MASAL ---
  const handleSelectAll = (e: any) => {
    if (e.target.checked) {
      setSelectedIds(pesertaList.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const deleteSingle = async (id: string) => {
    if (confirm("Yakin ingin menghapus peserta ini?")) {
      await deleteDoc(doc(db, "agenda_peserta", id));
      setPesertaList(pesertaList.filter((p) => p.id !== id));
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    }
  };

  const deleteBulk = async () => {
    if (
      confirm(`Yakin ingin menghapus ${selectedIds.length} peserta terpilih?`)
    ) {
      try {
        await Promise.all(
          selectedIds.map((id) => deleteDoc(doc(db, "agenda_peserta", id))),
        );
        setPesertaList(pesertaList.filter((p) => !selectedIds.includes(p.id)));
        setSelectedIds([]);
      } catch (error) {
        alert("Gagal menghapus beberapa data.");
      }
    }
  };

  const toggleCheckIn = async (id: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, "agenda_peserta", id), {
        statusCheckIn: !currentStatus,
      });
      setPesertaList(
        pesertaList.map((p) =>
          p.id === id ? { ...p, statusCheckIn: !currentStatus } : p,
        ),
      );
    } catch (error) {
      console.error("Gagal update check-in", error);
    }
  };

  // --- FUNGSI INTI PROSES CHECK-IN ---
  const processCheckIn = async (scannedId: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const id = scannedId.trim();
    if (!id) {
      isProcessingRef.current = false;
      return;
    }

    const peserta = pesertaListRef.current.find((p) => p.id === id);

    if (!peserta) {
      setScanMessage({ type: "error", text: "❌ ID Tiket Tidak Ditemukan!" });
    } else if (peserta.statusCheckIn) {
      setScanMessage({
        type: "warning",
        text: `⚠️ Tiket ${peserta.nama} SUDAH DIGUNAKAN!`,
      });
    } else {
      await updateDoc(doc(db, "agenda_peserta", id), { statusCheckIn: true });
      setPesertaList((prev) =>
        prev.map((p) => (p.id === id ? { ...p, statusCheckIn: true } : p)),
      );

      const rombonganText =
        peserta.jumlahTiket > 1 ? ` (${peserta.jumlahTiket} Orang)` : "";
      setScanMessage({
        type: "success",
        text: `✅ Berhasil Check-In: ${peserta.nama}${rombonganText}`,
      });
    }

    setScanInput("");

    setTimeout(() => {
      setScanMessage({ type: "", text: "" });
      isProcessingRef.current = false;
    }, 3000);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processCheckIn(scanInput);
  };

  // --- ENGINE KAMERA ---
  useEffect(() => {
    let scanner: any = null;
    let isMounted = true;

    const startCamera = async () => {
      if (isScannerOpen && scanMode === "kamera") {
        await new Promise((resolve) => setTimeout(resolve, 200));

        const readerElement = document.getElementById("reader");
        if (!readerElement || !isMounted) return;

        readerElement.innerHTML = "";

        try {
          const { Html5QrcodeScanner } = await import("html5-qrcode");
          scanner = new Html5QrcodeScanner(
            "reader",
            { qrbox: { width: 250, height: 250 }, fps: 5 },
            false,
          );

          scanner.render(
            (decodedText: string) => {
              processCheckIn(decodedText);
            },
            (errorMessage: any) => {},
          );
        } catch (error) {
          console.error("Gagal inisiasi kamera:", error);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (scanner) {
        scanner
          .clear()
          .catch((error: any) => console.error("Gagal matikan kamera:", error));
      }
    };
  }, [isScannerOpen, scanMode]);

  // --- EXPORT EXCEL ---
  const downloadExcel = () => {
    const dataToExport = pesertaList.map((p, index) => ({
      No: index + 1,
      Status: p.statusCheckIn ? "Hadir" : "Belum Hadir",
      "Waktu Daftar": new Date(p.waktuDaftar).toLocaleString("id-ID"),
      "Tipe Daftar": p.tipeDaftar || "Individu",
      "Jml Tiket": p.jumlahTiket || 1,
      "Nama Lengkap": p.nama,
      "Anggota Rombongan": p.namaAnggota || "-",
      Email: p.email || "-",
      "No. WhatsApp": p.whatsapp,
      Fakultas: p.fakultas,
      Angkatan: p.angkatan,
      "Instansi/Pekerjaan": p.instansi,
      "ID Tiket (Sistem)": p.id,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const wscols = [
      { wch: 5 },
      { wch: 15 },
      { wch: 20 },
      { wch: 15 },
      { wch: 10 },
      { wch: 30 },
      { wch: 40 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 10 },
      { wch: 30 },
      { wch: 25 },
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

    const safeFileName = selectedAgenda.judul
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    XLSX.writeFile(workbook, `Data_Peserta_${safeFileName}.xlsx`);
  };

  // --- IMPORT EXCEL (DENGAN PREVIEW) ---
  const downloadTemplateImport = () => {
    const templateData = [
      {
        Nama: "Contoh Budi Santoso",
        Email: "budi@gmail.com",
        WhatsApp: "081234567890",
        Fakultas: "FTI",
        Angkatan: "2018",
        Instansi: "PT. Inovasi Cerdas",
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template_Import");
    XLSX.writeFile(workbook, "Template_Import_Peserta.xlsx");
  };

  const handleFilePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        // Hanya ambil data yang minimal kolom Nama-nya tidak kosong
        const validData = data.filter(
          (row: any) => row.Nama && row.Nama.toString().trim() !== "",
        );
        setPreviewData(validData);
        setImportStep(2); // Pindah ke tab Preview
      } catch (error) {
        console.error("Error baca excel:", error);
        alert("Gagal membaca file Excel. Pastikan formatnya benar.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImportSave = async () => {
    if (previewData.length === 0 || !selectedAgenda) return;
    setIsImportingData(true);

    try {
      let successCount = 0;
      const promises = previewData.map(async (row: any) => {
        const newPeserta = {
          agendaId: selectedAgenda.id,
          agendaJudul: selectedAgenda.judul,
          nama: row.Nama?.toString() || "",
          email: row.Email?.toString() || "",
          whatsapp: row.WhatsApp?.toString() || "",
          fakultas: row.Fakultas?.toString() || "",
          angkatan: row.Angkatan?.toString() || "",
          instansi: row.Instansi?.toString() || "",
          tipeDaftar: "Individu",
          jumlahTiket: 1,
          namaAnggota: "",
          statusCheckIn: autoCheckInImport,
          waktuDaftar: new Date().toISOString(),
        };

        await addDoc(collection(db, "agenda_peserta"), newPeserta);
        successCount++;
      });

      await Promise.all(promises);

      alert(`Berhasil menyimpan ${successCount} data peserta ke database!`);
      closeImportModal();
      handleSelectAgenda(selectedAgenda); // Refresh Data Table
    } catch (error) {
      console.error("Gagal simpan import:", error);
      alert("Terjadi kesalahan saat memproses data ke server.");
    } finally {
      setIsImportingData(false);
    }
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
    setImportStep(1);
    setPreviewData([]);
  };

  // Menghitung total tiket sebenarnya
  const totalTiket = pesertaList.reduce(
    (acc, curr) => acc + (Number(curr.jumlahTiket) || 1),
    0,
  );
  const totalHadir = pesertaList
    .filter((p) => p.statusCheckIn)
    .reduce((acc, curr) => acc + (Number(curr.jumlahTiket) || 1), 0);

  if (isLoading || !userProfile) {
    return (
      <div className="p-10 text-center animate-pulse font-bold text-slate-400">
        Memuat Data Kehadiran...
      </div>
    );
  }

  // TAMPILAN 1: DAFTAR AGENDA
  if (!selectedAgenda) {
    return (
      <div className="max-w-7xl animate-in fade-in duration-500 pb-12">
        <div className="mb-8">
          <h2 className="text-3xl font-extrabold text-blue-950 mb-2">
            Data Pendaftar Agenda
          </h2>
          <p className="text-slate-500">
            {userProfile.role === "super_admin"
              ? "Pilih salah satu agenda di bawah ini untuk melihat daftar pesertanya (Akses Super Admin)."
              : `Berikut adalah agenda dari ${userProfile.bidang}. Pilih untuk melihat peserta.`}
          </p>
        </div>

        {agendaList.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center shadow-sm">
            <span className="text-4xl mb-4 block">📭</span>
            <h3 className="font-bold text-slate-700 mb-1">Belum Ada Agenda</h3>
            <p className="text-sm text-slate-500">
              Anda belum membuat agenda apapun untuk bidang ini.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agendaList.map((agenda) => (
              <div
                key={agenda.id}
                onClick={() => handleSelectAgenda(agenda)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-blue-50 text-blue-900 rounded-xl p-3 text-center min-w-[60px]">
                    <span className="block text-[10px] font-bold uppercase">
                      {agenda.tanggal ? agenda.tanggal.split("-")[1] : "CMG"}
                    </span>
                    <span className="block text-xl font-black leading-none mt-1">
                      {agenda.tanggal ? agenda.tanggal.split("-")[2] : "SOON"}
                    </span>
                  </div>
                  <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                    {agenda.tiket}
                  </span>
                </div>
                <h3 className="font-bold text-blue-950 leading-snug group-hover:text-blue-700 transition-colors mb-2">
                  {agenda.judul}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 flex-grow">
                  {agenda.deskripsi}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 text-sm font-bold text-blue-600 flex justify-between items-center">
                  <span>Lihat Pendaftar</span>
                  <span>&rarr;</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // TAMPILAN 2: DAFTAR PESERTA SPESIFIK AGENDA
  return (
    <div className="max-w-7xl animate-in slide-in-from-right-8 duration-300 pb-12 relative">
      {/* ======================================= */}
      {/* MODAL IMPORT EXCEL (BARU) */}
      {/* ======================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl relative animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <button
              onClick={closeImportModal}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 transition-colors z-10"
            >
              ✕
            </button>

            {importStep === 1 ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  📥
                </div>
                <h3 className="text-2xl font-black text-blue-950 mb-2">
                  Import Data Peserta
                </h3>
                <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto">
                  Punya banyak data peserta dari WhatsApp atau form eksternal?
                  Masukkan ke template Excel kami dan upload di sini.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                  <button
                    onClick={downloadTemplateImport}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 rounded-2xl hover:bg-slate-50 hover:border-blue-300 transition-all group"
                  >
                    <span className="text-2xl mb-2 group-hover:-translate-y-1 transition-transform">
                      📄
                    </span>
                    <span className="font-bold text-slate-700 text-sm">
                      1. Download Template
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Unduh format kolom
                    </span>
                  </button>

                  <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-blue-300 bg-blue-50 rounded-2xl hover:bg-blue-100 transition-all group cursor-pointer overflow-hidden">
                    <span className="text-2xl mb-2 group-hover:-translate-y-1 transition-transform">
                      📤
                    </span>
                    <span className="font-bold text-blue-700 text-sm">
                      2. Upload File Excel
                    </span>
                    <span className="text-[10px] text-blue-500 mt-1">
                      Pilih file .xlsx / .csv
                    </span>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleFilePreview}
                      ref={fileInputRef}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="mb-4">
                  <h3 className="text-xl font-black text-blue-950">
                    Preview Data ({previewData.length} Baris)
                  </h3>
                  <p className="text-sm text-slate-500">
                    Periksa kembali data di bawah ini sebelum disimpan ke
                    database.
                  </p>
                </div>

                <div className="flex-grow overflow-auto border border-slate-200 rounded-xl mb-4 custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 font-bold text-slate-600 border-b">
                          No
                        </th>
                        <th className="p-3 font-bold text-slate-600 border-b">
                          Nama
                        </th>
                        <th className="p-3 font-bold text-slate-600 border-b">
                          WhatsApp
                        </th>
                        <th className="p-3 font-bold text-slate-600 border-b">
                          Instansi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {previewData.slice(0, 100).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-blue-900">
                            {row.Nama}
                          </td>
                          <td className="p-3 text-slate-600">
                            {row.WhatsApp || "-"}
                          </td>
                          <td className="p-3 text-slate-600 text-xs">
                            {row.Instansi || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 100 && (
                    <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 font-bold border-t">
                      ... dan {previewData.length - 100} baris lainnya
                      (Disembunyikan untuk preview)
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoCheckInImport}
                      onChange={(e) => setAutoCheckInImport(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      Otomatis tandai semua sebagai "Hadir (Check-In)"
                    </span>
                  </label>

                  <div className="flex gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setImportStep(1)}
                      disabled={isImportingData}
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm hover:bg-slate-300 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      onClick={processImportSave}
                      disabled={isImportingData}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-colors flex items-center gap-2"
                    >
                      {isImportingData
                        ? "Menyimpan..."
                        : "💾 Simpan ke Database"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* MODAL LIHAT QR CODE PESERTA */}
      {/* ======================================= */}
      {selectedQR && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center animate-in zoom-in-95">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
            <h3 className="text-2xl font-black text-blue-950 mb-1">
              Tiket Peserta
            </h3>
            <p className="text-sm font-bold text-slate-500 mb-6">
              {selectedQR.nama}
            </p>

            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-6 mx-auto inline-block w-full max-w-[200px] mb-4 shadow-sm relative overflow-hidden">
              {selectedQR.jumlahTiket > 1 && (
                <div className="absolute top-3 right-[-35px] bg-blue-600 text-white text-[10px] font-black py-1 px-10 transform rotate-45 shadow-sm">
                  ROMBONGAN
                </div>
              )}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedQR.id}`}
                alt="QR Code Tiket"
                className="w-full aspect-square mix-blend-multiply"
              />
            </div>

            <p className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 py-2.5 rounded-lg mx-4 mb-2 tracking-widest uppercase">
              ID TIKET: {selectedQR.id.slice(0, 8)}
            </p>
            {selectedQR.jumlahTiket > 1 && (
              <p className="text-xs font-bold text-blue-700 mb-4">
                Berlaku untuk {selectedQR.jumlahTiket} Orang
              </p>
            )}

            <button
              onClick={() => setSelectedQR(null)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2"
            >
              Tutup Tiket
            </button>
          </div>
        </div>
      )}

      {/* MODAL SCANNER QR */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-blue-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setIsScannerOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200 hover:text-red-500 transition-colors z-20"
            >
              ✕
            </button>
            <div className="text-center mb-6 pt-2">
              <h3 className="text-2xl font-black text-blue-950">
                Gate Kehadiran
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Verifikasi tiket peserta dengan cepat.
              </p>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-6">
              <button
                onClick={() => setScanMode("kamera")}
                className={`flex-1 py-2.5 font-bold text-sm rounded-lg transition-all ${
                  scanMode === "kamera"
                    ? "bg-white shadow-sm text-blue-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                📸 Kamera HP
              </button>
              <button
                onClick={() => setScanMode("manual")}
                className={`flex-1 py-2.5 font-bold text-sm rounded-lg transition-all ${
                  scanMode === "manual"
                    ? "bg-white shadow-sm text-blue-900"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                ⌨️ Manual / Alat
              </button>
            </div>

            {scanMessage.text && (
              <div
                className={`p-4 rounded-xl mb-4 font-bold text-sm text-center border animate-in zoom-in ${
                  scanMessage.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700 shadow-[0_0_20px_rgba(22,163,74,0.2)]"
                    : scanMessage.type === "error"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-yellow-50 border-yellow-200 text-yellow-700"
                }`}
              >
                {scanMessage.text}
              </div>
            )}

            {scanMode === "kamera" ? (
              <div className="rounded-2xl overflow-hidden border-4 border-slate-100 bg-slate-100 relative min-h-[250px] flex items-center justify-center">
                <div id="reader" className="w-full h-full"></div>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <input
                  type="text"
                  autoFocus
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Ketik ID atau gunakan Scanner USB..."
                  className="w-full text-center font-mono font-bold text-lg px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                >
                  Proses Check-In
                </button>
              </form>
            )}
            <p className="text-[10px] text-slate-400 text-center mt-6 uppercase tracking-widest font-bold">
              Sistem Cerdas SIM DPW
            </p>
          </div>
        </div>
      )}

      {/* HEADER AGENDA & TOMBOL AKSI */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
        <div>
          <button
            onClick={() => setSelectedAgenda(null)}
            className="text-slate-500 hover:text-blue-900 font-bold text-sm flex items-center gap-2 mb-3 transition-colors"
          >
            &larr; Kembali ke Pilihan Agenda
          </button>
          <h2 className="text-3xl font-extrabold text-blue-950 leading-tight">
            {selectedAgenda.judul}
          </h2>
          <div className="flex gap-4 mt-3">
            <p className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
              Total Pendaftar:{" "}
              <span className="font-black text-blue-700">
                {totalTiket} Orang
              </span>
            </p>
            <p className="text-sm font-medium text-slate-600 bg-green-50 text-green-700 px-3 py-1 rounded-lg border border-green-200">
              Hadir: <span className="font-black">{totalHadir} Orang</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="bg-blue-950 hover:bg-blue-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2 transition-all group"
          >
            <span className="text-lg group-hover:scale-110 transition-transform">
              📷
            </span>
            Buka Gate Scanner
          </button>

          {/* GRUP TOMBOL EXPORT & IMPORT SEJAJAR */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="bg-transparent hover:bg-white text-slate-600 hover:text-blue-700 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all"
            >
              📥 Import
            </button>
            <div className="w-px h-6 bg-slate-300 mx-1"></div>
            <button
              onClick={downloadExcel}
              disabled={pesertaList.length === 0}
              className="bg-transparent hover:bg-white text-slate-600 hover:text-green-700 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📤 Export
            </button>
          </div>
        </div>
      </div>

      {/* TABEL DATA PESERTA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* ACTION BAR BULK DELETE */}
        {selectedIds.length > 0 && (
          <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center justify-between animate-in slide-in-from-top-2">
            <p className="text-red-700 font-bold text-sm">
              Terpilih {selectedIds.length} baris data
            </p>
            <button
              onClick={deleteBulk}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-sm transition-all"
            >
              Hapus {selectedIds.length} Data Terpilih
            </button>
          </div>
        )}

        {isLoadingPeserta ? (
          <div className="p-16 text-center animate-pulse text-slate-400 font-bold flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            Memuat data peserta...
          </div>
        ) : pesertaList.length === 0 ? (
          <div className="p-20 text-center">
            <span className="text-5xl mb-4 block opacity-50">📝</span>
            <h3 className="font-bold text-slate-700 text-lg">
              Belum Ada Pendaftar
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Bagikan link pendaftaran ke jaringan alumni Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-widest text-slate-500">
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedIds.length === pesertaList.length &&
                        pesertaList.length > 0
                      }
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 font-bold">Status Hadir</th>
                  <th className="p-4 font-bold">Data Peserta</th>
                  <th className="p-4 font-bold">Kontak</th>
                  <th className="p-4 font-bold">Profil Alumni</th>
                  <th className="p-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pesertaList.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-blue-50/30 transition-colors text-sm text-slate-700 ${
                        isSelected ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <td className="p-4 text-center border-l-4 border-transparent align-top">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(p.id)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 cursor-pointer mt-1"
                        />
                      </td>

                      <td className="p-4 align-top">
                        <button
                          onClick={() => toggleCheckIn(p.id, p.statusCheckIn)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all mt-0.5 ${
                            p.statusCheckIn
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 shadow-[0_0_10px_rgba(22,163,74,0.1)]"
                              : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${
                              p.statusCheckIn
                                ? "bg-green-500 animate-pulse"
                                : "bg-slate-400"
                            }`}
                          ></div>
                          {p.statusCheckIn ? "Telah Hadir" : "Belum Hadir"}
                        </button>
                      </td>

                      <td className="p-4 align-top">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-blue-950 text-base">
                            {p.nama}
                          </p>
                          {p.jumlahTiket > 1 && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                              {p.jumlahTiket} Orang
                            </span>
                          )}
                        </div>

                        {p.tipeDaftar === "Kelompok" && p.namaAnggota && (
                          <div className="mt-2 mb-3 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                              Daftar Anggota:
                            </p>
                            <ul className="text-xs text-slate-600 space-y-1">
                              {p.namaAnggota
                                .split(/[,;\n]+/)
                                .map((nama: string, idx: number) => {
                                  const cleanName = nama.trim();
                                  if (!cleanName) return null;
                                  return (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-1.5"
                                    >
                                      <span className="text-slate-400 mt-0.5">
                                        •
                                      </span>
                                      <span>{cleanName}</span>
                                    </li>
                                  );
                                })}
                            </ul>
                          </div>
                        )}

                        <p
                          className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mt-1"
                          title={p.id}
                        >
                          ID: {p.id.slice(0, 8)} •{" "}
                          {new Date(p.waktuDaftar).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </td>

                      <td className="p-4 align-top">
                        <a
                          href={`https://wa.me/${p.whatsapp?.replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 font-medium text-xs flex items-center gap-1 mb-1 hover:underline mt-1"
                        >
                          <span>💬</span> {p.whatsapp}
                        </a>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {p.email || "-"}
                        </p>
                      </td>

                      <td className="p-4 align-top">
                        <p className="font-bold text-xs text-slate-700 mt-1">
                          {p.fakultas || "-"}{" "}
                          {p.angkatan ? `/ ${p.angkatan}` : ""}
                        </p>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {p.instansi || "-"}
                        </p>
                      </td>

                      <td className="p-4 text-right align-top">
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <button
                            onClick={() => setSelectedQR(p)}
                            className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Lihat QR Code"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteSingle(p.id)}
                            className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Hapus Peserta"
                          >
                            <svg
                              className="w-5 h-5"
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
  );
}
