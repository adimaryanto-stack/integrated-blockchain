-- ==============================================================================
-- AUTOMATIC TOP-DOWN BIGINT CASCADING SYSTEM (100% PRECISION)
-- Covers: APBN (tahun_anggaran) -> 38 Provinsi -> 514 Kabupaten/Kota
-- Synchronizes: alokasi_provinsi, alokasi_kabupaten_kota, provincial_allocations,
--               district_allocations, apbn_yearly_data
-- ==============================================================================

-- 1. Stored Procedure: cascade_top_down_anggaran
CREATE OR REPLACE FUNCTION cascade_top_down_anggaran(target_tahun_id text)
RETURNS void AS $$
DECLARE
    v_tahun INT;
    v_total_apbn BIGINT;
    v_prov_count INT;
    v_base_prov BIGINT;
    v_rem_prov BIGINT;
    v_prov_idx INT;
    v_prov_rec RECORD;
    v_kab_count INT;
    v_base_kab BIGINT;
    v_rem_kab BIGINT;
    v_kab_idx INT;
    v_kab_rec RECORD;
    v_ap_id TEXT;
    v_akk_id TEXT;
    v_prov_nominal BIGINT;
    v_kab_nominal BIGINT;
    v_apbn_uuid UUID;
    v_pa_uuid UUID;
    v_da_uuid UUID;
