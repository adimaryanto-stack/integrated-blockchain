# 📋 PRODUCT REQUIREMENT DOCUMENT (PRD)

## Dashboard APBD Provinsi Lampung — Kepatuhan Anggaran Pendidikan 20%

---

## 1. 🎯 Project Overview

**Nama Produk**: Dashboard APBD Provinsi Lampung — Monitoring Alokasi & Penyerapan Anggaran Pendidikan 20%

**Deskripsi singkat**: Dashboard web berbasis *spreadsheet interface* yang **persis seperti Dashboard Kementerian**, namun dengan cakupan khusus **1 Provinsi (Provinsi Lampung)** yang menaungi 15 Kabupaten/Kota dan ribuan Satuan Pendidikan, serta **dibuka langsung tanpa login page**. 

Aplikasi ini mencatat total APBD Provinsi Lampung per tahun anggaran, menghitung batas minimal kewajiban 20% untuk pendidikan (amanat UUD 1945 Pasal 31 ayat 4), serta mendistribusikan & memantau alokasi serta realisasi anggaran dari tingkat Provinsi → 15 Kabupaten/Kota → Jenjang Pendidikan & Satuan Pendidikan (Sekolah).

**Target user**:
- BPKAD / Bappeda Provinsi Lampung (Input & kelola data anggaran APBD)
- Kementerian Pendidikan & Kebudayaan (Monitoring kepatuhan daerah)
- Auditor / BPK (Verifikasi alokasi 20% & jejak audit anggaran)
- Publik / Stakeholder (Transparansi anggaran pendidikan daerah)

**Konsep Inti**:
- **Struktur Halaman Persis Dashboard Kementerian**: Layout, Sidebar, Header, Metric Cards, Tabel Spreadsheet, dan Charts identik 1-to-1.
- **Scope 1 Provinsi (Lampung)**: Menggantikan hierarki nasional 38 provinsi menjadi fokus Provinsi Lampung (15 Kab/Kota & Satuan Pendidikan di Lampung).
- **Tanpa Login Page**: Pengguna langsung masuk ke dashboard utama saat mengakses URL aplikasi.

---

## 2. 🗂️ Menu Structure (Persis Dashboard Kementerian)

```
📊 Dashboard (Main)
   └── Ringkasan APBD Lampung: Total APBD, Batas 20%, Alokasi Riil, Realisasi, Status Kepatuhan + Charts

💰 APBD Pertahun
   └── Kelola tahun anggaran Provinsi Lampung: DRAFT → ACTIVE → CLOSED

🏛️ Kabupaten / Kota
   └── Spreadsheet 15 Kab/Kota di Lampung: Alokasi, Realisasi, Selisih, % Penyerapan, Inline Edit

🎓 Jenjang Pendidikan (5 Sub-Menu Wilayah Lampung)
   ├── Universitas
   ├── SMA
   ├── SMP
   ├── SD
   └── PAUD

🏫 Profil Institusi
   └── Data Satuan Pendidikan / Sekolah di wilayah Lampung (NPSN, Alokasi, Realisasi)

👥 User Manager
   └── Tampilan manajemen user & role (tampilan konsisten seperti Kementerian, tanpa halaman login terpisah)
```

---

## 3. 🧩 Fitur & Isi Halaman (1-to-1 Dashboard Kementerian)

### 3.1 Dashboard Utama (`/dashboard`)
- **Global Header**:
  - Judul: "Dashboard" & Subtitle: "Ringkasan APBD Pendidikan Provinsi Lampung".
  - Dropdown Global **Tahun Anggaran** (sinkron ke seluruh halaman via Zustand store).
  - Profil User Super Admin (header identik dengan Kementerian).
- **Metric Cards (Row Atas)**:
  - **Total Nominal APBD Lampung** (misal: Rp 7.85 T) + tren tahunan.
  - **Batas Wajib 20% Pendidikan** (dihitung otomatis: `Total APBD × 20%`).
  - **Alokasi Pendidikan Riil & Status Kepatuhan** (Badge Hijau "Memenuhi" $\ge 20\%$ / Merah "Belum Memenuhi" $< 20\%$).
  - **Total Realisasi & % Penyerapan** (Progres serapan dana pendidikan).
