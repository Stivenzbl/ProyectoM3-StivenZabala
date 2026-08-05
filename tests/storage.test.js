import { describe, it, expect, beforeEach } from "vitest";
import {
  saveHistory,
  loadHistory,
  clearStorageHistory,
  hasSavedHistory,
  createNewSession,
  getCharacterSessions,
  deleteSession,
  saveSessionMessages,
} from "../src/engine/storage.js";

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

describe("storage.js — Gestor Multisesión", () => {
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

  it("devuelve array vacío si no hay historial guardado", () => {
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

  it("crea múltiples sesiones independientes para un mismo personaje", () => {
    const session1 = createNewSession("astro");
    saveSessionMessages("astro", session1.id, [{ role: "user", content: "Viaje a Marte" }]);

    const session2 = createNewSession("astro");
    saveSessionMessages("astro", session2.id, [{ role: "user", content: "Fotos de Júpiter" }]);

    const sessions = getCharacterSessions("astro");
    expect(sessions).toHaveLength(2);
    expect(sessions[0].title).toBe("Fotos de Júpiter");
    expect(sessions[1].title).toBe("Viaje a Marte");
  });

  it("permite eliminar una sesión específica del historial", () => {
    const s1 = createNewSession("chef");
    saveSessionMessages("chef", s1.id, [{ role: "user", content: "Receta de Pastas" }]);
    const s2 = createNewSession("chef");
    saveSessionMessages("chef", s2.id, [{ role: "user", content: "Sopa de tomate" }]);

    deleteSession(s1.id, "chef");
    const charSessions = getCharacterSessions("chef");
    expect(charSessions).toHaveLength(1);
    expect(charSessions[0].id).toBe(s2.id);
  });
});
