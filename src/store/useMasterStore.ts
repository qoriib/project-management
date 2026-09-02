import { create } from "zustand";
import {
  type CreateItem,
  type CreateItemCategory,
  type CreateItemPrice,
  type CreateProject,
  type CreateUnit,
  type CreateVendor,
  type ItemCategoryWithRelation,
  type ItemPrice,
  type ItemWithDetails,
  type ProjectWithRelations,
  type UnitWithRelation,
  type UpdateItem,
  type UpdateItemCategory,
  type UpdateItemPrice,
  type UpdateProject,
  type UpdateUnit,
  type UpdateVendor,
  type VendorWithRelation,
  itemCategoryRepo,
  itemPriceRepo,
  itemRepo,
  projectRepo,
  unitRepo,
  vendorRepo,
} from "@/db/repositories";

interface MasterStore {
  // ── States ─────────────────────────────────────────────────────────────────
  isLoaded: boolean;
  items: ItemWithDetails[];
  categories: ItemCategoryWithRelation[];
  projects: ProjectWithRelations[];
  units: UnitWithRelation[];
  vendors: VendorWithRelation[];
  /** Item_price_id → ItemPrice[], keyed by item_id for fast lookup */
  itemPricesMap: Map<string, ItemPrice[]>;

  // ── Load Actions ───────────────────────────────────────────────────────────
  loadAllMasters: () => Promise<void>;
  reloadItems: () => Promise<void>;
  reloadCategories: () => Promise<void>;
  reloadProjects: () => Promise<void>;
  reloadUnits: () => Promise<void>;
  reloadVendors: () => Promise<void>;
  /** Load/reload price variants for a specific item */
  loadItemPrices: (itemId: string) => Promise<ItemPrice[]>;

  // ── CRUD Wrappers ──────────────────────────────────────────────────────────

  // Items
  createItem: (data: CreateItem) => Promise<void>;
  updateItem: (id: string, data: UpdateItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // Item Prices
  createItemPrice: (data: CreateItemPrice) => Promise<void>;
  updateItemPrice: (id: string, data: UpdateItemPrice) => Promise<void>;
  deleteItemPrice: (id: string, itemId: string) => Promise<void>;

  // Categories
  createCategory: (data: CreateItemCategory) => Promise<void>;
  updateCategory: (id: string, data: UpdateItemCategory) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Projects
  createProject: (data: CreateProject) => Promise<void>;
  updateProject: (id: string, data: UpdateProject) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  approveRequirements: (id: string) => Promise<void>;
  cancelApproveRequirements: (id: string) => Promise<void>;

  // Units
  createUnit: (data: CreateUnit) => Promise<void>;
  updateUnit: (id: string, data: UpdateUnit) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;

  // Vendors
  createVendor: (data: CreateVendor) => Promise<void>;
  updateVendor: (id: string, data: UpdateVendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
}

export const useMasterStore = create<MasterStore>((set, get) => ({
  isLoaded: false,
  items: [],
  categories: [],
  projects: [],
  units: [],
  vendors: [],
  itemPricesMap: new Map(),

  loadAllMasters: async () => {
    if (get().isLoaded) {
      return;
    }
    try {
      const [items, categories, projects, units, vendors] = await Promise.all([
        itemRepo.findAll(),
        itemCategoryRepo.findAllSorted(),
        projectRepo.findAllWithRelations(),
        unitRepo.findAllSorted(),
        vendorRepo.findAllSorted(),
      ]);
      set({ categories, isLoaded: true, items, projects, units, vendors });
    } catch (error) {
      console.error("Failed to load master data", error);
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
    const projects = await projectRepo.findAllWithRelations();
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

  loadItemPrices: async (itemId) => {
    const prices = await itemPriceRepo.findByItem(itemId);
    set((state) => {
      const newMap = new Map(state.itemPricesMap);
      newMap.set(itemId, prices);
      return { itemPricesMap: newMap };
    });
    return prices;
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

  // ── Item Prices CRUD ──
  createItemPrice: async (data) => {
    await itemPriceRepo.create(data);
    await get().loadItemPrices(data.item_id);
  },
  updateItemPrice: async (id, data) => {
    await itemPriceRepo.update(id, data);
    // Reload prices for all items currently in map that might match
    const { itemPricesMap } = get();
    for (const [itemId, prices] of itemPricesMap) {
      if (prices.some((p) => p.item_price_id === id)) {
        await get().loadItemPrices(itemId);
        break;
      }
    }
  },
  deleteItemPrice: async (id, itemId) => {
    await itemPriceRepo.delete(id);
    await get().loadItemPrices(itemId);
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
  createProject: async (data) => {
    await projectRepo.create(data);
    await get().reloadProjects();
  },
  updateProject: async (id, data) => {
    await projectRepo.update(id, data);
    await get().reloadProjects();
  },
  deleteProject: async (id) => {
    await projectRepo.delete(id);
    await get().reloadProjects();
  },
  approveRequirements: async (id) => {
    await projectRepo.update(id, { requirements_is_approved: 1 });
    await get().reloadProjects();
  },
  cancelApproveRequirements: async (id) => {
    await projectRepo.update(id, { requirements_is_approved: 0 });
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
