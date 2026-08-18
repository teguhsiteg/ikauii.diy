import React from 'react';
import { motion } from 'motion/react';
import { X, QrCode, Sparkles, MapPin, Calendar, CheckCircle, ShieldCheck } from 'lucide-react';
import { GuestInfo } from '@/data/eventData';
import { EVENT_DETAILS } from '@/data/eventData';
import { UiiLogoBadge } from './HeaderDecorations';

interface GuestTicketModalProps {
  guest: GuestInfo;
  isOpen: boolean;
  onClose: () => void;
}

export const GuestTicketModal: React.FC<GuestTicketModalProps> = ({ guest, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-gradient-to-b from-[#0e2142] via-[#091730] to-[#040b18] border-2 border-amber-400/50 rounded-2xl p-6 shadow-2xl text-slate-100 overflow-hidden"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ticket Header */}
        <div className="text-center pb-4 border-b border-amber-400/20">
          <div className="flex justify-center mb-2">
            <UiiLogoBadge size={52} />
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[11px] font-bold tracking-wider uppercase border border-amber-400/30 mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>E-PASS UNDANGAN {guest.category || 'VIP'}</span>
          </div>
          <h3 className="font-cinzel text-lg font-bold text-white tracking-wide">
            PELANTIKAN PENGURUS DPW IKA UII DIY
          </h3>
          <p className="text-[11px] text-amber-300/90 font-medium">
            {EVENT_DETAILS.period}
          </p>
        </div>

        {/* Guest Credentials Body */}
        <div className="my-4 p-4 rounded-xl bg-slate-900/80 border border-amber-400/30 text-center">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
            Tamu Undangan Terhormat
          </div>
          <div className="font-playfair text-lg font-bold text-amber-200 mt-1">
            {guest.name}
          </div>
          {guest.role && (
            <div className="text-xs text-slate-300 mt-0.5 italic">
              {guest.role}
            </div>
          )}

          {/* QR Code Mockup with accurate visual */}
          <div className="mt-4 flex flex-col items-center justify-center">
            <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-amber-400">
              <svg viewBox="0 0 100 100" className="w-32 h-32 text-slate-900 fill-current">
                {/* Visual QR Code Pattern */}
                <rect x="5" y="5" width="25" height="25" fill="#000" />
                <rect x="10" y="10" width="15" height="15" fill="#fff" />
                <rect x="13" y="13" width="9" height="9" fill="#000" />

                <rect x="70" y="5" width="25" height="25" fill="#000" />
                <rect x="75" y="10" width="15" height="15" fill="#fff" />
                <rect x="78" y="13" width="9" height="9" fill="#000" />

                <rect x="5" y="70" width="25" height="25" fill="#000" />
                <rect x="10" y="75" width="15" height="15" fill="#fff" />
                <rect x="13" y="78" width="9" height="9" fill="#000" />

                {/* Random Data matrix pattern dots */}
                <rect x="35" y="10" width="6" height="6" fill="#000" />
                <rect x="45" y="15" width="6" height="6" fill="#000" />
                <rect x="55" y="10" width="6" height="6" fill="#000" />
                <rect x="35" y="25" width="6" height="6" fill="#000" />
                <rect x="45" y="35" width="10" height="10" fill="#000" />
                <rect x="10" y="45" width="6" height="6" fill="#000" />
                <rect x="25" y="45" width="6" height="6" fill="#000" />
                <rect x="35" y="55" width="6" height="6" fill="#000" />
                <rect x="50" y="55" width="6" height="6" fill="#000" />
                <rect x="65" y="45" width="6" height="6" fill="#000" />
                <rect x="75" y="45" width="6" height="6" fill="#000" />
                <rect x="85" y="55" width="6" height="6" fill="#000" />
                <rect x="35" y="75" width="8" height="8" fill="#000" />
                <rect x="50" y="75" width="8" height="8" fill="#000" />
                <rect x="65" y="75" width="15" height="15" fill="#000" />
                <rect x="85" y="80" width="6" height="6" fill="#000" />
              </svg>
            </div>
            <span className="font-mono text-xs text-amber-300 font-semibold tracking-wider mt-2">
              KODE: {guest.code || 'IKAUII-VIP2026'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Tunjukkan e-Pass ini kepada meja registrasi panitia
            </span>
          </div>
        </div>

        {/* Schedule & Venue Brief */}
        <div className="space-y-1.5 text-xs text-slate-300 px-1 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{EVENT_DETAILS.day}, {EVENT_DETAILS.dateFormatted} (18.00 WIB)</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>{EVENT_DETAILS.venue}</span>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="w-full py-2.5 rounded-xl gold-gradient-bg text-slate-950 font-bold text-xs shadow hover:brightness-110 cursor-pointer"
        >
          Cetak / Simpan e-Pass Undangan
        </button>
      </motion.div>
    </div>
  );
};
