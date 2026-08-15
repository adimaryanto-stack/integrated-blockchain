'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { alokasiProvinsiData, getKabkotaByProvinsi, getJenjangBreakdownByProvinsi } from '@/lib/data';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiProvinsi, AlokasiKabupatenKota, JenjangBreakdownProvinsi } from '@/types';
import { ArrowLeft, Banknote, Download, Sparkles } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import EditableCell from '@/components/spreadsheet/EditableCell';
import { rollupKabKotaChange } from '@/lib/utils/dbSync';

export default function ProvinsiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // provinsi_id e.g. p-1
  const { activeTahun, isSupabaseMode, dbData, setDbData } = useAppStore();

  // Use real Supabase data directly — no scaling
  const provData = useMemo(() => {
    return alokasiProvinsiData.find(p => p.provinsi_id === id) || null;
  }, [id]);

  // Real Kabkota list from Supabase
  const realKabkotaList = useMemo(() => {
    const list = getKabkotaByProvinsi(id);
    return [...list].sort((a, b) =>
      a.kabupaten_kota.nama_kabupaten_kota.localeCompare(b.kabupaten_kota.nama_kabupaten_kota, 'id')
    );
  }, [id]);

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

  const handleCellSave = async (rowId: string, field: 'nominal_alokasi' | 'realisasi_total', newValue: number) => {
    setKabkotaList(prev => prev.map(item => {
      if (item.id === rowId) {
        const nominal = field === 'nominal_alokasi' ? newValue : item.nominal_alokasi;
        const realisasi = field === 'realisasi_total' ? newValue : item.realisasi_total;
        return {
          ...item,
          [field]: newValue,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0
        };
      }
      return item;
    }));

    if (isSupabaseMode && dbData) {
      const updates = field === 'nominal_alokasi'
        ? { nominal_alokasi: newValue }
        : { realisasi_total: newValue };

      await rollupKabKotaChange(dbData, setDbData, rowId, updates);
    }
  };

  const renderEditableCell = (row: AlokasiKabupatenKota, field: 'nominal_alokasi' | 'realisasi_total') => {
    const value = row[field];
    return (
      <td className="sheet-cell p-0">
        <EditableCell
          value={value}
          onSave={(newValue) => handleCellSave(row.id, field, newValue)}
        />
      </td>
    );
  };

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
            onClick={() => {
              alert('Fungsi ekspor Google Sheets berhasil disimulasikan! Menghasilkan berkas Excel...');
            }} 
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
                    {totals.persentase.toFixed(2).replace('.', ',')}%
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
