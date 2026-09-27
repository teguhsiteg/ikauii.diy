import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { decryptText, encryptText } from "@/lib/crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const participantId = searchParams.get("id");

    if (!participantId) {
      return NextResponse.json({ error: "ID Peserta tidak ditemukan" }, { status: 400 });
    }

    const docRef = dbAdmin.collection("offline_participants").doc(participantId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Peserta tidak ditemukan" }, { status: 404 });
    }

    const data = docSnap.data();
    if (!data?.strava_access_token) {
      return NextResponse.json({ error: "Akun Strava belum terhubung" }, { status: 400 });
    }

    let accessToken = decryptText(data.strava_access_token);
    const expiresAt = data.strava_expires_at || 0;
    const nowSec = Math.floor(Date.now() / 1000);

    // Refresh token jika sudah kadaluarsa
    if (expiresAt && nowSec >= expiresAt && data.strava_refresh_token) {
      try {
        const refreshToken = decryptText(data.strava_refresh_token);
        const refreshRes = await fetch("https://www.strava.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: process.env.STRAVA_CLIENT_ID,
            client_secret: process.env.STRAVA_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });

        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.access_token) {
          accessToken = refreshData.access_token;
          await docRef.update({
            strava_access_token: encryptText(refreshData.access_token),
            strava_refresh_token: encryptText(refreshData.refresh_token),
            strava_expires_at: refreshData.expires_at,
          });
        }
      } catch (refreshErr) {
        console.error("Gagal refresh token Strava:", refreshErr);
      }
    }

    const res = await fetch("https://www.strava.com/api/v3/athlete/activities?per_page=30", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const activities = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: activities.message || "Gagal mengambil data dari Strava" }, { status: res.status });
    }

    return NextResponse.json({ activities }, { status: 200 });
  } catch (error: any) {
    console.error("API Error (strava/activities):", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal server" }, { status: 500 });
  }
}
