"use server";

import { headers } from "next/headers";

export async function sendEmailAction(payload: any) {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  const internalSecret = process.env.INTERNAL_API_SECRET || "";

  try {
    const response = await fetch(`${baseUrl}/api/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": internalSecret,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn("Server Action Email Failed:", await response.text());
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Server Action Email Error:", error);
    return { success: false };
  }
}
