const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2025/postgres' });

async function bench(label, sql, params) {
  const t0 = Date.now();
  const r = await pool.query(sql, params);
  console.log(label + ': ' + (Date.now() - t0) + 'ms (' + r.rows.length + ' rows)');
}

async function explainMs(label, sql, params) {
  const r = await pool.query('EXPLAIN (ANALYZE, FORMAT TEXT) ' + sql, params);
  const lastLine = r.rows[r.rows.length - 1]['QUERY PLAN'] || '';
  const match = lastLine.match(/Execution Time: ([\d.]+) ms/);
  console.log(label + ': ' + (match ? match[1] + 'ms (DB engine)' : 'see full plan'));
}

(async () => {
  console.log('=== BENCHMARK AFTER INDEXES ===\n');

  await bench(
    'SMA ORDER BY prov/kab/nama LIMIT 100',
    'SELECT * FROM institusi_pendidikan WHERE jenjang = $1 ORDER BY provinsi_nama ASC, kabupaten_kota_nama ASC, nama_institusi ASC LIMIT 100',
    ['SMA']
  );

  await bench(
    'PAUD ORDER BY prov/kab/nama LIMIT 100',
    'SELECT * FROM institusi_pendidikan WHERE jenjang = $1 ORDER BY provinsi_nama ASC, kabupaten_kota_nama ASC, nama_institusi ASC LIMIT 100',
    ['PAUD']
  );

  await bench(
    'Jawa Barat + SD LIMIT 5000',
    'SELECT * FROM institusi_pendidikan WHERE provinsi_nama = $1 AND jenjang = $2 ORDER BY kabupaten_kota_nama ASC, nama_institusi ASC',
    ['Jawa Barat', 'SD']
  );

  await bench(
    'ILIKE nama_institusi %negeri% LIMIT 50',
    "SELECT * FROM institusi_pendidikan WHERE nama_institusi ILIKE $1 LIMIT 50",
    ['%negeri%']
  );

  await bench(
    'COUNT jenjang SMA',
    'SELECT COUNT(*) FROM institusi_pendidikan WHERE jenjang = $1',
    ['SMA']
  );

  await bench(
    'SMA ORDER 5000 rows (full page)',
    'SELECT * FROM institusi_pendidikan WHERE jenjang = $1 ORDER BY provinsi_nama ASC, kabupaten_kota_nama ASC, nama_institusi ASC LIMIT 5000',
    ['SMA']
  );

  pool.end();
})().catch(e => { console.error(e.message); pool.end(); });
