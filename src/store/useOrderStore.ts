import { create } from "zustand";
import { useAppStore } from "@/store/useAppStore";
import { useReceiptStore } from "@/store/useReceiptStore";
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

  createOrderForProject: (projectId: string) => Promise<string>;
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

  createOrderForProject: async (projectId) => {
    const orderId = await orderRepo.createForProject(projectId);
    await get().loadAllOrders(projectId);
    return orderId;
  },

  updateOrderHeader: async (id, data) => {
    await orderRepo.update(id, data);
    const { currentOrder } = get();
    if (currentOrder?.order_id === id) {
      await get().loadOrderDetail(id);
    }
  },

  addOrderItem: async (orderId, item) => {
    const id = await orderRepo.createItem(orderId, item);
    await get().loadOrderDetail(orderId);
    return id;
  },

  updateOrderItem: async (orderId, orderItemId, item) => {
    await orderRepo.updateItem(orderItemId, item);
    await get().loadOrderDetail(orderId);
  },

  deleteOrderItem: async (orderId, orderItemId) => {
    await orderRepo.deleteItem(orderItemId);
    await get().loadOrderDetail(orderId);
  },

  deleteOrder: async (id) => {
    const { orders } = get();
    const order = orders.find((o) => o.order_id === id);
    const projectId = order?.project_id || useAppStore.getState().selectedProjectId || undefined;
    await orderRepo.delete(id);
    await get().loadAllOrders(projectId);
    await useReceiptStore.getState().loadAllReceipts(projectId);
  },
}));
