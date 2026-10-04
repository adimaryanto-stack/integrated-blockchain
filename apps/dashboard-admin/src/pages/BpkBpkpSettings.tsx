import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import {
  Scale,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  Save,
  RotateCcw,
  Check,
  Building2,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Layers,
  Sparkles,
  DatabaseZap,
  Globe,
  FileCheck2,
  FileSearch,
  Lock,
  Search,
  PhoneCall,
  Mail,
  MapPin,
  FileSpreadsheet,
  Wifi
} from "lucide-react";
import {
  BpkBpkpApiConfig,
  BpkBpkpProvider,
  BpkBpkpOffice,
  BpkBpkpAuditTestResult
} from "@/types";


interface ProviderMeta {
  name: string;
  sub: string;
  lembaga: "BPK RI" | "BPKP RI" | "Auditor Independen";
  keyUrl: string;
  keyLabel: string;
  placeholder: string;
  defaultEndpoint: string;
  description: string;
  dasarHukum: string;
  clientIdDefault: string;
}

const PROVIDER_METADATA: Record<BpkBpkpProvider, ProviderMeta> = {
  bpk_eaudit: {
    name: "e-Audit BPK RI",
    sub: "Portal Pemeriksaan Keuangan Negara Terpadu",
    lembaga: "BPK RI",
    keyUrl: "https://e-audit.bpk.go.id/",
    keyLabel: "Portal e-Audit Badan Pemeriksa Keuangan RI (e-audit.bpk.go.id)",
    placeholder: "bpk_eaudit_token_sec_...",
    defaultEndpoint: "https://api-eaudit.bpk.go.id/v2/lhp/anggaran-pendidikan",
    description: "Sistem sinergi pemeriksaan BPK RI untuk transmisi data transaksi perbankan, realisasi belanja BOS/BOSP, dan catatan audit trail buku besar terdistribusi secara elektronik demi keterbukaan pemeriksaan LHP (Laporan Hasil Pemeriksaan).",
    dasarHukum: "UUD 1945 Pasal 23E & UU No. 15 Tahun 2006 tentang Badan Pemeriksa Keuangan",
    clientIdDefault: "BPK-AUDIT-KEMENDIKDASMEN-2026"
  },
  bpkp_siswaskau: {
    name: "SISWASKAU BPKP RI",
    sub: "Sistem Pengawasan Keuangan Akuntabilitas Nasional",
    lembaga: "BPKP RI",
    keyUrl: "https://www.bpkp.go.id/",
    keyLabel: "Portal Integrasi API BPKP RI (bpkp.go.id)",
    placeholder: "bpkp_apip_key_sec_...",
    defaultEndpoint: "https://api.bpkp.go.id/v1/pengawasan/mandatori-pendidikan",
    description: "Layanan API Pengawasan Intern Pemerintah (APIP) BPKP untuk pemantauan ketaatan mandatory spending 20% APBN pendidikan, mitigasi fraud AI-FAA, dan audit kepatuhan transfer kas ke satuan pendidikan.",
    dasarHukum: "PP No. 60 Tahun 2008 tentang Sistem Pengendalian Intern Pemerintah (SPIP)",
    clientIdDefault: "BPKP-APIP-NASIONAL-8812"
  },
  simda_keuangan: {
    name: "SIMDA-NG / CMS BPKP",
    sub: "Integrasi SP2D & Kas Belanja Pendidikan Daerah",
    lembaga: "BPKP RI",
    keyUrl: "https://simda.bpkp.go.id/",
    keyLabel: "Konektor SIMDA Generasi Baru BPKP (simda.bpkp.go.id)",
    placeholder: "simda_oauth_token_...",
    defaultEndpoint: "https://simda-api.bpkp.go.id/v3/apbd/pendidikan/sync",
    description: "Sinkronisasi buku kas umum dan realisasi SP2D belanja pendidikan tingkat provinsi, kabupaten/kota ke buku besar Integrated Blockchain secara berkesinambungan.",
    dasarHukum: "Permendagri No. 77 Tahun 2020 tentang Pedoman Teknis Pengelolaan Keuangan Daerah",
    clientIdDefault: "SIMDA-KASDA-INTEGRATED-004"
  },
  custom_audit: {
    name: "Custom Auditor REST Gateway",
    sub: "Endpoint Gateway Pengawas Internal / Inspektorat",
    lembaga: "Auditor Independen",
    keyUrl: "http://localhost:2028",
    keyLabel: "Internal Audit Gateway (Port 2028)",
    placeholder: "Bearer token atau secret API key inspektorat...",
    defaultEndpoint: "http://localhost:2028/api/bpk-bpkp/audit-stream",
    description: "Koneksi gateway audit mandiri untuk Inspektorat Jenderal Kementerian atau tim auditor independen yang menjalankan verifikasi data transaksi.",
    dasarHukum: "Surat Keputusan Menteri Pendidikan & Pengawasan Internal Pemerintah",
    clientIdDefault: "ITJEN-AUDIT-LOCAL-2028"
  }
};

