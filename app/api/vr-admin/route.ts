import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { verifyVrAdmin } from "@/lib/vr-admin-auth";

// ============================================================
// ROUTE ADMIN VR (SERVER-SIDE) — Semua aksi tulis admin dipindah
// ke sini supaya Firestore rules bisa mengunci client.
// Autentikasi: Firebase ID Token (Bearer) + role admin
// (lihat lib/vr-admin-auth.ts — mendukung admin/super_admin/superadmin).
// ============================================================

type AdminAction =
  | "update-status" // { id, status }
  | "update-resi" // { id, resi }
  | "update-jarak"; // { id, jarak }

async function generateBibNumber(jarak: string): Promise<string> {
  const kodeJarak = (jarak || "5").replace(/\D/g, "");
  const sameCatSnap = await dbAdmin
    .collection("vr_participants")
    .where("jarak", "==", jarak)
    .get();

  let maxUrut = 0;
  sameCatSnap.docs.forEach((doc) => {
    const nomor = (doc.data().nomorBibLengkap || "") as string;
    const urutString = nomor.slice(kodeJarak.length);
    const urut = parseInt(urutString, 10);
    if (!isNaN(urut) && urut > maxUrut) maxUrut = urut;
  });

  return `${kodeJarak}${String(maxUrut + 1).padStart(3, "0")}`;
}

export async function POST(request: Request) {
  try {
    const admin = await verifyVrAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized: hanya admin yang bisa melakukan aksi ini" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const action: AdminAction = body.action;
    const id: string = body.id;

    if (!action || !id) {
      return NextResponse.json(
        { error: "action dan id wajib diisi" },
        { status: 400 },
      );
    }

    const participantRef = dbAdmin.collection("vr_participants").doc(id);
    const participantSnap = await participantRef.get();

    if (!participantSnap.exists) {
      return NextResponse.json(
        { error: "Peserta tidak ditemukan" },
        { status: 404 },
      );
    }

    const participantData = participantSnap.data()!;
    const adminEmail = admin.email || "Admin";

    if (action === "update-status") {
      const newStatus: string = body.status;
      if (!newStatus) {
        return NextResponse.json(
          { error: "Status wajib diisi" },
          { status: 400 },
        );
      }

      const dataToUpdate: any = { statusPembayaran: newStatus };

      // Generate nomor BIB otomatis saat Lunas (konsisten logika admin panel)
      if (
        newStatus === "Lunas" &&
        !participantData.nomorBibLengkap
      ) {
        dataToUpdate.nomorBibLengkap = await generateBibNumber(
          participantData.jarak,
        );
      }

      await participantRef.update(dataToUpdate);

      await dbAdmin.collection("vr_logs").add({
        type: "bayar",
        action: `mengubah status pembayaran menjadi [${newStatus.toUpperCase()}] untuk`,
        targetName: participantData.nama || "",
        adminEmail,
        timestamp: Date.now(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "update-resi") {
      const resi: string = body.resi || "";
      await participantRef.update({ resiPengiriman: resi });

      await dbAdmin.collection("vr_logs").add({
        type: "resi",
        action: `menginput resi pengiriman untuk`,
        targetName: participantData.nama || "",
        adminEmail,
        timestamp: Date.now(),
      });

      return NextResponse.json({ success: true });
    }

    if (action === "update-jarak") {
      const jarak: string = body.jarak;
      if (!jarak) {
        return NextResponse.json(
          { error: "Jarak wajib diisi" },
          { status: 400 },
        );
      }

      await participantRef.update({ jarak });

      await dbAdmin.collection("vr_logs").add({
        type: "edit_jarak",
        action: `mengubah kategori jarak menjadi [${jarak}] untuk`,
        targetName: participantData.nama || "",
        adminEmail,
        timestamp: Date.now(),
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Aksi tidak dikenal" },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("[vr-admin] Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses aksi admin" },
      { status: 500 },
    );
  }
}
