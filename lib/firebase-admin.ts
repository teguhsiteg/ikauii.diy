import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // 🔥 Ini kunci utamanya: Memaksa teks \n menjadi format enter (newline) yang dikenali Google
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
          : undefined,
      }),
    });
    console.log("✅ Firebase Admin SDK berhasil diinisialisasi.");
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error", error);
  }
}

export const authAdmin = admin.auth();
