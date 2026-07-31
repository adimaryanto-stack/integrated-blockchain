-- 1. Sync kabupaten_kota table from regencies table for all 38 provinces
INSERT INTO kabupaten_kota (id, provinsi_id, kode_kabupaten_kota, nama_kabupaten_kota, tipe)
SELECT 
    r.id as id,
    r.province_id as provinsi_id,
    COALESCE(r.code, substring(r.id from '\d+')) as kode_kabupaten_kota,
    r.name as nama_kabupaten_kota,
    CASE WHEN r.name ILIKE 'Kota %' THEN 'KOTA' ELSE 'KABUPATEN' END as tipe
FROM regencies r
ON CONFLICT (id) DO UPDATE SET
    provinsi_id = EXCLUDED.provinsi_id,
    nama_kabupaten_kota = EXCLUDED.nama_kabupaten_kota,
    tipe = EXCLUDED.tipe;

-- 2. Populate alokasi_kabupaten_kota for ALL regencies in all 38 provinces
DO $$
DECLARE
    ap RECORD;
    r_count INTEGER;
    r_rec RECORD;
    idx INTEGER;
    calc_nominal NUMERIC(20,2);
    calc_realisasi NUMERIC(20,2);
BEGIN
    FOR ap IN SELECT id, provinsi_id, nominal_alokasi, realisasi_total FROM alokasi_provinsi LOOP
        -- Count how many regencies exist for this province
        SELECT COUNT(*) INTO r_count FROM kabupaten_kota WHERE provinsi_id = ap.provinsi_id;
        
        IF r_count > 0 THEN
            idx := 0;
            FOR r_rec IN SELECT id, nama_kabupaten_kota FROM kabupaten_kota WHERE provinsi_id = ap.provinsi_id ORDER BY id LOOP
                idx := idx + 1;
                
                -- Proportional budget division with slight variance
                calc_nominal := ROUND((ap.nominal_alokasi::numeric / r_count) * (0.7 + ((idx * 7) % 7) * 0.1), 2);
                calc_realisasi := ROUND(calc_nominal * (0.6 + ((idx * 13) % 35) * 0.01), 2);

                INSERT INTO alokasi_kabupaten_kota (
                    id, alokasi_provinsi_id, kabupaten_kota_id, provinsi_nama,
                    nominal_alokasi, realisasi_total, selisih, persentase_penyerapan, updated_at
                ) VALUES (
                    'akk-' || r_rec.id,
                    ap.id,
                    r_rec.id,
                    (SELECT nama_provinsi FROM provinsi WHERE id = ap.provinsi_id LIMIT 1),
                    calc_nominal,
                    calc_realisasi,
                    calc_nominal - calc_realisasi,
                    ROUND((calc_realisasi / calc_nominal * 100)::numeric, 1),
                    '2026-04-15'
                )
                ON CONFLICT (id) DO UPDATE SET
                    nominal_alokasi = EXCLUDED.nominal_alokasi,
                    realisasi_total = EXCLUDED.realisasi_total,
                    selisih = EXCLUDED.selisih,
                    persentase_penyerapan = EXCLUDED.persentase_penyerapan;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- 3. Sync alokasi_provinsi totals to equal sum of alokasi_kabupaten_kota
UPDATE alokasi_provinsi ap
SET 
    nominal_alokasi = sub.tot_nom,
    realisasi_total = sub.tot_real,
    selisih = sub.tot_nom - sub.tot_real,
    persentase_penyerapan = ROUND((sub.tot_real / sub.tot_nom * 100)::numeric, 1)
FROM (
    SELECT alokasi_provinsi_id, SUM(nominal_alokasi) as tot_nom, SUM(realisasi_total) as tot_real
    FROM alokasi_kabupaten_kota
    GROUP BY alokasi_provinsi_id
) sub
WHERE ap.id = sub.alokasi_provinsi_id;

-- 4. Verify regencies count & alokasi count for Lampung (p-8)
SELECT 
    p.nama_provinsi,
    p.id as prov_id,
    (SELECT COUNT(*) FROM regencies WHERE province_id = p.id) as count_regencies,
    (SELECT COUNT(*) FROM kabupaten_kota WHERE provinsi_id = p.id) as count_kabkota,
    (SELECT COUNT(*) FROM alokasi_kabupaten_kota WHERE alokasi_provinsi_id = ap.id) as count_alokasi_kabkota,
    ap.nominal_alokasi as prov_nominal,
    ap.realisasi_total as prov_realisasi
FROM provinsi p
JOIN alokasi_provinsi ap ON ap.provinsi_id = p.id
WHERE p.id = 'p-8';
