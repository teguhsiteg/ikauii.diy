import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { createRemoteJWKSet, jwtVerify } from "jose";

// URL public keys Google untuk Firebase
const FIREBASE_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  throw new Error("FIREBASE_PROJECT_ID is required for JWT verification");
}

const JWKS = createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));

async function verifyFirebaseToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    // Jika verify berhasil, berarti token valid, ditandatangani Google, dan belum expired.
    return payload;
  } catch (error) {
    console.error("JWT Verification failed in Edge:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
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

  // 3. Verifikasi token secara mendalam (Signature & Expiry)
  const payload = await verifyFirebaseToken(session.value);
  if (!payload) {
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
