import { useState, useEffect } from "react";

export default function SmartLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Logika Nipu UX: Angka naik cepat di awal, melambat di angka 90an
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;

        // Semakin besar progress, semakin lambat naiknya (mentok di 99%)
        const diff =
          oldProgress < 50
            ? Math.random() * 15
            : oldProgress < 80
              ? Math.random() * 5
              : oldProgress < 99
                ? Math.random() * 1
                : 0;

        const nextProgress = oldProgress + diff;
        return nextProgress > 99 ? 99 : nextProgress;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen fixed inset-0 z-[9999] bg-[#0B2239] flex flex-col items-center justify-center p-6">
      {/* Efek Latar Belakang (Opsional) */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] opacity-10"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B2239] via-transparent to-[#0B2239]"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-xs animate-in zoom-in-95 duration-500">
        {/* Logo Berdenyut */}
        <div className="w-24 h-24 bg-white rounded-full p-4 mb-8 shadow-[0_0_30px_rgba(252,209,22,0.3)] animate-pulse border-2 border-[#FCD116]">
          <img
            src="/logo-dpp-ika.png"
            alt="IKA UII Loading"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Teks Status */}
        <h2 className="text-[#FCD116] font-black tracking-widest uppercase mb-1 text-sm">
          Menyiapkan Sistem
        </h2>
        <p className="text-slate-400 text-xs mb-6 font-medium tracking-wide">
          Memuat data aman terenkripsi...
        </p>

        {/* Progress Bar Container */}
        <div className="w-full bg-[#1e3656] rounded-full h-3 mb-3 p-0.5 border border-white/10 shadow-inner overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#F29900] to-[#FCD116] h-full rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${Math.floor(progress)}%` }}
          >
            {/* Efek kilap di dalam bar */}
            <div className="absolute top-0 right-0 bottom-0 left-0 bg-white/20 animate-[shimmer_1.5s_infinite]"></div>
          </div>
        </div>

        {/* Angka Persentase */}
        <div className="flex justify-between w-full text-[10px] font-bold text-slate-300">
          <span>0%</span>
          <span className="text-[#FCD116] text-lg">
            {Math.floor(progress)}%
          </span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
