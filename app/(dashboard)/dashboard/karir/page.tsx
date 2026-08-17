"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";

interface Loker {
  id: string;
  judul: string;
  perusahaan: string;
  lokasi: string;
  jenisPekerjaan: string;
  createdAt: string;
}

export default function KarirPage() {
  const [lokerList, setLokerList] = useState<Loker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    judul: "",
    perusahaan: "",
    lokasi: "Indonesia",
    jenisPekerjaan: "Full-time"
  });

  const [toast, setToast] = useState({ isOpen: false, message: "", type: "success" });

  useEffect(() => {
    fetchLoker();
  }, []);

  const fetchLoker = async () => {
    try {
      const q = query(collection(db, "loker"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Loker[];
      setLokerList(data);
    } catch (error) {
      console.error("Gagal memuat loker:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: "", type }), 3000);
  };

  const handleAddLoker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.judul || !form.perusahaan) {
      showToast("Judul dan Perusahaan wajib diisi", "error");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, "loker"), {
        ...form,
        posisi: form.judul, // For backwards compatibility if any
        createdAt: new Date().toISOString()
      });
      showToast("Lowongan berhasil ditambahkan", "success");
      setForm({ judul: "", perusahaan: "", lokasi: "Indonesia", jenisPekerjaan: "Full-time" });
      fetchLoker();
    } catch (error) {
      console.error("Gagal menambah loker:", error);
      showToast("Terjadi kesalahan", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus lowongan ini?")) return;
    try {
      await deleteDoc(doc(db, "loker", id));
      showToast("Lowongan berhasil dihapus", "success");
      fetchLoker();
    } catch (error) {
      showToast("Gagal menghapus lowongan", "error");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Karir & Loker</h1>
        <p className="text-slate-500 mt-1">Kelola informasi lowongan pekerjaan untuk alumni di Mobile App.</p>
      </div>

      {toast.isOpen && (
        <div className={`p-4 mb-6 rounded-xl font-semibold text-sm ${toast.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Tambah Lowongan</h2>
          <form onSubmit={handleAddLoker} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Posisi Pekerjaan</label>
              <input
                required
                type="text"
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Software Engineer"
                value={form.judul}
                onChange={(e) => setForm({ ...form, judul: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nama Perusahaan</label>
              <input
                required
                type="text"
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="PT Contoh Digital"
                value={form.perusahaan}
                onChange={(e) => setForm({ ...form, perusahaan: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Lokasi</label>
              <input
                type="text"
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Jakarta, Indonesia"
                value={form.lokasi}
                onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Jenis Pekerjaan</label>
              <select
                className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={form.jenisPekerjaan}
                onChange={(e) => setForm({ ...form, jenisPekerjaan: e.target.value })}
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 mt-4"
            >
              {isSaving ? "Menyimpan..." : "Posting Lowongan"}
            </button>
          </form>
        </div>

        {/* List Loker */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : lokerList.length === 0 ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
              <p className="text-slate-500 font-medium">Belum ada lowongan yang diposting.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {lokerList.map((loker) => (
                <div key={loker.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-hover hover:border-blue-300 hover:shadow-md">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{loker.judul}</h3>
                    <p className="text-slate-600 font-medium mt-1">{loker.perusahaan}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                      <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                        📍 {loker.lokasi}
                      </span>
                      <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                        ⏱️ {loker.jenisPekerjaan}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(loker.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-bold transition-colors self-start sm:self-center"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
