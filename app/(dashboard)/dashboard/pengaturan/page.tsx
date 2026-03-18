"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";

export default function PengaturanWebPage() {
  const [activeTab, setActiveTab] = useState("utama");
  const [message, setMessage] = useState({ type: "", text: "" });

  // --- STATE TAB 1: LANDING PAGE ---
  const [landingData, setLandingData] = useState({
    heroTitle: "",
    heroHighlight: "",
    heroDesc: "",
    heroBgUrl: "",
    profilImgUrl: "",
    bankName: "",
    bankNumber: "",
    bankOwner: "",
  });
  const [isLoadingLanding, setIsLoadingLanding] = useState(true);
  const [isSavingLanding, setIsSavingLanding] = useState(false);

  // --- STATE TAB 2: BERITA ---
  const [beritaData, setBeritaData] = useState({
    judul: "",
    imgUrl: "",
    kategori: "Siaran Pers",
    isi: "",
    bidang: "Bidang Organisasi",
    koordinator: "",
  });
  const [beritaList, setBeritaList] = useState<any[]>([]);
  const [viewBerita, setViewBerita] = useState("form");
  const [isSavingBerita, setIsSavingBerita] = useState(false);

  // --- STATE TAB 3: AGENDA ---
  const defaultAgendaData = {
    judul: "",
    tanggal: "",
    waktu: "",
    tiket: "Gratis (Free)",
    format: "Offline (Luring)",
    imgUrl: "",
    link: "",
    linkGForm: "",
    linkCsv: "",
    deskripsi: "",
    bidang: "Bidang Organisasi",
    koordinator: "",
    isComingSoon: false,
    // FITUR EKSTRA TWIBBON
    isTwibbonActive: false,
    twibbonUrl: "",
    // FITUR EKSTRA DONASI
    isDonasiActive: false,
    bankDonasi: "",
    rekeningDonasi: "",
    atasNamaDonasi: "",
    waDonasi: "",
    deskripsiDonasi: "", // BARU: Pesan pengantar donasi
    alamatDonasi: "", // BARU: Alamat kirim doorprice
  };
  const [agendaData, setAgendaData] = useState(defaultAgendaData);
  const [agendaList, setAgendaList] = useState<any[]>([]);
  const [viewAgenda, setViewAgenda] = useState("form");
  const [isSavingAgenda, setIsSavingAgenda] = useState(false);
  const [editingAgendaId, setEditingAgendaId] = useState<string | null>(null);

  // --- STATE TAB 4: GALERI ---
  const [galeriData, setGaleriData] = useState({
    judul: "",
    tanggal: "",
    imgUrl: "",
  });
  const [galeriList, setGaleriList] = useState<any[]>([]);
  const [viewGaleri, setViewGaleri] = useState("form");
  const [isSavingGaleri, setIsSavingGaleri] = useState(false);

  // --- STATE TAB 5: DONASI (GLOBAL REKAP) ---
  const [donasiList, setDonasiList] = useState<any[]>([]);
  const [isLoadingDonasi, setIsLoadingDonasi] = useState(false);
  const [selectedAgendaDonasi, setSelectedAgendaDonasi] = useState("all");

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchLanding = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "landing_page"));
        if (docSnap.exists()) {
          setLandingData((prev) => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingLanding(false);
      }
    };
    fetchLanding();
  }, []);

  const fetchBeritaList = async () => {
    try {
      const q = query(collection(db, "berita"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setBeritaList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchAgendaList = async () => {
    try {
      const q = query(collection(db, "agenda"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setAgendaList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGaleriList = async () => {
    try {
      const q = query(collection(db, "galeri"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setGaleriList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDonasiList = async () => {
    setIsLoadingDonasi(true);
    try {
      const q = query(
        collection(db, "agenda_donasi"),
        orderBy("waktu", "desc"),
      );
      const snap = await getDocs(q);
      setDonasiList(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      fetchAgendaList();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingDonasi(false);
    }
  };

  // --- HANDLER INPUT ---
  const handleLandingChange = (e: any) =>
    setLandingData({ ...landingData, [e.target.name]: e.target.value });
  const handleBeritaChange = (e: any) =>
    setBeritaData({ ...beritaData, [e.target.name]: e.target.value });
  const handleGaleriChange = (e: any) =>
    setGaleriData({ ...galeriData, [e.target.name]: e.target.value });

  const handleAgendaChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setAgendaData({
      ...agendaData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleEditAgenda = (agenda: any) => {
    setAgendaData({
      judul: agenda.judul || "",
      tanggal: agenda.tanggal || "",
      waktu: agenda.waktu || "",
      tiket: agenda.tiket || "Gratis (Free)",
      format: agenda.format || "Offline (Luring)",
      imgUrl: agenda.imgUrl || "",
      link: agenda.link || "",
      linkGForm: agenda.linkGForm || "",
      linkCsv: agenda.linkCsv || "",
      deskripsi: agenda.deskripsi || "",
      bidang: agenda.bidang || "Bidang Organisasi",
      koordinator: agenda.koordinator || "",
      isComingSoon: agenda.isComingSoon || false,
      isTwibbonActive: agenda.isTwibbonActive || false,
      twibbonUrl: agenda.twibbonUrl || "",
      isDonasiActive: agenda.isDonasiActive || false,
      bankDonasi: agenda.bankDonasi || "",
      rekeningDonasi: agenda.rekeningDonasi || "",
      atasNamaDonasi: agenda.atasNamaDonasi || "",
      waDonasi: agenda.waDonasi || "",
      deskripsiDonasi: agenda.deskripsiDonasi || "", // BARU
      alamatDonasi: agenda.alamatDonasi || "", // BARU
    });
    setEditingAgendaId(agenda.id);
    setViewAgenda("form");
  };

  // --- FUNGSI SIMPAN & AKSI ---
  const saveLandingData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLanding(true);
    setMessage({ type: "", text: "" });
    try {
      await setDoc(doc(db, "settings", "landing_page"), landingData);
      setMessage({
        type: "success",
        text: "Pengaturan Utama berhasil disimpan!",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Gagal menyimpan data." });
    } finally {
      setIsSavingLanding(false);
    }
  };

  const saveBeritaData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBerita(true);
    setMessage({ type: "", text: "" });
    try {
      await addDoc(collection(db, "berita"), {
        ...beritaData,
        createdAt: new Date().toISOString(),
      });
      setMessage({ type: "success", text: "Berita berhasil diterbitkan!" });
      setBeritaData({
        judul: "",
        imgUrl: "",
        kategori: "Siaran Pers",
        isi: "",
        bidang: "Bidang Organisasi",
        koordinator: "",
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Gagal menerbitkan berita." });
    } finally {
      setIsSavingBerita(false);
    }
  };

  const saveAgendaData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAgenda(true);
    setMessage({ type: "", text: "" });

    try {
      let customSlug = agendaData.judul
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-");

      if (editingAgendaId) {
        await updateDoc(doc(db, "agenda", editingAgendaId), {
          ...agendaData,
          slug: customSlug,
        });
        setMessage({
          type: "success",
          text: "Perubahan Agenda berhasil disimpan!",
        });
      } else {
        const docRef = doc(db, "agenda", customSlug);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          customSlug = `${customSlug}-${Math.floor(Math.random() * 1000)}`;
        }

        await setDoc(doc(db, "agenda", customSlug), {
          ...agendaData,
          createdAt: new Date().toISOString(),
          slug: customSlug,
        });
        setMessage({
          type: "success",
          text: "Agenda baru berhasil dibuat dengan URL cantik!",
        });
      }

      setAgendaData(defaultAgendaData);
      setEditingAgendaId(null);
      setViewAgenda("list");
      fetchAgendaList();
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error(error);
      setMessage({ type: "error", text: "Gagal menyimpan agenda." });
    } finally {
      setIsSavingAgenda(false);
    }
  };

  const saveGaleriData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingGaleri(true);
    setMessage({ type: "", text: "" });
    try {
      await addDoc(collection(db, "galeri"), {
        ...galeriData,
        createdAt: new Date().toISOString(),
      });
      setMessage({ type: "success", text: "Foto Galeri berhasil diunggah!" });
      setGaleriData({ judul: "", tanggal: "", imgUrl: "" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Gagal mengunggah galeri." });
    } finally {
      setIsSavingGaleri(false);
    }
  };

  // --- HAPUS & UPDATE DATA ---
  const deleteBerita = async (id: string) => {
    if (confirm("Yakin ingin menghapus berita ini?")) {
      await deleteDoc(doc(db, "berita", id));
      fetchBeritaList();
    }
  };

  const deleteAgenda = async (id: string) => {
    if (confirm("Yakin ingin menghapus agenda ini?")) {
      await deleteDoc(doc(db, "agenda", id));
      fetchAgendaList();
    }
  };

  const deleteGaleri = async (id: string) => {
    if (confirm("Yakin ingin menghapus foto galeri ini?")) {
      await deleteDoc(doc(db, "galeri", id));
      fetchGaleriList();
    }
  };

  const verifyDonasi = async (id: string) => {
    if (
      confirm(
        "Yakin ingin memverifikasi donasi ini? Nominal akan ditambahkan ke Total Terkumpul di halaman publik.",
      )
    ) {
      try {
        await updateDoc(doc(db, "agenda_donasi", id), {
          status: "Terverifikasi",
        });
        setMessage({ type: "success", text: "Donasi berhasil diverifikasi!" });
        fetchDonasiList();
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } catch (error) {
        console.error(error);
        setMessage({ type: "error", text: "Gagal memverifikasi donasi." });
      }
    }
  };

  const deleteDonasi = async (id: string) => {
    if (confirm("Yakin ingin menghapus data donasi ini secara permanen?")) {
      try {
        await deleteDoc(doc(db, "agenda_donasi", id));
        fetchDonasiList();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const filteredDonasiList =
    selectedAgendaDonasi === "all"
      ? donasiList
      : donasiList.filter((donasi) => donasi.agendaId === selectedAgendaDonasi);

  return (
    <div className="max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-blue-950 mb-2">
          Manajemen Konten (CMS)
        </h2>
        <p className="text-slate-500">
          Kelola semua tampilan, berita, agenda, dan galeri di halaman publik
          secara terpusat.
        </p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: "utama", label: "Pengaturan Utama" },
          { id: "berita", label: "Berita & Rilis" },
          { id: "agenda", label: "Agenda Acara" },
          { id: "galeri", label: "Galeri Dokumentasi" },
          { id: "donasi", label: "Verifikasi Donasi" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMessage({ type: "", text: "" });
              if (tab.id === "berita") {
                setViewBerita("form");
                fetchBeritaList();
              }
              if (tab.id === "agenda") {
                setAgendaData(defaultAgendaData);
                setEditingAgendaId(null);
                setViewAgenda("list");
                fetchAgendaList();
              }
              if (tab.id === "galeri") {
                setViewGaleri("form");
                fetchGaleriList();
              }
              if (tab.id === "donasi") fetchDonasiList();
            }}
            className={`px-6 py-3.5 font-bold rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-blue-900 text-white shadow-md border-b-4 border-yellow-500"
                : "bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-900 border border-transparent border-b-0"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl mb-6 font-medium flex items-center gap-3 shadow-sm border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
        >
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* TAB 1: PENGATURAN UTAMA */}
      {activeTab === "utama" && (
        <form onSubmit={saveLandingData} className="space-y-8 max-w-4xl">
          {isLoadingLanding ? (
            <div className="p-10 text-center animate-pulse text-slate-500 font-bold">
              Sinkronisasi data dengan server...
            </div>
          ) : (
            <>
              {/* HERO SECTION */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>{" "}
                  Spanduk Utama (Hero)
                </h3>
                <div className="grid md:grid-cols-2 gap-6 mb-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Judul Utama (Baris 1)
                    </label>
                    <input
                      type="text"
                      name="heroTitle"
                      value={landingData.heroTitle}
                      onChange={handleLandingChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Teks Sorotan (Warna Kuning)
                    </label>
                    <input
                      type="text"
                      name="heroHighlight"
                      value={landingData.heroHighlight}
                      onChange={handleLandingChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Deskripsi Singkat Bawah Judul
                  </label>
                  <textarea
                    name="heroDesc"
                    rows={3}
                    value={landingData.heroDesc}
                    onChange={handleLandingChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none leading-relaxed"
                    required
                  />
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    URL Gambar Latar Belakang (Hero Image)
                  </label>
                  <input
                    type="text"
                    name="heroBgUrl"
                    value={landingData.heroBgUrl}
                    onChange={handleLandingChange}
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
              </div>

              {/* PROFIL VIDEO/GAMBAR */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>{" "}
                  Media Profil (Tentang Kami)
                </h3>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Link Gambar atau Video YouTube
                  </label>
                  <input
                    type="text"
                    name="profilImgUrl"
                    value={landingData.profilImgUrl}
                    onChange={handleLandingChange}
                    placeholder="Contoh: https://www.youtube.com/watch?v=XXXXXX"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
              </div>

              {/* REKENING DONASI UMUM */}
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-blue-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>{" "}
                  Informasi Rekening Umum (Footer)
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={landingData.bankName}
                      onChange={handleLandingChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nomor Rekening
                    </label>
                    <input
                      type="text"
                      name="bankNumber"
                      value={landingData.bankNumber}
                      onChange={handleLandingChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Atas Nama (A.N)
                    </label>
                    <input
                      type="text"
                      name="bankOwner"
                      value={landingData.bankOwner}
                      onChange={handleLandingChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingLanding}
                  className="bg-blue-900 hover:bg-blue-950 text-white font-bold py-3.5 px-10 rounded-xl shadow-lg transition-transform hover:-translate-y-1"
                >
                  {isSavingLanding
                    ? "Menyimpan Perubahan..."
                    : "💾 Simpan Pengaturan Utama"}
                </button>
              </div>
            </>
          )}
        </form>
      )}

      {/* TAB 2: KELOLA BERITA */}
      {activeTab === "berita" &&
        (viewBerita === "form" ? (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={saveBeritaData}
              className="lg:col-span-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>{" "}
                  Form Tulis Berita
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    fetchBeritaList();
                    setViewBerita("list");
                  }}
                  className="bg-slate-100 text-blue-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Lihat Daftar Berita &rarr;
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Judul Berita
                  </label>
                  <input
                    type="text"
                    name="judul"
                    value={beritaData.judul}
                    onChange={handleBeritaChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      URL Gambar Cover
                    </label>
                    <input
                      type="text"
                      name="imgUrl"
                      value={beritaData.imgUrl}
                      onChange={handleBeritaChange}
                      required
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Kategori
                    </label>
                    <select
                      name="kategori"
                      value={beritaData.kategori}
                      onChange={handleBeritaChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none"
                    >
                      <option value="Siaran Pers">Siaran Pers</option>
                      <option value="Kegiatan">Kegiatan</option>
                      <option value="Opini">Opini</option>
                    </select>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Bidang / Penyelenggara
                    </label>
                    <input
                      type="text"
                      name="bidang"
                      value={beritaData.bidang}
                      onChange={handleBeritaChange}
                      placeholder="Contoh: Bidang Sosial"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Penulis / Koordinator
                    </label>
                    <input
                      type="text"
                      name="koordinator"
                      value={beritaData.koordinator}
                      onChange={handleBeritaChange}
                      placeholder="Contoh: Humas IKA"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Isi Berita
                  </label>
                  <textarea
                    name="isi"
                    value={beritaData.isi}
                    onChange={handleBeritaChange}
                    required
                    rows={10}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none leading-relaxed"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isSavingBerita}
                  className="bg-blue-900 text-white font-bold py-3.5 px-8 rounded-xl w-full hover:bg-blue-950 shadow-lg transition-transform hover:-translate-y-1"
                >
                  {isSavingBerita ? "Menerbitkan..." : "📢 Terbitkan Berita"}
                </button>
              </div>
            </form>
            <div className="lg:col-span-4 sticky top-28 hidden lg:block">
              <h4 className="text-center text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
                Preview Kartu Berita
              </h4>
              <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 flex flex-col relative pointer-events-none">
                <div className="aspect-[16/10] bg-slate-200 overflow-hidden relative">
                  <span className="absolute top-4 left-4 bg-white text-blue-950 text-[10px] font-black px-4 py-1.5 rounded-sm z-20 uppercase tracking-widest shadow-md">
                    {beritaData.kategori || "Kategori"}
                  </span>
                  <img
                    src={
                      beritaData.imgUrl ||
                      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop"
                    }
                    alt="Cover Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-[10px] text-slate-400 mb-3 font-bold uppercase tracking-wide flex items-center gap-2">
                    <span className="text-yellow-600">Hari ini</span>
                    <span>—</span>
                    <span className="line-clamp-1">
                      {beritaData.koordinator || "Penulis"}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-blue-950 mb-3 leading-snug line-clamp-2">
                    {beritaData.judul ||
                      "Judul berita akan tampil di sini menyesuaikan isi yang diketik..."}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {beritaData.isi ||
                      "Isi paragraf berita preview akan terlihat sebagian di sini sebagai cuplikan..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-blue-900">
                Daftar Berita Terbit
              </h3>
              <button
                onClick={() => setViewBerita("form")}
                className="bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-950 transition-colors"
              >
                + Tulis Berita Baru
              </button>
            </div>
            <div className="space-y-4">
              {beritaList.length === 0 && (
                <p className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed">
                  Belum ada berita yang diterbitkan.
                </p>
              )}
              {beritaList.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-5 border border-slate-100 rounded-xl hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex gap-5 items-center w-full">
                    <img
                      src={item.imgUrl}
                      alt="cover"
                      className="w-20 h-20 object-cover rounded-xl bg-slate-100 shadow-sm"
                    />
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                          {item.kategori}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="font-bold text-blue-950 text-lg leading-snug mb-1 line-clamp-1">
                        {item.judul}
                      </h4>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {item.bidang} • {item.koordinator}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteBerita(item.id)}
                    className="shrink-0 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors border border-red-100"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* TAB 3: KELOLA AGENDA */}
      {activeTab === "agenda" &&
        (viewAgenda === "form" ? (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={saveAgendaData}
              className="lg:col-span-8 bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>
                  {editingAgendaId
                    ? "Edit Agenda Kegiatan"
                    : "Form Tambah Agenda"}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    fetchAgendaList();
                    setViewAgenda("list");
                    setEditingAgendaId(null);
                    setAgendaData(defaultAgendaData);
                  }}
                  className="bg-slate-100 text-blue-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Lihat Daftar Agenda &rarr;
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Judul Agenda
                  </label>
                  <input
                    type="text"
                    name="judul"
                    value={agendaData.judul}
                    onChange={handleAgendaChange}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center gap-3 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <input
                    type="checkbox"
                    id="isComingSoon"
                    name="isComingSoon"
                    checked={agendaData.isComingSoon}
                    onChange={handleAgendaChange}
                    className="w-5 h-5 text-blue-900 rounded border-gray-300 focus:ring-blue-900"
                  />
                  <label
                    htmlFor="isComingSoon"
                    className="text-sm font-bold text-yellow-800 cursor-pointer select-none"
                  >
                    Tandai agenda sebagai "Coming Soon" (Tanggal & Waktu belum
                    ditentukan)
                  </label>
                </div>

                <div className="grid md:grid-cols-4 gap-6">
                  <div className={agendaData.isComingSoon ? "opacity-50" : ""}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      name="tanggal"
                      value={agendaData.tanggal}
                      onChange={handleAgendaChange}
                      required={!agendaData.isComingSoon}
                      disabled={agendaData.isComingSoon}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl disabled:bg-slate-200 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className={agendaData.isComingSoon ? "opacity-50" : ""}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Waktu
                    </label>
                    <input
                      type="time"
                      name="waktu"
                      value={agendaData.waktu}
                      onChange={handleAgendaChange}
                      required={!agendaData.isComingSoon}
                      disabled={agendaData.isComingSoon}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl disabled:bg-slate-200 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Tiket
                    </label>
                    <select
                      name="tiket"
                      value={agendaData.tiket}
                      onChange={handleAgendaChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Gratis (Free)">Gratis (Free)</option>
                      <option value="Berbayar (Pay)">Berbayar (Pay)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Format
                    </label>
                    <select
                      name="format"
                      value={agendaData.format}
                      onChange={handleAgendaChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Offline (Luring)">Offline (Luring)</option>
                      <option value="Online (Zoom/YT)">Online (Zoom/YT)</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Bidang Penyelenggara
                    </label>
                    <input
                      type="text"
                      name="bidang"
                      value={agendaData.bidang}
                      onChange={handleAgendaChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Nama PIC
                    </label>
                    <input
                      type="text"
                      name="koordinator"
                      value={agendaData.koordinator}
                      onChange={handleAgendaChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      URL Poster (Opsional)
                    </label>
                    <input
                      type="text"
                      name="imgUrl"
                      value={agendaData.imgUrl}
                      onChange={handleAgendaChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div className={agendaData.isComingSoon ? "opacity-50" : ""}>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Link Gmaps / Zoom (Opsional)
                    </label>
                    <input
                      type="text"
                      name="link"
                      value={agendaData.link}
                      onChange={handleAgendaChange}
                      disabled={agendaData.isComingSoon}
                      placeholder="https://gmaps... / https://zoom..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl disabled:bg-slate-200 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Link Google Form (Opsional)
                    </label>
                    <input
                      type="url"
                      name="linkGForm"
                      value={agendaData.linkGForm}
                      onChange={handleAgendaChange}
                      placeholder="Contoh: https://forms.gle/..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Link CSV Google Form (Opsional)
                    </label>
                    <input
                      type="url"
                      name="linkCsv"
                      value={agendaData.linkCsv}
                      onChange={handleAgendaChange}
                      placeholder="Contoh: https://docs.google.../pub?output=csv"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none transition-all text-sm"
                    />
                  </div>
                </div>

                {/* --- FITUR EKSTRA (TWIBBON & DONASI) --- */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                  <h4 className="font-bold text-blue-950 border-b border-slate-200 pb-2">
                    Fitur Ekstra Acara (Opsional)
                  </h4>

                  {/* FITUR TWIBBON */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isTwibbonActive"
                        name="isTwibbonActive"
                        checked={agendaData.isTwibbonActive}
                        onChange={handleAgendaChange}
                        className="w-5 h-5 text-blue-900 rounded border-gray-300 focus:ring-blue-900"
                      />
                      <label
                        htmlFor="isTwibbonActive"
                        className="text-sm font-bold text-slate-700 cursor-pointer select-none"
                      >
                        Aktifkan Fitur Twibbon untuk Agenda ini (1080x1920)
                      </label>
                    </div>
                    {agendaData.isTwibbonActive && (
                      <div className="pl-8 animate-in fade-in slide-in-from-top-2">
                        <input
                          type="url"
                          name="twibbonUrl"
                          value={agendaData.twibbonUrl}
                          onChange={handleAgendaChange}
                          placeholder="Masukkan URL Template Twibbon (.png Transparan resolusi 1080x1920)"
                          className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                          required={agendaData.isTwibbonActive}
                        />
                      </div>
                    )}
                  </div>

                  {/* FITUR DONASI */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isDonasiActive"
                        name="isDonasiActive"
                        checked={agendaData.isDonasiActive}
                        onChange={handleAgendaChange}
                        className="w-5 h-5 text-blue-900 rounded border-gray-300 focus:ring-blue-900"
                      />
                      <label
                        htmlFor="isDonasiActive"
                        className="text-sm font-bold text-slate-700 cursor-pointer select-none"
                      >
                        Aktifkan Kolom Donasi / Doorprice untuk Agenda ini
                      </label>
                    </div>

                    {agendaData.isDonasiActive && (
                      <div className="pl-8 pt-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                        {/* INPUT DESKRIPSI & ALAMAT DONASI BARU */}
                        <div className="grid md:grid-cols-2 gap-4 border-b border-slate-200 pb-4 mb-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Pesan/Deskripsi Ajakan Donasi
                            </label>
                            <textarea
                              name="deskripsiDonasi"
                              value={agendaData.deskripsiDonasi}
                              onChange={handleAgendaChange}
                              placeholder="Contoh: Dukungan Anda sangat berarti untuk kesuksesan acara kita bersama."
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                              rows={2}
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Alamat Pengiriman Barang
                            </label>
                            <textarea
                              name="alamatDonasi"
                              value={agendaData.alamatDonasi}
                              onChange={handleAgendaChange}
                              placeholder="Contoh: Sekretariat DPW IKA UII, Jl. Kaliurang..."
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                              rows={2}
                            ></textarea>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Nama Bank
                            </label>
                            <input
                              type="text"
                              name="bankDonasi"
                              value={agendaData.bankDonasi}
                              onChange={handleAgendaChange}
                              placeholder="Contoh: BSI"
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                              required={agendaData.isDonasiActive}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Nomor Rekening
                            </label>
                            <input
                              type="text"
                              name="rekeningDonasi"
                              value={agendaData.rekeningDonasi}
                              onChange={handleAgendaChange}
                              placeholder="Contoh: 1234567890"
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm font-mono"
                              required={agendaData.isDonasiActive}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">
                              Atas Nama (A.N)
                            </label>
                            <input
                              type="text"
                              name="atasNamaDonasi"
                              value={agendaData.atasNamaDonasi}
                              onChange={handleAgendaChange}
                              placeholder="Contoh: DPW IKA UII"
                              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                              required={agendaData.isDonasiActive}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">
                            Nomor WA Konfirmasi Donasi (Tanpa '0' atau '+62',
                            misal: 812345678)
                          </label>
                          <input
                            type="number"
                            name="waDonasi"
                            value={agendaData.waDonasi}
                            onChange={handleAgendaChange}
                            placeholder="Contoh: 81234567890"
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-900 outline-none text-sm"
                            required={agendaData.isDonasiActive}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* -------------------------------------- */}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Deskripsi Agenda
                  </label>
                  <textarea
                    name="deskripsi"
                    value={agendaData.deskripsi}
                    onChange={handleAgendaChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl leading-relaxed"
                  ></textarea>
                </div>

                <div className="flex gap-4">
                  {editingAgendaId && (
                    <button
                      type="button"
                      onClick={() => {
                        setAgendaData(defaultAgendaData);
                        setEditingAgendaId(null);
                        setViewAgenda("list");
                      }}
                      className="bg-slate-200 text-slate-700 font-bold py-3.5 px-8 rounded-xl hover:bg-slate-300 transition-all"
                    >
                      Batal Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSavingAgenda}
                    className="flex-1 bg-blue-900 text-white font-bold py-3.5 px-8 rounded-xl hover:bg-blue-950 shadow-lg transition-transform hover:-translate-y-1"
                  >
                    {isSavingAgenda
                      ? "Memproses..."
                      : editingAgendaId
                        ? "💾 Simpan Perubahan"
                        : "📅 Publikasikan Agenda"}
                  </button>
                </div>
              </div>
            </form>

            <div className="lg:col-span-4 sticky top-28 hidden lg:block">
              <h4 className="text-center text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
                Preview Kartu Agenda
              </h4>
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-lg pointer-events-none">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 bg-white shadow-sm text-blue-950 rounded-xl flex flex-col items-center justify-center shrink-0 border-2 border-yellow-400">
                    <span className="text-[9px] font-black uppercase tracking-widest">
                      {agendaData.isComingSoon
                        ? "CMG"
                        : agendaData.tanggal
                          ? agendaData.tanggal.split("-")[1]
                          : "BLN"}
                    </span>
                    <span className="text-xl font-black leading-none mt-0.5">
                      {agendaData.isComingSoon
                        ? "SOON"
                        : agendaData.tanggal
                          ? agendaData.tanggal.split("-")[2]
                          : "00"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 leading-tight mb-1">
                      {agendaData.judul || "Nama Agenda Muncul Disini"}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold bg-white inline-block px-2 py-0.5 border rounded">
                      ⏰{" "}
                      {agendaData.isComingSoon
                        ? "Segera Hadir"
                        : (agendaData.waktu || "00:00") + " WIB"}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-3 mb-6 leading-relaxed">
                  {agendaData.deskripsi ||
                    "Detail singkat mengenai acara, siapa sasarannya, dan apa outputnya akan tampil di area ini..."}
                </p>
                <div className="flex gap-2 mb-4">
                  {agendaData.isTwibbonActive && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-1 rounded">
                      Ada Twibbon
                    </span>
                  )}
                  {agendaData.isDonasiActive && (
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-1 rounded">
                      Ada Donasi
                    </span>
                  )}
                </div>
                <div className="w-full text-center py-2 bg-blue-950 text-white font-bold rounded-lg text-xs">
                  Informasi Detail
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-blue-900">Daftar Agenda</h3>
              <button
                onClick={() => {
                  setAgendaData(defaultAgendaData);
                  setEditingAgendaId(null);
                  setViewAgenda("form");
                }}
                className="bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-950 transition-colors"
              >
                + Buat Agenda Baru
              </button>
            </div>
            <div className="space-y-4">
              {agendaList.length === 0 && (
                <p className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed">
                  Belum ada agenda acara.
                </p>
              )}
              {agendaList.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-5 border border-slate-100 rounded-xl hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex gap-5 items-center w-full">
                    <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-xl flex flex-col items-center justify-center shrink-0 border border-blue-100">
                      <span className="text-[10px] font-bold uppercase">
                        {item.isComingSoon
                          ? "CMG"
                          : item.tanggal
                            ? item.tanggal.split("-")[1]
                            : ""}
                      </span>
                      <span className="text-xl font-black leading-none mt-0.5">
                        {item.isComingSoon
                          ? "SOON"
                          : item.tanggal
                            ? item.tanggal.split("-")[2]
                            : ""}
                      </span>
                    </div>
                    <div className="flex-1 pr-4">
                      <h4 className="font-bold text-blue-950 text-lg leading-snug mb-1 line-clamp-1">
                        {item.judul}
                      </h4>
                      <p className="text-sm text-slate-500 mb-1">
                        {item.isComingSoon
                          ? "⏰ Segera Hadir"
                          : `⏰ ${item.waktu} WIB`}{" "}
                        • {item.format} • {item.bidang}
                      </p>
                      <div className="flex gap-1.5">
                        {item.isTwibbonActive && (
                          <span className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5 rounded border border-blue-100">
                            Twibbon
                          </span>
                        )}
                        {item.isDonasiActive && (
                          <span className="bg-green-50 text-green-600 text-[10px] px-1.5 py-0.5 rounded border border-green-100">
                            Donasi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleEditAgenda(item)}
                      className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors border border-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteAgenda(item.id)}
                      className="bg-red-50 text-red-600 hover:bg-red-500 hover:text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-colors border border-red-100"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* TAB 4: KELOLA GALERI FOTO (SAMA SEPERTI SEBELUMNYA) */}
      {activeTab === "galeri" &&
        (viewGaleri === "form" ? (
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <form
              onSubmit={saveGaleriData}
              className="lg:col-span-6 bg-white rounded-2xl p-8 shadow-sm border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                  <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>{" "}
                  Upload Foto Galeri
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    fetchGaleriList();
                    setViewGaleri("list");
                  }}
                  className="bg-slate-100 text-blue-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  Lihat Galeri &rarr;
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nama/Judul Kegiatan
                  </label>
                  <input
                    type="text"
                    name="judul"
                    value={galeriData.judul}
                    onChange={handleGaleriChange}
                    required
                    placeholder="Contoh: Rapat Kerja Daerah 2026"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tanggal Kegiatan
                  </label>
                  <input
                    type="text"
                    name="tanggal"
                    value={galeriData.tanggal}
                    onChange={handleGaleriChange}
                    required
                    placeholder="Contoh: 15 Agustus 2026"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    URL Gambar / Foto
                  </label>
                  <input
                    type="text"
                    name="imgUrl"
                    value={galeriData.imgUrl}
                    onChange={handleGaleriChange}
                    required
                    placeholder="https://..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingGaleri}
                  className="bg-blue-900 text-white font-bold py-3.5 px-8 rounded-xl w-full hover:bg-blue-950 shadow-lg transition-transform hover:-translate-y-1"
                >
                  {isSavingGaleri ? "Menyimpan..." : "📸 Upload ke Galeri"}
                </button>
              </div>
            </form>

            <div className="lg:col-span-6 hidden lg:block">
              <h4 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest">
                Preview Tampilan
              </h4>
              <div className="relative aspect-square rounded-3xl overflow-hidden group shadow-2xl border-4 border-white max-w-sm">
                <img
                  src={
                    galeriData.imgUrl ||
                    "https://images.unsplash.com/photo-1511649475669-e288648b2339?q=80&w=600&auto=format&fit=crop"
                  }
                  alt="Galeri Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-900/20 to-transparent flex flex-col justify-end p-8">
                  <p className="text-white font-bold text-2xl leading-snug">
                    {galeriData.judul || "Judul Dokumentasi Kegiatan"}
                  </p>
                  <p className="text-yellow-400 text-sm font-bold mt-2">
                    {galeriData.tanggal || "Tanggal Acara"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-blue-900">
                Koleksi Galeri Utama
              </h3>
              <button
                onClick={() => setViewGaleri("form")}
                className="bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-950 transition-colors"
              >
                + Upload Foto Baru
              </button>
            </div>
            {galeriList.length === 0 ? (
              <p className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed">
                Belum ada foto di galeri.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {galeriList.map((item) => (
                  <div
                    key={item.id}
                    className="relative aspect-square rounded-xl overflow-hidden shadow-sm border border-slate-200 group"
                  >
                    <img
                      src={item.imgUrl}
                      alt="galeri"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-white text-xs font-bold mb-2 line-clamp-2">
                        {item.judul}
                      </p>
                      <button
                        onClick={() => deleteGaleri(item.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

      {/* TAB 5: DONASI DENGAN FILTER AGENDA */}
      {activeTab === "donasi" && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
              <span className="w-2 h-6 bg-yellow-500 rounded-full"></span>{" "}
              Daftar Donasi & Verifikasi
            </h3>

            {/* DROPDOWN FILTER AGENDA */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedAgendaDonasi}
                onChange={(e) => setSelectedAgendaDonasi(e.target.value)}
                className="flex-1 sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none"
              >
                <option value="all">Semua Agenda</option>
                {agendaList
                  .filter((a) => a.isDonasiActive)
                  .map((agenda) => (
                    <option key={agenda.id} value={agenda.id}>
                      {agenda.judul}
                    </option>
                  ))}
              </select>
              <button
                onClick={fetchDonasiList}
                className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors shrink-0"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {isLoadingDonasi ? (
            <div className="text-center py-10 text-slate-500 font-bold animate-pulse">
              Memuat data donasi...
            </div>
          ) : filteredDonasiList.length === 0 ? (
            <p className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed">
              Belum ada data donasi masuk untuk agenda ini.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-widest border-b border-slate-200">
                    <th className="p-4 rounded-tl-xl w-[15%]">Tanggal</th>
                    <th className="p-4 w-[20%]">Donatur</th>
                    <th className="p-4 w-[25%]">Untuk Agenda</th>
                    <th className="p-4 w-[20%]">Jenis & Detail</th>
                    <th className="p-4 text-center w-[10%]">Status</th>
                    <th className="p-4 rounded-tr-xl text-right w-[10%]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredDonasiList.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 text-slate-500 text-xs">
                        {new Date(item.waktu).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-4 font-bold text-blue-950">
                        {item.nama}
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-200 text-slate-700 text-[10px] px-2 py-1 rounded font-bold line-clamp-2">
                          {item.agendaJudul || "Agenda Umum"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase mb-1 ${item.jenis === "Uang" ? "bg-green-100 text-green-700" : "bg-purple-100 text-purple-700"}`}
                        >
                          {item.jenis}
                        </span>
                        <div className="font-bold text-slate-700">
                          {item.jenis === "Uang" ? (
                            new Intl.NumberFormat("id-ID", {
                              style: "currency",
                              currency: "IDR",
                              maximumFractionDigits: 0,
                            }).format(item.nominal)
                          ) : (
                            <span className="text-xs line-clamp-2">
                              {item.deskripsiBarang}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                            item.status === "Terverifikasi"
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                          }`}
                        >
                          {item.status === "Terverifikasi" ? "✅ " : "⏳ "}
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.status !== "Terverifikasi" && (
                            <button
                              onClick={() => verifyDonasi(item.id)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors shadow-sm whitespace-nowrap"
                            >
                              Verifikasi
                            </button>
                          )}
                          <button
                            onClick={() => deleteDonasi(item.id)}
                            className="bg-red-50 hover:bg-red-500 text-red-600 hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors border border-red-100 whitespace-nowrap"
                          >
                            Hapus
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
      )}
    </div>
  );
}
