import { create } from "zustand";

interface AppStore {
  // Active project filter (null = semua proyek)
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;

  // Global loading state for DB init
  dbReady: boolean;
  setDbReady: (ready: boolean) => void;

  // Global error
  globalError: string | null;
  setGlobalError: (err: string | null) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  selectedProjectId: null,
  setSelectedProjectId: (id) => set({ selectedProjectId: id }),

  dbReady: false,
  setDbReady: (ready) => set({ dbReady: ready }),

  globalError: null,
  setGlobalError: (err) => set({ globalError: err }),
}));
