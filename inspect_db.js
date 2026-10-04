const { Client } = require('pg');

async function main() {
  const c = new Client({ host: '127.0.0.1', port: 2027, database: 'postgres', user: 'postgres' });
  await c.connect();

  const tables = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name");
  console.log('Tables:', tables.rows.map(r => r.table_name));

  const resCsr = await c.query("SELECT * FROM csr_yearly_data");
  console.log('csr_yearly_data:', resCsr.rows);

  const incCsr = await c.query("SELECT * FROM incoming_funds WHERE source ILIKE '%CSR%' LIMIT 5");
  console.log('incoming_funds CSR:', incCsr.rows);

  const sdiCsr = await c.query("SELECT * FROM sumber_dana_institusi WHERE nama_sumber ILIKE '%CSR%' LIMIT 5");
  console.log('sumber_dana_institusi CSR:', sdiCsr.rows);

  const allIncoming = await c.query("SELECT source, count(*), sum(amount) FROM incoming_funds GROUP BY source");
  console.log('incoming_funds by source:', allIncoming.rows);

  const allSdi = await c.query("SELECT nama_sumber, count(*), sum(nominal) FROM sumber_dana_institusi GROUP BY nama_sumber");
  console.log('sdi by source:', allSdi.rows);

  const provCount = await c.query("SELECT p.nama_provinsi, a.nominal_alokasi, a.realisasi_total FROM alokasi_provinsi a JOIN provinsi p ON a.provinsi_id = p.id ORDER BY a.nominal_alokasi DESC LIMIT 5");
  console.log('Top 5 Alokasi Provinsi (APBN):', provCount.rows);

  const apbdProv = await c.query("SELECT p.nama_provinsi, a.total_apbd, a.alokasi_pendidikan_riil, a.realisasi_pendidikan_total FROM apbd_provinsi a JOIN provinsi p ON a.provinsi_id = p.id LIMIT 5");
  console.log('APBD Provinsi:', apbdProv.rows);

  await c.end();
}

main().catch(console.error);
