import { create } from "zustand";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";
import { type ReceiptSummary, receiptRepo, orderRepo } from "@/db/repositories";

export interface ReceiptDetail {
  receipt_id: string;
  order_id: string;
  order_code?: string;
  receipt_date: string;
  receipt_code: string;
}

export interface ReceiptItemDetail extends Record<string, unknown> {
  order_item_id: string;
  item_id: string | null;
  item_name: string;
  category_prefix?: string | null;
  category_code?: string | null;
  item_code?: string | null;
  price?: number;
  item_price_id?: string | null;
  unit: string;
  remaining: number;
  qty: string | number;
  ordered: number;
  delivered: number;
}

interface ReceiptStore {
  receipts: ReceiptSummary[];
  currentReceipt: ReceiptDetail | null;
  currentItems: ReceiptItemDetail[];

  loadAllReceipts: (projectId?: string) => Promise<void>;
  loadReceiptDetail: (id: string) => Promise<void>;
  clearReceiptDetail: () => void;

  createReceiptForOrder: (orderId: string, projectId?: string) => Promise<string>;
  updateReceiptHeader: (id: string, data: { receipt_date?: string; receipt_code?: string }) => Promise<void>;
  upsertReceiptItem: (receiptId: string, orderId: string, orderItemId: string, qty: number) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
}

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  receipts: [],
  currentReceipt: null,
  currentItems: [],

  clearReceiptDetail: () => {
    set({ currentReceipt: null, currentItems: [] });
  },

  loadAllReceipts: async (projectId) => {
    const receiptList = await receiptRepo.findAllWithSummary({ project_id: projectId });
    set({ receipts: receiptList });
  },

  loadReceiptDetail: async (id: string) => {
    const receipt = await receiptRepo.findById(id);
    if (!receipt) {
      set({ currentReceipt: null, currentItems: [] });
      return;
    }

    const [order, orderItems, delivItems] = await Promise.all([
      orderRepo.findById(receipt.order_id),
      orderRepo.findItems(receipt.order_id),
      receiptRepo.findItems(id),
    ]);

    const items: ReceiptItemDetail[] = orderItems.map((item) => {
      const existingDelivItem = delivItems.find((delivItem) => delivItem.order_item_id === item.order_item_id);
      const oldQty = existingDelivItem?.qty ?? 0;
      const originalSisa = item.remaining ?? 0;
      const restoredSisa = originalSisa + oldQty;
      const originalDelivered = (item.total_delivered ?? 0) - oldQty;

      return {
        delivered: originalDelivered,
        item_id: item.item_id,
        item_name: item.item_name ?? "",
        category_prefix: item.category_prefix,
        category_code: item.category_code,
        item_code: item.item_code,
        price: item.price,
        item_price_id: item.item_price_id,
        ordered: item.qty ?? 0,
        order_item_id: item.order_item_id,
        remaining: restoredSisa,
        qty: oldQty,
        unit: item.unit ?? "",
      };
    });

    set({
      currentReceipt: {
        receipt_id: receipt.receipt_id,
        order_id: receipt.order_id,
        order_code: order?.order_code ?? undefined,
        receipt_date: receipt.receipt_date,
        receipt_code: receipt.receipt_code || "",
      },
      currentItems: items,
    });
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
    if (get().currentReceipt?.receipt_id === id) {
      set((state) => ({
        currentReceipt: state.currentReceipt ? { ...state.currentReceipt, ...data } : null,
      }));
    }
  },

  upsertReceiptItem: async (receiptId, orderId, orderItemId, qty) => {
    await receiptRepo.upsertItem(receiptId, orderItemId, qty);
    const orderStore = useOrderStore.getState();
    if (orderStore.currentOrder?.order_id === orderId) {
      await orderStore.loadOrderDetail(orderId);
    }
  },

  deleteReceipt: async (id) => {
    const receipt = get().receipts.find((item) => item.receipt_id === id);
    await receiptRepo.delete(id);
    const projectId = useAppStore.getState().selectedProjectId || undefined;
    await get().loadAllReceipts(projectId);

    const orderStore = useOrderStore.getState();
    if (receipt && orderStore.currentOrder?.order_id === receipt.order_id) {
      await orderStore.loadOrderDetail(receipt.order_id);
    }
  },
}));
