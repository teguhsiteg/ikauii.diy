"use client";

import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import QRCode from "react-qr-code";
import { sendEmailAction } from "@/app/actions/email";


export default function VerifikasiAnggotaPage() {
  const [pendaftarList, setPendaftarList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // 🔥 FILTERS 🔥
  const [filterStatus, setFilterStatus] = useState("Dalam Proses");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterFakultas, setFilterFakultas] = useState("");
  const [filterAngkatan, setFilterAngkatan] = useState("");
  const [filterDomisili, setFilterDomisili] = useState("");

  const [itemsPerPage, setItemsPerPage] = useState<number | "Semua">(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("Terbaru");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // 🔥 STATE TOAST NOTIFICATION 🔥
  const [toast, setToast] = useState({
    isOpen: false,
    message: "",
    type: "success",
  });

  // 🔥 STATE MODALS 🔥
  const [approveModal, setApproveModal] = useState({
    isOpen: false,
    user: null as any,
  });
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    user: null as any,
    reason: "",
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: "single",
    id: "",
    title: "",
  });

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportTarget, setExportTarget] = useState("filtered"); // "filtered" | "all"

  const [importPreview, setImportPreview] = useState({
    isOpen: false,
    data: [] as any[],
    successCount: 0,
    failedCount: 0,
    isUploading: false,
    progress: 0,
    currentItem: "",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success",
  ) => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, isOpen: false })), 4000);
  };

  const fetchPendaftar = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "pendaftar"),
        orderBy("tanggalDaftar", "desc"),
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));
      // Filter out Disetujui so they don't show up if there are any lingering ones
      setPendaftarList(data.filter((p: any) => p.status?.toLowerCase() !== "disetujui"));
    } catch (error) {
      console.error("Error fetching data: ", error);
      showToast("Gagal mengambil data dari server.", "error");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchPendaftar();
  }, []);

  // 🔥 GENERATE UNIQUE FILTER OPTIONS DARI DATA 🔥
  const optionFakultas = useMemo(
    () =>
      Array.from(
        new Set(pendaftarList.map((p) => p.fakultas).filter(Boolean)),
      ).sort(),
    [pendaftarList],
  );
  const optionAngkatan = useMemo(
    () =>
      Array.from(
        new Set(
          pendaftarList.map((p) => p.angkatan || p.tahunLulus).filter(Boolean),
        ),
      ).sort(),
    [pendaftarList],
  );
  const optionDomisili = useMemo(
    () =>
      Array.from(
        new Set(pendaftarList.map((p) => p.domisili).filter(Boolean)),
      ).sort(),
    [pendaftarList],
  );

  // 🔥 LOGIC FILTERING GANDA & SORTING 🔥
  const filteredList = useMemo(() => {
    const result = pendaftarList.filter((p) => {
      const matchStatus = p.status === filterStatus;
      const lowerSearch = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        (p.namaLengkap && p.namaLengkap.toLowerCase().includes(lowerSearch)) ||
        (p.nim && p.nim.toLowerCase().includes(lowerSearch));

      const matchFakultas = !filterFakultas || p.fakultas === filterFakultas;
      const matchAngkatan =
        !filterAngkatan || (p.angkatan || p.tahunLulus) === filterAngkatan;
      const matchDomisili = !filterDomisili || p.domisili === filterDomisili;

      return (
        matchStatus &&
        matchSearch &&
        matchFakultas &&
        matchAngkatan &&
        matchDomisili
      );
    });

    result.sort((a, b) => {
      let valA, valB;

      if (sortOrder === "Terbaru") {
        return new Date(b.tanggalDaftar).getTime() - new Date(a.tanggalDaftar).getTime();
      }
      if (sortOrder === "Terlama") {
        return new Date(a.tanggalDaftar).getTime() - new Date(b.tanggalDaftar).getTime();
      }

      if (sortOrder === "Nama-Asc") {
        return (a.namaLengkap || "").localeCompare(b.namaLengkap || "");
      }
      if (sortOrder === "Nama-Desc") {
        return (b.namaLengkap || "").localeCompare(a.namaLengkap || "");
      }
      
      if (sortOrder === "Fakultas-Asc") {
        return (a.fakultas || "").localeCompare(b.fakultas || "");
      }
      if (sortOrder === "Fakultas-Desc") {
        return (b.fakultas || "").localeCompare(a.fakultas || "");
      }
      
      if (sortOrder === "Domisili-Asc") {
        return (a.domisili || "").localeCompare(b.domisili || "");
      }
      if (sortOrder === "Domisili-Desc") {
        return (b.domisili || "").localeCompare(a.domisili || "");
      }
      
      if (sortOrder === "Status-Asc") {
        return (a.status || "").localeCompare(b.status || "");
      }
      if (sortOrder === "Status-Desc") {
        return (b.status || "").localeCompare(a.status || "");
      }

      return 0;
    });

    return result;
  }, [
    pendaftarList,
    filterStatus,
    searchQuery,
    filterFakultas,
    filterAngkatan,
    filterDomisili,
    sortOrder,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    filterStatus,
    itemsPerPage,
    filterFakultas,
    filterAngkatan,
    filterDomisili,
    sortOrder,
  ]);

  const totalPages =
    itemsPerPage === "Semua"
      ? 1
      : Math.ceil(filteredList.length / itemsPerPage);
  const currentData = useMemo(() => {
    if (itemsPerPage === "Semua") return filteredList;
    const start = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(start, start + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(currentData.map((item) => item.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    e.stopPropagation();
    if (e.target.checked) setSelectedIds((prev) => [...prev, id]);
    else setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const triggerEmailApi = async (
    type: string,
    email: string,
    nama: string,
    niaValue?: string,
    alasanDetail?: string,
  ) => {
    try {
      const res = await sendEmailAction({
          type,
          email,
          nama,
          detail: { nia: niaValue, alasan: alasanDetail },
        });
      return res.success;
    } catch (error) {
      console.error(`Gagal trigger API Email ${type}:`, error);
      return false;
    }
  };

  // 🔥 HELPER: Mengecek kelengkapan profil dasar (Foto & Domisili wajib untuk E-KTA dan format NIA)
  const isProfileComplete = (user: any) => {
    return Boolean(user.fotoUrl && user.domisili);
  };

  // --- 🔥 EKSEKUSI APPROVE & REJECT ---
  const executeApprove = async () => {
    const user = approveModal.user;
    if (!user) return;
    setIsProcessing(true);

    try {
      const pendaftarRef = doc(db, "pendaftar", user.id);
      const pengurusRef = doc(db, "pengurus", user.id);

      const isComplete = isProfileComplete(user);

      // Selalu generate NIA saat masuk menjadi Anggota Sah
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
      const dom = (user.domisili || "").toLowerCase();
      if (dom.includes("sleman")) kabStr = "04";
      else if (dom.includes("bantul")) kabStr = "02";
      else if (dom.includes("gunung")) kabStr = "03";
      else if (dom.includes("kulon")) kabStr = "01";
      else if (dom.includes("kota") || dom.includes("yogya")) kabStr = "71";

      const urutStr = String(newNumber).padStart(4, "0");
      const finalNIA = `${yearStr}.${monthStr}.34.${kabStr}.${urutStr}`;

      await deleteDoc(pendaftarRef);

      await setDoc(pengurusRef, {
        ...user,
        nia: finalNIA,
        nama: user.namaLengkap,
        wa: user.noWA,
        email: user.email,
        jabatan: "Anggota",
        bidang: user.keahlian || "Belum Ditentukan",
        fotoUrl: user.fotoUrl || "",
        linkTTD: "",
        isInti: false,
        isTampilBeranda: false,
        linkedinUrl: "",
        instagramUrl: "",
        createdAt: dateObj.toISOString(),
        status: "Disetujui",
      });

      // Kirim email penerbitan E-KTA
      await triggerEmailApi(
        "member_verified",
        user.email,
        user.namaLengkap,
        finalNIA,
      );
      if (isComplete) {
        showToast(`Anggota disetujui. NIA tercetak: ${finalNIA}`, "success");
      } else {
        showToast(
          `Anggota disetujui, NIA (${finalNIA}) tercetak (Profil belum lengkap)`,
          "info",
        );
      }

      setApproveModal({ isOpen: false, user: null });
      setIsDetailModalOpen(false);
      fetchPendaftar();
    } catch (error) {
      console.error("Gagal menyetujui: ", error);
      showToast("Gagal memproses persetujuan sistem.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeReject = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = rejectModal.user;
    if (!user || !rejectModal.reason.trim()) return;

    setIsProcessing(true);
    try {
      await updateDoc(doc(db, "pendaftar", user.id), {
        status: "Ditolak",
        alasanPenolakan: rejectModal.reason,
      });
      await triggerEmailApi(
        "reject_anggota",
        user.email,
        user.namaLengkap,
        "",
        rejectModal.reason,
      );
      setRejectModal({ isOpen: false, user: null, reason: "" });
      setIsDetailModalOpen(false);
      fetchPendaftar();
      showToast("Pendaftar berhasil ditolak.", "success");
    } catch (error) {
      console.error("Gagal menolak: ", error);
      showToast("Terjadi kesalahan saat menolak.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      if (deleteModal.type === "single" && deleteModal.id) {
        await deleteDoc(doc(db, "pendaftar", deleteModal.id));
        await deleteDoc(doc(db, "pengurus", deleteModal.id));
      } else if (deleteModal.type === "bulk" && selectedIds.length > 0) {
        await Promise.all(
          selectedIds.map(async (id) => {
            await deleteDoc(doc(db, "pendaftar", id));
            await deleteDoc(doc(db, "pengurus", id));
          }),
        );
      }
      setDeleteModal({ isOpen: false, type: "single", id: "", title: "" });
      fetchPendaftar();
      showToast("Data berhasil dihapus permanen.", "success");
    } catch (error) {
      console.error("Gagal menghapus: ", error);
      showToast("Terjadi kesalahan saat menghapus data.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 🔥 EKSEKUSI KIRIM ULANG & TERBITKAN NIA (JIKA SEBELUMNYA DALAM PROSES) ---
  const resendApprovedEmail = async (user: any) => {
    setIsProcessing(true);
    try {
      let currentNia = user.nia;
      const isComplete = isProfileComplete(user);

      // Jika NIA masih "Dalam Proses", kita generate NIA baru saat tombol ini diklik
      if (currentNia === "Dalam Proses" || !currentNia) {
        if (!isComplete) {
          showToast(
            "Profil belum lengkap (Foto/Domisili kosong). Tidak bisa menerbitkan E-KTA.",
            "error",
          );
          setIsProcessing(false);
          return;
        }

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
        const dom = (user.domisili || "").toLowerCase();
        if (dom.includes("sleman")) kabStr = "04";
        else if (dom.includes("bantul")) kabStr = "02";
        else if (dom.includes("gunung")) kabStr = "03";
        else if (dom.includes("kulon")) kabStr = "01";
        else if (dom.includes("kota") || dom.includes("yogya")) kabStr = "71";

        const urutStr = String(newNumber).padStart(4, "0");
        currentNia = `${yearStr}.${monthStr}.34.${kabStr}.${urutStr}`;

        // Simpan NIA yang baru ter-generate ke database
        await updateDoc(doc(db, "pendaftar", user.id), {
          nia: currentNia,
          emailSent: true,
        });
        await updateDoc(doc(db, "pengurus", user.id), { nia: currentNia });
      } else {
        await updateDoc(doc(db, "pendaftar", user.id), { emailSent: true });
      }

      const isSuccess = await triggerEmailApi(
        "member_verified",
        user.email,
        user.namaLengkap,
        currentNia,
      );

      if (isSuccess) {
        showToast("Email E-KTA berhasil dikirim!", "success");
      } else {
        showToast("Gagal mengirim email E-KTA.", "error");
      }

      setIsDetailModalOpen(false);
      fetchPendaftar();
    } catch (error) {
      console.error("Error resending email:", error);
      showToast("Terjadi kesalahan sistem saat mengirim email.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkEmailSend = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    let successCount = 0;

    try {
      for (const id of selectedIds) {
        const user = pendaftarList.find((p) => p.id === id);
        if (!user) continue;

        // Jangan kirim email massal jika profilnya belum lengkap (NIA masih 'Dalam Proses')
        if (user.nia === "Dalam Proses" && !isProfileComplete(user)) {
          continue;
        }

        let currentNia = user.nia;

        // Generate massal jika profil lengkap tapi belum punya NIA
        if (currentNia === "Dalam Proses") {
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
          const dom = (user.domisili || "").toLowerCase();
          if (dom.includes("sleman")) kabStr = "04";
          else if (dom.includes("bantul")) kabStr = "02";
          else if (dom.includes("gunung")) kabStr = "03";
          else if (dom.includes("kulon")) kabStr = "01";
          else if (dom.includes("kota") || dom.includes("yogya")) kabStr = "71";

          const urutStr = String(newNumber).padStart(4, "0");
          currentNia = `${yearStr}.${monthStr}.34.${kabStr}.${urutStr}`;

          await updateDoc(doc(db, "pendaftar", user.id), {
            nia: currentNia,
            emailSent: true,
          });
          await updateDoc(doc(db, "pengurus", user.id), { nia: currentNia });
        } else {
          await updateDoc(doc(db, "pendaftar", user.id), { emailSent: true });
        }

        const isSuccess = await triggerEmailApi(
          "member_verified",
          user.email,
          user.namaLengkap,
          currentNia,
        );
        if (isSuccess) successCount++;

        await new Promise((resolve) => setTimeout(resolve, 300)); // Delay agar tidak spam API
      }

      showToast(
        `Berhasil memproses & mengirim ${successCount} email!`,
        "success",
      );
      fetchPendaftar();
    } catch (error) {
      console.error("Bulk email error:", error);
      showToast("Terjadi kesalahan saat memproses email massal.", "error");
    } finally {
      setIsProcessing(false);
      setSelectedIds([]);
    }
  };

  // --- 🔥 ALUR EXPORT BARU 🔥 ---
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        email: "",
        namaLengkap: "",
        noWA: "",
        nim: "",
        tahunLulus: "",
        fakultas: "",
        programStudi: "",
        domisili: "",
        alamatLengkap: "",
        pekerjaan: "",
        keahlian: "",
        motto: "",
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Import");
    XLSX.writeFile(wb, "Template_Import_Anggota_IKA_UII.xlsx");
    showToast("Template berhasil diunduh.", "success");
  };

  const executeExport = () => {
    const dataToExport =
      exportTarget === "filtered" ? filteredList : pendaftarList;
    if (dataToExport.length === 0) {
      showToast("Tidak ada data untuk diekspor.", "error");
      return;
    }

    const formattedData = dataToExport.map((d, index) => ({
      No: index + 1,
      "Tanggal Daftar":
        new Date(d.tanggalDaftar).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB",
      Status: d.status,
      "Status Notifikasi": d.emailSent ? "Terkirim" : "Belum Dikirim",
      NIA: d.nia || "Belum Terbit",
      "Nama Lengkap": d.namaLengkap,
      "Nomor WA": d.noWA,
      Email: d.email,
      Fakultas: d.fakultas,
      "Program Studi": d.programStudi,
      NIM: d.nim,
      "Tahun Masuk / Angkatan": d.angkatan || d.tahunLulus || "-",
      Domisili: d.domisili,
      "Alamat Lengkap": d.alamatLengkap || "-",
      Pekerjaan: d.pekerjaan,
      "Bidang Keahlian": d.keahlian || d.bidang,
      "Motivasi / Motto": d.motto,
      "Alasan Penolakan": d.alasanPenolakan || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Data_Anggota`);
    XLSX.writeFile(
      wb,
      `Ekspor_Anggota_IKA_UII_${exportTarget === "all" ? "Semua" : filterStatus.replace(/\s+/g, "_")}.xlsx`,
    );

    setExportModalOpen(false);
    showToast("Data berhasil diekspor ke Excel.", "success");
  };

  // --- 🔥 ALUR IMPORT BARU (TIPE B) 🔥 ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsLoading(true); // Optional: show loading while fetching
        const pengurusSnapshot = await getDocs(collection(db, "pengurus"));
        const pengurusList = pengurusSnapshot.docs.map(doc => doc.data());
        setIsLoading(false);

        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const previewList = rawData.map((item: any) => {
          const emailTrim = (item.email || "").trim().toLowerCase();
          const nimTrim = String(item.nim || "").trim();

          const isEmailEmpty = !emailTrim;
          const isRegisteredPendaftar = pendaftarList.some(
            (p) =>
              (p.email && p.email.toLowerCase() === emailTrim) ||
              (p.nim && p.nim === nimTrim),
          );
          const isRegisteredPengurus = pengurusList.some(
            (p) =>
              (p.email && p.email.toLowerCase() === emailTrim) ||
              (p.nim && p.nim === nimTrim),
          );
          const isRegistered = isRegisteredPendaftar || isRegisteredPengurus;

          let isValid = true;
          let statusPesan = "Siap Import";

          if (isEmailEmpty) {
            isValid = false;
            statusPesan = "Email Kosong";
          } else if (isRegistered) {
            isValid = false;
            statusPesan = "Data Duplikat";
          }

          return { ...item, isValid, statusPesan };
        });

        const successCount = previewList.filter((i) => i.isValid).length;
        const failedCount = previewList.length - successCount;

        setImportPreview({
          isOpen: true,
          data: previewList,
          successCount,
          failedCount,
          isUploading: false,
          progress: 0,
          currentItem: "",
        });
      } catch (error) {
        console.error(error);
        showToast(
          "Gagal membaca file Excel. Pastikan format sesuai template.",
          "error",
        );
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // reset input
  };

  const executeImportProgress = async () => {
    const validData = importPreview.data.filter((item) => item.isValid);
    if (validData.length === 0) return;

    setImportPreview((prev) => ({ ...prev, isUploading: true }));

    try {
      for (let i = 0; i < validData.length; i++) {
        const user = validData[i];
        setImportPreview((prev) => ({
          ...prev,
          progress: i + 1,
          currentItem: user.namaLengkap || user.email,
        }));

        const docId = `import_${Date.now()}_${i}`; // Generate ID unik
        const pendaftarRef = doc(db, "pendaftar", docId);

        const dataFinal = {
          namaLengkap: user.namaLengkap || "",
          noWA: String(user.noWA || ""),
          email: String(user.email || "")
            .trim()
            .toLowerCase(),
          nim: String(user.nim || ""),
          fakultas: user.fakultas || "",
          programStudi: user.programStudi || "",
          angkatan: String(user.tahunLulus || user.angkatan || ""),
          domisili: user.domisili || "",
          pekerjaan: user.pekerjaan || "",
          keahlian: user.keahlian || user.bidang || "Belum Ditentukan",
          motto: user.motto || "-",
          alamatLengkap: user.alamatLengkap || "-",
          status: "Dalam Proses", // 🔥 TIPE B: Masuk Dalam Proses dulu 🔥
          emailSent: false,
          createdAt: new Date().toISOString(),
          tanggalDaftar: new Date().toISOString(),
        };

        await setDoc(pendaftarRef, dataFinal);

        // Animasi progress pelan-pelan (0.2 detik per data)
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      showToast(
        `Import ${validData.length} data ke "Dalam Proses" berhasil!`,
        "success",
      );
      setImportPreview({
        isOpen: false,
        data: [],
        successCount: 0,
        failedCount: 0,
        isUploading: false,
        progress: 0,
        currentItem: "",
      });
      setFilterStatus("Dalam Proses");
      fetchPendaftar();
    } catch (error) {
      console.error("Gagal import massal:", error);
      showToast("Terjadi kesalahan saat memproses data.", "error");
      setImportPreview((prev) => ({ ...prev, isUploading: false }));
    }
  };

  const openDetail = (user: any) => {
    setSelectedUser(user);
    setIsFlipped(false);
    setIsDetailModalOpen(true);
  };
  const getPreviewNIA = (user: any) => {
    return user.nia || "XXXX.XX.34.XX.XXXX";
  };
  const getSingkatanFakultas = (fakultas: string) => {
    return fakultas || "-";
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500 pb-12 font-sans text-slate-800 relative">
      {/* 🔥 TOAST NOTIFICATION 🔥 */}
      <div
        className={`fixed top-6 right-6 z-[200] transition-all duration-300 transform ${toast.isOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"}`}
      >
        <div
          className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border ${toast.type === "success" ? "bg-white border-emerald-100" : toast.type === "error" ? "bg-white border-red-100" : "bg-white border-blue-100"}`}
        >
          <div
            className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center shadow-sm ${toast.type === "success" ? "bg-emerald-100 text-emerald-600" : toast.type === "error" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}
          >
            {toast.type === "success" && (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
            {toast.type === "error" && (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {toast.type === "success"
                ? "Berhasil!"
                : toast.type === "error"
                  ? "Peringatan!"
                  : "Informasi"}
            </p>
            <p className="text-[13px] text-slate-500 mt-0.5">{toast.message}</p>
          </div>
        </div>
      </div>

      {/* HEADER SECTION */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-medium text-slate-900 mb-1 tracking-tight">
            Verifikasi Anggota Baru
          </h2>
          <p className="text-slate-500 text-sm">
            Kelola persetujuan pendaftaran & Kirim notifikasi E-KTA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="cursor-pointer text-xs font-bold bg-[#F8F9FA] text-slate-700 border border-[#DADCE0] px-4 py-2.5 rounded-lg hover:bg-slate-100 flex items-center gap-2 shadow-sm transition-colors">
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            Import Excel
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setExportModalOpen(true)}
            className="text-xs font-bold bg-white text-slate-700 border border-[#DADCE0] px-4 py-2.5 rounded-lg hover:bg-slate-50 flex items-center gap-2 shadow-sm transition-colors"
          >
            <svg
              className="w-4 h-4 text-slate-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export Excel
          </button>

          {selectedIds.length > 0 && filterStatus === "Disetujui" && (
            <button
              onClick={handleBulkEmailSend}
              disabled={isProcessing}
              className="text-xs bg-[#1A73E8] text-white border border-[#1A73E8] hover:bg-[#1557B0] px-4 py-2.5 rounded-lg transition-colors shadow-sm font-bold flex items-center gap-1.5 ml-2"
            >
              Kirim Email E-KTA ({selectedIds.length})
            </button>
          )}
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
              className="text-xs bg-white text-[#D93025] border border-[#FCE8E6] hover:bg-[#FCE8E6] px-4 py-2.5 rounded-lg transition-colors shadow-sm font-bold flex items-center gap-1.5 ml-2"
            >
              Hapus ({selectedIds.length})
            </button>
          )}
        </div>
      </div>

      {/* FILTER TABS & SEARCH (GOOGLE WORKSPACE STYLE) */}
      <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm mb-6 flex flex-col p-2 gap-3">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          {/* TABS */}
          <div className="flex w-full md:w-auto overflow-x-auto no-scrollbar">
            {["Dalam Proses", "Ditolak"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setFilterStatus(tab);
                  setSelectedIds([]);
                }}
                className={`px-5 py-2.5 text-sm font-medium transition-all rounded-lg whitespace-nowrap ${filterStatus === tab ? "bg-[#E8F0FE] text-[#1A73E8] border border-[#1A73E8]/20" : "bg-transparent border-transparent text-slate-600 hover:bg-[#F8F9FA]"}`}
              >
                {tab}{" "}
                <span
                  className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold ${filterStatus === tab ? "bg-[#1A73E8] text-white" : "bg-slate-100 text-slate-500 border border-[#DADCE0]"}`}
                >
                  {pendaftarList.filter((p) => p.status === tab).length}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto px-2 md:px-0">
            {/* SEARCH BAR */}
            <div className="relative w-full sm:w-64 shrink-0">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-[#DADCE0] rounded-lg text-sm bg-[#F8F9FA] focus:bg-white placeholder-slate-400 focus:outline-none focus:border-[#1A73E8] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* 🔥 CHIP FILTERS (BARU) 🔥 */}
        <div className="flex flex-wrap items-center gap-2 px-2 pb-1 border-t border-slate-100 pt-3 mt-1">
          <svg
            className="w-4 h-4 text-slate-400 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-2">
            Filter:
          </span>

          <select
            value={filterFakultas}
            onChange={(e) => setFilterFakultas(e.target.value)}
            className="bg-white border border-[#DADCE0] text-slate-600 py-1.5 px-3 rounded-full text-xs font-medium focus:border-[#1A73E8] outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option value="">Semua Fakultas</option>
            {optionFakultas.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            value={filterAngkatan}
            onChange={(e) => setFilterAngkatan(e.target.value)}
            className="bg-white border border-[#DADCE0] text-slate-600 py-1.5 px-3 rounded-full text-xs font-medium focus:border-[#1A73E8] outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option value="">Semua Angkatan</option>
            {optionAngkatan.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          <select
            value={filterDomisili}
            onChange={(e) => setFilterDomisili(e.target.value)}
            className="bg-white border border-[#DADCE0] text-slate-600 py-1.5 px-3 rounded-full text-xs font-medium focus:border-[#1A73E8] outline-none cursor-pointer hover:bg-slate-50 transition-colors shadow-sm"
          >
            <option value="">Semua Domisili</option>
            {optionDomisili.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {(filterFakultas ||
            filterAngkatan ||
            filterDomisili ||
            searchQuery) && (
            <button
              onClick={() => {
                setFilterFakultas("");
                setFilterAngkatan("");
                setFilterDomisili("");
                setSearchQuery("");
              }}
              className="text-xs font-medium text-[#1A73E8] hover:underline ml-2"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-[#E8F0FE] border-t-[#1A73E8] rounded-full animate-spin"></div>
              <p className="text-sm text-[#1A73E8] mt-4 font-medium">
                Memuat data...
              </p>
            </div>
          ) : currentData.length === 0 ? (
            <div className="text-center py-20">
              <svg
                className="w-16 h-16 text-slate-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <h3 className="font-medium text-slate-800 text-lg mb-1">
                Data Tidak Ditemukan
              </h3>
              <p className="text-slate-500 text-sm">
                Coba sesuaikan filter atau kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#F8F9FA] border-b border-[#DADCE0] text-slate-500">
                <tr>
                  <th className="px-4 py-4 w-8 text-center border-r border-slate-100">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        currentData.length > 0 &&
                        selectedIds.length === currentData.length
                      }
                      className="rounded border-slate-300 text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                    />
                  </th>
                  <th className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider text-center w-12 border-r border-slate-100">
                    No
                  </th>
                  <th 
                    className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => setSortOrder(sortOrder === "Nama-Asc" ? "Nama-Desc" : "Nama-Asc")}
                  >
                    <div className="flex items-center gap-1">
                      Identitas & Kontak
                      <span className="text-slate-400 group-hover:text-slate-600">
                        {sortOrder === "Nama-Asc" ? "↑" : sortOrder === "Nama-Desc" ? "↓" : "↕"}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => setSortOrder(sortOrder === "Fakultas-Asc" ? "Fakultas-Desc" : "Fakultas-Asc")}
                  >
                    <div className="flex items-center gap-1">
                      Latar Belakang UII
                      <span className="text-slate-400 group-hover:text-slate-600">
                        {sortOrder === "Fakultas-Asc" ? "↑" : sortOrder === "Fakultas-Desc" ? "↓" : "↕"}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => setSortOrder(sortOrder === "Domisili-Asc" ? "Domisili-Desc" : "Domisili-Asc")}
                  >
                    <div className="flex items-center gap-1">
                      Profesi & Domisili
                      <span className="text-slate-400 group-hover:text-slate-600">
                        {sortOrder === "Domisili-Asc" ? "↑" : sortOrder === "Domisili-Desc" ? "↓" : "↕"}
                      </span>
                    </div>
                  </th>
                  <th 
                    className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                    onClick={() => setSortOrder(sortOrder === "Status-Asc" ? "Status-Desc" : "Status-Asc")}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Status Dokumen
                      <span className="text-slate-400 group-hover:text-slate-600">
                        {sortOrder === "Status-Asc" ? "↑" : sortOrder === "Status-Desc" ? "↓" : "↕"}
                      </span>
                    </div>
                  </th>
                  <th className="px-4 py-4 font-bold text-[11px] uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0]">
                {currentData.map((user, index) => {
                  const noUrut =
                    itemsPerPage === "Semua"
                      ? index + 1
                      : (currentPage - 1) * (itemsPerPage as number) +
                        index +
                        1;
                  const profileComplete = isProfileComplete(user);

                  return (
                    <tr
                      key={user.id}
                      onClick={() => openDetail(user)}
                      className="hover:bg-[#F8F9FA] transition-colors cursor-pointer group"
                    >
                      <td
                        className="px-4 py-4 text-center border-r border-slate-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(user.id)}
                          onChange={(e) => handleSelectOne(e, user.id)}
                          className="rounded border-slate-300 text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-4 text-center font-mono text-xs text-slate-400 border-r border-slate-50">
                        {noUrut}
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-800 group-hover:text-[#1A73E8] transition-colors">
                          {user.namaLengkap}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          {user.noWA} • {user.email}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-slate-700">
                          {user.fakultas}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          NIM: {user.nim} | Angkatan:{" "}
                          {user.angkatan || user.tahunLulus || "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                          {user.pekerjaan}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]">
                          Domisili: {user.domisili}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded border text-[9px] font-bold uppercase tracking-wider ${user.status === "Dalam Proses" ? "bg-[#FEF7E0] text-[#B06000] border-[#FCE8B2]" : user.status === "Disetujui" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#CEEAD6]" : "bg-[#FCE8E6] text-[#D93025] border-[#FAD2CF]"}`}
                          >
                            {user.status}
                          </span>

                          {/* 🔥 INDIKATOR KELENGKAPAN PROFIL 🔥 */}
                          <span
                            className={`text-[9px] font-bold flex items-center gap-1 ${profileComplete ? "text-emerald-600" : "text-amber-600"}`}
                          >
                            {profileComplete ? (
                              <>✔ Profil Lengkap</>
                            ) : (
                              <>⚠️ Belum Lengkap</>
                            )}
                          </span>

                          {user.status === "Disetujui" && (
                            <span
                              className={`text-[9px] font-bold flex items-center gap-1 ${user.emailSent ? "text-emerald-600" : "text-slate-400"}`}
                            >
                              <svg
                                className="w-3 h-3"
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
                              </svg>
                              {user.emailSent ? "Terkirim" : "Belum Dikirim"}
                            </span>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-4 py-4 text-right space-x-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openDetail(user)}
                          className="bg-white hover:bg-slate-50 text-slate-600 font-medium px-3 py-1.5 rounded transition-colors text-xs border border-[#DADCE0] shadow-sm"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() =>
                            setDeleteModal({
                              isOpen: true,
                              type: "single",
                              id: user.id,
                              title: user.namaLengkap,
                            })
                          }
                          className="bg-white hover:bg-[#FCE8E6] text-[#D93025] font-medium p-1.5 rounded transition-colors text-xs border border-[#DADCE0] shadow-sm"
                          title="Hapus Data"
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION */}
        {itemsPerPage !== "Semua" && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#DADCE0] bg-[#F8F9FA]">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                Tampilkan:
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) =>
                  setItemsPerPage(
                    e.target.value === "Semua"
                      ? "Semua"
                      : Number(e.target.value),
                  )
                }
                className="bg-white border border-[#DADCE0] py-1 px-2 rounded text-xs font-medium focus:border-[#1A73E8] outline-none cursor-pointer shadow-sm"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value="Semua">Semua</option>
              </select>
            </div>
            <div className="text-xs font-medium text-slate-500">
              {(currentPage - 1) * (itemsPerPage as number) + 1} -{" "}
              {Math.min(
                currentPage * (itemsPerPage as number),
                filteredList.length,
              )}{" "}
              dari {filteredList.length}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-[#DADCE0] rounded bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm text-xs font-bold"
              >
                Prev
              </button>
              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-xs font-bold transition-colors shadow-sm ${currentPage === i + 1 ? "bg-[#1A73E8] text-white border border-[#1A73E8]" : "border border-[#DADCE0] bg-white text-slate-600 hover:bg-slate-50"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-[#DADCE0] rounded bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm text-xs font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL EXPORT EXCEL (BARU) */}
      {/* ========================================================================= */}
      {exportModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-[#DADCE0] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#DADCE0] bg-[#F8F9FA] flex justify-between items-center">
              <h3 className="font-medium text-lg text-slate-800 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Pusat Ekspor Data
              </h3>
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-slate-400 hover:text-[#D93025] hover:bg-[#FCE8E6] p-1 rounded-full transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Pilih Data yang Diekspor:
                </label>
                <div className="space-y-2">
                  <label
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${exportTarget === "filtered" ? "border-[#1A73E8] bg-[#E8F0FE]" : "border-[#DADCE0] hover:bg-slate-50"}`}
                  >
                    <input
                      type="radio"
                      name="exportTarget"
                      value="filtered"
                      checked={exportTarget === "filtered"}
                      onChange={(e) => setExportTarget(e.target.value)}
                      className="w-4 h-4 text-[#1A73E8]"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Sesuai Filter & Pencarian Saat Ini
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ekspor {filteredList.length} data yang tampil di tabel
                        sekarang.
                      </div>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${exportTarget === "all" ? "border-[#1A73E8] bg-[#E8F0FE]" : "border-[#DADCE0] hover:bg-slate-50"}`}
                  >
                    <input
                      type="radio"
                      name="exportTarget"
                      value="all"
                      checked={exportTarget === "all"}
                      onChange={(e) => setExportTarget(e.target.value)}
                      className="w-4 h-4 text-[#1A73E8]"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-800">
                        Semua Master Data
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Ekspor seluruh {pendaftarList.length} data dari semua
                        status dan angkatan.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#DADCE0] bg-[#F8F9FA] flex justify-between items-center">
              <button
                onClick={handleDownloadTemplate}
                className="text-[11px] font-bold text-slate-600 hover:text-[#1A73E8] underline flex items-center gap-1"
              >
                Unduh Template Import Excel
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setExportModalOpen(false)}
                  className="px-4 py-2 border border-[#DADCE0] rounded text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Batal
                </button>
                <button
                  onClick={executeExport}
                  className="px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded text-sm font-medium transition-colors shadow-sm flex items-center gap-1.5"
                >
                  Ekspor Sekarang
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL IMPORT PREVIEW (TIPE B - PROGRESS BAR) */}
      {/* ========================================================================= */}
      {importPreview.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full flex flex-col border border-[#DADCE0] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-[#F8F9FA]">
              <div>
                <h3 className="font-medium text-lg text-slate-800">
                  Pratinjau Data Import (Mode Aman)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Total baris:{" "}
                  <span className="font-bold text-slate-700">
                    {importPreview.data.length}
                  </span>{" "}
                  |
                  <span className="text-emerald-600 font-bold ml-2">
                    {" "}
                    {importPreview.successCount} Aman
                  </span>{" "}
                  |
                  <span className="text-red-600 font-bold ml-2">
                    {" "}
                    {importPreview.failedCount} Gagal/Duplikat
                  </span>
                </p>
              </div>
              {!importPreview.isUploading && (
                <button
                  onClick={() =>
                    setImportPreview({
                      isOpen: false,
                      data: [],
                      successCount: 0,
                      failedCount: 0,
                      isUploading: false,
                      progress: 0,
                      currentItem: "",
                    })
                  }
                  className="text-slate-400 hover:text-[#D93025] hover:bg-[#FCE8E6] p-1.5 rounded-full transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* PROGRESS BAR OVERLAY JIKA UPLOADING */}
            {importPreview.isUploading ? (
              <div className="p-10 flex flex-col items-center justify-center min-h-[300px] bg-white">
                <div className="w-full max-w-md bg-slate-100 rounded-full h-3 mb-4 overflow-hidden border border-[#DADCE0] relative">
                  <div
                    className="bg-[#1A73E8] h-full transition-all duration-300 ease-out relative"
                    style={{
                      width: `${(importPreview.progress / importPreview.successCount) * 100}%`,
                    }}
                  >
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 w-full animate-[shimmer_1s_infinite]"></div>
                  </div>
                </div>
                <h4 className="text-lg font-bold text-slate-800 mb-1">
                  {Math.round(
                    (importPreview.progress / importPreview.successCount) * 100,
                  )}
                  % Selesai
                </h4>
                <p className="text-sm font-medium text-slate-500 mb-2">
                  Memproses {importPreview.progress} dari{" "}
                  {importPreview.successCount} data aman...
                </p>
                <p className="text-[11px] font-mono text-[#1A73E8] bg-blue-50 px-3 py-1 rounded border border-blue-100 truncate max-w-sm">
                  Mendaftarkan: {importPreview.currentItem}
                </p>
                <p className="text-[10px] text-slate-400 mt-6 italic">
                  Harap jangan menutup jendela ini hingga proses selesai.
                </p>
              </div>
            ) : (
              <div className="p-6 overflow-y-auto bg-slate-50">
                <div className="border border-[#DADCE0] rounded-xl overflow-hidden bg-white max-h-[50vh] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#F8F9FA] text-slate-500 font-bold sticky top-0 border-b border-[#DADCE0] shadow-sm z-10">
                      <tr>
                        <th className="p-3 w-10 text-center">No</th>
                        <th className="p-3">Nama Lengkap</th>
                        <th className="p-3">Email & No WA</th>
                        <th className="p-3">NIM / Angkatan</th>
                        <th className="p-3 text-center">Status Pengecekan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DADCE0]">
                      {importPreview.data.map((row, index) => (
                        <tr
                          key={index}
                          className={
                            row.isValid
                              ? "hover:bg-slate-50"
                              : "bg-[#FCE8E6]/50"
                          }
                        >
                          <td className="p-3 text-center text-slate-400 font-mono">
                            {index + 1}
                          </td>
                          <td className="p-3 font-semibold text-slate-800">
                            {row.namaLengkap || "-"}
                          </td>
                          <td className="p-3">
                            <div className="font-mono text-slate-700">
                              {row.email || "-"}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {row.noWA || "-"}
                            </div>
                          </td>
                          <td className="p-3 font-mono">
                            {row.nim || "-"} / {row.tahunLulus || "-"}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${row.isValid ? "bg-[#E6F4EA] text-[#1E8E3E] border border-[#CEEAD6]" : "bg-white text-[#D93025] border border-[#FAD2CF]"}`}
                            >
                              {row.statusPesan}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 bg-blue-50 border border-blue-100 p-3 rounded-lg text-[11px] text-blue-800 leading-relaxed font-medium">
                  <strong className="text-blue-900 block mb-1">
                    💡 Preview Data:
                  </strong>
                  Data yang aman (Hijau) akan dimasukkan ke tabel{" "}
                  <span className="bg-white border border-blue-200 px-1.5 py-0.5 rounded">
                    Dalam Proses
                  </span>
                  . Sistem <strong>TIDAK</strong> akan mencetak NIA dan{" "}
                  <strong>TIDAK</strong> membuatkan akun login secara otomatis.
                  Anda dapat mereview dan menyetujuinya satu per satu (atau
                  massal) nanti.
                </div>
              </div>
            )}

            {!importPreview.isUploading && (
              <div className="px-6 py-4 border-t border-[#DADCE0] bg-[#F8F9FA] flex justify-end gap-3 shrink-0">
                <button
                  onClick={() =>
                    setImportPreview({
                      isOpen: false,
                      data: [],
                      successCount: 0,
                      failedCount: 0,
                      isUploading: false,
                      progress: 0,
                      currentItem: "",
                    })
                  }
                  className="px-4 py-2 border border-[#DADCE0] rounded text-sm text-slate-600 bg-white hover:bg-slate-50 transition-colors shadow-sm font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={executeImportProgress}
                  disabled={importPreview.successCount === 0}
                  className="px-5 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded text-sm font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
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
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  Mulai Import {importPreview.successCount} Data Aman
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DETAIL & ACTION (TIDAK BERUBAH) */}
      {/* ========================================================================= */}

      {/* 1. MODAL DETAIL USER */}
      {isDetailModalOpen && selectedUser && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#DADCE0] animate-in zoom-in-95">
            <div className="flex justify-between items-center px-6 py-5 border-b border-[#DADCE0] bg-[#F8F9FA] shrink-0">
              <h3 className="font-medium text-lg text-slate-800">
                Detail Pendaftar
              </h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-slate-400 hover:text-[#D93025] hover:bg-[#FCE8E6] p-1.5 rounded-full transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6 overflow-y-auto flex-grow custom-scrollbar space-y-6 bg-white">
              {/* 🔥 PREVIEW E-KTA PORTRAIT (HANYA JIKA DISETUJUI & PROFIL LENGKAP ATAU SUDAH PUNYA NIA) 🔥 */}
              {selectedUser.status === "Disetujui" &&
                selectedUser.nia !== "Dalam Proses" && (
                  <div className="mb-8 border-b border-slate-100 pb-8 flex flex-col items-center">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 text-center">
                      Preview Desain E-KTA (2 Sisi)
                    </h4>

                    {/* Container Scaled KTA Portrait dengan 3D Prespective */}
                    <div className="relative w-full max-w-[280px] aspect-[380/600] perspective-1000">
                      <div
                        className="relative w-full h-full transition-transform duration-700 transform-style-3d cursor-pointer shadow-[0_10px_30px_rgba(0,0,0,0.15)] rounded-[16px] border border-slate-200"
                        style={{
                          transform: isFlipped
                            ? "rotateY(180deg)"
                            : "rotateY(0deg)",
                        }}
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        {/* --- BAGIAN DEPAN (PORTRAIT) --- */}
                        <div className="absolute inset-0 backface-hidden bg-white rounded-[16px] overflow-hidden flex flex-col">
                          <div className="absolute inset-0 bg-slate-50 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/clean-textile.png')] z-0"></div>
                          <img
                            src="/logo-dpp-ika.png"
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-[0.03] grayscale pointer-events-none z-0"
                          />

                          {/* Header KTA */}
                          <div className="relative pt-6 pb-4 w-full shrink-0 z-10 bg-[#0B1528] flex flex-col items-center justify-center">
                            <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#224A9A]"></div>
                            <div className="bg-white p-1 rounded-full w-[48px] h-[48px] flex items-center justify-center shadow-md border-[2px] border-white/20 mb-2 relative z-10">
                              <img
                                src="/logo-dpp-ika.png"
                                alt="Logo"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-col z-10 px-4 text-center">
                              <h1 className="text-white font-black text-[14px] tracking-widest uppercase leading-none mb-1">
                                KARTU TANDA ANGGOTA
                              </h1>
                              <h2 className="text-[#F29900] font-bold text-[8px] tracking-[0.2em] uppercase">
                                DPW IKA UII D.I.YOGYAKARTA
                              </h2>
                            </div>
                          </div>
                          <div className="h-[4px] w-full bg-[#F29900] shrink-0 z-10 relative"></div>

                          {/* Body KTA */}
                          <div className="flex-grow flex flex-col items-center px-4 py-6 relative z-10 text-center">
                            <div className="w-[100px] h-[130px] bg-[#F8F9FA] rounded-lg border-[3px] border-white shadow-md overflow-hidden shrink-0 mb-4">
                              {selectedUser.fotoUrl ? (
                                <img
                                  src={selectedUser.fotoUrl}
                                  className="w-full h-full object-cover object-top"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#9AA0A6] text-[10px] font-medium bg-[#E8EAED]">
                                  <span>Tanpa Foto</span>
                                </div>
                              )}
                            </div>

                            <div className="w-full space-y-3">
                              <div>
                                <p className="text-[15px] font-black text-[#0B1528] uppercase leading-tight line-clamp-2 px-2">
                                  {selectedUser.namaLengkap}
                                </p>
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
                                  Nomor Induk Anggota
                                </p>
                                <p className="text-[12px] font-bold text-[#0B1528] tracking-widest leading-none font-mono bg-[#F8F9FA] inline-block px-3 py-1 rounded border border-[#EBEBEB]">
                                  {getPreviewNIA(selectedUser)}
                                </p>
                              </div>
                              <div>
                                <p className="text-[8px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
                                  Fakultas / Jurusan / Angkatan
                                </p>
                                <p className="text-[10px] font-black text-[#224A9A] uppercase leading-tight">
                                  {getSingkatanFakultas(selectedUser.fakultas)}{" "}
                                  / {selectedUser.programStudi || "-"} /{" "}
                                  {selectedUser.angkatan ||
                                    selectedUser.tahunLulus ||
                                    "-"}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Footer KTA */}
                          <div className="py-3 bg-[#F8FAFC] border-t border-[#EBEBEB] shrink-0 z-10 flex flex-col items-center justify-center">
                            <p className="text-[9px] font-black text-[#0B1528] tracking-[0.2em] uppercase">
                              IKADIY.UII.AC.ID
                            </p>
                          </div>
                        </div>

                        {/* --- BAGIAN BELAKANG (PORTRAIT) --- */}
                        <div
                          className="absolute inset-0 backface-hidden bg-white rounded-[16px] overflow-hidden flex flex-col"
                          style={{ transform: "rotateY(180deg)" }}
                        >
                          <div className="absolute inset-0 bg-slate-50 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/clean-textile.png')] z-0"></div>
                          <img
                            src="/logo-dpp-ika.png"
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 opacity-[0.03] grayscale pointer-events-none z-0"
                          />

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
                            <h3 className="text-[12px] font-black text-[#0B1528] uppercase tracking-widest mb-5 border-b-2 border-[#EBEBEB] pb-1.5 text-center w-full">
                              Ketentuan Penggunaan
                            </h3>

                            <ol className="text-[9px] text-[#5F6368] space-y-3 pl-3 list-decimal leading-relaxed text-justify w-full font-medium mb-auto">
                              <li>
                                Kartu ini diterbitkan oleh DPW IKA UII
                                Yogyakarta dan merupakan bukti keanggotaan yang
                                sah.
                              </li>
                              <li>
                                Kartu tidak dapat dipindahtangankan dan wajib
                                ditunjukkan untuk mengakses layanan, acara, atau
                                klaim potongan harga pada mitra.
                              </li>
                              <li>
                                Apabila menemukan kartu ini, harap dikembalikan
                                kepada Sekretariat DPW IKA UII DIY melalui
                                email: <strong>ika.diy@uii.ac.id</strong>.
                              </li>
                            </ol>

                            <div className="flex flex-col items-center w-full mt-6 pt-6 border-t border-[#EBEBEB]">
                              <div className="w-[100px] h-[100px] p-2 bg-white border border-[#DADCE0] rounded-xl shadow-sm mb-2.5 relative z-10">
                                <QRCode
                                  value={`https://ikadiy.uii.ac.id/kta/${selectedUser.id}`}
                                  size={96}
                                  style={{ width: "100%", height: "100%" }}
                                  level="M"
                                />
                              </div>
                              <p className="text-[9px] font-black text-[#0B1528] tracking-widest uppercase bg-[#F8F9FA] px-3 py-1 rounded border border-[#EBEBEB]">
                                Scan Validasi
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="mt-5 text-[10px] font-bold text-[#1A73E8] bg-blue-50 border border-blue-100 px-4 py-2 rounded-full hover:bg-blue-100 flex items-center gap-1.5 transition-transform hover:scale-105"
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Putar Kartu (Klik Disini)
                    </button>
                  </div>
                )}

              {/* 🔥 WARNING BOX JIKA PROFIL BELUM LENGKAP 🔥 */}
              {!isProfileComplete(selectedUser) && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 p-4 rounded-xl text-sm font-medium mb-4 flex gap-3 items-start shadow-sm">
                  <span className="text-xl leading-none shrink-0 mt-0.5">
                    ⚠️
                  </span>
                  <div>
                    <h4 className="font-bold mb-1">Profil Belum Lengkap!</h4>
                    <p className="opacity-90 leading-relaxed text-xs">
                      Pendaftar ini belum mengunggah foto profil resmi atau
                      belum melengkapi domisili. <br />
                      Jika disetujui, NIA akan berstatus <b>
                        "Dalam Proses"
                      </b>{" "}
                      dan E-KTA <b>tidak akan diterbitkan</b> sampai data
                      dilengkapi.
                    </p>
                  </div>
                </div>
              )}

              {selectedUser.status === "Ditolak" &&
                selectedUser.alasanPenolakan && (
                  <div className="bg-[#FCE8E6] border border-[#FAD2CF] p-4 rounded-xl flex gap-3">
                    <svg
                      className="w-5 h-5 text-[#D93025] shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div>
                      <h4 className="text-xs font-bold text-[#D93025] mb-1">
                        Alasan Penolakan:
                      </h4>
                      <p className="text-sm font-medium text-[#D93025]">
                        {selectedUser.alasanPenolakan}
                      </p>
                    </div>
                  </div>
                )}

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Nama Lengkap
                  </h4>
                  <p className="font-medium text-slate-800 text-lg">
                    {selectedUser.namaLengkap}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Waktu Pendaftaran
                  </h4>
                  <p className="font-medium text-slate-700">
                    {new Date(selectedUser.tanggalDaftar).toLocaleDateString(
                      "id-ID",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}{" "}
                    WIB
                  </p>
                </div>
              </div>

              <div className="bg-[#F8F9FA] p-5 rounded-xl border border-[#DADCE0] grid sm:grid-cols-2 gap-5">
                <div>
                  <h4 className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-widest mb-1">
                    Fakultas & Prodi
                  </h4>
                  <p className="font-bold text-slate-800 text-sm mb-0.5">
                    {selectedUser.fakultas}
                  </p>
                  <p className="font-medium text-slate-600 text-xs">
                    {selectedUser.programStudi}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-widest mb-1">
                    NIM & Angkatan
                  </h4>
                  <p className="font-bold text-slate-800 text-sm mb-0.5">
                    NIM: {selectedUser.nim}
                  </p>
                  <p className="font-medium text-slate-600 text-xs">
                    Angkatan:{" "}
                    {selectedUser.angkatan || selectedUser.tahunLulus || "-"}
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Kontak
                  </h4>
                  <p className="font-mono text-sm font-medium text-[#1E8E3E] flex items-center gap-1.5 mb-1.5">
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
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    {selectedUser.noWA}
                  </p>
                  <p className="font-mono text-sm font-medium text-[#1A73E8] flex items-center gap-1.5">
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
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Domisili & Pekerjaan
                  </h4>
                  <p className="font-medium text-slate-800 text-sm mb-1.5 flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    {selectedUser.domisili}
                  </p>

                  <p className="font-medium text-slate-600 text-[11px] mb-1.5 pl-5 italic leading-relaxed">
                    {selectedUser.alamatLengkap || "Alamat lengkap belum diisi"}
                  </p>

                  <p className="font-medium text-slate-800 text-sm flex items-center gap-1.5">
                    <svg
                      className="w-4 h-4 text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    {selectedUser.pekerjaan}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-5">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Bidang Keahlian
                  </h4>
                  <p className="font-medium text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-[#DADCE0] text-sm leading-relaxed">
                    {selectedUser.keahlian || selectedUser.bidang || "-"}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Motivasi & Harapan
                  </h4>
                  <p className="font-medium text-slate-700 bg-[#E8F0FE] p-3.5 rounded-lg border border-[#1A73E8]/20 text-sm leading-relaxed italic">
                    "{selectedUser.motto}"
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#DADCE0] bg-[#F8F9FA] shrink-0 flex gap-3 justify-end items-center">
              {/* 🔥 TOMBOL KIRIM ULANG EMAIL (HANYA MUNCUL JIKA STATUS DISETUJUI) 🔥 */}
              {selectedUser.status === "Disetujui" ? (
                <button
                  onClick={() => resendApprovedEmail(selectedUser)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded text-sm transition-colors shadow-sm flex items-center gap-2 mr-auto"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {selectedUser.nia === "Dalam Proses"
                    ? "Terbitkan E-KTA Sekarang"
                    : "Kirim Ulang Email E-KTA"}
                </button>
              ) : null}

              {selectedUser.status === "Dalam Proses" ? (
                <>
                  <button
                    onClick={() =>
                      setRejectModal({
                        isOpen: true,
                        user: selectedUser,
                        reason: "",
                      })
                    }
                    className="px-5 py-2.5 bg-white border border-[#DADCE0] hover:bg-[#FCE8E6] text-slate-600 hover:text-[#D93025] hover:border-[#FAD2CF] font-medium rounded text-sm transition-colors shadow-sm"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() =>
                      setApproveModal({ isOpen: true, user: selectedUser })
                    }
                    className="px-5 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium rounded text-sm transition-colors shadow-sm flex items-center gap-2"
                  >
                    Setujui Menjadi Anggota
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-6 py-2.5 bg-white border border-[#DADCE0] text-slate-600 hover:bg-slate-50 font-medium rounded text-sm transition-colors shadow-sm"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. MODAL KONFIRMASI APPROVE */}
      {approveModal.isOpen && approveModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center border border-[#DADCE0]">
            <div className="w-14 h-14 bg-[#E6F4EA] text-[#1E8E3E] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Setujui Anggota Baru
            </h3>

            {isProfileComplete(approveModal.user) ? (
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                Data <strong>{approveModal.user.namaLengkap}</strong> akan
                disetujui. Sistem otomatis <strong>mencetak NIA</strong> dan{" "}
                <strong>mengirim E-KTA</strong> ke emailnya.
              </p>
            ) : (
              <div className="mb-5 mt-2 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-700 text-xs font-medium text-left">
                ⚠️ Pendaftar ini belum melengkapi foto/domisili. <br />
                <br />
                Data akan disetujui dan masuk tab Disetujui, namun NIA akan
                berstatus <b>"Dalam Proses"</b> dan E-KTA tidak akan dikirim
                otomatis.
              </div>
            )}

            <div className="flex gap-3 justify-center border-t border-[#DADCE0] pt-5 mt-2">
              <button
                onClick={() => setApproveModal({ isOpen: false, user: null })}
                disabled={isProcessing}
                className="px-4 py-2 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full"
              >
                Batal
              </button>
              <button
                onClick={executeApprove}
                disabled={isProcessing}
                className="px-4 py-2 rounded text-sm font-medium text-white bg-[#1A73E8] hover:bg-[#1557B0] transition-colors w-full shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isProcessing ? "Memproses..." : "Ya, Setujui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODAL KONFIRMASI REJECT */}
      {rejectModal.isOpen && rejectModal.user && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-[#DADCE0]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#FCE8E6] text-[#D93025] rounded-full flex items-center justify-center shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-800 leading-tight">
                  Tolak Pendaftaran
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {rejectModal.user.namaLengkap}
                </p>
              </div>
            </div>
            <form onSubmit={executeReject}>
              <div className="mb-6 mt-4">
                <label className="block text-xs font-bold text-slate-600 mb-2 uppercase tracking-wider">
                  Alasan Penolakan <span className="text-[#D93025]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Cth: NIM tidak valid / Bukan alumni UII..."
                  value={rejectModal.reason}
                  onChange={(e) =>
                    setRejectModal({ ...rejectModal, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-[#DADCE0] rounded focus:border-[#D93025] focus:ring-1 focus:ring-[#D93025]/30 outline-none text-sm resize-none"
                />
                <p className="text-[10px] text-slate-400 mt-1.5 italic">
                  Alasan ini akan dilampirkan secara otomatis ke dalam Email
                  pemberitahuan pendaftar.
                </p>
              </div>
              <div className="flex gap-3 justify-end border-t border-[#DADCE0] pt-4">
                <button
                  type="button"
                  onClick={() =>
                    setRejectModal({ isOpen: false, user: null, reason: "" })
                  }
                  disabled={isProcessing}
                  className="px-4 py-2 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !rejectModal.reason.trim()}
                  className="px-5 py-2 rounded text-sm font-medium text-white bg-[#D93025] hover:bg-[#b52a1f] transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? "Memproses..." : "Tolak Pendaftar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL KONFIRMASI HAPUS (Single/Bulk) */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center border border-[#DADCE0]">
            <div className="w-14 h-14 bg-[#FCE8E6] text-[#D93025] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-7 h-7"
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
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">
              Hapus Permanen?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Yakin ingin menghapus <strong>{deleteModal.title}</strong>? Data
              yang dihapus tidak dapat dikembalikan.
            </p>
            <div className="flex gap-3 justify-center border-t border-[#DADCE0] pt-5 mt-2">
              <button
                onClick={() =>
                  setDeleteModal({
                    isOpen: false,
                    type: "single",
                    id: "",
                    title: "",
                  })
                }
                disabled={isProcessing}
                className="px-4 py-2 rounded text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full"
              >
                Batal
              </button>
              <button
                onClick={executeDelete}
                disabled={isProcessing}
                className="px-4 py-2 rounded text-sm font-medium text-white bg-[#D93025] hover:bg-[#b52a1f] transition-colors w-full shadow-sm"
              >
                {isProcessing ? "Proses..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Style */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `,
        }}
      />
    </div>
  );
}
