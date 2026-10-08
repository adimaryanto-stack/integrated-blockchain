import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import {
  FileBadge,
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
  Globe,
  FileCheck2,
  Lock,
  Search,
  PhoneCall,
  Mail,
  MapPin,
  ShieldAlert,
  Briefcase,
  FileText,
  BadgeCheck,
  Wifi
} from "lucide-react";
import {
  KejaksaanApiConfig,
  KejaksaanProvider,
  KejaksaanOffice,
  KejaksaanAuditTestResult
} from "@/types";


interface ProviderMeta {
  name: string;
  sub: string;
  lembaga: "Kejaksaan RI";
  keyUrl: string;
  keyLabel: string;
  placeholder: string;
  defaultEndpoint: string;
  description: string;
  dasarHukum: string;
  clientIdDefault: string;
}

const PROVIDER_METADATA: Record<KejaksaanProvider, ProviderMeta> = {
  kejaksaan_cms_pidsus: {
    name: "CMS Pidsus Kejaksaan RI",
    sub: "Case Management System Tindak Pidana Khusus",
    lembaga: "Kejaksaan RI",
    keyUrl: "https://cms.kejaksaan.go.id/",
    keyLabel: "Portal CMS Kejaksaan RI (cms.kejaksaan.go.id)",
    placeholder: "kejaksaan_pidsus_token_...",
    defaultEndpoint: "https://api-cms.kejaksaan.go.id/v2/pidsus/korupsi-anggaran",
    description: "Sistem Manajemen Perkara Tindak Pidana Khusus (JAMPIDSUS) untuk pelimpahan bukti digital, penanganan perkara tipikor pengadaan, dan audit penyimpangan keuangan negara sektor pendidikan.",
    dasarHukum: "UU No. 11 Tahun 2021 tentang Kejaksaan Republik Indonesia & KUHAP",
    clientIdDefault: "KEJAKSAAN-PIDSUS-KEMENDIKDASMEN-2026"
  },
  kejaksaan_halojpn: {
    name: "HALO JPN / JAMDATUN",
    sub: "Jaksa Pengacara Negara & Pendampingan Hukum",
    lembaga: "Kejaksaan RI",
    keyUrl: "https://halojpn.id/",
    keyLabel: "Portal Pelayanan Hukum HALO JPN (halojpn.id)",
    placeholder: "halojpn_auth_sec_...",
    defaultEndpoint: "https://api.halojpn.id/v1/pendampingan/proyek-pendidikan",
    description: "Layanan Jaksa Pengacara Negara (JAMDATUN) untuk pendampingan hukum preventif, *legal audit*, dan pertimbangan hukum pengelolaan proyek pengadaan sarana prasarana sekolah agar terhindar dari sengketa.",
    dasarHukum: "Perja No. PER-025/A/JA/11/2015 tentang Petunjuk Pelaksanaan Penegakan Hukum JAMDATUN",
    clientIdDefault: "JAMDATUN-LEGAL-DIKNAS-552"
  },
  kejaksaan_pps_intel: {
    name: "PPS JAMINTEL Kejaksaan RI",
    sub: "Pengamanan Pembangunan Strategis Sarana Pendidikan",
    lembaga: "Kejaksaan RI",
    keyUrl: "https://intel.kejaksaan.go.id/",
    keyLabel: "Portal Intelijen Kejaksaan RI (intel.kejaksaan.go.id)",
    placeholder: "pps_intel_auth_token_...",
    defaultEndpoint: "https://api-intel.kejaksaan.go.id/v1/pps/kawal-anggaran",
    description: "Pengamanan Pembangunan Strategis (PPS) oleh Jaksa Intelijen untuk mengawal proyek revitalisasi sekolah, pembangunan laboratorium, dan sarana pendidikan dari ancaman AGHT (Ancaman, Gangguan, Hambatan, dan Tantangan).",
    dasarHukum: "Petunjuk Teknis Jaksa Agung Muda Intelijen No. B-484/D/Dip/03/2020",
    clientIdDefault: "PPS-INTEL-NASIONAL-331"
  },
  custom_kejaksaan: {
    name: "Gateway Adhyaksa Mandiri",
    sub: "Konektor Kejati & Kejari Kewilayahan",
    lembaga: "Kejaksaan RI",
    keyUrl: "http://localhost:2028",
    keyLabel: "Gateway Kejaksaan Lokal (Port 2028)",
    placeholder: "Bearer token atau secret API key internal...",
    defaultEndpoint: "http://localhost:2028/api/kejaksaan/stream",
    description: "Konektor gateway mandiri untuk sinkronisasi feed buku besar dan notifikasi anomali belanja langsung ke Kejaksaan Tinggi (Kejati) dan Kejaksaan Negeri (Kejari) setempat.",
    dasarHukum: "Nota Kesepahaman Bersama Pengawasan Pengadaan Barang & Jasa",
    clientIdDefault: "ADHYAKSA-LOCAL-PORT2028"
  }
};

