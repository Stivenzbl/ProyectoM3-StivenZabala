/*
 * normalizer.js — Parseo y Limpieza Robusta de Respuestas de la IA
 *
 * Elimina artefactos de razonamiento interno (<think>...</think>),
 * párrafos de análisis en inglés ("Okay, the user is asking...") y
 * etiquetas de seguridad ("User Safety: safe"), asegurando que la UI
 * reciba siempre un texto limpio, coherente y en español.
 */

export function cleanTextResponse(text) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text;

  // 1. Eliminar etiquetas de pensamiento interno de modelos de razonamiento (<think>...</think>)
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Eliminar marcas de seguridad como 'User Safety: safe'
  cleaned = cleaned.replace(/User Safety:\s*safe/gi, "");
  cleaned = cleaned.replace(/Safety Assessment:\s*\w+/gi, "");

  // 3. Eliminar párrafos de análisis/pensamiento en inglés (ej: "Okay, the user is asking...")
  if (/^(Okay|The user|Let's analyze|Let me recall)[\s\S]*?\n\n/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(Okay|The user|Let's analyze|Let me recall)[\s\S]*?\n\n/i, "");
  } else if (/^(Okay,?\s+the\s+user|The\s+user\s+is\s+asking|Let\s+me\s+recall)/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(Okay|The user|Let me recall)[\s\S]*?\.\s*/i, "");
  }

  cleaned = cleaned.trim();

  // 4. Fallback si el texto quedó vacío o sólo contenía etiquetas de seguridad
  if (!cleaned || /^safe$/i.test(cleaned) || /^user safety/i.test(cleaned)) {
    cleaned = "¡Hola! Estoy listo para ayudarte. ¿Qué te gustaría consultar hoy?";
  }

  return cleaned;
}

/*
 * normalizeAIResponse(raw)
 * Devuelve siempre { text: string, truncated: boolean } limpio y formateado.
 */
export function normalizeAIResponse(raw) {
  const blocks = Array.isArray(raw?.content) ? raw.content : [];

  const rawText = blocks
    .filter((block) => block && block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();

  const text = cleanTextResponse(rawText);
  const truncated = raw?.stop_reason === "max_tokens";

  return { text, truncated };
}

/*
 * extractUsage(raw)
 * Extrae métricas de tokens para logging/debug.
 */
export function extractUsage(raw) {
  return {
    inputTokens: raw?.usage?.input_tokens ?? 0,
    outputTokens: raw?.usage?.output_tokens ?? 0,
  };
}
