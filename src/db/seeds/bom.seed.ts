import { bomRepo, projectRepo, itemRepo } from "@/db/repositories";

interface SeedBOMRaw {
  project_name: string;
  stage_name: string;
  item_name: string;
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
    { project_name: p1, stage_name: "Pekerjaan Persiapan & Tanah", item_name: "Sewa Excavator PC100", price: 180000, qty: 40 },
    { project_name: p1, stage_name: "Pekerjaan Persiapan & Tanah", item_name: "Tukang Batu / Pekerja", price: 150000, qty: 14 },
    { project_name: p1, stage_name: "Pekerjaan Persiapan & Tanah", item_name: "Mandor", price: 250000, qty: 14 },
    // Tahap 2: Pondasi & Beton Bertulang
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Semen Portland 50 Kg", price: 75000, qty: 200 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Pasir Beton", price: 300000, qty: 15 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Batu Pecah / Split 1/2", price: 350000, qty: 15 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Besi Beton Polos 8mm x 12m", price: 45000, qty: 100 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Besi Beton Polos 10mm x 12m", price: 72000, qty: 150 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Besi Beton Ulir 13mm x 12m", price: 115000, qty: 200 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Kawat Bendrat", price: 22000, qty: 20 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Papan Cor 2/20 Meranti", price: 25000, qty: 50 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Kaso 5/7 Meranti", price: 35000, qty: 100 },
    { project_name: p1, stage_name: "Pekerjaan Pondasi & Beton Bertulang", item_name: "Sewa Concrete Pump", price: 4500000, qty: 2 },
    // Tahap 3: Pasangan Dinding & Plesteran
    { project_name: p1, stage_name: "Pekerjaan Pasangan Dinding & Plesteran", item_name: "Semen Portland 50 Kg", price: 75000, qty: 150 },
    { project_name: p1, stage_name: "Pekerjaan Pasangan Dinding & Plesteran", item_name: "Pasir Pasang", price: 250000, qty: 20 },
    { project_name: p1, stage_name: "Pekerjaan Pasangan Dinding & Plesteran", item_name: "Perekat Bata Ringan / Mortar 40 Kg", price: 90000, qty: 100 },
    // Tahap 4: Atap & Plafon
    { project_name: p1, stage_name: "Pekerjaan Atap & Plafon", item_name: "Triplek / Multiplek 9mm", price: 110000, qty: 50 },
    { project_name: p1, stage_name: "Pekerjaan Atap & Plafon", item_name: "Kaso 5/7 Meranti", price: 35000, qty: 100 },
    // Tahap 5: Lantai & Keramik
    { project_name: p1, stage_name: "Pekerjaan Lantai & Keramik", item_name: "Granit Tile 60x60 (Cream)", price: 185000, qty: 120 },
    { project_name: p1, stage_name: "Pekerjaan Lantai & Keramik", item_name: "Keramik Dinding 30x60", price: 95000, qty: 40 },
    { project_name: p1, stage_name: "Pekerjaan Lantai & Keramik", item_name: "Semen Putih 40 Kg", price: 85000, qty: 10 },
    // Tahap 6: Elektrikal & Plumbing
    { project_name: p1, stage_name: "Pekerjaan Elektrikal & Plumbing", item_name: "Pipa PVC 4 inch tipe AW", price: 150000, qty: 10 },
    { project_name: p1, stage_name: "Pekerjaan Elektrikal & Plumbing", item_name: "Pipa PVC 1/2 inch tipe AW", price: 35000, qty: 25 },
    { project_name: p1, stage_name: "Pekerjaan Elektrikal & Plumbing", item_name: "Kabel NYM 3x2.5mm", price: 650000, qty: 5 },
    { project_name: p1, stage_name: "Pekerjaan Elektrikal & Plumbing", item_name: "Lampu Downlight LED 12W", price: 55000, qty: 30 },
    // Tahap 7: Pengecatan & Finishing
    { project_name: p1, stage_name: "Pekerjaan Pengecatan & Finishing", item_name: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 15 },
    { project_name: p1, stage_name: "Pekerjaan Pengecatan & Finishing", item_name: "Cat Tembok Eksterior 20L", price: 1250000, qty: 10 },
    { project_name: p1, stage_name: "Pekerjaan Pengecatan & Finishing", item_name: "Waterproofing 20kg", price: 750000, qty: 5 },

