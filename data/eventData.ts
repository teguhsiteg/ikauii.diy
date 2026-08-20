export interface GuestInfo {
  name: string;
  role: string;
  category: string;
  code?: string;
}

export interface GuestWish {
  id?: string;
  name: string;
  role?: string;
  status?: 'hadir' | 'ragu' | 'tidak_hadir';
  pax?: number;
  message: string;
  timestamp: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  title?: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  description?: string;
  type?: string;
  url?: string;
}

export const PRESET_VIP_GUESTS = [
  { name: 'Prof. Fathul Wahid, S.T., M.Sc., Ph.D.', role: 'Rektor Universitas Islam Indonesia', category: 'VVIP' },
  { name: 'Prof. Dr. Ir. Hari Purnomo, M.T., IPU., ASEAN Eng.', role: 'Ketua Umum DPP IKA UII', category: 'VVIP' },
  { name: 'Drs. Suwarsono Muhammad, M.A.', role: 'Ketua Pengurus Yayasan Badan Wakaf UII', category: 'VVIP' },
  { name: 'Sri Sultan Hamengkubuwono X', role: 'Gubernur Daerah Istimewa Yogyakarta', category: 'VVIP' }
];

export const MUSIC_PRESETS: MusicTrack[] = [
  { id: '1', title: 'Hymne UII', type: 'url', url: 'https://ikadiy.uii.ac.id/audio/hymne-uii.mp3' },
  { id: '2', title: 'Mars UII', type: 'url', url: 'https://ikadiy.uii.ac.id/audio/mars-uii.mp3' },
];

export const EVENT_DETAILS = {
  orgName: 'IKATAN ALUMNI UNIVERSITAS ISLAM INDONESIA',
  subOrgName: 'DEWAN PIMPINAN WILAYAH DAERAH ISTIMEWA YOGYAKARTA',
  title: 'Pelantikan IKA UII DIY',
  period: 'Periode 2026 - 2031',
  theme: 'Sinergi Alumni Membangun Negeri',
  day: 'Minggu',
  dateFormatted: '10 November 2026',
  timeFormatted: '18.00 WIB - Selesai',
  venue: 'Gedung Kahar Mudzakkir UII',
  address: 'Kampus Terpadu UII, Jl. Kaliurang KM 14.5, Sleman, DIY',
  dresscode: 'Pakaian Sipil Lengkap (PSL) / Jas IKA UII',
  targetDateTime: '2026-11-10T18:00:00+07:00',
  googleMapsUrl: 'https://goo.gl/maps/example',
  contactPhone: '6281234567890',
  contactPerson: 'Panitia Pelantikan',
  contactPhoneDisplay: '0812-3456-7890',
};

export const RUNDOWN_LIST = [
  { time: '18:00', title: 'Registrasi Peserta', speaker: 'Panitia', highlight: false },
  { time: '19:00', title: 'Pembukaan & Pembacaan Ayat Suci Al-Quran', speaker: 'Qori', highlight: false },
  { time: '19:15', title: 'Menyanyikan Lagu Indonesia Raya & Hymne UII', speaker: 'Dirigen', highlight: false },
  { time: '19:30', title: 'Prosesi Pelantikan Pengurus DPW IKA UII DIY', speaker: 'Ketum DPP IKA UII', highlight: true },
  { time: '20:15', title: 'Sambutan Ketua DPW IKA UII DIY Terpilih', speaker: 'Ketua DPW', highlight: false },
  { time: '20:30', title: 'Ramah Tamah & Hiburan', speaker: 'Panitia', highlight: false }
];

export const INITIAL_WISHES: GuestWish[] = [
  { id: 'initial-1', name: 'Alumni Angkatan 90', message: 'Selamat atas pelantikan pengurus baru, semoga amanah dan sukses selalu.', timestamp: '2026-10-01T10:00:00' }
];

export const GALLERY_ITEMS: GalleryItem[] = [
  { id: '1', url: '/images/gallery-1.jpg', title: 'Gedung Rektorat UII' },
  { id: '2', url: '/images/gallery-2.jpg', title: 'Masjid Ulil Albab UII' }
];
