import { create } from "zustand";
import { type ReceiptSummary, receiptRepo } from "@/db/repositories";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";

interface ReceiptStore {
  // ── States ─────────────────────────────────────────────────────────────────
  receipts: ReceiptSummary[];

  // ── Load Actions ───────────────────────────────────────────────────────────
  loadAllReceipts: (projectId?: string) => Promise<void>;

  // ── CRUD Wrappers ──────────────────────────────────────────────────────────
  createReceipt: (
    data: { order_id: string; receipt_date: string; receipt_code: string },
    items: { order_item_id: string; qty: number }[],
  ) => Promise<void>;
  updateReceipt: (
    id: string,
    data: { order_id: string; receipt_date: string; receipt_code: string },
    items: { order_item_id: string; qty: number }[],
  ) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
}

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  createReceipt: async (data, items) => {
    await receiptRepo.createWithItems(data, items);
    await get().loadAllReceipts();

    // Sync Order Store
    const orderStore = useOrderStore.getState();
    await orderStore.loadAllOrders(useAppStore.getState().selectedProjectId || undefined);
    if (orderStore.currentOrder?.order_id === data.order_id) {
      await orderStore.loadOrderDetail(data.order_id);
    }
  },

  deleteReceipt: async (id) => {
    const receipt = get().receipts.find((d) => d.receipt_id === id);
    await receiptRepo.delete(id);
    await get().loadAllReceipts();

    // Sync Order Store
    const orderStore = useOrderStore.getState();
    await orderStore.loadAllOrders(useAppStore.getState().selectedProjectId || undefined);
    if (receipt && orderStore.currentOrder?.order_id === receipt.order_id) {
      await orderStore.loadOrderDetail(receipt.order_id);
    }
  },

  receipts: [],

  loadAllReceipts: async (projectId) => {
    const d = await receiptRepo.findAllWithSummary({ project_id: projectId });
    set({ receipts: d });
  },

  updateReceipt: async (id, data, items) => {
    await receiptRepo.updateWithItems(id, data, items);
    await get().loadAllReceipts();

    // Sync Order Store
    const orderStore = useOrderStore.getState();
    await orderStore.loadAllOrders(useAppStore.getState().selectedProjectId || undefined);
    if (orderStore.currentOrder?.order_id === data.order_id) {
      await orderStore.loadOrderDetail(data.order_id);
    }
  },
}));
