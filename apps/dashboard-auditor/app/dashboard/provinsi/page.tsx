'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { alokasiProvinsiData, tahunAnggaranData, getBaseTahun, getTahunOrBase } from '@/lib/data';
import { fmtRupiah, fmtTriliun } from '@/lib/utils/formatters';
import { AlokasiProvinsi } from '@/types';
import { Search, Download, RefreshCw } from 'lucide-react';

export default function ProvinsiPage() {
  const { activeTahun, isSupabaseMode, dbData } = useAppStore();

  const activeTahunObj = useMemo(() => {
    if (isSupabaseMode && dbData) {
      return dbData.tahun_anggaran?.find((t: any) => Number(t.tahun) === Number(activeTahun));
    }
    return tahunAnggaranData.find(t => Number(t.tahun) === Number(activeTahun));
  }, [activeTahun, isSupabaseMode, dbData]);

  const realProvinsiData = useMemo(() => {
    if (!activeTahunObj) return [];

    if (isSupabaseMode && dbData) {
      const yearAllocations = (dbData.alokasi_provinsi || []).filter(
        (ap: any) => String(ap.tahun_anggaran_id) === String(activeTahunObj.id)
      );

      if (yearAllocations.length > 0) {
        return yearAllocations.map((ap: any) => {
          const prov = dbData.provinsi?.find((p: any) => p.id === ap.provinsi_id);
          const nominal = Number(ap.nominal_alokasi || 0);
          const realisasi = Number(ap.realisasi_total || 0);
          return {
            id: ap.id,
            tahun_anggaran_id: ap.tahun_anggaran_id,
            provinsi_id: ap.provinsi_id,
            provinsi: prov
              ? { id: prov.id, kode_provinsi: prov.kode_provinsi, nama_provinsi: prov.nama_provinsi }
              : { id: ap.provinsi_id, kode_provinsi: '', nama_provinsi: ap.provinsi?.nama_provinsi || 'Provinsi' },
            nominal_alokasi: nominal,
            realisasi_total: realisasi,
            selisih: nominal - realisasi,
            persentase_penyerapan:
              nominal > 0
                ? Math.round((realisasi / nominal) * 1000) / 10
                : 0,
            updated_at: ap.updated_at,
          } as AlokasiProvinsi;
        });
      }

      // Fallback: master 38 provinsi dengan nominal Rp 0
      return (dbData.provinsi || []).map((prov: any) => ({
        id: `prov-draft-${prov.id}-${activeTahunObj.id}`,
        tahun_anggaran_id: activeTahunObj.id,
        provinsi_id: prov.id,
        provinsi: { id: prov.id, kode_provinsi: prov.kode_provinsi, nama_provinsi: prov.nama_provinsi },
        nominal_alokasi: 0,
        realisasi_total: 0,
        selisih: 0,
        persentase_penyerapan: 0,
        updated_at: new Date().toISOString().split('T')[0],
      } as AlokasiProvinsi));
    }

    const yearAllocations = alokasiProvinsiData.filter(p => String(p.tahun_anggaran_id) === String(activeTahunObj.id));
    if (yearAllocations.length > 0) return yearAllocations;
    return alokasiProvinsiData.map(p => ({ ...p, nominal_alokasi: 0, realisasi_total: 0, selisih: 0, persentase_penyerapan: 0 }));
  }, [activeTahunObj, isSupabaseMode, dbData]);

  const [data, setData] = useState<AlokasiProvinsi[]>(realProvinsiData);

  useEffect(() => {
    setData(realProvinsiData);
  }, [realProvinsiData]);

  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      list = list.filter(p => p.provinsi.nama_provinsi.toLowerCase().includes(search.toLowerCase()));
    }
    return [...list].sort((a, b) => a.provinsi.nama_provinsi.localeCompare(b.provinsi.nama_provinsi, 'id'));
  }, [data, search]);

  const totals = useMemo(() => {
    const nom = filtered.reduce((s, p) => s + p.nominal_alokasi, 0);
    const real = filtered.reduce((s, p) => s + p.realisasi_total, 0);
    return { nominal: nom, realisasi: real, selisih: nom - real, pct: nom > 0 ? (real / nom) * 100 : 0 };
  }, [filtered]);

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
          <button className="btn btn-ghost" onClick={() => setData(realProvinsiData)}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className="btn btn-primary">
            <Download size={14} />
            Ekspor Excel
          </button>
        </div>

        {/* Spreadsheet Table */}
        <div className="sheet-container overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="sheet-header-cell text-center" style={{ width: 40 }}>No</th>
                <th className="sheet-header-cell text-left" style={{ minWidth: 200 }}>Nama Provinsi</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 160 }}>Nominal (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 160 }}>Realisasi (Rp)</th>
                <th className="sheet-header-cell text-right" style={{ minWidth: 140 }}>Selisih</th>
                <th className="sheet-header-cell text-center" style={{ width: 90 }}>% Penyerapan</th>
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
                  <td className="sheet-cell text-right font-mono">{fmtRupiah(row.nominal_alokasi)}</td>
                  <td className="sheet-cell text-right font-mono">{fmtRupiah(row.realisasi_total)}</td>
                  <td className="sheet-cell text-right font-mono text-rose-600">{fmtRupiah(row.selisih)}</td>
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
                <td className="sheet-footer-cell text-right font-bold font-mono">{fmtRupiah(totals.nominal)}</td>
                <td className="sheet-footer-cell text-right font-bold font-mono">{fmtRupiah(totals.realisasi)}</td>
                <td className="sheet-footer-cell text-right text-rose-600 font-bold font-mono">{fmtRupiah(totals.selisih)}</td>
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
