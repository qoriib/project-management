import { itemPriceRepo, itemRepo, orderItemRepo, orderRepo, receiptRepo } from "@/db/repositories";

interface SeedReceiptItemRaw {
  itemName: string;
  qty: number;
  price?: number;
  hasTax?: boolean;
}

interface SeedReceipt {
  receiptCode: string;
  orderCode: string;
  receiptDate: string;
  items: SeedReceiptItemRaw[];
}

export async function seedReceipts(): Promise<void> {
  const orders = await orderRepo.findAll();
  const orderMap = new Map<string, string>(
    orders
      .filter((order): order is typeof order & { order_code: string } => Boolean(order.order_code))
      .map((order) => [order.order_code, order.order_id]),
  );

  const allOrderItems = await orderItemRepo.findAll();
  const allItems = await itemRepo.findAll();
  const itemById = new Map<string, string>(allItems.map((item) => [item.item_id, item.item_name]));
  const allPrices = await itemPriceRepo.findAll();
  const priceMap = new Map<string, number>(allPrices.map((priceItem) => [priceItem.item_price_id, priceItem.price]));

  const orderItemMap = new Map<
    string,
    { has_tax: boolean; order_item_id: string; item_id: string; item_price_id: string; price: number }
  >(
    allOrderItems.map((orderItem) => {
      const itemName = itemById.get(orderItem.item_id) ?? "";
      return [
        `${orderItem.order_id}|${itemName}`,
        {
          has_tax: Boolean(orderItem.has_tax),
          order_item_id: orderItem.order_item_id,
          item_id: orderItem.item_id,
          item_price_id: orderItem.item_price_id,
          price: priceMap.get(orderItem.item_price_id) ?? 0,
        },
      ];
    }),
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
        { itemName: "Sewa Excavator PC100", price: 180000, qty: 40 }, // 40/40 = 100%
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 14 }, // 14/14 = 100%
        { itemName: "Mandor", price: 250000, qty: 14 }, // 14/14 = 100%
        // Sewa Concrete Pump tidak dicantumkan -> 0/2 = 0% unfulfilled
      ],
    },
    {
      // NP 2 untuk PO-2026-0002 (Kombinasi Under Delivery, Over Delivery, & Variasi Harga Faktur)
      receiptCode: "NP-2026-0002",
      orderCode: "PO-2026-0002",
      receiptDate: "2026-03-08",
      items: [
        // TAHAP 1: 180 dari 280 sak (harga sesuai PO 78.000)
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 180 },
        // COMPLETE: 15 dari 15 m3 (harga sesuai PO 280.000)
        { itemName: "Pasir Beton", price: 280000, qty: 15 },
        // OVER DELIVERY: 23 dari 20 m3 & SURCHARGE: NP 340.000 vs PO 335.000 vs BOQ 350.000
        { itemName: "Batu Pecah / Split 1/2", price: 340000, qty: 23 },
        // COMPLETE: 100 btg & DISCOUNT: NP 41.000 vs PO 42.000 vs BOQ 45.000 (diskon tunai faktur)
        { itemName: "Besi Beton Polos 8mm x 12m", price: 41000, qty: 100 },
        // UNDER DELIVERY / PARTIAL: 120 dari 180 btg
        { itemName: "Besi Beton Polos 10mm x 12m", price: 76000, qty: 120 },
        // COMPLETE: 160 dari 160 btg
        { itemName: "Besi Beton Ulir 13mm x 12m", price: 122000, qty: 160 },
        // UNDER DELIVERY / PARTIAL: 100 dari 150 btg
        { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 100 },
        // OVER DELIVERY: 6 dari 5 pail
        { itemName: "Waterproofing 20kg", price: 750000, qty: 6 },
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
        { itemName: "Pasir Pasang", price: 265000, qty: 20 },
        // OVER DELIVERY: 130 dari 120 zak (108% -> SURPLUS)
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 95000, qty: 130 },
        // COMPLETE: 10/10 (100%)
        { itemName: "Semen Putih 40 Kg", price: 80000, qty: 10 },
        // UNDER DELIVERY / PARTIAL: 40 dari 60 m2 (66%)
        { itemName: "Granit Tile 60x60 (Cream)", price: 185000, qty: 40 },
        // MULTI-NP TAHAP 1: 6 dari 10 pail
        { itemName: "Cat Tembok Interior 25kg (Pail)", price: 800000, qty: 6 },
        // COMPLETE (Unplanned): 20/20 (100%)
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 20 },
      ],
    },
    {
      // NP 4 untuk PO-2026-0003 (Penerimaan Tahap 2 Cat Tembok -> Lengkap 10/10)
      receiptCode: "NP-2026-0004",
      orderCode: "PO-2026-0003",
      receiptDate: "2026-03-18",
      items: [
        // MULTI-NP TAHAP 2: 4 pail tambahan (Total 6 + 4 = 10 -> 100% complete!)
        { itemName: "Cat Tembok Interior 25kg (Pail)", price: 800000, qty: 4 },
      ],
    },
    {
      // NP 5 untuk PO-2026-0004 (Pekerjaan Mekanikal & Elektrikal Pagu - Variasi Harga Rebate)
      receiptCode: "NP-2026-0005",
      orderCode: "PO-2026-0004",
      receiptDate: "2026-03-22",
      items: [
        // REBATE VENDOR: NP 640.000 vs PO 650.000
        { itemName: "Kabel NYM 3x2.5mm", price: 640000, qty: 30 },
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 80 }, // 80/100 (80% partial)
        { itemName: "Pipa PVC 1/2 inch tipe AW", price: 35000, qty: 200 }, // 200/200 (100%)
      ],
    },
    {
      // NP 6 untuk PO-2026-0005 (Pekerjaan Pagar & Lanskap Pagu - dengan Over Delivery Batu Kali)
      receiptCode: "NP-2026-0006",
      orderCode: "PO-2026-0005",
      receiptDate: "2026-03-28",
      items: [
        { itemName: "Batu Kali", price: 195000, qty: 65 }, // 65 dari 60 m3 (108% OVER DELIVERY)
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 120 }, // 120/120 (100%)
        { itemName: "Pasir Pasang", price: 265000, qty: 15 }, // 15/15 (100%)
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
        { itemName: "Mandor", price: 250000, qty: 40 }, // 40/40 (100%)
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 60 }, // 60/60 (100%)
      ],
    },
    {
      receiptCode: "NP-2026-0008",
      orderCode: "PO-2026-0007",
      receiptDate: "2026-04-13",
      items: [
        { itemName: "Triplek / Multiplek 12mm", price: 145000, qty: 200 }, // Parsial 200 dari 250 (80%)
        { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 400 }, // 400/400 (100%)
        { itemName: "Papan Cor 2/20 Meranti", price: 25000, qty: 220 }, // 220 dari 200 (110% OVER DELIVERY)
        { itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 10 }, // 10/10 (100%)
      ],
    },
    {
      receiptCode: "NP-2026-0009",
      orderCode: "PO-2026-0008",
      receiptDate: "2026-04-18",
      items: [
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 300 }, // 300/300 (100%)
        { itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 15 }, // Parsial 15 dari 20 (75%)
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
        { itemName: "Sewa Excavator PC100", price: 180000, qty: 80 }, // 80/80 (100%)
        { itemName: "Batu Kali", price: 170000, qty: 60 }, // 60/60 (100%)
        { itemName: "Pasir Pasang", price: 250000, qty: 50 }, // 50/50 (100%)
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 240 }, // 240 dari 220 (109% OVER DELIVERY)
      ],
    },
    {
      receiptCode: "NP-2026-0011",
      orderCode: "PO-2026-0010",
      receiptDate: "2026-05-15",
      items: [
        { itemName: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 500 }, // 500/500 (100%)
        { itemName: "Besi Beton Ulir 13mm x 12m", price: 122000, qty: 250 }, // Parsial 250 dari 300 (83%)
        { itemName: "Sewa Concrete Pump", price: 4500000, qty: 5 }, // 5/5 (100%)
        // PRICE REVISION: NP 140.000 vs PO 138.000 vs BOQ 145.000 & OVER DELIVERY: 90 dari 80
        { itemName: "Triplek / Multiplek 12mm", price: 140000, qty: 90 },
        { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 250 }, // 250/250 (100%)
        { itemName: "Kawat Bendrat", price: 22000, qty: 40 }, // 40/40 (100%)
      ],
    },
    {
      receiptCode: "NP-2026-0012",
      orderCode: "PO-2026-0011",
      receiptDate: "2026-05-25",
      items: [
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 90000, qty: 250 }, // 250/250 (100%)
        { itemName: "Semen Putih 40 Kg", price: 85000, qty: 20 }, // 20/20 (100%)
        { itemName: "Cat Tembok Eksterior 20L", price: 1250000, qty: 10 }, // 10/10 (100%)
        // Waterproofing 20kg (Unplanned) belum ada surat jalan -> 0/6 = 0% unfulfilled
      ],
    },
    {
      // NP 13 untuk PO-2026-0002 (Tahap 2 Semen Portland dengan Harga Revisi Pengiriman Cepat Hari Libur)
      receiptCode: "NP-2026-0013",
      orderCode: "PO-2026-0002",
      receiptDate: "2026-03-12",
      items: [
        // Sisa 100 sak (Total 180 + 100 = 280 -> 100%) dengan harga faktur naik ke 79.500 (PO 78.000, BOQ 75.000)
        { itemName: "Semen Portland 50 Kg", price: 79500, qty: 100 },
      ],
    },
    {
      // NP 14 untuk PO-2026-0012 (Pekerjaan Pembersihan & Akhir - Pagu Tanpa Budget)
      receiptCode: "NP-2026-0014",
      orderCode: "PO-2026-0012",
      receiptDate: "2026-03-30",
      items: [
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 10 },
        { itemName: "Mandor", price: 250000, qty: 2 },
      ],
    },
    {
      // NP 15 untuk PO-2026-0013 (Pekerjaan Pengawasan & Supervisi - Pagu Tanpa Budget)
      receiptCode: "NP-2026-0015",
      orderCode: "PO-2026-0013",
      receiptDate: "2026-04-25",
      items: [{ itemName: "Mandor", price: 250000, qty: 20 }],
    },
    {
      // NP 16 untuk PO-2026-0014 (Biaya Kontinjensi & Tak Terduga - Pagu Tanpa Budget)
      receiptCode: "NP-2026-0016",
      orderCode: "PO-2026-0014",
      receiptDate: "2026-05-28",
      items: [
        { itemName: "Waterproofing 20kg", price: 750000, qty: 4 },
        { itemName: "Semen Putih 40 Kg", price: 85000, qty: 10 },
      ],
    },
  ];

  for (const receipt of receipts) {
    const orderId = orderMap.get(receipt.orderCode);
    if (!orderId) {
      console.warn(`[receipt.seed] Order not found for code: ${receipt.orderCode}`);
      continue;
    }

    const receiptItems = [];

    for (const item of receipt.items) {
      const orderItem = orderItemMap.get(`${orderId}|${item.itemName}`);
      if (!orderItem) {
        console.warn(
          `[receipt.seed] Order item not found for '${item.itemName}' in order code '${receipt.receiptCode}'`,
        );
        continue;
      }

      let matchedPriceId = orderItem.item_price_id;
      if (item.price !== undefined && item.price !== orderItem.price) {
        const prices = await itemPriceRepo.findByItem(orderItem.item_id);
        const match = prices.find((priceItem) => priceItem.price === item.price);
        if (match) {
          matchedPriceId = match.item_price_id;
        } else {
          matchedPriceId = await itemPriceRepo.create({
            item_id: orderItem.item_id,
            price: item.price,
            note: `Faktur Penerimaan ${receipt.receiptCode}`,
          });
        }
      }

      receiptItems.push({
        has_tax: item.hasTax !== undefined ? item.hasTax : orderItem.has_tax,
        order_item_id: orderItem.order_item_id,
        item_price_id: matchedPriceId,
        price: item.price !== undefined ? item.price : orderItem.price,
        qty: item.qty,
      });
    }

    if (receiptItems.length === 0) continue;

    const existingReceipts = await receiptRepo.findAll({
      where: {
        order_id: orderId,
        receipt_code: receipt.receiptCode,
      },
    });

    if (existingReceipts.length === 0) {
      await receiptRepo.createWithItems(
        {
          order_id: orderId,
          receipt_code: receipt.receiptCode,
          receipt_date: receipt.receiptDate,
        },
        receiptItems,
      );
    }
  }
}
