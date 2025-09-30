import readline from "readline";
import { getEmbeddingsWithRetry } from "../services/cohereService.js";
import { queryEmbeddings } from "../services/arangodb/embeddingsCollection.js";
import { generateAnswer } from "./generateAnswer.js";

function askInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(prompt, (ans) => {
      rl.close();
      resolve(ans);
    })
  );
}

export async function askQuestion() {
  try {
    const question = await askInput("Nhập câu hỏi: ");

    const [questionEmbedding] = await getEmbeddingsWithRetry([question]);
    // console.log("questionEmbedding ok? length:", questionEmbedding.length);

    // Query DB tìm đoạn tương tự
    const results = await queryEmbeddings(questionEmbedding, 5);

    if (!results.length) {
      console.log("Không tìm thấy đoạn tương tự nào.");
      return;
    }

    // Lấy top-k chunk content
    const topChunks = results.map((r) => r.section.content);

    //Gọi generateAnswer để tạo câu trả lời ngắn gọn
    const answer = await generateAnswer(question, topChunks);

    // Hiển thị kết quả
    console.log("\n=== Answer (tóm tắt từ top-k chunk) ===");
    console.log(answer);

    // console.log("\n=== Top-k chunks ===");
    // results.forEach((r, i) => {
    //   console.log(
    //     `\n#${i + 1} (Score: ${r.score.toFixed(4)}) [Section: ${
    //       r.section.id
    //     }]\n${r.section.content}`
    //   );
    // });
  } catch (err) {
    console.error("Lỗi khi hỏi:", err);
  }
}
