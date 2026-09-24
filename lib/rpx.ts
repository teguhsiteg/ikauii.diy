import crypto from "crypto";
import { dbAdmin } from "@/lib/firebase-admin";

const BASE_URL = "https://api.rpx.co.id/api";
const PRIVATE_KEY_ENV = process.env.RPX_PRIVATE_KEY || ""; 
// Harap pastikan RPX_PRIVATE_KEY sudah diisi di Vercel / Environment Variables

/**
 * Mendapatkan konfigurasi RPX dari Firestore
 */
export async function getRpxConfig() {
  const settingsSnap = await dbAdmin.collection("settings").doc("virtual_run").get();
  if (!settingsSnap.exists) {
    throw new Error("Pengaturan Virtual Run tidak ditemukan di Firestore");
  }
  const settings = settingsSnap.data() || {};
  return {
    isActive: settings.isRpxActive || false,
    username: settings.rpxUsername || "",
    password: settings.rpxPassword || "",
    accountNumber: settings.rpxAccountNumber || "",
    originZip: settings.rpxOriginZip || "",
    defaultWeight: settings.rpxDefaultWeight || 1,
    defaultService: settings.rpxDefaultService || "PSN",
    trackingUrl: settings.rpxTrackingUrl || "",
  };
}

/**
 * Helper untuk membuat RSA-SHA256 Signature dari Object Payload
 */
export function generateSignature(bodyObj: any): string {
  if (!PRIVATE_KEY_ENV) {
    console.warn("RPX_PRIVATE_KEY tidak ditemukan di .env. Signature mungkin gagal.");
  }
  
  let formattedKey = PRIVATE_KEY_ENV;
  
  // Hapus kutip awal dan akhir jika ada (sama seperti kasus Firebase)
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  } else if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
    formattedKey = formattedKey.slice(1, -1);
  }

  // Format Private Key jika di-load dari satu baris string di Vercel
  if (!formattedKey.includes("-----BEGIN") || formattedKey.includes("\\n")) {
    formattedKey = formattedKey.replace(/\\n/g, "\n");
  }

  // Signature digenerate dari payload request.body JSON string yang di minify
  const payloadStr = JSON.stringify({ body: bodyObj });
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(payloadStr);
  const signature = sign.sign(formattedKey, "base64");
  return signature;
}

/**
 * API V3: Mendapatkan Bearer Token (Berlaku 3 menit)
 */
export async function getToken(username: string, password: string) {
  const credentials = Buffer.from(`${username}:${password}`).toString("base64");
  const response = await fetch(`${BASE_URL}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: "grant_type=client_credential",
  });
  
  const textData = await response.text();
  let data;
  try {
    data = JSON.parse(textData);
  } catch (e) {
    throw new Error(`Gagal parse token RPX: ${textData}`);
  }

  if (!response.ok || (data.err && data.err === true)) {
    throw new Error(`RPX Token Error: ${data.msg || "Gagal mendapatkan token RPX"}. Details: ${JSON.stringify(data)}`);
  }

  let tokenStr = data.data?.token || data.access_token || data.token;
  if (!tokenStr && typeof data === "string") {
    tokenStr = data;
  }
  
  if (!tokenStr) {
    throw new Error("Format token tidak dikenali dari RPX");
  }

  // Hapus prefix "Bearer " jika sudah ada bawaan dari RPX agar tidak double "Bearer Bearer"
  if (tokenStr.startsWith("Bearer ")) {
    tokenStr = tokenStr.slice(7);
  }

  return tokenStr;
}

/**
 * API V3: Get Rates (Nominal Ongkir)
 */
export async function getRates(token: string, payloadBody: any) {
  const signature = generateSignature(payloadBody);
  
  // Catatan: Next.js fetch tidak membolehkan body pada GET request.
  // Jika RPX mewajibkan body pada GET, kita harus memodifikasi cara request 
  // atau menggunakan library custom jika fetch native menolak.
  // Tapi banyak implementasi RPX mengizinkan POST untuk endpoint ini sebagai alternatif.
  // Akan dicoba POST terlebih dahulu, atau menggunakan node-fetch / https module jika error.
  
  const response = await fetch(`${BASE_URL}/v3/rates/`, {
    method: "POST", // Menggunakan POST agar body tidak di strip oleh node
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      request: { body: payloadBody },
      signature: signature
    }),
  });

  const textData = await response.text();
  let data;
  try {
    data = JSON.parse(textData);
  } catch (e) {
    throw new Error(`Gagal parse getRates: ${textData}`);
  }

  if (!response.ok || data.err) {
    throw new Error(data.msg || "Gagal mendapatkan tarif RPX");
  }

  return data;
}

/**
 * API V3: Send Shipment Data (Pembuatan Resi / AWB)
 */
export async function sendShipmentData(token: string, payloadBody: any) {
  const signature = generateSignature(payloadBody);

  const response = await fetch(`${BASE_URL}/v3/sendShipmentData`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      request: { body: payloadBody },
      signature: signature
    }),
  });

  const textData = await response.text();
  let data;
  try {
    data = JSON.parse(textData);
  } catch (e) {
    throw new Error(`Gagal parse sendShipmentData: ${textData}`);
  }

  if (!response.ok || data.err) {
    throw new Error(`RPX Error: ${data.msg || "Gagal memproses Shipment Data"}. Details: ${JSON.stringify(data)}`);
  }

  return data;
}
