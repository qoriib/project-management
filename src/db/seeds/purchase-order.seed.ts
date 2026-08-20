import {
  itemPriceRepo,
  itemRepo,
  projectRepo,
  purchaseOrderRepo,
  vendorRepo,
} from "@/db/repositories";

interface SeedPOItemRaw {
  itemName: string;
  /** Used to find matching item_price_id */
  price: number;
  qty: number;
}

interface SeedPORaw {
  projectName: string;
  poDate: string;
  vendorName: string;
  items: SeedPOItemRaw[];
}

export async function seedPurchaseOrders(): Promise<void> {
  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi",
    p2 = "Renovasi Interior Kantor PT. xyz",
    p3 = "Pembangunan Gudang Logistik Cikarang",
    pos: SeedPORaw[] = [
      {
        items: [
          { itemName: "Sewa Excavator PC100", price: 180000, qty: 40 },
          { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 14 },
          { itemName: "Mandor", price: 250000, qty: 14 },
          { itemName: "Sewa Concrete Pump", price: 4500000, qty: 2 },
        ],
        poDate: "2026-03-01",
        projectName: p1,
        vendorName: "Sewa Alat Berat Nusantara",
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
        poDate: "2026-03-05",
        projectName: p1,
        vendorName: "TB. Sinar Bangunan",
      },
      {
        items: [
          { itemName: "Batu Pecah / Split 1/2", price: 345000, qty: 15 },
          { itemName: "Papan Cor 2/20 Meranti", price: 25000, qty: 50 },
          { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 200 },
          { itemName: "Triplek / Multiplek 9mm", price: 110000, qty: 50 },
        ],
        poDate: "2026-03-10",
        projectName: p1,
        vendorName: "CV. Sumber Pasir",
      },
      {
        items: [
          { itemName: "Besi Beton Polos 8mm x 12m", price: 44000, qty: 100 },
          { itemName: "Besi Beton Polos 10mm x 12m", price: 71000, qty: 150 },
          { itemName: "Besi Beton Ulir 13mm x 12m", price: 116000, qty: 150 },
          { itemName: "Kawat Bendrat", price: 22000, qty: 20 },
        ],
        poDate: "2026-03-12",
        projectName: p1,
        vendorName: "PT. Baja Jaya Nusantara",
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
        poDate: "2026-04-05",
        projectName: p1,
        vendorName: "PT. Keramik Indah",
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
        poDate: "2026-04-15",
        projectName: p1,
        vendorName: "Toko Cat Warna Indah",
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
        poDate: "2026-04-20",
        projectName: p2,
        vendorName: "Sewa Alat Berat Nusantara",
      },
      {
        items: [
          { itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 10 },
          { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 50 },
        ],
        poDate: "2026-04-25",
        projectName: p2,
        vendorName: "TB. Sinar Bangunan",
      },
      {
        items: [
          { itemName: "Sewa Excavator PC100", price: 200000, qty: 100 },
          { itemName: "Sewa Concrete Pump", price: 4500000, qty: 5 },
          { itemName: "Pasir Pasang", price: 250000, qty: 50 },
        ],
        poDate: "2026-05-10",
        projectName: p3,
        vendorName: "Sewa Alat Berat Nusantara",
      },
      {
        items: [
          { itemName: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 400 },
        ],
        poDate: "2026-05-15",
        projectName: p3,
        vendorName: "PT. Baja Jaya Nusantara",
      },
    ],
    projects = await projectRepo.findAll(),
    vendors = await vendorRepo.findAll(),
    items = await itemRepo.findAll(),
    projMap = new Map<string, string>(
      projects.map((p) => [p.project_name, p.project_id]),
    ),
    vendMap = new Map<string, string>(
      vendors.map((v) => [v.vendor_name, v.vendor_id]),
    ),
    itemMap = new Map<string, string>(
      items.map((i) => [i.item_name, i.item_id]),
    ),
    // Cache item prices
    itemPriceCache = new Map<
      string,
      { item_price_id: string; price: number }[]
    >();

  for (const po of pos) {
    const projectId = projMap.get(po.projectName),
      vendorId = vendMap.get(po.vendorName);
    if (!projectId || !vendorId) {
      continue;
    }

    const exists = await purchaseOrderRepo.exists(
      {
        po_date: po.poDate,
        project_id: projectId,
      },
      true,
    );

    if (!exists) {
      const dbItems = await Promise.all(
          po.items.map(async (it) => {
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
            const prices = itemPriceCache.get(itemId)!,
              // Match closest price; fallback to first
              matched = prices.find((p) => p.price === it.price) ?? prices[0];
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
        ),
        timestamp = new Date(po.poDate).getTime().toString().slice(-4),
        generatedPoCode = `PO/${timestamp}`;

      await purchaseOrderRepo.createWithItems(
        { po_code: generatedPoCode, po_date: po.poDate, project_id: projectId },
        dbItems,
      );
    }
  }
}
