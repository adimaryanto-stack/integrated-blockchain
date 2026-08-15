const { Pool } = require('pg');

async function inspectSchool() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2025/postgres' });
  try {
    const inst = await pool.query("SELECT * FROM public.institusi_pendidikan WHERE npsn = '69893669'");
    console.log('institusi_pendidikan for 69893669:', inst.rows);

    const school = await pool.query("SELECT * FROM public.schools WHERE npsn = '69893669'");
    console.log('\nschools for 69893669:', school.rows);

    const sd = await pool.query("SELECT * FROM public.sumber_dana_institusi WHERE institusi_id = $1", [inst.rows[0]?.id]);
    console.log('\nsumber_dana_institusi for 69893669:', sd.rows);

    const inc = await pool.query("SELECT * FROM public.incoming_funds WHERE school_id = $1 OR school_id = $2", [inst.rows[0]?.id, school.rows[0]?.id]);
    console.log('\nincoming_funds for 69893669:', inc.rows);

    const tx = await pool.query("SELECT * FROM public.transactions WHERE school_id = $1 OR school_id = $2", [inst.rows[0]?.id, school.rows[0]?.id]);
    console.log('\ntransactions for 69893669:', tx.rows);

    const pb = await pool.query("SELECT * FROM public.pengeluaran_bulanan_institusi WHERE institusi_id = $1", [inst.rows[0]?.id]);
    console.log('\npengeluaran_bulanan_institusi for 69893669:', pb.rows);

  } catch (e) {
    console.error(e);
  } finally {
    await pool.end();
  }
}

inspectSchool();
