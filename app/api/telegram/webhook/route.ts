import { NextResponse } from "next/server";
import { dbAdmin } from "@/lib/firebase-admin";
import { executeSendEmail } from "@/lib/core-email";
import { answerTelegramCallbackQuery, editTelegramCaption } from "@/lib/telegram";

const DEFAULT_BOT_TOKEN = "8584533255:AAEi929fOZzYbmDmGUrQ4SjxFFZdz_bbV3s";

async function getBotTokenAndChatId() {
  let botToken = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  let adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  try {
    const sDoc = await dbAdmin.collection("settings").doc("virtual_run").get();
    if (sDoc.exists) {
      const sData = sDoc.data() || {};
      if (sData.telegramBotToken) botToken = sData.telegramBotToken;
      if (sData.telegramChatId) adminChatId = sData.telegramChatId;
    }
  } catch (err) {
    console.error("Error reading telegram settings:", err);
  }

  return { botToken, adminChatId };
}

export async function POST(request: Request) {
  try {
    const update = await request.json();
    const { botToken, adminChatId } = await getBotTokenAndChatId();

    // 1. Tangani Pesan Teks Masuk (Command /start, /menu, /stats, /cari, teks pencarian)
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text.trim();

      const mainReplyKeyboard = {
        keyboard: [
          [{ text: "📊 Ringkasan Pendaftaran" }, { text: "🔍 Cari Peserta" }],
          [{ text: "⏳ Belum Bayar" }, { text: "🆔 Info Chat ID" }],
        ],
        resize_keyboard: true,
        is_persistent: true,
      };

      // Helper Send Message
      const sendReply = async (replyText: string, extraMarkup?: any) => {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: "HTML",
            reply_markup: extraMarkup || mainReplyKeyboard,
          }),
        });
      };

      // Handler /start atau /menu
      if (text.startsWith("/start") || text.startsWith("/menu")) {
        const welcomeText = 
`👋 <b>Halo, ${msg.from?.first_name || "Admin"}!</b>

Selamat datang di <b>Admin Assistant Bot IKA UII DIY Running</b>.

Gunakan tombol menu di bawah atau kirim perintah:
• 📊 <b>Ringkasan Pendaftaran:</b> Cek total peserta lunas, belum bayar, & per kategori
• 🔍 <b>Cari Peserta:</b> Cari peserta berdasarkan Nama, BIB, No WA, atau Email
• ⏳ <b>Belum Bayar:</b> Cek daftar yang menunggu konfirmasi pembayaran

🆔 <b>Chat ID Anda:</b> <code>${chatId}</code>`;

        await sendReply(welcomeText);
        return NextResponse.json({ ok: true });
      }

      // Handler /id atau /chatid atau tombol "🆔 Info Chat ID"
      if (text.startsWith("/id") || text.startsWith("/chatid") || text === "🆔 Info Chat ID") {
        await sendReply(
`🆔 <b>Chat ID Anda:</b> <code>${chatId}</code>

💡 <i>Pastikan Chat ID ini telah tersimpan di pengaturan admin agar Anda bisa menerima notifikasi bukti transfer baru & verifikasi cepat.</i>`
        );
        return NextResponse.json({ ok: true });
      }

      // Handler STATISTIK PENDAFTARAN
      if (text === "📊 Ringkasan Pendaftaran" || text.startsWith("/stats") || text.startsWith("/rekap")) {
        try {
          // Ambil data offline individu
          const offIndivSnap = await dbAdmin.collection("offline_participants").get();
          let offIndivLunas = 0;
          let offIndivPending = 0;
          let offIndivBatal = 0;
          const offKatMap: Record<string, number> = {};

          offIndivSnap.docs.forEach((doc) => {
            const d = doc.data();
            const status = (d.statusPembayaran || "Belum Bayar").toLowerCase();
            const kat = (d.kategori || d.jarak || "Lainnya").toUpperCase();
            if (status.includes("lunas") || status.includes("paid") || status.includes("verified")) {
              offIndivLunas++;
              offKatMap[kat] = (offKatMap[kat] || 0) + 1;
            } else if (status.includes("batal") || status.includes("reject")) {
              offIndivBatal++;
            } else {
              offIndivPending++;
            }
          });

          // Ambil data offline komunitas
          const offKomSnap = await dbAdmin.collection("pendaftaran_komunitas").get();
          let offKomLunas = 0;
          let offKomPesertaCount = 0;
          let offKomPending = 0;

          offKomSnap.docs.forEach((doc) => {
            const d = doc.data();
            const status = (d.statusPembayaran || "").toLowerCase();
            const jml = Array.isArray(d.anggota) ? d.anggota.length : (d.jumlahPeserta || 0);
            if (status.includes("lunas") || status.includes("paid")) {
              offKomLunas++;
              offKomPesertaCount += jml;
            } else {
              offKomPending++;
            }
          });

          // Ambil data virtual run
          const vrSnap = await dbAdmin.collection("vr_participants").get();
          let vrLunas = 0;
          let vrPending = 0;
          const vrKatMap: Record<string, number> = {};

          vrSnap.docs.forEach((doc) => {
            const d = doc.data();
            const status = (d.statusPembayaran || "").toLowerCase();
            const kat = (d.kategori || d.paketLari || "VR").toUpperCase();
            if (status.includes("lunas") || status.includes("paid")) {
              vrLunas++;
              vrKatMap[kat] = (vrKatMap[kat] || 0) + 1;
            } else {
              vrPending++;
            }
          });

          let katText = "";
          Object.entries(offKatMap).forEach(([k, v]) => {
            katText += `   • ${k}: <b>${v}</b> orang\n`;
          });

          let vrKatText = "";
          Object.entries(vrKatMap).forEach(([k, v]) => {
            vrKatText += `   • ${k}: <b>${v}</b> orang\n`;
          });

          const totalSemuaLunas = offIndivLunas + offKomPesertaCount + vrLunas;

          const statsMessage =
`📊 <b>REKAP & STATISTIK PENDAFTARAN</b>
📅 <i>Per ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB</i>

🏃‍♂️ <b>OFFLINE RUN:</b>
• Individu Lunas: <b>${offIndivLunas}</b> peserta
${katText || "   • (Belum ada data)\n"}• Komunitas Lunas: <b>${offKomLunas}</b> grup (<b>${offKomPesertaCount}</b> pelari)
• Menunggu Bayar: <b>${offIndivPending + offKomPending}</b>
• Dibatalkan: <b>${offIndivBatal}</b>

🌐 <b>VIRTUAL RUN:</b>
• Total Lunas: <b>${vrLunas}</b> peserta
${vrKatText || "   • (Belum ada data)\n"}• Menunggu Bayar: <b>${vrPending}</b>

🏆 <b>TOTAL SELURUH PELARI LUNAS:</b> <code>${totalSemuaLunas}</code> Orang`;

          await sendReply(statsMessage);
        } catch (e: any) {
          console.error("Stats error:", e);
          await sendReply(`⚠️ Gagal mengambil statistik: ${e.message}`);
        }
        return NextResponse.json({ ok: true });
      }

      // Handler BELUM BAYAR
      if (text === "⏳ Belum Bayar" || text.startsWith("/pending")) {
        try {
          const offIndivSnap = await dbAdmin.collection("offline_participants").get();
          const pendingList: any[] = [];

          offIndivSnap.docs.forEach((doc) => {
            const d = doc.data();
            const status = (d.statusPembayaran || "Belum Bayar").toLowerCase();
            if (!status.includes("lunas") && !status.includes("paid") && !status.includes("batal")) {
              pendingList.push({ id: doc.id, ...d });
            }
          });

          if (pendingList.length === 0) {
            await sendReply("🎉 <b>Semua peserta telah lunas / tidak ada tagihan pending!</b>");
            return NextResponse.json({ ok: true });
          }

          let pendingText = `⏳ <b>DAFTAR PENDING OFFLINE (${pendingList.length} Peserta):</b>\n\n`;
          pendingList.slice(0, 10).forEach((p, idx) => {
            pendingText += `${idx + 1}. <b>${p.namaLengkap || p.nama}</b>\n`;
            pendingText += `   🎯 Kategori: ${p.kategori || p.jarak || "-"} | Rp ${(p.totalBayar || 0).toLocaleString("id-ID")}\n`;
            pendingText += `   📱 WA: <code>${p.noWhatsApp || p.telepon || "-"}</code>\n`;
            pendingText += `   🆔 ID: <code>${p.id}</code>\n\n`;
          });

          if (pendingList.length > 10) {
            pendingText += `<i>...dan ${pendingList.length - 10} peserta lainnya (silakan cek web admin untuk daftar lengkap).</i>`;
          }

          await sendReply(pendingText);
        } catch (e: any) {
          await sendReply(`⚠️ Gagal memuat data pending: ${e.message}`);
        }
        return NextResponse.json({ ok: true });
      }

      // Handler Panduan Cari Peserta
      if (text === "🔍 Cari Peserta") {
        await sendReply(
`🔍 <b>PENCARIAN DATA PESERTA SPESIFIK</b>

Silakan ketik perintah pencarian dengan format:
👉 <code>/cari [kata kunci]</code>
<i>atau ketik langsung nama / BIB / No WA / Email peserta.</i>

<b>Contoh:</b>
• <code>/cari Budi Santoso</code>
• <code>/cari 5001</code>
• <code>/cari 08123456789</code>`
        );
        return NextResponse.json({ ok: true });
      }

      // Handler EKSEKUSI PENCARIAN (Bisa via `/cari <kata>` atau teks pencarian apa pun)
      let queryKata = "";
      if (text.startsWith("/cari ")) {
        queryKata = text.replace("/cari ", "").trim();
      } else if (!text.startsWith("/")) {
        // Teks biasa (asumsikan user langsung ketik nama/nomor yang dicari)
        queryKata = text.trim();
      }

      if (queryKata && queryKata.length >= 2) {
        try {
          const qLower = queryKata.toLowerCase();
          const results: any[] = [];

          // 1. Cari di offline_participants
          const offSnap = await dbAdmin.collection("offline_participants").get();
          offSnap.docs.forEach((doc) => {
            const d = doc.data();
            const nama = (d.namaLengkap || d.nama || "").toLowerCase();
            const bib = (d.nomorBIB || d.bib || "").toLowerCase();
            const wa = (d.noWhatsApp || d.telepon || "").toLowerCase();
            const email = (d.email || "").toLowerCase();
            const id = doc.id.toLowerCase();

            if (nama.includes(qLower) || bib.includes(qLower) || wa.includes(qLower) || email.includes(qLower) || id.includes(qLower)) {
              results.push({
                type: "Offline Run (Individu)",
                id: doc.id,
                nama: d.namaLengkap || d.nama,
                bib: d.nomorBIB || d.bib || "(Belum Terbit)",
                gender: d.jenisKelamin || "-",
                kategori: d.kategori || d.jarak || "-",
                wa: d.noWhatsApp || d.telepon || "-",
                email: d.email || "-",
                status: d.statusPembayaran || "Belum Bayar",
                total: d.totalBayar || d.hargaAsli || 0,
                ukuranJersey: d.ukuranJersey || d.sizeJersey || "-",
                golDarah: d.golonganDarah || "-",
                kontakDarurat: d.kontakDarurat || d.nomorDarurat || "-",
                riwayatPenyakit: d.riwayatPenyakit || "-",
                isImport: d.isImport ? "Ya" : "Web",
              });
            }
          });

          // 2. Cari di pendaftaran_komunitas
          const komSnap = await dbAdmin.collection("pendaftaran_komunitas").get();
          komSnap.docs.forEach((doc) => {
            const d = doc.data();
            const namaKomunitas = (d.namaKomunitas || "").toLowerCase();
            const kapten = (d.namaKapten || d.nama || "").toLowerCase();
            const wa = (d.whatsappKapten || d.telepon || "").toLowerCase();
            const email = (d.emailKapten || d.email || "").toLowerCase();

            if (namaKomunitas.includes(qLower) || kapten.includes(qLower) || wa.includes(qLower) || email.includes(qLower)) {
              results.push({
                type: "Offline Komunitas",
                id: doc.id,
                nama: `${d.namaKomunitas} (Kapten: ${d.namaKapten})`,
                bib: "Grup",
                gender: "-",
                kategori: `${d.jumlahPeserta || (d.anggota?.length || 0)} Anggota`,
                wa: d.whatsappKapten || "-",
                email: d.emailKapten || "-",
                status: d.statusPembayaran || "Belum Bayar",
                total: d.totalBayar || 0,
                ukuranJersey: "-",
                golDarah: "-",
                kontakDarurat: "-",
                riwayatPenyakit: "-",
                isImport: "Web",
              });
            }
          });

          // 3. Cari di vr_participants
          const vrSnap = await dbAdmin.collection("vr_participants").get();
          vrSnap.docs.forEach((doc) => {
            const d = doc.data();
            const nama = (d.nama || "").toLowerCase();
            const bib = (d.nomorBibLengkap || d.nomorBIB || "").toLowerCase();
            const wa = (d.telepon || d.noWhatsApp || "").toLowerCase();
            const email = (d.email || "").toLowerCase();

            if (nama.includes(qLower) || bib.includes(qLower) || wa.includes(qLower) || email.includes(qLower)) {
              results.push({
                type: "Virtual Run",
                id: doc.id,
                nama: d.nama,
                bib: d.nomorBibLengkap || d.nomorBIB || "(Belum Terbit)",
                gender: d.jenisKelamin || "-",
                kategori: d.kategori || d.paketLari || "-",
                wa: d.telepon || d.noWhatsApp || "-",
                email: d.email || "-",
                status: d.statusPembayaran || "Belum Bayar",
                total: d.totalBayar || 0,
                ukuranJersey: d.ukuranJersey || "-",
                golDarah: d.golonganDarah || "-",
                kontakDarurat: d.kontakDarurat || "-",
                riwayatPenyakit: "-",
                isImport: "Web",
              });
            }
          });

          if (results.length === 0) {
            await sendReply(
`🔎 <i>Pencarian untuk:</i> "<b>${queryKata}</b>"

❌ <b>Tidak ditemukan data yang cocok.</b>
Coba gunakan nama panggilan atau nomor BIB / WhatsApp yang lebih spesifik.`
            );
            return NextResponse.json({ ok: true });
          }

          let responseText = `🔎 <b>HASIL PENCARIAN (${results.length} ditemukan):</b>\n\n`;
          
          results.slice(0, 5).forEach((r, idx) => {
            const isLunas = (r.status || "").toLowerCase().includes("lunas");
            const statusIcon = isLunas ? "✅" : "⏳";

            responseText += `<b>#${idx + 1} ${r.nama}</b>\n`;
            responseText += `📌 Event: <b>${r.type}</b>\n`;
            responseText += `🏷️ BIB: <code>${r.bib}</code>\n`;
            responseText += `🎯 Kategori: <b>${r.kategori}</b> | Gender: ${r.gender}\n`;
            responseText += `📱 WA: <code>${r.wa}</code>\n`;
            responseText += `✉️ Email: <code>${r.email}</code>\n`;
            responseText += `👕 Jersey: ${r.ukuranJersey} | 🩸 Gol Darah: ${r.golDarah}\n`;
            responseText += `🚨 Kontak Darurat: <code>${r.kontakDarurat}</code>\n`;
            if (r.riwayatPenyakit && r.riwayatPenyakit !== "-") {
              responseText += `🩺 Riwayat: ${r.riwayatPenyakit}\n`;
            }
            responseText += `${statusIcon} Status: <b>${r.status}</b> (Rp ${Number(r.total).toLocaleString("id-ID")})\n`;
            responseText += `🆔 ID: <code>${r.id}</code>\n\n`;
          });

          if (results.length > 5) {
            responseText += `<i>⚠️ Menampilkan 5 dari ${results.length} hasil. Ketikkan kata kunci yang lebih spesifik jika data yang dicari belum muncul.</i>`;
          }

          await sendReply(responseText);
        } catch (e: any) {
          console.error("Search error:", e);
          await sendReply(`⚠️ Gagal melakukan pencarian: ${e.message}`);
        }
        return NextResponse.json({ ok: true });
      }
    }

    // 2. Tangani Callback Query dari Tombol Interaktif
    if (update.callback_query) {
      const cq = update.callback_query;
      const callbackData: string = cq.data || "";
      const fromUser = cq.from;
      const adminName = fromUser.username ? `@${fromUser.username}` : fromUser.first_name || "Admin";
      const message = cq.message;
      const originalCaption = message?.caption || "";

      // Validasi keamanan admin jika adminChatId disetel
      if (adminChatId && String(message?.chat?.id) !== String(adminChatId) && String(fromUser.id) !== String(adminChatId)) {
        await answerTelegramCallbackQuery(botToken, cq.id, "⛔ Anda tidak memiliki otoritas admin untuk aksi ini!", true);
        return NextResponse.json({ ok: true });
      }

      const [action, type, id] = callbackData.split(":");

      if (!action || !type || !id) {
        await answerTelegramCallbackQuery(botToken, cq.id, "Data aksi tidak valid", true);
        return NextResponse.json({ ok: true });
      }

      // ============================================================
      // AKSI REJECT / TOLAK
      // ============================================================
      if (action === "reject") {
        if (type === "offline_indiv") {
          await dbAdmin.collection("offline_participants").doc(id).update({
            statusPembayaran: "Batal",
          });
        } else if (type === "offline_komunitas") {
          await dbAdmin.collection("pendaftaran_komunitas").doc(id).update({
            statusPembayaran: "Batal",
          });
        } else if (type === "vr_indiv") {
          await dbAdmin.collection("vr_participants").doc(id).update({
            statusPembayaran: "Batal",
          });
        }

        await answerTelegramCallbackQuery(botToken, cq.id, "❌ Pembayaran Ditolak.", true);
        const newCaption = `${originalCaption}\n\n❌ <b>PEMBAYARAN DITOLAK</b> oleh ${adminName} pada ${new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`;
        await editTelegramCaption(botToken, message.chat.id, message.message_id, newCaption);
        return NextResponse.json({ ok: true });
      }

      // ============================================================
      // AKSI APPROVE (SETUJUI & TERBITKAN BIB)
      // ============================================================
      if (action === "approve") {
        // --- 1. OFFLINE INDIVIDU ---
        if (type === "offline_indiv") {
          const pRef = dbAdmin.collection("offline_participants").doc(id);
          const pSnap = await pRef.get();

          if (!pSnap.exists) {
            await answerTelegramCallbackQuery(botToken, cq.id, "Peserta tidak ditemukan!", true);
            return NextResponse.json({ ok: true });
          }

          const pData = pSnap.data()!;
          if (pData.statusPembayaran === "Lunas") {
            await answerTelegramCallbackQuery(botToken, cq.id, `Peserta sudah lunas sebelumnya! (BIB: ${pData.nomorBIB || pData.bib})`, true);
            return NextResponse.json({ ok: true });
          }

          let finalBib = pData.nomorBIB || pData.bib;

          if (!finalBib) {
            const counterRef = dbAdmin.collection("pengaturan").doc("counter_bib_offline");
            const jarakAngka = (pData.jarak || "5").replace(/\D/g, "") || "5";
            const counterField = `lastBib${jarakAngka}K`;

            await dbAdmin.runTransaction(async (t) => {
              const cSnap = await t.get(counterRef);
              const currentVal = cSnap.exists ? (cSnap.data()?.[counterField] || 0) : 0;
              const nextVal = currentVal + 1;
              finalBib = `${jarakAngka}${String(nextVal).padStart(3, "0")}`;

              t.set(counterRef, { [counterField]: nextVal }, { merge: true });
              t.update(pRef, {
                statusPembayaran: "Lunas",
                waktuLunas: new Date().toISOString(),
                nomorBIB: finalBib,
                bib: finalBib,
              });
            });
          } else {
            await pRef.update({
              statusPembayaran: "Lunas",
              waktuLunas: new Date().toISOString(),
            });
          }

          // Kirim Email E-Ticket
          try {
            await executeSendEmail({
              type: "payment_success_offline",
              email: pData.email,
              nama: pData.namaLengkap,
              detail: {
                id: pSnap.id,
                nik: pData.nik || "-",
                jarak: pData.jarak || "-",
                ukuranJersey: pData.ukuranJersey || "-",
                namaBib: pData.namaBib || "-",
                bib: finalBib,
                biayaPendaftaran: pData.totalTagihan || 0,
                donasi: pData.donasi || 0,
                totalBayar: pData.totalTagihan || 0,
                metodePembayaran: "Transfer Manual (Telegram Bot)",
              },
            });
          } catch (e) {
            console.error("Gagal kirim email e-ticket via bot:", e);
          }

          // Catat Log
          await dbAdmin.collection("vr_logs").add({
            type: "bayar",
            action: `menyetujui pembayaran offline (BIB: ${finalBib}) via Telegram Bot untuk`,
            targetName: pData.namaLengkap,
            adminEmail: adminName,
            timestamp: Date.now(),
          });

          await answerTelegramCallbackQuery(botToken, cq.id, `✅ Berhasil! BIB ${finalBib} terbit & E-Ticket terkirim.`, true);
          const newCaption = `${originalCaption}\n\n✅ <b>TELAH DISETUJUI</b> oleh ${adminName}\n🏷️ <b>Nomor BIB:</b> ${finalBib}\n⏰ <b>Waktu:</b> ${new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`;
          await editTelegramCaption(botToken, message.chat.id, message.message_id, newCaption);
          return NextResponse.json({ ok: true });
        }

        // --- 2. OFFLINE KOMUNITAS ---
        if (type === "offline_komunitas") {
          const groupRef = dbAdmin.collection("pendaftaran_komunitas").doc(id);
          const groupSnap = await groupRef.get();

          if (!groupSnap.exists) {
            await answerTelegramCallbackQuery(botToken, cq.id, "Grup komunitas tidak ditemukan!", true);
            return NextResponse.json({ ok: true });
          }

          const gData = groupSnap.data()!;
          if (gData.statusPembayaran === "Lunas") {
            await answerTelegramCallbackQuery(botToken, cq.id, "Komunitas sudah Lunas sebelumnya!", true);
            return NextResponse.json({ ok: true });
          }

          let finalParticipants: any[] = [];
          const counterRef = dbAdmin.collection("pengaturan").doc("counter_bib_offline");

          await dbAdmin.runTransaction(async (t) => {
            const cSnap = await t.get(counterRef);
            const cData = cSnap.exists ? cSnap.data() : {};
            let updatedCategoryCounters: Record<string, number> = {};

            finalParticipants = (gData.participants || []).map((member: any) => {
              if (member.nomorBIB || member.bib) return member;

              const jarakAngka = (member.kategori || member.jarak || "5").replace(/\D/g, "") || "5";
              const counterField = `lastBib${jarakAngka}K`;

              if (updatedCategoryCounters[counterField] === undefined) {
                updatedCategoryCounters[counterField] = Number(cData?.[counterField]) || 0;
              }

              updatedCategoryCounters[counterField]++;
              const generatedBib = `${jarakAngka}${String(updatedCategoryCounters[counterField]).padStart(3, "0")}`;

              return { ...member, nomorBIB: generatedBib, bib: generatedBib };
            });

            t.set(counterRef, updatedCategoryCounters, { merge: true });
            t.update(groupRef, {
              statusPembayaran: "Lunas",
              waktuLunas: new Date().toISOString(),
              participants: finalParticipants,
            });
          });

          // Kirim Email E-Ticket Komunitas
          try {
            await executeSendEmail({
              type: "payment_success_komunitas",
              email: gData.kapten?.email,
              nama: gData.kapten?.nama,
              detail: {
                id: groupSnap.id,
                komunitas: gData.kapten?.komunitas || "-",
                totalPeserta: finalParticipants.length || 0,
                totalBiaya: gData.totalBiaya || 0,
                participants: finalParticipants,
              },
            });
          } catch (e) {
            console.error("Gagal kirim email komunitas via bot:", e);
          }

          // Catat Log
          await dbAdmin.collection("vr_logs").add({
            type: "bayar",
            action: `menyetujui pembayaran komunitas (${finalParticipants.length} Peserta) via Telegram Bot untuk`,
            targetName: gData.kapten?.komunitas || "Komunitas",
            adminEmail: adminName,
            timestamp: Date.now(),
          });

          await answerTelegramCallbackQuery(botToken, cq.id, `✅ Berhasil! ${finalParticipants.length} BIB Komunitas terbit.`, true);
          const newCaption = `${originalCaption}\n\n✅ <b>TELAH DISETUJUI</b> oleh ${adminName} (${finalParticipants.length} BIB Terbit)\n⏰ <b>Waktu:</b> ${new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`;
          await editTelegramCaption(botToken, message.chat.id, message.message_id, newCaption);
          return NextResponse.json({ ok: true });
        }

        // --- 3. VIRTUAL RUN INDIVIDU ---
        if (type === "vr_indiv") {
          const vrRef = dbAdmin.collection("vr_participants").doc(id);
          const vrSnap = await vrRef.get();

          if (!vrSnap.exists) {
            await answerTelegramCallbackQuery(botToken, cq.id, "Peserta Virtual Run tidak ditemukan!", true);
            return NextResponse.json({ ok: true });
          }

          const vrData = vrSnap.data()!;
          if (vrData.statusPembayaran === "Lunas") {
            await answerTelegramCallbackQuery(botToken, cq.id, `Peserta sudah lunas! (BIB: ${vrData.nomorBibLengkap || vrData.nomorBIB})`, true);
            return NextResponse.json({ ok: true });
          }

          let bibNumber = vrData.nomorBibLengkap || vrData.nomorBIB;

          if (!bibNumber) {
            const kodeJarak = (vrData.jarak || "5").replace(/\D/g, "");
            const sameCatSnap = await dbAdmin
              .collection("vr_participants")
              .where("jarak", "==", vrData.jarak)
              .get();

            let maxUrut = 0;
            sameCatSnap.docs.forEach((d) => {
              const nomor = (d.data().nomorBibLengkap || d.data().nomorBIB || "") as string;
              const urutString = nomor.slice(kodeJarak.length);
              const urut = parseInt(urutString, 10);
              if (!isNaN(urut) && urut > maxUrut) maxUrut = urut;
            });

            bibNumber = `${kodeJarak}${String(maxUrut + 1).padStart(3, "0")}`;
          }

          await vrRef.update({
            statusPembayaran: "Lunas",
            nomorBibLengkap: bibNumber,
            nomorBIB: bibNumber,
            waktuLunas: new Date().toISOString(),
          });

          // Kirim Email Lunas
          try {
            await executeSendEmail({
              type: "payment_success",
              email: vrData.email,
              nama: vrData.nama,
              detail: {
                id: vrSnap.id,
                bib: bibNumber,
                eventName: "Virtual Run DPW IKA UII DIY",
              },
            });
          } catch (e) {
            console.error("Gagal kirim email VR lunas via bot:", e);
          }

          // Catat Log
          await dbAdmin.collection("vr_logs").add({
            type: "bayar",
            action: `menyetujui pembayaran virtual run (BIB: ${bibNumber}) via Telegram Bot untuk`,
            targetName: vrData.nama,
            adminEmail: adminName,
            timestamp: Date.now(),
          });

          await answerTelegramCallbackQuery(botToken, cq.id, `✅ Berhasil! BIB Virtual ${bibNumber} terbit.`, true);
          const newCaption = `${originalCaption}\n\n✅ <b>TELAH DISETUJUI</b> oleh ${adminName}\n🏷️ <b>Nomor BIB:</b> ${bibNumber}\n⏰ <b>Waktu:</b> ${new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB`;
          await editTelegramCaption(botToken, message.chat.id, message.message_id, newCaption);
          return NextResponse.json({ ok: true });
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
