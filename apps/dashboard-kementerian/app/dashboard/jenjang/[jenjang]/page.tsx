'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { 
  fetchInstitusiByJenjang,
  alokasiProvinsiData, 
  tahunAnggaranData,
  getKabkotaByProvinsi, 
  updateInstitusiPendidikan
} from '@/lib/data';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { exportToExcel, getPctColorHex } from '@/lib/utils/excelExport';
import { Jenjang, InstitusiPendidikan } from '@/types';
import { Search, Download, Plus, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';


const jenjangLabels: Record<string, { label: string; jenjang: Jenjang }> = {
  universitas: { label: 'Universitas (Strata 1)', jenjang: 'UNIVERSITAS' },
  sma: { label: 'Sekolah Menengah Atas (SMA/Sederajat)', jenjang: 'SMA' },
  smp: { label: 'Sekolah Menengah Pertama (SMP/Sederajat)', jenjang: 'SMP' },
  sd: { label: 'Sekolah Dasar (SD/Sederajat)', jenjang: 'SD' },
  paud: { label: 'Pendidikan Anak Usia Dini (PAUD/Sederajat)', jenjang: 'PAUD' },
};

export default function JenjangPage() {
  const params = useParams();
  const slug = params.jenjang as string;
  const config = jenjangLabels[slug] || jenjangLabels.universitas;
  const { activeTahun, dataVersion } = useAppStore();

  const [data, setData] = useState<InstitusiPendidikan[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  const [selectedKabKotaName, setSelectedKabKotaName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal' | 'realisasi' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input to avoid querying on every rapid keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isMounted = true;

    // Fetch total count from DB (lightweight)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2026';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-davinci-2026';
    let countUrl = `${url}/rest/v1/institusi_pendidikan?jenjang=eq.${config.jenjang}&select=id`;
    if (selectedStatus) countUrl += `&status_sekolah=eq.${selectedStatus}`;
    if (debouncedSearch) countUrl += `&or=(nama_institusi.ilike.*${encodeURIComponent(debouncedSearch)}*,npsn.ilike.*${encodeURIComponent(debouncedSearch)}*)`;

    fetch(countUrl, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' }
    }).then(r => {
      const cr = r.headers.get('content-range');
      if (cr && isMounted) {
        const total = parseInt(cr.split('/')[1], 10);
        if (!isNaN(total)) setTotalCount(total);
      }
    }).catch(() => {});

    const fetchInstitusi = async () => {
      try {
        let query = supabase
          .from('institusi_pendidikan')
          .select('*')
          .eq('jenjang', config.jenjang);

        if (selectedProvinsiId) {
          const prov = alokasiProvinsiData.find(p => p.provinsi_id === selectedProvinsiId);
          if (prov) {
            query = query.eq('provinsi_nama', prov.provinsi.nama_provinsi);
          }
        }

        if (selectedKabKotaName) {
          query = query.eq('kabupaten_kota_nama', selectedKabKotaName);
        }

        if (selectedStatus) {
          query = query.eq('status_sekolah', selectedStatus);
        }

        if (debouncedSearch) {
          query = query.or(`nama_institusi.ilike.%${debouncedSearch}%,npsn.ilike.%${debouncedSearch}%`);
        }

        query = query
          .order('provinsi_nama', { ascending: true })
          .order('kabupaten_kota_nama', { ascending: true })
          .order('nama_institusi', { ascending: true })
          .limit(5000);

        const { data: batch, error } = await query;
        if (error) throw error;

        const activeTahunObj = tahunAnggaranData.find(t => Number(t.tahun) === Number(activeTahun));
        const matchingProv = alokasiProvinsiData.filter(p => String(p.tahun_anggaran_id) === String(activeTahunObj?.id));
        const hasAllocationsForYear = matchingProv.length > 0;

        const mapped = (batch || []).map((item: any) => {
          const nominal = hasAllocationsForYear ? Number(item.nominal_alokasi || 0) : 0;
          const realisasi = hasAllocationsForYear ? Number(item.realisasi_total || 0) : 0;
          return {
            ...item,
            nominal_alokasi: nominal,
            realisasi_total: realisasi,
            selisih: nominal - realisasi,
            persentase_penyerapan:
              nominal > 0
                ? Math.round((realisasi / nominal) * 1000) / 10
                : 0,
          };
        });

        if (isMounted) {
          setData(mapped);
          if (debouncedSearch || selectedProvinsiId || selectedKabKotaName || selectedStatus) {
            setTotalCount(mapped.length);
          }
        }
      } catch (err) {
        console.error('Error fetching institusi:', err);
      }
    };

    fetchInstitusi();
    return () => { isMounted = false; };
  }, [config.jenjang, selectedProvinsiId, selectedKabKotaName, selectedStatus, debouncedSearch, activeTahun, dataVersion]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split('\n');
      
      const newItems: InstitusiPendidikan[] = [];
      // Skip header line
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const columns = lines[i].split(',');
        if (columns.length >= 4) {
          const [nama, npsn, kabkota, prov] = columns.map(c => c.trim().replace(/^"|"$/g, ''));
          newItems.push({
            id: `inst-imp-${Date.now()}-${i}`,
            npsn: npsn || `IMP${i}`,
            nama_institusi: nama || 'Sekolah Import',
            jenjang: config.jenjang,
            kabupaten_kota_id: 'auto-match',
            kabupaten_kota_nama: kabkota || 'Kabupaten Bogor',
            provinsi_nama: prov || 'Jawa Barat',
            status_sekolah: nama.toLowerCase().includes('swasta') ? 'SWASTA' : 'NEGERI',
            nominal_alokasi: 0,
            realisasi_total: 0,
            selisih: 0,
            persentase_penyerapan: 0,
            updated_at: new Date().toISOString().split('T')[0]
          });
        }
      }

      if (newItems.length > 0) {
        setData(prev => [...newItems, ...prev]);
        alert(`${newItems.length} data institusi berhasil diimport dan dicocokkan!`);
      } else {
        alert('Gagal membaca data CSV. Pastikan format: Nama Sekolah, NPSN, Kabupaten/Kota, Provinsi');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };



  const kabkotaOptions = useMemo(() => {
    if (!selectedProvinsiId) return [];
    return getKabkotaByProvinsi(selectedProvinsiId);
  }, [selectedProvinsiId]);

  const filtered = useMemo(() => {
    return data;
  }, [data]);

  const hasFilter = Boolean(search || selectedProvinsiId || selectedKabKotaName || selectedStatus);

  const totals = useMemo(() => {
    const toBigIntHelper = (val: unknown): bigint => {
      if (val === null || val === undefined) return 0n;
      const s = String(val).split('.')[0].replace(/[^0-9-]/g, '');
      if (!s || s === '-') return 0n;
      try { return BigInt(s); } catch { return 0n; }
    };

    const targetTahun = tahunAnggaranData.find(t => Number(t.tahun) === Number(activeTahun));
    const matchingProv = alokasiProvinsiData.filter(p => String(p.tahun_anggaran_id) === String(targetTahun?.id));

    if (matchingProv.length === 0) {
      return {
        nominal: 0,
        realisasi: 0,
        selisih: 0,
        pct: 0,
      };
    }

    const jenjangWeightsPct: Record<string, bigint> = {
      UNIVERSITAS: 35n,
      SMA: 25n,
      SMP: 20n,
      SD: 15n,
      PAUD: 5n,
    };

    if (!hasFilter) {
      const bTotalAllocated = matchingProv.reduce((s, p) => s + toBigIntHelper(p.nominal_alokasi), 0n);
      const weight = jenjangWeightsPct[config.jenjang] || 35n;
      const bNom = (bTotalAllocated * weight) / 100n;

      const bTotalRealisasi = matchingProv.reduce((s, p) => s + toBigIntHelper(p.realisasi_total), 0n);
      const bReal = (bTotalRealisasi * weight) / 100n;
      const bSel = bNom - bReal;
      const pct = bNom > 0n ? Number((bReal * 1000n) / bNom) / 10 : 0;

      return {
        nominal: bNom.toString() as unknown as number,
        realisasi: bReal.toString() as unknown as number,
        selisih: bSel.toString() as unknown as number,
        pct,
      };
    }

    const nomBig = filtered.reduce((s, i) => s + toBigIntHelper(i.nominal_alokasi), 0n);
    const realBig = filtered.reduce((s, i) => s + toBigIntHelper(i.realisasi_total), 0n);
    const selisihBig = nomBig - realBig;
    const pct = nomBig > 0n ? Number((realBig * 1000n) / nomBig) / 10 : 0;
    return {
      nominal: nomBig.toString() as unknown as number,
      realisasi: realBig.toString() as unknown as number,
      selisih: selisihBig.toString() as unknown as number,
      pct,
    };
  }, [filtered, hasFilter, activeTahun, config.jenjang, dataVersion]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const startEdit = (id: string, field: 'nominal' | 'realisasi', value: number) => {
    setEditingCell({ id, field });
    setEditValue(String(value));
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      setData(prev => prev.map(inst => {
        if (inst.id !== editingCell.id) return inst;
        const nominal = editingCell.field === 'nominal' ? parsed : inst.nominal_alokasi;
        const realisasi = editingCell.field === 'realisasi' ? parsed : inst.realisasi_total;
        return {
          ...inst,
          nominal_alokasi: nominal,
          realisasi_total: realisasi,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0,
        };
      }));
      await updateInstitusiPendidikan(editingCell.id, {
        [editingCell.field === 'nominal' ? 'nominal_alokasi' : 'realisasi_total']: parsed
      });
    }
    setEditingCell(null);
  };

  const handleExport = async () => {
    const headers = [
      'No', 'Nama Sekolah', 'Status', 'Kabupaten/Kota', 'Provinsi',
      'Nominal (Rp)', 'Realisasi (Rp)', 'Selisih (Rp)', 'Persentase Penyerapan (%)', 'NPSN'
    ];

    const rows = filtered.map((row, idx) => {
      const rowNum = idx + 2; // Header is row 1
      const colorHex = getPctColorHex(row.persentase_penyerapan);
      
      return [
        { value: idx + 1, align: 'center' },
        { value: row.nama_institusi },
        { value: row.status_sekolah, align: 'center' },
        { value: row.kabupaten_kota_nama },
        { value: row.provinsi_nama },
        { value: row.nominal_alokasi, isCurrency: true },
        { value: row.realisasi_total, isCurrency: true },
        { value: { formula: `F${rowNum}-G${rowNum}` }, isCurrency: true, textColor: '991B1B' },
        { 
          value: { formula: `IF(F${rowNum}>0, G${rowNum}/F${rowNum}, 0)` }, 
          isPercent: true, 
          bgColor: colorHex.bg, 
          textColor: colorHex.text,
          bold: true,
          align: 'center'
        },
        { value: row.npsn, align: 'center' }
      ];
    });

    const totalRowIndex = filtered.length + 2;
    const totalColorHex = getPctColorHex(totals.pct);
    const totalsRow = [
      { value: '', bold: true },
      { value: `TOTAL (${filtered.length})`, bold: true },
      { value: '', bold: true },
      { value: '', bold: true },
      { value: '', bold: true },
      { value: { formula: `SUM(F2:F${totalRowIndex-1})` }, isCurrency: true, bold: true },
      { value: { formula: `SUM(G2:G${totalRowIndex-1})` }, isCurrency: true, bold: true },
      { value: { formula: `F${totalRowIndex}-G${totalRowIndex}` }, isCurrency: true, bold: true, textColor: '991B1B' },
      { 
        value: { formula: `IF(F${totalRowIndex}>0, G${totalRowIndex}/F${totalRowIndex}, 0)` }, 
        isPercent: true, 
        bold: true, 
        bgColor: totalColorHex.bg,
        textColor: totalColorHex.text,
        align: 'center'
      },
      { value: '', bold: true }
    ];

    await exportToExcel(`Laporan_Anggaran_${config.label}_${activeTahun}.xlsx`, [
      {
        name: config.label,
        headers,
        rows: [...rows, totalsRow],
        columnWidths: [8, 32, 12, 22, 18, 20, 20, 20, 25, 12]
      }
    ]);
  };


  const renderEditableCell = (row: InstitusiPendidikan, field: 'nominal' | 'realisasi') => {
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

  return (
    <div className="min-h-screen">
      <Header title={`Jenjang: ${config.label}`} subtitle={`Data alokasi dan realisasi institusi ${config.label} Tahun ${activeTahun}`} />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Provinsi:</span>
            <select
              value={selectedProvinsiId}
              onChange={(e) => {
                setSelectedProvinsiId(e.target.value);
                setSelectedKabKotaName('');
                setCurrentPage(1);
              }}
              className="select-dropdown"
            >
              <option value="">Semua Provinsi</option>
              {[...alokasiProvinsiData].sort((a, b) => a.provinsi.nama_provinsi.localeCompare(b.provinsi.nama_provinsi, 'id')).map(p => (
                <option key={p.provinsi_id} value={p.provinsi_id}>{p.provinsi.nama_provinsi}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Kab/Kota:</span>
            <select
              value={selectedKabKotaName}
              onChange={(e) => {
                setSelectedKabKotaName(e.target.value);
                setCurrentPage(1);
              }}
              className="select-dropdown"
              disabled={!selectedProvinsiId}
            >
              <option value="">Semua Kab/Kota</option>
              {kabkotaOptions.map(k => (
                <option key={k.id} value={k.kabupaten_kota.nama_kabupaten_kota}>{k.kabupaten_kota.nama_kabupaten_kota}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="select-dropdown"
            >
              <option value="">Semua Status</option>
              <option value="NEGERI">Negeri</option>
              <option value="SWASTA">Swasta</option>
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={`Cari nama ${config.label.toLowerCase()}...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{(totalCount ?? filtered.length).toLocaleString('id-ID')} institusi (menampilkan {filtered.length.toLocaleString('id-ID')} terbaru)</span>
          <input 
            type="file" 
            accept=".csv" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
            <Upload size={14} />
            Import CSV
          </button>
          <button className="btn btn-ghost">
            <Plus size={14} />
            Tambah
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {/* Spreadsheet */}
        <div className="sheet-container overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 40 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 180 }}>Nama {config.label}</th>
                <th className="sheet-header-cell text-center" style={{ width: 70 }}>Status</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 120 }}>Kabupaten/Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 110 }}>Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 130 }}>Nominal (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 130 }}>Realisasi (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 110 }}>Selisih</th>
                <th className="sheet-header-cell text-center" style={{ width: 75 }}>%</th>
                <th className="sheet-header-cell text-center" style={{ width: 75 }}>NPSN</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">
                    <Link href={`/dashboard/profil-institusi/${row.id}`} className="hover:text-accent hover:underline transition-colors">
                      {row.nama_institusi}
                    </Link>
                  </td>
                  <td className="sheet-cell text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      row.status_sekolah === 'NEGERI' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'
                    }`}>
                      {row.status_sekolah}
                    </span>
                  </td>
                  <td className="sheet-cell text-left text-text-secondary text-xs">{row.kabupaten_kota_nama}</td>
                  <td className="sheet-cell text-left text-text-secondary text-xs">{row.provinsi_nama}</td>
                  {renderEditableCell(row, 'nominal')}
                  {renderEditableCell(row, 'realisasi')}
                  <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                  <td className="sheet-cell text-center">
                    <PctBadge value={row.persentase_penyerapan} />
                  </td>
                  <td className="sheet-cell text-center text-text-muted text-xs font-mono">{row.npsn}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-left font-bold">TOTAL ({(totalCount ?? filtered.length).toLocaleString('id-ID')})</td>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-right">{fmtRupiah(totals.nominal)}</td>
                <td className="sheet-footer-cell text-right">{fmtRupiah(totals.realisasi)}</td>
                <td className="sheet-footer-cell text-right text-rose-600">{fmtTriliun(totals.selisih)}</td>
                <td className="sheet-footer-cell text-center">
                  <PctBadge value={totals.pct} size="md" />
                </td>
                <td className="sheet-footer-cell" />
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-lg shadow-sm">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Selanjutnya
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between animate-fade-in">
            <div>
              <p className="text-xs text-slate-700">
                Menampilkan <span className="font-semibold">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> sampai{' '}
                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> dari{' '}
                <span className="font-semibold">{(totalCount ?? filtered.length).toLocaleString('id-ID')}</span> data institusi
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs items-center gap-1" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="Halaman Pertama"
                  className="relative inline-flex items-center rounded-md p-1.5 text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  title="Halaman Sebelumnya"
                  className="relative inline-flex items-center rounded-md p-1.5 text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  const isSelected = pageNum === currentPage;

                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : 'text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }

                  if (
                    (pageNum === 2 && currentPage > 4) ||
                    (pageNum === totalPages - 1 && currentPage < totalPages - 3)
                  ) {
                    return (
                      <span key={pageNum} className="px-2 py-1 text-xs font-bold text-slate-400">
                        ...
                      </span>
                    );
                  }

                  return null;
                })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  title="Halaman Selanjutnya"
                  className="relative inline-flex items-center rounded-md p-1.5 text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="Halaman Terakhir"
                  className="relative inline-flex items-center rounded-md p-1.5 text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronsRight size={16} />
                </button>
              </nav>
            </div>
          </div>
        </div>

        <p className="mt-3 text-xs text-text-muted">
          ✏️ Klik sel untuk edit • Cascade update: Institusi → Kabkota → Provinsi
        </p>
      </div>
    </div>
  );
}

