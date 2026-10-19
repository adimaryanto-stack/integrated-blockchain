'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User } from '@/types';

export const DEFAULT_AUDITOR_USER: User = {
  id: 'usr-bpk-auditor',
  username: 'Super Admin (BPK RI)',
  email: 'admin@auditor.go.id',
  role: 'SUPER_ADMIN',
  is_active: true,
  created_at: '2026-01-01',
};

function getStoredAuditorUser(): User {
  if (typeof window === 'undefined') return DEFAULT_AUDITOR_USER;
  try {
    const stored = localStorage.getItem('auditor_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.email) return parsed;
    }
  } catch (err) {}
  return DEFAULT_AUDITOR_USER;
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
  province_school_stats?: any[];
}

interface AppState {
  activeTahun: number;
  setActiveTahun: (tahun: number) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Supabase states
  isSupabaseMode: boolean;
  setIsSupabaseMode: (active: boolean) => void;
  dbData: DbData | null;
  setDbData: (data: DbData | null) => void;
  isLoadingDb: boolean;
  setIsLoadingDb: (loading: boolean) => void;

  // Update institusi data lazily (dari halaman jenjang/profil)
  updateInstitusiData: (data: any[]) => void;

  // User session state
  currentUser: User;
  setCurrentUser: (user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeTahun: 2026,
      setActiveTahun: (tahun) => set({ activeTahun: tahun }),
      sidebarOpen: true,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // Supabase initial states
      isSupabaseMode: false,
      setIsSupabaseMode: (active) => set({ isSupabaseMode: active }),
      dbData: null,
      setDbData: (data) => set({ dbData: data }),
      isLoadingDb: false,
      setIsLoadingDb: (loading) => set({ isLoadingDb: loading }),

      // Lazy update: merge institusi ke dbData yang sudah ada
      updateInstitusiData: (institusiData) => {
        const current = get().dbData;
        if (current) {
          set({ dbData: { ...current, institusi_pendidikan: institusiData } });
        }
      },

      // User Session
      currentUser: DEFAULT_AUDITOR_USER,
      setCurrentUser: (user) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('auditor_user', JSON.stringify(user));
          } catch (e) {}
        }
        set({ currentUser: user });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('auditor_user');
          } catch (e) {}
        }
        set({ currentUser: DEFAULT_AUDITOR_USER });
      },
    }),
    {
      name: 'dashboard-auditor-store',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        activeTahun: state.activeTahun,
        sidebarOpen: state.sidebarOpen,
        currentUser: state.currentUser,
      }),
    }
  )
);
