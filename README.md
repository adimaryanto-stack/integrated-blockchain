# 🏛️ Integrated Blockchain - Transparansi Anggaran Pendidikan

Sistem dasbor terintegrasi berbasis blockchain untuk transparansi anggaran pendidikan Indonesia. Terdiri dari **5 dashboard** untuk peran berbeda (Publik, Kementerian, Bank, Auditor, Institusi Pendidikan) dan **1 database** PostgreSQL sebagai sumber data tunggal.

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

| Port   | Layanan                           | Teknologi       |
| ------ | --------------------------------- | --------------- |
| `2025` | PostgreSQL Database               | PostgreSQL 16   |
| `2026` | Proxy API Server                  | Node.js/Express |
| `2020` | Dashboard Transparansi Publik     | Next.js 16      |
| `2021` | Dashboard Kementerian             | Next.js 16      |
| `2022` | Dashboard Bank                    | Next.js 16      |
| `2023` | Dashboard Auditor                 | Next.js 16      |
| `2024` | Dashboard Institusi Pendidikan    | Next.js 16      |

---

## 🛠️ Prasyarat (Prerequisites)

Pastikan perangkat lunak berikut sudah terinstal:

| Software       | Versi Minimum | Cek Instalasi          |
| -------------- | ------------- | ---------------------- |
| **Node.js**    | 20.x          | `node --version`       |
| **npm**        | 10.x          | `npm --version`        |
| **PostgreSQL** | 16.x          | `psql --version`       |
| **Git**        | 2.x           | `git --version`        |

### Instalasi Cepat Prasyarat

<details>
<summary><b>🐧 Ubuntu / Debian</b></summary>

```bash
# Update sistem
sudo apt update && sudo apt upgrade -y

# Instal Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instal PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16

# Instal Git
sudo apt install -y git
```
</details>

<details>
<summary><b>🪟 Windows</b></summary>

- **Node.js**: Download dari https://nodejs.org (pilih LTS)
- **PostgreSQL**: Download dari https://www.postgresql.org/download/windows/
- **Git**: Download dari https://git-scm.com/download/win
</details>

<details>
<summary><b>🍎 macOS</b></summary>

```bash
# Menggunakan Homebrew
brew install node@20 postgresql@16 git
brew services start postgresql@16
```
</details>

---

## 🚀 Instalasi Lengkap (Step by Step)

### Langkah 1: Clone Repository

```bash
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain
```

### Langkah 2: Instal Dependensi Root

```bash
npm install
```

### Langkah 3: Instal Dependensi Setiap Dashboard

```bash
# Dashboard Transparansi Publik
cd apps/transparansi-anggaran/apps/web-next && npm install && cd ../../../..

# Dashboard Kementerian
cd apps/dashboard-kementerian && npm install && cd ../..

# Dashboard Bank
cd apps/dashboard-bank && npm install && cd ../..

# Dashboard Auditor
cd apps/dashboard-auditor && npm install && cd ../..

# Dashboard Institusi Pendidikan
cd apps/dashboard-institusi-pendidikan && npm install && cd ../..

# Proxy API
cd proxy && npm install && cd ..
```

Atau jalankan semuanya sekaligus:

```bash
npm install && \
  npm install --prefix apps/transparansi-anggaran/apps/web-next && \
  npm install --prefix apps/dashboard-kementerian && \
  npm install --prefix apps/dashboard-bank && \
  npm install --prefix apps/dashboard-auditor && \
  npm install --prefix apps/dashboard-institusi-pendidikan && \
  npm install --prefix proxy
```

### Langkah 4: Setup Database PostgreSQL

#### 4a. Konfigurasi PostgreSQL agar berjalan di port 2025

<details>
<summary><b>🐧 Linux</b></summary>

```bash
# Edit konfigurasi PostgreSQL
sudo nano /etc/postgresql/16/main/postgresql.conf

# Ubah baris berikut:
#   port = 5432
# Menjadi:
#   port = 2025

# Restart PostgreSQL
sudo systemctl restart postgresql
```
</details>

<details>
<summary><b>🪟 Windows</b></summary>

Jika Anda menggunakan PostgreSQL portable (sudah ada di folder `pgsql/`), jalankan saja skrip startup. Jika menggunakan PostgreSQL terinstal, ubah port di `postgresql.conf`:
```
C:\Program Files\PostgreSQL\16\data\postgresql.conf
# Ubah: port = 5432 → port = 2025
```
Lalu restart service PostgreSQL dari Services Manager.
</details>

#### 4b. Buat Database dan Terapkan Skema

```bash
# Masuk ke PostgreSQL
psql -U postgres -h 127.0.0.1 -p 2025

# Di dalam psql console, jalankan:
```

```sql
-- 1. Buat skema prasyarat
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY,
    email TEXT
);

CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID AS $$
    SELECT null::uuid;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB AS $$
    SELECT '{}'::jsonb;
$$ LANGUAGE SQL STABLE;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END
$$;
```

