const http = require('http');
const { Pool } = require('pg');

async function testAll() {
  console.log('=== AUDITING ALL 9 PORTS & DATABASE CONNECTIONS ===\n');

  // 1. Check PostgreSQL (Port 2027)
  const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:2027/postgres' });
  const startDb = Date.now();
  try {
    const tableRes = await pool.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");
    const instRes = await pool.query("SELECT id, npsn, nama_institusi, alamat, nominal_alokasi, realisasi_total FROM public.institusi_pendidikan WHERE id = 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7'");
    console.log('[Port 2027] PostgreSQL Database  : ONLINE (' + (Date.now() - startDb) + 'ms)');
    console.log('            Public Tables Count  :', tableRes.rows[0].count);
    console.log('            KB AL-IKHLAS DB Row  :', instRes.rows[0]?.nama_institusi || 'Found');
  } catch (e) {
    console.log('[Port 2027] PostgreSQL Database  : ERROR', e.message);
  }
  await pool.end();

  // Helper HTTP GET
  const getHttp = (url) => new Promise(resolve => {
    const start = Date.now();
    http.get(url, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => resolve({ status: res.statusCode, time: Date.now() - start, length: b.length, body: b }));
    }).on('error', e => resolve({ status: 'ERROR', message: e.message }));
  });

  // 2. Check Proxy API Server (Port 2028)
  const p2028 = await getHttp('http://localhost:2028/rest/v1/institusi_pendidikan?npsn=eq.69893669');
  console.log('\n[Port 2028] PostgREST Proxy API  :', p2028.status, '(' + p2028.time + 'ms)', p2028.length + ' bytes');
  if (p2028.status === 200) {
    try {
      const parsed = JSON.parse(p2028.body);
      console.log('            Response School      :', parsed[0]?.nama_institusi, '| Alamat:', parsed[0]?.alamat);
    } catch (_) {}
  }

  // 3. Check Port 2020 (Transparansi Publik)
  const p2020 = await getHttp('http://localhost:2020');
  console.log('\n[Port 2020] Transparansi Publik  :', p2020.status, '(' + p2020.time + 'ms)', p2020.length + ' bytes');

  // 4. Check Port 2021 (Dashboard Kementerian)
  const p2021 = await getHttp('http://localhost:2021/dashboard');
  console.log('\n[Port 2021] Dashboard Kementerian:', p2021.status, '(' + p2021.time + 'ms)', p2021.length + ' bytes');

  // 5. Check Port 2022 (Dashboard Bank)
  const p2022 = await getHttp('http://localhost:2022/dashboard');
  console.log('\n[Port 2022] Dashboard Bank       :', p2022.status, '(' + p2022.time + 'ms)', p2022.length + ' bytes');

  // 6. Check Port 2023 (Dashboard Auditor)
  const p2023 = await getHttp('http://localhost:2023/dashboard/audit');
  console.log('\n[Port 2023] Dashboard Auditor    :', p2023.status, '(' + p2023.time + 'ms)', p2023.length + ' bytes');

  // 7. Check Port 2024 (Institusi Pendidikan)
  const p2024 = await getHttp('http://localhost:2024/dashboard');
  console.log('\n[Port 2024] Institusi Pendidikan :', p2024.status, '(' + p2024.time + 'ms)', p2024.length + ' bytes');

  // 8. Check Port 2025 (Dashboard APBD Lampung)
  const p2025 = await getHttp('http://localhost:2025/dashboard');
  console.log('\n[Port 2025] Dashboard APBD       :', p2025.status, '(' + p2025.time + 'ms)', p2025.length + ' bytes');

  // 9. Check Port 2026 (Dashboard Admin)
  const p2026 = await getHttp('http://localhost:2026');
  console.log('\n[Port 2026] Dashboard Admin      :', p2026.status, '(' + p2026.time + 'ms)', p2026.length + ' bytes');

  console.log('\n=== ALL 9 PORTS AUDIT COMPLETE ===');
}

testAll();
