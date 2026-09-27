const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2027/postgres' });

(async () => {
  console.log('=== DATABASE PERFORMANCE DIAGNOSTICS ===\n');

  // 1. Row counts per table
  const tables = ['institusi_pendidikan', 'alokasi_provinsi', 'alokasi_kabupaten_kota', 'provinsi', 'kabupaten_kota', 'users', 'audit_anomaly'];
  console.log('--- TABLE ROW COUNTS ---');
  for (const t of tables) {
    const t0 = Date.now();
    const r = await pool.query(`SELECT COUNT(*) FROM "${t}"`);
    console.log(`  ${t}: ${r.rows[0].count} rows (${Date.now() - t0}ms)`);
  }

  // 2. Check indexes
  console.log('\n--- INDEXES ON institusi_pendidikan ---');
  const idx = await pool.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE tablename = 'institusi_pendidikan' AND schemaname = 'public'
    ORDER BY indexname
  `);
  if (idx.rows.length === 0) {
    console.log('  ⚠️  NO INDEXES FOUND (except PK) — This is the main cause of slowness!');
  } else {
    idx.rows.forEach(r => console.log(`  - ${r.indexname}: ${r.indexdef.substring(0, 100)}`));
  }

  // 3. Check indexes on other key tables
  const keyTables = ['alokasi_provinsi', 'alokasi_kabupaten_kota', 'kabupaten_kota'];
  for (const t of keyTables) {
    const idxRes = await pool.query(`
      SELECT indexname FROM pg_indexes 
      WHERE tablename = $1 AND schemaname = 'public'
    `, [t]);
    console.log(`\n--- INDEXES ON ${t} ---`);
    if (idxRes.rows.length <= 1) {
      console.log('  ⚠️  Only PK index — likely slow on filter/sort');
    } else {
      idxRes.rows.forEach(r => console.log(`  - ${r.indexname}`));
    }
  }

  // 4. EXPLAIN query timing
  console.log('\n--- QUERY PLAN: institusi_pendidikan WHERE jenjang = SMA ORDER BY provinsi/kabkota/nama ---');
  const t0 = Date.now();
  const plan = await pool.query(`
    EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
    SELECT * FROM institusi_pendidikan WHERE jenjang = 'SMA' 
    ORDER BY provinsi_nama ASC, kabupaten_kota_nama ASC, nama_institusi ASC
    LIMIT 5000
  `);
  plan.rows.forEach(r => console.log(r['QUERY PLAN']));
  console.log(`  Total plan time: ${Date.now() - t0}ms`);

  // 5. Check proxy logging overhead (every request logs SQL)
  console.log('\n--- PROXY PERFORMANCE NOTES ---');
  console.log('  proxy.js logs EVERY SQL query to console (app.use middleware) — adds overhead');
  console.log('  Pool default: max 10 connections — check if saturated');
  
  const connInfo = await pool.query(`
    SELECT count(*) as active FROM pg_stat_activity WHERE state = 'active'
  `);
  console.log(`  Active DB connections: ${connInfo.rows[0].active}`);

  // 6. Check database size
  const dbSize = await pool.query(`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size
  `);
  console.log(`\n--- DATABASE SIZE: ${dbSize.rows[0].size} ---`);

  // 7. Check table sizes
  console.log('\n--- TABLE SIZES ---');
  const tblSizes = await pool.query(`
    SELECT schemaname, tablename, 
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      pg_total_relation_size(schemaname||'.'||tablename) as raw_size
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY raw_size DESC
    LIMIT 10
  `);
  tblSizes.rows.forEach(r => console.log(`  ${r.tablename}: ${r.size}`));

  pool.end();
})().catch(e => { console.error(e); pool.end(); });
