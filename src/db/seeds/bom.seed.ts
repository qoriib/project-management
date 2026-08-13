import { bomRepo } from "@/db/repositories";

interface SeedBOM {
  project_id: number;
  stage_id: number;
  item_id: number;
  item_price_id: number;
  qty: number;
}

export async function seedBOMs(): Promise<void> {
  const boms: SeedBOM[] = [
    // PROYEK 1: Rumah Tinggal 2 Lantai
    // Tahap 1: Persiapan & Tanah
    { project_id: 1, stage_id: 1, item_id: 26, item_price_id: 35, qty: 40 },    // Sewa Excavator 40 Jam
    { project_id: 1, stage_id: 1, item_id: 28, item_price_id: 38, qty: 14 },    // Tukang 14 Hari
    { project_id: 1, stage_id: 1, item_id: 29, item_price_id: 40, qty: 14 },    // Mandor 14 Hari
    // Tahap 2: Pondasi & Beton Bertulang
    { project_id: 1, stage_id: 2, item_id: 1, item_price_id: 1, qty: 200 },     // Semen Portland 200 Zak
    { project_id: 1, stage_id: 2, item_id: 5, item_price_id: 8, qty: 15 },      // Pasir Beton 15 m3
    { project_id: 1, stage_id: 2, item_id: 6, item_price_id: 9, qty: 15 },      // Batu Split 15 m3
    { project_id: 1, stage_id: 2, item_id: 8, item_price_id: 11, qty: 100 },    // Besi 8mm 100 Btg
    { project_id: 1, stage_id: 2, item_id: 9, item_price_id: 13, qty: 150 },    // Besi 10mm 150 Btg
    { project_id: 1, stage_id: 2, item_id: 10, item_price_id: 15, qty: 200 },   // Besi Ulir 13mm 200 Btg
    { project_id: 1, stage_id: 2, item_id: 12, item_price_id: 18, qty: 20 },    // Kawat Bendrat 20 Kg
    { project_id: 1, stage_id: 2, item_id: 16, item_price_id: 23, qty: 50 },    // Papan Cor 50 Lembar
    { project_id: 1, stage_id: 2, item_id: 15, item_price_id: 22, qty: 100 },   // Kaso 100 Btg
    { project_id: 1, stage_id: 2, item_id: 27, item_price_id: 37, qty: 2 },     // Concrete Pump 2 Hari
    // Tahap 3: Pasangan Dinding & Plesteran
    { project_id: 1, stage_id: 3, item_id: 1, item_price_id: 1, qty: 150 },     // Semen 150 Zak
    { project_id: 1, stage_id: 3, item_id: 4, item_price_id: 6, qty: 20 },      // Pasir Pasang 20 m3
    { project_id: 1, stage_id: 3, item_id: 3, item_price_id: 4, qty: 100 },     // Mortar 100 Zak
    // Tahap 4: Atap & Plafon
    { project_id: 1, stage_id: 4, item_id: 13, item_price_id: 19, qty: 50 },    // Triplek 9mm 50 Lembar (Plafon)
    { project_id: 1, stage_id: 4, item_id: 15, item_price_id: 22, qty: 100 },   // Kaso 100 Btg
    // Tahap 5: Lantai & Keramik
    { project_id: 1, stage_id: 5, item_id: 24, item_price_id: 32, qty: 120 },   // Granit 60x60 120 m2
    { project_id: 1, stage_id: 5, item_id: 25, item_price_id: 34, qty: 40 },    // Keramik Dinding 40 m2
    { project_id: 1, stage_id: 5, item_id: 2, item_price_id: 3, qty: 10 },      // Semen Putih 10 Zak
    // Tahap 6: Elektrikal & Plumbing
    { project_id: 1, stage_id: 6, item_id: 20, item_price_id: 28, qty: 10 },    // Pipa 4 inch 10 Btg
    { project_id: 1, stage_id: 6, item_id: 21, item_price_id: 29, qty: 25 },    // Pipa 1/2 inch 25 Btg
    { project_id: 1, stage_id: 6, item_id: 22, item_price_id: 30, qty: 5 },     // Kabel NYM 5 Roll
    { project_id: 1, stage_id: 6, item_id: 23, item_price_id: 31, qty: 30 },    // Downlight 30 Unit
    // Tahap 7: Pengecatan & Finishing
    { project_id: 1, stage_id: 7, item_id: 17, item_price_id: 24, qty: 15 },    // Cat Interior 15 Pail
    { project_id: 1, stage_id: 7, item_id: 18, item_price_id: 26, qty: 10 },    // Cat Eksterior 10 Pail
    { project_id: 1, stage_id: 7, item_id: 19, item_price_id: 27, qty: 5 },     // Waterproofing 5 Pail

    // PROYEK 2: Interior Kantor PT. xyz
    // Tahap 8: Pembongkaran
    { project_id: 2, stage_id: 8, item_id: 28, item_price_id: 38, qty: 20 },    // Tukang 20 Hari
    // Tahap 9: Partisi Kaca & Gypsum
    { project_id: 2, stage_id: 9, item_id: 14, item_price_id: 20, qty: 60 },    // Triplek 12mm 60 Lembar
    // Tahap 10: ME
    { project_id: 2, stage_id: 10, item_id: 22, item_price_id: 30, qty: 10 },   // Kabel NYM 10 Roll
    { project_id: 2, stage_id: 10, item_id: 23, item_price_id: 31, qty: 50 },   // Downlight 50 Unit
    // Tahap 11: Custom Furniture
    { project_id: 2, stage_id: 11, item_id: 14, item_price_id: 20, qty: 100 },  // Triplek 12mm 100 Lembar
    { project_id: 2, stage_id: 11, item_id: 17, item_price_id: 24, qty: 5 },    // Cat Interior 5 Pail

    // PROYEK 3: Gudang Logistik Cikarang
    // Tahap 12: Tanah & Cut and Fill
    { project_id: 3, stage_id: 12, item_id: 26, item_price_id: 36, qty: 120 },  // Excavator 120 Jam
    { project_id: 3, stage_id: 12, item_id: 4, item_price_id: 6, qty: 50 },     // Pasir Urug/Pasang 50 m3
    // Tahap 13: Struktur Baja (Warehouse)
    { project_id: 3, stage_id: 13, item_id: 11, item_price_id: 17, qty: 500 },  // Besi Ulir 16mm 500 Btg
    { project_id: 3, stage_id: 13, item_id: 27, item_price_id: 37, qty: 5 }     // Concrete Pump 5 Hari
  ];

  for (const b of boms) {
    const exists = await bomRepo.exists({
      project_id: b.project_id,
      stage_id: b.stage_id,
      item_id: b.item_id,
      item_price_id: b.item_price_id
    }, true);
    if (!exists) {
      await bomRepo.create(b);
    }
  }
}
