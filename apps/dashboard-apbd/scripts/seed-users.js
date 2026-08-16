const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function seedLampungUsers() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();
    
    const lampungUsers = [
      {
        id: 'u-lampung-superadmin',
        username: 'Hendra Setiawan (Super Admin)',
        email: 'hendra.setiawan@lampungprov.go.id',
        role: 'SUPER_ADMIN',
        provinsi_id: 'p-8',
        is_active: true,
        created_at: '2026-01-01'
      },
      {
        id: 'u-lampung-bpkad',
        username: 'Bambang Irawan (BPKAD)',
        email: 'bambang.bpkad@lampungprov.go.id',
        role: 'ADMIN',
        provinsi_id: 'p-8',
        is_active: true,
        created_at: '2026-01-05'
      },
      {
        id: 'u-lampung-bappeda',
        username: 'Sri Wahyuni (Bappeda)',
        email: 'sri.wahyuni@lampungprov.go.id',
        role: 'ADMIN_PROVINSI',
        provinsi_id: 'p-8',
        is_active: true,
        created_at: '2026-01-10'
      },
      {
        id: 'u-lampung-disdik',
        username: 'Drs. Sutarman, M.Pd. (Disdik)',
        email: 'sutarman@disdikbud.lampungprov.go.id',
        role: 'ADMIN_PROVINSI',
        provinsi_id: 'p-8',
        is_active: true,
        created_at: '2026-01-15'
      },
      {
        id: 'u-lampung-auditor',
        username: 'Eko Prasetyo, S.E. (Auditor BPK)',
        email: 'eko.bpk@bpk.go.id',
        role: 'AUDITOR',
        provinsi_id: 'p-8',
        is_active: true,
        created_at: '2026-01-20'
      }
    ];

    for (const u of lampungUsers) {
      await client.query(`
        INSERT INTO public.users (id, username, email, role, provinsi_id, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          provinsi_id = EXCLUDED.provinsi_id,
          is_active = EXCLUDED.is_active;
      `, [u.id, u.username, u.email, u.role, u.provinsi_id, u.is_active, u.created_at]);
    }

    console.log('Lampung users seeded into PostgreSQL successfully.');
  } catch (e) {
    console.error('Error seeding users:', e);
  } finally {
    await client.end();
  }
}

seedLampungUsers();
