/*
 * theme.js — Gestor de tema claro/oscuro (Extra Credit)
 *
 * Administra la preferencia de tema (Dark / Light) almacenada en localStorage,
 * aplica el atributo data-theme en el documento HTML y actualiza la UI.
 */

const THEME_KEY = "pim3_theme_preference";

export function getPreferredTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.warn("[Theme] No se pudo guardar preferencia:", e);
  }
  updateToggleIcon(theme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}

export function initTheme() {
  const theme = getPreferredTheme();
  setTheme(theme);
}

export function updateToggleIcon(theme) {
  const btn = document.querySelector("#theme-toggle-btn");
  if (btn) {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    btn.setAttribute("aria-label", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    btn.setAttribute("title", theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  }
}
