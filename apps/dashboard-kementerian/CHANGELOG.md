# Changelog — Dashboard Kementerian

Semua perubahan penting pada proyek **Dashboard Kementerian** akan didokumentasikan di file ini. Format berkas ini mengacu pada [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dan mematuhi penomoran [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.5.0] - 01-08-2026

### Ditambahkan
- **Integrasi Database PostgreSQL & PostgREST**: Terhubung langsung ke **PostgreSQL Database** (Port 2025) via proxy API **PostgREST** (Port 2026) untuk sinkronisasi data APBN, 38 Provinsi, 514 Kab/Kota, 367.865 Institusi Pendidikan, dan pengguna.
- **Kalkulasi & Sinkronisasi Presisi 2-Arah (2-Way Cascading Sync)**:
  - *Top-Down Cascading*: Perubahan nominal alokasi provinsi otomatis mendistribusikan ulang secara proporsional ke 514 kabupaten/kota di PostgreSQL DB.
  - *Bottom-Up Cascading*: Perubahan nominal di tingkat kabupaten/kota otomatis mengkalkulasi ulang alokasi provinsi dan total APBN nasional.
  - Penyelarasan nominal APBN 2026 menjadi **Rp 769.100.000.000.000 (769,1 Triliun)** dengan selisih 0 rupiah di seluruh hirarki DB.
- **Matriks Pengaturan Peran & Pembagian Tugas (RBAC Matrix)**:
  - Ditambahkan Tab Navigasi *Pengaturan Peran & Pembagian Tugas (RBAC Matrix)* pada menu **User Manager** (`/dashboard/users`).
  - Fitur pengeditan deskripsi dan daftar tugas utama per peran khusus Super Admin dengan pencatatan audit log otomatis.
- **Audit Trail Real-Time Murni**:
  - Penghapusan total data dummy/sample `INITIAL_AUDIT_LOGS`.
  - Perekaman histori log asli real-time mencakup user aktif, role, nama entitas, nilai lama ➔ nilai baru, dan timestamp dengan penyimpanan persistent.
- **Paginasi Server-Side 100 Sekolah & Pengurutan A-Z**:
  - Mengimplementasikan paginasi 100 sekolah per halaman langsung dari PostgreSQL DB menggunakan header `Prefer: count=exact`.
  - Pengurutan presisi 3 tingkat: Provinsi A-Z ➔ Kab/Kota A-Z ➔ Nama Institusi A-Z.

### Diubah
- **Pembaruan Role Viewer ➔ Public Researcher**:
  - Mengubah kode peran `VIEWER` menjadi **`PUBLIC_RESEARCHER`** (*Public Researcher*) pada tipe TypeScript, UI badge warna emerald, dan database PostgreSQL.
- Memperbarui versi aplikasi di `package.json` dan footer header menjadi **`Dashboard Kementerian v1.5.0`**.

---

## [1.4.1] - 24-06-2026

### Diubah
- Menyelaraskan seluruh dokumen roadmap dan file konfigurasi ke versi **1.4.1**.
- Menambahkan dokumentasi **Sprint 5 (User Manager & RBAC)** ke dalam peta jalan MVP di berkas `PRD.md`.
- Memperbarui label footer notifikasi pada komponen header aplikasi agar konsisten menampilkan `"Dashboard Kementerian v1.4.1"`.

## [1.4.0] - 24-06-2026

### Ditambahkan
- Ditambahkan menu **User Manager** lengkap dengan data mock user yang komprehensif, fitur CRUD (Tambah/Edit/Hapus), dan status aktif/nonaktif.
- Ditambahkan mekanisme **Role-Based Access Control (RBAC)** untuk membatasi interaksi (seperti inline spreadsheet editing) bagi pengguna dengan peran `VIEWER` atau `AUDITOR`, atau admin dengan cakupan wilayah berbeda.
- Ditambahkan visualisasi grafik tren pengeluaran bulanan dan alokasi per sumber dana di menu **Profil Institusi**.
- Ditambahkan screenshot fungsionalitas aplikasi di localhost (Port 3009) yang dirujuk ke dalam `README.md`.
- Ditambahkan file target roadmap/checklist minimal layak produk [`MVP.md`](./MVP.md) ke struktur project.

### Diubah
- Mengubah nama project resmi dan seluruh referensi dokumen menjadi **Dashboard Kementerian**.
- Memperbaiki pengurutan pengeluaran bulanan (berdasarkan nomor bulan 1-12).
- Meningkatkan fitur pencarian header agar berfungsi penuh dengan pencarian nama sekolah/institusi secara instan dan redirect langsung ke profil sekolah.
- Menyesuaikan penomoran versi di `package.json` menjadi `1.4.0`.

---

## [1.3.0] - 13-06-2026

### Ditambahkan
- Ditambahkan tombol **Deploy with Vercel** di berkas `README.md`.
- Ditambahkan konfigurasi `vercel.json` untuk optimasi pembangunan web Next.js di platform Vercel.

### Diubah
- Membersihkan referensi data InsForge dan menghapus file konfigurasi `.insforge/` agar demo dapat berjalan 100% independen sebagai client-side mockup statis.
- Mengembalikan data mock APBN, Provinsi, Kab/Kota, dan data Sekolah secara lengkap pada layer `lib/data/index.ts`.

---

## [1.0.0] - 13-05-2026

### Ditambahkan
- Rilis inisial Dashboard Anggaran Pendidikan Indonesia dengan antarmuka spreadsheet interaktif (inline editing, cascade update, dan export Excel menggunakan ExcelJS).
