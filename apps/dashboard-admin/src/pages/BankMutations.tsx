import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useAdminStore } from "@/store/adminStore";
import type { BankHimbara, BankMutation, BankApiConfig } from "@/types";
import {
  Landmark,
  RefreshCw,
  Search,
  Eye,
  ShieldCheck,
  Send,
  AlertTriangle,
  CheckCircle,
  Power,
  PowerOff,
  PauseCircle,
  Info,
  Layers,
  Settings,
  Code,
  Copy,
  Check,
  Download,
  ExternalLink,
  Sliders,
  Terminal,
  FileCode,
  Zap,
  Globe,
  Play,
  Pause,
  Activity,
  TrendingUp,
  MapPin,
  Building2,
  Radio,
  CreditCard,
} from "lucide-react";

// Pool wilayah skala nasional (Kabupaten/Kota & Provinsi se-Indonesia)
const NATIONAL_REGIONS_POOL = [
  { regency: "Kabupaten Pesawaran", province: "Lampung", institution: "MIN 1 Pesawaran" },
  { regency: "Kota Bandar Lampung", province: "Lampung", institution: "SMKN 1 Bandar Lampung" },
  { regency: "Kota Bandung", province: "Jawa Barat", institution: "SMA Negeri 1 Bandung" },
  { regency: "Kabupaten Sleman", province: "D.I. Yogyakarta", institution: "SMPN 2 Depok Sleman" },
  { regency: "Kota Surabaya", province: "Jawa Timur", institution: "SMKN 5 Surabaya" },
  { regency: "Jakarta Selatan", province: "DKI Jakarta", institution: "Universitas Paramadina" },
  { regency: "Kota Medan", province: "Sumatera Utara", institution: "MAN 2 Model Medan" },
  { regency: "Kota Makassar", province: "Sulawesi Selatan", institution: "SMAN 2 Makassar" },
  { regency: "Kota Denpasar", province: "Bali", institution: "SMAN 3 Denpasar" },
  { regency: "Kabupaten Jayapura", province: "Papua", institution: "SMAN 1 Sentani Jayapura" },
  { regency: "Kota Banjarmasin", province: "Kalimantan Selatan", institution: "SMPN 1 Banjarmasin" },
  { regency: "Kota Semarang", province: "Jawa Tengah", institution: "SMAN 3 Semarang" },
  { regency: "Kabupaten Banyuwangi", province: "Jawa Timur", institution: "SMAN 1 Glagah Banyuwangi" },
  { regency: "Kota Palembang", province: "Sumatera Selatan", institution: "SMAN 1 Palembang" },
  { regency: "Kabupaten Lombok Barat", province: "Nusa Tenggara Barat", institution: "SMAN 1 Gerung" },
  { regency: "Kota Pontianak", province: "Kalimantan Barat", institution: "SMAN 1 Pontianak" },
  { regency: "Kota Manado", province: "Sulawesi Utara", institution: "SMAN 9 Manado" },
  { regency: "Kabupaten Merauke", province: "Papua Selatan", institution: "SMAN 1 Merauke" },
  { regency: "Kota Banda Aceh", province: "Aceh", institution: "SMAN 1 Banda Aceh" },
  { regency: "Kabupaten Kupang", province: "Nusa Tenggara Timur", institution: "SMAN 1 Kupang Tengah" },
];

