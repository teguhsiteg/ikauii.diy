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
} from "firebase/firestore";

export default function ManajemenPenggunaPage() {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [bidangList, setBidangList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Modal Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
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
      // Fetch Users (TANPA orderBy dari Firestore agar akun lama tidak hilang)
      const snapUsers = await getDocs(collection(db, "users"));
      const rawUsers = snapUsers.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Urutkan manual menggunakan JavaScript
      rawUsers.sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA; // Urutkan dari yang terbaru
      });
      setUsersList(rawUsers);

      // Fetch Bidang (Untuk pilihan di dropdown edit)
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
        role: selectedUser.role,
        bidang: selectedUser.bidang,
      });
      setIsEditModalOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      alert("Gagal memperbarui data pengguna.");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. FUNGSI HAPUS USER (Hanya dari Firestore)
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

  // --- RENDER UI ---
  if (hasAccess === null)
    return (
      <div className="p-10 text-center animate-pulse text-slate-400 font-bold mt-20">
        Memverifikasi Otoritas...
      </div>
    );

  if (hasAccess === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center">
        <span className="text-6xl mb-4">⛔</span>
        <h2 className="text-3xl font-black text-blue-950 mb-2">
          Akses Terlarang
        </h2>
        <p className="text-slate-500 font-medium max-w-md">
          Hanya <b>Super Admin</b> yang diizinkan mengakses halaman Manajemen
          Pengguna.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl animate-in fade-in duration-500 pb-12">
      {/* MODAL EDIT USER */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-blue-950 mb-2">
              Atur Hak Akses
            </h3>
            <p className="text-sm text-slate-500 mb-6 font-bold">
              {selectedUser.nama}
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Role (Jabatan Sistem)
                </label>
                <select
                  value={selectedUser.role}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, role: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none"
                >
                  <option value="koordinator">Koordinator / Pengurus</option>
                  <option value="super_admin">Super Admin (Akses Penuh)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Bidang / Departemen
                </label>
                <select
                  value={selectedUser.bidang}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, bidang: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-600 outline-none"
                >
                  <option value="">-- Pilih Bidang --</option>
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all mt-4"
              >
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-blue-950 mb-2">
          Manajemen Pengguna
        </h2>
        <p className="text-slate-500">
          Kelola role (Super Admin / Koordinator) dan penempatan bidang pengurus
          yang sudah melakukan login pertama kali.
        </p>
      </div>

      {/* TABEL PENGGUNA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-16 text-center animate-pulse text-slate-400 font-bold">
            Memuat data pengguna...
          </div>
        ) : usersList.length === 0 ? (
          <div className="p-20 text-center">
            <span className="text-5xl opacity-50 block mb-4">👥</span>
            <h3 className="font-bold text-slate-700">Belum ada pengguna</h3>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <th className="p-4 font-bold">Profil Pengguna</th>
                  <th className="p-4 font-bold">Bidang / Departemen</th>
                  <th className="p-4 font-bold text-center">Role Akses</th>
                  <th className="p-4 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-blue-50/30 transition-colors text-sm"
                  >
                    <td className="p-4">
                      <p className="font-bold text-blue-950">{u.nama}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="p-4 font-medium text-slate-700">
                      {u.bidang || "-"}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${u.role === "super_admin" ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-blue-50 text-blue-600 border border-blue-200"}`}
                      >
                        {u.role === "super_admin"
                          ? "Super Admin"
                          : "Koordinator"}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="bg-slate-100 hover:bg-slate-200 text-blue-900 px-4 py-2 rounded-lg font-bold text-xs transition-colors"
                      >
                        Edit Akses
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id, u.nama)}
                        className="bg-red-50 hover:bg-red-500 hover:text-white text-red-600 px-4 py-2 rounded-lg font-bold text-xs transition-colors border border-red-100"
                      >
                        Cabut
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
