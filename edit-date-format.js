const fs = require('fs');
let code = fs.readFileSync('app/run/daftar/page.tsx', 'utf8');

// Function to format date safely
const searchHeaderDate = `{settings?.offlineTanggal || "11 Agustus 2024"}`;
const replaceHeaderDate = `{settings?.offlineDate ? new Date(settings.offlineDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}`;

const searchHeaderTime = `05.00 WIB`;
const replaceHeaderTime = `{settings?.offlineTime || "05:00"} WIB`;

code = code.replace(searchHeaderDate, replaceHeaderDate);
code = code.replace(searchHeaderTime, replaceHeaderTime);

fs.writeFileSync('app/run/daftar/page.tsx', code);
console.log("Updated date format");
