import { seedUnits } from "./unit.seed";
import { seedItemCategories } from "./item-category.seed";
import { seedVendors } from "./vendor.seed";
import { seedItems } from "./item.seed";
import { seedItemPrices } from "./item-price.seed";
import { seedProjects } from "./project.seed";
import { seedBOMs } from "./bom.seed";
import { seedPurchaseOrders } from "./purchase-order.seed";
import { seedDeliveries } from "./delivery.seed";

export async function runAllSeeds(): Promise<void> {
  console.log("Seeding database...");
  try {
    await seedUnits();
    await seedItemCategories();
    await seedVendors();
    await seedItems();
    await seedItemPrices();
    await seedProjects();
    await seedBOMs();
    await seedPurchaseOrders();
    await seedDeliveries();
    console.log("Database seeded successfully.");
  } catch (error) {
    console.error("Database seeding failed:", error);
    throw error;
  }
}
