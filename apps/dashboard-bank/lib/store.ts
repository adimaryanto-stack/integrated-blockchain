'use client';

import { create } from 'zustand';
import { User } from '@/types';

export const DEFAULT_BANK_USER: User = {
  id: 'usr-bank-mandiri',
  username: 'Super Admin (Bank Penyalur)',
  email: 'superadmin@davincibank.co.id',
  role: 'SUPER_ADMIN',
  is_active: true,
  created_at: '2026-01-01',
};

function getStoredBankUser(): User {
  if (typeof window === 'undefined') return DEFAULT_BANK_USER;
  try {
    const stored = localStorage.getItem('bank_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) return parsed;
    }
  } catch (err) {}
  return DEFAULT_BANK_USER;
}

interface AppState {
  activeTahun: number;
  setActiveTahun: (tahun: number) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // RBAC User Session State
  currentUser: User;
  setCurrentUser: (user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTahun: 2026,
  setActiveTahun: (tahun) => set({ activeTahun: tahun }),
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // User auth state
  currentUser: DEFAULT_BANK_USER,
  setCurrentUser: (user) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bank_user', JSON.stringify(user));
      } catch (e) {}
    }
    set({ currentUser: user });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('bank_user');
      } catch (e) {}
    }
    set({ currentUser: DEFAULT_BANK_USER });
  },
}));
