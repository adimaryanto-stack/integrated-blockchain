'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import MetricCard from '@/components/ui/MetricCard';
import PctBadge from '@/components/ui/PctBadge';
import { fmtPct, fmtRupiah } from '@/lib/utils/formatters';
import {
  Wallet, TrendingUp, PieChart, Calendar, Landmark,
  ClipboardList, FolderKanban, CreditCard, ShieldCheck, ArrowRight,
  KeyRound, UserCog
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Area, AreaChart, Legend
} from 'recharts';
import { useMemo, useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface YearData {
  tahun: number;
  nominal: number;
  realisasi: number;
  persentase: number;
  selisih: number;
}

export default function DashboardPage() {
  const { activeTahun, setActiveTahun, currentUser, setEditProfileOpen } = useAppStore();

  // Fetch institusi data for KB AL-IKHLAS from local PostgreSQL DB
  const [institusi, setInstitusi] = useState<any>({
    id: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
    npsn: '69893669',
    nama_institusi: 'KB AL-IKHLAS',
    nomor_rekening: '100.845.411.000',
    nominal_alokasi: 234775639,
    realisasi_total: 197211537,
    selisih: 37564102,
    persentase_penyerapan: 84.0
  });

  const [yearlyData, setYearlyData] = useState<YearData[]>([
    {
      tahun: 2026,
      nominal: 234775639,
      realisasi: 197211537,
      selisih: 37564102,
      persentase: 84.0
    }
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        // Fetch KB AL-IKHLAS (NPSN 69893669) as the active school account
        let { data: instList } = await supabase
          .from('institusi_pendidikan')
          .select('*')
          .eq('npsn', '69893669')
          .limit(1);

        if (!instList || instList.length === 0) {
          const res = await supabase.from('institusi_pendidikan').select('*').limit(1);
          instList = res.data;
        }

        // Fetch all years from database
        const { data: dbYears } = await supabase
          .from('tahun_anggaran')
          .select('*')
          .order('tahun', { ascending: true });

        if (instList && instList.length > 0 && isMounted) {
          const inst = instList[0];
          setInstitusi(inst);

          const nominal = Number(inst.nominal_alokasi || 234775639);
          const realisasi = Number(inst.realisasi_total || 197211537);
          const selisih = nominal - realisasi;
          const persentase = nominal > 0 ? (realisasi / nominal) * 100 : 84.0;

          if (dbYears && dbYears.length > 0) {
            const mappedYears: YearData[] = dbYears.map((y: any) => {
              const th = Number(y.tahun);
              if (th === 2026) {
                return {
                  tahun: th,
                  nominal,
                  realisasi,
                  selisih,
                  persentase,
                };
              }
              return {
                tahun: th,
                nominal: 0,
                realisasi: 0,
                selisih: 0,
                persentase: 0,
              };
            });
            setYearlyData(mappedYears);
          } else {
            setYearlyData([
              {
                tahun: 2026,
                nominal,
                realisasi,
                selisih,
                persentase,
              },
              {
                tahun: 2027,
                nominal: 0,
                realisasi: 0,
                selisih: 0,
                persentase: 0,
              }
            ]);
          }
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [activeTahun]);

  const activeYearData = useMemo(() => {
    const found = yearlyData.find(d => d.tahun === activeTahun);
    if (found) return found;
    return { tahun: activeTahun, nominal: 0, realisasi: 0, selisih: 0, persentase: 0 };
  }, [yearlyData, activeTahun]);

  const trendYearsTitle = useMemo(() => {
    if (!yearlyData || yearlyData.length === 0) return 'Tren Penyerapan Anggaran Sekolah';
    const years = yearlyData.map(d => d.tahun);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    if (minYear === maxYear) return `Tren Penyerapan Anggaran Sekolah (${minYear})`;
    return `Tren Penyerapan Anggaran Sekolah (${minYear}–${maxYear})`;
  }, [yearlyData]);

  const currentSaldo = useMemo(
    () => yearlyData.filter(d => d.tahun <= activeTahun).reduce((sum, d) => sum + d.selisih, 0),
    [yearlyData, activeTahun]
  );

  const chartData = useMemo(() =>
    yearlyData.map(d => ({
      tahun: String(d.tahun),
      Nominal: d.nominal,
      Realisasi: d.realisasi,
    })),
    [yearlyData]
  );

  const formatChartValue = (val: number) => {
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} M`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)} Jt`;
    return String(val);
  };

  const schoolName = institusi?.nama_institusi || 'Institusi Pendidikan';

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Dashboard" subtitle="Memuat data dari database lokal..." />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`Dashboard: ${schoolName}`}
        subtitle={`Ringkasan analisis audit anggaran sekolah untuk tahun anggaran ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Alokasi Anggaran Sekolah"
            value={`Rp ${fmtRupiah(activeYearData.nominal)}`}
            subtitle={`Alokasi Dana Sekolah ${activeTahun}`}
            icon={<Wallet size={20} className="text-indigo-600" />}
            accent="indigo"
            trend={{ value: 4.8, label: `dari ${activeTahun - 1}` }}
          />
          <MetricCard
            title="Total Realisasi Belanja"
            value={`Rp ${fmtRupiah(activeYearData.realisasi)}`}
            subtitle="Penyerapan anggaran sekolah saat ini"
            icon={<TrendingUp size={20} className="text-emerald-600" />}
            accent="emerald"
            trend={{ value: 3.5, label: 'dari bulan lalu' }}
          />
          <MetricCard
            title="Persentase Penyerapan"
            value={fmtPct(activeYearData.persentase)}
            subtitle="Target minimal penyerapan 85%"
            icon={<PieChart size={20} className="text-amber-600" />}
            accent="amber"
          />
          <MetricCard
            title="Saldo Rekapitulasi di Bank"
            value={`Rp ${fmtRupiah(currentSaldo)}`}
            subtitle={`Akumulasi sisa anggaran s.d. ${activeTahun}`}
            icon={<Landmark size={20} className="text-blue-600" />}
            accent="blue"
          />
        </div>

        {/* Quick Actions / Alur Kerja Operasional Sekolah */}
        <div className="glass-card p-5 border border-indigo-100/80 bg-gradient-to-r from-indigo-50/60 via-purple-50/40 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-indigo-100/60">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs shadow-sm">⚡</span>
                Aksi Cepat Manajemen Anggaran
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Pusat pintasan bagi Operator & Admin Sekolah untuk membuat rencana (RAB) hingga pencatatan pengeluaran
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditProfileOpen(true)}
                className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserCog size={13} className="text-indigo-600" />
                <span>Edit Profil</span>
              </button>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                Akses: {currentUser?.role === 'OPERATOR' ? 'Operator Sekolah' : 'Admin Sekolah'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Quick Button 1: Buat Rencana (RAB) */}
            <Link
              href="/dashboard/rencana-anggaran?action=tambah"
              className="p-3.5 bg-white rounded-2xl border-2 border-indigo-200 hover:border-indigo-500 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <ClipboardList size={18} />
                </div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  + Buat Baru
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1">
                  Buat Rencana (RAB)
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                  Susun draf alokasi kegiatan, kebutuhan barang & pagu anggaran
                </p>
              </div>
            </Link>

            {/* Quick Button 2: Paket Project */}
            <Link
              href="/dashboard/rencana-anggaran/paket-project"
              className="p-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FolderKanban size={18} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Dokumentasi
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors flex items-center gap-1">
                  Paket Project
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                  Dokumentasi fisik foto kegiatan, RAB paket & histori vendor
                </p>
              </div>
            </Link>

            {/* Quick Button 3: Tambah Pengeluaran */}
            <Link
              href="/dashboard/pengeluaran"
              className="p-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-blue-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard size={18} />
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Kas Keluar
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                  Catat Pengeluaran
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                  Input kuitansi riil belanja kas dan pemindaian OCR AI
                </p>
              </div>
            </Link>

            {/* Quick Button 4: Audit Anggaran */}
            <Link
              href="/dashboard/audit"
              className="p-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-amber-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <ShieldCheck size={18} />
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  AI Auditor
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition-colors flex items-center gap-1">
                  Audit Anggaran
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                  Pemeriksaan anomali nota, duplikasi & potensi kerugian negara
                </p>
              </div>
            </Link>

            {/* Quick Button 5: Access Control & RBAC Matrix */}
            <Link
              href="/dashboard/access-control"
              className="p-3.5 bg-white rounded-2xl border-2 border-slate-100 hover:border-purple-400 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <KeyRound size={18} />
                </div>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Scoped RBAC
                </span>
              </div>
              <div className="mt-3">
                <h4 className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                  Access Control
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </h4>
                <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">
                  Matriks izin modul & delegasi peran satuan KB AL-IKHLAS
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Ringkasan Pertahun Table */}
        <div className="glass-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            <h3 className="text-sm font-semibold text-text-primary">Ringkasan Penyerapan Anggaran Pertahun</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-left" style={{ width: 100 }}>Tahun</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Nominal Alokasi</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Realisasi Belanja</th>
                  <th className="sheet-header-cell text-right" style={{ minWidth: 200 }}>Sisa Anggaran (Surplus)</th>
                  <th className="sheet-header-cell text-center" style={{ width: 150 }}>% Penyerapan</th>
                  <th className="sheet-header-cell" style={{ width: 200 }}>Progress</th>
                </tr>
              </thead>
              <tbody>
                {yearlyData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="sheet-cell text-center text-text-muted text-xs py-8">
                      Tidak ada data pengeluaran bulanan di database.
                    </td>
                  </tr>
                ) : (
                  yearlyData.map((d, idx) => {
                    const barColor = d.persentase >= 85 ? '#10b981' : d.persentase >= 70 ? '#f59e0b' : '#ef4444';
                    const isCurrent = d.tahun === activeTahun;
                    return (
                      <tr
                        key={d.tahun}
                        className={`transition cursor-pointer ${isCurrent ? 'bg-indigo-50/70 hover:bg-indigo-50 font-bold border-l-4 border-l-indigo-600' : 'hover:bg-indigo-50/30'}`}
                        style={{ animationDelay: `${idx * 80}ms` }}
                        onClick={() => setActiveTahun(d.tahun)}
                      >
                        <td className="sheet-cell text-left">
                          <span className={`text-xs font-semibold ${isCurrent ? 'text-indigo-700' : 'text-text-primary'}`}>
                            Tahun {d.tahun} {isCurrent ? ' (Aktif)' : ''}
                          </span>
                        </td>
                        <td className="sheet-cell text-right font-mono">Rp {fmtRupiah(d.nominal)}</td>
                        <td className="sheet-cell text-right font-mono">Rp {fmtRupiah(d.realisasi)}</td>
                        <td className={`sheet-cell text-right font-mono ${d.selisih >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          Rp {fmtRupiah(d.selisih)}
                        </td>
                        <td className="sheet-cell text-center">
                          <PctBadge value={d.persentase} />
                        </td>
                        <td className="sheet-cell">
                          <div className="progress-bar-track">
                            <div
                              className="progress-bar-fill"
                              style={{
                                width: `${Math.min(d.persentase, 100)}%`,
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
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">Perbandingan Anggaran vs Realisasi Pertahun</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={formatChartValue} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: any) => [`Rp ${fmtRupiah(Number(value))}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                  <Bar dataKey="Nominal" name="Anggaran Alokasi" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Realisasi" name="Realisasi Belanja" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-4">{trendYearsTitle}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="gradNominal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRealisasi" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="tahun" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} tickFormatter={formatChartValue} />
                  <Tooltip
                    contentStyle={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    formatter={(value: any) => [`Rp ${fmtRupiah(Number(value))}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
                  <Area type="monotone" dataKey="Nominal" name="Anggaran Alokasi" stroke="#6366f1" fill="url(#gradNominal)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Area type="monotone" dataKey="Realisasi" name="Realisasi Belanja" stroke="#10b981" fill="url(#gradRealisasi)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
