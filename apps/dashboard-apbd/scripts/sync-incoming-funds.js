const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function syncIncomingFunds() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:2027/postgres' });
  try {
    await client.connect();

    const schoolId = '9148ca6a-f86b-4667-80e5-fab2b7ec0798';

    // 1. Ensure sumber_dana_institusi for 024029 has APBN, APBD, CSR
    await client.query(`
      INSERT INTO public.sumber_dana_institusi (id, institusi_id, nama_sumber, tahun_anggaran, nominal, realisasi, saldo_di_bank)
      VALUES 
      ('sd-9148ca6a-f86b-4667-80e5-fab2b7ec0798-1', '${schoolId}', 'APBN Pendidikan (Pemerintah Pusat) 2026', '2026', 62276062548, 50139194128, 12136868420),
      ('sd-9148ca6a-f86b-4667-80e5-fab2b7ec0798-2', '${schoolId}', 'APBD Provinsi Lampung (Pemerintah Daerah) 2026', '2026', 6227606255, 4982085000, 1245521255),
      ('sd-9148ca6a-f86b-4667-80e5-fab2b7ec0798-3', '${schoolId}', 'Corporate Social Responsibility (CSR Swasta) 2026', '2026', 1500000000, 1200000000, 300000000)
      ON CONFLICT (id) DO UPDATE SET
        nominal = EXCLUDED.nominal,
        realisasi = EXCLUDED.realisasi,
        saldo_di_bank = EXCLUDED.saldo_di_bank;
    `);

    // 2. Insert into incoming_funds for http://localhost:2020
    await client.query(`
      DELETE FROM public.incoming_funds WHERE school_id = '${schoolId}';
      
      INSERT INTO public.incoming_funds (id, school_id, source, amount, received_date, reference_number, created_at)
      VALUES 
      (gen_random_uuid(), '${schoolId}', 'APBN Pendidikan (Pemerintah Pusat) 2026', 62276062548.00, '2026-01-15T00:00:00Z', 'APBN-PUSAT-024029', NOW()),
      (gen_random_uuid(), '${schoolId}', 'APBD Provinsi Lampung (Pemerintah Daerah) 2026', 6227606255.00, '2026-01-20T00:00:00Z', 'APBD-LAMPUNG-024029', NOW()),
      (gen_random_uuid(), '${schoolId}', 'Corporate Social Responsibility (CSR Swasta) 2026', 1500000000.00, '2026-02-01T00:00:00Z', 'CSR-MITRA-024029', NOW());
    `);

    // 3. Update institusi_pendidikan with clear APBD and APBN breakdown
    await client.query(`
      UPDATE public.institusi_pendidikan
      SET 
        nominal_alokasi = 6227606255,
        realisasi_total = 4982085000,
        selisih = 1245521255,
        persentase_penyerapan = 80.0
      WHERE id = '${schoolId}';
    `);

    // 4. Verify incoming_funds
    const resInc = await client.query(`SELECT * FROM public.incoming_funds WHERE school_id = '${schoolId}';`);
    console.log('Synchronized incoming_funds for 024029:', resInc.rows);

    const resSD = await client.query(`SELECT * FROM public.sumber_dana_institusi WHERE institusi_id = '${schoolId}';`);
    console.log('Synchronized sumber_dana_institusi for 024029:', resSD.rows);

  } catch(e) {
    console.error('Error syncing incoming funds:', e);
  } finally {
    await client.end();
  }
}

syncIncomingFunds();
