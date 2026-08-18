"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { toPng } from "html-to-image";

export default function LengkapiProfilPage() {
  const { id } = useParams() as { id: string };

  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [isPengurus, setIsPengurus] = useState(false);
  const [collectionSources, setCollectionSources] = useState<string[]>([]);
  
  // Fields state
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    domisili: "",
    fakultas: "",
    programStudi: "",
    angkatan: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Base64 Logo State
  const [logoBase64, setLogoBase64] = useState("/logo-dpp-ika.png");
  
  // KTA Preview State
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const ktaRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let foundData: any = null;
        let sources = [];
        let isP = false;

        // Cek pengurus
        const pengurusRef = doc(db, "pengurus", id);
        const pengurusSnap = await getDoc(pengurusRef);
        if (pengurusSnap.exists()) {
          foundData = { id: pengurusSnap.id, ...pengurusSnap.data() };
          sources.push("pengurus");
          isP = foundData.isPengurus || foundData.role === "pengurus";
        }

        // Cek pendaftar
        const pendaftarRef = doc(db, "pendaftar", id);
        const pendaftarSnap = await getDoc(pendaftarRef);
        if (pendaftarSnap.exists()) {
          if (!foundData) {
            foundData = { id: pendaftarSnap.id, ...pendaftarSnap.data() };
            isP = false;
          }
          sources.push("pendaftar");
        }

        if (foundData) {
          setUserData(foundData);
          setIsPengurus(isP);
          setCollectionSources(sources);
          setFormData({
            domisili: foundData.domisili || "",
            fakultas: foundData.fakultas || "",
            programStudi: foundData.programStudi || "",
            angkatan: foundData.angkatan || "",
          });
        }
        
        // Fetch logo as base64 to fix html-to-image rendering issue
        try {
          const res = await fetch("/logo-dpp-ika.png");
          const blob = await res.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) setLogoBase64(reader.result as string);
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error("Gagal load logo base64", err);
        }

      } catch (error) {
        console.error("Gagal mengambil data", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB");
        return;
      }
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let finalFotoUrl = userData.fotoUrl;

      if (fotoFile) {
        const fileRef = ref(storage, `foto-profil/${id}_${Date.now()}`);
        const uploadTask = uploadBytesResumable(fileRef, fotoFile);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              finalFotoUrl = await getDownloadURL(uploadTask.snapshot.ref);
              resolve();
            }
          );
        });
      }

      const updatePayload = {
        ...formData,
        fotoUrl: finalFotoUrl || userData.fotoUrl || "",
        updatedAt: new Date().toISOString(),
      };

      // Update semua koleksi
      for (const source of collectionSources) {
        await updateDoc(doc(db, source, id), updatePayload);
      }

      setUserData({ ...userData, ...updatePayload });
      
      // Start Countdown
      setIsSuccess(true);
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!ktaRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ktaRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `KTA_${userData.nama}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal mendownload KTA", err);
      alert("Gagal mendownload KTA. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const getSingkatanFakultas = (fakultas: string) => {
    if (!fakultas) return "-";
    const lower = fakultas.toLowerCase();
    if (lower.includes("teknologi industri")) return "FTI";
    if (lower.includes("matematika")) return "FMIPA";
    if (lower.includes("hukum")) return "FH";
    if (lower.includes("ekonomi")) return "FE/FBE";
    if (lower.includes("kedokteran")) return "FK";
    if (lower.includes("psikologi")) return "FPSB";
    if (lower.includes("sipil")) return "FTSP";
    if (lower.includes("agama")) return "FIAI";
    return fakultas;
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat data...</div>;
  }

  if (!userData) {
    return <div className="min-h-screen flex items-center justify-center">Data tidak ditemukan.</div>;
  }

  const isFormLengkap = userData.fotoUrl && userData.domisili && userData.fakultas;

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <img src={logoBase64} alt="Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-[#0B1528] uppercase tracking-widest">
            Portal KTA Digital
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isSuccess && countdown === 0
              ? "KTA Anda telah diterbitkan."
              : "Lengkapi data profil untuk menerbitkan Kartu Tanda Anggota."}
          </p>
        </div>

        {!isSuccess && (
          <div className="bg-white rounded-2xl shadow-xl border border-[#DADCE0] overflow-hidden">
            <div className="bg-[#1A73E8] p-5 text-white">
              <h2 className="font-bold">Halo, {userData.nama}!</h2>
              <p className="text-xs text-blue-100 mt-1">Kami membutuhkan beberapa data tambahan untuk melengkapi E-KTA Anda.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {!userData.fotoUrl && !fotoPreview && (
                <div>
                  <label className="block text-xs font-bold mb-2 text-[#202124]">
                    Upload Foto Profil (Wajib)
                  </label>
                  <div className="border-2 border-dashed border-[#DADCE0] rounded-xl p-6 text-center hover:bg-slate-50 transition-colors">
                    <input type="file" accept="image/*" onChange={handleFileChange} required className="hidden" id="foto" />
                    <label htmlFor="foto" className="cursor-pointer flex flex-col items-center">
                      <div className="w-12 h-12 bg-[#E8F0FE] text-[#1A73E8] rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <span className="text-sm font-medium text-[#1A73E8]">Pilih Foto Anda</span>
                      <span className="text-xs text-slate-500 mt-1">Format: JPG/PNG (Maks 2MB)</span>
                    </label>
                  </div>
                </div>
              )}

              {(fotoPreview || userData.fotoUrl) && (
                <div className="flex flex-col items-center">
                  <label className="block text-xs font-bold mb-2 text-[#202124] self-start">Foto Profil</label>
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg">
                    <img src={fotoPreview || userData.fotoUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  {!isFormLengkap && (
                    <label htmlFor="foto-ganti" className="mt-3 text-xs font-bold text-[#1A73E8] cursor-pointer hover:underline">
                      Ganti Foto
                    </label>
                  )}
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="foto-ganti" />
                </div>
              )}

              {!userData.domisili && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">Wilayah DPD Domisili (Wajib)</label>
                  <select name="domisili" value={formData.domisili} onChange={handleChange} required className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm bg-white">
                    <option value="">-- Pilih Wilayah --</option>
                    <option value="Sleman">Sleman</option>
                    <option value="Bantul">Bantul</option>
                    <option value="Kota Yogyakarta">Kota Yogyakarta</option>
                    <option value="Gunungkidul">Gunungkidul</option>
                    <option value="Kulon Progo">Kulon Progo</option>
                    <option value="Luar DIY">Luar DIY</option>
                  </select>
                </div>
              )}

              {(!userData.fakultas || !userData.programStudi) && (
                <div className="grid grid-cols-2 gap-4">
                  {!userData.fakultas && (
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-[#202124]">Fakultas</label>
                      <input type="text" name="fakultas" placeholder="Cth: Ekonomi" value={formData.fakultas} onChange={handleChange} required className="w-full border border-[#DADCE0] px-3 py-2.5 rounded-lg text-sm" />
                    </div>
                  )}
                  {!userData.programStudi && (
                    <div>
                      <label className="block text-xs font-bold mb-1.5 text-[#202124]">Program Studi</label>
                      <input type="text" name="programStudi" placeholder="Cth: Manajemen" value={formData.programStudi} onChange={handleChange} required className="w-full border border-[#DADCE0] px-3 py-2.5 rounded-lg text-sm" />
                    </div>
                  )}
                </div>
              )}

              {!userData.angkatan && (
                <div>
                  <label className="block text-xs font-bold mb-1.5 text-[#202124]">Tahun Angkatan</label>
                  <input type="number" name="angkatan" placeholder="Cth: 2015" value={formData.angkatan} onChange={handleChange} required className="w-full border border-[#DADCE0] px-4 py-2.5 rounded-lg text-sm" />
                </div>
              )}

              <div className="pt-4 mt-6 border-t border-[#EBEBEB]">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#1A73E8] text-white py-3 rounded-xl font-bold hover:bg-[#1557B0] transition-colors shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      {uploadProgress > 0 && uploadProgress < 100 ? `Mengupload ${uploadProgress}%` : 'Memproses...'}
                    </>
                  ) : (
                    "Simpan Data & Terbitkan KTA"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {isSuccess && (
          <div className="mt-8 flex flex-col items-center">
            {countdown > 0 ? (
              <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 rounded-full bg-[#1A73E8] text-white flex items-center justify-center text-5xl font-black shadow-lg">
                  {countdown}
                </div>
                <p className="font-medium text-slate-600 animate-pulse">Menyiapkan E-KTA Anda...</p>
              </div>
            ) : (
              <div className="w-full animate-in slide-in-from-bottom-8 fade-in duration-700 ease-out">
                {/* 💳 PREVIEW KTA KARTU 💳 */}
                <div className="relative w-full max-w-[280px] aspect-[380/600] mx-auto mb-8 shadow-2xl rounded-[16px]">
                  <div
                    ref={ktaRef}
                    className="relative w-full h-full bg-white rounded-[16px] overflow-hidden flex flex-col border border-[#DADCE0]"
                  >
                    <img
                      src={logoBase64}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 opacity-[0.04] grayscale pointer-events-none z-0"
                    />
                    <div className="relative pt-6 pb-4 w-full shrink-0 z-10 bg-[#0B1528] flex flex-col items-center justify-center">
                      <div className="absolute bottom-0 left-0 right-0 h-3 bg-[#224A9A]"></div>
                      <div className="flex flex-col z-10 px-4 text-center">
                        <h1 className="text-white font-black text-[14px] tracking-widest uppercase mb-1 mt-2">
                          KARTU TANDA {isPengurus ? "PENGURUS" : "ANGGOTA"}
                        </h1>
                        <h2 className="text-[#F29900] font-bold text-[8px] tracking-[0.2em] uppercase">
                          DPW IKA UII D.I.YOGYAKARTA
                        </h2>
                      </div>
                    </div>
                    <div className="h-[4px] w-full bg-[#F29900] shrink-0 z-10 relative"></div>

                    <div className="flex-grow flex flex-col items-center px-4 py-5 relative z-10 text-center">
                      <div className="w-[90px] h-[115px] bg-[#F8F9FA] rounded-lg border-[3px] border-white shadow-md overflow-hidden shrink-0 mb-3">
                        <img
                          src={userData.fotoUrl || fotoPreview}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: userData.fotoPosition || "center" }}
                          crossOrigin="anonymous"
                        />
                      </div>

                      <div className="w-full space-y-2">
                        <div>
                          <p className="text-[15px] font-black text-[#0B1528] uppercase line-clamp-2 px-2 leading-tight">
                            {userData.nama}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
                            Nomor Induk {isPengurus ? "Pengurus" : "Anggota"}
                          </p>
                          <p className="text-[12px] font-bold text-[#0B1528] tracking-widest font-mono bg-[#F8F9FA] inline-block px-3 py-1 rounded border border-[#EBEBEB]">
                            {userData.nia || "SEDANG DIPROSES"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
                            Program Studi / Angkatan
                          </p>
                          <p className="text-[10px] font-black text-[#224A9A] uppercase leading-tight">
                            {getSingkatanFakultas(userData.fakultas || formData.fakultas)} / {userData.programStudi || formData.programStudi} / {userData.angkatan || formData.angkatan}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2.5 pb-3 bg-[#F8FAFC] border-t border-[#EBEBEB] shrink-0 z-10 relative flex items-center justify-center">
                      <p className="text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-0.5">
                        <span className="text-[#0B1528]">IKADIY.</span>
                        <span className="text-[#224A9A]">UII</span>
                        <span className="text-[#0B1528]">.AC.ID</span>
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="w-full max-w-[280px] mx-auto bg-[#1E8E3E] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#156E2F] shadow-lg transition-transform hover:-translate-y-1"
                >
                  {isDownloading ? "Memproses Gambar..." : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download E-KTA
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
