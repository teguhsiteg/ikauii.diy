import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "check_nik") {
      const { nik } = body;
      if (!nik || nik.length < 10) {
        return NextResponse.json({ error: "NIK tidak valid" }, { status: 400 });
      }

      // Query ke database menggunakan Firebase Admin (melewati Rules)
      const snapshot = await dbAdmin
        .collection("offline_participants")
        .where("nik", "==", nik)
        .limit(1)
        .get();

      // HANYA KEMBALIKAN STATUS BOOLEAN. 
      // JANGAN PERNAH MENGEMBALIKAN DATA PII (Nama, Alamat, dll).
      if (!snapshot.empty) {
        // Ambil nama disamarkan untuk memberikan sapaan tanpa membocorkan data utuh
        const data = snapshot.docs[0].data();
        const namaAsli = data.namaLengkap || "Peserta";
        // Samarkan nama: "Budi Santoso" -> "B*** S******"
        const namaDisamarkan = namaAsli
          .split(" ")
          .map((kata: string) => 
            kata.length > 1 ? kata.charAt(0) + "*".repeat(kata.length - 1) : kata
          )
          .join(" ");

        return NextResponse.json({
          exists: true,
          message: `NIK sudah terdaftar atas nama ${namaDisamarkan}.`,
        });
      }

      return NextResponse.json({ exists: false });
    }

    if (action === "check_quota") {
      const { paketId } = body;
      if (!paketId) {
        return NextResponse.json({ error: "Paket ID wajib diisi" }, { status: 400 });
      }

      // Hitung total peserta yang lunas untuk paket ini (Early Bird Check)
      const snapshotEBLunas = await dbAdmin
        .collection("offline_participants")
        .where("paketId", "==", paketId)
        .where("statusPembayaran", "==", "Lunas")
        .count()
        .get();

      // Hitung total peserta terdaftar untuk paket ini (termasuk Pending) untuk Quota Check
      const snapshotTotal = await dbAdmin
        .collection("offline_participants")
        .where("paketId", "==", paketId)
        .count()
        .get();

      return NextResponse.json({
        terisi: snapshotTotal.data().count,
        terisiEB: snapshotEBLunas.data().count,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("API Validator Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
