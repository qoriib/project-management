import { receiptRepo } from "@/db/repositories";
import { getDB } from "@/db/index";

interface SeedReceiptItemRaw {
  itemName: string;
  qty: number;
}

interface SeedReceipt {
  receiptCode: string;
  orderCode: string;
  receiptDate: string;
  items: SeedReceiptItemRaw[];
}

export async function seedReceipts(): Promise<void> {
  const db = await getDB();
  const orderRows = await db.select<{ order_id: string; order_code: string }[]>(`
    SELECT o.order_id, o.order_code
    FROM orders o
    WHERE o.deleted_at IS NULL
  `);

  const orderItemRows = await db.select<{ order_item_id: string; order_id: string; item_name: string }[]>(`
    SELECT oi.order_item_id, oi.order_id, i.item_name
    FROM order_items oi
    JOIN items i ON i.item_id = oi.item_id
  `);

  const orderMap = new Map<string, string>(orderRows.map((row) => [row.order_code, row.order_id]));

  const orderItemMap = new Map<string, string>(
    orderItemRows.map((row) => [`${row.order_id}|${row.item_name}`, row.order_item_id]),
  );

  const receipts: SeedReceipt[] = [
    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 1: Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi
    // ═════════════════════════════════════════════════════════════════════════
    {
      // NP 1 untuk PO-2026-0001 (Sewa Concrete Pump belum diterima = 0%)
      receiptCode: "NP-2026-0001",
      orderCode: "PO-2026-0001",
      receiptDate: "2026-03-03",
      items: [
        { itemName: "Sewa Excavator PC100", qty: 40 }, // 40/40 = 100%
        { itemName: "Tukang Batu / Pekerja", qty: 14 }, // 14/14 = 100%
        { itemName: "Mandor", qty: 14 }, // 14/14 = 100%
        // Sewa Concrete Pump tidak dicantumkan -> 0/2 = 0% unfulfilled
      ],
    },
    {
      // NP 2 untuk PO-2026-0002 (Kombinasi Under Delivery, Over Delivery, & Complete)
      receiptCode: "NP-2026-0002",
      orderCode: "PO-2026-0002",
      receiptDate: "2026-03-08",
      items: [
        // UNDER DELIVERY / PARTIAL: 180 dari 280 sak (64%)
        { itemName: "Semen Portland 50 Kg", qty: 180 },
        // COMPLETE: 15 dari 15 m3 (100%)
        { itemName: "Pasir Beton", qty: 15 },
        // OVER DELIVERY: 23 dari 20 m3 (115% -> SURPLUS / ERROR)
        { itemName: "Batu Pecah / Split 1/2", qty: 23 },
        // COMPLETE: 100 dari 100 btg (100%)
        { itemName: "Besi Beton Polos 8mm x 12m", qty: 100 },
        // UNDER DELIVERY / PARTIAL: 120 dari 180 btg (66%)
        { itemName: "Besi Beton Polos 10mm x 12m", qty: 120 },
        // COMPLETE: 160 dari 160 btg (100%)
        { itemName: "Besi Beton Ulir 13mm x 12m", qty: 160 },
        // UNDER DELIVERY / PARTIAL: 100 dari 150 btg (66%)
        { itemName: "Kaso 5/7 Meranti", qty: 100 },
        // OVER DELIVERY: 6 dari 5 pail (120% -> SURPLUS / ERROR)
        { itemName: "Waterproofing 20kg", qty: 6 },
        // Triplek 9mm (Unplanned) belum ada penerimaan -> 0/25 = 0% unfulfilled
      ],
    },
    {
      // NP 3 untuk PO-2026-0003 (Penerimaan Tahap 1 Finishing)
      receiptCode: "NP-2026-0003",
      orderCode: "PO-2026-0003",
      receiptDate: "2026-03-15",
      items: [
        // COMPLETE: 20/20 (100%)
        { itemName: "Pasir Pasang", qty: 20 },
        // OVER DELIVERY: 130 dari 120 zak (108% -> SURPLUS / ERROR)
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", qty: 130 },
        // COMPLETE: 10/10 (100%)
        { itemName: "Semen Putih 40 Kg", qty: 10 },
        // UNDER DELIVERY / PARTIAL: 40 dari 60 m2 (66%)
        { itemName: "Granit Tile 60x60 (Cream)", qty: 40 },
        // MULTI-NP TAHAP 1: 6 dari 10 pail
        { itemName: "Cat Tembok Interior 25kg (Pail)", qty: 6 },
        // COMPLETE (Unplanned): 20/20 (100%)
        { itemName: "Lampu Downlight LED 12W", qty: 20 },
      ],
    },
    {
      // NP 4 untuk PO-2026-0003 (Penerimaan Tahap 2 Cat Tembok -> Lengkap 10/10)
      receiptCode: "NP-2026-0004",
      orderCode: "PO-2026-0003",
      receiptDate: "2026-03-18",
      items: [
        // MULTI-NP TAHAP 2: 4 pail tambahan (Total 6 + 4 = 10 -> 100% complete!)
        { itemName: "Cat Tembok Interior 25kg (Pail)", qty: 4 },
      ],
    },
    {
      // NP 5 untuk PO-2026-0004 (Pekerjaan Mekanikal & Elektrikal Pagu)
      receiptCode: "NP-2026-0005",
      orderCode: "PO-2026-0004",
      receiptDate: "2026-03-22",
      items: [
        { itemName: "Kabel NYM 3x2.5mm", qty: 30 }, // 30/30 (100%)
        { itemName: "Lampu Downlight LED 12W", qty: 80 }, // 80/100 (80% partial)
        { itemName: "Pipa PVC 1/2 inch tipe AW", qty: 200 }, // 200/200 (100%)
      ],
    },
    {
      // NP 6 untuk PO-2026-0005 (Pekerjaan Pagar & Lanskap Pagu - dengan Over Delivery Batu Kali)
      receiptCode: "NP-2026-0006",
      orderCode: "PO-2026-0005",
      receiptDate: "2026-03-28",
      items: [
        { itemName: "Batu Kali", qty: 65 }, // 65 dari 60 m3 (108% OVER DELIVERY)
        { itemName: "Semen Portland 50 Kg", qty: 120 }, // 120/120 (100%)
        { itemName: "Pasir Pasang", qty: 15 }, // 15/15 (100%)
      ],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 2: Renovasi Interior Kantor PT. xyz (Model Pagu Semua)
    // ═════════════════════════════════════════════════════════════════════════
    {
      receiptCode: "NP-2026-0007",
      orderCode: "PO-2026-0006",
      receiptDate: "2026-04-03",
      items: [
        { itemName: "Mandor", qty: 40 }, // 40/40 (100%)
        { itemName: "Tukang Batu / Pekerja", qty: 60 }, // 60/60 (100%)
      ],
    },
    {
      receiptCode: "NP-2026-0008",
      orderCode: "PO-2026-0007",
      receiptDate: "2026-04-13",
      items: [
        { itemName: "Triplek / Multiplek 12mm", qty: 200 }, // Parsial 200 dari 250 (80%)
        { itemName: "Kaso 5/7 Meranti", qty: 400 }, // 400/400 (100%)
        { itemName: "Papan Cor 2/20 Meranti", qty: 220 }, // 220 dari 200 (110% OVER DELIVERY)
        { itemName: "Cat Tembok Interior 25kg (Pail)", qty: 10 }, // 10/10 (100%)
      ],
    },
    {
      receiptCode: "NP-2026-0009",
      orderCode: "PO-2026-0008",
      receiptDate: "2026-04-18",
      items: [
        { itemName: "Lampu Downlight LED 12W", qty: 300 }, // 300/300 (100%)
        { itemName: "Kabel NYM 3x2.5mm", qty: 15 }, // Parsial 15 dari 20 (75%)
      ],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 3: Pembangunan Gudang Logistik Cikarang
    // ═════════════════════════════════════════════════════════════════════════
    {
      receiptCode: "NP-2026-0010",
      orderCode: "PO-2026-0009",
      receiptDate: "2026-05-04",
      items: [
        { itemName: "Sewa Excavator PC100", qty: 80 }, // 80/80 (100%)
        { itemName: "Batu Kali", qty: 60 }, // 60/60 (100%)
        { itemName: "Pasir Pasang", qty: 50 }, // 50/50 (100%)
        { itemName: "Semen Portland 50 Kg", qty: 240 }, // 240 dari 220 (109% OVER DELIVERY)
      ],
    },
    {
      receiptCode: "NP-2026-0011",
      orderCode: "PO-2026-0010",
      receiptDate: "2026-05-15",
      items: [
        { itemName: "Besi Beton Ulir 16mm x 12m", qty: 500 }, // 500/500 (100%)
        { itemName: "Besi Beton Ulir 13mm x 12m", qty: 250 }, // Parsial 250 dari 300 (83%)
        { itemName: "Sewa Concrete Pump", qty: 5 }, // 5/5 (100%)
        { itemName: "Triplek / Multiplek 12mm", qty: 90 }, // 90 dari 80 (112% OVER DELIVERY)
        { itemName: "Kaso 5/7 Meranti", qty: 250 }, // 250/250 (100%)
        { itemName: "Kawat Bendrat", qty: 40 }, // 40/40 (100%)
      ],
    },
    {
      receiptCode: "NP-2026-0012",
      orderCode: "PO-2026-0011",
      receiptDate: "2026-05-25",
      items: [
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", qty: 250 }, // 250/250 (100%)
        { itemName: "Semen Putih 40 Kg", qty: 20 }, // 20/20 (100%)
        { itemName: "Cat Tembok Eksterior 20L", qty: 10 }, // 10/10 (100%)
        // Waterproofing 20kg (Unplanned) belum ada surat jalan -> 0/6 = 0% unfulfilled
      ],
    },
  ];

  for (const rc of receipts) {
    const orderId = orderMap.get(rc.orderCode);
    if (!orderId) {
      console.warn(`[receipt.seed] Order not found for code: ${rc.orderCode}`);
      continue;
    }

    const receiptItems = [];

    for (const item of rc.items) {
      const orderItemId = orderItemMap.get(`${orderId}|${item.itemName}`);
      if (!orderItemId) {
        console.warn(`[receipt.seed] OrderItem not found for: ${item.itemName} in order ${orderId}`);
        continue;
      }

      receiptItems.push({
        order_item_id: orderItemId,
        qty: item.qty,
      });
    }

    if (receiptItems.length === 0) continue;

    const existingReceipts = await receiptRepo.findAll({
      where: {
        order_id: orderId,
        receipt_code: rc.receiptCode,
      },
    });

    if (existingReceipts.length === 0) {
      await receiptRepo.createWithItems(
        {
          order_id: orderId,
          receipt_code: rc.receiptCode,
          receipt_date: rc.receiptDate,
        },
        receiptItems,
      );
    }
  }
}
