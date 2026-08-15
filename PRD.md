# 📋 Product Requirements Document (PRD)
## Integrated Blockchain - Sistem Transparansi & Tata Kelola Anggaran Pendidikan Indonesia

---

### 1. 📌 Executive Summary & Product Vision

**Integrated Blockchain Transparansi Anggaran Pendidikan** adalah platform terintegrasi multi-dashboard berskala nasional yang dirancang untuk mewujudkan transparansi penuh, akuntabilitas, dan efisiensi dalam tata kelola anggaran pendidikan di Indonesia.

Platform ini menghubungkan seluruh pemangku kepentingan mulai dari **Masyarakat Publik**, **Kementerian Keuangan/Pendidikan**, **Bank Penyalur**, **Auditor/BPK/Inspektorat**, hingga **Institusi Pendidikan (PAUD, SD, SMP, SMA, Universitas)** ke dalam satu sumber data tunggal (*Single Source of Truth*) dengan arsitektur database lokal berkinerja tinggi (*sub-100ms latency*).

---

### 2. 🎯 Problem Statement & Strategic Objectives

#### 2.1. Permasalahan Utama
1. **Asimetri Informasi**: Masyarakat kesulitan memverifikasi apakah alokasi dana pendidikan (APBN/APBD/CSR) benar-benar sampai dan dimanfaatkan sesuai kebutuhan sekolah.
2. **Fragmentasi Data**: Sistem pelaporan manual dan terisolasi antara kementerian, bank daerah, auditor, dan sekolah sering menyebabkan keterlambatan deteksi kebocoran anggaran.
3. **Ketergantungan Eksternal**: Ketergantungan pada *third-party cloud proprietary* dapat menimbulkan risiko *vendor lock-in*, biaya berlangganan tinggi, dan isu kedaulatan data keuangan negara.

#### 2.2. Sasaran Strategis Platform
- **Transparansi 100%**: Setiap rupiah dana pendidikan tahun anggaran 2026 dapat dilacak secara *real-time* dari level nasional hingga struk belanja sekolah.
- **Kemandirian Infrastruktur**: 100% berjalan pada *self-hosted* PostgreSQL 16 & PostgREST Proxy lokal tanpa dependensi cloud pihak ketiga.
- **Deteksi Dini & Integritas**: Mekanisme audit otomatis dan deteksi anomali untuk transaksi bernilai tinggi, duplikasi belanja, atau deviasi anggaran.

---

### 3. 👥 User Personas & Role-Based Access Control (RBAC)

| Peran Pengguna | Port Akses | Hak Akses & Tanggung Jawab Utama |
| :--- | :---: | :--- |
| **Publik / Masyarakat** | `2020` | Akses baca (*read-only*) seluruh data alokasi dana, riwayat penerimaan (APBN/APBD/CSR), grafik belanja, partisipasi apresiasi (bintang), dan forum diskusi warga. |
| **Kementerian / Pusat** | `2021` | Penetapan pagu nasional APBN, distribusi anggaran ke 38 Provinsi dan 514 Kabupaten/Kota, monitoring serapan nasional secara *cascading*. |
| **Bank Penyalur** | `2022` | Pencatatan nomor rekening resmi sekolah, mutasi rekening koran, pemrosesan *disbursement* dana, dan rekonsiliasi kas. |
| **Auditor / BPK / Inspektorat** | `2023` | Audit investigatif, verifikasi kelengkapan SPJ digital, validasi scan struk OCR, pencatatan temuan audit, dan pemantauan anomali belanja. |
| **Institusi Pendidikan** | `2024` | Input Rencana Anggaran Biaya (RAB), pencatatan transaksi belanja riil, upload struk/kuitansi digital, verifikasi mutasi kas sekolah. |

---

### 4. 🏗️ System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. DATA INGESTION & STORAGE                        │
│                                                                             │
│   PostgreSQL 16 Engine (:2025)                                              │
│   ├── 31 Public Tables (Master Anggaran, Wilayah, Transaksi, Audit)         │
│   └── Performance B-Tree Indexes & Cascading Foreign Keys                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ SQL Connection (Pool)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                          2. LOCAL API PROXY LAYER                           │
│                                                                             │
│   Node.js / Express PostgREST Proxy (:2026)                                 │
│   ├── Quote Normalization & Filter Parser (ilike, eq, in, or, order)        │
│   ├── Auto BigInt Cast & Precision Math Engine                              │
│   └── Sub-10ms Fast Response Gateway                                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / PostgREST Protocol
      ┌────────────────────────────────┼────────────────────────────────┐
      │                                │                                │
      ▼                                ▼                                ▼