BEGIN
    -- 1. Get tahun_anggaran info
    SELECT tahun, total_anggaran INTO v_tahun, v_total_apbn 
    FROM tahun_anggaran 
    WHERE id = target_tahun_id;

    IF v_tahun IS NULL THEN
        RETURN;
    END IF;

    -- 2. Count provinces (38)
    SELECT COUNT(*) INTO v_prov_count FROM provinsi;
    IF v_prov_count = 0 THEN
        RETURN;
    END IF;

    v_base_prov := v_total_apbn / v_prov_count;
    v_rem_prov  := v_total_apbn % v_prov_count;
    v_prov_idx  := 0;

    -- Upsert apbn_yearly_data for portal transparansi
    SELECT id INTO v_apbn_uuid FROM apbn_yearly_data WHERE year = v_tahun LIMIT 1;
    IF v_apbn_uuid IS NULL THEN
        v_apbn_uuid := gen_random_uuid();
        INSERT INTO apbn_yearly_data (id, year, total_budget, flow_data, status, created_at, updated_at)
        VALUES (
            v_apbn_uuid, 
            v_tahun, 
            ROUND((v_total_apbn::numeric / 1e12), 2),
            jsonb_build_object(
                'id', 'apbn-' || v_tahun,
                'label', 'Alokasi APBN ' || v_tahun,
                'amount', ROUND((v_total_apbn::numeric / 1e12), 2),
                'children', jsonb_build_array(
                    jsonb_build_object('id', 'pusat-' || v_tahun, 'label', 'Belanja Pemerintah Pusat', 'amount', ROUND((v_total_apbn::numeric * 0.4 / 1e12), 2)),
                    jsonb_build_object('id', 'tkdd-' || v_tahun, 'label', 'Transfer ke Daerah (TKDD)', 'amount', ROUND((v_total_apbn::numeric * 0.5 / 1e12), 2), 'ke_provinsi', true),
                    jsonb_build_object('id', 'pembiayaan-' || v_tahun, 'label', 'Pembiayaan Pendidikan', 'amount', ROUND((v_total_apbn::numeric * 0.1 / 1e12), 2))
                )
            ),
            'PUBLISHED',
            NOW(),
            NOW()
        );
    ELSE
        UPDATE apbn_yearly_data 
        SET total_budget = ROUND((v_total_apbn::numeric / 1e12), 2),
            updated_at = NOW()
        WHERE id = v_apbn_uuid;
    END IF;

    -- 3. Loop through all 38 provinces
    FOR v_prov_rec IN SELECT id, kode_provinsi, nama_provinsi FROM provinsi ORDER BY id ASC LOOP
        v_prov_idx := v_prov_idx + 1;
        
        -- Exact BigInt distribution with remainder to the last province
        IF v_prov_idx = v_prov_count THEN
            v_prov_nominal := v_base_prov + v_rem_prov;
        ELSE
            v_prov_nominal := v_base_prov;
        END IF;

        v_ap_id := 'prov-' || v_prov_rec.id || '-' || target_tahun_id;

        -- Upsert alokasi_provinsi
        INSERT INTO alokasi_provinsi (
            id, tahun_anggaran_id, provinsi_id,
            nominal_alokasi, realisasi_total, selisih, persentase_penyerapan, updated_at
        ) VALUES (
            v_ap_id, target_tahun_id, v_prov_rec.id,
            v_prov_nominal, 0, v_prov_nominal, 0, TO_CHAR(NOW(), 'YYYY-MM-DD')
        )
        ON CONFLICT (id) DO UPDATE SET
            nominal_alokasi = EXCLUDED.nominal_alokasi,
            selisih = EXCLUDED.nominal_alokasi - alokasi_provinsi.realisasi_total,
            persentase_penyerapan = CASE 
                WHEN EXCLUDED.nominal_alokasi > 0 THEN ROUND((alokasi_provinsi.realisasi_total::numeric / EXCLUDED.nominal_alokasi::numeric) * 100, 1)
                ELSE 0 
            END,
            updated_at = TO_CHAR(NOW(), 'YYYY-MM-DD');

        -- Upsert provincial_allocations (for portal transparansi)
        SELECT id INTO v_pa_uuid FROM provincial_allocations WHERE year = v_tahun AND provinsi_code = v_prov_rec.kode_provinsi LIMIT 1;
        IF v_pa_uuid IS NULL THEN
            v_pa_uuid := gen_random_uuid();
            INSERT INTO provincial_allocations (
                id, apbn_id, year, provinsi_code, provinsi_name,
                alokasi, diterima, disalurkan,
                is_manual_flagged, over_budget_warning, audit_status,
                created_at, updated_at
            ) VALUES (
                v_pa_uuid, v_apbn_uuid, v_tahun, v_prov_rec.kode_provinsi, v_prov_rec.nama_provinsi,
                v_prov_nominal, 0, 0,
                false, false, 'NORMAL',
                NOW(), NOW()
            );
        ELSE
            UPDATE provincial_allocations
            SET alokasi = v_prov_nominal,
                updated_at = NOW()
            WHERE id = v_pa_uuid;
        END IF;

        -- 4. Cascade to child kabupaten/kota for this province
        SELECT COUNT(*) INTO v_kab_count FROM kabupaten_kota WHERE provinsi_id = v_prov_rec.id;
        
        IF v_kab_count > 0 THEN
            v_base_kab := v_prov_nominal / v_kab_count;
            v_rem_kab  := v_prov_nominal % v_kab_count;
            v_kab_idx  := 0;

            FOR v_kab_rec IN SELECT id, kode_kabupaten_kota, nama_kabupaten_kota, tipe FROM kabupaten_kota WHERE provinsi_id = v_prov_rec.id ORDER BY id ASC LOOP
                v_kab_idx := v_kab_idx + 1;
                
                -- Exact BigInt distribution with remainder to the last kabupaten/kota
                IF v_kab_idx = v_kab_count THEN
                    v_kab_nominal := v_base_kab + v_rem_kab;
                ELSE
                    v_kab_nominal := v_base_kab;
                END IF;

                v_akk_id := 'akk-' || v_kab_rec.id || '-' || target_tahun_id;

                -- Upsert alokasi_kabupaten_kota
                INSERT INTO alokasi_kabupaten_kota (
                    id, alokasi_provinsi_id, kabupaten_kota_id, provinsi_nama,
                    nominal_alokasi, realisasi_total, selisih, persentase_penyerapan, updated_at
                ) VALUES (
                    v_akk_id, v_ap_id, v_kab_rec.id, v_prov_rec.nama_provinsi,
                    v_kab_nominal, 0, v_kab_nominal, 0, TO_CHAR(NOW(), 'YYYY-MM-DD')
                )
                ON CONFLICT (id) DO UPDATE SET
                    nominal_alokasi = EXCLUDED.nominal_alokasi,
                    selisih = EXCLUDED.nominal_alokasi - alokasi_kabupaten_kota.realisasi_total,
                    persentase_penyerapan = CASE 
                        WHEN EXCLUDED.nominal_alokasi > 0 THEN ROUND((alokasi_kabupaten_kota.realisasi_total::numeric / EXCLUDED.nominal_alokasi::numeric) * 100, 1)
                        ELSE 0 
                    END,
                    updated_at = TO_CHAR(NOW(), 'YYYY-MM-DD');

                -- Upsert district_allocations (for portal transparansi)
                SELECT id INTO v_da_uuid FROM district_allocations WHERE year = v_tahun AND kabkota_code = v_kab_rec.kode_kabupaten_kota LIMIT 1;
                IF v_da_uuid IS NULL THEN
                    v_da_uuid := gen_random_uuid();
                    INSERT INTO district_allocations (
                        id, provincial_id, year, kabkota_code, kabkota_name, provinsi_code,
                        alokasi, diterima, disalurkan,
                        is_manual_flagged, over_budget_warning, audit_status,
                        created_at, updated_at
                    ) VALUES (
                        v_da_uuid, v_pa_uuid, v_tahun, v_kab_rec.kode_kabupaten_kota, v_kab_rec.nama_kabupaten_kota, v_prov_rec.kode_provinsi,
                        v_kab_nominal, 0, 0,
                        false, false, 'NORMAL',
                        NOW(), NOW()
                    );
                ELSE
                    UPDATE district_allocations
                    SET alokasi = v_kab_nominal,
                        provincial_id = v_pa_uuid,
                        updated_at = NOW()
                    WHERE id = v_da_uuid;
                END IF;

            END LOOP;
        END IF;

    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger on tahun_anggaran (Top-Down Cascade)
