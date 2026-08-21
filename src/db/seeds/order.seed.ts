import { itemPriceRepo, itemRepo, projectRepo, orderRepo, vendorRepo } from "@/db/repositories";

interface SeedOrderItemRaw {
  itemName: string;
  price: number;
  qty: number;
  hasTax?: boolean;
}

interface SeedOrderRaw {
  orderCode: string;
  projectName: string;
  orderDate: string;
  vendorName: string;
  items: SeedOrderItemRaw[];
}

export async function seedOrders(): Promise<void> {
  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi";
  const p2 = "Renovasi Interior Kantor PT. xyz";
  const p3 = "Pembangunan Gudang Logistik Cikarang";

  const orders: SeedOrderRaw[] = [
    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 1: Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi
    // ═════════════════════════════════════════════════════════════════════════
    {
      // PO 1: Sewa Alat & Tenaga Kerja (Penerimaan Lengkap)
      orderCode: "PO-2026-0001",
      orderDate: "2026-03-01",
      projectName: p1,
      vendorName: "Sewa Alat Berat Nusantara",
      items: [
        // HIGHER than BOM (200k vs 180k)
        { itemName: "Sewa Excavator PC100", price: 200000, qty: 40, hasTax: true },
        // EQUAL to BOM (150k)
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 14, hasTax: false },
        // EQUAL to BOM (250k)
        { itemName: "Mandor", price: 250000, qty: 14, hasTax: false },
        // LOWER than BOM (4.2jt vs 4.5jt)
        { itemName: "Sewa Concrete Pump", price: 4200000, qty: 2, hasTax: true },
      ],
    },
    {
      // PO 2: Semen & Pasir (Penerimaan Parsial / Masih Ada Sisa)
      orderCode: "PO-2026-0002",
      orderDate: "2026-03-05",
      projectName: p1,
      vendorName: "TB. Sinar Bangunan",
      items: [
        // HIGHER than BOM (78k vs 75k) -> Diterima 250 dari 300 (Sisa 50)
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 300, hasTax: true },
        // LOWER than BOM (280k vs 300k) -> Diterima 15/15
        { itemName: "Pasir Beton", price: 280000, qty: 15, hasTax: false },
        // HIGHER than BOM (265k vs 250k) -> Diterima 20/20
        { itemName: "Pasir Pasang", price: 265000, qty: 20, hasTax: false },
        // HIGHER than BOM (95k vs 90k) -> Diterima 80/80
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 95000, qty: 80, hasTax: true },
        // LOWER than BOM (80k vs 85k) -> Diterima 10/10
        { itemName: "Semen Putih 40 Kg", price: 80000, qty: 10, hasTax: true },
      ],
    },
    {
      // PO 3: Kayu, Batu & Non-Rencana (Ada Over-Delivered Batu Pecah & Unplanned Item)
      orderCode: "PO-2026-0003",
      orderDate: "2026-03-10",
      projectName: p1,
      vendorName: "CV. Sumber Pasir",
      items: [
        // LOWER than BOM (335k vs 350k) -> Diterima 18 dari 15 (BERLEBIH / OVER 120%)
        { itemName: "Batu Pecah / Split 1/2", price: 335000, qty: 15, hasTax: false },
        // EQUAL to BOM (25k) -> Diterima 50/50
        { itemName: "Papan Cor 2/20 Meranti", price: 25000, qty: 50, hasTax: false },
        // HIGHER than BOM (38k vs 35k) -> Pesan 220 (Over-BOM), diterima 200/220
        { itemName: "Kaso 5/7 Meranti", price: 38000, qty: 220, hasTax: false },
        // LOWER than BOM (102k vs 110k) -> Diterima 50/50
        { itemName: "Triplek / Multiplek 9mm", price: 102000, qty: 50, hasTax: true },
        // UNPLANNED (Item tidak ada di BOM Proyek 1) -> Diterima 12/12
        { itemName: "Batu Kali", price: 195000, qty: 12, hasTax: false },
      ],
    },
    {
      // PO 4: Besi Beton (Ada Parsial & Unplanned Besi 16mm)
      orderCode: "PO-2026-0004",
      orderDate: "2026-03-12",
      projectName: p1,
      vendorName: "PT. Baja Jaya Nusantara",
      items: [
        // LOWER than BOM (42k vs 45k) -> Diterima 100/100
        { itemName: "Besi Beton Polos 8mm x 12m", price: 42000, qty: 100, hasTax: true },
        // HIGHER than BOM (76k vs 72k) -> Diterima 150/150
        { itemName: "Besi Beton Polos 10mm x 12m", price: 76000, qty: 150, hasTax: true },
        // HIGHER than BOM (122k vs 115k) -> Pesan 150 dari BOM 200, diterima 100/150 (PARSIAL)
        { itemName: "Besi Beton Ulir 13mm x 12m", price: 122000, qty: 150, hasTax: true },
        // LOWER than BOM (20k vs 22k) -> Diterima 20/20
        { itemName: "Kawat Bendrat", price: 20000, qty: 20, hasTax: false },
        // UNPLANNED (Item tidak ada di BOM Proyek 1) -> Diterima 10/10
        { itemName: "Besi Beton Ulir 16mm x 12m", price: 175000, qty: 10, hasTax: true },
      ],
    },
    {
      // PO 5: Finishing & Cat (Ada Over-Delivered Waterproofing, Parsial Cat, & 0% Cat Eksterior)
      orderCode: "PO-2026-0005",
      orderDate: "2026-03-25",
      projectName: p1,
      vendorName: "Toko Cat Mitra Abadi",
      items: [
        // HIGHER than BOM (195k vs 185k) -> Diterima 120/120
        { itemName: "Granit Tile 60x60 (Cream)", price: 195000, qty: 120, hasTax: true },
        // LOWER than BOM (88k vs 95k) -> Diterima 40/40
        { itemName: "Keramik Dinding 30x60", price: 88000, qty: 40, hasTax: true },
        // LOWER than BOM (700k vs 750k) -> Diterima 6 dari 5 (BERLEBIH / OVER 120%)
        { itemName: "Waterproofing 20kg", price: 700000, qty: 5, hasTax: true },
        // EQUAL to BOM (850k) -> Diterima 8 dari 15 (PARSIAL)
        { itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 15, hasTax: true },
        // HIGHER than BOM (1.32jt vs 1.25jt) -> BELUM DITERIMA SAMA SEKALI (0%)
        { itemName: "Cat Tembok Eksterior 20L", price: 1320000, qty: 10, hasTax: true },
        // UNPLANNED (Triplek 12mm) -> BELUM DITERIMA SAMA SEKALI (0%)
        { itemName: "Triplek / Multiplek 12mm", price: 155000, qty: 20, hasTax: true },
      ],
    },
    {
      // PO 6: Elektrikal & Sanitari (PO BARU - BELUM DITERIMA SAMA SEKALI / 0% PROGRESS)
      orderCode: "PO-2026-0006",
      orderDate: "2026-04-05",
      projectName: p1,
      vendorName: "CV. Elektrika Mandiri",
      items: [
        // LOWER than BOM (620k vs 650k) -> 0% Diterima
        { itemName: "Kabel NYM 3x2.5mm", price: 620000, qty: 5, hasTax: true },
        // HIGHER than BOM (60k vs 55k) -> 0% Diterima
        { itemName: "Lampu Downlight LED 12W", price: 60000, qty: 30, hasTax: true },
        // HIGHER than BOM (38k vs 35k) -> 0% Diterima
        { itemName: "Pipa PVC 1/2 inch tipe AW", price: 38000, qty: 40, hasTax: false },
        // LOWER than BOM (140k vs 150k) -> 0% Diterima
        { itemName: "Pipa PVC 4 inch tipe AW", price: 140000, qty: 15, hasTax: false },
      ],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 2: Renovasi Interior Kantor PT. xyz
    // ═════════════════════════════════════════════════════════════════════════
    {
      // PO 1: Finishing Cat & Lantai (Lengkap & Unplanned)
      orderCode: "PO-2026-0007",
      orderDate: "2026-04-01",
      projectName: p2,
      vendorName: "Toko Cat Mitra Abadi",
      items: [
        // HIGHER than BOM (900k vs 850k) - Pesan 25 dari BOM 20 -> Diterima 25/25
        { itemName: "Cat Tembok Interior 25kg (Pail)", price: 900000, qty: 25, hasTax: true },
        // LOWER than BOM (700k vs 750k) -> Diterima 10/10
        { itemName: "Waterproofing 20kg", price: 700000, qty: 10, hasTax: true },
        // EQUAL to BOM (185k) -> Diterima 80/80
        { itemName: "Granit Tile 60x60 (Cream)", price: 185000, qty: 80, hasTax: true },
        // UNPLANNED Keramik Dinding -> Diterima 15/15
        { itemName: "Keramik Dinding 30x60", price: 95000, qty: 15, hasTax: true },
      ],
    },
    {
      // PO 2: Elektrikal (Ada Over-Delivered Lampu & Parsial Unplanned Pipa)
      orderCode: "PO-2026-0008",
      orderDate: "2026-04-15",
      projectName: p2,
      vendorName: "CV. Elektrika Mandiri",
      items: [
        // HIGHER than BOM (690k vs 650k) -> Diterima 8/8
        { itemName: "Kabel NYM 3x2.5mm", price: 690000, qty: 8, hasTax: true },
        // LOWER than BOM (50k vs 55k) -> Diterima 60 dari 50 (BERLEBIH / OVER 120%)
        { itemName: "Lampu Downlight LED 12W", price: 50000, qty: 50, hasTax: true },
        // UNPLANNED Pipa PVC 1/2 -> Diterima 10 dari 20 (PARSIAL)
        { itemName: "Pipa PVC 1/2 inch tipe AW", price: 38000, qty: 20, hasTax: false },
      ],
    },
    {
      // PO 3: Multiplek & Kayu (Ada Parsial Triplek 12mm)
      orderCode: "PO-2026-0009",
      orderDate: "2026-04-20",
      projectName: p2,
      vendorName: "CV. Sumber Pasir",
      items: [
        // LOWER than BOM (102k vs 110k) -> Diterima 30/30 (Split delivery)
        { itemName: "Triplek / Multiplek 9mm", price: 102000, qty: 30, hasTax: true },
        // HIGHER than BOM (155k vs 145k) - Pesan 30 dari BOM 40 -> Diterima 15/30 (PARSIAL)
        { itemName: "Triplek / Multiplek 12mm", price: 155000, qty: 30, hasTax: true },
        // EQUAL to BOM (35k) -> Diterima 50/50
        { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 50, hasTax: false },
      ],
    },
    {
      // PO 4: Semen & Mortar (PO BARU - BELUM DITERIMA / 0%)
      orderCode: "PO-2026-0010",
      orderDate: "2026-04-25",
      projectName: p2,
      vendorName: "TB. Sinar Bangunan",
      items: [
        // HIGHER than BOM (78k vs 75k) -> 0% Diterima
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 50, hasTax: true },
        // LOWER than BOM (85k vs 90k) -> 0% Diterima
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 85000, qty: 20, hasTax: true },
      ],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 3: Pembangunan Gudang Logistik Cikarang
    // ═════════════════════════════════════════════════════════════════════════
    {
      // PO 1: Alat Berat (Lengkap)
      orderCode: "PO-2026-0011",
      orderDate: "2026-04-25",
      projectName: p3,
      vendorName: "Sewa Alat Berat Nusantara",
      items: [
        // LOWER than BOM (165k vs 180k) -> Diterima 80/80 (Split delivery 50 + 30)
        { itemName: "Sewa Excavator PC100", price: 165000, qty: 80, hasTax: true },
        // HIGHER than BOM (4.8jt vs 4.5jt) -> Diterima 5/5
        { itemName: "Sewa Concrete Pump", price: 4800000, qty: 5, hasTax: true },
      ],
    },
    {
      // PO 2: Besi Struktur (Ada Over-Delivered Besi 13mm & Parsial Besi 16mm)
      orderCode: "PO-2026-0012",
      orderDate: "2026-05-10",
      projectName: p3,
      vendorName: "PT. Baja Jaya Nusantara",
      items: [
        // HIGHER than BOM (175k vs 165k) -> Diterima 250 dari 300 (PARSIAL Sisa 50)
        { itemName: "Besi Beton Ulir 16mm x 12m", price: 175000, qty: 300, hasTax: true },
        // LOWER than BOM (108k vs 115k) -> Diterima 275 dari 250 (BERLEBIH / OVER 110%)
        { itemName: "Besi Beton Ulir 13mm x 12m", price: 108000, qty: 250, hasTax: true },
        // EQUAL to BOM (72k) -> Pesan 150 dari BOM 200, Diterima 150/150
        { itemName: "Besi Beton Polos 10mm x 12m", price: 72000, qty: 150, hasTax: true },
        // LOWER than BOM (20k vs 22k) -> Diterima 50/50
        { itemName: "Kawat Bendrat", price: 20000, qty: 50, hasTax: false },
      ],
    },
    {
      // PO 3: Semen & Item Pasir (Ada Over-Delivered Pasir Beton, Parsial Semen, Unplanned Batu Kali)
      orderCode: "PO-2026-0013",
      orderDate: "2026-05-18",
      projectName: p3,
      vendorName: "TB. Sinar Bangunan",
      items: [
        // LOWER than BOM (72k vs 75k) -> Diterima 400 dari 500 (PARSIAL Sisa 100)
        { itemName: "Semen Portland 50 Kg", price: 72000, qty: 500, hasTax: true },
        // HIGHER than BOM (320k vs 300k) -> Diterima 55 dari 50 (BERLEBIH / OVER 110%)
        { itemName: "Pasir Beton", price: 320000, qty: 50, hasTax: false },
        // EQUAL to BOM (350k) -> Diterima 50/50
        { itemName: "Batu Pecah / Split 1/2", price: 350000, qty: 50, hasTax: false },
        // UNPLANNED Batu Kali -> Diterima 30/30
        { itemName: "Batu Kali", price: 180000, qty: 30, hasTax: false },
      ],
    },
    {
      // PO 4: Cat & Waterproofing (PO BARU - BELUM DITERIMA / 0%)
      orderCode: "PO-2026-0014",
      orderDate: "2026-05-28",
      projectName: p3,
      vendorName: "Toko Cat Mitra Abadi",
      items: [
        // HIGHER than BOM (800k vs 750k) -> 0% Diterima
        { itemName: "Waterproofing 20kg", price: 800000, qty: 20, hasTax: true },
        // LOWER than BOM (1.18jt vs 1.25jt) -> 0% Diterima
        { itemName: "Cat Tembok Eksterior 20L", price: 1180000, qty: 30, hasTax: true },
      ],
    },
  ];

  for (const ord of orders) {
    const project = await projectRepo.findOne({ project_name: ord.projectName });
    if (!project) {
      console.warn(`[order.seed] Project not found: ${ord.projectName}`);
      continue;
    }

    const vendor = await vendorRepo.findOne({ vendor_name: ord.vendorName });
    if (!vendor) {
      console.warn(`[order.seed] Vendor not found: ${ord.vendorName}`);
      continue;
    }

    const orderItems: Array<{
      item_id: string;
      vendor_id: string;
      item_price_id: string;
      qty: number;
      has_tax: number;
    }> = [];

    for (const item of ord.items) {
      const itemRecord = await itemRepo.findOne({ item_name: item.itemName });
      if (!itemRecord) {
        console.warn(`[order.seed] Item not found: ${item.itemName}`);
        continue;
      }

      const prices = await itemPriceRepo.findByItem(itemRecord.item_id);
      const matchedPrice = prices.find((p) => p.price === item.price) ?? prices[0];

      if (!matchedPrice) {
        console.warn(`[order.seed] Price variant not found for: ${item.itemName} @ ${item.price}`);
        continue;
      }

      orderItems.push({
        has_tax: item.hasTax ? 1 : 0,
        item_id: itemRecord.item_id,
        item_price_id: matchedPrice.item_price_id,
        qty: item.qty,
        vendor_id: vendor.vendor_id,
      });
    }

    if (orderItems.length === 0) continue;

    const existingOrders = await orderRepo.findAll({
      where: {
        order_date: ord.orderDate,
        project_id: project.project_id,
      },
    });

    if (existingOrders.length === 0) {
      await orderRepo.createWithItems(
        {
          order_code: ord.orderCode,
          order_date: ord.orderDate,
          project_id: project.project_id,
        },
        orderItems,
      );
    }
  }
}
