# Dashboard Admin — Integrated Blockchain (Anggaran Pendidikan)

Super-Admin Console terpusat untuk mengelola seluruh ekosistem transparansi anggaran pendidikan nasional (APBN, APBD, dan CSR untuk 38 provinsi & 514 kabupaten/kota).

Modul ini adalah dashboard ke-6 dari platform `integrated-blockchain` yang berjalan di port `2026`.

---

## Fitur Lengkap Sesuai PRD

1. **Autentikasi & Scoped RBAC:**
   - Login 2-tahap dengan verifikasi **MFA TOTP**.
   - **Quick Demo Switcher** untuk menguji peran berjenjang:
     - **Super Admin** (Cakupan: `global` — akses penuh).
     - **Ops Admin** (Cakupan: `global` — monitoring & review).
     - **Admin Kementerian** (Cakupan: `kementerian` — contoh: Kemenag / Kemendikdasmen).
     - **Admin Wilayah** (Cakupan: `provinsi` — contoh: Lampung).
     - **Admin Satuan** (Cakupan: `satuan` — contoh: MIN 1 Pesawaran).
   - Pengamanan menu & aksi berdasarkan **Access Control Matrix** dan batas cakupan (*scope*).

2. **Beranda & System Health Monitor:**
   - Pemantauan live 9 layanan port ekosistem (2020: Publik s.d. 2028: Proxy Gateway).
   - Tombol interaktif **Ping Semua Port** untuk memperbarui latensi & status.
   - Ringkasan statistik pengguna pending, flag anomali AI-FAA terbuka, dan volume mutasi Himbara.
   - Aliran aktivitas terkini dari **Audit Log**.

3. **Manajemen Pengguna Berjenjang (Hierarki 4 Level PRD 2.1):**
   - Multi-level cascading filter: **Kementerian Pembina** → **Jenjang** → **Provinsi** → **Kabupaten/Kota** → **Kecamatan** → **Satuan Pendidikan**.
   - Contoh kasus nyata PRD: Pengelolaan **MIN 1 Pesawaran** (`Kemenag → SD → Lampung → Kab. Pesawaran → Kec. Kedondong → MIN 1 Pesawaran`).
   - CRUD pengguna (Tambah Pengguna, Edit Pengguna, Hapus Pengguna).
   - Status toggle (Aktifkan / Nonaktifkan) & Reset Password (dengan kata sandi sementara acak).
   - Aksi massal (*bulk action*): Aktifkan massal, Nonaktifkan massal, dan Reset Sandi massal.

4. **Audit Log Viewer (Immutable & State Diff):**
   - Log pelacakan permanen lintas dashboard.
   - Filter berdasarkan dashboard, pelaku, cakupan scope, dan tipe entitas.
   - Modal **Periksa State Diff**: membandingkan JSON snapshot *before state* vs *after state*.
   - Fitur **Ekspor CSV** untuk laporan audit eksternal.

5. **Data Source & Ingestion Monitor:**
   - Pemantauan status pipeline anggaran (APBN, APBD, CSR).
   - Tombol **Resync Manual** interaktif dengan simulasi sinkronisasi dan penambahan baris data baru.
   - Modal pendaftaran pipeline sumber data baru.
   - Rincian pipeline data (target URL, status sinkron, dan diagnosa error).

6. **AI-FAA Management Console:**
   - Tab 1: **Anomali Transaksi Keuangan** dengan modal peninjauan investigasi, verifikasi selisih bank, dan perubahan status (`baru` → `ditinjau` → `selesai`).
   - Tab 2: **Kontrol Audit Provinsi** untuk mengaktifkan/menonaktifkan pemindaian otomatis per provinsi.
   - Tab 3: **Log Query NL-to-SQL** untuk memverifikasi kepatuhan terhadap *SQL AST Guardrail* dan *PII Masking*.

