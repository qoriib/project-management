import { create } from 'zustand';
import {
  itemRepo,
  itemCategoryRepo,
  projectRepo,
  unitRepo,
  vendorRepo,
  type ItemWithDetails,
  type ItemCategory,
  type ProjectWithStages,
  type Unit,
  type Vendor,
  type CreateItem,
  type UpdateItem,
  type CreateItemCategory,
  type UpdateItemCategory,
  type CreateProject,
  type UpdateProject,
  type StageInput,
  type CreateUnit,
  type UpdateUnit,
  type CreateVendor,
  type UpdateVendor
} from '@/db/repositories';

interface MasterStore {
  // ── States ─────────────────────────────────────────────────────────────────
  isLoaded: boolean;
  items: ItemWithDetails[];
  categories: ItemCategory[];
  projects: ProjectWithStages[];
  units: Unit[];
  vendors: Vendor[];

  // ── Load Actions ───────────────────────────────────────────────────────────
  loadAllMasters: () => Promise<void>;
  reloadItems: () => Promise<void>;
  reloadCategories: () => Promise<void>;
  reloadProjects: () => Promise<void>;
  reloadUnits: () => Promise<void>;
  reloadVendors: () => Promise<void>;

  // ── CRUD Wrappers ──────────────────────────────────────────────────────────
  
  // Items
  createItem: (data: CreateItem) => Promise<void>;
  updateItem: (id: number, data: UpdateItem) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;

  // Categories
  createCategory: (data: CreateItemCategory) => Promise<void>;
  updateCategory: (id: number, data: UpdateItemCategory) => Promise<void>;
  deleteCategory: (id: number) => Promise<void>;

  // Projects
  createProject: (data: CreateProject, stages: StageInput[]) => Promise<void>;
  updateProject: (id: number, data: UpdateProject, stages: StageInput[]) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  // Units
  createUnit: (data: CreateUnit) => Promise<void>;
  updateUnit: (id: number, data: UpdateUnit) => Promise<void>;
  deleteUnit: (id: number) => Promise<void>;

  // Vendors
  createVendor: (data: CreateVendor) => Promise<void>;
  updateVendor: (id: number, data: UpdateVendor) => Promise<void>;
  deleteVendor: (id: number) => Promise<void>;
}

export const useMasterStore = create<MasterStore>((set, get) => ({
  isLoaded: false,
  items: [],
  categories: [],
  projects: [],
  units: [],
  vendors: [],

  loadAllMasters: async () => {
    if (get().isLoaded) return;
    try {
      const [items, categories, projects, units, vendors] = await Promise.all([
        itemRepo.findAll(),
        itemCategoryRepo.findAllSorted(),
        projectRepo.findAllWithStages(),
        unitRepo.findAllSorted(),
        vendorRepo.findAllSorted()
      ]);
      set({ items, categories, projects, units, vendors, isLoaded: true });
    } catch (err) {
      console.error("Failed to load master data", err);
    }
  },

  reloadItems: async () => {
    const items = await itemRepo.findAll();
    set({ items });
  },
  reloadCategories: async () => {
    const categories = await itemCategoryRepo.findAllSorted();
    set({ categories });
  },
  reloadProjects: async () => {
    const projects = await projectRepo.findAllWithStages();
    set({ projects });
  },
  reloadUnits: async () => {
    const units = await unitRepo.findAllSorted();
    set({ units });
  },
  reloadVendors: async () => {
    const vendors = await vendorRepo.findAllSorted();
    set({ vendors });
  },

  // ── Items CRUD ──
  createItem: async (data) => {
    await itemRepo.create(data);
    await get().reloadItems();
  },
  updateItem: async (id, data) => {
    await itemRepo.update(id, data);
    await get().reloadItems();
  },
  deleteItem: async (id) => {
    await itemRepo.delete(id);
    await get().reloadItems();
  },

  // ── Categories CRUD ──
  createCategory: async (data) => {
    await itemCategoryRepo.create(data);
    await get().reloadCategories();
  },
  updateCategory: async (id, data) => {
    await itemCategoryRepo.update(id, data);
    await get().reloadCategories();
  },
  deleteCategory: async (id) => {
    await itemCategoryRepo.delete(id);
    await get().reloadCategories();
  },

  // ── Projects CRUD ──
  createProject: async (data, stages) => {
    const projectId = await projectRepo.create(data);
    if (stages.length > 0) {
      await projectRepo.saveStages(projectId, stages);
    }
    await get().reloadProjects();
  },
  updateProject: async (id, data, stages) => {
    await projectRepo.update(id, data);
    if (stages.length > 0) {
      await projectRepo.saveStages(id, stages);
    }
    await get().reloadProjects();
  },
  deleteProject: async (id) => {
    await projectRepo.delete(id);
    await get().reloadProjects();
  },

  // ── Units CRUD ──
  createUnit: async (data) => {
    await unitRepo.create(data);
    await get().reloadUnits();
  },
  updateUnit: async (id, data) => {
    await unitRepo.update(id, data);
    await get().reloadUnits();
  },
  deleteUnit: async (id) => {
    await unitRepo.delete(id);
    await get().reloadUnits();
  },

  // ── Vendors CRUD ──
  createVendor: async (data) => {
    await vendorRepo.create(data);
    await get().reloadVendors();
  },
  updateVendor: async (id, data) => {
    await vendorRepo.update(id, data);
    await get().reloadVendors();
  },
  deleteVendor: async (id) => {
    await vendorRepo.delete(id);
    await get().reloadVendors();
  },
}));
