'use client';

import { useState, useEffect, useMemo, use } from 'react';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import PctBadge from '@/components/ui/PctBadge';
import { useAppStore } from '@/lib/store';
import { formatRupiah, fmtTriliun, fmtPct } from '@/lib/utils/formatters';
import {
  getInstitusiPendidikanLampung,
  getBreakdownKabKota,
  InstitusiPendidikan,
  ApbdBreakdownKabKota,
} from '@/lib/data/apbd-service';
import {
  GraduationCap,
  Search,
  Download,
  School,
  ChevronLeft,
  ChevronRight,
  Filter,
  Building2,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const jenjangConfig: Record<string, { label: string; title: string; desc: string }> = {
  universitas: {
    label: 'UNIVERSITAS',
    title: 'Perguruan Tinggi & Universitas',
    desc: 'Monitoring alokasi bantuan dan operasional kampus negeri & swasta di Lampung',
  },
  sma: {
    label: 'SMA',
    title: 'Jenjang SMA & SMK',
    desc: 'Alokasi APBD operasional sekolah menengah atas & kejuruan di 15 kab/kota Lampung',
  },
  smp: {
    label: 'SMP',
    title: 'Jenjang SMP & MTs',
    desc: 'Alokasi dan penyerapan dana pendidikan sekolah menengah pertama di Lampung',
  },
  sd: {
    label: 'SD',
    title: 'Jenjang SD & MI',
    desc: 'Alokasi dana operasional & peningkatan mutu sekolah dasar di Lampung',
  },
  paud: {
    label: 'PAUD',
    title: 'Jenjang PAUD & TK',
    desc: 'Bantuan dan pembinaan pendidikan anak usia dini se-Provinsi Lampung',
  },
};

export default function JenjangDetailPage({
  params,
}: {
  params: Promise<{ jenjang: string }>;
}) {
  const resolvedParams = use(params);
  const jenjangKey = (resolvedParams.jenjang || 'sma').toLowerCase();
  const config = jenjangConfig[jenjangKey] || jenjangConfig.sma;

  const { activeTahun, refreshKey } = useAppStore();
  const [schools, setSchools] = useState<InstitusiPendidikan[]>([]);
  const [totalSchools, setTotalSchools] = useState<number>(0);
  const [kabList, setKabList] = useState<ApbdBreakdownKabKota[]>([]);
  const [selectedKab, setSelectedKab] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(25);
  const [loading, setLoading] = useState<boolean>(true);

  // Load Kab/Kota for filter dropdown
  useEffect(() => {
    async function loadKab() {
      const kabs = await getBreakdownKabKota(activeTahun);
      setKabList(kabs);
    }
    loadKab();
  }, [activeTahun]);

  // Load schools from database
  useEffect(() => {
    async function loadSchools() {
      setLoading(true);
      const res = await getInstitusiPendidikanLampung({
        jenjang: config.label,
        kabupatenKotaId: selectedKab,
        search: search.trim() || undefined,
        page,
        limit,
        tahun: activeTahun,
      });
      setSchools(res.data);
      setTotalSchools(res.total);
      setLoading(false);
    }
    loadSchools();
  }, [jenjangKey, selectedKab, search, page, limit, refreshKey, activeTahun]);

  const totalPages = Math.ceil(totalSchools / limit) || 1;

  // Export Excel
  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`${config.label} Lampung`);

    worksheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: 'NPSN', key: 'npsn', width: 14 },
      { header: 'Nama Sekolah / Institusi', key: 'nama', width: 35 },
      { header: 'Jenjang', key: 'jenjang', width: 12 },
      { header: 'Kecamatan', key: 'kecamatan', width: 20 },
      { header: 'Alokasi APBD (Rp)', key: 'nominal', width: 22 },
      { header: 'Realisasi Serapan (Rp)', key: 'realisasi', width: 22 },
      { header: '% Penyerapan', key: 'persentase', width: 16 },
    ];

    schools.forEach((item, idx) => {
      worksheet.addRow({
        no: (page - 1) * limit + idx + 1,
        npsn: item.npsn,
        nama: item.nama_institusi,
        jenjang: item.jenjang,
        kecamatan: item.kecamatan || '-',
        nominal: item.nominal_alokasi,
        realisasi: item.realisasi_total,
        persentase: `${(item.persentase || 0).toFixed(1)}%`,
      });
    });

    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    saveAs(blob, `Satuan_Pendidikan_${config.label}_Lampung_${activeTahun}.xlsx`);
  };

  return (
    <div className="min-h-screen pb-12">
      <Header
        title={config.title}
        subtitle={`${config.desc} • Tahun Anggaran ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Filter Toolbar */}
        <div className="glass-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari NPSN atau Nama Sekolah..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="search-input w-full"
              />
            </div>

            {/* Kab/Kota Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-text-muted" />
              <select
                value={selectedKab}
                onChange={(e) => {
                  setSelectedKab(e.target.value);
                  setPage(1);
                }}
                className="select-dropdown text-xs"
              >
                <option value="ALL">Semua 15 Kab / Kota di Lampung</option>
                {kabList.map((k) => (
                  <option key={k.kabupaten_kota_id} value={k.kabupaten_kota_id}>
                    {k.nama_kabupaten_kota}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <span className="text-xs text-text-muted font-mono">
              Total: {totalSchools.toLocaleString('id-ID')} Satuan
            </span>
            <button
              onClick={handleExportExcel}
              className="btn btn-ghost text-xs border-indigo-200 text-indigo-700 bg-white"
            >
              <Download size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Schools Table */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 50 }}>No</th>
                  <th className="sheet-header-cell text-center" style={{ width: 110 }}>NPSN</th>
                  <th className="sheet-header-cell text-left">Nama Satuan Pendidikan</th>
                  <th className="sheet-header-cell text-left">Kecamatan</th>
                  <th className="sheet-header-cell text-right">Alokasi APBD</th>
                  <th className="sheet-header-cell text-right">Realisasi</th>
                  <th className="sheet-header-cell text-center">% Serapan</th>
                  <th className="sheet-header-cell" style={{ width: 140 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-text-muted font-mono">
                      Memuat data institusi dari PostgreSQL lokal...
                    </td>
                  </tr>
                ) : schools.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-xs text-text-muted">
                      Tidak ada sekolah ditemukan untuk filter ini.
                    </td>
                  </tr>
                ) : (
                  schools.map((item, idx) => {
                    const pct = item.persentase || 0;
                    const barColor = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444';

                    return (
                      <tr key={item.id} className="hover:bg-indigo-50/40 transition">
                        <td className="sheet-cell text-center font-mono text-text-muted">
                          {(page - 1) * limit + idx + 1}
                        </td>
                        <td className="sheet-cell text-center font-mono text-indigo-700 font-semibold">
                          {item.npsn}
                        </td>
                        <td className="sheet-cell text-left font-medium text-text-primary">
                          <div className="flex items-center gap-2">
                            <School size={15} className="text-indigo-600 shrink-0" />
                            <span>{item.nama_institusi}</span>
                          </div>
                        </td>
                        <td className="sheet-cell text-left text-text-secondary text-xs">
                          {item.kecamatan || '-'}
                        </td>
                        <td className="sheet-cell text-right font-mono">
                          {formatRupiah(item.nominal_alokasi)}
                        </td>
                        <td className="sheet-cell text-right font-mono text-emerald-700">
                          {formatRupiah(item.realisasi_total)}
                        </td>
                        <td className="sheet-cell text-center">
                          <PctBadge value={pct} />
                        </td>
                        <td className="sheet-cell">
                          <div className="progress-bar-track">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-border flex items-center justify-between">
            <span className="text-xs text-text-muted font-mono">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1 || loading}
                className="btn btn-ghost text-xs p-2 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages || loading}
                className="btn btn-ghost text-xs p-2 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
