import { itemCategoryRepo, itemRepo, unitRepo } from "@/db/repositories";

interface SeedItem {
  itemName: string;
  category: string;
  unit: string;
}

export async function seedItems(): Promise<void> {
  const items: SeedItem[] = [
    { category: "Bahan", itemName: "Semen Portland 50 Kg", unit: "Zak" },
    { category: "Bahan", itemName: "Semen Putih 40 Kg", unit: "Zak" },
    {
      category: "Bahan",
      itemName: "Perekat Bata Ringan / Mortar 40 Kg",
      unit: "Zak",
    },
    { category: "Bahan", itemName: "Pasir Pasang", unit: "M3" },
    { category: "Bahan", itemName: "Pasir Beton", unit: "M3" },
    { category: "Bahan", itemName: "Batu Pecah / Split 1/2", unit: "M3" },
    { category: "Bahan", itemName: "Batu Kali", unit: "M3" },
    {
      category: "Bahan",
      itemName: "Besi Beton Polos 8mm x 12m",
      unit: "Btg",
    },
    {
      category: "Bahan",
      itemName: "Besi Beton Polos 10mm x 12m",
      unit: "Btg",
    },
    {
      category: "Bahan",
      itemName: "Besi Beton Ulir 13mm x 12m",
      unit: "Btg",
    },
    {
      category: "Bahan",
      itemName: "Besi Beton Ulir 16mm x 12m",
      unit: "Btg",
    },
    { category: "Bahan", itemName: "Kawat Bendrat", unit: "Kg" },
    {
      category: "Bahan",
      itemName: "Triplek / Multiplek 9mm",
      unit: "Lembar",
    },
    {
      category: "Bahan",
      itemName: "Triplek / Multiplek 12mm",
      unit: "Lembar",
    },
    { category: "Bahan", itemName: "Kaso 5/7 Meranti", unit: "Btg" },
    { category: "Bahan", itemName: "Papan Cor 2/20 Meranti", unit: "Lembar" },
    {
      category: "Bahan",
      itemName: "Cat Tembok Interior 25kg (Pail)",
      unit: "Pail",
    },
    { category: "Bahan", itemName: "Cat Tembok Eksterior 20L", unit: "Pail" },
    { category: "Bahan", itemName: "Waterproofing 20kg", unit: "Pail" },
    { category: "Bahan", itemName: "Pipa PVC 4 inch tipe AW", unit: "Btg" },
    { category: "Bahan", itemName: "Pipa PVC 1/2 inch tipe AW", unit: "Btg" },
    { category: "Bahan", itemName: "Kabel NYM 3x2.5mm", unit: "Roll" },
    { category: "Bahan", itemName: "Lampu Downlight LED 12W", unit: "Unit" },
    { category: "Bahan", itemName: "Granit Tile 60x60 (Cream)", unit: "M2" },
    { category: "Bahan", itemName: "Keramik Dinding 30x60", unit: "M2" },
    { category: "Alat", itemName: "Sewa Excavator PC100", unit: "Jam" },
    { category: "Alat", itemName: "Sewa Concrete Pump", unit: "Hari" },
    {
      category: "Operasional",
      itemName: "Tukang Batu / Pekerja",
      unit: "Hari",
    },
    { category: "Operasional", itemName: "Mandor", unit: "Hari" },
  ];

  const categories = await itemCategoryRepo.findAll();
  const units = await unitRepo.findAll();
  const catMap = new Map<string, string>(categories.map((c) => [c.category_name, c.category_id]));
  const unitMap = new Map<string, string>(units.map((u) => [u.unit_name, u.unit_id]));

  for (const it of items) {
    const exists = await itemRepo.exists({ item_name: it.itemName }, true);

    if (!exists) {
      let catId = catMap.get(it.category);

      if (!catId) {
        catId = await itemCategoryRepo.create({
          category_code: "",
          category_name: it.category,
          prefix: it.category.charAt(0).toUpperCase(),
        });

        catMap.set(it.category, catId);
      }

      let unitId = unitMap.get(it.unit);
      if (!unitId) {
        unitId = await unitRepo.create({ unit_name: it.unit });
        unitMap.set(it.unit, unitId);
      }

      await itemRepo.create({
        category_id: catId,
        item_code: "",
        item_name: it.itemName,
        unit_id: unitId,
      });
    }
  }
}
