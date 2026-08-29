import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destinationZip, weight = 1, serviceType } = body;

    if (!destinationZip) {
      return NextResponse.json(
        { error: "Kode Pos Tujuan (Destination Zip) wajib diisi" },
        { status: 400 }
      );
    }

    const settingsRef = dbAdmin.collection("settings").doc("virtual_run");
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      return NextResponse.json(
        { error: "Pengaturan sistem tidak ditemukan" },
        { status: 500 }
      );
    }

    const settings = settingsSnap.data() || {};
    
    // Jika RPX tidak aktif, kembalikan flat rate
    if (!settings.isRpxActive) {
      return NextResponse.json({ 
        success: true, 
        cost: Number(settings.ongkirFlat || 0),
        method: "FLAT"
      });
    }

    // Jika RPX Aktif, hitung rate
    const originZip = settings.rpxOriginZip;
    const accountNumber = settings.rpxAccountNumber;
    const defaultWeight = settings.rpxDefaultWeight || 1;
    const finalWeight = weight > 0 ? weight : defaultWeight;
    const service = serviceType || settings.rpxDefaultService || "PSN";

    if (!originZip || !accountNumber) {
        return NextResponse.json(
          { error: "Pengaturan RPX (Kode Pos Asal atau Nomor Akun) belum lengkap di Admin." },
          { status: 500 }
        );
    }

    // Hit API RPX
    // Catatan: Endpoint API RPX mungkin berbeda antara UAT dan Production.
    // Sesuaikan Base URL dan metode (GET/POST) sesuai instruksi teknis dari RPX.
    const rpxApiUrl = "https://api.rpx.co.id/api/get_rate";
    
    // Susun Parameter
    const queryParams = new URLSearchParams({
      origin: originZip,
      destination: destinationZip,
      service_type: service,
      weight: String(finalWeight),
      accountnumber: accountNumber,
      format: "json"
    });

    const response = await fetch(`${rpxApiUrl}?${queryParams.toString()}`, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      }
    });

    // Handle non-JSON responses from RPX gracefully (sometimes APIs return HTML on error)
    const textData = await response.text();
    let data;
    try {
      data = JSON.parse(textData);
    } catch(e) {
      console.error("Non-JSON response from RPX:", textData);
      return NextResponse.json({ error: "Terjadi kesalahan pada server ekspedisi." }, { status: 500 });
    }

    if (!response.ok || data.err) {
       console.error("RPX API Error:", data);
       return NextResponse.json({ 
           error: data.msg || "Gagal mendapatkan tarif dari RPX.",
           details: data 
       }, { status: 400 });
    }

    // Ambil harga dari response RPX
    // Sesuai dokumentasi RPX: data: [{ price: 25000, ... }]
    const rates = data.data;
    if (!rates || rates.length === 0) {
        return NextResponse.json({ error: "Layanan tidak tersedia untuk rute ini." }, { status: 400 });
    }

    // Ambil rate pertama (atau sesuaikan logika pemilihan harga)
    const cost = Number(rates[0].price);

    return NextResponse.json({
        success: true,
        cost: cost,
        method: "RPX",
        service: rates[0].serviceDesc || service
    });

  } catch (error: any) {
    console.error("Shipping Cost API Error:", error);
    return NextResponse.json({ error: "Gagal memproses perhitungan ongkos kirim." }, { status: 500 });
  }
}
