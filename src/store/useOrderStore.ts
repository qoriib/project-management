import { create } from "zustand";
import {
  type ReceiptItemByOrder,
  type OrderItemDetail,
  type OrderItemInput,
  type OrderWithSummary,
  receiptRepo,
  orderRepo,
} from "@/db/repositories";
import { type RequirementReportItem, getRequirementReport } from "@/db/services";
import { useRequirementStore } from "@/store/useRequirementStore";

interface OrderStore {
  // ── States ─────────────────────────────────────────────────────────────────
  orders: OrderWithSummary[];
  currentOrder: OrderWithSummary | null;
  currentItems: OrderItemDetail[];
  currentReceiptItems: ReceiptItemByOrder[];
  currentRequirementData: RequirementReportItem[];

  // ── Load Actions ───────────────────────────────────────────────────────────
  loadAllOrders: (projectId?: string) => Promise<void>;
  loadOrderDetail: (id: string) => Promise<void>;
  loadRequirementReportForProject: (projectId: string) => Promise<void>;
  clearOrderDetail: () => void;

  // ── CRUD Wrappers ──────────────────────────────────────────────────────────
  createOrder: (data: { order_date: string; project_id: string; order_code: string }, items: OrderItemInput[]) => Promise<string>;
  updateOrder: (
    id: string,
    data: { order_date: string; project_id: string; order_code: string },
    items: OrderItemInput[],
  ) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  clearOrderDetail: () => {
    set({
      currentOrder: null,
      currentItems: [],
      currentReceiptItems: [],
      currentRequirementData: [],
    });
  },
  createOrder: async (data, items) => {
    const orderId = await orderRepo.createWithItems(data, items);
    await get().loadAllOrders(data.project_id);
    await useRequirementStore.getState().loadRequirements(data.project_id);
    return orderId;
  },
  currentRequirementData: [],
  currentReceiptItems: [],
  currentItems: [],
  currentOrder: null,
  deleteOrder: async (id) => {
    const { orders } = get();
    const order = orders.find((o) => o.order_id === id);
    await orderRepo.delete(id);
    if (order) {
      await get().loadAllOrders(order.project_id);
      await useRequirementStore.getState().loadRequirements(order.project_id);
    } else {
      await get().loadAllOrders();
    }
  },
  loadAllOrders: async (projectId) => {
    const o = await orderRepo.findAllWithSummary({
      project_id: projectId,
    });
    set({ orders: o });
  },
  loadRequirementReportForProject: async (projectId) => {
    const reqData = await getRequirementReport(projectId);
    set({ currentRequirementData: reqData });
  },
  loadOrderDetail: async (id) => {
    const o = await orderRepo.findByIdWithSummary(id);
    if (o) {
      const [items, recItems, reqData] = await Promise.all([
        orderRepo.findItems(id),
        receiptRepo.findItemsByOrder(id),
        getRequirementReport(o.project_id),
      ]);
      set({
        currentOrder: o,
        currentItems: items,
        currentReceiptItems: recItems,
        currentRequirementData: reqData,
      });
    } else {
      set({
        currentOrder: null,
        currentItems: [],
        currentReceiptItems: [],
        currentRequirementData: [],
      });
    }
  },
  orders: [],
  updateOrder: async (id, data, items) => {
    await orderRepo.updateWithItems(id, data, items);
    await get().loadAllOrders(data.project_id);
    // Reload detail if it's the currently viewed Order
    const { currentOrder } = get();
    if (currentOrder && currentOrder.order_id === id) {
      await get().loadOrderDetail(id);
    }
    await useRequirementStore.getState().loadRequirements(data.project_id);
  },
}));
