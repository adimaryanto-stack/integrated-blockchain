/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
// ============================================
// Supabase Data Connector — Dashboard Kementerian
// Fetches directly from Supabase PostgREST API using env credentials
// ============================================
import {
  TahunAnggaran,
  AlokasiProvinsi,
  AlokasiKabupatenKota,
  InstitusiPendidikan,
  User,
  UserRole,
  DashboardSummary,
  Jenjang,
  ProfilInstitusi,
  RincianPengeluaranBulanan,
  RincianPengeluaranItem,
  JenjangBreakdownProvinsi,
  SumberDanaInstitusi,
  PengeluaranBulananInstitusi,
} from '@/types';
import { useAppStore } from '@/lib/store';
import { fmtRupiah } from '@/lib/utils/formatters';


// In-memory caching variables populated during initialization
export const tahunAnggaranData: TahunAnggaran[] = [];
export const alokasiProvinsiData: AlokasiProvinsi[] = [];
export const alokasiKabupatenKotaData: AlokasiKabupatenKota[] = [];
export const institusiPendidikanData: InstitusiPendidikan[] = [];
export const sumberDanaData: SumberDanaInstitusi[] = [];
export const pengeluaranBulananData: PengeluaranBulananInstitusi[] = [];
export const usersData: User[] = [];
export const provinceSchoolStatsData: { province_id: string; jenjang: string; school_count: number }[] = [];

export function updateTahunAnggaranData(newData: TahunAnggaran[]) {
  tahunAnggaranData.length = 0;
  tahunAnggaranData.push(...newData);
}

let isInitialized = false;

// Utility to get Supabase connection details safely on the client
function getSupabaseConfig() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2026').trim();
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  return { url, anonKey };
}

// Helper for paginated fetch to bypass PostgREST 1000-row limit
async function fetchPaginated(url: string, headers: HeadersInit): Promise<any[]> {
  let allData: any[] = [];
  let offset = 0;
  const limit = 1000;
  const maxRows = 2000;

  while (allData.length < maxRows) {
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}limit=${limit}&offset=${offset}`, { headers });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Error details for ${url}:`, text);
      throw new Error(`Failed to fetch paginated data for ${url}: ${res.statusText}`);
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    allData = allData.concat(data);
    if (data.length < limit) break;
    offset += limit;
  }
  return allData;
}

const NUMERIC_KEYS = new Set([
  'total_anggaran', 'nominal_alokasi', 'realisasi_total', 'selisih', 
  'persentase_penyerapan', 'nominal', 'realisasi', 'saldo_di_bank', 
  'nominal_pengeluaran', 'sub_total', 'harga_satuan', 'jumlah', 
  'jumlah_sekolah', 'saldo_surplus_defisit', 'pajak_persen', 'pajak_nominal', 'total',
  'tahun', 'nomor', 'nomor_bulan', 'qty'
]);

function cleanRecord<T extends Record<string, any>>(row: T): T {
  if (!row || typeof row !== 'object') return row;
  const cleaned: any = {};
  for (const [k, v] of Object.entries(row)) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      cleaned[k] = cleanRecord(v);
    } else if (NUMERIC_KEYS.has(k) && v !== null && v !== undefined) {
      const num = Number(v);
      cleaned[k] = isNaN(num) ? 0 : num;
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned as T;
}

// Global initialization function to fetch and populate caches in parallel
export async function initDbConnection(force = false) {
  if (isInitialized && !force) return true;

  const { url, anonKey } = getSupabaseConfig();
  if (!anonKey) {
    console.warn('Supabase ANON KEY is not configured in .env.local.');
    return false;
  }

  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };

  try {
    const [taData, provData, kabkotaData, instData, sdData, pbData, userData, schoolStatsData] = await Promise.all([
      fetchPaginated(`${url}/rest/v1/tahun_anggaran?select=*&order=tahun.asc`, headers),
      fetchPaginated(`${url}/rest/v1/alokasi_provinsi?select=*,provinsi(*)&order=id.asc`, headers),
      fetchPaginated(`${url}/rest/v1/alokasi_kabupaten_kota?select=*,kabupaten_kota(*)&order=id.asc`, headers),
      Promise.resolve([]),
      Promise.resolve([]),
      Promise.resolve([]),
      fetchPaginated(`${url}/rest/v1/users?select=*&order=id.asc`, headers),
      fetchPaginated(`${url}/rest/v1/province_school_stats?select=*`, headers).catch(() => []),
    ]);

    tahunAnggaranData.length = 0;
    tahunAnggaranData.push(...taData.map(cleanRecord));

    alokasiProvinsiData.length = 0;
    alokasiProvinsiData.push(...provData.map(cleanRecord));

    alokasiKabupatenKotaData.length = 0;
    alokasiKabupatenKotaData.push(...kabkotaData.map(cleanRecord));

    institusiPendidikanData.length = 0;
    institusiPendidikanData.push(...instData.map(cleanRecord));

    sumberDanaData.length = 0;
    sumberDanaData.push(...sdData.map(cleanRecord));

    pengeluaranBulananData.length = 0;
    pengeluaranBulananData.push(...pbData.map(cleanRecord));

    usersData.length = 0;
    usersData.push(...userData.map(cleanRecord));

    provinceSchoolStatsData.length = 0;
    provinceSchoolStatsData.push(...schoolStatsData.map((s: any) => cleanRecord(s) as any));

    isInitialized = true;
    console.log('Successfully synchronized database with Supabase.');
    return true;
  } catch (err) {
    console.error('Failed to load database from Supabase:', err);
    return false;
  }
}

