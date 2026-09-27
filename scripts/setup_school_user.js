const { Pool } = require('pg');

async function checkUsers() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2027/postgres' });
  try {
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
    console.log('Columns in users:', cols.rows.map(c => c.column_name));

    const rows = await pool.query("SELECT * FROM public.users LIMIT 10");
    console.log('Sample rows in users:', rows.rows);

    // Upsert or update a user for KB AL-IKHLAS
    const schoolId = 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7';
    await pool.query(`
      INSERT INTO public.users (id, username, email, nama_lengkap, role, status, institusi_id, avatar, created_at, updated_at)
      VALUES ('user-kb-al-ikhlas', 'kb_al_ikhlas', 'admin@kbalikhlas.sch.id', 'KB AL-IKHLAS (Operator)', 'SEKOLAH', 'ACTIVE', $1, 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=100&auto=format&fit=crop&q=60', NOW(), NOW())
      ON CONFLICT (id) DO UPDATE SET
        username = 'kb_al_ikhlas',
        email = 'admin@kbalikhlas.sch.id',
        nama_lengkap = 'KB AL-IKHLAS (Operator)',
        role = 'SEKOLAH',
        institusi_id = $1,
        status = 'ACTIVE';
    `, [schoolId]);

    console.log('Successfully set up user account for KB AL-IKHLAS in users table');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkUsers();
