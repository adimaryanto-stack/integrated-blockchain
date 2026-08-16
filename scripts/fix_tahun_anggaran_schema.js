const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2025/postgres' });

async function fix() {
  await pool.query(`
    ALTER TABLE public.tahun_anggaran ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
  `);
  console.log('Successfully set DEFAULT on tahun_anggaran.id');

  // Check columns of tahun_anggaran
  const cols = await pool.query("SELECT column_name, column_default FROM information_schema.columns WHERE table_name = 'tahun_anggaran'");
  console.log('Updated columns:', cols.rows);

  await pool.end();
}

fix().catch(console.error);