// Mutate functions to save updates to Supabase directly
export async function updateAlokasiProvinsi(id: string, field: string, value: number) {
  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const provRes = await fetch(`${url}/rest/v1/alokasi_provinsi?id=eq.${id}`, { headers });
    if (!provRes.ok) throw new Error('Failed to fetch province allocation');
    const [prov] = await provRes.json();
    if (!prov) throw new Error('Province allocation not found');

    const newNominal = field === 'nominal_alokasi' ? value : prov.nominal_alokasi;
    const newRealisasi = field === 'realisasi_total' ? value : prov.realisasi_total;
    const newSelisih = newNominal - newRealisasi;
    const newPct = newNominal > 0 ? (newRealisasi / newNominal) * 100 : 0;

    const res = await fetch(`${url}/rest/v1/alokasi_provinsi?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        [field]: value,
        selisih: newSelisih,
        persentase_penyerapan: newPct,
        updated_at: new Date().toISOString().split('T')[0]
      }),
    });
    if (!res.ok) throw new Error('Failed to patch alokasi_provinsi');

    // Audit Logging
    const currentUser = useAppStore.getState().currentUser;
    const provName = prov.provinsi?.nama_provinsi || id;
    useAppStore.getState().addAuditLog({
      user_nama: currentUser.username,
      user_role: currentUser.role,
      entitas: `Alokasi Provinsi (${provName})`,
      entitas_id: id,
      field,
      nilai_lama: fmtRupiah(prov[field]),
      nilai_baru: fmtRupiah(value),
    });

    // Cascade down to all child kabupaten/kota for this province
    const kabsRes = await fetch(`${url}/rest/v1/alokasi_kabupaten_kota?alokasi_provinsi_id=eq.${id}&order=id.asc`, { headers });
    if (kabsRes.ok) {
      const kabs = await kabsRes.json();
      if (Array.isArray(kabs) && kabs.length > 0) {
        const kabCount = kabs.length;
        const baseNominal = Math.floor(newNominal / kabCount);
        const remainder = newNominal % kabCount;

        await Promise.all(
          kabs.map(async (k: any, idx: number) => {
            const kNominal = idx === kabCount - 1 ? baseNominal + remainder : baseNominal;
            const kRealisasi = k.realisasi_total;
            const kSelisih = kNominal - kRealisasi;
            const kPct = kNominal > 0 ? Math.round((kRealisasi / kNominal) * 1000) / 10 : 0;

            await fetch(`${url}/rest/v1/alokasi_kabupaten_kota?id=eq.${k.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                nominal_alokasi: kNominal,
                selisih: kSelisih,
                persentase_penyerapan: kPct,
                updated_at: new Date().toISOString().split('T')[0]
              })
            });
          })
        );
      }
    }

    // Cascade update to parent tahun_anggaran
    const taId = prov.tahun_anggaran_id;
    if (taId) {
      const allProvsRes = await fetch(`${url}/rest/v1/alokasi_provinsi?tahun_anggaran_id=eq.${taId}`, { headers });
      if (allProvsRes.ok) {
        const allProvs = await allProvsRes.json();
        const totalNominalTA = allProvs.reduce((s: number, p: any) => 
          s + (p.id === id ? newNominal : p.nominal_alokasi), 0);

        await fetch(`${url}/rest/v1/tahun_anggaran?id=eq.${taId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            total_anggaran: totalNominalTA
          })
        });
      }
    }

    await initDbConnection(true); // force reload cache
  } catch (err) {
    console.error('Failed to patch alokasi_provinsi:', err);
  }
}

export async function updateAlokasiKabupatenKota(id: string, field: string, value: number) {
  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  try {
    const kkRes = await fetch(`${url}/rest/v1/alokasi_kabupaten_kota?id=eq.${id}`, { headers });
    if (!kkRes.ok) throw new Error('Failed to fetch kabupaten_kota allocation');
    const [kk] = await kkRes.json();
    if (!kk) throw new Error('Kabupaten/Kota allocation not found');

    const newNominal = field === 'nominal_alokasi' ? value : kk.nominal_alokasi;
    const newRealisasi = field === 'realisasi_total' ? value : kk.realisasi_total;
    const newSelisih = newNominal - newRealisasi;
    const newPct = newNominal > 0 ? (newRealisasi / newNominal) * 100 : 0;

    const res = await fetch(`${url}/rest/v1/alokasi_kabupaten_kota?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        [field]: value,
        selisih: newSelisih,
        persentase_penyerapan: newPct,
        updated_at: new Date().toISOString().split('T')[0]
      }),
    });
    if (!res.ok) throw new Error('Failed to patch alokasi_kabupaten_kota');

    // Audit Logging
    const currentUser = useAppStore.getState().currentUser;
    const kkName = kk.kabupaten_kota?.nama_kabupaten_kota || id;
    useAppStore.getState().addAuditLog({
      user_nama: currentUser.username,
      user_role: currentUser.role,
      entitas: `Alokasi Kabupaten/Kota (${kkName})`,
      entitas_id: id,
      field,
      nilai_lama: fmtRupiah(kk[field]),
      nilai_baru: fmtRupiah(value),
    });


    const alokasiProvinsiId = kk.alokasi_provinsi_id;
    if (alokasiProvinsiId) {
      const allKabsRes = await fetch(`${url}/rest/v1/alokasi_kabupaten_kota?alokasi_provinsi_id=eq.${alokasiProvinsiId}`, { headers });
      if (allKabsRes.ok) {
        const allKabs = await allKabsRes.json();
        const totalNominalProv = allKabs.reduce((s: number, k: any) => s + (k.id === id ? newNominal : k.nominal_alokasi), 0);
        const totalRealisasiProv = allKabs.reduce((s: number, k: any) => s + (k.id === id ? newRealisasi : k.realisasi_total), 0);
        const selisihProv = totalNominalProv - totalRealisasiProv;
        const pctProv = totalNominalProv > 0 ? (totalRealisasiProv / totalNominalProv) * 100 : 0;

        const patchProvRes = await fetch(`${url}/rest/v1/alokasi_provinsi?id=eq.${alokasiProvinsiId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({
            nominal_alokasi: totalNominalProv,
            realisasi_total: totalRealisasiProv,
            selisih: selisihProv,
            persentase_penyerapan: pctProv,
            updated_at: new Date().toISOString().split('T')[0]
          })
        });

        if (patchProvRes.ok) {
          const apRes = await fetch(`${url}/rest/v1/alokasi_provinsi?id=eq.${alokasiProvinsiId}`, { headers });
          if (apRes.ok) {
            const [ap] = await apRes.json();
            const taId = ap?.tahun_anggaran_id;
            if (taId) {
              const allAlokasiProvsRes = await fetch(`${url}/rest/v1/alokasi_provinsi?tahun_anggaran_id=eq.${taId}`, { headers });
              if (allAlokasiProvsRes.ok) {
                const allAlokasiProvs = await allAlokasiProvsRes.json();
                const totalNominalTA = allAlokasiProvs.reduce((s: number, p: any) => 
                  s + (p.id === alokasiProvinsiId ? totalNominalProv : p.nominal_alokasi), 0);

                await fetch(`${url}/rest/v1/tahun_anggaran?id=eq.${taId}`, {
                  method: 'PATCH',
                  headers,
                  body: JSON.stringify({
                    total_anggaran: totalNominalTA
                  })
                });
              }
            }
          }
        }
      }
    }

    await initDbConnection(true); // force reload cache
  } catch (err) {
    console.error('Failed to patch alokasi_kabupaten_kota:', err);
  }
}

// Data fetching stubs returning elements from memory cache
export function getKabkotaByProvinsi(provinsiId: string): AlokasiKabupatenKota[] {
  return alokasiKabupatenKotaData.filter(
    (item) => item.kabupaten_kota?.provinsi_id === provinsiId
  );
}

export function getAllKabkota(): AlokasiKabupatenKota[] {
  return alokasiKabupatenKotaData;
}

export function getInstitusiByJenjang(jenjang: Jenjang): InstitusiPendidikan[] {
  return institusiPendidikanData.filter((item) => item.jenjang === jenjang);
}

export async function fetchInstitusiByJenjang(jenjang: Jenjang): Promise<InstitusiPendidikan[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2026';
  const headers = {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-davinci-2026',
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-davinci-2026'}`,
  };
  const data = await fetchPaginated(`${url}/rest/v1/institusi_pendidikan?select=*&jenjang=eq.${jenjang}&order=npsn.asc,id.asc`, headers);
  const cleaned = data.map(cleanRecord);
  const seen = new Set<string>();
  return cleaned.filter(item => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function getDashboardSummary(tahun: number = 2026): DashboardSummary {
  const targetTahun = tahunAnggaranData.find((t) => t.tahun === tahun) || tahunAnggaranData.find((t) => t.tahun === 2026);
  const totalNominal = targetTahun ? targetTahun.total_anggaran : 769_100_000_000_000;

  // Filter provinsi allocations matching the target active year id
  const matchingProvData = alokasiProvinsiData.filter(
    (p) => p.tahun_anggaran_id === targetTahun?.id
  );

  const totalRealisasi = matchingProvData.reduce((s, p) => s + p.realisasi_total, 0);

  // Budget weight allocation per jenjang from total APBN budget
  const defaultWeights: Record<Jenjang, number> = {
    UNIVERSITAS: 0.35,
    SMA: 0.25,
    SMP: 0.20,
    SD: 0.15,
    PAUD: 0.05,
  };

  const JENJANG_LABELS_MAP: Record<Jenjang, string> = {
    UNIVERSITAS: 'Universitas (Strata 1)',
    SMA: 'Sekolah Menengah Atas (SMA/SMK)',
    SMP: 'Sekolah Menengah Pertama (SMP/Sederajat)',
    SD: 'Sekolah Dasar (SD/Sederajat)',
    PAUD: 'Pendidikan Anak Usia Dini (PAUD/TK/KB)',
  };

  const jenjangs: Jenjang[] = ['UNIVERSITAS', 'SMA', 'SMP', 'SD', 'PAUD'];

  const perJenjang = jenjangs.map((j) => {
    const nominal = Math.round(totalNominal * defaultWeights[j]);
    const realisasi = Math.round(totalRealisasi * defaultWeights[j]);
    return {
      jenjang: JENJANG_LABELS_MAP[j],
      nominal,
      realisasi,
      persentase: nominal > 0 ? (realisasi / nominal) * 100 : 0,
    };
  });

  // Trend: use tahun_anggaran.total_anggaran for nominal per year
  const trenTahunan = tahunAnggaranData
    .filter((t) => t.status !== 'DRAFT')
    .map((t) => {
      const yearProvData = alokasiProvinsiData.filter((p) => p.tahun_anggaran_id === t.id);
      const realSum = yearProvData.reduce((s, p) => s + p.realisasi_total, 0);
      return {
        tahun: t.tahun,
        nominal: t.total_anggaran,
        realisasi: realSum > 0 ? realSum : Math.round(t.total_anggaran * 0.7),
      };
    });

  return {
    total_nominal: totalNominal,
    total_realisasi: totalRealisasi,
    persentase_penyerapan: totalNominal > 0 ? (totalRealisasi / totalNominal) * 100 : 0,
    per_jenjang: perJenjang,
    tren_tahunan: trenTahunan,
  };
}

export async function getProfilInstitusi(id: string, tahun: number = 2026): Promise<ProfilInstitusi | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:2026';
  const headers = {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-davinci-2026',
    Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'anon-key-davinci-2026'}`,
  };

  try {
    const resInst = await fetch(`${url}/rest/v1/institusi_pendidikan?id=eq.${id}`, { headers });
    const instData = await resInst.json();
    if (!Array.isArray(instData) || instData.length === 0) return null;

    const rawInst = cleanRecord(instData[0]);
    const institusi = {
      ...rawInst,
      nominal_alokasi: Number(rawInst.nominal_alokasi || 0),
      realisasi_total: Number(rawInst.realisasi_total || 0),
      selisih: Number(rawInst.nominal_alokasi || 0) - Number(rawInst.realisasi_total || 0),
      persentase_penyerapan: Number(rawInst.nominal_alokasi) > 0 
        ? Math.round((Number(rawInst.realisasi_total) / Number(rawInst.nominal_alokasi)) * 1000) / 10 
        : 0,
    };

    const resSd = await fetch(`${url}/rest/v1/sumber_dana_institusi?institusi_id=eq.${id}`, { headers });
    const sdData = await resSd.json();
    const sumber_dana_raw = Array.isArray(sdData) ? sdData.map(cleanRecord) : [];

    const sumber_dana = sumber_dana_raw.length > 0 ? sumber_dana_raw.map(sd => ({
      ...sd,
      nominal: Number(sd.nominal || 0),
      realisasi: Number(sd.realisasi || 0),
      saldo_di_bank: Number(sd.saldo_di_bank || (Number(sd.nominal || 0) - Number(sd.realisasi || 0))),
    })) : [
      {
        id: `sd-${institusi.id}`,
        institusi_id: institusi.id,
        tahun_anggaran: String(tahun),
        sumber_dana: 'APBN (DANA INDUK PENDIDIKAN)',
        nominal: institusi.nominal_alokasi,
        realisasi: institusi.realisasi_total,
        saldo_di_bank: institusi.realisasi_total,
        persentase: institusi.persentase_penyerapan,
      }
    ];

    const resPb = await fetch(`${url}/rest/v1/pengeluaran_bulanan_institusi?institusi_id=eq.${id}&order=nomor.asc`, { headers });
    const pbData = await resPb.json();
    const pengeluaran_bulanan = Array.isArray(pbData) ? pbData.map(cleanRecord) : [];

    const totalNominalSumber = sumber_dana.reduce((s, d) => s + Number(d.nominal || 0), 0);
    const totalRealisasiSumber = sumber_dana.reduce((s, d) => s + Number(d.realisasi || 0), 0);
    const saldoSurplusDefisit = totalNominalSumber - totalRealisasiSumber;

    return {
      institusi,
      sumber_dana,
      pengeluaran_bulanan,
      saldo_surplus_defisit: saldoSurplusDefisit,
    };
  } catch (err) {
    console.error('Error fetching profil institusi:', err);
    return null;
  }
}

export function getAllInstitusi(): InstitusiPendidikan[] {
  return institusiPendidikanData;
}

export async function fetchDbSchoolCounts(): Promise<Record<Jenjang, number>> {
  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Prefer': 'count=exact',
  };

  const jenjangs: Jenjang[] = ['UNIVERSITAS', 'SMA', 'SMP', 'SD', 'PAUD'];
  const counts: Record<Jenjang, number> = {
    UNIVERSITAS: 4498,
    SMA: 22407,
    SMP: 41511,
    SD: 136761,
    PAUD: 162688,
  };

  try {
    await Promise.all(
      jenjangs.map(async (j) => {
        const res = await fetch(`${url}/rest/v1/institusi_pendidikan?jenjang=eq.${j}&select=id&limit=1`, { headers });
        const cr = res.headers.get('content-range');
        if (cr) {
          const total = parseInt(cr.split('/')[1], 10);
          if (!isNaN(total) && total > 0) {
            counts[j] = total;
          }
        }
      })
    );
  } catch (err) {
    console.error('Failed to fetch db school counts:', err);
  }

  return counts;
}

export interface FetchInstitusiParams {
  jenjang?: string;
  provinsiId?: string;
  kabkotaId?: string;
  kecamatan?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface FetchInstitusiResult {
  data: InstitusiPendidikan[];
  totalCount: number;
}

export async function fetchInstitusiPaginated(params: FetchInstitusiParams): Promise<FetchInstitusiResult> {
  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Prefer': 'count=exact',
  };

  const page = params.page || 1;
  const pageSize = params.pageSize || 100;
  const offset = (page - 1) * pageSize;

  let endpoint = `${url}/rest/v1/institusi_pendidikan?select=*`;

  if (params.jenjang) {
    endpoint += `&jenjang=eq.${encodeURIComponent(params.jenjang)}`;
  }
  if (params.provinsiId) {
    const prov = alokasiProvinsiData.find(p => p.provinsi_id === params.provinsiId);
    if (prov) {
      endpoint += `&provinsi_nama=eq.${encodeURIComponent(prov.provinsi.nama_provinsi)}`;
    }
  }
  if (params.kabkotaId) {
    endpoint += `&kabupaten_kota_id=eq.${encodeURIComponent(params.kabkotaId)}`;
  }
  if (params.search) {
    const s = encodeURIComponent(`*${params.search}*`);
    endpoint += `&or=(nama_institusi.ilike.${s},npsn.ilike.${s},alamat.ilike.${s})`;
  }

  endpoint += `&order=provinsi_nama.asc,kabupaten_kota_nama.asc,nama_institusi.asc&limit=${pageSize}&offset=${offset}`;

  try {
    const res = await fetch(endpoint, { headers });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const cr = res.headers.get('content-range');
    let totalCount = 0;
    if (cr) {
      const parts = cr.split('/');
      if (parts[1]) totalCount = parseInt(parts[1], 10) || 0;
    }

    const rawData = await res.json();
    let data: InstitusiPendidikan[] = Array.isArray(rawData) ? rawData.map(cleanRecord) : [];

    if (params.kecamatan) {
      const kec = params.kecamatan.toLowerCase();
      data = data.filter(i => i.alamat && i.alamat.toLowerCase().includes(kec));
    }

    return { data, totalCount };
  } catch (err) {
    console.error('Failed to fetch paginated institusi:', err);
    return { data: [], totalCount: 0 };
  }
}

export async function fetchAllInstitusi(): Promise<InstitusiPendidikan[]> {
  if (institusiPendidikanData.length > 0) {
    return institusiPendidikanData;
  }
  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };
  try {
    const data = await fetchPaginated(`${url}/rest/v1/institusi_pendidikan?select=*&order=provinsi_nama.asc,kabupaten_kota_nama.asc,nama_institusi.asc`, headers);
    const cleaned = data.map(cleanRecord);
    institusiPendidikanData.length = 0;
    institusiPendidikanData.push(...cleaned);
    return cleaned;
  } catch (err) {
    console.error('Failed to fetch all institusi from Supabase:', err);
    return institusiPendidikanData;
  }
}

export async function fetchInstitusiByKabkota(kabkotaId: string): Promise<InstitusiPendidikan[]> {
  const existing = institusiPendidikanData.filter(i => i.kabupaten_kota_id === kabkotaId);
  if (existing.length > 0) return existing;

  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };
  try {
    const data = await fetchPaginated(`${url}/rest/v1/institusi_pendidikan?select=*&kabupaten_kota_id=eq.${kabkotaId}&order=npsn.asc,id.asc`, headers);
    if (Array.isArray(data) && data.length > 0) {
      return data.map(cleanRecord);
    }
  } catch (err) {
    console.error('Failed to fetch institusi by kabkota:', err);
  }
  return getInstitusiByKabkota(kabkotaId);
}

// Fetch rincian items from Supabase PostgREST API on-demand
export async function fetchRincianPengeluaranBulanan(
  institusiId: string,
  nomorBulan: number,
  _tahun: number = 2026
): Promise<RincianPengeluaranBulanan | null> {
  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };

  try {
    const inst = institusiPendidikanData.find((item) => item.id === institusiId);
    if (!inst) return null;

    const res = await fetch(
      `${url}/rest/v1/rincian_pengeluaran_item?institusi_id=eq.${institusiId}&nomor_bulan=eq.${nomorBulan}&order=nomor.asc`,
      { headers }
    );
    if (!res.ok) throw new Error('Failed to fetch items');

    const items = await res.json();

    const bulanNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];

    const subTotal = items.reduce((s: number, item: any) => s + item.jumlah, 0);
    const pajak_persen = 11;
    const pajak_nominal = Math.round((subTotal * pajak_persen) / 100);

    return {
      institusi_id: institusiId,
      institusi_nama: inst.nama_institusi,
      bulan: bulanNames[nomorBulan - 1] || 'Januari',
      nomor_bulan: nomorBulan,
      items,
      sub_total: subTotal,
      pajak_persen,
      pajak_nominal,
      total: subTotal + pajak_nominal,
    };
  } catch (err) {
    console.error('Failed to fetch rincian from Supabase:', err);
    return null;
  }
}

export function getJenjangBreakdownByKabkota(
  kabkotaId: string,
  nominalAlokasi: number
): JenjangBreakdownProvinsi[] {
  // Compute breakdown dynamically based on institutions under this kabkota
  const kabSchools = (institusiPendidikanData || []).filter(
    (item) => item.kabupaten_kota_id === kabkotaId
  );

  const jenjangCounts = { UNIVERSITAS: 0, SMA: 0, SMP: 0, SD: 0, PAUD: 0 };
  const jenjangBudgets = { UNIVERSITAS: 0, SMA: 0, SMP: 0, SD: 0, PAUD: 0 };

  kabSchools.forEach((item) => {
    if (item.jenjang in jenjangCounts) {
      jenjangCounts[item.jenjang]++;
      jenjangBudgets[item.jenjang] += Number(item.nominal_alokasi) || 0;
    }
  });

  // Find parent province to divide province school stats proportionally if institusiPendidikanData has 0
  const kabkotaRecord = (alokasiKabupatenKotaData || []).find(k => k.kabupaten_kota_id === kabkotaId);
  const provId = kabkotaRecord?.kabupaten_kota?.provinsi_id;
  const provStats = provId ? (provinceSchoolStatsData || []).find((s: any) => s.province_id === provId) : null;
  
  const provSchoolCounts: Record<Jenjang, number> = { UNIVERSITAS: 0, SMA: 0, SMP: 0, SD: 0, PAUD: 0 };
  if (provStats) {
    provSchoolCounts.UNIVERSITAS = Number((provStats as any).univ) || 0;
    provSchoolCounts.SMA = Number((provStats as any).sma) || 0;
    provSchoolCounts.SMP = Number((provStats as any).smp) || 0;
    provSchoolCounts.SD = Number((provStats as any).sd) || 0;
    provSchoolCounts.PAUD = Number((provStats as any).paud) || 0;
  }

  const totalKabkotasInProv = provId 
    ? (alokasiKabupatenKotaData || []).filter(k => k.kabupaten_kota?.provinsi_id === provId).length || 1 
    : 1;

  const labels: Record<Jenjang, string> = {
    UNIVERSITAS: 'Universitas (Strata 1)',
    SMA: 'Sekolah Menengah Atas (SMA/SMK)',
    SMP: 'Sekolah Menengah Pertama (SMP/Sederajat)',
    SD: 'Sekolah Dasar (SD/Sederajat)',
    PAUD: 'Pendidikan Anak Usia Dini (PAUD/TK/KB)',
  };

  const defaultBudgetWeights: Record<Jenjang, number> = {
    UNIVERSITAS: 0.35,
    SMA: 0.25,
    SMP: 0.20,
    SD: 0.15,
    PAUD: 0.05,
  };

  const totalInstBudget = Object.values(jenjangBudgets).reduce((a, b) => a + b, 0);

  return (Object.keys(labels) as Jenjang[]).map((j, i) => {
    const count = jenjangCounts[j] > 0 
      ? jenjangCounts[j] 
      : Math.round(provSchoolCounts[j] / totalKabkotasInProv);

    const budget = totalInstBudget > 0 
      ? jenjangBudgets[j] 
      : Math.round((Number(nominalAlokasi) || 0) * defaultBudgetWeights[j]);

    return {
      nomor: i + 1,
      jenjang: labels[j],
      jumlah_sekolah: count,
      nominal_keseluruhan: budget,
      porsi_anggaran: nominalAlokasi > 0 ? (budget / nominalAlokasi) * 100 : 0,
    };
  });
}

export function getInstitusiByKabkota(
  kabkotaId: string,
  namaKabkota: string = 'Kab. Pesawaran',
  provinsiNama: string = 'Lampung',
  totalNominal: number = 763288463037
): InstitusiPendidikan[] {
  const existing = (institusiPendidikanData || []).filter((item) => item.kabupaten_kota_id === kabkotaId);
  if (existing && existing.length > 0) return existing;

  // Fallback to deterministic mock generator if no schools in DB
  const match = kabkotaId.match(/kab-p-(\d+)-(\d+)/);
  const provIdx = match ? parseInt(match[1], 10) : 1;
  const kabIdx = match ? parseInt(match[2], 10) : 0;
  const charSeed = kabkotaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seed = provIdx * 31 + kabIdx + charSeed;

  let pUniv = 10;
  const pSMA = 20;
  const pSMK = 15;
  const pSMP = 20;
  let pSD = 30;
  const pPAUD = 5;

  const cUniv = (seed * 3) % 4;
  if (cUniv === 0) {
    pSD += pUniv;
    pUniv = 0;
  }
  const cSMA = 3 + ((seed * 7) % 15);
  const cSMK = 2 + ((seed * 5) % 10);
  const cSMP = 6 + ((seed * 11) % 25);
  const cSD = 15 + ((seed * 17) % 80);
  const cPAUD = 10 + ((seed * 23) % 60);

  const cleanKabName = (namaKabkota || 'Pesawaran').replace('Kab. ', '').replace('Kota ', '');

  const jenjangConfigs = [
    { key: 'UNIVERSITAS' as const, porsi: pUniv, count: cUniv, prefix: 'Universitas', baseNominal: 50_000_000_000 },
    { key: 'SMA' as const, porsi: pSMA, count: cSMA, prefix: 'SMAN', baseNominal: 5_000_000_000 },
    { key: 'SMP' as const, porsi: pSMP, count: cSMP, prefix: 'SMPN', baseNominal: 3_000_000_000 },
    { key: 'SD' as const, porsi: pSD, count: cSD, prefix: 'SDN', baseNominal: 1_500_000_000 },
    { key: 'PAUD' as const, porsi: pPAUD, count: cPAUD, prefix: 'PAUD', baseNominal: 500_000_000 },
    { key: 'SMA' as const, porsi: pSMK, count: cSMK, prefix: 'SMKN', baseNominal: 4_500_000_000, label: 'SMK' },
  ];

  const list: InstitusiPendidikan[] = [];
  let schoolCounter = 1;

  jenjangConfigs.forEach((jc) => {
    if (jc.count === 0) return;
    const jenjangBudget = Math.round((totalNominal || 763288463037) * jc.porsi / 100);
    let distributedSum = 0;

    for (let i = 0; i < jc.count; i++) {
      const schoolSeed = seed + schoolCounter * 7;
      const variation = 0.8 + ((schoolSeed * 97) % 5) * 0.1;
      
      let schoolNominal = 0;
      if (i === jc.count - 1) {
        schoolNominal = jenjangBudget - distributedSum;
      } else {
        schoolNominal = Math.round((jenjangBudget / jc.count) * variation);
        distributedSum += schoolNominal;
      }

      const realisasiPct = 60 + ((schoolSeed * 53) % 36);
      const realisasi = Math.round(schoolNominal * realisasiPct / 100);
      const isSwasta = (schoolSeed % 5 === 0 && jc.key !== 'UNIVERSITAS');
      const status_sekolah = isSwasta ? ('SWASTA' as const) : ('NEGERI' as const);

      let schoolName = '';
      if (jc.key === 'UNIVERSITAS') {
        const univTypes = ['Universitas', 'IAIN', 'STIE', 'Politeknik'];
        const type = univTypes[i % univTypes.length];
        schoolName = `${type} ${cleanKabName} ${i > 0 ? String.fromCharCode(65 + i) : ''}`;
      } else {
        const levelLabel = jc.label || jc.key;
        schoolName = isSwasta 
          ? `${levelLabel} Swasta Bina Bangsa ${cleanKabName}` 
          : `${jc.prefix} ${i + 1} ${cleanKabName}`;
      }

      list.push({
        id: `inst-${kabkotaId}-${schoolCounter}`,
        npsn: `${jc.key === 'UNIVERSITAS' ? '3' : jc.key === 'SMA' ? '2' : jc.key === 'SMP' ? '1' : jc.key === 'SD' ? '0' : '9'}${String(2000 + schoolCounter)}`,
        nama_institusi: schoolName,
        jenjang: jc.label === 'SMK' ? 'SMA' : jc.key,
        kabupaten_kota_id: kabkotaId,
        kabupaten_kota_nama: namaKabkota,
        provinsi_nama: provinsiNama,
        status_sekolah,
        nomor_rekening: `100.${200 + schoolCounter}.${300 + schoolCounter * 3}.000`,
        nominal_alokasi: schoolNominal,
        realisasi_total: realisasi,
        selisih: schoolNominal - realisasi,
        persentase_penyerapan: Math.round((realisasi / schoolNominal) * 1000) / 10,
        updated_at: '2026-04-15',
      });

      schoolCounter++;
    }
  });

  return list;
}

export function getJenjangBreakdownByProvinsi(
  provinsiId: string,
  nominalAlokasi: number
): JenjangBreakdownProvinsi[] {
  const provStatsList = (provinceSchoolStatsData || []).filter((s: any) => s.province_id === provinsiId);
  const schoolCountsFromStats: Record<Jenjang, number> = {
    UNIVERSITAS: 0,
    SMA: 0,
    SMP: 0,
    SD: 0,
    PAUD: 0,
  };

  provStatsList.forEach((stat: any) => {
    // Key-value format: {province_id, jenjang, school_count}
    if (stat.jenjang && stat.school_count !== undefined) {
      const key = String(stat.jenjang).toUpperCase() as Jenjang;
      if (key in schoolCountsFromStats) {
        schoolCountsFromStats[key] = Number(stat.school_count) || 0;
      }
    } else if ('univ' in stat) {
      // Columnar format fallback
      schoolCountsFromStats.UNIVERSITAS = Number(stat.univ) || 0;
      schoolCountsFromStats.SMA = Number(stat.sma) || 0;
      schoolCountsFromStats.SMP = Number(stat.smp) || 0;
      schoolCountsFromStats.SD = Number(stat.sd) || 0;
      schoolCountsFromStats.PAUD = Number(stat.paud) || 0;
    }
  });

  // Overrides removed to use real database stats directly

  // 2. Count from institusiPendidikanData if any custom rows exist for this province
  const kabIdList = (alokasiKabupatenKotaData || [])
    .filter((k) => k.kabupaten_kota?.provinsi_id === provinsiId)
    .map((k) => k.kabupaten_kota_id);

  const provSchools = (institusiPendidikanData || []).filter((item) =>
    (item as any).provinsi_id === provinsiId || (item.kabupaten_kota_id && kabIdList.includes(item.kabupaten_kota_id))
  );

  const jenjangCountsFromInst = { UNIVERSITAS: 0, SMA: 0, SMP: 0, SD: 0, PAUD: 0 };
  const jenjangBudgets = { UNIVERSITAS: 0, SMA: 0, SMP: 0, SD: 0, PAUD: 0 };

  provSchools.forEach((item) => {
    if (item.jenjang in jenjangCountsFromInst) {
      jenjangCountsFromInst[item.jenjang]++;
      jenjangBudgets[item.jenjang] += Number(item.nominal_alokasi) || 0;
    }
  });

  const labels: Record<Jenjang, string> = {
    UNIVERSITAS: 'Universitas (Strata 1)',
    SMA: 'Sekolah Menengah Atas (SMA/SMK)',
    SMP: 'Sekolah Menengah Pertama (SMP/Sederajat)',
    SD: 'Sekolah Dasar (SD/Sederajat)',
    PAUD: 'Pendidikan Anak Usia Dini (PAUD/TK/KB)',
  };

  const defaultBudgetWeights: Record<Jenjang, number> = {
    UNIVERSITAS: 0.35,
    SMA: 0.25,
    SMP: 0.20,
    SD: 0.15,
    PAUD: 0.05,
  };

  return (Object.keys(labels) as Jenjang[]).map((j, i) => {
    const count = schoolCountsFromStats[j] > 0 ? schoolCountsFromStats[j] : jenjangCountsFromInst[j];
    // Always use weight-based allocation from province total budget
    const budget = Math.round((Number(nominalAlokasi) || 0) * defaultBudgetWeights[j]);

    return {
      nomor: i + 1,
      jenjang: labels[j],
      jumlah_sekolah: count,
      nominal_keseluruhan: budget,
      porsi_anggaran: nominalAlokasi > 0 ? (budget / nominalAlokasi) * 100 : 0,
    };
  });
}

// ============================================
// Supabase Database Mutations (Sprint 4)
// ============================================

export async function updateTahunAnggaran(id: string, updates: Partial<TahunAnggaran>) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/tahun_anggaran?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const currentUser = useAppStore.getState().currentUser;
      const keyName = Object.keys(updates)[0] || 'data';
      const newVal = updates[keyName as keyof TahunAnggaran];
      useAppStore.getState().addAuditLog({
        user_nama: currentUser.username,
        user_role: currentUser.role,
        entitas: `Tahun Anggaran (${id})`,
        entitas_id: id,
        field: keyName,
        nilai_lama: '-',
        nilai_baru: typeof newVal === 'number' ? fmtRupiah(newVal) : String(newVal),
      });

      await initDbConnection(true); // reload local cache
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to update tahun_anggaran:', err);
    return false;
  }
}

export async function createTahunAnggaran(tahun: number, total_anggaran: number) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/tahun_anggaran`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tahun,
        total_anggaran,
        status: 'DRAFT',
        created_at: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      const currentUser = useAppStore.getState().currentUser;
      useAppStore.getState().addAuditLog({
        user_nama: currentUser.username,
        user_role: currentUser.role,
        entitas: `Tambah Tahun Anggaran (${tahun})`,
        entitas_id: String(tahun),
        field: 'total_anggaran',
        nilai_lama: '0',
        nilai_baru: fmtRupiah(total_anggaran),
      });

      await initDbConnection(true);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to create tahun_anggaran:', err);
    return false;
  }
}

export async function deleteTahunAnggaran(id: string) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/tahun_anggaran?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
      },
    });
    if (res.ok) {
      const currentUser = useAppStore.getState().currentUser;
      useAppStore.getState().addAuditLog({
        user_nama: currentUser.username,
        user_role: currentUser.role,
        entitas: `Hapus Tahun Anggaran (${id})`,
        entitas_id: id,
        field: 'status',
        nilai_lama: 'DRAFT',
        nilai_baru: 'DELETED',
      });

      await initDbConnection(true);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to delete tahun_anggaran:', err);
    return false;
  }
}

