import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { rateLimit } from "@/lib/rate-limit";

// ============================================================
// BIO CLICK TRACKER (SERVER-SIDE)
// Halaman bio (linktree publik) menambah jumlah klik per link.
// Client tidak boleh menulis settings/bio_engine langsung karena
// rules mengunci settings (write isAdmin). Route ini hanya
// menaikkan field clicks — tidak bisa mengubah konten bio.
// Publik (tanpa auth) + rate limit per IP.
// ============================================================

const ALLOWED_COLLECTIONS = ["links", "socials", "sponsors", "products"];
const trackLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 30 });

export async function POST(request: Request) {
  const rl = trackLimiter(request);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi nanti." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { collectionName, linkId } = body;

    if (!linkId || typeof linkId !== "string") {
      return NextResponse.json({ error: "linkId wajib diisi" }, { status: 400 });
    }
    const col = ALLOWED_COLLECTIONS.includes(collectionName)
      ? collectionName
      : "links";

    const ref = dbAdmin.collection("settings").doc("bio_engine");

    await dbAdmin.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) return;
      const data = snap.data() || {};
      const arr = Array.isArray(data[col]) ? data[col] : [];
      const updated = arr.map((l: any) =>
        l && l.id === linkId ? { ...l, clicks: (l.clicks || 0) + 1 } : l,
      );
      t.update(ref, { [col]: updated });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[bio-track] Error:", error);
    return NextResponse.json(
      { error: "Gagal mencatat klik" },
      { status: 500 },
    );
  }
}
