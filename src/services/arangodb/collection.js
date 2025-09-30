import { db } from "./index.js";

// Vertex collections
export const books = db.collection("Book");
export const chapters = db.collection("Chapter");
export const sections = db.collection("Section");

// Edge collections
export const bookChapterEdges = db.collection("bookChapterEdges");
export const chapterSectionEdges = db.collection("chapterSectionEdges");
export const edgesBook = db.collection("edgesBook");
// Embeddings
export const embeddings = db.collection("embeddings");

// lấy danh sách BookId đang có trong DB
export async function getBookIds() {
  try {
    const cursor = await db.query(`
      FOR b IN Book
        RETURN b._key
    `);
    return await cursor.all(); // array of bookIds
  } catch (err) {
    console.error("Lỗi khi lấy bookIds:", err);
    return [];
  }
}
