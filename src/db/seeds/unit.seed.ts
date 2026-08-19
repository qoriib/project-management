import { unitRepo } from "@/db/repositories";

export async function seedUnits(): Promise<void> {
  const units = [
    "Zak",
    "m3",
    "m2",
    "m",
    "Kg",
    "Liter",
    "Pail",
    "Btg",
    "Lembar",
    "Unit",
    "Roll",
    "Ls",
    "Jam",
    "Hari",
    "Bulan",
  ];

  for (const name of units) {
    const exists = await unitRepo.exists({ unit_name: name }, true);
    if (!exists) {
      await unitRepo.create({ unit_name: name });
    }
  }
}
