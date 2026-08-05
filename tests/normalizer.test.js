import { describe, it, expect } from "vitest";
import { normalizeAIResponse, extractUsage } from "../src/engine/normalizer.js";

describe("normalizer.js", () => {
  it("extrae el texto de la respuesta estructurada de la IA", () => {
    const raw = {
      content: [{ type: "text", text: "¡Hola! Soy la IA." }],
      stop_reason: "end_turn",
    };

    const normalized = normalizeAIResponse(raw);
    expect(normalized.text).toBe("¡Hola! Soy la IA.");
    expect(normalized.truncated).toBe(false);
  });

  it("detecta respuestas truncadas por limite de tokens", () => {
    const raw = {
      content: [{ type: "text", text: "Respuesta larga incom..." }],
      stop_reason: "max_tokens",
    };

    const normalized = normalizeAIResponse(raw);
    expect(normalized.truncated).toBe(true);
  });

  it("retorna string vacio si la respuesta no tiene bloques de texto validos", () => {
    expect(normalizeAIResponse(null).text).toBe("");
    expect(normalizeAIResponse({}).text).toBe("");
    expect(normalizeAIResponse({ content: [] }).text).toBe("");
  });

  it("extrae el conteo de tokens con extractUsage", () => {
    const raw = { usage: { input_tokens: 15, output_tokens: 42 } };
    const usage = extractUsage(raw);
    expect(usage.inputTokens).toBe(15);
    expect(usage.outputTokens).toBe(42);
  });
});
