const http = require('http');

const allRoutes = [
  // Port 2020: Transparansi Publik
  { port: 2020, name: 'Transparansi', path: '/' },
  { port: 2020, name: 'Transparansi', path: '/provinsi' },
  { port: 2020, name: 'Transparansi', path: '/institusi' },
  { port: 2020, name: 'Transparansi', path: '/transaksi' },

  // Port 2021: Dashboard Kementerian
  { port: 2021, name: 'Kementerian', path: '/dashboard' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/jenjang/universitas' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/jenjang/sma' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/jenjang/smp' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/jenjang/sd' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/jenjang/paud' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/kabupaten-kota' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/provinsi' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/audit' },
  { port: 2021, name: 'Kementerian', path: '/dashboard/users' },

  // Port 2022: Dashboard Bank
  { port: 2022, name: 'Bank', path: '/dashboard' },
  { port: 2022, name: 'Bank', path: '/dashboard/jenjang/universitas' },
  { port: 2022, name: 'Bank', path: '/dashboard/jenjang/sma' },
  { port: 2022, name: 'Bank', path: '/dashboard/jenjang/smp' },
  { port: 2022, name: 'Bank', path: '/dashboard/jenjang/sd' },
  { port: 2022, name: 'Bank', path: '/dashboard/jenjang/paud' },
  { port: 2022, name: 'Bank', path: '/dashboard/kabupaten-kota' },
  { port: 2022, name: 'Bank', path: '/dashboard/provinsi' },
  { port: 2022, name: 'Bank', path: '/dashboard/profil-institusi' },
  { port: 2022, name: 'Bank', path: '/dashboard/users' },

  // Port 2023: Dashboard Auditor
  { port: 2023, name: 'Auditor', path: '/dashboard' },
  { port: 2023, name: 'Auditor', path: '/dashboard/jenjang/universitas' },
  { port: 2023, name: 'Auditor', path: '/dashboard/jenjang/sma' },
  { port: 2023, name: 'Auditor', path: '/dashboard/jenjang/smp' },
  { port: 2023, name: 'Auditor', path: '/dashboard/jenjang/sd' },
  { port: 2023, name: 'Auditor', path: '/dashboard/jenjang/paud' },
  { port: 2023, name: 'Auditor', path: '/dashboard/kabupaten-kota' },
  { port: 2023, name: 'Auditor', path: '/dashboard/provinsi' },
  { port: 2023, name: 'Auditor', path: '/dashboard/audit' },
  { port: 2023, name: 'Auditor', path: '/dashboard/users' },

  // Port 2024: Institusi Pendidikan
  { port: 2024, name: 'Institusi', path: '/dashboard' },
  { port: 2024, name: 'Institusi', path: '/dashboard/jenjang/universitas' },
  { port: 2024, name: 'Institusi', path: '/dashboard/jenjang/sma' },
  { port: 2024, name: 'Institusi', path: '/dashboard/jenjang/smp' },
  { port: 2024, name: 'Institusi', path: '/dashboard/jenjang/sd' },
  { port: 2024, name: 'Institusi', path: '/dashboard/jenjang/paud' },
  { port: 2024, name: 'Institusi', path: '/dashboard/kabupaten-kota' },
  { port: 2024, name: 'Institusi', path: '/dashboard/provinsi' },
  { port: 2024, name: 'Institusi', path: '/dashboard/audit' },
  { port: 2024, name: 'Institusi', path: '/dashboard/mutasi-rekening' },
  { port: 2024, name: 'Institusi', path: '/dashboard/users' },
];

async function checkRoute(item) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`http://localhost:${item.port}${item.path}`, { timeout: 10000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const ms = Date.now() - start;
        console.log(`[${res.statusCode === 200 ? 'OK 200' : 'ERR ' + res.statusCode}] Port ${item.port} (${item.name.padEnd(12)}) ${item.path.padEnd(32)} -> ${ms}ms`);
        resolve({ ...item, status: res.statusCode, timeMs: ms });
      });
    });
    req.on('error', (err) => {
      console.log(`[FAILED] Port ${item.port} ${item.path} -> ${err.message}`);
      resolve({ ...item, status: 'ERROR', error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      console.log(`[TIMEOUT] Port ${item.port} ${item.path}`);
      resolve({ ...item, status: 'TIMEOUT' });
    });
  });
}

async function main() {
  console.log('=== COMPREHENSIVE ROUTE & PERFORMANCE TEST ACROSS ALL DASHBOARDS ===\n');
  let passCount = 0;
  let failCount = 0;

  for (const r of allRoutes) {
    const res = await checkRoute(r);
    if (res.status === 200) passCount++;
    else failCount++;
  }

  console.log(`\n=================================================`);
  console.log(`TOTAL ROUTES TESTED: ${allRoutes.length}`);
  console.log(`PASSED (200 OK)    : ${passCount}`);
  console.log(`FAILED / TIMEOUT   : ${failCount}`);
  console.log(`=================================================`);
}

main();
