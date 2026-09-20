import { itemPriceRepo, itemRepo, projectRepo, orderRepo, vendorRepo, requirementGroupRepo } from "@/db/repositories";

interface SeedOrderItemRaw {
  itemName: string;
  price: number;
  qty: number;
  hasTax?: boolean;
}

interface SeedOrderRaw {
  orderCode: string;
  projectName: string;
  groupName: string;
  orderDate: string;
  vendorName: string;
  items: SeedOrderItemRaw[];
}

export async function seedOrders(): Promise<void> {
  const p1 = "Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi";
  const p2 = "Renovasi Interior Kantor PT. xyz";
  const p3 = "Pembangunan Gudang Logistik Cikarang";

  const orders: SeedOrderRaw[] = [
    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 1: Pembangunan Rumah Tinggal 2 Lantai Bpk. Budi (Model Campuran)
    // ═════════════════════════════════════════════════════════════════════════
    {
      // PO 1: Pekerjaan Struktur & Konstruksi (Sewa Alat & Tenaga Kerja)
      orderCode: "PO-2026-0001",
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      orderDate: "2026-03-01",
      vendorName: "Sewa Alat Berat Nusantara",
      items: [
        // OVER PRICE: BOQ 180.000 vs PO 200.000 (status: over)
        { itemName: "Sewa Excavator PC100", price: 200000, qty: 40, hasTax: true },
        // TAX VARIANCE: BOQ hasTax: false vs PO hasTax: true (Pajak PPN 12% agen jasa)
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 14, hasTax: true },
        // EQUAL: BOQ 250.000 qty 14 vs PO 250.000 qty 14
        { itemName: "Mandor", price: 250000, qty: 14, hasTax: false },
        // UNDER PRICE: BOQ 4.500.000 vs PO 4.200.000 (status: under / hemat)
        { itemName: "Sewa Concrete Pump", price: 4200000, qty: 2, hasTax: true },
      ],
    },
    {
      // PO 2: Pekerjaan Struktur & Konstruksi (Material Semen, Agregat, Besi & Unplanned)
      orderCode: "PO-2026-0002",
      projectName: p1,
      groupName: "Pekerjaan Struktur & Konstruksi",
      orderDate: "2026-03-05",
      vendorName: "TB. Sinar Bangunan",
      items: [
        // OVER PRICE (78k vs 75k) & UNDER VOLUME (280 vs 350 - beli bertahap)
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 280, hasTax: true },
        // UNDER PRICE (280k vs 300k) & TAX VARIANCE (BOQ false vs PO true)
        { itemName: "Pasir Beton", price: 280000, qty: 15, hasTax: true },
        // UNDER PRICE (335k vs 350k) & OVER VOLUME (20 vs 15 - surplus kebutuhan lapangan)
        { itemName: "Batu Pecah / Split 1/2", price: 335000, qty: 20, hasTax: false },
        // UNDER PRICE (42k vs 45k) & TAX VARIANCE (BOQ true vs PO false - toko non-PKP)
        { itemName: "Besi Beton Polos 8mm x 12m", price: 42000, qty: 100, hasTax: false },
        // OVER PRICE (76k vs 72k) & OVER VOLUME (180 vs 150)
        { itemName: "Besi Beton Polos 10mm x 12m", price: 76000, qty: 180, hasTax: true },
        // OVER PRICE (122k vs 115k) & UNDER VOLUME (160 vs 200)
        { itemName: "Besi Beton Ulir 13mm x 12m", price: 122000, qty: 160, hasTax: true },
        // EQUAL PRICE (35k) & UNDER VOLUME (150 vs 200)
        { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 150, hasTax: false },
        // UNPLANNED 1: Triplek 9mm tidak ada di BOQ Pekerjaan Struktur!
        { itemName: "Triplek / Multiplek 9mm", price: 110000, qty: 25, hasTax: true },
        // UNPLANNED 2: Waterproofing 20kg tidak ada di BOQ Pekerjaan Struktur!
        { itemName: "Waterproofing 20kg", price: 750000, qty: 5, hasTax: true },
      ],
    },
    {
      // PO 3: Pekerjaan Finishing & Arsitektur (Material Dinding, Lantai, Cat & Unplanned)
      orderCode: "PO-2026-0003",
      projectName: p1,
      groupName: "Pekerjaan Finishing & Arsitektur",
      orderDate: "2026-03-12",
      vendorName: "TB. Sinar Bangunan",
      items: [
        // OVER PRICE (265k vs 250k) & EQUAL VOLUME (20)
        { itemName: "Pasir Pasang", price: 265000, qty: 20, hasTax: false },
        // OVER PRICE (95k vs 90k) & OVER VOLUME (120 vs 100)
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 95000, qty: 120, hasTax: true },
        // UNDER PRICE (80k vs 85k) & TAX VARIANCE (BOQ true vs PO false)
        { itemName: "Semen Putih 40 Kg", price: 80000, qty: 10, hasTax: false },
        // EQUAL PRICE (185k) & UNDER VOLUME (60 vs 80)
        { itemName: "Granit Tile 60x60 (Cream)", price: 185000, qty: 60, hasTax: true },
        // UNDER PRICE (800k vs 850k) & UNDER VOLUME (10 vs 15)
        { itemName: "Cat Tembok Interior 25kg (Pail)", price: 800000, qty: 10, hasTax: true },
        // UNPLANNED 3: Lampu Downlight tidak ada di BOQ Finishing!
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 20, hasTax: true },
      ],
    },
    {
      // PO 4: Pekerjaan Mekanikal & Elektrikal (PAGU Rp 45.000.000 -> Realisasi Under Budget / Hemat)
      orderCode: "PO-2026-0004",
      projectName: p1,
      groupName: "Pekerjaan Mekanikal & Elektrikal",
      orderDate: "2026-03-20",
      vendorName: "CV. Elektrika Mandiri",
      items: [
        { itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 30, hasTax: true },
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 100, hasTax: true },
        { itemName: "Pipa PVC 1/2 inch tipe AW", price: 35000, qty: 200, hasTax: true },
      ],
    },
    {
      // PO 5: Pekerjaan Pagar & Lanskap (PAGU Rp 20.000.000 -> Realisasi Over Budget / Defisit)
      orderCode: "PO-2026-0005",
      projectName: p1,
      groupName: "Pekerjaan Pagar & Lanskap",
      orderDate: "2026-03-25",
      vendorName: "CV. Sumber Pasir",
      items: [
        { itemName: "Batu Kali", price: 195000, qty: 60, hasTax: false },
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 120, hasTax: true },
        { itemName: "Pasir Pasang", price: 265000, qty: 15, hasTax: false },
      ],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 2: Renovasi Interior Kantor PT. xyz (Model Pagu Semua / All Pagu)
    // ═════════════════════════════════════════════════════════════════════════
    {
      // PO 6: Pekerjaan Perencanaan & Desain (PAGU Rp 25.000.000 -> Realisasi Under Budget)
      orderCode: "PO-2026-0006",
      projectName: p2,
      groupName: "Pekerjaan Perencanaan & Desain Interior",
      orderDate: "2026-04-01",
      vendorName: "Sewa Alat Berat Nusantara",
      items: [
        { itemName: "Mandor", price: 250000, qty: 40, hasTax: false },
        { itemName: "Tukang Batu / Pekerja", price: 150000, qty: 60, hasTax: false },
      ],
    },
    {
      // PO 7: Pekerjaan Fit-Out & Partisi (PAGU Rp 60.000.000 -> Realisasi Over Budget)
      orderCode: "PO-2026-0007",
      projectName: p2,
      groupName: "Pekerjaan Fit-Out & Partisi Ruangan",
      orderDate: "2026-04-10",
      vendorName: "TB. Sinar Bangunan",
      items: [
        { itemName: "Triplek / Multiplek 12mm", price: 145000, qty: 250, hasTax: true },
        { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 400, hasTax: false },
        { itemName: "Papan Cor 2/20 Meranti", price: 25000, qty: 200, hasTax: false },
        { itemName: "Cat Tembok Interior 25kg (Pail)", price: 850000, qty: 10, hasTax: true },
      ],
    },
    {
      // PO 8: Pekerjaan Tata Suara & Pencahayaan (PAGU Rp 35.000.000 -> Realisasi Pas / Sesuai Pagu)
      orderCode: "PO-2026-0008",
      projectName: p2,
      groupName: "Pekerjaan Tata Suara & Pencahayaan",
      orderDate: "2026-04-15",
      vendorName: "CV. Elektrika Mandiri",
      items: [
        { itemName: "Lampu Downlight LED 12W", price: 55000, qty: 300, hasTax: true },
        { itemName: "Kabel NYM 3x2.5mm", price: 650000, qty: 20, hasTax: true },
      ],
    },

    // ═════════════════════════════════════════════════════════════════════════
    // PROYEK 3: Pembangunan Gudang Logistik Cikarang (Multi-Kelompok Rincian)
    // ═════════════════════════════════════════════════════════════════════════
    {
      // PO 9: Pekerjaan Pondasi & Tanah (Variasi Harga & Volume)
      orderCode: "PO-2026-0009",
      projectName: p3,
      groupName: "Pekerjaan Pondasi & Tanah",
      orderDate: "2026-05-01",
      vendorName: "CV. Sumber Pasir",
      items: [
        { itemName: "Sewa Excavator PC100", price: 180000, qty: 80, hasTax: true },
        // LOWER price (170k vs 180k)
        { itemName: "Batu Kali", price: 170000, qty: 60, hasTax: false },
        { itemName: "Pasir Pasang", price: 250000, qty: 50, hasTax: false },
        // HIGHER price (78k vs 75k), OVER volume (220 vs 200)
        { itemName: "Semen Portland 50 Kg", price: 78000, qty: 220, hasTax: true },
      ],
    },
    {
      // PO 10: Pekerjaan Struktur Baja & Beton (Variasi Harga, Volume & Item Unplanned)
      orderCode: "PO-2026-0010",
      projectName: p3,
      groupName: "Pekerjaan Struktur Baja & Beton",
      orderDate: "2026-05-10",
      vendorName: "PT. Baja Jaya Nusantara",
      items: [
        { itemName: "Besi Beton Ulir 16mm x 12m", price: 165000, qty: 500, hasTax: true },
        // HIGHER price (122k vs 115k)
        { itemName: "Besi Beton Ulir 13mm x 12m", price: 122000, qty: 300, hasTax: true },
        { itemName: "Sewa Concrete Pump", price: 4500000, qty: 5, hasTax: true },
        // LOWER price (138k vs 145k)
        { itemName: "Triplek / Multiplek 12mm", price: 138000, qty: 80, hasTax: true },
        // UNDER volume (250 vs 300)
        { itemName: "Kaso 5/7 Meranti", price: 35000, qty: 250, hasTax: false },
        // UNPLANNED ITEM (Kawat bendrat tidak ada di BOQ Gudang)
        { itemName: "Kawat Bendrat", price: 22000, qty: 40, hasTax: false },
      ],
    },
    {
      // PO 11: Pekerjaan Dinding & Atap (Finishing & Item Unplanned)
      orderCode: "PO-2026-0011",
      projectName: p3,
      groupName: "Pekerjaan Dinding & Atap",
      orderDate: "2026-05-20",
      vendorName: "TB. Sinar Bangunan",
      items: [
        { itemName: "Perekat Bata Ringan / Mortar 40 Kg", price: 90000, qty: 250, hasTax: true },
        { itemName: "Semen Putih 40 Kg", price: 85000, qty: 20, hasTax: true },
        { itemName: "Cat Tembok Eksterior 20L", price: 1250000, qty: 10, hasTax: true },
        // UNPLANNED ITEM (Waterproofing tidak ada di BOQ Gudang)
        { itemName: "Waterproofing 20kg", price: 750000, qty: 6, hasTax: true },
      ],
    },
  ];

  for (const ord of orders) {
    const project = await projectRepo.findOne({ project_name: ord.projectName });
    if (!project) {
      console.warn(`[order.seed] Project not found: ${ord.projectName}`);
      continue;
    }

    const vendor = await vendorRepo.findOne({ vendor_name: ord.vendorName });
    if (!vendor) {
      console.warn(`[order.seed] Vendor not found: ${ord.vendorName}`);
      continue;
    }

    const groups = await requirementGroupRepo.findByProject(project.project_id);
    const matchedGroup = groups.find((group) => group.group_name === ord.groupName);
    const requirementGroupId = matchedGroup ? matchedGroup.requirement_group_id : groups[0]?.requirement_group_id;

    if (!requirementGroupId) {
      console.warn(`[order.seed] Group not found for '${ord.groupName}' in project '${ord.projectName}'`);
      continue;
    }

    const orderItems = [];

    for (const item of ord.items) {
      const itemRecord = await itemRepo.findOne({ item_name: item.itemName });
      if (!itemRecord) {
        console.warn(`[order.seed] Item not found: ${item.itemName}`);
        continue;
      }

      const prices = await itemPriceRepo.findByItem(itemRecord.item_id);
      const matchedPrice = prices.find((priceItem) => priceItem.price === item.price) ?? prices[0];

      orderItems.push({
        has_tax: Boolean(item.hasTax),
        item_id: itemRecord.item_id,
        item_price_id: matchedPrice?.item_price_id ?? null,
        price: item.price !== undefined ? item.price : (matchedPrice?.price ?? 0),
        qty: item.qty,
        requirement_group_id: requirementGroupId,
        vendor_id: vendor.vendor_id,
      });
    }

    if (orderItems.length === 0) continue;

    const existingOrders = await orderRepo.findAll({
      where: {
        order_code: ord.orderCode,
        project_id: project.project_id,
      },
    });

    if (existingOrders.length === 0) {
      await orderRepo.createWithItems(
        {
          order_code: ord.orderCode,
          order_date: ord.orderDate,
          project_id: project.project_id,
          requirement_group_id: requirementGroupId,
        },
        orderItems,
      );
    }
  }
}
