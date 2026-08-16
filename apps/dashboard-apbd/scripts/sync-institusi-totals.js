const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function syncInstitusiTotals() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();

    const schoolId = '9148ca6a-f86b-4667-80e5-fab2b7ec0798';

    // Update institusi_pendidikan total aggregate
    await client.query(`
      UPDATE public.institusi_pendidikan
      SET 
        nominal_alokasi = 70003668803,
        realisasi_total = 56321279128,
        selisih = 13682389675,
        persentase_penyerapan = 80.5
      WHERE id = '${schoolId}';
    `);

    // Verify
    const res = await client.query(`
      SELECT id, npsn, nama_institusi, nominal_alokasi, realisasi_total, selisih, persentase_penyerapan 
      FROM public.institusi_pendidikan 
      WHERE id = '${schoolId}';
    `);
    console.log('institusi_pendidikan updated:', res.rows[0]);

  } catch(e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

syncInstitusiTotals();
