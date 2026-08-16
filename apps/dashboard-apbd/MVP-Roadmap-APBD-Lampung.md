# 🚀 MVP Roadmap — Dashboard APBD Lampung

## Sprint 1 — Setup UI Spreadsheet & Fondasi Data Supabase (tanpa login)
- Setup project Next.js 16 (port `2027`), Tailwind CSS, Recharts, Zustand store, Lucide Icons, dan Supabase JS SDK (`NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026`).
- Implementasi Sidebar navigasi persis Kementerian (Dashboard, APBD Pertahun, Kabupaten / Kota, Jenjang Pendidikan [Universitas, SMA, SMP, SD, PAUD], Profil Institusi, User Manager).
- Implementasi Global Header dengan dropdown Tahun Anggaran aktif + info Super Admin (tanpa login page, langsung masuk dashboard).
- Buat 4 tabel PostgreSQL lokal port `2025` (`apbd_provinsi`, `apbd_pendidikan_breakdown`, `apbd_pendidikan_satuan`, `apbd_input_log`).

**Kriteria selesai**: Dashboard port 2027 bisa dibuka langsung via URL tanpa login page, navigasi sidebar & header berfungsi utuh.

---

## Sprint 2 — Halaman Dashboard Utama (`/dashboard`) & APBD Pertahun (`/dashboard/apbd`)
- **Metric Cards**: Total APBD Lampung, Batas Minimal Wajib 20%, Alokasi Pendidikan Riil & Status Kepatuhan 20%, Total Realisasi Serapan.
- **Tabel Spreadsheet Ringkasan per Jenjang Pendidikan**: Data jenjang di Lampung (PAUD, SD, SMP, SMA, Univ) dengan progress bar, nominal, realisasi, selisih, % penyerapan, dan footer TOTAL.
- **Charts (Recharts)**: Bar Chart Nominal vs Realisasi per Jenjang & Area Chart Tren APBD Lampung multi-tahun.
- **Halaman APBD Pertahun**: Kelola status anggaran tahunan APBD Lampung (`DRAFT`, `ACTIVE`, `CLOSED`).

**Kriteria selesai**: Halaman utama menampilkan visual & spreadsheet lengkap persis Kementerian khusus Provinsi Lampung, perhitungan kepatuhan 20% otomatis.

---

## Sprint 3 — Spreadsheet 15 Kab/Kota, Jenjang, & Profil Institusi Lampung
- **Halaman Kabupaten / Kota (`/dashboard/kabupaten-kota`)**: Spreadsheet 15 Kab/Kota di Lampung dengan fitur inline editing, validasi alokasi, dan sinkronisasi otomatis ke total provinsi.
- **Halaman Jenjang Pendidikan (`/dashboard/jenjang/[jenjang]`)**: 5 sub-halaman jenjang dengan filter 15 kab/kota Lampung & daftar sekolah.
- **Halaman Profil Institusi (`/dashboard/profil-institusi`)**: Data detail sekolah dan riwayat alokasi anggaran APBD.
- **Halaman User Manager (`/dashboard/users`)**: Tampilan RBAC mock/manager sesuai template Kementerian.
- **Riwayat Log Perubahan (`apbd_input_log`)**: Jejak audit setiap perubahan data anggaran.

**Kriteria selesai**: Seluruh halaman identik dengan Dashboard Kementerian selesai dan fungsional penuh untuk Provinsi Lampung.

---

## Sprint 4 — Sebelum Go-Live: Login & Proteksi Akses (wajib, bukan opsional)
- Karena MVP dibuka tanpa login, ini **harus** diselesaikan sebelum dashboard dipakai untuk data resmi/produksi.
- Tambah mekanisme login sederhana (email/password, sesi cookie) — dependensi bersama dengan sistem existing yang juga belum punya login.
- Role BPKAD/Bappeda Lampung: akses tulis. Kementerian & Auditor: akses baca ke data ini dari dashboard masing-masing. Publik: di luar scope (lihat catatan di bawah).
- (Opsional, di luar MVP awal) expose status kepatuhan Lampung ke Portal Publik (port 2020).

**Kriteria selesai**: Data anggaran tidak lagi bisa diubah sembarang orang; role dan akses berjalan sesuai matriks.

---

## Di luar scope MVP ini (perlu keputusan terpisah)
- Replikasi ke provinsi lain di luar Lampung.
- Publikasi data ke Portal Publik.
- Integrasi breakdown APBD pendidikan Lampung ke data realisasi belanja sekolah yang sudah ada di `institusi_pendidikan`/`transactions` (baru sebatas alokasi anggaran, belum realisasi belanja per sekolah).
