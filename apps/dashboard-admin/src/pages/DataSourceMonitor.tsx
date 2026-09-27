import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Panel } from "@/components/ui/Panel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useAdminStore } from "@/store/adminStore";
import type { DataSourceStatus } from "@/types";
import {
  RefreshCw,
  Plus,
  Database,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Layers,
  ExternalLink,
  Info,
  Clock,
} from "lucide-react";

export function DataSourceMonitor() {
  const { dataSources, resyncDataSource, addDataSource, canAccess } = useAdminStore();

  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailModal, setDetailModal] = useState<DataSourceStatus | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "APBN" as "APBN" | "APBD" | "CSR",
    provinsi: "Nasional",
    endpointUrl: "",
    status: "sinkron" as "sinkron" | "tertunda" | "gagal",
    recordsCount: 1000,
  });

  const canEdit = canAccess("Data Source Monitor", "edit");
  const canCreate = canAccess("Data Source Monitor", "create");

  const filteredSources = useMemo(() => {
    return dataSources.filter((ds) => {
      const matchType = !typeFilter || ds.type === typeFilter;
      const matchStatus = !statusFilter || ds.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [dataSources, typeFilter, statusFilter]);

  const totalRecords = dataSources.reduce((acc, d) => acc + d.recordsCount, 0);
  const syncCount = dataSources.filter((d) => d.status === "sinkron").length;
  const delayedCount = dataSources.filter((d) => d.status === "tertunda").length;
  const failedCount = dataSources.filter((d) => d.status === "gagal").length;

  const handleResync = async (id: string) => {
    setSyncingId(id);
    await resyncDataSource(id);
    setSyncingId(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addDataSource({
      name: formData.name,
      type: formData.type,
      provinsi: formData.provinsi,
      endpointUrl: formData.endpointUrl || undefined,
      status: formData.status,
      recordsCount: Number(formData.recordsCount) || 0,
    });
    setIsAddModalOpen(false);
  };

  if (!canAccess("Data Source Monitor", "view")) {
    return (
      <DashboardLayout pageTitle="Data Source & Ingestion Monitor">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-warn/10 border border-status-warn/30">
            <Database size={32} className="text-status-warn" />
          </div>
          <h2 className="text-xl font-bold text-ink">Akses Tidak Diizinkan</h2>
          <p className="text-sm text-muted max-w-sm">
            <strong>Data Source Monitor</strong> hanya tersedia untuk Admin dengan cakupan wilayah atau kementerian ke atas.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout pageTitle="Data Source & Ingestion Monitor">
      {/* Top Stat Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Panel>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted">Total Pipeline</span>
            <Layers size={18} className="text-navy" />
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">{dataSources.length} Sumber</p>
          <p className="mt-1 text-[11px] text-muted">APBN, APBD & CSR Perusahaan</p>
        </Panel>

        <Panel accent="ok">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted">Sinkron Normal</span>
            <CheckCircle size={18} className="text-status-ok" />
          </div>
          <p className="mt-2 text-2xl font-bold text-status-ok">{syncCount}</p>
          <p className="mt-1 text-[11px] text-muted">Update otomatis berjalan lancar</p>
        </Panel>

        <Panel accent={delayedCount > 0 ? "warn" : "ok"}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted">Tertunda / Antrian</span>
            <AlertTriangle size={18} className="text-status-warn" />
          </div>
          <p className="mt-2 text-2xl font-bold text-status-warn">{delayedCount}</p>
          <p className="mt-1 text-[11px] text-muted">Menunggu retry gateway daerah</p>
        </Panel>

        <Panel accent={failedCount > 0 ? "danger" : "ok"}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-muted">Gagal Ingestion</span>
            <XCircle size={18} className="text-status-danger" />
          </div>
          <p className="mt-2 text-2xl font-bold text-status-danger">{failedCount}</p>
          <p className="mt-1 text-[11px] text-muted">Perlu tindakan verifikasi token</p>
        </Panel>
      </div>

      {/* Toolbar and Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm"
          >
            <option value="">Semua Tipe Anggaran</option>
            <option value="APBN">APBN</option>
            <option value="APBD">APBD</option>
            <option value="CSR">CSR Perusahaan</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="focus-ring rounded-sm border border-line bg-panel px-3 py-1.5 text-xs text-ink shadow-sm"
          >
            <option value="">Semua Status</option>
            <option value="sinkron">Sinkron</option>
            <option value="tertunda">Tertunda</option>
            <option value="gagal">Gagal</option>
          </select>

          {(typeFilter || statusFilter) && (
            <button
              onClick={() => {
                setTypeFilter("");
                setStatusFilter("");
              }}
              className="text-xs font-medium text-navy hover:underline"
            >
              Reset Filter
            </button>
          )}
        </div>

        {canCreate && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="focus-ring inline-flex items-center gap-1.5 rounded-sm bg-navy px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-navy-light shadow-sm transition-colors"
          >
            <Plus size={14} /> Tambah Pipeline Sumber Data
          </button>
        )}
      </div>

      {/* Table */}
      <Panel title={`Daftar Pipeline Data Ingestion (${filteredSources.length} Sumber)`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-line text-left text-[11px] font-semibold uppercase text-muted">
                <th className="py-2.5">Nama Sumber Data</th>
                <th className="py-2.5 text-center">Tipe</th>
                <th className="py-2.5">Cakupan Wilayah</th>
                <th className="py-2.5">Sinkron Terakhir</th>
                <th className="py-2.5 text-right">Volume Data</th>
                <th className="py-2.5 text-center">Status</th>
                <th className="py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredSources.map((d) => {
                const isSyncing = syncingId === d.id;
                return (
                  <tr key={d.id} className="hover:bg-base/40 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-ink">{d.name}</div>
                      {d.errorMessage && (
                        <div className="text-[10px] text-status-danger font-mono mt-0.5">
                          Error: {d.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <span className="rounded bg-navy/10 px-2 py-0.5 text-[10px] font-bold text-navy">
                        {d.type}
                      </span>
                    </td>
                    <td className="py-3 text-muted">{d.provinsi}</td>
                    <td className="py-3 text-muted font-mono">{d.lastSyncAt}</td>
                    <td className="py-3 text-right font-mono font-semibold text-ink">
                      {d.recordsCount.toLocaleString("id-ID")} baris
                    </td>
                    <td className="py-3 text-center">
                      <StatusBadge value={d.status} />
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailModal(d)}
                          className="focus-ring rounded border border-line bg-panel px-2.5 py-1 text-[11px] font-medium text-muted hover:text-ink hover:bg-base transition-colors"
                          title="Lihat Detail Pipeline"
                        >
                          <Info size={12} className="inline mr-1" />
                          Info
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => handleResync(d.id)}
                            disabled={isSyncing}
                            className={`focus-ring inline-flex items-center gap-1 rounded border border-line bg-panel px-2.5 py-1 text-[11px] font-semibold text-navy hover:bg-base transition-colors ${
                              isSyncing ? "opacity-60 cursor-not-allowed" : ""
                            }`}
                          >
                            <RefreshCw size={12} className={isSyncing ? "animate-spin text-gold" : ""} />
                            {isSyncing ? "Menyinkronkan..." : "Resync Manual"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Modal: Tambah Sumber Data */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Daftarkan Pipeline Sumber Data Baru"
        subtitle="Mendukung integrasi APBN Kemenkeu, APBD BPKAD, dan CSR BUMN/Swasta"
      >
        <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 block font-semibold text-ink">Nama Pipeline / Sumber Data</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: APBD Pemkot Bandar Lampung TA 2026"
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-semibold text-ink">Tipe Anggaran</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              >
                <option value="APBN">APBN (Pemerintah Pusat)</option>
                <option value="APBD">APBD (Pemerintah Daerah)</option>
                <option value="CSR">CSR Perusahaan / Hibah</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-semibold text-ink">Wilayah</label>
              <input
                type="text"
                required
                value={formData.provinsi}
                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                placeholder="Nasional, Lampung, Jawa Barat, dsb."
                className="focus-ring w-full rounded border border-line p-2 text-ink"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">Endpoint Ingestion / Webhook URL</label>
            <input
              type="url"
              value={formData.endpointUrl}
              onChange={(e) => setFormData({ ...formData, endpointUrl: e.target.value })}
              placeholder="https://api.daerah.go.id/v1/anggaran"
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold text-ink">Estimasi Jumlah Baris Data Awal</label>
            <input
              type="number"
              value={formData.recordsCount}
              onChange={(e) => setFormData({ ...formData, recordsCount: Number(e.target.value) })}
              className="focus-ring w-full rounded border border-line p-2 text-ink"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-line">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded border border-line px-3 py-1.5 font-medium text-muted hover:bg-base"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded bg-navy px-4 py-1.5 font-semibold text-white hover:bg-navy-light"
            >
              Simpan Pipeline
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detail Pipeline */}
      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="Rincian Pipeline Data Ingestion"
        subtitle={`ID: ${detailModal?.id}`}
      >
        {detailModal && (
          <div className="space-y-4 text-xs">
            <div className="rounded border border-line bg-base p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Nama:</span>
                <span className="font-bold text-ink">{detailModal.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Tipe Anggaran:</span>
                <span className="font-bold text-navy">{detailModal.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Wilayah:</span>
                <span className="text-ink">{detailModal.provinsi}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Total Data Terverifikasi:</span>
                <span className="font-mono font-bold text-ink">
                  {detailModal.recordsCount.toLocaleString("id-ID")} records
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Sinkron Terakhir:</span>
                <span className="font-mono text-muted">{detailModal.lastSyncAt}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-muted">Status:</span>
                <StatusBadge value={detailModal.status} />
              </div>
            </div>

            {detailModal.endpointUrl && (
              <div>
                <span className="block font-semibold text-ink mb-1">Target Endpoint API:</span>
                <code className="block rounded bg-panel border border-line p-2 text-[11px] font-mono text-navy break-all">
                  {detailModal.endpointUrl}
                </code>
              </div>
            )}

            {detailModal.errorMessage && (
              <div className="rounded border border-status-danger/30 bg-status-danger/10 p-3">
                <span className="block font-semibold text-status-danger mb-0.5">Diagnosa Masalah:</span>
                <p className="text-status-danger">{detailModal.errorMessage}</p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-line">
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
