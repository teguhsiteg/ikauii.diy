import * as admin from "firebase-admin";

function initAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "suratdigitalv2";

  try {
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (rawPrivateKey) {
      console.log("✅ Firebase Admin SDK init dengan private key.");
      let formattedKey = rawPrivateKey;
      
      // Hapus tanda kutip di awal dan akhir
      if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
        formattedKey = formattedKey.slice(1, -1);
      } else if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
        formattedKey = formattedKey.slice(1, -1);
      }
      
      // Ganti literal \n dengan newline sesungguhnya
      formattedKey = formattedKey.replace(/\\n/g, "\n");
      
      try {
        return admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: formattedKey,
          }),
          projectId,
        });
      } catch (certError: any) {
        console.error("❌ ERROR: FIREBASE_PRIVATE_KEY tidak valid formatnya! Pastikan copy-paste dari JSON tanpa spasi berlebih atau quote salah di Vercel/Env.", certError.message);
        // Fallback to ADC if cert fails so the module doesn't crash Next.js completely
        console.log("⚠️ Fallback ke ADC karena Private Key gagal di-parse.");
        return admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
        });
      }
    } else {
      console.log("✅ Firebase Admin SDK init dengan ADC.");
      return admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
    }
  } catch (error) {
    console.error("❌ Firebase Admin Initialization Error:", error);
    throw error;
  }
}

const app = initAdminApp();

export const authAdmin = admin.auth(app);
export const dbAdmin = admin.firestore(app);