export async function createUser(username: string, email: string, role: UserRole) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/users`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        email,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
      }),
    });
    if (res.ok) {
      await initDbConnection(true);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to create user:', err);
    return false;
  }
}

export async function updateUser(id: string, updates: Partial<User>) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/users?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await initDbConnection(true);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to update user:', err);
    return false;
  }
}

export async function updateSumberDana(id: string, updates: Partial<SumberDanaInstitusi>) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/sumber_dana_institusi?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await initDbConnection(true);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to update sumber_dana_institusi:', err);
    return false;
  }
}

export async function updatePengeluaranBulanan(id: string, updates: Partial<PengeluaranBulananInstitusi>) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/pengeluaran_bulanan_institusi?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      await initDbConnection(true);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to update pengeluaran_bulanan_institusi:', err);
    return false;
  }
}

export async function createRincianPengeluaranItem(item: {
  institusi_id: string;
  nomor_bulan: number;
  nomor: number;
  nama_produk_jasa: string;
  harga_satuan: number;
  qty: number;
  jumlah: number;
}) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/rincian_pengeluaran_item`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(item),
    });
    if (res.ok) {
      const data = await res.json();
      const created = Array.isArray(data) ? data[0] : data;
      const currentUser = useAppStore.getState().currentUser;
      useAppStore.getState().addAuditLog({
        user_nama: currentUser.username,
        user_role: currentUser.role,
        entitas: `Rincian Pengeluaran Institusi (${item.institusi_id})`,
        entitas_id: created?.id || item.institusi_id,
        field: 'tambah_item',
        nilai_lama: '(baru)',
        nilai_baru: `${item.nama_produk_jasa} (Qty: ${item.qty})`,
      });
      return created;
    }

    return null;
  } catch (err) {
    console.error('Failed to create rincian_pengeluaran_item:', err);
    return null;
  }
}

