"use client";

import { useEffect } from "react";

// --- DAFTAR HARI BESAR & EVENT ---
// Format key: "Bulan-Tanggal"
export const EVENT_KALENDER: Record<string, string> = {
  "1-1": "Tahun Baru Masehi",
  "2-14": "Hari Valentine",
  "3-1": "Hari Peringatan Serangan Umum 1 Maret",
  "5-1": "Hari Buruh Internasional",
  "5-2": "Hari Pendidikan Nasional",
  "5-20": "Hari Kebangkitan Nasional",
  "6-1": "Hari Lahir Pancasila",
  "8-17": "Hari Kemerdekaan RI",
  "10-1": "Hari Kesaktian Pancasila",
  "10-28": "Hari Sumpah Pemuda",
  "11-10": "Hari Pahlawan",
  "12-22": "Hari Ibu",
  "12-25": "Hari Raya Natal",
  "2-17": "Awal Ramadhan 1447 H",
  "3-19": "Hari Raya Idul Fitri 1447 H",
  "3-20": "Cuti Bersama Lebaran",
  "3-21": "Hari Raya Nyepi Tahun Baru Saka 1948",
  "5-26": "Hari Raya Idul Adha 1447 H",
};

// --- MAPPING EVENT KE KELAS TEMA ---
export const THEME_MAP: Record<string, string> = {
  "Hari Valentine": "theme-pink",
  "Hari Kemerdekaan RI": "theme-merdeka",
  "Hari Pahlawan": "theme-merdeka",
  "Hari Peringatan Serangan Umum 1 Maret": "theme-merdeka",
  "Hari Kesaktian Pancasila": "theme-merdeka",
  "Hari Lahir Pancasila": "theme-merdeka",
  "Hari Sumpah Pemuda": "theme-merdeka",
  "Awal Ramadhan 1447 H": "theme-ramadhan",
  "Hari Raya Idul Fitri 1447 H": "theme-ramadhan",
  "Cuti Bersama Lebaran": "theme-ramadhan",
  "Hari Raya Idul Adha 1447 H": "theme-ramadhan",
};

export function getTodayEvent() {
  const today = new Date();
  const month = today.getMonth() + 1; // getMonth() mulai dari 0
  const date = today.getDate();
  const keyEvent = `${month}-${date}`;
  return EVENT_KALENDER[keyEvent] || null;
}

export default function ThemeProvider() {
  useEffect(() => {
    const eventName = getTodayEvent();
    if (eventName) {
      const themeClass = THEME_MAP[eventName];
      if (themeClass) {
        document.documentElement.classList.add(themeClass);
      }
    }
    
    // Cleanup
    return () => {
      if (eventName && THEME_MAP[eventName]) {
        document.documentElement.classList.remove(THEME_MAP[eventName]);
      }
    };
  }, []);

  return null; // Komponen ini hanya berfungsi menjalankan efek sisi klien
}
