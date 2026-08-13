import { resetDatabase } from "./reset";

async function main() {
  try {
    await resetDatabase();
    process.exit(0);
  } catch (error) {
    console.error("Cli reset failed:", error);
    process.exit(1);
  }
}

main();
