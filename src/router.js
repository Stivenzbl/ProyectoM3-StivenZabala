import { renderHome } from "./views/home.js";
import { renderChat } from "./views/chat.js";
import { renderAbout } from "./views/about.js";
import { renderNotFound } from "./views/notFound.js";

/*
 * cleanPath(pathname)
 * Normaliza la URL removiendo barras inclinadas sobrantes (trailing slashes)
 * para evitar errores 404 al recargar o navegar a rutas como /chat/science/
 */
export function cleanPath(pathname) {
  if (!pathname || typeof pathname !== "string") return "/";
  let cleaned = pathname.trim();
  if (cleaned.length > 1 && cleaned.endsWith("/")) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned || "/";
}

const routes = [
  { pattern: /^\/(?:home)?$/i, render: (param) => renderHome() },
  { pattern: /^\/chat(?:\/([a-zA-Z0-9_-]+))?$/i, render: (param) => renderChat(param) },
  { pattern: /^\/about$/i, render: (param) => renderAbout() },
];

export function router() {
  const rawPath = window.location.pathname;
  const path = cleanPath(rawPath);

  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) {
      route.render(match[1] || null);
      updateActiveLink(path);
      return;
    }
  }

  renderNotFound();
  updateActiveLink(path);
}

export function navigateTo(targetPath) {
  const normalized = cleanPath(targetPath);
  if (window.location.pathname === normalized) return;
  history.pushState(null, "", normalized);
  router();
}

function updateActiveLink(currentPath) {
  const current = currentPath || cleanPath(window.location.pathname);
  document.querySelectorAll(".navbar__links a").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http")) return;
    const cleanHref = cleanPath(href);
    link.classList.toggle("active", cleanHref === current);
  });
}
