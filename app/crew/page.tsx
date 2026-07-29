"use client";

import { useState, useEffect, useRef } from "react";
import { Roboto } from "next/font/google";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import NavbarPublic from "@/components/layout/NavbarPublic";
import FooterPublic from "@/components/layout/FooterPublic";
import imageCompression from "browser-image-compression";

// --- SETTING FONT ROBOTO ---
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
});

// --- IKON MATERIAL MODERN ---
const IconCheckCircle = () => (
  <svg
    className="w-5 h-5 text-emerald-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconErrorCircle = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconSpinner = () => (
  <svg
    className="w-5 h-5 animate-spin text-white"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    ></path>
  </svg>
);
const IconLink = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);
const IconJersey = () => (
  <svg
    className="w-6 h-6 text-[#0F2147]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 7h6m2 0v4a3 3 0 01-3 3h-4a3 3 0 01-3-3V7m10-3l-2 2M5 4l2 2M4 9h16v11a2 2 0 01-2 2H6a2 2 0 01-2-2V9z"
    />
  </svg>
);
const IconCertificate = () => (
  <svg
    className="w-6 h-6 text-[#0F2147]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12l2 2 4-4M7.5 12h.01M7.5 14.5h.01M7.5 9.5h.01M12 21a9 9 0 100-18 9 9 0 000 18z"
    />
  </svg>
);
const IconSponsor = () => (
  <svg
    className="w-6 h-6 text-[#0F2147]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 7H4M4 7a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2M9 3v4m6-4v4"
    />
  </svg>
);
const IconMoney = () => (
  <svg
    className="w-6 h-6 text-[#0F2147]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);
const IconMeals = () => (
  <svg
    className="w-6 h-6 text-[#0F2147]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
    />
  </svg>
);

// --- TYPES ---
interface RolePosition {
  id: string;
  nama: string;
  kuota: number;
  deskripsi?: string;
}
interface DivisionGroup {
  id: string;
  title: string;
  roles: RolePosition[];
}
interface EventRecruitment {
  id: string;
  title: string;
  requirements: string;
  isActive: boolean;
  linkGrupBesar: string;
  groups: DivisionGroup[];
}
interface CrewMember {
  roleId: string;
  status: string;
  nama: string;
}

export default function OprecRegistrationPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [events, setEvents] = useState<EventRecruitment[]>([]);
  const [allAcceptedCrew, setAllAcceptedCrew] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI States
  const [currentStep, setCurrentStep] = useState(1);
  const [popup, setPopup] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [successModal, setSuccessModal] = useState(false);

  // Validation States
  const [emailErr, setEmailErr] = useState("");
  const [waErr, setWaErr] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");

  const { executeRecaptcha } = useGoogleReCaptcha();
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    eventId: "",
    roleId: "",
    nama: "",
    jenisKelamin: "",
    tempatLahir: "",
    tanggalLahir: "",
    email: "",
    whatsapp: "",
    instagram: "",
    riwayatPenyakit: "",
    tipe: "mahasiswa",
    fakultas: "",
    nim: "",
    angkatan: "",
    instansi: "",
    jabatan: "",
    domisili: "",
    ukuranJersey: "",
    fotoIdCard: "",
    motivasi: "",
    pengalaman: "",
    alasanDivisi: "",
    bersediaPindahDivisi: "",
    kendaraan: "",
    bersediaPelatihan: "",
  });

  const [isAgreed, setIsAgreed] = useState(false);

  // 🔥 PROTEKSI HYDRATION MISMATCH 🔥
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    // 🔥 PENAMBAHAN CALLBACK ERROR UNTUK MENCEGAH LOADING ABADI 🔥
    const qEvents = query(
      collection(db, "oprec_master"),
      where("isActive", "==", true),
    );
    const unsubSettings = onSnapshot(
      qEvents,
      (snap) => {
        const activeEvents = snap.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as EventRecruitment,
        );
        setEvents(activeEvents);
        if (activeEvents.length > 0 && !formData.eventId) {
          setFormData((prev) => ({ ...prev, eventId: activeEvents[0].id }));
        }
      },
      (error) => {
        console.error("Gagal load Oprec Master:", error);
        setIsLoading(false); // Paksa berhenti loading jika ditolak Firebase
      },
    );

    const qAccepted = query(
      collection(db, "oprec_pelamar"),
      where("status", "==", "accepted"),
    );
    const unsubAccepted = onSnapshot(
      qAccepted,
      (snap) => {
        const data = snap.docs.map(
          (d) =>
            ({
              roleId: d.data().roleId,
              status: d.data().status,
              nama: d.data().nama,
            }) as CrewMember,
        );
        setAllAcceptedCrew(data);
        setTimeout(() => setIsLoading(false), 600);
      },
      (error) => {
        console.error("Gagal load Oprec Pelamar:", error);
        setIsLoading(false); // Paksa berhenti loading jika ditolak Firebase
      },
    );

    return () => {
      unsubSettings();
      unsubAccepted();
    };
  }, [isMounted]);

  const showNotif = (type: "success" | "error", text: string) => {
    setPopup({ type, text });
    setTimeout(() => setPopup(null), 4000);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTipeChange = (tipe: string) => {
    setFormData({
      ...formData,
      tipe,
      fakultas: "",
      nim: "",
      angkatan: "",
      instansi: "",
      jabatan: "",
      domisili: "",
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress("Mengompresi foto...");

    try {
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      setUploadProgress("Mengunggah foto...");
      const data = new FormData();
      data.append("file", compressedFile);
      data.append("upload_preset", "cardpanitia");
      data.append("cloud_name", "dp8hmxuix");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/dp8hmxuix/image/upload`,
        {
          method: "POST",
          body: data,
        },
      );
      const json = await res.json();

      setFormData({ ...formData, fotoIdCard: json.secure_url });
      setUploadProgress("Selesai!");
      setTimeout(() => setUploadProgress(""), 2000);
    } catch (error) {
      setUploadProgress("Gagal mengunggah foto.");
    }
  };

  const checkDuplicate = async (field: "email" | "whatsapp", value: string) => {
    if (!value || !formData.eventId) return;
    try {
      const qCheck = query(
        collection(db, "oprec_pelamar"),
        where("eventId", "==", formData.eventId),
        where(field, "==", value),
      );
      const snap = await getDocs(qCheck);
      if (!snap.empty) {
        if (field === "email") setEmailErr("Email ini sudah pernah mendaftar.");
        if (field === "whatsapp") setWaErr("Nomor WA ini sudah terdaftar.");
      } else {
        if (field === "email") setEmailErr("");
        if (field === "whatsapp") setWaErr("");
      }
    } catch (e) {}
  };

  const scrollToForm = () => {
    if (formRef.current) {
      const y =
        formRef.current.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  const nextStep1 = () => {
    if (!formData.eventId || !formData.roleId)
      return showNotif("error", "Pilih formasi/divisi terlebih dahulu.");
    setCurrentStep(2);
    scrollToForm();
  };

  const nextStep2 = () => {
    if (emailErr || waErr)
      return showNotif("error", "Mohon perbaiki data yang merah.");

    if (
      !formData.nama.trim() ||
      !formData.jenisKelamin ||
      !formData.tempatLahir.trim() ||
      !formData.tanggalLahir ||
      !formData.domisili.trim() ||
      !formData.email.trim() ||
      !formData.whatsapp.trim() ||
      !formData.instagram.trim() ||
      !formData.riwayatPenyakit.trim()
    ) {
      return showNotif("error", "Lengkapi seluruh identitas wajib (*).");
    }

    if (["mahasiswa", "ukm", "himpunan"].includes(formData.tipe)) {
      if (
        !formData.fakultas.trim() ||
        !formData.nim.trim() ||
        !formData.angkatan.trim()
      )
        return showNotif("error", "Fakultas, NIM, dan Angkatan wajib diisi.");
    }
    if (formData.tipe === "alumni") {
      if (!formData.fakultas.trim() || !formData.angkatan.trim())
        return showNotif("error", "Fakultas dan Angkatan wajib diisi.");
    }
    if (formData.tipe === "ukm" || formData.tipe === "himpunan") {
      if (!formData.instansi.trim() || !formData.jabatan.trim())
        return showNotif("error", "Nama Organisasi dan Jabatan wajib diisi.");
    }

    setCurrentStep(3);
    scrollToForm();
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    scrollToForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ukuranJersey)
      return showNotif("error", "Pilih ukuran jersey.");
    if (!formData.fotoIdCard)
      return showNotif("error", "Pas Foto wajib diunggah.");
    if (!formData.motivasi.trim() || !formData.pengalaman.trim())
      return showNotif("error", "Esai & Pengalaman wajib diisi.");

    if (
      !formData.alasanDivisi.trim() ||
      !formData.bersediaPindahDivisi ||
      !formData.kendaraan ||
      !formData.bersediaPelatihan
    )
      return showNotif("error", "Harap jawab seluruh pertanyaan kuesioner.");

    if (!isAgreed) return showNotif("error", "Setujui pernyataan di bawah.");

    setIsSubmitting(true);
    try {
      if (!executeRecaptcha) {
        showNotif(
          "error",
          "Sistem keamanan reCAPTCHA belum siap. Refresh halaman.",
        );
        setIsSubmitting(false);
        return;
      }

      const token = await executeRecaptcha("oprec_registration");
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        showNotif(
          "error",
          "Aktivitas mencurigakan (Bot) terdeteksi. Pendaftaran ditolak.",
        );
        setIsSubmitting(false);
        return;
      }

      const finalData = { ...formData };
      if (formData.tipe === "mahasiswa") {
        finalData.instansi = "-";
        finalData.jabatan = "-";
      }
      if (formData.tipe === "alumni") {
        finalData.nim = "-";
        finalData.jabatan = "-";
      }
      if (formData.tipe === "umum") {
        finalData.nim = "-";
        finalData.fakultas = "-";
        finalData.angkatan = "-";
        finalData.instansi = "-";
        finalData.jabatan = "-";
      }

      await addDoc(collection(db, "oprec_pelamar"), {
        ...finalData,
        status: "pending",
        waktuDaftar: new Date().toISOString(),
      });

      const targetEvent = events.find((ev) => ev.id === formData.eventId);
      const targetDivisi =
        targetEvent?.groups
          .flatMap((g) => g.roles)
          .find((r) => r.id === formData.roleId)?.nama || "Divisi Pilihan";

      fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "oprec_pending",
          email: formData.email,
          nama: formData.nama,
          detail: {
            event: targetEvent?.title || "Kepanitiaan IKA UII",
            divisi: targetDivisi,
          },
        }),
      }).catch((err) => console.error("Gagal kirim notif pending", err));

      setSuccessModal(true);
    } catch (error) {
      showNotif("error", "Terjadi kesalahan sistem server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === formData.eventId);

  // Jika belum di-mount (masih proses SSR), render skeleton kosong agar tidak terjadi Error 418
  if (!isMounted) return null;

  return (
    <div
      className={`${roboto.variable} font-roboto min-h-screen bg-[#F8F9FA] flex flex-col text-[#202124]`}
    >
      <NavbarPublic />

      {popup && (
        <div className="fixed top-28 right-6 z-[9999] min-w-[280px] bg-white border-l-4 border-[#D93025] px-5 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300">
          <IconErrorCircle />
          <span className="text-sm font-medium text-slate-700">
            {popup.text}
          </span>
        </div>
      )}

      {successModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-500 border border-slate-100">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
              <IconCheckCircle />
            </div>
            <h2 className="text-2xl font-black text-[#0F2147] mb-2 tracking-tight">
              Pendaftaran Berhasil!
            </h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
              Terima kasih <strong>{formData.nama}</strong>. Berkas lamaran Anda
              telah kami terima dan sedang{" "}
              <strong className="text-amber-600">Menunggu Review</strong>. Cek
              email Anda untuk konfirmasi pendaftaran.
            </p>
            <Link
              href="/"
              className="block w-full bg-[#0F2147] hover:bg-[#0a152e] text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 text-sm"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      )}

      <main className="flex-grow pb-20">
        <div className="bg-[#0F2147] pt-60 pb-24 px-6 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.uii.ac.id/wp-content/uploads/2017/09/UII-Central-Building.jpg')] bg-cover bg-center opacity-10 grayscale"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0F2147]"></div>
          <div className="max-w-3xl mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl md:text-5xl font-black text-[#FCD116] mb-4 tracking-tight drop-shadow-md">
              Open Recruitment
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed font-medium">
              Jadilah bagian dari suksesor acara IKA UII DIY. Pilih formasi yang
              tersedia dan tunjukkan potensi terbaik Anda.
            </p>
          </div>
        </div>

        <div
          ref={formRef}
          className="max-w-4xl mx-auto px-4 sm:px-6 -mt-12 relative z-20"
        >
          {isLoading ? (
            <div className="bg-white rounded-3xl shadow-lg border border-slate-200 p-8 animate-pulse space-y-6">
              <div className="h-12 bg-slate-100 rounded-xl w-full"></div>
              <div className="h-32 bg-slate-100 rounded-xl w-full"></div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-[0_10px_40px_rgb(0,0,0,0.06)] border border-slate-200 overflow-hidden">
              <div className="bg-[#F8F9FA] border-b border-slate-200 px-4 sm:px-8 py-5 flex items-center justify-between overflow-x-auto custom-scrollbar">
                {[1, 2, 3].map((step, idx) => (
                  <div
                    key={step}
                    className="flex items-center flex-1 last:flex-none"
                  >
                    <div
                      className={`flex items-center gap-2 ${currentStep >= step ? "text-[#0F2147]" : "text-slate-400"}`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${currentStep > step ? "bg-[#1E8E3E] text-white" : currentStep === step ? "bg-[#0F2147] text-white ring-4 ring-blue-50" : "bg-slate-200 text-slate-500"}`}
                      >
                        {currentStep > step ? "✓" : step}
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider hidden sm:block whitespace-nowrap">
                        {step === 1
                          ? "Formasi"
                          : step === 2
                            ? "Identitas"
                            : "Berkas & Esai"}
                      </span>
                    </div>
                    {idx < 2 && (
                      <div
                        className={`flex-1 h-[2px] mx-2 sm:mx-4 rounded-full transition-all duration-500 ${currentStep > step ? "bg-[#1E8E3E]" : "bg-slate-200"}`}
                      ></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="p-6 sm:p-10 min-h-[600px] flex flex-col">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  {/* ================= STEP 1 : FORMASI ================= */}
                  <div
                    className={`${currentStep === 1 ? "block animate-in fade-in slide-in-from-right-8 duration-500" : "hidden"} flex-1 flex flex-col`}
                  >
                    <div className="space-y-6 flex-1">
                      <div className="bg-[#F8F9FA] border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8">
                        <div className="text-center mb-6">
                          <h3 className="text-lg font-black text-[#0F2147] tracking-tight">
                            Benefit & Fasilitas Volunteer
                          </h3>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            Fasilitas eksklusif yang akan didapatkan selama
                            menjalankan amanah kepanitiaan
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                          {[
                            { icon: <IconJersey />, label: "Volunteer Jersey" },
                            {
                              icon: <IconCertificate />,
                              label: "e-Certificate",
                            },
                            { icon: <IconSponsor />, label: "Produk Sponsor" },
                            {
                              icon: <IconMoney />,
                              label: "Uang Pengganti Transportasi",
                            },
                            { icon: <IconMeals />, label: "Meals & Konsumsi" },
                          ].map((b, idx) => (
                            <div
                              key={idx}
                              className="w-full sm:w-[48%] md:w-[30%] bg-white border border-slate-200/80 rounded-xl p-5 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                                {b.icon}
                              </div>
                              <span className="text-xs font-bold text-[#0F2147] leading-snug">
                                {b.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                          Pilih Program Event{" "}
                          <span className="text-[#D93025]">*</span>
                        </label>
                        <select
                          value={formData.eventId}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              eventId: e.target.value,
                              roleId: "",
                            })
                          }
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-bold text-[#0F2147]"
                        >
                          <option value="" disabled>
                            -- Pilih Event Terbuka --
                          </option>
                          {events.map((ev) => (
                            <option key={ev.id} value={ev.id}>
                              {ev.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedEvent && (
                        <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl mt-2 mb-6 animate-in fade-in duration-300">
                          <h4 className="text-sm font-bold text-blue-900 mb-2">
                            Deskripsi & Informasi Event
                          </h4>
                          <p className="text-xs text-blue-800 whitespace-pre-wrap leading-relaxed">
                            {selectedEvent.requirements ||
                              "Belum ada deskripsi umum untuk event ini."}
                          </p>
                          {selectedEvent.linkGrupBesar && (
                            <div className="mt-4 pt-3 border-t border-blue-200/50">
                              <p className="text-xs text-blue-900 font-medium mb-2">
                                Saluran Informasi Publik:
                              </p>
                              <a
                                href={selectedEvent.linkGrupBesar}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-[#1A73E8] text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-[#1557B0] transition-colors shadow-sm"
                              >
                                <IconLink /> Join Saluran / Info Grup WA
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {selectedEvent &&
                        selectedEvent.groups.map((group) => (
                          <div
                            key={group.id}
                            className="pt-4 border-t border-slate-100 mt-6"
                          >
                            <h3 className="text-sm font-black text-[#0F2147] mb-4 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#F2A900]"></span>{" "}
                              {group.title}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {group.roles.map((role) => {
                                const filled = allAcceptedCrew.filter(
                                  (c) => c.roleId === role.id,
                                ).length;
                                const isFull = filled >= role.kuota;
                                const sisaKuota = role.kuota - filled;
                                const isAlmostFull =
                                  sisaKuota <= 3 && sisaKuota > 0;
                                const isSelected = formData.roleId === role.id;

                                return (
                                  <label
                                    key={role.id}
                                    className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 relative overflow-hidden ${isFull ? "bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed" : isSelected ? "border-[#0F2147] shadow-md bg-blue-50/20" : "border-slate-200 hover:border-slate-400 hover:shadow-sm"}`}
                                  >
                                    {isAlmostFull && !isSelected && (
                                      <div className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg flex items-center gap-1 animate-pulse">
                                        🔥 Sisa {sisaKuota} Slot
                                      </div>
                                    )}
                                    <input
                                      type="radio"
                                      name="roleId"
                                      value={role.id}
                                      disabled={isFull}
                                      checked={isSelected}
                                      onChange={handleChange}
                                      className="hidden"
                                    />
                                    <div
                                      className={`mt-0.5 w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center shrink-0 ${isSelected ? "border-[#0F2147]" : "border-slate-300"}`}
                                    >
                                      {isSelected && (
                                        <div className="w-2 h-2 bg-[#F2A900] rounded-full"></div>
                                      )}
                                    </div>
                                    <div className="flex-1 w-full">
                                      <h4
                                        className={`text-sm font-bold leading-snug ${isSelected ? "text-[#0F2147]" : "text-slate-700"}`}
                                      >
                                        {role.nama}
                                      </h4>
                                      <p
                                        className={`text-[10px] font-medium mt-1 ${isAlmostFull ? "text-rose-500 font-bold" : "text-slate-500"}`}
                                      >
                                        {isFull
                                          ? "Kuota Penuh"
                                          : isAlmostFull
                                            ? `Sisa Kuota: ${sisaKuota}`
                                            : "Kuota Tersedia"}
                                      </p>
                                      <div
                                        className={`mt-2.5 text-[11px] leading-relaxed transition-all duration-300 ${isSelected ? "text-slate-600 border-t border-[#0F2147]/10 pt-2.5 opacity-100" : "text-slate-400 line-clamp-1 opacity-70"}`}
                                      >
                                        <strong className="text-slate-500">
                                          SOP / Jobdesc:
                                        </strong>{" "}
                                        {role.deskripsi ||
                                          "Detail tugas dan tanggung jawab harian formasi ini belum diinput oleh Admin."}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-10 flex justify-end shrink-0">
                      <button
                        type="button"
                        onClick={nextStep1}
                        className="bg-[#0F2147] text-white px-8 py-3.5 rounded-xl text-xs font-bold hover:bg-[#0a152e] transition-all shadow-md active:scale-95 flex items-center gap-2"
                      >
                        Selanjutnya &rarr;
                      </button>
                    </div>
                  </div>

                  {/* ================= STEP 2 : IDENTITAS ================= */}
                  <div
                    className={`${currentStep === 2 ? "block animate-in fade-in slide-in-from-right-8 duration-500" : "hidden"} flex-1 flex flex-col`}
                  >
                    <div className="space-y-6 flex-1">
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                        <p className="text-xs text-blue-800 font-medium">
                          <strong>Catatan:</strong> Pastikan seluruh data diri
                          diisi dengan sebenar-benarnya sesuai dengan kartu
                          identitas Anda.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Nama Lengkap (Sesuai KTP){" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="text"
                            name="nama"
                            value={formData.nama}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium"
                            placeholder="Cth: Budi Santoso"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Tempat Lahir{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="text"
                            name="tempatLahir"
                            value={formData.tempatLahir}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium"
                            placeholder="Cth: Yogyakarta"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Tanggal Lahir{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="date"
                            name="tanggalLahir"
                            value={formData.tanggalLahir}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium uppercase"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Jenis Kelamin{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <div className="flex gap-4">
                            <label
                              className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.jenisKelamin === "Laki-laki" ? "border-[#0F2147] bg-[#0F2147] text-white font-bold shadow-md" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                            >
                              <input
                                type="radio"
                                name="jenisKelamin"
                                value="Laki-laki"
                                checked={formData.jenisKelamin === "Laki-laki"}
                                onChange={handleChange}
                                className="hidden"
                              />{" "}
                              Laki-laki
                            </label>
                            <label
                              className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.jenisKelamin === "Perempuan" ? "border-[#0F2147] bg-[#0F2147] text-white font-bold shadow-md" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                            >
                              <input
                                type="radio"
                                name="jenisKelamin"
                                value="Perempuan"
                                checked={formData.jenisKelamin === "Perempuan"}
                                onChange={handleChange}
                                className="hidden"
                              />{" "}
                              Perempuan
                            </label>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Alamat Domisili Sekarang{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <textarea
                            name="domisili"
                            value={formData.domisili}
                            onChange={handleChange}
                            rows={2}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium resize-none"
                            placeholder="Tuliskan alamat lengkap tempat tinggal saat ini..."
                          ></textarea>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                          Afiliasi Kepanitiaan{" "}
                          <span className="text-[#D93025]">*</span>
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {[
                            { id: "mahasiswa", label: "Mahasiswa" },
                            { id: "alumni", label: "Alumni" },
                            { id: "himpunan", label: "Himpunan" },
                            { id: "ukm", label: "UKM" },
                            { id: "umum", label: "Umum / Eksternal" },
                          ].map((t) => (
                            <label
                              key={t.id}
                              className={`cursor-pointer border p-2.5 text-center rounded-lg transition-all duration-200 ${formData.tipe === t.id ? "border-[#0F2147] bg-[#0F2147] text-white font-bold shadow-md" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 font-medium"}`}
                            >
                              <input
                                type="radio"
                                name="tipe"
                                value={t.id}
                                checked={formData.tipe === t.id}
                                onChange={(e) =>
                                  handleTipeChange(e.target.value)
                                }
                                className="hidden"
                              />
                              <span className="text-[10px] uppercase tracking-wider">
                                {t.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {formData.tipe !== "umum" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                          {["mahasiswa", "himpunan", "ukm", "alumni"].includes(
                            formData.tipe,
                          ) && (
                            <>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">
                                  Fakultas / Program Studi{" "}
                                  <span className="text-[#D93025]">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="fakultas"
                                  value={formData.fakultas}
                                  onChange={handleChange}
                                  placeholder="Cth: FTI / Informatika"
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">
                                  Tahun Angkatan{" "}
                                  <span className="text-[#D93025]">*</span>
                                </label>
                                <input
                                  type="number"
                                  name="angkatan"
                                  value={formData.angkatan}
                                  onChange={handleChange}
                                  placeholder="Cth: 2021"
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium"
                                />
                              </div>
                            </>
                          )}
                          {["mahasiswa", "himpunan", "ukm"].includes(
                            formData.tipe,
                          ) && (
                            <div className="md:col-span-2">
                              <label className="block text-xs font-bold text-slate-500 mb-2">
                                Nomor Induk Mahasiswa (NIM){" "}
                                <span className="text-[#D93025]">*</span>
                              </label>
                              <input
                                type="text"
                                name="nim"
                                value={formData.nim}
                                onChange={handleChange}
                                placeholder="Cth: 20523000"
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium"
                              />
                            </div>
                          )}
                          {["ukm", "himpunan"].includes(formData.tipe) && (
                            <>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">
                                  Nama Organisasi{" "}
                                  <span className="text-[#D93025]">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="instansi"
                                  value={formData.instansi}
                                  onChange={handleChange}
                                  placeholder="Cth: LEM FTI UII"
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-500 mb-2">
                                  Jabatan{" "}
                                  <span className="text-[#D93025]">*</span>
                                </label>
                                <input
                                  type="text"
                                  name="jabatan"
                                  value={formData.jabatan}
                                  onChange={handleChange}
                                  placeholder="Cth: Kadiv Humas"
                                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Email Aktif{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={(e) => {
                              handleChange(e);
                              setEmailErr("");
                            }}
                            onBlur={(e) =>
                              checkDuplicate("email", e.target.value)
                            }
                            className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl outline-none text-sm font-medium ${emailErr ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0F2147]"}`}
                            placeholder="email@domain.com"
                          />
                          {emailErr && (
                            <p className="text-[10px] text-rose-500 mt-1">
                              {emailErr}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            WhatsApp <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="tel"
                            name="whatsapp"
                            value={formData.whatsapp}
                            onChange={(e) => {
                              handleChange(e);
                              setWaErr("");
                            }}
                            onBlur={(e) =>
                              checkDuplicate("whatsapp", e.target.value)
                            }
                            className={`w-full px-4 py-3.5 bg-slate-50 border rounded-xl outline-none text-sm font-medium ${waErr ? "border-rose-500 focus:border-rose-500" : "border-slate-200 focus:border-[#0F2147]"}`}
                            placeholder="08..."
                          />
                          {waErr && (
                            <p className="text-[10px] text-rose-500 mt-1">
                              {waErr}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Akun Instagram (Jangan diprivate){" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="text"
                            name="instagram"
                            value={formData.instagram}
                            onChange={handleChange}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium"
                            placeholder="Cth: @ikauii.diy"
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <label className="block text-xs font-bold text-slate-500 mb-2">
                          Riwayat Penyakit (Tulis "Tidak ada" jika sehat){" "}
                          <span className="text-[#D93025]">*</span>
                        </label>
                        <input
                          type="text"
                          name="riwayatPenyakit"
                          value={formData.riwayatPenyakit}
                          onChange={handleChange}
                          className="w-full px-4 py-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl focus:border-rose-500 outline-none text-sm font-medium"
                          placeholder="Cth: Asma / Maag / Tidak ada"
                        />
                      </div>
                    </div>
                    <div className="mt-10 flex justify-between shrink-0">
                      <button
                        type="button"
                        onClick={prevStep}
                        className="text-slate-500 font-bold px-6 py-3.5 rounded-xl hover:bg-slate-50 text-xs transition-colors"
                      >
                        Kembali
                      </button>
                      <button
                        type="button"
                        onClick={nextStep2}
                        className="bg-[#0F2147] hover:bg-[#0a152e] text-white px-8 py-3.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-2"
                      >
                        Selanjutnya &rarr;
                      </button>
                    </div>
                  </div>

                  {/* ================= STEP 3 : BERKAS & ESAI ================= */}
                  <div
                    className={`${currentStep === 3 ? "block animate-in fade-in slide-in-from-right-8 duration-500" : "hidden"} flex-1 flex flex-col`}
                  >
                    <div className="space-y-6 flex-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">
                          Pas Foto Wajah{" "}
                          <span className="text-[#D93025]">*</span>
                        </label>
                        <div
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${formData.fotoIdCard ? "border-emerald-400 bg-emerald-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}`}
                        >
                          {!formData.fotoIdCard ? (
                            <>
                              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-200 text-slate-400">
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
                              </div>
                              <p className="text-xs font-bold text-[#0F2147] mb-1">
                                Pilih File Foto Anda
                              </p>
                              <p className="text-[10px] text-slate-500 mb-4 font-medium">
                                Foto setengah badan yang jelas (Sistem akan
                                otomatis mengecilkan ukuran).
                              </p>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="text-[10px] file:mr-3 file:py-2 file:px-5 file:rounded-full file:border-0 file:font-bold file:bg-[#0F2147] file:text-white hover:file:bg-[#0a152e] cursor-pointer"
                              />
                              {uploadProgress && (
                                <p className="text-[10px] font-bold text-[#1A73E8] mt-3 animate-pulse">
                                  {uploadProgress}
                                </p>
                              )}
                            </>
                          ) : (
                            <div className="flex flex-col items-center">
                              <img
                                src={formData.fotoIdCard}
                                alt="Preview Wajah"
                                className="h-32 w-32 object-cover rounded-full shadow-sm border-4 border-white mb-3"
                              />
                              <p className="text-[11px] font-bold text-emerald-600 mb-2 flex items-center gap-1.5">
                                <IconCheckCircle /> Berhasil Diunggah
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({ ...formData, fotoIdCard: "" })
                                }
                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 underline"
                              >
                                Ganti Foto
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-3">
                            Ukuran Baju / Jersey Kepanitiaan{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <select
                            name="ukuranJersey"
                            value={formData.ukuranJersey}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-bold text-[#0F2147] mb-2 cursor-pointer"
                          >
                            <option value="" disabled>
                              -- Pilih Ukuran --
                            </option>
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                            <option value="XXL">XXL</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-3">
                            Apakah kamu memiliki kendaraan pribadi?{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <select
                            name="kendaraan"
                            value={formData.kendaraan}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium cursor-pointer"
                          >
                            <option value="" disabled>
                              -- Pilih Status Kendaraan --
                            </option>
                            <option value="Motor">Ya, Motor</option>
                            <option value="Mobil">Ya, Mobil</option>
                            <option value="Tidak ada">
                              Tidak ada kendaraan pribadi
                            </option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Alasan memilih divisi / posisi tersebut?{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <textarea
                            name="alasanDivisi"
                            value={formData.alasanDivisi}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium resize-none"
                            placeholder="Sampaikan mengapa Anda cocok di posisi ini..."
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Motivasi Bergabung Kepanitiaan{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <textarea
                            name="motivasi"
                            value={formData.motivasi}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium resize-none"
                            placeholder="Ceritakan motivasi utama Anda..."
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">
                            Pengalaman Relevan{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <textarea
                            name="pengalaman"
                            value={formData.pengalaman}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#0F2147] outline-none text-sm font-medium resize-none"
                            placeholder="Pernah ikut kepanitiaan atau organisasi apa saja?"
                          ></textarea>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-3">
                            Apakah bersedia ditempatkan di divisi lain apabila
                            dibutuhkan?{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <div className="flex gap-4">
                            <label
                              className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.bersediaPindahDivisi === "Ya" ? "border-[#1E8E3E] bg-emerald-50 text-emerald-800 font-bold" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                            >
                              <input
                                type="radio"
                                name="bersediaPindahDivisi"
                                value="Ya"
                                checked={formData.bersediaPindahDivisi === "Ya"}
                                onChange={handleChange}
                                className="hidden"
                              />{" "}
                              Ya, Bersedia
                            </label>
                            <label
                              className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.bersediaPindahDivisi === "Tidak" ? "border-[#D93025] bg-rose-50 text-rose-800 font-bold" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                            >
                              <input
                                type="radio"
                                name="bersediaPindahDivisi"
                                value="Tidak"
                                checked={
                                  formData.bersediaPindahDivisi === "Tidak"
                                }
                                onChange={handleChange}
                                className="hidden"
                              />{" "}
                              Tidak
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-3">
                            Apakah bersedia mengikuti seluruh pelatihan dan
                            briefing sebelum event?{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <div className="flex gap-4">
                            <label
                              className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.bersediaPelatihan === "Ya" ? "border-[#1E8E3E] bg-emerald-50 text-emerald-800 font-bold" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                            >
                              <input
                                type="radio"
                                name="bersediaPelatihan"
                                value="Ya"
                                checked={formData.bersediaPelatihan === "Ya"}
                                onChange={handleChange}
                                className="hidden"
                              />{" "}
                              Ya, Tentu Saja
                            </label>
                            <label
                              className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-xl cursor-pointer transition-all ${formData.bersediaPelatihan === "Tidak" ? "border-[#D93025] bg-rose-50 text-rose-800 font-bold" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
                            >
                              <input
                                type="radio"
                                name="bersediaPelatihan"
                                value="Tidak"
                                checked={formData.bersediaPelatihan === "Tidak"}
                                onChange={handleChange}
                                className="hidden"
                              />{" "}
                              Tidak
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#E8F0FE] p-5 rounded-2xl border border-[#1A73E8]/20 flex items-start gap-4 mt-8">
                        <input
                          type="checkbox"
                          checked={isAgreed}
                          onChange={(e) => setIsAgreed(e.target.checked)}
                          className="mt-1 cursor-pointer w-4 h-4 accent-[#1A73E8]"
                        />
                        <p className="text-xs text-blue-900 leading-relaxed font-bold">
                          Dengan mengisi form ini, saya menyatakan data yang
                          diberikan benar dan bersedia mengikuti seluruh
                          ketentuan manpower/volunteer{" "}
                          {selectedEvent?.title || "IKA UII DIY RUN"}.
                        </p>
                      </div>
                    </div>

                    <div className="mt-10 flex justify-between shrink-0">
                      <button
                        type="button"
                        onClick={prevStep}
                        disabled={isSubmitting}
                        className="text-slate-500 font-bold px-6 py-3.5 rounded-xl hover:bg-slate-50 text-xs transition-colors disabled:opacity-50"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-[#0F2147] text-white px-8 py-3.5 rounded-xl text-xs font-bold hover:bg-[#0a152e] transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <IconSpinner /> Memproses...
                          </>
                        ) : (
                          "Kirim Pendaftaran 🚀"
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      <FooterPublic />
    </div>
  );
}
