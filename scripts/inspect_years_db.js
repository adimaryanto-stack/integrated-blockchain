const { Pool } = require('pg');

async function inspectYears() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2027/postgres' });
  try {
    const taRes = await pool.query('SELECT * FROM public.tahun_anggaran ORDER BY tahun');
    console.log('Current public.tahun_anggaran in DB:');
    console.log(taRes.rows);

    const apbnRes = await pool.query('SELECT * FROM public.apbn_yearly_data ORDER BY year');
    console.log('\nCurrent public.apbn_yearly_data in DB:');
    console.log(apbnRes.rows);
  } catch (e) {
    console.error('Error inspecting DB:', e.message);
  } finally {
    await pool.end();
  }
}

inspectYears();
