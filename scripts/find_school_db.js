const { Pool } = require('pg');

async function findSchool() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2027/postgres' });
  try {
    const res = await pool.query("SELECT * FROM public.institusi_pendidikan WHERE npsn = '69893669' OR nama_institusi ILIKE '%AL-IKHLAS%' LIMIT 10");
    console.log('Institusi found in DB:');
    console.log(res.rows);

    const users = await pool.query("SELECT * FROM public.users WHERE role ILIKE '%INSTITUSI%' OR email ILIKE '%ikhlas%' OR username ILIKE '%ikhlas%'");
    console.log('\nUsers found in DB:');
    console.log(users.rows);
  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

findSchool();
