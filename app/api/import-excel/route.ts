import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    // ================================================================
    // KEAMANAN: Verifikasi bahwa request datang dari admin yang login
    // ================================================================
    const authHeader = req.headers.get("Authorization");
    const idToken = authHeader?.replace("Bearer ", "");

    if (!idToken) {
      return NextResponse.json(
        { error: "Unauthorized: Token tidak ditemukan" },
        { status: 401 },
      );
    }

    let decodedToken;
    try {
      decodedToken = await authAdmin.verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { error: "Unauthorized: Token tidak valid" },
        { status: 401 },
      );
    }

    // Cek apakah user memiliki role admin (custom claim)
    if (!decodedToken.admin && !decodedToken.super_admin) {
      return NextResponse.json(
        { error: "Forbidden: Hanya Admin yang dapat melakukan import" },
        { status: 403 },
      );
    }
    // ================================================================

    const body = await req.json();
    const users = body.users;

    if (!users || !Array.isArray(users)) {
      return NextResponse.json(
        { error: "Format data tidak valid" },
        { status: 400 },
      );
    }

    const db = (await import("firebase-admin")).default.firestore();
    const counterRef = db.collection("pengaturan").doc("counter_nia");
    const counterSnap = await counterRef.get();
    let currentNumber = counterSnap.exists
      ? counterSnap.data()?.lastNumber || 88
      : 88;

    const results = [];

    for (const user of users) {
      try {
        if (!user.email) continue; // Abaikan jika baris kosong / tidak ada email

        // 🔥 1. CEK APAKAH SUDAH PUNYA AKUN AUTH 🔥
        try {
          await authAdmin.getUserByEmail(user.email);

          // JIKA BERHASIL (ARTINYA AKUN SUDAH ADA), KITA SKIP / ABAIKAN!
          console.log(`SKIP: ${user.email} (Sudah ada di Auth)`);
          results.push({
            email: user.email,
            status: "Skipped",
            reason: "Sudah punya akun Auth",
          });
          continue; // Langsung lompat ke pendaftar berikutnya di Excel
        } catch (err: any) {
          // Jika errornya BUKAN karena "user-not-found", berarti ada error koneksi dll.
          if (err.code !== "auth/user-not-found") {
            throw err;
          }
        }

        // --- JIKA SAMPAI SINI, BERARTI AKUN BELUM ADA. KITA BUATKAN! ---
        // 🔐 Generate password random yang aman (bukan hardcoded "Ikauii123!")
        const randomPassword = generateSecurePassword();

        const userAuth = await authAdmin.createUser({
          email: user.email,
          password: randomPassword,
          displayName: user.namaLengkap || "Anggota IKA",
        });
        const uid = userAuth.uid;

        // 2. Hitung NIA
        currentNumber++;
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = String(now.getMonth() + 1).padStart(2, "0");

        let kab = "00";
        const dom = (user.domisili || "").toLowerCase();
        if (dom.includes("sleman")) kab = "04";
        else if (dom.includes("bantul")) kab = "02";
        else if (dom.includes("gunung")) kab = "03";
        else if (dom.includes("kulon")) kab = "01";
        else if (dom.includes("kota") || dom.includes("yogya")) kab = "71";

        const generatedNIA = `${year}.${month}.34.${kab}.${String(currentNumber).padStart(4, "0")}`;

        // 3. Simpan ke Firestore
        const batch = db.batch();
        const pendaftarRef = db.collection("pendaftar").doc(uid);
        const pengurusRef = db.collection("pengurus").doc(uid);

        const dataFinal = {
          ...user,
          id: uid,
          nia: generatedNIA,
          status: "Disetujui",
          emailSent: false,
          createdAt: new Date().toISOString(),
          tanggalDaftar: new Date().toISOString(),
          jabatan: "Anggota",
          bidang: user.keahlian || user.bidang || "Belum Ditentukan",
          alamatLengkap: user.alamatLengkap || "-",
          // Tandai bahwa password perlu direset
          requiresPasswordReset: true,
        };

        batch.set(pendaftarRef, dataFinal, { merge: true });
        batch.set(pengurusRef, dataFinal, { merge: true });
        await batch.commit();

        results.push({
          email: user.email,
          status: "Success",
          nia: generatedNIA,
          // Sertakan password agar admin bisa kirim ke user
          tempPassword: randomPassword,
        });
      } catch (err: any) {
        console.error(`Gagal proses ${user.email}:`, err.message);
        results.push({
          email: user.email,
          status: "Failed",
          error: err.message,
        });
      }
    }

    // 4. Update Counter Akhir
    await counterRef.set({ lastNumber: currentNumber }, { merge: true });

    // Kembalikan status sukses (meskipun ada yg di-skip)
    return NextResponse.json(
      { message: "Import Selesai", detail: results },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Fatal Error Import API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Generate password acak yang memenuhi syarat keamanan Firebase Auth:
 * min 8 karakter, ada huruf besar, huruf kecil, dan angka.
 */
function generateSecurePassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;

  const randomChar = (set: string) =>
    set[Math.floor(Math.random() * set.length)];

  // Pastikan minimal 1 dari setiap kategori
  const required = [
    randomChar(upper),
    randomChar(upper),
    randomChar(lower),
    randomChar(lower),
    randomChar(digits),
    randomChar(digits),
  ];

  // Tambahkan karakter random hingga 12 karakter
  const extra = Array.from({ length: 6 }, () => randomChar(all));

  // Acak urutannya
  return [...required, ...extra]
    .sort(() => Math.random() - 0.5)
    .join("");
}
