import natural from "natural";
import fs from "fs";

// Tạo classifier kiểu Naive Bayes
const classifier = new natural.BayesClassifier();

// Thêm dữ liệu huấn luyện
classifier.addDocument(
  "the Great Strength Red Dragon King's other giant claw had already fiercely smashed down",
  "Huyền huyễn"
);

classifier.addDocument(
  "Qingcheng… What happened to her? The eyeballs couldn’t help but shrink, Zhuo Fan hurriedly shook Dan’er that skinny little body, and cried out.",
  "Tình cảm"
);

classifier.addDocument(
  "One move, just one move, a Transformation Void fourth level expert, instantly fell, spirit soul destroyed.",
  "Hành động"
);

// Train classifier
classifier.train();

// Tạo thư mục nếu chưa có
const folderPath = "./data";
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath);
}

// Lưu classifier ra file JSON
const modelPath = `${folderPath}/classifier.json`;
classifier.save(modelPath, function (err) {
  if (err) console.error("Lưu classifier lỗi:", err);
  else console.log(`Classifier đã được lưu vào ${modelPath}`);
});
