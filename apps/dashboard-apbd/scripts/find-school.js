const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function findSchool() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();

    // 1. Find school with npsn = '024029' or like '%024029%'
    const res = await client.query(`
      SELECT i.*, k.nama_kabupaten_kota, p.nama_provinsi 
      FROM public.institusi_pendidikan i
      LEFT JOIN public.kabupaten_kota k ON k.id = i.kabupaten_kota_id
      LEFT JOIN public.provinsi p ON p.id = i.provinsi_id
      WHERE i.npsn ILIKE '%024029%' OR i.id ILIKE '%024029%';
    `);
    console.log('Institusi with NPSN 024029:', res.rows);

    if (res.rows.length > 0) {
      const school = res.rows[0];
      console.log('School ID:', school.id, 'Nama:', school.nama_institusi, 'Nominal:', school.nominal_alokasi, 'Realisasi:', school.realisasi_total);

      // Check sumber_dana_institusi
      const resSumber = await client.query(`
        SELECT * FROM public.sumber_dana_institusi WHERE institusi_pendidikan_id = $1;
      `, [school.id]);
      console.log('sumber_dana_institusi:', resSumber.rows);

      // Check pengeluaran_bulanan_institusi
      const resPengeluaran = await client.query(`
        SELECT * FROM public.pengeluaran_bulanan_institusi WHERE institusi_pendidikan_id = $1 ORDER BY bulan ASC;
      `, [school.id]);
      console.log('pengeluaran_bulanan_institusi:', resPengeluaran.rows);

      // Check rincian_pengeluaran_item
      const resItems = await client.query(`
        SELECT * FROM public.rincian_pengeluaran_item WHERE institusi_pendidikan_id = $1;
      `, [school.id]);
      console.log('rincian_pengeluaran_item:', resItems.rows);
    } else {
      // Search in all institusi_pendidikan for similar NPSN
      const sample = await client.query(`
        SELECT id, npsn, nama_institusi, nominal_alokasi, realisasi_total FROM public.institusi_pendidikan WHERE provinsi_id = 'p-8' LIMIT 5;
      `);
      console.log('Sample Lampung schools:', sample.rows);
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

findSchool();