- **Ringkasan per Jenjang Pendidikan (Tabel Spreadsheet)**:
  - Baris: PAUD, SD, SMP, SMA, Universitas di Lampung.
  - Kolom: Jenjang, Nominal Alokasi, Realisasi, Selisih, % Penyerapan (dengan conditional badge warna), dan Progress Bar.
  - Footer: Baris TOTAL dengan kalkulasi otomatis.
- **Charts (Recharts)**:
  - **Bar Chart**: Nominal vs Realisasi per Jenjang di Lampung.
  - **Area Chart**: Tren APBD Pendidikan Lampung Tahunan (2020–2026).

### 3.2 APBD Pertahun (`/dashboard/apbn` atau `/dashboard/apbd`)
- Pengelolaan APBD Provinsi Lampung per tahun anggaran.
- Kolom: Tahun, Total APBD, Wajib 20%, Alokasi Pendidikan, Realisasi, Status (`DRAFT`, `ACTIVE`, `CLOSED`).
- Hanya 1 tahun yang aktif dalam satu waktu; tahun `CLOSED` terkunci untuk audit trail.

### 3.3 Kabupaten / Kota (`/dashboard/kabupaten-kota`)
- Spreadsheet 15 Kabupaten/Kota di Provinsi Lampung (Bandar Lampung, Metro, Lampung Selatan, Lampung Tengah, Lampung Utara, Lampung Barat, Tulang Bawang, Tanggamus, Lampung Timur, Way Kanan, Pesawaran, Pringsewu, Mesuji, Tulang Bawang Barat, Pesisir Barat).
- Kolom: Nama Kab/Kota, Tipe (Kabupaten/Kota), Nominal Alokasi, Realisasi Total, Selisih, % Penyerapan, Status.
- Fitur *Inline Editing* langsung di sel tabel & sinkronisasi otomatis ke total provinsi.

### 3.4 Jenjang Pendidikan (`/dashboard/jenjang/[jenjang]`)
- 5 Sub-halaman: `/dashboard/jenjang/universitas`, `/sma`, `/smp`, `/sd`, `/paud`.
- Filter wilayah berdasarkan 15 Kabupaten/Kota di Lampung.
- Tabel daftar institusi pendidikan di Lampung per jenjang: NPSN, Nama Sekolah, Kab/Kota, Nominal Alokasi, Realisasi, % Penyerapan.

### 3.5 Profil Institusi (`/dashboard/profil-institusi`)
- Pencarian dan profil lengkap satuan pendidikan di Provinsi Lampung.
- Detail riwayat alokasi anggaran APBD dan realisasi belanja institusi.

### 3.6 User Manager (`/dashboard/users`)
- Tampilan daftar user, hak akses (BPKAD, Bappeda, Dinas Pendidikan, Auditor), dan role management yang identik dengan Dashboard Kementerian.

---

## 4. 🗄️ Database Schema (tambahan, terhubung ke PostgreSQL 16 yang sudah ada)

Tabel baru — memanfaatkan tabel `provinsi` dan `kabupaten_kota` yang sudah ada di sistem `integrated-blockchain` (filter ke Lampung), tidak membuat data wilayah baru dari nol.

```
apbd_provinsi
- id (uuid, PK)
- provinsi_id (FK → provinsi, difilter Lampung)
- tahun_anggaran_id (FK → tahun_anggaran)
- total_apbd (numeric)
- batas_minimal_pendidikan (numeric, computed = total_apbd * 0.20)
- alokasi_pendidikan_riil (numeric)
- status_kepatuhan (enum: memenuhi / belum_memenuhi, computed)
- diinput_oleh (FK → users)
- created_at, updated_at

apbd_pendidikan_breakdown
- id (uuid, PK)
- apbd_provinsi_id (FK → apbd_provinsi)
- kabupaten_kota_id (FK → kabupaten_kota, difilter 15 kab/kota Lampung)
- nominal_dialokasikan (numeric)
- catatan (text, optional)

apbd_pendidikan_satuan
- id (uuid, PK)
- apbd_pendidikan_breakdown_id (FK → apbd_pendidikan_breakdown, level kab/kota)
- institusi_pendidikan_id (FK → institusi_pendidikan/schools yang sudah ada, difilter Lampung)
- nominal_dialokasikan (numeric)
- catatan (text, optional)
> Level 3 ini yang membuat topologi persis sama dengan Kementerian: Provinsi → Kab/Kota → Satuan Pendidikan, bukan berhenti di level kab/kota saja.

apbd_input_log
- id (uuid, PK)
- apbd_provinsi_id (FK → apbd_provinsi)
- user_id (FK → users)
- field_diubah (text)
- nilai_lama, nilai_baru (text)
- timestamp
```

