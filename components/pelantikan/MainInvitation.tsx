import React, { useState } from 'react';
import { motion } from 'motion/react';
import { QrCode, Calendar, MapPin, ChevronRight, ShieldCheck, Mail, Globe, Phone, ExternalLink } from 'lucide-react';
import { GuestInfo } from '@/data/eventData';
import { EVENT_DETAILS } from '@/data/eventData';
import { UiiLogoBadge, IslamicCorner, JogloSilhouette } from './HeaderDecorations';
import { CountdownTimer } from './CountdownTimer';
import { RundownSection } from './RundownSection';
import { LocationSection } from './LocationSection';
import { RsvpSection } from './RsvpSection';
import { GuestTicketModal } from './GuestTicketModal';

interface MainInvitationProps {
  guest: GuestInfo;
  onBackToCover: () => void;
  onUpdateGuest?: (name: string, role: string, category: string) => void;
}

export const MainInvitation: React.FC<MainInvitationProps> = ({ guest, onBackToCover }) => {
  const [isTicketOpen, setIsTicketOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-slate-950 bg-pattern-jogja text-slate-100 pb-20 relative overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background Decorative Ambient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-amber-500/5 blur-[120px] pointer-events-none -z-10" />

      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-slate-950/85 border-b border-amber-400/20 px-3 sm:px-6 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Org Brief */}
          <div className="flex items-center gap-2.5">
            <UiiLogoBadge size={36} />
            <div className="text-left hidden xs:block">
              <span className="text-xs font-bold text-amber-300 block tracking-wider uppercase">
                DPW IKA UII DIY
              </span>
              <span className="text-[10px] text-slate-400 block">
                Periode 2026 – 2031
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              id="btn-nav-ticket"
              onClick={() => setIsTicketOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold border border-amber-400/40 cursor-pointer transition-colors"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>E-Pass Undangan</span>
            </button>

            <button
              id="btn-nav-cover"
              onClick={onBackToCover}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs transition-colors cursor-pointer"
              title="Lihat Tampilan Cover Depan"
            >
              Cover
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-10">
        {/* Hero Card Section */}
        <section className="relative rounded-3xl bg-gradient-to-b from-[#0e2142] via-[#091730] to-[#050e1e] border-2 border-amber-400/40 p-6 sm:p-10 shadow-2xl text-center overflow-hidden mb-8">
          <IslamicCorner position="tl" className="absolute top-2 left-2" />
          <IslamicCorner position="tr" className="absolute top-2 right-2" />
          <IslamicCorner position="bl" className="absolute bottom-2 left-2" />
          <IslamicCorner position="br" className="absolute bottom-2 right-2" />

          {/* Center Insignia */}
          <div className="flex justify-center mb-4">
            <UiiLogoBadge size={84} />
          </div>

          <div className="space-y-1 mb-5">
            <p className="text-xs sm:text-sm font-bold tracking-widest text-amber-300 uppercase">
              {EVENT_DETAILS.orgName}
            </p>
            <p className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-300 uppercase">
              {EVENT_DETAILS.subOrgName}
            </p>
          </div>

          {/* Bismillah Calligraphy */}
          <div className="my-6">
            <div className="font-arabic text-2xl sm:text-3xl text-amber-200 leading-relaxed">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </div>
            <p className="text-xs sm:text-sm font-medium text-slate-300 mt-2 italic">
              Assalamualaikum warahmatullahi wabarakatuh
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed mb-6">
            Dengan memohon rahmat dan ridho Allah SWT, Kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara:
          </p>

          {/* Event Title Banner */}
          <div className="py-4 border-y border-amber-400/30 max-w-2xl mx-auto my-6">
            <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-black tracking-wide text-white mb-2">
              PELANTIKAN PENGURUS
            </h1>
            <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-extrabold gold-gradient-text tracking-wider mb-2">
              DPW IKA UII DIY
            </h2>
            <div className="inline-block px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-bold tracking-widest">
              {EVENT_DETAILS.period}
            </div>
          </div>

          {/* Theme */}
          <p className="text-xs sm:text-sm font-serif-playfair text-amber-100/90 italic max-w-lg mx-auto mb-8">
            {EVENT_DETAILS.theme}
          </p>

          {/* Dedicated Recipient Showcase Card */}
          <div className="max-w-lg mx-auto p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-[#0b1b36] to-slate-900/90 border border-amber-400/50 shadow-xl relative overflow-hidden mb-6">
            <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
              Undangan Resmi Ditujukan Kepada:
            </div>
            <div className="font-playfair text-xl sm:text-2xl font-bold text-amber-200 leading-snug">
              {guest.name}
            </div>
            {guest.role && (
              <div className="text-xs sm:text-sm text-slate-300 italic mt-1">
                {guest.role}
              </div>
            )}
            <div className="mt-3 flex items-center justify-center gap-2">
              {guest.category ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {guest.category}
                </span>
              ) : null}
              {guest.code && (
                <span className="text-xs text-slate-400 font-mono">
                  Kode: #{guest.code}
                </span>
              )}
            </div>
          </div>

          {/* Key Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto text-left mb-6">
            <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-400/20 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Waktu Pelaksanaan
                </div>
                <div className="font-semibold text-sm text-slate-100 mt-0.5">
                  {EVENT_DETAILS.day}, {EVENT_DETAILS.dateFormatted}
                </div>
                <div className="text-xs text-amber-300 font-medium">
                  {EVENT_DETAILS.timeFormatted}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-400/20 flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Tempat / Venue
                </div>
                <div className="font-semibold text-sm text-slate-100 mt-0.5">
                  {EVENT_DETAILS.venue}
                </div>
                <div className="text-xs text-slate-300">
                  {EVENT_DETAILS.address}
                </div>
              </div>
            </div>
          </div>

          {/* Dresscode Notice */}
          <div className="inline-block p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200">
            <span className="font-bold uppercase tracking-wider">Ketentuan Busana:</span>{' '}
            {EVENT_DETAILS.dresscode}
          </div>
        </section>

        {/* Section 1: Countdown Timer */}
        <CountdownTimer />

        {/* Section 2: Susunan Acara (Rundown) */}
        <RundownSection />

        {/* Section 3: Lokasi & Peta */}
        <LocationSection />

        {/* Section 4: RSVP & Guestbook */}
        <RsvpSection guest={guest} />

        {/* Official Closing Statement */}
        <section className="my-10 text-center space-y-4 max-w-2xl mx-auto px-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu kepada jajaran pengurus DPW IKA UII DIY.
          </p>
          <div className="font-arabic text-xl text-amber-200">
            جَزَاكُمُ اللهُ خَيْرًا كَثِيْرًا
          </div>
          <p className="text-xs sm:text-sm font-semibold text-amber-300">
            Wassalamu'alaikum Warahmatullahi Wabarakatuh
          </p>

          <div className="pt-6 border-t border-slate-800 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
              Hormat Kami,
            </p>
            <p className="font-cinzel text-sm sm:text-base font-bold text-slate-200">
              Panitia Pelantikan Pengurus DPW IKA UII DIY
            </p>
            <p className="text-xs text-amber-400 mt-0.5">
              Masa Khidmah 2026 – 2031
            </p>
          </div>
        </section>
      </main>

      {/* E-Pass Ticket Modal */}
      <GuestTicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        guest={guest}
      />
    </div>
  );
};
