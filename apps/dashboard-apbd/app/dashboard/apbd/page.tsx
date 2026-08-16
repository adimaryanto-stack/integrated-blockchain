'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import PctBadge from '@/components/ui/PctBadge';
import ApbdInputModal from '@/components/ui/ApbdInputModal';
import { useAppStore } from '@/lib/store';
import { fmtTriliun, formatRupiah } from '@/lib/utils/formatters';
import { getAllApbdProvinsi, ApbdProvinsi } from '@/lib/data/apbd-service';
import {
  DollarSign,
  Plus,
  Edit2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';

export default function ApbdPertahunPage() {
  const { activeTahun, setActiveTahun, refreshKey, triggerRefresh } = useAppStore();
  const [apbdList, setApbdList] = useState<ApbdProvinsi[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editYear, setEditYear] = useState<number>(2026);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAllApbdProvinsi();
      setApbdList(data);
      setLoading(false);
    }
    load();
  }, [refreshKey]);

  const handleOpenEdit = (tahun: number) => {
    setEditYear(tahun);
    setModalOpen(true);
  };

  const selectedYearData = apbdList.find((a) => a.tahun === editYear);

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="APBD Pertahun"
        subtitle="Pengelolaan dan Penetapan Anggaran APBD Provinsi Lampung Antar Tahun"
      />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-text-primary">Daftar Tahun Anggaran APBD Lampung</h3>
            <p className="text-xs text-text-muted">
              Monitoring historis kepatuhan batas 20% pendidikan dan status penguncian anggaran.
            </p>
          </div>

          <button
            onClick={() => handleOpenEdit(activeTahun)}
            className="btn btn-primary text-xs"
          >
            <Plus size={14} />
            <span>Tambah / Edit Tahun Anggaran</span>
          </button>
        </div>

        {/* Table List of Years */}
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-center" style={{ width: 90 }}>Tahun</th>
                  <th className="sheet-header-cell text-left">Status</th>
                  <th className="sheet-header-cell text-right">Total APBD</th>
                  <th className="sheet-header-cell text-right">Batas 20% (Wajib)</th>
                  <th className="sheet-header-cell text-right">Alokasi Riil</th>
                  <th className="sheet-header-cell text-right">Realisasi</th>
                  <th className="sheet-header-cell text-center">% Pendidikan</th>
                  <th className="sheet-header-cell text-center">Kepatuhan</th>
                  <th className="sheet-header-cell text-center" style={{ width: 120 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {apbdList.map((item) => {
                  const pct = item.total_apbd > 0 ? (item.alokasi_pendidikan_riil / item.total_apbd) * 100 : 0;
                  const isMemenuhi = item.status_kepatuhan === 'MEMENUHI';
                  const isActive = item.tahun === activeTahun;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-indigo-50/40 transition ${isActive ? 'bg-indigo-50/60 font-medium' : ''}`}
                    >
                      <td className="sheet-cell text-center font-mono font-bold">
                        <div className="flex items-center justify-center gap-1">
                          {item.tahun}
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Tahun Aktif Global" />
                          )}
                        </div>
                      </td>
                      <td className="sheet-cell text-left">
                        <span
                          className={`badge ${
                            item.status_anggaran === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.status_anggaran === 'ACTIVE' ? 'ACTIVE (Aktif)' : 'CLOSED (Arsip)'}
                        </span>
                      </td>
                      <td className="sheet-cell text-right font-mono">{fmtTriliun(item.total_apbd)}</td>
                      <td className="sheet-cell text-right font-mono text-text-secondary">{fmtTriliun(item.batas_minimal_pendidikan)}</td>
                      <td className="sheet-cell text-right font-mono font-bold text-indigo-900">{fmtTriliun(item.alokasi_pendidikan_riil)}</td>
                      <td className="sheet-cell text-right font-mono text-emerald-700">{fmtTriliun(item.realisasi_pendidikan_total)}</td>
                      <td className="sheet-cell text-center">
                        <PctBadge value={pct} />
                      </td>
                      <td className="sheet-cell text-center">
                        <span
                          className={`badge ${
                            isMemenuhi
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isMemenuhi ? (
                            <>
                              <CheckCircle2 size={11} className="text-emerald-600" /> Memenuhi
                            </>
                          ) : (
                            <>
                              <AlertCircle size={11} className="text-rose-600" /> Belum Memenuhi
                            </>
                          )}
                        </span>
                      </td>
                      <td className="sheet-cell text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setActiveTahun(item.tahun);
                              triggerRefresh();
                            }}
                            className={`btn text-[11px] py-1 px-2 ${isActive ? 'btn-ghost opacity-60' : 'btn-ghost'}`}
                            disabled={isActive}
                          >
                            Pilih
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item.tahun)}
                            className="btn btn-ghost text-[11px] py-1 px-2 text-indigo-600"
                            title="Edit Data Anggaran"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Input Modal */}
      <ApbdInputModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTotalApbd={selectedYearData?.total_apbd || 8240000000000}
        initialAlokasiRiil={selectedYearData?.alokasi_pendidikan_riil || 1750000000000}
        initialRealisasi={selectedYearData?.realisasi_pendidikan_total || 1420000000000}
        tahun={editYear}
      />
    </div>
  );
}
