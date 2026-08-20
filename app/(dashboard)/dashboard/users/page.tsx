"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { sendEmailAction } from "@/app/actions/email";

import {
  collection,
  query,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  addDoc,
} from "firebase/firestore";

// 🔥 DAFTAR SELURUH MODUL BERDASARKAN SIDEBAR & KEBUTUHAN WEB 🔥
const DAFTAR_MODUL_SISTEM = [
  { id: "ringkasan", label: "Ringkasan / Dashboard" },
  { id: "registri_surat", label: "Registri Surat" },
  { id: "master_organisasi", label: "Master Organisasi" },
  { id: "verifikasi_anggota", label: "Verifikasi Anggota" },
  { id: "gudang_dokumen", label: "Gudang Dokumen" },
  { id: "qr_tanda_tangan", label: "QR Tanda Tangan" },
  { id: "cetak_kuitansi", label: "Cetak Kuitansi" },
  { id: "data_pendaftar", label: "Data Pendaftar" },
  { id: "kelola_direktori", label: "Kelola Direktori" },
  { id: "program_kerja", label: "Program Kerja Bidang" },
  { id: "atur_donasi", label: "Atur Donasi Jum'at" },
  { id: "pengaturan_web", label: "Pengaturan Web (CMS)" },
  { id: "manajemen_event_run", label: "Manajemen Event Run" },
  { id: "broadcast_sistem", label: "Broadcast Email" },
];

