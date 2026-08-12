"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import {
  IconDownload,
  IconSearch,
  IconCheck,
  IconAlert,
  IconEmpty,
  IconInfo,
  IconClose,
} from "./Icons";

export default function TabAnggota() {
  const [anggotaList, setAnggotaList] = useState<any[]>([]);
  const [bidangList, setBidangList] = useState<any[]>([]);
  const [periodeList, setPeriodeList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [search, setSearch] = useState("");
  const [filterBidang, setFilterBidang] = useState("Semua");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals
  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    id: "",
    title: "",
    type: "single",
  });
  const [approveModal, setApproveModal] = useState({
    isOpen: false,
    dataId: "",
    form: {
      nama: "",
      wa: "",
      email: "",
      jabatan: "Anggota",
      bidang: "",
      noUrut: "",
      isInti: false,
      isTampilBeranda: false,
      periodeId: "",
    },
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, isOpen: false })), 4000);
  };

  const triggerWaApi = async (
    type: string,
    phone: string,
    nama: string,
    detailData: any = {},
  ) => {
    if (!phone || phone.length < 9) return false;
    try {
      const res = await fetch("/api/send-wa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, phone, nama, detail: detailData }),
      });
      const data = await res.json();
      return data.success;
    } catch (error) {
      return false;
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Ambil Periode & Bidang untuk opsi form pengesahan
      const pSnap = await getDocs(
        query(collection(db, "periode"), orderBy("tglMulai", "desc")),
      );
      setPeriodeList(pSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const bSnap = await getDocs(
        query(collection(db, "bidang"), orderBy("namaBidang", "asc")),
      );
      setBidangList(bSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      // Ambil User (Anggota belum sah)
      const uSnap = await getDocs(
        query(collection(db, "pengurus"), orderBy("createdAt", "desc")),
      );
      const allUsers = uSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const pending = allUsers.filter(
        (u: any) =>
          !u.isPengurus &&
          u.role !== "pengurus" &&
          u.status_pengurus !== "Aktif" &&
          !u.tampilDiWeb,
      );

      setAnggotaList(pending);
    } catch (error) {
      showToast("Gagal memuat data anggota.", "error");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let result = anggotaList;
    if (filterBidang !== "Semua")
      result = result.filter((p) => p.bidang === filterBidang);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nama?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.bidang?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [search, filterBidang, anggotaList]);

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      if (deleteModal.type === "single" && deleteModal.id) {
        await deleteDoc(doc(db, "pengurus", deleteModal.id));
      } else if (deleteModal.type === "bulk" && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map((id) => deleteDoc(doc(db, "pengurus", id))),
        );
      }
      showToast("Data pendaftar ditolak & dihapus.", "success");
      await fetchData();
    } catch (error) {
      showToast("Gagal menghapus data.", "error");
    } finally {
      setIsProcessing(false);
      setDeleteModal({ isOpen: false, id: "", title: "", type: "single" });
    }
  };

  const openApproveModal = (p: any) => {
    const activePeriode = periodeList.find((per) => per.status === "Aktif");
    setApproveModal({
      isOpen: true,
      dataId: p.id,
      form: {
        nama: p.nama || "",
        wa: p.wa || "",
        email: p.email || "",
        jabatan: p.jabatan || "Anggota",
        bidang:
          p.bidang || (bidangList.length > 0 ? bidangList[0].namaBidang : ""),
        noUrut: p.noUrut || "",
        isInti: p.isInti || false,
        isTampilBeranda: p.isTampilBeranda || false,
        periodeId: activePeriode ? activePeriode.id : "",
      },
    });
  };

  const executeApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      // 🔥 Simpan payload yang akan ditulis (untuk debugging)
      const payload = {
        ...approveModal.form,
        noUrut: approveModal.form.noUrut !== ""
          ? Number(approveModal.form.noUrut)
          : 99,
        isPengurus: true,
        status_pengurus: "Aktif",
        role: "pengurus",
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(doc(db, "pengurus", approveModal.dataId), payload);

      // TRIGGER WA GATEWAY
      try {
        await triggerWaApi(
          "member_verified",
          approveModal.form.wa,
          approveModal.form.nama,
          { nia: "Dalam Proses Update Admin" },
        );
      } catch (waError: any) {
        console.warn("[TabAnggota] WA notification gagal (non-fatal):", waError);
      }

      showToast(`${approveModal.form.nama} resmi disahkan!`, "success");
      setApproveModal({ isOpen: false, dataId: "", form: {} as any });
      await fetchData();
    } catch (error: any) {
      const detail = {
        message: error?.message || "tidak diketahui",
        code: error?.code || "tanpa kode",
        name: error?.name || "",
        dataId: approveModal?.dataId || "(kosong)",
        uid: "lihat console",
      };
      console.error("[TabAnggota] Gagal mengesahkan anggota:", { error, detail });
      showToast(
        `Gagal mengesahkan: ${detail.code} — ${detail.message}`,
        "error",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportData = () => {
    if (filteredData.length === 0)
      return showToast("Tidak ada data untuk diekspor.", "error");
    const wsData = filteredData.map((d, i) => ({
      No: i + 1,
      Nama: d.nama,
      WA: d.wa,
      Email: d.email,
      Bidang_Pilihan: d.bidang,
      Tanggal_Daftar: d.createdAt,
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Antrean");
    XLSX.writeFile(wb, `Data_ANTREAN_IKA_UII.xlsx`);
  };

  return (
    <div className="relative">
      {/* LOCAL TOAST */}
      <div
        className={`fixed top-6 right-6 z-[200] transition-all duration-300 transform ${toast.isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border ${toast.type === "success" ? "bg-white border-emerald-100" : "bg-white border-red-100"}`}
        >
          <div
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}
          >
            {toast.type === "success" ? <IconCheck /> : <IconAlert />}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {toast.type === "success" ? "Berhasil!" : "Peringatan!"}
            </p>
            <p className="text-[13px] text-slate-500 mt-0.5">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full text-center border border-[#DADCE0]">
            <div className="flex justify-center text-[#D93025] mb-3">
              <IconAlert />
            </div>
            <h3 className="text-lg font-medium text-[#202124] mb-1">
              Tolak & Hapus?
            </h3>
            <p className="text-sm text-[#5F6368] mb-6">
              Yakin menolak dan menghapus pendaftaran{" "}
              <strong>"{deleteModal.title}"</strong>?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    id: "",
                    title: "",
                    type: "single",
                  })
                }
                className="px-4 py-2 border rounded-lg hover:bg-slate-50 w-full"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isProcessing}
                className="px-4 py-2 text-white bg-[#D93025] hover:bg-[#b52a1f] rounded-lg w-full"
              >
                {isProcessing ? "Proses..." : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE MODAL */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-[#DADCE0]">
            <div className="bg-[#F8F9FA] border-b border-[#DADCE0] p-5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#E8F0FE] text-[#1A73E8] rounded-full flex items-center justify-center">
                  <IconInfo />
                </div>
                <div>
                  <h3 className="font-medium text-lg text-[#202124]">
                    Sahkan Anggota
                  </h3>
                  <p className="text-[11px] text-[#5F6368]">
                    Lengkapi Posisi & Jabatan
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setApproveModal({
                    isOpen: false,
                    dataId: "",
                    form: {} as any,
                  })
                }
                className="text-[#5F6368] hover:bg-[#E8EAED] p-1.5 rounded-full"
              >
                <IconClose />
              </button>
            </div>
            <form onSubmit={executeApprove} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nama</label>
                  <input
                    type="text"
                    value={approveModal.form.nama}
                    onChange={(e) =>
                      setApproveModal((p) => ({
                        ...p,
                        form: { ...p.form, nama: e.target.value },
                      }))
                    }
                    required
                    className="w-full border px-3 py-2 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={approveModal.form.wa}
                    onChange={(e) =>
                      setApproveModal((p) => ({
                        ...p,
                        form: { ...p.form, wa: e.target.value },
                      }))
                    }
                    className="w-full border px-3 py-2 rounded-md text-sm outline-none focus:border-[#1A73E8] font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Pilih Bidang
                  </label>
                  <select
                    value={approveModal.form.bidang}
                    onChange={(e) =>
                      setApproveModal((p) => ({
                        ...p,
                        form: { ...p.form, bidang: e.target.value },
                      }))
                    }
                    className="w-full border px-3 py-2 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                  >
                    {bidangList.map((b) => (
                      <option key={b.id} value={b.namaBidang}>
                        {b.namaBidang}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Tetapkan Jabatan
                  </label>
                  <select
                    value={approveModal.form.jabatan}
                    onChange={(e) =>
                      setApproveModal((p) => ({
                        ...p,
                        form: { ...p.form, jabatan: e.target.value },
                      }))
                    }
                    className="w-full border px-3 py-2 rounded-md text-sm outline-none focus:border-[#1A73E8]"
                  >
                    <option value="Ketua Umum">Ketua Umum</option>
                    <option value="Ketua">Ketua</option>
                    <option value="Wakil Ketua Umum">Wakil Ketua Umum</option>
                    <option value="Wakil Ketua">Wakil Ketua</option>
                    <option value="Sekretaris Wilayah">
                      Sekretaris Wilayah
                    </option>
                    <option value="Wakil Sekretaris">Wakil Sekretaris</option>
                    <option value="Bendahara Umum">Bendahara Umum</option>
                    <option value="Wakil Bendahara">Wakil Bendahara</option>
                    <option value="Koordinator Bidang">
                      Koordinator Bidang
                    </option>
                    <option value="Anggota">Anggota</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#1A73E8] mb-1">
                  Periode Kepengurusan
                </label>
                <select
                  value={approveModal.form.periodeId}
                  onChange={(e) =>
                    setApproveModal((p) => ({
                      ...p,
                      form: { ...p.form, periodeId: e.target.value },
                    }))
                  }
                  required
                  className="w-full border border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8] px-3 py-2 rounded-md text-sm font-medium outline-none"
                >
                  <option value="" disabled>
                    -- Pilih Periode --
                  </option>
                  {periodeList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaPeriode} {p.status === "Aktif" ? "(Aktif)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approveModal.form.isInti}
                    onChange={(e) =>
                      setApproveModal((p) => ({
                        ...p,
                        form: { ...p.form, isInti: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 text-[#1A73E8]"
                  />
                  <span className="text-sm font-medium">SK Inti</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approveModal.form.isTampilBeranda}
                    onChange={(e) =>
                      setApproveModal((p) => ({
                        ...p,
                        form: { ...p.form, isTampilBeranda: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 text-[#1A73E8]"
                  />
                  <span className="text-sm font-medium">Tampil Beranda</span>
                </label>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t mt-4">
                <button
                  type="button"
                  onClick={() =>
                    setApproveModal({
                      isOpen: false,
                      dataId: "",
                      form: {} as any,
                    })
                  }
                  className="px-5 py-2 text-sm font-medium border rounded-md hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-5 py-2 text-sm font-medium text-white bg-[#1A73E8] hover:bg-[#1557B0] rounded-md"
                >
                  {isProcessing ? "Proses..." : "Konfirmasi & Sahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW UTAMA */}
      <div className="bg-white rounded-lg border border-[#DADCE0] shadow-sm flex flex-col mb-6">
        <div className="p-4 border-b border-[#DADCE0] flex flex-col gap-4 bg-[#FCE8E6]/30">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-[#202124]">Antrean Konfirmasi</h3>
            <div className="flex gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={() =>
                    setDeleteModal({
                      isOpen: true,
                      type: "bulk",
                      id: "",
                      title: `${selectedIds.length} Data Terpilih`,
                    })
                  }
                  className="text-xs bg-white text-[#D93025] border border-[#FCE8E6] hover:bg-[#FCE8E6] px-4 py-2 rounded-lg font-bold"
                >
                  Tolak ({selectedIds.length})
                </button>
              )}
              <button
                onClick={handleExportData}
                className="text-xs font-bold border px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <IconDownload /> Export
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IconSearch />
              </div>
              <input
                type="text"
                placeholder="Cari nama, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-[#1A73E8]"
              />
            </div>
            <select
              value={filterBidang}
              onChange={(e) => setFilterBidang(e.target.value)}
              className="border py-2 px-3 rounded-lg text-xs font-medium outline-none"
            >
              <option value="Semua">Semua Pilihan Bidang</option>
              {bidangList.map((b) => (
                <option key={b.id} value={b.namaBidang}>
                  {b.namaBidang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500">
              Memuat data pendaftar...
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F8F9FA] border-b text-slate-500 sticky top-0">
                <tr>
                  <th className="px-4 py-3 w-8">
                    <input
                      type="checkbox"
                      onChange={(e) =>
                        setSelectedIds(
                          e.target.checked ? filteredData.map((d) => d.id) : [],
                        )
                      }
                      checked={
                        filteredData.length > 0 &&
                        selectedIds.length === filteredData.length
                      }
                      className="rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase w-12">
                    No
                  </th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase">
                    Pendaftar
                  </th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase">
                    Preferensi Bidang
                  </th>
                  <th className="px-4 py-3 font-bold text-[11px] uppercase text-right">
                    Tindakan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0]">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-16">
                      <IconEmpty />
                      <p className="text-slate-500">
                        Tidak ada antrean pendaftar.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((p, i) => (
                    <tr key={p.id} className="hover:bg-[#F8F9FA]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={(e) =>
                            setSelectedIds((prev) =>
                              e.target.checked
                                ? [...prev, p.id]
                                : prev.filter((id) => id !== p.id),
                            )
                          }
                          className="rounded cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">
                        {i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#202124]">
                          {p.nama}
                        </div>
                        <div className="text-xs text-[#5F6368]">
                          {p.wa} • {p.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#3C4043]">
                        {p.bidang || "Belum milih"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              id: p.id,
                              title: p.nama,
                              type: "single",
                            })
                          }
                          className="text-xs text-[#D93025] hover:bg-[#FCE8E6] border border-transparent px-3 py-1.5 rounded font-medium"
                        >
                          Tolak
                        </button>
                        <button
                          onClick={() => openApproveModal(p)}
                          className="text-xs text-[#1E8E3E] hover:bg-[#E6F4EA] border border-[#1E8E3E] px-3 py-1.5 rounded font-medium"
                        >
                          Tinjau & Sahkan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
