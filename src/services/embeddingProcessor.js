// import { getEmbeddingsWithRetry } from "../services/cohereService.js";
// import {
//   books,
//   chapters,
//   sections,
//   embeddings,
// } from "../services/arangodb/collection.js";
// import { setupEmbeddingsCollection } from "../services/arangodb/embeddingsCollection.js";
// import { readTextFiles } from "./fileReader.js";
// import { insertEdge } from "./arangodb/edge.js";

// export async function runEmbeddingPipeline() {
//   try {
//     const chunks = await readTextFiles();
//     if (!chunks.length) {
//       console.log("Không có chunk nào để xử lý.");
//       return;
//     }

//     await setupEmbeddingsCollection();

//     const bookMap = new Map();

//     //Lưu book / chapter / section vào DB
//     for (const chunk of chunks) {
//       const { bookId, bookTitle, chapterNumber, chapterTitle, sectionNumber } =
//         chunk;

//       if (!bookMap.has(bookId)) {
//         const bookObj = {
//           _key: bookId,
//           title: bookTitle || null,
//           author: chunk.author || null,
//           sourcefile: chunk.sourceFile || null,
//           createdAt: new Date().toISOString(),
//         };
//         // console.log("Book:", bookObj);
//         await books.save(bookObj, { overwriteMode: "update" });
//         bookMap.set(bookId, new Map());
//       }

//       const chapterMap = bookMap.get(bookId);
//       if (!chapterMap.has(chapterNumber)) {
//         const chapterObj = {
//           _key: `${bookId}_${chapterNumber || "intro"}`,
//           bookId,
//           chapterNumber: chapterNumber || null,
//           title: chapterTitle || null,
//           createdAt: new Date().toISOString(),
//         };
//         // console.log("Chapter:", chapterObj);
//         await chapters.save(chapterObj, { overwriteMode: "update" });
//         chapterMap.set(chapterNumber, new Map());
//       }

//       const sectionMap = chapterMap.get(chapterNumber);
//       if (!sectionMap.has(sectionNumber)) {
//         const sectionObj = {
//           _key: `${bookId}_${chapterNumber || "intro"}_${
//             sectionNumber || "intro"
//           }`,
//           bookId,
//           chapterNumber: chapterNumber || null,
//           chapterTitle: chapterTitle || null,
//           sectionNumber: sectionNumber || null,
//           title: chunk.sectionTitle || null,
//           createdAt: new Date().toISOString(),
//           content: chunk.content,
//         };
//         // console.log("Section:", sectionObj);
//         await sections.save(sectionObj, { overwriteMode: "update" });
//         sectionMap.set(sectionNumber, []);
//       }

//       // push chunk vào list
//       sectionMap.get(sectionNumber).push(chunk);
//     }

//     // Duyệt qua từng section → batch → gọi embedding
//     const batchSize = 10;
//     for (const chapterMap of bookMap.values()) {
//       for (const sectionMap of chapterMap.values()) {
//         for (const chunkList of sectionMap.values()) {
//           for (let i = 0; i < chunkList.length; i += batchSize) {
//             const batch = chunkList.slice(i, i + batchSize);
//             const texts = batch.map((c) => c.content);

//             let vectors;
//             try {
//               vectors = await getEmbeddingsWithRetry(texts, 5, 2000);
//               // console.log("Book Data:" + bookObj);
//             } catch (err) {
//               console.error("Batch embedding thất bại, bỏ qua:", err.message);
//               continue;
//             }

//             if (!Array.isArray(vectors) || vectors.length !== texts.length) {
//               console.error("Embedding trả về invalid, bỏ qua batch.");
//               continue;
//             }

//             await Promise.all(
//               batch.map((chunkObj, j) => {
//                 const docKey = `${chunkObj.bookId}_${chunkObj.chapterNumber}_${chunkObj.sectionNumber}_${chunkObj.chunkIndex}`;
//                 return embeddings.save(
//                   {
//                     _key: docKey,
//                     ...chunkObj,
//                     embedding: vectors[j],
//                   },
//                   { overwriteMode: "update" }
//                 );
//               })
//             );

//             console.log(
//               `Đã lưu batch (${i + 1} → ${i + batch.length}) trong section`
//             );
//           }
//         }
//       }
//     }

//     console.log("Pipeline hoàn tất!");
//   } catch (err) {
//     console.error("Lỗi trong pipeline:", err);
//   }
// }

import { getEmbeddingsWithRetry } from "../services/cohereService.js";
import { embeddings, edgesBook } from "../services/arangodb/collection.js";
import { setupEmbeddingsCollection } from "../services/arangodb/embeddingsCollection.js";
import { readTextFiles } from "./fileReader.js";
import { insertEdge } from "./arangodb/edge.js";
import { db } from "../services/arangodb/index.js";

