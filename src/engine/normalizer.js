/*
 * normalizer.js — Parseo y Limpieza Robusta de Respuestas de la IA
 *
 * Filtra automáticamente artefactos de razonamiento en inglés ("I need to stick to the rules..."),
 * bloques <think>...</think> y etiquetas de seguridad ("User Safety: safe"),
 * garantizando que la UI reciba únicamente respuestas en idioma español.
 */

export function isEnglishText(text) {
  if (!text || typeof text !== "string") return false;
  const englishWords = /\b(the|is|to|and|i|of|you|a|in|that|have|it|for|not|on|with|as|do|at|this|but|from|they|we|or|an|my|would|there|their|what|so|if|about|me|when|can|like|time|no|just|know|into|your|some|could|them|other|then|now|look|only|its|think|also|back|after|use|how|our|first|well|want|because|any|these|most|user|asking|rules|respond|spanish|lines|thoughts|household|cleaning|baking|relief|maybe|check)\b/gi;
  const spanishWords = /\b(el|la|de|que|y|en|un|se|por|con|para|una|su|al|lo|como|más|pero|sus|le|ya|o|este|cuando|muy|sin|sobre|también|me|hay|donde|quien|desde|todo|nos|todos|uno|otro|estos|mucho|nada|hola|respondo|gracias|puedo|hacer|receta|experimento|deducción|estrellas)\b/gi;

  const engMatches = (text.match(englishWords) || []).length;
  const spaMatches = (text.match(spanishWords) || []).length;

  return engMatches > 2 && engMatches > spaMatches;
}

export function cleanTextResponse(text) {
  if (!text || typeof text !== "string") return "";

  let cleaned = text.trim();

  // 1. Eliminar etiquetas de pensamiento explícitas <think>...</think> o [THINKING]...[/THINKING]
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  cleaned = cleaned.replace(/\[THINKING\][\s\S]*?\[\/THINKING\]/gi, "").trim();

  // 2. Eliminar marcas de seguridad como 'User Safety: safe'
  cleaned = cleaned.replace(/User Safety:\s*safe/gi, "");
  cleaned = cleaned.replace(/Safety Assessment:\s*\w+/gi, "");
  cleaned = cleaned.trim();

  // 3. Detectar y filtrar párrafos de análisis/pensamiento en inglés (CoT leakage)
  if (isEnglishText(cleaned)) {
    const paragraphs = cleaned.split(/\n{2,}/);
    const spanishParagraphs = paragraphs.filter((p) => !isEnglishText(p));

    if (spanishParagraphs.length > 0) {
      cleaned = spanishParagraphs.join("\n\n").trim();
    } else {
      cleaned = "";
    }
  }

  // 4. Fallback si el texto quedó vacío o era pensamiento en inglés
  if (
    !cleaned ||
    /^safe$/i.test(cleaned) ||
    /^user safety/i.test(cleaned) ||
    isEnglishText(cleaned)
  ) {
    cleaned = "¡Hola! Como tu asistente en español, estoy listo para ayudarte. ¿Qué te gustaría consultar?";
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
