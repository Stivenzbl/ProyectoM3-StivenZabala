import { describe, it, expect } from "vitest";
import {
  appendUserMessage,
  appendAssistantMessage,
  getTrimmedHistory,
  resetHistory,
} from "../src/engine/history.js";

describe("history.js", () => {
  // Este test verifica dos cosas:
  // 1. que se agrega el mensaje del usuario con el role correcto;
  // 2. que la funcion no modifica el array original.
  // Eso importa porque el historial del chat debe ser predecible.
  it("agrega un mensaje user sin mutar el array original", () => {
    const original = [];
    const next = appendUserMessage(original, "hola");

    expect(original).toEqual([]);
    expect(next).toEqual([{ role: "user", content: "hola" }]);
  });

  // Este test confirma que las respuestas de la IA se guardan con role
  // "assistant", que es el contrato interno del chat.
  it("agrega un mensaje assistant con role assistant", () => {
    const next = appendAssistantMessage([], "respuesta");

    expect(next).toEqual([{ role: "assistant", content: "respuesta" }]);
  });

  // Este test protege el recorte de historial.
  // El chat manda los mensajes mas recientes para controlar tokens y costo.
  it("recorta el historial con slice(-maxTurns)", () => {
    const messages = [
      { role: "user", content: "1" },
      { role: "assistant", content: "2" },
      { role: "user", content: "3" },
    ];

    expect(getTrimmedHistory(messages, 2)).toEqual(messages.slice(-2));
  });

  // Este test valida el caso de reinicio: cuando empieza una conversacion
  // nueva, el historial debe volver a estar vacio.
  it("resetHistory devuelve un array vacio", () => {
    expect(resetHistory()).toEqual([]);
  });
});
