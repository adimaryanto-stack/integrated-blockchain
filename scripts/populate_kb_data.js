const { Pool } = require('pg');
const crypto = require('crypto');

async function populateKbAlIkhlasData() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2025/postgres' });
  try {
    const schoolId = 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7';
    const npsn = '69893669';
    const totalNominal = 234775639; // 234.775.639
    const totalRealisasi = 197211537; // 197.211.537

    console.log('Populating data for KB AL-IKHLAS...');

    // 1. Ensure `schools` table has consistent data
    await pool.query(`
      INSERT INTO public.schools (id, name, npsn, location, accreditation, created_at, regency_id)
      VALUES ($1, 'KB AL-IKHLAS', $2, 'PAYA LUMPAT, Kel. Paya Lumpat, Kec. Samatiga, Kab. Aceh Barat', 'B', NOW(), 'r-060600')
      ON CONFLICT (id) DO UPDATE SET
        name = 'KB AL-IKHLAS',
        npsn = $2,
        location = 'PAYA LUMPAT, Kel. Paya Lumpat, Kec. Samatiga, Kab. Aceh Barat';
    `, [schoolId, npsn]);

    // 2. Clear old detail rows if any
    await pool.query("DELETE FROM public.transaction_items WHERE transaction_id IN (SELECT id FROM public.transactions WHERE school_id = $1)", [schoolId]);
    await pool.query("DELETE FROM public.incoming_funds WHERE school_id = $1", [schoolId]);
    await pool.query("DELETE FROM public.transactions WHERE school_id = $1", [schoolId]);
    await pool.query("DELETE FROM public.rincian_pengeluaran_item WHERE institusi_id = $1", [schoolId]);
    await pool.query("DELETE FROM public.pengeluaran_bulanan_institusi WHERE institusi_id = $1", [schoolId]);
    await pool.query("DELETE FROM public.sumber_dana_institusi WHERE institusi_id = $1", [schoolId]);

    // 3. Insert into `sumber_dana_institusi`
    await pool.query(`
      INSERT INTO public.sumber_dana_institusi (id, institusi_id, nama_sumber, nominal, realisasi, saldo_di_bank, tahun_anggaran)
      VALUES
        ('sd-kb-01', $1, 'BOP PAUD Reguler (APBN 2026)', 187820511, 157769230, 30051281, '2026'),
        ('sd-kb-02', $1, 'BOP PAUD Kinerja / APBD Aceh 2026', 46955128, 39442307, 7512821, '2026');
    `, [schoolId]);

    // 4. Insert into `incoming_funds`
    await pool.query(`
      INSERT INTO public.incoming_funds (id, school_id, source, amount, received_date, reference_number, created_at)
      VALUES
        ($1, $4, 'BOP PAUD Reguler Tahap 1 (APBN 2026)', 117387819, '2026-01-15T08:00:00Z', 'BOP-2026-01-001', NOW()),
        ($2, $4, 'BOP PAUD Reguler Tahap 2 (APBN 2026)', 70432692, '2026-04-10T08:00:00Z', 'BOP-2026-02-002', NOW()),
        ($3, $4, 'BOP PAUD Daerah Aceh Barat (APBD 2026)', 46955128, '2026-02-20T08:00:00Z', 'BOPD-2026-03', NOW());
    `, [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID(), schoolId]);

    // 5. Insert monthly spending into `pengeluaran_bulanan_institusi`
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const pcts = [0.10, 0.10, 0.10, 0.10, 0.10, 0.10, 0.08, 0.08, 0.08, 0.06, 0.05, 0.05];
    let sumDist = 0;
    for (let i = 0; i < 12; i++) {
      let nom = (i === 11) ? (totalRealisasi - sumDist) : Math.round(totalRealisasi * pcts[i]);
      sumDist += nom;
      await pool.query(`
        INSERT INTO public.pengeluaran_bulanan_institusi (id, institusi_id, nomor, bulan, nominal_pengeluaran, qty, sub_total, tahun)
        VALUES ($1, $2, $3, $4, $5, 1, $5, 2026)
      `, [`pb-kb-${i+1}`, schoolId, i + 1, monthNames[i], nom]);
    }

    // 6. Insert detailed transactions for KB AL-IKHLAS
    const txItems = [
      { cat: 'Buku & Perpus', desc: 'Pengadaan Buku Cerita Bergambar & Modul Karakter Anak PAUD', amount: 28500000, date: '2026-01-20', month: 1 },
      { cat: 'Sarana Prasarana', desc: 'Alat Permainan Edukatif (APE) Indoor & Outdoor', amount: 35400000, date: '2026-01-28', month: 1 },
      { cat: 'Gaji Honorer', desc: 'Honorarium Guru & Tenaga Pendidik PAUD (Bulan Jan-Feb)', amount: 32000000, date: '2026-02-15', month: 2 },
      { cat: 'Operasional', desc: 'Pengadaan ATK, Krayon, Kertas Lipat & Perlengkapan Menggambar Siswa', amount: 18750000, date: '2026-03-10', month: 3 },
      { cat: 'Kegiatan Siswa', desc: 'Pentas Seni Kreativitas Anak & Kunjungan Edukasi Lingkungan', amount: 22600000, date: '2026-04-05', month: 4 },
      { cat: 'Gaji Honorer', desc: 'Honorarium Guru & Tenaga Pendidik PAUD (Bulan Mar-Apr)', amount: 32000000, date: '2026-05-12', month: 5 },
      { cat: 'Operasional', desc: 'Pemeliharaan Sanitasi, Kebersihan & Obat P3K Anak PAUD', amount: 15400000, date: '2026-06-18', month: 6 },
      { cat: 'Lainnya', desc: 'Langganan Listrik, Internet & Komunikasi Sekolah PAUD', amount: 12561537, date: '2026-07-15', month: 7 },
    ];

    for (let i = 0; i < txItems.length; i++) {
      const t = txItems[i];
      const txId = crypto.randomUUID();
      const itemId = crypto.randomUUID();

      await pool.query(`
        INSERT INTO public.transactions (id, school_id, date, category, description, amount, tax_amount, shipping_cost, fund_source, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 'BOP PAUD', NOW())
      `, [txId, schoolId, t.date, t.cat, t.desc, t.amount]);

      await pool.query(`
        INSERT INTO public.transaction_items (id, transaction_id, item_name, unit_price, quantity, unit)
        VALUES ($1, $2, $3, $4, 1, 'paket')
      `, [itemId, txId, t.desc, t.amount]);

      await pool.query(`
        INSERT INTO public.rincian_pengeluaran_item (id, institusi_id, nomor, nomor_bulan, nama_produk_jasa, harga_satuan, qty, jumlah)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [`rincian-kb-${i+1}`, schoolId, i + 1, t.month, t.desc, t.amount, 1, t.amount]);
    }

    console.log('Successfully populated comprehensive data for KB AL-IKHLAS in all tables!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

populateKbAlIkhlasData();
