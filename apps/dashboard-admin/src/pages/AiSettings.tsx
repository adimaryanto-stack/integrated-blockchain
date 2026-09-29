import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAdminStore } from "@/store/adminStore";
import {
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Bot,
  Send,
  Eye,
  EyeOff,
  Sliders,
  Save,
  Play,
  RotateCcw,
  Check,
  Cpu,
  Layers,
  RefreshCw,
  Compass
} from "lucide-react";

interface AiConfig {
  provider: "gemini" | "openai" | "deepseek" | "custom";
  apiKey: string;
  model: string;
  systemPrompt: string;
  isActive: boolean;
  temperature: number;
  maxTokens: number;
  endpointUrl: string;
}

const DEFAULT_PROMPT =
  "Kamu adalah Aksara, asisten AI interaktif dan ramah untuk transparansi anggaran pendidikan APBN Indonesia 2026. Kamu membantu masyarakat menelusuri ke mana uang APBN pendidikan mengalir secara transparan, berbasis data resmi, akurat, dan mudah dipahami.";

interface ProviderMeta {
  name: string;
  sub: string;
  keyUrl: string;
  keyLabel: string;
  placeholder: string;
  defaultModels: string[];
}

const PROVIDER_METADATA: Record<string, ProviderMeta> = {
  gemini: {
    name: "Gemini",
    sub: "Google AI Studio",
    keyUrl: "https://aistudio.google.com/app/apikey",
    keyLabel: "Dapatkan di Google AI Studio (aistudio.google.com/app/apikey)",
    placeholder: "AIzaSy...",
    defaultModels: [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.5-pro",
      "gemini-flash-lite-latest",
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
      "gemini-pro"
    ]
  },
  openai: {
    name: "OpenAI",
    sub: "OpenAI API",
    keyUrl: "https://platform.openai.com/api-keys",
    keyLabel: "Dapatkan di OpenAI Platform (platform.openai.com/api-keys)",
    placeholder: "sk-proj-...",
    defaultModels: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "o3-mini"]
  },
  deepseek: {
    name: "DeepSeek",
    sub: "DeepSeek AI",
    keyUrl: "https://platform.deepseek.com/api_keys",
    keyLabel: "Dapatkan di DeepSeek Platform (platform.deepseek.com/api_keys)",
    placeholder: "sk-...",
    defaultModels: ["deepseek-chat", "deepseek-coder", "deepseek-reasoner"]
  },
  custom: {
    name: "Custom",
    sub: "Local / Private LLM",
    keyUrl: "https://ollama.com",
    keyLabel: "Dokumentasi Ollama / Custom API (ollama.com)",
    placeholder: "Opsional jika endpoint lokal tidak memerlukan token...",
    defaultModels: ["custom-model", "llama3.2", "qwen2.5", "mistral"]
  }
};

