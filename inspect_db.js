const { Client } = require('pg');

async function main() {
  const c = new Client({ host: '127.0.0.1', port: 2027, database: 'postgres', user: 'postgres' });
  await c.connect();

  console.log('=== KABUPATEN/KOTA IN REGENCIES TABLE FOR LAMPUNG (p-8) ===');
  const regRes = await c.query("SELECT id, name FROM regencies WHERE province_id = 'p-8' ORDER BY id");
  console.log(regRes.rows);
  console.log(`Total regencies for Lampung: ${regRes.rows.length}`);

  console.log('\n=== KABUPATEN/KOTA IN KABUPATEN_KOTA TABLE FOR LAMPUNG (p-8) ===');
  const kkRes = await c.query("SELECT id, nama_kabupaten_kota FROM kabupaten_kota WHERE provinsi_id = 'p-8' ORDER BY id");
  console.log(kkRes.rows);
  console.log(`Total kabupaten_kota for Lampung: ${kkRes.rows.length}`);

  console.log('\n=== ALOKASI KABUPATEN KOTA FOR LAMPUNG (prov-8) ===');
  const akkRes = await c.query("SELECT id, kabupaten_kota_id, nominal_alokasi, realisasi_total FROM alokasi_kabupaten_kota WHERE alokasi_provinsi_id = 'prov-8' ORDER BY id");
  console.log(akkRes.rows);
  console.log(`Total alokasi_kabupaten_kota for Lampung: ${akkRes.rows.length}`);

  await c.end();
}

main().catch(console.error);
