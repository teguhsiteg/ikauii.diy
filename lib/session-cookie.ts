import type { User } from "firebase/auth";

/**
 * Helper sinkronisasi cookie session `firebase_session` LEWAT SERVER.
 *
 * Cookie tidak lagi ditulis langsung lewat `document.cookie` (yang rawan
 * race-condition & bisa dibaca XSS). Sekarang client kirim idToken ke
 * `/api/auth/session`, server yang memverifikasi dengan firebase-admin lalu
 * set cookie HttpOnly. Ini yang dipakai middleware (edge) sebagai gerbang.
 */

/** Kirim idToken ke server → set cookie HttpOnly. Return true jika sukses. */
export async function syncSessionCookie(user: User): Promise<boolean> {
  try {
    const token = await user.getIdToken();
    if (!token) return false;

    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });

    return res.ok;
  } catch (error) {
    console.warn("⚠️ syncSessionCookie gagal:", (error as Error)?.message);
    return false;
  }
}

/** Hapus cookie session lewat server (cookie HttpOnly tak bisa dihapus dari JS). */
export async function clearSessionCookie(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch (error) {
    console.warn("⚠️ clearSessionCookie gagal:", (error as Error)?.message);
  }
}
