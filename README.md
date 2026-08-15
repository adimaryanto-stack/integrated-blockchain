# 🏛️ Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sistem dasbor terintegrasi multi-peran berbasis *Single Source of Truth* untuk transparansi dan tata kelola anggaran pendidikan Indonesia. Menghubungkan seluruh jenjang pendidikan (**PAUD, SD, SMP, SMA, dan Universitas**) di 38 Provinsi dan 514 Kabupaten/Kota ke dalam satu basis data lokal berkinerja tinggi (*sub-100ms latency*).

---

## 📌 Daftar Isi
- [Arsitektur & Topologi Sistem](#-arsitektur--topologi-sistem)
- [Port Mapping & Layanan (7 Ports)](#-port-mapping--layanan-7-ports)
- [Fitur Utama Berdasarkan Peran](#-fitur-utama-berdasarkan-peran)
- [Galeri Tampilan Halaman (Screenshots & Kode)](#-galeri-tampilan-halaman-screenshots--kode)
- [Panduan Instalasi Cepat](#-panduan-instalasi-cepat)
- [Dokumentasi API REST PostgREST](#-dokumentasi-api-rest-postgrest)
- [Struktur Direktori Proyek](#-struktur-direktori-proyek)
- [Dokumentasi Terkait](#-dokumentasi-terkait)

---

## 🏗️ Arsitektur & Topologi Sistem

Platform ini dibangun dengan arsitektur modular yang memisahkan lapisan presentasi, integrasi API, dan persistensi data:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. DATA PERSISTENCE LAYER                          │
│                                                                             │
│   PostgreSQL 16 Engine (:2025)                                              │
│   └── 31 Public Tables (Master Anggaran, Wilayah, Transaksi, Audit)         │
│   └── Performance B-Tree Indexes & Cascading Foreign Keys                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Direct SQL Connection Pool
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                          2. LOCAL API PROXY LAYER                           │
│                                                                             │
│   Node.js / Express PostgREST Gateway (:2026)                               │
│   ├── Dynamic Filter Parser (ilike, eq, in, or, order, pagination)          │
│   ├── Quote Stripping & SQL Injection Prevention Engine                     │
│   └── Sub-10ms Fast Response Gateway                                       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST / PostgREST Protocol
      ┌────────────────────────────────┼────────────────────────────────┐
      │                                │                                │
      ▼                                ▼                                ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  Port 2020: Publik   │   │  Port 2021: Kemenkeu │   │   Port 2022: Bank    │
│  Transparansi Warga  │   │  Distribusi Nasional │   │ Rekening & Penyaluran│
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
      │                                                                 │
      ▼                                                                 ▼
┌──────────────────────┐                                      ┌──────────────────────┐
│  Port 2023: Auditor  │                                      │ Port 2024: Sekolah   │
│  Deteksi Anomali AI  │                                      │ Belanja & SPJ Digital│
└──────────────────────┘                                      └──────────────────────┘
```

---

## 🌐 Port Mapping & Layanan (7 Ports)

| Port | Layanan | Teknologi | Direktori Proyek | Keterangan & Fungsi Utama |
| :---: | :--- | :--- | :--- | :--- |
| **`2025`** | **PostgreSQL Database** | PostgreSQL 16 | *(System / pgsql)* | Database lokal sumber data tunggal (31 tabel relasional). |
| **`2026`** | **Proxy API Server** | Node.js / Express | `proxy/` | REST API gateway yang menerjemahkan PostgREST query ke SQL. |
| **`2020`** | **Transparansi Publik** | Next.js 16 | `apps/transparansi-anggaran/` | Portal publik untuk melacak anggaran dan rincian struk sekolah. |
| **`2021`** | **Dashboard Kementerian** | Next.js 16 | `apps/dashboard-kementerian/` | Alokasi APBN nasional, 38 provinsi, dan 514 kabupaten/kota. |
| **`2022`** | **Dashboard Bank** | Next.js 16 | `apps/dashboard-bank/` | Rekapitulasi rekening sekolah, mutasi kas, dan disbursement. |
| **`2023`** | **Dashboard Auditor** | Next.js 16 | `apps/dashboard-auditor/` | Audit investigatif, verifikasi SPJ digital, dan anomali AI. |
| **`2024`** | **Institusi Pendidikan** | Next.js 16 | `apps/dashboard-institusi-pendidikan/` | Akun sekolah aktif (`KB AL-IKHLAS`), RAB, SPJ, dan kas. |

---

## ✨ Fitur Utama Berdasarkan Peran

### 1. 🏛️ Portal Transparansi Publik (`http://localhost:2020`)
- **Pencarian Sekolah Instan**: Cari berdasarkan NPSN (`69893669`) atau nama institusi di seluruh Indonesia.
- **Pembeda Riwayat Dana Masuk Terkategori**:
  - **APBN**: Dana BOP PAUD Reguler dari Pemerintah Pusat.
  - **APBD**: Dana BOP PAUD Daerah dari Pemerintah Kabupaten/Kota.
  - **CSR**: Bantuan program kemitraan pendidikan dari pihak swasta/mitra industri.
- **E-Struk Digital & Transparansi Item**: Rincian kuitansi belanja dengan jumlah barang, harga satuan, PPN/PPh, dan ongkos kirim.
- **Visualisasi Anggaran**: Grafik donat alokasi kategori belanja dan grafik tren bulanan.
- **Forum Diskusi Publik & Apresiasi**: Ruang aspirasi warga dan pemberian rating bintang sekolah.

### 2. 🏛️ Dashboard Kementerian (`http://localhost:2021`)
- **Distribusi APBN Bertingkat**: Penetapan anggaran nasional ➔ 38 Provinsi ➔ 514 Kabupaten/Kota ➔ Satuan Pendidikan.
- **Cascading Rollup Calculation**: Sinkronisasi otomatis dari perubahan satuan sekolah hingga ringkasan nasional.
- **User Manager Terpadu**: Manajemen akun pengelola kementerian terhubung tabel `users`.

### 3. 🏦 Dashboard Bank Penyalur (`http://localhost:2022`)
- **Manajemen Rekening Sekolah**: Nomor rekening resmi terintegrasi (misal: `100.845.411.000`).
- **Monitoring Saldo Kas & Mutasi**: Pencatatan riwayat arus kas masuk dan keluar secara *real-time*.

### 4. 🔍 Dashboard Auditor & BPK (`http://localhost:2023`)
- **AI Anomaly Detection**: Deteksi otomatis transaksi tunggal berisiko tinggi (> Rp 20.000.000) atau potensi anomali harga.
- **Verifikasi SPJ Digital**: Validasi dokumen fisik kuitansi belanja (*VERIFIED*, *UNDER_REVIEW*, *MISSING*).
- **Direct School Audit Forum**: Saluran komunikasi langsung auditor dengan bendahara sekolah.

### 5. 🏫 Dashboard Institusi Pendidikan (`http://localhost:2024`)
- **Akun Standar Terpadu**: `KB AL-IKHLAS` (NPSN: `69893669`, Samatiga, Kab. Aceh Barat).
  - Alokasi Anggaran 2026: **`Rp 234.775.639`**
  - Realisasi Belanja: **`Rp 197.211.537`**
  - Sisa Saldo Kas: **`Rp 37.564.102`** (84.0% Penyerapan).
- **Rencana Anggaran Biaya (RAB)**: Input paket rencana kegiatan dan kebutuhan sarana/prasarana.
- **Input Pengeluaran & Scan OCR**: Pencatatan belanja riil dilengkapi OCR struk otomatis.

---

## 📸 Galeri Tampilan Halaman (Screenshots & Kode)

Berikut adalah ringkasan visual antarmuka dan referensi berkas kode sumber untuk setiap dashboard:

### 1. Transparansi Publik — Profil Sekolah & Riwayat Dana Masuk
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🏛️ KB AL-IKHLAS (PAUD - NPSN: 69893669) - Aceh Barat     [Unduh PDF] [Kembali]│
├──────────────────────────────────────────────────────────────────────────────┤
│ Total Dana Diterima: Rp 234.775.639 | Total Digunakan: Rp 197.211.537        │
│ Sisa Saldo Kas     : Rp  37.564.102 | Penyerapan      : 84.0%                │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🔵 Riwayat Dana Masuk: APBN (Pemerintah Pusat)                               │
│    15 Jan 2026 | BOP PAUD Reguler Tahap 1 | Ref: SP2D-01 | Rp 117.387.819    │
│    10 Apr 2026 | BOP PAUD Reguler Tahap 2 | Ref: SP2D-02 | Rp  70.432.692    │
│    Total Subtotal Masuk APBN                              : Rp 187.820.511    │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🟢 Riwayat Dana Masuk: APBD (Pemerintah Daerah)                              │
│    20 Feb 2026 | BOP PAUD Daerah Aceh Barat Tahap 1       | Rp  25.000.000    │
│    18 Jun 2026 | BOP PAUD Daerah Aceh Barat Tahap 2       | Rp  16.955.128    │
│    Total Subtotal Masuk APBD                              : Rp  41.955.128    │
├──────────────────────────────────────────────────────────────────────────────┤
│ 🟡 Riwayat Dana Masuk: CSR (Corporate Social Responsibility)                 │
│    05 Mar 2026 | CSR PT Mifa Bersaudara (PAUD Ceria)      | Rp   5.000.000    │
│    Total Subtotal Masuk CSR / Swasta                      : Rp   5.000.000    │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Halaman Web**: `http://localhost:2020/dashboard/69893669`
- **File Kode**: [`apps/transparansi-anggaran/apps/web-next/src/app/dashboard/[npsn]/page.tsx`](apps/transparansi-anggaran/apps/web-next/src/app/dashboard/[npsn]/page.tsx)

---

### 2. Dashboard Kementerian — Distribusi Nasional & Wilayah
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🏛️ KEMENTERIAN PENDIDIKAN & KEBUDAYAAN          [Tahun 2026 ▼] [User Manager]│
├──────────────────────────────────────────────────────────────────────────────┤
│ 📊 Ringkasan APBN 2026: Rp 769.100.000.000.000 | Realisasi: Rp 513.200.000... │
│ 📍 38 Provinsi | 514 Kabupaten/Kota | 40.000+ Satuan Pendidikan Terdaftar    │
├──────────────────────────────────────────────────────────────────────────────┤
│ Tabel Distribusi: Aceh, Sumut, DKI Jakarta, Jawa Barat, Jawa Timur, Papua... │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Halaman Web**: `http://localhost:2021/dashboard`
- **File Kode**: [`apps/dashboard-kementerian/app/dashboard/page.tsx`](apps/dashboard-kementerian/app/dashboard/page.tsx)
- **Komponen**: [`apps/dashboard-kementerian/components/layout/Sidebar.tsx`](apps/dashboard-kementerian/components/layout/Sidebar.tsx)

---

### 3. Dashboard Bank Penyalur — Rekening & Mutasi
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🏦 PORTAL BANK PENYALUR (KAS DAERAH & NASIONAL) [Tahun 2026 ▼] [User Manager]│
├──────────────────────────────────────────────────────────────────────────────┤
│ 💳 Rekening Sekolah Terdaftar: 100.845.411.000 (KB AL-IKHLAS)                │
│ 📈 Total Dana Tersalurkan: 100% On-Schedule | Status Rekonsiliasi: MATCHED   │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Halaman Web**: `http://localhost:2022/dashboard`
- **File Kode**: [`apps/dashboard-bank/app/dashboard/page.tsx`](apps/dashboard-bank/app/dashboard/page.tsx)

---

### 4. Dashboard Auditor — Anomali AI & Verifikasi SPJ
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🔍 DASHBOARD AUDITOR & PENGAWASAN KEUANGAN     [Tahun 2026 ▼] [User Manager]│
├──────────────────────────────────────────────────────────────────────────────┤
│ ⚠️ Deteksi Anomali: Transaksi > Rp 20 Juta Teridentifikasi Otomatis         │
│ 📁 SPJ Digital: Upload Dokumen PDF, Status Verifikasi, & Forum Auditor       │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Halaman Web**: `http://localhost:2023/dashboard/audit`
- **File Kode**: [`apps/dashboard-auditor/app/dashboard/audit/page.tsx`](apps/dashboard-auditor/app/dashboard/audit/page.tsx)

---

### 5. Dashboard Institusi Pendidikan — Rencana & Belanja Sekolah
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ 🏫 DASHBOARD SEKOLAH: KB AL-IKHLAS             [Tahun 2026 ▼] [User Manager]│
├──────────────────────────────────────────────────────────────────────────────┤
│ 💰 Pagu Alokasi : Rp 234.775.639 | Realisasi: Rp 197.211.537 | Sisa: Rp 37M  │
│ 📝 Menu: Rencana Anggaran (RAB), Pengeluaran & SPJ, Mutasi Bank, Forum Audit │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Halaman Web**: `http://localhost:2024/dashboard`
- **File Kode**: [`apps/dashboard-institusi-pendidikan/app/dashboard/page.tsx`](apps/dashboard-institusi-pendidikan/app/dashboard/page.tsx)

---

## 🚀 Panduan Instalasi Cepat

### 1. Kloning Repositori
```bash
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain
```

### 2. Jalankan Seluruh Layanan (Satu Perintah)
Gunakan skrip PowerShell bawaan untuk memulai PostgreSQL, Proxy API, dan ke-5 Dashboard secara otomatis:
```powershell
.\start-all.ps1
```

### 3. Akses Dashboard
Buka browser dan akses alamat berikut:
- 🌐 **Publik**: [http://localhost:2020](http://localhost:2020)
- 🏛️ **Kementerian**: [http://localhost:2021](http://localhost:2021)
- 🏦 **Bank**: [http://localhost:2022](http://localhost:2022)
- 🔍 **Auditor**: [http://localhost:2023](http://localhost:2023)
- 🏫 **Institusi Pendidikan**: [http://localhost:2024](http://localhost:2024)

---

## 📡 Dokumentasi API REST PostgREST

Proxy API (`http://localhost:2026/rest/v1/*`) mendukung query standar PostgREST:

| Endpoint | Method | Parameter Contoh | Deskripsi |
| :--- | :---: | :--- | :--- |
| `/rest/v1/tahun_anggaran` | `GET` | `?select=*&order=tahun.desc` | Mengambil daftar tahun anggaran. |
| `/rest/v1/alokasi_provinsi` | `GET` | `?tahun_anggaran_id=eq.7` | Alokasi anggaran per provinsi. |
| `/rest/v1/alokasi_kabupaten_kota` | `GET` | `?alokasi_provinsi_id=eq.ap-1` | Alokasi anggaran per kab/kota. |
| `/rest/v1/institusi_pendidikan` | `GET` | `?npsn=eq.69893669` | Profil master institusi pendidikan. |
| `/rest/v1/incoming_funds` | `GET` | `?school_id=eq.<UUID>` | Riwayat dana masuk (APBN/APBD/CSR). |
| `/rest/v1/transactions` | `GET` | `?school_id=eq.<UUID>` | Transaksi belanja operasional sekolah. |
| `/rest/v1/users` | `GET` | `?select=*&order=id.asc` | Daftar pengguna dan role dashboard. |

---

## 📁 Struktur Direktori Proyek

```
integrated-blockchain/
├── apps/
│   ├── transparansi-anggaran/          # Port 2020: Frontend Publik
│   ├── dashboard-kementerian/          # Port 2021: Dashboard Kementerian
│   ├── dashboard-bank/                 # Port 2022: Dashboard Bank
│   ├── dashboard-auditor/              # Port 2023: Dashboard Auditor
│   └── dashboard-institusi-pendidikan/ # Port 2024: Dashboard Sekolah
├── proxy/
│   └── proxy.js                        # Port 2026: PostgREST Express Proxy
├── scripts/
│   ├── check_all_ports.js              # Health-check skrip seluruh port
│   ├── populate_kb_data.js             # Generator data master KB AL-IKHLAS
│   └── update_incoming_funds_categorized.js
├── README.md                           # Dokumentasi Utama
├── PRD.md                              # Product Requirements Document
├── MVP.md                              # Minimum Viable Product Verification
├── TOPOLOGY.md                         # Topologi Jaringan & Data Flow
└── start-all.ps1                       # One-click start script
```

---

## 📚 Dokumentasi Terkait
- 📋 [Product Requirements Document (PRD)](PRD.md)
- 🚀 [Minimum Viable Product (MVP) Report](MVP.md)
- 🌐 [Topologi & Alur Data Sistem](TOPOLOGY.md)
- 📖 [Panduan Deployment VPS Linux](deploy_guide.md)

---

## 📄 Lisensi
Hak Cipta © 2026 Integrated Blockchain Transparansi Anggaran Pendidikan Indonesia. Dirilis di bawah lisensi [MIT](LICENSE).
