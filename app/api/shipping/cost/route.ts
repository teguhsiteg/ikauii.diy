import { NextResponse } from "next/server";
import { getRpxConfig, getToken, getRates } from "@/lib/rpx";

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

    const settings = await getRpxConfig();
    
    // Jika RPX tidak aktif, kembalikan flat rate (karena rpxHelper melemparkan konfigurasi Firestore)
    if (!settings.isActive) {
      // Kita butuh baca firestore aslinya jika butuh flat rate, 
      // tetapi untuk simplicity mari import dbAdmin dan baca config original
      const { dbAdmin } = await import("@/lib/firebase-admin");
      const settingsSnap = await dbAdmin.collection("settings").doc("virtual_run").get();
      const rawSettings = settingsSnap.data() || {};
      
      return NextResponse.json({ 
        success: true, 
        cost: Number(rawSettings.ongkirFlat || 0),
        method: "FLAT"
      });
    }

    // Jika RPX Aktif, hitung rate
    const originZip = settings.originZip;
    const accountNumber = settings.accountNumber;
    const finalWeight = weight > 0 ? weight : settings.defaultWeight;
    
    // Map common "REG" to RPX's "RGP"
    let service = serviceType || settings.defaultService || "RGP";
    if (service.toUpperCase() === "REG") {
      service = "RGP";
    }

    if (!originZip || !accountNumber || !settings.username || !settings.password) {
        return NextResponse.json(
          { error: "Pengaturan RPX (Kode Pos, Akun, Username/Password) belum lengkap di Admin." },
          { status: 500 }
        );
    }

    // Hit API RPX V3
    try {
      // 1. Dapatkan Token
      const token = await getToken(settings.username, settings.password);

      // 2. Hitung Ongkir (Kosongkan service agar mengembalikan SEMUA layanan yang tersedia)
      const payload = {
        origin: originZip,
        destination: destinationZip,
        weight: String(finalWeight),
        accountnumber: accountNumber,
        actual_discount: "",
        service: ""
      };

      const ratesData = await getRates(token, payload);
      const rates = ratesData.data;

      if (!rates || rates.length === 0) {
          return NextResponse.json({ error: "Layanan ekspedisi RPX tidak tersedia untuk kecamatan/kode pos tujuan ini." }, { status: 400 });
      }

      // 3. Prioritaskan RGP (Reguler). Jika tidak ada, ambil tarif yang paling murah (Economy/dll)
      let selectedRate = rates.find((r: any) => r.serviceID === "RGP");
      if (!selectedRate) {
        // Jika RGP tidak ada, urutkan berdasarkan harga termurah
        rates.sort((a: any, b: any) => (a.actualRate || a.publisRate || 0) - (b.actualRate || b.publisRate || 0));
        selectedRate = rates[0];
      }

      const cost = Number(selectedRate.actualRate || selectedRate.publisRate || 0) || 0;

      return NextResponse.json({
          success: true,
          cost: cost,
          method: "RPX",
          service: selectedRate.serviceDesc || selectedRate.serviceID || "RPX Regular"
      });

    } catch (rpxError: any) {
      console.error("RPX API V3 Error:", rpxError.message);
      return NextResponse.json({ 
          error: rpxError.message || "Gagal mendapatkan tarif dari RPX."
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("Shipping Cost API Error:", error);
    return NextResponse.json({ error: "Gagal memproses perhitungan ongkos kirim." }, { status: 500 });
  }
}