const KEJAKSAAN_OFFICES: KejaksaanOffice[] = [
  {
    id: "kejagung-pusat",
    lembaga: "Kejaksaan RI",
    satker: "Kejaksaan Agung",
    namaKantor: "Kejaksaan Agung Republik Indonesia",
    wilayah: "Nasional",
    provinsi: "DKI Jakarta",
    alamat: "Jl. Sultan Hasanuddin No. 1, Kebayoran Baru, Jakarta Selatan 12160",
    telepon: "(021) 7221337",
    email: "humas.puspenkum@kejaksaan.go.id",
    hotlinePengaduan: "150227",
    statusKoneksi: "Terhubung",
    portalUrl: "https://www.kejaksaan.go.id"
  },
  {
    id: "kejati-dki",
    lembaga: "Kejaksaan RI",
    satker: "Kejaksaan Tinggi",
    namaKantor: "Kejaksaan Tinggi DKI Jakarta",
    wilayah: "Provinsi DKI Jakarta",
    provinsi: "DKI Jakarta",
    alamat: "Jl. H. R. Rasuna Said Kav. C-4, Kuningan Timur, Setiabudi, Jakarta Selatan 12950",
    telepon: "(021) 5252033",
    email: "kejati.dki@kejaksaan.go.id",
    hotlinePengaduan: "150227 / (021) 5252033",
    statusKoneksi: "Terhubung",
    portalUrl: "https://kejati-dki.kejaksaan.go.id"
  },
  {
    id: "kejati-lpg",
    lembaga: "Kejaksaan RI",
    satker: "Kejaksaan Tinggi",
    namaKantor: "Kejaksaan Tinggi Lampung",
    wilayah: "Provinsi Lampung",
    provinsi: "Lampung",
    alamat: "Jl. Wolter Monginsidi No. 182, Pengajaran, Teluk Betung Utara, Kota Bandar Lampung 35214",
    telepon: "(0721) 482431",
    email: "kejati.lampung@kejaksaan.go.id",
    hotlinePengaduan: "150227 / (0721) 482431",
    statusKoneksi: "Terhubung",
    portalUrl: "https://kejati-lampung.kejaksaan.go.id"
  },
  {
    id: "kejati-jbr",
    lembaga: "Kejaksaan RI",
    satker: "Kejaksaan Tinggi",
    namaKantor: "Kejaksaan Tinggi Jawa Barat",
    wilayah: "Provinsi Jawa Barat",
    provinsi: "Jawa Barat",
    alamat: "Jl. L. L. R.E. Martadinata No. 54, Citarum, Bandung Wetan, Kota Bandung 40115",
    telepon: "(022) 4230491",
    email: "kejati.jabar@kejaksaan.go.id",
    hotlinePengaduan: "150227 / (022) 4230491",
    statusKoneksi: "Terhubung",
    portalUrl: "https://kejati-jabar.kejaksaan.go.id"
  },
  {
    id: "kejati-jtm",
    lembaga: "Kejaksaan RI",
    satker: "Kejaksaan Tinggi",
    namaKantor: "Kejaksaan Tinggi Jawa Timur",
    wilayah: "Provinsi Jawa Timur",
    provinsi: "Jawa Timur",
    alamat: "Jl. Ahmad Yani No. 54-56, Wonokromo, Kota Surabaya 60243",
    telepon: "(031) 8283311",
    email: "kejati.jatim@kejaksaan.go.id",
    hotlinePengaduan: "150227 / (031) 8283311",
    statusKoneksi: "Terhubung",
    portalUrl: "https://kejati-jatim.kejaksaan.go.id"
  },
  {
    id: "kejati-sumut",
    lembaga: "Kejaksaan RI",
    satker: "Kejaksaan Tinggi",
    namaKantor: "Kejaksaan Tinggi Sumatera Utara",
    wilayah: "Provinsi Sumatera Utara",
    provinsi: "Sumatera Utara",
    alamat: "Jl. Jenderal A. H. Nasution No. 1 C, Medan Johor, Kota Medan 20143",
    telepon: "(061) 7878701",
    email: "kejati.sumut@kejaksaan.go.id",
    hotlinePengaduan: "150227 / (061) 7878701",
    statusKoneksi: "Terhubung",
    portalUrl: "https://kejati-sumut.kejaksaan.go.id"
  },
  {
    id: "kejati-sulsel",
    lembaga: "Kejaksaan RI",
    satker: "Kejaksaan Tinggi",
    namaKantor: "Kejaksaan Tinggi Sulawesi Selatan",
    wilayah: "Provinsi Sulawesi Selatan",
    provinsi: "Sulawesi Selatan",
    alamat: "Jl. Urip Sumoharjo No. 244, Karampuang, Panakkukang, Kota Makassar 90231",
    telepon: "(0411) 453181",
    email: "kejati.sulsel@kejaksaan.go.id",
    hotlinePengaduan: "150227 / (0411) 453181",
    statusKoneksi: "Terhubung",
    portalUrl: "https://kejati-sulsel.kejaksaan.go.id"
  }
];

