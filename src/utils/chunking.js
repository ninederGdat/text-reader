import { parseHeader } from "../utils/parseHeader.js";
//chunkByLengthWithOverlap: chia một section thành các chunk nhỏ
export function chunkByLengthWithOverlap(
  section,
  chunkSize = 200,
  overlap = 50,
  startIndex = 1
) {
  const words = (section.text || "").split(/\s+/).filter(Boolean);
  const chunks = [];
  let chunkIndex = startIndex;

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize);
    if (!chunkWords.length) continue;

    chunks.push({
      bookId: section.bookId || null,
      chapterNumber: section.chapterNumber || null,
      sectionNumber: section.sectionNumber || null,
      chunkIndex: chunkIndex++,
      content: chunkWords.join(" "),
    });
  }

  return chunks;
}

export function normalizeHeaders(text) {
  if (!text) return text;
  text = text.replace(/#(?=\S)/g, "# ");

  text = text.replace(/([^\n])\n?#\s+/g, (m, g1) => {
    if (/\n$/.test(g1)) return g1 + "# ";
    return g1 + "\n# ";
  });
  return text;
}

// splitHeaderAndContent: chỉ áp dụng cho dòng bắt đầu bằng '#'
// trả về [header, contentAfter] header là phần tiêu đề, contentAfter là phần còn lại trên cùng dòng
export function splitHeaderAndContent(line) {
  const trimmed = line.trim();
  if (!/^#+\s*/.test(trimmed)) return [null, line];
  const rest = trimmed.replace(/^#+\s*/, ""); // bỏ dấu #
  const words = rest.split(/\s+/);
  const headerWords = [];
  let i = 0;
  for (; i < words.length; i++) {
    const w = words[i];
    // nếu là từ IN HOA và ngắn (có vẻ là phần header chính), gom lại
    if (w === w.toUpperCase() && w.length <= 30) {
      headerWords.push(w);
    } else {
      break;
    }
  }
  if (headerWords.length > 0) {
    const header = headerWords.join(" ");
    const content = words.slice(i).join(" ").trim();
    return [header, content];
  }
  // Nếu không phải chuỗi IN HOA, thử tách theo dấu phân cách common (: - |)
  const m = rest.match(/^([^:\-–—|]+)[:\-–—|]\s*(.*)$/);
  if (m) return [m[1].trim(), m[2].trim()];
  return [rest.trim(), ""];
}

export function isHeader(line) {
  return !!parseHeader(line);
}

export function chunkByRuleWithHeaderRepeatNormalized(
  text,
  bookId,
  threshold = 200
) {
  text = normalizeHeaders(text);
  const lines = text.split(/\n+/);
  const chapters = [];
  let currentChapter = null;
  let currentSection = null;

  function pushSection() {
    if (!currentChapter || !currentSection) return;
    // trim text trước khi push
    currentSection.text = (currentSection.text || "").trim();
    currentChapter.sections.push({ ...currentSection });
    currentSection = null;
  }

  function pushChapter() {
    if (!currentChapter) return;
    pushSection();
    chapters.push({ ...currentChapter });
    currentChapter = null;
  }

  for (const rawLine of lines) {
    const line = (rawLine || "").trim();
    if (!line) continue;

    const headerInfo = parseHeader(line);

    if (headerInfo) {
      //  Chapter
      if (headerInfo.type === "chapter") {
        // đóng chapter trước đó
        pushChapter();

        currentChapter = {
          bookId,
          chapterNumber: headerInfo.number || null,
          chapterTitle:
            headerInfo.title ||
            (headerInfo.number ? `Chapter ${headerInfo.number}` : "Chapter"),
          sections: [],
          nextSectionNumber: 1,
        };

        // Nếu có nội dung ngay sau header trên cùng dòng -> bắt làm text đầu tiên của section
        if (headerInfo.contentAfter) {
          currentSection = {
            bookId,
            chapterNumber: currentChapter.chapterNumber,
            chapterTitle: currentChapter.chapterTitle,
            sectionNumber: currentChapter.nextSectionNumber,
            sectionTitle: `Section ${currentChapter.nextSectionNumber}`,
            text: headerInfo.contentAfter,
          };
          currentChapter.nextSectionNumber++;
        }
        continue;
      }

      //  Section
      if (headerInfo.type === "section") {
        // đảm bảo có chapter
        if (!currentChapter) {
          currentChapter = {
            bookId,
            chapterNumber: 1,
            chapterTitle: "Chapter 1",
            sections: [],
            nextSectionNumber: 1,
          };
        }

        // push current section nếu có, rồi tạo section mới với số cụ thể
        pushSection();
        const secNum = headerInfo.number || currentChapter.nextSectionNumber;
        currentSection = {
          bookId,
          chapterNumber: currentChapter.chapterNumber,
          chapterTitle: currentChapter.chapterTitle,
          sectionNumber: secNum,
          sectionTitle: headerInfo.title || `Section ${secNum}`,
          text: headerInfo.contentAfter || "",
        };
        // đảm bảo nextSectionNumber không bị lùi
        currentChapter.nextSectionNumber = Math.max(
          currentChapter.nextSectionNumber || 1,
          secNum + 1
        );
        continue;
      }

      //  Heading (markdown hoặc uppercase short)
      if (headerInfo.type === "heading") {
        // Nếu chưa có chapter thì tạo chapter mặc định
        if (!currentChapter) {
          currentChapter = {
            bookId,
            chapterNumber: 1,
            chapterTitle: "Chapter 1",
            sections: [],
            nextSectionNumber: 1,
          };
        }

        // push section cũ rồi tạo section mới dựa trên heading
        const nextSectionNumber = currentChapter.nextSectionNumber || 1;
        pushSection();
        currentSection = {
          bookId,
          chapterNumber: currentChapter.chapterNumber,
          chapterTitle: currentChapter.chapterTitle,
          sectionNumber: nextSectionNumber,
          sectionTitle: headerInfo.title || `Section ${nextSectionNumber}`,
          text: headerInfo.contentAfter || "",
        };
        currentChapter.nextSectionNumber = nextSectionNumber + 1;
        continue;
      }
    }

    // dòng bình thường (không phải header)
    if (!currentChapter) {
      currentChapter = {
        bookId,
        chapterNumber: 1,
        chapterTitle: "Chapter 1",
        sections: [],
        nextSectionNumber: 1,
      };
    }

    if (!currentSection) {
      const nextSectionNumber = currentChapter.nextSectionNumber || 1;
      currentSection = {
        bookId,
        chapterNumber: currentChapter.chapterNumber,
        chapterTitle: currentChapter.chapterTitle,
        sectionNumber: nextSectionNumber,
        sectionTitle: `Section ${nextSectionNumber}`,
        text: line,
      };
      currentChapter.nextSectionNumber = nextSectionNumber + 1;
    } else {
      currentSection.text += (currentSection.text ? " " : "") + line;

      // nếu section quá dài thì push để bắt section mới
      const wordCount = (currentSection.text || "")
        .split(/\s+/)
        .filter(Boolean).length;
      if (wordCount >= threshold) {
        pushSection();
      }
    }
  }

  // Push phần còn lại
  pushSection();
  pushChapter();

  return chapters;
}
