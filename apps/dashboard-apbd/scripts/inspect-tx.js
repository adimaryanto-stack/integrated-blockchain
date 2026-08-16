const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function inspectTransactions() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();

    const schoolId = '9148ca6a-f86b-4667-80e5-fab2b7ec0798';

    const resTx = await client.query(`SELECT * FROM public.transactions WHERE school_id = '${schoolId}';`);
    console.log('transactions for 024029:', resTx.rows.length);

    const resPB = await client.query(`SELECT * FROM public.pengeluaran_bulanan_institusi WHERE institusi_id = '${schoolId}';`);
    console.log('pengeluaran_bulanan_institusi for 024029:', resPB.rows);

    const resSampleTx = await client.query(`SELECT * FROM public.transactions LIMIT 5;`);
    console.log('Sample transactions:', resSampleTx.rows);

  } catch(e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

inspectTransactions();
