'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { alokasiProvinsiData } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah } from '@/lib/utils/formatters';
import { Jenjang, InstitusiPendidikan } from '@/types';
import { Search, ExternalLink, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const jenjangOptions: { value: '' | Jenjang; label: string }[] = [
  { value: '', label: 'Semua Jenjang' },
  { value: 'UNIVERSITAS', label: 'Universitas' },
  { value: 'SMA', label: 'SMA' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SD', label: 'SD' },
  { value: 'PAUD', label: 'PAUD' },
];

export default function ProfilInstitusiPage() {
  const { activeTahun } = useAppStore();
  const [data, setData] = useState<InstitusiPendidikan[]>([]);
  const [isLoadingInstitusi, setIsLoadingInstitusi] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState<'' | Jenjang>('');
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    let isMounted = true;
    setIsLoadingInstitusi(true);

    const fetchInstitusi = async () => {
      try {
        let query = supabase.from('institusi_pendidikan').select('*');

        if (selectedJenjang) {
          query = query.eq('jenjang', selectedJenjang);
        }

        if (selectedProvinsiId) {
          const prov = alokasiProvinsiData.find(p => p.provinsi_id === selectedProvinsiId);
          if (prov) {
            query = query.eq('provinsi_nama', prov.provinsi.nama_provinsi);
          }
        }

        if (search) {
          query = query.ilike('nama_institusi', `%${search}%`);
        }

        query = query
          .order('provinsi_nama', { ascending: true })
          .order('kabupaten_kota_nama', { ascending: true })
          .order('nama_institusi', { ascending: true })
          .limit(5000);

        const { data: batch, error } = await query;
        if (error) throw error;

        const { data: yearRow } = await supabase
          .from('tahun_anggaran')
          .select('id')
          .eq('tahun', activeTahun)
          .maybeSingle();

        const { count: allocCount } = await supabase
          .from('alokasi_provinsi')
          .select('*', { count: 'exact', head: true })
          .eq('tahun_anggaran_id', yearRow?.id || '');

        const hasAllocationsForYear = (allocCount || 0) > 0;

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
          setIsLoadingInstitusi(false);
        }
      } catch (err) {
        console.error('Error fetching institusi:', err);
        if (isMounted) {
          setIsLoadingInstitusi(false);
        }
      }
    };

    fetchInstitusi();
    return () => {
      isMounted = false;
    };
  }, [selectedJenjang, selectedProvinsiId, search, activeTahun]);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedJenjang, selectedProvinsiId, search]);

  const filtered = useMemo(() => {
    return [...data].sort((a, b) => {
      const provCompare = (a.provinsi_nama || '').localeCompare(b.provinsi_nama || '', 'id');
      if (provCompare !== 0) return provCompare;
      const kabCompare = (a.kabupaten_kota_nama || '').localeCompare(b.kabupaten_kota_nama || '', 'id');
      if (kabCompare !== 0) return kabCompare;
      return (a.nama_institusi || '').localeCompare(b.nama_institusi || '', 'id');
    });
  }, [data]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  return (
    <div className="min-h-screen">
      <Header
        title="Profil Institusi"
        subtitle="Klik nama institusi untuk detail profil & alokasi keuangan"
      />

      <div className="p-6">
        {/* Loading Indicator */}
        {isLoadingInstitusi && (
          <div className="mb-4 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg">
            <Loader2 size={13} className="animate-spin" />
            Memuat data institusi dari Database Lokal...
          </div>
        )}

        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Jenjang:</span>
            <select
              value={selectedJenjang}
              onChange={(e) => setSelectedJenjang(e.target.value as '' | Jenjang)}
              className="select-dropdown"
            >
              {jenjangOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Provinsi:</span>
            <select
              value={selectedProvinsiId}
              onChange={(e) => setSelectedProvinsiId(e.target.value)}
              className="select-dropdown"
            >
              <option value="">Semua Provinsi</option>
              {alokasiProvinsiData.map(p => (
                <option key={p.provinsi_id} value={p.provinsi_id}>{p.provinsi.nama_provinsi}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari nama institusi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length.toLocaleString('id-ID')} institusi</span>
        </div>

        {/* Table */}
        <div className="sheet-container overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 40 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 220 }}>Nama Institusi</th>
                <th className="sheet-header-cell text-center" style={{ width: 100 }}>Jenjang</th>
                <th className="sheet-header-cell text-center" style={{ width: 80 }}>Status</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 140 }}>Kabupaten/Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 130 }}>Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 140 }}>Nominal (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 140 }}>Realisasi (Rp)</th>
                <th className="sheet-header-cell text-center" style={{ width: 75 }}>%</th>
                <th className="sheet-header-cell text-center" style={{ width: 50 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">
                    <Link
                      href={`/dashboard/profil-institusi/${row.id}`}
                      className="hover:text-accent hover:underline transition-colors"
                    >
                      {row.nama_institusi}
                    </Link>
                  </td>
                  <td className="sheet-cell text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                      row.jenjang === 'UNIVERSITAS' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                      : row.jenjang === 'SMA' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : row.jenjang === 'SMP' ? 'bg-sky-100 text-sky-700 border border-sky-200'
                      : row.jenjang === 'SD' ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-pink-100 text-pink-700 border border-pink-200'
                    }`}>
                      {row.jenjang}
                    </span>
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
                  <td className="sheet-cell text-right font-mono">{fmtRupiah(row.nominal_alokasi)}</td>
                  <td className="sheet-cell text-right font-mono">{fmtRupiah(row.realisasi_total)}</td>
                  <td className="sheet-cell text-center">
                    <PctBadge value={row.persentase_penyerapan} />
                  </td>
                  <td className="sheet-cell text-center">
                    <Link
                      href={`/dashboard/profil-institusi/${row.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md hover:bg-indigo-100 text-text-muted hover:text-accent transition-colors"
                      title="Lihat Profil"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-lg shadow-sm">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between animate-fade-in">
            <div>
              <p className="text-xs text-slate-700">
                Menampilkan <span className="font-semibold">{filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> sampai{' '}
                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> dari{' '}
                <span className="font-semibold">{filtered.length.toLocaleString('id-ID')}</span> data institusi
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
          🏫 Klik nama institusi atau ikon untuk melihat detail profil keuangan
        </p>
      </div>
    </div>
  );
}
