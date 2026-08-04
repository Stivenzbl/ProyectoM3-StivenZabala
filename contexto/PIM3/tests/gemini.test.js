import { describe, it, expect } from "vitest";
import { toGeminiContents } from "../api/utils/gemini.js";

describe("api/utils/gemini.js", () => {
  // Este test valida la diferencia de nombres entre nuestra app y Gemini.
  // Internamente usamos assistant; Gemini espera model.
  it("convierte role assistant a role model", () => {
    const result = toGeminiContents([{ role: "assistant", content: "respuesta" }]);

    expect(result).toEqual([
      { role: "model", parts: [{ text: "respuesta" }] },
    ]);
  });

  // Este test confirma que no mandamos solo el ultimo mensaje.
  // El modelo necesita el historial recortado para responder con contexto.
  it("preserva todo el historial, no solo el ultimo mensaje", () => {
    const messages = [
      { role: "user", content: "mi nombre es Ana" },
      { role: "assistant", content: "Hola Ana" },
      { role: "user", content: "como me llamo?" },
    ];

    expect(toGeminiContents(messages)).toHaveLength(3);
  });
});
