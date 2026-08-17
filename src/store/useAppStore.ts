import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ThemeMode = 'light' | 'dark' | 'system';

function getSystemMode(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface AppStore {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  dbReady: boolean;
  setDbReady: (ready: boolean) => void;

  globalError: string | null;
  setGlobalError: (err: string | null) => void;

  activeNav: string;
  setActiveNav: (nav: string) => void;

  themeMode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  _setSystemMode: (mode: 'light' | 'dark') => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      selectedProjectId: null,
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),

      dbReady: false,
      setDbReady: (ready) => set({ dbReady: ready }),

      globalError: null,
      setGlobalError: (err) => set({ globalError: err }),

      activeNav: '/',
      setActiveNav: (nav) => set({ activeNav: nav }),

      themeMode: 'dark',
      resolvedMode: getSystemMode(), // will be corrected after persist rehydrates
      setThemeMode: (mode) => {
        const systemMode = getSystemMode();
        set({
          themeMode: mode,
          resolvedMode: mode === 'system' ? systemMode : mode,
        });
      },
      toggleThemeMode: () => {
        const { resolvedMode } = get();
        const next: ThemeMode = resolvedMode === 'dark' ? 'light' : 'dark';
        set({ themeMode: next, resolvedMode: next });
      },
      _setSystemMode: (mode) => {
        const { themeMode } = get();
        if (themeMode === 'system') set({ resolvedMode: mode });
      },
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => localStorage),
      // Persist project selection and theme choice only.
      // dbReady, globalError, activeNav reset on every load.
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        themeMode: state.themeMode,
      }),
      // After rehydration, sync resolvedMode from the persisted themeMode
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const systemMode = getSystemMode();
        state.resolvedMode =
          state.themeMode === 'system' ? systemMode : state.themeMode;
      },
    }
  )
);

// Set up once at module load so the store stays reactive to OS changes
// without needing a React component wrapper.
const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener('change', (e) => {
  useAppStore.getState()._setSystemMode(e.matches ? 'dark' : 'light');
});
