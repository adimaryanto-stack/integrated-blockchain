'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { fmtRupiah } from '@/lib/utils/formatters';
import { 
  Landmark, 
  CreditCard, 
  ShieldCheck, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Download, 
  Filter 
} from 'lucide-react';

interface MutationItem {
  id: string;
  tanggal: string;
  keterangan: string;
  tipe: 'Debet' | 'Kredit';
  nominal: number;
  runningBalance?: number;
}

export default function MutasiRekeningPage() {
  const { activeTahun } = useAppStore();
  const [school, setSchool] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<{ tahun: number; nominal: number; realisasi: number; selisih: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbItems, setDbItems] = useState<any[]>([]);

  // Fetch school details and transactions
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        // Fetch KB AL-IKHLAS (NPSN 69893669) as the active school
        let { data: instList } = await supabase
          .from('institusi_pendidikan')
          .select('*')
          .eq('npsn', '69893669')
          .limit(1);

        if (!instList || instList.length === 0) {
          const res = await supabase.from('institusi_pendidikan').select('*').limit(1);
          instList = res.data;
        }

        if (instList && instList.length > 0) {
          const s = instList[0];
          if (isMounted) setSchool(s);

          // Fetch yearly budget from pengeluaran_bulanan_institusi if any
          const { data: pbRows } = await supabase
            .from('pengeluaran_bulanan_institusi')
            .select('tahun, nominal_alokasi, realisasi_total')
            .eq('institusi_id', s.id)
            .order('tahun', { ascending: true });

          if (pbRows && pbRows.length > 0) {
            const byTahun = new Map<number, { nominal: number; realisasi: number }>();
            pbRows.forEach((r: any) => {
              const yr = Number(r.tahun);
              const ex = byTahun.get(yr) || { nominal: 0, realisasi: 0 };
              ex.nominal += Number(r.nominal_alokasi || 0);
              ex.realisasi += Number(r.realisasi_total || 0);
              byTahun.set(yr, ex);
            });
            const yd = Array.from(byTahun.entries()).map(([tahun, d]) => ({
              tahun,
              nominal: d.nominal,
              realisasi: d.realisasi,
              selisih: d.nominal - d.realisasi
            }));
            if (isMounted) setYearlyData(yd);
          } else {
            const nom = Number(s.nominal_alokasi || 0);
            const real = Number(s.realisasi_total || 0);
            if (isMounted) {
              setYearlyData([{
                tahun: activeTahun,
                nominal: nom,
                realisasi: real,
                selisih: nom - real
              }]);
            }
          }

          // Fetch expenditure transaction items
          const { data: items } = await supabase
            .from('rincian_pengeluaran_item')
            .select('*')
            .eq('institusi_id', s.id)
            .order('nomor_bulan', { ascending: true });

          if (isMounted) setDbItems(items || []);
        }
      } catch (err) {
        console.error('Error loading mutasi data:', err);
      }
      if (isMounted) setLoading(false);
    };

    loadData();
    return () => { isMounted = false; };
  }, [activeTahun]);

  const schoolName = school?.nama_institusi || 'Institusi Pendidikan';
  const npsn = school?.npsn || '-';
  const nomorRekening = school?.nomor_rekening || '100.201.303.000';

  const saldoAwal = useMemo(() => {
    return yearlyData
      .filter(d => d.tahun < activeTahun)
      .reduce((sum, d) => sum + d.selisih, 0);
  }, [yearlyData, activeTahun]);

  const currentSaldo = useMemo(() => {
    return yearlyData
      .filter(d => d.tahun <= activeTahun)
      .reduce((sum, d) => sum + d.selisih, 0);
  }, [yearlyData, activeTahun]);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  // Debet transactions (Expenditures)
  const debetTransactions = useMemo(() => {
    if (dbItems.length > 0) {
      return dbItems.map((item: any): MutationItem => {
        const monthShort = monthNames[(item.nomor_bulan || 1) - 1];
        return {
          id: `db-${item.id}`,
          tanggal: `15 ${monthShort} ${activeTahun}`,
          keterangan: item.nama_produk_jasa || 'Belanja Operasional',
          tipe: 'Debet',
          nominal: Number(item.jumlah || 0)
        };
      });
    }

    // Default simulated debet if table empty
    const realTotal = Number(school?.realisasi_total || 0);
    if (realTotal > 0) {
      return [
        {
          id: `db-ops-1`,
          tanggal: `20 Jan ${activeTahun}`,
          keterangan: 'Belanja Pengadaan Alat Tulis Kantor & Kertas',
          tipe: 'Debet' as const,
          nominal: Math.round(realTotal * 0.25)
        },
        {
          id: `db-ops-2`,
          tanggal: `18 Mar ${activeTahun}`,
          keterangan: 'Pemeliharaan Sarana & Prasarana Gedung',
          tipe: 'Debet' as const,
          nominal: Math.round(realTotal * 0.35)
        },
        {
          id: `db-ops-3`,
          tanggal: `10 Mei ${activeTahun}`,
          keterangan: 'Honorarium Tenaga Pendidik & Ekstrakurikuler',
          tipe: 'Debet' as const,
          nominal: Math.round(realTotal * 0.40)
        }
      ];
    }
    return [];
  }, [dbItems, school, activeTahun]);

  // Credit transactions (Inflow BOS/APBN/APBD)
  const creditTransactions = useMemo(() => {
    const nominal = Number(school?.nominal_alokasi || 0);
    if (nominal <= 0) return [];

    const apbnTotal = Math.round(nominal * 0.70);
    const apbdTotal = nominal - apbnTotal;

    return [
      {
        id: `cr-apbn-${activeTahun}-q1`,
        tanggal: `15 Jan ${activeTahun}`,
        keterangan: 'Pencairan Dana BOS APBN Tahap I',
        tipe: 'Kredit' as const,
        nominal: Math.round(apbnTotal * 0.50),
      },
      {
        id: `cr-apbd-${activeTahun}-q1`,
        tanggal: `22 Jan ${activeTahun}`,
        keterangan: 'Penyaluran Hibah Operasional APBD Tahap I',
        tipe: 'Kredit' as const,
        nominal: Math.round(apbdTotal * 0.50),
      },
      {
        id: `cr-apbn-${activeTahun}-q2`,
        tanggal: `15 Jul ${activeTahun}`,
        keterangan: 'Pencairan Dana BOS APBN Tahap II',
        tipe: 'Kredit' as const,
        nominal: apbnTotal - Math.round(apbnTotal * 0.50),
      },
      {
        id: `cr-apbd-${activeTahun}-q2`,
        tanggal: `22 Jul ${activeTahun}`,
        keterangan: 'Penyaluran Hibah Operasional APBD Tahap II',
        tipe: 'Kredit' as const,
        nominal: apbdTotal - Math.round(apbdTotal * 0.50),
      }
    ];
  }, [school, activeTahun]);

  const parseIndoDate = (dateStr: string): Date => {
    const months: Record<string, number> = {
      jan: 0, feb: 1, mar: 2, apr: 3, mei: 4, jun: 5,
      jul: 6, agu: 7, sep: 8, okt: 9, nov: 10, des: 11
    };
    const parts = dateStr.split(' ');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const monthStr = parts[1].toLowerCase();
      const year = parseInt(parts[2], 10);
      const month = months[monthStr] !== undefined ? months[monthStr] : 0;
      return new Date(year, month, day);
    }
    return new Date();
  };

  const allMutations = useMemo(() => {
    const combined = [...debetTransactions, ...creditTransactions];
    combined.sort((a, b) => parseIndoDate(a.tanggal).getTime() - parseIndoDate(b.tanggal).getTime());

    let balance = saldoAwal;
    const computed = combined.map(item => {
      if (item.tipe === 'Kredit') {
        balance += item.nominal;
      } else {
        balance -= item.nominal;
      }
      return {
        ...item,
        runningBalance: balance
      };
    });

    return computed.reverse();
  }, [debetTransactions, creditTransactions, saldoAwal]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Semua' | 'Kredit' | 'Debet'>('Semua');
  const [monthFilter, setMonthFilter] = useState('Semua');

  const monthsList = [
    { label: 'Januari', val: 'Jan' },
    { label: 'Februari', val: 'Feb' },
    { label: 'Maret', val: 'Mar' },
    { label: 'April', val: 'Apr' },
    { label: 'Mei', val: 'Mei' },
    { label: 'Juni', val: 'Jun' },
    { label: 'Juli', val: 'Jul' },
    { label: 'Agustus', val: 'Agu' },
    { label: 'September', val: 'Sep' },
    { label: 'Oktober', val: 'Okt' },
    { label: 'November', val: 'Nov' },
    { label: 'Desember', val: 'Des' },
  ];

  const filteredMutations = useMemo(() => {
    return allMutations.filter(item => {
      const matchesSearch = item.keterangan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.tanggal.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'Semua' ? true : item.tipe === typeFilter;
      const matchesMonth = monthFilter === 'Semua' ? true : item.tanggal.includes(monthFilter);
      return matchesSearch && matchesType && matchesMonth;
    });
  }, [allMutations, searchTerm, typeFilter, monthFilter]);

  const handleDownloadCSV = () => {
    alert('Simulasi export mutasi rekening sukses! (File CSV sedang disiapkan oleh sistem)');
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header title="Mutasi Rekening" subtitle="Memuat riwayat transaksi rekening dari database lokal..." />
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        title={`Mutasi Rekening: ${schoolName}`}
        subtitle={`Riwayat transaksi keuangan rekening koran sekolah untuk tahun anggaran ${activeTahun}`}
      />

      <div className="p-6 space-y-6">
        {/* TOP PANEL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px] border-l-4 border-l-indigo-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Saldo Rekapitulasi di Bank</p>
                <h3 className="text-xl lg:text-2xl font-extrabold text-text-primary mt-2">
                  Rp {fmtRupiah(currentSaldo)}
                </h3>
              </div>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Landmark size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-text-muted">
              <Calendar size={12} className="text-indigo-500" />
              <span>Akumulasi sisa anggaran s.d. {activeTahun}</span>
            </div>
          </div>

          <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px] border-l-4 border-l-emerald-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">Nomor Pokok Sekolah Nasional (NPSN)</p>
                <h3 className="text-xl lg:text-2xl font-mono font-extrabold text-text-primary mt-2">
                  {npsn}
                </h3>
              </div>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-text-muted">
              <span className="font-semibold text-emerald-600">Terdaftar Resmi</span>
              <span>• Kemendikbudristek RI</span>
            </div>
          </div>

          <div className="glass-card p-5 relative overflow-hidden flex flex-col justify-between min-h-[120px] border-l-4 border-l-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">No. Rekening Giro Operasional</p>
                <h3 className="text-xl lg:text-2xl font-mono font-extrabold text-text-primary mt-2">
                  {nomorRekening}
                </h3>
              </div>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CreditCard size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-text-muted">
              <span className="font-semibold text-blue-600">BANK PENAMPUNG</span>
              <span>• Rekening Giro Penampung BOS</span>
            </div>
          </div>
        </div>

        {/* MUTATION LIST TABLE */}
        <div className="glass-card">
          <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-text-primary">Daftar Mutasi Transaksi Rekening</h3>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input w-full md:w-48 pl-9"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="select-dropdown py-1.5 text-xs"
              >
                <option value="Semua">Semua Tipe</option>
                <option value="Kredit">Kredit (Uang Masuk)</option>
                <option value="Debet">Debet (Uang Keluar)</option>
              </select>

              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="select-dropdown py-1.5 text-xs"
              >
                <option value="Semua">Semua Bulan</option>
                {monthsList.map(m => (
                  <option key={m.val} value={m.val}>{m.label}</option>
                ))}
              </select>

              <button
                onClick={handleDownloadCSV}
                className="btn-secondary py-1.5 px-3 flex items-center gap-1.5 text-xs shadow-sm"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="sheet-header-cell text-left" style={{ width: 140 }}>Tanggal</th>
                  <th className="sheet-header-cell text-left">Keterangan / Rujukan</th>
                  <th className="sheet-header-cell text-center" style={{ width: 120 }}>Tipe</th>
                  <th className="sheet-header-cell text-right" style={{ width: 200 }}>Jumlah</th>
                  <th className="sheet-header-cell text-right" style={{ width: 220 }}>Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody>
                {filteredMutations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted text-xs">
                      Tidak ada histori mutasi transaksi yang sesuai dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredMutations.map((item) => (
                    <tr key={item.id} className="hover:bg-bg-card/30 transition-colors border-b border-border/40">
                      <td className="sheet-cell text-text-primary text-xs font-medium">
                        {item.tanggal}
                      </td>
                      <td className="sheet-cell text-text-primary text-xs max-w-md truncate">
                        {item.keterangan}
                      </td>
                      <td className="sheet-cell text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          item.tipe === 'Kredit' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' 
                            : 'bg-rose-50 text-rose-700 border border-rose-200/50'
                        }`}>
                          {item.tipe === 'Kredit' ? (
                            <>
                              <ArrowUpRight size={10} />
                              <span>Kredit (In)</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownLeft size={10} />
                              <span>Debet (Out)</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className={`sheet-cell text-right font-semibold text-xs ${
                        item.tipe === 'Kredit' ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {item.tipe === 'Kredit' ? '+' : '-'} Rp {fmtRupiah(item.nominal)}
                      </td>
                      <td className="sheet-cell text-right font-mono font-medium text-xs text-text-secondary">
                        Rp {fmtRupiah(item.runningBalance || 0)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3.5 border-t border-border bg-slate-50/50 flex items-center justify-between text-[11px] text-text-muted font-medium">
            <span>
              Menampilkan {filteredMutations.length} dari {allMutations.length} total mutasi transaksi.
            </span>
            <span>
              Saldo Akhir Tahun {activeTahun}: <strong className="text-text-primary font-mono text-xs ml-1">Rp {fmtRupiah(currentSaldo)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
