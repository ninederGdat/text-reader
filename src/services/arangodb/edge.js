import { db } from "./index.js";
import { edgesBook } from "./collection.js";

export async function insertEdge(fromId, toId, edgeType) {
  return edgesBook.save({
    _from: fromId,
    _to: toId,
    type: edgeType,
  });
}

export async function getEdgesByFrom(fromId) {
  const cursor = await db.query(
    `
    FOR edge IN edgesBook
      FILTER edge._from == @fromId
      RETURN edge
  `,
    { fromId }
  );
  return cursor.all();
}

export async function getEdgesFromNode(nodeId) {
  const cursor = await db.query(
    `
    FOR edge IN edgesBook
        FILTER edge._from == @nodeId
        RETURN edge
    `,
    { nodeId }
  );
  return cursor.all();
}