```bash
# 2. Terapkan migration files (satu per satu secara berurutan)
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/supabase/migrations/20260307142221_create_apbn_yearly_data.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/supabase/migrations/20260402000000_full_schema.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/supabase/migrations/20260407130000_create_allocations_tables.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/supabase/migrations/20260407150000_add_flag_and_warning.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/supabase/migrations/20260407152400_sprint3_audit_columns.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/supabase/migrations/20260616130000_audit_logs_policies.sql

# 3. Terapkan skema utama
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/supabase_schema.sql
```

#### 4c. Impor Data Wilayah & Sekolah

```bash
# Impor data provinsi, kabupaten, kecamatan, desa
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/01_provinces.sql
psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/02_regencies.sql

# Impor kecamatan (8 file)
for i in 01 02 03 04 05 06 07 08; do
  psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/03_districts_${i}.sql
done

# Impor desa (42 file)
for i in $(seq -w 1 42); do
  psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f apps/transparansi-anggaran/data/sql/04_villages_${i}.sql
done
```

> **Catatan**: Untuk impor data transaksi sekolah per provinsi, jalankan file SQL batch di folder `data/sql/compact_*`. Contoh untuk Lampung:
> ```bash
> for f in apps/transparansi-anggaran/data/sql/compact_lampung/batch_*.sql; do
>   psql -U postgres -h 127.0.0.1 -p 2025 -d postgres -f "$f"
> done
> ```

### Langkah 5: Konfigurasi Environment Variables

Setiap dashboard membutuhkan file `.env.local` yang mengarah ke Proxy API.

```bash
# Buat .env.local untuk setiap dashboard
# Ganti localhost dengan IP server Anda jika dashboard dan database di VPS berbeda

# Dashboard Transparansi Publik
cat > apps/transparansi-anggaran/apps/web-next/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
EOF

# Dashboard Kementerian
cat > apps/dashboard-kementerian/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
EOF

# Dashboard Bank
cat > apps/dashboard-bank/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
EOF

# Dashboard Auditor
cat > apps/dashboard-auditor/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
DATABASE_URL=postgresql://postgres@localhost:2025/postgres
EOF

# Dashboard Institusi Pendidikan
cat > apps/dashboard-institusi-pendidikan/.env.local << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-key
DATABASE_URL=postgresql://postgres@localhost:2025/postgres
EOF
```

> ⚠️ **Jika database dan dashboard di VPS berbeda**, ganti `localhost` dengan IP VPS database, misalnya:
> ```
> NEXT_PUBLIC_SUPABASE_URL=http://103.xxx.xxx.xxx:2026
> ```

### Langkah 6: Jalankan Semua Layanan

#### Opsi A: Jalankan Satu Per Satu (Masing-Masing Terminal)

```bash
# Terminal 1 - Proxy API (port 2026)
node proxy/proxy.js

# Terminal 2 - Dashboard Transparansi Publik (port 2020)
cd apps/transparansi-anggaran/apps/web-next && npm run dev -- --port 2020

# Terminal 3 - Dashboard Kementerian (port 2021)
cd apps/dashboard-kementerian && npm run dev -- --port 2021

# Terminal 4 - Dashboard Bank (port 2022)
cd apps/dashboard-bank && npm run dev -- --port 2022

# Terminal 5 - Dashboard Auditor (port 2023)
cd apps/dashboard-auditor && npm run dev -- --port 2023

# Terminal 6 - Dashboard Institusi Pendidikan (port 2024)
cd apps/dashboard-institusi-pendidikan && npm run dev -- --port 2024
```

#### Opsi B: Jalankan via npm scripts dari Root

```bash
# Masing-masing di terminal terpisah:
npm run dev:db          # Proxy API (:2026)
npm run dev:public      # Dashboard Publik (:2020)
npm run dev:kementerian # Dashboard Kementerian (:2021)
npm run dev:bank        # Dashboard Bank (:2022)
npm run dev:auditor     # Dashboard Auditor (:2023)
npm run dev:institusi   # Dashboard Institusi (:2024)
```

#### Opsi C: Windows PowerShell (Otomatis Semua)

```powershell
# Jalankan skrip startup (Windows only)
powershell -ExecutionPolicy Bypass -File start-all.ps1
```

---

## 🌐 Deploy ke VPS Produksi

Untuk deployment di server produksi, gunakan **PM2** sebagai process manager agar semua layanan berjalan di background dan auto-restart.

### 1. Instal PM2

```bash
sudo npm install -g pm2
```

### 2. Build Semua Dashboard

```bash
cd apps/transparansi-anggaran/apps/web-next && npm run build && cd ../../../..
cd apps/dashboard-kementerian && npm run build && cd ../..
cd apps/dashboard-bank && npm run build && cd ../..
cd apps/dashboard-auditor && npm run build && cd ../..
cd apps/dashboard-institusi-pendidikan && npm run build && cd ../..
```

### 3. Jalankan dengan PM2

