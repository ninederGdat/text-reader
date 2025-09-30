// metadataExtractor.js
import nlp from "compromise";
import natural from "natural";
import datesPlugin from "compromise-dates";

nlp.extend(datesPlugin);
// Danh sách tên Trung Quốc phiên âm
const chineseNames = [
  "Qingcheng",
  "Zhuo Fan",
  "Shuang’er",
  "Yan Ma",
  "Dan'er",
  "Ba Sa",
  "Kui Lang",
];

// Load classifier đã train
let classifier;
natural.BayesClassifier.load(
  "./data/classifier.json",
  null,
  function (err, loadedClassifier) {
    if (err) {
      console.error("Load classifier lỗi:", err);
      return;
    }
    classifier = loadedClassifier;
    console.log("Classifier đã load sẵn sàng.");
  }
);

export function extractMetadata(text, context = {}) {
  const doc = nlp(text);

  // Nhận diện people theo Compromise
  const people = doc.people().out("array") || [];

  // Nhận diện people theo danh sách custom
  const customPeople = chineseNames.filter((name) => text.includes(name));

  // Kết hợp 2 nguồn
  const allPeople = Array.from(new Set([...people, ...customPeople]));

  // Dự đoán tag từ classifier
  let tags = [];
  if (classifier) {
    try {
      const tag = classifier.classify(text);
      if (tag) tags.push(tag);
    } catch {
      tags = [];
    }
  }

  // Trích xuất dates và numbers
  let dates = [];
  let numbers = [];
  try {
    dates = doc.dates().out("array") || [];
  } catch (e) {
    dates = [];
  }
  try {
    numbers = doc.numbers().out("array") || [];
  } catch (e) {
    numbers = [];
  }

  return {
    bookId: context.bookId || null,
    chapterNumber: context.chapterNumber || null,
    sectionNumber: context.sectionNumber || null,
    chunkIndex: context.chunkIndex || null,
    type: context.type || "text",
    sourceFile: context.sourceFile || null,
    characters: allPeople,
    dates,
    numbers,
    tags,
    content: text,
  };
}
