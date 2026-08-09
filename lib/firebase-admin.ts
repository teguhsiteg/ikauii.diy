import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey.replace(/\\n/g, "\n"),
          }),
        });
        console.log("✅ Firebase Admin SDK diinisialisasi (dengan .env credentials).");
      } catch (certError) {
        console.warn("⚠️ Gagal init dengan cert private key, mencoba ADC...", certError);
        admin.initializeApp();
        console.log("✅ Firebase Admin SDK diinisialisasi (fallback ADC).");
      }
    } else {
      // Production Cloud Functions environment
      admin.initializeApp();
      console.log("✅ Firebase Admin SDK diinisialisasi (dengan default ADC).");
    }
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error);
  }
}

export const authAdmin = admin.auth();
export const dbAdmin = admin.firestore();
