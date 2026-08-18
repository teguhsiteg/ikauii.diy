import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { EVENT_DETAILS } from '@/data/eventData';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export const CountdownTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(EVENT_DETAILS.targetDateTime).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeUnits = [
    { label: 'Hari', value: timeLeft.days },
    { label: 'Jam', value: timeLeft.hours },
    { label: 'Menit', value: timeLeft.minutes },
    { label: 'Detik', value: timeLeft.seconds },
  ];

  return (
    <div className="w-full max-w-lg mx-auto my-6 p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-[#0b172c] border border-amber-400/30 shadow-xl backdrop-blur">
      <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold uppercase tracking-widest text-amber-300">
        <Clock className="w-4 h-4 text-amber-400" />
        <span>Menuju Acara Pelantikan</span>
      </div>

      {timeLeft.isPast ? (
        <div className="text-center py-2 text-amber-300 font-semibold text-sm">
          Acara sedang berlangsung atau telah diselenggarakan
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center">
          {timeUnits.map((unit, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl bg-slate-950/80 border border-amber-400/20 shadow-inner"
            >
              <span className="font-cinzel text-xl sm:text-2xl md:text-3xl font-bold text-amber-200">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-400 mt-1">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
