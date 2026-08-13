import { deliveryRepo } from "@/db/repositories";

interface SeedDeliveryItem {
  po_item_id: number;
  qty: number;
}

interface SeedDelivery {
  po_id: number;
  delivery_date: string;
  items: SeedDeliveryItem[];
}

export async function seedDeliveries(): Promise<void> {
  const deliveries: SeedDelivery[] = [
    {
      po_id: 1,
      delivery_date: "2026-03-03",
      items: [
        { po_item_id: 1, qty: 30 },
        { po_item_id: 2, qty: 14 },
        { po_item_id: 3, qty: 14 },
        { po_item_id: 4, qty: 2 }
      ]
    },
    {
      po_id: 2,
      delivery_date: "2026-03-07",
      items: [
        { po_item_id: 5, qty: 100 },
        { po_item_id: 6, qty: 15 },
        { po_item_id: 7, qty: 10 },
        { po_item_id: 9, qty: 10 }
      ]
    },
    {
      po_id: 2,
      delivery_date: "2026-03-14",
      items: [
        { po_item_id: 5, qty: 100 },
        { po_item_id: 7, qty: 10 },
        { po_item_id: 8, qty: 80 }
      ]
    },
    {
      po_id: 2,
      delivery_date: "2026-03-20",
      items: [
        { po_item_id: 5, qty: 50 }
      ]
    },
    {
      po_id: 3,
      delivery_date: "2026-03-12",
      items: [
        { po_item_id: 10, qty: 10 },
        { po_item_id: 11, qty: 50 },
        { po_item_id: 12, qty: 100 }
      ]
    },
    {
      po_id: 3,
      delivery_date: "2026-03-18",
      items: [
        { po_item_id: 12, qty: 100 },
        { po_item_id: 13, qty: 50 }
      ]
    },
    {
      po_id: 4,
      delivery_date: "2026-03-15",
      items: [
        { po_item_id: 14, qty: 100 },
        { po_item_id: 15, qty: 150 },
        { po_item_id: 16, qty: 150 },
        { po_item_id: 17, qty: 20 }
      ]
    },
    {
      po_id: 5,
      delivery_date: "2026-04-10",
      items: [
        { po_item_id: 18, qty: 60 },
        { po_item_id: 19, qty: 40 },
        { po_item_id: 20, qty: 10 },
        { po_item_id: 21, qty: 25 },
        { po_item_id: 22, qty: 5 },
        { po_item_id: 23, qty: 20 }
      ]
    },
    {
      po_id: 5,
      delivery_date: "2026-04-12",
      items: [
        { po_item_id: 18, qty: 40 }
      ]
    },
    {
      po_id: 6,
      delivery_date: "2026-04-18",
      items: [
        { po_item_id: 24, qty: 15 },
        { po_item_id: 25, qty: 10 }
      ]
    },
    {
      po_id: 7,
      delivery_date: "2026-04-22",
      items: [
        { po_item_id: 27, qty: 10 },
        { po_item_id: 28, qty: 80 }
      ]
    },
    {
      po_id: 7,
      delivery_date: "2026-05-02",
      items: [
        { po_item_id: 27, qty: 10 },
        { po_item_id: 28, qty: 80 },
        { po_item_id: 29, qty: 5 }
      ]
    },
    {
      po_id: 8,
      delivery_date: "2026-04-28",
      items: [
        { po_item_id: 30, qty: 10 },
        { po_item_id: 31, qty: 50 }
      ]
    },
    {
      po_id: 9,
      delivery_date: "2026-05-15",
      items: [
        { po_item_id: 32, qty: 100 },
        { po_item_id: 34, qty: 50 }
      ]
    },
    {
      po_id: 10,
      delivery_date: "2026-05-20",
      items: [
        { po_item_id: 35, qty: 200 }
      ]
    },
    {
      po_id: 10,
      delivery_date: "2026-05-25",
      items: [
        { po_item_id: 35, qty: 200 }
      ]
    }
  ];

  for (const d of deliveries) {
    const exists = await deliveryRepo.exists({
      po_id: d.po_id,
      delivery_date: d.delivery_date
    }, true);
    if (!exists) {
      await deliveryRepo.createWithItems(
        { po_id: d.po_id, delivery_date: d.delivery_date },
        d.items
      );
    }
  }
}
