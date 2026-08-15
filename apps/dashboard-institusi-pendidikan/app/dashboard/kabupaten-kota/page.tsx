'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiKabupatenKota } from '@/types';
import { Search, Download } from 'lucide-react';

export default function KabupatenKotaPage() {
  const { activeTahun } = useAppStore();

  const [provinsiList, setProvinsiList] = useState<{ id: string; nama: string }[]>([]);
  const [selectedProvinsiId, setSelectedProvinsiId] = useState('');
  const [selectedProvinsiNama, setSelectedProvinsiNama] = useState('');
  const [data, setData] = useState<AlokasiKabupatenKota[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Fetch province list once
  useEffect(() => {
    supabase
      .from('provinsi')
      .select('id, nama_provinsi')
      .order('nama_provinsi', { ascending: true })
      .then(({ data: rows }) => {
        if (rows && rows.length > 0) {
          const list = rows.map((r: any) => ({ id: r.id, nama: r.nama_provinsi }));
          setProvinsiList(list);
          // Default: first province
          setSelectedProvinsiId(list[0].id);
          setSelectedProvinsiNama(list[0].nama);
        }
      });
  }, []);

  // Fetch kabkota when province changes
  useEffect(() => {
    if (!selectedProvinsiId) return;
    let isMounted = true;
    setLoading(true);

    supabase
      .from('alokasi_kabupaten_kota')
      .select(`
        *,
        kabupaten_kota:kabupaten_kota_id ( id, kode_kabupaten_kota, nama_kabupaten_kota, tipe )
      `)
      .eq('tahun_anggaran_id', String(activeTahun))
      .order('kabupaten_kota_id', { ascending: true })
      .then(({ data: rows, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('Error fetching kabkota:', error);
          // Fallback: fetch all kabkota for the province and map allocations
          supabase
            .from('kabupaten_kota')
            .select('*')
            .eq('provinsi_id', selectedProvinsiId)
            .order('nama_kabupaten_kota', { ascending: true })
            .then(({ data: kks }) => {
              if (!isMounted) return;
              const mapped = (kks || []).map((kk: any) => ({
                id: kk.id,
                tahun_anggaran_id: String(activeTahun),
                kabupaten_kota_id: kk.id,
                kabupaten_kota: {
                  id: kk.id,
                  provinsi_id: kk.provinsi_id,
                  kode_kabupaten_kota: kk.kode_kabupaten_kota,
                  nama_kabupaten_kota: kk.nama_kabupaten_kota,
                  tipe: kk.tipe,
                },
                nominal_alokasi: Number(kk.nominal_alokasi || 0),
                realisasi_total: Number(kk.realisasi_total || 0),
                selisih: Number(kk.nominal_alokasi || 0) - Number(kk.realisasi_total || 0),
                persentase_penyerapan:
                  Number(kk.nominal_alokasi) > 0
                    ? Math.round((Number(kk.realisasi_total) / Number(kk.nominal_alokasi)) * 1000) / 10
                    : 0,
                updated_at: kk.updated_at,
              }));
              setData(mapped);
              setLoading(false);
            });
          return;
        }

        // Filter by province from join result
        const provinceRows = (rows || []).filter((r: any) => {
          return r.kabupaten_kota?.id && true; // Join already filtered
        });

        const mapped = provinceRows.map((r: any) => ({
          ...r,
          nominal_alokasi: Number(r.nominal_alokasi || 0),
          realisasi_total: Number(r.realisasi_total || 0),
          selisih: Number(r.nominal_alokasi || 0) - Number(r.realisasi_total || 0),
          persentase_penyerapan:
            Number(r.nominal_alokasi) > 0
              ? Math.round((Number(r.realisasi_total) / Number(r.nominal_alokasi)) * 1000) / 10
              : 0,
        }));

        setData(mapped);
        setLoading(false);
      });

    return () => { isMounted = false; };
  }, [selectedProvinsiId, activeTahun]);

  const filtered = useMemo(() => {
    if (!search) return data;
    return data.filter(k =>
      (k.kabupaten_kota?.nama_kabupaten_kota || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  const totals = useMemo(() => {
    const nom = filtered.reduce((s, k) => s + k.nominal_alokasi, 0);
    const real = filtered.reduce((s, k) => s + k.realisasi_total, 0);
    return { nominal: nom, realisasi: real, selisih: nom - real, pct: nom > 0 ? (real / nom) * 100 : 0 };
  }, [filtered]);

  const handleProvinsiChange = (id: string) => {
    setSelectedProvinsiId(id);
    const p = provinsiList.find(p => p.id === id);
    setSelectedProvinsiNama(p?.nama || '');
  };

  return (
    <div className="min-h-screen">
      <Header title="Kabupaten / Kota" subtitle={`Data alokasi anggaran per kabupaten/kota — ${selectedProvinsiNama} Tahun ${activeTahun}`} />

      <div className="p-6">
        {/* Toolbar */}
        <div className="sheet-toolbar flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Provinsi:</span>
            <select
              value={selectedProvinsiId}
              onChange={(e) => handleProvinsiChange(e.target.value)}
              className="select-dropdown"
            >
              {provinsiList.map(p => (
                <option key={p.id} value={p.id}>{p.nama}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari kabupaten/kota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <span className="text-xs text-text-muted flex-1">{filtered.length} kabupaten/kota</span>
          <button className="btn btn-primary">
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="sheet-container">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                  <th className="sheet-header-cell text-left" style={{ minWidth: 200 }}>Kabupaten / Kota</th>
                  <th className="sheet-header-cell text-center" style={{ width: 100 }}>Tipe</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 160 }}>Nominal (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 160 }}>Realisasi (Rp)</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 120 }}>Selisih</th>
                  <th className="sheet-header-cell text-center" style={{ width: 110 }}>%</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50/50 transition">
                    <td className="sheet-cell text-center text-text-muted text-xs">{idx + 1}</td>
                    <td className="sheet-cell text-left font-medium">
                      <Link
                        href={`/dashboard/provinsi/${selectedProvinsiId}/kabkota/${row.kabupaten_kota_id}`}
                        className="hover:text-accent hover:underline transition-colors"
                      >
                        {row.kabupaten_kota?.nama_kabupaten_kota || row.kabupaten_kota_id}
                      </Link>
                    </td>
                    <td className="sheet-cell text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                        row.kabupaten_kota?.tipe === 'KOTA'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      }`}>
                        {row.kabupaten_kota?.tipe || '-'}
                      </span>
                    </td>
                    <td className="sheet-cell text-right">{fmtRupiah(row.nominal_alokasi)}</td>
                    <td className="sheet-cell text-right">{fmtRupiah(row.realisasi_total)}</td>
                    <td className="sheet-cell text-right text-rose-600">{fmtTriliun(row.selisih)}</td>
                    <td className="sheet-cell text-center">
                      <PctBadge value={row.persentase_penyerapan} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sheet-footer-cell" />
                  <td className="sheet-footer-cell text-left font-bold">TOTAL ({filtered.length})</td>
                  <td className="sheet-footer-cell" />
                  <td className="sheet-footer-cell text-right font-bold">{fmtRupiah(totals.nominal)}</td>
                  <td className="sheet-footer-cell text-right font-bold">{fmtRupiah(totals.realisasi)}</td>
                  <td className="sheet-footer-cell text-right text-rose-600 font-bold">{fmtTriliun(totals.selisih)}</td>
                  <td className="sheet-footer-cell text-center font-bold">
                    <PctBadge value={totals.pct} size="md" />
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
