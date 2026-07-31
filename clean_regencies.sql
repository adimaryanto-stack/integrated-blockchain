-- Delete old non-standard k-p- and kab-p- entries
DELETE FROM alokasi_kabupaten_kota WHERE kabupaten_kota_id LIKE 'k-p-%' OR id LIKE 'kab-p-%';
DELETE FROM kabupaten_kota WHERE id LIKE 'k-p-%';

-- Re-sync alokasi_provinsi totals to equal sum of standard akk-r- entries
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

-- Verify exact counts for Lampung (p-8)
SELECT 
    p.nama_provinsi,
    p.id as prov_id,
    (SELECT COUNT(*) FROM regencies WHERE province_id = p.id) as regencies_count,
    (SELECT COUNT(*) FROM kabupaten_kota WHERE provinsi_id = p.id) as kabkota_count,
    (SELECT COUNT(*) FROM alokasi_kabupaten_kota WHERE alokasi_provinsi_id = ap.id) as alokasi_kabkota_count,
    ap.nominal_alokasi as prov_nominal,
    ap.realisasi_total as prov_realisasi
FROM provinsi p
JOIN alokasi_provinsi ap ON ap.provinsi_id = p.id
WHERE p.id = 'p-8';
