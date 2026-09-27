import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

// Rate limiter: Max 20 pencarian per menit per IP
const searchLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 20 });

export async function POST(request: Request) {
  try {
    const rl = searchLimiter(request);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak pencarian. Harap tunggu beberapa saat." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const namaQuery = (body.nama || body.query || "").trim().toLowerCase();

    if (!namaQuery || namaQuery.length < 2) {
      return NextResponse.json(
        { error: "Masukkan minimal 2 huruf nama untuk mencari data." },
        { status: 400 }
      );
    }

    const results: Array<{
      id: string;
      nama: string;
      jenisKelamin: string;
      kategori: string;
      event: string;
    }> = [];

    // 1. CARI DI OFFLINE INDIVIDU
    const offlineSnap = await dbAdmin.collection("offline_participants").get();
    offlineSnap.docs.forEach((doc) => {
      const data = doc.data();
      const nama = data.namaLengkap || data.nama || "";
      if (nama.toLowerCase().includes(namaQuery)) {
        results.push({
          id: doc.id,
          nama: nama,
          jenisKelamin: data.jenisKelamin || "Laki-laki",
          kategori: data.jarak || data.kategori || "5K",
          event: "Offline Run",
        });
      }
    });

    // 2. CARI DI OFFLINE KOMUNITAS
    const komSnap = await dbAdmin.collection("pendaftaran_komunitas").get();
    komSnap.docs.forEach((doc) => {
      const data = doc.data();
      const members: any[] = data.participants || [];
      members.forEach((m: any, idx: number) => {
        const mNama = m.namaLengkap || m.nama || "";
        if (mNama.toLowerCase().includes(namaQuery)) {
          results.push({
            id: `${doc.id}-${idx}`,
            nama: mNama,
            jenisKelamin: m.jenisKelamin || m.gender || "Laki-laki",
            kategori: m.kategori || m.jarak || "5K",
            event: "Offline Komunitas",
          });
        }
      });
    });

    // 3. CARI DI VIRTUAL RUN
    const vrSnap = await dbAdmin.collection("vr_participants").get();
    vrSnap.docs.forEach((doc) => {
      const data = doc.data();
      const nama = data.nama || data.namaLengkap || "";
      if (nama.toLowerCase().includes(namaQuery)) {
        results.push({
          id: doc.id,
          nama: nama,
          jenisKelamin: data.gender || data.jenisKelamin || "Laki-laki",
          kategori: data.jarak || "Virtual Run",
          event: "Virtual Run",
        });
      }
    });

    // Batasi maksimal 50 hasil pencarian
    const limitedResults = results.slice(0, 50);

    return NextResponse.json({
      success: true,
      totalFound: results.length,
      data: limitedResults,
    });
  } catch (error: any) {
    console.error("Error in cari peserta API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal saat mencari data." },
      { status: 500 }
    );
  }
}
