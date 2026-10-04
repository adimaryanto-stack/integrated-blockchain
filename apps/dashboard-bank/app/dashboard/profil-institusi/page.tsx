'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { getAlokasiProvinsi } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah } from '@/lib/utils/formatters';
import { Jenjang, AlokasiProvinsi, InstitusiPendidikan } from '@/types';
import { Search, ExternalLink, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAppStore } from '@/lib/store';

const jenjangOptions: { value: '' | Jenjang; label: string }[] = [
  { value: '', label: 'Semua Kategori' },
  { value: 'UNIVERSITAS', label: 'Universitas' },
  { value: 'SMA', label: 'SMA / SMK' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SD', label: 'SD' },
  { value: 'PAUD', label: 'PAUD' },
];

export default function ProfilInstitusiPage() {
  const { activeTahun } = useAppStore();
  const [allInstitusi, setAllInstitusi] = useState<InstitusiPendidikan[]>([]);
  const [provinsiList, setProvinsiList] = useState<AlokasiProvinsi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJenjang, setSelectedJenjang] = useState<'' | Jenjang>('');
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  // Derived province name so schools-fetch does NOT depend on the full provinsiList array
  const [selectedProvinsiNama, setSelectedProvinsiNama] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [search, selectedJenjang, selectedProvinsiId]);

  // ── 1. Fetch province list (one-shot) ────────────────────
  useEffect(() => {
    let isMounted = true;
    getAlokasiProvinsi(activeTahun)
      .then(provs => { if (isMounted) setProvinsiList(provs); })
      .catch(console.error);
    return () => { isMounted = false; };
  }, [activeTahun]);

  // Deduplicated & Sorted Provinsi Options (A-Z)
  const sortedProvinsiOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: any[] = [];
    for (const item of provinsiList) {
      const pId = item.provinsi_id || item.provinsi?.id;
      if (pId && !seen.has(pId)) {
        seen.add(pId);
        list.push(item);
      }
    }
    return list.sort((a, b) => (a.provinsi?.nama_provinsi || '').localeCompare(b.provinsi?.nama_provinsi || '', 'id'));
  }, [provinsiList]);

  // ── 2. Resolve province name from selected ID ─────────────
  //    (decoupled so schools-fetch never re-runs just because provinsiList loaded)
  useEffect(() => {
    if (!selectedProvinsiId) {
      setSelectedProvinsiNama('');
      return;
    }
    const prov = sortedProvinsiOptions.find((p: any) => p.provinsi_id === selectedProvinsiId)
      || provinsiList.find((p: any) => p.provinsi_id === selectedProvinsiId);
    if (prov) setSelectedProvinsiNama(prov.provinsi.nama_provinsi);
  }, [selectedProvinsiId, sortedProvinsiOptions, provinsiList]);

  // ── 3. Fetch schools — depends only on filter primitives, NOT provinsiList ──
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchSchools = async () => {
      try {
        let query = supabase.from('institusi_pendidikan').select('*');

        if (selectedJenjang) query = query.eq('jenjang', selectedJenjang);
        if (selectedProvinsiNama) query = query.eq('provinsi_nama', selectedProvinsiNama);
        if (search) query = query.ilike('nama_institusi', `%${search}%`);

        query = query
          .order('provinsi_nama', { ascending: true })
          .order('kabupaten_kota_nama', { ascending: true })
          .order('nama_institusi', { ascending: true })
          .limit(5000);

        const { data, error } = await query;
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

        const mapped = (data || []).map((item: any) => {
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
          setAllInstitusi(mapped);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };

    fetchSchools();
    return () => { isMounted = false; };
  // Only re-run when actual filter values change — NOT when provinsiList updates
  }, [selectedJenjang, selectedProvinsiNama, search, activeTahun]);

  const filtered = useMemo(() => allInstitusi, [allInstitusi]);

  // Pagination derived values
  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header
          title="Rekening Sekolah"
          subtitle="Klik nama sekolah untuk melihat detail profil keuangan & mutasi rekening"
        />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Rekening Sekolah"
        subtitle="Klik nama sekolah untuk melihat detail profil keuangan & mutasi rekening"
      />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Kategori:</span>
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
              {sortedProvinsiOptions.map(p => (
                <option key={p.provinsi_id} value={p.provinsi_id}>{p.provinsi.nama_provinsi}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari nama sekolah/rekening..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length.toLocaleString('id-ID')} sekolah</span>
        </div>

        {/* Table */}
        <div className="sheet-container">
          <table className="w-full">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 250 }}>Nama Sekolah / Pemilik Rekening</th>
                <th className="sheet-header-cell text-center" style={{ width: 110 }}>Kategori</th>
                <th className="sheet-header-cell text-center" style={{ width: 115 }}>Layanan</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 150 }}>Kabupaten/Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 130 }}>Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 150 }}>Alokasi Pagu (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 150 }}>Dana Cair (Rp)</th>
                <th className="sheet-header-cell text-center" style={{ width: 110 }}>% Penyaluran</th>
                <th className="sheet-header-cell text-center" style={{ width: 60 }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, idx) => {
                const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                let segmentLabel: string = row.jenjang;
                if (row.jenjang === 'UNIVERSITAS') segmentLabel = 'Universitas';
                else if (row.jenjang === 'SMA') segmentLabel = 'SMA / SMK';

                return (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{globalIdx}</td>
                    <td className="sheet-cell text-left font-medium text-text-primary">
                      <Link
                        href={`/dashboard/profil-institusi/${row.id}`}
                        className="hover:text-accent hover:underline transition-colors text-indigo-700"
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
                        {segmentLabel}
                      </span>
                    </td>
                    <td className="sheet-cell text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        row.status_sekolah === 'NEGERI' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-purple-100 text-purple-700 border border-purple-200'
                      }`}>
                        {row.status_sekolah === 'NEGERI' ? 'Konvensional' : 'Syariah'}
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
                        title="Lihat Detail Rekening"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between bg-white px-4 py-3 border border-slate-200 rounded-lg shadow-sm">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-slate-700">
                Menampilkan{' '}
                <span className="font-semibold">
                  {filtered.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
                </span>{' '}
                sampai{' '}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, filtered.length)}
                </span>{' '}
                dari{' '}
                <span className="font-semibold">
                  {filtered.length.toLocaleString('id-ID')}
                </span>{' '}
                data institusi
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
          🏫 Klik nama sekolah atau ikon untuk melihat rincian transaksi rekening & status transfer
        </p>
      </div>
    </div>
  );
}
