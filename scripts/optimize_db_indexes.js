const { Pool } = require('pg');

async function optimizeDb() {
  const pool = new Pool({
    connectionString: 'postgresql://postgres@localhost:2025/postgres',
  });

  console.log('Optimizing PostgreSQL indexes for fast queries...\n');

  const indexQueries = [
    // institusi_pendidikan
    `CREATE INDEX IF NOT EXISTS idx_inst_jenjang ON public.institusi_pendidikan (jenjang);`,
    `CREATE INDEX IF NOT EXISTS idx_inst_prov_nama ON public.institusi_pendidikan (provinsi_nama);`,
    `CREATE INDEX IF NOT EXISTS idx_inst_kab_nama ON public.institusi_pendidikan (kabupaten_kota_nama);`,
    `CREATE INDEX IF NOT EXISTS idx_inst_nama ON public.institusi_pendidikan (nama_institusi);`,
    `CREATE INDEX IF NOT EXISTS idx_inst_compound ON public.institusi_pendidikan (jenjang, provinsi_nama, kabupaten_kota_nama);`,

    // alokasi_provinsi & kabupaten_kota
    `CREATE INDEX IF NOT EXISTS idx_alokasi_prov_thn ON public.alokasi_provinsi (tahun_anggaran_id);`,
    `CREATE INDEX IF NOT EXISTS idx_alokasi_kab_thn ON public.alokasi_kabupaten_kota (tahun_anggaran_id);`,
    `CREATE INDEX IF NOT EXISTS idx_alokasi_kab_id ON public.alokasi_kabupaten_kota (kabupaten_kota_id);`,

    // audit_anomaly
    `CREATE INDEX IF NOT EXISTS idx_audit_inst_id ON public.audit_anomaly (institusi_id);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_status ON public.audit_anomaly (status);`,

    // schools & transactions for web-next
    `CREATE INDEX IF NOT EXISTS idx_schools_npsn ON public.schools (npsn);`,
    `CREATE INDEX IF NOT EXISTS idx_schools_name ON public.schools (name);`,
    `CREATE INDEX IF NOT EXISTS idx_tx_school_id ON public.transactions (school_id);`,
    `CREATE INDEX IF NOT EXISTS idx_inc_school_id ON public.incoming_funds (school_id);`,

    // rincian_pengeluaran_item & pengeluaran_bulanan_institusi
    `CREATE INDEX IF NOT EXISTS idx_rincian_inst_id ON public.rincian_pengeluaran_item (institusi_id);`,
    `CREATE INDEX IF NOT EXISTS idx_pengeluaran_inst_id ON public.pengeluaran_bulanan_institusi (institusi_id);`,

    // Vacuum analyze
    `ANALYZE public.institusi_pendidikan;`,
    `ANALYZE public.schools;`,
    `ANALYZE public.transactions;`,
    `ANALYZE public.incoming_funds;`,
    `ANALYZE public.alokasi_provinsi;`,
    `ANALYZE public.alokasi_kabupaten_kota;`
  ];

  for (const q of indexQueries) {
    try {
      const start = Date.now();
      await pool.query(q);
      console.log(`[OK] ${q.split('\n')[0]} (${Date.now() - start}ms)`);
    } catch (e) {
      console.warn(`[WARN] ${q.split('\n')[0]} -> ${e.message}`);
    }
  }

  await pool.end();
  console.log('\nDatabase optimization complete!');
}

optimizeDb();
