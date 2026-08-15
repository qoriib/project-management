import { create } from 'zustand';
import {
  purchaseOrderRepo,
  deliveryRepo,
  type POWithSummary,
  type POItemDetail,
  type DeliveryItemByPO,
  type POItemInput,
} from '@/db/repositories';
import { getDashboardBOMReport, type DashboardBOMReportItem } from '@/db/services';
import { useBOMStore } from '@/store/useBOMStore';

interface POStore {
  // ── States ─────────────────────────────────────────────────────────────────
  pos: POWithSummary[];
  currentPO: POWithSummary | null;
  currentItems: POItemDetail[];
  currentDeliveryItems: DeliveryItemByPO[];
  currentBOMData: DashboardBOMReportItem[];
  
  // ── Load Actions ───────────────────────────────────────────────────────────
  loadAllPOs: (projectId?: number) => Promise<void>;
  loadPODetail: (id: number) => Promise<void>;
  clearPODetail: () => void;

  // ── CRUD Wrappers ──────────────────────────────────────────────────────────
  createPO: (data: { po_date: string; project_id: number }, items: POItemInput[]) => Promise<void>;
  updatePO: (id: number, data: { po_date: string; project_id: number }, items: POItemInput[]) => Promise<void>;
  deletePO: (id: number) => Promise<void>;
}

export const usePOStore = create<POStore>((set, get) => ({
  pos: [],
  currentPO: null,
  currentItems: [],
  currentDeliveryItems: [],
  currentBOMData: [],

  loadAllPOs: async (projectId) => {
    const p = await purchaseOrderRepo.findAllWithSummary({ project_id: projectId });
    set({ pos: p });
  },

  loadPODetail: async (id) => {
    const p = await purchaseOrderRepo.findByIdWithSummary(id);
    if (p) {
      const [items, delItems, bom] = await Promise.all([
        purchaseOrderRepo.findItems(id),
        deliveryRepo.findItemsByPO(id),
        getDashboardBOMReport(p.project_id)
      ]);
      set({ currentPO: p, currentItems: items, currentDeliveryItems: delItems, currentBOMData: bom });
    } else {
      set({ currentPO: null, currentItems: [], currentDeliveryItems: [], currentBOMData: [] });
    }
  },

  clearPODetail: () => {
    set({ currentPO: null, currentItems: [], currentDeliveryItems: [], currentBOMData: [] });
  },

  createPO: async (data, items) => {
    await purchaseOrderRepo.createWithItems(data, items);
    await get().loadAllPOs(data.project_id);
    await useBOMStore.getState().loadBOMs(data.project_id);
  },

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

  deletePO: async (id) => {
    // Need to get project_id before delete if we want to refresh correctly,
    // or just rely on component re-fetching via selectedProjectId
    const { pos } = get();
    const po = pos.find(p => p.po_id === id);
    await purchaseOrderRepo.delete(id);
    if (po) {
      await get().loadAllPOs(po.project_id);
      await useBOMStore.getState().loadBOMs(po.project_id);
    } else {
      await get().loadAllPOs();
    }
  }


}));
