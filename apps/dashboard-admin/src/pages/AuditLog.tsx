import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { Modal } from "@/components/ui/Modal";
import { useAdminStore } from "@/store/adminStore";
import type { AuditLogEntry, Dashboard } from "@/types";
import { Search, Download, Eye, Clock, Shield, ArrowUpDown, Filter, Terminal } from "lucide-react";

export function AuditLog() {
  const { auditLogs } = useAdminStore();

  const [search, setSearch] = useState("");
  const [selectedDashboard, setSelectedDashboard] = useState<string>("");
  const [selectedEntity, setSelectedEntity] = useState<string>("");
  const [detailLog, setDetailLog] = useState<AuditLogEntry | null>(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchDash = !selectedDashboard || log.actorDashboard === selectedDashboard;
      const matchEntity = !selectedEntity || log.entityType === selectedEntity;
      const matchSearch =
        !search ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.entityId.toLowerCase().includes(search.toLowerCase()) ||
        log.actorScope.toLowerCase().includes(search.toLowerCase());
      return matchDash && matchEntity && matchSearch;
    });
  }, [auditLogs, selectedDashboard, selectedEntity, search]);

  const uniqueEntities = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.entityType))).filter(Boolean);
  }, [auditLogs]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["ID", "Waktu", "Pelaku", "Cakupan/Scope", "Dashboard", "Aksi", "Tipe Entitas", "ID Entitas", "IP Address"];
    const rows = filteredLogs.map((l) => [
      l.id,
      `"${l.createdAt}"`,
      `"${l.actor}"`,
      `"${l.actorScope}"`,
      `"${l.actorDashboard}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      l.entityType,
      l.entityId,
      l.ipAddress || "-",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `audit-log-integrated-blockchain-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout pageTitle="Audit Log (Immutable Trail)">
      {/* Top Filter and Toolbar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-2.5 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari aksi, pelaku, entitas, atau kata kunci..."
              className="focus-ring w-full rounded-sm border border-line bg-panel py-2 pl-9 pr-3 text-xs text-ink shadow-sm"
            />
          </div>

          <select
            value={selectedDashboard}
            onChange={(e) => setSelectedDashboard(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-2 text-xs text-ink shadow-sm"
          >
            <option value="">Semua Dashboard</option>
            <option value="Admin">Admin Console</option>
            <option value="Institusi Pendidikan">Institusi Pendidikan</option>
            <option value="Kementerian">Kementerian</option>
            <option value="Bank">Bank Himbara</option>
            <option value="Auditor">Auditor</option>
            <option value="Publik">Publik</option>
          </select>

          <select
            value={selectedEntity}
            onChange={(e) => setSelectedEntity(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-2 text-xs text-ink shadow-sm"
          >
            <option value="">Semua Tipe Entitas</option>
            {uniqueEntities.map((ent) => (
              <option key={ent} value={ent}>
                {ent}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleExportCsv}
          className="focus-ring inline-flex items-center gap-1.5 rounded-sm border border-line bg-panel px-3 py-2 text-xs font-semibold text-navy hover:bg-base shadow-sm transition-colors"
        >
          <Download size={14} /> Ekspor CSV ({filteredLogs.length})
        </button>
      </div>

      {/* Audit Log Table */}
      <Panel
        title={`Riwayat Log (${filteredLogs.length} Entri Tercatat)`}
        action={
          <span className="text-[11px] text-muted flex items-center gap-1">
            <Shield size={12} className="text-status-ok" /> Append-only & Immutable
          </span>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted">
                <th className="py-2.5">Waktu</th>
                <th className="py-2.5">Pelaku & Cakupan</th>
                <th className="py-2.5">Dashboard</th>
                <th className="py-2.5">Aksi</th>
                <th className="py-2.5">Entitas Terkait</th>
                <th className="py-2.5 text-right">Detail Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-base/40 transition-colors">
                  <td className="py-2.5 text-muted font-mono whitespace-nowrap">
                    {log.createdAt}
                  </td>
                  <td className="py-2.5">
                    <div className="font-semibold text-ink">{log.actor}</div>
                    <div className="text-[10px] text-muted font-mono">
                      scope: <span className="text-navy font-semibold">{log.actorScope}</span>
                    </div>
                  </td>
                  <td className="py-2.5">
                    <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-medium text-navy">
                      {log.actorDashboard}
                    </span>
                  </td>
                  <td className="py-2.5 font-medium text-ink max-w-xs">{log.action}</td>
                  <td className="py-2.5 text-muted font-mono text-[11px]">
                    <span className="font-medium text-ink">{log.entityType}</span> / {log.entityId}
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => setDetailLog(log)}
                      className="focus-ring inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 text-[11px] font-medium text-navy hover:bg-base transition-colors"
                    >
                      <Eye size={12} /> Periksa State
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted">
                    Tidak ada log audit yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Modal: State Diff Viewer */}
      <Modal
        isOpen={!!detailLog}
        onClose={() => setDetailLog(null)}
        title="Detail Audit Log & Rekaman State Diff"
        subtitle={`Log ID: ${detailLog?.id} · Waktu: ${detailLog?.createdAt}`}
        maxWidth="xl"
      >
        {detailLog && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded bg-base p-3 border border-line">
              <div>
                <span className="block text-[10px] font-semibold text-muted uppercase">Pelaku</span>
                <span className="font-bold text-ink">{detailLog.actor}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-muted uppercase">Cakupan (Scope)</span>
                <span className="font-bold text-navy font-mono">{detailLog.actorScope}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-muted uppercase">IP Address</span>
                <span className="font-mono text-muted">{detailLog.ipAddress || "192.168.1.10"}</span>
              </div>
              <div>
                <span className="block text-[10px] font-semibold text-muted uppercase">Dashboard</span>
                <span className="font-bold text-ink">{detailLog.actorDashboard}</span>
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold text-ink mb-1">Aksi yang Dijalankan:</span>
              <p className="rounded border border-line bg-panel p-2.5 text-xs text-ink font-medium">
                {detailLog.action}
              </p>
            </div>

            {/* Before vs After JSON comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-status-danger text-[11px] uppercase tracking-wide">
                    Before State (Sebelum)
                  </span>
                  <span className="text-[10px] text-muted">jsonb snapshot</span>
                </div>
                <pre className="h-44 overflow-auto rounded border border-line bg-navy-dark/95 p-3 font-mono text-[11px] text-gold-light/90">
                  {detailLog.beforeState
                    ? JSON.stringify(detailLog.beforeState, null, 2)
                    : "// Entitas baru (tidak ada state sebelum)"}
                </pre>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-status-ok text-[11px] uppercase tracking-wide">
                    After State (Sesudah)
                  </span>
                  <span className="text-[10px] text-muted">jsonb snapshot</span>
                </div>
                <pre className="h-44 overflow-auto rounded border border-line bg-navy-dark/95 p-3 font-mono text-[11px] text-status-ok/90">
                  {detailLog.afterState
                    ? JSON.stringify(detailLog.afterState, null, 2)
                    : "// Entitas dihapus"}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-line">
              <button
                onClick={() => setDetailLog(null)}
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