export function AiSettings() {
  const { canAccess, currentUser } = useAdminStore();
  const [config, setConfig] = useState<AiConfig>({
    provider: "gemini",
    apiKey: "",
    model: "gemini-2.5-flash",
    systemPrompt: DEFAULT_PROMPT,
    isActive: true,
    temperature: 0.7,
    maxTokens: 1024,
    endpointUrl: ""
  });

  const [showKey, setShowKey] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [availableModelsList, setAvailableModelsList] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; autoSwitched?: boolean } | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Chat simulator state
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "bot"; text: string }>>([
    {
      role: "bot",
      text: "Halo Admin! Ini adalah simulator pengujian Tanya Aksara AI. Silakan uji coba dialog interaktif setelah mengatur token API di atas."
    }
  ]);
  const [userInput, setUserInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const showToast = (type: "success" | "error", text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  // Load config on mount
  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:2028/api/ai/config");
        if (res.ok) {
          const v = await res.json();
          if (v && v.provider) {
            const prov = v.provider || "gemini";
            const initialModel = v.model || PROVIDER_METADATA[prov]?.defaultModels[0] || "gemini-2.5-flash";
            setConfig({
              provider: prov,
              apiKey: v.apiKey || "",
              model: initialModel,
              systemPrompt: v.systemPrompt || DEFAULT_PROMPT,
              isActive: v.isActive !== false,
              temperature: v.temperature ?? 0.7,
              maxTokens: v.maxTokens || 1024,
              endpointUrl: v.endpointUrl || ""
            });
          }
        }
      } catch (err) {
        console.warn("Could not load AI config from backend:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleFetchModels = async () => {
    if (!config.apiKey && config.provider !== "custom") {
      showToast("error", "Masukkan API Token terlebih dahulu sebelum mengecek model.");
      return;
    }

    setIsFetchingModels(true);
    try {
      const res = await fetch("http://localhost:2028/api/ai/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey
        })
      });

      const data = await res.json();
      if (res.ok && Array.isArray(data.models) && data.models.length > 0) {
        setAvailableModelsList(data.models);
        // If current model is not in list, auto-select first available
        if (!data.models.includes(config.model)) {
          setConfig((prev) => ({ ...prev, model: data.models[0] }));
        }
        showToast("success", `Ditemukan ${data.models.length} model aktif dari ${config.provider.toUpperCase()}!`);
      } else {
        showToast("error", data.error || "Tidak ada model ditemukan untuk API key ini.");
      }
    } catch (err: any) {
      showToast("error", "Gagal memuat model: " + err.message);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setTestResult(null);

    try {
      const res = await fetch("http://localhost:2028/api/ai/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("success", "Pengaturan Token API Aksara AI berhasil disimpan ke database!");
      } else {
        throw new Error(data.error || "Gagal menyimpan konfigurasi");
      }
    } catch (err: any) {
      showToast("error", "Gagal menyimpan pengaturan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.apiKey && config.provider !== "custom") {
      setTestResult({ success: false, message: "Masukkan API Token terlebih dahulu sebelum menguji koneksi." });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("http://localhost:2028/api/ai/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.apiKey,
          model: config.model,
          endpointUrl: config.endpointUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.usedModel && data.usedModel !== config.model) {
          setConfig((prev) => ({ ...prev, model: data.usedModel }));
          showToast("success", `Model otomatis disesuaikan ke '${data.usedModel}' yang aktif di akun Anda!`);
        }
        if (data.availableModels && data.availableModels.length > 0) {
          setAvailableModelsList(data.availableModels);
        }
        setTestResult({
          success: true,
          message: data.message || "Koneksi ke API AI berhasil terverifikasi!",
          autoSwitched: data.autoSwitched
        });
      } else {
        if (data.availableModels && data.availableModels.length > 0) {
          setAvailableModelsList(data.availableModels);
          // If available models exist, auto switch to first one
          if (data.availableModels[0] && data.availableModels[0] !== config.model) {
            setConfig((prev) => ({ ...prev, model: data.availableModels[0] }));
          }
        }
        setTestResult({
          success: false,
          message: data.message || "Uji koneksi gagal. Periksa kembali token API Anda."
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: "Koneksi error: " + err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;

    const userText = userInput.trim();
    setUserInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: userText }]);
    setIsSending(true);

    try {
      const res = await fetch("http://localhost:2028/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userText,
          history: chatMessages.map((m) => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.text
          }))
        })
      });

      const data = await res.json();
      if (data.reply) {
        setChatMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text:
              data.message ||
              "Token API belum merespon. Pastikan token aktif dan telah disimpan di form sebelah kiri."
          }
        ]);
      }
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "bot", text: "Terjadi gangguan jaringan ke backend: " + err.message }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const currentProviderMeta = PROVIDER_METADATA[config.provider] || PROVIDER_METADATA.gemini;

  // Active models list merges defaults + discovered models
  const modelOptions = Array.from(
    new Set([...(availableModelsList || []), ...(currentProviderMeta.defaultModels || [])])
  );

  return (
    <DashboardLayout
      pageTitle="Pengaturan Tanya Aksara AI"
      description="Konfigurasi API Token & LLM Provider untuk Maskot Interaktif Tanya Aksara di Portal Publik (Port 2019)"
    >
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold text-white animate-fade-in ${
            toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Top Banner KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Panel className="p-4 border-l-4 border-l-navy bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-navy/10 text-navy">
              <Bot size={22} />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Status Aksara Engine</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    config.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                  }`}
                />
                <span className="text-sm font-bold text-ink">
                  {config.isActive ? "Aktif Online" : "Dinonaktifkan"}
                </span>
              </div>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 border-l-4 border-l-blue-600 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-blue-600">
              <Cpu size={22} />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Penyedia & Model</p>
              <p className="text-sm font-bold text-ink capitalize truncate">
                {config.provider} ({config.model})
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 border-l-4 border-l-amber-500 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-600">
              <Key size={22} />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Status Token API</p>
              <p className="text-sm font-bold text-ink">
                {config.apiKey ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check size={14} /> Terkonfigurasi
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">Belum Diisi</span>
                )}
              </p>
            </div>
          </div>
        </Panel>

        <Panel className="p-4 border-l-4 border-l-purple-600 bg-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-600">
              <ExternalLink size={22} />
            </div>
            <div>
              <p className="text-xs text-muted font-medium">Target Frontend</p>
              <a
                href="http://localhost:2019/index.html"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-navy hover:underline flex items-center gap-1 mt-0.5"
              >
                Port :2019 Publik &rarr;
              </a>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Settings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Panel className="p-6 bg-white border border-line rounded-xl shadow-sm">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-line">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-navy text-white">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-ink">Konfigurasi Token & Kredensial AI</h3>
                  <p className="text-xs text-muted">
                    Atur token otentikasi API agar maskot Tanya Aksara dapat memproses dialog interaktif warga.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink">
                <input
                  type="checkbox"
                  checked={config.isActive}
                  onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                  className="rounded border-line text-navy focus:ring-navy h-4 w-4"
                />
                <span>Aktifkan AI</span>
              </label>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5 uppercase tracking-wider">
                  Penyedia Layanan AI (Provider)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["gemini", "openai", "deepseek"] as const).map((prov) => {
                    const meta = PROVIDER_METADATA[prov];
                    const isSelected = config.provider === prov;
                    return (
                      <div
                        key={prov}
                        onClick={() => {
                          const defaultM = meta.defaultModels[0] || "";
                          setConfig({ ...config, provider: prov, model: defaultM });
                          setAvailableModelsList([]);
                          setTestResult(null);
                        }}
                        className={`flex flex-col justify-between p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                          isSelected
                            ? "border-navy bg-navy/10 text-navy shadow-sm"
                            : "border-line bg-slate-50 text-muted hover:bg-slate-100"
                        }`}
                      >
                        <div className="text-center">
                          <span className="font-bold uppercase tracking-wider block text-sm">{meta.name}</span>
                          <span className="text-[10px] text-muted block mt-0.5">{meta.sub}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center justify-center">
                          <a
                            href={meta.keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title={`Buka situs ${meta.name} untuk mendapatkan API key`}
                            className="text-[10px] text-blue-600 hover:text-blue-800 font-bold inline-flex items-center gap-1 hover:underline"
                          >
                            Ambil Key <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* API Token Key with Clickable Link */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Key size={13} className="text-navy" /> API Token / Secret Key
                  </label>
                  <a
                    href={currentProviderMeta.keyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                    title="Klik untuk membuka halaman pembuatan API Key di tab baru"
                  >
                    <span>{currentProviderMeta.keyLabel}</span>
                    <ExternalLink size={12} className="shrink-0" />
                  </a>
                </div>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder={currentProviderMeta.placeholder}
                    className="w-full bg-slate-50 border border-line rounded-lg px-3.5 py-2.5 pr-20 text-xs font-mono text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 transition-all"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="p-1.5 text-muted hover:text-ink rounded"
                      title={showKey ? "Sembunyikan" : "Tampilkan"}
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Model Selection & Temperature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-ink uppercase tracking-wider">
                      Model AI
                    </label>
                    <button
                      type="button"
                      onClick={handleFetchModels}
                      disabled={isFetchingModels}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 hover:underline"
                      title="Deteksi daftar model yang didukung oleh API Key Anda"
                    >
                      <RefreshCw size={11} className={isFetchingModels ? "animate-spin" : ""} />
                      <span>{isFetchingModels ? "Memeriksa..." : "Cek Model API"}</span>
                    </button>
                  </div>
                  <select
                    value={config.model}
                    onChange={(e) => setConfig({ ...config, model: e.target.value })}
                    className="w-full bg-slate-50 border border-line rounded-lg px-3 py-2 text-xs font-semibold text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
                  >
                    {modelOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-muted mt-1">
                    {availableModelsList.length > 0
                      ? `Menampilkan ${availableModelsList.length} model aktif dari akun Anda.`
                      : "Pilih model bawaan atau klik 'Cek Model API' untuk auto-deteksi."}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-ink uppercase tracking-wider">
                      Suhu (Temperature): {config.temperature}
                    </label>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.temperature}
                    onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-navy cursor-pointer mt-1"
                  />
                  <div className="flex justify-between text-[10px] text-muted">
                    <span>Faktual (0.0)</span>
                    <span>Seimbang (0.7)</span>
                    <span>Kreatif (1.0)</span>
                  </div>
                </div>
              </div>

              {/* System Prompt Persona */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-500" /> System Prompt & Persona Aksara
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, systemPrompt: DEFAULT_PROMPT })}
                    className="text-[11px] text-navy hover:underline flex items-center gap-1 font-semibold"
                  >
                    <RotateCcw size={11} /> Reset Default
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                  className="w-full bg-slate-50 border border-line rounded-lg p-3 text-xs text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/20 leading-relaxed font-sans"
                  placeholder="Instruksi karakter dan batasan jawaban untuk Aksara AI..."
                />
              </div>

              {/* Test Result Alert */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <strong className="block font-semibold">
                      {testResult.success ? "Uji Koneksi Berhasil" : "Koneksi Gagal"}
                    </strong>
                    <span className="text-[11px] mt-0.5 block leading-relaxed">{testResult.message}</span>
                    {!testResult.success && (
                      <div className="mt-2 text-[10px] text-red-700 bg-red-100/60 p-2 rounded">
                        <strong>Tips Pemecahan Masalah:</strong>
                        <ul className="list-disc pl-3 mt-1 space-y-0.5">
                          <li>
                            Buka tautan{" "}
                            <a
                              href={currentProviderMeta.keyUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="font-bold underline"
                            >
                              {currentProviderMeta.keyLabel}
                            </a>{" "}
                            untuk memastikan status API key aktif.
                          </li>
                          <li>Pilih <strong>gemini-2.5-flash</strong> atau <strong>gemini-flash-latest</strong> pada dropdown model di atas.</li>
                          <li>Klik tombol <strong>"Cek Model API"</strong> untuk memuat model yang tersedia.</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Button - Prominent Sticky Footer Style */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-line mt-6 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-xl">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-ink shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={13} className={isTesting ? "animate-spin text-navy" : "text-navy"} />
                    <span>{isTesting ? "Menguji API..." : "Uji Koneksi Token"}</span>
                  </button>
                  <span className="text-[11px] text-muted hidden sm:inline">Uji validitas token & model</span>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Save size={15} />
                  <span>{isSaving ? "Menyimpan ke Database..." : "Simpan Konfigurasi"}</span>
                </button>
              </div>
            </form>
          </Panel>

          {/* Security & Audit Guidance */}
          <Panel className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2 text-slate-700">
            <div className="flex items-center gap-2 font-bold text-navy">
              <ShieldCheck size={16} className="text-emerald-600" />
              <span>Keamanan Token API & Integrasi Database Resmi</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              Token API disimpan secara aman di tabel <code>public.system_settings</code> pada database lokal PostgreSQL (Port 2027) dan diproksikan lewat backend Port 2028. Kunci otentikasi tidak pernah dibocorkan ke sisi peramban publik. Setiap jawaban dari maskot Aksara AI secara otomatis digabungkan dengan konteks data riil APBN 2026 dan statistik 468.483 satuan pendidikan se-Indonesia.
            </p>
          </Panel>
        </div>

        {/* Right Column: Simulator Tanya Aksara (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Panel className="p-5 bg-white border border-line rounded-xl shadow-sm flex flex-col h-[640px]">
            {/* Simulator Header */}
            <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  A
                </div>
                <div>
                  <h4 className="font-bold text-xs text-ink">Simulator Tanya Aksara</h4>
                  <p className="text-[10px] text-muted">Uji respons AI secara langsung</p>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
                Live Preview
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed text-xs ${
                      msg.role === "user"
                        ? "bg-navy text-white rounded-br-none shadow-sm"
                        : "bg-slate-100 text-ink rounded-bl-none border border-slate-200/60"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 text-muted rounded-2xl rounded-bl-none px-3.5 py-2 text-xs flex items-center gap-2">
                    <span className="animate-spin inline-block h-3 w-3 border-2 border-navy border-t-transparent rounded-full" />
                    <span>Aksara sedang berpikir...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto border-t border-line mt-2 text-[10px]">
              <button
                type="button"
                onClick={() => setUserInput("Berapa alokasi mandatory APBN Pendidikan 2026?")}
                className="whitespace-nowrap px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-ink border border-slate-200 font-medium"
              >
                APBN 2026?
              </button>
              <button
                type="button"
                onClick={() => setUserInput("Berapa alokasi dana BOS untuk sekolah Jawa Barat?")}
                className="whitespace-nowrap px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-ink border border-slate-200 font-medium"
              >
                BOS Jabar?
              </button>
              <button
                type="button"
                onClick={() => setUserInput("Bagaimana alur penyaluran dana BOS ke rekening sekolah?")}
                className="whitespace-nowrap px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-ink border border-slate-200 font-medium"
              >
                Alur BOS?
              </button>
            </div>

            {/* Simulator Input Form */}
            <form onSubmit={handleSendMessage} className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ketik pertanyaan untuk Aksara..."
                className="flex-1 bg-slate-50 border border-line rounded-lg px-3 py-2 text-xs text-ink outline-none focus:border-navy focus:ring-2 focus:ring-navy/20"
              />
              <button
                type="submit"
                disabled={isSending || !userInput.trim()}
                className="p-2 bg-navy hover:bg-navy-light text-white rounded-lg transition-colors disabled:opacity-50"
                title="Kirim pesan"
              >
                <Send size={15} />
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </DashboardLayout>
  );
}
