import { bomGroupRepo, bomRepo, itemPriceRepo, itemRepo, projectRepo } from "@/db/repositories";

interface SeedBOMRaw {
  projectName: string;
  itemName: string;
  /** Used to match against item_prices.price to find the correct item_price_id */
  price: number;
  qty: number;
}

export async function seedBOMs(): Promise<void> {
  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi",
    p2 = "Renovasi Interior Kantor PT. xyz",
    p3 = "Pembangunan Gudang Logistik Cikarang",
    rawBoms: SeedBOMRaw[] = [
      // PROYEK 1: Rumah Tinggal 2 Lantai
      { itemName: "Sewa Excavator PC100", price: 180000, projectName: p1, qty: 40 },
      { itemName: "Tukang Batu / Pekerja", price: 150000, projectName: p1, qty: 14 },
      { itemName: "Mandor", price: 250000, projectName: p1, qty: 14 },
      { itemName: "Semen Portland 50 Kg", price: 75000, projectName: p1, qty: 350 }, // 200 + 150
      { itemName: "Pasir Beton", price: 300000, projectName: p1, qty: 15 },
      { itemName: "Batu Pecah / Split 1/2", price: 350000, projectName: p1, qty: 15 },
      { itemName: "Besi Beton Polos 8mm x 12m", price: 45000, projectName: p1, qty: 100 },
      { itemName: "Besi Beton Polos 10mm x 12m", price: 72000, projectName: p1, qty: 150 },
      { itemName: "Besi Beton Ulir 13mm x 12m", price: 115000, projectName: p1, qty: 200 },
      { itemName: "Kawat Bendrat", price: 22000, projectName: p1, qty: 20 },
      { itemName: "Papan Cor 2/20 Meranti", price: 25000, projectName: p1, qty: 50 },
      { itemName: "Kaso 5/7 Meranti", price: 35000, projectName: p1, qty: 200 }, // 100 + 100
      { itemName: "Sewa Concrete Pump", price: 4500000, projectName: p1, qty: 2 },
      { itemName: "Pasir Pasang", price: 250000, projectName: p1, qty: 20 },
      { itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 90000, projectName: p1, qty: 100 },
      { itemName: "Triplek / Multiplek 9mm", price: 110000, projectName: p1, qty: 50 },
      { itemName: "Granit Tile 60x60 (Cream)", price: 185000, projectName: p1, qty: 120 },
      { itemName: "Keramik Dinding 30x60", price: 95000, projectName: p1, qty: 40 },
      { itemName: "Semen Putih 40 Kg", price: 85000, projectName: p1, qty: 10 },
      { itemName: "Pipa PVC 4 inch tipe AW", price: 150000, projectName: p1, qty: 10 },
      { itemName: "Pipa PVC 1/2 inch tipe AW", price: 35000, projectName: p1, qty: 25 },
      { itemName: "Kabel NYM 3x2.5mm", price: 650000, projectName: p1, qty: 5 },
      { itemName: "Lampu Downlight LED 12W", price: 55000, projectName: p1, qty: 30 },
      { itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, projectName: p1, qty: 15 },
      { itemName: "Cat Tembok Eksterior 20L", price: 1250000, projectName: p1, qty: 10 },
      { itemName: "Waterproofing 20kg", price: 750000, projectName: p1, qty: 5 },

      // PROYEK 2: Interior Kantor PT. xyz
      { itemName: "Tukang Batu / Pekerja", price: 150000, projectName: p2, qty: 20 },
      { itemName: "Triplek / Multiplek 12mm", price: 145000, projectName: p2, qty: 160 }, // 60 + 100
      { itemName: "Kabel NYM 3x2.5mm", price: 650000, projectName: p2, qty: 10 },
      { itemName: "Lampu Downlight LED 12W", price: 55000, projectName: p2, qty: 50 },
      { itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, projectName: p2, qty: 5 },

      // PROYEK 3: Gudang Logistik Cikarang
      { itemName: "Sewa Excavator PC100", price: 200000, projectName: p3, qty: 120 },
      { itemName: "Pasir Pasang", price: 250000, projectName: p3, qty: 50 },
      { itemName: "Besi Beton Ulir 16mm x 12m", price: 165000, projectName: p3, qty: 500 },
      { itemName: "Sewa Concrete Pump", price: 4500000, projectName: p3, qty: 5 },
    ],
    projects = await projectRepo.findAll(),
    items = await itemRepo.findAll(),
    bomGroups = await bomGroupRepo.findAll(),
    projMap = new Map<string, string>(projects.map((p) => [p.project_name, p.project_id])),
    itemMap = new Map<string, string>(items.map((i) => [i.item_name, i.item_id])),
    // Cache item prices to avoid repeated DB calls
    itemPriceCache = new Map<string, { item_price_id: string; price: number }[]>();

  for (const b of rawBoms) {
    const projectId = projMap.get(b.projectName),
      itemId = itemMap.get(b.itemName);

    if (!projectId || !itemId) {
      console.warn(
        `Could not find project '${b.projectName}' or item '${b.itemName}'. Skipping BOM.`,
      );
      continue;
    }

    // Get item prices, use cache
    if (!itemPriceCache.has(itemId)) {
      const prices = await itemPriceRepo.findByItem(itemId);
      itemPriceCache.set(
        itemId,
        prices.map((p) => ({ item_price_id: p.item_price_id, price: p.price })),
      );
    }
    const prices = itemPriceCache.get(itemId)!;

    // Find best matching price (closest to seed price), fallback to first
    const matchedPrice = prices.find((p) => p.price === b.price) ?? prices[0];
    if (!matchedPrice) {
      console.warn(`No item_prices found for item '${b.itemName}'. Skipping BOM.`);
      continue;
    }

    const exists = await bomRepo.exists(
        {
          item_id: itemId,
          item_price_id: matchedPrice.item_price_id,
          project_id: projectId,
        },
        true,
      ),
      projectBomGroups = bomGroups.filter((g) => g.project_id === projectId);

    if (!exists && projectBomGroups.length > 0) {
      // Pick a random bom_group for this specific project
      const randomGroup = projectBomGroups[Math.floor(Math.random() * projectBomGroups.length)];

      await bomRepo.create({
        bom_group_id: randomGroup.bom_group_id,
        item_id: itemId,
        item_price_id: matchedPrice.item_price_id,
        project_id: projectId,
        qty: b.qty,
      });
    }
  }
}
