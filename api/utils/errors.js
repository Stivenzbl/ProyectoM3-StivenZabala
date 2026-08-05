/*
 * errors.js — Traducción de errores técnicos a respuestas HTTP controladas
 */

export function getHttpStatus(error) {
  return typeof error?.status === "number" ? error.status : 500;
}

export function isRateLimitError(error) {
  const text = String(error?.message ?? "");
  return error?.status === 429 || text.includes("429") || text.toLowerCase().includes("quota");
}

export function isInvalidApiKeyError(error) {
  const text = String(error?.message ?? "");
  return (
    text.includes("API key not valid") ||
    text.includes("API_KEY_INVALID") ||
    (error?.status === 400 && text.includes("API key")) ||
    (error?.status === 404 && text.includes("is not found for API version"))
  );
}
