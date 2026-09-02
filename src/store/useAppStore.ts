import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark";

interface AppStore {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;

  dbReady: boolean;
  setDbReady: (ready: boolean) => void;

  activeNav: string;
  setActiveNav: (nav: string) => void;

  themeMode: ThemeMode;
  resolvedMode: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      activeNav: "/",
      dbReady: false,
      resolvedMode: "light",
      selectedProjectId: null,
      setActiveNav: (nav) => set({ activeNav: nav }),
      setDbReady: (ready) => set({ dbReady: ready }),
      setSelectedProjectId: (id) => set({ selectedProjectId: id }),
      setThemeMode: (mode) => {
        set({
          resolvedMode: mode,
          themeMode: mode,
        });
      },
      themeMode: "light",
      toggleThemeMode: () => {
        const { resolvedMode } = get();
        const next: ThemeMode = resolvedMode === "dark" ? "light" : "dark";
        set({ resolvedMode: next, themeMode: next });
      },
    }),
    {
      name: "app-storage",
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        state.resolvedMode = state.themeMode || "light";
      },
      partialize: (state) => ({
        selectedProjectId: state.selectedProjectId,
        themeMode: state.themeMode,
      }),
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
