'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { getInstitusiByJenjang, alokasiProvinsiData, getKabkotaByProvinsi, tahunAnggaranData, provinceSchoolStatsData } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { Jenjang, InstitusiPendidikan } from '@/types';
import { Search, Download, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import EditableCell from '@/components/spreadsheet/EditableCell';
import { rollupInstitusiChange } from '@/lib/utils/dbSync';

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
  const { activeTahun, isSupabaseMode, dbData, setDbData, updateInstitusiData } = useAppStore();

  const [data, setData] = useState<InstitusiPendidikan[]>([]);
  const [isLoadingInstitusi, setIsLoadingInstitusi] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
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

  // Deduplicated & Sorted Provinsi Options (A-Z)
  const sortedProvinsiOptions = useMemo(() => {
    const seen = new Set<string>();
    const list: { provinsi_id: string; nama_provinsi: string }[] = [];

    for (const item of alokasiProvinsiData) {
      const pId = item.provinsi_id || item.provinsi?.id;
      const pName = item.provinsi?.nama_provinsi;
      if (pId && pName && !seen.has(pId)) {
        seen.add(pId);
        list.push({ provinsi_id: pId, nama_provinsi: pName });
      }
    }

    return list.sort((a, b) => a.nama_provinsi.localeCompare(b.nama_provinsi, 'id'));
  }, [dbData, alokasiProvinsiData]);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingInstitusi(true);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2028';
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-davinci-2026';

    const statKeyMap: Record<string, string> = {
      UNIVERSITAS: 'univ', SMA: 'sma', SMP: 'smp', SD: 'sd', PAUD: 'paud',
    };
    const statKey = statKeyMap[config.jenjang] || 'univ';
    const hasSubFilter = Boolean(selectedStatus || debouncedSearch);

    // Fetch authoritative count from province_school_stats (same source as port 2019)
    const loadAuthoritativeCount = async () => {
      let stats = (provinceSchoolStatsData as any[]);
      if (!stats || stats.length === 0) {
        try {
          const res = await fetch(`${url}/rest/v1/province_school_stats?select=*`, {
            headers: { apikey: key, Authorization: `Bearer ${key}` }
          });
          if (res.ok) stats = await res.json();
        } catch (_) {}
      }
      if (stats && stats.length > 0 && isMounted) {
        if (selectedProvinsiId) {
          const prov = sortedProvinsiOptions.find((p: any) => p.provinsi_id === selectedProvinsiId);
          const provName = prov?.nama_provinsi;
          const provMatch = stats.find((s: any) =>
            s.province_id === selectedProvinsiId ||
            (provName && s.province_name && s.province_name.toLowerCase() === provName.toLowerCase())
          );
          if (provMatch && provMatch[statKey] !== undefined) {
            setTotalCount(Number(provMatch[statKey]) || 0);
            return;
          }
        } else {
          const nationalTotal = stats.reduce((sum: number, s: any) => sum + (Number(s[statKey]) || 0), 0);
          if (nationalTotal > 0) { setTotalCount(nationalTotal); return; }
        }
      }
    };

    if (!hasSubFilter) {
      loadAuthoritativeCount();
    } else {
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
    }

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

        // Set a reasonable limit of 5000 rows. This is safe and performant.
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

        const unique = (batch || []).map((item: any) => {
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
          setData(unique);
          if (debouncedSearch || selectedKabKotaName || selectedStatus) {
            setTotalCount(unique.length);
          }
          setIsLoadingInstitusi(false);
        }
      } catch (err) {
        console.error('Error fetching institusi:', err);
        if (isMounted) setIsLoadingInstitusi(false);
      }
    };

    fetchInstitusi();
    return () => { isMounted = false; };
  }, [config.jenjang, activeTahun, selectedProvinsiId, selectedKabKotaName, selectedStatus, debouncedSearch]);

  const kabkotaOptions = useMemo(() => {
    if (!selectedProvinsiId) return [];
    return getKabkotaByProvinsi(selectedProvinsiId);
  }, [selectedProvinsiId]);

  const filtered = useMemo(() => {
    return [...data].sort((a, b) => {
      const provCompare = (a.provinsi_nama || '').localeCompare(b.provinsi_nama || '', 'id');
      if (provCompare !== 0) return provCompare;
      const kabCompare = (a.kabupaten_kota_nama || '').localeCompare(b.kabupaten_kota_nama || '', 'id');
      if (kabCompare !== 0) return kabCompare;
      return (a.nama_institusi || '').localeCompare(b.nama_institusi || '', 'id');
    });
  }, [data]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  const [nationalTotal, setNationalTotal] = useState<{ nominal: number; realisasi: number } | null>(null);

  useEffect(() => {
    const fetchNationalTotal = async () => {
      try {
        const { data: yearRow } = await supabase
          .from('tahun_anggaran')
          .select('id')
          .eq('tahun', activeTahun)
          .maybeSingle();

        const { count: allocCount } = await supabase
          .from('alokasi_provinsi')
          .select('*', { count: 'exact', head: true })
          .eq('tahun_anggaran_id', yearRow?.id || '');

        if (!allocCount || allocCount === 0) {
          setNationalTotal({ nominal: 0, realisasi: 0 });
          return;
        }

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2028';
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-davinci-2026';
        const res = await fetch(`${url}/rest/v1/rpc/get_jenjang_summary`, {
          method: 'POST',
          headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ p_jenjang: config.jenjang })
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows[0]) {
            setNationalTotal({
              nominal: Number(rows[0].total_nominal || 0),
              realisasi: Number(rows[0].total_realisasi || 0)
            });
          }
        }
      } catch (err) {
        console.error('Error fetching national total:', err);
      }
    };
    fetchNationalTotal();
  }, [config.jenjang, activeTahun]);

  const hasFilter = Boolean(search || selectedProvinsiId || selectedKabKotaName || selectedStatus);

  const totals = useMemo(() => {
    if (!hasFilter && nationalTotal) {
      const b = nationalTotal;
      return { nominal: b.nominal, realisasi: b.realisasi, selisih: b.nominal - b.realisasi, pct: b.nominal > 0 ? (b.realisasi / b.nominal) * 100 : 0 };
    }
    const nom = filtered.reduce((s, i) => s + Number(i.nominal_alokasi || 0), 0);
    const real = filtered.reduce((s, i) => s + Number(i.realisasi_total || 0), 0);
    return { nominal: nom, realisasi: real, selisih: nom - real, pct: nom > 0 ? (real / nom) * 100 : 0 };
  }, [filtered, hasFilter, nationalTotal]);

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
        subtitle={`Data alokasi dan realisasi institusi ${config.label} Tahun ${activeTahun}`}
      />

      <div className="p-6">
        {/* Loading Institusi Indicator */}
        {isLoadingInstitusi && (
          <div className="mb-4 flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-lg">
            <Loader2 size={13} className="animate-spin" />
            Memuat data institusi dari Database Lokal...
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
              {sortedProvinsiOptions.map(p => (
                <option key={p.provinsi_id} value={p.provinsi_id}>{p.nama_provinsi}</option>
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
          <button className="btn btn-primary">
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
                  <td className="sheet-cell text-right font-mono">{fmtRupiah(row.nominal_alokasi)}</td>
                  <td className="sheet-cell text-right font-mono">{fmtRupiah(row.realisasi_total)}</td>
                  <td className="sheet-cell text-right font-mono text-rose-600">{fmtRupiah(row.selisih)}</td>
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
      </div>
    </div>
  );
}
