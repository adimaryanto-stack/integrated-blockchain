const http = require('http');
const { Pool } = require('pg');

async function testHttp(port, path = '/') {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`http://localhost:${port}${path}`, { timeout: 20000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const ms = Date.now() - start;
        resolve({ port, path, status: res.statusCode, timeMs: ms, length: body.length });
      });
    });
    req.on('error', (err) => {
      resolve({ port, path, status: 'ERROR', error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ port, path, status: 'TIMEOUT' });
    });
  });
}

async function testPostgres() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres@127.0.0.1:2025/postgres',
    connectionTimeoutMillis: 5000
  });
  const start = Date.now();
  try {
    const res = await pool.query('SELECT current_database(), count(*) as table_count FROM information_schema.tables WHERE table_schema = $1', ['public']);
    await pool.end();
    return { port: 2025, status: 'ONLINE', timeMs: Date.now() - start, info: res.rows[0] };
  } catch (e) {
    return { port: 2025, status: 'ERROR', error: e.message };
  }
}

async function run() {
  console.log('=== HEALTH CHECK FOR ALL 7 PORTS ===\n');

  const pgRes = await testPostgres();
  console.log(`Port 2025 (PostgreSQL DB)    : ${pgRes.status} (${pgRes.timeMs}ms) - Database: ${pgRes.info?.current_database}, Public Tables: ${pgRes.info?.table_count || 0}`);

  const endpoints = [
    { port: 2026, name: 'Proxy API Server', path: '/' },
    { port: 2020, name: 'Transparansi Publik', path: '/' },
    { port: 2021, name: 'Dashboard Kementerian', path: '/dashboard' },
    { port: 2022, name: 'Dashboard Bank', path: '/dashboard' },
    { port: 2023, name: 'Dashboard Auditor', path: '/dashboard' },
    { port: 2024, name: 'Institusi Pendidikan', path: '/dashboard' },
    { port: 2027, name: 'Dashboard APBD Provinsi', path: '/dashboard' },
  ];

  for (const ep of endpoints) {
    const res = await testHttp(ep.port, ep.path);
    console.log(`Port ${ep.port} (${ep.name.padEnd(23)}) : ${res.status === 200 ? 'ONLINE (200 OK)' : res.status} [${res.timeMs}ms, ${res.length} bytes]`);
  }
}

run();