┌──────────────┐             ┌───────────────────┐             ┌─────────────────┐
│ PORT 2020    │             │ PORT 2021 / 2022  │             │ PORT 2023 / 2024│
│ Transparansi │             │ Kementerian / Bank│             │ Auditor/Sekolah │
└──────────────┘             └───────────────────┘             └─────────────────┘
```

---

### 5. 📦 Functional Specifications by Module

#### 5.1. Modul Transparansi Publik (Port 2020)
- **School Dashboard Explorer (`/dashboard/[npsn]`)**:
  - Pencarian sekolah berdasarkan NPSN atau nama sekolah.
  - Ringkasan Dana: Total Diterima, Total Digunakan, Sisa Kas / Surplus, Persentase Serapan.
  - **Pembeda Riwayat Dana Masuk Terkategori**:
    1. *APBN (Pusat)*: Nomor referensi SP2D, tanggal masuk, nominal, subtotal.
    2. *APBD (Daerah)*: Alokasi BOSD/BOPD, tanggal masuk, nominal, subtotal.
    3. *CSR (Swasta)*: Program kemitraan literasi/sarpras, tanggal masuk, nominal, subtotal.
  - Grafik Donat Proporsi Belanja per Kategori (*Sarpras, Gaji, Operasional, Buku, Kegiatan*).
  - Grafik Batang Tren Pengeluaran 12 Bulan.
  - Rincian Transaksi Belanja Riil & E-Struk belanja dengan rincian barang, pajak (PPN/PPh), dan ongkos kirim.
  - Rencana Anggaran Biaya (RAB) Sekolah.
  - Forum Diskusi Publik & Sistem Apresiasi Bintang.

#### 5.2. Modul Kementerian (Port 2021)
- Penetapan APBN Pendidikan Nasional Tahun 2026.
- Hierarki Distribusi: Nasional ➔ 38 Provinsi ➔ 514 Kabupaten/Kota ➔ Satuan Pendidikan.
- Perhitungan penyerapan otomatis dan *cascading cascade triggers*.
- User Manager & Role Access.

#### 5.3. Modul Bank Penyalur (Port 2022)
- Integrasi Rekening Sekolah: Nomor Rekening Bank BPD/Buku 4 terdaftar.
- Pemantauan Saldo Kas Sekolah dan Mutasi Rekening Masuk/Keluar.
- User Manager terintegrasi database lokal.

#### 5.4. Modul Auditor (Port 2023)
- Pemantauan Anomali AI: Deteksi otomatis transaksi tunggal > Rp 20.000.000 atau indikasi ketidakwajaran.
- Verifikasi Dokumen SPJ Digital: Status *VERIFIED*, *UNDER_REVIEW*, atau *MISSING*.
- Forum Diskusi Audit Interaktif antara auditor dan pihak sekolah.
- Pencarian multi-parameter (NPSN, nama institusi, jenjang, wilayah).

#### 5.5. Modul Institusi Pendidikan (Port 2024)
- **Akun Aktif Standar**: `KB AL-IKHLAS` (NPSN: `69893669` - Samatiga, Aceh Barat).
- Pagu Anggaran 2026: **`Rp 234.775.639`** | Realisasi: **`Rp 197.211.537`** | Sisa Kas: **`Rp 37.564.102`**.
- Input Rencana Anggaran (RAB) & Manajemen Paket Proyek.
- Input Transaksi Pengeluaran & OCR Kuitansi Belanja.
- Rekening Korban & Mutasi Bank Terpadu.

---

### 6. ⚡ Non-Functional Requirements (NFR)

1. **Performance**:
   - Waktu respons query proxy API: `< 15ms`.
   - Waktu muat halaman Next.js (SSR/Client fetch): `< 100ms`.
   - Dukungan dataset sekolah: > 40.000 baris sekolah dengan pagination dan indexing efisien.
2. **Security & Privacy**:
   - Proteksi input data belanja dari injeksi SQL via parameter query terikat (*Prepared Statements*).
   - Penggunaan UUID sebagai primary key unik seluruh entitas transaksi.
   - Tidak ada data kredensial atau informasi rahasia yang terekspos di sisi publik.
3. **Availability & Resilience**:
   - Seluruh 7 port berjalan secara mandiri dan *fault-tolerant*.
   - Dukungan script otomatis `start-all.ps1` untuk orkestrasi seluruh layanan secara simultan.

---

### 7. 🗃️ Database Schema Summary (31 Tables)

- **Anggaran & Wilayah**: `tahun_anggaran`, `alokasi_provinsi`, `alokasi_kabupaten_kota`, `provinsi`, `kabupaten_kota`, `provinces`, `regencies`, `districts`, `province_school_stats`.
- **Satuan Pendidikan**: `institusi_pendidikan`, `schools`, `sumber_dana_institusi`, `pengeluaran_bulanan_institusi`, `rincian_pengeluaran_item`, `rencana_anggaran`.
- **Transaksi & Keuangan**: `incoming_funds`, `transactions`, `transaction_items`, `bank_accounts`, `bank_transactions`, `projects`, `project_expenses`, `project_photos`, `project_vendors`.
- **Audit & Gamifikasi**: `audit_anomaly`, `audit_logs`, `school_comments`, `school_likes`, `users`.

---

### 8. 📅 Timeline & Milestone 2026

- **Milestone 1**: Pembangunan & Migrasi Database Lokal PostgreSQL 16 (Port 2025). *(Selesai)*
- **Milestone 2**: Pembangunan Local PostgREST Proxy Server (Port 2026). *(Selesai)*
- **Milestone 3**: Standardisasi Seluruh Data Anggaran 2026 di 5 Dashboard. *(Selesai)*
- **Milestone 4**: Implementasi Integrasi Akun Sekolah KB AL-IKHLAS & Pemisahan Kategori Dana APBN/APBD/CSR. *(Selesai)*
- **Milestone 5**: Pengujian Performa, Dokumentasi Lengkap & Rilis GitHub. *(Selesai)*
