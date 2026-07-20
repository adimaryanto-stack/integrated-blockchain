# 🏛️ Integrated Blockchain - Transparansi Anggaran Pendidikan

Sistem dasbor terintegrasi berbasis blockchain untuk transparansi anggaran pendidikan Indonesia. Terdiri dari **5 dashboard** untuk peran berbeda dan **1 database** PostgreSQL sebagai sumber data tunggal.

> **💡 Anda tidak perlu menginstal semuanya.** Pilih dashboard yang Anda butuhkan, lalu ikuti panduan di bagian tersebut. Setiap dashboard dapat berjalan sendiri di VPS masing-masing — yang wajib hanya **Database + Proxy API**.

---

## 📌 Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                    DATABASE & API LAYER                       │
│                                                              │
│   PostgreSQL (:2025)  ──▶  Proxy API (:2026)                │
│   (Sumber Data)            (REST API untuk semua dashboard)  │
└──────────────────┬───────────────────────────────────────────┘
                   │
     ┌─────────────┼─────────────────────────────────┐
     │             │             │           │        │
     ▼             ▼             ▼           ▼        ▼
 ┌────────┐  ┌──────────┐ ┌────────┐ ┌────────┐ ┌─────────┐
 │ Publik │  │Kementerian│ │  Bank  │ │Auditor │ │Institusi│
 │ :2020  │  │  :2021   │ │ :2022  │ │ :2023  │ │  :2024  │
 └────────┘  └──────────┘ └────────┘ └────────┘ └─────────┘
```

| Port   | Layanan                           | Teknologi       | Folder                                          |
| ------ | --------------------------------- | --------------- | ----------------------------------------------- |
| `2025` | PostgreSQL Database               | PostgreSQL 16   | *(system service)*                               |
| `2026` | Proxy API Server                  | Node.js/Express | `proxy/`                                         |
| `2020` | Dashboard Transparansi Publik     | Next.js 16      | `apps/transparansi-anggaran/apps/web-next/`      |
| `2021` | Dashboard Kementerian             | Next.js 16      | `apps/dashboard-kementerian/`                    |
| `2022` | Dashboard Bank                    | Next.js 16      | `apps/dashboard-bank/`                           |
| `2023` | Dashboard Auditor                 | Next.js 16      | `apps/dashboard-auditor/`                        |
| `2024` | Dashboard Institusi Pendidikan    | Next.js 16      | `apps/dashboard-institusi-pendidikan/`            |

---

## 🛠️ Prasyarat

| Software       | Versi Minimum | Cek Instalasi          |
| -------------- | ------------- | ---------------------- |
| **Node.js**    | 20.x          | `node --version`       |
| **npm**        | 10.x          | `npm --version`        |
| **PostgreSQL** | 16.x          | `psql --version`       |
| **Git**        | 2.x           | `git --version`        |

---

# 🗄️ BAGIAN A: Instalasi Database + Proxy API (WAJIB)

> **Ini adalah langkah pertama yang harus dilakukan sebelum menginstal dashboard manapun.** Database dan Proxy API adalah tulang punggung seluruh sistem.

## A1. Instal PostgreSQL di VPS

<details>
<summary><b>🐧 Ubuntu 22.04 / 24.04 (Recommended)</b></summary>

```bash
# 1. Update sistem
sudo apt update && sudo apt upgrade -y

# 2. Tambahkan repository resmi PostgreSQL
sudo apt install -y wget gnupg2
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# 3. Instal PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16

# 4. Verifikasi instalasi
sudo systemctl status postgresql
psql --version
# Output: psql (PostgreSQL) 16.x
```
</details>

<details>
<summary><b>🐧 CentOS / Rocky Linux / AlmaLinux</b></summary>

```bash
# 1. Tambahkan repository resmi PostgreSQL
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-9-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo dnf module disable postgresql -y

# 2. Instal PostgreSQL 16
sudo dnf install -y postgresql16 postgresql16-server

# 3. Inisialisasi database
sudo /usr/pgsql-16/bin/postgresql-16-setup initdb

# 4. Aktifkan dan mulai service
sudo systemctl enable postgresql-16
sudo systemctl start postgresql-16
```
</details>

<details>
<summary><b>🪟 Windows</b></summary>

1. Download installer dari https://www.postgresql.org/download/windows/
2. Jalankan installer, pilih PostgreSQL 16
3. Saat diminta port, masukkan **2025**
4. Catat password superuser yang Anda buat
5. Selesaikan instalasi
</details>

## A2. Konfigurasi PostgreSQL (Port 2025)

<details>
<summary><b>🐧 Linux</b></summary>

```bash
# 1. Ubah port PostgreSQL dari 5432 ke 2025
sudo nano /etc/postgresql/16/main/postgresql.conf
```

Cari dan ubah baris berikut:
```ini
# Sebelum:
#port = 5432

