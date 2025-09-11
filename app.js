import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getEmbeddings } from "./cohereService.js";
import { VectorMath } from "./vectorMath.js";
import {
  chunkByRuleWithHeaderRepeatNormalized,
  chunkByLengthWithOverlap,
} from "./chunking.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folderPath = path.join(__dirname, "data");

// 📖 Đọc file và áp dụng chunk
async function readTextFiles() {
  try {
    const files = await fs.readdir(folderPath);
    let allChunks = [];

    if (!files.length) {
      console.log("Thư mục rỗng, không có file để đọc.");
      return [];
    }

    for (const file of files) {
      if (file.endsWith(".txt")) {
        const filePath = path.join(folderPath, file);
        const content = await fs.readFile(filePath, "utf8");
        console.log(`📄 Nội dung file ${file}:\n${content}\n`);

        // Áp dụng chunk theo rule
        const ruleChunks = chunkByRuleWithHeaderRepeatNormalized(content, 200);

        // Với mỗi chunk theo rule, tiếp tục chunk nhỏ hơn theo độ dài
        for (const chunk of ruleChunks) {
          const lengthChunks = chunkByLengthWithOverlap(chunk.text, 150, 30);
          allChunks.push(...lengthChunks);
        }
      }
    }

    return allChunks;
  } catch (err) {
    console.error("Lỗi khi đọc thư mục:", err);
    return [];
  }
}

async function main() {
  const texts = await readTextFiles().then((chunks) => {
    console.log("Tổng số chunks:", chunks.length);
    console.log(chunks.slice(0, 5));
  }); // In thử 5 chunk đầu tiên
}

function printEmbeddings(texts, vectors) {
  texts.forEach((text, i) => {
    const preview = vectors[i].slice(0, 10).join(", ");
    console.log(`🔹 Vector cho file ${i + 1}: ${preview} ...\n`);
  });
}

function compareVectors(vectors) {
  for (let i = 0; i < vectors.length; i++) {
    for (let j = i + 1; j < vectors.length; j++) {
      const angle = VectorMath.angleBetweenVectors(vectors[i], vectors[j]);
      console.log(`Góc(${i},${j}) = ${angle}`);
    }
  }
}

main();
