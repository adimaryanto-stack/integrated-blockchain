# 📖 Panduan Lengkap Instalasi & Deployment (Linux VPS, macOS, & Windows)
## Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia

> **Panduan teknis langkah demi langkah untuk menjalankan masing-masing dari 6 dashboard aplikasi, database PostgreSQL, dan Proxy REST API gateway, serta menghubungkannya ke IP Publik, Custom Domain / Subdomain, dan SSL HTTPS.**

---

## 📌 Peta 9 Port & Direktori Aplikasi

| No | Nama Layanan / Dashboard | Port | Direktori Sumber | Target Domain / Subdomain (Contoh) |
|:---:|---|:---:|---|---|
| **1** | **Portal Transparansi Publik** | `:2020` | `apps/transparansi-anggaran/apps/web-next` | `https://transparansi.domain.com` |
| **2** | **Dashboard Kementerian (APBN)** | `:2021` | `apps/dashboard-kementerian` | `https://kementerian.domain.com` |
| **3** | **Dashboard Bank Penyalur** | `:2022` | `apps/dashboard-bank` | `https://bank.domain.com` |
| **4** | **Dashboard Auditor BPK** | `:2023` | `apps/dashboard-auditor` | `https://auditor.domain.com` |
| **5** | **Dashboard Institusi Pendidikan** | `:2024` | `apps/dashboard-institusi-pendidikan` | `https://sekolah.domain.com` |
| **6** | **Dashboard APBD Provinsi Lampung** | `:2025` | `apps/dashboard-apbd` | `https://apbd.domain.com` |
| **7** | **Dashboard Admin (Super-Console)** | `:2026` | `apps/dashboard-admin` | `https://admin.domain.com` |
| **8** | **Database PostgreSQL 16** | `:2027` | `pgsql/data` / PostgreSQL Server | `postgresql://127.0.0.1:2027/postgres` |
| **9** | **Proxy REST API Server** | `:2028` | `proxy/proxy.js` | `https://api.domain.com` |

---

## 🗄️ Bagian 1: Cara Instalasi & Persiapan PostgreSQL di VPS Linux (Port 2027)

Sistem ini menggunakan basis data **PostgreSQL 16 lokal mandiri (Self-Hosted)**. Seluruh skema tabel (35 tabel relasional) dan data master 367.865 sekolah se-Indonesia tersimpan dalam file **`database_dump.sql.gz`** (48 MB).

### 1.1 Cara Install PostgreSQL di VPS Ubuntu / Debian:
Jalankan perintah berikut di terminal VPS Anda:
```bash
# 1. Update paket dan install PostgreSQL
sudo apt update && sudo apt install -y postgresql postgresql-contrib

# 2. Nyalakan layanan PostgreSQL dan pastikan otomatis aktif saat server restart
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 3. Atur password user 'postgres' menjadi 'postgres'
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE postgres;" 2>/dev/null || true
```

### 1.2 (Opsional) Mengatur Port PostgreSQL ke 2027:
Jika ingin menyesuaikan port PostgreSQL ke `2027` sesuai port bawaan sistem:
```bash
# Ubah port di file konfigurasi PostgreSQL
sudo sed -i "s/port = 5432/port = 2027/g" /etc/postgresql/*/main/postgresql.conf
sudo systemctl restart postgresql
```
*(Catatan: Jika Anda tetap ingin menggunakan port default `5432`, sistem tetap dapat berjalan normal dengan menyetel `DB_PORT=5432`)*.

### 1.3 Restore Database Otomatis (1 Perintah):
```bash
# Ekstrak otomatis & import seluruh 35 tabel (hanya 30-60 detik)
DB_PORT=2027 DB_PASSWORD=postgres node scripts/setup-db.js
```
*Jika menggunakan port 5432, jalankan:* `DB_PORT=5432 DB_PASSWORD=postgres node scripts/setup-db.js`.

---

## ⚙️ Bagian 2: Penjelasan Environment Variable (`.env.local`) — Tanpa Supabase Cloud!

> ⚠️ **PENTING: Apakah Kita Butuh Akun Supabase Cloud? JAWABANNYA: TIDAK SAMA SEKALI!**
>
> Sistem ini **100% Self-Hosted & Mandiri**. Kita **TIDAK PERLU** mendaftar ke Supabase atau membayar layanan cloud pihak ketiga.
> 
> Variabel bernama `NEXT_PUBLIC_SUPABASE_URL` digunakan semata-mata karena aplikasi frontend menggunakan library SDK PostgREST standar untuk terhubung ke **Proxy API Server Lokal Kita Sendiri (Port 2028)**.

### 2.1 Di Mana Lokasi File `.env.local` Berada?
File konfigurasi `.env.local` berada di dalam **masing-masing folder dari 6 aplikasi dashboard**:
1. `apps/transparansi-anggaran/apps/web-next/.env.local`
2. `apps/dashboard-kementerian/.env.local`
3. `apps/dashboard-bank/.env.local`
4. `apps/dashboard-auditor/.env.local`
5. `apps/dashboard-institusi-pendidikan/.env.local`
6. `apps/dashboard-apbd/.env.local`
7. `apps/dashboard-admin/.env` (Untuk Dashboard Admin terhubung ke Proxy)
8. `proxy/.env` (Untuk backend proxy yang menyambungkan ke PostgreSQL)

### 2.2 Cara Otomatis Membuat Semua `.env.local` (Hanya 1 Detik!):
Anda **tidak perlu** membuat atau mengedit file `.env.local` satu per satu secara manual. Cukup jalankan skrip otomatis bawaan sistem:

