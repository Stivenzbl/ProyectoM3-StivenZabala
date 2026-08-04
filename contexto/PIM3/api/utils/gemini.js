/*
 * gemini.js — Adaptadores entre el payload interno y Gemini
 *
 * El frontend conserva el contrato de M3L6:
 *   messages: [{ role: "user" | "assistant", content: string }]
 *
 * Gemini espera:
 *   contents: [{ role: "user" | "model", parts: [{ text }] }]
 *
 * Esta transformacion manda TODO el historial recortado, no solo el ultimo
 * mensaje. Asi el modelo conserva contexto entre turnos.
 */

export function toGeminiContents(messages) {
  return messages
    .filter((msg) => msg?.role === "user" || msg?.role === "assistant")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: String(msg.content ?? "") }],
    }));
}
