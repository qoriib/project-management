import { itemPriceRepo, itemRepo, projectRepo, orderRepo, vendorRepo } from "@/db/repositories";

interface SeedOrderItemRaw {
  itemName: string;
  price: number;
  qty: number;
}

interface SeedOrderRaw {
  projectName: string;
  orderDate: string;
  vendorName: string;
  hasTax: boolean;
  items: SeedOrderItemRaw[];
}

export async function seedOrders(): Promise<void> {
  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi";
  const p2 = "Renovasi Interior Kantor PT. xyz";
  const p3 = "Pembangunan Gudang Logistik Cikarang";
  const orders: SeedOrderRaw[] = [
    {
      items: [
        { itemName: "Sewa Excavator PC100", price: 180000, qty: 40 },
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 14 },
        { itemName: "Mandor", price: 250000, qty: 14 },
        { itemName: "Sewa Concrete Pump", price: 4500000, qty: 2 },
      ],
      orderDate: "2026-03-01",
      projectName: p1,
      vendorName: "Sewa Alat Berat Nusantara",
      hasTax: true,
    },
    {
      items: [
        { itemName: "Semen Portland 50 Kg", price: 76000, qty: 300 },
        { itemName: "Pasir Beton", price: 290000, qty: 15 },
        { itemName: "Pasir Pasang", price: 240000, qty: 20 },
        {
          itemName: "Perekat Bata Ringan / Mortar 40 Kg",
          price: 92000,
          qty: 80,
        },
        { itemName: "Semen Putih 40 Kg", price: 85000, qty: 10 },
      ],
      orderDate: "2026-03-05",
      projectName: p1,
      vendorName: "TB. Sinar Bangunan",
      hasTax: false,
    },
    {
      items: [
        { itemName: "Batu Pecah / Split 1/2", price: 345000, qty: 15 },
        { itemName: "Papan Cor 2/20 Meranti", price: 25000, qty: 50 },
        { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 200 },
        { itemName: "Triplek / Multiplek 9mm", price: 110000, qty: 50 },
      ],
      orderDate: "2026-03-10",
      projectName: p1,
      vendorName: "CV. Sumber Pasir",
      hasTax: false,
    },
    {
      items: [
        { itemName: "Besi Beton Polos 8mm x 12m", price: 44000, qty: 100 },
        { itemName: "Besi Beton Polos 10mm x 12m", price: 71000, qty: 150 },
        { itemName: "Besi Beton Ulir 13mm x 12m", price: 116000, qty: 150 },
        { itemName: "Kawat Bendrat", price: 22000, qty: 20 },
      ],
      orderDate: "2026-03-12",
      projectName: p1,
      vendorName: "PT. Baja Jaya Nusantara",
      hasTax: true,
    },
    {
      items: [
        { itemName: "Granit Tile 60x60 (Cream)", price: 185000, qty: 120 },
        { itemName: "Keramik Dinding 30x60", price: 95000, qty: 40 },
        { itemName: "Pipa PVC 4 inch tipe AW", price: 150000, qty: 10 },
        { itemName: "Pipa PVC 1/2 inch tipe AW", price: 35000, qty: 25 },
        { itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 5 },
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 30 },
      ],
      orderDate: "2026-04-05",
      projectName: p1,
      vendorName: "PT. Keramik Indah",
      hasTax: true,
    },
    {
      items: [
        {
          itemName: "Cat Tembok Interior 25kg (Pail)",
          price: 850000,
          qty: 15,
        },
        { itemName: "Cat Tembok Eksterior 20L", price: 1250000, qty: 10 },
        { itemName: "Waterproofing 20kg", price: 750000, qty: 5 },
      ],
      orderDate: "2026-04-15",
      projectName: p1,
      vendorName: "Toko Cat Warna Indah",
      hasTax: false,
    },
    {
      items: [
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 20 },
        { itemName: "Triplek / Multiplek 12mm", price: 145000, qty: 160 },
        {
          itemName: "Cat Tembok Interior 25kg (Pail)",
          price: 850000,
          qty: 5,
        },
      ],
      orderDate: "2026-04-20",
      projectName: p2,
      vendorName: "Sewa Alat Berat Nusantara",
      hasTax: true,
    },
    {
      items: [
        { itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 10 },
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 50 },
      ],
      orderDate: "2026-04-25",
      projectName: p2,
      vendorName: "TB. Sinar Bangunan",
      hasTax: false,
    },
    {
      items: [
        { itemName: "Sewa Excavator PC100", price: 200000, qty: 100 },
        { itemName: "Sewa Concrete Pump", price: 4500000, qty: 5 },
        { itemName: "Pasir Pasang", price: 250000, qty: 50 },
      ],
      orderDate: "2026-05-10",
      projectName: p3,
      vendorName: "Sewa Alat Berat Nusantara",
      hasTax: true,
    },
    {
      items: [{ itemName: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 400 }],
      orderDate: "2026-05-15",
      projectName: p3,
      vendorName: "PT. Baja Jaya Nusantara",
      hasTax: false,
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
          has_tax: order.hasTax ? 1 : 0,
        },
        dbItems,
      );
    }
  }
}
