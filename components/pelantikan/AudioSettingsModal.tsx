import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Music, Volume2, Upload, Link as LinkIcon, Play, Pause, Check, Disc } from 'lucide-react';
import { MusicTrack } from '@/data/eventData';
import { MUSIC_PRESETS } from '@/data/eventData';
import { invitationAudio } from '@/utils/audioHelper';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrackForUrl?: (url: string) => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  onSelectTrackForUrl,
}) => {
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(invitationAudio.getCurrentTrack());
  const [isPlaying, setIsPlaying] = useState<boolean>(invitationAudio.getStatus());
  const [volume, setVolume] = useState<number>(invitationAudio.getVolume());
  const [customUrl, setCustomUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    const unsub = invitationAudio.subscribe(() => {
      setCurrentTrack(invitationAudio.getCurrentTrack());
      setIsPlaying(invitationAudio.getStatus());
      setVolume(invitationAudio.getVolume());
    });
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: (typeof MUSIC_PRESETS)[0]) => {
    setErrorMsg('');
    setSuccessMsg('');
    invitationAudio.setTrack(preset);
    if (!isPlaying) {
      invitationAudio.play();
    }
    if (onSelectTrackForUrl && preset.url) {
      onSelectTrackForUrl(preset.url);
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;

    try {
      const url = customUrl.trim();
      const track: MusicTrack = {
        id: 'custom-' + Date.now(),
        title: 'Audio Kustom URL',
        description: url.length > 45 ? url.substring(0, 45) + '...' : url,
        type: 'url',
        url: url,
      };
      invitationAudio.setTrack(track);
      invitationAudio.play();
      setSuccessMsg('Musik kustom berhasil diputar!');
      setErrorMsg('');
      if (onSelectTrackForUrl) {
        onSelectTrackForUrl(url);
      }
    } catch {
      setErrorMsg('Gagal memuat URL audio.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setErrorMsg('Harap pilih file audio (MP3, WAV, dsb.)');
      return;
    }

    try {
      const blobUrl = URL.createObjectURL(file);
      setUploadedFileName(file.name);
      const track: MusicTrack = {
        id: 'file-' + Date.now(),
        title: file.name,
        description: 'File audio lokal dari perangkat',
        type: 'file',
        url: blobUrl,
      };
      invitationAudio.setTrack(track);
      invitationAudio.play();
      setSuccessMsg(`File "${file.name}" berhasil dimuat.`);
      setErrorMsg('');
    } catch {
      setErrorMsg('Gagal memproses file audio.');
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    invitationAudio.setVolume(val);
  };

  const handleTogglePlay = () => {
    invitationAudio.toggle();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-lg bg-gradient-to-b from-[#0e2142] via-[#091730] to-[#040b18] border border-amber-400/40 rounded-2xl p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-cinzel text-xl font-bold text-white tracking-wide">
              Pengaturan Musik Acara
            </h3>
            <p className="text-xs text-slate-300">
              Sesuaikan alunan musik pengiring undangan digital
            </p>
          </div>
        </div>

        {/* Current Active Player Bar */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-amber-400/30 mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={handleTogglePlay}
              className={`p-2.5 rounded-full font-bold transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div className="text-left overflow-hidden">
              <div className="text-xs font-bold text-amber-200 truncate">
                {currentTrack.title}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Status: {isPlaying ? 'Sedang Diputar' : 'Dijeda'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Volume2 className="w-4 h-4 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-20 sm:w-24 accent-amber-400 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
            />
          </div>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Option 1: Formal Presets */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            1. Pilihan Musik Resmi:
          </label>
          <div className="space-y-2">
            {MUSIC_PRESETS.map((preset) => {
              const isSelected = currentTrack.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
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
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
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
        </div>

        {/* Option 2: Custom URL */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            2. Masukkan URL Audio / MP3 Kustom:
          </label>
          <form onSubmit={handleApplyCustomUrl} className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/hymne-uii.mp3"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950/90 border border-slate-700 focus:border-amber-400 text-slate-100 text-xs outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg gold-gradient-bg text-slate-950 text-xs font-bold hover:brightness-110 cursor-pointer shrink-0"
            >
              Terapkan
            </button>
          </form>
          <p className="text-[10px] text-slate-400 mt-1">
            Mendukung tautan langsung MP3, AAC, atau OGG publik.
          </p>
        </div>

        {/* Option 3: Local File Upload */}
        <div className="mb-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            3. Unggah Berkas Audio Sendiri:
          </label>
          <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-slate-700 hover:border-amber-400/50 bg-slate-900/40 cursor-pointer transition-colors text-center">
            <Upload className="w-5 h-5 text-amber-400 mb-1" />
            <span className="text-xs font-medium text-slate-200">
              {uploadedFileName ? uploadedFileName : 'Klik untuk memilih berkas MP3 / WAV'}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5">
              Dimainkan langsung secara lokal di peramban
            </span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
        >
          Selesai & Tutup
        </button>
      </motion.div>
    </div>
  );
};
