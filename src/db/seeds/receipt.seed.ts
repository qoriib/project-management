import { receiptRepo } from "@/db/repositories";
import { getDB } from "@/db/index";

interface SeedReceiptItemRaw {
  /** Order date to identify which Order */
  orderDate: string;
  /** Item name to find the order_item_id */
  itemName: string;
  qty: number;
}

interface SeedReceipt {
  /** Order date string to look up the Order */
  orderDate: string;
  receiptDate: string;
  items: SeedReceiptItemRaw[];
}

export async function seedReceipts(): Promise<void> {
  const db = await getDB(),
    // Load all Orders with their items to build lookup maps
    orderRows = await db.select<{ order_id: string; order_date: string }[]>(
      "SELECT order_id, order_date FROM orders WHERE deleted_at IS NULL",
    ),
    orderItemRows = await db.select<{ order_item_id: string; order_id: string; item_name: string }[]>(`
    SELECT oi.order_item_id, oi.order_id, i.item_name
    FROM order_items oi
    JOIN items i ON i.item_id = oi.item_id
  `),
    // Maps: order_date → order_id
    orderDateMap = new Map<string, string>(orderRows.map((r) => [r.order_date, r.order_id])),
    // Map: "order_id|item_name" → order_item_id
    orderItemMap = new Map<string, string>(orderItemRows.map((r) => [`${r.order_id}|${r.item_name}`, r.order_item_id])),
    receipts: SeedReceipt[] = [
      // Order 1: orderDate=2026-03-01
      {
        receiptDate: "2026-03-03",
        items: [
          { orderDate: "2026-03-01", itemName: "Sewa Excavator PC100", qty: 30 },
          { orderDate: "2026-03-01", itemName: "Tukang Batu / Pekerja", qty: 14 },
          { orderDate: "2026-03-01", itemName: "Mandor", qty: 14 },
          { orderDate: "2026-03-01", itemName: "Sewa Concrete Pump", qty: 2 },
        ],
        orderDate: "2026-03-01",
      },
      // Order 2: orderDate=2026-03-05
      {
        receiptDate: "2026-03-07",
        items: [
          { orderDate: "2026-03-05", itemName: "Semen Portland 50 Kg", qty: 100 },
          { orderDate: "2026-03-05", itemName: "Pasir Beton", qty: 15 },
          { orderDate: "2026-03-05", itemName: "Pasir Pasang", qty: 10 },
          { orderDate: "2026-03-05", itemName: "Semen Putih 40 Kg", qty: 10 },
        ],
        orderDate: "2026-03-05",
      },
      {
        receiptDate: "2026-03-14",
        items: [
          { orderDate: "2026-03-05", itemName: "Semen Portland 50 Kg", qty: 100 },
          { orderDate: "2026-03-05", itemName: "Pasir Pasang", qty: 10 },
          {
            orderDate: "2026-03-05",
            itemName: "Perekat Bata Ringan / Mortar 40 Kg",
            qty: 80,
          },
        ],
        orderDate: "2026-03-05",
      },
      {
        receiptDate: "2026-03-20",
        items: [{ orderDate: "2026-03-05", itemName: "Semen Portland 50 Kg", qty: 50 }],
        orderDate: "2026-03-05",
      },
      // Order 3: orderDate=2026-03-10
      {
        receiptDate: "2026-03-12",
        items: [
          { orderDate: "2026-03-10", itemName: "Batu Pecah / Split 1/2", qty: 10 },
          { orderDate: "2026-03-10", itemName: "Papan Cor 2/20 Meranti", qty: 50 },
          { orderDate: "2026-03-10", itemName: "Kaso 5/7 Meranti", qty: 100 },
        ],
        orderDate: "2026-03-10",
      },
      {
        receiptDate: "2026-03-18",
        items: [
          { orderDate: "2026-03-10", itemName: "Kaso 5/7 Meranti", qty: 100 },
          {
            orderDate: "2026-03-10",
            itemName: "Triplek / Multiplek 9mm",
            qty: 50,
          },
        ],
        orderDate: "2026-03-10",
      },
      // Order 4: orderDate=2026-03-12
      {
        receiptDate: "2026-03-15",
        items: [
          {
            orderDate: "2026-03-12",
            itemName: "Besi Beton Polos 8mm x 12m",
            qty: 100,
          },
          {
            orderDate: "2026-03-12",
            itemName: "Besi Beton Polos 10mm x 12m",
            qty: 150,
          },
          {
            orderDate: "2026-03-12",
            itemName: "Besi Beton Ulir 13mm x 12m",
            qty: 150,
          },
          { orderDate: "2026-03-12", itemName: "Kawat Bendrat", qty: 20 },
        ],
        orderDate: "2026-03-12",
      },
      // Order 5: orderDate=2026-04-05
      {
        receiptDate: "2026-04-10",
        items: [
          {
            orderDate: "2026-04-05",
            itemName: "Granit Tile 60x60 (Cream)",
            qty: 60,
          },
          { orderDate: "2026-04-05", itemName: "Keramik Dinding 30x60", qty: 40 },
          {
            orderDate: "2026-04-05",
            itemName: "Pipa PVC 4 inch tipe AW",
            qty: 10,
          },
          {
            orderDate: "2026-04-05",
            itemName: "Pipa PVC 1/2 inch tipe AW",
            qty: 25,
          },
          { orderDate: "2026-04-05", itemName: "Kabel NYM 3x2.5mm", qty: 5 },
          {
            orderDate: "2026-04-05",
            itemName: "Lampu Downlight LED 12W",
            qty: 20,
          },
        ],
        orderDate: "2026-04-05",
      },
      {
        receiptDate: "2026-04-12",
        items: [
          {
            orderDate: "2026-04-05",
            itemName: "Granit Tile 60x60 (Cream)",
            qty: 40,
          },
        ],
        orderDate: "2026-04-05",
      },
      // Order 6: orderDate=2026-04-15
      {
        receiptDate: "2026-04-18",
        items: [
          {
            orderDate: "2026-04-15",
            itemName: "Cat Tembok Interior 25kg (Pail)",
            qty: 15,
          },
          {
            orderDate: "2026-04-15",
            itemName: "Cat Tembok Eksterior 20L",
            qty: 10,
          },
        ],
        orderDate: "2026-04-15",
      },
      // Order 7: orderDate=2026-04-20
      {
        receiptDate: "2026-04-22",
        items: [
          { orderDate: "2026-04-20", itemName: "Tukang Batu / Pekerja", qty: 10 },
          {
            orderDate: "2026-04-20",
            itemName: "Triplek / Multiplek 12mm",
            qty: 80,
          },
        ],
        orderDate: "2026-04-20",
      },
      {
        receiptDate: "2026-05-02",
        items: [
          { orderDate: "2026-04-20", itemName: "Tukang Batu / Pekerja", qty: 10 },
          {
            orderDate: "2026-04-20",
            itemName: "Triplek / Multiplek 12mm",
            qty: 80,
          },
          {
            orderDate: "2026-04-20",
            itemName: "Cat Tembok Interior 25kg (Pail)",
            qty: 5,
          },
        ],
        orderDate: "2026-04-20",
      },
      // Order 8: orderDate=2026-04-25
      {
        receiptDate: "2026-04-28",
        items: [
          { orderDate: "2026-04-25", itemName: "Kabel NYM 3x2.5mm", qty: 12 }, // > 100% (ordered 10)
          {
            orderDate: "2026-04-25",
            itemName: "Lampu Downlight LED 12W",
            qty: 40,
          }, // < 100% (ordered 50)
        ],
        orderDate: "2026-04-25",
      },
      // Order 9: orderDate=2026-05-10
      {
        receiptDate: "2026-05-15",
        items: [
          { orderDate: "2026-05-10", itemName: "Sewa Excavator PC100", qty: 100 },
          { orderDate: "2026-05-10", itemName: "Pasir Pasang", qty: 50 },
        ],
        orderDate: "2026-05-10",
      },
      // Order 10: orderDate=2026-05-15
      {
        receiptDate: "2026-05-20",
        items: [
          {
            orderDate: "2026-05-15",
            itemName: "Besi Beton Ulir 16mm x 12m",
            qty: 200,
          },
        ],
        orderDate: "2026-05-15",
      },
      {
        receiptDate: "2026-05-25",
        items: [
          {
            orderDate: "2026-05-15",
            itemName: "Besi Beton Ulir 16mm x 12m",
            qty: 200,
          },
        ],
        orderDate: "2026-05-15",
      },
    ];

  for (const r of receipts) {
    const orderId = orderDateMap.get(r.orderDate);
    if (!orderId) {
      console.warn(`Could not find Order with date '${r.orderDate}'. Skipping receipt.`);
      continue;
    }

    const exists = await receiptRepo.exists(
      {
        receipt_date: r.receiptDate,
        order_id: orderId,
      },
      true,
    );

    if (!exists) {
      const resolvedItems: { order_item_id: string; qty: number }[] = [];

      for (const it of r.items) {
        const itemOrderId = orderDateMap.get(it.orderDate);
        if (!itemOrderId) {
          console.warn(`Could not find Order '${it.orderDate}' for item '${it.itemName}'. Skipping item.`);
          continue;
        }
        const orderItemId = orderItemMap.get(`${itemOrderId}|${it.itemName}`);
        if (!orderItemId) {
          console.warn(`Could not find order_item for Order '${it.orderDate}' + item '${it.itemName}'. Skipping item.`);
          continue;
        }
        resolvedItems.push({ order_item_id: orderItemId, qty: it.qty });
      }

      if (resolvedItems.length > 0) {
        const timestamp = new Date(r.receiptDate).getTime().toString().slice(-4),
          generatedCode = `NP/${timestamp}`;

        await receiptRepo.createWithItems(
          {
            receipt_code: generatedCode,
            receipt_date: r.receiptDate,
            order_id: orderId,
          },
          resolvedItems,
        );
      }
    }
  }
}