export default function ManajemenPenggunaPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [bidangList, setBidangList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // State Modal Tambah
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    nama: "",
    email: "",
    role: "koordinator",
    bidang: "",
    aksesModul: [] as string[],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState<string | null>(null);

  // 🔥 STATE CUSTOM DIALOG 🔥
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "alert",
    title: "",
    message: "",
  });

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showAlert = (title: string, message: string) =>
    setDialog({ isOpen: true, type: "alert", title, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void) =>
    setDialog({ isOpen: true, type: "confirm", title, message, onConfirm });

  // 1. CEK HAK AKSES (Hanya Super Admin)
  useEffect(() => {
    const checkAccess = async () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data().role === "super_admin") {
              setHasAccess(true);
            } else {
              setHasAccess(false);
            }
          } catch {
            setHasAccess(false);
          }
        } else {
          setHasAccess(false);
        }
      });
      return () => unsubscribe();
    };
    checkAccess();
  }, []);

  // 2. FETCH DATA USERS & BIDANG
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const snapUsers = await getDocs(collection(db, "users"));
      const rawUsers = snapUsers.docs.map((d) => ({ id: d.id, ...d.data() }));

      rawUsers.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setUsersList(rawUsers);

      const qBidang = query(
        collection(db, "bidang"),
        orderBy("namaBidang", "asc"),
      );
      const snapBidang = await getDocs(qBidang);
      const rawBidang = snapBidang.docs.map((d) => ({ id: d.id, ...d.data() }));
      const uniqueBidang = Array.from(
        new Map(rawBidang.map((item: any) => [item.namaBidang, item])).values(),
      );
      setBidangList(uniqueBidang);
    } catch (error) {
      console.error("Gagal load data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAccess) fetchData();
  }, [hasAccess]);

  // 🔥 FUNGSI TOGGLE ON/OFF MODUL 🔥
  const toggleModulAkses = (modulId: string, isEditMode: boolean) => {
    if (isEditMode && selectedUser) {
      setSelectedUser((prev: any) => {
        const currentAkses = prev.aksesModul || [];
        const isCurrentlyActive = currentAkses.includes(modulId);
        return {
          ...prev,
          aksesModul: isCurrentlyActive
            ? currentAkses.filter((id: string) => id !== modulId)
            : [...currentAkses, modulId],
        };
      });
    } else {
      setNewUser((prev) => {
        const currentAkses = prev.aksesModul || [];
        const isCurrentlyActive = currentAkses.includes(modulId);
        return {
          ...prev,
          aksesModul: isCurrentlyActive
            ? currentAkses.filter((id: string) => id !== modulId)
            : [...currentAkses, modulId],
        };
      });
    }
  };

  // 3. FUNGSI EDIT USER
  const handleEditClick = (user: any) => {
    setSelectedUser({
      ...user,
      aksesModul: user.aksesModul || [],
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        nama: selectedUser.nama,
        role: selectedUser.role,
        bidang: selectedUser.bidang,
        aksesModul:
          selectedUser.role === "super_admin" ? [] : selectedUser.aksesModul,
      });
      setIsEditModalOpen(false);
      fetchData();
      setTimeout(
        () =>
          showAlert(
            "Berhasil",
            "Profil dan hak akses pengguna berhasil diperbarui.",
          ),
        300,
      );
    } catch {
      showAlert(
        "Gagal Menyimpan",
        "Terjadi kesalahan sistem saat memperbarui data pengguna.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 4. FUNGSI TAMBAH USER
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addDoc(collection(db, "users"), {
        ...newUser,
        aksesModul: newUser.role === "super_admin" ? [] : newUser.aksesModul,
        createdAt: new Date().toISOString(),
        lastLogin: null,
        lastLogout: null,
      });
      setIsAddModalOpen(false);
      setNewUser({
        nama: "",
        email: "",
        role: "koordinator",
        bidang: "",
        aksesModul: [],
      });
      fetchData();
      setTimeout(
        () =>
          showAlert(
            "Berhasil",
            "Pengguna baru berhasil ditambahkan ke dalam sistem.",
          ),
        300,
      );
    } catch {
      showAlert(
        "Gagal Menambahkan",
        "Terjadi kesalahan sistem saat menambahkan pengguna baru.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 5. FUNGSI HAPUS USER
  const handleDeleteUser = async (id: string, name: string) => {
    showConfirm(
      "Cabut Akses Pengguna",
      `Yakin ingin MENCABUT AKSES untuk ${name}? Data login akan dihapus permanen dari sistem e-office.`,
      async () => {
        closeDialog();
        try {
          await deleteDoc(doc(db, "users", id));
          fetchData();
          setTimeout(
            () => showAlert("Berhasil", `Akses untuk ${name} telah dicabut.`),
            300,
          );
        } catch {
          showAlert("Gagal", "Sistem gagal mencabut akses pengguna tersebut.");
        }
      },
    );
  };

  // 6. 🔥 FUNGSI KIRIM NOTIFIKASI EMAIL 🔥
  const handleSendAccessEmail = async (user: any) => {
    showConfirm(
      "Kirim Notifikasi Akses",
      `Kirimkan email berisi informasi hak akses dan instruksi login ke alamat ${user.email}?`,
      async () => {
        closeDialog();
        setIsSendingEmail(user.id);
        try {
          const res = await sendEmailAction({
              type: "akses_pengurus",
              email: user.email,
              nama: user.nama,
              detail: {
                role: user.role,
                bidang: user.bidang || "Belum diatur",
                aksesModul:
                  user.role === "super_admin"
                    ? "Akses Penuh (Super Admin)"
                    : (user.aksesModul?.length || 0) + " Modul",
              },
            });

          if (res.success) {
            setTimeout(
              () =>
                showAlert(
                  "Terkirim",
                  `Email notifikasi akses berhasil dikirim ke ${user.email}.`,
                ),
              300,
            );
          } else {
            setTimeout(
              () =>
                showAlert(
                  "Peringatan Sistem",
                  "API Email gagal memproses pengiriman. Pastikan API /api/send-email sudah dikonfigurasi untuk tipe 'akses_pengurus'.",
                ),
              300,
            );
          }
        } catch {
          setTimeout(
            () =>
              showAlert(
                "Gagal Terhubung",
                "Sistem gagal terhubung ke server email.",
              ),
            300,
          );
        } finally {
          setIsSendingEmail(null);
        }
      },
    );
  };

  // --- RENDER UI ---
  if (hasAccess === null)
    return (
      <div className="h-full min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
        <p className="text-[#5F6368] font-medium">
          Memverifikasi Otoritas Akses...
        </p>
      </div>
    );

  if (hasAccess === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-[#FCE8E6] text-[#D93025] rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10"
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
        </div>
        <h2 className="text-3xl font-medium text-[#202124] mb-2 tracking-tight">
          Akses Terlarang
        </h2>
        <p className="text-[#5F6368] font-medium max-w-md">
          Hanya <b>Super Admin</b> yang diizinkan mengakses dan mengelola
          halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-12 font-sans text-[#202124]">
      {/* 🔥 CUSTOM DIALOG (POPUP) 🔥 */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl flex flex-col overflow-hidden border border-[#DADCE0] animate-in zoom-in-95">
            <div className="px-6 py-5">
              <h2
                className={`text-lg font-bold mb-2 ${dialog.title.includes("Gagal") || dialog.title.includes("Cabut") || dialog.title.includes("Peringatan") ? "text-[#D93025]" : "text-[#1A73E8]"}`}
              >
                {dialog.title}
              </h2>
              <p className="text-sm text-[#5F6368] leading-relaxed">
                {dialog.message}
              </p>
            </div>
            <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex justify-end gap-3">
              {dialog.type === "confirm" && (
                <button
                  onClick={closeDialog}
                  className="px-4 py-2 text-sm font-bold text-[#5F6368] hover:bg-[#E8EAED] rounded-lg transition-colors"
                >
                  Batal
                </button>
              )}
              <button
                onClick={() => {
                  if (dialog.type === "confirm" && dialog.onConfirm) {
                    dialog.onConfirm();
                  } else {
                    closeDialog();
                  }
                }}
                className={`px-5 py-2 text-sm font-bold text-white rounded-lg transition-colors shadow-sm ${dialog.title.includes("Cabut") ? "bg-[#D93025] hover:bg-[#b52a1f]" : "bg-[#1A73E8] hover:bg-[#1557B0]"}`}
              >
                {dialog.type === "confirm" ? "Lanjutkan" : "Mengerti"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4 px-4 sm:px-6 lg:px-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DADCE0] pb-6">
          <div>
            <h1 className="text-3xl font-medium tracking-tight mb-2">
              Manajemen Pengguna
            </h1>
            <p className="text-[#5F6368] text-sm max-w-2xl">
              Kelola profil, tetapkan otoritas akses modul spesifik, dan kelola
              notifikasi akses pengguna.
            </p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#1A73E8] hover:bg-[#1557B0] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors shrink-0 flex items-center justify-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Tambah Pengguna
          </button>
        </div>

        {/* --- TABEL PENGGUNA --- */}
        <div className="bg-white rounded-xl shadow-sm border border-[#DADCE0] overflow-hidden">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center">
              <div className="w-8 h-8 border-4 border-[#E8F0FE] border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
              <p className="text-[#1A73E8] font-medium text-sm animate-pulse">
                Memuat database pengguna...
              </p>
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-[#F8F9FA] text-[#9AA0A6] rounded-full flex items-center justify-center mb-4 border border-[#DADCE0]">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-medium">Belum ada pengguna terdaftar</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[11px] font-bold uppercase tracking-widest text-[#5F6368]">
                    <th className="px-6 py-4">Profil Pengguna</th>
                    <th className="px-6 py-4">Bidang / Akses Modul</th>
                    <th className="px-6 py-4">Status Otoritas</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0]">
                  {usersList.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-[#F8F9FA] transition-colors text-sm group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center font-bold border border-[#1A73E8]/20 shrink-0">
                            {u.nama ? u.nama.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold">{u.nama}</p>
                            <p className="text-xs text-[#5F6368] font-mono mt-0.5">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.bidang ? (
                          <div className="font-bold text-xs mb-1.5 text-[#202124]">
                            {u.bidang}
                          </div>
                        ) : (
                          <div className="text-[#9AA0A6] italic text-xs mb-1.5">
                            Bidang belum diatur
                          </div>
                        )}

                        {u.role === "super_admin" ? (
                          <span className="text-[10px] text-[#1E8E3E] font-bold bg-[#E6F4EA] px-2 py-0.5 rounded border border-[#CEEAD6]">
                            Akses Penuh Semua Modul
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#1A73E8] font-bold bg-[#E8F0FE] px-2 py-0.5 rounded border border-[#1A73E8]/20">
                            {u.aksesModul?.length || 0} Modul Diizinkan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase border ${
                            u.role === "super_admin"
                              ? "bg-[#F3E8FD] text-[#A142F4] border-[#E8D0FA]"
                              : "bg-[#FEF7E0] text-[#B06000] border-[#FCE8B2]"
                          }`}
                        >
                          {u.role === "super_admin"
                            ? "Super Admin"
                            : "Koordinator"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* 🔥 TOMBOL EMAIL NOTIFIKASI 🔥 */}
                          <button
                            onClick={() => handleSendAccessEmail(u)}
                            disabled={isSendingEmail === u.id}
                            title="Kirim Notifikasi Akses (Email)"
                            className="p-2 text-[#5F6368] hover:text-[#1A73E8] hover:bg-[#E8F0FE] rounded transition-colors disabled:opacity-50"
                          >
                            {isSendingEmail === u.id ? (
                              <svg
                                className="w-5 h-5 animate-spin"
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
                                  d="M4 12a8 8 0 018-8v8H4z"
                                ></path>
                              </svg>
                            ) : (
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
                                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 12v4m0 4h.01"
                                />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => handleEditClick(u)}
                            title="Edit Profil & Akses"
                            className="p-2 text-[#5F6368] hover:text-[#1E8E3E] hover:bg-[#E6F4EA] rounded transition-colors"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.nama)}
                            title="Cabut Akses"
                            className="p-2 text-[#5F6368] hover:text-[#D93025] hover:bg-[#FCE8E6] rounded transition-colors"
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL AREA */}
      {/* ========================================================================= */}

      {/* MODAL TAMBAH USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#DADCE0] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#5F6368] hover:bg-[#FCE8E6] hover:text-[#D93025] rounded-full transition-colors z-10"
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

            <div className="flex items-center gap-3 mb-6 border-b border-[#DADCE0] pb-4 mt-2">
              <div className="bg-[#E8F0FE] text-[#1A73E8] p-2.5 rounded-xl border border-[#1A73E8]/20">
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Tambah Pengguna Baru</h3>
            </div>

            <form onSubmit={handleAddUser} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    required
                    type="text"
                    value={newUser.nama}
                    onChange={(e) =>
                      setNewUser({ ...newUser, nama: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-all"
                    placeholder="Masukkan nama"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    required
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-all"
                    placeholder="email@contoh.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Otoritas (Role)
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        role: e.target.value,
                        aksesModul:
                          e.target.value === "super_admin"
                            ? []
                            : newUser.aksesModul,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-all cursor-pointer font-medium"
                  >
                    <option value="koordinator">Koordinator / Pengurus</option>
                    <option value="super_admin">
                      Super Admin (Akses Penuh)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Bidang / Departemen
                  </label>
                  <select
                    value={newUser.bidang}
                    onChange={(e) =>
                      setNewUser({ ...newUser, bidang: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-all cursor-pointer font-medium"
                  >
                    <option value="">-- Bebas Akses / Belum Diatur --</option>
                    {bidangList.map((b, idx) => (
                      <option key={idx} value={b.namaBidang}>
                        {b.namaBidang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 🔥 KOTAK TOGGLE HAK AKSES MODUL 🔥 */}
              <div className="pt-2 border-t border-[#DADCE0]">
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-3 mt-4">
                  Hak Akses Modul Spesifik
                </label>
                {newUser.role === "super_admin" ? (
                  <div className="p-4 bg-[#E8F0FE] border border-[#1A73E8]/30 rounded-xl text-sm text-[#1A73E8] font-medium flex items-start gap-3">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Otoritas Super Admin memberikan akses penuh ke seluruh modul
                    sistem secara otomatis. Pengaturan individual modul
                    dinonaktifkan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1 pb-1">
                    {DAFTAR_MODUL_SISTEM.map((modul) => {
                      const isActive = newUser.aksesModul?.includes(modul.id);
                      return (
                        <div
                          key={modul.id}
                          onClick={() => toggleModulAkses(modul.id, false)}
                          className={`flex items-center justify-between px-4 py-3.5 border rounded-xl cursor-pointer transition-all select-none ${isActive ? "border-[#1A73E8] bg-[#E8F0FE]" : "border-[#DADCE0] hover:bg-[#F8F9FA]"}`}
                        >
                          <span
                            className={`text-sm font-bold ${isActive ? "text-[#1A73E8]" : "text-[#5F6368]"}`}
                          >
                            {modul.label}
                          </span>

                          {/* 🔥 PERBAIKAN DESAIN TOGGLE SWITCH 🔥 */}
                          <div
                            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${isActive ? "bg-[#1A73E8]" : "bg-[#DADCE0]"}`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isActive ? "translate-x-5" : "translate-x-0"}`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-[#DADCE0] pt-5 mt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
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
                      </svg>{" "}
                      Menambahkan...
                    </>
                  ) : (
                    "Simpan Pengguna Baru"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT USER */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-[#DADCE0] max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#5F6368] hover:bg-[#FCE8E6] hover:text-[#D93025] rounded-full transition-colors z-10"
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

            <div className="flex items-center gap-3 mb-3 border-b border-[#DADCE0] pb-4 mt-2">
              <div className="bg-[#FEF7E0] text-[#B06000] p-2.5 rounded-xl border border-[#FCE8B2]">
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
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Edit Profil & Otoritas</h3>
            </div>

            <div className="mb-6 flex items-center gap-2 bg-[#F8F9FA] px-4 py-2.5 rounded-lg border border-[#DADCE0] w-fit">
              <svg
                className="w-4 h-4 text-[#5F6368]"
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
              <p className="text-sm font-bold">{selectedUser.email}</p>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-5">
              <div>
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={selectedUser.nama || ""}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-all font-bold"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Otoritas (Role)
                  </label>
                  <select
                    value={selectedUser.role || "koordinator"}
                    onChange={(e) =>
                      setSelectedUser({ ...selectedUser, role: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-all cursor-pointer font-bold"
                  >
                    <option value="koordinator">Koordinator / Pengurus</option>
                    <option value="super_admin">
                      Super Admin (Akses Penuh)
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Bidang / Departemen
                  </label>
                  <select
                    value={selectedUser.bidang || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        bidang: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-all cursor-pointer font-bold"
                  >
                    <option value="">-- Bebas Akses / Belum Diatur --</option>
                    {bidangList.map((b, idx) => (
                      <option key={idx} value={b.namaBidang}>
                        {b.namaBidang}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 🔥 KOTAK TOGGLE HAK AKSES MODUL 🔥 */}
              <div className="pt-2 border-t border-[#DADCE0]">
                <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-3 mt-4">
                  Hak Akses Modul Spesifik
                </label>
                {selectedUser.role === "super_admin" ? (
                  <div className="p-4 bg-[#E8F0FE] border border-[#1A73E8]/30 rounded-xl text-sm text-[#1A73E8] font-medium flex items-start gap-3">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Otoritas Super Admin memberikan akses penuh ke seluruh modul
                    sistem secara otomatis. Pengaturan individual modul
                    dinonaktifkan.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar pr-1 pb-1">
                    {DAFTAR_MODUL_SISTEM.map((modul) => {
                      const isActive = selectedUser.aksesModul?.includes(
                        modul.id,
                      );
                      return (
                        <div
                          key={modul.id}
                          onClick={() => toggleModulAkses(modul.id, true)}
                          className={`flex items-center justify-between px-4 py-3.5 border rounded-xl cursor-pointer transition-all select-none ${isActive ? "border-[#1A73E8] bg-[#E8F0FE]" : "border-[#DADCE0] hover:bg-[#F8F9FA]"}`}
                        >
                          <span
                            className={`text-sm font-bold ${isActive ? "text-[#1A73E8]" : "text-[#5F6368]"}`}
                          >
                            {modul.label}
                          </span>

                          {/* 🔥 PERBAIKAN DESAIN TOGGLE SWITCH 🔥 */}
                          <div
                            className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors ${isActive ? "bg-[#1A73E8]" : "bg-[#DADCE0]"}`}
                          >
                            <div
                              className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isActive ? "translate-x-5" : "translate-x-0"}`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t border-[#DADCE0] pt-5 mt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isSaving ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
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
                      </svg>{" "}
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Perubahan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
