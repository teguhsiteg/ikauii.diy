"use client";

import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- MINIMALIST ICONS ---
const IconAgenda = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const IconMitra = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const IconMerch = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
    />
  </svg>
);
const IconCheck = () => (
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
      d="M5 13l4 4L19 7"
    />
  </svg>
);
const IconProfile = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const IconAlert = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const IconPlus = () => (
  <svg
    className="w-4 h-4"
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
);

export default function DashboardAnggotaPage() {
  const router = useRouter();
  const [, setUserAuth] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);

  const [userKoleksi, setUserKoleksi] = useState<"pengurus" | "pendaftar">(
    "pendaftar",
  );

  const [isFetchingData, setIsFetchingData] = useState(true);
  const [showWelcomeScreen, setShowWelcomeScreen] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  const [activeTab, setActiveTab] = useState("beranda");

  const [agendaList, setAgendaList] = useState<any[]>([]);
  const [mitraList, setMitraList] = useState<any[]>([]);
  const [merchList, setMerchList] = useState<any[]>([]);
  const [saranMerch, setSaranMerch] = useState("");
  const [isSubmittingSaran, setIsSubmittingSaran] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    pekerjaan: "",
    domisili_asal: "",
    alamatLengkap: "",
    linkedinUrl: "",
    instagramUrl: "",
    fotoUrl: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // JARING PENGAMAN: Beri sedikit jeda waktu kalau currentUser belum ter-load sempurna
      if (!currentUser) {
        console.warn(
          "User tidak terdeteksi di /anggota, melempar ke /login...",
        );
        router.push("/login");
        return;
      }

      setUserAuth(currentUser);

      try {
        let fetchedData: any = null;
        let currentKoleksi: "pengurus" | "pendaftar" = "pendaftar";
        const userEmail = (currentUser.email || "").toLowerCase();

        // 1. CARI DI KOLEKSI PENGURUS
        const qPengurus = query(
          collection(db, "pengurus"),
          where("email", "==", userEmail),
        );
        const snapPengurus = await getDocs(qPengurus);

        if (!snapPengurus.empty) {
          fetchedData = {
            id: snapPengurus.docs[0].id,
            ...snapPengurus.docs[0].data(),
          };
          currentKoleksi = "pengurus";
        }
        // 2. CARI DI KOLEKSI PENDAFTAR
        else {
          const qPendaftar = query(
            collection(db, "pendaftar"),
            where("email", "==", userEmail),
          );
          const snapPendaftar = await getDocs(qPendaftar);

          if (!snapPendaftar.empty) {
            fetchedData = {
              id: snapPendaftar.docs[0].id,
              ...snapPendaftar.docs[0].data(),
            };
            currentKoleksi = "pendaftar";
          } else {
            // Fallback UID
            const pRef = doc(db, "pendaftar", currentUser.uid);
            const pSnap = await getDoc(pRef);
            if (pSnap.exists()) {
              fetchedData = { id: pSnap.id, ...pSnap.data() };
              currentKoleksi = "pendaftar";
            }
          }
        }

        // 🔥 PERBAIKAN: SINKRONISASI DENGAN GATEWAY (Cari di tabel users) 🔥
        if (!fetchedData) {
          const uRef = doc(db, "users", currentUser.uid);
          const uSnap = await getDoc(uRef);
          if (uSnap.exists()) {
            fetchedData = {
              id: uSnap.id,
              ...uSnap.data(),
              role: uSnap.data().role,
            };
            // Kita anggap admin masuk ke pendaftar secara default agar UI tidak error
            currentKoleksi = "pendaftar";
          }
        }

        // 🔥 PERBAIKAN: JARING PENGAMAN TERAKHIR JIKA MASIH KOSONG 🔥
        if (!fetchedData) {
          fetchedData = {
            id: currentUser.uid,
            nama:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "User",
            email: currentUser.email,
            status: "Pendaftar",
          };
        }

        // SEKARANG SET DATA DENGAN AMAN
        setUserData(fetchedData);
        setUserKoleksi(currentKoleksi);

        const foto = fetchedData.fotoUrl || fetchedData.foto || "";
        const finalDomisili =
          fetchedData.domisili || fetchedData.domisili_asal || "";

        setFormData({
          pekerjaan: fetchedData.pekerjaan || "",
          domisili_asal: finalDomisili,
          alamatLengkap: fetchedData.alamatLengkap || "",
          linkedinUrl: fetchedData.linkedinUrl || "",
          instagramUrl: fetchedData.instagramUrl || "",
          fotoUrl: foto,
        });
        setImagePreview(foto || null);

        // LOGIKA ONBOARDING
        const isPengurusSah =
          fetchedData.isPengurus === true ||
          ["admin", "superadmin", "super_admin"].includes(
            fetchedData.role?.toLowerCase(),
          ) ||
          fetchedData.status_pengurus === "Aktif";

        if (isPengurusSah) {
          if (!foto) {
            setIsOnboarding(true);
            setOnboardingStep(1);
          } else {
            setIsOnboarding(false);
          }
        } else {
          if (
            !foto ||
            !fetchedData.pekerjaan ||
            !finalDomisili ||
            !fetchedData.alamatLengkap
          ) {
            setIsOnboarding(true);
          }
        }

        // Fetch Menu Lainnya (Event, Direktori, Merch)
        try {
          const [snapAgenda, snapMitra] = await Promise.all([
            getDocs(
              query(collection(db, "agenda"), orderBy("createdAt", "desc")),
            ),
            getDocs(
              query(
                collection(db, "direktori_bisnis"),
                orderBy("createdAt", "desc"),
              ),
            ),
          ]);
          setAgendaList(
            snapAgenda.docs.map((d) => ({ id: d.id, ...d.data() })),
          );
          setMitraList(
            snapMitra.docs
              .map((d) => ({ id: d.id, ...d.data() }))
              .filter((m: any) =>
                ["Approved", "Tayang", "Disetujui"].includes(m.status),
              ),
          );

          const snapMerch = await getDocs(
            query(collection(db, "merchandise"), orderBy("createdAt", "desc")),
          );
          setMerchList(snapMerch.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (fetchError) {
          console.warn("Beberapa data pelengkap gagal dimuat:", fetchError);
        }
      } catch (error) {
        console.error("Gagal mengambil data user:", error);
      } finally {
        setIsFetchingData(false);
        setTimeout(() => setShowWelcomeScreen(false), 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) {
        toast.warning("Ukuran foto terlalu besar. Maksimal 2MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setUploadProgress("");
    }
  };

  const handleUploadPhotoAction = async () => {
    if (!imageFile || !userData) return false;
    setIsUploadingPhoto(true);
    setUploadProgress("Memproses gambar...");

    try {
      const imageFormData = new FormData();
      imageFormData.append("file", imageFile);
      imageFormData.append("upload_preset", "profil_anggota");

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload`,
        {
          method: "POST",
          body: imageFormData,
        },
      );

      if (!uploadRes.ok) throw new Error("Server gambar menolak upload.");

      const uploadData = await uploadRes.json();
      const newPhotoUrl = uploadData.secure_url;

      await updateDoc(doc(db, userKoleksi, userData.id), {
        fotoUrl: newPhotoUrl,
        foto: newPhotoUrl,
        updatedAt: new Date().toISOString(),
      });

      setFormData((prev) => ({ ...prev, fotoUrl: newPhotoUrl }));
      setUserData((prev: any) => ({
        ...prev,
        fotoUrl: newPhotoUrl,
        foto: newPhotoUrl,
      }));
      setUploadProgress("✅ Foto berhasil diunggah!");
      setImageFile(null);
      setTimeout(() => setUploadProgress(""), 3000);
      return newPhotoUrl;
    } catch (error: any) {
      console.error(error);
      setUploadProgress("❌ Gagal upload.");
      toast.error(`Gagal upload foto: ${error.message}`);
      return false;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveData = async () => {
    if (!userData) return;
    setIsSaving(true);
    try {
      await updateDoc(doc(db, userKoleksi, userData.id), {
        pekerjaan: formData.pekerjaan,
        domisili_asal: formData.domisili_asal,
        alamatLengkap: formData.alamatLengkap,
        linkedinUrl: formData.linkedinUrl,
        instagramUrl: formData.instagramUrl,
        updatedAt: new Date().toISOString(),
      });
      setUserData({ ...userData, ...formData });
      setIsOnboarding(false);
    } catch (error: any) {
      console.error("Save Data Error:", error);
      toast.error(`Terjadi kesalahan saat menyimpan data: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getNIA = () => {
    if (!userData) return "";
    if (userData.nia) return userData.nia;
    return "MENUNGGU PENOMORAN";
  };

  // 🔥 PENGECEKAN STATUS E-KTA 🔥
  const isKTAValid =
    userData?.status === "Disetujui" ||
    userData?.status === "Aktif" ||
    userData?.status_pengurus === "Aktif" ||
    userData?.isPengurus === true ||
    userData?.role === "pengurus" ||
    userData?.role === "admin";

  if (isFetchingData || showWelcomeScreen) {
    return (
      <div className="fixed inset-0 bg-white z-[999] flex flex-col items-center justify-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-[#F8F9FA] rounded-full p-2 mb-6 border border-[#DADCE0] shadow-sm animate-pulse">
          <img
            src="/logo-dpp-ika.png"
            alt="Logo IKA UII"
            className="w-full h-full object-contain"
          />
        </div>
        <h2 className="text-[#191919] font-bold text-lg mb-2">
          IKA UII Workspace
        </h2>
        <p className="text-[#5F6368] text-sm mb-8 animate-pulse">
          {isFetchingData
            ? "Memuat kredensial Anda..."
            : `Selamat datang, ${userData?.namaLengkap?.split(" ")[0] || userData?.nama?.split(" ")[0] || "Alumni"}...`}
        </p>
        <div className="w-48 h-1 bg-[#EBEBEB] rounded-full overflow-hidden">
          <div className="h-full bg-[#0A66C2] rounded-full w-1/2 animate-[progress_1.5s_ease-in-out_infinite]"></div>
        </div>
      </div>
    );
  }

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-[#F4F2EE] font-sans text-[#191919] py-10 px-4 flex items-center justify-center">
        <div className="max-w-[600px] w-full bg-white rounded-2xl shadow-lg border border-[#EBEBEB] overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="bg-[#F8F9FA] p-6 border-b border-[#EBEBEB] text-center">
            <h2 className="text-2xl font-black text-[#191919] tracking-tight">
              Lengkapi Profil Anda
            </h2>
            <p className="text-[#666666] text-sm mt-2">
              Mari perbarui informasi Anda untuk pengalaman maksimal di
              ekosistem IKA UII DIY.
            </p>
            <div className="flex justify-center items-center gap-3 mt-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${onboardingStep === step ? "bg-[#0A66C2] text-white shadow-md" : onboardingStep > step ? "bg-[#E6F4EA] text-[#1E8E3E]" : "bg-[#EBEBEB] text-[#9AA0A6]"}`}
                  >
                    {onboardingStep > step ? <IconCheck /> : step}
                  </div>
                  {step !== 3 && (
                    <div
                      className={`w-10 h-1 rounded-full ${onboardingStep > step ? "bg-[#1E8E3E]" : "bg-[#EBEBEB]"}`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            {onboardingStep === 1 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold mb-4">1. Pas Foto E-KTA</h3>
                <p className="text-sm text-[#666666] mb-6">
                  Unggah foto formal atau setengah badan Anda. Foto ini wajib
                  untuk penerbitan Kartu Tanda Anggota Elektronik.
                </p>
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-40 bg-[#F8F9FA] border-2 border-dashed border-[#DADCE0] rounded-xl overflow-hidden flex items-center justify-center mb-4 relative">
                    {imagePreview || formData.fotoUrl ? (
                      <img
                        src={imagePreview || formData.fotoUrl}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[#9AA0A6] text-xs font-medium">
                        Rasio 3:4
                      </span>
                    )}
                  </div>

                  {!imageFile && !formData.fotoUrl && (
                    <label className="cursor-pointer bg-white border border-[#0A66C2] text-[#0A66C2] hover:bg-[#E8F0FE] font-bold py-2 px-6 rounded-full transition-colors text-sm">
                      Pilih Foto Baru
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}

                  {imageFile && !isUploadingPhoto && (
                    <button
                      onClick={handleUploadPhotoAction}
                      className="bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-2 px-6 rounded-full transition-colors text-sm shadow-sm"
                    >
                      Unggah Foto Sekarang
                    </button>
                  )}

                  {isUploadingPhoto && (
                    <div className="text-sm text-[#1A73E8] font-bold animate-pulse flex items-center gap-2">
                      <svg
                        className="w-4 h-4 animate-spin"
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
                      {uploadProgress}
                    </div>
                  )}

                  {formData.fotoUrl && !imageFile && !isUploadingPhoto && (
                    <div className="flex flex-col items-center gap-2 mt-2">
                      <div className="text-[#1E8E3E] text-sm font-bold bg-[#E6F4EA] px-4 py-1.5 rounded-full flex items-center gap-1">
                        <IconCheck /> Foto Tersimpan
                      </div>
                      <label className="cursor-pointer text-[#0A66C2] text-xs font-bold hover:underline transition-all mt-1">
                        Ganti Foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex justify-end pt-6 border-t border-[#EBEBEB]">
                  <button
                    onClick={() => setOnboardingStep(2)}
                    disabled={!formData.fotoUrl}
                    className="bg-[#191919] hover:bg-black text-white font-bold py-2.5 px-8 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya &rarr;
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold mb-4">2. Karier & Lokasi</h3>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-[#5F6368] uppercase mb-1.5">
                      Pekerjaan Terkini
                    </label>
                    <input
                      type="text"
                      value={formData.pekerjaan}
                      onChange={(e) =>
                        setFormData({ ...formData, pekerjaan: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#0A66C2] outline-none text-sm transition-colors"
                      placeholder="Cth: Pegawai Negeri, Pengusaha, dll"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5F6368] uppercase mb-1.5">
                      Pilih Daerah (Domisili)
                    </label>
                    <select
                      value={formData.domisili_asal}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          domisili_asal: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#0A66C2] outline-none text-sm transition-colors cursor-pointer text-[#191919]"
                    >
                      <option value="" disabled>
                        -- Pilih Kabupaten/Kota --
                      </option>
                      <option value="Sleman">Kabupaten Sleman</option>
                      <option value="Bantul">Kabupaten Bantul</option>
                      <option value="Gunungkidul">Kabupaten Gunungkidul</option>
                      <option value="Kulon Progo">Kabupaten Kulon Progo</option>
                      <option value="Kota Yogyakarta">Kota Yogyakarta</option>
                      <option value="Luar DIY">
                        Luar DIY (Nasional/Internasional)
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5F6368] uppercase mb-1.5">
                      Alamat Lengkap Saat Ini
                    </label>
                    <textarea
                      rows={2}
                      value={formData.alamatLengkap}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          alamatLengkap: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#0A66C2] outline-none text-sm transition-colors resize-none"
                      placeholder="Cth: Jl. Kaliurang KM 14.5, Ngemplak, Sleman..."
                    ></textarea>
                  </div>
                </div>
                <div className="flex justify-between pt-6 border-t border-[#EBEBEB]">
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="text-[#666666] font-bold text-sm hover:underline"
                  >
                    &larr; Kembali
                  </button>
                  <button
                    onClick={() => setOnboardingStep(3)}
                    disabled={
                      !formData.pekerjaan ||
                      !formData.domisili_asal ||
                      !formData.alamatLengkap
                    }
                    className="bg-[#191919] hover:bg-black text-white font-bold py-2.5 px-8 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya &rarr;
                  </button>
                </div>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4">
                <h3 className="text-lg font-bold mb-1">
                  3. Sosial Media (Opsional)
                </h3>
                <p className="text-sm text-[#666666] mb-6">
                  Hubungkan profil profesional Anda untuk mempermudah relasi
                  antar alumni.
                </p>
                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs font-bold text-[#5F6368] uppercase mb-1.5">
                      Link LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          linkedinUrl: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#0A66C2] outline-none text-sm transition-colors"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#5F6368] uppercase mb-1.5">
                      Link Instagram
                    </label>
                    <input
                      type="url"
                      value={formData.instagramUrl}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instagramUrl: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl focus:border-[#0A66C2] outline-none text-sm transition-colors"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
                <div className="flex justify-between pt-6 border-t border-[#EBEBEB]">
                  <button
                    onClick={() => setOnboardingStep(2)}
                    className="text-[#666666] font-bold text-sm hover:underline"
                  >
                    &larr; Kembali
                  </button>
                  <button
                    onClick={handleSaveData}
                    disabled={isSaving}
                    className="bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-2.5 px-8 rounded-xl transition-colors text-sm shadow-md flex items-center gap-2"
                  >
                    {isSaving ? "Menyimpan..." : "Selesai & Masuk Dashboard"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const TABS = [
    { id: "beranda", label: "Beranda", icon: <IconProfile /> },
    { id: "agenda", label: "Event", icon: <IconAgenda /> },
    { id: "mitra", label: "Direktori", icon: <IconMitra /> },
    { id: "merch", label: "Merch", icon: <IconMerch /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F2EE] font-sans text-[#191919] pb-24 lg:pb-0 animate-in fade-in duration-700">
      <header className="bg-white border-b border-[#EBEBEB] sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-[1128px] mx-auto px-4 sm:px-6 h-14 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img
              src="/logo-dpp-ika.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <h1 className="text-[14px] font-bold text-[#191919] hidden sm:block">
              IKA UII Workspace
            </h1>
          </div>
          <div className="hidden lg:flex items-center gap-8 border-r border-[#EBEBEB] pr-6">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center h-14 border-b-2 px-3 transition-colors ${activeTab === tab.id ? "border-[#0A66C2] text-[#191919]" : "border-transparent text-[#666666] hover:text-[#191919]"}`}
              >
                <div
                  className={
                    activeTab === tab.id ? "text-[#0A66C2]" : "text-[#666666]"
                  }
                >
                  {tab.icon}
                </div>
                <span
                  className={`text-[10px] hidden xl:block mt-1 ${activeTab === tab.id ? "font-bold" : "font-medium"}`}
                >
                  {tab.label}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] font-bold">
                {userData?.namaLengkap || userData?.nama}
              </p>
              <p className="text-[10px] text-[#666666]">
                {userData?.pekerjaan}
              </p>
            </div>
            <button
              onClick={() => auth.signOut()}
              className="text-[12px] font-bold text-[#666666] hover:bg-[#F3F2EF] px-3 py-1.5 rounded-full border border-[#EBEBEB]"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EBEBEB] z-50 px-2 pt-1 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center p-2 transition-colors ${activeTab === tab.id ? "text-[#0A66C2]" : "text-[#666666]"}`}
            >
              {tab.icon}
              <span
                className={`text-[10px] mt-1 ${activeTab === tab.id ? "font-bold" : "font-medium"}`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <main className="flex-grow w-full max-w-[1128px] mx-auto px-0 sm:px-4 py-6">
        {/* WARNING JIKA BELUM DISETUJUI ADMIN */}
        {!isKTAValid && (
          <div className="bg-[#FEF7E0] border border-[#FCE8B2] p-4 rounded-lg mb-6 flex gap-3 mx-4 sm:mx-0">
            <div className="text-[#F29900] mt-0.5">
              <IconAlert />
            </div>
            <div>
              <h3 className="font-bold text-[#B08D00] text-[13px]">
                Status: Menunggu Peninjauan Admin
              </h3>
              <p className="text-[#B08D00] text-[12px]">
                E-KTA Anda sedang diproses. Mohon tunggu verifikasi dari
                Sekretariat DPW IKA UII DIY.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* SISI KIRI (PROFIL) */}
          <div
            className={`w-full lg:w-[280px] shrink-0 space-y-4 ${activeTab !== "beranda" ? "hidden lg:block" : "block"}`}
          >
            <div className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden shadow-sm mx-4 sm:mx-0">
              <div className="h-16 bg-gradient-to-r from-[#1A73E8] to-[#0A1022]"></div>
              <div className="px-4 pb-5 relative flex flex-col items-center">
                <div className="w-[72px] h-[72px] bg-white rounded-full p-1 -mt-10 mb-3 border-2 border-[#EBEBEB]">
                  <img
                    src={
                      userData?.fotoUrl || userData?.foto || "/logo-dpp-ika.png"
                    }
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h2 className="text-[16px] font-bold text-center leading-tight">
                  {userData?.namaLengkap || userData?.nama}
                </h2>
                <p className="text-[12px] text-[#666666] text-center mt-1">
                  {userData?.pekerjaan || "Alumni UII"}
                </p>

                <div className="mt-3 mb-1 bg-[#F8F9FA] px-3 py-1.5 rounded border border-[#EBEBEB] text-center w-full max-w-[200px]">
                  <p className="text-[9px] font-bold text-[#9AA0A6] uppercase tracking-widest mb-0.5">
                    Nomor Induk
                  </p>
                  <p className="text-[13px] font-bold text-[#0B1528] tracking-widest font-mono">
                    {getNIA()}
                  </p>
                </div>

                <div className="w-full mt-4 pt-4 border-t border-[#EBEBEB] text-[12px]">
                  <div className="flex justify-between py-1">
                    <span className="text-[#666666]">Fakultas</span>
                    <span className="font-bold truncate max-w-[120px]">
                      {userData?.fakultas || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#666666]">Angkatan</span>
                    <span className="font-bold">
                      {userData?.angkatan || userData?.tahun_lulus || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#666666]">Domisili</span>
                    <span className="font-bold">
                      {userData?.domisili_asal || userData?.domisili || "-"}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setOnboardingStep(1);
                    setIsOnboarding(true);
                  }}
                  className="w-full mt-4 bg-[#F8F9FA] hover:bg-[#E8F0FE] border border-[#DADCE0] text-[#1A73E8] font-bold py-2 rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  Perbarui Profil & Foto
                </button>
              </div>
            </div>

            {/* TOMBOL BUKA KTA (HANYA MUNCUL JIKA STATUS SAH) */}
            {isKTAValid && (
              <div className="bg-white border border-[#EBEBEB] rounded-xl p-4 shadow-sm mx-4 sm:mx-0 text-center">
                <h3 className="text-[13px] font-bold mb-1 text-[#202124]">
                  Kartu Tanda {userData?.isPengurus ? "Pengurus" : "Anggota"}
                </h3>
                <p className="text-[11px] text-[#666666] mb-3">
                  Lihat dan unduh identitas digital Anda.
                </p>
                <button
                  onClick={() => router.push(`/kta/${userData.id}`)}
                  className="block w-full text-center bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-2 rounded-full transition-colors text-[13px] shadow-sm"
                >
                  Buka KTA Digital &rarr;
                </button>
              </div>
            )}
          </div>

          {/* SISI KANAN (KONTEN TAB) */}
          <div className="flex-grow w-full max-w-[800px] mx-auto overflow-hidden px-4 sm:px-0">
            {activeTab === "beranda" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-[#0A1022] to-[#1A73E8] rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
                  <img
                    src="/logo-dpp-ika.png"
                    className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 grayscale"
                  />
                  <div className="relative z-10">
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
                      Selamat Datang,{" "}
                      {userData?.namaLengkap?.split(" ")[0] ||
                        userData?.nama?.split(" ")[0]}
                      !
                    </h2>
                    <p className="text-[#E8F0FE] text-sm max-w-lg leading-relaxed">
                      Senang melihat Anda di ekosistem digital IKA UII DIY.
                      Jelajahi berbagai fasilitas, bangun jejaring, dan mari
                      bersinergi untuk kemajuan alumni dan almamater.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-[#DADCE0] shadow-sm flex flex-col justify-center items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-[#E6F4EA] text-[#1E8E3E] flex items-center justify-center mb-2">
                      <IconCheck />
                    </div>
                    <p className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider mb-1">
                      Status Anda
                    </p>
                    <p className="text-[12px] font-black text-[#202124]">
                      {isKTAValid
                        ? userData?.isPengurus
                          ? "Pengurus"
                          : "Anggota Sah"
                        : "Pendaftar"}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("agenda")}
                    className="bg-white p-4 rounded-xl border border-[#DADCE0] shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow hover:border-[#1A73E8]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center mb-2">
                      <IconAgenda />
                    </div>
                    <p className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider mb-1">
                      Agenda Event
                    </p>
                    <p className="text-[13px] font-black text-[#202124]">
                      {agendaList.length} Event
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("mitra")}
                    className="bg-white p-4 rounded-xl border border-[#DADCE0] shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow hover:border-[#1A73E8]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#FEF7E0] text-[#B06000] flex items-center justify-center mb-2">
                      <IconMitra />
                    </div>
                    <p className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider mb-1">
                      Direktori Bisnis
                    </p>
                    <p className="text-[13px] font-black text-[#202124]">
                      {mitraList.length} Usaha
                    </p>
                  </button>
                  <button
                    onClick={() => setActiveTab("merch")}
                    className="bg-white p-4 rounded-xl border border-[#DADCE0] shadow-sm flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow hover:border-[#1A73E8]"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#F3F2EF] text-[#5F6368] flex items-center justify-center mb-2">
                      <IconMerch />
                    </div>
                    <p className="text-[10px] font-bold text-[#5F6368] uppercase tracking-wider mb-1">
                      Toko Merch
                    </p>
                    <p className="text-[13px] font-black text-[#202124]">
                      Akses Katalog
                    </p>
                  </button>
                </div>

                <div className="bg-gradient-to-br from-[#1E8E3E] to-[#0A66C2] rounded-2xl p-6 sm:p-8 shadow-sm text-white relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#1E8E3E]/20">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 opacity-10 pointer-events-none">
                    <svg
                      className="w-48 h-48"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </div>
                  <div className="relative z-10 w-full sm:w-2/3">
                    <div className="inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-3 border border-white/20 backdrop-blur-sm shadow-sm">
                      <span className="w-2 h-2 bg-[#F29900] rounded-full animate-pulse"></span>{" "}
                      Program Sosial Rutin
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black mb-2 tracking-tight">
                      Jum&apos;at Berkah
                    </h3>
                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                      Mari salurkan infaq dan sedekah terbaik Anda untuk
                      mendukung program sosial, beasiswa, dan kesejahteraan
                      keluarga besar IKA UII DIY.
                    </p>
                  </div>
                  <div className="relative z-10 w-full sm:w-auto shrink-0">
                    <Link
                      href="/berita"
                      className="block w-full text-center bg-white text-[#1E8E3E] hover:bg-[#F8F9FA] font-black py-3.5 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-[13px] tracking-wide"
                    >
                      Donasi Sekarang &rarr;
                    </Link>
                  </div>
                </div>

                <div className="bg-white border border-[#DADCE0] rounded-xl p-6 shadow-sm">
                  <h3 className="text-[14px] font-bold text-[#202124] mb-4 border-b border-[#DADCE0] pb-2">
                    Papan Informasi
                  </h3>
                  <div className="space-y-5">
                    <div className="flex gap-3 items-start">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[#1A73E8] shrink-0"></div>
                      <div>
                        <h4 className="text-[13px] font-bold text-[#202124]">
                          Pembaruan Sistem E-KTA
                        </h4>
                        <p className="text-[12px] text-[#5F6368] mt-1 leading-relaxed">
                          E-KTA resmi kini hadir dengan format dua sisi dan
                          dilengkapi sistem scan validasi. Gunakan E-KTA ini
                          untuk menikmati fasilitas eksklusif alumni.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-[#1E8E3E] shrink-0"></div>
                      <div>
                        <h4 className="text-[13px] font-bold text-[#202124]">
                          Pendaftaran Direktori Bisnis
                        </h4>
                        <p className="text-[12px] text-[#5F6368] mt-1 leading-relaxed">
                          Punya usaha atau bisnis? Daftarkan bisnis Anda ke
                          dalam katalog direktori alumni untuk menjangkau
                          jaringan pasar keluarga besar IKA UII.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB LAINNYA (AGENDA, MITRA, MERCH) TETAP SAMA */}
            {activeTab === "agenda" && (
              <div className="space-y-4">
                <h3 className="text-[18px] font-bold mb-4">
                  Agenda Event IKA UII DIY
                </h3>
                {agendaList.map((agenda) => {
                  let isSelesai = false;
                  if (!agenda.isComingSoon && agenda.tanggal) {
                    const eventDate = new Date(agenda.tanggal);
                    eventDate.setHours(0, 0, 0, 0);
                    if (eventDate < todayDate) isSelesai = true;
                  }
                  return (
                    <div
                      key={agenda.id}
                      className={`bg-white border border-[#EBEBEB] rounded-xl p-5 flex flex-col sm:flex-row gap-4 shadow-sm ${isSelesai ? "opacity-70 grayscale-[30%]" : ""}`}
                    >
                      <div className="w-16 h-16 bg-[#F8F9FA] border border-[#DADCE0] rounded-lg flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[#D93025]">
                          {agenda.isComingSoon
                            ? "TBA"
                            : agenda.tanggal
                              ? new Date(agenda.tanggal).toLocaleDateString(
                                  "id-ID",
                                  { month: "short" },
                                )
                              : "-"}
                        </span>
                        <span className="text-[22px] font-black">
                          {agenda.isComingSoon
                            ? "??"
                            : agenda.tanggal
                              ? agenda.tanggal.split("-")[2]
                              : "-"}
                        </span>
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-[16px] font-bold">
                          {agenda.judul}
                        </h4>
                        <p className="text-[12px] text-[#666666] mb-2">
                          {isSelesai
                            ? "Telah Selesai"
                            : `${agenda.format} • ${agenda.isComingSoon ? "Waktu Diumumkan Menyusul" : agenda.waktu + " WIB"}`}
                        </p>
                        <p className="text-[13px] line-clamp-2">
                          {agenda.deskripsi}
                        </p>
                        {!isSelesai && (
                          <Link
                            href={`/agenda/${agenda.slug}`}
                            className="inline-block mt-3 border border-[#0A66C2] text-[#0A66C2] hover:bg-[#E8F0FE] text-[12px] font-bold px-4 py-1.5 rounded-full transition-colors"
                          >
                            Lihat Detail
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "mitra" && (
              <div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-5 gap-3">
                  <h3 className="text-[18px] font-bold text-[#202124]">
                    Katalog Bisnis Alumni
                  </h3>
                  <div className="flex items-center gap-2.5">
                    <Link
                      href="/pasang-iklan"
                      className="text-[12px] font-bold text-[#5F6368] bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] px-3.5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1"
                    >
                      <svg
                        className="w-3.5 h-3.5"
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
                      Pasang Iklan
                    </Link>
                    <Link
                      href="/direktori-bisnis"
                      className="text-[12px] font-bold text-white bg-[#0A66C2] hover:bg-[#004182] px-3.5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1"
                    >
                      <IconPlus /> Daftarkan Bisnis
                    </Link>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {mitraList.map((mitra) => (
                    <Link
                      href={`/direktori-bisnis?id=${mitra.id}`}
                      key={mitra.id}
                      className="bg-white border border-[#EBEBEB] rounded-xl p-4 flex gap-4 hover:shadow-md group"
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden bg-[#F8F9FA] shrink-0 border border-[#EBEBEB]">
                        {mitra.fotoUrl || mitra.foto ? (
                          <img
                            src={mitra.fotoUrl || mitra.foto}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IconMitra />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-[#666666] font-bold uppercase">
                          {mitra.kategori}
                        </p>
                        <h4 className="text-[14px] font-bold truncate group-hover:text-[#0A66C2]">
                          {mitra.namaBisnis || mitra.nama}
                        </h4>
                        <p className="text-[11px] text-[#666666] truncate">
                          By {mitra.owner || mitra.namaAlumni}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "merch" && (
              <div className="animate-in fade-in duration-300">
                <div className="bg-white border border-[#EBEBEB] sm:rounded-xl p-5 mb-4 shadow-sm">
                  <h3 className="text-[16px] font-bold text-[#191919]">
                    Toko Merchandise Resmi
                  </h3>
                  <p className="text-[12px] text-[#666666]">
                    Atribut kebanggaan keluarga besar IKA UII DIY.
                  </p>
                </div>
                {merchList && merchList.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
                    {merchList.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white border border-[#EBEBEB] rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="aspect-square bg-[#F8F9FA] overflow-hidden border-b border-[#EBEBEB]">
                          {item.imgUrl ? (
                            <img
                              src={item.imgUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#DADCE0]">
                              <IconMerch />
                            </div>
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="text-[13px] font-bold text-[#191919] truncate leading-tight">
                            {item.nama}
                          </h4>
                          <p className="text-[13px] text-[#0A66C2] font-bold mt-1">
                            Rp {Number(item.harga || 0).toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="bg-white border border-[#EBEBEB] sm:rounded-xl p-5 sm:p-6 shadow-sm mt-2">
                  <div className="flex gap-3 mb-3">
                    <div className="mt-1 text-[#0A66C2]">
                      <IconMerch />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#191919]">
                        Punya ide merchandise?
                      </h4>
                      <p className="text-[13px] text-[#666666] leading-relaxed">
                        Sampaikan detailnya sekarang. Ide Anda mungkin akan
                        menjadi atribut resmi berikutnya!
                      </p>
                    </div>
                  </div>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!saranMerch.trim()) return;
                      setIsSubmittingSaran(true);
                      try {
                        await addDoc(collection(db, "usulan_merch"), {
                          userId: userData.id,
                          nama: userData.namaLengkap || userData.nama,
                          email: userData.email,
                          usulan: saranMerch,
                          createdAt: serverTimestamp(),
                          status: "Baru",
                        });
                        toast.success("Terima kasih! Usulan Anda telah terkirim.");
                        setSaranMerch("");
                      } catch {
                        toast.error("Gagal mengirim usulan.");
                      } finally {
                        setIsSubmittingSaran(false);
                      }
                    }}
                    className="mt-4"
                  >
                    <textarea
                      required
                      rows={3}
                      value={saranMerch}
                      onChange={(e) => setSaranMerch(e.target.value)}
                      placeholder="Contoh: Buat jaket parka warna navy..."
                      className="w-full px-3 py-2 bg-white border border-[#191919] rounded focus:border-[#0A66C2] focus:ring-1 focus:ring-[#0A66C2] outline-none text-[14px] transition-all resize-none mb-3"
                    ></textarea>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmittingSaran || !saranMerch.trim()}
                        className="bg-[#0A66C2] hover:bg-[#004182] text-white font-bold py-1.5 px-5 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50 text-[13px]"
                      >
                        {isSubmittingSaran ? "Mengirim..." : "Kirim Usulan"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="w-full bg-[#0A1022] mt-auto shrink-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]"></div>
        <div className="max-w-[1100px] mx-auto relative z-10 flex flex-col sm:flex-row justify-between items-center px-6 py-6 gap-3 text-center sm:text-left">
          <p className="text-[11px] text-[#9AA0A6] font-medium tracking-wider">
            &copy; {new Date().getFullYear()} DPW IKA UII DIY.
          </p>
          <p className="text-[11px] text-[#5F6368] font-medium tracking-wide">
            Dikembangkan melalui kerja sama Media & Publikasi DPW dengan{" "}
            <span className="text-[#A0B4B7]">PT Guwigo Teknologi</span>.
          </p>
        </div>
      </footer>
    </div>
  );
}