# Sesudah:
port = 2025
```

Masih di file yang sama, ubah `listen_addresses` agar bisa diakses dari VPS lain:
```ini
# Sebelum:
#listen_addresses = 'localhost'

# Sesudah (jika dashboard di VPS terpisah):
listen_addresses = '*'
```

```bash
# 2. Izinkan koneksi dari luar (jika dashboard di VPS lain)
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Tambahkan baris ini di paling bawah:
```
# Izinkan koneksi dari semua IP (untuk VPS dashboard)
host    all    all    0.0.0.0/0    scram-sha-256
```

```bash
# 3. Set password untuk user postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'password_anda';"

# 4. Restart PostgreSQL
sudo systemctl restart postgresql

# 5. Verifikasi koneksi
psql -U postgres -h 127.0.0.1 -p 2025 -c "SELECT version();"
```
</details>

<details>
<summary><b>🪟 Windows</b></summary>

Jika saat instalasi Anda sudah memasukkan port 2025, langkah ini sudah selesai. Jika belum:

1. Buka file `C:\Program Files\PostgreSQL\16\data\postgresql.conf`
2. Ubah `port = 5432` menjadi `port = 2025`
3. Restart service PostgreSQL dari **Services Manager** (services.msc)
</details>

## A3. Buat Skema Database

Langkah ini membuat semua tabel yang dibutuhkan oleh seluruh dashboard.

```bash
# 1. Clone repository (jika belum)
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain
```

### Langkah 3a: Buat prasyarat skema

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -c "
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    email TEXT
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS \$\$
    SELECT null::uuid;
\$\$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS \$\$
    SELECT '{}'::jsonb;
\$\$ LANGUAGE SQL STABLE;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS uuid-ossp;

DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
\$\$;
"
```

### Langkah 3b: Terapkan migration — Data APBN Tahunan

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/supabase/migrations/20260307142221_create_apbn_yearly_data.sql
```

### Langkah 3c: Terapkan migration — Skema Utama (tabel inti)

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/supabase/migrations/20260402000000_full_schema.sql
```

### Langkah 3d: Terapkan migration — Tabel Alokasi Anggaran

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/supabase/migrations/20260407130000_create_allocations_tables.sql
```

### Langkah 3e: Terapkan migration — Flag dan Warning

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/supabase/migrations/20260407150000_add_flag_and_warning.sql
```

### Langkah 3f: Terapkan migration — Kolom Audit

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/supabase/migrations/20260407152400_sprint3_audit_columns.sql
```

### Langkah 3g: Terapkan migration — Kebijakan Audit Log

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/supabase/migrations/20260616130000_audit_logs_policies.sql
```

### Langkah 3h: Terapkan skema tambahan

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/supabase_schema.sql
```

## A4. Impor Data Wilayah & Sekolah

### Langkah 4a: Impor data provinsi

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/data/sql/01_provinces.sql
```

### Langkah 4b: Impor data kabupaten/kota

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
  -f apps/transparansi-anggaran/data/sql/02_regencies.sql
```

### Langkah 4c: Impor data kecamatan (8 file)

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_01.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_02.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_03.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_04.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_05.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_06.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_07.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_08.sql
```

### Langkah 4d: Impor data desa (42 file)

```bash
# Jalankan satu per satu, atau gunakan loop:
for i in $(seq -w 1 42); do
  psql -U postgres -h 127.0.0.1 -p 2025 -d postgres \
    -f apps/transparansi-anggaran/data/sql/04_villages_${i}.sql
done
```

### Langkah 4e: Impor data transaksi sekolah per provinsi (opsional)

Setiap provinsi punya folder `compact_*` berisi data transaksi. Impor sesuai kebutuhan:

```bash
# Contoh: Impor data transaksi Lampung
for f in apps/transparansi-anggaran/data/sql/compact_lampung/batch_*.sql; do
  psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f "$f"
done

# Contoh: Impor data transaksi Jawa Barat
for f in apps/transparansi-anggaran/data/sql/compact_jawa_barat/batch_*.sql; do
  psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f "$f"
done
```

### Langkah 4f: Verifikasi database

```bash
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -c "SELECT COUNT(*) FROM schools;"
# Output yang diharapkan: ~468,000+ baris
```

## A5. Jalankan Proxy API (Port 2026)

Proxy API wajib berjalan karena semua dashboard mengambil data melalui proxy ini.

```bash
# 1. Masuk ke folder proxy
cd proxy

# 2. Instal dependensi
npm install

