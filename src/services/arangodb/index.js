import { Database } from "arangojs";

export const db = new Database({
  url: "http://127.0.0.1:8529",
  databaseName: "_system", // Thay cho useDatabase
  auth: { username: "root", password: "root" }, // Thay cho useBasicAuth
});
export async function createPersistentIndexes() {
  try {
    // Index cho Chapter → filter theo bookId
    await db.collection("Chapter").ensureIndex({
      type: "persistent",
      fields: ["bookId"],
    });
    // Index cho Section → filter theo chapterNumber
    await db.collection("Section").ensureIndex({
      type: "persistent",
      fields: ["chapterNumber"],
    });
    // Index cho Book → filter theo title (nếu cần tìm kiếm theo title)
    await db.collection("Book").ensureIndex({
      type: "persistent",
      fields: ["bookTitle"],
    });

    console.log("Persistent indexes created successfully");
  } catch (err) {
    console.error("Error creating persistent indexes:", err);
  }
}

// TẠO VECTOR INDEX
export async function createVectorIndex() {
  try {
    await db.collection("embeddings").ensureIndex({
      type: "vector",
      name: "embeddingIndex",
      fields: ["embedding"],
      params: {
        dimension: 1536,
        metric: "cosine",
        nLists: 1,
      },
    });

    console.log("Vector index created successfully");
  } catch (err) {
    console.error("Error creating vector index:", err);
  }
}

// // CHẠY HÀM KHI KHỞI TẠOs
// (async () => {
//   await createPersistentIndexes();
//   await createVectorIndex();
// })();
