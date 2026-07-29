// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_oBi8xCjwk0Tj__FhKjjVpBIDKT0aY3Y",
  authDomain: "suratdigitalv2.firebaseapp.com",
  projectId: "suratdigitalv2",
  storageBucket: "suratdigitalv2.firebasestorage.app",
  messagingSenderId: "46792735306",
  appId: "1:46792735306:web:ababc2cec51a774cbe84b3",
  measurementId: "G-0HFMKYDPM6",
};

// Mencegah inisialisasi ulang jika sudah jalan
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
