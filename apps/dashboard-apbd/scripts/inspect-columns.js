const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function inspectColumns() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();
    
    for (const table of ['sumber_dana_institusi', 'pengeluaran_bulanan_institusi', 'rincian_pengeluaran_item']) {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = $1;
      `, [table]);
      console.log(`Columns of ${table}:`, res.rows.map(r => r.column_name));
    }

    // Let's also check what data exists in those tables for school '9148ca6a-f86b-4667-80e5-fab2b7ec0798' or npsn '024029'
    const resS = await client.query(`SELECT * FROM public.sumber_dana_institusi LIMIT 3;`);
    console.log('Sample sumber_dana_institusi:', resS.rows);

    const resP = await client.query(`SELECT * FROM public.pengeluaran_bulanan_institusi LIMIT 3;`);
    console.log('Sample pengeluaran_bulanan_institusi:', resP.rows);

    const resR = await client.query(`SELECT * FROM public.rincian_pengeluaran_item LIMIT 3;`);
    console.log('Sample rincian_pengeluaran_item:', resR.rows);

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

inspectColumns();
