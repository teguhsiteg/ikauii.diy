"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@/lib/toast";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import Link from "next/link";

export default function ManajemenNomorSuratPage() {
  const [nomorList, setNomorList] = useState<any[]>([]);
  const [pengurusList, setPengurusList] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State untuk mode edit
  const [editId, setEditId] = useState<string | null>(null);

  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [searchPenerima, setSearchPenerima] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 🔥 Form Generator Nomor & Setup Surat (Ditambah Penutup & Jabatan) 🔥
  const [genForm, setGenForm] = useState({
    nomorUrut: "",
    jenis: "Surat Undangan",
    kategori: "Internal",
    index: "UND",
    perihal: "",
    isiSurat:
      "Assalamu’alaikum warahmatullahi wabarakaatuh.\n\nDengan hormat, sehubungan dengan akan dilaksanakannya [nama agenda], kami mengundang Bapak/Ibu untuk berkenan hadir pada rapat koordinasi yang akan dilaksanakan pada:",
    penutupSurat:
      "Demikian surat undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.",
    pembuat: "",
    jabatanPembuat: "",
    tglMasehi: new Date().toISOString().split("T")[0],
    preview: "",
    templateSurat: "Undangan Lipat 3",
    penerima: [] as string[],
    tglPelaksanaan: "",
    waktuPelaksanaan: "",
    tipePelaksanaan: "Offline" as "Offline" | "Online",
    tempatPelaksanaan: "",
    linkZoom: "",
  });

  // 🔥 TAMBAHAN STATE UNTUK MODE AMBIL NOMOR SAJA 🔥
  const [modeForm, setModeForm] = useState<"lengkap" | "cepat">("lengkap");
  const [formCepat, setFormCepat] = useState({
    jenisSurat: "Surat Keluar Umum",
    perihal: "",
    tujuan: "",
    tanggalSurat: new Date().toISOString().split("T")[0],
    pembuat: "",
    jabatanPembuat: "",
  });

  const handleAmbilNomor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // 1. Cari nomor urut terakhir
      let nextNo = "001";
      if (nomorList.length > 0) {
        const lastNumber = parseInt(nomorList[0].nomor.split("/")[0]);
        if (!isNaN(lastNumber)) {
          nextNo = String(lastNumber + 1).padStart(3, "0");
        }
      }

      // 2. Format Romawi Bulan & Tahun
      const arrBulan = [
        "I",
        "II",
        "III",
        "IV",
        "V",
        "VI",
        "VII",
        "VIII",
        "IX",
        "X",
        "XI",
        "XII",
      ];
      const d = new Date(formCepat.tanggalSurat);
      const bln = arrBulan[d.getMonth()];
      const thn = d.getFullYear().toString();

      // 3. Tentukan Kode (Bisa disesuaikan)
      let kode = "UM";
      if (formCepat.jenisSurat === "Surat Keputusan") kode = "SKep";
      if (formCepat.jenisSurat === "Surat Tugas") kode = "ST";
      if (formCepat.jenisSurat === "Surat Keterangan") kode = "SK";

      const generatedNomor = `${nextNo}/IKA-UII/DIY/${kode}/${bln}/${thn}`;

      const payload = {
        nomor: generatedNomor,
        jenis: formCepat.jenisSurat,
        perihal: formCepat.perihal,
        penerima: formCepat.tujuan ? [formCepat.tujuan] : [],
        tanggal: formCepat.tanggalSurat,
        tipeForm: "Buku Agenda Manual",
        status: "Sudah terpakai", // Langsung terpakai agar tidak diambil orang lain
        pembuat: formCepat.pembuat,
        jabatanPembuat: formCepat.jabatanPembuat,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await addDoc(collection(db, "nomor_surat"), payload);
      toast.success(`Berhasil! Nomor Surat Anda: ${generatedNomor}. Silakan salin nomor tersebut ke dokumen Word Anda.`);

      setFormCepat({ ...formCepat, perihal: "", tujuan: "", pembuat: "", jabatanPembuat: "" });
      setIsModalOpen(false);
      fetchData();
    } catch {
      toast.error("Gagal mengambil nomor surat.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "nomor_surat"),
        orderBy("createdAt", "desc"),
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setNomorList(data);

      const qPengurus = query(
        collection(db, "pengurus"),
        orderBy("nama", "asc"),
      );
      const snapPengurus = await getDocs(qPengurus);
      const dataPengurus = snapPengurus.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setPengurusList(dataPengurus);

      // Auto-suggest Nomor Urut hanya jika TIDAK sedang mode edit
      if (!editId) {
        if (data.length > 0 && !genForm.nomorUrut) {
          const lastNumber = parseInt((data[0] as any).nomor.split("/")[0]);
          if (!isNaN(lastNumber)) {
            setGenForm((prev) => ({
              ...prev,
              nomorUrut: String(lastNumber + 1).padStart(3, "0"),
            }));
          }
        } else if (data.length === 0) {
          setGenForm((prev) => ({ ...prev, nomorUrut: "001" }));
        }
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, itemsPerPage]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const arrBulan = [
      "I",
      "II",
      "III",
      "IV",
      "V",
      "VI",
      "VII",
      "VIII",
      "IX",
      "X",
      "XI",
      "XII",
    ];
    const d = new Date(genForm.tglMasehi);
    const bln = isNaN(d.getTime()) ? "..." : arrBulan[d.getMonth()];
    const thn = isNaN(d.getTime()) ? "..." : d.getFullYear().toString();
    const no = genForm.nomorUrut || "000";
    const kode = genForm.index;
    const result = `[NO]/IKA-UII/DIY/[KODE]/[BLN]/[THN]`
      .replace("[NO]", no)
      .replace("[KODE]", kode)
      .replace("[BLN]", bln)
      .replace("[THN]", thn);
    setGenForm((prev) => ({ ...prev, preview: result }));
  }, [genForm.nomorUrut, genForm.index, genForm.tglMasehi]);

  const handleEdit = (docData: any) => {
    const parts = docData.nomor.split("/");
    const noUrut = parts[0] || "";
    const kode = parts[3] || "UND";

    setGenForm({
      nomorUrut: noUrut,
      index: kode,
      jenis: docData.jenis || "Surat Undangan",
      kategori: docData.kategori || "Internal",
      perihal: docData.perihal || "",
      isiSurat: docData.isiSurat || "",
      penutupSurat:
        docData.penutupSurat ||
        "Demikian surat undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.",
      pembuat: docData.pembuat || "",
      jabatanPembuat: docData.jabatanPembuat || "",
      tglMasehi: docData.tanggal || new Date().toISOString().split("T")[0],
      preview: docData.nomor || "",
      templateSurat: docData.templateSurat || "Undangan Lipat 3",
      penerima: docData.penerima || [],
      tglPelaksanaan: docData.tglPelaksanaan || "",
      waktuPelaksanaan: docData.waktuPelaksanaan || "",
      tipePelaksanaan: docData.tipePelaksanaan || "Offline",
      tempatPelaksanaan: docData.tempatPelaksanaan || "",
      linkZoom: docData.linkZoom || "",
    });
    setEditId(docData.id);
    setModeForm("lengkap");
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!genForm.nomorUrut || !genForm.perihal || !genForm.pembuat) {
      toast.warning("Nomor, Perihal, dan Nama Pembuat wajib diisi!");
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        nomor: genForm.preview,
        perihal: genForm.perihal,
        isiSurat: genForm.isiSurat,
        penutupSurat: genForm.penutupSurat,
        tglPelaksanaan: genForm.tglPelaksanaan,
        waktuPelaksanaan: genForm.waktuPelaksanaan,
        tipePelaksanaan: genForm.tipePelaksanaan,
        tempatPelaksanaan: genForm.tempatPelaksanaan,
        linkZoom: genForm.linkZoom,
        jenis: genForm.jenis,
        kategori: genForm.kategori,
        tanggal: genForm.tglMasehi,
        pembuat: genForm.pembuat,
        jabatanPembuat: genForm.jabatanPembuat,
        templateSurat: genForm.templateSurat,
        penerima: genForm.penerima,
        updatedAt: Date.now(),
      };

      if (editId) {
        await updateDoc(doc(db, "nomor_surat", editId), payload);
      } else {
        await addDoc(collection(db, "nomor_surat"), {
          ...payload,
          status: "Belum terpakai",
          createdAt: Date.now(),
        });
      }

      setIsModalOpen(false);
      setEditId(null);
      setGenForm({
        nomorUrut: "",
        jenis: "Surat Undangan",
        kategori: "Internal",
        index: "UND",
        perihal: "",
        isiSurat: "Assalamu’alaikum warahmatullahi wabarakaatuh.\n\nDengan hormat, sehubungan dengan akan dilaksanakannya [nama agenda], kami mengundang Bapak/Ibu untuk berkenan hadir pada rapat koordinasi yang akan dilaksanakan pada:",
        penutupSurat: "Demikian surat undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.",
        pembuat: "",
        jabatanPembuat: "",
        tglMasehi: new Date().toISOString().split("T")[0],
        preview: "",
        templateSurat: "Undangan Lipat 3",
        penerima: [],
        tglPelaksanaan: "",
        waktuPelaksanaan: "",
        tipePelaksanaan: "Offline",
        tempatPelaksanaan: "",
        linkZoom: "",
      });
      setSearchPenerima("");
      fetchData();
    } catch (error) {
      toast.error("Gagal menyimpan dokumen.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus =
      currentStatus === "Sudah terpakai" ? "Belum terpakai" : "Sudah terpakai";
    await updateDoc(doc(db, "nomor_surat", id), {
      status: newStatus,
      updatedAt: Date.now(),
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus nomor surat ini secara permanen?")) {
      await deleteDoc(doc(db, "nomor_surat", id));
      fetchData();
    }
  };

  // 🔥 FITUR MANAJEMEN PENERIMA ANTI REPOT 🔥
  const filteredPengurus = pengurusList.filter(
    (p) =>
      p.nama?.toLowerCase().includes(searchPenerima.toLowerCase()) &&
      !genForm.penerima.includes(p.nama),
  );

  const addPenerima = (nama: string) => {
    if (!nama.trim()) return;
    setGenForm((prev) => ({
      ...prev,
      penerima: [...prev.penerima, nama.trim()],
    }));
    setSearchPenerima("");
    setIsDropdownOpen(false);
  };

  const removePenerima = (nama: string) => {
    setGenForm((prev) => ({
      ...prev,
      penerima: prev.penerima.filter((n) => n !== nama),
    }));
  };

  const addSemuaPengurus = () => {
    const semuaNama = pengurusList.map((p) => p.nama).filter((n) => n);
    setGenForm((prev) => ({ ...prev, penerima: semuaNama }));
  };

  const hapusSemuaPengurus = () => {
    setGenForm((prev) => ({ ...prev, penerima: [] }));
  };

  const handleKeyDownPenerima = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addPenerima(searchPenerima);
    }
  };

  const filteredList = nomorList.filter((n) => {
    if (filterStatus === "terpakai") return n.status === "Sudah terpakai";
    if (filterStatus === "belum") return n.status === "Belum terpakai";
    return true;
  });

  const totalItems = filteredList.length;
  const totalPages =
    itemsPerPage === 0 ? 1 : Math.ceil(totalItems / itemsPerPage);
  const currentTableData =
    itemsPerPage === 0
      ? filteredList
      : filteredList.slice(
          (currentPage - 1) * itemsPerPage,
          currentPage * itemsPerPage,
        );
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem =
    itemsPerPage === 0
      ? totalItems
      : Math.min(currentPage * itemsPerPage, totalItems);

  if (isLoading && nomorList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-spin w-8 h-8 border-4 border-[#DADCE0] border-t-[#1A73E8] rounded-full"></div>
      </div>
    );
  }

  const DropdownIndexKode = () => (
    <select
      value={genForm.index}
      onChange={(e) => setGenForm({ ...genForm, index: e.target.value })}
      className="w-full bg-white border border-[#DADCE0] px-3 py-2 rounded-md text-sm text-[#202124] outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition-colors"
    >
      <option value="SR">SR (Surat Rekomendasi)</option>
      <option value="UND">UND (Surat Undangan)</option>
      <option value="SK">SK (Surat Keterangan)</option>
      <option value="SKep">SKep (Surat Keputusan)</option>
      <option value="SPT">SPT (Surat Pemberitahuan)</option>
      <option value="SPH">SPH (Surat Permohonan)</option>
      <option value="SE">SE (Surat Edaran)</option>
      <option value="SPTG">SPTG (Surat Pengantar)</option>
      <option value="SBL">SBL (Surat Balasan)</option>
      <option value="INS">INS (Surat Instruksi)</option>
      <option value="SNY">SNY (Surat Pernyataan)</option>
      <option value="SPJ">SPJ (Surat Perjanjian)</option>
      <option value="SGH">SGH (Surat Pengesahan)</option>
      <option value="STB">STB (Surat Tembusan)</option>
      <option value="SIZ">SIZ (Surat Izin)</option>
      <option value="SPK">SPK (Surat Penugasan Kegiatan)</option>
      <option value="ND">ND (Nota Dinas)</option>
      <option value="MEM">MEM (Memo)</option>
      <option value="SKL">SKL (Surat Klarifikasi)</option>
      <option value="SPP">SPP (Surat Pemberhentian/Penonaktifan)</option>
      <option value="BA">BA (Berita Acara)</option>
    </select>
  );

  return (
    <div className="min-h-screen pb-12 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="mb-6 mt-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-medium text-slate-900 mb-1 tracking-tight">
              E-Office & Registri Surat
            </h2>
            <p className="text-slate-500 text-sm">
              Manajemen penomoran dan draf dokumen resmi IKA UII DIY.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setEditId(null);
                setModeForm("cepat");
                fetchData();
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto bg-white border border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
              Generate Nomor Surat
            </button>
            <button
              onClick={() => {
                setEditId(null);
                setModeForm("lengkap");
                setGenForm({
                  nomorUrut: "",
                  jenis: "Surat Undangan",
                  kategori: "Internal",
                  index: "UND",
                  perihal: "",
                  isiSurat: "Assalamu’alaikum warahmatullahi wabarakaatuh.\n\nDengan hormat, sehubungan dengan akan dilaksanakannya [nama agenda], kami mengundang Bapak/Ibu untuk berkenan hadir pada rapat koordinasi yang akan dilaksanakan pada:",
                  penutupSurat: "Demikian surat undangan ini kami sampaikan. Atas perhatian dan kehadirannya, kami ucapkan terima kasih.",
                  pembuat: "",
                  jabatanPembuat: "",
                  tglMasehi: new Date().toISOString().split("T")[0],
                  preview: "",
                  templateSurat: "Undangan Lipat 3",
                  penerima: [],
                  tglPelaksanaan: "",
                  waktuPelaksanaan: "",
                  tipePelaksanaan: "Offline",
                  tempatPelaksanaan: "",
                  linkZoom: "",
                });
                fetchData();
                setIsModalOpen(true);
              }}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Buat Surat Undangan
            </button>
          </div>
        </div>

        {/* STATISTIK */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div
            onClick={() => setFilterStatus("semua")}
            className={`p-6 rounded-2xl cursor-pointer transition-all border shadow-sm ${filterStatus === "semua" ? "border-blue-200 bg-blue-50/80" : "bg-white/80 border-slate-200 hover:bg-slate-50 hover:shadow-md"}`}
          >
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Total Dokumen
            </div>
            <h3 className={`text-4xl font-bold ${filterStatus === "semua" ? "text-blue-700" : "text-slate-800"}`}>
              {nomorList.length}
            </h3>
          </div>
          <div
            onClick={() => setFilterStatus("belum")}
            className={`p-6 rounded-2xl cursor-pointer transition-all border shadow-sm ${filterStatus === "belum" ? "border-amber-200 bg-amber-50/80" : "bg-white/80 border-slate-200 hover:bg-slate-50 hover:shadow-md"}`}
          >
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Draf / Belum Terpakai
            </div>
            <h3 className={`text-4xl font-bold ${filterStatus === "belum" ? "text-amber-600" : "text-slate-800"}`}>
              {nomorList.filter((n) => n.status === "Belum terpakai").length}
            </h3>
          </div>
          <div
            onClick={() => setFilterStatus("terpakai")}
            className={`p-6 rounded-2xl cursor-pointer transition-all border shadow-sm ${filterStatus === "terpakai" ? "border-emerald-200 bg-emerald-50/80" : "bg-white/80 border-slate-200 hover:bg-slate-50 hover:shadow-md"}`}
          >
            <div className="text-sm font-medium text-slate-500 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Dokumen Final
            </div>
            <h3 className={`text-4xl font-bold ${filterStatus === "terpakai" ? "text-emerald-600" : "text-slate-800"}`}>
              {nomorList.filter((n) => n.status === "Sudah terpakai").length}
            </h3>
          </div>
        </div>

        {/* TABEL DATABASE */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-800">
                Daftar Registri
              </h3>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                {filterStatus}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-500 bg-white cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={0}>Semua</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nomor Dokumen</th>
                  <th className="px-6 py-4">Perihal & Template</th>
                  <th className="px-6 py-4">Pembuat / Tanggal</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EAED]">
                {currentTableData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-[#5F6368] text-sm"
                    >
                      Tidak ada data untuk ditampilkan.
                    </td>
                  </tr>
                ) : (
                  currentTableData.map((n) => (
                    <tr
                      key={n.id}
                      className="hover:bg-[#F8F9FA] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#1A73E8] text-[13px]">
                          {n.nomor}
                        </div>
                        <div className="text-xs text-[#5F6368] mt-1">
                          {n.kategori} • {n.jenis}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[#202124] text-sm whitespace-normal line-clamp-2 max-w-sm">
                          {n.perihal}
                        </div>
                        <div className="text-[10px] text-[#5F6368] mt-1 bg-[#F1F3F4] px-1.5 py-0.5 rounded border border-[#DADCE0] w-fit">
                          Template: {n.templateSurat || "Standar A4"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#202124]">
                          {n.pembuat}
                          {n.jabatanPembuat && (
                            <span className="text-[10px] text-gray-500 block">
                              {n.jabatanPembuat}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#5F6368] mt-0.5">
                          {new Date(n.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => toggleStatus(n.id, n.status)}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors border ${n.status === "Sudah terpakai" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#CEEAD6] hover:bg-[#CEEAD6]" : "bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-[#E8EAED]"}`}
                        >
                          {n.status === "Sudah terpakai" ? "Final" : "Draf"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/dashboard/e-office/print/${n.id}`}
                            target="_blank"
                            className="text-[#1A73E8] hover:text-[#1557B0] bg-[#E8F0FE] hover:bg-[#D2E3FC] px-3 py-1.5 rounded text-xs font-medium transition-colors"
                          >
                            Cetak
                          </Link>
                          {n.jenis === "Surat Undangan" && (
                            <Link
                              href={`/dashboard/e-office/print-presensi/${n.id}`}
                              target="_blank"
                              className="text-[#1E8E3E] hover:text-[#145C27] bg-[#E6F4EA] hover:bg-[#CEEAD6] px-3 py-1.5 rounded text-xs font-medium transition-colors"
                              title="Cetak Daftar Hadir"
                            >
                              Presensi
                            </Link>
                          )}
                          <button
                            onClick={() => handleEdit(n)}
                            className="text-[#5F6368] hover:text-[#E37400] p-1.5 rounded hover:bg-[#FEF7E0] transition-colors"
                            title="Edit Dokumen"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(n.id)}
                            className="text-[#5F6368] hover:text-[#D93025] p-1.5 rounded hover:bg-[#FCE8E6] transition-colors"
                            title="Hapus"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalItems > 0 && itemsPerPage > 0 && (
            <div className="px-6 py-3 border-t border-[#DADCE0] bg-white flex justify-between items-center text-xs text-[#5F6368]">
              <div>
                Menampilkan {startItem}-{endItem} dari {totalItems}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 bg-white border border-[#DADCE0] rounded hover:bg-[#F8F9FA] disabled:opacity-50 transition-colors"
                >
                  Sebelumnya
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 bg-white border border-[#DADCE0] rounded hover:bg-[#F8F9FA] disabled:opacity-50 transition-colors"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PEMBUATAN / EDIT DOKUMEN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#202124]/40 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col max-h-[95vh] border border-[#DADCE0]">
            <div className="px-6 py-4 border-b border-[#DADCE0] flex justify-between items-center bg-white rounded-t-lg">
              <h2 className="text-lg font-normal text-[#202124]">
                {editId ? "Edit Dokumen Registri" : "Setup Dokumen Baru"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#5F6368] hover:bg-[#F1F3F4] p-1.5 rounded-full transition-colors"
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
            </div>

            {/* 🔥 TOGGLE MODE (Hanya Muncul Saat Buat Baru) 🔥 */}
            {!editId && (
              <div className="px-6 pt-5 bg-white">
                <div className="flex bg-[#F1F3F4] p-1 rounded-lg w-fit border border-[#DADCE0]">
                  <button
                    onClick={() => setModeForm("lengkap")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${modeForm === "lengkap" ? "bg-white text-[#1A73E8] shadow-sm" : "text-[#5F6368] hover:text-[#202124]"}`}
                  >
                    📝 Form Surat Lengkap (Web)
                  </button>
                  <button
                    onClick={() => setModeForm("cepat")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${modeForm === "cepat" ? "bg-white text-[#1E8E3E] shadow-sm" : "text-[#5F6368] hover:text-[#202124]"}`}
                  >
                    ⚡ Ambil Nomor Urut Saja
                  </button>
                </div>
              </div>
            )}

            {/* 🔥 KONDISIONAL RENDER FORM 🔥 */}
            {modeForm === "lengkap" || editId ? (
              <>
                {/* INI FORM LENGKAP LAMA JENENGAN (KOLOM KIRI & KANAN) */}
                <div className="p-6 overflow-y-auto bg-white grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
                  {/* KOLOM KIRI */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-medium text-[#1A73E8] border-b border-[#E8EAED] pb-2">
                      Pengaturan Penomoran & Acara
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#5F6368] mb-1">
                          Nomor Urut
                        </label>
                        <input
                          type="text"
                          value={genForm.nomorUrut}
                          onChange={(e) =>
                            setGenForm({
                              ...genForm,
                              nomorUrut: e.target.value,
                            })
                          }
                          className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5F6368] mb-1">
                          Index Kode
                        </label>
                        <DropdownIndexKode />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5F6368] mb-1">
                        Tanggal Surat / Dokumen
                      </label>
                      <input
                        type="date"
                        value={genForm.tglMasehi}
                        onChange={(e) =>
                          setGenForm({ ...genForm, tglMasehi: e.target.value })
                        }
                        className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#5F6368] mb-1">
                          Jenis Surat
                        </label>
                        <select
                          value={genForm.jenis}
                          onChange={(e) =>
                            setGenForm({ ...genForm, jenis: e.target.value })
                          }
                          className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                        >
                          <option value="Surat Undangan">Surat Undangan</option>
                          <option value="Surat Rekomendasi">
                            Surat Rekomendasi
                          </option>
                          <option value="Surat Keterangan">
                            Surat Keterangan
                          </option>
                          <option value="Surat Keputusan">
                            Surat Keputusan
                          </option>
                          <option value="Surat Pemberitahuan">
                            Surat Pemberitahuan
                          </option>
                          <option value="Surat Permohonan">
                            Surat Permohonan
                          </option>
                          <option value="Surat Edaran">Surat Edaran</option>
                          <option value="Surat Balasan">Surat Balasan</option>
                          <option value="Nota Dinas">Nota Dinas</option>
                          <option value="Memo">Memo</option>
                          <option value="Surat Biasa">
                            Surat Biasa (Lainnya)
                          </option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5F6368] mb-1">
                          Kategori
                        </label>
                        <select
                          value={genForm.kategori}
                          onChange={(e) =>
                            setGenForm({ ...genForm, kategori: e.target.value })
                          }
                          className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                        >
                          <option value="Eksternal">Eksternal</option>
                          <option value="Internal">Internal</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[#5F6368] mb-1">
                          Penanda Tangan <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          value={genForm.pembuat}
                          onChange={(e) => {
                            const selectedNama = e.target.value;
                            const pengurus = pengurusList.find(
                              (p) => p.nama === selectedNama,
                            );
                            setGenForm({
                              ...genForm,
                              pembuat: selectedNama,
                              jabatanPembuat: pengurus ? pengurus.jabatan : "",
                            });
                          }}
                          className="w-full bg-white border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:ring-1 focus:ring-[#1A73E8] focus:border-[#1A73E8] text-[#202124]"
                        >
                          <option value="">-- Pilih Nama --</option>
                          {pengurusList
                            .filter((p) => p.nama)
                            .map((p) => (
                              <option key={p.id} value={p.nama}>
                                {p.nama}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-[#5F6368] mb-1">
                          Jabatan di Surat
                        </label>
                        <input
                          type="text"
                          value={genForm.jabatanPembuat}
                          onChange={(e) =>
                            setGenForm({
                              ...genForm,
                              jabatanPembuat: e.target.value,
                            })
                          }
                          placeholder="Cth: Ketua Umum / a.n. Sekjen"
                          className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* KOLOM KANAN */}
                  <div className="space-y-5">
                    <h3 className="text-sm font-medium text-[#1E8E3E] border-b border-[#E8EAED] pb-2">
                      Konten & Target Undangan
                    </h3>
                    <div>
                      <label className="block text-xs font-medium text-[#5F6368] mb-1">
                        Format Template Web
                      </label>
                      <select
                        value={genForm.templateSurat}
                        onChange={(e) =>
                          setGenForm({
                            ...genForm,
                            templateSurat: e.target.value,
                          })
                        }
                        className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1E8E3E] focus:ring-1 focus:ring-[#1E8E3E] font-medium text-[#1E8E3E] bg-[#E6F4EA]/30"
                      >
                        <option value="Undangan Lipat 3">
                          Undangan Rapat/Acara (Landscape Lipat 3)
                        </option>
                        <option value="Standar A4">
                          Surat Resmi Standar (A4)
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5F6368] mb-1">
                        Perihal / Topik Kegiatan
                      </label>
                      <input
                        type="text"
                        value={genForm.perihal}
                        onChange={(e) =>
                          setGenForm({ ...genForm, perihal: e.target.value })
                        }
                        placeholder="Cth: Rapat Koordinasi Pengurus..."
                        className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1E8E3E] focus:ring-1 focus:ring-[#1E8E3E]"
                      />
                    </div>
                    <div className="bg-[#F8F9FA] p-4 rounded border border-[#DADCE0] space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#5F6368] uppercase tracking-widest mb-2">
                          Waktu & Tempat Pelaksanaan
                        </label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <input
                              type="date"
                              value={genForm.tglPelaksanaan}
                              onChange={(e) =>
                                setGenForm({
                                  ...genForm,
                                  tglPelaksanaan: e.target.value,
                                })
                              }
                              className="w-full border border-[#DADCE0] px-2 py-1.5 rounded text-xs outline-none focus:border-[#1E8E3E]"
                            />
                          </div>
                          <div>
                            <input
                              type="time"
                              value={genForm.waktuPelaksanaan}
                              onChange={(e) =>
                                setGenForm({
                                  ...genForm,
                                  waktuPelaksanaan: e.target.value,
                                })
                              }
                              className="w-full border border-[#DADCE0] px-2 py-1.5 rounded text-xs outline-none focus:border-[#1E8E3E]"
                            />
                          </div>
                        </div>
                        <div className="flex gap-3 mb-3">
                          <label className="flex items-center gap-1.5 text-xs text-[#5F6368] cursor-pointer">
                            <input 
                              type="radio" 
                              name="tipePelaksanaan"
                              checked={genForm.tipePelaksanaan === "Offline"}
                              onChange={() => setGenForm({ ...genForm, tipePelaksanaan: "Offline" })}
                              className="accent-[#1E8E3E]"
                            />
                            Tatap Muka (Offline)
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-[#5F6368] cursor-pointer">
                            <input 
                              type="radio" 
                              name="tipePelaksanaan"
                              checked={genForm.tipePelaksanaan === "Online"}
                              onChange={() => setGenForm({ ...genForm, tipePelaksanaan: "Online" })}
                              className="accent-[#1E8E3E]"
                            />
                            Daring (Online Zoom/Meet)
                          </label>
                        </div>
                        
                        {genForm.tipePelaksanaan === "Offline" ? (
                          <input
                            type="text"
                            value={genForm.tempatPelaksanaan}
                            onChange={(e) =>
                              setGenForm({
                                ...genForm,
                                tempatPelaksanaan: e.target.value,
                              })
                            }
                            placeholder="Tempat / Lokasi / Alamat Lengkap"
                            className="w-full border border-[#DADCE0] px-2 py-1.5 rounded text-xs outline-none focus:border-[#1E8E3E]"
                          />
                        ) : (
                          <input
                            type="url"
                            value={genForm.linkZoom}
                            onChange={(e) =>
                              setGenForm({
                                ...genForm,
                                linkZoom: e.target.value,
                              })
                            }
                            placeholder="Link Zoom / Google Meet (https://...)"
                            className="w-full border border-[#DADCE0] px-2 py-1.5 rounded text-xs outline-none focus:border-[#1A73E8]"
                          />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5F6368] mb-1">
                        Isi / Pesan Pembuka
                      </label>
                      <textarea
                        value={genForm.isiSurat}
                        onChange={(e) =>
                          setGenForm({ ...genForm, isiSurat: e.target.value })
                        }
                        placeholder="Assalamu'alaikum wr. wb. Mengharap kehadiran Bapak/Ibu pada kegiatan..."
                        rows={2}
                        className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1E8E3E] focus:ring-1 focus:ring-[#1E8E3E] resize-none custom-scrollbar"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#5F6368] mb-1">
                        Kalimat Penutup
                      </label>
                      <textarea
                        value={genForm.penutupSurat}
                        onChange={(e) =>
                          setGenForm({
                            ...genForm,
                            penutupSurat: e.target.value,
                          })
                        }
                        placeholder="Demikian surat ini..."
                        rows={2}
                        className="w-full border border-[#DADCE0] px-3 py-2 rounded text-sm outline-none focus:border-[#1E8E3E] focus:ring-1 focus:ring-[#1E8E3E] resize-none custom-scrollbar"
                      ></textarea>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-xs font-medium text-[#5F6368]">
                          Peserta / Undangan
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={addSemuaPengurus}
                            className="text-[10px] text-[#1A73E8] hover:underline font-medium"
                          >
                            Pilih Semua
                          </button>
                          <button
                            type="button"
                            onClick={hapusSemuaPengurus}
                            className="text-[10px] text-[#D93025] hover:underline font-medium"
                          >
                            Hapus Semua
                          </button>
                        </div>
                      </div>
                      <div className="min-h-[42px] border border-[#DADCE0] rounded flex flex-wrap gap-1.5 p-1.5 focus-within:border-[#1E8E3E] focus-within:ring-1 focus-within:ring-[#1E8E3E] transition-all bg-white max-h-24 overflow-y-auto custom-scrollbar">
                        {genForm.penerima.map((nama) => (
                          <span
                            key={nama}
                            className="bg-[#E8F0FE] text-[#1A73E8] border border-[#D2E3FC] text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1"
                          >
                            {nama}
                            <button
                              type="button"
                              onClick={() => removePenerima(nama)}
                              className="hover:text-[#D93025] hover:bg-[#D2E3FC] rounded-full p-0.5 leading-none"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          placeholder={
                            genForm.penerima.length === 0
                              ? "Ketik nama & tekan Enter..."
                              : "Ketik lalu Enter..."
                          }
                          value={searchPenerima}
                          onChange={(e) => {
                            setSearchPenerima(e.target.value);
                            setIsDropdownOpen(true);
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          onKeyDown={handleKeyDownPenerima}
                          className="flex-1 min-w-[120px] outline-none text-xs px-1 bg-transparent"
                        />
                      </div>
                      {isDropdownOpen &&
                        (searchPenerima.length > 0 ||
                          filteredPengurus.length > 0) && (
                          <div className="absolute bottom-full mb-1 z-50 w-full bg-white border border-[#DADCE0] rounded-md shadow-lg max-h-40 overflow-y-auto custom-scrollbar">
                            {filteredPengurus.length > 0 ? (
                              filteredPengurus.map((p) => (
                                <div
                                  key={p.id}
                                  onClick={() => addPenerima(p.nama)}
                                  className="px-3 py-2 text-sm text-[#202124] hover:bg-[#F1F3F4] cursor-pointer border-b border-[#F1F3F4] last:border-0"
                                >
                                  <div className="font-medium">{p.nama}</div>
                                  <div className="text-[10px] text-[#5F6368]">
                                    {p.jabatan} • {p.bidang}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-[11px] text-[#5F6368] italic flex items-center gap-2">
                                <span className="bg-slate-100 p-1 rounded">
                                  Enter ↵
                                </span>{" "}
                                Tekan Enter untuk menambah undangan external
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-[#F8F9FA] border-t border-[#DADCE0] flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-lg">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-medium text-[#5F6368] uppercase tracking-wider mb-1">
                      Preview Nomor
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={genForm.preview}
                      className="w-full bg-transparent border-none text-[#1A73E8] text-base font-medium outline-none select-all p-0"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-[#5F6368] hover:bg-[#E8EAED] rounded transition-colors w-full sm:w-auto"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-6 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-sm font-medium rounded shadow-sm disabled:opacity-50 transition-colors w-full sm:w-auto"
                    >
                      {isSaving
                        ? "Menyimpan..."
                        : editId
                          ? "Update Dokumen"
                          : "Simpan Dokumen"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* 🔥 INI FORM "AMBIL NOMOR SAJA" 🔥 */
              <div className="p-6 overflow-y-auto bg-white custom-scrollbar flex flex-col items-center">
                <div className="w-full max-w-lg">
                  <div className="bg-[#E6F4EA] border border-[#CEEAD6] p-4 rounded-lg mb-6 flex gap-3 text-[#1E8E3E]">
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
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h4 className="font-bold text-sm">
                        Mode Buku Agenda (Manual)
                      </h4>
                      <p className="text-xs mt-1">
                        Gunakan ini jika Anda sudah punya dokumen di Microsoft
                        Word dan hanya butuh nomor registrasi resmi dari sistem
                        agar urutannya tidak terloncat.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleAmbilNomor} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#5F6368] mb-1">
                        Jenis Surat
                      </label>
                      <select
                        required
                        value={formCepat.jenisSurat}
                        onChange={(e) =>
                          setFormCepat({
                            ...formCepat,
                            jenisSurat: e.target.value,
                          })
                        }
                        className="w-full border border-[#DADCE0] rounded p-2.5 text-sm focus:border-[#1E8E3E] outline-none"
                      >
                        <option value="Surat Keluar Umum">
                          Surat Keluar Umum
                        </option>
                        <option value="Surat Keputusan">
                          Surat Keputusan (SK)
                        </option>
                        <option value="Surat Tugas">Surat Tugas</option>
                        <option value="Surat Keterangan">
                          Surat Keterangan
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5F6368] mb-1">
                        Perihal / Tentang
                      </label>
                      <input
                        required
                        type="text"
                        value={formCepat.perihal}
                        onChange={(e) =>
                          setFormCepat({
                            ...formCepat,
                            perihal: e.target.value,
                          })
                        }
                        className="w-full border border-[#DADCE0] rounded p-2.5 text-sm focus:border-[#1E8E3E] outline-none"
                        placeholder="Contoh: Permohonan Audiensi Pengurus"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5F6368] mb-1">
                        Tujuan / Kepada Yth.
                      </label>
                      <input
                        required
                        type="text"
                        value={formCepat.tujuan}
                        onChange={(e) =>
                          setFormCepat({ ...formCepat, tujuan: e.target.value })
                        }
                        className="w-full border border-[#DADCE0] rounded p-2.5 text-sm focus:border-[#1E8E3E] outline-none"
                        placeholder="Contoh: Rektor UII"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5F6368] mb-1">
                        Tanggal Surat
                      </label>
                      <input
                        required
                        type="date"
                        value={formCepat.tanggalSurat}
                        onChange={(e) =>
                          setFormCepat({
                            ...formCepat,
                            tanggalSurat: e.target.value,
                          })
                        }
                        className="w-full border border-[#DADCE0] rounded p-2.5 text-sm focus:border-[#1E8E3E] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#5F6368] mb-1">
                        Penanda Tangan <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formCepat.pembuat}
                        onChange={(e) => {
                          const selectedNama = e.target.value;
                          const pengurus = pengurusList.find(
                            (p) => p.nama === selectedNama,
                          );
                          setFormCepat({
                            ...formCepat,
                            pembuat: selectedNama,
                            jabatanPembuat: pengurus ? pengurus.jabatan : "",
                          });
                        }}
                        className="w-full border border-[#DADCE0] rounded p-2.5 text-sm focus:border-[#1E8E3E] outline-none"
                      >
                        <option value="">-- Pilih Penandatangan --</option>
                        {pengurusList
                          .filter((p) => p.nama)
                          .map((p) => (
                            <option key={p.id} value={p.nama}>
                              {p.nama}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="pt-4 flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-5 py-2 text-sm font-medium text-[#5F6368] hover:bg-[#E8EAED] rounded transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#1E8E3E] hover:bg-[#137333] text-white text-sm font-bold rounded shadow-sm disabled:opacity-50 transition-colors"
                      >
                        {isSaving ? "Memproses..." : "Generate & Ambil Nomor"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
