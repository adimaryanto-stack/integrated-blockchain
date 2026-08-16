const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function createIndexesAndSync() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();

    // Create index on npsn
    await client.query(`CREATE INDEX IF NOT EXISTS idx_institusi_npsn ON public.institusi_pendidikan(npsn);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_schools_npsn ON public.schools(npsn);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_institusi_provinsi ON public.institusi_pendidikan(provinsi_id);`);

    // Fast update for 024029 specifically
    await client.query(`
      UPDATE public.institusi_pendidikan
      SET alamat = 'Jalan ZA Pagar Alam No 7 Gedong Meneng'
      WHERE npsn = '024029';
    `);

    // Verify 024029
    const res = await client.query(`
      SELECT id, npsn, nama_institusi, jenjang, kabupaten_kota_nama, provinsi_nama, alamat, 
             nominal_alokasi, realisasi_total, selisih, persentase_penyerapan
      FROM public.institusi_pendidikan
      WHERE npsn = '024029';
    `);
    console.log('Institusi 024029 in PostgreSQL:', res.rows[0]);

  } catch(e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

createIndexesAndSync();
