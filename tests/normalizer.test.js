import { describe, it, expect } from "vitest";
import { normalizeAIResponse, extractUsage, cleanTextResponse } from "../src/engine/normalizer.js";

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

  it("elimina marcas de seguridad como User Safety: safe y pensamientos en ingles", () => {
    const textWithSafety = "User Safety: safe";
    expect(cleanTextResponse(textWithSafety)).toContain("¡Hola!");

    const textWithThinking = "Okay, the user is asking about baking soda. Let me recall...\n\nEl bicarbonato de sodio es un compuesto químico muy versátil.";
    expect(cleanTextResponse(textWithThinking)).toBe("El bicarbonato de sodio es un compuesto químico muy versátil.");
  });

  it("elimina bloques de pensamiento <think>...</think>", () => {
    const reasoningText = "<think>Analyzing user request...</think>Respuesta en español directa.";
    expect(cleanTextResponse(reasoningText)).toBe("Respuesta en español directa.");
  });

  it("detecta respuestas truncadas por limite de tokens", () => {
    const raw = {
      content: [{ type: "text", text: "Respuesta larga incom..." }],
      stop_reason: "max_tokens",
    };

    const normalized = normalizeAIResponse(raw);
    expect(normalized.truncated).toBe(true);
  });

  it("extrae el conteo de tokens con extractUsage", () => {
    const raw = { usage: { input_tokens: 15, output_tokens: 42 } };
    const usage = extractUsage(raw);
    expect(usage.inputTokens).toBe(15);
    expect(usage.outputTokens).toBe(42);
  });
});
