import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    let serverKey = "";
    const vrSnap = await dbAdmin.collection("settings").doc("virtual_run").get();
    if (vrSnap.exists && vrSnap.data()?.midtransServerKey) {
      serverKey = vrSnap.data()?.midtransServerKey;
    } else {
      const mcSnap = await dbAdmin.collection("settings").doc("masterclass").get();
      if (mcSnap.exists && mcSnap.data()?.midtransServerKey) {
        serverKey = mcSnap.data()?.midtransServerKey;
      }
    }

    if (!serverKey) {
      return NextResponse.json(
        { message: "Server key not configured in Admin Panel" },
        { status: 500 },
      );
    }

    // 2. Validasi Keamanan (Signature Key dari Midtrans)
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
      statusPembayaran = "Batal";
    } else if (transaction_status === "pending") {
      statusPembayaran = "Pending";
    }

    // 4. POTONG ORDER ID (Contoh: ID123-TIMESTAMP -> ID123)
    // Menggunakan lastIndexOf agar aman jika original ID mengandung karakter '-'
    const lastDashIndex = order_id.lastIndexOf("-");
    const realOrderId = lastDashIndex !== -1 ? order_id.substring(0, lastDashIndex) : order_id;    // =================================================================
    // 🔥 5. OMNI-ROUTING: CARI DATA DI 3 TABEL BERBEDA
    // =================================================================
    let targetRef = dbAdmin.collection("offline_participants").doc(realOrderId);
    let targetSnap = await targetRef.get();
    let eventType = "offline";

    // Jika tidak di Offline, cari di VR
    if (!targetSnap.exists) {
      targetRef = dbAdmin.collection("vr_participants").doc(realOrderId);
      targetSnap = await targetRef.get();
      eventType = "virtual";
    }

    // Jika tidak di VR, cari di Masterclass
    if (!targetSnap.exists) {
      targetRef = dbAdmin.collection("masterclass_enrollments").doc(realOrderId);
      targetSnap = await targetRef.get();
      eventType = "masterclass";
    }

    // =================================================================
    // 🔥 6. EKSEKUSI UPDATE DATABASE BERDASARKAN EVENT
    // =================================================================
    if (targetSnap.exists) {
      const targetData = targetSnap.data();

      if (eventType === "masterclass") {
        // --- UPDATE MASTERCLASS ---
        await targetRef.update({
          statusAkses:
            statusPembayaran === "Lunas"
              ? "Lunas"
              : statusPembayaran === "Batal"
                ? "Batal"
                : "Pending",
          updatedAt: new Date().toISOString(),
        });
        console.log(
          `[Midtrans] Sukses update MASTERCLASS ID: ${realOrderId} -> ${statusPembayaran}`,
        );
      } else {
        // --- UPDATE OFFLINE RUN & VIRTUAL RUN ---
        let finalBib = targetData.nomorBIB || "";

        // 🔥 LOGIKA GENERATE NOMOR BIB OTOMATIS SAAT LUNAS (KHUSUS OFFLINE) 🔥
        if (
          eventType === "offline" &&
          statusPembayaran === "Lunas" &&
          !finalBib
        ) {
          try {
            // Menggunakan transaksi Firestore untuk mencegah Race Condition
            const counterRef = dbAdmin.collection("pengaturan").doc("counter_bib_offline");
            
            await dbAdmin.runTransaction(async (transaction) => {
              const counterSnap = await transaction.get(counterRef);
              let nomorUrutBaru = 1;
              
              if (counterSnap.exists) {
                nomorUrutBaru = (counterSnap.data()?.lastBib || 0) + 1;
              }
              
              // Ambil angka dari jarak (Cth: "10K" -> "10")
              const jarakAngka = (targetData?.jarak || "9").replace(/\D/g, "") || "9";
              finalBib = `${jarakAngka}${String(nomorUrutBaru).padStart(3, "0")}`;
              
              // Simpan lastBib baru ke counter
              transaction.set(counterRef, { lastBib: nomorUrutBaru }, { merge: true });
            });
          } catch (err) {
            console.error("[Midtrans] Gagal generate BIB via transaction:", err);
            finalBib = "TUNDA"; // Fallback jika gagal generate
          }
        }

        // Update Data ke Database Firebase
        await targetRef.update({
          statusPembayaran:
            statusPembayaran === "Batal" ? "Dibatalkan" : statusPembayaran,
          paymentType: body.payment_type || "midtrans",
          waktuLunas:
            statusPembayaran === "Lunas" ? new Date().toISOString() : null,
          ...(finalBib ? { nomorBIB: finalBib } : {}), // Simpan BIB baru jika ada
        });

        console.log(
          `[Midtrans] Sukses update ${eventType.toUpperCase()} ID: ${realOrderId} -> ${statusPembayaran} ${finalBib ? `(BIB: ${finalBib})` : ""}`,
        );

        // 🔥 TRIGGER EMAIL JIKA STATUS LUNAS 🔥
        if (statusPembayaran === "Lunas") {
          const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "https://ikadiy.uii.ac.id";
          const emailType =
            eventType === "offline"
              ? "payment_success_offline"
              : "payment_success";

          try {
            await fetch(`${baseUrl}/api/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: emailType,
                email: targetData?.email,
                nama: targetData?.namaLengkap,
                detail: {
                  id: realOrderId,
                  totalTagihan: targetData?.totalTagihan,
                  // 🔥 INJEKSI DATA UNTUK E-TICKET EMAIL 🔥
                  nik: targetData?.nik || "-",
                  jarak: targetData?.jarak || "-",
                  ukuranJersey: targetData?.ukuranJersey || "-",
                  namaBib: targetData?.namaBib || "-",
                  bib: finalBib || targetData?.nomorBIB || "-",
                },
              }),
            });
            console.log(`[Midtrans] E-Ticket terkirim ke ${targetData?.email}`);
          } catch (mailError) {
            console.error(
              `[Midtrans] Gagal kirim email E-Ticket ke ${targetData?.email}`,
              mailError,
            );
          }
        }
      }
    } else {
      console.log(
        `[Midtrans Error] ID: ${realOrderId} tidak ditemukan di tabel manapun.`,
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
