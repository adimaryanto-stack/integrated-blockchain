import { create } from 'zustand';
import { TransaksiGlobal, PaketProject, ProjectPhoto, ProjectExpense, ProjectVendor } from '@/types';
import { INITIAL_TRANSACTIONS } from './data/transactions';

export interface NotificationItem {
  id: string;
  message: string;
  time: string;
  unread: boolean;
  type: 'info' | 'success' | 'warning';
  link: string;
}

interface DbData {
  tahun_anggaran: any[];
  provinsi: any[];
  alokasi_provinsi: any[];
  kabupaten_kota: any[];
  alokasi_kabupaten_kota: any[];
  institusi_pendidikan: any[];
  sumber_dana_institusi: any[];
  pengeluaran_bulanan_institusi: any[];
  rincian_pengeluaran_item: any[];
  users: any[];
  audit_anomaly: any[];
}

interface AppState {
  activeTahun: number;
  setActiveTahun: (tahun: number) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Database states
  isSupabaseMode: boolean;
  setIsSupabaseMode: (active: boolean) => void;
  dbData: DbData | null;
  setDbData: (data: DbData | null) => void;
  isLoadingDb: boolean;
  setIsLoadingDb: (loading: boolean) => void;

  // Transaction states
  transaksiList: TransaksiGlobal[];
  addTransaksi: (t: TransaksiGlobal) => void;
  setTransaksiList: (list: TransaksiGlobal[] | ((prev: TransaksiGlobal[]) => TransaksiGlobal[])) => void;

  // Rencana states
  rencanaList: TransaksiGlobal[];
  setRencanaList: (list: TransaksiGlobal[] | ((prev: TransaksiGlobal[]) => TransaksiGlobal[])) => void;
  removeRencana: (id: string) => void;

