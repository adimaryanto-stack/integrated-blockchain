import { create } from 'zustand';
import { User, AuditLogItem } from '@/types';

export const DEFAULT_USER: User = {
  id: 'usr-superadmin',
  username: 'Budi Santoso (Super Admin)',
  email: 'budi.santoso@kemdikbud.go.id',
  role: 'SUPER_ADMIN',
  is_active: true,
  created_at: '2026-01-01',
};

const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log-101',
    user_nama: 'Budi Santoso (Super Admin)',
    user_role: 'SUPER_ADMIN',
    entitas: 'Alokasi Provinsi (DKI Jakarta)',
    entitas_id: 'p-31',
    field: 'nominal_alokasi',
    nilai_lama: 'Rp 45.000.000.000.000',
    nilai_baru: 'Rp 48.500.000.000.000',
    timestamp: '26/07/2026 18:30:00',
  },
  {
    id: 'log-102',
    user_nama: 'Ahmad Dahlan',
    user_role: 'ADMIN_PROVINSI',
    entitas: 'Alokasi Kabupaten/Kota (Kota Jakarta Pusat)',
    entitas_id: 'k-p-31-0',
    field: 'realisasi_total',
    nilai_lama: 'Rp 10.200.000.000.000',
    nilai_baru: 'Rp 11.500.000.000.000',
    timestamp: '26/07/2026 17:45:12',
  },
  {
    id: 'log-103',
    user_nama: 'Siti Rahmawati',
    user_role: 'AUDITOR',
    entitas: 'Rincian Pengeluaran Institusi (Universitas Indonesia)',
    entitas_id: 'inst-universitas-0',
    field: 'pajak_persen',
    nilai_lama: '10%',
    nilai_baru: '11%',
    timestamp: '26/07/2026 16:15:30',
  },
];

interface AppState {
  activeTahun: number;
  setActiveTahun: (tahun: number) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  dataVersion: number;
  incrementVersion: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  // RBAC User Session State
  currentUser: User;
  setCurrentUser: (user: User) => void;
  // Audit Trail State
  auditLogs: AuditLogItem[];
  addAuditLog: (log: Omit<AuditLogItem, 'id' | 'timestamp'>) => void;
  clearAuditLogs: () => void;
  auditDrawerOpen: boolean;
  toggleAuditDrawer: () => void;
  setAuditDrawerOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTahun: 2026,
  setActiveTahun: (tahun) => set({ activeTahun: tahun }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  dataVersion: 0,
  incrementVersion: () => set((s) => ({ dataVersion: s.dataVersion + 1 })),
  loading: false,
  setLoading: (loading) => set({ loading }),

  // RBAC User Session
  currentUser: DEFAULT_USER,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Audit Logs
  auditLogs: INITIAL_AUDIT_LOGS,
  addAuditLog: (log) =>
    set((state) => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newLogItem: AuditLogItem = {
        ...log,
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: `${dateStr} ${timeStr}`,
      };
      return { auditLogs: [newLogItem, ...state.auditLogs] };
    }),
  clearAuditLogs: () => set({ auditLogs: [] }),

  auditDrawerOpen: false,
  toggleAuditDrawer: () => set((s) => ({ auditDrawerOpen: !s.auditDrawerOpen })),
  setAuditDrawerOpen: (open) => set({ auditDrawerOpen: open }),
}));

