import { create } from "zustand";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";
import { type ReceiptSummary, receiptRepo } from "@/db/repositories";

interface ReceiptStore {
  receipts: ReceiptSummary[];

  loadAllReceipts: (projectId?: string) => Promise<void>;

  createReceiptForOrder: (orderId: string, projectId?: string) => Promise<string>;
  updateReceiptHeader: (id: string, data: { receipt_date?: string; receipt_code?: string }) => Promise<void>;
  upsertReceiptItem: (receiptId: string, orderId: string, orderItemId: string, qty: number) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
}

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  receipts: [],

  loadAllReceipts: async (projectId) => {
    const d = await receiptRepo.findAllWithSummary({ project_id: projectId });
    set({ receipts: d });
  },

  createReceiptForOrder: async (orderId, projectId) => {
    const pId = projectId || useAppStore.getState().selectedProjectId || undefined;
    const id = await receiptRepo.createForOrder(orderId, pId);
    await get().loadAllReceipts(pId);
    const orderStore = useOrderStore.getState();
    if (orderStore.currentOrder?.order_id === orderId) {
      await orderStore.loadOrderDetail(orderId);
    }
    return id;
  },

  updateReceiptHeader: async (id, data) => {
    await receiptRepo.update(id, data);
    const pId = useAppStore.getState().selectedProjectId || undefined;
    await get().loadAllReceipts(pId);
  },

  upsertReceiptItem: async (receiptId, orderId, orderItemId, qty) => {
    await receiptRepo.upsertItem(receiptId, orderItemId, qty);
    const orderStore = useOrderStore.getState();
    if (orderStore.currentOrder?.order_id === orderId) {
      await orderStore.loadOrderDetail(orderId);
    }
  },

  deleteReceipt: async (id) => {
    const receipt = get().receipts.find((d) => d.receipt_id === id);
    await receiptRepo.delete(id);
    const pId = useAppStore.getState().selectedProjectId || undefined;
    await get().loadAllReceipts(pId);

    const orderStore = useOrderStore.getState();
    if (receipt && orderStore.currentOrder?.order_id === receipt.order_id) {
      await orderStore.loadOrderDetail(receipt.order_id);
    }
  },
}));
