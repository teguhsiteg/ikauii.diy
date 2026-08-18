import React, { useState } from 'react';
import { Send, CheckCircle2, MessageSquare, Heart, UserCheck } from 'lucide-react';
import { GuestInfo, GuestWish } from '@/data/eventData';
import { EVENT_DETAILS, INITIAL_WISHES } from '@/data/eventData';

interface RsvpSectionProps {
  guest: GuestInfo;
}

export const RsvpSection: React.FC<RsvpSectionProps> = ({ guest }) => {
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
  const [status, setStatus] = useState<'hadir' | 'ragu' | 'tidak_hadir'>('hadir');
  const [pax, setPax] = useState<number>(1);
  const [message, setMessage] = useState<string>('');
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const handleSubmitRsvp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newWish: GuestWish = {
      id: 'wish-' + Date.now(),
      name: name.trim(),
      role: role.trim() || undefined,
      status: status,
      pax: status === 'hadir' ? pax : 0,
      message:
        message.trim() ||
        (status === 'hadir'
          ? 'InsyaAllah hadir. Sukses untuk Pelantikan DPW IKA UII DIY!'
          : 'Mohon maaf belum dapat hadir, salam sukses untuk seluruh pengurus.'),
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

    const statusText =
      status === 'hadir'
        ? `Hadir (${pax} Orang)`
        : status === 'ragu'
        ? 'Masih Ragu / Menyesuaikan Jadwal'
        : 'Tidak Dapat Hadir';

    const waText = encodeURIComponent(
      `*KONFIRMASI KEHADIRAN (RSVP) PELANTIKAN DPW IKA UII DIY 2026-2031*\n\n` +
        `Nama: ${name}\n` +
        `Jabatan/Instansi: ${role || '-'}\n` +
        `Status Kehadiran: ${statusText}\n` +
        `Ucapan & Doa: ${message || '-'}\n\n` +
        `_Terkonfirmasi melalui Undangan Digital Resmi_`
    );

    const waUrl = `https://wa.me/${EVENT_DETAILS.contactPhone}?text=${waText}`;
    window.open(waUrl, '_blank');
  };

  return (
    <section id="rsvp-section" className="w-full max-w-3xl mx-auto my-8 px-4">
      <div className="relative rounded-2xl bg-gradient-to-b from-[#0e2142]/90 to-[#081326]/95 border border-amber-400/35 p-5 sm:p-8 shadow-xl backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 text-xs font-semibold uppercase tracking-widest border border-amber-400/25 mb-2">
            <UserCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Buku Tamu & RSVP</span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl font-bold gold-gradient-text tracking-wide">
            KONFIRMASI KEHADIRAN
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto">
            Mohon konfirmasi kehadiran Bapak/Ibu/Saudara/i untuk kenyamanan penataan tempat & jamuan.
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Konfirmasi Kehadiran *
              </label>
              <select
                id="rsvp-select-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'hadir' | 'ragu' | 'tidak_hadir')}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs sm:text-sm outline-none"
              >
                <option value="hadir">InsyaAllah Hadir</option>
                <option value="ragu">Masih Ragu / Menyesuaikan Jadwal</option>
                <option value="tidak_hadir">Mohon Maaf Belum Bisa Hadir</option>
              </select>
            </div>

            {status === 'hadir' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Jumlah Tamu Hadir
                </label>
                <select
                  id="rsvp-select-pax"
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs sm:text-sm outline-none"
                >
                  <option value={1}>1 Orang (Tamu Undangan)</option>
                  <option value={2}>2 Orang (Bersama Pendamping)</option>
                </select>
              </div>
            )}
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
            className="w-full py-2.5 px-4 rounded-xl gold-gradient-bg text-slate-950 font-bold text-xs sm:text-sm shadow flex items-center justify-center gap-2 hover:brightness-105 cursor-pointer transition-all"
          >
            <Send className="w-4 h-4 text-slate-950" />
            <span>Kirim Konfirmasi & Teruskan ke WhatsApp Panitia</span>
          </button>

          {isSubmitted && (
            <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                Konfirmasi Anda telah tersimpan dan dialihkan ke WhatsApp Panitia ({EVENT_DETAILS.contactPerson}).
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
                  Jadilah yang pertama menyampaikan ucapan & konfirmasi kehadiran.
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
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        w.status === 'hadir'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : w.status === 'ragu'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-700/30 text-slate-400'
                      }`}
                    >
                      {w.status === 'hadir'
                        ? 'Hadir'
                        : w.status === 'ragu'
                        ? 'Ragu'
                        : 'Tidak Hadir'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    "{w.message}"
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
              href={`https://wa.me/${EVENT_DETAILS.contactPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-300 hover:underline font-semibold"
            >
              {EVENT_DETAILS.contactPerson} ({EVENT_DETAILS.contactPhoneDisplay})
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
