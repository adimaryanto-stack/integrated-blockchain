import { create } from 'zustand';

interface AppState {
  activeTahun: number;
  setActiveTahun: (tahun: number) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  refreshKey: number;
  triggerRefresh: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeTahun: 2026,
  setActiveTahun: (tahun) => set({ activeTahun: tahun }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  refreshKey: 0,
  triggerRefresh: () => set((state) => ({ refreshKey: state.refreshKey + 1 })),
}));
