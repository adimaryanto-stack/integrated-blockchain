const { Client } = require('pg');
const crypto = require('crypto');

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:2027/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to PostgreSQL (Port 2025)...');

  try {
    await client.query('BEGIN');

    // 1. tahun_anggaran
    console.log('[1/4] Upserting tahun_anggaran (2024, 2025, 2026, 2027)...');
    const taData = [
      { id: '2024', tahun: 2024, total_anggaran: '665000000000000', status: 'CLOSED' },
      { id: '2025', tahun: 2025, total_anggaran: '721500000000000', status: 'CLOSED' },
      { id: '2026', tahun: 2026, total_anggaran: '769100000000000', status: 'ACTIVE' },
      { id: '2027', tahun: 2027, total_anggaran: '0', status: 'DRAFT' }
    ];

    for (const t of taData) {
      await client.query(`
        INSERT INTO tahun_anggaran (id, tahun, total_anggaran, status, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (tahun) DO UPDATE 
        SET total_anggaran = EXCLUDED.total_anggaran, status = EXCLUDED.status;
      `, [t.id, t.tahun, t.total_anggaran, t.status]);
    }

    // 2. apbn_yearly_data
    console.log('[2/4] Upserting apbn_yearly_data (2024, 2025, 2026, 2027)...');
    const apbnYears = [
      {
        year: 2024,
        total_budget: '665.0',
        status: 'PUBLISHED',
        flow_data: {
          id: 'apbn-2024',
          color: 'indigo',
          label: 'Realisasi APBN 2024',
          amount: 665.0,
          children: [
            { id: 'pusat-2024', color: 'rose', label: 'Belanja Pemerintah Pusat', amount: 260.0 },
            { id: 'tkdd-2024', color: 'emerald', label: 'Transfer ke Daerah (TKDD)', amount: 330.0, ke_provinsi: true },
            { id: 'pembiayaan-2024', color: 'amber', label: 'Pembiayaan Pendidikan', amount: 75.0 }
          ]
        }
      },
      {
        year: 2025,
        total_budget: '721.5',
        status: 'PUBLISHED',
        flow_data: {
          id: 'apbn-2025',
          color: 'indigo',
          label: 'Realisasi APBN 2025',
          amount: 721.5,
          children: [
            { id: 'pusat-2025', color: 'rose', label: 'Belanja Pemerintah Pusat', amount: 285.0 },
            { id: 'tkdd-2025', color: 'emerald', label: 'Transfer ke Daerah (TKDD)', amount: 350.0, ke_provinsi: true },
            { id: 'pembiayaan-2025', color: 'amber', label: 'Pembiayaan Pendidikan', amount: 86.5 }
          ]
        }
      },
      {
        year: 2026,
        total_budget: '769.1',
        status: 'PUBLISHED',
        flow_data: {
          id: 'apbn-2026',
          color: 'indigo',
          label: 'Alokasi APBN 2026',
          amount: 769.1,
          children: [
            { id: 'pusat-2026', color: 'rose', label: 'Belanja Pemerintah Pusat (Est)', amount: 310.5 },
            { id: 'tkdd-2026', color: 'emerald', label: 'Transfer ke Daerah (Est)', amount: 368.6, ke_provinsi: true },
            { id: 'pembiayaan-2026', color: 'amber', label: 'Pembiayaan Pendidikan (Est)', amount: 90.0 }
          ]
        }
      },
      {
        year: 2027,
        total_budget: '0.0',
        status: 'DRAFT',
        flow_data: {
          id: 'apbn-2027',
          color: 'indigo',
          label: 'Perencanaan APBN 2027 (Draft)',
          amount: 0.0,
          children: [
            { id: 'pusat-2027', color: 'rose', label: 'Belanja Pemerintah Pusat (Draft)', amount: 0.0 },
            { id: 'tkdd-2027', color: 'emerald', label: 'Transfer ke Daerah (Draft)', amount: 0.0, ke_provinsi: true },
            { id: 'pembiayaan-2027', color: 'amber', label: 'Pembiayaan Pendidikan (Draft)', amount: 0.0 }
          ]
        }
      }
    ];

    const apbnIds = {};
    for (const a of apbnYears) {
      // Check if exists
      const existing = await client.query('SELECT id FROM apbn_yearly_data WHERE year = $1', [a.year]);
      let apbnId;
      if (existing.rows.length > 0) {
        apbnId = existing.rows[0].id;
        await client.query(`
          UPDATE apbn_yearly_data 
          SET total_budget = $1, status = $2, flow_data = $3, updated_at = NOW() 
          WHERE year = $4
        `, [a.total_budget, a.status, JSON.stringify(a.flow_data), a.year]);
      } else {
        apbnId = crypto.randomUUID();
        await client.query(`
          INSERT INTO apbn_yearly_data (id, year, total_budget, flow_data, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        `, [apbnId, a.year, a.total_budget, JSON.stringify(a.flow_data), a.status]);
      }
      apbnIds[a.year] = apbnId;
    }

    // 3. provincial_allocations (Get 2026 provinces as baseline)
    console.log('[3/4] Generating provincial_allocations for 2024, 2025, 2027...');
    const prov2026 = await client.query('SELECT * FROM provincial_allocations WHERE year = 2026');
    console.log(`Found ${prov2026.rows.length} base provinces from 2026.`);

    const yearsToSeed = [
      { yr: 2024, ratio: 665.0 / 769.1, apbnId: apbnIds[2024], audit: 'NORMAL' },
      { yr: 2025, ratio: 721.5 / 769.1, apbnId: apbnIds[2025], audit: 'NORMAL' },
      { yr: 2027, ratio: 0.0, apbnId: apbnIds[2027], audit: 'NORMAL' }
    ];

    for (const target of yearsToSeed) {
      // Remove old for this year to prevent duplicates
      await client.query('DELETE FROM provincial_allocations WHERE year = $1', [target.yr]);
      
      for (const p of prov2026.rows) {
        const newId = crypto.randomUUID();
        const alokasi = (Number(p.alokasi) * target.ratio).toFixed(2);
        const diterima = (Number(p.diterima) * target.ratio).toFixed(2);
        const disalurkan = (Number(p.disalurkan) * target.ratio).toFixed(2);

        await client.query(`
          INSERT INTO provincial_allocations (
            id, apbn_id, year, provinsi_code, provinsi_name, 
            alokasi, diterima, disalurkan,
            is_manual_flagged, over_budget_warning, audit_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, false, $9, NOW(), NOW())
        `, [
          newId, target.apbnId, target.yr, p.provinsi_code, p.provinsi_name,
          alokasi, diterima, disalurkan, target.audit
        ]);
      }
      console.log(` ✅ Inserted 38 provincial_allocations for Year ${target.yr}`);
    }

    // 4. district_allocations
    console.log('[4/4] Generating district_allocations for 2024, 2025, 2027...');
    const dist2026 = await client.query('SELECT * FROM district_allocations WHERE year = 2026');
    for (const target of yearsToSeed) {
      await client.query('DELETE FROM district_allocations WHERE year = $1', [target.yr]);
      
      for (const d of dist2026.rows) {
        // Find matching provincial_id for this year
        const provMatch = await client.query(
          'SELECT id FROM provincial_allocations WHERE year = $1 AND provinsi_code = $2 LIMIT 1',
          [target.yr, d.provinsi_code]
        );
        const provId = provMatch.rows.length > 0 ? provMatch.rows[0].id : d.provincial_id;

        const newId = crypto.randomUUID();
        const alokasi = (Number(d.alokasi) * target.ratio).toFixed(2);
        const diterima = (Number(d.diterima) * target.ratio).toFixed(2);
        const disalurkan = (Number(d.disalurkan) * target.ratio).toFixed(2);

        await client.query(`
          INSERT INTO district_allocations (
            id, provincial_id, year, kabkota_code, kabkota_name, provinsi_code,
            alokasi, diterima, disalurkan,
            is_manual_flagged, over_budget_warning, audit_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, false, 'NORMAL', NOW(), NOW())
        `, [
          newId, provId, target.yr, d.kabkota_code, d.kabkota_name, d.provinsi_code,
          alokasi, diterima, disalurkan
        ]);
      }
      console.log(` ✅ Inserted district_allocations for Year ${target.yr}`);
    }

    await client.query('COMMIT');
    console.log('\n🎉 ALL YEARS (2024, 2025, 2026, 2027) POPULATED SUCCESSFULLY!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error seeding fund flow years:', e);
  } finally {
    await client.end();
  }
}

run();
