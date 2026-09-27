const http = require('http');

async function testSearch(jenjang, term) {
  const url = `http://localhost:2028/rest/v1/institusi_pendidikan?jenjang=eq.${encodeURIComponent(jenjang)}&nama_institusi=ilike.*${encodeURIComponent(term)}*&select=id,nama_institusi,npsn,provinsi_nama,kabupaten_kota_nama&limit=10`;
  const start = Date.now();
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`Search [${jenjang}] "${term}" -> Status ${res.statusCode} (${Date.now() - start}ms)`);
        try {
          const json = JSON.parse(body);
          console.log(`Found ${json.length} results:`, json.slice(0, 3));
        } catch (e) {
          console.log('Error parsing:', body);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log('Error:', err.message);
      resolve();
    });
  });
}

async function run() {
  await testSearch('SD', 'Menteng');
  await testSearch('SD', 'SDN');
}

run();
