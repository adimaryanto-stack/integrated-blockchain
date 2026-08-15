'use client';

import { useEffect, useState } from 'react';
import { useAppStore, SEED_PROJECTS, SEED_EXPENSES, SEED_VENDORS } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  updateTahunAnggaranData,
  updateAlokasiProvinsiData,
  updateUsersData,
  updateMockAnomalies
} from '@/lib/data';
import { Database, Loader2, CloudAlert, Sparkles } from 'lucide-react';

export default function DashboardDbLoader({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    isSupabaseMode,
    setIsSupabaseMode,
    dbData,
    setDbData,
    isLoadingDb,
    setIsLoadingDb,
    setNotifications,
    setPaketProjectList,
    setProjectPhotos,
    setProjectExpenses,
    setProjectVendors
  } = useAppStore();

  const [loaderText, setLoaderText] = useState('Menginisialisasi dasbor...');
  const [initFailed, setInitFailed] = useState(false);
  const [failReason, setFailReason] = useState('');

  useEffect(() => {
    // If already loaded in this session, sync and return
    if (isSupabaseMode && dbData) {
      updateTahunAnggaranData(dbData.tahun_anggaran || []);
      updateAlokasiProvinsiData(dbData.alokasi_provinsi || []);
      updateUsersData(dbData.users || []);
      updateMockAnomalies(dbData.audit_anomaly || []);
      return;
    }

    async function loadDatabase() {
      setIsLoadingDb(true);
      setLoaderText('Memeriksa koneksi database lokal...');

      try {
        // Test query on tahun_anggaran
        const testPromise = supabase
          .from('tahun_anggaran')
          .select('*')
          .limit(1);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Koneksi ke database lokal timeout setelah 10 detik. Pastikan proxy berjalan di port 2026.')), 10000)
        );
        const { error: testError } = (await Promise.race([testPromise, timeoutPromise])) as any;

        if (testError) {
          if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
            console.warn('[DB Loader] Skema database belum lengkap. Gunakan mode lokal fallback.');
            setIsSupabaseMode(false);
            setIsLoadingDb(false);
            setPaketProjectList(SEED_PROJECTS);
            setProjectPhotos([]);
            setProjectExpenses(SEED_EXPENSES);
            setProjectVendors(SEED_VENDORS);
            return;
          }
          throw testError;
        }

        setLoaderText('Mengunduh data anggaran dan wilayah...');

        // Fetch reference tables in parallel (lightweight tables only)
        const [
          resTahun,
          resProv,
          resAlokasiProv,
          resKab,
          resAlokasiKab,
          resUsers,
          resAnoms,
          resProjects,
          resPhotos,
          resExpenses,
          resVendors
        ] = await Promise.all([
          supabase.from('tahun_anggaran').select('*'),
          supabase.from('provinsi').select('*'),
          supabase.from('alokasi_provinsi').select('*'),
          supabase.from('kabupaten_kota').select('*'),
          supabase.from('alokasi_kabupaten_kota').select('*'),
          supabase.from('users').select('*'),
          supabase.from('audit_anomaly').select('*'),
          supabase.from('projects').select('*'),
          supabase.from('project_photos').select('*'),
          supabase.from('project_expenses').select('*'),
          supabase.from('project_vendors').select('*')
        ]);

        if (resTahun.error) throw resTahun.error;
        if (resProv.error) throw resProv.error;
        if (resAlokasiProv.error) throw resAlokasiProv.error;
        if (resKab.error) throw resKab.error;
        if (resAlokasiKab.error) throw resAlokasiKab.error;
        if (resUsers.error) throw resUsers.error;
        if (resAnoms.error) throw resAnoms.error;

        setLoaderText('Sinkronisasi data sistem...');

        const dataTahun = resTahun.data || [];
        const dataProv = resProv.data || [];
        const dataAlokasiProv = resAlokasiProv.data || [];
        const dataKab = resKab.data || [];
        const dataAlokasiKab = resAlokasiKab.data || [];
        const dataUsers = resUsers.data || [];
        const dataAnoms = resAnoms.data || [];

        // Enrich alokasi_provinsi with province details
        const populatedAlokasiProv = dataAlokasiProv.map((ap: any) => {
          const prov = dataProv.find((p: any) => p.id === ap.provinsi_id);
          return {
            ...ap,
            nominal_alokasi: Number(ap.nominal_alokasi || 0),
            realisasi_total: Number(ap.realisasi_total || 0),
            selisih: Number(ap.nominal_alokasi || 0) - Number(ap.realisasi_total || 0),
            persentase_penyerapan: Number(ap.persentase_penyerapan || 0),
            provinsi: prov
              ? { id: prov.id, kode_provinsi: prov.kode_provinsi, nama_provinsi: prov.nama_provinsi }
              : { id: ap.provinsi_id, kode_provinsi: '', nama_provinsi: 'Provinsi' }
          };
        });

        // Enrich alokasi_kabupaten_kota with kabupaten_kota details
        const populatedAlokasiKab = dataAlokasiKab.map((ak: any) => {
          const kk = dataKab.find((k: any) => k.id === ak.kabupaten_kota_id);
          return {
            ...ak,
            nominal_alokasi: Number(ak.nominal_alokasi || 0),
            realisasi_total: Number(ak.realisasi_total || 0),
            selisih: Number(ak.nominal_alokasi || 0) - Number(ak.realisasi_total || 0),
            persentase_penyerapan: Number(ak.persentase_penyerapan || 0),
            kabupaten_kota: kk || {
              id: ak.kabupaten_kota_id,
              provinsi_id: '',
              kode_kabupaten_kota: '',
              nama_kabupaten_kota: ak.kabupaten_kota_nama || '',
              tipe: 'KABUPATEN'
            }
          };
        });

        const loadedDb = {
          tahun_anggaran: dataTahun,
          provinsi: dataProv,
          alokasi_provinsi: populatedAlokasiProv,
          kabupaten_kota: dataKab,
          alokasi_kabupaten_kota: populatedAlokasiKab,
          institusi_pendidikan: [], // Heavy table: pages query directly with pagination
          sumber_dana_institusi: [],
          pengeluaran_bulanan_institusi: [],
          rincian_pengeluaran_item: [],
          users: dataUsers,
          audit_anomaly: dataAnoms
        };

        setDbData(loadedDb);
        setIsSupabaseMode(true);

        // Populate projects or seed if table is empty
        if (resProjects.data && resProjects.data.length === 0) {
          setPaketProjectList(SEED_PROJECTS);
          setProjectPhotos([]);
          setProjectExpenses(SEED_EXPENSES);
          setProjectVendors(SEED_VENDORS);
        } else {
          setPaketProjectList(resProjects.data || []);
          setProjectPhotos(resPhotos.data || []);
          setProjectExpenses(resExpenses.data || []);
          setProjectVendors(resVendors.data || []);
        }

        // Sync local memory variables in lib/data
        updateTahunAnggaranData(loadedDb.tahun_anggaran);
        updateAlokasiProvinsiData(loadedDb.alokasi_provinsi);
        updateUsersData(loadedDb.users);
        updateMockAnomalies(loadedDb.audit_anomaly);

        // Generate notifications from anomalies
        const mappedNotifications = dataAnoms.map((anom: any, idx: number) => {
          let nType: 'info' | 'success' | 'warning' = 'info';
          if (anom.tingkat_keparahan === 'HIGH') nType = 'warning';
          else if (anom.tingkat_keparahan === 'MEDIUM') nType = 'info';
          else if (anom.tingkat_keparahan === 'LOW') nType = 'success';
          return {
            id: `n-anom-${anom.id}`,
            message: `Peringatan Audit: Terdeteksi ${anom.tipe_anomali} di ${anom.nama_institusi || 'Institusi'} (${anom.bulan || '2026'})`,
            time: `${idx + 1} jam yang lalu`,
            unread: anom.status !== 'SELESAI',
            type: nType,
            link: `/dashboard/audit`
          };
        });

        if (mappedNotifications.length === 0) {
          mappedNotifications.push({
            id: 'n-system-ready',
            message: 'Semua sistem terhubung dengan database lokal dan berjalan normal.',
            time: 'Baru saja',
            unread: false,
            type: 'success',
            link: '/dashboard'
          });
        }
        setNotifications(mappedNotifications);

        console.log('[DB Loader] Berhasil menyinkronkan data dari database lokal (port 2026).');
      } catch (err: any) {
        console.error('[DB Loader] Koneksi gagal:', err.message);
        setInitFailed(true);
        setFailReason(err.message || 'Gagal menghubungi server database lokal.');
        setTimeout(() => {
          setIsSupabaseMode(false);
          setIsLoadingDb(false);
        }, 3000);
        return;
      }

      setIsLoadingDb(false);
    }

    loadDatabase();
  }, []);

  if (isLoadingDb) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl transition-all duration-500">
        <div className="relative flex flex-col items-center max-w-md p-8 text-center space-y-6">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />

          {initFailed ? (
            <>
              <div className="relative p-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full animate-bounce">
                <CloudAlert size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Koneksi Database Lokal Gagal</h3>
                <p className="text-xs text-slate-400 break-all px-4">{failReason}</p>
                <p className="text-xs text-indigo-400 font-semibold mt-4">Mengalihkan ke Mode Data Lokal...</p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl scale-125 animate-pulse" />
                <div className="relative p-6 bg-slate-900 border border-slate-800 text-indigo-500 rounded-3xl shadow-2xl flex items-center justify-center">
                  <Database size={44} className="animate-pulse" />
                  <Loader2 size={24} className="absolute text-emerald-400 animate-spin -top-1 -right-1" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                  <Sparkles size={12} />
                  <span>Database Lokal Aktif</span>
                </div>
                <h3 className="text-md font-bold text-white tracking-wide">{loaderText}</h3>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Menyinkronkan data anggaran pendidikan dari database PostgreSQL lokal (port 2025/2026)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
