'use client';

import { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { fmtTriliun, fmtMiliar, formatRupiah, fmtPct } from '@/lib/utils/formatters';
import {
  getBreakdownKabKota,
  updateBreakdownKabKota,
  ApbdBreakdownKabKota,
} from '@/lib/data/apbd-service';
import {
  Building2,
  Download,
  Search,
  Save,
  Check,
  TrendingUp,
  Wallet,
  PieChart,
  Edit2,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export default function KabupatenKotaPage() {
  const { activeTahun, refreshKey, triggerRefresh } = useAppStore();
  const [data, setData] = useState<ApbdBreakdownKabKota[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal_alokasi' | 'realisasi_total' } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getBreakdownKabKota(activeTahun);
      setData(res);
      setLoading(false);
    }
    load();
  }, [activeTahun, refreshKey]);

  // Filtered rows
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const s = search.toLowerCase();
    return data.filter((item) => item.nama_kabupaten_kota.toLowerCase().includes(s));
  }, [data, search]);

  // Totals
  const totalNominal = useMemo(() => data.reduce((acc, curr) => acc + curr.nominal_alokasi, 0), [data]);
  const totalRealisasi = useMemo(() => data.reduce((acc, curr) => acc + curr.realisasi_total, 0), [data]);
  const totalSelisih = totalNominal - totalRealisasi;
  const avgPct = totalNominal > 0 ? (totalRealisasi / totalNominal) * 100 : 0;

  // Handle start editing
  const handleStartEdit = (id: string, field: 'nominal_alokasi' | 'realisasi_total', currentValue: number) => {
    setEditingCell({ id, field });
    setEditValue(String(currentValue));
  };

  // Handle save edit
  const handleSaveEdit = async (row: ApbdBreakdownKabKota) => {
    if (!editingCell) return;
    const num = parseFloat(editValue.replace(/[^0-9.-]/g, '')) || 0;
    
    const updatedNominal = editingCell.field === 'nominal_alokasi' ? num : row.nominal_alokasi;
    const updatedRealisasi = editingCell.field === 'realisasi_total' ? num : row.realisasi_total;

    setSavingId(row.id);
    
    // Update state locally for fast UI response
    setData((prev) =>
      prev.map((item) => {
        if (item.id === row.id) {
          const sel = updatedNominal - updatedRealisasi;
          const pct = updatedNominal > 0 ? (updatedRealisasi / updatedNominal) * 100 : 0;
          return {
            ...item,
            nominal_alokasi: updatedNominal,
            realisasi_total: updatedRealisasi,
            selisih: sel,
            persentase: pct,
          };
        }
        return item;
      })
    );

    // Save to PostgreSQL via Supabase
    await updateBreakdownKabKota(
      row.id,
      row.apbd_provinsi_id,
      row.kabupaten_kota_id,
      activeTahun,
      updatedNominal,
      updatedRealisasi,
      row.nama_kabupaten_kota
    );

    setSavingId(null);
    setEditingCell(null);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`APBD Lampung ${activeTahun}`);

    worksheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'Nama Kabupaten / Kota', key: 'nama', width: 30 },
      { header: 'Tipe', key: 'tipe', width: 15 },
      { header: 'Nominal Alokasi (Rp)', key: 'nominal', width: 25 },
      { header: 'Realisasi Serapan (Rp)', key: 'realisasi', width: 25 },
      { header: 'Selisih (Rp)', key: 'selisih', width: 25 },
      { header: '% Penyerapan', key: 'persentase', width: 18 },
    ];

    data.forEach((item, idx) => {
      worksheet.addRow({
        no: idx + 1,
        nama: item.nama_kabupaten_kota,
        tipe: item.tipe,
        nominal: item.nominal_alokasi,
        realisasi: item.realisasi_total,
        selisih: item.selisih,
        persentase: `${item.persentase.toFixed(2)}%`,
      });
    });

    // Styling Header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Breakdown_APBD_Pendidikan_Lampung_${activeTahun}.xlsx`);
  };

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Kabupaten / Kota Lampung"
        subtitle={`Spreadsheet Breakdown Alokasi Anggaran Pendidikan 15 Kab/Kota Tahun ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Alokasi 15 Kab/Kota"
            value={fmtTriliun(totalNominal)}
            subtitle="Pecahan Alokasi Provinsi"
            icon={<Wallet size={20} className="text-indigo-600" />}
            accent="indigo"
          />

          <MetricCard
            title="Total Realisasi Terkini"
            value={fmtTriliun(totalRealisasi)}
            subtitle="Serapan anggaran gabungan"
            icon={<TrendingUp size={20} className="text-emerald-600" />}
            accent="emerald"
          />

          <MetricCard
            title="Sisa Anggaran (Selisih)"
            value={fmtTriliun(totalSelisih)}
            subtitle="Belum terserap"
            icon={<PieChart size={20} className="text-rose-600" />}
            accent="rose"
          />

          <MetricCard
            title="Rata-Rata Serapan"
            value={fmtPct(avgPct)}
            subtitle="Target minimal 80%"
            icon={<Building2 size={20} className="text-amber-600" />}
            accent="amber"
          />
        </div>

        {/* Spreadsheet Container */}
        <div className="glass-card overflow-hidden">
          {/* Toolbar */}
          <div className="sheet-toolbar justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari Kab/Kota di Lampung..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              <span className="text-xs text-text-muted font-medium">
                Menampilkan {filteredData.length} dari 15 Wilayah
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="btn btn-ghost text-xs border-indigo-200 text-indigo-700 bg-white"
              >
                <Download size={14} />
                <span>Export Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="sheet-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                  <th className="sheet-header-cell text-left">Kabupaten / Kota</th>
                  <th className="sheet-header-cell text-center">Tipe</th>
                  <th className="sheet-header-cell text-right">Nominal Alokasi (Klik Edit)</th>
                  <th className="sheet-header-cell text-right">Realisasi (Klik Edit)</th>
                  <th className="sheet-header-cell text-right">Selisih</th>
                  <th className="sheet-header-cell text-center">% Penyerapan</th>
                  <th className="sheet-header-cell" style={{ width: 160 }}>Progress Serapan</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => {
                  const isEditingNominal =
                    editingCell?.id === row.id && editingCell?.field === 'nominal_alokasi';
                  const isEditingRealisasi =
                    editingCell?.id === row.id && editingCell?.field === 'realisasi_total';
                  const isSavingThis = savingId === row.id;
                  const barColor =
                    row.persentase >= 80 ? '#10b981' : row.persentase >= 50 ? '#f59e0b' : '#ef4444';

                  return (
                    <tr key={row.id} className="hover:bg-indigo-50/40 transition">
                      <td className="sheet-cell text-center font-mono text-text-muted">{idx + 1}</td>
                      <td className="sheet-cell text-left font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          <Building2 size={15} className="text-indigo-600 shrink-0" />
                          <span>{row.nama_kabupaten_kota}</span>
                        </div>
                      </td>
                      <td className="sheet-cell text-center font-mono text-[11px] text-text-secondary">
                        {row.tipe}
                      </td>

                      {/* Editable Nominal Cell */}
                      <td
                        className={`sheet-cell sheet-cell-editable text-right ${
                          isEditingNominal ? 'sheet-cell-editing' : ''
                        }`}
                        onClick={() => {
                          if (!isEditingNominal) {
                            handleStartEdit(row.id, 'nominal_alokasi', row.nominal_alokasi);
                          }
                        }}
                      >
                        {isEditingNominal ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(row);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              autoFocus
                              className="w-36 py-0.5 px-1.5 text-right text-xs font-mono bg-white border border-accent rounded focus:outline-none"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(row);
                              }}
                              className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono font-medium">{formatRupiah(row.nominal_alokasi)}</span>
                        )}
                      </td>

                      {/* Editable Realisasi Cell */}
                      <td
                        className={`sheet-cell sheet-cell-editable text-right ${
                          isEditingRealisasi ? 'sheet-cell-editing' : ''
                        }`}
                        onClick={() => {
                          if (!isEditingRealisasi) {
                            handleStartEdit(row.id, 'realisasi_total', row.realisasi_total);
                          }
                        }}
                      >
                        {isEditingRealisasi ? (
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveEdit(row);
                                if (e.key === 'Escape') setEditingCell(null);
                              }}
                              autoFocus
                              className="w-36 py-0.5 px-1.5 text-right text-xs font-mono bg-white border border-accent rounded focus:outline-none"
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit(row);
                              }}
                              className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            >
                              <Check size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono font-medium text-emerald-700">
                            {formatRupiah(row.realisasi_total)}
                          </span>
                        )}
                      </td>

                      {/* Selisih */}
                      <td className="sheet-cell text-right font-mono text-rose-600">
                        {formatRupiah(row.selisih)}
                      </td>

                      {/* % Penyerapan */}
                      <td className="sheet-cell text-center">
                        <PctBadge value={row.persentase} />
                      </td>

                      {/* Progress Bar */}
                      <td className="sheet-cell">
                        <div className="progress-bar-track">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(row.persentase, 100)}%`,
                              background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sheet-footer-cell text-center font-bold" colSpan={3}>
                    TOTAL ({data.length} KABUPATEN / KOTA)
                  </td>
                  <td className="sheet-footer-cell text-right font-mono font-bold">
                    {formatRupiah(totalNominal)}
                  </td>
                  <td className="sheet-footer-cell text-right font-mono font-bold text-emerald-700">
                    {formatRupiah(totalRealisasi)}
                  </td>
                  <td className="sheet-footer-cell text-right font-mono font-bold text-rose-600">
                    {formatRupiah(totalSelisih)}
                  </td>
                  <td className="sheet-footer-cell text-center">
                    <PctBadge value={avgPct} size="md" />
                  </td>
                  <td className="sheet-footer-cell">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(avgPct, 100)}%`,
                          background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
