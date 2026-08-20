import { itemPriceRepo, itemRepo, projectRepo, orderRepo, vendorRepo } from "@/db/repositories";

interface SeedOrderItemRaw {
  itemName: string;
  price: number;
  qty: number;
  hasTax?: boolean;
}

interface SeedOrderRaw {
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
    // PROYEK 1:
    {
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
      orderDate: "2026-03-01",
      projectName: p1,
      vendorName: "Sewa Alat Berat Nusantara",
    },
    {
      items: [
        // HIGHER than BOM (78k vs 75k)
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 300, hasTax: true },
        // LOWER than BOM (280k vs 300k)
        { itemName: "Pasir Beton", price: 280000, qty: 15, hasTax: false },
        // HIGHER than BOM (265k vs 250k)
        { itemName: "Pasir Pasang", price: 265000, qty: 20, hasTax: false },
        // HIGHER than BOM (95k vs 90k)
        {
          itemName: "Perekat Bata Ringan / Mortar 40 Kg",
          price: 95000,
          qty: 80,
          hasTax: true,
        },
        // LOWER than BOM (80k vs 85k)
        { itemName: "Semen Putih 40 Kg", price: 80000, qty: 10, hasTax: true },
      ],
      orderDate: "2026-03-05",
      projectName: p1,
      vendorName: "TB. Sinar Bangunan",
    },
    {
      items: [
        // LOWER than BOM (335k vs 350k)
        { itemName: "Batu Pecah / Split 1/2", price: 335000, qty: 15, hasTax: false },
        // EQUAL to BOM (25k)
        { itemName: "Papan Cor 2/20 Meranti", price: 25000, qty: 50, hasTax: false },
        // HIGHER than BOM (38k vs 35k)
        { itemName: "Kaso 5/7 Meranti", price: 38000, qty: 200, hasTax: false },
        // LOWER than BOM (102k vs 110k)
        { itemName: "Triplek / Multiplek 9mm", price: 102000, qty: 50, hasTax: true },
        // UNPLANNED (Item tidak ada di BOM Proyek 1)
        { itemName: "Batu Kali", price: 195000, qty: 12, hasTax: false },
      ],
      orderDate: "2026-03-10",
      projectName: p1,
      vendorName: "CV. Sumber Pasir",
    },
    {
      items: [
        // LOWER than BOM (42k vs 45k)
        { itemName: "Besi Beton Polos 8mm x 12m", price: 42000, qty: 100, hasTax: true },
        // HIGHER than BOM (76k vs 72k)
        { itemName: "Besi Beton Polos 10mm x 12m", price: 76000, qty: 150, hasTax: true },
        // HIGHER than BOM (122k vs 115k)
        { itemName: "Besi Beton Ulir 13mm x 12m", price: 122000, qty: 150, hasTax: true },
        // LOWER than BOM (20k vs 22k)
        { itemName: "Kawat Bendrat", price: 20000, qty: 20, hasTax: false },
        // UNPLANNED (Item tidak ada di BOM Proyek 1)
        { itemName: "Besi Beton Ulir 16mm x 12m", price: 175000, qty: 10, hasTax: true },
      ],
      orderDate: "2026-03-12",
      projectName: p1,
      vendorName: "PT. Baja Jaya Nusantara",
    },
    {
      items: [
        // HIGHER than BOM (195k vs 185k)
        { itemName: "Granit Tile 60x60 (Cream)", price: 195000, qty: 120, hasTax: true },
        // LOWER than BOM (88k vs 95k)
        { itemName: "Keramik Dinding 30x60", price: 88000, qty: 40, hasTax: true },
        // LOWER than BOM (140k vs 150k)
        { itemName: "Pipa PVC 4 inch tipe AW", price: 140000, qty: 10, hasTax: false },
        // HIGHER than BOM (38k vs 35k)
        { itemName: "Pipa PVC 1/2 inch tipe AW", price: 38000, qty: 25, hasTax: false },
        // LOWER than BOM (620k vs 650k)
        { itemName: "Kabel NYM 3x2.5mm", price: 620000, qty: 5, hasTax: true },
        // HIGHER than BOM (60k vs 55k)
        { itemName: "Lampu Downlight LED 12W", price: 60000, qty: 30, hasTax: true },
        // UNPLANNED (Item tidak ada di BOM Proyek 1)
        { itemName: "Triplek / Multiplek 12mm", price: 155000, qty: 10, hasTax: false },
      ],
      orderDate: "2026-04-05",
      projectName: p1,
      vendorName: "PT. Keramik Indah",
    },
    {
      items: [
        // HIGHER than BOM (900k vs 850k)
        {
          itemName: "Cat Tembok Interior 25kg (Pail)",
          price: 900000,
          qty: 15,
          hasTax: true,
        },
        // LOWER than BOM (1.18jt vs 1.25jt)
        { itemName: "Cat Tembok Eksterior 20L", price: 1180000, qty: 10, hasTax: true },
        // HIGHER than BOM (800k vs 750k)
        { itemName: "Waterproofing 20kg", price: 800000, qty: 5, hasTax: true },
      ],
      orderDate: "2026-04-15",
      projectName: p1,
      vendorName: "Toko Cat Warna Indah",
    },
    {
      items: [
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 20, hasTax: false },
        { itemName: "Triplek / Multiplek 12mm", price: 145000, qty: 160, hasTax: true },
        {
          itemName: "Cat Tembok Interior 25kg (Pail)",
          price: 850000,
          qty: 5,
          hasTax: true,
        },
      ],
      orderDate: "2026-04-20",
      projectName: p2,
      vendorName: "Sewa Alat Berat Nusantara",
    },
    {
      items: [
        { itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 10, hasTax: true },
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 50, hasTax: true },
      ],
      orderDate: "2026-04-25",
      projectName: p2,
      vendorName: "TB. Sinar Bangunan",
    },
    {
      items: [
        { itemName: "Sewa Excavator PC100", price: 200000, qty: 100, hasTax: true },
        { itemName: "Sewa Concrete Pump", price: 4500000, qty: 5, hasTax: true },
        { itemName: "Pasir Pasang", price: 250000, qty: 50, hasTax: false },
      ],
      orderDate: "2026-05-10",
      projectName: p3,
      vendorName: "Sewa Alat Berat Nusantara",
    },
    {
      items: [{ itemName: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 400, hasTax: true }],
      orderDate: "2026-05-15",
      projectName: p3,
      vendorName: "PT. Baja Jaya Nusantara",
    },
  ];

  const projects = await projectRepo.findAll();
  const vendors = await vendorRepo.findAll();
  const items = await itemRepo.findAll();
  const projMap = new Map<string, string>(projects.map((p) => [p.project_name, p.project_id]));
  const vendMap = new Map<string, string>(vendors.map((v) => [v.vendor_name, v.vendor_id]));
  const itemMap = new Map<string, string>(items.map((i) => [i.item_name, i.item_id]));
  const itemPriceCache = new Map<string, { item_price_id: string; price: number }[]>();

  for (const order of orders) {
    const projectId = projMap.get(order.projectName);
    const vendorId = vendMap.get(order.vendorName);

    if (!projectId || !vendorId) {
      continue;
    }

    const exists = await orderRepo.exists(
      {
        order_date: order.orderDate,
        project_id: projectId,
      },
      true,
    );

    if (!exists) {
      const dbItems = await Promise.all(
        order.items.map(async (it) => {
          const itemId = itemMap.get(it.itemName);

          if (!itemId) {
            throw new Error(`Item ${it.itemName} not found`);
          }

          // Get/cache prices for this item
          if (!itemPriceCache.has(itemId)) {
            const prices = await itemPriceRepo.findByItem(itemId);
            itemPriceCache.set(
              itemId,
              prices.map((p) => ({
                item_price_id: p.item_price_id,
                price: p.price,
              })),
            );
          }

          const prices = itemPriceCache.get(itemId)!;
          const matched = prices.find((p) => p.price === it.price) ?? prices[0];

          if (!matched) {
            throw new Error(`No item_prices found for item ${it.itemName}`);
          }

          return {
            item_id: itemId,
            item_price_id: matched.item_price_id,
            qty: it.qty,
            vendor_id: vendorId,
            has_tax: it.hasTax ? 1 : 0,
          };
        }),
      );

      const timestamp = new Date(order.orderDate).getTime().toString().slice(-4);
      const generatedOrderCode = `ORDER/${timestamp}`;

      await orderRepo.createWithItems(
        {
          order_code: generatedOrderCode,
          order_date: order.orderDate,
          project_id: projectId,
        },
        dbItems,
      );
    }
  }
}