```bash
# Proxy API
pm2 start proxy/proxy.js --name "proxy-api"

# Dashboard Transparansi Publik
pm2 start npm --name "dashboard-publik" --cwd apps/transparansi-anggaran/apps/web-next -- run start -- --port 2020

# Dashboard Kementerian
pm2 start npm --name "dashboard-kementerian" --cwd apps/dashboard-kementerian -- run start -- --port 2021

# Dashboard Bank
pm2 start npm --name "dashboard-bank" --cwd apps/dashboard-bank -- run start -- --port 2022

# Dashboard Auditor
pm2 start npm --name "dashboard-auditor" --cwd apps/dashboard-auditor -- run start -- --port 2023

# Dashboard Institusi Pendidikan
pm2 start npm --name "dashboard-institusi" --cwd apps/dashboard-institusi-pendidikan -- run start -- --port 2024

# Simpan konfigurasi PM2 agar auto-start setelah reboot
pm2 save
pm2 startup
```

### 4. Konfigurasi Nginx (Reverse Proxy + SSL)

Contoh konfigurasi Nginx untuk satu dashboard:

```nginx
server {
    listen 80;
    server_name anggaran.domain.com;

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
# Aktifkan HTTPS dengan Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d anggaran.domain.com
```

### 5. Buka Firewall

```bash
# Buka port yang diperlukan
sudo ufw allow 2020:2026/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 🗂️ Struktur Folder

```
integrated-blockchain/
├── apps/
│   ├── transparansi-anggaran/         # Modul utama transparansi
│   │   ├── apps/web-next/             # Dashboard Publik (Next.js, port 2020)
│   │   ├── data/                      # Data JSON & SQL sekolah seluruh Indonesia
│   │   │   ├── sql/                   # SQL seed: provinsi, kabupaten, kecamatan, desa
│   │   │   │   ├── 01_provinces.sql
│   │   │   │   ├── 02_regencies.sql
│   │   │   │   ├── 03_districts_*.sql
│   │   │   │   ├── 04_villages_*.sql
│   │   │   │   └── compact_*/         # Data transaksi sekolah per provinsi
│   │   │   └── schools_*.json         # Data sekolah resmi Dapodik/Saindikti
│   │   └── supabase/migrations/       # File migrasi skema database
│   ├── dashboard-kementerian/         # Dashboard Kementerian (port 2021)
│   ├── dashboard-bank/                # Dashboard Bank (port 2022)
│   ├── dashboard-auditor/             # Dashboard Auditor (port 2023)
│   └── dashboard-institusi-pendidikan/# Dashboard Institusi (port 2024)
├── proxy/                             # Proxy API Server (port 2026)
│   └── proxy.js                       # REST API proxy (Express.js → PostgreSQL)
├── scripts/                           # Skrip setup dan konfigurasi
│   ├── setup-database.ps1             # Setup database otomatis (Windows)
│   └── update-envs.ps1                # Update semua file .env sekaligus
├── deploy_guide.md                    # Panduan deployment VPS (detail)
├── start-all.ps1                      # Startup script Windows (semua layanan)
├── package.json                       # Root package dengan npm scripts
└── README.md                          # Dokumen ini
```

---

## 🔍 Verifikasi Instalasi

Setelah semua layanan berjalan, buka browser dan akses:

| Dashboard                  | URL                      |
| -------------------------- | ------------------------ |
| Transparansi Publik        | http://localhost:2020     |
| Dashboard Kementerian      | http://localhost:2021     |
| Dashboard Bank             | http://localhost:2022     |
| Dashboard Auditor          | http://localhost:2023     |
| Dashboard Institusi        | http://localhost:2024     |
| Proxy API (health check)   | http://localhost:2026     |

Untuk verifikasi database:
```bash
psql -U postgres -h 127.0.0.1 -p 2025 -c "SELECT COUNT(*) FROM schools;"
# Output yang diharapkan: ~468,000+ baris
```

---

## 🔧 Troubleshooting

<details>
<summary><b>Port sudah digunakan (EADDRINUSE)</b></summary>

```bash
# Cek proses yang menggunakan port
lsof -i :2020  # Linux/macOS
netstat -ano | findstr :2020  # Windows

# Matikan proses yang menempati port
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```
</details>

<details>
<summary><b>Database connection refused</b></summary>

- Pastikan PostgreSQL berjalan di port 2025:
  ```bash
  psql -U postgres -h 127.0.0.1 -p 2025 -c "SELECT 1;"
  ```
- Periksa `postgresql.conf` → pastikan `port = 2025`
- Periksa `pg_hba.conf` → pastikan ada entri `host all all 127.0.0.1/32 trust`
</details>

<details>
<summary><b>Dashboard menampilkan "sekolah tidak diketahui"</b></summary>

- Pastikan data sekolah sudah diimpor ke tabel `schools`
- Pastikan file `.env.local` mengarah ke Proxy API yang benar
- Restart dashboard setelah mengubah `.env.local`
</details>

<details>
<summary><b>Proxy API mengembalikan error 500</b></summary>

- Pastikan environment variable `DATABASE_URL` sesuai:
  ```
  DATABASE_URL=postgresql://postgres@localhost:2025/postgres
  ```
- Cek log proxy: `pm2 logs proxy-api`
</details>

---

## 📝 Lisensi

MIT License - Lihat file [LICENSE](LICENSE) untuk detail.
