const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:2027/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL (Port 2025)...');

  console.log('[1/3] Creating automatic cascade trigger on tahun_anggaran...');
  await client.query(`
    CREATE OR REPLACE FUNCTION cascade_delete_tahun_anggaran()
    RETURNS TRIGGER AS $$
    BEGIN
      DELETE FROM apbd_yearly_data WHERE year = OLD.tahun;
      DELETE FROM csr_yearly_data WHERE year = OLD.tahun;
      DELETE FROM apbn_yearly_data WHERE year = OLD.tahun;
      DELETE FROM provincial_allocations WHERE year = OLD.tahun;
      DELETE FROM district_allocations WHERE year = OLD.tahun;
      DELETE FROM alokasi_provinsi WHERE tahun_anggaran_id = OLD.id;
      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trg_cascade_delete_tahun_anggaran ON tahun_anggaran;
    CREATE TRIGGER trg_cascade_delete_tahun_anggaran
    AFTER DELETE ON tahun_anggaran
    FOR EACH ROW
    EXECUTE FUNCTION cascade_delete_tahun_anggaran();
  `);

  console.log('[2/3] Cleaning up years from apbd/csr/allocations that do not exist in tahun_anggaran...');
  await client.query(`
    DELETE FROM apbd_yearly_data WHERE year NOT IN (SELECT tahun FROM tahun_anggaran);
    DELETE FROM csr_yearly_data WHERE year NOT IN (SELECT tahun FROM tahun_anggaran);
    DELETE FROM apbn_yearly_data WHERE year NOT IN (SELECT tahun FROM tahun_anggaran);
    DELETE FROM provincial_allocations WHERE year NOT IN (SELECT tahun FROM tahun_anggaran);
    DELETE FROM district_allocations WHERE year NOT IN (SELECT tahun FROM tahun_anggaran);
  `);

  console.log('[3/3] Checking remaining years in all tables...');
  const ta = await client.query('SELECT tahun FROM tahun_anggaran ORDER BY tahun ASC');
  const apbd = await client.query('SELECT year FROM apbd_yearly_data ORDER BY year ASC');
  const csr = await client.query('SELECT year FROM csr_yearly_data ORDER BY year ASC');
  const apbn = await client.query('SELECT year FROM apbn_yearly_data ORDER BY year ASC');

  console.log('  tahun_anggaran:', ta.rows.map(r => r.tahun));
  console.log('  apbd_yearly_data:', apbd.rows.map(r => r.year));
  console.log('  csr_yearly_data:', csr.rows.map(r => r.year));
  console.log('  apbn_yearly_data:', apbn.rows.map(r => r.year));

  await client.end();
  console.log('\n🎉 Automatic cascade and synchronization complete!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
