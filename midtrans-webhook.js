const fs = require('fs');

let content = fs.readFileSync('app/api/midtrans-webhook/route.ts', 'utf8');

// The line we want to insert our multi-ticket logic is right before updating OFFLINE RUN
const searchString = `// --- UPDATE OFFLINE RUN & VIRTUAL RUN ---`;

const replacement = `// --- UPDATE OFFLINE RUN & VIRTUAL RUN ---
        
        // ?? MULTI-TICKET LOGIC ??
        if (eventType === "offline" && targetData.orderIdGroup) {
          // Cari semua peserta dengan orderIdGroup yang sama
          const groupSnap = await dbAdmin.collection("offline_participants").where("orderIdGroup", "==", targetData.orderIdGroup).get();
          
          if (!groupSnap.empty) {
            console.log(\`[Midtrans] Memproses \${groupSnap.size} tiket untuk orderIdGroup \${targetData.orderIdGroup}\`);
            
            // Loop semua tiket dalam grup ini
            const updatePromises = groupSnap.docs.map(async (docSnap) => {
              const pData = docSnap.data();
              let pBib = pData.nomorBIB || "";
              
              if (statusPembayaran === "Lunas" && !pBib) {
                try {
                  const counterRef = dbAdmin.collection("pengaturan").doc("counter_bib_offline");
                  await dbAdmin.runTransaction(async (transaction) => {
                    const counterSnap = await transaction.get(counterRef);
                    let nomorUrutBaru = 500; // Mulai dari 500 sesuai request user
                    
                    if (counterSnap.exists && (counterSnap.data()?.lastBib || 0) >= 500) {
                      nomorUrutBaru = (counterSnap.data()?.lastBib || 0) + 1;
                    }
                    
                    const jarakAngka = (pData?.jarak || "9").replace(/\\D/g, "") || "9";
                    pBib = \`\${jarakAngka}\${String(nomorUrutBaru).padStart(3, "0")}\`;
                    
                    transaction.set(counterRef, { lastBib: nomorUrutBaru }, { merge: true });
                  });
                } catch (err) {
                  console.error("[Midtrans] Gagal generate BIB:", err);
                  pBib = "TUNDA";
                }
              }
              
              // Update individual participant
              await docSnap.ref.update({
                statusPembayaran: statusPembayaran === "Batal" ? "Dibatalkan" : statusPembayaran,
                paymentType: body.payment_type || "midtrans",
                waktuLunas: statusPembayaran === "Lunas" ? new Date().toISOString() : null,
                ...(pBib ? { nomorBIB: pBib } : {}),
              });
              
              // Kirim E-ticket ke masing-masing peserta (Opsi 3: setiap peserta dapat tiket)
              if (statusPembayaran === "Lunas") {
                const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://ikadiy.uii.ac.id";
                try {
                  const internalSecret = process.env.INTERNAL_API_SECRET || "";
                  await fetch(\`\${baseUrl}/api/send-email\`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "x-internal-secret": internalSecret },
                    body: JSON.stringify({
                      type: "payment_success_offline",
                      email: pData?.email,
                      nama: pData?.namaLengkap,
                      detail: {
                        id: docSnap.id,
                        totalTagihan: pData?.isUtama ? pData?.totalTagihan : 0, // 0 untuk anggota
                        nik: pData?.nik || "-",
                        jarak: pData?.jarak || "-",
                        ukuranJersey: pData?.ukuranJersey || "-",
                        namaBib: pData?.namaBib || "-",
                        bib: pBib || pData?.nomorBIB || "-",
                        isGrup: true,
                        isUtama: pData?.isUtama || false
                      },
                    }),
                  });
                } catch (e) {
                  console.error("[Midtrans] Email Gagal:", e);
                }
              }
            });
            
            await Promise.all(updatePromises);
            console.log(\`[Midtrans] Sukses proses grup \${targetData.orderIdGroup}\`);
            return NextResponse.json({ message: "OK Group Processed" }, { status: 200 });
          }
        }`;

if (content.includes(searchString)) {
  content = content.replace(searchString, replacement);
  fs.writeFileSync('app/api/midtrans-webhook/route.ts', content);
  console.log("Multi-ticket logic added to webhook.");
} else {
  console.log("Could not find the target string.");
}
