import { beforeEach, describe, it, expect, vi } from "vitest";
import { callAI } from "../src/engine/aiClient.js";

// Reemplazamos fetch real por una funcion mock.
// Asi el test no depende de red, Vercel ni Gemini.
global.fetch = vi.fn();

describe("aiClient.js", () => {
  beforeEach(() => {
    // Limpiamos las llamadas anteriores del mock para que cada test arranque
    // sin datos del test previo.
    fetch.mockClear();
  });

  // Este test valida que el cliente frontend llame al endpoint correcto.
  // No prueba Gemini: prueba que nuestro fetch esta bien construido.
  it("hace POST a /api/chat con el payload serializado", async () => {
    const payload = { messages: [{ role: "user", content: "hola" }] };
    const response = { content: [{ type: "text", text: "ok" }] };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => response,
    });

    await callAI(payload);

    expect(fetch).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  });

  // Este test simula una respuesta HTTP fallida.
  // Sirve para verificar que callAI convierte response.ok false en un Error.
  it("lanza Error cuando /api/chat responde con response.ok false", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: "Rate limit", retryAfterSeconds: 8 }),
    });

    await expect(callAI({ messages: [] })).rejects.toThrow("Rate limit");
  });
});
