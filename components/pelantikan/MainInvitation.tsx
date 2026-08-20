import React, { useState } from 'react';
import { Calendar, MapPin, ShieldCheck } from 'lucide-react';
import { GuestInfo } from '@/data/eventData';
import { EVENT_DETAILS } from '@/data/eventData';
import { UiiLogoBadge, BatikCorner, GununganWayang, JogloSilhouette } from './HeaderDecorations';
import { CountdownTimer } from './CountdownTimer';
import { RundownSection } from './RundownSection';
import { LocationSection } from './LocationSection';
import { RsvpSection } from './RsvpSection';

import { InvitationSettings } from '@/lib/invitation-settings';

interface MainInvitationProps {
  guest: GuestInfo;
  onBackToCover: () => void;
  onUpdateGuest?: (name: string, role: string, category: string) => void;
  dynamicSettings: InvitationSettings;
}

export const MainInvitation: React.FC<MainInvitationProps> = ({ guest, onBackToCover, dynamicSettings }) => {  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20 relative overflow-x-hidden selection:bg-amber-500 selection:text-slate-950">
      {/* Background Decorative Ambient */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-amber-500/5 blur-[120px] pointer-events-none -z-10" />

      {/* Javanese Top Silhouette */}
      <div className="absolute top-0 left-0 w-full h-48 sm:h-64 opacity-20 pointer-events-none -z-10 overflow-hidden">
        <JogloSilhouette className="w-full h-full object-cover scale-110" />
      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 pt-6 sm:pt-10">
        {/* Hero Card Section */}
        <section className="relative rounded-3xl bg-gradient-to-b from-[#0e2142] via-[#091730] to-[#050e1e] border-2 border-amber-400/40 p-6 sm:p-10 shadow-2xl text-center overflow-hidden mb-8">
          <BatikCorner position="tl" className="absolute top-0 left-0" />
          <BatikCorner position="tr" className="absolute top-0 right-0" />
          <BatikCorner position="bl" className="absolute bottom-0 left-0" />
          <BatikCorner position="br" className="absolute bottom-0 right-0" />

          {/* Center Insignia */}
          <div className="flex justify-center mb-4">
            <UiiLogoBadge size={84} />
          </div>

          <div className="space-y-1 mb-5">
            <p className="text-xs sm:text-sm font-bold tracking-widest text-amber-300 uppercase">
              {dynamicSettings.orgName}
            </p>
            <p className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-300 uppercase">
              {dynamicSettings.subOrgName}
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
            {dynamicSettings.openingGreeting || 'Dengan memohon rahmat dan ridho Allah SWT, Kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara:'}
          </p>

          {/* Event Title Banner */}
          <div className="py-4 border-y border-amber-400/30 max-w-2xl mx-auto my-6">
            <h1 className="font-cinzel text-3xl sm:text-4xl md:text-5xl font-black tracking-wide text-white mb-2">
              {dynamicSettings.title.toUpperCase()}
            </h1>
            <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-extrabold gold-gradient-text tracking-wider mb-2">
              {dynamicSettings.subOrgName.toUpperCase()}
            </h2>
            <div className="inline-block px-4 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs sm:text-sm font-bold tracking-widest">
              {dynamicSettings.period}
            </div>
          </div>

          {/* Theme */}
          <p className="text-xs sm:text-sm font-serif-playfair text-amber-100/90 italic max-w-lg mx-auto mb-8">
            "{dynamicSettings.theme}"
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
                  {dynamicSettings.day}, {dynamicSettings.dateFormatted}
                </div>
                <div className="text-xs text-amber-300 font-medium">
                  {dynamicSettings.timeFormatted}
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
                  {dynamicSettings.venue}
                </div>
                <div className="text-xs text-slate-300">
                  {dynamicSettings.address}
                </div>
              </div>
            </div>
          </div>

          {/* Live Streaming Button (if available) */}
          {dynamicSettings.liveStreamUrl && dynamicSettings.liveStreamUrl.trim() !== '' && (
            <div className="mb-6">
              <a 
                href={dynamicSettings.liveStreamUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-red-600/20 border border-red-500/50 text-red-200 font-semibold text-sm hover:bg-red-600/30 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                Tonton Live Streaming
              </a>
            </div>
          )}

          {/* Dresscode Notice */}
          <div className="inline-block p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 relative z-10">
            <span className="font-bold uppercase tracking-wider">Ketentuan Busana:</span>{' '}
            {dynamicSettings.dresscode}
          </div>

          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 h-48 opacity-20 pointer-events-none flex justify-center z-0">
             <GununganWayang className="w-full h-full" />
          </div>
        </section>

        {/* Section 1: Countdown Timer */}
        {dynamicSettings.targetDateTime && dynamicSettings.targetDateTime.trim() !== '' && (
          <CountdownTimer targetDateTime={dynamicSettings.targetDateTime} />
        )}

        {/* Section 2: Susunan Acara (Rundown) */}
        {dynamicSettings.rundown && dynamicSettings.rundown.length > 0 && (
          <RundownSection rundown={dynamicSettings.rundown} />
        )}

        {/* Section 3: Lokasi & Peta */}
        <LocationSection dynamicSettings={dynamicSettings} />

        {/* Section 4: RSVP & Guestbook */}
        <RsvpSection guest={guest} dynamicSettings={dynamicSettings} />

        {/* Section 5: Gallery / Media */}
        {dynamicSettings.mediaUrls && dynamicSettings.mediaUrls.length > 0 && (
          <section className="w-full max-w-3xl mx-auto my-8 px-4">
            <div className="relative rounded-2xl bg-gradient-to-b from-[#0e2142]/90 to-[#081326]/95 border border-amber-400/50 p-5 sm:p-8 shadow-xl backdrop-blur-md">
              <div className="text-center mb-6">
                <h2 className="font-cinzel text-xl sm:text-2xl font-bold gold-gradient-text tracking-wide">
                  Galeri Ucapan
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
                  Video atau momen spesial persembahan untuk pelantikan pengurus.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {dynamicSettings.mediaUrls.filter(url => url.trim() !== '').map((url, idx) => {
                  const isYoutube = url.includes('youtube.com') || url.includes('youtu.be');
                  const isRawVideo = url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');

                  return (
                    <div key={idx} className={`rounded-xl overflow-hidden border-2 border-amber-400/40 shadow-2xl relative bg-slate-900/50 flex items-center justify-center ${isYoutube ? 'aspect-video' : 'w-full'}`}>
                      {isYoutube ? (
                        <iframe
                          className="w-full h-full absolute inset-0"
                          src={url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                          title={`Video Ucapan ${idx+1}`}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      ) : isRawVideo ? (
                        <video src={url} controls playsInline className="w-full h-auto object-contain max-h-[80vh]" />
                      ) : (
                        <img src={url} alt={`Galeri Ucapan ${idx+1}`} className="w-full h-auto object-contain max-h-[80vh]" loading="lazy" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Official Closing Statement */}
        <section className="my-10 text-center space-y-4 max-w-2xl mx-auto px-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir serta memberikan doa restu kepada jajaran pengurus DPW IKA UII DIY.
          </p>
          <div className="font-arabic text-xl text-amber-200">
            جَزَاكُمُ اللهُ خَيْرًا كَثِيْرًا
          </div>
          <p className="text-xs sm:text-sm font-semibold text-amber-300">
            Wassalamu&apos;alaikum Warahmatullahi Wabarakatuh
          </p>

          <div className="pt-6 border-t border-slate-800 text-center">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">
              Hormat Kami,
            </p>
            <p className="font-cinzel text-sm sm:text-base font-bold text-slate-200">
              Panitia Pelantikan Pengurus DPW IKA UII DIY
            </p>
            
          </div>
        </section>
      </main>


    </div>
  );
};