---

## 5. 🛠️ Tech Stack & Koneksi Database

Mengikuti stack yang sudah dipakai di `integrated-blockchain` agar konsisten dan bisa berbagi database:

| Layer | Teknologi | Port / Host | Keterangan |
|---|---|---|---|
| Database | **PostgreSQL 16 lokal** | `localhost:2025` | Instance existing di database `postgres`, tabel baru ditambahkan via migrasi/script SQL langsung |
| API / Backend SDK | **Supabase (PostgREST / Supabase REST API)** | `http://localhost:2026` | Menggunakan `@supabase/supabase-js` dengan Anon Key |
| Frontend | **Next.js 16 (App Router)** | `http://localhost:2027` | Dashboard berdiri sendiri (port 2027 baru) |
| AI / OCR Services | **Google Gemini & Vision API** | External Cloud | Gemini API & Vision API untuk analisis data / pemrosesan dokumen anggaran jika diperlukan |

### Konfigurasi Environment Variables (`.env.local`)
Aplikasi frontend `dashboard-apbd-lampung` terhubung menggunakan konfigurasi berikut:

```env
# Supabase SDK credentials (for app code local connection)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:2026
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweXR4bW54Ymljam1nc2dwcmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk1NzAsImV4cCI6MjA4ODI2NTU3MH0.BGQGztExtjrTr6XHrvQZ1A0njAAdkoBAp3APRfWsQNE

# Local PostgreSQL direct connection configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:2025/postgres
POSTGRES_URL=postgresql://postgres:postgres@localhost:2025/postgres

# Additional API keys and app config
GEMINI_API_KEY=AIzaSyAMYMHF5x9c8JUgJqpmGJ6zmtYf2VHPDXg
NEXT_PUBLIC_GOOGLE_VISION_API_KEY=AIzaSyBUMLfBAoE19HuGUL3zqGia0d0MROh9L8o
```

**Kenapa reuse database & Supabase, bukan bikin dari nol**: data wilayah (provinsi, kab/kota, satuan pendidikan) dan tahun anggaran sudah ada di sistem existing — duplikasi database akan menimbulkan dua sumber kebenaran yang bisa tidak sinkron. Yang "berdiri sendiri" adalah **frontend/dashboard-nya** (port 2027, aplikasi Next.js terpisah), terhubung ke Supabase proxy port 2026 dan PostgreSQL port 2025.

**Struktur folder mengkloning dan mengadaptasi `D:\DaVinci\Web Development\integrated-blockchain\apps\dashboard-kementerian` persis**:
```
apps/
└── dashboard-apbd-lampung/    # Port 2027 — kloning struktur dashboard-kementerian
    ├── app/
    │   ├── dashboard/
    │   │   ├── page.tsx                 # Ringkasan APBD Lampung + status kepatuhan 20%
    │   │   ├── apbd/page.tsx            # Pengelolaan APBD Lampung pertahun
    │   │   ├── kabupaten-kota/page.tsx  # Spreadsheet 15 Kab/Kota Lampung
    │   │   ├── jenjang/[jenjang]/       # Sub-menu jenjang pendidikan di Lampung
    │   │   ├── profil-institusi/        # Profil sekolah/satuan pendidikan di Lampung
    │   │   └── users/page.tsx           # User manager (tampilan identik kementerian)
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/
    │   ├── layout/
    │   │   ├── Header.tsx               # Header global + dropdown tahun anggaran
    │   │   └── Sidebar.tsx              # Sidebar navigasi APBD Lampung
    │   └── ui/                          # MetricCard, PctBadge, SheetTable, Chart Containers
    ├── lib/
    │   ├── supabase.ts                  # Supabase Client SDK (port 2026)
    │   ├── store.ts                     # Zustand Store untuk activeTahun
    │   └── utils/                       # Formatters (fmtTriliun, fmtPct, formatRupiah)
    └── package.json
```

