"use client";

import { useEffect } from "react";

export default function ConsoleGuard() {
  useEffect(() => {
    // Memastikan ini hanya berjalan di sisi client (browser) dan hanya sekali
    if (typeof window !== "undefined") {
      // Membersihkan console saat pertama kali muat (opsional, agar bersih)
      // console.clear();

      console.log(
        "%cBerhenti!",
        "color: red; font-size: 50px; font-weight: bold; text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;",
      );

      console.log(
        "%cIni adalah fitur browser yang ditujukan untuk developer. Jika seseorang meminta Anda menyalin-menempel sesuatu di sini untuk mengaktifkan fitur tertentu atau meretas akun seseorang, itu adalah penipuan dan akan memberinya akses penuh ke akun IKA UII DIY Anda.",
        "font-size: 16px; font-family: sans-serif; color: #202124;",
      );
    }
  }, []);

  return null; // Komponen ini tidak me-render UI apapun
}
