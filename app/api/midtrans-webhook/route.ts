import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Ambil Server Key
    const docRef = doc(db, "settings", "virtual_run");
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { message: "Settings not found" },
        { status: 500 },
      );
    }

    const serverKey = docSnap.data().midtransServerKey;
    if (!serverKey) {
      return NextResponse.json(
        { message: "Server key not configured" },
        { status: 500 },
      );
    }

    // 2. Validasi Keamanan (Signature Key)
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
    } = body;

    const hash = crypto.createHash("sha512");
    hash.update(`${order_id}${status_code}${gross_amount}${serverKey}`);
    const calculatedSignature = hash.digest("hex");

    if (calculatedSignature !== signature_key) {
      return NextResponse.json(
        { message: "Invalid signature" },
        { status: 403 },
      );
    }

    // 3. Status Logic
    let statusPembayaran = "Pending";
    if (transaction_status === "capture") {
      if (fraud_status === "accept") statusPembayaran = "Lunas";
    } else if (transaction_status === "settlement") {
      statusPembayaran = "Lunas";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "expire"
    ) {
      statusPembayaran = "Dibatalkan";
    } else if (transaction_status === "pending") {
      statusPembayaran = "Pending";
    }

    // 4. POTONG ORDER ID (Contoh: ID123-TIMESTAMP -> ID123)
    const realOrderId = order_id.split("-")[0];

    // =================================================================
    // 🔥 5. SMART ROUTING: CEK TABEL OFFLINE DULU, BARU CEK VR
    // =================================================================
    let participantRef = doc(db, "offline_participants", realOrderId);
    let participantSnap = await getDoc(participantRef);
    let eventType = "offline"; // Penanda event apa

    // Jika tidak ketemu di tabel Offline, cari di tabel Virtual Run
    if (!participantSnap.exists()) {
      participantRef = doc(db, "vr_participants", realOrderId);
      participantSnap = await getDoc(participantRef);
      eventType = "virtual";
    }

    // =================================================================
    // 🔥 6. EKSEKUSI UPDATE & KIRIM EMAIL OTOMATIS
    // =================================================================
    if (participantSnap.exists()) {
      const participantData = participantSnap.data();

      // Update Firestore
      await updateDoc(participantRef, {
        statusPembayaran: statusPembayaran,
        paymentType: body.payment_type || "midtrans",
        waktuLunas:
          statusPembayaran === "Lunas" ? new Date().toISOString() : null,
      });

      console.log(
        `[Midtrans] Sukses update Peserta ${eventType.toUpperCase()} ID: ${realOrderId} -> ${statusPembayaran}`,
      );

      // TRIGGER EMAIL JIKA LUNAS
      if (statusPembayaran === "Lunas") {
        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "https://ikadiy.uii.ac.id";

        // Tentukan tipe template email berdasarkan event
        const emailType =
          eventType === "offline" ? "payment_success_offline" : "registration";

        try {
          await fetch(`${baseUrl}/api/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: emailType,
              email: participantData.email,
              nama: participantData.namaLengkap,
              detail: {
                id: realOrderId,
                totalTagihan: participantData.totalTagihan,
              },
            }),
          });
          console.log(
            `[Midtrans] E-Ticket terkirim ke ${participantData.email}`,
          );
        } catch (mailError) {
          console.error(
            `[Midtrans] Gagal kirim email ke ${participantData.email}`,
            mailError,
          );
        }
      }
    } else {
      console.log(
        `[Midtrans Error] ID: ${realOrderId} tidak ditemukan di Offline maupun VR.`,
      );
    }

    // WAJIB RETURN 200 OK KE MIDTRANS
    return NextResponse.json({ message: "OK" }, { status: 200 });
  } catch (error) {
    console.error("[Midtrans Webhook Error]", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
