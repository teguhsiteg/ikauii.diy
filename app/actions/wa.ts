"use server";

import { executeSendWa } from "@/lib/core-wa";

export async function sendWaAction(payload: any) {
  try {
    const result = await executeSendWa(payload);
    
    if (!result.success) {
      console.warn("Server Action WA Failed:", result.error);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Server Action WA Error:", error);
    return { success: false };
  }
}
