const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2025/postgres' });

async function check() {
  const cols = await pool.query("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'tahun_anggaran'");
  console.log('Columns:', cols.rows);
  const rows = await pool.query('SELECT * FROM public.tahun_anggaran');
  console.log('Rows:', rows.rows);
  await pool.end();
}

check().catch(console.error);
