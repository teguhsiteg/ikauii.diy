import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
    });
    console.log("✅ Firebase Admin SDK berhasil diinisialisasi.");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error", error);
    throw error; // Jangan lanjut kalau credential salah
  }
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