CREATE OR REPLACE FUNCTION trg_fn_tahun_anggaran_cascade()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF (TG_OP = 'INSERT') OR (TG_OP = 'UPDATE' AND NEW.total_anggaran <> OLD.total_anggaran) THEN
        PERFORM cascade_top_down_anggaran(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tahun_anggaran_cascade ON tahun_anggaran;
CREATE TRIGGER trg_tahun_anggaran_cascade
AFTER INSERT OR UPDATE ON tahun_anggaran
FOR EACH ROW
EXECUTE FUNCTION trg_fn_tahun_anggaran_cascade();

-- 3. Trigger on alokasi_provinsi (Mid-Level Cascade Down & Up)
CREATE OR REPLACE FUNCTION trg_fn_alokasi_provinsi_update()
RETURNS TRIGGER AS $$
DECLARE
    v_kab_count INT;
    v_base_kab BIGINT;
    v_rem_kab BIGINT;
    v_kab_idx INT;
    v_kab_rec RECORD;
    v_kab_nominal BIGINT;
    v_tahun INT;
    v_prov_code VARCHAR;
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF NEW.nominal_alokasi <> OLD.nominal_alokasi THEN
        SELECT COUNT(*) INTO v_kab_count FROM kabupaten_kota WHERE provinsi_id = NEW.provinsi_id;
        
        IF v_kab_count > 0 THEN
            v_base_kab := NEW.nominal_alokasi / v_kab_count;
            v_rem_kab  := NEW.nominal_alokasi % v_kab_count;
            v_kab_idx  := 0;

            FOR v_kab_rec IN SELECT id, kode_kabupaten_kota, nama_kabupaten_kota FROM kabupaten_kota WHERE provinsi_id = NEW.provinsi_id ORDER BY id ASC LOOP
                v_kab_idx := v_kab_idx + 1;
                
                IF v_kab_idx = v_kab_count THEN
                    v_kab_nominal := v_base_kab + v_rem_kab;
                ELSE
                    v_kab_nominal := v_base_kab;
                END IF;

                UPDATE alokasi_kabupaten_kota
                SET nominal_alokasi = v_kab_nominal,
                    selisih = v_kab_nominal - realisasi_total,
                    persentase_penyerapan = CASE WHEN v_kab_nominal > 0 THEN ROUND((realisasi_total::numeric / v_kab_nominal::numeric) * 100, 1) ELSE 0 END,
                    updated_at = TO_CHAR(NOW(), 'YYYY-MM-DD')
                WHERE alokasi_provinsi_id = NEW.id AND kabupaten_kota_id = v_kab_rec.id;

                SELECT tahun INTO v_tahun FROM tahun_anggaran WHERE id = NEW.tahun_anggaran_id;
                IF v_tahun IS NOT NULL THEN
                    UPDATE district_allocations
                    SET alokasi = v_kab_nominal,
                        updated_at = NOW()
                    WHERE year = v_tahun AND kabkota_code = v_kab_rec.kode_kabupaten_kota;
                END IF;

            END LOOP;
        END IF;

        UPDATE tahun_anggaran
        SET total_anggaran = (SELECT COALESCE(SUM(nominal_alokasi), 0) FROM alokasi_provinsi WHERE tahun_anggaran_id = NEW.tahun_anggaran_id)
        WHERE id = NEW.tahun_anggaran_id;

        SELECT p.kode_provinsi, ta.tahun INTO v_prov_code, v_tahun
        FROM provinsi p, tahun_anggaran ta
        WHERE p.id = NEW.provinsi_id AND ta.id = NEW.tahun_anggaran_id;

        IF v_prov_code IS NOT NULL AND v_tahun IS NOT NULL THEN
            UPDATE provincial_allocations
            SET alokasi = NEW.nominal_alokasi,
                diterima = NEW.realisasi_total,
                disalurkan = NEW.realisasi_total,
                updated_at = NOW()
            WHERE year = v_tahun AND provinsi_code = v_prov_code;

            UPDATE apbn_yearly_data
            SET total_budget = ROUND(((SELECT total_anggaran FROM tahun_anggaran WHERE id = NEW.tahun_anggaran_id)::numeric / 1e12), 2),
                updated_at = NOW()
            WHERE year = v_tahun;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alokasi_provinsi_update ON alokasi_provinsi;
CREATE TRIGGER trg_alokasi_provinsi_update
AFTER UPDATE OF nominal_alokasi ON alokasi_provinsi
FOR EACH ROW
EXECUTE FUNCTION trg_fn_alokasi_provinsi_update();

-- 4. Trigger on alokasi_kabupaten_kota (Bottom-Up Cascade)
CREATE OR REPLACE FUNCTION trg_fn_alokasi_kabupaten_kota_sync()
RETURNS TRIGGER AS $$
DECLARE
    v_ap_id TEXT;
    v_ta_id TEXT;
    v_tot_nominal BIGINT;
    v_tot_realisasi BIGINT;
    v_tot_selisih BIGINT;
    v_pct NUMERIC;
    v_tahun INT;
    v_prov_code VARCHAR;
    v_kab_code VARCHAR;
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    v_ap_id := NEW.alokasi_provinsi_id;

    SELECT 
        COALESCE(SUM(nominal_alokasi), 0),
        COALESCE(SUM(realisasi_total), 0)
    INTO v_tot_nominal, v_tot_realisasi
    FROM alokasi_kabupaten_kota
    WHERE alokasi_provinsi_id = v_ap_id;

    v_tot_selisih := v_tot_nominal - v_tot_realisasi;
    v_pct := CASE WHEN v_tot_nominal > 0 THEN ROUND((v_tot_realisasi::numeric / v_tot_nominal::numeric) * 100, 1) ELSE 0 END;

    UPDATE alokasi_provinsi
    SET nominal_alokasi = v_tot_nominal,
        realisasi_total = v_tot_realisasi,
        selisih = v_tot_selisih,
        persentase_penyerapan = v_pct,
        updated_at = TO_CHAR(NOW(), 'YYYY-MM-DD')
    WHERE id = v_ap_id
    RETURNING tahun_anggaran_id INTO v_ta_id;

    IF v_ta_id IS NOT NULL THEN
        UPDATE tahun_anggaran
        SET total_anggaran = (SELECT COALESCE(SUM(nominal_alokasi), 0) FROM alokasi_provinsi WHERE tahun_anggaran_id = v_ta_id)
        WHERE id = v_ta_id
        RETURNING tahun INTO v_tahun;

        SELECT kode_kabupaten_kota INTO v_kab_code FROM kabupaten_kota WHERE id = NEW.kabupaten_kota_id;
        IF v_kab_code IS NOT NULL AND v_tahun IS NOT NULL THEN
            UPDATE district_allocations
            SET alokasi = NEW.nominal_alokasi,
                diterima = NEW.realisasi_total,
                disalurkan = NEW.realisasi_total,
                updated_at = NOW()
            WHERE year = v_tahun AND kabkota_code = v_kab_code;
        END IF;

        SELECT p.kode_provinsi INTO v_prov_code 
        FROM alokasi_provinsi ap
        JOIN provinsi p ON p.id = ap.provinsi_id
        WHERE ap.id = v_ap_id;

        IF v_prov_code IS NOT NULL AND v_tahun IS NOT NULL THEN
            UPDATE provincial_allocations
            SET alokasi = v_tot_nominal,
                diterima = v_tot_realisasi,
                disalurkan = v_tot_realisasi,
                updated_at = NOW()
            WHERE year = v_tahun AND provinsi_code = v_prov_code;
        END IF;

        IF v_tahun IS NOT NULL THEN
            UPDATE apbn_yearly_data
            SET total_budget = ROUND(((SELECT total_anggaran FROM tahun_anggaran WHERE id = v_ta_id)::numeric / 1e12), 2),
                updated_at = NOW()
            WHERE year = v_tahun;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alokasi_kabupaten_kota_sync ON alokasi_kabupaten_kota;
CREATE TRIGGER trg_alokasi_kabupaten_kota_sync
AFTER UPDATE OF nominal_alokasi, realisasi_total ON alokasi_kabupaten_kota
FOR EACH ROW
EXECUTE FUNCTION trg_fn_alokasi_kabupaten_kota_sync();
