import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

// Endpoint API Publik untuk ditarik oleh Google Sheets / Layanan Eksternal.
// Digunakan dengan ?key=ikauii2026 sebagai pengaman sederhana.

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}

async function handleRequest(request: Request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    
    // Pengaman sederhana
    if (key !== "ikauii2026") {
      return NextResponse.json({ error: "Unauthorized. Kunci akses salah." }, { status: 401 });
    }

    const snapshot = await dbAdmin.collection("vr_participants").orderBy("waktuDaftar", "asc").get();
    
    const rows = snapshot.docs.map((doc, index) => {
      const data = doc.data();
      return {
        no_urut: index + 1,
        id: doc.id,
        no_pendaftaran: data.nomorBibLengkap || "Belum Ada",
        nama_lengkap: data.nama || "-",
        email: data.email || "-",
        whatsapp: data.whatsapp ? `'${data.whatsapp}` : "-",
        tipe_peserta: data.tipePeserta === "umum" ? "Umum" : "Alumni",
        fakultas: data.fakultas || "-",
        angkatan: data.angkatan || "-",
        kategori: data.jarak || "-",
        paket: data.paket?.toUpperCase() || "-",
        ukuran_jersey: data.paket === "basic" ? "-" : (data.ukuranJersey || "-"),
        status_bayar: data.statusPembayaran || "Pending",
        alamat: data.paket === "basic" ? "Tanpa Pengiriman" : data.alamat || "-",
        resi: data.resiPengiriman || "-"
      };
    });

    return NextResponse.json({
      success: true,
      total: rows.length,
      rows: rows
    });

  } catch (error: any) {
    console.error("Export API Error:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}
