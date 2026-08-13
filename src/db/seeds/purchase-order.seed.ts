import { purchaseOrderRepo, projectRepo, vendorRepo, itemRepo, itemPriceRepo } from "@/db/repositories";

interface SeedPOItemRaw {
  item_name: string;
  /** Used to find matching item_price_id */
  price: number;
  qty: number;
}

interface SeedPORaw {
  project_name: string;
  po_date: string;
  vendor_name: string;
  items: SeedPOItemRaw[];
}

export async function seedPurchaseOrders(): Promise<void> {
  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi";
  const p2 = "Renovasi Interior Kantor PT. xyz";
  const p3 = "Pembangunan Gudang Logistik Cikarang";

  const pos: SeedPORaw[] = [
    {
      project_name: p1,
      po_date: "2026-03-01",
      vendor_name: "Sewa Alat Berat Nusantara",
      items: [
        { item_name: "Sewa Excavator PC100", price: 180000, qty: 40 },
        { item_name: "Tukang Batu / Pekerja", price: 150000, qty: 14 },
        { item_name: "Mandor", price: 250000, qty: 14 },
        { item_name: "Sewa Concrete Pump", price: 4500000, qty: 2 }
      ]
    },
    {
      project_name: p1,
      po_date: "2026-03-05",
      vendor_name: "TB. Sinar Bangunan",
      items: [
        { item_name: "Semen Portland 50 Kg", price: 76000, qty: 300 },
        { item_name: "Pasir Beton", price: 290000, qty: 15 },
        { item_name: "Pasir Pasang", price: 240000, qty: 20 },
        { item_name: "Perekat Bata Ringan / Mortar 40 Kg", price: 92000, qty: 80 },
        { item_name: "Semen Putih 40 Kg", price: 85000, qty: 10 }
      ]
    },
    {
      project_name: p1,
      po_date: "2026-03-10",
      vendor_name: "CV. Sumber Pasir",
      items: [
        { item_name: "Batu Pecah / Split 1/2", price: 345000, qty: 15 },
        { item_name: "Papan Cor 2/20 Meranti", price: 25000, qty: 50 },
        { item_name: "Kaso 5/7 Meranti", price: 35000, qty: 200 },
        { item_name: "Triplek / Multiplek 9mm", price: 110000, qty: 50 }
      ]
    },
    {
      project_name: p1,
      po_date: "2026-03-12",
      vendor_name: "PT. Baja Jaya Nusantara",
      items: [
        { item_name: "Besi Beton Polos 8mm x 12m", price: 44000, qty: 100 },
        { item_name: "Besi Beton Polos 10mm x 12m", price: 71000, qty: 150 },
        { item_name: "Besi Beton Ulir 13mm x 12m", price: 116000, qty: 150 },
        { item_name: "Kawat Bendrat", price: 22000, qty: 20 }
      ]
    },
    {
      project_name: p1,
      po_date: "2026-04-05",
      vendor_name: "PT. Keramik Indah",
      items: [
        { item_name: "Granit Tile 60x60 (Cream)", price: 185000, qty: 120 },
        { item_name: "Keramik Dinding 30x60", price: 95000, qty: 40 },
        { item_name: "Pipa PVC 4 inch tipe AW", price: 150000, qty: 10 },
        { item_name: "Pipa PVC 1/2 inch tipe AW", price: 35000, qty: 25 },
        { item_name: "Kabel NYM 3x2.5mm", price: 650000, qty: 5 },
        { item_name: "Lampu Downlight LED 12W", price: 55000, qty: 30 }
      ]
    },
    {
      project_name: p1,
      po_date: "2026-04-15",
      vendor_name: "Toko Cat Warna Indah",
      items: [
        { item_name: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 15 },
        { item_name: "Cat Tembok Eksterior 20L", price: 1250000, qty: 10 },
        { item_name: "Waterproofing 20kg", price: 750000, qty: 5 }
      ]
    },
    {
      project_name: p2,
      po_date: "2026-04-20",
      vendor_name: "Sewa Alat Berat Nusantara",
      items: [
        { item_name: "Tukang Batu / Pekerja", price: 150000, qty: 20 },
        { item_name: "Triplek / Multiplek 12mm", price: 145000, qty: 160 },
        { item_name: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 5 }
      ]
    },
    {
      project_name: p2,
      po_date: "2026-04-25",
      vendor_name: "TB. Sinar Bangunan",
      items: [
        { item_name: "Kabel NYM 3x2.5mm", price: 650000, qty: 10 },
        { item_name: "Lampu Downlight LED 12W", price: 55000, qty: 50 }
      ]
    },
    {
      project_name: p3,
      po_date: "2026-05-10",
      vendor_name: "Sewa Alat Berat Nusantara",
      items: [
        { item_name: "Sewa Excavator PC100", price: 200000, qty: 100 },
        { item_name: "Sewa Concrete Pump", price: 4500000, qty: 5 },
        { item_name: "Pasir Pasang", price: 250000, qty: 50 }
      ]
    },
    {
      project_name: p3,
      po_date: "2026-05-15",
      vendor_name: "PT. Baja Jaya Nusantara",
      items: [
        { item_name: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 400 }
      ]
    }
  ];

  const projects = await projectRepo.findAll();
  const vendors = await vendorRepo.findAll();
  const items = await itemRepo.findAll();

  const projMap = new Map(projects.map(p => [p.project_name, p.project_id]));
  const vendMap = new Map(vendors.map(v => [v.vendor_name, v.vendor_id]));
  const itemMap = new Map(items.map(i => [i.item_name, i.item_id]));

  // Cache item prices
  const itemPriceCache = new Map<number, { item_price_id: number; price: number }[]>();

  for (const po of pos) {
    const projectId = projMap.get(po.project_name);
    const vendorId = vendMap.get(po.vendor_name);
    if (!projectId || !vendorId) continue;

    const exists = await purchaseOrderRepo.exists({
      project_id: projectId,
      po_date: po.po_date
    }, true);

    if (!exists) {
      const dbItems = await Promise.all(po.items.map(async it => {
        const itemId = itemMap.get(it.item_name);
        if (!itemId) throw new Error(`Item ${it.item_name} not found`);

        // Get/cache prices for this item
        if (!itemPriceCache.has(itemId)) {
          const prices = await itemPriceRepo.findByItem(itemId);
          itemPriceCache.set(itemId, prices.map(p => ({ item_price_id: p.item_price_id, price: p.price })));
        }
        const prices = itemPriceCache.get(itemId)!;

        // Match closest price; fallback to first
        const matched = prices.find(p => p.price === it.price) ?? prices[0];
        if (!matched) throw new Error(`No item_prices found for item ${it.item_name}`);

        return { item_id: itemId, item_price_id: matched.item_price_id, qty: it.qty, vendor_id: vendorId };
      }));

      await purchaseOrderRepo.createWithItems(
        { project_id: projectId, po_date: po.po_date },
        dbItems
      );
    }
  }
}
