const http = require('http');

const testUrls = [
  // 2020: Transparansi Publik
  { name: 'Transparansi Home', url: 'http://localhost:2020/' },
  { name: 'Transparansi Funding', url: 'http://localhost:2020/funding' },
  { name: 'Transparansi Aliran Dana', url: 'http://localhost:2020/aliran-dana' },
  { name: 'Transparansi Statistics', url: 'http://localhost:2020/statistics' },

  // 2021: Dashboard Kementerian
  { name: 'Kementerian Dashboard', url: 'http://localhost:2021/dashboard' },
  { name: 'Kementerian Universitas', url: 'http://localhost:2021/dashboard/jenjang/universitas' },
  { name: 'Kementerian SMA', url: 'http://localhost:2021/dashboard/jenjang/sma' },
  { name: 'Kementerian APBN', url: 'http://localhost:2021/dashboard/apbn' },

  // 2022: Dashboard Bank
  { name: 'Bank Dashboard', url: 'http://localhost:2022/dashboard' },
  { name: 'Bank Universitas', url: 'http://localhost:2022/dashboard/jenjang/universitas' },
  { name: 'Bank Profil Institusi', url: 'http://localhost:2022/dashboard/profil-institusi' },

  // 2023: Dashboard Auditor
  { name: 'Auditor Dashboard', url: 'http://localhost:2023/dashboard' },
  { name: 'Auditor SMA', url: 'http://localhost:2023/dashboard/jenjang/sma' },
  { name: 'Auditor Audit', url: 'http://localhost:2023/dashboard/audit' },

  // 2024: Dashboard Institusi
  { name: 'Institusi Dashboard', url: 'http://localhost:2024/dashboard' },
  { name: 'Institusi Mutasi', url: 'http://localhost:2024/dashboard/mutasi-rekening' },
  { name: 'Institusi Universitas', url: 'http://localhost:2024/dashboard/jenjang/universitas' },
];

async function run() {
  console.log('=== VERIFYING ALL 5 APPS WITH YEAR 2026 DATABASE ===\n');
  for (const item of testUrls) {
    await new Promise((resolve) => {
      const start = Date.now();
      http.get(item.url, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          console.log(`[STATUS ${res.statusCode}] ${item.name.padEnd(25)} -> ${Date.now() - start}ms (Bytes: ${body.length})`);
          resolve();
        });
      }).on('error', (err) => {
        console.log(`[ERROR] ${item.name} -> ${err.message}`);
        resolve();
      });
    });
  }
}

run();
