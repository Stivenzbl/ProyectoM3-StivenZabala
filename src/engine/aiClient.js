/*
 * aiClient.js — Cliente frontend hacia la Serverless Function
 *
 * Este módulo reemplaza el mock local de M3L6.
 * La UI y el engine siguen trabajando con el mismo payload y el mismo
 * response shape. Lo único que cambia es la frontera de red:
 *
 *   frontend -> /api/chat -> serverless function -> Gemini
 *
 * La API key nunca aparece en este archivo.
 */

export async function callAI(payload) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(data.error || `HTTP ${response.status}`);
    err.status = response.status;
    err.retryAfterSeconds = data.retryAfterSeconds;
    throw err;
  }

  return data;
}