const DEFAULT_OFFICES: BpkBpkpOffice[] = [
  {
    id: "bpk-pusat",
    lembaga: "BPK RI",
    namaKantor: "Kantor Pusat BPK RI",
    wilayah: "Nasional",
    provinsi: "DKI Jakarta",
    alamat: "Jl. Gatot Subroto No. 31, Jakarta Pusat 10210",
    telepon: "(021) 25549000",
    email: "e-audit@bpk.go.id",
    hotlinePengaduan: "0811-1555-275",
    statusKoneksi: "Terhubung",
    portalUrl: "https://e-audit.bpk.go.id"
  },
  {
    id: "bpkp-pusat",
    lembaga: "BPKP RI",
    namaKantor: "Kantor Pusat BPKP RI",
    wilayah: "Nasional",
    provinsi: "DKI Jakarta",
    alamat: "Jl. Pramuka No. 33, Utan Kayu Utara, Matraman, Jakarta Timur 13120",
    telepon: "(021) 85910031",
    email: "siswaskau@bpkp.go.id",
    hotlinePengaduan: "0811-8888-2757",
    statusKoneksi: "Terhubung",
    portalUrl: "https://www.bpkp.go.id"
  },
  {
    id: "bpk-lpg",
    lembaga: "BPK RI",
    namaKantor: "BPK Perwakilan Provinsi Lampung",
    wilayah: "Provinsi Lampung",
    provinsi: "Lampung",
    alamat: "Jl. Pangeran Emir M. Noer No. 11, Sumur Putri, Teluk Betung Selatan, Kota Bandar Lampung 35215",
    telepon: "(0721) 488055",
    email: "lampung@bpk.go.id",
    hotlinePengaduan: "110 / (0721) 488055",
    statusKoneksi: "Terhubung",
    portalUrl: "https://lampung.bpk.go.id"
  },
  {
    id: "bpkp-lpg",
    lembaga: "BPKP RI",
    namaKantor: "Perwakilan BPKP Provinsi Lampung",
    wilayah: "Provinsi Lampung",
    provinsi: "Lampung",
    alamat: "Jl. Basuki Rahmat No. 33, Teluk Betung Selatan, Kota Bandar Lampung 35211",
    telepon: "(0721) 481190",
    email: "lampung@bpkp.go.id",
    hotlinePengaduan: "(0721) 481190",
    statusKoneksi: "Terhubung",
    portalUrl: "https://www.bpkp.go.id/lampung"
  },
  {
    id: "bpk-jbr",
    lembaga: "BPK RI",
    namaKantor: "BPK Perwakilan Provinsi Jawa Barat",
    wilayah: "Provinsi Jawa Barat",
    provinsi: "Jawa Barat",
    alamat: "Jl. BKR No. 182, Cigereleng, Regol, Kota Bandung 40253",
    telepon: "(022) 5221088",
    email: "jabar@bpk.go.id",
    hotlinePengaduan: "(022) 5221088",
    statusKoneksi: "Terhubung",
    portalUrl: "https://jabar.bpk.go.id"
  },
  {
    id: "bpkp-jbr",
    lembaga: "BPKP RI",
    namaKantor: "Perwakilan BPKP Provinsi Jawa Barat",
    wilayah: "Provinsi Jawa Barat",
    provinsi: "Jawa Barat",
    alamat: "Jl. Cikutra No. 274 A, Sukapada, Cibeunying Kidul, Kota Bandung 40125",
    telepon: "(022) 7200888",
    email: "jabar@bpkp.go.id",
    hotlinePengaduan: "(022) 7200888",
    statusKoneksi: "Terhubung",
    portalUrl: "https://www.bpkp.go.id/jabar"
  },
  {
    id: "bpk-jtm",
    lembaga: "BPK RI",
    namaKantor: "BPK Perwakilan Provinsi Jawa Timur",
    wilayah: "Provinsi Jawa Timur",
    provinsi: "Jawa Timur",
    alamat: "Jl. Raya Juanda No. 36, Semambung, Gedangan, Sidoarjo 61254",
    telepon: "(031) 8669244",
    email: "jatim@bpk.go.id",
    hotlinePengaduan: "(031) 8669244",
    statusKoneksi: "Terhubung",
    portalUrl: "https://jatim.bpk.go.id"
  },
  {
    id: "bpkp-jtm",
    lembaga: "BPKP RI",
    namaKantor: "Perwakilan BPKP Provinsi Jawa Timur",
    wilayah: "Provinsi Jawa Timur",
    provinsi: "Jawa Timur",
    alamat: "Jl. Raya Bandara Juanda No. 38, Sidoarjo 61254",
    telepon: "(031) 8671985",
    email: "jatim@bpkp.go.id",
    hotlinePengaduan: "(031) 8671985",
    statusKoneksi: "Terhubung",
    portalUrl: "https://www.bpkp.go.id/jatim"
  }
];

