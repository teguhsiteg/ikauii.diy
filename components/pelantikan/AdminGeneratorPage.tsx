import React, { useState, useEffect } from 'react';
import {
  Copy, Check, Share2, Code2, Music, User, Building, Users, ExternalLink, Eye, Play, Pause, Save, Loader2, Plus, Trash2, Calendar, MapPin, Edit3
} from 'lucide-react';
import { PRESET_VIP_GUESTS } from '@/data/eventData';
import { generateInvitationUrl, generateWhatsAppShareText, generateEmbedIframeCode, GuestInfo } from '@/utils/urlHelper';
import { MainInvitation } from '@/components/pelantikan/MainInvitation';
import { UiiLogoBadge } from './HeaderDecorations';
import { invitationAudio } from '@/utils/audioHelper';
import { getInvitationSettings, updateInvitationSettings, InvitationSettings, RundownItem } from '@/lib/invitation-settings';
import Swal from 'sweetalert2';

interface AdminGeneratorPageProps {
  onGoToLiveInvitation: (guest: GuestInfo) => void;
}

export const AdminGeneratorPage: React.FC<AdminGeneratorPageProps> = ({
  onGoToLiveInvitation,
}) => {
  const [settings, setSettings] = useState<InvitationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Guest generator states
  const [name, setName] = useState<string>('');
  const [role, setRole] = useState<string>('');
  const [category, setCategory] = useState<string>('VIP');

  // Copy status indicators
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedWa, setCopiedWa] = useState<boolean>(false);
  const [copiedIframe, setCopiedIframe] = useState<boolean>(false);
  
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(invitationAudio.getStatus());

  useEffect(() => {
    getInvitationSettings().then(data => {
      setSettings(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#0e2142]" />
        <p className="text-[#0e2142] font-semibold">Memuat Pengaturan Admin...</p>
      </div>
    );
  }

  const currentGuest: GuestInfo = {
    name: name.trim() || 'Tamu Undangan',
    role: role.trim(),
    category: category as GuestInfo['category'],
    code: 'IKAUII-' + Math.abs((name.trim() || 'Tamu').split('').reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)).toString(36).toUpperCase().slice(0, 6),
  };

  const canonicalGuestUrl = generateInvitationUrl(name, role, category, false, 'canonical');
  const embedCode = generateEmbedIframeCode(name, role, category);
  const waShareText = generateWhatsAppShareText(name, role, canonicalGuestUrl);

  const handleCopy = (type: 'url' | 'wa' | 'iframe', text: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
    else if (type === 'wa') { setCopiedWa(true); setTimeout(() => setCopiedWa(false), 2000); }
    else if (type === 'iframe') { setCopiedIframe(true); setTimeout(() => setCopiedIframe(false), 2000); }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateInvitationSettings(settings);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: 'Pengaturan undangan berhasil disimpan!',
        confirmButtonColor: '#0e2142'
      });
    } catch (e) {
      Swal.fire('Error', 'Gagal menyimpan pengaturan.', 'error');
    }
    setIsSaving(false);
  };

  const updateSetting = (key: keyof InvitationSettings, value: any) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans">
      {/* Top Banner (UII Blue) */}
      <header className="sticky top-0 z-30 w-full bg-[#0e2142] border-b border-amber-400 px-4 sm:px-8 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <UiiLogoBadge size={44} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-cinzel text-base sm:text-lg font-bold text-white tracking-wide">
                  Panel Admin & CMS Undangan IKA UII DIY
                </h1>
                <span className="px-2 py-0.5 rounded bg-amber-400 text-[#0e2142] text-[11px] font-bold">
                  ADMIN MODE
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Atur seluruh detail acara, galeri, musik, dan buat tautan undangan untuk tamu.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-amber-400 text-[#0e2142] text-xs font-bold shadow hover:bg-amber-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Settings & CMS (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* CMS: Detail Acara */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Edit3 className="w-5 h-5 text-[#0e2142]" />
              <h2 className="font-cinzel text-base font-bold text-[#0e2142]">Informasi Acara</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Organisasi</label>
                <input type="text" value={settings.orgName} onChange={e => updateSetting('orgName', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Sub Organisasi</label>
                <input type="text" value={settings.subOrgName} onChange={e => updateSetting('subOrgName', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Salam Pembuka (Opening Greeting)</label>
                <textarea value={settings.openingGreeting || ''} onChange={e => updateSetting('openingGreeting', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" rows={2} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Judul Acara (Title)</label>
                <input type="text" value={settings.title} onChange={e => updateSetting('title', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Periode (Tahun Kepengurusan)</label>
                <input type="text" value={settings.period} onChange={e => updateSetting('period', e.target.value)} placeholder="Contoh: Periode 2026 - 2031" className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tema / Slogan</label>
                <input type="text" value={settings.theme} onChange={e => updateSetting('theme', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Pakaian / Dresscode</label>
                <input type="text" value={settings.dresscode} onChange={e => updateSetting('dresscode', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
            </div>
          </div>

          {/* CMS: Waktu & Lokasi */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Calendar className="w-5 h-5 text-[#0e2142]" />
              <h2 className="font-cinzel text-base font-bold text-[#0e2142]">Waktu & Lokasi</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hari</label>
                <input type="text" value={settings.day} onChange={e => updateSetting('day', e.target.value)} placeholder="Contoh: Minggu" className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
                <input type="text" value={settings.dateFormatted} onChange={e => updateSetting('dateFormatted', e.target.value)} placeholder="Contoh: 10 November 2026" className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Pelaksanaan</label>
                <input type="text" value={settings.timeFormatted} onChange={e => updateSetting('timeFormatted', e.target.value)} placeholder="Contoh: 18.00 WIB - Selesai" className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Waktu Countdown Timer (ISO)</label>
                <input type="text" value={settings.targetDateTime} onChange={e => updateSetting('targetDateTime', e.target.value)} placeholder="Contoh: 2026-11-10T18:00:00+07:00" className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Tempat / Gedung</label>
                <input type="text" value={settings.venue} onChange={e => updateSetting('venue', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat Lengkap</label>
                <textarea value={settings.address} onChange={e => updateSetting('address', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" rows={2} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tautan Google Maps</label>
                <input type="url" value={settings.googleMapsUrl} onChange={e => updateSetting('googleMapsUrl', e.target.value)} placeholder="https://maps.app.goo.gl/..." className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Link Live Streaming (YouTube/Instagram)</label>
                <input type="url" value={settings.liveStreamUrl || ''} onChange={e => updateSetting('liveStreamUrl', e.target.value)} placeholder="https://youtube.com/live/..." className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
            </div>
          </div>

          {/* CMS: Narahubung & Kontak */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-[#0e2142]" />
              <h2 className="font-cinzel text-base font-bold text-[#0e2142]">Kontak & Narahubung</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Narahubung</label>
                <input type="text" value={settings.contactPerson} onChange={e => updateSetting('contactPerson', e.target.value)} placeholder="Contoh: Panitia Acara" className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">No WA Asli (Tanpa +)</label>
                <input type="text" value={settings.contactPhone} onChange={e => updateSetting('contactPhone', e.target.value)} placeholder="Contoh: 6281234567890" className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tampilan No WA</label>
                <input type="text" value={settings.contactPhoneDisplay} onChange={e => updateSetting('contactPhoneDisplay', e.target.value)} placeholder="Contoh: 0812-3456-7890" className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              </div>
            </div>
          </div>

          {/* CMS: Susunan Acara (Rundown) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-[#0e2142]" />
                <h2 className="font-cinzel text-base font-bold text-[#0e2142]">Susunan Acara (Rundown)</h2>
              </div>
              <button 
                onClick={() => {
                  const newRundown: RundownItem = { id: Date.now().toString(), time: '00:00', title: 'Acara Baru', speaker: '', highlight: false };
                  updateSetting('rundown', [...settings.rundown, newRundown]);
                }}
                className="text-xs bg-[#0e2142] text-white px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#1a386b]"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>
            
            <div className="space-y-3">
              {settings.rundown.map((item, idx) => (
                <div key={item.id || idx} className="flex flex-col sm:flex-row gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200 relative">
                  <input type="text" value={item.time} onChange={(e) => {
                    const newR = [...settings.rundown];
                    newR[idx].time = e.target.value;
                    updateSetting('rundown', newR);
                  }} className="w-20 px-2 py-1 text-sm border rounded" placeholder="Jam" />
                  
                  <input type="text" value={item.title} onChange={(e) => {
                    const newR = [...settings.rundown];
                    newR[idx].title = e.target.value;
                    updateSetting('rundown', newR);
                  }} className="flex-1 px-2 py-1 text-sm border rounded" placeholder="Judul Acara" />
                  
                  <input type="text" value={item.speaker} onChange={(e) => {
                    const newR = [...settings.rundown];
                    newR[idx].speaker = e.target.value;
                    updateSetting('rundown', newR);
                  }} className="flex-1 px-2 py-1 text-sm border rounded" placeholder="Pengisi / Keterangan" />

                  <button 
                    onClick={() => {
                      const newR = settings.rundown.filter((_, i) => i !== idx);
                      updateSetting('rundown', newR);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CMS: Galeri & Musik */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Music className="w-5 h-5 text-[#0e2142]" />
              <h2 className="font-cinzel text-base font-bold text-[#0e2142]">Media & Musik</h2>
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Tautan Musik (MP3)</label>
              <input type="url" value={settings.musicUrl} onChange={e => updateSetting('musicUrl', e.target.value)} className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" />
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="autoPlay" checked={settings.autoPlayMusic} onChange={e => updateSetting('autoPlayMusic', e.target.checked)} className="rounded text-[#0e2142]" />
                <label htmlFor="autoPlay" className="text-xs text-slate-600">Putar otomatis saat undangan dibuka (Auto-play)</label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-600">Galeri Foto / Video Ucapan (Link YouTube / Gambar)</label>
                <button onClick={() => updateSetting('mediaUrls', [...settings.mediaUrls, ''])} className="text-xs text-amber-600 font-bold hover:underline">
                  + Tambah Media
                </button>
              </div>
              <div className="space-y-2">
                {settings.mediaUrls.map((url, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input 
                      type="url" 
                      value={url} 
                      onChange={(e) => {
                        const newM = [...settings.mediaUrls];
                        newM[idx] = e.target.value;
                        updateSetting('mediaUrls', newM);
                      }} 
                      placeholder="https://youtube.com/..." 
                      className="w-full px-3 py-2 rounded-lg border focus:border-[#0e2142] text-sm outline-none" 
                    />
                    <button onClick={() => {
                      const newM = settings.mediaUrls.filter((_, i) => i !== idx);
                      updateSetting('mediaUrls', newM);
                    }} className="p-2 text-red-500 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {settings.mediaUrls.length === 0 && (
                  <p className="text-xs text-slate-400 italic">Belum ada media. Klik "Tambah Media" untuk menambahkan.</p>
                )}
              </div>
            </div>
          </div>

          {/* Generator Tautan Tamu */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-[#0e2142]" />
              <h2 className="font-cinzel text-base font-bold text-[#0e2142]">Buat Tautan Tamu Khusus</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap & Gelar</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border focus:border-[#0e2142] text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jabatan / Instansi</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border focus:border-[#0e2142] text-sm outline-none" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#0e2142]">Tautan Bagikan:</span>
              </div>
              <div className="p-2 bg-white border border-slate-300 font-mono text-xs text-slate-700 break-all select-all rounded-lg">
                {canonicalGuestUrl}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleCopy('url', canonicalGuestUrl)} className="flex-1 py-2 px-3 rounded-lg bg-[#0e2142] text-white font-bold text-xs hover:bg-[#1a386b] cursor-pointer flex items-center justify-center gap-1.5">
                  {copiedUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Salin Tautan</span>
                </button>
                <button onClick={() => handleCopy('wa', waShareText)} className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 cursor-pointer flex items-center justify-center gap-1.5">
                  {copiedWa ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>Salin Pesan WA</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Pure Guest Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-20">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-cinzel text-sm font-bold text-[#0e2142]">
                    Pratinjau Undangan
                  </span>
                </div>
              </div>

              {/* Mock Screen Bezel */}
              <div className="relative w-full h-[620px] rounded-xl border-4 border-slate-800 bg-slate-950 overflow-hidden shadow-inner flex flex-col">
                <div className="bg-slate-900 px-3 py-1.5 flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                  <div className="flex gap-1"><div className="w-2 h-2 rounded-full bg-rose-500"/><div className="w-2 h-2 rounded-full bg-amber-500"/><div className="w-2 h-2 rounded-full bg-emerald-500"/></div>
                  <div className="flex-1 bg-slate-950 px-2 py-0.5 rounded text-slate-300 font-mono truncate text-[9px]">ikadiy.uii.ac.id/pelantikan?to={encodeURIComponent(currentGuest.name)}</div>
                </div>
                <div className="flex-1 overflow-y-auto relative">
                  <MainInvitation guest={currentGuest} onBackToCover={() => {}} dynamicSettings={settings} />
                </div>
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={() => onGoToLiveInvitation(currentGuest)}
                  className="w-full py-2.5 rounded-xl bg-amber-400 text-[#0e2142] text-xs font-bold flex items-center justify-center gap-2 hover:bg-amber-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
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
