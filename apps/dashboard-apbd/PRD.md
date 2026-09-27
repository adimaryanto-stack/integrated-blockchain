# 📋 Product Requirements Document (PRD): Dashboard APBD Provinsi Lampung

## 1. Pendahuluan

Dashboard APBD Provinsi Lampung merupakan platform digital terpadu untuk monitoring, penetapan alokasi, dan audit kepatuhan alokasi 20% anggaran pendidikan tingkat provinsi sesuai amanat Pasal 31 ayat 4 UUD 1945.

Platform ini terintegrasi langsung dalam ekosistem Blockchain Transparansi Anggaran Republik Indonesia, menjamin sinkronisasi data antara APBN Kementerian, Bank Penyalur, Auditor Negara, dan Institusi Pendidikan.

---

## 2. Peta Port & Topologi Ekosistem

| Port | Komponen | Deskripsi |
|---|---|---|
| **Port 2020** | Portal Transparansi Publik | Akses publik untuk melihat aliran anggaran dan data sekolah |
| **Port 2021** | Dashboard Kementerian | Pagu APBN Nasional & distribusi 38 provinsi |
| **Port 2022** | Dashboard Bank | Rekening Escrow, Giro Penyaluran, & status mutasi |
| **Port 2023** | Dashboard Auditor | Audit SPJ, OCR struk belanja, deteksi anomali pajak |
| **Port 2024** | Dashboard Institusi Pendidikan | Dashboard sekolah penerima (RAB, Belanja, Kas Bank) |
| **Port 2025** | **Dashboard APBD Provinsi** | **Monitoring Kepatuhan 20% & APBD Daerah Lampung** |
| **Port 2026** | Dashboard Admin | Konsol Super-Admin & manajemen platform |
| **Port 2027** | Database PostgreSQL Lokal | Single source of truth (35 Tabel Publik) |
| **Port 2028** | Proxy API Server (PostgREST) | RESTful API gateway ke database PostgreSQL |

---

## 3. Spesifikasi Fungsional

### 3.1 Selektor Tahun & Logika Anggaran
- **Tahun Aktif 2026**:
  - Total APBD: Rp 8.240.000.000.000 (Rp 8,24 Triliun)
  - Batas Minimal 20%: Rp 1.648.000.000.000 (Rp 1,65 Triliun)
  - Alokasi Pendidikan Riil: Rp 1.750.000.000.000 (Rp 1,75 Triliun - 21,24%)
  - Realisasi Belanja: Rp 1.420.000.000.000 (Rp 1,42 Triliun)
  - Sisa Saldo Kas di Bank 2026: Rp 330.000.000.000 (Rp 330 Miliar)
- **Tahun 2027 (Anggaran Belum Dialokasikan)**:
  - Total Alokasi APBD Baru: Rp 0
  - Realisasi Belanja: Rp 0 (0.0% penyerapan)
  - Saldo Kas di Bank: Rp 330.000.000.000 (Carry-Forward sisa saldo kas tahun 2026)
  - Distribusi Jenjang & 15 Kab/Kota: Rp 0

### 3.2 Modul-Modul Utama
1. **Executive Dashboard (`/dashboard`)**: Metrik kepatuhan 20%, ringkasan jenjang, grafik multi-tahun.
2. **APBD Pertahun (`/dashboard/apbd`)**: Tabel historis tahun anggaran, status lock, input modal.
3. **Spreadsheet Kabupaten / Kota (`/dashboard/kabupaten-kota`)**: Spreadsheet 15 daerah di Lampung, inline edit, export Excel.
4. **Jenjang Pendidikan (`/dashboard/jenjang/[jenjang]`)**: Detail sekolah per jenjang (Universitas, SMA, SMP, SD, PAUD).
5. **Profil Institusi (`/dashboard/profil-institusi`)**: Rincian sekolah, 3 sumber dana (APBD, APBN, CSR), saldo bank.
6. **User Manager (`/dashboard/users`)**: Manajemen role dan hak akses.

---

## 4. Keamanan & Kepatuhan Database
- Menggunakan database lokal PostgreSQL tanpa ketergantungan mock/sample statis.
- Audit logging otomatis untuk setiap perubahan nilai pagu anggaran (`apbd_input_log`).
- RLS dan role-based access control pada setiap level pengguna.
