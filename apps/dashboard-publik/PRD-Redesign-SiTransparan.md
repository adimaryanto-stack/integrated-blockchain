# PRD — Redesign UI/UX "Transparansi Anggaran Pendidikan" (SiTransparan)

**Versi:** 1.0  
**Tanggal:** 16 Agustus 2026  
**Target situs:** https://transparansi-anggaran-pendidikan-we.vercel.app/  
**Jenis pekerjaan:** Redesign UI/UX (Civic-Tech Modern)  

---

## 1. Project Overview

### 1.1 Latar Belakang
Situs SiTransparan bertransformasi dari "portal data pemerintah biasa" menjadi **produk data-civic-tech modern** dengan storytelling data, visualisasi aliran dana (Sankey flow), dan interaksi mendalam.

### 1.2 Design Principles
1. **Simple at first glance, deep when explored** — prinsip UX utama.
2. Elemen visual terpenting = **aliran uang** (budget flow visualization).
3. Interaksi terpenting = **eksplorasi**.
4. Elemen kepercayaan terpenting = **transparansi sumber data**.

### 1.3 Sistem Warna & Token
- **Primary:** `#176B4D` (Realisasi & Positif Finansial)
- **Secondary:** `#377DFF` (Info Netral & Interaksi)
- **Accent:** `#F4B942` (Highlight / Peringatan Ringan)
- **Danger:** `#D9534F` (Defisit / Tertunda)
- **Background:** `#F7F8F6` (Warm Paper Canvas)
- **Surface:** `#FFFFFF` (Panel & Kartu)
- **Border:** `#E2E7E3`
- **Typography:** Plus Jakarta Sans

---

## 2. Navigasi & Halaman
1. **Beranda (`index.html`)**: Hero naratif, KPI Snapshot, Topologi Aliran Dana (Sankey Flow), Update Terkini, Jelajahi Anggaran.
2. **Peta Regional (`peta-regional.html`)**: Peta 38 Provinsi Interaktif, Filter Realisasi, Drilldown Wilayah.
3. **Detail Anggaran (`detail-anggaran.html`)**: Program BOS Reguler, PIP, Breakdown Belanja, Analisis YoY.
4. **Pantau Anggaran (`pantau-anggaran.html`)**: Watchlist Anggaran & Notifikasi.
5. **Tentang & Metodologi (`tentang.html`)**: Sumber Data & Metrik.
