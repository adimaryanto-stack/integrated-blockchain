# 📖 Panduan Lengkap Instalasi & Deployment (Linux VPS, macOS, & Windows)
## Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia

> **Panduan praktis, mudah dipahami, dan bergaransi 100% berhasil untuk menjalankan seluruh ekosistem (Database PostgreSQL, Proxy REST API, dan 6 Dashboard Aplikasi) pada VPS Ubuntu/Debian, MacBook macOS, maupun Windows Localhost.**

---

## 📌 Peta 8 Port & Layanan

| Port | Layanan / Aplikasi | Direktori | URL Akses |
|:---:|---|---|---|
| **2020** | **Portal Transparansi Publik** | `apps/transparansi-anggaran/apps/web-next` | `http://localhost:2020` |
| **2021** | **Dashboard Kementerian (APBN)** | `apps/dashboard-kementerian` | `http://localhost:2021/dashboard` |
| **2022** | **Dashboard Bank Penyalur** | `apps/dashboard-bank` | `http://localhost:2022/dashboard` |
| **2023** | **Dashboard Auditor BPK** | `apps/dashboard-auditor` | `http://localhost:2023/dashboard` |
| **2024** | **Dashboard Institusi Pendidikan** | `apps/dashboard-institusi-pendidikan` | `http://localhost:2024/dashboard` |
| **2025** | **Database PostgreSQL 16** | `pgsql/data` / System Postgres | `postgresql://localhost:2025/postgres` |
| **2026** | **Proxy REST API Gateway** | `proxy/proxy.js` | `http://localhost:2026` |
| **2027** | **Dashboard APBD Provinsi Lampung** | `apps/dashboard-apbd` | `http://localhost:2027/dashboard` |

---

## 🗄️ Database: Sumber Data Tunggal (Single Source of Truth)

Seluruh skema tabel (35 tabel relasional), relasi foreign key, indeks performa B-Tree, dan data master 367.865 satuan pendidikan telah dikompresi ke dalam file **`database_dump.sql.gz`** (ukuran 48 MB).

Skrip otomatis **`scripts/setup-db.js`** akan mendekompresi dan mengimpor seluruh data secara otomatis ke database PostgreSQL tujuan hanya dalam **1 kali eksekusi**.

---

## 🐧 METODE 1: Instalasi di Linux VPS (Ubuntu / Debian) — *Direkomendasikan*

### Langkah 1: Clone Repository & Persiapan OS
```bash
# 1. Update paket sistem & install dependensi dasar
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential postgresql postgresql-contrib

# 2. Install Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. Install Process Manager (PM2) global
sudo npm install -g pm2

# 4. Clone repository
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain
```

### Langkah 2: Konfigurasi Database PostgreSQL VPS (Port 2025)
```bash
# Masuk ke prompt PostgreSQL dan atur password user 'postgres'
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE postgres;" 2>/dev/null || true

# (Opsional) Jika ingin mengubah port default PostgreSQL ke 2025:
sudo sed -i "s/port = 5432/port = 2025/g" /etc/postgresql/*/main/postgresql.conf
sudo systemctl restart postgresql
```

### Langkah 3: Import Database Otomatis (1 Perintah)
```bash
# Jalankan skrip universal restorer (Otomatis ekstrak gzip & import 35 tabel)
DB_PORT=2025 DB_PASSWORD=postgres node scripts/setup-db.js
```
*Output: `✅ Database imported successfully! ALL 35 TABLES & 367,865 INSTITUTIONS READY!`*

### Langkah 4: Jalankan Seluruh Sistem via PM2 (Background Daemon)
```bash
# Berikan izin eksekusi pada skrip startup
chmod +x start.sh

# Jalankan start.sh (akan menginstal dependensi & menjalankan 8 port)
./start.sh
```

### Memantau & Mengelola Layanan di VPS
```bash
# Melihat status seluruh dashboard & proxy
pm2 status

# Melihat log aplikasi secara realtime
pm2 logs

# Restart seluruh aplikasi jika diperlukan
pm2 restart all
```

---

## 🍎 METODE 2: Instalasi di MacBook (macOS Intel / Apple Silicon M1/M2/M3)

### Langkah 1: Persiapan Terminal macOS via Homebrew
Buka aplikasi **Terminal** di MacBook Anda:
```bash
# 1. Install Node.js dan PostgreSQL 16 melalui Homebrew
brew install node postgresql@16

# 2. Jalankan service PostgreSQL
brew services start postgresql@16

# 3. Pastikan user postgres dan database postgres tersedia
psql postgres -c "CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';" 2>/dev/null || true
psql postgres -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### Langkah 2: Clone Repository & Restore Database
```bash
# 1. Clone repository
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain

