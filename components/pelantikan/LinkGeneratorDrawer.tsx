import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Share2,
  Code2,
  Music,
  User,
  Building,
  Users,
  ExternalLink,
  Sliders,
} from 'lucide-react';
import { PRESET_VIP_GUESTS, MUSIC_PRESETS } from '@/data/eventData';
import {
  generateInvitationUrl,
  generateWhatsAppShareText,
  generateEmbedIframeCode,
} from '@/utils/urlHelper';
import { invitationAudio } from '@/utils/audioHelper';

interface LinkGeneratorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentGuestName: string;
  currentGuestRole?: string;
  onApplyToCurrentView?: (name: string, role: string, category: string) => void;
}

export const LinkGeneratorDrawer: React.FC<LinkGeneratorDrawerProps> = ({
  isOpen,
  onClose,
  currentGuestName,
  currentGuestRole = '',
  onApplyToCurrentView,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'embed' | 'music'>('link');

  // Link & Guest State
  const [name, setName] = useState<string>(
    currentGuestName || 'Prof. Dr. Ir. Hari Purnomo, M.T., IPU., ASEAN Eng.'
  );
  const [role, setRole] = useState<string>(
    currentGuestRole || 'Rektor Universitas Islam Indonesia'
  );
  const [category, setCategory] = useState<string>('VVIP');
  const [customAudioUrl, setCustomAudioUrl] = useState<string>('');

  // Copy states
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedMessage, setCopiedMessage] = useState<boolean>(false);
  const [copiedEmbed, setCopiedEmbed] = useState<boolean>(false);

  if (!isOpen) return null;

  const generatedUrl = generateInvitationUrl(
    name,
    role,
    category,
    customAudioUrl || undefined
  );
  const waShareText = generateWhatsAppShareText(name, role, generatedUrl);
  const embedCode = generateEmbedIframeCode(
    name,
    role,
    category,
    customAudioUrl || undefined
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(waShareText);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const handleOpenWhatsAppDirect = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(waShareText)}`;
    window.open(url, '_blank');
  };

  const handleSelectPreset = (preset: (typeof PRESET_VIP_GUESTS)[0]) => {
    setName(preset.name);
    setRole(preset.role);
    setCategory(preset.category);
  };

  const handleApplyPreview = () => {
    if (onApplyToCurrentView) {
      onApplyToCurrentView(name, role, category);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', generatedUrl);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        className="relative w-full max-w-xl bg-gradient-to-b from-[#0e2142] via-[#091730] to-[#050e1e] border border-amber-400/35 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[11px] font-semibold uppercase tracking-wider mb-1 border border-amber-400/25">
            <span>Alat Panitia & Pengaturan Integrasi</span>
          </div>
          <h3 className="font-cinzel text-xl sm:text-2xl font-bold gold-gradient-text">
            Kustomisasi & Integrasi Undangan
          </h3>
          <p className="text-xs text-slate-300">
            Kelola personalisasi nama tamu, integrasi embed ke website utama, dan pilihan musik.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 mb-4 gap-1">
          <button
            onClick={() => setActiveTab('link')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'link'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Tautan & WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('embed')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'embed'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Embed ke Web Utama</span>
          </button>

          <button
            onClick={() => setActiveTab('music')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'music'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Kustom Musik</span>
          </button>
        </div>

        {/* TAB 1: Link & WhatsApp */}
        {activeTab === 'link' && (
          <div>
            {/* Quick Presets */}
            <div className="mb-3">
              <div className="text-[11px] font-medium text-slate-400 mb-1.5">
                Contoh Tokoh / Preset Cepat:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_VIP_GUESTS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                      name === preset.name
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-amber-400/50'
                    }`}
                  >
                    {preset.name.split(',')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-2.5 mb-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Lengkap & Gelar Tamu
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-3.5 h-3.5 text-amber-400/70" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Prof. Dr. Ir. Hari Purnomo, M.T."
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Jabatan / Instansi
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-3.5 h-3.5 text-amber-400/70" />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      placeholder="Rektor UII / Bupati Sleman"
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Kategori Tamu
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-2.5 w-3.5 h-3.5 text-amber-400/70" />
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs outline-none"
                    >
                      <option value="VVIP">VVIP (Rektor / Pejabat Utama)</option>
                      <option value="VIP">VIP</option>
                      <option value="Tamu Kehormatan">Tamu Kehormatan</option>
                      <option value="Pengurus">Pengurus DPW IKA UII</option>
                      <option value="Alumni">Alumni Lintas Angkatan</option>
                      <option value="Undangan Umum">Undangan Umum</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated URL Box */}
            <div className="mb-3.5 p-3 rounded-xl bg-slate-950/90 border border-amber-400/25">
              <div className="text-[11px] font-semibold text-amber-300 mb-1">
                Tautan Personalisasi Terbentuk:
              </div>
              <div className="font-mono text-xs text-amber-200 break-all p-2 rounded bg-slate-900 border border-slate-800 select-all">
                {generatedUrl}
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl gold-gradient-bg text-slate-950 font-bold text-xs hover:brightness-105 cursor-pointer transition-all"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Tautan Disalin!' : 'Salin Tautan'}</span>
              </button>

              <button
                onClick={handleOpenWhatsAppDirect}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim via WhatsApp</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopyMessage}
                className="flex-1 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              >
                {copiedMessage ? 'Teks Pesan Disalin!' : 'Salin Draf Pesan Formal'}
              </button>

              <button
                onClick={handleApplyPreview}
                className="flex-1 py-2 px-3 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Terapkan ke Layar
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Embed Code for Main Website */}
        {activeTab === 'embed' && (
          <div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Anda dapat menyematkan (embed) landing page undangan ini ke website utama IKA UII, portal universitas, atau CMS seperti WordPress menggunakan kode iframe berikut:
            </p>

            <div className="mb-3.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1.5">
                Kode HTML / Iframe:
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  rows={4}
                  value={embedCode}
                  className="w-full p-3 font-mono text-[11px] bg-slate-950 border border-amber-400/30 rounded-xl text-slate-200 outline-none select-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              <button
                onClick={handleCopyEmbed}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl gold-gradient-bg text-slate-950 font-bold text-xs hover:brightness-105 cursor-pointer transition-all"
              >
                {copiedEmbed ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedEmbed ? 'Kode Embed Disalin!' : 'Salin Kode Iframe'}</span>
              </button>

              <a
                href={generatedUrl + (generatedUrl.includes('?') ? '&embed=true' : '?embed=true')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Pratinjau Mode Embed</span>
              </a>
            </div>

            {/* Embedding Guide Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="font-semibold text-amber-200">
                Panduan Pemasangan di Website Utama:
              </div>
              <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                <li>
                  <strong className="text-slate-300">WordPress / CMS:</strong> Buat laman baru (e.g. <code>/pelantikan-2026</code>), lalu tambahkan blok <em>Custom HTML</em> dan tempel kode di atas.
                </li>
                <li>
                  <strong className="text-slate-300">Responsif:</strong> Atribut <code>width="100%"</code> memastikan tampilan pas di laptop maupun layar ponsel.
                </li>
                <li>
                  <strong className="text-slate-300">Parameter Dinamis:</strong> Jika website utama memiliki query parameter tamu, Anda dapat meneruskannya ke atribut <code>src</code>.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: Music Customization */}
        {activeTab === 'music' && (
          <div>
            <div className="text-xs text-slate-300 mb-3">
              Pilih musik pengiring resmi atau tentukan URL MP3 kustom yang akan disertakan dalam tautan undangan.
            </div>

            {/* Presets */}
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Pilihan Musik Bawaan:
              </div>
              {MUSIC_PRESETS.map((preset) => {
                const currentTrack = invitationAudio.getCurrentTrack();
                const isSelected = currentTrack.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      invitationAudio.setTrack(preset);
                      invitationAudio.play();
                      if (preset.url) {
                        setCustomAudioUrl(preset.url);
                      } else {
                        setCustomAudioUrl('');
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-400/60'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className={`text-xs font-semibold ${isSelected ? 'text-amber-200' : 'text-slate-200'}`}>
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

            {/* Custom URL Input */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Atau Masukkan URL Audio / MP3 Kustom:
              </label>
              <input
                type="url"
                value={customAudioUrl}
                onChange={(e) => {
                  setCustomAudioUrl(e.target.value);
                  if (e.target.value.trim()) {
                    invitationAudio.setTrack({
                      id: 'custom-' + Date.now(),
                      title: 'Audio Kustom',
                      description: e.target.value,
                      type: 'url',
                      url: e.target.value.trim(),
                    });
                  }
                }}
                placeholder="https://domain-anda.com/musik-pelantikan.mp3"
                className="w-full px-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                URL ini akan otomatis disematkan ke parameter tautan undangan (<code>?audio=...</code>).
              </p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
