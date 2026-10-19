'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { alokasiProvinsiData, alokasiKabupatenKotaData, getKabkotaByProvinsi, tahunAnggaranData, masterProvinsiData } from '@/lib/data';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { exportToExcel, getPctColorHex } from '@/lib/utils/excelExport';
import { AlokasiKabupatenKota, AlokasiProvinsi } from '@/types';
import { Search, Download, Plus, Sparkles, RefreshCw } from 'lucide-react';


export default function KabupatenKotaPage() {
  // dataVersion & activeTahun subscribed here
  const { activeTahun, currentUser, dataVersion } = useAppStore();

  const activeTahunObj = useMemo(() => {
    return tahunAnggaranData.find(t => Number(t.tahun) === Number(activeTahun));
  }, [activeTahun, dataVersion]);

  const sortedProvinsiData = useMemo(() => {
    const yearAllocations = activeTahunObj 
      ? alokasiProvinsiData.filter(p => String(p.tahun_anggaran_id) === String(activeTahunObj.id))
      : [];
    if (yearAllocations.length > 0) {
      return [...yearAllocations].sort((a, b) =>
        (a.provinsi?.nama_provinsi || '').localeCompare(b.provinsi?.nama_provinsi || '', 'id')
      );
    }
    const masterList = masterProvinsiData.length > 0
      ? masterProvinsiData
      : Array.from(new Map(alokasiProvinsiData.map(p => [p.provinsi_id, p.provinsi])).values()).filter(Boolean);

    return masterList.map(prov => ({
      id: `prov-draft-${prov.id}-${activeTahunObj?.id || ''}`,
      tahun_anggaran_id: activeTahunObj?.id || '',
      provinsi_id: prov.id,
      provinsi: prov,
      nominal_alokasi: 0,
      realisasi_total: 0,
      selisih: 0,
      persentase_penyerapan: 0,
      updated_at: new Date().toISOString().split('T')[0],
    } as AlokasiProvinsi)).sort((a, b) => (a.provinsi?.nama_provinsi || '').localeCompare(b.provinsi?.nama_provinsi || '', 'id'));
  }, [activeTahunObj, dataVersion]);

  const [selectedProvinsi, setSelectedProvinsi] = useState(() => sortedProvinsiData[0]?.provinsi_id || 'p-1');
  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal' | 'realisasi' } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Keep selectedProvinsi aligned if active province list changes
  useEffect(() => {
    if (sortedProvinsiData.length > 0 && !sortedProvinsiData.some(p => p.provinsi_id === selectedProvinsi)) {
      setSelectedProvinsi(sortedProvinsiData[0].provinsi_id);
    }
  }, [sortedProvinsiData, selectedProvinsi]);

  const selectedProvAlloc = useMemo(() => {
    return sortedProvinsiData.find(p => p.provinsi_id === selectedProvinsi) ||
      alokasiProvinsiData.find(p => p.provinsi_id === selectedProvinsi && (!activeTahunObj || String(p.tahun_anggaran_id) === String(activeTahunObj.id)));
  }, [sortedProvinsiData, selectedProvinsi, activeTahunObj, dataVersion]);

  const rawData = useMemo(() => {
    return getKabkotaByProvinsi(selectedProvinsi, activeTahunObj?.id);
  }, [selectedProvinsi, activeTahunObj, dataVersion]);

  const [localData, setLocalData] = useState<AlokasiKabupatenKota[]>(rawData);
  const [isDistributing, setIsDistributing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDistributeProvinsi = async () => {
    if (!activeTahunObj || !selectedProvinsi) return;
    setIsDistributing(true);
    setStatusMsg(null);
    try {
      const { distributeProvinsiToKabkota } = await import('@/lib/data');
      const ok = await distributeProvinsiToKabkota(selectedProvinsi, activeTahunObj.id);
      if (ok) {
        setStatusMsg({
          type: 'success',
          text: `Top-Down BigInt Cascading untuk ${selectedProvName} berhasil dibagikan ke seluruh kabupaten/kota dengan presisi 100%!`
        });
      } else {
        setStatusMsg({ type: 'error', text: 'Gagal mendistribusikan alokasi provinsi ke kabupaten/kota.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Terjadi kesalahan sistem saat membagi alokasi.' });
    } finally {
      setIsDistributing(false);
    }
  };

  const handleTopDownNational = async () => {
    if (!activeTahunObj) return;
    setIsDistributing(true);
    setStatusMsg(null);
    try {
      const { triggerTopDownCascade } = await import('@/lib/data');
      const ok = await triggerTopDownCascade(activeTahunObj.id);
      if (ok) {
        setStatusMsg({
          type: 'success',
          text: `Top-Down BigInt Cascading Nasional berhasil dieksekusi ke seluruh 38 Provinsi dan 514 Kabupaten/Kota tanpa selisih 1 Rupiah!`
        });
      } else {
        setStatusMsg({ type: 'error', text: 'Gagal memproses cascading nasional.' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Terjadi kesalahan sistem saat cascading nasional.' });
    } finally {
      setIsDistributing(false);
    }
  };

  const handleRefresh = async () => {
    setIsDistributing(true);
    try {
      const { initDbConnection } = await import('@/lib/data');
      await initDbConnection(true);
    } finally {
      setIsDistributing(false);
    }
  };

  useEffect(() => {
    setLocalData(rawData);

    // Auto-distribusi jika kab/kota untuk provinsi ini belum dibagi di DB
    if (activeTahunObj && selectedProvAlloc && Number(selectedProvAlloc.nominal_alokasi) > 0) {
      const yearKabAllocations = alokasiKabupatenKotaData.filter(
        (k: any) => k.alokasi_provinsi_id === selectedProvAlloc.id ||
             (k.kabupaten_kota?.provinsi_id === selectedProvinsi && String(k.id).includes(String(activeTahunObj.id)))
      );
      const hasAlloc = yearKabAllocations.length > 0 && yearKabAllocations.some((k: any) => Number(k.nominal_alokasi) > 0);
      if (!hasAlloc && rawData.length > 0) {
        import('@/lib/data').then(({ distributeProvinsiToKabkota }) => {
          distributeProvinsiToKabkota(selectedProvinsi, activeTahunObj.id);
        });
      }
    }
  }, [rawData, selectedProvinsi, activeTahunObj, selectedProvAlloc]);

  const filtered = useMemo(() => {
    let list = localData;
    if (search) {
      list = list.filter(k => (k.kabupaten_kota?.nama_kabupaten_kota || '').toLowerCase().includes(search.toLowerCase()));
    }
    return [...list].sort((a, b) =>
      (a.kabupaten_kota?.nama_kabupaten_kota || '').localeCompare(b.kabupaten_kota?.nama_kabupaten_kota || '', 'id')
    );
  }, [localData, search]);

  const totals = useMemo(() => {
    const toBigInt = (val: unknown): bigint => {
      if (val === null || val === undefined) return 0n;
      const s = String(val).split('.')[0].replace(/[^0-9-]/g, '');
      if (!s || s === '-') return 0n;
      try { return BigInt(s); } catch { return 0n; }
    };
    const nomBig = filtered.reduce((s, k) => s + toBigInt(k.nominal_alokasi), 0n);
    const realBig = filtered.reduce((s, k) => s + toBigInt(k.realisasi_total), 0n);
    const selisihBig = nomBig - realBig;
    const pct = nomBig > 0n ? Number((realBig * 1000n) / nomBig) / 10 : 0;
    return {
      nominal: nomBig.toString(),
      realisasi: realBig.toString(),
      selisih: selisihBig.toString(),
      pct,
    };
  }, [filtered]);

  const canEdit = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'ADMIN_PROVINSI' || currentUser.role === 'ADMIN_KABKOTA';

  const startEdit = (id: string, field: 'nominal' | 'realisasi', value: number) => {
    if (!canEdit) return;
    setEditingCell({ id, field });
    setEditValue(String(value));
  };

  const commitEdit = () => {
    if (!editingCell) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setLocalData(prev => prev.map(k => {
        if (k.id !== editingCell.id) return k;
        const nominal = editingCell.field === 'nominal' ? parsed : k.nominal_alokasi;
        const realisasi = editingCell.field === 'realisasi' ? parsed : k.realisasi_total;
        return {
          ...k,
          nominal_alokasi: nominal,
          realisasi_total: realisasi,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0,
        };
      }));
      import('@/lib/data').then(({ updateAlokasiKabupatenKota }) => {
        updateAlokasiKabupatenKota(editingCell.id, editingCell.field === 'nominal' ? 'nominal_alokasi' : 'realisasi_total', parsed);
      });
    }
    setEditingCell(null);
  };

  const handleExport = async () => {
    const headers = [
      'No', 'Kabupaten / Kota', 'Provinsi', 'Nominal (Rp)', 'Realisasi (Rp)', 'Selisih (Rp)', 'Persentase Penyerapan (%)'
    ];

    const rows = filtered.map((row, idx) => {
      const rowNum = idx + 2; // header is row 1
      const colorHex = getPctColorHex(row.persentase_penyerapan);
      return [
        { value: idx + 1, align: 'center' },
        { value: row.kabupaten_kota.nama_kabupaten_kota },
        { value: row.provinsi_nama },
        { value: row.nominal_alokasi, isCurrency: true },
        { value: row.realisasi_total, isCurrency: true },
        { value: { formula: `D${rowNum}-E${rowNum}` }, isCurrency: true, textColor: '991B1B' },
        { 
          value: { formula: `IF(D${rowNum}>0, E${rowNum}/D${rowNum}, 0)` }, 
          isPercent: true, 
          bgColor: colorHex.bg, 
          textColor: colorHex.text,
          bold: true,
          align: 'center'
        }
      ];
    });

    const totalRowIndex = filtered.length + 2;
    const totalColorHex = getPctColorHex(totals.pct);
    const totalsRow = [
      { value: '', bold: true },
      { value: `TOTAL (${filtered.length})`, bold: true },
      { value: '', bold: true },
      { value: { formula: `SUM(D2:D${totalRowIndex-1})` }, isCurrency: true, bold: true },
      { value: { formula: `SUM(E2:E${totalRowIndex-1})` }, isCurrency: true, bold: true },
      { value: { formula: `D${totalRowIndex}-E${totalRowIndex}` }, isCurrency: true, bold: true, textColor: '991B1B' },
      { 
        value: { formula: `IF(D${totalRowIndex}>0, E${totalRowIndex}/D${totalRowIndex}, 0)` }, 
        isPercent: true, 
        bold: true, 
        bgColor: totalColorHex.bg,
        textColor: totalColorHex.text,
        align: 'center'
      }
    ];

    await exportToExcel(`Laporan_Anggaran_Kabupaten_Kota_${selectedProvName}_${activeTahun}.xlsx`, [
      {
        name: 'Kabupaten Kota',
        headers,
        rows: [...rows, totalsRow],
        columnWidths: [8, 28, 22, 22, 22, 22, 25]
      }
    ]);
  };


  const renderEditableCell = (row: AlokasiKabupatenKota, field: 'nominal' | 'realisasi') => {
    const value = field === 'nominal' ? row.nominal_alokasi : row.realisasi_total;
    const isEditing = editingCell?.id === row.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <td className="sheet-cell sheet-cell-editing text-right">
          <input
            autoFocus
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); commitEdit(); }
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full bg-transparent outline-none text-right font-mono text-sm"
          />
        </td>
      );
    }

    return (
      <td className="sheet-cell sheet-cell-editable text-right" onClick={() => startEdit(row.id, field, value)}>
        {fmtRupiah(value)}
      </td>
    );
  };

  const selectedProvName = 
    sortedProvinsiData.find(p => p.provinsi_id === selectedProvinsi)?.provinsi?.nama_provinsi ||
    alokasiProvinsiData.find(p => p.provinsi_id === selectedProvinsi)?.provinsi?.nama_provinsi ||
    masterProvinsiData.find(p => p.id === selectedProvinsi)?.nama_provinsi || '';

  return (
    <div className="min-h-screen">
      <Header title="Kabupaten / Kota" subtitle={`Data alokasi anggaran per kabupaten/kota — ${selectedProvName} Tahun ${activeTahun}`} />

      <div className="p-6">
        {/* Status Notification Banner */}
        {statusMsg && (
          <div className={`mb-4 p-4 rounded-xl flex items-center justify-between gap-3 text-sm ${statusMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-rose-50 border border-rose-200 text-rose-800'}`}>
            <span>{statusMsg.text}</span>
            <button onClick={() => setStatusMsg(null)} className="font-semibold text-xs underline opacity-75 hover:opacity-100">Tutup</button>
          </div>
        )}

        {/* KPI Province Budget Summary & Precision Check */}
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-text-muted">Jatah Alokasi Provinsi ({selectedProvName})</span>
            <div className="text-base font-bold text-text-primary mt-0.5">{fmtRupiah(selectedProvAlloc?.nominal_alokasi || 0)}</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-text-muted">Total Terbagi ke {filtered.length} Kab/Kota</span>
            <div className="text-base font-bold text-indigo-600 mt-0.5">{fmtRupiah(totals.nominal)}</div>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-text-muted">Presisi Top-Down Cascading</span>
            <div className="text-base font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
              <span>
                {Math.abs(Number(selectedProvAlloc?.nominal_alokasi || 0) - Number(totals.nominal)) === 0 
                  ? '✓ 100% Cocok (0 Rp Selisih)' 
                  : `Selisih: ${fmtRupiah(Math.abs(Number(selectedProvAlloc?.nominal_alokasi || 0) - Number(totals.nominal)))}`}
              </span>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Provinsi:</span>
            <select
              value={selectedProvinsi}
              onChange={(e) => setSelectedProvinsi(e.target.value)}
              className="select-dropdown"
            >
              {sortedProvinsiData.map(p => (
                <option key={p.provinsi_id} value={p.provinsi_id}>{p.provinsi?.nama_provinsi || p.provinsi_id}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari kabupaten/kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} kabupaten/kota</span>
          
          <button
            onClick={handleDistributeProvinsi}
            disabled={isDistributing}
            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
            title="Bagi rata jatah alokasi provinsi ini ke seluruh kabupaten/kotanya dengan integer division BigInt"
          >
            <Sparkles size={14} className={isDistributing ? 'animate-spin' : ''} />
            {isDistributing ? 'Membagi...' : 'Auto-Bagi Jatah Provinsi'}
          </button>

          <button
            onClick={handleTopDownNational}
            disabled={isDistributing}
            className="btn btn-ghost border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-medium flex items-center gap-1.5"
            title="Bagi rata APBN ke 38 Provinsi & 514 Kabupaten/Kota se-Indonesia"
          >
            <Sparkles size={14} className="text-indigo-600" />
            Cascading Nasional
          </button>

          <button className="btn btn-ghost" onClick={handleRefresh} disabled={isDistributing}>
            <RefreshCw size={14} className={isDistributing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {/* Spreadsheet */}
        <div className="sheet-container">
          <table className="w-full">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 220 }}>Kabupaten / Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 150 }}>Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 170 }}>Nominal (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 170 }}>Realisasi (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 130 }}>Selisih</th>
                <th className="sheet-header-cell text-center" style={{ width: 120 }}>%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">{row.kabupaten_kota?.nama_kabupaten_kota || row.kabupaten_kota_id}</td>
                  <td className="sheet-cell text-left text-text-secondary text-xs">{row.provinsi_nama}</td>
                  {renderEditableCell(row, 'nominal')}
                  {renderEditableCell(row, 'realisasi')}
                  <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                  <td className="sheet-cell text-center">
                    <PctBadge value={row.persentase_penyerapan} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-left font-bold">TOTAL ({filtered.length})</td>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-right">{fmtRupiah(totals.nominal)}</td>
                <td className="sheet-footer-cell text-right">{fmtRupiah(totals.realisasi)}</td>
                <td className="sheet-footer-cell text-right text-rose-600">{fmtTriliun(totals.selisih)}</td>
                <td className="sheet-footer-cell text-center">
                  <PctBadge value={totals.pct} size="md" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-3 text-xs text-text-muted">
          ✏️ Klik sel untuk edit langsung • Update otomatis cascade ke Provinsi
        </p>
      </div>
    </div>
  );
}
