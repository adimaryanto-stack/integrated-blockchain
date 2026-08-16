const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function seedTransactions() {
  const client = new Client({ connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres' });
  try {
    await client.connect();

    const schoolId = '9148ca6a-f86b-4667-80e5-fab2b7ec0798';

    // Remove existing if any
    await client.query(`DELETE FROM public.transactions WHERE school_id = '${schoolId}';`);

    const months = [
      { m: '2026-01-15', total: 5013919413 },
      { m: '2026-02-15', total: 5013919413 },
      { m: '2026-03-15', total: 5013919413 },
      { m: '2026-04-15', total: 5013919413 },
      { m: '2026-05-15', total: 5013919413 },
      { m: '2026-06-15', total: 5013919413 },
      { m: '2026-07-15', total: 4011135530 },
      { m: '2026-08-15', total: 4011135530 },
      { m: '2026-09-15', total: 4011135530 },
      { m: '2026-10-15', total: 3008351648 },
      { m: '2026-11-15', total: 2506959706 },
      { m: '2026-12-15', total: 2506959706 },
    ];

    const categories = [
      { cat: 'Sarana Prasarana', desc: 'Pemeliharaan Gedung & Perangkat Lab Komputer', share: 0.30 },
      { cat: 'Gaji Honorer', desc: 'Gaji Dosen & Tunjangan Sertifikasi Pengajar', share: 0.30 },
      { cat: 'Operasional', desc: 'Operasional Pembelajaran & Langganan Bandwidth Kampus', share: 0.20 },
      { cat: 'Buku & Perpus', desc: 'Pengadaan Buku Referensi & Jurnal Digital Terindeks', share: 0.10 },
      { cat: 'Kegiatan Siswa', desc: 'Kegiatan Riset, Inovasi & Beasiswa Mahasiswa Prestasi', share: 0.10 },
    ];

    let totalInserted = 0;

    for (let i = 0; i < months.length; i++) {
      const monthData = months[i];
      let monthAllocated = 0;

      for (let j = 0; j < categories.length; j++) {
        const c = categories[j];
        const amt = (j === categories.length - 1)
          ? (monthData.total - monthAllocated)
          : Math.round(monthData.total * c.share);

        monthAllocated += amt;
        totalInserted += amt;

        await client.query(`
          INSERT INTO public.transactions (id, school_id, date, category, description, amount, tax_amount, shipping_cost, fund_source, created_at)
          VALUES (
            gen_random_uuid(),
            '${schoolId}',
            '${monthData.m}T10:00:00Z',
            '${c.cat}',
            '${c.desc} (Bulan ${i + 1}/2026)',
            ${amt},
            ${Math.round(amt * 0.11)},
            0,
            'APBN/APBD',
            NOW()
          );
        `);
      }
    }

    console.log('Successfully inserted transactions. Total inserted amount:', totalInserted);

    // Verify
    const res = await client.query(`SELECT count(*), sum(amount) FROM public.transactions WHERE school_id = '${schoolId}';`);
    console.log('Verification in DB:', res.rows[0]);

  } catch (err) {
    console.error('Error seeding transactions:', err);
  } finally {
    await client.end();
  }
}

seedTransactions();
