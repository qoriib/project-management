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
  orders: OrderWithSummary[];
  currentOrder: OrderWithSummary | null;
  currentItems: OrderItemDetail[];
  currentReceiptItems: ReceiptItemByOrder[];

  loadAllOrders: (projectId?: string) => Promise<void>;
  loadOrderDetail: (id: string) => Promise<void>;
  clearOrderDetail: () => void;

  createEmptyOrder: (data: { order_date: string; project_id: string; order_code: string }) => Promise<string>;
  updateOrderHeader: (id: string, data: { order_date?: string; order_code?: string }) => Promise<void>;
  addOrderItem: (orderId: string, item: Omit<OrderItemInput, "order_item_id">) => Promise<string>;
  updateOrderItem: (orderId: string, orderItemId: string, item: OrderItemInput) => Promise<void>;
  deleteOrderItem: (orderId: string, orderItemId: string) => Promise<void>;
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

  createEmptyOrder: async (data) => {
    const orderId = await orderRepo.create(data);
    await get().loadAllOrders(data.project_id);
    return orderId;
  },

  updateOrderHeader: async (id, data) => {
    await orderRepo.update(id, data);
    const { currentOrder } = get();
    if (currentOrder?.order_id === id) {
      await get().loadOrderDetail(id);
    }
    if (currentOrder?.project_id) {
      await get().loadAllOrders(currentOrder.project_id);
    }
  },

  addOrderItem: async (orderId, item) => {
    const id = await orderRepo.createItem(orderId, item);
    await get().loadOrderDetail(orderId);
    const { currentOrder } = get();
    if (currentOrder?.project_id) {
      await get().loadAllOrders(currentOrder.project_id);
    }
    return id;
  },

  updateOrderItem: async (orderId, orderItemId, item) => {
    await orderRepo.updateItem(orderItemId, item);
    await get().loadOrderDetail(orderId);
    const { currentOrder } = get();
    if (currentOrder?.project_id) {
      await get().loadAllOrders(currentOrder.project_id);
    }
  },

  deleteOrderItem: async (orderId, orderItemId) => {
    await orderRepo.deleteItem(orderItemId);
    await get().loadOrderDetail(orderId);
    const { currentOrder } = get();
    if (currentOrder?.project_id) {
      await get().loadAllOrders(currentOrder.project_id);
    }
  },

  deleteOrder: async (id) => {
    const { orders } = get();
    const order = orders.find((o) => o.order_id === id);
    await orderRepo.delete(id);
    await get().loadAllOrders(order?.project_id);
  },
}));