```bash
# Untuk Localhost (Default http://localhost:2028):
node scripts/setup-env.js

# Untuk VPS dengan IP Publik (Contoh IP: 103.123.45.67):
node scripts/setup-env.js http://103.123.45.67:2028

# Untuk Domain Publik dengan SSL HTTPS (Contoh: api.domain.com):
node scripts/setup-env.js https://api.domain.com
```
*Skrip ini akan otomatis menuliskan konfigurasi yang benar ke seluruh 6 aplikasi sekaligus.*

---

## 🚀 Bagian 3: Menjalankan Masing-Masing Dashboard Secara Mandiri

Anda dapat menjalankan setiap dashboard secara terpisah di terminal atau server yang berbeda:

### 1. Menjalankan Backend Proxy REST API (Port 2028)
```bash
cd proxy
npm install
node proxy.js
# Atau dengan PM2:
pm2 start proxy.js --name "blockchain-proxy-2028"
```

### 2. Menjalankan Portal Transparansi Publik (Port 2020)
```bash
cd apps/transparansi-anggaran/apps/web-next
npm install
npm run build
# Jalankan mode production di port 2020:
npx next start -p 2020
# Atau dengan PM2:
pm2 start npx --name "app-2020-transparansi" -- next start -p 2020
```

### 3. Menjalankan Dashboard Kementerian (Port 2021)
```bash
cd apps/dashboard-kementerian
npm install
npm run build
npx next start -p 2021
# Atau dengan PM2:
pm2 start npx --name "app-2021-kementerian" -- next start -p 2021
```

### 4. Menjalankan Dashboard Bank Penyalur (Port 2022)
```bash
cd apps/dashboard-bank
npm install
npm run build
npx next start -p 2022
# Atau dengan PM2:
pm2 start npx --name "app-2022-bank" -- next start -p 2022
```

### 5. Menjalankan Dashboard Auditor BPK (Port 2023)
```bash
cd apps/dashboard-auditor
npm install
npm run build
npx next start -p 2023
# Atau dengan PM2:
pm2 start npx --name "app-2023-auditor" -- next start -p 2023
```

### 6. Menjalankan Dashboard Institusi Pendidikan (Port 2024)
```bash
cd apps/dashboard-institusi-pendidikan
npm install
npm run build
npx next start -p 2024
# Atau dengan PM2:
pm2 start npx --name "app-2024-institusi" -- next start -p 2024
```

### 7. Menjalankan Dashboard APBD Provinsi Lampung (Port 2025)
```bash
cd apps/dashboard-apbd
npm install
npm run build
npx next start -p 2025
# Atau dengan PM2:
pm2 start npx --name "app-2025-apbd-lampung" -- next start -p 2025
```

### 8. Menjalankan Dashboard Admin Super-Console (Port 2026)
```bash
cd apps/dashboard-admin
npm install
npm run build
npm run preview -- --port 2026
# Atau dengan PM2:
pm2 start npm --name "app-2026-admin" -- run preview -- --port 2026
```

---

## 🌐 Bagian 4: Menghubungkan ke Domain / Subdomain dengan Nginx Reverse Proxy

Untuk membuat masing-masing dashboard dapat diakses melalui domain cantik (contoh: `transparansi.domain.com`, `apbd.domain.com`) tanpa menyebutkan port:

### Langkah 1: Buat Konfigurasi Nginx
Buat file konfigurasi baru di VPS Anda:
```bash
sudo nano /etc/nginx/sites-available/blockchain-dashboards.conf
```

Tempelkan konfigurasi berikut (Ganti `domain.com` dengan nama domain Anda):

```nginx
# 1. Portal Transparansi Publik (Port 2020)
server {
    server_name transparansi.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Dashboard Kementerian (Port 2021)
server {
    server_name kementerian.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2021;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 3. Dashboard Bank Penyalur (Port 2022)
server {
    server_name bank.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2022;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 4. Dashboard Auditor BPK (Port 2023)
server {
    server_name auditor.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2023;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 5. Dashboard Institusi Pendidikan (Port 2024)
server {
    server_name sekolah.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2024;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 6. Dashboard APBD Provinsi Lampung (Port 2025)
server {
    server_name apbd.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2025;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 7. Dashboard Admin (Port 2026)
server {
    server_name admin.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2026;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 8. Proxy DB REST API (Port 2028)
server {
    server_name api.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2028;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Langkah 2: Aktifkan Konfigurasi & Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/blockchain-dashboards.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 Bagian 5: Pasang SSL HTTPS Gratis (Certbot Let's Encrypt)

Untuk mengaktifkan gembok hijau HTTPS pada seluruh subdomain dalam 1 perintah:

```bash
# Install Certbot untuk Nginx
sudo apt install -y certbot python3-certbot-nginx

# Pasang SSL gratis otomatis ke seluruh subdomain
sudo certbot --nginx -d transparansi.domain.com -d kementerian.domain.com -d bank.domain.com -d auditor.domain.com -d sekolah.domain.com -d apbd.domain.com -d admin.domain.com -d api.domain.com
```

Certbot akan otomatis memperbarui sertifikat SSL setiap 90 hari.

---

## 🛡️ Bagian 6: Konfigurasi Firewall (UFW)

Pastikan port web publik terbuka:
```bash
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw enable
```

---

## 💡 Manajemen Proses Otomatis (PM2 Autostart saat Server Reboot)

Agar semua dashboard otomatis menyala saat VPS restart atau reboot:
```bash
# Simpan daftar proses PM2 aktif
pm2 save

# Daftarkan PM2 ke systemd startup service
pm2 startup
```

---

## 🔍 Skrip Pemeriksaan Kesehatan Sistem (Health Check)
```bash
node scripts/check_all_ports.js
```
