const { Pool } = require('pg');

async function checkPbCols() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2027/postgres' });
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pengeluaran_bulanan_institusi'");
    console.log('Columns in pengeluaran_bulanan_institusi:', res.rows);

    // Let's ensure tahun column exists if needed or default 2026
    const hasTahun = res.rows.some(r => r.column_name === 'tahun');
    if (!hasTahun) {
      await pool.query("ALTER TABLE public.pengeluaran_bulanan_institusi ADD COLUMN IF NOT EXISTS tahun INTEGER DEFAULT 2026");
      console.log('Added tahun column to pengeluaran_bulanan_institusi');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

checkPbCols();
