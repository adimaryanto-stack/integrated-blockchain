import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useAdminStore } from "@/store/adminStore";
import type { AiFaaFlag } from "@/types";
import {
  ShieldAlert,
  Search,
  CheckCircle,
  Clock,
  MapPin,
  Code,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Eye,
  Lock,
  Sparkles,
} from "lucide-react";

export function AiFaaConsole() {
  const { aiFlags, updateAiFlagStatus, regionalAudits, toggleRegionalAudit, nlToSqlLogs, bankMutations, canAccess, currentUser } = useAdminStore();

  const [activeTab, setActiveTab] = useState<"anomali" | "wilayah" | "nl2sql">("anomali");
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Tinjau Modal State
  const [reviewingFlag, setReviewingFlag] = useState<AiFaaFlag | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [targetStatus, setTargetStatus] = useState<"baru" | "ditinjau" | "selesai">("ditinjau");

  const canEdit = canAccess("AI-FAA Console", "edit");

  // Filtered Anomaly Flags
  const filteredFlags = useMemo(() => {
    return aiFlags.filter((f) => {
      const matchSev = !severityFilter || f.severity === severityFilter;
      const matchStat = !statusFilter || f.status === statusFilter;
      const matchSearch =
        !search ||
        f.transactionId.toLowerCase().includes(search.toLowerCase()) ||
        f.reason.toLowerCase().includes(search.toLowerCase()) ||
        (f.institutionName && f.institutionName.toLowerCase().includes(search.toLowerCase()));
      return matchSev && matchStat && matchSearch;
    });
  }, [aiFlags, severityFilter, statusFilter, search]);

  const openReviewModal = (flag: AiFaaFlag) => {
    setReviewingFlag(flag);
    setReviewNotes(flag.reviewNotes || "");
    setTargetStatus(flag.status === "baru" ? "ditinjau" : flag.status);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingFlag) return;
    updateAiFlagStatus(reviewingFlag.id, targetStatus, reviewNotes);
    setReviewingFlag(null);
  };

  const relatedMutation = useMemo(() => {
    if (!reviewingFlag?.matchedBankMutationId) return null;
    return bankMutations.find((b) => b.id === reviewingFlag.matchedBankMutationId);
  }, [reviewingFlag, bankMutations]);

  if (!canAccess("AI-FAA Console", "view")) {
    return (
      <DashboardLayout pageTitle="AI-FAA Management Console">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-danger/10 border border-status-danger/30">
            <Lock size={32} className="text-status-danger" />
          </div>
          <h2 className="text-xl font-bold text-ink">Akses Ditolak</h2>
          <p className="text-sm text-muted max-w-sm">
            <strong>AI-FAA Console</strong> hanya tersedia untuk <strong>Super Admin</strong>, <strong>Ops Admin</strong>, <strong>Admin Kementerian</strong>, dan <strong>Admin Wilayah</strong>.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="AI-FAA Management Console">
      {/* Tab Switcher */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <button
          onClick={() => setActiveTab("anomali")}
          className={`focus-ring rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "anomali"
              ? "bg-navy text-white shadow-sm"
              : "border border-line bg-panel text-ink hover:bg-base"
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} />
            <span>Anomali Transaksi</span>
            <span className="rounded-full bg-status-danger px-1.5 py-0.2 text-[10px] text-white">
              {aiFlags.filter((f) => f.status !== "selesai").length}
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("wilayah")}
          className={`focus-ring rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "wilayah"
              ? "bg-navy text-white shadow-sm"
              : "border border-line bg-panel text-ink hover:bg-base"
          }`}
        >
          <div className="flex items-center gap-2">
            <MapPin size={14} />
            <span>Kontrol Audit Provinsi</span>
            <span className="rounded-full bg-navy/10 px-1.5 py-0.2 text-[10px] text-navy">
              {regionalAudits.length} Prov
            </span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab("nl2sql")}
          className={`focus-ring rounded-sm px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "nl2sql"
              ? "bg-navy text-white shadow-sm"
              : "border border-line bg-panel text-ink hover:bg-base"
          }`}
        >
          <div className="flex items-center gap-2">
            <Code size={14} />
            <span>Log NL-to-SQL & Guardrail</span>
            <span className="rounded-full bg-navy/10 px-1.5 py-0.2 text-[10px] text-navy">
              {nlToSqlLogs.length}
            </span>
          </div>
        </button>
      </div>

      {/* Tab 1: Anomali Transaksi */}
      {activeTab === "anomali" && (
        <div className="space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-2.5 text-muted" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari transaksi ID, nama sekolah, alasan anomali..."
                  className="focus-ring w-full rounded-sm border border-line bg-panel py-2 pl-9 pr-3 text-xs text-ink shadow-sm"
                />
              </div>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm"
              >
                <option value="">Semua Tingkat Keparahan</option>
                <option value="tinggi">Tinggi (Kritis)</option>
                <option value="sedang">Sedang</option>
                <option value="rendah">Rendah</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm"
              >
                <option value="">Semua Status</option>
                <option value="baru">Baru</option>
                <option value="ditinjau">Sedang Ditinjau</option>
                <option value="selesai">Selesai / Clear</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Panel title={`Daftar Flag Anomali Keuangan (${filteredFlags.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted">
                    <th className="py-2.5">Transaksi & Satuan</th>
                    <th className="py-2.5">Nominal Terkait</th>
                    <th className="py-2.5">Temuan Anomali AI-FAA</th>
                    <th className="py-2.5 text-center">Tingkat</th>
                    <th className="py-2.5 text-center">Status</th>
                    <th className="py-2.5">Waktu Flag</th>
                    <th className="py-2.5 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredFlags.map((f) => (
                    <tr key={f.id} className="hover:bg-base/40 transition-colors">
                      <td className="py-3">
                        <div className="font-mono font-bold text-ink">{f.transactionId}</div>
                        <div className="text-[11px] text-muted">
                          {f.institutionName || "Satuan Pendidikan"} {f.npsn ? `(${f.npsn})` : ""}
                        </div>
                      </td>
                      <td className="py-3 font-mono font-semibold text-ink">
                        {f.amount ? `Rp${f.amount.toLocaleString("id-ID")}` : "—"}
                      </td>
                      <td className="py-3 max-w-xs text-ink font-medium">
                        {f.reason}
                        {f.reviewNotes && (
                          <div className="mt-1 text-[11px] text-muted italic">
                            Catatan: {f.reviewNotes}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge value={f.severity} />
                      </td>
                      <td className="py-3 text-center">
                        <StatusBadge value={f.status} />
                      </td>
                      <td className="py-3 text-muted font-mono whitespace-nowrap text-[11px]">
                        {f.createdAt}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openReviewModal(f)}
                          className="focus-ring inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 text-[11px] font-semibold text-navy hover:bg-base transition-colors"
                        >
                          <Eye size={12} /> Tinjau
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredFlags.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted">
                        Tidak ada transaksi yang diflag anomali dengan kriteria ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>
      )}

      {/* Tab 2: Kontrol Audit Wilayah (38 Provinsi) */}
      {activeTab === "wilayah" && (
        <Panel
          title="Kontrol Scanning AI-FAA per Wilayah Provinsi"
          action={
            <span className="text-xs text-muted">
              Fitur PRD: Aktifkan / Nonaktifkan audit background scanning per provinsi
            </span>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted">
                  <th className="py-2.5">Kode</th>
                  <th className="py-2.5">Provinsi</th>
                  <th className="py-2.5 text-center">Jumlah Anomali Terdeteksi</th>
                  <th className="py-2.5">Pemindaian Terakhir</th>
                  <th className="py-2.5 text-center">Status Audit Scanning</th>
                  <th className="py-2.5 text-right">Sakelar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {regionalAudits.map((r) => (
                  <tr key={r.provinceId} className="hover:bg-base/40 transition-colors">
                    <td className="py-3 font-mono text-muted">{r.provinceId}</td>
                    <td className="py-3 font-semibold text-ink">{r.provinceName}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`rounded px-2 py-0.5 font-bold ${
                          r.anomalyCount > 0 ? "bg-status-danger/10 text-status-danger" : "text-muted"
                        }`}
                      >
                        {r.anomalyCount} anomali
                      </span>
                    </td>
                    <td className="py-3 font-mono text-muted">{r.lastScanTime}</td>
                    <td className="py-3 text-center">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          r.isAuditActive ? "bg-status-ok/10 text-status-ok" : "bg-muted/10 text-muted"
                        }`}
                      >
                        {r.isAuditActive ? "AKTIF" : "NONAKTIF"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {canEdit && (
                        <button
                          onClick={() => toggleRegionalAudit(r.provinceId)}
                          className={`focus-ring rounded px-3 py-1 text-xs font-semibold transition-colors ${
                            r.isAuditActive
                              ? "bg-status-danger/10 text-status-danger hover:bg-status-danger/20"
                              : "bg-status-ok/10 text-status-ok hover:bg-status-ok/20"
                          }`}
                        >
                          {r.isAuditActive ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Tab 3: Log Query NL-to-SQL & Guardrail */}
      {activeTab === "nl2sql" && (
        <Panel
          title="Log Query NL-to-SQL AI-FAA (Audit Trail: SQL AST Guardrail & PII Masking)"
          action={
            <span className="text-xs text-muted flex items-center gap-1">
              <ShieldCheck size={14} className="text-status-ok" /> Proteksi Injeksi SQL Aktif
            </span>
          }
        >
          <div className="space-y-4">
            {nlToSqlLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-md border border-line bg-panel p-4 shadow-sm text-xs space-y-2 hover:border-navy/40 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-navy">{log.id}</span>
                    <span className="text-muted">oleh: {log.executedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted">
                    <span>{log.queriedAt}</span>
                    <span>·</span>
                    <span className="font-mono">{log.executionTimeMs} ms</span>
                  </div>
                </div>

                <div>
                  <span className="font-semibold text-muted text-[11px] uppercase">Pertanyaan Bahasa Alami (User Prompt):</span>
                  <p className="font-medium text-ink mt-0.5 italic">"{log.userPrompt}"</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-muted text-[11px] uppercase">Query SQL Dihasilkan:</span>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                          log.astGuardrailPassed ? "bg-status-ok/10 text-status-ok" : "bg-status-danger/10 text-status-danger"
                        }`}
                      >
                        {log.astGuardrailPassed ? "✓ SQL AST Guardrail Lolos" : "✕ Diblokir Guardrail"}
                      </span>
                      {log.piiMasked && (
                        <span className="rounded bg-gold/15 px-1.5 py-0.2 text-[10px] font-bold text-ink">
                          🔒 PII Ter-Masking
                        </span>
                      )}
                    </div>
                  </div>
                  <pre className="rounded bg-navy-dark p-2.5 font-mono text-[11px] text-white/90 overflow-x-auto">
                    {log.generatedSql}
                  </pre>
                </div>

                {log.maskedFields.length > 0 && (
                  <div className="text-[10px] text-muted flex items-center gap-1 pt-1">
                    <Lock size={11} className="text-gold" />
                    <span>Field PII terlindungi: </span>
                    <code className="text-navy font-semibold">{log.maskedFields.join(", ")}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Modal: Tinjau Anomali */}
      <Modal
        isOpen={!!reviewingFlag}
        onClose={() => setReviewingFlag(null)}
        title="Tinjauan Anomali Transaksi Keuangan"
        subtitle={`Transaksi: ${reviewingFlag?.transactionId} · Waktu: ${reviewingFlag?.createdAt}`}
        maxWidth="lg"
      >
        {reviewingFlag && (
          <form onSubmit={handleSaveReview} className="space-y-4 text-xs">
            <div className="rounded border border-line bg-base p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Satuan Pendidikan:</span>
                <span className="font-bold text-ink">{reviewingFlag.institutionName || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">NPSN:</span>
                <span className="font-mono text-ink">{reviewingFlag.npsn || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Nominal Terkait:</span>
                <span className="font-mono font-bold text-status-danger text-sm">
                  {reviewingFlag.amount ? `Rp${reviewingFlag.amount.toLocaleString("id-ID")}` : "—"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Tingkat Keparahan:</span>
                <StatusBadge value={reviewingFlag.severity} />
              </div>
            </div>

            <div>
              <span className="block font-semibold text-ink mb-1">Temuan Algoritma AI-FAA:</span>
              <p className="rounded border border-status-danger/30 bg-status-danger/5 p-3 text-ink leading-relaxed">
                {reviewingFlag.reason}
              </p>
            </div>

            {/* Correlated Bank Mutation if exists */}
            {relatedMutation && (
              <div className="rounded border border-line bg-panel p-3">
                <span className="block font-semibold text-navy mb-1.5 flex items-center gap-1">
                  <Sparkles size={13} className="text-gold" /> Rekening Mutasi Bank Himbara Berkaitan:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-muted">Bank: </span>
                    <strong className="text-ink">{relatedMutation.bankName}</strong>
                  </div>
                  <div>
                    <span className="text-muted">No. Rekening: </span>
                    <strong className="text-ink font-mono">{relatedMutation.accountNumberMasked}</strong>
                  </div>
                  <div>
                    <span className="text-muted">Tipe Transaksi: </span>
                    <span className="capitalize">{relatedMutation.transactionType}</span>
                  </div>
                  <div>
                    <span className="text-muted">Tanggal Mutasi: </span>
                    <span>{relatedMutation.transactionDate}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block font-semibold text-ink">Update Status Review</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as any)}
                  className="focus-ring w-full rounded border border-line p-2 text-ink"
                >
                  <option value="baru">Baru (Belum Ditindaklanjuti)</option>
                  <option value="ditinjau">Sedang Ditinjau</option>
                  <option value="selesai">Selesai / Telah Diklarifikasi</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">Pemeriksa / Reviewer</label>
                <input
                  type="text"
                  disabled
                  value={reviewingFlag.reviewedBy || "Admin Bertugas"}
                  className="w-full rounded border border-line bg-base p-2 text-muted"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">
                Catatan Hasil Investigasi / Klarifikasi Satuan:
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Masukkan catatan klarifikasi dari bendahara sekolah, berita acara verifikasi, atau nomor surat koreksi..."
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-line">
              <button
                type="button"
                onClick={() => setReviewingFlag(null)}
                className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
              >
                Batal
              </button>
              <button
                type="submit"
                className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
              >
                Simpan Hasil Review
              </button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