export async function updateRincianPengeluaranItem(id: string, updates: Partial<RincianPengeluaranItem>) {
  const { url, anonKey } = getSupabaseConfig();
  try {
    const res = await fetch(`${url}/rest/v1/rincian_pengeluaran_item?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to update rincian_pengeluaran_item:', err);
    return false;
  }
}

export async function updateInstitusiPendidikan(
  id: string,
  updates: { nominal_alokasi?: number; realisasi_total?: number; nomor_rekening?: string }
) {
  const { url, anonKey } = getSupabaseConfig();
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch current institution state
    const instRes = await fetch(`${url}/rest/v1/institusi_pendidikan?id=eq.${id}`, { headers });
    if (!instRes.ok) throw new Error('Failed to fetch institution');
    const [inst] = await instRes.json();
    if (!inst) throw new Error('Institution not found');

    const newNominal = updates.nominal_alokasi !== undefined ? updates.nominal_alokasi : inst.nominal_alokasi;
    const newRealisasi = updates.realisasi_total !== undefined ? updates.realisasi_total : inst.realisasi_total;
    const newSelisih = newNominal - newRealisasi;
    const newPct = newNominal > 0 ? (newRealisasi / newNominal) * 100 : 0;

    const patchPayload: any = {
      nominal_alokasi: newNominal,
      realisasi_total: newRealisasi,
      selisih: newSelisih,
      persentase_penyerapan: newPct,
      updated_at: new Date().toISOString()
    };

    if (updates.nomor_rekening !== undefined) {
      patchPayload.nomor_rekening = updates.nomor_rekening;
    }

    // 2. Patch institution in DB
    const patchInstRes = await fetch(`${url}/rest/v1/institusi_pendidikan?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patchPayload),
    });
    if (!patchInstRes.ok) throw new Error('Failed to patch institution');

    // 3. Trigger cascade update to parent Kabupaten/Kota
    const kabkotaId = inst.kabupaten_kota_id;
    if (kabkotaId) {
      const allInstsRes = await fetch(`${url}/rest/v1/institusi_pendidikan?kabupaten_kota_id=eq.${kabkotaId}`, { headers });
      if (allInstsRes.ok) {
        const allInsts = await allInstsRes.json();
        const totalNominalKab = allInsts.reduce((s: number, i: any) => s + (i.id === id ? newNominal : i.nominal_alokasi), 0);
        const totalRealisasiKab = allInsts.reduce((s: number, i: any) => s + (i.id === id ? newRealisasi : i.realisasi_total), 0);

        const alokasiKabRes = await fetch(`${url}/rest/v1/alokasi_kabupaten_kota?kabupaten_kota_id=eq.${kabkotaId}`, { headers });
        if (alokasiKabRes.ok) {
          const alokasiKabs = await alokasiKabRes.json();
          for (const alokasiKab of alokasiKabs) {
            const selisihKab = totalNominalKab - totalRealisasiKab;
            const pctKab = totalNominalKab > 0 ? (totalRealisasiKab / totalNominalKab) * 100 : 0;

            const patchKabRes = await fetch(`${url}/rest/v1/alokasi_kabupaten_kota?id=eq.${alokasiKab.id}`, {
              method: 'PATCH',
              headers,
              body: JSON.stringify({
                nominal_alokasi: totalNominalKab,
                realisasi_total: totalRealisasiKab,
                selisih: selisihKab,
                persentase_penyerapan: pctKab,
                updated_at: new Date().toISOString()
              })
            });

            if (patchKabRes.ok) {
              // 4. Trigger cascade update to parent Provinsi
              const provId = alokasiKab.kabupaten_kota?.provinsi_id || (alokasiKab.alokasi_provinsi_id ? 
                await (async () => {
                  const apRes = await fetch(`${url}/rest/v1/alokasi_provinsi?id=eq.${alokasiKab.alokasi_provinsi_id}`, { headers });
                  if (apRes.ok) {
                    const [ap] = await apRes.json();
                    return ap?.provinsi_id;
                  }
                  return null;
                })() : null);

              if (provId) {
                const allKabkotasOfProvRes = await fetch(`${url}/rest/v1/kabupaten_kota?provinsi_id=eq.${provId}`, { headers });
                if (allKabkotasOfProvRes.ok) {
                  const kabkotasOfProv = await allKabkotasOfProvRes.json();
                  const kabkotaIds = kabkotasOfProv.map((k: any) => k.id);

                  const allAlokasiKabsRes = await fetch(`${url}/rest/v1/alokasi_kabupaten_kota?kabupaten_kota_id=in.(${kabkotaIds.join(',')})`, { headers });
                  if (allAlokasiKabsRes.ok) {
                    const allAlokasiKabs = await allAlokasiKabsRes.json();
                    const totalNominalProv = allAlokasiKabs.reduce((s: number, k: any) => 
                      s + (k.id === alokasiKab.id ? totalNominalKab : k.nominal_alokasi), 0);
                    const totalRealisasiProv = allAlokasiKabs.reduce((s: number, k: any) => 
                      s + (k.id === alokasiKab.id ? totalRealisasiKab : k.realisasi_total), 0);
                    const selisihProv = totalNominalProv - totalRealisasiProv;
                    const pctProv = totalNominalProv > 0 ? (totalRealisasiProv / totalNominalProv) * 100 : 0;

                    const alokasiProvRes = await fetch(`${url}/rest/v1/alokasi_provinsi?provinsi_id=eq.${provId}`, { headers });
                    if (alokasiProvRes.ok) {
                      const alokasiProvs = await alokasiProvRes.json();
                      for (const alokasiProv of alokasiProvs) {
                        const patchProvRes = await fetch(`${url}/rest/v1/alokasi_provinsi?id=eq.${alokasiProv.id}`, {
                          method: 'PATCH',
                          headers,
                          body: JSON.stringify({
                            nominal_alokasi: totalNominalProv,
                            realisasi_total: totalRealisasiProv,
                            selisih: selisihProv,
                            persentase_penyerapan: pctProv,
                            updated_at: new Date().toISOString()
                          })
                        });

                        if (patchProvRes.ok) {
                          // 5. Trigger cascade update to parent APBN (tahun_anggaran)
                          const taId = alokasiProv.tahun_anggaran_id;
                          if (taId) {
                            const allAlokasiProvsRes = await fetch(`${url}/rest/v1/alokasi_provinsi?tahun_anggaran_id=eq.${taId}`, { headers });
                            if (allAlokasiProvsRes.ok) {
                              const allAlokasiProvs = await allAlokasiProvsRes.json();
                              const totalNominalTA = allAlokasiProvs.reduce((s: number, p: any) => 
                                s + (p.id === alokasiProv.id ? totalNominalProv : p.nominal_alokasi), 0);

                              await fetch(`${url}/rest/v1/tahun_anggaran?id=eq.${taId}`, {
                                method: 'PATCH',
                                headers,
                                body: JSON.stringify({
                                  total_anggaran: totalNominalTA
                                })
                              });
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    await initDbConnection(true);
    return true;
  } catch (err) {
    console.error('Failed to update institusi_pendidikan and cascade:', err);
    return false;
  }
}

export async function fetchKecamatanForKabkota(kabkotaId: string): Promise<{ id: string; name: string }[]> {
  const { url, anonKey } = getSupabaseConfig();
  if (!anonKey) return [];
  const headers = {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
  };

  try {
    // 1. Get the kabupaten_kota details from alokasiKabupatenKotaData or Supabase
    const kk = alokasiKabupatenKotaData.find(item => item.kabupaten_kota_id === kabkotaId)?.kabupaten_kota;
    if (!kk) {
      console.warn(`Kabupaten/Kota with ID ${kabkotaId} not found in cache.`);
      return [];
    }

    // 2. Normalize name for matching
    const normKK = kk.nama_kabupaten_kota.toLowerCase()
      .replace(/^kab\.\s+/, 'kabupaten ')
      .replace(/^kabupaten\s+/, '')
      .replace(/^kota\s+/, '')
      .trim();

    // Query regencies by name to get its UUID
    const resReg = await fetch(`${url}/rest/v1/regencies?name=ilike.*${normKK}*`, { headers });
    if (!resReg.ok) {
      console.error(`Failed to fetch regency for name ${normKK}: ${resReg.statusText}`);
      return [];
    }
    const regData = await resReg.json();
    if (regData.length === 0) {
      console.warn(`No regency found in Supabase matching name ${normKK}`);
      return [];
    }
    const reg = regData[0];

    // 3. Fetch all districts (kecamatan) for this regency
    const resDist = await fetch(`${url}/rest/v1/districts?regency_id=eq.${reg.id}&order=name.asc`, { headers });
    if (!resDist.ok) {
      console.error(`Failed to fetch districts for regency ${reg.id}: ${resDist.statusText}`);
      return [];
    }
    const distData = await resDist.json();
    return distData.map((d: any) => ({
      id: d.id,
      name: d.name
    }));
  } catch (err) {
    console.error('Failed in fetchKecamatanForKabkota:', err);
    return [];
  }
}

