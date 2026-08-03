/*
 * request.js — Helpers para leer el request de /api/chat
 *
 * La Serverless Function recibe el payload armado por el engine de M3L6.
 * Ese payload incluye messages[], que es el historial recortado con
 * getTrimmedHistory(). La funcion serverless no reconstruye memoria:
 * solo valida que el historial llegue bien formado.
 */

export function parseJsonBody(body) {
  if (typeof body === "string") {
    return JSON.parse(body || "{}");
  }
  return body ?? {};
}

export function getMessages(payload) {
  const messages = Array.isArray(payload?.messages) ? payload.messages : [];

  if (messages.length === 0) {
    const error = new Error("El payload debe incluir messages[]");
    error.status = 400;
    throw error;
  }

  return messages;
}

export function getGenerationSettings(payload) {
  return {
    system: typeof payload?.system === "string" ? payload.system : "",
    modelName: typeof payload?.model === "string" ? payload.model : "gemini-2.5-flash",
    temperature: typeof payload?.temperature === "number" ? payload.temperature : 0.7,
    maxOutputTokens: typeof payload?.max_tokens === "number" ? payload.max_tokens : 150,
  };
}
