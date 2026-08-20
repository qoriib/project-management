import { deliveryRepo } from "@/db/repositories";
import { getDB } from "@/db/index";

interface SeedDeliveryItemRaw {
  /** PO date to identify which PO */
  poDate: string;
  /** Item name to find the po_item_id */
  itemName: string;
  qty: number;
}

interface SeedDelivery {
  /** PO date string to look up the PO */
  poDate: string;
  deliveryDate: string;
  items: SeedDeliveryItemRaw[];
}

export async function seedDeliveries(): Promise<void> {
  const db = await getDB(),
    // Load all POs with their items to build lookup maps
    poRows = await db.select<{ po_id: string; po_date: string }[]>(
      "SELECT po_id, po_date FROM purchase_orders WHERE deleted_at IS NULL",
    ),
    poItemRows = await db.select<
      { po_item_id: string; po_id: string; item_name: string }[]
    >(`
    SELECT poi.po_item_id, poi.po_id, i.item_name
    FROM po_items poi
    JOIN items i ON i.item_id = poi.item_id
  `),
    // Maps: po_date → po_id
    poDateMap = new Map<string, string>(
      poRows.map((r) => [r.po_date, r.po_id]),
    ),
    // Map: "po_id|item_name" → po_item_id
    poItemMap = new Map<string, string>(
      poItemRows.map((r) => [`${r.po_id}|${r.item_name}`, r.po_item_id]),
    ),
    deliveries: SeedDelivery[] = [
      // PO 1: poDate=2026-03-01
      {
        deliveryDate: "2026-03-03",
        items: [
          { poDate: "2026-03-01", itemName: "Sewa Excavator PC100", qty: 30 },
          { poDate: "2026-03-01", itemName: "Tukang Batu / Pekerja", qty: 14 },
          { poDate: "2026-03-01", itemName: "Mandor", qty: 14 },
          { poDate: "2026-03-01", itemName: "Sewa Concrete Pump", qty: 2 },
        ],
        poDate: "2026-03-01",
      },
      // PO 2: poDate=2026-03-05
      {
        deliveryDate: "2026-03-07",
        items: [
          { poDate: "2026-03-05", itemName: "Semen Portland 50 Kg", qty: 100 },
          { poDate: "2026-03-05", itemName: "Pasir Beton", qty: 15 },
          { poDate: "2026-03-05", itemName: "Pasir Pasang", qty: 10 },
          { poDate: "2026-03-05", itemName: "Semen Putih 40 Kg", qty: 10 },
        ],
        poDate: "2026-03-05",
      },
      {
        deliveryDate: "2026-03-14",
        items: [
          { poDate: "2026-03-05", itemName: "Semen Portland 50 Kg", qty: 100 },
          { poDate: "2026-03-05", itemName: "Pasir Pasang", qty: 10 },
          {
            poDate: "2026-03-05",
            itemName: "Perekat Bata Ringan / Mortar 40 Kg",
            qty: 80,
          },
        ],
        poDate: "2026-03-05",
      },
      {
        deliveryDate: "2026-03-20",
        items: [
          { poDate: "2026-03-05", itemName: "Semen Portland 50 Kg", qty: 50 },
        ],
        poDate: "2026-03-05",
      },
      // PO 3: poDate=2026-03-10
      {
        deliveryDate: "2026-03-12",
        items: [
          { poDate: "2026-03-10", itemName: "Batu Pecah / Split 1/2", qty: 10 },
          { poDate: "2026-03-10", itemName: "Papan Cor 2/20 Meranti", qty: 50 },
          { poDate: "2026-03-10", itemName: "Kaso 5/7 Meranti", qty: 100 },
        ],
        poDate: "2026-03-10",
      },
      {
        deliveryDate: "2026-03-18",
        items: [
          { poDate: "2026-03-10", itemName: "Kaso 5/7 Meranti", qty: 100 },
          {
            poDate: "2026-03-10",
            itemName: "Triplek / Multiplek 9mm",
            qty: 50,
          },
        ],
        poDate: "2026-03-10",
      },
      // PO 4: poDate=2026-03-12
      {
        deliveryDate: "2026-03-15",
        items: [
          {
            poDate: "2026-03-12",
            itemName: "Besi Beton Polos 8mm x 12m",
            qty: 100,
          },
          {
            poDate: "2026-03-12",
            itemName: "Besi Beton Polos 10mm x 12m",
            qty: 150,
          },
          {
            poDate: "2026-03-12",
            itemName: "Besi Beton Ulir 13mm x 12m",
            qty: 150,
          },
          { poDate: "2026-03-12", itemName: "Kawat Bendrat", qty: 20 },
        ],
        poDate: "2026-03-12",
      },
      // PO 5: poDate=2026-04-05
      {
        deliveryDate: "2026-04-10",
        items: [
          {
            poDate: "2026-04-05",
            itemName: "Granit Tile 60x60 (Cream)",
            qty: 60,
          },
          { poDate: "2026-04-05", itemName: "Keramik Dinding 30x60", qty: 40 },
          {
            poDate: "2026-04-05",
            itemName: "Pipa PVC 4 inch tipe AW",
            qty: 10,
          },
          {
            poDate: "2026-04-05",
            itemName: "Pipa PVC 1/2 inch tipe AW",
            qty: 25,
          },
          { poDate: "2026-04-05", itemName: "Kabel NYM 3x2.5mm", qty: 5 },
          {
            poDate: "2026-04-05",
            itemName: "Lampu Downlight LED 12W",
            qty: 20,
          },
        ],
        poDate: "2026-04-05",
      },
      {
        deliveryDate: "2026-04-12",
        items: [
          {
            poDate: "2026-04-05",
            itemName: "Granit Tile 60x60 (Cream)",
            qty: 40,
          },
        ],
        poDate: "2026-04-05",
      },
      // PO 6: poDate=2026-04-15
      {
        deliveryDate: "2026-04-18",
        items: [
          {
            poDate: "2026-04-15",
            itemName: "Cat Tembok Interior 25kg (Pail)",
            qty: 15,
          },
          {
            poDate: "2026-04-15",
            itemName: "Cat Tembok Eksterior 20L",
            qty: 10,
          },
        ],
        poDate: "2026-04-15",
      },
      // PO 7: poDate=2026-04-20
      {
        deliveryDate: "2026-04-22",
        items: [
          { poDate: "2026-04-20", itemName: "Tukang Batu / Pekerja", qty: 10 },
          {
            poDate: "2026-04-20",
            itemName: "Triplek / Multiplek 12mm",
            qty: 80,
          },
        ],
        poDate: "2026-04-20",
      },
      {
        deliveryDate: "2026-05-02",
        items: [
          { poDate: "2026-04-20", itemName: "Tukang Batu / Pekerja", qty: 10 },
          {
            poDate: "2026-04-20",
            itemName: "Triplek / Multiplek 12mm",
            qty: 80,
          },
          {
            poDate: "2026-04-20",
            itemName: "Cat Tembok Interior 25kg (Pail)",
            qty: 5,
          },
        ],
        poDate: "2026-04-20",
      },
      // PO 8: poDate=2026-04-25
      {
        deliveryDate: "2026-04-28",
        items: [
          { poDate: "2026-04-25", itemName: "Kabel NYM 3x2.5mm", qty: 12 }, // > 100% (ordered 10)
          {
            poDate: "2026-04-25",
            itemName: "Lampu Downlight LED 12W",
            qty: 40,
          }, // < 100% (ordered 50)
        ],
        poDate: "2026-04-25",
      },
      // PO 9: poDate=2026-05-10
      {
        deliveryDate: "2026-05-15",
        items: [
          { poDate: "2026-05-10", itemName: "Sewa Excavator PC100", qty: 100 },
          { poDate: "2026-05-10", itemName: "Pasir Pasang", qty: 50 },
        ],
        poDate: "2026-05-10",
      },
      // PO 10: poDate=2026-05-15
      {
        deliveryDate: "2026-05-20",
        items: [
          {
            poDate: "2026-05-15",
            itemName: "Besi Beton Ulir 16mm x 12m",
            qty: 200,
          },
        ],
        poDate: "2026-05-15",
      },
      {
        deliveryDate: "2026-05-25",
        items: [
          {
            poDate: "2026-05-15",
            itemName: "Besi Beton Ulir 16mm x 12m",
            qty: 200,
          },
        ],
        poDate: "2026-05-15",
      },
    ];

  for (const d of deliveries) {
    const poId = poDateMap.get(d.poDate);
    if (!poId) {
      console.warn(
        `Could not find PO with date '${d.poDate}'. Skipping delivery.`,
      );
      continue;
    }

    const exists = await deliveryRepo.exists(
      {
        delivery_date: d.deliveryDate,
        po_id: poId,
      },
      true,
    );

    if (!exists) {
      const resolvedItems: { po_item_id: string; qty: number }[] = [];

      for (const it of d.items) {
        const itemPoId = poDateMap.get(it.poDate);
        if (!itemPoId) {
          console.warn(
            `Could not find PO '${it.poDate}' for item '${it.itemName}'. Skipping item.`,
          );
          continue;
        }
        const poItemId = poItemMap.get(`${itemPoId}|${it.itemName}`);
        if (!poItemId) {
          console.warn(
            `Could not find po_item for PO '${it.poDate}' + item '${it.itemName}'. Skipping item.`,
          );
          continue;
        }
        resolvedItems.push({ po_item_id: poItemId, qty: it.qty });
      }

      if (resolvedItems.length > 0) {
        const timestamp = new Date(d.deliveryDate)
            .getTime()
            .toString()
            .slice(-4),
          generatedCode = `NP/${timestamp}`;

        await deliveryRepo.createWithItems(
          {
            delivery_code: generatedCode,
            delivery_date: d.deliveryDate,
            po_id: poId,
          },
          resolvedItems,
        );
      }
    }
  }
}
