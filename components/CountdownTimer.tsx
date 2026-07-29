"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: string; // Format: "YYYY-MM-DDTHH:mm:ss" (Contoh: "2026-06-30T23:59:59")
  onExpire?: () => void; // Fungsi yang dijalankan kalau waktu habis
}

export default function CountdownTimer({
  targetDate,
  onExpire,
}: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

      if (difference > 0) {
        timeLeft = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      } else {
        setIsExpired(true);
        if (onExpire) onExpire();
      }

      return timeLeft;
    };

    // Hitung pertama kali render
    setTimeLeft(calculateTimeLeft());

    // Update setiap detik
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onExpire]);

  if (isExpired) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-600 px-6 py-4 rounded-xl text-center shadow-sm">
        <h3 className="font-black text-lg uppercase tracking-widest">
          Pendaftaran Telah Ditutup
        </h3>
        <p className="text-sm font-medium mt-1">
          Sampai jumpa di garis start event selanjutnya!
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-4 justify-center">
      {/* KOTAK HARI */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#0B1528] text-white rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg">
          {timeLeft.days.toString().padStart(2, "0")}
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
          Hari
        </span>
      </div>
      <span className="text-2xl font-black text-slate-300 -mt-6">:</span>

      {/* KOTAK JAM */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#0B1528] text-white rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg">
          {timeLeft.hours.toString().padStart(2, "0")}
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
          Jam
        </span>
      </div>
      <span className="text-2xl font-black text-slate-300 -mt-6">:</span>

      {/* KOTAK MENIT */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#0B1528] text-white rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg">
          {timeLeft.minutes.toString().padStart(2, "0")}
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
          Menit
        </span>
      </div>
      <span className="text-2xl font-black text-slate-300 -mt-6">:</span>

      {/* KOTAK DETIK (Bisa dikasih warna beda biar mencolok) */}
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-600 text-white rounded-xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-lg animate-pulse">
          {timeLeft.seconds.toString().padStart(2, "0")}
        </div>
        <span className="text-[10px] sm:text-xs font-bold text-rose-500 uppercase tracking-widest mt-2">
          Detik
        </span>
      </div>
    </div>
  );
}
