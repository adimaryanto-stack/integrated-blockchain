const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function inspectDb() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();
    
    // 1. Check jenjang distribution in institusi_pendidikan for Lampung
    const resJenjang = await client.query(`
      SELECT jenjang, count(*) as count, 
             coalesce(sum(nominal_alokasi), 0) as total_nominal,
             coalesce(sum(realisasi_total), 0) as total_realisasi
      FROM public.institusi_pendidikan 
      WHERE provinsi_id = 'p-8' 
      GROUP BY jenjang 
      ORDER BY count DESC;
    `);
    console.log('Institusi Jenjang in DB:', resJenjang.rows);

    // 2. Check kabupaten_kota for Lampung
    const resKab = await client.query(`
      SELECT k.id, k.nama_kabupaten_kota, k.tipe, count(i.id) as school_count
      FROM public.kabupaten_kota k
      LEFT JOIN public.institusi_pendidikan i ON i.kabupaten_kota_id = k.id
      WHERE k.provinsi_id = 'p-8'
      GROUP BY k.id, k.nama_kabupaten_kota, k.tipe
      ORDER BY k.nama_kabupaten_kota ASC;
    `);
    console.log('Kab/Kota and School Counts in DB:', resKab.rows);

    // 3. Check all tables in public schema
    const resTables = await client.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name ASC;
    `);
    console.log('All tables in public schema:', resTables.rows.map(r=>r.table_name));

    // 4. Check users table in PostgreSQL
    const checkUsers = await client.query(`
      SELECT * FROM public.users LIMIT 5;
    `);
    console.log('Users sample from DB:', checkUsers.rows);

    // 5. Total institusi in Lampung
    const totalInst = await client.query(`
      SELECT count(*) as total FROM public.institusi_pendidikan WHERE provinsi_id = 'p-8';
    `);
    console.log('Total Institusi Lampung:', totalInst.rows[0].total);

  } catch(e) {
    console.error('Inspection error:', e);
  } finally {
    await client.end();
  }
}
inspectDb();
