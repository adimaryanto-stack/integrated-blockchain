const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres@localhost:2027/postgres'
});

async function run() {
  const address = 'PAYA LUMPAT, Kel. Paya Lumpat, Kec. Samatiga, Kab. Aceh Barat';

  await pool.query(
    'UPDATE public.institusi_pendidikan SET alamat = $1 WHERE id = $2 OR npsn = $3',
    [address, 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7', '69893669']
  );

  const res = await pool.query(
    'SELECT id, npsn, nama_institusi, alamat, nomor_rekening FROM public.institusi_pendidikan WHERE id = $1',
    ['e45bdf94-41c6-4ee0-9864-8c3c7c4576f7']
  );

  console.log('Result from DB:', res.rows);
  await pool.end();
}

run().catch(console.error);
