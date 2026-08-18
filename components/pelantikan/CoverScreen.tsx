import React from 'react';
import { motion } from 'motion/react';
import { MailOpen, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { GuestInfo } from '@/data/eventData';
import { EVENT_DETAILS } from '@/data/eventData';
import { UiiLogoBadge, IslamicCorner, JogloSilhouette } from './HeaderDecorations';
import { invitationAudio } from '@/utils/audioHelper';

interface CoverScreenProps {
  guest: GuestInfo;
  onOpen: () => void;
  isEmbed?: boolean;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({
  guest,
  onOpen,
  isEmbed = false,
}) => {
  const handleOpenInvitation = () => {
    invitationAudio.play();
    onOpen();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between overflow-y-auto bg-slate-950 bg-pattern-jogja text-slate-100 p-4 sm:p-6 ${
        isEmbed ? 'p-2 sm:p-4' : ''
      }`}
    >
      {/* Background Joglo / Tugu Silhouette */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-4xl opacity-20 pointer-events-none">
        <JogloSilhouette />
      </div>

      {/* Top Header */}
      <div className="w-full max-w-md flex flex-col items-center text-center pt-2 sm:pt-4 z-10">
        <div className="mb-2.5">
          <UiiLogoBadge size={58} />
        </div>

        <p className="text-[11px] sm:text-xs font-semibold tracking-wider text-amber-300 uppercase">
          {EVENT_DETAILS.orgName}
        </p>
        <p className="text-[10px] sm:text-[11px] font-medium tracking-wide text-slate-300 uppercase">
          {EVENT_DETAILS.subOrgName}
        </p>
      </div>

      {/* Centerpiece Personalized Card */}
      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="w-full max-w-lg my-auto py-4 z-10"
      >
        <div className="relative rounded-2xl bg-[#0a1832]/95 border border-amber-400/35 p-5 sm:p-7 shadow-xl backdrop-blur-md text-center overflow-hidden">
          {/* Ornate corner accents */}
          <IslamicCorner position="tl" className="absolute top-1.5 left-1.5" />
          <IslamicCorner position="tr" className="absolute top-1.5 right-1.5" />
          <IslamicCorner position="bl" className="absolute bottom-1.5 left-1.5" />
          <IslamicCorner position="br" className="absolute bottom-1.5 right-1.5" />

          {/* Subtitle Badge */}
          <div className="inline-block px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-[11px] font-medium tracking-wider uppercase mb-3">
            Undangan Resmi Pelantikan
          </div>

          <h1 className="font-cinzel text-xl sm:text-2xl font-bold tracking-wide text-white leading-snug mb-1">
            PELANTIKAN PENGURUS
          </h1>
          <h2 className="font-cinzel text-lg sm:text-xl font-bold gold-gradient-text tracking-wider mb-2">
            DPW IKA UII DIY
          </h2>
          <div className="inline-block px-2.5 py-0.5 rounded bg-amber-500/15 text-amber-200 text-[11px] font-semibold tracking-wider mb-5 border border-amber-400/25">
            {EVENT_DETAILS.period}
          </div>

          {/* Recipient Frame */}
          <div className="relative my-3 p-4 rounded-xl bg-slate-950/80 border border-amber-400/35 text-center">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
              Kepada Yth. Bapak/Ibu/Saudara/i:
            </div>

            <div
              id="guest-recipient-name"
              className="font-playfair text-lg sm:text-xl font-bold text-amber-200 leading-snug px-1"
            >
              {guest.name}
            </div>

            {guest.role && (
              <div
                id="guest-recipient-role"
                className="text-xs text-slate-300 font-normal mt-1 italic"
              >
                {guest.role}
              </div>
            )}

            <div className="mt-2.5 flex items-center justify-center gap-2">
              {guest.category ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  {guest.category}
                </span>
              ) : null}
              {guest.code && (
                <span className="text-[10px] text-slate-400 font-mono">
                  #{guest.code}
                </span>
              )}
            </div>
          </div>

          {/* Date & Venue Brief */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 my-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{EVENT_DETAILS.day}, {EVENT_DETAILS.dateFormatted}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{EVENT_DETAILS.venue}</span>
            </div>
          </div>

          {/* Action Open Button */}
          <button
            id="btn-open-invitation"
            onClick={handleOpenInvitation}
            className="w-full mt-2 py-3 px-5 rounded-xl gold-gradient-bg text-slate-950 font-bold text-sm shadow-md flex items-center justify-center gap-2 hover:brightness-105 cursor-pointer transition-all"
          >
            <MailOpen className="w-4 h-4 text-slate-950" />
            <span>Buka Undangan Digital</span>
          </button>
        </div>
      </motion.div>

      {/* Clean, Official Footer */}
      <div className="w-full max-w-md flex items-center justify-center text-center text-[11px] text-slate-400 pb-2 z-10 px-2">
        <span>© 2026 DPW IKA UII DIY • Pelantikan Pengurus 2026 – 2031</span>
      </div>
    </motion.div>
  );
};
