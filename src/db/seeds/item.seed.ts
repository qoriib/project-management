import { itemRepo, itemCategoryRepo, unitRepo } from "@/db/repositories";

interface SeedItem {
  itemName: string;
  category: string;
  unit: string;
}

export async function seedItems(): Promise<void> {
  const items: SeedItem[] = [
    { itemName: "Semen Portland 50 Kg", category: "Bahan", unit: "Zak" },
    { itemName: "Semen Putih 40 Kg", category: "Bahan", unit: "Zak" },
    { itemName: "Perekat Bata Ringan / Mortar 40 Kg", category: "Bahan", unit: "Zak" },
    { itemName: "Pasir Pasang", category: "Bahan", unit: "M3" },
    { itemName: "Pasir Beton", category: "Bahan", unit: "M3" },
    { itemName: "Batu Pecah / Split 1/2", category: "Bahan", unit: "M3" },
    { itemName: "Batu Kali", category: "Bahan", unit: "M3" },
    { itemName: "Besi Beton Polos 8mm x 12m", category: "Bahan", unit: "Btg" },
    { itemName: "Besi Beton Polos 10mm x 12m", category: "Bahan", unit: "Btg" },
    { itemName: "Besi Beton Ulir 13mm x 12m", category: "Bahan", unit: "Btg" },
    { itemName: "Besi Beton Ulir 16mm x 12m", category: "Bahan", unit: "Btg" },
    { itemName: "Kawat Bendrat", category: "Bahan", unit: "Kg" },
    { itemName: "Triplek / Multiplek 9mm", category: "Bahan", unit: "Lembar" },
    { itemName: "Triplek / Multiplek 12mm", category: "Bahan", unit: "Lembar" },
    { itemName: "Kaso 5/7 Meranti", category: "Bahan", unit: "Btg" },
    { itemName: "Papan Cor 2/20 Meranti", category: "Bahan", unit: "Lembar" },
    { itemName: "Cat Tembok Interior 25kg (Pail)", category: "Bahan", unit: "Pail" },
    { itemName: "Cat Tembok Eksterior 20L", category: "Bahan", unit: "Pail" },
    { itemName: "Waterproofing 20kg", category: "Bahan", unit: "Pail" },
    { itemName: "Pipa PVC 4 inch tipe AW", category: "Bahan", unit: "Btg" },
    { itemName: "Pipa PVC 1/2 inch tipe AW", category: "Bahan", unit: "Btg" },
    { itemName: "Kabel NYM 3x2.5mm", category: "Bahan", unit: "Roll" },
    { itemName: "Lampu Downlight LED 12W", category: "Bahan", unit: "Unit" },
    { itemName: "Granit Tile 60x60 (Cream)", category: "Bahan", unit: "M2" },
    { itemName: "Keramik Dinding 30x60", category: "Bahan", unit: "M2" },
    { itemName: "Sewa Excavator PC100", category: "Alat", unit: "Jam" },
    { itemName: "Sewa Concrete Pump", category: "Alat", unit: "Hari" },
    { itemName: "Tukang Batu / Pekerja", category: "Operasional", unit: "Hari" },
    { itemName: "Mandor", category: "Operasional", unit: "Hari" }
  ];

  const categories = await itemCategoryRepo.findAll();
  const units = await unitRepo.findAll();

  const catMap = new Map<string, string>(categories.map(c => [c.category_name, c.category_id]));
  const unitMap = new Map<string, string>(units.map(u => [u.unit_name, u.unit_id]));

  for (const it of items) {
    const exists = await itemRepo.exists({ item_name: it.itemName }, true);
    if (!exists) {
      let catId = catMap.get(it.category);
      if (!catId) {
        catId = await itemCategoryRepo.create({ category_name: it.category });
        catMap.set(it.category, catId);
      }

      let unitId = unitMap.get(it.unit);
      if (!unitId) {
        unitId = await unitRepo.create({ unit_name: it.unit });
        unitMap.set(it.unit, unitId);
      }

      await itemRepo.create({
        item_name: it.itemName,
        category_id: catId,
        unit_id: unitId
      });
    }
  }
}
