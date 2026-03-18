import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Kita mencari 'kartu identitas' bernama __session di cookies
  const session = request.cookies.get("__session");

  // Jika mencoba masuk /dashboard tapi belum punya sesi -> Usir ke /login
  if (request.nextUrl.pathname.startsWith("/dashboard") && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Jika sudah login tapi iseng buka halaman /login -> Kembalikan ke /dashboard
  if (request.nextUrl.pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Beri tahu satpam di rute mana saja dia harus berjaga
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
