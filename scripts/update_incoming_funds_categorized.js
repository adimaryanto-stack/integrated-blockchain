const { Pool } = require('pg');
const crypto = require('crypto');

async function updateIncomingFundsCategorized() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2025/postgres' });
  try {
    const schoolId = 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7';

    console.log('Updating incoming_funds for APBN, APBD, and CSR for KB AL-IKHLAS...');

    // Delete existing incoming_funds for this school
    await pool.query("DELETE FROM public.incoming_funds WHERE school_id = $1", [schoolId]);

    // Insert structured incoming funds
    const funds = [
      // APBN
      {
        id: crypto.randomUUID(),
        source: 'BOP PAUD Reguler Tahap 1 (APBN 2026)',
        amount: 117387819,
        received_date: '2026-01-15T08:00:00Z',
        reference_number: 'SP2D-APBN-2026-01-081'
      },
      {
        id: crypto.randomUUID(),
        source: 'BOP PAUD Reguler Tahap 2 (APBN 2026)',
        amount: 70432692,
        received_date: '2026-04-10T08:00:00Z',
        reference_number: 'SP2D-APBN-2026-02-142'
      },
      // APBD
      {
        id: crypto.randomUUID(),
        source: 'BOP PAUD Daerah Aceh Barat Tahap 1 (APBD 2026)',
        amount: 25000000,
        received_date: '2026-02-20T08:00:00Z',
        reference_number: 'SP2D-APBD-0606-01'
      },
      {
        id: crypto.randomUUID(),
        source: 'BOP PAUD Daerah Aceh Barat Tahap 2 (APBD 2026)',
        amount: 16955128,
        received_date: '2026-06-18T08:00:00Z',
        reference_number: 'SP2D-APBD-0606-02'
      },
      // CSR
      {
        id: crypto.randomUUID(),
        source: 'CSR Pendidikan PT Mifa Bersaudara Aceh (Program PAUD Ceria 2026)',
        amount: 5000000,
        received_date: '2026-03-05T08:00:00Z',
        reference_number: 'CSR-MIFA-2026-033'
      }
    ];

    for (const f of funds) {
      await pool.query(`
        INSERT INTO public.incoming_funds (id, school_id, source, amount, received_date, reference_number, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `, [f.id, schoolId, f.source, f.amount, f.received_date, f.reference_number]);
    }

    // Update sumber_dana_institusi as well
    await pool.query("DELETE FROM public.sumber_dana_institusi WHERE institusi_id = $1", [schoolId]);
    await pool.query(`
      INSERT INTO public.sumber_dana_institusi (id, institusi_id, nama_sumber, nominal, realisasi, saldo_di_bank, tahun_anggaran)
      VALUES
        ('sd-kb-01', $1, 'APBN - BOP PAUD Reguler 2026', 187820511, 157769230, 30051281, '2026'),
        ('sd-kb-02', $1, 'APBD - BOP Daerah Aceh Barat 2026', 41955128, 34442307, 7512821, '2026'),
        ('sd-kb-03', $1, 'CSR - Mitra Pendidikan PT Mifa Bersaudara 2026', 5000000, 5000000, 0, '2026');
    `, [schoolId]);

    console.log('Successfully updated categorized incoming funds and sumber_dana_institusi!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

updateIncomingFundsCategorized();