export function BpkBpkpSettings() {
  const [config, setConfig] = useState<BpkBpkpApiConfig>({
    provider: "bpk_eaudit",
    apiKey: "bpk_live_sec_eaudit_2026_98812bca019",
    clientId: "BPK-AUDIT-KEMENDIKDASMEN-2026",
    endpointUrl: "https://api-eaudit.bpk.go.id/v2/lhp/anggaran-pendidikan",
    instansiScope: "nasional",
    syncMode: "realtime_push",
    isActive: true,
    autoReportAnomalies: true,
    includeAuditTrail: true,
    encryptionMode: "TLS_1_3_HMAC"
  });

  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isDirectTesting, setIsDirectTesting] = useState(false);
  const [directTestResult, setDirectTestResult] = useState<any>(null);
  const [testResult, setTestResult] = useState<BpkBpkpAuditTestResult | null>(null);

  const [testScenario, setTestScenario] = useState<"bos_triwulan" | "mandatory_20" | "ai_faa_anomaly" | "block_audit_hash">("bos_triwulan");
  const [officeSearch, setOfficeSearch] = useState("");
  const [officeLembagaFilter, setOfficeLembagaFilter] = useState<"all" | "BPK RI" | "BPKP RI">("all");
  const [offices] = useState<BpkBpkpOffice[]>(DEFAULT_OFFICES);

  // Load existing config from PostgreSQL on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("http://localhost:2028/api/bpk-bpkp/config");
        if (res.ok) {
          const data = await res.json();
          if (data && data.hasKey) {
            setConfig((prev) => ({
              ...prev,
              provider: data.provider || prev.provider,
              apiKey: data.apiKey || prev.apiKey,
              clientId: data.clientId || prev.clientId,
              endpointUrl: data.endpointUrl || prev.endpointUrl,
              instansiScope: data.instansiScope || prev.instansiScope,
              syncMode: data.syncMode || prev.syncMode,
              isActive: data.isActive !== undefined ? data.isActive : prev.isActive,
              autoReportAnomalies: data.autoReportAnomalies !== undefined ? data.autoReportAnomalies : prev.autoReportAnomalies,
              includeAuditTrail: data.includeAuditTrail !== undefined ? data.includeAuditTrail : prev.includeAuditTrail,
              encryptionMode: data.encryptionMode || prev.encryptionMode,
              updatedAt: data.updatedAt
            }));
          }
        }
      } catch (e) {
        console.warn("Gagal memuat konfigurasi BPK/BPKP dari proxy:", e);
      }
    }
    loadConfig();
  }, []);

  const meta = PROVIDER_METADATA[config.provider];

  const handleProviderChange = (prov: BpkBpkpProvider) => {
    const newMeta = PROVIDER_METADATA[prov];
    setConfig((prev) => ({
      ...prev,
      provider: prov,
      endpointUrl: newMeta.defaultEndpoint,
      clientId: newMeta.clientIdDefault
    }));
    setTestResult(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("http://localhost:2028/api/bpk-bpkp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3500);
      } else {
        alert("Gagal menyimpan konfigurasi: " + (data.message || data.error));
      }
    } catch (e: any) {
      alert("Koneksi gagal ke server proxy port 2028: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunDirectConnectionTest = async () => {
    setIsDirectTesting(true);
    setDirectTestResult(null);
    try {
      const res = await fetch("http://localhost:2028/api/bpk-bpkp/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointUrl: config.endpointUrl,
          apiKey: config.apiKey,
          clientId: config.clientId,
          provider: config.provider
        })
      });
      const data = await res.json();
      setDirectTestResult(data);
      if (data.success && data.diagnostics) {
        setTestResult((prev) => prev ? { ...prev, diagnostics: data.diagnostics, latencyMs: data.latencyMs } : prev);
      }
    } catch (e: any) {
      setDirectTestResult({
        success: false,
        latencyMs: 0,
        message: "Gagal menghubungi proxy server port 2028: " + e.message,
        blockHashProof: "0x0000000000000000000000000000000000000000000000000000000000000000",
        diagnostics: {
          isRealLive: false,
          targetUrl: config.endpointUrl,
          checkedAt: new Date().toISOString(),
          networkError: e.message
        }
      });
    } finally {
      setIsDirectTesting(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("http://localhost:2028/api/bpk-bpkp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          clientId: config.clientId,
          endpointUrl: config.endpointUrl,
          testScenario,
          instansiScope: config.instansiScope,
          encryptionMode: config.encryptionMode
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data);
      } else {
        setTestResult({
          success: false,
          latencyMs: 120,
          provider: config.provider,
          referenceNo: `REF-ERR-${Date.now()}`,
          timestamp: new Date().toISOString(),
          blockHashProof: "0x0000000000000000000000000000000000000000000000000000000000000000",
          message: data.message || "Uji transmisi audit gagal dilakukan.",
          auditScope: config.instansiScope,
          timPemeriksa: "Sistem Keamanan Terpadu",
          statusLhp: "Gagal Verifikasi",
          anomaliDetected: 0
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        latencyMs: 95,
        provider: config.provider,
        referenceNo: `REF-TIMEOUT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        blockHashProof: "0x0000000000000000000000000000000000000000000000000000000000000000",
        message: "Proxy server lokal tidak merespons atau offline: " + e.message,
        auditScope: config.instansiScope,
        timPemeriksa: "Auditor Gateway",
        statusLhp: "Koneksi Terputus",
        anomaliDetected: 0
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyApiKey = () => {
    if (config.apiKey) {
      navigator.clipboard.writeText(config.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const filteredOffices = offices.filter((o) => {
    const matchSearch =
      o.namaKantor.toLowerCase().includes(officeSearch.toLowerCase()) ||
      o.provinsi.toLowerCase().includes(officeSearch.toLowerCase()) ||
      o.alamat.toLowerCase().includes(officeSearch.toLowerCase());
    const matchLembaga = officeLembagaFilter === "all" || o.lembaga === officeLembagaFilter;
    return matchSearch && matchLembaga;
  });

  return (
    <DashboardLayout
      pageTitle="Pengaturan API Auditor BPK & BPKP"
      description="Konfigurasi Integrasi Pengawasan Keuangan Negara (e-Audit BPK RI & SISWASKAU BPKP RI) untuk Pengawasan Real-Time Buku Besar Blockchain"
    >
      <div className="space-y-6">
        {/* Banner Status Header */}
        <div className="relative overflow-hidden rounded-xl border border-blue-500/20 bg-gradient-to-r from-navy via-slate-900 to-blue-950 p-6 text-white shadow-xl">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/20 text-gold border border-gold/30">
                  <Scale size={18} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                  Integrasi Badan Pemeriksa Keuangan & Pengawasan Intern Pemerintah
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                API Auditor BPK RI & APIP BPKP RI
              </h2>
              <p className="text-xs leading-relaxed text-slate-300">
                Menghubungkan buku besar transaksi pendidikan nasional dengan <strong>e-Audit BPK RI</strong> (Lembaga Pemeriksa Eksternal) dan <strong>SISWASKAU BPKP RI</strong> (Pengawas Intern Pemerintah). Setiap penyaluran dana BOS, realisasi belanja SP2D, dan temuan anomali AI-FAA ditransmisikan secara kriptografis untuk menjaga akuntabilitas mandatory spending 20% APBN.
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0 md:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                <ShieldCheck size={14} />
                <span>e-Audit Stream Siaga (Port 2028)</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[11px] text-blue-300">
                <FileCheck2 size={13} />
                <span>Standar Kriptografi: TLS 1.3 + SHA-256</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pemilihan Provider / Lembaga Pengawas */}
        <Panel title="Pilih Platform Integrasi Pengawasan Keuangan" icon={Layers}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(PROVIDER_METADATA) as BpkBpkpProvider[]).map((key) => {
              const item = PROVIDER_METADATA[key];
              const isSelected = config.provider === key;
              return (
                <button
                  key={key}
                  onClick={() => handleProviderChange(key)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        item.lembaga === "BPK RI"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : item.lembaga === "BPKP RI"
                          ? "bg-blue-100 text-blue-900 border border-blue-300"
                          : "bg-slate-100 text-slate-800 border border-slate-300"
                      }`}>
                        {item.lembaga}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-blue-600">
                        {item.name}
                      </h4>
                      <p className="text-[11px] font-medium text-slate-500">{item.sub}</p>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono truncate">
                    {item.dasarHukum}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Panel Konfigurasi Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel title={`Parameter Koneksi — ${meta.name}`} icon={Key}>
              <div className="space-y-5">
                {/* Info Provider Aktif */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-blue-950">{meta.name}</span>
                        <span className="text-[11px] text-blue-800 font-medium">({meta.lembaga})</span>
                      </div>
                      <p className="text-xs text-blue-900/80 leading-relaxed">{meta.description}</p>
                      <p className="text-[11px] text-blue-700 font-semibold pt-1">
                        Landasan Hukum: <span className="font-normal italic">{meta.dasarHukum}</span>
                      </p>
                    </div>
                    <a
                      href={meta.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 shrink-0 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-700 shadow-sm border border-blue-200 hover:bg-blue-100"
                    >
                      <span>Buka Portal</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>

                {/* API Key / Token */}
                <div className="space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Key size={13} className="text-blue-600" />
                      <span>API Secret Token / Authorization Bearer</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-500">{meta.keyLabel}</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={config.apiKey}
                      onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                      placeholder={meta.placeholder}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 pr-24"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title={showKey ? "Sembunyikan" : "Tampilkan"}
                      >
                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={copyApiKey}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Salin API Key"
                      >
                        {copiedKey ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Token ini digunakan untuk autentikasi mTLS/Bearer saat mengirimkan laporan berkala dan bukti transaksi audit ke server {meta.lembaga}.
                  </p>
                </div>

                {/* Client ID & Endpoint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 size={13} className="text-blue-600" />
                      <span>Client ID / Kode Instansi Pengirim</span>
                    </label>
                    <input
                      type="text"
                      value={config.clientId || ""}
                      onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                      placeholder="e.g. BPK-AUDIT-KEMENDIKDASMEN-2026"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe size={13} className="text-blue-600" />
                        <span>Endpoint URL API Pengawasan</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRunDirectConnectionTest}
                          disabled={isDirectTesting}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-300 transition-colors disabled:opacity-50"
                        >
                          <Wifi size={11} className={isDirectTesting ? "animate-spin" : ""} />
                          <span>{isDirectTesting ? "Menguji..." : "Uji Koneksi"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, endpointUrl: meta.defaultEndpoint })}
                          className="text-[10px] text-slate-500 hover:text-blue-600 hover:underline"
                        >
                          Reset Default
                        </button>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={config.endpointUrl}
                      onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Scope & Mode Sinkronisasi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Cakupan Pengawasan (Scope)</label>
                    <select
                      value={config.instansiScope}
                      onChange={(e: any) => setConfig({ ...config, instansiScope: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="nasional">Nasional (Kemenkeu, Kemendikdasmen, Kemenag & 38 Provinsi)</option>
                      <option value="kementerian">Tingkat Kementerian Pembina Saja</option>
                      <option value="daerah_provinsi">Agregat Tingkat Provinsi (Dinas Pendidikan Provinsi)</option>
                      <option value="daerah_kabkota">Tingkat Satuan & Kabupaten/Kota (BOS & Sekolah)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Metode Transmisi Audit</label>
                    <select
                      value={config.syncMode}
                      onChange={(e: any) => setConfig({ ...config, syncMode: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="realtime_push">Real-Time Event Stream (Setiap Transaksi Masuk)</option>
                      <option value="batch_scheduled">Batch Terjadwal (Harian Pukul 23:59 WIB)</option>
                      <option value="on_demand_investigation">On-Demand Pemeriksaan Khusus (PDTT)</option>
                    </select>
                  </div>
                </div>

                {/* Enkripsi & Keamanan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock size={13} className="text-blue-600" />
                    <span>Protokol Enkripsi & Validasi Tanda Tangan Digital</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      config.encryptionMode === "TLS_1_3_HMAC"
                        ? "border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="encryptionMode"
                        checked={config.encryptionMode === "TLS_1_3_HMAC"}
                        onChange={() => setConfig({ ...config, encryptionMode: "TLS_1_3_HMAC" })}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-xs font-bold">TLS 1.3 + HMAC-SHA256</p>
                        <p className="text-[11px] text-slate-500">Standar resmi portal e-Audit BPK RI untuk transmisi perbankan & rekening kas.</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      config.encryptionMode === "ASYMMETRIC_RSA2048"
                        ? "border-blue-500 bg-blue-50/40 text-blue-950 ring-1 ring-blue-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="encryptionMode"
                        checked={config.encryptionMode === "ASYMMETRIC_RSA2048"}
                        onChange={() => setConfig({ ...config, encryptionMode: "ASYMMETRIC_RSA2048" })}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-xs font-bold">Asymmetric RSA-2048 (BSrE)</p>
                        <p className="text-[11px] text-slate-500">Sertifikat digital terverifikasi Balai Sertifikasi Elektronik untuk APIP BPKP.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sakelar / Toggles */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Aktifkan Transmisi Data ke Auditor</p>
                      <p className="text-[11px] text-slate-500">Mengizinkan gateway mengirimkan feed data transaksi secara otomatis.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isActive}
                        onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Notifikasi Anomali AI-FAA Otomatis</p>
                      <p className="text-[11px] text-slate-500">Kirim peringatan anomali (indikasi mark-up atau selisih kas) ke dashboard tim pemeriksa BPK/BPKP.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoReportAnomalies}
                        onChange={(e) => setConfig({ ...config, autoReportAnomalies: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Sertakan Hash Kriptografi Blockchain</p>
                      <p className="text-[11px] text-slate-500">Menyertakan root hash merkle tree sebagai bukti tidak terbantahkan (immutable proof) integritas data.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeAuditTrail}
                        onChange={(e) => setConfig({ ...config, includeAuditTrail: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Inline Real Connection Test Result Alert (Matching Polsek Reference Image) */}
                {directTestResult && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-start gap-3 animate-fadeIn text-xs mt-4 ${
                      directTestResult.success
                        ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                        : "bg-red-50/80 border-red-200 text-red-950"
                    }`}
                  >
                    {directTestResult.success ? (
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="block font-bold">
                          {directTestResult.success ? "Uji Koneksi API Berhasil" : "Koneksi API Gagal"}
                        </strong>
                        {directTestResult.latencyMs !== undefined && (
                          <span className="text-[10px] font-mono bg-white/80 px-2 py-0.5 rounded border border-emerald-300 font-bold text-emerald-800 shrink-0">
                            {directTestResult.latencyMs} ms
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] mt-0.5 block leading-relaxed">
                        {directTestResult.message}
                      </span>

                      {directTestResult.diagnostics && (
                        <div className="mt-2.5 pt-2 border-t border-emerald-200/80 text-[11px] space-y-1">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[10px]">
                            <div className="flex items-center justify-between bg-white/70 px-2 py-1 rounded border border-emerald-100">
                              <span className="text-slate-500">IP Remote Server:</span>
                              <span className="font-bold text-slate-800">{directTestResult.diagnostics.resolvedIp || "-"}</span>
                            </div>
                            <div className="flex items-center justify-between bg-white/70 px-2 py-1 rounded border border-emerald-100">
                              <span className="text-slate-500">Status HTTP:</span>
                              <span className="font-bold text-emerald-700">
                                {directTestResult.diagnostics.httpStatus || 200} {directTestResult.diagnostics.httpStatusText || "OK"}
                              </span>
                            </div>
                            {directTestResult.diagnostics.tlsProtocol && (
                              <div className="flex items-center justify-between bg-white/70 px-2 py-1 rounded border border-emerald-100">
                                <span className="text-slate-500">Enkripsi TLS:</span>
                                <span className="font-bold text-slate-800">
                                  {directTestResult.diagnostics.tlsProtocol} ({directTestResult.diagnostics.tlsCipher?.split('_')[1] || "AES-GCM"})
                                </span>
                              </div>
                            )}
                            {directTestResult.diagnostics.certIssuer && (
                              <div className="flex items-center justify-between bg-white/70 px-2 py-1 rounded border border-emerald-100">
                                <span className="text-slate-500">Otoritas Sertifikat:</span>
                                <span className="font-bold text-slate-800 truncate ml-2" title={directTestResult.diagnostics.certIssuer}>
                                  {directTestResult.diagnostics.certIssuer}
                                </span>
                              </div>
                            )}
                          </div>
                          {directTestResult.blockHashProof && (
                            <div className="bg-white/70 px-2 py-1 rounded border border-emerald-100 font-mono text-[9px] text-slate-600 flex items-center justify-between gap-2">
                              <span className="shrink-0 text-slate-400">Merkle Hash:</span>
                              <span className="truncate font-semibold text-emerald-900">{directTestResult.blockHashProof}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {!directTestResult.success && (
                        <div className="mt-2 text-[10px] text-red-700 bg-red-100/60 p-2 rounded">
                          <strong>Tips Pemecahan Masalah:</strong>
                          <ul className="list-disc pl-3 mt-1 space-y-0.5">
                            <li>Pastikan endpoint URL ({config.endpointUrl}) aktif dan dapat dijangkau oleh server proxy port 2028.</li>
                            <li>Periksa validitas sertifikat BSrE atau token otentikasi API BPK/BPKP.</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions Footer - Prominent Style (Matching Polsek Reference Image) */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 mt-5 bg-slate-50 -mx-4 -mb-4 p-4 rounded-b-xl">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleRunDirectConnectionTest}
                      disabled={isDirectTesting}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-ink shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Play size={13} className={isDirectTesting ? "animate-spin text-blue-700" : "text-blue-700"} />
                      <span>{isDirectTesting ? "Menguji API..." : "Uji Koneksi API"}</span>
                    </button>
                    <span className="text-[11px] text-muted hidden sm:inline">
                      Uji ping endpoint & verifikasi live
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {saveSuccess && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-fadeIn mr-1">
                        <CheckCircle2 size={16} />
                        <span>Tersimpan!</span>
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleProviderChange(config.provider)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer"
                    >
                      <RotateCcw size={13} />
                      <span>Reset</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={14} />}
                      <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan API BPK & BPKP"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* Kolom Kanan: Uji Transmisi Audit Live */}
          <div className="space-y-6">
            <Panel title="Uji Koneksi & Simulasi Transmisi Audit" icon={Play}>
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lakukan simulasi pengiriman paket data audit ke server pengawas untuk memverifikasi autentikasi, integritas enkripsi, dan pembacaan catatan audit buku besar.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pilih Skenario Audit</label>
                  <select
                    value={testScenario}
                    onChange={(e: any) => setTestScenario(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="bos_triwulan">Pemeriksaan Penyaluran BOS Reguler Triwulan I</option>
                    <option value="mandatory_20">Audit Kepatuhan Mandatory Spending 20% APBN</option>
                    <option value="ai_faa_anomaly">Simulasi Notifikasi Anomali AI-FAA (Mark-Up)</option>
                    <option value="block_audit_hash">Verifikasi Kriptografi Blok Transaksi Terdistribusi</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Mengirimkan Paket Audit ke {meta.lembaga}...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Jalankan Uji Transmisi Live</span>
                    </>
                  )}
                </button>

                {/* Hasil Uji Transmisi */}
                {testResult && (
                  <div
                    className={`rounded-lg border p-4 space-y-3 animate-fadeIn ${
                      testResult.success
                        ? "border-emerald-200 bg-emerald-50/70"
                        : "border-rose-200 bg-rose-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {testResult.success ? (
                          <CheckCircle2 size={16} className="text-emerald-600" />
                        ) : (
                          <AlertCircle size={16} className="text-rose-600" />
                        )}
                        <span className={`text-xs font-bold ${
                          testResult.success ? "text-emerald-900" : "text-rose-900"
                        }`}>
                          {testResult.success ? "Transmisi Audit Terverifikasi" : "Uji Transmisi Gagal"}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {testResult.latencyMs} ms
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${
                      testResult.success ? "text-emerald-800" : "text-rose-800"
                    }`}>
                      {testResult.message}
                    </p>

                    <div className="rounded border border-slate-200 bg-white p-2.5 space-y-1.5 text-[11px]">
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Nomor Registrasi:</span>
                        <span className="font-mono font-semibold text-slate-800">{testResult.referenceNo}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Tim Pemeriksa:</span>
                        <span className="font-medium text-slate-800">{testResult.timPemeriksa}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Status Opini / LHP:</span>
                        <span className="font-semibold text-emerald-700">{testResult.statusLhp}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1">
                        <span className="text-slate-400 text-[10px]">Bukti Kriptografi (Merkle Hash):</span>
                        <span className="font-mono text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded break-all border border-blue-100">
                          {testResult.blockHashProof}
                        </span>
                      </div>

                      {testResult.diagnostics && (
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5 text-[10px]">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              IP: {testResult.diagnostics.resolvedIp || "127.0.0.1"}
                            </span>
                            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              HTTP {testResult.diagnostics.httpStatus || 200}
                            </span>
                            <span className="font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              {testResult.diagnostics.tlsProtocol || "TLSv1.3"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDirectTestResult(testResult);
                              setIsModalOpen(true);
                            }}
                            className="font-bold text-blue-700 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Rincian Telemetri Jaringan &raquo;</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Petunjuk Sertifikasi */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FileSpreadsheet size={13} className="text-gold" />
                    <span>Standar LHP BPK RI & APIP BPKP</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Data yang ditransmisikan melalui API ini mematuhi <strong>Standar Pemeriksaan Keuangan Negara (SPKN)</strong> dan regulasi e-Audit nasional untuk mendukung predikat <em>Wajar Tanpa Pengecualian (WTP)</em>.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* Direktori Kantor Perwakilan BPK RI & BPKP */}
        <Panel title="Direktori Kantor Perwakilan BPK RI & BPKP (38 Provinsi)" icon={Building2}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kantor perwakilan, provinsi, kota..."
                  value={officeSearch}
                  onChange={(e) => setOfficeSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-slate-500">Filter Lembaga:</span>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-medium">
                  {(["all", "BPK RI", "BPKP RI"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setOfficeLembagaFilter(mode)}
                      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                        officeLembagaFilter === mode
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {mode === "all" ? "Semua Lembaga" : mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredOffices.map((office) => (
                <div
                  key={office.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold ${
                        office.lembaga === "BPK RI"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-blue-100 text-blue-900 border border-blue-300"
                      }`}>
                        {office.lembaga}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {office.statusKoneksi}
                      </span>
                    </div>

                    <h4 className="font-display text-xs font-bold text-slate-900 leading-snug">
                      {office.namaKantor}
                    </h4>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{office.alamat}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PhoneCall size={12} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-[10px]">{office.telepon}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-[10px] truncate">{office.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">
                      Wilayah: {office.provinsi}
                    </span>
                    <a
                      href={office.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                    >
                      <span>Web</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </DashboardLayout>
  );
}
export default BpkBpkpSettings;

