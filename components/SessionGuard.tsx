"use client";

import { useEffect, useRef, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { onIdTokenChanged, signOut, type User } from "firebase/auth";
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

/**
 * Setel cookie firebase_session dengan fallback: coba refresh token dulu,
 * kalau gagal (network error, token expired, dll) pakai cached token.
 * onIdTokenChanged menjamin cookie selalu up-to-date setiap token di-refresh.
 */
async function syncSessionCookie(user: User) {
  try {
    // Coba refresh → dapat token terbaru
    const token = await user.getIdToken(true);
    document.cookie = buildCookieString(token, 86400);
    return;
  } catch (refreshError) {
    console.warn(
      "⚠️ SessionGuard: gagal refresh token, fallback ke cached token:",
      (refreshError as Error)?.message,
    );
  }

  try {
    // Fallback: gunakan token yang sudah di-cache oleh Firebase SDK
    const cachedToken = await user.getIdToken(false);
    if (cachedToken) {
      document.cookie = buildCookieString(cachedToken, 86400);
    }
  } catch (cachedError) {
    console.error(
      "❌ SessionGuard: tidak bisa mendapatkan token sama sekali:",
      (cachedError as Error)?.message,
    );
  }
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
      document.cookie = buildCookieString("", 0);
      router.push("/login");
    } catch (error) {
      console.error("Gagal auto-logout:", error);
    }
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT);
  }, [handleLogout, IDLE_TIMEOUT]);

  useEffect(() => {
    // 🔥 onIdTokenChanged: lebih reliable dari onAuthStateChanged karena
    // otomatis sync cookie setiap kali Firebase SDK me-refresh token (~1 jam).
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        await syncSessionCookie(user);

        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("keydown", resetTimer);
        window.addEventListener("scroll", resetTimer);
        window.addEventListener("touchstart", resetTimer);
        resetTimer();
      } else {
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