export function KejaksaanSettings() {
  const [config, setConfig] = useState<KejaksaanApiConfig>({
    provider: "kejaksaan_cms_pidsus",
    apiKey: "kejaksaan_live_sec_2026_9941acb0219f",
    clientId: "KEJAKSAAN-PIDSUS-KEMENDIKDASMEN-2026",
    endpointUrl: "https://api-cms.kejaksaan.go.id/v2/pidsus/korupsi-anggaran",
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
  const [testResult, setTestResult] = useState<KejaksaanAuditTestResult | null>(null);

  const [testScenario, setTestScenario] = useState<"pidsus_tipikor" | "halojpn_legal" | "pps_kawal" | "blockchain_evidence">("pidsus_tipikor");
  const [officeSearch, setOfficeSearch] = useState("");
  const [satkerFilter, setSatkerFilter] = useState<string>("all");
  const [offices, setOffices] = useState<KejaksaanOffice[]>(KEJAKSAAN_OFFICES);

  // Load existing config from PostgreSQL on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("http://localhost:2028/api/kejaksaan/config");
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
        console.warn("Gagal memuat konfigurasi Kejaksaan dari proxy:", e);
      }

      try {
        const dirRes = await fetch("http://localhost:2028/api/kejaksaan/directory");
        if (dirRes.ok) {
          const dirData = await dirRes.json();
          if (Array.isArray(dirData) && dirData.length > 0) {
            setOffices(dirData);
          }
        }
      } catch (dirErr) {
        console.warn("Gagal memuat direktori kantor Kejaksaan dari database:", dirErr);
      }
    }
    loadConfig();
  }, []);

  const meta = PROVIDER_METADATA[config.provider];

  const handleProviderChange = (prov: KejaksaanProvider) => {
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
      const res = await fetch("http://localhost:2028/api/kejaksaan/config", {
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
      const res = await fetch("http://localhost:2028/api/kejaksaan/test-connection", {
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
      const res = await fetch("http://localhost:2028/api/kejaksaan/test", {
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
          latencyMs: 135,
          provider: config.provider,
          referenceNo: `KEJAKSAAN-ERR-${Date.now()}`,
          timestamp: new Date().toISOString(),
          blockHashProof: "0x0000000000000000000000000000000000000000000000000000000000000000",
          message: data.message || "Uji transmisi Adhyaksa gagal.",
          auditScope: config.instansiScope,
          bidangPenerima: "Kejaksaan Agung RI",
          statusTelaah: "Gagal Verifikasi",
          anomaliDetected: 0
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        latencyMs: 92,
        provider: config.provider,
        referenceNo: `KEJAKSAAN-TIMEOUT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        blockHashProof: "0x0000000000000000000000000000000000000000000000000000000000000000",
        message: "Proxy server lokal tidak merespons atau offline: " + e.message,
        auditScope: config.instansiScope,
        bidangPenerima: "Adhyaksa Gateway Interoperability",
        statusTelaah: "Koneksi Terputus",
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
      o.wilayah.toLowerCase().includes(officeSearch.toLowerCase()) ||
      o.alamat.toLowerCase().includes(officeSearch.toLowerCase());
    const matchSatker = satkerFilter === "all" || o.satker === satkerFilter;
    return matchSearch && matchSatker;
  });

  return (
    <DashboardLayout
      pageTitle="API Kejaksaan RI"
      description="Konfigurasi Integrasi Penegakan Hukum & Pengamanan Pembangunan Strategis Kejaksaan RI (CMS Pidsus, HALO JPN & PPS JAMINTEL)"
    >
      <div className="space-y-6">
        {/* Banner Status Header */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950 via-slate-900 to-navy p-6 text-white shadow-xl">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FileBadge size={18} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  Integrasi Kejaksaan Republik Indonesia (Tri Krama Adhyaksa)
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                API Penegakan Hukum & Pengamanan Strategis Kejaksaan RI
              </h2>
              <p className="text-xs leading-relaxed text-slate-300">
                Menghubungkan buku besar transaksi pendidikan nasional dengan <strong>CMS Pidsus (Penanganan Tipikor)</strong>, <strong>HALO JPN (Pendampingan Hukum Pengadaan)</strong>, dan <strong>PPS JAMINTEL (Pengamanan Pembangunan Sarana Sekolah)</strong>. Memastikan akuntabilitas belanja APBN/APBD pendidikan dan pencegahan tindak pidana korupsi secara preventif maupun represif.
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0 md:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
                <ShieldCheck size={14} />
                <span>Hotline Adhyaksa 150227 Siaga</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-800/80 px-3 py-1 text-[11px] text-slate-300">
                <FileCheck2 size={13} />
                <span>Bukti Digital Sah Persidangan (UU ITE & KUHAP)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pemilihan Platform Kejaksaan */}
        <Panel title="Pilih Platform Layanan Kejaksaan RI" icon={Layers}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(PROVIDER_METADATA) as KejaksaanProvider[]).map((key) => {
              const item = PROVIDER_METADATA[key];
              const isSelected = config.provider === key;
              return (
                <button
                  key={key}
                  onClick={() => handleProviderChange(key)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {item.lembaga}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-emerald-600">
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

        {/* Panel Form Parameter Koneksi */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Panel title={`Parameter Koneksi — ${meta.name}`} icon={Key}>
              <div className="space-y-5">
                {/* Info Provider */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-emerald-950">{meta.name}</span>
                        <span className="text-[11px] text-emerald-800 font-medium">({meta.lembaga})</span>
                      </div>
                      <p className="text-xs text-emerald-900/80 leading-relaxed">{meta.description}</p>
                      <p className="text-[11px] text-emerald-700 font-semibold pt-1">
                        Landasan Hukum: <span className="font-normal italic">{meta.dasarHukum}</span>
                      </p>
                    </div>
                    <a
                      href={meta.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 shrink-0 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm border border-emerald-200 hover:bg-emerald-100"
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
                      <Key size={13} className="text-emerald-600" />
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 pr-24"
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
                    Token ini digunakan untuk pengiriman transmisi dokumen resmi, audit trail, dan data proyek ke server {meta.lembaga}.
                  </p>
                </div>

                {/* Client ID & Endpoint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 size={13} className="text-emerald-600" />
                      <span>Client ID / Satker Kejaksaan</span>
                    </label>
                    <input
                      type="text"
                      value={config.clientId || ""}
                      onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                      placeholder="e.g. KEJAKSAAN-PIDSUS-KEMENDIKDASMEN-2026"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe size={13} className="text-emerald-600" />
                        <span>Endpoint URL API Kejaksaan</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRunDirectConnectionTest}
                          disabled={isDirectTesting}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 transition-colors disabled:opacity-50"
                        >
                          <Wifi size={11} className={isDirectTesting ? "animate-spin" : ""} />
                          <span>{isDirectTesting ? "Menguji..." : "Uji Koneksi"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, endpointUrl: meta.defaultEndpoint })}
                          className="text-[10px] text-slate-500 hover:text-emerald-600 hover:underline"
                        >
                          Reset Default
                        </button>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={config.endpointUrl}
                      onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Scope & Mode Sinkronisasi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Cakupan Wilayah Kejaksaan</label>
                    <select
                      value={config.instansiScope}
                      onChange={(e: any) => setConfig({ ...config, instansiScope: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="nasional">Nasional (Kejaksaan Agung RI & Seluruh Wilayah)</option>
                      <option value="kejati_provinsi">Tingkat Kejaksaan Tinggi (Kejati 38 Provinsi)</option>
                      <option value="kejari_kabkota">Tingkat Kejaksaan Negeri (Kejari Kabupaten/Kota)</option>
                      <option value="kementerian">Kementerian Pembina (Kemendikdasmen & Kemenag)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Metode Transmisi Adhyaksa</label>
                    <select
                      value={config.syncMode}
                      onChange={(e: any) => setConfig({ ...config, syncMode: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="realtime_push">Real-Time Event Stream (Setiap SP2D & Pengadaan Masuk)</option>
                      <option value="batch_scheduled">Batch Terjadwal (Harian Pukul 23:59 WIB)</option>
                      <option value="on_demand_investigation">On-Demand Penyelidikan Kasus Khusus</option>
                    </select>
                  </div>
                </div>

                {/* Enkripsi & Keamanan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock size={13} className="text-emerald-600" />
                    <span>Protokol Enkripsi & Integritas Alat Bukti Digital</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      config.encryptionMode === "TLS_1_3_HMAC"
                        ? "border-emerald-500 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="encryptionModeKejaksaan"
                        checked={config.encryptionMode === "TLS_1_3_HMAC"}
                        onChange={() => setConfig({ ...config, encryptionMode: "TLS_1_3_HMAC" })}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="text-xs font-bold">TLS 1.3 + HMAC-SHA256 (CMS Pidsus)</p>
                        <p className="text-[11px] text-slate-500">Standar enkripsi dokumen perkara elektronik Kejaksaan RI.</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      config.encryptionMode === "ASYMMETRIC_RSA2048"
                        ? "border-emerald-500 bg-emerald-50/40 text-emerald-950 ring-1 ring-emerald-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="encryptionModeKejaksaan"
                        checked={config.encryptionMode === "ASYMMETRIC_RSA2048"}
                        onChange={() => setConfig({ ...config, encryptionMode: "ASYMMETRIC_RSA2048" })}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <div>
                        <p className="text-xs font-bold">Asymmetric RSA-2048 (Tanda Tangan Digital BSrE)</p>
                        <p className="text-[11px] text-slate-500">Sertifikat digital terverifikasi Balai Sertifikasi Elektronik BSSN.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sakelar Toggles */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Aktifkan Transmisi Data ke Kejaksaan RI</p>
                      <p className="text-[11px] text-slate-500">Mengizinkan pengiriman data pengadaan dan belanja pendidikan secara live.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isActive}
                        onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Teruskan Temuan Tipikor AI-FAA Otomatis</p>
                      <p className="text-[11px] text-slate-500">Meneruskan indikasi tindak pidana korupsi atau pengadaan fiktif ke JAMPIDSUS / Aspidsus Kejati.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoReportAnomalies}
                        onChange={(e) => setConfig({ ...config, autoReportAnomalies: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Sertakan Hash Kriptografi Blockchain</p>
                      <p className="text-[11px] text-slate-500">Menyertakan hash cryptographic block sebagai alat bukti sah di muka persidangan (Pasal 5 UU ITE).</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeAuditTrail}
                        onChange={(e) => setConfig({ ...config, includeAuditTrail: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
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
                            <li>Periksa validitas kredensial otentikasi API Kejaksaan RI.</li>
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
                      <Play size={13} className={isDirectTesting ? "animate-spin text-emerald-700" : "text-emerald-700"} />
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
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={14} />}
                      <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan API Kejaksaan"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* Kolom Kanan: Uji Transmisi Adhyaksa Live */}
          <div className="space-y-6">
            <Panel title="Uji Koneksi & Simulasi Adhyaksa" icon={Play}>
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lakukan simulasi pengiriman laporan dan dokumen pengadaan ke Kejaksaan RI untuk memastikan nomor registrasi surat perintah dan bukti kriptografis tercatat.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pilih Skenario Pengujian</label>
                  <select
                    value={testScenario}
                    onChange={(e: any) => setTestScenario(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="pidsus_tipikor">Penyelidikan Dugaan Tipikor Pengadaan Sekolah</option>
                    <option value="halojpn_legal">Pendampingan Hukum Pengadaan Barang & Jasa (JAMDATUN)</option>
                    <option value="pps_kawal">Pengamanan Pembangunan Strategis (PPS JAMINTEL)</option>
                    <option value="blockchain_evidence">Validasi Bukti Elektronik Merkle Tree Hash (Persidangan)</option>
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
                      <span>Mengirimkan Berkas ke Kejaksaan RI...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Jalankan Uji Transmisi Adhyaksa</span>
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
                          {testResult.success ? "Transmisi Adhyaksa Terverifikasi" : "Uji Transmisi Gagal"}
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
                        <span className="text-slate-400">Nomor Registrasi / Berkas:</span>
                        <span className="font-mono font-semibold text-slate-800">{testResult.referenceNo}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Bidang Penerima:</span>
                        <span className="font-medium text-slate-800">{testResult.bidangPenerima}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Status Telaah Hukum:</span>
                        <span className="font-semibold text-emerald-700">{testResult.statusTelaah}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1">
                        <span className="text-slate-400 text-[10px]">Hash Bukti Digital (Merkle Proof):</span>
                        <span className="font-mono text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded break-all border border-emerald-100">
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
                              {testResult.diagnostics.tlsProtocol || "TLSv1.2"}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setDirectTestResult(testResult);
                              setIsModalOpen(true);
                            }}
                            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Rincian Telemetri Jaringan &raquo;</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hotline Adhyaksa */}
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950">
                    <PhoneCall size={13} className="text-emerald-600" />
                    <span>Contact Center Kejaksaan RI: 150227</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Layanan pengaduan dan konsultasi hukum terpadu Jaksa Agung Muda Bidang Tindak Pidana Khusus, Intelijen, dan Perdata & Tata Usaha Negara.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* Direktori Kejaksaan Tinggi & Satuan Kerja Kejaksaan */}
        <Panel title="Direktori Kejaksaan Tinggi (Kejati) & Kejaksaan Agung RI" icon={Building2}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari satker, provinsi, kejati..."
                  value={officeSearch}
                  onChange={(e) => setOfficeSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-slate-500">Filter Satker:</span>
                <select
                  value={satkerFilter}
                  onChange={(e) => setSatkerFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white py-1 px-2.5 text-xs text-slate-700 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="all">Semua Satuan Kerja</option>
                  <option value="Kejaksaan Agung">Kejaksaan Agung</option>
                  <option value="Kejaksaan Tinggi">Kejaksaan Tinggi (Kejati)</option>
                  <option value="Kejaksaan Negeri">Kejaksaan Negeri (Kejari)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOffices.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        {o.satker}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {o.statusKoneksi}
                      </span>
                    </div>

                    <h4 className="font-display text-xs font-bold text-slate-900 leading-snug">
                      {o.namaKantor}
                    </h4>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{o.alamat}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PhoneCall size={12} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-[10px]">{o.telepon} (Hotline: {o.hotlinePengaduan})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-[10px] truncate">{o.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">
                      Wilayah: {o.provinsi}
                    </span>
                    <a
                      href={o.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:text-emerald-800"
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
export default KejaksaanSettings;

