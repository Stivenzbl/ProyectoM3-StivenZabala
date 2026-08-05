/*
 * gemini.js — Adaptadores entre el payload interno y Gemini
 *
 * El frontend conserva el contrato de M3L6:
 *   messages: [{ role: "user" | "assistant", content: string }]
 *
 * Gemini espera:
 *   contents: [{ role: "user" | "model", parts: [{ text }] }]
 *
 * Mantiene la regla estricta de Gemini API: contents[0] SIEMPRE debe ser rol 'user'.
 */

export function toGeminiContents(messages) {
  if (!Array.isArray(messages)) return [];

  const formatted = messages
    .filter((msg) => msg?.role === "user" || msg?.role === "assistant")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: String(msg.content ?? "") }],
    }));

  // Garantizar que el primer mensaje enviado a Gemini sea del usuario
  const firstUserIndex = formatted.findIndex((msg) => msg.role === "user");
  if (firstUserIndex === -1) return [];

  return formatted.slice(firstUserIndex);
}
