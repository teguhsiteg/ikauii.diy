// Script: check/create Firestore admin documents
// Usage:
//   node scripts/admin-firestore.mjs list
//   node scripts/admin-firestore.mjs add-admin-email <email>
//   node scripts/admin-firestore.mjs add-user-email <email> [nama] [role]
import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

const projectId = env.FIREBASE_PROJECT_ID || "suratdigitalv2";
const clientEmail = env.FIREBASE_CLIENT_EMAIL;
const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!privateKey) { console.error("FIREBASE_PRIVATE_KEY not found"); process.exit(1); }

const app = getApps().length === 0
  ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId })
  : getApps()[0];
const db = getFirestore(app);

async function main() {
  const cmd = process.argv[2] || "list";

  if (cmd === "list") {
    const [users, ae] = await Promise.all([
      db.collection("users").limit(20).get(),
      db.collection("admin_emails").limit(20).get(),
    ]);
    console.log("=== USERS ===");
    if (users.empty) console.log("  (kosong)");
    else users.forEach(d => console.log(`  ${d.id} | role=${d.data().role} | ${d.data().email} | ${d.data().nama}`));
    console.log(`  Total: ${users.size}`);
    console.log("\n=== ADMIN_EMAILS ===");
    if (ae.empty) console.log("  (kosong)");
    else ae.forEach(d => console.log(`  ${d.id} | active=${d.data().active}`));
  }

  if (cmd === "add-admin-email") {
    const email = process.argv[3];
    if (!email) { console.error("Usage: node scripts/admin-firestore.mjs add-admin-email <email>"); process.exit(1); }
    await db.collection("admin_emails").doc(email).set({ email, active: true, createdAt: new Date().toISOString() });
    console.log(`✅ admin_emails/${email} created`);
  }

  if (cmd === "add-user-email") {
    const email = process.argv[3];
    const nama = process.argv[4] || email?.split("@")[0] || "Admin";
    const role = process.argv[5] || "super_admin";
    if (!email) { console.error("Usage: node scripts/admin-firestore.mjs add-user-email <email> [nama] [role]"); process.exit(1); }
    await db.collection("users").doc(email).set({ email, nama, role, isActive: true, bidang: "DPW", aksesModul: ["ringkasan"], createdAt: new Date().toISOString() });
    console.log(`✅ users/${email} created with role=${role}`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
