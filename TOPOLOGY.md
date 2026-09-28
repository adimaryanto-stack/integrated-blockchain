# 🌐 Topologi & Arsitektur Sistem
## Integrated Blockchain - Platform Transparansi Anggaran Pendidikan Indonesia

---

### 1. 🗺️ Topologi Jaringan & Port Mapping

```mermaid
graph TD
    subgraph "CLIENT ACCESS LAYER (BROWSER)"
        ClientPublik["Warga / Publik<br/>(Desktop / Mobile)"]
        ClientKemen["Admin Kementerian<br/>(Pusat)"]
        ClientBank["Operator Bank<br/>(Bank Daerah)"]
        ClientAudit["Auditor / BPK<br/>(Inspektorat)"]
        ClientSekolah["Operator Sekolah<br/>(Satuan Pendidikan)"]
    end

    subgraph "PRESENTATION LAYER"
        Port2019["Port 2019<br/>Portal Publik Civic-Tech (Vite)<br/>(apps/dashboard-publik)"]
        Port2020["Port 2020<br/>Dashboard Transparansi Publik<br/>(apps/transparansi-anggaran)"]
        Port2021["Port 2021<br/>Dashboard Kementerian<br/>(apps/dashboard-kementerian)"]
        Port2022["Port 2022<br/>Dashboard Bank Penyalur<br/>(apps/dashboard-bank)"]
        Port2023["Port 2023<br/>Dashboard Auditor & BPK<br/>(apps/dashboard-auditor)"]
        Port2024["Port 2024<br/>Dashboard Institusi Pendidikan<br/>(apps/dashboard-institusi-pendidikan)"]
        Port2025["Port 2025<br/>Dashboard APBD Provinsi Lampung<br/>(apps/dashboard-apbd)"]
        Port2026["Port 2026<br/>Dashboard Admin Super-Console<br/>(apps/dashboard-admin)"]
    end

    subgraph "INTEGRATION & API GATEWAY LAYER"
        Port2028["Port 2028<br/>PostgREST Proxy API Server<br/>(Node.js / Express Gateway)"]
    end

    subgraph "PERSISTENCE & STORAGE LAYER"
        Port2027["Port 2027<br/>PostgreSQL 16 Relational Engine<br/>(35+ Tables / Single Source of Truth)"]
    end

    ClientPublik -->|HTTP:2019| Port2019
    ClientPublik -->|HTTP:2020| Port2020
    ClientKemen -->|HTTP:2021| Port2021
    ClientBank -->|HTTP:2022| Port2022
    ClientAudit -->|HTTP:2023| Port2023
    ClientSekolah -->|HTTP:2024| Port2024

    Port2019 -->|REST / PostgREST| Port2028
    Port2020 -->|REST / PostgREST| Port2028
    Port2021 -->|REST / PostgREST| Port2028
    Port2022 -->|REST / PostgREST| Port2028
    Port2023 -->|REST / PostgREST| Port2028
    Port2024 -->|REST / PostgREST| Port2028
    Port2025 -->|REST / PostgREST| Port2028
    Port2026 -->|REST / PostgREST| Port2028

    Port2028 -->|Direct TCP / SQL Pool| Port2027
```

---

### 2. 🔄 Alur Distribusi Data Finansial (Financial Data Flow)

```mermaid
sequenceDiagram
    autonumber
    actor Kemen as Kementerian (Port 2021)
    participant API as Proxy API (Port 2028)
    participant DB as PostgreSQL DB (Port 2027)
    actor Bank as Bank Penyalur (Port 2022)
    actor Sekolah as Sekolah (Port 2024)
    actor Auditor as Auditor (Port 2023)
    actor Publik as Publik (Port 2020)

    Kemen->>API: 1. Tetapkan Alokasi APBN 2026 (Nasional -> 38 Prov -> 514 Kab/Kota)
    API->>DB: Simpan ke `tahun_anggaran`, `alokasi_provinsi`, `alokasi_kabupaten_kota`
    
    Bank->>API: 2. Rekonsiliasi Rekening Kas Sekolah & Disbursement Dana Masuk
    API->>DB: Update `incoming_funds` (APBN, APBD, CSR) & `bank_accounts`
    
    Sekolah->>API: 3. Input RAB & Belanja Riil (Transaksi, Kuitansi, SPJ)
    API->>DB: Insert `transactions`, `transaction_items`, `rincian_pengeluaran_item`
    
    Auditor->>API: 4. Audit & Verifikasi Dokumen Digital (Deteksi Anomali AI)
    API->>DB: Query `audit_anomaly`, Update status SPJ & Catatan Audit
    
    Publik->>API: 5. Akses Transparansi Anggaran Sekolah (/dashboard/69893669)
    API->>Publik: Tampilkan Riwayat APBN/APBD/CSR, Struk Belanja, Grafik, dan Forum
```

---

### 3. 📊 Cascading Rollup Trigger Model

Ketika nominal anggaran atau realisasi diubah pada salah satu level, sistem menjalankan kalkulasi berjenjang (*cascading math rollup*):

$$\text{APBN Nasional 2026} \xrightarrow{\text{Distribusi}} \sum \text{Alokasi 38 Provinsi} \xrightarrow{\text{Distribusi}} \sum \text{Alokasi 514 Kab/Kota} \xrightarrow{\text{Distribusi}} \sum \text{Sekolah \& Universitas}$$

$$\text{Total Realisasi} = \sum_{\text{bulan}=1}^{12} \text{Pengeluaran Bulanan}$$
$$\text{Sisa Saldo Kas} = \text{Total Alokasi Diterima} - \text{Total Realisasi Belanja}$$
$$\text{Persentase Penyerapan} = \left( \frac{\text{Total Realisasi}}{\text{Total Alokasi}} \right) \times 100\%$$
