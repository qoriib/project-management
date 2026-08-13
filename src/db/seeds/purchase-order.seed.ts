import { purchaseOrderRepo } from "@/db/repositories";

interface SeedPOItem {
  item_id: number;
  price: number;
  qty: number;
}

interface SeedPO {
  project_id: number;
  po_date: string;
  vendor_id: number;
  items: SeedPOItem[];
}

export async function seedPurchaseOrders(): Promise<void> {
  const pos: SeedPO[] = [
    {
      project_id: 1,
      po_date: "2026-03-01",
      vendor_id: 6,
      items: [
        { item_id: 26, price: 180000, qty: 40 },
        { item_id: 28, price: 150000, qty: 14 },
        { item_id: 29, price: 250000, qty: 14 },
        { item_id: 27, price: 4500000, qty: 2 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-03-05",
      vendor_id: 1,
      items: [
        { item_id: 1, price: 76000, qty: 300 },
        { item_id: 5, price: 290000, qty: 15 },
        { item_id: 4, price: 240000, qty: 20 },
        { item_id: 3, price: 92000, qty: 80 },
        { item_id: 2, price: 85000, qty: 10 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-03-10",
      vendor_id: 3,
      items: [
        { item_id: 6, price: 345000, qty: 15 },
        { item_id: 16, price: 25000, qty: 50 },
        { item_id: 15, price: 35000, qty: 200 },
        { item_id: 13, price: 110000, qty: 50 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-03-12",
      vendor_id: 2,
      items: [
        { item_id: 8, price: 44000, qty: 100 },
        { item_id: 9, price: 71000, qty: 150 },
        { item_id: 10, price: 116000, qty: 150 },
        { item_id: 12, price: 22000, qty: 20 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-04-05",
      vendor_id: 5,
      items: [
        { item_id: 24, price: 185000, qty: 120 },
        { item_id: 25, price: 95000, qty: 40 },
        { item_id: 20, price: 150000, qty: 10 },
        { item_id: 21, price: 35000, qty: 25 },
        { item_id: 22, price: 650000, qty: 5 },
        { item_id: 23, price: 55000, qty: 30 }
      ]
    },
    {
      project_id: 1,
      po_date: "2026-04-15",
      vendor_id: 4,
      items: [
        { item_id: 17, price: 850000, qty: 15 },
        { item_id: 18, price: 1250000, qty: 10 },
        { item_id: 19, price: 750000, qty: 5 }
      ]
    },
    {
      project_id: 2,
      po_date: "2026-04-20",
      vendor_id: 6,
      items: [
        { item_id: 28, price: 150000, qty: 20 },
        { item_id: 14, price: 145000, qty: 160 },
        { item_id: 17, price: 850000, qty: 5 }
      ]
    },
    {
      project_id: 2,
      po_date: "2026-04-25",
      vendor_id: 1,
      items: [
        { item_id: 22, price: 650000, qty: 10 },
        { item_id: 23, price: 55000, qty: 50 }
      ]
    },
    {
      project_id: 3,
      po_date: "2026-05-10",
      vendor_id: 6,
      items: [
        { item_id: 26, price: 200000, qty: 100 },
        { item_id: 27, price: 4500000, qty: 5 },
        { item_id: 4, price: 250000, qty: 50 }
      ]
    },
    {
      project_id: 3,
      po_date: "2026-05-15",
      vendor_id: 2,
      items: [
        { item_id: 11, price: 165000, qty: 400 }
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
        po.items.map(it => ({ ...it, vendor_id: po.vendor_id }))
      );
    }
  }
}
