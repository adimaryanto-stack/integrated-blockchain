'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import PctBadge from '@/components/ui/PctBadge';
import ApbdInputModal from '@/components/ui/ApbdInputModal';
import { useAppStore } from '@/lib/store';
import { fmtTriliun, fmtPct, formatRupiah } from '@/lib/utils/formatters';
import {
  getApbdProvinsiByYear,
  getAllApbdProvinsi,
  getJenjangSummary,
  ApbdProvinsi,
  JenjangSummary,
} from '@/lib/data/apbd-service';
import {
  Wallet,
  ShieldCheck,
  TrendingUp,
  PieChart,
  GraduationCap,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Building2,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from 'recharts';

export default function DashboardPage() {
  const { activeTahun, refreshKey } = useAppStore();
  const [apbdData, setApbdData] = useState<ApbdProvinsi | null>(null);
  const [allApbd, setAllApbd] = useState<ApbdProvinsi[]>([]);
  const [jenjangList, setJenjangList] = useState<JenjangSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const prov = await getApbdProvinsiByYear(activeTahun);
      const all = await getAllApbdProvinsi();
      setApbdData(prov);
      setAllApbd(all);

      if (prov) {
        const jList = await getJenjangSummary(
          activeTahun,
          prov.alokasi_pendidikan_riil,
          prov.realisasi_pendidikan_total
        );
        setJenjangList(jList);
      } else {
        const jList = await getJenjangSummary(
          activeTahun,
          0,
          0
        );
        setJenjangList(jList);
      }
      setLoading(false);
    }
    loadData();
  }, [activeTahun, refreshKey]);

  const totalApbd = apbdData?.total_apbd || 0;
  const batas20 = apbdData?.batas_minimal_pendidikan || totalApbd * 0.2;
  const alokasiRiil = apbdData?.alokasi_pendidikan_riil || 0;
  const realisasi = apbdData?.realisasi_pendidikan_total || 0;
  const persentasePendidikan = totalApbd > 0 ? (alokasiRiil / totalApbd) * 100 : 0;
  const persentaseSerapan = alokasiRiil > 0 ? (realisasi / alokasiRiil) * 100 : 0;
  const isMemenuhi = alokasiRiil >= batas20;
  const selisihAlokasiBatas = alokasiRiil - batas20;
  const saldoBankSisa = Math.max(0, alokasiRiil - realisasi);

  // Chart data per jenjang
  const barData = useMemo(() => {
    return jenjangList.map((j) => ({
      jenjang: j.label,
      Alokasi: j.nominal / 1_000_000_000_000,
      Realisasi: j.realisasi / 1_000_000_000_000,
    }));
  }, [jenjangList]);

  // Multi-year trend data
  const trendData = useMemo(() => {
    if (allApbd.length === 0) return [];
    return [...allApbd]
      .sort((a, b) => a.tahun - b.tahun)
      .map((t) => ({
        tahun: String(t.tahun),
        TotalAPBD: t.total_apbd / 1_000_000_000_000,
        AlokasiPendidikan: t.alokasi_pendidikan_riil / 1_000_000_000_000,
        Wajib20: (t.total_apbd * 0.2) / 1_000_000_000_000,
        Realisasi: t.realisasi_pendidikan_total / 1_000_000_000_000,
      }));
  }, [allApbd]);

  const trendYearsTitle = useMemo(() => {
    if (!trendData || trendData.length === 0) return 'Tren Penyaluran Dana Pendidikan';
    const years = trendData.map((d) => Number(d.tahun)).filter((y) => !isNaN(y));
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    if (minYear === maxYear) return `Tren Penyaluran Dana Pendidikan (${minYear})`;
    return `Tren Penyaluran Dana Pendidikan (${minYear}–${maxYear})`;
  }, [trendData]);

  return (
    <div className="min-h-screen pb-12">
      <Header
        title="Dashboard APBD Lampung"
        subtitle={`Monitoring & Validasi Kepatuhan 20% Anggaran Pendidikan Tahun ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Banner Status Kepatuhan & Action Toolbar */}
        <div className="glass-card p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                isMemenuhi
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20'
                  : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20'
              }`}
            >
              {isMemenuhi ? <CheckCircle2 size={26} /> : <AlertCircle size={26} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-text-primary">
                  Status Kepatuhan 20%: {isMemenuhi ? 'MEMENUHI' : 'BELUM MEMENUHI'}
                </h3>
                <span
                  className={`badge ${
                    isMemenuhi
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {persentasePendidikan.toFixed(2)}% APBD
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {isMemenuhi
                  ? `Provinsi Lampung telah mengalokasikan ${fmtTriliun(alokasiRiil)} (surplus ${fmtTriliun(selisihAlokasiBatas)} di atas batas wajib 20%).`
                  : `Provinsi Lampung masih kekurangan ${fmtTriliun(Math.abs(selisihAlokasiBatas))} untuk mencapai ambang batas wajib 20%.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => setIsInputModalOpen(true)}
              className="btn btn-primary text-xs"
            >
              <Edit3 size={15} />
              <span>Input / Ubah Anggaran APBD</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Nominal APBD"
            value={fmtTriliun(totalApbd)}
            subtitle={`Perda APBD Lampung ${activeTahun}`}
            icon={<Wallet size={20} className="text-indigo-600" />}
            accent="indigo"
          />

          <MetricCard
            title="Batas Minimal 20%"
            value={fmtTriliun(batas20)}
            subtitle="Pasal 31 (4) UUD 1945"
            icon={<ShieldCheck size={20} className="text-blue-600" />}
            accent="blue"
          />

          <MetricCard
            title="Alokasi Pendidikan Riil"
            value={fmtTriliun(alokasiRiil)}
            subtitle={`${persentasePendidikan.toFixed(2)}% dari Total APBD`}
            icon={<PieChart size={20} className={isMemenuhi ? 'text-emerald-600' : 'text-rose-600'} />}
            accent={isMemenuhi ? 'emerald' : 'rose'}
            badge={
              <span className={`badge ${isMemenuhi ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                {isMemenuhi ? 'Memenuhi' : 'Kurang'}
              </span>
            }
          />

          <MetricCard
            title="Total Realisasi Belanja"
            value={fmtTriliun(realisasi)}
            subtitle={`Penyerapan: ${fmtPct(persentaseSerapan)}`}
            icon={<TrendingUp size={20} className="text-amber-600" />}
            accent="amber"
          />
        </div>

        {/* Ringkasan per Jenjang Pendidikan (Spreadsheet Table) */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-text-primary">
                Alokasi & Penyerapan per Jenjang Pendidikan (Provinsi Lampung)
              </h3>
            </div>
            <span className="text-xs text-text-muted font-mono">11.354 Satuan Pendidikan Terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-left">Jenjang Pendidikan</th>
                  <th className="sheet-header-cell text-center">Jumlah Satuan</th>
                  <th className="sheet-header-cell text-right">Alokasi Anggaran</th>
                  <th className="sheet-header-cell text-right">Realisasi Serapan</th>
                  <th className="sheet-header-cell text-right">Sisa Alokasi</th>
                  <th className="sheet-header-cell text-center">% Penyerapan</th>
                  <th className="sheet-header-cell" style={{ width: 180 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {jenjangList.map((j, idx) => {
                  const barColor =
                    j.persentase >= 80 ? '#10b981' : j.persentase >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr
                      key={j.jenjang}
                      className="hover:bg-indigo-50/50 transition"
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <td className="sheet-cell text-left font-medium text-text-primary">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full" style={{ background: barColor }} />
                          <Link
                            href={`/dashboard/jenjang/${j.jenjang.toLowerCase()}`}
                            className="hover:text-accent hover:underline transition-colors flex items-center gap-1"
                          >
                            {j.label}
                            <ArrowUpRight size={13} className="opacity-60" />
                          </Link>
                        </div>
                      </td>
                      <td className="sheet-cell text-center font-mono text-text-secondary">
                        {j.jumlah_sekolah.toLocaleString('id-ID')}
                      </td>
                      <td className="sheet-cell text-right font-mono font-medium">{fmtTriliun(j.nominal)}</td>
                      <td className="sheet-cell text-right font-mono text-emerald-700">{fmtTriliun(j.realisasi)}</td>
                      <td className="sheet-cell text-right font-mono text-rose-600">{fmtTriliun(j.selisih)}</td>
                      <td className="sheet-cell text-center">
                        <PctBadge value={j.persentase} />
                      </td>
                      <td className="sheet-cell">
                        <div className="progress-bar-track">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(j.persentase, 100)}%`,
                              background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sheet-footer-cell text-left font-bold">TOTAL PENDIDIKAN</td>
                  <td className="sheet-footer-cell text-center font-mono font-bold">
                    {jenjangList.reduce((acc, curr) => acc + curr.jumlah_sekolah, 0).toLocaleString('id-ID')}
                  </td>
                  <td className="sheet-footer-cell text-right font-mono font-bold">{fmtTriliun(alokasiRiil)}</td>
                  <td className="sheet-footer-cell text-right font-mono font-bold text-emerald-700">{fmtTriliun(realisasi)}</td>
                  <td className="sheet-footer-cell text-right font-mono font-bold text-rose-600">
                    {fmtTriliun(alokasiRiil - realisasi)}
                  </td>
                  <td className="sheet-footer-cell text-center">
                    <PctBadge value={persentaseSerapan} size="md" />
                  </td>
                  <td className="sheet-footer-cell">
                    <div className="progress-bar-track">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${Math.min(persentaseSerapan, 100)}%`,
                          background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart: Alokasi vs Realisasi per Jenjang */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Alokasi vs Realisasi per Jenjang (Triliun Rp)
              </h3>
              <span className="text-xs text-text-muted font-mono">{activeTahun}</span>
            </div>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="jenjang" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v) => `${v}T`} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#1e293b',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: any) => [`${Number(value).toFixed(2)} T`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                <Bar dataKey="Alokasi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realisasi" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Area Chart: Ringkasan APBD Lampung */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">
                {trendYearsTitle}
              </h3>
              <span className="text-xs text-text-muted font-mono">Triliun Rp</span>
            </div>
            <ResponsiveContainer width="100%" height={290}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAlokasi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={(v) => `${v}T`} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #e2e8f0',
                    borderRadius: 8,
                    fontSize: 12,
                    color: '#1e293b',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: any) => [`${Number(value).toFixed(2)} T`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                <Area type="monotone" dataKey="TotalAPBD" name="Total APBD" stroke="#6366f1" fill="url(#gradTotal)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="AlokasiPendidikan" name="Alokasi Pendidikan" stroke="#10b981" fill="url(#gradAlokasi)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="Wajib20" name="Batas Wajib 20%" stroke="#f59e0b" strokeDasharray="4 4" fill="none" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Input Modal */}
      <ApbdInputModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        initialTotalApbd={totalApbd}
        initialAlokasiRiil={alokasiRiil}
        initialRealisasi={realisasi}
        tahun={activeTahun}
      />
    </div>
  );
}
