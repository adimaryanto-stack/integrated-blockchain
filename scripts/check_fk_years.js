const { Pool } = require('pg');

async function inspectForeignKeys() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2025/postgres' });
  try {
    const provYears = await pool.query('SELECT tahun_anggaran_id, count(*) FROM public.alokasi_provinsi GROUP BY tahun_anggaran_id');
    console.log('alokasi_provinsi by tahun_anggaran_id:');
    console.log(provYears.rows);

    const instYears = await pool.query('SELECT DISTINCT count(*) FROM public.institusi_pendidikan');
    console.log('institusi_pendidikan total count:', instYears.rows[0].count);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

inspectForeignKeys();
