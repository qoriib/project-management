import { itemRepo, itemPriceRepo } from "@/db/repositories";

interface SeedItem {
  item_name: string;
  category: string;
  unit: string;
  prices: number[];
}

export async function seedItems(): Promise<void> {
  const items: SeedItem[] = [
    { item_name: "Semen Portland 50 Kg", category: "Bahan", unit: "Zak", prices: [75000, 78000] },
    { item_name: "Semen Putih 40 Kg", category: "Bahan", unit: "Zak", prices: [85000] },
    { item_name: "Perekat Bata Ringan / Mortar 40 Kg", category: "Bahan", unit: "Zak", prices: [90000, 92000] },
    { item_name: "Pasir Pasang", category: "Bahan", unit: "m3", prices: [250000, 260000] },
    { item_name: "Pasir Beton", category: "Bahan", unit: "m3", prices: [300000] },
    { item_name: "Batu Pecah / Split 1/2", category: "Bahan", unit: "m3", prices: [350000] },
    { item_name: "Batu Kali", category: "Bahan", unit: "m3", prices: [280000] },
    { item_name: "Besi Beton Polos 8mm x 12m", category: "Bahan", unit: "Btg", prices: [45000, 48000] },
    { item_name: "Besi Beton Polos 10mm x 12m", category: "Bahan", unit: "Btg", prices: [72000, 75000] },
    { item_name: "Besi Beton Ulir 13mm x 12m", category: "Bahan", unit: "Btg", prices: [115000, 118000] },
    { item_name: "Besi Beton Ulir 16mm x 12m", category: "Bahan", unit: "Btg", prices: [165000] },
    { item_name: "Kawat Bendrat", category: "Bahan", unit: "Kg", prices: [22000] },
    { item_name: "Triplek / Multiplek 9mm", category: "Bahan", unit: "Lembar", prices: [110000] },
    { item_name: "Triplek / Multiplek 12mm", category: "Bahan", unit: "Lembar", prices: [145000, 150000] },
    { item_name: "Kaso 5/7 Meranti", category: "Bahan", unit: "Btg", prices: [35000] },
    { item_name: "Papan Cor 2/20 Meranti", category: "Bahan", unit: "Lembar", prices: [25000] },
    { item_name: "Cat Tembok Interior 25kg (Pail)", category: "Bahan", unit: "Pail", prices: [850000, 950000] },
    { item_name: "Cat Tembok Eksterior 20L", category: "Bahan", unit: "Pail", prices: [1250000] },
    { item_name: "Waterproofing 20kg", category: "Bahan", unit: "Pail", prices: [750000] },
    { item_name: "Pipa PVC 4 inch tipe AW", category: "Bahan", unit: "Btg", prices: [150000] },
    { item_name: "Pipa PVC 1/2 inch tipe AW", category: "Bahan", unit: "Btg", prices: [35000] },
    { item_name: "Kabel NYM 3x2.5mm", category: "Bahan", unit: "Roll", prices: [650000] },
    { item_name: "Lampu Downlight LED 12W", category: "Bahan", unit: "Unit", prices: [55000] },
    { item_name: "Granit Tile 60x60 (Cream)", category: "Bahan", unit: "m2", prices: [185000, 210000] },
    { item_name: "Keramik Dinding 30x60", category: "Bahan", unit: "m2", prices: [95000] },
    { item_name: "Sewa Excavator PC100", category: "Alat", unit: "Jam", prices: [180000, 200000] },
    { item_name: "Sewa Concrete Pump", category: "Alat", unit: "Hari", prices: [4500000] },
    { item_name: "Tukang Batu / Pekerja", category: "Operasional", unit: "Hari", prices: [150000, 175000] },
    { item_name: "Mandor", category: "Operasional", unit: "Hari", prices: [250000] }
  ];

  for (const it of items) {
    const exists = await itemRepo.exists({ item_name: it.item_name }, true);
    if (!exists) {
      const itemId = await itemRepo.create({
        item_name: it.item_name,
        category: it.category,
        unit: it.unit
      });

      for (const price of it.prices) {
        await itemPriceRepo.create({
          item_id: itemId,
          price: price
        });
      }
    }
  }
}
