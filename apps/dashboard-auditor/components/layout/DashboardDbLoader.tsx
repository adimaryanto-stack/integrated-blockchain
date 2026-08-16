'use client';

import { useEffect } from 'react';
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
    setIsLoadingDb
  } = useAppStore();

  useEffect(() => {
    // Jika sudah pernah dimuat di session ini, sync dan skip
    if (isSupabaseMode && dbData) {
      updateTahunAnggaranData(dbData.tahun_anggaran || []);
      updateAlokasiProvinsiData(dbData.alokasi_provinsi || []);
      updateAlokasiKabupatenKotaData(dbData.alokasi_kabupaten_kota || []);
      updateProvinceSchoolStatsData(dbData.province_school_stats || []);
      updateUsersData(dbData.users || []);
      updateMockAnomalies(dbData.audit_anomaly || []);
      return;
    }

    async function loadDatabase() {
      try {
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

        const dataTahun = resTahun.data || [];
        const dataProv = resProv.data || [];
        const dataAlokasiProv = resAlokasiProv.data || [];
        const dataKab = resKab.data || [];
        const dataAlokasiKab = resAlokasiKab.data || [];
        const dataUsers = resUsers.data || [];
        const dataAnoms = resAnoms.data || [];
        const dataStats = (resStats as any)?.data || [];

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

        updateTahunAnggaranData(loadedDb.tahun_anggaran);
        updateAlokasiProvinsiData(loadedDb.alokasi_provinsi);
        updateAlokasiKabupatenKotaData(loadedDb.alokasi_kabupaten_kota);
        updateProvinceSchoolStatsData(loadedDb.province_school_stats || []);
        updateUsersData(loadedDb.users);
        updateMockAnomalies(loadedDb.audit_anomaly);
      } catch (err: any) {
        console.error('[Supabase Loader] Koneksi error:', err);
      } finally {
        setIsLoadingDb(false);
      }
    }

    loadDatabase();
  }, []);

  return <>{children}</>;
}
