# 🌐 Portal Publik Civic-Tech (Port 2019)

> **Portal Transparansi Keuangan Pendidikan Publik Indonesia (Edisi Civic-Tech Redesign) — Berbasis Vite, Antarmuka Responsif, Peta Interaktif 38 Provinsi, dan Integrasi Database Lokal PostgreSQL.**

---

## 🌟 Ikhtisar Aplikasi

Portal Publik Civic-Tech (Port 2019) menyajikan visualisasi data aliran dana anggaran pendidikan nasional secara transparan dan mudah diakses oleh seluruh lapisan masyarakat (orang tua murid, guru, aktivis antikorupsi, jurnalis data, dan mahasiswa).

Aplikasi ini berjalan cepat menggunakan arsitektur **Vite / Vanilla ES Modules**, terhubung secara real-time ke **PostgreSQL 16 (Port 2027)** melalui **Proxy API Server (Port 2028)**.

---

## 🚀 Fitur Utama

1. **Beranda & KPI Transparansi (`index.html`)**:
   - Pagu APBN Pendidikan Nasional, Realisasi Penyerapan, dan Saldo Rekening Penyaluran.
   - Grafik interaktif aliran dana dari APBN Pusat, APBD Provinsi, hingga rekening sekolah.
2. **Peta Regional Interaktif 38 Provinsi (`peta-regional.html`)**:
   - Peta visual sebaran 38 provinsi di Indonesia dengan pewarnaan choropleth berdasarkan jumlah sekolah dan serapan dana.
   - Panel detail instan saat provinsi diklik dengan tombol jelajah langsung ke halaman detail provinsi.
3. **Katalog 38 Provinsi (`provinces.html`)**:
   - Grid kartu 38 provinsi di Indonesia yang diambil secara dinamis dari tabel `provinsi` dan view `provincial_allocations`.
4. **Detail Provinsi & 514 Kabupaten/Kota (`province-detail.html`)**:
   - Rincian alokasi dana per kabupaten/kota dalam suatu provinsi.
5. **Detail Kabupaten / Kota & Daftar Sekolah (`regency-detail.html`)**:
   - Daftar satuan pendidikan (PAUD, SD, SMP, SMA, Universitas) per kabupaten dengan paginasi, pencarian, dan nomor rekening.
6. **Aliran Dana Transparan (`aliran-dana.html`)**:
   - Diagram alir step-by-step penyaluran dana APBN dari Kemenkeu & Kemendikbudristek &rarr; Bank Penyalur (Giro/Escrow) &rarr; Rekening Satuan Pendidikan.
7. **Deteksi Anomali Publik (`audit.html`)**:
   - Transparansi pelaporan anomali dan tindak lanjut audit BPK.
8. **Statistik & Perbandingan Anggaran (`statistics.html` & `compare.html`)**:
   - Komparasi alokasi antar jenjang dan antar daerah.
9. **Pelaporan & Whistleblowing System (`reporting.html`)**:
   - Form pengaduan masyarakat untuk dugaan penyelewengan dana pendidikan.

---

## ⚙️ Cara Menjalankan

```bash
# 1. Masuk ke direktori
cd apps/dashboard-publik

# 2. Install dependensi
npm install

# 3. Jalankan server pembangunan (Vite) di Port 2019
npm run dev -- --port 2019
```

Akses portal di: **[http://localhost:2019](http://localhost:2019)**

---

## 🔗 Keterhubungan Arsitektur

- **Database**: PostgreSQL 16 (Port 2027)
- **API Proxy**: Express PostgREST Gateway (Port 2028)
- **File Konfigurasi**: `.env` (`VITE_API_URL=http://localhost:2028`)