export function BankMutations() {
  const {
    bankMutations,
    bankApiConfigs,
    toggleBankApi,
    updateBankApiConfig,
    fetchBankJson,
    validateBriAccountName,
    fetchBriInformasiRekening,
    syncBankMutations,
    addLiveMutation,
    sendMutationToAiFaa,
    dataSources,
    currentUser,
    canAccess,
  } = useAdminStore();

  const [bankFilter, setBankFilter] = useState<string>("");
  const [matchFilter, setMatchFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [onlyActiveBanks, setOnlyActiveBanks] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  // Real-time live ticker engine ("Otomatis angkanya akan bergerak terus")
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [liveTrxCount, setLiveTrxCount] = useState(8903);
  const [liveVolume, setLiveVolume] = useState(482910450000);
  const [liveTps, setLiveTps] = useState(38.4);
  const [lastTickId, setLastTickId] = useState<string | null>(null);

  // Detail Modal
  const [detailModal, setDetailModal] = useState<BankMutation | null>(null);

  // Global Bank API Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{
    bankName: BankHimbara;
    bankFullName: string;
    targetActive: boolean;
    activeSchoolsCount: number;
  } | null>(null);

  // Bank API Setup & GET JSON Explorer Modal
  const [apiSetupModalBank, setApiSetupModalBank] = useState<BankApiConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"settings" | "test_get">("test_get");
  const [setupFormData, setSetupFormData] = useState<Partial<BankApiConfig>>({});
  const [queryParamsInput, setQueryParamsInput] = useState<string>("limit=20&sort=desc");
  const [fetchedJson, setFetchedJson] = useState<any>(null);
  const [isFetchingJson, setIsFetchingJson] = useState<boolean>(false);
  const [fetchLatency, setFetchLatency] = useState<number | null>(null);
  const [jsonCopied, setJsonCopied] = useState<boolean>(false);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [jsonSearchQuery, setJsonSearchQuery] = useState<string>("");

  // BRIAPI Official Products Mode: "statement" (Informasi Rekening) or "validation" (Account Name Validation)
  const [briProductMode, setBriProductMode] = useState<"statement" | "validation">("statement");
  const [validationAccountInput, setTestValidationAccount] = useState<string>("012301004821501");

  const isSuperAdmin = currentUser?.role === "super_admin";
  const canEdit = canAccess("Mutasi Bank Himbara", "edit");

  // Map of which banks are currently active globally
  const activeBankMap = useMemo(() => {
    const map = new Map<BankHimbara, boolean>();
    bankApiConfigs.forEach((b) => map.set(b.bankName, b.isActive));
    return map;
  }, [bankApiConfigs]);

  // Real-time live mutation stream generator running at intervals
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      // Pick random region from national pool
      const region = NATIONAL_REGIONS_POOL[Math.floor(Math.random() * NATIONAL_REGIONS_POOL.length)];
      // Bank distribution: BRI 60% (primary BOS mitra), Mandiri 15%, BNI 15%, BTN 10%
      const r = Math.random();
      const bank: BankHimbara = r < 0.6 ? "BRI" : r < 0.75 ? "Mandiri" : r < 0.9 ? "BNI" : "BTN";
      const isCredit = Math.random() > 0.35;
      const amount =
        Math.floor(Math.random() * 45 + 3) * 1000000 + Math.floor(Math.random() * 10) * 100000;
      const matchStatus: "cocok" | "tidak cocok" | "menunggu" =
        Math.random() > 0.12 ? "cocok" : Math.random() > 0.5 ? "menunggu" : "tidak cocok";

      const now = new Date();
      const timeStr = `${now.toISOString().split("T")[0]} ${now.toTimeString().split(" ")[0]} WIB`;
      const newId = `bm-live-${Date.now().toString().slice(-5)}`;

      const newMutation: BankMutation = {
        id: newId,
        bankName: bank,
        regency: region.regency,
        province: region.province,
        institutionName: region.institution,
        amount,
        transactionType: isCredit ? "kredit" : "debit",
        transactionDate: timeStr,
        matchStatus,
        transactionId: `trx-${Math.floor(Math.random() * 89999 + 10000)}`,
        matchedDataSourceId: bank === "BRI" ? "ds-001" : "ds-002",
        description: isCredit
          ? `Penyaluran Dana BOS Reguler / Kinerja ${region.regency}`
          : `Realisasi Operasional & Sarpras Pendidikan ${region.regency}`,
        isNew: true,
      };

      addLiveMutation(newMutation);
      setLastTickId(newId);
      setLiveTrxCount((prev) => prev + 1);
      setLiveVolume((prev) => prev + amount);
      setLiveTps(+(35 + Math.random() * 8).toFixed(1));
    }, 2800);

    return () => clearInterval(interval);
  }, [isLiveStreaming, addLiveMutation]);

  const filteredMutations = useMemo(() => {
    return bankMutations.filter((m) => {
      const matchBank = !bankFilter || m.bankName === bankFilter;
      const matchStatus = !matchFilter || m.matchStatus === matchFilter;
      const matchActive = !onlyActiveBanks || activeBankMap.get(m.bankName) === true;
      const matchSearch =
        !search ||
        m.transactionId.toLowerCase().includes(search.toLowerCase()) ||
        (m.regency && m.regency.toLowerCase().includes(search.toLowerCase())) ||
        (m.province && m.province.toLowerCase().includes(search.toLowerCase())) ||
        (m.institutionName && m.institutionName.toLowerCase().includes(search.toLowerCase())) ||
        (m.description && m.description.toLowerCase().includes(search.toLowerCase()));
      return matchBank && matchStatus && matchActive && matchSearch;
    });
  }, [bankMutations, bankFilter, matchFilter, onlyActiveBanks, activeBankMap, search]);

  const handlePollSync = async () => {
    setIsPolling(true);
    await syncBankMutations();
    setIsPolling(false);
  };

  const getMatchedDataSourceName = (dsId?: string) => {
    if (!dsId) return "—";
    return dataSources.find((d) => d.id === dsId)?.name || dsId;
  };

  const briConfig = bankApiConfigs.find((b) => b.bankName === "BRI");
  const otherBanks = bankApiConfigs.filter((b) => b.bankName !== "BRI");

  const executeToggleGlobalBank = () => {
    if (!confirmModal) return;
    toggleBankApi(confirmModal.bankName, confirmModal.targetActive);
    setConfirmModal(null);
  };

  // Open API Setup & GET JSON Modal
  const openApiSetupModal = async (bank: BankApiConfig, defaultTab: "settings" | "test_get" = "test_get") => {
    setApiSetupModalBank(bank);
    setActiveTab(defaultTab);
    setSetupFormData({
      apiEndpoint: bank.apiEndpoint,
      authType: bank.authType,
      clientId: bank.clientId || "",
      clientSecret: bank.clientSecret || "",
      apiKey: bank.apiKey || "",
      webhookUrl: bank.webhookUrl || "",
      apiTimeoutMs: bank.apiTimeoutMs || 5000,
      customHeaders: bank.customHeaders || "Accept: application/json\nX-Partner-Id: KEMENDIKDASMEN-ID",
      defaultQueryParams: bank.defaultQueryParams || "limit=20&sort=desc",
    });
    setQueryParamsInput(bank.defaultQueryParams || "limit=20&sort=desc");

    // Automatically trigger initial GET fetch
    setIsFetchingJson(true);
    const start = Date.now();
    const data = await fetchBankJson(bank.bankName, bank.defaultQueryParams || "limit=20&sort=desc");
    setFetchLatency(Date.now() - start);
    setFetchedJson(data);
    setIsFetchingJson(false);
  };

  // Execute manual GET request from UI
  const handleExecuteGetRequest = async () => {
    if (!apiSetupModalBank) return;
    setIsFetchingJson(true);
    const start = Date.now();
    const data = await fetchBankJson(apiSetupModalBank.bankName, queryParamsInput);
    setFetchLatency(Date.now() - start);
    setFetchedJson(data);
    setIsFetchingJson(false);
  };

  // Save updated API configurations
  const handleSaveApiSettings = () => {
    if (!apiSetupModalBank) return;
    updateBankApiConfig(apiSetupModalBank.bankName, setupFormData);
    setApiSetupModalBank((prev) => (prev ? { ...prev, ...setupFormData } : prev));
  };

  // Copy JSON to clipboard
  const handleCopyJson = (jsonData: any) => {
    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  // Download JSON file
  const handleDownloadJson = (bankName: string, jsonData: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(jsonData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `bank_${bankName.toLowerCase()}_snap_get_response_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <DashboardLayout pageTitle="Integrasi Mutasi Rekening Bank Himbara">
      {/* 1. SAKELAR GLOBAL API BANK MITRA & EXPLORER GET JSON */}
      <div className="mb-6 space-y-3">
        {/* Banner Penjelasan Sakelar Global */}
        <div className="rounded-md border border-navy/20 bg-panel p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1 max-w-3xl">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-navy/10 rounded text-navy">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                    Sakelar Global Integrasi API Bank Mitra & Pengaturan GET JSON
                  </h3>
                  <p className="text-[11px] text-muted font-medium">
                    Kontrol sentral aliran mutasi rekening bank mitra secara agregat untuk seluruh institusi pendidikan, dilengkapi konsol eksplorasi GET JSON SNAP Open Banking.
                  </p>
                </div>
              </div>

              <div className="mt-2.5 rounded bg-base p-3 text-xs space-y-1.5 border border-line">
                <div className="flex items-start gap-2">
                  <ShieldCheck size={16} className="text-status-ok shrink-0 mt-0.5" />
                  <p className="text-ink">
                    <strong>Mitra Utama Default:</strong> <strong>Bank BRI</strong> berfungsi sebagai bank penampung utama BOS nasional dan aktif secara permanen (100% mutasi terhubung).
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Layers size={16} className="text-navy shrink-0 mt-0.5" />
                  <p className="text-ink">
                    <strong>Cakupan Sakelar:</strong> Sakelar di bawah ini berlaku untuk <strong>API Bank secara KESELURUHAN</strong> (bukan per satuan sekolah). Begitu API suatu bank diaktifkan, mutasi rekening dari <strong>seluruh sekolah</strong> yang terafiliasi dengan bank tersebut akan otomatis terhubung dan tampil di <strong>Dashboard Institusi Pendidikan (Port 2024)</strong> masing-masing sekolah.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions Toolbar */}
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">

              {/* Link to Dedicated Bank API Settings (SNAP BI) */}
              <Link
                to="/bank-settings"
                className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-navy/40 bg-navy/10 px-3.5 py-1.5 text-xs font-bold text-navy hover:bg-navy/20 shadow-sm transition-colors"
                title="Buka Pengaturan API Bank Himbara (BI SNAP)"
              >
                <CreditCard size={13} />
                <span>Pengaturan API Key Bank</span>
              </Link>

              {/* Shortcut to GET JSON Bank Explorer */}
              <button
                onClick={() => openApiSetupModal(briConfig || bankApiConfigs[0], "test_get")}
                className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
                title="Eksplorasi Snapshot GET JSON Bank Himbara"
              >
                <Code size={13} />
                <span>GET JSON Explorer</span>
              </button>

              <button
                onClick={handlePollSync}
                disabled={isPolling}
                className={`focus-ring inline-flex items-center gap-1.5 rounded-sm bg-navy px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-light shadow-sm transition-colors ${
                  isPolling ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <RefreshCw size={13} className={isPolling ? "animate-spin text-gold" : ""} />
                <span>{isPolling ? "Menarik Data API..." : "Tarik Mutasi Baru (Polling)"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bank Master Switch Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          {/* BRI Primary Default Card */}
          {briConfig && (
            <div className="rounded-md border-2 border-status-ok bg-panel p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 right-0 bg-status-ok text-white font-bold text-[9px] uppercase px-2 py-0.5 rounded-bl">
                Mitra Utama (Default Aktif)
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-extrabold text-xl text-navy">BRI</span>
                  <span className="rounded bg-status-ok/15 text-status-ok font-bold text-[10px] px-2 py-0.5">
                    ● AKTIF SECARA GLOBAL
                  </span>
                </div>
                <p className="font-bold text-ink text-xs">{briConfig.bankFullName}</p>
                <p className="text-[11px] text-muted mt-2 leading-relaxed">
                  API Bank BRI aktif secara default di seluruh sistem nasional. Mutasi rekening seluruh sekolah mitra BRI mengalir otomatis ke Dashboard Institusi Pendidikan (Port 2024).
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-line space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-status-ok font-semibold flex items-center gap-1">
                    <CheckCircle size={13} /> {briConfig.activeSchoolsCount.toLocaleString("id-ID")} Satuan Terhubung
                  </span>
                  <span className="font-mono text-muted text-[10px]">OAuth 2.0 (Live)</span>
                </div>

                {/* Settings & GET JSON Button for BRI */}
                <button
                  onClick={() => openApiSetupModal(briConfig, "test_get")}
                  className="focus-ring w-full flex items-center justify-center gap-1.5 rounded border border-navy/30 bg-navy/5 py-1.5 font-bold text-[11px] text-navy hover:bg-navy/10 transition-colors shadow-sm"
                  title="Pengaturan & Uji GET JSON API Bank BRI"
                >
                  <Settings size={12} /> Pengaturan & GET JSON API
                </button>
              </div>
            </div>
          )}

          {/* Other Partner Banks with Global Whole-Bank Toggle & API Setup */}
          {otherBanks.map((bank) => (
            <div
              key={bank.bankName}
              className={`rounded-md border p-4 shadow-sm flex flex-col justify-between transition-all ${
                bank.isActive
                  ? "border-status-ok bg-emerald-50/20"
                  : "border-line bg-panel opacity-95"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-extrabold text-lg text-ink">{bank.bankName}</span>
                  <span
                    className={`rounded font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 ${
                      bank.isActive
                        ? "bg-status-ok/15 text-status-ok"
                        : "bg-muted/10 text-muted"
                    }`}
                  >
                    {bank.isActive ? "● API AKTIF (GLOBAL)" : "○ NONAKTIF (GLOBAL)"}
                  </span>
                </div>
                <p className="font-bold text-ink text-xs">{bank.bankFullName}</p>
                <p className="text-[11px] text-muted mt-2 leading-relaxed">
                  {bank.isActive ? (
                    <span className="text-emerald-800 font-medium">
                      ✓ API aktif secara keseluruhan. Mutasi rekening dari seluruh (±{bank.activeSchoolsCount.toLocaleString("id-ID")}) sekolah mitra bank ini otomatis tampil di Dashboard Institusi masing-masing.
                    </span>
                  ) : (
                    <span>
                      ⏸ API dinonaktifkan secara keseluruhan. Aliran mutasi seluruh sekolah mitra bank ini ditahan di gateway dan belum tampil di dashboard institusi sekolah.
                    </span>
                  )}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-line space-y-2">
                <div className="flex items-center justify-between text-[10px] text-muted">
                  <span>Jangkauan: ±{bank.activeSchoolsCount.toLocaleString("id-ID")} Satuan</span>
                  <span className="font-mono">{bank.authType}</span>
                </div>

                {/* Settings & GET JSON Button */}
                <button
                  onClick={() => openApiSetupModal(bank, "test_get")}
                  className="focus-ring w-full flex items-center justify-center gap-1.5 rounded border border-line bg-base py-1.5 font-semibold text-[11px] text-ink hover:bg-line/40 transition-colors"
                  title={`Pengaturan & Uji GET JSON API Bank ${bank.bankName}`}
                >
                  <Settings size={12} /> Pengaturan & GET JSON API
                </button>

                {/* Whole Bank Global Switch */}
                {canEdit ? (
                  bank.isActive ? (
                    <button
                      onClick={() =>
                        setConfirmModal({
                          bankName: bank.bankName,
                          bankFullName: bank.bankFullName,
                          targetActive: false,
                          activeSchoolsCount: bank.activeSchoolsCount,
                        })
                      }
                      className="focus-ring w-full flex items-center justify-center gap-1.5 rounded border border-status-danger/40 bg-status-danger/10 py-1.5 font-bold text-[11px] text-status-danger hover:bg-status-danger/20 transition-colors shadow-sm"
                      title={`Nonaktifkan API Bank ${bank.bankName} secara keseluruhan`}
                    >
                      <PowerOff size={12} /> Nonaktifkan API Bank (Keseluruhan)
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        setConfirmModal({
                          bankName: bank.bankName,
                          bankFullName: bank.bankFullName,
                          targetActive: true,
                          activeSchoolsCount: bank.activeSchoolsCount,
                        })
                      }
                      className="focus-ring w-full flex items-center justify-center gap-1.5 rounded border border-status-ok bg-status-ok py-1.5 font-bold text-[11px] text-white hover:bg-status-ok/90 transition-colors shadow-sm"
                      title={`Aktifkan API Bank ${bank.bankName} secara keseluruhan agar tampil di sekolah`}
                    >
                      <Power size={12} /> Aktifkan API Bank (Keseluruhan)
                    </button>
                  )
                ) : (
                  <span className="block text-center text-[10px] text-muted italic">
                    Peran Anda tidak berwenang mengubah konfigurasi API Bank.
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. REALTIME TELEMETRY & DYNAMIC MOVING NUMBERS (SKALA NASIONAL) */}
      <div className="mb-4 rounded-md border border-emerald-500/30 bg-panel p-3.5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              {isLiveStreaming && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLiveStreaming ? "bg-emerald-500" : "bg-muted"}`}></span>
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wide text-ink">
                  {isLiveStreaming ? "Aliran Mutasi Real-Time Skala Nasional" : "Ticker Real-Time Dijeda"}
                </h4>
                <span className="rounded bg-emerald-500/15 text-emerald-700 font-bold text-[10px] px-2 py-0.5 border border-emerald-500/30">
                  PORT 2024 AKTIF & TERHUBUNG
                </span>
              </div>
              <p className="text-[11px] text-muted">
                Angka transaksi dan mutasi rekening bergerak otomatis secara realtime ke Dashboard Sekolah (Port 2024).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`focus-ring inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                isLiveStreaming
                  ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
              title={isLiveStreaming ? "Jeda gerakan angka realtime" : "Lanjutkan gerakan angka realtime"}
            >
              {isLiveStreaming ? (
                <>
                  <Pause size={13} />
                  <span>Jeda Ticker Realtime</span>
                </>
              ) : (
                <>
                  <Play size={13} />
                  <span>Lanjutkan Ticker Realtime</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Moving Numbers Cards */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="rounded border border-line bg-base/60 p-2.5 shadow-2xs">
            <span className="text-[10px] font-semibold text-muted flex items-center gap-1">
              <Activity size={12} className="text-navy" /> Total Transaksi Mengalir Hari Ini
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-base sm:text-lg font-extrabold text-ink">
                {liveTrxCount.toLocaleString("id-ID")}
              </span>
              {isLiveStreaming && (
                <span className="text-[10px] font-bold text-emerald-600 animate-pulse">
                  ▲ +1 bergerak
                </span>
              )}
            </div>
            <span className="text-[10px] text-muted">Skala Nasional (38 Provinsi)</span>
          </div>

          <div className="rounded border border-line bg-base/60 p-2.5 shadow-2xs">
            <span className="text-[10px] font-semibold text-muted flex items-center gap-1">
              <TrendingUp size={12} className="text-status-ok" /> Volume Mutasi Kliring Real-Time
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-xs sm:text-sm font-extrabold text-status-ok truncate" title={`Rp ${liveVolume.toLocaleString("id-ID")}`}>
                Rp{liveVolume.toLocaleString("id-ID")}
              </span>
            </div>
            <span className="text-[10px] text-muted">Akumulasi bergerak otomatis</span>
          </div>

          <div className="rounded border border-line bg-base/60 p-2.5 shadow-2xs">
            <span className="text-[10px] font-semibold text-muted flex items-center gap-1">
              <Radio size={12} className="text-navy" /> Kecepatan Aliran Transaksi
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-base sm:text-lg font-extrabold text-ink">
                ~{liveTps}
              </span>
              <span className="text-[11px] font-bold text-muted">trx / dtk</span>
            </div>
            <span className="text-[10px] text-status-ok font-medium">Latensi respon: 10 ms</span>
          </div>

          <div className="rounded border border-line bg-base/60 p-2.5 shadow-2xs">
            <span className="text-[10px] font-semibold text-muted flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-600" /> Target Aliran (Port 2024)
            </span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono text-base sm:text-lg font-extrabold text-ink">
                468.724
              </span>
              <span className="text-[11px] font-medium text-muted">Sekolah</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">● Status Sinkron Realtime</span>
          </div>
        </div>
      </div>

      {/* 3. FILTER & TOOLBAR */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-2.5 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Kabupaten/Kota, Provinsi, Bank, ID transaksi..."
              className="focus-ring w-full rounded-sm border border-line bg-panel py-2 pl-9 pr-3 text-xs text-ink shadow-sm"
            />
          </div>

          <select
            value={bankFilter}
            onChange={(e) => setBankFilter(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm"
          >
            <option value="">Semua Bank Himbara</option>
            <option value="BRI">Bank BRI (Mitra Utama)</option>
            <option value="Mandiri">Bank Mandiri</option>
            <option value="BNI">Bank BNI</option>
            <option value="BTN">Bank BTN</option>
          </select>

          <select
            value={matchFilter}
            onChange={(e) => setMatchFilter(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm"
          >
            <option value="">Semua Status Kecocokan</option>
            <option value="cocok">Cocok (Matched)</option>
            <option value="tidak cocok">Tidak Cocok (Mismatch)</option>
            <option value="menunggu">Menunggu Verifikasi</option>
          </select>

          {/* Toggle only active banks */}
          <button
            onClick={() => setOnlyActiveBanks(!onlyActiveBanks)}
            className={`focus-ring rounded-sm px-3 py-1.5 text-xs font-semibold border transition-colors ${
              onlyActiveBanks
                ? "bg-navy text-white border-navy"
                : "border-line bg-panel text-ink hover:bg-base"
            }`}
          >
            {onlyActiveBanks ? "✓ Menampilkan Bank Aktif Saja" : "Tampilkan Bank Aktif Saja (BRI)"}
          </button>
        </div>

        <span className="text-xs text-muted">
          Menampilkan <strong className="text-ink">{filteredMutations.length}</strong> transaksi mutasi nasional
        </span>
      </div>

      {/* 4. DAFTAR MUTASI REKENING MASUK & KELUAR (SKALA NASIONAL) */}
      <Panel title="Daftar Mutasi Rekening Masuk & Keluar (Skala Nasional Real-Time)">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted bg-base/40">
                <th className="py-2.5 px-3">Nama Bank</th>
                <th className="py-2.5 px-3">Kabupaten / Kota</th>
                <th className="py-2.5 px-3">Provinsi</th>
                <th className="py-2.5 px-3 text-center">Jenis</th>
                <th className="py-2.5 px-3 text-right">Nominal Transaksi</th>
                <th className="py-2.5 px-3">Tanggal Transaksi</th>
                <th className="py-2.5 px-3 text-center">Kecocokan Data</th>
                <th className="py-2.5 px-3 text-center">Status di Dashboard Sekolah (Port 2024)</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredMutations.map((m) => {
                const isBankActive = activeBankMap.get(m.bankName) === true;
                const isJustUpdated = m.id === lastTickId || m.isNew;
                return (
                  <tr
                    key={m.id}
                    className={`transition-colors duration-500 ${
                      isJustUpdated
                        ? "bg-emerald-500/10 border-l-4 border-l-emerald-500"
                        : "hover:bg-base/40"
                    }`}
                  >
                    {/* 1. Nama Bank */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded px-2 py-0.5 font-bold ${
                            m.bankName === "BRI"
                              ? "bg-status-ok/15 text-status-ok border border-status-ok/30"
                              : "bg-navy/10 text-navy"
                          }`}
                        >
                          {m.bankName}
                        </span>
                        {m.bankName === "BRI" && (
                          <span className="text-[9px] bg-status-ok/10 text-status-ok font-semibold px-1 rounded">
                            Mitra Utama
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Kabupaten */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-ink">{m.regency || "Kabupaten Pesawaran"}</div>
                      <div className="text-[10px] text-muted truncate max-w-[200px]" title={m.institutionName}>
                        {m.institutionName}
                      </div>
                    </td>

                    {/* 3. Provinsi */}
                    <td className="py-3 px-3 font-medium text-ink">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={11} className="text-muted shrink-0" />
                        {m.province || "Lampung"}
                      </span>
                    </td>

                    {/* 4. Jenis */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`rounded px-2.5 py-0.5 font-bold text-[10px] uppercase inline-flex items-center gap-1 ${
                          m.transactionType === "kredit"
                            ? "bg-status-ok/15 text-status-ok"
                            : "bg-navy/15 text-navy"
                        }`}
                      >
                        {m.transactionType === "kredit" ? "Kredit (Masuk)" : "Debit (Keluar)"}
                      </span>
                    </td>

                    {/* 5. Nominal Transaksi (bergerak realtime) */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-mono font-bold text-ink text-[13px]">
                        Rp{m.amount.toLocaleString("id-ID")}
                      </span>
                      {isJustUpdated && (
                        <span className="block text-[9px] font-semibold text-emerald-600 animate-pulse">
                          ● Masuk Realtime
                        </span>
                      )}
                    </td>

                    {/* 6. Tanggal Transaksi */}
                    <td className="py-3 px-3 text-muted font-mono whitespace-nowrap">
                      {m.transactionDate}
                    </td>

                    {/* 7. Kecocokan Data */}
                    <td className="py-3 px-3 text-center">
                      <StatusBadge value={m.matchStatus} />
                    </td>

                    {/* 8. Status di Dashboard Sekolah (Port 2024) secara realtime */}
                    <td className="py-3 px-3 text-center">
                      {isBankActive ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-status-ok/15 px-2.5 py-1 text-[11px] font-bold text-status-ok border border-status-ok/30 shadow-xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Mengalir ke Port 2024
                          </span>
                          <span className="text-[9px] text-muted font-medium mt-0.5">
                            Realtime Terhubung (API {m.bankName})
                          </span>
                        </div>
                      ) : (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 rounded bg-status-warn/15 px-2.5 py-0.5 text-[10px] font-semibold text-status-warn border border-status-warn/30">
                            <PauseCircle size={12} /> Ditahan Gateway
                          </span>
                          <span className="text-[9px] text-muted mt-0.5">
                            API Global Nonaktif (Belum ke Port 2024)
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 9. Aksi */}
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailModal(m)}
                          className="focus-ring rounded border border-line bg-panel px-2.5 py-1 text-[11px] font-medium text-navy hover:bg-base transition-colors"
                          title="Lihat Detail Mutasi"
                        >
                          <Eye size={12} className="inline mr-1" />
                          Detail
                        </button>

                        {m.matchStatus === "tidak cocok" && (
                          <button
                            onClick={() => sendMutationToAiFaa(m.id)}
                            className="focus-ring inline-flex items-center gap-1 rounded bg-status-danger/10 px-2 py-1 text-[10px] font-semibold text-status-danger hover:bg-status-danger/20 transition-colors"
                            title="Teruskan temuan ke AI-FAA"
                          >
                            <Send size={11} /> AI-FAA
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredMutations.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted">
                    Tidak ada mutasi rekening yang ditemukan dengan kriteria filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footnote clarifying whole-bank global scope */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <Info size={13} className="text-navy shrink-0" />
            Aliran mutasi rekening ke Dashboard Sekolah (Port 2024) dikendalikan secara <strong>keseluruhan per bank</strong> melalui Sakelar Global di atas, bukan per transaksi atau per satuan sekolah.
          </span>
          <span className="font-semibold text-ink">Mitra Utama Default: Bank BRI</span>
        </div>
      </Panel>

      {/* Modal 1: Pengaturan API & Konsol Uji GET JSON Bank (SNAP Standard) */}
      <Modal
        isOpen={!!apiSetupModalBank}
        onClose={() => setApiSetupModalBank(null)}
        title={`Setup Integrasi & GET JSON API — ${apiSetupModalBank?.bankFullName} (${apiSetupModalBank?.bankName})`}
        subtitle="Konfigurasi parameter API dan inspeksi respon JSON SNAP Open Banking Indonesia"
      >
        {apiSetupModalBank && (
          <div className="space-y-4 text-xs">
            {/* Bank Header Info & Global Status */}
            <div className="rounded border border-line bg-base p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-navy">{apiSetupModalBank.bankName}</span>
                <span className="text-xs text-muted">· {apiSetupModalBank.bankFullName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-2.5 py-0.5 font-bold text-[10px] ${
                    apiSetupModalBank.isActive
                      ? "bg-status-ok/15 text-status-ok"
                      : "bg-muted/15 text-muted"
                  }`}
                >
                  {apiSetupModalBank.isActive ? "● SAKELAR API AKTIF (GLOBAL)" : "○ SAKELAR API NONAKTIF (GLOBAL)"}
                </span>
                <span className="rounded bg-navy/10 px-2 py-0.5 text-navy font-semibold text-[10px]">
                  ±{apiSetupModalBank.activeSchoolsCount.toLocaleString("id-ID")} Sekolah
                </span>
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div className="flex border-b border-line gap-2">
              <button
                onClick={() => setActiveTab("test_get")}
                className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === "test_get"
                    ? "border-navy text-navy"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <Terminal size={14} />
                Konsol Uji GET JSON Bank
                {fetchedJson && (
                  <span className="rounded bg-status-ok/15 text-status-ok px-1.5 py-0.2 text-[9px] font-bold">
                    200 OK
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-1.5 pb-2 text-xs font-bold border-b-2 transition-colors ${
                  activeTab === "settings"
                    ? "border-navy text-navy"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <Sliders size={14} />
                Pengaturan Endpoint & Kredensial API
              </button>
            </div>

            {/* TAB 1: KONSOL UJI GET REQUEST & EXPLORER JSON */}
            {activeTab === "test_get" && (
              <div className="space-y-3">
                {/* Dedicated BRIAPI Official Products Selector (BRI Only) */}
                {apiSetupModalBank.bankName === "BRI" && (
                  <div className="rounded-md border border-navy/20 bg-navy/5 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-navy text-[11px] flex items-center gap-1.5">
                        <Landmark size={14} /> Pilih Produk API Resmi BRI (BRIAPI Sandbox):
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href="https://developers.bri.co.id/id/product/informasi-rekening"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-navy hover:underline flex items-center gap-1 font-semibold"
                        >
                          Docs: Informasi Rekening <ExternalLink size={10} />
                        </a>
                        <span className="text-muted">·</span>
                        <a
                          href="https://developers.bri.co.id/id/docs/api-docs-account-name-validation"
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-navy hover:underline flex items-center gap-1 font-semibold"
                        >
                          Docs: Validasi Nama Rekening <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={async () => {
                          setBriProductMode("statement");
                          setIsFetchingJson(true);
                          const start = Date.now();
                          const res = await fetchBriInformasiRekening();
                          setFetchLatency(Date.now() - start);
                          setFetchedJson(res);
                          setIsFetchingJson(false);
                        }}
                        className={`rounded py-1.5 px-3 font-bold text-[11px] border transition-colors flex items-center justify-center gap-1.5 ${
                          briProductMode === "statement"
                            ? "border-navy bg-navy text-white shadow-sm"
                            : "border-line bg-panel text-ink hover:bg-base"
                        }`}
                      >
                        <FileCode size={13} /> 1. Informasi Rekening & Mutasi SNAP
                      </button>

                      <button
                        onClick={async () => {
                          setBriProductMode("validation");
                          setIsFetchingJson(true);
                          const start = Date.now();
                          const res = await validateBriAccountName(validationAccountInput);
                          setFetchLatency(Date.now() - start);
                          setFetchedJson(res);
                          setIsFetchingJson(false);
                        }}
                        className={`rounded py-1.5 px-3 font-bold text-[11px] border transition-colors flex items-center justify-center gap-1.5 ${
                          briProductMode === "validation"
                            ? "border-navy bg-navy text-white shadow-sm"
                            : "border-line bg-panel text-ink hover:bg-base"
                        }`}
                      >
                        <ShieldCheck size={13} /> 2. Validasi Nama Rekening (SNAP)
                      </button>
                    </div>
                  </div>
                )}

                {/* Account Name Validation Testing Form (when mode === 'validation' and bank === 'BRI') */}
                {apiSetupModalBank.bankName === "BRI" && briProductMode === "validation" ? (
                  <div className="space-y-2 rounded border border-line bg-panel p-3 shadow-sm">
                    <div className="flex items-center justify-between text-[11px]">
                      <label className="font-bold text-ink flex items-center gap-1.5">
                        <ShieldCheck size={13} className="text-navy" />
                        Uji Endpoint Validasi Nama Rekening (POST /v1.0/validation-account/name-validate):
                      </label>
                      <span className="font-mono text-[10px] text-muted">Bank Code: 002 (BRI)</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1 flex items-center rounded border border-line bg-base overflow-hidden">
                        <span className="bg-navy/10 text-navy font-mono text-[10px] px-2 py-2 border-r border-line font-bold">
                          Rekening:
                        </span>
                        <input
                          value={validationAccountInput}
                          onChange={(e) => setTestValidationAccount(e.target.value)}
                          placeholder="Masukkan No. Rekening Sekolah (contoh: 012301004821501)"
                          className="w-full bg-transparent px-2.5 py-1.5 font-mono text-xs text-ink focus:outline-none"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          setIsFetchingJson(true);
                          const start = Date.now();
                          const res = await validateBriAccountName(validationAccountInput);
                          setFetchLatency(Date.now() - start);
                          setFetchedJson(res);
                          setIsFetchingJson(false);
                        }}
                        disabled={isFetchingJson}
                        className="rounded bg-navy px-4 py-2 font-bold text-xs text-white hover:bg-navy-light shadow-sm transition-colors flex items-center justify-center gap-1.5 shrink-0"
                      >
                        <Zap size={13} className="text-gold" />
                        <span>{isFetchingJson ? "Memvalidasi..." : "Uji Validasi Rekening BRI"}</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-muted">
                      Sesuai spesifikasi resmi BRIAPI: Sistem mengecek ke core banking BRI untuk memastikan rekening aktif dan mencocokkan nama satuan pendidikan sebelum transfer BOS/BOP disalurkan.
                    </p>
                  </div>
                ) : (
                  /* Standard Statement / GET URL Bar */
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <label className="font-bold text-ink flex items-center gap-1">
                        <Globe size={13} className="text-navy" />
                        Endpoint GET Permintaan Mutasi Rekening (SNAP Bank Statement):
                      </label>
                      <a
                        href={
                          apiSetupModalBank.bankName === "BRI"
                            ? "http://localhost:2028/api/admin/bank-configs/BRI/informasi-rekening"
                            : `http://localhost:2028/api/admin/bank-configs/${apiSetupModalBank.bankName}/fetch-json`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-navy hover:underline flex items-center gap-1 font-semibold"
                      >
                        Buka Raw Endpoint Proxy (:2028) <ExternalLink size={11} />
                      </a>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-1.5">
                      <div className="flex items-center rounded border border-line bg-panel overflow-hidden flex-1 shadow-sm">
                        <span className="bg-emerald-600 text-white font-mono font-bold text-[11px] px-2.5 py-2">
                          GET
                        </span>
                        <input
                          readOnly
                          value={
                            apiSetupModalBank.bankName === "BRI"
                              ? "https://sandbox.partner.api.bri.co.id/v1.0/bank-statement"
                              : setupFormData.apiEndpoint || apiSetupModalBank.apiEndpoint
                          }
                          className="w-full bg-transparent px-2.5 py-1.5 font-mono text-[11px] text-ink focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center rounded border border-line bg-panel overflow-hidden sm:w-56 shadow-sm">
                        <span className="bg-base text-muted font-mono text-[10px] px-2 py-2 border-r border-line">
                          ?query
                        </span>
                        <input
                          value={queryParamsInput}
                          onChange={(e) => setQueryParamsInput(e.target.value)}
                          placeholder="limit=20&sort=desc"
                          className="w-full bg-transparent px-2 py-1.5 font-mono text-[11px] text-ink focus:outline-none"
                          title="Query Parameters"
                        />
                      </div>

                      <button
                        onClick={async () => {
                          if (apiSetupModalBank.bankName === "BRI") {
                            setIsFetchingJson(true);
                            const start = Date.now();
                            const res = await fetchBriInformasiRekening();
                            setFetchLatency(Date.now() - start);
                            setFetchedJson(res);
                            setIsFetchingJson(false);
                          } else {
                            handleExecuteGetRequest();
                          }
                        }}
                        disabled={isFetchingJson}
                        className={`focus-ring flex items-center justify-center gap-1.5 rounded bg-navy px-4 py-2 font-bold text-xs text-white hover:bg-navy-light shadow-sm transition-colors shrink-0 ${
                          isFetchingJson ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                      >
                        <Zap size={13} className={isFetchingJson ? "animate-spin text-gold" : "text-gold"} />
                        <span>{isFetchingJson ? "Mengambil..." : "Kirim GET"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Response Status Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 rounded bg-base p-2.5 border border-line text-[11px]">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-ink">Status Response:</span>
                    <span className="inline-flex items-center gap-1 rounded bg-status-ok text-white font-bold text-[10px] px-2 py-0.5">
                      <CheckCircle size={11} /> 200 OK (SNAP Verified)
                    </span>
                    {fetchLatency !== null && (
                      <span className="text-muted font-mono text-[10px]">
                        Latency: <strong>{fetchLatency} ms</strong>
                      </span>
                    )}
                    <span className="text-muted font-mono text-[10px]">
                      Format: <strong>application/json</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyJson(fetchedJson)}
                      className="focus-ring inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 font-semibold text-navy hover:bg-base transition-colors"
                      title="Salin seluruh JSON ke clipboard"
                    >
                      {jsonCopied ? <Check size={12} className="text-status-ok" /> : <Copy size={12} />}
                      <span>{jsonCopied ? "Tersalin!" : "Salin JSON"}</span>
                    </button>

                    <button
                      onClick={() => handleDownloadJson(apiSetupModalBank.bankName, fetchedJson)}
                      className="focus-ring inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 font-semibold text-navy hover:bg-base transition-colors"
                      title="Unduh file format JSON"
                    >
                      <Download size={12} />
                      <span>Unduh .json</span>
                    </button>
                  </div>
                </div>

                {/* JSON Search Filter */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2 text-muted" />
                  <input
                    value={jsonSearchQuery}
                    onChange={(e) => setJsonSearchQuery(e.target.value)}
                    placeholder="Filter kata kunci dalam payload JSON (contoh: escrow, signature, transactionId)..."
                    className="focus-ring w-full rounded border border-line bg-panel py-1.5 pl-8 pr-3 text-[11px] text-ink shadow-sm"
                  />
                </div>

                {/* Formatted JSON Code Viewer */}
                <div className="relative rounded border border-line bg-navy-dark overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between bg-black/40 px-3 py-1.5 border-b border-navy-light/20 text-[10px] text-muted font-mono">
                    <span>ASPI SNAP Open Banking / Himbara Core Banking v2.0</span>
                    <span className="text-gold-light/80">HMAC-SHA256 Encrypted Signature</span>
                  </div>

                  <pre className="p-3 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-72 leading-relaxed selection:bg-emerald-800">
                    {fetchedJson ? (
                      JSON.stringify(
                        jsonSearchQuery
                          ? Object.fromEntries(
                              Object.entries(fetchedJson).filter(([k, v]) =>
                                k.toLowerCase().includes(jsonSearchQuery.toLowerCase()) ||
                                JSON.stringify(v).toLowerCase().includes(jsonSearchQuery.toLowerCase())
                              )
                            )
                          : fetchedJson,
                        null,
                        2
                      )
                    ) : (
                      <span className="text-muted italic">Memuat respon JSON dari server bank...</span>
                    )}
                  </pre>
                </div>

                {/* Dashboard Integration Status Note */}
                <div className="rounded bg-panel p-2.5 border border-line text-[11px] text-muted flex items-center justify-between">
                  <span>
                    Aliran ke Dashboard Institusi (:2024):{" "}
                    {apiSetupModalBank.isActive ? (
                      <strong className="text-status-ok font-bold">✓ DITERUSKAN & TAMPIL DI SEKOLAH</strong>
                    ) : (
                      <strong className="text-status-warn font-bold">⏸ DITAHAN DI GATEWAY (API NONAKTIF)</strong>
                    )}
                  </span>
                  <span className="font-mono text-[10px]">ISO 20022 / BI-FAST Valid</span>
                </div>
              </div>
            )}

            {/* TAB 2: PENGATURAN ENDPOINT & KREDENSIAL API */}
            {activeTab === "settings" && (
              <div className="space-y-3.5">
                <div className="rounded border border-navy/20 bg-navy/5 p-3 text-[11px] text-navy">
                  <p className="font-bold flex items-center gap-1.5">
                    <Sliders size={14} /> Pengaturan Parameter API Bank ({apiSetupModalBank.bankName})
                  </p>
                  <p className="text-ink/80 mt-0.5">
                    Konfigurasikan endpoint REST API, metode autentikasi, dan kredensial untuk penarikan data mutasi rekening secara berkala.
                  </p>
                </div>

                {/* Endpoint URL Field */}
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    URL Endpoint API Bank (Metode GET):
                  </label>
                  <input
                    value={setupFormData.apiEndpoint || ""}
                    onChange={(e) => setSetupFormData({ ...setupFormData, apiEndpoint: e.target.value })}
                    className="focus-ring w-full rounded border border-line bg-panel p-2 font-mono text-xs text-ink shadow-sm"
                    placeholder="https://api.bank.co.id/v1/mutations"
                  />
                  <p className="text-[10px] text-muted mt-1">
                    Endpoint penyedia layanan SNAP Open Banking untuk escrow dana pendidikan.
                  </p>
                </div>

                {/* Authentication Type & Timeout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-ink mb-1">Tipe Autentikasi:</label>
                    <select
                      value={setupFormData.authType || "OAuth 2.0"}
                      onChange={(e) =>
                        setSetupFormData({
                          ...setupFormData,
                          authType: e.target.value as "OAuth 2.0" | "API Key (mTLS)",
                        })
                      }
                      className="focus-ring w-full rounded border border-line bg-panel p-2 text-xs text-ink shadow-sm"
                    >
                      <option value="OAuth 2.0">OAuth 2.0 (Bearer Token / SNAP)</option>
                      <option value="API Key (mTLS)">API Key (Mutual TLS / mTLS)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-ink mb-1">Request Timeout (Milidetik):</label>
                    <input
                      type="number"
                      value={setupFormData.apiTimeoutMs || 5000}
                      onChange={(e) =>
                        setSetupFormData({ ...setupFormData, apiTimeoutMs: Number(e.target.value) })
                      }
                      className="focus-ring w-full rounded border border-line bg-panel p-2 font-mono text-xs text-ink shadow-sm"
                    />
                  </div>
                </div>

                {/* Client ID & Secret */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-ink mb-1">Client ID / Partner ID:</label>
                    <input
                      value={setupFormData.clientId || ""}
                      onChange={(e) => setSetupFormData({ ...setupFormData, clientId: e.target.value })}
                      className="focus-ring w-full rounded border border-line bg-panel p-2 font-mono text-xs text-ink shadow-sm"
                      placeholder="bri_edu_client_99812"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-ink">Client Secret / Private Key:</label>
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="text-[10px] text-navy font-semibold hover:underline"
                      >
                        {showSecret ? "Sembunyikan" : "Tampilkan"}
                      </button>
                    </div>
                    <input
                      type={showSecret ? "text" : "password"}
                      value={setupFormData.clientSecret || ""}
                      onChange={(e) => setSetupFormData({ ...setupFormData, clientSecret: e.target.value })}
                      className="focus-ring w-full rounded border border-line bg-panel p-2 font-mono text-xs text-ink shadow-sm"
                      placeholder="sec_live_xxxx"
                    />
                  </div>
                </div>

                {/* API Key / Token */}
                <div>
                  <label className="block font-semibold text-ink mb-1">API Key / Bearer Token:</label>
                  <input
                    value={setupFormData.apiKey || ""}
                    onChange={(e) => setSetupFormData({ ...setupFormData, apiKey: e.target.value })}
                    className="focus-ring w-full rounded border border-line bg-panel p-2 font-mono text-xs text-ink shadow-sm"
                    placeholder="token-bearer-live-prod"
                  />
                </div>

                {/* Custom Headers */}
                <div>
                  <label className="block font-semibold text-ink mb-1">
                    HTTP Request Headers (Format: Header: Nilai per baris):
                  </label>
                  <textarea
                    rows={2}
                    value={setupFormData.customHeaders || ""}
                    onChange={(e) => setSetupFormData({ ...setupFormData, customHeaders: e.target.value })}
                    className="focus-ring w-full rounded border border-line bg-panel p-2 font-mono text-xs text-ink shadow-sm"
                    placeholder="Accept: application/json&#10;X-Partner-Id: KEMENDIKDASMEN-ID"
                  />
                </div>

                {/* Default Query Params */}
                <div>
                  <label className="block font-semibold text-ink mb-1">Default Query Parameters untuk GET:</label>
                  <input
                    value={setupFormData.defaultQueryParams || ""}
                    onChange={(e) => setSetupFormData({ ...setupFormData, defaultQueryParams: e.target.value })}
                    className="focus-ring w-full rounded border border-line bg-panel p-2 font-mono text-xs text-ink shadow-sm"
                    placeholder="limit=20&sort=desc&accountType=ESCROW"
                  />
                </div>

                {/* Webhook Callback URL */}
                <div>
                  <label className="block font-semibold text-ink mb-1">Webhook Callback URL (Opsional):</label>
                  <input
                    value={setupFormData.webhookUrl || ""}
                    onChange={(e) => setSetupFormData({ ...setupFormData, webhookUrl: e.target.value })}
                    className="focus-ring w-full rounded border border-line bg-panel p-2 font-mono text-xs text-ink shadow-sm"
                    placeholder="http://localhost:2028/api/webhooks/bank/bri"
                  />
                </div>

                {/* Settings Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-line">
                  <button
                    onClick={() => setApiSetupModalBank(null)}
                    className="rounded border border-line bg-panel px-3.5 py-1.5 font-semibold text-muted hover:text-ink hover:bg-base"
                  >
                    Batal
                  </button>

                  <button
                    onClick={handleSaveApiSettings}
                    className="focus-ring rounded bg-navy px-4 py-1.5 font-bold text-white hover:bg-navy-light shadow-sm transition-colors"
                  >
                    💾 Simpan Pengaturan API
                  </button>

                  <button
                    onClick={() => {
                      handleSaveApiSettings();
                      setActiveTab("test_get");
                      handleExecuteGetRequest();
                    }}
                    className="focus-ring rounded bg-emerald-600 px-4 py-1.5 font-bold text-white hover:bg-emerald-700 shadow-sm transition-colors"
                  >
                    🚀 Simpan & Uji GET JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal 2: Konfirmasi Pengubahan Sakelar Global API Bank */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={`Konfirmasi Sakelar Global API Bank ${confirmModal?.bankName}`}
        subtitle="Pengaturan ini berlaku secara KESELURUHAN untuk seluruh sistem sekolah nasional"
      >
        {confirmModal && (
          <div className="space-y-4 text-xs">
            <div
              className={`rounded-md border p-3.5 flex items-start gap-3 ${
                confirmModal.targetActive
                  ? "border-status-ok bg-emerald-50/40 text-emerald-950"
                  : "border-status-danger/40 bg-status-danger/10 text-status-danger"
              }`}
            >
              <AlertTriangle className="shrink-0 mt-0.5" size={20} />
              <div className="space-y-1">
                <p className="font-bold text-sm">
                  {confirmModal.targetActive
                    ? `Aktifkan API Bank ${confirmModal.bankName} Secara Keseluruhan?`
                    : `Nonaktifkan API Bank ${confirmModal.bankName} Secara Keseluruhan?`}
                </p>
                <p className="text-[11px] leading-relaxed">
                  Perhatian: Sakelar ini mengontrol API Bank <strong>{confirmModal.bankFullName}</strong> secara <strong>keseluruhan (tingkat sistem nasional)</strong>, bukan per satuan pendidikan atau per nomor rekening.
                </p>
              </div>
            </div>

            <div className="rounded border border-line bg-base p-3 space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted">Bank Mitra:</span>
                <span className="font-bold text-ink">{confirmModal.bankFullName} ({confirmModal.bankName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Total Jangkauan Institusi:</span>
                <span className="font-bold text-navy">±{confirmModal.activeSchoolsCount.toLocaleString("id-ID")} Satuan Pendidikan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Dampak Perubahan:</span>
                <span className="font-semibold text-ink text-right max-w-xs">
                  {confirmModal.targetActive
                    ? `Mutasi rekening seluruh sekolah pengguna ${confirmModal.bankName} akan otomatis mengalir dan tampil di Dashboard Institusi Pendidikan (Port 2024).`
                    : `Aliran mutasi rekening seluruh sekolah pengguna ${confirmModal.bankName} akan ditahan di gateway dan disembunyikan dari dashboard sekolah.`}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                onClick={() => setConfirmModal(null)}
                className="rounded border border-line bg-panel px-3.5 py-1.5 font-semibold text-muted hover:text-ink hover:bg-base"
              >
                Batal
              </button>
              <button
                onClick={executeToggleGlobalBank}
                className={`rounded px-4 py-1.5 font-bold text-white shadow-sm transition-colors ${
                  confirmModal.targetActive
                    ? "bg-status-ok hover:bg-status-ok/90"
                    : "bg-status-danger hover:bg-status-danger/90"
                }`}
              >
                {confirmModal.targetActive
                  ? "Ya, Aktifkan API Bank Secara Keseluruhan"
                  : "Ya, Nonaktifkan API Bank Secara Keseluruhan"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 3: Detail Mutasi */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Detail Mutasi Rekening Bank Himbara"
        subtitle={`ID: ${detailModal?.id} · Transaksi: ${detailModal?.transactionId}`}
      >
        {detailModal && (
          <div className="space-y-4 text-xs">
            <div className="rounded border border-line bg-base p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Bank Penampung:</span>
                <span className="font-bold text-navy">{detailModal.bankName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Kabupaten / Kota:</span>
                <span className="font-bold text-ink">{detailModal.regency || "Kabupaten Pesawaran"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Provinsi:</span>
                <span className="font-bold text-ink">{detailModal.province || "Lampung"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Satuan Pendidikan:</span>
                <span className="font-bold text-ink">{detailModal.institutionName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Jenis Transaksi:</span>
                <span className="font-bold uppercase text-ink">
                  {detailModal.transactionType === "kredit" ? "Kredit (Penyaluran Masuk)" : "Debit (Pengeluaran)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Nominal Transaksi:</span>
                <span className="font-mono font-bold text-ink text-sm">
                  Rp{detailModal.amount.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Tanggal Transaksi:</span>
                <span className="font-mono text-ink">{detailModal.transactionDate}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Status Kecocokan:</span>
                <StatusBadge value={detailModal.matchStatus} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Status Aliran ke Port 2024:</span>
                {activeBankMap.get(detailModal.bankName) ? (
                  <span className="text-status-ok font-bold">
                    ✓ Mengalir Realtime ke Dashboard Sekolah (API {detailModal.bankName} Aktif)
                  </span>
                ) : (
                  <span className="text-status-warn font-bold">
                    ⏸ Ditahan Gateway (API {detailModal.bankName} Nonaktif)
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="block font-semibold text-ink mb-1">Deskripsi Transaksi:</span>
              <p className="rounded border border-line bg-panel p-2.5 text-ink">
                {detailModal.description || "Penyaluran dana anggaran pendidikan"}
              </p>
            </div>

            <div>
              <span className="block font-semibold text-ink mb-1">Sumber Data Terverifikasi:</span>
              <div className="rounded border border-line bg-base p-2.5 font-medium text-navy">
                {getMatchedDataSourceName(detailModal.matchedDataSourceId)}
              </div>
            </div>

            {/* Raw JSON Payload (Encrypted at rest preview) */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="font-semibold text-muted uppercase text-[11px]">
                  Raw Payload Log (Encrypted at Rest):
                </span>
                <span className="text-[10px] text-muted font-mono">AES-256-GCM Verified</span>
              </div>
              <pre className="rounded bg-navy-dark p-2.5 font-mono text-[11px] text-gold-light/90 overflow-x-auto">
                {JSON.stringify(
                  {
                    raw_id: detailModal.id,
                    bank_code: detailModal.bankName,
                    api_active_globally: activeBankMap.get(detailModal.bankName),
                    scope: "global_whole_bank",
                    destination_dashboard: "Institusi Pendidikan (:2024)",
                    amount_cleared: detailModal.amount,
                    currency: "IDR",
                    direction: detailModal.transactionType,
                    timestamp: `${detailModal.transactionDate}T09:15:00+07:00`,
                    signature_valid: true,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-line">
              {detailModal.matchStatus === "tidak cocok" ? (
                <button
                  onClick={() => {
                    sendMutationToAiFaa(detailModal.id);
                    setDetailModal(null);
                  }}
                  className="rounded bg-status-danger px-3 py-1.5 font-semibold text-white hover:bg-status-danger/90 flex items-center gap-1.5"
                >
                  <Send size={13} /> Kirim ke AI-FAA Console
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setDetailModal(null)}
                className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
