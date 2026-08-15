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
  const [school, setSchool] = useState<any>({
    id: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
    npsn: '69893669',
    nama_institusi: 'KB AL-IKHLAS',
    nomor_rekening: '100.845.411.000',
    nominal_alokasi: 234775639,
    realisasi_total: 197211537,
    selisih: 37564102
  });

  const [creditItems, setCreditItems] = useState<MutationItem[]>([
    {
      id: 'cr-1',
      tanggal: '15 Jan 2026',
      keterangan: 'Penerimaan BOP PAUD Reguler Tahap 1 (APBN 2026) - SP2D-APBN-2026-01-081',
      tipe: 'Kredit',
      nominal: 117387819
    },
    {
      id: 'cr-2',
      tanggal: '20 Feb 2026',
      keterangan: 'Penyaluran BOP PAUD Daerah Aceh Barat Tahap 1 (APBD 2026) - SP2D-APBD-0606-01',
      tipe: 'Kredit',
      nominal: 25000000
    },
    {
      id: 'cr-3',
      tanggal: '05 Mar 2026',
      keterangan: 'CSR Pendidikan PT Mifa Bersaudara Aceh (PAUD Ceria 2026) - CSR-MIFA-2026-033',
      tipe: 'Kredit',
      nominal: 5000000
    },
    {
      id: 'cr-4',
      tanggal: '10 Apr 2026',
      keterangan: 'Penerimaan BOP PAUD Reguler Tahap 2 (APBN 2026) - SP2D-APBN-2026-02-142',
      tipe: 'Kredit',
      nominal: 70432692
    },
    {
      id: 'cr-5',
      tanggal: '18 Jun 2026',
      keterangan: 'Penyaluran BOP PAUD Daerah Aceh Barat Tahap 2 (APBD 2026) - SP2D-APBD-0606-02',
      tipe: 'Kredit',
      nominal: 16955128
    }
  ]);

  const [debetItems, setDebetItems] = useState<MutationItem[]>([
    {
      id: 'db-1',
      tanggal: '15 Jan 2026',
      keterangan: 'Pengadaan Buku Cerita Bergambar & Modul Karakter Anak PAUD',
      tipe: 'Debet',
      nominal: 28500000
    },
    {
      id: 'db-2',
      tanggal: '28 Jan 2026',
      keterangan: 'Pengadaan Alat Permainan Edukatif (APE) Indoor & Outdoor',
      tipe: 'Debet',
      nominal: 35400000
    },
    {
      id: 'db-3',
      tanggal: '15 Feb 2026',
      keterangan: 'Honorarium Guru & Tenaga Pendidik PAUD (Bulan Jan-Feb)',
      tipe: 'Debet',
      nominal: 32000000
    },
    {
      id: 'db-4',
      tanggal: '10 Mar 2026',
      keterangan: 'Pengadaan ATK, Krayon, Kertas Lipat & Perlengkapan Menggambar Siswa',
      tipe: 'Debet',
      nominal: 18750000
    },
    {
      id: 'db-5',
      tanggal: '05 Apr 2026',
      keterangan: 'Pentas Seni Kreativitas Anak & Kunjungan Edukasi Lingkungan',
      tipe: 'Debet',
      nominal: 22600000
    },
    {
      id: 'db-6',
      tanggal: '12 Mei 2026',
      keterangan: 'Honorarium Guru & Tenaga Pendidik PAUD (Bulan Mar-Apr)',
      tipe: 'Debet',
      nominal: 32000000
    },
    {
      id: 'db-7',
      tanggal: '18 Jun 2026',
      keterangan: 'Pemeliharaan Sanitasi, Kebersihan & Obat P3K Anak PAUD',
      tipe: 'Debet',
      nominal: 15400000
    },
    {
      id: 'db-8',
      tanggal: '15 Jul 2026',
      keterangan: 'Langganan Listrik, Internet & Komunikasi Sekolah PAUD',
      tipe: 'Debet',
      nominal: 12561537
    }
  ]);

  const [loading, setLoading] = useState(false);

  // Fetch real-time data from local PostgreSQL DB
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const schoolId = 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7';
        
        // 1. Fetch School Detail
        const { data: instList } = await supabase
          .from('institusi_pendidikan')
          .select('*')
          .eq('id', schoolId)
          .limit(1);

        if (instList && instList.length > 0 && isMounted) {
          setSchool(instList[0]);
        }

        // 2. Fetch Incoming Funds (Credits)
        const { data: fundList } = await supabase
          .from('incoming_funds')
          .select('*')
          .eq('school_id', schoolId)
          .order('received_date', { ascending: true });

        if (fundList && fundList.length > 0 && isMounted) {
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
          const mappedCredits: MutationItem[] = fundList.map((f: any) => {
            const d = f.received_date ? new Date(f.received_date) : new Date();
            const dateFormatted = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            return {
              id: `cr-${f.id}`,
              tanggal: dateFormatted,
              keterangan: `${f.source} - ${f.reference_number || 'SP2D Terbit'}`,
              tipe: 'Kredit',
              nominal: Math.round(Number(f.amount || 0))
            };
          });
          setCreditItems(mappedCredits);
        }

        // 3. Fetch Expenditure Items (Debets)
        const { data: expList } = await supabase
          .from('rincian_pengeluaran_item')
          .select('*')
          .eq('institusi_id', schoolId)
          .order('nomor', { ascending: true });

        if (expList && expList.length > 0 && isMounted) {
          const debetDates = [
            '15 Jan 2026', '28 Jan 2026', '15 Feb 2026', '10 Mar 2026',
            '05 Apr 2026', '12 Mei 2026', '18 Jun 2026', '15 Jul 2026'
          ];
          const mappedDebets: MutationItem[] = expList.map((it: any, idx: number) => {
            return {
              id: `db-${it.id}`,
              tanggal: debetDates[idx % debetDates.length],
              keterangan: it.nama_produk_jasa || 'Belanja Operasional Sekolah',
              tipe: 'Debet',
              nominal: Math.round(Number(it.jumlah || it.harga_satuan || 0))
            };
          });
          setDebetItems(mappedDebets);
        }
      } catch (err) {
        console.error('Error loading mutasi data from database:', err);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [activeTahun]);

  const schoolName = school?.nama_institusi || 'KB AL-IKHLAS';
  const npsn = school?.npsn || '69893669';
  const nomorRekening = school?.nomor_rekening || '100.845.411.000';

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
    const combined = [...debetItems, ...creditItems];
    // Sort chronologically ascending
    combined.sort((a, b) => parseIndoDate(a.tanggal).getTime() - parseIndoDate(b.tanggal).getTime());

    let balance = 0;
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

    // Display newest first
    return computed.reverse();
  }, [debetItems, creditItems]);

  const currentSaldo = useMemo(() => {
    const totalCredit = creditItems.reduce((sum, item) => sum + item.nominal, 0);
    const totalDebet = debetItems.reduce((sum, item) => sum + item.nominal, 0);
    return totalCredit - totalDebet;
  }, [creditItems, debetItems]);

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

  return (
    <div className="min-h-screen pb-12">
      <Header
        title={`Mutasi Rekening: ${schoolName}`}
        subtitle={`Riwayat transaksi rekening koran kas sekolah terkoneksi database lokal untuk tahun anggaran ${activeTahun}`}
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
              <span>Sisa saldo kas aktif per {activeTahun}</span>
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
              <span>• Rekening Giro BPD Aceh Syariah</span>
            </div>
          </div>
        </div>

        {/* MUTATION LIST TABLE */}
        <div className="glass-card">
          <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-indigo-600" />
              <h3 className="text-sm font-semibold text-text-primary">Daftar Mutasi Transaksi Rekening Kas</h3>
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
              Menampilkan {filteredMutations.length} dari {allMutations.length} total mutasi transaksi kas.
            </span>
            <span>
              Saldo Akhir Kas {activeTahun}: <strong className="text-text-primary font-mono text-xs ml-1">Rp {fmtRupiah(currentSaldo)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
