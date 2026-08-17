import { bomRepo, projectRepo, itemRepo, itemPriceRepo, bomGroupRepo } from "@/db/repositories";

interface SeedBOMRaw {
  projectName: string;
  itemName: string;
  /** Used to match against item_prices.price to find the correct item_price_id */
  price: number;
  qty: number;
}

export async function seedBOMs(): Promise<void> {
  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi";
  const p2 = "Renovasi Interior Kantor PT. xyz";
  const p3 = "Pembangunan Gudang Logistik Cikarang";

  const rawBoms: SeedBOMRaw[] = [
    // PROYEK 1: Rumah Tinggal 2 Lantai
    { projectName: p1, itemName: "Sewa Excavator PC100", price: 180000, qty: 40 },
    { projectName: p1, itemName: "Tukang Batu / Pekerja", price: 150000, qty: 14 },
    { projectName: p1, itemName: "Mandor", price: 250000, qty: 14 },
    { projectName: p1, itemName: "Semen Portland 50 Kg", price: 75000, qty: 350 }, // 200 + 150
    { projectName: p1, itemName: "Pasir Beton", price: 300000, qty: 15 },
    { projectName: p1, itemName: "Batu Pecah / Split 1/2", price: 350000, qty: 15 },
    { projectName: p1, itemName: "Besi Beton Polos 8mm x 12m", price: 45000, qty: 100 },
    { projectName: p1, itemName: "Besi Beton Polos 10mm x 12m", price: 72000, qty: 150 },
    { projectName: p1, itemName: "Besi Beton Ulir 13mm x 12m", price: 115000, qty: 200 },
    { projectName: p1, itemName: "Kawat Bendrat", price: 22000, qty: 20 },
    { projectName: p1, itemName: "Papan Cor 2/20 Meranti", price: 25000, qty: 50 },
    { projectName: p1, itemName: "Kaso 5/7 Meranti", price: 35000, qty: 200 }, // 100 + 100
    { projectName: p1, itemName: "Sewa Concrete Pump", price: 4500000, qty: 2 },
    { projectName: p1, itemName: "Pasir Pasang", price: 250000, qty: 20 },
    { projectName: p1, itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 90000, qty: 100 },
    { projectName: p1, itemName: "Triplek / Multiplek 9mm", price: 110000, qty: 50 },
    { projectName: p1, itemName: "Granit Tile 60x60 (Cream)", price: 185000, qty: 120 },
    { projectName: p1, itemName: "Keramik Dinding 30x60", price: 95000, qty: 40 },
    { projectName: p1, itemName: "Semen Putih 40 Kg", price: 85000, qty: 10 },
    { projectName: p1, itemName: "Pipa PVC 4 inch tipe AW", price: 150000, qty: 10 },
    { projectName: p1, itemName: "Pipa PVC 1/2 inch tipe AW", price: 35000, qty: 25 },
    { projectName: p1, itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 5 },
    { projectName: p1, itemName: "Lampu Downlight LED 12W", price: 55000, qty: 30 },
    { projectName: p1, itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 15 },
    { projectName: p1, itemName: "Cat Tembok Eksterior 20L", price: 1250000, qty: 10 },
    { projectName: p1, itemName: "Waterproofing 20kg", price: 750000, qty: 5 },

    // PROYEK 2: Interior Kantor PT. xyz
    { projectName: p2, itemName: "Tukang Batu / Pekerja", price: 150000, qty: 20 },
    { projectName: p2, itemName: "Triplek / Multiplek 12mm", price: 145000, qty: 160 }, // 60 + 100
    { projectName: p2, itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 10 },
    { projectName: p2, itemName: "Lampu Downlight LED 12W", price: 55000, qty: 50 },
    { projectName: p2, itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 5 },

    // PROYEK 3: Gudang Logistik Cikarang
    { projectName: p3, itemName: "Sewa Excavator PC100", price: 200000, qty: 120 },
    { projectName: p3, itemName: "Pasir Pasang", price: 250000, qty: 50 },
    { projectName: p3, itemName: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 500 },
    { projectName: p3, itemName: "Sewa Concrete Pump", price: 4500000, qty: 5 }
  ];

  const projects = await projectRepo.findAll();
  const items = await itemRepo.findAll();
  const bomGroups = await bomGroupRepo.findAll();

  const projMap = new Map<string, string>(projects.map(p => [p.project_name, p.project_id]));
  const itemMap = new Map<string, string>(items.map(i => [i.item_name, i.item_id]));

  // Cache item prices to avoid repeated DB calls
  const itemPriceCache = new Map<string, { item_price_id: string; price: number }[]>();

  for (const b of rawBoms) {
    const projectId = projMap.get(b.projectName);
    const itemId = itemMap.get(b.itemName);

    if (!projectId || !itemId) {
      console.warn(`Could not find project '${b.projectName}' or item '${b.itemName}'. Skipping BOM.`);
      continue;
    }

    // Get item prices, use cache
    if (!itemPriceCache.has(itemId)) {
      const prices = await itemPriceRepo.findByItem(itemId);
      itemPriceCache.set(itemId, prices.map(p => ({ item_price_id: p.item_price_id, price: p.price })));
    }
    const prices = itemPriceCache.get(itemId)!;

    // Find best matching price (closest to seed price), fallback to first
    let matchedPrice = prices.find(p => p.price === b.price) ?? prices[0];
    if (!matchedPrice) {
      console.warn(`No item_prices found for item '${b.itemName}'. Skipping BOM.`);
      continue;
    }

    const exists = await bomRepo.exists({
      project_id: projectId,
      item_id: itemId,
      item_price_id: matchedPrice.item_price_id,
    }, true);

    const projectBomGroups = bomGroups.filter(g => g.project_id === projectId);

    if (!exists && projectBomGroups.length > 0) {
      // Pick a random bom_group for this specific project
      const randomGroup = projectBomGroups[Math.floor(Math.random() * projectBomGroups.length)];

      await bomRepo.create({
        project_id: projectId,
        bom_group_id: randomGroup.bom_group_id,
        item_id: itemId,
        item_price_id: matchedPrice.item_price_id,
        qty: b.qty,
      });
    }
  }
}
