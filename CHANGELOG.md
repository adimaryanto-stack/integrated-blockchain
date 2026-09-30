# 📝 Changelog & Riwayat Pembaruan Kode

Semua perubahan penting pada proyek **Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia** didokumentasikan di berkas ini.

Format pencatatan berpedoman pada [Keep a Changelog](https://keepachangelog.com/id-ID/1.0.0/) dan menganut prinsip [Semantic Versioning](https://semver.org/lang/id/).

---

## [2.4.1] - 2026-09-30

### 🔒 Keamanan & Kebijakan Lisensi (Security & Licensing)
- **Pembaruan Lisensi Menjadi Terbatas (Restricted Private Use Only)**:
  - Mengubah lisensi proyek dari open source MIT menjadi **Restricted Private Use License**.
  - **Permissions yang Diberikan**: Dibatasi hanya untuk **Private use** (penggunaan pribadi, evaluasi mandiri, inspeksi kode, pengujian lokal, dan riset non-komersial).
  - **Limitations & Restrictions**: Dilarang keras untuk penggunaan komersial (*commercial use*), distribusi ulang (*distribution/mirroring*), publikasi karya turunan (*modification for redistribution*), serta sublisensi tanpa izin tertulis dari pemilik hak cipta (`adimaryanto`).
  - Pembaruan berkas `LICENSE`, badge lisensi di `README.md`, dan seluruh dokumentasi pendukung.

---

## [2.4.0] - 2026-09-29

> **Pembaruan Terkini (Latest Update)**: Otomasi visualisasi tren tahunan dari basis data riil (Port 2021–2025), integrasi penuh peta regional Portal Civic-Tech (Port 2019), optimasi performa proxy database, dan standarisasi dokumentasi ekosistem.

### ✨ Ditambahkan (Added)
- **Visualisasi Titik Koordinat Dinamis (Recharts Area Dots)**:
  - Menambahkan atribut visual `dot={{ r: 4 }}` dan `activeDot={{ r: 6 }}` pada seluruh komponen `<Area>` di:
    - **Port 2021**: Dashboard Kementerian (`Nominal` & `Realisasi`).
    - **Port 2022**: Dashboard Bank Penyalur (`Alokasi APBN` & `Dana Tersalurkan`).
    - **Port 2023**: Dashboard Auditor BPK (`Alokasi APBN` & `Realisasi Belanja`).
    - **Port 2024**: Dashboard Institusi Pendidikan (`Anggaran Alokasi` & `Realisasi Belanja`).
    - **Port 2025**: Dashboard APBD Provinsi Lampung (`Total APBD`, `Alokasi Pendidikan`, & `Batas Wajib 20%`).
  - Memastikan grafik tampak jelas, terbaca, dan interaktif bahkan ketika hanya terdapat 1 atau 2 titik tahun pada basis data.
- **Kalkulasi Rentang Tahun Otomatis (`${minYear}–${maxYear}`)**:
  - Menggantikan judul-judul statis dengan memo kalkulasi dinamis berdasarkan tahun terkecil dan terbesar yang tersimpan di PostgreSQL.
  - Menghasilkan judul otomatis seperti `Tren APBN Pendidikan 2026–2027`, `Tren Penyaluran Dana Pendidikan 2026–2027`, dan `Proporsi APBD Pendidikan Lampung (2026–2027)`.
- **Integrasi Data Peta Regional Port 2019 (Civic-Tech Vite)**:
  - Sinkronisasi pewarnaan choropleth peta dan chip navigasi 38 provinsi menggunakan data `province_school_stats` dan `provincial_allocations`.
  - Penambahan parameter navigasi ganda (`province-detail.html?code=...&name=...`) agar tautan eksplorasi provinsi selalu tepat sasaran.
- **Skrip Utilitas Pemeliharaan**:
  - `scripts/clean-cache.js`: Otomasi pembersihan folder `.next` di seluruh aplikasi dashboard untuk menjamin *clean build state*.
  - `scripts/check_all_ports.js`: Verifikasi kesehatan terpadu 10 port (2019 s.d. 2028) dengan pengukuran latensi milidetik dan ukuran payload.
- **Dokumentasi Modul Baru**:
  - `apps/dashboard-publik/README.md`: Panduan teknis dan operasional untuk Portal Civic-Tech Redesign (Port 2019).

### 🔄 Diubah (Changed)
- **Penghapusan Filter DRAFT Statis**:
  - Menghapus filter `.filter(t => t.status !== 'DRAFT')` dan `.neq('status', 'DRAFT')` pada seluruh layer data kueri tahunan.
  - Semua tahun yang terdaftar di tabel `tahun_anggaran` (baik status `ACTIVE` maupun `DRAFT`) kini langsung ditampilkan secara transparan di antarmuka pengguna.
- **Standarisasi Akuntansi Multi-Tahun (Rule 2027)**:
  - Tahun 2026: Menggunakan data alokasi dan realisasi belanja berjalan.
  - Tahun 2027: Anggaran berstatus baru/draft memiliki realisasi belanja awal **`Rp 0`** (0% penyerapan), dengan sisa saldo kas tahun sebelumnya otomatis dialirkan sebagai *carry-forward*.
- **Akselerasi Proxy REST API (Port 2028)**:
  - Mengarahkan endpoint RPC `/rest/v1/rpc/get_all_province_stats` langsung ke tabel `public.province_school_stats` untuk memangkas *query execution time* dari >120ms menjadi <10ms.
- **Penyelarasan Skrip Peluncur `start-all.bat` & `start-all.ps1`**:
  - Menambahkan peluncuran Port 2019 (Portal Civic-Tech) secara berurutan bersama 9 port lainnya dengan mekanisme *warm-up compilation*.

### 🐛 Diperbaiki (Fixed)
- Memperbaiki judul hardcode `"Tren APBN Pendidikan 2020–2026"` pada `apps/dashboard-kementerian/app/dashboard/page.tsx` yang sebelumnya mengabaikan tahun-tahun baru yang diinput ke basis data.
- Memperbaiki area chart di Port 2024 (`dashboard-institusi-pendidikan`) yang sebelumnya menggunakan array statis `yearlyData` di state komponen.
- Memperbaiki referensi port lama di dokumentasi internal (`Port 2025` untuk DB dan `Port 2026` untuk Proxy) menjadi standar yang berlaku: **Port 2027 (PostgreSQL)** dan **Port 2028 (Proxy REST API Gateway)**.
- Menyelaraskan margin kontainer CSS dan padding pada 6 halaman publik Port 2020 (`/audit`, `/provinces`, `/statistics`, `/reporting`, `/about`, dan `/faq`) agar sejajar 100% dengan halaman `/aliran-dana`.

---

## [2.3.0] - 2026-09-28

### ✨ Ditambahkan
- Integrasi **Port 2019** sebagai portal publik alternatif (*Civic-Tech Redesign*) berbasis Vite dan Vanilla ES Modules.
- Penambahan trigger otomatis `trg_cascade_delete_tahun_anggaran` pada basis data PostgreSQL untuk menjamin integritas relasional saat data tahun anggaran dihapus.
- Implementasi indikator status koneksi real-time (*Live DB Health & Latency Monitor*) di header seluruh dashboard kementerian, bank, auditor, sekolah, dan pemda.

### 🔄 Diubah
- Pembersihan total array statis tahun historis (2020–2025) pada seluruh lapisan data, beralih 100% ke *single source of truth* tabel `tahun_anggaran`.

---

## [2.2.0] - 2026-09-27

### ✨ Ditambahkan
- Pengujian multi-tahun 2026 (aktif) dan 2027 (draft alokasi baru).
- Formula penyerapan dinamis: kalkulasi realisasi otomatis berdasarkan pencatatan transaksi belanja kas sekolah.

---

## [2.1.0] - 2026-08-20

### ✨ Ditambahkan
- **Dashboard Admin Super-Console (Port 2026)**:
  - Autentikasi 2-faktor (MFA TOTP) dan pemilih peran cepat (*Quick Demo Role Switcher*).
  - Pengelolaan pengguna berjenjang (*Hierarki RBAC 4-Level*): Kementerian &rarr; Jenjang &rarr; Provinsi &rarr; Kabupaten &rarr; Sekolah.
  - Modul pengawasan anomali kecerdasan buatan (*AI-FAA Management Console*).
  - Mutasi rekening bank agregasi Himbara dan audit log permanen (*immutable diff viewer*).

---

## [2.0.0] - 2026-08-16

### 🚀 Perubahan Besar (Major Migration)
- **100% Self-Hosted & Bebas Ketergantungan Cloud**:
  - Migrasi seluruh sistem dari Supabase Cloud ke instans lokal **PostgreSQL 16 (Port 2027)**.
  - Pembangunan **Node.js Express Proxy REST API Gateway (Port 2028)** yang mengemulasikan spesifikasi PostgREST secara mandiri.
  - Seluruh 8 dashboard aplikasi diintegrasikan melalui koneksi lokal mandiri tanpa memerlukan akun atau token cloud eksternal.

---

## [1.0.0] - 2026-08-01

### 🎉 Rilis Awal (Initial Release)
- Peluncuran arsitektur dasar platform tata kelola transparansi keuangan pendidikan Indonesia:
  - Portal Transparansi Publik (Port 2020).
  - Dashboard Kementerian Pendidikan (Port 2021).
  - Dashboard Bank Penyalur (Port 2022).
  - Dashboard Auditor BPK (Port 2023).
  - Dashboard Institusi Pendidikan (Port 2024).
  - Dashboard APBD Provinsi Lampung (Port 2025).
- Model data relasional untuk 38 provinsi, 514 kabupaten/kota, dan satuan pendidikan lintas jenjang.
