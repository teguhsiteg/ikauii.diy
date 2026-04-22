"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";

// Tipe Data
interface DivisiInfo {
  id: string;
  nama: string;
  kuota: number;
  linkGrupWa: string;
}
interface CrewMember {
  id: string;
  nama: string;
  email: string;
  whatsapp: string;
  tipe: string;
  divisi: string;
  status: "pending" | "accepted" | "rejected";
  waktuDaftar: number;
  fakultas?: string;
  angkatan?: string | number;
}

export default function CrewManagementPage() {
  const [activeTab, setActiveTab] = useState<
    "pengaturan" | "pendaftar" | "timInti"
  >("pengaturan");
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingMail, setIsSendingMail] = useState(false);

  // State Data
  const [daftarDivisi, setDaftarDivisi] = useState<DivisiInfo[]>([]);
  const [pendaftar, setPendaftar] = useState<CrewMember[]>([]);

  // State Form Tambah/Edit Divisi
  const [newDivisi, setNewDivisi] = useState({
    nama: "",
    kuota: 10,
    linkGrupWa: "",
  });
  const [editingDivisiId, setEditingDivisiId] = useState<string | null>(null); // 🔥 State Edit

  // State Pagination & Selection (Pending)
  const [itemsPerPagePending, setItemsPerPagePending] = useState<number>(10);
  const [currentPagePending, setCurrentPagePending] = useState<number>(1);
  const [selectedPending, setSelectedPending] = useState<string[]>([]);

  // State Pagination & Selection (Accepted)
  const [itemsPerPageAccepted, setItemsPerPageAccepted] = useState<number>(10);
  const [currentPageAccepted, setCurrentPageAccepted] = useState<number>(1);
  const [selectedAccepted, setSelectedAccepted] = useState<string[]>([]);

  // Tarik Data (Real-time Firebase)
  useEffect(() => {
    const unsubConfig = onSnapshot(
      doc(db, "settings", "crew_config"),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().divisiList) {
          setDaftarDivisi(docSnap.data().divisiList);
        }
      },
    );

    const qCrew = query(
      collection(db, "crew_volunteers"),
      orderBy("waktuDaftar", "desc"),
    );
    const unsubCrew = onSnapshot(qCrew, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as CrewMember,
      );
      setPendaftar(data);
      setIsLoading(false);
    });

    return () => {
      unsubConfig();
      unsubCrew();
    };
  }, []);

  // --- 🔥 FUNGSI TAB PENGATURAN (TAMBAH / EDIT DIVISI) 🔥 ---
  const handleSubmitDivisi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDivisi.nama.trim()) return;

    let updateList = [];

    if (editingDivisiId) {
      // Mode Edit: Update data tapi pertahankan ID aslinya
      updateList = daftarDivisi.map((div) =>
        div.id === editingDivisiId
          ? {
              ...div,
              nama: newDivisi.nama,
              kuota: newDivisi.kuota,
              linkGrupWa: newDivisi.linkGrupWa,
            }
          : div,
      );
    } else {
      // Mode Tambah Baru
      const idBaru = newDivisi.nama.toLowerCase().replace(/[^a-z0-9]/g, "_");
      updateList = [...daftarDivisi, { ...newDivisi, id: idBaru }];
    }

    try {
      await setDoc(
        doc(db, "settings", "crew_config"),
        { divisiList: updateList },
        { merge: true },
      );
      setNewDivisi({ nama: "", kuota: 10, linkGrupWa: "" });
      setEditingDivisiId(null);
    } catch (err) {
      alert("Gagal menyimpan divisi.");
    }
  };

  const handleEditClick = (div: DivisiInfo) => {
    setNewDivisi({
      nama: div.nama,
      kuota: div.kuota,
      linkGrupWa: div.linkGrupWa || "",
    });
    setEditingDivisiId(div.id);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll ke atas agar form terlihat
  };

  const handleCancelEdit = () => {
    setNewDivisi({ nama: "", kuota: 10, linkGrupWa: "" });
    setEditingDivisiId(null);
  };

  const handleDeleteDivisi = async (idToDelete: string) => {
    if (
      !confirm(
        "Hapus divisi ini? Perhatian: Jika ada pelamar di divisi ini, data divisinya bisa menjadi kosong/tidak valid.",
      )
    )
      return;
    const updateList = daftarDivisi.filter((d) => d.id !== idToDelete);
    try {
      await setDoc(
        doc(db, "settings", "crew_config"),
        { divisiList: updateList },
        { merge: true },
      );
      if (editingDivisiId === idToDelete) handleCancelEdit();
    } catch (err) {
      alert("Gagal menghapus divisi.");
    }
  };

  // --- FUNGSI CRUD SINGLE ---
  const handleUpdateStatus = async (
    id: string,
    newStatus: "accepted" | "rejected",
  ) => {
    try {
      await updateDoc(doc(db, "crew_volunteers", id), { status: newStatus });
    } catch (err) {
      alert("Gagal mengubah status.");
    }
  };

  const handleDeletePelamar = async (id: string) => {
    if (!confirm("Hapus data pelamar ini permanen dari database?")) return;
    try {
      await deleteDoc(doc(db, "crew_volunteers", id));
    } catch (err) {
      alert("Gagal menghapus data.");
    }
  };

  // --- FUNGSI CRUD MASSAL ---
  const handleMassUpdateStatus = async (
    ids: string[],
    newStatus: "accepted" | "rejected",
  ) => {
    if (
      !confirm(
        `Yakin ingin mengubah status ${ids.length} pelamar terpilih menjadi ${newStatus.toUpperCase()}?`,
      )
    )
      return;
    try {
      await Promise.all(
        ids.map((id) =>
          updateDoc(doc(db, "crew_volunteers", id), { status: newStatus }),
        ),
      );
      setSelectedPending([]);
    } catch (err) {
      alert("Gagal memproses pembaruan massal.");
    }
  };

  const handleMassDelete = async (ids: string[], isPendingTab: boolean) => {
    if (!confirm(`Yakin ingin MENGHAPUS PERMANEN ${ids.length} data terpilih?`))
      return;
    try {
      await Promise.all(
        ids.map((id) => deleteDoc(doc(db, "crew_volunteers", id))),
      );
      if (isPendingTab) setSelectedPending([]);
      else setSelectedAccepted([]);
    } catch (err) {
      alert("Gagal memproses penghapusan massal.");
    }
  };

  // --- FUNGSI EXPORT KE EXCEL MURNI (.xlsx) ---
  const exportToExcel = (data: CrewMember[], filename: string) => {
    const formattedData = data.map((c, index) => {
      const divName =
        daftarDivisi.find((d) => d.id === c.divisi)?.nama || c.divisi;
      const dateStr = new Date(c.waktuDaftar).toLocaleString("id-ID");
      const fakultas = c.fakultas && c.fakultas !== "-" ? c.fakultas : "-";
      const angkatan = c.angkatan && c.angkatan !== "-" ? c.angkatan : "-";

      return {
        No: index + 1,
        "Nama Lengkap": c.nama,
        "Tipe Pelamar": c.tipe.toUpperCase(),
        "Fakultas / Jurusan": fakultas,
        Angkatan: angkatan,
        Email: c.email,
        WhatsApp: c.whatsapp,
        "Penempatan Divisi": divName,
        Status:
          c.status === "accepted"
            ? "Diterima"
            : c.status === "pending"
              ? "Menunggu"
              : "Ditolak",
        "Waktu Pendaftaran": dateStr,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const wscols = [
      { wch: 5 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
      { wch: 25 },
      { wch: 15 },
      { wch: 20 },
      { wch: 10 },
      { wch: 20 },
    ];
    worksheet["!cols"] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Relawan");
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  // --- FUNGSI TAB TIM INTI (KIRIM EMAIL) ---
  const handleSendEmail = async (crew: CrewMember) => {
    const divInfo = daftarDivisi.find((d) => d.id === crew.divisi);
    const linkWa = divInfo ? divInfo.linkGrupWa : "";

    if (
      !linkWa &&
      !confirm(
        "Divisi ini belum ada Link Grup WA-nya. Yakin tetap kirim email?",
      )
    )
      return;

    setIsSendingMail(true);
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "crew_accepted",
          email: crew.email,
          nama: crew.nama,
          detail: {
            divisi: divInfo ? divInfo.nama : crew.divisi,
            linkGrupWa: linkWa,
          },
        }),
      });
      if (response.ok) alert(`Berhasil mengirim email ke ${crew.nama}!`);
      else alert("Gagal mengirim email.");
    } catch (error) {
      alert("Terjadi kesalahan sistem saat kirim email.");
    } finally {
      setIsSendingMail(false);
    }
  };

  // --- PERSIAPAN RENDER & PAGINATION ---
  const pendingCrew = pendaftar.filter((c) => c.status === "pending");
  const acceptedCrew = pendaftar.filter((c) => c.status === "accepted");

  const getProgress = (divisiId: string, kuota: number) => {
    const terisi = acceptedCrew.filter((c) => c.divisi === divisiId).length;
    const persen = Math.min(100, Math.round((terisi / kuota) * 100));
    return { terisi, persen };
  };

  const totalPagesPending =
    itemsPerPagePending === 0
      ? 1
      : Math.ceil(pendingCrew.length / itemsPerPagePending);
  const currentPendingData =
    itemsPerPagePending === 0
      ? pendingCrew
      : pendingCrew.slice(
          (currentPagePending - 1) * itemsPerPagePending,
          currentPagePending * itemsPerPagePending,
        );

  const totalPagesAccepted =
    itemsPerPageAccepted === 0
      ? 1
      : Math.ceil(acceptedCrew.length / itemsPerPageAccepted);
  const currentAcceptedData =
    itemsPerPageAccepted === 0
      ? acceptedCrew
      : acceptedCrew.slice(
          (currentPageAccepted - 1) * itemsPerPageAccepted,
          currentPageAccepted * itemsPerPageAccepted,
        );

  if (isLoading)
    return (
      <div className="p-10 text-center animate-pulse text-[#1A73E8] font-bold">
        Memuat Data Crew...
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto pb-20 font-sans">
      {/* HEADER */}
      <div className="mb-8 border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">
          Manajemen Kru Lapangan
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Atur formasi relawan, verifikasi pendaftar, export Excel, dan
          broadcast undangan WA.
        </p>
      </div>

      {/* NAVIGASI TAB */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar mb-6 pb-2">
        <button
          onClick={() => setActiveTab("pengaturan")}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeTab === "pengaturan" ? "bg-[#e8f0fe] text-[#1A73E8]" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"}`}
        >
          ⚙️ Atur Divisi & Kuota
        </button>
        <button
          onClick={() => {
            setActiveTab("pendaftar");
            setSelectedPending([]);
          }}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === "pendaftar" ? "bg-[#e8f0fe] text-[#1A73E8]" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"}`}
        >
          📥 Menunggu Review{" "}
          {pendingCrew.length > 0 && (
            <span className="bg-[#1A73E8] text-white text-[10px] px-2 py-0.5 rounded-full">
              {pendingCrew.length}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            setActiveTab("timInti");
            setSelectedAccepted([]);
          }}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === "timInti" ? "bg-[#e6f4ea] text-[#137333]" : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-200"}`}
        >
          ✅ Tim Inti (Diterima){" "}
          <span className="bg-[#137333] text-white text-[10px] px-2 py-0.5 rounded-full">
            {acceptedCrew.length}
          </span>
        </button>
      </div>

      {/* ======================================= */}
      {/* TAB 1: PENGATURAN DIVISI */}
      {/* ======================================= */}
      {activeTab === "pengaturan" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          <div className="lg:col-span-1">
            <div
              className={`bg-white p-6 rounded-xl shadow-sm border sticky top-24 transition-colors ${editingDivisiId ? "border-blue-400 bg-blue-50/30 ring-4 ring-blue-50" : "border-slate-200"}`}
            >
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                {editingDivisiId ? (
                  <>
                    <svg
                      className="w-5 h-5 text-[#1A73E8]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                    Edit Divisi
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 text-[#1A73E8]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                    </svg>
                    Tambah Divisi Baru
                  </>
                )}
              </h3>

              <form onSubmit={handleSubmitDivisi} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nama Divisi
                  </label>
                  <input
                    type="text"
                    required
                    value={newDivisi.nama}
                    onChange={(e) =>
                      setNewDivisi({ ...newDivisi, nama: e.target.value })
                    }
                    placeholder="Cth: Marshall / Medis"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Target Kuota (Orang)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newDivisi.kuota}
                    onChange={(e) =>
                      setNewDivisi({
                        ...newDivisi,
                        kuota: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Link Grup WhatsApp Divisi
                  </label>
                  <input
                    type="url"
                    value={newDivisi.linkGrupWa}
                    onChange={(e) =>
                      setNewDivisi({ ...newDivisi, linkGrupWa: e.target.value })
                    }
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] outline-none text-[#1A73E8] transition-all"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  {editingDivisiId && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="w-1/3 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 font-bold py-2 rounded-md text-sm transition-colors"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`${editingDivisiId ? "w-2/3" : "w-full"} bg-[#1A73E8] hover:bg-[#1557b0] text-white font-bold py-2 rounded-md text-sm transition-colors shadow-sm`}
                  >
                    {editingDivisiId ? "Simpan Perubahan" : "Simpan Divisi"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-sm">
                  Daftar Kebutuhan Formasi
                </h3>
                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                  Total: {daftarDivisi.length} Divisi
                </span>
              </div>
              <ul className="divide-y divide-slate-100">
                {daftarDivisi.map((div) => {
                  const { terisi, persen } = getProgress(div.id, div.kuota);
                  const isPenuh = terisi >= div.kuota;
                  const isEditingThis = editingDivisiId === div.id;

                  return (
                    <li
                      key={div.id}
                      className={`p-5 transition-colors ${isEditingThis ? "bg-blue-50/50" : "hover:bg-slate-50"}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                            {div.nama}
                            {isPenuh && (
                              <span className="bg-[#e6f4ea] text-[#137333] text-[10px] px-2 py-0.5 rounded-sm font-bold uppercase tracking-widest">
                                Penuh
                              </span>
                            )}
                          </h4>
                          {div.linkGrupWa ? (
                            <span className="text-xs text-[#1A73E8] mt-1">
                              🔗 Tautan WA Tersedia
                            </span>
                          ) : (
                            <span className="text-xs text-rose-500 mt-1">
                              ⚠️ Tautan WA Kosong
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(div)}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border border-transparent hover:border-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDivisi(div.id)}
                            className="text-rose-400 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-md text-xs font-bold transition-colors border border-transparent hover:border-rose-200"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1.5">
                          <span
                            className={
                              isPenuh
                                ? "text-[#137333] font-bold"
                                : "text-slate-600"
                            }
                          >
                            {terisi} dari {div.kuota} Relawan
                          </span>
                          <span className="text-slate-500 font-mono">
                            {persen}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ${isPenuh ? "bg-[#34A853]" : "bg-[#1A73E8]"}`}
                            style={{ width: `${persen}%` }}
                          ></div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ======================================= */}
      {/* TAB 2: PELAMAR MASUK (PENDING) */}
      {/* ======================================= */}
      {activeTab === "pendaftar" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300 flex flex-col relative">
          <div className="p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">
                Menunggu Persetujuan
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tinjau profil pelamar dan tentukan siapa yang masuk tim inti.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Tampilkan:
                </span>
                <select
                  value={itemsPerPagePending}
                  onChange={(e) => {
                    setItemsPerPagePending(Number(e.target.value));
                    setCurrentPagePending(1);
                    setSelectedPending([]);
                  }}
                  className="text-xs border border-slate-300 rounded-md px-2 py-1 outline-none focus:border-[#1A73E8]"
                >
                  <option value={10}>10 Baris</option>
                  <option value={20}>20 Baris</option>
                  <option value={50}>50 Baris</option>
                  <option value={0}>Semua</option>
                </select>
              </div>
              <button
                onClick={() =>
                  exportToExcel(pendingCrew, "Data_Pelamar_Pending_IKAUII")
                }
                className="flex items-center gap-1.5 bg-[#1E8E3E] text-white hover:bg-[#157330] px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>{" "}
                Export Excel
              </button>
            </div>
          </div>

          {selectedPending.length > 0 && (
            <div className="bg-blue-50 border-b border-blue-100 p-3 px-5 flex items-center justify-between animate-in slide-in-from-top-2">
              <span className="text-sm font-bold text-blue-800">
                {selectedPending.length} baris terpilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMassDelete(selectedPending, true)}
                  className="px-3 py-1.5 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-md text-xs font-bold transition-colors"
                >
                  Hapus Massal
                </button>
                <button
                  onClick={() =>
                    handleMassUpdateStatus(selectedPending, "rejected")
                  }
                  className="px-3 py-1.5 bg-white text-slate-600 border border-slate-300 hover:bg-slate-100 rounded-md text-xs font-bold transition-colors"
                >
                  Tolak Semua
                </button>
                <button
                  onClick={() =>
                    handleMassUpdateStatus(selectedPending, "accepted")
                  }
                  className="px-3 py-1.5 bg-[#1A73E8] text-white hover:bg-[#1557b0] rounded-md text-xs font-bold shadow-sm transition-colors"
                >
                  Terima Semua
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        currentPendingData.length > 0 &&
                        selectedPending.length === currentPendingData.length
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedPending(
                            currentPendingData.map((c) => c.id),
                          );
                        else setSelectedPending([]);
                      }}
                      className="w-4 h-4 text-[#1A73E8] rounded border-slate-300 focus:ring-[#1A73E8] cursor-pointer"
                    />
                  </th>
                  <th className="px-2 py-3 font-semibold text-slate-600 text-xs">
                    Pelamar
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600 text-xs">
                    Kontak
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600 text-xs">
                    Pilihan Divisi
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600 text-xs text-right">
                    Aksi Persetujuan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentPendingData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-slate-500 text-sm"
                    >
                      Tidak ada pelamar dalam halaman ini.
                    </td>
                  </tr>
                ) : (
                  currentPendingData.map((crew) => {
                    const divInfo = daftarDivisi.find(
                      (d) => d.id === crew.divisi,
                    );
                    const isChecked = selectedPending.includes(crew.id);
                    return (
                      <tr
                        key={crew.id}
                        className={`transition-colors ${isChecked ? "bg-blue-50/30" : "hover:bg-[#f8f9fa]"}`}
                      >
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedPending([
                                  ...selectedPending,
                                  crew.id,
                                ]);
                              else
                                setSelectedPending(
                                  selectedPending.filter(
                                    (id) => id !== crew.id,
                                  ),
                                );
                            }}
                            className="w-4 h-4 text-[#1A73E8] rounded border-slate-300 focus:ring-[#1A73E8] cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-bold text-slate-800">
                            {crew.nama}
                          </p>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 mb-1 inline-block uppercase tracking-wider border border-slate-200">
                            {crew.tipe}
                          </span>
                          {(crew.tipe === "alumni" ||
                            crew.tipe === "mahasiswa") &&
                            crew.fakultas &&
                            crew.fakultas !== "-" && (
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                {crew.fakultas} <span className="mx-1">•</span>{" "}
                                '{crew.angkatan}
                              </div>
                            )}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-slate-800 font-medium mb-0.5">
                            {crew.whatsapp}
                          </p>
                          <p className="text-xs text-slate-500">{crew.email}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs">
                            {divInfo ? divInfo.nama : crew.divisi}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                handleUpdateStatus(crew.id, "rejected")
                              }
                              className="px-3 py-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md text-xs font-bold transition-colors border border-transparent hover:border-rose-200"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(crew.id, "accepted")
                              }
                              className="px-4 py-1.5 bg-[#1A73E8] hover:bg-[#1557b0] text-white rounded-md text-xs font-bold transition-colors"
                            >
                              Terima
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {itemsPerPagePending > 0 && totalPagesPending > 1 && (
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-xs text-slate-500">
              <span>
                Halaman {currentPagePending} dari {totalPagesPending}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setCurrentPagePending((p) => Math.max(1, p - 1));
                    setSelectedPending([]);
                  }}
                  disabled={currentPagePending === 1}
                  className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Sebelumnnya
                </button>
                <button
                  onClick={() => {
                    setCurrentPagePending((p) =>
                      Math.min(totalPagesPending, p + 1),
                    );
                    setSelectedPending([]);
                  }}
                  disabled={currentPagePending === totalPagesPending}
                  className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================= */}
      {/* TAB 3: TIM INTI (KIRIM EMAIL) */}
      {/* ======================================= */}
      {activeTab === "timInti" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in duration-300 flex flex-col">
          <div className="p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                Pasukan Inti <span className="text-[#34A853]">✓</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Relawan disetujui. Kirimkan email undangan masuk Grup WA.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-[#137333] bg-[#e6f4ea] px-3 py-1 rounded-md">
                Total: {acceptedCrew.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Tampilkan:
                </span>
                <select
                  value={itemsPerPageAccepted}
                  onChange={(e) => {
                    setItemsPerPageAccepted(Number(e.target.value));
                    setCurrentPageAccepted(1);
                    setSelectedAccepted([]);
                  }}
                  className="text-xs border border-slate-300 rounded-md px-2 py-1 outline-none focus:border-[#34A853]"
                >
                  <option value={10}>10 Baris</option>
                  <option value={20}>20 Baris</option>
                  <option value={50}>50 Baris</option>
                  <option value={0}>Semua</option>
                </select>
              </div>
              <button
                onClick={() =>
                  exportToExcel(acceptedCrew, "Data_TimInti_Crew_IKAUII")
                }
                className="flex items-center gap-1.5 bg-[#1E8E3E] text-white hover:bg-[#157330] px-3 py-1.5 rounded-md text-xs font-bold transition-colors shadow-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>{" "}
                Export Excel
              </button>
            </div>
          </div>

          {selectedAccepted.length > 0 && (
            <div className="bg-rose-50 border-b border-rose-100 p-3 px-5 flex items-center justify-between animate-in slide-in-from-top-2">
              <span className="text-sm font-bold text-rose-800">
                {selectedAccepted.length} baris terpilih
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMassDelete(selectedAccepted, false)}
                  className="px-3 py-1.5 bg-rose-600 text-white hover:bg-rose-700 rounded-md text-xs font-bold shadow-sm transition-colors"
                >
                  Hapus Permanen Massal
                </button>
              </div>
            </div>
          )}

          {isSendingMail && (
            <div className="bg-[#e8f0fe] text-[#1A73E8] border-b border-[#1A73E8]/20 text-xs font-bold text-center py-2.5 animate-pulse flex items-center justify-center gap-2">
              <svg
                className="w-4 h-4 animate-spin"
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
              </svg>
              Sedang Mengirim Email...
            </div>
          )}

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={
                        currentAcceptedData.length > 0 &&
                        selectedAccepted.length === currentAcceptedData.length
                      }
                      onChange={(e) => {
                        if (e.target.checked)
                          setSelectedAccepted(
                            currentAcceptedData.map((c) => c.id),
                          );
                        else setSelectedAccepted([]);
                      }}
                      className="w-4 h-4 text-[#34A853] rounded border-slate-300 focus:ring-[#34A853] cursor-pointer"
                    />
                  </th>
                  <th className="px-2 py-3 font-semibold text-slate-600 text-xs">
                    Relawan Terpilih
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600 text-xs">
                    Penempatan
                  </th>
                  <th className="px-5 py-3 font-semibold text-slate-600 text-xs text-right">
                    Tindakan Khusus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentAcceptedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-slate-500 text-sm"
                    >
                      Belum ada relawan di halaman ini.
                    </td>
                  </tr>
                ) : (
                  currentAcceptedData.map((crew) => {
                    const divInfo = daftarDivisi.find(
                      (d) => d.id === crew.divisi,
                    );
                    const isChecked = selectedAccepted.includes(crew.id);
                    return (
                      <tr
                        key={crew.id}
                        className={`transition-colors ${isChecked ? "bg-rose-50/30" : "hover:bg-[#f8f9fa]"}`}
                      >
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked)
                                setSelectedAccepted([
                                  ...selectedAccepted,
                                  crew.id,
                                ]);
                              else
                                setSelectedAccepted(
                                  selectedAccepted.filter(
                                    (id) => id !== crew.id,
                                  ),
                                );
                            }}
                            className="w-4 h-4 text-[#34A853] rounded border-slate-300 focus:ring-[#34A853] cursor-pointer"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <p className="font-bold text-slate-800 mb-0.5">
                            {crew.nama}
                          </p>
                          {(crew.tipe === "alumni" ||
                            crew.tipe === "mahasiswa") &&
                            crew.fakultas &&
                            crew.fakultas !== "-" && (
                              <div className="text-[10px] text-slate-500 mb-1">
                                {crew.fakultas} <span className="mx-1">•</span>{" "}
                                '{crew.angkatan}
                              </div>
                            )}
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <span>📱 {crew.whatsapp}</span>
                            <span className="hidden sm:inline">|</span>
                            <span>📧 {crew.email}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md text-xs">
                            {divInfo ? divInfo.nama : crew.divisi}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDeletePelamar(crew.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Hapus dari daftar"
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
                            <button
                              onClick={() => handleSendEmail(crew)}
                              disabled={isSendingMail}
                              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-[#f8f9fa] hover:text-[#1A73E8] hover:border-[#1A73E8] rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
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
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>{" "}
                              Kirim Info
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {itemsPerPageAccepted > 0 && totalPagesAccepted > 1 && (
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-xs text-slate-500">
              <span>
                Halaman {currentPageAccepted} dari {totalPagesAccepted}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setCurrentPageAccepted((p) => Math.max(1, p - 1));
                    setSelectedAccepted([]);
                  }}
                  disabled={currentPageAccepted === 1}
                  className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Sebelumnnya
                </button>
                <button
                  onClick={() => {
                    setCurrentPageAccepted((p) =>
                      Math.min(totalPagesAccepted, p + 1),
                    );
                    setSelectedAccepted([]);
                  }}
                  disabled={currentPageAccepted === totalPagesAccepted}
                  className="px-3 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
