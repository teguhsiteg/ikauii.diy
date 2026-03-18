import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ganti nilai di bawah ini dengan konfigurasi dari Firebase Console milikmu
// (Kamu bisa copy dari file konfigurasi di proyek yang lama)
const firebaseConfig = {
  apiKey: "AIzaSyB_oBi8xCjwk0Tj__FhKjjVpBIDKT0aY3Y",
  authDomain: "suratdigitalv2.firebaseapp.com",
  projectId: "suratdigitalv2",
  storageBucket: "suratdigitalv2.firebasestorage.app",
  messagingSenderId: "46792735306",
  appId: "1:46792735306:web:ababc2cec51a774cbe84b3",
  measurementId: "G-0HFMKYDPM6",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
