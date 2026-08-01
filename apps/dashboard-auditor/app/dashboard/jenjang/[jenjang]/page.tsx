'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { getInstitusiByJenjang, alokasiProvinsiData, getKabkotaByProvinsi, tahunAnggaranData } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { Jenjang, InstitusiPendidikan } from '@/types';
import { Search, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import EditableCell from '@/components/spreadsheet/EditableCell';
import { rollupInstitusiChange } from '@/lib/utils/dbSync';

const jenjangLabels: Record<string, { label: string; jenjang: Jenjang }> = {
  universitas: { label: 'Universitas', jenjang: 'UNIVERSITAS' },
  sma: { label: 'SMA', jenjang: 'SMA' },
  smp: { label: 'SMP', jenjang: 'SMP' },
  sd: { label: 'SD', jenjang: 'SD' },
  paud: { label: 'PAUD', jenjang: 'PAUD' },
};

export default function JenjangPage() {
  const params = useParams();
  const slug = params.jenjang as string;
  const config = jenjangLabels[slug] || jenjangLabels.universitas;
  const { activeTahun, isSupabaseMode, dbData, setDbData, updateInstitusiData } = useAppStore();

  const [isLoadingInstitusi, setIsLoadingInstitusi] = useState(false);

  // Lazy-load institusi dari Supabase jika belum ada di dbData
  useEffect(() => {
    if (!isSupabaseMode || !dbData) return;
    if (dbData.institusi_pendidikan.length > 0) return; // sudah ada

    setIsLoadingInstitusi(true);
    supabase
      .from('institusi_pendidikan')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data) {
          updateInstitusiData(data);
        }
        setIsLoadingInstitusi(false);
      });
  }, [isSupabaseMode, dbData]);

  const rawData = useMemo(() => {
    const list = getInstitusiByJenjang(config.jenjang);

    if (isSupabaseMode && dbData && dbData.institusi_pendidikan.length > 0) {
      // Filter dari dbData yang sudah lazy-loaded
      return dbData.institusi_pendidikan
        .filter((i: any) => i.jenjang === config.jenjang)
        .map((item: any) => ({
          ...item,
          nominal_alokasi: Number(item.nominal_alokasi),
          realisasi_total: Number(item.realisasi_total),
          selisih: Number(item.nominal_alokasi) - Number(item.realisasi_total),
          persentase_penyerapan:
            Number(item.nominal_alokasi) > 0
              ? Math.round((Number(item.realisasi_total) / Number(item.nominal_alokasi)) * 1000) / 10
              : 0,
        }));
    }

    // Fallback ke mock data dengan scaling tahun
    const targetTahun = tahunAnggaranData.find(t => t.tahun === activeTahun) || tahunAnggaranData[6];
    const baseTahun = tahunAnggaranData[6];
    const scale = targetTahun.total_anggaran > 0 ? targetTahun.total_anggaran / baseTahun.total_anggaran : 1.0;
    const seed = (activeTahun % 7) || 1;
    const shift = 0.95 + (seed * 0.012);

    return list.map(item => {
      const nominal = Math.round(item.nominal_alokasi * scale);
      const realisasi = Math.min(nominal, Math.round(item.realisasi_total * scale * shift));
      return {
        ...item,
        nominal_alokasi: nominal,
        realisasi_total: realisasi,
        selisih: nominal - realisasi,
        persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0
      };
    });
  }, [config.jenjang, activeTahun, isSupabaseMode, dbData]);

  const [data, setData] = useState<InstitusiPendidikan[]>(rawData);

  useEffect(() => {
    setData(rawData);
  }, [rawData]);

  const [search, setSearch] = useState('');
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  const [selectedKabKotaName, setSelectedKabKotaName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const kabkotaOptions = useMemo(() => {
    if (!selectedProvinsiId) return [];
    return getKabkotaByProvinsi(selectedProvinsiId);
  }, [selectedProvinsiId]);

  const filtered = useMemo(() => {
    let result = data;

    if (selectedProvinsiId) {
      const prov = alokasiProvinsiData.find(p => p.provinsi_id === selectedProvinsiId);
      if (prov) {
        result = result.filter(inst => inst.provinsi_nama === prov.provinsi.nama_provinsi);
      }
    }

    if (selectedKabKotaName) {
      result = result.filter(inst => inst.kabupaten_kota_nama === selectedKabKotaName);
    }

    if (selectedStatus) {
      result = result.filter(inst => inst.status_sekolah === selectedStatus);
    }

    if (search) {
      result = result.filter(inst => inst.nama_institusi.toLowerCase().includes(search.toLowerCase()));
    }

    return [...result].sort((a, b) => {
      const provCompare = (a.provinsi_nama || '').localeCompare(b.provinsi_nama || '', 'id');
      if (provCompare !== 0) return provCompare;
      const kabCompare = (a.kabupaten_kota_nama || '').localeCompare(b.kabupaten_kota_nama || '', 'id');
      if (kabCompare !== 0) return kabCompare;
      return (a.nama_institusi || '').localeCompare(b.nama_institusi || '', 'id');
    });
  }, [data, search, selectedProvinsiId, selectedKabKotaName, selectedStatus]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const totals = useMemo(() => {
    const nom = filtered.reduce((s, i) => s + i.nominal_alokasi, 0);
    const real = filtered.reduce((s, i) => s + i.realisasi_total, 0);
    return { nominal: nom, realisasi: real, selisih: nom - real, pct: nom > 0 ? (real / nom) * 100 : 0 };
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const handleCellSave = async (rowId: string, field: 'nominal' | 'realisasi', newValue: number) => {
    setData(prev => prev.map(item => {
      if (item.id === rowId) {
        const nominal = field === 'nominal' ? newValue : item.nominal_alokasi;
        const realisasi = field === 'realisasi' ? newValue : item.realisasi_total;
        return {
          ...item,
          nominal_alokasi: nominal,
          realisasi_total: realisasi,
          selisih: nominal - realisasi,
          persentase_penyerapan: nominal > 0 ? Math.round((realisasi / nominal) * 1000) / 10 : 0
        };
      }
      return item;
    }));

    if (isSupabaseMode && dbData) {
      const updates = field === 'nominal'
        ? { nominal_alokasi: newValue }
        : { realisasi_total: newValue };

      await rollupInstitusiChange(dbData, setDbData, rowId, updates);
    }
  };

  const renderEditableCell = (row: InstitusiPendidikan, field: 'nominal' | 'realisasi') => {
    const value = field === 'nominal' ? row.nominal_alokasi : row.realisasi_total;
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
        title={`Jenjang: ${config.label}`}
        subtitle={`Data alokasi dan realisasi institusi ${config.label} Tahun ${activeTahun}${isSupabaseMode ? ' • Supabase' : ' • Mock Data'}`}
      />

      <div className="p-6">
        {/* Loading Institusi Indicator */}
        {isLoadingInstitusi && (
          <div className="mb-4 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg">
            <Loader2 size={13} className="animate-spin" />
            Memuat data institusi dari Supabase...
          </div>
        )}

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
          <span className="text-xs text-text-muted flex-1">{filtered.length} institusi</span>
          <button className="btn btn-primary">
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
                <th className="sheet-header-cell text-left" style={{ minWidth: 220 }}>Nama {config.label}</th>
                <th className="sheet-header-cell text-center" style={{ width: 90 }}>Status</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 160 }}>Kabupaten/Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 130 }}>Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 160 }}>Nominal (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 160 }}>Realisasi (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 120 }}>Selisih</th>
                <th className="sheet-header-cell text-center" style={{ width: 110 }}>%</th>
                <th className="sheet-header-cell text-center" style={{ width: 80 }}>NPSN</th>
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
                <td className="sheet-footer-cell text-left font-bold">TOTAL ({filtered.length})</td>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-right font-bold font-mono">{fmtRupiah(totals.nominal)}</td>
                <td className="sheet-footer-cell text-right font-bold font-mono">{fmtRupiah(totals.realisasi)}</td>
                <td className="sheet-footer-cell text-right text-rose-600 font-bold font-mono">{fmtRupiah(totals.selisih)}</td>
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
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between animate-fade-in">
            <div>
              <p className="text-xs text-slate-700">
                Menampilkan <span className="font-semibold">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> sampai{' '}
                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> dari{' '}
                <span className="font-semibold">{filtered.length}</span> data institusi
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
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
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
      </div>
    </div>
  );
}
  );
}
