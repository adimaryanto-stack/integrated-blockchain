'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import StatusBadge from '@/components/ui/StatusBadge';
import {
  tahunAnggaranData,
  updateTahunAnggaran,
  createTahunAnggaran,
  deleteTahunAnggaran
} from '@/lib/data';
import { fmtRupiah } from '@/lib/utils/formatters';
import { TahunAnggaran, BudgetStatus } from '@/types';
import { Plus, Eye, Power, Lock, Unlock, Trash2, Edit3, AlertTriangle, CheckCircle2, X } from 'lucide-react';

function formatThousandInput(val: string | number): string {
  if (val === null || val === undefined || val === '') return '';
  const clean = String(val).replace(/[^0-9]/g, '');
  if (!clean) return '';
  try {
    const b = BigInt(clean);
    return new Intl.NumberFormat('id-ID').format(b);
  } catch {
    return clean;
  }
}

function parseRawNumberStr(val: string): string {
  return String(val).replace(/[^0-9]/g, '');
}

function getTerbilangRupiah(valStr: string): string {
  const clean = parseRawNumberStr(valStr);
  if (!clean || clean === '0') return 'Rp 0 Rupiah';
  try {
    const b = BigInt(clean);
    const kuadriliun = b / 1_000_000_000_000_000n;
    const sisaKuadriliun = b % 1_000_000_000_000_000n;
    const triliun = sisaKuadriliun / 1_000_000_000_000n;
    const sisaTriliun = sisaKuadriliun % 1_000_000_000_000n;
    const miliar = sisaTriliun / 1_000_000_000n;
    const sisaMiliar = sisaTriliun % 1_000_000_000n;
    const juta = sisaMiliar / 1_000_000n;

    const parts: string[] = [];
    if (kuadriliun > 0n) parts.push(`${kuadriliun} Kuadriliun`);
    if (triliun > 0n) parts.push(`${triliun} Triliun`);
    if (miliar > 0n) parts.push(`${miliar} Miliar`);
    if (juta > 0n) parts.push(`${juta} Juta`);

    const formatted = new Intl.NumberFormat('id-ID').format(b);
    if (parts.length === 0) return `Rp ${formatted} Rupiah`;
    return `Rp ${formatted} (${parts.join(' ')} Rupiah)`;
  } catch {
    return '';
  }
}

