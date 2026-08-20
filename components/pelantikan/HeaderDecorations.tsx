import React from 'react';

export const UiiLogoBadge: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 56 }) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="w-full h-full rounded-2xl bg-white/95 p-1.5 flex items-center justify-center border border-amber-400/50 shadow-lg backdrop-blur-sm">
        <img
          src="https://ikadiy.uii.ac.id/logo-dpp-ika.png"
          alt="Logo DPP IKA UII"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Fallback gracefully if external image cannot be loaded
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
      </div>
    </div>
  );
};

export const JogloSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg viewBox="0 0 1200 320" preserveAspectRatio="none" className={`w-full fill-current ${className}`} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="jogloGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#d4af37" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#0B1B3D" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {/* Tugu Yogyakarta central monument silhouette */}
      <path d="M600 20 L604 70 L607 140 L612 180 L618 240 L630 300 L570 300 L582 240 L588 180 L593 140 L596 70 Z" fill="url(#jogloGrad)" />
      <circle cx="600" cy="16" r="5" fill="#f5d77f" opacity="0.4" />
      {/* Traditional Joglo Roof Wings Left */}
      <path d="M100 300 L250 200 L400 180 L500 230 L550 300 Z" fill="url(#jogloGrad)" />
      <path d="M200 300 L320 220 L440 210 L520 250 L560 300 Z" fill="url(#jogloGrad)" opacity="0.5" />
      {/* Traditional Joglo Roof Wings Right */}
      <path d="M1100 300 L950 200 L800 180 L700 230 L650 300 Z" fill="url(#jogloGrad)" />
      <path d="M1000 300 L880 220 L760 210 L680 250 L640 300 Z" fill="url(#jogloGrad)" opacity="0.5" />
      <line x1="0" y1="298" x2="1200" y2="298" stroke="#d4af37" strokeWidth="1" strokeOpacity="0.2" />
    </svg>
  );
};

export const IslamicCorner: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br'; className?: string }> = ({ position, className = '' }) => {
  const rotation = {
    tl: 'rotate-0',
    tr: 'rotate-90',
    br: 'rotate-180',
    bl: '-rotate-90',
  }[position];

  return (
    <div className={`pointer-events-none w-10 h-10 sm:w-12 sm:h-12 ${rotation} ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-amber-400/30">
        <path d="M5 5 L95 5 L95 18 L18 18 L18 95 L5 95 Z" fill="currentColor" fillOpacity="0.2" />
        <path d="M10 10 L85 10 L85 14 L14 14 L14 85 L10 85 Z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="26" r="3" fill="currentColor" />
      </svg>
    </div>
  );
};

export const GununganWayang: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none ${className}`}>
      <svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-amber-400/20">
        <path d="M50 5 C30 40 10 70 5 110 L95 110 C90 70 70 40 50 5 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
        <path d="M50 15 C35 45 20 75 15 110 L85 110 C80 75 65 45 50 15 Z" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="1" />
        <path d="M40 70 Q50 60 60 70 Q50 80 40 70 Z" fill="currentColor" fillOpacity="0.3" />
        <line x1="50" y1="15" x2="50" y2="110" stroke="currentColor" strokeWidth="1" />
        <line x1="15" y1="110" x2="85" y2="110" stroke="currentColor" strokeWidth="2" />
      </svg>
    </div>
  );
};

export const BatikCorner: React.FC<{ position: 'tl' | 'tr' | 'bl' | 'br'; className?: string }> = ({ position, className = '' }) => {
  const rotation = {
    tl: 'rotate-0',
    tr: 'rotate-90',
    br: 'rotate-180',
    bl: '-rotate-90',
  }[position];

  return (
    <div className={`pointer-events-none w-16 h-16 sm:w-20 sm:h-20 ${rotation} ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-amber-400/40">
        <path d="M5 5 L95 5 L95 15 C60 15 40 30 15 95 L5 95 Z" fill="currentColor" fillOpacity="0.15" />
        <path d="M10 10 L80 10 L80 18 C55 18 35 35 18 80 L10 80 Z" stroke="currentColor" strokeWidth="1.5" />
        {/* Parang Motif curves */}
        <path d="M25 25 Q40 15 50 25 Q35 40 25 25 Z" fill="currentColor" />
        <path d="M45 45 Q60 35 70 45 Q55 60 45 45 Z" fill="currentColor" />
        <path d="M15 60 Q30 50 40 60 Q25 75 15 60 Z" fill="currentColor" />
      </svg>
    </div>
  );
};
