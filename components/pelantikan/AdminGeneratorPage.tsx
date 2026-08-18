import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Copy,
  Check,
  Share2,
  Code2,
  Music,
  User,
  Building,
  Users,
  ExternalLink,
  Eye,
  Volume2,
  Play,
  Pause,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PRESET_VIP_GUESTS, MUSIC_PRESETS, EVENT_DETAILS, GuestWish, GalleryItem, MusicTrack } from '@/data/eventData';
import { generateInvitationUrl, generateWhatsAppShareText, generateEmbedIframeCode, GuestInfo } from '@/utils/urlHelper';
import { MainInvitation } from '@/components/pelantikan/MainInvitation';
import { UiiLogoBadge } from './HeaderDecorations';
import { invitationAudio } from '@/utils/audioHelper';

interface AdminGeneratorPageProps {
  onGoToLiveInvitation: (guest: GuestInfo) => void;
}

export const AdminGeneratorPage: React.FC<AdminGeneratorPageProps> = ({
  onGoToLiveInvitation,
}) => {
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [category, setCategory] = useState<string>('VIP');
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack>(MUSIC_PRESETS[0]);
  const [customAudioUrl, setCustomAudioUrl] = useState<string>('');

  // Copy status indicators
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedWa, setCopiedWa] = useState<boolean>(false);
  const [copiedIframe, setCopiedIframe] = useState<boolean>(false);

  // Audio testing
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(invitationAudio.getStatus());

  const currentGuest: GuestInfo = {
    name: name.trim() || 'Tamu Undangan',
    role: role.trim(),
    category: category as GuestInfo['category'],
    code:
      'IKAUII-' +
      Math.abs(
        (name.trim() || 'Tamu')
          .split('')
          .reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)
      )
        .toString(36)
        .toUpperCase()
        .slice(0, 6),
  };

  const musicUrlParam =
    selectedMusic.type === 'url' && selectedMusic.url
      ? selectedMusic.url
      : customAudioUrl.trim()
      ? customAudioUrl.trim()
      : undefined;

  // The live URLs
  const canonicalGuestUrl = generateInvitationUrl(
    name,
    role,
    category,
    musicUrlParam,
    false,
    'canonical'
  );

  const localTestUrl = generateInvitationUrl(
    name,
    role,
    category,
    musicUrlParam,
    false,
    'current'
  );

  const embedCode = generateEmbedIframeCode(
    name,
    role,
    category,
    musicUrlParam
  );

  const waShareText = generateWhatsAppShareText(name, role, canonicalGuestUrl);

  const handleCopy = (type: 'url' | 'wa' | 'iframe', text: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === 'wa') {
      setCopiedWa(true);
      setTimeout(() => setCopiedWa(false), 2000);
    } else if (type === 'iframe') {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    }
  };

  const handleSelectPreset = (preset: (typeof PRESET_VIP_GUESTS)[0]) => {
    setName(preset.name);
    setRole(preset.role);
    setCategory(preset.category);
  };

  const handleSelectMusicPreset = (preset: (typeof MUSIC_PRESETS)[0]) => {
    setSelectedMusic(preset);
    setCustomAudioUrl(preset.url || '');
    invitationAudio.setTrack(preset);
    invitationAudio.play();
    setIsPlayingAudio(true);
  };

  const handleToggleAudio = () => {
    const nextStatus = invitationAudio.toggle();
    setIsPlayingAudio(nextStatus);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Banner */}
      <header className="sticky top-0 z-30 w-full bg-[#0a1832] border-b border-amber-400/30 px-4 sm:px-8 py-3.5 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UiiLogoBadge size={44} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-base sm:text-lg font-bold text-white tracking-wide">
                  Panel Pengaturan Undangan IKA UII DIY
                </h1>
                <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[11px] font-mono border border-amber-400/30">
                  ikadiy.uii.ac.id/undangankirim
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Atur nama tamu, musik pengiring, dan dapatkan tautan resmi untuk disematkan ke web utama (<code>ikadiy.uii.ac.id/pelantikan</code>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onGoToLiveInvitation(currentGuest)}
              className="px-3.5 py-1.5 rounded-lg gold-gradient-bg text-slate-950 text-xs font-bold shadow hover:brightness-105 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Buka Pratinjau Layar Penuh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Controls & Generation Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Guest Personalization Form */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0e2142]/90 border border-amber-400/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                <h2 className="font-cinzel text-base font-bold text-amber-200">
                  1. Data Personalisasi Tamu
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                Otomatis tampil pada amplop & e-Pass QR
              </span>
            </div>

            {/* Quick VIP Presets */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Preset Tokoh Cepat:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_VIP_GUESTS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer ${
                      name === preset.name
                        ? 'bg-amber-400 text-slate-950 font-bold shadow'
                        : 'bg-slate-900/90 text-slate-300 border border-slate-700 hover:border-amber-400/50'
                    }`}
                  >
                    {preset.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                Nama Lengkap & Gelar Tamu *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-amber-400/70" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Prof. Dr. Ir. Hari Purnomo, M.T., IPU., ASEAN Eng."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs sm:text-sm outline-none"
                />
              </div>
            </div>

            {/* Role & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Jabatan / Instansi
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-2.5 w-4 h-4 text-amber-400/70" />
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Contoh: Rektor Universitas Islam Indonesia"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                  Kategori VIP
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 w-4 h-4 text-amber-400/70" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs sm:text-sm outline-none"
                  >
                    <option value="VVIP">VVIP (Rektor & Pejabat Tinggi)</option>
                    <option value="VIP">VIP (Tamu Utama)</option>
                    <option value="Tamu Kehormatan">Tamu Kehormatan</option>
                    <option value="Pengurus">Pengurus DPW IKA UII DIY</option>
                    <option value="Alumni">Alumni Lintas Angkatan</option>
                    <option value="Undangan Umum">Undangan Umum</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Music Customization */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0e2142]/90 border border-amber-400/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <h2 className="font-cinzel text-base font-bold text-amber-200">
                  2. Pilihan Musik Pengiring
                </h2>
              </div>
              <button
                onClick={handleToggleAudio}
                className="flex items-center gap-1.5 text-xs text-amber-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 hover:border-amber-400/50 cursor-pointer"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlayingAudio ? 'Jeda Audio' : 'Tes Putar Audio'}</span>
              </button>
            </div>

            <div className="space-y-2">
              {MUSIC_PRESETS.map((preset) => {
                const isSelected = selectedMusic.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectMusicPreset(preset)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/60 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className={`text-xs sm:text-sm font-semibold ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
                        {preset.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {preset.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="shrink-0 p-1 rounded-full bg-amber-400 text-slate-950">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Atau Tautkan URL Audio MP3 Eksternal:
              </label>
              <input
                type="url"
                value={customAudioUrl}
                onChange={(e) => {
                  setCustomAudioUrl(e.target.value);
                  if (e.target.value.trim()) {
                    const customTrack: MusicTrack = {
                      id: 'custom-' + Date.now(),
                      title: 'Audio Kustom',
                      description: e.target.value,
                      type: 'url',
                      url: e.target.value.trim(),
                    };
                    setSelectedMusic(customTrack);
                    invitationAudio.setTrack(customTrack);
                    invitationAudio.play();
                    setIsPlayingAudio(true);
                  }
                }}
                placeholder="https://ikadiy.uii.ac.id/audio/hymne-uii.mp3"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Jika diisi, parameter audio (<code>?audio=...</code>) otomatis disematkan sehingga tamu memutar lagu ini.
              </p>
            </div>
          </div>

          {/* Card 3: Output & Integration Codes */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0e2142]/90 border border-amber-400/30 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-cinzel text-base font-bold text-amber-200">
                3. Tautan Undangan & Kode Embed
              </h2>
              <p className="text-xs text-slate-300">
                Hasil parameter siap kirim dan siap dipasang pada website utama.
              </p>
            </div>

            {/* Tautan URL Resmi */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300">
                  A. Tautan Undangan Resmi untuk Tamu (ikadiy.uii.ac.id/pelantikan):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  GET Parameter
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-400/25 font-mono text-xs text-amber-200 break-all select-all flex items-center justify-between gap-2">
                <span>{canonicalGuestUrl}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy('url', canonicalGuestUrl)}
                  className="flex-1 py-2 px-3 rounded-lg gold-gradient-bg text-slate-950 font-bold text-xs hover:brightness-105 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Tautan Berhasil Disalin!' : 'Salin Tautan Resmi'}</span>
                </button>

                <button
                  onClick={() => handleCopy('wa', waShareText)}
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  {copiedWa ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedWa ? 'Pesan Disalin!' : 'Salin Draf WhatsApp'}</span>
                </button>
              </div>
            </div>

            {/* Kode Embed Iframe */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-300">
                  B. Kode Iframe untuk Disematkan ke Website Utama (Embed):
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Murni Tanpa Tombol Setting
                </span>
              </div>
              <textarea
                readOnly
                rows={3}
                value={embedCode}
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200 outline-none select-all"
              />
              <button
                onClick={() => handleCopy('iframe', embedCode)}
                className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedIframe ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code2 className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copiedIframe ? 'Kode Embed Disalin!' : 'Salin Kode Iframe Embed'}</span>
              </button>
            </div>
          </div>

          {/* Card 4: Guest List Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0e2142]/90 border border-amber-400/30 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h2 className="font-cinzel text-base font-bold text-amber-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                4. Daftar Preset Tamu & Tautan Cepat
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Tabel untuk generate URL unik dari daftar tokoh (VIP/VVIP) yang telah dikonfigurasi.
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold">Nama</th>
                    <th className="py-2.5 px-3 font-semibold">Jabatan</th>
                    <th className="py-2.5 px-3 font-semibold">Kategori</th>
                    <th className="py-2.5 px-3 font-semibold text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {PRESET_VIP_GUESTS.map((preset, idx) => {
                    const presetUrl = generateInvitationUrl(
                      preset.name,
                      preset.role || '',
                      preset.category || '',
                      musicUrlParam,
                      false,
                      'canonical'
                    );
                    const presetWa = generateWhatsAppShareText(preset.name, preset.role || '', presetUrl);
                    
                    return (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-3 text-amber-100 font-medium">{preset.name}</td>
                        <td className="py-3 px-3 text-slate-300">{preset.role || '-'}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] border border-slate-700">
                            {preset.category || 'Umum'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleCopy('url', presetUrl)}
                              className="p-1.5 rounded-md bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 border border-amber-400/30 transition-colors cursor-pointer"
                              title="Salin Tautan"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopy('wa', presetWa)}
                              className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                              title="Salin Pesan WA"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Pure Guest Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="p-4 rounded-2xl bg-[#091730] border border-amber-400/30 shadow-2xl space-y-3">
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-cinzel text-xs font-bold text-amber-200 uppercase tracking-wide">
                    Pratinjau Murni Tamu
                  </span>
                </div>

                {/* Switcher Removed for Admin */}
              </div>

              <p className="text-[11px] text-slate-400">
                Ini adalah tampilan persis yang dilihat tamu di web <code>ikadiy.uii.ac.id/pelantikan</code> (bebas tombol pengaturan & generator).
              </p>

              {/* Mock Screen Bezel */}
              <div className="relative w-full h-[620px] rounded-xl border-2 border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col">
                {/* Browser address bar mockup */}
                <div className="bg-slate-900/90 px-3 py-1.5 border-b border-slate-800 flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 bg-slate-950 px-2 py-0.5 rounded text-slate-300 font-mono truncate text-[9px]">
                    ikadiy.uii.ac.id/pelantikan?to={encodeURIComponent(currentGuest.name)}
                  </div>
                </div>

                {/* Inner Content Component */}
                <div className="flex-1 overflow-y-auto relative">
                  <div className="relative min-h-full">
                    <MainInvitation
                      guest={currentGuest}
                      onBackToCover={() => {}}
                      onUpdateGuest={() => {}}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => onGoToLiveInvitation(currentGuest)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Uji Interaksi Layar Penuh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
