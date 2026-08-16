'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { getInstitusiByKabkota } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah } from '@/lib/utils/formatters';
import { AlokasiProvinsi, AlokasiKabupatenKota, InstitusiPendidikan, JenjangBreakdownProvinsi } from '@/types';
import { ArrowLeft, Banknote, ChevronLeft, ChevronRight, Download, Filter, School, Search, Sparkles } from 'lucide-react';
import PctBadge from '@/components/ui/PctBadge';

export default function KabkotaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string; // provinsi_id e.g. p-1
  const kabkotaId = params.kabkotaId as string; // kabupaten_kota_id e.g. k-p-1-0
  const { activeTahun } = useAppStore();

  const [provData, setProvData] = useState<AlokasiProvinsi | null>(null);
  const [kabkotaData, setKabkotaData] = useState<AlokasiKabupatenKota | null>(null);
  const [schoolList, setSchoolList] = useState<InstitusiPendidikan[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: yearRow } = await supabase
        .from('tahun_anggaran')
        .select('id')
        .eq('tahun', activeTahun)
        .single();
      
      if (!yearRow) {
        setLoading(false);
        return;
      }

      const { data: provRow } = await supabase
        .from('alokasi_provinsi')
        .select('*, provinsi:provinsi(*)')
        .eq('provinsi_id', id)
        .eq('tahun_anggaran_id', yearRow.id)
        .single();

      if (!provRow) {
        setProvData(null);
        setLoading(false);
        return;
      }

      setProvData(provRow);

      const { data: kabRow } = await supabase
        .from('alokasi_kabupaten_kota')
        .select('*, kabupaten_kota:kabupaten_kota(*)')
        .eq('kabupaten_kota_id', kabkotaId)
        .eq('alokasi_provinsi_id', provRow.id)
        .single();

      if (!kabRow) {
        setKabkotaData(null);
        setLoading(false);
        return;
      }

      setKabkotaData(kabRow);

      const schools = await getInstitusiByKabkota(
        kabkotaId,
        kabRow.kabupaten_kota.nama_kabupaten_kota,
        provRow.provinsi.nama_provinsi,
        kabRow.nominal_alokasi
      );
      setSchoolList(schools);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, kabkotaId, activeTahun]);
  
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal_alokasi' | 'realisasi_total' } | null>(null);
  const [editValue, setEditValue] = useState('');
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
        console.error('[Bank Kabkota] breakdown failed:', err);
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

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Detail Area Kabupaten/Kota"
          subtitle="Memuat data status pencairan rekening sekolah..."
        />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!provData || !kabkotaData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-md border border-slate-100 max-w-md">
          <h2 className="text-xl font-bold text-text-primary mb-2">Area Tidak Ditemukan</h2>
          <p className="text-text-muted mb-6">Data Wilayah / Kabupaten tidak terdaftar di sistem.</p>
          <button onClick={() => router.back()} className="btn btn-primary inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // Inline editing functions
  const startEdit = (rowId: string, field: 'nominal_alokasi' | 'realisasi_total', currentValue: number) => {
    setEditingCell({ id: rowId, field });
    setEditValue(String(currentValue));
  };

  const commitEdit = async () => {
    if (!editingCell || !kabkotaData || !provData) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      // 1. Update local state
      const updatedSchoolList = schoolList.map(item => {
        if (item.id !== editingCell.id) return item;
        const nominal = editingCell.field === 'nominal_alokasi' ? parsed : item.nominal_alokasi;
        const realisasi = editingCell.field === 'realisasi_total' ? parsed : item.realisasi_total;
        return {
          ...item,
          nominal_alokasi: nominal,
          realisasi_total: realisasi,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0
        };
      });
      setSchoolList(updatedSchoolList);

      // 2. Update school in DB if it's not a mock school
      if (!editingCell.id.startsWith('inst-')) {
        const { error: schoolError } = await supabase
          .from('institusi_pendidikan')
          .update({ [editingCell.field]: parsed })
          .eq('id', editingCell.id);

        if (schoolError) {
          console.error(schoolError);
          alert('Gagal menyimpan perubahan sekolah ke database.');
          fetchData();
          setEditingCell(null);
          return;
        }
      }

      // 3. Recalculate kabkota aggregates
      const newKabNominal = updatedSchoolList.reduce((sum, item) => sum + item.nominal_alokasi, 0);
      const newKabRealisasi = updatedSchoolList.reduce((sum, item) => sum + item.realisasi_total, 0);

      // 4. Update kabkota aggregate in DB
      const { error: kabError } = await supabase
        .from('alokasi_kabupaten_kota')
        .update({
          nominal_alokasi: newKabNominal,
          realisasi_total: newKabRealisasi,
        })
        .eq('id', kabkotaData.id);

      if (kabError) {
        console.error(kabError);
        alert('Gagal memperbarui total kabupaten/kota di database.');
        fetchData();
        setEditingCell(null);
        return;
      }

      // 5. Update province aggregate in DB
      const { data: kabList, error: fetchKabError } = await supabase
        .from('alokasi_kabupaten_kota')
        .select('id, nominal_alokasi, realisasi_total')
        .eq('alokasi_provinsi_id', provData.id);

      if (fetchKabError || !kabList) {
        console.error(fetchKabError);
        alert('Gagal mengambil data kabupaten/kota untuk pembaharuan provinsi.');
        fetchData();
        setEditingCell(null);
        return;
      }

      const newProvNominal = kabList.reduce((sum, item) => {
        if (item.id === kabkotaData.id) return sum + newKabNominal;
        return sum + Number(item.nominal_alokasi);
      }, 0);

      const newProvRealisasi = kabList.reduce((sum, item) => {
        if (item.id === kabkotaData.id) return sum + newKabRealisasi;
        return sum + Number(item.realisasi_total);
      }, 0);

      const { error: provError } = await supabase
        .from('alokasi_provinsi')
        .update({
          nominal_alokasi: newProvNominal,
          realisasi_total: newProvRealisasi,
        })
        .eq('id', provData.id);

      if (provError) {
        console.error(provError);
        alert('Gagal memperbarui total provinsi.');
        fetchData();
      }
    }
    setEditingCell(null);
  };

  const handleExportSchools = () => {
    if (!kabkotaData) return;
    const headers = ['No', 'Nama Sekolah / Pemilik Rekening', 'Kategori', 'Layanan', 'Nominal Alokasi (Rp)', 'Realisasi Total (Rp)', 'Selisih (Rp)', 'Persentase (%)'];
    const csvRows = [headers.join(',')];
    schoolList.forEach((row, idx) => {
      csvRows.push([
        idx + 1,
        `"${row.nama_institusi}"`,
        row.jenjang,
        `"${row.status_sekolah}"`,
        row.nominal_alokasi,
        row.realisasi_total,
        row.selisih,
        row.persentase_penyerapan,
      ].join(','));
    });
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Penyaluran_Sekolah_${kabkotaData.kabupaten_kota.nama_kabupaten_kota}_TA_${activeTahun}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderEditableCell = (row: InstitusiPendidikan, field: 'nominal_alokasi' | 'realisasi_total') => {
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

  // Status Pencairan display helper
  const getPencairanStatusBadge = (pct: number) => {
    if (pct >= 100) {
      return <span className="badge bg-emerald-100 text-emerald-700 border-emerald-300">🟢 Sudah Masuk</span>;
    }
    if (pct > 0) {
      return <span className="badge bg-amber-100 text-amber-700 border-amber-300">🟡 Proses ({pct}%)</span>;
    }
    return <span className="badge bg-rose-100 text-rose-700 border-rose-300">🔴 Belum Masuk</span>;
  };

  return (
    <div className="min-h-screen">
      <Header
        title={`Pagu Kabupaten/Kota: ${kabkotaData.kabupaten_kota.nama_kabupaten_kota}`}
        subtitle={`Provinsi ${provData.provinsi.nama_provinsi} — Status Pencairan Rekening Sekolah Tahun ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Navigation & Actions */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/dashboard/provinsi" className="hover:text-accent hover:underline">Pagu Provinsi</Link>
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
              onClick={handleExportSchools} 
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
              Summary Penyaluran Dana Area
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Summary]</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-center" style={{ width: 160 }}>Tahun Anggaran</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Alokasi Pagu</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Dana Cair</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Dana Pending</th>
                  <th className="sheet-header-cell text-center" style={{ width: 200 }}>Rasio Penyaluran</th>
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
        {/* 2. KATEGORI SEKOLAH TABLE */}
        {/* ============================================================ */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <School size={16} className="text-indigo-500" />
              Porsi Penyaluran per Kategori Sekolah
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Proporsi Kategori]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="sheet-table w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 80 }}>Nomor</th>
                  <th className="sheet-header-cell text-left">Kategori Penerima</th>
                  <th className="sheet-header-cell text-right" style={{ width: 180 }}>Jumlah Sekolah</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 240 }}>Pagu Alokasi</th>
                  <th className="sheet-header-cell text-center" style={{ width: 180 }}>Porsi Dana (%)</th>
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
              Status Pencairan Dana ke Rekening Sekolah di {kabkotaData.kabupaten_kota.nama_kabupaten_kota}
            </h3>
            <span className="text-xs text-text-muted font-medium font-mono">[Sheet: Rekening Penerima]</span>
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
                  <th className="sheet-header-cell text-left">Nama Sekolah / Rekening Penerima</th>
                  <th className="sheet-header-cell text-center" style={{ width: 140 }}>Layanan</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Alokasi Pagu (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Dana Cair (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 220 }}>Dana Pending (Rp)</th>
                  <th className="sheet-header-cell text-center" style={{ width: 180 }}>Status Pencairan</th>
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
                        {row.status_sekolah === 'NEGERI' ? 'Konvensional' : 'Syariah'}
                      </span>
                    </td>
                    {renderEditableCell(row, 'nominal_alokasi')}
                    {renderEditableCell(row, 'realisasi_total')}
                    <td className="sheet-cell text-right font-mono text-rose-600 bg-rose-50/5">
                      {fmtRupiah(row.selisih)}
                    </td>
                    <td className="sheet-cell text-center">
                      {getPencairanStatusBadge(row.persentase_penyerapan)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {/* Realisasi Anggaran Row (Identical to Google Sheets Screenshot) */}
                <tr className="border-t-2 border-slate-300">
                  <td className="sheet-cell font-bold text-center bg-slate-100 text-slate-700 border-r border-slate-200" colSpan={3}>
                    Total / Realisasi Dana Cair
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
          <span>✏️</span>
          <span>Klik langsung pada kolom <strong>Alokasi Pagu</strong> atau <strong>Dana Cair</strong> untuk mengubah data transfer • Tekan <strong>Enter</strong> untuk menyimpan • Limit {itemsPerPage} data per halaman</span>
        </p>
      </div>
    </div>
  );
}
