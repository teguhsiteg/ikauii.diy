"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query } from "firebase/firestore";
import { toast } from "@/lib/toast";

export default function EventMobilePage() {
  const [events, setEvents] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({ judul: "", deskripsi: "", lokasi: "", tanggal: "", koordinat: "", imageUrl: "", isActive: true });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, "events"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(data);
    } catch {
      toast.error("Gagal mengambil data event");
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.judul) return;
    try {
      await addDoc(collection(db, "events"), {
        ...eventForm,
        createdAt: new Date().toISOString()
      });
      toast.success("Event berhasil ditambahkan");
      setEventForm({ judul: "", deskripsi: "", lokasi: "", tanggal: "", koordinat: "", imageUrl: "", isActive: true });
      fetchEvents();
    } catch {
      toast.error("Gagal menambah event");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Hapus event ini?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      toast.success("Event dihapus");
      fetchEvents();
    } catch {
      toast.error("Gagal menghapus event");
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Manajemen Event Mobile</h1>
        <p className="text-slate-500 mt-1">Kelola event yang akan tampil di halaman Virtual Run di aplikasi mobile.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-xl font-bold mb-4">Tambah Event Baru</h2>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Judul Event</label>
              <input required type="text" value={eventForm.judul} onChange={(e) => setEventForm({...eventForm, judul: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
              <input type="date" value={eventForm.tanggal} onChange={(e) => setEventForm({...eventForm, tanggal: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Lokasi</label>
              <input type="text" value={eventForm.lokasi} onChange={(e) => setEventForm({...eventForm, lokasi: e.target.value})} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-blue-700 transition-colors">
              Simpan Event
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
           {events.length === 0 ? (
             <div className="bg-slate-50 border border-dashed border-slate-300 rounded-2xl p-12 text-center">
               <p className="text-slate-500 font-medium">Belum ada event yang dibuat.</p>
             </div>
           ) : events.map(ev => (
            <div key={ev.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center transition-hover hover:border-blue-300 hover:shadow-md">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{ev.judul}</h3>
                <p className="text-sm text-slate-500 font-medium mt-1">🗓️ {ev.tanggal} • 📍 {ev.lokasi}</p>
              </div>
              <button onClick={() => handleDeleteEvent(ev.id)} className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
