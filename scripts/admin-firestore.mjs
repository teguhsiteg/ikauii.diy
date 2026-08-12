// Tambahan untuk mengecek field NIA di pengurus
// Run: node scripts/admin-firestore.mjs check-nia
import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

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

  if (cmd === "check-nia") {
    // Cek sample pengurus yg sudah disahkan
    const snap = await db.collection("pengurus").where("isPengurus", "==", true).limit(10).get();
    console.log(`=== PENGURUS (isPengurus=true) — ${snap.size} docs ===`);
    if (snap.empty) {
      console.log("  (tidak ada pengurus yang sudah disahkan)");
    } else {
      snap.forEach(d => {
        const data = d.data();
        console.log(`  ${d.id} | nama=${data.nama} | noUrut=${data.noUrut} | nia=${data.nia || "(kosong)"} | status=${data.status_pengurus}`);
      });
    }
    // Cari max noUrut untuk generate berikutnya
    const allSnap = await db.collection("pengurus").orderBy("noUrut", "desc").limit(1).get();
    if (!allSnap.empty) {
      const max = allSnap.docs[0].data().noUrut;
      console.log(`\n  Max noUrut: ${max} → next: ${(max || 0) + 1}`);
    }
  }

  if (cmd === "generate-nia") {
    // Ambil semua pengurus aktif, filter yang NIA kosong/null di JS
    // (Firestore tidak support query "nia == ''" atau "nia == null" sekaligus)
    const snap = await db.collection("pengurus")
      .where("isPengurus", "==", true)
      .get();
    const missing = snap.docs.filter(d => {
      const n = d.data().nia;
      return !n || n === "" || n === "Dalam Proses" || n === "null";
    });
    if (missing.length === 0) {
      console.log("✅ Semua pengurus sudah punya NIA valid");
      process.exit(0);
    }
    // Cari max NIA yang sudah ada untuk generate berikutnya
    let maxNia = 0;
    snap.docs.forEach(d => {
      const n = d.data().nia;
      if (n && n !== "" && n !== "Dalam Proses" && n !== "null") {
        const parts = n.split(".");
        const num = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(num) && num > maxNia) maxNia = num;
      }
    });
    console.log(`Ditemukan ${missing.length} pengurus tanpa NIA. Max existing: ${maxNia}`);
    let count = 0;
    for (const doc of missing) {
      maxNia++;
      const nia = `26.08.34.00.${String(maxNia).padStart(4, "0")}`;
      await doc.ref.update({ nia });
      count++;
      console.log(`  ✅ ${doc.data().nama} → NIA=${nia}`);
    }
    console.log(`\n✅ ${count} NIA berhasil di-generate`);
  }

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
