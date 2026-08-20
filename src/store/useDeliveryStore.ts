import { create } from "zustand";
import { type DeliverySummary, deliveryRepo } from "@/db/repositories";
import { usePOStore } from "@/store/usePOStore";
import { useAppStore } from "@/store/useAppStore";

interface DeliveryStore {
  // ── States ─────────────────────────────────────────────────────────────────
  deliveries: DeliverySummary[];

  // ── Load Actions ───────────────────────────────────────────────────────────
  loadAllDeliveries: (projectId?: string) => Promise<void>;

  // ── CRUD Wrappers ──────────────────────────────────────────────────────────
  createDelivery: (
    data: { po_id: string; delivery_date: string; delivery_code: string },
    items: { po_item_id: string; qty: number }[],
  ) => Promise<void>;
  updateDelivery: (
    id: string,
    data: { po_id: string; delivery_date: string; delivery_code: string },
    items: { po_item_id: string; qty: number }[],
  ) => Promise<void>;
  deleteDelivery: (id: string) => Promise<void>;
}

export const useDeliveryStore = create<DeliveryStore>((set, get) => ({
  createDelivery: async (data, items) => {
    await deliveryRepo.createWithItems(data, items);
    await get().loadAllDeliveries();

    // Sync PO Store
    const poStore = usePOStore.getState();
    await poStore.loadAllPOs(
      useAppStore.getState().selectedProjectId || undefined,
    );
    if (poStore.currentPO?.po_id === data.po_id) {
      await poStore.loadPODetail(data.po_id);
    }
  },

  deleteDelivery: async (id) => {
    const delivery = get().deliveries.find((d) => d.delivery_id === id);
    await deliveryRepo.delete(id);
    await get().loadAllDeliveries();

    // Sync PO Store
    const poStore = usePOStore.getState();
    await poStore.loadAllPOs(
      useAppStore.getState().selectedProjectId || undefined,
    );
    if (delivery && poStore.currentPO?.po_id === delivery.po_id) {
      await poStore.loadPODetail(delivery.po_id);
    }
  },

  deliveries: [],

  loadAllDeliveries: async (projectId) => {
    const d = await deliveryRepo.findAllWithSummary({ project_id: projectId });
    set({ deliveries: d });
  },

  updateDelivery: async (id, data, items) => {
    await deliveryRepo.updateWithItems(id, data, items);
    await get().loadAllDeliveries();

    // Sync PO Store
    const poStore = usePOStore.getState();
    await poStore.loadAllPOs(
      useAppStore.getState().selectedProjectId || undefined,
    );
    if (poStore.currentPO?.po_id === data.po_id) {
      await poStore.loadPODetail(data.po_id);
    }
  },
}));
