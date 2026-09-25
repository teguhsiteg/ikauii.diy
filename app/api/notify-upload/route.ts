import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

const emailRateLimiter = rateLimit({ windowMs: 60 * 1000, maxRequests: 5 });

export async function POST(request: Request) {
  try {
    const rl = emailRateLimiter(request);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi nanti." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { email, nama, id, event } = body;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ikadiy.uii.ac.id";
    const internalSecret = process.env.INTERNAL_API_SECRET || "";

    const res = await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify({
        type: "payment_proof_submitted",
        email: email,
        nama: nama,
        detail: {
          id: id,
          event: event || "Event IKA UII DIY",
        },
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Gagal mengirim email");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error notify-upload:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal" },
      { status: 500 }
    );
  }
}
