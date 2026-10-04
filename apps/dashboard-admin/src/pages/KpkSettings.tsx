import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import {
  Gavel,
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
  UserCheck,
  Wifi
} from "lucide-react";
import {
  KpkApiConfig,
  KpkProvider,
  KpkChannel,
  KpkAuditTestResult
} from "@/types";


interface ProviderMeta {
  name: string;
  sub: string;
  lembaga: "KPK RI";
  keyUrl: string;
  keyLabel: string;
  placeholder: string;
  defaultEndpoint: string;
  description: string;
  dasarHukum: string;
  clientIdDefault: string;
}

const PROVIDER_METADATA: Record<KpkProvider, ProviderMeta> = {
  kpk_jaga: {
    name: "JAGA.ID KPK RI",
    sub: "Portal Pencegahan Korupsi & Transparansi Anggaran",
    lembaga: "KPK RI",
    keyUrl: "https://jaga.id/",
    keyLabel: "Portal JAGA KPK RI (jaga.id)",
    placeholder: "kpk_jaga_sec_token_...",
    defaultEndpoint: "https://api.jaga.id/v2/pendidikan/bos-stream",
    description: "Inisiatif pencegahan korupsi KPK untuk transparansi anggaran pendidikan, pemantauan penyaluran dana BOS, DAK Fisik, PIP, dan fasilitas sekolah secara real-time yang dapat diakses oleh masyarakat.",
    dasarHukum: "Instruksi Presiden No. 5 Tahun 2004 & UU No. 19 Tahun 2019 tentang KPK",
    clientIdDefault: "KPK-JAGA-KEMENDIKDASMEN-2026"
  },
  kpk_wbs: {
    name: "KPK WBS (KWS)",
    sub: "KPK Whistleblowing System (Penanganan Pengaduan)",
    lembaga: "KPK RI",
    keyUrl: "https://kws.kpk.go.id/",
    keyLabel: "Portal KPK Whistleblowing System (kws.kpk.go.id)",
    placeholder: "kws_apip_auth_key_...",
    defaultEndpoint: "https://api-kws.kpk.go.id/v1/pengaduan/anggaran-pendidikan",
    description: "Kanal penanganan pengaduan tindak pidana korupsi resmi KPK dengan perlindungan kerahasiaan pelapor untuk menampung indikasi penggelembungan dana (mark-up), proyek fiktif, atau benturan kepentingan.",
    dasarHukum: "UU No. 31 Tahun 1999 jo. UU No. 20 Tahun 2001 & UU No. 13 Tahun 2006 (LPSK)",
    clientIdDefault: "KWS-WBS-INTEGRATED-009"
  },
  kpk_elhkpn: {
    name: "e-LHKPN KPK RI",
    sub: "Integritas Penyelenggara Negara & Kuasa Pengguna Anggaran",
    lembaga: "KPK RI",
    keyUrl: "https://elhkpn.kpk.go.id/",
    keyLabel: "Portal e-LHKPN KPK RI (elhkpn.kpk.go.id)",
    placeholder: "elhkpn_sync_token_...",
    defaultEndpoint: "https://elhkpn-api.kpk.go.id/v3/verifikasi/pejabat-anggaran",
    description: "Verifikasi kepatuhan Laporan Harta Kekayaan Penyelenggara Negara bagi Pejabat Pembuat Komitmen (PPK), Kuasa Pengguna Anggaran (KPA), Kepala Dinas, dan pimpinan perguruan tinggi pengelola anggaran negara.",
    dasarHukum: "UU No. 28 Tahun 1999 tentang Penyelenggara Negara yang Bersih dan Bebas KKN",
    clientIdDefault: "LHKPN-VERIF-DIKNAS-771"
  },
  custom_kpk: {
    name: "Gateway Pencegahan Korupsi Mandiri",
    sub: "Korsup & Kedeputian Pencegahan Internal",
    lembaga: "KPK RI",
    keyUrl: "http://localhost:2028",
    keyLabel: "Gateway Anti-Korupsi Internal (Port 2028)",
    placeholder: "Bearer token atau secret API key inspektorat...",
    defaultEndpoint: "http://localhost:2028/api/kpk/stream",
    description: "Konektor gateway anti-korupsi mandiri untuk sinkronisasi temuan anomali AI-FAA dan feed transaksi buku besar blockchain ke Unit Koordinasi dan Supervisi (Korsup) KPK.",
    dasarHukum: "Kerja Sama Pemberantasan Korupsi & Pengawasan Terintegrasi",
    clientIdDefault: "KORSUP-KPK-LOCAL-2028"
  }
};

