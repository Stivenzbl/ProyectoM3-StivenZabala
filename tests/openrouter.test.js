import { describe, it, expect } from "vitest";
import { toOpenRouterMessages, isOpenRouterKey } from "../api/utils/openrouter.js";

describe("api/utils/openrouter.js", () => {
  it("detecta claves de OpenRouter con prefijo sk-or-", () => {
    expect(isOpenRouterKey("sk-or-v1-abcdef123456")).toBe(true);
    expect(isOpenRouterKey("AIzaSyA5TxlrLYaIQ9pO8OPVf6cLoL5noY4qwtU")).toBe(false);
    expect(isOpenRouterKey("")).toBe(false);
  });

  it("formatea correctamente los mensajes incluyendo el system prompt", () => {
    const system = "Actúa como un científico.";
    const messages = [
      { role: "user", content: "hola" },
      { role: "assistant", content: "saludos" },
    ];

    const formatted = toOpenRouterMessages(system, messages);
    expect(formatted).toEqual([
      { role: "system", content: "Actúa como un científico." },
      { role: "user", content: "hola" },
      { role: "assistant", content: "saludos" },
    ]);
  });
});
