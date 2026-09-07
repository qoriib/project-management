import { create } from "zustand";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";
import { type ReceiptSummary, receiptRepo } from "@/db/repositories";

interface ReceiptStore {
  receipts: ReceiptSummary[];

  loadAllReceipts: (projectId?: string) => Promise<void>;

  createEmptyReceipt: (data: { order_id: string; receipt_date: string; receipt_code: string }) => Promise<string>;
  updateReceiptHeader: (id: string, data: { receipt_date?: string; receipt_code?: string }) => Promise<void>;
  upsertReceiptItem: (receiptId: string, orderId: string, orderItemId: string, qty: number) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
}

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  createEmptyReceipt: async (data) => {
    const id = await receiptRepo.createEmpty(data);
    await get().loadAllReceipts(useAppStore.getState().selectedProjectId || undefined);
    const orderStore = useOrderStore.getState();
    await orderStore.loadAllOrders(useAppStore.getState().selectedProjectId || undefined);
    if (orderStore.currentOrder?.order_id === data.order_id) {
      await orderStore.loadOrderDetail(data.order_id);
    }
    return id;
  },

  updateReceiptHeader: async (id, data) => {
    await receiptRepo.update(id, data);
    await get().loadAllReceipts(useAppStore.getState().selectedProjectId || undefined);
  },

  upsertReceiptItem: async (receiptId, orderId, orderItemId, qty) => {
    await receiptRepo.upsertItem(receiptId, orderItemId, qty);
    await get().loadAllReceipts(useAppStore.getState().selectedProjectId || undefined);

    // Sync Order Store
    const orderStore = useOrderStore.getState();
    await orderStore.loadAllOrders(useAppStore.getState().selectedProjectId || undefined);
    if (orderStore.currentOrder?.order_id === orderId) {
      await orderStore.loadOrderDetail(orderId);
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
}));
