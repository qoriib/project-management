import { create } from 'zustand';
import { bomRepo, bomGroupRepo, type BOMDetail, type BOMGroup } from '@/db/repositories';

interface BOMStore {
  boms: BOMDetail[];
  bomGroups: BOMGroup[];
  isLoadingBOMs: boolean;
  loadBOMs: (projectId: string) => Promise<void>;
  createBOM: (data: { project_id: string; bom_group_id: string; item_id: string; qty: number; item_price_id: string }) => Promise<void>;
  updateBOM: (id: string, data: { bom_group_id?: string; item_id?: string; qty?: number; item_price_id?: string }) => Promise<void>;
  deleteBOM: (id: string) => Promise<void>;
}

export const useBOMStore = create<BOMStore>((set, get) => ({
  boms: [],
  bomGroups: [],
  isLoadingBOMs: false,

  loadBOMs: async (projectId) => {
    set({ isLoadingBOMs: true });
    try {
      const [boms, bomGroups] = await Promise.all([
        bomRepo.findAllWithDetails({ project_id: projectId }),
        bomGroupRepo.findByProject(projectId)
      ]);
      set({ boms, bomGroups });
    } catch (err) {
      console.error("Failed to load BOMs", err);
      set({ boms: [], bomGroups: [] });
    } finally {
      set({ isLoadingBOMs: false });
    }
  },

  createBOM: async (data) => {
    await bomRepo.create(data);
    await get().loadBOMs(data.project_id);
  },

  updateBOM: async (id, data) => {
    const existing = get().boms.find(b => b.bom_id === id);
    if (!existing) return;
    await bomRepo.update(id, data);
    await get().loadBOMs(existing.project_id);
  },

  deleteBOM: async (id) => {
    const existing = get().boms.find(b => b.bom_id === id);
    if (!existing) return;
    await bomRepo.delete(id);
    await get().loadBOMs(existing.project_id);
  }
}));
