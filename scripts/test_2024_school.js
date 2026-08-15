const http = require('http');

const routes2024 = [
  '/dashboard',
  '/dashboard/profil-institusi',
  '/dashboard/mutasi-rekening',
  '/dashboard/rencana-anggaran',
  '/dashboard/pengeluaran',
  '/dashboard/audit',
  '/dashboard/users',
  '/dashboard/jenjang/paud',
  '/dashboard/jenjang/sd',
  '/dashboard/jenjang/universitas'
];

async function check2024() {
  console.log('Testing Port 2024 (KB AL-IKHLAS NPSN: 69893669)...\n');
  for (const r of routes2024) {
    await new Promise((resolve) => {
      const start = Date.now();
      http.get(`http://localhost:2024${r}`, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          console.log(`[STATUS ${res.statusCode}] ${r.padEnd(32)} -> ${Date.now() - start}ms (Bytes: ${body.length})`);
          resolve();
        });
      }).on('error', (err) => {
        console.log(`[ERROR] ${r} -> ${err.message}`);
        resolve();
      });
    });
  }
}

check2024();
