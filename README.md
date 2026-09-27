# 🏛️ Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15%2F16-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4%2F4.0-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sistem tata kelola dan transparansi keuangan pendidikan Indonesia terintegrasi dengan database lokal mandiri (*100% Single Source of Truth PostgreSQL*), mencakup **6 portal spesifik peran pengguna** untuk **PAUD, SD, SMP, SMA, dan Perguruan Tinggi** di 38 Provinsi dan 514 Kabupaten/Kota.

---

## 🌟 Pusat Navigasi & Dokumentasi Cepat

| Dokumen | Format | Deskripsi | Tautan Langsung |
|---|:---:|---|:---:|
| 🌐 **Panduan Visual & Interaktif** | `HTML` | Tampilan panduan grafis modern untuk pengguna umum / non-programmer. | Halaman ini |
| 📋 **Product Requirements (PRD)** | `Markdown` | Spesifikasi lengkap sistem, alur bisnis dana APBN/APBD/CSR, & hak akses. | [**Buka `PRD.md`**](PRD.md) |
| 🏆 **MVP & Laporan Verifikasi** | `Markdown` | Laporan pengujian fitur 8 port, performa latensi, dan integrasi database. | [**Buka `MVP.md`**](MVP.md) |
| 🚀 **Panduan Deployment VPS/Mac** | `Markdown` | Tutorial step-by-step setup VPS Ubuntu/Debian, macOS, Nginx, Domain, & SSL. | [**Buka `deploy_guide.md`**](deploy_guide.md) |

---

## 💡 Panduan Cepat untuk Pemula (Bukan Programmer)

Sistem ini dirancang agar **bisa dijalankan oleh siapa pun**, termasuk orang awam yang tidak mengerti server, coding, atau database SQL. Cukup ikuti langkah mudah di bawah ini:

