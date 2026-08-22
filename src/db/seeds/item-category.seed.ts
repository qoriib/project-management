import { itemCategoryRepo } from "@/db/repositories";

export async function seedItemCategories(): Promise<void> {
  const categories = [
    { code: "00001", name: "Bahan", prefix: "B" },
    { code: "00002", name: "Alat", prefix: "A" },
    { code: "00003", name: "Operasional", prefix: "O" },
  ];

  for (const cat of categories) {
    const exists = await itemCategoryRepo.exists({ category_name: cat.name }, true);

    if (!exists) {
      await itemCategoryRepo.create({
        category_code: cat.code,
        category_name: cat.name,
        prefix: cat.prefix,
      });
    }
  }
}
