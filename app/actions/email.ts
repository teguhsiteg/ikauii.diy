"use server";

import { executeSendEmail } from "@/lib/core-email";

export async function sendEmailAction(payload: any) {
  try {
    const result = await executeSendEmail(payload);

    if (!result.success) {
      console.warn("Server Action Email Failed:", result.error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Server Action Email Error:", error);
    return { success: false };
  }
}
