import { purchaseOrderRepo } from "@/db/repositories";

interface SeedPOItem {
  item_id: number;
  item_price_id: number;
  vendor_id: number;
  qty: number;
}

interface SeedPO {
  project_id: number;
  po_date: string;
  items: SeedPOItem[];
}

export async function seedPurchaseOrders(): Promise<void> {
  const pos: SeedPO[] = [
    {
      project_id: 1,
      po_date: "2026-03-01",
      items: [
        { item_id: 26, item_price_id: 35, vendor_id: 6, qty: 40 },
        { item_id: 28, item_price_id: 38, vendor_id: 6, qty: 14 },
        { item_id: 29, item_price_id: 40, vendor_id: 6, qty: 14 },
        { item_id: 27, item_price_id: 37, vendor_id: 6, qty: 2 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-03-05",
      items: [
        { item_id: 1, item_price_id: 1, vendor_id: 1, qty: 300 },
        { item_id: 5, item_price_id: 8, vendor_id: 3, qty: 15 },
        { item_id: 4, item_price_id: 6, vendor_id: 3, qty: 20 },
        { item_id: 3, item_price_id: 4, vendor_id: 1, qty: 80 },
        { item_id: 2, item_price_id: 3, vendor_id: 1, qty: 10 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-03-10",
      items: [
        { item_id: 6, item_price_id: 9, vendor_id: 3, qty: 15 },
        { item_id: 16, item_price_id: 23, vendor_id: 7, qty: 50 },
        { item_id: 15, item_price_id: 22, vendor_id: 7, qty: 200 },
        { item_id: 13, item_price_id: 19, vendor_id: 7, qty: 50 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-03-12",
      items: [
        { item_id: 8, item_price_id: 11, vendor_id: 2, qty: 100 },
        { item_id: 9, item_price_id: 13, vendor_id: 2, qty: 150 },
        { item_id: 10, item_price_id: 15, vendor_id: 2, qty: 150 },
        { item_id: 12, item_price_id: 18, vendor_id: 2, qty: 20 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-04-05",
      items: [
        { item_id: 24, item_price_id: 32, vendor_id: 5, qty: 120 },
        { item_id: 25, item_price_id: 34, vendor_id: 5, qty: 40 },
        { item_id: 20, item_price_id: 28, vendor_id: 1, qty: 10 },
        { item_id: 21, item_price_id: 29, vendor_id: 1, qty: 25 },
        { item_id: 22, item_price_id: 30, vendor_id: 1, qty: 5 },
        { item_id: 23, item_price_id: 31, vendor_id: 1, qty: 30 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-04-15",
      items: [
        { item_id: 17, item_price_id: 24, vendor_id: 4, qty: 15 },
        { item_id: 18, item_price_id: 26, vendor_id: 4, qty: 10 },
        { item_id: 19, item_price_id: 27, vendor_id: 4, qty: 5 }
      ]
    },
    {
      project_id: 2,
      po_date: "2026-04-20",
      items: [
        { item_id: 28, item_price_id: 38, vendor_id: 6, qty: 20 },
        { item_id: 14, item_price_id: 20, vendor_id: 1, qty: 160 },
        { item_id: 17, item_price_id: 24, vendor_id: 4, qty: 5 }
      ]
    },
    {
      project_id: 2,
      po_date: "2026-04-25",
      items: [
        { item_id: 22, item_price_id: 30, vendor_id: 1, qty: 10 },
        { item_id: 23, item_price_id: 31, vendor_id: 1, qty: 50 }
      ]
    },
    {
      project_id: 3,
      po_date: "2026-05-10",
      items: [
        { item_id: 26, item_price_id: 36, vendor_id: 6, qty: 100 },
        { item_id: 27, item_price_id: 37, vendor_id: 6, qty: 5 },
        { item_id: 4, item_price_id: 6, vendor_id: 3, qty: 50 }
      ]
    },
    {
      project_id: 3,
      po_date: "2026-05-15",
      items: [
        { item_id: 11, item_price_id: 17, vendor_id: 2, qty: 400 }
      ]
    }
  ];

  for (const po of pos) {
    const exists = await purchaseOrderRepo.exists({
      project_id: po.project_id,
      po_date: po.po_date
    }, true);
    if (!exists) {
      await purchaseOrderRepo.createWithItems(
        { project_id: po.project_id, po_date: po.po_date },
        po.items
      );
    }
  }
}
