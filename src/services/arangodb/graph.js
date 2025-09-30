import { db, createPersistentIndexes, createVectorIndex } from "./index.js";

// Tên graph
const GRAPH_NAME = "Books";

// Các collection và edge definitions
const edgeDefinitions = [
  {
    collection: "edgesBook",
    from: ["embeddings"],
    to: ["embeddings"],
  },
];

export async function setupGraph() {
  try {
    const graph = db.graph(GRAPH_NAME);
    const exists = await graph.exists();

    if (!exists) {
      console.log(`Graph '${GRAPH_NAME}' chưa có, tạo mới...`);

      // Tạo graph + edge collections + vertex collections tự động
      await db.createGraph({
        name: GRAPH_NAME,
        edgeDefinitions,
        orphanCollections: [],
      });

      console.log(`Graph '${GRAPH_NAME}' đã được tạo.`);
    } else {
      console.log(`Graph '${GRAPH_NAME}' đã tồn tại.`);
    }

    for (const def of edgeDefinitions) {
      const edgeColl = db.collection(def.collection);
      if (!(await edgeColl.exists())) {
        await edgeColl.create();
        console.log(`Tạo edge collection: ${def.collection}`);
      }
    }

    // Tạo indexes
    await createPersistentIndexes();

    return graph;
  } catch (err) {
    console.error("Lỗi khi setup graph:", err);
    throw err;
  }
}
