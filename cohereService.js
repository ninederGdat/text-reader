const API_KEY = "nVMRGyMbqiWNEaIwxZTkpYg3qvDIuudfsg7n7bmr";
const API_URL = "https://api.cohere.com/v2/embed";

export async function getEmbeddings(texts) {
  const requestBody = {
    model: "embed-v4.0",
    input_type: "classification",
    texts,
    embedding_types: ["float"],
  };

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    console.log(`Lỗi API: ${response.status}`);
    return null;
  }

  const data = await response.json();
  return data.embeddings.float;
}
