import { dbAdmin, authAdmin } from "./firebase-admin";

// ============================================================
// VERIFIKASI ADMIN VR (SERVER-SIDE)
// Dipakai oleh route API admin agar Firestore rules bisa tetap
// mengunci client (isAdmin = users/{uid}.role == "admin").
//
// Role yang diakui: admin, super_admin, superadmin (case-insensitive).
// Fallback: jika dokumen users/{uid} tidak ada/tidak ber-role admin,
// cari dokumen users (auto-id) yang email-nya cocok dengan token
// dan ber-role admin — lalu self-healing: buat/update users/{uid}
// dengan role "admin" supaya akses client-side juga konsisten.
// ============================================================

const ADMIN_ROLES = ["admin", "super_admin", "superadmin"];

export type VrAdminSession = {
  uid: string;
  email: string | null;
  role: string;
};

export async function verifyVrAdmin(
  request: Request,
): Promise<VrAdminSession | null> {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");

  if (!token) return null;

  try {
    const decoded = await authAdmin.verifyIdToken(token);
    const uid = decoded.uid;
    const email = decoded.email?.toLowerCase() || null;

    // 1) Fast path: dokumen users/{uid} dengan role admin
    const userRef = dbAdmin.collection("users").doc(uid);
    const userSnap = await userRef.get();

    if (userSnap.exists) {
      const role = String(userSnap.data()?.role || "").toLowerCase();
      if (ADMIN_ROLES.includes(role)) {
        return { uid, email, role: userSnap.data()?.role };
      }
    }

    // 2) Fallback: dokumen users auto-id dengan email cocok + role admin
    if (email) {
      const snap = await dbAdmin
        .collection("users")
        .where("email", "==", email)
        .limit(5)
        .get();

      for (const doc of snap.docs) {
        const data = doc.data();
        const role = String(data.role || "").toLowerCase();
        if (ADMIN_ROLES.includes(role)) {
          // Self-healing: pastikan users/{uid} ber-role "admin" (PERSIS,
          // karena rules client mengecek == "admin") supaya akun ini
          // juga bisa menulis langsung dari client jika dibutuhkan.
          await userRef.set(
            {
              role: "admin",
              email: data.email || email,
              verifiedAs: data.role,
              verifiedAt: new Date().toISOString(),
            },
            { merge: true },
          );
          // Daftarkan juga di index admin_emails/{email} (dibaca rules
          // isAdmin sebagai jalur alternatif) — lowercase.
          await dbAdmin
            .collection("admin_emails")
            .doc(email)
            .set(
              {
                role: data.role,
                active: true,
                updatedAt: new Date().toISOString(),
              },
              { merge: true },
            );
          return { uid, email, role: data.role };
        }
      }
    }

    return null;
  } catch (error) {
    console.error("[vr-admin-auth] Token verification failed:", error);
    return null;
  }
}
