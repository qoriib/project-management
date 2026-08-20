import { receiptRepo } from "@/db/repositories";
import { getDB } from "@/db/index";

interface SeedReceiptItemRaw {
  itemName: string;
  qty: number;
}

interface SeedReceipt {
  projectName: string;
  orderDate: string;
  receiptDate: string;
  items: SeedReceiptItemRaw[];
}

export async function seedReceipts(): Promise<void> {
  const db = await getDB();
  const orderRows = await db.select<{ order_id: string; order_date: string; project_name: string }[]>(`
    SELECT o.order_id, o.order_date, p.project_name
    FROM orders o
    JOIN projects p ON p.project_id = o.project_id
    WHERE o.deleted_at IS NULL
  `);

  const orderItemRows = await db.select<{ order_item_id: string; order_id: string; item_name: string }[]>(`
    SELECT oi.order_item_id, oi.order_id, i.item_name
    FROM order_items oi
    JOIN items i ON i.item_id = oi.item_id
  `);

  const orderMap = new Map<string, string>(orderRows.map((r) => [`${r.project_name}|${r.order_date}`, r.order_id]));

  const orderItemMap = new Map<string, string>(
    orderItemRows.map((r) => [`${r.order_id}|${r.item_name}`, r.order_item_id]),
  );

  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi";
  const p2 = "Renovasi Interior Kantor PT. xyz";
  const p3 = "Pembangunan Gudang Logistik Cikarang";

  const receipts: SeedReceipt[] = [
    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 1: Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi
    // ═════════════════════════════════════════════════════════════════════════
    // Order 1 (2026-03-01): Sewa Alat & Tenaga Kerja (Penerimaan Bertahap & Lengkap 100%)
    {
      projectName: p1,
      orderDate: "2026-03-01",
      receiptDate: "2026-03-03",
      items: [
        { itemName: "Sewa Excavator PC100", qty: 30 },
        { itemName: "Tukang Batu / Pekerja", qty: 14 },
        { itemName: "Mandor", qty: 14 },
        { itemName: "Sewa Concrete Pump", qty: 2 },
      ],
    },
    {
      projectName: p1,
      orderDate: "2026-03-01",
      receiptDate: "2026-03-08",
      items: [
        { itemName: "Sewa Excavator PC100", qty: 10 }, // Total 40/40 (100%)
      ],
    },

    // Order 2 (2026-03-05): Semen & Pasir (Penerimaan Bertahap - Semen Masih Parsial 250/300)
    {
      projectName: p1,
      orderDate: "2026-03-05",
      receiptDate: "2026-03-07",
      items: [
        { itemName: "Semen Portland 50 Kg", qty: 100 },
        { itemName: "Pasir Beton", qty: 15 }, // 15/15 (100%)
        { itemName: "Pasir Pasang", qty: 10 },
        { itemName: "Semen Putih 40 Kg", qty: 10 }, // 10/10 (100%)
      ],
    },
    {
      projectName: p1,
      orderDate: "2026-03-05",
      receiptDate: "2026-03-14",
      items: [
        { itemName: "Semen Portland 50 Kg", qty: 100 },
        { itemName: "Pasir Pasang", qty: 10 }, // Total 20/20 (100%)
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", qty: 80 }, // 80/80 (100%)
      ],
    },
    {
      projectName: p1,
      orderDate: "2026-03-05",
      receiptDate: "2026-03-20",
      items: [
        { itemName: "Semen Portland 50 Kg", qty: 50 }, // Total 250/300 (PARSIAL sisa 50)
      ],
    },

    // Order 3 (2026-03-10): Kayu & Batu (Batu Pecah OVER 120%, Kaso Parsial 200/220, Unplanned Batu Kali 100%)
    {
      projectName: p1,
      orderDate: "2026-03-10",
      receiptDate: "2026-03-12",
      items: [
        { itemName: "Batu Pecah / Split 1/2", qty: 18 }, // OVER-DELIVERED 18/15 (120%)
        { itemName: "Papan Cor 2/20 Meranti", qty: 50 }, // 50/50 (100%)
        { itemName: "Kaso 5/7 Meranti", qty: 100 },
      ],
    },
    {
      projectName: p1,
      orderDate: "2026-03-10",
      receiptDate: "2026-03-18",
      items: [
        { itemName: "Kaso 5/7 Meranti", qty: 100 }, // Total 200/220 (PARSIAL sisa 20)
        { itemName: "Triplek / Multiplek 9mm", qty: 50 }, // 50/50 (100%)
        { itemName: "Batu Kali", qty: 12 }, // UNPLANNED 12/12 (100%)
      ],
    },

    // Order 4 (2026-03-12): Besi Beton (Besi Ulir 13mm PARSIAL 100/150, Unplanned Besi 16mm 100%)
    {
      projectName: p1,
      orderDate: "2026-03-12",
      receiptDate: "2026-03-15",
      items: [
        { itemName: "Besi Beton Polos 8mm x 12m", qty: 100 }, // 100/100
        { itemName: "Besi Beton Polos 10mm x 12m", qty: 150 }, // 150/150
        { itemName: "Besi Beton Ulir 13mm x 12m", qty: 100 }, // PARSIAL 100/150 (sisa 50)
        { itemName: "Kawat Bendrat", qty: 20 }, // 20/20
        { itemName: "Besi Beton Ulir 16mm x 12m", qty: 10 }, // UNPLANNED 10/10
      ],
    },

    // Order 5 (2026-03-25): Finishing (Waterproofing OVER 6/5, Cat Interior PARSIAL 8/15, Cat Eksterior & Triplek 12mm 0%)
    {
      projectName: p1,
      orderDate: "2026-03-25",
      receiptDate: "2026-03-28",
      items: [
        { itemName: "Granit Tile 60x60 (Cream)", qty: 120 }, // 120/120 (100%)
        { itemName: "Keramik Dinding 30x60", qty: 40 }, // 40/40 (100%)
        { itemName: "Waterproofing 20kg", qty: 6 }, // OVER-DELIVERED 6/5 (120%)
        { itemName: "Cat Tembok Interior 25kg (Pail)", qty: 8 }, // PARSIAL 8/15 (sisa 7)
        // Cat Tembok Eksterior 20L & Triplek 12mm TIDAK DITERIMA (0% Progress)
      ],
    },
    // Order 6 (2026-04-05): BELUM DITERIMA SAMA SEKALI (0% Progress)

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 2: Renovasi Interior Kantor PT. xyz
    // ═════════════════════════════════════════════════════════════════════════
    // Order 1 (2026-04-01): Finishing (Bertahap & Lengkap)
    {
      projectName: p2,
      orderDate: "2026-04-01",
      receiptDate: "2026-04-10",
      items: [
        { itemName: "Cat Tembok Interior 25kg (Pail)", qty: 15 },
        { itemName: "Waterproofing 20kg", qty: 10 }, // 10/10 (100%)
        { itemName: "Granit Tile 60x60 (Cream)", qty: 50 },
        { itemName: "Keramik Dinding 30x60", qty: 15 }, // UNPLANNED 15/15 (100%)
      ],
    },
    {
      projectName: p2,
      orderDate: "2026-04-01",
      receiptDate: "2026-04-12",
      items: [
        { itemName: "Cat Tembok Interior 25kg (Pail)", qty: 10 }, // Total 25/25 (100%)
        { itemName: "Granit Tile 60x60 (Cream)", qty: 30 }, // Total 80/80 (100%)
      ],
    },

    // Order 2 (2026-04-15): Elektrikal (Lampu OVER 60/50, Unplanned Pipa PARSIAL 10/20)
    {
      projectName: p2,
      orderDate: "2026-04-15",
      receiptDate: "2026-04-18",
      items: [
        { itemName: "Kabel NYM 3x2.5mm", qty: 8 }, // 8/8 (100%)
        { itemName: "Lampu Downlight LED 12W", qty: 60 }, // OVER-DELIVERED 60/50 (120%)
        { itemName: "Pipa PVC 1/2 inch tipe AW", qty: 10 }, // UNPLANNED PARSIAL 10/20
      ],
    },

    // Order 3 (2026-04-20): Multiplek & Kayu (Triplek 12mm PARSIAL 15/30)
    {
      projectName: p2,
      orderDate: "2026-04-20",
      receiptDate: "2026-04-22",
      items: [
        { itemName: "Triplek / Multiplek 9mm", qty: 20 },
        { itemName: "Triplek / Multiplek 12mm", qty: 15 }, // PARSIAL 15/30 (sisa 15)
      ],
    },
    {
      projectName: p2,
      orderDate: "2026-04-20",
      receiptDate: "2026-05-02",
      items: [
        { itemName: "Triplek / Multiplek 9mm", qty: 10 }, // Total 30/30 (100%)
        { itemName: "Kaso 5/7 Meranti", qty: 50 }, // 50/50 (100%)
      ],
    },
    // Order 4 (2026-04-25): BELUM DITERIMA SAMA SEKALI (0% Progress)

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 3: Pembangunan Gudang Logistik Cikarang
    // ═════════════════════════════════════════════════════════════════════════
    // Order 1 (2026-04-25): Alat Berat (Bertahap & Lengkap)
    {
      projectName: p3,
      orderDate: "2026-04-25",
      receiptDate: "2026-04-28",
      items: [
        { itemName: "Sewa Excavator PC100", qty: 50 },
        { itemName: "Sewa Concrete Pump", qty: 5 }, // 5/5 (100%)
      ],
    },
    {
      projectName: p3,
      orderDate: "2026-04-25",
      receiptDate: "2026-05-05",
      items: [
        { itemName: "Sewa Excavator PC100", qty: 30 }, // Total 80/80 (100%)
      ],
    },

    // Order 2 (2026-05-10): Besi Struktur (Besi Ulir 13mm OVER 275/250, Besi Ulir 16mm PARSIAL 250/300)
    {
      projectName: p3,
      orderDate: "2026-05-10",
      receiptDate: "2026-05-15",
      items: [
        { itemName: "Besi Beton Ulir 16mm x 12m", qty: 150 },
        { itemName: "Besi Beton Ulir 13mm x 12m", qty: 275 }, // OVER-DELIVERED 275/250 (110%)
        { itemName: "Besi Beton Polos 10mm x 12m", qty: 150 }, // 150/150 (100%)
        { itemName: "Kawat Bendrat", qty: 50 }, // 50/50 (100%)
      ],
    },
    {
      projectName: p3,
      orderDate: "2026-05-10",
      receiptDate: "2026-05-22",
      items: [
        { itemName: "Besi Beton Ulir 16mm x 12m", qty: 100 }, // Total 250/300 (PARSIAL sisa 50)
      ],
    },

    // Order 3 (2026-05-18): Semen & Pasir (Pasir Beton OVER 55/50, Semen PARSIAL 400/500, Unplanned Batu Kali 100%)
    {
      projectName: p3,
      orderDate: "2026-05-18",
      receiptDate: "2026-05-20",
      items: [
        { itemName: "Semen Portland 50 Kg", qty: 200 },
        { itemName: "Pasir Beton", qty: 55 }, // OVER-DELIVERED 55/50 (110%)
      ],
    },
    {
      projectName: p3,
      orderDate: "2026-05-18",
      receiptDate: "2026-05-25",
      items: [
        { itemName: "Semen Portland 50 Kg", qty: 200 }, // Total 400/500 (PARSIAL sisa 100)
        { itemName: "Batu Pecah / Split 1/2", qty: 50 }, // 50/50 (100%)
        { itemName: "Batu Kali", qty: 30 }, // UNPLANNED 30/30 (100%)
      ],
    },
    // Order 4 (2026-05-28): BELUM DITERIMA SAMA SEKALI (0% Progress)
  ];

  for (const rc of receipts) {
    const orderId = orderMap.get(`${rc.projectName}|${rc.orderDate}`);
    if (!orderId) {
      console.warn(`[receipt.seed] Order not found for: ${rc.projectName} on ${rc.orderDate}`);
      continue;
    }

    const receiptItems: Array<{ order_item_id: string; qty: number }> = [];

    for (const item of rc.items) {
      const orderItemId = orderItemMap.get(`${orderId}|${item.itemName}`);
      if (!orderItemId) {
        console.warn(`[receipt.seed] Order item not found: ${item.itemName} in Order on ${rc.orderDate}`);
        continue;
      }

      receiptItems.push({
        order_item_id: orderItemId,
        qty: item.qty,
      });
    }

    if (receiptItems.length === 0) continue;

    const existingCount = await receiptRepo.count({
      order_id: orderId,
      receipt_date: rc.receiptDate,
    });

    if (existingCount === 0) {
      await receiptRepo.createWithItems(
        {
          order_id: orderId,
          receipt_code: "",
          receipt_date: rc.receiptDate,
        },
        receiptItems,
      );
    }
  }
}
