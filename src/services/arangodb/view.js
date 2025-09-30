import { db } from "./index.js";

export async function createVectorView() {
  const viewName = "search_book";

  try {
    // Kiểm tra xem view đã tồn tại chưa
    const existingViews = await db.listViews();
    if (existingViews.find((v) => v.name === viewName)) {
      console.log(`View "${viewName}" đã tồn tại. Bỏ qua tạo mới.`);
      return;
    }

    // Tạo view dạng ArangoSearch với vector field
    await db.createView(viewName, {
      type: "arangosearch",
      links: {
        embeddings: {
          includeAllFields: false,
          fields: {
            embedding: {
              vector: {
                dimension: 1536,
                distance: "cosine",
              },
            },
          },
        },
      },
    });

    console.log(`View "${viewName}" tạo thành công.`);
  } catch (err) {
    console.error("Lỗi khi tạo view:", err);
  }
}

export async function inspectView() {
  const view = db.view("search_book");
  const info = await view.properties();
  console.log(JSON.stringify(info, null, 2));
}
