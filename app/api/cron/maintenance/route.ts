import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { dbAdmin } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    // 1. Validasi Keamanan (Hanya bisa diakses dengan secret key agar tidak diklik orang sembarangan)
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    if (secret !== process.env.INTERNAL_API_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const report: any = {};

    // ==========================================
    // 2. TUGAS 1: MENGHAPUS CACHE NEXT.JS
    // ==========================================
    // Me-reset seluruh cache tampilan website (layout & page)
    revalidatePath("/", "layout");
    report.cache = "Berhasil dibersihkan";

    // ==========================================
    // 3. TUGAS 2: MEMBERSIHKAN SAMPAH / SPAM
    // ==========================================
    // Menghapus pendaftar Virtual Run yang "Menunggu Pembayaran" lebih dari 14 hari
    // (Dianggap sebagai spam/orang iseng)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    let spamDeleted = 0;

    // Bersihkan VR Participants
    const vrRef = dbAdmin.collection("vr_participants");
    const oldVr = await vrRef
      .where("statusPembayaran", "==", "Menunggu Pembayaran")
      .get();
      
    oldVr.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        const createdDate = new Date(data.createdAt);
        if (createdDate < fourteenDaysAgo) {
          doc.ref.delete();
          spamDeleted++;
        }
      }
    });

    // Bersihkan Offline Participants
    const offlineRef = dbAdmin.collection("offline_participants");
    const oldOffline = await offlineRef
      .where("statusPembayaran", "==", "Menunggu Pembayaran")
      .get();
      
    oldOffline.docs.forEach((doc) => {
      const data = doc.data();
      if (data.createdAt) {
        const createdDate = new Date(data.createdAt);
        if (createdDate < fourteenDaysAgo) {
          doc.ref.delete();
          spamDeleted++;
        }
      }
    });

    report.spam = `${spamDeleted} pendaftaran spam/kadaluarsa berhasil dihapus.`;

    return NextResponse.json({
      success: true,
      message: "Maintenance Otomatis Selesai!",
      report,
    });

  } catch (error: any) {
    console.error("Cron Maintenance Error:", error);
    return NextResponse.json(
      { error: "Gagal menjalankan maintenance", details: error.message },
      { status: 500 }
    );
  }
}
