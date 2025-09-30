// arangodb/setupEmbeddingsCollection.js
import { db } from "./index.js";

const COLLECTION_NAME = "embeddings";

export async function setupEmbeddingsCollection() {
  try {
    const embeddings = db.collection(COLLECTION_NAME);

    // Kiểm tra collection đã tồn tại chưa
    const exists = await embeddings.exists();
    if (!exists) {
      await embeddings.create();
      console.log(`Collection '${COLLECTION_NAME}' đã được tạo`);
    } else {
      console.log(`Collection '${COLLECTION_NAME}' đã tồn tại`);
    }

    // Persistent Index (metadata)
    await embeddings.ensureIndex({
      type: "persistent",
      fields: ["bookId", "chapterNumber", "sectionNumber"],
      unique: false,
    });
    console.log(
      "Persistent index đã được tạo cho bookId, chapterNumber, sectionNumber"
    );

    return embeddings;
  } catch (err) {
    console.error("Lỗi khi setup collection embeddings:", err);
    throw err;
  }
}

// Truy vấn đoạn tương tự
export async function queryEmbeddings(queryEmbedding, topK = 5) {
  if (!Array.isArray(queryEmbedding)) {
    throw new Error("queryEmbedding phải là 1 mảng số (float[])");
  }

  const query = `
    FOR doc IN embeddings
      // Tính dot product
      LET dot = SUM(
        FOR i IN 0..LENGTH(doc.embedding)-1
          RETURN doc.embedding[i] * @queryEmbedding[i]
      )
      // Tính độ dài vector
      LET normDoc = SQRT(SUM(FOR v IN doc.embedding RETURN v*v))
      LET normQuery = SQRT(SUM(FOR v IN @queryEmbedding RETURN v*v))
      // Cosine similarity
      LET score = dot / (normDoc * normQuery)
      SORT score DESC
      LIMIT @k
      RETURN {
        score,
        section: { content: doc.content, id: doc._key }
      }
  `;

  const bindVars = {
    queryEmbedding,
    k: topK,
  };

  console.log("Bind vars:", { k: topK, len: queryEmbedding.length });

  // Truy vấn ArangoDB
  const cursor = await db.query({ query, bindVars });
  return await cursor.all();
}

// // Tự động chạy khi import file
// (async () => {
//   await setupEmbeddingsCollection();
// })();
