// generateAnswer.js
import { chatWithCohere } from "../services/cohereService.js";

export async function generateAnswer(question, chunks) {
  const context = chunks.join("\n---\n");

  const messages = [
    {
      role: "system",
      content: [
        {
          type: "text",
          text: "Bạn là trợ lý thông minh. Dựa trên thông tin dưới đây, trả lời câu hỏi ngắn gọn, rõ ràng và chính xác.",
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `Thông tin:\n${context}\n\nCâu hỏi: ${question}`,
        },
      ],
    },
  ];

  const answer = await chatWithCohere(messages);
  return answer;
}