# 3. Jalankan proxy
node proxy.js
# Output: [Proxy] Listening on port 2026
```

> **Untuk produksi**, gunakan PM2 agar berjalan di background:
> ```bash
> npm install -g pm2
> pm2 start proxy.js --name "proxy-api"
> pm2 save && pm2 startup
> ```

---

# 💻 BAGIAN B: Instalasi Dashboard (Pilih Salah Satu atau Semua)

> **Penting:** Pastikan **Bagian A (Database + Proxy)** sudah selesai sebelum melanjutkan.
>
> Anda hanya perlu menginstal dashboard yang dibutuhkan. Setiap dashboard **berdiri sendiri** — Anda cukup menggunakan **1 folder** saja untuk 1 dashboard.

---

## B1. 📊 Dashboard Transparansi Publik (Port 2020)

Dashboard utama untuk masyarakat umum. Menampilkan data anggaran, peta distribusi, dan transparansi pengeluaran.

**Folder:** `apps/transparansi-anggaran/apps/web-next/`

### Instalasi

```bash
# 1. Masuk ke folder dashboard
cd apps/transparansi-anggaran/apps/web-next

# 2. Instal dependensi
npm install

# 3. Buat file .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
EOF

# 4. Jalankan (development)
npm run dev -- --port 2020
```

### Deploy Produksi (VPS)

```bash
cd apps/transparansi-anggaran/apps/web-next
npm run build
pm2 start npm --name "dashboard-publik" -- run start -- --port 2020
```

### Verifikasi

Buka browser → http://localhost:2020

---

## B2. 🏢 Dashboard Kementerian (Port 2021)

Dashboard untuk pihak kementerian. Menampilkan ringkasan alokasi, ekspor data Excel, dan monitoring.

**Folder:** `apps/dashboard-kementerian/`

### Instalasi

```bash
# 1. Masuk ke folder dashboard
cd apps/dashboard-kementerian

# 2. Instal dependensi
npm install

# 3. Buat file .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
EOF

# 4. Jalankan (development)
npm run dev -- --port 2021
```

### Deploy Produksi (VPS)

```bash
cd apps/dashboard-kementerian
npm run build
pm2 start npm --name "dashboard-kementerian" -- run start -- --port 2021
```

### Verifikasi

Buka browser → http://localhost:2021

---

## B3. 🏦 Dashboard Bank (Port 2022)

Dashboard untuk pihak perbankan. Menampilkan aliran dana, rekonsiliasi, dan laporan keuangan.

**Folder:** `apps/dashboard-bank/`

### Instalasi

```bash
# 1. Masuk ke folder dashboard
cd apps/dashboard-bank

# 2. Instal dependensi
npm install

# 3. Buat file .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
EOF

# 4. Jalankan (development)
npm run dev -- --port 2022
```

### Deploy Produksi (VPS)

```bash
cd apps/dashboard-bank
npm run build
pm2 start npm --name "dashboard-bank" -- run start -- --port 2022
```

### Verifikasi

Buka browser → http://localhost:2022

---

## B4. 🔍 Dashboard Auditor (Port 2023)

Dashboard untuk auditor/BPK. Menampilkan anomali, log audit, dan sistem peringatan dini.

**Folder:** `apps/dashboard-auditor/`

### Instalasi

```bash
# 1. Masuk ke folder dashboard
cd apps/dashboard-auditor

# 2. Instal dependensi
npm install

# 3. Buat file .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
DATABASE_URL=postgresql://postgres@localhost:2025/postgres
EOF

# 4. Jalankan (development)
npm run dev -- --port 2023
```

### Deploy Produksi (VPS)

```bash
cd apps/dashboard-auditor
npm run build
pm2 start npm --name "dashboard-auditor" -- run start -- --port 2023
```

### Verifikasi

Buka browser → http://localhost:2023

---

## B5. 🎓 Dashboard Institusi Pendidikan (Port 2024)

Dashboard untuk institusi pendidikan (sekolah/universitas). Menampilkan detail anggaran, OCR bukti transfer, dan pelaporan.

**Folder:** `apps/dashboard-institusi-pendidikan/`

### Instalasi

```bash
# 1. Masuk ke folder dashboard
cd apps/dashboard-institusi-pendidikan

# 2. Instal dependensi
npm install

# 3. Buat file .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
DATABASE_URL=postgresql://postgres@localhost:2025/postgres
EOF

