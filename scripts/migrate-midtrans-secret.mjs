// Migrasi: pindahkan midtransServerKey dari settings/{type} ke secrets/{type}
// (menutup kebocoran key karena `settings` adalah koleksi public-read).
//
// Run preview  : node scripts/migrate-midtrans-secret.mjs
// Run eksekusi : node scripts/migrate-midtrans-secret.mjs --apply
//
// Aman: copy -> verify -> delete. Backup tersimpan ke .secret-backup-<type>.json.
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const envPath = resolve(process.cwd(), ".env.local");
const envRaw = readFileSync(envPath, "utf-8");
const env = {};
for (const line of envRaw.split("\n")) {
  const c = line.trim();
  if (!c || c.startsWith("#")) continue;
  const eq = c.indexOf("=");
  if (eq === -1) continue;
  const key = c.slice(0, eq);
  let val = c.slice(eq + 1);
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
    val = val.slice(1, -1);
  env[key] = val;
}

const apply = process.argv.includes("--apply");
const projectId = env.FIREBASE_PROJECT_ID || "suratdigitalv2";
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!privateKey) {
  console.error("FIREBASE_PRIVATE_KEY tidak ditemukan di .env.local");
  process.exit(1);
}

const app = getApps().length === 0
  ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId })
  : getApps()[0];
const db = getFirestore(app);

const TYPES = ["virtual_run", "masterclass"];

async function main() {
  for (const type of TYPES) {
    const settingsSnap = await db.collection("settings").doc(type).get();
    const key = settingsSnap.exists ? settingsSnap.data()?.midtransServerKey : undefined;

    if (!key) {
      console.log(`[${type}] tidak ada midtransServerKey di settings — skip`);
      continue;
    }

    const prefix = String(key).slice(0, 3);
    console.log(`[${type}] key ditemukan di settings (${String(key).length} char, prefix ${prefix}...)`);

    const secretsSnap = await db.collection("secrets").doc(type).get();
    const existingSecret = secretsSnap.exists ? secretsSnap.data()?.midtransServerKey : undefined;

    if (existingSecret === key) {
      console.log(`[${type}] secrets/${type} sudah berisi key yang sama — aman hapus dari settings`);
    } else if (existingSecret) {
      console.log(`[${type}] ⚠️ secrets/${type} berisi key BERBEDA. Skip (periksa manual).`);
      continue;
    }

    if (!apply) {
      console.log(`[${type}] (preview) akan: copy key -> secrets/${type}, lalu hapus field midtransServerKey dari settings/${type}`);
      continue;
    }

    // 1. Backup lokal
    writeFileSync(
      resolve(process.cwd(), `.secret-backup-${type}.json`),
      JSON.stringify({ type, midtransServerKey: key, ts: new Date().toISOString() }, null, 2)
    );
    console.log(`[${type}] backup -> .secret-backup-${type}.json`);

    // 2. Copy ke secrets
    await db.collection("secrets").doc(type).set(
      { midtransServerKey: key, migratedAt: new Date().toISOString() },
      { merge: true }
    );

    // 3. Verifikasi
    const verifySnap = await db.collection("secrets").doc(type).get();
    if (verifySnap.data()?.midtransServerKey !== key) {
      console.error(`[${type}] ❌ VERIFIKASI GAGAL — settings TIDAK dihapus.`);
      continue;
    }

    // 4. Hapus dari settings (public-read)
    await db.collection("settings").doc(type).update({ midtransServerKey: FieldValue.delete() });
    console.log(`[${type}] ✅ key pindah ke secrets/${type}, dihapus dari settings/${type}`);
  }

  console.log(apply ? "Selesai (applied)." : "Preview selesai — jalankan dengan --apply untuk eksekusi.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
