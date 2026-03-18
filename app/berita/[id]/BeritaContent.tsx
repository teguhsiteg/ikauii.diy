"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
export const dynamic = "force-static";

export default function DetailBeritaPage() {
  const { id } = useParams(); // Mengambil ID dari URL
  const router = useRouter();
  const [berita, setBerita] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetailBerita = async () => {
      try {
        const docRef = doc(db, "berita", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setBerita({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Jika berita tidak ditemukan (dihapus/URL salah), kembalikan ke beranda
          router.push("/");
        }
      } catch (error) {
        console.error("Gagal mengambil detail berita:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchDetailBerita();
    }
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-blue-900 border-t-yellow-500 rounded-full animate-spin mb-4"></div>
        <p className="text-blue-900 font-bold">Memuat Berita...</p>
      </div>
    );
  }

  if (!berita) return null; // Handle jika data kosong saat redirect

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header Kosong Kecil (Hanya untuk navigasi kembali) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link
            href="/#berita"
            className="text-sm font-bold text-slate-500 hover:text-blue-900 transition-colors flex items-center gap-2 w-fit"
          >
            <span>&larr;</span> Kembali ke Beranda
          </Link>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Kepala Berita (Header) */}
        <div className="mb-10 text-center">
          <div className="flex justify-center gap-3 mb-6">
            <span className="bg-yellow-500 text-blue-950 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {berita.kategori}
            </span>
            <span className="bg-blue-100 text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              {berita.bidang}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-950 mb-6 leading-tight">
            {berita.judul}
          </h1>
          <p className="text-slate-500 font-medium">
            Diterbitkan:{" "}
            {new Date(berita.createdAt).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <p className="text-blue-900 font-bold mt-1">
            Oleh: {berita.koordinator || "Tim Publikasi IKA UII"}
          </p>
        </div>

        {/* Gambar Utama (Cover) */}
        <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl mb-12 bg-slate-200">
          <img
            src={berita.imgUrl}
            alt={berita.judul}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Isi Berita */}
        <article className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="prose prose-lg md:prose-xl prose-slate max-w-none">
            {/* Karena textarea menyimpan format baris baru (newline) sebagai \n,
              kita gunakan teknik whitespace-pre-wrap agar paragrafnya turun dengan benar
            */}
            <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
              {berita.isi}
            </p>
          </div>
        </article>
      </main>
    </div>
  );
}
