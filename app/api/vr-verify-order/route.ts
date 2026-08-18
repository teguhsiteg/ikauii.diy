import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

// ============================================================
// VERIFIKASI STATUS ORDER MIDTRANS (SERVER-SIDE, ANTI-MANIPULASI)
// Dipanggil dari dashboard peserta setelah snap.pay onSuccess.
// Aman dipanggil siapa pun: route hanya mengeset Lunas jika
// Midtrans benar-benar melaporkan settlement/capture.
// ============================================================
export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID wajib diisi" },
        { status: 400 },
      );
    }

    const firebaseDocId = orderId.split("-")[0];
    const participantRef = dbAdmin
      .collection("vr_participants")
      .doc(firebaseDocId);
    const participantSnap = await participantRef.get();

    if (!participantSnap.exists) {
      return NextResponse.json(
        { error: "Data peserta tidak ditemukan" },
        { status: 404 },
      );
    }

    const participantData = participantSnap.data()!;

    // 1. Ambil Server Key Midtrans dari settings (sama seperti vr-midtrans)
    const settingsSnap = await dbAdmin
      .collection("settings")
      .doc("virtual_run")
      .get();
    const settings = settingsSnap.exists ? settingsSnap.data() : {};
    let serverKey = settings?.midtransServerKey?.trim() || "";
    const secretsSnap = await dbAdmin.collection("secrets").doc("virtual_run").get();
    if (secretsSnap.exists && secretsSnap.data()?.midtransServerKey) {
      serverKey = String(secretsSnap.data()!.midtransServerKey).trim();
    }

    if (!serverKey) {
      return NextResponse.json(
        { error: "Server Key Midtrans belum di-setting di Admin" },
        { status: 500 },
      );
    }

    // 2. Tanya status order ke Midtrans
    const baseUrl = settings?.isProduction
      ? "https://app.midtrans.com"
      : "https://app.sandbox.midtrans.com";
    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    const midtransRes = await fetch(`${baseUrl}/v2/${orderId}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      cache: "no-store",
    });

    const midtransData = await midtransRes.json();
    const tStatus: string = midtransData.transaction_status || "";
    const fStatus: string = midtransData.fraud_status || "";

    const isLunas =
      (tStatus === "settlement" || tStatus === "capture") &&
      (fStatus === "accept" || !fStatus);

    if (!isLunas) {
      return NextResponse.json({
        success: false,
        status: tStatus || "unknown",
        message: "Pembayaran belum terverifikasi di Midtrans",
      });
    }

    // 3. Generate nomor BIB jika belum ada (konsisten dengan admin panel:
    //    max urut per kategori jarak + 1)
    let nomorBibLengkap = participantData.nomorBibLengkap || "";
    if (!nomorBibLengkap) {
      const kodeJarak = (participantData.jarak || "5").replace(/\D/g, "");
      const sameCatSnap = await dbAdmin
        .collection("vr_participants")
        .where("jarak", "==", participantData.jarak)
        .get();

      let maxUrut = 0;
      sameCatSnap.docs.forEach((doc) => {
        const nomor = (doc.data().nomorBibLengkap || "") as string;
        const urutString = nomor.slice(kodeJarak.length);
        const urut = parseInt(urutString, 10);
        if (!isNaN(urut) && urut > maxUrut) maxUrut = urut;
      });

      nomorBibLengkap = `${kodeJarak}${String(maxUrut + 1).padStart(3, "0")}`;
    }

    // 4. Update status + BIB via Admin SDK (bypass rules, satu-satunya jalur sah)
    await participantRef.update({
      statusPembayaran: "Lunas",
      waktuLunas: new Date().toISOString(),
      ...(nomorBibLengkap ? { nomorBibLengkap } : {}),
    });

    // 5. Catat log sistem
    await dbAdmin.collection("vr_logs").add({
      type: "bayar_online",
      action: `pembayaran terverifikasi otomatis via Midtrans (verify-order) untuk`,
      targetName: participantData.nama || "",
      adminEmail: "system",
      timestamp: Date.now(),
    });

    return NextResponse.json({ success: true, status: "Lunas" });
  } catch (error: any) {
    console.error("[vr-verify-order] Error:", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi pembayaran" },
      { status: 500 },
    );
  }
}
