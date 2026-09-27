import { dbAdmin } from "@/lib/firebase-admin";

const DEFAULT_BOT_TOKEN = "8584533255:AAEi929fOZzYbmDmGUrQ4SjxFFZdz_bbV3s";

export interface TelegramPaymentNotificationParams {
  type: "offline_indiv" | "offline_komunitas" | "vr_indiv" | "vr_komunitas" | "upgrade";
  id: string;
  nama: string;
  email: string;
  wa: string;
  kategori: string;
  totalBayar: number;
  charity?: number;
  ongkir?: number;
  buktiBayarUrl: string;
  waktuUpload?: string;
  komunitas?: string;
  jumlahPeserta?: number;
  kategoriLama?: string;
  kategoriBaru?: string;
}

export async function sendTelegramPaymentNotification(params: TelegramPaymentNotificationParams) {
  let botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  let chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  let eventName = "Event IKA UII DIY";
  try {
    const sDoc = await dbAdmin.collection("settings").doc("virtual_run").get();
    if (sDoc.exists) {
      const sData = sDoc.data() || {};
      if (sData.telegramBotToken) botToken = sData.telegramBotToken;
      if (sData.telegramChatId) chatId = sData.telegramChatId;

      if (params.type.startsWith("offline")) {
        eventName = sData.offlineJudul || sData.landingTitle || sData.eventName || eventName;
      } else {
        eventName = sData.eventName || sData.landingTitle || sData.offlineJudul || eventName;
      }
    }
  } catch (err) {
    console.error("Error fetching settings for telegram:", err);
  }

  if (!chatId) {
    console.warn("TELEGRAM_ADMIN_CHAT_ID is not configured. Telegram notification skipped.");
    return { success: false, reason: "No chat ID configured" };
  }

  const isOffline = params.type.startsWith("offline");
  const eventIcon = isOffline ? "🏃‍♂️" : "🌐";
  const formattedNominal = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(params.totalBayar);

  let typeLabel = "Individu";
  if (params.type === "offline_komunitas" || params.type === "vr_komunitas") typeLabel = "Komunitas / Grup";
  if (params.type === "upgrade") typeLabel = "Upgrade Kategori";

  let detailExtra = "";
  if (params.charity && params.charity > 0) {
    detailExtra += `\n❤️ <b>Charity/Donasi:</b> Rp ${params.charity.toLocaleString("id-ID")}`;
  }
  if (params.ongkir && params.ongkir > 0) {
    detailExtra += `\n📦 <b>Ongkos Kirim:</b> Rp ${params.ongkir.toLocaleString("id-ID")}`;
  }
  if (params.komunitas) {
    detailExtra += `\n👥 <b>Komunitas:</b> ${params.komunitas}`;
  }
  if (params.jumlahPeserta) {
    detailExtra += `\n🏃 <b>Jumlah Anggota:</b> ${params.jumlahPeserta} Orang`;
  }
  if (params.type === "upgrade") {
    detailExtra += `\n🔄 <b>Perubahan:</b> ${params.kategoriLama} ➔ ${params.kategoriBaru}`;
  }

  const caption = 
`🔔 <b>BUKTI PEMBAYARAN BARU</b>
${eventIcon} <b>Event:</b> ${eventName}

📌 <b>Tipe:</b> ${typeLabel}
👤 <b>Nama:</b> ${params.nama}
📱 <b>WhatsApp:</b> ${params.wa}
✉️ <b>Email:</b> ${params.email}
🎯 <b>Kategori:</b> ${params.kategori}${detailExtra}
💰 <b>Total Tagihan:</b> <b>${formattedNominal}</b>
🗓️ <b>Waktu:</b> ${params.waktuUpload || new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB

ID: <code>${params.id}</code>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: "✅ Setujui & Terbitkan BIB",
          callback_data: `approve:${params.type}:${params.id}`,
        },
        {
          text: "❌ Tolak",
          callback_data: `reject:${params.type}:${params.id}`,
        },
      ],
    ],
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        photo: params.buktiBayarUrl,
        caption: caption,
        parse_mode: "HTML",
        reply_markup: inlineKeyboard,
      }),
    });
    const result = await res.json();
    return result;
  } catch (e: any) {
    console.error("Failed to send telegram photo:", e);
    return { success: false, error: e.message };
  }
}

export async function answerTelegramCallbackQuery(botToken: string, callbackQueryId: string, text: string, showAlert: boolean = false) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
        show_alert: showAlert,
      }),
    });
  } catch (e) {
    console.error("Error answering callback query:", e);
  }
}

export async function editTelegramCaption(botToken: string, chatId: number | string, messageId: number, newCaption: string) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/editMessageCaption`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        caption: newCaption,
        parse_mode: "HTML",
        reply_markup: { inline_keyboard: [] },
      }),
    });
  } catch (e) {
    console.error("Error editing message caption:", e);
  }
}
