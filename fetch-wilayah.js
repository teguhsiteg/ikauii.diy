const fs = require('fs');
async function fetchWilayah() {
  console.log("Fetching provinces...");
  const provRes = await fetch("https://ibnux.github.io/data-indonesia/provinsi.json");
  const provinces = await provRes.json();
  
  let cities = {};
  console.log(`Fetching cities for ${provinces.length} provinces...`);
  for (const prov of provinces) {
    const cityRes = await fetch(`https://ibnux.github.io/data-indonesia/kabupaten/${prov.id}.json`);
    const cityData = await cityRes.json();
    cities[prov.id] = cityData;
  }
  
  fs.writeFileSync('lib/data-wilayah.json', JSON.stringify({ provinces, cities }));
  console.log("Done!");
}
fetchWilayah();
