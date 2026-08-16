const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function inspectSources() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();

    // 1. Check all tables related to funds: sumber_dana_institusi, incoming_funds, fund_allocations, etc.
    const resFunds = await client.query(`
      SELECT * FROM public.sumber_dana_institusi WHERE institusi_id = '9148ca6a-f86b-4667-80e5-fab2b7ec0798' OR institusi_id ILIKE '%024029%';
    `);
    console.log('sumber_dana_institusi for 9148ca6a...:', resFunds.rows);

    const resInc = await client.query(`
      SELECT * FROM public.incoming_funds WHERE school_id = '9148ca6a-f86b-4667-80e5-fab2b7ec0798';
    `);
    console.log('incoming_funds for 9148ca6a...:', resInc.rows);

    // 2. Check sample sumber_dana_institusi in DB to see how APBN, APBD, and CSR are structured
    const resSampleSD = await client.query(`
      SELECT * FROM public.sumber_dana_institusi LIMIT 10;
    `);
    console.log('Sample sumber_dana_institusi in DB:', resSampleSD.rows);

    // 3. Check sample incoming_funds in DB
    const resSampleInc = await client.query(`
      SELECT * FROM public.incoming_funds LIMIT 10;
    `);
    console.log('Sample incoming_funds in DB:', resSampleInc.rows);

    // 4. Check institusi_pendidikan vs schools vs dashboard-kementerian
    const resInst = await client.query(`
      SELECT * FROM public.institusi_pendidikan WHERE id = '9148ca6a-f86b-4667-80e5-fab2b7ec0798';
    `);
    console.log('institusi_pendidikan 9148ca6a...:', resInst.rows[0]);

  } catch(e) {
    console.error('Error:', e);
  } finally {
    await client.end();
  }
}

inspectSources();
