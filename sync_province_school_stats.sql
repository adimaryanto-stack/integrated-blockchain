-- Create table for aggregated province school statistics
CREATE TABLE IF NOT EXISTS province_school_stats (
    province_id text PRIMARY KEY,
    province_code text,
    province_name text,
    total_schools integer DEFAULT 0,
    paud integer DEFAULT 0,
    sd integer DEFAULT 0,
    smp integer DEFAULT 0,
    sma integer DEFAULT 0,
    univ integer DEFAULT 0,
    updated_at timestamptz DEFAULT now()
);

-- Populate/sync with exact counts from schools and regencies tables
INSERT INTO province_school_stats (province_id, province_code, province_name, total_schools, paud, sd, smp, sma, univ, updated_at)
SELECT 
    p.id as province_id,
    p.code as province_code,
    p.name as province_name,
    COUNT(s.id)::integer as total_schools,
    COUNT(CASE WHEN s.name ILIKE '%paud%' OR s.name ILIKE '%tk%' OR s.name ILIKE '%kb%' OR s.name ILIKE '%tpa%' OR s.name ILIKE '%sps%' THEN 1 END)::integer as paud,
    COUNT(CASE WHEN s.name ILIKE '%sd%' OR s.name ILIKE '%sdn%' OR s.name ILIKE '%sds%' OR s.name ILIKE '%mi%' OR s.name ILIKE '%min%' OR s.name ILIKE '%mis%' THEN 1 END)::integer as sd,
    COUNT(CASE WHEN s.name ILIKE '%smp%' OR s.name ILIKE '%smpn%' OR s.name ILIKE '%smps%' OR s.name ILIKE '%mts%' OR s.name ILIKE '%mtsn%' OR s.name ILIKE '%mtss%' THEN 1 END)::integer as smp,
    COUNT(CASE WHEN s.name ILIKE '%sma%' OR s.name ILIKE '%sman%' OR s.name ILIKE '%smas%' OR s.name ILIKE '%smk%' OR s.name ILIKE '%smkn%' OR s.name ILIKE '%smks%' OR s.name ILIKE '%ma%' OR s.name ILIKE '%man%' OR s.name ILIKE '%mas%' THEN 1 END)::integer as sma,
    COUNT(CASE WHEN s.name ILIKE '%universitas%' OR s.name ILIKE '%institut%' OR s.name ILIKE '%politeknik%' OR s.name ILIKE '%akademi%' OR s.name ILIKE '%sekolah tinggi%' THEN 1 END)::integer as univ,
    now()
FROM provinces p
LEFT JOIN regencies r ON r.province_id = p.id
LEFT JOIN schools s ON s.regency_id = r.id
GROUP BY p.id, p.code, p.name
ON CONFLICT (province_id) DO UPDATE SET
    province_code = EXCLUDED.province_code,
    province_name = EXCLUDED.province_name,
    total_schools = EXCLUDED.total_schools,
    paud = EXCLUDED.paud,
    sd = EXCLUDED.sd,
    smp = EXCLUDED.smp,
    sma = EXCLUDED.sma,
    univ = EXCLUDED.univ,
    updated_at = now();

SELECT province_id, province_code, province_name, total_schools, paud, sd, smp, sma, univ FROM province_school_stats ORDER BY province_id LIMIT 10;
