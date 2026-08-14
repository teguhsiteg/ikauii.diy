import { NextResponse } from "next/server";
import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise";
import crypto from "crypto";

// 1. Inisialisasi Google Cloud Client MENGGUNAKAN kredensial Firebase dari .env
const client = new RecaptchaEnterpriseServiceClient({
  credentials: {
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    // Perlu replace \n agar format multiline dari .env terbaca benar oleh sistem
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
  projectId: process.env.FIREBASE_PROJECT_ID,
});

export async function POST(request: Request) {
  try {
    // 🔥 1. TANGKAP ACTION DARI FRONTEND 🔥
    const { token, email, action } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Token tidak ditemukan" },
        { status: 400 },
      );
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

    if (!projectId || !siteKey) {
      throw new Error("Konfigurasi Project ID atau Site Key belum diset.");
    }

    const projectPath = client.projectPath(projectId);

    // 🔥 2. BUAT REQUEST DASAR (ACTION DINAMIS) 🔥
    // Jika frontend tidak kirim action, default ke "login" agar form lama tetap aman
    const expectedAction = action || "login";

    const requestBody: any = {
      parent: projectPath,
      assessment: {
        event: {
          token: token,
          siteKey: siteKey,
          expectedAction: expectedAction,
        },
      },
    };

    // 🔥 3. ACCOUNT DEFENDER OPSIONAL 🔥
    // Hanya tambahkan sistem keamanan email jika form mengirimkan email
    if (email) {
      const secureAccountId = crypto
        .createHash("sha256")
        .update(email.toLowerCase().trim())
        .digest("hex");

      requestBody.assessment.accountDefendersAssessment = {
        accountId: secureAccountId,
      };
    }

    // 4. Minta penilaian (Assessment) dari server Google
    const [response] = await client.createAssessment(requestBody);

    if (!response.tokenProperties?.valid) {
      return NextResponse.json(
        {
          success: false,
          message: `Token tidak valid: ${response.tokenProperties?.invalidReason}`,
        },
        { status: 403 },
      );
    }

    const score = response.riskAnalysis?.score ?? 0;

    // Cek pembajakan akun (Hanya jika email dikirim)
    let isAccountHijacked = false;
    if (response.accountDefenderAssessment?.labels) {
      isAccountHijacked = response.accountDefenderAssessment.labels.includes(
        "PROFILE_MATCH_MITIGATION_REQUIRED" as any,
      );
    }

    // 5. Evaluasi Skor (0.5 ke atas = Manusia)
    if (score >= 0.5 && !isAccountHijacked) {
      return NextResponse.json({ success: true, score: score });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Verifikasi gagal. Terdeteksi bot atau risiko akun.",
          score: score,
        },
        { status: 403 },
      );
    }
  } catch (error) {
    console.error("reCAPTCHA Enterprise Error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan internal server" },
      { status: 500 },
    );
  }
}
