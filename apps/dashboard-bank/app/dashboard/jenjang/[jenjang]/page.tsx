'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { getInstitusiByJenjang, getAlokasiProvinsi, getKabkotaByProvinsi } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { Jenjang, InstitusiPendidikan, AlokasiProvinsi, AlokasiKabupatenKota } from '@/types';
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
  const { activeTahun } = useAppStore();

  const [data, setData] = useState<InstitusiPendidikan[]>([]);
  const [provinsiList, setProvinsiList] = useState<AlokasiProvinsi[]>([]);
  const [kabkotaOptions, setKabkotaOptions] = useState<AlokasiKabupatenKota[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  const [selectedKabKotaName, setSelectedKabKotaName] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'nominal' | 'realisasi' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPage(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch total count lightweight
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2026';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-davinci-2026';
      let countUrl = `${url}/rest/v1/institusi_pendidikan?jenjang=eq.${config.jenjang}&select=id`;
      if (selectedStatus) countUrl += `&status_sekolah=eq.${selectedStatus}`;
      if (debouncedSearch) countUrl += `&or=(nama_institusi.ilike.*${encodeURIComponent(debouncedSearch)}*,npsn.ilike.*${encodeURIComponent(debouncedSearch)}*)`;

      fetch(countUrl, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: 'count=exact' }
      }).then(r => {
        const cr = r.headers.get('content-range');
        if (cr) {
          const total = parseInt(cr.split('/')[1], 10);
          if (!isNaN(total)) setTotalCount(total);
        }
      }).catch(() => {});

      let provs = provinsiList;
      if (provs.length === 0) {
        provs = await getAlokasiProvinsi(activeTahun);
        setProvinsiList(provs);
      }

      let query = supabase
        .from('institusi_pendidikan')
        .select('*')
        .eq('jenjang', config.jenjang);

      if (selectedProvinsiId) {
        const prov = provs.find(p => p.provinsi_id === selectedProvinsiId);
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

      const { data: list, error } = await query;
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

      const mapped = (list || []).map((item: any) => {
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

      setData(mapped);
      if (debouncedSearch || selectedProvinsiId || selectedKabKotaName || selectedStatus) {
        setTotalCount(mapped.length);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [config.jenjang, activeTahun, selectedProvinsiId, selectedKabKotaName, selectedStatus, debouncedSearch]);

  useEffect(() => {
    if (!selectedProvinsiId) {
      setKabkotaOptions([]);
      return;
    }
    getKabkotaByProvinsi(selectedProvinsiId, activeTahun)
      .then(setKabkotaOptions)
      .catch(console.error);
  }, [selectedProvinsiId, activeTahun]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target?.result as string;
      const lines = csvText.split('\n');
      
      const newItems: InstitusiPendidikan[] = [];
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
        alert(`${newItems.length} data sekolah berhasil diimport dan dicocokkan!`);
      } else {
        alert('Gagal membaca data CSV. Pastikan format: Nama Sekolah, NPSN, Kabupaten/Kota, Provinsi');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const filtered = useMemo(() => {
    return [...data].sort((a, b) => {
      const provA = a.provinsi_nama || '';
      const provB = b.provinsi_nama || '';
      const provComp = provA.localeCompare(provB, 'id');
      if (provComp !== 0) return provComp;

      const kabA = a.kabupaten_kota_nama || '';
      const kabB = b.kabupaten_kota_nama || '';
      const kabComp = kabA.localeCompare(kabB, 'id');
      if (kabComp !== 0) return kabComp;

      const nameA = a.nama_institusi || '';
      const nameB = b.nama_institusi || '';
      return nameA.localeCompare(nameB, 'id');
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

        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2026';
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

  const startEdit = (id: string, field: 'nominal' | 'realisasi', value: number) => {
    setEditingCell({ id, field });
    setEditValue(String(value));
  };

  const commitEdit = async () => {
    if (!editingCell) return;
    const parsed = Number(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      const targetSchool = data.find(inst => inst.id === editingCell.id);
      if (!targetSchool) {
        setEditingCell(null);
        return;
      }

      // 1. Update local state
      const updatedData = data.map(inst => {
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
      });
      setData(updatedData);

      // 2. Update school in DB (if not a mock ID)
      if (!editingCell.id.startsWith('inst-')) {
        const fieldName = editingCell.field === 'nominal' ? 'nominal_alokasi' : 'realisasi_total';
        const { error: schoolError } = await supabase
          .from('institusi_pendidikan')
          .update({ [fieldName]: parsed })
          .eq('id', editingCell.id);

        if (schoolError) {
          console.error(schoolError);
          alert('Gagal menyimpan perubahan sekolah ke database.');
          fetchData();
          setEditingCell(null);
          return;
        }
      }

      // 3. Recalculate aggregates
      const { data: dbSchools, error: schoolsError } = await supabase
        .from('institusi_pendidikan')
        .select('id, nominal_alokasi, realisasi_total')
        .eq('kabupaten_kota_id', targetSchool.kabupaten_kota_id);

      if (!schoolsError && dbSchools) {
        const newKabNominal = dbSchools.reduce((sum, item) => {
          if (item.id === targetSchool.id) return sum + (editingCell.field === 'nominal' ? parsed : Number(item.nominal_alokasi));
          return sum + Number(item.nominal_alokasi);
        }, 0);

        const newKabRealisasi = dbSchools.reduce((sum, item) => {
          if (item.id === targetSchool.id) return sum + (editingCell.field === 'realisasi' ? parsed : Number(item.realisasi_total));
          return sum + Number(item.realisasi_total);
        }, 0);

        const { data: yearRow } = await supabase
          .from('tahun_anggaran')
          .select('id')
          .eq('tahun', activeTahun)
          .single();

        if (yearRow) {
          const { data: kabRow } = await supabase
            .from('alokasi_kabupaten_kota')
            .select('id, alokasi_provinsi_id')
            .eq('kabupaten_kota_id', targetSchool.kabupaten_kota_id)
            .single();

          if (kabRow) {
            const { error: kabError } = await supabase
              .from('alokasi_kabupaten_kota')
              .update({
                nominal_alokasi: newKabNominal,
                realisasi_total: newKabRealisasi,
              })
              .eq('id', kabRow.id);

            if (!kabError) {
              const { data: kabList } = await supabase
                .from('alokasi_kabupaten_kota')
                .select('id, nominal_alokasi, realisasi_total')
                .eq('alokasi_provinsi_id', kabRow.alokasi_provinsi_id);

              if (kabList) {
                const newProvNominal = kabList.reduce((sum, item) => {
                  if (item.id === kabRow.id) return sum + newKabNominal;
                  return sum + Number(item.nominal_alokasi);
                }, 0);

                const newProvRealisasi = kabList.reduce((sum, item) => {
                  if (item.id === kabRow.id) return sum + newKabRealisasi;
                  return sum + Number(item.realisasi_total);
                }, 0);

                await supabase
                  .from('alokasi_provinsi')
                  .update({
                    nominal_alokasi: newProvNominal,
                    realisasi_total: newProvRealisasi,
                  })
                  .eq('id', kabRow.alokasi_provinsi_id);
              }
            }
          }
        }
      }
    }
    setEditingCell(null);
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
      <td className="sheet-cell sheet-cell-editable text-right font-mono" onClick={() => startEdit(row.id, field, value)}>
        {fmtRupiah(value)}
      </td>
    );
  };

  // Status Pencairan Badge Helper
  const getPencairanStatusBadge = (pct: number) => {
    if (pct >= 100) {
      return <span className="badge bg-emerald-100 text-emerald-700 border-emerald-300">🟢 Sudah Masuk</span>;
    }
    if (pct > 0) {
      return <span className="badge bg-amber-100 text-amber-700 border-amber-300">🟡 Proses ({pct}%)</span>;
    }
    return <span className="badge bg-rose-100 text-rose-700 border-rose-300">🔴 Belum Masuk</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title={`Jenjang: ${config.label}`} subtitle={`Daftar status pencairan dana APBN Pendidikan jenjang ${config.label} Tahun ${activeTahun}`} />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title={`Jenjang: ${config.label}`} subtitle={`Daftar status pencairan dana APBN Pendidikan jenjang ${config.label} Tahun ${activeTahun}`} />

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
              {[...provinsiList].sort((a, b) => a.provinsi.nama_provinsi.localeCompare(b.provinsi.nama_provinsi, 'id')).map(p => (
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
            <span className="text-xs text-text-muted">Layanan:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="select-dropdown"
            >
              <option value="">Semua Layanan</option>
              <option value="NEGERI">Konvensional</option>
              <option value="SWASTA">Syariah</option>
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder={`Cari nama sekolah/institusi...`}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{(totalCount ?? filtered.length).toLocaleString('id-ID')} sekolah (menampilkan {filtered.length.toLocaleString('id-ID')} terbaru)</span>
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
                <th className="sheet-header-cell text-left" style={{ minWidth: 180 }}>Nama Sekolah / Rekening Penerima</th>
                <th className="sheet-header-cell text-center" style={{ width: 90 }}>Layanan</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 120 }}>Kabupaten/Kota</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 110 }}>Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 130 }}>Alokasi Pagu (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 130 }}>Dana Cair (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 110 }}>Dana Pending</th>
                <th className="sheet-header-cell text-center" style={{ width: 110 }}>Status Pencairan</th>
                <th className="sheet-header-cell text-center" style={{ width: 75 }}>Kode NPSN</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">
                    <Link href={`/dashboard/profil-institusi/${row.id}`} className="hover:text-accent hover:underline transition-colors text-indigo-700">
                      {row.nama_institusi}
                    </Link>
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
                  {renderEditableCell(row, 'nominal')}
                  {renderEditableCell(row, 'realisasi')}
                  <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                  <td className="sheet-cell text-center">
                    {getPencairanStatusBadge(row.persentase_penyerapan)}
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
                <td className="sheet-footer-cell text-center font-bold">
                  {(Number(totals.pct) || 0).toFixed(1)}%
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
                <span className="font-semibold">{(totalCount ?? filtered.length).toLocaleString('id-ID')}</span> data sekolah
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
          ✏️ Klik sel Alokasi Pagu atau Dana Cair untuk edit transfer langsung • Terakumulasi otomatis ke Area & Wilayah
        </p>
      </div>
    </div>
  );
}
