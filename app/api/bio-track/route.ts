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
// Rate limit per IP: maks 30 request per 60 detik
const trackLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 30 });

// Tambahan: throttle per linkId per IP untuk cegah spam klik beruntun
const clickThrottle = new Map<string, number>();

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

    // Throttle: 1 klik per linkId per IP dalam 5 detik
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const throttleKey = `${ip}:${col}:${linkId}`;
    const lastClick = clickThrottle.get(throttleKey);
    const now = Date.now();
    if (lastClick && now - lastClick < 5000) {
      return NextResponse.json({ success: false, error: "Terlalu cepat" }, { status: 429 });
    }
    clickThrottle.set(throttleKey, now);

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
