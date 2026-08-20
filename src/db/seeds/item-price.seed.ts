import { itemPriceRepo, itemRepo } from "@/db/repositories";

/**
 * Seeds price variants for every item in the database.
 * Each item gets one standard price entry based on the BOM seed prices.
 */

const itemPriceSeedData: Record<string, number[]> = {
  "Batu Pecah / Split 1/2": [350000, 345000], // PO uses 345k
  "Besi Beton Polos 10mm x 12m": [72000, 71000], // PO uses 71k
  "Besi Beton Polos 8mm x 12m": [45000, 44000], // PO uses 44k
  "Besi Beton Ulir 13mm x 12m": [115000, 116000], // PO uses 116k
  "Besi Beton Ulir 16mm x 12m": [165000],
  "Cat Tembok Eksterior 20L": [1250000],
  "Cat Tembok Interior 25kg (Pail)": [850000],
  "Granit Tile 60x60 (Cream)": [185000],
  "Kabel NYM 3x2.5mm": [650000],
  "Kaso 5/7 Meranti": [35000],
  "Kawat Bendrat": [22000],
  "Keramik Dinding 30x60": [95000],
  "Lampu Downlight LED 12W": [55000],
  "Mandor": [250000],
  "Papan Cor 2/20 Meranti": [25000],
  "Pasir Beton": [300000, 290000], // PO uses 290k
  "Pasir Pasang": [250000, 240000], // PO uses 240k
  "Perekat Bata Ringan / Mortar 40 Kg": [90000, 92000], // PO uses 92k
  "Pipa PVC 1/2 inch tipe AW": [35000],
  "Pipa PVC 4 inch tipe AW": [150000],
  "Semen Portland 50 Kg": [75000, 76000], // PO uses 76k
  "Semen Putih 40 Kg": [85000],
  "Sewa Concrete Pump": [4500000],
  "Sewa Excavator PC100": [180000, 200000], // PO uses 200k
  "Triplek / Multiplek 12mm": [145000],
  "Triplek / Multiplek 9mm": [110000],
  "Tukang Batu / Pekerja": [150000],
  "Waterproofing 20kg": [750000],
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
