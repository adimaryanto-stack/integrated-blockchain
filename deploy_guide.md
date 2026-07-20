# Panduan Penyebaran (Deployment Guide) - Integrated Blockchain Anggaran

Dokumen ini berisi panduan teknis langkah demi langkah untuk melakukan instalasi dan konfigurasi setiap komponen sistem (database, proxy, dan 5 dashboard aplikasi) pada beberapa VPS terpisah atau terpadu.

---

## 📌 Gambaran Umum Port & Layanan

Sistem terdistribusi ini berjalan pada port-port berikut:
*   **Port 2025**: PostgreSQL Database Server (Pusat Data)
*   **Port 2026**: Node.js Proxy API (Menghubungkan PostgREST ke klien/dashboard)
*   **Port 2020**: Aplikasi Transparansi Publik (Next.js)
*   **Port 2021**: Dashboard Kementerian (Next.js)
*   **Port 2022**: Dashboard Bank (Next.js)
*   **Port 2023**: Dashboard Auditor (Next.js)
*   **Port 2024**: Dashboard Institusi Pendidikan (Next.js)
*   *Layanan Pendukung*: **Port 3005** (PostgREST API Engine)

---

## 🏗️ Bagian 1: Instalasi VPS Database & Proxy (Port 2025, 2026 & 3005)

Direkomendasikan menggunakan satu VPS khusus berkinerja tinggi untuk database dan proxy API agar latensi query minimal.

### Langkah 1: Persiapan OS & Dependensi (Ubuntu/Debian)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx

# Instal Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instal PM2 secara global
sudo npm install -y pm2 -g
```

### Langkah 2: Instalasi & Konfigurasi PostgreSQL (Port 2025)
```bash
# Instal PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-client-16

# Konfigurasi agar PostgreSQL berjalan di port 2025
sudo nano /etc/postgresql/16/main/postgresql.conf
# Cari baris: port = 5432
# Ubah menjadi: port = 2025

# Izinkan akses jaringan jika proxy dipisah (jika di satu VPS, biarkan localhost)
# Cari baris: listen_addresses = 'localhost'
# Ubah menjadi: listen_addresses = '*' (untuk memperbolehkan koneksi luar)

# Konfigurasi hak akses (pg_hba.conf)
sudo nano /etc/postgresql/16/main/pg_hba.conf
# Tambahkan baris di paling bawah untuk mengizinkan akses dari VPS Proxy/Klien:
# host    all             all             0.0.0.0/0               scram-sha-256

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Langkah 3: Membuat Database & Seed Data
Masuk ke terminal PostgreSQL dan jalankan setup skema:
```bash
sudo -u postgres psql -p 2025

# Di dalam psql console:
CREATE DATABASE integrated_blockchain;
\c integrated_blockchain;

# Terapkan skema tabel dan seed awal (ambil dari repositori /supabase/migrations)
# Catatan: Anda dapat mengimpor file `supabase_schema.sql` dan file sql batch migrasi lainnya:
# psql -U postgres -d integrated_blockchain -p 2025 -f apps/transparansi-anggaran/supabase_schema.sql
```

### Langkah 4: Instalasi & Konfigurasi PostgREST (Port 3005)
PostgREST menerjemahkan query database langsung menjadi REST API.
```bash
# Download binary PostgREST terbaru
wget https://github.com/PostgREST/postgrest/releases/download/v12.2.0/postgrest-v12.2.0-linux-static-x64.tar.xz
tar -xf postgrest-v12.2.0-linux-static-x64.tar.xz
sudo mv postgrest /usr/local/bin/

# Buat berkas konfigurasi `postgrest.conf`
nano postgrest.conf
```
Isi dari `postgrest.conf`:
```ini
db-uri = "postgres://postgres:PASSWORD_ANDA@127.0.0.1:2025/integrated_blockchain"
db-schema = "public"
db-anon-role = "postgres"
server-port = 3005
server-host = "127.0.0.1"
```
Jalankan PostgREST menggunakan PM2:
```bash
pm2 start postgrest -- postgrest.conf --name "postgrest-service"
```

### Langkah 5: Konfigurasi & Menjalankan Proxy API (Port 2026)
Proxy ini berfungsi menerjemahkan format request Supabase SDK ke format native PostgREST.
```bash
# Masuk ke folder proxy di repo
cd /path/to/integrated-blockchain/proxy

# Instal dependensi & jalankan dengan PM2
npm install
pm2 start proxy.js --name "api-proxy"
```

---

## 💻 Bagian 2: Instalasi VPS Dashboard Klien (Port 2020 - 2024)

Setiap dashboard dapat di-deploy pada VPS tersendiri. Langkah berikut wajib dilakukan pada masing-masing VPS klien.

### Langkah 1: Kloning Kode Sumber & Instal Dependensi
```bash
git clone https://github.com/adimaryanto-stack/integrated-blockchain.git
cd integrated-blockchain
npm install
```

### Langkah 2: Konfigurasi `.env.local`
Buat berkas `.env.local` pada folder masing-masing aplikasi (misal: `apps/transparansi-anggaran/apps/web-next/` atau `apps/dashboard-kementerian/`).
```env
# Alamat URL mengarah ke VPS Proxy API (Port 2026)
NEXT_PUBLIC_SUPABASE_URL=http://IP_VPS_PROXY:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-placeholder
SUPABASE_SERVICE_ROLE_KEY=your-service-role-placeholder
```

### Langkah 3: Build & Menjalankan Aplikasi Klien dengan PM2

#### 1. VPS Transparansi Publik (Port 2020)
```bash
cd apps/transparansi-anggaran/apps/web-next
npm run build
pm2 start npm --name "dashboard-publik" -- run start -- --port 2020
```

#### 2. VPS Dashboard Kementerian (Port 2021)
```bash
cd apps/dashboard-kementerian
npm run build
pm2 start npm --name "dashboard-kementerian" -- run start -- --port 2021
```

#### 3. VPS Dashboard Bank (Port 2022)
```bash
cd apps/dashboard-bank
npm run build
pm2 start npm --name "dashboard-bank" -- run start -- --port 2022
```

#### 4. VPS Dashboard Auditor (Port 2023)
```bash
cd apps/dashboard-auditor
npm run build
pm2 start npm --name "dashboard-auditor" -- run start -- --port 2023
```

#### 5. VPS Dashboard Institusi Pendidikan (Port 2024)
```bash
cd apps/dashboard-institusi-pendidikan
npm run build
pm2 start npm --name "dashboard-institusi" -- run start -- --port 2024
```

---

## 🔒 Bagian 3: Konfigurasi Keamanan & Reverse Proxy Nginx + SSL

Agar aplikasi dapat diakses publik dengan aman melalui domain HTTPS (misal: `https://anggaran.domain.com`), lakukan konfigurasi Nginx pada setiap VPS klien.

### Konfigurasi Nginx Server Block (`/etc/nginx/sites-available/default`)
```nginx
server {
    listen 80;
    server_name anggaran.domain.com; # Ubah dengan domain Anda

    location / {
        proxy_pass http://127.0.0.1:2020; # Sesuaikan port dashboard di VPS ini (2020-2024)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Uji dan muat ulang Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### Memasang SSL Gratis Let's Encrypt
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d anggaran.domain.com
```

---

## 🛡️ Bagian 4: Pemeliharaan (Maintenance) & Log
Untuk memantau kesehatan aplikasi pada masing-masing VPS:
*   Melihat status server PM2: `pm2 status`
*   Melihat log live: `pm2 logs`
*   Menghidupkan ulang servis jika ada perubahan kode: `pm2 restart all`
