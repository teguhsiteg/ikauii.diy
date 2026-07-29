import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const participantId = searchParams.get("state"); // KUNCI RAHASIA: ID peserta kita sisipkan di sini
  const error = searchParams.get("error");

  // Jika peserta menolak (klik Cancel) di halaman Strava
  if (error || !code) {
    return NextResponse.redirect(
      new URL("/run/strava?status=access_denied", request.url),
    );
  }

  try {
    // 1. Tembak API Strava untuk menukar "code" menjadi "token"
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        code: code,
        grant_type: "authorization_code",
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Gagal mendapatkan token Strava");
    }

    // 2. Simpan "Gembok" Strava ini ke database peserta yang bersangkutan
    if (participantId) {
      // Import secara dinamis agar tidak mempengaruhi Edge runtime jika ada
      const { encryptText } = await import("@/lib/crypto");
      
      const participantRef = doc(db, "offline_participants", participantId);
      await updateDoc(participantRef, {
        strava_athlete_id: data.athlete.id,
        strava_access_token: encryptText(data.access_token),
        strava_refresh_token: encryptText(data.refresh_token),
        strava_expires_at: data.expires_at, // Waktu kadaluarsa token
        isStravaConnected: true,
      });
    }

    // 3. Setelah sukses, tendang peserta ke "UII Sehat Run Studio"
    return NextResponse.redirect(
      new URL(`/run/strava/studio/${participantId}`, request.url),
    );
  } catch (err: any) {
    console.error("[Strava Callback Error]:", err);
    return NextResponse.redirect(
      new URL("/run/strava?status=server_error", request.url),
    );
  }
}
