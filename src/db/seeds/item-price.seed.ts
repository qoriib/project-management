import { itemPriceRepo, itemRepo } from "@/db/repositories";

/**
 * Seeds price variants for every item in the database.
 * Each item gets one standard price entry based on the BOM seed prices.
 */

const itemPriceSeedData: Record<string, number[]> = {
  "Batu Kali": [180000, 195000, 170000],
  "Batu Pecah / Split 1/2": [350000, 375000, 335000],
  "Besi Beton Polos 10mm x 12m": [72000, 76000, 68000],
  "Besi Beton Polos 8mm x 12m": [45000, 48000, 42000],
  "Besi Beton Ulir 13mm x 12m": [115000, 122000, 108000],
  "Besi Beton Ulir 16mm x 12m": [165000, 175000, 155000],
  "Cat Tembok Eksterior 20L": [1250000, 1320000, 1180000],
  "Cat Tembok Interior 25kg (Pail)": [850000, 900000, 800000],
  "Granit Tile 60x60 (Cream)": [185000, 195000, 175000],
  "Kabel NYM 3x2.5mm": [650000, 690000, 620000],
  "Kaso 5/7 Meranti": [35000, 38000, 32000],
  "Kawat Bendrat": [22000, 25000, 20000],
  "Keramik Dinding 30x60": [95000, 102000, 88000],
  "Lampu Downlight LED 12W": [55000, 60000, 50000],
  Mandor: [250000, 275000, 225000],
  "Papan Cor 2/20 Meranti": [25000, 28000, 22000],
  "Pasir Beton": [300000, 320000, 280000],
  "Pasir Pasang": [250000, 265000, 235000],
  "Perekat Bata Ringan / Mortar 40 Kg": [90000, 95000, 85000],
  "Pipa PVC 1/2 inch tipe AW": [35000, 38000, 32000],
  "Pipa PVC 4 inch tipe AW": [150000, 160000, 140000],
  "Semen Portland 50 Kg": [75000, 78000, 72000],
  "Semen Putih 40 Kg": [85000, 90000, 80000],
  "Sewa Concrete Pump": [4500000, 4800000, 4200000],
  "Sewa Excavator PC100": [180000, 200000, 165000],
  "Triplek / Multiplek 12mm": [145000, 155000, 138000],
  "Triplek / Multiplek 9mm": [110000, 118000, 102000],
  "Tukang Batu / Pekerja": [150000, 165000, 140000],
  "Waterproofing 20kg": [750000, 800000, 700000],
};

export async function seedItemPrices(): Promise<void> {
  const items = await itemRepo.findAll();

  for (const item of items) {
    const existing = await itemPriceRepo.findByItem(item.item_id);
    if (existing.length > 0) {
      continue;
    }

    const prices = itemPriceSeedData[item.item_name] ?? [0];
    for (const price of prices) {
      await itemPriceRepo.create({ item_id: item.item_id, price });
    }
  }
}
