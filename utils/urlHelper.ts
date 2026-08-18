import { GuestInfo } from '@/data/eventData';

export type { GuestInfo };

export const generateInvitationUrl = (
  name: string,
  role: string,
  category: string,
  musicUrl?: string,
  embed?: boolean,
  type?: 'canonical' | 'current'
) => {
  const baseUrl = type === 'canonical' ? 'https://ikadiy.uii.ac.id/pelantikan' : 'http://localhost:3000/pelantikan';
  const url = new URL(baseUrl);
  url.searchParams.set('to', name);
  if (role) url.searchParams.set('role', role);
  if (category) url.searchParams.set('category', category);
  if (musicUrl) url.searchParams.set('audio', musicUrl);
  if (embed) url.searchParams.set('embed', 'true');
  return url.toString();
};

export const generateWhatsAppShareText = (name: string, role: string, url: string) => {
  return `Kepada Yth. ${name}\n\nKami mengundang Bapak/Ibu untuk hadir pada acara Pelantikan IKA UII DIY. Silakan klik tautan berikut untuk melihat undangan:\n${url}`;
};

export const generateEmbedIframeCode = (name: string, role: string, category: string, musicUrl?: string) => {
  const url = generateInvitationUrl(name, role, category, musicUrl, true, 'canonical');
  return `<iframe src="${url}" width="100%" height="600" style="border:none;"></iframe>`;
};
