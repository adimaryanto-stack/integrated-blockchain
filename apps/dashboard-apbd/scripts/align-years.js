const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function alignYearsTo2026Only() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();
    
    // Delete any non-2026 entries to strictly match tahun_anggaran
    await client.query(`DELETE FROM public.apbd_pendidikan_satuan WHERE tahun <> 2026;`);
    await client.query(`DELETE FROM public.apbd_pendidikan_breakdown WHERE tahun <> 2026;`);
    await client.query(`DELETE FROM public.apbd_provinsi WHERE tahun <> 2026;`);
    await client.query(`DELETE FROM public.apbd_input_log WHERE entitas = 'APBD Provinsi Lampung' AND keterangan LIKE '%2024%' OR keterangan LIKE '%2025%';`);

    // Ensure 2026 APBD Provinsi Lampung exists and is ACTIVE
    await client.query(`
      INSERT INTO public.apbd_provinsi (
        id, provinsi_id, tahun_anggaran_id, tahun, total_apbd, alokasi_pendidikan_riil, 
        realisasi_pendidikan_total, status_kepatuhan, status_anggaran, diinput_oleh, catatan
      ) VALUES (
        'apbd-lampung-2026', 'p-8', '7', 2026, 8240000000000, 1750000000000, 1420000000000, 
        'MEMENUHI', 'ACTIVE', 'BPKAD Provinsi Lampung', 'Perda APBD Lampung Tahun 2026'
      ) ON CONFLICT (provinsi_id, tahun) DO UPDATE SET
        total_apbd = EXCLUDED.total_apbd,
        alokasi_pendidikan_riil = EXCLUDED.alokasi_pendidikan_riil,
        realisasi_pendidikan_total = EXCLUDED.realisasi_pendidikan_total,
        status_kepatuhan = EXCLUDED.status_kepatuhan,
        status_anggaran = 'ACTIVE',
        updated_at = NOW();
    `);

    // Check distinct years in apbd_provinsi and tahun_anggaran
    const resApbdYears = await client.query(`SELECT DISTINCT tahun, status_anggaran FROM public.apbd_provinsi ORDER BY tahun;`);
    const resTaYears = await client.query(`SELECT DISTINCT tahun, status FROM public.tahun_anggaran ORDER BY tahun;`);

    console.log('APBD Provinsi Years in DB:', resApbdYears.rows);
    console.log('Tahun Anggaran Years in DB:', resTaYears.rows);

  } catch (e) {
    console.error('Error aligning years:', e);
  } finally {
    await client.end();
  }
}

alignYearsTo2026Only();
