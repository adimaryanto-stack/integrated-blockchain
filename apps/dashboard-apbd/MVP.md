# 🚀 MVP Roadmap & Status: Dashboard APBD Lampung

## 📌 Status Pengembangan: SELESAI 100% (PRODUCTION READY)

| Modul | Status | Verifikasi Database |
|---|:---:|:---:|
| Executive Dashboard (`/dashboard`) | ✅ SELESAI | 100% PostgreSQL |
| APBD Pertahun (`/dashboard/apbd`) | ✅ SELESAI | 100% PostgreSQL |
| Spreadsheet Kab/Kota (`/dashboard/kabupaten-kota`) | ✅ SELESAI | 100% PostgreSQL |
| Detail Jenjang Universitas (`/dashboard/jenjang/universitas`) | ✅ SELESAI | 100% PostgreSQL |
| Detail Jenjang SMA (`/dashboard/jenjang/sma`) | ✅ SELESAI | 100% PostgreSQL |
| Detail Jenjang SMP (`/dashboard/jenjang/smp`) | ✅ SELESAI | 100% PostgreSQL |
| Detail Jenjang SD (`/dashboard/jenjang/sd`) | ✅ SELESAI | 100% PostgreSQL |
| Detail Jenjang PAUD (`/dashboard/jenjang/paud`) | ✅ SELESAI | 100% PostgreSQL |
| Profil Institusi (`/dashboard/profil-institusi`) | ✅ SELESAI | 100% PostgreSQL |
| User Manager (`/dashboard/users`) | ✅ SELESAI | 100% PostgreSQL |
| Dynamic Year Selector (2026 Aktif vs 2027 Carry Forward) | ✅ SELESAI | 100% PostgreSQL |
| Export Excel Spreadsheet (.xlsx) | ✅ SELESAI | Client-Side Generation |

---

## 🎯 Milestone Pencapaian

- [x] Inisialisasi arsitektur Next.js 15 di Port 2027.
- [x] Integrasi database PostgreSQL lokal via Supabase Client & REST Proxy Port 2026.
- [x] Penyelarasan skema data dengan Kementerian (Port 2021) dan Bank (Port 2022).
- [x] Implementasi reaktif selektor tahun:
  - Tahun 2026: Nilai APBD riil Lampung Rp 8,24 Triliun (Alokasi Pendidikan Rp 1,75 Triliun).
  - Tahun 2027: Pengeluaran Rp 0, Alokasi Rp 0, Saldo Kas Bank Carry Forward Rp 330 Miliar.
- [x] Penghitungan dinamis jumlah Kabupaten / Kota pada sidebar dan tabel spreadsheet.
- [x] Pengujian otomatis 10 halaman berstatus `200 OK`.
- [x] Screenshot otomatis resolusi 1920x1080 tersimpan di `public/screenshots/dashboard.png`.
