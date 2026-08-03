/*
 * normalizer.js — Parseo robusto de la respuesta de la AI API
 *
 * Anthropic no devuelve un string directo. Devuelve content como array de bloques:
 * [
 *   { type: "text", text: "Hola..." },
 *   { type: "tool_use", ... }
 * ]
 *
 * La UI necesita un string seguro. Este módulo filtra bloques de texto,
 * concatena su contenido y nunca rompe si llega un shape inesperado.
 */

/*
 * normalizeAIResponse(raw)
 * Devuelve siempre { text: string, truncated: boolean }.
 */
export function normalizeAIResponse(raw) {
  const blocks = Array.isArray(raw?.content) ? raw.content : [];

  const text = blocks
    .filter((block) => block && block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();

  const truncated = raw?.stop_reason === "max_tokens";

  return { text, truncated };
}

/*
 * extractUsage(raw)
 * Extrae métricas de tokens para logging/debug educativo.
 */
export function extractUsage(raw) {
  return {
    inputTokens: raw?.usage?.input_tokens ?? 0,
    outputTokens: raw?.usage?.output_tokens ?? 0,
  };
}
