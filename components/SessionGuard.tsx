"use client";

import { useEffect, useRef, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { syncSessionCookie, clearSessionCookie } from "@/lib/session-cookie";

export default function SessionGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🔥 WAKTU AUTO-LOGOUT: 1 JAM (dalam milidetik) 🔥
  const IDLE_TIMEOUT = 3600000;

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      await clearSessionCookie();
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
    // 🔥 onIdTokenChanged: otomatis sinkron cookie session ke server setiap
    // kali Firebase SDK menerbitkan / me-refresh token (~1 jam). Cookie kini
    // HttpOnly & diset lewat server (bukan document.cookie), jadi middleware
    // selalu melihat cookie valid tanpa race-condition.
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      if (user) {
        await syncSessionCookie(user);

        window.addEventListener("mousemove", resetTimer);
        window.addEventListener("keydown", resetTimer);
        window.addEventListener("scroll", resetTimer);
        window.addEventListener("touchstart", resetTimer);
        resetTimer();
      } else {
        // Fire-and-forget: hapus cookie lewat server. Aman & idempoten.
        clearSessionCookie();
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
  }, [resetTimer]);

  return <>{children}</>;
}
