import { create } from "zustand";
import { useMasterStore } from "./useMasterStore";
import { type RequirementGroup, requirementGroupRepo } from "@/db/repositories";

interface RequirementGroupStore {
  groups: RequirementGroup[];
  isLoadingGroups: boolean;
  loadGroups: (projectId: string) => Promise<void>;
  createGroup: (projectId: string, groupName: string, budget?: number | null) => Promise<string>;
  updateGroup: (id: string, groupName: string, budget?: number | null) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
}

export const useRequirementGroupStore = create<RequirementGroupStore>((set, get) => ({
  groups: [],
  isLoadingGroups: false,

  loadGroups: async (projectId: string) => {
    set({ isLoadingGroups: true });
    try {
      const groups = await requirementGroupRepo.findByProject(projectId);
      set({ groups });
    } catch (err) {
      console.error("Failed to load Requirement Groups", err);
      set({ groups: [] });
    } finally {
      set({ isLoadingGroups: false });
    }
  },

  createGroup: async (projectId: string, groupName: string, budget?: number | null) => {
    const project = useMasterStore.getState().projects.find((proj) => proj.project_id === projectId);
    if (project?.requirements_is_approved === 1) {
      throw new Error("Gagal: Kebutuhan untuk proyek ini telah dikunci karena sudah disetujui.");
    }
    const id = await requirementGroupRepo.create({
      project_id: projectId,
      group_name: groupName,
      budget: budget && budget > 0 ? budget : null,
    });
    await get().loadGroups(projectId);
    return id;
  },

  updateGroup: async (id: string, groupName: string, budget?: number | null) => {
    const existing = get().groups.find((grp) => grp.requirement_group_id === id);
    if (!existing) return;

    const project = useMasterStore.getState().projects.find((proj) => proj.project_id === existing.project_id);
    if (project?.requirements_is_approved === 1) {
      throw new Error("Gagal: Kebutuhan untuk proyek ini telah dikunci karena sudah disetujui.");
    }

    const payload: { group_name: string; budget?: number | null } = { group_name: groupName };
    if (budget !== undefined) {
      payload.budget = budget && budget > 0 ? budget : null;
    }

    await requirementGroupRepo.update(id, payload);
    await get().loadGroups(existing.project_id);
  },

  deleteGroup: async (id: string) => {
    const existing = get().groups.find((grp) => grp.requirement_group_id === id);
    if (!existing) return;

    const project = useMasterStore.getState().projects.find((proj) => proj.project_id === existing.project_id);
    if (project?.requirements_is_approved === 1) {
      throw new Error("Gagal: Kebutuhan untuk proyek ini telah dikunci karena sudah disetujui.");
    }

    await requirementGroupRepo.delete(id);
    await get().loadGroups(existing.project_id);
  },
}));
