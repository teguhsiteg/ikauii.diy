import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, Heart, UserCheck } from 'lucide-react';
import { GuestInfo, GuestWish, INITIAL_WISHES } from '@/data/eventData';
import { InvitationSettings } from '@/lib/invitation-settings';

interface RsvpSectionProps {
  guest: GuestInfo;
  dynamicSettings: InvitationSettings;
}

export const RsvpSection: React.FC<RsvpSectionProps> = ({ guest, dynamicSettings }) => {
  const [wishes, setWishes] = useState<GuestWish[]>(() => {
    try {
      const saved = localStorage.getItem('ika_uii_guest_wishes');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return INITIAL_WISHES;
  });

  const [name, setName] = useState<string>(guest.name || '');
  const [role, setRole] = useState<string>(guest.role || '');
  const [message, setMessage] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmitRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWish: GuestWish = {
      id: 'wish-' + Date.now(),
      name: name.trim(),
      role: role.trim() || undefined,
      message:
        message.trim() ||
        'Selamat atas pelantikan pengurus baru, semoga amanah dan sukses selalu.',
      timestamp: 'Baru saja',
    };

    const updated = [newWish, ...wishes];
    setWishes(updated);
    try {
      localStorage.setItem('ika_uii_guest_wishes', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setIsSubmitted(true);
    // Reset form after 3 seconds
    setTimeout(() => {
      setName(guest.name || '');
      setRole(guest.role || '');
      setMessage('');
      setIsSubmitted(false);
    }, 3000);
  };

  return (
    <section id="rsvp-section" className="w-full max-w-3xl mx-auto my-8 px-4">
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0e2142]/90 to-[#081326]/95 border border-amber-400/35 p-5 sm:p-8 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-400/25 mb-2">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Buku Tamu</span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold gold-gradient-text tracking-wide">
            Ucapan dan Do'a
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Sampaikan ucapan selamat dan doa restu untuk kepengurusan DPW IKA UII DIY periode 2026-2031.
          </p>
        </div>

        {/* RSVP Form */}
        <form
          onSubmit={handleSubmitRsvp}
          className="space-y-3.5 mb-8 bg-slate-900/70 p-5 rounded-xl border border-amber-400/20"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Nama Lengkap & Gelar *
            </label>
            <input
              id="rsvp-input-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Prof. Dr. Ir. Hari Purnomo, M.T., IPU., ASEAN Eng."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs sm:text-sm outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Jabatan / Instansi / Angkatan Alumni
            </label>
            <input
              id="rsvp-input-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Contoh: Rektor UII / Alumni Fakultas Teknik"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs sm:text-sm outline-none"
            />
          </div>



          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
              Ucapan, Doa & Harapan untuk DPW IKA UII DIY
            </label>
            <textarea
              id="rsvp-input-message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tuliskan ucapan selamat atau harapan atas pelantikan pengurus..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs sm:text-sm outline-none resize-none"
            />
          </div>

          <button
            id="btn-submit-rsvp"
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0e2142] border-2 border-amber-500 font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Send className="w-4 h-4 text-[#0e2142]" />
            <span>Kirim Ucapan & Doa</span>
          </button>

          {isSubmitted && (
            <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                Ucapan dan doa Anda telah tersimpan dan masuk ke daftar buku tamu.
              </span>
            </div>
          )}
        </form>

        {/* Guestbook Messages Wall */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span>Untaian Doa & Ucapan Tamu ({wishes.length})</span>
            </div>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {wishes.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 space-y-1">
                <Heart className="w-5 h-5 text-amber-400/40 mx-auto mb-1" />
                <p className="text-xs font-medium text-slate-300">
                  Belum ada ucapan & doa restu.
                </p>
                <p className="text-[11px] text-slate-500">
                  Jadilah yang pertama menyampaikan ucapan dan doa restu.
                </p>
              </div>
            ) : (
              wishes.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/90 text-left space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-xs text-slate-100">{w.name}</span>
                      {w.role && (
                        <span className="text-[11px] text-amber-300/80">({w.role})</span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    &quot;{w.message}&quot;
                  </p>

                  <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                    <span>{w.timestamp}</span>
                    <Heart className="w-3 h-3 text-rose-400/40" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contact Help */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          <p>
            Narahubung Panitia:{' '}
            <a
              href={`https://wa.me/${dynamicSettings.contactPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:underline font-semibold"
            >
              {dynamicSettings.contactPerson} ({dynamicSettings.contactPhoneDisplay})
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