    // PROYEK 2: Interior Kantor PT. xyz
    // Tahap 8: Pembongkaran
    { project_name: p2, stage_name: "Pekerjaan Pembongkaran (Demolisi)", item_name: "Tukang Batu / Pekerja", price: 150000, qty: 20 },
    // Tahap 9: Partisi Kaca & Gypsum
    { project_name: p2, stage_name: "Pekerjaan Partisi Kaca & Gypsum", item_name: "Triplek / Multiplek 12mm", price: 145000, qty: 60 },
    // Tahap 10: ME
    { project_name: p2, stage_name: "Pekerjaan ME (Mechanical Electrical)", item_name: "Kabel NYM 3x2.5mm", price: 650000, qty: 10 },
    { project_name: p2, stage_name: "Pekerjaan ME (Mechanical Electrical)", item_name: "Lampu Downlight LED 12W", price: 55000, qty: 50 },
    // Tahap 11: Custom Furniture
    { project_name: p2, stage_name: "Pekerjaan Custom Furniture", item_name: "Triplek / Multiplek 12mm", price: 145000, qty: 100 },
    { project_name: p2, stage_name: "Pekerjaan Custom Furniture", item_name: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 5 },

    // PROYEK 3: Gudang Logistik Cikarang
    // Tahap 12: Tanah & Cut and Fill
    { project_name: p3, stage_name: "Pekerjaan Tanah & Cut and Fill", item_name: "Sewa Excavator PC100", price: 200000, qty: 120 },
    { project_name: p3, stage_name: "Pekerjaan Tanah & Cut and Fill", item_name: "Pasir Pasang", price: 250000, qty: 50 },
    // Tahap 13: Struktur Baja (Warehouse)
    { project_name: p3, stage_name: "Pekerjaan Struktur Baja (Warehouse)", item_name: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 500 },
    { project_name: p3, stage_name: "Pekerjaan Struktur Baja (Warehouse)", item_name: "Sewa Concrete Pump", price: 4500000, qty: 5 }
  ];

  const projects = await projectRepo.findAll();
  const items = await itemRepo.findAll();

  // Create lookup maps
  const projMap = new Map(projects.map(p => [p.project_name, p.project_id]));
  const itemMap = new Map(items.map(i => [i.item_name, i.item_id]));
  
  // Since stages are per project, we can just fetch all stages or fetch them on the fly
  // For simplicity, let's fetch all stages
  const db = (await import("../index")).getDB();
  const allStages = await (await db).select<any[]>("SELECT stage_id, project_id, stage_name FROM project_stages");
  
  const stageMap = new Map(allStages.map(s => [`${s.project_id}-${s.stage_name}`, s.stage_id]));

  for (const b of rawBoms) {
    const projectId = projMap.get(b.project_name);
    const itemId = itemMap.get(b.item_name);
    
    if (!projectId || !itemId) {
      console.warn(`Could not find project '${b.project_name}' or item '${b.item_name}'. Skipping BOM.`);
      continue;
    }

    const stageId = stageMap.get(`${projectId}-${b.stage_name}`);
    if (!stageId) {
      console.warn(`Could not find stage '${b.stage_name}' for project '${b.project_name}'. Skipping BOM.`);
      continue;
    }

    const exists = await bomRepo.exists({
      project_id: projectId,
      stage_id: stageId,
      item_id: itemId,
      price: b.price
    }, true);

    if (!exists) {
      await bomRepo.create({
        project_id: projectId,
        stage_id: stageId,
        item_id: itemId,
        price: b.price,
        qty: b.qty
      });
    }
  }
}

