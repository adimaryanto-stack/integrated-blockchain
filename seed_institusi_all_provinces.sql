-- 1. Ensure provinsi_id column exists on institusi_pendidikan
ALTER TABLE institusi_pendidikan ADD COLUMN IF NOT EXISTS provinsi_id text;

-- 2. Populate provinsi_id for existing rows based on provinsi_nama
UPDATE institusi_pendidikan ip
SET provinsi_id = p.id
FROM provinsi p
WHERE (ip.provinsi_id IS NULL OR ip.provinsi_id = '')
  AND (ip.provinsi_nama = p.nama_provinsi OR LOWER(ip.provinsi_nama) = LOWER(p.nama_provinsi));

-- Populate remaining using kabupaten_kota_id matching (e.g. k-p-12-18 -> p-12)
UPDATE institusi_pendidikan
SET provinsi_id = 'p-' || split_part(kabupaten_kota_id, '-', 3)
WHERE (provinsi_id IS NULL OR provinsi_id = '')
  AND kabupaten_kota_id LIKE 'k-p-%';

-- 3. Seed realistic institusi_pendidikan for ALL 38 provinces if missing
DO $$
DECLARE
    p_rec RECORD;
    k_rec RECORD;
    j_type text;
    j_list text[] := ARRAY['PAUD', 'SD', 'SMP', 'SMA', 'UNIVERSITAS'];
    npsn_counter int := 100000;
    school_id text;
    nom_val numeric;
    real_val numeric;
    school_count_map JSONB := '{
        "UNIVERSITAS": {"base_count": 8, "nom_mult": 450000000000},
        "SMA": {"base_count": 45, "nom_mult": 120000000000},
        "SMP": {"base_count": 85, "nom_mult": 80000000000},
        "SD": {"base_count": 220, "nom_mult": 35000000000},
        "PAUD": {"base_count": 150, "nom_mult": 12000000000}
    }'::jsonb;
    school_names_map JSONB := '{
        "UNIVERSITAS": ["Universitas Negeri", "Universitas Teknologi", "Institut Agama Islam", "Politeknik Negeri", "Universitas Islam Negeri"],
        "SMA": ["SMA Negeri 1", "SMA Negeri 2", "SMA Negeri 3", "SMK Negeri 1", "SMK Negeri 2", "SMA Swasta Plus"],
        "SMP": ["SMP Negeri 1", "SMP Negeri 2", "SMP Negeri 3", "SMP Islam Terpadu", "SMP PGRI 1"],
        "SD": ["SD Negeri 01", "SD Negeri 02", "SD Negeri 03", "SD Islam Terpadu", "SD Katolik 1"],
        "PAUD": ["TK Negeri Pembina", "TK Islam Terpadu", "PAUD Ceria", "TK Kartika", "PAUD Kasih Ibu"]
    }'::jsonb;
BEGIN
    FOR p_rec IN SELECT id, nama_provinsi, kode_provinsi FROM provinsi ORDER BY id LOOP
        -- Check if schools exist for this province
        IF NOT EXISTS (SELECT 1 FROM institusi_pendidikan WHERE provinsi_id = p_rec.id OR provinsi_nama = p_rec.nama_provinsi) THEN
            -- Get first 3 regencies for this province to distribute schools
            FOR k_rec IN 
                SELECT kk.id as kab_id, kk.nama_kabupaten_kota 
                FROM alokasi_kabupaten_kota akk 
                JOIN kabupaten_kota kk ON akk.kabupaten_kota_id = kk.id 
                WHERE akk.alokasi_provinsi_id IN (SELECT id FROM alokasi_provinsi WHERE provinsi_id = p_rec.id)
                LIMIT 3
            LOOP
                FOREACH j_type IN ARRAY j_list LOOP
                    npsn_counter := npsn_counter + 1;
                    school_id := 'inst-' || LOWER(j_type) || '-' || p_rec.kode_provinsi || '-' || npsn_counter;
                    
                    nom_val := (school_count_map->j_type->>'nom_mult')::numeric * (1 + (npsn_counter % 5) * 0.1);
                    real_val := nom_val * (0.65 + (npsn_counter % 25) * 0.01);
                    
                    INSERT INTO institusi_pendidikan (
                        id, npsn, nama_institusi, jenjang, kabupaten_kota_id, kabupaten_kota_nama,
                        provinsi_id, provinsi_nama, status_sekolah, nomor_rekening, alamat, nisn,
                        nominal_alokasi, realisasi_total, selisih, persentase_penyerapan, updated_at
                    ) VALUES (
                        school_id,
                        npsn_counter::text,
                        (school_names_map->j_type->>(npsn_counter % 5)) || ' ' || k_rec.nama_kabupaten_kota,
                        j_type,
                        k_rec.kab_id,
                        k_rec.nama_kabupaten_kota,
                        p_rec.id,
                        p_rec.nama_provinsi,
                        CASE WHEN (npsn_counter % 2 = 0) THEN 'NEGERI' ELSE 'SWASTA' END,
                        '1' || (npsn_counter % 900 + 100)::text || '.00' || p_rec.kode_provinsi || '.000',
                        'Jl. Pendidikan No. ' || (npsn_counter % 50 + 1)::text || ', ' || k_rec.nama_kabupaten_kota || ', ' || p_rec.nama_provinsi,
                        '88' || npsn_counter::text,
                        nom_val,
                        real_val,
                        nom_val - real_val,
                        ROUND((real_val / nom_val * 100)::numeric, 1),
                        '2026-04-15'
                    ) ON CONFLICT (id) DO NOTHING;
                END LOOP;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Verify results across all provinces
SELECT 
    p.nama_provinsi,
    p.id as prov_id,
    COUNT(ip.id) as total_sekolah,
    COUNT(CASE WHEN ip.jenjang = 'PAUD' THEN 1 END) as paud,
    COUNT(CASE WHEN ip.jenjang = 'SD' THEN 1 END) as sd,
    COUNT(CASE WHEN ip.jenjang = 'SMP' THEN 1 END) as smp,
    COUNT(CASE WHEN ip.jenjang = 'SMA' THEN 1 END) as sma,
    COUNT(CASE WHEN ip.jenjang = 'UNIVERSITAS' THEN 1 END) as univ
FROM provinsi p
LEFT JOIN institusi_pendidikan ip ON (ip.provinsi_id = p.id OR ip.provinsi_nama = p.nama_provinsi)
GROUP BY p.id, p.nama_provinsi
ORDER BY p.id;
