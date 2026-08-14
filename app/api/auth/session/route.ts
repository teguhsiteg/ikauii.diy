import { NextResponse } from "next/server";
import { authAdmin } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

// firebase-admin butuh Node.js runtime (tidak jalan di edge).
export const runtime = "nodejs";

// Limit longgar: SessionGuard sinkronisasi cookie tiap token refresh (~1 jam),
// tapi bisa juga beberapa kali beruntun saat login / reload halaman.
const sessionLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 120 });

export async function POST(request: Request) {
  const rl = sessionLimiter(request);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  let idToken: string;
  try {
    const body = await request.json();
    idToken = body?.idToken;
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "idToken wajib diisi" }, { status: 400 });
  }

  try {
    // Verifikasi token dengan Firebase Admin (otoritas sebenarnya).
    const decoded = await authAdmin.verifyIdToken(idToken);

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = (decoded.exp ?? now) - now;
    if (expiresIn <= 0) {
      return NextResponse.json(
        { error: "Token sudah kedaluwarsa" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set("firebase_session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      // Gunakan maxAge tetap 7 hari agar cookie tidak langsung kadaluarsa.
      // Keamanan tetap terjaga karena validasi JWT sesungguhnya dilakukan
      // oleh firebase-admin di setiap API route yang membutuhkan autentikasi.
      // SessionGuard di client akan me-refresh cookie ini setiap ~1 jam
      // via onIdTokenChanged → syncSessionCookie.
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error(
      "❌ Session route: token tidak valid:",
      error?.code || error?.message,
    );
    return NextResponse.json({ error: "Token tidak valid" }, { status: 401 });
  }
}
