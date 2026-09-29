# 🏛️ Dashboard Kementerian Pendidikan (Port 2021)

> **Sistem Informasi Perencanaan, Penetapan Pagu APBN Nasional, dan Distribusi Anggaran Pendidikan 38 Provinsi Berbasis PostgreSQL Lokal.**

![Dashboard Kementerian](public/screenshots/dashboard.png)

---

## 🌟 Ikhtisar Aplikasi

Dashboard Kementerian Pendidikan (Kemendikbudristek & Kemenkeu) merupakan pusat kendali penetapan pagu APBN Pendidikan Nasional (Rp 665,02 Triliun), distribusi transfer dana ke 38 Provinsi, 514 Kabupaten/Kota, dan pemantauan penyerapan anggaran pada 367.865 satuan pendidikan di seluruh Indonesia.

Aplikasi ini berjalan pada **Port 2021** dan terhubung 100% secara langsung ke database lokal **PostgreSQL 16 (Port 2027)** melalui **Proxy API Server (Port 2028)**.

---

## 🚀 Fitur Utama

1. **National Executive Dashboard (`/dashboard`)**:
   - Pagu APBN Pendidikan Nasional: **Rp 665.024.819.000.000**.
   - Realisasi Belanja Total: **Rp 518.719.358.820.000** (78.0%).
   - Indikator KPI Penyerapan Nasional dan grafik distribusi belanja modal vs operasional.

2. **APBN Pertahun (`/dashboard/apbn`)**:
   - Master data tahun anggaran dan status pagu APBN.
   - Analisis perbandingan tren alokasi multi-tahun.

3. **Spreadsheet 38 Provinsi (`/dashboard/provinsi`)**:
   - Distribusi dana ke seluruh 38 provinsi di Indonesia dengan sinkronisasi presisi selisih 0 rupiah.
   - Halaman detail per provinsi (`/provinsi/[id]`) dengan rekapitulasi sekolah dan data statistik.

4. **Spreadsheet 514 Kabupaten / Kota (`/dashboard/kabupaten-kota`)**:
   - Pemantauan alokasi dan realisasi tingkat kabupaten/kota se-Indonesia.

5. **Pagu per Jenjang Pendidikan (`/dashboard/jenjang/[jenjang]`)**:
   - Distribusi dana untuk 5 jenjang: `/universitas`, `/sma`, `/smp`, `/sd`, `/paud`.
   - Paginasi server-side berkinerja tinggi.

6. **Profil Institusi Pendidikan (`/dashboard/profil-institusi`)**:
   - Rincian profil keuangan sekolah/kampus dan multi-sumber dana (APBN, APBD, CSR).

7. **User & Access Matrix (`/dashboard/users`)**:
   - Manajemen peran kementerian (Super Admin, Admin Pusat, Admin Provinsi, Admin Daerah).

---

## 📊 Logika Selektor Tahun (2026 vs 2027)

- **Tahun 2026 (Aktif Berjalan)**:
  - Total APBN: Rp 665.024.819.000.000
  - Realisasi Penyerapan: Rp 518.719.358.820.000 (78.0%)
- **Tahun 2027 (Anggaran Baru Belum Dialokasikan)**:
  - Total Pagu Baru: Rp 0
  - Realisasi: Rp 0
  - Saldo Kas Sisa: Carry-Forward sisa saldo kas tahun 2026

---

## ⚙️ Cara Menjalankan

```bash
cd apps/dashboard-kementerian
npm install
npm run dev -- -p 2021
```

Akses aplikasi di: **[http://localhost:2021](http://localhost:2021)**