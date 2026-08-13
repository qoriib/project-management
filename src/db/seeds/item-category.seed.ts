import { itemCategoryRepo } from "@/db/repositories";

export async function seedItemCategories(): Promise<void> {
  const categories = ["Bahan", "Alat", "Operasional"];

  for (const name of categories) {
    const exists = await itemCategoryRepo.exists({ category_name: name }, true);
    if (!exists) {
      await itemCategoryRepo.create({ category_name: name });
    }
  }
}
