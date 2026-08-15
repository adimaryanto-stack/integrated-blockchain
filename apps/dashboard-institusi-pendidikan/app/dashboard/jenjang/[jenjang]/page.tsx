'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { Jenjang, InstitusiPendidikan } from '@/types';
import { Search, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

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
  const { activeTahun } = useAppStore();

  const [data, setData] = useState<InstitusiPendidikan[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinsiList, setProvinsiList] = useState<{ id: string; nama: string }[]>([]);
  const [kabkotaList, setKabkotaList] = useState<string[]>([]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProvinsiNama, setSelectedProvinsiNama] = useState('');
  const [selectedKabKotaName, setSelectedKabKotaName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, selectedProvinsiNama, selectedKabKotaName, selectedStatus]);

  // Reset kabkota when province changes
  useEffect(() => {
    setSelectedKabKotaName('');
    setKabkotaList([]);
    if (!selectedProvinsiNama) return;
    // Fetch unique kabkota for the selected province & jenjang from DB
    supabase
      .from('institusi_pendidikan')
      .select('kabupaten_kota_nama')
      .eq('jenjang', config.jenjang)
      .eq('provinsi_nama', selectedProvinsiNama)
      .order('kabupaten_kota_nama', { ascending: true })
      .then(({ data: rows }) => {
        if (rows) {
          const unique = [...new Set(rows.map((r: any) => r.kabupaten_kota_nama).filter(Boolean))];
          setKabkotaList(unique);
        }
      });
  }, [selectedProvinsiNama, config.jenjang]);

  // Fetch province list once
  useEffect(() => {
    supabase
      .from('provinsi')
      .select('id, nama_provinsi')
      .order('nama_provinsi', { ascending: true })
      .then(({ data: rows }) => {
        if (rows) {
          setProvinsiList(rows.map((r: any) => ({ id: r.id, nama: r.nama_provinsi })));
        }
      });
  }, []);

  // Fetch institutions from DB
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetch = async () => {
      try {
        let query = supabase
          .from('institusi_pendidikan')
          .select('*')
          .eq('jenjang', config.jenjang);

        if (selectedProvinsiNama) query = query.eq('provinsi_nama', selectedProvinsiNama);
        if (selectedKabKotaName) query = query.eq('kabupaten_kota_nama', selectedKabKotaName);
        if (selectedStatus) query = query.eq('status_sekolah', selectedStatus);
        if (debouncedSearch) query = query.or(`nama_institusi.ilike.%${debouncedSearch}%,npsn.ilike.%${debouncedSearch}%`);

        query = query
          .order('provinsi_nama', { ascending: true })
          .order('kabupaten_kota_nama', { ascending: true })
          .order('nama_institusi', { ascending: true })
          .limit(5000);

        const { data: list, error } = await query;
        if (error) throw error;

        const mapped = (list || []).map((item: any) => ({
          ...item,
          nominal_alokasi: Number(item.nominal_alokasi || 0),
          realisasi_total: Number(item.realisasi_total || 0),
          selisih: Number(item.nominal_alokasi || 0) - Number(item.realisasi_total || 0),
          persentase_penyerapan:
            Number(item.nominal_alokasi) > 0
              ? Math.round((Number(item.realisasi_total) / Number(item.nominal_alokasi)) * 1000) / 10
              : 0,
        }));

        if (isMounted) {
          setData(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };

    fetch();
    return () => { isMounted = false; };
  }, [config.jenjang, selectedProvinsiNama, selectedKabKotaName, selectedStatus, debouncedSearch]);

  const filtered = useMemo(() => data, [data]);

  const totals = useMemo(() => {
    const nom = filtered.reduce((s, i) => s + i.nominal_alokasi, 0);
    const real = filtered.reduce((s, i) => s + i.realisasi_total, 0);
    return { nominal: nom, realisasi: real, selisih: nom - real, pct: nom > 0 ? (real / nom) * 100 : 0 };
  }, [filtered]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title={`Jenjang: ${config.label}`} subtitle={`Data institusi ${config.label} — memuat dari database lokal...`} />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title={`Jenjang: ${config.label}`} subtitle={`Data alokasi dan realisasi institusi ${config.label} Tahun ${activeTahun}`} />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Provinsi:</span>
            <select
              value={selectedProvinsiNama}
              onChange={(e) => setSelectedProvinsiNama(e.target.value)}
              className="select-dropdown"
            >
              <option value="">Semua Provinsi</option>
              {provinsiList.map(p => (
                <option key={p.id} value={p.nama}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Kab/Kota:</span>
            <select
              value={selectedKabKotaName}
              onChange={(e) => setSelectedKabKotaName(e.target.value)}
              className="select-dropdown"
              disabled={!selectedProvinsiNama}
            >
              <option value="">Semua Kab/Kota</option>
              {kabkotaList.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
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
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length.toLocaleString('id-ID')} institusi</span>
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
              {paginatedRows.map((row, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                return (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{globalIdx}</td>
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
                    <td className="sheet-cell text-right">{fmtRupiah(row.nominal_alokasi)}</td>
                    <td className="sheet-cell text-right">{fmtRupiah(row.realisasi_total)}</td>
                    <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                    <td className="sheet-cell text-center">
                      <PctBadge value={row.persentase_penyerapan} />
                    </td>
                    <td className="sheet-cell text-center text-text-muted text-xs font-mono">{row.npsn}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td className="sheet-footer-cell" />
                <td className="sheet-footer-cell text-left font-bold">TOTAL ({filtered.length.toLocaleString('id-ID')})</td>
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
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <p className="text-xs text-slate-700">
              Menampilkan{' '}
              <span className="font-semibold">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>{' '}
              sampai{' '}
              <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span>{' '}
              dari{' '}
              <span className="font-semibold">{filtered.length.toLocaleString('id-ID')}</span>{' '}
              data institusi
            </p>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-xs items-center gap-1">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} title="Pertama" className="relative inline-flex items-center rounded-md p-1.5 text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronsLeft size={16} /></button>
              <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} title="Sebelumnya" className="relative inline-flex items-center rounded-md p-1.5 text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronLeft size={16} /></button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pg = idx + 1;
                if (pg === 1 || pg === totalPages || (pg >= currentPage - 2 && pg <= currentPage + 2)) {
                  return (
                    <button key={pg} onClick={() => setCurrentPage(pg)} className={`relative inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${pg === currentPage ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'text-slate-700 border-slate-200 hover:bg-slate-50'}`}>{pg}</button>
                  );
                }
                if ((pg === 2 && currentPage > 4) || (pg === totalPages - 1 && currentPage < totalPages - 3)) {
                  return <span key={pg} className="px-2 py-1 text-xs font-bold text-slate-400">...</span>;
                }
                return null;
              })}
              <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} title="Selanjutnya" className="relative inline-flex items-center rounded-md p-1.5 text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronRight size={16} /></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} title="Terakhir" className="relative inline-flex items-center rounded-md p-1.5 text-slate-400 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"><ChevronsRight size={16} /></button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
