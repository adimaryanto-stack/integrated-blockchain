# 📋 Product Requirements Document (PRD)
## Integrated Blockchain - Sistem Transparansi & Tata Kelola Anggaran Pendidikan Indonesia

---

### 1. 📌 Executive Summary & Product Vision

**Integrated Blockchain Transparansi Anggaran Pendidikan** adalah platform terintegrasi multi-dashboard berskala nasional yang dirancang untuk mewujudkan transparansi penuh, akuntabilitas, dan efisiensi dalam tata kelola anggaran pendidikan di Indonesia.

Platform ini menghubungkan seluruh pemangku kepentingan mulai dari **Masyarakat Publik**, **Kementerian Keuangan/Pendidikan**, **Pemerintah Daerah (APBD Provinsi)**, **Bank Penyalur**, **Auditor/BPK/Inspektorat**, hingga **Institusi Pendidikan (PAUD, SD, SMP, SMA, Universitas)** ke dalam satu sumber data tunggal (*Single Source of Truth*) dengan arsitektur database lokal berkinerja tinggi (*sub-100ms latency*).

---

### 2. 🎯 Problem Statement & Strategic Objectives

#### 2.1. Permasalahan Utama
1. **Asimetri Informasi**: Masyarakat kesulitan memverifikasi apakah alokasi dana pendidikan (APBN/APBD/CSR) benar-benar sampai dan dimanfaatkan sesuai kebutuhan sekolah.
2. **Fragmentasi Data**: Sistem pelaporan manual dan terisolasi antara kementerian, bank daerah, auditor, dan sekolah sering menyebabkan keterlambatan deteksi kebocoran anggaran.
3. **Kepatuhan Mandatori 20%**: Kesulitan memantau kepatuhan pemenuhan alokasi 20% anggaran pendidikan pada APBD tingkat provinsi/kabupaten secara transparan.

#### 2.2. Sasaran Strategis Platform
- **Transparansi 100%**: Setiap rupiah dana pendidikan tahun anggaran 2026 dapat dilacak secara *real-time* dari level nasional hingga struk belanja sekolah.
- **Kemandirian Infrastruktur**: 100% berjalan pada *self-hosted* PostgreSQL 16 & PostgREST Proxy lokal tanpa dependensi cloud pihak ketiga.
- **Deteksi Dini & Integritas**: Mekanisme audit otomatis dan deteksi anomali untuk transaksi bernilai tinggi, duplikasi belanja, atau deviasi anggaran.

---

### 3. 👥 User Personas & Role-Based Access Control (RBAC)

| Peran Pengguna | Port Akses | Hak Akses & Tanggung Jawab Utama |
| :--- | :---: | :--- |
| **Publik (Civic-Tech Vite)** | `2019` | Portal visualisasi data publik modern berbasis Vite dengan storytelling interaktif, visualisasi Sankey aliran dana, dan peta regional. |
| **Publik / Masyarakat (Next.js)** | `2020` | Akses baca (*read-only*) seluruh data alokasi dana, riwayat penerimaan (APBN/APBD/CSR), grafik belanja, partisipasi apresiasi, dan aduan warga. |
| **Kementerian / Pusat** | `2021` | Penetapan pagu nasional APBN, distribusi anggaran ke 38 Provinsi dan 514 Kabupaten/Kota, monitoring serapan nasional secara *cascading*. |
| **Bank Penyalur** | `2022` | Pencatatan nomor rekening resmi sekolah, mutasi rekening koran, pemrosesan *disbursement* dana, dan rekonsiliasi kas. |
| **Auditor / BPK / Inspektorat** | `2023` | Audit investigatif, verifikasi kelengkapan SPJ digital, validasi scan struk OCR, pencatatan temuan audit, dan pemantauan anomali belanja. |
| **Institusi Pendidikan** | `2024` | Input Rencana Anggaran Biaya (RAB), pencatatan transaksi belanja riil, upload struk/kuitansi digital, verifikasi mutasi kas sekolah. |
| **Pemerintah Daerah (APBD)** | `2025` | Pemantauan pemenuhan mandatori 20% APBD, distribusi anggaran ke 15 Kab/Kota & 11.354 sekolah di provinsi, pelaporan daerah. |
| **Super-Admin Console** | `2026` | Manajemen akun pengguna lintas kementerian/bank/sekolah, security audit logs, monitoring anomali nasional. |

---

### 4. 🏗️ System Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. DATA INGESTION & STORAGE                        │
│                                                                             │
│   PostgreSQL 16 Engine (:2027)                                              │
│   ├── 35 Public Tables (Master Anggaran, Wilayah, Transaksi, Audit, APBD)   │
│   └── Performance B-Tree Indexes & Cascading Foreign Keys                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ SQL Connection (Pool)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                          2. LOCAL API PROXY LAYER                           │
│                                                                             │
│   Node.js / Express PostgREST Proxy (:2028)                                 │
│   ├── Quote Normalization & Filter Parser (ilike, eq, in, or, order)        │
│   ├── Auto BigInt Cast & Precision Math Engine                              │
│   └── Sub-10ms Fast Response Gateway                                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / PostgREST Protocol
       ┌───────────────────────────────┼───────────────────────────────┐
       │                               │                               │
       ▼                               ▼                               ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│ Port 2019: Civic-Tech│   │  Port 2020: Publik   │   │  Port 2021: Kemenkeu │
│ Portal Redesign Vite │   │  Transparansi Warga  │   │  Distribusi Nasional │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
       │                               │                               │
       ▼                               ▼                               ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│   Port 2022: Bank    │   │  Port 2023: Auditor  │   │ Port 2024: Sekolah   │
│ Rekening & Penyaluran│   │  Deteksi Anomali AI  │   │ Belanja & SPJ Digital│
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
       │                               │
       ▼                               ▼
┌──────────────────────┐   ┌──────────────────────┐
│ Port 2025: APBD Prov │   │ Port 2026: Admin     │
│ Mandat 20% Daerah    │   │ Super-Admin Console  │
└──────────────────────┘   └──────────────────────┘
```

---

### 5. 📊 Aturan Multi-Tahun (Selektor Tahun Anggaran)

Seluruh dasbor menerapkan aturan seleksi tahun:
1. **Tahun 2026 (Aktif Berjalan)**:
   - Menampilkan angka alokasi, realisasi, dan penyerapan riil sesuai data PostgreSQL.
2. **Tahun 2027 (Anggaran Baru Belum Dialokasikan)**:
   - Alokasi Baru = Rp 0
   - Realisasi Belanja = Rp 0 (0.0% penyerapan)
   - Saldo Kas di Bank = Carry-Forward sisa saldo kas tahun 2026.
