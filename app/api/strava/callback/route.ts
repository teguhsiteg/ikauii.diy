import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { encryptText } from "@/lib/crypto";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const participantId = searchParams.get("state");
  const error = searchParams.get("error");

  // Jika otorisasi ditolak di halaman Strava
  if (error || !code) {
    return NextResponse.redirect(
      new URL("/run/strava?status=access_denied", request.url),
    );
  }

  try {
    const clientId = process.env.STRAVA_CLIENT_ID || "175689";
    const clientSecret = process.env.STRAVA_CLIENT_SECRET || "d429e720fe8bebdfdc7b3b78e8d1060dac195610";

    // 1. Tembak API Strava untuk menukar code menjadi access_token
    const res = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
      }),
    });

    const data = await res.json();

    if (!res.ok || !data.access_token) {
      console.error("[Strava Token Exchange Error]:", data);
      const errorMsg = data.message || (data.errors ? JSON.stringify(data.errors) : "Gagal otorisasi token Strava");
      return NextResponse.redirect(
        new URL(`/run/strava?status=token_error&msg=${encodeURIComponent(errorMsg)}`, request.url),
      );
    }

    // 2. Simpan token Strava ke Firestore
    if (participantId) {
      const encryptedAccessToken = encryptText(data.access_token);
      const encryptedRefreshToken = data.refresh_token ? encryptText(data.refresh_token) : null;

      try {
        const docRef = dbAdmin.collection("offline_participants").doc(participantId);
        await docRef.set({
          strava_athlete_id: data.athlete?.id || null,
          strava_access_token: encryptedAccessToken,
          strava_refresh_token: encryptedRefreshToken,
          strava_expires_at: data.expires_at || 0,
          isStravaConnected: true,
        }, { merge: true });
      } catch (dbErr: any) {
        console.error("[Firestore Update Token Error]:", dbErr);
        // Fallback: import client db jika dbAdmin bermasalah
        const { db } = await import("@/lib/firebase");
        const { doc, setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "offline_participants", participantId), {
          strava_athlete_id: data.athlete?.id || null,
          strava_access_token: encryptedAccessToken,
          strava_refresh_token: encryptedRefreshToken,
          strava_expires_at: data.expires_at || 0,
          isStravaConnected: true,
        }, { merge: true });
      }

      // 3. Sukses! Arahkan peserta ke Run Studio
      return NextResponse.redirect(
        new URL(`/run/strava/studio/${participantId}`, request.url),
      );
    } else {
      return NextResponse.redirect(
        new URL("/run/strava?status=missing_state", request.url),
      );
    }
  } catch (err: any) {
    console.error("[Strava Callback Exception]:", err);
    return NextResponse.redirect(
      new URL(`/run/strava?status=server_error&msg=${encodeURIComponent(err.message || "Kesalahan internal server")}`, request.url),
    );
  }
}
