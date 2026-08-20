import React from 'react';
import { MapPin, Navigation, CalendarPlus, Download } from 'lucide-react';
import { getGoogleCalendarUrl, downloadIcsFile } from '@/utils/calendarHelper';
import { InvitationSettings } from '@/lib/invitation-settings';

export const LocationSection: React.FC<{ dynamicSettings: InvitationSettings }> = ({ dynamicSettings }) => {
  return (
    <section id="lokasi-section" className="w-full max-w-3xl mx-auto my-10 px-4">
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0e2142]/90 to-[#081326]/95 border border-amber-400/35 p-5 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-400/25 mb-2">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Lokasi Acara</span>
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl font-bold gold-gradient-text tracking-wide">
            TEMPAT & WAKTU
          </h2>
        </div>

        {/* Venue Information */}
        <div className="p-4 sm:p-6 rounded-xl bg-slate-900/80 border border-amber-400/20 text-center mb-6">
          <h3 className="font-playfair text-xl sm:text-2xl font-bold text-amber-200 mb-1.5">
            {dynamicSettings.venue}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            {dynamicSettings.address}
          </p>

          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-amber-300">
            <span className="bg-amber-500/10 px-3 py-1 rounded-md border border-amber-400/20">
              📅 {dynamicSettings.day}, {dynamicSettings.dateFormatted}
            </span>
            <span className="bg-amber-500/10 px-3 py-1 rounded-md border border-amber-400/20">
              ⏰ {dynamicSettings.timeFormatted}
            </span>
          </div>
        </div>

        {/* Embedded Map Visual */}
        <div className="w-full h-64 sm:h-72 rounded-xl overflow-hidden border border-amber-400/30 mb-6 bg-slate-950">
          <iframe
            title="Lokasi Pendopo Parasamya Sleman"
            src="https://maps.google.com/maps?q=Pendopo+Parasamya+Kabupaten+Sleman&t=&z=16&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            id="btn-open-gmaps"
            href={dynamicSettings.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all text-center"
          >
            <Navigation className="w-4 h-4" />
            <span>Petunjuk Arah (Maps)</span>
          </a>

          <a
            id="btn-add-gcalendar"
            href={getGoogleCalendarUrl(`${dynamicSettings.title} ${dynamicSettings.subOrgName}`, dynamicSettings.targetDateTime, dynamicSettings.venue, dynamicSettings.address)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/30 text-amber-300 font-semibold text-xs sm:text-sm transition-all text-center"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Google Calendar</span>
          </a>

          <button
            id="btn-download-ics"
            onClick={() => downloadIcsFile(`${dynamicSettings.title} ${dynamicSettings.subOrgName}`, dynamicSettings.targetDateTime, dynamicSettings.venue, dynamicSettings.address)}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-amber-400/30 text-slate-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer text-center"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Kalender (.ics)</span>
          </button>
        </div>
      </div>
    </section>
  );
};
