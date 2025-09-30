import { askQuestion } from "./src/scripts/askQuestion.js";

async function main() {
  await askQuestion();
}

main().catch(console.error);
