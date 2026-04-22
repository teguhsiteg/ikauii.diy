"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
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
  });

  // State Modal Log (Mata)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logUser, setLogUser] = useState<any>(null);

  const [isSaving, setIsSaving] = useState(false);

  // 1. CEK HAK AKSES (Hanya Super Admin yang boleh masuk)
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
          } catch (error) {
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

      // Urutkan manual menggunakan JavaScript (Terbaru di atas)
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

  // 3. FUNGSI EDIT USER
  const handleEditClick = (user: any) => {
    setSelectedUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", selectedUser.id), {
        nama: selectedUser.nama,
        role: selectedUser.role,
        bidang: selectedUser.bidang,
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      alert("Gagal memperbarui data pengguna.");
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
        createdAt: new Date().toISOString(),
        lastLogin: null,
        lastLogout: null,
      });
      setIsAddModalOpen(false);
      setNewUser({ nama: "", email: "", role: "koordinator", bidang: "" });
      fetchData();
    } catch (error) {
      alert("Gagal menambahkan pengguna baru.");
    } finally {
      setIsSaving(false);
    }
  };

  // 5. FUNGSI HAPUS USER
  const handleDeleteUser = async (id: string, name: string) => {
    if (
      confirm(
        `Yakin ingin MENCABUT AKSES untuk ${name}? (User harus mendaftar ulang profil jika login lagi)`,
      )
    ) {
      try {
        await deleteDoc(doc(db, "users", id));
        fetchData();
      } catch (error) {
        alert("Gagal menghapus pengguna.");
      }
    }
  };

  // 6. FUNGSI LIHAT LOG (Diperbarui agar tahan banting terhadap format Firestore Timestamp)
  const handleViewLog = (user: any) => {
    setLogUser(user);
    setIsLogModalOpen(true);
  };

  const formatLogDate = (dateVal?: any) => {
    if (!dateVal) return "Belum ada rekam jejak";

    let d;
    // Cek apakah data berupa objek Firestore Timestamp
    if (typeof dateVal === "object" && dateVal.toDate) {
      d = dateVal.toDate();
    } else {
      // Jika data berupa string (ISO String)
      d = new Date(dateVal);
    }

    // Jika format ternyata tidak valid
    if (isNaN(d.getTime())) return "Belum ada rekam jejak";

    return (
      d.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB"
    );
  };

  // --- RENDER UI ---
  if (hasAccess === null)
    return (
      <div className="h-full min-h-[60vh] flex flex-col items-center justify-center animate-pulse">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">
          Memverifikasi Otoritas Akses...
        </p>
      </div>
    );

  if (hasAccess === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
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
        <h2 className="text-3xl font-black text-slate-900 mb-2">
          Akses Terlarang
        </h2>
        <p className="text-slate-500 font-medium max-w-md">
          Hanya <b>Super Admin</b> yang diizinkan mengakses dan mengelola
          halaman Manajemen Pengguna.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pt-4 px-4 sm:px-6 lg:px-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
              Manajemen Pengguna
            </h1>
            <p className="text-slate-500 text-sm md:text-base max-w-2xl">
              Kelola profil, tetapkan otoritas akses (Super Admin /
              Koordinator), dan pantau log aktivitas seluruh pengguna sistem
              e-office.
            </p>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors shrink-0 flex items-center justify-center gap-2"
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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="p-16 flex justify-center">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
          ) : usersList.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-4">
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
              <h3 className="font-semibold text-slate-700">
                Belum ada pengguna terdaftar
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Silakan tambahkan pengguna baru menggunakan tombol di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4">Profil Pengguna</th>
                    <th className="px-6 py-4">Bidang / Departemen</th>
                    <th className="px-6 py-4">Status Otoritas</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/50 transition-colors text-sm group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold border border-slate-200 shrink-0">
                            {u.nama ? u.nama.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">
                              {u.nama}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.bidang ? (
                          <span className="text-slate-700 font-medium">
                            {u.bidang}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-xs">
                            Akses Global / Belum diatur
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide ${
                            u.role === "super_admin"
                              ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200"
                              : "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                          }`}
                        >
                          {u.role === "super_admin"
                            ? "Super Admin"
                            : "Koordinator"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewLog(u)}
                            title="Log Aktivitas"
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
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
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>

                          <button
                            onClick={() => handleEditClick(u)}
                            title="Edit Profil"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* --- MODAL AREA --- */}

      {/* MODAL TAMBAH USER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
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

            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100">
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
              <h3 className="text-xl font-bold text-slate-900">
                Tambah Pengguna
              </h3>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={newUser.nama}
                  onChange={(e) =>
                    setNewUser({ ...newUser, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                  placeholder="Masukkan nama"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Alamat Email
                </label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                  placeholder="email@contoh.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Otoritas (Role)
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({ ...newUser, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                >
                  <option value="koordinator">Koordinator / Pengurus</option>
                  <option value="super_admin">Super Admin (Akses Penuh)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Bidang / Departemen
                </label>
                <select
                  value={newUser.bidang}
                  onChange={(e) =>
                    setNewUser({ ...newUser, bidang: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                >
                  <option value="">-- Bebas Akses / Belum Diatur --</option>
                  {bidangList.map((b, idx) => (
                    <option key={idx} value={b.namaBidang}>
                      {b.namaBidang}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors mt-6"
              >
                {isSaving ? "Menambahkan..." : "Tambah Pengguna"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT USER */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
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

            <div className="flex items-center gap-3 mb-2">
              <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl border border-orange-100">
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
              <h3 className="text-xl font-bold text-slate-900">
                Edit Profil Akses
              </h3>
            </div>
            <p className="text-sm text-slate-500 mb-6 font-medium bg-slate-50 inline-block px-3 py-1 rounded-md border border-slate-100">
              {selectedUser.email}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  required
                  type="text"
                  value={selectedUser.nama || ""}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, nama: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Otoritas (Role)
                </label>
                <select
                  value={selectedUser.role || "koordinator"}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                >
                  <option value="koordinator">Koordinator / Pengurus</option>
                  <option value="super_admin">Super Admin (Akses Penuh)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                  Bidang / Departemen
                </label>
                <select
                  value={selectedUser.bidang || ""}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, bidang: e.target.value })
                  }
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-sm transition-all"
                >
                  <option value="">-- Bebas Akses / Belum Diatur --</option>
                  {bidangList.map((b, idx) => (
                    <option key={idx} value={b.namaBidang}>
                      {b.namaBidang}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors mt-6"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOG AKTIVITAS */}
      {isLogModalOpen && logUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsLogModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
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
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-xl border border-indigo-100">
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-tight">
                  Log Aktivitas Akun
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{logUser.nama}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50/50 p-4 rounded-xl border border-green-100">
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Terakhir Login
                </p>
                <p className="text-sm font-semibold text-slate-800 ml-3">
                  {formatLogDate(logUser.lastLogin)}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Terakhir Logout
                </p>
                <p className="text-sm font-semibold text-slate-800 ml-3">
                  {formatLogDate(logUser.lastLogout)}
                </p>
              </div>
              <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                Catatan: Data waktu terekam otomatis berdasarkan perangkat dan
                browser yang digunakan pengguna.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
