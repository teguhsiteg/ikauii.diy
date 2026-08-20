/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const https = require('https');
const path = require('path');

const API_BASE = 'https://wilayah.id/api';

const fetchJson = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

async function main() {
  console.log('Mulai mengunduh data Provinsi dari wilayah.id...');
  const provRes = await fetchJson(`${API_BASE}/provinces.json`);
  const provinces = provRes.data.map(p => ({ id: p.code, name: p.name }));
  
  let regencies = [];
  let districts = [];

  console.log(`Berhasil mengunduh ${provinces.length} Provinsi.`);
  console.log('Mulai mengunduh Kota/Kabupaten & Kecamatan (ini butuh waktu beberapa detik)...');

  for (let i = 0; i < provinces.length; i++) {
    const prov = provinces[i];
    const regRes = await fetchJson(`${API_BASE}/regencies/${prov.id}.json`);
    const provRegencies = regRes.data.map(r => ({ id: r.code, province_id: prov.id, name: r.name }));
    regencies.push(...provRegencies);
    
    // Batch to avoid rate limit
    for (let j = 0; j < provRegencies.length; j += 10) {
      const batch = provRegencies.slice(j, j + 10);
      const batchPromises = batch.map(r => 
        fetchJson(`${API_BASE}/districts/${r.id}.json`)
          .then(res => res.data ? res.data.map(d => ({ id: d.code, regency_id: r.id, name: d.name })) : [])
          .catch(() => [])
      );
      const results = await Promise.all(batchPromises);
      results.forEach(d => {
        if (Array.isArray(d)) districts.push(...d);
      });
      await delay(20);
    }
    console.log(`[${i+1}/${provinces.length}] Selesai mengunduh data wilayah ${prov.name}`);
  }

  const finalData = {
    provinces,
    regencies,
    districts
  };

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)){
      fs.mkdirSync(publicDir);
  }

  fs.writeFileSync(path.join(publicDir, 'data-wilayah.json'), JSON.stringify(finalData));
  console.log('Data berhasil disimpan di public/data-wilayah.json! Ukuran: ', (JSON.stringify(finalData).length / 1024 / 1024).toFixed(2), 'MB');
}

main().catch(console.error);