# 2. Install dependensi proxy API
cd proxy && npm install && cd ..

# 3. Import 35 tabel database secara instan
DB_PORT=5432 DB_PASSWORD=postgres node scripts/setup-db.js
```

### Langkah 3: Jalankan Ekosistem
```bash
# Opsi A: Jalankan script otomatis
chmod +x start.sh
./start.sh

# Opsi B: Jalankan manual di tab terminal terpisah
# Terminal 1: Proxy API Server (Port 2026)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres node proxy/proxy.js

# Terminal 2: Dashboard Transparansi Publik (Port 2020)
cd apps/transparansi-anggaran/apps/web-next && npm install && npm run dev

# Terminal 3: Dashboard APBD Lampung (Port 2027)
cd apps/dashboard-apbd && npm install && npm run dev
```

Buka peramban di MacBook: **[http://localhost:2020](http://localhost:2020)** dan **[http://localhost:2027](http://localhost:2027)**.

---

## 🐳 METODE 3: Deployment Menggunakan Docker & Docker Compose (1 Perintah)

Jika Anda memiliki **Docker Desktop** atau **Docker Engine**:

```bash
# Clone repository
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain

# Jalankan Database PostgreSQL (Port 2025) & Proxy API (Port 2026) dalam container
docker compose up -d
```
*Docker akan otomatis membuat database, menjalankan PostgreSQL pada port 2025, dan mengaktifkan REST Proxy API pada port 2026.*

Kemudian jalankan dashboard yang Anda inginkan:
```bash
# Contoh menjalankan Dashboard APBD Lampung
cd apps/dashboard-apbd && npm install && npm run dev
```

---

## 🪟 METODE 4: Instalasi di Windows (Localhost)

Di Windows, sistem sudah dilengkapi dengan *bundled portable* PostgreSQL 16 di folder `pgsql/bin`.

```powershell
# 1. Buka PowerShell di folder project
cd "d:\DaVinci\Web Development\integrated-blockchain"

# 2. Jalankan skrip master startup (Otomatis start DB 2025, Proxy 2026, dan 6 Dashboard)
powershell -ExecutionPolicy Bypass -File "start-all.ps1"
```

---

## 🔍 Skrip Pemeriksaan Kesehatan (Health Check)

Untuk memverifikasi bahwa seluruh 8 port beroperasi dengan normal:
```bash
node scripts/check_all_ports.js
```

*Contoh Output:*
```text
=== HEALTH CHECK FOR ALL 8 PORTS ===
Port 2025 (PostgreSQL DB Engine) : ONLINE (Latency: 15ms | Tables: 35)
Port 2026 (Proxy API Server)     : ONLINE (200 OK | Latency: 8ms)
Port 2020 (Transparansi Publik)  : ONLINE (200 OK | Latency: 42ms)
Port 2021 (Dashboard Kementerian): ONLINE (200 OK | Latency: 45ms)
Port 2022 (Dashboard Bank)       : ONLINE (200 OK | Latency: 58ms)
Port 2023 (Dashboard Auditor)    : ONLINE (200 OK | Latency: 64ms)
Port 2024 (Institusi Pendidikan) : ONLINE (200 OK | Latency: 58ms)
Port 2027 (Dashboard APBD Prov)  : ONLINE (200 OK | Latency: 48ms)
```

---

## ❓ FAQ & Troubleshooting

1. **Bagaimana jika port PostgreSQL saya adalah 5432, bukan 2025?**
   - Proxy API mendukung environment variable `DATABASE_URL`. Cukup jalankan proxy dengan:
     ```bash
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres node proxy/proxy.js
     ```
2. **Apakah database dump sudah mencakup seluruh data sekolah se-Indonesia?**
   - **Ya.** `database_dump.sql.gz` mencakup master data 38 provinsi, 514 kabupaten/kota, 367.865 institusi pendidikan (Universitas, SMA, SMP, SD, PAUD), data multi-sumber dana (APBN, APBD, CSR), rekening koran bank, serta log audit deteksi anomali.
3. **Mengapa tahun 2027 menampilkan angka pengeluaran Rp 0?**
   - Tahun anggaran 2027 adalah tahun anggaran perencanaan (draft). Belanja bernilai Rp 0, dan saldo rekening bank merupakan sisa akumulasi kas tahun 2026 (*Carry-Forward*).
