import { NextResponse } from "next/server";
import { sendTelegramPaymentNotification, TelegramPaymentNotificationParams } from "@/lib/telegram";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TelegramPaymentNotificationParams;

    if (!body.type || !body.id || !body.buktiBayarUrl) {
      return NextResponse.json(
        { error: "Data wajib tidak lengkap (type, id, buktiBayarUrl)" },
        { status: 400 }
      );
    }

    const res = await sendTelegramPaymentNotification(body);
    return NextResponse.json(res);
  } catch (error: any) {
    console.error("Error in telegram notify API:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
