import { setupGraph } from "./src/services/arangodb/graph.js";
import { runEmbeddingPipeline } from "./src/services/embeddingProcessor.js";
import { askQuestion } from "./src/scripts/askQuestion.js";
import { inspectView } from "./src/services/arangodb/view.js";
import { createVectorIndex } from "./src/services/arangodb/index.js";
async function main() {
  console.log("Bắt đầu setup graph...");
  await setupGraph();
  console.log("Graph setup xong.");

  console.log("Bắt đầu pipeline embedding...");
  await runEmbeddingPipeline();

  // console.log("Tạo vector index...");
  // await createVectorIndex();
  // console.log("Pipeline embedding kết thúc.");

  // await askQuestion();
  // await inspectView();
}

main();
// function printEmbeddings(texts, vectors) {
//   texts.forEach((text, i) => {
//     const preview = vectors[i].slice(0, 10).join(", ");
//     console.log(`🔹 Vector cho file ${i + 1}: ${preview} ...\n`);
//   });
// }

// function compareVectors(vectors) {
//   for (let i = 0; i < vectors.length; i++) {
//     for (let j = i + 1; j < vectors.length; j++) {
//       const angle = VectorMath.angleBetweenVectors(vectors[i], vectors[j]);
//       console.log(`Góc(${i},${j}) = ${angle}`);
//     }
//   }
// }

// D:\code\Nodejs\text-reader\arangodb\graph.js
