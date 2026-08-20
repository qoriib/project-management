import { create } from "zustand";
import { type RequirementDetail, requirementRepo } from "@/db/repositories";

interface RequirementStore {
  requirements: RequirementDetail[];
  isLoadingRequirements: boolean;
  loadRequirements: (projectId: string) => Promise<void>;
  createRequirement: (data: {
    project_id: string;
    item_id: string;
    qty: number;
    item_price_id: string;
  }) => Promise<void>;
  updateRequirement: (
    id: string,
    data: {
      item_id?: string;
      qty?: number;
      item_price_id?: string;
    },
  ) => Promise<void>;
  deleteRequirement: (id: string) => Promise<void>;
}

export const useRequirementStore = create<RequirementStore>((set, get) => ({
  requirements: [],
  createRequirement: async (data) => {
    await requirementRepo.create(data);
    await get().loadRequirements(data.project_id);
  },
  deleteRequirement: async (id) => {
    const existing = get().requirements.find((r) => r.requirement_id === id);
    if (!existing) return;
    await requirementRepo.delete(id);
    await get().loadRequirements(existing.project_id);
  },
  isLoadingRequirements: false,
  loadRequirements: async (projectId) => {
    set({ isLoadingRequirements: true });
    try {
      const requirements = await requirementRepo.findAllWithDetails({ project_id: projectId });
      set({ requirements });
    } catch (err) {
      console.error("Failed to load Requirements", err);
      set({ requirements: [] });
    } finally {
      set({ isLoadingRequirements: false });
    }
  },
  updateRequirement: async (id, data) => {
    const existing = get().requirements.find((r) => r.requirement_id === id);
    if (!existing) return;
    await requirementRepo.update(id, data);
    await get().loadRequirements(existing.project_id);
  },
}));
