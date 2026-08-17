"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { db } from "@/lib/firebase";
import { sendWaAction } from "@/app/actions/wa";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import QRCode from "react-qr-code";
import {
  IconPlus,
  IconDownload,
  IconSearch,
  IconCheck,
  IconAlert,
  IconEmpty,
  IconRefresh,
} from "./Icons";

export default function TabPengurus() {
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [bidangList, setBidangList] = useState<any[]>([]);
  const [dpdList, setDpdList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSendingWA, setIsSendingWA] = useState(false);

  const [view, setView] = useState<"list" | "form">("list");
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // Untuk centang massal

  // Filter States
  const [search, setSearch] = useState("");
  const [filterBidang, setFilterBidang] = useState("Semua");
  const [filterPeriode, setFilterPeriode] = useState("Semua");
  const [sortMode, setSortMode] = useState("urutan");

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
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    data: null as any,
  });
  const [isFlipped, setIsFlipped] = useState(false);

  // Form State
  const [form, setForm] = useState({
    nama: "",
    wa: "",
    email: "",
    jabatan: "Anggota",
    bidang: "",
    linkTTD: "",
    isInti: false,
    fotoUrl: "",
    fotoPosition: "center",
    linkedinUrl: "",
    instagramUrl: "",
    isTampilBeranda: false,
    noUrut: "",
    isPengurus: true,
    status_pengurus: "Aktif",
    nia: "",
    periodeId: "",
    fakultas: "",
    programStudi: "",
    angkatan: "",
    domisili: "",
  });

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, isOpen: false })), 4000);
  };

  // 🔥 FUNGSI KIRIM WHATSAPP 🔥
  const triggerWaApi = async (
    type: string,
    phone: string,
    nama: string,
    detailData: any = {},
  ) => {
    if (!phone || phone.length < 9) return false;
    try {
      const data = await sendWaAction({
        type,
        phone,
        nama,
        detail: detailData,
      });
      return data.success;
    } catch (error) {
      return false;
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const pSnap = await getDocs(
        query(collection(db, "periode"), orderBy("tglMulai", "desc")),
      );
      const pList = pSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setPeriodeList(pList);

      const activePeriode = pList.find((p: any) => p.status === "Aktif");
      if (activePeriode && filterPeriode === "Semua")
        setFilterPeriode(activePeriode.id);

      const bSnap = await getDocs(
        query(collection(db, "bidang"), orderBy("namaBidang", "asc")),
      );
      setBidangList(bSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const dSnap = await getDocs(
        query(collection(db, "dpd"), orderBy("nama", "asc")),
      );
      setDpdList(dSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const uSnap = await getDocs(
        query(collection(db, "pengurus"), orderBy("createdAt", "desc")),
      );
      const allUsers = uSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const sah = allUsers.filter(
        (u: any) =>
          u.isPengurus ||
          u.role === "pengurus" ||
          u.status_pengurus === "Aktif" ||
          u.tampilDiWeb,
      );

      setPengurusList(sah);
    } catch (error) {
      showToast("Gagal memuat data personalia.", "error");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    let result = pengurusList;
    if (filterPeriode !== "Semua")
      result = result.filter((p) => p.periodeId === filterPeriode);
    if (filterBidang !== "Semua")
      result = result.filter((p) => p.bidang === filterBidang);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.nama?.toLowerCase().includes(q) ||
          p.jabatan?.toLowerCase().includes(q) ||
          p.bidang?.toLowerCase().includes(q) ||
          p.domisili?.toLowerCase().includes(q),
      );
    }
    result = [...result].sort((a, b) => {
      if (sortMode === "Nama-Asc") {
        return (a.nama || "").localeCompare(b.nama || "");
      } else if (sortMode === "Nama-Desc") {
        return (b.nama || "").localeCompare(a.nama || "");
      } else if (sortMode === "Bidang-Asc") {
        return (a.bidang || "").localeCompare(b.bidang || "");
      } else if (sortMode === "Bidang-Desc") {
        return (b.bidang || "").localeCompare(a.bidang || "");
      }
      
      const urutA =
        a.noUrut !== undefined && a.noUrut !== "" ? Number(a.noUrut) : 99;
      const urutB =
        b.noUrut !== undefined && b.noUrut !== "" ? Number(b.noUrut) : 99;
      if (urutA !== urutB) return urutA - urutB;
      return (a.nama || "").localeCompare(b.nama || "");
    });
    return result;
  }, [search, filterBidang, filterPeriode, sortMode, pengurusList]);

  const handleFormChange = (e: any) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const saveData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const finalData = {
        ...form,
        noUrut: form.noUrut ? Number(form.noUrut) : 99,
      };
      if (editId) {
        await updateDoc(doc(db, "pengurus", editId), {
          ...finalData,
          updatedAt: new Date().toISOString(),
        });
        showToast("Data Personalia diperbarui.", "success");
      } else {
        await addDoc(collection(db, "pengurus"), {
          ...finalData,
          createdAt: new Date().toISOString(),
        });
        showToast("Data Personalia baru ditambahkan.", "success");
      }
      setEditId(null);
      await fetchData();
      setView("list");
    } catch (error) {
      showToast("Gagal menyimpan data.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const cabutPengurus = async (id: string, nama: string) => {
    if (!confirm(`Yakin ingin mencabut status Pengurus dari ${nama}?`)) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "pengurus", id), {
        isPengurus: false,
        status_pengurus: "Nonaktif",
        role: "anggota",
        isTampilBeranda: false,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Status Pengurus ${nama} dicabut.`, "success");
      await fetchData();
    } catch (error) {
      showToast("Gagal merubah status.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateNIA = async (user: any) => {
    const finalDomisili = user.domisili;
    if (!finalDomisili) {
      showToast("Gagal: Pengurus belum memiliki data Domisili. Silakan Edit terlebih dahulu.", "error");
      return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin meng-generate ulang NIA untuk ${user.nama}? NIA sebelumnya akan diganti dengan yang baru.`)) return;
    
    setIsProcessing(true);
    try {
      const counterRef = doc(db, "pengaturan", "counter_nia");
      const counterSnap = await getDoc(counterRef);
      let newNumber = 89;
      if (counterSnap.exists())
        newNumber = (counterSnap.data().lastNumber || 88) + 1;
      await setDoc(counterRef, { lastNumber: newNumber }, { merge: true });

      const dateObj = new Date();
      const yearStr = dateObj.getFullYear().toString().slice(-2);
      const monthStr = String(dateObj.getMonth() + 1).padStart(2, "0");
      let kabStr = "00";
      const dom = finalDomisili.toLowerCase();
      if (dom.includes("sleman")) kabStr = "04";
      else if (dom.includes("bantul")) kabStr = "02";
      else if (dom.includes("gunung")) kabStr = "03";
      else if (dom.includes("kulon")) kabStr = "01";
      else if (dom.includes("kota") || dom.includes("yogya")) kabStr = "71";

      const urutStr = String(newNumber).padStart(4, "0");
      const finalNIA = `${yearStr}.${monthStr}.34.${kabStr}.${urutStr}`;

      await updateDoc(doc(db, "pengurus", user.id), { nia: finalNIA });
      try {
        await updateDoc(doc(db, "pendaftar", user.id), { nia: finalNIA });
      } catch (e) {}

      showToast(`NIA berhasil di-generate ulang: ${finalNIA}`, "success");
      fetchData();
    } catch (error) {
      console.error(error);
      showToast("Terjadi kesalahan saat me-generate ulang NIA.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

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
      showToast("Data dihapus permanen.", "success");
      await fetchData();
    } catch (error) {
      showToast("Gagal menghapus data.", "error");
    } finally {
      setIsProcessing(false);
      setDeleteModal({ isOpen: false, id: "", title: "", type: "single" });
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
      Fakultas: d.fakultas || "-",
      Prodi: d.programStudi || "-",
      Angkatan: d.angkatan || "-",
      Domisili: d.domisili || "-",
      Jabatan: d.jabatan,
      Bidang: d.bidang,
      Nomor_Urut: d.noUrut || 99,
      NIA: d.nia || "Belum Terbit",
      Periode_ID: d.periodeId || "",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pengurus");
    XLSX.writeFile(wb, `Data_PENGURUS_IKA_UII.xlsx`);
  };

  const openDetail = (user: any) => {
    setDetailModal({ isOpen: true, data: user });
    setIsFlipped(false);
  };

  const getSingkatanFakultas = (fakultas: string) => {
    if (!fakultas) return "-";
    const lower = fakultas.toLowerCase();
    if (lower.includes("teknologi industri")) return "FTI";
    if (lower.includes("matematika")) return "FMIPA";
    if (lower.includes("hukum")) return "FH";
    if (lower.includes("ekonomi")) return "FE/FBE";
    if (lower.includes("kedokteran")) return "FK";
    if (lower.includes("psikologi")) return "FPSB";
    if (lower.includes("sipil")) return "FTSP";
    if (lower.includes("agama")) return "FIAI";
    return fakultas;
  };

  // 🔥 FUNGSI CENTANG MASSAL 🔥
  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredData.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
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

      {/* MODAL PREVIEW KTA & KIRIM WHATSAPP */}
      {detailModal.isOpen && detailModal.data && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex flex-col items-center w-full max-w-sm">
            {/* Logic Ambil Tahun Periode */}
            {(() => {
              const pData = periodeList.find(
                (p) => p.id === detailModal.data.periodeId,
              );
              const startYear = pData?.tglMulai
                ? new Date(pData.tglMulai).getFullYear()
                : "";
              const endYear = pData?.tglSelesai
                ? new Date(pData.tglSelesai).getFullYear()
                : "";
              const displayPeriodeTahun =
                startYear && endYear ? `${startYear} - ${endYear}` : "";

              return (
                <div
                  className="relative w-full max-w-[280px] aspect-[380/600] mx-auto"
                  style={{ perspective: "1000px" }}
                >
                  <div
                    className="relative w-full h-full transition-transform duration-700 cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.15)] rounded-[16px] border border-[#DADCE0]"
                    style={{
                      transform: isFlipped
                        ? "rotateY(180deg)"
                        : "rotateY(0deg)",
                      transformStyle: "preserve-3d",
                    }}
                    onClick={() => setIsFlipped(!isFlipped)}
                  >
                    {/* DEPAN */}
                    <div
                      className="absolute inset-0 bg-white rounded-[16px] overflow-hidden flex flex-col"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                      }}
                    >
                      <img
                        src="/logo-dpp-ika.png"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-[0.04] grayscale pointer-events-none z-0"
                      />
                      <div className="relative pt-6 pb-4 w-full shrink-0 z-10 bg-[#0B1528] flex flex-col items-center justify-center">
                        <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#224A9A]"></div>
                        <div className="flex flex-col z-10 px-4 text-center">
                          <h1 className="text-white font-black text-[14px] tracking-widest uppercase mb-1 mt-2">
                            KARTU TANDA{" "}
                            {detailModal.data.isPengurus
                              ? "PENGURUS"
                              : "ANGGOTA"}
                          </h1>
                          <h2 className="text-[#F29900] font-bold text-[8px] tracking-[0.2em] uppercase">
                            DPW IKA UII D.I.YOGYAKARTA
                          </h2>
                        </div>
                      </div>
                      <div className="h-[4px] w-full bg-[#F29900] shrink-0 z-10 relative"></div>

                      <div className="flex-grow flex flex-col items-center px-4 py-5 relative z-10 text-center">
                        <div className="w-[90px] h-[115px] bg-[#F8F9FA] rounded-lg border-[3px] border-white shadow-md overflow-hidden shrink-0 mb-3">
                          {detailModal.data.fotoUrl ? (
                            <img
                              src={detailModal.data.fotoUrl}
                              className="w-full h-full object-cover"
                              style={{
                                objectPosition:
                                  detailModal.data.fotoPosition || "center",
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#9AA0A6] text-[10px]">
                              Tanpa Foto
                            </div>
                          )}
                        </div>

                        <div className="w-full space-y-2">
                          <div>
                            <p className="text-[15px] font-black text-[#0B1528] uppercase line-clamp-2 px-2 leading-tight">
                              {detailModal.data.nama}
                            </p>
                          </div>

                          <div>
                            <p className="text-[8px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
                              Nomor Induk{" "}
                              {detailModal.data.isPengurus
                                ? "Pengurus"
                                : "Anggota"}
                            </p>
                            <p className="text-[12px] font-bold text-[#0B1528] tracking-widest font-mono bg-[#F8F9FA] inline-block px-3 py-1 rounded border border-[#EBEBEB]">
                              {detailModal.data.nia || "BELUM TERBIT"}
                            </p>
                          </div>

                          <div>
                            <p className="text-[8px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
                              Program Studi / Angkatan
                            </p>
                            <p className="text-[10px] font-black text-[#224A9A] uppercase leading-tight">
                              {getSingkatanFakultas(detailModal.data.fakultas)}{" "}
                              / {detailModal.data.programStudi || "-"} /{" "}
                              {detailModal.data.angkatan || "-"}
                            </p>

                            {displayPeriodeTahun && (
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                Periode {displayPeriodeTahun}
                              </p>
                            )}

                            <div className="mt-2.5">
                              <span className="inline-block text-[9px] font-bold text-white bg-[#0B1528] px-2.5 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
                                {detailModal.data.jabatan ===
                                "Koordinator Bidang"
                                  ? `Koordinator ${detailModal.data.bidang}`
                                  : detailModal.data.jabatan === "Anggota"
                                    ? `Anggota ${detailModal.data.bidang}`
                                    : detailModal.data.jabatan}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2.5 pb-3 bg-[#F8FAFC] border-t border-[#EBEBEB] shrink-0 z-10 relative flex items-center justify-center">
                        <p className="text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-0.5">
                          <span className="text-[#0B1528]">IKADIY.</span>
                          <span className="text-[#224A9A]">UII</span>
                          <span className="text-[#0B1528]">.AC.ID</span>
                        </p>
                      </div>
                    </div>

                    {/* BELAKANG */}
                    <div
                      className="absolute inset-0 bg-white rounded-[16px] overflow-hidden flex flex-col"
                      style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                      }}
                    >
                      <div className="h-[18px] bg-[#0B1528] w-full shrink-0 z-10 flex">
                        <div className="w-[70%] bg-[#0B1528] h-full"></div>
                        <div
                          className="w-[30%] bg-[#224A9A] h-full"
                          style={{
                            clipPath:
                              "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)",
                          }}
                        ></div>
                      </div>
                      <div className="h-[4px] bg-[#F29900] w-full shrink-0 z-10"></div>
                      <div className="flex-grow flex flex-col px-6 py-6 items-center z-10 relative">
                        <h3 className="text-[12px] font-black text-[#0B1528] uppercase tracking-widest mb-5 border-b-2 pb-1.5 text-center w-full border-[#EBEBEB]">
                          Ketentuan Penggunaan
                        </h3>
                        <ol className="text-[9px] text-[#5F6368] space-y-3 pl-3 list-decimal leading-relaxed text-justify w-full mb-auto font-medium">
                          <li>
                            Kartu ini diterbitkan oleh DPW IKA UII Yogyakarta
                            dan merupakan bukti keanggotaan yang sah.
                          </li>
                          <li>
                            Kartu tidak dapat dipindahtangankan dan wajib
                            ditunjukkan untuk mengakses layanan, acara, atau
                            klaim potongan harga pada mitra jaringan bisnis IKA
                            UII DIY.
                          </li>
                          <li>
                            Apabila menemukan kartu ini, harap dikembalikan
                            kepada Sekretariat DPW IKA UII DIY melalui email:
                            ika.diy@uii.ac.id.
                          </li>
                        </ol>
                        <div className="flex flex-col items-center w-full mt-6 pt-6 border-t border-[#EBEBEB]">
                          <div className="w-[100px] h-[100px] p-2 bg-white border border-[#DADCE0] rounded-xl shadow-sm mb-2.5">
                            <QRCode
                              value={`https://ikadiy.uii.ac.id/kta/${detailModal.data.id}`}
                              size={96}
                              style={{ width: "100%", height: "100%" }}
                            />
                          </div>
                          <p className="text-[9px] font-black text-[#0B1528] tracking-widest uppercase bg-[#F8F9FA] px-2 py-0.5 rounded border border-[#EBEBEB]">
                            Scan Validasi
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* INFORMASI WHATSAPP & TOMBOL KIRIM */}
            <div className="w-full max-w-[280px] mt-4 bg-white rounded-xl p-3 shadow-md border border-[#DADCE0]">
              {(() => {
                const isComplete = Boolean(
                  detailModal.data.fotoUrl && detailModal.data.domisili
                );
                return (
                  <>
                    {!isComplete && (
                      <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-center">
                        <span className="text-[10px] text-amber-700 font-bold flex items-center justify-center gap-1">
                          <IconAlert /> Profil Belum Lengkap!
                        </span>
                        <p className="text-[9px] text-amber-600 mt-1">
                          Pesan WA akan berisi "Magic Link" agar anggota melengkapi datanya.
                        </p>
                      </div>
                    )}
                    <p className="text-[11px] text-slate-500 font-medium text-center mb-2">
                      Kirim akses KTA ini melalui WhatsApp ke nomor:
                    </p>
              <div className="flex items-center justify-center gap-2 mb-3 bg-slate-50 py-1.5 rounded-lg border border-slate-100">
                <svg
                  className="w-4 h-4 text-emerald-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.452-.885-.773-1.482-1.728-1.655-2.026-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51h-.57c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                <span className="text-[13px] font-bold text-slate-800 tracking-wider font-mono">
                  {detailModal.data.wa
                    ? detailModal.data.wa
                    : "Tidak Ada Nomor"}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setDetailModal({ isOpen: false, data: null })}
                  className="flex-1 bg-white text-[#5F6368] font-medium text-xs py-2 rounded-lg border border-[#DADCE0] hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  disabled={isSendingWA || !detailModal.data.wa}
                  onClick={async () => {
                    setIsSendingWA(true);
                    const isComplete = Boolean(
                      detailModal.data.fotoUrl && detailModal.data.domisili
                    );
                    const success = await triggerWaApi(
                      "send_kta",
                      detailModal.data.wa,
                      detailModal.data.nama,
                      { userId: detailModal.data.id, isComplete },
                    );
                    setIsSendingWA(false);
                    if (success) {
                      showToast(
                        "Link E-KTA berhasil dikirim via WA!",
                        "success",
                      );
                      setDetailModal({ isOpen: false, data: null });
                    } else {
                      showToast("Gagal mengirim pesan WA.", "error");
                    }
                  }}
                  className={`flex-[2] text-white text-xs font-bold py-2 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                    Boolean(detailModal.data.fotoUrl && detailModal.data.domisili)
                      ? "bg-[#1E8E3E] hover:bg-[#156E2F]"
                      : "bg-amber-500 hover:bg-amber-600"
                  } disabled:opacity-50`}
                >
                  {isSendingWA
                    ? "Mengirim..."
                    : Boolean(detailModal.data.fotoUrl && detailModal.data.domisili)
                      ? "Kirim KTA (Selesai)"
                      : "Kirim Magic Link WA"}
                </button>
              </div>
              </>
            );
          })()}
            </div>
          </div>
        </div>
      )}

      {/* VIEW UTAMA */}
      {view === "list" ? (
        <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#DADCE0] flex flex-col gap-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h3 className="font-bold text-[#202124] text-[18px]">
                  Database Personalia Sah
                </h3>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Daftar pengurus dan anggota yang memiliki akses ke E-KTA.
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto mt-3 md:mt-0">
                <button
                  onClick={handleExportData}
                  className="w-full md:w-auto text-xs font-bold border border-[#DADCE0] text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
                >
                  <IconDownload /> Export Excel
                </button>
                <button
                  onClick={() => {
                    setForm({
                      nama: "",
                      wa: "",
                      email: "",
                      jabatan: "Anggota",
                      bidang: bidangList[0]?.namaBidang || "",
                      linkTTD: "",
                      isInti: false,
                      fotoUrl: "",
                      fotoPosition: "center",
                      linkedinUrl: "",
                      instagramUrl: "",
                      isTampilBeranda: false,
                      noUrut: "",
                      isPengurus: true,
                      status_pengurus: "Aktif",
                      nia: "",
                      periodeId: filterPeriode !== "Semua" ? filterPeriode : "",
                      fakultas: "",
                      programStudi: "",
                      angkatan: "",
                      domisili: "",
                    });
                    setEditId(null);
                    setView("form");
                  }}
                  className="w-full md:w-auto text-xs bg-[#1A73E8] text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#1557B0] transition-colors shadow-sm"
                >
                  <IconPlus /> Tambah Data
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full bg-[#F8F9FA] p-3 rounded-lg border border-[#EBEBEB]">
              <div className="relative w-full md:w-auto flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <IconSearch />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama, jabatan, domisili..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-[#DADCE0] rounded-lg text-sm bg-white outline-none focus:border-[#1A73E8] transition-colors shadow-sm"
                />
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <select
                  value={filterPeriode}
                  onChange={(e) => setFilterPeriode(e.target.value)}
                  className="w-full md:w-auto bg-[#E8F0FE] border border-[#1A73E8]/20 text-[#1A73E8] py-2.5 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="Semua">Semua Periode</option>
                  {periodeList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.namaPeriode}
                    </option>
                  ))}
                </select>
                <select
                  value={filterBidang}
                  onChange={(e) => setFilterBidang(e.target.value)}
                  className="w-full md:w-auto bg-white border border-[#DADCE0] text-slate-700 py-2.5 px-3 rounded-lg text-xs font-bold outline-none cursor-pointer shadow-sm"
                >
                  <option value="Semua">Semua Bidang</option>
                  {bidangList.map((b) => (
                    <option key={b.id} value={b.namaBidang}>
                      {b.namaBidang}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[400px]">
            {isLoading ? (
              <div className="p-10 text-center text-slate-500 flex flex-col items-center">
                <div className="animate-spin w-8 h-8 border-4 border-[#E8F0FE] border-t-[#1A73E8] rounded-full mb-3"></div>
                Memuat data personalia...
              </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#F8F9FA] border-b border-[#DADCE0] text-slate-500 sticky top-0">
                  <tr>
                    {/* CHECKBOX MASSAL */}
                    <th className="px-4 py-4 w-10 text-center border-r border-slate-200">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-[#1A73E8] cursor-pointer"
                        onChange={toggleSelectAll}
                        checked={
                          selectedIds.length === filteredData.length &&
                          filteredData.length > 0
                        }
                      />
                    </th>
                    <th 
                      className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors group"
                      onClick={() => setSortMode(sortMode === "Nama-Asc" ? "Nama-Desc" : "Nama-Asc")}
                    >
                      <div className="flex items-center gap-1">
                        Identitas Profil
                        <span className="text-slate-400 group-hover:text-slate-600">
                          {sortMode === "Nama-Asc" ? "↑" : sortMode === "Nama-Desc" ? "↓" : "↕"}
                        </span>
                      </div>
                    </th>
                    <th 
                      className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors group"
                      onClick={() => setSortMode(sortMode === "Bidang-Asc" ? "Bidang-Desc" : "Bidang-Asc")}
                    >
                      <div className="flex items-center gap-1">
                        Penempatan & Domisili
                        <span className="text-slate-400 group-hover:text-slate-600">
                          {sortMode === "Bidang-Asc" ? "↑" : sortMode === "Bidang-Desc" ? "↓" : "↕"}
                        </span>
                      </div>
                    </th>
                    <th className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider">
                      Status KTA
                    </th>
                    <th className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider text-right">
                      Manajemen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBEBEB]">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-16">
                        <IconEmpty />
                        <p className="text-slate-500 font-medium">
                          Personalia tidak ditemukan.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((p, i) => (
                      <tr
                        key={p.id}
                        className={`transition-colors ${selectedIds.includes(p.id) ? "bg-[#E8F0FE]" : "hover:bg-[#F8F9FA]"}`}
                      >
                        <td className="px-4 py-4 text-center border-r border-slate-200">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded text-[#1A73E8] cursor-pointer"
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.fotoUrl || "/logo-dpp-ika.png"}
                              className="w-11 h-11 rounded-full border border-[#DADCE0] object-cover bg-white shadow-sm"
                              style={{
                                objectPosition: p.fotoPosition || "center",
                              }}
                            />
                            <div>
                              <div className="font-bold text-[#202124] text-[13px] mb-1">
                                {p.nama}{" "}
                                {p.noUrut && p.noUrut !== 99 && (
                                  <span className="text-[9px] bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 ml-1 rounded font-mono">
                                    Urut: {p.noUrut}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 w-fit">
                                NIA:{" "}
                                <strong className="text-[#1E8E3E]">
                                  {p.nia || "Belum Terbit"}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-[13px] font-bold text-[#202124] mb-1.5">
                            {p.bidang}
                          </div>
                          <div className="flex gap-1.5">
                            <span className="text-[9px] text-[#1A73E8] bg-[#E8F0FE] px-2 py-0.5 rounded border border-[#D2E3FC] font-bold uppercase tracking-wider">
                              {p.jabatan}
                            </span>
                            {p.domisili && (
                              <span className="text-[9px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-bold uppercase tracking-wider">
                                {p.domisili}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 🔥 STATUS KTA 🔥 */}
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1E8E3E] bg-[#E6F4EA] w-fit px-2 py-0.5 rounded-md border border-[#CEEAD6]">
                              <IconCheck /> Terverifikasi
                            </span>
                            {p.wa && p.wa.length > 8 ? (
                              <span className="text-[10px] text-emerald-600 font-medium">
                                Whatsapp Terdaftar
                              </span>
                            ) : (
                              <span className="text-[10px] text-red-500 font-medium">
                                Whatsapp Belum Terdaftar
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleRegenerateNIA(p)}
                              className="border border-amber-200 bg-amber-50 text-amber-600 p-1.5 rounded-md hover:bg-amber-100 shadow-sm transition-colors"
                              title="Reset & Generate Ulang NIA"
                            >
                              <IconRefresh />
                            </button>
                            <button
                              onClick={() => openDetail(p)}
                              className="border border-[#1A73E8] text-[#1A73E8] bg-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-[#E8F0FE] shadow-sm transition-colors flex items-center gap-1"
                            >
                              Kirim KTA
                            </button>
                            <button
                              onClick={() => cabutPengurus(p.id, p.nama)}
                              className="border border-red-200 text-red-600 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-red-50 shadow-sm transition-colors"
                            >
                              Cabut
                            </button>
                            <button
                              onClick={() => {
                                setForm({
                                  ...p,
                                  fotoPosition: p.fotoPosition || "center",
                                });
                                setEditId(p.id);
                                setView("form");
                              }}
                              className="bg-[#1A73E8] text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-[#1557B0] shadow-sm transition-colors"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* OPSI MASSAL (MUNCUL JIKA ADA YANG DICENTANG) */}
          {selectedIds.length > 0 && (
            <div className="bg-slate-50 border-t border-[#DADCE0] p-4 flex items-center justify-between animate-in slide-in-from-bottom-2">
              <p className="text-sm font-bold text-[#202124]">
                {selectedIds.length} Data Terpilih
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Yakin ingin MENGHAPUS PERMANEN ${selectedIds.length} data ini?`,
                      )
                    ) {
                      setDeleteModal({
                        isOpen: true,
                        id: "",
                        title: "Hapus Massal",
                        type: "bulk",
                      });
                      executeDelete(); // Note: ini trigger langsung, pastikan aman.
                    }
                  }}
                  className="bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  Hapus Terpilih
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <form
          onSubmit={saveData}
          className="bg-white rounded-xl border border-[#DADCE0] p-6 sm:p-8 max-w-4xl mx-auto shadow-sm"
        >
          <div className="flex justify-between items-center mb-6 border-b border-[#EBEBEB] pb-4">
            <h3 className="font-bold text-xl text-[#202124]">
              {editId ? "Ubah Data Personalia" : "Tambah Personalia Baru"}
            </h3>
            <button
              type="button"
              onClick={() => setView("list")}
              className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              Kembali
            </button>
          </div>

          <div className="space-y-6">
            {/* IDENTITAS UTAMA */}
            <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#DADCE0] space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-[#DADCE0] pb-2">
                Informasi Kontak & Diri
              </h4>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    Nama Lengkap (Sesuai KTA)
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={form.nama}
                    onChange={handleFormChange}
                    required
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    No. WhatsApp (Aktif)
                  </label>
                  <input
                    type="text"
                    name="wa"
                    value={form.wa}
                    onChange={handleFormChange}
                    placeholder="Contoh: 08123456789"
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm font-mono outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm font-mono outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* DATA ALUMNI */}
            <div className="bg-[#E8F0FE]/50 p-5 rounded-xl border border-[#D2E3FC] space-y-4">
              <h4 className="text-xs font-black text-[#1A73E8] uppercase tracking-widest border-b border-[#D2E3FC] pb-2">
                Data Identitas Alumni UII
              </h4>
              <div className="grid sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    Fakultas
                  </label>
                  <input
                    type="text"
                    name="fakultas"
                    placeholder="Contoh: Teknologi Industri"
                    value={form.fakultas}
                    onChange={handleFormChange}
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    Program Studi
                  </label>
                  <input
                    type="text"
                    name="programStudi"
                    placeholder="Contoh: Teknik Mesin"
                    value={form.programStudi}
                    onChange={handleFormChange}
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    Angkatan
                  </label>
                  <input
                    type="text"
                    name="angkatan"
                    placeholder="Contoh: 2005"
                    value={form.angkatan}
                    onChange={handleFormChange}
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* JABATAN & PENEMPATAN */}
            <div className="bg-white p-5 rounded-xl border border-[#DADCE0] space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-[#DADCE0] pb-2">
                Struktur Organisasi (SK)
              </h4>
              <div className="grid sm:grid-cols-3 gap-5">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold mb-1.5 text-[#1A73E8]">
                    Periode Aktif Kepengurusan
                  </label>
                  <select
                    name="periodeId"
                    value={form.periodeId}
                    onChange={handleFormChange}
                    required
                    className="w-full border-2 border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8] px-4 py-2.5 rounded-lg text-sm font-bold outline-none cursor-pointer"
                  >
                    <option value="" disabled>
                      -- Tetapkan Periode --
                    </option>
                    {periodeList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.namaPeriode}{" "}
                        {p.status === "Aktif" ? "(Aktif Saat Ini)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    Titel Jabatan
                  </label>
                  <select
                    name="jabatan"
                    value={form.jabatan}
                    onChange={handleFormChange}
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] transition-all bg-white"
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
                    <option value="Anggota">Anggota Bidang</option>
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    Bidang Penempatan
                  </label>
                  <select
                    name="bidang"
                    value={form.bidang}
                    onChange={handleFormChange}
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] transition-all bg-white"
                  >
                    <option value="">-- Non-Bidang --</option>
                    {bidangList.map((b) => (
                      <option key={b.id} value={b.namaBidang}>
                        {b.namaBidang}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                    Asal Wilayah (DPD)
                  </label>
                  <select
                    name="domisili"
                    value={form.domisili}
                    onChange={handleFormChange}
                    className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] transition-all bg-white"
                  >
                    <option value="">-- DPW (Pusat) --</option>
                    {dpdList.map((d) => (
                      <option key={d.id} value={d.nama}>
                        {d.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* NIA & MEDIA */}
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="bg-[#E6F4EA]/40 p-5 border border-[#CEEAD6] rounded-xl">
                <label className="block text-xs font-black mb-1.5 text-[#1E8E3E]">
                  NIA (Nomor Induk Anggota)
                </label>
                <input
                  type="text"
                  name="nia"
                  value={form.nia}
                  onChange={handleFormChange}
                  placeholder="Format: 26.05..."
                  className="w-full border border-[#A8DAB5] px-4 py-2.5 rounded-lg text-sm font-mono focus:border-[#1E8E3E] outline-none shadow-sm"
                />
              </div>
              <div className="bg-white p-5 border border-[#DADCE0] rounded-xl shadow-sm">
                <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                  Urutan Tampil (Struktur Web)
                </label>
                <input
                  type="number"
                  name="noUrut"
                  value={form.noUrut}
                  onChange={handleFormChange}
                  placeholder="Contoh: 1"
                  className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm focus:border-[#1A73E8] outline-none"
                />
              </div>
            </div>

            {/* UPLOAD FOTO */}
            <div className="bg-white p-5 border border-[#DADCE0] rounded-xl shadow-sm grid sm:grid-cols-3 gap-5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                  Tautan URL Foto Profil (Square/Portrait)
                </label>
                <input
                  type="url"
                  name="fotoUrl"
                  value={form.fotoUrl}
                  onChange={handleFormChange}
                  placeholder="https://contoh.com/foto.jpg"
                  className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] transition-all"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold mb-1.5 text-[#202124]">
                  Fokus Potongan Foto (KTA)
                </label>
                <select
                  name="fotoPosition"
                  value={form.fotoPosition}
                  onChange={handleFormChange}
                  className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm outline-none focus:border-[#1A73E8] bg-white transition-all"
                >
                  <option value="top">Fokus Wajah (Atas)</option>
                  <option value="center">Proporsional (Tengah)</option>
                  <option value="bottom">Fokus Badan (Bawah)</option>
                </select>
              </div>
            </div>

            {/* TOGGLES PENGATURAN TAMPILAN */}
            <div className="flex gap-8 p-5 border border-[#DADCE0] rounded-xl bg-slate-50">
              <label className="flex items-center gap-2.5 text-sm font-bold cursor-pointer text-[#202124]">
                <input
                  type="checkbox"
                  name="isInti"
                  checked={form.isInti}
                  onChange={handleFormChange}
                  className="w-5 h-5 rounded border-[#DADCE0] text-[#1A73E8] cursor-pointer focus:ring-[#1A73E8]"
                />
                Termasuk Pengurus Inti
              </label>
              <label className="flex items-center gap-2.5 text-sm font-bold cursor-pointer text-[#202124]">
                <input
                  type="checkbox"
                  name="isTampilBeranda"
                  checked={form.isTampilBeranda}
                  onChange={handleFormChange}
                  className="w-5 h-5 rounded border-[#DADCE0] text-[#1A73E8] cursor-pointer focus:ring-[#1A73E8]"
                />
                Tampilkan di Website Publik
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-[#EBEBEB]">
            <button
              type="button"
              onClick={() => setView("list")}
              className="px-6 py-3 text-sm font-bold border border-[#DADCE0] text-[#5F6368] rounded-xl hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-8 py-3 text-sm font-bold text-white bg-[#1A73E8] rounded-xl hover:bg-[#1557B0] shadow-md transition-all hover:-translate-y-0.5"
            >
              {isProcessing ? "Menyimpan Data..." : "Simpan Personalia"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