  // Notification states
  notifications: NotificationItem[];
  addNotification: (notification: Omit<NotificationItem, 'id' | 'time' | 'unread'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  markAllAsUnread: () => void;
  setNotifications: (list: NotificationItem[]) => void;

  // Paket Project states
  paketProjectList: PaketProject[];
  addPaketProject: (p: PaketProject) => void;
  updatePaketProject: (id: string, data: Partial<PaketProject>) => void;
  removePaketProject: (id: string) => void;
  setPaketProjectList: (list: PaketProject[] | ((prev: PaketProject[]) => PaketProject[])) => void;

  projectPhotos: ProjectPhoto[];
  addProjectPhoto: (photo: ProjectPhoto) => void;
  removeProjectPhoto: (id: string) => void;
  setProjectPhotos: (list: ProjectPhoto[] | ((prev: ProjectPhoto[]) => ProjectPhoto[])) => void;

  projectExpenses: ProjectExpense[];
  addProjectExpense: (expense: ProjectExpense) => void;
  updateProjectExpense: (id: string, data: Partial<ProjectExpense>) => void;
  removeProjectExpense: (id: string) => void;
  setProjectExpenses: (list: ProjectExpense[] | ((prev: ProjectExpense[]) => ProjectExpense[])) => void;

  projectVendors: ProjectVendor[];
  addProjectVendor: (vendor: ProjectVendor) => void;
  updateProjectVendor: (id: string, data: Partial<ProjectVendor>) => void;
  removeProjectVendor: (id: string) => void;
  setProjectVendors: (list: ProjectVendor[] | ((prev: ProjectVendor[]) => ProjectVendor[])) => void;
}

// Seed data for KB AL-IKHLAS
export const SEED_PROJECTS: PaketProject[] = [
  {
    id: 'proj-001',
    nama_paket: 'Pengadaan Alat Permainan Edukatif (APE) & Modul Karakter',
    deskripsi: 'Pengadaan sarana bermain interaktif indoor/outdoor dan buku karakter anak usia dini KB AL-IKHLAS tahun 2026.',
    tanggal_mulai: '2026-01-10',
    tanggal_selesai: '2026-03-31',
    status: 'berjalan',
    created_by: 'operator@kbalikhlas.sch.id',
    created_at: '2026-01-10T08:00:00Z',
    updated_at: '2026-01-15T10:30:00Z',
  },
  {
    id: 'proj-002',
    nama_paket: 'Pentas Seni Kreativitas Anak & Kunjungan Edukasi Lingkungan',
    deskripsi: 'Penyelenggaraan kegiatan kreativitas pentas seni anak PAUD dan kunjungan pengenalan lingkungan KB AL-IKHLAS.',
    tanggal_mulai: '2026-04-01',
    tanggal_selesai: '2026-05-20',
    status: 'draft',
    created_by: 'operator@kbalikhlas.sch.id',
    created_at: '2026-04-01T09:00:00Z',
    updated_at: '2026-04-01T09:00:00Z',
  },
];

export const SEED_EXPENSES: ProjectExpense[] = [
  {
    id: 'exp-001',
    project_id: 'proj-001',
    tahap: 'pra_produksi',
    nama_item: 'Pengadaan Paket Balok Susun & Puzzle Kayu Edukatif',
    jumlah: 10,
    satuan: 'set',
    harga_satuan: 1200000,
    subtotal: 12000000,
    jenis_pajak: 'ppn',
    persentase_pajak: 11,
    nilai_pajak: 1320000,
    total_setelah_pajak: 13320000,
    bukti_file_url: '',
    catatan: 'Untuk stimulasi motorik halus anak PAUD',
    created_at: '2026-01-15T10:00:00Z',
  },
  {
    id: 'exp-002',
    project_id: 'proj-001',
    tahap: 'produksi',
    nama_item: 'Pengadaan Perosotan & Ayunan Outdoor PAUD',
    jumlah: 1,
    satuan: 'paket',
    harga_satuan: 22080000,
    subtotal: 22080000,
    jenis_pajak: 'ppn',
    persentase_pajak: 11,
    nilai_pajak: 0,
    total_setelah_pajak: 22080000,
    bukti_file_url: '',
    catatan: 'Termasuk instalasi dan uji keselamatan di halaman sekolah',
    created_at: '2026-01-28T14:00:00Z',
  },
];

export const SEED_VENDORS: ProjectVendor[] = [
  {
    id: 'vnd-001',
    project_id: 'proj-001',
    nama_vendor: 'UD Sarana PAUD Meulaboh',
    kontak_vendor: '0655-7001234 / sarana.paud@acehbarat.co.id',
    nama_pic_internal: 'Fatimah, S.Pd',
    kontak_pic_internal: '0852-6012-3456',
    nilai_anggaran_kontrak: 35400000,
    jenis_pajak_kontrak: 'ppn',
    persentase_pajak_kontrak: 11,
    nilai_pajak_kontrak: 0,
    nilai_kontrak_setelah_pajak: 35400000,
    created_at: '2026-01-10T08:00:00Z',
  },
];

export const useAppStore = create<AppState>((set) => ({
  activeTahun: 2026,
  setActiveTahun: (tahun) => set({ activeTahun: tahun }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  // Database initial states
  isSupabaseMode: false,
  setIsSupabaseMode: (active) => set({ isSupabaseMode: active }),
  dbData: null,
  setDbData: (data) => set({ dbData: data }),
  isLoadingDb: false,
  setIsLoadingDb: (loading) => set({ isLoadingDb: loading }),

  // Transaction initial states
  transaksiList: INITIAL_TRANSACTIONS,
  addTransaksi: (t) => set((state) => ({ transaksiList: [t, ...state.transaksiList] })),
  setTransaksiList: (list) => set((state) => ({
    transaksiList: typeof list === 'function' ? list(state.transaksiList) : list
  })),

  // Rencana initial states for KB AL-IKHLAS
  rencanaList: [
    {
      id: 'rab-kb-1',
      tanggal: '15 Jan 2026',
      institusiId: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
      namaInstitusi: 'KB AL-IKHLAS',
      jenjang: 'PAUD',
      kategori: 'Buku & Perpus',
      item: 'Rencana Pengadaan Buku Cerita Bergambar & Modul Karakter Anak PAUD',
      qty: 1,
      hargaSatuan: 28500000,
      nominal: 28500000,
      strukStatus: 'VALID',
      strukMessage: 'Rencana anggaran telah di-review sesuai juknis BOP PAUD',
      invoiceNo: 'RAB-PAUD-001',
      vendorName: 'CV Pustaka Ceria Aceh'
    },
    {
      id: 'rab-kb-2',
      tanggal: '28 Jan 2026',
      institusiId: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
      namaInstitusi: 'KB AL-IKHLAS',
      jenjang: 'PAUD',
      kategori: 'Sarana Prasarana',
      item: 'Rencana Pengadaan Alat Permainan Edukatif (APE) Indoor & Outdoor',
      qty: 1,
      hargaSatuan: 35400000,
      nominal: 35400000,
      strukStatus: 'VALID',
      strukMessage: 'Rencana pengadaan sarana APE telah disetujui komite sekolah',
      invoiceNo: 'RAB-APE-002',
      vendorName: 'UD Sarana PAUD Meulaboh'
    },
    {
      id: 'rab-kb-3',
      tanggal: '15 Feb 2026',
      institusiId: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
      namaInstitusi: 'KB AL-IKHLAS',
      jenjang: 'PAUD',
      kategori: 'Gaji Honorer',
      item: 'Rencana Honorarium Guru & Tenaga Pendidik PAUD (Bulan Jan-Feb)',
      qty: 8,
      hargaSatuan: 4000000,
      nominal: 32000000,
      strukStatus: 'VALID',
      strukMessage: 'Alokasi honorarium guru sesuai SK Kepala Sekolah',
      invoiceNo: 'RAB-HONOR-003',
      vendorName: 'Kas Utama Sekolah'
    },
    {
      id: 'rab-kb-4',
      tanggal: '10 Mar 2026',
      institusiId: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
      namaInstitusi: 'KB AL-IKHLAS',
      jenjang: 'PAUD',
      kategori: 'Operasional',
      item: 'Rencana Pengadaan ATK, Krayon, Kertas Lipat & Perlengkapan Menggambar',
      qty: 1,
      hargaSatuan: 18750000,
      nominal: 18750000,
      strukStatus: 'VALID',
      strukMessage: 'Rencana operasional pembelajaran anak usia dini',
      invoiceNo: 'RAB-ATK-004',
      vendorName: 'Toko Alat Tulis Samatiga'
    },
    {
      id: 'rab-kb-5',
      tanggal: '05 Apr 2026',
      institusiId: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
      namaInstitusi: 'KB AL-IKHLAS',
      jenjang: 'PAUD',
      kategori: 'Kegiatan Siswa',
      item: 'Rencana Pentas Seni Kreativitas Anak & Kunjungan Edukasi Lingkungan',
      qty: 1,
      hargaSatuan: 22600000,
      nominal: 22600000,
      strukStatus: 'VALID',
      strukMessage: 'Rencana kegiatan tahunan pentas kreativitas anak PAUD',
      invoiceNo: 'RAB-EVENT-005',
      vendorName: 'Panitia Kreativitas PAUD'
    },
    {
      id: 'rab-kb-6',
      tanggal: '12 Mei 2026',
      institusiId: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
      namaInstitusi: 'KB AL-IKHLAS',
      jenjang: 'PAUD',
      kategori: 'Gaji Honorer',
      item: 'Rencana Honorarium Guru & Tenaga Pendidik PAUD (Bulan Mar-Apr)',
      qty: 8,
      hargaSatuan: 4000000,
      nominal: 32000000,
      strukStatus: 'VALID',
      strukMessage: 'Alokasi honorarium guru sesuai SK Kepala Sekolah',
      invoiceNo: 'RAB-HONOR-006',
      vendorName: 'Kas Utama Sekolah'
    },
    {
      id: 'rab-kb-7',
      tanggal: '18 Jun 2026',
      institusiId: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
      namaInstitusi: 'KB AL-IKHLAS',
      jenjang: 'PAUD',
      kategori: 'Operasional',
      item: 'Rencana Pemeliharaan Sanitasi, Kebersihan & Obat P3K Anak PAUD',
      qty: 1,
      hargaSatuan: 15400000,
      nominal: 15400000,
      strukStatus: 'VALID',
      strukMessage: 'Rencana pemeliharaan fasilitas higienis & P3K',
      invoiceNo: 'RAB-SAN-007',
      vendorName: 'Apotek Sehat Samatiga'
    },
    {
      id: 'rab-kb-8',
      tanggal: '15 Jul 2026',
      institusiId: 'e45bdf94-41c6-4ee0-9864-8c3c7c4576f7',
      namaInstitusi: 'KB AL-IKHLAS',
      jenjang: 'PAUD',
      kategori: 'Lainnya',
      item: 'Rencana Langganan Listrik, Internet & Komunikasi Sekolah PAUD',
      qty: 1,
      hargaSatuan: 12561537,
      nominal: 12561537,
      strukStatus: 'VALID',
      strukMessage: 'Rencana pembiayaan langganan utilitas dan konektivitas',
      invoiceNo: 'RAB-UTIL-008',
      vendorName: 'PT Telkom & PLN'
    }
  ],
  setRencanaList: (list) => set((state) => ({
    rencanaList: typeof list === 'function' ? list(state.rencanaList) : list
  })),
  removeRencana: (id) => set((state) => ({
    rencanaList: state.rencanaList.filter((r) => r.id !== id)
  })),

  // Notification initial states
  notifications: [],
  setNotifications: (list) => set({ notifications: list }),
  addNotification: (n) => set((state) => ({
    notifications: [
      {
        ...n,
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: 'Baru saja',
        unread: true,
      },
      ...state.notifications
    ]
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, unread: false } : n)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, unread: false }))
  })),
  markAllAsUnread: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, unread: true }))
  })),

  // Paket Project states
  paketProjectList: [],
  addPaketProject: (p) => set((state) => ({ paketProjectList: [p, ...state.paketProjectList] })),
  updatePaketProject: (id, data) => set((state) => ({
    paketProjectList: state.paketProjectList.map(p => p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p)
  })),
  removePaketProject: (id) => set((state) => ({
    paketProjectList: state.paketProjectList.filter(p => p.id !== id)
  })),
  setPaketProjectList: (list) => set((state) => ({
    paketProjectList: typeof list === 'function' ? list(state.paketProjectList) : list
  })),

  // Project Photos
  projectPhotos: [],
  addProjectPhoto: (photo) => set((state) => ({ projectPhotos: [photo, ...state.projectPhotos] })),
  removeProjectPhoto: (id) => set((state) => ({
    projectPhotos: state.projectPhotos.filter(p => p.id !== id)
  })),
  setProjectPhotos: (list) => set((state) => ({
    projectPhotos: typeof list === 'function' ? list(state.projectPhotos) : list
  })),

  // Project Expenses
  projectExpenses: [],
  addProjectExpense: (expense) => set((state) => ({ projectExpenses: [expense, ...state.projectExpenses] })),
  updateProjectExpense: (id, data) => set((state) => ({
    projectExpenses: state.projectExpenses.map(e => e.id === id ? { ...e, ...data } : e)
  })),
  removeProjectExpense: (id) => set((state) => ({
    projectExpenses: state.projectExpenses.filter(e => e.id !== id)
  })),
  setProjectExpenses: (list) => set((state) => ({
    projectExpenses: typeof list === 'function' ? list(state.projectExpenses) : list
  })),

  // Project Vendors
  projectVendors: [],
  addProjectVendor: (vendor) => set((state) => ({ projectVendors: [vendor, ...state.projectVendors] })),
  updateProjectVendor: (id, data) => set((state) => ({
    projectVendors: state.projectVendors.map(v => v.id === id ? { ...v, ...data } : v)
  })),
  removeProjectVendor: (id) => set((state) => ({
    projectVendors: state.projectVendors.filter(v => v.id !== id)
  })),
  setProjectVendors: (list) => set((state) => ({
    projectVendors: typeof list === 'function' ? list(state.projectVendors) : list
  })),
}));

