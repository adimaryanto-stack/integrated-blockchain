# 📖 Panduan Lengkap Instalasi & Deployment (Linux VPS, macOS, & Windows)
## Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia

> **Panduan teknis langkah demi langkah untuk menjalankan masing-masing dari 6 dashboard aplikasi, database PostgreSQL, dan Proxy REST API gateway, serta menghubungkannya ke IP Publik, Custom Domain / Subdomain, dan SSL HTTPS.**

---

## 📌 Peta 8 Port & Direktori Aplikasi

| No | Nama Layanan / Dashboard | Port | Direktori Sumber | Target Domain / Subdomain (Contoh) |
|:---:|---|:---:|---|---|
| **1** | **Portal Transparansi Publik** | `:2020` | `apps/transparansi-anggaran/apps/web-next` | `https://transparansi.domain.com` |
| **2** | **Dashboard Kementerian (APBN)** | `:2021` | `apps/dashboard-kementerian` | `https://kementerian.domain.com` |
| **3** | **Dashboard Bank Penyalur** | `:2022` | `apps/dashboard-bank` | `https://bank.domain.com` |
| **4** | **Dashboard Auditor BPK** | `:2023` | `apps/dashboard-auditor` | `https://auditor.domain.com` |
| **5** | **Dashboard Institusi Pendidikan** | `:2024` | `apps/dashboard-institusi-pendidikan` | `https://sekolah.domain.com` |
| **6** | **Database PostgreSQL 16** | `:2025` | `pgsql/data` / PostgreSQL Server | `postgresql://127.0.0.1:2025/postgres` |
| **7** | **Proxy REST API Server** | `:2026` | `proxy/proxy.js` | `https://api.domain.com` |
| **8** | **Dashboard APBD Provinsi Lampung** | `:2027` | `apps/dashboard-apbd` | `https://apbd.domain.com` |

---

## 🗄️ Bagian 1: Persiapan Database PostgreSQL (Port 2025)

Seluruh 35 tabel relasional dan master data 367.865 satuan pendidikan tersimpan dalam file terkompresi **`database_dump.sql.gz`** (48 MB).

### 1.1 Restore Database di Linux VPS / macOS
```bash
# Jalankan skrip restore otomatis (Otomatis ekstrak dan import 35 tabel)
DB_PORT=2025 DB_PASSWORD=postgres node scripts/setup-db.js
```
*(Jika PostgreSQL Anda berjalan di port default 5432, cukup ganti `DB_PORT=5432`)*.

---

## ⚙️ Bagian 2: Konfigurasi Environment Variable (`.env.local`)

Masing-masing dashboard terhubung ke database melalui **Proxy API Server (Port 2026)**.

Jika Anda mendeploy di VPS atau domain publik, buat atau perbarui file `.env.local` di setiap folder aplikasi:

```env
# Format jika menggunakan IP VPS:
NEXT_PUBLIC_SUPABASE_URL=http://IP_VPS_ANDA:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweXR4bW54Ymljam1nc2dwcmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk1NzAsImV4cCI6MjA4ODI2NTU3MH0.BGQGztExtjrTr6XHrvQZ1A0njAAdkoBAp3APRfWsQNE

# Format jika menggunakan Custom Domain (HTTPS):
# NEXT_PUBLIC_SUPABASE_URL=https://api.domain.com
```

---

## 🚀 Bagian 3: Menjalankan Masing-Masing Dashboard Secara Mandiri

Anda dapat menjalankan setiap dashboard secara terpisah di terminal atau server yang berbeda:

### 1. Menjalankan Backend Proxy REST API (Port 2026)
```bash
cd proxy
npm install
node proxy.js
# Atau dengan PM2:
pm2 start proxy.js --name "blockchain-proxy-2026"
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

### 7. Menjalankan Dashboard APBD Provinsi Lampung (Port 2027)
```bash
cd apps/dashboard-apbd
npm install
npm run build
npx next start -p 2027
# Atau dengan PM2:
pm2 start npx --name "app-2027-apbd-lampung" -- next start -p 2027
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

# 6. Proxy DB REST API (Port 2026)
server {
    server_name api.domain.com;
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

# 7. Dashboard APBD Provinsi Lampung (Port 2027)
server {
    server_name apbd.domain.com;
    location / {
        proxy_pass http://127.0.0.1:2027;
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
sudo certbot --nginx -d transparansi.domain.com -d kementerian.domain.com -d bank.domain.com -d auditor.domain.com -d sekolah.domain.com -d api.domain.com -d apbd.domain.com
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