const KPK_CHANNELS: KpkChannel[] = [
  {
    id: "kpk-pusat",
    lembaga: "KPK RI",
    namaKanal: "Gedung Merah Putih KPK (Kantor Pusat)",
    bidang: "Pencegahan & Monitoring",
    wilayah: "Nasional",
    alamat: "Jl. Kuningan Persada Kav. 4, Setiabudi, Jakarta Selatan 12950",
    telepon: "(021) 25578300",
    email: "pengaduan@kpk.go.id",
    callCenter: "198",
    statusKoneksi: "Terhubung",
    portalUrl: "https://www.kpk.go.id"
  },
  {
    id: "kpk-aclc",
    lembaga: "KPK RI",
    namaKanal: "Pusat Edukasi Antikorupsi (ACLC KPK)",
    bidang: "Pencegahan & Monitoring",
    wilayah: "Nasional",
    alamat: "Jl. H. R. Rasuna Said Kav. C-1, Karet Kuningan, Jakarta Selatan 12920",
    telepon: "(021) 25578300",
    email: "aclc@kpk.go.id",
    callCenter: "198",
    statusKoneksi: "Terhubung",
    portalUrl: "https://aclc.kpk.go.id"
  },
  {
    id: "kpk-korsup-1",
    lembaga: "KPK RI",
    namaKanal: "Korsup Wilayah I (Sumatera & Lampung)",
    bidang: "Koordinasi Supervisi",
    wilayah: "Sumatera, Aceh, Lampung",
    alamat: "Kedeputian Koordinasi dan Supervisi KPK, Jakarta Selatan",
    telepon: "(021) 25578300 ext. 8110",
    email: "korsup1@kpk.go.id",
    callCenter: "198",
    statusKoneksi: "Terhubung",
    portalUrl: "https://jaga.id"
  },
  {
    id: "kpk-korsup-2",
    lembaga: "KPK RI",
    namaKanal: "Korsup Wilayah II (Jawa Barat & Banten)",
    bidang: "Koordinasi Supervisi",
    wilayah: "Jawa Barat, Banten, DKI",
    alamat: "Kedeputian Koordinasi dan Supervisi KPK, Jakarta Selatan",
    telepon: "(021) 25578300 ext. 8120",
    email: "korsup2@kpk.go.id",
    callCenter: "198",
    statusKoneksi: "Terhubung",
    portalUrl: "https://jaga.id"
  },
  {
    id: "kpk-korsup-3",
    lembaga: "KPK RI",
    namaKanal: "Korsup Wilayah III (Jawa Tengah & Jawa Timur)",
    bidang: "Koordinasi Supervisi",
    wilayah: "Jawa Tengah, DIY, Jawa Timur",
    alamat: "Kedeputian Koordinasi dan Supervisi KPK, Jakarta Selatan",
    telepon: "(021) 25578300 ext. 8130",
    email: "korsup3@kpk.go.id",
    callCenter: "198",
    statusKoneksi: "Terhubung",
    portalUrl: "https://jaga.id"
  },
  {
    id: "kpk-korsup-4",
    lembaga: "KPK RI",
    namaKanal: "Korsup Wilayah IV (Kalimantan & Sulawesi)",
    bidang: "Koordinasi Supervisi",
    wilayah: "Kalimantan & Sulawesi",
    alamat: "Kedeputian Koordinasi dan Supervisi KPK, Jakarta Selatan",
    telepon: "(021) 25578300 ext. 8140",
    email: "korsup4@kpk.go.id",
    callCenter: "198",
    statusKoneksi: "Terhubung",
    portalUrl: "https://jaga.id"
  },
  {
    id: "kpk-korsup-5",
    lembaga: "KPK RI",
    namaKanal: "Korsup Wilayah V (Bali, Nusa Tenggara, Maluku, Papua)",
    bidang: "Koordinasi Supervisi",
    wilayah: "Bali, NTB, NTT, Maluku, Papua",
    alamat: "Kedeputian Koordinasi dan Supervisi KPK, Jakarta Selatan",
    telepon: "(021) 25578300 ext. 8150",
    email: "korsup5@kpk.go.id",
    callCenter: "198",
    statusKoneksi: "Terhubung",
    portalUrl: "https://jaga.id"
  }
];

