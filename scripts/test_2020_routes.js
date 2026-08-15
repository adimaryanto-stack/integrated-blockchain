const http = require('http');

const routes2020 = [
  '/',
  '/provinces',
  '/statistics',
  '/funding',
  '/reporting',
  '/aliran-dana',
  '/audit',
  '/compare',
  '/about',
  '/faq',
  '/contact',
  '/dashboard/001058'
];

async function check() {
  console.log('Testing Port 2020 (Transparansi Anggaran Publik)...');
  for (const r of routes2020) {
    await new Promise((resolve) => {
      const start = Date.now();
      http.get(`http://localhost:2020${r}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`[STATUS ${res.statusCode}] ${r.padEnd(25)} (${Date.now() - start}ms, ${body.length} bytes)`);
          resolve();
        });
      }).on('error', (err) => {
        console.log(`[ERR] ${r} -> ${err.message}`);
        resolve();
      });
    });
  }
}

check();
