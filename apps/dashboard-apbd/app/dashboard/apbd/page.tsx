'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import PctBadge from '@/components/ui/PctBadge';
import ApbdInputModal from '@/components/ui/ApbdInputModal';
import { useAppStore } from '@/lib/store';
import { fmtTriliun, formatRupiah } from '@/lib/utils/formatters';
import { getAllApbdProvinsi, deleteApbdProvinsi, ApbdProvinsi } from '@/lib/data/apbd-service';
import {
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Lock,
  X,
} from 'lucide-react';

export default function ApbdPertahunPage() {
  const { activeTahun, setActiveTahun, refreshKey, triggerRefresh } = useAppStore();
  const [apbdList, setApbdList] = useState<ApbdProvinsi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editYear, setEditYear] = useState<number>(new Date().getFullYear() + 1);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<ApbdProvinsi | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAllApbdProvinsi();
      setApbdList(data);
      // Auto-suggest tahun baru = tahun terbesar yang sudah ada + 1
      if (data.length > 0) {
        const maxTahun = Math.max(...data.map(d => d.tahun));
        setEditYear(maxTahun + 1);
      }
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const handleOpenEdit = (tahun: number) => {
    setEditYear(tahun);
    setModalOpen(true);
  };

  const handleDeleteClick = (item: ApbdProvinsi) => {
    setDeleteTarget(item);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteApbdProvinsi(deleteTarget.tahun);
    setDeleting(false);
    if (result.ok) {
      setDeleteTarget(null);
      // Jika tahun yang dihapus adalah tahun aktif, reset ke tahun sebelumnya
      if (deleteTarget.tahun === activeTahun) {
        const remaining = apbdList.filter(a => a.tahun !== deleteTarget.tahun);
        if (remaining.length > 0) {
          setActiveTahun(Math.max(...remaining.map(a => a.tahun)));
        }
      }
      triggerRefresh();
    } else {
      setDeleteError(result.message);
    }
  };

  const selectedYearData = apbdList.find((a) => a.tahun === editYear);

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="APBD Pertahun"
        subtitle="Pengelolaan dan Penetapan Anggaran APBD Provinsi Lampung Antar Tahun"
      />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary">Daftar Tahun Anggaran APBD Lampung</h3>
            <p className="text-xs text-text-muted">
              Monitoring historis kepatuhan batas 20% pendidikan dan status penguncian anggaran.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-xs font-semibold text-text-secondary">Tahun:</label>
              <input
                type="number"
                min={2020}
                max={2035}
                value={editYear}
                onChange={(e) => setEditYear(Number(e.target.value))}
                className="w-24 px-2 py-1.5 text-sm font-mono border border-border rounded-lg focus:outline-none focus:border-accent bg-white"
              />
            </div>
            <button
              onClick={() => handleOpenEdit(editYear)}
              className="btn btn-primary text-xs"
            >
              <Plus size={14} />
              <span>Tambah / Edit Tahun Anggaran</span>
            </button>
          </div>
        </div>

        {/* Table List of Years */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 90 }}>Tahun</th>
                  <th className="sheet-header-cell text-left">Status</th>
                  <th className="sheet-header-cell text-right">Total APBD</th>
                  <th className="sheet-header-cell text-right">Batas 20% (Wajib)</th>
                  <th className="sheet-header-cell text-right">Alokasi Riil</th>
                  <th className="sheet-header-cell text-right">Realisasi</th>
                  <th className="sheet-header-cell text-center">% Pendidikan</th>
                  <th className="sheet-header-cell text-center">Kepatuhan</th>
                  <th className="sheet-header-cell text-center" style={{ width: 140 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {apbdList.map((item) => {
                  const pct = item.total_apbd > 0 ? (item.alokasi_pendidikan_riil / item.total_apbd) * 100 : 0;
                  const isMemenuhi = item.status_kepatuhan === 'MEMENUHI';
                  const isActive = item.tahun === activeTahun;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-indigo-50/40 transition ${isActive ? 'bg-indigo-50/60 font-medium' : ''}`}
                    >
                      <td className="sheet-cell text-center font-mono font-bold">
                        <div className="flex items-center justify-center gap-1">
                          {item.tahun}
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Tahun Aktif Global" />
                          )}
                        </div>
                      </td>
                      <td className="sheet-cell text-left">
                        <span
                          className={`badge ${
                            item.status_anggaran === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.status_anggaran === 'ACTIVE' ? 'ACTIVE (Aktif)' : 'CLOSED (Arsip)'}
                        </span>
                      </td>
                      <td className="sheet-cell text-right font-mono">{fmtTriliun(item.total_apbd)}</td>
                      <td className="sheet-cell text-right font-mono text-text-secondary">{fmtTriliun(item.batas_minimal_pendidikan)}</td>
                      <td className="sheet-cell text-right font-mono font-bold text-indigo-900">{fmtTriliun(item.alokasi_pendidikan_riil)}</td>
                      <td className="sheet-cell text-right font-mono text-emerald-700">{fmtTriliun(item.realisasi_pendidikan_total)}</td>
                      <td className="sheet-cell text-center">
                        <PctBadge value={pct} />
                      </td>
                      <td className="sheet-cell text-center">
                        <span
                          className={`badge ${
                            isMemenuhi
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isMemenuhi ? (
                            <>
                              <CheckCircle2 size={11} className="text-emerald-600" /> Memenuhi
                            </>
                          ) : (
                            <>
                              <AlertCircle size={11} className="text-rose-600" /> Belum Memenuhi
                            </>
                          )}
                        </span>
                      </td>
                      <td className="sheet-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setActiveTahun(item.tahun);
                              triggerRefresh();
                            }}
                            className={`btn text-[11px] py-1 px-2 ${isActive ? 'btn-ghost opacity-60' : 'btn-ghost'}`}
                            disabled={isActive}
                          >
                            Pilih
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item.tahun)}
                            className="btn btn-ghost text-[11px] py-1 px-2 text-indigo-600"
                            title="Edit Data Anggaran"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="btn btn-ghost text-[11px] py-1 px-2 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                            title="Hapus Data Anggaran"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Input Modal */}
      <ApbdInputModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTotalApbd={selectedYearData?.total_apbd || 8240000000000}
        initialAlokasiRiil={selectedYearData?.alokasi_pendidikan_riil || 1750000000000}
        initialRealisasi={selectedYearData?.realisasi_pendidikan_total || 1420000000000}
        tahun={editYear}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in-up max-w-sm">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                  <Trash2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Hapus Data APBD</h3>
                  <p className="text-xs text-text-muted">Tahun Anggaran {deleteTarget.tahun}</p>
                </div>
              </div>
              <button
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                className="p-1 rounded-lg hover:bg-slate-100 text-text-muted hover:text-text-primary transition"
                disabled={deleting}
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning */}
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 space-y-1">
                <p className="font-semibold">Tindakan ini tidak dapat dibatalkan!</p>
                <p>Semua data APBD Tahun <strong>{deleteTarget.tahun}</strong> akan dihapus permanen, termasuk:</p>
                <ul className="list-disc list-inside space-y-0.5 mt-1 text-amber-700">
                  <li>Data anggaran provinsi (Total: {fmtTriliun(deleteTarget.total_apbd)})</li>
                  <li>Breakdown alokasi kabupaten/kota</li>
                  <li>Riwayat audit log input</li>
                </ul>
                {deleteTarget.tahun === activeTahun && (
                  <p className="mt-2 font-semibold text-rose-700">
                    ⚠ Ini adalah tahun anggaran yang sedang aktif!
                  </p>
                )}
              </div>
            </div>

            {/* Error */}
            {deleteError && (
              <div className="mt-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={14} />
                <span>{deleteError}</span>
              </div>
            )}

            {/* Confirm input */}
            <p className="mt-4 text-xs text-text-secondary">
              Ketik <strong className="font-mono text-rose-600">{deleteTarget.tahun}</strong> untuk konfirmasi:
            </p>
            <ConfirmInput
              expected={String(deleteTarget.tahun)}
              onConfirm={handleDeleteConfirm}
              onCancel={() => { setDeleteTarget(null); setDeleteError(null); }}
              deleting={deleting}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inline confirm input component ──────────────────────────────────────────
function ConfirmInput({
  expected,
  onConfirm,
  onCancel,
  deleting,
}: {
  expected: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  const [value, setValue] = useState('');
  const isMatch = value.trim() === expected;

  return (
    <div className="mt-2 space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={`Ketik ${expected}`}
        className="w-full px-3 py-2 text-sm font-mono border border-border rounded-lg focus:outline-none focus:border-rose-400 bg-white"
        disabled={deleting}
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter' && isMatch) onConfirm(); }}
      />
      <div className="pt-1 border-t border-border flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost text-xs"
          disabled={deleting}
        >
          Batal
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!isMatch || deleting}
          className="btn text-xs bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Trash2 size={13} />
          <span>{deleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
        </button>
      </div>
    </div>
  );
}
