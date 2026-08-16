const { Client } = require('d:/DaVinci/Web Development/integrated-blockchain/node_modules/pg');

async function migrate() {
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@localhost:2025/postgres'
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    // 1. Create table apbd_provinsi
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.apbd_provinsi (
        id VARCHAR(64) PRIMARY KEY,
        provinsi_id VARCHAR(64) NOT NULL REFERENCES public.provinsi(id) ON DELETE CASCADE,
        tahun_anggaran_id VARCHAR(64) NOT NULL,
        tahun INT NOT NULL,
        total_apbd NUMERIC(20, 2) NOT NULL DEFAULT 0,
        batas_minimal_pendidikan NUMERIC(20, 2) GENERATED ALWAYS AS (total_apbd * 0.20) STORED,
        alokasi_pendidikan_riil NUMERIC(20, 2) NOT NULL DEFAULT 0,
        realisasi_pendidikan_total NUMERIC(20, 2) NOT NULL DEFAULT 0,
        status_kepatuhan VARCHAR(32) NOT NULL DEFAULT 'BELUM_MEMENUHI',
        status_anggaran VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        diinput_oleh VARCHAR(128) DEFAULT 'BPKAD Provinsi Lampung',
        catatan TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (provinsi_id, tahun)
      );
    `);
    console.log('Table public.apbd_provinsi ready.');

    // 2. Create table apbd_pendidikan_breakdown
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.apbd_pendidikan_breakdown (
        id VARCHAR(64) PRIMARY KEY,
        apbd_provinsi_id VARCHAR(64) NOT NULL REFERENCES public.apbd_provinsi(id) ON DELETE CASCADE,
        kabupaten_kota_id VARCHAR(64) NOT NULL REFERENCES public.kabupaten_kota(id) ON DELETE CASCADE,
        tahun INT NOT NULL,
        nominal_alokasi NUMERIC(20, 2) NOT NULL DEFAULT 0,
        realisasi_total NUMERIC(20, 2) NOT NULL DEFAULT 0,
        catatan TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (apbd_provinsi_id, kabupaten_kota_id)
      );
    `);
    console.log('Table public.apbd_pendidikan_breakdown ready.');

    // 3. Create table apbd_pendidikan_satuan
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.apbd_pendidikan_satuan (
        id VARCHAR(64) PRIMARY KEY,
        apbd_pendidikan_breakdown_id VARCHAR(64) REFERENCES public.apbd_pendidikan_breakdown(id) ON DELETE CASCADE,
        institusi_pendidikan_id VARCHAR(64) NOT NULL REFERENCES public.institusi_pendidikan(id) ON DELETE CASCADE,
        tahun INT NOT NULL,
        nominal_alokasi NUMERIC(20, 2) NOT NULL DEFAULT 0,
        realisasi_total NUMERIC(20, 2) NOT NULL DEFAULT 0,
        catatan TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (institusi_pendidikan_id, tahun)
      );
    `);
    console.log('Table public.apbd_pendidikan_satuan ready.');

    // 4. Create table apbd_input_log
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.apbd_input_log (
        id VARCHAR(64) PRIMARY KEY,
        apbd_provinsi_id VARCHAR(64),
        user_name VARCHAR(128) NOT NULL DEFAULT 'Super Admin',
        role VARCHAR(64) NOT NULL DEFAULT 'SUPER_ADMIN',
        entitas VARCHAR(128) NOT NULL,
        aksi VARCHAR(64) NOT NULL,
        field_diubah VARCHAR(128),
        nilai_lama TEXT,
        nilai_baru TEXT,
        keterangan TEXT,
        timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Table public.apbd_input_log ready.');

    // Reload PostgREST schema cache
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Notified PostgREST schema reload.');

    // Seed baseline data for Lampung (provinsi_id = 'p-8')
    const resKab = await client.query(`
      SELECT id, nama_kabupaten_kota FROM public.kabupaten_kota WHERE provinsi_id = 'p-8' ORDER BY nama_kabupaten_kota ASC;
    `);
    const kabKotaList = resKab.rows;
    console.log('Found ' + kabKotaList.length + ' kabupaten/kota in Lampung.');

    // Insert years 2024, 2025, 2026
    const yearsData = [
      {
        tahun: 2026,
        total_apbd: 8240000000000, // 8.24 T
        alokasi_pendidikan_riil: 1750000000000, // 1.75 T (21.24% -> Memenuhi)
        realisasi: 1420000000000,
        status: 'ACTIVE'
      },
      {
        tahun: 2025,
        total_apbd: 7850000000000, // 7.85 T
        alokasi_pendidikan_riil: 1610000000000, // 1.61 T (20.51% -> Memenuhi)
        realisasi: 1580000000000,
        status: 'CLOSED'
      },
      {
        tahun: 2024,
        total_apbd: 7420000000000, // 7.42 T
        alokasi_pendidikan_riil: 1450000000000, // 1.45 T (19.54% -> Belum Memenuhi)
        realisasi: 1410000000000,
        status: 'CLOSED'
      }
    ];

    for (const yd of yearsData) {
      const apbdProvId = `apbd-lampung-${yd.tahun}`;
      const statusKepatuhan = yd.alokasi_pendidikan_riil >= (yd.total_apbd * 0.20) ? 'MEMENUHI' : 'BELUM_MEMENUHI';
      const catatanText = `Perda APBD Lampung Tahun ${yd.tahun}`;

      await client.query(`
        INSERT INTO public.apbd_provinsi (
          id, provinsi_id, tahun_anggaran_id, tahun, total_apbd, alokasi_pendidikan_riil, 
          realisasi_pendidikan_total, status_kepatuhan, status_anggaran, diinput_oleh, catatan
        ) VALUES (
          $1, 'p-8', $2, $3, $4, $5, $6, $7, $8, 'BPKAD Provinsi Lampung', $9
        ) ON CONFLICT (provinsi_id, tahun) DO UPDATE SET
          total_apbd = EXCLUDED.total_apbd,
          alokasi_pendidikan_riil = EXCLUDED.alokasi_pendidikan_riil,
          realisasi_pendidikan_total = EXCLUDED.realisasi_pendidikan_total,
          status_kepatuhan = EXCLUDED.status_kepatuhan,
          status_anggaran = EXCLUDED.status_anggaran,
          updated_at = NOW();
      `, [
        apbdProvId, 
        `ta-${yd.tahun}`, 
        yd.tahun, 
        yd.total_apbd, 
        yd.alokasi_pendidikan_riil, 
        yd.realisasi, 
        statusKepatuhan, 
        yd.status,
        catatanText
      ]);

      // Distribute evenly / weighted across 15 kab/kota
      const basePerKab = Math.floor(yd.alokasi_pendidikan_riil / kabKotaList.length);
      for (let i = 0; i < kabKotaList.length; i++) {
        const kab = kabKotaList[i];
        const breakdownId = `apbd-bd-${yd.tahun}-${kab.id}`;
        const varianceFactor = 0.85 + (i * 0.02);
        const nominalKab = Math.round(basePerKab * varianceFactor);
        const realisasiKab = Math.round(nominalKab * (0.78 + (i % 5) * 0.04));
        const catatanKab = `Alokasi APBD Murni ${yd.tahun}`;

        await client.query(`
          INSERT INTO public.apbd_pendidikan_breakdown (
            id, apbd_provinsi_id, kabupaten_kota_id, tahun, nominal_alokasi, realisasi_total, catatan
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7
          ) ON CONFLICT (apbd_provinsi_id, kabupaten_kota_id) DO UPDATE SET
            nominal_alokasi = EXCLUDED.nominal_alokasi,
            realisasi_total = EXCLUDED.realisasi_total,
            updated_at = NOW();
        `, [breakdownId, apbdProvId, kab.id, yd.tahun, nominalKab, realisasiKab, catatanKab]);
      }

      // Initial log
      const ketLog = `Inisialisasi data APBD Lampung ${yd.tahun}`;
      await client.query(`
        INSERT INTO public.apbd_input_log (
          id, apbd_provinsi_id, user_name, role, entitas, aksi, field_diubah, nilai_lama, nilai_baru, keterangan
        ) VALUES (
          $1, $2, 'Super Admin', 'SUPER_ADMIN', 'APBD Provinsi Lampung', 'INITIALIZE', 'total_apbd', '0', $3, $4
        ) ON CONFLICT (id) DO NOTHING;
      `, [`log-init-${yd.tahun}`, apbdProvId, String(yd.total_apbd), ketLog]);
    }

    console.log('Database migration and baseline seeding complete!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

migrate();