### ⚙️ Prasyarat Utama (Hanya 1x di Awal)
Pastikan komputer Anda sudah terpasang **Node.js** (versi 18 atau lebih baru).
- Jika belum terpasang, unduh gratis dari situs resmi: **[https://nodejs.org](https://nodejs.org/)** (klik tombol hijau bertuliskan **LTS**).
- Jalankan file instalasi yang terunduh, klik **Next** sampai selesai.

---

### 🪟 1. Jika Anda Menggunakan Windows (Cara 1-Klik Paling Praktis):
1. Buka folder proyek ini di Windows Explorer.
2. **Klik 2x (Double-Click)** pada file **`start-all.bat`**.
3. Sistem akan bekerja secara otomatis:
   - Memeriksa file konfigurasi `.env.local` & dependensi aplikasi.
   - Menyalakan database PostgreSQL lokal (Port 2027) & Proxy API (Port 2028).
   - Menyalakan seluruh 7 portal aplikasi dashboard.
   - Memanaskan halaman web dan **otomatis membuka peramban (browser) ke [http://localhost:2020](http://localhost:2020)**.
4. **Cara Mematikan Server**: Cukup **Klik 2x** pada file **`stop-all.bat`** kapan saja Anda ingin menghentikan seluruh layanan.

> ⏳ **Catatan Penting Saat Pertama Kali Membuka Halaman (First Compilation)**:
> Pada peluncuran pertama kali, sistem Next.js memerlukan waktu sekitar 30–60 detik untuk membuat cache filesystem dan mengompilasi halaman web. Jika peramban sempat menampilkan status *Loading...*, mohon tunggu sejenak hingga proses kompilasi selesai.

---

### 🐧 2. Jika Anda Menggunakan Linux VPS (Ubuntu / Debian Server):
```bash
# Clone & Jalankan otomatis (1 Perintah)
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
DB_PORT=5432 DB_PASSWORD=postgres node scripts/setup-db.js
chmod +x start.sh && ./start.sh
```

---

### 🍎 3. Jika Anda Menggunakan MacBook (macOS Terminal):
```bash
brew install node postgresql@16 && brew services start postgresql@16
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain
DB_PORT=5432 DB_PASSWORD=postgres node scripts/setup-db.js
chmod +x start.sh && ./start.sh
```

---

### 🐳 4. Menggunakan Docker Compose (Database & Proxy Backend):
File `docker-compose.yml` menyediakan basis data PostgreSQL (Port 2027) dan Proxy REST API (Port 2028) secara mandiri:
```bash
# 1. Nyalakan Database & Proxy API Gateway dalam kontainer:
docker compose up -d

# 2. Jalankan portal web (contoh: Portal Transparansi Publik):
npm run dev --prefix apps/transparansi-anggaran/apps/web-next
```
*(Bagi pengguna umum/awam di Windows, kami sangat merekomendasikan menggunakan file **`start-all.bat`** karena tidak memerlukan Docker Desktop yang berat).*

---

## 🛠️ Otomasi Environment (`.env.local`) — 100% Mandiri Tanpa Cloud Supabase!

> 💡 **Apakah Perlu Akun Supabase? TIDAK!**
> Sistem ini **100% Self-Hosted** menggunakan database PostgreSQL lokal kita sendiri. Variabel `NEXT_PUBLIC_SUPABASE_URL` terhubung ke **Proxy REST API Lokal (Port 2028)**.

Untuk membuat seluruh file `.env.local` di ke-6 folder aplikasi sekaligus secara otomatis, jalankan:
```bash
# Untuk Localhost:
node scripts/setup-env.js

# Untuk VPS dengan IP / Domain:
node scripts/setup-env.js http://IP_VPS_ANDA:2028
```

## 🗺️ Peta 9 Port & Akses Dashboard

| Port | Peran Pengguna / Dashboard | Direktori Aplikasi | Tautan Akses Cepat |
|:---:|---|---|:---:|
| **2020** | **Portal Transparansi Publik** (Masyarakat & Orang Tua) | `apps/transparansi-anggaran/apps/web-next` | [http://localhost:2020](http://localhost:2020) |
| **2021** | **Dashboard Kementerian** (Kemenkeu & Kemendikdasmen) | `apps/dashboard-kementerian` | [http://localhost:2021/dashboard](http://localhost:2021/dashboard) |
| **2022** | **Dashboard Bank Penyalur** (Mandiri, BRI, BNI, BSI, BPD) | `apps/dashboard-bank` | [http://localhost:2022/dashboard](http://localhost:2022/dashboard) |
| **2023** | **Dashboard Auditor BPK** (Pengawasan & Deteksi Anomali AI) | `apps/dashboard-auditor` | [http://localhost:2023/dashboard](http://localhost:2023/dashboard) |
| **2024** | **Dashboard Institusi Pendidikan** (Kepala Sekolah & Bendahara) | `apps/dashboard-institusi-pendidikan` | [http://localhost:2024/dashboard](http://localhost:2024/dashboard) |
| **2025** | **Dashboard APBD Provinsi Lampung** (Pemda & Dinas Pendidikan) | `apps/dashboard-apbd` | [http://localhost:2025/dashboard](http://localhost:2025/dashboard) |
| **2026** | **Dashboard Admin** (Super-Admin Console & Manajemen Pengguna) | `apps/dashboard-admin` | [http://localhost:2026](http://localhost:2026) |
| **2027** | **Database PostgreSQL 16** (35 Tabel Relasional Mandiri) | `pgsql/bin` / System Postgres | `localhost:2027` |
| **2028** | **Proxy REST API Server** (Protokol PostgREST Sub-10ms) | `proxy/proxy.js` | [http://localhost:2028](http://localhost:2028) |

---

## 📸 Tangkapan Layar Aplikasi

| Portal | Port | Tangkapan Layar |
|---|:---:|---|
| **Portal Transparansi Publik** | `:2020` | ![Portal Transparansi](screenshots/port-2020-transparansi.png) |
| **Detail Institusi Publik (024029)** | `:2020` | ![Detail Sekolah](screenshots/port-2020-sekolah-024029.png) |
| **Dashboard Kementerian (APBN)** | `:2021` | ![Dashboard Kementerian](screenshots/port-2021-kementerian.png) |
| **Dashboard Bank Penyalur** | `:2022` | ![Dashboard Bank](screenshots/port-2022-bank.png) |
| **Dashboard Auditor BPK** | `:2023` | ![Dashboard Auditor](screenshots/port-2023-auditor.png) |
| **Dashboard Institusi Pendidikan** | `:2024` | ![Dashboard Sekolah](screenshots/port-2024-institusi-pendidikan.png) |
| **Dashboard APBD Provinsi Lampung** | `:2025` | ![Dashboard APBD](screenshots/port-2027-apbd-lampung.png) |

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
│  Port 2020: Publik   │   │  Port 2021: Kemenkeu │   │   Port 2022: Bank    │
│  Transparansi Warga  │   │  Distribusi Nasional │   │ Rekening & Penyaluran│
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
       │                               │                               │
       ▼                               ▼                               ▼
┌──────────────────────┐   ┌──────────────────────┐   ┌──────────────────────┐
│  Port 2023: Auditor  │   │ Port 2024: Sekolah   │   │ Port 2025: APBD Prov │
│  Deteksi Anomali AI  │   │ Belanja & SPJ Digital│   │ Mandat 20% Daerah    │
└──────────────────────┘   └──────────────────────┘   └──────────────────────┘
                                       │
                                       ▼
                           ┌──────────────────────┐
                           │ Port 2026: Admin     │
                           │ Super-Admin Console  │
                           └──────────────────────┘
```

---

## 📊 Aturan Baku Multi-Tahun Anggaran

1. **Tahun 2026 (Tahun Anggaran Berjalan Aktif)**:
   - Menampilkan data pagu alokasi, realisasi belanja, dan persentase penyerapan secara riil dari database.
2. **Tahun 2027 (Tahun Anggaran Perencanaan Baru)**:
   - Alokasi Baru: **`Rp 0`**
   - Realisasi Belanja: **`Rp 0`** (0.0% penyerapan)
   - **Saldo Kas di Bank (Sisa Tahun 2026)**: Diakumulasi dan dibawa maju (*Carry-Forward*) sebagai saldo awal rekening berjalan.

---

## 🌐 Menghubungkan ke Domain / Subdomain / IP Publik

Setiap dashboard dapat dihubungkan ke domain publik menggunakan Reverse Proxy Nginx & SSL HTTPS Let's Encrypt:
- `https://transparansi.domain.com` &rarr; Port 2020
- `https://kementerian.domain.com` &rarr; Port 2021
- `https://bank.domain.com` &rarr; Port 2022
- `https://auditor.domain.com` &rarr; Port 2023
- `https://sekolah.domain.com` &rarr; Port 2024
- `https://api.domain.com` &rarr; Port 2026
- `https://apbd.domain.com` &rarr; Port 2027

> 📘 **Panduan lengkap konfigurasi file Nginx `.conf`, SSL Certbot gratis, dan PM2 tersedia di: [deploy_guide.md](deploy_guide.md)**.

---

## 🔍 Skrip Pemeriksaan Kesehatan (Health Check)
```bash
node scripts/check_all_ports.js
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
