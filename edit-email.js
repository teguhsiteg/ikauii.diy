const fs = require('fs');
let content = fs.readFileSync('lib/core-email.ts', 'utf8');

const searchHtml = `              <tr>
                <td style="padding: 12px 15px; color: #5F6368;"><strong>Nomor BIB</strong></td>
                <td style="padding: 12px 15px; font-weight: 900; color: #1A73E8; font-size: 16px;">: \${detail?.bib || "Menunggu Admin"}</td>
              </tr>
            </table>
          </div>`;

const replaceHtml = `              <tr>
                <td style="padding: 12px 15px; color: #5F6368;"><strong>Nomor BIB</strong></td>
                <td style="padding: 12px 15px; font-weight: 900; color: #1A73E8; font-size: 16px;">: \${detail?.bib || "Menunggu Admin"}</td>
              </tr>
            </table>
          </div>
          
          \${detail?.isUtama && detail?.totalTagihan > 0 ? \`
          <div style="background-color: #F8F9FA; padding: 20px; border: 1px solid #DADCE0; border-radius: 8px; margin: 25px 0;">
            <p style="margin: 0; font-size: 12px; color: #5F6368; font-weight: 700; text-transform: uppercase;">Rekap Transaksi (Pemesan Utama)</p>
            <table style="width: 100%; text-align: left; font-size: 14px; color: #202124; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px 0; color: #5F6368; border-bottom: 1px dashed #DADCE0;"><strong>Total Pembayaran</strong></td>
                <td style="padding: 8px 0; font-weight: bold; border-bottom: 1px dashed #DADCE0;">: Rp \${Number(detail.totalTagihan).toLocaleString("id-ID")}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #5F6368;"><strong>Status</strong></td>
                <td style="padding: 8px 0; font-weight: bold; color: #1E8E3E;">: LUNAS</td>
              </tr>
            </table>
            <p style="margin: 15px 0 0 0; font-size: 12px; color: #5F6368;">*E-Ticket untuk anggota grup Anda telah dikirimkan ke email mereka masing-masing.</p>
          </div>
          \` : ''}`;

if(content.includes(searchHtml)) {
  content = content.replace(searchHtml, replaceHtml);
  fs.writeFileSync('lib/core-email.ts', content);
  console.log("Email template updated.");
} else {
  console.log("Not found string");
}