export async function runEmbeddingPipeline() {
  try {
    const chunks = await readTextFiles();
    if (!chunks.length) {
      console.log("Không có chunk nào để xử lý.");
      return;
    }

    await setupEmbeddingsCollection();

    const nodesMap = new Map(); // Map để tracking node đã lưu
    const edgeMap = new Map(); // Map để tránh duplicate edge

    // ----- Tạo nodes & edges -----
    for (const chunk of chunks) {
      const {
        bookId,
        bookTitle,
        author,
        chapterNumber,
        chapterTitle,
        sectionNumber,
        chunkIndex,
        sourceFile,
      } = chunk;
      const dummyVector = new Array(1536).fill(0); // VECTOR_DIMENSION = 1536 chẳng hạn
      // --- Book ---
      const bookKey = `book_${bookId}`;
      if (!nodesMap.has(bookKey)) {
        const bookNode = {
          _key: bookKey,
          type: "book",
          title: bookTitle,
          author: chunk.author || null,
          sourceFile: chunk.sourceFile || null,
          createdAt: new Date().toISOString(),
          embedding: dummyVector,
        };
        console.log("Book Node:", bookNode);

        await embeddings.save(bookNode, { overwrite: true });

        nodesMap.set(bookKey, bookNode);
      }

      // --- Chapter ---
      const chapterKey = `${bookKey}_ch${chapterNumber ?? "intro"}`;
      if (!nodesMap.has(chapterKey)) {
        const chapterNode = {
          _key: chapterKey,
          type: "chapter",
          bookId,
          chapterNumber,
          title: chapterTitle,
          createdAt: new Date().toISOString(),
          embedding: dummyVector,
        };
        await embeddings.save(chapterNode, { overwrite: true });
        nodesMap.set(chapterKey, chapterNode);

        const edgeKey = `${bookKey}->${chapterKey}->hasChapter`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            _from: `embeddings/${bookKey}`,
            _to: `embeddings/${chapterKey}`,
            relation: "hasChapter",
            createdAt: new Date().toISOString(),
          });
        }
      }

      // --- Section ---
      const sectionKey = `${chapterKey}_sec${sectionNumber ?? "intro"}`;
      if (!nodesMap.has(sectionKey)) {
        const sectionNode = {
          _key: sectionKey,
          type: "section",
          bookId,
          chapterNumber,
          chapterTitle,
          sectionNumber,
          embedding: dummyVector,
          createdAt: new Date().toISOString(),
        };
        await embeddings.save(sectionNode, { overwrite: true });
        nodesMap.set(sectionKey, sectionNode);

        const edgeKey = `${chapterKey}->${sectionKey}->hasSection`;
        if (!edgeMap.has(edgeKey)) {
          edgeMap.set(edgeKey, {
            _from: `embeddings/${chapterKey}`,
            _to: `embeddings/${sectionKey}`,
            relation: "hasSection",
            createdAt: new Date().toISOString(),
          });
        }
      }

      // --- Chunk ---
      const chunkKey = `${sectionKey}_chunk${chunkIndex}`;
      const chunkNode = {
        _key: chunkKey,
        type: "chunk",
        bookId,
        chapterNumber,
        sectionNumber,
        content: chunk.content,
        embedding: dummyVector, // placeholder
        createdAt: new Date().toISOString(),
      };
      await embeddings.save(chunkNode, { overwrite: true });
      nodesMap.set(chunkKey, chunkNode);

      const edgeKey = `${sectionKey}->${chunkKey}->hasChunk`;
      if (!edgeMap.has(edgeKey)) {
        edgeMap.set(edgeKey, {
          _from: `embeddings/${sectionKey}`,
          _to: `embeddings/${chunkKey}`,
          relation: "hasChunk",
          createdAt: new Date().toISOString(),
        });
      }
    }

    console.log("=== NodesMap check ===");
    for (const n of nodesMap.values()) {
      console.log(`${n.type}:${n._key}`, n.title ?? n.content?.slice(0, 30));
    }

    // ----- Lưu tất cả nodes -----
    const allNodes = Array.from(nodesMap.values());

    // Quick check ngay sau import
    const nodesAfterImport = await db
      .query(`FOR n IN ${embeddings.name} RETURN n`)
      .then((c) => c.all());

    console.log("=== Quick view after import ===");
    nodesAfterImport.forEach((n) =>
      console.log(
        `${n.type}:${n._key}` +
          (n.title ? " | " + n.title : "") +
          (n.content ? " | " + n.content.slice(0, 30) + "..." : "") +
          (n.embedding ? " | embLen=" + n.embedding.length : "")
      )
    );
    // ----- Lưu tất cả edges -----
    const allEdges = Array.from(edgeMap.values());
    await edgesBook.import(allEdges, { overwriteMode: "update" });

    // ----- Tạo embedding cho chunk nodes -----
    const chunkNodes = allNodes.filter((n) => n.type === "chunk");
    const batchSize = 10;
    for (let i = 0; i < chunkNodes.length; i += batchSize) {
      const batch = chunkNodes.slice(i, i + batchSize);
      const texts = batch.map((n) => n.content);

      let vectors;
      try {
        vectors = await getEmbeddingsWithRetry(texts, 5, 2000);
      } catch (err) {
        console.error("Batch embedding thất bại:", err.message);
        continue;
      }

      if (!Array.isArray(vectors) || vectors.length !== texts.length) {
        console.error("Embedding trả về invalid, bỏ qua batch.");
        continue;
      }
      await Promise.all(
        batch.map((doc, j) =>
          embeddings.update(doc._key, { embedding: vectors[j] })
        )
      );

      console.log(
        `Đã cập nhật embeddings cho batch ${i + 1} → ${i + batch.length}`
      );
    }

    console.log("Pipeline hoàn tất!");
  } catch (err) {
    console.error("Lỗi trong pipeline:", err);
  }
}
