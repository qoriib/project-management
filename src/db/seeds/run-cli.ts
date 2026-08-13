import { runAllSeeds } from "./index";

async function main() {
  try {
    await runAllSeeds();
    process.exit(0);
  } catch (error) {
    console.error("Cli seeding failed:", error);
    process.exit(1);
  }
}

main();
