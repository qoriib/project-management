import { deliveryRepo } from "@/db/repositories";

interface SeedDeliveryItem {
  poItemId: number;
  qty: number;
}

interface SeedDelivery {
  poId: number;
  deliveryDate: string;
  items: SeedDeliveryItem[];
}

export async function seedDeliveries(): Promise<void> {
  const deliveries: SeedDelivery[] = [
    {
      poId: 1,
      deliveryDate: "2026-03-03",
      items: [
        { poItemId: 1, qty: 30 },
        { poItemId: 2, qty: 14 },
        { poItemId: 3, qty: 14 },
        { poItemId: 4, qty: 2 }
      ]
    },
    {
      poId: 2,
      deliveryDate: "2026-03-07",
      items: [
        { poItemId: 5, qty: 100 },
        { poItemId: 6, qty: 15 },
        { poItemId: 7, qty: 10 },
        { poItemId: 9, qty: 10 }
      ]
    },
    {
      poId: 2,
      deliveryDate: "2026-03-14",
      items: [
        { poItemId: 5, qty: 100 },
        { poItemId: 7, qty: 10 },
        { poItemId: 8, qty: 80 }
      ]
    },
    {
      poId: 2,
      deliveryDate: "2026-03-20",
      items: [
        { poItemId: 5, qty: 50 }
      ]
    },
    {
      poId: 3,
      deliveryDate: "2026-03-12",
      items: [
        { poItemId: 10, qty: 10 },
        { poItemId: 11, qty: 50 },
        { poItemId: 12, qty: 100 }
      ]
    },
    {
      poId: 3,
      deliveryDate: "2026-03-18",
      items: [
        { poItemId: 12, qty: 100 },
        { poItemId: 13, qty: 50 }
      ]
    },
    {
      poId: 4,
      deliveryDate: "2026-03-15",
      items: [
        { poItemId: 14, qty: 100 },
        { poItemId: 15, qty: 150 },
        { poItemId: 16, qty: 150 },
        { poItemId: 17, qty: 20 }
      ]
    },
    {
      poId: 5,
      deliveryDate: "2026-04-10",
      items: [
        { poItemId: 18, qty: 60 },
        { poItemId: 19, qty: 40 },
        { poItemId: 20, qty: 10 },
        { poItemId: 21, qty: 25 },
        { poItemId: 22, qty: 5 },
        { poItemId: 23, qty: 20 }
      ]
    },
    {
      poId: 5,
      deliveryDate: "2026-04-12",
      items: [
        { poItemId: 18, qty: 40 }
      ]
    },
    {
      poId: 6,
      deliveryDate: "2026-04-18",
      items: [
        { poItemId: 24, qty: 15 },
        { poItemId: 25, qty: 10 }
      ]
    },
    {
      poId: 7,
      deliveryDate: "2026-04-22",
      items: [
        { poItemId: 27, qty: 10 },
        { poItemId: 28, qty: 80 }
      ]
    },
    {
      poId: 7,
      deliveryDate: "2026-05-02",
      items: [
        { poItemId: 27, qty: 10 },
        { poItemId: 28, qty: 80 },
        { poItemId: 29, qty: 5 }
      ]
    },
    {
      poId: 8,
      deliveryDate: "2026-04-28",
      items: [
        { poItemId: 30, qty: 12 }, // > 100% (ordered 10)
        { poItemId: 31, qty: 40 }  // < 100% (ordered 50)
      ]
    },
    {
      poId: 9,
      deliveryDate: "2026-05-15",
      items: [
        { poItemId: 32, qty: 100 },
        { poItemId: 34, qty: 50 }
      ]
    },
    {
      poId: 10,
      deliveryDate: "2026-05-20",
      items: [
        { poItemId: 35, qty: 200 }
      ]
    },
    {
      poId: 10,
      deliveryDate: "2026-05-25",
      items: [
        { poItemId: 35, qty: 200 }
      ]
    }
  ];

  for (const d of deliveries) {
    const exists = await deliveryRepo.exists({
      po_id: d.poId,
      delivery_date: d.deliveryDate
    }, true);
    if (!exists) {
      await deliveryRepo.createWithItems(
        { po_id: d.poId, delivery_date: d.deliveryDate },
        d.items.map(it => ({ po_item_id: it.poItemId, qty: it.qty }))
      );
    }
  }
}
