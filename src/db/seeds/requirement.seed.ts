import { requirementRepo, requirementGroupRepo, itemPriceRepo, itemRepo, projectRepo } from "@/db/repositories";

interface SeedGroupDefinition {
  projectName: string;
  groupName: string;
  budget?: number | null;
}

interface SeedRequirementRaw {
  projectName: string;
  groupName: string;
  itemName: string;
  price: number;
  qty: number;
  hasTax?: boolean;
}

export async function seedRequirements(): Promise<void> {
  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi";
  const p2 = "Renovasi Interior Kantor PT. xyz";
  const p3 = "Pembangunan Gudang Logistik Cikarang";

  // 1. Definisi seluruh kelompok pekerjaan lintas proyek
  const groupDefs: SeedGroupDefinition[] = [
    // PROYEK 1: Model Campuran (Rincian BOQ + Pagu Anggaran + Kelompok Kosong)
    { projectName: p1, groupName: "Pekerjaan Struktur & Konstruksi", budget: null },
    { projectName: p1, groupName: "Pekerjaan Finishing & Arsitektur", budget: null },
    { projectName: p1, groupName: "Pekerjaan Mekanikal & Elektrikal", budget: 45000000 },
    { projectName: p1, groupName: "Pekerjaan Pagar & Lanskap", budget: 20000000 },
    { projectName: p1, groupName: "Pekerjaan Pembersihan & Akhir", budget: null },

    // PROYEK 2: Model Pagu Semua (All Pagu: Seluruh pekerjaan diatur dengan plafon pagu anggaran)
    { projectName: p2, groupName: "Pekerjaan Perencanaan & Desain Interior", budget: 25000000 },
    { projectName: p2, groupName: "Pekerjaan Fit-Out & Partisi Ruangan", budget: 60000000 },
    { projectName: p2, groupName: "Pekerjaan Tata Suara & Pencahayaan", budget: 35000000 },
    { projectName: p2, groupName: "Pekerjaan Pengawasan & Supervisi", budget: 10000000 },

    // PROYEK 3: Model Multi-Kelompok Rincian Standar (Seluruh pekerjaan memiliki rincian material BOQ)
    { projectName: p3, groupName: "Pekerjaan Pondasi & Tanah", budget: null },
    { projectName: p3, groupName: "Pekerjaan Struktur Baja & Beton", budget: null },
    { projectName: p3, groupName: "Pekerjaan Dinding & Atap", budget: null },
  ];

  // 2. Definisi kebutuhan material (BOQ) untuk kelompok rincian
  const rawReqs: SeedRequirementRaw[] = [
    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 1: Rumah Tinggal 2 Lantai Bpk. Budi (Kelompok Rincian)
    // ═════════════════════════════════════════════════════════════════════════
    // Kelompok: Pekerjaan Struktur & Konstruksi
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Sewa Excavator PC100",
      price: 180000,
      qty: 40,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Tukang Batu / Pekerja",
      price: 150000,
      qty: 14,
      hasTax: false,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Mandor",
      price: 250000,
      qty: 14,
      hasTax: false,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Semen Portland 50 Kg",
      price: 75000,
      qty: 350,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Pasir Beton",
      price: 300000,
      qty: 15,
      hasTax: false,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Batu Pecah / Split 1/2",
      price: 350000,
      qty: 15,
      hasTax: false,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Besi Beton Polos 8mm x 12m",
      price: 45000,
      qty: 100,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Besi Beton Polos 10mm x 12m",
      price: 72000,
      qty: 150,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Besi Beton Ulir 13mm x 12m",
      price: 115000,
      qty: 200,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Kawat Bendrat",
      price: 22000,
      qty: 20,
      hasTax: false,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Papan Cor 2/20 Meranti",
      price: 25000,
      qty: 50,
      hasTax: false,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Kaso 5/7 Meranti",
      price: 35000,
      qty: 200,
      hasTax: false,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      itemName: "Sewa Concrete Pump",
      price: 4500000,
      qty: 2,
      hasTax: true,
    },

    // Kelompok: Pekerjaan Finishing & Arsitektur
    {
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      itemName: "Pasir Pasang",
      price: 250000,
      qty: 20,
      hasTax: false,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      itemName: "Perekat Bata Ringan / Mortar 40 Kg",
      price: 90000,
      qty: 100,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      itemName: "Semen Putih 40 Kg",
      price: 85000,
      qty: 10,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      itemName: "Keramik Dinding 30x60",
      price: 95000,
      qty: 40,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      itemName: "Granit Tile 60x60 (Cream)",
      price: 185000,
      qty: 80,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      itemName: "Cat Tembok Interior 25kg (Pail)",
      price: 850000,
      qty: 5,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      itemName: "Cat Tembok Eksterior 20L",
      price: 1250000,
      qty: 3,
      hasTax: true,
    },
    {
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      itemName: "Waterproofing 20kg",
      price: 750000,
      qty: 4,
      hasTax: true,
    },

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 3: Pembangunan Gudang Logistik Cikarang (Multi-Kelompok Rincian)
    // ═════════════════════════════════════════════════════════════════════════
    // Kelompok: Pekerjaan Pondasi & Tanah
    {
      projectName: p3,
      groupName: "Pekerjaan Pondasi & Tanah",
      itemName: "Sewa Excavator PC100",
      price: 180000,
      qty: 80,
      hasTax: true,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Pondasi & Tanah",
      itemName: "Batu Kali",
      price: 180000,
      qty: 60,
      hasTax: false,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Pondasi & Tanah",
      itemName: "Pasir Pasang",
      price: 250000,
      qty: 50,
      hasTax: false,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Pondasi & Tanah",
      itemName: "Semen Portland 50 Kg",
      price: 75000,
      qty: 200,
      hasTax: true,
    },

    // Kelompok: Pekerjaan Struktur Baja & Beton
    {
      projectName: p3,
      groupName: "Pekerjaan Struktur Baja & Beton",
      itemName: "Besi Beton Ulir 16mm x 12m",
      price: 165000,
      qty: 500,
      hasTax: true,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Struktur Baja & Beton",
      itemName: "Besi Beton Ulir 13mm x 12m",
      price: 115000,
      qty: 300,
      hasTax: true,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Struktur Baja & Beton",
      itemName: "Sewa Concrete Pump",
      price: 4500000,
      qty: 5,
      hasTax: true,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Struktur Baja & Beton",
      itemName: "Triplek / Multiplek 12mm",
      price: 145000,
      qty: 80,
      hasTax: true,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Struktur Baja & Beton",
      itemName: "Kaso 5/7 Meranti",
      price: 35000,
      qty: 300,
      hasTax: false,
    },

    // Kelompok: Pekerjaan Dinding & Atap
    {
      projectName: p3,
      groupName: "Pekerjaan Dinding & Atap",
      itemName: "Perekat Bata Ringan / Mortar 40 Kg",
      price: 90000,
      qty: 250,
      hasTax: true,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Dinding & Atap",
      itemName: "Semen Putih 40 Kg",
      price: 85000,
      qty: 20,
      hasTax: true,
    },
    {
      projectName: p3,
      groupName: "Pekerjaan Dinding & Atap",
      itemName: "Cat Tembok Eksterior 20L",
      price: 1250000,
      qty: 10,
      hasTax: true,
    },
  ];

  const projects = await projectRepo.findAll();
  const items = await itemRepo.findAll();
  const projMap = new Map<string, string>(projects.map((project) => [project.project_name, project.project_id]));
  const itemMap = new Map<string, string>(items.map((item) => [item.item_name, item.item_id]));
  const itemPriceCache = new Map<string, { item_price_id: string; price: number }[]>();

  // Inisialisasi atau temukan kelompok pekerjaan
  const groupKeyMap = new Map<string, string>(); // `${projectId}|${groupName}` -> requirement_group_id

  for (const groupDef of groupDefs) {
    const projectId = projMap.get(groupDef.projectName);
    if (!projectId) continue;

    const existingGroups = await requirementGroupRepo.findByProject(projectId);
    let matchedGroup = existingGroups.find((existingGroup) => existingGroup.group_name === groupDef.groupName);

    if (!matchedGroup) {
      const newGroupId = await requirementGroupRepo.create({
        project_id: projectId,
        group_name: groupDef.groupName,
        budget: groupDef.budget ?? null,
      });
      matchedGroup = (await requirementGroupRepo.findById(newGroupId))!;
    } else if (groupDef.budget !== undefined && matchedGroup.budget !== (groupDef.budget ?? null)) {
      await requirementGroupRepo.update(matchedGroup.requirement_group_id, {
        budget: groupDef.budget ?? null,
      });
    }

    groupKeyMap.set(`${projectId}|${groupDef.groupName}`, matchedGroup.requirement_group_id);
  }

  // Masukkan rincian BOQ
  for (const rawReq of rawReqs) {
    const projectId = projMap.get(rawReq.projectName);
    const itemId = itemMap.get(rawReq.itemName);
    const requirementGroupId = projectId ? groupKeyMap.get(`${projectId}|${rawReq.groupName}`) : undefined;

    if (!projectId || !itemId || !requirementGroupId) {
      console.warn(
        `Could not resolve dependencies for requirement '${rawReq.itemName}' in '${rawReq.projectName}' / '${rawReq.groupName}'.`,
      );
      continue;
    }

    // Ambil harga item dari cache
    if (!itemPriceCache.has(itemId)) {
      const prices = await itemPriceRepo.findByItem(itemId);
      itemPriceCache.set(
        itemId,
        prices.map((priceItem) => ({ item_price_id: priceItem.item_price_id, price: priceItem.price })),
      );
    }

    const prices = itemPriceCache.get(itemId)!;
    const matchedPrice = prices.find((priceItem) => priceItem.price === rawReq.price) ?? prices[0];
    if (!matchedPrice) {
      console.warn(`No item_prices found for item '${rawReq.itemName}'. Skipping.`);
      continue;
    }

    const exists = await requirementRepo.exists(
      {
        item_id: itemId,
        item_price_id: matchedPrice.item_price_id,
        project_id: projectId,
        requirement_group_id: requirementGroupId,
      },
      true,
    );

    if (!exists) {
      await requirementRepo.create({
        item_id: itemId,
        item_price_id: matchedPrice.item_price_id,
        project_id: projectId,
        requirement_group_id: requirementGroupId,
        qty: rawReq.qty,
        has_tax: Boolean(rawReq.hasTax),
      });
    }
  }
}
