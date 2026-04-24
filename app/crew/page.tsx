"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// --- TYPE DEFINITIONS ---
interface RolePosition {
  id: string;
  nama: string;
  kuota: number;
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
  groups: DivisionGroup[];
}

interface CrewMember {
  roleId: string;
  status: string;
}

export default function CrewRegistrationPage() {
  const [events, setEvents] = useState<EventRecruitment[]>([]);
  const [allAcceptedCrew, setAllAcceptedCrew] = useState<CrewMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 🔥 STATE UNTUK WIZARD STEP-BY-STEP
  const [currentStep, setCurrentStep] = useState(1);

  const { executeRecaptcha } = useGoogleReCaptcha();

  const [formData, setFormData] = useState({
    eventId: "",
    roleId: "",
    nama: "",
    email: "",
    whatsapp: "",
    tipe: "mahasiswa", // mahasiswa | alumni | ukm | himpunan
    fakultas: "",
    nim: "",
    angkatan: "",
    instansi: "",
    jabatan: "",
    domisili: "",
    motivasi: "",
    pengalaman: "",
  });

  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    // 1. Fetch Events
    const unsubSettings = onSnapshot(
      doc(db, "settings", "virtual_run"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const activeEvents = (data.crewRecruitments || []).filter(
            (e: EventRecruitment) => e.isActive,
          );
          setEvents(activeEvents);
          if (activeEvents.length > 0 && !formData.eventId) {
            setFormData((prev) => ({ ...prev, eventId: activeEvents[0].id }));
          }
        }
      },
    );

    // 2. Fetch Kuota
    const qAccepted = query(
      collection(db, "crew_volunteers"),
      where("status", "==", "accepted"),
    );
    const unsubAccepted = onSnapshot(qAccepted, (snap) => {
      const data = snap.docs.map(
        (d) =>
          ({ roleId: d.data().roleId, status: d.data().status }) as CrewMember,
      );
      setAllAcceptedCrew(data);
      setIsLoading(false);
    });

    return () => {
      unsubSettings();
      unsubAccepted();
    };
  }, []);

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

  // 🔥 VALIDASI PER LANGKAH 🔥
  const nextStep1 = () => {
    if (!formData.eventId || !formData.roleId) {
      alert(
        "Silakan pilih Event dan Formasi (Sesi) yang ingin dilamar terlebih dahulu.",
      );
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const nextStep2 = () => {
    if (
      !formData.nama.trim() ||
      !formData.email.trim() ||
      !formData.whatsapp.trim()
    ) {
      alert("Nama, Email, dan WhatsApp wajib diisi.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Format email tidak valid.");
      return;
    }
    if (!/^(\+62|62|0)8[1-9][0-9]{6,12}$/.test(formData.whatsapp)) {
      alert("Format WhatsApp tidak valid. Gunakan awalan 08 atau 628.");
      return;
    }
    if (["mahasiswa", "ukm", "himpunan"].includes(formData.tipe)) {
      if (
        !formData.fakultas.trim() ||
        !formData.nim.trim() ||
        !formData.angkatan.trim()
      ) {
        alert("Fakultas, NIM, dan Angkatan wajib diisi.");
        return;
      }
    }
    if (formData.tipe === "alumni") {
      if (
        !formData.fakultas.trim() ||
        !formData.angkatan.trim() ||
        !formData.domisili.trim()
      ) {
        alert("Fakultas, Angkatan, dan Domisili wajib diisi untuk Alumni.");
        return;
      }
    }
    if (formData.tipe === "ukm" || formData.tipe === "himpunan") {
      if (!formData.instansi.trim() || !formData.jabatan.trim()) {
        alert("Nama Organisasi dan Jabatan wajib diisi.");
        return;
      }
    }
    setCurrentStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.motivasi.trim() || !formData.pengalaman.trim())
      return alert("Motivasi dan Pengalaman Terkait wajib diisi.");
    if (!isAgreed)
      return alert(
        "Anda harus mencentang persetujuan dan bersedia bergabung ke Saluran WA.",
      );

    setIsSubmitting(true);

    try {
      if (!executeRecaptcha) {
        alert("Sistem keamanan belum siap. Silakan refresh halaman.");
        setIsSubmitting(false);
        return;
      }

      const token = await executeRecaptcha("crew_registration");
      const recaptchaResponse = await fetch("/api/verify-recaptcha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const recaptchaResult = await recaptchaResponse.json();

      if (!recaptchaResult.success) {
        alert(
          "Deteksi aktivitas mencurigakan (Spam/Bot). Pendaftaran ditolak.",
        );
        setIsSubmitting(false);
        return;
      }

      // Bersihkan data yang tidak relevan dengan tipe sebelum disave
      const finalData = { ...formData };
      if (formData.tipe === "mahasiswa") {
        finalData.instansi = "-";
        finalData.jabatan = "-";
        finalData.domisili = "-";
      }
      if (formData.tipe === "alumni") {
        finalData.nim = "-";
        finalData.jabatan = "-";
      }
      if (formData.tipe === "ukm" || formData.tipe === "himpunan") {
        finalData.domisili = "-";
      }

      await addDoc(collection(db, "crew_volunteers"), {
        ...finalData,
        status: "pending",
        waktuDaftar: new Date().toISOString(),
      });

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === formData.eventId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#E8F0FE] border-t-[#1A73E8] rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-medium text-[#1A73E8]">Memuat Formulir...</p>
      </div>
    );
  }

  // 🔥 HALAMAN SUKSES DENGAN KALIMAT BARU 🔥
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="bg-white p-10 rounded-2xl shadow-lg max-w-md w-full border border-[#DADCE0] animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-[#E6F4EA] text-[#1E8E3E] rounded-full flex items-center justify-center mb-6 mx-auto">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-medium text-slate-800 mb-3 tracking-tight">
            Pendaftaran Berhasil!
          </h1>
          <p className="text-slate-600 mb-8 text-sm leading-relaxed">
            Terima kasih <strong>{formData.nama}</strong>. Data Anda telah masuk
            ke sistem dan berstatus <strong>Menunggu Review</strong>. <br />
            <br />
            Pastikan Anda memantau <strong>Email</strong> dan{" "}
            <strong>Instagram resmi</strong> kami untuk melihat pengumuman
            status pendaftaran Anda.
          </p>
          <Link
            href="/"
            className="block w-full bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium py-3 rounded-lg transition-colors shadow-sm"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-24 text-[#202124]">
      {/* HEADER GOOGLE STYLE */}
      <div className="bg-white border-b border-[#DADCE0] pt-8 pb-20 px-6 text-center shadow-sm">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/"
            className="text-[#1A73E8] hover:bg-[#E8F0FE] font-medium text-sm flex items-center justify-center gap-1.5 mb-6 transition-colors w-fit mx-auto px-4 py-1.5 rounded-full border border-transparent hover:border-[#1A73E8]/30"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>{" "}
            Kembali
          </Link>
          <h1 className="text-3xl font-medium text-slate-900 mb-3 tracking-tight">
            Formulir Rekrutmen Kru
          </h1>
          <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
            Lengkapi formulir secara bertahap untuk mendaftarkan diri Anda pada
            event kepanitiaan yang tersedia.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-10">
        {/* 🔥 STEPPER PROGRESS BAR (GOOGLE WIZARD STYLE) 🔥 */}
        <div className="flex items-center justify-center mb-10 max-w-lg mx-auto bg-white p-4 rounded-xl shadow-sm border border-[#DADCE0]">
          <div className="flex flex-col items-center relative z-10 bg-white">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${currentStep >= 1 ? "bg-[#1A73E8] text-white" : "bg-[#F8F9FA] text-[#5F6368] border border-[#DADCE0]"}`}
            >
              {currentStep > 1 ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                "1"
              )}
            </div>
            <span
              className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider ${currentStep >= 1 ? "text-[#1A73E8]" : "text-[#5F6368]"}`}
            >
              Formasi
            </span>
          </div>
          <div
            className={`flex-1 h-0.5 -mt-5 mx-2 transition-colors ${currentStep >= 2 ? "bg-[#1A73E8]" : "bg-[#DADCE0]"}`}
          ></div>

          <div className="flex flex-col items-center relative z-10 bg-white">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${currentStep >= 2 ? "bg-[#1A73E8] text-white" : "bg-[#F8F9FA] text-[#5F6368] border border-[#DADCE0]"}`}
            >
              {currentStep > 2 ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                "2"
              )}
            </div>
            <span
              className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider ${currentStep >= 2 ? "text-[#1A73E8]" : "text-[#5F6368]"}`}
            >
              Identitas
            </span>
          </div>
          <div
            className={`flex-1 h-0.5 -mt-5 mx-2 transition-colors ${currentStep >= 3 ? "bg-[#1A73E8]" : "bg-[#DADCE0]"}`}
          ></div>

          <div className="flex flex-col items-center relative z-10 bg-white">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors ${currentStep >= 3 ? "bg-[#1A73E8] text-white" : "bg-[#F8F9FA] text-[#5F6368] border border-[#DADCE0]"}`}
            >
              3
            </div>
            <span
              className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider ${currentStep >= 3 ? "text-[#1A73E8]" : "text-[#5F6368]"}`}
            >
              Selesai
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 sm:p-10 shadow-lg border border-[#DADCE0]">
          {events.length === 0 ? (
            <div className="text-center py-16">
              <svg
                className="w-16 h-16 text-slate-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <h3 className="text-xl font-medium text-slate-800 mb-2">
                Belum Ada Rekrutmen
              </h3>
              <p className="text-slate-500 text-sm">
                Saat ini tidak ada lowongan kepanitiaan yang sedang aktif.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ================= STEP 1: EVENT & POSISI ================= */}
              <div
                className={`${currentStep === 1 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}`}
              >
                <div className="mb-6 border-b border-[#DADCE0] pb-4">
                  <h2 className="text-xl font-medium text-slate-800">
                    Pilih Formasi & Sesi
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Pilih event dan satu posisi yang tersedia untuk dilamar.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Event Kepanitiaan{" "}
                      <span className="text-[#D93025]">*</span>
                    </label>
                    <select
                      name="eventId"
                      value={formData.eventId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          eventId: e.target.value,
                          roleId: "",
                        })
                      }
                      required
                      className="w-full px-4 py-3 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]/30 outline-none text-sm text-slate-800 shadow-sm transition-all"
                    >
                      <option value="" disabled>
                        -- Pilih Event --
                      </option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedEvent && (
                    <div className="animate-in fade-in duration-300 space-y-6">
                      {selectedEvent.requirements && (
                        <div className="bg-[#F8F9FA] p-4 border border-[#DADCE0] rounded-lg">
                          <p className="text-sm font-medium text-slate-800 mb-2 flex items-center gap-2">
                            <svg
                              className="w-4 h-4 text-[#1A73E8]"
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
                            Persyaratan Umum
                          </p>
                          <ul className="text-sm text-slate-600 space-y-1 ml-6 list-disc">
                            {selectedEvent.requirements
                              .split("\n")
                              .map((req, idx) => (
                                <li key={idx}>{req}</li>
                              ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-4">
                          Pilih Formasi (Sesi){" "}
                          <span className="text-[#D93025]">*</span>
                        </label>
                        {!selectedEvent.groups ||
                        selectedEvent.groups.length === 0 ? (
                          <p className="text-sm text-[#D93025] bg-[#FCE8E6] p-4 rounded border border-red-200">
                            Belum ada formasi yang dibuka.
                          </p>
                        ) : (
                          <div className="space-y-8">
                            {selectedEvent.groups.map((group) => (
                              <div key={group.id}>
                                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                                  {group.title}
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {!group.roles || group.roles.length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">
                                      Belum ada posisi tersedia.
                                    </p>
                                  ) : (
                                    group.roles.map((role) => {
                                      const filled = allAcceptedCrew.filter(
                                        (c) => c.roleId === role.id,
                                      ).length;
                                      const isFull = filled >= role.kuota;
                                      const isSelected =
                                        formData.roleId === role.id;

                                      return (
                                        /* 🔥 DESAIN KARTU GAYA GOOGLE FORM 🔥 */
                                        <label
                                          key={role.id}
                                          className={`relative flex flex-col bg-white border rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${isFull ? "border-[#DADCE0] opacity-60 cursor-not-allowed bg-[#F8F9FA]" : isSelected ? "border-[#1A73E8] shadow-md ring-1 ring-[#1A73E8]" : "border-[#DADCE0] hover:border-slate-400"}`}
                                        >
                                          <input
                                            type="radio"
                                            name="roleId"
                                            value={role.id}
                                            disabled={isFull}
                                            checked={isSelected}
                                            onChange={handleChange}
                                            className="hidden"
                                          />
                                          <div className="p-4 flex-1">
                                            <h4
                                              className={`text-base font-bold mb-1 leading-tight ${isSelected ? "text-[#1A73E8]" : "text-slate-800"}`}
                                            >
                                              {role.nama}
                                            </h4>
                                            <p className="text-[#5F6368] text-xs mb-3">
                                              {group.title}
                                            </p>
                                            <div className="pt-3 border-t border-slate-100">
                                              {isFull ? (
                                                <span className="text-[10px] font-bold text-[#D93025] uppercase tracking-widest">
                                                  Kuota Penuh
                                                </span>
                                              ) : (
                                                <span className="text-xs font-medium text-slate-600">
                                                  Sisa Tempat:{" "}
                                                  <span className="font-bold text-slate-800">
                                                    {role.kuota - filled}
                                                  </span>
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          <div
                                            className={`py-2.5 text-center text-xs font-bold transition-colors ${isSelected ? "bg-[#1A73E8] text-white" : "border-t border-[#DADCE0] text-[#1A73E8] bg-[#F8F9FA]"}`}
                                          >
                                            {isSelected
                                              ? "Terpilih ✓"
                                              : "Pilih"}
                                          </div>
                                        </label>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-6 mt-6 border-t border-[#DADCE0] flex justify-end">
                    <button
                      type="button"
                      onClick={nextStep1}
                      className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium px-8 py-2.5 rounded-lg transition-colors text-sm shadow-sm"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= STEP 2: IDENTITAS ================= */}
              <div
                className={`${currentStep === 2 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}`}
              >
                <div className="mb-6 border-b border-[#DADCE0] pb-4">
                  <h2 className="text-xl font-medium text-slate-800">
                    Identitas & Profil Pendaftar
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Lengkapi informasi dasar dan kategori pendaftaran Anda.
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Identitas Diri */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-[#202124] mb-1.5">
                        Nama Lengkap <span className="text-[#D93025]">*</span>
                      </label>
                      <input
                        type="text"
                        name="nama"
                        value={formData.nama}
                        onChange={handleChange}
                        placeholder="Sesuai KTP / KTM"
                        className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]/30 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#202124] mb-1.5">
                        Email Aktif <span className="text-[#D93025]">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="email@domain.com"
                        className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]/30 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#202124] mb-1.5">
                        No. WhatsApp <span className="text-[#D93025]">*</span>
                      </label>
                      <input
                        type="tel"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleChange}
                        placeholder="08..."
                        className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]/30 transition-all text-sm"
                      />
                    </div>
                  </div>

                  <hr className="border-[#DADCE0]" />

                  {/* Kategori Pendaftar */}
                  <div>
                    <label className="block text-sm font-medium text-[#202124] mb-3">
                      Kategori Pendaftar{" "}
                      <span className="text-[#D93025]">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { id: "mahasiswa", label: "Mahasiswa UII" },
                        { id: "alumni", label: "Alumni UII" },
                        { id: "himpunan", label: "Utusan Himpunan" },
                        { id: "ukm", label: "Utusan UKM" },
                      ].map((t) => (
                        <label
                          key={t.id}
                          className={`cursor-pointer border p-3 text-center rounded-lg transition-all ${formData.tipe === t.id ? "border-[#1A73E8] bg-[#E8F0FE] text-[#1A73E8] shadow-sm" : "border-[#DADCE0] text-[#5F6368] hover:bg-[#F8F9FA]"}`}
                        >
                          <input
                            type="radio"
                            name="tipe"
                            value={t.id}
                            checked={formData.tipe === t.id}
                            onChange={(e) => handleTipeChange(e.target.value)}
                            className="hidden"
                          />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {t.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Field Dinamis Sesuai Kategori */}
                  <div className="bg-[#F8F9FA] p-5 rounded-lg border border-[#DADCE0] grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-300">
                    {/* Wajib Mahasiswa, Himpunan, UKM */}
                    {["mahasiswa", "himpunan", "ukm"].includes(
                      formData.tipe,
                    ) && (
                      <>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-[#202124] mb-1.5">
                            Fakultas / Jurusan UII{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="text"
                            name="fakultas"
                            value={formData.fakultas}
                            onChange={handleChange}
                            placeholder="Cth: FTI / Informatika"
                            className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#202124] mb-1.5">
                            NIM (Nomor Induk Mahasiswa){" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="text"
                            name="nim"
                            value={formData.nim}
                            onChange={handleChange}
                            placeholder="Cth: 20523000"
                            className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#202124] mb-1.5">
                            Tahun Angkatan{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="number"
                            name="angkatan"
                            value={formData.angkatan}
                            onChange={handleChange}
                            min="1950"
                            max={new Date().getFullYear()}
                            placeholder="Cth: 2020"
                            className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                          />
                        </div>
                      </>
                    )}

                    {/* Wajib Alumni */}
                    {formData.tipe === "alumni" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-[#202124] mb-1.5">
                            Fakultas Lulusan{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="text"
                            name="fakultas"
                            value={formData.fakultas}
                            onChange={handleChange}
                            placeholder="Cth: Hukum"
                            className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#202124] mb-1.5">
                            Tahun Angkatan{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="number"
                            name="angkatan"
                            value={formData.angkatan}
                            onChange={handleChange}
                            min="1950"
                            max={new Date().getFullYear()}
                            placeholder="Cth: 2015"
                            className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#202124] mb-1.5">
                            Tempat Kerja Saat Ini
                          </label>
                          <input
                            type="text"
                            name="instansi"
                            value={formData.instansi}
                            onChange={handleChange}
                            placeholder="Cth: PT. Inovasi Bangsa"
                            className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#202124] mb-1.5">
                            Domisili Tempat Tinggal{" "}
                            <span className="text-[#D93025]">*</span>
                          </label>
                          <input
                            type="text"
                            name="domisili"
                            value={formData.domisili}
                            onChange={handleChange}
                            placeholder="Cth: Sleman, Yogyakarta"
                            className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                          />
                        </div>
                      </>
                    )}

                    {/* Tambahan Wajib Himpunan / UKM */}
                    {["ukm", "himpunan"].includes(formData.tipe) && (
                      <div className="md:col-span-2 border-t border-[#DADCE0] mt-1 pt-5">
                        <p className="text-xs font-bold text-[#1A73E8] uppercase tracking-widest mb-3">
                          Detail Organisasi Asal
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <label className="block text-sm font-medium text-[#202124] mb-1.5">
                              Nama{" "}
                              {formData.tipe === "ukm" ? "UKM" : "Himpunan"}{" "}
                              <span className="text-[#D93025]">*</span>
                            </label>
                            <input
                              type="text"
                              name="instansi"
                              value={formData.instansi}
                              onChange={handleChange}
                              placeholder="Cth: LEM FTI UII"
                              className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#202124] mb-1.5">
                              Jabatan di Organisasi{" "}
                              <span className="text-[#D93025]">*</span>
                            </label>
                            <input
                              type="text"
                              name="jabatan"
                              value={formData.jabatan}
                              onChange={handleChange}
                              placeholder="Cth: Kepala Divisi Humas"
                              className="w-full px-4 py-2.5 bg-white border border-[#DADCE0] rounded-lg focus:border-[#1A73E8] outline-none text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-[#DADCE0] flex justify-between gap-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="text-[#5F6368] hover:bg-[#F8F9FA] font-medium px-6 py-2.5 rounded-lg transition-colors text-sm border border-transparent hover:border-[#DADCE0]"
                    >
                      Kembali
                    </button>
                    <button
                      type="button"
                      onClick={nextStep2}
                      className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium px-8 py-2.5 rounded-lg transition-colors text-sm shadow-sm"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              </div>

              {/* ================= STEP 3: KAPABILITAS & SELESAI ================= */}
              <div
                className={`${currentStep === 3 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}`}
              >
                <div className="mb-6 border-b border-[#DADCE0] pb-4">
                  <h2 className="text-xl font-medium text-slate-800">
                    Kapabilitas & Persetujuan
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Langkah terakhir, lengkapi esai dan berikan persetujuan.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#202124] mb-2">
                      Motivasi Bergabung{" "}
                      <span className="text-[#D93025]">*</span>
                    </label>
                    <textarea
                      name="motivasi"
                      value={formData.motivasi}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Jelaskan alasan kuat mengapa Anda ingin bergabung di kepanitiaan ini..."
                      className="w-full px-4 py-3 bg-white border border-[#DADCE0] rounded-lg outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]/30 transition-colors resize-none text-sm"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#202124] mb-2">
                      Pengalaman Kepanitiaan Terkait{" "}
                      <span className="text-[#D93025]">*</span>
                    </label>
                    <textarea
                      name="pengalaman"
                      value={formData.pengalaman}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Ceritakan pengalaman kepanitiaan atau keahlian yang relevan..."
                      className="w-full px-4 py-3 bg-white border border-[#DADCE0] rounded-lg outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8]/30 transition-colors resize-none text-sm"
                    ></textarea>
                  </div>

                  {/* KOTAK PERSETUJUAN */}
                  <div className="bg-[#F8F9FA] border border-[#DADCE0] p-5 rounded-lg mt-6">
                    <label className="flex items-start gap-4 cursor-pointer hover:bg-slate-100 p-2 -m-2 rounded transition-colors">
                      <div className="flex items-center h-5 mt-1">
                        <input
                          type="checkbox"
                          checked={isAgreed}
                          onChange={(e) => setIsAgreed(e.target.checked)}
                          className="w-5 h-5 accent-[#1A73E8] bg-white border-slate-300 rounded cursor-pointer"
                        />
                      </div>
                      <div className="text-sm text-[#202124] leading-relaxed flex-1">
                        Saya menyatakan bahwa data yang diisi adalah benar. Saya
                        bersedia mengikuti seluruh rangkaian acara hingga
                        selesai dengan penuh tanggung jawab, serta{" "}
                        <strong>WAJIB</strong> bergabung ke saluran WhatsApp
                        resmi kepanitiaan untuk mendapatkan info terbaru:
                        <div className="mt-3">
                          <a
                            href="https://www.whatsapp.com/channel/0029Vb7WeSSFcow6V1mLa03P"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#DADCE0] text-[#1E8E3E] hover:bg-[#E6F4EA] font-medium rounded-full text-xs transition-colors shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.405-.883-.733-1.48-1.638-1.653-1.935-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                            </svg>
                            Saluran WA IKA UII
                          </a>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="pt-6 mt-6 border-t border-[#DADCE0] flex flex-col-reverse sm:flex-row justify-between gap-4">
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={isSubmitting}
                      className="text-[#5F6368] hover:bg-[#F8F9FA] font-medium px-6 py-2.5 rounded-lg transition-colors text-sm border border-transparent hover:border-[#DADCE0] disabled:opacity-50"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#1A73E8] hover:bg-[#1557B0] text-white font-medium px-8 py-3 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <svg
                            className="w-4 h-4 animate-spin text-white"
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
                          </svg>{" "}
                          Memverifikasi & Mengirim...
                        </>
                      ) : (
                        "Kirim Pendaftaran"
                      )}
                    </button>
                  </div>
                  <div className="text-xs text-[#5F6368] text-center mt-4">
                    Sistem dilindungi reCAPTCHA. Tunduk pada{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      className="text-[#1A73E8] hover:underline"
                    >
                      Privasi
                    </a>{" "}
                    &{" "}
                    <a
                      href="https://policies.google.com/terms"
                      className="text-[#1A73E8] hover:underline"
                    >
                      Persyaratan
                    </a>{" "}
                    Google.
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
