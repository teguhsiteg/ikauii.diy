import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Decode JWT payload dan cek apakah token sudah kadaluarsa.
 * Ini TIDAK memverifikasi signature — hanya mengecek expiry.
 * Cukup untuk mencegah token lama/manipulasi sederhana.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64URL decode
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded));
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

function isTokenValid(token: string): boolean {
  const exp = getTokenExpiry(token);
  if (!exp) return false;
  // exp adalah Unix timestamp dalam detik
  return exp * 1000 > Date.now();
}

export function middleware(request: NextRequest) {
  const session = request.cookies.get("firebase_session");
  const { pathname } = request.nextUrl;

  // 1. IZINKAN halaman login agar tidak terjadi looping
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // 2. Jika tidak ada sesi, tendang ke login
  if (!session) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // 3. Verifikasi token tidak kadaluarsa
  if (!isTokenValid(session.value)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    url.searchParams.set("reason", "session_expired");
    const response = NextResponse.redirect(url);
    // Hapus cookie yang tidak valid
    response.cookies.delete("firebase_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/run/admin/:path*"],
};
