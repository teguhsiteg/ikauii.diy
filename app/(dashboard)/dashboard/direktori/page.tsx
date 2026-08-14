"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import * as XLSX from "xlsx";
import { sendEmailAction } from "@/app/actions/email";


const KATEGORI_LIST = [
  "Kuliner",
  "Teknologi",
  "Jasa",
  "Retail",
  "Kesehatan",
  "Pendidikan",
  "Properti",
  "Lainnya",
];

export default function AdminDirektoriPage() {
  const [activeTab, setActiveTab] = useState<
    "antrean" | "master" | "iklan" | "merch"
  >("antrean");

  const [bisnisList, setBisnisList] = useState<any[]>([]);
  const [iklanList, setIklanList] = useState<any[]>([]);
  const [usulanMerchList, setUsulanMerchList] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingMail, setIsSendingMail] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState("");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm" | "prompt";
    title: string;
    message: string;
    onConfirm?: (inputValue?: string) => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
  });

  const [isBisnisModalOpen, setIsBisnisModalOpen] = useState(false);
  const [isIklanModalOpen, setIsIklanModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "review">("add");
  const [iklanModalMode, setIklanModalMode] = useState<
    "add" | "edit" | "review"
  >("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    namaAlumni: "",
    email: "",
    fakultasAngkatan: "",
    prodi: "",
    namaBisnis: "",
    kategori: "Kuliner",
    kategoriLainnya: "",
    deskripsi: "",
    alamatUsaha: "",
    fasilitas: "",
    waBisnis: "",
    linkBisnis: "",
    foto: "",
    status: "Pending",
  });

  const [iklanData, setIklanData] = useState({
    namaSponsor: "",
    emailSponsor: "",
    noWA: "",
    fotoUrl: "",
    linkTujuan: "",
    tanggalBerakhir: "",
    isActive: true,
    status: "Pending",
  });

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showAlert = (title: string, message: string) =>
    setDialog({ isOpen: true, type: "alert", title, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setDialog({ isOpen: true, type: "confirm", title, message, onConfirm });
  const showPrompt = (
    title: string,
    message: string,
    onConfirm: (val?: string) => void,
  ) => setDialog({ isOpen: true, type: "prompt", title, message, onConfirm });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Bisnis Master & Pending
      const qBisnis = query(
        collection(db, "direktori_bisnis"),
        orderBy("createdAt", "desc"),
      );
      const snapBisnis = await getDocs(qBisnis);
      const dataBisnis = snapBisnis.docs.map((d) => ({
        id: d.id,
        isPendingCol: false,
        ...d.data(),
      }));

      const qPendaftaran = query(
        collection(db, "pendaftaran_bisnis"),
        orderBy("createdAt", "desc"),
      );
      const snapPendaftaran = await getDocs(qPendaftaran);
      const dataPendaftaran = snapPendaftaran.docs.map((d) => ({
        id: d.id,
        isPendingCol: true,
        ...d.data(),
      }));

      const combinedBisnis = [...dataPendaftaran, ...dataBisnis].sort(
        (a: any, b: any) => {
          const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return dateB - dateA;
        },
      );
      setBisnisList(combinedBisnis);

      // 2. Fetch Iklan Master & Pending
      const qIklan = query(
        collection(db, "iklan_direktori"),
        orderBy("createdAt", "desc"),
      );
      const snapIklan = await getDocs(qIklan);
      const dataIklanLive = snapIklan.docs.map((d) => ({
        id: d.id,
        isPendingCol: false,
        ...d.data(),
      }));

      let dataIklanPending: any[] = [];
      try {
        const qIklanPending = query(
          collection(db, "pendaftaran_iklan"),
          orderBy("createdAt", "desc"),
        );
        const snapIklanPending = await getDocs(qIklanPending);
        dataIklanPending = snapIklanPending.docs.map((d) => ({
          id: d.id,
          isPendingCol: true,
          ...d.data(),
        }));
      } catch (e) {
        console.warn("Koleksi pendaftaran_iklan belum tersedia.");
      }

      const combinedIklan = [...dataIklanPending, ...dataIklanLive].sort(
        (a, b) => {
          const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return dateB - dateA;
        },
      );
      setIklanList(combinedIklan);

      // 3. Fetch Usulan Merch
      try {
        const qMerch = query(
          collection(db, "usulan_merch"),
          orderBy("createdAt", "desc"),
        );
        const snapMerch = await getDocs(qMerch);
        setUsulanMerchList(
          snapMerch.docs.map((d) => ({ id: d.id, ...d.data() })),
        );
      } catch (e) {
        console.warn("Koleksi usulan_merch belum tersedia.");
      }
    } catch (error) {
      console.error("Gagal memuat data:", error);
      showAlert("Kesalahan Sistem", "Gagal memuat data dari database.");
    } finally {
      setIsLoading(false);
      setSelectedIds([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const pendingList = bisnisList.filter((b) => b.isPendingCol);
  const masterList = bisnisList.filter((b) => !b.isPendingCol);

  const pendingIklanList = iklanList.filter((i) => i.isPendingCol);
  const masterIklanList = iklanList.filter((i) => !i.isPendingCol);

  const handleTabChange = (tab: "antrean" | "master" | "iklan" | "merch") => {
    setActiveTab(tab);
    setSelectedIds([]);
  };

  const handleSelectAll = (
    e: React.ChangeEvent<HTMLInputElement>,
    list: any[],
  ) => {
    if (e.target.checked) setSelectedIds(list.map((item) => item.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (
    e: React.ChangeEvent<HTMLInputElement>,
    id: string,
  ) => {
    if (e.target.checked) setSelectedIds((prev) => [...prev, id]);
    else setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleImageUpload = async (e: any, type: "bisnis" | "iklan") => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress("Mengunggah...");
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "bisnis");
    data.append("cloud_name", "dp8hmxuix");

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload`,
        {
          method: "POST",
          body: data,
        },
      );
      const json = await res.json();
      if (type === "bisnis")
        setFormData({ ...formData, foto: json.secure_url });
      if (type === "iklan")
        setIklanData({ ...iklanData, fotoUrl: json.secure_url });
      setUploadProgress("Unggah sukses!");
      setTimeout(() => setUploadProgress(""), 3000);
    } catch (error) {
      setUploadProgress("Gagal mengunggah.");
    }
  };

  const sendEmailAPI = async (
    type: string,
    email: string,
    nama: string,
    detail: any,
  ) => {
    try {
      const res = await sendEmailAction({ type, email, nama, detail });
      if (!res.success) return false;
      return true;
    } catch (error) {
      return false;
    }
  };

  // --- LOGIKA BISNIS ---
  const openBisnisModal = (
    mode: "add" | "edit" | "review",
    data: any = null,
  ) => {
    setModalMode(mode);
    if (data) {
      setSelectedId(data.id);
      let cat = data.kategori || "Kuliner";
      let catLainnya = "";
      if (data.kategori && !KATEGORI_LIST.includes(data.kategori)) {
        cat = "Lainnya";
        catLainnya = data.kategori;
      }
      setFormData({
        namaAlumni: data.namaAlumni || data.owner || "",
        email: data.email || data.emailPemilik || "",
        fakultasAngkatan: data.fakultasAngkatan || "",
        prodi: data.prodi || "",
        namaBisnis: data.namaBisnis || data.nama || "",
        kategori: cat,
        kategoriLainnya: catLainnya,
        deskripsi: data.deskripsi || "",
        alamatUsaha: data.alamatUsaha || "",
        fasilitas: data.fasilitas || "",
        waBisnis: data.waBisnis || data.noWA || data.wa || "",
        linkBisnis: data.linkBisnis || "",
        foto: data.foto || data.fotoUrl || "",
        status: data.status || "Pending",
      });
    } else {
      setSelectedId(null);
      setFormData({
        namaAlumni: "",
        email: "",
        fakultasAngkatan: "",
        prodi: "",
        namaBisnis: "",
        kategori: "Kuliner",
        kategoriLainnya: "",
        deskripsi: "",
        alamatUsaha: "",
        fasilitas: "",
        waBisnis: "",
        linkBisnis: "",
        foto: "",
        status: "Approved",
      });
    }
    setIsBisnisModalOpen(true);
  };

  const handleSaveBisnis = async (e: React.FormEvent, forceStatus?: string) => {
    e.preventDefault();
    setIsSaving(true);
    const finalStatus = forceStatus || formData.status;
    const finalKategori =
      formData.kategori === "Lainnya"
        ? formData.kategoriLainnya
        : formData.kategori;
    const payload = {
      ...formData,
      kategori: finalKategori,
      status: finalStatus,
    };

    try {
      let finalId = selectedId;
      if (modalMode === "add") {
        await addDoc(collection(db, "direktori_bisnis"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showAlert("Berhasil", "Data bisnis baru berhasil ditambahkan.");
      } else if (selectedId) {
        const currentData = bisnisList.find((b) => b.id === selectedId);
        if (currentData?.isPendingCol && forceStatus === "Approved") {
          const newDocRef = await addDoc(collection(db, "direktori_bisnis"), {
            ...payload,
            createdAt: serverTimestamp(),
          });
          finalId = newDocRef.id;
          await deleteDoc(doc(db, "pendaftaran_bisnis", selectedId));
        } else if (currentData?.isPendingCol) {
          await updateDoc(doc(db, "pendaftaran_bisnis", selectedId), {
            ...payload,
          });
        } else {
          await updateDoc(doc(db, "direktori_bisnis", selectedId), {
            ...payload,
          });
        }

        if (forceStatus === "Approved") {
          const emailSuccess = await sendEmailAPI(
            "approve_bisnis",
            formData.email,
            formData.namaAlumni,
            { id: finalId, namaBisnis: formData.namaBisnis },
          );
          await updateDoc(doc(db, "direktori_bisnis", finalId!), {
            emailSent: emailSuccess,
          });
          if (emailSuccess) {
            showAlert(
              "Disetujui",
              "Bisnis berhasil ditayangkan dan email notifikasi telah terkirim.",
            );
          } else {
            showAlert(
              "Peringatan Sistem",
              "Bisnis ditayangkan, NAMUN gagal mengirim email. Tombol 'Kirim Ulang' diaktifkan di menu Edit.",
            );
          }
        } else if (!forceStatus) {
          showAlert("Berhasil", "Data bisnis berhasil diperbarui.");
        }
      }
      setIsBisnisModalOpen(false);
      fetchData();
    } catch (error) {
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectBisnis = () => {
    showPrompt(
      "Tolak Pendaftaran",
      "Masukkan alasan penolakan (akan dikirim ke email pendaftar):",
      async (alasan) => {
        if (!alasan) return;
        closeDialog();
        setIsSaving(true);
        try {
          const currentData = bisnisList.find((b) => b.id === selectedId);
          const payload = {
            ...formData,
            status: "Ditolak",
            alasanPenolakan: alasan,
          };
          let targetId = selectedId!;

          if (currentData?.isPendingCol) {
            const newRef = await addDoc(collection(db, "direktori_bisnis"), {
              ...payload,
              createdAt: serverTimestamp(),
            });
            targetId = newRef.id;
            await deleteDoc(doc(db, "pendaftaran_bisnis", selectedId!));
          } else {
            await updateDoc(doc(db, "direktori_bisnis", selectedId!), payload);
          }

          const emailSuccess = await sendEmailAPI(
            "reject_bisnis",
            formData.email,
            formData.namaAlumni,
            { namaBisnis: formData.namaBisnis, alasan },
          );
          await updateDoc(doc(db, "direktori_bisnis", targetId), {
            emailSent: emailSuccess,
          });

          setIsBisnisModalOpen(false);
          fetchData();
          setTimeout(() => {
            if (emailSuccess)
              showAlert(
                "Ditolak",
                "Pendaftaran ditolak dan email pemberitahuan dikirim.",
              );
            else
              showAlert(
                "Peringatan Sistem",
                "Pendaftaran ditolak, NAMUN gagal mengirim email penolakan.",
              );
          }, 300);
        } catch (error) {
          showAlert("Gagal", "Terjadi kesalahan sistem.");
        } finally {
          setIsSaving(false);
        }
      },
    );
  };

  const handleResendBisnisEmail = async (b: any) => {
    showConfirm(
      "Kirim Ulang Notifikasi",
      `Kirim ulang email notifikasi (${b.status === "Approved" ? "Disetujui" : "Ditolak"}) ke ${b.email || b.emailPemilik}?`,
      async () => {
        closeDialog();
        setIsSendingMail(b.id);
        try {
          let emailSuccess = false;
          if (b.status === "Approved") {
            emailSuccess = await sendEmailAPI(
              "approve_bisnis",
              b.email || b.emailPemilik,
              b.namaAlumni || b.owner,
              { id: b.id, namaBisnis: b.namaBisnis || b.nama },
            );
          } else if (b.status === "Ditolak") {
            emailSuccess = await sendEmailAPI(
              "reject_bisnis",
              b.email || b.emailPemilik,
              b.namaAlumni || b.owner,
              {
                namaBisnis: b.namaBisnis || b.nama,
                alasan: b.alasanPenolakan || "Tidak memenuhi kriteria.",
              },
            );
          }

          if (emailSuccess) {
            await updateDoc(doc(db, "direktori_bisnis", b.id), {
              emailSent: true,
            });
            fetchData();
            setTimeout(
              () =>
                showAlert(
                  "Terkirim",
                  "Email notifikasi berhasil dikirim ulang!",
                ),
              300,
            );
          } else {
            showAlert(
              "Gagal Mengirim",
              "Sistem server menolak pengiriman email.",
            );
          }
        } catch (error) {
          showAlert(
            "Kesalahan",
            "Terjadi kesalahan sistem saat mengirim email.",
          );
        } finally {
          setIsSendingMail(null);
        }
      },
    );
  };

  const handleDeleteBisnis = (id: string, nama: string) => {
    showConfirm(
      "Hapus Permanen",
      `Yakin ingin menghapus data bisnis "${nama}"?`,
      async () => {
        closeDialog();
        try {
          const currentData = bisnisList.find((b) => b.id === id);
          await deleteDoc(
            doc(
              db,
              currentData?.isPendingCol
                ? "pendaftaran_bisnis"
                : "direktori_bisnis",
              id,
            ),
          );
          fetchData();
        } catch (error) {
          showAlert("Gagal", "Terjadi kesalahan saat menghapus data.");
        }
      },
    );
  };

  const handleBulkDeleteBisnis = () => {
    showConfirm(
      "Hapus Terpilih",
      `Yakin menghapus ${selectedIds.length} data bisnis terpilih?`,
      async () => {
        closeDialog();
        setIsSaving(true);
        try {
          await Promise.all(
            selectedIds.map((id) => {
              const currentData = bisnisList.find((b) => b.id === id);
              return deleteDoc(
                doc(
                  db,
                  currentData?.isPendingCol
                    ? "pendaftaran_bisnis"
                    : "direktori_bisnis",
                  id,
                ),
              );
            }),
          );
          setSelectedIds([]);
          fetchData();
          setTimeout(
            () =>
              showAlert("Berhasil", "Data bisnis terpilih berhasil dihapus."),
            300,
          );
        } catch (error) {
          showAlert("Gagal", "Terjadi kesalahan saat menghapus data massal.");
        } finally {
          setIsSaving(false);
        }
      },
    );
  };

  const handleExportExcel = () => {
    const dataExport = masterList.map((d, i) => ({
      No: i + 1,
      "Nama Bisnis": d.namaBisnis || d.nama,
      Kategori: d.kategori,
      "Pemilik (Alumni)": d.namaAlumni || d.owner,
      Email: d.email || d.emailPemilik,
      "No. WhatsApp": d.waBisnis || d.noWA || d.wa,
      "Fakultas/Angkatan": d.fakultasAngkatan,
      Prodi: d.prodi,
      Alamat: d.alamatUsaha,
      Fasilitas: d.fasilitas,
      Status: d.status,
    }));
    const ws = XLSX.utils.json_to_sheet(dataExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Direktori_Live");
    XLSX.writeFile(wb, "Data_Direktori_Bisnis_IKA_UII.xlsx");
  };

  // --- LOGIKA IKLAN ---
  const openIklanModal = (
    mode: "add" | "edit" | "review" = "add",
    data: any = null,
  ) => {
    setIklanModalMode(mode);
    if (data) {
      setSelectedId(data.id);
      setIklanData({
        namaSponsor: data.namaSponsor || "",
        emailSponsor: data.emailSponsor || "",
        noWA: data.noWA || "",
        fotoUrl: data.fotoUrl || "",
        linkTujuan: data.linkTujuan || "",
        tanggalBerakhir: data.tanggalBerakhir || "",
        isActive: data.isActive ?? true,
        status: data.status || "Pending",
      });
    } else {
      setSelectedId(null);
      setIklanData({
        namaSponsor: "",
        emailSponsor: "",
        noWA: "",
        fotoUrl: "",
        linkTujuan: "",
        tanggalBerakhir: "",
        isActive: true,
        status: "Approved",
      });
    }
    setIsIklanModalOpen(true);
  };

  const handleSaveIklan = async (e: React.FormEvent, forceStatus?: string) => {
    e.preventDefault();
    setIsSaving(true);
    const finalStatus = forceStatus || iklanData.status || "Approved";
    const payload = {
      ...iklanData,
      status: finalStatus,
      isActive: finalStatus === "Approved",
    };

    try {
      if (iklanModalMode === "add") {
        await addDoc(collection(db, "iklan_direktori"), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        showAlert("Berhasil", "Data banner iklan baru berhasil ditambahkan.");
      } else if (selectedId) {
        const currentData = iklanList.find((i) => i.id === selectedId);

        if (currentData?.isPendingCol && forceStatus === "Approved") {
          await addDoc(collection(db, "iklan_direktori"), {
            ...payload,
            createdAt: serverTimestamp(),
          });
          await deleteDoc(doc(db, "pendaftaran_iklan", selectedId));
          showAlert(
            "Disetujui",
            "Permohonan iklan berhasil disetujui dan dipindah ke daftar aktif.",
          );
        } else if (currentData?.isPendingCol) {
          await updateDoc(doc(db, "pendaftaran_iklan", selectedId), payload);
          showAlert("Berhasil", "Data permohonan berhasil diperbarui.");
        } else {
          await updateDoc(doc(db, "iklan_direktori", selectedId), payload);
          showAlert("Berhasil", "Data banner iklan berhasil diperbarui.");
        }
      }
      setIsIklanModalOpen(false);
      fetchData();
    } catch (error) {
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan banner.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectIklan = () => {
    showPrompt(
      "Tolak Permohonan Iklan",
      "Masukkan alasan penolakan untuk pengiklan:",
      async (alasan) => {
        if (!alasan) return;
        closeDialog();
        setIsSaving(true);
        try {
          const currentData = iklanList.find((i) => i.id === selectedId);
          const payload = {
            ...iklanData,
            status: "Ditolak",
            alasanPenolakan: alasan,
          };

          if (currentData?.isPendingCol) {
            await addDoc(collection(db, "iklan_direktori"), {
              ...payload,
              createdAt: serverTimestamp(),
            });
            await deleteDoc(doc(db, "pendaftaran_iklan", selectedId!));
          } else {
            await updateDoc(doc(db, "iklan_direktori", selectedId!), payload);
          }
          setIsIklanModalOpen(false);
          fetchData();
          setTimeout(
            () =>
              showAlert(
                "Ditolak",
                "Permohonan iklan telah ditolak dan diarsipkan.",
              ),
            300,
          );
        } catch (error) {
          showAlert("Gagal", "Terjadi kesalahan sistem.");
        } finally {
          setIsSaving(false);
        }
      },
    );
  };

  const handleSendIklanEmail = async (iklan: any) => {
    showConfirm(
      "Kirim Bukti Tayang",
      `Email pemberitahuan akan dikirim ke ${iklan.emailSponsor}. Lanjutkan?`,
      async () => {
        closeDialog();
        setIsSendingMail(iklan.id);
        try {
          const emailSuccess = await sendEmailAPI(
            "iklan_tayang",
            iklan.emailSponsor,
            iklan.namaSponsor,
            { tanggalBerakhir: iklan.tanggalBerakhir },
          );
          if (emailSuccess) {
            await updateDoc(doc(db, "iklan_direktori", iklan.id), {
              emailSent: true,
            });
            fetchData();
            setTimeout(
              () =>
                showAlert(
                  "Terkirim",
                  "Email bukti tayang berhasil dikirim ke sponsor.",
                ),
              300,
            );
          } else {
            showAlert(
              "Gagal Mengirim",
              "Sistem server menolak pengiriman email. Cek kredensial SMTP Anda.",
            );
          }
        } catch (error) {
          showAlert(
            "Gagal",
            "Sistem gagal mengeksekusi proses pengiriman email.",
          );
        } finally {
          setIsSendingMail(null);
        }
      },
    );
  };

  const toggleIklanStatus = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "iklan_direktori", id), {
      isActive: !currentStatus,
    });
    fetchData();
  };

  const handleDeleteIklan = (id: string) => {
    showConfirm(
      "Hapus Banner",
      "Yakin ingin menghapus banner iklan ini secara permanen?",
      async () => {
        closeDialog();
        const currentData = iklanList.find((i) => i.id === id);
        await deleteDoc(
          doc(
            db,
            currentData?.isPendingCol ? "pendaftaran_iklan" : "iklan_direktori",
            id,
          ),
        );
        fetchData();
      },
    );
  };

  // --- LOGIKA MERCHANDISE ---
  const handleUpdateStatusMerch = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "usulan_merch", id), { status: newStatus });
      fetchData();
    } catch (error) {
      showAlert("Gagal", "Terjadi kesalahan saat mengupdate status usulan.");
    }
  };

  const handleDeleteMerch = (id: string) => {
    showConfirm(
      "Hapus Usulan",
      "Yakin ingin menghapus usulan merchandise ini?",
      async () => {
        closeDialog();
        try {
          await deleteDoc(doc(db, "usulan_merch", id));
          fetchData();
        } catch (error) {
          showAlert("Gagal", "Gagal menghapus data usulan.");
        }
      },
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12 font-sans text-[#202124]">
      {/* CUSTOM DIALOG */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl flex flex-col overflow-hidden border border-[#DADCE0] animate-in zoom-in-95">
            <div className="px-6 py-5">
              <h2
                className={`text-lg font-medium mb-2 ${dialog.title.includes("Gagal") || dialog.title.includes("Tolak") || dialog.title.includes("Hapus") || dialog.title.includes("Peringatan") ? "text-[#D93025]" : "text-[#1A73E8]"}`}
              >
                {dialog.title}
              </h2>
              <p className="text-sm text-[#5F6368] leading-relaxed">
                {dialog.message}
              </p>
              {dialog.type === "prompt" && (
                <textarea
                  id="promptInput"
                  rows={3}
                  className="w-full mt-3 px-3 py-2 border border-[#DADCE0] rounded focus:border-[#D93025] outline-none text-sm resize-none"
                  placeholder="Ketik alasan penolakan..."
                ></textarea>
              )}
            </div>
            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex justify-end gap-3">
              {(dialog.type === "confirm" || dialog.type === "prompt") && (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-[#E8EAED] rounded transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  if (dialog.type === "prompt" && dialog.onConfirm) {
                    const val = (
                      document.getElementById(
                        "promptInput",
                      ) as HTMLTextAreaElement
                    ).value;
                    dialog.onConfirm(val);
                  } else if (dialog.type === "confirm" && dialog.onConfirm) {
                    dialog.onConfirm();
                  } else {
                    closeDialog();
                  }
                }}
                className={`px-5 py-2 text-sm font-medium text-white rounded transition-colors shadow-sm ${dialog.title.includes("Hapus") || dialog.title.includes("Tolak") ? "bg-[#D93025] hover:bg-[#b52a1f]" : "bg-[#1A73E8] hover:bg-[#1557B0]"}`}
              >
                {dialog.type === "confirm" || dialog.type === "prompt"
                  ? dialog.title.includes("Hapus") ||
                    dialog.title.includes("Tolak")
                    ? "Lanjutkan"
                    : "Ya, Lanjutkan"
                  : "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-medium text-[#202124] mb-1 tracking-tight">
              Manajemen Direktori & Iklan
            </h1>
            <p className="text-[#5F6368] text-sm">
              Kelola pendaftaran bisnis, Banner Iklan, dan Usulan Merchandise
              Alumni.
            </p>
          </div>
        </div>

        {/* WORKSPACE TABS NAVIGATION */}
        <div className="flex border-b border-[#DADCE0] mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleTabChange("antrean")}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === "antrean" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-[#5F6368] hover:text-[#202124] hover:bg-slate-50"}`}
          >
            Antrean Pendaftar
            <span className="ml-2 bg-[#D93025] text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {pendingList.length}
            </span>
          </button>
          <button
            onClick={() => handleTabChange("master")}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === "master" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-[#5F6368] hover:text-[#202124] hover:bg-slate-50"}`}
          >
            Master Data (Live)
          </button>
          <button
            onClick={() => handleTabChange("iklan")}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === "iklan" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-[#5F6368] hover:text-[#202124] hover:bg-slate-50"}`}
          >
            Kelola Banner Iklan
            {pendingIklanList.length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingIklanList.length}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("merch")}
            className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${activeTab === "merch" ? "border-[#1A73E8] text-[#1A73E8]" : "border-transparent text-[#5F6368] hover:text-[#202124] hover:bg-slate-50"}`}
          >
            Usulan Merch
            {usulanMerchList.filter((m) => m.status === "Baru").length > 0 && (
              <span className="ml-2 bg-yellow-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {usulanMerchList.filter((m) => m.status === "Baru").length}
              </span>
            )}
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-[#E8F0FE] border-t-[#1A73E8] rounded-full animate-spin"></div>
          </div>
        )}

        {/* TAB 1: ANTREAN PENDAFTAR (BISNIS) */}
        {!isLoading && activeTab === "antrean" && (
          <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-[#DADCE0] bg-[#F8F9FA] flex justify-between items-center">
              <h2 className="font-medium text-[13px] text-[#5F6368] uppercase tracking-wider">
                Menunggu Verifikasi Admin
              </h2>
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDeleteBisnis}
                  className="bg-white border border-[#FCE8E6] text-[#D93025] hover:bg-[#FCE8E6] px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Hapus Terpilih ({selectedIds.length})
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#DADCE0] text-[#5F6368] bg-white">
                  <tr>
                    <th className="px-6 py-3 w-10 text-center border-r border-[#DADCE0]">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e, pendingList)}
                        checked={
                          pendingList.length > 0 &&
                          selectedIds.length === pendingList.length
                        }
                        className="rounded border-[#DADCE0] text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 font-medium w-1/3">
                      Informasi Bisnis
                    </th>
                    <th className="px-6 py-3 font-medium w-1/3">
                      Data Pendaftar
                    </th>
                    <th className="px-6 py-3 font-medium text-center">
                      Status
                    </th>
                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]">
                  {pendingList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-[#9AA0A6]"
                      >
                        Tidak ada pendaftar baru.
                      </td>
                    </tr>
                  ) : (
                    pendingList.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-[#F8F9FA] transition-colors"
                      >
                        <td className="px-6 py-4 text-center border-r border-slate-50 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(b.id)}
                            onChange={(e) => handleSelectOne(e, b.id)}
                            className="rounded border-[#DADCE0] text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="font-bold text-[#1A73E8] mb-1">
                            {b.namaBisnis}
                          </p>
                          <span className="text-[10px] bg-[#E8F0FE] text-[#1A73E8] px-2 py-0.5 rounded border border-[#1A73E8]/20">
                            {b.kategori}
                          </span>
                          <p className="text-xs text-[#5F6368] mt-2 line-clamp-2">
                            {b.deskripsi}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="font-bold text-[#202124]">
                            {b.namaAlumni || b.owner}
                          </p>
                          <p className="text-xs text-[#5F6368] font-mono mb-1">
                            {b.emailPemilik || b.email}
                          </p>
                          <p className="text-[11px] text-[#5F6368]">
                            WA: {b.noWA || b.waBisnis}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <span className="text-[10px] font-bold bg-[#FEF7E0] text-[#B06000] border border-[#FCE8B2] px-2.5 py-1 rounded">
                            PENDING
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right align-middle">
                          <button
                            onClick={() => openBisnisModal("review", b)}
                            className="bg-white border border-[#DADCE0] hover:bg-[#E8F0FE] hover:text-[#1A73E8] text-[#5F6368] px-4 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            Review & Eksekusi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: MASTER DATA BISNIS */}
        {!isLoading && activeTab === "master" && (
          <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-[#DADCE0] bg-[#F8F9FA] flex justify-between items-center">
              <h2 className="font-medium text-[13px] text-[#5F6368] uppercase tracking-wider">
                Database Bisnis Publik
              </h2>
              <div className="flex gap-2 items-center">
                {selectedIds.length > 0 && (
                  <button
                    onClick={handleBulkDeleteBisnis}
                    className="bg-white border border-[#FCE8E6] text-[#D93025] hover:bg-[#FCE8E6] px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors shadow-sm mr-2"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>{" "}
                    Hapus ({selectedIds.length})
                  </button>
                )}
                <button
                  onClick={handleExportExcel}
                  className="bg-white border border-[#DADCE0] hover:bg-[#E6F4EA] text-[#1E8E3E] px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>{" "}
                  Unduh Excel
                </button>
                <button
                  onClick={() => openBisnisModal("add")}
                  className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>{" "}
                  Tambah Manual
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#DADCE0] text-[#5F6368] bg-white">
                  <tr>
                    <th className="px-6 py-3 w-10 text-center border-r border-[#DADCE0]">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e, masterList)}
                        checked={
                          masterList.length > 0 &&
                          selectedIds.length === masterList.length
                        }
                        className="rounded border-[#DADCE0] text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 font-medium">Bisnis</th>
                    <th className="px-6 py-3 font-medium">Pemilik</th>
                    <th className="px-6 py-3 font-medium text-center">
                      Status
                    </th>
                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]">
                  {masterList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-center py-10 text-[#9AA0A6]"
                      >
                        Belum ada data bisnis.
                      </td>
                    </tr>
                  ) : (
                    masterList.map((b) => (
                      <tr
                        key={b.id}
                        className="hover:bg-[#F8F9FA] transition-colors"
                      >
                        <td className="px-6 py-4 text-center border-r border-slate-50 align-middle">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(b.id)}
                            onChange={(e) => handleSelectOne(e, b.id)}
                            className="rounded border-[#DADCE0] text-[#1A73E8] focus:ring-[#1A73E8] cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={b.foto || b.fotoUrl || "/logo-dpp-ika.png"}
                              alt="foto"
                              className="w-10 h-10 rounded object-cover border border-[#DADCE0]"
                            />
                            <div>
                              <p className="font-bold text-[#202124]">
                                {b.namaBisnis || b.nama}
                              </p>
                              <span className="text-[10px] text-[#5F6368] uppercase">
                                {b.kategori}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-[#202124]">
                            {b.namaAlumni || b.owner}
                          </p>
                          <p className="text-[11px] text-[#5F6368]">
                            {b.noWA || b.waBisnis}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {b.status === "Ditolak" ? (
                            <span className="text-[10px] font-bold bg-[#FCE8E6] text-[#D93025] border border-[#FAD2CF] px-2 py-0.5 rounded">
                              DITOLAK
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-[#E6F4EA] text-[#1E8E3E] border border-[#CEEAD6] px-2 py-0.5 rounded">
                              LIVE
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            {b.emailSent === true && (
                              <span
                                className="text-[10px] font-bold text-[#1E8E3E] bg-[#E6F4EA] px-2 py-1 rounded flex items-center gap-1 border border-[#CEEAD6]"
                                title="Email notifikasi berhasil terkirim"
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
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>{" "}
                                Terkirim
                              </span>
                            )}
                            <button
                              onClick={() => openBisnisModal("edit", b)}
                              className="p-1.5 text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#E8F0FE] rounded transition-colors"
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
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteBisnis(b.id, b.namaBisnis)
                              }
                              className="p-1.5 text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] rounded transition-colors"
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
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: KELOLA IKLAN */}
        {!isLoading && activeTab === "iklan" && (
          <div className="space-y-6 animate-in fade-in">
            {/* Tabel Pendaftaran Iklan Baru */}
            {pendingIklanList.length > 0 && (
              <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden">
                <div className="p-4 border-b border-[#DADCE0] bg-[#FFF8E1] flex justify-between items-center">
                  <h2 className="font-medium text-[13px] text-[#E65100] uppercase tracking-wider flex items-center gap-2">
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
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    Permohonan Iklan Baru ({pendingIklanList.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#DADCE0] text-[#5F6368] bg-white">
                      <tr>
                        <th className="px-6 py-3 font-medium">Sponsor</th>
                        <th className="px-6 py-3 font-medium">Link Tujuan</th>
                        <th className="px-6 py-3 font-medium text-center">
                          Status
                        </th>
                        <th className="px-6 py-3 font-medium text-right">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DADCE0]">
                      {pendingIklanList.map((iklan) => (
                        <tr
                          key={iklan.id}
                          className="hover:bg-[#F8F9FA] transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={iklan.fotoUrl || "/logo-dpp-ika.png"}
                                alt="foto"
                                className="w-12 h-8 rounded object-cover border border-[#DADCE0]"
                              />
                              <div>
                                <p className="font-bold text-[#1A73E8]">
                                  {iklan.namaSponsor}
                                </p>
                                <p className="text-[10px] text-[#5F6368]">
                                  {iklan.emailSponsor} | {iklan.noWA}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <a
                              href={iklan.linkTujuan}
                              target="_blank"
                              className="text-[#1A73E8] hover:underline truncate max-w-[200px] block"
                            >
                              {iklan.linkTujuan}
                            </a>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-[10px] font-bold bg-[#FEF7E0] text-[#B06000] border border-[#FCE8B2] px-2.5 py-1 rounded">
                              MENUNGGU
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => openIklanModal("review", iklan)}
                              className="bg-white border border-[#DADCE0] hover:bg-[#E8F0FE] hover:text-[#1A73E8] text-[#5F6368] px-4 py-1.5 rounded text-xs font-medium transition-colors"
                            >
                              Review & Tayangkan
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Grid Master Iklan Aktif */}
            <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#DADCE0] bg-[#F8F9FA] flex justify-between items-center">
                <h2 className="font-medium text-[13px] text-[#5F6368] uppercase tracking-wider">
                  Manajemen Slider Publik
                </h2>
                <button
                  onClick={() => openIklanModal("add")}
                  className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-colors"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>{" "}
                  Tambah Banner
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {masterIklanList.length === 0 ? (
                  <div className="col-span-full text-center py-10 text-[#9AA0A6] text-sm">
                    Belum ada banner iklan yang disetujui. Slider otomatis
                    disembunyikan.
                  </div>
                ) : (
                  masterIklanList.map((iklan) => (
                    <div
                      key={iklan.id}
                      className="border border-[#DADCE0] rounded-xl overflow-hidden shadow-sm flex flex-col"
                    >
                      <div className="h-32 bg-slate-100 relative">
                        <img
                          src={iklan.fotoUrl}
                          alt="Iklan"
                          className={`w-full h-full object-cover ${!iklan.isActive ? "grayscale opacity-50" : ""}`}
                        />
                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                          {iklan.isActive ? (
                            <span className="text-[#1E8E3E]">AKTIF</span>
                          ) : (
                            <span className="text-[#D93025]">HIDDEN</span>
                          )}
                        </div>
                      </div>
                      <div className="p-4 flex-grow bg-white">
                        <p className="font-bold text-[#202124] text-sm mb-1">
                          {iklan.namaSponsor}
                        </p>
                        <p className="text-[11px] text-[#5F6368] font-mono mb-2">
                          {iklan.emailSponsor}
                        </p>
                        <p className="text-[10px] text-[#D93025] font-bold bg-[#FCE8E6] px-2 py-1 rounded inline-block">
                          Exp: {iklan.tanggalBerakhir}
                        </p>
                      </div>
                      <div className="border-t border-[#DADCE0] bg-[#F8F9FA] p-3 flex gap-2 justify-between">
                        <button
                          onClick={() =>
                            toggleIklanStatus(iklan.id, iklan.isActive)
                          }
                          className="p-1.5 text-[#5F6368] hover:bg-[#E8EAED] rounded transition-colors"
                          title="Toggle Status"
                        >
                          {iklan.isActive ? (
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4 text-[#D93025]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0a9.97 9.97 0 013.03-1.562M21.543 12c-1.274-4.057-5.064-7-9.542-7M21 21l-3.29-3.29"
                              />
                            </svg>
                          )}
                        </button>
                        <div className="flex gap-1 items-center">
                          {iklan.emailSent ? (
                            <span className="text-[10px] text-[#1E8E3E] font-bold flex items-center gap-1">
                              <svg
                                className="w-3 h-3"
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
                              </svg>{" "}
                              Terkirim
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendIklanEmail(iklan)}
                              disabled={isSendingMail === iklan.id}
                              className="text-[10px] font-bold bg-white border border-[#DADCE0] px-2 py-1 rounded text-[#5F6368] hover:text-[#1A73E8] transition-colors disabled:opacity-50"
                            >
                              {isSendingMail === iklan.id
                                ? "Sending..."
                                : "Kirim Email"}
                            </button>
                          )}
                          <button
                            onClick={() => openIklanModal("edit", iklan)}
                            className="p-1.5 text-[#5F6368] hover:bg-[#E8EAED] rounded transition-colors ml-1"
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
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteIklan(iklan.id)}
                            className="p-1.5 text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] rounded transition-colors"
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
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: USULAN MERCHANDISE */}
        {!isLoading && activeTab === "merch" && (
          <div className="bg-white rounded-xl border border-[#DADCE0] shadow-sm overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-[#DADCE0] bg-[#F8F9FA] flex justify-between items-center">
              <h2 className="font-medium text-[13px] text-[#5F6368] uppercase tracking-wider">
                Daftar Usulan Merchandise Anggota
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-[#DADCE0] text-[#5F6368] bg-white">
                  <tr>
                    <th className="px-6 py-3 font-medium w-1/5">
                      Tanggal & Pendaftar
                    </th>
                    <th className="px-6 py-3 font-medium w-2/5">
                      Usulan / Detail Ide
                    </th>
                    <th className="px-6 py-3 font-medium text-center w-1/5">
                      Update Status
                    </th>
                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]">
                  {usulanMerchList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-10 text-[#9AA0A6]"
                      >
                        Belum ada usulan merchandise masuk.
                      </td>
                    </tr>
                  ) : (
                    usulanMerchList.map((merch) => (
                      <tr
                        key={merch.id}
                        className="hover:bg-[#F8F9FA] transition-colors"
                      >
                        <td className="px-6 py-4 align-top">
                          <p className="text-[11px] text-[#5F6368] mb-1 font-mono">
                            {merch.createdAt?.toDate
                              ? merch.createdAt
                                  .toDate()
                                  .toLocaleDateString("id-ID")
                              : new Date(merch.createdAt).toLocaleDateString(
                                  "id-ID",
                                )}
                          </p>
                          <p className="font-bold text-[#202124]">
                            {merch.nama}
                          </p>
                          <p className="text-[11px] text-[#5F6368]">
                            {merch.email}
                          </p>
                        </td>
                        <td className="px-6 py-4 align-top">
                          <p className="text-[#202124] text-sm leading-relaxed whitespace-pre-wrap">
                            {merch.usulan}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-center align-top">
                          <div className="flex justify-center">
                            <select
                              value={merch.status || "Baru"}
                              onChange={async (e) => {
                                try {
                                  await updateDoc(
                                    doc(db, "usulan_merch", merch.id),
                                    { status: e.target.value },
                                  );
                                  fetchData();
                                } catch (error) {
                                  showAlert(
                                    "Gagal",
                                    "Tidak dapat mengupdate status.",
                                  );
                                }
                              }}
                              className={`text-[11px] font-bold px-2 py-1 rounded outline-none border cursor-pointer ${
                                merch.status === "Baru"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : merch.status === "Diproses"
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : merch.status === "Diterima"
                                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                      : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              <option value="Baru">🌟 Baru</option>
                              <option value="Diproses">⏳ Diproses</option>
                              <option value="Diterima">
                                ✅ Diterima (Akan Diproduksi)
                              </option>
                              <option value="Ditolak">
                                ❌ Ditolak (Arsip)
                              </option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right align-top">
                          <button
                            onClick={() => {
                              showConfirm(
                                "Hapus Usulan",
                                "Yakin ingin menghapus usulan ini secara permanen?",
                                async () => {
                                  closeDialog();
                                  await deleteDoc(
                                    doc(db, "usulan_merch", merch.id),
                                  );
                                  fetchData();
                                },
                              );
                            }}
                            className="bg-white border border-[#DADCE0] hover:bg-[#FCE8E6] text-[#D93025] px-3 py-1.5 rounded text-xs font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>{" "}
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL FORM BISNIS */}
      {isBisnisModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar border border-[#DADCE0]">
            <button
              onClick={() => setIsBisnisModalOpen(false)}
              className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-[#FCE8E6] hover:text-[#D93025] transition-colors z-10"
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
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="mb-6 mt-1 border-b border-[#DADCE0] pb-5 flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${modalMode === "review" ? "bg-[#FEF7E0] text-[#B06000]" : "bg-[#E8F0FE] text-[#1A73E8]"}`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#202124] leading-tight">
                  {modalMode === "review"
                    ? "Review Data Pendaftar"
                    : modalMode === "add"
                      ? "Tambah Bisnis Manual"
                      : "Edit Data Bisnis"}
                </h3>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  {modalMode === "review"
                    ? "Perbaiki typo / redaksi sebelum menyetujui penayangan."
                    : "Isi form di bawah ini dengan lengkap."}
                </p>
              </div>
            </div>

            <form onSubmit={(e) => handleSaveBisnis(e)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Nama Pemilik
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.namaAlumni}
                    onChange={(e) =>
                      setFormData({ ...formData, namaAlumni: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Email Aktif
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Fakultas / Angkatan
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.fakultasAngkatan}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fakultasAngkatan: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Program Studi
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.prodi}
                    onChange={(e) =>
                      setFormData({ ...formData, prodi: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="border-t border-[#DADCE0] pt-4 mt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Nama Usaha
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.namaBisnis}
                      onChange={(e) =>
                        setFormData({ ...formData, namaBisnis: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm font-bold text-[#202124] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Kategori
                    </label>
                    <select
                      required
                      value={formData.kategori}
                      onChange={(e) =>
                        setFormData({ ...formData, kategori: e.target.value })
                      }
                      className={`w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors cursor-pointer ${formData.kategori === "Lainnya" ? "mb-2" : ""}`}
                    >
                      {KATEGORI_LIST.map((kat) => (
                        <option key={kat} value={kat}>
                          {kat}
                        </option>
                      ))}
                    </select>
                    {formData.kategori === "Lainnya" && (
                      <input
                        required
                        type="text"
                        value={formData.kategoriLainnya}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kategoriLainnya: e.target.value,
                          })
                        }
                        placeholder="Ketik kategori spesifik..."
                        className="w-full px-3.5 py-2.5 bg-[#E8F0FE] border border-[#1A73E8]/30 rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors animate-in fade-in"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Alamat Lengkap Usaha
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.alamatUsaha}
                  onChange={(e) =>
                    setFormData({ ...formData, alamatUsaha: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm resize-none transition-colors"
                ></textarea>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Fasilitas Bisnis (Pemisah Koma)
                </label>
                <input
                  required
                  type="text"
                  value={formData.fasilitas}
                  onChange={(e) =>
                    setFormData({ ...formData, fasilitas: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Deskripsi Singkat
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.deskripsi}
                  onChange={(e) =>
                    setFormData({ ...formData, deskripsi: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm resize-none transition-colors"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Nomor WA
                  </label>
                  <input
                    required
                    type="tel"
                    value={formData.waBisnis}
                    onChange={(e) =>
                      setFormData({ ...formData, waBisnis: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Link Web / IG
                  </label>
                  <input
                    type="text"
                    value={formData.linkBisnis}
                    onChange={(e) =>
                      setFormData({ ...formData, linkBisnis: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>
              </div>

              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0]">
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-2">
                  Upload / Ganti Gambar
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "bisnis")}
                  className="text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#E8F0FE] file:text-[#1A73E8] cursor-pointer"
                />
                {uploadProgress && (
                  <p className="text-[10px] font-bold text-[#1A73E8] mt-2">
                    {uploadProgress}
                  </p>
                )}
                {formData.foto && (
                  <img
                    src={formData.foto}
                    alt="Preview"
                    className="h-16 mt-2 rounded border border-[#DADCE0] object-cover"
                  />
                )}
              </div>

              <div className="pt-4 mt-6 border-t border-[#DADCE0] flex gap-3 justify-end">
                {modalMode === "review" ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRejectBisnis}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-white border border-[#DADCE0] text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] font-bold rounded-lg text-sm transition-colors shadow-sm"
                    >
                      Tolak Pendaftaran
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSaveBisnis(e, "Approved")}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-[#1E8E3E] hover:bg-[#137333] text-white font-bold rounded-lg shadow-sm transition-all text-sm flex items-center gap-2"
                    >
                      {isSaving ? "Memproses..." : "Setujui & Tayangkan"}
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3 w-full">
                    {modalMode === "edit" &&
                      (formData.status === "Approved" ||
                        formData.status === "Ditolak") && (
                        <button
                          type="button"
                          onClick={() => {
                            const currentBisnis = bisnisList.find(
                              (b) => b.id === selectedId,
                            );
                            if (currentBisnis)
                              handleResendBisnisEmail(currentBisnis);
                          }}
                          disabled={isSendingMail === selectedId || isSaving}
                          className="px-5 py-2.5 bg-white border border-[#DADCE0] text-[#5F6368] hover:bg-[#E8F0FE] hover:text-[#1A73E8] font-bold rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2 w-1/2"
                        >
                          {isSendingMail === selectedId
                            ? "Mengirim..."
                            : "Kirim Ulang Email"}
                        </button>
                      )}
                    <button
                      type="submit"
                      disabled={isSaving}
                      className={`px-5 py-2.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold rounded-lg shadow-sm transition-all text-sm flex items-center justify-center gap-2 ${modalMode === "edit" && (formData.status === "Approved" || formData.status === "Ditolak") ? "w-1/2" : "w-full"}`}
                    >
                      {isSaving ? "Menyimpan..." : "Simpan Data"}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FORM IKLAN */}
      {isIklanModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative border border-[#DADCE0] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsIklanModalOpen(false)}
              className="absolute top-5 right-5 p-2 bg-slate-50 rounded-full text-slate-500 hover:bg-[#FCE8E6] hover:text-[#D93025] transition-colors z-10"
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
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="mb-6 mt-1 border-b border-[#DADCE0] pb-5 flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iklanModalMode === "review" ? "bg-[#FFF8E1] text-[#E65100]" : "bg-[#E8F0FE] text-[#1A73E8]"}`}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#202124] leading-tight">
                  {iklanModalMode === "review"
                    ? "Review Permohonan Iklan"
                    : "Form Banner Iklan"}
                </h3>
                <p className="text-xs text-[#5F6368] mt-0.5">
                  {iklanModalMode === "review"
                    ? "Tinjau dan atur masa tayang sebelum persetujuan."
                    : "Unggah foto banner untuk Slider Halaman Depan."}
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) =>
                handleSaveIklan(
                  e,
                  iklanModalMode === "review" ? "Approved" : undefined,
                )
              }
              className="space-y-4"
            >
              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Nama Sponsor / Klien
                </label>
                <input
                  required
                  type="text"
                  value={iklanData.namaSponsor}
                  onChange={(e) =>
                    setIklanData({ ...iklanData, namaSponsor: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Email Sponsor
                  </label>
                  <input
                    required
                    type="email"
                    value={iklanData.emailSponsor}
                    onChange={(e) =>
                      setIklanData({
                        ...iklanData,
                        emailSponsor: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Nomor WhatsApp
                  </label>
                  <input
                    required
                    type="tel"
                    value={iklanData.noWA}
                    onChange={(e) =>
                      setIklanData({ ...iklanData, noWA: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Link Tujuan Iklan
                </label>
                <input
                  required
                  type="url"
                  value={iklanData.linkTujuan}
                  onChange={(e) =>
                    setIklanData({ ...iklanData, linkTujuan: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Berlaku Hingga Tanggal{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  value={iklanData.tanggalBerakhir}
                  onChange={(e) =>
                    setIklanData({
                      ...iklanData,
                      tanggalBerakhir: e.target.value,
                    })
                  }
                  className={`w-full px-3.5 py-2.5 border rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors ${iklanModalMode === "review" && !iklanData.tanggalBerakhir ? "border-rose-400 bg-rose-50" : "bg-[#F8F9FA] border-[#DADCE0]"}`}
                />
                {iklanModalMode === "review" && !iklanData.tanggalBerakhir && (
                  <p className="text-[10px] text-rose-500 font-bold mt-1">
                    Harap tentukan batas tayang sebelum persetujuan.
                  </p>
                )}
              </div>

              <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0]">
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-2">
                  Upload Banner
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "iklan")}
                  className="text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#E8F0FE] file:text-[#1A73E8] cursor-pointer"
                />
                {uploadProgress && (
                  <p className="text-[10px] font-bold text-[#1A73E8] mt-2">
                    {uploadProgress}
                  </p>
                )}
                {iklanData.fotoUrl && (
                  <img
                    src={iklanData.fotoUrl}
                    alt="Preview"
                    className="h-16 mt-2 rounded border border-[#DADCE0] object-cover"
                  />
                )}
              </div>

              <div className="pt-4 mt-6 border-t border-[#DADCE0] flex gap-3 justify-end">
                {iklanModalMode === "review" ? (
                  <>
                    <button
                      type="button"
                      onClick={handleRejectIklan}
                      disabled={isSaving}
                      className="px-5 py-2.5 bg-white border border-[#DADCE0] text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] font-bold rounded-lg text-sm transition-colors shadow-sm"
                    >
                      Tolak Permohonan
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isSaving ||
                        !iklanData.fotoUrl ||
                        !iklanData.tanggalBerakhir
                      }
                      className="px-5 py-2.5 bg-[#1E8E3E] hover:bg-[#137333] text-white font-bold rounded-lg shadow-sm transition-all text-sm flex items-center gap-2"
                    >
                      {isSaving ? "Memproses..." : "Setujui & Tayangkan"}
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    disabled={isSaving || !iklanData.fotoUrl}
                    className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Banner Iklan"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
