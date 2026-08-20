import { create } from "zustand";
import {
  type ReceiptItemByOrder,
  type OrderItemDetail,
  type OrderItemInput,
  type OrderWithSummary,
  receiptRepo,
  orderRepo,
} from "@/db/repositories";

interface OrderStore {
  // ── States ─────────────────────────────────────────────────────────────────
  orders: OrderWithSummary[];
  currentOrder: OrderWithSummary | null;
  currentItems: OrderItemDetail[];
  currentReceiptItems: ReceiptItemByOrder[];

  // ── Load Actions ───────────────────────────────────────────────────────────
  loadAllOrders: (projectId?: string) => Promise<void>;
  loadOrderDetail: (id: string) => Promise<void>;
  clearOrderDetail: () => void;

  // ── CRUD Wrappers ──────────────────────────────────────────────────────────
  createOrder: (
    data: { order_date: string; project_id: string; order_code: string; has_tax: number },
    items: OrderItemInput[],
  ) => Promise<string>;
  updateOrder: (
    id: string,
    data: { order_date: string; project_id: string; order_code: string; has_tax: number },
    items: OrderItemInput[],
  ) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  orders: [],
  currentOrder: null,
  currentItems: [],
  currentReceiptItems: [],

  clearOrderDetail: () => {
    set({ currentOrder: null, currentItems: [], currentReceiptItems: [] });
  },

  loadAllOrders: async (projectId) => {
    const o = await orderRepo.findAllWithSummary({ project_id: projectId });
    set({ orders: o });
  },

  loadOrderDetail: async (id) => {
    const o = await orderRepo.findByIdWithSummary(id);
    if (o) {
      const [items, recItems] = await Promise.all([orderRepo.findItems(id), receiptRepo.findItemsByOrder(id)]);
      set({ currentOrder: o, currentItems: items, currentReceiptItems: recItems });
    } else {
      set({ currentOrder: null, currentItems: [], currentReceiptItems: [] });
    }
  },

  createOrder: async (data, items) => {
    const orderId = await orderRepo.createWithItems(data, items);
    await get().loadAllOrders(data.project_id);
    return orderId;
  },

  updateOrder: async (id, data, items) => {
    await orderRepo.updateWithItems(id, data, items);
    await get().loadAllOrders(data.project_id);
    const { currentOrder } = get();
    if (currentOrder?.order_id === id) {
      await get().loadOrderDetail(id);
    }
  },

  deleteOrder: async (id) => {
    const { orders } = get();
    const order = orders.find((o) => o.order_id === id);
    await orderRepo.delete(id);
    await get().loadAllOrders(order?.project_id);
  },
}));
