import { create } from "zustand";
import { useOrderStore } from "@/store/useOrderStore";
import { useAppStore } from "@/store/useAppStore";
import {
  type ReceiptSummary,
  type ReceiptItemDetail,
  type ReceiptItemInput,
  type OrderItemDetail,
  receiptRepo,
  orderRepo,
} from "@/db/repositories";

export interface ReceiptDetail {
  receipt_id: string;
  order_id: string;
  order_code?: string;
  receipt_date: string;
  receipt_code: string;
}

export type { ReceiptItemDetail };

interface ReceiptStore {
  receipts: ReceiptSummary[];
  currentReceipt: ReceiptDetail | null;
  currentItems: ReceiptItemDetail[];
  availableOrderItems: OrderItemDetail[];

  loadAllReceipts: (projectId?: string) => Promise<void>;
  loadReceiptDetail: (id: string) => Promise<void>;
  clearReceiptDetail: () => void;

  createReceiptForOrder: (orderId: string, projectId?: string) => Promise<string>;
  updateReceiptHeader: (id: string, data: { receipt_date?: string; receipt_code?: string }) => Promise<void>;
  addReceiptItem: (receiptId: string, item: ReceiptItemInput) => Promise<string>;
  updateReceiptItem: (receiptId: string, receiptItemId: string, item: ReceiptItemInput) => Promise<void>;
  deleteReceiptItem: (receiptId: string, receiptItemId: string) => Promise<void>;
  upsertReceiptItem: (
    receiptId: string,
    orderId: string,
    orderItemId: string,
    item_price_id: string,
    qty: number,
    has_tax?: boolean,
  ) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
}

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  receipts: [],
  currentReceipt: null,
  currentItems: [],
  availableOrderItems: [],

  clearReceiptDetail: () => {
    set({ currentReceipt: null, currentItems: [], availableOrderItems: [] });
  },

  loadAllReceipts: async (projectId) => {
    const receiptList = await receiptRepo.findAllWithSummary({ project_id: projectId });
    set({ receipts: receiptList });
  },

  loadReceiptDetail: async (id: string) => {
    const receipt = await receiptRepo.findById(id);
    if (!receipt) {
      set({ currentReceipt: null, currentItems: [], availableOrderItems: [] });
      return;
    }

    const [order, orderItems, items] = await Promise.all([
      orderRepo.findById(receipt.order_id),
      orderRepo.findItems(receipt.order_id),
      receiptRepo.findItems(id),
    ]);

    set({
      currentReceipt: {
        receipt_id: receipt.receipt_id,
        order_id: receipt.order_id,
        order_code: order?.order_code ?? undefined,
        receipt_date: receipt.receipt_date,
        receipt_code: receipt.receipt_code || "",
      },
      currentItems: items,
      availableOrderItems: orderItems,
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

  addReceiptItem: async (receiptId, item) => {
    const id = await receiptRepo.createItem(receiptId, item);
    await get().loadReceiptDetail(receiptId);
    const { currentReceipt } = get();
    if (currentReceipt?.order_id) {
      const orderStore = useOrderStore.getState();
      if (orderStore.currentOrder?.order_id === currentReceipt.order_id) {
        await orderStore.loadOrderDetail(currentReceipt.order_id);
      }
    }
    return id;
  },

  updateReceiptItem: async (receiptId, receiptItemId, item) => {
    await receiptRepo.updateItem(receiptItemId, item);
    await get().loadReceiptDetail(receiptId);
    const { currentReceipt } = get();
    if (currentReceipt?.order_id) {
      const orderStore = useOrderStore.getState();
      if (orderStore.currentOrder?.order_id === currentReceipt.order_id) {
        await orderStore.loadOrderDetail(currentReceipt.order_id);
      }
    }
  },

  deleteReceiptItem: async (receiptId, receiptItemId) => {
    await receiptRepo.deleteItem(receiptItemId);
    await get().loadReceiptDetail(receiptId);
    const { currentReceipt } = get();
    if (currentReceipt?.order_id) {
      const orderStore = useOrderStore.getState();
      if (orderStore.currentOrder?.order_id === currentReceipt.order_id) {
        await orderStore.loadOrderDetail(currentReceipt.order_id);
      }
    }
  },

  upsertReceiptItem: async (receiptId, orderId, orderItemId, item_price_id, qty, has_tax) => {
    await receiptRepo.upsertItem(receiptId, orderItemId, item_price_id, qty, has_tax);
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