export function KpkSettings() {
  const [config, setConfig] = useState<KpkApiConfig>({
    provider: "kpk_jaga",
    apiKey: "kpk_jaga_live_sec_2026_8819bc019a77",
    clientId: "KPK-JAGA-KEMENDIKDASMEN-2026",
    endpointUrl: "https://api.jaga.id/v2/pendidikan/bos-stream",
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
  const [testResult, setTestResult] = useState<KpkAuditTestResult | null>(null);
  const [testScenario, setTestScenario] = useState<"jaga_bos" | "wbs_markup" | "elhkpn_verify" | "blockchain_evidence">("jaga_bos");
  const [channelSearch, setChannelSearch] = useState("");
  const [bidangFilter, setBidangFilter] = useState<string>("all");
  const [channels] = useState<KpkChannel[]>(KPK_CHANNELS);


  // Load existing config from PostgreSQL on mount
  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await fetch("http://localhost:2028/api/kpk/config");
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
        console.warn("Gagal memuat konfigurasi KPK dari proxy:", e);
      }
    }
    loadConfig();
  }, []);

  const meta = PROVIDER_METADATA[config.provider];

  const handleProviderChange = (prov: KpkProvider) => {
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
      const res = await fetch("http://localhost:2028/api/kpk/config", {
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
      const res = await fetch("http://localhost:2028/api/kpk/test-connection", {
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
      const res = await fetch("http://localhost:2028/api/kpk/test", {
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
          latencyMs: 140,
          provider: config.provider,
          referenceNo: `KPK-ERR-${Date.now()}`,
          timestamp: new Date().toISOString(),
          blockHashProof: "0x0000000000000000000000000000000000000000000000000000000000000000",
          message: data.message || "Uji transmisi antirasuah KPK gagal.",
          auditScope: config.instansiScope,
          unitPenerima: "Kedeputian Bidang Pencegahan KPK",
          statusPenanganan: "Gagal Verifikasi",
          anomaliDetected: 0
        });
      }
    } catch (e: any) {
      setTestResult({
        success: false,
        latencyMs: 90,
        provider: config.provider,
        referenceNo: `KPK-TIMEOUT-${Date.now()}`,
        timestamp: new Date().toISOString(),
        blockHashProof: "0x0000000000000000000000000000000000000000000000000000000000000000",
        message: "Proxy server lokal tidak merespons atau offline: " + e.message,
        auditScope: config.instansiScope,
        unitPenerima: "KPK Gateway Interoperability",
        statusPenanganan: "Koneksi Terputus",
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

  const filteredChannels = channels.filter((c) => {
    const matchSearch =
      c.namaKanal.toLowerCase().includes(channelSearch.toLowerCase()) ||
      c.wilayah.toLowerCase().includes(channelSearch.toLowerCase()) ||
      c.alamat.toLowerCase().includes(channelSearch.toLowerCase());
    const matchBidang = bidangFilter === "all" || c.bidang === bidangFilter;
    return matchSearch && matchBidang;
  });

  return (
    <DashboardLayout
      pageTitle="Pengaturan API KPK RI"
      description="Konfigurasi Integrasi Antirasuah & Pengawasan Anggaran KPK RI (Portal JAGA.ID & Whistleblowing System KWS) untuk Deteksi Dini Korupsi Pendidikan"
    >
      <div className="space-y-6">
        {/* Banner Status Header */}
        <div className="relative overflow-hidden rounded-xl border border-red-500/20 bg-gradient-to-r from-red-950 via-slate-900 to-navy p-6 text-white shadow-xl">
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
                  <Gavel size={18} />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-red-400">
                  Integrasi Komisi Pemberantasan Korupsi Republik Indonesia
                </span>
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-white">
                API Pencegahan Korupsi KPK RI (JAGA.ID & KWS)
              </h2>
              <p className="text-xs leading-relaxed text-slate-300">
                Menghubungkan buku besar transaksi pendidikan nasional dengan <strong>Portal JAGA KPK (jaga.id)</strong> dan <strong>KPK Whistleblowing System (KWS)</strong>. Anomali belanja dana BOS, indikasi harga mark-up peralatan sekolah, dan audit trail buku besar terdistribusi ditransmisikan secara kriptografis untuk mencegah kebocoran anggaran negara.
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0 md:items-end">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400">
                <ShieldAlert size={14} />
                <span>Call Center KPK 198 Siaga</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-500/30 bg-slate-800/80 px-3 py-1 text-[11px] text-slate-300">
                <FileCheck2 size={13} />
                <span>Kerahasiaan Whistleblower Terjamin (KWS)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pemilihan Platform KPK */}
        <Panel title="Pilih Platform Integrasi KPK RI" icon={Layers}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(PROVIDER_METADATA) as KpkProvider[]).map((key) => {
              const item = PROVIDER_METADATA[key];
              const isSelected = config.provider === key;
              return (
                <button
                  key={key}
                  onClick={() => handleProviderChange(key)}
                  className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 ${
                    isSelected
                      ? "border-red-600 bg-red-50/50 shadow-md ring-2 ring-red-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                        {item.lembaga}
                      </span>
                      {isSelected && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow-sm">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-display text-sm font-bold text-slate-900 group-hover:text-red-600">
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
                <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-red-950">{meta.name}</span>
                        <span className="text-[11px] text-red-800 font-medium">({meta.lembaga})</span>
                      </div>
                      <p className="text-xs text-red-900/80 leading-relaxed">{meta.description}</p>
                      <p className="text-[11px] text-red-700 font-semibold pt-1">
                        Landasan Hukum: <span className="font-normal italic">{meta.dasarHukum}</span>
                      </p>
                    </div>
                    <a
                      href={meta.keyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 shrink-0 rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-red-700 shadow-sm border border-red-200 hover:bg-red-100"
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
                      <Key size={13} className="text-red-600" />
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
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 pr-24"
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
                    Token ini digunakan untuk pengiriman laporan terenkripsi ke server {meta.lembaga} dengan standar perlindungan pelapor.
                  </p>
                </div>

                {/* Client ID & Endpoint */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Building2 size={13} className="text-red-600" />
                      <span>Client ID / Kode Instansi Pengirim</span>
                    </label>
                    <input
                      type="text"
                      value={config.clientId || ""}
                      onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                      placeholder="e.g. KPK-JAGA-KEMENDIKDASMEN-2026"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Globe size={13} className="text-red-600" />
                        <span>Endpoint URL API KPK</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleRunDirectConnectionTest}
                          disabled={isDirectTesting}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 transition-colors disabled:opacity-50"
                        >
                          <Wifi size={11} className={isDirectTesting ? "animate-spin" : ""} />
                          <span>{isDirectTesting ? "Menguji..." : "Uji Koneksi"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig({ ...config, endpointUrl: meta.defaultEndpoint })}
                          className="text-[10px] text-slate-500 hover:text-red-600 hover:underline"
                        >
                          Reset Default
                        </button>
                      </div>
                    </label>
                    <input
                      type="text"
                      value={config.endpointUrl}
                      onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-mono text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Scope & Mode Sinkronisasi */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Cakupan Pengawasan KPK</label>
                    <select
                      value={config.instansiScope}
                      onChange={(e: any) => setConfig({ ...config, instansiScope: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="nasional">Nasional (Semua Pengadaan & Anggaran Pendidikan 38 Provinsi)</option>
                      <option value="kementerian">Tingkat Kementerian Pembina (Kemendikdasmen / Kemenag)</option>
                      <option value="daerah_provinsi">Tingkat Pemerintah Provinsi (Dinas Pendidikan)</option>
                      <option value="daerah_kabkota">Tingkat Sekolah & Satuan Pendidikan (BOS / Komite)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Metode Pengiriman Data Antirasuah</label>
                    <select
                      value={config.syncMode}
                      onChange={(e: any) => setConfig({ ...config, syncMode: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="realtime_push">Real-Time Streaming (Setiap Transaksi Masuk)</option>
                      <option value="batch_scheduled">Batch Terjadwal (Harian Pukul 23:59 WIB)</option>
                      <option value="on_demand_investigation">On-Demand Pemeriksaan Dumas KPK</option>
                    </select>
                  </div>
                </div>

                {/* Enkripsi & Keamanan */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Lock size={13} className="text-red-600" />
                    <span>Protokol Enkripsi & Perlindungan Kerahasiaan Dumas</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      config.encryptionMode === "TLS_1_3_HMAC"
                        ? "border-red-500 bg-red-50/40 text-red-950 ring-1 ring-red-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="encryptionModeKpk"
                        checked={config.encryptionMode === "TLS_1_3_HMAC"}
                        onChange={() => setConfig({ ...config, encryptionMode: "TLS_1_3_HMAC" })}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <p className="text-xs font-bold">TLS 1.3 + HMAC-SHA256 (KWS)</p>
                        <p className="text-[11px] text-slate-500">Standar resmi portal JAGA.ID & KWS KPK untuk enkripsi pelaporan.</p>
                      </div>
                    </label>

                    <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      config.encryptionMode === "ASYMMETRIC_RSA2048"
                        ? "border-red-500 bg-red-50/40 text-red-950 ring-1 ring-red-500"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}>
                      <input
                        type="radio"
                        name="encryptionModeKpk"
                        checked={config.encryptionMode === "ASYMMETRIC_RSA2048"}
                        onChange={() => setConfig({ ...config, encryptionMode: "ASYMMETRIC_RSA2048" })}
                        className="mt-0.5 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <p className="text-xs font-bold">Asymmetric RSA-2048 (KPK Public Key)</p>
                        <p className="text-[11px] text-slate-500">Enkripsi kunci publik KPK untuk kerahasiaan bukti whistleblower.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Sakelar Toggles */}
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Aktifkan Transmisi Data ke KPK RI</p>
                      <p className="text-[11px] text-slate-500">Mengizinkan integrasi pengawasan antirasuah aktif secara live.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.isActive}
                        onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Teruskan Temuan Anomali AI-FAA Otomatis</p>
                      <p className="text-[11px] text-slate-500">Meneruskan indikasi mark-up atau klaim ganda yang terdeteksi AI ke Kedeputian Pencegahan KPK.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.autoReportAnomalies}
                        onChange={(e) => setConfig({ ...config, autoReportAnomalies: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Sertakan Hash Kriptografi Blockchain</p>
                      <p className="text-[11px] text-slate-500">Menyertakan root hash merkle tree sebagai alat bukti digital sah yang tidak dapat diubah (UU ITE).</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.includeAuditTrail}
                        onChange={(e) => setConfig({ ...config, includeAuditTrail: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
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
                            <li>Periksa validitas kredensial otentikasi API KPK.</li>
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
                      <Play size={13} className={isDirectTesting ? "animate-spin text-red-600" : "text-red-600"} />
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
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={14} />}
                      <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan API KPK"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* Kolom Kanan: Uji Transmisi Antirasuah Live */}
          <div className="space-y-6">
            <Panel title="Uji Koneksi & Simulasi Transmisi KPK" icon={Play}>
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Lakukan pengujian transmisi data transaksi ke server pencegahan korupsi KPK untuk memvalidasi tanda terima resmi dan bukti kriptografis.
                </p>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Pilih Skenario Pengujian KPK</label>
                  <select
                    value={testScenario}
                    onChange={(e: any) => setTestScenario(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="jaga_bos">Pencegahan Korupsi: Transmisi Dana BOS ke Portal JAGA</option>
                    <option value="wbs_markup">Pengaduan Dugaan Mark-Up & Pengadaan Fiktif (KWS)</option>
                    <option value="elhkpn_verify">Pengecekan Kepatuhan e-LHKPN Pejabat Anggaran</option>
                    <option value="blockchain_evidence">Validasi Bukti Digital Merkle Tree Blockchain</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Mengirimkan Paket Transmisi ke KPK RI...</span>
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      <span>Jalankan Uji Transmisi KPK</span>
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
                          {testResult.success ? "Transmisi KPK Terverifikasi" : "Uji Transmisi Gagal"}
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
                        <span className="text-slate-400">Nomor Registrasi Dumas/JAGA:</span>
                        <span className="font-mono font-semibold text-slate-800">{testResult.referenceNo}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Unit Penerima:</span>
                        <span className="font-medium text-slate-800">{testResult.unitPenerima}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span className="text-slate-400">Status Tindak Lanjut:</span>
                        <span className="font-semibold text-emerald-700">{testResult.statusPenanganan}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1">
                        <span className="text-slate-400 text-[10px]">Bukti Digital Kriptografi:</span>
                        <span className="font-mono text-[9px] text-red-700 bg-red-50 px-1.5 py-0.5 rounded break-all border border-red-100">
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
                            className="font-bold text-red-600 hover:text-red-700 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Rincian Telemetri Jaringan &raquo;</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Call Center & Kanal Dumas */}
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                    <PhoneCall size={13} className="text-red-600" />
                    <span>Call Center 198 — KPK Republik Indonesia</span>
                  </div>
                  <p className="text-[11px] text-red-800 leading-relaxed">
                    Layanan pengaduan masyarakat siaga menerima informasi dugaan tindak pidana korupsi sektor pendidikan dengan perlindungan penuh LPSK & KPK.
                  </p>
                </div>
              </div>
            </Panel>
          </div>
        </div>

        {/* Direktori Unit Kerja & Kanal Pelaporan KPK */}
        <Panel title="Direktori Unit Kerja & Kanal Pengawasan KPK RI" icon={Building2}>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari unit kerja, wilayah, korsup..."
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-slate-500">Filter Bidang:</span>
                <select
                  value={bidangFilter}
                  onChange={(e) => setBidangFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white py-1 px-2.5 text-xs text-slate-700 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="all">Semua Bidang</option>
                  <option value="Pencegahan & Monitoring">Pencegahan & Monitoring</option>
                  <option value="Koordinasi Supervisi">Koordinasi Supervisi (Korsup)</option>
                  <option value="Pengaduan Masyarakat (Dumas)">Pengaduan Masyarakat</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChannels.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-red-300 hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold bg-red-100 text-red-900 border border-red-300">
                        {c.bidang}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {c.statusKoneksi}
                      </span>
                    </div>

                    <h4 className="font-display text-xs font-bold text-slate-900 leading-snug">
                      {c.namaKanal}
                    </h4>

                    <div className="space-y-1 text-[11px] text-slate-600">
                      <div className="flex items-start gap-1.5">
                        <MapPin size={12} className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{c.alamat}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <PhoneCall size={12} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-[10px]">{c.telepon} (Call Center: {c.callCenter})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Mail size={12} className="text-slate-400 shrink-0" />
                        <span className="font-mono text-[10px] truncate">{c.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500">
                      Wilayah: {c.wilayah}
                    </span>
                    <a
                      href={c.portalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-800"
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
export default KpkSettings;

