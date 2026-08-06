"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import Link from "next/link";

const KATEGORI_LIST = [
  "Semua",
  "Kuliner",
  "Teknologi",
  "Jasa",
  "Retail",
  "Kesehatan",
  "Pendidikan",
  "Properti",
  "Lainnya",
];

export default function DirektoriBisnisPage() {
  const [bisnisList, setBisnisList] = useState<any[]>([]);
  const [iklanList, setIklanList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  // STATE PAGINASI
  const [itemsPerPage, setItemsPerPage] = useState<string>("12");
  const [currentPage, setCurrentPage] = useState(1);

  // STATE MODAL DETAIL & FORM
  const [selectedBisnis, setSelectedBisnis] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  // 🔥 STATE & REF UNTUK SLIDER IKLAN 🔥
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);

  // CUSTOM DIALOG STATE
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const [formData, setFormData] = useState({
    namaAlumni: "",
    emailPemilik: "",
    fakultasAngkatan: "",
    prodi: "",
    namaBisnis: "",
    kategori: "Kuliner",
    kategoriLainnya: "",
    alamatUsaha: "",
    fasilitas: "",
    deskripsi: "",
    noWA: "",
    linkBisnis: "",
    fotoUrl: "",
  });

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showDialog = (
    type: "success" | "error" | "info",
    title: string,
    message: string,
  ) => {
    setDialog({ isOpen: true, type, title, message });
  };

  // Fetch Data Bisnis & Iklan
  useEffect(() => {
    const fetchData = async () => {
      try {
        const qBisnis = query(
          collection(db, "direktori_bisnis"),
          orderBy("createdAt", "desc"),
        );
        const snapBisnis = await getDocs(qBisnis);
        const dataBisnis = snapBisnis.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((b: any) => b.status !== "Pending" && b.status !== "Ditolak");
        setBisnisList(dataBisnis);

        const qIklan = query(
          collection(db, "iklan_direktori"),
          orderBy("createdAt", "desc"),
        );
        const snapIklan = await getDocs(qIklan);

        const activeAds = snapIklan.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((iklan: any) => iklan.isActive !== false);

        setIklanList(activeAds);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔥 LOGIKA AUTO-SLIDE BANNER & INDIKATOR 🔥
  useEffect(() => {
    if (iklanList.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, clientWidth } = carouselRef.current;
        let nextIndex = Math.round(scrollLeft / clientWidth) + 1;

        // Reset ke gambar pertama jika sudah mencapai akhir
        if (nextIndex >= iklanList.length) nextIndex = 0;

        carouselRef.current.scrollTo({
          left: nextIndex * clientWidth,
          behavior: "smooth",
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [iklanList.length, isHovered]);

  const handleCarouselScroll = () => {
    if (carouselRef.current) {
      const index = Math.round(
        carouselRef.current.scrollLeft / carouselRef.current.clientWidth,
      );
      setCurrentAdIndex(index);
    }
  };

  const scrollToAd = (index: number) => {
    if (carouselRef.current) {
      carouselRef.current.scrollTo({
        left: index * carouselRef.current.clientWidth,
        behavior: "smooth",
      });
    }
  };

  // Logika Buka Modal Detail via URL Params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get("id");
    if (idParam && bisnisList.length > 0) {
      const found = bisnisList.find((b) => b.id === idParam);
      if (found) setSelectedBisnis(found);
    }
  }, [bisnisList]);

  const openDetail = (bisnis: any) => {
    setSelectedBisnis(bisnis);
    window.history.pushState({}, "", `?id=${bisnis.id}`);
  };

  const closeDetail = () => {
    setSelectedBisnis(null);
    window.history.pushState({}, "", window.location.pathname);
  };

  const handleImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress("Mengunggah gambar...");
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
      setFormData({ ...formData, fotoUrl: json.secure_url });
      setUploadProgress("Gambar berhasil diunggah!");
    } catch (error) {
      console.error("Gagal upload gambar:", error);
      setUploadProgress("Gagal mengunggah gambar. Coba lagi.");
    }
  };

  const checkDuplicateRegistration = async (
    email: string,
    namaBisnis: string,
  ) => {
    try {
      const qPending = query(collection(db, "pendaftaran_bisnis"));
      const snapPending = await getDocs(qPending);
      const isDuplicatePending = snapPending.docs.some((doc) => {
        const data = doc.data();
        return (
          (data.emailPemilik?.toLowerCase() === email.toLowerCase() ||
            data.email?.toLowerCase() === email.toLowerCase()) &&
          (data.namaBisnis?.toLowerCase() === namaBisnis.toLowerCase() ||
            data.nama?.toLowerCase() === namaBisnis.toLowerCase())
        );
      });

      if (isDuplicatePending) return true;

      const qMaster = query(collection(db, "direktori_bisnis"));
      const snapMaster = await getDocs(qMaster);
      const isDuplicateMaster = snapMaster.docs.some((doc) => {
        const data = doc.data();
        return (
          (data.emailPemilik?.toLowerCase() === email.toLowerCase() ||
            data.email?.toLowerCase() === email.toLowerCase()) &&
          (data.namaBisnis?.toLowerCase() === namaBisnis.toLowerCase() ||
            data.nama?.toLowerCase() === namaBisnis.toLowerCase())
        );
      });

      return isDuplicateMaster;
    } catch (error) {
      console.error("Gagal mengecek duplikasi:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isDuplicate = await checkDuplicateRegistration(
      formData.emailPemilik,
      formData.namaBisnis,
    );

    if (isDuplicate) {
      showDialog(
        "error",
        "Pendaftaran Ditolak",
        `Alamat email "${formData.emailPemilik}" sudah pernah mendaftarkan bisnis dengan nama "${formData.namaBisnis}" sebelumnya. Tim Admin sedang meninjaunya atau bisnis tersebut sudah tayang.`,
      );
      setIsSubmitting(false);
      return;
    }

    const finalKategori =
      formData.kategori === "Lainnya"
        ? formData.kategoriLainnya
        : formData.kategori;

    try {
      await addDoc(collection(db, "pendaftaran_bisnis"), {
        ...formData,
        kategori: finalKategori,
        status: "Pending",
        createdAt: serverTimestamp(),
      });

      showDialog(
        "success",
        "Pendaftaran Berhasil",
        "Data Anda telah masuk ke sistem. Tim kami akan melakukan verifikasi sebelum bisnis ditayangkan di direktori publik.",
      );
      setIsModalOpen(false);
      setFormData({
        namaAlumni: "",
        emailPemilik: "",
        fakultasAngkatan: "",
        prodi: "",
        namaBisnis: "",
        kategori: "Kuliner",
        kategoriLainnya: "",
        alamatUsaha: "",
        fasilitas: "",
        deskripsi: "",
        noWA: "",
        linkBisnis: "",
        fotoUrl: "",
      });
      setUploadProgress("");
    } catch (error) {
      showDialog(
        "error",
        "Kesalahan Sistem",
        "Terjadi kesalahan saat memproses pendaftaran. Silakan coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredBisnis = useMemo(() => {
    return bisnisList.filter((bisnis) => {
      const namaBisnis = bisnis.namaBisnis || bisnis.nama || "";
      const owner = bisnis.owner || bisnis.namaAlumni || "";
      const kat = bisnis.kategori || "";

      const matchSearch =
        namaBisnis.toLowerCase().includes(searchTerm.toLowerCase()) ||
        owner.toLowerCase().includes(searchTerm.toLowerCase());
      const matchKategori =
        selectedKategori === "Semua" || kat === selectedKategori;

      return matchSearch && matchKategori;
    });
  }, [bisnisList, searchTerm, selectedKategori]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedKategori, itemsPerPage]);

  const parsedItemsPerPage =
    itemsPerPage === "Semua" ? "Semua" : parseInt(itemsPerPage);

  const totalPages =
    parsedItemsPerPage === "Semua"
      ? 1
      : Math.ceil(filteredBisnis.length / parsedItemsPerPage);

  const currentData = useMemo(() => {
    if (parsedItemsPerPage === "Semua") return filteredBisnis;
    const start = (currentPage - 1) * parsedItemsPerPage;
    return filteredBisnis.slice(start, start + parsedItemsPerPage);
  }, [filteredBisnis, currentPage, parsedItemsPerPage]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showDialog(
      "info",
      "Tautan Tersalin",
      "Tautan profil bisnis ini telah disalin ke clipboard Anda.",
    );
  };

  return (
    <div
      suppressHydrationWarning
      className="bg-[#F8F9FA] min-h-screen flex flex-col font-sans text-[#202124]"
    >
      <NavbarPublic />
      <main className="flex-grow pt-28 pb-20">
        {/* CUSTOM DIALOG */}
        {dialog.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-lg w-full max-w-sm shadow-2xl flex flex-col overflow-hidden border border-[#DADCE0] animate-in zoom-in-95">
              <div className="px-6 py-5">
                <div className="flex items-center gap-3 mb-2">
                  {dialog.type === "success" && (
                    <svg
                      className="w-6 h-6 text-[#1E8E3E]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  {dialog.type === "error" && (
                    <svg
                      className="w-6 h-6 text-[#D93025]"
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
                  )}
                  {dialog.type === "info" && (
                    <svg
                      className="w-6 h-6 text-[#1A73E8]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  )}
                  <h2
                    className={`text-lg font-medium ${dialog.type === "error" ? "text-[#D93025]" : dialog.type === "success" ? "text-[#1E8E3E]" : "text-[#1A73E8]"}`}
                  >
                    {dialog.title}
                  </h2>
                </div>
                <p className="text-sm text-[#5F6368] leading-relaxed">
                  {dialog.message}
                </p>
              </div>
              <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex justify-end">
                <button
                  onClick={closeDialog}
                  className={`px-5 py-2 text-sm font-medium text-white rounded transition-colors shadow-sm ${dialog.type === "error" ? "bg-[#D93025] hover:bg-[#b52a1f]" : dialog.type === "success" ? "bg-[#1E8E3E] hover:bg-[#137333]" : "bg-[#1A73E8] hover:bg-[#1557B0]"}`}
                >
                  Mengerti
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FORM DAFTAR BISNIS */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto border border-[#DADCE0] animate-in zoom-in-95">
              <button
                onClick={() => setIsModalOpen(false)}
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
                <div className="w-12 h-12 bg-[#E8F0FE] text-[#1A73E8] rounded-xl flex items-center justify-center shrink-0">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#202124] leading-tight">
                    Daftarkan Bisnis
                  </h3>
                  <p className="text-xs text-[#5F6368] mt-0.5">
                    Isi data lengkap. Admin akan memverifikasi sebelum
                    ditayangkan.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Nama Lengkap Alumni
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.namaAlumni}
                      onChange={(e) =>
                        setFormData({ ...formData, namaAlumni: e.target.value })
                      }
                      placeholder="Sesuai Ijazah"
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
                      value={formData.emailPemilik}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emailPemilik: e.target.value,
                        })
                      }
                      placeholder="contoh@email.com"
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
                      placeholder="Cth: FTI 2012"
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
                      placeholder="Cth: Teknik Industri"
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                <div className="border-t border-[#DADCE0] pt-4 mt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                    <div>
                      <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                        Nama Usaha / Bisnis
                      </label>
                      <input
                        required
                        type="text"
                        value={formData.namaBisnis}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            namaBisnis: e.target.value,
                          })
                        }
                        placeholder="Cth: Kopi Kenangan"
                        className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm font-bold text-[#202124] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                        Kategori Usaha
                      </label>
                      <select
                        required
                        value={formData.kategori}
                        onChange={(e) =>
                          setFormData({ ...formData, kategori: e.target.value })
                        }
                        className={`w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl outline-none text-sm transition-colors cursor-pointer ${formData.kategori === "Lainnya" ? "mb-2" : ""}`}
                      >
                        {KATEGORI_LIST.filter((k) => k !== "Semua").map(
                          (kat) => (
                            <option key={kat} value={kat}>
                              {kat}
                            </option>
                          ),
                        )}
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
                          placeholder="Ketik kategori..."
                          className="w-full px-3.5 py-2 bg-[#E8F0FE] border border-[#1A73E8]/30 rounded-lg focus:border-[#1A73E8] outline-none text-sm transition-colors animate-in fade-in"
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
                    placeholder="Jalan, Kelurahan, Kecamatan, Kota..."
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm resize-none transition-colors"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Fasilitas Bisnis (Pisahkan dengan koma)
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.fasilitas}
                    onChange={(e) =>
                      setFormData({ ...formData, fasilitas: e.target.value })
                    }
                    placeholder="Cth: WiFi Cepat, Parkir Luas, Ruang AC, Delivery"
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                    Deskripsi Singkat
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.deskripsi}
                    onChange={(e) =>
                      setFormData({ ...formData, deskripsi: e.target.value })
                    }
                    placeholder="Jelaskan produk/jasa yang ditawarkan..."
                    className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm resize-none transition-colors"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Nomor WhatsApp Aktif
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.noWA}
                      onChange={(e) =>
                        setFormData({ ...formData, noWA: e.target.value })
                      }
                      placeholder="Contoh: 08123456789"
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-1.5">
                      Link Web / IG (Opsional)
                    </label>
                    <input
                      type="text"
                      value={formData.linkBisnis}
                      onChange={(e) =>
                        setFormData({ ...formData, linkBisnis: e.target.value })
                      }
                      placeholder="Cth: instagram.com/..."
                      className="w-full px-3.5 py-2.5 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#1A73E8] focus:bg-white outline-none text-sm transition-colors"
                    />
                  </div>
                </div>

                {/* AREA UPLOAD CLOUDINARY */}
                <div className="bg-[#F8F9FA] p-4 rounded-xl border border-[#DADCE0]">
                  <label className="block text-[11px] font-bold text-[#5F6368] uppercase tracking-widest mb-2">
                    Upload Logo / Banner Usaha
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#E8F0FE] file:text-[#1A73E8] hover:file:bg-[#D2E3FC] cursor-pointer"
                    />
                  </div>
                  {uploadProgress && (
                    <p className="text-[10px] font-bold text-[#1A73E8] mt-2">
                      {uploadProgress}
                    </p>
                  )}
                  {formData.fotoUrl && (
                    <img
                      src={formData.fotoUrl}
                      alt="Preview"
                      className="h-16 mt-2 rounded border border-[#DADCE0] object-cover"
                    />
                  )}
                </div>

                <div className="pt-3 mt-4 border-t border-[#DADCE0]">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold py-3.5 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                  >
                    {isSubmitting
                      ? "Memproses Data..."
                      : "Kirim Permohonan Tayang"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL DETAIL BISNIS (FULL SCREEN) */}
        {selectedBisnis && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 border border-[#DADCE0]">
              <div className="relative h-48 md:h-64 bg-[#F8F9FA] shrink-0 border-b border-[#DADCE0]">
                {selectedBisnis.fotoUrl || selectedBisnis.foto ? (
                  <img
                    src={selectedBisnis.fotoUrl || selectedBisnis.foto}
                    alt={selectedBisnis.namaBisnis}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#9AA0A6]">
                    <svg
                      className="w-16 h-16 mb-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <button
                  onClick={closeDetail}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
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
                      strokeWidth={2.5}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md text-[#1A73E8] text-xs font-black px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-widest border border-blue-100">
                  {selectedBisnis.kategori}
                </div>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto flex-grow">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-6">
                    <div>
                      <h2 className="text-3xl font-black text-[#202124] mb-2 leading-tight">
                        {selectedBisnis.namaBisnis || selectedBisnis.nama}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-[#5F6368]">
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
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Oleh:{" "}
                        <span className="font-bold text-[#202124]">
                          {selectedBisnis.owner || selectedBisnis.namaAlumni}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#DADCE0]">
                      <h3 className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest mb-2 border-b border-[#DADCE0] pb-2">
                        Informasi Produk / Jasa
                      </h3>
                      <p className="text-[#202124] text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedBisnis.deskripsi}
                      </p>
                    </div>

                    {selectedBisnis.fasilitas && (
                      <div>
                        <h3 className="text-xs font-bold text-[#5F6368] uppercase tracking-widest mb-2">
                          Fasilitas Bisnis
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedBisnis.fasilitas
                            .split(",")
                            .map((fas: string, i: number) => (
                              <span
                                key={i}
                                className="bg-white border border-[#DADCE0] text-[#5F6368] px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
                              >
                                ✓ {fas.trim()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}

                    {(selectedBisnis.alamatUsaha || selectedBisnis.alamat) && (
                      <div>
                        <h3 className="text-xs font-bold text-[#5F6368] uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
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
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Lokasi Usaha
                        </h3>
                        <p className="text-[#202124] text-sm bg-white border border-[#DADCE0] p-3.5 rounded-xl leading-relaxed">
                          {selectedBisnis.alamatUsaha || selectedBisnis.alamat}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="w-full md:w-72 shrink-0 space-y-5">
                    <div className="bg-[#E8F0FE] border border-[#1A73E8]/20 rounded-2xl p-5">
                      <h3 className="text-[10px] font-bold text-[#1A73E8] uppercase tracking-widest mb-3">
                        Latar Belakang Alumni
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[10px] text-[#5F6368] uppercase tracking-wider">
                            Fakultas / Angkatan
                          </p>
                          <p className="text-sm font-bold text-[#202124]">
                            {selectedBisnis.fakultasAngkatan || "-"}
                          </p>
                        </div>
                        {selectedBisnis.prodi && (
                          <div>
                            <p className="text-[10px] text-[#5F6368] uppercase tracking-wider">
                              Program Studi
                            </p>
                            <p className="text-sm font-bold text-[#202124]">
                              {selectedBisnis.prodi}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pt-2 border-t border-[#DADCE0]">
                      <a
                        href={`https://wa.me/${(selectedBisnis.noWA || selectedBisnis.waBisnis || selectedBisnis.wa || "").replace(/^0/, "62")}?text=${encodeURIComponent(`Halo admin ${selectedBisnis.namaBisnis || selectedBisnis.nama}, saya melihat bisnis Anda pada web IKA UII DIY. Saya ingin bertanya lebih lanjut tentang ${selectedBisnis.namaBisnis || selectedBisnis.nama} Anda.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-2 bg-[#1E8E3E] hover:bg-[#137333] text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.883-.733-1.48-1.638-1.653-1.935-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                        </svg>
                        Chat WhatsApp
                      </a>
                      {selectedBisnis.linkBisnis && (
                        <a
                          href={
                            selectedBisnis.linkBisnis.startsWith("http")
                              ? selectedBisnis.linkBisnis
                              : `https://${selectedBisnis.linkBisnis}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-white hover:bg-[#F8F9FA] text-[#1A73E8] border border-[#DADCE0] py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm"
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
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          Kunjungi Sosial Media
                        </a>
                      )}
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center justify-center gap-2 bg-[#F8F9FA] hover:bg-[#E8F0FE] text-[#5F6368] hover:text-[#1A73E8] border border-[#DADCE0] py-3.5 rounded-xl font-bold text-sm transition-all shadow-sm"
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
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Salin Tautan Bisnis
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEADER SECTION & HERO CTA */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h4 className="text-yellow-600 font-bold tracking-widest uppercase text-[10px] md:text-xs mb-3 flex items-center justify-center gap-3">
            <span className="w-6 md:w-8 h-px bg-yellow-500"></span>
            Katalog Bisnis Alumni
            <span className="w-6 md:w-8 h-px bg-yellow-500"></span>
          </h4>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-[#202124] mb-4 md:mb-5 tracking-tight">
            Jaringan Bisnis IKA UII DIY
          </h1>
          <p className="text-[#5F6368] text-sm md:text-base max-w-2xl mx-auto leading-relaxed px-2 mb-8">
            <strong>Baru merintis usaha? Jangan ragu!</strong> Direktori ini
            adalah tempat terbaik untuk saling mendukung dan memperkenalkan
            bisnis Anda kepada jaringan keluarga besar alumni.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white rounded-xl text-sm font-bold transition-all shadow-md hover:-translate-y-0.5"
            >
              Daftarkan Bisnis Anda
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
            <Link
              href="/pasang-iklan"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-[#F8F9FA] text-[#5F6368] border border-[#DADCE0] rounded-xl text-sm font-bold transition-all shadow-sm hover:-translate-y-0.5"
            >
              <svg
                className="w-5 h-5 text-[#5F6368]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              Pasang Iklan Banner
            </Link>
          </div>
        </div>

        {/* 🔥 CAROUSEL BANNER IKLAN DENGAN DOTS SLIDER 🔥 */}
        {/* 🔥 CAROUSEL BANNER IKLAN DENGAN DOTS SLIDER 🔥 */}
        {iklanList.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative group">
            <div
              ref={carouselRef}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onTouchStart={() => setIsHovered(true)}
              onTouchEnd={() => setIsHovered(false)}
              onScroll={handleCarouselScroll}
              className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth rounded-xl sm:rounded-2xl shadow-lg border border-slate-200/60 bg-white"
            >
              {iklanList.map((iklan) => (
                <a
                  key={iklan.id}
                  href={iklan.linkTujuan || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 w-full aspect-[16/9] sm:aspect-[21/9] lg:aspect-[3/1] overflow-hidden block snap-center relative cursor-pointer"
                >
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                  
                  <img
                    src={iklan.fotoUrl}
                    alt="Banner Promo"
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700 ease-out"
                    loading="lazy"
                  />
                </a>
              ))}
            </div>

            {/* Navigation Arrows (Prev / Next) - Visible on Hover & Desktop */}
            {iklanList.length > 1 && (
              <>
                <button
                  onClick={() => scrollToAd(currentAdIndex - 1 >= 0 ? currentAdIndex - 1 : iklanList.length - 1)}
                  className="absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-800 p-2 sm:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 hidden sm:flex items-center justify-center border border-slate-200/50"
                  aria-label="Previous slide"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => scrollToAd(currentAdIndex + 1 < iklanList.length ? currentAdIndex + 1 : 0)}
                  className="absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-slate-800 p-2 sm:p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm transform hover:scale-110 hidden sm:flex items-center justify-center border border-slate-200/50"
                  aria-label="Next slide"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Indikator Slider (Dots) - Overlaid on Banner Bottom */}
            {iklanList.length > 1 && (
              <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex justify-center items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-2 rounded-full">
                {iklanList.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => scrollToAd(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentAdIndex === idx
                        ? "w-6 bg-white shadow-sm"
                        : "w-2 bg-white/50 hover:bg-white/90"
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* FILTER & SEARCH BAR */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 md:mb-10">
          <div className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-[#DADCE0] flex flex-col md:flex-row gap-4 items-center animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            <div className="relative w-full md:flex-1">
              <svg
                className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-[#9AA0A6]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Cari nama bisnis atau alumni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F8F9FA] border border-[#DADCE0] py-3 pl-10 md:pl-12 pr-4 rounded-xl text-sm font-medium focus:border-[#1A73E8] focus:bg-white outline-none transition-all text-[#202124]"
              />
            </div>

            <div className="flex w-full md:w-auto gap-3">
              <div className="flex-1 md:w-48 shrink-0 relative">
                <select
                  value={selectedKategori}
                  onChange={(e) => setSelectedKategori(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#DADCE0] py-3 px-4 rounded-xl text-sm font-bold text-[#5F6368] focus:border-[#1A73E8] focus:bg-white outline-none appearance-none cursor-pointer transition-colors"
                >
                  {KATEGORI_LIST.map((kat) => (
                    <option key={kat} value={kat}>
                      {kat}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA0A6] pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              <div className="w-24 shrink-0 relative">
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(e.target.value)}
                  className="w-full bg-[#F8F9FA] border border-[#DADCE0] py-3 px-4 rounded-xl text-sm font-bold text-[#5F6368] focus:border-[#1A73E8] focus:bg-white outline-none appearance-none cursor-pointer text-center transition-colors"
                >
                  <option value="12">12</option>
                  <option value="24">24</option>
                  <option value="Semua">All</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* KATALOG BISNIS GRID */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 min-h-[400px]">
          {isLoading ? (
            <div className="bg-white rounded-2xl py-24 text-center border border-[#DADCE0] shadow-sm flex flex-col items-center mx-1">
              <div className="w-8 h-8 border-4 border-[#E8F0FE] border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
            </div>
          ) : currentData.length === 0 ? (
            <div className="bg-white rounded-2xl py-16 md:py-24 text-center border border-[#DADCE0] shadow-sm flex flex-col items-center mx-1">
              <span className="text-4xl mb-3 opacity-50">🏪</span>
              <h3 className="font-bold text-[#202124] text-lg md:text-xl mb-1">
                Tidak Ada Hasil
              </h3>
              <p className="text-[#5F6368] text-xs md:text-sm px-4">
                Coba sesuaikan kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {currentData.map((bisnis, idx) => (
                  <div
                    key={bisnis.id}
                    onClick={() => openDetail(bisnis)}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#DADCE0] hover:shadow-md hover:-translate-y-1 transition-all duration-300 group flex flex-col cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${(idx % 12) * 50}ms` }}
                  >
                    <div className="h-28 sm:h-40 bg-[#F8F9FA] relative overflow-hidden border-b border-[#DADCE0] flex items-center justify-center shrink-0">
                      {bisnis.fotoUrl || bisnis.foto ? (
                        <img
                          src={bisnis.fotoUrl || bisnis.foto}
                          alt={bisnis.namaBisnis}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="text-[#9AA0A6] flex flex-col items-center">
                          <svg
                            className="w-8 h-8 sm:w-10 sm:h-10 mb-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/90 backdrop-blur text-[#1A73E8] text-[9px] sm:text-[10px] font-black px-2 py-1 rounded shadow-sm uppercase tracking-widest border border-blue-100">
                        {bisnis.kategori}
                      </div>
                    </div>

                    <div className="p-3 sm:p-5 flex-grow flex flex-col">
                      <h3
                        className="text-sm sm:text-base font-bold text-[#202124] mb-1 line-clamp-2 leading-tight"
                        title={bisnis.namaBisnis || bisnis.nama}
                      >
                        {bisnis.namaBisnis || bisnis.nama}
                      </h3>

                      <p className="text-[#5F6368] text-[10px] sm:text-xs mb-2 sm:mb-3 font-medium line-clamp-1">
                        By {bisnis.owner || bisnis.namaAlumni}
                      </p>

                      <p className="text-[#5F6368] text-[10px] sm:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3 flex-grow mb-3 sm:mb-5">
                        {bisnis.deskripsi}
                      </p>

                      <div className="pt-3 border-t border-[#DADCE0] mt-auto">
                        <button className="w-full bg-[#F8F9FA] group-hover:bg-[#E8F0FE] border border-[#DADCE0] group-hover:border-[#1A73E8]/30 group-hover:text-[#1A73E8] text-[#5F6368] py-2 sm:py-2.5 rounded-lg font-bold text-[10px] sm:text-sm transition-colors text-center">
                          Lihat Detail
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {parsedItemsPerPage !== "Semua" && totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 sm:gap-2 mt-10 sm:mt-16">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 sm:p-2.5 border border-[#DADCE0] rounded-lg bg-white text-[#5F6368] hover:bg-[#F8F9FA] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg text-xs sm:text-sm font-bold transition-colors shadow-sm ${currentPage === i + 1 ? "bg-[#1A73E8] text-white border border-[#1A73E8]" : "border border-[#DADCE0] bg-white text-[#5F6368] hover:bg-[#F8F9FA]"}`}
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
                    className="p-2 sm:p-2.5 border border-[#DADCE0] rounded-lg bg-white text-[#5F6368] hover:bg-[#F8F9FA] disabled:opacity-50 transition-colors shadow-sm"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 5l7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <FooterPublic />
    </div>
  );
}
