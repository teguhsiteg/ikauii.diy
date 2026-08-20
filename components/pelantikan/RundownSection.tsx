import React, { useState } from 'react';
import { Clock, Star, ChevronDown, ChevronUp, CalendarCheck } from 'lucide-react';
import { RundownItem } from '@/lib/invitation-settings';

export const RundownSection: React.FC<{ rundown: RundownItem[] }> = ({ rundown }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  return (
    <section id="rundown-section" className="w-full max-w-3xl mx-auto my-10 px-4">
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0e2142]/90 to-[#081326]/95 border border-amber-400/35 p-5 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-400/25 mb-2">
            <CalendarCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Rangkaian Acara</span>
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold gold-gradient-text tracking-wide">
            SUSUNAN ACARA
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg mx-auto">
            Agenda Pelantikan Pengurus DPW IKA UII DIY Periode 2026 – 2031
          </p>
        </div>

        {/* Timeline Table / Cards */}
        <div className="space-y-2.5">
          {rundown.slice(0, isExpanded ? rundown.length : 6).map((item, index) => (
            <div
              key={index}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border transition-all ${
                item.highlight
                  ? 'bg-amber-500/15 border-amber-400/50 shadow-md shadow-amber-500/10'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Time Badge */}
              <div className="flex items-center gap-2 mb-1 sm:mb-0 sm:min-w-[150px]">
                <Clock className={`w-3.5 h-3.5 ${item.highlight ? 'text-amber-300' : 'text-slate-400'}`} />
                <span className={`font-mono text-xs sm:text-sm font-semibold ${item.highlight ? 'text-amber-200' : 'text-slate-300'}`}>
                  {item.time}
                </span>
                {item.highlight && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    Inti
                  </span>
                )}
              </div>

              {/* Title & Speaker */}
              <div className="flex-1 sm:px-3 text-left">
                <div className={`text-sm sm:text-base font-medium leading-snug ${item.highlight ? 'text-white font-bold' : 'text-slate-200'}`}>
                  {item.title}
                </div>
                {item.speaker && (
                  <div className="text-xs text-amber-300/90 font-normal mt-0.5">
                    Oleh: {item.speaker}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse Toggle */}
        <div className="mt-5 text-center">
          <button
            id="btn-toggle-rundown"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-amber-400/30 text-xs text-amber-300 font-semibold cursor-pointer transition-colors"
          >
            <span>{isExpanded ? 'Tampilkan Lebih Ringkas' : `Lihat Semua Acara (${rundown.length} Agenda)`}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </section>
  );
};
