/**
 * Simple in-memory rate limiter for Next.js API routes.
 * No external dependencies. Resets on server restart.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Tidak menggunakan setInterval agar tidak menghalangi Serverless Function (Vercel) untuk shut down (menghindari 503 Timeout/Service Unavailable).
// Sebagai gantinya, Map akan di-reset saat cold-start, atau kita bisa membersihkannya secara manual saat ukuran Map terlalu besar.


export function rateLimit(options: {
  windowMs?: number;   // default 60 detik
  maxRequests?: number; // default 5 request per window
  keyGenerator?: (req: Request) => string; // default: IP + path
}) {
  const windowMs = options.windowMs ?? 60 * 1000;
  const maxRequests = options.maxRequests ?? 5;
  const keyGenerator =
    options.keyGenerator ??
    ((req: Request) => {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";
      const url = new URL(req.url);
      return `${ip}:${url.pathname}`;
    });

  return function checkRateLimit(req: Request): {
    allowed: boolean;
    remaining: number;
    resetIn: number;
  } {
    const key = keyGenerator(req);
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
    }

    entry.count++;

    if (entry.count > maxRequests) {
      store.set(key, entry);
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    store.set(key, entry);
    return {
      allowed: true,
      remaining: maxRequests - entry.count,
      resetIn: Math.ceil((entry.resetAt - now) / 1000),
    };
  };
}
