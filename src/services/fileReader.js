import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import {
  chunkByRuleWithHeaderRepeatNormalized,
  chunkByLengthWithOverlap,
} from "../utils/chunking.js";
import { extractMetadata } from "../utils/metadataExtractor.js";
import { getBookIds } from "../services/arangodb/collection.js";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const folderPath = path.join(__dirname, "../../data");

export async function readTextFiles() {
  try {
    const files = await fs.readdir(folderPath);
    if (!files.length) {
      console.log("Thư mục data rỗng.");
      return [];
    }

    // Lấy danh sách bookId đã có trong DB
    const existingBookIds = await getBookIds();

    // Chỉ lấy file .txt và chưa có trong DB
    const newFiles = files.filter((file) => {
      const bookId = path.basename(file, ".txt");
      return file.endsWith(".txt") && !existingBookIds.includes(bookId);
    });

    if (!newFiles.length) {
      console.log("Không có file mới để xử lý.");
      return [];
    }

    const allChunks = [];

    for (const file of newFiles) {
      const filePath = path.join(folderPath, file);
      const content = await fs.readFile(filePath, "utf8");
      console.log(`Đọc file ${file} thành công.`);

      const bookId = path.basename(file, ".txt");

      // Regex lấy Author và Title
      const authorMatch = content.match(/^#Author:\s*(.+)$/im);
      const titleMatch = content.match(/^#Title:\s*(.+)$/im);

      const author = authorMatch ? authorMatch[1].trim() : null;
      const bookTitle = titleMatch ? titleMatch[1].trim() : bookId;
      // Chia text thành chapters & sections
      const chapters = chunkByRuleWithHeaderRepeatNormalized(
        content,
        bookId,
        200
      );

      let chunkIndex = 1;

      for (const chapter of chapters) {
        const { chapterNumber, chapterTitle, sections } = chapter;

        for (const section of sections) {
          // Chia section quá dài thành nhiều chunk
          const lengthChunks = chunkByLengthWithOverlap(section, 150, 30);

          for (const chunkObj of lengthChunks) {
            const metadata = extractMetadata(chunkObj.content, {
              bookId,
              chapterNumber,
              chapterTitle,
              sectionNumber: section.sectionNumber,
              chunkIndex: chunkIndex++,
              sourceFile: file,
            });

            allChunks.push({
              ...metadata,
              bookTitle,
              author,
              content: chunkObj.content,
              type: "text",
              position: { start: 0, end: chunkObj.content.length },
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    console.log(`Đã tạo tổng cộng ${allChunks.length} chunks`);
    if (allChunks.length) console.log("Chunk số 1:", allChunks[0]);
    return allChunks;
  } catch (err) {
    console.error("Lỗi khi đọc file:", err);
    return [];
  }
}
