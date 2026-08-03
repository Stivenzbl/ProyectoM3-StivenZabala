import { describe, it, expect } from "vitest";
import { buildPayload, getCharacter, isValidPayload } from "../src/engine/payload.js";

describe("payload.js", () => {
  // Este test revisa el contrato completo que el frontend manda a /api/chat.
  // system viaja separado y messages[] conserva el historial de conversacion.
  it("construye un payload valido con system top-level e historial en messages[]", () => {
    const character = getCharacter("science");
    const messages = [{ role: "user", content: "hola" }];
    const payload = buildPayload(character, messages);

    expect(payload.model).toBe("gemini-2.5-flash");
    expect(payload.system).toContain("Dr. Science");
    expect(payload.messages).toBe(messages);
    expect(isValidPayload(payload)).toBe(true);
  });

  // Este test evita un error comun: poner el system prompt como si fuera
  // un mensaje mas. En esta app, messages[] solo acepta user o assistant.
  it("rechaza un payload que pone role system dentro de messages[]", () => {
    const payload = {
      model: "gemini-2.5-flash",
      system: "Prompt correcto",
      messages: [{ role: "system", content: "Prompt incorrecto" }],
    };

    expect(isValidPayload(payload)).toBe(false);
  });
});
