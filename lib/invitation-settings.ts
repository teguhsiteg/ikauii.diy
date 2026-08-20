import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface RundownItem {
  id?: string;
  time: string;
  title: string;
  speaker: string;
  highlight: boolean;
}

export interface InvitationSettings {
  orgName: string;
  subOrgName: string;
  title: string;
  period: string;
  theme: string;
  day: string;
  dateFormatted: string;
  timeFormatted: string;
  venue: string;
  address: string;
  dresscode: string;
  targetDateTime: string;
  googleMapsUrl: string;
  liveStreamUrl: string;
  contactPhone: string;
  contactPerson: string;
  contactPhoneDisplay: string;
  openingGreeting: string;
  
  // Custom Media and Music
  mediaUrls: string[];
  musicUrl: string;
  autoPlayMusic: boolean;
  
  // Rundown Array
  rundown: RundownItem[];
}

export const DEFAULT_INVITATION_SETTINGS: InvitationSettings = {
  orgName: 'IKATAN ALUMNI UNIVERSITAS ISLAM INDONESIA',
  subOrgName: 'DEWAN PIMPINAN WILAYAH DAERAH ISTIMEWA YOGYAKARTA',
  title: 'Pelantikan Pengurus',
  period: 'Periode 2026 - 2031',
  theme: 'Sinergi Alumni Membangun Negeri',
  day: '',
  dateFormatted: '10 November 2026',
  timeFormatted: '18.00 WIB - Selesai',
  venue: 'Gedung Kahar Mudzakkir UII',
  address: 'Kampus Terpadu UII, Jl. Kaliurang KM 14.5, Sleman, DIY',
  dresscode: 'Pakaian Sipil Lengkap (PSL) / Jas IKA UII',
  targetDateTime: '2026-11-10T18:00:00+07:00',
  googleMapsUrl: 'https://maps.app.goo.gl/...',
  liveStreamUrl: '',
  contactPhone: '6281234567890',
  contactPerson: 'Panitia Acara',
  contactPhoneDisplay: '0812-3456-7890',
  openingGreeting: 'Dengan memohon rahmat dan ridho Allah SWT, Kami mengundang Bapak/Ibu/Saudara/i untuk hadir pada acara:',
  mediaUrls: [],
  musicUrl: 'https://ikadiy.uii.ac.id/audio/hymne-uii.mp3',
  autoPlayMusic: true,
  rundown: [
    { id: '1', time: '18:00', title: 'Registrasi Peserta', speaker: 'Panitia', highlight: false },
    { id: '2', time: '19:00', title: 'Pembukaan & Pembacaan Ayat Suci Al-Quran', speaker: 'Qori', highlight: false },
    { id: '3', time: '19:15', title: 'Menyanyikan Lagu Indonesia Raya & Hymne UII', speaker: 'Dirigen', highlight: false },
    { id: '4', time: '19:30', title: 'Prosesi Pelantikan Pengurus DPW IKA UII DIY', speaker: 'Ketum DPP IKA UII', highlight: true },
    { id: '5', time: '20:15', title: 'Sambutan Ketua DPW IKA UII DIY Terpilih', speaker: 'Ketua DPW', highlight: false },
    { id: '6', time: '20:30', title: 'Ramah Tamah & Hiburan', speaker: 'Panitia', highlight: false }
  ]
};

const SETTINGS_DOC_ID = 'default';
const COLLECTION_NAME = 'invitation_settings';

export async function getInvitationSettings(): Promise<InvitationSettings> {
  try {
    const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { ...DEFAULT_INVITATION_SETTINGS, ...docSnap.data() } as InvitationSettings;
    } else {
      // Document doesn't exist, return default
      return DEFAULT_INVITATION_SETTINGS;
    }
  } catch (error) {
    console.warn("Could not fetch invitation settings, using defaults. Error:", error);
    return DEFAULT_INVITATION_SETTINGS;
  }
}

export async function updateInvitationSettings(settings: Partial<InvitationSettings>): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, SETTINGS_DOC_ID);
    await setDoc(docRef, settings, { merge: true });
  } catch (error) {
    console.error("Error updating invitation settings:", error);
    throw error;
  }
}
