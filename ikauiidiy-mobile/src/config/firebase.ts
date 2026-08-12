// src/config/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Konfigurasi Firebase project suratdigitalv2 (sama dengan web ikadiy.uii.ac.id)
const firebaseConfig = {
  apiKey: "AIzaSyB_oBi8xCjwk0Tj__FhKjjVpBIDKT0aY3Y",
  authDomain: "ikadiy.uii.ac.id",
  projectId: "suratdigitalv2",
  storageBucket: "suratdigitalv2.appspot.com",
};

// Mencegah inisialisasi ganda (guard getApps)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
