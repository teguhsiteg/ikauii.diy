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

// --- IKON PROFESIONAL ---
const IconSettings = () => (
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
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const IconNews = () => (
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
      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
    />
  </svg>
);
const IconCalendar = () => (
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const IconGallery = () => (
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
      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const IconVerify = () => (
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
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconTrash = () => (
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
);
const IconEdit = () => (
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
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

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
    slug: "",
    tanggal: "",
    waktu: "",
    tiket: "Gratis (Free)",
    format: "Offline (Luring)",
    imgUrl: "",
    link: "",
    linkGForm: "",
    linkCsv: "",
    linkEksternal: "", // 🌟 BARU: Link Khusus Web External / VR
    deskripsi: "",
    bidang: "Bidang Organisasi",
    koordinator: "",
    isComingSoon: false,
    // FITUR EKSTRA TWIBBON
    isTwibbonActive: false,
    twibbonUrl: "",
    twibbonUrlSquare: "",
    // FITUR EKSTRA DONASI
    isDonasiActive: false,
    bankDonasi: "",
    rekeningDonasi: "",
    atasNamaDonasi: "",
    waDonasi: "",
    deskripsiDonasi: "",
    alamatDonasi: "",
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
      slug: agenda.slug || "",
      tanggal: agenda.tanggal || "",
      waktu: agenda.waktu || "",
      tiket: agenda.tiket || "Gratis (Free)",
      format: agenda.format || "Offline (Luring)",
      imgUrl: agenda.imgUrl || "",
      link: agenda.link || "",
      linkGForm: agenda.linkGForm || "",
      linkCsv: agenda.linkCsv || "",
      linkEksternal: agenda.linkEksternal || "", // 🌟 Bind data eksternal
      deskripsi: agenda.deskripsi || "",
      bidang: agenda.bidang || "Bidang Organisasi",
      koordinator: agenda.koordinator || "",
      isComingSoon: agenda.isComingSoon || false,
      isTwibbonActive: agenda.isTwibbonActive || false,
      twibbonUrl: agenda.twibbonUrl || "",
      twibbonUrlSquare: agenda.twibbonUrlSquare || "",
      isDonasiActive: agenda.isDonasiActive || false,
      bankDonasi: agenda.bankDonasi || "",
      rekeningDonasi: agenda.rekeningDonasi || "",
      atasNamaDonasi: agenda.atasNamaDonasi || "",
      waDonasi: agenda.waDonasi || "",
      deskripsiDonasi: agenda.deskripsiDonasi || "",
      alamatDonasi: agenda.alamatDonasi || "",
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
      let sourceText = agendaData.slug ? agendaData.slug : agendaData.judul;
      let customSlug = sourceText
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
    if (
      confirm("Peringatan: Yakin ingin menghapus berita ini secara permanen?")
    ) {
      await deleteDoc(doc(db, "berita", id));
      fetchBeritaList();
    }
  };

  const deleteAgenda = async (id: string) => {
    if (
      confirm("Peringatan: Yakin ingin menghapus agenda ini secara permanen?")
    ) {
      await deleteDoc(doc(db, "agenda", id));
      fetchAgendaList();
    }
  };

  const deleteGaleri = async (id: string) => {
    if (confirm("Peringatan: Yakin ingin menghapus foto galeri ini?")) {
      await deleteDoc(doc(db, "galeri", id));
      fetchGaleriList();
    }
  };

  const verifyDonasi = async (id: string) => {
    if (
      confirm(
        "Konfirmasi: Nominal akan diverifikasi dan ditambahkan ke Total Publik.",
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
    if (confirm("Peringatan Keras: Hapus data donasi ini permanen?")) {
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

  const TABS = [
    { id: "utama", label: "Landing Page", icon: <IconSettings /> },
    { id: "berita", label: "Berita & Rilis", icon: <IconNews /> },
    { id: "agenda", label: "Agenda Acara", icon: <IconCalendar /> },
    { id: "galeri", label: "Galeri Dokumentasi", icon: <IconGallery /> },
    { id: "donasi", label: "Verifikasi Donasi", icon: <IconVerify /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-sans selection:bg-blue-100 selection:text-blue-900 pt-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-[10px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-widest border border-blue-200">
            <IconSettings /> Content Management System
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Pengaturan Web & Konten
          </h1>
          <p className="text-slate-500 text-sm md:text-base max-w-2xl">
            Kelola seluruh aset digital, publikasi berita, agenda kegiatan,
            galeri, dan verifikasi donasi untuk halaman web publik secara
            terpusat.
          </p>
        </div>

        {/* MODERN NAVIGATION TABS */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 p-1.5 bg-slate-100/80 border border-slate-200/60 rounded-xl w-fit">
          {TABS.map((tab) => (
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
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* NOTIFICATION BUBBLE */}
        {message.text && (
          <div
            className={`p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-3 shadow-sm border animate-in fade-in slide-in-from-top-2 ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
          >
            {message.type === "success" ? (
              <div className="bg-emerald-100 p-1 rounded-full text-emerald-600">
                <svg
                  className="w-4 h-4"
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
            ) : (
              <div className="bg-rose-100 p-1 rounded-full text-rose-600">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
            )}
            {message.text}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: PENGATURAN UTAMA                                   */}
        {/* ========================================================= */}
        {activeTab === "utama" && (
          <form onSubmit={saveLandingData} className="space-y-6 max-w-4xl">
            {isLoadingLanding ? (
              <div className="p-10 text-center animate-pulse text-slate-500 font-bold">
                Sinkronisasi data dengan server...
              </div>
            ) : (
              <>
                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    Spanduk Utama (Hero Section)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Judul Utama (Baris 1)
                      </label>
                      <input
                        type="text"
                        name="heroTitle"
                        value={landingData.heroTitle}
                        onChange={handleLandingChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Teks Sorotan (Warna Kuning)
                      </label>
                      <input
                        type="text"
                        name="heroHighlight"
                        value={landingData.heroHighlight}
                        onChange={handleLandingChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Deskripsi Singkat
                    </label>
                    <textarea
                      name="heroDesc"
                      rows={3}
                      value={landingData.heroDesc}
                      onChange={handleLandingChange}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all leading-relaxed custom-scrollbar"
                      required
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      URL Gambar Latar Belakang
                    </label>
                    <input
                      type="text"
                      name="heroBgUrl"
                      value={landingData.heroBgUrl}
                      onChange={handleLandingChange}
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    Media Profil (Tentang Kami)
                  </h3>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Link Gambar atau Video YouTube
                    </label>
                    <input
                      type="text"
                      name="profilImgUrl"
                      value={landingData.profilImgUrl}
                      onChange={handleLandingChange}
                      placeholder="Contoh: https://www.youtube.com/watch?v=XXXXXX"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-mono"
                    />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
                    Informasi Rekening Umum (Footer)
                  </h3>
                  <div className="grid md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Nama Bank
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={landingData.bankName}
                        onChange={handleLandingChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Nomor Rekening
                      </label>
                      <input
                        type="text"
                        name="bankNumber"
                        value={landingData.bankNumber}
                        onChange={handleLandingChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Atas Nama (A.N)
                      </label>
                      <input
                        type="text"
                        name="bankOwner"
                        value={landingData.bankOwner}
                        onChange={handleLandingChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingLanding}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingLanding ? "Menyimpan..." : "Simpan Pengaturan"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* ========================================================= */}
        {/* TAB 2: KELOLA BERITA                                      */}
        {/* ========================================================= */}
        {activeTab === "berita" &&
          (viewBerita === "form" ? (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <form
                onSubmit={saveBeritaData}
                className="lg:col-span-8 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200"
              >
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Tulis Publikasi Baru
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      fetchBeritaList();
                      setViewBerita("list");
                    }}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Lihat Daftar Publikasi &rarr;
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Judul Publikasi
                    </label>
                    <input
                      type="text"
                      name="judul"
                      value={beritaData.judul}
                      onChange={handleBeritaChange}
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-5">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        URL Gambar Cover
                      </label>
                      <input
                        type="text"
                        name="imgUrl"
                        value={beritaData.imgUrl}
                        onChange={handleBeritaChange}
                        required
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Kategori
                      </label>
                      <select
                        name="kategori"
                        value={beritaData.kategori}
                        onChange={handleBeritaChange}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold text-slate-800 cursor-pointer transition-all"
                      >
                        <option value="Siaran Pers">Siaran Pers</option>
                        <option value="Kegiatan">Kegiatan</option>
                        <option value="Opini">Opini</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Bidang / Penyelenggara
                      </label>
                      <input
                        type="text"
                        name="bidang"
                        value={beritaData.bidang}
                        onChange={handleBeritaChange}
                        placeholder="Contoh: Bidang Sosial"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Penulis / Koordinator
                      </label>
                      <input
                        type="text"
                        name="koordinator"
                        value={beritaData.koordinator}
                        onChange={handleBeritaChange}
                        placeholder="Contoh: Humas IKA"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Isi Konten
                    </label>
                    <textarea
                      name="isi"
                      value={beritaData.isi}
                      onChange={handleBeritaChange}
                      required
                      rows={12}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed text-sm transition-all custom-scrollbar"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingBerita}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isSavingBerita ? "Menerbitkan..." : "Terbitkan Publikasi"}
                  </button>
                </div>
              </form>

              {/* LIVE PREVIEW KARTU BERITA */}
              <div className="lg:col-span-4 sticky top-28 hidden lg:block">
                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest px-2">
                  Preview Tampilan Public
                </h4>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 flex flex-col pointer-events-none">
                  <div className="aspect-[16/10] bg-slate-100 overflow-hidden relative">
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full z-20 uppercase tracking-widest shadow-sm border border-white/50">
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
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="text-[10px] text-slate-400 mb-2 font-bold uppercase tracking-wide flex items-center gap-1.5">
                      <span className="text-blue-600">Hari ini</span>
                      <span>•</span>
                      <span className="line-clamp-1">
                        {beritaData.koordinator || "Penulis"}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900 mb-2 leading-snug line-clamp-2">
                      {beritaData.judul ||
                        "Judul publikasi akan tampil di sini..."}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {beritaData.isi ||
                        "Cuplikan paragraf berita akan terlihat sebagian di area ini untuk menarik perhatian pembaca..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Daftar Publikasi Terbit
                </h3>
                <button
                  onClick={() => setViewBerita("form")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                >
                  Tulis Baru
                </button>
              </div>
              <div className="space-y-3">
                {beritaList.length === 0 && (
                  <p className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                    Belum ada publikasi.
                  </p>
                )}
                {beritaList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors gap-4"
                  >
                    <div className="flex gap-4 items-center min-w-0">
                      <img
                        src={item.imgUrl}
                        alt="cover"
                        className="w-16 h-16 object-cover rounded-lg bg-slate-100 border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-100 uppercase tracking-wider">
                            {item.kategori}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {new Date(item.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-0.5 truncate">
                          {item.judul}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {item.bidang} • {item.koordinator}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteBerita(item.id)}
                      className="shrink-0 bg-white hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-200 hover:border-rose-200 shadow-sm flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                      <IconTrash /> Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* ========================================================= */}
        {/* TAB 3: KELOLA AGENDA                                      */}
        {/* ========================================================= */}
        {activeTab === "agenda" &&
          (viewAgenda === "form" ? (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <form
                onSubmit={saveAgendaData}
                className="lg:col-span-8 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200"
              >
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {editingAgendaId
                      ? "Edit Agenda Kegiatan"
                      : "Buat Agenda Baru"}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      fetchAgendaList();
                      setViewAgenda("list");
                      setEditingAgendaId(null);
                      setAgendaData(defaultAgendaData);
                    }}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Lihat Daftar Agenda &rarr;
                  </button>
                </div>

                <div className="space-y-6">
                  {/* DETAIL DASAR */}
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Judul Agenda
                      </label>
                      <input
                        type="text"
                        name="judul"
                        value={agendaData.judul}
                        onChange={handleAgendaChange}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                        Custom Link / URL Pendek (Opsional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                          ika-diy.com/agenda/
                        </span>
                        <input
                          type="text"
                          name="slug"
                          value={agendaData.slug}
                          onChange={handleAgendaChange}
                          placeholder="raker-2026"
                          className="w-full pl-[150px] pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-blue-700 font-mono text-sm transition-all"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        Kosongkan jika ingin dibuat otomatis berdasarkan judul.
                      </p>
                    </div>

                    {/* 🌟 BARU: KOLOM INPUT VIRTUAL RUN / EXTERNAL LINK */}
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mt-2">
                      <label className="block text-xs font-bold text-blue-900 uppercase tracking-wide mb-1.5">
                        URL Pendaftaran Khusus / Web Eksternal
                      </label>
                      <input
                        type="url"
                        name="linkEksternal"
                        value={agendaData.linkEksternal}
                        onChange={handleAgendaChange}
                        placeholder="Masukkan link disini"
                        className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      />
                      <p className="text-[10px] text-blue-600 mt-1.5 font-medium">
                        💡 Kosongkan jika menggunakan form pendaftaran standar.
                        Jika diisi, form registrasi bawaan web akan
                        disembunyikan dan diganti dengan tombol khusus menuju
                        link ini.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <input
                        type="checkbox"
                        id="isComingSoon"
                        name="isComingSoon"
                        checked={agendaData.isComingSoon}
                        onChange={handleAgendaChange}
                        className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                      />
                      <label
                        htmlFor="isComingSoon"
                        className="text-xs font-bold text-amber-800 cursor-pointer select-none"
                      >
                        Tandai sebagai "Coming Soon" (Waktu & Tanggal
                        dirahasiakan)
                      </label>
                    </div>

                    <div className="grid md:grid-cols-4 gap-5">
                      <div
                        className={
                          agendaData.isComingSoon
                            ? "opacity-40 pointer-events-none"
                            : ""
                        }
                      >
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Tanggal
                        </label>
                        <input
                          type="date"
                          name="tanggal"
                          value={agendaData.tanggal}
                          onChange={handleAgendaChange}
                          required={!agendaData.isComingSoon}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div
                        className={
                          agendaData.isComingSoon
                            ? "opacity-40 pointer-events-none"
                            : ""
                        }
                      >
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Waktu
                        </label>
                        <input
                          type="time"
                          name="waktu"
                          value={agendaData.waktu}
                          onChange={handleAgendaChange}
                          required={!agendaData.isComingSoon}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Tiket
                        </label>
                        <select
                          name="tiket"
                          value={agendaData.tiket}
                          onChange={handleAgendaChange}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          <option value="Gratis (Free)">Gratis (Free)</option>
                          <option value="Berbayar (Pay)">Berbayar (Pay)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Format
                        </label>
                        <select
                          name="format"
                          value={agendaData.format}
                          onChange={handleAgendaChange}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                        >
                          <option value="Offline (Luring)">
                            Offline (Luring)
                          </option>
                          <option value="Online (Zoom/YT)">
                            Online (Zoom/YT)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Penyelenggara
                        </label>
                        <input
                          type="text"
                          name="bidang"
                          value={agendaData.bidang}
                          onChange={handleAgendaChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Nama PIC
                        </label>
                        <input
                          type="text"
                          name="koordinator"
                          value={agendaData.koordinator}
                          onChange={handleAgendaChange}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          URL Poster
                        </label>
                        <input
                          type="text"
                          name="imgUrl"
                          value={agendaData.imgUrl}
                          onChange={handleAgendaChange}
                          placeholder="https://..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div
                        className={
                          agendaData.isComingSoon
                            ? "opacity-40 pointer-events-none"
                            : ""
                        }
                      >
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Link Gmaps / Zoom
                        </label>
                        <input
                          type="text"
                          name="link"
                          value={agendaData.link}
                          onChange={handleAgendaChange}
                          placeholder="https://..."
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div
                        className={agendaData.linkEksternal ? "opacity-50" : ""}
                      >
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Link G-Form Pendaftaran
                        </label>
                        <input
                          type="url"
                          name="linkGForm"
                          value={agendaData.linkGForm}
                          onChange={handleAgendaChange}
                          placeholder="https://forms.gle/..."
                          disabled={!!agendaData.linkEksternal}
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:cursor-not-allowed"
                        />
                      </div>
                      <div
                        className={agendaData.linkEksternal ? "opacity-50" : ""}
                      >
                        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                          Link CSV G-Form (Untuk Check-in)
                        </label>
                        <input
                          type="url"
                          name="linkCsv"
                          value={agendaData.linkCsv}
                          onChange={handleAgendaChange}
                          disabled={!!agendaData.linkEksternal}
                          placeholder="https://docs.google.../pub?output=csv"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  {/* FITUR EKSTRA: TWIBBON */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                      🎨 Fitur Photobooth / Twibbon
                    </h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isTwibbonActive"
                        name="isTwibbonActive"
                        checked={agendaData.isTwibbonActive}
                        onChange={handleAgendaChange}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="isTwibbonActive"
                        className="text-xs font-bold text-slate-700 cursor-pointer select-none"
                      >
                        Aktifkan Modul Twibbon Interaktif
                      </label>
                    </div>
                    {agendaData.isTwibbonActive && (
                      <div className="pl-7 pt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            URL Bingkai IG Story (9:16)
                          </label>
                          <input
                            type="url"
                            name="twibbonUrl"
                            value={agendaData.twibbonUrl}
                            onChange={handleAgendaChange}
                            placeholder="Resolusi disarankan: 1080x1920 (PNG Transparan)"
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono transition-all"
                            required={agendaData.isTwibbonActive}
                          />
                        </div>
                        {/* 🌟 TAMBAHAN: INPUT TWIBBON SQUARE 1:1 */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            URL Bingkai IG Post (4:5) *Opsional
                          </label>
                          <input
                            type="url"
                            name="twibbonUrlSquare"
                            value={agendaData.twibbonUrlSquare}
                            onChange={handleAgendaChange}
                            placeholder="Resolusi disarankan: 1080x1350 (PNG Transparan)"
                            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-xs font-mono transition-all"
                          />
                          <p className="text-[9px] text-slate-400 mt-1">
                            Jika dikosongkan, sistem akan otomatis menggunakan
                            versi 9:16.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* FITUR EKSTRA: DONASI */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
                      💳 Fitur Penggalangan Dana
                    </h4>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="isDonasiActive"
                        name="isDonasiActive"
                        checked={agendaData.isDonasiActive}
                        onChange={handleAgendaChange}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <label
                        htmlFor="isDonasiActive"
                        className="text-xs font-bold text-slate-700 cursor-pointer select-none"
                      >
                        Aktifkan Modul Penerimaan Donasi/Sponsor
                      </label>
                    </div>
                    {agendaData.isDonasiActive && (
                      <div className="pl-7 pt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Pesan Ajakan (Copywriting)
                            </label>
                            <textarea
                              name="deskripsiDonasi"
                              value={agendaData.deskripsiDonasi}
                              onChange={handleAgendaChange}
                              placeholder="Sampaikan alasan penggalangan dana..."
                              rows={2}
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs transition-all custom-scrollbar"
                            ></textarea>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Alamat Pengiriman Barang
                            </label>
                            <textarea
                              name="alamatDonasi"
                              value={agendaData.alamatDonasi}
                              onChange={handleAgendaChange}
                              placeholder="Alamat lengkap penerimaan doorprice..."
                              rows={2}
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs transition-all custom-scrollbar"
                            ></textarea>
                          </div>
                        </div>
                        <div className="grid md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Nama Bank
                            </label>
                            <input
                              type="text"
                              name="bankDonasi"
                              value={agendaData.bankDonasi}
                              onChange={handleAgendaChange}
                              placeholder="BSI / Mandiri"
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs transition-all"
                              required={agendaData.isDonasiActive}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Nomor Rekening
                            </label>
                            <input
                              type="text"
                              name="rekeningDonasi"
                              value={agendaData.rekeningDonasi}
                              onChange={handleAgendaChange}
                              placeholder="1234567890"
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-mono transition-all"
                              required={agendaData.isDonasiActive}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                              Atas Nama
                            </label>
                            <input
                              type="text"
                              name="atasNamaDonasi"
                              value={agendaData.atasNamaDonasi}
                              onChange={handleAgendaChange}
                              placeholder="A.N Organisasi"
                              className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs transition-all"
                              required={agendaData.isDonasiActive}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                            No. WA Konfirmasi (Contoh: 8123456789)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
                              +62
                            </span>
                            <input
                              type="number"
                              name="waDonasi"
                              value={agendaData.waDonasi}
                              onChange={handleAgendaChange}
                              placeholder="812345678"
                              className="w-full pl-10 pr-3 py-2 bg-white border border-emerald-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-xs font-mono transition-all"
                              required={agendaData.isDonasiActive}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DESKRIPSI AGENDA */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Deskripsi Lengkap Acara
                    </label>
                    <textarea
                      name="deskripsi"
                      value={agendaData.deskripsi}
                      onChange={handleAgendaChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed text-sm transition-all custom-scrollbar"
                    ></textarea>
                  </div>

                  <div className="flex gap-4 pt-2">
                    {editingAgendaId && (
                      <button
                        type="button"
                        onClick={() => {
                          setAgendaData(defaultAgendaData);
                          setEditingAgendaId(null);
                          setViewAgenda("list");
                        }}
                        className="bg-white border border-slate-300 text-slate-700 font-semibold py-3 px-6 rounded-xl hover:bg-slate-50 transition-all text-sm"
                      >
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSavingAgenda}
                      className="flex-1 bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl hover:bg-blue-700 shadow-sm transition-all text-sm disabled:opacity-50"
                    >
                      {isSavingAgenda
                        ? "Memproses Data..."
                        : editingAgendaId
                          ? "Simpan Perubahan Agenda"
                          : "Publikasikan Agenda Baru"}
                    </button>
                  </div>
                </div>
              </form>

              {/* LIVE PREVIEW AGENDA KARTU */}
              <div className="lg:col-span-4 sticky top-28 hidden lg:block">
                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest px-2">
                  Live Preview Card
                </h4>
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm pointer-events-none">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-slate-50 text-slate-800 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {agendaData.isComingSoon
                          ? "CMG"
                          : agendaData.tanggal
                            ? agendaData.tanggal.split("-")[1]
                            : "MTH"}
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
                      <h4 className="font-bold text-slate-900 leading-tight mb-1 line-clamp-2">
                        {agendaData.judul || "Nama Agenda Muncul Disini"}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold bg-slate-100 inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200">
                        <IconCalendar />{" "}
                        {agendaData.isComingSoon
                          ? "Segera Hadir"
                          : (agendaData.waktu || "00:00") + " WIB"}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-5 leading-relaxed">
                    {agendaData.deskripsi ||
                      "Detail singkat mengenai acara, sasarannya, dan apa outputnya akan tampil di area ini..."}
                  </p>
                  <div className="flex gap-2 mb-4">
                    {agendaData.isTwibbonActive && (
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-100">
                        Twibbon
                      </span>
                    )}
                    {agendaData.isDonasiActive && (
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded border border-emerald-100">
                        Donasi
                      </span>
                    )}
                    {/* 🌟 PREVIEW LABEL VIRTUAL RUN/EXTERNAL */}
                    {agendaData.linkEksternal && (
                      <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2 py-1 rounded border border-purple-100">
                        Pendaftaran Khusus
                      </span>
                    )}
                  </div>
                  <div className="w-full text-center py-2 bg-slate-900 text-white font-semibold rounded-lg text-xs">
                    Informasi Detail
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Daftar Agenda Kegiatan
                </h3>
                <button
                  onClick={() => {
                    setAgendaData(defaultAgendaData);
                    setEditingAgendaId(null);
                    setViewAgenda("form");
                  }}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Buat Agenda Baru
                </button>
              </div>
              <div className="space-y-3">
                {agendaList.length === 0 && (
                  <p className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                    Belum ada agenda acara.
                  </p>
                )}
                {agendaList.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors gap-4"
                  >
                    <div className="flex gap-4 items-center min-w-0">
                      <div className="w-14 h-14 bg-white text-slate-800 rounded-xl flex flex-col items-center justify-center shrink-0 border border-slate-200 shadow-sm">
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          {item.isComingSoon
                            ? "CMG"
                            : item.tanggal
                              ? item.tanggal.split("-")[1]
                              : "MTH"}
                        </span>
                        <span className="text-xl font-black leading-none mt-0.5">
                          {item.isComingSoon
                            ? "SOON"
                            : item.tanggal
                              ? item.tanggal.split("-")[2]
                              : "00"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-slate-800 text-sm leading-snug mb-1 truncate">
                          {item.judul}
                        </h4>
                        <p className="text-[11px] text-slate-500 mb-1.5 truncate">
                          {item.isComingSoon
                            ? "Segera Hadir"
                            : `${item.waktu} WIB`}{" "}
                          • {item.format} • {item.bidang}
                        </p>
                        <div className="flex gap-1.5">
                          {item.isTwibbonActive && (
                            <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-100">
                              Twibbon
                            </span>
                          )}
                          {item.isDonasiActive && (
                            <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100">
                              Donasi
                            </span>
                          )}
                          {/* LABEL JIKA PAKAI VIRTUAL RUN / EXTERNAL LINK */}
                          {item.linkEksternal && (
                            <span className="bg-purple-50 text-purple-600 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-100">
                              Pendaftaran Eksternal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => handleEditAgenda(item)}
                        className="flex-1 sm:flex-none bg-white hover:bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-200 hover:border-blue-200 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <IconEdit /> Edit
                      </button>
                      <button
                        onClick={() => deleteAgenda(item.id)}
                        className="flex-1 sm:flex-none bg-white hover:bg-rose-50 text-rose-600 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border border-slate-200 hover:border-rose-200 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <IconTrash /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

        {/* ========================================================= */}
        {/* TAB 4: KELOLA GALERI FOTO                                 */}
        {/* ========================================================= */}
        {activeTab === "galeri" &&
          (viewGaleri === "form" ? (
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <form
                onSubmit={saveGaleriData}
                className="lg:col-span-7 bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200"
              >
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    Upload Foto Galeri
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      fetchGaleriList();
                      setViewGaleri("list");
                    }}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Lihat Galeri &rarr;
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Nama/Judul Kegiatan
                    </label>
                    <input
                      type="text"
                      name="judul"
                      value={galeriData.judul}
                      onChange={handleGaleriChange}
                      required
                      placeholder="Contoh: Rapat Kerja Daerah 2026"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      Tanggal Kegiatan
                    </label>
                    <input
                      type="text"
                      name="tanggal"
                      value={galeriData.tanggal}
                      onChange={handleGaleriChange}
                      required
                      placeholder="Contoh: 15 Agustus 2026"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                      URL Gambar / Foto
                    </label>
                    <input
                      type="text"
                      name="imgUrl"
                      value={galeriData.imgUrl}
                      onChange={handleGaleriChange}
                      required
                      placeholder="https://..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingGaleri}
                    className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50 mt-4"
                  >
                    {isSavingGaleri ? "Menyimpan..." : "Upload ke Galeri"}
                  </button>
                </div>
              </form>

              <div className="lg:col-span-5 hidden lg:block sticky top-28">
                <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest px-2">
                  Preview Layout Kotak
                </h4>
                <div className="relative aspect-square rounded-2xl overflow-hidden group shadow-md border border-slate-200 max-w-sm mx-auto">
                  <img
                    src={
                      galeriData.imgUrl ||
                      "https://images.unsplash.com/photo-1511649475669-e288648b2339?q=80&w=600&auto=format&fit=crop"
                    }
                    alt="Galeri Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent flex flex-col justify-end p-6">
                    <p className="text-white font-bold text-xl leading-snug">
                      {galeriData.judul || "Judul Dokumentasi"}
                    </p>
                    <p className="text-blue-300 text-xs font-semibold mt-1.5">
                      {galeriData.tanggal || "Tanggal Acara"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Koleksi Galeri Utama
                </h3>
                <button
                  onClick={() => setViewGaleri("form")}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Upload Foto Baru
                </button>
              </div>
              {galeriList.length === 0 ? (
                <p className="text-center text-slate-400 py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                  Belum ada foto di galeri.
                </p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                      <div className="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center backdrop-blur-[2px]">
                        <p className="text-white text-xs font-bold mb-3 line-clamp-2 px-2">
                          {item.judul}
                        </p>
                        <button
                          onClick={() => deleteGaleri(item.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <IconTrash /> Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

        {/* ========================================================= */}
        {/* TAB 5: DONASI DENGAN FILTER AGENDA                        */}
        {/* ========================================================= */}
        {activeTab === "donasi" && (
          <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Verifikasi Global Donasi
              </h3>

              {/* DROPDOWN FILTER AGENDA */}
              <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <select
                  value={selectedAgendaDonasi}
                  onChange={(e) => setSelectedAgendaDonasi(e.target.value)}
                  className="flex-1 md:w-64 px-3 py-2 bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
                >
                  <option value="all">Semua Agenda (All)</option>
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
                  className="bg-white border border-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors shrink-0 shadow-sm"
                  title="Refresh Data"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {isLoadingDonasi ? (
              <div className="text-center py-12 text-slate-400 font-bold animate-pulse">
                Menarik data dari server...
              </div>
            ) : filteredDonasiList.length === 0 ? (
              <div className="text-center text-slate-400 py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-sm">
                Belum ada data donasi masuk untuk kriteria ini.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold border-b border-slate-200">
                      <th className="p-4 w-[15%]">Tanggal</th>
                      <th className="p-4 w-[20%]">Donatur</th>
                      <th className="p-4 w-[25%]">Target Agenda</th>
                      <th className="p-4 w-[20%]">Nominal / Barang</th>
                      <th className="p-4 text-center w-[10%]">Status</th>
                      <th className="p-4 text-right w-[10%]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredDonasiList.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition-colors"
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
                        <td className="p-4 font-semibold text-slate-800">
                          {item.nama}
                        </td>
                        <td className="p-4">
                          <span className="text-[11px] font-medium text-slate-600 line-clamp-2">
                            {item.agendaJudul || "Agenda Umum"}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider mb-1 ${item.jenis === "Uang" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-purple-50 text-purple-600 border border-purple-100"}`}
                          >
                            {item.jenis}
                          </span>
                          <div className="font-bold text-slate-900 tracking-tight">
                            {item.jenis === "Uang" ? (
                              new Intl.NumberFormat("id-ID", {
                                style: "currency",
                                currency: "IDR",
                                maximumFractionDigits: 0,
                              }).format(item.nominal)
                            ) : (
                              <span className="text-xs line-clamp-2 font-medium">
                                {item.deskripsiBarang}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${item.status === "Terverifikasi" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}
                          >
                            {item.status === "Terverifikasi"
                              ? "✅ Sah"
                              : "⏳ Pending"}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {item.status !== "Terverifikasi" && (
                              <button
                                onClick={() => verifyDonasi(item.id)}
                                className="bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border border-emerald-200 shadow-sm whitespace-nowrap"
                              >
                                Validasi
                              </button>
                            )}
                            <button
                              onClick={() => deleteDonasi(item.id)}
                              className="bg-white hover:bg-rose-50 text-rose-500 p-1.5 rounded-lg transition-colors border border-slate-200 shadow-sm"
                              title="Hapus Data"
                            >
                              <IconTrash />
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
    </div>
  );
}
