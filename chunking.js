export function chunkByLengthWithOverlap(text, chunkSize = 200, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk) chunks.push(chunk);
  }

  return chunks;
}

function normalizeHeaders(text) {
  text = text.replace(/#(?=\S)/g, "# ");
  // đảm bảo # ở đầu dòng (nếu có dính với ký tự trước, tách thành dòng mới)
  text = text.replace(/([^\n])\n?#\s+/g, (m, g1) => {
    // nếu không đứng đầu dòng thì thêm newline trước '#'
    if (/\n$/.test(g1)) return g1 + "# ";
    return g1 + "\n# ";
  });
  return text;
}

// Xác định header (mở rộng): markdown #, Chapter/Section, hoặc dòng NGẮN viết hoa
function isHeader(line) {
  const t = line.trim();
  if (!t) return false;
  if (/^chapter\s+\d+/i.test(t)) return true;
  if (/^section\s+\d+/i.test(t)) return true;
  if (/^#+/.test(t)) return true;
  // nếu ngắn (ví dụ <=40 ký tự) và là "HÒA TOÀN" (toUpperCase so sánh) -> xem là header
  if (t.length <= 40 && t === t.toUpperCase()) return true;
  return false;
}
// Tách header và phần nội dung còn lại trong dòng
function splitHeaderAndContent(line) {
  const trimmed = line.trim();
  if (!/^#+\s*/.test(trimmed)) return [null, line];
  const rest = trimmed.replace(/^#+\s*/, ""); // bỏ dấu #
  const words = rest.split(/\s+/);
  const headerWords = [];
  let i = 0;
  for (; i < words.length; i++) {
    const w = words[i];
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
  const m = rest.match(/^([^:\-–—|]+)[:\-–—|]\s*(.*)$/);
  if (m) return [m[1].trim(), m[2].trim()];
  return [rest.trim(), ""];
}

export function chunkByRuleWithHeaderRepeatNormalized(text, threshold = 200) {
  text = normalizeHeaders(text);
  const lines = text.split(/\n+/);
  const chunks = [];
  let currentHeader = "";
  let currentChunk = "";

  function pushCurrent() {
    if (currentChunk && currentChunk.trim()) {
      chunks.push({
        header: currentHeader || null,
        text: currentChunk.trim(),
      });
    }
  }

  for (let rawLine of lines) {
    let line = rawLine.trim();
    if (!line) continue;

    if (isHeader(line)) {
      if (/^#+/.test(line)) {
        const [h, contentAfter] = splitHeaderAndContent(line);
        if (currentChunk.trim()) pushCurrent();
        currentHeader = h || line.replace(/^#+\s*/, "").trim();
        currentChunk = currentHeader + (contentAfter ? " " + contentAfter : "");
        continue;
      }

      // nếu là header không markdown (ví dụ CHAPTER 1 hoặc dòng IN HOA)
      if (currentChunk.trim()) pushCurrent();
      currentHeader = line;
      currentChunk = currentHeader;
      continue;
    }

    const candidate = (currentChunk ? currentChunk + " " : "") + line;
    const wordCount = candidate.split(/\s+/).length;

    if (wordCount <= threshold) {
      currentChunk = candidate;
    } else {
      pushCurrent();
      // mở chunk mới, lặp lại header nếu có
      currentChunk = (currentHeader ? currentHeader + " " : "") + line;
    }
  }

  if (currentChunk.trim()) pushCurrent();
  return chunks;
}
