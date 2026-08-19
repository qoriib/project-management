import { create } from "zustand";
import {
  type DeliveryItemByPO,
  type POItemDetail,
  type POItemInput,
  type POWithSummary,
  deliveryRepo,
  purchaseOrderRepo,
} from "@/db/repositories";
import { type BOMReportItem, getBOMReport } from "@/db/services";
import { useBOMStore } from "@/store/useBOMStore";

interface POStore {
  // ── States ─────────────────────────────────────────────────────────────────
  pos: POWithSummary[];
  currentPO: POWithSummary | null;
  currentItems: POItemDetail[];
  currentDeliveryItems: DeliveryItemByPO[];
  currentBOMData: BOMReportItem[];

  // ── Load Actions ───────────────────────────────────────────────────────────
  loadAllPOs: (projectId?: string) => Promise<void>;
  loadPODetail: (id: string) => Promise<void>;
  loadBOMReportForProject: (projectId: string) => Promise<void>;
  clearPODetail: () => void;

  // ── CRUD Wrappers ──────────────────────────────────────────────────────────
  createPO: (
    data: { po_date: string; project_id: string; po_code: string },
    items: POItemInput[],
  ) => Promise<string>;
  updatePO: (
    id: string,
    data: { po_date: string; project_id: string; po_code: string },
    items: POItemInput[],
  ) => Promise<void>;
  deletePO: (id: string) => Promise<void>;
}

export const usePOStore = create<POStore>((set, get) => ({
  clearPODetail: () => {
    set({ currentPO: null, currentItems: [], currentDeliveryItems: [], currentBOMData: [] });
  },
  createPO: async (data, items) => {
    const poId = await purchaseOrderRepo.createWithItems(data, items);
    await get().loadAllPOs(data.project_id);
    await useBOMStore.getState().loadBOMs(data.project_id);
    return poId;
  },
  currentBOMData: [],
  currentDeliveryItems: [],
  currentItems: [],
  currentPO: null,
  deletePO: async (id) => {
    const { pos } = get();
    const po = pos.find((p) => p.po_id === id);
    await purchaseOrderRepo.delete(id);
    if (po) {
      await get().loadAllPOs(po.project_id);
      await useBOMStore.getState().loadBOMs(po.project_id);
    } else {
      await get().loadAllPOs();
    }
  },
  loadAllPOs: async (projectId) => {
    const p = await purchaseOrderRepo.findAllWithSummary({ project_id: projectId });
    set({ pos: p });
  },
  loadBOMReportForProject: async (projectId) => {
    const bom = await getBOMReport(projectId);
    set({ currentBOMData: bom });
  },
  loadPODetail: async (id) => {
    const p = await purchaseOrderRepo.findByIdWithSummary(id);
    if (p) {
      const [items, delItems, bom] = await Promise.all([
        purchaseOrderRepo.findItems(id),
        deliveryRepo.findItemsByPO(id),
        getBOMReport(p.project_id),
      ]);
      set({
        currentPO: p,
        currentItems: items,
        currentDeliveryItems: delItems,
        currentBOMData: bom,
      });
    } else {
      set({ currentPO: null, currentItems: [], currentDeliveryItems: [], currentBOMData: [] });
    }
  },
  pos: [],
  updatePO: async (id, data, items) => {
    await purchaseOrderRepo.updateWithItems(id, data, items);
    await get().loadAllPOs(data.project_id);
    // Reload detail if it's the currently viewed PO
    const { currentPO } = get();
    if (currentPO && currentPO.po_id === id) {
      await get().loadPODetail(id);
    }
    await useBOMStore.getState().loadBOMs(data.project_id);
  },
}));
