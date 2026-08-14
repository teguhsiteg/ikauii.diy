export interface User {
  id: string;
  nama: string;
  email: string;
  role: string;
  createdAt: string;
  totalCoins?: number;
}

export interface Agenda {
  id: string;
  judul: string;
  tanggal: string; // ISO String
  lokasi?: string;
  createdAt?: string;
  isComingSoon?: boolean;
}

export interface Berita {
  id: string;
  judul: string;
  ringkasan: string;
  coverUrl?: string;
  createdAt?: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  location: string;
  category: string;
  targetKm: number;
  posterUri: string;
  createdAt?: string;
}

export interface EventRegistration {
  id?: string;
  eventId: string;
  userId: string;
  registeredAt: string;
  totalRunKm: number;
}

export interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface Quiz {
  id: string;
  judul: string;
  deskripsi?: string;
  jmlSoal: number;
  coverUrl?: string;
  poinReward: number;
  createdAt?: string;
}
