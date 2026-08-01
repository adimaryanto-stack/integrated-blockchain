# PRD — Dashboard Kementerian

**Version:** 1.4.1+ (Live PostgreSQL & PostgREST Database Integrated)  
**Date:** 1 Agustus 2026  
**Status:** ✅ PRODUCTION READY & LIVE DATABASE INTEGRATED  
**Project Type:** Web-Based Spreadsheet Dashboard — Education Budget Transparency  
**Backend Platform:** PostgreSQL Database (Port 2025) & PostgREST Proxy API (Port 2026)

---

## DAFTAR ISI

1. [Project Overview](#1-project-overview)
2. [Menu Structure](#2-menu-structure)
3. [Fitur per Menu](#3-fitur-per-menu)
4. [Database Schema (Logical)](#4-database-schema-logical)
5. [Tech Stack & Architecture](#5-tech-stack--architecture)
6. [MVP Roadmap (Mockup Evolution)](#6-mvp-roadmap-mockup-evolution)
7. [Success Metrics](#7-success-metrics)
8. [Deployment Plan](#8-deployment-plan)

---

## 1. Project Overview

### 1.1 Deskripsi Aplikasi
Dashboard Kementerian adalah aplikasi web berbasis **spreadsheet interface** untuk menampilkan, mengelola, dan mengaudit aliran dana pendidikan Indonesia dari tingkat nasional (APBN) hingga 367.865 institusi pendidikan di seluruh daerah. Tampilannya menyerupai Excel/Google Sheets dengan semua kalkulasi angka terhubung secara real-time presisi 100% antar menu dan tersimpan langsung ke PostgreSQL Database.

### 1.2 Target User & Role

| Role | Akses | Keterangan & Tugas Utama |
|------|-------|--------------------------|
| `SUPER_ADMIN` | Full access | Mengesahkan APBN, kelola pengguna, audit trail master, dan atur tugas peran |
| `ADMIN` | Create, Read, Update | Monitoring alokasi anggaran nasional & verifikasi realisasi daerah |
| `ADMIN_PROVINSI` | CRUD provinsinya | Terbatas pada wilayah provinsi & kabupaten/kota di bawahnya |
| `ADMIN_KABKOTA` | CRUD kabkotanya | Terbatas pada wilayah kabupaten/kota & institusi pendidikan lokal |
| `AUDITOR` | Read-only + Audit | Pemeriksaan independen, investigasi anomali, & audit trail real-time |
| `PUBLIC_RESEARCHER` | Read-only | Akses publik/akademisi untuk riset transparansi anggaran pendidikan |

### 1.3 Core Concept: Spreadsheet-Like Interface
- **Tampilan seperti Excel** — table rows & columns, sticky header & footer
- **Inline Editing & PostgreSQL Persist** — klik sel angka langsung edit, simpan otomatis ke PostgreSQL DB
- **Kalkulasi Real-Time & 2-Way Cascading** — `Selisih = Nominal − Realisasi`, `% = (Realisasi / Nominal) × 100` (Top-down & bottom-up)
- **Conditional Formatting** — badge warna: 🟢 ≥80%, 🟡 50–79%, 🔴 <50%
- **Exact DB Count Paginasi** — 100 sekolah per halaman dengan urutan A-Z (Provinsi ➔ Kab/Kota ➔ Institusi)
- **Authentic Audit Trail** — Log event asli tanpa hardcode/sample data
- **Export Excel** — download `.xlsx` dengan formula Excel tersimpan, bukan nilai statis

---

## 2. Menu Structure

```
📊 Dashboard (Main)
   └── Ringkasan nasional: Nominal, Realisasi, % + Chart

💰 APBN Pertahun
   └── Kelola tahun anggaran: DRAFT → ACTIVE → CLOSED

📍 Provinsi
   └── Spreadsheet 38 provinsi, inline editing

🏛️ Kabupaten / Kota
   └── Filter per provinsi, inline editing

🎓 Jenjang Pendidikan
   ├── Universitas
   ├── SMA
   ├── SMP
   ├── SD
   └── PAUD

👥 User Manager
   └── CRUD users + role assignment
```

---

## 3. Fitur per Menu

### 3.1 Dashboard
- **Metric Cards:** Total Nominal, Total Realisasi, % Penyerapan Nasional.
- **Tabel Ringkasan:** Penyerapan per jenjang pendidikan dengan progress bar.
- **Charts (Recharts):** 
  - Bar Chart: Nominal vs Realisasi per Jenjang.
  - Area Chart: Tren APBN Tahunan (2020–2026).
- **Global Filter:** Dropdown Tahun Anggaran di header global.

### 3.2 APBN Pertahun
- Mengelola tahun anggaran (`DRAFT`, `ACTIVE`, `CLOSED`).
- Hanya **1 tahun** boleh berstatus `ACTIVE` dalam satu waktu.
- Tahun yang berstatus `CLOSED` bersifat read-only untuk audit trail.

### 3.3 Provinsi
- Spreadsheet 38 provinsi dengan inline editing nominal alokasi dan realisasi.
- Download Excel dengan formula tersimpan.

### 3.4 Kabupaten / Kota
- Filter cascading per provinsi.
- Inline editing dan sinkronisasi ke data provinsi.

### 3.5 Jenjang Pendidikan (5 Sub-Menu)
- Komponen reusable untuk Universitas, SMA, SMP, SD, dan PAUD.
- Pencarian dan filter cascading: Provinsi → Kabupaten/Kota.
- Dukungan export bulk via template Excel.

### 3.6 User Manager
- CRUD user lengkap dengan assignment role & status aktif/nonaktif.

---

## 4. Database Schema (Logical)

Logical schema untuk representasi data relasional dalam aplikasi:

- **tahun_anggaran**: ID, tahun, total_anggaran, status (DRAFT, ACTIVE, CLOSED)
- **provinsi**: ID, kode_provinsi, nama_provinsi
- **alokasi_provinsi**: ID, tahun_anggaran_id, provinsi_id, nominal_alokasi, realisasi_total, selisih, persentase_penyerapan
- **kabupaten_kota**: ID, provinsi_id, kode_kabupaten_kota, nama_kabupaten_kota, tipe (KABUPATEN, KOTA)
- **alokasi_kabupaten_kota**: ID, alokasi_provinsi_id, kabupaten_kota_id, nominal_alokasi, realisasi_total, selisih, persentase_penyerapan
- **institusi_pendidikan**: ID, npsn, nama_institusi, jenjang, kabupaten_kota_id, nominal_alokasi, realisasi_total, selisih, persentase_penyerapan

---

## 5. Tech Stack & Architecture

- **Frontend Framework:** Next.js (App Router, Tailwind CSS, TypeScript)
- **State Management:** Zustand (untuk activeTahun global)
- **Charts:** Recharts
- **Excel Generation:** ExcelJS + file-saver

---

## 6. MVP Roadmap (Mockup Evolution)

### SPRINT 1: Setup & UI Foundation
- Konfigurasi Next.js 16 + Tailwind CSS v4.
- Implementasi sidebar, global header, dan kerangka halaman utama.
- Setup Zustand store untuk sinkronisasi pilihan tahun aktif.

### SPRINT 2: Dashboard & APBN Management
- Desain metric cards dan integrasi charts dengan Recharts.
- Halaman APBN per tahun dengan transisi status (`DRAFT` → `ACTIVE` → `CLOSED`).

### SPRINT 3: Spreadsheet Provinsi & Kab/Kota
- Halaman spreadsheet Provinsi dengan editable cells.
- Halaman spreadsheet Kabupaten/Kota dengan filter cascading per provinsi.
- Integrasi logic edit data lokal dalam memori.

### SPRINT 4: Jenjang Pendidikan & Export/Import
- Halaman detail jenjang pendidikan (Universitas, SMA, SMP, SD, PAUD) dengan pagination.
- Fungsionalitas Export Excel untuk data provinsi, kabupaten/kota, dan jenjang pendidikan.

### SPRINT 6: Integrasi Database PostgreSQL, 2-Way Cascading Sync & Authentic Audit Trail
- Integrasi penuh ke **PostgreSQL Database** (Port 2025) via **PostgREST Engine** (Port 2026).
- Sinkronisasi Anggaran 2-Arah Presisi 100% (*Top-down & Bottom-up*) antara APBN, 38 Provinsi, dan 514 Kabupaten/Kota.
- Paginasi Server-Side **100 sekolah per halaman** mencakup seluruh 367.865 institusi dengan 3-tier A-Z sorting (Provinsi ➔ Kab/Kota ➔ Institusi).
- Modul **Audit Trail Real-Time Murni** tanpa data sampel/dummy/hardcode dengan rekaman log kejadian asli persistent.

---

## 7. VPS Production Deployment Plan

1. **Database Tier**: PostgreSQL Database Server (Port 5432 / 2025).
2. **API Proxy Tier**: PostgREST Standalone Binary Service (Port 2026).
3. **Application Tier**: Next.js 16 Production Build dist via PM2 Process Manager (Port 2021).
4. **Web Server Tier**: Nginx Reverse Proxy dengan TLS/SSL (Certbot Let's Encrypt).
5. **Panduan Lengkap**: Lihat petunjuk perintah terminal lengkap di berkas [`README.md`](./README.md#🌐-panduan-deployment-ke-server-vps-production).
