import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { enrollmentId, customerName, customerEmail } = body;

    if (!enrollmentId) {
      return NextResponse.json(
        { error: "ID enrollment wajib diisi" },
        { status: 400 },
      );
    }

    // 🔒 AMBIL HARGA ASLI DARI DATABASE (Anti-Manipulasi)
    const enrollmentRef = dbAdmin.collection("masterclass_enrollments").doc(enrollmentId);
    const enrollmentSnap = await enrollmentRef.get();

    if (!enrollmentSnap.exists) {
      return NextResponse.json(
        { error: "Data enrollment tidak ditemukan" },
        { status: 404 },
      );
    }

    const enrollmentData = enrollmentSnap.data() || {};
    const actualAmount = enrollmentData.totalTagihan || enrollmentData.harga;

    if (!actualAmount || actualAmount <= 0) {
      return NextResponse.json(
        { error: "Nominal tagihan tidak valid" },
        { status: 400 },
      );
    }

    // 1. Ambil Settingan Midtrans dari laci Kasir Masterclass
    const settingsRef = dbAdmin.collection("settings").doc("masterclass");
    const settingsSnap = await settingsRef.get();

    if (!settingsSnap.exists) {
      return NextResponse.json(
        { error: "Pengaturan Midtrans Masterclass tidak ditemukan" },
        { status: 500 },
      );
    }

    const settings = settingsSnap.data() || {};
    let serverKey = settings.midtransServerKey?.trim() || "";
    const secretsSnap = await dbAdmin.collection("secrets").doc("masterclass").get();
    if (secretsSnap.exists && secretsSnap.data()?.midtransServerKey) {
      serverKey = String(secretsSnap.data()!.midtransServerKey).trim();
    }
    const isProduction = settings.isProduction || false;

    if (!serverKey) {
      return NextResponse.json(
        { error: "Server Key Midtrans belum di-setting di Admin" },
        { status: 500 },
      );
    }

    // 2. Tentukan URL API Midtrans (Live atau Sandbox)
    const apiUrl = isProduction
      ? "https://app.midtrans.com/snap/v1/transactions"
      : "https://app.sandbox.midtrans.com/snap/v1/transactions";

    // 3. Susun Payload (Tambahkan timestamp di order_id agar selalu unik di mata Midtrans)
    const orderId = `${enrollmentId}-${Date.now()}`;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Math.round(Number(actualAmount)),
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail,
      },
    };

    // 4. Ubah Server Key jadi Base64
    const authString = Buffer.from(`${serverKey}:`).toString("base64");

    // 5. Tembak ke API Midtrans
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      // (Opsional) Simpan token ke Firebase agar terekam
      await dbAdmin.collection("masterclass_enrollments").doc(enrollmentId).update({
        snapToken: data.token,
      });

      return NextResponse.json({ token: data.token });
    } else {
      console.error("Midtrans Error Detail:", data);
      return NextResponse.json(
        { error: "Gagal mendapatkan token Midtrans", details: data },
        { status: response.status },
      );
    }
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Gagal memproses transaksi Midtrans" }, { status: 500 });
  }
}
