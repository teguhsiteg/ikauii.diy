"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, updateDoc } from "firebase/firestore";
import { toast } from "@/lib/toast";

export default function AdminMobilePage() {
  const [activeTab, setActiveTab] = useState<"quiz" | "event">("quiz");

  // Quiz State
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizForm, setQuizForm] = useState({ judul: "", kategori: "Umum", jmlSoal: 10, reward: 100 });

  // Event State
  const [events, setEvents] = useState<any[]>([]);
  const [eventForm, setEventForm] = useState({ judul: "", deskripsi: "", lokasi: "", tanggal: "", koordinat: "", imageUrl: "", isActive: true });

  useEffect(() => {
    fetchQuizzes();
    fetchEvents();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "kuis"), orderBy("judul", "asc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setQuizzes(data);
    } catch (e) {
      toast.error("Gagal mengambil data kuis");
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const q = query(collection(db, "events"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEvents(data);
    } catch (e) {
      toast.error("Gagal mengambil data event");
    }
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizForm.judul) return;
    try {
      await addDoc(collection(db, "kuis"), {
        ...quizForm,
        createdAt: new Date().toISOString()
      });
      toast.success("Kuis berhasil ditambahkan");
      setQuizForm({ judul: "", kategori: "Umum", jmlSoal: 10, reward: 100 });
      fetchQuizzes();
    } catch (e) {
      toast.error("Gagal menambah kuis");
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
    } catch (e) {
      toast.error("Gagal menambah event");
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm("Hapus kuis ini?")) return;
    try {
      await deleteDoc(doc(db, "kuis", id));
      toast.success("Kuis dihapus");
      fetchQuizzes();
    } catch (e) {
      toast.error("Gagal menghapus kuis");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Hapus event ini?")) return;
    try {
      await deleteDoc(doc(db, "events", id));
      toast.success("Event dihapus");
      fetchEvents();
    } catch (e) {
      toast.error("Gagal menghapus event");
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Manajemen Mobile App</h1>
        <p className="text-slate-500 mt-2">Kelola konten yang akan tampil di aplikasi mobile (Kuis & Event)</p>
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("quiz")}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === "quiz" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Manajemen Kuis
        </button>
        <button
          onClick={() => setActiveTab("event")}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === "event" ? "bg-blue-600 text-white shadow-lg" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          }`}
        >
          Manajemen Event Lari
        </button>
      </div>

      {activeTab === "quiz" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h2 className="text-xl font-bold mb-4">Tambah Kuis Baru</h2>
            <form onSubmit={handleAddQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Judul Kuis</label>
                <input required type="text" value={quizForm.judul} onChange={(e) => setQuizForm({...quizForm, judul: e.target.value})} className="w-full border rounded-lg p-2" placeholder="Cth: Kuis Sejarah UII" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Kategori</label>
                <input required type="text" value={quizForm.kategori} onChange={(e) => setQuizForm({...quizForm, kategori: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jml Soal</label>
                  <input type="number" value={quizForm.jmlSoal} onChange={(e) => setQuizForm({...quizForm, jmlSoal: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Reward Coin</label>
                  <input type="number" value={quizForm.reward} onChange={(e) => setQuizForm({...quizForm, reward: Number(e.target.value)})} className="w-full border rounded-lg p-2" />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-blue-700 transition-colors">
                Simpan Kuis
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {loading ? <p>Memuat...</p> : quizzes.map(q => (
              <div key={q.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{q.kategori}</span>
                  <h3 className="text-lg font-bold text-slate-800">{q.judul}</h3>
                  <p className="text-sm text-slate-500">{q.jmlSoal} Soal • {q.reward} Coin</p>
                </div>
                <button onClick={() => handleDeleteQuiz(q.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "event" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit">
            <h2 className="text-xl font-bold mb-4">Tambah Event Baru</h2>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Judul Event</label>
                <input required type="text" value={eventForm.judul} onChange={(e) => setEventForm({...eventForm, judul: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal</label>
                <input type="date" value={eventForm.tanggal} onChange={(e) => setEventForm({...eventForm, tanggal: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Lokasi</label>
                <input type="text" value={eventForm.lokasi} onChange={(e) => setEventForm({...eventForm, lokasi: e.target.value})} className="w-full border rounded-lg p-2" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-4 hover:bg-blue-700 transition-colors">
                Simpan Event
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
             {events.map(ev => (
              <div key={ev.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{ev.judul}</h3>
                  <p className="text-sm text-slate-500">{ev.tanggal} • {ev.lokasi}</p>
                </div>
                <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
