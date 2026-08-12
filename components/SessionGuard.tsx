"use client";

import { useEffect, useRef, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

// 🔥 Helper: hanya set Secure di HTTPS (production). Di HTTP/localhost,
// browser menolak cookie Secure → middleware redirect loop.
function buildCookieString(value: string, maxAge: number): string {
  const secureFlag =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "; Secure"
      : "";
  const sameSite = "; SameSite=Lax";
  return (
    `firebase_session=${value}; path=/; max-age=${maxAge}` +
    sameSite +
    secureFlag
  );
}

export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 WAKTU AUTO-LOGOUT: 1 JAM (dalam milidetik) 🔥
  const IDLE_TIMEOUT = 3600000;

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      // Hapus Cookie agar Middleware tahu user sudah keluar
      document.cookie = buildCookieString("", 0);
      router.push("/login");
    } catch (error) {
      console.error("Gagal auto-logout:", error);
    }
  }, [router]);

  // useCallback memastikan referensi resetTimer stabil
  // sehingga removeEventListener dapat menghapus listener yang benar
  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
  }, [handleLogout, IDLE_TIMEOUT]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // SET COOKIE: Tukar token Firebase agar terbaca oleh Middleware Next.js
        const token = await user.getIdToken();
        document.cookie = buildCookieString(token, 86400);

        // PASANG SENSOR AKTIVITAS: Jika user menggerakkan mouse/scroll, timer reset ulang
        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("keydown", resetTimer);
        window.addEventListener("scroll", resetTimer);
        window.addEventListener("touchstart", resetTimer);
        resetTimer();
      } else {
        // BERSIHKAN SEMUA JIKA LOGOUT
        document.cookie = buildCookieString("", 0);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        window.removeEventListener("mousemove", resetTimer);
        window.removeEventListener("keydown", resetTimer);
        window.removeEventListener("scroll", resetTimer);
        window.removeEventListener("touchstart", resetTimer);
      }
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("keydown", resetTimer);
      window.removeEventListener("scroll", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
    };
  }, [pathname, resetTimer]);

  return <>{children}</>;
}
