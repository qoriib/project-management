import { itemRepo, itemCategoryRepo, unitRepo } from "@/db/repositories";

interface SeedItem {
  item_name: string;
  category: string;
  unit: string;
}

export async function seedItems(): Promise<void> {
  const items: SeedItem[] = [
    { item_name: "Semen Portland 50 Kg", category: "MATERIAL", unit: "Zak" },
    { item_name: "Semen Putih 40 Kg", category: "MATERIAL", unit: "Zak" },
    { item_name: "Perekat Bata Ringan / Mortar 40 Kg", category: "MATERIAL", unit: "Zak" },
    { item_name: "Pasir Pasang", category: "MATERIAL", unit: "m3" },
    { item_name: "Pasir Beton", category: "MATERIAL", unit: "m3" },
    { item_name: "Batu Pecah / Split 1/2", category: "MATERIAL", unit: "m3" },
    { item_name: "Batu Kali", category: "MATERIAL", unit: "m3" },
    { item_name: "Besi Beton Polos 8mm x 12m", category: "MATERIAL", unit: "Btg" },
    { item_name: "Besi Beton Polos 10mm x 12m", category: "MATERIAL", unit: "Btg" },
    { item_name: "Besi Beton Ulir 13mm x 12m", category: "MATERIAL", unit: "Btg" },
    { item_name: "Besi Beton Ulir 16mm x 12m", category: "MATERIAL", unit: "Btg" },
    { item_name: "Kawat Bendrat", category: "MATERIAL", unit: "Kg" },
    { item_name: "Triplek / Multiplek 9mm", category: "MATERIAL", unit: "Lembar" },
    { item_name: "Triplek / Multiplek 12mm", category: "MATERIAL", unit: "Lembar" },
    { item_name: "Kaso 5/7 Meranti", category: "MATERIAL", unit: "Btg" },
    { item_name: "Papan Cor 2/20 Meranti", category: "MATERIAL", unit: "Lembar" },
    { item_name: "Cat Tembok Interior 25kg (Pail)", category: "MATERIAL", unit: "Pail" },
    { item_name: "Cat Tembok Eksterior 20L", category: "MATERIAL", unit: "Pail" },
    { item_name: "Waterproofing 20kg", category: "MATERIAL", unit: "Pail" },
    { item_name: "Pipa PVC 4 inch tipe AW", category: "MATERIAL", unit: "Btg" },
    { item_name: "Pipa PVC 1/2 inch tipe AW", category: "MATERIAL", unit: "Btg" },
    { item_name: "Kabel NYM 3x2.5mm", category: "MATERIAL", unit: "Roll" },
    { item_name: "Lampu Downlight LED 12W", category: "MATERIAL", unit: "Unit" },
    { item_name: "Granit Tile 60x60 (Cream)", category: "MATERIAL", unit: "m2" },
    { item_name: "Keramik Dinding 30x60", category: "MATERIAL", unit: "m2" },
    { item_name: "Sewa Excavator PC100", category: "ALAT", unit: "Jam" },
    { item_name: "Sewa Concrete Pump", category: "ALAT", unit: "Hari" },
    { item_name: "Tukang Batu / Pekerja", category: "UPAH", unit: "Hari" },
    { item_name: "Mandor", category: "UPAH", unit: "Hari" }
  ];

  const categories = await itemCategoryRepo.findAll();
  const units = await unitRepo.findAll();

  const catMap = new Map(categories.map(c => [c.category_name, c.category_id]));
  const unitMap = new Map(units.map(u => [u.unit_name, u.unit_id]));

  for (const it of items) {
    const exists = await itemRepo.exists({ item_name: it.item_name }, true);
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
        item_name: it.item_name,
        category_id: catId,
        unit_id: unitId
      });
    }
  }
}
