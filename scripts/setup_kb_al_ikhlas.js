const { Pool } = require('pg');

async function setupKbAlIkhlas() {
  const pool = new Pool({ connectionString: 'postgresql://postgres@localhost:2025/postgres' });
  try {
    const checkRes = await pool.query("SELECT * FROM public.institusi_pendidikan WHERE npsn = $1", ['69893669']);
    console.log('Existing 69893669 rows:', checkRes.rows);

    let schoolId;
    if (checkRes.rows.length === 0) {
      // Find district and province for KB AL-IKHLAS
      const jabarKab = await pool.query("SELECT * FROM public.kabupaten_kota WHERE nama_kabupaten_kota ILIKE '%Bogor%' LIMIT 1");
      const kabId = jabarKab.rows[0]?.id || 'r-051800';
      const kabNama = jabarKab.rows[0]?.nama_kabupaten_kota || 'Kab. Bogor';

      const insertRes = await pool.query(`
        INSERT INTO public.institusi_pendidikan (
          id, npsn, nama_institusi, jenjang, kabupaten_kota_id, kabupaten_kota_nama,
          provinsi_nama, status_sekolah, nomor_rekening, nominal_alokasi, realisasi_total,
          selisih, persentase_penyerapan, updated_at
        ) VALUES (
          'inst-kb-al-ikhlas-69893669', '69893669', 'KB AL-IKHLAS', 'PAUD',
          $1, $2, 'Jawa Barat', 'SWASTA', '100.201.303.669',
          350000000, 280000000, 70000000, 80.0, NOW()
        ) RETURNING *
      `, [kabId, kabNama]);
      console.log('Inserted KB AL-IKHLAS:', insertRes.rows[0]);
      schoolId = insertRes.rows[0].id;
    } else {
      schoolId = checkRes.rows[0].id;
      // Update name to KB AL-IKHLAS
      await pool.query("UPDATE public.institusi_pendidikan SET nama_institusi = 'KB AL-IKHLAS', jenjang = 'PAUD' WHERE npsn = '69893669'");
      console.log('Updated existing school with NPSN 69893669');
    }

    // Check users table in DB and upsert school user account
    const userCheck = await pool.query("SELECT * FROM public.users WHERE username = 'kb_al_ikhlas' OR npsn = '69893669'");
    if (userCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO public.users (
          id, username, email, nama_lengkap, role, npsn, institusi_id, status, created_at
        ) VALUES (
          'user-kb-al-ikhlas', 'kb_al_ikhlas', 'admin@kbalikhlas.sch.id', 'KB AL-IKHLAS (Operator)',
          'INSTITUSI', '69893669', $1, 'ACTIVE', NOW()
        )
      `, [schoolId]);
      console.log('Created user account for KB AL-IKHLAS in users table');
    } else {
      await pool.query(`
        UPDATE public.users SET
          username = 'kb_al_ikhlas',
          email = 'admin@kbalikhlas.sch.id',
          nama_lengkap = 'KB AL-IKHLAS (Operator)',
          role = 'INSTITUSI',
          npsn = '69893669',
          institusi_id = $1,
          status = 'ACTIVE'
        WHERE id = $2
      `, [schoolId, userCheck.rows[0].id]);
      console.log('Updated user account for KB AL-IKHLAS');
    }

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

setupKbAlIkhlas();