export default function APBNPage() {
  const { activeTahun, setActiveTahun, currentUser, dataVersion } = useAppStore();
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [data, setData] = useState<TahunAnggaran[]>(tahunAnggaranData);

  // Synchronize local table data when cache version changes
  useEffect(() => {
    setData([...tahunAnggaranData]);
  }, [dataVersion]);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTahun, setNewTahun] = useState('');
  const [newTotalFormatted, setNewTotalFormatted] = useState('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<TahunAnggaran | null>(null);
  const [editTotalFormatted, setEditTotalFormatted] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActivate = async (id: string) => {
    const targetItem = data.find(t => t.id === id);
    if (!targetItem) return;
    if (!confirm(`Aktifkan tahun ${targetItem.tahun}? Tahun ACTIVE sebelumnya akan di-CLOSED (terkunci).`)) return;

    setActiveTahun(targetItem.tahun);

    // Optimistic UI update
    const updated = data.map(t => ({
      ...t,
      status: (t.id === id ? 'ACTIVE' : t.status === 'ACTIVE' ? 'CLOSED' : t.status) as BudgetStatus
    }));
    setData(updated);

    // Patch to DB
    const promises = data.map(t => {
      if (t.id === id) {
        return updateTahunAnggaran(t.id, { status: 'ACTIVE' });
      } else if (t.status === 'ACTIVE') {
        return updateTahunAnggaran(t.id, { status: 'CLOSED' });
      }
      return Promise.resolve(true);
    });
    await Promise.all(promises);
    useAppStore.getState().incrementVersion();
    setData([...tahunAnggaranData]);
  };

  const handleToggleLock = async (item: TahunAnggaran) => {
    const isCurrentlyClosed = item.status === 'CLOSED';
    const actionText = isCurrentlyClosed ? 'Buka Kunci (Unlock)' : 'Kunci (Lock)';
    const newStatus: BudgetStatus = isCurrentlyClosed ? 'DRAFT' : 'CLOSED';

    if (!confirm(`Apakah Anda yakin ingin melakukan ${actionText} pada APBN Tahun ${item.tahun}?`)) return;

    const updated = data.map(t => t.id === item.id ? { ...t, status: newStatus } : t);
    setData(updated);
    await updateTahunAnggaran(item.id, { status: newStatus });
    setData([...tahunAnggaranData]);
  };

  const handleDelete = async (id: string) => {
    const item = data.find(t => t.id === id);
    if (item?.status !== 'DRAFT') return;
    if (!confirm('Hapus tahun anggaran ini dari database?')) return;
    const updated = data.filter(t => t.id !== id);
    setData(updated);
    await deleteTahunAnggaran(id);
    setData([...tahunAnggaranData]);
  };

  const handleAddSubmit = async () => {
    const rawTotal = parseRawNumberStr(newTotalFormatted);
    if (!newTahun || !rawTotal) {
      alert('Mohon isi Tahun dan Total Anggaran!');
      return;
    }
    const exists = data.find(t => t.tahun === Number(newTahun));
    if (exists) {
      alert(`Tahun Anggaran ${newTahun} sudah ada di database!`);
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await createTahunAnggaran(Number(newTahun), Number(rawTotal));
      if (success) {
        setData([...tahunAnggaranData]);
        setShowAddModal(false);
        setNewTahun('');
        setNewTotalFormatted('');
      } else {
        alert('Gagal menambahkan tahun anggaran ke database.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (item: TahunAnggaran) => {
    if (!isSuperAdmin) {
      alert('Hanya Super Admin yang memiliki wewenang mengedit APBN!');
      return;
    }
    if (item.status === 'CLOSED') {
      alert(`APBN Tahun ${item.tahun} sedang TERKUNCI (CLOSED). Buka kunci (Unlock) terlebih dahulu untuk mengedit.`);
      return;
    }
    setEditingItem(item);
    setEditTotalFormatted(formatThousandInput(item.total_anggaran));
  };

  const handleEditSubmit = async () => {
    if (!editingItem) return;
    const rawTotalStr = parseRawNumberStr(editTotalFormatted);
    if (!rawTotalStr || rawTotalStr === '0') {
      alert('Total Anggaran tidak boleh kosong atau 0!');
      return;
    }

    setIsSubmitting(true);
    try {
      // Pass raw string number to updateTahunAnggaran so BigInt integer precision is preserved 100%
      const success = await updateTahunAnggaran(editingItem.id, { total_anggaran: rawTotalStr as unknown as number });
      if (success) {
        setData([...tahunAnggaranData]);
        setEditingItem(null);
      } else {
        alert('Gagal memperbarui APBN di database.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header title="APBN Pertahun" subtitle="Kelola tahun anggaran pendidikan APBN" />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar">
          <h3 className="text-sm font-semibold text-text-primary flex-1">
            Pengelolaan APBN Pendidikan Pertahun
          </h3>
          <span className="text-xs text-text-muted">{data.length} tahun terdaftar</span>
          {isSuperAdmin && (
            <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
              <Plus size={14} />
              Tambah Tahun APBN
            </button>
          )}
        </div>

        {/* Table */}
        <div className="sheet-container">
          <table className="w-full">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                <th className="sheet-header-cell text-center" style={{ width: 100 }}>Tahun</th>
                <th className="sheet-header-cell text-right">Total Anggaran (APBN Pendidikan)</th>
                <th className="sheet-header-cell text-center" style={{ width: 130 }}>Status</th>
                <th className="sheet-header-cell text-center" style={{ width: 220 }}>Aksi & Penguncian</th>
              </tr>
            </thead>
            <tbody>
              {data.sort((a, b) => a.tahun - b.tahun).map((row, idx) => {
                const isSelectedActive = row.tahun === activeTahun;
                const isLocked = row.status === 'CLOSED';
                return (
                  <tr key={row.id} className={`transition ${isSelectedActive ? 'bg-indigo-50/80 font-medium' : 'hover:bg-indigo-50/50'}`}>
                    <td className="sheet-cell text-center text-text-muted">{idx + 1}</td>
                    <td className="sheet-cell text-center font-semibold text-text-primary">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href="/dashboard"
                          onClick={() => setActiveTahun(row.tahun)}
                          className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer font-bold"
                        >
                          {row.tahun}
                        </Link>
                        {isSelectedActive && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                            (aktif)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="sheet-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`font-mono text-sm ${isLocked ? 'text-text-muted' : 'font-semibold text-text-primary'}`}>
                          {fmtRupiah(row.total_anggaran)}
                        </span>
                        {isSuperAdmin && !isLocked && (
                          <button
                            onClick={() => openEditModal(row)}
                            className="p-1 text-indigo-600 hover:bg-indigo-100 rounded transition"
                            title="Edit Anggaran via Modal Popup"
                          >
                            <Edit3 size={14} />
                          </button>
                        )}
                        {isLocked && (
                          <span className="text-xs text-amber-600 flex items-center gap-1 font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200" title="Anggaran Terkunci">
                            <Lock size={12} />
                            Terkunci
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="sheet-cell text-center">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="sheet-cell text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setActiveTahun(row.tahun)}
                          className="btn btn-ghost py-1 px-2 text-xs"
                          title="Lihat Dashboard Tahun Ini"
                        >
                          <Eye size={12} />
                        </Link>

                        {/* Lock / Unlock Toggle Button */}
                        {isSuperAdmin && (
                          <button
                            onClick={() => handleToggleLock(row)}
                            className={`btn py-1 px-2 text-xs ${isLocked ? 'btn-secondary text-emerald-700' : 'btn-warning'}`}
                            title={isLocked ? 'Buka Kunci Anggaran (Unlock)' : 'Kunci Anggaran (Lock - Read Only)'}
                          >
                            {isLocked ? <Unlock size={12} /> : <Lock size={12} />}
                          </button>
                        )}

                        {/* Activate Button */}
                        {isSuperAdmin && row.status === 'DRAFT' && (
                          <button onClick={() => handleActivate(row.id)} className="btn btn-success py-1 px-2 text-xs" title="Aktifkan Tahun APBN">
                            <Power size={12} />
                          </button>
                        )}

                        {/* Delete Button */}
                        {isSuperAdmin && row.status === 'DRAFT' && (
                          <button onClick={() => handleDelete(row.id)} className="btn btn-danger py-1 px-2 text-xs" title="Hapus APBN DRAFT">
                            <Trash2 size={12} />
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

        {/* Status Legend */}
        <div className="mt-4 flex items-center gap-6 text-xs text-text-muted flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> <strong>DRAFT</strong> — Baru, bisa diedit & dihapus
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> <strong>ACTIVE</strong> — Tahun berjalan aktif
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 🔒 <strong>CLOSED / TERKUNCI</strong> — Terkunci (Read-Only), dilindungi dari perubahan
          </div>
        </div>
      </div>

      {/* Edit APBN Modal Popup */}
      {editingItem && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setEditingItem(null)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Edit APBN Tahun {editingItem.tahun}</h3>
                  <p className="text-xs text-text-muted">Kelola total anggaran APBN pendidikan</p>
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                disabled={isSubmitting}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Auto Thousand Formatting Input */}
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Total Anggaran APBN (Rupiah)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-text-muted text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={editTotalFormatted}
                    onChange={(e) => {
                      const formatted = formatThousandInput(e.target.value);
                      setEditTotalFormatted(formatted);
                    }}
                    placeholder="722.600.000.000.000"
                    className="search-input w-full pl-10 pr-4 py-2 font-mono font-bold text-base text-indigo-900 border-indigo-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    disabled={isSubmitting}
                    autoFocus
                  />
                </div>
                {/* Format Terbilang Helper */}
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-indigo-950 font-medium">
                  <span className="text-text-muted block text-[11px]">Terbilang / Format Terbaca:</span>
                  <span className="font-semibold text-indigo-700">
                    {getTerbilangRupiah(editTotalFormatted)}
                  </span>
                </div>
              </div>

              {/* Warning Alert */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Pemberitahuan Sinkronisasi Database:</strong>
                  <p className="mt-0.5 text-amber-800 leading-relaxed">
                    Perubahan total APBN ini akan memicu <em>Top-Down BigInt Cascading</em> ke seluruh <strong>38 Provinsi</strong> dan <strong>514 Kabupaten/Kota</strong> di database PostgreSQL secara otomatis dengan presisi 100%.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end pt-3 border-t border-border">
                <button
                  onClick={() => setEditingItem(null)}
                  disabled={isSubmitting}
                  className="btn btn-ghost"
                >
                  Batal
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={isSubmitting}
                  className="btn btn-primary flex items-center gap-1.5 px-4"
                >
                  {isSubmitting ? (
                    <span>Menyimpan & Cascading...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={15} />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add APBN Modal Popup */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !isSubmitting && setShowAddModal(false)}>
          <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Plus size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text-primary">Tambah Tahun Anggaran APBN</h3>
                  <p className="text-xs text-text-muted">Tambahkan periode tahun anggaran baru</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Tahun Anggaran</label>
                <input
                  type="number"
                  value={newTahun}
                  onChange={(e) => setNewTahun(e.target.value)}
                  placeholder="2028"
                  className="search-input w-full pl-3 font-semibold"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Total Anggaran APBN (Rupiah)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-text-muted text-sm">
                    Rp
                  </span>
                  <input
                    type="text"
                    value={newTotalFormatted}
                    onChange={(e) => {
                      const formatted = formatThousandInput(e.target.value);
                      setNewTotalFormatted(formatted);
                    }}
                    placeholder="800.000.000.000.000"
                    className="search-input w-full pl-10 pr-4 py-2 font-mono font-bold text-base text-emerald-900 border-emerald-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                    disabled={isSubmitting}
                  />
                </div>
                {/* Terbilang helper */}
                <div className="mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-emerald-950 font-medium">
                  <span className="text-text-muted block text-[11px]">Terbilang / Format Terbaca:</span>
                  <span className="font-semibold text-emerald-700">
                    {getTerbilangRupiah(newTotalFormatted)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-border">
                <button
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="btn btn-ghost"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddSubmit}
                  disabled={isSubmitting}
                  className="btn btn-primary"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Tahun Baru'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
