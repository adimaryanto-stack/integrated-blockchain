# MVP Roadmap & Checklist — Dashboard Kementerian

Dokumen ini melacak fitur-fitur Minimum Viable Product (MVP) yang direncanakan dan diimplementasikan untuk aplikasi **Dashboard Kementerian** (versi `1.4.1`). Seluruh fitur inti di bawah ini telah berhasil dikembangkan dan diuji secara lokal.

---

## 📈 Status MVP: 100% Selesai (Production-Ready Mockup)

Berikut adalah daftar sprint pengembangan dan status checklist fungsionalitas:

### 🏁 SPRINT 1: Setup & UI Foundation
- [x] Konfigurasi Next.js 16 + Tailwind CSS v4 dengan arsitektur variabel `@theme`.
- [x] Pembuatan tata letak global (Sidebar, Header, Shell) dengan desain modern & glassmorphism.
- [x] Setup state management global menggunakan **Zustand** untuk sinkronisasi tahun anggaran aktif.
- [x] Implementasi skema warna light mode premium dan efek frosted glass.

### 💰 SPRINT 2: Dashboard & APBN Management
- [x] Metric cards utama (Total APBN, Total Realisasi, % Penyerapan Nasional) dengan tren komparatif.
- [x] Visualisasi grafik menggunakan **Recharts** (Bar Chart Nominal vs Realisasi per Jenjang, Area Chart Tren APBN 2020–2026).
- [x] Halaman APBN per tahun untuk mengelola status tahun anggaran (`DRAFT`, `ACTIVE`, `CLOSED`).
- [x] Validasi status tahun anggaran (hanya 1 tahun yang dapat berstatus `ACTIVE` dalam satu waktu).

### 📍 SPRINT 3: Spreadsheet Provinsi & Kabupaten/Kota
- [x] Halaman spreadsheet 38 Provinsi dengan antarmuka bergaya Excel.
- [x] Fitur inline editing langsung pada cell nominal alokasi dan realisasi (data disimpan dalam memori/state).
- [x] Perhitungan selisih (`Nominal - Realisasi`) dan persentase penyerapan secara real-time.
- [x] Halaman spreadsheet Kabupaten/Kota dengan filter cascading per provinsi.
- [x] Sinkronisasi cascading (perubahan data di kab/kota otomatis mengupdate ringkasan provinsi & dashboard).

### 🎓 SPRINT 4: Jenjang Pendidikan & Export/Import
- [x] Halaman sub-menu berjenjang (Universitas, SMA, SMP, SD, PAUD) dengan daftar institusi lengkap.
- [x] Fitur pencarian sekolah, filter berdasarkan kecamatan/subdistrict, dan pagination data sekolah.
- [x] Profil Institusi detail yang menampilkan grafik tren bulanan dan alokasi per sumber dana.
- [x] Fungsionalitas **Export Excel** menggunakan `ExcelJS` & `file-saver` untuk menyimpan data beserta formula Excel asli (`SUM`, pembagian persentase) dan conditional formatting warna badge.

### 👥 SPRINT 5: User Manager & RBAC (Role-Based Access Control)
- [x] Pembuatan halaman User Manager dengan data user terhubung ke database.
- [x] Operasi CRUD user (Tambah, Edit, Hapus, Aktif/Nonaktifkan akun).
- [x] Implementasi Role-Based Access Control 6 Tingkat (`SUPER_ADMIN`, `ADMIN`, `ADMIN_PROVINSI`, `ADMIN_KABKOTA`, `PUBLIC_RESEARCHER`, `AUDITOR`).
- [x] Pembatasan menu dan aksi edit data (inline editing terkunci untuk Public Researcher/Auditor atau wilayah yang tidak sesuai).
- [x] Fitur **Pengaturan Peran & Pembagian Tugas (RBAC Matrix)** interaktif untuk konfigurasi wewenang oleh Super Admin.

### 🗄️ SPRINT 6: Integrasi Database PostgreSQL, 2-Way Cascading Sync & Authentic Audit Trail
- [x] Integrasi penuh ke **PostgreSQL Database** (Port 2025) via **PostgREST Engine** (Port 2026).
- [x] Sinkronisasi Anggaran 2-Arah Presisi 100% (*Top-down & Bottom-up*) antara APBN, 38 Provinsi, dan 514 Kabupaten/Kota.
- [x] Paginasi Server-Side **100 sekolah per halaman** mencakup seluruh 367.865 institusi dengan 3-tier A-Z sorting (Provinsi ➔ Kab/Kota ➔ Institusi).
- [x] Modul **Audit Trail Real-Time Murni** tanpa data sampel/dummy/hardcode dengan rekaman log kejadian asli persistent.

---

## 📷 Screenshots Validasi

Semua halaman di atas telah dijalankan dan diverifikasi pada `http://localhost:2021`. Cuplikan gambar layar telah dilampirkan di file **[`README.md`](./README.md)** untuk referensi cepat.

---

## 🚀 Langkah Selanjutnya (Post-MVP)
- [x] Integrasi Database Production (Supabase PostgreSQL / PostgREST API).
- [x] Modul audit trail murni real-time untuk merekam histori edit data per sel secara mendetail.
- [ ] Implementasi Autentikasi Pengguna nyata (NextAuth.js / Supabase Auth).
- [ ] Fitur Progressive Web App (PWA) untuk dukungan akses offline.

