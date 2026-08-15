import { create } from 'zustand';
import { bomRepo, type BOMDetail } from '@/db/repositories';

interface BOMStore {
  boms: BOMDetail[];
  isLoadingBOMs: boolean;
  loadBOMs: (projectId: number, stageId?: number) => Promise<void>;
  createBOM: (data: { project_id: number; item_id: number; stage_id: number; qty: number; item_price_id: number }) => Promise<void>;
  updateBOM: (id: number, data: { item_id?: number; qty?: number; item_price_id?: number }) => Promise<void>;
  deleteBOM: (id: number) => Promise<void>;
}

export const useBOMStore = create<BOMStore>((set, get) => ({
  boms: [],
  isLoadingBOMs: false,

  loadBOMs: async (projectId, stageId) => {
    set({ isLoadingBOMs: true });
    try {
      const boms = await bomRepo.findAllWithDetails({ project_id: projectId, stage_id: stageId });
      set({ boms });
    } catch (err) {
      console.error("Failed to load BOMs", err);
      set({ boms: [] });
    } finally {
      set({ isLoadingBOMs: false });
    }
  },

  createBOM: async (data) => {
    await bomRepo.create(data);
    await get().loadBOMs(data.project_id, data.stage_id);
  },

  updateBOM: async (id, data) => {
    const existing = get().boms.find(b => b.bom_id === id);
    if (!existing) return;
    await bomRepo.update(id, data);
    await get().loadBOMs(existing.project_id, existing.stage_id);
  },

  deleteBOM: async (id) => {
    const existing = get().boms.find(b => b.bom_id === id);
    if (!existing) return;
    await bomRepo.delete(id);
    await get().loadBOMs(existing.project_id, existing.stage_id);
  }
}));
