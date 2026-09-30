# 🏛️ Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia

[![Version](https://img.shields.io/badge/Version-v2.4.1%20(30%20Sept%202026)-blue.svg)](CHANGELOG.md)
[![Status](https://img.shields.io/badge/All%2010%20Ports-100%25%20Verified%20Online-brightgreen.svg)](#-peta-10-port--akses-dashboard)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15%2F16-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4%2F4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Restricted%20(Private%20Use)-red.svg)](LICENSE)

Sistem tata kelola dan transparansi keuangan pendidikan Indonesia terintegrasi dengan database lokal mandiri (*100% Single Source of Truth PostgreSQL*), mencakup **8 portal web aplikasi** untuk **PAUD, SD, SMP, SMA, dan Perguruan Tinggi** di 38 Provinsi dan 514 Kabupaten/Kota.

---

## 🧭 Pusat Navigasi & Dokumentasi Proyek

| Dokumen | Format | Deskripsi | Tautan Langsung |
|---|:---:|---|:---:|
| 🌐 **Panduan Visual & Interaktif** | `HTML` | Tampilan panduan grafis modern untuk pengguna umum / non-programmer. | [**Buka `README.html`**](README.html) |
| 📝 **Changelog & Riwayat Rilis** | `Markdown` | Catatan lengkap versi, pembaruan terkini v2.4.0, dan log perbaikan sistem. | [**Buka `CHANGELOG.md`**](CHANGELOG.md) |
| 📋 **Product Requirements (PRD)** | `Markdown` | Spesifikasi lengkap sistem, alur bisnis dana APBN/APBD/CSR, & hak akses. | [**Buka `PRD.md`**](PRD.md) |
| 🏆 **MVP & Laporan Verifikasi** | `Markdown` | Laporan pengujian fitur 10 port, performa latensi, dan integrasi database. | [**Buka `MVP.md`**](MVP.md) |
| 🚀 **Panduan Deployment VPS/Mac** | `Markdown` | Tutorial step-by-step setup VPS Ubuntu/Debian, macOS, Nginx, Domain, & SSL. | [**Buka `deploy_guide.md`**](deploy_guide.md) |
| 🗺️ **Topologi Arsitektur** | `Markdown` | Diagram relasi database PostgreSQL, Proxy REST API, dan 8 Dashboard. | [**Buka `TOPOLOGY.md`**](TOPOLOGY.md) |

---

## 🗺️ Peta 10 Port & Akses Dashboard

| Port | Peran Pengguna / Dashboard | Direktori Aplikasi | Tautan Akses Cepat | Status |
|:---:|---|---|:---:|:---:|
| **2019** | **Portal Publik Redesign (Civic-Tech Vite)** | `apps/dashboard-publik` | [http://localhost:2019](http://localhost:2019) | 🟢 Aktif |
| **2020** | **Portal Transparansi Publik (Next.js Edition)** | `apps/transparansi-anggaran/apps/web-next` | [http://localhost:2020](http://localhost:2020) | 🟢 Aktif |
| **2021** | **Dashboard Kementerian** (Kemenkeu & Kemendikdasmen) | `apps/dashboard-kementerian` | [http://localhost:2021/dashboard](http://localhost:2021/dashboard) | 🟢 Aktif |
| **2022** | **Dashboard Bank Penyalur** (Mandiri, BRI, BNI, BSI, BPD) | `apps/dashboard-bank` | [http://localhost:2022/dashboard](http://localhost:2022/dashboard) | 🟢 Aktif |
| **2023** | **Dashboard Auditor BPK** (Pengawasan & Deteksi Anomali AI) | `apps/dashboard-auditor` | [http://localhost:2023/dashboard](http://localhost:2023/dashboard) | 🟢 Aktif |
| **2024** | **Dashboard Institusi Pendidikan** (Kepala Sekolah & Bendahara) | `apps/dashboard-institusi-pendidikan` | [http://localhost:2024/dashboard](http://localhost:2024/dashboard) | 🟢 Aktif |
| **2025** | **Dashboard APBD Provinsi Lampung** (Pemda & Dinas Pendidikan) | `apps/dashboard-apbd` | [http://localhost:2025/dashboard](http://localhost:2025/dashboard) | 🟢 Aktif |
| **2026** | **Dashboard Admin** (Super-Admin Console & Manajemen Pengguna) | `apps/dashboard-admin` | [http://localhost:2026](http://localhost:2026) | 🟢 Aktif |
| **2027** | **Database PostgreSQL 16** (35 Tabel Relasional Mandiri) | `pgsql/bin` / System PostgreSQL | `postgresql://localhost:2027` | 🟢 Aktif |
| **2028** | **Proxy REST API Server** (Protokol PostgREST Sub-10ms) | `proxy/proxy.js` | [http://localhost:2028](http://localhost:2028) | 🟢 Aktif |

---

## 📁 Struktur Direktori Proyek

```
integrated-blockchain/
├── apps/
│   ├── dashboard-publik/                 # Port 2019: Portal Warga Civic-Tech (Vite / Vanilla ES)
│   ├── transparansi-anggaran/
│   │   └── apps/web-next/                # Port 2020: Portal Transparansi Publik (Next.js 14 App Router)
│   ├── dashboard-kementerian/            # Port 2021: Penetapan Pagu & Alokasi Nasional (Next.js 15)
│   ├── dashboard-bank/                   # Port 2022: Penyaluran Kas & Rekening Escrow Himbara (Next.js 15)
│   ├── dashboard-auditor/                # Port 2023: Pengawasan BPK & Deteksi Anomali AI (Next.js 15)
│   ├── dashboard-institusi-pendidikan/   # Port 2024: RAB Sekolah, SPJ & Scan Kuitansi OCR (Next.js 15)
│   ├── dashboard-apbd/                   # Port 2025: Validasi Mandatori 20% APBD Lampung (Next.js 15)
│   └── dashboard-admin/                  # Port 2026: Super-Admin Console & RBAC Hierarkis (Vite)
├── proxy/
│   └── proxy.js                          # Port 2028: Fast PostgREST REST API Gateway (Node.js/Express)
├── pgsql/                                # Port 2027: PostgreSQL 16 Portable Engine (Windows)
├── scripts/                              # Skrip Utilitas, Otomasi & Pemeriksaan
│   ├── check_all_ports.js                # Health-check real-time 10 port (:2019-:2028)
│   ├── clean-cache.js                    # Pembersih cache .next & Turbopack 1-klik
│   ├── setup-db.js                       # Inisialisasi & migrasi 35 tabel database
│   └── setup-env.js                      # Generator berkas .env.local otomatis
├── start-all.bat / start-all.ps1         # Peluncur 1-Klik Seluruh Ekosistem 10 Layanan
├── stop-all.bat / stop-all.ps1           # Penghenti Aman Seluruh Port & Proses Node/Postgres
├── CHANGELOG.md                          # Catatan Rilis & Log Pembaruan Terkini
└── README.md                             # Dokumentasi Induk Proyek
```

---

## 💡 Panduan Instalasi & Eksekusi Cepat (Untuk Pengguna Umum & Programmer)

Sistem ini dirancang agar **bisa dijalankan oleh siapa pun dengan sangat mudah**:

### ⚙️ Prasyarat Utama (Hanya 1x di Awal)
Pastikan komputer Anda sudah terpasang **Node.js** (versi 18 atau lebih baru).
- Jika belum terpasang, unduh gratis dari situs resmi: **[https://nodejs.org](https://nodejs.org/)** (klik tombol hijau bertuliskan **LTS**).
- Jalankan file installer yang terunduh, klik **Next** sampai selesai.

---

### 🪟 1. Jika Anda Menggunakan Windows (Cara 1-Klik Paling Praktis):
1. Buka folder proyek ini di Windows Explorer.
2. **Klik 2x (Double-Click)** pada file **`start-all.bat`**.
3. Sistem akan bekerja secara otomatis:
   - Memeriksa file konfigurasi `.env.local` & dependensi aplikasi.
   - Menyalakan database PostgreSQL portabel (Port 2027) & Proxy API Gateway (Port 2028).
   - Menyalakan seluruh 8 portal aplikasi dashboard secara berurutan.
   - Memanaskan halaman web dan **otomatis membuka peramban (browser) ke [http://localhost:2020](http://localhost:2020)**.
4. **Cara Mematikan Server**: Cukup **Klik 2x** pada file **`stop-all.bat`** kapan saja Anda ingin menghentikan seluruh layanan dengan aman.

---

### 🐧 2. Jika Anda Menggunakan Linux VPS (Ubuntu / Debian Server):
```bash
# 1. Clone repository
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain

# 2. Setup PostgreSQL & user password
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql && sudo systemctl enable postgresql
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE postgres;" 2>/dev/null || true

# 3. Setup database & import otomatis 35 tabel master
DB_PORT=5432 DB_PASSWORD=postgres node scripts/setup-db.js

# 4. Generate konfigurasi environment (.env.local) untuk VPS Anda
node scripts/setup-env.js http://IP_VPS_ANDA:2028

# 5. Jalankan backend & dashboard (atau gunakan PM2)
chmod +x start.sh && ./start.sh
```

---

### 🍎 3. Jika Anda Menggunakan MacBook (macOS Terminal):
```bash
# 1. Install Node.js & PostgreSQL via Homebrew
brew install node postgresql@16 && brew services start postgresql@16

# 2. Clone repository & masuk ke direktori
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain

# 3. Import database & setup environment
DB_PORT=5432 DB_PASSWORD=postgres node scripts/setup-db.js
node scripts/setup-env.js

# 4. Jalankan seluruh server
chmod +x start.sh && ./start.sh
```

---

### 🐳 4. Menggunakan Docker Compose:
```bash
# 1. Nyalakan Database PostgreSQL & Proxy API Gateway dalam kontainer:
docker compose up -d

# 2. Jalankan dashboard aplikasi:
npm run dev --prefix apps/transparansi-anggaran/apps/web-next
```

---

## 🛠️ Otomasi Environment (`.env.local`) — 100% Mandiri Tanpa Supabase Cloud!

> 💡 **Apakah Perlu Akun Supabase Cloud? TIDAK!**
> Sistem ini **100% Self-Hosted** menggunakan database PostgreSQL lokal kita sendiri. Variabel `NEXT_PUBLIC_SUPABASE_URL` terhubung ke **Proxy REST API Gateway Lokal (Port 2028)**.

Untuk membuat seluruh file `.env.local` di semua folder aplikasi secara otomatis, jalankan:
```bash
# Untuk Localhost (Port 2028):
node scripts/setup-env.js

# Untuk VPS dengan IP / Domain:
node scripts/setup-env.js http://IP_VPS_ANDA:2028
```

---

## 📝 Log Update & Riwayat Pembaruan Kode (Changelog)

Berikut adalah ringkasan pembaruan arsitektur dan peningkatan fitur sistem:

### 🟢 1. Fitur Indikator Status Database Real-Time (Live Latency & Health Check)
- **Implementasi**: Menambahkan indikator status koneksi database lokal di seluruh header dashboard (`Port 2021`, `Port 2022`, `Port 2023`, `Port 2024`, dan `Port 2025`).
- **Fitur Live Ping**: Melakukan auto-ping berkala setiap 10 detik dan setiap jendela browser aktif.
- **Tampilan Visual**:
  - `DB Lokal Aktif (100%) [X ms]` dengan ikon hijau ketika database PostgreSQL & Proxy terhubung.
  - `DB Reconnecting... [X ms]` dengan ikon merah saat koneksi database terputus.

### 🟢 2. Penyelarasan Desain & Margin CSS Seluruh Halaman Publik (Port 2020)
- **Standarisasi Kontainer**: Menyelaraskan seluruh 6 halaman publik (`/audit`, `/provinces`, `/statistics`, `/reporting`, `/about`, dan `/faq`) menggunakan kontainer standar `max-w-7xl mx-auto px-4 md:px-8` dengan wrapper `min-h-screen bg-slate-50 pt-4 pb-16`.
- **Konsistensi Visual**: Jarak margin kiri-kanan dan padding header di seluruh halaman kini 100% sejajar dengan halaman `/aliran-dana`.

### 🟢 3. Otomasi Cascading Delete di PostgreSQL
- **Trigger Database**: Menambahkan trigger `trg_cascade_delete_tahun_anggaran` pada tabel `tahun_anggaran`.
- **Cascade Deletion**: Ketika suatu tahun anggaran dihapus melalui Dashboard Kementerian, sistem secara otomatis menghapus seluruh rekaman terkait pada tabel `apbd_yearly_data`, `csr_yearly_data`, `apbn_yearly_data`, `provincial_allocations`, `district_allocations`, dan `alokasi_provinsi`.

### 🟢 4. Sinkronisasi Data Baku Multi-Tahun & Rule 2027
- **Pembersihan Data Lama**: Menghapus seluruh array hardcode tahun historis lama (2020–2025) di `lib/data/index.ts`.
- **Selector Tahun**: Sinkronisasi 100% ke database riil PostgreSQL (`tahun_anggaran`).
- **Aturan Tahun 2027**:
  - Total Anggaran & Realisasi Belanja: **`Rp 0`** (0% penyerapan).
  - Saldo Kas di Bank sisa tahun 2026 otomatis di-*carry-forward* sebagai saldo awal rekening.

### 🟢 5. Skrip Pembersihan Cache Next.js & Turbopack
- **Skrip `node scripts/clean-cache.js`**: Menghentikan proses dev server secara aman dan menghapus seluruh folder cache `.next` di 8 aplikasi dashboard untuk menjamin *clean compilation state*.

### 🟢 6. Penyempurnaan Skrip Peluncur 10 Port (`start-all.bat` / `start-all.ps1`)
- Penambahan **Port 2019** untuk **Portal Publik Civic-Tech Redesign (Vite)** (`apps/dashboard-publik`).
- Menggunakan perintah `npm run dev` secara konsisten pada setiap aplikasi.
- Penyesuaian port: PostgreSQL di Port `2027` dan Proxy REST API Gateway di Port `2028`.
- Pemanasan halaman (*warm-up compilation*) otomatis sebelum membuka browser.

### 🟢 7. Visualisasi Tren Tahunan Dinamis & Recharts Area Dots (Port 2021–2025)
- **Otomasi Rentang Tahun**: Menggantikan judul statis `"2020–2026"` menjadi kalkulasi rentang dinamis (`${minYear}–${maxYear}`) langsung dari tabel database PostgreSQL `tahun_anggaran` (contoh: `Tren APBN Pendidikan 2026–2027`).
- **Penghapusan Filter DRAFT**: Menghapus filter `.filter(t => t.status !== 'DRAFT')` dan `.neq('status', 'DRAFT')` agar tahun berjalan (2026) dan tahun rencana (2027) selalu tampil otomatis.
- **Titik Koordinat Interaktif (Area Dots)**: Menambahkan `dot={{ r: 4 }}` dan `activeDot={{ r: 6 }}` pada seluruh komponen `<Area>` di 5 dashboard (Kementerian, Bank, Auditor, Sekolah, dan APBD) agar data tahun terlihat tegas dan interaktif.
- **Rule Akuntansi 2027**: Realisasi belanja tahun DRAFT/rencana otomatis dihitung Rp 0 (0% penyerapan), dengan sisa kas tahun aktif dialirkan sebagai saldo kas terbawa (*carry-forward*).

### 🟢 8. Sinkronisasi Data 38 Provinsi & Peta Regional Portal Civic-Tech (Port 2019)
- **Penyelarasan Data**: Menyelaraskan query alokasi dan realisasi 38 provinsi di `apps/dashboard-publik` agar 100% identik dengan Port 2020 via view `provincial_allocations`.
- **Integrasi Peta**: Pewarnaan choropleth peta Indonesia interaktif dan chip provinsi disinkronkan dengan data agregat sekolah `province_school_stats`.
- **Navigasi Presisi**: Memperbaiki routing kartu provinsi (`province-detail.html?code=...&name=...`) untuk penelusuran sekolah hingga level kabupaten/kota.

### 🟢 9. Akselerasi Endpoint Proxy & Skrip Pemeriksaan (Port 2028)
- **Optimasi Kueri RPC**: Endpoint `/rest/v1/rpc/get_all_province_stats` dioptimalkan membaca langsung dari tabel terindeks `province_school_stats`, mempercepat waktu respons ke <10ms.
- **Skrip `node scripts/check_all_ports.js`**: Skrip verifikasi kesehatan otomatis untuk menguji ketersediaan HTTP 200 OK dan latensi milidetik seluruh 10 port dalam satu baris perintah.

> 📘 **Riwayat lengkap seluruh versi terdahulu (v1.0.0 s.d. v2.4.0) dapat dibaca di: [CHANGELOG.md](CHANGELOG.md)**.

---

## 🏗️ Topologi Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          1. DATA PERSISTENCE LAYER                          │
│                                                                             │
│   PostgreSQL 16 Engine (:2027)                                              │
│   └── 35 Public Tables (Master Anggaran, Wilayah, Transaksi, Audit, APBD)   │
│   └── Performance B-Tree Indexes & Cascading Foreign Keys                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Direct SQL Connection Pool
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                          2. LOCAL API PROXY LAYER                           │
│                                                                             │
│   Node.js / Express PostgREST Gateway (:2028)                               │
│   ├── Dynamic Filter Parser (ilike, eq, in, or, order, pagination)          │
│   ├── Quote Stripping & SQL Injection Prevention Engine                     │
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

## 🌐 Menghubungkan ke Domain / Subdomain / IP Publik

Setiap dashboard dapat dihubungkan ke domain publik menggunakan Reverse Proxy Nginx & SSL HTTPS Let's Encrypt:
- `https://publik.domain.com` &rarr; Port 2019 (Civic-Tech Redesign Vite)
- `https://transparansi.domain.com` &rarr; Port 2020 (Portal Transparansi Publik Next.js)
- `https://kementerian.domain.com` &rarr; Port 2021 (Dashboard Kementerian)
- `https://bank.domain.com` &rarr; Port 2022 (Dashboard Bank Penyalur)
- `https://auditor.domain.com` &rarr; Port 2023 (Dashboard Auditor BPK)
- `https://sekolah.domain.com` &rarr; Port 2024 (Dashboard Institusi Pendidikan)
- `https://apbd.domain.com` &rarr; Port 2025 (Dashboard APBD Lampung)
- `https://admin.domain.com` &rarr; Port 2026 (Dashboard Admin Super-Console)
- `https://api.domain.com` &rarr; Port 2028 (Proxy API Gateway)

> 📘 **Panduan lengkap konfigurasi file Nginx `.conf`, SSL Certbot gratis, dan PM2 tersedia di: [deploy_guide.md](deploy_guide.md)**.

---

## 🔍 Skrip Utilitas Penting

```bash
# 1. Bersihkan seluruh cache .next dan Turbopack:
node scripts/clean-cache.js

# 2. Verifikasi status kesehatan seluruh port:
node scripts/check_all_ports.js

# 3. Ekspor dan kompres ulang database ke database_dump.sql.gz:
node scripts/export_and_compress_db.js
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **[Restricted Private Use License](LICENSE)** (Hak Cipta Dilindungi).

- **Izin yang Diberikan (Permissions)**:
  - ✓ **Private use**: Diizinkan untuk penggunaan pribadi, inspeksi kode, pengujian lokal, evaluasi, penelitian akademis, dan edukasi non-komersial.
- **Batasan & Larangan (Limitations & Restrictions)**:
  - ✗ **Commercial use**: Dilarang keras menggunakan, memperjualbelikan, atau memonetisasi kode sumber ini untuk aktivitas komersial tanpa izin tertulis dari pemilik hak cipta.
  - ✗ **Distribution**: Dilarang mendistribusikan ulang, mengunggah mirror publik, menyewakan, atau melisensikan ulang (*sublicense*) kepada pihak ketiga.
  - ✗ **Modification for redistribution**: Dilarang merilis publik atau menerbitkan karya turunan/modifikasi.

Rincian lengkap ketentuan lisensi dapat dibaca langsung pada berkas [LICENSE](LICENSE).
