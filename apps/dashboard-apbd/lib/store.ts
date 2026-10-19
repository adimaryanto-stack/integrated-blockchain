'use client';

import { create } from 'zustand';

export interface ApbdUser {
  id: string;
  username: string;
  email: string;
  role: 'BPKAD' | 'BAPPEDA' | 'DISDIK' | 'INSPEKTORAT' | 'SUPER_ADMIN';
  instansi: string;
  is_active: boolean;
  created_at: string;
}

export const DEFAULT_APBD_USER: ApbdUser = {
  id: 'usr-bpkad-lampung',
  username: 'Drs. H. Marindo Kurniawan, M.M.',
  email: 'bpkad@lampungprov.go.id',
  role: 'BPKAD',
  instansi: 'BPKAD Provinsi Lampung',
  is_active: true,
  created_at: '2026-01-01',
};

function getStoredApbdUser(): ApbdUser {
  if (typeof window === 'undefined') return DEFAULT_APBD_USER;
  try {
    const stored = localStorage.getItem('apbd_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) return parsed;
    }
  } catch (err) {}
  return DEFAULT_APBD_USER;
}

interface AppState {
  activeTahun: number;
  setActiveTahun: (tahun: number) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  refreshKey: number;
  triggerRefresh: () => void;

  // RBAC User Session State
  currentUser: ApbdUser;
  setCurrentUser: (user: ApbdUser) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTahun: 2026,
  setActiveTahun: (tahun) => set({ activeTahun: tahun }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),

  // User session
  currentUser: DEFAULT_APBD_USER,
  setCurrentUser: (user) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('apbd_user', JSON.stringify(user));
      } catch (e) {}
    }
    set({ currentUser: user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('apbd_user');
      } catch (e) {}
    }
    set({ currentUser: DEFAULT_APBD_USER });
  },
}));
