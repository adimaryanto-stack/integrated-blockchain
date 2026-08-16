'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiProvinsi } from '@/types';
import { Search, Download, RefreshCw } from 'lucide-react';

export default function ProvinsiPage() {
  const { activeTahun } = useAppStore();
  const [data, setData] = useState<AlokasiProvinsi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchProvinsi = async () => {
    setLoading(true);
    try {
      // Dapatkan record tahun_anggaran untuk tahun aktif
      const { data: yearRow } = await supabase
        .from('tahun_anggaran')
        .select('id')
        .eq('tahun', activeTahun)
        .maybeSingle();

      const yearId = yearRow?.id || String(activeTahun);

      const [resAlokasi, resProv] = await Promise.all([
        supabase
          .from('alokasi_provinsi')
          .select('*')
          .eq('tahun_anggaran_id', yearId),
        supabase
          .from('provinsi')
          .select('*')
          .order('nama_provinsi', { ascending: true })
      ]);

      const provs = resProv.data || [];
      const alokasis = resAlokasi.data || [];

      const mapped: AlokasiProvinsi[] = provs.map((prov: any) => {
        const alokasi = alokasis.find((a: any) => a.provinsi_id === prov.id);
        const nominal = Number(alokasi?.nominal_alokasi || 0);
        const realisasi = Number(alokasi?.realisasi_total || 0);
        const selisih = nominal - realisasi;
        const persentase = nominal > 0 ? (realisasi / nominal) * 100 : 0;

        return {
          id: alokasi?.id || `prov-${prov.id}`,
          tahun_anggaran_id: String(activeTahun),
          provinsi_id: prov.id,
          provinsi: {
            id: prov.id,
            kode_provinsi: prov.kode_provinsi,
            nama_provinsi: prov.nama_provinsi
          },
          nominal_alokasi: nominal,
          realisasi_total: realisasi,
          selisih,
          persentase_penyerapan: persentase,
          updated_at: alokasi?.updated_at || new Date().toISOString()
        };
      });

      // Sort Alphabet A-Z by nama_provinsi
      mapped.sort((a, b) => a.provinsi.nama_provinsi.localeCompare(b.provinsi.nama_provinsi));

      setData(mapped);
    } catch (err) {
      console.error('Error fetching provinsi:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProvinsi();
  }, [activeTahun]);

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter(p => p.provinsi.nama_provinsi.toLowerCase().includes(search.toLowerCase()));
  }, [data, search]);

  const totals = useMemo(() => {
    const nom = filtered.reduce((s, p) => s + p.nominal_alokasi, 0);
    const real = filtered.reduce((s, p) => s + p.realisasi_total, 0);
    return { nominal: nom, realisasi: real, selisih: nom - real, pct: nom > 0 ? (real / nom) * 100 : 0 };
  }, [filtered]);

  const renderCell = (row: AlokasiProvinsi, field: 'nominal' | 'realisasi') => {
    const value = field === 'nominal' ? row.nominal_alokasi : row.realisasi_total;
    return (
      <td className="sheet-cell text-right">
        {fmtRupiah(value)}
      </td>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Provinsi" subtitle={`Memuat data provinsi tahun ${activeTahun} dari database lokal...`} />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title="Provinsi"
        subtitle={`Alokasi APBN Pendidikan per Wilayah Provinsi Tahun ${activeTahun}`}
      />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari provinsi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} provinsi</span>
          <button onClick={fetchProvinsi} className="btn btn-ghost">
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="btn btn-primary">
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {/* Spreadsheet Table */}
        <div className="sheet-container">
          <table className="w-full">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 200 }}>Nama Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Nominal (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 180 }}>Realisasi (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 150 }}>Selisih</th>
                <th className="sheet-header-cell text-center" style={{ width: 120 }}>% Penyerapan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, idx) => (
                <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                  <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                  <td className="sheet-cell text-left font-medium text-text-primary">
                    <Link href={`/dashboard/provinsi/${row.provinsi_id}`} className="hover:text-accent hover:underline transition-colors">
                      {row.provinsi.nama_provinsi}
                    </Link>
                  </td>
                  {renderCell(row, 'nominal')}
                  {renderCell(row, 'realisasi')}
                  <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                  <td className="sheet-cell text-center">
                    <PctBadge value={row.persentase_penyerapan} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="sheet-footer-cell text-center" />
                <td className="sheet-footer-cell text-left font-bold">TOTAL ({filtered.length} Provinsi)</td>
                <td className="sheet-footer-cell text-right">{fmtRupiah(totals.nominal)}</td>
                <td className="sheet-footer-cell text-right">{fmtRupiah(totals.realisasi)}</td>
                <td className="sheet-footer-cell text-right text-rose-600">{fmtTriliun(totals.selisih)}</td>
                <td className="sheet-footer-cell text-center">
                  <PctBadge value={totals.pct} size="md" />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