# 4. Jalankan (development)
npm run dev -- --port 2024
```

### Deploy Produksi (VPS)

```bash
cd apps/dashboard-institusi-pendidikan
npm run build
pm2 start npm --name "dashboard-institusi" -- run start -- --port 2024
```

### Verifikasi

Buka browser → http://localhost:2024

---

# 🌐 BAGIAN C: Konfigurasi VPS Produksi

## C1. Jika Database dan Dashboard di VPS yang SAMA

Tidak perlu konfigurasi tambahan. Semua `.env.local` menggunakan `localhost`.

## C2. Jika Database dan Dashboard di VPS yang BERBEDA

Ubah `localhost` di `.env.local` menjadi **IP publik VPS database**:

```env
# Contoh: VPS Database beralamat 103.123.45.67
NEXT_PUBLIC_SUPABASE_URL=http://103.123.45.67:2026
```

Pastikan juga:
- Firewall VPS database membuka port `2026` (Proxy API)
- PostgreSQL mengizinkan koneksi dari IP VPS dashboard (lihat `pg_hba.conf`)

## C3. Konfigurasi Nginx (Reverse Proxy + HTTPS)

Instal Nginx di VPS dashboard:

```bash
sudo apt install -y nginx
```

Buat konfigurasi untuk setiap dashboard. Contoh untuk Dashboard Publik:

```bash
sudo nano /etc/nginx/sites-available/dashboard-publik
```

```nginx
server {
    listen 80;
    server_name anggaran.domain.com;  # Ganti dengan domain Anda

    location / {
        proxy_pass http://127.0.0.1:2020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Aktifkan site
sudo ln -s /etc/nginx/sites-available/dashboard-publik /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Pasang SSL (HTTPS) Gratis dengan Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d anggaran.domain.com
```

## C4. Buka Firewall

```bash
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 2026/tcp   # Proxy API (jika dashboard di VPS lain)
sudo ufw enable
```

---

# 🗂️ Struktur Folder

```
integrated-blockchain/
├── apps/
│   ├── transparansi-anggaran/
│   │   ├── apps/web-next/             ← Dashboard Publik (port 2020)
│   │   ├── data/
│   │   │   ├── sql/                   ← SQL seed: provinsi, kabupaten, kecamatan, desa
│   │   │   │   ├── 01_provinces.sql
│   │   │   │   ├── 02_regencies.sql
│   │   │   │   ├── 03_districts_*.sql
│   │   │   │   ├── 04_villages_*.sql
│   │   │   │   └── compact_*/        ← Data transaksi per provinsi
│   │   │   └── schools_*.json        ← Data sekolah resmi Dapodik/Saindikti
│   │   └── supabase/migrations/      ← File migrasi skema database
│   ├── dashboard-kementerian/         ← Dashboard Kementerian (port 2021)
│   ├── dashboard-bank/                ← Dashboard Bank (port 2022)
│   ├── dashboard-auditor/             ← Dashboard Auditor (port 2023)
│   └── dashboard-institusi-pendidikan/← Dashboard Institusi (port 2024)
├── proxy/
│   └── proxy.js                       ← REST API proxy (port 2026)
├── scripts/
│   ├── setup-database.ps1             ← Setup database otomatis (Windows)
│   └── update-envs.ps1                ← Update semua .env sekaligus
├── start-all.ps1                      ← Startup semua layanan (Windows)
├── package.json
└── README.md                          ← Dokumen ini
```

---

# 🔧 Troubleshooting

<details>
<summary><b>Port sudah digunakan (EADDRINUSE)</b></summary>

```bash
# Linux/macOS: cek dan matikan proses di port tertentu
lsof -i :2020
kill -9 <PID>

# Windows:
netstat -ano | findstr :2020
taskkill /PID <PID> /F
```
</details>

<details>
<summary><b>Database connection refused</b></summary>

1. Pastikan PostgreSQL berjalan:
   ```bash
   sudo systemctl status postgresql
   ```
2. Pastikan port 2025 aktif:
   ```bash
   psql -U postgres -h 127.0.0.1 -p 2025 -c "SELECT 1;"
   ```
3. Jika dari VPS lain, pastikan `pg_hba.conf` mengizinkan IP Anda
</details>

<details>
<summary><b>Dashboard menampilkan "sekolah tidak diketahui"</b></summary>

- Data sekolah belum diimpor → jalankan ulang Langkah A4
- File `.env.local` salah alamat → pastikan mengarah ke Proxy API
- Restart dashboard setelah mengubah `.env.local`
</details>

<details>
<summary><b>Proxy API error 500</b></summary>

- Pastikan PostgreSQL berjalan di port 2025
- Cek koneksi: `psql -U postgres -h 127.0.0.1 -p 2025 -c "SELECT 1;"`
- Cek log: `pm2 logs proxy-api`
</details>

<details>
<summary><b>npm install gagal (node-gyp error)</b></summary>

```bash
# Linux: instal build tools
sudo apt install -y build-essential python3

# Windows: instal Visual Studio Build Tools
npm install -g windows-build-tools
```
</details>

---

## 📝 Lisensi

MIT License - Lihat file [LICENSE](LICENSE) untuk detail.
