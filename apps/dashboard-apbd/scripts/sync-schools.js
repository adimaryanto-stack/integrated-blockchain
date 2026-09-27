const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function syncSchoolsAndInstitusi() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:2027/postgres' });
  try {
    await client.connect();

    // 1. Update alamat in institusi_pendidikan from schools where matching npsn
    const updateAlamat = await client.query(`
      UPDATE public.institusi_pendidikan i
      SET alamat = s.location
      FROM public.schools s
      WHERE i.npsn = s.npsn AND (i.alamat IS NULL OR i.alamat = '');
    `);
    console.log('Updated alamat rows:', updateAlamat.rowCount);

    // 2. Check 024029
    const check024029 = await client.query(`
      SELECT i.*, s.location, s.accreditation
      FROM public.institusi_pendidikan i
      LEFT JOIN public.schools s ON s.npsn = i.npsn
      WHERE i.npsn = '024029';
    `);
    console.log('Institusi 024029:', check024029.rows[0]);

  } catch (e) {
    console.error('Error syncing:', e);
  } finally {
    await client.end();
  }
}

syncSchoolsAndInstitusi();