---

## 6. 🔐 Authentication & Authorization

**Konfirmasi dari Anda**: belum ada login page — sama seperti kondisi Dashboard Kementerian saat ini. Jadi untuk MVP ini, dashboard **dibuka tanpa login** (akses terbuka via URL), persis mengikuti kondisi existing.

- Tombol/label **"User Manager"** tetap ditampilkan di header (mengikuti tampilan Kementerian) untuk konsistensi visual, tapi **belum fungsional** — sama seperti kondisi aslinya sekarang.
- Semua orang yang bisa akses URL port `2027` bisa melihat **dan** input data (belum ada pembatasan role BPKAD vs read-only).
- Kolom `diinput_oleh` tetap diisi (misal dari nama yang diketik manual saat input, bukan dari sesi login) supaya `apbd_input_log` tidak kosong — tapi ini **bukan** otentikasi sungguhan, hanya jejak nama.
- Menggunakan Supabase Anon Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`) untuk operasi data di client/server tanpa sesi auth wajib.

**Risiko yang perlu Anda sadari**: karena input berupa angka anggaran (sensitif dan berpotensi disalahgunakan), akses terbuka tanpa login berarti siapa pun dengan link bisa mengubah data. Ini wajar untuk tahap MVP/demo, tapi **wajib** ditutup dengan login sebelum dipakai untuk data resmi/produksi — dicatat sebagai item wajib di roadmap (lihat MVP Roadmap, bagian "Sebelum go-live").

---

## 7. 📡 Supabase SDK & REST Data Access (Port 2026)

Aplikasi berinteraksi dengan database melalui **Supabase Client SDK** (`@supabase/supabase-js`) atau langsung via REST PostgREST di port 2026:

| Akses Data / Endpoint | Method / SDK Call | Deskripsi |
|---|---|---|
| `apbd_provinsi` | `supabase.from('apbd_provinsi').select('*').eq('provinsi_id', lampung_id)` | Data APBD & status kepatuhan Lampung per tahun |
| `apbd_provinsi` | `supabase.from('apbd_provinsi').insert([...])` | Input total APBD & alokasi pendidikan riil |
| `apbd_provinsi` | `supabase.from('apbd_provinsi').update({...}).eq('id', id)` | Update input (tercatat di `apbd_input_log`) |
| `apbd_pendidikan_breakdown` | `supabase.from('apbd_pendidikan_breakdown').select('*').eq('apbd_provinsi_id', id)` | Breakdown per kab/kota |
| `apbd_pendidikan_breakdown` | `supabase.from('apbd_pendidikan_breakdown').upsert([...])` | Input/ubah breakdown per kab/kota |
| `apbd_pendidikan_satuan` | `supabase.from('apbd_pendidikan_satuan').select('*').eq('apbd_pendidikan_breakdown_id', id)` | Breakdown per satuan pendidikan |
| `apbd_input_log` | `supabase.from('apbd_input_log').insert([...])` | Pencatatan audit trail perubahan anggaran |

---

## 8. ⚡ Non-Functional Requirements

- Validasi breakdown: total nominal per kab/kota **harus** sama dengan `alokasi_pendidikan_riil` — sistem menolak simpan jika tidak sama (mencegah data pincang).
- Semua perubahan pada `total_apbd` dan `alokasi_pendidikan_riil` wajib tercatat di `apbd_input_log` — tidak boleh overwrite tanpa jejak.
- Nilai `batas_minimal_pendidikan` selalu dihitung ulang (computed), tidak boleh diinput manual — mencegah manipulasi angka acuan 20%.
- Koneksi database fallback: jika membutuhkan query analitik/migrasi langsung, gunakan `DATABASE_URL` / `POSTGRES_URL` ke PostgreSQL port 2025.
