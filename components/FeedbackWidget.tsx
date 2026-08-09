"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false); // 🔥 State untuk sembunyikan tombol utama

  if (pathname !== "/") return null;

  // Form State
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [nama, setNama] = useState("");
  const [asal, setAsal] = useState("");
  const [ulasan, setUlasan] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "feedbacks"), {
        nama,
        asal,
        ulasan,
        rating,
        status: "Pending",
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);

      // Sembunyikan tombol utama setelah 2 detik sukses
      setTimeout(() => {
        setIsOpen(false);
        setIsSuccess(false);
        setIsHidden(true); // 🔥 Tombol utama sembunyi
        // Reset Form
        setRating(0);
        setNama("");
        setAsal("");
        setUlasan("");
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed top-1/2 -translate-y-1/2 right-0 flex items-center z-50">
      {/* 1. MODAL FORM */}
      {isOpen && (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-l-3xl w-[320px] sm:w-[380px] shadow-2xl p-6 relative ml-[-10px] animate-in slide-in-from-right duration-300">
          <button
            onClick={() => !isSubmitting && setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
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

          {isSuccess ? (
            <div className="py-8 text-center flex flex-col items-center animate-in zoom-in">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6"
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
              <h3 className="text-lg font-black text-blue-950">
                Terima Kasih!
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ulasan berhasil terkirim.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="text-lg font-black text-blue-950">
                  Beri Rating
                </h3>
                <div className="flex justify-center gap-1 mt-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredStar(star)}
                      onMouseLeave={() => setHoveredStar(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <svg
                        className={`w-8 h-8 ${star <= (hoveredStar || rating) ? "text-[#FFD700]" : "text-slate-200"}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Nama"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-[#00457C]"
                />
                <input
                  required
                  value={asal}
                  onChange={(e) => setAsal(e.target.value)}
                  placeholder="Fakultas"
                  className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-[#00457C]"
                />
              </div>

              <textarea
                required
                rows={3}
                value={ulasan}
                onChange={(e) => setUlasan(e.target.value)}
                placeholder="Masukan Anda..."
                className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs outline-none focus:border-[#00457C] resize-none"
              />

              <button
                disabled={isSubmitting}
                className="w-full bg-[#00457C] text-white font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? "Mengirim..." : "Kirim Masukan"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* 2. TOMBOL UTAMA (Akan disembunyikan jika isHidden === true) */}
      {!isHidden ? (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#00457C] text-white font-bold p-2.5 rounded-l-xl shadow-lg transition-all hover:bg-[#003661] hover:-translate-x-1"
        >
          <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] tracking-widest uppercase flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-[#FFD700]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            Beri Ulasan
          </span>
        </button>
      ) : (
        /* 🔥 3. TOMBOL PULIHKAN (Tampil hanya jika tombol utama sembunyi) 🔥 */
        <button
          onClick={() => setIsHidden(false)}
          title="Tampilkan tombol ulasan"
          className="bg-white/90 backdrop-blur border border-slate-200 text-[#00457C] p-2 rounded-l-lg shadow-md transition-all hover:bg-white hover:-translate-x-1 group animate-in slide-in-from-right"
        >
          <div className="flex flex-col items-center gap-1">
            {/* Ikon panah kecil untuk memicu munculnya lagi */}
            <svg
              className="w-4 h-4 text-slate-400 group-hover:text-[#00457C]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <svg
              className="w-4 h-4 text-[#FFD700]"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </div>
        </button>
      )}
    </div>
  );
}
