"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "@/lib/toast";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import NavbarMasterclass from "@/components/layout/NavbarMasterclass";
import FooterPublic from "@/components/layout/FooterPublic";
import Link from "next/link";
import Script from "next/script";

export default function MasterclassPublicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [accessStatus, setAccessStatus] = useState<
    "loading" | "tamu" | "belum_lunas" | "lunas_admin"
  >("loading");

  const [course, setCourse] = useState<any>(null);
  const [mentor, setMentor] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // 🔥 STATE CMS & PAYMENT GABUNGAN 🔥
  const [cms, setCms] = useState<any>(null);

  // 🔥 STATE UNTUK CHECKOUT MODAL 🔥
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [inputPromo, setInputPromo] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [buktiBase64, setBuktiBase64] = useState<string | null>(null);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // 🔥 STATE UNTUK ACCORDION SILABUS 🔥
  const [expandedBabs, setExpandedBabs] = useState<string[]>([]);

  // Modal Notifikasi Universal
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "success",
    title: "",
    message: "",
    actionText: "Tutup",
    actionLink: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      await fetchAllDataAndCheckAccess(user);
    });
    return () => unsubscribe();
  }, [courseId]);

  const fetchAllDataAndCheckAccess = async (user: any) => {
    setAccessStatus("loading");
    try {
      const courseSnap = await getDoc(doc(db, "masterclass_courses", courseId));
      if (!courseSnap.exists()) {
        router.push("/masterclass");
        return;
      }
      const courseData: any = { id: courseSnap.id, ...courseSnap.data() };
      setCourse(courseData);

      const cmsSnap = await getDoc(doc(db, "settings", "masterclass_cms"));
      const paymentSnap = await getDoc(doc(db, "settings", "masterclass"));
      const vrSnap = await getDoc(doc(db, "settings", "virtual_run"));

      let combinedSettings = {};
      if (vrSnap.exists())
        combinedSettings = { ...combinedSettings, ...vrSnap.data() };
      if (paymentSnap.exists())
        combinedSettings = { ...combinedSettings, ...paymentSnap.data() };
      if (cmsSnap.exists())
        combinedSettings = { ...combinedSettings, ...cmsSnap.data() };

      setCms(combinedSettings);

      if (courseData.mentorId) {
        const mentorSnap = await getDoc(
          doc(db, "masterclass_mentors", courseData.mentorId),
        );
        if (mentorSnap.exists())
          setMentor({ id: mentorSnap.id, ...mentorSnap.data() });
      }

      const qModules = query(
        collection(db, "masterclass_modules"),
        where("courseId", "==", courseId),
      );
      const moduleSnaps = await getDocs(qModules);
      setModules(
        moduleSnaps.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => Number(a.urutan) - Number(b.urutan)),
      );

      const qReviews = query(
        collection(db, "masterclass_reviews"),
        where("courseId", "==", courseId),
      );
      const reviewSnaps = await getDocs(qReviews);
      setReviews(
        reviewSnaps.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r: any) => r.status !== "Sembunyi"),
      );

      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const role = userDoc.exists() ? userDoc.data().role?.toLowerCase() : "";

        if (
          role === "admin" ||
          role === "super_admin" ||
          role === "superadmin"
        ) {
          setAccessStatus("lunas_admin");
        } else {
          const qEnroll = query(
            collection(db, "masterclass_enrollments"),
            where("courseId", "==", courseId),
            where("uid", "==", user.uid),
          );
          const snapEnroll = await getDocs(qEnroll);

          if (!snapEnroll.empty) {
            const status = snapEnroll.docs[0].data().statusAkses;
            setAccessStatus(status === "Lunas" ? "lunas_admin" : "belum_lunas");
          } else {
            setAccessStatus("tamu");
          }
        }
      } else {
        setAccessStatus("tamu");
      }
    } catch (error) {
      console.error("Gagal memuat detail:", error);
      setAccessStatus("tamu");
    }
  };

  // 🔥 LOGIKA PENGELOMPOKKAN BAB (SILABUS) 🔥
  const groupedModules = useMemo(() => {
    const groups: Record<string, any[]> = {};
    modules.forEach((mod) => {
      const bab = mod.bab || "Materi Pendahuluan";
      if (!groups[bab]) groups[bab] = [];
      groups[bab].push(mod);
    });
    return groups;
  }, [modules]);

  // Otomatis buka Bab pertama saat data diload
  useEffect(() => {
    const babs = Object.keys(groupedModules);
    if (babs.length > 0 && expandedBabs.length === 0) {
      setExpandedBabs([babs[0]]);
    }
  }, [groupedModules]);

  const toggleBab = (bab: string) => {
    setExpandedBabs((prev) =>
      prev.includes(bab) ? prev.filter((b) => b !== bab) : [...prev, bab],
    );
  };

  const processEnrollment = async (
    finalPrice: number,
    statusAkses: string,
    buktiUrl: string | null,
  ) => {
    setIsProcessingCheckout(true);
    try {
      await addDoc(collection(db, "masterclass_enrollments"), {
        courseId: courseId,
        uid: currentUser.uid,
        emailPeserta: currentUser.email,
        namaPeserta:
          currentUser.displayName ||
          currentUser.email?.split("@")[0] ||
          "Peserta",
        statusAkses: statusAkses,
        tipeHarga: course.tipeHarga,
        hargaTransaksi: finalPrice,
        buktiTransferUrl: buktiUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setIsCheckoutOpen(false);

      if (statusAkses === "Lunas") {
        setAccessStatus("lunas_admin");
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Pendaftaran Berhasil!",
          message: "Selamat! Anda sekarang memiliki akses penuh ke kelas ini.",
          actionText: "Masuk Ruang Belajar",
          actionLink: `/masterclass/${courseId}/learn`,
        });
      } else {
        setAccessStatus("belum_lunas");
        setModalConfig({
          isOpen: true,
          type: "success",
          title: "Pesanan Dicatat!",
          message:
            "Bukti pembayaran berhasil diunggah. Silakan tunggu Admin melakukan verifikasi.",
          actionText: "Lihat Status Kelas",
          actionLink: "/masterclass/my-courses",
        });
      }
    } catch {
      setModalConfig({
        isOpen: true,
        type: "error",
        title: "Terjadi Kesalahan",
        message: "Sistem gagal memproses pendaftaran Anda. Coba lagi nanti.",
        actionText: "Tutup",
        actionLink: "",
      });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const handleOpenCheckout = () => {
    if (!currentUser) {
      setModalConfig({
        isOpen: true,
        type: "warning",
        title: "Akses Ditolak",
        message: "Anda harus login terlebih dahulu untuk mendaftar kelas ini.",
        actionText: "Login / Daftar Sekarang",
        actionLink: "/login",
      });
      return;
    }
    if (course.tipeHarga === "Gratis") {
      processEnrollment(0, "Lunas", null);
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleApplyPromo = () => {
    if (!cms?.promoActive || !cms?.promoCode) {
      toast.warning("Saat ini tidak ada promo yang tersedia.");
      return;
    }
    if (inputPromo.toUpperCase() === cms.promoCode.toUpperCase()) {
      const disc = (course.totalHarga * cms.promoDiscount) / 100;
      setDiscountAmount(disc);
    } else {
      toast.warning("Kode voucher tidak valid atau sudah kedaluwarsa.");
      setDiscountAmount(0);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 800000) {
      toast.warning("Ukuran gambar terlalu besar! Maksimal 800KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => setBuktiBase64(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmitCheckout = async () => {
    const finalPrice = course.totalHarga - discountAmount;
    if (
      (cms?.metodePembayaran === "manual" ||
        cms?.metodePembayaran === "qris") &&
      !buktiBase64
    ) {
      toast.warning("Harap unggah bukti pembayaran (struk transfer) terlebih dahulu.");
      return;
    }

    if (cms?.metodePembayaran === "midtrans") {
      if (!(window as any).snap) {
        toast.warning("Sistem pembayaran belum memuat sepenuhnya. Mohon pastikan API Key Midtrans sudah di-setting di Admin.");
        return;
      }
      setIsProcessingCheckout(true);
      try {
        const newEnrollmentRef = await addDoc(
          collection(db, "masterclass_enrollments"),
          {
            courseId: courseId,
            uid: currentUser.uid,
            emailPeserta: currentUser.email,
            namaPeserta:
              currentUser.displayName ||
              currentUser.email?.split("@")[0] ||
              "Peserta",
            statusAkses: "Pending",
            tipeHarga: course.tipeHarga,
            hargaTransaksi: finalPrice,
            buktiTransferUrl: null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
        );

        const res = await fetch("/api/midtrans-masterclass", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enrollmentId: newEnrollmentRef.id,
            grossAmount: finalPrice,
            customerName: currentUser.displayName || "Siswa IKA UII",
            customerEmail: currentUser.email,
          }),
        });

        const data = await res.json();
        if (data.token) {
          setIsCheckoutOpen(false);
          (window as any).snap.pay(data.token, {
            onSuccess: function () {
              router.push("/masterclass/my-courses");
            },
            onPending: function () {
              router.push("/masterclass/my-courses");
            },
            onError: function () {
              toast.error("Pembayaran gagal!");
            },
            onClose: function () {
              router.push("/masterclass/my-courses");
            },
          });
        } else {
          toast.error(`Gagal memuat pembayaran Midtrans: ${data.error}`);
        }
      } catch {
        toast.error("Terjadi kesalahan sistem saat menghubungi Midtrans.");
      } finally {
        setIsProcessingCheckout(false);
      }
      return;
    }
    processEnrollment(finalPrice, "Pending", buktiBase64);
  };

  const handleModalAction = () => {
    if (modalConfig.actionLink) router.push(modalConfig.actionLink);
    else setModalConfig({ ...modalConfig, isOpen: false });
  };

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return "5.0";
    const total = reviews.reduce(
      (acc, curr) => acc + Number(curr.rating || 0),
      0,
    );
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  if (accessStatus === "loading" || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white font-sans">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-[#0056D2] rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-slate-500 text-sm">
          Memuat informasi kelas...
        </p>
      </div>
    );
  }

  const finalPrice = course.totalHarga - discountAmount;

  return (
    <div className="bg-white min-h-screen font-sans text-slate-800 flex flex-col relative">
      {/* SCRIPT MIDTRANS */}
      {cms &&
        cms.metodePembayaran === "midtrans" &&
        cms.midtransClientKey &&
        cms.midtransClientKey.trim() !== "" && (
          <Script
            src={
              cms.isProduction
                ? "https://app.midtrans.com/snap/snap.js"
                : "https://app.sandbox.midtrans.com/snap/snap.js"
            }
            data-client-key={cms.midtransClientKey}
            strategy="afterInteractive"
          />
        )}

      {/* MODAL CHECKOUT & PEMBAYARAN */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300 sm:p-4">
          <div className="bg-white w-full max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-in slide-in-from-bottom-10 sm:zoom-in-95">
            <div className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto border-r border-slate-200 custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-900">
                  Selesaikan Pembayaran
                </h2>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="md:hidden w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold"
                >
                  ✕
                </button>
              </div>

              {cms?.metodePembayaran === "midtrans" ? (
                <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl">
                  <div className="w-12 h-12 bg-white rounded-xl mb-4 flex items-center justify-center shadow-sm">
                    💳
                  </div>
                  <h3 className="font-bold text-blue-900 mb-2">
                    Midtrans Gateway Active
                  </h3>
                  <p className="text-sm text-blue-700/80 leading-relaxed">
                    Anda akan diarahkan ke halaman pembayaran Midtrans yang aman
                    setelah menekan tombol konfirmasi.
                  </p>
                </div>
              ) : cms?.metodePembayaran === "qris" ? (
                <div className="space-y-5">
                  <div className="bg-purple-50 border border-purple-200 p-5 rounded-2xl text-center">
                    <h3 className="font-bold text-purple-900 mb-2">
                      Scan QRIS Berikut
                    </h3>
                    <p className="text-xs text-purple-700/80 mb-4">
                      Gunakan aplikasi M-Banking atau E-Wallet apa saja.
                    </p>
                    <img
                      src={cms.urlQris}
                      alt="QRIS"
                      className="w-48 h-48 mx-auto object-contain bg-white p-2 rounded-xl shadow-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
                  <h3 className="font-bold text-amber-900 mb-4">
                    Transfer Bank Manual
                  </h3>
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Bank Tujuan
                      </p>
                      <p className="font-black text-slate-800">
                        {cms?.manualBank || "Menunggu Setting Admin"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Nomor Rekening
                      </p>
                      <div className="flex justify-between items-center">
                        <p className="font-mono font-black text-xl text-blue-600 tracking-wider">
                          {cms?.manualRekening}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(cms?.manualRekening);
                            toast.success("Nomor rekening tersalin!");
                          }}
                          className="text-xs font-bold text-slate-400 hover:text-blue-600 border px-2 py-1 rounded bg-slate-50"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Atas Nama
                      </p>
                      <p className="font-bold text-slate-800">
                        {cms?.manualNama}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {cms?.metodePembayaran !== "midtrans" && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="font-bold text-slate-900 mb-3">
                    Upload Bukti Transfer
                  </h3>
                  {!buktiBase64 ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-[#0056D2] hover:bg-blue-50 bg-white rounded-2xl p-6 text-center cursor-pointer transition-colors"
                    >
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <svg
                        className="w-8 h-8 text-slate-400 mx-auto mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      <p className="text-sm font-bold text-[#0056D2]">
                        Klik untuk Upload Foto Struk
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Maks. 800KB (JPG, PNG)
                      </p>
                    </div>
                  ) : (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#0056D2] bg-white group">
                      <img
                        src={buktiBase64}
                        alt="Bukti Transfer"
                        className="w-full max-h-48 object-contain bg-slate-100"
                      />
                      <button
                        onClick={() => setBuktiBase64(null)}
                        className="absolute top-2 right-2 bg-rose-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="w-full md:w-[350px] bg-white p-6 md:p-8 flex flex-col shrink-0">
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="hidden md:flex self-end text-slate-400 hover:text-slate-600 font-bold text-sm mb-4"
              >
                ✕ Batal
              </button>
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">
                Ringkasan Pesanan
              </h3>
              <div className="flex gap-3 mb-6">
                <div className="w-16 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                  {course.thumbnailUrl && (
                    <img
                      src={course.thumbnailUrl}
                      className="w-full h-full object-cover"
                      alt="cover"
                    />
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug">
                    {course.judul}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase mt-0.5">
                    {course.kategori}
                  </p>
                </div>
              </div>
              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
                  Kode Voucher (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputPromo}
                    onChange={(e) => setInputPromo(e.target.value)}
                    className="flex-1 border border-slate-300 px-3 py-2 rounded-lg text-sm font-bold uppercase tracking-wider outline-none focus:border-blue-500"
                    placeholder="KODE PROMO"
                  />
                  <button
                    onClick={handleApplyPromo}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"
                  >
                    Terapkan
                  </button>
                </div>
                {discountAmount > 0 && (
                  <p className="text-xs text-emerald-600 font-bold mt-2">
                    ✓ Promo berhasil diterapkan!
                  </p>
                )}
              </div>
              <div className="space-y-3 border-t border-slate-100 pt-4 mb-6">
                <div className="flex justify-between text-sm text-slate-500 font-medium">
                  <span>Harga Normal</span>
                  <span>
                    Rp {(course.totalHarga || 0).toLocaleString("id-ID")}
                  </span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-bold">
                    <span>Potongan Promo</span>
                    <span>- Rp {discountAmount.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {course.pajak > 0 && (
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Sudah termasuk PPN {course.pajak}%</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-black text-slate-900 border-t border-slate-200 pt-3 mt-2">
                  <span>Total Bayar</span>
                  <span>Rp {finalPrice.toLocaleString("id-ID")}</span>
                </div>
              </div>
              <button
                onClick={handleSubmitCheckout}
                disabled={isProcessingCheckout}
                className="w-full mt-auto py-4 rounded-xl font-bold text-white bg-[#0056D2] hover:bg-[#00419E] shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
              >
                {isProcessingCheckout ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>{" "}
                    Memproses...
                  </>
                ) : (
                  "Konfirmasi Pembayaran"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOTIFIKASI */}
      {modalConfig.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              {modalConfig.title}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              {modalConfig.message}
            </p>
            <button
              onClick={handleModalAction}
              className="w-full py-4 rounded-xl font-bold text-sm text-white transition-all shadow-lg hover:-translate-y-0.5 bg-blue-600"
            >
              {modalConfig.actionText}
            </button>
          </div>
        </div>
      )}

      <NavbarMasterclass />

      <main className="flex-grow pt-30">
        {/* COURSERA HERO SECTION */}
        <section className="w-full bg-[#F5F7FA] overflow-hidden relative border-b border-slate-200">
          <div className="absolute top-0 right-0 w-[600px] h-full bg-gradient-to-l from-[#E8F0FE] to-transparent opacity-60 hidden lg:block pointer-events-none"></div>

          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 relative z-10 flex flex-col lg:flex-row gap-12 items-center">
            {/* Kiri: Teks & Info */}
            <div className="flex-1 w-full text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-2 text-xs font-bold text-[#0056D2] uppercase tracking-wider mb-6">
                <Link href="/masterclass" className="hover:underline">
                  Katalog
                </Link>
                <span className="text-slate-400">/</span>
                <span>{course.kategori}</span>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-[44px] font-black text-[#1F2432] leading-[1.2] mb-6">
                {course.judul}
              </h1>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0">
                {course.deskripsi?.substring(0, 180)}...
              </p>

              {mentor && (
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
                  <img
                    src={
                      mentor.fotoUrl ||
                      `https://ui-avatars.com/api/?name=${mentor.nama}`
                    }
                    alt={mentor.nama}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  <div className="text-left">
                    <p className="text-xs text-slate-500 font-medium">
                      Instruktur Utama
                    </p>
                    <p className="text-sm font-bold text-[#0056D2]">
                      {mentor.nama}
                    </p>
                  </div>
                </div>
              )}

              {/* LOGIKA TOMBOL */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                {accessStatus === "lunas_admin" ? (
                  <button
                    onClick={() =>
                      router.push(`/masterclass/${courseId}/learn`)
                    }
                    className="bg-[#1E8E3E] hover:bg-[#146C2E] text-white px-10 py-4 rounded-lg font-bold text-base transition-colors shadow-lg w-full sm:w-auto flex items-center justify-center gap-2"
                  >
                    Masuk Ruang Belajar
                  </button>
                ) : accessStatus === "belum_lunas" ? (
                  <div className="bg-[#FEF7E0] border border-[#FCE8B2] text-[#B06000] px-6 py-3.5 rounded-lg text-sm font-bold w-full sm:w-auto text-center flex items-center justify-center gap-2">
                    Menunggu Verifikasi Pembayaran
                  </div>
                ) : (
                  <button
                    onClick={handleOpenCheckout}
                    disabled={isProcessingCheckout}
                    className="bg-[#0056D2] hover:bg-[#00419E] text-white px-10 py-4 rounded-lg font-bold text-base transition-colors shadow-lg disabled:opacity-70 w-full sm:w-auto"
                  >
                    {isProcessingCheckout
                      ? "Memproses..."
                      : course.tipeHarga === "Gratis"
                        ? "Daftar Kelas Gratis"
                        : "Daftar & Bayar Sekarang"}
                  </button>
                )}
                {accessStatus !== "lunas_admin" && (
                  <div className="text-sm font-bold text-[#1F2432]">
                    {course.tipeHarga === "Gratis"
                      ? "Akses Penuh"
                      : `Rp ${(course.totalHarga || 0).toLocaleString("id-ID")}`}
                  </div>
                )}
              </div>
            </div>

            {/* Kanan: Cover Image */}
            <div className="w-full lg:w-[450px] shrink-0">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white aspect-[4/3] relative">
                {course.thumbnailUrl ? (
                  <img
                    src={course.thumbnailUrl}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium">
                    Cover Kelas
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <section className="border-b border-slate-200 bg-white sticky top-[64px] z-30 shadow-sm hidden md:block">
          <div className="max-w-[1200px] mx-auto px-4 py-4 flex justify-between divide-x divide-slate-200">
            <div className="flex-1 text-center px-4">
              <div className="flex items-center justify-center gap-1 text-lg font-black text-[#1F2432]">
                <span className="text-[#F2D049]">★</span> {averageRating}
              </div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
                ({reviews.length} Ulasan)
              </p>
            </div>
            <div className="flex-1 text-center px-4">
              <h4 className="text-lg font-black text-[#1F2432]">
                {modules.length}
              </h4>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
                Sesi Modul
              </p>
            </div>
            <div className="flex-1 text-center px-4">
              <h4 className="text-lg font-black text-[#1F2432]">Online</h4>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
                100% Fleksibel
              </p>
            </div>
            <div className="flex-1 text-center px-4">
              <h4 className="text-lg font-black text-[#1F2432]">Sertifikat</h4>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">
                Dapat Dibagikan
              </p>
            </div>
          </div>
        </section>

        {/* KONTEN UTAMA */}
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
          <section>
            <h2 className="text-2xl font-bold text-[#1F2432] mb-6">
              Tentang kelas ini
            </h2>
            <div className="prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap">
              {course.deskripsi}
            </div>
          </section>

          {/* 🔥 SILABUS ACCORDION ALAA RUANGGURU 🔥 */}
          {Object.keys(groupedModules).length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-[#1F2432] mb-6">
                Kurikulum & Silabus Kelas
              </h2>
              <div className="space-y-4">
                {Object.keys(groupedModules).map((babName, bIdx) => (
                  <div
                    key={bIdx}
                    className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm"
                  >
                    <button
                      onClick={() => toggleBab(babName)}
                      className="w-full bg-slate-50/50 hover:bg-slate-50 px-6 py-4 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-4 text-left">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${expandedBabs.includes(babName) ? "bg-[#0056D2] text-white" : "bg-blue-50 text-[#0056D2]"}`}
                        >
                          <span className="font-bold text-sm">{bIdx + 1}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-[15px] sm:text-base">
                            {babName}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                            {groupedModules[babName].length} Topik Pembahasan
                          </p>
                        </div>
                      </div>
                      <div
                        className={`text-slate-400 transition-transform duration-300 ${expandedBabs.includes(babName) ? "rotate-180" : ""}`}
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {expandedBabs.includes(babName) && (
                      <div className="divide-y divide-slate-100 border-t border-slate-100">
                        {groupedModules[babName].map((mod, _mIdx) => (
                          <div
                            key={mod.id}
                            className="p-5 flex items-start gap-4 hover:bg-slate-50/50 transition-colors pl-8 sm:pl-16"
                          >
                            <div className="mt-0.5 shrink-0">
                              {mod.tipe === "ujian" ? (
                                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100">
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
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                </div>
                              ) : mod.tipe === "pdf" ? (
                                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100">
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
                                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100">
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
                                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                    />
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2.5}
                                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-[14px] leading-snug">
                                {mod.judul}
                              </h4>
                              <div className="flex gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">
                                {mod.tipe === "ujian" ? (
                                  <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                    Durasi: {mod.durasiUjian || 15} Menit • KKM:{" "}
                                    {mod.kkm || 70}
                                  </span>
                                ) : mod.tipe === "pdf" ? (
                                  <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                    Dokumen Materi
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                    Video Pembelajaran
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {mentor && (
            <section>
              <h2 className="text-2xl font-bold text-[#1F2432] mb-6">
                Instruktur Pengajar
              </h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <img
                  src={
                    mentor.fotoUrl ||
                    `https://ui-avatars.com/api/?name=${mentor.nama}`
                  }
                  alt={mentor.nama}
                  className={`w-32 h-32 rounded-full object-cover border border-slate-200 shrink-0 ${mentor.fotoPosition || "object-center"}`}
                />
                <div>
                  <h3 className="text-xl font-bold text-[#0056D2] mb-1">
                    {mentor.nama}, {mentor.gelar}
                  </h3>
                  <p className="text-sm font-bold text-slate-800 mb-3">
                    {mentor.jabatan} di {mentor.perusahaan}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {mentor.bio}
                  </p>
                </div>
              </div>
            </section>
          )}

          {reviews.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-[#1F2432] mb-6 flex items-center gap-2">
                <span className="text-[#F2D049]">★</span> {averageRating} Ulasan
                Peserta
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reviews.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm"
                  >
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= Number(r.rating) ? "text-[#F2D049]" : "text-slate-200"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-slate-700 text-sm italic mb-4 leading-relaxed line-clamp-4">
                      &quot;{r.ulasan}&quot;
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-xs">
                        {(r.namaPeserta || "A").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#1F2432]">
                          {r.namaPeserta}
                        </p>
                        <p className="text-[10px] text-slate-500 uppercase">
                          {r.tanggal || "Alumni"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <FooterPublic />
    </div>
  );
}
