import * as admin from "firebase-admin";

function initAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "suratdigitalv2";

  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      console.log("✅ Firebase Admin SDK init dengan private key.");
      return admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        projectId,
      });
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
