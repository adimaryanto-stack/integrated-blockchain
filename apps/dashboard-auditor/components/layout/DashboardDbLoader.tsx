'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import {
  updateTahunAnggaranData,
  updateAlokasiProvinsiData,
  updateAlokasiKabupatenKotaData,
  updateProvinceSchoolStatsData,
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
    setIsLoadingDb
  } = useAppStore();

  const [loaderText, setLoaderText] = useState('Menginisialisasi dasbor...');
  const [initFailed, setInitFailed] = useState(false);
  const [failReason, setFailReason] = useState('');

  useEffect(() => {
    // Jika sudah pernah dimuat di session ini, sync dan skip
    if (isSupabaseMode && dbData) {
      const dataAlokasiProv = dbData.alokasi_provinsi || [];
      const dataProv = dbData.provinsi || [];
      const hasProvinsiRelation = dataAlokasiProv.length > 0 && dataAlokasiProv[0].provinsi;
      
      let populated = dataAlokasiProv;
      if (!hasProvinsiRelation && dataProv.length > 0) {
        populated = dataAlokasiProv.map((ap: any) => {
          const prov = dataProv.find((p: any) => p.id === ap.provinsi_id);
          return {
            ...ap,
            provinsi: prov
              ? { id: prov.id, kode_provinsi: prov.kode_provinsi, nama_provinsi: prov.nama_provinsi }
              : { id: ap.provinsi_id, kode_provinsi: '', nama_provinsi: 'Provinsi' }
          };
        });
        setDbData({ ...dbData, alokasi_provinsi: populated });
      }

      updateTahunAnggaranData(dbData.tahun_anggaran || []);
      updateAlokasiProvinsiData(populated);
      updateAlokasiKabupatenKotaData(dbData.alokasi_kabupaten_kota || []);
      updateProvinceSchoolStatsData(dbData.province_school_stats || []);
      updateUsersData(dbData.users || []);
      updateMockAnomalies(dbData.audit_anomaly || []);
      return;
    }

    async function loadDatabase() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2026';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpweXR4bW54Ymljam1nc2dwcmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODk1NzAsImV4cCI6MjA4ODI2NTU3MH0.BGQGztExtjrTr6XHrvQZ1A0njAAdkoBAp3APRfWsQNE';

      setIsLoadingDb(true);
      setLoaderText('Memeriksa koneksi database lokal...');

      try {
        // Test query on one table to see if connection works and schema exists
        // Add timeout to prevent infinite loading if local DB is not running
        const testPromise = supabase
          .from('tahun_anggaran')
          .select('*')
          .limit(1);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Koneksi ke database lokal timeout setelah 10 detik. Pastikan server database berjalan di localhost.')), 10000)
        );
        const { data: testData, error: testError } = await Promise.race([testPromise, timeoutPromise]) as any;

        if (testError) {
          if (testError.message.includes('relation') || testError.message.includes('does not exist')) {
            console.warn('[Supabase Loader] Tabel tidak ditemukan. Gunakan Mock Data.');
            setIsSupabaseMode(false);
            setIsLoadingDb(false);
            return;
          }
          throw testError;
        }

        setLoaderText('Mengunduh data anggaran dan wilayah...');

        // Fetch all tables in parallel
        const [
          resTahun,
          resProv,
          resAlokasiProv,
          resKab,
          resAlokasiKab,
          resUsers,
          resAnoms,
          resStats
        ] = await Promise.all([
          supabase.from('tahun_anggaran').select('*'),
          supabase.from('provinsi').select('*'),
          supabase.from('alokasi_provinsi').select('*'),
          supabase.from('kabupaten_kota').select('*'),
          supabase.from('alokasi_kabupaten_kota').select('*'),
          supabase.from('users').select('*'),
          supabase.from('audit_anomaly').select('*'),
          supabase.from('province_school_stats').select('*')
        ]);

        if (resTahun.error) throw resTahun.error;
        if (resProv.error) throw resProv.error;
        if (resAlokasiProv.error) throw resAlokasiProv.error;
        if (resKab.error) throw resKab.error;
        if (resAlokasiKab.error) throw resAlokasiKab.error;
        if (resUsers.error) throw resUsers.error;
        if (resAnoms.error) throw resAnoms.error;

        setLoaderText('Sinkronisasi selesai...');

        const dataTahun = resTahun.data || [];
        const dataProv = resProv.data || [];
        const dataAlokasiProv = resAlokasiProv.data || [];
        const dataKab = resKab.data || [];
        const dataAlokasiKab = resAlokasiKab.data || [];
        const dataUsers = resUsers.data || [];
        const dataAnoms = resAnoms.data || [];
        const dataStats = resStats.data || [];

        // Populate provinsi relation on alokasi_provinsi
        const populatedAlokasiProv = dataAlokasiProv.map((ap: any) => {
          const prov = dataProv.find((p: any) => p.id === ap.provinsi_id);
          return {
            ...ap,
            provinsi: prov
              ? { id: prov.id, kode_provinsi: prov.kode_provinsi, nama_provinsi: prov.nama_provinsi }
              : { id: ap.provinsi_id, kode_provinsi: '', nama_provinsi: 'Provinsi' }
          };
        });

        // Populate kabupaten_kota relation on alokasi_kabupaten_kota
        const populatedAlokasiKab = dataAlokasiKab.map((ak: any) => {
          const kk = dataKab.find((k: any) => k.id === ak.kabupaten_kota_id);
          return {
            ...ak,
            kabupaten_kota: kk ? kk : { id: ak.kabupaten_kota_id, provinsi_id: '', kode_kabupaten_kota: '', nama_kabupaten_kota: ak.kabupaten_kota_nama || '', tipe: 'KABUPATEN' }
          };
        });

        const loadedDb = {
          tahun_anggaran: dataTahun,
          provinsi: dataProv,
          alokasi_provinsi: populatedAlokasiProv,
          kabupaten_kota: dataKab,
          alokasi_kabupaten_kota: populatedAlokasiKab,
          institusi_pendidikan: [],
          province_school_stats: dataStats,
          sumber_dana_institusi: [],
          pengeluaran_bulanan_institusi: [],
          rincian_pengeluaran_item: [],
          users: dataUsers,
          audit_anomaly: dataAnoms,
        };

        setDbData(loadedDb);
        setIsSupabaseMode(true);

        // Sync variabel modul lib/data
        updateTahunAnggaranData(loadedDb.tahun_anggaran);
        updateAlokasiProvinsiData(loadedDb.alokasi_provinsi);
        updateAlokasiKabupatenKotaData(loadedDb.alokasi_kabupaten_kota);
        updateProvinceSchoolStatsData(loadedDb.province_school_stats || []);
        updateUsersData(loadedDb.users);
        updateMockAnomalies(loadedDb.audit_anomaly);

        console.log('[Supabase Loader] Berhasil sinkron tabel referensi dari Supabase.');
      } catch (err: any) {
        console.error('[Supabase Loader] Koneksi gagal:', err.message);
        setInitFailed(true);
        setFailReason(err.message || 'Gagal menghubungi server database lokal.');
        // Fallback ke mock data
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
          
          {/* Glowing Orbs Backdrop */}
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />

          {initFailed ? (
            <>
              <div className="relative p-4 bg-rose-500/10 border border-rose-500/30 text-rose-500 rounded-full animate-bounce">
                <CloudAlert size={40} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Koneksi Supabase Gagal</h3>
                <p className="text-xs text-slate-400 break-all px-4">{failReason}</p>
                <p className="text-xs text-indigo-400 font-semibold mt-4">Mengalihkan ke Mode Mock Data...</p>
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
                  Menyinkronkan data anggaran pendidikan dari database PostgreSQL lokal (port 2025)
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
