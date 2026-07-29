"use server";

export async function sendEmailAction(payload: any) {
  const isDev = process.env.NODE_ENV === "development";
  const baseUrl = isDev 
    ? "http://localhost:3000" 
    : (process.env.NEXT_PUBLIC_BASE_URL || "https://ikadiy.uii.ac.id");
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
