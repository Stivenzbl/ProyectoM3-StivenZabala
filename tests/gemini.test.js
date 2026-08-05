import { describe, it, expect } from "vitest";
import { toGeminiContents } from "../api/utils/gemini.js";

describe("api/utils/gemini.js", () => {
  it("convierte role assistant a role model y asegura que inicie con user", () => {
    const input = [
      { role: "user", content: "pregunta" },
      { role: "assistant", content: "respuesta" },
    ];
    const result = toGeminiContents(input);

    expect(result).toEqual([
      { role: "user", parts: [{ text: "pregunta" }] },
      { role: "model", parts: [{ text: "respuesta" }] },
    ]);
  });

  it("preserva todo el historial recortado para dar contexto", () => {
    const messages = [
      { role: "user", content: "mi nombre es Ana" },
      { role: "assistant", content: "Hola Ana" },
      { role: "user", content: "como me llamo?" },
    ];

    expect(toGeminiContents(messages)).toHaveLength(3);
  });
});
