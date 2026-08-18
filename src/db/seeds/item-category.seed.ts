import { itemCategoryRepo } from "@/db/repositories";

export async function seedItemCategories(): Promise<void> {
  const categories = [
    { name: "Bahan", prefix: "B" },
    { name: "Alat", prefix: "A" },
    { name: "Operasional", prefix: "O" }
  ];

  for (const cat of categories) {
    const exists = await itemCategoryRepo.exists({ category_name: cat.name }, true);
    if (!exists) {
      await itemCategoryRepo.create({ prefix: cat.prefix, category_code: "", category_name: cat.name });
    }
  }
}
