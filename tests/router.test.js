import { describe, it, expect, vi } from "vitest";
import { cleanPath, router } from "../src/router.js";
import { isValidCharacterKey } from "../src/engine/payload.js";

describe("router.js — cleanPath y Manejo de 404", () => {
  it("elimina las barras inclinadas finales (trailing slashes)", () => {
    expect(cleanPath("/chat/science/")).toBe("/chat/science");
    expect(cleanPath("/about/")).toBe("/about");
    expect(cleanPath("/")).toBe("/");
  });

  it("normaliza cadenas nulas o vacías", () => {
    expect(cleanPath(null)).toBe("/");
    expect(cleanPath("")).toBe("/");
    expect(cleanPath("   ")).toBe("/");
  });

  it("valida correctamente personajes existentes e inexistentes", () => {
    expect(isValidCharacterKey("science")).toBe(true);
    expect(isValidCharacterKey("chef")).toBe(true);
    expect(isValidCharacterKey("detective")).toBe(true);
    expect(isValidCharacterKey("astro")).toBe(true);
    expect(isValidCharacterKey("algo")).toBe(false);
    expect(isValidCharacterKey("personaje_falso")).toBe(false);
  });
});
