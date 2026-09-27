const { Pool } = require('pg');

async function cleanYearsDb() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2027/postgres' });
  try {
    console.log('Cleaning up older years in database to keep ONLY Year 2026...\n');

    // 1. Update year 2026 to status ACTIVE
    await pool.query("UPDATE public.tahun_anggaran SET status = 'ACTIVE' WHERE tahun = 2026;");
    console.log('[OK] Set tahun_anggaran 2026 status to ACTIVE');

    // 2. Delete older years 2020-2025 from public.tahun_anggaran
    await pool.query("DELETE FROM public.tahun_anggaran WHERE tahun != 2026;");
    console.log('[OK] Deleted older years (2020-2025) from public.tahun_anggaran');

    // 3. Keep only 2026 in apbn_yearly_data
    await pool.query("DELETE FROM public.apbn_yearly_data WHERE year != 2026;");
    console.log('[OK] Kept only 2026 in public.apbn_yearly_data');

    // Verify remaining
    const remaining = await pool.query('SELECT * FROM public.tahun_anggaran');
    console.log('\nRemaining tahun_anggaran in DB:');
    console.log(remaining.rows);

    const apbnRemaining = await pool.query('SELECT year, total_budget FROM public.apbn_yearly_data');
    console.log('\nRemaining apbn_yearly_data in DB:');
    console.log(apbnRemaining.rows);
  } catch (e) {
    console.error('Error during cleanup:', e.message);
  } finally {
    await pool.end();
  }
}

cleanYearsDb();
