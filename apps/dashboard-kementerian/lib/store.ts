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

// Helper to load persisted real audit logs from browser storage
function getStoredAuditLogs(): AuditLogItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('kementerian_audit_logs');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to read audit logs from storage:', err);
  }
  return [];
}

function saveAuditLogsToStorage(logs: AuditLogItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('kementerian_audit_logs', JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save audit logs to storage:', err);
  }
}

function getStoredUser(): User {
  if (typeof window === 'undefined') return DEFAULT_USER;
  try {
    const stored = localStorage.getItem('kementerian_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) return parsed;
    }
  } catch (err) {}
  return DEFAULT_USER;
}

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
  logout: () => void;
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
  setCurrentUser: (user) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kementerian_user', JSON.stringify(user));
      } catch (e) {}
    }
    set({ currentUser: user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('kementerian_user');
      } catch (e) {}
    }
    set({ currentUser: DEFAULT_USER });
  },

  // Audit Logs (Pure Real-Time Logs — No Sample / Dummy Data)
  auditLogs: getStoredAuditLogs(),
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
      const updatedLogs = [newLogItem, ...state.auditLogs];
      saveAuditLogsToStorage(updatedLogs);
      return { auditLogs: updatedLogs };
    }),
  clearAuditLogs: () => {
    saveAuditLogsToStorage([]);
    set({ auditLogs: [] });
  },

  auditDrawerOpen: false,
  toggleAuditDrawer: () => set((s) => ({ auditDrawerOpen: !s.auditDrawerOpen })),
  setAuditDrawerOpen: (open) => set({ auditDrawerOpen: open }),
}));

