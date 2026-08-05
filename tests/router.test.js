import { describe, it, expect } from "vitest";
import { cleanPath } from "../src/router.js";

describe("router.js — cleanPath", () => {
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
});
