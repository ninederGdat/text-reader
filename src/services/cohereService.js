// cohereService.js
const API_KEY = "wJ0AQXHP3pvuuCWCoBtieNLMkwgC4d6bbi9dC0aF";
const EMBED_URL = "https://api.cohere.com/v2/embed";
const CHAT_URL = "https://api.cohere.com/v2/chat";

//  Embedding
export async function getEmbeddings(texts) {
  const requestBody = {
    model: "embed-v4.0",
    input_type: "classification",
    texts,
    embedding_types: ["float"],
  };

  const response = await fetch(EMBED_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  const data = await response.json();
  return data.embeddings.float;
}

export async function getEmbeddingsWithRetry(texts, retries = 3, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await getEmbeddings(texts);
    } catch (error) {
      console.error(`Lỗi khi gọi Cohere (attempt ${attempt}):`, error.message);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        throw new Error("Không thể lấy embedding sau nhiều lần thử.");
      }
    }
  }
}

//  Chat / Generative QA
export async function chatWithCohere(messages, model = "command-a-03-2025") {
  const response = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      stream: false,
      model,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat API Error: ${response.status}`);
  }

  const body = await response.json();

  // Lấy toàn bộ text từ message.content
  if (!body.message || !body.message.content) {
    throw new Error("Không tìm thấy message.content trong response Cohere.");
  }

  const answer = body.message.content
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  return answer;
}
