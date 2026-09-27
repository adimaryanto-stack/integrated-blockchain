"use client";

import Link from 'next/link';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SharedNavbar from '@/components/SharedNavbar';

interface ProvinceItem {
    id: string;
    name: string;
    code: string;
    schoolCount: number;
    regencyCount: number;
    stats?: {
        PAUD: number;
        SD: number;
        SMP: number;
        SMA: number;
        Universitas: number;
    };
}

const JENJANG_LABELS: Record<string, string> = {
    PAUD: 'PAUD / TK / KB',
    SD: 'SD / Sederajat',
    SMP: 'SMP / Sederajat',
    SMA: 'SMA / SMK / Sederajat',
    UNIVERSITAS: 'Universitas',
};

function ProvincesPageInner() {
    const searchParams = useSearchParams();
    const activeJenjang = (searchParams.get('jenjang') || '').toUpperCase() as keyof typeof JENJANG_LABELS | '';

    const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [stats, setStats] = useState({ PAUD: 0, SD: 0, SMP: 0, SMA: 0, Universitas: 0 });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2028';
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
                const headers = {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                };

                // Fetch provinces + regencies + province stats in parallel
                // Province stats come DIRECTLY from institusi_pendidikan via RPC (no cache, always fresh)
                const [provsRes, regsRes, rpcRes] = await Promise.all([
                    supabase.from('provinces').select('id, name, code').order('name'),
                    supabase.from('regencies').select('id, province_id'),
                    fetch(`${supabaseUrl}/rest/v1/rpc/get_all_province_stats`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({}),
                    }),
                ]);

                // Parse province stats from RPC
                let pssList: any[] = [];
                if (rpcRes.ok) {
                    pssList = await rpcRes.json();
                }

                // Build national totals from RPC result
                const nationalStats = { PAUD: 0, SD: 0, SMP: 0, SMA: 0, Universitas: 0 };
                pssList.forEach((row: any) => {
                    nationalStats.PAUD += Number(row.paud) || 0;
                    nationalStats.SD += Number(row.sd) || 0;
                    nationalStats.SMP += Number(row.smp) || 0;
                    nationalStats.SMA += Number(row.sma) || 0;
                    nationalStats.Universitas += Number(row.univ) || 0;
                });
                setStats(nationalStats);
                setStatsLoading(false);

                // Get province list — fallback to provinsi table if provinces is empty
                let sortedProvs = (provsRes.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name, 'id'));
                let regsList = regsRes.data || [];

                if (sortedProvs.length === 0) {
                    const { data: legacyProvs } = await supabase.from('provinsi').select('id, nama_provinsi, kode_provinsi');
                    if (legacyProvs && legacyProvs.length > 0) {
                        sortedProvs = legacyProvs.map((p: any) => ({
                            id: p.id,
                            name: p.nama_provinsi,
                            code: p.kode_provinsi,
                        })).sort((a: any, b: any) => a.name.localeCompare(b.name, 'id'));
                    }
                }

                if (regsList.length === 0) {
                    const { data: legacyRegs } = await supabase.from('kabupaten_kota').select('id, provinsi_id');
                    if (legacyRegs) {
                        regsList = legacyRegs.map((r: any) => ({ id: r.id, province_id: r.provinsi_id }));
                    }
                }

                // Build a lookup map: province_id → stats row from RPC
                const statsById = new Map<string, any>();
                const statsByName = new Map<string, any>();
                pssList.forEach((row: any) => {
                    if (row.province_id) statsById.set(row.province_id, row);
                    if (row.province_name) statsByName.set(row.province_name.toLowerCase(), row);
                });

                const provsWithCount = sortedProvs.map((p: any) => {
                    const regIds = regsList.filter((r: any) => r.province_id === p.id).map((r: any) => r.id);

                    // Match by province_id first, then by name (RPC uses provinsi.id = 'p-XX')
                    const rpcRow = statsById.get(p.id) || statsByName.get((p.name || '').toLowerCase());

                    const provStats = {
                        PAUD: Number(rpcRow?.paud) || 0,
                        SD: Number(rpcRow?.sd) || 0,
                        SMP: Number(rpcRow?.smp) || 0,
                        SMA: Number(rpcRow?.sma) || 0,
                        Universitas: Number(rpcRow?.univ) || 0,
                    };

                    const schoolCount = provStats.PAUD + provStats.SD + provStats.SMP + provStats.SMA + provStats.Universitas;

                    return {
                        ...p,
                        regencyCount: regIds.length,
                        schoolCount,
                        stats: provStats,
                    };
                });

                setProvinces(provsWithCount);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching provinces data:', err);
                setLoading(false);
                setStatsLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Determine the stats key for the active jenjang
    const jenjangStatsKey = activeJenjang === 'UNIVERSITAS' ? 'Universitas'
        : activeJenjang
            ? (activeJenjang.charAt(0) + activeJenjang.slice(1).toLowerCase()) as keyof NonNullable<ProvinceItem['stats']>
            : null;

    // Check if any province actually has data for the active jenjang
    const totalJenjangCount = jenjangStatsKey
        ? provinces.reduce((sum, p) => sum + (p.stats?.[jenjangStatsKey] ?? 0), 0)
        : 0;
    const hasJenjangData = totalJenjangCount > 0;

    // Filter by search text
    let filtered = search
        ? provinces.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        : [...provinces];

    // Sort: by jenjang count desc if data exists, else alphabetically
    if (activeJenjang && jenjangStatsKey) {
        if (hasJenjangData) {
            filtered = filtered.sort((a, b) => (b.stats?.[jenjangStatsKey] ?? 0) - (a.stats?.[jenjangStatsKey] ?? 0));
        } else {
            filtered = filtered.sort((a, b) => a.name.localeCompare(b.name, 'id'));
        }
    }

    return (
        <div className="relative flex min-h-screen flex-col bg-slate-50">
            <SharedNavbar />

            <main className="min-h-screen bg-slate-50 pt-4 pb-16">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-8">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-2">
                            <span className="material-symbols-outlined">map</span>
                            <span className="text-sm font-bold uppercase tracking-wider">Navigasi Wilayah</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">Daftar Provinsi</h1>
                        <p className="text-slate-500 text-sm mt-1">Pilih provinsi untuk melihat data kabupaten/kota dan sekolah yang terdaftar.</p>

                        {/* Active jenjang filter badge */}
                        {activeJenjang && JENJANG_LABELS[activeJenjang] && (
                            <div className="flex items-center gap-2 mt-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                                    <span className="material-symbols-outlined text-base">school</span>
                                    Filter: {JENJANG_LABELS[activeJenjang]}
                                </span>
                                <Link href="/provinces" className="text-xs text-slate-400 hover:text-slate-600 underline">Hapus filter</Link>
                            </div>
                        )}
                    </div>

                    {/* Stats cards for schools */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-slate-500 font-bold text-sm text-center">PAUD/TK/KB</span>
                            {statsLoading ? (
                                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-1"></div>
                            ) : (
                                <span className="text-2xl font-black text-slate-900 mt-1">{stats.PAUD}</span>
                            )}
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-slate-500 font-bold text-sm text-center">SD/Sederajat</span>
                            {statsLoading ? (
                                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-1"></div>
                            ) : (
                                <span className="text-2xl font-black text-slate-900 mt-1">{stats.SD}</span>
                            )}
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-slate-500 font-bold text-sm text-center">SMP/Sederajat</span>
                            {statsLoading ? (
                                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-1"></div>
                            ) : (
                                <span className="text-2xl font-black text-slate-900 mt-1">{stats.SMP}</span>
                            )}
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-slate-500 font-bold text-sm text-center">SMA/SMK</span>
                            {statsLoading ? (
                                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-1"></div>
                            ) : (
                                <span className="text-2xl font-black text-slate-900 mt-1">{stats.SMA}</span>
                            )}
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                            <span className="text-slate-500 font-bold text-sm text-center">Universitas</span>
                            {statsLoading ? (
                                <div className="h-7 w-12 bg-slate-100 animate-pulse rounded-md mt-1"></div>
                            ) : (
                                <span className="text-2xl font-black text-slate-900 mt-1">{stats.Universitas}</span>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                        <input
                            className="w-full h-12 pl-12 pr-4 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-base"
                            placeholder="Cari provinsi..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>
                    ) : (
                        <>
                            {/* Data unavailable banner for active jenjang filter */}
                            {activeJenjang && JENJANG_LABELS[activeJenjang] && !hasJenjangData && (
                                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                    <span className="material-symbols-outlined text-amber-500 text-xl mt-0.5">info</span>
                                    <div>
                                        <p className="font-semibold text-amber-800 text-sm">Data {JENJANG_LABELS[activeJenjang]} belum tersedia</p>
                                        <p className="text-amber-700 text-xs mt-0.5">
                                            Database lokal belum memiliki data sekolah jenjang ini untuk semua provinsi.
                                            Provinsi ditampilkan secara alfabetis.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <p className="text-sm text-slate-500 font-medium">
                                {filtered.length} dari {provinces.length} provinsi
                                {activeJenjang && hasJenjangData && (
                                    <span className="ml-2 text-primary">· Diurutkan berdasarkan {JENJANG_LABELS[activeJenjang]} terbanyak</span>
                                )}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filtered.map(p => (
                                    <Link
                                        key={p.id}
                                        href={`/provinces/${p.code}`}
                                        className="bg-white rounded-xl p-6 border border-slate-200 hover:border-primary/40 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex items-start gap-4 w-full">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                                <span className="material-symbols-outlined">location_city</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">{p.name}</h3>
                                                <div className="flex gap-4 mt-1 text-xs text-slate-500">
                                                    <span>{p.regencyCount} Kab/Kota</span>
                                                    <span className="font-semibold text-slate-700">{p.schoolCount} Sekolah</span>
                                                </div>

                                                {/* School level breakdown grid */}
                                                <div className="grid grid-cols-3 gap-x-2 gap-y-1 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                                                    {([
                                                        { key: 'PAUD', label: 'PAUD', val: p.stats?.PAUD || 0 },
                                                        { key: 'SD',   label: 'SD',   val: p.stats?.SD   || 0 },
                                                        { key: 'SMP',  label: 'SMP',  val: p.stats?.SMP  || 0 },
                                                        { key: 'SMA',  label: 'SMA',  val: p.stats?.SMA  || 0 },
                                                        { key: 'UNIVERSITAS', label: 'Univ', val: p.stats?.Universitas || 0 },
                                                    ] as { key: string; label: string; val: number }[]).map(item => (
                                                        <div
                                                            key={item.key}
                                                            className={`flex justify-between ${
                                                                activeJenjang === item.key
                                                                    ? 'text-primary font-bold bg-primary/5 rounded px-0.5'
                                                                    : 'text-slate-500'
                                                            }`}
                                                        >
                                                            <span>{item.label}:</span>
                                                            <span className={`font-bold ${ activeJenjang === item.key ? 'text-primary' : 'text-slate-700' }`}>{item.val}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default function ProvincesPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
        }>
            <ProvincesPageInner />
        </Suspense>
    );
}
