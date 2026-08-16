'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { alokasiProvinsiData, getKabkotaByProvinsi, getJenjangBreakdownByProvinsi, tahunAnggaranData } from '@/lib/data';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiProvinsi, AlokasiKabupatenKota, JenjangBreakdownProvinsi } from '@/types';
import { ArrowLeft, Banknote, Download, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { rollupKabKotaChange } from '@/lib/utils/dbSync';
import { exportToExcel, getPctColorHex } from '@/lib/utils/excelExport';

export default function ProvinsiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // provinsi_id e.g. p-1
  const { activeTahun, isSupabaseMode, dbData, setDbData } = useAppStore();

  const activeTahunObj = useMemo(() => {
    if (isSupabaseMode && dbData) {
      return dbData.tahun_anggaran?.find((t: any) => Number(t.tahun) === Number(activeTahun));
    }
    return tahunAnggaranData.find(t => Number(t.tahun) === Number(activeTahun));
  }, [activeTahun, isSupabaseMode, dbData]);

  // Use real Supabase data directly — filter by active tahun_anggaran_id
  const provData = useMemo(() => {
    if (isSupabaseMode && dbData) {
      const found = dbData.alokasi_provinsi?.find(
        (p: any) => p.provinsi_id === id && String(p.tahun_anggaran_id) === String(activeTahunObj?.id)
      );
      if (found) {
        const prov = dbData.provinsi?.find((p: any) => p.id === id);
        return {
          ...found,
          provinsi: prov || found.provinsi || { id, kode_provinsi: '', nama_provinsi: 'Provinsi' },
          nominal_alokasi: Number(found.nominal_alokasi || 0),
          realisasi_total: Number(found.realisasi_total || 0),
          selisih: Number(found.nominal_alokasi || 0) - Number(found.realisasi_total || 0),
          persentase_penyerapan: Number(found.nominal_alokasi) > 0 ? (Number(found.realisasi_total) / Number(found.nominal_alokasi)) * 100 : 0
        };
      }
      // If year has no allocation in DB, return 0 structure so province still renders
      const prov = dbData.provinsi?.find((p: any) => p.id === id);
      if (prov) {
        return {
          id: `prov-draft-${id}-${activeTahun}`,
          tahun_anggaran_id: activeTahunObj?.id || '',
          provinsi_id: id,
          nominal_alokasi: 0,
          realisasi_total: 0,
          selisih: 0,
          persentase_penyerapan: 0,
          updated_at: new Date().toISOString().split('T')[0],
          provinsi: prov
        } as AlokasiProvinsi;
      }
    }

    const found = alokasiProvinsiData.find(p => p.provinsi_id === id && String(p.tahun_anggaran_id) === String(activeTahunObj?.id));
    if (found) return found;

    // Fallback: master province with 0
    const masterProv = alokasiProvinsiData.find(p => p.provinsi_id === id);
    if (masterProv) {
      return {
        ...masterProv,
        id: `prov-draft-${id}-${activeTahun}`,
        tahun_anggaran_id: activeTahunObj?.id || '',
        nominal_alokasi: 0,
        realisasi_total: 0,
        selisih: 0,
        persentase_penyerapan: 0,
      };
    }
    return null;
  }, [id, activeTahunObj, isSupabaseMode, dbData]);

  // Real Kabkota list from Supabase filtered by active tahun
  const realKabkotaList = useMemo(() => {
    if (!provData) return [];

    if (isSupabaseMode && dbData) {
      const yearKabkotas = (dbData.alokasi_kabupaten_kota || []).filter((akk: any) => {
        return akk.alokasi_provinsi_id === provData.id;
      });

      if (yearKabkotas.length > 0) {
        return yearKabkotas.map((akk: any) => {
          const kk = dbData.kabupaten_kota?.find((k: any) => k.id === akk.kabupaten_kota_id);
          const nominal = Number(akk.nominal_alokasi || 0);
          const realisasi = Number(akk.realisasi_total || 0);
          return {
            id: akk.id,
            alokasi_provinsi_id: akk.alokasi_provinsi_id,
            kabupaten_kota_id: akk.kabupaten_kota_id,
            kabupaten_kota: kk || akk.kabupaten_kota || { id: akk.kabupaten_kota_id, provinsi_id: id, kode_kabupaten_kota: '', nama_kabupaten_kota: 'Kab/Kota', tipe: 'KABUPATEN' },
            provinsi_nama: provData.provinsi.nama_provinsi,
            nominal_alokasi: nominal,
            realisasi_total: realisasi,
            selisih: nominal - realisasi,
            persentase_penyerapan: nominal > 0 ? (realisasi / nominal) * 100 : 0,
            updated_at: akk.updated_at || '',
          } as AlokasiKabupatenKota;
        }).sort((a: any, b: any) => a.kabupaten_kota.nama_kabupaten_kota.localeCompare(b.kabupaten_kota.nama_kabupaten_kota, 'id'));
      }

      // If no year-specific allocations exist, get master kabupaten_kota list with 0 allocations
      const masterKabs = (dbData.kabupaten_kota || []).filter((k: any) => k.provinsi_id === id);
      return masterKabs.map((k: any) => ({
        id: `akk-draft-${k.id}-${activeTahun}`,
        alokasi_provinsi_id: provData.id,
        kabupaten_kota_id: k.id,
        kabupaten_kota: k,
        provinsi_nama: provData.provinsi.nama_provinsi,
        nominal_alokasi: 0,
        realisasi_total: 0,
        selisih: 0,
        persentase_penyerapan: 0,
        updated_at: new Date().toISOString().split('T')[0],
      } as AlokasiKabupatenKota)).sort((a: any, b: any) => a.kabupaten_kota.nama_kabupaten_kota.localeCompare(b.kabupaten_kota.nama_kabupaten_kota, 'id'));
    }

    const list = getKabkotaByProvinsi(id);
    return [...list].sort((a, b) =>
      a.kabupaten_kota.nama_kabupaten_kota.localeCompare(b.kabupaten_kota.nama_kabupaten_kota, 'id')
    );
  }, [id, provData, activeTahunObj, isSupabaseMode, dbData]);

  // States
  const [prevRealKabkotaList, setPrevRealKabkotaList] = useState(realKabkotaList);
  const [kabkotaList, setKabkotaList] = useState<AlokasiKabupatenKota[]>(realKabkotaList);

  if (realKabkotaList !== prevRealKabkotaList) {
    setPrevRealKabkotaList(realKabkotaList);
    setKabkotaList(realKabkotaList);
  }

  // Calculate dynamic totals based on Kabupaten/Kota state
  const totals = useMemo(() => {
    const nominal = kabkotaList.reduce((sum, item) => sum + item.nominal_alokasi, 0);
    const realisasi = kabkotaList.reduce((sum, item) => sum + item.realisasi_total, 0);
    const selisih = nominal - realisasi;
    const persentase = nominal > 0 ? (realisasi / nominal) * 100 : 0;
    return { nominal, realisasi, selisih, persentase };
  }, [kabkotaList]);

  // Jenjang Breakdown — loaded async from schools table (same source as port 2020)
  const [jenjangBreakdown, setJenjangBreakdown] = useState<JenjangBreakdownProvinsi[]>([]);

  useEffect(() => {
    const loadJenjangBreakdown = async () => {
      const numNominal = totals.nominal;
      try {
        const { data, error } = await supabase
          .from('province_school_stats')
          .select('*')
          .eq('province_id', id)
          .single();

        if (data && !error) {
          setJenjangBreakdown([
            {
              nomor: 1,
              jenjang: 'Universitas (Strata 1)',
              jumlah_sekolah: Number(data.univ) || 0,
              nominal_keseluruhan: Math.round(numNominal * 0.35),
              porsi_anggaran: 35.0,
            },
            {
              nomor: 2,
              jenjang: 'Sekolah Menengah Atas (SMA/SMK)',
              jumlah_sekolah: Number(data.sma) || 0,
              nominal_keseluruhan: Math.round(numNominal * 0.25),
              porsi_anggaran: 25.0,
            },
            {
              nomor: 3,
              jenjang: 'Sekolah Menengah Pertama (SMP/Sederajat)',
              jumlah_sekolah: Number(data.smp) || 0,
              nominal_keseluruhan: Math.round(numNominal * 0.20),
              porsi_anggaran: 20.0,
            },
            {
              nomor: 4,
              jenjang: 'Sekolah Dasar (SD/Sederajat)',
              jumlah_sekolah: Number(data.sd) || 0,
              nominal_keseluruhan: Math.round(numNominal * 0.15),
              porsi_anggaran: 15.0,
            },
            {
              nomor: 5,
              jenjang: 'Pendidikan Anak Usia Dini (PAUD/TK/KB)',
              jumlah_sekolah: Number(data.paud) || 0,
              nominal_keseluruhan: Math.round(numNominal * 0.05),
              porsi_anggaran: 5.0,
            },
          ]);
          return;
        }
      } catch (err) {
        console.error('[Auditor] jenjang breakdown from province_school_stats failed:', err);
      }

      // Fallback to sync function
      setJenjangBreakdown(getJenjangBreakdownByProvinsi(id, totals.nominal));
    };

    loadJenjangBreakdown();
  }, [id, totals.nominal]);

  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal_alokasi' | 'realisasi_total' } | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (id: string, field: 'nominal_alokasi' | 'realisasi_total', currentValue: number) => {
    setEditingCell({ id, field });
    setEditValue(currentValue.toString());
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const parsed = parseInt(editValue.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      const rowId = editingCell.id;
      const field = editingCell.field;

      setKabkotaList(prev => prev.map(item => {
        if (item.id !== rowId) return item;
        const nominal = field === 'nominal_alokasi' ? parsed : item.nominal_alokasi;
        const realisasi = field === 'realisasi_total' ? parsed : item.realisasi_total;
        return {
          ...item,
          [field]: parsed,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0
        };
      }));

      if (isSupabaseMode && dbData) {
        const updates = field === 'nominal_alokasi'
          ? { nominal_alokasi: parsed }
          : { realisasi_total: parsed };
        await rollupKabKotaChange(dbData, setDbData, rowId, updates);
      }
    }
    setEditingCell(null);
  };

  const handleExport = async () => {
    if (!provData) return;
    const summaryHeaders = [
      'Nomor', 'Tahun Anggaran', 'Nominal (Rp)', 'Realisasi (Rp)', 'Nominal Selisih (Rp)', 'Persentase penyerapan (%)'
    ];
    const summaryColorHex = getPctColorHex(totals.persentase);
    const summaryRows = [
      [
        { value: 1, align: 'center' },
        { value: activeTahun, align: 'center' },
        { value: totals.nominal, isCurrency: true },
        { value: totals.realisasi, isCurrency: true },
        { value: { formula: 'C2-D2' }, isCurrency: true, textColor: '991B1B' },
        { 
          value: { formula: 'IF(C2>0, D2/C2, 0)' }, 
          isPercent: true, 
          bgColor: summaryColorHex.bg, 
          textColor: summaryColorHex.text,
          bold: true,
          align: 'center'
        }
      ]
    ];

    const jenjangHeaders = [
      'Nomor', 'Jenjang Pendidikan', 'Jumlah Sekolah', 'Nominal Keseluruhan (Rp)', 'Porsi Anggaran (%)'
    ];
    const jenjangRows = jenjangBreakdown.map((row, idx) => {
      const rowNum = idx + 2;
      return [
        { value: row.nomor, align: 'center' },
        { value: row.jenjang },
        { value: row.jumlah_sekolah, align: 'center' },
        { value: row.nominal_keseluruhan, isCurrency: true },
        { value: { formula: `D${rowNum}/SUM(D$2:D$6)` }, isPercent: true, align: 'center', bold: true }
      ];
    });

    const kabkotaHeaders = [
      'Nomor', 'Nama Kabupaten/Kota', 'Nominal Anggaran (Rp)', 'Realisasi (Rp)', 'Nominal Selisih (Rp)', 'Persentase penyerapan (%)'
    ];
    const kabkotaRows = kabkotaList.map((row, idx) => {
      const rowNum = idx + 2;
      const colorHex = getPctColorHex(row.persentase_penyerapan);
      return [
        { value: idx + 1, align: 'center' },
        { value: row.kabupaten_kota.nama_kabupaten_kota },
        { value: row.nominal_alokasi, isCurrency: true },
        { value: row.realisasi_total, isCurrency: true },
        { value: { formula: `C${rowNum}-D${rowNum}` }, isCurrency: true, textColor: '991B1B' },
        { 
          value: { formula: `IF(C${rowNum}>0, D${rowNum}/C${rowNum}, 0)` }, 
          isPercent: true, 
          bgColor: colorHex.bg, 
          textColor: colorHex.text,
          bold: true,
          align: 'center'
        }
      ];
    });

    const totalRowIndex = kabkotaList.length + 2;
    const totalColorHex = getPctColorHex(totals.persentase);
    const totalsRow = [
      { value: '', bold: true },
      { value: 'TOTAL / REALISASI', bold: true },
      { value: { formula: `SUM(C2:C${totalRowIndex-1})` }, isCurrency: true, bold: true },
      { value: { formula: `SUM(D2:D${totalRowIndex-1})` }, isCurrency: true, bold: true },
      { value: { formula: `C${totalRowIndex}-D${totalRowIndex}` }, isCurrency: true, bold: true, textColor: '991B1B' },
      { 
        value: { formula: `IF(C${totalRowIndex}>0, D${totalRowIndex}/C${totalRowIndex}, 0)` }, 
        isPercent: true, 
        bold: true, 
        bgColor: totalColorHex.bg,
        textColor: totalColorHex.text,
        align: 'center'
      }
    ];

    await exportToExcel(`Laporan_Provinsi_${provData.provinsi.nama_provinsi}_${activeTahun}.xlsx`, [
      {
        name: 'Summary',
        headers: summaryHeaders,
        rows: summaryRows,
        columnWidths: [8, 18, 22, 22, 22, 25]
      },
      {
        name: 'Porsi Jenjang',
        headers: jenjangHeaders,
        rows: jenjangRows,
        columnWidths: [8, 28, 16, 25, 20]
      },
      {
        name: 'Dinas Kabupaten-Kota',
        headers: kabkotaHeaders,
        rows: [...kabkotaRows, totalsRow],
        columnWidths: [8, 28, 22, 22, 22, 25]
      }
    ]);
  };

  const renderEditableCell = (row: AlokasiKabupatenKota, field: 'nominal_alokasi' | 'realisasi_total') => {
    const value = row[field];
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
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                commitEdit();
              }
              if (e.key === 'Escape') setEditingCell(null);
            }}
            className="w-full bg-transparent outline-none text-right font-mono text-sm pr-1"
          />
        </td>
      );
    }

    return (
      <td
        className="sheet-cell sheet-cell-editable text-right font-mono cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => startEdit(row.id, field, value)}
      >
        {fmtRupiah(value)}
      </td>
    );
  };

  if (!provData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md border border-slate-100 max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-2">Provinsi Tidak Ditemukan</h2>
          <p className="text-text-muted mb-6">ID Provinsi: &quot;{id}&quot; tidak terdaftar di sistem.</p>
          <button onClick={() => router.back()} className="btn btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`Rincian Provinsi: ${provData.provinsi.nama_provinsi}`}
        subtitle={`Tahun Anggaran ${activeTahun} — Transparansi Pembagian Anggaran Wilayah`}
      />

      <div className="p-6 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center">
          <button onClick={() => router.back()} className="btn btn-ghost text-sm flex items-center gap-2">
            <ArrowLeft size={16} />
            Kembali
          </button>
          
          <button 
            onClick={handleExport} 
            className="btn btn-secondary text-sm flex items-center gap-2"
          >
            <Download size={16} />
            Ekspor Spreadsheet
          </button>
        </div>

        {/* ============================================================ */}
        {/* 1. SUMMARY CARD / TABLE RINGKASAN */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              Tabel Summary Anggaran Provinsi
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Summary]</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-center" style={{ width: 160 }}>Tahun Anggaran</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Nominal</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Realisasi</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Nominal Selisih</th>
                  <th className="sheet-header-cell text-center" style={{ width: 200 }}>Persentase penyerapan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="sheet-cell text-center font-bold text-text-muted">1</td>
                  <td className="sheet-cell text-center font-medium">{activeTahun}</td>
                  <td className="sheet-cell text-right font-mono font-bold text-text-primary">
                    {fmtRupiah(totals.nominal)}
                  </td>
                  <td className="sheet-cell text-right font-mono font-bold text-emerald-600 bg-emerald-50/30">
                    {fmtRupiah(totals.realisasi)}
                  </td>
                  <td className="sheet-cell text-right font-mono font-bold text-rose-600 bg-rose-50/30">
                    {fmtRupiah(totals.selisih)}
                  </td>
                  <td className="sheet-cell text-center">
                    <PctBadge value={totals.persentase} size="md" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. JENJANG PENDIDIKAN TABLE */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Banknote size={16} className="text-indigo-500" />
              Porsi Alokasi Dana per Jenjang Pendidikan
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Porsi Jenjang]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-left">Jenjang Pendidikan</th>
                  <th className="sheet-header-cell text-right" style={{ width: 180 }}>Jumlah Sekolah</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 240 }}>Nominal Keseluruhan</th>
                  <th className="sheet-header-cell text-center" style={{ width: 180 }}>Porsi Anggaran (%)</th>
                </tr>
              </thead>
              <tbody>
                {jenjangBreakdown.map((row) => (
                  <tr key={row.nomor} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{row.nomor}</td>
                    <td className="sheet-cell text-left font-semibold text-slate-700">{row.jenjang}</td>
                    <td className="sheet-cell text-right font-mono text-text-primary font-medium">{row.jumlah_sekolah}</td>
                    <td className="sheet-cell text-right font-mono font-medium text-indigo-700 bg-indigo-50/10">
                      {fmtRupiah(row.nominal_keseluruhan)}
                    </td>
                    <td className="sheet-cell text-center">
                      <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-sm">
                        {(Number(row.porsi_anggaran) || 0).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 3. KABUPATEN/KOTA DETAIL TABLE */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Rincian Pembagian Anggaran Ke Dinas Pendidikan Kabupaten/Kota di Provinsi {provData.provinsi.nama_provinsi}
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Dinas Kabupaten/Kota]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-left">Nama Kabupaten/Kota</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Nominal Anggaran</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Realisasi</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Nominal Selisih</th>
                  <th className="sheet-header-cell text-center" style={{ width: 180 }}>Persentase penyerapan</th>
                </tr>
              </thead>
              <tbody>
                {kabkotaList.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                    <td className="sheet-cell text-left font-semibold text-slate-700">
                      <Link href={`/dashboard/provinsi/${id}/kabkota/${row.kabupaten_kota_id}`} className="hover:text-accent hover:underline transition-colors">
                        {row.kabupaten_kota.nama_kabupaten_kota}
                      </Link>
                    </td>
                    {renderEditableCell(row, 'nominal_alokasi')}
                    {renderEditableCell(row, 'realisasi_total')}
                    <td className="sheet-cell text-right font-mono text-rose-600 bg-rose-50/5">
                      {fmtRupiah(row.selisih)}
                    </td>
                    <td className="sheet-cell text-center">
                      <PctBadge value={row.persentase_penyerapan} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Realisasi Anggaran Row */}
                <tr className="border-t-2 border-slate-300">
                  <td className="sheet-cell font-bold text-center bg-indigo-50 text-indigo-900 border-r border-slate-200" colSpan={2}>
                    Total / Realisasi Anggaran
                  </td>
                  <td className="sheet-cell text-right font-bold bg-indigo-600 text-white font-mono border-r border-slate-200 text-sm">
                    {fmtRupiah(totals.nominal)}
                  </td>
                  <td className="sheet-cell text-right font-bold bg-emerald-500 text-white font-mono border-r border-slate-200 text-sm">
                    {fmtRupiah(totals.realisasi)}
                  </td>
                  <td className="sheet-cell text-right font-bold bg-amber-400 text-slate-900 font-mono border-r border-slate-200 text-sm">
                    {fmtRupiah(totals.selisih)}
                  </td>
                  <td className="sheet-cell text-center font-bold bg-emerald-500 text-white font-mono text-sm">
                    {(Number(totals.persentase) || 0).toFixed(2).replace('.', ',')}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <p className="text-xs text-text-muted flex items-center gap-1">
          <span>✏️</span>
          <span>Klik langsung pada kolom <strong>Nominal Anggaran</strong> atau <strong>Realisasi</strong> untuk mengubah data • Tekan <strong>Enter</strong> untuk menyimpan</span>
        </p>
      </div>
    </div>
  );
}
