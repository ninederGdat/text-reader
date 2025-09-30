import { splitHeaderAndContent } from "./chunking.js";
//trả object chi tiết nếu dòng là header (chapter/section/heading), ngược lại null
export function parseHeader(line) {
  const t = (line || "").trim();
  if (!t) return null;

  // Kiểm tra CHAPTER dạng: "#Chapter: 123", "# Chapter 123", "Chapter 123", "Chapter: 123"
  let m = t.match(/^#?\s*chapter\s*[:\s]*([0-9]+)\s*(.*)$/i);
  if (m) {
    return {
      type: "chapter",
      number: parseInt(m[1], 10),
      title: m[2] ? m[2].trim() : null,
      contentAfter: m[2] ? m[2].trim() : "",
    };
  }

  // Kiểm tra SECTION tương tự
  m = t.match(/^#?\s*section\s*[:\s]*([0-9]+)\s*(.*)$/i);
  if (m) {
    return {
      type: "section",
      number: parseInt(m[1], 10),
      title: m[2] ? m[2].trim() : null,
      contentAfter: m[2] ? m[2].trim() : "",
    };
  }

  // Nếu là markdown heading (bắt đầu bằng '#'), tách header và phần nội dung sau cùng dòng
  if (/^#+/.test(t)) {
    const [headerText, contentAfter] = splitHeaderAndContent(t);

    if (headerText) {
      const chapMatch = headerText.match(/^\s*chapter\s*[:\s]*([0-9]+)\b/i);
      if (chapMatch) {
        return {
          type: "chapter",
          number: parseInt(chapMatch[1], 10),
          title:
            headerText.replace(/^\s*chapter\s*[:\s]*[0-9]+\b/i, "").trim() ||
            null,
          contentAfter: contentAfter || "",
        };
      }
      const secMatch = headerText.match(/^\s*section\s*[:\s]*([0-9]+)\b/i);
      if (secMatch) {
        return {
          type: "section",
          number: parseInt(secMatch[1], 10),
          title:
            headerText.replace(/^\s*section\s*[:\s]*[0-9]+\b/i, "").trim() ||
            null,
          contentAfter: contentAfter || "",
        };
      }

      // không phải Chapter/Section -> coi như heading bình thường
      return {
        type: "heading",
        title: headerText,
        contentAfter: contentAfter || "",
      };
    }
  }

  //
  if (t.length <= 40 && t === t.toUpperCase()) {
    return {
      type: "heading",
      title: t,
      contentAfter: "",
    };
  }

  // không phải header
  return null;
}
