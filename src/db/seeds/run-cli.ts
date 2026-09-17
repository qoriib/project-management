import { resetDatabase } from "@/db/services/database.service";
import { runAllSeeds } from "./index";

async function main() {
  try {
    console.log("Resetting database for fresh seed...");
    await resetDatabase();
    await runAllSeeds();
    process.exit(0);
  } catch (error) {
    console.error("Cli seeding failed:", error);
    process.exit(1);
  }
}

main();
