import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      dbReady: false,
      setDbReady: (ready) => set({ dbReady: ready }),

      globalError: null,
      setGlobalError: (err) => set({ globalError: err }),
    }),
    {
      name: "app-storage", // nama unik untuk key di localStorage
      storage: createJSONStorage(() => localStorage),
      // Hanya selectedProjectId yang disimpan ke localStorage.
      // dbReady dan globalError diabaikan agar selalu di-reset saat aplikasi dimuat ulang.
      partialize: (state) => ({ selectedProjectId: state.selectedProjectId }),
    }
  )
);
