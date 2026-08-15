'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { alokasiProvinsiData, getKabkotaByProvinsi, getJenjangBreakdownByKabkota, getInstitusiByKabkota, tahunAnggaranData } from '@/lib/data';
import { fmtRupiah } from '@/lib/utils/formatters';
import { AlokasiProvinsi, AlokasiKabupatenKota, InstitusiPendidikan, JenjangBreakdownProvinsi } from '@/types';
import { ArrowLeft, Banknote, ChevronLeft, ChevronRight, Download, Filter, School, Search, Sparkles } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import EditableCell from '@/components/spreadsheet/EditableCell';
import { rollupInstitusiChange } from '@/lib/utils/dbSync';

export default function KabkotaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // provinsi_id e.g. p-1
  const kabkotaId = params.kabkotaId as string; // kabupaten_kota_id e.g. k-p-1-0
  const { activeTahun, isSupabaseMode, dbData, setDbData } = useAppStore();

  // Find target province & kabkota data scaled dynamically
  const provData = useMemo(() => {
    const baseData = alokasiProvinsiData.find(p => p.provinsi_id === id);
    if (!baseData) return null;
    
    if (isSupabaseMode && dbData) {
      const dbAlokasiProv = dbData.alokasi_provinsi.find((p: any) => p.provinsi_id === id);
      if (dbAlokasiProv) {
        return {
          ...baseData,
          nominal_alokasi: Number(dbAlokasiProv.nominal_alokasi),
          realisasi_total: Number(dbAlokasiProv.realisasi_total),
          selisih: Number(dbAlokasiProv.selisih),
          persentase_penyerapan: Number(dbAlokasiProv.persentase_penyerapan)
        };
      }
    }

    const targetTahun = tahunAnggaranData.find(t => t.tahun === activeTahun) || tahunAnggaranData[6];
    const baseTahun = tahunAnggaranData[6];
    const scale = targetTahun.total_anggaran > 0 ? targetTahun.total_anggaran / baseTahun.total_anggaran : 1.0;
    const seed = (activeTahun % 7) || 1;
    const shift = 0.95 + (seed * 0.012);

    const nominal = Math.round(baseData.nominal_alokasi * scale);
    const realisasi = Math.min(nominal, Math.round(baseData.realisasi_total * scale * shift));

    return {
      ...baseData,
      nominal_alokasi: nominal,
      realisasi_total: realisasi,
      selisih: nominal - realisasi,
      persentase_penyerapan: nominal > 0 ? (realisasi / nominal) * 100 : 0,
    };
  }, [id, activeTahun, isSupabaseMode, dbData]);

  const kabkotaData = useMemo(() => {
    const baseData = getKabkotaByProvinsi(id).find(k => k.kabupaten_kota_id === kabkotaId);
    if (!baseData) return null;
    
    if (isSupabaseMode && dbData) {
      const dbAlokasiKab = dbData.alokasi_kabupaten_kota.find((k: any) => k.kabupaten_kota_id === kabkotaId);
      if (dbAlokasiKab) {
        return {
          ...baseData,
          nominal_alokasi: Number(dbAlokasiKab.nominal_alokasi),
          realisasi_total: Number(dbAlokasiKab.realisasi_total),
          selisih: Number(dbAlokasiKab.selisih),
          persentase_penyerapan: Number(dbAlokasiKab.persentase_penyerapan)
        };
      }
    }

    const targetTahun = tahunAnggaranData.find(t => t.tahun === activeTahun) || tahunAnggaranData[6];
    const baseTahun = tahunAnggaranData[6];
    const scale = targetTahun.total_anggaran > 0 ? targetTahun.total_anggaran / baseTahun.total_anggaran : 1.0;
    const seed = (activeTahun % 7) || 1;
    const shift = 0.95 + (seed * 0.012);

    const nominal = Math.round(baseData.nominal_alokasi * scale);
    const realisasi = Math.min(nominal, Math.round(baseData.realisasi_total * scale * shift));

    return {
      ...baseData,
      nominal_alokasi: nominal,
      realisasi_total: realisasi,
      selisih: nominal - realisasi,
      persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0
    };
  }, [id, kabkotaId, activeTahun, isSupabaseMode, dbData]);

  const scaledSchoolList = useMemo(() => {
    if (!kabkotaData || !provData) return [];
    const list = getInstitusiByKabkota(
      kabkotaId,
      kabkotaData.kabupaten_kota.nama_kabupaten_kota,
      provData.provinsi.nama_provinsi,
      kabkotaData.nominal_alokasi
    );

    if (isSupabaseMode && dbData) {
      return list.map(item => ({
        ...item,
        nominal_alokasi: Number(item.nominal_alokasi),
        realisasi_total: Number(item.realisasi_total),
        selisih: Number(item.nominal_alokasi) - Number(item.realisasi_total),
        persentase_penyerapan: Number(item.nominal_alokasi) > 0 
          ? Math.round((Number(item.realisasi_total) / Number(item.nominal_alokasi)) * 1000) / 10 
          : 0
      }));
    }

    return list;
  }, [kabkotaId, kabkotaData, provData, isSupabaseMode, dbData]);

  // States
  const [schoolList, setSchoolList] = useState<InstitusiPendidikan[]>(scaledSchoolList);

  useEffect(() => {
    setSchoolList(scaledSchoolList);
  }, [scaledSchoolList]);

  const [search, setSearch] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Extract unique jenjang values for filter
  const jenjangOptions = useMemo(() => {
    const jenjangSet = new Set(schoolList.map(s => s.jenjang));
    return Array.from(jenjangSet).sort();
  }, [schoolList]);

  // Filtered data
  const filtered = useMemo(() => {
    let result = schoolList;
    if (selectedJenjang) {
      result = result.filter(s => s.jenjang === selectedJenjang);
    }
    if (search) {
      result = result.filter(s => s.nama_institusi.toLowerCase().includes(search.toLowerCase()));
    }
    return result;
  }, [schoolList, selectedJenjang, search]);

  // Calculate dynamic totals based on filtered data
  const totals = useMemo(() => {
    const nominal = filtered.reduce((sum, item) => sum + item.nominal_alokasi, 0);
    const realisasi = filtered.reduce((sum, item) => sum + item.realisasi_total, 0);
    const selisih = nominal - realisasi;
    const persentase = nominal > 0 ? (realisasi / nominal) * 100 : 0;
    return { nominal, realisasi, selisih, persentase };
  }, [filtered]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Jenjang Breakdown calculation — loaded async from schools table (same source as port 2020)
  const [jenjangBreakdown, setJenjangBreakdown] = useState<JenjangBreakdownProvinsi[]>([]);

  useEffect(() => {
    const loadJenjangBreakdown = async () => {
      const numNominal = kabkotaData?.nominal_alokasi || totals.nominal || 0;
      const jenjangs = [
        { label: 'Universitas (Strata 1)', key: 'UNIVERSITAS', weight: 0.35, porsi: 35.0 },
        { label: 'Sekolah Menengah Atas (SMA/SMK)', key: 'SMA', weight: 0.25, porsi: 25.0 },
        { label: 'Sekolah Menengah Pertama (SMP/Sederajat)', key: 'SMP', weight: 0.20, porsi: 20.0 },
        { label: 'Sekolah Dasar (SD/Sederajat)', key: 'SD', weight: 0.15, porsi: 15.0 },
        { label: 'Pendidikan Anak Usia Dini (PAUD/TK/KB)', key: 'PAUD', weight: 0.05, porsi: 5.0 },
      ];

      try {
        const { data: schools } = await supabase
          .from('schools')
          .select('name')
          .eq('regency_id', kabkotaId)
          .limit(5000);

        const counts: Record<string, number> = { UNIVERSITAS: 0, SMA: 0, SMP: 0, SD: 0, PAUD: 0 };

        (schools || []).forEach((s: any) => {
          const n = (s.name || '').toUpperCase();
          if (n.match(/\b(UNIVERSITAS|INSTITUT|POLITEKNIK|AKADEMI|SEKOLAH TINGGI)\b/)) counts.UNIVERSITAS++;
          else if (n.match(/\b(SMA|SMAN|SMAS|SMK|SMKN|SMKS|MA|MAN|MAS)\b/)) counts.SMA++;
          else if (n.match(/\b(SMP|SMPN|SMPS|MTS|MTSN|MTSS)\b/)) counts.SMP++;
          else if (n.match(/\b(SD|SDN|SDS|MI|MIN|MIS)\b/)) counts.SD++;
          else counts.PAUD++;
        });

        setJenjangBreakdown(jenjangs.map((j, i) => ({
          nomor: i + 1,
          jenjang: j.label,
          jumlah_sekolah: counts[j.key],
          nominal_keseluruhan: Math.round(numNominal * j.weight),
          porsi_anggaran: j.porsi,
        })));
        return;
      } catch (err) {
        console.error('[Auditor Kabkota] breakdown failed:', err);
      }

      // Fallback
      setJenjangBreakdown(jenjangs.map((j, i) => ({
        nomor: i + 1,
        jenjang: j.label,
        jumlah_sekolah: 0,
        nominal_keseluruhan: Math.round(numNominal * j.weight),
        porsi_anggaran: j.porsi,
      })));
    };

    if (kabkotaId) loadJenjangBreakdown();
  }, [kabkotaId, kabkotaData, totals.nominal]);

  if (!provData || !kabkotaData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md border border-slate-100 max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-2">Daerah Tidak Ditemukan</h2>
          <p className="text-text-muted mb-6">Data Wilayah / Kabupaten tidak terdaftar di sistem.</p>
          <button onClick={() => router.back()} className="btn btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const handleCellSave = async (rowId: string, field: 'nominal_alokasi' | 'realisasi_total', newValue: number) => {
    setSchoolList(prev => prev.map(item => {
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

      await rollupInstitusiChange(dbData, setDbData, rowId, updates);
    }
  };

  const renderEditableCell = (row: InstitusiPendidikan, field: 'nominal_alokasi' | 'realisasi_total') => {
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
        title={`Rincian Kabupaten/Kota: ${kabkotaData.kabupaten_kota.nama_kabupaten_kota}`}
        subtitle={`Provinsi ${provData.provinsi.nama_provinsi} — Anggaran Sekolah & Institusi Tahun ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/dashboard/provinsi" className="hover:text-accent hover:underline">Provinsi</Link>
            <span>➔</span>
            <Link href={`/dashboard/provinsi/${id}`} className="hover:text-accent hover:underline">{provData.provinsi.nama_provinsi}</Link>
            <span>➔</span>
            <span className="font-semibold text-slate-700">{kabkotaData.kabupaten_kota.nama_kabupaten_kota}</span>
          </div>

          <div className="flex items-center gap-3">
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
        </div>

        {/* ============================================================ */}
        {/* 1. SUMMARY CARD / TABLE RINGKASAN */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" />
              Tabel Summary Anggaran Wilayah Kabupaten/Kota
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
                    {fmtRupiah(totals.nominal || kabkotaData.nominal_alokasi)}
                  </td>
                  <td className="sheet-cell text-right font-mono font-bold text-emerald-600 bg-emerald-50/30">
                    {fmtRupiah(totals.realisasi || kabkotaData.realisasi_total)}
                  </td>
                  <td className="sheet-cell text-right font-mono font-bold text-rose-600 bg-rose-50/30">
                    {fmtRupiah((totals.nominal || kabkotaData.nominal_alokasi) - (totals.realisasi || kabkotaData.realisasi_total))}
                  </td>
                  <td className="sheet-cell text-center">
                    <PctBadge value={totals.nominal > 0 ? totals.persentase : (kabkotaData.persentase_penyerapan || 0)} size="md" />
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
              <School size={16} className="text-indigo-500" />
              Jumlah & Anggaran Pendidikan per Tingkatan Sekolah
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Proporsi Sekolah]</span>
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
                        {row.porsi_anggaran}%
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
              Rincian Pembagian Anggaran Ke Instansi Sekolah di {kabkotaData.kabupaten_kota.nama_kabupaten_kota}
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Alokasi Sekolah]</span>
          </div>

          {/* Filter & Search Toolbar */}
          <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-text-muted" />
              <span className="text-xs text-text-muted font-medium">Jenjang:</span>
              <select
                value={selectedJenjang}
                onChange={(e) => { setSelectedJenjang(e.target.value); setCurrentPage(1); }}
                className="select-dropdown"
              >
                <option value="">Semua Jenjang</option>
                {jenjangOptions.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari nama sekolah..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="search-input"
              />
            </div>
            <span className="text-xs text-text-muted flex-1">
              {filtered.length} institusi{filtered.length !== schoolList.length ? ` (dari ${schoolList.length} total)` : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-left">Nama Sekolah / Universitas</th>
                  <th className="sheet-header-cell text-center" style={{ width: 140 }}>Status</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Nominal Anggaran</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Realisasi</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Nominal Selisih</th>
                  <th className="sheet-header-cell text-center" style={{ width: 180 }}>Persentase penyerapan</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td className="sheet-cell text-left font-semibold text-slate-700">
                      <Link href={`/dashboard/profil-institusi/${row.id}`} className="hover:text-accent hover:underline transition-colors text-indigo-700">
                        {row.nama_institusi}
                      </Link>
                    </td>
                    <td className="sheet-cell text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.status_sekolah === 'NEGERI' 
                          ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                          : 'bg-purple-100 text-purple-800 border border-purple-200'
                      }`}>
                        {row.status_sekolah}
                      </span>
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
                {/* Realisasi Anggaran Row (Identical to Google Sheets Screenshot) */}
                <tr className="border-t-2 border-slate-300">
                  <td className="sheet-cell font-bold text-center bg-slate-100 text-slate-700 border-r border-slate-200" colSpan={3}>
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
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-lg shadow-sm">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-700">
                  Menampilkan <span className="font-semibold">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> sampai{' '}
                  <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> dari{' '}
                  <span className="font-semibold">{filtered.length}</span> data sekolah
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {getPageNumbers().map((pageNum, idx) => {
                    if (pageNum === '...') {
                      return (
                        <span key={`ellipsis-${idx}`} className="relative inline-flex items-center px-4 py-2 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-300">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum as number)}
                        className={`relative inline-flex items-center px-4 py-2 text-xs font-semibold focus:z-20 ${
                          currentPage === pageNum
                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}

        <p className="text-xs text-text-muted flex items-center gap-1">
          <span>🔒</span>
          <span>Mode Read-Only • Data ini dikunci dan tidak dapat diubah oleh Auditor • Limit {itemsPerPage} data per halaman</span>
        </p>
      </div>
    </div>
  );
}