7. **Mutasi Rekening Bank Himbara:**
   - Penarikan mutasi berkala (polling API) dari BRI, BNI, Mandiri, dan BTN.
   - *Auto-matching* mutasi terhadap sumber data anggaran.
   - Kontrol masking nomor rekening (hanya Super Admin yang dapat membuka masking).
   - Tombol **Flag ke AI-FAA** jika terdeteksi inkonsistensi transaksi.

8. **Pusat Notifikasi & Broadcast:**
   - Pengiriman pengumuman tertarget ke dashboard dan peran tertentu.
   - Estimasi jangkauan audiens dan riwayat broadcast terkirim.

9. **Master Data Wilayah & Satuan Pendidikan:**
   - Pengelolaan master satuan pendidikan nasional (NPSN, Jenjang, Kementerian, Alamat).
   - Modal penambahan, pengubahan, dan penghapusan satuan master.
   - Tombol cepat untuk melihat akun operator yang terdaftar pada satuan tersebut.

10. **Access Control Matrix:**
    - Matriks izin interaktif (View, Create, Edit, Delete) per modul per peran.
    - Manajemen akun administrator dan konfigurasi batas cakupan (*scope type* & *scope ID*).
    - Penjelasan visual arsitektur penegakan Scoped RBAC.

11. **Pengaturan Asisten AI Aksara (`/ai-settings`):**
    - Konfigurasi integrasi multi-provider AI (Google Gemini, OpenAI, DeepSeek).
    - Fitur uji koneksi API langsung (*Live Test Connection*) dengan deteksi model otomatis (*auto-fallback* model).
    - Pengaturan *system prompt*, temperatur, dan batas output token.
    - Penyimpanan konfigurasi terpusat pada tabel `system_settings` PostgreSQL untuk melayani chatbot publik interaktif Aksara (Port 2019).

12. **Pengaturan API Bank Himbara SNAP (`/bank-settings`):**
    - Konfigurasi kredensial BI-SNAP Open Banking untuk 5 bank mitra (BRI, Mandiri, BNI, BTN, BSI).
    - Pengaturan Partner ID, Client Secret, RSA Private Key, dan Endpoint URL.
    - Mode operasional terpadu: Sandbox vs Live Production dengan fitur simulasi langsung inquiry rekening & mutasi kas sekolah.

13. **Pengaturan API Polsek Terdekat (`/polsek-settings`):**
    - Integrasi API geospasial pos kepolisian sektor terdekat dari satuan pendidikan.
    - Radius pelacakan perimeter darurat (1-25 km), hotline siaga terverifikasi, dan sistem auto-dispatch pengaduan ancaman/intimidasi sekolah.

14. **Pengaturan API Data Sekolah Nasional (`/schools-settings`):**
    - Interoperabilitas Satu Data Kemendikdasmen (`data.kemendikdasmen.go.id`), Dapodik Kemendikdasmen (`dapo.kemendikdasmen.go.id`), PDDikti Kemendiktisaintek, dan EMIS Kemenag.
    - Pengaturan otomatisasi validasi NPSN, sinkronisasi berkala, dan cakupan jenjang pendidikan nasional.

---

## Cara Menjalankan Secara Lokal

### 1. Masuk ke folder aplikasi
```bash
cd "D:\DaVinci\Web Development\integrated-blockchain\apps\dashboard-admin"
```

### 2. Jalankan development server
```bash
npm run dev
```

Aplikasi akan berjalan di: **`http://localhost:2026`**

Atau dari root proyek:
```bash
npm run dev:admin
```

### 3. Build Production
```bash
npm run build
npm run preview
```

### 4. API Proxy Gateway Backend (Port 2028)
Backend proxy API untuk modul admin telah didaftarkan pada `proxy/adminApi.js` dan terpasang di `proxy/proxy.js`.
Untuk menjalankan server backend gateway:
```bash
npm run dev:db
```
API admin akan tersedia di `http://localhost:2028/api/admin/...`.
