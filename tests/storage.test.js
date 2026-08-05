import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveHistory, loadHistory, clearStorageHistory, hasSavedHistory } from "../src/engine/storage.js";

// Mock de localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", { value: localStorageMock });

describe("storage.js", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("guarda y carga el historial correctamente desde localStorage", () => {
    const history = [
      { role: "user", content: "Hola Dr. Science" },
      { role: "assistant", content: "¡Hola! ¿Qué quieres investigar hoy?" },
    ];

    saveHistory("science", history);
    expect(hasSavedHistory("science")).toBe(true);

    const loaded = loadHistory("science");
    expect(loaded).toEqual(history);
  });

  it("devuelve array vacio si no hay historial guardado", () => {
    const loaded = loadHistory("chef");
    expect(loaded).toEqual([]);
    expect(hasSavedHistory("chef")).toBe(false);
  });

  it("elimina el historial al llamar clearStorageHistory", () => {
    saveHistory("detective", [{ role: "user", content: "Pista #1" }]);
    expect(hasSavedHistory("detective")).toBe(true);

    clearStorageHistory("detective");
    expect(hasSavedHistory("detective")).toBe(false);
    expect(loadHistory("detective")).toEqual([]);
  });
});
