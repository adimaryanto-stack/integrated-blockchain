-- ============================================================
-- PERFORMANCE INDEXES — institusi_pendidikan (367K rows)
-- ============================================================

-- Index utama: filter jenjang (dipakai di semua halaman jenjang)
CREATE INDEX IF NOT EXISTS idx_ip_jenjang 
  ON public.institusi_pendidikan (jenjang);

-- Index sort: jenjang + provinsi + kabkota + nama (query ORDER BY utama)
CREATE INDEX IF NOT EXISTS idx_ip_jenjang_prov_kab_nama 
  ON public.institusi_pendidikan (jenjang, provinsi_nama, kabupaten_kota_nama, nama_institusi);

-- Index filter provinsi
CREATE INDEX IF NOT EXISTS idx_ip_provinsi_nama 
  ON public.institusi_pendidikan (provinsi_nama);

CREATE INDEX IF NOT EXISTS idx_ip_provinsi_id
  ON public.institusi_pendidikan (provinsi_id);

-- Index filter kabupaten/kota
CREATE INDEX IF NOT EXISTS idx_ip_kabkota_nama 
  ON public.institusi_pendidikan (kabupaten_kota_nama);

CREATE INDEX IF NOT EXISTS idx_ip_kabkota_id 
  ON public.institusi_pendidikan (kabupaten_kota_id);

-- Index search nama institusi (ILIKE prefix)
CREATE INDEX IF NOT EXISTS idx_ip_nama_institusi 
  ON public.institusi_pendidikan (nama_institusi);

-- Index status sekolah
CREATE INDEX IF NOT EXISTS idx_ip_status_sekolah 
  ON public.institusi_pendidikan (status_sekolah);

-- ============================================================
-- PERFORMANCE INDEXES — alokasi_kabupaten_kota
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_akk_kabkota_id 
  ON public.alokasi_kabupaten_kota (kabupaten_kota_id);

CREATE INDEX IF NOT EXISTS idx_akk_alokasi_provinsi_id 
  ON public.alokasi_kabupaten_kota (alokasi_provinsi_id);

-- ============================================================
-- PERFORMANCE INDEXES — alokasi_provinsi
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ap_provinsi_id 
  ON public.alokasi_provinsi (provinsi_id);

CREATE INDEX IF NOT EXISTS idx_ap_tahun_anggaran_id 
  ON public.alokasi_provinsi (tahun_anggaran_id);

-- ============================================================
-- PERFORMANCE INDEXES — kabupaten_kota
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_kk_provinsi_id 
  ON public.kabupaten_kota (provinsi_id);

CREATE INDEX IF NOT EXISTS idx_kk_nama 
  ON public.kabupaten_kota (nama_kabupaten_kota);

-- ============================================================
-- ANALYZE — refresh query planner statistics
-- ============================================================

ANALYZE public.institusi_pendidikan;
ANALYZE public.alokasi_provinsi;
ANALYZE public.alokasi_kabupaten_kota;
ANALYZE public.kabupaten_kota;

SELECT 'Indexes created and statistics updated.' AS result;
