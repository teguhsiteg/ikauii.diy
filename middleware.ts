import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Middleware ini sengaja dibuat minimal untuk menghindari redirect loop
  // yang terjadi akibat ketidakcocokan antara Edge Runtime dan cookie
  // HttpOnly di lingkungan Firebase Hosting + Cloud Run.
  //
  // Keamanan sesungguhnya dijaga oleh 3 lapis yang lebih kuat:
  //   1. layout.tsx masing-masing route (client-side auth guard via onAuthStateChanged)
  //   2. API Routes (/api/vr-admin, dll) validasi token dengan firebase-admin
  //   3. Firestore Security Rules mengunci akses data
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Middleware sengaja dikosongkan dari route protected.
    // Masing-masing layout sudah menjaga autentikasi secara mandiri.
    // Hanya jalankan middleware untuk path yang benar-benar butuh edge processing.
    "/api/placeholder-not-used",
  ],
};

