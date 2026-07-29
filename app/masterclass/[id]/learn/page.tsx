"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "@/lib/toast";
import { useParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import Link from "next/link";
import YouTube from "react-youtube"; // 🔥 TAMBAHAN: Library YouTube API

// 🔥 PERBAIKAN: Helper diubah untuk mengekstrak ID murni YouTube
const extractYouTubeId = (url: string) => {
  if (!url) return "";
  let videoId = "";
  try {
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else if (url.includes("youtube.com/watch")) {
      videoId = new URL(url).searchParams.get("v") || "";
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1]?.split("?")[0];
    }
  } catch (e) {
    return "";
  }
  return videoId;
};

export default function MasterclassLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessStatus, setAccessStatus] = useState<
    "loading" | "granted" | "denied"
  >("loading");

  const [course, setCourse] = useState<any>(null);
  const [mentor, setMentor] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [activeModule, setActiveModule] = useState<any>(null);

  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [isSavingProgress, setIsSavingProgress] = useState(false);

  // 🔥 TAMBAHAN: State untuk Anti-Skip Video
  const [isVideoFinished, setIsVideoFinished] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "downloads" | "qa">(
    "overview",
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [discussions, setDiscussions] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // 🔥 STATE UNTUK ULASAN (REVIEW) 🔥
  const [userReview, setUserReview] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // 🔥 TAMBAHAN: Reset status video tiap pindah modul
  useEffect(() => {
    setIsVideoFinished(false);
  }, [activeModule?.id]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        await checkAccessAndFetchData(user);
      } else {
        router.push(`/masterclass/${courseId}`);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      unsubscribe();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [courseId]);

  useEffect(() => {
    if (activeModule && activeTab === "qa") {
      fetchDiscussions();
    }
  }, [activeModule, activeTab]);

  const checkAccessAndFetchData = async (user: any) => {
    try {
      let hasAccess = false;
      let adminFlag = false;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const role = userDoc.exists() ? userDoc.data().role?.toLowerCase() : "";

      if (role === "admin" || role === "super_admin" || role === "superadmin") {
        hasAccess = true;
        adminFlag = true;
      } else {
        const qEnroll = query(
          collection(db, "masterclass_enrollments"),
          where("courseId", "==", courseId),
          where("uid", "==", user.uid),
          where("statusAkses", "==", "Lunas"),
        );
        const snapEnroll = await getDocs(qEnroll);
        if (!snapEnroll.empty) {
          hasAccess = true;
        }
      }

      // Bypass untuk Pengurus
      if (!adminFlag) {
        const qPengurus = query(
          collection(db, "pengurus"),
          where("email", "==", user.email),
        );
        const snapPengurus = await getDocs(qPengurus);
        if (!snapPengurus.empty) {
          hasAccess = true;
          adminFlag = true;
        }
      }

      if (!hasAccess) {
        setAccessStatus("denied");
        setTimeout(() => router.push(`/masterclass/${courseId}`), 3000);
        return;
      }
      setIsAdmin(adminFlag);

      const courseSnap = await getDoc(doc(db, "masterclass_courses", courseId));
      if (courseSnap.exists()) {
        const cData = { id: courseSnap.id, ...courseSnap.data() };
        setCourse(cData);
        if (cData.mentorId) {
          const mSnap = await getDoc(
            doc(db, "masterclass_mentors", cData.mentorId),
          );
          if (mSnap.exists()) setMentor(mSnap.data());
        }
      }

      const qModules = query(
        collection(db, "masterclass_modules"),
        where("courseId", "==", courseId),
      );
      const moduleSnaps = await getDocs(qModules);
      const fetchedModules = moduleSnaps.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a: any, b: any) => Number(a.urutan) - Number(b.urutan));
      setModules(fetchedModules);

      const progressId = `${user.uid}_${courseId}`;
      const progressSnap = await getDoc(
        doc(db, "masterclass_progress", progressId),
      );
      let completedArray: string[] = [];

      if (progressSnap.exists()) {
        completedArray = progressSnap.data().completedModules || [];
        setCompletedModules(completedArray);
      } else {
        await setDoc(doc(db, "masterclass_progress", progressId), {
          uid: user.uid,
          courseId: courseId,
          completedModules: [],
          startedAt: serverTimestamp(),
        });
      }

      if (fetchedModules.length > 0) {
        const firstUncompleted = fetchedModules.find(
          (m) => !completedArray.includes(m.id),
        );
        setActiveModule(firstUncompleted || fetchedModules[0]);
      }

      // 🔥 CEK APAKAH SUDAH PERNAH KASIH ULASAN 🔥
      const qReview = query(
        collection(db, "masterclass_reviews"),
        where("courseId", "==", courseId),
        where("uid", "==", user.uid),
      );
      const snapReview = await getDocs(qReview);
      if (!snapReview.empty) {
        setUserReview({
          id: snapReview.docs[0].id,
          ...snapReview.docs[0].data(),
        });
      }

      setAccessStatus("granted");
    } catch (error) {
      console.error("Error loading classroom:", error);
      router.push(`/masterclass/${courseId}`);
    }
  };

  const fetchDiscussions = async () => {
    if (!activeModule) return;
    try {
      const qDesc = query(
        collection(db, "masterclass_discussions"),
        where("moduleId", "==", activeModule.id),
      );
      const snap = await getDocs(qDesc);
      const fetched = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      fetched.sort(
        (a: any, b: any) =>
          (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
      );
      setDiscussions(fetched);
    } catch (error) {
      console.error("Gagal memuat diskusi:", error);
    }
  };

  const handlePostDiscussion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !activeModule) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, "masterclass_discussions"), {
        courseId: courseId,
        moduleId: activeModule.id,
        uid: currentUser.uid,
        userName: currentUser.displayName || currentUser.email.split("@")[0],
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      setNewComment("");
      fetchDiscussions();
    } catch (error) {
      toast.error("Gagal mengirim pesan.");
    } finally {
      setIsPosting(false);
    }
  };

  // 🔥 FUNGSI SUBMIT ULASAN 🔥
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    setIsSubmittingReview(true);

    try {
      if (userReview) {
        await updateDoc(doc(db, "masterclass_reviews", userReview.id), {
          rating: reviewRating,
          ulasan: reviewText,
          updatedAt: serverTimestamp(),
        });
        setUserReview({
          ...userReview,
          rating: reviewRating,
          ulasan: reviewText,
        });
      } else {
        const newRef = await addDoc(collection(db, "masterclass_reviews"), {
          courseId: courseId,
          uid: currentUser.uid,
          namaPeserta:
            currentUser.displayName || currentUser.email.split("@")[0],
          rating: reviewRating,
          ulasan: reviewText,
          status: "Tampil",
          createdAt: serverTimestamp(),
        });
        setUserReview({
          id: newRef.id,
          rating: reviewRating,
          ulasan: reviewText,
        });
      }
      setIsReviewModalOpen(false);
      toast.success("Terima kasih! Ulasan Anda berhasil disimpan.");
    } catch (err) {
      toast.error("Gagal mengirim ulasan.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleMarkCompleteAndNext = async () => {
    if (!activeModule || !currentUser) return;
    setIsSavingProgress(true);

    const isAlreadyCompleted = completedModules.includes(activeModule.id);
    const currentIndex = modules.findIndex((m) => m.id === activeModule.id);
    const hasNextModule = currentIndex < modules.length - 1;

    try {
      if (!isAlreadyCompleted) {
        const progressId = `${currentUser.uid}_${courseId}`;
        await updateDoc(doc(db, "masterclass_progress", progressId), {
          completedModules: arrayUnion(activeModule.id),
          lastUpdated: serverTimestamp(),
        });
        // Pastikan tidak ada duplikat di state lokal
        setCompletedModules((prev) =>
          prev.includes(activeModule.id) ? prev : [...prev, activeModule.id],
        );
      }

      if (hasNextModule) {
        setActiveModule(modules[currentIndex + 1]);
        setActiveTab("overview");
        document
          .querySelector("main")
          ?.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat menyimpan progres belajar Anda.");
    } finally {
      setIsSavingProgress(false);
    }
  };

  const handlePrevModule = () => {
    const currentIndex = modules.findIndex((m) => m.id === activeModule.id);
    if (currentIndex > 0) setActiveModule(modules[currentIndex - 1]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/masterclass");
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // 🔥 LOGIKA GROUPING BAB 🔥
  const groupedModules = useMemo(() => {
    const groups: Record<string, any[]> = {};
    modules.forEach((mod) => {
      const bab = mod.bab || "Materi Pembahasan";
      if (!groups[bab]) groups[bab] = [];
      groups[bab].push(mod);
    });
    return groups;
  }, [modules]);

  // 🔥 CEK ANTI SKIP 🔥
  const isModuleLocked = (index: number) => {
    if (isAdmin) return false;
    if (index === 0) return false;
    const prevModuleId = modules[index - 1].id;
    return !completedModules.includes(prevModuleId);
  };

  if (accessStatus === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-[#0056D2] rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium text-sm mt-2">
          Menyiapkan Kelas & Progres Anda...
        </p>
      </div>
    );
  }

  if (accessStatus === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Akses Terlarang
        </h2>
        <p className="text-slate-500 max-w-sm mx-auto mb-4">
          Anda belum memiliki lisensi untuk mengakses modul ini atau pembayaran
          sedang diverifikasi.
        </p>
      </div>
    );
  }

  // 🔥 PERBAIKAN LOGIKA PROGRES (MENCEGAH ERROR 150%) 🔥
  // Filter id modul yang selesai HANYA yang masih ada di database saat ini
  const validCompletedModules = completedModules.filter((id) =>
    modules.some((m) => m.id === id),
  );
  const validCompletedCount = validCompletedModules.length;

  const progressPercentage =
    modules.length > 0
      ? Math.round((validCompletedCount / modules.length) * 100)
      : 0;

  // Syarat lulus: Progres 100%
  const isCourseCompleted = progressPercentage >= 100;

  const isActiveCompleted = activeModule
    ? completedModules.includes(activeModule.id)
    : false;
  const currentIndex = modules.findIndex((m) => m.id === activeModule?.id);
  const isLastModule = currentIndex === modules.length - 1;

  // 🔥 LOGIKA BARU: MENGUNCI TOMBOL JIKA VIDEO BELUM TAMAT 🔥
  const isCurrentVideoType =
    !activeModule?.tipe || activeModule?.tipe === "video";
  const youtubeVideoId = extractYouTubeId(
    activeModule?.videoUrl || course?.urlAkses,
  );
  const isStrictLocked =
    isCurrentVideoType && !isActiveCompleted && !isVideoFinished && !isAdmin;
  const isCompleteBtnDisabled =
    isSavingProgress || (isLastModule && isActiveCompleted) || isStrictLocked;

  return (
    <div className="h-screen bg-white flex flex-col font-sans text-slate-800 overflow-hidden">
      {/* 🔥 MODAL ULASAN 🔥 */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative"
          >
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:bg-slate-100 p-2 rounded-full"
            >
              ✕
            </button>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                ⭐
              </div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                Bagaimana pengalamanmu?
              </h2>
              <p className="text-xs text-slate-500 mt-2">
                Ulasanmu membantu peserta lain memilih kelas yang tepat.
              </p>
            </div>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className={`text-4xl transition-all ${star <= reviewRating ? "text-[#F2D049] scale-110 drop-shadow-sm" : "text-slate-200 hover:text-amber-200"}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              required
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Ceritakan apa yang paling kamu sukai dari kelas ini..."
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-xl text-sm outline-none focus:bg-white focus:border-amber-400 resize-none mb-6"
            ></textarea>

            <button
              type="submit"
              disabled={isSubmittingReview || !reviewText.trim()}
              className="w-full py-3.5 bg-[#0B1120] hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              {isSubmittingReview
                ? "Menyimpan Ulasan..."
                : "Kirim Ulasan Sekarang"}
            </button>
          </form>
        </div>
      )}

      {/* HEADER */}
      <header className="h-[70px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href={`/masterclass/${courseId}`}
            className="text-slate-500 hover:text-[#0056D2] transition-colors p-2 hover:bg-slate-50 rounded-full"
            title="Kembali ke Detail Kelas"
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
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </Link>
          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm lg:text-base line-clamp-1">
              {course?.judul || "Memuat..."}
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest hidden sm:block">
              {course?.kategori}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2 border-r border-slate-200 pr-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              Progres Belajar
            </span>
            <span className="text-sm font-black text-[#0056D2]">
              {progressPercentage}% Selesai
            </span>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center gap-2 p-1 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors focus:ring-2 focus:ring-blue-100 outline-none"
            >
              <div
                className="w-8 h-8 rounded-full bg-[#0056D2] text-white flex items-center justify-center font-bold text-sm shadow-sm"
                title={currentUser?.displayName || currentUser?.email}
              >
                {(currentUser?.displayName || currentUser?.email || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform mr-1 hidden sm:block ${isProfileDropdownOpen ? "rotate-180" : ""}`}
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
            </button>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {currentUser?.displayName || "Siswa"}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {currentUser?.email}
                  </p>
                </div>
                <div className="p-2">
                  <Link
                    href="/masterclass/my-courses"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                  >
                    <svg
                      className="w-5 h-5 opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    My Courses
                  </Link>
                  <Link
                    href="/masterclass"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                  >
                    <svg
                      className="w-5 h-5 opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Katalog Utama
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mt-1"
                  >
                    <svg
                      className="w-5 h-5 opacity-70"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Keluar (Logout)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY LAYOUT */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* LAYAR UTAMA BELAJAR */}
        <main className="flex-1 flex flex-col overflow-y-auto bg-white custom-scrollbar relative">
          {/* AREA PROPORSIONAL PLAYER / MATERI (16:9) */}
          <div className="w-full bg-[#0B1120] relative shrink-0 border-b border-slate-800">
            <div className="max-w-[1000px] mx-auto w-full aspect-video bg-black relative">
              {/* 1. TAMPILAN JIKA VIDEO (Default) */}
              {(!activeModule?.tipe || activeModule?.tipe === "video") && (
                <>
                  {youtubeVideoId ? (
                    // 🔥 PERUBAHAN: MENGGUNAKAN REACT-YOUTUBE DENGAN STRICT MODE 🔥
                    <YouTube
                      videoId={youtubeVideoId}
                      opts={{
                        width: "100%",
                        height: "100%",
                        playerVars: {
                          autoplay: 0,
                          controls: 0, // Kunci progress bar
                          disablekb: 1, // Kunci keyboard skip
                          rel: 0,
                          modestbranding: 1,
                        },
                      }}
                      onEnd={() => setIsVideoFinished(true)} // Buka gembok pas video habis
                      className="w-full h-full absolute inset-0"
                      iframeClassName="w-full h-full border-0 absolute inset-0"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                      <svg
                        className="w-12 h-12 mb-3 opacity-30"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="font-bold text-sm">Video tidak tersedia</p>
                    </div>
                  )}
                </>
              )}

              {/* 2. TAMPILAN JIKA DOKUMEN PDF */}
              {activeModule?.tipe === "pdf" && (
                <div className="w-full h-full absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                  <div className="w-20 h-20 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mb-6 border border-indigo-500/30">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-white font-bold text-xl sm:text-2xl mb-2">
                    {activeModule.judul}
                  </h3>
                  <p className="text-sm max-w-md text-center mb-8">
                    Materi ini disajikan dalam format Dokumen PDF. Silakan buka
                    tautan di bawah untuk membaca atau mengunduhnya.
                  </p>
                  <a
                    href={activeModule.dokumenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30"
                  >
                    Buka Dokumen PDF
                  </a>
                </div>
              )}

              {/* 3. TAMPILAN JIKA UJIAN */}
              {activeModule?.tipe === "ujian" && (
                <div className="w-full h-full absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-slate-300 p-6 text-center">
                  <div className="w-20 h-20 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mb-4 border border-rose-500/30">
                    <svg
                      className="w-10 h-10"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                      />
                    </svg>
                  </div>
                  <h3 className="text-white font-black text-2xl sm:text-3xl mb-2">
                    {activeModule.judul}
                  </h3>
                  <p className="text-sm max-w-lg text-center mb-8">
                    Persiapkan diri Anda. Ujian ini memiliki batas waktu dan
                    nilai kelulusan minimum.
                  </p>

                  <div className="flex gap-4 sm:gap-6 mb-8">
                    <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 min-w-[100px]">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                        Durasi
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-white">
                        {activeModule.durasiUjian || 15}{" "}
                        <span className="text-xs font-medium text-slate-400">
                          Menit
                        </span>
                      </p>
                    </div>
                    <div className="bg-slate-800 px-6 py-3 rounded-xl border border-slate-700 min-w-[100px]">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                        KKM
                      </p>
                      <p className="text-xl sm:text-2xl font-black text-rose-400">
                        {activeModule.kkm || 70}{" "}
                        <span className="text-xs font-medium text-slate-400">
                          Poin
                        </span>
                      </p>
                    </div>
                  </div>

                  {completedModules.includes(activeModule.id) ? (
                    <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
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
                      Anda Sudah Lulus Ujian Ini
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        router.push(
                          `/masterclass/${courseId}/exam/${activeModule.id}`,
                        )
                      }
                      className="bg-rose-600 hover:bg-rose-500 text-white px-8 sm:px-10 py-4 rounded-xl font-black text-lg transition-all shadow-lg shadow-rose-600/20"
                    >
                      MULAI UJIAN SEKARANG
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="max-w-[1000px] w-full mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-[#1F2432] leading-tight flex-1">
                {activeModule?.urutan}. {activeModule?.judul || course?.judul}
              </h2>

              <div className="flex items-center gap-3 shrink-0 w-full md:w-auto">
                <button
                  onClick={handlePrevModule}
                  disabled={currentIndex === 0 || isSavingProgress}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-30 transition-colors"
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
                      strokeWidth={2.5}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Sebelumnya
                </button>

                {/* 🔥 PERBAIKAN: TOMBOL SELESAI DENGAN LOGIKA STRICT ANTI SKIP 🔥 */}
                {activeModule?.tipe !== "ujian" && (
                  <button
                    onClick={handleMarkCompleteAndNext}
                    disabled={isCompleteBtnDisabled}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all shadow-sm ${
                      isActiveCompleted
                        ? "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                        : isStrictLocked
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed opacity-80"
                          : "bg-[#0056D2] hover:bg-[#00419E] text-white border border-[#0056D2]"
                    }`}
                  >
                    {isSavingProgress ? (
                      <svg
                        className="w-4 h-4 animate-spin"
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
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                    ) : isActiveCompleted ? (
                      isLastModule ? (
                        "Modul Selesai"
                      ) : (
                        "Selanjutnya"
                      )
                    ) : isStrictLocked ? (
                      <>Tonton Video Sampai Habis 🔒</>
                    ) : (
                      <>
                        Tandai Selesai & Lanjut{" "}
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
                            d="M9 5l7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-8 border-b border-slate-200 overflow-x-auto no-scrollbar mb-8">
              <button
                onClick={() => setActiveTab("overview")}
                className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === "overview" ? "border-[#0056D2] text-[#0056D2]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Ikhtisar Pelajaran
              </button>
              <button
                onClick={() => setActiveTab("downloads")}
                className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === "downloads" ? "border-[#0056D2] text-[#0056D2]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Materi Unduhan{" "}
                {activeModule?.dokumenUrl && (
                  <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                    1
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("qa")}
                className={`pb-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === "qa" ? "border-[#0056D2] text-[#0056D2]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
              >
                Diskusi & Q&A
              </button>
            </div>

            <div className="min-h-[300px]">
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <div className="prose prose-slate max-w-none text-slate-700 text-base leading-relaxed whitespace-pre-wrap">
                    {activeModule?.deskripsi ||
                      "Tidak ada deskripsi spesifik untuk sesi ini."}
                  </div>
                  {mentor && (
                    <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center gap-6">
                      <img
                        src={mentor.fotoUrl}
                        alt={mentor.nama}
                        className="w-16 h-16 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">
                          Instruktur Pengajar
                        </p>
                        <h3 className="font-bold text-lg text-[#1F2432]">
                          {mentor.nama}, {mentor.gelar}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {mentor.jabatan} di {mentor.perusahaan}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "downloads" && (
                <div>
                  {activeModule?.dokumenUrl ? (
                    <div className="p-5 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white shadow-sm gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-[#0056D2] rounded-xl flex items-center justify-center border border-blue-100 shrink-0">
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
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-base text-slate-800">
                            Modul Pendukung Sesi {activeModule?.urutan}
                          </p>
                          <p className="text-[11px] text-slate-500 uppercase tracking-widest mt-0.5">
                            Format: PDF Document
                          </p>
                        </div>
                      </div>
                      <a
                        href={activeModule.dokumenUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-white border border-[#0056D2] text-[#0056D2] hover:bg-blue-50 px-6 py-2.5 rounded-lg text-sm font-bold transition-colors w-full sm:w-auto text-center"
                      >
                        Unduh Berkas
                      </a>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-sm text-slate-500">
                        Tidak ada berkas materi yang dilampirkan pada modul ini.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "qa" && (
                <div className="space-y-8">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <form onSubmit={handlePostDiscussion}>
                      <textarea
                        rows={3}
                        placeholder="Ada pertanyaan atau diskusi mengenai materi ini? Tulis di sini..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl focus:border-[#0056D2] outline-none text-sm resize-none mb-3"
                        required
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Komentar Publik
                        </p>
                        <button
                          type="submit"
                          disabled={isPosting || !newComment.trim()}
                          className="bg-[#0056D2] hover:bg-[#00419E] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                        >
                          {isPosting ? "Mengirim..." : "Kirim Diskusi"}
                        </button>
                      </div>
                    </form>
                  </div>
                  <div className="space-y-5">
                    {discussions.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-sm text-slate-500 font-medium">
                          Belum ada diskusi di sesi ini.
                          <br />
                          Jadilah yang pertama untuk bertanya!
                        </p>
                      </div>
                    ) : (
                      discussions.map((diskusi) => (
                        <div
                          key={diskusi.id}
                          className="flex gap-4 pb-5 border-b border-slate-100 last:border-0 last:pb-0"
                        >
                          <div className="w-10 h-10 bg-blue-100 text-[#0056D2] rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                            {(diskusi.userName || "U").charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-slate-800 text-sm">
                                {diskusi.userName}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-medium">
                                {diskusi.createdAt?.seconds
                                  ? new Date(
                                      diskusi.createdAt.seconds * 1000,
                                    ).toLocaleDateString("id-ID", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "Baru saja"}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                              {diskusi.text}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <footer className="mt-16 pt-6 border-t border-slate-200 text-center pb-8">
              <p className="text-xs text-slate-400">
                © {new Date().getFullYear()} DPW IKA UII. Masterclass Learning
                System.
              </p>
            </footer>
          </div>
        </main>

        {/* KANAN: SIDEBAR PLAYLIST */}
        {isSidebarOpen && (
          <aside className="w-full lg:w-[350px] xl:w-[400px] bg-white border-l border-slate-200 flex flex-col shrink-0 z-10">
            <div className="p-6 border-b border-slate-100 bg-[#F8FAFC]">
              <h3 className="font-bold text-slate-900 text-lg mb-4">
                Isi Kursus
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>
                    {validCompletedCount} dari {modules.length} Selesai
                  </span>
                  <span className="text-[#0056D2]">{progressPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0056D2] transition-all duration-500"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {modules.length === 0 ? (
                <div className="text-center p-8 text-sm text-slate-500">
                  Belum ada daftar modul.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {/* GROUPING BAB DI SIDEBAR */}
                  {Object.keys(groupedModules).map((babName, bIdx) => (
                    <div key={bIdx}>
                      <div className="bg-slate-50 px-5 py-3 border-b border-slate-100/50 sticky top-0 z-10">
                        <h3 className="text-xs font-black text-slate-800 uppercase">
                          {babName}
                        </h3>
                      </div>
                      <div className="divide-y divide-slate-50">
                        {groupedModules[babName].map((mod) => {
                          const globalIndex = modules.findIndex(
                            (m) => m.id === mod.id,
                          );
                          const isLocked = isModuleLocked(globalIndex);
                          const isCompleted = completedModules.includes(mod.id);
                          const isActive = activeModule?.id === mod.id;

                          return (
                            <button
                              key={mod.id}
                              disabled={isLocked && !isAdmin}
                              onClick={() => setActiveModule(mod)}
                              className={`w-full text-left px-5 py-4 flex items-start gap-4 transition-colors ${isActive ? "bg-[#E8F0FE] relative" : "hover:bg-slate-50 bg-white"} ${isLocked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#0056D2]"></div>
                              )}

                              <div className="mt-0.5 shrink-0">
                                {isLocked ? (
                                  <div className="w-5 h-5 rounded bg-slate-200 flex items-center justify-center text-slate-400">
                                    <svg
                                      className="w-3 h-3"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                      />
                                    </svg>
                                  </div>
                                ) : isCompleted ? (
                                  <div className="w-5 h-5 rounded bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <svg
                                      className="w-3.5 h-3.5"
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
                                ) : isActive ? (
                                  <span className="flex w-5 h-5 items-center justify-center rounded-full border-2 border-[#0056D2] text-[#0056D2]">
                                    <div className="w-2 h-2 rounded-full bg-[#0056D2] animate-pulse"></div>
                                  </span>
                                ) : (
                                  <div className="w-5 h-5 rounded border-2 border-slate-300"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4
                                  className={`text-sm font-bold line-clamp-2 leading-snug ${isActive ? "text-[#0056D2]" : "text-slate-700"}`}
                                >
                                  {mod.urutan}. {mod.judul}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-2 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                  {mod.tipe === "ujian" ? (
                                    <span className="text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">
                                      📝 Ujian
                                    </span>
                                  ) : mod.tipe === "pdf" ? (
                                    <span className="text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                                      📄 PDF
                                    </span>
                                  ) : (
                                    <span className="text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                      ▶️ Video
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-200 shrink-0 space-y-4">
              {/* TOMBOL BERI ULASAN */}
              <button
                onClick={() => {
                  if (userReview) {
                    setReviewRating(userReview.rating);
                    setReviewText(userReview.ulasan);
                  }
                  setIsReviewModalOpen(true);
                }}
                className="w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 border-2 border-amber-200 text-amber-700 hover:bg-amber-50 shadow-sm"
              >
                <span className="text-amber-500 text-base leading-none">★</span>
                {userReview ? "Edit Ulasan Anda" : "Beri Ulasan Kelas Ini"}
              </button>

              <div
                className={`p-4 rounded-xl border transition-all ${isCourseCompleted ? "bg-emerald-50 border-emerald-200 shadow-sm" : "bg-slate-50 border-slate-200"}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCourseCompleted ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"}`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.441A11.026 11.026 0 0010 3c1.32 0 2.583.232 3.733.641.34.12.5.5.385.836l-1.372 4.116a2.001 2.001 0 01-1.258 1.258l-4.116 1.372a.5.5 0 01-.641-.385A11.026 11.026 0 013 10c0-1.32.232-2.583.641-3.733.12-.34.5-.5.836-.385l4.116 1.372a2.001 2.001 0 011.258-1.258l1.372-4.116a.5.5 0 01.385-.641z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      E-Certificate
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {isCourseCompleted
                        ? "Siap diunduh sekarang"
                        : "Selesaikan semua modul"}
                    </p>
                  </div>
                </div>
                <button
                  disabled={!isCourseCompleted}
                  onClick={() =>
                    router.push(`/masterclass/${courseId}/certificate`)
                  }
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${isCourseCompleted ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                >
                  {isCourseCompleted ? (
                    <>
                      Klaim Sertifikat{" "}
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </>
                  ) : (
                    "Terkunci"
                  )}
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
