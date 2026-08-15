import { bomRepo, projectRepo, itemRepo, itemPriceRepo } from "@/db/repositories";

interface SeedBOMRaw {
  projectName: string;
  stageName: string;
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
    // Tahap 1: Persiapan & Tanah
    { projectName: p1, stageName: "Pekerjaan Persiapan & Tanah", itemName: "Sewa Excavator PC100", price: 180000, qty: 40 },
    { projectName: p1, stageName: "Pekerjaan Persiapan & Tanah", itemName: "Tukang Batu / Pekerja", price: 150000, qty: 14 },
    { projectName: p1, stageName: "Pekerjaan Persiapan & Tanah", itemName: "Mandor", price: 250000, qty: 14 },
    // Tahap 2: Pondasi & Beton Bertulang
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Semen Portland 50 Kg", price: 75000, qty: 200 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Pasir Beton", price: 300000, qty: 15 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Batu Pecah / Split 1/2", price: 350000, qty: 15 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Besi Beton Polos 8mm x 12m", price: 45000, qty: 100 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Besi Beton Polos 10mm x 12m", price: 72000, qty: 150 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Besi Beton Ulir 13mm x 12m", price: 115000, qty: 200 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Kawat Bendrat", price: 22000, qty: 20 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Papan Cor 2/20 Meranti", price: 25000, qty: 50 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Kaso 5/7 Meranti", price: 35000, qty: 100 },
    { projectName: p1, stageName: "Pekerjaan Pondasi & Beton Bertulang", itemName: "Sewa Concrete Pump", price: 4500000, qty: 2 },
    // Tahap 3: Pasangan Dinding & Plesteran
    { projectName: p1, stageName: "Pekerjaan Pasangan Dinding & Plesteran", itemName: "Semen Portland 50 Kg", price: 75000, qty: 150 },
    { projectName: p1, stageName: "Pekerjaan Pasangan Dinding & Plesteran", itemName: "Pasir Pasang", price: 250000, qty: 20 },
    { projectName: p1, stageName: "Pekerjaan Pasangan Dinding & Plesteran", itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 90000, qty: 100 },
    // Tahap 4: Atap & Plafon
    { projectName: p1, stageName: "Pekerjaan Atap & Plafon", itemName: "Triplek / Multiplek 9mm", price: 110000, qty: 50 },
    { projectName: p1, stageName: "Pekerjaan Atap & Plafon", itemName: "Kaso 5/7 Meranti", price: 35000, qty: 100 },
    // Tahap 5: Lantai & Keramik
    { projectName: p1, stageName: "Pekerjaan Lantai & Keramik", itemName: "Granit Tile 60x60 (Cream)", price: 185000, qty: 120 },
    { projectName: p1, stageName: "Pekerjaan Lantai & Keramik", itemName: "Keramik Dinding 30x60", price: 95000, qty: 40 },
    { projectName: p1, stageName: "Pekerjaan Lantai & Keramik", itemName: "Semen Putih 40 Kg", price: 85000, qty: 10 },
    // Tahap 6: Elektrikal & Plumbing
    { projectName: p1, stageName: "Pekerjaan Elektrikal & Plumbing", itemName: "Pipa PVC 4 inch tipe AW", price: 150000, qty: 10 },
    { projectName: p1, stageName: "Pekerjaan Elektrikal & Plumbing", itemName: "Pipa PVC 1/2 inch tipe AW", price: 35000, qty: 25 },
    { projectName: p1, stageName: "Pekerjaan Elektrikal & Plumbing", itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 5 },
    { projectName: p1, stageName: "Pekerjaan Elektrikal & Plumbing", itemName: "Lampu Downlight LED 12W", price: 55000, qty: 30 },
    // Tahap 7: Pengecatan & Finishing
    { projectName: p1, stageName: "Pekerjaan Pengecatan & Finishing", itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 15 },
    { projectName: p1, stageName: "Pekerjaan Pengecatan & Finishing", itemName: "Cat Tembok Eksterior 20L", price: 1250000, qty: 10 },
    { projectName: p1, stageName: "Pekerjaan Pengecatan & Finishing", itemName: "Waterproofing 20kg", price: 750000, qty: 5 },

    // PROYEK 2: Interior Kantor PT. xyz
    { projectName: p2, stageName: "Pekerjaan Pembongkaran (Demolisi)", itemName: "Tukang Batu / Pekerja", price: 150000, qty: 20 },
    { projectName: p2, stageName: "Pekerjaan Partisi Kaca & Gypsum", itemName: "Triplek / Multiplek 12mm", price: 145000, qty: 60 },
    { projectName: p2, stageName: "Pekerjaan ME (Mechanical Electrical)", itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 10 },
    { projectName: p2, stageName: "Pekerjaan ME (Mechanical Electrical)", itemName: "Lampu Downlight LED 12W", price: 55000, qty: 50 },
    { projectName: p2, stageName: "Pekerjaan Custom Furniture", itemName: "Triplek / Multiplek 12mm", price: 145000, qty: 100 },
    { projectName: p2, stageName: "Pekerjaan Custom Furniture", itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 5 },

    // PROYEK 3: Gudang Logistik Cikarang
    { projectName: p3, stageName: "Pekerjaan Tanah & Cut and Fill", itemName: "Sewa Excavator PC100", price: 200000, qty: 120 },
    { projectName: p3, stageName: "Pekerjaan Tanah & Cut and Fill", itemName: "Pasir Pasang", price: 250000, qty: 50 },
    { projectName: p3, stageName: "Pekerjaan Struktur", itemName: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 500 },
    { projectName: p3, stageName: "Pekerjaan Struktur", itemName: "Sewa Concrete Pump", price: 4500000, qty: 5 }
  ];

  const projects = await projectRepo.findAll();
  const items = await itemRepo.findAll();

  const projMap = new Map(projects.map(p => [p.project_name, p.project_id]));
  const itemMap = new Map(items.map(i => [i.item_name, i.item_id]));

  const db = (await import("../index")).getDB();
  const allStages = await (await db).select<any[]>("SELECT stage_id, project_id, stage_name FROM project_stages");
  const stageMap = new Map(allStages.map(s => [`${s.project_id}-${s.stage_name}`, s.stage_id]));

  // Cache item prices to avoid repeated DB calls
  const itemPriceCache = new Map<number, { item_price_id: number; price: number }[]>();

  for (const b of rawBoms) {
    const projectId = projMap.get(b.projectName);
    const itemId = itemMap.get(b.itemName);

    if (!projectId || !itemId) {
      console.warn(`Could not find project '${b.projectName}' or item '${b.itemName}'. Skipping BOM.`);
      continue;
    }

    const stageId = stageMap.get(`${projectId}-${b.stageName}`);
    if (!stageId) {
      console.warn(`Could not find stage '${b.stageName}' for project '${b.projectName}'. Skipping BOM.`);
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
      stage_id: stageId,
      item_id: itemId,
      item_price_id: matchedPrice.item_price_id,
    }, true);

    if (!exists) {
      await bomRepo.create({
        project_id: projectId,
        stage_id: stageId,
        item_id: itemId,
        item_price_id: matchedPrice.item_price_id,
        qty: b.qty,
      });
    }
  }
}
