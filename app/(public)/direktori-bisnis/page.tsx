"use client";

import { useState, useEffect } from "react";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";

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
const NOMOR_WA_ADMIN = "6285179594146"; // Sesuaikan dengan nomor WA admin DPW

export default function DirektoriBisnisPage() {
  const [bisnisList, setBisnisList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("Semua");

  // State Modal Form Daftar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    namaAlumni: "",
    emailPemilik: "", // 🔥 TAMBAHAN STATE EMAIL
    fakultasAngkatan: "",
    namaBisnis: "",
    kategori: "Kuliner",
    deskripsi: "",
    waBisnis: "",
    linkBisnis: "",
  });

  // Fetch Data Bisnis dari Firebase
  useEffect(() => {
    const fetchBisnis = async () => {
      try {
        const q = query(
          collection(db, "direktori_bisnis"),
          orderBy("createdAt", "desc"),
        );
        const snap = await getDocs(q);
        setBisnisList(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Gagal mengambil data direktori bisnis:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBisnis();
  }, []);

  // Logika Filter Data
  const filteredBisnis = bisnisList.filter((bisnis) => {
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

  // Logika Kirim WA
  const handleKirimWA = (e: React.FormEvent) => {
    e.preventDefault();

    // Format Pesan WhatsApp (DITAMBAH EMAIL)
    const pesan = `Assalamu'alaikum Admin IKA UII DIY,\n\nSaya ingin mendaftarkan usaha saya ke Direktori Bisnis Alumni di website. Berikut datanya:\n\n👤 *Nama Alumni*: ${formData.namaAlumni}\n📧 *Email*: ${formData.emailPemilik}\n🎓 *Fakultas/Angkatan*: ${formData.fakultasAngkatan}\n🏪 *Nama Bisnis*: ${formData.namaBisnis}\n🏷️ *Kategori*: ${formData.kategori}\n📝 *Deskripsi Singkat*: ${formData.deskripsi}\n📞 *No. WA Bisnis*: ${formData.waBisnis}\n🌐 *Link IG / Web*: ${formData.linkBisnis || "-"}\n\nMohon dibantu proses verifikasi dan penayangannya ya Min. Terima kasih banyak! 🙏`;

    const encodedPesan = encodeURIComponent(pesan);
    const waURL = `https://wa.me/${NOMOR_WA_ADMIN}?text=${encodedPesan}`;

    // Buka Tab Baru WA
    window.open(waURL, "_blank");

    // Reset & Tutup Modal
    setIsModalOpen(false);
    setFormData({
      namaAlumni: "",
      emailPemilik: "", // Reset Email
      fakultasAngkatan: "",
      namaBisnis: "",
      kategori: "Kuliner",
      deskripsi: "",
      waBisnis: "",
      linkBisnis: "",
    });
  };

  return (
    <>
      <NavbarPublic />
      <main className="bg-slate-50 min-h-screen pt-24 pb-20 relative font-sans">
        {/* MODAL FORM DAFTAR BISNIS */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors z-10"
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

              <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                  🤝
                </div>
                <h3 className="text-2xl font-black text-blue-950 leading-tight">
                  Daftarkan Bisnis Anda
                </h3>
                <p className="text-xs text-slate-500 mt-2 px-4">
                  Lengkapi data berikut. Anda akan diarahkan ke WhatsApp Admin
                  Kesekretariatan untuk verifikasi.
                </p>
              </div>

              <form onSubmit={handleKirimWA} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none text-sm font-medium transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
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
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none text-sm font-medium transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Fakultas / Tahun Angkatan
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
                    placeholder="Contoh: FTI 2012"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none text-sm font-medium transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Nama Bisnis / Usaha
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.namaBisnis}
                      onChange={(e) =>
                        setFormData({ ...formData, namaBisnis: e.target.value })
                      }
                      placeholder="Contoh: Kopi Kenangan"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none text-sm font-bold text-slate-800 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Kategori Usaha
                    </label>
                    <select
                      required
                      value={formData.kategori}
                      onChange={(e) =>
                        setFormData({ ...formData, kategori: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none text-sm font-medium transition-colors cursor-pointer"
                    >
                      {KATEGORI_LIST.filter((k) => k !== "Semua").map((kat) => (
                        <option key={kat} value={kat}>
                          {kat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    Deskripsi Singkat Bisnis
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.deskripsi}
                    onChange={(e) =>
                      setFormData({ ...formData, deskripsi: e.target.value })
                    }
                    placeholder="Jelaskan produk/jasa yang ditawarkan agar menarik perhatian pelanggan..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none text-sm font-medium resize-none transition-colors"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Nomor WA Bisnis
                    </label>
                    <input
                      required
                      type="tel"
                      value={formData.waBisnis}
                      onChange={(e) =>
                        setFormData({ ...formData, waBisnis: e.target.value })
                      }
                      placeholder="Contoh: 08123456789"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none text-sm font-medium transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                      Link IG / Website
                    </label>
                    <input
                      type="text"
                      value={formData.linkBisnis}
                      onChange={(e) =>
                        setFormData({ ...formData, linkBisnis: e.target.value })
                      }
                      placeholder="Opsional"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-blue-600 focus:bg-white outline-none text-sm font-medium transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-extrabold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all mt-4 flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.883-.733-1.48-1.638-1.653-1.935-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                    </svg>
                    Kirim via WhatsApp
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
                    Tindakan ini akan membuka aplikasi WhatsApp untuk verifikasi
                    akhir.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* HERO SECTION (Background Biru Gelap) */}
        <section className="bg-blue-950 text-white pt-16 pb-32 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-800/30 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <span className="inline-block bg-white/10 text-yellow-400 font-bold tracking-widest uppercase text-[10px] px-3 py-1.5 rounded-full mb-6 border border-white/10">
              #AlumniSupportAlumni
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 tracking-tight">
              Bisnis Alumni UII
            </h1>
            <p className="text-blue-200 text-sm md:text-lg max-w-2xl mx-auto leading-relaxed">
              Temukan, dukung, dan kembangkan jaringan bisnis milik sesama
              keluarga besar alumni Universitas Islam Indonesia. Dari kita, oleh
              kita, untuk semua.
            </p>
          </div>
        </section>

        {/* SECTION FILTER & SEARCH */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mt-16 mb-12">
          <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-slate-100 flex flex-col md:flex-row gap-4 items-center">
            {/* Search Bar */}
            <div className="relative w-full md:w-1/2 flex-1">
              <svg
                className="absolute left-4 top-3.5 w-5 h-5 text-slate-400"
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
                placeholder="Cari nama bisnis atau nama alumni..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-3.5 pl-12 pr-4 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="w-full md:w-auto flex overflow-x-auto pb-2 md:pb-0 gap-2 custom-scrollbar hide-scrollbar">
              {KATEGORI_LIST.map((kat) => (
                <button
                  key={kat}
                  onClick={() => setSelectedKategori(kat)}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 border ${
                    selectedKategori === kat
                      ? "bg-[#1A73E8] border-[#1A73E8] text-white shadow-md shadow-blue-500/20"
                      : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {kat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* KATALOG BISNIS GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-[300px]">
          {isLoading ? (
            <div className="bg-white rounded-[2rem] py-24 text-center border border-slate-200 shadow-sm flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">
                Memuat Direktori...
              </p>
            </div>
          ) : filteredBisnis.length === 0 ? (
            <div className="bg-white rounded-[2rem] py-20 text-center border border-slate-200 shadow-sm">
              <span className="text-5xl block mb-4 opacity-50">🏪</span>
              <h3 className="font-bold text-slate-700 text-xl mb-1">
                {searchTerm || selectedKategori !== "Semua"
                  ? "Bisnis Tidak Ditemukan"
                  : "Belum Ada Direktori Bisnis"}
              </h3>
              <p className="text-slate-500 text-sm">
                {searchTerm || selectedKategori !== "Semua"
                  ? "Coba gunakan kata kunci atau kategori yang berbeda."
                  : "Jadilah yang pertama mendaftarkan bisnis Anda di sini!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBisnis.map((bisnis, idx) => (
                <div
                  key={bisnis.id}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col animate-in fade-in slide-in-from-bottom-8"
                  style={{ animationDelay: `${(idx % 6) * 100}ms` }}
                >
                  {/* Foto Bisnis */}
                  <div className="h-48 overflow-hidden relative bg-slate-100 flex items-center justify-center border-b border-slate-100">
                    {bisnis.foto ? (
                      <img
                        src={bisnis.foto}
                        alt={bisnis.namaBisnis || bisnis.nama}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center">
                        <svg
                          className="w-12 h-12 mb-2"
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
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {bisnis.kategori}
                        </span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur text-[#1A73E8] border border-blue-100 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-sm uppercase tracking-widest">
                      {bisnis.kategori}
                    </div>
                  </div>

                  {/* Info Konten */}
                  <div className="p-6 flex flex-col flex-grow">
                    <h3
                      className="text-xl font-extrabold text-slate-800 mb-2 line-clamp-1"
                      title={bisnis.namaBisnis || bisnis.nama}
                    >
                      {bisnis.namaBisnis || bisnis.nama}
                    </h3>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">
                        <span className="opacity-50 mr-1">Pemilik:</span>{" "}
                        {bisnis.owner || bisnis.namaAlumni}
                      </span>
                    </div>

                    <p className="text-slate-600 text-sm leading-relaxed flex-grow line-clamp-3 mb-6">
                      {bisnis.deskripsi}
                    </p>

                    {/* Tombol Aksi */}
                    <div className="pt-4 border-t border-slate-100 mt-auto flex gap-2">
                      <a
                        href={`https://wa.me/${(bisnis.waBisnis || bisnis.wa || "").replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 flex-1 bg-[#25D366] hover:bg-[#1DA851] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-sm"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.883-.733-1.48-1.638-1.653-1.935-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                        </svg>
                        Hubungi
                      </a>
                      {bisnis.linkBisnis && (
                        <a
                          href={
                            bisnis.linkBisnis.startsWith("http")
                              ? bisnis.linkBisnis
                              : `https://${bisnis.linkBisnis}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center p-2.5 bg-white hover:bg-slate-50 text-slate-500 hover:text-[#1A73E8] rounded-xl border border-slate-200 hover:border-blue-200 transition-colors"
                          title="Kunjungi Website / Sosial Media"
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
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA DAFTARKAN BISNIS */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-24 mb-10">
          <div className="bg-gradient-to-br from-[#1e3c72] via-[#2a5298] to-[#1A73E8] rounded-3xl p-8 md:p-12 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>

            <div className="relative z-10">
              <span className="text-4xl block mb-4">🤝</span>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">
                Punya Bisnis atau Jasa?
              </h2>
              <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-8 max-w-lg mx-auto">
                Kembangkan sayap bisnismu! Daftarkan usahamu ke dalam direktori
                ini agar mudah ditemukan oleh ribuan alumni UII lainnya secara
                gratis.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-blue-50 text-[#1A73E8] rounded-xl text-sm font-bold transition-all shadow-md hover:-translate-y-0.5"
              >
                Daftarkan Bisnis Anda Sekarang
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
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </div>
          </div>
        </section>
      </main>
      <FooterPublic />
    </>
  );
}
